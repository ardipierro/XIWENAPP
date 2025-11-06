/**
 * Base Components - Barrel export
 *
 * Exporta todos los componentes base para importación simplificada.
 *
 * Uso:
 * import { BaseButton, BaseInput, BaseCard } from './common';
 */

// Buttons & Actions
export { default as BaseButton } from './BaseButton';

// Forms
export { default as BaseInput } from './BaseInput';
export { default as BaseSelect } from './BaseSelect';
export { default as BaseTextarea } from './BaseTextarea';

// Layout & Display
export { default as BaseCard } from './BaseCard';
export { default as BaseModal, useModal } from './BaseModal';

// Feedback & Status
export { default as BaseBadge } from './BaseBadge';
export { default as BaseLoading } from './BaseLoading';
export { default as BaseAlert } from './BaseAlert';

// Navigation & Menus
export { default as BaseDropdown } from './BaseDropdown';

// Empty States
export { default as BaseEmptyState } from './BaseEmptyState';

// Legacy components (mantener por compatibilidad)
export { default as EmptyState } from './EmptyState';
export { default as LoadingSpinner } from './LoadingSpinner';
export { default as PageHeader } from './PageHeader';
export { default as ErrorBoundary } from './ErrorBoundary';
