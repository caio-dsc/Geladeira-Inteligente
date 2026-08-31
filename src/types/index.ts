export type CategoryType = 
  | 'vegetables' 
  | 'fruits' 
  | 'dairy' 
  | 'proteins' 
  | 'drinks' 
  | 'pantry' 
  | 'condiments' 
  | 'bakery'
  | 'other';

export type FreshnessState =
  | 'fresh'
  | 'frozen';

export type StorageLocation = 'geladeira' | 'freezer' | 'gaveta_legumes' | 'porta' | 'despensa';

export interface FoodItem {
  id: string;
  name: string;
  category: CategoryType;
  quantity: number;
  unit: 'un' | 'kg' | 'g' | 'L' | 'ml' | 'pct' | 'fatias';
  state: FreshnessState;
  location: StorageLocation;
  addedAt: string;
  expiryDate?: string;
  notes?: string;
}

export interface RecipeIngredient {
  name: string;
  quantity: string;
  required: boolean;
  category?: CategoryType;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  prepTimeMinutes: number;
  difficulty: 'Fácil' | 'Médio' | 'Avançado';
  servings: number;
  category: string;
  imageUrl: string;
  ingredients: RecipeIngredient[];
  steps: string[];
  tags: string[];
  caloriesPerServing?: number;
}

export interface RecipeMatch extends Recipe {
  matchedIngredients: string[];
  missingIngredients: string[];
  matchPercentage: number;
  isReadyToCook: boolean;
}

export interface UserPreferences {
  dietaryRestrictions: string[];
  cookingLevel: 'Iniciante' | 'Intermediário' | 'Chef';
  allergies: string[];
  defaultServings: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  credits: number;
  preferences: UserPreferences;
  createdAt: string;
  age?: number | null;
  weightKg?: number | null;
}

export interface DetectedFoodItem {
  id: string;
  name: string;
  category: CategoryType;
  quantity: number;
  unit: 'un' | 'kg' | 'g' | 'L' | 'ml' | 'pct' | 'fatias';
  state: FreshnessState;
  location: StorageLocation;
  confidence: number;
  expiryDate?: string;
  expirySource?: 'image' | 'manual';
  selected: boolean;
}

export interface GemmaDetectedFoodItem {
  name: string;
  category: CategoryType;
  quantity: number;
  unit: 'un' | 'kg' | 'g' | 'L' | 'ml' | 'pct' | 'fatias';
  state: FreshnessState;
  location: StorageLocation | null;
  confidence: number;
  expiryDate: string | null;
  expirySource: 'image' | null;
}

export interface GemmaScanResponse {
  items: GemmaDetectedFoodItem[];
}

export interface ScanSession {
  id: string;
  imageUrl: string;
  timestamp: string;
  status: 'idle' | 'uploading' | 'processing' | 'success' | 'error';
  progressMessage?: string;
  detectedItems: DetectedFoodItem[];
  errorMessage?: string;
}

export type NavigationTab = 'dashboard' | 'scanner' | 'inventory' | 'recipes' | 'profile' | 'admin';
