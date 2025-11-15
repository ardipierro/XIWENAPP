# ContentReader.jsx - Plan de Refactorización

## Estado Actual
- **Tamaño**: 3,745 líneas
- **Componentes**: 1 monolítico
- **Score**: Muy bajo en mantenibilidad
- **Prioridad**: CRÍTICA

## Objetivo
Dividir en **18+ componentes** reutilizables y testables.

## Estructura Creada ✅

```
src/components/ContentReader/
├── constants.js ✅ CREADO
├── contexts/
│   ├── AnnotationsContext.jsx ✅ CREADO
│   └── ToolsContext.jsx ✅ CREADO
├── components/ (pendiente)
├── hooks/ (pendiente)
└── utils/ (pendiente)
```

## Componentes a Extraer (18 componentes)

### ALTA Prioridad (6 componentes)
1. **FloatingToolbar.jsx** (1855-2800) - Barra de herramientas
2. **DrawingCanvas.jsx** (1500-1800) - Canvas de dibujo
3. **AdvancedColorPicker.jsx** - Selector de colores avanzado
4. **ToolOptions.jsx** (2364-2530) - Opciones por herramienta
5. **ContentEditor.jsx** - Editor de contenido
6. **StickyNotesLayer.jsx** (2980-3050) - Capa de notas

### MEDIA Prioridad (8 componentes)
7. **FloatingTextsLayer.jsx** - Capa de textos flotantes
8. **LayersPanel.jsx** (2152-2234) - Panel de capas
9. **SearchPanel.jsx** (2115-2147) - Panel de búsqueda
10. **FiltersPanel.jsx** (2236-2362) - Panel de filtros
11. **MiniMap.jsx** (3116-3225) - Mini mapa
12. **Magnifier.jsx** (3227-3310) - Lupa
13. **NoteForm.jsx** (3598-3658) - Formulario de notas
14. **FloatingTextForm.jsx** (3663-3709) - Formulario de textos

### BAJA Prioridad (4 componentes)
15. **InstructionsModal.jsx** (3160-3569) - Modal de instrucciones
16. **StylusIndicator.jsx** (2443-2468) - Indicador de Apple Pencil
17. **Footer.jsx** (3087-3102) - Footer con estadísticas
18. **UIContext.jsx** - Context para UI state

## Hooks Personalizados a Crear (6 hooks)

1. **useAnnotations.js** - Gestión de anotaciones
2. **useTools.js** - Gestión de herramientas
3. **useDrawing.js** - Lógica de dibujo
4. **useSearch.js** - Búsqueda en anotaciones
5. **useFilters.js** - Filtrado de anotaciones
6. **useKeyboardShortcuts.js** - Atajos de teclado

## Utilidades a Extraer (5 archivos)

1. **canvasUtils.js** - Utilidades de canvas
2. **filterUtils.js** - Lógica de filtrado
3. **annotationUtils.js** - Helpers de anotaciones
4. **exportUtils.js** - Exportar JSON/PDF/Imagen
5. **importUtils.js** - Importar anotaciones

## Plan de Implementación (8 días)

### Sprint 1 (Días 1-3): Fundación
- [x] Crear estructura de carpetas
- [x] Crear constants.js
- [x] Crear AnnotationsContext.jsx
- [x] Crear ToolsContext.jsx
- [ ] Crear UIContext.jsx
- [ ] Crear hooks básicos (useAnnotations, useTools)
- [ ] Extraer DrawingCanvas
- [ ] Extraer FloatingToolbar

### Sprint 2 (Días 4-6): Componentes Principales
- [ ] Extraer AdvancedColorPicker
- [ ] Extraer ToolOptions
- [ ] Extraer ContentEditor
- [ ] Extraer StickyNotesLayer
- [ ] Extraer FloatingTextsLayer
- [ ] Extraer panels (Layers, Search, Filters)

### Sprint 3 (Días 7-8): Finalización
- [ ] Extraer MiniMap, Magnifier
- [ ] Extraer formularios (NoteForm, FloatingTextForm)
- [ ] Extraer componentes de baja prioridad
- [ ] Refactorizar ContentReader.jsx principal
- [ ] Testing integral
- [ ] Documentación

## Beneficios Esperados

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| **Líneas por archivo** | 3,745 | ~200 | -95% |
| **Componentización** | 1 | 18+ | +1,700% |
| **Mantenibilidad** | Baja | Alta | +++++ |
| **Testabilidad** | Media | Alta | ++++ |
| **Score del proyecto** | 78 | 82 | +4 pts |

## Riesgos

- ⚠️ Regresión en funcionalidad → Mitigar con tests E2E
- ⚠️ Performance degradado → React DevTools profiling
- ⚠️ Prop drilling excesivo → Usar Contexts creados
- ⚠️ Breaking changes → Versionamiento semántico

## Próximos Pasos Inmediatos

1. Crear UIContext.jsx
2. Crear hooks personalizados (useAnnotations, useTools, useDrawing)
3. Extraer DrawingCanvas.jsx (primera extracción crítica)
4. Extraer FloatingToolbar.jsx (segunda extracción crítica)
5. Testing de integración

## Notas

- Esta refactorización es **progresiva**: cada componente extraído mejora el código
- Se puede hacer en **múltiples PRs** pequeños para facilitar code review
- Los Contexts ya creados permiten empezar a extraer componentes inmediatamente
- Constants.js centraliza todas las configuraciones

## Referencias

- Análisis completo: Ver análisis exhaustivo generado por Task/Explore
- Estructura original: src/components/ContentReader.jsx (3,745 líneas)
- Documentación: .claude/CODING_STANDARDS.md, .claude/DESIGN_SYSTEM.md

---

**Última actualización**: 15 de Noviembre, 2025
**Estado**: Fundación completada (constants + contexts), pendiente hooks y componentes
