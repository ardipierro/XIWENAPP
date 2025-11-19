/**
 * @fileoverview Hook para consumir configuración de paneles
 * Simplifica el acceso a la configuración de un panel específico
 *
 * @module hooks/useDashboardConfig
 */

import { useMemo } from 'react';
import { useDashboardConfigContext } from '../contexts/DashboardConfigContext';
import { getGridClasses, getContainerClasses } from '../config/dashboardConfig';

/**
 * Hook para obtener configuración de un panel específico
 *
 * @param {string} panelId - ID del panel
 * @returns {object} Configuración del panel + helpers
 *
 * @example
 * function MyPanel() {
 *   const config = useDashboardConfig('CourseManager');
 *
 *   return (
 *     <div className={config.containerClasses}>
 *       {config.showTitle && <h1>{config.title}</h1>}
 *       {config.showToolbar && <Toolbar {...config.toolbarProps} />}
 *       <div className={config.gridClasses}>
 *         {/* contenido */}
 *       </div>
 *     </div>
 *   );
 * }
 */
export function useDashboardConfig(panelId) {
  const { getPanelConfig, updateProperty } = useDashboardConfigContext();

  const config = useMemo(() => {
    const panelConfig = getPanelConfig(panelId);

    // Generar clases helper
    const gridClasses = `grid ${getGridClasses(panelConfig.gridColumns)} gap-${panelConfig.gap}`;
    const containerClasses = getContainerClasses(panelConfig);

    // Props para toolbar
    const toolbarProps = {
      showSearch: panelConfig.showSearch,
      searchPlaceholder: panelConfig.searchPlaceholder,
      showFilters: panelConfig.showFilters,
      showViewSelector: panelConfig.showViewSelector,
      defaultView: panelConfig.defaultView,
      showCreateButton: panelConfig.showCreateButton,
      createButtonText: panelConfig.createButtonText,
      showActions: panelConfig.showActions,
      showDatePicker: panelConfig.showDatePicker,
      showSortBy: panelConfig.showSortBy,
    };

    // Props para header
    const headerProps = {
      showTitle: panelConfig.showTitle,
      title: panelConfig.title,
      titleSize: panelConfig.titleSize,
      showSubtitle: panelConfig.showSubtitle,
      subtitle: panelConfig.subtitle,
      showIcon: panelConfig.showIcon,
      icon: panelConfig.icon,
      showBreadcrumbs: panelConfig.showBreadcrumbs,
      showBadges: panelConfig.showBadges,
    };

    // Props para footer
    const footerProps = {
      showPagination: panelConfig.showPagination,
      itemsPerPage: panelConfig.itemsPerPage,
      showItemCount: panelConfig.showItemCount,
      showBulkActions: panelConfig.showBulkActions,
    };

    return {
      ...panelConfig,
      gridClasses,
      containerClasses,
      toolbarProps,
      headerProps,
      footerProps,
    };
  }, [panelId, getPanelConfig]);

  /**
   * Helper para actualizar una propiedad
   */
  const updateConfig = (property, value) => {
    updateProperty(panelId, property, value);
  };

  return {
    ...config,
    updateConfig,
  };
}

export default useDashboardConfig;
