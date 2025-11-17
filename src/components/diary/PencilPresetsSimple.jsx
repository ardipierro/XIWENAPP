import React, { useState } from 'react';

/**
 * PencilPresetsSimple - Selector simplificado de lápiz
 * 5 tipos de punta + selector de color simple
 */
export function PencilPresetsSimple({ onSelect, current }) {
  // 5 tipos de punta con configuraciones específicas
  const pencilTypes = [
    {
      id: 'pluma',
      name: 'Pluma',
      icon: '✒️',
      size: 1,
      opacity: 1,
      description: 'Super fino, detalles precisos'
    },
    {
      id: 'lapiz',
      name: 'Lápiz',
      icon: '✏️',
      size: 3,
      opacity: 1,
      description: 'Fino, escritura normal'
    },
    {
      id: 'marcador',
      name: 'Marcador',
      icon: '🖍️',
      size: 10,
      opacity: 0.5,
      description: 'Mediano, resaltado'
    },
    {
      id: 'tiza',
      name: 'Tiza',
      icon: '⬜',
      size: 18,
      opacity: 0.85,
      description: 'Grueso, efecto pizarra'
    },
    {
      id: 'pincel',
      name: 'Pincel',
      icon: '🖌️',
      size: 24,
      opacity: 0.7,
      description: 'Muy grueso, artístico'
    },
  ];

  // 5 colores predefinidos
  const colors = [
    { name: 'Negro', value: '#000000' },
    { name: 'Azul', value: '#3B82F6' },
    { name: 'Rojo', value: '#EF4444' },
    { name: 'Verde', value: '#22C55E' },
    { name: 'Amarillo', value: '#EAB308' },
  ];

  const [selectedType, setSelectedType] = useState('lapiz');
  const [selectedColor, setSelectedColor] = useState('#000000');

  const handleTypeSelect = (type) => {
    setSelectedType(type.id);
    onSelect({
      color: selectedColor,
      opacity: type.opacity,
      size: type.size
    });
  };

  const handleColorSelect = (color) => {
    setSelectedColor(color.value);
    const currentType = pencilTypes.find(t => t.id === selectedType);
    if (currentType) {
      onSelect({
        color: color.value,
        opacity: currentType.opacity,
        size: currentType.size
      });
    }
  };

  return (
    <div className="pencil-presets-simple bg-white dark:bg-gray-800 rounded-lg p-3 border-2 border-purple-200 dark:border-purple-800">
      {/* Título */}
      <div className="mb-3">
        <h4 className="text-sm font-bold text-purple-900 dark:text-purple-100">
          Tipo de Trazo
        </h4>
      </div>

      {/* 5 tipos de punta */}
      <div className="flex gap-2 mb-4">
        {pencilTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => handleTypeSelect(type)}
            className={`
              flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg
              transition-all hover:scale-105
              ${selectedType === type.id
                ? 'bg-purple-500 text-white shadow-lg ring-2 ring-purple-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-purple-100 dark:hover:bg-purple-900'
              }
            `}
            title={type.description}
          >
            <span className="text-2xl">{type.icon}</span>
            <span className="text-xs font-semibold whitespace-nowrap">{type.name}</span>
            <span className="text-[10px] opacity-75">{type.size}px</span>
          </button>
        ))}
      </div>

      {/* Separador */}
      <div className="border-t border-purple-200 dark:border-purple-700 my-3" />

      {/* Selector de color */}
      <div className="mb-2">
        <h4 className="text-sm font-bold text-purple-900 dark:text-purple-100 mb-2">
          Color
        </h4>
      </div>

      {/* 5 círculos de colores */}
      <div className="flex gap-3 justify-center">
        {colors.map((color) => (
          <button
            key={color.value}
            onClick={() => handleColorSelect(color)}
            className={`
              w-12 h-12 rounded-full transition-all hover:scale-110
              border-4
              ${selectedColor === color.value
                ? 'border-purple-500 shadow-xl ring-2 ring-purple-300'
                : 'border-gray-300 dark:border-gray-600 hover:border-purple-300'
              }
            `}
            style={{ backgroundColor: color.value }}
            title={color.name}
          />
        ))}
      </div>

      {/* Info del preset actual */}
      <div className="mt-3 p-2 bg-purple-50 dark:bg-purple-900/20 rounded text-center">
        <p className="text-xs text-purple-800 dark:text-purple-200">
          {pencilTypes.find(t => t.id === selectedType)?.description}
        </p>
      </div>
    </div>
  );
}

export default PencilPresetsSimple;
