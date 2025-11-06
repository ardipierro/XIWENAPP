# 📚 Índice de Documentación - XIWEN APP

## 🎯 Para Claude Code Web - LEER ESTO PRIMERO

### ✅ Archivos Verificados y Disponibles:

| Archivo | Ruta | Estado | Descripción |
|---------|------|--------|-------------|
| **CODING_STANDARDS.md** | `CODING_STANDARDS.md` | ✅ Existe | Estándares de código y arquitectura |
| **DESIGN_SYSTEM.md** | `DESIGN_SYSTEM.md` | ✅ Existe | Sistema de diseño y colores |
| **README.md** | `README.md` | ✅ Existe | Descripción del proyecto |

### 🔍 Cómo Acceder a CODING_STANDARDS.md:

**Opción 1: Read tool (RECOMENDADO)**
```javascript
{
  "file_path": "CODING_STANDARDS.md"
}
```

**Opción 2: Ruta desde raíz**
```javascript
{
  "file_path": "./CODING_STANDARDS.md"
}
```

**Opción 3: Si Opción 1 y 2 fallan**
```javascript
// Primero usa Glob para verificar:
{
  "pattern": "CODING*.md"
}
// Luego usa el path exacto que retorne
```

### 📋 Contenido de CODING_STANDARDS.md:

**Secciones principales:**
1. 🎨 Styling & UI
   - REGLA #1: 100% Tailwind CSS - CERO CSS Custom
   - REGLA #2: BaseModal para TODOS los modales
   - REGLA #3: SIEMPRE usar componentes base

2. 🎯 Custom Hooks
   - REGLA #4: Extraer lógica compartida en Custom Hooks

3. 🏗️ Arquitectura de Componentes
   - REGLA #5: Componentes DRY (Don't Repeat Yourself)

4. 🔥 Firebase & Data
   - REGLA #6: NUNCA usar console.* - Usar logger
   - REGLA #7: Usar async/await con try-catch

5. 🎨 Dark Mode
   - REGLA #8: Siempre soportar Dark Mode

### 🧩 Componentes Base Disponibles:

| Componente | Archivo | Uso |
|------------|---------|-----|
| BaseButton | `src/components/common/BaseButton.jsx` | Botones |
| BaseInput | `src/components/common/BaseInput.jsx` | Inputs |
| BaseSelect | `src/components/common/BaseSelect.jsx` | Selectores |
| BaseTextarea | `src/components/common/BaseTextarea.jsx` | Text areas |
| BaseCard | `src/components/common/BaseCard.jsx` | Cards |
| BaseModal | `src/components/common/BaseModal.jsx` | Modales |
| BaseBadge | `src/components/common/BaseBadge.jsx` | Badges |
| BaseLoading | `src/components/common/BaseLoading.jsx` | Loading |
| BaseAlert | `src/components/common/BaseAlert.jsx` | Alertas |
| BaseDropdown | `src/components/common/BaseDropdown.jsx` | Dropdowns |
| BaseEmptyState | `src/components/common/BaseEmptyState.jsx` | Empty states |

### ⚠️ Troubleshooting para Claude Code Web:

Si **CODING_STANDARDS.md** no se encuentra:

1. **Verifica con Glob primero:**
   ```javascript
   Glob tool → pattern: "*.md"
   ```
   Esto mostrará todos los archivos .md disponibles

2. **Usa el path exacto que aparezca** en los resultados

3. **Si persiste el error:**
   - Puede ser problema de caché del navegador
   - Intenta refrescar la página de Claude Code Web
   - Usa DESIGN_SYSTEM.md como alternativa (contiene info similar)

### 📝 Verificación Rápida:

**Comando para verificar existencia:**
```bash
ls -la CODING_STANDARDS.md
# Output: -rw-r--r-- 1 ardip 197609 22494 nov.  6 16:03 CODING_STANDARDS.md
```

**Primeras líneas del archivo:**
```markdown
# 📘 XIWEN App - Coding Standards & Best Practices

**Documento maestro de estándares de código y arquitectura**

Última actualización: 2025-11-06
```

---

**Generado:** 2025-11-06
**Verificado:** ✅ Archivo existe y es legible
**Tamaño:** 22.5 KB (22,494 bytes)
**Encoding:** UTF-8
