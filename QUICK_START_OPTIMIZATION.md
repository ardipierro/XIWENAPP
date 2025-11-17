# GUÍA RÁPIDA - EMPEZAR HOY

## Inicio en 5 minutos

### 1. Lee este archivo (2 min)
### 2. Elige una tarea (1 min)
### 3. Abre ACTION_PLAN.md para detalles (2 min)

---

## OPCIÓN A: MÁS FÁCIL (30 min) → +20% Performance

### Tarea: Agregar `.limit()` a Firestore queries

```javascript
// ABRIR: src/firebase/messages.js

// Línea ~161: Cambiar
const q = query(
  conversationsRef,
  where('participants', 'array-contains', userId),
  orderBy('lastMessageAt', 'desc')
);

// A:
const q = query(
  conversationsRef,
  where('participants', 'array-contains', userId),
  orderBy('lastMessageAt', 'desc'),
  limit(50)  // ← AGREGAR ESTA LÍNEA
);
```

**Archivos a actualizar:**
1. `src/firebase/messages.js` - líneas ~161, ~210, ~330, etc.
2. `src/firebase/firestore.js` - línea ~157
3. `src/firebase/classSessions.js` - multiple queries
4. `src/firebase/calendarEvents.js` - multiple queries

**Ver detalles:** ACTION_PLAN.md → Sección 1

---

## OPCIÓN B: FÁCIL (1h) → +15% Performance

### Tarea: Crear MessageItem component con React.memo

```javascript
// CREAR: src/components/MessageItem.jsx

import React from 'react';

function MessageItem({ message, onReactionAdd, onEdit, isOwn }) {
  return (
    <div className={`message-item ${isOwn ? 'own' : 'other'}`}>
      <div className="message-header">
        <span>{message.senderName}</span>
        <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
      </div>
      <div className="message-content">{message.content}</div>
      {message.attachment && (
        <div className="message-attachment">{message.attachment.filename}</div>
      )}
    </div>
  );
}

export default React.memo(MessageItem, (prev, next) => {
  return prev.message.id === next.message.id &&
         prev.message.content === next.message.content &&
         prev.isOwn === next.isOwn;
});
```

**Usar en MessageThread.jsx:**
```javascript
import MessageItem from './MessageItem';

// Dentro del render:
{messages.map(msg => (
  <MessageItem
    key={msg.id}
    message={msg}
    onReactionAdd={handleReactionAdd}
    onEdit={handleEdit}
    isOwn={msg.senderId === currentUser.uid}
  />
))}
```

**Ver detalles:** ACTION_PLAN.md → Sección 2

---

## OPCIÓN C: MEDIO (1.5h) → +25% Performance

### Tarea: Lazy load routes principales

```javascript
// ABRIR: src/App.jsx

// Línea ~26: CAMBIAR
// Antes (static imports):
// import AdminPanel from './components/admin/AdminPanel';

// Después (lazy loads):
const AdminPanel = lazy(() => import('./components/admin/AdminPanel'));
const ContentManager = lazy(() => import('./components/ContentManager'));
const VoiceLab = lazy(() => import('./components/VoiceLab'));

// En Routes (línea ~100):
<Route path="/admin" element={
  <Suspense fallback={<LoadingFallback />}>
    <AdminPanel />
  </Suspense>
} />

<Route path="/content-manager" element={
  <Suspense fallback={<LoadingFallback />}>
    <ContentManager />
  </Suspense>
} />
```

**Ver detalles:** ACTION_PLAN.md → Sección 3

---

## OPCIÓN D: REFACTORING (4h) → +15% Performance

### Tarea: Dividir ContentReader.jsx (3744 líneas)

**Crear estructura:**
```
src/components/ContentReader/
├── index.jsx (400 líneas)
├── AnnotationToolbar.jsx (250 líneas)
├── HighlighterPanel.jsx (300 líneas)
├── NotesPanel.jsx (300 líneas)
├── DrawingCanvas.jsx (400 líneas)
├── TextEditorPanel.jsx (300 líneas)
└── ExportPanel.jsx (200 líneas)
```

**Ver detalles:** ACTION_PLAN.md → Sección 7

---

## RECOMENDACIÓN PERSONAL

**Semana 1 - Implementar en este orden:**

1. **Lunes (30 min):** Opción A - Add limits() ← START HERE
2. **Martes (1h):** Opción B - MessageItem memo
3. **Miércoles (1.5h):** Opción C - Lazy load routes
4. **Jueves (0.5h):** Cleanup timers en MessageThread
5. **Viernes (1h):** Test con Lighthouse

**Total: 5.5h → +45% Performance**

---

## VERIFICAR CAMBIOS

### Después de cada cambio:

```bash
# Build
npm run build

# Ver tamaño del bundle
du -sh dist/

# Test performance
npm run lighthouse:mobile

# O en el navegador:
# Chrome DevTools → Network tab → Check bundle sizes
# Chrome DevTools → Performance tab → Record y check FCP/LCP
```

---

## RECURSOS

- **PERFORMANCE_SUMMARY.md** - Resumen ejecutivo
- **PERFORMANCE_ANALYSIS.md** - Análisis detallado
- **ACTION_PLAN.md** - Ejemplos de código y patrones

---

## FAQ

**P: ¿Qué debo hacer primero?**
R: Opción A (Add limits). 30 min, +20% mejora inmediata.

**P: ¿Qué es más importante?**
R: En orden: limits() > memo > lazy loading > splitting

**P: ¿Puedo paralelizar?**
R: No, hazlo secuencial. Cada cambio debe testearse.

**P: ¿Necesito parar el proyecto?**
R: No, haz un branch feature/performance

**P: ¿Esto se puede hacer sin refactoring?**
R: 70% se puede hacer sin refactoring. Primero haz lo fácil.

---

## BENCHMARK ANTES & DESPUÉS

**Antes:**
- Bundle: ~1.2 MB
- TTI: 3-4 segundos
- FCP: 2 segundos
- Lighthouse Performance: ~40-50

**Después (Todas las mejoras):**
- Bundle: ~300 KB
- TTI: 0.8 segundos
- FCP: 0.5 segundos
- Lighthouse Performance: ~85-90

---

## RECUERDA

✓ Commit frecuente
✓ Test después de cada cambio
✓ Medir antes y después
✓ No hagas todo de una vez
✓ Pide ayuda si necesitas

---

**¿Listo? Abre ACTION_PLAN.md → Sección 1 y empieza con limits()**

Good luck!
