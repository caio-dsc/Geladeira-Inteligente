import { FoodItem } from '../types';
import { INITIAL_FOOD_ITEMS } from '../data/mockData';
import { firestoreService, normalizeText } from './firestoreService';
import { auth } from './firebaseConfig';

export interface IFoodService {
  getItems(): Promise<FoodItem[]>;
  getItemById(id: string): Promise<FoodItem | null>;
  addItem(item: Omit<FoodItem, 'id' | 'addedAt'>): Promise<FoodItem>;
  addMultipleItems(items: Array<Omit<FoodItem, 'id' | 'addedAt'>>): Promise<FoodItem[]>;
  updateItem(id: string, updates: Partial<Omit<FoodItem, 'id'>>): Promise<FoodItem>;
  deleteItem(id: string): Promise<boolean>;
  resetToDefault(): Promise<FoodItem[]>;
  subscribe(callback: (items: FoodItem[]) => void): () => void;
}

class FoodService implements IFoodService {
  private items: FoodItem[] = [...INITIAL_FOOD_ITEMS];
  private listeners: Array<(items: FoodItem[]) => void> = [];
  private unsubscribeFirestore: (() => void) | null = null;

  constructor() {
    this.initAuthSync();
  }

  private initAuthSync() {
    auth.onAuthStateChanged(async (firebaseUser) => {
      if (this.unsubscribeFirestore) {
        this.unsubscribeFirestore();
        this.unsubscribeFirestore = null;
      }

      if (firebaseUser) {
        try {
          // Busca dados iniciais do Firestore
          const firestoreItems = await firestoreService.getInventory(firebaseUser.uid);
          if (firestoreItems.length > 0) {
            // 1) limpa duplicados no banco (uma vez por login)
            await firestoreService.consolidateInventoryDuplicates(firebaseUser.uid);

            // 2) recarrega para garantir que this.items já venha “limpo”
            this.items = await firestoreService.getInventory(firebaseUser.uid);
          } else {
            // Se o inventário estiver vazio no primeiro acesso, sincroniza os itens de demonstração
            await firestoreService.addMultipleInventoryItems(firebaseUser.uid, this.items);
          }
          this.notify();

          // Inscreve para atualizações em tempo real
          this.unsubscribeFirestore = firestoreService.subscribeInventory(
            firebaseUser.uid,
            (updatedItems) => {
              this.items = updatedItems;
              this.notify();
            }
          );
        } catch (e) {
          console.warn('Aviso ao sincronizar inventário do Firestore:', e);
        }
      } else {
        this.items = [...INITIAL_FOOD_ITEMS];
        this.notify();
      }
    });
  }

  public async getItems(): Promise<FoodItem[]> {
    const currentUid = auth.currentUser?.uid;
    if (currentUid) {
      const items = await firestoreService.getInventory(currentUid);
      if (items.length > 0) {
        this.items = items;
      }
    }
    return [...this.items];
  }

  public async getItemById(id: string): Promise<FoodItem | null> {
    const item = this.items.find((i) => i.id === id);
    return item ? { ...item } : null;
  }

  public async addItem(itemData: Omit<FoodItem, 'id' | 'addedAt'>): Promise<FoodItem> {
    const newItem: FoodItem = {
      ...itemData,
      id: `food_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      addedAt: new Date().toISOString(),
    };

    const currentUid = auth.currentUser?.uid;
    if (currentUid) {
      await firestoreService.addInventoryItem(currentUid, newItem);
    }

    this.items.unshift(newItem);
    this.notify();
    return { ...newItem };
  }

  public async addMultipleItems(itemsData: Array<Omit<FoodItem, 'id' | 'addedAt'>>): Promise<FoodItem[]> {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) return [];

    // usa o cache atual (vem do subscribeInventory)
    const existing = [...this.items];

    const map = new Map<string, FoodItem>();
    for (const it of existing) {
      map.set(`${normalizeText(it.name)}__${it.category}`, it);
    }

    const toCreate: FoodItem[] = [];
    const toUpdate: Array<{ id: string; quantity: number }> = [];

    for (const data of itemsData) {
      const key = `${normalizeText(data.name)}__${data.category}`;
      const found = map.get(key);

      if (found) {
        const newQty = (Number(found.quantity) || 0) + (Number(data.quantity) || 0);
        found.quantity = newQty;
        toUpdate.push({ id: found.id, quantity: newQty });
      } else {
        const newItem: FoodItem = {
          ...data,
          id: `food_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          addedAt: new Date().toISOString(),
        };
        map.set(key, newItem);
        toCreate.push(newItem);
      }
    }

    // grava updates e creates
    for (const u of toUpdate) {
      await firestoreService.updateInventoryItem(currentUid, u.id, { quantity: u.quantity });
    }
    if (toCreate.length) {
      await firestoreService.addMultipleInventoryItems(currentUid, toCreate);
    }

    // atualiza cache local
    this.items = [...toCreate, ...existing];
    this.notify();

    return toCreate;
  }

  public async updateItem(id: string, updates: Partial<Omit<FoodItem, 'id'>>): Promise<FoodItem> {
    const index = this.items.findIndex((i) => i.id === id);
    if (index === -1) {
      throw new Error(`Alimento com ID ${id} não encontrado.`);
    }

    const updated = {
      ...this.items[index],
      ...updates,
    };

    const currentUid = auth.currentUser?.uid;
    if (currentUid) {
      await firestoreService.updateInventoryItem(currentUid, id, updates);
    }

    this.items[index] = updated;
    this.notify();
    return { ...updated };
  }

  public async deleteItem(id: string): Promise<boolean> {
    const currentUid = auth.currentUser?.uid;
    if (currentUid) {
      await firestoreService.deleteInventoryItem(currentUid, id);
    }

    const previousLength = this.items.length;
    this.items = this.items.filter((i) => i.id !== id);
    const deleted = this.items.length < previousLength;
    if (deleted) this.notify();
    return deleted;
  }

  public async resetToDefault(): Promise<FoodItem[]> {
    const currentUid = auth.currentUser?.uid;
    if (currentUid) {
      // Limpa os atuais e reinsere os itens padrão
      for (const item of this.items) {
        await firestoreService.deleteInventoryItem(currentUid, item.id);
      }
      await firestoreService.addMultipleInventoryItems(currentUid, INITIAL_FOOD_ITEMS);
    }

    this.items = [...INITIAL_FOOD_ITEMS];
    this.notify();
    return [...this.items];
  }

  public subscribe(callback: (items: FoodItem[]) => void): () => void {
    this.listeners.push(callback);
    callback([...this.items]);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb([...this.items]));
  }
}

export const foodService = new FoodService();
