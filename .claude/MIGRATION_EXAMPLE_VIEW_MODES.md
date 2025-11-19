# Ejemplo de Migración al Sistema Universal de Vistas

**Panel**: ClassDailyLogManager
**Estado**: ANTES vs DESPUÉS de migrar al sistema universal

---

## ❌ ANTES (Código Actual - Inconsistente)

```jsx
// ClassDailyLogManager.jsx - Líneas 216-227
<div className={viewMode === 'grid' ? 'grid-responsive-cards gap-6' : 'flex flex-col gap-4'}>
  {filteredLogs.map((log) => (
    <LogCard
      key={log.id}
      log={log}
      onOpen={handleOpenLog}
      onDelete={handleDeleteLog}
      viewMode={viewMode}
    />
  ))}
</div>

// LogCard component - Líneas 244-364
function LogCard({ log, onOpen, onDelete, viewMode = 'grid' }) {
  // ... config badges/status ...

  if (viewMode === 'list') {
    // ❌ Renderiza manualmente con children custom
    return (
      <UniversalCard variant="default" size="md" hover>
        <div className="flex items-center gap-4">
          <BaseBadge ... />
          <div className="flex-1 min-w-0">
            <h3>{log.name}</h3>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <BookOpen size={14} />
                <span>{log.courseName}</span>
              </div>
              // ... más contenido manual ...
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <BaseButton ... />
          </div>
        </div>
      </UniversalCard>
    );
  }

  // Vista de grilla (vertical) - también manual
  return (
    <UniversalCard variant="default" size="md" hover>
      <div className="space-y-4">
        {/* Contenido manual vertical */}
      </div>
    </UniversalCard>
  );
}
```

### Problemas:
1. ❌ LogCard tiene dos renders completamente separados (duplicación)
2. ❌ No usa props nativas de UniversalCard (title, subtitle, badges, actions)
3. ❌ Renderiza todo manualmente con children custom
4. ❌ No aprovecha el layout horizontal automático de UniversalCard

---

## ✅ DESPUÉS (Sistema Universal - Correcto)

```jsx
// ClassDailyLogManager.jsx - Vista principal
import { CardContainer } from './cards';

function ClassDailyLogManager({ user }) {
  const [viewMode, setViewMode] = useState('grid');

  return (
    <div className="w-full">
      {/* Header, SearchBar, etc... */}

      {filteredLogs.length === 0 ? (
        <BaseEmptyState ... />
      ) : (
        // ✅ OPCIÓN 1: Usar CardContainer (MÁS SIMPLE)
        <CardContainer
          items={filteredLogs}
          viewMode={viewMode}
          renderCard={(log, index, currentViewMode) => (
            <LogCard
              log={log}
              onOpen={handleOpenLog}
              onDelete={handleDeleteLog}
              layout={currentViewMode === 'list' ? 'horizontal' : 'vertical'}
            />
          )}
          emptyState={<BaseEmptyState ... />}
        />

        // ✅ OPCIÓN 2: Manual (más control)
        // <div className={viewMode === 'grid' ? 'grid-responsive-cards gap-6' : 'flex flex-col gap-3'}>
        //   {filteredLogs.map((log) => (
        //     <LogCard
        //       key={log.id}
        //       log={log}
        //       layout={viewMode === 'list' ? 'horizontal' : 'vertical'}
        //       onOpen={handleOpenLog}
        //       onDelete={handleDeleteLog}
        //     />
        //   ))}
        // </div>
      )}
    </div>
  );
}

// ============================================
// LOG CARD - SIMPLIFICADO
// ============================================

function LogCard({ log, onOpen, onDelete, layout = 'vertical' }) {
  // Config badges
  const statusConfig = {
    active: { variant: 'success', label: 'Activa', icon: Activity },
    ended: { variant: 'default', label: 'Finalizada', icon: CheckCircle },
    archived: { variant: 'default', label: 'Archivada', icon: Archive }
  };

  const config = statusConfig[log.status] || statusConfig.active;

  // ✅ USAR PROPS NATIVAS de UniversalCard
  return (
    <UniversalCard
      variant="default"
      size="md"
      layout={layout}  // ← Layout dinámico según viewMode
      icon={BookOpen}
      title={log.name}
      subtitle={log.description}
      badges={[
        { key: 'status', variant: config.variant, icon: config.icon, children: config.label }
      ]}
      stats={[
        { icon: Calendar, label: 'Creado', value: log.createdAt?.toDate?.().toLocaleDateString() || 'Sin fecha' },
        { icon: Clock, label: 'Contenidos', value: log.entries?.length || 0 }
      ]}
      actions={[
        <BaseButton
          key="open"
          variant="primary"
          icon={Play}
          size={layout === 'horizontal' ? 'sm' : 'md'}
          onClick={() => onOpen(log.id)}
        >
          Abrir
        </BaseButton>,
        <BaseButton
          key="delete"
          variant="danger"
          icon={Trash2}
          size={layout === 'horizontal' ? 'sm' : 'md'}
          onClick={() => onDelete(log.id)}
        />
      ]}
      hover
    />
  );
}
```

### Mejoras:
1. ✅ **UN SOLO render** - No duplicación de código
2. ✅ **Usa props nativas** de UniversalCard (title, subtitle, badges, stats, actions)
3. ✅ **Layout automático** - UniversalCard maneja horizontal/vertical
4. ✅ **90% menos código** - De ~120 líneas a ~30 líneas
5. ✅ **Consistente** con el resto de paneles
6. ✅ **Mantenible** - Cambios en UniversalCard benefician a todos

---

## 📊 Comparación Visual

### Grid Mode (ambos iguales):
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  [Icon]      │  │  [Icon]      │  │  [Icon]      │
│              │  │              │  │              │
│  Título      │  │  Título      │  │  Título      │
│  Subtitle    │  │  Subtitle    │  │  Subtitle    │
│              │  │              │  │              │
│  [Badge]     │  │  [Badge]     │  │  [Badge]     │
│  Stats       │  │  Stats       │  │  Stats       │
│  [Actions]   │  │  [Actions]   │  │  [Actions]   │
└──────────────┘  └──────────────┘  └──────────────┘
```

### List Mode:

**ANTES (tarjetas gordas verticales apiladas)**:
```
┌────────────────────────────────────────────────────────┐
│  [Badge]                                               │
│                                                        │
│  Título                                                │
│  Descripción larga...                                  │
│                                                        │
│  📅 Fecha  ⏰ Contenidos                               │
│                                                        │
│  [Abrir]  [Eliminar]                                   │
└────────────────────────────────────────────────────────┘
                    ⬇️
┌────────────────────────────────────────────────────────┐
│  [Badge]                                               │
│                                                        │
│  Título                                                │
│  ...                                                   │
```
❌ Problema: Tarjetas muy altas, desperdician espacio vertical

**AHORA (filas compactas tipo tabla)**:
```
┌────────────────────────────────────────────────────────┐
│ [Icon] Título + Subtitle | Stats | [Badge] | [Actions]│
└────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────┐
│ [Icon] Título + Subtitle | Stats | [Badge] | [Actions]│
└────────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────────┐
│ [Icon] Título + Subtitle | Stats | [Badge] | [Actions]│
└────────────────────────────────────────────────────────┘
```
✅ Solución: Filas compactas (~96px), más contenido visible

---

## 🔄 Paso a Paso para Migrar un Panel

### 1. Identificar el panel con viewMode
```bash
# Buscar paneles con setViewMode
grep -r "setViewMode" src/components/
```

### 2. Encontrar el render condicional
```jsx
// Buscar este patrón:
viewMode === 'grid' ? (
  // Grid render
) : (
  // List render
)
```

### 3. Simplificar el componente Card

**Antes** (con if/else y children custom):
```jsx
function MyCard({ item, viewMode }) {
  if (viewMode === 'list') {
    return (
      <UniversalCard>
        <div className="flex items-center">
          {/* Layout manual */}
        </div>
      </UniversalCard>
    );
  }

  return (
    <UniversalCard>
      <div className="space-y-4">
        {/* Contenido manual */}
      </div>
    </UniversalCard>
  );
}
```

**Después** (con props nativas):
```jsx
function MyCard({ item, layout }) {
  return (
    <UniversalCard
      layout={layout}  // ← Único cambio necesario
      title={item.name}
      subtitle={item.description}
      badges={[...]}
      stats={[...]}
      actions={[...]}
      hover
    />
  );
}
```

### 4. Actualizar el render principal

**Opción A - CardContainer (recomendado)**:
```jsx
<CardContainer
  items={filteredItems}
  viewMode={viewMode}
  renderCard={(item, index, currentViewMode) => (
    <MyCard
      item={item}
      layout={currentViewMode === 'list' ? 'horizontal' : 'vertical'}
    />
  )}
/>
```

**Opción B - Manual**:
```jsx
<div className={viewMode === 'grid' ? 'grid-responsive-cards gap-4' : 'flex flex-col gap-3'}>
  {filteredItems.map(item => (
    <MyCard
      key={item.id}
      item={item}
      layout={viewMode === 'list' ? 'horizontal' : 'vertical'}
    />
  ))}
</div>
```

### 5. Probar en diferentes modos
1. Grid mode: Verifica que el grid sea responsive
2. List mode: Verifica que las filas sean compactas y horizontales
3. Mobile: Verifica ambos modos en móvil

---

## 📐 Props de UniversalCard para List Mode

```jsx
<UniversalCard
  // Layout
  layout="horizontal"    // ← Horizontal para list mode
  variant="default"
  size="md"

  // Visual (izquierda)
  icon={BookOpen}        // O userId para avatar

  // Texto (centro)
  title="Título principal"
  subtitle="Subtítulo o descripción corta"

  // Stats (medio-derecha)
  stats={[
    { icon: Calendar, label: 'Fecha', value: '12 Ene' },
    { icon: Clock, label: 'Duración', value: '45 min' }
  ]}

  // Badges (medio-derecha)
  badges={[
    { variant: 'success', children: 'Activo' }
  ]}

  // Actions (extremo derecho)
  actions={[
    <BaseButton icon={Play}>Abrir</BaseButton>,
    <BaseButton variant="danger" icon={Trash2} />
  ]}

  // Interacción
  onClick={handleClick}
  hover
/>
```

---

## ⚠️ Notas Importantes

1. **Gap en list mode**: Usar `gap-3` (más compacto que grid)
2. **Actions size**: En horizontal, preferir `size="sm"` para botones
3. **Subtitle**: Debe ser corto en horizontal (se trunca con `truncate`)
4. **Stats**: Máximo 2-3 stats en horizontal (espacio limitado)
5. **Description**: NO usar en horizontal (no hay espacio vertical)

---

**Ver también**:
- `.claude/VIEW_MODES.md` - Guía completa del sistema
- `src/components/cards/UniversalCard.jsx` - Código del componente
- `src/components/cards/CardContainer.jsx` - Wrapper automático
