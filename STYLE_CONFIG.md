# Configuración de Estilo Global - XIWEN APP

## 📋 Índice
1. [Variables CSS Globales](#variables-css-globales)
2. [Colores](#colores)
3. [Tarjetas (Cards)](#tarjetas-cards)
4. [Modales](#modales)
5. [Tablas](#tablas)
6. [Menús](#menús)
7. [Botones](#botones)
8. [Inputs y Forms](#inputs-y-forms)
9. [Badges](#badges)
10. [Estados Interactivos](#estados-interactivos)

---

## Variables CSS Globales

### Colores de Texto
```css
:root {
  --color-text-primary: #1f2937;    /* Títulos principales */
  --color-text-secondary: #6b7280;  /* Texto secundario, descripciones */
  --color-text-tertiary: #9ca3af;   /* Texto terciario, labels */
}

.dark {
  --color-text-primary: #f3f4f6;    /* Títulos en dark mode */
  --color-text-secondary: #d1d5db;  /* Texto secundario en dark mode */
  --color-text-tertiary: #9ca3af;   /* Texto terciario en dark mode */
}
```

### Colores de Fondo
```css
/* Light Mode */
- Fondo principal: #f9fafb (gray-50)
- Fondo cards: #ffffff
- Fondo hover: #f3f4f6 (gray-100)

/* Dark Mode */
- Fondo principal: #09090b (zinc-950)
- Fondo cards: #18181b (zinc-900)
- Fondo hover: #27272a (zinc-800)
```

### Colores de Borde
```css
/* Light Mode */
- Borde principal: #e5e7eb (gray-200)
- Borde hover: #d1d5db (gray-300)
- Borde focus: #9ca3af (gray-400)

/* Dark Mode */
- Borde principal: #27272a (zinc-800)
- Borde hover: #3f3f46 (zinc-700)
- Borde focus: #52525b (zinc-600)
```

---

## Colores

### Colores Primarios
```css
.btn-primary: #3b82f6 (blue-500)
.badge-primary: #3b82f6 (blue-500)
```

### Colores de Estado
```css
Success (Verde): #10b981 (emerald-500)
Danger (Rojo): #ef4444 (red-500)
Warning (Naranja): #fb923c (orange-400)
Info (Azul): #3b82f6 (blue-500)
```

---

## Tarjetas (Cards)

### Estructura Base
```css
.card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  box-shadow: none;
  transition: transform 0.2s, box-shadow 0.2s;
}

.dark .card {
  background: #18181b;
  border-color: #27272a;
}
```

### Hover Effect
```css
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}
```

### Elementos de Tarjeta
```css
/* Título */
.card-title {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 12px 0;
  line-height: 1.3;
}

.dark .card-title {
  color: #f3f4f6;
}

/* Descripción */
.card-description {
  color: #6b7280;
  font-size: 14px;
  margin-bottom: 16px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dark .card-description {
  color: #9ca3af;
}

/* Stats (Footer) */
.card-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  margin-top: auto; /* Empuja al fondo */
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.dark .card-stats {
  border-top-color: #374151;
}

/* Badges */
.card-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
```

### Tarjetas en Grid
```css
.card-grid-item {
  min-height: 400px;
  height: 100%;
  transition: transform 0.2s, box-shadow 0.2s;
}
```

---

## Modales

### Estructura Base
```css
/* Overlay */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 1000;
}

/* Contenedor del Modal */
.modal-box {
  background: #ffffff;
  border-radius: 12px;
  max-width: 768px;
  width: 100%;
  height: 700px; /* Altura fija para evitar saltos */
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.dark .modal-box {
  background: #1f2937;
}

/* Header */
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  padding: 24px 24px 16px;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.dark .modal-header {
  border-bottom-color: #374151;
}

/* Título */
.modal-title {
  font-size: 24px;
  font-weight: 700;
  color: #111827;
  margin: 0;
}

.dark .modal-title {
  color: #f9fafb;
}

/* Contenido */
.modal-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  min-height: 0; /* Permite scroll correcto */
}

/* Footer */
.modal-footer {
  display: flex;
  gap: 8px;
  padding: 16px 24px 24px;
  border-top: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.dark .modal-footer {
  border-top-color: #374151;
}
```

### Pestañas en Modales
```css
/* Contenedor de Tabs */
.modal-tabs-container {
  padding: 0 24px;
  flex-shrink: 0;
  overflow-x: auto;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
}

.modal-tabs-container::-webkit-scrollbar {
  height: 6px;
}

.modal-tabs-container::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 3px;
}

.modal-tabs-container::-webkit-scrollbar-thumb {
  background: #9ca3af;
  border-radius: 3px;
}

.modal-tabs-container::-webkit-scrollbar-thumb:hover {
  background: #6b7280;
}

.dark .modal-tabs-container::-webkit-scrollbar-track {
  background: #1f2937;
}

.dark .modal-tabs-container::-webkit-scrollbar-thumb {
  background: #4b5563;
}

/* Tabs */
.modal-tabs {
  display: flex;
  gap: 8px;
  min-width: min-content;
  padding-bottom: 4px;
}

/* Tab Individual */
.tab {
  padding: 12px 16px;
  font-size: 14px;
  font-weight: 600;
  transition: colors 0.15s;
  white-space: nowrap;
  color: #6b7280;
  border-bottom: 2px solid transparent;
  min-width: 100px;
}

.tab:hover {
  color: #111827;
}

.dark .tab {
  color: #9ca3af;
}

.dark .tab:hover {
  color: #f3f4f6;
}

/* Tab Activa */
.tab-active {
  color: #111827;
  border-bottom-color: #9ca3af;
}

.dark .tab-active {
  color: #f3f4f6;
  border-bottom-color: #6b7280;
}
```

---

## Tablas

### Estructura Base
```css
.table-container {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.dark .table-container {
  border-color: #27272a;
}

table {
  width: 100%;
  border-collapse: collapse;
}

/* Header */
thead {
  background: #f9fafb;
}

.dark thead {
  background: #18181b;
}

th {
  padding: 12px 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
}

.dark th {
  color: #9ca3af;
  border-bottom-color: #27272a;
}

/* Filas */
tbody tr {
  border-bottom: 1px solid #e5e7eb;
  transition: background 0.15s;
}

.dark tbody tr {
  border-bottom-color: #27272a;
}

tbody tr:hover {
  background: #f9fafb;
}

.dark tbody tr:hover {
  background: #27272a;
}

/* Celdas */
td {
  padding: 12px 16px;
  color: #374151;
}

.dark td {
  color: #d1d5db;
}
```

---

## Menús

### Menú Lateral (SideMenu)
```css
.sidemenu {
  position: fixed;
  top: 64px;
  left: 0;
  bottom: 0;
  width: 200px;
  background: #0a0a0a;
  border-right: none;
  z-index: 999;
}

/* Items del menú */
.sidemenu-item {
  width: calc(100% - 16px);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  margin: 4px 8px;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease;
  color: #f4f4f5;
  font-size: 14px;
  font-weight: 500;
}

.sidemenu-item:hover {
  background: #27272a;
}

.sidemenu-item.active {
  background: #27272a;
  font-weight: 600;
}

/* En móvil, usar :active para dispositivos táctiles */
@media (hover: none) {
  .sidemenu-item:active {
    background: #27272a;
  }
}
```

### Menú de Usuario (UserMenu)
```css
.user-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 280px;
  background: #18181b;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
  border: none;
  overflow: hidden;
  z-index: 1001;
}

/* Items */
.menu-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: none;
  border: none;
  cursor: pointer;
  transition: background 0.15s ease;
}

.menu-item:hover {
  background: #27272a;
}

@media (hover: none) {
  .menu-item:active {
    background: #27272a;
  }
}

/* Secciones */
.user-menu-section {
  padding: 0;
}

.user-menu-section:not(:last-child) {
  border-bottom: 1px solid #27272a;
}
```

---

## Botones

### Botón Base
```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Variantes
```css
/* Primary */
.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

/* Success */
.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #059669;
}

/* Danger */
.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

/* Ghost */
.btn-ghost {
  background: transparent;
  color: #6b7280;
  border: 1px solid #e5e7eb;
}

.btn-ghost:hover:not(:disabled) {
  background: #f9fafb;
  color: #111827;
}

.dark .btn-ghost {
  color: #9ca3af;
  border-color: #374151;
}

.dark .btn-ghost:hover:not(:disabled) {
  background: #27272a;
  color: #f3f4f6;
}
```

---

## Inputs y Forms

### Input Base
```css
.input {
  width: 100%;
  padding: 12px 14px;
  font-size: 16px;
  line-height: normal;
  color: #111827;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  outline: none;
  transition: none;
}

.dark .input {
  color: #f9fafb;
  background: #09090b;
  border-color: #52525b;
}

.input:focus {
  border-color: #9ca3af;
  ring: 2px;
  ring-color: rgba(156, 163, 175, 0.2);
}

.dark .input:focus {
  border-color: #6b7280;
  ring-color: rgba(107, 114, 128, 0.2);
}

.input:disabled {
  background: #f3f4f6;
  cursor: not-allowed;
  opacity: 0.6;
}

.dark .input:disabled {
  background: #1f2937;
}
```

### Select
```css
.select {
  width: 100%;
  padding: 12px 14px;
  padding-right: 40px;
  font-size: 16px;
  color: #111827;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  outline: none;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,...");
  background-position: right 12px center;
  background-size: 24px 24px;
  background-repeat: no-repeat;
}

.dark .select {
  color: #f9fafb;
  background-color: #09090b;
  border-color: #52525b;
}

.select:focus {
  border-color: #9ca3af;
  ring: 2px;
  ring-color: rgba(156, 163, 175, 0.2);
}

.dark .select:focus {
  border-color: #6b7280;
  ring-color: rgba(107, 114, 128, 0.2);
}
```

### Label
```css
.label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
  line-height: 1.5;
}

.dark .label {
  color: #d1d5db;
}
```

---

## Badges

```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 9999px;
  white-space: nowrap;
}

/* Variantes */
.badge-primary {
  background: #dbeafe;
  color: #1e40af;
}

.dark .badge-primary {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
}

.badge-success {
  background: #d1fae5;
  color: #065f46;
}

.dark .badge-success {
  background: rgba(16, 185, 129, 0.2);
  color: #6ee7b7;
}

.badge-danger {
  background: #fee2e2;
  color: #991b1b;
}

.dark .badge-danger {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
}

.badge-warning {
  background: #fed7aa;
  color: #92400e;
}

.dark .badge-warning {
  background: rgba(251, 146, 60, 0.2);
  color: #fdba74;
}

.badge-info {
  background: #dbeafe;
  color: #1e40af;
}

.dark .badge-info {
  background: rgba(59, 130, 246, 0.2);
  color: #93c5fd;
}
```

---

## Estados Interactivos

### Focus Global
```css
/* Remover outline azul del navegador */
*:focus {
  outline: none;
}
```

### Hover en Dispositivos Táctiles
```css
/* Para dispositivos táctiles, usar :active en lugar de :hover */
@media (hover: none) {
  .sidemenu-item:active,
  .menu-item:active,
  .btn:active {
    /* Estados táctiles */
  }
}
```

### Transiciones
```css
/* Transiciones estándar */
transition: all 0.15s ease;           /* Para cambios simples */
transition: transform 0.2s, box-shadow 0.2s;  /* Para cards */
transition: background 0.15s ease;    /* Para hover backgrounds */
```

---

## 📝 Notas de Implementación

### 1. **Jerarquía de Estilos**
- Estilos base en `globals.css`
- Componentes específicos pueden extender pero no sobrescribir
- Usar variables CSS para valores reutilizables

### 2. **Convenciones de Nombres**
- `.card-*` para elementos de tarjetas
- `.modal-*` para elementos de modales
- `.btn-*` para variantes de botones
- `.badge-*` para variantes de badges

### 3. **Responsive**
- Mobile first approach
- Breakpoints:
  - `640px` (sm) - Móviles grandes
  - `768px` (md) - Tablets
  - `1024px` (lg) - Desktop pequeño
  - `1280px` (xl) - Desktop grande

### 4. **Dark Mode**
- Usar clase `.dark` en el elemento raíz
- Todas las variantes deben tener soporte dark mode
- Variables CSS se adaptan automáticamente

### 5. **Accesibilidad**
- Todos los elementos interactivos deben tener estados focus
- Usar `aria-label` para iconos sin texto
- Mantener contraste WCAG AA mínimo

---

## 🔄 Actualización de Estilos

Para actualizar estilos globalmente:

1. **Modificar variable CSS** en `globals.css` `:root` o `.dark`
2. **Actualizar clase base** (ej: `.card-stats`)
3. **Verificar** que todos los componentes heredan correctamente
4. **No usar estilos inline** a menos que sea absolutamente necesario

---

**Última actualización**: 2025-01-02
**Versión**: 1.0.0
