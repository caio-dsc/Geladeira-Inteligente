import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider, AppCheck } from 'firebase/app-check';
import { getAuth, GoogleAuthProvider, Auth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import firebaseConfigData from '../../firebase-applet-config.json';

/**
 * Configuração e Inicialização Modular do Firebase
 * 1. Firebase App (Singleton)
 * 2. Firebase App Check (reCAPTCHA Enterprise Provider + Debug mode)
 * 3. Firebase Authentication (Google Auth & Session Persistence)
 * 4. Cloud Firestore (Base de dados NoSQL estruturada)
 * 5. Cloud Storage (Armazenamento para fotos de escaneamento)
 */

export interface FirebaseConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId?: string;
  storageBucket: string;
  messagingSenderId: string;
  measurementId?: string;
  oAuthClientId?: string;
}

export const firebaseConfig: FirebaseConfig = firebaseConfigData;

// 1. Inicializa a instância do Firebase App como Singleton
export const app: FirebaseApp = getApps().length === 0 
  ? initializeApp(firebaseConfig) 
  : getApp();

// 2. Firebase App Check - Inicializado imediatamente após initializeApp() e antes dos demais serviços
export let appCheck: AppCheck | null = null;

const recaptchaEnterpriseSiteKey = 
  import.meta.env.VITE_RECAPTCHA_ENTERPRISE_SITE_KEY || 
  import.meta.env.VITE_RECAPTCHA_SITE_KEY;

if (typeof window !== 'undefined') {
  // Configura modo Debug para ambiente de desenvolvimento sem hardcode de tokens
  if (import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN) {
    // Permite token de debug específico configurado via variável de ambiente
    (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = 
      import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN;
  } else if (import.meta.env.DEV) {
    // Gera token de debug no console do navegador para registro no Firebase Console
    (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  // Inicializa o App Check com ReCaptchaEnterpriseProvider oficial apenas uma vez
  if (recaptchaEnterpriseSiteKey) {
    try {
      appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(recaptchaEnterpriseSiteKey),
        isTokenAutoRefreshEnabled: true,
      });
    } catch (error) {
      console.warn('Aviso ao inicializar Firebase App Check:', error);
    }
  }
}

// 3. Instância do Firebase Auth
export const auth: Auth = getAuth(app);

// Configura persistência local de sessão no navegador
try {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('Aviso ao definir persistência de autenticação do Firebase:', err);
  });
} catch (e) {
  console.warn('Erro ao configurar persistência do Firebase Auth:', e);
}

// Provedor Google para login
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({
  prompt: 'select_account',
});

// 4. Instância do Cloud Firestore com o databaseId configurado
export const db: Firestore = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// 5. Instância do Cloud Storage para imagens de geladeira
export const storage: FirebaseStorage = getStorage(app);

export const isFirebaseInitialized = Boolean(app && auth && db && storage);
