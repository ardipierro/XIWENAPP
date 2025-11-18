/**
 * Helper para mostrar el UID del usuario actual
 * Usar en cualquier componente o en la consola
 */

import { auth } from '../firebase/config';

export function showMyUID() {
  const user = auth.currentUser;

  if (!user) {
    console.error('❌ No hay usuario autenticado');
    alert('Por favor inicia sesión primero');
    return null;
  }

  const uid = user.uid;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🆔 TU USER ID (UID):');
  console.log(uid);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 Copia este UID y pégalo en:');
  console.log('   scripts/create-sample-exercises.js');
  console.log('   Línea 20: const TEACHER_ID = "' + uid + '";');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // También mostrarlo en un alert para copiar fácilmente
  alert('Tu UID:\n\n' + uid + '\n\nSe ha copiado a la consola. Presiona F12 para verlo.');

  return uid;
}

// Exportar también para uso en componentes
export default showMyUID;
