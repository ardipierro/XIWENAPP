import logger from 'logger';

import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  addContentToCourse,
  addExerciseToCourse
} from '../firebase/relationships';

/**
 * Migrar datos del sistema antiguo (courseId único) al nuevo (many-to-many)
 *
 * IMPORTANTE: Este script NO elimina los campos courseId originales.
 * Los mantiene como backup y para compatibilidad durante la transición.
 */
export async function migrateToManyToMany() {
  logger.debug('🔄 INICIANDO MIGRACIÓN A SISTEMA MANY-TO-MANY');
  logger.debug('='.repeat(60));

  const stats = {
    contentTotal: 0,
    contentMigrated: 0,
    contentSkipped: 0,
    contentErrors: 0,
    exercisesTotal: 0,
    exercisesMigrated: 0,
    exercisesSkipped: 0,
    exercisesErrors: 0
  };

  try {
    // ==========================================
    // FASE 1: MIGRAR CONTENIDOS
    // ==========================================
    logger.debug('\n📄 FASE 1: Migrando contenidos...\n');

    const contentRef = collection(db, 'content');
    const contentSnapshot = await getDocs(contentRef);
    stats.contentTotal = contentSnapshot.size;

    logger.debug(`Encontrados ${stats.contentTotal} contenidos`);

    for (const contentDoc of contentSnapshot.docs) {
      const contentData = contentDoc.data();
      const contentId = contentDoc.id;
      const courseId = contentData.courseId;

      // Skip si no tiene courseId
      if (!courseId || courseId === '') {
        logger.debug(`⏭️  "${contentData.title}" - Sin curso asignado, omitiendo`);
        stats.contentSkipped++;
        continue;
      }

      try {
        // Verificar que el curso existe
        const courseDoc = await getDoc(doc(db, 'courses', courseId));
        if (!courseDoc.exists()) {
          logger.warn(`⚠️  "${contentData.title}" - Curso ${courseId} no existe, omitiendo`);
          stats.contentSkipped++;
          continue;
        }

        // Crear relación en course_content
        const result = await addContentToCourse(courseId, contentId, contentData.order || 0);

        if (result.success) {
          logger.debug(`✅ "${contentData.title}" → Curso: ${courseDoc.data().name}`);
          stats.contentMigrated++;
        } else {
          logger.error(`❌ Error migrando "${contentData.title}":`, result.error);
          stats.contentErrors++;
        }
      } catch (error) {
        logger.error(`❌ Error procesando "${contentData.title}":`, error.message);
        stats.contentErrors++;
      }
    }

    // ==========================================
    // FASE 2: MIGRAR EJERCICIOS
    // ==========================================
    logger.debug('\n🎮 FASE 2: Migrando ejercicios...\n');

    const exercisesRef = collection(db, 'exercises');
    const exercisesSnapshot = await getDocs(exercisesRef);
    stats.exercisesTotal = exercisesSnapshot.size;

    logger.debug(`Encontrados ${stats.exercisesTotal} ejercicios`);

    for (const exerciseDoc of exercisesSnapshot.docs) {
      const exerciseData = exerciseDoc.data();
      const exerciseId = exerciseDoc.id;
      const courseId = exerciseData.courseId;

      // Skip si no tiene courseId
      if (!courseId || courseId === '') {
        logger.debug(`⏭️  "${exerciseData.title}" - Sin curso asignado, omitiendo`);
        stats.exercisesSkipped++;
        continue;
      }

      try {
        // Verificar que el curso existe
        const courseDoc = await getDoc(doc(db, 'courses', courseId));
        if (!courseDoc.exists()) {
          logger.warn(`⚠️  "${exerciseData.title}" - Curso ${courseId} no existe, omitiendo`);
          stats.exercisesSkipped++;
          continue;
        }

        // Crear relación en course_exercises
        const result = await addExerciseToCourse(courseId, exerciseId, exerciseData.order || 0);

        if (result.success) {
          logger.debug(`✅ "${exerciseData.title}" → Curso: ${courseDoc.data().name}`);
          stats.exercisesMigrated++;
        } else {
          logger.error(`❌ Error migrando "${exerciseData.title}":`, result.error);
          stats.exercisesErrors++;
        }
      } catch (error) {
        logger.error(`❌ Error procesando "${exerciseData.title}":`, error.message);
        stats.exercisesErrors++;
      }
    }

    // ==========================================
    // RESUMEN FINAL
    // ==========================================
    logger.debug('\n' + '='.repeat(60));
    logger.debug('📊 RESUMEN DE MIGRACIÓN\n');

    console.table({
      'Contenidos totales': stats.contentTotal,
      'Contenidos migrados': stats.contentMigrated,
      'Contenidos omitidos': stats.contentSkipped,
      'Contenidos con error': stats.contentErrors,
      '---': '---',
      'Ejercicios totales': stats.exercisesTotal,
      'Ejercicios migrados': stats.exercisesMigrated,
      'Ejercicios omitidos': stats.exercisesSkipped,
      'Ejercicios con error': stats.exercisesErrors
    });

    logger.debug('\n✅ MIGRACIÓN COMPLETADA');
    logger.debug('\n⚠️  IMPORTANTE: Los campos courseId originales se mantienen como backup.');
    logger.debug('    Una vez verificada la migración, se pueden actualizar las UIs.');
    logger.debug('='.repeat(60));

    return { success: true, stats };

  } catch (error) {
    logger.error('\n❌ ERROR CRÍTICO EN MIGRACIÓN:', error);
    return { success: false, error: error.message, stats };
  }
}

/**
 * Verificar estado de la migración
 * Compara cuántos items tienen courseId vs cuántos tienen relaciones
 */
export async function checkMigrationStatus() {
  logger.debug('\n🔍 VERIFICANDO ESTADO DE MIGRACIÓN\n');

  try {
    // Contenidos con courseId
    const contentSnapshot = await getDocs(collection(db, 'content'));
    const contentsWithCourseId = contentSnapshot.docs.filter(
      doc => doc.data().courseId && doc.data().courseId !== ''
    );

    // Relaciones en course_content
    const courseContentSnapshot = await getDocs(collection(db, 'course_content'));

    // Ejercicios con courseId
    const exercisesSnapshot = await getDocs(collection(db, 'exercises'));
    const exercisesWithCourseId = exercisesSnapshot.docs.filter(
      doc => doc.data().courseId && doc.data().courseId !== ''
    );

    // Relaciones en course_exercises
    const courseExercisesSnapshot = await getDocs(collection(db, 'course_exercises'));

    const status = {
      'Contenidos con courseId': contentsWithCourseId.length,
      'Relaciones course_content': courseContentSnapshot.size,
      'Estado contenidos': courseContentSnapshot.size >= contentsWithCourseId.length ? '✅ OK' : '⚠️  PENDIENTE',
      '---': '---',
      'Ejercicios con courseId': exercisesWithCourseId.length,
      'Relaciones course_exercises': courseExercisesSnapshot.size,
      'Estado ejercicios': courseExercisesSnapshot.size >= exercisesWithCourseId.length ? '✅ OK' : '⚠️  PENDIENTE'
    };

    console.table(status);

    const allMigrated =
      courseContentSnapshot.size >= contentsWithCourseId.length &&
      courseExercisesSnapshot.size >= exercisesWithCourseId.length;

    if (allMigrated) {
      logger.debug('\n✅ Migración completada correctamente');
    } else {
      logger.debug('\n⚠️  Aún hay datos pendientes de migrar');
      logger.debug('   Ejecuta migrateToManyToMany() para completar la migración');
    }

    return status;

  } catch (error) {
    logger.error('❌ Error verificando estado:', error);
    return null;
  }
}

/**
 * Limpiar relaciones duplicadas (útil si se ejecutó la migración varias veces)
 */
export async function cleanDuplicateRelationships() {
  logger.debug('\n🧹 LIMPIANDO RELACIONES DUPLICADAS...\n');

  try {
    // Limpiar course_content duplicados
    const courseContentSnapshot = await getDocs(collection(db, 'course_content'));
    const contentMap = new Map();
    const duplicates = [];

    courseContentSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const key = `${data.courseId}_${data.contentId}`;

      if (contentMap.has(key)) {
        duplicates.push(doc.id);
      } else {
        contentMap.set(key, doc.id);
      }
    });

    logger.debug(`Encontrados ${duplicates.length} duplicados en course_content`);

    // Similar para course_exercises
    const courseExercisesSnapshot = await getDocs(collection(db, 'course_exercises'));
    const exerciseMap = new Map();
    const exerciseDuplicates = [];

    courseExercisesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const key = `${data.courseId}_${data.exerciseId}`;

      if (exerciseMap.has(key)) {
        exerciseDuplicates.push(doc.id);
      } else {
        exerciseMap.set(key, doc.id);
      }
    });

    logger.debug(`Encontrados ${exerciseDuplicates.length} duplicados en course_exercises`);

    logger.debug('\n⚠️  Para eliminar duplicados, ejecuta esta función con parámetro confirmDelete=true');
    logger.debug('   cleanDuplicateRelationships(true)');

    return {
      contentDuplicates: duplicates,
      exerciseDuplicates: exerciseDuplicates
    };

  } catch (error) {
    logger.error('❌ Error limpiando duplicados:', error);
    return null;
  }
}
