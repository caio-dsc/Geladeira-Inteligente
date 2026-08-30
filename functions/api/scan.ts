import { foodDetectionSchema } from "../_ai/foodSchema";
import { foodDetectionPrompt } from "../_ai/foodPrompt";

const MODEL = "google/gemma-3-4b-it:fastest";

type Env = {
  HF_TOKEN: string;
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

  if (!env.HF_TOKEN) {
    return Response.json(
      { error: "HF_TOKEN não configurado no Cloudflare Pages (Variables and Secrets)." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const image = body?.image;

    if (!image || typeof image !== "string") {
      return Response.json({ error: "A propriedade 'image' é obrigatória." }, { status: 400 });
    }

    if (!image.startsWith("data:image/")) {
      return Response.json(
        { error: "Formato de imagem inválido. Esperado data:image/...;base64,..." },
        { status: 400 }
      );
    }

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
        { error: "O Hugging Face recusou a solicitação.", details: data },
        { status: hfResp.status }
      );
    }

    const result = data?.choices?.[0]?.message?.content;
    if (!result) {
      return Response.json(
        { error: "O Hugging Face não retornou uma resposta válida.", details: data },
        { status: 502 }
      );
    }

    return Response.json(
      { success: true, result, model: MODEL },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err) {
    return Response.json(
      {
        error: "Erro ao analisar a imagem com o Hugging Face.",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
};
