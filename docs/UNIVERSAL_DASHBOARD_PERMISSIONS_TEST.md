# 🧪 Universal Dashboard - Plan de Testing de Permisos

**Fecha:** 2025-11-14
**Fase:** FASE 3 - DÍA 3
**Objetivo:** Validar que cada rol tenga acceso correcto a cada vista del Universal Dashboard

---

## 📋 Tabla de Contenidos

1. [Resumen de Roles](#resumen-de-roles)
2. [Matriz de Permisos por Ruta](#matriz-de-permisos-por-ruta)
3. [Tests por Rol](#tests-por-rol)
4. [Checklist de Testing](#checklist-de-testing)
5. [Bugs Conocidos](#bugs-conocidos)

---

## 🎭 Resumen de Roles

| Rol | Label | Jerarquía | Total Permisos |
|-----|-------|-----------|----------------|
| **admin** | Administrador | 10 | 54 permisos |
| **teacher** | Profesor | 5 | 28 permisos |
| **trial_teacher** | Profesor de Prueba | 4 | 21 permisos |
| **guest_teacher** | Profesor Invitado | 4 | 21 permisos |
| **student** | Estudiante | 3 | 13 permisos |
| **trial** | Estudiante de Prueba | 2 | 11 permisos |
| **listener** | Oyente | 1 | 8 permisos |
| **guardian** | Tutor/Padre | 3 | 8 permisos |

---

## 🗺️ Matriz de Permisos por Ruta

### Leyenda
- ✅ **Debe tener acceso**
- ❌ **NO debe tener acceso**
- ⚠️ **Acceso condicional**

| Ruta | Permiso Requerido | Admin | Teacher | Student | Guardian |
|------|-------------------|:-----:|:-------:|:-------:|:--------:|
| `/dashboard-v2` | *ninguno* | ✅ | ✅ | ✅ | ✅ |
| `/dashboard-v2/calendar` | *ninguno* | ✅ | ✅ | ✅ | ✅ |
| `/dashboard-v2/messages` | `send-messages` | ✅ | ✅ | ✅ | ❌ |
| `/dashboard-v2/unified-content` | `create-content` | ✅ | ✅ | ❌ | ❌ |
| `/dashboard-v2/exercise-builder` | `use-exercise-builder` | ✅ | ✅ | ❌ | ❌ |
| `/dashboard-v2/students` | `view-own-students` | ✅ | ✅ | ❌ | ❌ |
| `/dashboard-v2/classes` | `manage-classes` | ✅ | ✅ | ❌ | ❌ |
| `/dashboard-v2/attendance` | `view-class-analytics` | ✅ | ✅ | ❌ | ❌ |
| `/dashboard-v2/homework-review` | `grade-assignments` | ✅ | ✅ | ❌ | ❌ |
| `/dashboard-v2/my-courses` | *ninguno* | ✅ | ✅ | ✅ | ⚠️ |
| `/dashboard-v2/my-assignments` | `view-own-assignments` | ❌ | ❌ | ✅ | ❌ |
| `/dashboard-v2/games` | `play-live-games` | ❌ | ❌ | ✅ | ❌ |
| `/dashboard-v2/guardian` | *ninguno* | ⚠️ | ⚠️ | ❌ | ✅ |
| `/dashboard-v2/my-payments` | `view-own-credits` | ✅ | ✅ | ✅ | ✅ |
| `/dashboard-v2/analytics` | `view-own-analytics` | ✅ | ✅ | ✅ | ❌ |
| `/dashboard-v2/users` | `view-all-users` OR `view-own-students` | ✅ | ✅ | ❌ | ❌ |
| `/dashboard-v2/credits` | `manage-credits` | ✅ | ❌ | ❌ | ❌ |
| `/dashboard-v2/payments` | `manage-credits` | ✅ | ❌ | ❌ | ❌ |
| `/dashboard-v2/ai-config` | `configure-ai` | ✅ | ❌ | ❌ | ❌ |
| `/dashboard-v2/system-settings` | `manage-system-settings` | ✅ | ❌ | ❌ | ❌ |

**Total de rutas:** 20

---

## 🧑‍💼 Tests por Rol

### 1. Admin (Administrador)

**Acceso esperado:** ✅ TODAS las vistas (acceso total)

#### ✅ Debe tener acceso a:
- [x] `/dashboard-v2` - Home
- [x] `/dashboard-v2/calendar` - Calendario
- [x] `/dashboard-v2/messages` - Mensajes
- [x] `/dashboard-v2/unified-content` - Gestión de Contenido
- [x] `/dashboard-v2/exercise-builder` - Constructor de Ejercicios
- [x] `/dashboard-v2/students` - Gestión de Estudiantes (vía UniversalUserManager)
- [x] `/dashboard-v2/classes` - Gestión de Clases
- [x] `/dashboard-v2/attendance` - Asistencias
- [x] `/dashboard-v2/homework-review` - Revisar Tareas IA
- [x] `/dashboard-v2/my-courses` - Mis Cursos
- [x] `/dashboard-v2/my-payments` - Mis Pagos/Créditos
- [x] `/dashboard-v2/analytics` - Analytics
- [x] `/dashboard-v2/users` - Gestión Universal de Usuarios
- [x] `/dashboard-v2/credits` - Gestión de Créditos
- [x] `/dashboard-v2/payments` - Sistema de Pagos
- [x] `/dashboard-v2/ai-config` - Configurar IA
- [x] `/dashboard-v2/system-settings` - Configuración del Sistema

#### ❌ NO debe tener acceso a:
- [x] `/dashboard-v2/my-assignments` - Vista solo para estudiantes
- [x] `/dashboard-v2/games` - Vista solo para estudiantes

#### ⚠️ Acceso condicional:
- [x] `/dashboard-v2/guardian` - Solo si tiene rol guardian (no por defecto)

**Total esperado:** 17/20 vistas accesibles (85%)

---

### 2. Teacher (Profesor)

**Acceso esperado:** ✅ Vistas de gestión académica y contenido

#### ✅ Debe tener acceso a:
- [x] `/dashboard-v2` - Home
- [x] `/dashboard-v2/calendar` - Calendario
- [x] `/dashboard-v2/messages` - Mensajes
- [x] `/dashboard-v2/unified-content` - Gestión de Contenido
- [x] `/dashboard-v2/exercise-builder` - Constructor de Ejercicios
- [x] `/dashboard-v2/students` - Ver sus estudiantes
- [x] `/dashboard-v2/classes` - Gestión de Clases
- [x] `/dashboard-v2/attendance` - Asistencias
- [x] `/dashboard-v2/homework-review` - Revisar Tareas IA
- [x] `/dashboard-v2/my-courses` - Mis Cursos (como docente)
- [x] `/dashboard-v2/my-payments` - Ver sus créditos
- [x] `/dashboard-v2/analytics` - Analytics propias
- [x] `/dashboard-v2/users` - Gestión de sus estudiantes

#### ❌ NO debe tener acceso a:
- [x] `/dashboard-v2/my-assignments` - Solo estudiantes
- [x] `/dashboard-v2/games` - Solo estudiantes
- [x] `/dashboard-v2/credits` - Solo admin
- [x] `/dashboard-v2/payments` - Solo admin
- [x] `/dashboard-v2/ai-config` - Solo admin
- [x] `/dashboard-v2/system-settings` - Solo admin

#### ⚠️ Acceso condicional:
- [x] `/dashboard-v2/guardian` - Solo si tiene rol guardian

**Total esperado:** 13/20 vistas accesibles (65%)

---

### 3. Student (Estudiante)

**Acceso esperado:** ✅ Vistas de aprendizaje y progreso personal

#### ✅ Debe tener acceso a:
- [x] `/dashboard-v2` - Home
- [x] `/dashboard-v2/calendar` - Calendario
- [x] `/dashboard-v2/messages` - Mensajes
- [x] `/dashboard-v2/my-courses` - Mis Cursos
- [x] `/dashboard-v2/my-assignments` - Mis Tareas
- [x] `/dashboard-v2/games` - Juegos en Vivo
- [x] `/dashboard-v2/my-payments` - Mis Pagos/Créditos
- [x] `/dashboard-v2/analytics` - Mi progreso

#### ❌ NO debe tener acceso a:
- [x] `/dashboard-v2/unified-content` - Solo teachers/admin
- [x] `/dashboard-v2/exercise-builder` - Solo teachers/admin
- [x] `/dashboard-v2/students` - Solo teachers/admin
- [x] `/dashboard-v2/classes` - Solo teachers/admin (manage)
- [x] `/dashboard-v2/attendance` - Solo teachers/admin
- [x] `/dashboard-v2/homework-review` - Solo teachers/admin
- [x] `/dashboard-v2/guardian` - Solo guardians
- [x] `/dashboard-v2/users` - Solo teachers/admin
- [x] `/dashboard-v2/credits` - Solo admin
- [x] `/dashboard-v2/payments` - Solo admin
- [x] `/dashboard-v2/ai-config` - Solo admin
- [x] `/dashboard-v2/system-settings` - Solo admin

**Total esperado:** 8/20 vistas accesibles (40%)

---

### 4. Guardian (Tutor/Padre)

**Acceso esperado:** ✅ Vistas de monitoreo de estudiantes asignados

#### ✅ Debe tener acceso a:
- [x] `/dashboard-v2` - Home
- [x] `/dashboard-v2/calendar` - Calendario
- [x] `/dashboard-v2/guardian` - Vista de sus estudiantes asignados
- [x] `/dashboard-v2/my-payments` - Ver créditos

#### ❌ NO debe tener acceso a:
- [x] `/dashboard-v2/messages` - No tiene permiso `send-messages`
- [x] `/dashboard-v2/unified-content` - Solo teachers/admin
- [x] `/dashboard-v2/exercise-builder` - Solo teachers/admin
- [x] `/dashboard-v2/students` - Solo teachers/admin
- [x] `/dashboard-v2/classes` - Solo teachers/admin
- [x] `/dashboard-v2/attendance` - Solo teachers/admin
- [x] `/dashboard-v2/homework-review` - Solo teachers/admin
- [x] `/dashboard-v2/my-courses` - Depende de implementación
- [x] `/dashboard-v2/my-assignments` - Solo estudiantes
- [x] `/dashboard-v2/games` - Solo estudiantes
- [x] `/dashboard-v2/analytics` - No tiene `view-own-analytics`
- [x] `/dashboard-v2/users` - Solo teachers/admin
- [x] `/dashboard-v2/credits` - Solo admin
- [x] `/dashboard-v2/payments` - Solo admin
- [x] `/dashboard-v2/ai-config` - Solo admin
- [x] `/dashboard-v2/system-settings` - Solo admin

**Total esperado:** 4/20 vistas accesibles (20%)

---

## ✅ Checklist de Testing

### Fase 1: Setup de Testing
- [ ] Crear usuarios de prueba en Firebase para cada rol:
  - [ ] `admin-test@xiwen.com` (rol: admin)
  - [ ] `teacher-test@xiwen.com` (rol: teacher)
  - [ ] `student-test@xiwen.com` (rol: student)
  - [ ] `guardian-test@xiwen.com` (rol: guardian)
- [ ] Verificar que cada usuario tenga el rol correcto en Firestore
- [ ] Documentar credenciales de prueba (en archivo local, NO en repo)

### Fase 2: Testing Admin
- [ ] Iniciar sesión como admin-test
- [ ] Navegar a cada una de las 17 rutas esperadas
- [ ] Verificar que NO aparece "Sin acceso" en ninguna
- [ ] Verificar que las 2 rutas de estudiante muestran placeholder/error apropiado
- [ ] Capturar screenshots de al menos 5 vistas principales

### Fase 3: Testing Teacher
- [ ] Iniciar sesión como teacher-test
- [ ] Navegar a cada una de las 13 rutas esperadas
- [ ] Verificar funcionalidad de crear contenido
- [ ] Verificar funcionalidad de exercise builder
- [ ] Verificar que las 7 rutas admin muestran "Sin acceso"
- [ ] Capturar screenshots de vistas clave

### Fase 4: Testing Student
- [ ] Iniciar sesión como student-test
- [ ] Navegar a cada una de las 8 rutas esperadas
- [ ] Verificar que `/my-courses` muestra cursos asignados
- [ ] Verificar que `/my-assignments` muestra tareas
- [ ] Verificar que `/games` muestra juegos en vivo
- [ ] Verificar que las 12 rutas restringidas muestran "Sin acceso"
- [ ] Capturar screenshots de todas las vistas de estudiante

### Fase 5: Testing Guardian
- [ ] Iniciar sesión como guardian-test
- [ ] Navegar a cada una de las 4 rutas esperadas
- [ ] Verificar que `/guardian` muestra estudiantes asignados
- [ ] Verificar que las 16 rutas restringidas muestran "Sin acceso"
- [ ] Capturar screenshots de GuardianView

### Fase 6: Testing de Navegación
- [ ] Verificar que el menú lateral (UniversalSideMenu) solo muestra rutas permitidas para cada rol
- [ ] Verificar que los enlaces directos a rutas no permitidas redirigen apropiadamente
- [ ] Verificar que no hay errores de consola al cambiar de vista

### Fase 7: Testing de Edge Cases
- [ ] Intentar acceder a rutas no permitidas mediante URL directa
- [ ] Verificar comportamiento cuando un usuario no tiene rol asignado
- [ ] Verificar comportamiento cuando el rol es inválido
- [ ] Verificar que logout funciona correctamente desde cualquier vista

---

## 🐛 Bugs Identificados y Corregidos

### ✅ Bug 1: GuardianView sin permiso específico [CORREGIDO]
**Descripción:** La ruta `/dashboard-v2/guardian` no tenía check de permiso, renderizaba directamente.

**Impacto:** Cualquier rol podía acceder si conocía la URL.

**Fix aplicado:**
```javascript
case '/dashboard-v2/guardian':
  if (!can('view-linked-students') && !can('view-all-users')) {
    return <PlaceholderView title="Sin acceso" />;
  }
  return <GuardianView ... />;
```

**Estado:** ✅ CORREGIDO - Ahora solo guardians y admin pueden acceder

---

### ✅ Bug 2: LiveGamesView - Falsa alarma [NO ES BUG]
**Descripción:** Verificación de que `play-live-games` esté correctamente definido.

**Verificación:**
```javascript
// src/config/permissions.js
'play-live-games': ['student', 'trial', 'listener'],
```

**Estado:** ✅ NO ES BUG - Permisos correctamente configurados

---

### ✅ Bug 3: MyAssignmentsView sin check de permiso [YA ESTABA CORREGIDO]
**Descripción:** Verificación de check de permiso en MyAssignmentsView route.

**Código existente:**
```javascript
case '/dashboard-v2/my-assignments':
  if (!can('view-own-assignments')) return <PlaceholderView title="Sin acceso" />;
  return <MyAssignmentsView ... />;
```

**Estado:** ✅ YA ESTABA CORREGIDO - Check de permiso presente desde implementación inicial

---

## 📊 Resumen de Testing

| Fase | Estado | Completado |
|------|--------|------------|
| Setup | ⏳ Pendiente | 0% |
| Admin Testing | ⏳ Pendiente | 0% |
| Teacher Testing | ⏳ Pendiente | 0% |
| Student Testing | ⏳ Pendiente | 0% |
| Guardian Testing | ⏳ Pendiente | 0% |
| Navegación | ⏳ Pendiente | 0% |
| Edge Cases | ⏳ Pendiente | 0% |

**Progreso Total:** 0/7 fases completadas (0%)

---

## 🎯 Criterios de Éxito

Para considerar el testing completo y exitoso:

1. ✅ Todos los 4 roles tienen usuarios de prueba funcionales
2. ✅ Matriz de permisos validada al 100%
3. ✅ Cero bugs críticos (🔴) sin resolver
4. ✅ Todos los checks de permiso implementados correctamente
5. ✅ Navegación funciona sin errores de consola
6. ✅ Screenshots documentados para cada rol
7. ✅ Bugs conocidos documentados o resueltos

---

**Última actualización:** 2025-11-14
**Responsable:** Claude Code
**Estado general:** 🟡 En Progreso (DÍA 3)
