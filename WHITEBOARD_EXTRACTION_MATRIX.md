# Whiteboard.jsx - Extraction Matrix

## Quick Reference Table

### State Variables to Extract (60+ variables across 8 categories)

| Category | Variables | Lines | Hook Name | Priority |
|----------|-----------|-------|-----------|----------|
| **Session** | currentSessionId, sessionTitle, showSaveModal, showLoadModal, savedSessions, isLoadingSessions | 61-66 | useSessionState | HIGH |
| **Drawing** | canvasRef, isDrawing, tool, color, lineWidth, slides, currentSlide, history, historyStep, startPos | 67-84 | useDrawingState | HIGH |
| **Text** | textInput, textInputRef, textBold, textItalic, textUnderline, fontSize | 78-84 | useTextState | MEDIUM |
| **Objects** | objects, selectedObject, editingObject, isDraggingObject, dragObjectOffset, isResizing, resizeHandle | 86-92 | useObjectState | HIGH |
| **Strokes** | strokes, selectedStroke, isDraggingStroke, baseCanvasImage | 94-97 | useStrokeState | HIGH |
| **Toolbar** | toolbarPos, isDraggingToolbar, dragOffset, isVertical, verticalSide, expandedGroup, tempCanvas | 101-114 | useToolbarState | MEDIUM |
| **Collaborative** | participants, isConnected, sharedContent, isHost, showShareModal, shareContentUrl, shareContentType, activeSelections | 117-125 | useCollaborativeState | HIGH |
| **Constants** | presetColors | 128-141 | constants/colors.js | LOW |

---

### Functions to Extract (23 functions)

#### Drawing Functions (3)
| Function | Lines | Size | Type | New Home |
|----------|-------|------|------|----------|
| `drawSmoothStroke(points, ctx)` | 499 | ~50 | Utility | `utils/drawingUtils.js` |
| `drawNewStrokesOnCanvas(strokes)` | 555 | ~15 | Utility | `utils/drawingUtils.js` |
| `drawSingleStroke(stroke, ctx)` | 573 | ~70 | Utility | `utils/drawingUtils.js` |

#### Canvas Management (2)
| Function | Lines | Size | Type | New Home |
|----------|-------|------|------|----------|
| `resizeCanvas()` | 658 | ~35 | Hook | `hooks/useCanvasSetup.js` |
| `getPosition(e)` | 779 | ~15 | Utility | `utils/positionUtils.js` |

#### History Management (3)
| Function | Lines | Size | Type | New Home |
|----------|-------|------|------|----------|
| `saveToHistory()` | 740 | ~10 | Hook | `hooks/useHistoryManagement.js` |
| `undo()` | 749 | ~15 | Hook | `hooks/useHistoryManagement.js` |
| `redo()` | 764 | ~15 | Hook | `hooks/useHistoryManagement.js` |

#### Text Functions (2)
| Function | Lines | Size | Type | New Home |
|----------|-------|------|------|----------|
| `applyText(force)` | 1130 | ~30 | Utility | `utils/textUtils.js` |
| `handleTextKeyDown(e)` | 1166 | ~10 | Utility | `utils/textUtils.js` |

#### Slide Management (4)
| Function | Lines | Size | Type | New Home |
|----------|-------|------|------|----------|
| `saveCurrentSlide()` | 1364 | ~5 | Hook | `hooks/useSlideManagement.js` |
| `addSlide()` | 1374 | ~10 | Hook | `hooks/useSlideManagement.js` |
| `deleteSlide()` | 1383 | ~10 | Hook | `hooks/useSlideManagement.js` |
| `goToSlide(index)` | 1391 | ~10 | Hook | `hooks/useSlideManagement.js` |

#### File Management (2)
| Function | Lines | Size | Type | New Home |
|----------|-------|------|------|----------|
| `downloadPresentation()` | 1399 | ~12 | Utility | `utils/fileUtils.js` |
| `loadPresentation(e)` | 1411 | ~95 | Utility | `utils/fileUtils.js` |

#### Session Functions (5)
| Function | Lines | Size | Type | New Home |
|----------|-------|------|------|----------|
| `handleSaveSession()` | 1429 | ~55 | Hook | `hooks/useSessionManagement.js` |
| `handleLoadSessions()` | 1484 | ~30 | Hook | `hooks/useSessionManagement.js` |
| `loadSession(session)` | 1504 | ~45 | Hook | `hooks/useSessionManagement.js` |
| `handleShareContent()` | 1513 | ~30 | Hook | `hooks/useCollaborativeMode.js` |
| `handleNewSession()` | 1546 | ~12 | Hook | `hooks/useSessionManagement.js` |
| `clearCanvas()` | 1177 | ~20 | Hook | `hooks/useCanvasManagement.js` |

---

### Event Handlers to Extract (10+)

#### Drawing Handlers (3)
| Handler | Lines | Size | Type | Trigger | New Home |
|---------|-------|------|------|---------|----------|
| `startDrawing(e)` | 798 | ~130 | Canvas | onMouseDown, onTouchStart | `hooks/useDrawingHandlers.js` |
| `draw(e)` | 930 | ~230 | Canvas | onMouseMove, onTouchMove | `hooks/useDrawingHandlers.js` |
| `stopDrawing(e)` | 962 | ~170 | Canvas | onMouseUp, onTouchEnd | `hooks/useDrawingHandlers.js` |

#### Toolbar Handlers (3)
| Handler | Lines | Size | Type | Trigger | New Home |
|---------|-------|------|------|---------|----------|
| `handleToolbarMouseDown(e)` | 1197 | ~15 | Global | onMouseDown | `hooks/useToolbarHandlers.js` |
| `handleToolbarMouseMove(e)` | 1210 | ~85 | Global | onMouseMove | `hooks/useToolbarHandlers.js` |
| `handleToolbarMouseUp(e)` | 1293 | ~60 | Global | onMouseUp | `hooks/useToolbarHandlers.js` |

#### Object Interaction (2)
| Handler | Lines | Size | Type | Trigger | New Home |
|---------|-------|------|------|---------|----------|
| Mouse Move Handler | 258 | ~95 | Effect | Global onMouseMove | `hooks/useObjectInteraction.js` |
| Mouse Up Handler | 352 | ~40 | Effect | Global onMouseUp | `hooks/useObjectInteraction.js` |

---

### UI Components to Extract (10)

| Component | Lines | Size | Complexity | Sub-components | Priority |
|-----------|-------|------|------------|----------------|----------|
| `Toolbar` | 1582-1926 | ~350 | HIGH | 12 groups | HIGH |
| `DrawingCanvas` | 1568-1579 | ~15 | LOW | - | MEDIUM |
| `TextInputOverlay` | 1931-1952 | ~25 | LOW | - | MEDIUM |
| `StickyNotesList` | 1955-2142 | ~200 | VERY HIGH | StickyNote | HIGH |
| `TextBoxList` | 2155-2344 | ~200 | VERY HIGH | TextBox | HIGH |
| `SaveSessionModal` | 2349-2373 | ~30 | LOW | - | MEDIUM |
| `LoadSessionsModal` | 2374-2407 | ~40 | MEDIUM | - | MEDIUM |
| `ShareContentModal` | 2410-2468 | ~65 | MEDIUM | - | MEDIUM |
| `BackButton` | 1561-1564 | ~10 | VERY LOW | - | LOW |
| `SharedContentViewer` | 2470-2478 | N/A | LOW | Already exists | N/A |

---

### Toolbar Sub-components (12)

| Sub-component | Lines | Purpose | Frequency |
|---------------|-------|---------|-----------|
| Selection Button | 1593 | Select/move tools | Always visible |
| Objects Group | 1608 | Sticky notes, text boxes | Collapsible |
| Drawing Tools | 1640 | Pencil, pen, marker, highlighter | Collapsible |
| Shapes Group | 1686 | Line, arrow, rectangle, circle, text | Collapsible |
| Eraser Button | 1739 | Erase tool | Always visible |
| Color Picker | 1752 | Color selection | Always visible |
| Line Width | 1786 | Stroke width control | Always visible |
| Text Formatting | 1804 | Bold, italic, underline, font size | Conditional (when text tool) |
| Actions | 1850 | Undo, redo, clear | Always visible |
| Slide Navigation | 1866 | Previous, next, counter | Always visible |
| Slide Management | 1892 | Add, delete, save, load | Always visible |
| Share Button | 1912 | Share content (collaborative) | Conditional (if isHost) |

---

## Extraction Sequence Diagram

```
Phase 1: State (2 hrs)          Phase 2: Utils (2 hrs)      Phase 3: Hooks (3.2 hrs)
┌─────────────────┐             ┌─────────────────┐        ┌──────────────────┐
│ useDrawingState │             │ drawingUtils    │        │ useCanvasSetup   │
│ useTextState    │             │ positionUtils   │        │ useCanvasRenderer│
│ useObjectState  │             │ textUtils       │        │ useHistoryMgmt   │
│ useToolbarState │─────────────→ fileUtils       │───────→│ useSlideMgmt     │
│ useCollabState  │             │ constants       │        │ useSessionMgmt   │
│ useHistoryState │             └─────────────────┘        │ useCollabMode    │
└─────────────────┘                                         └──────────────────┘
        ↓                              ↓                             ↓
       150 LOC reduction         300+ LOC reduction          400+ LOC reduction

Phase 4: Components (5.5 hrs)        Phase 5: Handlers (3 hrs)
┌──────────────────┐                ┌──────────────────┐
│ Toolbar          │◄───────────────│ useDrawingHdlrs  │
│ DrawingCanvas    │                │ useToolbarHdlrs  │
│ TextInputOverlay │                │ useObjInteract   │
│ StickyNotesL     │                └──────────────────┘
│ TextBoxList      │                        ↓
│ SaveSessionModal │                   300+ LOC reduction
│ LoadSessionsModal│
│ ShareContentModal│
│ BackButton       │
└──────────────────┘
        ↓
   600+ LOC reduction

FINAL: Whiteboard.jsx reduced from 2,484 → 200-300 LOC (85-90% reduction)
```

---

## File Structure After Refactoring

```
src/
├── components/
│   ├── Whiteboard/
│   │   ├── Whiteboard.jsx (200-300 LOC) [REFACTORED]
│   │   ├── Toolbar.jsx (350 LOC) [NEW]
│   │   ├── DrawingCanvas.jsx (15 LOC) [NEW]
│   │   ├── TextInputOverlay.jsx (25 LOC) [NEW]
│   │   ├── StickyNotesList.jsx (200 LOC) [NEW]
│   │   │   └── StickyNote.jsx (120 LOC) [NEW - sub]
│   │   ├── TextBoxList.jsx (200 LOC) [NEW]
│   │   │   └── TextBox.jsx (120 LOC) [NEW - sub]
│   │   ├── modals/
│   │   │   ├── SaveSessionModal.jsx (30 LOC) [NEW]
│   │   │   ├── LoadSessionsModal.jsx (40 LOC) [NEW]
│   │   │   └── ShareContentModal.jsx (65 LOC) [NEW]
│   │   ├── BackButton.jsx (10 LOC) [NEW]
│   │   └── Whiteboard.css [EXISTING]
│   ├── SharedContentViewer.jsx [EXISTING]
│   └── common/
│       └── BaseButton.jsx [EXISTING]
│
├── hooks/
│   ├── whiteboard/
│   │   ├── useDrawingState.js (50 LOC) [NEW]
│   │   ├── useTextState.js (20 LOC) [NEW]
│   │   ├── useObjectState.js (25 LOC) [NEW]
│   │   ├── useToolbarState.js (20 LOC) [NEW]
│   │   ├── useCollaborativeState.js (25 LOC) [NEW]
│   │   ├── useHistoryState.js (10 LOC) [NEW]
│   │   ├── useCanvasSetup.js (80 LOC) [NEW]
│   │   ├── useCanvasRenderer.js (100 LOC) [NEW]
│   │   ├── useCanvasManagement.js (40 LOC) [NEW]
│   │   ├── useHistoryManagement.js (40 LOC) [NEW]
│   │   ├── useSlideManagement.js (50 LOC) [NEW]
│   │   ├── useSessionManagement.js (110 LOC) [NEW]
│   │   ├── useCollaborativeMode.js (120 LOC) [NEW]
│   │   ├── useDrawingHandlers.js (300 LOC) [NEW]
│   │   ├── useToolbarHandlers.js (60 LOC) [NEW]
│   │   └── useObjectInteraction.js (135 LOC) [NEW]
│   └── index.js [NEW - barrel export]
│
├── utils/
│   ├── drawing/
│   │   ├── drawingUtils.js (180 LOC) [NEW]
│   │   ├── positionUtils.js (30 LOC) [NEW]
│   │   └── textUtils.js (50 LOC) [NEW]
│   ├── file/
│   │   └── fileUtils.js (110 LOC) [NEW]
│   ├── constants/
│   │   └── colors.js (15 LOC) [NEW]
│   └── index.js [NEW - barrel export]
│
└── firebase/
    └── whiteboard.js [EXISTING]
```

---

## Dependency Injection Points

### Props to Pass to Components

**Toolbar.jsx**
```javascript
<Toolbar
  // State
  tool, setTool
  color, setColor
  lineWidth, setLineWidth
  expandedGroup, setExpandedGroup
  textBold, setTextBold
  textItalic, setTextItalic
  textUnderline, setTextUnderline
  fontSize, setFontSize
  currentSlide, slides
  historyStep, history
  isCollaborative, isHost
  // Handlers
  onUndo, onRedo, onClear
  onGoToSlide, onAddSlide, onDeleteSlide
  onSaveSession, onLoadSessions, onShareContent
  onShowSaveModal, onShowLoadModal, onShowShareModal
/>
```

**StickyNotesList.jsx**
```javascript
<StickyNotesList
  objects, selectedObject, editingObject
  tool
  isDraggingObject, isResizing
  activeSelections
  isCollaborative, currentSlide
  onSelectObject, onEditObject, onUpdateObject
  onDeleteObject
  updateObjectInActiveSession
  updateActiveSelection
/>
```

---

## Integration Checklist

- [ ] Phase 1: Extract and test all state hooks
- [ ] Phase 2: Extract and test all utility functions
- [ ] Phase 3: Extract and test all business logic hooks
- [ ] Phase 4: Extract and test all UI components
- [ ] Phase 5: Extract and test all event handlers
- [ ] Update main Whiteboard component to use new imports
- [ ] Verify all functionality works end-to-end
- [ ] Add TypeScript types if applicable
- [ ] Write unit tests for each extracted hook/utility
- [ ] Write integration tests for component interactions
- [ ] Update documentation and README
- [ ] Performance test to ensure no regressions
- [ ] Code review and cleanup

---

## Performance Considerations

### Before Refactoring
- Single large component (2,484 LOC)
- All re-renders affect entire component
- Difficult to optimize with useMemo/useCallback

### After Refactoring
- Smaller, focused components
- Can optimize each component independently
- Easier to identify performance bottlenecks
- Collaborative features can be lazy-loaded

### Potential Optimizations
- Memoize Toolbar component (doesn't change during drawing)
- Memoize StickyNote/TextBox lists (virtualize if 100+ items)
- Debounce toolbar position updates
- Use WebWorker for heavy drawing calculations
- Implement Canvas dirty-checking to avoid unnecessary redraws

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Breaking drawing functionality | HIGH | Extract drawing logic last, comprehensive testing |
| Losing collaborative sync | HIGH | Test Firebase sync thoroughly, use snapshots |
| State sync issues | MEDIUM | Create integration tests, verify state propagation |
| Performance regression | MEDIUM | Profile before/after, optimize re-renders |
| TypeScript/ESLint errors | LOW | Run linter after each phase |

---

## Success Metrics

- [ ] Main component reduced to <300 LOC
- [ ] All tests passing (>80% coverage)
- [ ] No functionality lost
- [ ] No performance regression
- [ ] Improved code readability
- [ ] Easier to add new features
- [ ] Easier to debug issues
- [ ] Team understands new structure

