import { GoogleGenAI } from "@google/genai";
import type { Config } from "@netlify/functions";

export default async (req: Request) => {
  if (req.method !== "GET") {
    return Response.json(
      {
        error: "Método não permitido",
      },
      { status: 405 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return Response.json(
      {
        error: "GEMINI_API_KEY não configurada no Netlify.",
      },
      { status: 500 }
    );
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Responda apenas: Gemini conectado com sucesso.",
    });

    return Response.json({
      success: true,
      message: response.text,
    });
  } catch (error) {
    console.error("Erro ao chamar Gemini:", error);

    return Response.json(
      {
        error: "Erro ao comunicar com o Gemini.",
      },
      { status: 500 }
    );
  }
};

export const config: Config = {
  path: "/.netlify/functions/scan",
};
