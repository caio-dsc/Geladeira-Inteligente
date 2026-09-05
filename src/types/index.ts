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
  nameKey?: string;
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
  nameOriginal?: string;
  quantity: string;
  required: boolean;
  category?: CategoryType;
}

export type ServingsBucket = '1' | '2' | '3-4' | '5+' | 'unknown';

export interface RecipeSource {
  sourceId: 'themealdb' | 'wikilivros' | 'wikibooks' | 'custom';
  url?: string;
  externalId?: string;
  license?: string;
  attribution?: string;
}

export interface RecipeDietFlags {
  hasMeat?: boolean;
  hasLactose?: boolean;
  hasGluten?: boolean;
  hasEgg?: boolean;
  vegetarian?: boolean;
  vegan?: boolean;
  lowCarb?: boolean;
  highProtein?: boolean;
  usesFrying?: boolean;
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
  canonicalKey?: string;      // chave normalizada para dedupe
  aliases?: string[];         // variações do nome
  servingsBucket?: ServingsBucket;
  sources?: RecipeSource[];
  diet?: RecipeDietFlags;
  originArea?: string;        // ex: Brazilian
  originCountry?: string;     // ex: Brazil
}

export interface RecipeMatch extends Recipe {
  matchedIngredients: string[];
  missingIngredients: string[];
  matchPercentage: number;
  isReadyToCook: boolean;
}

export type CanonicalDietaryRestriction =
  | 'Sem Frituras'
  | 'Vegetariano'
  | 'Sem Glúten'
  | 'Sem Lactose'
  | 'Low Carb'
  | 'Vegano'
  | 'Rico em Proteína';

export const CANONICAL_DIETARY_RESTRICTIONS: readonly CanonicalDietaryRestriction[] = [
  'Sem Frituras',
  'Vegetariano',
  'Sem Glúten',
  'Sem Lactose',
  'Low Carb',
  'Vegano',
  'Rico em Proteína',
] as const;

export interface UserPreferences {
  dietaryRestrictions: (CanonicalDietaryRestriction | string)[];
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
  isAdmin?: boolean;
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
