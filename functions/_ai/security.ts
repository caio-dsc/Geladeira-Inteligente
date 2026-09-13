/**
 * Módulo de Segurança e Autorização do Backend (/api/scan)
 *
 * Responsável por:
 * 1. Validação criptográfica do Firebase Auth ID Token (RS256 via Google JWKS)
 * 2. Validação básica do Firebase App Check
 * 3. Rate limiting por UID (máximo 6 req/min)
 * 4. Sanitização de erros e não exposição de segredos
 *
 * IMPORTANTE:
 * O security.ts não acessa o Firestore para transação ou débito de créditos.
 */

export const FIREBASE_PROJECT_ID = "ai-studio-applet-webapp-1a826";

export const FIRESTORE_DATABASE_ID =
  "ai-studio-geladeiraintelig-ebd28962-2ea8-42ef-98cc-767ea5f182c5";

const GOOGLE_JWKS_URL =
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  name?: string;
  token?: string;
}

export interface SecurityError {
  status: number;
  message: string;
  code?: string;
  retryAfterSeconds?: number;
}

let googleJwksCache: {
  keys: any[];
  expiresAt: number;
} | null = null;

const rateLimitStore = new Map<
  string,
  {
    timestamps: number[];
  }
>();

// ============================================================================
// BASE64URL
// ============================================================================

function base64UrlEncodeBytes(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(
      i,
      Math.min(i + chunkSize, bytes.length)
    );
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  while (base64.length % 4) {
    base64 += "=";
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

// ============================================================================
// JWT PARSER
// ============================================================================

function parseJwt(token: string): {
  header: any;
  payload: any;
  signatureBytes: Uint8Array;
  signedData: Uint8Array;
} {
  const parts = token.split(".");

  if (parts.length !== 3) {
    throw new Error("Token JWT malformado.");
  }

  const [rawHeader, rawPayload, rawSignature] = parts;

  let header: any;
  let payload: any;

  try {
    header = JSON.parse(
      new TextDecoder().decode(base64UrlDecode(rawHeader))
    );

    payload = JSON.parse(
      new TextDecoder().decode(base64UrlDecode(rawPayload))
    );
  } catch {
    throw new Error("Falha ao decodificar JWT.");
  }

  return {
    header,
    payload,
    signatureBytes: base64UrlDecode(rawSignature),
    signedData: new TextEncoder().encode(`${rawHeader}.${rawPayload}`),
  };
}

// ============================================================================
// GOOGLE JWKS
// ============================================================================

async function getGooglePublicJwks(): Promise<any[]> {
  const now = Date.now();

  if (googleJwksCache && googleJwksCache.expiresAt > now) {
    return googleJwksCache.keys;
  }

  try {
    const response = await fetch(GOOGLE_JWKS_URL);

    if (!response.ok) {
      throw new Error(`Google JWKS respondeu HTTP ${response.status}`);
    }

    const data = (await response.json()) as {
      keys?: any[];
    };

    const cacheControl = response.headers.get("cache-control") || "";
    const match = cacheControl.match(/max-age=(\d+)/);
    const ttlSeconds = match ? Number(match[1]) : 3600;

    googleJwksCache = {
      keys: data.keys || [],
      expiresAt: now + ttlSeconds * 1000,
    };

    return googleJwksCache.keys;
  } catch (error) {
    if (googleJwksCache && googleJwksCache.keys.length > 0) {
      return googleJwksCache.keys;
    }
    throw error;
  }
}

// ============================================================================
// FIREBASE AUTH ID TOKEN
// ============================================================================

export async function validateFirebaseAuth(
  request: Request,
  expectedProjectId: string = FIREBASE_PROJECT_ID
): Promise<AuthenticatedUser> {
  const authHeader =
    request.headers.get("Authorization") ||
    request.headers.get("authorization");

  if (!authHeader) {
    const err: SecurityError = {
      status: 401,
      message: "Autenticação obrigatória.",
      code: "AUTH_TOKEN_MISSING",
    };
    throw err;
  }

  const parts = authHeader.trim().split(/\s+/);

  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
    const err: SecurityError = {
      status: 401,
      message: "Formato de autorização inválido.",
      code: "AUTH_TOKEN_MALFORMED",
    };
    throw err;
  }

  const idToken = parts[1];

  let parsed: ReturnType<typeof parseJwt>;
  try {
    parsed = parseJwt(idToken);
  } catch {
    const err: SecurityError = {
      status: 401,
      message: "Token de autenticação inválido.",
      code: "AUTH_TOKEN_INVALID",
    };
    throw err;
  }

  const { header, payload, signatureBytes, signedData } = parsed;

  // 1. Algoritmo
  if (header.alg !== "RS256") {
    const err: SecurityError = {
      status: 401,
      message: "Algoritmo de assinatura não suportado.",
      code: "AUTH_TOKEN_UNSUPPORTED_ALG",
    };
    throw err;
  }

  // 2. Expiração
  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || typeof payload.exp !== "number" || payload.exp < now) {
    const err: SecurityError = {
      status: 401,
      message: "Sessão expirada. Faça login novamente.",
      code: "AUTH_TOKEN_EXPIRED",
    };
    throw err;
  }

  // 3. IAT / clock skew
  if (
    payload.iat &&
    typeof payload.iat === "number" &&
    payload.iat > now + 300
  ) {
    const err: SecurityError = {
      status: 401,
      message: "Token com data de emissão inválida.",
      code: "AUTH_TOKEN_FUTURE_IAT",
    };
    throw err;
  }

  // 4. Emissor
  const expectedIssuer = `https://securetoken.google.com/${expectedProjectId}`;
  if (payload.iss !== expectedIssuer) {
    const err: SecurityError = {
      status: 401,
      message: "Emissor do token inválido.",
      code: "AUTH_TOKEN_INVALID_ISSUER",
    };
    throw err;
  }

  // 5. Audiência
  if (payload.aud !== expectedProjectId) {
    const err: SecurityError = {
      status: 401,
      message: "Audiência do token incompatível com o projeto Firebase.",
      code: "AUTH_TOKEN_INVALID_AUDIENCE",
    };
    throw err;
  }

  // 6. UID
  const uid = payload.sub || payload.user_id;
  if (!uid || typeof uid !== "string" || uid.trim().length === 0) {
    const err: SecurityError = {
      status: 401,
      message: "UID do usuário ausente no token.",
      code: "AUTH_TOKEN_MISSING_UID",
    };
    throw err;
  }

  // 7. Assinatura com chave pública do Google JWKS
  try {
    const keys = await getGooglePublicJwks();
    const matchingKey = keys.find((key) => key.kid === header.kid);

    if (!matchingKey) {
      const err: SecurityError = {
        status: 401,
        message: "Chave pública do token não encontrada.",
        code: "AUTH_KEY_NOT_FOUND",
      };
      throw err;
    }

    const cryptoKey = await crypto.subtle.importKey(
      "jwk",
      matchingKey,
      {
        name: "RSASSA-PKCS1-v1_5",
        hash: "SHA-256",
      },
      false,
      ["verify"]
    );

    const valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      cryptoKey,
      signatureBytes,
      signedData
    );

    if (!valid) {
      const err: SecurityError = {
        status: 401,
        message: "Assinatura do token inválida.",
        code: "AUTH_SIGNATURE_INVALID",
      };
      throw err;
    }
  } catch (error: any) {
    if (error?.status) {
      throw error;
    }
    const err: SecurityError = {
      status: 401,
      message: "Falha na verificação do token.",
      code: "AUTH_VERIFICATION_FAILED",
    };
    throw err;
  }

  return {
    uid,
    email: payload.email,
    name: payload.name,
    token: idToken,
  };
}

// ============================================================================
// FIREBASE APP CHECK
// ============================================================================

export async function validateAppCheck(
  request: Request,
  _expectedProjectId: string = FIREBASE_PROJECT_ID,
  enforce: boolean = false
): Promise<{
  valid: boolean;
  appId?: string;
}> {
  const token =
    request.headers.get("X-Firebase-AppCheck") ||
    request.headers.get("x-firebase-appcheck");

  if (!token) {
    if (enforce) {
      const err: SecurityError = {
        status: 403,
        message: "Requisição sem Firebase App Check.",
        code: "APP_CHECK_MISSING",
      };
      throw err;
    }
    return { valid: false };
  }

  try {
    const { payload } = parseJwt(token);
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && typeof payload.exp === "number" && payload.exp < now) {
      const err: SecurityError = {
        status: 403,
        message: "Token do Firebase App Check expirado.",
        code: "APP_CHECK_EXPIRED",
      };
      throw err;
    }

    return {
      valid: true,
      appId: payload.sub || payload.app_id,
    };
  } catch {
    if (enforce) {
      const err: SecurityError = {
        status: 403,
        message: "Token do Firebase App Check inválido.",
        code: "APP_CHECK_INVALID",
      };
      throw err;
    }
    return { valid: false };
  }
}

// ============================================================================
// RATE LIMITING
// ============================================================================

export function checkRateLimit(
  key: string,
  maxRequests: number = 6,
  windowMs: number = 60000
): void {
  if (!key || typeof key !== "string" || key.trim().length === 0) {
    throw {
      status: 400,
      message: "Chave de rate limit inválida.",
      code: "RATE_LIMIT_INVALID_KEY",
    } satisfies SecurityError;
  }

  const now = Date.now();
  const entry = rateLimitStore.get(key) || {
    timestamps: [],
  };

  entry.timestamps = entry.timestamps.filter(
    (timestamp) => now - timestamp < windowMs
  );

  if (entry.timestamps.length >= maxRequests) {
    const oldest = entry.timestamps[0];
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldest + windowMs - now) / 1000)
    );

    const err: SecurityError = {
      status: 429,
      message: `Limite de solicitações atingido (${maxRequests} scans/min).`,
      code: "RATE_LIMIT_EXCEEDED",
      retryAfterSeconds,
    };

    throw err;
  }

  entry.timestamps.push(now);
  rateLimitStore.set(key, entry);
}

// ============================================================================
// CONSULTA DE USUÁRIO NO FIRESTORE (FASE 4 - scanEnabled)
// ============================================================================

export function parseFirestoreFields(fields: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  if (!fields || typeof fields !== "object") return result;

  for (const [key, value] of Object.entries<any>(fields)) {
    if (value.booleanValue !== undefined) {
      result[key] = value.booleanValue;
    } else if (value.stringValue !== undefined) {
      result[key] = value.stringValue;
    } else if (value.integerValue !== undefined) {
      result[key] = parseInt(value.integerValue, 10);
    } else if (value.doubleValue !== undefined) {
      result[key] = parseFloat(value.doubleValue);
    } else if (value.nullValue !== undefined) {
      result[key] = null;
    } else if (value.timestampValue !== undefined) {
      result[key] = value.timestampValue;
    } else if (value.mapValue !== undefined) {
      result[key] = parseFirestoreFields(value.mapValue.fields || {});
    } else if (value.arrayValue !== undefined) {
      result[key] = (value.arrayValue.values || []).map((v: any) => {
        if (v.stringValue !== undefined) return v.stringValue;
        if (v.booleanValue !== undefined) return v.booleanValue;
        if (v.integerValue !== undefined) return parseInt(v.integerValue, 10);
        return v;
      });
    } else {
      result[key] = value;
    }
  }
  return result;
}

export async function buscarUsuario(
  uid: string,
  token?: string
): Promise<{ exists: boolean; data: () => Record<string, any> }> {
  if (!uid || typeof uid !== "string") {
    return { exists: false, data: () => ({}) };
  }

  // Tenta pelo banco customizado e fallback para (default)
  const databases = [FIRESTORE_DATABASE_ID, "(default)"];

  for (const dbId of databases) {
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/${dbId}/documents/users/${encodeURIComponent(uid)}`;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const resp = await fetch(url, {
        method: "GET",
        headers,
      });

      if (resp.status === 404) {
        continue;
      }

      if (resp.ok) {
        const docJson = (await resp.json()) as any;
        if (docJson && docJson.fields) {
          const parsedData = parseFirestoreFields(docJson.fields);
          return {
            exists: true,
            data: () => parsedData,
          };
        }
      }
    } catch (fetchErr) {
      console.warn(`[buscarUsuario] Erro ao consultar banco ${dbId}:`, fetchErr);
    }
  }

  return { exists: false, data: () => ({}) };
}
