/**
 * @fileoverview Design System Tester PRO - Integrado con temas reales de la app
 * @module components/DesignLab
 */

import logger from '../utils/logger';
import { useState, useEffect, useRef } from 'react';
import {
  Palette,
  Download,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  XCircle,
  Loader2,
  Bell,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  Upload,
  Save,
  Trash2,
  Sun,
  Moon,
  ArrowLeftRight,
  Undo2,
  Redo2,
  Star,
  Wand2,
  Check
} from 'lucide-react';
import { useTheme, THEMES, THEME_INFO } from '../contexts/ThemeContext';

// Colores por defecto de cada tema (extraídos de globals.css)
const DEFAULT_THEME_COLORS = {
  light: {
    // Fondos
    'bg-primary': '#ffffff',
    'bg-secondary': '#f9fafb',
    'bg-tertiary': '#f3f4f6',
    'bg-hover': '#e5e7eb',
    // Textos
    'text-primary': '#18181b',
    'text-secondary': '#71717a',
    'text-muted': '#a1a1aa',
    // Bordes
    'border': '#e5e7eb',
    'border-focus': '#d1d5db',
    // Semánticos
    'success': '#10b981',
    'error': '#ef4444',
    'warning': '#f59e0b',
    'info': '#06b6d4',
    // Acento
    'accent': '#6366f1',
  },
  dark: {
    'bg-primary': '#09090b',
    'bg-secondary': '#18181b',
    'bg-tertiary': '#27272a',
    'bg-hover': '#3f3f46',
    'text-primary': '#f4f4f5',
    'text-secondary': '#a1a1aa',
    'text-muted': '#71717a',
    'border': '#27272a',
    'border-focus': '#3f3f46',
    'success': '#10b981',
    'error': '#ef4444',
    'warning': '#f59e0b',
    'info': '#06b6d4',
    'accent': '#6366f1',
  },
  ocean: {
    'bg-primary': '#f0f9ff',
    'bg-secondary': '#e0f2fe',
    'bg-tertiary': '#bae6fd',
    'bg-hover': '#7dd3fc',
    'text-primary': '#0c4a6e',
    'text-secondary': '#0369a1',
    'text-muted': '#0ea5e9',
    'border': '#bae6fd',
    'border-focus': '#38bdf8',
    'success': '#059669',
    'error': '#dc2626',
    'warning': '#d97706',
    'info': '#2563eb',
    'accent': '#0284c7',
  },
  forest: {
    'bg-primary': '#f0fdf4',
    'bg-secondary': '#dcfce7',
    'bg-tertiary': '#bbf7d0',
    'bg-hover': '#86efac',
    'text-primary': '#14532d',
    'text-secondary': '#15803d',
    'text-muted': '#22c55e',
    'border': '#bbf7d0',
    'border-focus': '#4ade80',
    'success': '#16a34a',
    'error': '#dc2626',
    'warning': '#d97706',
    'info': '#0891b2',
    'accent': '#16a34a',
  },
  sunset: {
    'bg-primary': '#fff7ed',
    'bg-secondary': '#ffedd5',
    'bg-tertiary': '#fed7aa',
    'bg-hover': '#fdba74',
    'text-primary': '#7c2d12',
    'text-secondary': '#c2410c',
    'text-muted': '#f97316',
    'border': '#fed7aa',
    'border-focus': '#fb923c',
    'success': '#16a34a',
    'error': '#dc2626',
    'warning': '#ea580c',
    'info': '#0891b2',
    'accent': '#ea580c',
  },
  midnight: {
    'bg-primary': '#0c1221',
    'bg-secondary': '#0f172a',
    'bg-tertiary': '#1e293b',
    'bg-hover': '#334155',
    'text-primary': '#f1f5f9',
    'text-secondary': '#94a3b8',
    'text-muted': '#64748b',
    'border': '#1e293b',
    'border-focus': '#475569',
    'success': '#10b981',
    'error': '#ef4444',
    'warning': '#f59e0b',
    'info': '#06b6d4',
    'accent': '#3b82f6',
  }
};

// Categorías de colores
const COLOR_CATEGORIES = {
  backgrounds: {
    label: 'Fondos',
    icon: '🎨',
    colors: ['bg-primary', 'bg-secondary', 'bg-tertiary', 'bg-hover']
  },
  texts: {
    label: 'Textos',
    icon: '📝',
    colors: ['text-primary', 'text-secondary', 'text-muted']
  },
  borders: {
    label: 'Bordes',
    icon: '🔲',
    colors: ['border', 'border-focus']
  },
  semantic: {
    label: 'Semánticos',
    icon: '🎯',
    colors: ['success', 'error', 'warning', 'info']
  },
  accent: {
    label: 'Acento',
    icon: '✨',
    colors: ['accent']
  }
};

/**
 * Genera una paleta de colores automáticamente desde un color base
 */
function generatePalette(baseColor) {
  const hexToHSL = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  };

  const hslToHex = (h, s, l) => {
    h = h / 360;
    s = s / 100;
    l = l / 100;
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    const toHex = x => {
      const hex = Math.round(x * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  const base = hexToHSL(baseColor);

  return {
    'accent': baseColor,
    'success': '#10b981',
    'warning': '#f59e0b',
    'error': '#ef4444',
    'info': hslToHex((base.h + 180) % 360, base.s, base.l),
  };
}

/**
 * Design Lab integrado con temas reales de la app
 */
function DesignLab() {
  const { currentTheme, setTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState(currentTheme);
  const [customColors, setCustomColors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [compareMode, setCompareMode] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('backgrounds');
  const [showPaletteGenerator, setShowPaletteGenerator] = useState(false);
  const [baseColor, setBaseColor] = useState('#6366f1');
  const fileInputRef = useRef(null);

  // Cargar colores personalizados del localStorage
  useEffect(() => {
    const saved = localStorage.getItem('customThemeColors');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setCustomColors(parsed);
        setHistory([parsed]);
      } catch (error) {
        logger.error('Error loading custom colors:', error);
      }
    } else {
      setHistory([{}]);
    }
  }, []);

  // Aplicar colores personalizados cuando cambia el tema seleccionado
  useEffect(() => {
    applyCustomColors(selectedTheme, customColors[selectedTheme]);
  }, [selectedTheme, customColors]);

  // Obtener color actual (personalizado o por defecto)
  const getColor = (colorKey) => {
    return customColors[selectedTheme]?.[colorKey] || DEFAULT_THEME_COLORS[selectedTheme][colorKey];
  };

  // Actualizar color con historial
  const updateColor = (colorKey, value) => {
    const newCustomColors = {
      ...customColors,
      [selectedTheme]: {
        ...(customColors[selectedTheme] || {}),
        [colorKey]: value
      }
    };

    // Agregar al historial
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newCustomColors);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    setCustomColors(newCustomColors);
    setHasChanges(true);
  };

  // Undo/Redo
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCustomColors(history[historyIndex - 1]);
      setHasChanges(true);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCustomColors(history[historyIndex + 1]);
      setHasChanges(true);
    }
  };

  // Aplicar colores personalizados al documento
  const applyCustomColors = (theme, colors) => {
    const root = document.documentElement;

    if (!colors || Object.keys(colors).length === 0) {
      // Limpiar overrides - usar valores por defecto del tema
      Object.keys(DEFAULT_THEME_COLORS[theme]).forEach(key => {
        root.style.removeProperty(`--color-${key}`);
      });
      return;
    }

    // Aplicar colores personalizados
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
  };

  // Guardar cambios
  const saveChanges = () => {
    localStorage.setItem('customThemeColors', JSON.stringify(customColors));
    setHasChanges(false);
    showToastMessage('✅ Cambios guardados - Se aplicarán a toda la app');
  };

  // Resetear tema
  const resetTheme = () => {
    if (!confirm('¿Resetear este tema a sus colores por defecto?')) {
      return;
    }

    const newCustomColors = { ...customColors };
    delete newCustomColors[selectedTheme];
    setCustomColors(newCustomColors);

    localStorage.setItem('customThemeColors', JSON.stringify(newCustomColors));

    // Limpiar variables CSS inline
    const root = document.documentElement;
    Object.keys(DEFAULT_THEME_COLORS[selectedTheme]).forEach(key => {
      root.style.removeProperty(`--color-${key}`);
    });

    setHasChanges(false);
    showToastMessage('✅ Tema reseteado a valores por defecto');
  };

  // Cambiar tema de la app
  const changeAppTheme = (theme) => {
    setSelectedTheme(theme);
    setTheme(theme);
    showToastMessage(`🎨 Tema cambiado a ${THEME_INFO[theme].name}`);
  };

  // Generar paleta automática
  const applyGeneratedPalette = () => {
    const palette = generatePalette(baseColor);

    const newCustomColors = {
      ...customColors,
      [selectedTheme]: {
        ...(customColors[selectedTheme] || {}),
        ...palette
      }
    };

    setCustomColors(newCustomColors);
    setShowPaletteGenerator(false);
    setHasChanges(true);
    showToastMessage('✨ Paleta generada automáticamente');
  };

  // Toast helper
  const showToastMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Exportar CSS
  const exportCSS = () => {
    const themeColors = customColors[selectedTheme] || DEFAULT_THEME_COLORS[selectedTheme];

    const css = `/* Tema ${THEME_INFO[selectedTheme].name} personalizado */
.${selectedTheme} {
  /* Fondos */
${Object.entries(themeColors).filter(([key]) => key.startsWith('bg-')).map(([key, value]) => `  --color-${key}: ${value};`).join('\n')}

  /* Textos */
${Object.entries(themeColors).filter(([key]) => key.startsWith('text-')).map(([key, value]) => `  --color-${key}: ${value};`).join('\n')}

  /* Bordes */
${Object.entries(themeColors).filter(([key]) => key.startsWith('border')).map(([key, value]) => `  --color-${key}: ${value};`).join('\n')}

  /* Semánticos */
${Object.entries(themeColors).filter(([key]) => ['success', 'error', 'warning', 'info'].includes(key)).map(([key, value]) => `  --color-${key}: ${value};`).join('\n')}

  /* Acento */
${Object.entries(themeColors).filter(([key]) => key === 'accent').map(([key, value]) => `  --color-${key}: ${value};`).join('\n')}
}`;

    navigator.clipboard.writeText(css);
    showToastMessage('📋 CSS copiado al clipboard');
  };

  // Importar configuración
  const importConfig = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        setCustomColors(imported);
        setHistory([imported]);
        setHistoryIndex(0);
        setHasChanges(true);
        showToastMessage('✅ Configuración importada');
      } catch (error) {
        alert('❌ Error al importar: archivo inválido');
      }
    };
    reader.readAsText(file);
  };

  const isDarkTheme = THEME_INFO[selectedTheme]?.isDark;

  return (
    <div className={`min-h-screen ${isDarkTheme ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-50`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Palette size={28} style={{ color: getColor('accent') }} />
              <div>
                <h1 className={`text-2xl font-bold ${isDarkTheme ? 'text-white' : 'text-gray-900'}`}>
                  Design Lab - {THEME_INFO[selectedTheme].name}
                </h1>
                <p className={`text-sm ${isDarkTheme ? 'text-gray-400' : 'text-gray-500'}`}>
                  Personaliza los temas de XIWEN en tiempo real
                </p>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              {/* Undo/Redo */}
              <button
                onClick={undo}
                disabled={historyIndex === 0}
                className={`p-2 rounded-lg transition-colors bg-gray-100 dark:bg-gray-800 ${historyIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                title="Deshacer"
              >
                <Undo2 size={18} className={isDarkTheme ? 'text-gray-300' : 'text-gray-700'} />
              </button>
              <button
                onClick={redo}
                disabled={historyIndex === history.length - 1}
                className={`p-2 rounded-lg transition-colors bg-gray-100 dark:bg-gray-800 ${historyIndex === history.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                title="Rehacer"
              >
                <Redo2 size={18} className={isDarkTheme ? 'text-gray-300' : 'text-gray-700'} />
              </button>

              <button
                onClick={exportCSS}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <Download size={18} />
                Export CSS
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              >
                <Upload size={18} />
                Import
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={importConfig}
              />

              <button
                onClick={resetTheme}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${isDarkTheme ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                <RotateCcw size={18} />
                Reset
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Panel de Control Lateral */}
        <aside className={`w-80 ${isDarkTheme ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r h-[calc(100vh-73px)] overflow-y-auto sticky top-[73px] scrollbar-gutter-stable`}>
          <div className="p-6 space-y-6">
            {/* Selector de Tema */}
            <section>
              <h3 className={`text-lg font-semibold ${isDarkTheme ? 'text-white' : 'text-gray-900'} mb-3 flex items-center gap-2`}>
                <Star size={18} />
                Tema de la App
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(THEMES).map(([key, value]) => (
                  <button
                    key={value}
                    onClick={() => changeAppTheme(value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedTheme === value
                        ? 'bg-blue-500 text-white'
                        : isDarkTheme
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {THEME_INFO[value].name}
                  </button>
                ))}
              </div>
            </section>

            {/* Palette Generator */}
            <section>
              <button
                onClick={() => setShowPaletteGenerator(!showPaletteGenerator)}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all flex items-center justify-center gap-2 font-medium"
              >
                <Wand2 size={18} />
                Generar Paleta
              </button>

              {showPaletteGenerator && (
                <div className={`mt-3 p-4 rounded-lg ${isDarkTheme ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <label className={`block text-sm font-medium mb-2 ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                    Color Base
                  </label>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="color"
                      value={baseColor}
                      onChange={(e) => setBaseColor(e.target.value)}
                      className="w-12 h-10 rounded border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={baseColor}
                      onChange={(e) => setBaseColor(e.target.value)}
                      className={`flex-1 px-3 py-2 rounded font-mono text-sm ${isDarkTheme ? 'bg-gray-600 text-white border-gray-500' : 'bg-white text-gray-900 border-gray-300'} border`}
                    />
                  </div>
                  <button
                    onClick={applyGeneratedPalette}
                    className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    Aplicar Paleta
                  </button>
                </div>
              )}
            </section>

            {/* Tabs de Categorías */}
            <div className="space-y-2">
              {Object.entries(COLOR_CATEGORIES).map(([key, category]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`w-full px-4 py-2 rounded-lg text-left font-medium transition-colors ${
                    activeTab === key
                      ? 'bg-blue-500 text-white'
                      : isDarkTheme
                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-2">{category.icon}</span>
                  {category.label}
                </button>
              ))}
            </div>

            {/* Editor de Colores */}
            <section className="space-y-3">
              {COLOR_CATEGORIES[activeTab]?.colors.map(colorKey => (
                <div key={colorKey}>
                  <label className={`block text-sm font-medium mb-1 capitalize ${isDarkTheme ? 'text-gray-300' : 'text-gray-700'}`}>
                    {colorKey.replace('-', ' ')}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={getColor(colorKey)}
                      onChange={(e) => updateColor(colorKey, e.target.value)}
                      className="w-12 h-10 rounded border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={getColor(colorKey)}
                      onChange={(e) => updateColor(colorKey, e.target.value)}
                      className={`flex-1 px-3 py-2 rounded font-mono text-sm ${isDarkTheme ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
                    />
                  </div>
                </div>
              ))}
            </section>
          </div>
        </aside>

        {/* Showcase de Componentes */}
        <main className="flex-1 p-8 overflow-y-auto scrollbar-gutter-stable">
          <ComponentShowcase isDark={isDarkTheme} />
        </main>
      </div>

      {/* Botón flotante para guardar */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={saveChanges}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all shadow-lg flex items-center gap-2 font-semibold text-lg"
          >
            <Save size={20} />
            Guardar Cambios
          </button>
        </div>
      )}

      {/* Toast flotante */}
      {showToast && (
        <div
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 px-6 py-4 bg-gray-900 text-white flex items-center gap-3 z-50 rounded-lg shadow-2xl"
        >
          <CheckCircle size={20} className="text-green-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Componente de showcase
 */
function ComponentShowcase({ isDark }) {
  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Info Banner */}
      <div
        className={`p-6 rounded-lg border-l-4`}
        style={{
          backgroundColor: 'var(--color-info)15',
          borderColor: 'var(--color-info)'
        }}
      >
        <div className="flex items-start gap-3">
          <AlertCircle size={20} style={{ color: 'var(--color-info)', flexShrink: 0 }} />
          <div>
            <p className="font-semibold" style={{ color: 'var(--color-info)' }}>
              ¡Los cambios se aplican a toda la app!
            </p>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Todos los ajustes que hagas aquí se reflejarán en tiempo real en toda XIWEN. Recuerda hacer click en "Guardar Cambios" para que persistan.
            </p>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <section>
        <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Navbar</h2>
        <div
          className="rounded-lg overflow-hidden shadow-md"
          style={{ backgroundColor: 'var(--color-bg-secondary)' }}
        >
          <nav className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Menu size={24} style={{ color: 'var(--color-text-primary)' }} />
              <span className="text-xl font-bold" style={{ color: 'var(--color-accent)' }}>
                XIWEN
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: 'var(--color-bg-hover)' }}
              >
                <Bell size={20} style={{ color: 'var(--color-text-primary)' }} />
              </button>
              <button
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: 'var(--color-bg-hover)' }}
              >
                <User size={20} style={{ color: 'var(--color-text-primary)' }} />
              </button>
            </div>
          </nav>
        </div>
      </section>

      {/* Botones */}
      <section>
        <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Botones</h2>
        <div className="grid grid-cols-4 gap-4">
          {['accent', 'success', 'warning', 'error'].map(type => (
            <div key={type} className="space-y-2">
              <p className={`text-sm font-medium capitalize ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{type}</p>
              <button
                className="w-full px-4 py-2 text-white font-medium rounded-lg transition-opacity hover:opacity-90 shadow-sm"
                style={{ backgroundColor: `var(--color-${type})` }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Cards */}
      <section>
        <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Cards</h2>
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="p-6 rounded-lg shadow-md border"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                borderColor: 'var(--color-border)'
              }}
            >
              <h3 className={`text-lg font-semibold mb-2`} style={{ color: 'var(--color-text-primary)' }}>
                Card {i}
              </h3>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Ejemplo de card con colores del tema actual
              </p>
              <button
                className="mt-4 px-4 py-2 text-white rounded-lg font-medium text-sm"
                style={{ backgroundColor: 'var(--color-accent)' }}
              >
                Acción
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Inputs */}
      <section>
        <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Inputs</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Input Normal
            </label>
            <input
              type="text"
              placeholder="Escribe algo..."
              className="w-full px-4 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Input con Error
            </label>
            <input
              type="text"
              placeholder="Error..."
              className="w-full px-4 py-2 rounded-lg border-2"
              style={{
                backgroundColor: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-error)',
                color: 'var(--color-text-primary)'
              }}
            />
            <p className="text-sm" style={{ color: 'var(--color-error)' }}>
              Este campo es requerido
            </p>
          </div>
        </div>
      </section>

      {/* Alerts */}
      <section>
        <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Alerts</h2>
        <div className="space-y-4">
          {[
            { type: 'success', icon: CheckCircle, title: 'Éxito', message: 'Operación completada correctamente' },
            { type: 'warning', icon: AlertCircle, title: 'Advertencia', message: 'Revisa la información ingresada' },
            { type: 'error', icon: XCircle, title: 'Error', message: 'Algo salió mal, intenta de nuevo' },
          ].map(alert => (
            <div
              key={alert.type}
              className="p-4 flex items-start gap-3 rounded-lg border"
              style={{
                backgroundColor: `var(--color-${alert.type})15`,
                borderColor: `var(--color-${alert.type})`
              }}
            >
              <alert.icon size={20} style={{ color: `var(--color-${alert.type})`, flexShrink: 0 }} />
              <div>
                <p className="font-semibold" style={{ color: `var(--color-${alert.type})` }}>
                  {alert.title}
                </p>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {alert.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tabla */}
      <section>
        <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Tabla</h2>
        <div
          className="rounded-lg overflow-hidden shadow-md border"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <table className="w-full">
            <thead style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Nombre</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Estado</th>
              </tr>
            </thead>
            <tbody style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
              {[
                { name: 'Juan Pérez', email: 'juan@example.com', status: 'Activo', statusColor: 'success' },
                { name: 'María García', email: 'maria@example.com', status: 'Pendiente', statusColor: 'warning' },
                { name: 'Pedro López', email: 'pedro@example.com', status: 'Inactivo', statusColor: 'error' }
              ].map((row, i) => (
                <tr key={i} className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-primary)' }}>{row.name}</td>
                  <td className="px-4 py-3" style={{ color: 'var(--color-text-secondary)' }}>{row.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className="px-3 py-1 text-xs font-semibold text-white rounded-full"
                      style={{ backgroundColor: `var(--color-${row.statusColor})` }}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default DesignLab;
