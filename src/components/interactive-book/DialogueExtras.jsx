/**
 * @fileoverview Sistema de tabs para extras de diálogo (Audio, Traducción, Vocabulario, Ejercicio)
 * @module components/interactive-book/DialogueExtras
 */

import { useState } from 'react';
import { Volume2, Languages, BookOpen, HelpCircle } from 'lucide-react';
import PropTypes from 'prop-types';
import AudioPlayer from './AudioPlayer';
import FillInBlankExercise from './FillInBlankExercise';
import MultipleChoiceExercise from './MultipleChoiceExercise';

/**
 * Componente de tabs para mostrar extras de una línea de diálogo
 * Solo un tab activo a la vez - sin overlapping
 */
function DialogueExtras({
  audioUrl,
  text,
  voiceConfig,
  characterName,
  characters,
  translation,
  notes,
  exercise,
  onExerciseComplete
}) {
  // Determinar qué tabs están disponibles
  const availableTabs = [];

  if (audioUrl) {
    availableTabs.push({
      id: 'audio',
      label: 'Audio',
      icon: Volume2,
      color: 'blue'
    });
  }

  if (translation) {
    availableTabs.push({
      id: 'translation',
      label: 'Traducción',
      icon: Languages,
      color: 'amber'
    });
  }

  if (notes && notes.length > 0) {
    availableTabs.push({
      id: 'vocabulary',
      label: 'Vocabulario',
      icon: BookOpen,
      color: 'purple'
    });
  }

  if (exercise) {
    availableTabs.push({
      id: 'exercise',
      label: 'Ejercicio',
      icon: HelpCircle,
      color: 'green'
    });
  }

  // Tab activo por defecto: el primero disponible
  const [activeTab, setActiveTab] = useState(availableTabs[0]?.id || 'audio');

  if (availableTabs.length === 0) {
    return null;
  }

  // Renderizar contenido del tab activo
  const renderTabContent = () => {
    switch (activeTab) {
      case 'audio':
        return (
          <div className="pb-6">
            <AudioPlayer
              audioUrl={audioUrl}
              text={text}
              voiceConfig={voiceConfig}
              characterName={characterName}
              characters={characters}
              showText={false}
              className="text-xs"
            />
          </div>
        );

      case 'translation':
        return (
          <div className="bg-amber-50 dark:bg-amber-900/30 border-2 border-amber-300 dark:border-amber-700 rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <Languages size={24} className="text-amber-600 dark:text-amber-400" />
              <h3 className="text-lg font-bold text-amber-900 dark:text-amber-100">
                Traducción al Chino
              </h3>
            </div>
            <div className="text-base text-amber-900 dark:text-amber-200 leading-relaxed">
              {translation}
            </div>
          </div>
        );

      case 'vocabulary':
        return (
          <div className="bg-purple-50 dark:bg-purple-900/30 border-2 border-purple-300 dark:border-purple-700 rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <BookOpen size={24} className="text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-bold text-purple-900 dark:text-purple-100">
                Vocabulario ({notes.length})
              </h3>
            </div>
            <div className="space-y-4">
              {notes.map((note, idx) => (
                <div key={idx} className="p-4 bg-white dark:bg-purple-900/30 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="text-base font-bold text-purple-900 dark:text-purple-200 mb-2">
                    {note.word}
                  </div>
                  <div className="text-sm text-purple-800 dark:text-purple-300">
                    {note.definition}
                  </div>
                  {note.rioplatenseNote && (
                    <div className="text-sm text-purple-700 dark:text-purple-400 mt-3 flex items-start gap-2 p-2 bg-purple-100 dark:bg-purple-900/40 rounded">
                      <span className="text-lg flex-shrink-0">🇦🇷</span>
                      <span>{note.rioplatenseNote}</span>
                    </div>
                  )}
                  {note.example && (
                    <div className="text-sm text-purple-600 dark:text-purple-400 mt-2 italic">
                      Ej: {note.example}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'exercise':
        return (
          <div className="bg-green-50 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-700 rounded-xl p-6 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <HelpCircle size={24} className="text-green-600 dark:text-green-400" />
              <h3 className="text-lg font-bold text-green-900 dark:text-green-100">
                Ejercicio Interactivo
              </h3>
            </div>
            {exercise.type === 'fill_in_blank' && (
              <FillInBlankExercise
                exercise={exercise}
                onComplete={(result) => onExerciseComplete(exercise.exerciseId, result)}
              />
            )}
            {exercise.type === 'multiple_choice' && (
              <MultipleChoiceExercise
                exercise={exercise}
                onComplete={(result) => onExerciseComplete(exercise.exerciseId, result)}
              />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mt-4 mb-8 w-full">
      {/* Tabs horizontales */}
      <div className="flex gap-2 mb-4">
        {availableTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          // Colores según el tab
          const colorClasses = {
            blue: {
              active: 'bg-blue-500 text-white border-blue-600',
              inactive: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-gray-300 dark:border-gray-600'
            },
            amber: {
              active: 'bg-amber-500 text-white border-amber-600',
              inactive: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-900/20 border-gray-300 dark:border-gray-600'
            },
            purple: {
              active: 'bg-purple-500 text-white border-purple-600',
              inactive: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20 border-gray-300 dark:border-gray-600'
            },
            green: {
              active: 'bg-green-500 text-white border-green-600',
              inactive: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20 border-gray-300 dark:border-gray-600'
            }
          };

          const classes = isActive
            ? colorClasses[tab.color].active
            : colorClasses[tab.color].inactive;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all border-2 ${classes} ${
                isActive ? 'shadow-md transform scale-105' : ''
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Contenido del tab activo */}
      <div className="animate-in fade-in-50 duration-200">
        {renderTabContent()}
      </div>
    </div>
  );
}

DialogueExtras.propTypes = {
  audioUrl: PropTypes.string,
  text: PropTypes.string,
  voiceConfig: PropTypes.object,
  characterName: PropTypes.string,
  characters: PropTypes.array,
  translation: PropTypes.string,
  notes: PropTypes.arrayOf(
    PropTypes.shape({
      word: PropTypes.string.isRequired,
      definition: PropTypes.string.isRequired,
      example: PropTypes.string,
      rioplatenseNote: PropTypes.string
    })
  ),
  exercise: PropTypes.object,
  onExerciseComplete: PropTypes.func
};

export default DialogueExtras;
