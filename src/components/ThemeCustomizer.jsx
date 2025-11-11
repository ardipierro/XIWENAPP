/**
 * @fileoverview Personalizador de colores de temas
 * @module components/ThemeCustomizer
 */

import logger from '../utils/logger';
import { useState, useEffect } from 'react';
import { Palette, RotateCcw, Download, Upload, Check } from 'lucide-react';
import { THEMES, THEME_INFO } from '../contexts/ThemeContext';

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
    // Fondos
    'bg-primary': '#09090b',
    'bg-secondary': '#18181b',
    'bg-tertiary': '#27272a',
    'bg-hover': '#3f3f46',
    // Textos
    'text-primary': '#f4f4f5',
    'text-secondary': '#a1a1aa',
    'text-muted': '#71717a',
    // Bordes
    'border': '#27272a',
    'border-focus': '#3f3f46',
    // Semánticos
    'success': '#10b981',
    'error': '#ef4444',
    'warning': '#f59e0b',
    'info': '#06b6d4',
    // Acento
    'accent': '#6366f1',
  },
  ocean: {
    // Fondos
    'bg-primary': '#f0f9ff',
    'bg-secondary': '#e0f2fe',
    'bg-tertiary': '#bae6fd',
    'bg-hover': '#7dd3fc',
    // Textos
    'text-primary': '#0c4a6e',
    'text-secondary': '#0369a1',
    'text-muted': '#0ea5e9',
    // Bordes
    'border': '#bae6fd',
    'border-focus': '#38bdf8',
    // Semánticos
    'success': '#059669',
    'error': '#dc2626',
    'warning': '#d97706',
    'info': '#2563eb',
    // Acento
    'accent': '#0284c7',
  },
  forest: {
    // Fondos
    'bg-primary': '#f0fdf4',
    'bg-secondary': '#dcfce7',
    'bg-tertiary': '#bbf7d0',
    'bg-hover': '#86efac',
    // Textos
    'text-primary': '#14532d',
    'text-secondary': '#15803d',
    'text-muted': '#22c55e',
    // Bordes
    'border': '#bbf7d0',
    'border-focus': '#4ade80',
    // Semánticos
    'success': '#16a34a',
    'error': '#dc2626',
    'warning': '#d97706',
    'info': '#0891b2',
    // Acento
    'accent': '#16a34a',
  },
  sunset: {
    // Fondos
    'bg-primary': '#fff7ed',
    'bg-secondary': '#ffedd5',
    'bg-tertiary': '#fed7aa',
    'bg-hover': '#fdba74',
    // Textos
    'text-primary': '#7c2d12',
    'text-secondary': '#c2410c',
    'text-muted': '#f97316',
    // Bordes
    'border': '#fed7aa',
    'border-focus': '#fb923c',
    // Semánticos
    'success': '#16a34a',
    'error': '#dc2626',
    'warning': '#ea580c',
    'info': '#0891b2',
    // Acento
    'accent': '#ea580c',
  },
  midnight: {
    // Fondos
    'bg-primary': '#0c1221',
    'bg-secondary': '#0f172a',
    'bg-tertiary': '#1e293b',
    'bg-hover': '#334155',
    // Textos
    'text-primary': '#f1f5f9',
    'text-secondary': '#94a3b8',
    'text-muted': '#64748b',
    // Bordes
    'border': '#1e293b',
    'border-focus': '#475569',
    // Semánticos
    'success': '#10b981',
    'error': '#ef4444',
    'warning': '#f59e0b',
    'info': '#06b6d4',
    // Acento
    'accent': '#3b82f6',
  }
};

// Categorías de colores para mejor organización
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
 * Componente para personalizar colores de temas
 */
function ThemeCustomizer() {
  const [selectedTheme, setSelectedTheme] = useState(THEMES.DARK);
  const [customColors, setCustomColors] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Cargar colores personalizados del localStorage
  useEffect(() => {
    const saved = localStorage.getItem('customThemeColors');
    if (saved) {
      try {
        setCustomColors(JSON.parse(saved));
      } catch (error) {
        logger.error('Error loading custom colors:', error);
      }
    }
  }, []);

  // Obtener color actual (personalizado o por defecto)
  const getColor = (colorKey) => {
    return customColors[selectedTheme]?.[colorKey] || DEFAULT_THEME_COLORS[selectedTheme][colorKey];
  };

  // Actualizar color
  const updateColor = (colorKey, value) => {
    setCustomColors(prev => ({
      ...prev,
      [selectedTheme]: {
        ...(prev[selectedTheme] || {}),
        [colorKey]: value
      }
    }));
    setHasChanges(true);
  };

  // Guardar cambios
  const saveChanges = () => {
    localStorage.setItem('customThemeColors', JSON.stringify(customColors));

    // Aplicar inmediatamente si es el tema activo
    const currentTheme = document.documentElement.classList.contains(selectedTheme);
    if (currentTheme) {
      applyCustomColors(selectedTheme, customColors[selectedTheme]);
    }

    setHasChanges(false);

    // Notificación
    alert('✅ Colores guardados correctamente');
  };

  // Aplicar colores personalizados al documento
  const applyCustomColors = (theme, colors) => {
    if (!colors) return;

    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
  };

  // Resetear tema a valores por defecto
  const resetTheme = () => {
    if (!confirm('¿Estás seguro de resetear este tema a sus colores por defecto?')) {
      return;
    }

    setCustomColors(prev => {
      const updated = { ...prev };
      delete updated[selectedTheme];
      return updated;
    });

    // Guardar inmediatamente
    const updated = { ...customColors };
    delete updated[selectedTheme];
    localStorage.setItem('customThemeColors', JSON.stringify(updated));

    // Si es el tema activo, remover estilos inline
    const currentTheme = document.documentElement.classList.contains(selectedTheme);
    if (currentTheme) {
      const root = document.documentElement;
      Object.keys(DEFAULT_THEME_COLORS[selectedTheme]).forEach(key => {
        root.style.removeProperty(`--color-${key}`);
      });
    }

    setHasChanges(false);
    alert('✅ Tema reseteado a valores por defecto');
  };

  // Exportar configuración
  const exportConfig = () => {
    const dataStr = JSON.stringify(customColors, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = 'theme-colors.json';
    link.click();

    URL.revokeObjectURL(url);
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
        localStorage.setItem('customThemeColors', JSON.stringify(imported));
        setHasChanges(false);
        alert('✅ Configuración importada correctamente');
      } catch (error) {
        alert('❌ Error al importar: archivo inválido');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="theme-customizer">
      {/* Header */}
      <div className="panel-header">
        <div>
          <h2 className="panel-title">
            <Palette size={28} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '12px' }} />
            Personalización de Colores
          </h2>
          <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px' }}>
            Personaliza los colores de cada tema para ajustarlos a tu gusto
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-ghost btn-sm" onClick={exportConfig} title="Exportar configuración">
            <Download size={16} />
            Exportar
          </button>
          <label className="btn btn-ghost btn-sm" title="Importar configuración">
            <Upload size={16} />
            Importar
            <input
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={importConfig}
            />
          </label>
        </div>
      </div>

      {/* Selector de tema */}
      <div style={{ marginBottom: '32px' }}>
        <label className="form-label">Tema a personalizar</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
          {Object.entries(THEMES).map(([key, value]) => (
            <button
              key={value}
              className={`card ${selectedTheme === value ? 'selected-theme' : ''}`}
              style={{
                padding: '16px',
                cursor: 'pointer',
                border: selectedTheme === value ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
                transition: 'all 0.2s',
              }}
              onClick={() => {
                if (hasChanges) {
                  if (confirm('Tienes cambios sin guardar. ¿Deseas continuar?')) {
                    setSelectedTheme(value);
                    setHasChanges(false);
                  }
                } else {
                  setSelectedTheme(value);
                }
              }}
            >
              <div style={{ fontWeight: '600', marginBottom: '4px', color: 'var(--color-text-primary)' }}>
                {THEME_INFO[value].name}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                {THEME_INFO[value].description}
              </div>
              {selectedTheme === value && (
                <div style={{ marginTop: '8px', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={14} />
                  <span style={{ fontSize: '12px', fontWeight: '600' }}>Seleccionado</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Editor de colores */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--color-text-primary)', margin: 0 }}>
            Colores del tema {THEME_INFO[selectedTheme].name}
          </h3>
          <button
            className="btn btn-ghost btn-sm"
            onClick={resetTheme}
            title="Resetear a valores por defecto"
          >
            <RotateCcw size={16} />
            Resetear
          </button>
        </div>

        {/* Categorías de colores */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {Object.entries(COLOR_CATEGORIES).map(([categoryKey, category]) => (
            <div key={categoryKey} className="color-category">
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: 'var(--color-text-primary)',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>{category.icon}</span>
                {category.label}
              </h4>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '16px'
              }}>
                {category.colors.map(colorKey => (
                  <div
                    key={colorKey}
                    className="color-picker-item"
                    style={{
                      padding: '16px',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      background: 'var(--color-bg-secondary)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <label style={{
                        fontWeight: '500',
                        fontSize: '14px',
                        color: 'var(--color-text-primary)',
                        fontFamily: 'monospace'
                      }}>
                        --color-{colorKey}
                      </label>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          background: getColor(colorKey),
                          border: '2px solid var(--color-border)',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="color"
                        value={getColor(colorKey)}
                        onChange={(e) => updateColor(colorKey, e.target.value)}
                        style={{
                          width: '48px',
                          height: '40px',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          padding: '4px',
                          background: 'var(--color-bg-tertiary)'
                        }}
                      />
                      <input
                        type="text"
                        value={getColor(colorKey)}
                        onChange={(e) => updateColor(colorKey, e.target.value)}
                        className="input"
                        style={{
                          flex: 1,
                          fontFamily: 'monospace',
                          fontSize: '13px'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Botones de acción */}
      {hasChanges && (
        <div
          style={{
            position: 'sticky',
            bottom: '0',
            padding: '20px',
            background: 'var(--color-bg-secondary)',
            borderTop: '2px solid var(--color-accent)',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            boxShadow: 'var(--shadow-lg)'
          }}
        >
          <button
            className="btn btn-ghost"
            onClick={() => {
              if (confirm('¿Descartar cambios?')) {
                setCustomColors(prev => {
                  const updated = { ...prev };
                  delete updated[selectedTheme];
                  return updated;
                });
                setHasChanges(false);
              }
            }}
          >
            Descartar
          </button>
          <button
            className="btn btn-primary"
            onClick={saveChanges}
          >
            <Check size={18} />
            Guardar cambios
          </button>
        </div>
      )}
    </div>
  );
}

export default ThemeCustomizer;
