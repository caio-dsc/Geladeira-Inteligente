import { resolveFoodCategory, normalizeTaxonomyName } from './foodTaxonomy';

console.log('🧪 Iniciando testes de Food Taxonomy...');

const cases: Array<{ input: string; aiCategory?: any; expected: string }> = [
  // Casos obrigatórios de Frutas
  { input: 'banana', aiCategory: 'proteins', expected: 'fruits' },
  { input: 'Banana', aiCategory: 'proteins', expected: 'fruits' },
  { input: 'BANANA', aiCategory: 'proteins', expected: 'fruits' },
  { input: 'banana prata', aiCategory: 'proteins', expected: 'fruits' },
  { input: 'banana nanica', aiCategory: 'other', expected: 'fruits' },
  { input: 'maçã', aiCategory: 'vegetables', expected: 'fruits' },
  { input: 'MANGA', aiCategory: 'proteins', expected: 'fruits' },
  { input: 'morango', aiCategory: 'pantry', expected: 'fruits' },
  { input: 'abacaxi', aiCategory: 'proteins', expected: 'fruits' },
  { input: 'laranja', aiCategory: 'proteins', expected: 'fruits' },
  { input: 'abacate', aiCategory: 'vegetables', expected: 'fruits' },

  // Frutas nativas da lista
  { input: 'açaí', expected: 'fruits' },
  { input: 'acerola', expected: 'fruits' },
  { input: 'maracujá', expected: 'fruits' },
  { input: 'melancia', expected: 'fruits' },
  { input: 'uva', expected: 'fruits' },
  { input: 'kiwi', expected: 'fruits' },
  { input: 'graviola', expected: 'fruits' },

  // Casos de Proteínas
  { input: 'frango', aiCategory: 'vegetables', expected: 'proteins' },
  { input: 'carne', aiCategory: 'other', expected: 'proteins' },
  { input: 'carne bovina', aiCategory: 'pantry', expected: 'proteins' },
  { input: 'peixe', aiCategory: 'fruits', expected: 'proteins' },
  { input: 'ovo', aiCategory: 'dairy', expected: 'proteins' },
  { input: 'Ovos Caipiras', aiCategory: 'fruits', expected: 'proteins' },

  // Casos de Laticínios
  { input: 'leite', aiCategory: 'proteins', expected: 'dairy' },
  { input: 'queijo', aiCategory: 'proteins', expected: 'dairy' },
  { input: 'iogurte', aiCategory: 'fruits', expected: 'dairy' },
  { input: 'requeijão', expected: 'dairy' },

  // Casos compostos que NÃO devem virar fruits
  { input: 'bolo de banana', aiCategory: 'bakery', expected: 'bakery' },
  { input: 'vitamina de banana', aiCategory: 'drinks', expected: 'drinks' },
  { input: 'torta de maçã', aiCategory: 'bakery', expected: 'bakery' },
  { input: 'suco de laranja', aiCategory: 'drinks', expected: 'drinks' },
  { input: 'doce de morango', aiCategory: 'pantry', expected: 'pantry' },
];

let failed = 0;
for (const c of cases) {
  const result = resolveFoodCategory(c.input, c.aiCategory);
  if (result !== c.expected) {
    console.error(`❌ FALHA: "${c.input}" (IA: ${c.aiCategory}) -> Esperado: ${c.expected}, Obtido: ${result}`);
    failed++;
  } else {
    console.log(`✅ SUCESSO: "${c.input}" -> ${result}`);
  }
}

if (failed > 0) {
  console.error(`\n❌ ${failed} testes falharam.`);
  process.exit(1);
} else {
  console.log('\n🎉 Todos os testes de foodTaxonomy passaram com sucesso!');
}
