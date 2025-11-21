/**
 * @fileoverview Personalizador de colores de temas
 * @module components/ThemeCustomizer
 */

import logger from '../utils/logger';
import { useState, useEffect } from 'react';
import { Palette, RotateCcw, Download, Upload, Check } from 'lucide-react';
import { THEMES, THEME_INFO, useTheme } from '../contexts/ThemeContext';
import BaseButton from './common/BaseButton';

// Colores por defecto de cada tema (4 temas neutrales y minimalistas)
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
    // Semánticos (colores apagados y sobrios)
    'success': '#4a9f7c',
    'error': '#c85a54',
    'warning': '#d4a574',
    'info': '#5b8fa3',
    // Acento (gris azulado neutral)
    'accent': '#5b6b8f',
    // Tailwind Classes (AHORA siguen al tema dinámicamente)
    'tailwind-accent': '#5b6b8f',      // Sigue al acento del tema
    'tailwind-secondary': '#4a9f7c',   // Sigue al color success
  },
  dark: {
    // Fondos
    'bg-primary': '#111827',
    'bg-secondary': '#1f2937',
    'bg-tertiary': '#374151',
    'bg-hover': '#4b5563',
    // Textos
    'text-primary': '#f4f4f5',
    'text-secondary': '#a1a1aa',
    'text-muted': '#71717a',
    // Bordes
    'border': '#374151',
    'border-focus': '#4b5563',
    // Semánticos (mismos colores apagados que light)
    'success': '#4a9f7c',
    'error': '#c85a54',
    'warning': '#d4a574',
    'info': '#5b8fa3',
    // Acento (azul gris suave)
    'accent': '#7a8fa8',
    // Tailwind Classes (AHORA siguen al tema dinámicamente)
    'tailwind-accent': '#7a8fa8',      // Sigue al acento del tema DARK
    'tailwind-secondary': '#4a9f7c',   // Sigue al color success
  },
  dusk: {
    // Fondos (tonos tierra neutros)
    'bg-primary': '#f7f4f1',
    'bg-secondary': '#ebe6e0',
    'bg-tertiary': '#dfd9d1',
    'bg-hover': '#d3cdc5',
    // Textos (marrones suaves)
    'text-primary': '#2a2420',
    'text-secondary': '#6a615a',
    'text-muted': '#8f8580',
    // Bordes (tierra sutiles)
    'border': '#dfd9d1',
    'border-focus': '#d3cdc5',
    // Semánticos (mismos colores apagados)
    'success': '#4a9f7c',
    'error': '#c85a54',
    'warning': '#d4a574',
    'info': '#5b8fa3',
    // Acento (marrón cálido)
    'accent': '#a67c52',
    // Tailwind Classes (AHORA siguen al tema dinámicamente)
    'tailwind-accent': '#a67c52',      // Sigue al acento del tema DUSK
    'tailwind-secondary': '#4a9f7c',   // Sigue al color success
  },
  night: {
    // Fondos (azul gris oscuro)
    'bg-primary': '#0f1419',
    'bg-secondary': '#1a2128',
    'bg-tertiary': '#242c35',
    'bg-hover': '#2e3842',
    // Textos (gris claro)
    'text-primary': '#e3e8ee',
    'text-secondary': '#8b93a1',
    'text-muted': '#6b7280',
    // Bordes (azul gris sutiles)
    'border': '#242c35',
    'border-focus': '#2e3842',
    // Semánticos (mismos colores apagados)
    'success': '#4a9f7c',
    'error': '#c85a54',
    'warning': '#d4a574',
    'info': '#5b8fa3',
    // Acento (azul grisáceo)
    'accent': '#7a95b8',
    // Tailwind Classes (AHORA siguen al tema dinámicamente)
    'tailwind-accent': '#7a95b8',      // Sigue al acento del tema NIGHT
    'tailwind-secondary': '#4a9f7c',   // Sigue al color success
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
    label: 'Semánticos (CSS Variables)',
    icon: '🎯',
    colors: ['success', 'error', 'warning', 'info']
  },
  accent: {
    label: 'Acento Principal',
    icon: '✨',
    colors: ['accent']
  },
  tailwind: {
    label: 'Tailwind Classes (bg-*, text-*, border-*)',
    icon: '⚡',
    description: '✅ ACTUALIZADOS: Ahora estos colores SIGUEN al tema activo dinámicamente. Las clases de Tailwind como bg-accent, text-secondary ahora cambiarán automáticamente cuando cambies de tema.',
    colors: ['tailwind-accent', 'tailwind-secondary']
  }
};

/**
 * Componente para personalizar colores de temas
 */
function ThemeCustomizer() {
  const { currentTheme, setTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState(currentTheme || THEMES.DARK);
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
    const newCustomColors = {
      ...customColors,
      [selectedTheme]: {
        ...(customColors[selectedTheme] || {}),
        [colorKey]: value
      }
    };

    setCustomColors(newCustomColors);
    setHasChanges(true);

    // Aplicar inmediatamente si es el tema activo (para preview en tiempo real)
    const isCurrentTheme = document.documentElement.classList.contains(selectedTheme);
    if (isCurrentTheme) {
      const root = document.documentElement;
      root.style.setProperty(`--color-${colorKey}`, value);
    }
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
          <BaseButton
            variant="ghost"
            size="sm"
            onClick={exportConfig}
            title="Exportar configuración"
            icon={Download}
          >
            Exportar
          </BaseButton>
          <label title="Importar configuración" style={{ cursor: 'pointer' }}>
            <BaseButton
              variant="ghost"
              size="sm"
              icon={Upload}
              as="span"
            >
              Importar
            </BaseButton>
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
                    setTheme(value); // Cambiar tema globalmente
                    setHasChanges(false);
                  }
                } else {
                  setSelectedTheme(value);
                  setTheme(value); // Cambiar tema globalmente
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
          <BaseButton
            variant="ghost"
            size="sm"
            onClick={resetTheme}
            title="Resetear a valores por defecto"
            icon={RotateCcw}
          >
            Resetear
          </BaseButton>
        </div>

        {/* Categorías de colores */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {Object.entries(COLOR_CATEGORIES).map(([categoryKey, category]) => (
            <div key={categoryKey} className="color-category">
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: 'var(--color-text-primary)',
                marginBottom: category.description ? '8px' : '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span>{category.icon}</span>
                {category.label}
              </h4>

              {/* Descripción opcional */}
              {category.description && (
                <div style={{
                  padding: '12px',
                  marginBottom: '16px',
                  borderRadius: '8px',
                  background: 'var(--color-warning-bg)',
                  border: '1px solid var(--color-warning-border)',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'start'
                }}>
                  <span style={{ color: 'var(--color-warning)', fontSize: '18px', flexShrink: 0 }}>⚠️</span>
                  <p style={{
                    margin: 0,
                    fontSize: '13px',
                    color: 'var(--color-text-primary)',
                    lineHeight: '1.5'
                  }}>
                    <strong>Importante:</strong> {category.description}
                  </p>
                </div>
              )}

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
          <BaseButton
            variant="ghost"
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
          </BaseButton>
          <BaseButton
            variant="primary"
            onClick={saveChanges}
            icon={Check}
          >
            Guardar cambios
          </BaseButton>
        </div>
      )}
    </div>
  );
}

export default ThemeCustomizer;
