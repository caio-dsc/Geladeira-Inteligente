const normalizeText = (s: string) =>
  (s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

// Dicionários de ingredientes por grupo dietético
// Divididos por categorias para facilitar manutenção

const MEAT_TERMS = [
  // Carnes
  'carne', 'bife', 'patinho', 'alcatra', 'fraldinha', 'contrafile', 'file mignon',
  'costela', 'picanha', 'acem', 'musculo', 'coxao', 'lagarto',
  // Aves
  'frango', 'galinha', 'peru', 'pato', 'fraldinha', 'coxa', 'sobrecoxa', 'peito de frango',
  // Porco
  'porco', 'bacon', 'panceta', 'linguica', 'calabresa', 'presunto', 'toucinho', 'pernil',
  'lombo', 'costelinha',
  // Frutos do mar
  'peixe', 'atum', 'salmao', 'tilapia', 'bacalhau', 'sardinha', 'camarao', 'lagosta',
  'caranguejo', 'siri', 'lula', 'polvo', 'ostra', 'mexilhao', 'mariscos',
  // En (para TheMealDB que vem em inglês)
  'beef', 'pork', 'chicken', 'turkey', 'duck', 'fish', 'shrimp', 'lamb', 'veal',
  'ham', 'sausage', 'chorizo', 'prawn',
];

const LACTOSE_TERMS = [
  // Laticínios
  'leite', 'queijo', 'manteiga', 'nata', 'creme de leite', 'requeijao', 'iogurte',
  'ricota', 'cream cheese', 'mussarela', 'parmesao', 'gorgonzola', 'brie', 'catupiry',
  'leite condensado', 'leite em po', 'ghee',
  // En
  'milk', 'butter', 'cream', 'cheese', 'yogurt', 'yoghurt', 'whey', 'lactose',
  'mozzarella', 'parmesan', 'cheddar', 'brie',
];

const GLUTEN_TERMS = [
  // Farinhas/massas
  'farinha de trigo', 'farinha', 'trigo', 'semola', 'aveia', 'cevada', 'centeio',
  'espelta', 'farro',
  // Pães/massas prontas
  'pao', 'paozinho', 'baguete', 'torrada', 'biscoito', 'bolacha', 'macarrao',
  'espaguete', 'fettuccine', 'lasanha', 'capeletti', 'ravióli', 'nhoque', 'pizza',
  // Fermentos/espessantes derivados
  'amido de trigo', 'farinha de rosca', 'panko', 'massa folhada',
  // En
  'flour', 'wheat', 'pasta', 'bread', 'noodle', 'spaghetti', 'lasagna', 'oat',
  'barley', 'rye', 'gluten', 'breadcrumb', 'crouton',
];

const EGG_TERMS = [
  'ovo', 'ovos', 'gema', 'clara', 'egg', 'eggs', 'yolk',
];

const HONEY_TERMS = [
  'mel', 'honey',
];

const FRY_TERMS_STEPS = [
  // PT
  'fritar', 'frigir', 'frite', 'frito', 'fritura', 'imersao em oleo',
  'oleo quente', 'oleo fervente', 'deep fry', 'frigideira com oleo',
  // EN
  'fry', 'frying', 'deep fry', 'deep-fry', 'deep fried', 'stir fry',
];

const HIGH_PROTEIN_TERMS = [
  ...MEAT_TERMS,
  'ovo', 'ovos', 'egg', 'eggs',
  'feijao', 'lentilha', 'grao-de-bico', 'soja', 'tofu', 'tempeh',
  'quinoa', 'amendoim', 'amendoa', 'castanha', 'atum', 'salmao',
  'atum', 'sardinha', 'whey', 'proteina',
  'bean', 'lentil', 'chickpea', 'soybean', 'peanut', 'almond',
];

const LOW_CARB_FORBIDDEN = [
  'arroz', 'macarrao', 'farinha', 'trigo', 'batata', 'mandioca', 'aipim', 'macaxeira',
  'feijao', 'milho', 'paes', 'pao', 'acucar', 'mel', 'doce', 'bolo', 'pudim',
  'rice', 'pasta', 'potato', 'bread', 'sugar', 'flour', 'corn', 'bean',
];

function hasAnyTerm(haystack: string, terms: string[]): boolean {
  return terms.some(t => {
    const norm = normalizeText(t);
    return haystack.includes(norm);
  });
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
  steps: string[]
): DietFlags {
  const ingText = normalizeText(ingredientNames.join(' '));
  const stepsText = normalizeText(steps.join(' '));
  const allText = ingText + ' ' + stepsText;

  const hasMeat = hasAnyTerm(ingText, MEAT_TERMS);
  const hasLactose = hasAnyTerm(ingText, LACTOSE_TERMS);
  const hasGluten = hasAnyTerm(ingText, GLUTEN_TERMS);
  const hasEgg = hasAnyTerm(ingText, EGG_TERMS);
  const hasHoney = hasAnyTerm(ingText, HONEY_TERMS);
  const usesFrying = hasAnyTerm(stepsText, FRY_TERMS_STEPS);
  const highProtein = hasAnyTerm(ingText, HIGH_PROTEIN_TERMS);
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
