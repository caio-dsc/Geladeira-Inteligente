import { Recipe, RecipeIngredient, ServingsBucket } from '../../src/types';
import { computeDietFlags } from './dietHeuristics';

const WIKI_API = 'https://pt.wikibooks.org/w/api.php';

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

function cleanWikitext(text: string): string {
  return text
    .replace(/\{\{w\|([^|}]+)(?:\|[^}]+)?\}\}/gi, '$1')
    .replace(/\{\{[^}]+\}\}/g, '')
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]+)\]\]/g, '$1')
    .replace(/'''?/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

function parseWikitextRecipe(title: string, wikitext: string, thumbnail?: string): Recipe | null {
  const cleanTitle = title.replace(/^Livro de receitas\//i, '').trim();
  if (!cleanTitle || cleanTitle.toLowerCase().includes('imprimir') || cleanTitle.toLowerCase().includes('índice')) {
    return null;
  }

  const lines = wikitext.split('\n');
  const ingredients: RecipeIngredient[] = [];
  const steps: string[] = [];

  let inIngredients = false;
  let inSteps = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const cleanHeader = cleanWikitext(trimmed).toLowerCase().replace(/[:=*\s]/g, '');

    // Headers / Section switches
    if (
      cleanHeader.startsWith('ingrediente') ||
      cleanHeader.includes('ingredientesepreparo') ||
      /^={1,4}\s*'*'*ingredientes/i.test(trimmed) ||
      /^[:*#']{0,3}'''Ingredientes/i.test(trimmed)
    ) {
      inIngredients = true;
      inSteps = false;
      continue;
    }
    if (
      cleanHeader.startsWith('preparo') ||
      cleanHeader.startsWith('mododepreparo') ||
      cleanHeader.startsWith('comofazer') ||
      cleanHeader.startsWith('instrucoes') ||
      /^={1,4}\s*'*'*(preparo|modo de preparo|instru)/i.test(trimmed) ||
      /^[:*#']{0,3}'''(Preparo|Modo de preparo)/i.test(trimmed)
    ) {
      inIngredients = false;
      inSteps = true;
      continue;
    }
    if (
      cleanHeader.startsWith('dica') ||
      cleanHeader.startsWith('sugestao') ||
      cleanHeader.startsWith('vejatambem') ||
      cleanHeader.startsWith('referencia') ||
      cleanHeader.startsWith('nota') ||
      /^={1,4}\s*'*'*(dicas?|veja também|referências)/i.test(trimmed) ||
      /^[:*#']{0,3}'''(Dicas?|Sugestão)/i.test(trimmed)
    ) {
      inIngredients = false;
      inSteps = false;
      continue;
    }

    // Capture ingredients (bullet items * or -)
    if (inIngredients && (trimmed.startsWith('*') || trimmed.startsWith('-') || trimmed.startsWith('•'))) {
      const rawItem = cleanWikitext(trimmed.replace(/^[*•-]\s*/, ''));
      if (rawItem.length > 2 && !rawItem.toLowerCase().startsWith('ingrediente')) {
        // Separa quantidade do nome se possível
        const matchQty = rawItem.match(/^([\d/.,]+\s*(?:g|kg|ml|l|xícara|xícaras|colher|colheres|pitada|fatias?|dentes?|unidades?|copos?|latas?|pacotes?|vidro|vidros)?(?:\s*(?:\(chá\)|\(sopa\)|\(sobremesa\)|\(café\)))?)\s*(?:de\s+)?(.*)$/i);
        if (matchQty && matchQty[2]) {
          ingredients.push({
            name: matchQty[2].trim().replace(/;$/, ''),
            quantity: matchQty[1].trim() || '1 porção',
            required: true,
          });
        } else {
          ingredients.push({
            name: rawItem.replace(/;$/, '').trim(),
            quantity: 'a gosto',
            required: true,
          });
        }
      }
    }

    // Capture steps (ordered # or numbered lines or bulleted steps)
    if (inSteps) {
      if (trimmed.startsWith('#') || /^\d+[.)]\s+/.test(trimmed) || trimmed.startsWith('*')) {
        const rawStep = cleanWikitext(trimmed.replace(/^[#*•-]\s*|^\d+[.)]\s*/, ''));
        if (rawStep.length > 5 && !rawStep.toLowerCase().startsWith('preparo')) {
          steps.push(rawStep);
        }
      } else if (trimmed.length > 20 && !trimmed.startsWith('=') && !trimmed.startsWith(':')) {
        const rawStep = cleanWikitext(trimmed);
        if (rawStep.length > 10) {
          steps.push(rawStep);
        }
      }
    }
  }

  if (ingredients.length === 0 || steps.length === 0) {
    return null;
  }

  const lowerTitle = cleanTitle.toLowerCase();
  // Filter out non-food articles
  const NON_FOOD_TERMS = ['amaciante', 'sabonete', 'detergente', 'desinfetante', 'vela', 'shampoo', 'inseticida', 'repelente', 'artesanato', 'limpeza', 'verniz', 'cola'];
  if (NON_FOOD_TERMS.some(t => lowerTitle.includes(t))) {
    return null;
  }

  // Deduce category
  let category = 'Almoço & Jantar';
  if (lowerTitle.includes('bolo') || lowerTitle.includes('doce') || lowerTitle.includes('pudim') || lowerTitle.includes('torta doce') || lowerTitle.includes('calda') || lowerTitle.includes('geleia') || lowerTitle.includes('brigadeiro')) {
    category = 'Sobremesas';
  } else if (lowerTitle.includes('salada')) {
    category = 'Saladas';
  } else if (lowerTitle.includes('sopa') || lowerTitle.includes('creme') || lowerTitle.includes('caldo')) {
    category = 'Sopas & Cremes';
  } else if (lowerTitle.includes('arroz') || lowerTitle.includes('farofa') || lowerTitle.includes('pure') || lowerTitle.includes('molho') || lowerTitle.includes('mandioca frita')) {
    category = 'Acompanhamentos';
  } else if (lowerTitle.includes('macarrao') || lowerTitle.includes('lasanha') || lowerTitle.includes('nhoque') || lowerTitle.includes('massa')) {
    category = 'Massas';
  }

  const diet = computeDietFlags(
    ingredients.map((i) => i.name),
    steps
  );

  const servings = 4;
  const servingsBucket: ServingsBucket = '3-4';

  const defaultImg = thumbnail || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';

  return {
    id: `wikilivros_${canonicalKeyFromTitle(cleanTitle)}`,
    title: cleanTitle,
    description: `Receita tradicional brasileira do Wikilivros • ${category}`,
    prepTimeMinutes: Math.min(90, Math.max(15, steps.length * 8 + ingredients.length * 2)),
    difficulty: ingredients.length > 8 || steps.length > 6 ? 'Médio' : 'Fácil',
    servings,
    servingsBucket,
    category,
    imageUrl: defaultImg,
    ingredients,
    steps,
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

const WIKI_HEADERS = {
  'User-Agent': 'GeladeiraInteligenteBot/1.0 (https://geladeira-inteligente.app; bot@geladeira-inteligente.app)',
  Accept: 'application/json',
};

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

  const pageIds = Array.from(pageIdsSet).slice(0, 60);

  // Processa em lotes de 10
  for (let i = 0; i < pageIds.length; i += 10) {
    const chunk = pageIds.slice(i, i + 10);
    const idsStr = chunk.join('|');
    const queryUrl = `${WIKI_API}?action=query&prop=revisions|pageimages&rvslots=main&rvprop=content&piprop=thumbnail&pithumbsize=800&pageids=${idsStr}&format=json`;

    try {
      const r = await fetch(queryUrl, { headers: WIKI_HEADERS });
      if (!r.ok) continue;
      const data = await r.json();
      const pages = data.query?.pages || {};

      for (const pid of chunk) {
        const page = pages[pid];
        if (!page) continue;
        const wikitext = page.revisions?.[0]?.slots?.main?.['*'];
        if (!wikitext) continue;

        const thumb = page.thumbnail?.source;
        const parsed = parseWikitextRecipe(page.title, wikitext, thumb);
        if (parsed && parsed.ingredients.length > 0 && parsed.steps.length > 0) {
          recipes.push(parsed);
        }
      }
    } catch (err) {
      console.warn('Erro no lote do Wikilivros:', err);
    }
  }

  console.log(`Wikilivros: ${recipes.length} receitas válidas importadas.`);
  return recipes;
}
