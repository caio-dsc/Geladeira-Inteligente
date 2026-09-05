import assert from 'node:assert/strict';
import { computeDietFlags, hasTerm, hasAny } from './dietHeuristics';

console.log('🧪 Iniciando testes de dietHeuristics...');

// 1. Proteção contra substrings / fronteira de palavras
assert.equal(hasTerm('rendimento: de 4 a 6 porções.', 'porco'), false, 'porções não deve casar com porco');
assert.equal(hasTerm('pimentão vermelho fresco', 'mel'), false, 'vermelho não deve casar com mel');
assert.equal(hasTerm('200g de cogumelos frescos', 'mel'), false, 'cogumelos não deve casar com mel');
assert.equal(hasTerm('2 dentes de alho amassados', 'massa'), false, 'amassados não deve casar com massa');
assert.equal(hasTerm('2 dentes de alho amassado', 'massa'), false, 'amassado não deve casar com massa');
assert.equal(hasTerm('1/2 kg de carne de porco salgada', 'porco'), true, 'carne de porco deve casar com porco');
assert.equal(hasTerm('2 colheres de mel de abelha', 'mel'), true, 'mel de abelha deve casar com mel');
assert.equal(hasTerm('farinha de trigo peneirada', 'farinha de trigo'), true, 'farinha de trigo deve casar');

{
  const diet = computeDietFlags(
    ['pimentão vermelho', 'alho amassado', 'rendimento: 4 porções'],
    ['mexa bem']
  );
  assert.equal(diet.hasMeat, false, 'porções não pode disparar hasMeat');
  assert.equal(diet.hasGluten, false, 'alho amassado não pode disparar glúten');
  assert.equal(diet.vegan, true, 'pimentão vermelho não tem mel/lactose/carne');
}

// 2. Carnes, peixes e frutos do mar
{
  const peixes = [
    ['1 e 1/2 kg de filés de garoupa'],
    ['700 g de camarões brancos limpos'],
    ['filé de pintado fresco'],
    ['posta de surubim'],
  ];

  for (const ing of peixes) {
    const diet = computeDietFlags(ing);
    assert.equal(diet.hasMeat, true, `Deve identificar carne/pescado em: ${ing[0]}`);
    assert.equal(diet.vegetarian, false, `Não deve ser vegetariano: ${ing[0]}`);
    assert.equal(diet.highProtein, true, `Pescados devem ser ricos em proteína: ${ing[0]}`);
  }
}

// 3. Título na detecção de origem animal
{
  const diet = computeDietFlags(
    ['1 kg de filés', 'temperos a gosto'],
    ['cozinhe em fogo brando'],
    'Moqueca de peixe e camarão'
  );
  assert.equal(diet.hasMeat, true, 'Título com peixe e camarão deve disparar hasMeat');
  assert.equal(diet.vegetarian, false, 'Título com peixe e camarão não pode ser vegetariano');
}

// 4. Leite de coco x Lactose
{
  const dietCoco1 = computeDietFlags(['400 ml de leite de coco', 'peixe', 'coentro']);
  assert.equal(dietCoco1.hasLactose, false, '400 ml de leite de coco NÃO deve conter lactose');

  const dietCoco2 = computeDietFlags(['leite do coco fresco ralado']);
  assert.equal(dietCoco2.hasLactose, false, 'leite do coco fresco NÃO deve conter lactose');

  const dietCoco3 = computeDietFlags(['creme de coco vegetal']);
  assert.equal(dietCoco3.hasLactose, false, 'creme de coco NÃO deve conter lactose');
}

// 5. Laticínios reais
{
  const laticinios = [
    '1 copo de leite integral',
    '1 lata de leite condensado',
    '200g de queijo minas curado',
    '2 colheres de manteiga',
    '1 caixa de creme de leite',
    '1 pote de requeijão',
  ];

  for (const lat of laticinios) {
    const diet = computeDietFlags([lat]);
    assert.equal(diet.hasLactose, true, `Deve detectar lactose em: ${lat}`);
  }
}

// 6. Ingredientes Sem Glúten (não disparar por "farinha")
{
  const semGluten = [
    '1 xícara de farinha de mandioca',
    '500g de polvilho azedo',
    '500g de polvilho doce',
    'tapioca hidratada',
    'farinha de milho amarela',
  ];

  for (const ing of semGluten) {
    const diet = computeDietFlags([ing]);
    assert.equal(diet.hasGluten, false, `Não deve ter glúten: ${ing}`);
  }
}

// 7. Ingredientes com Glúten
{
  const comGluten = [
    '2 xícaras de farinha de trigo',
    'farinha de rosca para empanar',
    '6 pães frescos',
    'macarrão espaguete',
  ];

  for (const ing of comGluten) {
    const diet = computeDietFlags([ing]);
    assert.equal(diet.hasGluten, true, `Deve acusar glúten: ${ing}`);
  }
}

// 8. Origem animal via caldos
{
  const caldos = ['1 tablete de caldo de galinha', '1 cubo de caldo de carne'];
  for (const c of caldos) {
    const diet = computeDietFlags([c]);
    assert.equal(diet.hasMeat, true, `Caldo deve indicar carne: ${c}`);
    assert.equal(diet.vegetarian, false, `Caldo não é vegetariano: ${c}`);
  }
}

// 9. Fritura por imersão vs Refogado / Selagem
{
  const refogado = computeDietFlags(
    ['cebola', 'alho', 'óleo'],
    ['frite a cebola e o alho até dourar', 'junte o molho e cozinhe']
  );
  assert.equal(refogado.usesFrying, false, 'frite a cebola e o alho até dourar NÃO é fritura por imersão');

  const imersao = computeDietFlags(
    ['massa de coxinha', 'óleo'],
    ['frite em óleo bem quente e retire com escumadeira']
  );
  assert.equal(imersao.usesFrying, true, 'frite em óleo bem quente e retire com escumadeira É fritura por imersão');
}

// 10. Ovo e maionese (Strogonoff de legumes)
{
  const strogonoffLegumes = computeDietFlags(
    [
      '1/2 xícara de maionese',
      '4 colheres de farinha de trigo',
      '1 xícara de leite',
      '3 xícaras de legumes em cubos',
      'rendimento de 4 a 6 porções'
    ],
    ['refogue os legumes', 'adicione a maionese e misture bem'],
    'Strogonoff de legumes'
  );

  assert.equal(strogonoffLegumes.hasMeat, false, 'Strogonoff de legumes não tem carne');
  assert.equal(strogonoffLegumes.vegetarian, true, 'Strogonoff de legumes é vegetariano');
  assert.equal(strogonoffLegumes.hasEgg, true, 'Maionese contém ovo (hasEgg === true)');
  assert.equal(strogonoffLegumes.vegan, false, 'Contém ovo e lactose, logo não é vegano');
  assert.equal(strogonoffLegumes.highProtein, false, 'Não deve ser classificado como rico em proteína');
  assert.equal(strogonoffLegumes.usesFrying, false, 'Não usa fritura por imersão');
}

// 11. Low Carb em Moqueca, Pão de Queijo e Brigadeiro
{
  const moqueca = computeDietFlags(
    ['Filé de Peixe Branco', 'Pimentão Vermelho', 'Pimentão Amarelo', 'Tomate', 'Cebola', 'Leite de Coco', 'Azeite de Dendê'],
    ['cozinhe em panela de barro por 20 minutos'],
    'Moqueca Baiana com Leite de Coco e Dendê'
  );
  assert.equal(moqueca.lowCarb, true, 'Moqueca baiana tradicional é low carb');
  assert.equal(moqueca.hasLactose, false, 'Moqueca baiana tradicional não tem lactose');

  const paoDeQueijo = computeDietFlags(
    ['Polvilho azedo', 'Queijo minas', 'Ovos', 'Leite', 'Óleo'],
    ['asse em forno médio por 25 minutos'],
    'Pão de queijo mineiro crocante'
  );
  assert.equal(paoDeQueijo.lowCarb, false, 'Pão de queijo com polvilho NÃO é low carb');

  const brigadeiro = computeDietFlags(
    ['Leite condensado', 'Chocolate em pó', 'Manteiga'],
    ['misture e mexa até soltar do fundo da panela'],
    'Brigadeiro gourmet'
  );
  assert.equal(brigadeiro.lowCarb, false, 'Brigadeiro com leite condensado NÃO é low carb');
}

// ============================================================================
// SUÍTE DE TESTES OBRIGATÓRIOS CONFORME ESPECIFICAÇÃO
// ============================================================================

// 1. "porções" => não detecta porco
assert.equal(hasTerm('porções', 'porco'), false, '"porções" não detecta porco');
assert.equal(computeDietFlags(['porções']).hasMeat, false, '"porções" não ativa hasMeat');

// 2. "pimentão vermelho" => não detecta mel
assert.equal(hasTerm('pimentão vermelho', 'mel'), false, '"pimentão vermelho" não detecta mel');

// 3. "cogumelo" => não detecta mel
assert.equal(hasTerm('cogumelo', 'mel'), false, '"cogumelo" não detecta mel');
assert.equal(hasTerm('cogumelos', 'mel'), false, '"cogumelos" não detecta mel');

// 4. "alho amassado" => não detecta massa
assert.equal(hasTerm('alho amassado', 'massa'), false, '"alho amassado" não detecta massa');
assert.equal(computeDietFlags(['alho amassado']).hasGluten, false, '"alho amassado" não ativa hasGluten');

// 5. "leite de coco" => hasLactose=false
assert.equal(computeDietFlags(['leite de coco']).hasLactose, false, '"leite de coco" => hasLactose=false');

// 6. "leite do coco" => hasLactose=false
assert.equal(computeDietFlags(['leite do coco']).hasLactose, false, '"leite do coco" => hasLactose=false');

// 7. "leite integral" => hasLactose=true
assert.equal(computeDietFlags(['leite integral']).hasLactose, true, '"leite integral" => hasLactose=true');

// 8. "leite condensado" => hasLactose=true e lowCarb=false
{
  const res = computeDietFlags(['leite condensado']);
  assert.equal(res.hasLactose, true, '"leite condensado" => hasLactose=true');
  assert.equal(res.lowCarb, false, '"leite condensado" => lowCarb=false');
}

// 9. "queijo" => hasLactose=true
assert.equal(computeDietFlags(['queijo']).hasLactose, true, '"queijo" => hasLactose=true');

// 10. "manteiga" => hasLactose=true
assert.equal(computeDietFlags(['manteiga']).hasLactose, true, '"manteiga" => hasLactose=true');

// 11. "farinha de mandioca" => hasGluten=false
assert.equal(computeDietFlags(['farinha de mandioca']).hasGluten, false, '"farinha de mandioca" => hasGluten=false');

// 12. "polvilho azedo" => hasGluten=false e lowCarb=false
{
  const res = computeDietFlags(['polvilho azedo']);
  assert.equal(res.hasGluten, false, '"polvilho azedo" => hasGluten=false');
  assert.equal(res.lowCarb, false, '"polvilho azedo" => lowCarb=false');
}

// 13. "farinha de trigo" => hasGluten=true
assert.equal(computeDietFlags(['farinha de trigo']).hasGluten, true, '"farinha de trigo" => hasGluten=true');

// 14. "camarões brancos" => hasMeat=true e vegetarian=false
{
  const res = computeDietFlags(['camarões brancos']);
  assert.equal(res.hasMeat, true, '"camarões brancos" => hasMeat=true');
  assert.equal(res.vegetarian, false, '"camarões brancos" => vegetarian=false');
}

// 15. "garoupa" => hasMeat=true e vegetarian=false
{
  const res = computeDietFlags(['garoupa']);
  assert.equal(res.hasMeat, true, '"garoupa" => hasMeat=true');
  assert.equal(res.vegetarian, false, '"garoupa" => vegetarian=false');
}

// 16. "caldo de galinha" => hasMeat=true e vegetarian=false
{
  const res = computeDietFlags(['caldo de galinha']);
  assert.equal(res.hasMeat, true, '"caldo de galinha" => hasMeat=true');
  assert.equal(res.vegetarian, false, '"caldo de galinha" => vegetarian=false');
}

// 17. "maionese" => hasEgg=true
assert.equal(computeDietFlags(['maionese']).hasEgg, true, '"maionese" => hasEgg=true');

// 18. passos "frite a cebola até dourar" => usesFrying=false
assert.equal(
  computeDietFlags(['cebola'], ['frite a cebola até dourar']).usesFrying,
  false,
  'passos "frite a cebola até dourar" => usesFrying=false'
);

// 19. passos "frite em óleo bem quente e retire com escumadeira" => usesFrying=true
assert.equal(
  computeDietFlags(['coxinha'], ['frite em óleo bem quente e retire com escumadeira']).usesFrying,
  true,
  'passos "frite em óleo bem quente e retire com escumadeira" => usesFrying=true'
);

// 20. passos "fritura por imersão" => usesFrying=true
assert.equal(
  computeDietFlags(['bolinho'], ['fritura por imersão']).usesFrying,
  true,
  'passos "fritura por imersão" => usesFrying=true'
);

console.log('✅ Todos os testes de dietHeuristics passaram com sucesso!');
