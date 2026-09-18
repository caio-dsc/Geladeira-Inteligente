import { foodDetectionSchema } from "./functions/_ai/foodSchema";
import { foodDetectionPrompt } from "./functions/_ai/foodPrompt";
import {
  validateFirebaseAuth,
  validateAppCheck,
  checkRateLimit,
  FIREBASE_PROJECT_ID,
  buscarUsuario,
  SecurityError,
} from "./functions/_ai/security";

type Env = {
  HF_TOKEN: string;
  ENFORCE_APP_CHECK?: string;
  ASSETS: {
    fetch: (request: Request) => Promise<Response>;
  };
};

const MODEL = "google/gemma-3-4b-it:fastest";

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...(init.headers || {}),
    },
  });
}

function isBusyError(data: any) {
  const msg = data?.error?.message || "";
  return typeof msg === "string" && msg.toLowerCase().includes("model is busy");
}

async function callHfWithRetry(env: any, payload: any, maxAttempts = 4) {
  let last: { status: number; data: any; headers: Headers } | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const resp = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await resp.json().catch(() => ({}));
    last = { status: resp.status, data, headers: resp.headers };

    // Sucesso
    if (resp.ok) return last;

    // Se estiver ocupado, tenta novamente com backoff
    const retryable =
      resp.status === 429 || resp.status === 503 || isBusyError(data);

    if (!retryable || attempt === maxAttempts) return last;

    // Backoff exponencial + jitter (0–250ms)
    const base = 600; // ms
    const delay = Math.min(4000, base * 2 ** (attempt - 1)) + Math.floor(Math.random() * 250);

    // Cloudflare Workers: espera sem travar CPU
    // @ts-ignore
    if (typeof scheduler !== "undefined" && scheduler.wait) {
      // @ts-ignore
      await scheduler.wait(delay);
    } else {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return last!;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // --- API /api/scan ---
    if (url.pathname === "/api/scan") {
      if (request.method !== "POST") {
        return json(
          { success: false, error: "Method not allowed. Use POST." },
          { status: 405 }
        );
      }

      // ======================================================================
      // FLUXO DE EXECUÇÃO:
      // Request -> Firebase Auth -> App Check -> Rate Limit ->
      // Verificar acesso ao Scan -> Hugging Face -> Resultado
      // ======================================================================

      // 1. Firebase Auth: Validação Criptográfica do Firebase Auth ID Token (Bearer)
      let user;
      try {
        user = await validateFirebaseAuth(request, FIREBASE_PROJECT_ID);
      } catch (authErr: any) {
        const secErr = authErr as SecurityError;
        return json(
          { success: false, error: secErr.message || "Autenticação necessária.", code: secErr.code },
          { status: secErr.status || 401 }
        );
      }

      // 2. App Check: Validação de Integridade do App
      try {
        const enforceAppCheck = env.ENFORCE_APP_CHECK === "true";
        await validateAppCheck(request, FIREBASE_PROJECT_ID, enforceAppCheck);
      } catch (appCheckErr: any) {
        const secErr = appCheckErr as SecurityError;
        return json(
          { success: false, error: secErr.message || "App Check inválido.", code: secErr.code },
          { status: secErr.status || 403 }
        );
      }

      // 3. Rate Limit: Proteção contra Abuso (Rate Limiting por UID - 6 req/min)
      try {
        checkRateLimit(user.uid, 6, 60000);
      } catch (rateErr: any) {
        const secErr = rateErr as SecurityError;
        return json(
          { success: false, error: secErr.message, code: secErr.code },
          {
            status: secErr.status || 429,
            headers: { "Retry-After": String(secErr.retryAfterSeconds || 60) },
          }
        );
      }

      // 4. Verificar acesso ao Scan no Firestore (users/{uid})
      const userDoc = await buscarUsuario(user.uid, user.token);

      if (!userDoc.exists) {
        return json(
          {
            success: false,
            error: "O reconhecimento por imagem não está habilitado para esta conta.",
            code: "SCAN_NOT_ENABLED",
          },
          { status: 403 }
        );
      }

      const userData = userDoc.data();

      if (userData.scanEnabled !== true) {
        return json(
          {
            success: false,
            error: "O reconhecimento por imagem não está habilitado para esta conta.",
            code: "SCAN_NOT_ENABLED",
          },
          { status: 403 }
        );
      }

      // 5. Validação do Payload
      let body: any = {};
      try {
        body = await request.json();
      } catch {
        body = {};
      }

      const image = body?.image;
      if (!image || typeof image !== "string") {
        return json({ success: false, error: "A propriedade 'image' é obrigatória." }, { status: 400 });
      }

      const isDataUrl = image.startsWith("data:image/");
      let isHttpsUrl = false;

      try {
        const u = new URL(image);
        isHttpsUrl = u.protocol === "https:";
      } catch {
        isHttpsUrl = false;
      }

      if (!isDataUrl && !isHttpsUrl) {
        return json(
          { success: false, error: "Formato de imagem inválido. Use data:image/...;base64,... ou uma URL https pública." },
          { status: 400 }
        );
      }

      // 5. Hugging Face: Processamento de IA com retry resiliente
      if (!env.HF_TOKEN) {
        return json(
          { success: false, error: "HF_TOKEN não configurado no Worker." },
          { status: 500 }
        );
      }

      try {

        const payload = {
          model: MODEL,

          messages: [
            {
              role: "system",
              content: foodDetectionPrompt,
            },

            {
              role: "user",

              content: [
                {
                  type: "image_url",

                  image_url: {
                    url: image,
                  },
                },

                {
                  type: "text",

                  text: `
Analise esta imagem seguindo rigorosamente as regras do sistema.

IMPORTANTE:

- Identifique somente alimentos realmente visíveis.
- Não invente alimentos.
- Não transforme objetos ou partes da cozinha em alimentos.
- Prefira nomes específicos de alimentos.
- Não use nomes genéricos quando for possível identificar o alimento.
- Não invente marcas ou variedades.
- Não invente quantidades.
- Examine toda a imagem antes de responder.
- Agrupe alimentos iguais quando apropriado usando quantity.
- Retorne somente o JSON compatível com o schema.

Precisão é mais importante do que quantidade de resultados.
          `.trim(),
                },
              ],
            },
          ],

          max_tokens: 1000,

          temperature: 0,

          response_format: {
            type: "json_schema",

            json_schema: {
              name: "FoodDetection",

              schema: foodDetectionSchema,

              strict: true,
            },
          },
        };

        const hf = await callHfWithRetry(env, payload, 4);

        if (!hf || hf.status < 200 || hf.status >= 300) {
          const busy = isBusyError(hf?.data);
          if (busy) {
            const retryAfterSeconds = 3;
            return json(
              {
                success: false,
                error: "Servidor da IA está ocupado no momento. Tente novamente em alguns segundos.",
                retryAfterSeconds,
                details: hf?.data,
              },
              {
                status: 503,
                headers: { "Retry-After": String(retryAfterSeconds) },
              }
            );
          }

          return json(
            {
              success: false,
              error: "O Hugging Face recusou a solicitação.",
              details: hf?.data,
            },
            { status: hf?.status || 502 }
          );
        }

        const result = hf.data?.choices?.[0]?.message?.content;
        if (!result) {
          return json({ success: false, error: "Resposta inválida do Hugging Face.", details: hf.data }, { status: 502 });
        }

        return json(
          {
            success: true,
            result,
            model: MODEL,
          },
          { status: 200 }
        );
      } catch (err) {
        return json(
          { success: false, error: "Erro ao analisar a imagem.", details: err instanceof Error ? err.message : String(err) },
          { status: 500 }
        );
      }
    }

    // --- SPA fallback / Assets ---
    return env.ASSETS.fetch(request);
  },
};
