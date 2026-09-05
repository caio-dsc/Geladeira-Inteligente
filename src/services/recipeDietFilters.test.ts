import assert from 'node:assert/strict';
import { 
  matchesDietFilters, 
  getRecipeDietBadges, 
  matchesDifficultyFilter, 
  matchesServingsFilter 
} from '../utils/dietFilters';
import { RecipeDietFlags, ServingsBucket } from '../types';
import { runIngredientMatcherTests } from '../utils/ingredientMatcher.test';

console.log('🧪 Iniciando testes de matchesDietFilters e filtros dietéticos...');

// Dados de exemplo representativos
const mockVeganRecipe: RecipeDietFlags = {
  hasMeat: false,
  hasLactose: false,
  hasGluten: false,
  hasEgg: false,
  vegetarian: true,
  vegan: true,
  usesFrying: false,
  lowCarb: false,
  highProtein: false,
};

const mockOvoLactoVegRecipe: RecipeDietFlags = {
  hasMeat: false,
  hasLactose: true,
  hasGluten: false,
  hasEgg: true,
  vegetarian: true,
  vegan: false,
  usesFrying: false,
  lowCarb: false,
  highProtein: false,
};

const mockMeatRecipe: RecipeDietFlags = {
  hasMeat: true,
  hasLactose: false,
  hasGluten: false,
  hasEgg: false,
  vegetarian: false,
  vegan: false,
  usesFrying: false,
  lowCarb: true,
  highProtein: true,
};

const mockFriedGlutenRecipe: RecipeDietFlags = {
  hasMeat: false,
  hasLactose: false,
  hasGluten: true,
  hasEgg: false,
  vegetarian: true,
  vegan: true,
  usesFrying: true,
  lowCarb: false,
  highProtein: false,
};

// 1. Vegano retorna somente receitas compatíveis
{
  assert.equal(
    matchesDietFilters(mockVeganRecipe, ['Vegano']),
    true,
    'Receita estritamente vegana deve passar no filtro Vegano'
  );
  assert.equal(
    matchesDietFilters(mockOvoLactoVegRecipe, ['Vegano']),
    false,
    'Receita com ovo/lactose NÃO deve passar no filtro Vegano'
  );
  assert.equal(
    matchesDietFilters(mockMeatRecipe, ['Vegano']),
    false,
    'Receita com carne NÃO deve passar no filtro Vegano'
  );
  assert.equal(
    matchesDietFilters({ ...mockVeganRecipe, vegan: false }, ['Vegano']),
    false,
    'vegan === false não pode passar no filtro Vegano'
  );
  assert.equal(
    matchesDietFilters({ ...mockVeganRecipe, vegan: undefined }, ['Vegano']),
    false,
    'vegan === undefined não pode passar no filtro Vegano'
  );
}

// 2. Vegetariano exclui receitas com hasMeat === true
{
  assert.equal(
    matchesDietFilters(mockMeatRecipe, ['Vegetariano']),
    false,
    'Receita com hasMeat === true DEVE ser excluída do filtro Vegetariano'
  );
  assert.equal(
    matchesDietFilters(mockOvoLactoVegRecipe, ['Vegetariano']),
    true,
    'Ovolactovegetariano deve passar no filtro Vegetariano'
  );
  assert.equal(
    matchesDietFilters(mockVeganRecipe, ['Vegetariano']),
    true,
    'Vegano deve passar no filtro Vegetariano'
  );
  assert.equal(
    matchesDietFilters({ ...mockVeganRecipe, vegetarian: false }, ['Vegetariano']),
    false,
    'vegetarian === false deve ser excluído do filtro Vegetariano'
  );
}

// 3. Sem Glúten exclui hasGluten === true
{
  assert.equal(
    matchesDietFilters(mockFriedGlutenRecipe, ['Sem Glúten']),
    false,
    'Receita com hasGluten === true DEVE ser excluída do filtro Sem Glúten'
  );
  assert.equal(
    matchesDietFilters(mockVeganRecipe, ['Sem Glúten']),
    true,
    'Receita com hasGluten === false deve passar no filtro Sem Glúten'
  );
}

// 4. Sem Lactose exclui hasLactose === true
{
  assert.equal(
    matchesDietFilters(mockOvoLactoVegRecipe, ['Sem Lactose']),
    false,
    'Receita com hasLactose === true DEVE ser excluída do filtro Sem Lactose'
  );
  assert.equal(
    matchesDietFilters(mockVeganRecipe, ['Sem Lactose']),
    true,
    'Receita com hasLactose === false deve passar no filtro Sem Lactose'
  );
}

// 5. Sem Frituras exclui usesFrying === true
{
  assert.equal(
    matchesDietFilters(mockFriedGlutenRecipe, ['Sem Frituras']),
    false,
    'Receita com usesFrying === true DEVE ser excluída do filtro Sem Frituras'
  );
  assert.equal(
    matchesDietFilters(mockVeganRecipe, ['Sem Frituras']),
    true,
    'Receita com usesFrying === false deve passar no filtro Sem Frituras'
  );
}

// 6. Low Carb exige lowCarb === true
{
  assert.equal(
    matchesDietFilters(mockMeatRecipe, ['Low Carb']),
    true,
    'Receita com lowCarb === true deve passar no filtro Low Carb'
  );
  assert.equal(
    matchesDietFilters(mockVeganRecipe, ['Low Carb']),
    false,
    'Receita com lowCarb === false NÃO deve passar no filtro Low Carb'
  );
  assert.equal(
    matchesDietFilters({ ...mockMeatRecipe, lowCarb: undefined }, ['Low Carb']),
    false,
    'lowCarb === undefined NÃO deve passar no filtro Low Carb'
  );
}

// 7. Rico em Proteína exige highProtein === true
{
  assert.equal(
    matchesDietFilters(mockMeatRecipe, ['Rico em Proteína']),
    true,
    'Receita com highProtein === true deve passar no filtro Rico em Proteína'
  );
  assert.equal(
    matchesDietFilters(mockVeganRecipe, ['Rico em Proteína']),
    false,
    'Receita com highProtein === false NÃO deve passar no filtro Rico em Proteína'
  );
  assert.equal(
    matchesDietFilters({ ...mockMeatRecipe, highProtein: undefined }, ['Rico em Proteína']),
    false,
    'highProtein === undefined NÃO deve passar no filtro Rico em Proteína'
  );
}

// 8. Combinação Vegetariano + Sem Frituras usa AND
{
  // mockVeganRecipe é vegetariano e sem fritura -> true
  assert.equal(
    matchesDietFilters(mockVeganRecipe, ['Vegetariano', 'Sem Frituras']),
    true,
    'Vegetariano + Sem Frituras deve aceitar receita vegetariana sem fritura'
  );
  // mockFriedGlutenRecipe é vegetariano, mas usa fritura -> false
  assert.equal(
    matchesDietFilters(mockFriedGlutenRecipe, ['Vegetariano', 'Sem Frituras']),
    false,
    'Vegetariano + Sem Frituras DEVE rejeitar receita vegetariana frita (lógica AND)'
  );
  // mockMeatRecipe não é vegetariano -> false
  assert.equal(
    matchesDietFilters(mockMeatRecipe, ['Vegetariano', 'Sem Frituras']),
    false,
    'Vegetariano + Sem Frituras DEVE rejeitar carne (lógica AND)'
  );
}

// 9. Combinação Vegano + Sem Glúten + Sem Lactose usa AND
{
  // mockVeganRecipe é vegano, sem glúten e sem lactose -> true
  assert.equal(
    matchesDietFilters(mockVeganRecipe, ['Vegano', 'Sem Glúten', 'Sem Lactose']),
    true,
    'Vegano + Sem Glúten + Sem Lactose deve aceitar receita que atende aos 3'
  );
  // Se contiver glúten -> false
  assert.equal(
    matchesDietFilters({ ...mockVeganRecipe, hasGluten: true }, ['Vegano', 'Sem Glúten', 'Sem Lactose']),
    false,
    'Vegano + Sem Glúten + Sem Lactose DEVE rejeitar com glúten (lógica AND)'
  );
  // Se for ovolactovegetariano com lactose -> false
  assert.equal(
    matchesDietFilters(mockOvoLactoVegRecipe, ['Vegano', 'Sem Glúten', 'Sem Lactose']),
    false,
    'Vegano + Sem Glúten + Sem Lactose DEVE rejeitar não-vegano/com lactose'
  );
}

// 10. Limpar dietas permite novamente todas as receitas
{
  const emptyFilters: string[] = [];
  assert.equal(
    matchesDietFilters(mockMeatRecipe, emptyFilters),
    true,
    'Limpar dietas ([] ) deve permitir receita de carne'
  );
  assert.equal(
    matchesDietFilters(mockFriedGlutenRecipe, emptyFilters),
    true,
    'Limpar dietas ([] ) deve permitir receita frita com glúten'
  );
  assert.equal(
    matchesDietFilters(mockOvoLactoVegRecipe, emptyFilters),
    true,
    'Limpar dietas ([] ) deve permitir receita ovolacto'
  );
  assert.equal(
    matchesDietFilters(mockVeganRecipe, emptyFilters),
    true,
    'Limpar dietas ([] ) deve permitir receita vegana'
  );
  assert.equal(
    matchesDietFilters(mockMeatRecipe, undefined),
    true,
    'Filtro undefined deve permitir todas as receitas'
  );
}

// 11. Usar do perfil restaura as restrições salvas
{
  const profileRestrictions = ['Sem Lactose', 'Sem Frituras'];
  // mockVeganRecipe (hasLactose: false, usesFrying: false) -> true
  assert.equal(
    matchesDietFilters(mockVeganRecipe, profileRestrictions),
    true,
    'Usar do perfil deve aprovar receita que satisfaz as restrições salvas'
  );
  // mockOvoLactoVegRecipe (hasLactose: true) -> false
  assert.equal(
    matchesDietFilters(mockOvoLactoVegRecipe, profileRestrictions),
    false,
    'Usar do perfil deve rejeitar receita incompatível com restrições salvas'
  );
}

// 12. Badges derivados de diet
{
  const badgesVegan = getRecipeDietBadges(mockVeganRecipe);
  assert.ok(badgesVegan.includes('Vegano'), 'Deve conter badge Vegano');
  assert.ok(badgesVegan.includes('Sem Glúten'), 'Deve conter badge Sem Glúten');
  assert.ok(badgesVegan.includes('Sem Lactose'), 'Deve conter badge Sem Lactose');
  assert.ok(badgesVegan.includes('Sem Frituras'), 'Deve conter badge Sem Frituras');

  const badgesMeat = getRecipeDietBadges(mockMeatRecipe);
  assert.ok(!badgesMeat.includes('Vegetariano'), 'Carne não deve ter badge Vegetariano');
  assert.ok(badgesMeat.includes('Low Carb'), 'Deve conter badge Low Carb');
  assert.ok(badgesMeat.includes('Rico em Proteína'), 'Deve conter badge Rico em Proteína');
}

// 13. Teste de integração direta com public/recipes/catalog.json
{
  const fs = await import('node:fs');
  const path = await import('node:path');
  const catalogPath = path.resolve('public/recipes/catalog.json');
  const rawCatalog = fs.readFileSync(catalogPath, 'utf-8');
  const parsed = JSON.parse(rawCatalog);
  const catalog = Array.isArray(parsed) ? parsed : (parsed.recipes ?? []);

  assert.equal(catalog.length, 23, 'O catálogo deve possuir 23 receitas');

  // Limpar dietas ([]): Todas as 23 devem passar
  const allRecipes = catalog.filter((r: any) => matchesDietFilters(r.diet, []));
  assert.equal(allRecipes.length, 23, 'Filtros vazios devem retornar as 23 receitas');

  // Vegano: receitas com vegan === true e sem carne/lactose/ovo
  const veganRecipes = catalog.filter((r: any) => matchesDietFilters(r.diet, ['Vegano']));
  assert.ok(veganRecipes.length > 0, 'Deve encontrar receitas veganas no catálogo');
  for (const r of veganRecipes) {
    assert.equal(r.diet.vegan, true, `${r.title} deve ser vegan`);
    assert.notEqual(r.diet.hasMeat, true, `${r.title} não pode ter carne`);
    assert.notEqual(r.diet.hasLactose, true, `${r.title} não pode ter lactose`);
    assert.notEqual(r.diet.hasEgg, true, `${r.title} não pode ter ovo`);
  }

  // Vegetariano: sem carne
  const vegRecipes = catalog.filter((r: any) => matchesDietFilters(r.diet, ['Vegetariano']));
  assert.ok(vegRecipes.length >= veganRecipes.length, 'Vegetarianos deve ser >= Veganos');
  for (const r of vegRecipes) {
    assert.notEqual(r.diet.hasMeat, true, `${r.title} não pode ter carne`);
    assert.notEqual(r.diet.vegetarian, false, `${r.title} vegetarian não pode ser false`);
  }

  // Sem Frituras
  const nonFried = catalog.filter((r: any) => matchesDietFilters(r.diet, ['Sem Frituras']));
  assert.ok(nonFried.length > 0, 'Deve ter receitas sem fritura');
  for (const r of nonFried) {
    assert.notEqual(r.diet.usesFrying, true, `${r.title} usesFrying não pode ser true`);
  }

  // Combinação AND: Vegetariano + Sem Frituras
  const vegNonFried = catalog.filter((r: any) => matchesDietFilters(r.diet, ['Vegetariano', 'Sem Frituras']));
  assert.ok(vegNonFried.length <= vegRecipes.length, 'Vegetariano + Sem Frituras deve ser subconjunto de Vegetariano');
  assert.ok(vegNonFried.length <= nonFried.length, 'Vegetariano + Sem Frituras deve ser subconjunto de Sem Frituras');
  for (const r of vegNonFried) {
    assert.notEqual(r.diet.hasMeat, true);
    assert.notEqual(r.diet.usesFrying, true);
  }

  // Badges gerados para todas as receitas sem erro
  for (const r of catalog) {
    const badges = getRecipeDietBadges(r.diet);
    assert.ok(Array.isArray(badges), `Badges de ${r.title} deve ser um array`);
  }

  // 14. Testes de Filtro de Dificuldade
  // Sem filtro de dificuldade: todas as 23 continuam disponíveis
  const allDiff = catalog.filter((r: any) => matchesDifficultyFilter(r.difficulty, 'all'));
  assert.equal(allDiff.length, 23, 'Sem filtro de dificuldade deve retornar todas as 23 receitas');
  const undefDiff = catalog.filter((r: any) => matchesDifficultyFilter(r.difficulty, undefined));
  assert.equal(undefDiff.length, 23, 'Filtro undefined de dificuldade deve retornar todas as receitas');

  // Fácil: somente receitas com difficulty === 'Fácil'
  const easyRecipes = catalog.filter((r: any) => matchesDifficultyFilter(r.difficulty, 'Fácil'));
  assert.ok(easyRecipes.length > 0, 'Deve encontrar receitas Fáceis no catálogo');
  for (const r of easyRecipes) {
    assert.equal(r.difficulty, 'Fácil', `${r.title} deve ser Fácil`);
  }

  // Médio: somente receitas com difficulty === 'Médio'
  const mediumRecipes = catalog.filter((r: any) => matchesDifficultyFilter(r.difficulty, 'Médio'));
  assert.ok(mediumRecipes.length > 0, 'Deve encontrar receitas Médias no catálogo');
  for (const r of mediumRecipes) {
    assert.equal(r.difficulty, 'Médio', `${r.title} deve ser Médio`);
  }

  // Avançado: somente receitas com difficulty === 'Avançado'
  const hardRecipes = catalog.filter((r: any) => matchesDifficultyFilter(r.difficulty, 'Avançado'));
  for (const r of hardRecipes) {
    assert.equal(r.difficulty, 'Avançado', `${r.title} deve ser Avançado`);
  }
  // Teste com mock de receita avançada para garantir funcionamento correto da regra
  assert.equal(matchesDifficultyFilter('Avançado', 'Avançado'), true);
  assert.equal(matchesDifficultyFilter('Fácil', 'Avançado'), false);

  // 15. Testes de Filtro de Porções
  // Sem filtro de porções: todas as 23 continuam disponíveis
  const allServings = catalog.filter((r: any) => matchesServingsFilter(r, 'all'));
  assert.equal(allServings.length, 23, 'Sem filtro de porções deve retornar todas as 23 receitas');
  const undefServings = catalog.filter((r: any) => matchesServingsFilter(r, undefined));
  assert.equal(undefServings.length, 23, 'Filtro undefined de porções deve retornar todas as receitas');

  // Cada bucket de porções: somente receitas do bucket
  const buckets: ServingsBucket[] = ['1', '2', '3-4', '5+'];
  for (const bucket of buckets) {
    const bucketRecipes = catalog.filter((r: any) => matchesServingsFilter(r, bucket));
    for (const r of bucketRecipes) {
      const b = r.servingsBucket;
      assert.equal(b, bucket, `${r.title} deve pertencer ao bucket ${bucket}`);
    }
  }

  // 16. Combinação: Fácil + 3–4 porções
  const easy3to4 = catalog.filter(
    (r: any) =>
      matchesDifficultyFilter(r.difficulty, 'Fácil') &&
      matchesServingsFilter(r, '3-4')
  );
  assert.ok(easy3to4.length > 0, 'Deve haver receitas fáceis de 3-4 porções no catálogo');
  for (const r of easy3to4) {
    assert.equal(r.difficulty, 'Fácil');
    assert.equal(r.servingsBucket, '3-4');
  }

  // 17. Combinação com dieta: Vegetariano + Fácil + 3–4 porções
  const vegEasy3to4 = catalog.filter(
    (r: any) =>
      matchesDietFilters(r.diet, ['Vegetariano']) &&
      matchesDifficultyFilter(r.difficulty, 'Fácil') &&
      matchesServingsFilter(r, '3-4')
  );
  assert.ok(vegEasy3to4.length <= easy3to4.length, 'Vegetariano + Fácil + 3-4 deve ser subconjunto de Fácil + 3-4');
  for (const r of vegEasy3to4) {
    assert.notEqual(r.diet.hasMeat, true);
    assert.notEqual(r.diet.vegetarian, false);
    assert.equal(r.difficulty, 'Fácil');
    assert.equal(r.servingsBucket, '3-4');
  }

  // 18. Combinação múltipla: Vegano + Sem Glúten + Fácil + 3–4 porções
  const veganGlutenFreeEasy3to4 = catalog.filter(
    (r: any) =>
      matchesDietFilters(r.diet, ['Vegano', 'Sem Glúten']) &&
      matchesDifficultyFilter(r.difficulty, 'Fácil') &&
      matchesServingsFilter(r, '3-4')
  );
  for (const r of veganGlutenFreeEasy3to4) {
    assert.equal(r.diet.vegan, true);
    assert.notEqual(r.diet.hasGluten, true);
    assert.equal(r.difficulty, 'Fácil');
    assert.equal(r.servingsBucket, '3-4');
  }

  // 19. Limpeza independente
  // Limpar dificuldade retorna todas as dificuldades mantendo porções e dietas
  const activeDiet = ['Vegetariano'];
  const activeServings = '3-4';
  const beforeDiffClear = catalog.filter(
    (r: any) =>
      matchesDietFilters(r.diet, activeDiet) &&
      matchesDifficultyFilter(r.difficulty, 'Fácil') &&
      matchesServingsFilter(r, activeServings)
  );
  // Limpando dificuldade (redefinindo para 'all')
  const afterDiffClear = catalog.filter(
    (r: any) =>
      matchesDietFilters(r.diet, activeDiet) &&
      matchesDifficultyFilter(r.difficulty, 'all') &&
      matchesServingsFilter(r, activeServings)
  );
  assert.ok(afterDiffClear.length >= beforeDiffClear.length, 'Limpar dificuldade deve expandir ou manter os resultados');

  // Limpar porções retorna todos os buckets mantendo dificuldade e dietas
  const afterServingsClear = catalog.filter(
    (r: any) =>
      matchesDietFilters(r.diet, activeDiet) &&
      matchesDifficultyFilter(r.difficulty, 'Fácil') &&
      matchesServingsFilter(r, 'all')
  );
  assert.ok(afterServingsClear.length >= beforeDiffClear.length, 'Limpar porções deve expandir ou manter os resultados');

  // Limpar dietas (passando []) não altera dificuldade nem porções
  const afterDietClear = catalog.filter(
    (r: any) =>
      matchesDietFilters(r.diet, []) &&
      matchesDifficultyFilter(r.difficulty, 'Fácil') &&
      matchesServingsFilter(r, activeServings)
  );
  assert.ok(afterDietClear.length >= beforeDiffClear.length, 'Limpar dietas deve manter dificuldade e porções ativas');
  for (const r of afterDietClear) {
    assert.equal(r.difficulty, 'Fácil');
    assert.equal(r.servingsBucket, activeServings);
  }

  // Usar do perfil (passando as restrições salvas) aplica apenas dietas
  const profileDiet = ['Sem Frituras'];
  const withProfileDiet = catalog.filter(
    (r: any) =>
      matchesDietFilters(r.diet, profileDiet) &&
      matchesDifficultyFilter(r.difficulty, 'Fácil') &&
      matchesServingsFilter(r, activeServings)
  );
  for (const r of withProfileDiet) {
    assert.notEqual(r.diet.usesFrying, true);
    assert.equal(r.difficulty, 'Fácil');
    assert.equal(r.servingsBucket, activeServings);
  }
}

console.log('✅ Todos os testes de filtros dietéticos, dificuldade, porções e catálogo passaram com sucesso!');

// Executa testes do matching inteligente de ingredientes
runIngredientMatcherTests();

