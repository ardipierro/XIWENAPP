# 🏗️ XIWENAPP V2 - Arquitectura Modular Detallada

**Fecha:** 2025-11-11
**Propuesta:** Arquitectura Feature-Sliced para V2

---

## 🎯 OBJETIVO

Transformar XIWENAPP de **monolito** a **arquitectura modular por features**, maximizando:
- ✅ **Mantenibilidad** - Cambios aislados por feature
- ✅ **Escalabilidad** - Agregar features sin afectar otros
- ✅ **Performance** - Lazy loading + code splitting óptimo
- ✅ **Developer Experience** - Estructura clara y predecible
- ✅ **Mobile First** - 100% responsive, 0% CSS custom

---

## 📐 PRINCIPIOS ARQUITECTÓNICOS

### 1. Feature-Sliced Design (FSD)

**Concepto:** Cada feature es un módulo independiente con TODO lo necesario.

```
features/courses/
├── components/     ← UI del feature
├── hooks/          ← Lógica del feature
├── services/       ← API calls del feature
├── pages/          ← Páginas del feature
├── types/          ← Types del feature (JSDoc o TS)
├── utils/          ← Utilidades del feature
└── index.js        ← Public API del feature (barrel export)
```

**Ventajas:**
- ✅ **Encapsulación** - Feature no depende de otros features
- ✅ **Testing fácil** - Testear feature completo de forma aislada
- ✅ **Onboarding rápido** - Desarrolladores nuevos entienden rápido
- ✅ **Escalabilidad** - Agregar features = agregar carpeta

### 2. Separation of Concerns

**Layers:**
1. **Core** - Funcionalidad compartida (layout, UI components, contexts)
2. **Features** - Módulos de negocio (courses, exercises, etc.)
3. **Shared** - Utilidades puras (formatters, validators, constants)
4. **Config** - Configuración (firebase, routes, etc.)

**Reglas de dependencias:**
```
Features → Core (✅ permitido)
Features → Shared (✅ permitido)
Features → Config (✅ permitido)
Features → Features (❌ prohibido - usar events o core)

Core → Shared (✅ permitido)
Core → Config (✅ permitido)
Core → Features (❌ prohibido)

Shared → nada (✅ puro, sin dependencias)
```

### 3. Barrel Exports

**Public API clara por feature:**

```javascript
// ❌ Antes (V1) - Imports caóticos
import CourseCard from '../../components/CourseCard';
import CourseList from '../../components/CourseList';
import useCourses from '../../hooks/useCourses';
import { getCourses, createCourse } from '../../firebase/courses';

// ✅ Después (V2) - Clean imports
import {
  CourseCard,
  CourseList,
  useCourses,
  coursesService
} from '@/features/courses';
```

**Implementación:**
```javascript
// features/courses/index.js
export { CourseCard, CourseList } from './components';
export { useCourses } from './hooks';
export { default as coursesService } from './services/coursesService';
export { CoursesPage, CourseDetailPage } from './pages';
```

### 4. Lazy Loading por Feature

**Todo feature se carga bajo demanda:**

```javascript
// routes.jsx
const CoursesFeature = lazy(() => import('@/features/courses'));
const ExercisesFeature = lazy(() => import('@/features/exercises'));
const LiveClassFeature = lazy(() => import('@/features/live-class'));

export const routes = [
  {
    path: '/courses/*',
    element: <Suspense fallback={<Loading />}><CoursesFeature /></Suspense>
  },
  // ...
];
```

**Ventajas:**
- ✅ **Bundle inicial pequeño** (< 200KB)
- ✅ **Cache por feature** - Actualizaciones independientes
- ✅ **Performance móvil** - Solo se carga lo necesario

---

## 🗂️ ESTRUCTURA COMPLETA V2

```
XIWENAPP/
├── public/
│   ├── manifest.json
│   └── icons/
│
├── src/
│   │
│   ├── core/                           ← LAYER 1: Core
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── AppShell.jsx        ← Main layout (TopBar + SideNav + Main)
│   │   │   │   ├── TopBar.jsx          ← 100% Tailwind, responsive
│   │   │   │   ├── SideNav.jsx         ← Desktop sidebar
│   │   │   │   ├── BottomNav.jsx       ← Mobile bottom navigation
│   │   │   │   ├── ViewAsBanner.jsx    ← "Ver como" banner
│   │   │   │   └── index.js
│   │   │   │
│   │   │   └── ui/                      ← Base components
│   │   │       ├── Button.jsx          ← (antes BaseButton)
│   │   │       ├── Input.jsx           ← (antes BaseInput)
│   │   │       ├── Select.jsx          ← (antes BaseSelect)
│   │   │       ├── Textarea.jsx        ← (antes BaseTextarea)
│   │   │       ├── Modal.jsx           ← (antes BaseModal)
│   │   │       ├── Badge.jsx           ← (antes BaseBadge)
│   │   │       ├── Loading.jsx         ← (antes BaseLoading)
│   │   │       ├── Alert.jsx           ← (antes BaseAlert)
│   │   │       ├── Dropdown.jsx        ← (antes BaseDropdown)
│   │   │       ├── EmptyState.jsx      ← (antes BaseEmptyState)
│   │   │       ├── Card.jsx            ← (antes BaseCard)
│   │   │       └── index.js
│   │   │
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx         ← Auth global
│   │   │   ├── ThemeContext.jsx        ← Dark mode
│   │   │   ├── ViewAsContext.jsx       ← "Ver como" feature
│   │   │   └── index.js
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useTheme.js
│   │   │   ├── useViewAs.js
│   │   │   ├── useMediaQuery.js        ← Mobile detection
│   │   │   ├── useLocalStorage.js
│   │   │   └── index.js
│   │   │
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── storageService.js
│   │   │   └── index.js
│   │   │
│   │   └── index.js                     ← Core barrel export
│   │
│   ├── features/                        ← LAYER 2: Features
│   │   │
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.jsx
│   │   │   │   ├── RegisterForm.jsx
│   │   │   │   ├── ForgotPasswordForm.jsx
│   │   │   │   └── index.js
│   │   │   ├── hooks/
│   │   │   │   ├── useLogin.js
│   │   │   │   ├── useRegister.js
│   │   │   │   └── index.js
│   │   │   ├── services/
│   │   │   │   └── authService.js
│   │   │   ├── pages/
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   ├── RegisterPage.jsx
│   │   │   │   └── index.js
│   │   │   └── index.js
│   │   │
│   │   ├── courses/
│   │   │   ├── components/
│   │   │   │   ├── CourseCard.jsx       ← Mobile-first card
│   │   │   │   ├── CourseList.jsx       ← Grid/List view toggle
│   │   │   │   ├── CourseForm.jsx       ← Create/Edit form
│   │   │   │   ├── CourseFilters.jsx
│   │   │   │   ├── CourseSearch.jsx
│   │   │   │   └── index.js
│   │   │   ├── hooks/
│   │   │   │   ├── useCourses.js        ← Fetch courses
│   │   │   │   ├── useCourse.js         ← Single course
│   │   │   │   ├── useCreateCourse.js
│   │   │   │   ├── useUpdateCourse.js
│   │   │   │   ├── useDeleteCourse.js
│   │   │   │   └── index.js
│   │   │   ├── services/
│   │   │   │   └── coursesService.js    ← Firebase calls
│   │   │   ├── pages/
│   │   │   │   ├── CoursesPage.jsx      ← /courses
│   │   │   │   ├── CourseDetailPage.jsx ← /courses/:id
│   │   │   │   ├── CourseEditPage.jsx   ← /courses/:id/edit
│   │   │   │   └── index.js
│   │   │   ├── types/
│   │   │   │   └── course.types.js      ← JSDoc types
│   │   │   └── index.js
│   │   │
│   │   ├── exercises/
│   │   │   ├── components/
│   │   │   │   ├── types/               ← Exercise types
│   │   │   │   │   ├── MultipleChoice.jsx
│   │   │   │   │   ├── FillInBlank.jsx
│   │   │   │   │   ├── Matching.jsx
│   │   │   │   │   ├── TrueFalse.jsx
│   │   │   │   │   ├── DragDrop.jsx
│   │   │   │   │   ├── TextSelection.jsx
│   │   │   │   │   ├── VerbIdentification.jsx
│   │   │   │   │   ├── InteractiveReading.jsx
│   │   │   │   │   └── index.js
│   │   │   │   ├── builder/             ← Exercise Builder
│   │   │   │   │   ├── ExerciseBuilder.jsx
│   │   │   │   │   ├── TypeSelector.jsx
│   │   │   │   │   ├── QuestionEditor.jsx
│   │   │   │   │   ├── AnswerEditor.jsx
│   │   │   │   │   ├── PreviewPanel.jsx
│   │   │   │   │   └── index.js
│   │   │   │   ├── player/              ← Exercise Player
│   │   │   │   │   ├── ExercisePlayer.jsx
│   │   │   │   │   ├── QuestionView.jsx
│   │   │   │   │   ├── AnswerInput.jsx
│   │   │   │   │   ├── ResultsView.jsx
│   │   │   │   │   └── index.js
│   │   │   │   └── index.js
│   │   │   ├── hooks/
│   │   │   │   ├── useExercises.js
│   │   │   │   ├── useExerciseBuilder.js
│   │   │   │   ├── useExercisePlayer.js
│   │   │   │   └── index.js
│   │   │   ├── services/
│   │   │   │   └── exercisesService.js
│   │   │   ├── pages/
│   │   │   │   ├── ExercisesPage.jsx
│   │   │   │   ├── ExerciseBuilderPage.jsx
│   │   │   │   ├── ExercisePlayerPage.jsx
│   │   │   │   └── index.js
│   │   │   └── index.js
│   │   │
│   │   ├── assignments/
│   │   │   ├── components/
│   │   │   │   ├── AssignmentCard.jsx
│   │   │   │   ├── AssignmentList.jsx
│   │   │   │   ├── AssignmentForm.jsx
│   │   │   │   ├── SubmissionView.jsx
│   │   │   │   └── index.js
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── pages/
│   │   │   └── index.js
│   │   │
│   │   ├── calendar/
│   │   │   ├── components/
│   │   │   │   ├── Calendar.jsx
│   │   │   │   ├── EventCard.jsx
│   │   │   │   ├── DayView.jsx
│   │   │   │   ├── WeekView.jsx
│   │   │   │   ├── MonthView.jsx
│   │   │   │   └── index.js
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── pages/
│   │   │   └── index.js
│   │   │
│   │   ├── live-class/                  ← LiveKit + Whiteboard
│   │   │   ├── components/
│   │   │   │   ├── ClassRoom.jsx
│   │   │   │   ├── VideoGrid.jsx
│   │   │   │   ├── Whiteboard.jsx       ← Excalidraw wrapper
│   │   │   │   ├── Chat.jsx
│   │   │   │   ├── ParticipantsList.jsx
│   │   │   │   └── index.js
│   │   │   ├── hooks/
│   │   │   │   ├── useLiveKit.js
│   │   │   │   ├── useWhiteboard.js
│   │   │   │   └── index.js
│   │   │   ├── services/
│   │   │   │   └── liveClassService.js
│   │   │   ├── pages/
│   │   │   │   ├── LiveClassPage.jsx
│   │   │   │   └── index.js
│   │   │   └── index.js
│   │   │
│   │   ├── messaging/
│   │   │   ├── components/
│   │   │   │   ├── MessageList.jsx
│   │   │   │   ├── MessageThread.jsx
│   │   │   │   ├── MessageInput.jsx
│   │   │   │   ├── NewMessageModal.jsx
│   │   │   │   └── index.js
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── pages/
│   │   │   └── index.js
│   │   │
│   │   ├── analytics/
│   │   │   ├── components/
│   │   │   │   ├── DashboardStats.jsx
│   │   │   │   ├── Chart.jsx
│   │   │   │   ├── StatsCard.jsx
│   │   │   │   └── index.js
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── pages/
│   │   │   └── index.js
│   │   │
│   │   ├── payments/                    ← MercadoPago
│   │   │   ├── components/
│   │   │   │   ├── PaymentForm.jsx
│   │   │   │   ├── PaymentHistory.jsx
│   │   │   │   ├── InvoiceView.jsx
│   │   │   │   └── index.js
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   │   └── mercadoPagoService.js
│   │   │   ├── pages/
│   │   │   └── index.js
│   │   │
│   │   ├── gamification/
│   │   │   ├── components/
│   │   │   │   ├── PointsDisplay.jsx
│   │   │   │   ├── BadgesList.jsx
│   │   │   │   ├── Leaderboard.jsx
│   │   │   │   ├── StreakCounter.jsx
│   │   │   │   └── index.js
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── pages/
│   │   │   └── index.js
│   │   │
│   │   ├── admin/
│   │   │   ├── components/
│   │   │   │   ├── UserManager.jsx
│   │   │   │   ├── RoleManager.jsx
│   │   │   │   ├── SettingsPanel.jsx
│   │   │   │   └── index.js
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   ├── pages/
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   └── index.js
│   │   │   └── index.js
│   │   │
│   │   ├── student/
│   │   │   ├── pages/
│   │   │   │   ├── StudentDashboard.jsx
│   │   │   │   └── index.js
│   │   │   └── index.js
│   │   │
│   │   ├── teacher/
│   │   │   ├── pages/
│   │   │   │   ├── TeacherDashboard.jsx
│   │   │   │   └── index.js
│   │   │   └── index.js
│   │   │
│   │   └── guardian/
│   │       ├── pages/
│   │       │   ├── GuardianDashboard.jsx
│   │       │   └── index.js
│   │       └── index.js
│   │
│   ├── shared/                          ← LAYER 3: Shared utilities
│   │   ├── utils/
│   │   │   ├── formatters/
│   │   │   │   ├── dateFormatter.js
│   │   │   │   ├── numberFormatter.js
│   │   │   │   ├── currencyFormatter.js
│   │   │   │   └── index.js
│   │   │   ├── validators/
│   │   │   │   ├── emailValidator.js
│   │   │   │   ├── passwordValidator.js
│   │   │   │   ├── formValidator.js
│   │   │   │   └── index.js
│   │   │   ├── parsers/
│   │   │   │   ├── exerciseParser.js
│   │   │   │   ├── csvParser.js
│   │   │   │   └── index.js
│   │   │   ├── logger.js
│   │   │   ├── errorHandler.js
│   │   │   └── index.js
│   │   ├── constants/
│   │   │   ├── routes.js
│   │   │   ├── roles.js
│   │   │   ├── exerciseTypes.js
│   │   │   └── index.js
│   │   ├── types/                       ← JSDoc types o TS
│   │   │   ├── user.types.js
│   │   │   ├── course.types.js
│   │   │   ├── exercise.types.js
│   │   │   └── index.js
│   │   └── index.js
│   │
│   ├── config/                          ← LAYER 4: Config
│   │   ├── firebase.js                  ← Firebase config
│   │   ├── routes.js                    ← Routes config
│   │   ├── theme.js                     ← Theme tokens
│   │   └── index.js
│   │
│   ├── App.jsx                          ← Root component
│   ├── main.jsx                         ← Entry point
│   ├── routes.jsx                       ← Routes definition
│   └── globals.css                      ← Solo CSS variables
│
├── .claude/
│   ├── MASTER_STANDARDS.md
│   ├── MOBILE_FIRST_GUIDELINES.md       ← ✨ NUEVO
│   └── README.md
│
├── vite.config.js
├── tailwind.config.js
├── package.json
├── MOBILE_FIRST_ANALYSIS.md             ← Este documento
├── ARCHITECTURE_V2_PROPOSAL.md          ← Detalle V2
└── README.md
```

---

## 🔄 EJEMPLO COMPLETO: Feature "Courses"

### Estructura
```
features/courses/
├── components/
│   ├── CourseCard.jsx
│   ├── CourseList.jsx
│   ├── CourseForm.jsx
│   ├── CourseFilters.jsx
│   └── index.js
├── hooks/
│   ├── useCourses.js
│   ├── useCourse.js
│   ├── useCreateCourse.js
│   └── index.js
├── services/
│   └── coursesService.js
├── pages/
│   ├── CoursesPage.jsx
│   ├── CourseDetailPage.jsx
│   └── index.js
├── types/
│   └── course.types.js
└── index.js
```

### Código de Ejemplo

#### `features/courses/components/CourseCard.jsx`
```javascript
/**
 * CourseCard - Mobile-first card component
 * @module features/courses/components/CourseCard
 */
import { Card, Badge, Button } from '@/core/components/ui';

/**
 * @typedef {Object} CourseCardProps
 * @property {import('../types/course.types').Course} course
 * @property {Function} onView
 * @property {Function} onEdit
 */

/**
 * @param {CourseCardProps} props
 */
export default function CourseCard({ course, onView, onEdit }) {
  return (
    <Card className="flex flex-col h-full">
      {/* Image - Mobile first, full width */}
      {course.imageUrl ? (
        <img
          src={course.imageUrl}
          alt={course.name}
          className="w-full h-48 object-cover rounded-t-lg"
        />
      ) : (
        <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-t-lg flex items-center justify-center">
          <span className="text-4xl">📚</span>
        </div>
      )}

      {/* Content - Padding responsive */}
      <div className="flex flex-col flex-1 p-4 sm:p-6">
        {/* Title - Responsive font size */}
        <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">
          {course.name}
        </h3>

        {/* Description - Clamp lines */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {course.description}
        </p>

        {/* Badges - Responsive gap */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="primary">{course.level}</Badge>
          <Badge variant="secondary">{course.language}</Badge>
        </div>

        {/* Stats - Responsive grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4 text-sm text-gray-600 dark:text-gray-400">
          <div>📖 {course.lessonsCount} lecciones</div>
          <div>👥 {course.studentsCount} estudiantes</div>
          <div className="col-span-2 sm:col-span-1">⏱️ {course.duration}</div>
        </div>

        {/* Actions - Responsive stack */}
        <div className="flex flex-col sm:flex-row gap-2 mt-auto">
          <Button variant="primary" onClick={onView} className="flex-1">
            Ver curso
          </Button>
          {onEdit && (
            <Button variant="outline" onClick={onEdit} className="flex-1">
              Editar
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
```

#### `features/courses/hooks/useCourses.js`
```javascript
/**
 * useCourses hook - Fetch and manage courses
 * @module features/courses/hooks/useCourses
 */
import { useState, useEffect } from 'react';
import { logger } from '@/shared/utils';
import coursesService from '../services/coursesService';

/**
 * @typedef {Object} UseCoursesReturn
 * @property {import('../types/course.types').Course[]} courses
 * @property {boolean} loading
 * @property {Error|null} error
 * @property {Function} refetch
 */

/**
 * Hook para obtener lista de cursos
 * @param {Object} options
 * @param {string} [options.teacherId] - Filtrar por profesor
 * @param {string} [options.level] - Filtrar por nivel
 * @returns {UseCoursesReturn}
 */
export default function useCourses({ teacherId, level } = {}) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await coursesService.getAll({ teacherId, level });
      setCourses(data);

      logger.info('Courses fetched successfully', { count: data.length });
    } catch (err) {
      logger.error('Error fetching courses', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [teacherId, level]);

  return {
    courses,
    loading,
    error,
    refetch: fetchCourses
  };
}
```

#### `features/courses/services/coursesService.js`
```javascript
/**
 * Courses Service - Firebase operations
 * @module features/courses/services/coursesService
 */
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { logger } from '@/shared/utils';

const COLLECTION = 'courses';

const coursesService = {
  /**
   * Get all courses
   * @param {Object} filters
   * @returns {Promise<import('../types/course.types').Course[]>}
   */
  async getAll(filters = {}) {
    try {
      let q = collection(db, COLLECTION);

      // Apply filters
      if (filters.teacherId) {
        q = query(q, where('teacherId', '==', filters.teacherId));
      }
      if (filters.level) {
        q = query(q, where('level', '==', filters.level));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      logger.error('Error getting courses', error);
      throw error;
    }
  },

  /**
   * Get single course
   * @param {string} id
   * @returns {Promise<import('../types/course.types').Course>}
   */
  async getById(id) {
    try {
      const docRef = doc(db, COLLECTION, id);
      const snapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        throw new Error('Course not found');
      }

      return {
        id: snapshot.id,
        ...snapshot.data()
      };
    } catch (error) {
      logger.error('Error getting course', error);
      throw error;
    }
  },

  /**
   * Create course
   * @param {import('../types/course.types').CourseInput} data
   * @returns {Promise<string>} Course ID
   */
  async create(data) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION), {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      logger.info('Course created', { id: docRef.id });
      return docRef.id;
    } catch (error) {
      logger.error('Error creating course', error);
      throw error;
    }
  },

  /**
   * Update course
   * @param {string} id
   * @param {Partial<import('../types/course.types').CourseInput>} data
   */
  async update(id, data) {
    try {
      const docRef = doc(db, COLLECTION, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date()
      });

      logger.info('Course updated', { id });
    } catch (error) {
      logger.error('Error updating course', error);
      throw error;
    }
  },

  /**
   * Delete course
   * @param {string} id
   */
  async delete(id) {
    try {
      const docRef = doc(db, COLLECTION, id);
      await deleteDoc(docRef);

      logger.info('Course deleted', { id });
    } catch (error) {
      logger.error('Error deleting course', error);
      throw error;
    }
  }
};

export default coursesService;
```

#### `features/courses/pages/CoursesPage.jsx`
```javascript
/**
 * CoursesPage - Main courses page
 * @module features/courses/pages/CoursesPage
 */
import { useState } from 'react';
import { CourseCard, CourseList, CourseFilters } from '../components';
import { useCourses } from '../hooks';
import { Button, Loading, EmptyState } from '@/core/components/ui';
import { logger } from '@/shared/utils';

export default function CoursesPage() {
  const [filters, setFilters] = useState({});
  const [view, setView] = useState('grid'); // grid | list
  const { courses, loading, error, refetch } = useCourses(filters);

  const handleCreateCourse = () => {
    logger.info('Create course clicked');
    // TODO: Open modal or navigate
  };

  const handleViewCourse = (course) => {
    logger.info('View course', { courseId: course.id });
    // TODO: Navigate to course detail
  };

  if (loading) {
    return <Loading text="Cargando cursos..." />;
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6">
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">
            Error al cargar cursos: {error.message}
          </p>
          <Button onClick={refetch} className="mt-4">
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
            Cursos
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {courses.length} cursos disponibles
          </p>
        </div>
        <Button variant="primary" onClick={handleCreateCourse}>
          <span className="hidden sm:inline">Crear curso</span>
          <span className="sm:hidden">+ Nuevo</span>
        </Button>
      </div>

      {/* Filters */}
      <CourseFilters
        filters={filters}
        onFiltersChange={setFilters}
        view={view}
        onViewChange={setView}
      />

      {/* Courses Grid/List */}
      {courses.length === 0 ? (
        <EmptyState
          icon="📚"
          title="No hay cursos"
          description="Crea tu primer curso para empezar"
          action={
            <Button variant="primary" onClick={handleCreateCourse}>
              Crear curso
            </Button>
          }
        />
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {courses.map(course => (
            <CourseCard
              key={course.id}
              course={course}
              onView={() => handleViewCourse(course)}
            />
          ))}
        </div>
      ) : (
        <CourseList
          courses={courses}
          onViewCourse={handleViewCourse}
        />
      )}
    </div>
  );
}
```

#### `features/courses/index.js` (Barrel Export)
```javascript
/**
 * Courses Feature - Public API
 * @module features/courses
 */

// Components
export { default as CourseCard } from './components/CourseCard';
export { default as CourseList } from './components/CourseList';
export { default as CourseForm } from './components/CourseForm';
export { default as CourseFilters } from './components/CourseFilters';

// Hooks
export { default as useCourses } from './hooks/useCourses';
export { default as useCourse } from './hooks/useCourse';
export { default as useCreateCourse } from './hooks/useCreateCourse';

// Services
export { default as coursesService } from './services/coursesService';

// Pages
export { default as CoursesPage } from './pages/CoursesPage';
export { default as CourseDetailPage } from './pages/CourseDetailPage';

// Types (re-export for convenience)
export * from './types/course.types';
```

---

## 🚀 BENEFICIOS V2 vs V1

### V1 (Actual)
```javascript
// ❌ 167 archivos en /components (monolito)
// ❌ Imports caóticos
import CourseCard from '../../components/CourseCard';
import useCourses from '../../hooks/useCourses';
import { getCourses } from '../../firebase/courses';

// ❌ CSS custom importado
import './CoursesScreen.css';

// ❌ No lazy loading
// ❌ Bundle grande (1 chunk monolítico)
// ❌ Difícil de mantener
```

### V2 (Propuesta)
```javascript
// ✅ Features organizados por carpeta
// ✅ Imports limpios
import {
  CourseCard,
  useCourses,
  coursesService
} from '@/features/courses';

// ✅ 100% Tailwind (no CSS custom)
// ✅ Lazy loading automático
const CoursesFeature = lazy(() => import('@/features/courses'));

// ✅ Bundle pequeño (< 200KB por feature)
// ✅ Fácil de mantener
// ✅ Testeable por feature
```

---

## 📝 NEXT STEPS

1. **Revisar propuesta** con el equipo
2. **Decidir timeline** de migración
3. **Crear branch** `v2-modular`
4. **Implementar Quick Wins** primero
5. **Migrar feature por feature** gradualmente

---

**Autor:** Claude Code
**Fecha:** 2025-11-11
**Versión:** 1.0
