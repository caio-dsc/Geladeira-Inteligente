import { db } from './firebaseAdmin';

const API_BASE = 'https://www.themealdb.com/api/json/v1/1';

type MealSummary = { idMeal: string; strMeal: string; strMealThumb: string };
type MealDetail = any;

const normalizeText = (s: string) =>
  (s || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const canonicalKeyFromTitle = (title: string) =>
  normalizeText(title).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const servingsBucketFromServings = (servings: number) => {
  if (servings === 1) return '1';
  if (servings === 2) return '2';
  if (servings <= 4) return '3-4';
  return '5+';
};

const difficultyFromHeuristics = (ingredientCount: number, stepCount: number) => {
  let score = 0;
  if (ingredientCount >= 10) score++;
  if (ingredientCount >= 15) score++;
  if (stepCount >= 8) score++;
  if (stepCount >= 12) score++;
  if (score <= 1) return 'Fácil';
  if (score <= 3) return 'Médio';
  return 'Avançado';
};

function extractIngredients(meal: MealDetail) {
  const ingredients: { name: string; quantity: string; required: boolean }[] = [];
  for (let i = 1; i <= 20; i++) {
    const ing = (meal[`strIngredient${i}`] || '').trim();
    const meas = (meal[`strMeasure${i}`] || '').trim();
    if (!ing) continue;
    ingredients.push({ name: ing, quantity: meas || 'a gosto', required: true });
  }
  return ingredients;
}

function extractSteps(meal: MealDetail) {
  const txt = (meal.strInstructions || '').trim();
  if (!txt) return [];
  // TheMealDB costuma vir em um texto grande; separar por linhas primeiro
  const lines = txt.split('\n').map((l: string) => l.trim()).filter(Boolean);
  if (lines.length >= 2) return lines;
  // fallback: separa por ponto (bem simples)
  return txt.split('.').map((s: string) => s.trim()).filter(Boolean);
}

function computeDietFlags(ingredients: string[], steps: string[]) {
  const all = normalizeText([...ingredients, ...steps].join(' '));

  const hasMeat =
    /(beef|pork|chicken|fish|shrimp|bacon|ham|sausage|carne|frango|porco|peixe|camarao|linguica)/.test(all);

  const hasLactose =
    /(milk|cheese|butter|cream|yogurt|leite|queijo|manteiga|creme|iogurte)/.test(all);

  const hasGluten =
    /(wheat|flour|bread|pasta|noodle|farinha|trigo|pao|massa|macarrao)/.test(all);

  const usesFrying =
    /(deep fry|fry\b|frying|frit|imersao|oleo quente)/.test(all);

  const vegetarian = !hasMeat;
  const vegan = vegetarian && !hasLactose && !/(egg|eggs|ovo|ovos|honey|mel)/.test(all);

  return { hasMeat, hasLactose, hasGluten, usesFrying, vegetarian, vegan };
}

async function fetchJson(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} em ${url}`);
  return await r.json();
}

async function getBrazilianMealSummaries(): Promise<MealSummary[]> {
  // filtro por área (documentado pela TheMealDB)
  const data = await fetchJson(`${API_BASE}/filter.php?a=Brazilian`);
  return data.meals || [];
}

async function lookupMeal(idMeal: string): Promise<MealDetail | null> {
  const data = await fetchJson(`${API_BASE}/lookup.php?i=${idMeal}`);
  return data.meals?.[0] || null;
}

export async function main() {
  const summaries = await getBrazilianMealSummaries();
  console.log(`Encontradas ${summaries.length} receitas Brazilian na TheMealDB`);

  // Limite opcional para primeiro seed (ex.: 50)
  const limit = Math.min(80, summaries.length);
  const pick = summaries.slice(0, limit);

  const batch = db.batch();

  for (const s of pick) {
    const meal = await lookupMeal(s.idMeal);
    if (!meal) continue;

    const ingredients = extractIngredients(meal);
    const steps = extractSteps(meal);

    const diet = computeDietFlags(
      ingredients.map((x) => x.name),
      steps
    );

    const servings = 2; // TheMealDB V1 geralmente não traz servings; definimos padrão
    const recipe = {
      title: meal.strMeal,
      description: `${meal.strCategory || 'Receita'} • ${meal.strArea || 'Brazilian'}`,
      prepTimeMinutes: 30,
      difficulty: difficultyFromHeuristics(ingredients.length, steps.length),
      servings,
      servingsBucket: servingsBucketFromServings(servings),
      category: 'Almoço & Jantar',
      imageUrl: (meal.strMealThumb || s.strMealThumb) ? `${meal.strMealThumb || s.strMealThumb}/medium` : '',
      ingredients,
      steps,
      tags: [],

      canonicalKey: canonicalKeyFromTitle(meal.strMeal),
      aliases: [],
      originArea: meal.strArea || 'Brazilian',
      originCountry: 'Brazil',
      diet,
      sources: [
        {
          sourceId: 'themealdb',
          externalId: meal.idMeal,
          url: `https://www.themealdb.com/meal/${meal.idMeal}`,
        },
      ],
    };

    const docId = `themealdb_${meal.idMeal}`;
    const ref = db.collection('recipes').doc(docId);
    batch.set(ref, recipe, { merge: true });
  }

  await batch.commit();
  console.log('Import concluído.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
