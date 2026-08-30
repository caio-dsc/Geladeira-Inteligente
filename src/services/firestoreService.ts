import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  writeBatch,
  Unsubscribe,
  serverTimestamp,
  limit,
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { User, FoodItem, Recipe, ScanSession } from '../types';

/**
 * Camada de Acesso a Dados do Cloud Firestore
 * Estrutura mapeada:
 * - users/{userId}
 * - users/{userId}/inventory/{itemId}
 * - users/{userId}/scans/{scanId}
 * - recipes/{recipeId}
 */

export class FirestoreService {
  // ==========================================
  // USUÁRIOS & PERFIL
  // ==========================================

  public async getUser(userId: string): Promise<User | null> {
    try {
      const userRef = doc(db, 'users', userId);
      const snapshot = await getDoc(userRef);
      if (snapshot.exists()) {
        return snapshot.data() as User;
      }
      return null;
    } catch (error) {
      console.warn('Erro ao obter usuário do Firestore:', error);
      return null;
    }
  }

  public async setUser(userId: string, userData: User): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        ...userData,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      console.error('Erro ao salvar usuário no Firestore:', error);
      throw error;
    }
  }

  public async updateUserFields(userId: string, fields: Partial<User>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        ...fields,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Erro ao atualizar campos do usuário no Firestore:', error);
      throw error;
    }
  }

  // ==========================================
  // INVENTÁRIO / GELADEIRA (users/{userId}/inventory)
  // ==========================================

  public async getInventory(userId: string): Promise<FoodItem[]> {
    try {
      const invRef = collection(db, 'users', userId, 'inventory');
      const q = query(invRef, orderBy('addedAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const items: FoodItem[] = [];
      querySnapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as Omit<FoodItem, 'id'>) });
      });
      return items;
    } catch (error) {
      console.warn('Erro ao obter itens do inventário no Firestore:', error);
      return [];
    }
  }

  public async addInventoryItem(userId: string, item: FoodItem): Promise<void> {
    try {
      const itemRef = doc(db, 'users', userId, 'inventory', item.id);
      await setDoc(itemRef, {
        name: item.name,
        category: item.category,
        quantity: item.quantity,
        unit: item.unit,
        state: item.state,
        location: item.location,
        addedAt: item.addedAt,
        expiryDate: item.expiryDate || null,
        notes: item.notes || '',
      });
    } catch (error) {
      console.error('Erro ao adicionar item no inventário:', error);
      throw error;
    }
  }

  public async addMultipleInventoryItems(userId: string, items: FoodItem[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      items.forEach((item) => {
        const itemRef = doc(db, 'users', userId, 'inventory', item.id);
        batch.set(itemRef, {
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          state: item.state,
          location: item.location,
          addedAt: item.addedAt,
          expiryDate: item.expiryDate || null,
          notes: item.notes || '',
        });
      });
      await batch.commit();
    } catch (error) {
      console.error('Erro ao adicionar múltiplos itens em lote no Firestore:', error);
      throw error;
    }
  }

  public async updateInventoryItem(userId: string, itemId: string, updates: Partial<Omit<FoodItem, 'id'>>): Promise<void> {
    try {
      const itemRef = doc(db, 'users', userId, 'inventory', itemId);
      await updateDoc(itemRef, updates);
    } catch (error) {
      console.error('Erro ao atualizar item do inventário:', error);
      throw error;
    }
  }

  public async deleteInventoryItem(userId: string, itemId: string): Promise<void> {
    try {
      const itemRef = doc(db, 'users', userId, 'inventory', itemId);
      await deleteDoc(itemRef);
    } catch (error) {
      console.error('Erro ao remover item do inventário:', error);
      throw error;
    }
  }

  public subscribeInventory(userId: string, onUpdate: (items: FoodItem[]) => void): Unsubscribe {
    const invRef = collection(db, 'users', userId, 'inventory');
    const q = query(invRef, orderBy('addedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const items: FoodItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as Omit<FoodItem, 'id'>) });
      });
      onUpdate(items);
    }, (error) => {
      console.warn('Snapshot listener do inventário encontrou um aviso:', error);
    });
  }

  // ==========================================
  // SCANS / FOTOGRAFIAS (users/{userId}/scans)
  // ==========================================

  public async getScans(userId: string, max = 10): Promise<ScanSession[]> {
    try {
      const scansRef = collection(db, 'users', userId, 'scans');
      const q = query(scansRef, orderBy('timestamp', 'desc'), limit(max));
      const snapshot = await getDocs(q);

      const scans: ScanSession[] = [];
      snapshot.forEach((docSnap) => {
        scans.push({ id: docSnap.id, ...(docSnap.data() as Omit<ScanSession, 'id'>) });
      });
      return scans;
    } catch (error) {
      console.warn('Erro ao obter scans do Firestore:', error);
      return [];
    }
  }

  public subscribeScans(
    userId: string,
    max: number,
    onUpdate: (scans: ScanSession[]) => void
  ): Unsubscribe {
    const scansRef = collection(db, 'users', userId, 'scans');
    const q = query(scansRef, orderBy('timestamp', 'desc'), limit(max));

    return onSnapshot(q, (snapshot) => {
      const scans: ScanSession[] = [];
      snapshot.forEach((docSnap) => {
        scans.push({ id: docSnap.id, ...(docSnap.data() as Omit<ScanSession, 'id'>) });
      });
      onUpdate(scans);
    });
  }

  public async deleteScanRecord(userId: string, scanId: string): Promise<void> {
    const scanRef = doc(db, 'users', userId, 'scans', scanId);
    await deleteDoc(scanRef);
  }

  public async saveScanRecord(userId: string, scan: ScanSession): Promise<void> {
    try {
      const scanRef = doc(db, 'users', userId, 'scans', scan.id);
      const payload = JSON.parse(JSON.stringify({
        ...scan,
        savedAt: new Date().toISOString(),
      }));

      await setDoc(scanRef, payload, { merge: true });
    } catch (error) {
      console.error('Erro ao salvar registro de scan no Firestore:', error);
    }
  }

  // ==========================================
  // RECEITAS (recipes/{recipeId})
  // ==========================================

  public async getRecipes(): Promise<Recipe[]> {
    try {
      const recipesRef = collection(db, 'recipes');
      const snapshot = await getDocs(recipesRef);
      const recipes: Recipe[] = [];
      snapshot.forEach((docSnap) => {
        recipes.push({ id: docSnap.id, ...(docSnap.data() as Omit<Recipe, 'id'>) });
      });
      return recipes;
    } catch (error) {
      console.warn('Erro ao obter receitas do Firestore:', error);
      return [];
    }
  }

  public async seedInitialRecipes(recipes: Recipe[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      recipes.forEach((recipe) => {
        const recipeRef = doc(db, 'recipes', recipe.id);
        batch.set(recipeRef, recipe, { merge: true });
      });
      await batch.commit();
    } catch (error) {
      console.warn('Aviso ao sincronizar receitas padrão:', error);
    }
  }
}

export const firestoreService = new FirestoreService();
