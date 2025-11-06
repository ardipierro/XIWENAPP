import logger from '../utils/logger';

import { doc, setDoc, serverTimestamp, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db, auth } from './config';
import { ADMIN_EMAIL } from './roleConfig';

/**
 * Función de debug para probar permisos de Firestore
 * Ejecuta esto en la consola del navegador para ver el error exacto
 */
export const testFirestorePermissions = async () => {
  logger.debug('🧪 Probando permisos de Firestore...');

  const user = auth.currentUser;
  if (!user) {
    logger.error('❌ No hay usuario autenticado');
    return;
  }

  logger.debug('👤 Usuario actual:', {
    uid: user.uid,
    email: user.email
  });

  try {
    logger.debug('📝 Intentando crear documento en users/' + user.uid);

    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      role: 'admin',
      email: user.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    logger.debug('✅ ¡Éxito! El documento fue creado');
    logger.debug('Recarga la página para ver los cambios');
    return true;
  } catch (error) {
    logger.error('❌ Error completo:', error);
    logger.error('Código:', error.code);
    logger.error('Mensaje:', error.message);
    logger.error('Stack:', error.stack);

    if (error.code === 'permission-denied') {
      logger.error('');
      logger.error('🔒 PERMISO DENEGADO');
      logger.error('═══════════════════');
      logger.error('Las Firestore Security Rules están bloqueando la escritura.');
      logger.error('');
      logger.error('Solución:');
      logger.error('1. Ve a: https://console.firebase.google.com/');
      logger.error('2. Selecciona tu proyecto');
      logger.error('3. Ve a Firestore Database → Rules');
      logger.error('4. Copia el contenido de firestore.rules');
      logger.error('5. Pégalo en el editor y haz clic en Publish');
    }

    return false;
  }
};

/**
 * Crear usuario manualmente en Firestore
 */
export const manualCreateUserRole = async (role = 'admin') => {
  const user = auth.currentUser;
  if (!user) {
    logger.error('❌ No hay usuario autenticado');
    return false;
  }

  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      role,
      email: user.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    logger.debug(`✅ Usuario creado con rol: ${role}`);
    logger.debug('🔄 Recarga la página');
    return true;
  } catch (error) {
    logger.error('❌ Error:', error.message);
    return false;
  }
};

/**
 * PELIGRO: Eliminar todos los usuarios excepto el admin
 * Útil para limpiar usuarios de desarrollo
 */
export const cleanupDevUsers = async () => {
  const user = auth.currentUser;
  if (!user) {
    logger.error('❌ No hay usuario autenticado');
    return false;
  }

  // Verificar que el usuario actual es el admin
  if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    logger.error('❌ ACCESO DENEGADO: Solo el admin puede ejecutar esta función');
    logger.error('Email del admin configurado:', ADMIN_EMAIL);
    logger.error('Tu email:', user.email);
    return false;
  }

  logger.debug('⚠️  ADVERTENCIA: Esta función eliminará TODOS los usuarios excepto el admin');
  logger.debug('Admin protegido:', ADMIN_EMAIL);
  logger.debug('');

  const confirmText = 'Para continuar, ejecuta: cleanupDevUsersConfirmed()';
  logger.debug('🔴', confirmText);

  return false;
};

/**
 * Confirmación para eliminar usuarios
 */
export const cleanupDevUsersConfirmed = async () => {
  const user = auth.currentUser;
  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    logger.error('❌ Acceso denegado');
    return false;
  }

  logger.debug('🗑️  Iniciando limpieza de usuarios de desarrollo...');
  logger.debug('═══════════════════════════════════════════════');

  let deletedUsers = 0;
  let deletedStudents = 0;
  let protectedUsers = 0;

  try {
    // 1. Eliminar de colección "users"
    logger.debug('');
    logger.debug('1️⃣  Limpiando colección "users"...');
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const isAdmin = userData.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      if (isAdmin) {
        logger.debug('✅ Protegiendo admin:', userData.email);
        protectedUsers++;
      } else {
        await deleteDoc(doc(db, 'users', userDoc.id));
        logger.debug('🗑️  Eliminado:', userData.email || userDoc.id);
        deletedUsers++;
      }
    }

    // 2. Eliminar de colección "students"
    logger.debug('');
    logger.debug('2️⃣  Limpiando colección "students"...');
    const studentsRef = collection(db, 'students');
    const studentsSnapshot = await getDocs(studentsRef);

    for (const studentDoc of studentsSnapshot.docs) {
      const studentData = studentDoc.data();
      const isAdmin = studentData.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      if (isAdmin) {
        logger.debug('✅ Protegiendo admin:', studentData.email);
      } else {
        await deleteDoc(doc(db, 'students', studentDoc.id));
        logger.debug('🗑️  Eliminado:', studentData.name || studentData.email || studentDoc.id);
        deletedStudents++;
      }
    }

    // Resumen
    logger.debug('');
    logger.debug('═══════════════════════════════════════════════');
    logger.debug('✅ Limpieza completada:');
    logger.debug('   👥 Usuarios eliminados:', deletedUsers);
    logger.debug('   👨‍🎓 Estudiantes eliminados:', deletedStudents);
    logger.debug('   🛡️  Usuarios protegidos:', protectedUsers);
    logger.debug('');
    logger.debug('🔄 Recarga la página para ver los cambios');
    logger.debug('═══════════════════════════════════════════════');

    return true;
  } catch (error) {
    logger.error('');
    logger.error('❌ Error durante la limpieza:', error);
    logger.error('Código:', error.code);
    logger.error('Mensaje:', error.message);
    return false;
  }
};

/**
 * Ver lista de usuarios sin eliminar nada
 */
export const listAllUsers = async () => {
  logger.debug('📋 Listando todos los usuarios...');
  logger.debug('═══════════════════════════════════════════════');

  try {
    // Usuarios
    logger.debug('');
    logger.debug('👥 Colección "users":');
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    if (usersSnapshot.empty) {
      logger.debug('   (vacía)');
    } else {
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        const isAdmin = data.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        logger.debug(`   ${isAdmin ? '👑' : '👤'} ${data.email || doc.id} - ${data.role || 'sin rol'}`);
      });
    }

    // Estudiantes
    logger.debug('');
    logger.debug('👨‍🎓 Colección "students":');
    const studentsRef = collection(db, 'students');
    const studentsSnapshot = await getDocs(studentsRef);

    if (studentsSnapshot.empty) {
      logger.debug('   (vacía)');
    } else {
      studentsSnapshot.forEach(doc => {
        const data = doc.data();
        const isAdmin = data.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        logger.debug(`   ${isAdmin ? '👑' : '👨‍🎓'} ${data.name || data.email || doc.id}`);
      });
    }

    logger.debug('');
    logger.debug('═══════════════════════════════════════════════');
    logger.debug('Total en "users":', usersSnapshot.size);
    logger.debug('Total en "students":', studentsSnapshot.size);
    logger.debug('Admin protegido:', ADMIN_EMAIL);

    return true;
  } catch (error) {
    logger.error('❌ Error:', error.message);
    return false;
  }
};

// Exportar para uso en consola
window.testFirestorePermissions = testFirestorePermissions;
window.manualCreateUserRole = manualCreateUserRole;
window.cleanupDevUsers = cleanupDevUsers;
window.cleanupDevUsersConfirmed = cleanupDevUsersConfirmed;
window.listAllUsers = listAllUsers;

/**
 * Ver cursos en Firestore
 */
export const listCourses = async () => {
  logger.debug('📚 Listando cursos en Firestore...');
  logger.debug('═══════════════════════════════════════════════');

  try {
    const coursesRef = collection(db, 'courses');
    const coursesSnapshot = await getDocs(coursesRef);

    if (coursesSnapshot.empty) {
      logger.debug('   (no hay cursos)');
    } else {
      coursesSnapshot.forEach(doc => {
        const data = doc.data();
        logger.debug(`   📖 ${data.name || doc.id}`);
        logger.debug(`      - Descripción: ${data.description || 'sin descripción'}`);
        logger.debug(`      - Estudiantes: ${data.students?.length || 0}`);
        logger.debug(`      - Activo: ${data.active !== false ? 'Sí' : 'No'}`);
      });
    }

    logger.debug('');
    logger.debug('═══════════════════════════════════════════════');
    logger.debug('Total cursos:', coursesSnapshot.size);

    return true;
  } catch (error) {
    logger.error('❌ Error:', error.message);
    return false;
  }
};

// Exportar para uso en consola
window.listCourses = listCourses;

logger.debug('🛠️ Debug utilities loaded!');
logger.debug('Ejecuta en la consola:');
logger.debug('  testFirestorePermissions() - Para probar permisos');
logger.debug('  manualCreateUserRole("admin") - Para crear tu usuario manualmente');
logger.debug('  listAllUsers() - Para ver todos los usuarios');
logger.debug('  listCourses() - Para ver todos los cursos');
logger.debug('  cleanupDevUsers() - Para eliminar usuarios de desarrollo (excepto admin)');
logger.debug('');
logger.debug('⚠️ NOTA: cleanupDevUsers() solo elimina de Firestore, NO de Authentication');
logger.debug('Para eliminar de Authentication también, debes hacerlo manualmente en Firebase Console');
