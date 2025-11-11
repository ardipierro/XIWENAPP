# 📚 Índice de Documentación XIWENAPP

**Fecha de actualización:** 2025-11-11

---

## ⚠️ IMPORTANTE PARA CLAUDE CODE WEB

Esta carpeta contiene **6 archivos principales** de documentación actualizados:

1. **GUIDE.md** - 🚀 EMPEZAR AQUÍ SIEMPRE
2. **CODING_STANDARDS.md** - Estándares de código
3. **DESIGN_SYSTEM.md** - Sistema de diseño
4. **EXERCISE_BUILDER.md** - Sistema de ejercicios
5. **CONTENT_SCHEMA.md** - Arquitectura de contenidos
6. **CHANGELOG.md** - Historial de cambios

---

## 📖 Archivos Disponibles

### ✅ USAR ESTOS ARCHIVOS:

| Archivo | Tamaño | Descripción | Cuándo Leer |
|---------|--------|-------------|-------------|
| **GUIDE.md** | 12 KB | Punto de entrada principal, estructura del proyecto | **SIEMPRE PRIMERO** |
| **CODING_STANDARDS.md** | 22 KB | Las 8 reglas, componentes base, ejemplos | Antes de escribir código |
| **DESIGN_SYSTEM.md** | 18 KB | Colores, responsive, UI components | Antes de crear UI |
| **EXERCISE_BUILDER.md** | 17 KB | Sistema de ejercicios ELE | Al trabajar con ejercicios |
| **CONTENT_SCHEMA.md** | 7 KB | Arquitectura de datos | Al trabajar con contenidos |
| **CHANGELOG.md** | 6 KB | Historial de cambios | Para ver cambios recientes |

---

## ❌ ARCHIVOS QUE NO EXISTEN

Estos archivos fueron **eliminados el 2025-11-11**. Si ves referencias a ellos, ignóralas:

- ❌ START_HERE.md (consolidado en GUIDE.md)
- ❌ README.md (en .claude - consolidado en GUIDE.md)
- ❌ MASTER_STANDARDS.md (consolidado en CODING_STANDARDS.md)
- ❌ CODING_STANDARDS_QUICK.md (consolidado en CODING_STANDARDS.md)
- ❌ BASE_COMPONENTS.md (consolidado en CODING_STANDARDS.md)
- ❌ design-system.md (consolidado en DESIGN_SYSTEM.md)
- ❌ mobile-first.md (consolidado en DESIGN_SYSTEM.md)
- ❌ DESIGN_LAB.md (renombrado a EXERCISE_BUILDER.md)
- ❌ UNIFIED_CONTENT_SCHEMA.md (renombrado a CONTENT_SCHEMA.md)

---

## 🚀 Flujo de Lectura Recomendado

```
1. Lee INDEX.md (este archivo) o GUIDE.md
   ↓
2. Si vas a escribir código → CODING_STANDARDS.md
   ↓
3. Si vas a crear UI → DESIGN_SYSTEM.md
   ↓
4. Si vas a trabajar con ejercicios → EXERCISE_BUILDER.md
   ↓
5. Si vas a trabajar con contenidos → CONTENT_SCHEMA.md
```

---

## 📂 Verificación de Archivos

Para verificar que estos archivos existen, ejecuta:

```bash
ls -la .claude/
```

Deberías ver:
- ✅ GUIDE.md
- ✅ CODING_STANDARDS.md
- ✅ DESIGN_SYSTEM.md
- ✅ EXERCISE_BUILDER.md
- ✅ CONTENT_SCHEMA.md
- ✅ CHANGELOG.md
- ✅ INDEX.md (este archivo)
- ✅ README.txt
- ✅ settings.local.json

---

## 🔗 Rutas Completas

Si necesitas las rutas absolutas:

- `.claude/GUIDE.md`
- `.claude/CODING_STANDARDS.md`
- `.claude/DESIGN_SYSTEM.md`
- `.claude/EXERCISE_BUILDER.md`
- `.claude/CONTENT_SCHEMA.md`
- `.claude/CHANGELOG.md`

---

## 💡 Solución de Problemas

### "No puedo encontrar MASTER_STANDARDS.md"
→ Ese archivo ya no existe. Lee **CODING_STANDARDS.md** en su lugar.

### "No puedo encontrar START_HERE.md"
→ Ese archivo ya no existe. Lee **GUIDE.md** en su lugar.

### "No puedo encontrar DESIGN_LAB.md"
→ Ese archivo fue renombrado. Lee **EXERCISE_BUILDER.md** en su lugar.

### "No puedo encontrar ningún archivo"
→ Ejecuta `git pull origin main` para actualizar el repositorio local.

---

**Última verificación:** 2025-11-11 20:20
**Commit:** 6ddafe3
