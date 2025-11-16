/**
 * @fileoverview Modal principal del Exercise Builder
 * @module components/exercisebuilder/ExerciseBuilderModal
 */

import { Sparkles } from 'lucide-react';
import { BaseModal } from '../common';
import { AIExerciseGenerator } from './AIExerciseGenerator';

/**
 * Modal del Exercise Builder
 * Contiene el generador de ejercicios con IA
 */
export function ExerciseBuilderModal({ isOpen, onClose }) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Generador de Ejercicios con IA"
      icon={Sparkles}
      size="xl"
    >
      <AIExerciseGenerator />
    </BaseModal>
  );
}

export default ExerciseBuilderModal;
