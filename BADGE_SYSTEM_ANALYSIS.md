# SISTEMA DE BADGES - XIWEN APP
## Análisis Completo del Nivel de Exploración "Medium"

---

## 1. UBICACIÓN DEL PANEL DE CONFIGURACIÓN

### Panel General de Configuración
**Ruta:** `/home/user/XIWENAPP/src/components/SettingsPanel.jsx`

- **Pestaña de Badges:** `{ id: 'badges', label: 'Badges', icon: Tag }`
- **Acceso:** Settings → Badges (Tab 5 de 8)
- **Componente renderizado:** `BadgeCustomizerTab`

### Modal de Configuración Alternativo
**Ruta:** `/home/user/XIWENAPP/src/components/SettingsModal.jsx`
- También importa y usa `BadgeCustomizerTab`
- Se puede acceder desde diálogos interactivos

---

## 2. ESTRUCTURA ACTUAL DEL SISTEMA DE BADGES

### 2.1 Configuración Central
**Archivo:** `/home/user/XIWENAPP/src/config/badgeSystem.js` (774 líneas)

**Estructura:**
```
DEFAULT_BADGE_CONFIG
├── Cada badge tiene:
│   ├── variant: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'
│   ├── color: hex color (#3b82f6)
│   ├── label: string
│   ├── icon: emoji monocromático
│   ├── description: string
│   └── category: string (categoría a la que pertenece)
└── Total: 57 badges predefinidos (sistema)
```

### 2.2 Categorías de Badges
**Definidas en:** `BADGE_CATEGORIES` en `badgeSystem.js`

```javascript
{
  contentType: {label: 'Tipos de Contenido', allowCustom: false},  // Fijos
  exerciseType: {label: 'Tipos de Ejercicio', allowCustom: false}, // Fijos
  difficulty: {label: 'Niveles de Dificultad', allowCustom: true},  // Personalizables
  cefr: {label: 'Niveles CEFR', allowCustom: false},                // Fijos
  status: {label: 'Estados de Contenido', allowCustom: false},      // Fijos
  theme: {label: 'Categorías Temáticas', allowCustom: true},        // Personalizables
  feature: {label: 'Características', allowCustom: true},           // Personalizables
  role: {label: 'Roles de Usuario', allowCustom: false}             // Fijos
}
```

---

## 3. TIPOS DE BADGES EXISTENTES

### 3.1 TIPOS DE CONTENIDO (7 badges)
```
CONTENT_COURSE      → 📚 Azul (#3b82f6)
CONTENT_LESSON      → 📝 Verde (#10b981)
CONTENT_READING     → 📖 Púrpura (#8b5cf6)
CONTENT_VIDEO       → 🎥 Rojo (#ef4444)
CONTENT_LINK        → 🔗 Gris (#71717a)
CONTENT_EXERCISE    → ✏️ Ámbar (#f59e0b)
CONTENT_LIVEGAME    → 🎮 Cyan (#06b6d4)
```

### 3.2 TIPOS DE EJERCICIO (8 badges)
```
EXERCISE_MULTIPLE_CHOICE     → ☑️ Azul
EXERCISE_FILL_BLANK          → 📝 Verde
EXERCISE_MATCHING            → 🔗 Ámbar
EXERCISE_ORDERING            → 🔢 Púrpura
EXERCISE_TRUE_FALSE          → ✓✗ Rojo
EXERCISE_SHORT_ANSWER        → ✍️ Azul
EXERCISE_ESSAY               → 📄 Cyan
EXERCISE_LISTENING           → 🎧 Ámbar
```

### 3.3 NIVELES DE DIFICULTAD (3 badges + Personalizables)
```
DIFFICULTY_BEGINNER          → 🟢 Verde (#10b981)
DIFFICULTY_INTERMEDIATE      → 🟡 Ámbar (#f59e0b)
DIFFICULTY_ADVANCED          → 🔴 Rojo (#ef4444)
```

### 3.4 NIVELES CEFR (6 badges - Estándares Europeos)
```
CEFR_A1 → 🌱 Verde (#10b981)
CEFR_A2 → 🌿 Verde (#16a34a)
CEFR_B1 → 🌾 Ámbar (#f59e0b)
CEFR_B2 → 🌻 Ámbar (#d97706)
CEFR_C1 → 🌳 Rojo (#ef4444)
CEFR_C2 → 🏆 Rojo (#dc2626)
```

### 3.5 ESTADOS DE CONTENIDO (4 badges)
```
STATUS_DRAFT        → 📝 Gris (#71717a)
STATUS_REVIEW       → 👀 Ámbar (#f59e0b)
STATUS_PUBLISHED    → ✅ Verde (#10b981)
STATUS_ARCHIVED     → 📦 Gris (#a1a1aa)
```

### 3.6 CATEGORÍAS TEMÁTICAS (8 badges + Personalizables)
```
THEME_VOCABULARY            → 📚 Azul
THEME_GRAMMAR               → 📖 Púrpura
THEME_CONVERSATION          → 💬 Verde
THEME_PRONUNCIATION         → 🗣️ Ámbar
THEME_READING               → 📖 Cyan
THEME_LISTENING             → 🎧 Ámbar
THEME_WRITING               → ✍️ Azul
THEME_CULTURE               → 🌍 Rojo
```

### 3.7 CARACTERÍSTICAS (4 badges + Personalizables)
```
FEATURE_AUDIO               → 🔊 Ámbar (#f59e0b)
FEATURE_VIDEO               → 🎥 Rojo (#ef4444)
FEATURE_INTERACTIVE         → 🎮 Cyan (#06b6d4)
FEATURE_AI_GENERATED        → 🤖 Púrpura (#8b5cf6)
```

### 3.8 ROLES DE USUARIO (6 badges)
```
ROLE_ADMIN          → 👑 Ámbar (#f59e0b)
ROLE_TEACHER        → 👨‍🏫 Púrpura (#8b5cf6)
ROLE_TRIAL_TEACHER  → 👨‍🏫 Púrpura claro (#a78bfa)
ROLE_STUDENT        → 🎓 Azul (#3b82f6)
ROLE_LISTENER       → 👂 Verde (#10b981)
ROLE_TRIAL          → 🔬 Gris (#71717a)
```

---

## 4. CUÁLES BADGES PERMITEN AGREGAR MÁS Y CUÁLES NO

### ❌ NO PERMITEN AGREGAR CUSTOM (allowCustom: false)
```
1. contentType      - Fijo del sistema (tipos de contenido)
2. exerciseType     - Fijo del sistema (tipos de ejercicio)
3. cefr             - Fijo del sistema (estándares CEFR)
4. status           - Fijo del sistema (estados de contenido)
5. role             - Fijo del sistema (roles de usuario)
```

### ✅ PERMITEN AGREGAR CUSTOM (allowCustom: true)
```
1. difficulty       - Puede agregar niveles personalizados
2. theme            - Puede agregar temas de contenido
3. feature          - Puede agregar características especiales
```

**Cómo se agregan:**
- Panel: Settings → Badges → (Sección personalizable) → "Agregar" botón
- Hook: `useBadgeConfig().addBadge(category, key, badgeData)`
- Función: `addCustomBadge(category, key, config)` en `badgeSystem.js`

---

## 5. DEFINICIÓN Y USO DE ICONOS

### 5.1 Sistema de Iconos
- **Tipo:** Emojis Unicode monocromáticos (NO iconos SVG)
- **Almacenamiento:** Propiedad `icon` en cada badge config
- **Propósito:** Identificación rápida visual

### 5.2 Iconos Predefinidos por Categoría
```javascript
ICON MAPPING por categoría:
contentType:    📚, 📝, 📖, 🎥, 🔗, ✏️, 🎮
exerciseType:   ☑️, 📝, 🔗, 🔢, ✓✗, ✍️, 📄, 🎧
difficulty:     🟢, 🟡, 🔴
cefr:           🌱, 🌿, 🌾, 🌻, 🌳, 🏆
status:         📝, 👀, ✅, 📦
theme:          📚, 📖, 💬, 🗣️, 📖, 🎧, ✍️, 🌍
feature:        🔊, 🎥, 🎮, 🤖
role:           👑, 👨‍🏫, 👨‍🏫, 🎓, 👂, 🔬
```

### 5.3 Cómo se Usan en Componentes
**CategoryBadge.jsx:**
```jsx
<CategoryBadge 
  type="content" 
  value="course"
  showIcon={true}   // Controla si se muestra el icono
/>
```

---

## 6. COMPONENTES PRINCIPALES DEL SISTEMA

### 6.1 Panel de Customización
**Archivo:** `/home/user/XIWENAPP/src/components/settings/BadgeCustomizerTab.jsx` (630 líneas)

**Componentes internos:**
1. **BadgeCustomizerTab** - Componente principal
   - Solo Admin (`user?.role === 'admin'`)
   - Gestiona secciones expandibles
   - Permite guardar/descartar cambios

2. **CategorySection** - Sección por categoría
   - Encabezado con nombre y descripción
   - Botón "Agregar" si allowCustom=true
   - Lista de badges expandible

3. **BadgeRow** - Fila individual de badge
   - Vista previa del color
   - Color picker
   - Opciones avanzadas (label, icono, descripción)
   - Botón eliminar (solo custom badges)

4. **PreviewSection** - Vista previa general
   - Muestra primeros 12 badges
   - Actualiza en tiempo real

5. **AddBadgeModal** - Modal para agregar badge
   - Input para label (obligatorio)
   - Color picker
   - Vista previa

### 6.2 Hook de Gestión
**Archivo:** `/home/user/XIWENAPP/src/hooks/useBadgeConfig.js` (249 líneas)

**Funciones principales:**
```javascript
useBadgeConfig() → {
  // Estado
  config,           // Configuración actual
  hasChanges,       // Hay cambios sin guardar
  categories,       // Categorías disponibles
  defaults,         // Config por defecto

  // Lectura
  getBadge(),
  getBadgesByCategory(),

  // Escritura
  save(),
  reset(),
  discard(),
  updateColor(),
  updateProperty(),
  addBadge(),
  removeBadge(),
}
```

### 6.3 Componentes de Visualización
**BaseBadge.jsx** (127 líneas)
```jsx
<BaseBadge 
  variant="primary"  // default, primary, success, warning, danger, info
  size="md"         // sm, md, lg
  icon={Icon}       // Componente Lucide
  onRemove={() => {}}
/>
```

**CategoryBadge.jsx** (153 líneas)
```jsx
// Uso automático con mapeo
<CategoryBadge type="content" value="course" />

// Uso directo por key
<CategoryBadge badgeKey="CONTENT_COURSE" />

// Con opciones
<CategoryBadge 
  type="difficulty" 
  value="intermediate"
  size="sm"
  showIcon={true}
  showLabel={true}
/>
```

**CreditBadge.jsx** (56 líneas)
- Badge especial para mostrar créditos del usuario
- Muestra número o ∞ (ilimitado)
- Integrado en TopBar

---

## 7. FLUJO DE DATOS

### 7.1 Almacenamiento
```
Configuración → localStorage
Key: 'xiwen_badge_config'
Formato: JSON
Fallback: DEFAULT_BADGE_CONFIG
```

### 7.2 Inicialización
```javascript
1. App carga → initBadgeSystem()
2. applyBadgeColors() → Establece CSS variables
3. Color variables → --badge-{KEY}-bg, --badge-{KEY}-text
4. WCAG Formula → Calcula color de texto automático
```

### 7.3 Mapeo Automático
```javascript
BADGE_MAPPINGS = {
  contentType: { 'course' → 'CONTENT_COURSE', ... },
  exerciseType: { 'multiple-choice' → 'EXERCISE_MULTIPLE_CHOICE', ... },
  difficulty: { 'beginner' → 'DIFFICULTY_BEGINNER', ... },
  cefr: { 'A1' → 'CEFR_A1', ... },
  status: { 'published' → 'STATUS_PUBLISHED', ... },
  role: { 'admin' → 'ROLE_ADMIN', ... },
}
```

---

## 8. SISTEMA DE TEMAS Y APARIENCIA

### 8.1 Tema General de la App
**Archivo:** `/home/user/XIWENAPP/src/contexts/ThemeContext.jsx`

**Temas disponibles:**
```javascript
THEMES = {
  LIGHT: 'light',
  DARK: 'dark',        // Predeterminado
  OCEAN: 'ocean',
  FOREST: 'forest',
  SUNSET: 'sunset',
  MIDNIGHT: 'midnight'
}
```

### 8.2 Relación entre Temas y Badges
- **Badges:** Usan colores independientes (definidos en badgeSystem.js)
- **CSS Variables:** `--badge-{KEY}-bg` y `--badge-{KEY}-text`
- **Contrast Text:** WCAG formula automática para legibilidad

### 8.3 Sistema de Diseño Centralizado
**Archivo:** `/home/user/XIWENAPP/src/theme.js`

Colores base del sistema:
```javascript
theme.colors = {
  gray: { 50-950 },
  primary: { 50-900 },
  success: { light, DEFAULT, dark },
  warning: { light, DEFAULT, dark },
  error: { light, DEFAULT, dark },
  info: { light, DEFAULT, dark }
}
```

---

## 9. RESTRICCIONES Y LIMITACIONES

### 9.1 Restricción de Permisos
```javascript
// Solo Admin puede acceder
if (user?.role !== 'admin') {
  → Mostrar alerta "Acceso Restringido"
}
```

### 9.2 Protecciones del Sistema
```
1. No se pueden eliminar badges del sistema (custom: false)
2. Solo se pueden agregar en categorías permitidas (allowCustom: true)
3. Label es obligatorio para nuevos badges
4. Cambios se guardan en localStorage
5. Hay opción "Discard" para cancelar cambios no guardados
6. Hay opción "Reset" para restaurar defaults
```

### 9.3 Limitaciones Técnicas
```
- Emojis monocromáticos solamente para iconos
- Colors en formato hex (#RRGGBB)
- Máximo 12 badges en preview section
- Key de custom badge: CUSTOM_{CATEGORY}_{TIMESTAMP}
```

---

## 10. RUTAS DE ARCHIVOS RELEVANTES

```
/home/user/XIWENAPP/
├── src/
│   ├── config/
│   │   └── badgeSystem.js ..................... Configuración centralizada
│   ├── hooks/
│   │   ├── useBadgeConfig.js .................. Hook de gestión
│   │   └── index.js
│   ├── components/
│   │   ├── settings/
│   │   │   └── BadgeCustomizerTab.jsx ........ Panel de customización
│   │   ├── common/
│   │   │   ├── BaseBadge.jsx ................. Componente base
│   │   │   ├── CategoryBadge.jsx ............. Componente inteligente
│   │   │   ├── CreditBadge.jsx ............... Badge de créditos
│   │   │   └── index.js ...................... Exportaciones
│   │   ├── SettingsPanel.jsx ................. Panel con tabs (incl. Badges)
│   │   ├── SettingsModal.jsx ................. Modal alt (incl. Badges)
│   │   ├── ThemeCustomizer.jsx ............... Sistema de temas
│   │   ├── ThemeSwitcher.jsx
│   │   ├── ThemeBuilder.jsx
│   │   └── ...
│   ├── contexts/
│   │   └── ThemeContext.jsx .................. Contexto de temas
│   ├── theme.js .............................. Design tokens
│   ├── globals.css ........................... Estilos globales (.badge*)
│   ├── App.css ............................... Estilos adicionales
│   └── ...
```

---

## 11. MAPEO DE FUNCIONES HELPER

### En badgeSystem.js:
```javascript
getBadgeConfig()              // Obtiene config actual
saveBadgeConfig(config)       // Guarda config
resetBadgeConfig()            // Restaura defaults
getBadgeByKey(key)            // Obtiene un badge por key
getBadgeForContentType(type)  // Helper para tipos de contenido
getBadgeForExerciseType(type) // Helper para tipos de ejercicio
getBadgeForDifficulty(diff)   // Helper para dificultad
getBadgeForCEFR(level)        // Helper para CEFR
getBadgeForStatus(status)     // Helper para status
getBadgeForRole(role)         // Helper para roles
getBadgesByCategory(cat)      // Obtiene todos de una categoría
applyBadgeColors(config)      // Aplica colores como CSS vars
addCustomBadge(cat, key, cfg) // Agrega custom badge
removeCustomBadge(key)        // Elimina custom badge
updateBadge(key, updates)     // Actualiza badge
initBadgeSystem()             // Inicialización al cargar
```

### En useBadgeConfig.js:
```javascript
useEffect(() => {})           // Cargar configuración al montar
save()                        // Guardar cambios
reset()                       // Restaurar defaults
discard()                     // Descartar cambios
updateColor(key, color)       // Actualizar color específico
updateProperty(key, prop, val)// Actualizar cualquier propiedad
addBadge(cat, key, data)      // Agregar custom badge
removeBadge(key)              // Eliminar custom badge
getBadge(key)                 // Obtener un badge
getBadgesByCategory(cat)      // Obtener de una categoría
```

---

## 12. EVENTOS Y SINCRONIZACIÓN

```javascript
// Event listener para cambios
window.addEventListener('storage', handleStorageChange)
window.addEventListener('xiwen_badge_config_changed', handleStorageChange)

// Event dispatch después de guardar
window.dispatchEvent(new Event('xiwen_badge_config_changed'))

// Sincroniza entre pestañas/ventanas
// Aplica colores automáticamente
applyBadgeColors(config)
```

---

## RESUMEN EJECUTIVO

El **Sistema de Badges de XIWEN** es un sistema centralizado, flexible y bien estructurado que permite:

1. ✅ **57 badges predefinidos** organizados en 8 categorías
2. ✅ **3 categorías personalizables** (difficulty, theme, feature)
3. ✅ **5 categorías fijas del sistema** (contentType, exerciseType, cefr, status, role)
4. ✅ **Gestión centralizada** en `/config/badgeSystem.js`
5. ✅ **Panel admin** en Settings → Badges (solo admin)
6. ✅ **Iconos emojis** monocromáticos para identificación rápida
7. ✅ **Colores automáticos** con CSS variables y contrast text WCAG
8. ✅ **Almacenamiento local** en localStorage con fallback a defaults
9. ✅ **Componentes reutilizables** BaseBadge y CategoryBadge
10. ✅ **Hook personalizado** useBadgeConfig para gestión

**Acceso:** Settings Panel → Pestaña "Badges" (solo para administradores)
