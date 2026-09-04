import { normalizeText } from './utils';

const hasAny = (hay: string, terms: string[]) =>
  terms.some((t) => hay.includes(normalizeText(t)));

const MEAT = [
  'carne', 'bife', 'frango', 'galinha', 'porco', 'bacon', 'presunto', 'linguiça', 'linguica',
  'calabresa', 'peixe', 'atum', 'salmao', 'salmao', 'camarao', 'camarão', 'sardinha', 'bacalhau',
  'peru', 'pato', 'costela', 'picanha', 'alcatra', 'patinho', 'lombo', 'pernil', 'toucinho',
  'salsicha', 'hamburguer', 'hamburger',
];

const LACTOSE = [
  'leite', 'queijo', 'manteiga', 'nata', 'creme de leite', 'requeijao', 'requeijão', 'iogurte',
  'ricota', 'mussarela', 'mozzarella', 'parmesao', 'parmesão', 'catupiry', 'cream cheese',
  'leite condensado', 'leite em po', 'leite em pó', 'ghee', 'coalhada',
];

const GLUTEN = [
  'farinha de trigo', 'farinha', 'trigo', 'pao', 'pão', 'macarrao', 'macarrão', 'espaguete',
  'massa', 'lasanha', 'nhoque', 'biscoito', 'bolacha', 'farinha de rosca', 'pao ralado',
  'pão ralado', 'aveia', 'cevada', 'centeio', 'semola', 'sêmola', 'pizza',
];

const EGG = ['ovo', 'ovos', 'gema', 'clara'];
const HONEY = ['mel'];

const FRY_STEPS = [
  'fritar', 'frigir', 'frite', 'frito', 'fritura', 'oleo quente', 'óleo quente',
  'imersao', 'imersão', 'deep fry', 'empanar e fritar',
];

const HIGH_PROTEIN = [
  ...MEAT, 'ovo', 'ovos', 'feijao', 'feijão', 'lentilha', 'grao-de-bico', 'grão-de-bico',
  'soja', 'tofu', 'quinoa', 'amendoim', 'whey', 'atum', 'salmao', 'salmão',
];

const LOW_CARB_BAD = [
  'arroz', 'macarrao', 'macarrão', 'farinha', 'trigo', 'batata', 'mandioca', 'aipim',
  'macaxeira', 'feijao', 'feijão', 'milho', 'pao', 'pão', 'acucar', 'açúcar', 'mel',
  'bolo', 'massa', 'tapioca', 'cuscuz',
];

export interface DietFlags {
  hasMeat: boolean;
  hasLactose: boolean;
  hasGluten: boolean;
  hasEgg: boolean;
  vegetarian: boolean;
  vegan: boolean;
  lowCarb: boolean;
  highProtein: boolean;
  usesFrying: boolean;
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

export function computeDietFlags(
  ingredientNames: string[],
  steps: string[] = []
): DietFlags {
  const ing = normalizeText(ingredientNames.join(' '));
  const st = normalizeText(steps.join(' '));

  const hasMeat = hasAny(ing, MEAT);
  const hasLactose = hasAny(ing, LACTOSE);
  const hasGluten = hasAny(ing, GLUTEN);
  const hasEgg = hasAny(ing, EGG);
  const hasHoney = hasAny(ing, HONEY);
  const usesFrying = hasAny(st, FRY_STEPS);
  const highProtein = hasAny(ing, HIGH_PROTEIN);
  const lowCarb = !hasAny(ing, LOW_CARB_BAD);

  const vegetarian = !hasMeat;
  const vegan = vegetarian && !hasLactose && !hasEgg && !hasHoney;

  return {
    hasMeat,
    hasLactose,
    hasGluten,
    hasEgg,
    vegetarian,
    vegan,
    lowCarb,
    highProtein,
    usesFrying,
  };
}
