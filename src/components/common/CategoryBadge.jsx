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
  getPresetForBadge,
  getBadgePresetConfig,
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

  // Estado para configuración de presets
  const [presetConfig, setPresetConfig] = useState(getBadgePresetConfig());

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

    // NUEVO: Escuchar cambios en configuración de presets
    const handlePresetConfigChange = (event) => {
      const newConfig = event.detail || getBadgePresetConfig();
      logger.info('Preset config changed:', newConfig, 'CategoryBadge');
      setPresetConfig(newConfig);
      setBadgeConfigKey(k => k + 1); // Forzar re-render
    };

    window.addEventListener('iconLibraryChange', handleIconLibraryChange);
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('xiwen_badge_config_changed', handleBadgeConfigChange);
    window.addEventListener('badgePresetConfigChange', handlePresetConfigChange);

    // Cargar config inicial
    setIconLibraryConfig(getIconLibraryConfig());
    setPresetConfig(getBadgePresetConfig());

    return () => {
      window.removeEventListener('iconLibraryChange', handleIconLibraryChange);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('xiwen_badge_config_changed', handleBadgeConfigChange);
      window.removeEventListener('badgePresetConfigChange', handlePresetConfigChange);
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

  // 🆕 OBTENER PRESET APLICABLE
  // El preset tiene la máxima prioridad y se combina con la config del badge
  const badgeKeyStr = badgeKey || (type && value ? `${type}_${value}` : null);
  const appliedPreset = badgeKeyStr ? getPresetForBadge(badgeKeyStr, badgeConfig.category) : null;

  // 🆕 Si el badge está deshabilitado por preset o config, no renderizar nada
  const isEnabled = appliedPreset ? appliedPreset.enabled !== false : badgeConfig.enabled !== false;
  if (!isEnabled) {
    return null;
  }

  // 🆕 Determinar si mostrar icono basándose en PRESET > config del badge > prop
  let shouldShowIcon = showIcon;
  if (appliedPreset && appliedPreset.showIcon !== undefined) {
    shouldShowIcon = appliedPreset.showIcon;
  } else if (badgeConfig.showIcon !== undefined) {
    shouldShowIcon = badgeConfig.showIcon;
  }

  // 🆕 Determinar si mostrar texto basándose en PRESET > prop
  let shouldShowLabel = showLabel;
  if (appliedPreset && appliedPreset.showText !== undefined) {
    shouldShowLabel = appliedPreset.showText;
  }

  // 🆕 Determinar si mostrar fondo basándose en PRESET > config del badge
  let shouldShowBackground = true;
  if (appliedPreset && appliedPreset.showBackground !== undefined) {
    shouldShowBackground = appliedPreset.showBackground;
  } else if (badgeConfig.showBackground !== undefined) {
    shouldShowBackground = badgeConfig.showBackground;
  }

  // 🆕 Obtener fontWeight del preset o config
  const fontWeight = appliedPreset?.fontWeight || badgeConfig.fontWeight || 'medium';

  // Obtener color del icono según paleta monocromática
  const getIconColor = () => {
    const palette = iconLibraryConfig.monochromePalette || 'vibrant';
    const paletteConfig = MONOCHROME_PALETTES[palette];

    if (!paletteConfig) return badgeConfig.color;

    return paletteConfig.getValue(badgeConfig.color, iconLibraryConfig.monochromeColor);
  };

  // Renderizar icono según configuración
  const renderIcon = () => {
    if (!shouldShowIcon) return null;

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

  // 🆕 Calcular estilos basándose en showBackground, badgeStyle y fontWeight
  const getStyleObject = () => {
    const baseStyles = {
      fontWeight: fontWeight === 'normal' ? '400' : fontWeight === 'bold' ? '700' : fontWeight === 'semibold' ? '600' : '500',
    };

    // Sin fondo: solo texto coloreado, sin background ni border
    if (!shouldShowBackground) {
      return {
        ...baseStyles,
        backgroundColor: 'transparent',
        color: badgeConfig.color,
        border: 'none',
        boxShadow: 'none',
      };
    }

    // Estilo outline: borde coloreado, fondo transparente
    if (badgeConfig.badgeStyle === 'outline') {
      return {
        ...baseStyles,
        borderColor: badgeConfig.color,
        color: badgeConfig.color,
        backgroundColor: 'transparent',
      };
    }

    // Estilo por defecto (solid y otros): fondo coloreado
    return {
      ...baseStyles,
      backgroundColor: badgeConfig.color,
      color: getContrastText(badgeConfig.color),
    };
  };

  return (
    <BaseBadge
      variant={badgeConfig.variant}
      badgeStyle={shouldShowBackground ? (badgeConfig.badgeStyle || 'solid') : 'text'}
      size={size}
      onRemove={onRemove}
      className={className}
      style={getStyleObject()}
      {...rest}
    >
      {children ? (
        // Si hay children, renderizarlos directamente
        children
      ) : (
        // Si no hay children, renderizar icono y label por defecto
        <>
          {renderIcon()}
          {shouldShowLabel && badgeConfig.label}
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
