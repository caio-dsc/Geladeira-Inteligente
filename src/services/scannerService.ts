import { DetectedFoodItem } from '../types';
import { SAMPLE_FRIDGE_IMAGES } from '../data/mockData';

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
}

interface StructuredFoodDetection {
  items: Array<{
    name: string;
    category: DetectedFoodItem['category'];
    quantity: number;
    unit: DetectedFoodItem['unit'];
    state: DetectedFoodItem['state'];
    location: DetectedFoodItem['location'] | null;
    confidence: number;
    expiryDate: string | null;
    expirySource: 'image' | null;
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
 * Lista de termos e objetos não alimentícios para rejeição estrita (Regra 3).
 */
const NON_FOOD_TERMS = [
  'objeto',
  'objetos',
  'alimento',
  'alimentos',
  'cena',
  'cores',
  'cor',
  'cores e caracteristicas visuais',
  'cores e características visuais',
  'caracteristicas visuais',
  'características visuais',
  'caracteristica',
  'característica',
  'fundo',
  'iluminacao',
  'iluminação',
  'mesa',
  'bancada',
  'prato',
  'prato vazio',
  'bandeja',
  'computador',
  'celular',
  'telefone',
  'notebook',
  'tablet',
  'medicamentos',
  'medicamento',
  'remedio',
  'remédio',
  'embalagem',
  'embalagens',
  'embalagem vazia',
  'pote',
  'potes',
  'pote vazio',
  'recipiente',
  'recipientes',
  'recipiente vazio',
  'frasco',
  'frascos',
  'frasco vazio',
  'frasco de sal',
  'frasco de pimenta',
  'saleiro',
  'pimenteiro',
  'utensilio',
  'utensílio',
  'utensilios',
  'utensílios',
  'geladeira',
  'freezer',
  'congelador',
  'fogao',
  'fogão',
  'forno',
  'microondas',
  'micro-ondas',
  'liquidificador',
  'cafeteira',
  'talher',
  'talheres',
  'faca',
  'garfo',
  'colher',
  'tabua',
  'tábua',
  'escorredor',
  'escorredor de macarrao',
  'escorredor de macarrão',
  'caixa vazia',
  'saco vazio',
  'garrafa vazia',
  'lixeira',
  'pano',
  'guardanapo',
];

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
 * Verifica se o nome corresponde a um objeto ou termo não alimentício proibido.
 */
export function isClearlyNonFood(name: string): boolean {
  const normalized = normalizeForComparison(cleanFoodName(name));
  if (!normalized) {
    return true;
  }

  return NON_FOOD_TERMS.some((blocked) => {
    const normalizedBlocked = normalizeForComparison(blocked);
    return (
      normalized === normalizedBlocked ||
      normalized.startsWith(`${normalizedBlocked} `) ||
      normalized.endsWith(` ${normalizedBlocked}`) ||
      normalized.includes(` ${normalizedBlocked} `)
    );
  });
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

    const response = await fetch('/.netlify/functions/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageUrl,
      }),
    });

    onProgress?.('Analisando alimentos com IA...');

    const data: HuggingFaceScanResponse = await response.json();

    if (!response.ok || !data.success) {
      console.error('Erro retornado pela função scan:', data);

      const details =
        typeof data === 'object'
          ? JSON.stringify(data, null, 2)
          : '';

      throw new Error(
        `${data.error || 'Não foi possível analisar a imagem.'}${
          details ? `\n\nDetalhes: ${details}` : ''
        }`
      );
    }

    if (!data.result) {
      throw new Error('A IA não retornou nenhum resultado.');
    }

    onProgress?.('Processando alimentos identificados...');

    console.log('Resposta estruturada do Hugging Face:', data.result);

    return this.parseStructuredResult(data.result);
  }

  private parseStructuredResult(result: string): DetectedFoodItem[] {
    let parsed: StructuredFoodDetection;

    try {
      parsed = JSON.parse(result);
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
     * - Valida campos obrigatórios: confidence, category, unit, location, state (Regras 13-17)
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

      // Validação de quantidade (preserva quantidade confiável > 0, default 1)
      let finalQuantity = 1;
      if (
        typeof item.quantity === 'number' &&
        Number.isFinite(item.quantity) &&
        item.quantity > 0
      ) {
        finalQuantity = Math.max(1, Math.round(item.quantity));
      }

      individualValidItems.push({
        name: cleanedName,
        category: item.category,
        quantity: finalQuantity,
        unit: item.unit || 'un',
        state: normalizeFreshness(item.state),
        location: item.location ?? 'geladeira',
        confidence: Math.min(1, Math.max(0, item.confidence ?? 0.9)),
        expiryDate: item.expiryDate || undefined,
      });
    }

    /*
     * ETAPA 2: AGRUPAMENTO DE ALIMENTOS IGUAIS (Regra 10)
     * Exemplo: Banana (1), Banana (1), Banana (1), Banana (1) -> Banana (4)
     * Preserva confiança média/máxima, categoria e unidade compatíveis.
     */
    const groupedMap = new Map<string, {
      name: string;
      category: DetectedFoodItem['category'];
      quantity: number;
      unit: DetectedFoodItem['unit'];
      state: DetectedFoodItem['state'];
      location: DetectedFoodItem['location'];
      confidence: number;
      expiryDate?: string;
    }>();

    for (const item of individualValidItems) {
      // Chave de agrupamento por nome normalizado + unidade + estado
      const groupKey = `${normalizeForComparison(item.name)}_${item.unit}_${item.state}`;

      const existing = groupedMap.get(groupKey);
      if (existing) {
        existing.quantity += item.quantity;
        existing.confidence = Math.max(existing.confidence, item.confidence);
      } else {
        groupedMap.set(groupKey, { ...item });
      }
    }

    /*
     * ETAPA 3: GERAÇÃO DO ARRAY FINAL PARA O FRONTEND
     */
    const validItems: DetectedFoodItem[] = [];

    for (const [, item] of groupedMap) {
      validItems.push({
        id: `det_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 7)}`,
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        state: item.state,
        location: item.location,
        confidence: item.confidence,
        expiryDate: item.expiryDate,
        selected: true,
      });
    }

    // Regra 9: Se após o filtro não sobrar nenhum alimento, retornar array vazio []
    return validItems;
  }

  private isValidFoodItem(
    item: StructuredFoodDetection['items'][number]
  ): boolean {
    if (!item) {
      return false;
    }

    if (
      typeof item.name !== 'string' ||
      !item.name.trim()
    ) {
      return false;
    }

    // Regra 2: Rejeitar completamente 'other' ou categorias não alimentícias
    if (
      !item.category ||
      item.category === 'other' ||
      !ALLOWED_CATEGORIES.includes(item.category)
    ) {
      return false;
    }

    if (
      typeof item.quantity !== 'number' ||
      !Number.isFinite(item.quantity) ||
      item.quantity <= 0
    ) {
      return false;
    }

    if (
      typeof item.confidence !== 'number' ||
      !Number.isFinite(item.confidence) ||
      item.confidence < 0 ||
      item.confidence > 1
    ) {
      return false;
    }

    if (
      item.expiryDate !== null &&
      item.expiryDate !== undefined &&
      typeof item.expiryDate !== 'string'
    ) {
      return false;
    }

    if (
      item.expirySource !== null &&
      item.expirySource !== undefined &&
      item.expirySource !== 'image'
    ) {
      return false;
    }

    return true;
  }
}

export const scannerService = new HuggingFaceScannerService();
