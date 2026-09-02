import { Recipe, RecipeMatch, FoodItem, UserPreferences } from '../types';
import { MOCK_RECIPES } from '../data/mockData';
import { firestoreService } from './firestoreService';

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
    const inventoryNames = inventory.map((item) => this.normalizeString(item.name));

    const matchedList = recipes.map((recipe) => {
      const matchedIngredients: string[] = [];
      const missingIngredients: string[] = [];

      (recipe.ingredients ?? []).forEach((ing) => {
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

      const totalIngredients = (recipe.ingredients ?? []).length;
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

    let matches = matchedList;

    // Filtro por preferências do usuário
    if (preferences?.dietaryRestrictions && preferences.dietaryRestrictions.length > 0) {
      const prefs = preferences.dietaryRestrictions;

      matches = matches.filter((item) => {
        const recipe = (item as any).recipe || item;
        const d = recipe.diet;
        if (!d) return true; // sem info de diet, não filtra

        for (const pref of prefs) {
          switch (pref) {
            case 'vegetariano':
            case 'Vegetariano':
              if (d.hasMeat === true) return false;
              break;
            case 'vegano':
            case 'Vegano':
              if (d.vegan === false || d.hasMeat === true || d.hasLactose === true || d.hasEgg === true)
                return false;
              break;
            case 'sem_gluten':
            case 'Sem Glúten':
            case 'Sem Gluten':
            case 'sem gluten':
              if (d.hasGluten === true) return false;
              break;
            case 'sem_lactose':
            case 'Sem Lactose':
            case 'sem lactose':
              if (d.hasLactose === true) return false;
              break;
            case 'sem_fritura':
            case 'Sem Fritura':
            case 'Sem Frituras':
            case 'sem_frituras':
            case 'sem fritura':
            case 'sem frituras':
              if (d.usesFrying === true) return false;
              break;
            case 'low_carb':
            case 'Low Carb':
            case 'low carb':
              if (d.lowCarb === false) return false;
              break;
            case 'rico_em_proteina':
            case 'Rico em Proteína':
            case 'Rico em Proteina':
            case 'rico em proteina':
            case 'rico em proteína':
              if (d.highProtein !== true) return false;
              break;
          }
        }
        return true;
      });
    }

    // Filtro por nível culinário
    if (preferences?.cookingLevel) {
      const level = preferences.cookingLevel as string;
      matches = matches.filter((item) => {
        const recipe = (item as any).recipe || item;
        if (level === 'beginner' || level === 'Iniciante') return recipe.difficulty === 'Fácil';
        if (level === 'intermediate' || level === 'Intermediário') return recipe.difficulty === 'Fácil' || recipe.difficulty === 'Médio';
        return true; // chef vê todas
      });
    }

    // Filtro por porções (se o usuário definiu preferência)
    if (preferences?.defaultServings) {
      const s = preferences.defaultServings;
      matches = matches.filter((item) => {
        const recipe = (item as any).recipe || item;
        const bucket = recipe.servingsBucket;
        if (!bucket || bucket === 'unknown') return true;
        if (s === 1) return bucket === '1';
        if (s === 2) return bucket === '2';
        if (s <= 4) return bucket === '3-4';
        return bucket === '5+';
      });
    }

    return matches.sort((a, b) => b.matchPercentage - a.matchPercentage);
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
