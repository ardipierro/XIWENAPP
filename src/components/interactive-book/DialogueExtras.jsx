/**
 * @fileoverview Sistema de tabs para extras de diálogo - RECREADO DESDE CERO
 * @module components/interactive-book/DialogueExtras
 */

import { useState } from 'react';
import { Volume2, Languages, BookOpen, HelpCircle } from 'lucide-react';
import PropTypes from 'prop-types';
import AudioPlayer from './AudioPlayer';
import FillInBlankExercise from './FillInBlankExercise';
import MultipleChoiceExercise from './MultipleChoiceExercise';

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
  // Determinar tabs disponibles
  const tabs = [];

  if (audioUrl) {
    tabs.push({ id: 'audio', label: 'Audio', icon: Volume2, color: 'blue' });
  }
  if (translation) {
    tabs.push({ id: 'translation', label: 'Traducción', icon: Languages, color: 'amber' });
  }
  if (notes && notes.length > 0) {
    tabs.push({ id: 'vocabulary', label: 'Vocabulario', icon: BookOpen, color: 'purple' });
  }
  if (exercise) {
    tabs.push({ id: 'exercise', label: 'Ejercicio', icon: HelpCircle, color: 'green' });
  }

  const [activeTab, setActiveTab] = useState(tabs[0]?.id || 'audio');

  if (tabs.length === 0) return null;

  // Estilos de tabs
  const tabColors = {
    blue: {
      active: 'bg-blue-500 text-white border-blue-600',
      inactive: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/20'
    },
    amber: {
      active: 'bg-amber-500 text-white border-amber-600',
      inactive: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-amber-900/20'
    },
    purple: {
      active: 'bg-purple-500 text-white border-purple-600',
      inactive: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-purple-900/20'
    },
    green: {
      active: 'bg-green-500 text-white border-green-600',
      inactive: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-green-900/20'
    }
  };

  return (
    <div className="mt-4 w-full space-y-4">
      {/* Tabs horizontales */}
      <div className="flex gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const colorClass = isActive ? tabColors[tab.color].active : tabColors[tab.color].inactive;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all border-2 ${colorClass} ${
                isActive ? 'shadow-md scale-105' : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Contenido - TODOS con mismo wrapper p-6 */}
      <div className="animate-in fade-in duration-200">
        {activeTab === 'audio' && (
          <div className="mb-[104px]">
            <AudioPlayer
              audioUrl={audioUrl}
              text={text}
              voiceConfig={voiceConfig}
              characterName={characterName}
              characters={characters}
              showText={false}
            />
          </div>
        )}

        {activeTab === 'translation' && (
          <div className="rounded-xl p-6 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-200 dark:border-amber-700">
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
        )}

        {activeTab === 'vocabulary' && (
          <div className="rounded-xl p-6 bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-700">
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
                      <span className="text-lg">🇦🇷</span>
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
        )}

        {activeTab === 'exercise' && (
          <div className="rounded-xl p-6 bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-700">
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
        )}
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
  notes: PropTypes.array,
  exercise: PropTypes.object,
  onExerciseComplete: PropTypes.func
};

export default DialogueExtras;
