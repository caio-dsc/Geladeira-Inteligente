import { DetectedFoodItem } from '../types';
import { SAMPLE_FRIDGE_IMAGES } from '../data/mockData';

export class ScanServiceError extends Error {
  status?: number;
  retryAfterSeconds?: number;
  retriable?: boolean;

  constructor(message: string, opts?: { status?: number; retryAfterSeconds?: number; retriable?: boolean }) {
    super(message);
    this.name = "ScanServiceError";
    this.status = opts?.status;
    this.retryAfterSeconds = opts?.retryAfterSeconds;
    this.retriable = opts?.retriable;
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

/*
 * Categorias permitidas para alimentos reais.
 * Categoria 'other' é expressamente rejeitada conforme Regra 2.
 */
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

/*
 * Lista de termos e palavras-chave não alimentícias para rejeição estrita (Regra 3).
 * Se o nome contiver qualquer um desses termos, será sumariamente bloqueado.
 */
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

/*
 * Lista de termos genéricos que não especificam um alimento real e devem ser removidos.
 */
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

/**
 * Extrai JSON válido do retorno da IA (suporta JSON puro, markdown code blocks e texto adjacente).
 */
export function extractJsonFromText(rawText: string): string {
  if (!rawText) return '';
  let text = rawText.trim();

  // 1. Se estiver envolto em markdown code fence (```json ... ``` ou ``` ... ```)
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    text = codeBlockMatch[1].trim();
  }

  // 2. Se já for um objeto JSON válido { ... }
  if (text.startsWith('{') && text.endsWith('}')) {
    return text;
  }

  // 3. Tenta localizar os limites externos { e }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.substring(firstBrace, lastBrace + 1).trim();
  }

  return text;
}

/**
 * Remove formatação Markdown, prefixos de lista e espaços extras (Regras 4, 5, 6).
 */
export function cleanFoodName(rawName: string): string {
  if (!rawName) return '';
  return rawName
    .replace(/^#+\s*/g, '') // Remove headers markdown (### Alimento)
    .replace(/[*_`~]/g, '') // Remove negrito, itálico, código markdown
    .replace(/^[-•*+]\s*/, '') // Remove marcadores de lista
    .replace(/\s+/g, ' ') // Remove múltiplos espaços internos
    .trim();
}

/**
 * Normaliza o texto removendo acentos para comparação estrita de bloqueio.
 */
function normalizeForComparison(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Verifica se o nome corresponde a um termo alimentar genérico demais (ex: "alimentos", "frutas", "itens").
 */
export function isGenericFoodTerm(name: string): boolean {
  const normalized = normalizeForComparison(cleanFoodName(name));
  if (!normalized) {
    return true;
  }

  // Verifica se é exatamente um termo genérico ou se é uma frase genérica (ex: "frutas diversas", "varios alimentos")
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

/**
 * Verifica se o nome corresponde a um objeto, parte do ambiente ou termo não alimentício proibido.
 * Bloqueia qualquer item com name contendo: objeto, cor, embalagem, geladeira, prateleira, mão, mesa, etc.
 */
export function isClearlyNonFood(name: string): boolean {
  const normalized = normalizeForComparison(cleanFoodName(name));
  if (!normalized) {
    return true;
  }

  // Bloqueio se contiver qualquer palavra-chave não alimentícia
  const containsNonFoodKeyword = NON_FOOD_KEYWORDS.some((blocked) => {
    const normalizedBlocked = normalizeForComparison(blocked);
    // Casos: palavra exata, contida dentro da string ou como termo separado
    return (
      normalized === normalizedBlocked ||
      normalized.includes(normalizedBlocked)
    );
  });

  if (containsNonFoodKeyword) {
    return true;
  }

  // Bloqueio se for um termo genérico demais ("alimentos", "frutas", "itens")
  if (isGenericFoodTerm(normalized)) {
    return true;
  }

  return false;
}

/**
 * Normaliza uma chave de texto removendo acentuação, espaços e convertendo para minúsculo.
 */
export function normalizeKey(s: string): string {
  return (s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Agrupa e mescla itens detectados repetidos pelo nome e unidade, somando quantidades e mantendo maior confiança.
 */
export function mergeDetectedItems(items: DetectedFoodItem[]): DetectedFoodItem[] {
  const map = new Map<string, DetectedFoodItem>();

  for (const item of items) {
    const key = `${normalizeKey(item.name)}__${normalizeKey(item.unit)}`;

    const prev = map.get(key);
    if (!prev) {
      map.set(key, { ...item });
      continue;
    }

    // soma quantidades, mantém maior confidence
    const mergedQty = (prev.quantity || 1) + (item.quantity || 1);
    map.set(key, {
      ...prev,
      quantity: normalizeQty(mergedQty, prev.unit),
      confidence: Math.max(prev.confidence ?? 0, item.confidence ?? 0),
      selected: prev.selected || item.selected,
    });
  }

  return Array.from(map.values());
}

/**
 * Normaliza a quantidade garantindo números finitos válidos e inteiros para unidade "un" >= 1.
 */
export function normalizeQty(q: unknown, unit: string): number {
  let n = typeof q === 'number' ? q : Number(q);
  if (!Number.isFinite(n) || n <= 0) n = 1;

  if (unit === 'un') n = Math.round(n);
  if (n < 1) n = 1;

  return n;
}

/**
 * Normaliza o estado de frescor garantindo apenas 'fresh' | 'frozen' (Regra 13).
 */
export function normalizeFreshness(state: any): 'fresh' | 'frozen' {
  if (state === 'frozen') {
    return 'frozen';
  }
  return 'fresh';
}

class HuggingFaceScannerService implements IScannerService {
  public getSampleImages() {
    return SAMPLE_FRIDGE_IMAGES;
  }

  public async simulateScan(
    imageUrl: string,
    onProgress?: (msg: string) => void,
    forceError: boolean = false
  ): Promise<DetectedFoodItem[]> {
    if (forceError) {
      throw new Error(
        'Não foi possível identificar alimentos com clareza. Tente tirar a foto com melhor iluminação e com a porta da geladeira aberta.'
      );
    }

    if (!imageUrl) {
      throw new Error('Nenhuma imagem foi selecionada.');
    }

    onProgress?.('Enviando imagem para análise...');

    const response = await fetch('/api/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageUrl,
      }),
    });

    onProgress?.('Analisando alimentos com IA...');

    const raw = await response.text();

    let data: HuggingFaceScanResponse;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      console.error("Resposta não-JSON do /api/scan:", response.status, raw);
      throw new Error(`Falha no Scan (HTTP ${response.status}). A API não retornou JSON.`);
    }

    const isBusy =
      response.status === 503 ||
      response.status === 429 ||
      (typeof data?.error === 'string' &&
        (data.error.toLowerCase().includes('ocupado') ||
         data.error.toLowerCase().includes('busy') ||
         data.error.toLowerCase().includes('overloaded') ||
         data.error.toLowerCase().includes('loading')));

    if (!response.ok || !data.success) {
      const retryAfterHeader = response.headers.get("Retry-After");
      const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : data?.retryAfterSeconds;

      // 503 = ocupado/temporário (retriable)
      if (response.status === 503 || isBusy) {
        throw new ScanServiceError(
          data?.error || "Servidor da IA está ocupado no momento. Tente novamente.",
          { status: 503, retryAfterSeconds, retriable: true }
        );
      }

      // outros erros
      throw new ScanServiceError(data?.error || "Não foi possível analisar a imagem.", {
        status: response.status,
        retryAfterSeconds,
        retriable: response.status === 429, // opcional
      });
    }

    if (!data.result) {
      throw new ScanServiceError('A IA não retornou nenhum resultado.', { status: 500, retriable: false });
    }

    onProgress?.('Processando alimentos identificados...');
    console.log('RESULTADO BRUTO DA IA:', data.result);

    return this.parseStructuredResult(data.result);
  }

  private parseStructuredResult(result: string): DetectedFoodItem[] {
    let parsed: StructuredFoodDetection;

    try {
      const cleanedJson = extractJsonFromText(result);
      parsed = JSON.parse(cleanedJson);
      console.log('RESULTADO APÓS PARSE:', parsed);
    } catch (error) {
      console.error(
        'O Hugging Face retornou um JSON inválido:',
        result,
        error
      );

      throw new Error(
        'A IA retornou uma resposta inválida. Tente tirar a foto novamente.'
      );
    }

    if (!parsed || !Array.isArray(parsed.items)) {
      throw new Error('A IA não retornou uma lista válida de alimentos.');
    }

    /*
     * ETAPA 1: FILTRO E SANITIZAÇÃO INDIVIDUAL
     * - Rejeita categoria 'other' (Regra 2)
     * - Rejeita objetos e não-alimentos (Regras 1, 3, 7, 8)
     * - Limpa markdown e espaços extras (Regras 4, 5, 6)
     * - Valida e atribui padrões seguros: confidence (0.9), location (null), state ('fresh')
     */
    const individualValidItems: Array<{
      name: string;
      category: DetectedFoodItem['category'];
      quantity: number;
      unit: DetectedFoodItem['unit'];
      state: DetectedFoodItem['state'];
      location: DetectedFoodItem['location'];
      confidence: number;
      expiryDate?: string;
    }> = [];

    for (const item of parsed.items) {
      if (!this.isValidFoodItem(item)) {
        console.warn('Item rejeitado pelo filtro de alimentos:', item);
        continue;
      }

      const cleanedName = cleanFoodName(item.name);

      // Rejeição estrita de termos proibidos / objetos
      if (isClearlyNonFood(cleanedName)) {
        console.warn('Item não-alimentício rejeitado:', cleanedName);
        continue;
      }

      const finalUnit = (item.unit as DetectedFoodItem['unit']) || 'un';
      // Validação e normalização de quantidade (se unit for "un", força inteiro >= 1, se vazio/NaN vira 1)
      const finalQuantity = normalizeQty(item.quantity, finalUnit);

      // Valores padrão seguros para campos ausentes ou parciais
      const finalConfidence =
        typeof item.confidence === 'number' &&
        Number.isFinite(item.confidence) &&
        item.confidence >= 0 &&
        item.confidence <= 1
          ? item.confidence
          : 0.9;

      const finalState = normalizeFreshness(item.state);
      const finalLocation = (item.location as DetectedFoodItem['location']) ?? null;
      const finalCategory = item.category as DetectedFoodItem['category'];

      individualValidItems.push({
        name: cleanedName,
        category: finalCategory,
        quantity: finalQuantity,
        unit: finalUnit,
        state: finalState,
        location: finalLocation,
        confidence: finalConfidence,
        expiryDate: item.expiryDate || undefined,
      });
    }

    /*
     * ETAPA 2: GERAÇÃO DOS ITENS INICIAIS E MESCLAGEM (mergeDetectedItems)
     * Exemplo: Banana (1), Banana (1) -> Banana (2)
     * Preserva confiança máxima, soma quantidades e normaliza unidades.
     */
    const initialItems: DetectedFoodItem[] = individualValidItems.map((item) => ({
      id: `det_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: item.name,
      category: item.category,
      quantity: normalizeQty(item.quantity, item.unit),
      unit: item.unit,
      state: item.state,
      location: item.location,
      confidence: item.confidence,
      expiryDate: item.expiryDate,
      selected: true,
    }));

    const validItems = mergeDetectedItems(initialItems);

    // Regra 9: Se após o filtro não sobrar nenhum alimento, retornar array vazio []
    console.log('RESULTADO APÓS FILTRO:', validItems);
    return validItems;
  }

  private isValidFoodItem(
    item: any
  ): boolean {
    if (!item || typeof item !== 'object') {
      return false;
    }

    if (
      typeof item.name !== 'string' ||
      !item.name.trim()
    ) {
      return false;
    }

    // Regra 2: Rejeitar completamente 'other' ou categorias não alimentícias
    const category =
      typeof item.category === 'string'
        ? (item.category.toLowerCase().trim() as DetectedFoodItem['category'])
        : undefined;

    if (
      !category ||
      category === 'other' ||
      !ALLOWED_CATEGORIES.includes(category)
    ) {
      return false;
    }

    return true;
  }
}

export const scannerService = new HuggingFaceScannerService();
