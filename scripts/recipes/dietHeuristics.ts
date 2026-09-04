const normalizeText = (s: string) =>
  (s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ');

// Dicionários de ingredientes e termos por grupo dietético (Português e Inglês)

const MEAT_TERMS = [
  // Bovinos, ovinos e carnes vermelhas (PT)
  'carne', 'carnes', 'bife', 'bifes', 'patinho', 'alcatra', 'fraldinha', 'contrafile',
  'file mignon', 'costela', 'costelinha', 'picanha', 'acem', 'musculo', 'coxao',
  'coxao mole', 'coxao duro', 'lagarto', 'cupim', 'maminha', 'carne seca', 'carne de sol',
  'charque', 'carne moida', 'vitela', 'cabrito', 'cordeiro',
  // Aves (PT)
  'frango', 'frangos', 'galinha', 'peru', 'pato', 'coxa de frango', 'sobrecoxa',
  'peito de frango', 'asas de frango', 'coracao de galinha', 'chester',
  // Suínos e embutidos (PT)
  'porco', 'bacon', 'panceta', 'linguica', 'calabresa', 'paio', 'presunto', 'toucinho',
  'torresmo', 'pernil', 'lombo', 'salame', 'salsicha', 'pepperoni', 'mortadela', 'banha',
  // Pescados e frutos do mar (PT)
  'peixe', 'peixes', 'atum', 'salmao', 'tilapia', 'bacalhau', 'sardinha', 'merluza',
  'pescada', 'camarao', 'camaroes', 'lagosta', 'caranguejo', 'siri', 'lula', 'polvo',
  'ostra', 'ostras', 'mexilhao', 'mexilhoes', 'mariscos', 'sururu',
  // Carnes, aves e pescados (EN)
  'meat', 'beef', 'steak', 'steaks', 'pork', 'chicken', 'turkey', 'duck', 'lamb', 'veal',
  'ham', 'bacon', 'sausage', 'sausages', 'chorizo', 'pepperoni', 'salami', 'lard',
  'fish', 'salmon', 'tuna', 'cod', 'tilapia', 'sardine', 'sardines', 'shrimp', 'shrimps',
  'prawn', 'prawns', 'lobster', 'crab', 'squid', 'octopus', 'oyster', 'oysters', 'mussel', 'mussels', 'clam'
];

const LACTOSE_TERMS = [
  // Laticínios (PT)
  'leite', 'queijo', 'queijos', 'manteiga', 'nata', 'creme de leite', 'requeijao', 'iogurte',
  'ricota', 'cream cheese', 'mussarela', 'mucarela', 'parmesao', 'gorgonzola', 'provolone',
  'brie', 'gouda', 'queijo prato', 'queijo coalho', 'queijo minas', 'meia cura', 'catupiry',
  'leite condensado', 'leite em po', 'doce de leite', 'soro de leite', 'coalhada', 'ghee',
  // Laticínios (EN)
  'milk', 'butter', 'cream', 'heavy cream', 'sour cream', 'cheese', 'cheeses', 'yogurt',
  'yoghurt', 'whey', 'lactose', 'mozzarella', 'parmesan', 'cheddar', 'brie', 'provolone',
  'ricotta', 'condensed milk', 'buttermilk', 'curd'
];

const GLUTEN_TERMS = [
  // Farinhas e grãos com glúten (PT)
  'farinha de trigo', 'trigo', 'semola', 'semolina', 'cevada', 'centeio', 'aveia',
  'espelta', 'malte', 'cerveja', 'farelo de trigo', 'amido de trigo',
  // Massas e panificados (PT)
  'pao', 'paes', 'paozinho', 'baguete', 'torrada', 'torradas', 'biscoito', 'biscoitos',
  'bolacha', 'bolachas', 'macarrao', 'espaguete', 'fettuccine', 'lasanha', 'capeletti',
  'ravioli', 'nhoque', 'pizza', 'massa folhada', 'massa de pastel', 'farinha de rosca',
  'panko', 'croissant', 'shoyu', 'molho de soja',
  // Farinhas e massas com glúten (EN)
  'flour', 'wheat', 'wheat flour', 'pasta', 'bread', 'breads', 'noodle', 'noodles',
  'spaghetti', 'lasagna', 'lasagne', 'oat', 'oats', 'barley', 'rye', 'gluten',
  'breadcrumb', 'breadcrumbs', 'crouton', 'croutons', 'panko', 'soy sauce', 'malt', 'pastry', 'dough'
];

const EGG_TERMS = [
  // Ovos (PT)
  'ovo', 'ovos', 'gema', 'gemas', 'clara', 'claras', 'maionese',
  // Ovos (EN)
  'egg', 'eggs', 'yolk', 'yolks', 'egg white', 'egg whites', 'mayonnaise'
];

const HONEY_TERMS = [
  // Mel (PT)
  'mel', 'favo de mel', 'melado',
  // Mel (EN)
  'honey'
];

const FRY_TERMS_STEPS = [
  // Termos de fritura em etapas e preparo (PT)
  'fritar', 'fritura', 'frito', 'fritos', 'frita', 'fritas', 'frigir', 'frite', 'fritando',
  'oleo quente', 'oleo fervente', 'imersao em oleo', 'em imersao', 'frigideira com oleo',
  'oleo abundante', 'fritadeira', 'dourar no oleo',
  // Termos de fritura (EN)
  'fry', 'frying', 'fried', 'deep fry', 'deep-fry', 'deep fried', 'deep-fried',
  'stir fry', 'stir-fry', 'pan fry', 'pan-fry', 'shallow fry'
];

const HIGH_PROTEIN_TERMS = [
  ...MEAT_TERMS,
  // Ovos
  'ovo', 'ovos', 'clara', 'claras', 'egg', 'eggs', 'egg white', 'egg whites',
  // Leguminosas e fontes vegetais ricas em proteína (PT/EN)
  'feijao', 'feijoes', 'lentilha', 'lentilhas', 'grao-de-bico', 'soja', 'tofu', 'tempeh',
  'edamame', 'ervilha', 'ervilhas', 'quinoa', 'amendoim', 'amendoas', 'castanha', 'castanhas',
  'nozes', 'whey', 'proteina', 'ricota', 'cottage',
  'bean', 'beans', 'lentil', 'lentils', 'chickpea', 'chickpeas', 'soy', 'soybean',
  'peanut', 'peanuts', 'almond', 'almonds', 'cashew', 'walnut', 'protein'
];

const LOW_CARB_FORBIDDEN = [
  // Amidos, grãos ricos em carbo e açúcares (PT)
  'arroz', 'macarrao', 'espaguete', 'lasanha', 'nhoque', 'massa', 'farinha', 'trigo',
  'batata', 'batatas', 'batata-doce', 'mandioca', 'aipim', 'macaxeira', 'milho', 'fuba',
  'polvilho', 'tapioca', 'feijao', 'cuscuz', 'aveia', 'pao', 'paes', 'paozinho', 'torrada',
  'biscoito', 'bolacha', 'acucar', 'mel', 'melado', 'doce', 'doces', 'bolo', 'bolos',
  'torta doce', 'pudim', 'leite condensado', 'banana', 'bananas',
  // Amidos, grãos e açúcares (EN)
  'rice', 'pasta', 'noodle', 'noodles', 'spaghetti', 'bread', 'potato', 'potatoes',
  'sweet potato', 'sugar', 'flour', 'corn', 'cornmeal', 'bean', 'beans', 'cassava',
  'tapioca', 'oat', 'oats', 'cereal', 'cake', 'cookies', 'cookie', 'candy', 'honey'
];

function hasAnyTerm(haystack: string, terms: string[]): boolean {
  for (const t of terms) {
    const norm = normalizeText(t);
    if (!norm) continue;
    // Word-boundary regex matching to avoid substring collision (e.g. 'mel' inside 'cogumelo')
    const escaped = norm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (regex.test(haystack)) {
      return true;
    }
  }
  return false;
}

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

export function computeDietFlags(
  ingredientNames: string[],
  steps: string[] = []
): DietFlags {
  const ingText = normalizeText(ingredientNames.join(' '));
  const stepsText = normalizeText(steps.join(' '));
  const allText = `${ingText} ${stepsText}`;

  const hasMeat = hasAnyTerm(ingText, MEAT_TERMS) || hasAnyTerm(allText, ['bacon', 'presunto', 'linguica', 'calabresa', 'frango', 'peixe', 'carne']);
  const hasLactose = hasAnyTerm(ingText, LACTOSE_TERMS) || hasAnyTerm(allText, ['leite condensado', 'creme de leite', 'manteiga', 'queijo ralado']);
  const hasGluten = hasAnyTerm(ingText, GLUTEN_TERMS) || hasAnyTerm(allText, ['farinha de trigo', 'farinha de rosca']);
  const hasEgg = hasAnyTerm(ingText, EGG_TERMS) || hasAnyTerm(allText, ['gemas batidas', 'claras em neve']);
  const hasHoney = hasAnyTerm(ingText, HONEY_TERMS);
  const usesFrying = hasAnyTerm(stepsText, FRY_TERMS_STEPS) || hasAnyTerm(ingText, ['oleo para fritar', 'oleo de fritura']);
  const highProtein = hasAnyTerm(ingText, HIGH_PROTEIN_TERMS) || hasMeat;
  const lowCarb = !hasAnyTerm(ingText, LOW_CARB_FORBIDDEN);

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


