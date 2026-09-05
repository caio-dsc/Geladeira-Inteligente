import fs from 'fs';
import path from 'path';
import { Recipe, RecipeIngredient, RecipeSource, ServingsBucket } from '../../src/types';
import { computeDietFlags } from '../catalog/dietHeuristics';
import { fetchWikilivrosBrazilianRecipes, canonicalKeyFromTitle, normalizeText } from './importWikilivrosBrasil';
import { translateIngredient } from '../catalog/ingredientDictionary';
import { inferCategoryFromTitle, mapToAppCategory } from '../catalog/utils';

const MEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';

const servingsBucketFromServings = (servings: number): ServingsBucket => {
  if (servings === 1) return '1';
  if (servings === 2) return '2';
  if (servings <= 4) return '3-4';
  return '5+';
};

function difficultyFromHeuristics(ingredientCount: number, stepCount: number): 'Fácil' | 'Médio' | 'Avançado' {
  let score = 0;
  if (ingredientCount >= 10) score++;
  if (ingredientCount >= 15) score++;
  if (stepCount >= 8) score++;
  if (stepCount >= 12) score++;
  if (score <= 1) return 'Fácil';
  if (score <= 3) return 'Médio';
  return 'Avançado';
}

function extractTheMealDBIngredients(meal: any): RecipeIngredient[] {
  const ingredients: RecipeIngredient[] = [];
  for (let i = 1; i <= 20; i++) {
    const ing = (meal[`strIngredient${i}`] || '').trim();
    const meas = (meal[`strMeasure${i}`] || '').trim();
    if (!ing) continue;
    const translatedName = translateIngredient(ing);
    ingredients.push({
      name: translatedName,
      nameOriginal: ing,
      quantity: meas || 'a gosto',
      required: true,
    });
  }
  return ingredients;
}

function extractTheMealDBSteps(meal: any): string[] {
  const txt = (meal.strInstructions || '').trim();
  if (!txt) return [];
  const lines = txt.split('\n').map((l: string) => l.trim()).filter(Boolean);
  if (lines.length >= 2) return lines;
  return txt.split('.').map((s: string) => s.trim()).filter((s: string) => s.length > 5);
}

async function importTheMealDBBrazilian(): Promise<Recipe[]> {
  const recipes: Recipe[] = [];
  console.log('TheMealDB: Buscando receitas brasileiras e pratos populares...');

  const mealSummariesMap = new Map<string, any>();

  // 1. Categoria Brasileira
  try {
    const res = await fetch(`${MEALDB_BASE}/filter.php?a=Brazilian`);
    if (res.ok) {
      const data = await res.json();
      for (const m of data.meals || []) {
        mealSummariesMap.set(m.idMeal, m);
      }
    }
  } catch (e) {
    console.warn('TheMealDB: Erro ao buscar por Brazilian:', e);
  }

  // 2. Busca adicional por clássicos da culinária brasileira/fusão como Stroganoff
  const searches = ['Stroganoff', 'Moqueca', 'Feijoada'];
  for (const q of searches) {
    try {
      const res = await fetch(`${MEALDB_BASE}/search.php?s=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        for (const m of data.meals || []) {
          mealSummariesMap.set(m.idMeal, m);
        }
      }
    } catch (e) {
      console.warn(`TheMealDB: Erro ao buscar ${q}:`, e);
    }
  }

  console.log(`TheMealDB: Encontrados ${mealSummariesMap.size} pratos.`);

  for (const s of Array.from(mealSummariesMap.values())) {
    try {
      const r = await fetch(`${MEALDB_BASE}/lookup.php?i=${s.idMeal}`);
      if (!r.ok) continue;
      const data = await r.json();
      const meal = data.meals?.[0];
      if (!meal) continue;

      const ingredients = extractTheMealDBIngredients(meal);
      const steps = extractTheMealDBSteps(meal);
      const diet = computeDietFlags(
        ingredients.map((x) => x.name),
        steps,
        meal.strMeal
      );

      // Imagem com /medium conforme doc TheMealDB
      const rawThumb = meal.strMealThumb || s.strMealThumb || '';
      const imageUrl = rawThumb ? `${rawThumb}/medium` : '';

      const servings = 2;
      const key = canonicalKeyFromTitle(meal.strMeal);
      const title = meal.strMeal;
      const catFromApi = mapToAppCategory(meal.strCategory);
      const category =
        catFromApi === 'Outros' || /miscellaneous|side/i.test(meal.strCategory || '')
          ? inferCategoryFromTitle(title)
          : catFromApi;

      const recipe: Recipe = {
        id: `themealdb_${meal.idMeal}`,
        title: meal.strMeal,
        description: `${meal.strCategory || 'Prato Tradicional'} • ${category}`,
        prepTimeMinutes: 35,
        difficulty: difficultyFromHeuristics(ingredients.length, steps.length),
        servings,
        servingsBucket: servingsBucketFromServings(servings),
        category,
        imageUrl: imageUrl || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
        ingredients,
        steps,
        tags: [
          meal.strCategory || 'Brasileira',
          ...(diet.vegan ? ['Vegano'] : []),
          ...(diet.vegetarian && !diet.vegan ? ['Vegetariano'] : []),
          ...(diet.hasGluten === false ? ['Sem Glúten'] : []),
          ...(diet.hasLactose === false ? ['Sem Lactose'] : []),
          ...(diet.usesFrying === false ? ['Sem Frituras'] : []),
          ...(diet.lowCarb ? ['Low Carb'] : []),
          ...(diet.highProtein ? ['Rico em Proteína'] : []),
        ],
        caloriesPerServing: 380,
        canonicalKey: key,
        aliases: [meal.strMeal],
        originArea: meal.strArea || 'Brazilian',
        originCountry: 'Brazil',
        diet,
        sources: [
          {
            sourceId: 'themealdb',
            externalId: meal.idMeal,
            url: `https://www.themealdb.com/meal/${meal.idMeal}`,
            license: 'TheMealDB Free API',
            attribution: 'TheMealDB.com Open Recipe Database',
          },
        ],
      };

      recipes.push(recipe);
    } catch (err) {
      console.warn(`TheMealDB: Erro ao processar idMeal ${s.idMeal}:`, err);
    }
  }

  const untranslated = new Set<string>();
  for (const r of recipes) {
    for (const ing of r.ingredients) {
      if (ing.name === ing.nameOriginal && /^[a-z\s-]+$/i.test(ing.nameOriginal)) {
        untranslated.add(ing.nameOriginal);
      }
    }
  }
  if (untranslated.size) {
    console.log('\n[TheMealDB] Ingredientes SEM tradução (adicione ao dicionário):');
    console.log([...untranslated].sort().join(', '), '\n');
  }

  return recipes;
}

const fetchTheMealDBBrazilian = importTheMealDBBrazilian;

// Catálogo base de referência brasileiro de alta qualidade
const FOUNDATION_RECIPES: Recipe[] = [
  {
    id: "feijoada-completa-tradicional",
    title: "Feijoada Completa Tradicional",
    description: "Clássica feijoada brasileira com feijão preto, carnes nobres defumadas e tempero generoso de alho e louro.",
    prepTimeMinutes: 90,
    difficulty: "Médio",
    servings: 6,
    category: "Almoço & Jantar",
    imageUrl: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=1000&q=80",
    ingredients: [
      { name: "Feijão Preto", quantity: "500g", required: true, category: "pantry" },
      { name: "Carne Seca", quantity: "300g", required: true, category: "proteins" },
      { name: "Costelinha de Porco", quantity: "300g", required: true, category: "proteins" },
      { name: "Linguiça Calabresa", quantity: "200g", required: true, category: "proteins" },
      { name: "Bacon", quantity: "150g", required: false, category: "proteins" },
      { name: "Alho", quantity: "5 dentes", required: true, category: "vegetables" },
      { name: "Cebola", quantity: "2 unidades", required: true, category: "vegetables" },
      { name: "Folhas de Louro", quantity: "3 folhas", required: false, category: "condiments" }
    ],
    steps: [
      "Dessalgue as carnes em água fria na geladeira por pelo menos 12 horas trocando a água.",
      "Cozinhe o feijão preto com as carnes mais duras na panela de pressão por cerca de 30 minutos.",
      "Adicione as linguiças e o bacon fatiados e cozinhe por mais 15 minutos até tudo ficar macio.",
      "Em uma frigideira à parte, doure o alho e a cebola picada no azeite.",
      "Adicione uma concha do feijão à frigideira, amasse para engrossar e devolva à panela principal.",
      "Deixe apurar em fogo baixo por 10 minutos com o louro até o caldo encorpar."
    ],
    tags: ["Prato Típico", "Carnes", "Tradicional", "Fim de Semana"],
    caloriesPerServing: 520,
    canonicalKey: "feijoada-completa-tradicional",
    servingsBucket: "5+",
    originArea: "Brazilian",
    originCountry: "Brazil",
    diet: {
      hasMeat: true,
      hasLactose: false,
      hasGluten: false,
      hasEgg: false,
      vegetarian: false,
      vegan: false,
      lowCarb: false,
      highProtein: true,
      usesFrying: false
    },
    sources: [
      {
        sourceId: "custom",
        license: "Public Domain / CC0",
        attribution: "Geladeira Inteligente Catalog"
      }
    ]
  },
  {
    id: "pao-de-queijo-mineiro",
    title: "Pão de Queijo Mineiro Crocante",
    description: "Autêntico pão de queijo com polvilho azedo e queijo Minas curado, casquinha crocante e miolo puxa-puxa.",
    prepTimeMinutes: 35,
    difficulty: "Fácil",
    servings: 4,
    category: "Acompanhamentos",
    imageUrl: "https://images.unsplash.com/photo-1598142981313-0973a213e4b7?auto=format&fit=crop&w=1000&q=80",
    ingredients: [
      { name: "Polvilho Azedo", quantity: "500g", required: true, category: "pantry" },
      { name: "Queijo Minas ou Meia Cura", quantity: "300g ralado", required: true, category: "dairy" },
      { name: "Ovos", quantity: "3 unidades", required: true, category: "proteins" },
      { name: "Leite", quantity: "1 xícara", required: true, category: "dairy" },
      { name: "Óleo", quantity: "1/2 xícara", required: true, category: "pantry" },
      { name: "Sal", quantity: "1 colher de chá", required: false, category: "condiments" }
    ],
    steps: [
      "Ferva o leite com o óleo e o sal em uma panela pequena.",
      "Despeje a mistura fervente sobre o polvilho em uma tigela grande para escaldar, misturando com uma colher.",
      "Deixe a massa amornar e acrescente os ovos um a um, sovando bem.",
      "Incorpore o queijo ralado até formar uma massa homogênea e maleável.",
      "Modele bolinhas com as mãos untadas e disponha em assadeira.",
      "Asse em forno pré-aquecido a 200°C por 25 a 30 minutos até dourarem."
    ],
    tags: ["Sem Glúten", "Mineiro", "Café da Manhã", "Lanche"],
    caloriesPerServing: 240,
    canonicalKey: "pao-de-queijo-mineiro",
    servingsBucket: "3-4",
    originArea: "Brazilian",
    originCountry: "Brazil",
    diet: {
      hasMeat: false,
      hasLactose: true,
      hasGluten: false,
      hasEgg: true,
      vegetarian: true,
      vegan: false,
      lowCarb: false,
      highProtein: false,
      usesFrying: false
    },
    sources: [
      {
        sourceId: "custom",
        license: "Public Domain / CC0",
        attribution: "Geladeira Inteligente Catalog"
      }
    ]
  },
  {
    id: "moqueca-baiana-de-peixe",
    title: "Moqueca Baiana com Leite de Coco e Dendê",
    description: "Peixe branco cozido lentamente com pimentões coloridos, tomate fresco, azeite de dendê e leite de coco cremoso.",
    prepTimeMinutes: 40,
    difficulty: "Fácil",
    servings: 4,
    category: "Almoço & Jantar",
    imageUrl: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1000&q=80",
    ingredients: [
      { name: "Filé de Peixe Branco", quantity: "600g", required: true, category: "proteins" },
      { name: "Pimentão Vermelho", quantity: "1 unidade em rodelas", required: true, category: "vegetables" },
      { name: "Pimentão Amarelo", quantity: "1 unidade em rodelas", required: false, category: "vegetables" },
      { name: "Tomate", quantity: "2 unidades em rodelas", required: true, category: "vegetables" },
      { name: "Cebola", quantity: "1 grande em rodelas", required: true, category: "vegetables" },
      { name: "Leite de Coco", quantity: "200ml", required: true, category: "pantry" },
      { name: "Azeite de Dendê", quantity: "2 colheres de sopa", required: true, category: "condiments" },
      { name: "Coentro", quantity: "a gosto", required: false, category: "condiments" },
      { name: "Limão", quantity: "1 unidade", required: true, category: "fruits" }
    ],
    steps: [
      "Tempere as postas de peixe com suco de limão, sal e alho amassado. Deixe marinar por 15 minutos.",
      "Em uma panela de barro ou fundo grosso, monte camadas intercaladas de cebola, pimentões, tomate e peixe.",
      "Regue com o leite de coco e o azeite de dendê.",
      "Tampe e leve ao fogo médio por cerca de 20 minutos sem mexer para não desmanchar o peixe.",
      "Finalize salpicando coentro fresco picado e sirva bem quente com arroz branco."
    ],
    tags: ["Sem Glúten", "Sem Lactose", "Frutos do Mar", "Baiana"],
    caloriesPerServing: 350,
    canonicalKey: "moqueca-baiana-de-peixe",
    servingsBucket: "3-4",
    originArea: "Brazilian",
    originCountry: "Brazil",
    diet: {
      hasMeat: true,
      hasLactose: false,
      hasGluten: false,
      hasEgg: false,
      vegetarian: false,
      vegan: false,
      lowCarb: true,
      highProtein: true,
      usesFrying: false
    },
    sources: [
      {
        sourceId: "custom",
        license: "Public Domain / CC0",
        attribution: "Geladeira Inteligente Catalog"
      }
    ]
  },
  {
    id: "omelete-rapido-com-legumes",
    title: "Omelete Rápido com Ervas e Queijo",
    description: "Preparo rápido e proteico, perfeito para aproveitar ovos frescos e queijo da geladeira em poucos minutos.",
    prepTimeMinutes: 10,
    difficulty: "Fácil",
    servings: 1,
    category: "Almoço & Jantar",
    imageUrl: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=1000&q=80",
    ingredients: [
      { name: "Ovos", quantity: "2 a 3 unidades", required: true, category: "proteins" },
      { name: "Mussarela ou Queijo Branco", quantity: "50g fatiado", required: false, category: "dairy" },
      { name: "Tomate", quantity: "1/2 unidade em cubos", required: false, category: "vegetables" },
      { name: "Cebola", quantity: "2 colheres de sopa picada", required: false, category: "vegetables" },
      { name: "Azeite ou Manteiga", quantity: "1 colher de chá", required: true, category: "condiments" },
      { name: "Sal e Pimenta", quantity: "a gosto", required: false, category: "condiments" }
    ],
    steps: [
      "Bata os ovos vigorosamente em uma tigela com um garfo até espumar levemente.",
      "Tempere com uma pitada de sal, pimenta-do-reino e orégano.",
      "Aqueça a frigideira antiaderente untada com azeite ou manteiga em fogo médio.",
      "Despeje os ovos batidos e, quando a base começar a firmar, adicione o tomate e o queijo em uma das metades.",
      "Dobre o omelete ao meio com o auxílio de uma espátula e deixe dourar por 1 minuto de cada lado."
    ],
    tags: ["Rápido", "Low Carb", "Sem Glúten", "Proteico", "Vegetariano"],
    caloriesPerServing: 220,
    canonicalKey: "omelete-rapido-com-legumes",
    servingsBucket: "1",
    originArea: "Brazilian",
    originCountry: "Brazil",
    diet: {
      hasMeat: false,
      hasLactose: true,
      hasGluten: false,
      hasEgg: true,
      vegetarian: true,
      vegan: false,
      lowCarb: true,
      highProtein: true,
      usesFrying: false
    },
    sources: [
      {
        sourceId: "custom",
        license: "Public Domain / CC0",
        attribution: "Geladeira Inteligente Catalog"
      }
    ]
  },
  {
    id: "brigadeiro-gourmet-brasileiro",
    title: "Brigadeiro Gourmet Tradicional",
    description: "O doce mais amado do Brasil, feito com leite condensado, manteiga e cacau em pó 50% enrolado no confeito de chocolate.",
    prepTimeMinutes: 20,
    difficulty: "Fácil",
    servings: 6,
    category: "Sobremesas",
    imageUrl: "https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=1000&q=80",
    ingredients: [
      { name: "Leite Condensado", quantity: "1 lata (395g)", required: true, category: "pantry" },
      { name: "Cacau ou Chocolate em Pó", quantity: "4 colheres de sopa", required: true, category: "pantry" },
      { name: "Manteiga", quantity: "1 colher de sopa", required: true, category: "dairy" },
      { name: "Chocolate Granulado", quantity: "100g para confeitar", required: false, category: "pantry" }
    ],
    steps: [
      "Em uma panela de fundo grosso, junte o leite condensado, a manteiga e o cacau em pó.",
      "Misture bem antes de levar ao fogo para dissolver o chocolate.",
      "Cozinhe em fogo médio-baixo, mexendo continuamente com uma espátula sem parar.",
      "O ponto ideal é quando a massa desgrudar totalmente do fundo e laterais da panela (ponto de brigadeiro).",
      "Transfira para um prato untado com manteiga e deixe esfriar completamente.",
      "Unte as mãos com manteiga, enrole as bolinhas e passe no confeito granulado."
    ],
    tags: ["Sobremesa", "Doce Típico", "Sem Glúten", "Vegetariano"],
    caloriesPerServing: 180,
    canonicalKey: "brigadeiro-gourmet-brasileiro",
    servingsBucket: "5+",
    originArea: "Brazilian",
    originCountry: "Brazil",
    diet: {
      hasMeat: false,
      hasLactose: true,
      hasGluten: false,
      hasEgg: false,
      vegetarian: true,
      vegan: false,
      lowCarb: false,
      highProtein: false,
      usesFrying: false
    },
    sources: [
      {
        sourceId: "custom",
        license: "Public Domain / CC0",
        attribution: "Geladeira Inteligente Catalog"
      }
    ]
  },
  {
    id: "baiao-de-dois-cearense",
    title: "Baião de Dois Cremoso com Queijo Coalho",
    description: "Combinação clássica nordestina de arroz e feijão de corda cozidos juntos com carne seca, linguiça e queijo coalho tostado.",
    prepTimeMinutes: 45,
    difficulty: "Médio",
    servings: 4,
    category: "Almoço & Jantar",
    imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=80",
    ingredients: [
      { name: "Arroz Branco", quantity: "2 xícaras", required: true, category: "pantry" },
      { name: "Feijão Fradinho ou de Corda", quantity: "1 xícara e 1/2 cozido", required: true, category: "pantry" },
      { name: "Queijo Coalho", quantity: "200g em cubos", required: true, category: "dairy" },
      { name: "Carne Seca Dessalgada", quantity: "200g desfiada", required: true, category: "proteins" },
      { name: "Bacon", quantity: "100g picado", required: false, category: "proteins" },
      { name: "Manteiga de Garrafa", quantity: "2 colheres de sopa", required: true, category: "dairy" },
      { name: "Coentro e Cebolinha", quantity: "a gosto", required: false, category: "condiments" }
    ],
    steps: [
      "Em uma panela grande, doure o bacon e a carne seca na manteiga de garrafa.",
      "Adicione o arroz cru e refogue até ficar brilhante.",
      "Acrescente o feijão de corda cozido com parte do caldo do cozimento e água suficiente.",
      "Cozinhe em fogo brando com a panela semi-tampada até o arroz secar e ficar macio.",
      "Em uma frigideira separada, toste os cubos de queijo coalho até dourarem.",
      "Misture o queijo coalho e o cheiro-verde ao arroz e sirva fumegante."
    ],
    tags: ["Nordestino", "Sem Glúten", "Prato Único", "Carnes"],
    caloriesPerServing: 480,
    canonicalKey: "baiao-de-dois-cearense",
    servingsBucket: "3-4",
    originArea: "Brazilian",
    originCountry: "Brazil",
    diet: {
      hasMeat: true,
      hasLactose: true,
      hasGluten: false,
      hasEgg: false,
      vegetarian: false,
      vegan: false,
      lowCarb: false,
      highProtein: true,
      usesFrying: false
    },
    sources: [
      {
        sourceId: "custom",
        license: "Public Domain / CC0",
        attribution: "Geladeira Inteligente Catalog"
      }
    ]
  },
  {
    id: "salada-tropical-completa",
    title: "Salada Tropical Refrescante com Manga",
    description: "Mix colorido de folhas frescas, manga palmer em cubos, tomatinhos doces e molho leve de azeite e limão.",
    prepTimeMinutes: 15,
    difficulty: "Fácil",
    servings: 2,
    category: "Saladas",
    imageUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1000&q=80",
    ingredients: [
      { name: "Alface Americana ou Crespa", quantity: "1 maço lavado", required: true, category: "vegetables" },
      { name: "Manga Palmer", quantity: "1 unidade em cubos", required: true, category: "fruits" },
      { name: "Tomate Cereja", quantity: "1 xícara cortados ao meio", required: true, category: "vegetables" },
      { name: "Pepino Japonês", quantity: "1 unidade em rodelas", required: false, category: "vegetables" },
      { name: "Azeite de Oliva Extra Virgem", quantity: "3 colheres de sopa", required: true, category: "condiments" },
      { name: "Limão", quantity: "1 unidade", required: true, category: "fruits" }
    ],
    steps: [
      "Higienize as folhas, seque bem e rasgue com as mãos em uma saladeira funda.",
      "Distribua os cubos de manga, os tomatinhos e o pepino sobre a cama de folhas.",
      "Em um potinho, emulsione o azeite, o suco de limão, sal e pimenta-do-reino moída na hora.",
      "Regue a salada com o molho imediatamente antes de servir para manter a crocância."
    ],
    tags: ["Vegano", "Sem Glúten", "Sem Lactose", "Low Carb", "Leve"],
    caloriesPerServing: 130,
    canonicalKey: "salada-tropical-completa",
    servingsBucket: "2",
    originArea: "Brazilian",
    originCountry: "Brazil",
    diet: {
      hasMeat: false,
      hasLactose: false,
      hasGluten: false,
      hasEgg: false,
      vegetarian: true,
      vegan: true,
      lowCarb: true,
      highProtein: false,
      usesFrying: false
    },
    sources: [
      {
        sourceId: "custom",
        license: "Public Domain / CC0",
        attribution: "Geladeira Inteligente Catalog"
      }
    ]
  }
];

const normalizeUrl = (u?: string) =>
  (u || '')
    .trim()
    .replace(/ /g, '_'); // MediaWiki aceita underscores no título

const sourceKey = (s: RecipeSource) =>
  `${s.sourceId}::${(s.externalId || '').trim()}::${normalizeUrl(s.url)}`;

const mergeSources = (a: RecipeSource[] = [], b: RecipeSource[] = []) => {
  const map = new Map<string, RecipeSource>();
  for (const s of [...a, ...b]) {
    const key = sourceKey(s);
    if (!key) continue;
    if (!map.has(key)) map.set(key, s);
  }
  return Array.from(map.values());
};

export async function generateCatalog() {
  console.log('--- Iniciando Geração do Catálogo Unificado de Receitas ---');

  // 1. Busca TheMealDB
  let theMealDbRecipes: Recipe[] = [];
  try {
    theMealDbRecipes = await fetchTheMealDBBrazilian();
  } catch (e) {
    console.warn('Falha no scraper TheMealDB:', e);
  }

  // 2. Busca Wikilivros
  let wikilivrosRecipes: Recipe[] = [];
  try {
    wikilivrosRecipes = await fetchWikilivrosBrazilianRecipes();
  } catch (e) {
    console.warn('Falha no scraper Wikilivros:', e);
  }

  // 3. Combina tudo com a base curada
  const allCandidates = [
    ...FOUNDATION_RECIPES,
    ...theMealDbRecipes,
    ...wikilivrosRecipes,
  ];

  console.log(`Total de receitas brutas coletadas: ${allCandidates.length}`);

  // 4. Deduplicação por canonicalKey e Merge Inteligente
  const canonicalMap = new Map<string, Recipe>();

  for (const r of allCandidates) {
    const key = r.canonicalKey || canonicalKeyFromTitle(r.title);
    const diet = r.diet || computeDietFlags(r.ingredients.map((i) => i.name), r.steps, r.title);

    if (!canonicalMap.has(key)) {
      canonicalMap.set(key, {
        ...r,
        canonicalKey: key,
        diet,
        aliases: Array.from(new Set([r.title, ...(r.aliases || [])].filter(Boolean))),
      });
    } else {
      const existing = canonicalMap.get(key)!;

      // 4.1 Sources: dedupe por chave estável (sourceId + externalId + normalizeUrl)
      const mergedSources = mergeSources(existing.sources, r.sources);

      // 4.2 Aliases: concat + dedupe
      const aliasesSet = new Set<string>();
      if (existing.title) aliasesSet.add(existing.title);
      if (r.title) aliasesSet.add(r.title);
      for (const a of existing.aliases || []) if (a) aliasesSet.add(a);
      for (const a of r.aliases || []) if (a) aliasesSet.add(a);
      const mergedAliases = Array.from(aliasesSet);

      // 4.3 ImageUrl: preferir TheMealDB quando existir, ou imagem de alta resolução
      let chosenImageUrl = existing.imageUrl;
      const isRTheMealDB = r.sources?.some((s) => s.sourceId === 'themealdb');
      const isExistingTheMealDB = existing.sources?.some((s) => s.sourceId === 'themealdb');

      if (isRTheMealDB && r.imageUrl) {
        chosenImageUrl = r.imageUrl;
      } else if (!isExistingTheMealDB && r.imageUrl && (!existing.imageUrl || existing.imageUrl.includes('unsplash'))) {
        chosenImageUrl = r.imageUrl;
      }

      // 4.4 Steps & Ingredients: manter os mais completos (maior length)
      const chosenSteps = (r.steps?.length || 0) > (existing.steps?.length || 0)
        ? r.steps
        : existing.steps;

      const chosenIngredients = (r.ingredients?.length || 0) > (existing.ingredients?.length || 0)
        ? r.ingredients
        : existing.ingredients;

      // Preferir título em português amigável quando disponível
      let chosenTitle = existing.title;
      const isExistingEnglish = /^[a-zA-Z\s\-&,()]+$/.test(existing.title) && isExistingTheMealDB;
      const isRPortuguese = r.sources?.some((s) => s.sourceId === 'wikilivros' || s.sourceId === 'custom');
      if (isExistingEnglish && isRPortuguese && r.title) {
        chosenTitle = r.title;
      }

      // Recalcula flags dietéticas de forma determinística combinando os ingredientes e passos finais
      const recomputedDiet = computeDietFlags(
        chosenIngredients.map((i) => i.name),
        chosenSteps,
        chosenTitle
      );

      // Tags concat + dedupe
      const tagsSet = new Set<string>([...(existing.tags || []), ...(r.tags || [])]);

      canonicalMap.set(key, {
        ...existing,
        title: chosenTitle,
        imageUrl: chosenImageUrl,
        steps: chosenSteps,
        ingredients: chosenIngredients,
        sources: mergedSources,
        aliases: mergedAliases,
        tags: Array.from(tagsSet),
        diet: recomputedDiet,
      });
    }
  }

  const isGarbage = (s: string) =>
    /https?:\/\//i.test(s) || /categoria:/i.test(s) || /wikilivros/i.test(s);

  const finalRecipes = Array.from(canonicalMap.values())
    .map((r) => {
      const validIngredients = (r.ingredients || []).filter((i) => !isGarbage(i.name));
      const validSteps = (r.steps || []).filter((s) => !isGarbage(s));
      const diet = computeDietFlags(
        validIngredients.map((i) => i.name),
        validSteps,
        r.title
      );

      const DIETARY_TAG_NAMES = new Set([
        'Vegano',
        'Vegetariano',
        'Sem Glúten',
        'Sem Lactose',
        'Sem Frituras',
        'Low Carb',
        'Rico em Proteína',
      ]);

      const dietTags = [
        ...(diet.vegan ? ['Vegano'] : []),
        ...(diet.vegetarian && !diet.vegan ? ['Vegetariano'] : []),
        ...(diet.hasGluten === false ? ['Sem Glúten'] : []),
        ...(diet.hasLactose === false ? ['Sem Lactose'] : []),
        ...(diet.usesFrying === false ? ['Sem Frituras'] : []),
        ...(diet.lowCarb ? ['Low Carb'] : []),
        ...(diet.highProtein ? ['Rico em Proteína'] : []),
      ];

      const cleanNonDietTags = (r.tags || []).filter((t) => !DIETARY_TAG_NAMES.has(t));
      const tags = Array.from(new Set([...cleanNonDietTags, ...dietTags]));

      return {
        ...r,
        ingredients: validIngredients,
        steps: validSteps,
        diet,
        tags,
      };
    })
    .filter((r) => r.ingredients.length >= 3 && r.steps.length >= 2);

  console.log(`Total de receitas consolidadas pós-dedup e quality gate: ${finalRecipes.length}`);

  const outputData = {
    version: 1,
    generatedAt: new Date().toISOString(),
    total: finalRecipes.length,
    recipes: finalRecipes,
  };

  function findProjectRoot(): string {
    let curr = process.cwd();
    while (curr !== path.dirname(curr)) {
      if (fs.existsSync(path.join(curr, 'package.json')) && fs.existsSync(path.join(curr, 'public'))) {
        return curr;
      }
      curr = path.dirname(curr);
    }
    return process.cwd();
  }

  const projectRoot = findProjectRoot();
  const outputPath = path.resolve(projectRoot, 'public/recipes/catalog.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2), 'utf-8');

  console.log(`✅ Sucesso! Catálogo gerado e salvo em: ${outputPath}`);
}

generateCatalog().catch((err) => {
  console.error('Erro na geração do catálogo:', err);
  process.exit(1);
});
