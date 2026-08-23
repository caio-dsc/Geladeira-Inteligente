import { Recipe, RecipeMatch, FoodItem } from '../types';
import { MOCK_RECIPES } from '../data/mockData';
import { firestoreService } from './firestoreService';

export interface IRecipeService {
  getRecipes(): Promise<Recipe[]>;
  getMatchingRecipes(inventory: FoodItem[]): Promise<RecipeMatch[]>;
  getRecipeById(id: string, inventory?: FoodItem[]): Promise<RecipeMatch | null>;
}

class RecipeService implements IRecipeService {
  private recipes: Recipe[] = [...MOCK_RECIPES];
  private isLoadedFromFirestore = false;

  constructor() {
    this.initRecipes();
  }

  private async initRecipes() {
    try {
      const remoteRecipes = await firestoreService.getRecipes();
      if (remoteRecipes.length > 0) {
        this.recipes = remoteRecipes;
      } else {
        // Se ainda não houver receitas no Firestore, semeia o catálogo padrão
        await firestoreService.seedInitialRecipes(MOCK_RECIPES);
      }
      this.isLoadedFromFirestore = true;
    } catch (e) {
      console.warn('Aviso ao carregar receitas do Firestore:', e);
    }
  }

  public async getRecipes(): Promise<Recipe[]> {
    if (!this.isLoadedFromFirestore) {
      await this.initRecipes();
    }
    return [...this.recipes];
  }

  public async getMatchingRecipes(inventory: FoodItem[]): Promise<RecipeMatch[]> {
    const recipes = await this.getRecipes();
    const inventoryNames = inventory.map((item) => this.normalizeString(item.name));

    return recipes.map((recipe) => {
      const matchedIngredients: string[] = [];
      const missingIngredients: string[] = [];

      recipe.ingredients.forEach((ing) => {
        const normalizedIng = this.normalizeString(ing.name);
        const isMatched = inventoryNames.some((invName) => 
          invName.includes(normalizedIng) || normalizedIng.includes(invName)
        );

        if (isMatched) {
          matchedIngredients.push(ing.name);
        } else {
          missingIngredients.push(ing.name);
        }
      });

      const totalIngredients = recipe.ingredients.length;
      const matchPercentage = totalIngredients > 0 
        ? Math.round((matchedIngredients.length / totalIngredients) * 100) 
        : 0;

      const isReadyToCook = matchPercentage >= 80 || missingIngredients.length === 0;

      return {
        ...recipe,
        matchedIngredients,
        missingIngredients,
        matchPercentage,
        isReadyToCook,
      };
    }).sort((a, b) => b.matchPercentage - a.matchPercentage);
  }

  public async getRecipeById(id: string, inventory: FoodItem[] = []): Promise<RecipeMatch | null> {
    const recipes = await this.getRecipes();
    const recipe = recipes.find((r) => r.id === id);
    if (!recipe) return null;

    const inventoryNames = inventory.map((item) => this.normalizeString(item.name));
    const matchedIngredients: string[] = [];
    const missingIngredients: string[] = [];

    recipe.ingredients.forEach((ing) => {
      const normalizedIng = this.normalizeString(ing.name);
      const isMatched = inventoryNames.some((invName) => 
        invName.includes(normalizedIng) || normalizedIng.includes(invName)
      );

      if (isMatched) {
        matchedIngredients.push(ing.name);
      } else {
        missingIngredients.push(ing.name);
      }
    });

    const total = recipe.ingredients.length;
    const matchPercentage = total > 0 ? Math.round((matchedIngredients.length / total) * 100) : 0;

    return {
      ...recipe,
      matchedIngredients,
      missingIngredients,
      matchPercentage,
      isReadyToCook: matchPercentage >= 80,
    };
  }

  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }
}

export const recipeService = new RecipeService();
