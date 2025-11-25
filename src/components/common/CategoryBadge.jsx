/**
 * @fileoverview Badge inteligente que automáticamente mapea categorías a colores
 *
 * Uso:
 * <CategoryBadge type="content" value="course" />
 * <CategoryBadge type="difficulty" value="intermediate" />
 * <CategoryBadge type="status" value="published" />
 * <CategoryBadge badgeKey="CONTENT_COURSE" />
 *
 * @module components/common/CategoryBadge
 */

import { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import BaseBadge from './BaseBadge';
import {
  getBadgeForContentType,
  getBadgeForExerciseType,
  getBadgeForDifficulty,
  getBadgeForCEFR,
  getBadgeForStatus,
  getBadgeForRole,
  getBadgeForHomeworkStatus,
  getBadgeForGamification,
  getBadgeForSessionStatus,
  getBadgeForUserStatus,
  getBadgeForVideoProvider,
  getBadgeForScheduleType,
  getBadgeForEnrollmentStatus,
  getBadgeByKey,
  getIconLibraryConfig,
  MONOCHROME_PALETTES,
} from '../../config/badgeSystem';
import * as HeroIcons from '@heroicons/react/24/outline';
import * as HeroIconsSolid from '@heroicons/react/24/solid';
import logger from '../../utils/logger';

/**
 * Badge inteligente con mapeo automático de categorías
 *
 * @param {Object} props
 * @param {string} props.type - Tipo de categoría: 'content' | 'exercise' | 'difficulty' | 'cefr' | 'status' | 'role' | 'homework_status' | 'gamification' | 'custom'
 * @param {string} props.value - Valor dentro de la categoría (ej: 'course', 'intermediate', 'admin', 'pending', 'credits')
 * @param {string} props.badgeKey - Clave directa del badge (alternativa a type+value)
 * @param {string} props.size - Tamaño del badge: 'sm' | 'md' | 'lg'
 * @param {boolean} props.showIcon - Mostrar icono emoji
 * @param {boolean} props.showLabel - Mostrar texto del label
 * @param {function} props.onRemove - Callback para remover (muestra X)
 * @param {React.ReactNode} props.children - Contenido personalizado (sobrescribe icono y label)
 */
function CategoryBadge({
  type,
  value,
  badgeKey,
  size = 'md',
  showIcon = true,
  showLabel = true,
  onRemove,
  className = '',
  children,
  ...rest
}) {
  // Estado para configuración de iconos
  const [iconLibraryConfig, setIconLibraryConfig] = useState(
    getIconLibraryConfig()
  );

  // Estado para forzar re-render cuando cambie la config de badges
  const [badgeConfigKey, setBadgeConfigKey] = useState(0);

  // Escuchar cambios en la configuración de iconos (MEJORADO)
  useEffect(() => {
    const handleIconLibraryChange = (event) => {
      const newConfig = event.detail || getIconLibraryConfig();
      logger.info('Icon library config changed:', newConfig, 'CategoryBadge');
      setIconLibraryConfig(newConfig);
    };

    const handleStorageChange = () => {
      const newConfig = getIconLibraryConfig();
      logger.info('Storage changed, reloading icon config:', newConfig, 'CategoryBadge');
      setIconLibraryConfig(newConfig);
    };

    // CRÍTICO: Escuchar cambios en configuración de badges (paleta de colores, etc.)
    const handleBadgeConfigChange = () => {
      logger.info('Badge config changed, forcing re-render', 'CategoryBadge');
      setBadgeConfigKey(k => k + 1);
    };

    window.addEventListener('iconLibraryChange', handleIconLibraryChange);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('xiwen_badge_config_changed', handleBadgeConfigChange);

    // Cargar config inicial
    setIconLibraryConfig(getIconLibraryConfig());

    return () => {
      window.removeEventListener('iconLibraryChange', handleIconLibraryChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('xiwen_badge_config_changed', handleBadgeConfigChange);
    };
  }, []);

  // Obtener configuración del badge (MEMOIZADO para reaccionar a cambios)
  const badgeConfig = useMemo(() => {
    let config;

    if (badgeKey) {
      // Uso directo por key
      config = getBadgeByKey(badgeKey);
    } else if (type && value) {
      // Uso por tipo + valor
      switch (type) {
        case 'content':
          config = getBadgeForContentType(value);
          break;
        case 'exercise':
          config = getBadgeForExerciseType(value);
          break;
        case 'difficulty':
          config = getBadgeForDifficulty(value);
          break;
        case 'cefr':
          config = getBadgeForCEFR(value);
          break;
        case 'status':
          config = getBadgeForStatus(value);
          break;
        case 'role':
          config = getBadgeForRole(value);
          break;
        case 'homework_status':
          config = getBadgeForHomeworkStatus(value);
          break;
        case 'gamification':
          config = getBadgeForGamification(value);
          break;
        case 'session_status':
          config = getBadgeForSessionStatus(value);
          break;
        case 'user_status':
          config = getBadgeForUserStatus(value);
          break;
        case 'video_provider':
          config = getBadgeForVideoProvider(value);
          break;
        case 'schedule_type':
          config = getBadgeForScheduleType(value);
          break;
        case 'enrollment_status':
          config = getBadgeForEnrollmentStatus(value);
          break;
        case 'custom':
          config = getBadgeByKey(value);
          break;
        default:
          config = null;
      }
    }

    return config;
  }, [badgeKey, type, value, badgeConfigKey]); // CRÍTICO: badgeConfigKey fuerza re-cálculo

  // Fallback si no se encuentra configuración
  if (!badgeConfig) {
    return (
      <BaseBadge variant="default" size={size} className={className} {...rest}>
        {value || badgeKey || 'Unknown'}
      </BaseBadge>
    );
  }

  // Obtener color del icono según paleta monocromática
  const getIconColor = () => {
    const palette = iconLibraryConfig.monochromePalette || 'vibrant';
    const paletteConfig = MONOCHROME_PALETTES[palette];

    if (!paletteConfig) return badgeConfig.color;

    return paletteConfig.getValue(badgeConfig.color, iconLibraryConfig.monochromeColor);
  };

  // Renderizar icono según configuración
  const renderIcon = () => {
    if (!showIcon) return null;

    const iconLibrary = iconLibraryConfig.library || 'emoji';

    // Sin iconos
    if (iconLibrary === 'none') return null;

    // Heroicons (outline)
    if (iconLibrary === 'heroicon') {
      const iconName = badgeConfig.heroicon;
      if (!iconName) return null;

      const IconComponent = HeroIcons[iconName];
      if (!IconComponent) return null;

      const iconColor = getIconColor();

      return (
        <IconComponent
          className="mr-1"
          style={{
            width: size === 'xs' ? '12px' : size === 'sm' ? '14px' : size === 'lg' ? '20px' : size === 'xl' ? '22px' : '16px',
            height: size === 'xs' ? '12px' : size === 'sm' ? '14px' : size === 'lg' ? '20px' : size === 'xl' ? '22px' : '16px',
            color: iconColor,
          }}
        />
      );
    }

    // Heroicons (filled)
    if (iconLibrary === 'heroicon-filled') {
      const iconName = badgeConfig.heroicon;
      if (!iconName) return null;

      const IconComponent = HeroIconsSolid[iconName];
      if (!IconComponent) return null;

      const iconColor = getIconColor();

      return (
        <IconComponent
          className="mr-1"
          style={{
            width: size === 'xs' ? '12px' : size === 'sm' ? '14px' : size === 'lg' ? '20px' : size === 'xl' ? '22px' : '16px',
            height: size === 'xs' ? '12px' : size === 'sm' ? '14px' : size === 'lg' ? '20px' : size === 'xl' ? '22px' : '16px',
            color: iconColor,
          }}
        />
      );
    }

    // Emoji (por defecto)
    if (badgeConfig.icon) {
      return (
        <span className="mr-1" role="img" aria-label={badgeConfig.label}>
          {badgeConfig.icon}
        </span>
      );
    }

    return null;
  };

  return (
    <BaseBadge
      variant={badgeConfig.variant}
      badgeStyle={badgeConfig.badgeStyle || 'solid'}
      size={size}
      onRemove={onRemove}
      className={className}
      style={
        badgeConfig.badgeStyle === 'outline'
          ? {
              borderColor: badgeConfig.color,
              color: badgeConfig.color,
              backgroundColor: 'transparent',
            }
          : {
              backgroundColor: badgeConfig.color,
              color: getContrastText(badgeConfig.color),
            }
      }
      {...rest}
    >
      {children ? (
        // Si hay children, renderizarlos directamente
        children
      ) : (
        // Si no hay children, renderizar icono y label por defecto
        <>
          {renderIcon()}
          {showLabel && badgeConfig.label}
        </>
      )}
    </BaseBadge>
  );
}

/**
 * Calcula color de texto con buen contraste
 */
function getContrastText(bgColor) {
  const rgb = hexToRgb(bgColor);
  if (!rgb) return '#ffffff';

  // Calcular luminancia relativa (WCAG formula)
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;

  return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Convierte hex a RGB
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

CategoryBadge.propTypes = {
  type: PropTypes.oneOf(['content', 'exercise', 'difficulty', 'cefr', 'status', 'role', 'homework_status', 'gamification', 'session_status', 'user_status', 'video_provider', 'schedule_type', 'enrollment_status', 'custom']),
  value: PropTypes.string,
  badgeKey: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  showIcon: PropTypes.bool,
  showLabel: PropTypes.bool,
  onRemove: PropTypes.func,
  className: PropTypes.string,
  children: PropTypes.node,
};

export default CategoryBadge;
