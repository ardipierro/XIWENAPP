/**
 * @fileoverview Design System Tester - Laboratorio de diseño interactivo
 * @module components/DesignLab
 */

import { useState, useEffect } from 'react';
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
  Check
} from 'lucide-react';

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

/**
 * Design System Tester - Laboratorio visual interactivo
 */
function DesignLab() {
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('designLabConfig');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  const [showToast, setShowToast] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

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

  // Actualizar un valor
  const updateConfig = (category, key, value) => {
    setConfig(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  // Resetear a defaults
  const resetConfig = () => {
    if (confirm('¿Resetear todos los valores a los defaults?')) {
      setConfig(DEFAULT_CONFIG);
      localStorage.removeItem('designLabConfig');
    }
  };

  // Exportar CSS
  const exportCSS = () => {
    const css = `/* Exported from Design Lab */
:root {
  /* Colors */
${Object.entries(config.colors).map(([key, value]) => `  --color-${key}: ${value};`).join('\n')}

  /* Shadows */
${Object.entries(config.shadows).map(([key, value]) => `  --shadow-${key}: ${value};`).join('\n')}

  /* Border Radius */
${Object.entries(config.radius).map(([key, value]) => `  --radius-${key}: ${value};`).join('\n')}

  /* Font Sizes */
${Object.entries(config.fonts).map(([key, value]) => `  --font-${key}: ${value};`).join('\n')}
}`;

    navigator.clipboard.writeText(css);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Palette size={28} style={{ color: 'var(--lab-primary)' }} />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Design System Tester
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Ajusta y visualiza tu sistema de diseño en tiempo real
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportCSS}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                {copied ? <Check size={18} /> : <Download size={18} />}
                {copied ? 'Copiado!' : 'Export CSS'}
              </button>
              <button
                onClick={resetConfig}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
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
        <aside className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 h-[calc(100vh-73px)] overflow-y-auto sticky top-[73px]">
          <div className="p-6 space-y-8">
            {/* Colores */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                🎨 Colores
              </h3>
              <div className="space-y-3">
                {Object.entries(config.colors).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 capitalize">
                      {key}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={value}
                        onChange={(e) => updateConfig('colors', key, e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => updateConfig('colors', key, e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Sombras */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                ☁️ Sombras
              </h3>
              <div className="space-y-3">
                {Object.entries(config.shadows).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 capitalize">
                      shadow-{key}
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateConfig('shadows', key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs font-mono"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Border Radius */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                📐 Border Radius
              </h3>
              <div className="space-y-3">
                {Object.entries(config.radius).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 capitalize">
                      radius-{key}
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateConfig('radius', key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono"
                    />
                  </div>
                ))}
              </div>
            </section>

            {/* Font Sizes */}
            <section>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                📝 Font Sizes
              </h3>
              <div className="space-y-3">
                {Object.entries(config.fonts).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 capitalize">
                      font-{key}
                    </label>
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateConfig('fonts', key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono"
                    />
                  </div>
                ))}
              </div>
            </section>
          </div>
        </aside>

        {/* Showcase de Componentes */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto space-y-12">
            {/* Navbar Demo */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Navbar</h2>
              <div
                className="rounded-lg overflow-hidden"
                style={{ boxShadow: `var(--lab-shadow-md)`, borderRadius: `var(--lab-radius-lg)` }}
              >
                <nav className="px-6 py-4 bg-white dark:bg-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Menu size={24} className="text-gray-700 dark:text-gray-300" />
                    <span className="text-xl font-bold" style={{ color: 'var(--lab-primary)' }}>
                      XIWEN
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <Bell size={20} className="text-gray-700 dark:text-gray-300" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                      <User size={20} className="text-gray-700 dark:text-gray-300" />
                    </button>
                  </div>
                </nav>
              </div>
            </section>

            {/* Botones */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Botones</h2>
              <div className="grid grid-cols-3 gap-4">
                {/* Primary */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Primary</p>
                  <button
                    className="w-full px-4 py-2 text-white font-medium transition-opacity hover:opacity-90"
                    style={{
                      backgroundColor: 'var(--lab-primary)',
                      borderRadius: 'var(--lab-radius-md)',
                      boxShadow: 'var(--lab-shadow-sm)'
                    }}
                  >
                    Button
                  </button>
                </div>

                {/* Disabled */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Disabled</p>
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

                {/* Loading */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Loading</p>
                  <button
                    className="w-full px-4 py-2 text-white font-medium flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: 'var(--lab-secondary)',
                      borderRadius: 'var(--lab-radius-md)',
                      boxShadow: 'var(--lab-shadow-sm)'
                    }}
                  >
                    <Loader2 size={16} className="animate-spin" />
                    Loading...
                  </button>
                </div>

                {/* Success */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success</p>
                  <button
                    className="w-full px-4 py-2 text-white font-medium transition-opacity hover:opacity-90"
                    style={{
                      backgroundColor: 'var(--lab-success)',
                      borderRadius: 'var(--lab-radius-md)',
                      boxShadow: 'var(--lab-shadow-sm)'
                    }}
                  >
                    Success
                  </button>
                </div>

                {/* Warning */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Warning</p>
                  <button
                    className="w-full px-4 py-2 text-white font-medium transition-opacity hover:opacity-90"
                    style={{
                      backgroundColor: 'var(--lab-warning)',
                      borderRadius: 'var(--lab-radius-md)',
                      boxShadow: 'var(--lab-shadow-sm)'
                    }}
                  >
                    Warning
                  </button>
                </div>

                {/* Error */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Error</p>
                  <button
                    className="w-full px-4 py-2 text-white font-medium transition-opacity hover:opacity-90"
                    style={{
                      backgroundColor: 'var(--lab-error)',
                      borderRadius: 'var(--lab-radius-md)',
                      boxShadow: 'var(--lab-shadow-sm)'
                    }}
                  >
                    Error
                  </button>
                </div>
              </div>
            </section>

            {/* Inputs */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Inputs</h2>
              <div className="grid grid-cols-2 gap-6">
                {/* Normal */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Normal Input
                  </label>
                  <input
                    type="text"
                    placeholder="Enter text..."
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                    style={{ borderRadius: 'var(--lab-radius-md)' }}
                  />
                </div>

                {/* Focused */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Focused Input
                  </label>
                  <input
                    type="text"
                    placeholder="Focused state"
                    autoFocus
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border-2 text-gray-900 dark:text-white"
                    style={{
                      borderRadius: 'var(--lab-radius-md)',
                      borderColor: 'var(--lab-accent)',
                      boxShadow: `0 0 0 3px var(--lab-accent)33`
                    }}
                  />
                </div>

                {/* Error */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Error State
                  </label>
                  <input
                    type="text"
                    placeholder="Error state"
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border-2 text-gray-900 dark:text-white"
                    style={{
                      borderRadius: 'var(--lab-radius-md)',
                      borderColor: 'var(--lab-error)'
                    }}
                  />
                  <p className="text-sm" style={{ color: 'var(--lab-error)' }}>
                    Este campo es requerido
                  </p>
                </div>

                {/* Success */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Success State
                  </label>
                  <input
                    type="text"
                    value="Valid input"
                    readOnly
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border-2 text-gray-900 dark:text-white"
                    style={{
                      borderRadius: 'var(--lab-radius-md)',
                      borderColor: 'var(--lab-success)'
                    }}
                  />
                  <p className="text-sm flex items-center gap-1" style={{ color: 'var(--lab-success)' }}>
                    <CheckCircle size={16} /> Campo válido
                  </p>
                </div>
              </div>
            </section>

            {/* Cards */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Cards</h2>
              <div className="grid grid-cols-3 gap-6">
                {['sm', 'md', 'lg'].map(shadow => (
                  <div
                    key={shadow}
                    className="p-6 bg-white dark:bg-gray-800"
                    style={{
                      borderRadius: 'var(--lab-radius-lg)',
                      boxShadow: `var(--lab-shadow-${shadow})`
                    }}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Shadow {shadow}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Este card usa shadow-{shadow} para darle profundidad visual.
                    </p>
                    <button
                      className="mt-4 px-4 py-2 text-white text-sm font-medium"
                      style={{
                        backgroundColor: 'var(--lab-primary)',
                        borderRadius: 'var(--lab-radius-sm)'
                      }}
                    >
                      Action
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Badges */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Badges</h2>
              <div className="flex flex-wrap gap-3">
                <span
                  className="px-3 py-1 text-xs font-semibold text-white"
                  style={{
                    backgroundColor: 'var(--lab-primary)',
                    borderRadius: 'var(--lab-radius-xl)'
                  }}
                >
                  Primary
                </span>
                <span
                  className="px-3 py-1 text-xs font-semibold text-white"
                  style={{
                    backgroundColor: 'var(--lab-secondary)',
                    borderRadius: 'var(--lab-radius-xl)'
                  }}
                >
                  Secondary
                </span>
                <span
                  className="px-3 py-1 text-xs font-semibold text-white"
                  style={{
                    backgroundColor: 'var(--lab-success)',
                    borderRadius: 'var(--lab-radius-xl)'
                  }}
                >
                  Success
                </span>
                <span
                  className="px-3 py-1 text-xs font-semibold text-white"
                  style={{
                    backgroundColor: 'var(--lab-warning)',
                    borderRadius: 'var(--lab-radius-xl)'
                  }}
                >
                  Warning
                </span>
                <span
                  className="px-3 py-1 text-xs font-semibold text-white"
                  style={{
                    backgroundColor: 'var(--lab-error)',
                    borderRadius: 'var(--lab-radius-xl)'
                  }}
                >
                  Error
                </span>
                <span
                  className="px-3 py-1 text-xs font-semibold text-white"
                  style={{
                    backgroundColor: 'var(--lab-accent)',
                    borderRadius: 'var(--lab-radius-xl)'
                  }}
                >
                  Accent
                </span>
              </div>
            </section>

            {/* Loaders */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Loaders</h2>
              <div className="flex gap-8 items-center">
                <div
                  className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 rounded-full animate-spin"
                  style={{ borderTopColor: 'var(--lab-primary)' }}
                />
                <div
                  className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 rounded-full animate-spin"
                  style={{ borderTopColor: 'var(--lab-accent)' }}
                />
                <div
                  className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 rounded-full animate-spin"
                  style={{ borderTopColor: 'var(--lab-success)' }}
                />
                <Loader2 size={48} className="animate-spin" style={{ color: 'var(--lab-warning)' }} />
              </div>
            </section>

            {/* Modal Demo */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Modal</h2>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 text-white font-medium"
                style={{
                  backgroundColor: 'var(--lab-primary)',
                  borderRadius: 'var(--lab-radius-md)'
                }}
              >
                Open Modal
              </button>

              {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div
                    className="bg-white dark:bg-gray-800 w-full max-w-md"
                    style={{
                      borderRadius: 'var(--lab-radius-xl)',
                      boxShadow: 'var(--lab-shadow-2xl)'
                    }}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Modal Title
                      </h3>
                      <button
                        onClick={() => setShowModal(false)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      >
                        <X size={20} className="text-gray-500 dark:text-gray-400" />
                      </button>
                    </div>

                    {/* Body */}
                    <div className="p-6">
                      <p className="text-gray-600 dark:text-gray-400">
                        Este es el contenido del modal. Puedes poner cualquier cosa aquí.
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => setShowModal(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium"
                        style={{ borderRadius: 'var(--lab-radius-md)' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => setShowModal(false)}
                        className="flex-1 px-4 py-2 text-white font-medium"
                        style={{
                          backgroundColor: 'var(--lab-primary)',
                          borderRadius: 'var(--lab-radius-md)'
                        }}
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Dropdown Demo */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Dropdown</h2>
              <div className="relative inline-block">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium flex items-center gap-2"
                  style={{ borderRadius: 'var(--lab-radius-md)' }}
                >
                  <Settings size={18} />
                  Options
                </button>

                {showDropdown && (
                  <div
                    className="absolute top-full mt-2 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 min-w-[200px]"
                    style={{
                      borderRadius: 'var(--lab-radius-lg)',
                      boxShadow: 'var(--lab-shadow-xl)'
                    }}
                  >
                    <div className="py-2">
                      <button className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                        <User size={16} />
                        Profile
                      </button>
                      <button className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                        <Settings size={16} />
                        Settings
                      </button>
                      <hr className="my-2 border-gray-200 dark:border-gray-700" />
                      <button className="w-full px-4 py-2 text-left text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Toast Demo */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Toast</h2>
              <button
                onClick={() => {
                  setShowToast(true);
                  setTimeout(() => setShowToast(false), 3000);
                }}
                className="px-4 py-2 text-white font-medium"
                style={{
                  backgroundColor: 'var(--lab-accent)',
                  borderRadius: 'var(--lab-radius-md)'
                }}
              >
                Show Toast
              </button>
            </section>

            {/* Alerts */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Alerts</h2>
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
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {alert.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
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
          <span>Toast notification apareció!</span>
        </div>
      )}
    </div>
  );
}

export default DesignLab;
