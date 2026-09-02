import dotenv from 'dotenv';
import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// resolve paths relativos ao arquivo (não ao cwd)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../..'); // scripts/recipes -> repo root

// tenta carregar scripts/.env (na raiz) e depois .env da raiz
const scriptsEnvPath = path.resolve(repoRoot, 'scripts/.env');
if (fs.existsSync(scriptsEnvPath)) {
  dotenv.config({ path: scriptsEnvPath });
} else {
  dotenv.config({ path: path.resolve(repoRoot, '.env') });
}

// lê config do applet (fonte de verdade do app)
const configPath = path.resolve(repoRoot, 'firebase-applet-config.json');
const appletConfig = fs.existsSync(configPath)
  ? JSON.parse(fs.readFileSync(configPath, 'utf8'))
  : {};

const projectId = process.env.FIREBASE_PROJECT_ID || appletConfig.projectId;
const databaseId =
  process.env.FIRESTORE_DATABASE_ID ||
  (appletConfig.firestoreDatabaseId && appletConfig.firestoreDatabaseId !== '(default)'
    ? appletConfig.firestoreDatabaseId
    : undefined);

const credPath =
  process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.resolve(repoRoot, 'scripts/_secrets/serviceAccount.json');

if (!projectId) throw new Error('FIREBASE_PROJECT_ID ausente (ou projectId no firebase-applet-config.json).');

if (!getApps().length) {
  if (fs.existsSync(credPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(credPath, 'utf8'));
    initializeApp({
      credential: cert(serviceAccount),
      projectId,
    });
  } else {
    try {
      initializeApp({
        credential: applicationDefault(),
        projectId,
      });
    } catch {
      throw new Error(
        `Service Account não encontrado em: ${credPath}\n` +
          `Baixe em Firebase Console -> Project Settings -> Service accounts -> Generate new private key\n` +
          `e salve em scripts/_secrets/serviceAccount.json`
      );
    }
  }
}

// IMPORTANTÍSSIMO: usa o MESMO databaseId do app
export const db = getFirestore(undefined, databaseId);
