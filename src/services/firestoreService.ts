import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
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

export const normalizeText = (s: string) =>
  (s || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // remove acentos

export const inventoryMergeKey = (name: string, category: string) =>
  `${normalizeText(name)}__${category}`;

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
      const safeData = Object.fromEntries(
        Object.entries(userData).filter(([_, v]) => v !== undefined)
      );
      await setDoc(userRef, {
        ...safeData,
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
      const safeFields = Object.fromEntries(
        Object.entries(fields).filter(([_, v]) => v !== undefined)
      );
      await updateDoc(userRef, {
        ...safeFields,
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

  public async consolidateInventoryDuplicates(userId: string): Promise<void> {
    const items = await this.getInventory(userId);
    if (items.length < 2) return;

    const groups = new Map<string, FoodItem[]>();
    for (const it of items) {
      const key = `${normalizeText(it.name)}__${it.category}`;
      const arr = groups.get(key) || [];
      arr.push(it);
      groups.set(key, arr);
    }

    const batch = writeBatch(db);
    let ops = 0;

    for (const [, arr] of groups) {
      if (arr.length <= 1) continue;

      // mantém o primeiro (lista vem ordenada por addedAt desc no getInventory)
      const keep = arr[0];
      const duplicates = arr.slice(1);

      const totalQty = arr.reduce((sum, x) => sum + (Number(x.quantity) || 0), 0);

      // mantém a validade mais cedo (segurança). Se nenhuma, fica null.
      const expiryCandidates = arr.map(x => x.expiryDate).filter(Boolean) as string[];
      const earliestExpiry = expiryCandidates.length ? expiryCandidates.sort()[0] : null;

      const keepRef = doc(db, 'users', userId, 'inventory', keep.id);
      batch.update(keepRef, {
        quantity: totalQty,
        expiryDate: earliestExpiry,
        updatedAt: new Date().toISOString(),
      });
      ops++;

      for (const d of duplicates) {
        const dRef = doc(db, 'users', userId, 'inventory', d.id);
        batch.delete(dRef);
        ops++;
      }

      // segurança para não estourar limite de batch (500 ops)
      if (ops >= 450) {
        await batch.commit();
        ops = 0;
      }
    }

    if (ops > 0) await batch.commit();
  }

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

  public async upsertInventoryByName(
    userId: string,
    item: Omit<FoodItem, "id" | "addedAt">
  ): Promise<void> {
    const invRef = collection(db, "users", userId, "inventory");
    const nameKey = normalizeText(item.name);

    // busca por MESMO nomeKey + MESMA categoria
    const q = query(invRef,
      where("nameKey", "==", nameKey),
      where("category", "==", item.category)
    );

    const snap = await getDocs(q);

    // Se não achou nada, cria novo
    if (snap.empty) {
      const newRef = doc(invRef); // auto-id
      const payload = JSON.parse(JSON.stringify({
        ...item,
        id: newRef.id,
        nameKey,
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      const batch = writeBatch(db);
      batch.set(newRef, payload);
      await batch.commit();
      return;
    }

    // Se achou 1 ou mais (duplicados antigos), consolida:
    const docs = snap.docs;
    const keep = docs[0];
    const keepData = keep.data() as FoodItem;

    const totalQty =
      (Number(keepData.quantity) || 0) +
      (Number(item.quantity) || 0) +
      docs.slice(1).reduce((sum, d) => sum + (Number((d.data() as any).quantity) || 0), 0);

    const batch = writeBatch(db);

    batch.update(keep.ref, JSON.parse(JSON.stringify({
      quantity: totalQty,
      nameKey,
      updatedAt: new Date().toISOString(),
    })));

    // apaga duplicados extras
    for (const d of docs.slice(1)) {
      batch.delete(d.ref);
    }

    await batch.commit();
  }

  public async addInventoryItem(userId: string, item: FoodItem): Promise<void> {
    try {
      const itemRef = doc(db, 'users', userId, 'inventory', item.id);
      await setDoc(itemRef, {
        name: item.name,
        nameKey: normalizeText(item.name),
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
          nameKey: normalizeText(item.name),
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

  public async updateInventoryItem(userId: string, itemId: string, updates: Partial<FoodItem>): Promise<void> {
    try {
      const itemRef = doc(db, 'users', userId, 'inventory', itemId);
      
      // Remove todos os campos que estiverem undefined para não quebrar o Firebase
      const safeUpdates = Object.fromEntries(
        Object.entries(updates).filter(([_, v]) => v !== undefined)
      );

      await updateDoc(itemRef, { 
        ...safeUpdates, 
        updatedAt: new Date().toISOString() 
      });
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
