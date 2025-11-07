# 🔌 Integración del ExerciseMakerESL

Ejemplos de cómo integrar el componente ExerciseMakerESL en diferentes partes de tu aplicación.

## 🎯 Integración en TeacherDashboard

### Opción 1: Botón en la Barra Superior (TopBar)

```jsx
// src/components/TopBar.jsx
import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import ExerciseMakerESL from './ExerciseMakerESL';

function TopBar() {
  const [showExerciseMaker, setShowExerciseMaker] = useState(false);

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800">
      {/* ... otros elementos ... */}

      <div className="flex items-center gap-4">
        <button
          onClick={() => setShowExerciseMaker(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:shadow-lg transition-all"
        >
          <Sparkles className="w-5 h-5" />
          <span className="hidden md:inline">Crear con IA</span>
        </button>

        {/* ... otros botones ... */}
      </div>

      <ExerciseMakerESL
        isOpen={showExerciseMaker}
        onClose={() => setShowExerciseMaker(false)}
      />
    </header>
  );
}
```

### Opción 2: En el Menú Lateral (SideMenu)

```jsx
// src/components/SideMenu.jsx
import { useState } from 'react';
import { Sparkles, Book, Users, Settings } from 'lucide-react';
import ExerciseMakerESL from './ExerciseMakerESL';

function SideMenu() {
  const [showExerciseMaker, setShowExerciseMaker] = useState(false);

  const menuItems = [
    { icon: Book, label: 'Cursos', action: () => {} },
    { icon: Users, label: 'Estudiantes', action: () => {} },
    {
      icon: Sparkles,
      label: 'Generador IA',
      action: () => setShowExerciseMaker(true),
      highlight: true // Para destacarlo
    },
    { icon: Settings, label: 'Configuración', action: () => {} },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r">
      <nav className="p-4 space-y-2">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={item.action}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-lg
              transition-all hover:bg-gray-100 dark:hover:bg-gray-700
              ${item.highlight ? 'bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700' : ''}
            `}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
            {item.highlight && (
              <span className="ml-auto px-2 py-1 bg-purple-500 text-white text-xs rounded-full">
                Nuevo
              </span>
            )}
          </button>
        ))}
      </nav>

      <ExerciseMakerESL
        isOpen={showExerciseMaker}
        onClose={() => setShowExerciseMaker(false)}
      />
    </aside>
  );
}
```

### Opción 3: Card de Acceso Rápido en Dashboard

```jsx
// src/components/TeacherDashboard.jsx
import { useState } from 'react';
import { Sparkles, TrendingUp, Clock, Award } from 'lucide-react';
import ExerciseMakerESL from './ExerciseMakerESL';
import BaseCard from './common/BaseCard';

function TeacherDashboard() {
  const [showExerciseMaker, setShowExerciseMaker] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Panel del Profesor</h1>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* AI Generator Card */}
        <BaseCard
          className="cursor-pointer hover:shadow-xl transition-all bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-700"
          onClick={() => setShowExerciseMaker(true)}
        >
          <div className="flex flex-col items-center text-center space-y-3 p-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-bold text-lg">Generador IA</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Crea ejercicios ESL con inteligencia artificial
            </p>
            <span className="px-3 py-1 bg-purple-500 text-white text-xs rounded-full font-semibold">
              ✨ Nuevo
            </span>
          </div>
        </BaseCard>

        {/* Other quick action cards */}
        <BaseCard>
          <div className="flex flex-col items-center text-center space-y-3 p-4">
            <TrendingUp className="w-12 h-12 text-green-500" />
            <h3 className="font-bold">Progreso</h3>
          </div>
        </BaseCard>

        <BaseCard>
          <div className="flex flex-col items-center text-center space-y-3 p-4">
            <Clock className="w-12 h-12 text-blue-500" />
            <h3 className="font-bold">Historial</h3>
          </div>
        </BaseCard>

        <BaseCard>
          <div className="flex flex-col items-center text-center space-y-3 p-4">
            <Award className="w-12 h-12 text-amber-500" />
            <h3 className="font-bold">Logros</h3>
          </div>
        </BaseCard>
      </div>

      {/* Modal */}
      <ExerciseMakerESL
        isOpen={showExerciseMaker}
        onClose={() => setShowExerciseMaker(false)}
      />

      {/* Rest of dashboard */}
    </div>
  );
}
```

### Opción 4: Botón Flotante (FAB)

```jsx
// src/components/TeacherDashboard.jsx
import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import ExerciseMakerESL from './ExerciseMakerESL';

function TeacherDashboard() {
  const [showExerciseMaker, setShowExerciseMaker] = useState(false);

  return (
    <div className="relative min-h-screen">
      {/* Dashboard content */}

      {/* Floating Action Button */}
      <button
        onClick={() => setShowExerciseMaker(true)}
        className="
          fixed bottom-6 right-6 z-50
          w-16 h-16 md:w-auto md:h-auto md:px-6 md:py-4
          bg-gradient-to-r from-purple-500 to-blue-500
          text-white rounded-full md:rounded-xl
          shadow-2xl hover:shadow-3xl
          transition-all duration-300
          hover:scale-110 active:scale-95
          flex items-center justify-center gap-2
          group
        "
        title="Crear ejercicios con IA"
      >
        <Sparkles className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
        <span className="hidden md:inline font-semibold">Crear con IA</span>
      </button>

      <ExerciseMakerESL
        isOpen={showExerciseMaker}
        onClose={() => setShowExerciseMaker(false)}
      />
    </div>
  );
}
```

## 🎨 Variantes de Diseño

### Botón Minimalista

```jsx
<button
  onClick={() => setShowExerciseMaker(true)}
  className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all"
>
  <Sparkles className="w-5 h-5" />
  Generador IA
</button>
```

### Botón con Badge "New"

```jsx
<button
  onClick={() => setShowExerciseMaker(true)}
  className="relative flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-all"
>
  <Sparkles className="w-5 h-5" />
  Generador IA
  <span className="absolute -top-2 -right-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full animate-pulse">
    New
  </span>
</button>
```

### Botón Gradiente Animado

```jsx
<button
  onClick={() => setShowExerciseMaker(true)}
  className="
    relative flex items-center gap-2 px-6 py-3
    bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500
    bg-size-200 bg-pos-0 hover:bg-pos-100
    text-white font-semibold rounded-xl
    transition-all duration-500
    hover:shadow-2xl hover:scale-105
    group
  "
>
  <Sparkles className="w-5 h-5 group-hover:animate-spin" />
  Crear con IA
</button>

{/* Añadir a globals.css: */}
/*
.bg-size-200 {
  background-size: 200% auto;
}
.bg-pos-0 {
  background-position: 0% center;
}
.hover\:bg-pos-100:hover {
  background-position: 100% center;
}
*/
```

## 🎮 Atajos de Teclado

Añade atajos globales para abrir el modal:

```jsx
// src/hooks/useExerciseMakerShortcut.js
import { useEffect } from 'react';

export function useExerciseMakerShortcut(callback) {
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ctrl/Cmd + Shift + E
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [callback]);
}

// Uso:
function TeacherDashboard() {
  const [showExerciseMaker, setShowExerciseMaker] = useState(false);

  useExerciseMakerShortcut(() => setShowExerciseMaker(true));

  return (
    <div>
      <p className="text-sm text-gray-500">
        Atajo: <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>E</kbd>
      </p>
      {/* ... */}
    </div>
  );
}
```

## 📊 Con Estado de Carga y Feedback

```jsx
function TeacherDashboard() {
  const [showExerciseMaker, setShowExerciseMaker] = useState(false);
  const [recentlyCreated, setRecentlyCreated] = useState(null);

  const handleClose = (exercises) => {
    setShowExerciseMaker(false);

    if (exercises && exercises.length > 0) {
      setRecentlyCreated(exercises);

      // Toast notification
      showToast({
        type: 'success',
        message: `¡${exercises.length} ejercicio(s) creado(s) exitosamente!`
      });
    }
  };

  return (
    <div>
      {recentlyCreated && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
          <p className="text-green-700 dark:text-green-300 font-medium">
            ✓ Últimos ejercicios creados: {recentlyCreated.length}
          </p>
        </div>
      )}

      <button onClick={() => setShowExerciseMaker(true)}>
        Crear Ejercicios
      </button>

      <ExerciseMakerESL
        isOpen={showExerciseMaker}
        onClose={handleClose}
      />
    </div>
  );
}
```

## 🔄 Guardar Ejercicios Automáticamente

Extiende el componente para guardar en Firebase:

```jsx
// src/components/ExerciseMakerESLWithSave.jsx
import { useState } from 'react';
import ExerciseMakerESL from './ExerciseMakerESL';
import ExerciseRepository from '../services/ExerciseRepository';
import { useAuth } from '../hooks/useAuth';

function ExerciseMakerESLWithSave({ isOpen, onClose, onSave }) {
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  const handleSaveExercises = async (exercises) => {
    setIsSaving(true);

    try {
      const savedExercises = [];

      for (const exercise of exercises) {
        const exerciseData = {
          title: `ESL ${exercise.type} - ${new Date().toLocaleDateString()}`,
          type: exercise.type,
          category: 'ESL',
          difficulty: 'medium', // Mapear desde CEFR
          questions: [exercise], // Adaptar según tu schema
          createdBy: user.id,
          tags: ['ESL', 'IA-Generated']
        };

        const result = await ExerciseRepository.create(exerciseData);

        if (result.success) {
          savedExercises.push(result.data);
        }
      }

      onSave?.(savedExercises);
      onClose();

      showToast({
        type: 'success',
        message: `${savedExercises.length} ejercicio(s) guardado(s)`
      });

    } catch (error) {
      showToast({
        type: 'error',
        message: 'Error al guardar ejercicios'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ExerciseMakerESL
      isOpen={isOpen}
      onClose={onClose}
      onExercisesGenerated={handleSaveExercises}
      isSaving={isSaving}
    />
  );
}
```

## 🎯 Integración Completa Recomendada

```jsx
// src/pages/TeacherDashboard.jsx
import { useState } from 'react';
import { Sparkles, Book, Users, BarChart3 } from 'lucide-react';
import ExerciseMakerESL from '../components/ExerciseMakerESL';
import BaseCard from '../components/common/BaseCard';
import PageHeader from '../components/common/PageHeader';

function TeacherDashboard() {
  const [showExerciseMaker, setShowExerciseMaker] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <PageHeader
        title="Panel del Profesor"
        subtitle="Gestiona tus clases y crea contenido educativo"
        actions={
          <button
            onClick={() => setShowExerciseMaker(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:shadow-xl transition-all"
          >
            <Sparkles className="w-5 h-5" />
            <span>Crear con IA</span>
          </button>
        }
      />

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <BaseCard>
            <div className="flex items-center gap-4">
              <Book className="w-12 h-12 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Cursos</p>
                <p className="text-2xl font-bold">12</p>
              </div>
            </div>
          </BaseCard>

          <BaseCard>
            <div className="flex items-center gap-4">
              <Users className="w-12 h-12 text-green-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Estudiantes</p>
                <p className="text-2xl font-bold">245</p>
              </div>
            </div>
          </BaseCard>

          <BaseCard>
            <div className="flex items-center gap-4">
              <BarChart3 className="w-12 h-12 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ejercicios</p>
                <p className="text-2xl font-bold">89</p>
              </div>
            </div>
          </BaseCard>
        </div>

        {/* AI Generator CTA */}
        <BaseCard className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-700">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-1">Generador de Ejercicios con IA</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Crea ejercicios ESL personalizados en segundos
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowExerciseMaker(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:shadow-xl transition-all whitespace-nowrap"
            >
              Comenzar →
            </button>
          </div>
        </BaseCard>

        {/* Recent Activity */}
        {/* ... */}
      </div>

      {/* Modal */}
      <ExerciseMakerESL
        isOpen={showExerciseMaker}
        onClose={() => setShowExerciseMaker(false)}
      />
    </div>
  );
}

export default TeacherDashboard;
```

## 🚀 Listo para Usar

Con estas integraciones, el componente ExerciseMakerESL estará perfectamente integrado en tu aplicación con un diseño profesional y accesible desde múltiples puntos.

---

**Master de Coding y Diseño** 🎨
