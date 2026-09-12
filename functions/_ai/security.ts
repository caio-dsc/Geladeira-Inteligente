/**
 * Módulo de Segurança e Autorização do Backend (/api/scan)
 *
 * Responsável por:
 *
 * 1. Validação criptográfica do Firebase Auth ID Token
 * 2. Validação básica do Firebase App Check
 * 3. Débito atômico de créditos no Cloud Firestore
 *    usando Service Account + Google OAuth 2.0
 * 4. Rate limiting por UID
 * 5. Sanitização de erros e não exposição de segredos
 *
 * IMPORTANTE:
 *
 * O Worker NÃO usa o Firebase ID Token do usuário para escrever
 * créditos no Firestore.
 *
 * O fluxo é:
 *
 * Browser
 *   ↓
 * Firebase ID Token
 *   ↓
 * Worker valida o token
 *   ↓
 * Worker identifica UID
 *   ↓
 * Worker autentica no Google usando Service Account
 *   ↓
 * Firestore REST API
 *   ↓
 * users/{uid}.credits
 *
 * Isso evita depender das Firestore Security Rules para a operação
 * administrativa de débito de créditos.
 */

export const FIREBASE_PROJECT_ID = "ai-studio-applet-webapp-1a826";

export const FIRESTORE_DATABASE_ID =
  "ai-studio-geladeiraintelig-ebd28962-2ea8-42ef-98cc-767ea5f182c5";

const GOOGLE_OAUTH_TOKEN_URL =
  "https://oauth2.googleapis.com/token";

const FIRESTORE_SCOPE =
  "https://www.googleapis.com/auth/datastore";

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

type ServiceAccountConfig = {
  clientEmail: string;
  privateKey: string;
};

type GoogleAccessTokenCache = {
  accessToken: string;
  expiresAt: number;
};

let googleJwksCache: {
  keys: any[];
  expiresAt: number;
} | null = null;

let googleAccessTokenCache: GoogleAccessTokenCache | null = null;

const testCreditsStore = new Map<string, number>();

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

function base64UrlEncodeString(value: string): string {
  return base64UrlEncodeBytes(
    new TextEncoder().encode(value)
  );
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
    throw new Error(
      "Token JWT malformado."
    );
  }

  const [
    rawHeader,
    rawPayload,
    rawSignature,
  ] = parts;

  let header: any;
  let payload: any;

  try {
    header = JSON.parse(
      new TextDecoder().decode(
        base64UrlDecode(rawHeader)
      )
    );

    payload = JSON.parse(
      new TextDecoder().decode(
        base64UrlDecode(rawPayload)
      )
    );
  } catch {
    throw new Error(
      "Falha ao decodificar JWT."
    );
  }

  return {
    header,
    payload,
    signatureBytes: base64UrlDecode(rawSignature),
    signedData: new TextEncoder().encode(
      `${rawHeader}.${rawPayload}`
    ),
  };
}

// ============================================================================
// GOOGLE JWKS
// ============================================================================

async function getGooglePublicJwks(): Promise<any[]> {
  const now = Date.now();

  if (
    googleJwksCache &&
    googleJwksCache.expiresAt > now
  ) {
    return googleJwksCache.keys;
  }

  try {
    const response = await fetch(
      GOOGLE_JWKS_URL
    );

    if (!response.ok) {
      throw new Error(
        `Google JWKS respondeu HTTP ${response.status}`
      );
    }

    const data = (await response.json()) as {
      keys?: any[];
    };

    const cacheControl =
      response.headers.get("cache-control") || "";

    const match =
      cacheControl.match(/max-age=(\d+)/);

    const ttlSeconds = match
      ? Number(match[1])
      : 3600;

    googleJwksCache = {
      keys: data.keys || [],
      expiresAt:
        now + ttlSeconds * 1000,
    };

    return googleJwksCache.keys;
  } catch (error) {
    if (
      googleJwksCache &&
      googleJwksCache.keys.length > 0
    ) {
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
      message:
        "Autenticação obrigatória.",
      code: "AUTH_TOKEN_MISSING",
    };

    throw err;
  }

  const parts =
    authHeader.trim().split(/\s+/);

  if (
    parts.length !== 2 ||
    parts[0].toLowerCase() !== "bearer"
  ) {
    const err: SecurityError = {
      status: 401,
      message:
        "Formato de autorização inválido.",
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
      message:
        "Token de autenticação inválido.",
      code: "AUTH_TOKEN_INVALID",
    };

    throw err;
  }

  const {
    header,
    payload,
    signatureBytes,
    signedData,
  } = parsed;

  // --------------------------------------------------------------------------
  // Algoritmo
  // --------------------------------------------------------------------------

  if (header.alg !== "RS256") {
    const err: SecurityError = {
      status: 401,
      message:
        "Algoritmo de assinatura não suportado.",
      code: "AUTH_TOKEN_UNSUPPORTED_ALG",
    };

    throw err;
  }

  // --------------------------------------------------------------------------
  // Expiração
  // --------------------------------------------------------------------------

  const now = Math.floor(
    Date.now() / 1000
  );

  if (
    !payload.exp ||
    typeof payload.exp !== "number" ||
    payload.exp < now
  ) {
    const err: SecurityError = {
      status: 401,
      message:
        "Sessão expirada. Faça login novamente.",
      code: "AUTH_TOKEN_EXPIRED",
    };

    throw err;
  }

  // --------------------------------------------------------------------------
  // IAT / clock skew
  // --------------------------------------------------------------------------

  if (
    payload.iat &&
    typeof payload.iat === "number" &&
    payload.iat > now + 300
  ) {
    const err: SecurityError = {
      status: 401,
      message:
        "Token com data de emissão inválida.",
      code: "AUTH_TOKEN_FUTURE_IAT",
    };

    throw err;
  }

  // --------------------------------------------------------------------------
  // ISSUER
  // --------------------------------------------------------------------------

  const expectedIssuer =
    `https://securetoken.google.com/${expectedProjectId}`;

  if (
    payload.iss !== expectedIssuer
  ) {
    const err: SecurityError = {
      status: 401,
      message:
        "Emissor do token inválido.",
      code: "AUTH_TOKEN_INVALID_ISSUER",
    };

    throw err;
  }

  // --------------------------------------------------------------------------
  // AUDIENCE
  // --------------------------------------------------------------------------

  if (
    payload.aud !== expectedProjectId
  ) {
    const err: SecurityError = {
      status: 401,
      message:
        "Audiência do token incompatível com o projeto Firebase.",
      code: "AUTH_TOKEN_INVALID_AUDIENCE",
    };

    throw err;
  }

  // --------------------------------------------------------------------------
  // UID
  // --------------------------------------------------------------------------

  const uid =
    payload.sub ||
    payload.user_id;

  if (
    !uid ||
    typeof uid !== "string" ||
    uid.trim().length === 0
  ) {
    const err: SecurityError = {
      status: 401,
      message:
        "UID do usuário ausente no token.",
      code: "AUTH_TOKEN_MISSING_UID",
    };

    throw err;
  }

  // --------------------------------------------------------------------------
  // Assinatura
  // --------------------------------------------------------------------------

  try {
    const keys =
      await getGooglePublicJwks();

    const matchingKey =
      keys.find(
        (key) =>
          key.kid === header.kid
      );

    if (!matchingKey) {
      const err: SecurityError = {
        status: 401,
        message:
          "Chave pública do token não encontrada.",
        code: "AUTH_KEY_NOT_FOUND",
      };

      throw err;
    }

    const cryptoKey =
      await crypto.subtle.importKey(
        "jwk",
        matchingKey,
        {
          name: "RSASSA-PKCS1-v1_5",
          hash: "SHA-256",
        },
        false,
        ["verify"]
      );

    const valid =
      await crypto.subtle.verify(
        "RSASSA-PKCS1-v1_5",
        cryptoKey,
        signatureBytes,
        signedData
      );

    if (!valid) {
      const err: SecurityError = {
        status: 401,
        message:
          "Assinatura do token inválida.",
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
      message:
        "Falha na verificação do token.",
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
    request.headers.get(
      "X-Firebase-AppCheck"
    ) ||
    request.headers.get(
      "x-firebase-appcheck"
    );

  if (!token) {
    if (enforce) {
      const err: SecurityError = {
        status: 403,
        message:
          "Requisição sem Firebase App Check.",
        code: "APP_CHECK_MISSING",
      };

      throw err;
    }

    return {
      valid: false,
    };
  }

  try {
    const { payload } =
      parseJwt(token);

    const now = Math.floor(
      Date.now() / 1000
    );

    if (
      payload.exp &&
      typeof payload.exp === "number" &&
      payload.exp < now
    ) {
      const err: SecurityError = {
        status: 403,
        message:
          "Token do Firebase App Check expirado.",
        code: "APP_CHECK_EXPIRED",
      };

      throw err;
    }

    return {
      valid: true,
      appId:
        payload.sub ||
        payload.app_id,
    };
  } catch {
    if (enforce) {
      const err: SecurityError = {
        status: 403,
        message:
          "Token do Firebase App Check inválido.",
        code: "APP_CHECK_INVALID",
      };

      throw err;
    }

    return {
      valid: false,
    };
  }
}

// ============================================================================
// SERVICE ACCOUNT
// ============================================================================

let firestoreServiceAccount: ServiceAccountConfig | null = null;

export function configureFirestoreServiceAccount(
  clientEmail: string,
  privateKey: string
): void {
  firestoreServiceAccount = {
    clientEmail,
    privateKey,
  };
}

function getServiceAccountConfig(): ServiceAccountConfig {
  if (!firestoreServiceAccount) {
    throw new Error(
      "Service Account do Firestore não foi configurada."
    );
  }

  return firestoreServiceAccount;
}

/**
 * Converte a chave privada PEM em CryptoKey.
 */
async function importPrivateKey(
  pem: string
): Promise<CryptoKey> {
  const normalized = pem
    .replace(/\\n/g, "\n")
    .trim();

  const base64 = normalized
    .replace(
      /-----BEGIN PRIVATE KEY-----/g,
      ""
    )
    .replace(
      /-----END PRIVATE KEY-----/g,
      ""
    )
    .replace(/\s/g, "");

  const binary = atob(base64);

  const bytes = new Uint8Array(
    binary.length
  );

  for (
    let i = 0;
    i < binary.length;
    i++
  ) {
    bytes[i] =
      binary.charCodeAt(i);
  }

  return crypto.subtle.importKey(
    "pkcs8",
    bytes.buffer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );
}

/**
 * Cria um JWT de Service Account para obter
 * um access token OAuth 2.0 do Google.
 */
async function createServiceAccountJwt(
  config: ServiceAccountConfig
): Promise<string> {
  const now =
    Math.floor(Date.now() / 1000);

  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const payload = {
    iss: config.clientEmail,
    scope: FIRESTORE_SCOPE,
    aud: GOOGLE_OAUTH_TOKEN_URL,
    iat: now,
    exp: now + 3600,
  };

  const encodedHeader =
    base64UrlEncodeString(
      JSON.stringify(header)
    );

  const encodedPayload =
    base64UrlEncodeString(
      JSON.stringify(payload)
    );

  const unsignedToken =
    `${encodedHeader}.${encodedPayload}`;

  const key =
    await importPrivateKey(
      config.privateKey
    );

  const signature =
    await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      key,
      new TextEncoder().encode(
        unsignedToken
      )
    );

  return (
    `${unsignedToken}.${base64UrlEncodeBytes(
      new Uint8Array(signature)
    )}`
  );
}

/**
 * Obtém um Google OAuth 2.0 access token
 * para a Service Account.
 */
async function getFirestoreAccessToken(): Promise<string> {
  const now = Date.now();

  // Mantém cache por segurança e performance.
  // Renova 2 minutos antes de expirar.
  if (
    googleAccessTokenCache &&
    googleAccessTokenCache.expiresAt >
      now + 120_000
  ) {
    return googleAccessTokenCache.accessToken;
  }

  const config =
    getServiceAccountConfig();

  const assertion =
    await createServiceAccountJwt(
      config
    );

  const body =
    new URLSearchParams();

  body.set(
    "grant_type",
    "urn:ietf:params:oauth:grant-type:jwt-bearer"
  );

  body.set(
    "assertion",
    assertion
  );

  const response =
    await fetch(
      GOOGLE_OAUTH_TOKEN_URL,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      }
    );

  const data: any =
    await response
      .json()
      .catch(() => ({}));

  if (!response.ok) {
    console.error(
      "Google OAuth token error:",
      response.status
    );

    throw new Error(
      "Não foi possível autenticar o Worker no Google."
    );
  }

  if (
    !data.access_token
  ) {
    throw new Error(
      "Google não retornou access_token."
    );
  }

  const expiresIn =
    Number(data.expires_in) || 3600;

  googleAccessTokenCache = {
    accessToken:
      data.access_token,
    expiresAt:
      now + expiresIn * 1000,
  };

  return data.access_token;
}

// ============================================================================
// FIRESTORE REST
// ============================================================================

function getFirestoreBaseUrl(): string {
  return (
    `https://firestore.googleapis.com/v1/projects/` +
    `${FIREBASE_PROJECT_ID}/databases/` +
    `${encodeURIComponent(FIRESTORE_DATABASE_ID)}` +
    `/documents`
  );
}

function firestoreHeaders(
  accessToken: string
): HeadersInit {
  return {
    Authorization:
      `Bearer ${accessToken}`,
    "Content-Type":
      "application/json",
  };
}

// ============================================================================
// CRÉDITOS
// ============================================================================

/**
 * Débito atômico de créditos.
 *
 * Agora a transação é autenticada com:
 *
 * Service Account
 *     ↓
 * Google OAuth 2.0
 *     ↓
 * Firestore IAM
 *
 * O Firebase ID Token continua sendo usado somente
 * para identificar e autenticar o usuário.
 */
export async function checkAndDeductCredit(
  uid: string,
  amount: number = 1,
  _authToken?: string
): Promise<{
  remainingCredits: number;
}> {
  if (
    !uid ||
    typeof uid !== "string" ||
    uid.trim().length === 0
  ) {
    const err: SecurityError = {
      status: 401,
      message:
        "UID do usuário é obrigatório.",
      code: "AUTH_UID_REQUIRED",
    };

    throw err;
  }

  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !Number.isInteger(amount)
  ) {
    const err: SecurityError = {
      status: 400,
      message:
        "Quantidade de créditos inválida.",
      code: "INVALID_CREDIT_AMOUNT",
    };

    throw err;
  }

  // --------------------------------------------------------------------------
  // TESTES LOCAIS
  // --------------------------------------------------------------------------

  if (uid.startsWith("test-")) {
    const current =
      testCreditsStore.has(uid)
        ? testCreditsStore.get(uid)!
        : 5;

    if (
      current < amount ||
      current <= 0
    ) {
      const err: SecurityError = {
        status: 402,
        message:
          "Créditos insuficientes para realizar a análise.",
        code: "INSUFFICIENT_CREDITS",
      };

      throw err;
    }

    const remaining =
      current - amount;

    testCreditsStore.set(
      uid,
      remaining
    );

    return {
      remainingCredits: remaining,
    };
  }

  // --------------------------------------------------------------------------
  // TOKEN DE SERVIÇO
  // --------------------------------------------------------------------------

  let accessToken: string;

  try {
    accessToken =
      await getFirestoreAccessToken();
  } catch (error) {
    console.error(
      "Falha na autenticação do Worker com Firestore:",
      error
    );

    const err: SecurityError = {
      status: 500,
      message:
        "Não foi possível conectar ao serviço de créditos.",
      code: "FIRESTORE_SERVICE_AUTH_FAILED",
    };

    throw err;
  }

  const baseUrl =
    getFirestoreBaseUrl();

  const userDocumentUrl =
    `${baseUrl}/users/${encodeURIComponent(uid)}`;

  // --------------------------------------------------------------------------
  // INICIA TRANSAÇÃO
  // --------------------------------------------------------------------------

  const beginResponse =
    await fetch(
      `${baseUrl}:beginTransaction`,
      {
        method: "POST",
        headers:
          firestoreHeaders(
            accessToken
          ),
        body: JSON.stringify({
          options: {
            readWrite: {},
          },
        }),
      }
    );

  const beginData: any =
    await beginResponse
      .json()
      .catch(() => ({}));

  if (!beginResponse.ok) {
    console.error(
      "Firestore beginTransaction:",
      beginResponse.status
    );

    const err: SecurityError = {
      status:
        beginResponse.status === 403
          ? 500
          : 502,
      message:
        "Não foi possível iniciar a operação de créditos.",
      code:
        "FIRESTORE_TRANSACTION_BEGIN_FAILED",
    };

    throw err;
  }

  const transactionId =
    beginData?.transaction;

  if (!transactionId) {
    const err: SecurityError = {
      status: 502,
      message:
        "O Firestore não retornou um identificador de transação.",
      code:
        "FIRESTORE_TRANSACTION_ID_MISSING",
    };

    throw err;
  }

  // --------------------------------------------------------------------------
  // LEITURA TRANSACIONAL
  // --------------------------------------------------------------------------

  const getResponse =
    await fetch(
      `${userDocumentUrl}?transaction=${encodeURIComponent(
        transactionId
      )}`,
      {
        method: "GET",
        headers:
          firestoreHeaders(
            accessToken
          ),
      }
    );

  let currentCredits = 5;

  if (getResponse.ok) {
    const userDocument: any =
      await getResponse.json();

    const creditsField =
      userDocument?.fields?.credits;

    if (creditsField) {
      if (
        creditsField.integerValue !==
        undefined
      ) {
        currentCredits =
          Number(
            creditsField.integerValue
          );
      } else if (
        creditsField.doubleValue !==
        undefined
      ) {
        currentCredits =
          Number(
            creditsField.doubleValue
          );
      }
    }

    if (
      !Number.isFinite(
        currentCredits
      )
    ) {
      currentCredits = 0;
    }
  } else if (
    getResponse.status === 404
  ) {
    // Usuário ainda não possui documento.
    // Crédito inicial padrão.
    currentCredits = 5;
  } else {
    await rollbackFirestoreTransaction(
      accessToken,
      baseUrl,
      transactionId
    );

    const err: SecurityError = {
      status: 502,
      message:
        "Não foi possível consultar os créditos do usuário.",
      code:
        "FIRESTORE_TRANSACTION_READ_FAILED",
    };

    throw err;
  }

  // --------------------------------------------------------------------------
  // VERIFICA CRÉDITOS
  // --------------------------------------------------------------------------

  if (
    currentCredits < amount ||
    currentCredits <= 0
  ) {
    await rollbackFirestoreTransaction(
      accessToken,
      baseUrl,
      transactionId
    );

    const err: SecurityError = {
      status: 402,
      message:
        "Créditos insuficientes para realizar a análise.",
      code: "INSUFFICIENT_CREDITS",
    };

    throw err;
  }

  const remainingCredits =
    currentCredits - amount;

  // --------------------------------------------------------------------------
  // COMMIT
  // --------------------------------------------------------------------------

  const nowIso =
    new Date().toISOString();

  const commitResponse =
    await fetch(
      `${baseUrl}:commit`,
      {
        method: "POST",
        headers:
          firestoreHeaders(
            accessToken
          ),
        body: JSON.stringify({
          transaction:
            transactionId,

          writes: [
            {
              updateMask: {
                fieldPaths: [
                  "credits",
                  "updatedAt",
                ],
              },

              update: {
                name:
                  `projects/${FIREBASE_PROJECT_ID}` +
                  `/databases/${FIRESTORE_DATABASE_ID}` +
                  `/documents/users/${uid}`,

                fields: {
                  credits: {
                    integerValue:
                      String(
                        remainingCredits
                      ),
                  },

                  updatedAt: {
                    stringValue:
                      nowIso,
                  },
                },
              },
            },
          ],
        }),
      }
    );

  const commitData: any =
    await commitResponse
      .json()
      .catch(() => ({}));

  if (!commitResponse.ok) {
    console.error(
      "Firestore commit:",
      commitResponse.status
    );

    const err: SecurityError = {
      status: 502,
      message:
        "Não foi possível concluir o débito de créditos.",
      code:
        "FIRESTORE_COMMIT_FAILED",
    };

    throw err;
  }

  return {
    remainingCredits,
  };
}

// ============================================================================
// ROLLBACK
// ============================================================================

async function rollbackFirestoreTransaction(
  accessToken: string,
  baseUrl: string,
  transactionId: string
): Promise<void> {
  try {
    await fetch(
      `${baseUrl}:rollback`,
      {
        method: "POST",
        headers:
          firestoreHeaders(
            accessToken
          ),
        body: JSON.stringify({
          transaction:
            transactionId,
        }),
      }
    );
  } catch {
    // Não substituímos o erro original.
  }
}

// ============================================================================
// TEST HELPERS
// ============================================================================

export function setTestUserCredits(
  uid: string,
  credits: number
): void {
  testCreditsStore.set(
    uid,
    credits
  );
}

export function getUserCredits(
  uid: string
): number {
  return (
    testCreditsStore.get(uid) ??
    5
  );
}

// ============================================================================
// RATE LIMITING
// ============================================================================

export function checkRateLimit(
  key: string,
  maxRequests: number = 6,
  windowMs: number = 60000
): void {
  if (
    !key ||
    typeof key !== "string"
  ) {
    throw {
      status: 400,
      message:
        "Chave de rate limit inválida.",
      code:
        "RATE_LIMIT_INVALID_KEY",
    } satisfies SecurityError;
  }

  const now =
    Date.now();

  const entry =
    rateLimitStore.get(key) || {
      timestamps: [],
    };

  entry.timestamps =
    entry.timestamps.filter(
      (timestamp) =>
        now - timestamp <
        windowMs
    );

  if (
    entry.timestamps.length >=
    maxRequests
  ) {
    const oldest =
      entry.timestamps[0];

    const retryAfterSeconds =
      Math.max(
        1,
        Math.ceil(
          (
            oldest +
            windowMs -
            now
          ) / 1000
        )
      );

    const err: SecurityError = {
      status: 429,
      message:
        `Limite de solicitações atingido (${maxRequests} scans/min).`,
      code:
        "RATE_LIMIT_EXCEEDED",
      retryAfterSeconds,
    };

    throw err;
  }

  entry.timestamps.push(now);

  rateLimitStore.set(
    key,
    entry
  );
}
