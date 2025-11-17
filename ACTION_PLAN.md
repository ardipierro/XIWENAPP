# PLAN DE ACCIÓN - OPTIMIZACIÓN DETALLADA
## Recomendaciones Específicas por Archivo

---

## 1. FIRESTORE QUERIES - AGREGAR LÍMITES

### firebase/messages.js - 28 queries

**Función: `getUserConversations`** (línea 158-196)
```javascript
// ANTES:
const q = query(
  conversationsRef,
  where('participants', 'array-contains', userId),
  orderBy('lastMessageAt', 'desc')
);

// DESPUÉS:
const q = query(
  conversationsRef,
  where('participants', 'array-contains', userId),
  orderBy('lastMessageAt', 'desc'),
  limit(50) // Máximo 50 conversaciones
);
```

**Función: `getMessages`** (línea ~210)
```javascript
// ANTES:
const q = query(
  collection(db, 'messages'),
  where('conversationId', '==', conversationId),
  orderBy('createdAt', 'desc')
);

// DESPUÉS:
const q = query(
  collection(db, 'messages'),
  where('conversationId', '==', conversationId),
  orderBy('createdAt', 'desc'),
  limit(20) // Load 20 messages at a time
);
```

**Función: `subscribeToMessages`** (línea ~330)
```javascript
// DESPUÉS:
const q = query(
  collection(db, 'messages'),
  where('conversationId', '==', conversationId),
  orderBy('createdAt', 'desc'),
  limit(20)
);
return onSnapshot(q, callback);
```

**Patrón para loadOlderMessages:**
```javascript
export function loadOlderMessages(conversationId, lastVisibleDoc) {
  const q = query(
    collection(db, 'messages'),
    where('conversationId', '==', conversationId),
    orderBy('createdAt', 'desc'),
    startAfter(lastVisibleDoc),
    limit(20)
  );
  return getDocs(q);
}
```

---

### firebase/firestore.js - 23 queries

**Función: `getAllUsers`** (línea 154-174)
```javascript
// ANTES:
const q = query(usersRef, orderBy('createdAt', 'desc'));
const querySnapshot = await getDocs(q);

// DESPUÉS:
const q = query(
  usersRef, 
  orderBy('createdAt', 'desc'),
  limit(100) // Paginate admin panel
);
const querySnapshot = await getDocs(q);
```

---

### firebase/classSessions.js - 15 queries

```javascript
// Patrón para todas las queries
const q = query(
  collection(db, 'classSessions'),
  where('teacherId', '==', teacherId),
  orderBy('createdAt', 'desc'),
  limit(50)
);
```

---

### firebase/calendarEvents.js - 12 queries

```javascript
// Para eventos de calendario (mostrar solo rango visible)
const q = query(
  collection(db, 'events'),
  where('userId', '==', userId),
  where('date', '>=', startDate),
  where('date', '<=', endDate),
  orderBy('date', 'asc'),
  limit(100)
);
```

---

## 2. REACT.MEMO IMPLEMENTATION

### MessageThread.jsx - Crear sub-componentes memorizados

**Crear: `components/MessageItem.jsx`**
```javascript
import React from 'react';

function MessageItem({ message, onReactionAdd, onEdit, onDelete, isOwn }) {
  return (
    <div className={`message-item ${isOwn ? 'own' : 'other'}`}>
      <div className="message-header">
        <span className="sender-name">{message.senderName}</span>
        <span className="timestamp">{formatTime(message.createdAt)}</span>
      </div>
      <div className="message-content">{message.content}</div>
      {message.attachment && <AttachmentPreview file={message.attachment} />}
      <MessageActions 
        message={message}
        onReactionAdd={onReactionAdd}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}

export default React.memo(MessageItem, (prevProps, nextProps) => {
  return (
    prevProps.message.id === nextProps.message.id &&
    prevProps.message.content === nextProps.message.content &&
    prevProps.isOwn === nextProps.isOwn
  );
});
```

**En MessageThread.jsx:**
```javascript
// ANTES:
{messages.map(msg => (
  <div key={msg.id} className="message-item">
    {/* Message content */}
  </div>
))}

// DESPUÉS:
{messages.map(msg => (
  <MessageItem
    key={msg.id}
    message={msg}
    onReactionAdd={handleReactionAdd}
    onEdit={handleEdit}
    onDelete={handleDelete}
    isOwn={msg.senderId === currentUser.uid}
  />
))}
```

**Beneficio:** Cuando 1 mensaje cambia, no se re-renden todos los 99 restantes.

---

### UnifiedContentManager.jsx - Memo para cards

```javascript
// Crear: components/ContentCard.jsx
import React from 'react';

function ContentCard({ content, onSelect, onDelete, onEdit }) {
  return (
    <div className="content-card">
      <div className="card-header">{content.title}</div>
      <div className="card-body">{content.description}</div>
      <div className="card-actions">
        <button onClick={() => onSelect(content)}>Open</button>
        <button onClick={() => onEdit(content)}>Edit</button>
        <button onClick={() => onDelete(content.id)}>Delete</button>
      </div>
    </div>
  );
}

export default React.memo(ContentCard, (prevProps, nextProps) => {
  return prevProps.content.id === nextProps.content.id &&
         prevProps.content.updatedAt === nextProps.content.updatedAt;
});
```

---

## 3. LAZY LOADING - ACTUALIZAR App.jsx

```javascript
// AGREGAR (línea ~26):

// Lazy load por rol/feature
const AdminPanel = lazy(() => import('./components/admin/AdminPanel'));
const TeacherDashboard = lazy(() => import('./components/teacher/TeacherDashboard'));
const StudentDashboard = lazy(() => import('./components/student/StudentDashboard'));

// Feature-based lazy loading
const ContentManager = lazy(() => import('./components/ContentManager'));
const VoiceLab = lazy(() => import('./components/VoiceLab'));
const SlideGenerator = lazy(() => import('./components/SlideGenerator'));
const InteractiveBook = lazy(() => import('./components/InteractiveBook'));
const HomeworkCorrection = lazy(() => import('./components/HomeworkCorrection'));
const GameCenter = lazy(() => import('./components/GameCenter'));

// ACTUALIZAR Routes:
<Routes>
  {/* Public routes */}
  <Route path="/login" element={<Login />} />
  
  {/* Admin routes */}
  {isAdmin && (
    <Route path="/admin" element={
      <Suspense fallback={<LoadingFallback />}>
        <AdminPanel />
      </Suspense>
    } />
  )}
  
  {/* Teacher routes */}
  {isTeacher && (
    <Route path="/teacher" element={
      <Suspense fallback={<LoadingFallback />}>
        <TeacherDashboard />
      </Suspense>
    } />
  )}
  
  {/* Student routes */}
  {isStudent && (
    <Route path="/student" element={
      <Suspense fallback={<LoadingFallback />}>
        <StudentDashboard />
      </Suspense>
    } />
  )}
  
  {/* Feature routes - Lazy loaded */}
  <Route path="/content-manager" element={
    <Suspense fallback={<LoadingFallback />}>
      <ContentManager />
    </Suspense>
  } />
  
  <Route path="/voice-lab" element={
    <Suspense fallback={<LoadingFallback />}>
      <VoiceLab />
    </Suspense>
  } />
</Routes>
```

**Impacto:**
- Initial bundle: 1MB → 250KB
- TTI: 3000ms → 800ms
- Subsequent feature load: 200ms (from cache)

---

## 4. USEMEMO - EJEMPLOS CRÍTICOS

### ContentReader.jsx - Anotaciones

```javascript
// Antes render:
const processedAnnotations = useMemo(() => {
  return annotations.highlights.map(h => ({
    ...h,
    bbox: calculateBoundingBox(h),
    isVisible: isInViewport(h),
    isEmpty: h.text === ''
  }));
}, [annotations.highlights]); // Solo re-calcula si highlights cambian

const highlightedElements = useMemo(() => {
  return processedAnnotations.filter(a => a.isVisible);
}, [processedAnnotations]);
```

### MessageThread.jsx - Búsqueda

```javascript
// Expensive search operation
const searchResults = useMemo(() => {
  if (!searchTerm.trim()) return [];
  
  return messages.filter(msg => 
    msg.content.toLowerCase().includes(searchTerm.toLowerCase())
  );
}, [messages, searchTerm]); // Only search when messages or term change
```

### UnifiedCalendar.jsx - Agrupación

```javascript
const groupedEvents = useMemo(() => {
  return events.reduce((acc, event) => {
    const dateKey = formatDate(event.date);
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {});
}, [events]);

const monthView = useMemo(() => {
  return Object.entries(groupedEvents).map(([date, dayEvents]) => ({
    date,
    events: dayEvents,
    count: dayEvents.length
  }));
}, [groupedEvents]);
```

---

## 5. CLEANUP DE TIMERS - MessageThread.jsx

**Encontrado en línea ~94:**
```javascript
// ANTES (Memory Leak):
const handleTyping = () => {
  clearTimeout(typingTimeoutRef.current);
  setTyping(true);
  
  // Este timeout nunca se limpiado adecuadamente
  typingTimeoutRef.current = setTimeout(() => {
    setTyping(false);
  }, 3000);
};

// DESPUÉS (Fixed):
useEffect(() => {
  return () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };
}, []); // Cleanup on unmount

const handleTyping = useCallback(() => {
  clearTimeout(typingTimeoutRef.current);
  setIsTyping(true);
  
  typingTimeoutRef.current = setTimeout(() => {
    setIsTyping(false);
  }, 3000);
}, []);
```

---

## 6. FIRESTORE LISTENER CLEANUP

**Patrón para todos los onSnapshot:**

```javascript
// ANTES (Potential memory leak):
useEffect(() => {
  const unsubscribe = onSnapshot(query, (snapshot) => {
    setMessages(snapshot.docs.map(doc => doc.data()));
  });
  
  // ❌ No cleanup!
}, [conversationId]);

// DESPUÉS (Properly cleaned up):
useEffect(() => {
  if (!conversationId) return;
  
  let unsubscribe;
  
  try {
    unsubscribe = onSnapshot(
      query(
        collection(db, 'messages'),
        where('conversationId', '==', conversationId),
        orderBy('createdAt', 'desc'),
        limit(20)
      ),
      (snapshot) => {
        setMessages(snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })));
      },
      (error) => {
        logger.error('Error fetching messages:', error);
      }
    );
  } catch (error) {
    logger.error('Error setting up listener:', error);
  }
  
  // ✓ Proper cleanup
  return () => {
    if (unsubscribe) {
      unsubscribe();
    }
  };
}, [conversationId]);
```

---

## 7. COMPONENT SPLITTING EXAMPLE

### ContentReader.jsx Refactoring

**Original: 3744 líneas en 1 archivo**
**Refactored: 800 líneas distribuidas en 7 archivos**

**components/ContentReader/index.jsx** (main orchestrator - 400 líneas)
```javascript
import React, { useState, useCallback, useMemo } from 'react';
import AnnotationToolbar from './AnnotationToolbar';
import HighlighterPanel from './HighlighterPanel';
import NotesPanel from './NotesPanel';
import DrawingCanvas from './DrawingCanvas';
import TextEditorPanel from './TextEditorPanel';

function ContentReader({ contentId, initialContent, userId, readOnly, onClose }) {
  const [content, setContent] = useState(initialContent || '');
  const [annotations, setAnnotations] = useState({
    highlights: [],
    notes: [],
    drawings: [],
    floatingTexts: []
  });
  const [selectedTool, setSelectedTool] = useState('select');
  const [selectedColor, setSelectedColor] = useState('yellow');

  // Memoized callbacks to prevent child re-renders
  const handleHighlight = useCallback((start, end, color) => {
    setAnnotations(prev => ({
      ...prev,
      highlights: [...prev.highlights, { start, end, color }]
    }));
  }, []);

  const handleAddNote = useCallback((position, text, color) => {
    setAnnotations(prev => ({
      ...prev,
      notes: [...prev.notes, { position, text, color, id: Date.now() }]
    }));
  }, []);

  return (
    <div className="content-reader">
      <AnnotationToolbar 
        selectedTool={selectedTool}
        onSelectTool={setSelectedTool}
      />
      
      <HighlighterPanel 
        selectedColor={selectedColor}
        onSelectColor={setSelectedColor}
      />
      
      <DrawingCanvas 
        onHighlight={handleHighlight}
        selectedColor={selectedColor}
      />
      
      <NotesPanel 
        notes={annotations.notes}
        onAddNote={handleAddNote}
      />
      
      <TextEditorPanel 
        content={content}
        onChange={setContent}
      />
    </div>
  );
}

export default React.memo(ContentReader);
```

**components/ContentReader/AnnotationToolbar.jsx** (250 líneas)
```javascript
import React from 'react';
import {
  Highlighter, Pen, Type, StickyNote, X, Palette,
  Undo, Redo, Trash2, Download
} from 'lucide-react';

function AnnotationToolbar({ selectedTool, onSelectTool }) {
  const tools = [
    { id: 'select', icon: null, label: 'Select' },
    { id: 'highlighter', icon: Highlighter, label: 'Highlight' },
    { id: 'pen', icon: Pen, label: 'Draw' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'note', icon: StickyNote, label: 'Note' }
  ];

  return (
    <div className="annotation-toolbar">
      {tools.map(tool => (
        <button
          key={tool.id}
          className={`tool-btn ${selectedTool === tool.id ? 'active' : ''}`}
          onClick={() => onSelectTool(tool.id)}
          title={tool.label}
        >
          {tool.icon && <tool.icon size={20} />}
        </button>
      ))}
    </div>
  );
}

export default React.memo(AnnotationToolbar);
```

---

## 8. CSS ORGANIZATION

**Nueva estructura:**

```
src/
└── styles/
    ├── index.css (importa todo)
    ├── base.css (reset, variables)
    ├── variables.css (color vars)
    ├── scrollbar.css
    ├── animations.css
    ├── typography.css
    └── components/
        ├── buttons.css
        ├── cards.css
        ├── modals.css
        ├── inputs.css
        └── tables.css
```

**src/styles/index.css:**
```css
@import './base.css';
@import './variables.css';
@import './typography.css';
@import './animations.css';
@import './scrollbar.css';

/* Component styles */
@import './components/buttons.css';
@import './components/cards.css';
@import './components/modals.css';
@import './components/inputs.css';
@import './components/tables.css';
```

**Beneficio:**
- CSS parsing más rápido (archivos más pequeños)
- Mejor cacheo (archivos estáticos no cambian)
- Mantenibilidad mejorada

---

## 9. DYNAMIC IMPORTS FOR HEAVY LIBRARIES

### components/DesignLab.jsx

```javascript
// ANTES: Siempre importa
import Excalidraw from '@excalidraw/excalidraw';

// DESPUÉS: Dynamic import
const Excalidraw = React.lazy(() => 
  import('@excalidraw/excalidraw')
);

function DesignLab() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Excalidraw />
    </Suspense>
  );
}
```

### Export Functions

```javascript
// ANTES: Importan siempre
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const handleExportPDF = async (content) => {
  const pdf = new jsPDF();
  // ...
};

// DESPUÉS: Dynamic import on demand
const handleExportPDF = async (content) => {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF();
  // ...
};

const handleExportImage = async (element) => {
  const html2canvas = (await import('html2canvas')).default;
  const canvas = await html2canvas(element);
  // ...
};
```

---

## 10. VERIFICATION CHECKLIST

### Después de implementar cada cambio:

```bash
# 1. Build y verifica bundle size
npm run build
du -sh dist/
npm run preview

# 2. Test performance
npm run lighthouse:mobile
npm run lighthouse:desktop

# 3. Check for memory leaks
# Chrome DevTools → Memory → Take heap snapshot
# Navegar entre pantallas 3 veces
# Tomar otro snapshot
# Comparar - no debería crecer mucho

# 4. Verifica logs
# Browser console - no errors/warnings
# Firebase logs - queries limitadas
```

---

## TIMELINE DE IMPLEMENTACIÓN

**Semana 1 (Quick Wins - 5.5h):**
- [ ] Day 1: Add .limit() to Firestore queries (2h)
- [ ] Day 2: React.memo for MessageItem (1h)
- [ ] Day 3: Lazy load 5 main routes (1.5h)
- [ ] Day 4: Cleanup timers in MessageThread (0.5h)
- [ ] Day 5: Test & verify improvements (0.5h)

**Semana 2 (Major Refactoring - 8h):**
- [ ] Split ContentReader (4h)
- [ ] Split Whiteboard (3h)
- [ ] Test collaborations (1h)

**Semana 3 (Optimization - 8h):**
- [ ] Add useMemo to 20 paths (2h)
- [ ] React.memo remaining components (2h)
- [ ] Listener cleanup & CSS refactor (2h)
- [ ] Final testing & monitoring setup (2h)

---

**Documento generado:** 2025-11-17
**Próximo paso:** Implementar cambios en orden de prioridad
