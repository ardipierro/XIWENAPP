/**
 * Migration Script: Clean and recreate correction profiles
 *
 * This script will:
 * 1. Delete ALL documents from 'correction_profiles' collection
 * 2. Delete ALL documents from 'profile_students' collection
 * 3. Create 3 new universal correction profiles
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  deleteDoc,
  addDoc,
  query,
  where,
  limit,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDTE5cnbc38BWb4MX66YQYlR-H_-cg7gfs",
  authDomain: "xiwen-app-2026.firebaseapp.com",
  projectId: "xiwen-app-2026",
  storageBucket: "xiwen-app-2026.firebasestorage.app",
  messagingSenderId: "762140863307",
  appId: "1:762140863307:web:fc16a0f4a9c7a9c5d2ebe6",
  measurementId: "G-J9V1VXEDQZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Default profiles definition
const DEFAULT_PROFILES = [
  {
    name: 'Principiantes (A1-A2)',
    description: 'Para estudiantes que están comenzando',
    icon: '🌱',
    settings: {
      checks: ['spelling'],
      strictness: 'lenient',
      weights: {
        spelling: 1.0,
        grammar: 0,
        punctuation: 0,
        vocabulary: 0
      },
      minGrade: 50,
      display: {
        showDetailedErrors: true,
        showExplanations: true,
        showSuggestions: true,
        highlightOnImage: false
      }
    }
  },
  {
    name: 'Intermedio (B1-B2)',
    description: 'Para estudiantes con nivel intermedio',
    icon: '📚',
    settings: {
      checks: ['spelling', 'grammar', 'punctuation'],
      strictness: 'moderate',
      weights: {
        spelling: 0.4,
        grammar: 0.4,
        punctuation: 0.2,
        vocabulary: 0
      },
      minGrade: 60,
      display: {
        showDetailedErrors: true,
        showExplanations: true,
        showSuggestions: true,
        highlightOnImage: true
      }
    }
  },
  {
    name: 'Avanzado (C1-C2)',
    description: 'Para estudiantes avanzados',
    icon: '🎓',
    settings: {
      checks: ['spelling', 'grammar', 'punctuation', 'vocabulary'],
      strictness: 'strict',
      weights: {
        spelling: 0.3,
        grammar: 0.3,
        punctuation: 0.2,
        vocabulary: 0.2
      },
      minGrade: 70,
      display: {
        showDetailedErrors: true,
        showExplanations: true,
        showSuggestions: true,
        highlightOnImage: true
      }
    }
  }
];

async function findAdminUser() {
  console.log('\n🔍 Buscando un usuario admin...');

  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('role', '==', 'admin'), limit(1));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error('No se encontró ningún usuario admin');
  }

  const adminDoc = snapshot.docs[0];
  console.log(`✅ Admin encontrado: ${adminDoc.data().name || adminDoc.data().email} (${adminDoc.id})`);
  return adminDoc.id;
}

async function deleteAllFromCollection(collectionName) {
  console.log(`\n🗑️  Eliminando documentos de '${collectionName}'...`);

  const collectionRef = collection(db, collectionName);
  const snapshot = await getDocs(collectionRef);

  console.log(`   Documentos encontrados: ${snapshot.size}`);

  if (snapshot.size === 0) {
    console.log(`   ✅ La colección está vacía`);
    return 0;
  }

  let deleted = 0;
  for (const docSnapshot of snapshot.docs) {
    await deleteDoc(docSnapshot.ref);
    deleted++;
    console.log(`   ✓ Eliminado ${deleted}/${snapshot.size}`);
  }

  console.log(`✅ Total eliminados: ${deleted}`);
  return deleted;
}

async function createDefaultProfiles(adminUid) {
  const profilesRef = collection(db, 'correction_profiles');
  const createdProfiles = [];

  for (const profile of DEFAULT_PROFILES) {
    const docRef = await addDoc(profilesRef, {
      createdBy: adminUid,
      isSystemProfile: true,
      ...profile,
      isDefault: false,
      assignedToStudents: [],
      assignedToGroups: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    createdProfiles.push(docRef);
    console.log(`   ✓ Creado: ${profile.icon} ${profile.name}`);
  }

  // Set first profile as default
  if (createdProfiles.length > 0) {
    await updateDoc(createdProfiles[0], {
      isDefault: true,
      updatedAt: serverTimestamp()
    });
    console.log(`   ⭐ "${DEFAULT_PROFILES[0].name}" marcado como perfil por defecto`);
  }

  return createdProfiles.length;
}

async function migrate() {
  try {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║   MIGRACIÓN DE PERFILES DE CORRECCIÓN                 ║');
    console.log('╚════════════════════════════════════════════════════════╝');

    // Step 1: Find admin user
    const adminUid = await findAdminUser();

    // Step 2: Delete all correction_profiles
    const deletedProfiles = await deleteAllFromCollection('correction_profiles');

    // Step 3: Delete all profile_students
    const deletedAssignments = await deleteAllFromCollection('profile_students');

    // Step 4: Create 3 new universal profiles
    console.log('\n📝 Creando 3 perfiles universales...');
    const createdCount = await createDefaultProfiles(adminUid);

    // Summary
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║   RESUMEN DE MIGRACIÓN                                 ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log(`📊 Perfiles eliminados: ${deletedProfiles}`);
    console.log(`📊 Asignaciones eliminadas: ${deletedAssignments}`);
    console.log(`📊 Perfiles nuevos creados: ${createdCount}`);
    console.log('\n✨ Migración completada exitosamente!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR EN LA MIGRACIÓN:', error);
    console.error(error);
    process.exit(1);
  }
}

// Run migration
migrate();
