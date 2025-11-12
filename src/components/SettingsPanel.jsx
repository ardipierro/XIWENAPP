/**
 * @fileoverview Panel de Configuración Principal con múltiples pestañas
 * @module components/SettingsPanel
 *
 * Panel centralizado de configuración que agrupa:
 * - General: Configuración básica de la aplicación
 * - Credenciales IA: API keys y configuración de proveedores
 * - Notificaciones: Preferencias de notificaciones
 * - Cuenta: Configuración de perfil y seguridad
 */

import { useState } from 'react';
import {
  Settings,
  Key,
  Bell,
  User,
  Shield,
  Globe,
  Palette
} from 'lucide-react';
import PageHeader from './common/PageHeader';
import CredentialsTab from './settings/CredentialsTab';
import { BaseCard } from './common';

/**
 * Panel principal de configuración con navegación por tabs
 */
function SettingsPanel() {
  const [activeTab, setActiveTab] = useState('credentials');

  // Definición de tabs
  const tabs = [
    {
      id: 'general',
      label: 'General',
      icon: Settings,
      description: 'Configuración básica de la aplicación'
    },
    {
      id: 'credentials',
      label: 'Credenciales IA',
      icon: Key,
      description: 'API keys y configuración de proveedores de IA'
    },
    {
      id: 'notifications',
      label: 'Notificaciones',
      icon: Bell,
      description: 'Preferencias de notificaciones'
    },
    {
      id: 'account',
      label: 'Cuenta',
      icon: User,
      description: 'Configuración de perfil y seguridad'
    }
  ];

  const activeTabData = tabs.find(t => t.id === activeTab);

  return (
    <div className="settings-panel">
      {/* Header */}
      <PageHeader
        icon={Settings}
        title="Configuración"
        description="Administra la configuración de tu cuenta y de la aplicación"
      />

      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-8">
        <div className="flex gap-1 flex-wrap -mb-px">
          {tabs.map(tab => {
            const TabIcon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 text-sm md:text-base font-medium
                  whitespace-nowrap transition-all border-b-2 rounded-t-lg
                  ${isActive
                    ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/20'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }
                `}
              >
                <TabIcon size={20} className="flex-shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Description */}
      {activeTabData && (
        <div className="mb-6">
          <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">
            {activeTabData.description}
          </p>
        </div>
      )}

      {/* Tab Content */}
      <div className="tab-content">
        {/* TAB: GENERAL */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <BaseCard className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Globe size={24} className="text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white m-0">
                  Idioma y Región
                </h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Idioma de la interfaz
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    <option>Español</option>
                    <option>English</option>
                    <option>中文</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Zona horaria
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                    <option>UTC-3 (Buenos Aires)</option>
                    <option>UTC-5 (New York)</option>
                    <option>UTC+8 (Beijing)</option>
                  </select>
                </div>
              </div>
            </BaseCard>

            <BaseCard className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Palette size={24} className="text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white m-0">
                  Apariencia
                </h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tema
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button className="p-3 border-2 border-purple-500 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-sm font-medium">
                      Claro
                    </button>
                    <button className="p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:border-gray-400">
                      Oscuro
                    </button>
                    <button className="p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:border-gray-400">
                      Sistema
                    </button>
                  </div>
                </div>
              </div>
            </BaseCard>
          </div>
        )}

        {/* TAB: CREDENCIALES IA */}
        {activeTab === 'credentials' && (
          <CredentialsTab />
        )}

        {/* TAB: NOTIFICACIONES */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <BaseCard className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Bell size={24} className="text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white m-0">
                  Preferencias de Notificaciones
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Notificaciones por email
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Recibe actualizaciones importantes por correo
                    </div>
                  </div>
                  <input type="checkbox" className="w-5 h-5" defaultChecked />
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      Notificaciones push
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Recibe notificaciones en tiempo real
                    </div>
                  </div>
                  <input type="checkbox" className="w-5 h-5" />
                </div>
              </div>
            </BaseCard>
          </div>
        )}

        {/* TAB: CUENTA */}
        {activeTab === 'account' && (
          <div className="space-y-6">
            <BaseCard className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <User size={24} className="text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white m-0">
                  Información de la Cuenta
                </h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre completo
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="Tu nombre"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>
            </BaseCard>

            <BaseCard className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield size={24} className="text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white m-0">
                  Seguridad
                </h3>
              </div>
              <div className="space-y-4">
                <button className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors">
                  Cambiar contraseña
                </button>
                <button className="w-full px-4 py-3 border-2 border-red-500 text-red-600 dark:text-red-400 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  Cerrar sesión en todos los dispositivos
                </button>
              </div>
            </BaseCard>
          </div>
        )}
      </div>
    </div>
  );
}

export default SettingsPanel;
