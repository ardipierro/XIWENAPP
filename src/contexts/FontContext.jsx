/**
 * @fileoverview Font Context - Maneja la fuente del logo de la aplicación
 * @module contexts/FontContext
 */

import { createContext, useContext, useState, useEffect } from 'react';

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

  // Guardar en localStorage cuando cambia
  useEffect(() => {
    localStorage.setItem('appLogoFont', selectedFont);
  }, [selectedFont]);

  useEffect(() => {
    localStorage.setItem('appLogoFontWeight', fontWeight);
  }, [fontWeight]);

  useEffect(() => {
    localStorage.setItem('appLogoFontSize', fontSize.toString());
  }, [fontSize]);

  const value = {
    selectedFont,
    setSelectedFont,
    fontWeight,
    setFontWeight,
    fontSize,
    setFontSize,
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
