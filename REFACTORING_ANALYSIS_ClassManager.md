# ClassManager Component - Detailed Refactoring Analysis

## Overview
The ClassManager.jsx component manages class creation, editing, viewing, and assignment of groups/students/content. It currently uses custom modal and card implementations that should be refactored to use the Design System 3.0 components.

---

## 1. JSX STRUCTURE - MAIN SECTIONS

### 1.1 Main Layout (lines 567-1589)
```
<div className="class-manager">
  ├── Back button (BaseButton)
  ├── PageHeader (header with title + action button)
  ├── SearchBar (with view mode toggle)
  ├── Message display (.cm-message)
  ├── Empty state OR
  │   ├── Grid View (3 card types) OR
  │   └── List View (2 card types)
  └── 3 Modals
```

### 1.2 Card Types Rendered

#### A. Grid View Cards (lines 610-678)
```jsx
<div className="class-card card card-grid-item">
  ├── Image section
  │   ├── cls.imageUrl ? <img> : <Calendar icon placeholder>
  ├── Content section (padding: 12px)
  │   ├── Card header
  │   │   ├── h3.card-title {cls.name}
  │   │   └── span.badge.badge-primary {cls.courseName}
  │   ├── p.card-description {cls.description}
  │   ├── .class-schedules
  │   │   ├── "Horarios:" label
  │   │   └── .schedule-list (map schedules)
  │   │       └── .schedule-item (day + time)
  │   └── .card-stats
  │       ├── <CreditCard> + cost
  │       └── <Users> + count
```

#### B. List View Cards (lines 679-752)
```jsx
<div className="card card-list">
  ├── .card-image-placeholder-sm (small image on left)
  ├── .flex-1 content section
  │   ├── Title + description
  │   ├── .badge.badge-primary {courseName}
  │   ├── Schedules flex layout
  │   └── Stats (credits + assigned count)
```

---

## 2. ALL MODALS - COMPLETE INVENTORY

### MODAL #1: Create/Edit Class Modal (lines 756-959)
**Type:** Custom modal-overlay + modal-box  
**State:** `showModal`  
**Trigger:** `handleCreateClass()` or `handleEditClass(classData)`

#### Structure:
```
.modal-overlay
└── .modal-box
    ├── .modal-header (FIXED)
    │   ├── h3.modal-title "Nueva Clase" | "Editar Clase"
    │   └── button.modal-close-btn [X]
    ├── .modal-tabs-container (FIXED)
    │   └── .modal-tabs
    │       └── button "Información" (single tab, no switching)
    ├── .flex-1.overflow-y-auto (SCROLLABLE BODY)
    │   └── .space-y-4
    │       ├── FORM GROUP: Nombre input
    │       ├── FORM GROUP: Fecha de Inicio date
    │       ├── FORM GROUP: Descripción textarea
    │       ├── FORM ROW (2 col):
    │       │   ├── FORM GROUP: Curso select
    │       │   └── FORM GROUP: Costo en Créditos number
    │       ├── FORM GROUP: Link de Videollamada URL
    │       └── .schedules-section
    │           ├── h4 "Horarios de la Clase"
    │           ├── .added-schedules (if any)
    │           │   └── .schedule-chip (map)
    │           │       ├── span {day} {times}
    │           │       └── button.btn-remove [×]
    │           └── .space-y-3
    │               ├── Days selection (7 checkboxes)
    │               ├── Time inputs (start/end)
    │               ├── BaseButton "Agregar Horario"
    │               └── Hint text
    └── .modal-footer (FIXED)
        ├── BaseButton variant="outline" "Cancelar"
        └── BaseButton variant="primary" "Crear/Guardar Clase"
```

**Key Form Fields:**
- `formData.name` - required
- `formData.startDate` - required
- `formData.description`
- `formData.courseId`
- `formData.creditCost` (1-10)
- `formData.meetingLink` (URL)
- `formData.schedules[]` - required, at least 1

**Key Schedule Fields:**
- `scheduleForm.daysOfWeek[]` - required
- `scheduleForm.startTime` - required
- `scheduleForm.endTime` - required
- `scheduleForm.weeksToGenerate`
- `scheduleForm.autoRenew` (unused in this modal)

---

### MODAL #2: Class Details/Configuration Modal (lines 961-1569)
**Type:** Custom modal-overlay + modal-box with IIFE  
**State:** `showDetailsModal`  
**Trigger:** `handleViewDetails(classData)`

#### Structure:
```
.modal-overlay
└── .modal-box
    ├── .modal-header (FIXED)
    │   ├── h3.modal-title {selectedClass.name}
    │   └── button.modal-close-btn [X]
    ├── .cm-message (conditional)
    ├── .modal-tabs-container (FIXED)
    │   └── .modal-tabs (5 tabs with manual styling)
    │       ├── button "General" (icon: FileText)
    │       ├── button "Horarios" (icon: Calendar)
    │       ├── button "Curso" (icon: BookOpen)
    │       ├── button "Estudiantes" (icon: Users)
    │       └── button "Contenidos" (icon: ClipboardList) [INCOMPLETE]
    ├── .flex-1.overflow-y-auto (SCROLLABLE BODY)
    │   └── TAB CONTENT (only one visible at a time)
    │       ├── TAB: GENERAL (1083-1192)
    │       │   ├── FORM: Nombre input
    │       │   ├── FORM: Fecha de Inicio date
    │       │   ├── FORM: Descripción textarea
    │       │   ├── FORM ROW (2 col):
    │       │   │   ├── Costo en Créditos input
    │       │   │   └── Link de Videollamada input
    │       │   └── FORM: Imagen
    │       │       ├── If imageUrl: img preview + delete button
    │       │       └── Else: file input + hints
    │       ├── TAB: HORARIOS (1195-1381)
    │       │   ├── Section: Horarios Configurados
    │       │   │   ├── Display schedules (map)
    │       │   │   │   └── .flex.items-center.justify-between
    │       │   │   │       ├── span {day} {times}
    │       │   │   │       └── BaseButton variant="danger" "Eliminar"
    │       │   │   └── Hint: "weeksToGenerate renews when <3 instances left"
    │       │   └── Section: Agregar Horario
    │       │       ├── Days selection (7 buttons in grid)
    │       │       ├── Time inputs (hour:minute selects)
    │       │       ├── Weeks to generate select (4,8,12,16)
    │       │       ├── BaseButton "Agregar"
    │       │       └── Auto-renew checkbox
    │       ├── TAB: ASIGNACIONES (1384-1461) [Course Tab]
    │       │   ├── Section: Curso Asociado
    │       │   │   ├── If courseId assigned:
    │       │   │   │   ├── Display: course name
    │       │   │   │   └── BaseButton variant="danger" "Eliminar"
    │       │   │   └── Else: "No hay curso asociado"
    │       │   └── Section: Asignar Curso
    │       │       ├── If already assigned: "Elimínalo para asignar otro"
    │       │       └── Else: select + button
    │       ├── TAB: ESTUDIANTES (1464-1536)
    │       │   ├── Section: Estudiantes Asignados
    │       │   │   ├── If none: message
    │       │   │   └── Else: list of students (map)
    │       │   │       └── .flex.items-center.justify-between
    │       │   │           ├── name + email
    │       │   │           └── BaseButton variant="danger" "Eliminar"
    │       │   └── Section: Asignar Estudiante
    │       │       ├── If all assigned: message
    │       │       └── Else: select dropdown + button
    │       └── TAB: CONTENIDOS (1062 button only, NO CONTENT)
    │           └── [INCOMPLETE - NEEDS IMPLEMENTATION]
    └── .modal-footer (FIXED)
        ├── BaseButton variant="danger" icon=Trash2 "Eliminar"
        ├── BaseButton variant="outline" "Cancelar"
        └── BaseButton variant="primary" icon=Save "Guardar Cambios"
```

**Tab Switching:** Manual via `setDetailsTab()` - each tab renders its own content

---

### MODAL #3: Delete Confirmation Modal (lines 1572-1585)
**Type:** ConfirmModal component  
**State:** `showConfirmDelete`  
**Trigger:** Delete button in Details Modal footer

#### Props:
```jsx
<ConfirmModal
  isOpen={showConfirmDelete}
  title="Eliminar Clase"
  message={`¿Estás seguro...?\n\nEsta acción eliminará...\n\nNo se puede deshacer.`}
  confirmText="Eliminar"
  cancelText="Cancelar"
  isDanger={true}
  onConfirm={() => { handleDeleteClass(...) }}
  onCancel={() => { setShowConfirmDelete(false) }}
/>
```

---

## 3. CSS CLASSES MAPPING

### Critical Classes to Replace

| Component | Current CSS Classes | Refactor To |
|-----------|-------------------|------------|
| **Containers** | `.class-manager` | `<DashboardContainer>` |
| | `.manager-header` | `<SectionHeader>` |
| **Cards** | `.class-card.card` (grid/list) | `<BaseCard>` |
| | `.class-card-header` | Built-in `<BaseCard>` header |
| | `.card-title`, `.card-description`, `.card-stats` | `<BaseCard>` content |
| | `.badge.badge-primary` | `<SemanticBadge variant="primary">` |
| **Modals** | `.modal-overlay`, `.modal-box` | `<BaseModal>` |
| | `.modal-header`, `.modal-title`, `.modal-close-btn` | Built-in `<BaseModal>` |
| | `.modal-tabs-container`, `.modal-tabs`, `.tab-btn` | `<BaseModal>` with tabs prop |
| | `.modal-footer` | Built-in `<BaseModal>` footer |
| **Forms** | `.form-group`, `.form-label`, `.form-row` | Wrapper divs only |
| | `.input`, `.select` | `<BaseInput>`, `<BaseSelect>` |
| | Button classes | `<BaseButton variant="...">` |
| | `.schedule-chip`, `.added-schedules` | Custom or `<BaseCard>` small |

### Secondary Classes to Review
- `.card-image-large`, `.card-image-placeholder-sm` → Image handling in BaseCard
- `.class-schedules`, `.schedule-list` → Custom content structure
- `.cm-message` → Custom or Toast component
- `.schedule-item`, `.schedule-day` → Part of schedule chips

---

## 4. STATE VARIABLES & PURPOSES

### Data States
| Variable | Type | Purpose |
|----------|------|---------|
| `classes` | `Class[]` | List of all classes (filtered by teacher or all if admin) |
| `groups` | `Group[]` | All available groups for assignment |
| `students` | `User[]` | All students filtered by role |
| `contents` | `Content[]` | All content for assignment |
| `instances` | `Instance[]` | Upcoming class instances (100 max) |
| `classInstances` | `Instance[]` | Instances for currently selected class |

### UI States
| Variable | Type | Purpose |
|----------|------|---------|
| `loading` | `boolean` | Initial data loading |
| `showModal` | `boolean` | Show create/edit modal |
| `showDetailsModal` | `boolean` | Show details/config modal |
| `showConfirmDelete` | `boolean` | Show delete confirm |
| `activeTab` | `'list'\|'calendar'` | Main view mode |
| `detailsTab` | `'general'\|'horarios'\|'asignaciones'\|'estudiantes'\|'contenidos'` | Details modal tab |
| `searchTerm` | `string` | Search filter |
| `viewMode` | `'grid'\|'list'` | Class display mode |
| `message` | `{type: 'success'\|'error', text: string}` | Notification |

### Calendar States
| Variable | Type | Purpose |
|----------|------|---------|
| `weekOffset` | `number` | Week navigation offset |
| `showWeekends` | `boolean` | Toggle weekend display |

### Form States
| Variable | Type | Purpose |
|----------|------|---------|
| `formData` | `{name, description, courseId, creditCost, meetingLink, imageUrl, schedules[], startDate}` | Main class form |
| `scheduleForm` | `{daysOfWeek[], startTime, endTime, weeksToGenerate, autoRenew, autoRenewWeeks}` | Schedule input form |
| `editingClass` | `Class\|null` | Currently editing class (null = create mode) |
| `selectedClass` | `Class\|null` | Currently viewing class in details modal |
| `uploadingImage` | `boolean` | Image upload state |

---

## 5. MAIN FUNCTIONS/HANDLERS

### Class CRUD Operations
| Function | Parameters | Purpose |
|----------|-----------|---------|
| `handleCreateClass()` | - | Initialize new class creation modal |
| `handleEditClass(classData)` | `classData: Class` | Load class data into edit form |
| `handleSaveClass()` | - | Create or update class in DB |
| `handleDeleteClass(classId)` | `classId: string` | Delete class (after confirm) |
| `handleSaveClassChanges()` | - | Save changes to selected class |

### Schedule Management
| Function | Parameters | Purpose |
|----------|-----------|---------|
| `handleAddSchedule()` | - | Add schedule entry from form to formData.schedules |
| `handleRemoveSchedule(index)` | `index: number` | Remove schedule at index |
| `handleDayToggle(dayValue)` | `dayValue: 0-6` | Toggle day selection in scheduleForm |
| `updateTime(type, field, value)` | `type: 'startTime'\|'endTime', field: 'hour'\|'minute', value: string` | Update time field |

### Image Management
| Function | Parameters | Purpose |
|----------|-----------|---------|
| `handleImageUpload(e)` | `e: ChangeEvent<HTMLInputElement>` | Upload class image to Firebase |
| `handleImageDelete()` | - | Delete uploaded image |

### Assignment Operations
| Function | Parameters | Purpose |
|----------|-----------|---------|
| `handleAssignGroup(groupId)` | `groupId: string` | Assign group to class |
| `handleUnassignGroup(groupId)` | `groupId: string` | Remove group from class |
| `handleAssignStudent(studentId)` | `studentId: string` | Assign student to class |
| `handleUnassignStudent(studentId)` | `studentId: string` | Remove student from class |
| `handleAssignContent(contentId)` | `contentId: string` | Assign content to class |
| `handleUnassignContent(contentId)` | `contentId: string` | Remove content from class |

### Instance Management
| Function | Parameters | Purpose |
|----------|-----------|---------|
| `handleGenerateInstances(classId, customWeeks?)` | `classId: string, customWeeks?: number` | Generate class instances for weeks |
| `handleCancelInstance(instanceId)` | `instanceId: string` | Cancel a scheduled instance |

### View/Navigation
| Function | Parameters | Purpose |
|----------|-----------|---------|
| `handleViewDetails(classData)` | `classData: Class` | Open details modal, load instances |
| `loadData()` | - | Load all data from Firebase (classes, groups, students, instances, content) |
| `showMessage(type, text)` | `type: 'success'\|'error', text: string` | Show temporary notification |

### Helper Functions
| Function | Parameters | Purpose |
|----------|-----------|---------|
| `getMondayOfWeek(offset?)` | `offset?: number` | Get Monday date of week |
| `getWeekDays(offset?)` | `offset?: number` | Get all 7 days of week |

---

## 6. FORM FIELDS BREAKDOWN

### Create/Edit Class Modal Form
```
formData {
  name: string (required, label: "Nombre de la Clase *")
  startDate: string (required, ISO date, label: "Fecha de Inicio *")
  description: string (textarea, label: "Descripción")
  courseId: string (select, label: "Curso Asociado")
  creditCost: number (1-10, label: "Costo en Créditos")
  meetingLink: string (URL, label: "Link de Videollamada")
  schedules: Array of {day: 0-6, startTime: HH:mm, endTime: HH:mm}
}

scheduleForm {
  daysOfWeek: number[] (checkboxes, 7 options)
  startTime: string (time HH:mm)
  endTime: string (time HH:mm)
  weeksToGenerate: number (select: 4,8,12,16)
  autoRenew: boolean (checkbox, unused in current modal)
  autoRenewWeeks: number (unused in current modal)
}
```

### Class Details Modal - General Tab
```
Same formData + imageUrl
```

### Class Details Modal - Horarios Tab
```
scheduleForm {
  daysOfWeek: number[] (7 button toggles)
  startTime: string (hour/minute selects)
  endTime: string (hour/minute selects)
  weeksToGenerate: number (select)
  autoRenew: boolean (checkbox)
}
```

### Class Details Modal - Asignaciones Tab (Course)
```
Course assignment (single)
- Display: courseId with course name
- Action: Assign via dropdown OR Unassign via button
```

### Class Details Modal - Estudiantes Tab
```
Students assignment (multiple)
- Display: list of assigned students (name, email)
- Action: Unassign via button per student OR Assign new via dropdown
```

---

## 7. MISSING/INCOMPLETE FEATURES

1. **"Contenidos" Tab (Line 1062)** - Button exists but NO CONTENT RENDERED
   - Expected: Similar to Estudiantes tab
   - Should show: Assigned content list + assignment form
   - Missing: Handler call to `handleAssignContent()` / `handleUnassignContent()`

2. **Calendar View** - Not fully shown in current viewport
   - State exists: `activeTab`, `weekOffset`, `showWeekends`
   - Handlers: `handleCancelInstance()`
   - Not visible in this render because `activeTab === 'list'`

---

## 8. REFACTORING ROADMAP

### Phase 1: Layout Components
- Replace `.class-manager` → `<DashboardContainer>`
- Replace `.manager-header` + PageHeader → `<SectionHeader>`
- Replace `.cm-message` → Toast/Alert component

### Phase 2: Cards
- Replace `.class-card.card` → `<BaseCard>`
- Replace `.badge.badge-primary` → `<SemanticBadge>`
- Replace image sections with BaseCard image prop

### Phase 3: Modals
- Replace Create/Edit Modal → `<BaseModal>`
- Replace Details Modal → `<BaseModal>` with tabs
- Keep ConfirmModal as-is (already specialized)

### Phase 4: Forms
- Replace `.input` → `<BaseInput>`
- Replace `.select` → `<BaseSelect>`
- Replace buttons → `<BaseButton>`
- Keep custom schedule display (chips)
- Complete "Contenidos" tab implementation

### Phase 5: Validation & Polish
- Test all modals
- Test all tabs
- Test all CRUD operations
- Dark mode verification

---

## 9. COMPONENT MAPPING SUMMARY

| Current | New | Notes |
|---------|-----|-------|
| `<div className="class-manager">` | `<DashboardContainer>` | Main wrapper |
| PageHeader | `<SectionHeader>` | Title + action button |
| `.class-card.card` | `<BaseCard>` | Class display card |
| `.modal-overlay + .modal-box` | `<BaseModal>` | All modals |
| `.input` | `<BaseInput>` | Form inputs |
| `.select` | `<BaseSelect>` | Form selects |
| `<BaseButton>` (already used) | `<BaseButton>` | Already using! Keep as-is |
| `.badge.badge-primary` | `<SemanticBadge>` | Course/status badges |
| `.cm-message` | Toast or custom | Notification display |

---

## 10. KEY NOTES FOR REFACTORING

1. **BaseButton** - Already in use throughout, no changes needed
2. **Modal Structure** - Details modal uses IIFE to avoid re-renders, preserve this pattern
3. **Schedule Chips** - Currently `.schedule-chip`, may need custom component or BaseCard small variant
4. **Tab System** - Currently manual, BaseModal likely provides automatic tab management
5. **Message System** - `.cm-message` is custom, integrate with app's notification system
6. **Image Upload** - Keep Firebase logic, just wrap in BaseInput
7. **Time Inputs** - Currently using native `<input type="time">`, refactor to BaseInput + spinners or keep custom?
8. **Responsive Grid** - Currently uses Tailwind classes, keep this
9. **Search + ViewMode** - SearchBar already handles both, keep as-is
10. **Admin Check** - `isAdminEmail()` used to determine class visibility, keep logic

