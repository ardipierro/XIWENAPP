/**
 * @fileoverview Pestaña de Configuración Avanzada - Agrupa Credenciales IA, Configurar IA, Caché de Audio y Landing Page
 * @module components/settings/AdvancedTab
 */

import { useState } from 'react';
import { Key, Database, Home, Lightbulb, Save } from 'lucide-react';
import BaseTabs from '../common/BaseTabs';
import CredentialsTab from './CredentialsTab';
import AudioCacheTab from './AudioCacheTab';
import LandingPageTab from './LandingPageTab';
import ConfigBackupTab from './ConfigBackupTab';
import AIConfigPanel from '../AIConfigPanel';

function AdvancedTab() {
  const [activeSubTab, setActiveSubTab] = useState('credentials');

  const subTabs = [
    { id: 'credentials', label: 'Credenciales IA', icon: Key },
    { id: 'ai-config', label: 'Configurar IA', icon: Lightbulb },
    { id: 'backup', label: 'Backup Configuraciones', icon: Save },
    { id: 'cache', label: 'Caché de Audio', icon: Database },
    { id: 'landing', label: 'Landing Page', icon: Home }
  ];

  return (
    <div className="w-full">
      {/* Sub-pestañas */}
      <div className="mb-6">
        <BaseTabs
          tabs={subTabs}
          activeTab={activeSubTab}
          onChange={setActiveSubTab}
          variant="underline"
          size="md"
        />
      </div>

      {/* Contenido de sub-pestañas */}
      <div className="w-full">
        {activeSubTab === 'credentials' && (
          <div className="w-full">
            <CredentialsTab />
          </div>
        )}

        {activeSubTab === 'ai-config' && (
          <div className="w-full">
            <AIConfigPanel />
          </div>
        )}

        {activeSubTab === 'backup' && (
          <div className="w-full">
            <ConfigBackupTab />
          </div>
        )}

        {activeSubTab === 'cache' && (
          <div className="w-full">
            <AudioCacheTab />
          </div>
        )}

        {activeSubTab === 'landing' && (
          <div className="w-full">
            <LandingPageTab />
          </div>
        )}
      </div>
    </div>
  );
}

export default AdvancedTab;
