import { collection, getDocs, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Migrar lecciones de la colección antigua 'lessons' a la nueva 'content'
 */
export async function migrateLessonsToContent() {
  try {
    console.log('🔄 Iniciando migración de lecciones a contenido...');

    // 1. Obtener todas las lecciones
    const lessonsRef = collection(db, 'lessons');
    const lessonsSnapshot = await getDocs(lessonsRef);

    if (lessonsSnapshot.empty) {
      console.log('✅ No hay lecciones para migrar');
      return { success: true, migrated: 0, skipped: 0 };
    }

    console.log(`📚 Encontradas ${lessonsSnapshot.size} lecciones`);

    // 2. Verificar si ya existen en content
    const contentRef = collection(db, 'content');
    const contentSnapshot = await getDocs(contentRef);
    const existingContentTitles = new Set(
      contentSnapshot.docs.map(doc => doc.data().title)
    );

    const lessonsToMigrate = [];
    const skippedLessons = [];

    lessonsSnapshot.docs.forEach(lessonDoc => {
      const lesson = { id: lessonDoc.id, ...lessonDoc.data() };

      // Skip si ya existe con el mismo título
      if (existingContentTitles.has(lesson.title)) {
        skippedLessons.push(lesson);
      } else {
        lessonsToMigrate.push(lesson);
      }
    });

    console.log(`✅ Para migrar: ${lessonsToMigrate.length}`);
    console.log(`⏭️ Ya existen: ${skippedLessons.length}`);

    if (lessonsToMigrate.length === 0) {
      alert('No hay lecciones nuevas para migrar. Todas ya existen en la colección de contenido.');
      return { success: true, migrated: 0, skipped: skippedLessons.length };
    }

    // 3. Confirmar migración
    const lessonsList = lessonsToMigrate.map(l =>
      `- ${l.title} (${l.type || 'text'}) → Curso: ${l.courseId || 'sin asignar'}`
    ).join('\n');

    const confirmed = window.confirm(
      `¿Migrar ${lessonsToMigrate.length} lección(es) a la nueva colección de contenido?\n\n${lessonsList}\n\nNOTA: Las lecciones originales se mantendrán como respaldo.`
    );

    if (!confirmed) {
      console.log('❌ Migración cancelada');
      return { success: false, migrated: 0 };
    }

    // 4. Migrar cada lección
    let migrated = 0;
    for (const lesson of lessonsToMigrate) {
      try {
        // Mapear tipo de lección antigua a tipo de contenido nuevo
        const typeMapping = {
          'text': 'lesson',
          'video': 'video',
          'audio': 'link',  // audio se puede manejar como link
          'interactive': 'lesson'
        };

        const contentType = typeMapping[lesson.type] || 'lesson';

        // Crear documento en la colección content
        const contentData = {
          title: lesson.title || 'Sin título',
          type: contentType,
          content: lesson.content || '',
          body: lesson.content || '', // Alias por compatibilidad
          url: lesson.url || '', // Para videos/links
          courseId: lesson.courseId || '',
          order: lesson.order || 0,
          createdBy: lesson.createdBy || '',
          duration: lesson.duration || null,
          createdAt: lesson.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp(),
          // Metadata de migración
          migratedFrom: 'lessons',
          originalLessonId: lesson.id
        };

        await addDoc(contentRef, contentData);
        console.log(`✅ Migrado: ${lesson.title}`);
        migrated++;

        // Marcar lección original como migrada (no eliminar)
        const lessonDocRef = doc(db, 'lessons', lesson.id);
        await updateDoc(lessonDocRef, {
          migrated: true,
          migratedAt: serverTimestamp()
        });

      } catch (error) {
        console.error(`❌ Error migrando "${lesson.title}":`, error);
      }
    }

    console.log(`🎉 Migración completada: ${migrated}/${lessonsToMigrate.length}`);
    alert(`✅ Migración exitosa!\n\n${migrated} lección(es) migradas a la nueva colección de contenido.\n${skippedLessons.length} ya existían previamente.`);

    return { success: true, migrated, skipped: skippedLessons.length };

  } catch (error) {
    console.error('❌ Error en migración:', error);
    alert('Error durante la migración: ' + error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Verificar estado de migración
 */
export async function checkMigrationStatus() {
  try {
    const lessonsRef = collection(db, 'lessons');
    const lessonsSnapshot = await getDocs(lessonsRef);

    const totalLessons = lessonsSnapshot.size;
    const migratedLessons = lessonsSnapshot.docs.filter(
      doc => doc.data().migrated === true
    ).length;
    const pendingLessons = totalLessons - migratedLessons;

    console.table({
      'Total lecciones antiguas': totalLessons,
      'Ya migradas': migratedLessons,
      'Pendientes': pendingLessons
    });

    return { total: totalLessons, migrated: migratedLessons, pending: pendingLessons };
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}
