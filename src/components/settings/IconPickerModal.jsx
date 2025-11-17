/**
 * @fileoverview Modal para seleccionar iconos Heroicons
 *
 * Permite:
 * - Explorar iconos por categorías
 * - Buscar iconos por nombre
 * - Vista previa del icono seleccionado
 * - Selección con callback
 *
 * @module components/settings/IconPickerModal
 */

import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { X, Search } from 'lucide-react';
import { BaseButton, BaseInput } from '../common';
import { AVAILABLE_HEROICONS } from '../../config/badgeSystem';
import * as HeroIcons from '@heroicons/react/24/outline';

/**
 * Modal de selección de iconos Heroicons
 */
function IconPickerModal({ onSelect, onClose, currentIcon }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Filtrar iconos según búsqueda y categoría
  const filteredIcons = useMemo(() => {
    let icons = [];

    // Recopilar todos los iconos o solo de una categoría
    if (selectedCategory === 'all') {
      Object.values(AVAILABLE_HEROICONS).forEach((category) => {
        icons.push(...category.icons);
      });
    } else {
      icons = AVAILABLE_HEROICONS[selectedCategory]?.icons || [];
    }

    // Filtrar por búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      icons = icons.filter(
        (icon) =>
          icon.name.toLowerCase().includes(query) ||
          icon.label.toLowerCase().includes(query)
      );
    }

    return icons;
  }, [searchQuery, selectedCategory]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{
        zIndex: 'var(--z-modal-backdrop)',
        background: 'rgba(0, 0, 0, 0.5)',
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] rounded-xl flex flex-col"
        style={{
          background: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
          zIndex: 'var(--z-modal)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <h3
            className="text-lg font-bold"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Seleccionar Icono
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded hover:opacity-70 transition-opacity"
            style={{ background: 'var(--color-bg-tertiary)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Buscador */}
        <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <BaseInput
            placeholder="Buscar icono..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={Search}
          />
        </div>

        {/* Categorías */}
        <div
          className="px-6 py-3 border-b flex gap-2 overflow-x-auto"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              selectedCategory === 'all' ? 'active' : ''
            }`}
            style={{
              background:
                selectedCategory === 'all'
                  ? 'var(--color-primary)'
                  : 'var(--color-bg-tertiary)',
              color:
                selectedCategory === 'all'
                  ? '#ffffff'
                  : 'var(--color-text-secondary)',
            }}
          >
            Todos
          </button>
          {Object.entries(AVAILABLE_HEROICONS).map(([key, category]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                selectedCategory === key ? 'active' : ''
              }`}
              style={{
                background:
                  selectedCategory === key
                    ? 'var(--color-primary)'
                    : 'var(--color-bg-tertiary)',
                color:
                  selectedCategory === key
                    ? '#ffffff'
                    : 'var(--color-text-secondary)',
              }}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Grid de iconos */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredIcons.length === 0 ? (
            <div
              className="text-center py-12"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              No se encontraron iconos
            </div>
          ) : (
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-3">
              {filteredIcons.map((icon) => {
                const IconComponent = HeroIcons[icon.name];
                const isSelected = currentIcon === icon.name;

                return (
                  <button
                    key={icon.name}
                    onClick={() => onSelect(icon.name)}
                    className="aspect-square rounded-lg flex flex-col items-center justify-center p-3 transition-all hover:scale-110"
                    style={{
                      background: isSelected
                        ? 'var(--color-primary)'
                        : 'var(--color-bg-tertiary)',
                      border: isSelected
                        ? '2px solid var(--color-primary)'
                        : '1px solid var(--color-border)',
                      color: isSelected ? '#ffffff' : 'var(--color-text-primary)',
                    }}
                    title={icon.label}
                  >
                    {IconComponent && <IconComponent className="w-6 h-6" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 border-t flex justify-end gap-2"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <BaseButton variant="ghost" onClick={onClose}>
            Cancelar
          </BaseButton>
        </div>
      </div>
    </div>
  );
}

IconPickerModal.propTypes = {
  onSelect: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  currentIcon: PropTypes.string,
};

export default IconPickerModal;
