/**
 * @fileoverview Panel de Configuración con 5 pestañas
 * @module components/SettingsPanel
 */

import { useState } from 'react';
import { Settings, Key, Bell, User, Globe, Palette, Type } from 'lucide-react';
import PageHeader from './common/PageHeader';
import CredentialsTab from './settings/CredentialsTab';
import ThemeCustomizer from './ThemeCustomizer';
import { UniversalCard } from './cards';
import { useFont } from '../contexts/FontContext';

function SettingsPanel() {
  const [activeTab, setActiveTab] = useState('credentials');
  const { selectedFont, setSelectedFont, fontWeight, setFontWeight, fontSize, setFontSize, availableFonts } = useFont();

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

      {/* Tab Content */}
      <div className="w-full">
        {activeTab === 'general' && (
          <div className="w-full space-y-6">
            <UniversalCard
              variant="default"
              size="md"
              icon={Globe}
              title="Idioma y Región"
            >
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
            </UniversalCard>
          </div>
        )}

        {activeTab === 'theme' && (
          <div className="w-full">
            <ThemeCustomizer />
          </div>
        )}

        {activeTab === 'fonts' && (
          <div className="w-full space-y-6">
            <UniversalCard
              variant="default"
              size="md"
              icon={Type}
              title="Probador de Fuentes Chinas"
              description="Visualiza cómo se ve el nombre de la aplicación \"西文教室\" (Aula de Español) con diferentes fuentes chinas"
            >
              {/* Selector de fuente */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Selecciona una fuente ({availableFonts.length} disponibles):
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-96 overflow-y-auto pr-2">
                  {availableFonts.map((font) => {
                    const styleColors = {
                      modern: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
                      classic: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
                      artistic: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
                      rounded: 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300',
                      traditional: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                    };

                    return (
                      <button
                        key={font.name}
                        onClick={() => setSelectedFont(font.family)}
                        className={`p-3 border-2 rounded-lg transition-all text-left ${
                          selectedFont === font.family
                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 shadow-md'
                            : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-900/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-medium text-gray-900 dark:text-gray-100 text-xs">
                            {font.name}
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${styleColors[font.style]}`}>
                            {font.style}
                          </span>
                        </div>
                        <div
                          className="text-sm text-gray-600 dark:text-gray-400 mt-1"
                          style={{ fontFamily: font.family }}
                        >
                          西文教室
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Controles de peso y tamaño */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Toggle de negrita */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Peso de la fuente:
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setFontWeight('normal')}
                      className={`flex-1 p-3 border-2 rounded-lg transition-all font-medium ${
                        fontWeight === 'normal'
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                          : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-900/20'
                      }`}
                    >
                      Normal
                    </button>
                    <button
                      onClick={() => setFontWeight('bold')}
                      className={`flex-1 p-3 border-2 rounded-lg transition-all font-bold ${
                        fontWeight === 'bold'
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                          : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 hover:bg-purple-50/50 dark:hover:bg-purple-900/20'
                      }`}
                    >
                      Negrita
                    </button>
                  </div>
                </div>

                {/* Slider de tamaño */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Tamaño: <span className="text-purple-600 dark:text-purple-400 font-bold">{fontSize.toFixed(2)}rem</span>
                  </label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0.75"
                      max="2.5"
                      step="0.05"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer slider-purple"
                    />
                    <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>Pequeño (0.75rem)</span>
                      <span>Grande (2.5rem)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Vista previa grande */}
              <div className="mt-8 p-8 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-700">
                <div className="text-center">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Vista Previa (así se verá en la barra superior):
                  </div>
                  <div className="mb-6 p-6 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      TopBar Preview (tamaño real):
                    </div>
                    <div
                      className="text-gray-900 dark:text-gray-100 transition-all duration-300"
                      style={{
                        fontFamily: selectedFont,
                        fontWeight: fontWeight,
                        fontSize: `${fontSize}rem`
                      }}
                    >
                      西文教室
                    </div>
                  </div>
                  <div
                    className="text-gray-900 dark:text-gray-100 transition-all duration-300 mb-4"
                    style={{
                      fontFamily: selectedFont,
                      fontWeight: fontWeight,
                      fontSize: `${fontSize * 3}rem`
                    }}
                  >
                    西文教室
                  </div>
                  <div className="text-base text-gray-600 dark:text-gray-400 italic">
                    (Aula de Español)
                  </div>
                </div>
              </div>

              {/* Nota informativa */}
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>✨ Nota:</strong> Los cambios se aplican automáticamente al logo "西文教室" en la barra superior y se guardan en tu navegador.
                </p>
              </div>
            </UniversalCard>
          </div>
        )}

        {activeTab === 'credentials' && (
          <div className="w-full">
            <CredentialsTab />
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="w-full space-y-6">
            <UniversalCard
              variant="default"
              size="md"
              icon={Bell}
              title="Notificaciones"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">Notificaciones por email</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Recibe actualizaciones importantes</div>
                  </div>
                  <input type="checkbox" className="w-5 h-5" defaultChecked />
                </div>
              </div>
            </UniversalCard>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="w-full space-y-6">
            <UniversalCard
              variant="default"
              size="md"
              icon={User}
              title="Cuenta"
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nombre completo</label>
                  <input type="text" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white" placeholder="Tu nombre" />
                </div>
              </div>
            </UniversalCard>
          </div>
        )}
      </div>
    </div>
  );
}

export default SettingsPanel;
