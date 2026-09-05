import assert from 'node:assert/strict';
import { 
  matchIngredients, 
  isIngredientAvailable, 
  calculateRecipeMatch,
  normalizeIngredient,
  toSingular 
} from './ingredientMatcher';
import { FoodItem, Recipe } from '../types';

export function runIngredientMatcherTests() {
  console.log('🧪 Iniciando testes de ingredientMatcher e equivalências...');

  // 1. Singular/Plural obrigatórios
  assert.equal(matchIngredients('ovo', 'ovos'), true, 'ovo deve casar com ovos');
  assert.equal(matchIngredients('ovos', 'ovo'), true, 'ovos deve casar com ovo');
  assert.equal(matchIngredients('tomate', 'tomates'), true, 'tomate deve casar com tomates');
  assert.equal(matchIngredients('tomates', 'tomate'), true, 'tomates deve casar com tomate');
  assert.equal(matchIngredients('cebola', 'cebolas'), true, 'cebola deve casar com cebolas');
  assert.equal(matchIngredients('cebolas', 'cebola'), true, 'cebolas deve casar com cebola');

  // 2. Frango e cortes obrigatórios
  assert.equal(matchIngredients('frango', 'peito de frango'), true, 'frango deve casar com peito de frango');
  assert.equal(matchIngredients('peito de frango', 'frango'), true, 'peito de frango deve casar com frango');
  assert.equal(matchIngredients('frango', 'coxa de frango'), true, 'frango deve casar com coxa de frango');
  assert.equal(matchIngredients('coxa de frango', 'frango'), true, 'coxa de frango deve casar com frango');

  // 3. Falsos positivos proibidos (distinção estrita)
  assert.equal(matchIngredients('sal', 'salsa'), false, 'sal NÃO deve casar com salsa');
  assert.equal(matchIngredients('salsa', 'sal'), false, 'salsa NÃO deve casar com sal');
  assert.equal(matchIngredients('alho', 'alho-poro'), false, 'alho NÃO deve casar com alho-poró');
  assert.equal(matchIngredients('alho-poro', 'alho'), false, 'alho-poró NÃO deve casar com alho');
  assert.equal(matchIngredients('alho', 'alho-poró'), false, 'alho NÃO deve casar com alho-poró acentuado');
  assert.equal(matchIngredients('alho-poró', 'alho'), false, 'alho-poró acentuado NÃO deve casar com alho');
  assert.equal(matchIngredients('leite', 'leite de coco'), false, 'leite NÃO deve casar com leite de coco');
  assert.equal(matchIngredients('leite de coco', 'leite'), false, 'leite de coco NÃO deve casar com leite');
  assert.equal(matchIngredients('leite', 'leite condensado'), false, 'leite NÃO deve casar com leite condensado');
  assert.equal(matchIngredients('leite', 'creme de leite'), false, 'leite NÃO deve casar com creme de leite');

  // 4. Ingredientes totalmente diferentes continuam como não equivalentes
  assert.equal(matchIngredients('arroz', 'feijao'), false, 'arroz NÃO deve casar com feijão');
  assert.equal(matchIngredients('banana', 'manga'), false, 'banana NÃO deve casar com manga');
  assert.equal(matchIngredients('farinha de trigo', 'acucar'), false, 'farinha de trigo NÃO deve casar com açúcar');

  // 5. Formatos de receita com quantidades e preparo
  assert.equal(matchIngredients('2 ovos', 'ovo'), true, '2 ovos deve casar com ovo');
  assert.equal(matchIngredients('1 cebola em cubos', 'cebolas'), true, '1 cebola em cubos deve casar com cebolas');
  assert.equal(matchIngredients('2 dentes de alho amassados', 'alho'), true, '2 dentes de alho amassados deve casar com alho');
  assert.equal(matchIngredients('2 dentes de alho amassados', 'alho-poro'), false, '2 dentes de alho amassados NÃO deve casar com alho-poro');
  assert.equal(matchIngredients('Sal a gosto', 'sal'), true, 'Sal a gosto deve casar com sal');
  assert.equal(matchIngredients('Sal a gosto', 'salsa'), false, 'Sal a gosto NÃO deve casar com salsa');
  assert.equal(matchIngredients('1 macinho de salsa miuda', 'salsa'), true, '1 macinho de salsa miuda deve casar com salsa');
  assert.equal(matchIngredients('1 macinho de salsa miuda', 'sal'), false, '1 macinho de salsa miuda NÃO deve casar com sal');
  assert.equal(matchIngredients('3 colheres (sopa) de leite de coco', 'leite de coco'), true, 'leite de coco em medida deve casar com leite de coco');
  assert.equal(matchIngredients('3 colheres (sopa) de leite de coco', 'leite'), false, 'leite de coco em medida NÃO deve casar com leite');

  function createMockItem(name: string, quantity = 1): FoodItem {
    return {
      id: `mock-${name}`,
      name,
      quantity,
      unit: 'un',
      category: 'other',
      state: 'fresh',
      location: 'geladeira',
      addedAt: new Date().toISOString(),
    };
  }

  // 6. Testes completos de calculateRecipeMatch, matchPercentage e isReadyToCook
  const sampleRecipe: Recipe = {
    id: 'teste-omelete',
    title: 'Omelete de Teste',
    description: 'Receita para teste de matching',
    prepTimeMinutes: 10,
    difficulty: 'Fácil',
    servings: 2,
    servingsBucket: '2',
    category: 'Prato Principal',
    imageUrl: '',
    tags: ['Teste'],
    sources: [{ sourceId: 'custom' }],
    ingredients: [
      { name: 'Ovos', quantity: '2', required: true },
      { name: 'Tomate', quantity: '1', required: true },
      { name: 'Cebola', quantity: '1/2', required: true },
      { name: 'Peito de Frango', quantity: '100g', required: false }, // opcional
    ],
    steps: ['Bater os ovos', 'Adicionar tomate e cebola', 'Cozinhar'],
    diet: {
      hasMeat: false,
      hasLactose: false,
      hasGluten: false,
      hasEgg: true,
      vegetarian: true,
      vegan: false,
      usesFrying: false,
      lowCarb: true,
      highProtein: true,
    }
  };

  // Cenário A: Inventário vazio -> 0%, missing todos, isReadyToCook false
  {
    const matchA = calculateRecipeMatch(sampleRecipe, []);
    assert.equal(matchA.matchedIngredients.length, 0, 'Sem itens no inventário nenhum deve casar');
    assert.equal(matchA.missingIngredients.length, 4, 'Todos os 4 ingredientes devem estar missing');
    assert.equal(matchA.matchPercentage, 0, 'matchPercentage deve ser 0%');
    assert.equal(matchA.isReadyToCook, false, 'isReadyToCook deve ser false');
  }

  // Cenário B: Itens com plural e sinônimos no inventário (ovos, tomates)
  // 2 dos 3 obrigatórios presentes -> 67%
  {
    const invB: FoodItem[] = [
      createMockItem('ovos', 6),
      createMockItem('tomates', 3),
      createMockItem('arroz', 1), // não relevante
    ];
    const matchB = calculateRecipeMatch(sampleRecipe, invB);
    assert.deepEqual(matchB.matchedIngredients, ['Ovos', 'Tomate'], 'ovos e tomates devem casar');
    assert.ok(matchB.missingIngredients.includes('Cebola'), 'Cebola deve estar missing');
    assert.ok(matchB.missingIngredients.includes('Peito de Frango'), 'Peito de Frango deve estar missing');
    assert.equal(matchB.matchPercentage, 67, 'matchPercentage deve ser 2/3 = 67%');
    assert.equal(matchB.isReadyToCook, false, 'isReadyToCook deve ser false pois falta cebola');
  }

  // Cenário C: Todos os obrigatórios presentes com variações (ovo, tomate, cebolas)
  // Opcional ausente não impede isReadyToCook
  {
    const invC: FoodItem[] = [
      createMockItem('ovo', 2),
      createMockItem('tomate', 1),
      createMockItem('cebolas', 2),
    ];
    const matchC = calculateRecipeMatch(sampleRecipe, invC);
    assert.equal(matchC.matchedIngredients.length, 3, 'Deve casar Ovos, Tomate e Cebola');
    assert.deepEqual(matchC.missingIngredients, ['Peito de Frango'], 'Apenas o ingrediente opcional deve faltar');
    assert.equal(matchC.matchPercentage, 100, 'matchPercentage dos obrigatórios deve ser 100%');
    assert.equal(matchC.isReadyToCook, true, 'isReadyToCook deve ser true com todos os obrigatórios');
  }

  // Cenário D: Frango genérico no inventário satisfaz Peito de Frango na receita
  {
    const invD: FoodItem[] = [
      createMockItem('ovos', 2),
      createMockItem('tomates', 1),
      createMockItem('cebola', 1),
      createMockItem('frango', 1),
    ];
    const matchD = calculateRecipeMatch(sampleRecipe, invD);
    assert.equal(matchD.matchedIngredients.length, 4, 'Todos os 4 ingredientes devem casar');
    assert.equal(matchD.missingIngredients.length, 0, 'Nenhum ingrediente deve faltar');
    assert.equal(matchD.matchPercentage, 100, 'matchPercentage deve ser 100%');
    assert.equal(matchD.isReadyToCook, true, 'isReadyToCook deve ser true');
  }

  // Cenário E: Item no inventário com quantidade 0 NÃO deve casar
  {
    const invE: FoodItem[] = [
      createMockItem('ovos', 0), // qtd zero
      createMockItem('tomate', 1),
      createMockItem('cebola', 1),
    ];
    const matchE = calculateRecipeMatch(sampleRecipe, invE);
    assert.ok(!matchE.matchedIngredients.includes('Ovos'), 'Ovos com qtd 0 não deve casar');
    assert.ok(matchE.missingIngredients.includes('Ovos'), 'Ovos com qtd 0 deve constar em missing');
    assert.equal(matchE.isReadyToCook, false, 'isReadyToCook deve ser false');
  }

  console.log('✅ Todos os testes de ingredientMatcher passaram com sucesso!');
}

// Execução direta se rodado via CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  runIngredientMatcherTests();
}
