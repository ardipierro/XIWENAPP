/**
 * @fileoverview Pestaña de Diseño y Apariencia - Agrupa Temas, Fuentes, Badges y Card System
 * @module components/settings/DesignTab
 */

import { useState } from 'react';
import { Palette, Type, Tag, LayoutGrid, RotateCcw, Database } from 'lucide-react';
import BaseTabs from '../common/BaseTabs';
import ThemeCustomizer from '../ThemeCustomizer';
import BadgeCustomizerTab from './BadgeCustomizerTab';
import CardSystemTab from './CardSystemTab';
import { useFont } from '../../contexts/FontContext';
import { useAuth } from '../../contexts/AuthContext';

function DesignTab() {
  const [activeSubTab, setActiveSubTab] = useState('theme');
  const { selectedFont, setSelectedFont, fontWeight, setFontWeight, fontSize, setFontSize, availableFonts, resetToDefaults, isLoading } = useFont();
  const { user } = useAuth();
  const [isResetting, setIsResetting] = useState(false);

  const handleReset = async () => {
    if (!confirm('¿Resetear la configuración del logo a los valores por defecto?\n\nFuente: Microsoft YaHei\nPeso: Negrita\nTamaño: 1.25rem')) {
      return;
    }

    setIsResetting(true);
    try {
      await resetToDefaults();
      alert('✅ Configuración reseteada correctamente');
    } catch (error) {
      alert('❌ Error al resetear configuración');
    } finally {
      setIsResetting(false);
    }
  };

  const subTabs = [
    { id: 'theme', label: 'Temas', icon: Palette },
    { id: 'fonts', label: 'Fuentes', icon: Type },
    { id: 'badges', label: 'Badges', icon: Tag },
    { id: 'cardsystem', label: 'Card System', icon: LayoutGrid }
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
        {activeSubTab === 'theme' && (
          <div className="w-full">
            <ThemeCustomizer />
          </div>
        )}

        {activeSubTab === 'fonts' && (
          <div className="w-full space-y-6">
            {/* Título y descripción */}
            <div className="mb-6">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Configuración del Logo
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Visualiza cómo se ve el nombre de la aplicación "西文教室" (Aula de Español) con diferentes fuentes chinas
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  disabled={isResetting || isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700
                           hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300
                           rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                           text-sm font-medium whitespace-nowrap"
                  title="Resetear a configuración por defecto"
                >
                  <RotateCcw size={16} className={isResetting ? 'animate-spin' : ''} />
                  Resetear
                </button>
              </div>

              {/* Info de persistencia */}
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <div className="flex items-start gap-2">
                  <Database size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-blue-800 dark:text-blue-200">
                    <strong>Guardado en Firebase:</strong> La configuración se guarda automáticamente en la nube.
                    Se mantendrá aunque cambies de navegador o servidor.
                    <br />
                    <strong className="mt-1 inline-block">Default actual:</strong> Microsoft YaHei, Negrita, 1.25rem
                  </div>
                </div>
              </div>
            </div>

            {/* Selector de fuente */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Selecciona una fuente ({availableFonts.length} disponibles):
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 max-h-96 overflow-y-auto pr-2">
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
                            ? 'border-indigo-500 bg-gray-50 dark:bg-zinc-900 shadow-md'
                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-900/50'
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
                        ? 'border-indigo-500 bg-gray-50 dark:bg-zinc-900'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-900/50'
                    }`}
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => setFontWeight('bold')}
                    className={`flex-1 p-3 border-2 rounded-lg transition-all font-bold ${
                      fontWeight === 'bold'
                        ? 'border-indigo-500 bg-gray-50 dark:bg-zinc-900'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-900/50'
                    }`}
                  >
                    Negrita
                  </button>
                </div>
              </div>

              {/* Slider de tamaño */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Tamaño: <span className="text-indigo-600 dark:text-indigo-400 font-bold">{fontSize.toFixed(2)}rem</span>
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
            <div className="mt-8 p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-zinc-900 dark:to-zinc-800 rounded-xl border-2 border-gray-200 dark:border-gray-700">
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
                <strong>✨ Nota:</strong> Los cambios se aplican automáticamente al logo "西文教室" en la barra superior
                y se guardan tanto en tu navegador (carga rápida) como en Firebase (persistencia global).
                La configuración se sincronizará automáticamente en todos tus dispositivos y sesiones.
              </p>
            </div>
          </div>
        )}

        {activeSubTab === 'badges' && (
          <div className="w-full">
            <BadgeCustomizerTab user={user} />
          </div>
        )}

        {activeSubTab === 'cardsystem' && (
          <div className="w-full">
            <CardSystemTab />
          </div>
        )}
      </div>
    </div>
  );
}

export default DesignTab;
