# 📘 Claude Code - Project Documentation

## 🎯 Para Claude Code Web (Browser)

### Archivos Importantes del Proyecto:

**Documentación de Estándares:**
- `CODING_STANDARDS.md` - 📘 Documento maestro de estándares y mejores prácticas
  - **Ruta para leer:** `CODING_STANDARDS.md`
  - Incluye: Reglas de Tailwind, BaseModal, Custom Hooks, Logger, Dark Mode

- `DESIGN_SYSTEM.md` - 🎨 Sistema de diseño y componentes
  - **Ruta para leer:** `DESIGN_SYSTEM.md`
  - Incluye: Colores, tipografía, espaciado, componentes UI

**IMPORTANTE:** Ambos documentos están en la raíz del proyecto. NO uses rutas absolutas de Windows.

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

## 📚 Todos los Documentos Disponibles:

**Documentos Principales (LEER ESTOS PRIMERO):**
1. `CODING_STANDARDS.md` - 📘 Estándares de código (PRINCIPAL)
2. `DESIGN_SYSTEM.md` - 🎨 Sistema de diseño y colores
3. `README.md` - Descripción del proyecto

**Documentos de Configuración:**
4. `STYLE_CONFIG.md` - Configuración de estilos
5. `STYLE_GUIDE_SUMMARY.md` - Resumen de guía de estilos
6. `TAILWIND_CENTRALIZATION.md` - Centralización de Tailwind

**Documentos de Refactoring (Histórico):**
7. `REFACTORING_COMPLETE.md` - Refactoring completo
8. `REFACTORING_SECTION1.md` - Sección 1
9. `REFACTORING_SECTIONS2-4.md` - Secciones 2-4
10. `REFACTORING_SECTIONS5-7.md` - Secciones 5-7
11. `UNIFICACION_MASTER.md` - Unificación master
12. `UNIFIED_CARD_SYSTEM.md` - Sistema de cards unificado

**Documentos de Mejoras:**
13. `IMPROVEMENTS_COMPLETED.md` - Mejoras completadas
14. `AUDIT_REPORT.md` - Reporte de auditoría
15. `CHANGELOG_NOCTURNO.md` - Changelog nocturno

**Documentos de Features:**
16. `PLAN_CURSOS_ESTUDIANTES.md` - Plan de cursos
17. `EXERCISE_FORMATS.md` - Formatos de ejercicios
18. `LIVEKIT_SETUP.md` - Setup de LiveKit
19. `REALTIME_DATABASE_SETUP.md` - Setup de Realtime DB

**⚠️ NOTA IMPORTANTE para Claude Code Web:**
- Usa **solo el nombre del archivo** sin rutas absolutas
- Ejemplo: `CODING_STANDARDS.md` (✅) NO `C:\Users\...\CODING_STANDARDS.md` (❌)
- Los archivos están en la raíz del proyecto
- Para subdirectorios usa rutas relativas: `src/components/common/BaseButton.jsx`

---

**Última actualización:** 2025-11-06
**Actualizado por:** Claude Code CLI
