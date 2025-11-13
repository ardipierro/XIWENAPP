/**
 * @fileoverview Panel de Configuración con 5 pestañas
 * @module components/SettingsPanel
 */

import { useState } from 'react';
import { Settings, Key, Bell, User, Globe, Palette } from 'lucide-react';
import PageHeader from './common/PageHeader';
import CredentialsTab from './settings/CredentialsTab';
import ThemeCustomizer from './ThemeCustomizer';
import { BaseCard } from './common';

function SettingsPanel() {
  const [activeTab, setActiveTab] = useState('credentials');

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'theme', label: 'Temas', icon: Palette },
    { id: 'credentials', label: 'Credenciales IA', icon: Key },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'account', label: 'Cuenta', icon: User }
  ];

  return (
    <div className="w-full">
      <PageHeader
        icon={Settings}
        title="Configuración"
        description="Administra la configuración de tu cuenta y de la aplicación"
      />

      {/* Tabs */}
      <div className="w-full border-b border-gray-200 dark:border-gray-700 mb-8">
        <div className="flex gap-1 flex-wrap -mb-px">
          {tabs.map(tab => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 text-sm md:text-base font-medium whitespace-nowrap transition-all border-b-2 rounded-t-lg ${
                  isActive
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/20'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <TabIcon size={20} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content - TODO FULL WIDTH */}
      <div className="w-full">
        {activeTab === 'general' && (
          <div className="w-full space-y-6">
            <BaseCard className="p-6 w-full">
              <div className="flex items-center gap-3 mb-4">
                <Globe size={24} className="dark:text-purple-400" style={{ color: 'var(--color-accent)' }} />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white m-0">Idioma y Región</h3>
              </div>
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
            </BaseCard>
          </div>
        )}

        {activeTab === 'theme' && (
          <div className="w-full">
            <ThemeCustomizer />
          </div>
        )}

        {activeTab === 'credentials' && (
          <div className="w-full">
            <CredentialsTab />
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="w-full space-y-6">
            <BaseCard className="p-6 w-full">
              <div className="flex items-center gap-3 mb-4">
                <Bell size={24} className="dark:text-purple-400" style={{ color: 'var(--color-accent)' }} />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white m-0">Notificaciones</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Notificaciones por email</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Recibe actualizaciones importantes</div>
                  </div>
                  <input type="checkbox" className="w-5 h-5" defaultChecked />
                </div>
              </div>
            </BaseCard>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="w-full space-y-6">
            <BaseCard className="p-6 w-full">
              <div className="flex items-center gap-3 mb-4">
                <User size={24} className="dark:text-purple-400" style={{ color: 'var(--color-accent)' }} />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white m-0">Cuenta</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nombre completo</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="Tu nombre" />
                </div>
              </div>
            </BaseCard>
          </div>
        )}
      </div>
    </div>
  );
}

export default SettingsPanel;
