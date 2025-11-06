# 📘 XIWEN App - Coding Standards Quick Reference

**✅ Claude Code Web Users**: ¡Perfecto! Estás leyendo este archivo desde `.claude/CODING_STANDARDS_QUICK.md`

**📍 Ubicación**: Este archivo está en `.claude/` porque Claude Code Web tiene mejor acceso a archivos en subdirectorios que en la raíz del proyecto.

**📖 Versión Completa**: Si necesitas más detalles, el archivo completo está en `CODING_STANDARDS.md` en la raíz (22KB), pero este Quick Reference contiene todo lo esencial.

---

## 🎯 8 Core Rules

### REGLA #1: 100% Tailwind CSS - CERO CSS Custom
- ✅ **SIEMPRE**: Usar Tailwind classes
- ❌ **NUNCA**: Crear archivos .css custom
- ❌ **NUNCA**: Usar style={{ }} inline

### REGLA #2: BaseModal para TODOS los modales
- ✅ **SIEMPRE**: `import { BaseModal } from '../common'`
- ❌ **NUNCA**: Crear modales custom

### REGLA #3: SIEMPRE usar componentes base
**Disponibles en `src/components/common/`:**
- `BaseButton` - 7 variants (primary, secondary, success, danger, warning, ghost, outline)
- `BaseInput` - Con validación, iconos, password toggle
- `BaseSelect` - Selector con validación
- `BaseTextarea` - Text area con validación
- `BaseCard` - Cards flexibles (image, icon, avatar, badges, stats, actions)
- `BaseModal` - Modales completos (ya existía)
- `BaseBadge` - 6 variants (default, primary, success, warning, danger, info)
- `BaseLoading` - 5 variants (spinner, dots, pulse, bars, fullscreen)
- `BaseAlert` - 4 variants (success, danger, warning, info)
- `BaseDropdown` - Menús desplegables
- `BaseEmptyState` - Estados vacíos

**Import:**
```javascript
import {
  BaseButton,
  BaseCard,
  BaseModal,
  BaseBadge,
  BaseLoading,
  BaseAlert,
  BaseEmptyState
} from '../common';
```

### REGLA #4: Custom Hooks para lógica compartida
Extraer a `src/hooks/`:
- `useCourses.js` - Fetch de cursos
- `useStudents.js` - Fetch de estudiantes
- `useAuth.js` - Estado de autenticación

### REGLA #5: Componentes DRY (Don't Repeat Yourself)
- Si se repite 2+ veces → Extraer componente
- Si la lógica se repite 2+ veces → Extraer hook

### REGLA #6: NUNCA usar console.* - Usar logger
```javascript
import logger from '../../utils/logger';

// ✅ Correcto
logger.debug('Mensaje de debug');
logger.info('Información');
logger.warn('Advertencia');
logger.error('Error', errorObject);

// ❌ Incorrecto
console.log('Mensaje');
console.error('Error');
```

### REGLA #7: Async/Await con Try-Catch
```javascript
const fetchData = async () => {
  try {
    const data = await getData();
    setData(data);
  } catch (err) {
    logger.error('Error:', err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

### REGLA #8: Siempre soportar Dark Mode
```javascript
// ✅ Correcto
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">

// ❌ Incorrecto
<div className="bg-white text-gray-900">
```

---

## 🎨 Design Tokens

**Archivo**: `src/config/designTokens.js`

**Uso en componentes base**:
```javascript
import { tw } from '../../config/designTokens';

<button className={tw.button.primary}>Click</button>
<div className={tw.bg.primary}>Content</div>
```

---

## 📝 Ejemplos Rápidos

### BaseButton
```javascript
<BaseButton variant="primary" size="md" icon={Plus}>
  Crear Nuevo
</BaseButton>

<BaseButton variant="danger" loading={isDeleting}>
  Eliminar
</BaseButton>
```

### BaseCard
```javascript
<BaseCard
  image={imageUrl}
  title="Curso de React"
  badges={[<BaseBadge variant="success">Activo</BaseBadge>]}
  onClick={() => handleClick()}
  hover
>
  <p>Descripción del curso</p>
  <BaseButton variant="primary" fullWidth>
    Ver Más
  </BaseButton>
</BaseCard>
```

### BaseLoading
```javascript
{loading && <BaseLoading variant="fullscreen" text="Cargando..." />}
{loading && <BaseLoading variant="spinner" size="lg" />}
```

### BaseEmptyState
```javascript
<BaseEmptyState
  icon={BookOpen}
  title="No hay cursos"
  description="Crea tu primer curso para comenzar"
  action={
    <BaseButton variant="primary" onClick={handleCreate}>
      Crear Curso
    </BaseButton>
  }
/>
```

---

## ✅ Checklist para PRs

Antes de hacer commit, verificar:

- [ ] ✅ 100% Tailwind CSS (sin archivos .css custom)
- [ ] ✅ Todos los componentes usan Base Components
- [ ] ✅ Dark mode funciona correctamente
- [ ] ✅ Sin console.* (solo logger)
- [ ] ✅ Custom hooks extraídos si hay lógica compartida
- [ ] ✅ Async/await con try-catch
- [ ] ✅ Imports organizados (React, third-party, local)
- [ ] ✅ `npm run build` pasa sin errores

---

## 🔗 Ver Documento Completo

**Archivo completo**: `CODING_STANDARDS.md` (22KB)

Contiene:
- Ejemplos detallados de cada componente
- Props completas de cada componente base
- Patrones de arquitectura
- Mejores prácticas de Firebase
- Ejemplos de refactoring

---

**Última actualización**: 2025-11-06
**Versión**: 2.0 (Quick Reference)
