# XIWENAPP - Arquitectura y Guía de Optimización

> **Última auditoría:** 2025-11-30
> **Próxima revisión sugerida:** 2025-12-07

---

## 1. RESUMEN EJECUTIVO

### Estado General
| Métrica | Valor | Estado |
|---------|-------|--------|
| Total componentes | 285 | - |
| Componentes huérfanos | 28 | ⚠️ Pendiente limpieza |
| Líneas de código src/ | 48,126 | - |
| Contextos globales | 8 | ✅ OK |
| Hooks personalizados | 49+ | ✅ OK |
| Servicios | 38 | ✅ OK |
| Módulos Firebase | 44 | ⚠️ Reorganizar |

### Prioridades de Optimización
1. **CRÍTICA**: Eliminar archivos no usados (~1,400 líneas)
2. **ALTA**: Lazy loading de componentes pesados (~300KB bundle)
3. **MEDIA**: Diccionario a IndexedDB (~18MB memoria)
4. **BAJA**: Reorganizar estructura firebase/

---

## 2. COMPONENTES PARA ELIMINAR

### 2.1 Eliminación Segura (Sin riesgo)

```
src/components/Navigation.jsx           (104 líneas) ← OBSOLETO
src/components/DashboardLayout.jsx      (135 líneas) ← Reemplazado
src/components/TopBar.jsx               (430 líneas) ← Reemplazado
src/components/SideMenu.jsx             (206 líneas) ← Reemplazado
src/components/BottomNavigation.jsx     (256 líneas) ← No usado

src/components/diary/EnhancedTextEditor.backup-*.jsx
src/components/diary/EnhancedTextEditor.old.jsx
src/components/diary/EnhancedTextEditor.v2.backup.jsx
```

**Total recuperable:** ~1,131 líneas + backups

### 2.2 Verificar Antes de Eliminar

```
src/components/SettingsModal.jsx        (35KB) ← Verificar si SettingsPanel lo reemplaza
src/components/UserProfile.jsx          (42KB) ← Verificar si ProfileTabs lo reemplaza
src/components/ThemeBuilder.jsx         (42KB) ← Verificar si ThemeCustomizer lo reemplaza
src/components/CoursePlayer.jsx         (23KB) ← Versión antigua
src/components/DashboardAssistant.jsx   (14KB) ← Integrado en UniversalDashboard
src/components/VoiceRecorder*.jsx       (x3)  ← Mantener solo la versión activa
src/components/UnifiedLogin.jsx         (10KB) ← Verificar si Login.jsx lo reemplaza
```

### 2.3 Dependencia No Usada (package.json)

```json
"grok-cli": "^1.0.5"  ← ELIMINAR (sin imports en código)
```

---

## 3. ARQUITECTURA ACTUAL

### 3.1 Sistema de Navegación (CORRECTO)

```
App.jsx
  └── UniversalDashboard (690 líneas) ← PRINCIPAL EN USO
        ├── UniversalTopBar (287 líneas) ✅
        ├── UniversalSideMenu (249 líneas) ✅
        └── TopBarContext (131 líneas) ✅

DEPRECADOS (no eliminar hasta confirmar):
  ├── DashboardLayout ← No usado en App.jsx
  │     ├── TopBar
  │     ├── SideMenu
  │     └── BottomNavigation
  └── Navigation ← Completamente obsoleto
```

### 3.2 Componentes Base Universales

| Componente | Ubicación | Uso | Estado |
|------------|-----------|-----|--------|
| BaseButton | common/ | 95%+ | ✅ Universal |
| BaseModal | common/ | 70% | ⚠️ 38 modales no lo usan |
| BaseCard | common/ | 90% | ✅ Universal |
| UniversalCard | cards/ | 85% | ✅ Excelente |
| BaseInput | common/ | 100% | ✅ Universal |
| BaseSelect | common/ | 100% | ✅ Universal |
| BaseBadge | common/ | 95% | ✅ Universal |
| CategoryBadge | common/ | 90% | ✅ Especializado |
| SearchBar | common/ | 80% | ✅ Universal |
| BaseTabs | common/ | 85% | ✅ Universal |
| BaseAlert | common/ | 80% | ✅ Universal |

**Problema detectado:** 38 modales específicos que deberían usar BaseModal como base.

### 3.3 Contextos Globales

```javascript
// Orden de providers (mantener esta jerarquía)
ErrorBoundary
  └── AuthProvider
        └── ThemeProvider
              └── CredentialsProvider
                    └── CardConfigProvider
                          └── DashboardConfigProvider
                                └── FontProvider
                                      └── ViewAsProvider
                                            └── App
```

---

## 4. OPTIMIZACIONES PENDIENTES

### 4.1 Lazy Loading URGENTE

**Componentes que DEBEN usar React.lazy():**

```javascript
// MessagesPanel.jsx (línea 13) - CAMBIAR:
// ❌ import MessageThread from './MessageThread';
// ✅ const MessageThread = lazy(() => import('./MessageThread'));

// ClassSessionRoom.jsx (línea 4) - CAMBIAR:
// ❌ import Whiteboard from './Whiteboard';
// ✅ const Whiteboard = lazy(() => import('./Whiteboard'));

// TopBar.jsx y UniversalTopBar.jsx - CAMBIAR:
// ❌ import UserProfileModal from './UserProfileModal';
// ✅ const UserProfileModal = lazy(() => import('./UserProfileModal'));
```

**Ahorro estimado:** ~300KB del bundle inicial

### 4.2 Diccionario - Migrar a IndexedDB

**Problema actual:**
- `cedict_es_full.json`: 18MB cargado en memoria
- Bloquea UI en primera búsqueda
- Construye 4 Maps enormes

**Solución propuesta:**
1. Cargar en IndexedDB al inicio (background)
2. Búsquedas indexadas sin cargar todo en RAM
3. Cache LRU para resultados frecuentes

### 4.3 Chunks Excluidos de Precache (Correcto)

```javascript
// vite.config.js - Estos chunks YA están excluidos:
- excalidraw*.js (500KB)
- ContentManagerTabs*.js (484KB)
- ClassDailyLogManager*.js (407KB)
- recharts*.js (321KB)
```

---

## 5. DISEÑO RESPONSIVE

### 5.1 Fortalezas Actuales

- ✅ Breakpoints bien definidos (xs, sm, md, lg, xl, 2xl)
- ✅ Safe areas para iOS (notch, bottom bar)
- ✅ Touch targets definidos (44px, 48px, 56px)
- ✅ Hooks useMediaQuery, useTouchGestures implementados
- ✅ Grid responsive automático (auto-fit + minmax)
- ✅ Dark mode completo

### 5.2 Problemas a Corregir

```css
/* Touch targets demasiado pequeños en móviles extremos */
.universal-topbar__icon-btn { min-height: 32px; } /* ❌ <44px */
.universal-topbar__back-btn { min-height: 32px; } /* ❌ <44px */

/* SOLUCIÓN: Agregar en globals.css */
@media (max-width: 768px) {
  .universal-topbar__icon-btn,
  .universal-topbar__back-btn {
    min-height: 44px;
    min-width: 44px;
  }
}
```

### 5.3 Hooks No Aprovechados

```javascript
// Implementados pero poco usados:
useIsMobile()      // Solo 1 uso detectado
useBreakpoint()    // Sin uso detectado
useTouchGestures() // Sin uso detectado

// Recomendación: Usar en componentes con lógica condicional
const isMobile = useIsMobile();
return isMobile ? <MobileView /> : <DesktopView />;
```

---

## 6. ARQUITECTURA AI-FIRST (ROADMAP)

### 6.1 Estado Actual de IA

- ✅ AIService.js con multi-proveedor (OpenAI, Claude, Gemini, Grok)
- ✅ 15+ funciones de IA disponibles
- ✅ Sistema de créditos funcionando
- ✅ Cloud Functions para asistente

**Limitaciones:**
- ❌ IA reactiva (usuario debe iniciar)
- ❌ Sin orquestación de flujos
- ❌ Sin experiencia conversacional persistente
- ❌ Comandos de voz solo en widget

### 6.2 Servicios Nuevos Propuestos

```
src/services/
├── AIOrchestrator.js         ← Ejecuta pipelines automáticos
├── ConversationContextManager.js ← Contexto persistente
├── AIEventBus.js             ← Sistema de eventos IA
├── VoiceCommandProcessor.js  ← Comandos de voz global
├── ProactiveAIAgent.js       ← Detección y sugerencias
├── HomeworkAnalysisService.js ← Pipeline de tareas
├── AnomalyDetectionService.js ← Detección de problemas
└── ContentRecommenderService.js ← Recomendaciones
```

### 6.3 Fases de Implementación

| Fase | Objetivo | Tiempo |
|------|----------|--------|
| 1 | Core AI Infrastructure | Semanas 1-2 |
| 2 | Universal AI Assistant | Semanas 2-3 |
| 3 | Vertical Integration | Semanas 3-4 |
| 4 | Proactive Features | Semanas 4-5 |
| 5 | Voice & Multimodal | Semanas 5-6 |

---

## 7. CHECKLIST DE AUDITORÍA SEMANAL

### Pre-auditoría
- [ ] Ejecutar `npm run build` - verificar warnings
- [ ] Revisar bundle size (target: <500KB comprimido)
- [ ] Verificar que no hay nuevos componentes huérfanos

### Componentes
- [ ] Nuevos componentes usan Base* cuando corresponde
- [ ] Modales nuevos extienden BaseModal
- [ ] Cards nuevas usan UniversalCard o BaseCard
- [ ] Inputs usan BaseInput/BaseSelect/BaseTextarea

### Performance
- [ ] Componentes >300 líneas tienen lazy loading
- [ ] No hay imports estáticos de librerías pesadas (recharts, excalidraw, tiptap)
- [ ] Nuevas imágenes están optimizadas

### Mobile
- [ ] Touch targets ≥44px en elementos interactivos
- [ ] No hay overflow horizontal en móviles 320px
- [ ] Safe areas respetadas en nuevos componentes

### Cleanup
- [ ] No hay archivos .backup, .old, .v2
- [ ] No hay console.log en código de producción
- [ ] Imports no usados eliminados

---

## 8. ESTRUCTURA DE ARCHIVOS CLAVE

```
src/
├── App.jsx                    ← Punto de entrada, rutas
├── main.jsx                   ← Inicialización
├── globals.css                ← Estilos globales
├── theme.js                   ← Configuración de tema
│
├── components/
│   ├── UniversalDashboard.jsx ← DASHBOARD PRINCIPAL
│   ├── UniversalTopBar.jsx    ← BARRA SUPERIOR
│   ├── UniversalSideMenu.jsx  ← MENÚ LATERAL
│   ├── common/                ← COMPONENTES BASE (27)
│   │   ├── index.js           ← Barrel exports
│   │   ├── BaseButton.jsx
│   │   ├── BaseModal.jsx
│   │   ├── BaseCard.jsx
│   │   ├── BaseInput.jsx
│   │   └── ...
│   ├── cards/
│   │   └── UniversalCard.jsx  ← CARD UNIVERSAL
│   └── exercises/
│       └── renderers/         ← 11 renderers de ejercicios
│
├── contexts/                  ← 8 contextos globales
│   └── index.js               ← Barrel exports
│
├── hooks/                     ← 49+ hooks
│   └── index.js               ← Barrel exports
│
├── services/                  ← 38 servicios
│   ├── AIService.js           ← Orquestación IA
│   └── providers/             ← Proveedores IA
│
├── firebase/                  ← 44 módulos (reorganizar)
│
├── config/
│   ├── permissions.js         ← Matriz de permisos
│   ├── creditCosts.js         ← Costos de créditos
│   └── badgeSystem.js         ← Sistema de insignias
│
├── constants/
│   └── aiFunctions.js         ← Funciones IA disponibles
│
└── utils/                     ← 31 utilidades
```

---

## 9. COMANDOS ÚTILES

```bash
# Verificar bundle size
npm run build && ls -la dist/assets/*.js | sort -k5 -n

# Buscar componentes no usados
grep -rL "import.*ComponentName" src/ --include="*.jsx"

# Buscar imports de librería pesada
grep -r "from 'recharts'" src/ --include="*.jsx" | wc -l

# Verificar lazy loading
grep -r "React.lazy\|lazy(" src/components/*.jsx | wc -l

# Encontrar archivos grandes
find src -name "*.jsx" -exec wc -l {} \; | sort -n | tail -20

# Buscar console.log en producción
grep -r "console.log" src/ --include="*.jsx" --include="*.js" | wc -l
```

---

## 10. CONTACTO Y NOTAS

### Decisiones Arquitectónicas Recientes

| Fecha | Decisión | Razón |
|-------|----------|-------|
| 2025-11 | UniversalDashboard como único dashboard | Consolidar 4 dashboards por rol |
| 2025-11 | Sistema de componentes Base* | Estandarización UI |
| 2025-11 | UniversalCard para todas las tarjetas | Reducir duplicación |
| 2025-11 | TopBarContext para configuración dinámica | Flexibilidad sin props drilling |

### Próximas Prioridades

1. Eliminar componentes legacy de navegación
2. Implementar lazy loading en componentes pesados
3. Migrar diccionario a IndexedDB
4. Comenzar arquitectura AI-first

---

*Documento generado automáticamente. Actualizar después de cada auditoría.*
