/**
 * Script que obtiene automáticamente el UID del usuario y crea los ejercicios
 * Este script busca el primer usuario con rol 'teacher' o 'admin' y usa su UID
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query, where } from 'firebase/firestore';

// Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDnW9U2bsuVz39JyPw6zTPQS2nPXoSqKkA",
  authDomain: "xiwen-app-2026.firebaseapp.com",
  projectId: "xiwen-app-2026",
  storageBucket: "xiwen-app-2026.firebasestorage.app",
  messagingSenderId: "393099932704",
  appId: "1:393099932704:web:4a74e4a3d0bc76bf71c1d3",
  measurementId: "G-MCWNJ1H4BV"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Obtener el primer usuario teacher/admin
async function getTeacherUID() {
  try {
    // Buscar usuarios con rol teacher
    const teachersQuery = query(collection(db, 'users'), where('role', '==', 'teacher'));
    const teachersSnapshot = await getDocs(teachersQuery);

    if (!teachersSnapshot.empty) {
      const firstTeacher = teachersSnapshot.docs[0];
      console.log(`✅ Encontrado teacher: ${firstTeacher.data().email || firstTeacher.data().name}`);
      return firstTeacher.id;
    }

    // Si no hay teachers, buscar admins
    const adminsQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
    const adminsSnapshot = await getDocs(adminsQuery);

    if (!adminsSnapshot.empty) {
      const firstAdmin = adminsSnapshot.docs[0];
      console.log(`✅ Encontrado admin: ${firstAdmin.data().email || firstAdmin.data().name}`);
      return firstAdmin.id;
    }

    throw new Error('No se encontraron usuarios con rol teacher o admin');
  } catch (error) {
    console.error('Error obteniendo UID:', error);
    throw error;
  }
}

// Importar los ejercicios del script principal
import { exercises } from './create-sample-exercises.js';

async function createExercises() {
  console.log('🔍 Buscando usuario teacher/admin...\n');

  const teacherId = await getTeacherUID();

  console.log(`\n🚀 Creando 10 ejercicios para el usuario: ${teacherId}\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < exercises.length; i++) {
    const exercise = exercises[i];

    try {
      const contentData = {
        ...exercise,
        createdBy: teacherId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'published',
        views: 0,
        likes: 0
      };

      const docRef = await addDoc(collection(db, 'contents'), contentData);

      console.log(`✅ [${i + 1}/10] ${exercise.title}`);
      console.log(`   📄 ID: ${docRef.id}`);
      console.log(`   🏷️  Tipo: ${exercise.metadata.exerciseType}`);
      console.log(`   📊 Nivel: ${exercise.metadata.cefrLevel}\n`);

      successCount++;
    } catch (error) {
      console.error(`❌ [${i + 1}/10] Error en "${exercise.title}":`, error.message, '\n');
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 RESUMEN:`);
  console.log(`   ✅ Guardados: ${successCount}`);
  console.log(`   ❌ Errores: ${errorCount}`);
  console.log('='.repeat(50));

  if (successCount === exercises.length) {
    console.log('\n🎉 ¡Todos los ejercicios fueron creados exitosamente!');
    console.log('📝 Ahora puedes:');
    console.log('   1. Ir a "Gestionar Contenidos" en tu dashboard');
    console.log('   2. Buscar ejercicios con 🎯 o filtrar por tag "demo-2025-11-18"');
    console.log('   3. Insertarlos en un diario de clases');
    console.log('   4. Probar la edición de campos de texto');
  }

  process.exit(0);
}

createExercises().catch(console.error);
