/**
 * ExerciseMakerESL - AI-powered ESL Exercise Generator Modal
 *
 * Features:
 * - AI-generated exercises with live parsing
 * - Multiple exercise types: gap-fill, multiple-choice, drag-to-match, listening
 * - CEFR levels A1-C2
 * - Interactive components with instant feedback
 * - Mobile-first responsive design
 * - Closes with ESC key
 *
 * This is now a wrapper around ExerciseGeneratorContent
 */

import { Sparkles } from 'lucide-react';
import BaseModal from './common/BaseModal';
import ExerciseGeneratorContent from './ExerciseGeneratorContent';

const ExerciseMakerESL = ({ isOpen, onClose }) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Generador de Ejercicios ESL"
      icon={Sparkles}
      size="xl"
      showCloseButton
      closeOnOverlayClick
    >
      <ExerciseGeneratorContent />
    </BaseModal>
  );
};

export default ExerciseMakerESL;
