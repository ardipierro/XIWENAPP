import { checkMigrationStatus as checkLessonsStatus } from './migrateLessonsToContent';
import { checkMigrationStatus as checkManyToManyStatus } from './migrateToManyToMany';

/**
 * Verificar estado completo de todas las migraciones
 */
export async function checkAllMigrations() {
  console.log('\n' + '='.repeat(70));
  console.log('🔍 VERIFICACIÓN COMPLETA DE MIGRACIONES');
  console.log('='.repeat(70));

  const results = {
    lessonsToContent: null,
    manyToMany: null,
    overall: 'unknown'
  };

  try {
    // ==========================================
    // 1. Migración de Lessons → Content
    // ==========================================
    console.log('\n📚 MIGRACIÓN 1: Lessons → Content\n');
    results.lessonsToContent = await checkLessonsStatus();

    // ==========================================
    // 2. Migración a Many-to-Many
    // ==========================================
    console.log('\n🔗 MIGRACIÓN 2: Many-to-Many Relationships\n');
    results.manyToMany = await checkManyToManyStatus();

    // ==========================================
    // RESUMEN FINAL
    // ==========================================
    console.log('\n' + '='.repeat(70));
    console.log('📊 RESUMEN GENERAL\n');

    const lessonsOK = results.lessonsToContent && results.lessonsToContent.pending === 0;
    const manyToManyOK = results.manyToMany &&
      results.manyToMany['Estado contenidos'] === '✅ OK' &&
      results.manyToMany['Estado ejercicios'] === '✅ OK';

    if (lessonsOK && manyToManyOK) {
      results.overall = 'success';
      console.log('✅ TODAS LAS MIGRACIONES COMPLETADAS EXITOSAMENTE');
      console.log('\n✨ El sistema está completamente migrado y listo para usar.');
    } else {
      results.overall = 'pending';
      console.log('⚠️  HAY MIGRACIONES PENDIENTES\n');

      if (!lessonsOK && results.lessonsToContent) {
        console.log(`❌ Lessons → Content: ${results.lessonsToContent.pending} lecciones pendientes`);
        console.log('   Ejecuta: migrateLessonsToContent()');
      }

      if (!manyToManyOK && results.manyToMany) {
        console.log('❌ Many-to-Many: Relaciones pendientes de crear');
        console.log('   Ejecuta: migrateToManyToMany()');
      }
    }

    console.log('='.repeat(70) + '\n');

    return results;

  } catch (error) {
    console.error('\n❌ ERROR AL VERIFICAR MIGRACIONES:', error);
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
