/**
 * @fileoverview Barrel export para todos los hooks personalizados
 * @module hooks
 */

// Hooks existentes
export { default as useAuth } from './useAuth.js';
export { default as useFirestore } from './useFirestore.js';
export { default as useCourses } from './useCourses.js';
export { default as useStudents } from './useStudents.js';

// Nuevos hooks utilitarios
export { useDateFormatter, default as useDateFormatterDefault } from './useDateFormatter.js';
export { useModal, default as useModalDefault } from './useModal.js';
export { useRole, default as useRoleDefault } from './useRole.js';
export { useNotification, default as useNotificationDefault } from './useNotification.js';
export { useFirebaseError, default as useFirebaseErrorDefault } from './useFirebaseError.js';
export { useDebounce, default as useDebounceDefault } from './useDebounce.js';
export { useLocalStorage, default as useLocalStorageDefault } from './useLocalStorage.js';
export { usePagination, default as usePaginationDefault } from './usePagination.js';
