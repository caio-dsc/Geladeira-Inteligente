import { foodDetectionSchema } from "../_ai/foodSchema";
import { foodDetectionPrompt } from "../_ai/foodPrompt";
import {
  validateFirebaseAuth,
  validateAppCheck,
  checkAndDeductCredit,
  checkRateLimit,
  configureFirestoreServiceAccount,
  FIREBASE_PROJECT_ID,
  SecurityError,
} from "../_ai/security";

const MODEL = "google/gemma-3-4b-it:fastest";

type Env = {
  HF_TOKEN: string;
  FIRESTORE_CLIENT_EMAIL?: string;
  FIRESTORE_PRIVATE_KEY?: string;
  ENFORCE_APP_CHECK?: string;
};

type EventContext<Env, P extends string, Data> = {
  request: Request;
  functionPath: string;
  waitUntil: (promise: Promise<unknown>) => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  env: Env;
  params: Record<P, string | string[]>;
  data: Data;
};

export type PagesFunction<
  Env = unknown,
  Params extends string = any,
  Data extends Record<string, unknown> = Record<string, unknown>
> = (context: EventContext<Env, Params, Data>) => Response | Promise<Response>;

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (env.FIRESTORE_CLIENT_EMAIL && env.FIRESTORE_PRIVATE_KEY) {
    configureFirestoreServiceAccount(
      env.FIRESTORE_CLIENT_EMAIL,
      env.FIRESTORE_PRIVATE_KEY
    );
  }

  // 1. Validação Criptográfica do Firebase Auth ID Token (Bearer)
  let user;
  try {
    user = await validateFirebaseAuth(request, FIREBASE_PROJECT_ID);
  } catch (authErr: any) {
    const secErr = authErr as SecurityError;
    return Response.json(
      { success: false, error: secErr.message || "Autenticação inválida.", code: secErr.code },
      { status: secErr.status || 401 }
    );
  }

  // 2. Validação do Firebase App Check Token
  try {
    const enforceAppCheck = env.ENFORCE_APP_CHECK === "true";
    await validateAppCheck(request, FIREBASE_PROJECT_ID, enforceAppCheck);
  } catch (appCheckErr: any) {
    const secErr = appCheckErr as SecurityError;
    return Response.json(
      { success: false, error: secErr.message || "App Check inválido.", code: secErr.code },
      { status: secErr.status || 403 }
    );
  }

  // 3. Proteção contra Abuso (Rate Limiting por UID)
  try {
    checkRateLimit(user.uid, 6, 60000);
  } catch (rateErr: any) {
    const secErr = rateErr as SecurityError;
    return Response.json(
      { success: false, error: secErr.message, code: secErr.code },
      {
        status: secErr.status || 429,
        headers: { "Retry-After": String(secErr.retryAfterSeconds || 60) },
      }
    );
  }

  // 4. Leitura do Payload e Suporte a Débito Direto de Crédito
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  // Caso especial: requisição de transação de débito direto
  if (body?.deductOnly === true) {
    let deduction;
    try {
      deduction = await checkAndDeductCredit(user.uid, 1, user.token);
    } catch (creditErr: any) {
      const secErr = creditErr as SecurityError;
      return Response.json(
        { success: false, error: secErr.message, code: secErr.code, remainingCredits: 0 },
        { status: secErr.status || 402 }
      );
    }

    return Response.json(
      {
        success: true,
        remainingCredits: deduction.remainingCredits,
      },
      { status: 200 }
    );
  }

  // Validação da imagem antes da transação para não debitar créditos em caso de payload corrompido
  const image = body?.image;
  if (!image || typeof image !== "string") {
    return Response.json({ success: false, error: "A propriedade 'image' é obrigatória." }, { status: 400 });
  }

  if (!image.startsWith("data:image/") && !image.startsWith("https://")) {
    return Response.json(
      { success: false, error: "Formato de imagem inválido. Esperado data:image/...;base64,... ou URL HTTPS." },
      { status: 400 }
    );
  }

  // 5. Verificação e Consumo Atômico de Créditos via Transação no Firestore
  // UID autenticado -> Firestore transaction -> credits > 0 ? -> credits = credits - 1
  let deduction;
  try {
    deduction = await checkAndDeductCredit(user.uid, 1, user.token);
  } catch (creditErr: any) {
    const secErr = creditErr as SecurityError;
    return Response.json(
      { success: false, error: secErr.message, code: secErr.code, remainingCredits: 0 },
      { status: secErr.status || 402 }
    );
  }

  // 6. Verificação da Chave de API de IA no Ambiente de Servidor (nunca exposta ao frontend)
  if (!env.HF_TOKEN) {
    return Response.json(
      { success: false, error: "HF_TOKEN não configurado no Cloudflare Pages (Variables and Secrets)." },
      { status: 500 }
    );
  }

  try {
    // 7. Chamada segura ao Hugging Face
    const hfResp = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.HF_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: foodDetectionPrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: image },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.1,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "FoodDetection",
            schema: foodDetectionSchema,
            strict: true,
          },
        },
      }),
    });

    const data = await hfResp.json();

    if (!hfResp.ok) {
      return Response.json(
        { success: false, error: "O Hugging Face recusou a solicitação.", details: data },
        { status: hfResp.status }
      );
    }

    const result = data?.choices?.[0]?.message?.content;
    if (!result) {
      return Response.json(
        { success: false, error: "O Hugging Face não retornou uma resposta válida.", details: data },
        { status: 502 }
      );
    }

    return Response.json(
      {
        success: true,
        result,
        model: MODEL,
        remainingCredits: deduction.remainingCredits,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    return Response.json(
      {
        success: false,
        error: "Erro ao analisar a imagem com o Hugging Face.",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
};
