/**
 * Botón para crear 10 ejercicios de ejemplo automáticamente
 * Se puede usar en cualquier parte del dashboard de profesor
 */

import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { useAuth } from '../contexts/AuthContext';
import { BaseButton, BaseAlert } from './common';
import { Sparkles, Check, AlertCircle } from 'lucide-react';
import logger from '../utils/logger';

// Importar los ejercicios de ejemplo
import { SAMPLE_EXERCISES } from '../data/sampleExercises';

export function CreateSampleExercisesButton() {
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState(null); // { success: number, errors: number, message: string }

  const createExercises = async () => {
    if (!user) {
      setResult({ success: 0, errors: 0, message: 'Debes iniciar sesión primero', type: 'error' });
      return;
    }

    setCreating(true);
    setResult(null);

    let successCount = 0;
    let errorCount = 0;

    logger.info('🎯 Iniciando creación de ejercicios de ejemplo...', 'CreateSampleExercises');

    for (let i = 0; i < SAMPLE_EXERCISES.length; i++) {
      const exercise = SAMPLE_EXERCISES[i];

      try {
        const contentData = {
          ...exercise,
          createdBy: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          status: 'published',
          views: 0,
          likes: 0
        };

        const docRef = await addDoc(collection(db, 'contents'), contentData);

        logger.info(`✅ [${i + 1}/10] ${exercise.title} - ID: ${docRef.id}`, 'CreateSampleExercises');
        successCount++;
      } catch (error) {
        logger.error(`❌ [${i + 1}/10] Error en "${exercise.title}":`, error, 'CreateSampleExercises');
        errorCount++;
      }
    }

    setCreating(false);

    if (errorCount === 0) {
      setResult({
        success: successCount,
        errors: errorCount,
        message: `🎉 ¡${successCount} ejercicios creados exitosamente!`,
        type: 'success'
      });
    } else {
      setResult({
        success: successCount,
        errors: errorCount,
        message: `⚠️ Creados: ${successCount} | Errores: ${errorCount}`,
        type: 'warning'
      });
    }

    logger.info(`📊 Resumen: ${successCount} exitosos, ${errorCount} errores`, 'CreateSampleExercises');
  };

  return (
    <div className="space-y-3">
      <BaseButton
        variant="primary"
        icon={Sparkles}
        onClick={createExercises}
        loading={creating}
        disabled={creating || result?.success > 0}
        size="lg"
      >
        {creating ? 'Creando ejercicios...' : result?.success > 0 ? '✅ Ejercicios creados' : '🎯 Crear 10 Ejercicios de Ejemplo'}
      </BaseButton>

      {result && (
        <BaseAlert
          variant={result.type === 'success' ? 'success' : result.type === 'error' ? 'danger' : 'warning'}
          title={result.type === 'success' ? '¡Éxito!' : result.type === 'error' ? 'Error' : 'Parcialmente completado'}
        >
          <div className="space-y-2">
            <p>{result.message}</p>
            {result.success > 0 && (
              <div className="text-sm mt-3 space-y-1">
                <p className="font-semibold">📝 Próximos pasos:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Ve a "Gestionar Contenidos"</li>
                  <li>Busca ejercicios con 🎯</li>
                  <li>O filtra por tag "demo-2025-11-18"</li>
                  <li>Insértalos en un Diario de Clases</li>
                  <li>Prueba la edición en vivo</li>
                </ul>
              </div>
            )}
          </div>
        </BaseAlert>
      )}

      {creating && (
        <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
          <p>Creando ejercicios en Firebase... Por favor espera.</p>
        </div>
      )}
    </div>
  );
}

export default CreateSampleExercisesButton;
