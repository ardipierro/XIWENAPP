/**
 * @fileoverview Configuración centralizada de Firebase
 * @module firebase/config
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getDatabase, connectDatabaseEmulator } from 'firebase/database';
import logger from '../utils/logger.js';

/**
 * Configuración de Firebase desde variables de entorno
 * @type {import('firebase/app').FirebaseOptions}
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || `https://${import.meta.env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
};

/**
 * Valida que todas las variables de entorno requeridas estén presentes
 * @throws {Error} Si falta alguna variable de entorno
 */
function validateConfig() {
  const required = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];

  const missing = required.filter((key) => !import.meta.env[key]);

  if (missing.length > 0) {
    const errorMessage = `Faltan variables de entorno de Firebase: ${missing.join(', ')}`;
    logger.error(errorMessage, null, 'FirebaseConfig');
    throw new Error(errorMessage);
  }

  logger.info('Configuración de Firebase validada correctamente', 'FirebaseConfig');
}

// Validar configuración antes de inicializar
validateConfig();

/**
 * Instancia de Firebase App
 * @type {import('firebase/app').FirebaseApp}
 */
let app;

try {
  app = initializeApp(firebaseConfig);
  logger.info(`Firebase inicializado para proyecto: ${firebaseConfig.projectId}`, 'FirebaseConfig');
} catch (error) {
  logger.error('Error al inicializar Firebase', error, 'FirebaseConfig');
  throw error;
}

/**
 * Exportar la instancia de Firebase App para uso directo
 * @type {import('firebase/app').FirebaseApp}
 */
export { app };

/**
 * Instancia de Firestore Database
 * @type {import('firebase/firestore').Firestore}
 */
export const db = getFirestore(app);

/**
 * Instancia de Firebase Authentication
 * @type {import('firebase/auth').Auth}
 */
export const auth = getAuth(app);

/**
 * Instancia de Firebase Functions
 * @type {import('firebase/functions').Functions}
 */
export const functions = getFunctions(app);

/**
 * Instancia de Firebase Storage
 * @type {import('firebase/storage').FirebaseStorage}
 */
export const storage = getStorage(app);

/**
 * Instancia de Firebase Realtime Database
 * @type {import('firebase/database').Database}
 */
export const realtimeDb = getDatabase(app);

/**
 * Conectar a emuladores de Firebase si está en modo desarrollo
 * Útil para testing local sin afectar producción
 */
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectFunctionsEmulator(functions, 'localhost', 5001);
    connectStorageEmulator(storage, 'localhost', 9199);
    connectDatabaseEmulator(realtimeDb, 'localhost', 9000);
    logger.info('Conectado a emuladores de Firebase', 'FirebaseConfig');
  } catch (error) {
    logger.warn('Error al conectar con emuladores de Firebase', 'FirebaseConfig');
  }
}

/**
 * Conectar solo Functions al emulador para testing de LiveKit
 * Esto permite probar la Cloud Function sin afectar Auth/Firestore de producción
 */
if (import.meta.env.DEV && import.meta.env.VITE_USE_FUNCTIONS_EMULATOR === 'true') {
  try {
    connectFunctionsEmulator(functions, 'localhost', 5001);
    logger.info('Conectado a emulador de Functions', 'FirebaseConfig');
  } catch (error) {
    logger.warn('Error al conectar con emulador de Functions', 'FirebaseConfig');
  }
}

/**
 * Configuración exportada (solo para debugging, no incluye secrets)
 */
export const config = {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD
};

export default app;
