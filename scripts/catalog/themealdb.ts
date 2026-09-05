import { translateIngredient } from './ingredientDictionary';
import { translateIngredients } from './ingredientMap';
import { computeDietFlags } from './dietHeuristics';
import { inferCategoryFromTitle, mapToAppCategory } from './utils';
import { Recipe, RecipeIngredient } from '../../src/types';

export function getMealCategory(meal: any, title = meal?.strMeal || ''): string {
  const catFromApi = mapToAppCategory(meal.strCategory);
  const category =
    catFromApi === 'Outros' || /miscellaneous|side/i.test(meal.strCategory || '')
      ? inferCategoryFromTitle(title)
      : catFromApi;
  return category;
}

export { mapToAppCategory, translateIngredients, computeDietFlags };

export function extractIngredients(meal: any): RecipeIngredient[] {
  const out: RecipeIngredient[] = [];
  for (let i = 1; i <= 20; i++) {
    const ing = (meal[`strIngredient${i}`] || '').trim();
    const meas = (meal[`strMeasure${i}`] || '').trim();
    if (!ing) continue;

    out.push({
      name: ing,
      nameOriginal: ing, // guarda o original para tradução posterior
      quantity: meas || 'a gosto',
      required: true,
    });
  }
  return out;
}

export function extractSteps(meal: any): string[] {
  const txt = (meal.strInstructions || '').trim();
  if (!txt) return [];
  const lines = txt.split('\n').map((l: string) => l.trim()).filter(Boolean);
  if (lines.length >= 2) return lines;
  return txt.split('.').map((s: string) => s.trim()).filter(Boolean);
}

export function buildTheMealDBRecipe(meal: any, extra?: { imageUrl?: string; category?: string }): Recipe {
  const ingredients = translateIngredients(extractIngredients(meal)); // EN→PT primeiro
  const steps = extractSteps(meal);

  const diet = computeDietFlags(
    ingredients.map((i) => i.name),
    steps,
    meal.strMeal
  );

  const category = extra?.category || getMealCategory(meal);
  const rawThumb = meal.strMealThumb || '';
  const imageUrl = extra?.imageUrl || (rawThumb ? `${rawThumb}/medium` : '');

  const recipe: Recipe = {
    id: `themealdb_${meal.idMeal}`,
    title: meal.strMeal,
    description: `${meal.strCategory || 'Prato Tradicional'} • ${category}`,
    prepTimeMinutes: 35,
    difficulty: ingredients.length >= 10 || steps.length >= 8 ? 'Médio' : 'Fácil',
    servings: 2,
    servingsBucket: '2',
    category,
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    ingredients,
    steps,
    diet,
    tags: [
      meal.strCategory || 'Brasileira',
      ...(diet.vegan ? ['Vegano'] : []),
      ...(diet.vegetarian && !diet.vegan ? ['Vegetariano'] : []),
      ...(diet.hasGluten === false ? ['Sem Glúten'] : []),
      ...(diet.hasLactose === false ? ['Sem Lactose'] : []),
      ...(diet.usesFrying === false ? ['Sem Frituras'] : []),
      ...(diet.lowCarb ? ['Low Carb'] : []),
      ...(diet.highProtein ? ['Rico em Proteína'] : []),
    ],
    caloriesPerServing: 380,
    canonicalKey: meal.strMeal.toLowerCase().trim(),
    aliases: [meal.strMeal],
    originArea: meal.strArea || 'Brazilian',
    originCountry: 'Brazil',
    sources: [
      {
        sourceId: 'themealdb',
        externalId: meal.idMeal,
        url: `https://www.themealdb.com/meal/${meal.idMeal}`,
        license: 'TheMealDB Free API',
        attribution: 'TheMealDB.com Open Recipe Database',
      },
    ],
  };

  return recipe;
}

export function logUntranslatedIngredients(recipes: { ingredients: RecipeIngredient[] }[]): void {
  const untranslated = new Set<string>();
  for (const r of recipes) {
    for (const ing of r.ingredients) {
      if (ing.name === ing.nameOriginal && /^[a-z\s-]+$/i.test(ing.nameOriginal)) {
        untranslated.add(ing.nameOriginal);
      }
    }
  }
  if (untranslated.size) {
    console.log('\n[TheMealDB] Ingredientes SEM tradução (adicione ao dicionário):');
    console.log([...untranslated].sort().join(', '), '\n');
  }
}


