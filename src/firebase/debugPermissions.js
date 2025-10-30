import { doc, setDoc, serverTimestamp, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db, auth } from './config';
import { ADMIN_EMAIL } from './roleConfig';

/**
 * Función de debug para probar permisos de Firestore
 * Ejecuta esto en la consola del navegador para ver el error exacto
 */
export const testFirestorePermissions = async () => {
  console.log('🧪 Probando permisos de Firestore...');

  const user = auth.currentUser;
  if (!user) {
    console.error('❌ No hay usuario autenticado');
    return;
  }

  console.log('👤 Usuario actual:', {
    uid: user.uid,
    email: user.email
  });

  try {
    console.log('📝 Intentando crear documento en users/' + user.uid);

    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      role: 'admin',
      email: user.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    }, { merge: true });

    console.log('✅ ¡Éxito! El documento fue creado');
    console.log('Recarga la página para ver los cambios');
    return true;
  } catch (error) {
    console.error('❌ Error completo:', error);
    console.error('Código:', error.code);
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);

    if (error.code === 'permission-denied') {
      console.error('');
      console.error('🔒 PERMISO DENEGADO');
      console.error('═══════════════════');
      console.error('Las Firestore Security Rules están bloqueando la escritura.');
      console.error('');
      console.error('Solución:');
      console.error('1. Ve a: https://console.firebase.google.com/');
      console.error('2. Selecciona tu proyecto');
      console.error('3. Ve a Firestore Database → Rules');
      console.error('4. Copia el contenido de firestore.rules');
      console.error('5. Pégalo en el editor y haz clic en Publish');
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
    console.error('❌ No hay usuario autenticado');
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

    console.log(`✅ Usuario creado con rol: ${role}`);
    console.log('🔄 Recarga la página');
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
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
    console.error('❌ No hay usuario autenticado');
    return false;
  }

  // Verificar que el usuario actual es el admin
  if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    console.error('❌ ACCESO DENEGADO: Solo el admin puede ejecutar esta función');
    console.error('Email del admin configurado:', ADMIN_EMAIL);
    console.error('Tu email:', user.email);
    return false;
  }

  console.log('⚠️  ADVERTENCIA: Esta función eliminará TODOS los usuarios excepto el admin');
  console.log('Admin protegido:', ADMIN_EMAIL);
  console.log('');

  const confirmText = 'Para continuar, ejecuta: cleanupDevUsersConfirmed()';
  console.log('🔴', confirmText);

  return false;
};

/**
 * Confirmación para eliminar usuarios
 */
export const cleanupDevUsersConfirmed = async () => {
  const user = auth.currentUser;
  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    console.error('❌ Acceso denegado');
    return false;
  }

  console.log('🗑️  Iniciando limpieza de usuarios de desarrollo...');
  console.log('═══════════════════════════════════════════════');

  let deletedUsers = 0;
  let deletedStudents = 0;
  let protectedUsers = 0;

  try {
    // 1. Eliminar de colección "users"
    console.log('');
    console.log('1️⃣  Limpiando colección "users"...');
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const isAdmin = userData.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      if (isAdmin) {
        console.log('✅ Protegiendo admin:', userData.email);
        protectedUsers++;
      } else {
        await deleteDoc(doc(db, 'users', userDoc.id));
        console.log('🗑️  Eliminado:', userData.email || userDoc.id);
        deletedUsers++;
      }
    }

    // 2. Eliminar de colección "students"
    console.log('');
    console.log('2️⃣  Limpiando colección "students"...');
    const studentsRef = collection(db, 'students');
    const studentsSnapshot = await getDocs(studentsRef);

    for (const studentDoc of studentsSnapshot.docs) {
      const studentData = studentDoc.data();
      const isAdmin = studentData.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

      if (isAdmin) {
        console.log('✅ Protegiendo admin:', studentData.email);
      } else {
        await deleteDoc(doc(db, 'students', studentDoc.id));
        console.log('🗑️  Eliminado:', studentData.name || studentData.email || studentDoc.id);
        deletedStudents++;
      }
    }

    // Resumen
    console.log('');
    console.log('═══════════════════════════════════════════════');
    console.log('✅ Limpieza completada:');
    console.log('   👥 Usuarios eliminados:', deletedUsers);
    console.log('   👨‍🎓 Estudiantes eliminados:', deletedStudents);
    console.log('   🛡️  Usuarios protegidos:', protectedUsers);
    console.log('');
    console.log('🔄 Recarga la página para ver los cambios');
    console.log('═══════════════════════════════════════════════');

    return true;
  } catch (error) {
    console.error('');
    console.error('❌ Error durante la limpieza:', error);
    console.error('Código:', error.code);
    console.error('Mensaje:', error.message);
    return false;
  }
};

/**
 * Ver lista de usuarios sin eliminar nada
 */
export const listAllUsers = async () => {
  console.log('📋 Listando todos los usuarios...');
  console.log('═══════════════════════════════════════════════');

  try {
    // Usuarios
    console.log('');
    console.log('👥 Colección "users":');
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    if (usersSnapshot.empty) {
      console.log('   (vacía)');
    } else {
      usersSnapshot.forEach(doc => {
        const data = doc.data();
        const isAdmin = data.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        console.log(`   ${isAdmin ? '👑' : '👤'} ${data.email || doc.id} - ${data.role || 'sin rol'}`);
      });
    }

    // Estudiantes
    console.log('');
    console.log('👨‍🎓 Colección "students":');
    const studentsRef = collection(db, 'students');
    const studentsSnapshot = await getDocs(studentsRef);

    if (studentsSnapshot.empty) {
      console.log('   (vacía)');
    } else {
      studentsSnapshot.forEach(doc => {
        const data = doc.data();
        const isAdmin = data.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
        console.log(`   ${isAdmin ? '👑' : '👨‍🎓'} ${data.name || data.email || doc.id}`);
      });
    }

    console.log('');
    console.log('═══════════════════════════════════════════════');
    console.log('Total en "users":', usersSnapshot.size);
    console.log('Total en "students":', studentsSnapshot.size);
    console.log('Admin protegido:', ADMIN_EMAIL);

    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
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
  console.log('📚 Listando cursos en Firestore...');
  console.log('═══════════════════════════════════════════════');

  try {
    const coursesRef = collection(db, 'courses');
    const coursesSnapshot = await getDocs(coursesRef);

    if (coursesSnapshot.empty) {
      console.log('   (no hay cursos)');
    } else {
      coursesSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`   📖 ${data.name || doc.id}`);
        console.log(`      - Descripción: ${data.description || 'sin descripción'}`);
        console.log(`      - Estudiantes: ${data.students?.length || 0}`);
        console.log(`      - Activo: ${data.active !== false ? 'Sí' : 'No'}`);
      });
    }

    console.log('');
    console.log('═══════════════════════════════════════════════');
    console.log('Total cursos:', coursesSnapshot.size);

    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
};

// Exportar para uso en consola
window.listCourses = listCourses;

console.log('🛠️ Debug utilities loaded!');
console.log('Ejecuta en la consola:');
console.log('  testFirestorePermissions() - Para probar permisos');
console.log('  manualCreateUserRole("admin") - Para crear tu usuario manualmente');
console.log('  listAllUsers() - Para ver todos los usuarios');
console.log('  listCourses() - Para ver todos los cursos');
console.log('  cleanupDevUsers() - Para eliminar usuarios de desarrollo (excepto admin)');
console.log('');
console.log('⚠️ NOTA: cleanupDevUsers() solo elimina de Firestore, NO de Authentication');
console.log('Para eliminar de Authentication también, debes hacerlo manualmente en Firebase Console');
