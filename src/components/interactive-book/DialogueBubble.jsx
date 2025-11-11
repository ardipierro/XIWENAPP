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

/**
 * Componente de burbuja de diálogo estilo WhatsApp/iMessage
 */
function DialogueBubble({ line, index, totalLines, characters = [], onExerciseComplete, viewSettings }) {
  const [showExtras, setShowExtras] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);

  // Aplicar configuraciones de vista
  const settings = viewSettings || {
    bubbleStyle: 'rounded',
    colorScheme: 'default',
    fontSize: 'medium',
    spacing: 'comfortable',
    showAvatars: true,
    showBadges: true
  };

  // Obtener la voz del personaje
  const character = characters.find(c => c.id === line.character);
  const characterVoice = character?.voice || null;

  // Alternar entre derecha (par) e izquierda (impar) basado en el personaje
  const isRight = index % 2 === 0;
  const hasExtras = line.notes?.length > 0 || line.translation || line.audioUrl;
  const hasExercise = line.interactiveType && line.exercise;

  // Funciones para obtener clases según configuración
  const getBubbleStyleClass = () => {
    switch (settings.bubbleStyle) {
      case 'sharp': return 'rounded-none';
      case 'pill': return 'rounded-full';
      default: return 'rounded-2xl';
    }
  };

  const getFontSizeClass = () => {
    switch (settings.fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      default: return 'text-base';
    }
  };

  // Colores por personaje según esquema seleccionado
  const getCharacterColor = (character) => {
    const colorSchemes = {
      default: {
        'mozo': 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
        'sofia': 'bg-pink-100 dark:bg-pink-900/30 border-pink-300 dark:border-pink-700',
        'andres': 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700',
        'default': 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700'
      },
      minimal: {
        'mozo': 'bg-gray-200 dark:bg-gray-700 border-gray-400 dark:border-gray-600',
        'sofia': 'bg-gray-300 dark:bg-gray-600 border-gray-500 dark:border-gray-500',
        'andres': 'bg-gray-400 dark:bg-gray-500 border-gray-600 dark:border-gray-400',
        'default': 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700'
      },
      vibrant: {
        'mozo': 'bg-blue-200 dark:bg-blue-800/50 border-blue-400 dark:border-blue-600',
        'sofia': 'bg-pink-200 dark:bg-pink-800/50 border-pink-400 dark:border-pink-600',
        'andres': 'bg-green-200 dark:bg-green-800/50 border-green-400 dark:border-green-600',
        'default': 'bg-purple-200 dark:bg-purple-800/50 border-purple-400 dark:border-purple-600'
      },
      pastel: {
        'mozo': 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
        'sofia': 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800',
        'andres': 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
        'default': 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
      }
    };

    const scheme = colorSchemes[settings.colorScheme] || colorSchemes.default;
    return scheme[character.toLowerCase()] || scheme.default;
  };

  const bubbleColor = getCharacterColor(line.character);

  const bubbleStyleClass = getBubbleStyleClass();
  const cornerClass = settings.bubbleStyle !== 'pill'
    ? (isRight ? 'rounded-tr-none' : 'rounded-tl-none')
    : '';

  return (
    <div className={`flex gap-3 mb-4 ${isRight ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* Avatar */}
      {settings.showAvatars && (
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-md">
            <User size={24} className="text-gray-700 dark:text-gray-300" />
          </div>
        </div>
      )}

      {/* Burbuja de diálogo */}
      <div className={`flex-1 max-w-[75%] ${isRight ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Nombre del personaje */}
        <div className={`text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1 px-2 ${isRight ? 'text-right' : 'text-left'}`}>
          {line.character}
        </div>

        {/* Burbuja principal */}
        <div className={`relative ${bubbleStyleClass} ${cornerClass} border-2 ${bubbleColor} px-4 py-3 shadow-sm`}>
          {/* Texto del diálogo */}
          <p className={`${getFontSizeClass()} text-gray-900 dark:text-white leading-relaxed`}>
            {line.text}
          </p>

          {/* Badges de interacción */}
          {settings.showBadges && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {line.audioUrl && (
                <BaseBadge variant="info" size="sm">
                  <Volume2 size={10} className="mr-1" />
                  Audio
                </BaseBadge>
              )}
              {line.translation && (
                <BaseBadge variant="default" size="sm">
                  <Languages size={10} className="mr-1" />
                  中文
                </BaseBadge>
              )}
              {hasExercise && (
                <BaseBadge variant="success" size="sm">
                  <HelpCircle size={10} className="mr-1" />
                  Ejercicio
                </BaseBadge>
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

        {/* Panel expandible con extras */}
        {showExtras && (
          <div className="mt-3 w-full space-y-3 animate-in slide-in-from-top-2 duration-200">
            {/* Audio Player */}
            {line.audioUrl && (
              <AudioPlayer
                audioUrl={line.audioUrl}
                text={line.text}
                voice={characterVoice}
                showText={false}
                className="text-xs"
              />
            )}

            {/* Traducción */}
            {line.translation && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <button
                  onClick={() => setShowTranslation(!showTranslation)}
                  className="w-full flex items-center justify-between text-sm font-medium text-amber-900 dark:text-amber-100"
                >
                  <span className="flex items-center gap-2">
                    <Languages size={14} />
                    Traducción al chino
                  </span>
                  {showTranslation ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {showTranslation && (
                  <p className="mt-2 text-sm text-amber-800 dark:text-amber-200">
                    {line.translation}
                  </p>
                )}
              </div>
            )}

            {/* Notas */}
            {line.notes && line.notes.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  📝 Notas y vocabulario
                </div>
                {line.notes.map((note, idx) => (
                  <div
                    key={idx}
                    className="p-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded text-xs"
                  >
                    <span className="font-semibold text-purple-900 dark:text-purple-200">
                      {note.word}:
                    </span>{' '}
                    <span className="text-purple-800 dark:text-purple-300">
                      {note.definition}
                    </span>
                    {note.rioplatenseNote && (
                      <div className="mt-1 text-purple-700 dark:text-purple-400">
                        🇦🇷 {note.rioplatenseNote}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Ejercicio interactivo */}
            {hasExercise && (
              <div className="border-t-2 border-dashed border-gray-300 dark:border-gray-700 pt-3">
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
