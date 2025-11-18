/**
 * @fileoverview Script de migración para corregir roles de usuario incorrectos
 *
 * PROPÓSITO:
 * - Detectar usuarios con roles incorrectos en Firestore
 * - Corregir automáticamente usuarios que deberían ser 'student' pero tienen 'admin'
 * - Generar reporte de cambios realizados
 *
 * CÓMO USAR:
 * 1. Desde Firebase Console: Copiar y pegar en Cloud Functions
 * 2. Desde la app (solo admins): Importar y ejecutar manualmente
 * 3. Desde Node.js: Ejecutar con Firebase Admin SDK
 *
 * @module scripts/fix-user-roles
 */

import { collection, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../src/firebase/config.js';
import logger from '../src/utils/logger.js';

// Importar configuración de emails de admin
// IMPORTANTE: Crear el archivo admin-emails-config.js antes de ejecutar
let ADMIN_EMAILS = [];
let configLoaded = false;

/**
 * Intenta cargar la configuración de emails de admin
 */
async function loadAdminConfig() {
  if (configLoaded) return;

  try {
    const config = await import('./admin-emails-config.js');
    ADMIN_EMAILS = config.ADMIN_EMAILS || [];
    configLoaded = true;
    logger.info(`✅ Configuración cargada: ${ADMIN_EMAILS.length} administradores`, 'RoleMigration');
  } catch (error) {
    logger.warn('⚠️ No se pudo cargar admin-emails-config.js. Usando lista vacía.', 'RoleMigration');
    logger.warn('💡 Crea el archivo desde admin-emails-config.example.js', 'RoleMigration');
    ADMIN_EMAILS = [];
    configLoaded = true;
  }
}

/**
 * Verifica si un email debería ser admin
 */
function shouldBeAdmin(email) {
  return ADMIN_EMAILS.includes(email?.toLowerCase());
}

/**
 * Valida si un rol es válido
 */
function isValidRole(role) {
  const validRoles = ['admin', 'teacher', 'trial_teacher', 'student', 'listener', 'trial', 'guardian'];
  return validRoles.includes(role);
}

/**
 * Detecta y reporta usuarios con roles inconsistentes
 */
export async function scanUserRoles() {
  try {
    // Cargar configuración de admins
    await loadAdminConfig();

    logger.info('🔍 Escaneando usuarios para detectar roles incorrectos...', 'RoleMigration');

    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    const issues = [];
    const stats = {
      total: snapshot.size,
      adminToStudent: 0,
      studentToAdmin: 0,
      invalidRoles: 0,
      correct: 0
    };

    snapshot.forEach((docSnap) => {
      const user = { id: docSnap.id, ...docSnap.data() };
      const currentRole = user.role;
      const email = user.email;

      // Verificar rol inválido
      if (!isValidRole(currentRole)) {
        issues.push({
          type: 'invalid_role',
          userId: user.id,
          email: email,
          currentRole: currentRole,
          suggestedRole: 'student',
          reason: 'Rol no reconocido en el sistema'
        });
        stats.invalidRoles++;
        return;
      }

      // Caso 1: Tiene rol 'admin' pero NO está en la lista de admins
      if (currentRole === 'admin' && !shouldBeAdmin(email)) {
        issues.push({
          type: 'admin_to_student',
          userId: user.id,
          email: email,
          name: user.name,
          currentRole: 'admin',
          suggestedRole: 'student',
          reason: 'Email no autorizado como administrador'
        });
        stats.adminToStudent++;
        return;
      }

      // Caso 2: Está en la lista de admins pero tiene otro rol
      if (shouldBeAdmin(email) && currentRole !== 'admin') {
        issues.push({
          type: 'student_to_admin',
          userId: user.id,
          email: email,
          name: user.name,
          currentRole: currentRole,
          suggestedRole: 'admin',
          reason: 'Email autorizado como administrador'
        });
        stats.studentToAdmin++;
        return;
      }

      stats.correct++;
    });

    logger.info('✅ Escaneo completado', 'RoleMigration');
    logger.info(`📊 Estadísticas:
      - Total usuarios: ${stats.total}
      - Correctos: ${stats.correct}
      - Admin → Student: ${stats.adminToStudent}
      - Student → Admin: ${stats.studentToAdmin}
      - Roles inválidos: ${stats.invalidRoles}
    `, 'RoleMigration');

    return {
      success: true,
      stats,
      issues
    };
  } catch (error) {
    logger.error('❌ Error escaneando usuarios', error, 'RoleMigration');
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Corrige automáticamente los roles incorrectos
 * @param {boolean} dryRun - Si es true, solo simula los cambios sin aplicarlos
 */
export async function fixUserRoles(dryRun = true) {
  try {
    logger.info(
      dryRun
        ? '🧪 MODO PRUEBA: Simulando corrección de roles (no se aplicarán cambios)'
        : '⚠️ MODO REAL: Corrigiendo roles en Firestore',
      'RoleMigration'
    );

    // Primero escanear para obtener los problemas
    const scanResult = await scanUserRoles();

    if (!scanResult.success) {
      return scanResult;
    }

    const { issues, stats } = scanResult;

    if (issues.length === 0) {
      logger.info('✅ No se encontraron problemas de roles', 'RoleMigration');
      return {
        success: true,
        message: 'No hay roles para corregir',
        stats,
        changes: []
      };
    }

    const changes = [];

    // Aplicar correcciones
    for (const issue of issues) {
      const change = {
        userId: issue.userId,
        email: issue.email,
        name: issue.name,
        from: issue.currentRole,
        to: issue.suggestedRole,
        reason: issue.reason,
        applied: false
      };

      if (!dryRun) {
        try {
          const userRef = doc(db, 'users', issue.userId);
          await updateDoc(userRef, {
            role: issue.suggestedRole,
            updatedAt: serverTimestamp(),
            roleFixedAt: serverTimestamp(),
            roleFixedReason: issue.reason
          });

          change.applied = true;
          logger.info(`✅ Rol actualizado: ${issue.email} (${issue.currentRole} → ${issue.suggestedRole})`, 'RoleMigration');
        } catch (updateError) {
          change.error = updateError.message;
          logger.error(`❌ Error actualizando usuario ${issue.email}:`, updateError, 'RoleMigration');
        }
      } else {
        logger.info(`🧪 [SIMULADO] Cambiaría: ${issue.email} (${issue.currentRole} → ${issue.suggestedRole})`, 'RoleMigration');
      }

      changes.push(change);
    }

    const summary = {
      success: true,
      dryRun,
      stats,
      totalIssues: issues.length,
      totalFixed: changes.filter(c => c.applied).length,
      changes
    };

    if (dryRun) {
      logger.info('🧪 MODO PRUEBA: Para aplicar los cambios, ejecuta fixUserRoles(false)', 'RoleMigration');
    } else {
      logger.info(`✅ Corrección completada: ${summary.totalFixed}/${summary.totalIssues} roles corregidos`, 'RoleMigration');
    }

    return summary;
  } catch (error) {
    logger.error('❌ Error corrigiendo roles', error, 'RoleMigration');
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Genera un reporte legible de los problemas de roles
 */
export async function generateRoleReport() {
  const result = await scanUserRoles();

  if (!result.success) {
    console.error('❌ Error generando reporte:', result.error);
    return;
  }

  console.log('\n📋 ===== REPORTE DE ROLES DE USUARIO =====\n');
  console.log(`Total de usuarios: ${result.stats.total}`);
  console.log(`✅ Roles correctos: ${result.stats.correct}`);
  console.log(`⚠️ Roles incorrectos: ${result.issues.length}\n`);

  if (result.issues.length > 0) {
    console.log('🔍 Problemas detectados:\n');

    result.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.email || 'Sin email'}`);
      console.log(`   Usuario: ${issue.name || 'Sin nombre'} (ID: ${issue.userId})`);
      console.log(`   Rol actual: ${issue.currentRole}`);
      console.log(`   Rol sugerido: ${issue.suggestedRole}`);
      console.log(`   Razón: ${issue.reason}\n`);
    });

    console.log('\n💡 Para corregir estos problemas:');
    console.log('   1. Modo prueba (sin cambios): fixUserRoles(true)');
    console.log('   2. Aplicar correcciones: fixUserRoles(false)\n');
  } else {
    console.log('✅ No se detectaron problemas de roles\n');
  }
}

// Si se ejecuta directamente (Node.js)
if (import.meta.url === `file://${process.argv[1]}`) {
  generateRoleReport();
}
