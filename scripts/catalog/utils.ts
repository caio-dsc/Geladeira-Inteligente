export const normalizeText = (s: string) =>
  (s || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export function inferCategoryFromTitle(title: string): string {
  const t = normalizeText(title);

  const rules: Array<[RegExp, string]> = [
    // Bebidas (antes de sobremesas por causa de "vitamina", "batida")
    [/\b(suco|vitamina|batida|caipirinha|caipiroska|drink|coquetel|smoothie|cha\b|cafe\b|cappuccino|limonada|refresco|quentao|licor|milkshake|chocolate quente|guarana)\b/, 'Bebidas'],

    // Sobremesas
    [/\b(bolo|torta doce|brigadeiro|beijinho|pudim|mousse|doce|sobremesa|pave|cocada|quindim|rapadura|bem[- ]casado|goiabada|manjar|curau|canjica|arroz doce|pe de moleque|pacoca|sorvete|gelatina|brownie|cookie|biscoito doce|compota|geleia|romeu e julieta|olho de sogra|cajuzinho|bombom|trufa|churros|bolinho de chuva|rabanada|ambrosia|papo de anjo|sonho|cupcake|merengue|suspiro|creme de papaia)\b/, 'Sobremesas'],

    // Sopas & Cremes
    [/\b(sopa|caldo|creme de|canja|cozido|consome|mocoto|caldinho|ensopado|sopao)\b/, 'Sopas & Cremes'],

    // Saladas
    [/\b(salada|vinagrete|salpicao|tabule|maionese de)\b/, 'Saladas'],

    // Café & Lanches
    [/\b(pao|paozinho|pao de queijo|tapioca|cuscuz|bolinho|coxinha|pastel|empada|empadao|esfiha|kibe|quibe|croquete|salgado|sanduiche|hamburguer|misto|torrada|panqueca|crepe|waffle|omelete|ovo mexido|biscoito|rosca|broa|chipa|torresmo|acaraje|pipoca|lanche|petisco|aperitivo|bolinho de bacalhau|joelho|enroladinho)\b/, 'Café & Lanches'],

    // Almoço & Jantar (pratos principais)
    [/\b(feijoada|moqueca|estrogonofe|strogonoff|arroz|feijao|farofa|bobo|vatapa|caruru|baiao|galinhada|frango|carne|bife|picanha|churrasco|costela|lasanha|macarrao|nhoque|risoto|escondidinho|dobradinha|rabada|peixe|camarao|bacalhau|tutu|virado|maniçoba|manicoba|pato no tucupi|tacaca|barreado|carne de sol|buchada|sarapatel|paella|frito|assado|grelhado|refogado|ensopado|guisado|fricasse|panqueca de carne|quiche|torta salgada|polenta|pure|legumes|lentilha|sopa)\b/, 'Almoço & Jantar'],
  ];

  for (const [re, cat] of rules) {
    if (re.test(t)) return cat;
  }
  return 'Outros';
}

export function mapToAppCategory(strCategory?: string): string {
  if (!strCategory) return 'Outros';
  const c = strCategory.trim().toLowerCase();
  if (c === 'dessert' || c === 'sobremesa' || c === 'sobremesas') return 'Sobremesas';
  if (
    c === 'beef' ||
    c === 'chicken' ||
    c === 'lamb' ||
    c === 'pork' ||
    c === 'seafood' ||
    c === 'goat' ||
    c === 'pasta' ||
    c === 'vegan' ||
    c === 'vegetarian'
  ) {
    return 'Almoço & Jantar';
  }
  if (c === 'breakfast' || c === 'starter') return 'Café & Lanches';
  if (c === 'side') return 'Acompanhamentos';
  if (c === 'miscellaneous') return 'Outros';
  return 'Outros';
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



