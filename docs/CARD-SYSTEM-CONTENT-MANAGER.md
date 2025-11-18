# 🎴 Sistema de Tarjetas Universal en Gestión de Contenidos

## ✅ Sistema Ya Implementado

El panel de **Gestión de Contenidos** (UnifiedContentManager) **YA USA** el sistema de tarjetas universal (UniversalCard) y **YA ESTÁ CONECTADO** con el panel de personalización Card System.

---

## 🎯 Cómo Funciona

### 1. Arquitectura Actual

```
UnifiedContentManager
  └─ Usa UniversalCard
      └─ Lee configuración de CardConfigContext
          └─ Carga config de localStorage
              └─ Editado desde CardSystemTab
```

### 2. Variantes Usadas

El panel de contenidos usa **2 variantes** dependiendo del tipo de contenido:

#### **Variante `content`** (con imagen)
- **Cuándo:** Cuando el contenido tiene imagen (cursos, videos)
- **Archivo:** `UnifiedContentManager.jsx` línea 868
- **Configuración:** `cardConfig.js` líneas 153-193

```jsx
const gridVariant = hasImage ? 'content' : 'default';
```

**Características:**
- Header con imagen (h-48 = 192px)
- Hover con zoom de imagen (scale 1.05)
- Shadow más prominente
- Ideal para contenido visual

#### **Variante `default`** (sin imagen)
- **Cuándo:** Cuando el contenido NO tiene imagen (lecciones, ejercicios)
- **Archivo:** `UnifiedContentManager.jsx` línea 868
- **Configuración:** `cardConfig.js` líneas 20-53

**Características:**
- Header con gradiente
- Ícono grande (48px)
- Footer sticky
- Hover con lift effect

---

## 🎨 Cómo Personalizar las Tarjetas

### Paso 1: Ir a Configuración

1. Menú lateral → **"Configuración"**
2. Pestaña → **"Diseño y Apariencia"**
3. Sub-pestaña → **"Card System"**

### Paso 2: Seleccionar Variante

En la primera columna, verás las variantes disponibles:
- ✅ **default** - Para contenidos sin imagen
- ✅ **content** - Para contenidos con imagen
- user
- class
- stats
- compact

### Paso 3: Editar Propiedades

En la segunda columna (Editor), podrás modificar:

#### Para variante `content`:
- **headerHeight:** Altura del header con imagen (ej: '192px', '240px')
- **hoverTransform:** Cuánto se levanta al hover (ej: '-4px', '-8px')
- **hoverShadow:** Sombra al hover
- **imageScale:** Zoom de imagen al hover (ej: '1.05', '1.1')
- **contentPadding:** Padding interno (ej: '20px', '24px')
- **footerSticky:** Footer pegado al fondo (true/false)

#### Para variante `default`:
- **headerHeight:** Altura del header (ej: '128px', '160px')
- **iconSize:** Tamaño del ícono (ej: 48, 64)
- **hoverTransform:** Cuánto se levanta al hover
- **hoverShadow:** Sombra al hover
- **contentPadding:** Padding interno
- **footerSticky:** Footer pegado al fondo

### Paso 4: Ver Preview

El preview se actualiza en tiempo real mostrando cómo se verá la card.

### Paso 5: Guardar Cambios

1. Clic en botón **"Guardar Cambios"**
2. Confirmación: "✅ Configuración guardada exitosamente"
3. Los cambios se aplican **inmediatamente** en todo el panel de contenidos

### Paso 6: Verificar

1. Ir a **"Gestión de Contenidos"**
2. Ver que las tarjetas usan la nueva configuración

---

## 🔍 Dónde se Usan las Variantes

### Variante `content` - 4 usos documentados:

| Archivo | Componente | Contexto |
|---------|-----------|----------|
| UnifiedContentManager.jsx | ContentCard | Galería de contenidos/cursos |
| student/MyCourses.jsx | CourseCard | Mis cursos del estudiante |
| (scanner reporta 4 usos totales) | | |

### Variante `default` - 3 usos documentados:

| Archivo | Componente | Contexto |
|---------|-----------|----------|
| UniversalDashboard.jsx | QuickAccessCard | Quick access en dashboard |
| UnifiedContentManager.jsx | ContentCard | Contenidos sin imagen |
| CardSystemTab.jsx | Preview | Preview de ejemplo |

---

## 📊 Análisis de Impacto

Cuando cambias una propiedad, el sistema muestra:

- **Componentes afectados:** Cuántos componentes usarán el cambio
- **Archivos impactados:** Qué archivos se verán afectados
- **Tipo de cambio:** Visual, Layout, o Comportamiento

Ejemplo:
```
✅ Análisis de Impacto:
   Componentes afectados: 2 (ContentCard, CourseCard)
   Archivos impactados: 2
   Tipo de cambio: Visual (headerHeight)
```

---

## 🔧 Propiedades Disponibles

### Header
- `headerHeight` - Altura del header (string con unidad, ej: '192px')
- `headerBg` - Tipo de fondo ('gradient' | 'solid' | 'image' | 'transparent')
- `headerGradient` - Gradiente CSS (solo si headerBg='gradient')
- `headerImageFit` - Ajuste de imagen ('cover' | 'contain')

### Content
- `contentPadding` - Padding interno (string con unidad)

### Hover Effects
- `hoverEnabled` - Activar/desactivar hover (boolean)
- `hoverTransform` - Desplazamiento en Y (string, ej: '-4px')
- `hoverShadow` - Sombra al hover (CSS shadow)
- `hoverBorderColor` - Color de borde al hover (CSS color)
- `imageScaleOnHover` - Zoom de imagen al hover (boolean)
- `imageScale` - Factor de escala (string, ej: '1.05')

### Normal State
- `normalShadow` - Sombra normal (CSS shadow)
- `normalBorderColor` - Color de borde normal (CSS color)

### Transitions
- `transitionDuration` - Duración de transición (string, ej: '300ms')
- `transitionTiming` - Timing function (CSS timing)

### Extras (variante default)
- `showIcon` - Mostrar ícono (boolean)
- `iconSize` - Tamaño del ícono (number)
- `showBadges` - Mostrar badges (boolean)
- `showStats` - Mostrar stats (boolean)

### Extras (variante content)
- `showThumbnail` - Mostrar thumbnail (boolean)

### Footer
- `footerSticky` - Footer pegado al fondo (boolean)
- `footerSpacing` - Espacio entre elementos (Tailwind class, ej: 'gap-3')
- `footerAlignment` - Alineación ('start' | 'center' | 'end')

---

## 💾 Persistencia

La configuración se guarda en:
- **localStorage:** `xiwen_card_config`
- **Formato:** JSON con todas las variantes
- **Sincronización:** Automática entre pestañas del navegador

```json
{
  "content": {
    "headerHeight": "240px",
    "hoverTransform": "-6px",
    "imageScale": "1.1",
    ...
  },
  "default": {
    "headerHeight": "160px",
    "iconSize": 64,
    ...
  }
}
```

---

## 🔄 Reset a Defaults

Para volver a la configuración original:

1. En CardSystemTab, seleccionar la variante
2. Clic en botón **"Resetear"** (ícono RotateCcw)
3. Confirmación: "¿Resetear variante a valores originales?"
4. ✅ Restaurado a defaults

**Valores default:**
- `content`: Ver `cardConfig.js` líneas 153-193
- `default`: Ver `cardConfig.js` líneas 20-53

---

## 🧪 Testing

### Probar cambio de altura de imagen:

1. Ir a **Settings → Diseño → Card System**
2. Seleccionar variante **content**
3. Cambiar `headerHeight` de '192px' a '240px'
4. Guardar
5. Ir a **Gestión de Contenidos**
6. ✅ Verificar que las tarjetas con imagen tienen header más alto

### Probar hover effect:

1. Seleccionar variante **content**
2. Cambiar `hoverTransform` de '-4px' a '-8px'
3. Cambiar `imageScale` de '1.05' a '1.1'
4. Guardar
5. Ir a **Gestión de Contenidos**
6. Hover sobre una tarjeta con imagen
7. ✅ Verificar que se levanta más y la imagen hace más zoom

### Probar footer sticky:

1. Seleccionar variante **default**
2. Cambiar `footerSticky` a `false`
3. Guardar
4. Ir a **Gestión de Contenidos**
5. ✅ Verificar que el footer ya no está pegado al fondo

---

## 📝 Notas Importantes

- ✅ **Ya implementado:** No necesitas código adicional
- ✅ **Cambios en tiempo real:** Los cambios se aplican inmediatamente
- ✅ **Sin recargar:** Hot reload automático
- ✅ **Persistente:** La configuración se mantiene entre sesiones
- ✅ **Sincronizado:** Cambios visibles en todas las pestañas
- ⚠️ **LocalStorage:** Solo se guarda localmente (no en Firebase)
- 💡 **Futuro:** Se puede migrar a Firebase para persistencia global

---

## 🎯 Ejemplos de Personalización

### Ejemplo 1: Cards más altas y con efecto pronunciado

```javascript
// Variante: content
{
  headerHeight: '240px',        // +48px
  hoverTransform: '-8px',       // +4px lift
  hoverShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',  // Shadow más grande
  imageScale: '1.1'             // +0.05 zoom
}
```

### Ejemplo 2: Cards minimalistas

```javascript
// Variante: default
{
  headerHeight: '96px',         // -32px
  iconSize: 32,                 // -16px
  hoverEnabled: false,          // Sin hover
  normalShadow: 'none',         // Sin sombra
  footerSticky: false           // Footer natural
}
```

### Ejemplo 3: Cards con animación suave

```javascript
// Variante: content
{
  transitionDuration: '500ms',  // +200ms
  transitionTiming: 'cubic-bezier(0.34, 1.56, 0.64, 1)',  // Elastic
  hoverTransform: '-6px',
  imageScale: '1.08'
}
```

---

## 🐛 Troubleshooting

### Los cambios no se aplican

**Problema:** Guardé cambios pero las tarjetas no cambian

**Solución:**
1. Verificar consola del navegador (F12)
2. Buscar: "✅ Configuración guardada"
3. Verificar localStorage: `localStorage.getItem('xiwen_card_config')`
4. Si no existe, guardar de nuevo

### Las tarjetas se ven raras

**Problema:** Después de cambiar valores, las tarjetas se deforman

**Solución:**
1. Ir a CardSystemTab
2. Seleccionar la variante afectada
3. Clic en "Resetear"
4. Volver a configurar con valores más conservadores

### Preview no se actualiza

**Problema:** El preview en CardSystemTab no muestra cambios

**Solución:**
1. Los cambios solo se aplican al guardar
2. Antes de guardar, el preview usa config temporal
3. Después de guardar, recarga con `reloadConfig()`

---

## 🤝 Contribuir

Si quieres agregar más propiedades configurables:

1. Editar `src/components/cards/cardConfig.js`
2. Agregar la propiedad a la variante deseada
3. Implementar el uso en `UniversalCard.jsx`
4. La propiedad será automáticamente editable en CardSystemTab

Ejemplo:
```javascript
// cardConfig.js
content: {
  // ... propiedades existentes
  showAuthor: true,           // Nueva propiedad
  authorFontSize: '14px',    // Nueva propiedad
}
```

La propiedad aparecerá automáticamente en el editor de CardSystemTab.
