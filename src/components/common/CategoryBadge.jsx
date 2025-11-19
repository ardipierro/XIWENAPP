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

import { useState, useEffect, useCallback } from 'react';
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
  MONOCHROME_PALETTES,
} from '../../config/badgeSystem';
import * as HeroIcons from '@heroicons/react/24/outline';
import * as HeroIconsSolid from '@heroicons/react/24/solid';

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
  // Función helper para obtener la configuración del badge (memoizada)
  const getBadgeConfiguration = useCallback(() => {
    if (badgeKey) {
      return getBadgeByKey(badgeKey);
    } else if (type && value) {
      switch (type) {
        case 'content':
          return getBadgeForContentType(value);
        case 'exercise':
          return getBadgeForExerciseType(value);
        case 'difficulty':
          return getBadgeForDifficulty(value);
        case 'cefr':
          return getBadgeForCEFR(value);
        case 'status':
          return getBadgeForStatus(value);
        case 'role':
          return getBadgeForRole(value);
        case 'custom':
          return getBadgeByKey(value);
        default:
          return null;
      }
    }
    return null;
  }, [badgeKey, type, value]);

  // Estado para configuración de badges (SE ACTUALIZA DINÁMICAMENTE)
  const [badgeConfig, setBadgeConfig] = useState(getBadgeConfiguration);

  // Estado para configuración de iconos
  const [iconLibraryConfig, setIconLibraryConfig] = useState(
    getIconLibraryConfig()
  );

  // ✅ ACTUALIZAR BADGE CONFIG CUANDO CAMBIAN LAS PROPS (NUEVO)
  useEffect(() => {
    const updatedConfig = getBadgeConfiguration();
    setBadgeConfig(updatedConfig);
  }, [getBadgeConfiguration]);

  // ✅ ESCUCHAR CAMBIOS EN LA CONFIGURACIÓN DE BADGES (NUEVO)
  useEffect(() => {
    const handleBadgeConfigChange = () => {
      const updatedConfig = getBadgeConfiguration();
      setBadgeConfig(updatedConfig);
    };

    window.addEventListener('xiwen_badge_config_changed', handleBadgeConfigChange);
    return () => window.removeEventListener('xiwen_badge_config_changed', handleBadgeConfigChange);
  }, [getBadgeConfiguration]); // Dependencia: la función memoizada

  // Escuchar cambios en la configuración de iconos
  useEffect(() => {
    const handleIconLibraryChange = (event) => {
      setIconLibraryConfig(event.detail || getIconLibraryConfig());
    };

    window.addEventListener('iconLibraryChange', handleIconLibraryChange);
    return () => window.removeEventListener('iconLibraryChange', handleIconLibraryChange);
  }, []);

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
