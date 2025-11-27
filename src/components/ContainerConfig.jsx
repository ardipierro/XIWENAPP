/**
 * @fileoverview Container Config - Panel principal de configuración de wrappers
 * @module components/ContainerConfig
 */

import { useState } from 'react';
import { Box, CheckSquare, Move, Edit3, HelpCircle, MessageSquare, Table2, MessageCircle, ListChecks } from 'lucide-react';
import { BaseBadge } from './common';
import WordHighlightConfig from './container/WordHighlightConfig';
import DragDropConfig from './container/DragDropConfig';
import FillBlanksConfig from './container/FillBlanksConfig';
import OpenQuestionsConfig from './container/OpenQuestionsConfig';
import InfoTableConfig from './container/InfoTableConfig';
import DialoguesConfig from './container/DialoguesConfig';
import MultipleChoiceConfig from './container/MultipleChoiceConfig';
import logger from '../utils/logger';

/**
 * Tabs disponibles para configurar diferentes tipos de ejercicios
 */
const CONTAINER_TABS = [
  {
    id: 'word-highlight',
    label: 'Marcar Palabras',
    icon: CheckSquare,
    description: 'Ejercicios de identificación de palabras (verbos, sustantivos, etc.). Usa *palabra* para marcar objetivos.',
    component: WordHighlightConfig,
    available: true
  },
  {
    id: 'drag-drop',
    label: 'Drag & Drop',
    icon: Move,
    description: 'Ejercicios de arrastrar y soltar. Las palabras entre *asteriscos* se convierten en elementos arrastrables.',
    component: DragDropConfig,
    available: true
  },
  {
    id: 'fill-blank',
    label: 'Llenar Palabras',
    icon: Edit3,
    description: 'Ejercicios de completar espacios. Las palabras entre *asteriscos* se convierten en campos de texto.',
    component: FillBlanksConfig,
    available: true
  },
  {
    id: 'open-questions',
    label: 'Respuesta Libre',
    icon: MessageSquare,
    description: 'Preguntas abiertas con textarea para respuestas completas. Ideal para contrarios, transformaciones, traducciones. Detecta #RESPUESTA_LIBRE o líneas numeradas.',
    component: OpenQuestionsConfig,
    available: true
  },
  {
    id: 'info-table',
    label: 'Cuadro Informativo',
    icon: Table2,
    description: 'Tablas explicativas interactivas para gramática, conjugaciones, vocabulario. Usa #TABLA_INFO con columnas separadas por |',
    component: InfoTableConfig,
    available: true
  },
  {
    id: 'dialogues',
    label: 'Diálogos',
    icon: MessageCircle,
    description: 'Diálogos interactivos estilo chat. Usa #DIALOGO con formato "Personaje: texto". Las palabras entre *asteriscos* se convierten en blancos.',
    component: DialoguesConfig,
    available: true
  },
  {
    id: 'multiple-choice',
    label: 'Opción Múltiple',
    icon: ListChecks,
    description: 'Preguntas con opciones de respuesta. Soporta una o múltiples respuestas correctas. Usa *opción para marcar correctas y :: para explicaciones.',
    component: MultipleChoiceConfig,
    available: true
  }
];

/**
 * Panel principal de configuración de contenedores/wrappers
 */
function ContainerConfig({ onBack }) {
  const [activeTab, setActiveTab] = useState('word-highlight');

  const currentTab = CONTAINER_TABS.find(tab => tab.id === activeTab);
  const ActiveComponent = currentTab?.component;

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Box className="w-6 h-6" style={{ color: 'var(--color-primary)' }} />
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            Configuración de Contenedores
          </h2>
        </div>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Configura el comportamiento y estilo de diferentes tipos de ejercicios interactivos
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b mb-6" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex gap-1 overflow-x-auto">
          {CONTAINER_TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => tab.available && setActiveTab(tab.id)}
                disabled={!tab.available}
                className={`
                  flex items-center gap-2 px-4 py-3 border-b-2 transition-all
                  ${isActive
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                    : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }
                  ${!tab.available && 'opacity-50 cursor-not-allowed'}
                `}
                style={{
                  color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  borderBottomColor: isActive ? 'var(--color-primary)' : 'transparent'
                }}
              >
                <Icon size={18} />
                <span className="font-medium whitespace-nowrap">{tab.label}</span>
                {!tab.available && (
                  <BaseBadge variant="default" size="sm">Próximamente</BaseBadge>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab description */}
      <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
          {currentTab?.description}
        </p>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {ActiveComponent ? (
          <ActiveComponent
            onSave={(config) => {
              logger.info(`Config saved for ${activeTab}:`, config);
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="text-6xl mb-4">🚧</div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Próximamente
            </h3>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Este tipo de ejercicio estará disponible pronto
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ContainerConfig;
