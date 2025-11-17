/**
 * @fileoverview Generador de ejercicios con IA desde texto
 * @module components/exercisebuilder/AIExerciseGenerator
 */

import { useState } from 'react';
import { Sparkles, Download, Eye, Edit3, Save, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { BaseButton, BaseBadge, CategoryBadge, BaseAlert } from '../common';
import { UniversalCard } from '../cards';
import { generateExercisesFromText } from '../../services/AIService';
import { ExerciseEditorModal } from './ExerciseEditorModal';
import { useContentExport } from '../../hooks/useContentExport';
import { useAuth } from '../../contexts/AuthContext';
import logger from '../../utils/logger';

/**
 * Generador de Ejercicios con IA
 * Permite pegar texto y generar ejercicios automáticamente
 */
export function AIExerciseGenerator({ onExercisesGenerated = () => {} }) {
  const { user } = useAuth();
  const { exportContent } = useContentExport();
  const [sourceText, setSourceText] = useState('');
  const [exerciseType, setExerciseType] = useState('mcq');
  const [quantity, setQuantity] = useState(3);
  const [cefrLevel, setCefrLevel] = useState('A2');
  const [generating, setGenerating] = useState(false);
  const [generatedExercises, setGeneratedExercises] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);
  const [showInfo, setShowInfo] = useState(false);

  const exerciseTypes = [
    { value: 'mcq', label: 'Opción Múltiple', icon: '📝', description: 'Preguntas con varias opciones de respuesta' },
    { value: 'blank', label: 'Llenar Espacios', icon: '✏️', description: 'Completar palabras o frases faltantes' },
    { value: 'truefalse', label: 'Verdadero/Falso', icon: '✅', description: 'Determinar si una afirmación es verdadera o falsa' },
    { value: 'cloze', label: 'Cloze Test', icon: '🔤', description: 'Completar múltiples espacios en un texto' },
    { value: 'match', label: 'Emparejar', icon: '🔗', description: 'Relacionar términos con sus definiciones' },
    { value: 'audio-listening', label: 'Comprensión Auditiva', icon: '🎧', description: 'Escuchar audio y responder preguntas' },
    { value: 'text-selection', label: 'Selección de Texto', icon: '🎯', description: 'Seleccionar palabras o frases específicas' },
    { value: 'dragdrop-order', label: 'Ordenar Palabras', icon: '🔀', description: 'Arrastrar palabras para formar oraciones' },
    { value: 'dialogue-roleplay', label: 'Diálogo Interactivo', icon: '💬', description: 'Completar diálogos con respuestas apropiadas' },
    { value: 'verb-identification', label: 'Identificar Verbos', icon: '🔍', description: 'Seleccionar verbos en un texto' },
    { value: 'interactive-reading', label: 'Lectura Interactiva', icon: '📖', description: 'Lectura con vocabulario clickeable' },
    { value: 'ai-audio-pronunciation', label: 'Pronunciación con IA', icon: '🎤', description: 'Practicar pronunciación con audio generado' },
    { value: 'free-dragdrop', label: 'Clasificación Drag & Drop', icon: '📦', description: 'Arrastrar elementos a categorías' },
    { value: 'sentence-builder', label: 'Construir Oraciones', icon: '🏗️', description: 'Construir oraciones desde cero' },
    { value: 'dictation', label: 'Dictado', icon: '✍️', description: 'Escribir lo que se escucha' },
    { value: 'error-detection', label: 'Detectar Errores', icon: '🔴', description: 'Encontrar errores gramaticales' },
    { value: 'collocation-matching', label: 'Colocaciones', icon: '🤝', description: 'Emparejar palabras que van juntas' },
    { value: 'grammar-transformation', label: 'Transformación Gramatical', icon: '🔄', description: 'Transformar estructuras gramaticales' },
    { value: 'hotspot-image', label: 'Imagen Interactiva', icon: '🖼️', description: 'Clickear en puntos específicos de una imagen' },
    { value: 'dialogue-completion', label: 'Completar Diálogo', icon: '💭', description: 'Completar espacios en un diálogo' }
  ];

  const handleGenerate = async () => {
    if (!sourceText.trim()) {
      setSaveMessage({ type: 'error', text: 'Por favor ingresa un texto fuente' });
      setTimeout(() => setSaveMessage(null), 3000);
      return;
    }

    setGenerating(true);
    setSaveMessage(null);
    try {
      const exercises = await generateExercisesFromText(sourceText, {
        exerciseType,
        quantity,
        cefrLevel
      });

      if (exercises && exercises.length > 0) {
        // Agregar IDs únicos a cada ejercicio
        const exercisesWithIds = exercises.map((ex, idx) => ({
          ...ex,
          id: `${Date.now()}_${idx}`,
          cefrLevel
        }));

        setGeneratedExercises(exercisesWithIds);
        setShowPreview(true);
        onExercisesGenerated(exercisesWithIds);

        setSaveMessage({
          type: 'success',
          text: `✅ ${exercises.length} ejercicio(s) generado(s) exitosamente`
        });
        logger.info('Exercises generated successfully', { count: exercises.length });
      } else {
        setSaveMessage({ type: 'error', text: 'No se pudieron generar ejercicios' });
      }
    } catch (error) {
      logger.error('Error generating exercises:', error);
      setSaveMessage({ type: 'error', text: `Error: ${error.message}` });
    } finally {
      setGenerating(false);
      setTimeout(() => setSaveMessage(null), 5000);
    }
  };

  const handleEditExercise = (exercise) => {
    setEditingExercise(exercise);
  };

  const handleSaveExercise = (updatedExercise) => {
    setGeneratedExercises(prev =>
      prev.map(ex => ex.id === updatedExercise.id ? updatedExercise : ex)
    );
    setEditingExercise(null);
    setSaveMessage({ type: 'success', text: 'Ejercicio actualizado' });
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleSaveToContents = async () => {
    if (!user) {
      setSaveMessage({ type: 'error', text: 'Debes iniciar sesión para guardar contenidos' });
      setTimeout(() => setSaveMessage(null), 4000);
      return;
    }

    if (generatedExercises.length === 0) {
      setSaveMessage({ type: 'error', text: 'No hay ejercicios para guardar' });
      setTimeout(() => setSaveMessage(null), 4000);
      return;
    }

    let savedCount = 0;
    let errorCount = 0;

    for (const exercise of generatedExercises) {
      const result = await exportContent({
        type: 'exercise',
        title: exercise.title || exercise.question || exercise.statement || 'Ejercicio sin título',
        description: exercise.explanation || exercise.instructions || '',
        body: JSON.stringify(exercise),
        metadata: {
          exerciseType: exercise.type || 'custom',
          difficulty: exercise.difficulty || cefrLevel,
          cefrLevel: exercise.cefrLevel || cefrLevel,
          points: exercise.points || 100,
          source: 'AIExerciseGenerator'
        },
        createdBy: user.uid
      });

      if (result.success) {
        savedCount++;
      } else {
        errorCount++;
        logger.error('Error guardando ejercicio', result.error, 'AIExerciseGenerator');
      }
    }

    if (errorCount === 0) {
      setSaveMessage({
        type: 'success',
        text: `✅ ${savedCount} ejercicio(s) guardado(s) exitosamente en Contenidos`
      });
    } else {
      setSaveMessage({
        type: 'error',
        text: `⚠️ Guardados: ${savedCount} | Errores: ${errorCount}`
      });
    }

    setTimeout(() => setSaveMessage(null), 5000);
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
      {/* Mensajes de feedback */}
      {saveMessage && (
        <BaseAlert
          variant={saveMessage.type === 'success' ? 'success' : 'error'}
          onClose={() => setSaveMessage(null)}
        >
          {saveMessage.text}
        </BaseAlert>
      )}

      {/* Info colapsable */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
        >
          <Info size={18} />
          <span className="font-medium">Información sobre generación con IA</span>
          {showInfo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {showInfo && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            El sistema analiza el texto y crea ejercicios adaptados al nivel CEFR seleccionado.
            Si tienes un proveedor de IA configurado (OpenAI, Claude, etc.), lo usará automáticamente.
            De lo contrario, usará generación basada en reglas.
          </p>
        </div>
      )}

      {/* Área de texto fuente */}
      <UniversalCard variant="default" size="md" title="Texto Fuente">
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
      <UniversalCard variant="default" size="md" title="Configuración de Generación">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tipo de ejercicio - DROPDOWN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Ejercicio
            </label>
            <div className="relative">
              <select
                value={exerciseType}
                onChange={(e) => setExerciseType(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer"
              >
                {exerciseTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {exerciseTypes.find(t => t.value === exerciseType)?.description}
            </p>
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

      {/* Botones de acción */}
      <div className="flex gap-3">
        <BaseButton
          variant="primary"
          icon={Sparkles}
          onClick={handleGenerate}
          disabled={!sourceText.trim() || generating}
          fullWidth
        >
          {generating ? 'Generando con IA...' : `Crear ${quantity} Ejercicio${quantity > 1 ? 's' : ''} con IA`}
        </BaseButton>

        {generatedExercises.length > 0 && (
          <>
            <BaseButton
              variant="outline"
              icon={Eye}
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Ocultar' : 'Ver'} ({generatedExercises.length})
            </BaseButton>
            <BaseButton
              variant="success"
              icon={Save}
              onClick={handleSaveToContents}
            >
              Guardar en Contenidos
            </BaseButton>
            <BaseButton variant="ghost" icon={Download} onClick={handleExport}>
              Exportar JSON
            </BaseButton>
          </>
        )}
      </div>

      {/* Preview de ejercicios generados */}
      {showPreview && generatedExercises.length > 0 && (
        <UniversalCard variant="default" size="md" title={`${generatedExercises.length} Ejercicio(s) Generado(s)`}>
          <div className="space-y-4">
            {generatedExercises.map((exercise, idx) => (
              <div
                key={exercise.id || idx}
                className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CategoryBadge
                      type="exercise"
                      value={exercise.type}
                    />
                    <CategoryBadge type="cefr" value={exercise.cefrLevel || cefrLevel} />
                  </div>
                  <BaseButton
                    variant="outline"
                    icon={Edit3}
                    size="sm"
                    onClick={() => handleEditExercise(exercise)}
                  >
                    Editar
                  </BaseButton>
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
                      Respuesta: {exercise.correctAnswer?.[0] || exercise.correctAnswer}
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

                {/* Match Preview */}
                {exercise.type === 'match' && (
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      {exercise.title || 'Ejercicio de Emparejar'}
                    </p>
                    <div className="space-y-1">
                      {exercise.pairs?.slice(0, 3).map((pair, i) => (
                        <div key={i} className="text-sm text-gray-600 dark:text-gray-400">
                          • {pair.left} → {pair.right}
                        </div>
                      ))}
                      {exercise.pairs?.length > 3 && (
                        <p className="text-xs text-gray-500">... y {exercise.pairs.length - 3} más</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Cloze Preview */}
                {exercise.type === 'cloze' && (
                  <div>
                    <p className="text-gray-900 dark:text-white mb-2">
                      {exercise.text?.substring(0, 100)}...
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Respuestas: {exercise.correctAnswers?.join(', ')}
                    </p>
                  </div>
                )}

                {/* Otros tipos - Preview genérico */}
                {!['mcq', 'blank', 'truefalse', 'match', 'cloze'].includes(exercise.type) && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {exercise.title || exercise.instruction || exercise.question || 'Ejercicio generado'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Tipo: {exerciseTypes.find(t => t.value === exercise.type)?.label || exercise.type}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </UniversalCard>
      )}

      {/* Modal de edición */}
      {editingExercise && (
        <ExerciseEditorModal
          exercise={editingExercise}
          isOpen={!!editingExercise}
          onClose={() => setEditingExercise(null)}
          onSave={handleSaveExercise}
        />
      )}
    </div>
  );
}

export default AIExerciseGenerator;
