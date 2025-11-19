/**
 * @fileoverview DashboardConfigTab - Configurador visual de paneles
 * Sistema de 3 columnas: Selector | Editor | Preview
 *
 * @module components/settings/DashboardConfigTab
 */

import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Settings,
  BarChart3,
  User,
  BookOpen,
  Users,
  FileText,
  Calendar,
  CheckSquare,
  MessageSquare,
  Trophy,
  DollarSign,
  Brain,
  Save,
  RotateCcw,
  Eye,
  Download,
  Upload,
  Info,
  AlertCircle,
} from 'lucide-react';
import { BaseButton, BaseBadge } from '../common';
import { useDashboardConfigContext } from '../../contexts/DashboardConfigContext';
import { availablePanels } from '../../config/dashboardConfig';

// Mapeo de iconos
const iconMap = {
  LayoutDashboard,
  Settings,
  BarChart3,
  User,
  BookOpen,
  Users,
  FileText,
  Calendar,
  CheckSquare,
  MessageSquare,
  Trophy,
  DollarSign,
  Brain,
};

/**
 * DashboardConfigTab - Configurador de paneles
 */
function DashboardConfigTab() {
  const [selectedPanel, setSelectedPanel] = useState('UniversalDashboard');
  const { config, updateProperty, resetPanelConfig, exportConfig } = useDashboardConfigContext();

  // Config del panel seleccionado
  const panelConfig = config[selectedPanel] || {};

  /**
   * Actualizar una propiedad
   */
  const updateConfig = (property, value) => {
    updateProperty(selectedPanel, property, value);
  };

  /**
   * Reset a valores por defecto
   */
  const handleReset = () => {
    if (window.confirm(`¿Resetear configuración de ${panelConfig.title || selectedPanel}?`)) {
      resetPanelConfig(selectedPanel);
    }
  };

  /**
   * Renderizar campo de configuración dinámico
   */
  const renderField = (key, value) => {
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

    // Boolean (checkbox)
    if (typeof value === 'boolean') {
      return (
        <label key={key} className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-opacity-50 transition-all" style={{ background: 'var(--color-bg-secondary)' }}>
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {label}
          </span>
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => updateConfig(key, e.target.checked)}
            className="w-4 h-4 rounded border-2 cursor-pointer"
            style={{ accentColor: 'var(--color-primary)' }}
          />
        </label>
      );
    }

    // Number (slider o input)
    if (typeof value === 'number') {
      return (
        <div key={key} className="p-3 rounded-lg" style={{ background: 'var(--color-bg-secondary)' }}>
          <label className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {label}
            </span>
            <span className="text-xs font-mono px-2 py-1 rounded" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-text-secondary)' }}>
              {value}
            </span>
          </label>
          <input
            type="range"
            min="0"
            max={key.includes('gap') || key.includes('Padding') ? 12 : 100}
            value={value}
            onChange={(e) => updateConfig(key, parseInt(e.target.value))}
            className="w-full h-2 rounded-lg cursor-pointer"
            style={{ accentColor: 'var(--color-primary)' }}
          />
        </div>
      );
    }

    // GridColumns (objeto especial)
    if (key === 'gridColumns' && typeof value === 'object') {
      return (
        <div key={key} className="p-3 rounded-lg" style={{ background: 'var(--color-bg-secondary)' }}>
          <div className="text-sm font-medium mb-3" style={{ color: 'var(--color-text-primary)' }}>
            Grid Columns (Responsive)
          </div>
          <div className="space-y-2">
            {['base', 'sm', 'md', 'lg', 'xl'].map(breakpoint => (
              <div key={breakpoint} className="flex items-center gap-3">
                <span className="text-xs font-mono w-12" style={{ color: 'var(--color-text-secondary)' }}>
                  {breakpoint}:
                </span>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={value[breakpoint] || 1}
                  onChange={(e) => updateConfig('gridColumns', { ...value, [breakpoint]: parseInt(e.target.value) })}
                  className="flex-1 h-2 rounded-lg cursor-pointer"
                  style={{ accentColor: 'var(--color-primary)' }}
                />
                <span className="text-xs font-mono w-6 text-right" style={{ color: 'var(--color-text-primary)' }}>
                  {value[breakpoint]}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // String (input o select)
    if (typeof value === 'string') {
      // Select para ciertas propiedades
      if (key === 'contentLayout') {
        return (
          <div key={key} className="p-3 rounded-lg" style={{ background: 'var(--color-bg-secondary)' }}>
            <label className="block mb-2">
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {label}
              </span>
            </label>
            <select
              value={value}
              onChange={(e) => updateConfig(key, e.target.value)}
              className="w-full px-3 py-2 rounded-lg border-2 text-sm"
              style={{
                background: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            >
              <option value="grid">Grid</option>
              <option value="list">List</option>
              <option value="table">Table</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        );
      }

      if (key === 'toolbarPosition') {
        return (
          <div key={key} className="p-3 rounded-lg" style={{ background: 'var(--color-bg-secondary)' }}>
            <label className="block mb-2">
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {label}
              </span>
            </label>
            <select
              value={value}
              onChange={(e) => updateConfig(key, e.target.value)}
              className="w-full px-3 py-2 rounded-lg border-2 text-sm"
              style={{
                background: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            >
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
              <option value="both">Both</option>
            </select>
          </div>
        );
      }

      if (key === 'defaultView') {
        return (
          <div key={key} className="p-3 rounded-lg" style={{ background: 'var(--color-bg-secondary)' }}>
            <label className="block mb-2">
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {label}
              </span>
            </label>
            <select
              value={value}
              onChange={(e) => updateConfig(key, e.target.value)}
              className="w-full px-3 py-2 rounded-lg border-2 text-sm"
              style={{
                background: 'var(--color-bg-tertiary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            >
              <option value="grid">Grid</option>
              <option value="list">List</option>
              <option value="table">Table</option>
            </select>
          </div>
        );
      }

      // Text input para el resto
      return (
        <div key={key} className="p-3 rounded-lg" style={{ background: 'var(--color-bg-secondary)' }}>
          <label className="block mb-2">
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
              {label}
            </span>
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => updateConfig(key, e.target.value)}
            className="w-full px-3 py-2 rounded-lg border-2 text-sm"
            style={{
              background: 'var(--color-bg-tertiary)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-primary)'
            }}
            placeholder={`Ingresa ${label.toLowerCase()}`}
          />
        </div>
      );
    }

    return null;
  };

  /**
   * Renderizar todas las propiedades por categorías
   */
  const renderAllFields = () => {
    const categories = {
      '🏠 Header': ['showTitle', 'title', 'titleSize', 'showSubtitle', 'subtitle', 'showIcon', 'icon', 'showBreadcrumbs', 'showBadges'],
      '🔍 Toolbar': ['showToolbar', 'toolbarPosition', 'showSearch', 'searchPlaceholder', 'showFilters', 'showViewSelector', 'defaultView', 'showCreateButton', 'createButtonText', 'showActions', 'showDatePicker', 'showSortBy'],
      '📐 Layout': ['contentLayout', 'gridColumns', 'gap'],
      '📦 Container': ['containerPadding', 'maxWidth', 'backgroundColor'],
      '📍 Footer': ['showPagination', 'itemsPerPage', 'showItemCount', 'showBulkActions'],
      '📱 Responsive': ['hideToolbarOnMobile', 'stackLayoutOnMobile', 'compactHeaderOnMobile'],
    };

    return (
      <div className="space-y-4">
        {Object.entries(categories).map(([categoryName, properties]) => {
          const existingProps = properties.filter(prop => panelConfig.hasOwnProperty(prop));
          if (existingProps.length === 0) return null;

          return (
            <div key={categoryName}>
              <h4 className="text-sm font-bold mb-2 px-1" style={{ color: 'var(--color-text-primary)' }}>
                {categoryName}
              </h4>
              <div className="space-y-2">
                {existingProps.map(prop => renderField(prop, panelConfig[prop]))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Dashboard Config - Configurador de Paneles
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
          Personaliza la apariencia y estructura de cada panel en tu aplicación
        </p>

        {/* Actions */}
        <div className="flex gap-2">
          <BaseButton
            variant="outline"
            size="sm"
            icon={Download}
            onClick={exportConfig}
          >
            Exportar
          </BaseButton>
        </div>
      </div>

      {/* Grid de 3 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMNA 1: Selector de Paneles (3 cols) */}
        <div className="lg:col-span-3">
          <div className="rounded-xl p-4" style={{ background: 'var(--color-bg-secondary)', border: '2px solid var(--color-border)' }}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
              <LayoutDashboard size={18} />
              Paneles
            </h3>

            <div className="space-y-2">
              {availablePanels.map(panel => {
                const Icon = iconMap[panel.icon] || LayoutDashboard;
                const isSelected = selectedPanel === panel.id;

                return (
                  <button
                    key={panel.id}
                    onClick={() => setSelectedPanel(panel.id)}
                    className={`w-full p-3 rounded-lg text-left transition-all hover:scale-[1.02] ${
                      isSelected ? 'ring-2' : ''
                    }`}
                    style={{
                      background: isSelected ? 'var(--color-primary)' : 'var(--color-bg-tertiary)',
                      color: isSelected ? 'white' : 'var(--color-text-primary)',
                      ringColor: 'var(--color-primary)',
                      border: `1px solid ${isSelected ? 'transparent' : 'var(--color-border)'}`
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} />
                      <div className="flex-1">
                        <div className="text-sm font-semibold">
                          {panel.label}
                        </div>
                        <div className="text-xs opacity-75 font-mono">
                          {panel.id}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* COLUMNA 2: Editor de Configuración (5 cols) */}
        <div className="lg:col-span-5">
          <div className="rounded-xl p-6" style={{ background: 'var(--color-bg-secondary)', border: '2px solid var(--color-border)' }}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
                  Configuración
                </h3>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {panelConfig.title || selectedPanel}
                </p>
              </div>
              <div className="flex gap-2">
                <BaseButton
                  variant="ghost"
                  size="sm"
                  icon={RotateCcw}
                  onClick={handleReset}
                >
                  Reset
                </BaseButton>
              </div>
            </div>

            {/* Configuration Fields */}
            <div className="rounded-lg p-4" style={{ background: 'var(--color-bg-tertiary)', border: '1px solid var(--color-border)' }}>
              <div className="max-h-[500px] overflow-y-auto pr-3 custom-scrollbar">
                {renderAllFields()}
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA 3: Preview (4 cols) */}
        <div className="lg:col-span-4">
          <div className="sticky top-6">
            <div className="rounded-xl p-5" style={{ background: 'var(--color-bg-secondary)', border: '2px solid var(--color-border)' }}>
              <div className="mb-4">
                <h3 className="text-xl font-bold flex items-center gap-2 mb-2" style={{ color: 'var(--color-text-primary)' }}>
                  <Eye size={20} />
                  Preview
                </h3>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  Vista previa de la configuración actual
                </p>
              </div>

              {/* Mockup del panel */}
              <div className="rounded-lg p-4 border-2 border-dashed" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-tertiary)' }}>
                {/* Header */}
                {panelConfig.showTitle && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                      {panelConfig.showIcon && iconMap[panelConfig.icon] && (
                        React.createElement(iconMap[panelConfig.icon], { size: 20, style: { color: 'var(--color-primary)' } })
                      )}
                      <h4 className={`${panelConfig.titleSize} font-bold`} style={{ color: 'var(--color-text-primary)' }}>
                        {panelConfig.title}
                      </h4>
                    </div>
                    {panelConfig.showSubtitle && (
                      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {panelConfig.subtitle}
                      </p>
                    )}
                  </div>
                )}

                {/* Toolbar */}
                {panelConfig.showToolbar && (
                  <div className="mb-3 p-2 rounded bg-opacity-50" style={{ background: 'var(--color-bg-secondary)' }}>
                    <div className="flex gap-2 flex-wrap text-xs">
                      {panelConfig.showSearch && <BaseBadge variant="default" size="sm">🔍 Search</BaseBadge>}
                      {panelConfig.showFilters && <BaseBadge variant="default" size="sm">🎛️ Filters</BaseBadge>}
                      {panelConfig.showViewSelector && <BaseBadge variant="default" size="sm">👁️ View</BaseBadge>}
                      {panelConfig.showCreateButton && <BaseBadge variant="primary" size="sm">+ Create</BaseBadge>}
                    </div>
                  </div>
                )}

                {/* Content Grid */}
                <div className={`grid grid-cols-${panelConfig.gridColumns?.base || 1} gap-${panelConfig.gap || 4}`}>
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className="h-20 rounded-lg flex items-center justify-center text-xs font-semibold"
                      style={{ background: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}
                    >
                      Item {i}
                    </div>
                  ))}
                </div>

                {/* Footer */}
                {(panelConfig.showPagination || panelConfig.showItemCount) && (
                  <div className="mt-3 pt-3 border-t-2 border-dashed text-xs flex justify-between items-center" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                    {panelConfig.showItemCount && <span>12 items</span>}
                    {panelConfig.showPagination && <span>← 1 / 3 →</span>}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="mt-4 p-3 rounded-lg flex items-start gap-2" style={{ background: 'var(--color-info-bg)', border: '1px solid var(--color-info-border)' }}>
                <Info size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--color-info)' }} />
                <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  Los cambios se guardan automáticamente y afectan al panel <strong>{selectedPanel}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardConfigTab;
