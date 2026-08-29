import type { Config } from "@netlify/functions";
import { foodDetectionSchema } from "./foodSchema";
import { foodDetectionPrompt } from "./foodPrompt";

const MODEL = "google/gemma-3-4b-it:featherless-ai";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return Response.json(
      { error: "Método não permitido. Use POST." },
      { status: 405 }
    );
  }

  const token = process.env.HF_TOKEN;

  if (!token) {
    return Response.json(
      {
        error: "HF_TOKEN não configurado no Netlify.",
      },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const image = body?.image;

    if (!image || typeof image !== "string") {
      return Response.json(
        {
          error: "A propriedade 'image' é obrigatória.",
        },
        { status: 400 }
      );
    }

    if (!image.startsWith("data:image/")) {
      return Response.json(
        {
          error:
            "Formato de imagem inválido. Esperado data:image/...;base64,...",
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
              role: "user",

              content: [
                {
                  type: "text",
                  text: foodDetectionPrompt,
                },

                {
                  type: "image_url",
                  image_url: {
                    url: image,
                  },
                },
              ],
            },
          ],

          response_format: {
            type: "json_schema",
            json_schema: {
              name: "food_detection",
              schema: foodDetectionSchema,
              strict: true,
            },
          },

          max_tokens: 1000,
          temperature: 0.1,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "Erro retornado pelo Hugging Face:",
        data
      );

      return Response.json(
        {
          error: "O Hugging Face recusou a solicitação.",
          details: data,
        },
        { status: response.status }
      );
    }

    const result =
      data?.choices?.[0]?.message?.content;

    if (!result) {
      console.error(
        "Resposta inesperada do Hugging Face:",
        data
      );

      return Response.json(
        {
          error:
            "O Hugging Face não retornou uma resposta válida.",
          details: data,
        },
        { status: 502 }
      );
    }

    console.log(
      "Modelo utilizado:",
      MODEL
    );

    console.log(
      "Resposta do Hugging Face:",
      result
    );

    return Response.json({
      success: true,
      result,
      model: MODEL,
    });

  } catch (error) {
    console.error(
      "Erro no scanner Hugging Face:",
      error
    );

    return Response.json(
      {
        error:
          "Erro ao analisar a imagem com o Hugging Face.",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
};

export const config: Config = {
  path: "/.netlify/functions/scan",
};
