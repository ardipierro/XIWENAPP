/**
 * @fileoverview Script de migración a Sistema Unificado de Contenidos
 * Migra datos de las colecciones: content, exercises, courses → contents
 *
 * IMPORTANTE:
 * - Este script NO borra las colecciones originales (solo lectura)
 * - Crea duplicados en la nueva colección 'contents'
 * - Puedes ejecutarlo múltiples veces de forma segura
 *
 * Uso:
 *   node scripts/migrateToUnifiedContent.js
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import * as dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ============================================
// CONTENT TYPES
// ============================================

const CONTENT_TYPES = {
  COURSE: 'course',
  LESSON: 'lesson',
  READING: 'reading',
  VIDEO: 'video',
  LINK: 'link',
  EXERCISE: 'exercise',
  LIVE_GAME: 'live-game'
};

// ============================================
// MIGRATION FUNCTIONS
// ============================================

/**
 * Migrar colección 'content' → 'contents'
 */
async function migrateContentCollection() {
  console.log('\n📄 Migrando colección "content"...');

  try {
    const contentRef = collection(db, 'content');
    const snapshot = await getDocs(contentRef);

    console.log(`   Encontrados ${snapshot.size} documentos en 'content'`);

    let migrated = 0;
    let skipped = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();

      // Determinar el tipo de contenido
      let contentType = CONTENT_TYPES.LESSON; // default

      if (data.type === 'lesson' || data.type === 'reading' ||
          data.type === 'video' || data.type === 'link') {
        contentType = data.type;
      }

      // Crear documento en nueva colección
      const newDoc = {
        // Datos originales
        title: data.title || 'Sin título',
        description: data.description || '',
        body: data.body || '',
        url: data.url || '',

        // Tipo
        type: contentType,

        // Metadata
        metadata: {
          difficulty: data.difficulty || null,
          duration: data.duration || null,
          points: data.points || null,
          tags: data.tags || [],
          language: data.language || 'es',
          level: data.level || null
        },

        // Relaciones
        createdBy: data.createdBy || data.teacherId || '',
        parentCourseIds: data.courseId ? [data.courseId] : (data.courseIds || []),

        // Media
        imageUrl: data.imageUrl || '',
        thumbnailUrl: data.thumbnailUrl || '',

        // Sistema
        active: data.active !== undefined ? data.active : true,
        order: data.order || 0,

        // Timestamps
        createdAt: data.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),

        // Metadata de migración
        _migrated: true,
        _migratedFrom: 'content',
        _originalId: docSnap.id,
        _migratedAt: serverTimestamp()
      };

      try {
        // Usar el mismo ID
        const newDocRef = doc(db, 'contents', docSnap.id);
        await setDoc(newDocRef, newDoc);
        migrated++;

        if (migrated % 10 === 0) {
          console.log(`   ✓ Migrados ${migrated}/${snapshot.size}...`);
        }
      } catch (error) {
        console.error(`   ✗ Error migrando documento ${docSnap.id}:`, error.message);
        skipped++;
      }
    }

    console.log(`   ✅ Migración completada: ${migrated} exitosos, ${skipped} fallidos`);
    return { migrated, skipped };
  } catch (error) {
    console.error('   ❌ Error en migración de content:', error);
    throw error;
  }
}

/**
 * Migrar colección 'exercises' → 'contents'
 */
async function migrateExercisesCollection() {
  console.log('\n✏️  Migrando colección "exercises"...');

  try {
    const exercisesRef = collection(db, 'exercises');
    const snapshot = await getDocs(exercisesRef);

    console.log(`   Encontrados ${snapshot.size} documentos en 'exercises'`);

    let migrated = 0;
    let skipped = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();

      // Crear documento en nueva colección
      const newDoc = {
        // Datos originales
        title: data.title || 'Ejercicio sin título',
        description: data.description || '',

        // Tipo
        type: CONTENT_TYPES.EXERCISE,
        contentType: data.type || 'multiple-choice', // subtipo de ejercicio

        // Contenido específico de ejercicios
        questions: data.questions || [],
        body: data.instructions || data.body || '',

        // Metadata
        metadata: {
          difficulty: data.difficulty || 'intermediate',
          duration: data.estimatedTime || data.duration || 15,
          points: data.points || 100,
          tags: data.tags || data.category ? [data.category] : [],
          language: data.language || 'es',
          level: data.level || null
        },

        // Relaciones
        createdBy: data.createdBy || data.teacherId || '',
        parentCourseIds: data.courseId ? [data.courseId] : (data.courseIds || []),

        // Media
        imageUrl: data.imageUrl || '',

        // Sistema
        active: data.active !== undefined ? data.active : true,
        order: data.order || 0,

        // Timestamps
        createdAt: data.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),

        // Metadata de migración
        _migrated: true,
        _migratedFrom: 'exercises',
        _originalId: docSnap.id,
        _migratedAt: serverTimestamp()
      };

      try {
        // Generar nuevo ID para ejercicios (prefijo 'ex-')
        const newId = `ex-${docSnap.id}`;
        const newDocRef = doc(db, 'contents', newId);
        await setDoc(newDocRef, newDoc);
        migrated++;

        if (migrated % 10 === 0) {
          console.log(`   ✓ Migrados ${migrated}/${snapshot.size}...`);
        }
      } catch (error) {
        console.error(`   ✗ Error migrando ejercicio ${docSnap.id}:`, error.message);
        skipped++;
      }
    }

    console.log(`   ✅ Migración completada: ${migrated} exitosos, ${skipped} fallidos`);
    return { migrated, skipped };
  } catch (error) {
    console.error('   ❌ Error en migración de exercises:', error);
    throw error;
  }
}

/**
 * Migrar colección 'courses' → 'contents'
 */
async function migrateCoursesCollection() {
  console.log('\n📚 Migrando colección "courses"...');

  try {
    const coursesRef = collection(db, 'courses');
    const snapshot = await getDocs(coursesRef);

    console.log(`   Encontrados ${snapshot.size} documentos en 'courses'`);

    let migrated = 0;
    let skipped = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();

      // Crear documento en nueva colección
      const newDoc = {
        // Datos originales
        title: data.name || data.title || 'Curso sin título',
        description: data.description || '',

        // Tipo
        type: CONTENT_TYPES.COURSE,

        // Contenido específico de cursos
        childContentIds: data.contentIds || [], // IDs de contenidos incluidos

        // Metadata
        metadata: {
          difficulty: data.difficulty || null,
          duration: data.duration || null,
          points: data.totalPoints || null,
          tags: data.tags || data.categories || [],
          language: data.language || 'es',
          level: data.level || null
        },

        // Relaciones
        createdBy: data.createdBy || data.teacherId || '',

        // Media
        imageUrl: data.imageUrl || data.image || '',
        thumbnailUrl: data.thumbnailUrl || '',

        // Sistema
        active: data.active !== undefined ? data.active : true,

        // Timestamps
        createdAt: data.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),

        // Metadata de migración
        _migrated: true,
        _migratedFrom: 'courses',
        _originalId: docSnap.id,
        _migratedAt: serverTimestamp()
      };

      try {
        // Generar nuevo ID para cursos (prefijo 'co-')
        const newId = `co-${docSnap.id}`;
        const newDocRef = doc(db, 'contents', newId);
        await setDoc(newDocRef, newDoc);
        migrated++;

        if (migrated % 10 === 0) {
          console.log(`   ✓ Migrados ${migrated}/${snapshot.size}...`);
        }
      } catch (error) {
        console.error(`   ✗ Error migrando curso ${docSnap.id}:`, error.message);
        skipped++;
      }
    }

    console.log(`   ✅ Migración completada: ${migrated} exitosos, ${skipped} fallidos`);
    return { migrated, skipped };
  } catch (error) {
    console.error('   ❌ Error en migración de courses:', error);
    throw error;
  }
}

/**
 * Verificar colección 'contents' después de migración
 */
async function verifyMigration() {
  console.log('\n🔍 Verificando migración...');

  try {
    const contentsRef = collection(db, 'contents');
    const snapshot = await getDocs(contentsRef);

    console.log(`   Total de documentos en 'contents': ${snapshot.size}`);

    // Contar por tipo
    const stats = {
      course: 0,
      lesson: 0,
      reading: 0,
      video: 0,
      link: 0,
      exercise: 0,
      'live-game': 0,
      other: 0
    };

    snapshot.forEach(doc => {
      const type = doc.data().type;
      if (stats[type] !== undefined) {
        stats[type]++;
      } else {
        stats.other++;
      }
    });

    console.log('\n   📊 Estadísticas por tipo:');
    console.log(`      📚 Cursos: ${stats.course}`);
    console.log(`      📝 Lecciones: ${stats.lesson}`);
    console.log(`      📖 Lecturas: ${stats.reading}`);
    console.log(`      🎥 Videos: ${stats.video}`);
    console.log(`      🔗 Links: ${stats.link}`);
    console.log(`      ✏️  Ejercicios: ${stats.exercise}`);
    console.log(`      🎮 Juegos: ${stats['live-game']}`);
    if (stats.other > 0) {
      console.log(`      ❓ Otros: ${stats.other}`);
    }

    return stats;
  } catch (error) {
    console.error('   ❌ Error verificando migración:', error);
    throw error;
  }
}

// ============================================
// MAIN
// ============================================

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║   🚀 MIGRACIÓN A SISTEMA UNIFICADO DE CONTENIDOS 🚀       ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`\n📅 Fecha: ${new Date().toLocaleString()}`);
  console.log(`🔥 Proyecto: ${firebaseConfig.projectId}`);

  const startTime = Date.now();
  const results = {
    content: { migrated: 0, skipped: 0 },
    exercises: { migrated: 0, skipped: 0 },
    courses: { migrated: 0, skipped: 0 }
  };

  try {
    // Migrar cada colección
    results.content = await migrateContentCollection();
    results.exercises = await migrateExercisesCollection();
    results.courses = await migrateCoursesCollection();

    // Verificar
    await verifyMigration();

    // Resumen final
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    const totalMigrated = results.content.migrated + results.exercises.migrated + results.courses.migrated;
    const totalSkipped = results.content.skipped + results.exercises.skipped + results.courses.skipped;

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║                  ✅ MIGRACIÓN COMPLETADA                   ║');
    console.log('╚════════════════════════════════════════════════════════════╝');
    console.log(`\n   📊 Total migrado: ${totalMigrated} documentos`);
    console.log(`   ⚠️  Total fallidos: ${totalSkipped} documentos`);
    console.log(`   ⏱️  Tiempo: ${duration}s`);

    console.log('\n   ⚠️  IMPORTANTE:');
    console.log('   - Las colecciones originales NO fueron borradas');
    console.log('   - Puedes seguir usando los managers legacy');
    console.log('   - Para usar el nuevo sistema, ve a "Contenidos" en el menú');
    console.log('   - Una vez verificado todo, puedes borrar las colecciones antiguas manualmente\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO EN MIGRACIÓN:', error);
    process.exit(1);
  }
}

// Ejecutar
main();
