/**
 * @fileoverview Panel de Configuración reorganizado en 3 pestañas principales
 * - General: Idioma, notificaciones, cuenta
 * - Diseño y Apariencia: Temas, fuentes, badges, card system
 * - Avanzado: Credenciales IA, caché de audio, landing page
 * @module components/SettingsPanel
 */

import { useState } from 'react';
import { Settings, Palette, Wrench } from 'lucide-react';
import PageHeader from './common/PageHeader';
import BaseTabs from './common/BaseTabs';
import DesignTab from './settings/DesignTab';
import AdvancedTab from './settings/AdvancedTab';

function SettingsPanel() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'design', label: 'Diseño y Apariencia', icon: Palette },
    { id: 'advanced', label: 'Avanzado', icon: Wrench }
  ];

  return (
    <div className="w-full">
      <PageHeader
        icon={Settings}
        title="Configuración"
      />

      {/* Tabs - Migrado a BaseTabs para consistencia */}
      <div className="mb-6">
        <BaseTabs
          tabs={tabs}
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="underline"
          size="md"
        />
      </div>

      {/* Tab Content */}
      <div className="w-full">
        {activeTab === 'general' && (
          <div className="w-full space-y-8">
            {/* Idioma y Región */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Idioma y Región</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Idioma de la interfaz</label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    <option>Español</option>
                    <option>English</option>
                    <option>中文</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Separador */}
            <div className="border-t border-gray-200 dark:border-gray-700"></div>

            {/* Notificaciones */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notificaciones</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Notificaciones por email</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Recibe actualizaciones importantes</div>
                  </div>
                  <input type="checkbox" className="w-5 h-5" defaultChecked />
                </div>
              </div>
            </div>

            {/* Separador */}
            <div className="border-t border-gray-200 dark:border-gray-700"></div>

            {/* Cuenta */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cuenta</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nombre completo</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="Tu nombre" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'design' && (
          <div className="w-full">
            <DesignTab />
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="w-full">
            <AdvancedTab />
          </div>
        )}
      </div>
    </div>
  );
}

export default SettingsPanel;
