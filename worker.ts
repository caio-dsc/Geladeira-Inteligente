import { foodDetectionSchema } from "./functions/_ai/foodSchema";
import { foodDetectionPrompt } from "./functions/_ai/foodPrompt";

type Env = {
  HF_TOKEN: string;
  ASSETS: { fetch: (request: Request) => Promise<Response> };
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

    // --- API ---
    if (url.pathname === "/api/scan") {
      if (request.method !== "POST") {
        return json(
          { success: false, error: "Method not allowed. Use POST." },
          { status: 405 }
        );
      }

      if (!env.HF_TOKEN) {
        return json(
          { success: false, error: "HF_TOKEN não configurado no Worker." },
          { status: 500 }
        );
      }

      try {
        const body: any = await request.json();
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

        const payload = {
          model: MODEL,
          messages: [
            { role: "system", content: foodDetectionPrompt },
            { role: "user", content: [{ type: "image_url", image_url: { url: image } }] },
          ],
          max_tokens: 800,
          temperature: 0.1,
          response_format: {
            type: "json_schema",
            json_schema: { name: "FoodDetection", schema: foodDetectionSchema, strict: true },
          },
        };

        const hf = await callHfWithRetry(env, payload, 4);

        if (!hf || hf.status < 200 || hf.status >= 300) {
          const busy = isBusyError(hf?.data);
          if (busy) {
            const retryAfterSeconds = 3; // ajuste como quiser (2–5 costuma ser bom)
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

        return json({ success: true, result, model: MODEL }, { status: 200 });
      } catch (err) {
        return json(
          { success: false, error: "Erro ao analisar a imagem.", details: err instanceof Error ? err.message : String(err) },
          { status: 500 }
        );
      }
    }

    // --- SPA fallback / Assets ---
    // deixa o Cloudflare servir os arquivos do Vite (dist)
    return env.ASSETS.fetch(request);
  },
};
