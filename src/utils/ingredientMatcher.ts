import { FoodItem, Recipe } from '../types';

/**
 * Normaliza texto de ingrediente:
 * - Converte para minúsculas
 * - Remove acentos (NFD)
 * - Converte hífens e underscores em espaço
 * - Remove pontuação e caracteres especiais
 * - Colapsa múltiplos espaços em um só
 */
export function normalizeIngredient(raw: string): string {
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
 * Normalização conservadora de singular/plural em português.
 */
export function toSingular(word: string): string {
  const w = word.toLowerCase();
  if (w.length <= 3) return w; // palavras curtas como 'sal', 'mel', 'cha'

  if (w.endsWith('oes')) return w.slice(0, -3) + 'ao'; // limões -> limao
  if (w.endsWith('aes')) return w.slice(0, -3) + 'ao';
  if (w.endsWith('ais')) return w.slice(0, -3) + 'al';
  if (w.endsWith('eis')) return w.slice(0, -3) + 'el';
  if (w.endsWith('ois')) return w.slice(0, -3) + 'ol';
  if (w.endsWith('uis')) return w.slice(0, -3) + 'ul';
  if (w.endsWith('ns')) return w.slice(0, -2) + 'm';
  if (w.endsWith('res')) return w.slice(0, -2); // colheres -> colher
  if (w.endsWith('zes')) return w.slice(0, -2); // nozes -> noz
  if (w.endsWith('es')) return w.slice(0, -1);  // tomates -> tomate, carnes -> carne
  if (w.endsWith('os') || w.endsWith('as')) return w.slice(0, -1); // ovos -> ovo, cebolas -> cebola
  if (w.endsWith('s') && !w.endsWith('ss')) {
    return w.slice(0, -1);
  }
  return w;
}

/**
 * Palavras secundárias ou de medidas/preparo em receitas que não definem o ingrediente principal.
 */
export const PREP_WORDS = new Set([
  'g', 'gramas', 'grama', 'kg', 'quilo', 'quilos', 'ml', 'litro', 'litros', 'l',
  'colher', 'colheres', 'xicara', 'xicaras', 'copo', 'copos', 'pitada', 'pitadas',
  'dente', 'dentes', 'lata', 'latas', 'maco', 'macos', 'macinho', 'macinhos',
  'unidade', 'unidades', 'fatia', 'fatias', 'posta', 'postas', 'pacote', 'pacotes',
  'vidro', 'vidros', 'sopa', 'cha', 'sobremesa', 'cafe', 'americano',
  'ralado', 'ralada', 'ralados', 'raladas', 'picado', 'picada', 'picados', 'picadas',
  'cortado', 'cortada', 'cortados', 'cortadas', 'amassado', 'amassada', 'amassados', 'amassadas',
  'cozido', 'cozida', 'cozidos', 'cozidas', 'moido', 'moida', 'moidos', 'moidas',
  'fresco', 'fresca', 'frescos', 'frescas', 'desfiado', 'desfiada', 'cru', 'crua', 'crus', 'cruas',
  'cubos', 'rodelas', 'gosto', 'de', 'da', 'do', 'dos', 'das', 'com', 'sem', 'para', 'em', 'a'
]);

/**
 * Compostos protegidos: ingredientes específicos que compartilham termos
 * com outros ingredientes (ex: 'leite' e 'leite de coco', 'alho' e 'alho-poro'),
 * mas que representam alimentos completamente distintos.
 */
export const PROTECTED_COMPOUNDS = [
  'leite de coco',
  'leite condensado',
  'creme de leite',
  'doce de leite',
  'leite em po',
  'alho poro',
  'batata doce',
  'azeite de dende',
  'oleo de dende',
  'cebolinha'
];

function getProtectedCompound(normStr: string): string | null {
  for (const compound of PROTECTED_COMPOUNDS) {
    const regex = new RegExp('(^|\\s)' + compound + '(\\s|$)', 'i');
    if (regex.test(normStr)) {
      return compound;
    }
  }
  return null;
}

const CHICKEN_CUTS = [
  'peito de frango',
  'coxa de frango',
  'sobrecoxa de frango',
  'file de frango',
  'frango desfiado',
  'frango a passarinho',
  'carne de frango',
  'frango'
];

function isChicken(normStr: string): boolean {
  if (normStr === 'frango' || normStr === 'frangos') return true;
  for (const cut of CHICKEN_CUTS) {
    if (normStr.includes(cut)) return true;
  }
  const tokens = normStr.split(' ').map(toSingular);
  if (tokens.includes('frango')) return true;
  return false;
}

/**
 * Comparação direta entre dois termos de ingredientes.
 */
export function areIngredientsDirectlyCompatible(aRaw: string, bRaw: string): boolean {
  const normA = normalizeIngredient(aRaw);
  const normB = normalizeIngredient(bRaw);
  if (!normA || !normB) return false;

  // 1. Exato
  if (normA === normB) return true;

  // 2. Singular exato
  const singA = normA.split(' ').map(toSingular).join(' ');
  const singB = normB.split(' ').map(toSingular).join(' ');
  if (singA === singB) return true;

  // 3. Sal vs Salsa proteção estrita
  const isSalA = singA === 'sal';
  const isSalB = singB === 'sal';
  const isSalsaA = singA === 'salsa' || singA === 'salsinha';
  const isSalsaB = singB === 'salsa' || singB === 'salsinha';
  if ((isSalA && isSalsaB) || (isSalsaA && isSalB)) return false;

  // 4. Compostos protegidos (ex: alho-poró vs alho, leite de coco vs leite)
  const compoundA = getProtectedCompound(normA);
  const compoundB = getProtectedCompound(normB);
  if (compoundA || compoundB) {
    if (compoundA !== compoundB) {
      return false;
    }
    return true;
  }

  // 5. Família Frango (frango ↔ peito de frango, frango ↔ coxa de frango)
  const isChickenA = isChicken(normA);
  const isChickenB = isChicken(normB);
  if (isChickenA && isChickenB) {
    const isGenericA = singA === 'frango';
    const isGenericB = singB === 'frango';
    if (isGenericA || isGenericB) return true;
    if (singA.includes(singB) || singB.includes(singA)) return true;
    return false;
  }

  // 6. Carne / Carne bovina
  const isCarneA = singA === 'carne' || singA === 'carne bovina';
  const isCarneB = singB === 'carne' || singB === 'carne bovina';
  if (isCarneA && isCarneB) return true;

  // 7. Token set matching ignorando números e termos de preparo
  const tokensA = singA.split(' ').filter((t) => !PREP_WORDS.has(t) && !/^\d+$/.test(t));
  const tokensB = singB.split(' ').filter((t) => !PREP_WORDS.has(t) && !/^\d+$/.test(t));

  if (tokensA.length > 0 && tokensB.length > 0) {
    const strA = tokensA.join(' ');
    const strB = tokensB.join(' ');
    if (strA === strB) return true;

    // Se um possui 1 token significativo (ex: 'alho', 'cebola', 'manteiga') e o outro contém esse token
    if (tokensA.length === 1 && tokensB.includes(tokensA[0])) return true;
    if (tokensB.length === 1 && tokensA.includes(tokensB[0])) return true;
  }

  return false;
}

/**
 * Função utilitária pura para comparar ingredientes semanticamente.
 * Reconhece singular/plural, equivalências seguras (frango ↔ peito/coxa, carne ↔ carne bovina)
 * e linhas alternativas compostas (ex: 'Azeite ou Manteiga', 'Sal e Pimenta').
 */
export function matchIngredients(aRaw: string, bRaw: string): boolean {
  if (areIngredientsDirectlyCompatible(aRaw, bRaw)) return true;

  // Verifica alternativas separadas por 'ou' ou 'e'
  if (aRaw.includes(' ou ') || aRaw.includes(' e ')) {
    const parts = aRaw.split(/\s+(?:ou|e)\s+/i);
    for (const part of parts) {
      if (areIngredientsDirectlyCompatible(part, bRaw)) return true;
    }
  }
  if (bRaw.includes(' ou ') || bRaw.includes(' e ')) {
    const parts = bRaw.split(/\s+(?:ou|e)\s+/i);
    for (const part of parts) {
      if (areIngredientsDirectlyCompatible(aRaw, part)) return true;
    }
  }

  return false;
}

/**
 * Verifica se um ingrediente especificado na receita tem correspondência
 * com algum item do inventário disponível.
 */
export function isIngredientAvailable(recipeIngredientName: string, availableInventoryNames: string[]): boolean {
  return availableInventoryNames.some((invName) => matchIngredients(recipeIngredientName, invName));
}

/**
 * Ponto central de cálculo para receitas:
 * Determina matchedIngredients, missingIngredients, matchPercentage e isReadyToCook.
 */
export function calculateRecipeMatch(
  recipe: Recipe,
  inventory: FoodItem[]
): {
  matchedIngredients: string[];
  missingIngredients: string[];
  matchPercentage: number;
  isReadyToCook: boolean;
} {
  const availableInventoryNames = inventory
    .filter((item) => Number(item.quantity) > 0)
    .map((item) => item.name);

  const ingredients = recipe.ingredients ?? [];
  const matchedIngredients: string[] = [];
  const missingIngredients: string[] = [];
  const missingRequired: string[] = [];
  let presentRequiredCount = 0;

  const requiredIngredients = ingredients.filter((ing) => ing.required !== false);
  const requiredIngredientsCount = requiredIngredients.length;

  ingredients.forEach((ing) => {
    const isMatched = isIngredientAvailable(ing.name, availableInventoryNames);

    if (isMatched) {
      matchedIngredients.push(ing.name);
      if (ing.required !== false) {
        presentRequiredCount += 1;
      }
    } else {
      missingIngredients.push(ing.name);
      if (ing.required !== false) {
        missingRequired.push(ing.name);
      }
    }
  });

  const total = ingredients.length;
  const matchPercentage = requiredIngredientsCount > 0
    ? Math.round((presentRequiredCount / requiredIngredientsCount) * 100)
    : (total > 0 ? Math.round((matchedIngredients.length / total) * 100) : 0);

  const isReadyToCook = total > 0 && missingRequired.length === 0;

  return {
    matchedIngredients,
    missingIngredients,
    matchPercentage,
    isReadyToCook,
  };
}
