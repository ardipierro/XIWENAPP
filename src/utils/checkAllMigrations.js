import logger from 'logger';

import { checkMigrationStatus as checkLessonsStatus } from './migrateLessonsToContent';
import { checkMigrationStatus as checkManyToManyStatus } from './migrateToManyToMany';

/**
 * Verificar estado completo de todas las migraciones
 */
export async function checkAllMigrations() {
  logger.debug('\n' + '='.repeat(70));
  logger.debug('🔍 VERIFICACIÓN COMPLETA DE MIGRACIONES');
  logger.debug('='.repeat(70));

  const results = {
    lessonsToContent: null,
    manyToMany: null,
    overall: 'unknown'
  };

  try {
    // ==========================================
    // 1. Migración de Lessons → Content
    // ==========================================
    logger.debug('\n📚 MIGRACIÓN 1: Lessons → Content\n');
    results.lessonsToContent = await checkLessonsStatus();

    // ==========================================
    // 2. Migración a Many-to-Many
    // ==========================================
    logger.debug('\n🔗 MIGRACIÓN 2: Many-to-Many Relationships\n');
    results.manyToMany = await checkManyToManyStatus();

    // ==========================================
    // RESUMEN FINAL
    // ==========================================
    logger.debug('\n' + '='.repeat(70));
    logger.debug('📊 RESUMEN GENERAL\n');

    const lessonsOK = results.lessonsToContent && results.lessonsToContent.pending === 0;
    const manyToManyOK = results.manyToMany &&
      results.manyToMany['Estado contenidos'] === '✅ OK' &&
      results.manyToMany['Estado ejercicios'] === '✅ OK';

    if (lessonsOK && manyToManyOK) {
      results.overall = 'success';
      logger.debug('✅ TODAS LAS MIGRACIONES COMPLETADAS EXITOSAMENTE');
      logger.debug('\n✨ El sistema está completamente migrado y listo para usar.');
    } else {
      results.overall = 'pending';
      logger.debug('⚠️  HAY MIGRACIONES PENDIENTES\n');

      if (!lessonsOK && results.lessonsToContent) {
        logger.debug(`❌ Lessons → Content: ${results.lessonsToContent.pending} lecciones pendientes`);
        logger.debug('   Ejecuta: migrateLessonsToContent()');
      }

      if (!manyToManyOK && results.manyToMany) {
        logger.debug('❌ Many-to-Many: Relaciones pendientes de crear');
        logger.debug('   Ejecuta: migrateToManyToMany()');
      }
    }

    logger.debug('='.repeat(70) + '\n');

    return results;

  } catch (error) {
    logger.error('\n❌ ERROR AL VERIFICAR MIGRACIONES:', error);
    results.overall = 'error';
    results.error = error.message;
    return results;
  }
}

/**
 * Ejecutar verificación y mostrar en consola (para uso manual)
 */
if (typeof window !== 'undefined') {
  window.checkAllMigrations = checkAllMigrations;
}
