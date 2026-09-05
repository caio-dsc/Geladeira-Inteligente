import { normalizeText } from './utils';

/**
 * Casamento seguro de termos com fronteiras de palavra e pontuação.
 * Impede colisões como "porco" em "porções", "mel" em "vermelho" / "cogumelos", "massa" em "amassados".
 */
export function hasTerm(text: string, term: string): boolean {
  const normTerm = normalizeText(term).trim();
  if (!normTerm) return false;

  const escaped = normTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Limite com início/fim da string, espaços ou pontuações comuns
  const regex = new RegExp(
    `(^|[\\s.,;:()\\[\\]/\\-!?"'\`])${escaped}($|[\\s.,;:()\\[\\]/\\-!?"'\`])`,
    'i'
  );

  return regex.test(normalizeText(text));
}

export const hasAny = (hay: string, terms: string[]): boolean =>
  terms.some((t) => hasTerm(hay, t));

export const MEAT = [
  // Carnes vermelhas e suínas
  'carne', 'carnes', 'bife', 'bifes', 'patinho', 'alcatra', 'costela', 'costelinha', 'picanha',
  'lombo', 'pernil', 'toucinho', 'bacon', 'presunto', 'linguica', 'linguiça', 'calabresa', 'paio',
  'carne seca', 'carne-seca', 'carne de sol', 'charque', 'caldo de carne', 'hamburguer', 'hamburger',
  'salsicha', 'salsichas', 'torresmo', 'porco', 'suino', 'suíno',
  // Aves
  'frango', 'frangos', 'galinha', 'peru', 'pato', 'caldo de galinha',
  // Pescados e frutos do mar
  'peixe', 'peixes', 'pescado', 'atum', 'salmao', 'salmão', 'camarao', 'camarão', 'camaroes', 'camarões',
  'sardinha', 'sardinhas', 'bacalhau', 'garoupa', 'pintado', 'surubim', 'tilapia', 'tilápia',
  'pescada', 'merluza', 'corvina', 'robalo', 'tainha', 'dourado', 'cacao', 'cação',
  'lula', 'polvo', 'lagosta', 'caranguejo', 'siri', 'marisco', 'mexilhao', 'mexilhões',
  // Termos em inglês (TheMealDB)
  'meat', 'beef', 'chicken', 'pork', 'sausage', 'fish', 'shrimp', 'shrimps', 'prawn', 'prawns',
  'turkey', 'duck', 'lamb', 'salmon', 'tuna', 'cod'
];

export const LACTOSE = [
  'leite', 'queijo', 'queijos', 'manteiga', 'nata', 'creme de leite', 'requeijao', 'requeijão',
  'iogurte', 'ricota', 'mussarela', 'mozzarella', 'mucarela', 'parmesao', 'parmesão', 'catupiry',
  'cream cheese', 'leite condensado', 'leite em po', 'leite em pó', 'doce de leite', 'ghee',
  'coalhada', 'soro de leite', 'provolone', 'gorgonzola', 'brie', 'queijo coalho', 'queijo minas',
  'meia cura', 'milk', 'butter', 'cheese', 'yogurt'
];

export const GLUTEN = [
  'farinha de trigo', 'farinha de rosca', 'pao ralado', 'pão ralado', 'trigo', 'pao', 'pão',
  'paes', 'pães', 'paozinho', 'pãozinho', 'macarrao', 'macarrão', 'espaguete', 'massa de pastel',
  'massa folhada', 'lasanha', 'nhoque', 'biscoito', 'bolacha', 'cevada', 'centeio', 'semola',
  'sêmola', 'aveia', 'pizza', 'croissant', 'wheat'
];

export const EGG = [
  'ovo', 'ovos', 'gema', 'gemas', 'clara', 'claras', 'maionese', 'mayonnaise'
];

export const HONEY = ['mel'];

export const FRY_STEPS = [
  'imersao', 'imersão', 'fritura por imersao', 'fritura por imersão', 'fritar por imersao',
  'fritar por imersão', 'frito por imersao', 'frito por imersão', 'deep fry', 'deep frying',
  'oleo quente', 'óleo quente', 'oleo bem quente', 'óleo bem quente', 'oleo fervente', 'óleo fervente',
  'oleo abundante', 'óleo abundante', 'oleo suficiente para cobrir', 'óleo suficiente para cobrir',
  'oleo para fritar', 'óleo para fritar', 'fritar em oleo', 'fritar em óleo',
  'empanar e fritar', 'retire com escumadeira', 'retirar com escumadeira', 'escumadeira', 'fritadeira'
];

export const HIGH_PROTEIN = [
  ...MEAT, 'ovo', 'ovos', 'feijao', 'feijão', 'lentilha', 'grao-de-bico', 'grão-de-bico',
  'soja', 'tofu', 'quinoa', 'amendoim', 'whey', 'castanha'
];

export const LOW_CARB_BAD = [
  'arroz', 'macarrao', 'macarrão', 'espaguete', 'lasanha', 'nhoque', 'farinha', 'farinha de trigo',
  'farinha de mandioca', 'farinha de milho', 'farinha de rosca', 'trigo', 'batata', 'batatas',
  'mandioca', 'aipim', 'macaxeira', 'feijao', 'feijão', 'milho', 'pao', 'pão', 'paes', 'pães',
  'acucar', 'açúcar', 'mel', 'bolo', 'bolos', 'tapioca', 'cuscuz', 'polvilho', 'polvilho azedo',
  'polvilho doce', 'leite condensado', 'achocolatado', 'chocolate', 'doce de leite', 'amido',
  'amido de milho', 'maisena', 'maizena', 'aveia'
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
  steps: string[] = [],
  title: string = ''
): DietFlags {
  const ing = normalizeText(ingredientNames.join(' '));
  const st = normalizeText(steps.join(' '));
  const tit = normalizeText(title);

  // Busca carnes/pescados e proteínas no título da receita E na lista de ingredientes
  const meatSearchText = `${tit} ${ing}`;
  const hasMeat = hasAny(meatSearchText, MEAT);

  // Mascara leite/creme de coco para NÃO acusar lactose em pratos como moquecas e vatapás
  const lactoseText = ing
    .replace(/\b(leite (de|do) coco|creme de coco|coconut milk|coconut cream)\b/gi, 'coco vegetal');
  const hasLactose = hasAny(lactoseText, LACTOSE);

  const hasGluten = hasAny(ing, GLUTEN);
  const hasEgg = hasAny(ing, EGG);
  const hasHoney = hasAny(ing, HONEY);

  // Distingue fritura por imersão / óleo quente abundante de refogados e selagem rápida
  const usesFrying = hasAny(st, FRY_STEPS);

  const highProtein = hasAny(meatSearchText, HIGH_PROTEIN);
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

export function getDietaryRestrictionsFromFlags(diet?: DietFlags | null): CanonicalDietaryRestriction[] {
  if (!diet) return [];
  const list: CanonicalDietaryRestriction[] = [];
  if (diet.usesFrying === false) list.push('Sem Frituras');
  if (diet.vegetarian || (!diet.hasMeat && diet.vegetarian !== false)) list.push('Vegetariano');
  if (diet.hasGluten === false) list.push('Sem Glúten');
  if (diet.hasLactose === false) list.push('Sem Lactose');
  if (diet.lowCarb === true) list.push('Low Carb');
  if (diet.vegan === true) list.push('Vegano');
  if (diet.highProtein === true) list.push('Rico em Proteína');
  return list;
}
