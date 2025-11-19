# 🗑️ Directiva de Diseño: Botón Eliminar Unificado

**Fecha**: 2025-01-19
**Estado**: ✅ Implementado
**Versión**: 1.0

---

## 📋 Resumen

Esta directiva establece el **diseño y ubicación estándar** del botón eliminar en **TODAS las tarjetas (cards)** de la aplicación XIWENAPP.

### Objetivo
- ✅ **Consistencia visual** en toda la aplicación
- ✅ **Ubicación predecible** (siempre en el mismo lugar)
- ✅ **Fácil mantenimiento** (un solo componente)
- ✅ **Configurable** desde el Universal Card System

---

## 📍 Reglas de Ubicación

### ✅ OBLIGATORIO: Esquina Inferior Izquierda

El botón eliminar **SIEMPRE** debe aparecer en:
- **Ubicación**: Esquina inferior IZQUIERDA del footer de la tarjeta
- **Justificación**: `justify-start` o `flex-start`
- **Separación**: Línea divisoria (`border-top`) opcional

### ❌ PROHIBIDO

- ❌ Botón eliminar en esquina superior derecha
- ❌ Botón eliminar en el medio del footer
- ❌ Botón eliminar mezclado con otros botones de acción
- ❌ Múltiples estilos de botón eliminar en la misma vista

---

## 🎨 Estilos Disponibles

El sistema soporta **4 variantes configurables** desde `cardConfig.js`:

### 1. **Solid** (⭐ RECOMENDADO - Por defecto)
```javascript
variant: 'solid'
```
- Fondo: `bg-red-500/10` → hover: `bg-red-500`
- Ícono: `text-red-600` → hover: `text-white`
- Borde: `border-red-500/20`
- **Uso**: Para todas las tarjetas principales (contenidos, usuarios, cursos)

### 2. **Outlined**
```javascript
variant: 'outlined'
```
- Fondo: `bg-transparent` → hover: `bg-red-50`
- Ícono: `text-red-600`
- Borde: `border-2 border-red-500`
- **Uso**: Para tarjetas con fondos de color

### 3. **Ghost**
```javascript
variant: 'ghost'
```
- Fondo: `bg-transparent` → hover: `bg-zinc-100`
- Ícono: `text-zinc-600` → hover: `text-red-600`
- Borde: Transparente
- **Uso**: Para interfaces minimalistas o con muchos botones

### 4. **Danger**
```javascript
variant: 'danger'
```
- Fondo: `bg-red-500` → hover: `bg-red-600`
- Ícono: `text-white`
- Borde: `border-red-600`
- **Uso**: Para acciones críticas y destructivas inmediatas

---

## 💻 Implementación

### Opción A: Usar UniversalCard (✅ RECOMENDADO)

```jsx
import { UniversalCard } from './components/cards';

<UniversalCard
  variant="content"  // o 'user', 'default', etc.
  title="Mi contenido"
  onDelete={() => handleDelete(id)}  // ← Automático!
  deleteConfirmMessage="¿Eliminar este contenido?"  // Opcional
  // ... otras props
>
  {/* contenido */}
</UniversalCard>
```

**¿Cómo funciona?**
- Al pasar `onDelete`, UniversalCard renderiza automáticamente `CardDeleteButton`
- Ubicación: Esquina inferior IZQUIERDA del footer
- Variante y tamaño: Configurados desde `cardConfig.js`

---

### Opción B: Usar CardDeleteButton directamente

Para componentes que NO usan UniversalCard:

```jsx
import { CardDeleteButton } from './components/cards';

<CardDeleteButton
  onDelete={() => handleDelete(id)}
  variant="solid"  // 'solid' | 'outlined' | 'ghost' | 'danger'
  size="md"        // 'sm' | 'md' | 'lg'
  confirmMessage="¿Eliminar este elemento?"
  requireConfirm={true}  // Pedir confirmación
  disabled={false}
/>
```

**Ubicación manual (IMPORTANTE)**:
```jsx
<div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-start">
  <CardDeleteButton {...props} />
</div>
```

---

## ⚙️ Configuración Global

### Cambiar el estilo para TODAS las tarjetas

Editar `src/components/cards/cardConfig.js`:

```javascript
export const cardVariants = {
  default: {
    // ... otras configs
    deleteButton: {
      enabled: true,         // Mostrar botón eliminar
      variant: 'solid',      // Cambiar a 'outlined', 'ghost', 'danger'
      size: 'md',            // Tamaño: 'sm', 'md', 'lg'
      position: 'footer-left',  // Siempre esquina inferior izquierda
      requireConfirm: true,  // Pedir confirmación antes de eliminar
    },
  },

  // Repetir para: user, class, content, compact
  user: {
    // ...
    deleteButton: { ... }
  },
  // ...
}
```

### Deshabilitar en variantes específicas

```javascript
stats: {
  // ... otras configs
  deleteButton: {
    enabled: false,  // ← Stats cards normalmente no se eliminan
    // ...
  },
}
```

---

## 📐 Tamaños Recomendados

| Tamaño | Dimensión | Uso |
|--------|-----------|-----|
| `sm` | 32px (w-8 h-8) | Cards compactas, listas densas |
| `md` | 40px (w-10 h-10) | **Default** - Cards estándar |
| `lg` | 48px (w-12 h-12) | Cards grandes, elementos destacados |

---

## ✅ Ejemplos de Uso

### Ejemplo 1: UnifiedContentManager
```jsx
<UniversalCard
  variant="content"
  title={content.title}
  onDelete={() => handleDeleteContent(content.id)}
  deleteConfirmMessage={`¿Eliminar "${content.title}"?`}
  actions={[
    <BaseButton key="edit" onClick={handleEdit}>Editar</BaseButton>
  ]}
/>
```

**Resultado**:
```
┌─────────────────────────────┐
│  [Imagen]                   │
├─────────────────────────────┤
│  Título                     │
│  Descripción...             │
│                             │
│  Badges | Meta info         │
├─────────────────────────────┤
│  [🗑️]            [Editar]  │  ← Delete left, actions right
└─────────────────────────────┘
```

---

### Ejemplo 2: UniversalUserManager (Grid)
```jsx
<CardDeleteButton
  onDelete={() => setUserToDelete(user)}
  variant="solid"
  size="md"
  confirmMessage={`¿Eliminar usuario "${user.name}"?`}
  requireConfirm={false}  // Usamos modal separado
/>
```

---

## 🚫 Anti-patrones (NO hacer)

### ❌ Botón mezclado con actions
```jsx
// MAL - No mezclar delete con otros actions
const actions = [
  <BaseButton onClick={handleEdit}>Editar</BaseButton>,
  <BaseButton onClick={handleDelete}>Eliminar</BaseButton>  // ❌
];
```

### ✅ Separar delete de actions
```jsx
// BIEN - Delete separado, actions aparte
<UniversalCard
  onDelete={handleDelete}  // ← Delete automático
  actions={[
    <BaseButton onClick={handleEdit}>Editar</BaseButton>
  ]}
/>
```

---

### ❌ Ubicación incorrecta
```jsx
// MAL - Delete en top-right
<div className="absolute top-2 right-2">
  <CardDeleteButton ... />  // ❌
</div>
```

### ✅ Ubicación correcta
```jsx
// BIEN - Delete en bottom-left del footer
<div className="mt-4 pt-4 border-t flex justify-start">
  <CardDeleteButton ... />  // ✅
</div>
```

---

## 🔄 Migración de Código Existente

### Antes (inconsistente)
```jsx
// Diferentes estilos en diferentes lugares
<button className="btn-danger" onClick={handleDelete}>
  <Trash2 />
</button>

<BaseButton variant="danger" icon={Trash2} onClick={handleDelete} />

<IconButton icon={<Trash2 />} onClick={handleDelete} />
```

### Después (unificado)
```jsx
// Un solo estilo, una sola ubicación
<UniversalCard
  onDelete={handleDelete}
  deleteConfirmMessage="¿Eliminar?"
/>

// o

<CardDeleteButton
  onDelete={handleDelete}
  variant="solid"  // Configurado globalmente
/>
```

---

## 📊 Componentes Actualizados

### ✅ Implementado en:
- ✅ `UniversalCard` - Soporte automático con prop `onDelete`
- ✅ `UnifiedContentManager` - Grid view
- ✅ `UniversalUserManager` - Grid view
- ✅ Sistema de configuración en `cardConfig.js`

### 🔄 Pendientes de migrar:
- ⏳ `ClassScheduleManager`
- ⏳ `AssignmentManager`
- ⏳ `FlashCardManager`
- ⏳ Otros managers con botón eliminar

---

## 🎯 Checklist para Nuevos Componentes

Al crear un nuevo componente con tarjetas:

- [ ] ¿Usa `UniversalCard`?
  - [ ] Sí → Usar prop `onDelete`
  - [ ] No → Usar `CardDeleteButton` manualmente

- [ ] ¿Ubicación correcta?
  - [ ] Esquina inferior IZQUIERDA del footer
  - [ ] Separado de otros botones de acción

- [ ] ¿Mensaje de confirmación personalizado?
  - [ ] `deleteConfirmMessage="¿Eliminar [nombre]?"`

- [ ] ¿Variante apropiada?
  - [ ] Default: `solid`
  - [ ] Tarjetas especiales: `outlined`, `ghost`, `danger`

---

## 📞 Preguntas Frecuentes

### ¿Puedo cambiar la variante para un card específico?

Sí, usando `customConfig`:
```jsx
<UniversalCard
  onDelete={handleDelete}
  customConfig={{
    deleteButton: {
      variant: 'outlined',  // Override para este card
      size: 'lg',
    }
  }}
/>
```

### ¿Cómo desactivo la confirmación?

```jsx
<CardDeleteButton
  requireConfirm={false}  // No pedir confirmación
  onDelete={handleDelete}
/>
```

### ¿Puedo cambiar la posición del botón?

**NO**. La posición está fija en `footer-left` según esta directiva de diseño. Si necesitas una posición diferente, considera si realmente es un botón de "eliminar" o si debería ser otra acción.

---

## 📄 Archivos Relacionados

- `src/components/cards/CardDeleteButton.jsx` - Componente del botón
- `src/components/cards/UniversalCard.jsx` - Integración automática
- `src/components/cards/cardConfig.js` - Configuración global
- `src/components/UnifiedContentManager.jsx` - Ejemplo de uso
- `src/components/UniversalUserManager.jsx` - Ejemplo de uso

---

## 🔍 Mantenimiento

Esta directiva debe ser revisada y actualizada cuando:
- Se agreguen nuevas variantes de cards
- Se cambien los estándares de diseño de la aplicación
- Se reciba feedback de usuarios sobre usabilidad
- Se identifiquen nuevos patrones de uso

---

**Última actualización**: 2025-01-19
**Revisado por**: Sistema de tarjetas universal
**Próxima revisión**: 2025-04-19
