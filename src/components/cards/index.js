/**
 * @fileoverview Barrel exports para el sistema de cards
 * Importar desde aquí para tener acceso a todos los componentes y utilidades
 *
 * @example
 * import { UniversalCard, CardContainer, useViewMode } from './components/cards';
 *
 * @module components/cards
 */

// Main Components
export { UniversalCard, default as Card } from './UniversalCard';
export { CardContainer } from './CardContainer';

// Layout Components
export { CardGrid } from './CardGrid';
export { CardList } from './CardList';
export { CardTable, CardTableRow, CardTableCell } from './CardTable';

// Configuration & Utilities
export * from './cardConfig';

// Note: useViewMode is exported from hooks, not here
// Import it from: import { useViewMode } from '../../hooks/useViewMode';
