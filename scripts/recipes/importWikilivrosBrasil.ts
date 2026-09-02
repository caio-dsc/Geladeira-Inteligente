import * as cheerio from 'cheerio';
import { Recipe, RecipeIngredient, ServingsBucket } from '../../src/types';
import { computeDietFlags } from './dietHeuristics';

const WIKI_API = 'https://pt.wikibooks.org/w/api.php';

const WIKI_HEADERS = {
  'User-Agent': 'GeladeiraInteligenteBot/1.0 (https://geladeira-inteligente.app; bot@geladeira-inteligente.app)',
  Accept: 'application/json',
};

async function fetchJson(url: string): Promise<any> {
  try {
    const res = await fetch(url, { headers: WIKI_HEADERS });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn(`Erro ao fazer fetchJson em ${url}:`, err);
    return null;
  }
}

export const normalizeText = (s: string) =>
  (s || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').replace(/\s+/g, ' ').trim();

export const canonicalKeyFromTitle = (rawTitle: string): string => {
  const norm = normalizeText(rawTitle)
    .replace(/^livro de receitas\s*/, '')
    .replace(/^receita de\s*/, '')
    .replace(/^como fazer\s*/, '')
    .trim();

  if (/^(estrogonofe|strogonoff|stroganoff|beef stroganoff|strogonofe)/.test(norm)) {
    if (norm.includes('frango') || norm.includes('chicken')) return 'estrogonofe-de-frango';
    if (norm.includes('chocolate')) return 'estrogonofe-de-chocolate';
    if (norm.includes('legumes') || norm.includes('vegetais')) return 'estrogonofe-de-legumes';
    return 'estrogonofe';
  }
  if (/^(acaraje|acaraje black-eyed)/.test(norm)) return 'acaraje';
  if (/^(feijoada|black bean & meat stew - feijoada|feijoada completa)/.test(norm)) return 'feijoada';
  if (/^(pao de queijo|brazilian cheese bread)/.test(norm)) return 'pao-de-queijo';
  if (/^(brigadeiro|brazilian chocolate truffles)/.test(norm)) return 'brigadeiro';
  if (/^(moqueca|bahia-style moqueca)/.test(norm)) return 'moqueca-baiana';
  if (/^(quindim|coconut quindim)/.test(norm)) return 'quindim';
  if (/^(bolo de cenoura|brazilian carrot cake)/.test(norm)) return 'bolo-de-cenoura';
  if (/^(coxinha|brazilian chicken croquettes)/.test(norm)) return 'coxinha';
  if (/^(baiao de dois)/.test(norm)) return 'baiao-de-dois';
  if (/^(salada tropical)/.test(norm)) return 'salada-tropical';
  if (/^(omelete|omelet)/.test(norm)) return 'omelete';

  return norm.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
};

/**
 * 2.1 Buscar seções da página via MediaWiki parse API
 */
export async function getSections(title: string) {
  const url = new URL(WIKI_API);
  url.searchParams.set('action', 'parse');
  url.searchParams.set('format', 'json');
  url.searchParams.set('formatversion', '2');
  url.searchParams.set('page', title);
  url.searchParams.set('prop', 'sections');

  const data = await fetchJson(url.toString());
  return (data?.parse?.sections || []) as Array<{ index: string; line: string }>;
}

/**
 * 2.2 Buscar HTML só de uma seção via MediaWiki parse API
 */
export async function getSectionHtml(title: string, sectionIndex: string) {
  const url = new URL(WIKI_API);
  url.searchParams.set('action', 'parse');
  url.searchParams.set('format', 'json');
  url.searchParams.set('formatversion', '2');
  url.searchParams.set('page', title);
  url.searchParams.set('prop', 'text');
  url.searchParams.set('section', sectionIndex);

  const data = await fetchJson(url.toString());
  return (data?.parse?.text || '') as string;
}

/**
 * Helper para limpeza e deduplicação de textos HTML
 */
function cleanText(s: string) {
  return (s || '')
    .replace(/\s+/g, ' ')
    .replace(/\[[^\]]*\]/g, '') // remove [1], [2] etc.
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function normalizeKey(s: string) {
  return (s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function dedupeStrings(items: string[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const it of items) {
    const k = normalizeKey(it);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(it);
  }
  return out;
}

function extractListItems(html: string, selector: string) {
  const $ = cheerio.load(html);
  // remove elementos que geram sujeira
  $('sup.reference, .mw-editsection, .navbox, .catlinks').remove();

  const items = $(selector)
    .map((_, el) => cleanText($(el).text()))
    .get()
    .filter(Boolean);

  return dedupeStrings(items);
}

function parseIngredientLine(rawItem: string): RecipeIngredient | null {
  const cleaned = cleanText(rawItem);
  if (cleaned.length < 2 || cleaned.toLowerCase().startsWith('ingrediente')) {
    return null;
  }

  const matchQty = cleaned.match(
    /^([\d/.,]+\s*(?:g|kg|ml|l|xícara|xícaras|colher|colheres|pitada|fatias?|dentes?|unidades?|copos?|latas?|pacotes?|vidro|vidros)?(?:\s*(?:\(chá\)|\(sopa\)|\(sobremesa\)|\(café\)))?)\s*(?:de\s+)?(.*)$/i
  );

  if (matchQty && matchQty[2]) {
    return {
      name: matchQty[2].trim().replace(/;$/, ''),
      quantity: matchQty[1].trim() || '1 porção',
      required: true,
    };
  }

  return {
    name: cleaned.replace(/;$/, '').trim(),
    quantity: 'a gosto',
    required: true,
  };
}

export async function parseRecipeFromSections(title: string, thumbnail?: string): Promise<Recipe | null> {
  const cleanTitle = title.replace(/^Livro de receitas\//i, '').trim();
  if (!cleanTitle || cleanTitle.toLowerCase().includes('imprimir') || cleanTitle.toLowerCase().includes('índice')) {
    return null;
  }

  const lowerTitle = cleanTitle.toLowerCase();
  // Filter out non-food articles
  const NON_FOOD_TERMS = ['amaciante', 'sabonete', 'detergente', 'desinfetante', 'vela', 'shampoo', 'inseticida', 'repelente', 'artesanato', 'limpeza', 'verniz', 'cola'];
  if (NON_FOOD_TERMS.some((t) => lowerTitle.includes(t))) {
    return null;
  }

  const sections = await getSections(title);

  const ingSection = sections.find((s) => /ingredientes/i.test(s.line));
  const prepSection = sections.find((s) => /(preparo|preparação)/i.test(s.line));

  if (!ingSection || !prepSection) {
    console.log(`  - ${cleanTitle}: sem seção Ingredientes/Preparo, pulando`);
    return null;
  }

  const ingHtml = await getSectionHtml(title, ingSection.index);
  const prepHtml = await getSectionHtml(title, prepSection.index);

  const ingLines = extractListItems(ingHtml, 'li');
  let stepLines = extractListItems(prepHtml, 'li');
  if (stepLines.length === 0) {
    stepLines = extractListItems(prepHtml, 'p, dd');
  }

  const isGarbage = (s: string) =>
    /https?:\/\//i.test(s) || /categoria:/i.test(s) || /wikilivros/i.test(s);

  const rawIngredientsClean = ingLines.filter((raw) => !isGarbage(raw));
  const rawStepsClean = stepLines.filter((raw) => !isGarbage(raw));

  const ingredients: RecipeIngredient[] = rawIngredientsClean
    .filter((raw) => raw.length > 2 && !raw.toLowerCase().startsWith('ingrediente'))
    .map((raw) => ({
      name: raw.replace(/;$/, '').trim(),
      quantity: '',
      required: true,
    }));

  const steps = dedupeStrings(rawStepsClean.filter((s) => s.length > 5 && !s.toLowerCase().startsWith('preparo')));

  const ingredientsClean = ingredients.filter((i) => !isGarbage(i.name));
  const stepsClean = steps.filter((s) => !isGarbage(s));

  if (ingredientsClean.length < 3 || stepsClean.length < 2) {
    console.log(`  - ${cleanTitle}: descartada pelo quality gate (ing: ${ingredientsClean.length}, steps: ${stepsClean.length}), pulando`);
    return null;
  }

  // Deduce category
  let category = 'Almoço & Jantar';
  if (
    lowerTitle.includes('bolo') ||
    lowerTitle.includes('doce') ||
    lowerTitle.includes('pudim') ||
    lowerTitle.includes('torta doce') ||
    lowerTitle.includes('calda') ||
    lowerTitle.includes('geleia') ||
    lowerTitle.includes('brigadeiro')
  ) {
    category = 'Sobremesas';
  } else if (lowerTitle.includes('salada')) {
    category = 'Saladas';
  } else if (lowerTitle.includes('sopa') || lowerTitle.includes('creme') || lowerTitle.includes('caldo')) {
    category = 'Sopas & Cremes';
  } else if (
    lowerTitle.includes('arroz') ||
    lowerTitle.includes('farofa') ||
    lowerTitle.includes('pure') ||
    lowerTitle.includes('molho') ||
    lowerTitle.includes('mandioca frita')
  ) {
    category = 'Acompanhamentos';
  } else if (lowerTitle.includes('macarrao') || lowerTitle.includes('lasanha') || lowerTitle.includes('nhoque') || lowerTitle.includes('massa')) {
    category = 'Massas';
  }

  const diet = computeDietFlags(
    ingredientsClean.map((i) => i.name),
    stepsClean
  );

  const servings = 4;
  const servingsBucket: ServingsBucket = '3-4';

  const defaultImg = thumbnail || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';

  return {
    id: `wikilivros_${canonicalKeyFromTitle(cleanTitle)}`,
    title: cleanTitle,
    description: `Receita tradicional brasileira do Wikilivros • ${category}`,
    prepTimeMinutes: Math.min(90, Math.max(15, stepsClean.length * 8 + ingredientsClean.length * 2)),
    difficulty: ingredientsClean.length > 8 || stepsClean.length > 6 ? 'Médio' : 'Fácil',
    servings,
    servingsBucket,
    category,
    imageUrl: defaultImg,
    ingredients: ingredientsClean,
    steps: stepsClean,
    tags: [category, 'Tradicional', 'Wikilivros'],
    caloriesPerServing: Math.round(200 + ingredients.length * 35),
    canonicalKey: canonicalKeyFromTitle(cleanTitle),
    originArea: 'Brazilian',
    originCountry: 'Brazil',
    diet,
    sources: [
      {
        sourceId: 'wikilivros',
        url: `https://pt.wikibooks.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`,
        license: 'CC BY-SA 4.0 / GFDL',
        attribution: `Wikilivros (pt.wikibooks.org) - Contribuidores de "${cleanTitle}"`,
      },
    ],
  };
}

export async function fetchWikilivrosBrazilianRecipes(): Promise<Recipe[]> {
  const recipes: Recipe[] = [];

  // Categorias de culinária brasileira no Wikibooks
  const categoriesToFetch = [
    'Categoria:Culinária_do_Brasil',
    'Categoria:Receitas_do_Brasil',
  ];

  const pageIdsSet = new Set<number>();
  const pageTitlesMap = new Map<number, string>();

  for (const cat of categoriesToFetch) {
    try {
      const url = `${WIKI_API}?action=query&list=categorymembers&cmtitle=${encodeURIComponent(cat)}&cmlimit=100&format=json`;
      const res = await fetch(url, { headers: WIKI_HEADERS });
      if (!res.ok) continue;
      const data = await res.json();
      const members = data.query?.categorymembers || [];
      for (const m of members) {
        if (m.ns === 0 && !pageIdsSet.has(m.pageid)) {
          pageIdsSet.add(m.pageid);
          pageTitlesMap.set(m.pageid, m.title);
        }
      }
    } catch (e) {
      console.warn(`Erro ao listar categoria ${cat}:`, e);
    }
  }

  // Também puxa receitas sob o prefixo "Livro de receitas/" com pratos brasileiros emblemáticos
  const prefixes = [
    'Livro de receitas/Strogonoff',
    'Livro de receitas/Estrogonofe',
    'Livro de receitas/Coxinha',
    'Livro de receitas/Brigadeiro',
    'Livro de receitas/Feijoada',
    'Livro de receitas/Moqueca',
    'Livro de receitas/Pão de queijo',
    'Livro de receitas/Acarajé',
    'Livro de receitas/',
  ];

  for (const prefix of prefixes) {
    try {
      const url = `${WIKI_API}?action=query&list=allpages&apprefix=${encodeURIComponent(prefix)}&aplimit=40&format=json`;
      const res = await fetch(url, { headers: WIKI_HEADERS });
      if (res.ok) {
        const data = await res.json();
        const allpages = data.query?.allpages || [];
        for (const p of allpages) {
          if (!pageIdsSet.has(p.pageid)) {
            pageIdsSet.add(p.pageid);
            pageTitlesMap.set(p.pageid, p.title);
          }
        }
      }
    } catch (e) {
      console.warn(`Erro ao listar allpages do prefixo ${prefix}:`, e);
    }
  }

  console.log(`Wikilivros: Total de páginas candidatas a processar: ${pageIdsSet.size}`);

  const pageEntries = Array.from(pageTitlesMap.entries()).slice(0, 45);

  // Processa as páginas com getSections e getSectionHtml
  for (const [_, title] of pageEntries) {
    try {
      const parsed = await parseRecipeFromSections(title);
      if (parsed && parsed.ingredients.length > 0 && parsed.steps.length > 0) {
        recipes.push(parsed);
      }
    } catch (err) {
      console.warn(`Wikilivros: Erro ao parsear seções de ${title}:`, err);
    }
  }

  console.log(`Wikilivros: ${recipes.length} receitas válidas importadas via MediaWiki parse.`);
  return recipes;
}

