import { inferCategoryFromTitle } from './utils';
import { Recipe, RecipeIngredient, ServingsBucket } from '../../src/types';
import { computeDietFlags } from '../recipes/dietHeuristics';
import {
  canonicalKeyFromTitle,
  normalizeText,
  getSections,
  getSectionHtml,
  parseRecipeFromSections,
  fetchWikilivrosBrazilianRecipes as fetchFromWikiSource,
} from '../recipes/importWikilivrosBrasil';

export function mapToAppCategory(cat?: string): string {
  return cat || 'Almoço & Jantar';
}

export async function fetchWikilivrosRecipes(): Promise<Recipe[]> {
  const recipes: Recipe[] = [];
  const rawList = await fetchFromWikiSource();

  for (const r of rawList) {
    const titleClean = r.title;
    const category = inferCategoryFromTitle(titleClean);

    recipes.push({
      ...r,
      category,
      description: `Receita brasileira do Wikilivros • ${category}`,
      tags: [category, 'Tradicional', 'Wikilivros'],
    });
  }

  return recipes;
}

export { inferCategoryFromTitle };
