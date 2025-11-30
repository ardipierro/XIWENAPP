# 🎨 Diagrama Visual: Traductor con Popup

## 📱 Flujo de Interfaz de Usuario

### Paso 1: Estado inicial - Contenido normal
```
┌─────────────────────────────────────────────┐
│  📖 Contenido de la Clase                   │
├─────────────────────────────────────────────┤
│                                             │
│  Juan: Buenos días, ¿cómo estás?          │
│                                             │
│  María: Estoy bien, gracias. ¿Y tú?       │
│                                             │
│  Juan: También estoy bien. ¿Qué tal       │
│  el trabajo?                               │
│                                             │
│        ↑ Usuario lee el contenido          │
└─────────────────────────────────────────────┘
```

---

### Paso 2: Usuario selecciona una palabra/frase
```
┌─────────────────────────────────────────────┐
│  📖 Contenido de la Clase                   │
├─────────────────────────────────────────────┤
│                                             │
│  Juan: Buenos días, ¿cómo estás?          │
│                                             │
│  María: Estoy bien, gracias. ¿Y tú?       │
│                                             │
│  Juan: También estoy bien. ¿Qué tal       │
│  el ⟪trabajo⟫?                             │
│      ▔▔▔▔▔▔▔                               │
│      └─ Usuario seleccionó esta palabra    │
│                                             │
└─────────────────────────────────────────────┘
```

---

### Paso 3: Aparece botón flotante "Traducir"
```
┌─────────────────────────────────────────────┐
│  📖 Contenido de la Clase                   │
├─────────────────────────────────────────────┤
│                                             │
│  Juan: Buenos días, ¿cómo estás?          │
│                                             │
│  María: Estoy bien, gracias. ¿Y tú?       │
│                       ┌──────────────┐     │
│  Juan: También estoy  │ 🌐 Traducir  │     │
│  el ⟪trabajo⟫?         │     翻译      │     │
│      ▔▔▔▔▔▔▔          └──────────────┘     │
│                             ↑               │
│                    Botón flotante aparece   │
│                    cerca de la selección    │
└─────────────────────────────────────────────┘
```

---

### Paso 4: Usuario hace clic en "Traducir"
```
┌─────────────────────────────────────────────┐
│  📖 Contenido de la Clase                   │
├─────────────────────────────────────────────┤
│                                             │
│  Juan: Buenos días, ¿cómo estás?          │
│                                             │
│  María: Estoy bien, gracias. ¿Y tú?       │
│                       ┌──────────────┐     │
│  Juan: También estoy  │ 🌐 Traducir  │◄─┐  │
│  el ⟪trabajo⟫?         │     翻译      │  │  │
│      ▔▔▔▔▔▔▔          └──────────────┘  │  │
│                                          │  │
│                             Usuario hace clic│
│                                             │
│         ⌛ Traduciendo...                   │
└─────────────────────────────────────────────┘
```

---

### Paso 5: Popup con traducción aparece
```
┌─────────────────────────────────────────────┐
│  📖 Contenido de la Clase                   │
├─────────────────────────────────────────────┤
│                                             │
│  Juan: Buenos días, ¿cómo estás?          │
│  ┌──────────────────────────────────┐      │
│  │ 📝 Traducción                    │      │
│  ├──────────────────────────────────┤      │
│  │ trabajo → 工作 (gōngzuò)         │      │
│  │                                  │      │
│  │ 💡 Significados:                 │      │
│  │  • Trabajo, empleo               │      │
│  │  • Labor, tarea                  │      │
│  │                                  │      │
│  │ 📌 Ejemplo:                      │      │
│  │  "Voy al trabajo" = 我去上班      │      │
│  │                                  │      │
│  │        [❌ Cerrar]  [📋 Copiar]   │      │
│  └──────────────────────────────────┘      │
│  María: Estoy bien, gracias. ¿Y tú?       │
│                                             │
│  Juan: También estoy bien. ¿Qué tal       │
│  el trabajo?                               │
└─────────────────────────────────────────────┘
```

---

## 🔄 Diagrama de Flujo Técnico

```mermaid
graph TD
    A[Usuario lee contenido] --> B[Usuario selecciona texto]
    B --> C{¿Hay texto seleccionado?}
    C -->|No| A
    C -->|Sí| D[Mostrar botón flotante 'Traducir 翻译']

    D --> E{¿Usuario hace clic?}
    E -->|No - Click fuera| F[Ocultar botón]
    F --> A
    E -->|Sí| G[Mostrar loading]

    G --> H{¿Traducción en cache?}
    H -->|Sí| J[Mostrar popup con traducción]
    H -->|No| I[Llamar API de IA]

    I --> K[Recibir respuesta]
    K --> L[Guardar en cache]
    L --> J

    J --> M{¿Usuario interactúa?}
    M -->|Cerrar| A
    M -->|Copiar| N[Copiar al portapapeles]
    N --> A
    M -->|Selecciona otro texto| B
```

---

## ⚙️ Diagrama de Secuencia (Componentes)

```mermaid
sequenceDiagram
    participant U as Usuario
    participant C as ContentViewer
    participant D as SelectionDetector
    participant T as TranslationPopup
    participant H as useTranslator Hook
    participant AI as callAI (Firebase)
    participant Cache as LocalStorage

    U->>C: Lee contenido
    U->>C: Selecciona "trabajo"
    C->>D: onMouseUp event
    D->>D: window.getSelection()
    D->>T: Mostrar botón flotante
    T-->>U: Muestra "🌐 Traducir 翻译"

    U->>T: Click en botón
    T->>H: translate("trabajo", "es", "zh")

    H->>Cache: ¿Existe "trabajo"?

    alt Traducción en cache
        Cache-->>H: { chinese: "工作", pinyin: "gōngzuò" }
        H-->>T: Devolver traducción
    else No en cache
        H->>AI: callAI("translator", "Traduce: trabajo")
        AI-->>H: Respuesta IA
        H->>Cache: Guardar traducción
        H-->>T: Devolver traducción
    end

    T-->>U: Mostrar popup con traducción

    U->>T: Click en "Cerrar" o fuera
    T->>C: Limpiar selección
    C-->>U: Volver a estado normal
```

---

## 🎨 Mockup Visual Detallado

### Vista del Popup de Traducción (Diseño Final)

```
╔═══════════════════════════════════════════════╗
║                                               ║
║  Juan: También estoy bien. ¿Qué tal         ║
║  el ⟪trabajo⟫?                               ║
║      ▔▔▔▔▔▔▔                                 ║
║       │                                       ║
║       └─────┐                                ║
║             ↓                                 ║
║    ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓         ║
║    ┃ 🌐 Traducción                 ┃         ║
║    ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫         ║
║    ┃                                ┃         ║
║    ┃ 📌 trabajo                     ┃         ║
║    ┃                                ┃         ║
║    ┃ 🇨🇳 工作                        ┃         ║
║    ┃    gōngzuò                     ┃         ║
║    ┃                                ┃         ║
║    ┃ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ┃         ║
║    ┃                                ┃         ║
║    ┃ 💡 Significados:               ┃         ║
║    ┃  • Trabajo, empleo             ┃         ║
║    ┃  • Labor, tarea                ┃         ║
║    ┃  • Obra, pieza                 ┃         ║
║    ┃                                ┃         ║
║    ┃ 📝 Ejemplo:                    ┃         ║
║    ┃  ES: "Voy al trabajo"          ┃         ║
║    ┃  中文: 我去上班                  ┃         ║
║    ┃                                ┃         ║
║    ┃ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ┃         ║
║    ┃                                ┃         ║
║    ┃   [❌ Cerrar]    [📋 Copiar]   ┃         ║
║    ┃                                ┃         ║
║    ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛         ║
║                                               ║
║  María: Muy bien también.                    ║
║                                               ║
╚═══════════════════════════════════════════════╝
```

---

## 🚀 Estados del Sistema

### Estado 1: Normal
- Contenido visible
- Sin selección
- Sin botones extras

### Estado 2: Texto seleccionado
- Texto resaltado
- Botón flotante "Traducir 翻译" visible
- Posicionado cerca de la selección

### Estado 3: Traduciendo
- Botón muestra "⌛ Traduciendo..."
- Deshabilitado durante carga
- Duración: ~1-2 segundos

### Estado 4: Traducción mostrada
- Popup visible con traducción
- Opciones: Cerrar, Copiar
- Auto-cierra si se selecciona otro texto

---

## 📊 Datos del Popup

```javascript
{
  word: "trabajo",              // Palabra original
  chinese: "工作",              // Traducción al chino
  pinyin: "gōngzuò",           // Pronunciación
  meanings: [                   // Significados
    "Trabajo, empleo",
    "Labor, tarea",
    "Obra, pieza"
  ],
  example: {                    // Ejemplo de uso
    spanish: "Voy al trabajo",
    chinese: "我去上班"
  },
  cached: true                  // Si vino del cache
}
```

---

## 🎯 Ventajas de este diseño

✅ **No interrumpe la lectura**: El popup es pequeño y no tapa mucho contenido
✅ **Rápido**: Cache local evita llamadas repetidas a la IA
✅ **Contextual**: Aparece solo cuando el usuario lo necesita
✅ **Educativo**: No solo traduce, da contexto y ejemplos
✅ **Accesible**: Se puede cerrar con ESC o clic fuera
✅ **Móvil-friendly**: Funciona en táctil (long-press para seleccionar)

---

## 📁 Archivos a crear

1. `src/components/translation/TranslationPopup.jsx` - Componente del popup
2. `src/components/translation/SelectionDetector.jsx` - Detecta selección de texto
3. `src/hooks/useTranslator.js` - Hook para traducir con cache
4. `src/utils/translationCache.js` - Sistema de cache local

## 🔧 Archivos a modificar

1. `src/components/ContentViewer.jsx` - Agregar SelectionDetector
2. `src/components/InteractiveBookViewer.jsx` - Agregar SelectionDetector
3. `src/components/interactive-book/DialogueBubble.jsx` - Agregar SelectionDetector
4. `src/constants/aiFunctions.js` - Habilitar función translator

---

¿Te queda más claro ahora? 😊
