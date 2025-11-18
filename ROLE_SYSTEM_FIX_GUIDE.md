# 🔧 Guía de Corrección del Sistema de Roles

## 📋 Resumen del Problema

Se detectó que algunos **estudiantes tienen rol de `admin`** en sus perfiles de usuario, lo que causa que vean pestañas incorrectas:
- ❌ Pestaña "Estudiantes" (solo para profesores/admins)
- ❌ Pestaña "Créditos" (se mostraba para todos sin validación)
- ❌ En lugar de las pestañas correctas: "Clases", "Tareas", "Logros", "Puntos"

---

## 🔍 Análisis Realizado

### Problemas Identificados

#### 1. **Bug Crítico: Comparación de perfil propio**
**Archivo**: `src/components/UserProfileModal.jsx:93`

```javascript
// ❌ ANTES (siempre true)
const isOwnProfile = user?.uid === user?.uid;

// ✅ DESPUÉS (correcto)
const isOwnProfile = currentUser?.uid === user?.uid;
```

**Impacto**: Los usuarios podían ver controles de edición en perfiles ajenos.

---

#### 2. **Bug Crítico: Lógica de pestañas sin validación robusta**
**Archivo**: `src/components/UserProfileModal.jsx:286-381`

**Problema**: La función `getTabs()` no validaba correctamente los roles:
- ✅ Pestaña "Créditos" se mostraba para TODOS sin condición
- ✅ Pestaña "Estudiantes" aparecía si `userRole === 'admin'` (incluso para estudiantes con rol corrupto)

**Solución Implementada**:
```javascript
// Normalizar y validar roles
const normalizedRole = (userRole || '').toLowerCase();

// Definir grupos de roles
const isStudent = ['student', 'listener', 'trial'].includes(normalizedRole);
const isTeacher = ['teacher', 'trial_teacher'].includes(normalizedRole);
const isGuardian = normalizedRole === 'guardian';
const isAdminRole = normalizedRole === 'admin';

// Validación defensiva para pestaña "Estudiantes"
if ((isTeacher || isAdminRole) && !isStudent) {
  // Solo mostrar si es profesor/admin Y NO es estudiante
  tabs.push({ ... });
}
```

---

#### 3. **Datos Corruptos en Firestore**
**Causa Raíz**: Algunos usuarios en Firestore tienen `role: 'admin'` cuando deberían tener `role: 'student'`.

**Nota**: El código de creación de usuarios (`createUser`, `AddUserModal`) funciona correctamente. El problema está en datos históricos incorrectos.

---

## ✅ Correcciones Implementadas

### 1. **Código Corregido**
- ✅ `UserProfileModal.jsx`: Comparación correcta de `isOwnProfile`
- ✅ `UserProfileModal.jsx`: Lógica de pestañas con validación robusta y normalización
- ✅ Defensas contra datos inconsistentes

### 2. **Script de Migración**
Creado: `scripts/fix-user-roles.js`

**Funciones disponibles**:
- `scanUserRoles()`: Escanea y reporta problemas
- `fixUserRoles(dryRun)`: Corrige roles (con modo prueba)
- `generateRoleReport()`: Genera reporte detallado

---

## 🚀 Cómo Usar el Script de Corrección

### Opción 1: Desde la Consola del Navegador (Recomendado)

1. **Abrir la aplicación** como administrador
2. **Abrir DevTools** (F12)
3. **Ir a Console**
4. **Copiar y pegar** el siguiente código:

```javascript
// Importar funciones (ajustar ruta según tu estructura)
import { scanUserRoles, fixUserRoles, generateRoleReport } from './scripts/fix-user-roles.js';

// PASO 1: Generar reporte de problemas
await generateRoleReport();

// PASO 2: Simular corrección (NO aplica cambios)
const testResult = await fixUserRoles(true);
console.log('Resultado de prueba:', testResult);

// PASO 3: Aplicar correcciones REALES
// ⚠️ ADVERTENCIA: Esto modificará la base de datos
const realResult = await fixUserRoles(false);
console.log('Corrección aplicada:', realResult);
```

---

### Opción 2: Desde Firebase Cloud Functions

Si tienes acceso a Firebase Functions:

```javascript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { scanUserRoles, fixUserRoles } from './fix-user-roles';

admin.initializeApp();

// Function para escanear
export const scanRoles = functions.https.onRequest(async (req, res) => {
  const result = await scanUserRoles();
  res.json(result);
});

// Function para corregir (solo admins)
export const fixRoles = functions.https.onCall(async (data, context) => {
  // Verificar que el usuario es admin
  if (!context.auth || !isAdmin(context.auth.uid)) {
    throw new functions.https.HttpsError('permission-denied', 'Solo admins');
  }

  const dryRun = data.dryRun ?? true;
  const result = await fixUserRoles(dryRun);
  return result;
});
```

---

### Opción 3: Corrección Manual en Firebase Console

Si prefieres corregir manualmente:

1. **Abrir Firebase Console** → Firestore Database
2. **Ir a colección `users`**
3. **Buscar documentos** con `role: 'admin'`
4. **Verificar cada uno**:
   - Si el email NO es de un admin real → Cambiar `role` a `'student'`
   - Si el email SÍ es de un admin → Dejarlo como `'admin'`

---

## 🔐 Configuración de Admins Reales

**IMPORTANTE**: Antes de ejecutar el script, configurar la lista de emails de administradores reales.

**Archivo**: `scripts/fix-user-roles.js`

```javascript
// Lista de emails de administradores reales
const ADMIN_EMAILS = [
  'admin@xiwen.com',
  'tu-email-admin@ejemplo.com',
  // Agregar más aquí
];
```

---

## 📊 Reporte de Ejemplo

```
📋 ===== REPORTE DE ROLES DE USUARIO =====

Total de usuarios: 50
✅ Roles correctos: 45
⚠️ Roles incorrectos: 5

🔍 Problemas detectados:

1. estudiante1@ejemplo.com
   Usuario: Juan Pérez (ID: abc123)
   Rol actual: admin
   Rol sugerido: student
   Razón: Email no autorizado como administrador

2. estudiante2@ejemplo.com
   Usuario: María García (ID: def456)
   Rol actual: admin
   Rol sugerido: student
   Razón: Email no autorizado como administrador

...

💡 Para corregir estos problemas:
   1. Modo prueba (sin cambios): fixUserRoles(true)
   2. Aplicar correcciones: fixUserRoles(false)
```

---

## 🧪 Proceso Recomendado

### Paso 1: Verificar el Problema
```javascript
await generateRoleReport();
```

### Paso 2: Prueba en Seco
```javascript
const testResult = await fixUserRoles(true);
console.log('Cambios propuestos:', testResult.changes);
```

### Paso 3: Revisar Cambios Propuestos
- Verificar que los cambios son correctos
- Confirmar que no se afectan usuarios legítimos

### Paso 4: Aplicar Correcciones
```javascript
const result = await fixUserRoles(false);
console.log(`✅ ${result.totalFixed} roles corregidos`);
```

---

## 🔒 Prevención Futura

### 1. Firestore Security Rules
Agregar validación en las reglas:

```javascript
match /users/{userId} {
  allow update: if (
    // Solo admins pueden cambiar roles
    request.auth != null &&
    (
      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
    ) ||
    // O el campo 'role' no está siendo modificado
    !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role'])
  );
}
```

### 2. Validación en el Backend
Agregar validación al actualizar usuarios:

```javascript
// En updateUser()
if (updates.role && !isAdmin(currentUserId)) {
  throw new Error('Solo administradores pueden cambiar roles');
}
```

### 3. Auditoría Regular
Ejecutar el script de escaneo periódicamente:

```javascript
// Cada mes
await generateRoleReport();
```

---

## 📝 Cambios en el Código

### Archivos Modificados
1. ✅ `src/components/UserProfileModal.jsx`
   - Línea 93: Corregido `isOwnProfile`
   - Líneas 286-381: Mejorada función `getTabs()`

### Archivos Creados
2. ✅ `scripts/fix-user-roles.js` - Script de migración
3. ✅ `ROLE_SYSTEM_FIX_GUIDE.md` - Esta guía

---

## ❓ Preguntas Frecuentes

### ¿Es seguro ejecutar el script?
Sí, el script tiene un modo de prueba (`dryRun=true`) que simula los cambios sin aplicarlos. Siempre ejecuta primero en modo prueba.

### ¿Puedo deshacer los cambios?
El script guarda metadatos en cada usuario corregido:
- `roleFixedAt`: Timestamp de la corrección
- `roleFixedReason`: Razón del cambio

### ¿Qué pasa si un estudiante necesita ser admin?
Agrégalo a la lista `ADMIN_EMAILS` en el script antes de ejecutarlo.

### ¿Cuánto tiempo toma?
Depende del número de usuarios:
- Escaneo: ~1-2 segundos por cada 100 usuarios
- Corrección: ~2-3 segundos por cada 100 usuarios

---

## 🆘 Soporte

Si encuentras problemas:
1. Revisa los logs en la consola
2. Verifica que tienes permisos de admin
3. Asegúrate de que la lista `ADMIN_EMAILS` está correcta
4. Contacta al equipo de desarrollo

---

## ✅ Checklist de Implementación

- [x] Código corregido en `UserProfileModal.jsx`
- [x] Script de migración creado
- [x] Documentación completa
- [ ] Configurar `ADMIN_EMAILS` en el script
- [ ] Ejecutar reporte inicial
- [ ] Ejecutar corrección en modo prueba
- [ ] Revisar cambios propuestos
- [ ] Aplicar correcciones
- [ ] Verificar que los usuarios afectados ahora ven las pestañas correctas
- [ ] Implementar reglas de seguridad (opcional)
- [ ] Programar auditorías regulares (opcional)

---

**Fecha de creación**: 2025-01-XX
**Versión**: 1.0.0
**Autor**: Sistema de Análisis Automatizado
