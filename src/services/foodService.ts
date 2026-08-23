import { FoodItem } from '../types';
import { INITIAL_FOOD_ITEMS } from '../data/mockData';
import { firestoreService } from './firestoreService';
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
            this.items = firestoreItems;
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
    const addedItems: FoodItem[] = itemsData.map((data) => ({
      ...data,
      id: `food_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      addedAt: new Date().toISOString(),
    }));

    const currentUid = auth.currentUser?.uid;
    if (currentUid) {
      await firestoreService.addMultipleInventoryItems(currentUid, addedItems);
    }

    this.items = [...addedItems, ...this.items];
    this.notify();
    return addedItems;
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
