/**
 * @fileoverview Modal para seleccionar iconos Heroicons
 * Refactorizado para usar BaseModal
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
import { Search, Grid3X3 } from 'lucide-react';
import { BaseModal, BaseButton, BaseInput, BaseEmptyState } from '../common';
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
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="Seleccionar Icono"
      icon={Grid3X3}
      size="xl"
      noPadding
      footer={
        <div className="flex justify-end">
          <BaseButton variant="ghost" onClick={onClose}>
            Cancelar
          </BaseButton>
        </div>
      }
    >
      {/* Buscador */}
      <div className="px-6 py-4 border-b border-[var(--color-border)]">
        <BaseInput
          placeholder="Buscar icono..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={Search}
        />
      </div>

      {/* Categorías */}
      <div className="px-6 py-3 border-b border-[var(--color-border)] flex gap-2 overflow-x-auto">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
            selectedCategory === 'all'
              ? 'bg-[var(--color-primary)] text-white'
              : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-quaternary)]'
          }`}
        >
          Todos
        </button>
        {Object.entries(AVAILABLE_HEROICONS).map(([key, category]) => (
          <button
            key={key}
            onClick={() => setSelectedCategory(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              selectedCategory === key
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-quaternary)]'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* Grid de iconos */}
      <div className="flex-1 overflow-y-auto p-6 max-h-96">
        {filteredIcons.length === 0 ? (
          <BaseEmptyState
            icon={Search}
            title="No se encontraron iconos"
            description="Intenta con otra búsqueda o categoría"
            size="sm"
          />
        ) : (
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-3">
            {filteredIcons.map((icon) => {
              const IconComponent = HeroIcons[icon.name];
              const isSelected = currentIcon === icon.name;

              return (
                <button
                  key={icon.name}
                  onClick={() => onSelect(icon.name)}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center p-3 transition-all hover:scale-110 ${
                    isSelected
                      ? 'bg-[var(--color-primary)] border-2 border-[var(--color-primary)] text-white'
                      : 'bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-primary)]'
                  }`}
                  title={icon.label}
                >
                  {IconComponent && <IconComponent className="w-6 h-6" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </BaseModal>
  );
}

IconPickerModal.propTypes = {
  onSelect: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  currentIcon: PropTypes.string,
};

export default IconPickerModal;
