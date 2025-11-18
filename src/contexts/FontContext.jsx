/**
 * @fileoverview Font Context - Maneja la fuente del logo de la aplicación
 * @module contexts/FontContext
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { loadLogoConfig, saveLogoConfig } from '../firebase/logoConfig';
import logger from '../utils/logger';

const FontContext = createContext();

// Fuentes disponibles
export const AVAILABLE_FONTS = [
  { name: 'Microsoft YaHei', family: "'Microsoft YaHei', sans-serif", style: 'modern' },
  { name: 'SimSun (宋体)', family: "SimSun, serif", style: 'classic' },
  { name: 'SimHei (黑体)', family: "SimHei, sans-serif", style: 'modern' },
  { name: 'STSong (华文宋体)', family: "STSong, serif", style: 'classic' },
  { name: 'STHeiti (华文黑体)', family: "STHeiti, sans-serif", style: 'modern' },
  { name: 'KaiTi (楷体)', family: "KaiTi, STKaiti, serif", style: 'artistic' },
  { name: 'FangSong (仿宋)', family: "FangSong, STFangsong, serif", style: 'artistic' },
  { name: 'STXingkai (华文行楷)', family: "STXingkai, serif", style: 'artistic' },
  { name: 'STKaiti (华文楷体)', family: "STKaiti, KaiTi, serif", style: 'artistic' },
  { name: 'STFangsong (华文仿宋)', family: "STFangsong, FangSong, serif", style: 'artistic' },
  { name: 'LiSu (隶书)', family: "LiSu, serif", style: 'artistic' },
  { name: 'YouYuan (幼圆)', family: "YouYuan, sans-serif", style: 'rounded' },
  { name: 'PMingLiU (新細明體)', family: "PMingLiU, serif", style: 'traditional' },
  { name: 'DFKai-SB (標楷體)', family: "DFKai-SB, serif", style: 'traditional' },
  { name: 'Noto Sans SC', family: "'Noto Sans SC', sans-serif", style: 'modern' }
];

export function FontProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);

  // Estado: fuente seleccionada (por defecto Microsoft YaHei)
  const [selectedFont, setSelectedFont] = useState(() => {
    const saved = localStorage.getItem('appLogoFont');
    return saved || "'Microsoft YaHei', sans-serif";
  });

  // Estado: peso de la fuente (normal o bold)
  const [fontWeight, setFontWeight] = useState(() => {
    const saved = localStorage.getItem('appLogoFontWeight');
    return saved || 'bold';
  });

  // Estado: tamaño de la fuente (en rem, rango 1-3)
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('appLogoFontSize');
    return saved ? parseFloat(saved) : 1.25; // 1.25rem = text-xl por defecto
  });

  // Cargar configuración desde Firebase al iniciar
  useEffect(() => {
    async function loadConfig() {
      try {
        const config = await loadLogoConfig();

        if (config) {
          // Si hay configuración en Firebase, usarla
          setSelectedFont(config.font);
          setFontWeight(config.weight);
          setFontSize(config.size);

          // Actualizar también localStorage para carga rápida
          localStorage.setItem('appLogoFont', config.font);
          localStorage.setItem('appLogoFontWeight', config.weight);
          localStorage.setItem('appLogoFontSize', config.size.toString());

          logger.info('[FontContext] Configuración cargada desde Firebase');
        } else {
          // Si no hay en Firebase, guardar la actual (localStorage) en Firebase
          await saveLogoConfig({
            font: selectedFont,
            weight: fontWeight,
            size: fontSize
          });
          logger.info('[FontContext] Configuración inicial guardada en Firebase');
        }
      } catch (error) {
        logger.error('[FontContext] Error al cargar configuración:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guardar en localStorage Y Firebase cuando cambia la fuente
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('appLogoFont', selectedFont);
      saveLogoConfig({ font: selectedFont, weight: fontWeight, size: fontSize });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFont]);

  // Guardar en localStorage Y Firebase cuando cambia el peso
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('appLogoFontWeight', fontWeight);
      saveLogoConfig({ font: selectedFont, weight: fontWeight, size: fontSize });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontWeight]);

  // Guardar en localStorage Y Firebase cuando cambia el tamaño
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('appLogoFontSize', fontSize.toString());
      saveLogoConfig({ font: selectedFont, weight: fontWeight, size: fontSize });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontSize]);

  // Función para resetear a defaults
  const resetToDefaults = async () => {
    const defaults = {
      font: "'Microsoft YaHei', sans-serif",
      weight: 'bold',
      size: 1.25
    };

    setSelectedFont(defaults.font);
    setFontWeight(defaults.weight);
    setFontSize(defaults.size);

    localStorage.setItem('appLogoFont', defaults.font);
    localStorage.setItem('appLogoFontWeight', defaults.weight);
    localStorage.setItem('appLogoFontSize', defaults.size.toString());

    await saveLogoConfig(defaults);
    logger.info('[FontContext] Configuración reseteada a defaults');
  };

  const value = {
    selectedFont,
    setSelectedFont,
    fontWeight,
    setFontWeight,
    fontSize,
    setFontSize,
    isLoading,
    resetToDefaults,
    availableFonts: AVAILABLE_FONTS
  };

  return (
    <FontContext.Provider value={value}>
      {children}
    </FontContext.Provider>
  );
}

export function useFont() {
  const context = useContext(FontContext);
  if (!context) {
    throw new Error('useFont debe usarse dentro de un FontProvider');
  }
  return context;
}

export default FontContext;
