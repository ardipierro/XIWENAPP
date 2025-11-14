/**
 * @fileoverview Font Context - Maneja la fuente del logo de la aplicación
 * @module contexts/FontContext
 */

import { createContext, useContext, useState, useEffect } from 'react';

const FontContext = createContext();

// Fuentes disponibles
export const AVAILABLE_FONTS = [
  { name: 'Microsoft YaHei', family: "'Microsoft YaHei', sans-serif" },
  { name: 'SimSun (宋体)', family: "SimSun, serif" },
  { name: 'SimHei (黑体)', family: "SimHei, sans-serif" },
  { name: 'STSong (华文宋体)', family: "STSong, serif" },
  { name: 'STHeiti (华文黑体)', family: "STHeiti, sans-serif" },
  { name: 'Noto Sans SC', family: "'Noto Sans SC', sans-serif" }
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

  // Guardar en localStorage cuando cambia
  useEffect(() => {
    localStorage.setItem('appLogoFont', selectedFont);
  }, [selectedFont]);

  useEffect(() => {
    localStorage.setItem('appLogoFontWeight', fontWeight);
  }, [fontWeight]);

  const value = {
    selectedFont,
    setSelectedFont,
    fontWeight,
    setFontWeight,
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
