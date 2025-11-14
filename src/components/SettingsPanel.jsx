/**
 * @fileoverview Panel de Configuración con 5 pestañas
 * @module components/SettingsPanel
 */

import { useState } from 'react';
import { Settings, Key, Bell, User, Globe, Palette, Type } from 'lucide-react';
import PageHeader from './common/PageHeader';
import CredentialsTab from './settings/CredentialsTab';
import ThemeCustomizer from './ThemeCustomizer';
import { BaseCard } from './common';

function SettingsPanel() {
  const [activeTab, setActiveTab] = useState('credentials');

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'theme', label: 'Temas', icon: Palette },
    { id: 'fonts', label: 'Fuentes', icon: Type },
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
                <Globe size={24} className="text-purple-600 dark:text-purple-400" />
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

        {activeTab === 'fonts' && (
          <div className="w-full space-y-6">
            <BaseCard className="p-6 w-full">
              <div className="flex items-center gap-3 mb-4">
                <Type size={24} className="text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white m-0">Probador de Fuentes Chinas</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Visualiza cómo se ve el nombre de la aplicación "西文教室" (Aula de Español) con diferentes fuentes chinas
              </p>

              {/* Selector de fuente */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Selecciona una fuente:
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { name: 'Microsoft YaHei', family: "'Microsoft YaHei', sans-serif" },
                    { name: 'SimSun (宋体)', family: "SimSun, serif" },
                    { name: 'SimHei (黑体)', family: "SimHei, sans-serif" },
                    { name: 'STSong (华文宋体)', family: "STSong, serif" },
                    { name: 'STHeiti (华文黑体)', family: "STHeiti, sans-serif" },
                    { name: 'Noto Sans SC', family: "'Noto Sans SC', sans-serif" }
                  ].map((font) => (
                    <button
                      key={font.name}
                      onClick={() => {
                        const preview = document.getElementById('font-preview-settings');
                        if (preview) preview.style.fontFamily = font.family;
                      }}
                      className="p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all text-left"
                    >
                      <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                        {font.name}
                      </div>
                      <div
                        className="text-xs text-gray-500 dark:text-gray-400 mt-1"
                        style={{ fontFamily: font.family }}
                      >
                        西文教室 ABC 123
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggle de negrita */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Peso de la fuente:
                </label>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      const preview = document.getElementById('font-preview-settings');
                      if (preview) preview.style.fontWeight = 'normal';
                    }}
                    className="flex-1 p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all font-medium"
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => {
                      const preview = document.getElementById('font-preview-settings');
                      if (preview) preview.style.fontWeight = 'bold';
                    }}
                    className="flex-1 p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-all font-bold"
                  >
                    Negrita
                  </button>
                </div>
              </div>

              {/* Vista previa grande */}
              <div className="mt-8 p-8 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-700">
                <div className="text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Vista Previa:
                  </div>
                  <div
                    id="font-preview-settings"
                    className="text-6xl lg:text-7xl text-gray-900 dark:text-gray-100 transition-all duration-300 mb-4"
                    style={{ fontFamily: "'Microsoft YaHei', sans-serif", fontWeight: 'bold' }}
                  >
                    西文教室
                  </div>
                  <div className="text-base text-gray-600 dark:text-gray-400 italic">
                    (Aula de Español)
                  </div>
                </div>
              </div>

              {/* Nota informativa */}
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>💡 Nota:</strong> Esta es una herramienta temporal para probar diferentes fuentes chinas. Los cambios aquí son solo para visualización y no se aplican automáticamente al logo de la aplicación.
                </p>
              </div>
            </BaseCard>
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
                <Bell size={24} className="text-purple-600 dark:text-purple-400" />
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
                <User size={24} className="text-purple-600 dark:text-purple-400" />
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
