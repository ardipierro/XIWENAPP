/**
 * @fileoverview Content Manager Tabs - Gestión de contenidos con pestañas
 * Migrado a PageHeader + BaseTabs para consistencia
 * @module components/ContentManagerTabs
 */

import { useState } from 'react';
import { Layers, Sparkles, Lightbulb, BookOpen, CreditCard, Package, Box } from 'lucide-react';
import PageHeader from './common/PageHeader';
import BaseTabs from './common/BaseTabs';
import UnifiedContentManager from './UnifiedContentManager';
import AIConfigPanel from './AIConfigPanel';
import ContainerConfig from './ContainerConfig';
import InteractiveBookViewer from './InteractiveBookViewer';
import SlidePackageGenerator from './SlidePackageGenerator';
import FlashCardManager from './FlashCardManager';
import { usePermissions } from '../hooks/usePermissions';

/**
 * Definición de las pestañas
 * NOTA: Exercise Builder ahora está integrado dentro de "Configurar IA"
 */
const TABS = [
  {
    id: 'content',
    label: 'Contenidos',
    icon: Layers,
    permission: 'create-content',
  },
  {
    id: 'ai-config',
    label: 'Configurar IA',
    icon: Lightbulb,
    permission: 'configure-ai',
  },
  {
    id: 'container',
    label: 'Contenedor',
    icon: Box,
    permission: 'create-content',
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
    id: 'slide-generator',
    label: 'Generador PPT ADE1',
    icon: Package,
    permission: 'create-content', // Mismo permiso que contenidos
  },
  // TEMPORALMENTE DESHABILITADO
  // {
  //   id: 'visor-contenidos',
  //   label: 'Visor de Contenidos',
  //   icon: Edit3,
  //   permission: 'create-content',
  // },
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
        return <UnifiedContentManager user={user} />;
      case 'ai-config':
        return <AIConfigPanel />;
      case 'container':
        return <ContainerConfig />;
      case 'flashcards':
        return <FlashCardManager user={user} />;
      case 'libro-ade1':
        return <InteractiveBookViewer />;
      case 'slide-generator':
        return <SlidePackageGenerator />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {/* Page Header */}
      <PageHeader
        icon={Layers}
        title="Gestión de Contenidos"
        description="Administra contenidos, ejercicios y material educativo"
      />

      {/* Tabs - Solo si hay múltiples tabs visibles */}
      {visibleTabs.length > 1 && (
        <div className="mb-6">
          <BaseTabs
            tabs={visibleTabs}
            activeTab={activeTab}
            onChange={setActiveTab}
            variant="underline"
            size="md"
          />
        </div>
      )}

      {/* Tab Content */}
      <div className="w-full">
        {renderTabContent()}
      </div>
    </div>
  );
}

export default ContentManagerTabs;
