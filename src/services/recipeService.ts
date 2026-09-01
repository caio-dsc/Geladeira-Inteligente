import { Recipe, RecipeMatch, FoodItem, UserPreferences } from '../types';
import { MOCK_RECIPES } from '../data/mockData';
import { firestoreService } from './firestoreService';

export interface IRecipeService {
  getRecipes(): Promise<Recipe[]>;
  getMatchingRecipes(inventory: FoodItem[], preferences?: UserPreferences): Promise<RecipeMatch[]>;
  getRecipeById(id: string, inventory?: FoodItem[]): Promise<RecipeMatch | null>;
}

class RecipeService implements IRecipeService {
  private recipes: Recipe[] = [...MOCK_RECIPES];
  private isLoadedFromFirestore = false;

  constructor() {
    // Inicialização síncrona com fallback local MOCK_RECIPES.
    // Nenhuma gravação no Firestore é realizada na inicialização.
  }

  private async initRecipes() {
    try {
      const remoteRecipes = await firestoreService.getRecipes();
      if (remoteRecipes.length > 0) {
        this.recipes = remoteRecipes;
      }
      // Se remoteRecipes estiver vazio ou falhar, mantém MOCK_RECIPES em memória
      this.isLoadedFromFirestore = true;
    } catch (e) {
      console.warn('Aviso ao carregar receitas do Firestore (utilizando catálogo local):', e);
      this.isLoadedFromFirestore = true;
    }
  }

  public async getRecipes(): Promise<Recipe[]> {
    if (!this.isLoadedFromFirestore) {
      await this.initRecipes();
    }
    return [...this.recipes];
  }

  public async getMatchingRecipes(
    inventory: FoodItem[],
    preferences?: UserPreferences
  ): Promise<RecipeMatch[]> {
    const recipes = await this.getRecipes();
    const inventoryNames = inventory.map((item) => this.normalizeString(item.name));

    const matchedList = recipes.map((recipe) => {
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
    });

    // Filtra conforme as preferências e restrições alimentares do usuário
    const filtered = matchedList.filter((recipe) => {
      if (!preferences) return true;

      // Filtro por Nível culinário
      if (preferences.cookingLevel === 'Iniciante') {
        if (recipe.difficulty && recipe.difficulty !== 'Fácil') return false;
      } else if (preferences.cookingLevel === 'Intermediário') {
        if (recipe.difficulty && recipe.difficulty === 'Avançado') return false;
      }

      // Filtro por Dietas / Restrições (caso a receita possua diet flags configuradas)
      if (recipe.diet) {
        const restrictions = (preferences.dietaryRestrictions || []).map((r) =>
          this.normalizeString(r)
        );

        // Se usuário marcou "Sem Glúten" -> remove receita com diet.hasGluten
        if (
          restrictions.some((r) => r.includes('gluten')) &&
          recipe.diet.hasGluten === true
        ) {
          return false;
        }

        // "Sem Lactose" -> remove com diet.hasLactose
        if (
          restrictions.some((r) => r.includes('lactose')) &&
          recipe.diet.hasLactose === true
        ) {
          return false;
        }

        // "Vegetariano" -> remove com diet.hasMeat
        if (
          restrictions.some((r) => r.includes('vegetariano')) &&
          recipe.diet.hasMeat === true
        ) {
          return false;
        }

        // "Vegano" -> remove se diet.vegan !== true
        if (
          restrictions.some((r) => r.includes('vegano')) &&
          recipe.diet.vegan !== true
        ) {
          return false;
        }

        // "Sem Frituras" -> remove se diet.usesFrying === true
        if (
          restrictions.some((r) => r.includes('fritura')) &&
          recipe.diet.usesFrying === true
        ) {
          return false;
        }
      }

      return true;
    });

    return filtered.sort((a, b) => b.matchPercentage - a.matchPercentage);
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
