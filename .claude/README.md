# 📘 Claude Code - Project Documentation

## 🎯 Para Claude Code Web (Browser)

### Archivos Importantes del Proyecto:

**Documentación de Estándares:**
- `CODING_STANDARDS.md` - Documento maestro de estándares y mejores prácticas
  - **Ruta relativa desde raíz:** `./CODING_STANDARDS.md`
  - **Ruta absoluta:** `/CODING_STANDARDS.md`
  - **Comando para leer:** Usa el tool Read con path `CODING_STANDARDS.md`

**Componentes Base:**
- `src/components/common/` - Todos los componentes base reutilizables
  - `src/components/common/README.md` - Quick reference de componentes
  - `src/components/common/index.js` - Barrel exports

**Design Tokens:**
- `src/config/designTokens.js` - Fuente única de verdad para diseño

### 🔍 Cómo Encontrar Archivos:

1. **Para archivos en la raíz del proyecto:**
   ```
   CODING_STANDARDS.md
   package.json
   README.md
   ```

2. **Para archivos en subdirectorios:**
   ```
   src/components/common/BaseButton.jsx
   src/config/designTokens.js
   ```

3. **NO usar rutas absolutas de Windows:**
   ❌ `C:\Users\ardip\OneDrive\XIWEN 2025\XIWENAPP\CODING_STANDARDS.md`
   ✅ `CODING_STANDARDS.md`

### 📚 Comandos Útiles:

**Leer CODING_STANDARDS.md:**
```javascript
// Usar el Read tool con:
file_path: "CODING_STANDARDS.md"
// o
file_path: "./CODING_STANDARDS.md"
```

**Buscar componentes base:**
```javascript
// Usar el Glob tool con:
pattern: "src/components/common/*.jsx"
```

**Buscar en el código:**
```javascript
// Usar el Grep tool con:
pattern: "BaseButton"
path: "src/components"
```

## 📁 Estructura del Proyecto:

```
XIWENAPP/
├── CODING_STANDARDS.md          ← Documento maestro (IMPORTANTE)
├── package.json
├── src/
│   ├── components/
│   │   ├── common/               ← Componentes base
│   │   │   ├── README.md         ← Quick reference
│   │   │   ├── index.js          ← Barrel exports
│   │   │   ├── BaseButton.jsx
│   │   │   ├── BaseCard.jsx
│   │   │   ├── BaseInput.jsx
│   │   │   ├── BaseSelect.jsx
│   │   │   ├── BaseTextarea.jsx
│   │   │   ├── BaseModal.jsx
│   │   │   ├── BaseBadge.jsx
│   │   │   ├── BaseLoading.jsx
│   │   │   ├── BaseAlert.jsx
│   │   │   ├── BaseDropdown.jsx
│   │   │   └── BaseEmptyState.jsx
│   │   ├── StudentDashboard.jsx  ← Ya refactorizado ✅
│   │   ├── TeacherDashboard.jsx
│   │   ├── AdminDashboard.jsx
│   │   └── student/
│   │       ├── MyCourses.jsx     ← Ya refactorizado ✅
│   │       ├── MyAssignments.jsx ← Ya refactorizado ✅
│   │       ├── CourseViewer.jsx
│   │       └── ContentPlayer.jsx
│   ├── config/
│   │   └── designTokens.js       ← Design tokens
│   ├── hooks/
│   ├── firebase/
│   └── utils/
└── .claude/
    └── README.md                 ← Este archivo
```

## 🎨 Reglas de Diseño (Ver CODING_STANDARDS.md):

1. ✅ **100% Tailwind CSS** - Sin archivos .css custom
2. ✅ **SIEMPRE usar componentes base** - En lugar de HTML nativo
3. ✅ **Dark mode obligatorio** - Todos los componentes
4. ✅ **Usar logger** - No console.*
5. ✅ **Custom hooks** - Extraer lógica compartida

## 🚀 Componentes Ya Refactorizados:

- ✅ StudentDashboard.jsx
- ✅ MyCourses.jsx
- ✅ MyAssignments.jsx

## 📝 Próximos Pasos:

- ⏭️ CourseViewer.jsx
- ⏭️ ContentPlayer.jsx
- ⏭️ StudentClassView.jsx
- ⏭️ TeacherDashboard (ya parcialmente refactorizado)
- ⏭️ AdminDashboard (ya parcialmente refactorizado)

---

**Última actualización:** 2025-11-06
**Actualizado por:** Claude Code CLI
