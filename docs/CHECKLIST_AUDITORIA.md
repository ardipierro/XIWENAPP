# Checklist de Auditoría Semanal - XIWENAPP

> Usar este checklist cada 3-7 días para mantener la salud del código

---

## PASO 1: Build Rápido (2 min)

```bash
npm run build 2>&1 | grep -E "warning|error|KB"
```

- [ ] Sin errores de build
- [ ] Sin warnings críticos
- [ ] Bundle principal <500KB

---

## PASO 2: Componentes Nuevos (5 min)

### ¿Se crearon componentes nuevos?

| Pregunta | ✅ | ❌ Acción |
|----------|---|----------|
| ¿Modal usa BaseModal? | | Refactorizar |
| ¿Card usa UniversalCard/BaseCard? | | Refactorizar |
| ¿Button usa BaseButton? | | Refactorizar |
| ¿Input usa BaseInput/Select/Textarea? | | Refactorizar |
| ¿Badge usa BaseBadge/CategoryBadge? | | Refactorizar |

### ¿Componente es >300 líneas?

- [ ] Tiene lazy loading con React.lazy()
- [ ] Tiene Suspense con fallback

---

## PASO 3: Performance (3 min)

### Imports Pesados

```bash
# Recharts (321KB) - ¿Se agregó nuevo uso?
grep -r "from 'recharts'" src/ --include="*.jsx" | wc -l

# Tiptap (800KB) - ¿Se agregó nuevo uso?
grep -r "@tiptap" src/ --include="*.jsx" | wc -l

# Excalidraw (500KB) - ¿Se agregó nuevo uso?
grep -r "excalidraw" src/ --include="*.jsx" | wc -l
```

- [ ] Nuevos imports de libs pesadas usan lazy loading

### Lazy Loading Actual

```bash
grep -r "React.lazy\|lazy(" src/components/*.jsx | wc -l
```

- [ ] Número no decreció respecto a auditoría anterior

---

## PASO 4: Código Limpio (2 min)

```bash
# Console.logs (deben ser 0 en producción)
grep -r "console.log" src/ --include="*.jsx" | grep -v test | wc -l

# Archivos backup
find src -name "*.backup*" -o -name "*.old*" -o -name "*.v2.*"

# TODOs sin resolver
grep -r "TODO\|FIXME\|HACK" src/ --include="*.jsx" | wc -l
```

- [ ] console.log = 0
- [ ] Sin archivos backup
- [ ] TODOs documentados o resueltos

---

## PASO 5: Mobile Quick Check (2 min)

### Touch Targets

```bash
# Buscar elementos con tamaños pequeños
grep -r "h-6\|w-6\|h-7\|w-7\|h-8\|w-8" src/components/*.jsx | head -5
```

- [ ] No hay touch targets <44px en elementos clickeables nuevos

### Overflow

```bash
# Buscar potenciales problemas de overflow
grep -r "overflow-x-auto\|whitespace-nowrap" src/components/*.jsx
```

- [ ] Overflow horizontal manejado correctamente

---

## PASO 6: Archivos Huérfanos (5 min)

### Comando Rápido

```bash
# Lista componentes posiblemente no usados
for f in src/components/*.jsx; do
  name=$(basename "$f" .jsx)
  count=$(grep -r "import.*$name\|from.*$name" src --include="*.jsx" | grep -v "$f:" | wc -l)
  [ $count -eq 0 ] && echo "$f"
done
```

- [ ] Componentes huérfanos nuevos identificados
- [ ] Decisión: ¿Eliminar o documentar por qué existe?

---

## PASO 7: Contextos y Hooks (1 min)

```bash
# Hooks no usados
for f in src/hooks/*.js; do
  name=$(basename "$f" .js)
  count=$(grep -r "import.*$name\|from.*$name" src --include="*.jsx" | wc -l)
  [ $count -eq 0 ] && echo "Hook no usado: $f"
done
```

- [ ] Hooks nuevos están siendo utilizados

---

## RESUMEN RÁPIDO

| Área | Estado | Notas |
|------|--------|-------|
| Build | ✅/❌ | |
| Componentes Base | ✅/❌ | |
| Lazy Loading | ✅/❌ | |
| Código Limpio | ✅/❌ | |
| Mobile | ✅/❌ | |
| Huérfanos | ✅/❌ | |

---

## ACCIONES PENDIENTES

| Prioridad | Acción | Responsable | Fecha |
|-----------|--------|-------------|-------|
| CRÍTICA | | | |
| ALTA | | | |
| MEDIA | | | |

---

## NOTAS DE ESTA AUDITORÍA

```
Fecha: ____/____/____
Auditor: ____________

Observaciones:
_______________________
_______________________
_______________________

Próxima auditoría: ____/____/____
```

---

## NÚMEROS DE REFERENCIA

> Actualizar estos valores como baseline

| Métrica | Valor Actual | Fecha |
|---------|-------------|-------|
| Componentes totales | 285 | 2025-11-30 |
| Componentes huérfanos | 28 | 2025-11-30 |
| Líneas de código | 48,126 | 2025-11-30 |
| Bundle size (gzip) | ~XXX KB | 2025-11-30 |
| Lazy loaded components | XX | 2025-11-30 |
| Console.logs | X | 2025-11-30 |
