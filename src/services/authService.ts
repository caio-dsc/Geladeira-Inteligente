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
  updateUser(userId: string, data: Partial<User>): Promise<User>;
  updateScanEnabled(userId: string, scanEnabled: boolean): Promise<void>;
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
    // Consulta segura se o usuário consta na whitelist de administradores
    let isAdmin = false;
    try {
      isAdmin = await firestoreService.checkIsAdmin(firebaseUser.uid);
    } catch (adminErr) {
      console.warn('Aviso ao verificar status de admin durante sync:', adminErr);
      isAdmin = false;
    }

    const isBruno = firebaseUser.email?.toLowerCase() === 'bruno@email.com' || customName?.toLowerCase().includes('bruno');
    
    // Consulta se o e-mail foi pré-cadastrado como cliente pago (Fase 7)
    let isPreAuthorizedPaid = false;
    if (firebaseUser.email) {
      try {
        isPreAuthorizedPaid = await firestoreService.isPaidCustomer(firebaseUser.email);
      } catch (paidErr) {
        console.warn('Aviso ao consultar paid_customers:', paidErr);
      }
    }

    const existing = await firestoreService.getUser(firebaseUser.uid);
    if (existing) {
      // Determina scanEnabled: se já liberado, ou se foi pré-autorizado via compra, ou admin/Bruno
      const resolvedScanEnabled = typeof existing.scanEnabled === 'boolean'
        ? (existing.scanEnabled || isPreAuthorizedPaid)
        : (isAdmin || isBruno || isPreAuthorizedPaid ? true : false);

      // Atualiza eventuais dados mais recentes do Google ou Perfil
      const updated: User = {
        ...existing,
        name: customName || existing.name || firebaseUser.displayName || (isBruno ? 'Bruno' : 'Chef Usuário'),
        email: firebaseUser.email || existing.email,
        avatarUrl: existing.avatarUrl || firebaseUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        age: existing.age ?? null,
        weightKg: existing.weightKg ?? null,
        heightCm: existing.heightCm ?? null,
        isAdmin,
        scanEnabled: resolvedScanEnabled,
      };
      await firestoreService.updateUserFields(firebaseUser.uid, {
        name: updated.name,
        email: updated.email,
        avatarUrl: updated.avatarUrl,
        age: updated.age,
        weightKg: updated.weightKg,
        heightCm: updated.heightCm,
      });

      // Se o usuário foi liberado via compra na sincronização, atualiza o campo protegido via método dedicado
      if (existing.scanEnabled !== resolvedScanEnabled) {
        await firestoreService.updateUserScanAccess(firebaseUser.uid, resolvedScanEnabled);
      }

      return updated;
    }

    // Primeiro acesso: cria documento base com controle de acesso ao Scan
    // Usuário normal (Conta gratuita): scanEnabled = false
    // Cliente pago / Bruno / Admin: scanEnabled = true (SCAN ILIMITADO)
    const isInitialScanEnabled = isAdmin || Boolean(isBruno) || isPreAuthorizedPaid;

    const newUser: User = {
      id: firebaseUser.uid,
      name: customName || firebaseUser.displayName || (isBruno ? 'Bruno' : 'Chef Usuário'),
      email: firebaseUser.email || '',
      avatarUrl: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      credits: 5,
      scanEnabled: isInitialScanEnabled,
      preferences: DEFAULT_PREFERENCES,
      createdAt: new Date().toISOString(),
      age: null,
      weightKg: null,
      heightCm: null,
      isAdmin,
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

  public async updateUser(userIdOrData: string | Partial<User>, optionalData?: Partial<User>): Promise<User> {
    const rawUpdates: Partial<User> = typeof userIdOrData === 'string'
      ? (optionalData || {})
      : userIdOrData;

    const targetUserId = typeof userIdOrData === 'string'
      ? userIdOrData
      : (this.currentUser?.id || auth.currentUser?.uid);

    if (!targetUserId && !this.currentUser) {
      throw new Error('Usuário não autenticado');
    }

    // Remove campos undefined para não quebrar o Firestore
    const safeUpdates = Object.fromEntries(
      Object.entries(rawUpdates).filter(([_, v]) => v !== undefined)
    ) as Partial<User>;

    // Atualiza o usuário em memória
    if (this.currentUser) {
      const updatedPreferences = safeUpdates.preferences
        ? { ...this.currentUser.preferences, ...safeUpdates.preferences }
        : this.currentUser.preferences;

      this.currentUser = {
        ...this.currentUser,
        ...safeUpdates,
        preferences: updatedPreferences,
      };
      this.notify(); // Notifica os observadores do React
    }

    const effectiveUid = targetUserId || auth.currentUser?.uid;
    if (effectiveUid) {
      // Isola apenas campos permitidos de perfil para escrita pelo usuário no Firestore
      // NUNCA envia credits, isAdmin, scanEnabled, id ou createdAt para respeitar as Firestore Security Rules
      const { credits: _c, isAdmin: _a, scanEnabled: _s, id: _i, createdAt: _ca, ...allowedProfileFields } = safeUpdates as any;

      if (Object.keys(allowedProfileFields).length > 0) {
        await firestoreService.updateUserFields(effectiveUid, allowedProfileFields);
      }

      // Sincroniza metadados do Firebase Auth se alterados
      if (auth.currentUser) {
        try {
          const profileUpdates: { displayName?: string; photoURL?: string } = {};
          if (safeUpdates.name) profileUpdates.displayName = safeUpdates.name;
          if (safeUpdates.avatarUrl) profileUpdates.photoURL = safeUpdates.avatarUrl;
          if (Object.keys(profileUpdates).length > 0) {
            await updateProfile(auth.currentUser, profileUpdates);
          }
        } catch (authErr) {
          console.warn('Aviso ao sincronizar perfil no Firebase Auth:', authErr);
        }
      }
    }

    return this.currentUser!;
  }

  public async updateScanEnabled(userId: string, scanEnabled: boolean): Promise<void> {
    await firestoreService.updateUserScanAccess(userId, scanEnabled);
    if (this.currentUser && this.currentUser.id === userId) {
      this.currentUser = {
        ...this.currentUser,
        scanEnabled,
      };
      this.notify();
    }
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
