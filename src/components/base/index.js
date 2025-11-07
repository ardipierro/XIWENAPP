/**
 * XIWENAPP V2 - Base Components
 *
 * This module exports all base template components.
 * These are the ONLY UI templates that should be used in the app.
 *
 * Usage:
 * import { BaseModal, BaseCard, BaseButton } from '@/components/base';
 *
 * Do NOT create custom modals, cards, or buttons.
 * Use these base components with composition instead.
 */

export { default as BaseModal } from './BaseModal';
export { default as BasePanel } from './BasePanel';
export { default as BaseTable } from './BaseTable';
export { default as BaseCard } from './BaseCard';
export { default as BaseButton } from './BaseButton';

// Re-export common components from existing common folder
// (these already exist and follow good patterns)
export { default as BaseLoading } from '../common/BaseLoading';
export { default as BaseEmptyState } from '../common/BaseEmptyState';
export { default as BaseBadge } from '../common/BaseBadge';

/**
 * Component Quick Reference:
 *
 * BaseModal - Dialog overlays
 * BasePanel - Side drawers/panels
 * BaseTable - Data tables with sort/search
 * BaseCard - Content cards, stats boxes
 * BaseButton - All buttons
 * BaseLoading - Loading states
 * BaseEmptyState - Empty state screens
 * BaseBadge - Status badges, pills
 */
