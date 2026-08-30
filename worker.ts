import { foodDetectionSchema } from "./functions/_ai/foodSchema";
import { foodDetectionPrompt } from "./functions/_ai/foodPrompt";

type Env = {
  HF_TOKEN: string;
  ASSETS: { fetch: (request: Request) => Promise<Response> };
};

const MODEL = "google/gemma-3-4b-it:featherless-ai";

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

        if (!image.startsWith("data:image/")) {
          return json(
            { success: false, error: "Formato de imagem inválido. Esperado data:image/...;base64,..." },
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
                content: [{ type: "image_url", image_url: { url: image } }],
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

        const data: any = await hfResp.json();

        if (!hfResp.ok) {
          return json(
            { success: false, error: "O Hugging Face recusou a solicitação.", details: data },
            { status: hfResp.status }
          );
        }

        const result = data?.choices?.[0]?.message?.content;
        if (!result) {
          return json(
            { success: false, error: "O Hugging Face não retornou uma resposta válida.", details: data },
            { status: 502 }
          );
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
