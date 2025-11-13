# ClassManager Refactoring - Implementation Checklist

## Overview
This checklist provides a step-by-step guide for refactoring ClassManager.jsx to use Design System 3.0 components.

---

## PHASE 1: Setup & Analysis
- [ ] Read and understand all three analysis documents
- [ ] Review Design System 3.0 component APIs:
  - [ ] DashboardContainer
  - [ ] SectionHeader
  - [ ] BaseCard (with image support)
  - [ ] BaseModal
  - [ ] BaseInput
  - [ ] BaseSelect
  - [ ] BaseButton (already in use)
  - [ ] SemanticBadge
- [ ] Create a branch: `git checkout -b refactor/classmanager-ds3`
- [ ] Backup current ClassManager.jsx

---

## PHASE 2: Replace Layout Components
### Main Container
- [ ] Replace `<div className="class-manager">` with `<DashboardContainer>`
- [ ] Update imports
- [ ] Test responsive behavior
- [ ] Verify dark mode still works

### Header
- [ ] Replace PageHeader usage (keep as-is if it uses DashboardContainer internally)
- [ ] Or replace with `<SectionHeader>` if available
- [ ] Keep the title="Clases" and actionLabel="+ Nueva Clase"

### Message Display
- [ ] Decide: Keep `.cm-message` or integrate with app-wide toast system
- [ ] If integrating: Update showMessage() function
- [ ] Test success and error messages

### Search Bar
- [ ] Keep SearchBar component as-is
- [ ] Verify viewMode toggle still works

---

## PHASE 3: Replace Card Components
### Grid View Cards (lines 610-678)
- [ ] Replace `<div className="class-card card card-grid-item">` with `<BaseCard>`
- [ ] Migrate image section:
  - [ ] Map cls.imageUrl to image prop
  - [ ] Use Calendar icon as fallback
- [ ] Update content structure:
  - [ ] Title → BaseCard title prop or header
  - [ ] Description → BaseCard description or content
  - [ ] Course badge → SemanticBadge component
  - [ ] Schedules list → Custom content (keep current structure)
  - [ ] Stats → Custom footer or content

### List View Cards (lines 679-752)
- [ ] Replace `<div className="card card-list">` with `<BaseCard>`
- [ ] Configure horizontal layout (image left, content right)
- [ ] Adapt same field mappings as grid view
- [ ] Test responsive behavior between grid/list views

### Schedule Chip Component
- [ ] Keep `.schedule-chip` styling as-is OR
- [ ] Extract to custom `<ScheduleChip>` component using BaseCard
- [ ] Test remove button functionality

### Badges
- [ ] Replace all `<span className="badge badge-primary">` with `<SemanticBadge variant="primary">`
- [ ] Review all badge uses in component
- [ ] Test styling consistency

---

## PHASE 4: Replace Modal - Create/Edit Modal
### Modal Container
- [ ] Replace custom modal-overlay + modal-box with `<BaseModal>`
- [ ] Review BaseModal API:
  - [ ] onClose prop
  - [ ] title prop
  - [ ] children (content)
  - [ ] footer prop (for buttons)
  - [ ] scrollable behavior

### Modal Header
- [ ] Migrate title: "Nueva Clase" / "Editar Clase"
- [ ] Use BaseModal's built-in close button

### Modal Tabs
- [ ] Currently only 1 tab ("Información")
- [ ] Check if BaseModal supports tabs natively
- [ ] If not, keep manual tab system for future expansion

### Modal Body - Form Fields
- [ ] **Nombre de la Clase**
  - [ ] Replace `<input className="input">` with `<BaseInput type="text">`
  - [ ] Update state binding: formData.name
  - [ ] Add required indicator (*)

- [ ] **Fecha de Inicio**
  - [ ] Replace with `<BaseInput type="date">`
  - [ ] Update state binding: formData.startDate
  - [ ] Add help text
  - [ ] Test date picker behavior

- [ ] **Descripción**
  - [ ] Replace `<textarea className="input">` with `<BaseInput as="textarea">`
  - [ ] Or check if BaseInput supports textarea variant
  - [ ] Update state binding: formData.description

- [ ] **Form Row (2 columns: Curso + Créditos)**
  - [ ] Use grid wrapper div with BaseCard-compatible spacing
  - [ ] Curso field:
    - [ ] Replace `<select className="select">` with `<BaseSelect>`
    - [ ] Map courses to options
    - [ ] Add "-- Sin curso --" option
    - [ ] Update state binding: formData.courseId
  - [ ] Créditos field:
    - [ ] Replace with `<BaseInput type="number">`
    - [ ] Set min="0" max="10"
    - [ ] Update state binding: formData.creditCost

- [ ] **Link de Videollamada**
  - [ ] Replace with `<BaseInput type="url">`
  - [ ] Update state binding: formData.meetingLink

### Modal Body - Schedules Section
- [ ] **Added Schedules Display**
  - [ ] Keep or refactor to use ScheduleChip components
  - [ ] Test remove button (handleRemoveSchedule)

- [ ] **Days Selection**
  - [ ] Review BaseInput/BaseSelect for checkbox list
  - [ ] Or keep manual checkbox group with custom styling
  - [ ] Update state binding: scheduleForm.daysOfWeek[]
  - [ ] Test multi-select behavior

- [ ] **Time Inputs**
  - [ ] Replace `<input type="time">` with `<BaseInput type="time">`
  - [ ] Or keep custom if needed for UX
  - [ ] Update state binding: scheduleForm.startTime/endTime
  - [ ] Test time validation

- [ ] **Add Schedule Button**
  - [ ] Keep BaseButton (already in use)
  - [ ] Verify onClick handler: handleAddSchedule()
  - [ ] Test schedule adding

### Modal Footer
- [ ] Replace button group with BaseModal footer prop
- [ ] **Cancelar Button**
  - [ ] `<BaseButton variant="outline">`
  - [ ] onClick: setShowModal(false)

- [ ] **Crear/Guardar Button**
  - [ ] `<BaseButton variant="primary">`
  - [ ] onClick: handleSaveClass()
  - [ ] Change text conditionally

### Test Create/Edit Modal
- [ ] [ ] Open create modal
- [ ] [ ] Fill all fields
- [ ] [ ] Add schedules
- [ ] [ ] Save new class
- [ ] [ ] Open existing class for edit
- [ ] [ ] Modify fields
- [ ] [ ] Save changes
- [ ] [ ] Test validation messages

---

## PHASE 5: Replace Modal - Details Modal

### Modal Container
- [ ] Replace custom modal with `<BaseModal>`
- [ ] Preserve IIFE pattern if needed for component structure
- [ ] Test onClose handler

### Modal Header
- [ ] Migrate selectedClass.name as title
- [ ] Use BaseModal's close button

### Notification
- [ ] Keep .cm-message or integrate with toast
- [ ] Position inside BaseModal if supported

### Modal Tabs
- [ ] Check if BaseModal supports built-in tab management
- [ ] If yes: Refactor to use tabs prop
- [ ] If no: Keep manual tab system (detailsTab state)
- [ ] Ensure smooth tab switching

### Tab Content: GENERAL (lines 1083-1192)
- [ ] **All form fields**
  - [ ] Same replacements as Create/Edit modal
  - [ ] Nombre → BaseInput
  - [ ] Fecha de Inicio → BaseInput
  - [ ] Descripción → BaseInput
  - [ ] Créditos + Link → 2-col row with BaseInput
  
- [ ] **Image Upload Section**
  - [ ] Replace `<input type="file">` with `<BaseInput type="file">`
  - [ ] Keep image preview
  - [ ] Delete button → `<BaseButton variant="danger">`
  - [ ] Test upload/delete functionality
  - [ ] Verify Firebase integration still works

### Tab Content: HORARIOS (lines 1195-1381)
- [ ] **Section: Horarios Configurados**
  - [ ] Display schedules in list
  - [ ] Each schedule item:
    - [ ] Text display (day + time)
    - [ ] Delete button → `<BaseButton variant="danger">`
    - [ ] Test handleRemoveSchedule()

- [ ] **Section: Agregar Horario**
  - [ ] Days selection (7 button toggles)
    - [ ] Review BaseButton for toggle variant
    - [ ] Or keep custom styling
    - [ ] Ensure proper grid layout
  
  - [ ] Time inputs (hour + minute selects)
    - [ ] Keep as `<select>` with `<BaseSelect>` or native
    - [ ] Update updateTime() handler
    - [ ] Test time selection

  - [ ] Weeks to generate
    - [ ] Replace `<select>` with `<BaseSelect>`
    - [ ] Options: 4, 8, 12, 16 semanas
    - [ ] Update state binding

  - [ ] Add button
    - [ ] `<BaseButton variant="success">`
    - [ ] onClick: handleAddSchedule()

  - [ ] Auto-renew checkbox
    - [ ] Check if BaseInput supports checkbox
    - [ ] Or keep custom checkbox
    - [ ] Help text

### Tab Content: ASIGNACIONES (lines 1384-1461) - Course Assignment
- [ ] **Section: Curso Asociado**
  - [ ] Display assigned course name
  - [ ] Delete button → `<BaseButton variant="danger">`
  - [ ] Test handleUnassignGroup() or similar

- [ ] **Section: Asignar Curso**
  - [ ] Course dropdown → `<BaseSelect>`
  - [ ] Add button → `<BaseButton variant="success">`
  - [ ] Test course assignment

### Tab Content: ESTUDIANTES (lines 1464-1536) - Student Assignment
- [ ] **Section: Estudiantes Asignados**
  - [ ] List assigned students
  - [ ] Each student item:
    - [ ] Name + email display
    - [ ] Delete button → `<BaseButton variant="danger">`
    - [ ] Test handleUnassignStudent()

- [ ] **Section: Asignar Estudiante**
  - [ ] Student dropdown → `<BaseSelect>`
  - [ ] Add button → `<BaseButton variant="success">`
  - [ ] Test student assignment

### Tab Content: CONTENIDOS (lines 1062) - INCOMPLETE
- [ ] **THIS TAB IS INCOMPLETE - MUST IMPLEMENT**
  
- [ ] **Section: Contenidos Asignados**
  - [ ] Copy student list pattern
  - [ ] Replace with content items
  - [ ] Delete button calls handleUnassignContent()

- [ ] **Section: Asignar Contenido**
  - [ ] Copy student assignment pattern
  - [ ] Content dropdown → `<BaseSelect>`
  - [ ] Add button calls handleAssignContent()
  - [ ] Test both operations

### Modal Footer
- [ ] **Delete Button**
  - [ ] `<BaseButton variant="danger" icon={Trash2}>`
  - [ ] onClick: setShowConfirmDelete(true)

- [ ] **Cancel Button**
  - [ ] `<BaseButton variant="outline">`
  - [ ] onClick: setShowDetailsModal(false)

- [ ] **Save Changes Button**
  - [ ] `<BaseButton variant="primary" icon={Save}>`
  - [ ] onClick: handleSaveClassChanges()

### Test Details Modal
- [ ] [ ] Open details modal
- [ ] [ ] Navigate through all 5 tabs
- [ ] [ ] Edit General tab fields
- [ ] [ ] Add/remove schedules in Horarios tab
- [ ] [ ] Assign/unassign course
- [ ] [ ] Assign/unassign students
- [ ] [ ] Assign/unassign content
- [ ] [ ] Save changes
- [ ] [ ] Delete class (via modal)

---

## PHASE 6: Delete Confirmation Modal
- [ ] Keep ConfirmModal as-is (already refactored)
- [ ] Test delete flow
- [ ] Verify warning message displays correctly

---

## PHASE 7: Import Updates
- [ ] Update component imports
- [ ] Remove old CSS classes if using new BaseCard styling
- [ ] Update ClassManager.css:
  - [ ] Remove .modal-* rules (now in BaseModal)
  - [ ] Remove .input/.select rules (now in BaseInput/BaseSelect)
  - [ ] Keep custom styles for:
    - [ ] .schedule-chip
    - [ ] .class-schedules
    - [ ] .schedule-item
    - [ ] .cm-message (or replace)

---

## PHASE 8: Testing Checklist

### Functionality Testing
- [ ] Create new class with all fields
- [ ] Edit existing class
- [ ] Delete class with confirmation
- [ ] View class details
- [ ] Add/remove schedules
- [ ] Assign/unassign courses
- [ ] Assign/unassign students
- [ ] Assign/unassign content
- [ ] Generate instances
- [ ] Search classes
- [ ] Toggle grid/list view
- [ ] Image upload/delete

### Visual Testing
- [ ] Grid view responsive (mobile, tablet, desktop)
- [ ] List view responsive
- [ ] Modal on different screen sizes
- [ ] Tab navigation
- [ ] Form validation messages
- [ ] Success/error messages
- [ ] Empty states

### Dark Mode Testing
- [ ] All components in dark mode
- [ ] Colors contrast OK
- [ ] Modals readable
- [ ] Text visible

### Cross-Browser Testing
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers

---

## PHASE 9: Cleanup & Documentation
- [ ] Remove unused CSS from ClassManager.css
- [ ] Update component comments/JSDoc
- [ ] Remove old imports (old modal classes)
- [ ] Add BaseCard/BaseModal prop examples in comments
- [ ] Create component refactoring notes

---

## PHASE 10: Code Review & Merge
- [ ] Self code review
- [ ] Check for console warnings
- [ ] Verify no console errors
- [ ] Test all keyboard navigation
- [ ] Test accessibility (tab order, focus states)
- [ ] Commit changes: `git add . && git commit -m "refactor: Migrate ClassManager to Design System 3.0"`
- [ ] Push branch and create PR
- [ ] Address review feedback
- [ ] Merge to main

---

## Known Issues to Watch For
1. **IIFE Pattern**: Details modal uses IIFE - verify this still works with BaseModal
2. **Schedule Chips**: Custom styling - may need to adjust if using BaseCard
3. **Time Inputs**: Currently split into hour/minute selects - consider UX consistency
4. **Message System**: .cm-message is custom - integrate with app notifications
5. **Dialog Alerts**: alert()/confirm()/prompt() - consider replacing with better UX
6. **Contenidos Tab**: Currently incomplete - must implement

---

## Time Estimates
- Phase 1 (Setup): 30 minutes
- Phase 2 (Layout): 30 minutes
- Phase 3 (Cards): 45 minutes
- Phase 4 (Create/Edit Modal): 1.5 hours
- Phase 5 (Details Modal): 2 hours
- Phase 6 (Delete Modal): 15 minutes
- Phase 7 (Imports): 30 minutes
- Phase 8 (Testing): 2 hours
- Phase 9 (Cleanup): 30 minutes
- Phase 10 (Review): 1 hour

**Total Estimated Time: 9.5 hours**

---

## References
- Analysis: `/REFACTORING_ANALYSIS_ClassManager.md`
- Modal Structures: `/REFACTORING_MODAL_STRUCTURES.txt`
- Current Component: `/src/components/ClassManager.jsx`
- Current Styles: `/src/components/ClassManager.css`

