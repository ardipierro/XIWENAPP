# ÍNDICE DEL SISTEMA DE BADGES - XIWEN APP

Documentación completa y generada el 17 de Noviembre de 2025

---

## Documentos Generados

### 1. BADGE_SYSTEM_SUMMARY.md (Este es para empezar)
**Tipo:** Resumen Ejecutivo  
**Tamaño:** 4.2 KB  
**Tiempo de lectura:** 8-10 minutos

Contiene:
- Respuestas directas a tus 6 preguntas
- Tabla comparativa de categorías
- Flujo de datos simplificado
- Ejemplos de código (read, update, add, use)
- Restricciones y checklist para developers

**Mejor para:** Una visión rápida del sistema sin abrumar en detalles

---

### 2. BADGE_SYSTEM_QUICK_REF.md (Para consulta rápida)
**Tipo:** Referencia Rápida  
**Tamaño:** 14 KB  
**Tiempo de lectura:** 15-20 minutos (consulta)

Contiene:
- Mapa de archivos críticos con estructura
- Tabla comparativa expandida de categorías
- Estructura de un badge (JSON)
- Flujo de acceso y guardado (diagramas ASCII)
- Mapeo completo de valores a badges (todas las categorías)
- Ejemplos de uso de componentes
- Funciones principales del hook con signatures
- Variables CSS generadas
- Eventos y sincronización
- Integración con otras partes

**Mejor para:** Consultar cuando necesitas recordar algo específico

---

### 3. BADGE_SYSTEM_ANALYSIS.md (Análisis profundo)
**Tipo:** Documentación Completa  
**Tamaño:** 16 KB  
**Tiempo de lectura:** 30-45 minutos (estudio)

Contiene 12 secciones:
1. Ubicación del panel y pestaña
2. Estructura actual del sistema
3. Tipos de badges detallados (57 predefinidos)
4. Cuáles permiten agregar y cuáles no
5. Definición y uso de iconos
6. Componentes principales
7. Flujo de datos completo
8. Sistema de temas y apariencia
9. Restricciones y limitaciones
10. Rutas de archivos relevantes
11. Mapeo de funciones helper
12. Eventos y sincronización

**Mejor para:** Entender profundamente cómo funciona todo

---

## MAPA RÁPIDO POR NECESIDAD

### "Necesito una visión rápida"
→ Lee: **BADGE_SYSTEM_SUMMARY.md**

### "Necesito usar badges en mi componente"
→ Lee: **BADGE_SYSTEM_QUICK_REF.md** → Sección "USO DE COMPONENTES"

### "Necesito agregar un badge custom"
→ Lee: **BADGE_SYSTEM_SUMMARY.md** → Sección "Cuáles Badges Permiten Agregar Más"

### "Necesito customizar colores"
→ Lee: **BADGE_SYSTEM_SUMMARY.md** → Sección "1. Panel de Configuración"

### "Necesito entender la estructura"
→ Lee: **BADGE_SYSTEM_ANALYSIS.md** → Secciones 2-7

### "Necesito una referencia para funciones"
→ Lee: **BADGE_SYSTEM_QUICK_REF.md** → Secciones "FUNCIONES PRINCIPALES" y "FUNCIONES HELPER"

### "Necesito ver todos los badges existentes"
→ Lee: **BADGE_SYSTEM_ANALYSIS.md** → Sección 3

### "Necesito entender cómo se sincroniza entre pestañas"
→ Lee: **BADGE_SYSTEM_ANALYSIS.md** → Sección 12

---

## RESPUESTAS RÁPIDAS A TUS PREGUNTAS

### 1. ¿Dónde está el panel de configuración general?
**Respuesta:** Settings → Pestaña "Badges" (5ª de 8)  
**Componente:** `/src/components/settings/BadgeCustomizerTab.jsx`  
**Acceso:** Solo admin

### 2. ¿Cómo se manejan los badges?
**Respuesta:** Configuración centralizada en `/src/config/badgeSystem.js` + Hook `useBadgeConfig.js` + localStorage  
**Almacenamiento:** localStorage['xiwen_badge_config']  
**Fallback:** DEFAULT_BADGE_CONFIG (57 badges)

### 3. ¿Qué tipos de badges existen?
**Respuesta:** 8 categorías, 57 badges predefinidos  
Categorías: contentType(7), exerciseType(8), difficulty(3), cefr(6), status(4), theme(8), feature(4), role(6)

### 4. ¿Cuáles permiten agregar más?
**Permitidos:** difficulty, theme, feature (allowCustom: true)  
**No permitidos:** contentType, exerciseType, cefr, status, role (allowCustom: false)

### 5. ¿Cómo se definen los iconos?
**Tipo:** Emojis Unicode monocromáticos  
**Almacenamiento:** Propiedad `icon` en cada badge  
**Control:** `showIcon={true/false}` en CategoryBadge

### 6. ¿Hay sistema de temas?
**Sí:** 6 temas globales en ThemeContext.jsx  
**Relación:** Badges usan colores independientes + CSS variables automáticas  
**Contrast:** Fórmula WCAG automática para legibilidad

---

## ARCHIVOS CLAVE POR UBICACIÓN

```
/src/config/
  └── badgeSystem.js ..................... Configuración centralizada (774 líneas)

/src/hooks/
  └── useBadgeConfig.js ................. Hook de gestión (249 líneas)

/src/components/settings/
  └── BadgeCustomizerTab.jsx ............ Panel admin (630 líneas)

/src/components/common/
  ├── BaseBadge.jsx ..................... Badge genérico (127 líneas)
  ├── CategoryBadge.jsx ................. Badge inteligente (153 líneas)
  ├── CreditBadge.jsx ................... Badge de créditos (56 líneas)
  └── index.js .......................... Exportaciones

/src/components/
  ├── SettingsPanel.jsx ................. Contiene tab "Badges"
  └── SettingsModal.jsx ................. Modal alternativo

/src/contexts/
  └── ThemeContext.jsx .................. Temas globales (6 temas)

/src/
  ├── theme.js .......................... Design tokens
  └── globals.css ....................... CSS legados
```

---

## ESTRUCTURA DE DATOS PRINCIPAL

### Un Badge

```javascript
{
  BADGE_KEY: {
    variant: 'primary|success|warning|danger|info|default',
    color: '#3b82f6',              // Hex color
    label: 'Nombre visible',       // Texto mostrado
    icon: '📚',                    // Emoji Unicode
    description: 'Descripción',    // Tooltip
    category: 'contentType',       // Categoría
    custom: false                  // Sistema o custom
  }
}
```

### Una Categoría

```javascript
{
  categoryKey: {
    label: 'Nombre de categoría',
    description: 'Qué es esta categoría',
    icon: '📚',                    // Emoji para encabezado
    allowCustom: true/false        // ¿Permite agregar?
  }
}
```

---

## FUNCIONES CLAVE RÁPIDAS

### Para Leer
```javascript
import { getBadgeByKey, getBadgeForContentType } from '../config/badgeSystem';
const badge = getBadgeByKey('CONTENT_COURSE');
```

### Para Actualizar
```javascript
import useBadgeConfig from '../hooks/useBadgeConfig';
const { updateColor, save } = useBadgeConfig();
updateColor('CONTENT_COURSE', '#ff0000');
save();
```

### Para Usar en JSX
```jsx
import { CategoryBadge } from './common';
<CategoryBadge type="content" value="course" />
```

---

## EVENTOS QUE PUEDES ESCUCHAR

```javascript
// Cuando se guarda configuración de badges
window.addEventListener('xiwen_badge_config_changed', () => {
  // Recarga config en otros componentes
});

// También escucha cambios del navegador
window.addEventListener('storage', handleStorageChange);
```

---

## TABLAS RÁPIDAS DE REFERENCIA

### Variantes de Badge
```
'primary'  → Azul (#3b82f6)
'success'  → Verde (#10b981)
'warning'  → Ámbar (#f59e0b)
'danger'   → Rojo (#ef4444)
'info'     → Púrpura (#8b5cf6)
'default'  → Gris (#71717a)
```

### Tamaños de Badge
```
'sm' → 12px, px-2 py-0.5
'md' → 14px, px-2.5 py-1
'lg' → 16px, px-3 py-1.5
```

### Categorías y Su Estado
```
✅ Personalizables: difficulty, theme, feature
❌ Fijos: contentType, exerciseType, cefr, status, role
```

---

## ESTADÍSTICAS DEL SISTEMA

```
Total de archivos documentados: 15
Líneas de código documentadas: ~2,400
Líneas de documentación: ~7,500
Total de badges predefinidos: 57
Categorías de badges: 8
Categorías permitidas para custom: 3
Componentes principales: 8
Funciones helper: 15+
Temas globales disponibles: 6
```

---

## NOTAS IMPORTANTES

1. **Solo Admin** puede acceder al panel de configuración
2. **localStorage** es el único storage persistente
3. **CSS variables** se generan automáticamente (--badge-{KEY}-bg, text)
4. **Contrast text** se calcula automáticamente (WCAG)
5. **Sincronización** entre pestañas via eventos de storage
6. **Emojis** deben ser monocromáticos (no se recomienda multi-color)
7. **Colores** siempre en formato hex (#RRGGBB)
8. **Reset** elimina config custom y vuelve a defaults

---

## FLUJO TÍPICO DE USO

```
1. Admin abre Settings
2. Presiona tab "Badges"
3. BadgeCustomizerTab renderiza
4. Carga categorías desde useBadgeConfig()
5. useBadgeConfig() lee localStorage
6. Si no existe, usa DEFAULT_BADGE_CONFIG
7. Admin ve 8 secciones expandibles
8. Admin edita colores (updateColor)
9. setConfig() actualiza estado local
10. setHasChanges(true) habilita botón "Guardar"
11. Admin presiona "Guardar Cambios"
12. save() → saveBadgeConfig() → localStorage
13. applyBadgeColors() → CSS variables
14. Dispara evento 'xiwen_badge_config_changed'
15. Otros componentes se actualizan
16. ✅ Mensaje de confirmación
```

---

## PREGUNTAS FRECUENTES

**P: ¿Puedo agregar una nueva categoría?**
A: No, las 8 categorías son fijas del sistema.

**P: ¿Puedo agregar badges en "contentType"?**
A: No, ese es un category fijo (allowCustom: false).

**P: ¿Qué formato deben tener los iconos?**
A: Emojis Unicode monocromáticos solamente.

**P: ¿Dónde se guardan los cambios?**
A: En localStorage bajo la key 'xiwen_badge_config'.

**P: ¿Puedo eliminar badges del sistema?**
A: No, solo se pueden eliminar los badges custom (custom: true).

**P: ¿Qué pasa si localStorage se llena?**
A: Fallará el guardado. localStorage típicamente tiene 5-10MB.

**P: ¿Se sincronizan cambios entre pestañas?**
A: Sí, via eventos de storage y xiwen_badge_config_changed.

---

## SIGUIENTES PASOS

1. Lee **BADGE_SYSTEM_SUMMARY.md** para entender el sistema en 10 minutos
2. Consulta **BADGE_SYSTEM_QUICK_REF.md** cuando necesites ejemplos
3. Estudia **BADGE_SYSTEM_ANALYSIS.md** si necesitas entender detalles
4. Abre Settings → Badges para ver el panel en acción
5. Revisa el código en `/src/config/badgeSystem.js`

---

**Documentación Completa** | Generada: Nov 17, 2025  
**Nivel de Exploración:** Medium (detallado pero practicidad-enfocado)  
**Archivos Incluidos:** 3 documentos + este índice
