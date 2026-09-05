import { Recipe, RecipeMatch, FoodItem, UserPreferences } from '../types';
import { MOCK_RECIPES } from '../data/mockData';
import { firestoreService } from './firestoreService';
import { matchesDietFilters, getRecipeDietBadges, matchesDifficultyFilter, matchesServingsFilter } from '../utils/dietFilters';

export { matchesDietFilters, getRecipeDietBadges, matchesDifficultyFilter, matchesServingsFilter };

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
    const inv = inventory
      .filter((i) => Number(i.quantity) > 0)
      .map((i) => this.normalizeString(i.name));
    const invSet = new Set(inv);

    const matchedList = recipes.map((recipe) => {
      const ingredients = recipe.ingredients ?? [];
      const matchedIngredients: string[] = [];
      const missingIngredients: string[] = [];
      const missingRequired: string[] = [];
      let presentRequiredCount = 0;

      const requiredIngredients = ingredients.filter((ing) => ing.required !== false);
      const requiredIngredientsCount = requiredIngredients.length;

      ingredients.forEach((ing) => {
        const normalizedIng = this.normalizeString(ing.name);
        const isMatched = invSet.has(normalizedIng) || inv.some((invName) => 
          invName.includes(normalizedIng) || normalizedIng.includes(invName)
        );

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

      const totalIngredients = ingredients.length;
      const matchPercentage = requiredIngredientsCount > 0
        ? Math.round((presentRequiredCount / requiredIngredientsCount) * 100)
        : (totalIngredients > 0 ? Math.round((matchedIngredients.length / totalIngredients) * 100) : 0);

      // isReady: todos os obrigatórios presentes com quantity > 0
      const isReadyToCook = totalIngredients > 0 && missingRequired.length === 0;

      return {
        ...recipe,
        matchedIngredients,
        missingIngredients,
        matchPercentage,
        isReadyToCook,
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

    const inv = inventory
      .filter((item) => Number(item.quantity) > 0)
      .map((item) => this.normalizeString(item.name));
    const invSet = new Set(inv);

    const ingredients = recipe.ingredients ?? [];
    const matchedIngredients: string[] = [];
    const missingIngredients: string[] = [];
    const missingRequired: string[] = [];
    let presentRequiredCount = 0;

    const requiredIngredients = ingredients.filter((ing) => ing.required !== false);
    const requiredIngredientsCount = requiredIngredients.length;

    ingredients.forEach((ing) => {
      const normalizedIng = this.normalizeString(ing.name);
      const isMatched = invSet.has(normalizedIng) || inv.some((invName) => 
        invName.includes(normalizedIng) || normalizedIng.includes(invName)
      );

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

    return {
      ...recipe,
      matchedIngredients,
      missingIngredients,
      matchPercentage,
      isReadyToCook: total > 0 && missingRequired.length === 0,
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

