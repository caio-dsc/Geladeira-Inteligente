import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { ShoppingList, ShoppingListItem, FoodItem } from '../types';

/**
 * Utilitário de cálculo de total da lista com precisão monetária (BRL)
 * Utiliza centavos inteiros para evitar acúmulo de imprecisões de ponto flutuante
 */
export function calculateListTotal(items: ShoppingListItem[]): number {
  if (!items || !Array.isArray(items)) return 0;
  const totalCents = items.reduce((sumCents, item) => {
    const qty = Math.max(0, Number(item.quantity) || 0);
    const price = Math.max(0, Number(item.price) || 0);
    const subtotalCents = Math.round(qty * price * 100);
    return sumCents + subtotalCents;
  }, 0);
  return totalCents / 100;
}

/**
 * Retorna emoji contextual baseado no nome ou categoria do alimento
 */
export function getItemEmoji(name: string, category?: string): string {
  const n = (name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (n.includes('ovo')) return '🥚';
  if (n.includes('pao') || n.includes('torrada') || n.includes('croissant')) return '🍞';
  if (n.includes('leite')) return '🥛';
  if (n.includes('queijo')) return '🧀';
  if (n.includes('arroz')) return '🍚';
  if (n.includes('feijao')) return '🫘';
  if (n.includes('cafe')) return '☕';
  if (n.includes('maca')) return '🍎';
  if (n.includes('banana')) return '🍌';
  if (n.includes('laranja')) return '🍊';
  if (n.includes('morango')) return '🍓';
  if (n.includes('uva')) return '🍇';
  if (n.includes('abacaxi')) return '🍍';
  if (n.includes('frango') || n.includes('galinha')) return '🍗';
  if (n.includes('carne') || n.includes('bife') || n.includes('alcatra')) return '🥩';
  if (n.includes('peixe') || n.includes('salmao') || n.includes('tilapia')) return '🐟';
  if (n.includes('tomate')) return '🍅';
  if (n.includes('cenoura')) return '🥕';
  if (n.includes('batata')) return '🥔';
  if (n.includes('cebola')) return '🧅';
  if (n.includes('alho')) return '🧄';
  if (n.includes('manteiga') || n.includes('requeijao') || n.includes('iogurte')) return '🧈';
  if (n.includes('agua') || n.includes('suco') || n.includes('refrigerante') || n.includes('cha')) return '🧃';
  if (n.includes('azeite') || n.includes('oleo') || n.includes('vinagre') || n.includes('molho')) return '🧂';

  switch (category) {
    case 'vegetables': return '🥬';
    case 'fruits': return '🍎';
    case 'dairy': return '🥛';
    case 'proteins': return '🥩';
    case 'drinks': return '🧃';
    case 'pantry': return '🥫';
    case 'bakery': return '🍞';
    case 'condiments': return '🧂';
    default: return '🛒';
  }
}

/**
 * Formata a lista de compras em texto estruturado, limpo e legível para WhatsApp / Bloco de Notas
 */
export function formatShoppingListAsText(list: ShoppingList): string {
  const lines: string[] = [];

  const titlePart = list.title || 'Lista de Mercado';
  const dateParts: string[] = [];
  if (list.shoppingDate) {
    dateParts.push(list.shoppingDate.split('-').reverse().join('/'));
  }
  if (list.shoppingTime) {
    dateParts.push(list.shoppingTime);
  }

  const header = dateParts.length > 0 
    ? `${titlePart} — ${dateParts.join(' — ')}`
    : titlePart;

  lines.push(header);
  lines.push('');

  const items = list.items || [];
  if (items.length === 0) {
    lines.push('(Nenhum item na lista)');
  } else {
    items.forEach((item) => {
      const emoji = getItemEmoji(item.name, item.category);
      const unitLabel = item.unit && item.unit !== 'un' ? ` ${item.unit}` : '';
      const qtyStr = `${item.quantity}${unitLabel}`;
      const subtotal = Math.round((Number(item.quantity) || 1) * (Number(item.price) || 0) * 100) / 100;
      const priceStr = subtotal > 0
        ? ` — R$ ${subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : '';
      lines.push(`${emoji} ${qtyStr} ${item.name}${priceStr}`);
    });
  }

  const total = calculateListTotal(items);
  lines.push('');
  lines.push(`Total: R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);

  return lines.join('\n');
}

/**
 * Mapeia itens da lista de compras para alimentos do inventário (Geladeira)
 */
export function mapShoppingItemsToInventory(
  items: ShoppingListItem[],
  listTitle: string
): Array<Omit<FoodItem, 'id' | 'addedAt'>> {
  return items.map((item) => {
    const isFridgeCategory = ['vegetables', 'fruits', 'dairy', 'proteins', 'drinks'].includes(item.category || '');
    return {
      name: item.name.trim(),
      category: item.category || 'other',
      quantity: Math.max(1, Number(item.quantity) || 1),
      unit: item.unit || 'un',
      state: 'fresh',
      location: isFridgeCategory ? 'geladeira' : 'despensa',
      notes: `Comprado na lista: ${listTitle}`,
    };
  });
}

/**
 * Obtenção segura e tardia da instância Firestore (compatível com runtime browser e testes Node)
 */
async function getFirestoreDb() {
  try {
    const { db } = await import('./firebaseConfig');
    return db;
  } catch {
    return null;
  }
}

export class ShoppingListService {
  private localListsKey(userId: string) {
    return `geladeira_shopping_lists_${userId || 'guest'}`;
  }

  private getLocalLists(userId: string): ShoppingList[] {
    try {
      const raw = localStorage.getItem(this.localListsKey(userId));
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveLocalLists(userId: string, lists: ShoppingList[]) {
    try {
      localStorage.setItem(this.localListsKey(userId), JSON.stringify(lists));
    } catch {
      // ignora em ambientes restritos ou testes
    }
  }

  /**
   * Assina atualizações em tempo real das listas de compras do usuário no Firestore
   */
  public subscribeShoppingLists(
    userId: string,
    callback: (lists: ShoppingList[]) => void
  ): () => void {
    if (!userId) {
      callback([]);
      return () => {};
    }

    let isUnsubscribed = false;
    let realUnsubscribe: (() => void) | null = null;

    // Dispara imediatamente o cache local para carregamento rápido sem layout shifts
    callback(this.getLocalLists(userId));

    getFirestoreDb().then((db) => {
      if (isUnsubscribed || !db) return;

      try {
        const colRef = collection(db, 'users', userId, 'shoppingLists');
        const q = query(colRef, orderBy('createdAt', 'desc'));

        realUnsubscribe = onSnapshot(
          q,
          (snapshot) => {
            if (isUnsubscribed) return;
            const lists: ShoppingList[] = snapshot.docs.map((docSnap) => {
              const data = docSnap.data();
              const items = (data.items || []) as ShoppingListItem[];
              return {
                id: docSnap.id,
                userId,
                title: data.title || 'Lista sem título',
                shoppingDate: data.shoppingDate || '',
                shoppingTime: data.shoppingTime || '',
                createdAt: data.createdAt || new Date().toISOString(),
                updatedAt: data.updatedAt || new Date().toISOString(),
                completed: Boolean(data.completed),
                total: calculateListTotal(items),
                items,
              };
            });
            this.saveLocalLists(userId, lists);
            callback(lists);
          },
          (error) => {
            console.warn('Erro ao escutar listas de compras do Firestore, usando fallback local:', error);
            callback(this.getLocalLists(userId));
          }
        );
      } catch (e) {
        console.warn('Falha na inscrição do Firestore para listas:', e);
        callback(this.getLocalLists(userId));
      }
    });

    return () => {
      isUnsubscribed = true;
      if (realUnsubscribe) {
        realUnsubscribe();
      }
    };
  }

  /**
   * Busca todas as listas de compras do usuário
   */
  public async getShoppingLists(userId: string): Promise<ShoppingList[]> {
    if (!userId) return [];
    try {
      const db = await getFirestoreDb();
      if (db) {
        const colRef = collection(db, 'users', userId, 'shoppingLists');
        const q = query(colRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const lists = snapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            const items = (data.items || []) as ShoppingListItem[];
            return {
              id: docSnap.id,
              userId,
              title: data.title || 'Lista sem título',
              shoppingDate: data.shoppingDate || '',
              shoppingTime: data.shoppingTime || '',
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt || new Date().toISOString(),
              completed: Boolean(data.completed),
              total: calculateListTotal(items),
              items,
            };
          });
          this.saveLocalLists(userId, lists);
          return lists;
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar listas do Firestore, recorrendo a local:', e);
    }
    return this.getLocalLists(userId);
  }

  /**
   * Cria uma nova lista de compras
   */
  public async createShoppingList(
    userId: string,
    data: {
      title: string;
      shoppingDate?: string;
      shoppingTime?: string;
      items?: ShoppingListItem[];
    }
  ): Promise<ShoppingList> {
    const now = new Date().toISOString();
    const id = `list_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const items = data.items || [];
    const total = calculateListTotal(items);

    const newList: ShoppingList = {
      id,
      userId,
      title: data.title.trim() || 'Minha Lista de Mercado',
      shoppingDate: data.shoppingDate || '',
      shoppingTime: data.shoppingTime || '',
      createdAt: now,
      updatedAt: now,
      completed: false,
      total,
      items,
    };

    if (userId) {
      try {
        const db = await getFirestoreDb();
        if (db) {
          const docRef = doc(db, 'users', userId, 'shoppingLists', id);
          await setDoc(docRef, newList);
        }
      } catch (e) {
        console.warn('Erro ao salvar lista no Firestore, mantendo local:', e);
      }
    }

    const currentLocal = this.getLocalLists(userId);
    this.saveLocalLists(userId, [newList, ...currentLocal]);
    return newList;
  }

  /**
   * Atualiza dados de cabeçalho da lista (título, data, horário, status de conclusão)
   */
  public async updateShoppingList(
    userId: string,
    listId: string,
    updates: Partial<Omit<ShoppingList, 'id' | 'createdAt'>>
  ): Promise<void> {
    const now = new Date().toISOString();
    const cleanUpdates: Record<string, any> = {
      ...updates,
      updatedAt: now,
    };

    if (updates.items) {
      cleanUpdates.total = calculateListTotal(updates.items);
    }

    if (userId) {
      try {
        const db = await getFirestoreDb();
        if (db) {
          const docRef = doc(db, 'users', userId, 'shoppingLists', listId);
          await updateDoc(docRef, cleanUpdates);
        }
      } catch (e) {
        console.warn('Erro ao atualizar lista no Firestore:', e);
      }
    }

    const currentLocal = this.getLocalLists(userId);
    const index = currentLocal.findIndex((l) => l.id === listId);
    if (index !== -1) {
      currentLocal[index] = {
        ...currentLocal[index],
        ...cleanUpdates,
      };
      this.saveLocalLists(userId, currentLocal);
    }
  }

  /**
   * Exclui uma lista inteira
   */
  public async deleteShoppingList(userId: string, listId: string): Promise<void> {
    if (userId) {
      try {
        const db = await getFirestoreDb();
        if (db) {
          const docRef = doc(db, 'users', userId, 'shoppingLists', listId);
          await deleteDoc(docRef);
        }
      } catch (e) {
        console.warn('Erro ao remover lista do Firestore:', e);
      }
    }

    const currentLocal = this.getLocalLists(userId);
    const filtered = currentLocal.filter((l) => l.id !== listId);
    this.saveLocalLists(userId, filtered);
  }

  /**
   * Adiciona um novo item a uma lista existente
   */
  public async addItemToList(
    userId: string,
    list: ShoppingList,
    itemData: Omit<ShoppingListItem, 'id'>
  ): Promise<ShoppingList> {
    const newItem: ShoppingListItem = {
      ...itemData,
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: itemData.name.trim(),
      quantity: Math.max(1, Number(itemData.quantity) || 1),
      price: Math.max(0, Number(itemData.price) || 0),
      completed: Boolean(itemData.completed),
      category: itemData.category || 'other',
    };

    const updatedItems = [...list.items, newItem];
    const newTotal = calculateListTotal(updatedItems);

    const updatedList: ShoppingList = {
      ...list,
      items: updatedItems,
      total: newTotal,
      updatedAt: new Date().toISOString(),
    };

    await this.updateShoppingList(userId, list.id, {
      items: updatedItems,
      total: newTotal,
    });

    return updatedList;
  }

  /**
   * Atualiza um item individual dentro da lista
   */
  public async updateItemInList(
    userId: string,
    list: ShoppingList,
    itemId: string,
    itemUpdates: Partial<Omit<ShoppingListItem, 'id'>>
  ): Promise<ShoppingList> {
    const updatedItems = list.items.map((it) => {
      if (it.id === itemId) {
        return {
          ...it,
          ...itemUpdates,
          name: itemUpdates.name !== undefined ? itemUpdates.name.trim() : it.name,
          quantity: itemUpdates.quantity !== undefined ? Math.max(1, Number(itemUpdates.quantity) || 1) : it.quantity,
          price: itemUpdates.price !== undefined ? Math.max(0, Number(itemUpdates.price) || 0) : it.price,
        };
      }
      return it;
    });

    const newTotal = calculateListTotal(updatedItems);
    const updatedList: ShoppingList = {
      ...list,
      items: updatedItems,
      total: newTotal,
      updatedAt: new Date().toISOString(),
    };

    await this.updateShoppingList(userId, list.id, {
      items: updatedItems,
      total: newTotal,
    });

    return updatedList;
  }

  /**
   * Alterna o status de concluído/carrinho de um item
   */
  public async toggleItemCompleted(
    userId: string,
    list: ShoppingList,
    itemId: string
  ): Promise<ShoppingList> {
    const target = list.items.find((i) => i.id === itemId);
    if (!target) return list;
    return this.updateItemInList(userId, list, itemId, {
      completed: !target.completed,
    });
  }

  /**
   * Remove um item da lista
   */
  public async deleteItemFromList(
    userId: string,
    list: ShoppingList,
    itemId: string
  ): Promise<ShoppingList> {
    const updatedItems = list.items.filter((it) => it.id !== itemId);
    const newTotal = calculateListTotal(updatedItems);
    const updatedList: ShoppingList = {
      ...list,
      items: updatedItems,
      total: newTotal,
      updatedAt: new Date().toISOString(),
    };

    await this.updateShoppingList(userId, list.id, {
      items: updatedItems,
      total: newTotal,
    });

    return updatedList;
  }

  /**
   * Finaliza a compra: transfere itens comprados para o inventário da Geladeira
   * de forma atômica (WriteBatch do Firestore) e marca a lista como concluída
   */
  public async finalizePurchase(
    userId: string,
    list: ShoppingList,
    options: { sendOnlyCompleted?: boolean } = { sendOnlyCompleted: true }
  ): Promise<{ transferredCount: number }> {
    const candidateItems = options.sendOnlyCompleted
      ? list.items.filter((i) => i.completed)
      : list.items;

    if (candidateItems.length === 0) {
      return { transferredCount: 0 };
    }

    const now = new Date().toISOString();

    if (userId) {
      try {
        const db = await getFirestoreDb();
        if (db) {
          const { writeBatch } = await import('firebase/firestore');
          const { firestoreService, normalizeText } = await import('./firestoreService');

          // 1. Busca itens atuais do inventário do usuário para consolidar e evitar duplicatas
          const currentInventory = await firestoreService.getInventory(userId);
          const inventoryMap = new Map<string, FoodItem>();
          currentInventory.forEach((item) => {
            const key = `${normalizeText(item.name)}__${item.category}`;
            inventoryMap.set(key, item);
          });

          // 2. Cria WriteBatch atômico
          const batch = writeBatch(db);

          candidateItems.forEach((cItem) => {
            const name = cItem.name.trim();
            const nameKey = normalizeText(name);
            const category = cItem.category || 'other';
            const quantity = Math.max(1, Number(cItem.quantity) || 1);
            const isFridgeCategory = ['vegetables', 'fruits', 'dairy', 'proteins', 'drinks'].includes(category);
            const location = isFridgeCategory ? 'geladeira' : 'despensa';
            const mapKey = `${nameKey}__${category}`;

            const existing = inventoryMap.get(mapKey);
            if (existing) {
              // Incrementa quantidade do item existente de forma atômica
              const existingRef = doc(db, 'users', userId, 'inventory', existing.id);
              const newQty = (Number(existing.quantity) || 0) + quantity;
              batch.update(existingRef, {
                quantity: newQty,
                updatedAt: now,
              });
              existing.quantity = newQty; // Mantém referência para múltiplos itens do mesmo nome na lista
            } else {
              // Cria novo alimento no inventário
              const newDocRef = doc(collection(db, 'users', userId, 'inventory'));
              const newItemData: FoodItem = {
                id: newDocRef.id,
                name,
                nameKey,
                category,
                quantity,
                unit: cItem.unit || 'un',
                state: 'fresh',
                location,
                addedAt: now,
                notes: `Comprado na lista: ${list.title}`,
              };
              batch.set(newDocRef, newItemData);
              inventoryMap.set(mapKey, newItemData);
            }
          });

          // 3. Atualiza estado da lista de compras para concluída no mesmo lote atômico
          const listRef = doc(db, 'users', userId, 'shoppingLists', list.id);
          batch.update(listRef, {
            completed: true,
            updatedAt: now,
          });

          // 4. Executa o commit atômico de todas as operações simultaneamente
          await batch.commit();

          // 5. Notifica o serviço de inventário para sincronizar a interface do usuário
          try {
            const { foodService } = await import('./foodService');
            await foodService.getItems();
          } catch {
            // sincronização do cache local
          }

          // Atualiza cache local
          this.updateLocalListCompleted(userId, list.id);
          return { transferredCount: candidateItems.length };
        }
      } catch (err) {
        console.error('Erro na finalização atômica de compra no Firestore:', err);
        throw err;
      }
    }

    // Fallback local caso não autenticado ou em ambiente sem Firestore
    try {
      const { foodService } = await import('./foodService');
      const inventoryItems = mapShoppingItemsToInventory(candidateItems, list.title);
      await foodService.addMultipleItems(inventoryItems);
    } catch {
      // fallback
    }

    this.updateLocalListCompleted(userId, list.id);
    return { transferredCount: candidateItems.length };
  }

  private updateLocalListCompleted(userId: string, listId: string) {
    const currentLocal = this.getLocalLists(userId);
    const index = currentLocal.findIndex((l) => l.id === listId);
    if (index !== -1) {
      currentLocal[index] = {
        ...currentLocal[index],
        completed: true,
        updatedAt: new Date().toISOString(),
      };
      this.saveLocalLists(userId, currentLocal);
    }
  }
}

export const shoppingListService = new ShoppingListService();
