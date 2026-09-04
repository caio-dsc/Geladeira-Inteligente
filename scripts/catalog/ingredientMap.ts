import { translateIngredient } from './ingredientDictionary';
import { RecipeIngredient } from '../../src/types';

export { translateIngredient };

/**
 * Traduz uma lista de ingredientes do TheMealDB (EN -> PT).
 */
export function translateIngredients(ingredients: RecipeIngredient[]): RecipeIngredient[] {
  return ingredients.map((ing) => {
    const original = ing.nameOriginal || ing.name;
    const ptName = translateIngredient(original);
    return {
      ...ing,
      name: ptName,
      nameOriginal: original,
    };
  });
}
