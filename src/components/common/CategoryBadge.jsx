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

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import BaseBadge from './BaseBadge';
import {
  getBadgeForContentType,
  getBadgeForExerciseType,
  getBadgeForDifficulty,
  getBadgeForCEFR,
  getBadgeForStatus,
  getBadgeForRole,
  getBadgeByKey,
  getIconLibraryConfig,
} from '../../config/badgeSystem';
import * as HeroIcons from '@heroicons/react/24/outline';

/**
 * Badge inteligente con mapeo automático de categorías
 *
 * @param {Object} props
 * @param {string} props.type - Tipo de categoría: 'content' | 'exercise' | 'difficulty' | 'cefr' | 'status' | 'role' | 'custom'
 * @param {string} props.value - Valor dentro de la categoría (ej: 'course', 'intermediate', 'admin')
 * @param {string} props.badgeKey - Clave directa del badge (alternativa a type+value)
 * @param {string} props.size - Tamaño del badge: 'sm' | 'md' | 'lg'
 * @param {boolean} props.showIcon - Mostrar icono emoji
 * @param {boolean} props.showLabel - Mostrar texto del label
 * @param {function} props.onRemove - Callback para remover (muestra X)
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
  ...rest
}) {
  // Estado para configuración de iconos
  const [iconLibraryConfig, setIconLibraryConfig] = useState(
    getIconLibraryConfig()
  );

  // Estado para forzar recarga cuando cambia la configuración de badges
  const [configVersion, setConfigVersion] = useState(0);

  // Escuchar cambios en la configuración de iconos
  useEffect(() => {
    const handleIconLibraryChange = (event) => {
      setIconLibraryConfig(event.detail || getIconLibraryConfig());
    };

    window.addEventListener('iconLibraryChange', handleIconLibraryChange);
    return () => window.removeEventListener('iconLibraryChange', handleIconLibraryChange);
  }, []);

  // Escuchar cambios en la configuración de badges (colores, etc.)
  useEffect(() => {
    const handleBadgeConfigChange = () => {
      setConfigVersion(prev => prev + 1);
    };

    window.addEventListener('xiwen_badge_config_changed', handleBadgeConfigChange);
    window.addEventListener('storage', handleBadgeConfigChange);

    return () => {
      window.removeEventListener('xiwen_badge_config_changed', handleBadgeConfigChange);
      window.removeEventListener('storage', handleBadgeConfigChange);
    };
  }, []);

  // Obtener configuración del badge
  let badgeConfig;

  if (badgeKey) {
    // Uso directo por key
    badgeConfig = getBadgeByKey(badgeKey);
  } else if (type && value) {
    // Uso por tipo + valor
    switch (type) {
      case 'content':
        badgeConfig = getBadgeForContentType(value);
        break;
      case 'exercise':
        badgeConfig = getBadgeForExerciseType(value);
        break;
      case 'difficulty':
        badgeConfig = getBadgeForDifficulty(value);
        break;
      case 'cefr':
        badgeConfig = getBadgeForCEFR(value);
        break;
      case 'status':
        badgeConfig = getBadgeForStatus(value);
        break;
      case 'role':
        badgeConfig = getBadgeForRole(value);
        break;
      case 'custom':
        badgeConfig = getBadgeByKey(value);
        break;
      default:
        badgeConfig = null;
    }
  }

  // Fallback si no se encuentra configuración
  if (!badgeConfig) {
    return (
      <BaseBadge variant="default" size={size} className={className} {...rest}>
        {value || badgeKey || 'Unknown'}
      </BaseBadge>
    );
  }

  // Renderizar icono según configuración
  const renderIcon = () => {
    if (!showIcon) return null;

    const iconLibrary = iconLibraryConfig.library || 'emoji';

    // Sin iconos
    if (iconLibrary === 'none') return null;

    // Heroicons
    if (iconLibrary === 'heroicon') {
      const iconName = badgeConfig.heroicon;
      if (!iconName) return null;

      const IconComponent = HeroIcons[iconName];
      if (!IconComponent) return null;

      return (
        <IconComponent
          className="mr-1"
          style={{
            width: size === 'sm' ? '14px' : size === 'lg' ? '20px' : '16px',
            height: size === 'sm' ? '14px' : size === 'lg' ? '20px' : '16px',
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
      {renderIcon()}
      {showLabel && badgeConfig.label}
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
  type: PropTypes.oneOf(['content', 'exercise', 'difficulty', 'cefr', 'status', 'role', 'custom']),
  value: PropTypes.string,
  badgeKey: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  showIcon: PropTypes.bool,
  showLabel: PropTypes.bool,
  onRemove: PropTypes.func,
  className: PropTypes.string,
};

export default CategoryBadge;
