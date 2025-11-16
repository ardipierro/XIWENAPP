/**
 * @fileoverview Generador de ejercicios con IA desde texto
 * @module components/exercisebuilder/AIExerciseGenerator
 */

import { useState } from 'react';
import { Sparkles, FileText, Wand2, Download, Eye } from 'lucide-react';
import { BaseButton, BaseBadge, CategoryBadge, BaseAlert } from '../common';
import { UniversalCard } from '../cards';
import { generateExercisesFromText } from '../../services/aiService';
import logger from '../../utils/logger';

/**
 * Generador de Ejercicios con IA
 * Permite pegar texto y generar ejercicios automáticamente
 */
export function AIExerciseGenerator({ onExercisesGenerated = () => {} }) {
  const [sourceText, setSourceText] = useState('');
  const [exerciseType, setExerciseType] = useState('mcq');
  const [quantity, setQuantity] = useState(3);
  const [cefrLevel, setCefrLevel] = useState('A2');
  const [generating, setGenerating] = useState(false);
  const [generatedExercises, setGeneratedExercises] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  const exerciseTypes = [
    { value: 'mcq', label: 'Opción Múltiple', icon: '📝' },
    { value: 'blank', label: 'Llenar Espacios', icon: '✏️' },
    { value: 'truefalse', label: 'Verdadero/Falso', icon: '✅' },
    { value: 'cloze', label: 'Cloze Test', icon: '🔤' }
  ];

  const handleGenerate = async () => {
    if (!sourceText.trim()) {
      return;
    }

    setGenerating(true);
    try {
      const exercises = await generateExercisesFromText(sourceText, {
        exerciseType,
        quantity,
        cefrLevel
      });

      setGeneratedExercises(exercises);
      setShowPreview(true);
      onExercisesGenerated(exercises);

      logger.info('Exercises generated successfully', { count: exercises.length });
    } catch (error) {
      logger.error('Error generating exercises:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(generatedExercises, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ejercicios-ia-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Sparkles className="text-purple-600 dark:text-purple-400" size={28} />
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Generador de Ejercicios con IA
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Pega un texto y genera ejercicios automáticamente
          </p>
        </div>
      </div>

      <BaseAlert variant="info">
        <div className="flex items-start gap-2">
          <Sparkles size={20} className="flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium mb-1">Generación Inteligente</p>
            <p>
              El sistema analiza el texto y crea ejercicios adaptados al nivel CEFR seleccionado.
              Actualmente usa reglas inteligentes. Para IA real (OpenAI), configura tu API key en .env
            </p>
          </div>
        </div>
      </BaseAlert>

      {/* Área de texto fuente */}
      <UniversalCard variant="default" size="md" title="Texto Fuente" icon={FileText}>
        <textarea
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          placeholder="Pega aquí el texto base para generar ejercicios... Por ejemplo: 'El perro grande corre por el parque. Los niños juegan con la pelota. María lee un libro interesante.'"
          rows={8}
          className="w-full px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <div className="mt-2 flex justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>{sourceText.length} caracteres</span>
          <span>
            {sourceText.split(/[.!?]+/).filter(s => s.trim().length > 10).length} oraciones
          </span>
        </div>
      </UniversalCard>

      {/* Configuración */}
      <UniversalCard variant="default" size="md" title="Configuración de Generación" icon={Wand2}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tipo de ejercicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Ejercicio
            </label>
            <div className="grid grid-cols-2 gap-2">
              {exerciseTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setExerciseType(type.value)}
                  className={`
                    p-3 rounded-lg border-2 transition-all text-center
                    ${exerciseType === type.value
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="text-2xl mb-1">{type.icon}</div>
                  <div className="text-xs font-medium text-gray-900 dark:text-white">
                    {type.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Cantidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cantidad: {quantity}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>

          {/* Nivel CEFR */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nivel CEFR
            </label>
            <div className="grid grid-cols-3 gap-1">
              {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((level) => (
                <button
                  key={level}
                  onClick={() => setCefrLevel(level)}
                  className={`
                    py-2 rounded border-2 text-sm font-medium transition-all
                    ${cefrLevel === level
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                      : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                    }
                  `}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>
      </UniversalCard>

      {/* Botón de generar */}
      <div className="flex gap-3">
        <BaseButton
          variant="primary"
          icon={Sparkles}
          onClick={handleGenerate}
          disabled={!sourceText.trim() || generating}
          fullWidth
        >
          {generating ? 'Generando...' : `Generar ${quantity} Ejercicio${quantity > 1 ? 's' : ''}`}
        </BaseButton>

        {generatedExercises.length > 0 && (
          <>
            <BaseButton
              variant="outline"
              icon={Eye}
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Ocultar' : 'Ver'} Preview
            </BaseButton>
            <BaseButton variant="ghost" icon={Download} onClick={handleExport}>
              Exportar
            </BaseButton>
          </>
        )}
      </div>

      {/* Preview de ejercicios generados */}
      {showPreview && generatedExercises.length > 0 && (
        <UniversalCard variant="default" size="md" title="Ejercicios Generados">
          <div className="space-y-4">
            {generatedExercises.map((exercise, idx) => (
              <div
                key={idx}
                className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              >
                <div className="flex items-center justify-between mb-2">
                  <CategoryBadge
                    type="exercise"
                    value={exercise.type}
                  />
                  <CategoryBadge type="cefr" value={cefrLevel} />
                </div>

                {/* MCQ Preview */}
                {exercise.type === 'mcq' && (
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white mb-2">
                      {exercise.question}
                    </p>
                    <div className="space-y-1 ml-4">
                      {exercise.options?.map((opt, i) => (
                        <div
                          key={i}
                          className={`text-sm ${
                            opt.value === exercise.correctAnswer
                              ? 'text-green-600 dark:text-green-400 font-medium'
                              : 'text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {opt.value.toUpperCase()}) {opt.label}
                          {opt.value === exercise.correctAnswer && ' ✓'}
                        </div>
                      ))}
                    </div>
                    {exercise.explanation && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
                        {exercise.explanation}
                      </p>
                    )}
                  </div>
                )}

                {/* Blank Preview */}
                {exercise.type === 'blank' && (
                  <div>
                    <p className="text-gray-900 dark:text-white mb-2">
                      {exercise.sentence}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Respuesta: {exercise.correctAnswer?.[0]}
                    </p>
                  </div>
                )}

                {/* True/False Preview */}
                {exercise.type === 'truefalse' && (
                  <div>
                    <p className="text-gray-900 dark:text-white mb-2">
                      {exercise.statement}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Respuesta: {exercise.correctAnswer ? 'Verdadero' : 'Falso'}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </UniversalCard>
      )}
    </div>
  );
}

export default AIExerciseGenerator;
