/**
 * @fileoverview Content Manager Tabs - Gestión de contenidos con pestañas
 * Incluye: Contenidos, Exercise Builder, Configurar IA, FlashCards, Libro ADE 1, Visor de Contenidos
 * @module components/ContentManagerTabs
 */

import { useState } from 'react';
import { Layers, Sparkles, Lightbulb, BookOpen, Edit3, CreditCard } from 'lucide-react';
import UnifiedContentManager from './UnifiedContentManager';
import ExerciseBuilder from '../pages/ExerciseBuilder';
import AIConfigPanel from './AIConfigPanel';
import InteractiveBookViewer from './InteractiveBookViewer';
import ContentReader from './ContentReader';
import FlashCardManager from './FlashCardManager';
import { usePermissions } from '../hooks/usePermissions';
import './ContentManagerTabs.css';

/**
 * Definición de las pestañas
 */
const TABS = [
  {
    id: 'content',
    label: 'Contenidos',
    icon: Layers,
    permission: 'create-content',
  },
  {
    id: 'exercise-builder',
    label: 'Exercise Builder',
    icon: Sparkles,
    permission: 'use-exercise-builder',
  },
  {
    id: 'ai-config',
    label: 'Configurar IA',
    icon: Lightbulb,
    permission: 'configure-ai',
  },
  {
    id: 'flashcards',
    label: 'FlashCards',
    icon: CreditCard,
    permission: 'create-content', // Mismo permiso que contenidos
  },
  {
    id: 'libro-ade1',
    label: 'Libro ADE 1',
    icon: BookOpen,
    permission: 'create-content', // Mismo permiso que contenidos
  },
  {
    id: 'visor-contenidos',
    label: 'Visor de Contenidos',
    icon: Edit3,
    permission: 'create-content', // Mismo permiso que contenidos
  },
];

/**
 * Content Manager con pestañas
 * @param {Object} props
 * @param {Object} props.user - Usuario actual
 * @param {string} props.userRole - Rol del usuario
 */
export function ContentManagerTabs({ user, userRole }) {
  const { can } = usePermissions();
  const [activeTab, setActiveTab] = useState('content');

  // Filtrar tabs según permisos
  const visibleTabs = TABS.filter(tab => {
    if (!tab.permission) return true;
    return can(tab.permission);
  });

  // Si solo hay una tab visible, establecerla como activa
  if (visibleTabs.length === 1 && activeTab !== visibleTabs[0].id) {
    setActiveTab(visibleTabs[0].id);
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'content':
        return <UnifiedContentManager user={user} userRole={userRole} />;
      case 'exercise-builder':
        return <ExerciseBuilder />;
      case 'ai-config':
        return <AIConfigPanel />;
      case 'flashcards':
        return <FlashCardManager user={user} />;
      case 'libro-ade1':
        return <InteractiveBookViewer />;
      case 'visor-contenidos':
        return (
          <ContentReader
            contentId="demo-content"
            initialContent="<h1>Visor de Contenidos</h1><p>Este es el visor de contenidos con herramientas avanzadas de anotación.</p><p>Utiliza las herramientas de la barra lateral para:</p><ul><li>Resaltar texto</li><li>Dibujar y escribir</li><li>Agregar notas adhesivas</li><li>Insertar texto flotante</li></ul>"
            userId={user?.uid}
            readOnly={false}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="content-manager-tabs">
      {/* Tab Navigation */}
      {visibleTabs.length > 1 && (
        <div className="content-manager-tabs__nav">
          {visibleTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                className={`content-manager-tabs__tab ${
                  isActive ? 'content-manager-tabs__tab--active' : ''
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={18} className="content-manager-tabs__tab-icon" />
                <span className="content-manager-tabs__tab-label">{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Tab Content */}
      <div className="content-manager-tabs__content">
        {renderTabContent()}
      </div>
    </div>
  );
}

export default ContentManagerTabs;
