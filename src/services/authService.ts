import { 
  signInWithPopup, 
  signInWithRedirect,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { auth, googleAuthProvider } from './firebaseConfig';
import { firestoreService } from './firestoreService';
import { User, UserPreferences } from '../types';
import { INITIAL_USER } from '../data/mockData';

export interface IAuthService {
  getCurrentUser(): Promise<User | null>;
  signInWithGoogle(): Promise<User>;
  signUpWithEmail(email: string, password: string, name?: string): Promise<User>;
  signInWithEmail(email: string, password: string): Promise<User>;
  sendPasswordReset(email: string): Promise<void>;
  resetPassword(email: string): Promise<void>;
  signOut(): Promise<void>;
  updateUser(data: Partial<User>): Promise<User>;
  deductCredit(amount?: number): Promise<number>;
  addCredits(amount: number): Promise<number>;
  subscribe(callback: (user: User | null) => void): () => void;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  dietaryRestrictions: ['Sem Frituras'],
  cookingLevel: 'Intermediário',
  allergies: [],
  defaultServings: 2,
};

class FirebaseAuthService implements IAuthService {
  private currentUser: User | null = null;
  private listeners: Array<(user: User | null) => void> = [];
  private isInitialized = false;

  constructor() {
    // Escuta mudanças de estado de autenticação e persistência de sessão
    onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      try {
        if (firebaseUser) {
          const loadedUser = await this.syncUserProfile(firebaseUser);
          this.currentUser = loadedUser;
        } else {
          this.currentUser = null;
        }
      } catch (err) {
        console.warn('Aviso ao sincronizar estado de autenticação Firebase:', err);
      } finally {
        this.isInitialized = true;
        this.notify();
      }
    });
  }

  /**
   * Sincroniza o usuário autenticado do Firebase com o documento no Firestore
   */
  private async syncUserProfile(firebaseUser: FirebaseUser, customName?: string): Promise<User> {
    const existing = await firestoreService.getUser(firebaseUser.uid);
    if (existing) {
      // Atualiza eventuais dados mais recentes do Google ou Perfil
      const updated: User = {
        ...existing,
        name: customName || existing.name || firebaseUser.displayName || 'Chef Usuário',
        email: firebaseUser.email || existing.email,
        avatarUrl: existing.avatarUrl || firebaseUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        age: existing.age ?? null,
        weightKg: existing.weightKg ?? null,
      };
      await firestoreService.updateUserFields(firebaseUser.uid, {
        name: updated.name,
        email: updated.email,
        avatarUrl: updated.avatarUrl,
        age: updated.age,
        weightKg: updated.weightKg,
      });
      return updated;
    }

    // Primeiro acesso: cria documento base com créditos iniciais
    const newUser: User = {
      id: firebaseUser.uid,
      name: customName || firebaseUser.displayName || 'Chef Usuário',
      email: firebaseUser.email || '',
      avatarUrl: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      credits: 5,
      preferences: DEFAULT_PREFERENCES,
      createdAt: new Date().toISOString(),
      age: null,
      weightKg: null,
    };

    await firestoreService.setUser(firebaseUser.uid, newUser);
    return newUser;
  }

  public async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) return this.currentUser;
    if (auth.currentUser) {
      this.currentUser = await this.syncUserProfile(auth.currentUser);
    }
    return this.currentUser;
  }

  public async signUpWithEmail(email: string, password: string, name?: string): Promise<User> {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // Salva o nome no perfil do Firebase Auth
    if (name?.trim()) {
      try {
        await updateProfile(cred.user, { displayName: name.trim() });
      } catch (err) {
        console.warn('Erro ao definir displayName no Firebase Auth:', err);
      }
    }

    const user = await this.syncUserProfile(cred.user, name?.trim());
    this.currentUser = user;
    this.notify();
    return user;
  }

  public async signInWithEmail(email: string, password: string): Promise<User> {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const user = await this.syncUserProfile(cred.user);
    this.currentUser = user;
    this.notify();
    return user;
  }

  public async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  public async resetPassword(email: string): Promise<void> {
    return this.sendPasswordReset(email);
  }

  public async signInWithGoogle(): Promise<User> {
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const user = await this.syncUserProfile(result.user);
      this.currentUser = user;
      this.notify();
      return user;
    } catch (error: any) {
      console.warn('Popup de autenticação falhou ou foi bloqueado, tentando fallback:', error);
      
      // Fallback em caso de bloqueio de popup em iframes de teste
      if (error?.code === 'auth/popup-blocked' || error?.code === 'auth/popup-closed-by-user') {
        try {
          await signInWithRedirect(auth, googleAuthProvider);
        } catch (redirectError) {
          console.error('Erro no fallback de redirecionamento:', redirectError);
        }
      }

      // Em ambiente de desenvolvimento local (DEV), provê fallback de teste se não houver conexão ativa
      if (import.meta.env.DEV && !this.currentUser) {
        this.currentUser = {
          ...INITIAL_USER,
          id: 'dev_user_' + Date.now(),
        };
        this.notify();
        return this.currentUser;
      }
      throw error;
    }
  }

  public async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.warn('Aviso ao efetuar logout Firebase:', err);
    } finally {
      this.currentUser = null;
      this.notify();
    }
  }

  public async updateUser(data: Partial<User>): Promise<User> {
    if (!this.currentUser) throw new Error('Usuário não autenticado');

    const updatedUser: User = {
      ...this.currentUser,
      ...data,
      preferences: {
        ...this.currentUser.preferences,
        ...(data.preferences || {}),
      },
    };

    this.currentUser = updatedUser;
    this.notify();

    if (auth.currentUser) {
      // Sincroniza dados no Firestore
      await firestoreService.setUser(auth.currentUser.uid, updatedUser);

      // Sincroniza metadados do Firebase Auth se alterados
      try {
        const profileUpdates: { displayName?: string; photoURL?: string } = {};
        if (data.name) profileUpdates.displayName = data.name;
        if (data.avatarUrl) profileUpdates.photoURL = data.avatarUrl;
        if (Object.keys(profileUpdates).length > 0) {
          await updateProfile(auth.currentUser, profileUpdates);
        }
      } catch (authErr) {
        console.warn('Aviso ao sincronizar perfil no Firebase Auth:', authErr);
      }
    }

    return updatedUser;
  }

  public async deductCredit(amount: number = 1): Promise<number> {
    if (!this.currentUser) throw new Error('Usuário não autenticado');
    if (this.currentUser.credits < amount) {
      throw new Error('Créditos insuficientes para realizar esta ação.');
    }

    const newCredits = this.currentUser.credits - amount;
    this.currentUser = {
      ...this.currentUser,
      credits: newCredits,
    };
    this.notify();

    if (auth.currentUser) {
      await firestoreService.updateUserFields(auth.currentUser.uid, { credits: newCredits });
    }

    return newCredits;
  }

  public async addCredits(amount: number): Promise<number> {
    if (!this.currentUser) throw new Error('Usuário não autenticado');

    const newCredits = this.currentUser.credits + amount;
    this.currentUser = {
      ...this.currentUser,
      credits: newCredits,
    };
    this.notify();

    if (auth.currentUser) {
      await firestoreService.updateUserFields(auth.currentUser.uid, { credits: newCredits });
    }

    return newCredits;
  }

  public subscribe(callback: (user: User | null) => void): () => void {
    this.listeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.currentUser ? { ...this.currentUser } : null));
  }
}

export const authService = new FirebaseAuthService();
