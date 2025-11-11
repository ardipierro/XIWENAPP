# EJEMPLOS DE REFACTORIZACIÓN: ANTES vs DESPUÉS

## 1. MODALES

### ANTES (Incorrecto - HTML custom)
```jsx
<div className="modal-overlay" onClick={() => setShowModal(false)}>
  <div className="modal-box enrollment-modal" onClick={(e) => e.stopPropagation()}>
    <div className="modal-header">
      <h2>Título del Modal</h2>
      <button className="modal-close-btn" onClick={() => setShowModal(false)}>
        ✕
      </button>
    </div>
    <div className="modal-body">
      Contenido aquí
    </div>
    <div className="modal-footer">
      <button className="btn btn-ghost">Cancelar</button>
      <button className="btn btn-primary">Aceptar</button>
    </div>
  </div>
</div>
```

### DESPUÉS (Correcto - BaseModal)
```jsx
import { BaseModal, BaseButton } from './common';

<BaseModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Título del Modal"
  size="md"
>
  <div>Contenido aquí</div>
  
  <BaseModal.Footer>
    <BaseButton variant="ghost" onClick={() => setShowModal(false)}>
      Cancelar
    </BaseButton>
    <BaseButton variant="primary" onClick={handleAccept}>
      Aceptar
    </BaseButton>
  </BaseModal.Footer>
</BaseModal>
```

---

## 2. BOTONES

### ANTES (Incorrecto - HTML button)
```jsx
<button onClick={handleClick} className="btn btn-primary">
  <Plus size={18} strokeWidth={2} /> Crear Nuevo
</button>

<button onClick={handleBack} className="btn btn-ghost mb-4">
  ← Volver
</button>

<button className="modal-close-btn" onClick={handleClose}>
  ✕
</button>
```

### DESPUÉS (Correcto - BaseButton)
```jsx
import { BaseButton } from './common';
import { Plus } from 'lucide-react';

<BaseButton variant="primary" icon={Plus} onClick={handleClick}>
  Crear Nuevo
</BaseButton>

<BaseButton variant="ghost" onClick={handleBack} className="mb-4">
  ← Volver
</BaseButton>

<BaseButton 
  variant="ghost" 
  size="icon" 
  onClick={handleClose}
  aria-label="Cerrar"
>
  ✕
</BaseButton>
```

---

## 3. INPUTS

### ANTES (Incorrecto - HTML input)
```jsx
<input
  type="text"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  className="input"
  placeholder="Correo electrónico"
  disabled
/>
```

### DESPUÉS (Correcto - BaseInput)
```jsx
import { BaseInput } from './common';

<BaseInput
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="Correo electrónico"
  disabled
  label="Correo"
/>
```

---

## 4. SELECTS

### ANTES (Incorrecto - HTML select)
```jsx
<select
  value={selectedRole}
  onChange={(e) => handleRoleChange(e.target.value)}
  className="role-select"
>
  {Object.values(ROLES).map(role => (
    <option key={role} value={role}>
      {ROLE_INFO[role].name}
    </option>
  ))}
</select>
```

### DESPUÉS (Correcto - BaseSelect)
```jsx
import { BaseSelect } from './common';

<BaseSelect
  value={selectedRole}
  onChange={(e) => handleRoleChange(e.target.value)}
  label="Rol de usuario"
  options={Object.values(ROLES).map(role => ({
    value: role,
    label: ROLE_INFO[role].name
  }))}
/>
```

---

## 5. CARDS

### ANTES (Incorrecto - DIV custom)
```jsx
<div className="stat-card primary">
  <div className="stat-icon">
    <Users size={36} strokeWidth={2} />
  </div>
  <div className="stat-info">
    <div className="stat-value">{stats.total}</div>
    <div className="stat-label">Total Usuarios</div>
  </div>
</div>
```

### DESPUÉS (Correcto - BaseCard)
```jsx
import { BaseCard } from './common';
import { Users } from 'lucide-react';

<BaseCard variant="elevated" icon={Users}>
  <div className="flex flex-col items-center text-center">
    <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
      {stats.total}
    </div>
    <div className="text-sm text-gray-600 dark:text-gray-400">
      Total Usuarios
    </div>
  </div>
</BaseCard>
```

---

## 6. PATRONES COMUNES

### Pattern 1: Form Input Group
```jsx
// ANTES
<div className="form-group">
  <label className="label">Nombre completo</label>
  <input
    type="text"
    value={name}
    onChange={(e) => setName(e.target.value)}
    className="input"
    placeholder="Ingresa tu nombre"
  />
</div>

// DESPUÉS
<BaseInput
  label="Nombre completo"
  type="text"
  value={name}
  onChange={(e) => setName(e.target.value)}
  placeholder="Ingresa tu nombre"
/>
```

### Pattern 2: Action Buttons Group
```jsx
// ANTES
<div className="flex gap-2 mt-6">
  <button onClick={handleCancel} className="btn btn-outline flex-1">
    Cancelar
  </button>
  <button onClick={handleSubmit} className="btn btn-primary flex-1">
    Guardar
  </button>
</div>

// DESPUÉS
<div className="flex gap-2 mt-6">
  <BaseButton variant="outline" onClick={handleCancel} fullWidth>
    Cancelar
  </BaseButton>
  <BaseButton variant="primary" onClick={handleSubmit} fullWidth>
    Guardar
  </BaseButton>
</div>
```

### Pattern 3: Modal with Form
```jsx
// ANTES
{showModal && (
  <div className="modal-overlay" onClick={() => setShowModal(false)}>
    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
      <div className="modal-header">
        <h3 className="text-xl font-bold">Crear Nuevo Item</h3>
      </div>
      <form className="modal-body" onSubmit={handleSubmit}>
        <input type="text" className="input" placeholder="Nombre" />
        <input type="text" className="input" placeholder="Descripción" />
      </form>
      <div className="modal-footer">
        <button className="btn btn-ghost" onClick={() => setShowModal(false)}>
          Cancelar
        </button>
        <button className="btn btn-primary" onClick={handleSubmit}>
          Crear
        </button>
      </div>
    </div>
  </div>
)}

// DESPUÉS
<BaseModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Crear Nuevo Item"
>
  <form onSubmit={handleSubmit} className="space-y-4">
    <BaseInput type="text" placeholder="Nombre" />
    <BaseInput type="text" placeholder="Descripción" />
    
    <BaseModal.Footer>
      <BaseButton variant="ghost" onClick={() => setShowModal(false)}>
        Cancelar
      </BaseButton>
      <BaseButton variant="primary" type="submit">
        Crear
      </BaseButton>
    </BaseModal.Footer>
  </form>
</BaseModal>
```

---

## 7. CHECKLIST DE REFACTORIZACIÓN

Para cada componente a refactorizar, seguir este checklist:

```markdown
[ ] Identificar todos los <button> y reemplazarlos con BaseButton
[ ] Identificar todos los <input> y reemplazarlos con BaseInput
[ ] Identificar todos los <select> y reemplazarlos con BaseSelect
[ ] Identificar todos los <div className="modal-*"> y reemplazarlos con BaseModal
[ ] Identificar todos los <div className="card*"> y reemplazarlos con BaseCard
[ ] Importar los componentes necesarios: import { Base... } from './common'
[ ] Verificar que los props se pasen correctamente
[ ] Probar que los estilos sigan siendo correctos
[ ] Ejecutar tests si existen
[ ] Revisar en diferentes resoluciones (mobile, tablet, desktop)
[ ] Verificar accesibilidad (focus states, keyboard navigation)
```

---

## 8. REFERENCIAS RÁPIDAS

### Imports necesarios
```jsx
// Elementos interactivos
import { BaseButton } from './common';
import { BaseInput, BaseSelect, BaseTextarea } from './common';

// Contenedores
import { BaseCard, BaseModal } from './common';

// Feedback
import { BaseBadge, BaseAlert, BaseLoading } from './common';

// Empty states
import { BaseEmptyState } from './common';
```

### Props comunes de BaseButton
```jsx
<BaseButton
  variant="primary"              // primary, secondary, outline, ghost, danger
  size="md"                      // sm, md, lg, icon
  icon={IconComponent}           // opcional
  disabled={false}               // opcional
  fullWidth={false}              // opcional
  className="custom-class"       // opcional
  onClick={handleClick}
>
  Label
</BaseButton>
```

### Props comunes de BaseInput
```jsx
<BaseInput
  type="text"                    // text, email, password, number, etc.
  value={value}
  onChange={handleChange}
  placeholder="Placeholder"      // opcional
  label="Label"                  // opcional
  error="Mensaje de error"       // opcional
  disabled={false}               // opcional
  className="custom-class"       // opcional
/>
```

### Props comunes de BaseSelect
```jsx
<BaseSelect
  value={value}
  onChange={handleChange}
  options={[
    { value: 'opt1', label: 'Opción 1' },
    { value: 'opt2', label: 'Opción 2' }
  ]}
  label="Label"                  // opcional
  placeholder="Selecciona..."    // opcional
  disabled={false}               // opcional
/>
```

### Props comunes de BaseModal
```jsx
<BaseModal
  isOpen={boolean}
  onClose={handleClose}
  title="Título"
  size="md"                      // sm, md, lg, xl
  closeOnBackdropClick={true}    // opcional
>
  {/* contenido */}
  <BaseModal.Footer>
    {/* botones de acción */}
  </BaseModal.Footer>
</BaseModal>
```

---

## 9. COMANDOS ÚTILES PARA REFACTORIZACIÓN

### Buscar todos los <button> en un archivo
```bash
grep -n "<button" /path/to/file.jsx
```

### Buscar todos los <input> en un archivo
```bash
grep -n "<input" /path/to/file.jsx
```

### Buscar todos los <select> en un archivo
```bash
grep -n "<select" /path/to/file.jsx
```

### Buscar todos los modal-overlay en un archivo
```bash
grep -n "modal-overlay" /path/to/file.jsx
```

---

## 10. BENEFICIOS DESPUÉS DE LA REFACTORIZACIÓN

✅ **Consistencia visual:**
- Todos los botones tendrán el mismo comportamiento y apariencia
- Todos los inputs tendrán la misma validación y estilos

✅ **Facilidad de mantenimiento:**
- Cambios en componentes base afectan toda la aplicación
- Menos CSS custom por mantener

✅ **Accesibilidad mejorada:**
- Componentes base incluyen atributos ARIA
- Mejor soporte para screen readers

✅ **Tema dinámico:**
- Cambios de tema aplicados globalmente
- No requiere ajustes en cada componente

✅ **Código más limpio:**
- Menos HTML boilerplate
- Props más claros y predecibles

