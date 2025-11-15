/**
 * @fileoverview Content Manager Tabs - Gestión de contenidos con pestañas
 * Incluye: Contenidos, Exercise Builder, Configurar IA
 * @module components/ContentManagerTabs
 */

import { useState } from 'react';
import { Layers, Sparkles, Lightbulb } from 'lucide-react';
import UnifiedContentManager from './UnifiedContentManager';
import ExerciseBuilder from '../pages/ExerciseBuilder';
import AIConfigPanel from './AIConfigPanel';
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
