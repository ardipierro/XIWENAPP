import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from './config';

// ============================================
// GRUPOS
// ============================================

export async function createGroup(groupData) {
  try {
    const groupsRef = collection(db, 'groups');
    const docRef = await addDoc(groupsRef, {
      ...groupData,
      studentCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error al crear grupo:', error);
    return { success: false, error: error.message };
  }
}

export async function getAllGroups() {
  try {
    const groupsRef = collection(db, 'groups');
    const q = query(groupsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error al obtener grupos:', error);
    return [];
  }
}

export async function getGroupsByTeacher(teacherId) {
  try {
    const groupsRef = collection(db, 'groups');
    const q = query(
      groupsRef,
      where('teacherId', '==', teacherId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error al obtener grupos del profesor:', error);
    return [];
  }
}

export async function getGroupById(groupId) {
  try {
    const docRef = doc(db, 'groups', groupId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error al obtener grupo:', error);
    return null;
  }
}

export async function updateGroup(groupId, updates) {
  try {
    const docRef = doc(db, 'groups', groupId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error al actualizar grupo:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteGroup(groupId) {
  try {
    // Primero eliminar todos los miembros del grupo
    const membersRef = collection(db, 'group_members');
    const q = query(membersRef, where('groupId', '==', groupId));
    const snapshot = await getDocs(q);

    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);

    // Luego eliminar el grupo
    const docRef = doc(db, 'groups', groupId);
    await deleteDoc(docRef);

    return { success: true };
  } catch (error) {
    console.error('Error al eliminar grupo:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// MIEMBROS DE GRUPOS
// ============================================

export async function addStudentToGroup(groupId, studentId, studentName) {
  try {
    const membersRef = collection(db, 'group_members');
    await addDoc(membersRef, {
      groupId,
      studentId,
      studentName,
      joinedAt: serverTimestamp()
    });

    // Incrementar contador del grupo
    const groupRef = doc(db, 'groups', groupId);
    await updateDoc(groupRef, {
      studentCount: increment(1),
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error al agregar estudiante al grupo:', error);
    return { success: false, error: error.message };
  }
}

export async function removeStudentFromGroup(groupId, studentId) {
  try {
    const membersRef = collection(db, 'group_members');
    const q = query(
      membersRef,
      where('groupId', '==', groupId),
      where('studentId', '==', studentId)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      await deleteDoc(snapshot.docs[0].ref);

      // Decrementar contador del grupo
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        studentCount: increment(-1),
        updatedAt: serverTimestamp()
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error al remover estudiante del grupo:', error);
    return { success: false, error: error.message };
  }
}

export async function getGroupMembers(groupId) {
  try {
    const membersRef = collection(db, 'group_members');
    const q = query(membersRef, where('groupId', '==', groupId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error al obtener miembros del grupo:', error);
    return [];
  }
}

export async function getStudentGroups(studentId) {
  try {
    const membersRef = collection(db, 'group_members');
    const q = query(membersRef, where('studentId', '==', studentId));
    const snapshot = await getDocs(q);

    const groupIds = snapshot.docs.map(doc => doc.data().groupId);

    // Obtener detalles de cada grupo
    const groupPromises = groupIds.map(groupId => getGroupById(groupId));
    const groups = await Promise.all(groupPromises);

    return groups.filter(g => g !== null);
  } catch (error) {
    console.error('Error al obtener grupos del estudiante:', error);
    return [];
  }
}

// ============================================
// CURSOS DE GRUPOS
// ============================================

export async function assignCourseToGroup(groupId, courseId, courseName) {
  try {
    const groupCoursesRef = collection(db, 'group_courses');
    await addDoc(groupCoursesRef, {
      groupId,
      courseId,
      courseName,
      assignedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error al asignar curso al grupo:', error);
    return { success: false, error: error.message };
  }
}

export async function unassignCourseFromGroup(groupId, courseId) {
  try {
    const groupCoursesRef = collection(db, 'group_courses');
    const q = query(
      groupCoursesRef,
      where('groupId', '==', groupId),
      where('courseId', '==', courseId)
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      await deleteDoc(snapshot.docs[0].ref);
    }

    return { success: true };
  } catch (error) {
    console.error('Error al desasignar curso del grupo:', error);
    return { success: false, error: error.message };
  }
}

export async function getGroupCourses(groupId) {
  try {
    const groupCoursesRef = collection(db, 'group_courses');
    const q = query(groupCoursesRef, where('groupId', '==', groupId));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error al obtener cursos del grupo:', error);
    return [];
  }
}
