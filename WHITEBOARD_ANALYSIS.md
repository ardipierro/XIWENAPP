# Whiteboard.jsx - Comprehensive Component Analysis

## Component Overview
- **File**: `/home/user/XIWENAPP/src/components/Whiteboard.jsx`
- **Total Lines**: 2,484
- **Type**: Large monolithic React component
- **Current State**: Highly complex with mixed concerns (drawing, UI, collaboration, storage)
- **Complexity Level**: Very High - Major refactoring opportunity

---

## 1. STATE MANAGEMENT AUDIT

### Session Management State (Lines 61-66)
- `currentSessionId`, `sessionTitle`, `showSaveModal`, `showLoadModal`, `savedSessions`, `isLoadingSessions`
- **Priority**: HIGH - Move to context or custom hook
- **Complexity**: LOW - Simple state variables

### Drawing State (Lines 67-84)
- `canvasRef`, `isDrawing`, `tool`, `color`, `lineWidth`, `slides`, `currentSlide`, `history`, `historyStep`, `startPos`
- **Priority**: HIGH - Extract to `useDrawing` hook
- **Complexity**: MEDIUM - Interdependent with drawing logic

### Text Formatting State (Lines 78-84)
- `textInput`, `textInputRef`, `textBold`, `textItalic`, `textUnderline`, `fontSize`
- **Priority**: MEDIUM - Extract to `useTextFormatting` hook
- **Complexity**: LOW - Self-contained text formatting logic

### Object/Selection State (Lines 86-97)
- `objects`, `selectedObject`, `editingObject`, `isDraggingObject`, `dragObjectOffset`, `isResizing`, `resizeHandle`
- **Priority**: HIGH - Extract to `useObjectManagement` hook
- **Complexity**: HIGH - Complex selection and dragging logic

### Stroke State (Lines 94-97)
- `strokes`, `selectedStroke`, `isDraggingStroke`, `baseCanvasImage`
- **Priority**: HIGH - Extract to `useStrokeManagement` hook
- **Complexity**: MEDIUM

### Toolbar/UI State (Lines 101-114)
- `toolbarPos`, `isDraggingToolbar`, `dragOffset`, `isVertical`, `verticalSide`, `expandedGroup`, `tempCanvas`
- **Priority**: MEDIUM - Extract to `useToolbarState` hook
- **Complexity**: MEDIUM - Toolbar positioning and orientation logic

### Collaborative State (Lines 117-125)
- `participants`, `isConnected`, `sharedContent`, `isHost`, `showShareModal`, `shareContentUrl`, `shareContentType`, `activeSelections`
- **Priority**: HIGH - Extract to `useCollaborativeMode` hook or context
- **Complexity**: HIGH - Real-time synchronization logic

### Constants (Lines 128-141)
- `presetColors` - Can be moved to utils/constants file

---

## 2. MAJOR UI SECTIONS/COMPONENTS EXTRACTABLE

### A. Toolbar Component (Lines 1581-1925)
**Location**: Lines 1582-1926
**Responsibility**: Floating toolbar with tool selection, color picker, line width, text formatting, undo/redo, slide navigation, save/load/share

**Sub-components to extract**:
- Selection Tool Button (Line 1593-1602)
- Objects Group (Collapsible) - Sticky Notes/Text Boxes (Lines 1608-1634)
- Drawing Tools Group (Collapsible) - Pencil/Pen/Marker/Highlighter (Lines 1640-1680)
- Shapes Group (Collapsible) - Line/Arrow/Rectangle/Circle/Text (Lines 1686-1733)
- Eraser Button (Lines 1739-1747)
- Color Picker (Lines 1752-1783)
- Line Width Control (Lines 1786-1798)
- Text Formatting Group (Lines 1804-1847)
- Actions Group - Undo/Redo/Clear (Lines 1850-1860)
- Slide Navigation (Lines 1866-1886)
- Slide Management (Lines 1892-1905)
- Share Button (Lines 1912-1925)

**Dependencies**:
- State: `tool`, `color`, `lineWidth`, `expandedGroup`, `textBold`, `textItalic`, `textUnderline`, `fontSize`, `currentSlide`, `slides`, `historyStep`, `history`, `isCollaborative`, `isHost`
- Functions: `setTool`, `setColor`, `setLineWidth`, `setExpandedGroup`, `undo`, `redo`, `clearCanvas`, `goToSlide`, `addSlide`, `deleteSlide`, `handleLoadSessions`, `handleSaveSession`
- Refs: `toolbarRef`, `canvasRef`

**Priority**: HIGH
**Complexity**: HIGH
**Suggested Extraction**: Component `<Toolbar />` with hooks for state management

---

### B. Canvas Container (Lines 1568-1579)
**Location**: Lines 1568-1579
**Responsibility**: Canvas element with event handlers

**Dependencies**:
- Refs: `canvasRef`
- Functions: `startDrawing`, `draw`, `stopDrawing`
- Event Handlers: onMouseDown, onMouseMove, onMouseUp, onMouseLeave, onTouchStart, onTouchMove, onTouchEnd

**Priority**: MEDIUM
**Complexity**: LOW
**Suggested Extraction**: Component `<DrawingCanvas />`

---

### C. Text Input Overlay (Lines 1931-1952)
**Location**: Lines 1931-1952
**Responsibility**: Text input overlay for adding text to canvas

**Dependencies**:
- State: `textInput`, `textInputRef`
- Functions: `handleTextKeyDown`

**Priority**: MEDIUM
**Complexity**: LOW
**Suggested Extraction**: Component `<TextInputOverlay />`

---

### D. Sticky Notes Component (Lines 1955-2142)
**Location**: Lines 1955-2142
**Responsibility**: Rendering and interaction for sticky notes

**Features**:
- Render multiple sticky notes
- Click to select
- Double-click to edit
- Drag to move
- Resize with handles
- Delete button
- Font size controls
- Display other user selections (collaborative)

**Dependencies**:
- State: `objects`, `selectedObject`, `editingObject`, `isDraggingObject`, `tool`, `activeSelections`, `currentSlide`
- Functions: `setSelectedObject`, `setEditingObject`, `setObjects`, `updateObjectInActiveSession`, `updateActiveSelection`
- External: Firebase functions, auth

**Priority**: HIGH
**Complexity**: VERY HIGH - Contains complex selection/dragging/editing logic
**Suggested Extraction**: Component `<StickyNotesList />` with sub-component `<StickyNote />`

---

### E. Text Boxes Component (Lines 2155-2344)
**Location**: Lines 2155-2344
**Responsibility**: Similar to sticky notes but for text boxes

**Priority**: HIGH
**Complexity**: VERY HIGH - Duplicate logic of Sticky Notes
**Suggested Extraction**: Component `<TextBoxList />` with sub-component `<TextBox />` (can share base logic with StickyNote)

---

### F. Save Session Modal (Lines 2349-2373)
**Location**: Lines 2349-2373
**Responsibility**: Modal for saving current session with title input

**Dependencies**:
- State: `showSaveModal`, `sessionTitle`, `slides`, `objects`, `strokes`
- Functions: `setShowSaveModal`, `setSessionTitle`, `handleSaveSession`

**Priority**: MEDIUM
**Complexity**: LOW
**Suggested Extraction**: Component `<SaveSessionModal />`

---

### G. Load Sessions Modal (Lines 2374-2407)
**Location**: Lines 2374-2407
**Responsibility**: Modal for loading previously saved sessions

**Dependencies**:
- State: `showLoadModal`, `savedSessions`, `isLoadingSessions`
- Functions: `setShowLoadModal`, `handleLoadSessions`, `loadSession`

**Priority**: MEDIUM
**Complexity**: MEDIUM
**Suggested Extraction**: Component `<LoadSessionsModal />`

---

### H. Share Content Modal (Lines 2410-2468)
**Location**: Lines 2410-2468
**Responsibility**: Modal for sharing video/PDF/image content in collaborative sessions

**Dependencies**:
- State: `showShareModal`, `shareContentUrl`, `shareContentType`
- Functions: `setShowShareModal`, `setShareContentUrl`, `setShareContentType`, `handleShareContent`

**Priority**: MEDIUM
**Complexity**: MEDIUM
**Suggested Extraction**: Component `<ShareContentModal />`

---

### I. Shared Content Viewer (Lines 2470-2478)
**Location**: Lines 2470-2478
**Responsibility**: Displays shared content for collaborative sessions

**Dependencies**:
- Component: `<SharedContentViewer />`
- State: `isCollaborative`, `sharedContent`, `collaborativeSessionId`, `isHost`
- Functions: `clearSharedContent`

**Priority**: MEDIUM
**Complexity**: LOW
**Suggested Extraction**: Already extracted - Component `<SharedContentViewer />`

---

### J. Back Button (Lines 1561-1564)
**Location**: Lines 1561-1564
**Responsibility**: Floating back button

**Priority**: LOW
**Complexity**: VERY LOW
**Suggested Extraction**: Component `<BackButton />`

---

## 3. UTILITY FUNCTIONS

### Drawing Functions

#### `drawSmoothStroke(points, ctx)` - Line 499
- **Purpose**: Draw smooth strokes using perfect-freehand library
- **Complexity**: MEDIUM
- **Dependencies**: `getStroke` (perfect-freehand)
- **Extraction Strategy**: Move to `utils/drawingUtils.js`
- **Size**: ~50 lines

#### `drawNewStrokesOnCanvas(strokes)` - Line 555
- **Purpose**: Draw multiple strokes on canvas
- **Complexity**: MEDIUM
- **Dependencies**: `canvasRef`, `drawSingleStroke`
- **Extraction Strategy**: Move to `hooks/useCanvasDrawing.js`
- **Size**: ~15 lines

#### `drawSingleStroke(stroke, ctx)` - Line 573
- **Purpose**: Draw a single stroke (line, arrow, rectangle, circle) on canvas
- **Complexity**: HIGH
- **Dependencies**: `getStroke` (perfect-freehand), stroke properties
- **Extraction Strategy**: Move to `utils/drawingUtils.js` (separate by stroke type)
- **Size**: ~70 lines

---

### Canvas Management Functions

#### `resizeCanvas()` - Line 658 (inside useEffect)
- **Purpose**: Resize canvas to window size and redraw
- **Complexity**: MEDIUM
- **Extraction Strategy**: Move to `hooks/useCanvasResize.js`
- **Size**: ~35 lines

#### `getPosition(e)` - Line 779
- **Purpose**: Convert mouse event coordinates to canvas coordinates with scaling
- **Complexity**: LOW
- **Dependencies**: `canvasRef`
- **Extraction Strategy**: Move to `utils/positionUtils.js`
- **Size**: ~15 lines

---

### History Management Functions

#### `saveToHistory()` - Line 740
- **Purpose**: Save current canvas state to undo history
- **Complexity**: LOW
- **Dependencies**: `canvasRef`, `history`, `historyStep`
- **Extraction Strategy**: Move to `hooks/useHistoryManagement.js`
- **Size**: ~10 lines

#### `undo()` - Line 749
- **Purpose**: Undo last action
- **Complexity**: MEDIUM
- **Dependencies**: `history`, `historyStep`, `canvasRef`
- **Extraction Strategy**: Move to `hooks/useHistoryManagement.js`
- **Size**: ~15 lines

#### `redo()` - Line 764
- **Purpose**: Redo last undone action
- **Complexity**: MEDIUM
- **Dependencies**: `history`, `historyStep`, `canvasRef`
- **Extraction Strategy**: Move to `hooks/useHistoryManagement.js`
- **Size**: ~15 lines

---

### Text Functions

#### `applyText(force)` - Line 1130
- **Purpose**: Apply text input to canvas with formatting
- **Complexity**: MEDIUM
- **Dependencies**: `textInput`, `fontSize`, `textBold`, `textItalic`, `textUnderline`, `color`, `canvasRef`
- **Extraction Strategy**: Move to `utils/textUtils.js`
- **Size**: ~30 lines

#### `handleTextKeyDown(e)` - Line 1166
- **Purpose**: Handle keyboard input in text input overlay
- **Complexity**: LOW
- **Dependencies**: `applyText`
- **Extraction Strategy**: Move to `utils/textUtils.js` or keep in component
- **Size**: ~10 lines

---

### Slide Management Functions

#### `saveCurrentSlide()` - Line 1364
- **Purpose**: Save current slide state before switching
- **Complexity**: LOW
- **Dependencies**: `slides`, `currentSlide`, `canvasRef`
- **Extraction Strategy**: Move to `hooks/useSlideManagement.js`
- **Size**: ~5 lines

#### `addSlide()` - Line 1374
- **Purpose**: Add new blank slide
- **Complexity**: LOW
- **Dependencies**: `slides`, `setSlides`
- **Extraction Strategy**: Move to `hooks/useSlideManagement.js`
- **Size**: ~10 lines

#### `deleteSlide()` - Line 1383
- **Purpose**: Delete current slide (if more than 1)
- **Complexity**: LOW
- **Dependencies**: `slides`, `currentSlide`
- **Extraction Strategy**: Move to `hooks/useSlideManagement.js`
- **Size**: ~10 lines

#### `goToSlide(index)` - Line 1391
- **Purpose**: Navigate to specific slide
- **Complexity**: MEDIUM
- **Dependencies**: `saveCurrentSlide`, `setCurrentSlide`, `canvasRef`, `slides`
- **Extraction Strategy**: Move to `hooks/useSlideManagement.js`
- **Size**: ~10 lines

---

### File Management Functions

#### `downloadPresentation()` - Line 1399
- **Purpose**: Download presentation as JSON file
- **Complexity**: MEDIUM
- **Dependencies**: `slides`, `objects`, `strokes`, `sessionTitle`
- **Extraction Strategy**: Move to `utils/fileUtils.js`
- **Size**: ~12 lines

#### `loadPresentation(e)` - Line 1411
- **Purpose**: Load presentation from JSON file
- **Complexity**: MEDIUM
- **Dependencies**: `slides`, `objects`, `strokes`
- **Extraction Strategy**: Move to `utils/fileUtils.js`
- **Size**: ~95 lines

---

### Collaborative/Session Functions

#### `handleSaveSession()` - Line 1429
- **Purpose**: Save session to Firebase
- **Complexity**: MEDIUM
- **Dependencies**: Firebase functions, state variables
- **Extraction Strategy**: Move to `hooks/useSessionManagement.js`
- **Size**: ~55 lines

#### `handleLoadSessions()` - Line 1484
- **Purpose**: Load saved sessions from Firebase
- **Complexity**: LOW
- **Dependencies**: Firebase functions
- **Extraction Strategy**: Move to `hooks/useSessionManagement.js`
- **Size**: ~30 lines

#### `handleShareContent()` - Line 1513
- **Purpose**: Share content in collaborative session
- **Complexity**: MEDIUM
- **Dependencies**: Firebase functions, state variables
- **Extraction Strategy**: Move to `hooks/useCollaborativeMode.js`
- **Size**: ~30 lines

#### `loadSession(session)` - Line 1504
- **Purpose**: Load a previously saved session
- **Complexity**: LOW
- **Dependencies**: Firebase functions, state variables
- **Extraction Strategy**: Move to `hooks/useSessionManagement.js`
- **Size**: ~45 lines

#### `handleNewSession()` - Line 1546
- **Purpose**: Create new blank session
- **Complexity**: LOW
- **Dependencies**: State variables
- **Extraction Strategy**: Move to `hooks/useSessionManagement.js`
- **Size**: ~12 lines

#### `clearCanvas()` - Line 1177
- **Purpose**: Clear current slide
- **Complexity**: LOW
- **Dependencies**: Firebase functions, `canvasRef`
- **Extraction Strategy**: Move to `hooks/useCanvasManagement.js`
- **Size**: ~20 lines

---

## 4. EVENT HANDLERS

### Mouse/Touch Drawing Handlers

#### `startDrawing(e)` - Line 798
- **Type**: Canvas onMouseDown/onTouchStart
- **Complexity**: HIGH
- **Responsibility**: Initialize drawing, detect stroke type, handle object/sticky note creation
- **Extraction Strategy**: Keep with drawing logic, move to custom hook
- **Size**: ~130 lines

#### `draw(e)` - Line 930
- **Type**: Canvas onMouseMove/onTouchMove
- **Complexity**: VERY HIGH
- **Responsibility**: Handle real-time drawing, object dragging, toolbar dragging, text cursor positioning
- **Extraction Strategy**: Split into multiple handlers, move to custom hook
- **Size**: ~230 lines

#### `stopDrawing(e)` - Line 962
- **Type**: Canvas onMouseUp/onTouchEnd
- **Complexity**: HIGH
- **Responsibility**: Finalize stroke, sync to Firebase
- **Extraction Strategy**: Move to custom hook
- **Size**: ~170 lines

---

### Toolbar Drag Handlers

#### `handleToolbarMouseDown(e)` - Line 1197
- **Type**: Toolbar onMouseDown
- **Complexity**: MEDIUM
- **Responsibility**: Initialize toolbar dragging
- **Extraction Strategy**: Move to custom hook with other toolbar handlers
- **Size**: ~15 lines

#### `handleToolbarMouseMove(e)` - Line 1210
- **Type**: Global onMouseMove (when dragging toolbar)
- **Complexity**: MEDIUM
- **Responsibility**: Calculate new toolbar position, detect vertical orientation
- **Extraction Strategy**: Move to custom hook
- **Size**: ~85 lines

#### `handleToolbarMouseUp(e)` - Line 1293
- **Type**: Global onMouseUp (when dragging toolbar)
- **Complexity**: MEDIUM
- **Responsibility**: Finalize toolbar drag, save position
- **Extraction Strategy**: Move to custom hook
- **Size**: ~60 lines

---

### Text Input Handlers

#### `handleTextKeyDown(e)` - Line 1166
- **Type**: Text input onKeyDown
- **Complexity**: LOW
- **Responsibility**: Handle Enter and Escape keys in text input
- **Extraction Strategy**: Keep with text utilities
- **Size**: ~10 lines

---

### Mouse Move Handler (inside useEffect) - Line 258
- **Type**: Global onMouseMove (for object dragging/resizing)
- **Complexity**: VERY HIGH
- **Responsibility**: Handle object dragging, stroke dragging, resizing
- **Extraction Strategy**: Extract to `useObjectInteraction` hook
- **Size**: ~95 lines

### Mouse Up Handler (inside useEffect) - Line 352
- **Type**: Global onMouseUp (for object dragging/resizing)
- **Complexity**: MEDIUM
- **Responsibility**: Finalize object operations, save to Firebase
- **Extraction Strategy**: Extract to `useObjectInteraction` hook
- **Size**: ~40 lines

---

## 5. EFFECT HOOKS

### Collaborative Session Effect (Line 144)
- **Dependencies**: `isCollaborative`, `collaborativeSessionId`
- **Size**: ~100 lines
- **Purpose**: Join collaborative session, subscribe to updates
- **Extraction Strategy**: Move to `useCollaborativeMode` hook
- **Complexity**: HIGH

### Mouse Movement Effect (Line 257)
- **Dependencies**: `isDraggingToolbar`, `isDraggingObject`, `isResizing`, `selectedStroke`, etc.
- **Size**: ~135 lines
- **Purpose**: Handle global mouse move for dragging/resizing
- **Extraction Strategy**: Extract to `useObjectInteraction` hook
- **Complexity**: VERY HIGH

### Canvas Rendering Effect (Line 389)
- **Dependencies**: `strokes`, `objects`, `selectedStroke`, `selectedObject`
- **Size**: ~95 lines
- **Purpose**: Redraw canvas when strokes/objects change
- **Extraction Strategy**: Move to `useCanvasRenderer` hook
- **Complexity**: HIGH

### Canvas Initialization Effect (Line 651)
- **Dependencies**: none
- **Size**: ~80 lines
- **Purpose**: Initialize canvas on mount, handle window resize
- **Extraction Strategy**: Move to `useCanvasSetup` hook
- **Complexity**: MEDIUM

### Slide Change Effect (Line 1352)
- **Dependencies**: `currentSlide`, `slides`
- **Size**: ~15 lines
- **Purpose**: Handle slide transitions
- **Extraction Strategy**: Move to `useSlideManagement` hook
- **Complexity**: LOW

---

## 6. DEPENDENCIES (External)

### Imports
- React hooks: `useState`, `useRef`, `useEffect`
- Icons: lucide-react (37 icons)
- Drawing: `perfect-freehand` (getStroke)
- Firebase: Multiple whiteboard-related functions
- Firebase Auth: `auth` object
- Components: `BaseButton`, `SharedContentViewer`
- Utils: `logger`
- Styles: Various CSS files

### Firebase Functions Called
- `createWhiteboardSession`
- `updateWhiteboardSession`
- `getUserWhiteboardSessions`
- `createActiveWhiteboardSession`
- `joinActiveWhiteboardSession`
- `leaveActiveWhiteboardSession`
- `subscribeToActiveWhiteboardSession`
- `addStrokeToActiveSession`
- `clearSlideInActiveSession`
- `shareContentInSession`
- `clearSharedContent`
- `addObjectToActiveSession`
- `updateObjectInActiveSession`
- `deleteObjectFromActiveSession`
- `updateActiveSelection`

---

## 7. REFACTORING ROADMAP

### Phase 1: Extract State Management (CRITICAL)
**Priority**: HIGH
**Estimated Lines to Extract**: 60+ state variables

1. **Create `hooks/useDrawingState.ts`**
   - Extract: `isDrawing`, `tool`, `color`, `lineWidth`, `startPos`, `currentPoints`, `tempCanvas`
   - Size: ~50 lines
   - Time: 30 mins

2. **Create `hooks/useTextState.ts`**
   - Extract: Text-related states (`textInput`, `textBold`, `textItalic`, `textUnderline`, `fontSize`)
   - Size: ~20 lines
   - Time: 15 mins

3. **Create `hooks/useObjectState.ts`**
   - Extract: Object/selection states (`objects`, `selectedObject`, `editingObject`, etc.)
   - Size: ~25 lines
   - Time: 20 mins

4. **Create `hooks/useToolbarState.ts`**
   - Extract: Toolbar states (`toolbarPos`, `isDraggingToolbar`, `isVertical`, `expandedGroup`, etc.)
   - Size: ~20 lines
   - Time: 20 mins

5. **Create `hooks/useCollaborativeState.ts`**
   - Extract: Collaborative states (`participants`, `isConnected`, `sharedContent`, `isHost`, etc.)
   - Size: ~25 lines
   - Time: 20 mins

6. **Create `hooks/useHistoryState.ts`**
   - Extract: History states (`history`, `historyStep`)
   - Size: ~10 lines
   - Time: 10 mins

**Phase 1 Total Time**: ~2 hours
**Reduction**: 150+ lines from main component

---

### Phase 2: Extract Utility Functions (HIGH)
**Priority**: HIGH
**Estimated Lines to Extract**: 300+

1. **Create `utils/drawingUtils.ts`**
   - Extract: `drawSmoothStroke`, `drawSingleStroke`, `drawNewStrokesOnCanvas`
   - Size: ~180 lines
   - Time: 45 mins

2. **Create `utils/positionUtils.ts`**
   - Extract: `getPosition` and related position calculations
   - Size: ~30 lines
   - Time: 15 mins

3. **Create `utils/textUtils.ts`**
   - Extract: `applyText`, text rendering logic
   - Size: ~50 lines
   - Time: 20 mins

4. **Create `utils/fileUtils.ts`**
   - Extract: `downloadPresentation`, `loadPresentation`
   - Size: ~110 lines
   - Time: 30 mins

**Phase 2 Total Time**: ~2 hours
**Reduction**: 300+ lines from main component

---

### Phase 3: Extract Hooks for Business Logic (HIGH)
**Priority**: HIGH
**Estimated Lines to Extract**: 400+

1. **Create `hooks/useCanvasSetup.ts`**
   - Extract: Canvas initialization and resize logic (Line 651+)
   - Size: ~80 lines
   - Time: 30 mins

2. **Create `hooks/useCanvasRenderer.ts`**
   - Extract: Canvas rendering logic (Line 389+)
   - Size: ~100 lines
   - Time: 40 mins

3. **Create `hooks/useHistoryManagement.ts`**
   - Extract: `saveToHistory`, `undo`, `redo`
   - Size: ~40 lines
   - Time: 20 mins

4. **Create `hooks/useSlideManagement.ts`**
   - Extract: Slide management functions and logic
   - Size: ~50 lines
   - Time: 25 mins

5. **Create `hooks/useSessionManagement.ts`**
   - Extract: Session save/load logic
   - Size: ~110 lines
   - Time: 45 mins

6. **Create `hooks/useCollaborativeMode.ts`**
   - Extract: Collaborative session logic
   - Size: ~120 lines
   - Time: 50 mins

**Phase 3 Total Time**: ~3 hours 10 mins
**Reduction**: 400+ lines from main component

---

### Phase 4: Extract React Components (HIGH)
**Priority**: HIGH
**Estimated Components**: 12+

1. **Create `components/Toolbar.jsx`** (Lines 1582-1926)
   - Size: ~350 lines (with styling)
   - Time: 1.5 hours
   - Depends on: 15+ state variables and functions

2. **Create `components/DrawingCanvas.jsx`** (Lines 1568-1579)
   - Size: ~30 lines
   - Time: 15 mins

3. **Create `components/TextInputOverlay.jsx`** (Lines 1931-1952)
   - Size: ~30 lines
   - Time: 15 mins

4. **Create `components/StickyNotesList.jsx`** (Lines 1955-2142)
   - Size: ~200 lines
   - Time: 1 hour
   - Contains sub-component `StickyNote.jsx`

5. **Create `components/TextBoxList.jsx`** (Lines 2155-2344)
   - Size: ~200 lines
   - Time: 1 hour
   - Can reuse logic from StickyNote (refactor to ObjectItem base)

6. **Create `components/SaveSessionModal.jsx`** (Lines 2349-2373)
   - Size: ~30 lines
   - Time: 15 mins

7. **Create `components/LoadSessionsModal.jsx`** (Lines 2374-2407)
   - Size: ~40 lines
   - Time: 20 mins

8. **Create `components/ShareContentModal.jsx`** (Lines 2410-2468)
   - Size: ~65 lines
   - Time: 25 mins

9. **Create `components/BackButton.jsx`** (Lines 1561-1564)
   - Size: ~15 lines
   - Time: 10 mins

**Phase 4 Total Time**: ~5 hours 30 mins
**New Component Count**: 10+
**Reduction**: 600+ lines from main component

---

### Phase 5: Extract Event Handlers (MEDIUM)
**Priority**: MEDIUM
**Estimated Lines to Extract**: 400+

1. **Create `hooks/useDrawingHandlers.ts`**
   - Extract: `startDrawing`, `draw`, `stopDrawing`
   - Size: ~300 lines
   - Time: 1.5 hours
   - Depends on: Drawing utilities and state

2. **Create `hooks/useToolbarHandlers.ts`**
   - Extract: Toolbar drag handlers
   - Size: ~60 lines
   - Time: 30 mins

3. **Create `hooks/useObjectInteraction.ts`**
   - Extract: Object selection, dragging, resizing logic
   - Size: ~135 lines
   - Time: 1 hour

**Phase 5 Total Time**: ~3 hours
**Reduction**: 400+ lines from main component

---

### Final Result After Refactoring
- **Original**: 2,484 lines in single component
- **After Refactoring**: ~200-300 lines in main component
- **New Files Created**: 20+ (hooks, utilities, components)
- **Total Reduction**: 85-90% of main component lines
- **Estimated Total Time**: 15-18 hours

---

## 8. DEPENDENCY GRAPH

```
Whiteboard.jsx (main component)
│
├── State Hooks
│   ├── useDrawingState
│   ├── useTextState
│   ├── useObjectState
│   ├── useToolbarState
│   ├── useCollaborativeState
│   └── useHistoryState
│
├── Business Logic Hooks
│   ├── useCanvasSetup → drawingUtils
│   ├── useCanvasRenderer → drawingUtils, positionUtils
│   ├── useHistoryManagement → canvasRef
│   ├── useSlideManagement → canvasRef
│   ├── useSessionManagement → Firebase
│   ├── useCollaborativeMode → Firebase
│   ├── useDrawingHandlers → drawingUtils, Firebase
│   ├── useToolbarHandlers
│   └── useObjectInteraction → Firebase
│
├── UI Components
│   ├── Toolbar
│   ├── DrawingCanvas
│   ├── TextInputOverlay
│   ├── StickyNotesList → StickyNote (sub)
│   ├── TextBoxList → TextBox (sub)
│   ├── SaveSessionModal
│   ├── LoadSessionsModal
│   ├── ShareContentModal
│   ├── BackButton
│   └── SharedContentViewer (existing)
│
├── Utilities
│   ├── drawingUtils → perfect-freehand
│   ├── positionUtils
│   ├── textUtils
│   ├── fileUtils
│   └── constants (presetColors)
│
└── External Dependencies
    ├── Firebase (whiteboard, auth)
    ├── React (hooks, components)
    ├── lucide-react (icons)
    ├── perfect-freehand (stroke drawing)
    └── logger (debugging)
```

---

## 9. COMPLEXITY ASSESSMENT

### By Category
- **State Management**: 40% complexity
- **Drawing Logic**: 35% complexity
- **Event Handling**: 15% complexity
- **UI Rendering**: 10% complexity

### Critical Components to Extract First
1. State management (enables parallel work)
2. Drawing utilities (core functionality)
3. Business logic hooks (complex interactions)
4. UI components (highest lines of code)
5. Event handlers (simplifies when hooks extracted)

### Risk Areas
- Collaborative real-time sync (complex state updates)
- Object selection/dragging (multiple state dependencies)
- History management (tightly coupled to canvas state)
- Drawing on canvas (browser API complexities)

---

## 10. SUGGESTED EXTRACTION PRIORITIES

### CRITICAL (Do First)
1. ✅ Extract all state into custom hooks (30% reduction)
2. ✅ Extract drawing utilities (improves reusability)
3. ✅ Extract Toolbar component (350+ lines)

### HIGH (Do Next)
4. ✅ Extract object interaction hooks (enables collaborative features)
5. ✅ Extract session management
6. ✅ Extract StickyNote/TextBox components

### MEDIUM (Do After)
7. Extract modal components
8. Extract event handlers into hooks
9. Extract collaborative mode logic

### LOW (Nice to Have)
10. Extract smaller utilities
11. Create shared base component for StickyNote/TextBox
12. Optimize rendering with useMemo

---

## 11. TESTING STRATEGY POST-REFACTORING

### Unit Tests
- Test drawing utilities independently
- Test position calculations
- Test history management
- Test file I/O operations

### Hook Tests
- Test each custom hook in isolation
- Verify state updates propagate correctly
- Test collaborative sync logic

### Integration Tests
- Test component interactions
- Test drawing + object selection together
- Test save/load cycles

### E2E Tests
- Test full drawing workflow
- Test collaborative session creation/joining
- Test presentation save/load

---

## 12. MIGRATION STRATEGY

### Step 1: Setup Infrastructure
- Create new directories: `hooks/`, `utils/`, update `components/`
- Create index files for barrel exports
- Setup TypeScript (if needed)

### Step 2: Extract Non-UI Logic First
- Extract utilities (drawingUtils, positionUtils, etc.)
- Extract state hooks
- Extract business logic hooks
- Minimal component changes

### Step 3: Extract UI Components
- Extract modals (easier, fewer dependencies)
- Extract toolbar
- Extract object renderers (StickyNote, TextBox)

### Step 4: Cleanup & Optimization
- Remove duplicate code
- Add proper TypeScript types
- Add unit tests
- Update documentation

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total Lines | 2,484 |
| State Variables | 60+ |
| useEffect Hooks | 5 |
| Event Handlers | 10+ |
| Functions | 15+ |
| Components to Extract | 10+ |
| Hooks to Create | 12+ |
| Utilities to Extract | 8 |
| Estimated Reduction | 85-90% |
| Estimated Time | 15-18 hours |
| Complexity Level | VERY HIGH |
| Refactoring Priority | CRITICAL |

