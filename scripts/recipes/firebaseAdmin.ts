import dotenv from 'dotenv';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import path from 'path';
import fs from 'fs';

// Tenta carregar scripts/.env primeiro, senão .env da raiz
const scriptsEnvPath = path.resolve(process.cwd(), 'scripts/.env');
if (fs.existsSync(scriptsEnvPath)) {
  dotenv.config({ path: scriptsEnvPath });
} else {
  dotenv.config();
}

// Obtém Project ID do .env ou do firebase-applet-config.json
let projectId = process.env.FIREBASE_PROJECT_ID;
if (!projectId) {
  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      projectId = config.projectId;
    }
  } catch (e) {
    // ignora
  }
}

const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './scripts/_secrets/serviceAccount.json';

if (!projectId) throw new Error('FIREBASE_PROJECT_ID ausente. Configure no scripts/.env ou em .env');

const absoluteCredPath = path.resolve(process.cwd(), credPath);
if (!fs.existsSync(absoluteCredPath)) {
  throw new Error(`Arquivo de chave Service Account não encontrado em: ${absoluteCredPath}\nBaixe do Firebase Console -> Project Settings -> Service accounts -> Generate new private key e salve em scripts/_secrets/serviceAccount.json`);
}

const serviceAccount = JSON.parse(fs.readFileSync(absoluteCredPath, 'utf8'));

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    projectId,
  });
}

export const db = getFirestore();
