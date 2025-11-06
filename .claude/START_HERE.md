# 🚀 START HERE - Claude Code Web

**✅ ¡Bienvenido Claude Code Web!** Este directorio (`.claude/`) contiene todos los documentos que necesitas.

---

## 📚 Archivos de Documentación Disponibles

### 1️⃣ **MASTER_STANDARDS.md** (DOCUMENTO MAESTRO - LEER PRIMERO)
**Ruta:** `.claude/MASTER_STANDARDS.md`

**⭐ Este es el archivo MAESTRO que unifica TODO:**
- 🎯 Las 8 reglas core de código
- 🎨 Sistema de diseño visual completo
- 🧩 Los 11 componentes base con ejemplos
- 🌙 Dark mode obligatorio
- 📝 Logger en lugar de console.*
- ✅ Checklist completo para PRs
- 💡 Ejemplo de componente completo

**Fuentes:** CODING_STANDARDS.md + DESIGN_SYSTEM.md + designTokens.js

**Cuándo leer:** SIEMPRE antes de escribir código

---

### 2️⃣ **CODING_STANDARDS_QUICK.md** (Quick Reference)
**Ruta:** `.claude/CODING_STANDARDS_QUICK.md`

**Contiene:**
- 🎯 Las 8 reglas core (versión corta)
- Ejemplos rápidos
- Imports básicos

**Cuándo leer:** Si solo necesitas un recordatorio rápido

---

### 3️⃣ **BASE_COMPONENTS.md** (Referencia de Componentes)
**Ruta:** `.claude/BASE_COMPONENTS.md`

**Contiene:**
- 🧩 11 componentes base disponibles
- 📋 Props de cada componente
- 💡 Ejemplos de uso
- 🎨 Variantes y estilos

**Cuándo leer:** Cuando necesites usar botones, cards, modales, inputs, etc.

**Nota:** Toda esta info también está en MASTER_STANDARDS.md

---

### 4️⃣ **README.md** (Estructura del Proyecto)
**Ruta:** `.claude/README.md`

**Contiene:**
- 📁 Estructura de carpetas
- 🗂️ Ubicación de archivos
- 📝 Lista completa de documentación
- 🎯 Componentes ya refactorizados

**Cuándo leer:** Para entender la estructura del proyecto

---

## 🎯 Flujo de Trabajo Recomendado

### Si vas a crear/modificar un componente:

1. **Lee:** `.claude/CODING_STANDARDS_QUICK.md`
2. **Consulta:** `.claude/BASE_COMPONENTS.md`
3. **Implementa** usando:
   - ✅ 100% Tailwind CSS
   - ✅ Componentes base (NO HTML nativo)
   - ✅ Dark mode (`dark:` classes)
   - ✅ Logger (NO console.*)

### Si vas a refactorizar código existente:

1. **Lee:** `.claude/CODING_STANDARDS_QUICK.md`
2. **Identifica:** Qué componentes base usar
3. **Reemplaza:**
   - CSS custom → Tailwind classes
   - HTML nativo → Base components
   - console.* → logger
   - Añade dark mode si falta

---

## 🧩 Componentes Base Disponibles

Importa desde `'../common'` o `'../../components/common'`:

```javascript
import {
  BaseButton,      // 7 variants
  BaseCard,        // Flexible cards
  BaseModal,       // Modales completos
  BaseInput,       // Inputs con validación
  BaseSelect,      // Selectores
  BaseTextarea,    // Text areas
  BaseBadge,       // Tags/badges
  BaseLoading,     // 5 loading states
  BaseAlert,       // Alertas
  BaseDropdown,    // Menús
  BaseEmptyState   // Estados vacíos
} from '../common';
```

---

## ✅ Checklist Rápido

Antes de escribir código, verifica que cumples:

- [ ] ✅ Leí CODING_STANDARDS_QUICK.md
- [ ] ✅ Voy a usar 100% Tailwind (sin .css custom)
- [ ] ✅ Voy a usar componentes base
- [ ] ✅ Voy a añadir dark mode
- [ ] ✅ Voy a usar logger en lugar de console.*

---

## 📍 Ubicación de Archivos Importantes

### Componentes Base:
- **Código fuente:** `src/components/common/*.jsx`
- **Index (exports):** `src/components/common/index.js`

### Design Tokens:
- **Config:** `src/config/designTokens.js`

### Hooks Custom:
- **Directorio:** `src/hooks/`

### Firebase:
- **Directorio:** `src/firebase/`

### Utils:
- **Logger:** `src/utils/logger.js`

---

## 🎨 Ejemplo Rápido de Componente Correcto

```javascript
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import logger from '../../utils/logger';
import {
  BaseButton,
  BaseCard,
  BaseModal,
  BaseLoading,
  BaseEmptyState,
  BaseBadge
} from '../common';

function MyComponent() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);

  const handleCreate = async () => {
    try {
      setLoading(true);
      // ... lógica
      logger.info('Item creado exitosamente');
    } catch (err) {
      logger.error('Error creando item:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <BaseLoading variant="fullscreen" text="Cargando..." />;
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-900">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Mi Componente
      </h1>

      {data.length === 0 ? (
        <BaseEmptyState
          icon={Plus}
          title="No hay items"
          description="Crea tu primer item"
          action={
            <BaseButton variant="primary" icon={Plus} onClick={handleCreate}>
              Crear Item
            </BaseButton>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map(item => (
            <BaseCard
              key={item.id}
              title={item.name}
              badges={[<BaseBadge variant="success">Activo</BaseBadge>]}
              hover
            >
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {item.description}
              </p>
              <BaseButton
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={() => handleDelete(item.id)}
              >
                Eliminar
              </BaseButton>
            </BaseCard>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyComponent;
```

---

## 🚨 Errores Comunes a Evitar

### ❌ NO HACER:
```javascript
// ❌ CSS custom
<div className="custom-button">Click</div>

// ❌ HTML nativo
<button style={{ color: 'blue' }}>Click</button>

// ❌ Sin dark mode
<div className="bg-white text-black">Content</div>

// ❌ console.*
console.log('Debug');
console.error('Error');
```

### ✅ HACER:
```javascript
// ✅ Componente base
<BaseButton variant="primary">Click</BaseButton>

// ✅ Tailwind con dark mode
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
  Content
</div>

// ✅ Logger
import logger from '../../utils/logger';
logger.debug('Debug');
logger.error('Error', errorObject);
```

---

## 📞 ¿Dudas?

1. Consulta `.claude/CODING_STANDARDS_QUICK.md` para reglas
2. Consulta `.claude/BASE_COMPONENTS.md` para componentes
3. Consulta `.claude/README.md` para estructura

---

**Última actualización:** 2025-11-06
**Versión:** 1.0
