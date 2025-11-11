# 📘 XIWENAPP - Guía del Proyecto

**Última actualización:** 2025-11-11
**Versión:** 2.0 - Consolidada

---

## 🚀 Inicio Rápido

### Para Claude Code

**Bienvenido Claude Code!** Esta es tu guía principal para trabajar en XIWENAPP.

### 📚 Documentación Disponible

| Archivo | Contenido | Cuándo Leer |
|---------|-----------|-------------|
| **GUIDE.md** (este archivo) | Estructura del proyecto, inicio rápido | Siempre primero |
| **CODING_STANDARDS.md** | Reglas de código, componentes base | Antes de escribir código |
| **DESIGN_SYSTEM.md** | Sistema de diseño, colores, responsive | Antes de crear/modificar UI |
| **DESIGN_LAB.md** | Sistema de ejercicios ELE | Al trabajar con ejercicios |
| **CONTENT_SCHEMA.md** | Arquitectura de contenidos | Al trabajar con contenidos/cursos |

---

## 🎯 Flujo de Trabajo Recomendado

### Si vas a crear/modificar un componente:

1. **Lee:** `CODING_STANDARDS.md` → Reglas Core
2. **Consulta:** `CODING_STANDARDS.md` → Componentes Base
3. **Consulta:** `DESIGN_SYSTEM.md` → Sistema de Colores y Estilos
4. **Implementa** usando:
   - ✅ 100% Tailwind CSS
   - ✅ Componentes base (NO HTML nativo)
   - ✅ Dark mode (`dark:` classes)
   - ✅ Logger (NO console.*)
   - ✅ Mobile First

### Si vas a trabajar con diseño/UI:

1. **Lee:** `DESIGN_SYSTEM.md` → Paleta de Colores
2. **Lee:** `DESIGN_SYSTEM.md` → Mobile First
3. **Consulta:** `DESIGN_SYSTEM.md` → Componentes UI (Cards, Modales, etc.)
4. **Verifica:** Breakpoints, touch targets, responsive

### Si vas a trabajar con ejercicios:

1. **Lee:** `DESIGN_LAB.md` → Sistema de Ejercicios
2. **Consulta:** Parser de texto y tipos de ejercicios

### Si vas a trabajar con contenidos/cursos:

1. **Lee:** `CONTENT_SCHEMA.md` → Arquitectura unificada
2. **Consulta:** Esquema de datos y relaciones

---

## 📁 Estructura del Proyecto

```
XIWENAPP/
├── .claude/                        ← Documentación
│   ├── GUIDE.md                    ← Este archivo
│   ├── CODING_STANDARDS.md         ← Código y componentes
│   ├── DESIGN_SYSTEM.md            ← Diseño y UI
│   ├── DESIGN_LAB.md               ← Ejercicios ELE
│   ├── CONTENT_SCHEMA.md           ← Arquitectura de datos
│   └── settings.local.json         ← Configuración
│
├── src/
│   ├── components/
│   │   ├── common/                 ← ⭐ COMPONENTES BASE (USAR SIEMPRE)
│   │   │   ├── index.js            ← Barrel exports
│   │   │   ├── BaseButton.jsx
│   │   │   ├── BaseCard.jsx
│   │   │   ├── BaseModal.jsx
│   │   │   ├── BaseInput.jsx
│   │   │   ├── BaseSelect.jsx
│   │   │   ├── BaseTextarea.jsx
│   │   │   ├── BaseBadge.jsx
│   │   │   ├── BaseLoading.jsx
│   │   │   ├── BaseAlert.jsx
│   │   │   ├── BaseDropdown.jsx
│   │   │   └── BaseEmptyState.jsx
│   │   │
│   │   ├── designlab/              ← Sistema de ejercicios ELE
│   │   │   ├── exercises/
│   │   │   ├── TextToExerciseParser.jsx
│   │   │   └── SettingsPanel.jsx
│   │   │
│   │   ├── student/
│   │   │   ├── MyCourses.jsx       ← ✅ Refactorizado
│   │   │   ├── MyAssignments.jsx   ← ✅ Refactorizado
│   │   │   ├── CourseViewer.jsx
│   │   │   └── ContentPlayer.jsx
│   │   │
│   │   ├── teacher/
│   │   │   ├── CourseManager.jsx
│   │   │   ├── ContentManager.jsx
│   │   │   └── ExerciseManager.jsx
│   │   │
│   │   ├── StudentDashboard.jsx    ← ✅ Refactorizado
│   │   ├── TeacherDashboard.jsx    ← ⚠️  Parcialmente refactorizado
│   │   └── AdminDashboard.jsx      ← ⚠️  Parcialmente refactorizado
│   │
│   ├── config/
│   │   └── designTokens.js         ← ⭐ Design tokens (colores, espaciado)
│   │
│   ├── contexts/
│   │   ├── AuthContext.jsx
│   │   └── ThemeContext.jsx        ← Dark mode
│   │
│   ├── hooks/
│   │   ├── useDesignLabConfig.js   ← Config del Design Lab
│   │   └── useExerciseState.js     ← Estado de ejercicios
│   │
│   ├── firebase/
│   │   ├── config.js
│   │   ├── auth.js
│   │   ├── courses.js
│   │   ├── content.js
│   │   ├── exercises.js
│   │   ├── groups.js
│   │   ├── storage.js
│   │   └── designLabConfig.js
│   │
│   └── utils/
│       └── logger.js               ← ⭐ USAR EN LUGAR DE console.*
│
├── public/
├── firestore.rules
├── storage.rules
├── package.json
├── tailwind.config.js              ← Configuración de Tailwind
└── vite.config.js
```

---

## 🧩 Componentes Base Disponibles

Importa desde `'../common'` o `'../../components/common'`:

```javascript
import {
  BaseButton,      // 7 variants (primary, secondary, success, danger, warning, ghost, outline)
  BaseCard,        // Cards flexibles (image, icon, avatar, badges, stats, actions)
  BaseModal,       // Modales completos con footer
  BaseInput,       // Inputs con validación, iconos, password toggle
  BaseSelect,      // Selectores con validación
  BaseTextarea,    // Text areas con validación y contador
  BaseBadge,       // 6 variants (default, primary, success, warning, danger, info)
  BaseLoading,     // 5 variants (spinner, dots, pulse, bars, fullscreen)
  BaseAlert,       // 4 variants (success, danger, warning, info)
  BaseDropdown,    // Menús desplegables
  BaseEmptyState   // Estados vacíos con acción
} from '../common';
```

**⚠️ IMPORTANTE:** NUNCA usar HTML nativo. SIEMPRE usar componentes base.

---

## 🎨 Design Tokens

**Archivo:** `src/config/designTokens.js`

```javascript
import { colors, spacing, tw } from '../config/designTokens';

// Colores
colors.primary[600]
colors.success
colors.error

// Helpers de Tailwind
tw.bg.primary
tw.text.secondary
tw.button.primary
tw.input.base
tw.badge.success
```

---

## 🔧 Herramientas Esenciales

### Logger (NO console.*)

```javascript
import logger from '../../utils/logger';

logger.debug('Debug info', { data });
logger.info('Operation successful');
logger.warn('Warning message');
logger.error('Error occurred', error);
```

### Theme Context (Dark Mode)

```javascript
import { useTheme } from './contexts/ThemeContext';

const { theme, toggleTheme } = useTheme();
// theme: 'light' | 'dark'
```

### Auth Context

```javascript
import { useAuth } from './contexts/AuthContext';

const { currentUser, loading, signIn, signOut } = useAuth();
```

---

## ✅ Checklist Rápido

Antes de escribir código, verifica que cumples:

- [ ] ✅ Leí CODING_STANDARDS.md
- [ ] ✅ Voy a usar 100% Tailwind (sin .css custom)
- [ ] ✅ Voy a usar componentes base
- [ ] ✅ Voy a añadir dark mode
- [ ] ✅ Voy a usar logger en lugar de console.*
- [ ] ✅ Voy a diseñar mobile-first

---

## 🚨 Errores Comunes a Evitar

### ❌ NO HACER:

```javascript
// ❌ CSS custom
<div className="custom-button">Click</div>

// ❌ HTML nativo
<button style={{ color: 'blue' }}>Click</button>

// ❌ Sin dark mode
<div className="bg-white text-black">Content</div>

// ❌ console.*
console.log('Debug');

// ❌ Desktop first
<div className="grid-cols-4 lg:grid-cols-1">
```

### ✅ HACER:

```javascript
// ✅ Componente base
<BaseButton variant="primary">Click</BaseButton>

// ✅ Tailwind con dark mode
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  Content
</div>

// ✅ Logger
import logger from '../../utils/logger';
logger.debug('Debug');

// ✅ Mobile first
<div className="grid-cols-1 lg:grid-cols-4">
```

---

## 📦 Componentes Ya Refactorizados

### ✅ Completamente refactorizados:
- StudentDashboard.jsx
- MyCourses.jsx
- MyAssignments.jsx

### ⚠️ Parcialmente refactorizados:
- TeacherDashboard.jsx
- AdminDashboard.jsx

### ⏭️ Pendientes:
- CourseViewer.jsx
- ContentPlayer.jsx
- StudentClassView.jsx

---

## 🎯 Niveles de Prioridad

### 🔥🔥🔥🔥🔥 CRÍTICO (Usar siempre)
- BaseButton
- BaseInput
- BaseModal
- BaseLoading
- Logger

### 🔥🔥🔥🔥 MUY IMPORTANTE
- BaseCard
- BaseSelect
- BaseTextarea
- Dark mode
- Mobile First

### 🔥🔥🔥 IMPORTANTE
- BaseBadge
- BaseAlert
- BaseDropdown
- BaseEmptyState

---

## 🔗 Navegación entre Documentos

```
GUIDE.md (estás aquí)
    ↓
    ├─→ CODING_STANDARDS.md
    │   └─→ Reglas de código, componentes base, ejemplos
    │
    ├─→ DESIGN_SYSTEM.md
    │   └─→ Colores, responsive, componentes UI
    │
    ├─→ DESIGN_LAB.md
    │   └─→ Sistema de ejercicios ELE
    │
    └─→ CONTENT_SCHEMA.md
        └─→ Arquitectura de contenidos
```

---

## 🎓 Ejemplo Rápido de Componente Correcto

```javascript
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import logger from '../../utils/logger';
import {
  BaseButton,
  BaseCard,
  BaseModal,
  BaseLoading,
  BaseEmptyState,
  BaseBadge
} from '../common';

function MyComponent() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  const handleCreate = async () => {
    try {
      setLoading(true);
      // ... lógica
      logger.info('Item creado exitosamente');
    } catch (err) {
      logger.error('Error creando item:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <BaseLoading variant="fullscreen" text="Cargando..." />;
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-white dark:bg-gray-900">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4 md:mb-6">
        Mi Componente
      </h1>

      {data.length === 0 ? (
        <BaseEmptyState
          icon={Plus}
          title="No hay items"
          description="Crea tu primer item"
          action={
            <BaseButton variant="primary" icon={Plus} onClick={handleCreate}>
              Crear Item
            </BaseButton>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {data.map(item => (
            <BaseCard
              key={item.id}
              title={item.name}
              badges={[<BaseBadge variant="success">Activo</BaseBadge>]}
              hover
            >
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {item.description}
              </p>
              <BaseButton
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={() => handleDelete(item.id)}
              >
                Eliminar
              </BaseButton>
            </BaseCard>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyComponent;
```

---

## 📞 ¿Dudas?

1. **Reglas de código** → `CODING_STANDARDS.md`
2. **Diseño y UI** → `DESIGN_SYSTEM.md`
3. **Ejercicios ELE** → `DESIGN_LAB.md`
4. **Contenidos** → `CONTENT_SCHEMA.md`
5. **Estructura del proyecto** → Este archivo (GUIDE.md)

---

**Mantenido por:** Claude Code
**Última revisión:** 2025-11-11
