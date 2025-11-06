# 🔐 Firestore Security Rules - Guía de Implementación

## ⚠️ IMPORTANTE - ACCIÓN REQUERIDA

Las reglas de seguridad actuales (`firestore.rules`) están **COMPLETAMENTE ABIERTAS**, lo que significa que **cualquier usuario autenticado puede leer y modificar TODOS los datos** en Firestore.

**Esto es un RIESGO DE SEGURIDAD CRÍTICO para producción.**

---

## 📋 Pasos para Implementar las Reglas Seguras

### **Opción 1: Despliegue Manual (Firebase Console)**

1. **Abrir Firebase Console:**
   - Ve a https://console.firebase.google.com
   - Selecciona tu proyecto XIWENAPP

2. **Ir a Firestore Database:**
   - En el menú lateral: `Firestore Database` → `Rules`

3. **Copiar las nuevas reglas:**
   - Abre el archivo `firestore.rules.secure`
   - Copia TODO el contenido

4. **Pegar en la consola:**
   - Pega en el editor de reglas de Firebase
   - Click en "Publish"

5. **Verificar:**
   - Las reglas entrarán en efecto inmediatamente
   - Prueba que los usuarios solo puedan acceder a sus propios datos

---

### **Opción 2: Despliegue con Firebase CLI (Recomendado)**

```bash
# 1. Instalar Firebase CLI (si no lo tienes)
npm install -g firebase-tools

# 2. Login a Firebase
firebase login

# 3. Renombrar archivos
mv firestore.rules firestore.rules.old
mv firestore.rules.secure firestore.rules

# 4. Desplegar SOLO las reglas de Firestore
firebase deploy --only firestore:rules

# 5. Verificar en consola
firebase firestore:rules get
```

---

## 🛡️ Qué Hacen las Nuevas Reglas

### **Antes (firestore.rules - INSEGURO):**
```javascript
// ❌ CUALQUIER usuario autenticado puede hacer CUALQUIER COSA
match /{document=**} {
  allow read, write: if request.auth != null;
}
```

### **Después (firestore.rules.secure - SEGURO):**

| Colección | Leer | Crear | Actualizar | Eliminar |
|-----------|------|-------|------------|----------|
| **users** | Solo tú, profesores y admins | Profesores/admins | Solo tú (excepto rol) | Solo admins |
| **students** | Tú, profesores, admins | Profesores/admins | Profesores/admins | Solo admins |
| **courses** | Todos autenticados | Profesores/admins | Creador o admin | Creador o admin |
| **content** | Todos autenticados | Profesores/admins | Creador o admin | Creador o admin |
| **exercises** | Todos autenticados | Profesores/admins | Creador o admin | Creador o admin |
| **game_sessions** | Participantes | Profesores/admins | Participantes | Profesor/admin |
| **enrollments** | Estudiante, profesores | Profesores/admins | Profesores/admins | Profesores/admins |
| **whiteboard_sessions** | Todos | Todos | Creador/admin | Creador/admin |
| **credits** | Dueño, profesores | Profesores/admins | Solo admins | Solo admins |
| **groups** | Todos | Profesores/admins | Creador/admin | Creador/admin |
| **analytics** | Profesores/admins | Profesores/admins | Admins | Admins |

---

## 🧪 Testing de las Reglas

### **Método 1: Firebase Rules Simulator (Consola)**

1. En Firebase Console → Firestore → Rules
2. Click en "Rules Playground"
3. Simula operaciones:
   ```
   Tipo: get
   Ubicación: /users/USER_ID
   Usuario autenticado: true
   UID: USER_ID
   ```

### **Método 2: Testing Local con Firebase Emulator**

```bash
# 1. Instalar emulators
firebase init emulators

# 2. Iniciar emulator con las nuevas reglas
firebase emulators:start

# 3. Tu app se conectará al emulator automáticamente en desarrollo
```

---

## ⚠️ Problemas Comunes y Soluciones

### **Error: "permission-denied" después de desplegar**

**Causa:** Las reglas están funcionando correctamente, bloqueando accesos no autorizados.

**Solución:**
- Verifica que el usuario tenga el rol correcto en Firestore
- Verifica que estés usando el UID correcto
- Revisa la función helper correspondiente en las reglas

### **Error: "Missing or insufficient permissions"**

**Causa:** Intentando acceder a datos sin los permisos necesarios.

**Ejemplos:**
- ❌ Estudiante intenta cambiar su propio rol
- ❌ Estudiante intenta ver datos de otro estudiante
- ❌ Profesor intenta modificar créditos

**Solución:** Implementar la operación correctamente desde el código del frontend.

---

## 🔄 Rollback (Si algo sale mal)

Si necesitas volver a las reglas anteriores:

```bash
# Opción 1: Firebase Console
# Ve a Firestore → Rules → Ver historial → Restaurar versión anterior

# Opción 2: CLI
mv firestore.rules.old firestore.rules
firebase deploy --only firestore:rules
```

---

## 📚 Funciones Helper Disponibles

Las reglas incluyen funciones helper reutilizables:

```javascript
isAuth()              // Usuario autenticado
isAdmin()             // Usuario es admin
isTeacher()           // Usuario es profesor (incluye admin)
isStudent()           // Usuario es estudiante
isOwnUser(userId)     // Es el propio usuario
isTeacherOfCourse(id) // Es el profesor del curso
isContentCreator()    // Es el creador del contenido
```

---

## 🎯 Próximos Pasos

1. ✅ **Revisar el archivo `firestore.rules.secure`**
2. ✅ **Testear en Firebase Emulator** (opcional pero recomendado)
3. ✅ **Desplegar a Firestore** usando uno de los métodos arriba
4. ✅ **Verificar que la app funciona correctamente**
5. ✅ **Monitorear logs de Firebase Console** por errores de permisos

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa los logs en Firebase Console → Firestore → Usage
2. Usa el Rules Playground para debuggear
3. Verifica que los roles en la colección `users` sean correctos
4. Asegúrate de que `import.meta.env.VITE_ADMIN_EMAIL` esté configurado correctamente

---

## ✅ Checklist de Seguridad

- [ ] Firestore Rules desplegadas
- [ ] Storage Rules actualizadas
- [ ] Admin email movido a .env
- [ ] Testing en emulator completado
- [ ] Verificación en producción realizada
- [ ] Monitoreo de logs activo

---

**Última actualización:** $(date)
**Generado por:** Claude Code
**Proyecto:** XIWENAPP
