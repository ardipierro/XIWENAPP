#!/usr/bin/env node
/**
 * Script helper para generar diccionario usando credenciales guardadas
 * Lee la API key desde Firebase/localStorage automáticamente
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase config (debe estar en .env o hardcoded)
const firebaseConfig = {
  apiKey: "AIzaSyBELN1e-tjhBRvLLYNqbbbBXwL_9YnvyHY",
  authDomain: "xiwenapp-1530086682085.firebaseapp.com",
  projectId: "xiwenapp-1530086682085",
  storageBucket: "xiwenapp-1530086682085.firebasestorage.app",
  messagingSenderId: "658746056158",
  appId: "1:658746056158:web:51fb42a59a91d81d3c29ff"
};

async function main() {
  console.log('\n🔑 Obteniendo credencial de DeepL...\n');

  try {
    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Obtener credencial de deepl_free
    const credentialRef = doc(db, 'ai_credentials', 'deepl_free');
    const credentialSnap = await getDoc(credentialRef);

    if (!credentialSnap.exists()) {
      console.error('❌ No se encontró la credencial de DeepL Free.');
      console.log('   Por favor, configúrala en: Configuración > Avanzado > Credenciales\n');
      process.exit(1);
    }

    const apiKey = credentialSnap.data().apiKey;

    if (!apiKey || apiKey === '***BACKEND***') {
      console.error('❌ La credencial de DeepL está vacía o usa backend.');
      console.log('   Por favor, ingresa tu API key en: Configuración > Avanzado > Credenciales\n');
      process.exit(1);
    }

    console.log('✅ Credencial de DeepL encontrada\n');

    // Ejecutar script de generación
    const limit = process.argv[2] || '100';
    console.log(`📖 Generando diccionario con ${limit} palabras...\n`);

    const scriptPath = path.join(__dirname, 'generate-dictionary-deepl.js');
    const cmd = `node "${scriptPath}" --api-key="${apiKey}" --limit=${limit}`;

    execSync(cmd, { stdio: 'inherit' });

    console.log('\n✅ Diccionario generado exitosamente\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
