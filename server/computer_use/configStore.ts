import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Initialisation de Firebase Admin
try {
  if (!getApps().length) {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        initializeApp({
            projectId: config.projectId,
        });
        console.log(`Firebase Admin initialized with project: ${config.projectId}`);
        // Store config in module scope for later use
        (global as any).firebaseConfig = config;
    } else {
        // Fallback to default application credentials
        initializeApp();
    }
  }
} catch (error) {
  console.error("Erreur lors de l'initialisation de Firebase Admin :", error);
}

const db = (global as any).firebaseConfig?.firestoreDatabaseId 
  ? getFirestore(undefined, (global as any).firebaseConfig.firestoreDatabaseId)
  : getFirestore();
const DOC_PATH = 'jarvis_config/app_settings';
const OLD_CONFIG_PATH = path.join(process.cwd(), 'server', '.jarvis-config.json');

export interface AppConfig {
  customBridgeUrl: string | null;
  customBridgeToken: string | null;
}

// Fonction utilitaire pour migrer l'ancienne config
async function migrateIfNeeded() {
  if (fs.existsSync(OLD_CONFIG_PATH)) {
    try {
      const data = fs.readFileSync(OLD_CONFIG_PATH, 'utf-8');
      const config = JSON.parse(data);
      await db.doc(DOC_PATH).set(config, { merge: true });
      fs.unlinkSync(OLD_CONFIG_PATH);
      console.log('Migration de la configuration vers Firestore réussie.');
    } catch (e) {
      console.error('Migration échouée :', e);
    }
  }
}

let migrationPromise = migrateIfNeeded();

export async function loadConfig(): Promise<AppConfig> {
  await migrationPromise;
  try {
    const doc = await db.doc(DOC_PATH).get();
    if (doc.exists) {
      return doc.data() as AppConfig;
    }
  } catch (e) {
    console.error('Erreur lors du chargement de la config Firestore :', e);
  }
  return { customBridgeUrl: null, customBridgeToken: null };
}

export async function saveConfig(config: Partial<AppConfig>) {
  try {
    await db.doc(DOC_PATH).set(config, { merge: true });
  } catch (e) {
    console.error('Erreur lors de la sauvegarde de la config Firestore :', e);
  }
}
