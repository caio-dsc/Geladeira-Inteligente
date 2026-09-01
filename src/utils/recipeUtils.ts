export const normalizeText = (s: string) =>
  (s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const canonicalKeyFromTitle = (title: string) =>
  normalizeText(title).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const servingsBucketFromServings = (servings?: number | null) => {
  if (!servings || servings <= 0) return 'unknown' as const;
  if (servings === 1) return '1' as const;
  if (servings === 2) return '2' as const;
  if (servings <= 4) return '3-4' as const;
  return '5+' as const;
};

export const difficultyFromHeuristics = (ingredientCount: number, stepCount: number): 'Fácil' | 'Médio' | 'Avançado' => {
  let score = 0;
  if (ingredientCount >= 10) score++;
  if (ingredientCount >= 15) score++;
  if (stepCount >= 8) score++;
  if (stepCount >= 12) score++;

  if (score <= 1) return 'Fácil';
  if (score <= 3) return 'Médio';
  return 'Avançado';
};
