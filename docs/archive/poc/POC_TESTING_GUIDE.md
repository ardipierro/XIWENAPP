# 🧪 Guía Rápida de Testing - POC Universal Dashboard

## 🚀 Inicio Rápido

### 1. Iniciar el servidor de desarrollo

```bash
npm run dev
```

### 2. Acceder al POC

Abre tu navegador en:
```
http://localhost:5173/dashboard-v2
```

---

## 👤 Testing por Rol

### **ADMIN** (ardipierro@gmail.com)

#### ✅ Qué deberías ver:

**TopBar:**
- 🪙 Badge de créditos: **`∞ ilimitado`** (amarillo/dorado)
- 🌙 Toggle de tema
- 🔔 Notificaciones
- 👤 Avatar con menú

**SideMenu (todos estos items):**
- 🏠 Inicio
- 📚 Mi Contenido
- ➕ Crear Contenido
- ✨ Constructor de Ejercicios
- 🎨 Design Lab
- 👥 Mis Estudiantes
- 📅 Clases
- 📦 Grupos
- 📊 Analytics
- 💬 Mensajes
- 👔 **Gestión de Usuarios** ← Solo admin
- 💳 **Gestión de Créditos** ← Solo admin
- ⚙️ **Configurar IA** ← Solo admin
- 🔧 **Configuración del Sistema** ← Solo admin

#### 🧪 Pruebas:

1. **Verificar créditos ilimitados**
   - El badge debe mostrar `∞ ilimitado`
   - No debe haber límites en ninguna acción

2. **Verificar acceso completo**
   - Todos los 18 items del menú deben estar visibles
   - Puedes navegar a cualquier sección
   - Las secciones admin-only deben ser accesibles

3. **Verificar tema oscuro**
   - Click en el icono de luna/sol
   - Todo el dashboard debe cambiar de tema
   - El badge de créditos debe mantener su visibilidad

---

### **TEACHER** (crear usuario con role='teacher')

#### ✅ Qué deberías ver:

**TopBar:**
- 🪙 Badge de créditos: **`[número] créditos`** (ej: `245 créditos`)

**SideMenu (items limitados):**
- 🏠 Inicio
- 📚 Mi Contenido
- ➕ Crear Contenido
- ✨ Constructor de Ejercicios
- 👥 Mis Estudiantes
- 📅 Clases
- 📦 Grupos
- 📊 Analytics
- 💬 Mensajes

**❌ NO deberías ver:**
- Design Lab
- Gestión de Usuarios
- Gestión de Créditos
- Configurar IA
- Configuración del Sistema

#### 🧪 Pruebas:

1. **Verificar créditos numéricos**
   - El badge debe mostrar un número (ej: `245`)
   - Si no tienes créditos, debe mostrar `0 créditos`

2. **Verificar acceso limitado**
   - Solo 9 items en el menú (vs 18 del admin)
   - Intentar navegar a `/dashboard-v2/users` → "Sin acceso"

3. **Crear créditos desde admin**
   - Login como admin
   - Ve a "Gestión de Créditos"
   - Agrega créditos al teacher
   - Vuelve al login del teacher
   - El badge debe actualizarse automáticamente (realtime)

---

### **STUDENT** (crear usuario con role='student')

#### ✅ Qué deberías ver:

**TopBar:**
- 🪙 Badge de créditos: **`[número] créditos`**

**SideMenu (muy limitado):**
- 🏠 Inicio
- 📚 Mi Contenido
- 📖 Mis Cursos
- 📝 Mis Tareas
- 🎮 Juegos
- 🏆 Logros
- 💬 Mensajes

**❌ NO deberías ver:**
- Herramientas de creación
- Gestión de estudiantes
- Gestión de clases
- Grupos
- Admin tools

#### 🧪 Pruebas:

1. **Verificar vista de consumidor**
   - Solo 7 items en el menú
   - Enfocado en consumir contenido (cursos, tareas, juegos)

2. **Verificar créditos para clases**
   - Si tienes créditos, deberías poder unirte a clases
   - Si no tienes, debería aparecer "Créditos insuficientes"

3. **Testing de deducción automática**
   - Desde admin, agrega 10 créditos al student
   - Como student, únete a una clase (costo: 1 crédito)
   - El badge debe cambiar de `10` a `9` automáticamente

---

## 🎨 Testing de UI

### **1. Responsive Design**

#### Desktop (>1024px):
- Menú lateral siempre visible
- TopBar con todos los elementos
- Content area con margen izquierdo de 260px

#### Tablet (768-1024px):
- Menú lateral oculto por defecto
- Click en hamburguesa para abrir
- Overlay oscuro al abrir menú

#### Mobile (<768px):
- TopBar compacto (altura 56px)
- Username oculto
- Solo avatar
- Menú fullscreen al abrir

### **2. Modo Oscuro**

1. Click en icono de luna (TopBar, derecha)
2. Verificar que cambian:
   - ✅ Background del dashboard
   - ✅ Colores del TopBar
   - ✅ Colores del SideMenu
   - ✅ Badge de créditos
   - ✅ Cards de contenido

### **3. CreditBadge Updates**

#### Test de actualización en tiempo real:

1. Abre dos navegadores:
   - **Navegador A**: Login como teacher
   - **Navegador B**: Login como admin

2. En Navegador B (admin):
   - Ve a "Gestión de Créditos"
   - Agrega 50 créditos al teacher

3. En Navegador A (teacher):
   - El badge debe actualizarse **automáticamente** (sin refrescar)
   - Debería ver el nuevo número de créditos

4. Si no se actualiza:
   - Revisar consola de errores
   - Verificar Firestore listener

---

## 🐛 Troubleshooting

### **Problema: No veo el badge de créditos**

**Solución:**
1. Verifica que exista `user_credits` collection en Firestore
2. Verifica que tu usuario tenga un documento en esa collection
3. Si no existe, el hook `useCredits` lo crea automáticamente con 0 créditos

### **Problema: El menú no muestra los items correctos**

**Solución:**
1. Verifica el rol del usuario en Firestore:
   ```javascript
   // En consola del navegador
   const { userRole } = useAuth()
   console.log('Current role:', userRole)
   ```

2. Verifica los permisos en `src/config/permissions.js`

3. Asegúrate de que el usuario esté autenticado:
   ```javascript
   const { user, loading } = useAuth()
   console.log('User:', user, 'Loading:', loading)
   ```

### **Problema: "Cannot find module" al importar**

**Solución:**
```bash
# Detener servidor
Ctrl+C

# Limpiar cache
rm -rf node_modules/.vite

# Reiniciar
npm run dev
```

### **Problema: El badge no se actualiza en tiempo real**

**Solución:**
1. Verifica que Firestore esté correctamente configurado
2. Revisa la consola para errores de permisos
3. Asegúrate de que el documento `user_credits/{userId}` existe

---

## 📋 Checklist de Testing Completo

### ✅ Sistema de Permisos
- [ ] Admin ve todos los menús (18 items)
- [ ] Teacher ve menús limitados (9 items)
- [ ] Student ve solo consume features (7 items)
- [ ] Guardian ve solo analytics (3 items)
- [ ] Navigation dinámica funciona correctamente

### ✅ Sistema de Créditos
- [ ] Admin ve `∞ ilimitado`
- [ ] Teacher/Student ven número de créditos
- [ ] Badge se actualiza en tiempo real
- [ ] Deducción de créditos funciona
- [ ] CreditProtectedButton muestra costo

### ✅ UI/UX
- [ ] TopBar responsive (desktop/tablet/mobile)
- [ ] SideMenu responsive
- [ ] Modo oscuro funciona
- [ ] Navegación entre vistas funciona
- [ ] Overlay en mobile funciona

### ✅ Performance
- [ ] Carga inicial rápida (<2s)
- [ ] Navegación entre vistas instantánea
- [ ] Sin lag al abrir/cerrar menú
- [ ] Badge updates sin delay notable

---

## 🎯 Testing Avanzado

### **1. Simular cambio de rol en runtime**

```javascript
// En consola del navegador (solo para testing)
import permissionService from './services/permissionService'

// Cambiar a teacher
permissionService.setRole('teacher')

// Refrescar para ver cambios
location.reload()
```

### **2. Verificar cache de créditos**

```javascript
// En consola del navegador
import creditService from './services/creditService'

// Ver cache actual
console.log(creditService.cache)

// Limpiar cache
creditService.clearCache()
```

### **3. Testing de límites de IA**

```javascript
// En consola del navegador
const { checkAILimit } = useCredits()

const result = await checkAILimit()
console.log('AI Limit:', result)
// Output: { allowed: true, remaining: 50, used: 0, limit: 50 }
```

---

## 📞 Soporte

Si encuentras algún bug o comportamiento inesperado:

1. **Revisar consola** del navegador (F12)
2. **Capturar screenshot** del problema
3. **Anotar**:
   - Rol del usuario
   - Acción realizada
   - Comportamiento esperado
   - Comportamiento actual

---

**Happy Testing! 🚀**

Última actualización: 2025-11-13
