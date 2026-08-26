import type { Config } from "@netlify/functions";

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
                  text: `
Você é o sistema de visão de um aplicativo chamado
Geladeira Inteligente.

Analise cuidadosamente a imagem da geladeira.

Identifique os alimentos e produtos alimentícios que estejam
claramente visíveis.

Para cada item identificado, informe:
- nome do alimento;
- quantidade aproximada, se puder estimar;
- unidade, se puder identificar;
- nível de confiança entre 0 e 1.

REGRAS IMPORTANTES:

1. Não invente alimentos.
2. Só identifique alimentos que estejam realmente visíveis.
3. Se não conseguir determinar a quantidade, use null.
4. Não invente datas de validade.
5. Não invente marcas.
6. Se um alimento estiver parcialmente escondido, só identifique
   se houver evidência visual suficiente.
7. Responda em português.
8. Seja objetivo.

Retorne somente uma lista dos alimentos encontrados.
                  `,
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
