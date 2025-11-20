/**
 * @fileoverview Modal principal del Exercise Builder
 * @module components/exercisebuilder/ExerciseBuilderModal
 */

import { useState } from 'react';
import { Sparkles, Highlighter, Wand2 } from 'lucide-react';
import { BaseModal, BaseTabs } from '../common';
import { AIExerciseGenerator } from './AIExerciseGenerator';
import { WordMarkingExerciseCreator } from './WordMarkingExerciseCreator';

/**
 * Modal del Exercise Builder
 * Contiene el generador de ejercicios con IA y marcado de palabras
 */
export function ExerciseBuilderModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('ai-generator');
  const [showWordMarkingModal, setShowWordMarkingModal] = useState(false);

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Generador de Ejercicios"
        icon={Sparkles}
        size="xl"
      >
        <BaseTabs
          value={activeTab}
          onChange={setActiveTab}
          tabs={[
            {
              value: 'ai-generator',
              label: 'Generador con IA',
              icon: Wand2
            },
            {
              value: 'word-marking',
              label: 'Marcado de Palabras',
              icon: Highlighter
            }
          ]}
        >
          {/* Pestaña: Generador con IA */}
          {activeTab === 'ai-generator' && (
            <div className="pt-4">
              <AIExerciseGenerator />
            </div>
          )}

          {/* Pestaña: Marcado de Palabras */}
          {activeTab === 'word-marking' && (
            <div className="pt-4 space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Ejercicios de Marcado de Palabras
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Crea ejercicios para identificar verbos, sustantivos, adjetivos y más
                </p>
                <button
                  onClick={() => setShowWordMarkingModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                >
                  <Highlighter size={20} />
                  Crear Ejercicio de Marcado
                </button>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-3">
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  Dos formas de crear ejercicios:
                </h4>
                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-blue-600 dark:text-blue-400">✍️ Manual:</span>
                    <span>Pega tu texto con marcadores como *palabra*, [palabra], etc.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-purple-600 dark:text-purple-400">🤖 IA:</span>
                    <span>Genera texto automáticamente con palabras marcadas según tema, nivel y dificultad</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded p-3 text-xs font-mono">
                  <div className="text-gray-600 dark:text-gray-400 mb-1">Ejemplo:</div>
                  <div className="text-gray-900 dark:text-gray-100">
                    María *estudia* español. Juan *trabaja* mucho.
                  </div>
                </div>
              </div>
            </div>
          )}
        </BaseTabs>
      </BaseModal>

      {/* Modal de WordMarking (standalone) */}
      <WordMarkingExerciseCreator
        isOpen={showWordMarkingModal}
        onClose={() => setShowWordMarkingModal(false)}
        onSave={(exercise) => {
          console.log('Ejercicio guardado:', exercise);
          setShowWordMarkingModal(false);
          // Aquí podrías guardar el ejercicio en el sistema
        }}
      />
    </>
  );
}

export default ExerciseBuilderModal;
