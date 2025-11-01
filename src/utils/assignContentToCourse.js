import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Asignar contenidos sin curso a un curso específico
 * Útil para migrar contenidos existentes
 */
export async function assignUnassignedContentToCourse(courseId, teacherId) {
  try {
    console.log('🔍 Buscando contenidos sin asignar del profesor:', teacherId);

    const contentRef = collection(db, 'content');
    const q = query(
      contentRef,
      where('createdBy', '==', teacherId)
    );

    const snapshot = await getDocs(q);

    const unassignedContent = [];
    snapshot.docs.forEach(docSnapshot => {
      const data = docSnapshot.data();
      // Encontrar contenidos sin courseId o con courseId vacío
      if (!data.courseId || data.courseId === '') {
        unassignedContent.push({
          id: docSnapshot.id,
          title: data.title,
          type: data.type
        });
      }
    });

    console.log(`📚 Encontrados ${unassignedContent.length} contenidos sin asignar`);

    if (unassignedContent.length === 0) {
      console.log('✅ No hay contenidos sin asignar');
      return { success: true, updated: 0 };
    }

    // Preguntar confirmación
    const confirmed = window.confirm(
      `¿Asignar ${unassignedContent.length} contenido(s) al curso seleccionado?\n\n` +
      unassignedContent.map(c => `- ${c.title} (${c.type})`).join('\n')
    );

    if (!confirmed) {
      console.log('❌ Operación cancelada');
      return { success: false, updated: 0 };
    }

    // Actualizar todos los contenidos
    let updated = 0;
    for (const content of unassignedContent) {
      const contentDoc = doc(db, 'content', content.id);
      await updateDoc(contentDoc, {
        courseId: courseId
      });
      console.log(`✅ Asignado: ${content.title}`);
      updated++;
    }

    console.log(`🎉 Total actualizado: ${updated} contenidos`);
    alert(`✅ ${updated} contenido(s) asignado(s) al curso exitosamente`);

    return { success: true, updated };
  } catch (error) {
    console.error('❌ Error asignando contenidos:', error);
    alert('Error: ' + error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Listar todos los contenidos con su estado de asignación
 */
export async function listContentAssignments(teacherId) {
  try {
    const contentRef = collection(db, 'content');
    const q = query(contentRef, where('createdBy', '==', teacherId));
    const snapshot = await getDocs(q);

    const contents = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const assigned = contents.filter(c => c.courseId && c.courseId !== '');
    const unassigned = contents.filter(c => !c.courseId || c.courseId === '');

    console.table({
      Total: contents.length,
      'Con curso asignado': assigned.length,
      'Sin asignar': unassigned.length
    });

    if (unassigned.length > 0) {
      console.log('\n📋 Contenidos sin asignar:');
      unassigned.forEach(c => {
        console.log(`  - ${c.title} (${c.type})`);
      });
    }

    return { total: contents.length, assigned: assigned.length, unassigned: unassigned.length };
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}
