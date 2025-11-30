# 🔧 Troubleshooting - Generador PPT ADE1

## Problema: No veo la pestaña "Generador PPT ADE1"

### ✅ Verificaciones Rápidas

#### 1. Reiniciar el servidor dev
```bash
# Detener el servidor (Ctrl+C)
# Luego reiniciar:
npm run dev
```

#### 2. Limpiar caché del navegador
- Presiona `Ctrl+Shift+R` (Windows/Linux) o `Cmd+Shift+R` (Mac)
- O abre DevTools (F12) → pestaña Network → marcar "Disable cache"

#### 3. Verificar la consola del navegador
- Presiona F12 para abrir DevTools
- Ve a la pestaña "Console"
- Busca errores en rojo
- Copia cualquier error y repórtalo

#### 4. Verificar que estás en la ruta correcta

**Paso a paso:**
1. Login como admin
2. Dashboard cargado
3. Click en "Contenidos" en el menú lateral izquierdo
4. URL debe cambiar a: `http://localhost:5173/dashboard/unified-content`
5. Deberías ver pestañas en la parte superior:
   - Contenidos
   - Exercise Builder
   - Configurar IA
   - FlashCards
   - Libro ADE 1
   - **Generador PPT ADE1** ← Esta es la nueva
   - Visor de Contenidos

#### 5. Verificar permisos del usuario

En la consola del navegador, ejecuta:
```javascript
// Ver rol del usuario
console.log('Rol:', user.role);

// Ver si tiene permiso create-content
// (debe retornar true para admin)
```

### 🐛 Errores Comunes

#### Error: "Cannot find module './SlidePackageGenerator'"
**Solución:** Reiniciar servidor dev

#### Error: "Failed to fetch /xiwen_contenidos/ade1_2026_content.json"
**Solución:**
- Verificar que existe: `public/xiwen_contenidos/ade1_2026_content.json`
- Si no existe, copiarlo:
```bash
cp xiwen_contenidos/ade1_2026_content.json public/xiwen_contenidos/
```

#### Las pestañas no se muestran
**Solución:**
1. Verificar que estás en `/dashboard/unified-content`
2. Hacer scroll hacia abajo (las pestañas están después del header)
3. Verificar en DevTools que el componente `BaseTabs` se está renderizando

### 📍 Ubicación del Componente

**Ruta exacta:**
```
Login → Admin Dashboard → Menu Lateral → Contenidos → Pestaña "Generador PPT ADE1"
```

**URLs:**
- Dashboard: `http://localhost:5173/dashboard`
- Contenidos: `http://localhost:5173/dashboard/unified-content`

### 🔍 Verificar Instalación

Verifica que los archivos existen:

```bash
# Componente principal
ls src/components/SlidePackageGenerator.jsx

# JSON de datos
ls public/xiwen_contenidos/ade1_2026_content.json

# Configuración de tabs
grep "slide-generator" src/components/ContentManagerTabs.jsx
```

Deberías ver:
```
src/components/SlidePackageGenerator.jsx
public/xiwen_contenidos/ade1_2026_content.json
    id: 'slide-generator',
    label: 'Generador PPT ADE1',
```

### 🎯 Test Manual

Si todo lo anterior falla, prueba acceder directamente:

1. Abre DevTools (F12)
2. Ve a Console
3. Ejecuta:
```javascript
// Navegar directamente a la vista
window.location.href = '/dashboard/unified-content';
```

4. Una vez cargado, busca las pestañas visualmente


### 📸 ¿Cómo debería verse?

```
┌─────────────────────────────────────────────────────────┐
│ 📦 Gestión de Contenidos                                │
│ Administra contenidos, ejercicios y material educativo  │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Contenidos | Exercise Builder | Configurar IA |        │
│ FlashCards | Libro ADE 1 | 📦 Generador PPT ADE1 |    │  ← Aquí
│ Visor de Contenidos                                     │
└─────────────────────────────────────────────────────────┘

[Contenido de la pestaña activa aquí]
```

### 🆘 Si Nada Funciona

1. **Verificar commit:**
```bash
git log -1 --oneline
# Debería mostrar: "feat: Add SlidePackageGenerator for ADE1 PowerPoint slides"
```

2. **Reinstalar dependencias:**
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

3. **Verificar estado de git:**
```bash
git status
# Debería estar limpio (no cambios pendientes)
```

4. **Build de prueba:**
```bash
npm run build
# Si hay errores de compilación, se mostrarán aquí
```

### 📝 Info de Debug para Reportar

Si el problema persiste, proporciona esta información:

1. **URL actual:** (copiar de la barra del navegador)
2. **Rol del usuario:** (visible en TopBar)
3. **Errores de consola:** (F12 → Console → screenshot)
4. **Screenshot de la vista** completa
5. **Versión del navegador:** Chrome/Firefox/Safari + versión

### ✅ Checklist Final

- [ ] Servidor dev corriendo (`npm run dev`)
- [ ] Usuario logueado como admin
- [ ] URL: `/dashboard/unified-content`
- [ ] No hay errores en consola (F12)
- [ ] Archivo JSON existe en `public/xiwen_contenidos/`
- [ ] Caché del navegador limpiado (Ctrl+Shift+R)
- [ ] Git commit presente (a184878)

---

**Si todo lo anterior está OK pero aún no ves la pestaña:**
Contacta con soporte y proporciona la info de debug de arriba.
