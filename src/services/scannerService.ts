import { DetectedFoodItem } from '../types';
import { SAMPLE_FRIDGE_IMAGES } from '../data/mockData';
import { resolveFoodCategory } from '../utils/foodTaxonomy';
import { auth, appCheck } from './firebaseConfig';
import { getToken } from 'firebase/app-check';
import { authService } from './authService';

export class ScanServiceError extends Error {
  status?: number;
  retryAfterSeconds?: number;
  retriable?: boolean;
  code?: string;

  constructor(
    message: string,
    opts?: {
      status?: number;
      retryAfterSeconds?: number;
      retriable?: boolean;
      code?: string;
    }
  ) {
    super(message);
    this.name = 'ScanServiceError';
    this.status = opts?.status;
    this.retryAfterSeconds = opts?.retryAfterSeconds;
    this.retriable = opts?.retriable;
    this.code = opts?.code;
  }
}

export interface IScannerService {
  simulateScan(
    imageUrl: string,
    onProgress?: (msg: string) => void,
    forceError?: boolean
  ): Promise<DetectedFoodItem[]>;

  getSampleImages(): typeof SAMPLE_FRIDGE_IMAGES;
}

interface HuggingFaceScanResponse {
  success: boolean;
  result?: string;
  error?: string;
  code?: string;
  retryAfterSeconds?: number;
  details?: any;
}

interface StructuredFoodDetection {
  items: Array<{
    name: string;
    category?: DetectedFoodItem['category'] | string;
    quantity?: number;
    unit?: DetectedFoodItem['unit'] | string;
    state?: DetectedFoodItem['state'] | string;
    location?: DetectedFoodItem['location'] | null | string;
    confidence?: number;
    expiryDate?: string | null;
    expirySource?: 'image' | null;
  }>;
}

const ALLOWED_CATEGORIES: DetectedFoodItem['category'][] = [
  'vegetables',
  'fruits',
  'dairy',
  'proteins',
  'drinks',
  'pantry',
  'condiments',
  'bakery',
];

const NON_FOOD_KEYWORDS = [
  'objeto',
  'objetos',
  'cor',
  'cores',
  'colorido',
  'caracteristica',
  'característica',
  'cena',
  'cenario',
  'cenário',
  'fundo',
  'iluminacao',
  'iluminação',
  'luz',
  'sombra',
  'ambiente',
  'mesa',
  'mesas',
  'balcao',
  'balcão',
  'bancada',
  'chao',
  'chão',
  'piso',
  'parede',
  'teto',
  'prateleira',
  'prateleiras',
  'geladeira',
  'freezer',
  'congelador',
  'gaveta',
  'gavetas',
  'porta',
  'portas',
  'mao',
  'mão',
  'maos',
  'mãos',
  'dedo',
  'dedos',
  'braco',
  'braço',
  'humano',
  'pessoa',
  'pessoas',
  'embalagem',
  'embalagens',
  'pacote vazio',
  'pote',
  'potes',
  'recipiente',
  'recipientes',
  'frasco',
  'frascos',
  'garrafa vazia',
  'caixa vazia',
  'saco vazio',
  'plastico',
  'plástico',
  'vidro',
  'papelao',
  'papelão',
  'isopor',
  'metal',
  'aluminio',
  'alumínio',
  'prato',
  'pratos',
  'bandeja',
  'bandejas',
  'copo',
  'copos',
  'xicara',
  'xícara',
  'panela',
  'panelas',
  'frigideira',
  'talher',
  'talheres',
  'faca',
  'garfo',
  'colher',
  'tabua',
  'tábua',
  'escorredor',
  'lixeira',
  'pano',
  'guardanapo',
  'computador',
  'celular',
  'telefone',
  'notebook',
  'tablet',
  'medicamento',
  'medicamentos',
  'remedio',
  'remédio',
  'fogao',
  'fogão',
  'forno',
  'microondas',
  'micro-ondas',
  'liquidificador',
  'cafeteira',
  'saleiro',
  'pimenteiro',
  'utensilio',
  'utensílio',
  'utensilios',
  'utensílios',
  'etiqueta',
  'rotulo',
  'rótulo',
  'logo',
  'marca',
];

const GENERIC_FOOD_TERMS = [
  'alimento',
  'alimentos',
  'comida',
  'comidas',
  'produto',
  'produtos',
  'item',
  'itens',
  'fruta',
  'frutas',
  'legume',
  'legumes',
  'verdura',
  'verduras',
  'vegetal',
  'vegetais',
  'laticinio',
  'laticinios',
  'bebida',
  'bebidas',
  'mantimento',
  'mantimentos',
  'condimento',
  'condimentos',
  'proteina',
  'proteinas',
  'frios',
  'padaria',
  'mercearia',
  'hortifruti',
  'hortifrúti',
  'refeicao',
  'refeição',
  'mistura',
  'coisa',
  'coisas',
  'diversos',
  'varios',
  'vários',
  'sobremesa',
  'sobremesas',
  'snack',
  'snacks',
];

export function extractJsonFromText(rawText: string): string {
  if (!rawText) return '';

  let text = rawText.trim();

  const codeBlockMatch = text.match(
    /```(?:json)?\s*([\s\S]*?)\s*```/i
  );

  if (codeBlockMatch?.[1]) {
    text = codeBlockMatch[1].trim();
  }

  if (text.startsWith('{') && text.endsWith('}')) {
    return text;
  }

  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');

  if (
    firstBrace !== -1 &&
    lastBrace !== -1 &&
    lastBrace > firstBrace
  ) {
    return text.substring(firstBrace, lastBrace + 1).trim();
  }

  return text;
}

export function cleanFoodName(rawName: string): string {
  if (!rawName) return '';

  return rawName
    .replace(/^#+\s*/g, '')
    .replace(/[*_`~]/g, '')
    .replace(/^[-•*+]\s*/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeForComparison(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function isGenericFoodTerm(name: string): boolean {
  const normalized = normalizeForComparison(cleanFoodName(name));

  if (!normalized) {
    return true;
  }

  return GENERIC_FOOD_TERMS.some((generic) => {
    const normalizedGeneric = normalizeForComparison(generic);

    return (
      normalized === normalizedGeneric ||
      normalized === `${normalizedGeneric} diversos` ||
      normalized === `${normalizedGeneric} diversas` ||
      normalized === `varios ${normalizedGeneric}` ||
      normalized === `varias ${normalizedGeneric}` ||
      normalized === `itens de ${normalizedGeneric}` ||
      normalized === `tipos de ${normalizedGeneric}`
    );
  });
}

export function isClearlyNonFood(name: string): boolean {
  const normalized = normalizeForComparison(cleanFoodName(name));

  if (!normalized) {
    return true;
  }

  const containsNonFoodKeyword = NON_FOOD_KEYWORDS.some((blocked) => {
    const normalizedBlocked = normalizeForComparison(blocked);

    return (
      normalized === normalizedBlocked ||
      normalized.includes(normalizedBlocked)
    );
  });

  if (containsNonFoodKeyword) {
    return true;
  }

  return isGenericFoodTerm(normalized);
}

export function normalizeKey(s: string): string {
  return (s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function mergeDetectedItems(
  items: DetectedFoodItem[]
): DetectedFoodItem[] {
  const map = new Map<string, DetectedFoodItem>();

  for (const item of items) {
    const key = `${normalizeKey(item.name)}__${normalizeKey(item.unit)}`;

    const prev = map.get(key);

    if (!prev) {
      map.set(key, { ...item });
      continue;
    }

    const mergedQty =
      (prev.quantity || 1) + (item.quantity || 1);

    map.set(key, {
      ...prev,
      quantity: normalizeQty(mergedQty, prev.unit),
      confidence: Math.max(
        prev.confidence ?? 0,
        item.confidence ?? 0
      ),
      selected: prev.selected || item.selected,
    });
  }

  return Array.from(map.values());
}

export function normalizeQty(
  q: unknown,
  unit: string
): number {
  let n = typeof q === 'number' ? q : Number(q);

  if (!Number.isFinite(n) || n <= 0) {
    n = 1;
  }

  if (unit === 'un') {
    n = Math.round(n);
  }

  if (n < 1) {
    n = 1;
  }

  return n;
}

export function normalizeFreshness(
  state: any
): 'fresh' | 'frozen' {
  return state === 'frozen' ? 'frozen' : 'fresh';
}

/**
 * Converte qualquer fonte de imagem suportada pelo navegador
 * para JPEG Base64.
 *
 * Compatível com:
 * - iPhone Safari
 * - Chrome mobile
 * - Android
 * - desktop
 * - data:image/*
 * - blob:
 * - File
 * - Blob
 */
async function prepareImageForScan(
  source: string | Blob,
  maxWidth = 1280,
  initialQuality = 0.72
): Promise<string> {
  const MAX_BYTES = 850 * 1024;

  let blobUrl: string | null = null;

  try {
    let blob: Blob;

    /**
     * Caso 1:
     * já recebemos Blob/File.
     */
    if (source instanceof Blob) {
      blob = source;
    }

    /**
     * Caso 2:
     * data URL.
     */
    else if (source.startsWith('data:image/')) {
      const response = await fetch(source);
      blob = await response.blob();
    }

    /**
     * Caso 3:
     * blob URL.
     *
     * Muito importante para mobile.
     */
    else if (source.startsWith('blob:')) {
      const response = await fetch(source);

      if (!response.ok) {
        throw new Error(
          `Não foi possível ler a imagem temporária do dispositivo (${response.status}).`
        );
      }

      blob = await response.blob();
    }

    /**
     * Caso 4:
     * URL HTTPS.
     */
    else if (
      source.startsWith('http://') ||
      source.startsWith('https://')
    ) {
      const response = await fetch(source);

      if (!response.ok) {
        throw new Error(
          `Não foi possível baixar a imagem (${response.status}).`
        );
      }

      blob = await response.blob();
    }

    else {
      throw new Error(
        'Formato de imagem não suportado pelo navegador.'
      );
    }

    if (!blob.type.startsWith('image/')) {
      throw new Error(
        'O arquivo selecionado não é uma imagem válida.'
      );
    }

    /**
     * Cria URL temporária.
     */
    blobUrl = URL.createObjectURL(blob);

    /**
     * createImageBitmap é mais eficiente em muitos navegadores
     * modernos, especialmente em dispositivos móveis.
     *
     * Se não estiver disponível, usamos Image().
     */
    let bitmap: ImageBitmap | null = null;

    if ('createImageBitmap' in window) {
      try {
        bitmap = await createImageBitmap(blob);
      } catch {
        bitmap = null;
      }
    }

    let width = bitmap?.width || 0;
    let height = bitmap?.height || 0;

    if (!width || !height) {
      const img = await new Promise<HTMLImageElement>(
        (resolve, reject) => {
          const element = new Image();

          element.onload = () => resolve(element);

          element.onerror = () =>
            reject(
              new Error(
                'Não foi possível decodificar a foto no dispositivo.'
              )
            );

          element.src = blobUrl!;
        }
      );

      width = img.naturalWidth;
      height = img.naturalHeight;
    }

    if (!width || !height) {
      throw new Error(
        'A imagem não possui dimensões válidas.'
      );
    }

    /**
     * Redimensionamento proporcional.
     */
    const scale = Math.min(
      1,
      maxWidth / Math.max(width, height)
    );

    let targetWidth = Math.max(
      1,
      Math.round(width * scale)
    );

    let targetHeight = Math.max(
      1,
      Math.round(height * scale)
    );

    const canvas = document.createElement('canvas');

    const ctx = canvas.getContext('2d', {
      alpha: false,
      willReadFrequently: false,
    });

    if (!ctx) {
      throw new Error(
        'O navegador não conseguiu preparar a imagem.'
      );
    }

    /**
     * Renderiza a imagem.
     */
    const render = (
      quality: number
    ): string => {
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(
        0,
        0,
        targetWidth,
        targetHeight
      );

      if (bitmap) {
        ctx.drawImage(
          bitmap,
          0,
          0,
          targetWidth,
          targetHeight
        );
      } else {
        const img = new Image();

        /**
         * Esta situação ocorre apenas no fallback.
         * O blobUrl já foi validado acima.
         */
        img.src = blobUrl!;

        ctx.drawImage(
          img,
          0,
          0,
          targetWidth,
          targetHeight
        );
      }

      return canvas.toDataURL(
        'image/jpeg',
        quality
      );
    };

    const getBase64Bytes = (
      dataUrl: string
    ): number => {
      const comma = dataUrl.indexOf(',');

      if (comma === -1) {
        return 0;
      }

      const base64 =
        dataUrl.substring(comma + 1);

      const padding =
        base64.endsWith('==')
          ? 2
          : base64.endsWith('=')
            ? 1
            : 0;

      return Math.floor(
        (base64.length * 3) / 4
      ) - padding;
    };

    let quality = initialQuality;

    let compressed = render(quality);

    /**
     * Primeiro reduz qualidade.
     */
    while (
      getBase64Bytes(compressed) > MAX_BYTES &&
      quality > 0.40
    ) {
      quality = Math.max(
        0.40,
        quality - 0.06
      );

      compressed = render(quality);
    }

    /**
     * Depois reduz resolução.
     */
    while (
      getBase64Bytes(compressed) > MAX_BYTES &&
      targetWidth > 720
    ) {
      targetWidth = Math.max(
        720,
        Math.round(targetWidth * 0.82)
      );

      targetHeight = Math.max(
        1,
        Math.round(
          targetHeight * 0.82
        )
      );

      quality = 0.55;

      compressed = render(quality);

      while (
        getBase64Bytes(compressed) > MAX_BYTES &&
        quality > 0.40
      ) {
        quality = Math.max(
          0.40,
          quality - 0.05
        );

        compressed = render(quality);
      }
    }

    const finalBytes =
      getBase64Bytes(compressed);

    console.log(
      '[SCAN] Imagem preparada:',
      {
        bytes: finalBytes,
        kb: Math.round(
          finalBytes / 1024
        ),
        width: targetWidth,
        height: targetHeight,
        quality,
        originalType: blob.type,
        originalSize: blob.size,
      }
    );

    /**
     * Libera o ImageBitmap.
     */
    bitmap?.close();

    return compressed;
  } finally {
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }
  }
}

class HuggingFaceScannerService
  implements IScannerService {

  public getSampleImages() {
    return SAMPLE_FRIDGE_IMAGES;
  }

  public async simulateScan(
    imageUrl: string,
    onProgress?: (msg: string) => void,
    forceError = false
  ): Promise<DetectedFoodItem[]> {

    if (forceError) {
      throw new ScanServiceError(
        'Não foi possível identificar alimentos com clareza. Tente tirar a foto com melhor iluminação e com a porta da geladeira aberta.'
      );
    }

    if (!imageUrl) {
      throw new ScanServiceError(
        'Nenhuma imagem foi selecionada.'
      );
    }

    /**
     * Controle de acesso.
     */
    const userProfile =
      await authService.getCurrentUser();

    if (
      userProfile &&
      userProfile.scanEnabled === false
    ) {
      throw new ScanServiceError(
        'Acesso ao Scan com IA bloqueado para esta conta.',
        {
          status: 403,
          retriable: false,
          code: 'SCAN_DISABLED',
        }
      );
    }

    /**
     * Imagens de demonstração.
     */
    const sample =
      SAMPLE_FRIDGE_IMAGES.find(
        (s) => s.url === imageUrl
      );

    if (
      sample &&
      sample.mockDetections &&
      sample.mockDetections.length > 0
    ) {
      onProgress?.(
        'Carregando alimentos da foto de teste...'
      );

      await new Promise((r) =>
        setTimeout(r, 500)
      );

      onProgress?.(
        'Processando itens detectados...'
      );

      return sample.mockDetections.map(
        (item) => ({ ...item })
      );
    }

    /**
     * Firebase Authentication.
     */
    const currentUser =
      auth.currentUser;

    let idToken: string | null = null;

    if (currentUser) {
      try {
        idToken =
          await currentUser.getIdToken();
      } catch (error) {
        console.warn(
          '[SCAN] Não foi possível obter ID Token:',
          error
        );
      }
    }

    /**
     * Firebase App Check.
     */
    let appCheckToken: string | null = null;

    if (appCheck) {
      try {
        const appCheckResult =
          await getToken(
            appCheck,
            false
          );

        appCheckToken =
          appCheckResult.token;
      } catch (error) {
        console.warn(
          '[SCAN] App Check indisponível:',
          error
        );
      }
    }

    onProgress?.(
      'Preparando imagem para análise...'
    );

    /**
     * PREPARAÇÃO MOBILE
     */
    let optimizedImage: string;

    try {
      optimizedImage =
        await prepareImageForScan(
          imageUrl,
          1280,
          0.72
        );
    } catch (error: any) {
      console.error(
        '[SCAN] Falha ao preparar imagem:',
        error
      );

      throw new ScanServiceError(
        error?.message ||
          'Não foi possível preparar a imagem no dispositivo.',
        {
          status: 400,
          retriable: false,
          code: 'IMAGE_PREPARATION_FAILED',
        }
      );
    }

    console.log(
      '[SCAN] Payload:',
      Math.round(
        optimizedImage.length / 1024
      ),
      'KB base64'
    );

    onProgress?.(
      'Enviando imagem para análise...'
    );

    /**
     * Headers.
     */
    const headers: Record<
      string,
      string
    > = {
      'Content-Type':
        'application/json',
      'Accept':
        'application/json',
    };

    if (idToken) {
      headers['Authorization'] =
        `Bearer ${idToken}`;
    }

    if (appCheckToken) {
      headers[
        'X-Firebase-AppCheck'
      ] = appCheckToken;
    }

    /**
     * Timeout de segurança.
     *
     * Evita que Safari fique indefinidamente
     * esperando uma conexão problemática.
     */
    const controller =
      new AbortController();

    const timeout =
      window.setTimeout(
        () => controller.abort(),
        90000
      );

    let response: Response;

    try {
      response = await fetch(
        '/api/scan',
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            image: optimizedImage,
          }),
          signal:
            controller.signal,
          cache: 'no-store',
        }
      );
    } catch (error: any) {
      if (
        error?.name ===
        'AbortError'
      ) {
        throw new ScanServiceError(
          'A análise demorou demais para responder. Verifique sua conexão e tente novamente.',
          {
            status: 408,
            retriable: true,
            code: 'SCAN_TIMEOUT',
          }
        );
      }

      console.error(
        '[SCAN] Erro de rede:',
        error
      );

      throw new ScanServiceError(
        'Não foi possível conectar ao servidor de análise. Verifique sua conexão com a internet e tente novamente.',
        {
          status: 0,
          retriable: true,
          code: 'NETWORK_ERROR',
        }
      );
    } finally {
      window.clearTimeout(timeout);
    }

    onProgress?.(
      'Analisando alimentos com IA...'
    );

    const raw =
      await response.text();

    let data:
      HuggingFaceScanResponse;

    try {
      data = JSON.parse(raw);
    } catch {
      console.error(
        '[SCAN] Resposta não JSON:',
        {
          status:
            response.status,
          body:
            raw.substring(
              0,
              1000
            ),
        }
      );

      throw new ScanServiceError(
        `Falha no Scan (HTTP ${response.status}). A API não retornou JSON.`,
        {
          status:
            response.status,
          retriable:
            response.status >= 500,
          code:
            'INVALID_API_RESPONSE',
        }
      );
    }

    const isBusy =
      response.status === 503 ||
      response.status === 429 ||
      (
        typeof data?.error ===
          'string' &&
        (
          data.error
            .toLowerCase()
            .includes('ocupado') ||
          data.error
            .toLowerCase()
            .includes('busy') ||
          data.error
            .toLowerCase()
            .includes(
              'overloaded'
            ) ||
          data.error
            .toLowerCase()
            .includes(
              'loading'
            )
        )
      );

    if (
      !response.ok ||
      !data.success
    ) {
      const retryAfterHeader =
        response.headers.get(
          'Retry-After'
        );

      const retryAfterSeconds =
        retryAfterHeader
          ? Number(
              retryAfterHeader
            )
          : data?.retryAfterSeconds;

      if (
        response.status === 403 ||
        data?.code ===
          'SCAN_NOT_ENABLED'
      ) {
        throw new ScanServiceError(
          data?.error ||
            'O reconhecimento por imagem não está habilitado para esta conta.',
          {
            status: 403,
            retriable: false,
            code:
              'SCAN_NOT_ENABLED',
          }
        );
      }

      if (
        response.status === 401
      ) {
        throw new ScanServiceError(
          data?.error ||
            'Você precisa estar conectado à sua conta para escanear alimentos.',
          {
            status: 401,
            retriable: false,
            code:
              'AUTH_REQUIRED',
          }
        );
      }

      if (
        response.status === 503 ||
        isBusy
      ) {
        throw new ScanServiceError(
          data?.error ||
            'Servidor da IA está ocupado no momento. Tente novamente.',
          {
            status: 503,
            retryAfterSeconds,
            retriable: true,
            code:
              data?.code,
          }
        );
      }

      throw new ScanServiceError(
        data?.error ||
          'Não foi possível analisar a imagem.',
        {
          status:
            response.status,
          retryAfterSeconds,
          retriable:
            response.status ===
            429,
          code:
            data?.code,
        }
      );
    }

    if (!data.result) {
      throw new ScanServiceError(
        'A IA não retornou nenhum resultado.',
        {
          status: 500,
          retriable: false,
          code:
            'EMPTY_AI_RESULT',
        }
      );
    }

    onProgress?.(
      'Processando alimentos identificados...'
    );

    return this.parseStructuredResult(
      data.result
    );
  }

  private parseStructuredResult(
    result: string
  ): DetectedFoodItem[] {

    let parsed:
      StructuredFoodDetection;

    try {
      const cleanedJson =
        extractJsonFromText(
          result
        );

      parsed =
        JSON.parse(
          cleanedJson
        );

      console.log(
        'RESULTADO APÓS PARSE:',
        parsed
      );
    } catch (error) {
      console.error(
        'JSON inválido retornado pela IA:',
        result,
        error
      );

      throw new ScanServiceError(
        'A IA retornou uma resposta inválida. Tente tirar a foto novamente.',
        {
          status: 502,
          retriable: true,
          code:
            'INVALID_AI_RESULT',
        }
      );
    }

    if (
      !parsed ||
      !Array.isArray(
        parsed.items
      )
    ) {
      throw new ScanServiceError(
        'A IA não retornou uma lista válida de alimentos.',
        {
          status: 502,
          retriable: true,
          code:
            'INVALID_AI_ITEMS',
        }
      );
    }

    const individualValidItems:
      Array<{
        name: string;
        category:
          DetectedFoodItem['category'];
        quantity: number;
        unit:
          DetectedFoodItem['unit'];
        state:
          DetectedFoodItem['state'];
        location:
          DetectedFoodItem['location'];
        confidence: number;
        expiryDate?: string;
      }> = [];

    for (
      const item of parsed.items
    ) {
      if (
        !this.isValidFoodItem(
          item
        )
      ) {
        console.warn(
          'Item rejeitado:',
          item
        );
        continue;
      }

      const cleanedName =
        cleanFoodName(
          item.name
        );

      if (
        isClearlyNonFood(
          cleanedName
        )
      ) {
        console.warn(
          'Item não alimentício rejeitado:',
          cleanedName
        );

        continue;
      }

      const finalUnit =
        (
          item.unit as
            DetectedFoodItem['unit']
        ) || 'un';

      const finalQuantity =
        normalizeQty(
          item.quantity,
          finalUnit
        );

      const finalConfidence =
        typeof item.confidence ===
          'number' &&
        Number.isFinite(
          item.confidence
        ) &&
        item.confidence >= 0 &&
        item.confidence <= 1
          ? item.confidence
          : 0.9;

      const finalState =
        normalizeFreshness(
          item.state
        );

      const finalLocation =
        (
          item.location as
            DetectedFoodItem['location']
        ) ?? null;

      const resolvedCategory =
        resolveFoodCategory(
          cleanedName,
          item.category as
            DetectedFoodItem['category']
        );

      const finalCategory =
        (
          ALLOWED_CATEGORIES.includes(
            resolvedCategory as any
          )
            ? resolvedCategory
            : item.category
        ) as DetectedFoodItem['category'];

      individualValidItems.push({
        name:
          cleanedName,
        category:
          finalCategory,
        quantity:
          finalQuantity,
        unit:
          finalUnit,
        state:
          finalState,
        location:
          finalLocation,
        confidence:
          finalConfidence,
        expiryDate:
          item.expiryDate ||
          undefined,
      });
    }

    const initialItems:
      DetectedFoodItem[] =
        individualValidItems.map(
          (item) => ({
            id:
              `det_${Date.now()}_${Math.random()
                .toString(36)
                .substring(2, 7)}`,

            name:
              item.name,

            category:
              item.category,

            quantity:
              normalizeQty(
                item.quantity,
                item.unit
              ),

            unit:
              item.unit,

            state:
              item.state,

            location:
              item.location,

            confidence:
              item.confidence,

            expiryDate:
              item.expiryDate,

            selected:
              true,
          })
        );

    const validItems =
      mergeDetectedItems(
        initialItems
      );

    console.log(
      'RESULTADO APÓS FILTRO:',
      validItems
    );

    return validItems;
  }

  private isValidFoodItem(
    item: any
  ): boolean {

    if (
      !item ||
      typeof item !==
        'object'
    ) {
      return false;
    }

    if (
      typeof item.name !==
        'string' ||
      !item.name.trim()
    ) {
      return false;
    }

    const category =
      typeof item.category === 'string'
        ? ((item.category.toLowerCase().trim()) as DetectedFoodItem['category'])
        : undefined;

    if (
      !category ||
      category ===
        'other' ||
      !ALLOWED_CATEGORIES.includes(
        category
      )
    ) {
      return false;
    }

    return true;
  }
}

export const scannerService =
  new HuggingFaceScannerService();
