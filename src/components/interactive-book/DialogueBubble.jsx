/**
 * @fileoverview Burbuja de diálogo estilo chat
 * @module components/interactive-book/DialogueBubble
 */

import { useState } from 'react';
import { User, ChevronDown, ChevronUp, Volume2, HelpCircle, Languages } from 'lucide-react';
import PropTypes from 'prop-types';
import AudioPlayer from './AudioPlayer';
import FillInBlankExercise from './FillInBlankExercise';
import MultipleChoiceExercise from './MultipleChoiceExercise';
import { BaseBadge } from '../common';
import { getCharacterVoiceConfig } from './CharacterVoiceManager';

/**
 * Componente de burbuja de diálogo estilo WhatsApp/iMessage
 */
function DialogueBubble({ line, index, totalLines, characters = [], onExerciseComplete, viewSettings }) {
  const [showExtras, setShowExtras] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showVocabulary, setShowVocabulary] = useState(false);

  // Aplicar configuraciones de vista
  const settings = viewSettings || {
    bubbleStyle: 'rounded',
    colorScheme: 'default',
    fontSize: 'medium',
    spacing: 'comfortable',
    showAvatars: true,
    showBadges: true
  };

  // Obtener la voz del personaje desde su configuración
  const character = characters.find(c => c.id === line.character);
  const characterId = character?.id || line.character;
  const voiceConfig = getCharacterVoiceConfig(characterId);

  // Alternar entre derecha (par) e izquierda (impar) basado en el personaje
  const isRight = index % 2 === 0;
  const hasExtras = line.notes?.length > 0 || line.translation || line.audioUrl;
  const hasExercise = line.interactiveType && line.exercise;

  // ✅ Avatares SIEMPRE visibles (sin configuración)
  // Colores según personaje (hash simple del nombre)
  const getAvatarColor = (name) => {
    const colors = [
      'from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700',
      'from-purple-400 to-purple-600 dark:from-purple-500 dark:to-purple-700',
      'from-pink-400 to-pink-600 dark:from-pink-500 dark:to-pink-700',
      'from-green-400 to-green-600 dark:from-green-500 dark:to-green-700',
      'from-orange-400 to-orange-600 dark:from-orange-500 dark:to-orange-700',
      'from-teal-400 to-teal-600 dark:from-teal-500 dark:to-teal-700'
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <div className={`flex gap-4 mb-6 ${isRight ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar - SIEMPRE VISIBLE, colores por personaje */}
      <div className="flex-shrink-0">
        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getAvatarColor(line.character)} flex items-center justify-center border-3 border-white dark:border-gray-800 shadow-lg`}>
          <User size={32} className="text-white" />
        </div>
      </div>

      {/* Burbuja de diálogo */}
      <div className={`flex-1 max-w-[75%] ${isRight ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Nombre del personaje - AUMENTADO 50% */}
        <div className={`text-lg font-bold text-gray-900 dark:text-white mb-2 px-2 ${isRight ? 'text-right' : 'text-left'}`}>
          {line.character}
        </div>

        {/* Burbuja principal */}
        <div
          className={`relative ${isRight ? 'rounded-tr-none' : 'rounded-tl-none'}`}
          style={{
            backgroundColor: isRight ? 'var(--bubble-bg-right)' : 'var(--bubble-bg-left)',
            color: isRight ? 'var(--bubble-text-right)' : 'var(--bubble-text-left)',
            borderRadius: 'var(--bubble-border-radius)',
            borderWidth: 'var(--bubble-border-width)',
            borderStyle: 'var(--bubble-border-style)',
            borderColor: 'var(--bubble-border-color)',
            padding: 'var(--bubble-padding)',
            fontFamily: 'var(--book-font-family)',
            fontSize: 'var(--book-font-size)',
            lineHeight: 'var(--book-line-height)',
            fontWeight: 'var(--book-font-weight)',
            boxShadow: 'var(--card-shadow)'
          }}
        >
          {/* Texto del diálogo - AUMENTADO 25% con mínimo de 18px */}
          <p style={{
            margin: 0,
            fontSize: 'max(18px, var(--book-font-size))',
            lineHeight: 'var(--book-line-height, 1.6)',
            fontWeight: 'var(--book-font-weight, 400)'
          }}>
            {line.text}
          </p>

          {/* Badges de interacción - REDUCIDOS */}
          {settings.showBadges && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {line.audioUrl && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-[10px] font-medium">
                  <Volume2 size={10} />
                  Audio
                </span>
              )}
              {line.translation && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-[10px] font-medium">
                  <Languages size={10} />
                  中文
                </span>
              )}
              {hasExercise && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-[10px] font-medium">
                  <HelpCircle size={10} />
                  Ejercicio
                </span>
              )}
            </div>
          )}
        </div>

        {/* Botón para expandir extras */}
        {(hasExtras || hasExercise) && (
          <button
            onClick={() => setShowExtras(!showExtras)}
            className="mt-2 px-3 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full flex items-center gap-1 transition-colors"
          >
            {showExtras ? (
              <>
                <ChevronUp size={14} />
                Ocultar detalles
              </>
            ) : (
              <>
                <ChevronDown size={14} />
                Ver más
              </>
            )}
          </button>
        )}

        {/* Panel expandible con extras - Accordion con ESPACIO MAYOR */}
        {showExtras && (
          <div className="mt-4 w-full space-y-8 animate-in slide-in-from-top-2 duration-200">
            {/* Audio Player - SIEMPRE VISIBLE sin accordion */}
            {line.audioUrl && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-blue-200 dark:border-blue-800 p-4 shadow-sm">
                <AudioPlayer
                  audioUrl={line.audioUrl}
                  text={line.text}
                  voiceConfig={voiceConfig}
                  characterName={line.character}
                  characters={characters}
                  showText={false}
                  className="text-xs"
                />
              </div>
            )}

            {/* Traducción - Accordion */}
            {line.translation && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowTranslation(!showTranslation)}
                  className="w-full p-4 flex items-center justify-between hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
                >
                  <span className="flex items-center gap-3 text-base font-bold text-amber-900 dark:text-amber-100">
                    <Languages size={20} />
                    Traducción al Chino
                  </span>
                  {showTranslation ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {showTranslation && (
                  <div className="px-4 pb-4 text-base text-amber-900 dark:text-amber-200 leading-relaxed">
                    {line.translation}
                  </div>
                )}
              </div>
            )}

            {/* Vocabulario - Accordion */}
            {line.notes && line.notes.length > 0 && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowVocabulary(!showVocabulary)}
                  className="w-full p-4 flex items-center justify-between hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                >
                  <span className="flex items-center gap-3 text-base font-bold text-purple-900 dark:text-purple-100">
                    📝 Vocabulario ({line.notes.length})
                  </span>
                  {showVocabulary ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {showVocabulary && (
                  <div className="px-4 pb-4 space-y-3">
                    {line.notes.map((note, idx) => (
                      <div key={idx} className="p-3 bg-white dark:bg-purple-900/20 rounded-lg">
                        <div className="text-sm font-bold text-purple-900 dark:text-purple-200">
                          {note.word}
                        </div>
                        <div className="text-sm text-purple-800 dark:text-purple-300 mt-1">
                          {note.definition}
                        </div>
                        {note.rioplatenseNote && (
                          <div className="text-sm text-purple-700 dark:text-purple-400 mt-2 flex items-center gap-2">
                            <span className="text-base">🇦🇷</span>
                            {note.rioplatenseNote}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Ejercicio interactivo - Card destacado */}
            {hasExercise && (
              <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3 text-base font-bold text-green-900 dark:text-green-100">
                  <HelpCircle size={20} />
                  Ejercicio Interactivo
                </div>
                {line.exercise.type === 'fill_in_blank' && (
                  <FillInBlankExercise
                    exercise={line.exercise}
                    onComplete={(result) => onExerciseComplete(line.exercise.exerciseId, result)}
                  />
                )}
                {line.exercise.type === 'multiple_choice' && (
                  <MultipleChoiceExercise
                    exercise={line.exercise}
                    onComplete={(result) => onExerciseComplete(line.exercise.exerciseId, result)}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

DialogueBubble.propTypes = {
  line: PropTypes.shape({
    lineId: PropTypes.string.isRequired,
    character: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    translation: PropTypes.string,
    audioUrl: PropTypes.string,
    notes: PropTypes.array,
    interactiveType: PropTypes.string,
    exercise: PropTypes.object
  }).isRequired,
  index: PropTypes.number.isRequired,
  totalLines: PropTypes.number.isRequired,
  characters: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      voice: PropTypes.string
    })
  ),
  onExerciseComplete: PropTypes.func,
  viewSettings: PropTypes.shape({
    bubbleStyle: PropTypes.string,
    colorScheme: PropTypes.string,
    fontSize: PropTypes.string,
    spacing: PropTypes.string,
    showAvatars: PropTypes.bool,
    showBadges: PropTypes.bool
  })
};

export default DialogueBubble;
