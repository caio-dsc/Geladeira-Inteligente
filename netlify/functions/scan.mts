import { GoogleGenAI } from "@google/genai";
import type { Config } from "@netlify/functions";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return Response.json(
      { error: "Método não permitido. Use POST." },
      { status: 405 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return Response.json(
      { error: "GEMINI_API_KEY não configurada." },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();

    const image = body?.image;

    if (!image || typeof image !== "string") {
      return Response.json(
        { error: "A propriedade 'image' é obrigatória." },
        { status: 400 }
      );
    }

    const match = image.match(
      /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/
    );

    if (!match) {
      return Response.json(
        {
          error:
            "Imagem inválida. Envie uma Data URL no formato data:image/...;base64,...",
        },
        { status: 400 }
      );
    }

    const mimeType = match[1];
    const base64Data = match[2];

    const ai = new GoogleGenAI({
      apiKey,
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        },
        {
          text: `
Analise a imagem enviada.

Responda em português.

Diga quais alimentos ou produtos alimentícios estão claramente visíveis na imagem.

Não invente alimentos que não possam ser identificados visualmente.
Não tente identificar datas de validade nesta etapa.

Retorne uma descrição curta dos alimentos encontrados.
          `,
        },
      ],
    });

    return Response.json({
      success: true,
      result: response.text,
    });
  } catch (error) {
    console.error("Erro no scanner Gemini:", error);

    return Response.json(
      {
        error: "Erro ao analisar a imagem com o Gemini.",
      },
      { status: 500 }
    );
  }
};

export const config: Config = {
  path: "/.netlify/functions/scan",
};
