import assert from 'node:assert/strict';
import {
  calculateListTotal,
  formatShoppingListAsText,
  mapShoppingItemsToInventory,
  ShoppingListService
} from './shoppingListService';
import { ShoppingList, ShoppingListItem } from '../types';

console.log('🧪 Iniciando testes de shoppingListService...');

// 1. Teste de cálculo de total da lista com arredondamento e precisão monetária
{
  const items: ShoppingListItem[] = [
    { id: '1', name: 'Leite', quantity: 2, unit: 'L', price: 5.50, completed: false, category: 'dairy' },
    { id: '2', name: 'Maçã', quantity: 1.5, unit: 'kg', price: 9.99, completed: true, category: 'fruits' },
    { id: '3', name: 'Ovos', quantity: 1, unit: 'un', price: 12.00, completed: false, category: 'proteins' },
  ];

  const total = calculateListTotal(items);
  // 2 * 5.50 = 11.00; 1.5 * 9.99 = 14.985; 1 * 12 = 12.00; soma = 37.985 -> arredondado para 37.99
  assert.equal(total, 37.99);
  console.log('✅ SUCESSO: calculateListTotal computou valor com precisão monetária (R$ 37.99)');
}

// 2. Teste de cálculo de total com lista vazia ou valores zerados
{
  assert.equal(calculateListTotal([]), 0);
  const itemsZero: ShoppingListItem[] = [
    { id: '1', name: 'Item', quantity: 0, unit: 'un', price: 0, completed: false, category: 'other' }
  ];
  assert.equal(calculateListTotal(itemsZero), 0);
  console.log('✅ SUCESSO: calculateListTotal lida com listas vazias e zeradas corretamente');
}

// 3. Teste de formatação de texto para compartilhamento
{
  const list: ShoppingList = {
    id: 'l1',
    title: 'Compras de Sábado',
    shoppingDate: '2025-03-15',
    shoppingTime: '10:30',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completed: false,
    total: 20.00,
    items: [
      { id: 'i1', name: 'Pão Francês', quantity: 6, unit: 'un', price: 1.00, completed: true, category: 'bakery' },
      { id: 'i2', name: 'Café Torrado', quantity: 1, unit: 'pct', price: 14.00, completed: false, category: 'pantry' }
    ]
  };

  const formatted = formatShoppingListAsText(list);
  assert.ok(formatted.includes('Compras de Sábado — 15/03/2025 — 10:30'), 'Deve formatar o título com data e horário');
  assert.ok(formatted.includes('🍞 6 Pão Francês — R$ 6,00'), 'Deve formatar item de padaria com emoji e preço');
  assert.ok(formatted.includes('☕ 1 pct Café Torrado — R$ 14,00'), 'Deve formatar item com unidade e emoji');
  assert.ok(formatted.includes('Total: R$ 20,00'), 'Deve exibir total estimado correto');
  console.log('✅ SUCESSO: formatShoppingListAsText gera texto legível para compartilhamento');
}

// 4. Teste de mapeamento para o inventário da Geladeira
{
  const items: ShoppingListItem[] = [
    { id: 'i1', name: 'Queijo Minas', quantity: 1, unit: 'un', price: 15.00, completed: true, category: 'dairy' },
    { id: 'i2', name: 'Arroz Branco', quantity: 2, unit: 'kg', price: 6.00, completed: true, category: 'pantry' },
    { id: 'i3', name: 'Tomate', quantity: 4, unit: 'un', price: 2.50, completed: true, category: 'vegetables' },
  ];

  const mapped = mapShoppingItemsToInventory(items, 'Compras Semanais');
  assert.equal(mapped.length, 3);
  assert.equal(mapped[0].name, 'Queijo Minas');
  assert.equal(mapped[0].category, 'dairy');
  assert.equal(mapped[0].location, 'geladeira');
  assert.equal(mapped[0].state, 'fresh');
  assert.equal(mapped[0].notes, 'Comprado na lista: Compras Semanais');

  assert.equal(mapped[1].name, 'Arroz Branco');
  assert.equal(mapped[1].category, 'pantry');
  assert.equal(mapped[1].location, 'despensa');

  assert.equal(mapped[2].name, 'Tomate');
  assert.equal(mapped[2].category, 'vegetables');
  assert.equal(mapped[2].location, 'geladeira');
  console.log('✅ SUCESSO: mapShoppingItemsToInventory transfere itens preservando categorias e atributos de inventário');
}

console.log('🎉 Todos os testes de shoppingListService passaram com sucesso!');
