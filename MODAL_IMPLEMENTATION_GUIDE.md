# Guía de Implementación de Modales

## ⚠️ Regla Crítica: Siempre usar React Portal

**TODOS los modales DEBEN usar `createPortal` de React DOM.**

## ¿Por qué?

Los modales con `position: fixed` tienen un problema cuando se renderizan dentro de contenedores con `overflow-y: auto` (como `.universal-dashboard__content`). El `position: fixed` se comporta como `absolute` limitado al contenedor padre, causando que el backdrop NO cubra toda la pantalla.

## ✅ Implementación Correcta

```jsx
import { createPortal } from 'react-dom';

function MyModal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  const modalContent = (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm"
      style={{ zIndex: 'var(--z-modal-backdrop)' }}
    >
      {/* Contenido del modal */}
      <div style={{ zIndex: 'var(--z-modal)' }}>
        {children}
      </div>
    </div>
  );

  // ✅ CRÍTICO: Renderizar usando portal
  return createPortal(modalContent, document.body);
}
```

## ❌ Implementación Incorrecta

```jsx
function MyModal({ isOpen, onClose, children }) {
  if (!isOpen) return null;

  // ❌ MAL: Se renderiza en el árbol DOM normal
  return (
    <div className="fixed inset-0 bg-black/50">
      {children}
    </div>
  );
}
```

## 📋 Componentes Modales en la App

### ✅ Ya implementados con Portal:
- **BaseModal** (`src/components/common/BaseModal.jsx`) - Componente base para modales
- **ExpandableModal** (`src/components/common/ExpandableModal.jsx`) - Modal expandible
- **ImageLightbox** (`src/components/common/ImageLightbox.jsx`) - Lightbox de imágenes

### 📦 Modales que usan BaseModal (heredan Portal automáticamente):
- ClassSessionModal
- UserProfileModal
- EventDetailModal
- FlashCardViewer
- ConfirmModal
- AIAssistantModal
- QuizModal
- HistoryModal
- Y 15+ más...

## 🎯 Z-Index Hierarchy

```
TopBar:          var(--z-fixed) = 1030
Dropdown:        var(--z-popover) = 1060
Modal Backdrop:  var(--z-modal-backdrop) = 10000
Modal Content:   var(--z-modal) = 10001
```

## 🔍 Cómo Detectar el Problema

Si un modal NO cubre toda la pantalla (especialmente la barra superior), probablemente:
1. No está usando Portal
2. Está dentro de un contenedor con `overflow: auto/hidden`

## 📝 Checklist para Nuevos Modales

- [ ] Importar `createPortal` from 'react-dom'
- [ ] Guardar el JSX del modal en una variable
- [ ] Retornar `createPortal(modalContent, document.body)`
- [ ] Usar `var(--z-modal-backdrop)` para el overlay
- [ ] Usar `var(--z-modal)` para el contenido del modal
- [ ] O mejor: **usar BaseModal/ExpandableModal** que ya tienen todo configurado

## 🚀 Preferencia de Implementación

**SIEMPRE preferir extender BaseModal o ExpandableModal** en lugar de crear modales desde cero.

```jsx
import { BaseModal } from './common';

function MyCustomModal({ isOpen, onClose }) {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Mi Modal"
      size="lg"
    >
      {/* Contenido aquí */}
    </BaseModal>
  );
}
```

---

**Última actualización:** 2025-01-15
**Razón:** Fix de backdrop que no cubría toda la pantalla en calendario
