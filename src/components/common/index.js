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
export { default as ExpandableModal } from './ExpandableModal';
export { default as ImageLightbox } from './ImageLightbox';

// Feedback & Status
export { default as BaseBadge } from './BaseBadge';
export { default as CategoryBadge } from './CategoryBadge';
export { default as BaseLoading } from './BaseLoading';
export { default as BaseAlert } from './BaseAlert';

// Skeleton Screens - Loading placeholders
export {
  default as Skeleton,
  SkeletonCard,
  SkeletonListItem,
  SkeletonDashboard,
  SkeletonTable,
  SkeletonText,
  SkeletonProfile
} from './SkeletonScreen';

// Navigation & Menus
export { default as BaseDropdown } from './BaseDropdown';
export { default as BaseTabs } from './BaseTabs';

// Empty States
export { default as BaseEmptyState } from './BaseEmptyState';

// Search & Filters
export { default as SearchBar } from './SearchBar';

// Legacy components (mantener por compatibilidad)
export { default as EmptyState } from './EmptyState';
export { default as PageHeader } from './PageHeader';
export { default as ErrorBoundary } from './ErrorBoundary';
