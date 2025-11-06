# 🧩 Base Components - Quick Reference

**✅ Claude Code Web Users**: ¡Perfecto! Estás leyendo este archivo desde `.claude/BASE_COMPONENTS.md`

**📍 Ubicación Original**: `src/components/common/README.md` - Esta es una copia para fácil acceso desde Claude Code Web.

Sistema de componentes reutilizables para XIWEN App. **100% Tailwind CSS**.

## 📋 Índice de Componentes

| Componente | Uso | Prioridad |
|------------|-----|-----------|
| [BaseButton](#basebutton) | Botones de acción | 🔥🔥🔥🔥🔥 |
| [BaseInput](#baseinput) | Campos de texto | 🔥🔥🔥🔥🔥 |
| [BaseSelect](#baseselect) | Selectores | 🔥🔥🔥🔥🔥 |
| [BaseTextarea](#basetextarea) | Áreas de texto | 🔥🔥🔥🔥🔥 |
| [BaseCard](#basecard) | Tarjetas/Cards | 🔥🔥🔥🔥 |
| [BaseModal](#basemodal) | Modales/Dialogs | 🔥🔥🔥🔥 |
| [BaseLoading](#baseloading) | Estados de carga | 🔥🔥🔥🔥 |
| [BaseBadge](#basebadge) | Tags/Badges | 🔥🔥🔥 |
| [BaseAlert](#basealert) | Alertas/Notificaciones | 🔥🔥🔥 |
| [BaseDropdown](#basedropdown) | Menús desplegables | 🔥🔥🔥 |
| [BaseEmptyState](#baseemptystate) | Estados vacíos | 🔥🔥🔥 |

---

## BaseButton

**Archivo:** `BaseButton.jsx`

**Uso básico:**
```jsx
import BaseButton from './common/BaseButton';
import { Plus } from 'lucide-react';

<BaseButton variant="primary" icon={Plus}>
  Crear Nuevo
</BaseButton>
```

**Variantes:** `primary`, `secondary`, `success`, `danger`, `warning`, `ghost`, `outline`

**Tamaños:** `sm`, `md`, `lg`, `xl`

**Props especiales:**
- `loading` - Muestra spinner
- `fullWidth` - Ancho completo
- `disabled` - Deshabilita el botón

---

## BaseInput

**Archivo:** `BaseInput.jsx`

**Uso básico:**
```jsx
import BaseInput from './common/BaseInput';
import { Mail } from 'lucide-react';

<BaseInput
  type="email"
  label="Email"
  icon={Mail}
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={emailError}
  required
/>
```

**Tipos:** `text`, `email`, `password`, `number`, `url`, etc.

**Props especiales:**
- `error` - Mensaje de error
- `helperText` - Texto de ayuda
- `icon` - Icono izquierdo
- Password type tiene toggle automático de visibilidad

---

## BaseSelect

**Archivo:** `BaseSelect.jsx`

**Uso básico:**
```jsx
import BaseSelect from './common/BaseSelect';

<BaseSelect
  label="Rol"
  value={role}
  onChange={(e) => setRole(e.target.value)}
  options={[
    { value: 'student', label: 'Estudiante' },
    { value: 'teacher', label: 'Profesor' },
  ]}
  required
/>
```

---

## BaseTextarea

**Archivo:** `BaseTextarea.jsx`

**Uso básico:**
```jsx
import BaseTextarea from './common/BaseTextarea';

<BaseTextarea
  label="Descripción"
  value={description}
  onChange={(e) => setDescription(e.target.value)}
  maxLength={500}
  rows={4}
/>
```

**Props especiales:**
- `maxLength` - Muestra contador automático
- `resize` - `true`, `false`, `'vertical'`, `'horizontal'`

---

## BaseCard

**Archivo:** `BaseCard.jsx`

**Uso básico:**
```jsx
import BaseCard from './common/BaseCard';
import BaseButton from './common/BaseButton';

<BaseCard
  title="Mi Card"
  subtitle="Subtítulo"
  actions={
    <BaseButton size="sm">Ver más</BaseButton>
  }
>
  <p>Contenido del card</p>
</BaseCard>
```

**Variantes:** `default`, `elevated`, `bordered`, `flat`

**Props especiales:**
- `image` - Imagen superior
- `icon` - Icono en header
- `avatar` - Avatar circular
- `badges` - Array de badges
- `stats` - Estadísticas
- `actions` - Botones de acción
- `onClick` - Hace el card clickable

---

## BaseModal

**Archivo:** `BaseModal.jsx`

**Uso básico:**
```jsx
import BaseModal, { useModal } from './common/BaseModal';

const modal = useModal();

<BaseButton onClick={modal.open}>Abrir</BaseButton>

<BaseModal
  isOpen={modal.isOpen}
  onClose={modal.close}
  title="Mi Modal"
  footer={
    <>
      <BaseButton variant="ghost" onClick={modal.close}>
        Cancelar
      </BaseButton>
      <BaseButton variant="primary">
        Confirmar
      </BaseButton>
    </>
  }
>
  <p>Contenido del modal</p>
</BaseModal>
```

**Tamaños:** `sm`, `md`, `lg`, `xl`, `fullscreen`

**Props especiales:**
- `isDanger` - Estilo rojo
- `loading` - Estado de carga
- `icon` - Icono en header
- `closeOnOverlayClick` - Cerrar al click fuera

---

## BaseLoading

**Archivo:** `BaseLoading.jsx`

**Uso básico:**
```jsx
import BaseLoading from './common/BaseLoading';

<BaseLoading variant="spinner" size="md" text="Cargando..." />
```

**Variantes:** `spinner`, `dots`, `pulse`, `bars`, `fullscreen`

**Tamaños:** `sm`, `md`, `lg`, `xl`

---

## BaseBadge

**Archivo:** `BaseBadge.jsx`

**Uso básico:**
```jsx
import BaseBadge from './common/BaseBadge';
import { CheckCircle } from 'lucide-react';

<BaseBadge variant="success" icon={CheckCircle}>
  Activo
</BaseBadge>
```

**Variantes:** `default`, `primary`, `success`, `warning`, `danger`, `info`

**Tamaños:** `sm`, `md`, `lg`

**Props especiales:**
- `dot` - Punto de color
- `onRemove` - Botón de cerrar
- `rounded` - Pill shape (default: true)

---

## BaseAlert

**Archivo:** `BaseAlert.jsx`

**Uso básico:**
```jsx
import BaseAlert from './common/BaseAlert';

<BaseAlert variant="success" title="Éxito!">
  Operación completada correctamente.
</BaseAlert>
```

**Variantes:** `success`, `danger`, `warning`, `info`

**Props especiales:**
- `dismissible` - Botón de cerrar
- `onDismiss` - Callback al cerrar
- `border` - Borde izquierdo grueso

---

## BaseDropdown

**Archivo:** `BaseDropdown.jsx`

**Uso básico:**
```jsx
import BaseDropdown from './common/BaseDropdown';
import { MoreVertical, Edit, Trash } from 'lucide-react';

<BaseDropdown
  trigger={<BaseButton variant="ghost" icon={MoreVertical} />}
  items={[
    { label: 'Editar', icon: Edit, onClick: handleEdit },
    { divider: true },
    { label: 'Eliminar', icon: Trash, variant: 'danger', onClick: handleDelete }
  ]}
  align="right"
/>
```

**Alineación:** `left`, `right`, `center`

**Item props:**
- `label` - Texto del item
- `icon` - Icono
- `onClick` - Callback
- `variant` - `default`, `danger`, `success`
- `disabled` - Deshabilitar item
- `divider` - Separador (solo `{ divider: true }`)

---

## BaseEmptyState

**Archivo:** `BaseEmptyState.jsx`

**Uso básico:**
```jsx
import BaseEmptyState from './common/BaseEmptyState';
import BaseButton from './common/BaseButton';
import { FileText, Plus } from 'lucide-react';

<BaseEmptyState
  icon={FileText}
  title="No hay cursos"
  description="Comienza creando tu primer curso"
  action={
    <BaseButton variant="primary" icon={Plus}>
      Crear Curso
    </BaseButton>
  }
/>
```

**Tamaños:** `sm`, `md`, `lg`

---

## 🎨 Design Tokens

**Archivo:** `src/config/designTokens.js`

```jsx
import { colors, spacing, tw } from '../config/designTokens';

// Colores
colors.primary[600]
colors.success
colors.error

// Helpers de Tailwind
tw.bg.primary
tw.text.secondary
tw.button.primary
tw.input.base
tw.badge.success
```

---

## 📚 Recursos

- **Documentación completa:** `CODING_STANDARDS.md`
- **Design Tokens:** `src/config/designTokens.js`
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Lucide Icons:** https://lucide.dev/icons

---

## ✅ Reglas de Uso

1. **SIEMPRE** usar componentes base en lugar de HTML nativo
2. **NUNCA** crear componentes custom sin revisar si existe un base component
3. **SIEMPRE** funciona en dark mode
4. **100%** Tailwind CSS (sin archivos .css custom)
5. Si necesitas una nueva variante, extiende el componente base existente

---

**Última actualización:** 2025-11-06
