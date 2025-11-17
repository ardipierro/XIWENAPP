# SISTEMA DE BADGES - GUÍA RÁPIDA DE REFERENCIA

---

## MAPA DE ARCHIVOS CRÍTICOS

```
Configuración
└── src/config/badgeSystem.js (774 líneas)
    ├── DEFAULT_BADGE_CONFIG (57 badges)
    ├── BADGE_CATEGORIES (8 categorías)
    ├── BADGE_MAPPINGS (mapeo automático)
    └── Helper functions (15 funciones)

Gestión (Hook)
└── src/hooks/useBadgeConfig.js (249 líneas)
    ├── Estado: config, hasChanges, categories
    └── Funciones: save, reset, update*, add*, remove*

Panel Admin
└── src/components/settings/BadgeCustomizerTab.jsx (630 líneas)
    ├── BadgeCustomizerTab (componente principal)
    ├── CategorySection (secciones expandibles)
    ├── BadgeRow (filas individuales)
    ├── PreviewSection (vista previa)
    └── AddBadgeModal (agregar custom)

Componentes de Visualización
├── src/components/common/BaseBadge.jsx (127 líneas)
├── src/components/common/CategoryBadge.jsx (153 líneas)
└── src/components/common/CreditBadge.jsx (56 líneas)

Integración
├── src/components/SettingsPanel.jsx
│   └── Tab: { id: 'badges', label: 'Badges', icon: Tag }
└── src/components/SettingsModal.jsx
    └── También importa BadgeCustomizerTab

Sistema de Temas
├── src/contexts/ThemeContext.jsx (6 temas)
├── src/theme.js (design tokens)
└── src/globals.css (CSS de badges legados)
```

---

## TABLA COMPARATIVA DE CATEGORÍAS

```
┌─────────────┬───────────────────────┬────────────┬─────────────────┐
│ Categoría   │ Descripción           │ Count      │ Personalizable  │
├─────────────┼───────────────────────┼────────────┼─────────────────┤
│ contentType │ Tipos de contenido    │ 7 badges   │ ❌ NO (fijo)    │
│ exerciseType│ Tipos de ejercicio    │ 8 badges   │ ❌ NO (fijo)    │
│ difficulty  │ Niveles dificultad    │ 3 badges   │ ✅ SÍ (custom)  │
│ cefr        │ Niveles CEFR          │ 6 badges   │ ❌ NO (fijo)    │
│ status      │ Estados de contenido  │ 4 badges   │ ❌ NO (fijo)    │
│ theme       │ Temas de contenido    │ 8 badges   │ ✅ SÍ (custom)  │
│ feature     │ Características       │ 4 badges   │ ✅ SÍ (custom)  │
│ role        │ Roles de usuario      │ 6 badges   │ ❌ NO (fijo)    │
│─────────────┼───────────────────────┼────────────┼─────────────────│
│ TOTAL       │                       │ 57 badges  │ 3 + N custom    │
└─────────────┴───────────────────────┴────────────┴─────────────────┘
```

---

## ESTRUCTURA DE UN BADGE

```javascript
{
  CONTENT_COURSE: {
    variant: 'primary',              // Variant CSS
    color: '#3b82f6',                // Hex color
    label: 'Curso',                  // Texto mostrado
    icon: '📚',                      // Emoji Unicode
    description: 'Contenedor...',    // Descripción
    category: 'contentType',         // Categoría
    custom: false                    // ¿Es personalizado?
  }
}
```

---

## FLUJO DE ACCESO AL PANEL

```
Usuario Admin
    │
    └─→ Abre Settings Panel
        └─→ Busca pestaña "Badges"
            └─→ BadgeCustomizerTab renderizado
                ├─→ Valida rol admin
                ├─→ Carga categorías expandibles
                ├─→ Muestra 8 secciones
                ├─→ Permite editar colores
                ├─→ Permite agregar custom (3 categorías)
                ├─→ Permite eliminar custom
                ├─→ Botones: Guardar/Descartar/Restaurar
                └─→ Guarda en localStorage
```

---

## FLUJO DE GUARDADO

```
Cambio de color/propiedad
    │
    └─→ updateColor() o updateProperty()
        │
        └─→ setConfig() (actualiza estado)
            │
            └─→ setHasChanges(true)
                │
                ├─→ [Usuario presiona "Guardar"]
                │
                └─→ save()
                    │
                    ├─→ saveBadgeConfig(config) en localStorage
                    ├─→ applyBadgeColors(config) → CSS variables
                    ├─→ Dispara evento 'xiwen_badge_config_changed'
                    └─→ Muestra mensaje: "✅ Configuración guardada"
```

---

## MAPEO DE VALORES A BADGES

### Content Type
```
'course' → CONTENT_COURSE (📚 Azul)
'lesson' → CONTENT_LESSON (📝 Verde)
'reading' → CONTENT_READING (📖 Púrpura)
'video' → CONTENT_VIDEO (🎥 Rojo)
'link' → CONTENT_LINK (🔗 Gris)
'exercise' → CONTENT_EXERCISE (✏️ Ámbar)
'live-game' → CONTENT_LIVEGAME (🎮 Cyan)
```

### Exercise Type
```
'multiple-choice' → EXERCISE_MULTIPLE_CHOICE (☑️)
'fill-blank' → EXERCISE_FILL_BLANK (📝)
'matching' → EXERCISE_MATCHING (🔗)
'ordering' → EXERCISE_ORDERING (🔢)
'true-false' → EXERCISE_TRUE_FALSE (✓✗)
'short-answer' → EXERCISE_SHORT_ANSWER (✍️)
'essay' → EXERCISE_ESSAY (📄)
'listening' → EXERCISE_LISTENING (🎧)
```

### Difficulty
```
'beginner' → DIFFICULTY_BEGINNER (🟢 Verde)
'intermediate' → DIFFICULTY_INTERMEDIATE (🟡 Ámbar)
'advanced' → DIFFICULTY_ADVANCED (🔴 Rojo)
```

### CEFR
```
'A1' → CEFR_A1 (🌱)
'A2' → CEFR_A2 (🌿)
'B1' → CEFR_B1 (🌾)
'B2' → CEFR_B2 (🌻)
'C1' → CEFR_C1 (🌳)
'C2' → CEFR_C2 (🏆)
```

### Status
```
'draft' → STATUS_DRAFT (📝 Gris)
'review' → STATUS_REVIEW (👀 Ámbar)
'published' → STATUS_PUBLISHED (✅ Verde)
'archived' → STATUS_ARCHIVED (📦 Gris)
```

### Role
```
'admin' → ROLE_ADMIN (👑 Ámbar)
'teacher' → ROLE_TEACHER (👨‍🏫 Púrpura)
'trial_teacher' → ROLE_TRIAL_TEACHER (👨‍🏫 Púrpura claro)
'student' → ROLE_STUDENT (🎓 Azul)
'listener' → ROLE_LISTENER (👂 Verde)
'trial' → ROLE_TRIAL (🔬 Gris)
```

---

## USO DE COMPONENTES

### BaseBadge - Badge Base
```jsx
import { BaseBadge } from './common';

// Variants: default, primary, success, warning, danger, info
// Sizes: sm, md, lg

<BaseBadge variant="primary" size="md">
  Contenido
</BaseBadge>

<BaseBadge 
  variant="success" 
  size="sm"
  onRemove={() => handleRemove()}
>
  Con botón X
</BaseBadge>
```

### CategoryBadge - Badge Inteligente (CON MAPEO)
```jsx
import { CategoryBadge } from './common';

// Uso con mapeo automático
<CategoryBadge 
  type="content" 
  value="course"        // Busca CONTENT_COURSE automáticamente
  size="md"
  showIcon={true}
  showLabel={true}
/>

// Uso con key directo
<CategoryBadge badgeKey="CONTENT_COURSE" />

// Con callback
<CategoryBadge 
  type="difficulty" 
  value="intermediate"
  onRemove={() => removeDifficulty()}
/>
```

### CreditBadge - Badge Especial
```jsx
import { CreditBadge } from './common';

// Muestra créditos o ∞ (ilimitado)
<CreditBadge 
  onClick={() => openCreditsModal()}
  showLabel={true}
/>
```

---

## FUNCIONES PRINCIPALES DEL HOOK

```javascript
import useBadgeConfig from '../../hooks/useBadgeConfig';

function MyComponent() {
  const {
    config,              // Configuración actual (obj)
    hasChanges,          // ¿Hay cambios no guardados? (bool)
    categories,          // Categorías disponibles (obj)
    defaults,            // Config por defecto (obj)
    
    // Lectura
    getBadge,            // (key) → badge config
    getBadgesByCategory, // (categoryName) → {key: config}
    
    // Escritura
    save,                // () → boolean
    reset,               // () → void
    discard,             // () → void
    updateColor,         // (badgeKey, newColor) → void
    updateProperty,      // (badgeKey, property, value) → void
    addBadge,            // (category, key, badgeData) → void
    removeBadge,         // (badgeKey) → void
  } = useBadgeConfig();

  // Uso
  const currentBadge = getBadge('CONTENT_COURSE');
  updateColor('CONTENT_COURSE', '#ff0000');
  save();
}
```

---

## FUNCIONES HELPER EN badgeSystem.js

```javascript
import {
  // Config
  DEFAULT_BADGE_CONFIG,
  BADGE_CATEGORIES,
  BADGE_MAPPINGS,
  BADGE_CONFIG_STORAGE_KEY,

  // Get/Set
  getBadgeConfig(),           // actual config
  saveBadgeConfig(config),    // save to storage
  resetBadgeConfig(),         // reset to defaults
  
  // By Key
  getBadgeByKey(key),         // get one badge

  // By Type + Value
  getBadgeForContentType(type),
  getBadgeForExerciseType(type),
  getBadgeForDifficulty(diff),
  getBadgeForCEFR(level),
  getBadgeForStatus(status),
  getBadgeForRole(role),

  // By Category
  getBadgesByCategory(categoryName),

  // Styling
  applyBadgeColors(config),   // apply CSS vars

  // Custom Badges
  addCustomBadge(category, key, config),
  removeCustomBadge(key),
  updateBadge(key, updates),

  // Init
  initBadgeSystem(),
} from '../../config/badgeSystem';
```

---

## VARIABLES CSS GENERADAS

Cuando se aplican colores, se generan automáticamente:

```css
--badge-content_course-bg: #3b82f6
--badge-content_course-text: #ffffff

--badge-content_lesson-bg: #10b981
--badge-content_lesson-text: #ffffff

--badge-difficulty_intermediate-bg: #f59e0b
--badge-difficulty_intermediate-text: #000000

... (uno por cada badge)

/* Plus: CSS variables de tema global */
--color-text-primary
--color-text-secondary
--color-bg-primary
--color-bg-secondary
--color-bg-tertiary
--color-border
```

---

## ACCESO RESTRINGIDO - SOLO ADMIN

```javascript
// En BadgeCustomizerTab.jsx
const isAdmin = user?.role === 'admin';

if (!isAdmin) {
  return (
    <BaseAlert variant="warning" title="Acceso Restringido">
      Solo los administradores pueden acceder a esta configuración.
    </BaseAlert>
  );
}
```

---

## LIMITACIONES Y RESTRICCIONES

```
✅ PERMITIDO:
  • Cambiar colores de cualquier badge
  • Editar label, icono, descripción de custom badges
  • Agregar badges en: difficulty, theme, feature
  • Eliminar badges custom (solo custom)
  • Descartar cambios sin guardar
  • Restaurar a configuración por defecto

❌ NO PERMITIDO:
  • Cambiar valores de badges del sistema
  • Eliminar badges del sistema (custom: false)
  • Agregar badges en: contentType, exerciseType, cefr, status, role
  • Acceder al panel sin ser admin
  • Cambiar categoría de un badge existing

⚠️ RESTRICCIONES TÉCNICAS:
  • Icons solo: emojis monocromáticos
  • Colors solo: formato hex (#RRGGBB)
  • Labels: requerido (no vacío)
  • localStorage: 5-10MB límite típico
```

---

## EVENTOS Y SINCRONIZACIÓN

```javascript
// Event listeners que escucha useBadgeConfig
window.addEventListener('storage', handleStorageChange);
window.addEventListener('xiwen_badge_config_changed', handleStorageChange);

// Event que se dispara después de guardar
window.dispatchEvent(new Event('xiwen_badge_config_changed'));

// Permite sincronización entre:
  • Diferentes pestañas del navegador
  • Diferentes ventanas
  • Mismo origen (CORS)
```

---

## INTEGRACIÓN CON OTRAS PARTES

```
BadgeSystem
├── SettingsPanel.jsx
│   └── Tab "Badges" → BadgeCustomizerTab
│
├── SettingsModal.jsx
│   └── También integra BadgeCustomizerTab
│
├── UnifiedContentManager.jsx
│   └── Usa CategoryBadge para tipos de contenido
│
├── FlashCardManager.jsx
│   └── Usa CategoryBadge para categorización
│
├── ClassDailyLog.jsx
│   └── Muestra CategoryBadge de status
│
├── AdminPaymentsPanel.jsx
│   └── Usa CategoryBadge para roles
│
└── Cualquier componente puede usar:
    • CategoryBadge (mapeo automático)
    • BaseBadge (genérico)
    • getBadgeForX() (helpers)
```

---

## COLORES PREDEFINIDOS

```
Variantes Tailwind:
  primary:  #3b82f6 (azul)
  success:  #10b981 (verde)
  warning:  #f59e0b (ámbar)
  danger:   #ef4444 (rojo)
  info:     #8b5cf6 (púrpura)
  default:  #71717a (gris)

Colores específicos:
  CEFR levels: 6 tonos (verde → rojo)
  Content types: 7 colores variados
  Exercise types: 8 colores variados
```

---

## ALMACENAMIENTO

```javascript
// LocalStorage
localStorage.getItem('xiwen_badge_config')
// → JSON string de configuración personalizada

// Si no existe, usa DEFAULT_BADGE_CONFIG

// Al guardar
localStorage.setItem('xiwen_badge_config', JSON.stringify(config));

// Al restaurar
localStorage.removeItem('xiwen_badge_config');
// → Vuelve a usar defaults
```

---

## CHECKLIST RÁPIDO

- [ ] ¿Necesito mostrar un badge? → Usa `CategoryBadge`
- [ ] ¿Necesito customizar colores? → Usa `useBadgeConfig()`
- [ ] ¿Necesito agregar badge custom? → Solo en: difficulty, theme, feature
- [ ] ¿Necesito acceder al panel? → Solo admin puede
- [ ] ¿Necesito mapear valor a badge? → Consulta BADGE_MAPPINGS
- [ ] ¿Necesito agregar nueva categoría? → NO recomendado (es fijo del sistema)
- [ ] ¿Necesito el color de un badge? → Usa `getBadgeByKey()` o `getBadgeForX()`

