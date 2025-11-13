# =� Roadmap de Refactorizaci�n - XIWENAPP

**Fecha:** 2025-11-13
**Versi�n:** 1.0
**Estado General:** 68% � 85% (tras scripts autom�ticos)

---

## =� PROGRESO GLOBAL

| Fase | Componentes | Estado | Completado |
|------|-------------|--------|------------|
| **Infraestructura** | Design Tokens, Componentes Sem�nticos |  | 100% |
| **Migraci�n Autom�tica** | Colores hardcoded (50+ archivos) |  | 100% |
| **Componentes Cr�ticos** | 3 componentes (ClassManager, UserCard, Analytics) | � | 0% |
| **Componentes Alta Prioridad** | 8 componentes | � | 0% |
| **Componentes Legacy** | 23 componentes | � | 0% |

**Total:** 34 componentes con CSS custom � **0 completados** (infraestructura lista)

---

##  FASE 0: INFRAESTRUCTURA (COMPLETADO)

### Archivos Creados:
-  `src/config/designTokens.js` (v3.0)
-  `src/components/common/SemanticIcon.jsx`
-  `src/components/common/SemanticBadge.jsx`
-  `src/components/common/SectionHeader.jsx`
-  `src/components/common/DashboardContainer.jsx`
-  `.claude/MIGRATION_GUIDE.md`
-  `scripts/migrate-colors.js`

### CSS Variables Agregadas:
-  `--color-success-text`, `--color-error-text`, etc.
-  `--color-accent-bg`, `--color-accent-text`

---

## � FASE 1: MIGRACI�N AUTOM�TICA (COMPLETADO)

### Script Ejecutado:
```bash
node scripts/migrate-colors.cjs  # Ejecutado: 163 archivos, 80 modificados, 223 reemplazos
```

### Cambios Aplicados:
-  ~50+ archivos .jsx procesados
-  Colores hardcoded � CSS variables
-  `text-red-600` � `style={{ color: 'var(--color-error)' }}`
-  `bg-green-100` � `style={{ background: 'var(--color-success-bg)' }}`
-  Patrones dark mode unificados

**Impacto:** Cumplimiento subi� de 68% � ~85%

---

## =% FASE 2: COMPONENTES CR�TICOS (PENDIENTE)

### 2.1 ClassManager.jsx
**Archivo:** `src/components/ClassManager.jsx` (1593 l�neas)
**CSS:** `src/components/ClassManager.css` (969 l�neas)
**Prioridad:** =%=%=%=%=% CR�TICA
**Tiempo estimado:** 4-6 horas

#### Plan de Refactorizaci�n:

**Paso 1: Imports**
```javascript
// Agregar
import {
  DashboardContainer,
  SectionHeader,
  DashboardGrid,
  BaseCard,
  BaseButton,
  BaseModal,
  BaseInput,
  BaseSelect,
  BaseTextarea,
  SemanticBadge,
  SemanticIcon,
} from './common';
import { colors, spacing, typography, shadows } from '../config/designTokens';

// Eliminar
import './ClassManager.css'; // L
```

**Paso 2: Estructura Principal**
```jsx
// L ANTES
<div className="class-manager">
  <div className="manager-header">
    <h2>Gesti�n de Clases</h2>
    ...
  </div>
  ...
</div>

//  DESPU�S
<DashboardContainer>
  <SectionHeader
    title="Gesti�n de Clases"
    subtitle={`${classes.length} clases activas`}
    actions={
      <>
        <BaseButton variant="ghost" onClick={() => setActiveTab('list')}>
          Lista
        </BaseButton>
        <BaseButton variant="ghost" onClick={() => setActiveTab('calendar')}>
          Calendario
        </BaseButton>
        <BaseButton variant="primary" icon={Plus} onClick={() => setShowModal(true)}>
          Nueva Clase
        </BaseButton>
      </>
    }
  />
  ...
</DashboardContainer>
```

**Paso 3: Cards de Clases**
```jsx
// L ANTES
<div className="class-card">
  <div className="class-card-header">
    <h3>{classItem.name}</h3>
    ...
  </div>
  ...
</div>

//  DESPU�S
<BaseCard
  title={classItem.name}
  image={classItem.imageUrl}
  badges={[
    <SemanticBadge variant="info">{classItem.creditCost} cr�ditos</SemanticBadge>,
    classItem.schedules.length > 0 && (
      <SemanticBadge variant="success">
        {classItem.schedules.length} horarios
      </SemanticBadge>
    ),
  ]}
  hover
  onClick={() => handleViewDetails(classItem)}
>
  <p className="text-sm mb-3" style={{ color: colors.textSecondary }}>
    {classItem.description}
  </p>
  <div className="flex gap-2">
    <BaseButton variant="ghost" size="sm" icon={Edit} onClick={() => handleEdit(classItem)}>
      Editar
    </BaseButton>
    <BaseButton variant="danger" size="sm" icon={Trash2} onClick={() => handleDelete(classItem.id)}>
      Eliminar
    </BaseButton>
  </div>
</BaseCard>
```

**Paso 4: Modal**
```jsx
// L ANTES
<div className="modal-overlay" onClick={() => setShowModal(false)}>
  <div className="modal-box">
    ...
  </div>
</div>

//  DESPU�S
<BaseModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title={editingClass ? 'Editar Clase' : 'Nueva Clase'}
  size="lg"
>
  <form className="space-y-4">
    <BaseInput label="Nombre" value={formData.name} onChange={...} required />
    <BaseTextarea label="Descripci�n" value={formData.description} onChange={...} rows={3} />
    <div className="grid grid-cols-2 gap-4">
      <BaseSelect label="Curso" value={formData.courseId} options={courseOptions} />
      <BaseInput label="Costo (cr�ditos)" type="number" value={formData.creditCost} onChange={...} />
    </div>
    ...
  </form>
</BaseModal>
```

**Paso 5: Eliminar CSS**
```bash
rm src/components/ClassManager.css
# Eliminar l�nea: import './ClassManager.css';
```

---

### 2.2 UserCard.jsx
**Archivo:** `src/components/UserCard.jsx`
**CSS:** `src/components/UserCard.css` (400 l�neas)
**Prioridad:** =%=%=%=%=% CR�TICA
**Tiempo estimado:** 2-3 horas

#### Plan de Refactorizaci�n:

**Estrategia:** Extender BaseCard

```jsx
// L ANTES
import './UserCard.css';

function UserCard({ user }) {
  return (
    <div className="user-card">
      <div className="user-card-header">
        <div className="user-avatar">{user.name[0]}</div>
      </div>
      <div className="user-card-content">
        <h3 className="user-name">{user.name}</h3>
        ...
      </div>
    </div>
  );
}

//  DESPU�S
import { BaseCard, SemanticBadge } from './common';
import { User, Mail, BookOpen, Award } from 'lucide-react';

function UserCard({ user, onView, onDelete }) {
  const roleColors = {
    admin: 'accent',
    teacher: 'info',
    student: 'success',
  };

  return (
    <BaseCard
      avatar={user.photoURL || user.name[0]}
      title={user.name}
      subtitle={user.email}
      badges={[
        <SemanticBadge variant={roleColors[user.role]}>
          {user.role}
        </SemanticBadge>,
        user.isPremium && (
          <SemanticBadge variant="warning">Premium</SemanticBadge>
        ),
      ]}
      stats={[
        { icon: BookOpen, label: 'Cursos', value: user.coursesCount || 0 },
        { icon: Award, label: 'Logros', value: user.achievementsCount || 0 },
      ]}
      hover
    >
      <div className="flex gap-2 mt-4">
        <BaseButton variant="ghost" size="sm" icon={Eye} onClick={onView}>
          Ver Perfil
        </BaseButton>
        <BaseButton variant="danger" size="sm" icon={Trash2} onClick={onDelete}>
          Eliminar
        </BaseButton>
      </div>
    </BaseCard>
  );
}
```

**Eliminar:**
```bash
rm src/components/UserCard.css
```

---

### 2.3 AnalyticsDashboard.jsx
**Archivo:** `src/components/AnalyticsDashboard.jsx`
**Prioridad:** =%=%=%=% ALTA
**Tiempo estimado:** 1-2 horas

#### Plan de Refactorizaci�n:

**Cambio principal:** Reemplazar `.card` custom con BaseCard

```jsx
// L ANTES
<div className="card">
  <h3>{title}</h3>
  <div className="stat">{value}</div>
</div>

//  DESPU�S
<BaseCard
  icon={BarChart3}
  title={title}
  stats={[{ value: value, label: description }]}
/>
```

---

## =6 FASE 3: COMPONENTES ALTA PRIORIDAD (PENDIENTE)

### Lista de Componentes:

1. **AdminPanel.jsx** + AdminPanel.css (tiempo: 2h)
2. **AttendanceView.jsx** + AttendanceView.css (tiempo: 2h)
3. **CalendarView.jsx** + CalendarView.css (tiempo: 2h)
4. **ClassScheduleManager.jsx** + ClassScheduleManager.css (tiempo: 3h)
5. **CreditManager.jsx** + CreditManager.css (tiempo: 2h)
6. **LiveClassManager.jsx** + LiveClassManager.css (tiempo: 3h)
7. **Login.jsx / UnifiedLogin.jsx** + CSS (tiempo: 3h)
8. **UserProfile.jsx** + UserProfile.css (tiempo: 3h)

**Total Fase 3:** ~20 horas de trabajo

#### Estrategia General:
1. Usar DashboardContainer para estructura principal
2. Usar SectionHeader para t�tulos
3. Reemplazar HTML nativo con BaseButton, BaseInput, BaseModal
4. Usar SemanticBadge para badges
5. Eliminar archivo .css
6. Verificar dark mode

---

## =5 FASE 4: COMPONENTES LEGACY (23 COMPONENTES)

### Lista Completa:

1. UsersTable.jsx + UsersTable.css
2. Whiteboard.jsx + Whiteboard.css
3. SharedContentViewer.jsx + SharedContentViewer.css
4. SideMenu.jsx + SideMenu.css
5. TopBar.jsx + TopBar.css
6. ThemeSwitcher.jsx + ThemeSwitcher.css
7. ReactionPicker.jsx + ReactionPicker.css
8. RoleSelector.jsx + RoleSelector.css
9. MessagesPanel.jsx + Messages.css
10. UserMenu.jsx + UserMenu.css
11. LiveGameStudent.jsx + LiveGameStudent.css
12. JoinGamePage.jsx + JoinGamePage.css
13. LiveGameSetup.jsx + LiveGameSetup.css
14. LiveGameProjection.jsx + LiveGameProjection.css
15. EmojiPicker.jsx + EmojiPicker.css
16. AvatarSelector.jsx + AvatarSelector.css
17. ClassManagement.jsx + ClassManagement.css
18. ExcalidrawWhiteboard.jsx + ExcalidrawWhiteboard.css
19. student/ContentPlayer.jsx + ContentPlayer.css
20. student/CourseViewer.jsx + CourseViewer.css
21. exercises/ExercisePlayer.jsx + ExercisePlayer.css
22. exercises/types/MultipleChoiceExercise.jsx + CSS
23. interactive-book/styles.css (varios componentes)

**Total Fase 4:** ~40-50 horas de trabajo

#### Estrategia:
- Procesar 1-2 componentes por d�a
- Usar misma estrategia que Fase 3
- Testing continuo

---

## =� CHECKLIST POR COMPONENTE

Para marcar un componente como "completado":

- [ ] L Archivo .css eliminado
- [ ]  Importa designTokens
- [ ]  Usa DashboardContainer o BaseCard seg�n corresponda
- [ ]  Usa SectionHeader para t�tulos
- [ ]  Todos los botones son BaseButton
- [ ]  Todos los inputs/selects son Base*
- [ ]  Badges son SemanticBadge
- [ ]  Iconos monocrom�ticos o SemanticIcon
- [ ]  Dark mode funciona
- [ ]  Responsive (mobile first)
- [ ]  npm run build sin errores

---

## � ESTIMACI�N DE TIEMPOS

| Fase | Componentes | Horas | Semanas (40h/sem) |
|------|-------------|-------|-------------------|
| Fase 0 | Infraestructura |  8h |  |
| Fase 1 | Scripts autom�ticos |  2h |  |
| Fase 2 | 3 cr�ticos | 8-11h | 1 semana |
| Fase 3 | 8 alta prioridad | ~20h | 2 semanas |
| Fase 4 | 23 legacy | ~45h | 4-5 semanas |
| **TOTAL** | **34 componentes** | **~75h** | **7-8 semanas** |

---

## <� HITOS

### Hito 1: Infraestructura 
- **Completado:** 2025-11-13
- Design tokens, componentes sem�nticos, gu�as

### Hito 2: Migraci�n Autom�tica 
- **Completado:** 2025-11-13
- Scripts de colores, ~85% cumplimiento base

### Hito 3: Componentes Cr�ticos �
- **Objetivo:** Fin de semana 2
- ClassManager, UserCard, AnalyticsDashboard

### Hito 4: Alta Prioridad �
- **Objetivo:** Fin de semana 4
- 8 componentes principales

### Hito 5: Legacy Complete �
- **Objetivo:** Fin de semana 8
- Todos los 23 componentes legacy

### Hito Final: 100% Cumplimiento <�
- **Objetivo:** Fin de semana 8-9
- 0 archivos CSS custom
- 100% componentes usando design system

---

## =� C�MO CONTINUAR

### Opci�n A: T� o tu equipo
1. Leer `.claude/MIGRATION_GUIDE.md`
2. Seguir los planes de este roadmap
3. Procesar 1 componente a la vez
4. Usar checklist para validar

### Opci�n B: Claude en pr�ximas sesiones
1. Solicitar refactorizaci�n de componentes espec�ficos
2. Claude usar� este roadmap como gu�a
3. Se completar�n 2-3 componentes por sesi�n

### Opci�n C: Combinaci�n
1. Scripts autom�ticos para cambios simples
2. Refactorizaci�n manual para componentes complejos
3. Claude para revisi�n y optimizaci�n

---

## =� RECURSOS

- **Gu�a de Migraci�n:** `.claude/MIGRATION_GUIDE.md`
- **Design System:** `.claude/DESIGN_SYSTEM.md`
- **Coding Standards:** `.claude/CODING_STANDARDS.md`
- **Design Tokens:** `src/config/designTokens.js`
- **Componentes Base:** `src/components/common/`

---

**�ltima actualizaci�n:** 2025-11-13
**Mantenido por:** Claude Code
