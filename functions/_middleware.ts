type PagesFunction<
  Env = Record<string, any>,
  Params extends string = any,
  Data extends Record<string, unknown> = Record<string, unknown>
> = (context: {
  request: Request;
  functionPath: string;
  waitUntil: (promise: Promise<unknown>) => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  env: Env & { ASSETS: { fetch: (request: Request | string) => Promise<Response> } };
  params: Record<Params, string | string[]>;
  data: Data;
}) => Response | Promise<Response>;

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const path = url.pathname;

  // Não mexer em rotas de API
  if (path.startsWith("/api/")) return context.next();

  // Não mexer em arquivos reais (assets com extensão .js, .css, .png, etc.)
  if (path.includes(".")) return context.next();

  // Tenta servir o arquivo/rota normalmente
  const res = await context.next();

  // Se não achou (404), devolve o index.html (SPA fallback)
  if (res.status === 404) {
    url.pathname = "/index.html";
    return context.env.ASSETS.fetch(new Request(url.toString(), context.request));
  }

  return res;
};
