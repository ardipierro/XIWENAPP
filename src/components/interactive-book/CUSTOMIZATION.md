# 🎨 Sistema de Personalización Avanzada - Libro Interactivo

## Descripción General

El sistema de personalización permite a los usuarios modificar **más de 30 aspectos visuales** del libro interactivo en tiempo real. Todos los cambios se guardan en `localStorage` y se aplican mediante CSS variables globales.

## Características Principales

### ✨ 4 Categorías de Personalización

#### 1. **Tipografía**
- Familia de fuente (Sistema, Serif, Mono, Redondeada)
- Tamaño de fuente (12px - 24px)
- Altura de línea (1.2 - 2.0)
- Grosor de fuente (Ligera, Normal, Media, Semi-negrita, Negrita)

#### 2. **Colores**
- **Burbujas de diálogo:**
  - Fondo izquierda
  - Fondo derecha
  - Texto izquierda
  - Texto derecha
- **Badges (5 tipos):**
  - Primary (fondo + texto)
  - Success (fondo + texto)
  - Warning (fondo + texto)
  - Danger (fondo + texto)
  - Info (fondo + texto)
- **Contenedores:**
  - Fondo de tarjetas
  - Borde de tarjetas
  - Fondo general
  - Color de acento

#### 3. **Diseño/Layout**
- Estilo de burbujas (Redondeadas, Cuadradas, Píldora)
- Radio de bordes (0px - 32px)
- Espaciado general (8px - 32px)
- Relleno de burbujas (8px - 32px)
- Relleno de tarjetas (12px - 48px)
- Grosor de borde (0px - 4px)
- Estilo de borde (Sólido, Discontinuo, Punteado, Sin borde)
- Color de borde (selector de color)
- Toggles:
  - Mostrar avatares
  - Mostrar badges
  - Modo compacto

#### 4. **Efectos**
- Tamaño de sombra (Sin sombra, Pequeña, Media, Grande, Extra grande)
- Opacidad de sombra (0% - 100%)
- Color de sombra (selector de color)
- Velocidad de animación (Lenta, Normal, Rápida)
- Toggles:
  - Activar animaciones
  - Mostrar sombras en tarjetas

## CSS Variables Disponibles

### Tipografía
```css
--book-font-family: /* Familia de fuente */
--book-font-size: /* Tamaño en px */
--book-line-height: /* Altura de línea */
--book-font-weight: /* Grosor (300-700) */
```

### Burbujas
```css
--bubble-bg-left: /* Color de fondo burbuja izquierda */
--bubble-bg-right: /* Color de fondo burbuja derecha */
--bubble-text-left: /* Color de texto izquierda */
--bubble-text-right: /* Color de texto derecha */
--bubble-border-color: /* Color del borde */
--bubble-border-width: /* Grosor del borde */
--bubble-border-style: /* Estilo del borde */
--bubble-border-radius: /* Radio de bordes */
--bubble-padding: /* Relleno interno */
```

### Badges
```css
--badge-primary-bg: /* Fondo badge primary */
--badge-primary-text: /* Texto badge primary */
--badge-success-bg: /* Fondo badge success */
--badge-success-text: /* Texto badge success */
--badge-warning-bg: /* Fondo badge warning */
--badge-warning-text: /* Texto badge warning */
--badge-danger-bg: /* Fondo badge danger */
--badge-danger-text: /* Texto badge danger */
--badge-info-bg: /* Fondo badge info */
--badge-info-text: /* Texto badge info */
```

### Contenedores
```css
--card-bg: /* Fondo de tarjetas */
--card-border: /* Color de borde de tarjetas */
--card-border-width: /* Grosor de borde */
--card-border-style: /* Estilo de borde */
--card-border-radius: /* Radio de bordes */
--card-padding: /* Relleno interno */
--card-shadow: /* Sombra de tarjetas */
--container-bg: /* Fondo general */
--accent-color: /* Color de acento */
```

### Espaciado y Efectos
```css
--spacing-base: /* Espaciado base */
--animation-speed: /* Velocidad de animaciones */
--animations-enabled: /* 1 o 0 */
```

## Uso en Componentes

### Inline Styles (Recomendado)
```jsx
<div
  style={{
    backgroundColor: 'var(--bubble-bg-left)',
    color: 'var(--bubble-text-left)',
    padding: 'var(--bubble-padding)',
    fontFamily: 'var(--book-font-family)',
    fontSize: 'var(--book-font-size)'
  }}
>
  Contenido
</div>
```

### Clases CSS
```css
.mi-componente {
  background-color: var(--card-bg);
  border-color: var(--card-border);
  border-radius: var(--card-border-radius);
  padding: var(--card-padding);
  box-shadow: var(--card-shadow);
}
```

## Persistencia

- **Almacenamiento:** `localStorage` con clave `xiwen_view_settings_v2`
- **Formato:** JSON con todos los settings
- **Carga automática:** Al montar el componente ViewCustomizer
- **Aplicación:** Inmediata mediante `applySettingsToDOM()`

## Valores por Defecto

```javascript
{
  // Tipografía
  fontFamily: 'system',
  fontSize: 16,
  lineHeight: 1.6,
  fontWeight: 'normal',

  // Burbujas
  bubbleBgLeft: '#f3f4f6',
  bubbleBgRight: '#5b8fa3',
  bubbleTextLeft: '#111827',
  bubbleTextRight: '#ffffff',
  bubbleBorderWidth: 0,

  // Badges
  badgePrimaryBg: '#5b8fa3',
  badgeSuccessBg: '#10b981',
  badgeWarningBg: '#f59e0b',
  badgeDangerBg: '#ef4444',
  badgeInfoBg: '#7a8fa8',

  // Layout
  borderRadius: 16,
  spacing: 16,
  bubblePadding: 16,
  cardPadding: 24,

  // Efectos
  shadowSize: 'medium',
  shadowOpacity: 0.1,
  enableAnimations: true,
  animationSpeed: 'normal'
}
```

## Componentes Actualizados

✅ **ViewCustomizer.jsx** - Panel de configuración con 4 tabs
✅ **DialogueBubble.jsx** - Usa variables CSS para burbujas
✅ **BaseBadge.jsx** - Usa variables CSS para colores
✅ **styles.css** - Clases helper con variables

## Vista Previa en Vivo

El componente incluye una **vista previa en tiempo real** que muestra cómo se ven los cambios antes de cerrar el panel.

## Resetear Configuración

Botón "Restaurar valores por defecto" que revierte todas las personalizaciones.

## Compatibilidad

- ✅ Dark mode (respeta preferencias del sistema)
- ✅ Responsive (funciona en móviles)
- ✅ Accesibilidad (respeta prefers-reduced-motion)
- ✅ Fallbacks (valores por defecto si no hay CSS variables)

## Ejemplo de Uso Completo

```jsx
import { ViewCustomizer } from './interactive-book';

function MiLibro() {
  const [viewSettings, setViewSettings] = useState(null);

  return (
    <div className="interactive-book-container">
      <ViewCustomizer onSettingsChange={setViewSettings} />

      {/* Tu contenido aquí */}
      <div className="book-card">
        <p>Este texto usará las CSS variables automáticamente</p>
      </div>
    </div>
  );
}
```

## Total de Opciones Configurables

🎨 **35+ opciones** de personalización:
- 4 opciones de tipografía
- 14 colores de burbujas y badges
- 4 colores de contenedores
- 8 opciones de layout
- 5 opciones de efectos

---

**Creado con ❤️ para XIWENAPP**
