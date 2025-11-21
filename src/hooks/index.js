/**
 * @fileoverview Barrel export para todos los hooks personalizados
 * @module hooks
 */

// Hooks de autenticación y datos
export { default as useAuth } from './useAuth.js';
export { default as useFirestore } from './useFirestore.js';

// Hooks de recursos
export { default as useCourses } from './useCourses.js';
export { default as useStudents } from './useStudents.js';
export { useUsers } from './useUsers.js';
export { default as useClasses } from './useClasses.js';
export { default as useContent } from './useContent.js';
export { default as useExercises } from './useExercises.js';
export { default as useGroups } from './useGroups.js';
export { useDashboard } from './useDashboard.js';

// Hooks utilitarios
export { useDateFormatter, default as useDateFormatterDefault } from './useDateFormatter.js';
export { useModal, default as useModalDefault } from './useModal.js';
export { useRole, default as useRoleDefault } from './useRole.js';
export { useNotification, default as useNotificationDefault } from './useNotification.js';
export { useFirebaseError, default as useFirebaseErrorDefault } from './useFirebaseError.js';
export { useDebounce, default as useDebounceDefault } from './useDebounce.js';
export { useLocalStorage, default as useLocalStorageDefault } from './useLocalStorage.js';
export { usePagination, default as usePaginationDefault } from './usePagination.js';
export { useProfileEditor } from './useProfileEditor.js';
export { useEnrollments } from './useEnrollments.js';

// Card system hooks
export { useViewMode, default as useViewModeDefault } from './useViewMode.js';

// Badge system hooks
export { default as useBadgeConfig } from './useBadgeConfig.js';

// Correction system hooks
export { useOverlaySettings, default as useOverlaySettingsDefault } from './useOverlaySettings.js';

// Media query hooks
export { useMediaQuery, useIsMobile, useIsTablet, useIsDesktop, useBreakpoint, default as useMediaQueryDefault } from './useMediaQuery.js';
