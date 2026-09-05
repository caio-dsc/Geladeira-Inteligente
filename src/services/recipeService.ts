import { Recipe, RecipeMatch, FoodItem, UserPreferences } from '../types';
import { MOCK_RECIPES } from '../data/mockData';
import { firestoreService } from './firestoreService';
import { matchesDietFilters, getRecipeDietBadges, matchesDifficultyFilter, matchesServingsFilter } from '../utils/dietFilters';
import { calculateRecipeMatch, matchIngredients, isIngredientAvailable } from '../utils/ingredientMatcher';

export { 
  matchesDietFilters, 
  getRecipeDietBadges, 
  matchesDifficultyFilter, 
  matchesServingsFilter,
  matchIngredients,
  isIngredientAvailable,
  calculateRecipeMatch
};

export interface IRecipeService {
  getRecipes(): Promise<Recipe[]>;
  getMatchingRecipes(inventory: FoodItem[], preferences?: UserPreferences): Promise<RecipeMatch[]>;
  getRecipeById(id: string, inventory?: FoodItem[]): Promise<RecipeMatch | null>;
  refreshRecipesFromFirestore(): Promise<void>;
}

class RecipeService implements IRecipeService {
  private recipes: Recipe[] = [...MOCK_RECIPES];
  private isLoadedFromFirestore = false;

  constructor() {
    // Inicialização síncrona com fallback local MOCK_RECIPES.
  }

  private async initRecipes(): Promise<void> {
    let baseRecipes: Recipe[] = MOCK_RECIPES;
    try {
      const resp = await fetch('/recipes/catalog.json', { cache: 'force-cache' });
      if (resp.ok) {
        const data = await resp.json();
        if (Array.isArray(data.recipes) && data.recipes.length > 0) {
          baseRecipes = data.recipes;
        }
      }
    } catch (e) {
      console.warn('Falha ao carregar catálogo estático:', e);
    }

    let remoteRecipes: Recipe[] = [];
    try {
      remoteRecipes = await firestoreService.getRecipes();
    } catch (e) {
      console.warn('Aviso ao carregar receitas do Firestore:', e);
    }

    const merged = [...baseRecipes, ...(remoteRecipes || [])];

    // dedupe por id (se quiser, dá para trocar por canonicalKey depois)
    const map = new Map<string, Recipe>();
    for (const r of merged) map.set(r.id, r);

    this.recipes = Array.from(map.values());
    this.isLoadedFromFirestore = true;
  }

  public async refreshRecipesFromFirestore(): Promise<void> {
    this.isLoadedFromFirestore = false;
    await this.initRecipes();
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

    const matchedList = recipes.map((recipe) => {
      const matchData = calculateRecipeMatch(recipe, inventory);
      return {
        ...recipe,
        ...matchData,
      };
    });

    let matches = matchedList;

    // Filtro por preferências dietéticas do usuário
    if (preferences?.dietaryRestrictions?.length) {
      matches = matches.filter((m) =>
        matchesDietFilters((m as any).recipe?.diet ?? m.diet, preferences.dietaryRestrictions!)
      );
    }

    // Filtro por nível culinário
    if (preferences?.cookingLevel) {
      const level = preferences.cookingLevel as string;
      matches = matches.filter((recipe) => {
        if (level === 'beginner' || level === 'Iniciante') return recipe.difficulty === 'Fácil';
        if (level === 'intermediate' || level === 'Intermediário') return recipe.difficulty === 'Fácil' || recipe.difficulty === 'Médio';
        return true; // chef vê todas
      });
    }

    // Filtro por porções (se o usuário definiu preferência)
    if (preferences?.defaultServings) {
      const s = preferences.defaultServings;
      matches = matches.filter((recipe) => {
        const bucket = recipe.servingsBucket;
        if (!bucket || bucket === 'unknown') return true;
        if (s === 1) return bucket === '1';
        if (s === 2) return bucket === '2';
        if (s <= 4) return bucket === '3-4';
        return bucket === '5+';
      });
    }

    return matches.sort((a, b) => {
      if (a.isReadyToCook !== b.isReadyToCook) {
        return a.isReadyToCook ? -1 : 1;
      }
      if (b.matchPercentage !== a.matchPercentage) {
        return b.matchPercentage - a.matchPercentage;
      }
      return a.title.localeCompare(b.title, 'pt-BR');
    });
  }

  public async getRecipeById(id: string, inventory: FoodItem[] = []): Promise<RecipeMatch | null> {
    const recipes = await this.getRecipes();
    const recipe = recipes.find((r) => r.id === id);
    if (!recipe) return null;

    const matchData = calculateRecipeMatch(recipe, inventory);
    return {
      ...recipe,
      ...matchData,
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

