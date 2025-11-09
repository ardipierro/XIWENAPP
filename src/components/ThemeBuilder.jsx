/**
 * @fileoverview Theme Builder - Laboratorio de diseño de sistema interactivo
 * @module components/ThemeBuilder
 */

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
  Copy,
  Check,
  Upload,
  Save,
  Trash2,
  Sun,
  Moon,
  Sparkles,
  ArrowLeftRight,
  Undo2,
  Redo2,
  Search,
  Star,
  Code2,
  FileJson,
  Wand2,
  Eye,
  EyeOff,
  Plus,
  ChevronDown,
  Edit2,
  Table
} from 'lucide-react';
import { BaseModal, BaseButton } from './common';

// Valores por defecto del sistema
const DEFAULT_CONFIG = {
  colors: {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    accent: '#0ea5e9',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    neutral: '#71717a',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  radius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  },
  fonts: {
    base: '16px',
    sm: '14px',
    lg: '18px',
    xl: '20px',
  }
};

// Presets predefinidos
const PRESETS = {
  default: { name: 'Default', config: DEFAULT_CONFIG },
  corporate: {
    name: 'Corporate Blue',
    config: {
      ...DEFAULT_CONFIG,
      colors: {
        primary: '#1e40af',
        secondary: '#3b82f6',
        accent: '#60a5fa',
        success: '#059669',
        warning: '#d97706',
        error: '#dc2626',
        neutral: '#6b7280',
      }
    }
  },
  vibrant: {
    name: 'Vibrant Startup',
    config: {
      ...DEFAULT_CONFIG,
      colors: {
        primary: '#ec4899',
        secondary: '#8b5cf6',
        accent: '#06b6d4',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        neutral: '#71717a',
      }
    }
  },
  dark: {
    name: 'Dark Mode',
    config: {
      ...DEFAULT_CONFIG,
      colors: {
        primary: '#818cf8',
        secondary: '#a78bfa',
        accent: '#38bdf8',
        success: '#34d399',
        warning: '#fbbf24',
        error: '#f87171',
        neutral: '#9ca3af',
      }
    }
  },
  nature: {
    name: 'Nature Green',
    config: {
      ...DEFAULT_CONFIG,
      colors: {
        primary: '#16a34a',
        secondary: '#22c55e',
        accent: '#0891b2',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#dc2626',
        neutral: '#78716c',
      }
    }
  }
};

/**
 * Genera una paleta de colores automáticamente desde un color base
 */
function generatePalette(baseColor) {
  // Convertir hex a HSL
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

  // Convertir HSL a hex
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
    primary: baseColor,
    secondary: hslToHex((base.h + 30) % 360, base.s, base.l),
    accent: hslToHex((base.h + 180) % 360, base.s, base.l),
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    neutral: '#71717a',
  };
}

/**
 * Design System Tester PRO - Laboratorio visual interactivo mejorado
 */
function ThemeBuilder() {
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('designLabConfig');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  // Nuevas features
  const [mode, setMode] = useState('light'); // light | dark
  const [compareMode, setCompareMode] = useState(false);
  const [compareConfig, setCompareConfig] = useState(DEFAULT_CONFIG);
  const [history, setHistory] = useState([DEFAULT_CONFIG]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [savedPresets, setSavedPresets] = useState(() => {
    const saved = localStorage.getItem('designLabPresets');
    return saved ? JSON.parse(saved) : {};
  });
  const [presetName, setPresetName] = useState('');
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [activeTab, setActiveTab] = useState('colors'); // colors | shadows | radius | fonts
  const [showPaletteGenerator, setShowPaletteGenerator] = useState(false);
  const [baseColor, setBaseColor] = useState('#6366f1');
  const [exportFormat, setExportFormat] = useState('css'); // css | json | tailwind
  const fileInputRef = useRef(null);

  // Aplicar configuración al documento
  useEffect(() => {
    const root = document.documentElement;

    // Aplicar colores
    Object.entries(config.colors).forEach(([key, value]) => {
      root.style.setProperty(`--lab-${key}`, value);
    });

    // Aplicar sombras
    Object.entries(config.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--lab-shadow-${key}`, value);
    });

    // Aplicar radios
    Object.entries(config.radius).forEach(([key, value]) => {
      root.style.setProperty(`--lab-radius-${key}`, value);
    });

    // Aplicar fuentes
    Object.entries(config.fonts).forEach(([key, value]) => {
      root.style.setProperty(`--lab-font-${key}`, value);
    });

    // Guardar en localStorage
    localStorage.setItem('designLabConfig', JSON.stringify(config));
  }, [config]);

  // Actualizar un valor con historial
  const updateConfig = (category, key, value) => {
    const newConfig = {
      ...config,
      [category]: {
        ...config[category],
        [key]: value
      }
    };

    // Agregar al historial
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newConfig);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    setConfig(newConfig);
  };

  // Undo/Redo
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setConfig(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setConfig(history[historyIndex + 1]);
    }
  };

  // Resetear a defaults
  const resetConfig = () => {
    if (confirm('¿Resetear todos los valores a los defaults?')) {
      setConfig(DEFAULT_CONFIG);
      setHistory([DEFAULT_CONFIG]);
      setHistoryIndex(0);
      localStorage.removeItem('designLabConfig');
      showToastMessage('✅ Reseteado a valores por defecto');
    }
  };

  // Guardar preset
  const savePreset = () => {
    if (!presetName.trim()) {
      alert('Por favor ingresa un nombre para el preset');
      return;
    }

    const newPresets = {
      ...savedPresets,
      [presetName.toLowerCase().replace(/\s+/g, '-')]: {
        name: presetName,
        config: config
      }
    };

    setSavedPresets(newPresets);
    localStorage.setItem('designLabPresets', JSON.stringify(newPresets));
    setShowPresetModal(false);
    setPresetName('');
    showToastMessage(`✅ Preset "${presetName}" guardado`);
  };

  // Cargar preset
  const loadPreset = (presetKey) => {
    const preset = PRESETS[presetKey] || savedPresets[presetKey];
    if (preset) {
      setConfig(preset.config);
      setHistory([preset.config]);
      setHistoryIndex(0);
      showToastMessage(`✅ Preset "${preset.name}" cargado`);
    }
  };

  // Eliminar preset
  const deletePreset = (presetKey) => {
    if (confirm('¿Eliminar este preset?')) {
      const newPresets = { ...savedPresets };
      delete newPresets[presetKey];
      setSavedPresets(newPresets);
      localStorage.setItem('designLabPresets', JSON.stringify(newPresets));
      showToastMessage('🗑️ Preset eliminado');
    }
  };

  // Generar paleta automática
  const applyGeneratedPalette = () => {
    const palette = generatePalette(baseColor);
    setConfig(prev => ({
      ...prev,
      colors: palette
    }));
    setShowPaletteGenerator(false);
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
    let output = '';

    if (exportFormat === 'css') {
      output = `/* Exported from Design Lab */\n:root {\n  /* Colors */\n${Object.entries(config.colors).map(([key, value]) => `  --color-${key}: ${value};`).join('\n')}\n\n  /* Shadows */\n${Object.entries(config.shadows).map(([key, value]) => `  --shadow-${key}: ${value};`).join('\n')}\n\n  /* Border Radius */\n${Object.entries(config.radius).map(([key, value]) => `  --radius-${key}: ${value};`).join('\n')}\n\n  /* Font Sizes */\n${Object.entries(config.fonts).map(([key, value]) => `  --font-${key}: ${value};`).join('\n')}\n}`;
    } else if (exportFormat === 'json') {
      output = JSON.stringify(config, null, 2);
    } else if (exportFormat === 'tailwind') {
      output = `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: ${JSON.stringify(config.colors, null, 6)},\n      boxShadow: ${JSON.stringify(config.shadows, null, 6)},\n      borderRadius: ${JSON.stringify(config.radius, null, 6)},\n      fontSize: ${JSON.stringify(config.fonts, null, 6)}\n    }\n  }\n}`;
    }

    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToastMessage('📋 Copiado al clipboard');
  };

  // Importar configuración
  const importConfig = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        setConfig(imported);
        setHistory([imported]);
        setHistoryIndex(0);
        showToastMessage('✅ Configuración importada');
      } catch (error) {
        alert('❌ Error al importar: archivo inválido');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={`min-h-screen ${mode === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`${mode === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-50`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Palette size={28} style={{ color: 'var(--lab-primary)' }} />
              <div>
                <h1 className={`text-2xl font-bold ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Design System Tester PRO
                </h1>
                <p className={`text-sm ${mode === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  Ajusta, compara y exporta tu sistema de diseño
                </p>
              </div>
            </div>
            <div className="flex gap-2 items-center">
              {/* Undo/Redo */}
              <button
                onClick={undo}
                disabled={historyIndex === 0}
                className={`p-2 rounded-lg transition-colors ${historyIndex === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                title="Undo"
              >
                <Undo2 size={18} className={mode === 'dark' ? 'text-gray-300' : 'text-gray-700'} />
              </button>
              <button
                onClick={redo}
                disabled={historyIndex === history.length - 1}
                className={`p-2 rounded-lg transition-colors ${historyIndex === history.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                title="Redo"
              >
                <Redo2 size={18} className={mode === 'dark' ? 'text-gray-300' : 'text-gray-700'} />
              </button>

              {/* Mode Toggle */}
              <button
                onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}
              >
                {mode === 'light' ? <Moon size={18} className="text-gray-700" /> : <Sun size={18} className="text-gray-300" />}
              </button>

              {/* Compare Mode */}
              <button
                onClick={() => setCompareMode(!compareMode)}
                className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${compareMode ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}
                title="Compare side by side"
              >
                <ArrowLeftRight size={18} />
                {compareMode ? 'Comparing' : 'Compare'}
              </button>

              {/* Export Dropdown */}
              <div className="relative">
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm border-none cursor-pointer"
                >
                  <option value="css">CSS Variables</option>
                  <option value="json">JSON</option>
                  <option value="tailwind">Tailwind Config</option>
                </select>
              </div>

              <button
                onClick={exportCSS}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                {copied ? <Check size={18} /> : <Download size={18} />}
                {copied ? 'Copied!' : 'Export'}
              </button>

              {/* Import */}
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
                onClick={resetConfig}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${mode === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
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
        <aside className={`w-80 ${mode === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r h-[calc(100vh-73px)] overflow-y-auto sticky top-[73px]`}>
          <div className="p-6 space-y-6">
            {/* Presets */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-lg font-semibold ${mode === 'dark' ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                  <Star size={18} />
                  Presets
                </h3>
                <button
                  onClick={() => setShowPresetModal(true)}
                  className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                  title="Save current as preset"
                >
                  <Save size={16} className={mode === 'dark' ? 'text-gray-300' : 'text-gray-600'} />
                </button>
              </div>
              <div className="space-y-2">
                {/* Presets predefinidos */}
                {Object.entries(PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => loadPreset(key)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${mode === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                  >
                    {preset.name}
                  </button>
                ))}
                {/* Presets guardados */}
                {Object.entries(savedPresets).map(([key, preset]) => (
                  <div key={key} className="flex gap-1">
                    <button
                      onClick={() => loadPreset(key)}
                      className={`flex-1 text-left px-3 py-2 rounded-lg text-sm transition-colors ${mode === 'dark' ? 'bg-purple-900/30 hover:bg-purple-900/50 text-purple-200' : 'bg-purple-100 hover:bg-purple-200 text-purple-700'}`}
                    >
                      ⭐ {preset.name}
                    </button>
                    <button
                      onClick={() => deletePreset(key)}
                      className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30"
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
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
                Generate Palette
              </button>

              {showPaletteGenerator && (
                <div className={`mt-3 p-4 rounded-lg ${mode === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <label className={`block text-sm font-medium mb-2 ${mode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Base Color
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
                      className={`flex-1 px-3 py-2 rounded font-mono text-sm ${mode === 'dark' ? 'bg-gray-600 text-white border-gray-500' : 'bg-white text-gray-900 border-gray-300'} border`}
                    />
                  </div>
                  <button
                    onClick={applyGeneratedPalette}
                    className="w-full px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    Apply Generated Palette
                  </button>
                </div>
              )}
            </section>

            {/* Tabs */}
            <div className="flex border-b border-gray-300 dark:border-gray-700">
              {[
                { key: 'colors', label: 'Colors', icon: Palette },
                { key: 'shadows', label: 'Shadows' },
                { key: 'radius', label: 'Radius' },
                { key: 'fonts', label: 'Fonts' }
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${activeTab === tab.key ? `border-b-2 ${mode === 'dark' ? 'border-blue-400 text-blue-400' : 'border-blue-500 text-blue-600'}` : `${mode === 'dark' ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-700'}`}`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Colores */}
            {activeTab === 'colors' && (
              <section className="space-y-3">
                {Object.entries(config.colors).map(([key, value]) => (
                  <div key={key}>
                    <label className={`block text-sm font-medium mb-1 capitalize ${mode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {key}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => updateConfig('colors', key, e.target.value)}
                        className="w-12 h-10 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => updateConfig('colors', key, e.target.value)}
                        className={`flex-1 px-3 py-2 rounded font-mono text-sm ${mode === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
                      />
                    </div>
                  </div>
                ))}
              </section>
            )}

            {/* Sombras */}
            {activeTab === 'shadows' && (
              <section className="space-y-3">
                {Object.entries(config.shadows).map(([key, value]) => (
                  <div key={key}>
                    <label className={`block text-sm font-medium mb-1 capitalize ${mode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      shadow-{key}
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateConfig('shadows', key, e.target.value)}
                      className={`w-full px-3 py-2 rounded font-mono text-xs ${mode === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
                    />
                  </div>
                ))}
              </section>
            )}

            {/* Border Radius */}
            {activeTab === 'radius' && (
              <section className="space-y-3">
                {Object.entries(config.radius).map(([key, value]) => (
                  <div key={key}>
                    <label className={`block text-sm font-medium mb-1 capitalize ${mode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      radius-{key}
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateConfig('radius', key, e.target.value)}
                      className={`w-full px-3 py-2 rounded font-mono text-sm ${mode === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
                    />
                  </div>
                ))}
              </section>
            )}

            {/* Font Sizes */}
            {activeTab === 'fonts' && (
              <section className="space-y-3">
                {Object.entries(config.fonts).map(([key, value]) => (
                  <div key={key}>
                    <label className={`block text-sm font-medium mb-1 capitalize ${mode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      font-{key}
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateConfig('fonts', key, e.target.value)}
                      className={`w-full px-3 py-2 rounded font-mono text-sm ${mode === 'dark' ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'} border`}
                    />
                  </div>
                ))}
              </section>
            )}
          </div>
        </aside>

        {/* Showcase de Componentes */}
        <main className={`flex-1 p-8 overflow-y-auto ${compareMode ? 'grid grid-cols-2 gap-8' : ''}`}>
          {/* Vista normal o lado izquierdo del compare */}
          <ComponentShowcase mode={mode} config={config} title={compareMode ? "Current Config" : null} />

          {/* Vista derecha del compare */}
          {compareMode && (
            <ComponentShowcase mode={mode} config={compareConfig} title="Comparison" />
          )}
        </main>
      </div>

      {/* Toast flotante */}
      {showToast && (
        <div
          className="fixed bottom-6 right-6 px-6 py-4 bg-gray-900 text-white flex items-center gap-3 animate-slide-up z-50"
          style={{
            borderRadius: 'var(--lab-radius-lg)',
            boxShadow: 'var(--lab-shadow-2xl)'
          }}
        >
          <CheckCircle size={20} style={{ color: 'var(--lab-success)' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modal para guardar preset */}
      <BaseModal
        isOpen={showPresetModal}
        onClose={() => setShowPresetModal(false)}
        title="Save Preset"
        size="sm"
        footer={
          <>
            <BaseButton
              onClick={() => setShowPresetModal(false)}
              variant="ghost"
            >
              Cancel
            </BaseButton>
            <BaseButton
              onClick={savePreset}
              variant="primary"
            >
              Save
            </BaseButton>
          </>
        }
      >
        <input
          type="text"
          value={presetName}
          onChange={(e) => setPresetName(e.target.value)}
          placeholder="Enter preset name..."
          className={`w-full px-4 py-2 rounded-lg border ${mode === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          onKeyPress={(e) => e.key === 'Enter' && savePreset()}
        />
      </BaseModal>
    </div>
  );
}

/**
 * Componente de showcase reutilizable para modo normal y compare
 */
function ComponentShowcase({ mode, config, title }) {
  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {title && (
        <h2 className={`text-2xl font-bold mb-6 ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          {title}
        </h2>
      )}

      {/* Navbar Demo */}
      <section>
        <h2 className={`text-2xl font-bold mb-4 ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>Navbar</h2>
        <div
          className="rounded-lg overflow-hidden"
          style={{ boxShadow: `var(--lab-shadow-md)`, borderRadius: `var(--lab-radius-lg)` }}
        >
          <nav className={`px-6 py-4 flex items-center justify-between ${mode === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center gap-4">
              <Menu size={24} className={mode === 'dark' ? 'text-gray-300' : 'text-gray-700'} />
              <span className="text-xl font-bold" style={{ color: 'var(--lab-primary)' }}>
                XIWEN
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button className={`p-2 rounded-lg transition-colors ${mode === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                <Bell size={20} className={mode === 'dark' ? 'text-gray-300' : 'text-gray-700'} />
              </button>
              <button className={`p-2 rounded-lg transition-colors ${mode === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
                <User size={20} className={mode === 'dark' ? 'text-gray-300' : 'text-gray-700'} />
              </button>
            </div>
          </nav>
        </div>
      </section>

      {/* Botones */}
      <section>
        <h2 className={`text-2xl font-bold mb-4 ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>Botones</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { type: 'primary', label: 'Primary' },
            { type: 'secondary', label: 'Secondary' },
            { type: 'accent', label: 'Accent' },
            { type: 'success', label: 'Success' },
            { type: 'warning', label: 'Warning' },
            { type: 'error', label: 'Error' },
          ].map(btn => (
            <div key={btn.type} className="space-y-2">
              <p className={`text-sm font-medium ${mode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{btn.label}</p>
              <button
                className="w-full px-4 py-2 text-white font-medium transition-opacity hover:opacity-90"
                style={{
                  backgroundColor: `var(--lab-${btn.type})`,
                  borderRadius: 'var(--lab-radius-md)',
                  boxShadow: 'var(--lab-shadow-sm)'
                }}
              >
                {btn.label}
              </button>
            </div>
          ))}

          {/* Loading */}
          <div className="space-y-2">
            <p className={`text-sm font-medium ${mode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Loading</p>
            <button
              className="w-full px-4 py-2 text-white font-medium flex items-center justify-center gap-2"
              style={{
                backgroundColor: 'var(--lab-primary)',
                borderRadius: 'var(--lab-radius-md)',
                boxShadow: 'var(--lab-shadow-sm)'
              }}
            >
              <Loader2 size={16} className="animate-spin" />
              Loading
            </button>
          </div>

          {/* Disabled */}
          <div className="space-y-2">
            <p className={`text-sm font-medium ${mode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Disabled</p>
            <button
              disabled
              className="w-full px-4 py-2 text-white font-medium opacity-50 cursor-not-allowed"
              style={{
                backgroundColor: 'var(--lab-neutral)',
                borderRadius: 'var(--lab-radius-md)',
                boxShadow: 'var(--lab-shadow-sm)'
              }}
            >
              Disabled
            </button>
          </div>
        </div>
      </section>

      {/* Inputs */}
      <section>
        <h2 className={`text-2xl font-bold mb-4 ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>Inputs</h2>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className={`block text-sm font-medium ${mode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Normal Input
            </label>
            <input
              type="text"
              placeholder="Enter text..."
              className={`w-full px-4 py-2 border ${mode === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              style={{ borderRadius: 'var(--lab-radius-md)' }}
            />
          </div>

          <div className="space-y-2">
            <label className={`block text-sm font-medium ${mode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Error State
            </label>
            <input
              type="text"
              placeholder="Error state"
              className={`w-full px-4 py-2 border-2 ${mode === 'dark' ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'}`}
              style={{
                borderRadius: 'var(--lab-radius-md)',
                borderColor: 'var(--lab-error)'
              }}
            />
            <p className="text-sm" style={{ color: 'var(--lab-error)' }}>
              Este campo es requerido
            </p>
          </div>
        </div>
      </section>

      {/* Cards */}
      <section>
        <h2 className={`text-2xl font-bold mb-4 ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>Cards</h2>
        <div className="grid grid-cols-3 gap-6">
          {['sm', 'md', 'lg'].map(shadow => (
            <div
              key={shadow}
              className={`p-6 ${mode === 'dark' ? 'bg-gray-800' : 'bg-white'}`}
              style={{
                borderRadius: 'var(--lab-radius-lg)',
                boxShadow: `var(--lab-shadow-${shadow})`
              }}
            >
              <h3 className={`text-lg font-semibold mb-2 ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Shadow {shadow}
              </h3>
              <p className={`text-sm ${mode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Card con shadow-{shadow}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Table */}
      <section>
        <h2 className={`text-2xl font-bold mb-4 ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>Table</h2>
        <div
          className={`rounded-lg overflow-hidden ${mode === 'dark' ? 'bg-gray-800' : 'bg-white'}`}
          style={{ boxShadow: 'var(--lab-shadow-md)' }}
        >
          <table className="w-full">
            <thead className={mode === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}>
              <tr>
                <th className={`px-4 py-3 text-left text-sm font-semibold ${mode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Name</th>
                <th className={`px-4 py-3 text-left text-sm font-semibold ${mode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Email</th>
                <th className={`px-4 py-3 text-left text-sm font-semibold ${mode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'John Doe', email: 'john@example.com', status: 'active' },
                { name: 'Jane Smith', email: 'jane@example.com', status: 'pending' },
                { name: 'Bob Johnson', email: 'bob@example.com', status: 'inactive' }
              ].map((row, i) => (
                <tr key={i} className={mode === 'dark' ? 'border-gray-700' : 'border-gray-200'}>
                  <td className={`px-4 py-3 ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>{row.name}</td>
                  <td className={`px-4 py-3 ${mode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{row.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className="px-3 py-1 text-xs font-semibold text-white"
                      style={{
                        backgroundColor: row.status === 'active' ? 'var(--lab-success)' : row.status === 'pending' ? 'var(--lab-warning)' : 'var(--lab-neutral)',
                        borderRadius: 'var(--lab-radius-xl)'
                      }}
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

      {/* Progress Bars */}
      <section>
        <h2 className={`text-2xl font-bold mb-4 ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>Progress Bars</h2>
        <div className="space-y-4">
          {[
            { value: 75, color: 'primary', label: 'Primary - 75%' },
            { value: 50, color: 'success', label: 'Success - 50%' },
            { value: 30, color: 'warning', label: 'Warning - 30%' },
          ].map((bar, i) => (
            <div key={i}>
              <div className="flex justify-between mb-1">
                <span className={`text-sm font-medium ${mode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {bar.label}
                </span>
              </div>
              <div
                className={`w-full h-2 ${mode === 'dark' ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}
                style={{ borderRadius: 'var(--lab-radius-xl)' }}
              >
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${bar.value}%`,
                    backgroundColor: `var(--lab-${bar.color})`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Badges */}
      <section>
        <h2 className={`text-2xl font-bold mb-4 ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>Badges</h2>
        <div className="flex flex-wrap gap-3">
          {Object.keys(config.colors).map(color => (
            <span
              key={color}
              className="px-3 py-1 text-xs font-semibold text-white capitalize"
              style={{
                backgroundColor: `var(--lab-${color})`,
                borderRadius: 'var(--lab-radius-xl)'
              }}
            >
              {color}
            </span>
          ))}
        </div>
      </section>

      {/* Alerts */}
      <section>
        <h2 className={`text-2xl font-bold mb-4 ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>Alerts</h2>
        <div className="space-y-4">
          {[
            { type: 'success', icon: CheckCircle, title: 'Success!', message: 'Your changes have been saved.' },
            { type: 'warning', icon: AlertCircle, title: 'Warning', message: 'Please review your input.' },
            { type: 'error', icon: XCircle, title: 'Error', message: 'Something went wrong.' },
          ].map(alert => (
            <div
              key={alert.type}
              className="p-4 flex items-start gap-3"
              style={{
                backgroundColor: `var(--lab-${alert.type})15`,
                border: `1px solid var(--lab-${alert.type})`,
                borderRadius: 'var(--lab-radius-lg)'
              }}
            >
              <alert.icon size={20} style={{ color: `var(--lab-${alert.type})`, flexShrink: 0 }} />
              <div>
                <p className="font-semibold" style={{ color: `var(--lab-${alert.type})` }}>
                  {alert.title}
                </p>
                <p className={`text-sm ${mode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {alert.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Form Demo */}
      <section>
        <h2 className={`text-2xl font-bold mb-4 ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>Form Example</h2>
        <div
          className={`p-6 ${mode === 'dark' ? 'bg-gray-800' : 'bg-white'}`}
          style={{
            borderRadius: 'var(--lab-radius-lg)',
            boxShadow: 'var(--lab-shadow-lg)'
          }}
        >
          <h3 className={`text-lg font-semibold mb-4 ${mode === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Contact Form
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${mode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                First Name
              </label>
              <input
                type="text"
                placeholder="John"
                className={`w-full px-4 py-2 border ${mode === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                style={{ borderRadius: 'var(--lab-radius-md)' }}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${mode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Last Name
              </label>
              <input
                type="text"
                placeholder="Doe"
                className={`w-full px-4 py-2 border ${mode === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                style={{ borderRadius: 'var(--lab-radius-md)' }}
              />
            </div>
          </div>
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-1 ${mode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Email
            </label>
            <input
              type="email"
              placeholder="john@example.com"
              className={`w-full px-4 py-2 border ${mode === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              style={{ borderRadius: 'var(--lab-radius-md)' }}
            />
          </div>
          <div className="mb-4">
            <label className={`block text-sm font-medium mb-1 ${mode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Message
            </label>
            <textarea
              placeholder="Your message..."
              rows={4}
              className={`w-full px-4 py-2 border ${mode === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              style={{ borderRadius: 'var(--lab-radius-md)' }}
            />
          </div>
          <button
            className="w-full px-4 py-3 text-white font-medium"
            style={{
              backgroundColor: 'var(--lab-primary)',
              borderRadius: 'var(--lab-radius-md)',
              boxShadow: 'var(--lab-shadow-md)'
            }}
          >
            Submit Form
          </button>
        </div>
      </section>
    </div>
  );
}

export default ThemeBuilder;
