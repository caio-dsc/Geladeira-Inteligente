import { translateIngredient } from './ingredientDictionary';
import { inferCategoryFromTitle, mapToAppCategory } from './utils';
import { RecipeIngredient } from '../../src/types';

export function getMealCategory(meal: any, title = meal?.strMeal || ''): string {
  const catFromApi = mapToAppCategory(meal.strCategory);
  const category =
    catFromApi === 'Outros' || /miscellaneous|side/i.test(meal.strCategory || '')
      ? inferCategoryFromTitle(title)
      : catFromApi;
  return category;
}

export { mapToAppCategory };

export function extractIngredients(meal: any): RecipeIngredient[] {
  const out: RecipeIngredient[] = [];
  for (let i = 1; i <= 20; i++) {
    const ing = (meal[`strIngredient${i}`] || '').trim();
    const meas = (meal[`strMeasure${i}`] || '').trim();
    if (!ing) continue;

    out.push({
      name: translateIngredient(ing),
      nameOriginal: ing, // guarda o original (útil para debug/futuro)
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

