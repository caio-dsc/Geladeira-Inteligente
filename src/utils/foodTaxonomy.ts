import { CategoryType } from '../types';

/**
 * Normaliza uma string de alimento para comparação taxonômica:
 * - Remove espaços excedentes
 * - Converte para minúsculas
 * - Remove acentos diacríticos (NFD)
 * - Substitui hífens e pontuações por espaço
 */
export function normalizeTaxonomyName(raw: string): string {
  return (raw || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[-_]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Normalização simples de plural para singular em português.
 */
function toSingularTaxonomy(word: string): string {
  const w = word.toLowerCase();
  if (w.length <= 3) return w;
  if (w.endsWith('oes')) return w.slice(0, -3) + 'ao';
  if (w.endsWith('aes')) return w.slice(0, -3) + 'ao';
  if (w.endsWith('ais')) return w.slice(0, -3) + 'al';
  if (w.endsWith('eis')) return w.slice(0, -3) + 'el';
  if (w.endsWith('ois')) return w.slice(0, -3) + 'ol';
  if (w.endsWith('uis')) return w.slice(0, -3) + 'ul';
  if (w.endsWith('ns')) return w.slice(0, -2) + 'm';
  if (w.endsWith('res')) return w.slice(0, -2);
  if (w.endsWith('zes')) return w.slice(0, -2);
  if (w.endsWith('es')) return w.slice(0, -1);
  if (w.endsWith('os') || w.endsWith('as')) return w.slice(0, -1);
  if (w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}

/**
 * Lista canônica de frutas fornecida e validada para taxonomia determinística.
 * Inclui todas as frutas requisitadas e variedades conhecidas.
 */
export const FRUITS_VOCABULARY: readonly string[] = [
  'abacate',
  'abacaxi',
  'acai',
  'acerola',
  'araca',
  'araca boi',
  'araticum',
  'bacaba',
  'bacuri',
  'bacupari',
  'banana',
  'baru',
  'biriba',
  'buriti',
  'cagaita',
  'caju',
  'camu camu',
  'caqui',
  'carambola',
  'castanha do para',
  'cereja do rio grande',
  'cereja',
  'coco',
  'cupuacu',
  'figo',
  'gabiroba',
  'goiaba',
  'graviola',
  'guarana',
  'inga',
  'jabuticaba',
  'jaca',
  'jambo',
  'jenipapo',
  'jatoba',
  'laranja',
  'limao',
  'maca',
  'mamao',
  'manga',
  'mangaba',
  'maracuja',
  'melancia',
  'melao',
  'mexerica',
  'murici',
  'nectarina',
  'pequi',
  'pera',
  'pessego',
  'pitanga',
  'pitomba',
  'pupunha',
  'roma',
  'seriguela',
  'tamarindo',
  'tangerina',
  'tucuma',
  'umbu',
  'uva',
  'uvaia',
  'caja',
  'sapoti',
  'sapota',
  'mangostao',
  'physalis',
  'lichia',
  'kiwi',
  'morango',
  'framboesa',
  'amora',
  'mirtilo',
  'framboesas',
  'morangos',
  'amoras',
  'mirtilos',
  'bananas',
  'macas',
  'laranjas',
  'uvas',
] as const;

/**
 * Vocabulário canônico de proteínas para validação determinística.
 */
export const PROTEINS_VOCABULARY: readonly string[] = [
  'frango',
  'peito de frango',
  'coxa de frango',
  'sobrecoxa de frango',
  'file de frango',
  'frango desfiado',
  'carne',
  'carne bovina',
  'carne moida',
  'carne seca',
  'carne de porco',
  'bife',
  'alcatra',
  'patinho',
  'costela',
  'file mignon',
  'picanha',
  'acem',
  'peixe',
  'file de peixe',
  'salmao',
  'tilapia',
  'atum',
  'sardinha',
  'bacalhau',
  'camarao',
  'ovo',
  'ovos',
  'ovo de galinha',
  'ovo caipira',
  'tofu',
  'lombo',
  'pernil',
] as const;

/**
 * Vocabulário canônico de laticínios para validação determinística.
 */
export const DAIRY_VOCABULARY: readonly string[] = [
  'leite',
  'leite integral',
  'leite desnatado',
  'leite semidesnatado',
  'leite em po',
  'queijo',
  'queijo mussarela',
  'queijo prato',
  'queijo minas',
  'queijo parmesao',
  'queijo coalho',
  'queijo gouda',
  'queijo brie',
  'iogurte',
  'iogurte natural',
  'iogurte grego',
  'iogurte desnatado',
  'requeijao',
  'manteiga',
  'creme de leite',
  'nata',
  'ricota',
  'coalhada',
] as const;

/**
 * Prefixos de pratos e produtos compostos que indicam bakery/panificação/confeitaria
 * e NÃO devem ser classificados como frutas in natura mesmo que contenham o nome de uma fruta.
 */
export const BAKERY_PREFIXES: readonly string[] = [
  'bolo de',
  'torta de',
  'pao de',
  'panqueca de',
  'biscoito de',
  'cookie de',
  'muffin de',
  'waffle de',
  'croissant de',
  'folhado de',
  'pastel de',
  'rosca de',
  'massa de',
] as const;

/**
 * Prefixos de bebidas que NÃO devem ser classificados como frutas in natura.
 */
export const DRINKS_PREFIXES: readonly string[] = [
  'vitamina de',
  'suco de',
  'shake de',
  'smoothie de',
  'cha de',
  'refresco de',
  'batida de',
  'refrigerante de',
  'bebida de',
  'agua de',
] as const;

/**
 * Prefixos de doces, conservas e condimentos que NÃO devem ser classificados como frutas in natura.
 */
export const PANTRY_PREFIXES: readonly string[] = [
  'doce de',
  'geleia de',
  'compota de',
  'mousse de',
  'sorvete de',
  'picole de',
  'calda de',
  'xarope de',
  'molho de',
] as const;

/**
 * Determina se o nome do alimento corresponde a um composto derivado
 * (ex: bolo de banana, vitamina de banana, doce de morango) e retorna a categoria derivada apropriada.
 */
export function getCompoundFoodCategory(normalizedName: string): CategoryType | null {
  for (const prefix of BAKERY_PREFIXES) {
    if (normalizedName.startsWith(prefix)) {
      return 'bakery';
    }
  }

  for (const prefix of DRINKS_PREFIXES) {
    if (normalizedName.startsWith(prefix)) {
      return 'drinks';
    }
  }

  for (const prefix of PANTRY_PREFIXES) {
    if (normalizedName.startsWith(prefix)) {
      return 'pantry';
    }
  }

  return null;
}

/**
 * Determina se um nome normalizado corresponde a uma fruta in natura ou variedade de fruta.
 * Exemplos:
 * - "banana" -> true
 * - "banana prata" -> true
 * - "banana nanica" -> true
 * - "maca fuji" -> true
 * - "manga palmer" -> true
 * - "bolo de banana" -> false (pois é composto derivado)
 */
export function isFruitItem(rawName: string): boolean {
  const norm = normalizeTaxonomyName(rawName);
  if (!norm) return false;

  // Se for claramente um composto derivado (bolo de..., suco de...), não é fruta in natura
  if (getCompoundFoodCategory(norm) !== null) {
    return false;
  }

  // 1. Verificação exata direta no vocabulário
  if (FRUITS_VOCABULARY.includes(norm)) {
    return true;
  }

  // 2. Verificação com singularização da frase
  const singularTokens = norm.split(' ').map(toSingularTaxonomy);
  const singularPhrase = singularTokens.join(' ');
  if (FRUITS_VOCABULARY.includes(singularPhrase)) {
    return true;
  }

  // 3. Verificação por palavra-núcleo inicial ou variedade:
  // Se o primeiro termo for uma fruta conhecida (ex: "banana prata", "maca fuji", "manga tommy")
  const firstWord = singularTokens[0];
  if (FRUITS_VOCABULARY.includes(firstWord)) {
    return true;
  }

  // 4. Verificação de frutas compostas conhecidas (ex: "camu camu", "araca boi", "castanha do para")
  for (const fruit of FRUITS_VOCABULARY) {
    if (fruit.includes(' ')) {
      if (norm === fruit || norm.startsWith(`${fruit} `)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Determina se um nome normalizado corresponde a uma proteína pura.
 */
export function isProteinItem(rawName: string): boolean {
  const norm = normalizeTaxonomyName(rawName);
  if (!norm) return false;

  if (getCompoundFoodCategory(norm) !== null) {
    return false;
  }

  if (PROTEINS_VOCABULARY.includes(norm)) {
    return true;
  }

  const singularTokens = norm.split(' ').map(toSingularTaxonomy);
  const singularPhrase = singularTokens.join(' ');
  if (PROTEINS_VOCABULARY.includes(singularPhrase)) {
    return true;
  }

  const firstWord = singularTokens[0];
  if (['frango', 'carne', 'peixe', 'ovo', 'bife', 'lombo'].includes(firstWord)) {
    return true;
  }

  return false;
}

/**
 * Determina se um nome normalizado corresponde a um laticínio puro.
 */
export function isDairyItem(rawName: string): boolean {
  const norm = normalizeTaxonomyName(rawName);
  if (!norm) return false;

  if (getCompoundFoodCategory(norm) !== null) {
    return false;
  }

  if (DAIRY_VOCABULARY.includes(norm)) {
    return true;
  }

  const singularTokens = norm.split(' ').map(toSingularTaxonomy);
  const singularPhrase = singularTokens.join(' ');
  if (DAIRY_VOCABULARY.includes(singularPhrase)) {
    return true;
  }

  const firstWord = singularTokens[0];
  if (['leite', 'queijo', 'iogurte', 'requeijao', 'manteiga', 'ricota', 'nata'].includes(firstWord)) {
    return true;
  }

  return false;
}

/**
 * Resolve a categoria definitiva de um alimento aplicando a taxonomia determinística.
 * 
 * Ordem de precedência:
 * 1. Alimentos compostos derivados (ex: "bolo de banana" -> "bakery", "vitamina de banana" -> "drinks")
 * 2. Frutas in natura e suas variedades (ex: "banana prata" -> "fruits")
 * 3. Proteínas puras (ex: "peito de frango", "carne bovina" -> "proteins")
 * 4. Laticínios puros (ex: "leite", "queijo prato" -> "dairy")
 * 5. Fallback para a categoria original fornecida pela IA (se válida).
 */
export function resolveFoodCategory(
  rawName: string,
  aiCategory?: CategoryType
): CategoryType {
  const norm = normalizeTaxonomyName(rawName);
  if (!norm) {
    return aiCategory || 'other';
  }

  // 1. Verifica se é composto derivado (evita classificar "bolo de banana" como fruit)
  const compoundCategory = getCompoundFoodCategory(norm);
  if (compoundCategory) {
    return compoundCategory;
  }

  // 2. Verifica taxonomia de Frutas
  if (isFruitItem(rawName)) {
    return 'fruits';
  }

  // 3. Verifica taxonomia de Proteínas
  if (isProteinItem(rawName)) {
    return 'proteins';
  }

  // 4. Verifica taxonomia de Laticínios
  if (isDairyItem(rawName)) {
    return 'dairy';
  }

  // 5. Fallback seguro para a categoria da IA caso ela tenha retornado uma categoria válida
  return aiCategory || 'other';
}
