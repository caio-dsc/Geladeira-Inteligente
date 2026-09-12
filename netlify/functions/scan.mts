import type { Config } from "@netlify/functions";
import { foodDetectionSchema } from "./foodSchema";
import { foodDetectionPrompt } from "./foodPrompt";
import {
  validateFirebaseAuth,
  validateAppCheck,
  checkAndDeductCredit,
  checkRateLimit,
  FIREBASE_PROJECT_ID,
  SecurityError,
} from "../../functions/_ai/security";

const MODEL = "google/gemma-3-4b-it:featherless-ai";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return Response.json(
      { success: false, error: "Método não permitido. Use POST." },
      { status: 405 }
    );
  }

  // 1. Validação Criptográfica do Firebase Auth ID Token (Bearer)
  let user;
  try {
    user = await validateFirebaseAuth(req, FIREBASE_PROJECT_ID);
  } catch (authErr: any) {
    const secErr = authErr as SecurityError;
    return Response.json(
      { success: false, error: secErr.message || "Autenticação necessária.", code: secErr.code },
      { status: secErr.status || 401 }
    );
  }

  // 2. Validação do Firebase App Check Token
  try {
    const enforceAppCheck = process.env.ENFORCE_APP_CHECK === "true";
    await validateAppCheck(req, FIREBASE_PROJECT_ID, enforceAppCheck);
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

  // 4. Verificação e Consumo Atômico de Créditos (Prevenção de Race Conditions)
  let deduction;
  try {
    deduction = await checkAndDeductCredit(user.uid, 1);
  } catch (creditErr: any) {
    const secErr = creditErr as SecurityError;
    return Response.json(
      { success: false, error: secErr.message, code: secErr.code, remainingCredits: 0 },
      { status: secErr.status || 402 }
    );
  }

  const token = process.env.HF_TOKEN;
  if (!token) {
    return Response.json(
      { success: false, error: "HF_TOKEN não configurado no Netlify." },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const image = body?.image;

    if (!image || typeof image !== "string") {
      return Response.json(
        { success: false, error: "A propriedade 'image' é obrigatória." },
        { status: 400 }
      );
    }

    if (!image.startsWith("data:image/") && !image.startsWith("https://")) {
      return Response.json(
        {
          success: false,
          error: "Formato de imagem inválido. Esperado data:image/...;base64,... ou URL HTTPS.",
        },
        { status: 400 }
      );
    }

    const response = await fetch(
      "https://router.huggingface.co/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
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
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        {
          success: false,
          error: "O Hugging Face recusou a solicitação.",
          details: data,
        },
        { status: response.status }
      );
    }

    const result = data?.choices?.[0]?.message?.content;

    if (!result) {
      return Response.json(
        {
          success: false,
          error: "O Hugging Face não retornou uma resposta válida.",
          details: data,
        },
        { status: 502 }
      );
    }

    return Response.json({
      success: true,
      result,
      model: MODEL,
      remainingCredits: deduction.remainingCredits,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: "Erro interno no servidor ao processar a imagem.",
      },
      { status: 500 }
    );
  }
};

export const config: Config = {
  path: "/api/scan",
};
