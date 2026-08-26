import type { Config } from "@netlify/functions";

export default async (req: Request) => {
  if (req.method !== "POST") {
    return Response.json(
      { error: "Método não permitido" },
      { status: 405 }
    );
  }

  return Response.json({
    success: true,
    message: "Scanner Function funcionando!",
  });
};

export const config: Config = {
  path: "/.netlify/functions/scan",
};
