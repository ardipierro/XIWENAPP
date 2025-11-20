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

  const handleWordMarkingSave = (exercise) => {
    console.log('Ejercicio de marcado guardado:', exercise);
    // Aquí podrías guardar el ejercicio en el sistema de contenidos
    // Por ahora solo lo logueamos
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Generador de Ejercicios"
      icon={Sparkles}
      size="xl"
    >
      {/* Pestañas de navegación */}
      <div className="mb-6">
        <BaseTabs
          tabs={[
            {
              id: 'ai-generator',
              label: 'Generador con IA',
              icon: Wand2
            },
            {
              id: 'word-marking',
              label: 'Marcado de Palabras',
              icon: Highlighter
            }
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="underline"
          fullWidth={false}
        />
      </div>

      {/* Contenido de las pestañas */}
      <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
        {/* Pestaña: Generador con IA */}
        {activeTab === 'ai-generator' && (
          <AIExerciseGenerator />
        )}

        {/* Pestaña: Marcado de Palabras - DIRECTO al creador */}
        {activeTab === 'word-marking' && (
          <WordMarkingExerciseCreator
            isOpen={true}
            onClose={onClose}
            onSave={handleWordMarkingSave}
            embedded={true}
          />
        )}
      </div>
    </BaseModal>
  );
}

export default ExerciseBuilderModal;
