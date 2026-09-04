import { inferCategoryFromTitle } from './utils';
import { Recipe, RecipeIngredient, ServingsBucket } from '../../src/types';
import { computeDietFlags } from './dietHeuristics';
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

export function buildWikilivrosRecipe(
  title: string,
  ingLines: string[],
  steps: string[],
  options?: {
    thumbnail?: string;
    category?: string;
    servings?: number;
    servingsBucket?: ServingsBucket;
  }
): Recipe {
  const ingredients: RecipeIngredient[] = ingLines.map((t) => ({ name: t, quantity: '', required: true }));
  const diet = computeDietFlags(
    ingredients.map((i) => i.name),
    steps
  );

  const category = options?.category || inferCategoryFromTitle(title);
  const servings = options?.servings || 4;
  const servingsBucket = options?.servingsBucket || '3-4';
  const defaultImg = options?.thumbnail || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';

  return {
    id: `wikilivros_${canonicalKeyFromTitle(title)}`,
    title,
    description: `Receita brasileira do Wikilivros • ${category}`,
    prepTimeMinutes: Math.min(90, Math.max(15, steps.length * 8 + ingredients.length * 2)),
    difficulty: ingredients.length > 8 || steps.length > 6 ? 'Médio' : 'Fácil',
    servings,
    servingsBucket,
    category,
    imageUrl: defaultImg,
    ingredients,
    steps,
    diet,
    tags: [
      category,
      'Tradicional',
      'Wikilivros',
      ...(diet.vegan ? ['Vegano'] : []),
      ...(diet.vegetarian && !diet.vegan ? ['Vegetariano'] : []),
      ...(diet.hasGluten === false ? ['Sem Glúten'] : []),
      ...(diet.hasLactose === false ? ['Sem Lactose'] : []),
      ...(diet.usesFrying === false ? ['Sem Frituras'] : []),
      ...(diet.lowCarb ? ['Low Carb'] : []),
      ...(diet.highProtein ? ['Rico em Proteína'] : []),
    ],
    caloriesPerServing: Math.round(200 + ingredients.length * 35),
    canonicalKey: canonicalKeyFromTitle(title),
    originArea: 'Brazilian',
    originCountry: 'Brazil',
    sources: [
      {
        sourceId: 'wikilivros',
        url: `https://pt.wikibooks.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
        license: 'CC BY-SA 4.0 / GFDL',
        attribution: `Wikilivros (pt.wikibooks.org) - Contribuidores de "${title}"`,
      },
    ],
  };
}

export async function fetchWikilivrosRecipes(): Promise<Recipe[]> {
  const recipes: Recipe[] = [];
  const rawList = await fetchFromWikiSource();

  for (const r of rawList) {
    const titleClean = r.title;
    const category = inferCategoryFromTitle(titleClean);
    const diet = computeDietFlags(
      r.ingredients.map((i) => i.name),
      r.steps
    );

    recipes.push({
      ...r,
      category,
      description: `Receita brasileira do Wikilivros • ${category}`,
      diet,
      tags: [
        category,
        'Tradicional',
        'Wikilivros',
        ...(diet.vegan ? ['Vegano'] : []),
        ...(diet.vegetarian && !diet.vegan ? ['Vegetariano'] : []),
        ...(diet.hasGluten === false ? ['Sem Glúten'] : []),
        ...(diet.hasLactose === false ? ['Sem Lactose'] : []),
        ...(diet.usesFrying === false ? ['Sem Frituras'] : []),
        ...(diet.lowCarb ? ['Low Carb'] : []),
        ...(diet.highProtein ? ['Rico em Proteína'] : []),
      ],
    });
  }

  return recipes;
}

export { inferCategoryFromTitle, computeDietFlags };
