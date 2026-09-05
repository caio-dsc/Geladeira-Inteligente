import { RecipeDietFlags, ServingsBucket } from '../types';
import { servingsBucketFromServings } from './recipeUtils';

export type DifficultyFilterValue = 'all' | 'Fácil' | 'Médio' | 'Avançado';
export type ServingsFilterValue = 'all' | ServingsBucket;

/**
 * Validação pura e unificada de filtros dietéticos com lógica AND (interseção).
 * A receita só deve ser exibida quando satisfizer TODOS os filtros ativos.
 *
 * Regras:
 * - Vegano: hasMeat !== true && hasLactose !== true && hasEgg !== true && vegan === true
 * - Vegetariano: hasMeat !== true && vegetarian !== false
 * - Sem Glúten: hasGluten !== true
 * - Sem Lactose: hasLactose !== true
 * - Sem Frituras: usesFrying !== true
 * - Low Carb: lowCarb === true
 * - Rico em Proteína: highProtein === true
 */
export function matchesDietFilters(
  diet?: RecipeDietFlags,
  activeFilters?: string[]
): boolean {
  if (!activeFilters || activeFilters.length === 0) {
    return true;
  }
  if (!diet) {
    return false;
  }

  for (const filter of activeFilters) {
    switch (filter) {
      case 'Vegano':
        if (
          diet.hasMeat === true ||
          diet.hasLactose === true ||
          diet.hasEgg === true ||
          diet.vegan !== true
        ) {
          return false;
        }
        break;

      case 'Vegetariano':
        if (diet.hasMeat === true || diet.vegetarian === false) {
          return false;
        }
        break;

      case 'Sem Glúten':
        if (diet.hasGluten === true) {
          return false;
        }
        break;

      case 'Sem Lactose':
        if (diet.hasLactose === true) {
          return false;
        }
        break;

      case 'Sem Frituras':
        if (diet.usesFrying === true) {
          return false;
        }
        break;

      case 'Low Carb':
        if (diet.lowCarb !== true) {
          return false;
        }
        break;

      case 'Rico em Proteína':
        if (diet.highProtein !== true) {
          return false;
        }
        break;

      default:
        break;
    }
  }

  return true;
}

/**
 * Retorna badges dietéticos derivados estritamente de recipe.diet.
 * Prioridades:
 * 1. Vegano ou Vegetariano
 * 2. Sem Glúten
 * 3. Sem Lactose
 * 4. Low Carb
 * 5. Rico em Proteína
 * 6. Sem Frituras
 */
export function getRecipeDietBadges(diet?: RecipeDietFlags): string[] {
  if (!diet) return [];
  const badges: string[] = [];

  if (
    diet.hasMeat !== true &&
    diet.hasLactose !== true &&
    diet.hasEgg !== true &&
    diet.vegan === true
  ) {
    badges.push('Vegano');
  } else if (diet.hasMeat !== true && diet.vegetarian !== false) {
    badges.push('Vegetariano');
  }

  if (diet.hasGluten === false) {
    badges.push('Sem Glúten');
  }

  if (diet.hasLactose === false) {
    badges.push('Sem Lactose');
  }

  if (diet.lowCarb === true) {
    badges.push('Low Carb');
  }

  if (diet.highProtein === true) {
    badges.push('Rico em Proteína');
  }

  if (diet.usesFrying === false) {
    badges.push('Sem Frituras');
  }

  return badges;
}

/**
 * Validação do filtro de dificuldade.
 * Quando 'all' ou 'Todas', aceita qualquer dificuldade.
 * Caso contrário, exige correspondência exata com recipe.difficulty.
 */
export function matchesDifficultyFilter(
  recipeDifficulty?: string,
  filter?: DifficultyFilterValue | string
): boolean {
  if (!filter || filter === 'all' || filter === 'Todas') {
    return true;
  }
  return recipeDifficulty === filter;
}

/**
 * Validação do filtro de porções utilizando recipe.servingsBucket como fonte principal,
 * com fallback para servingsBucketFromServings(recipe.servings).
 * Quando 'all' ou 'Todas', aceita qualquer quantidade de porções.
 */
export function matchesServingsFilter(
  recipe: { servingsBucket?: ServingsBucket; servings?: number },
  filter?: ServingsFilterValue | string
): boolean {
  if (!filter || filter === 'all' || filter === 'Todas') {
    return true;
  }
  const bucket =
    recipe.servingsBucket && recipe.servingsBucket !== 'unknown'
      ? recipe.servingsBucket
      : servingsBucketFromServings(recipe.servings);

  return bucket === filter;
}

