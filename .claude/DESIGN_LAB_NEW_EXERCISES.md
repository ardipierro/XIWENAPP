# 🎨 Design Lab - Nuevos Ejercicios Avanzados

**Actualización:** 2025-11-08 (v2.0)
**Adición:** 4 nuevos tipos de ejercicios + personalización visual avanzada

---

## 🆕 Nuevos Tipos de Ejercicios (4)

### 1. AudioListeningExercise 🎧

**Comprensión auditiva con audio de español rioplatense**

**Características:**
- 🎵 Reproductor de audio con controles completos
- ⚡ Control de velocidad (0.75x, 1x, 1.25x, 1.5x)
- 📝 Transcripción opcional (toggle)
- ❓ Múltiples preguntas de comprensión (MCQ)
- 🇦🇷 Español rioplatense (argentino/uruguayo)
- 📊 Visualización de progreso (waveform simple)
- ⏸️ Play/Pause con seek bar

**Props:**
```jsx
<AudioListeningExercise
  title="Diálogo en el Supermercado"
  audioUrl="/audio/ejemplo.mp3"
  transcript="Che, ¿vos sabés dónde están las galletitas?"
  questions={[
    {
      question: '¿Qué está buscando?',
      options: [
        { value: 'a', label: 'Cereales' },
        { value: 'b', label: 'Galletitas' }
      ],
      correctAnswer: 'b'
    }
  ]}
  explanation="El español rioplatense usa 'vos' en lugar de 'tú'."
  cefrLevel="B1"
  showTranscript={false}
  onComplete={(result) => console.log(result)}
/>
```

---

### 2. TextSelectionExercise 🇨🇳

**Selección de texto con traducción al chino simplificado**

**Características:**
- 🖱️ Selección de palabras interactiva (click)
- 🏮 Tooltips con traducción al chino (hover)
- 📚 Glosario completo desplegable (Español → 中文)
- ✨ Highlighting visual de palabras seleccionables
- 🎯 Validación de palabra objetivo
- 📖 Soporte para frases completas

**Props:**
```jsx
<TextSelectionExercise
  instruction="Selecciona la palabra que significa 'libro'"
  text="En la mesa hay un libro, una pluma y un cuaderno."
  words={[
    { spanish: 'mesa', chinese: '桌子', start: 6, end: 10 },
    { spanish: 'libro', chinese: '书', start: 18, end: 23 },
    { spanish: 'pluma', chinese: '钢笔', start: 29, end: 34 },
    { spanish: 'cuaderno', chinese: '笔记本', start: 40, end: 48 }
  ]}
  targetWord="libro"
  explanation="书 (shū) significa 'libro' en chino."
  cefrLevel="A2"
  onComplete={(result) => console.log(result)}
/>
```

---

### 3. DragDropOrderExercise 🎯

**Ordenar elementos con drag & drop REAL (HTML5 API)**

**Características:**
- 🎯 **Verdadero drag & drop** (API HTML5 nativa)
- 🔢 Números de posición opcionales
- 🎨 Feedback visual durante el arrastre
- 🔀 Botón "Mezclar" para randomizar
- 📝 Vista previa de oración formada
- ✨ Animaciones suaves de transición

**Props:**
```jsx
<DragDropOrderExercise
  instruction="Arrastra las palabras para formar la oración correcta"
  items={['Yo', 'me', 'levanto', 'a', 'las', 'ocho']}
  explanation="En español, el verbo reflexivo va después del pronombre."
  cefrLevel="A1"
  showNumbers={true}
  onComplete={(result) => console.log(result)}
/>
```

---

### 4. DialogueRolePlayExercise 💬

**Diálogo interactivo con role-play**

**Características:**
- 💬 Interfaz de chat en tiempo real
- 🎭 Usuario juega un rol específico (A o B)
- ✍️ Inputs para respuestas del usuario
- 🎤 Soporte de audio por turno de diálogo
- ✅ Múltiples respuestas correctas aceptadas
- 📊 Barra de progreso del diálogo
- 🎯 Validación contextual de respuestas
- 📱 Vista de conversación estilo mensajería

**Props:**
```jsx
<DialogueRolePlayExercise
  title="Conversación en un Restaurante"
  context="Estás en un restaurante y el mesero viene a tomar tu orden."
  dialogue={[
    { speaker: 'A', text: 'Buenas tardes, ¿qué desea ordenar?' },
    {
      speaker: 'B',
      userInput: true,
      correctAnswers: ['Quiero una pizza', 'Una pizza por favor']
    },
    { speaker: 'A', text: '¿Qué sabor prefiere?' },
    {
      speaker: 'B',
      userInput: true,
      correctAnswers: ['Margherita', 'De queso']
    }
  ]}
  roleA="Mesero"
  roleB="Cliente"
  userRole="B"
  explanation="Usa expresiones corteses en contextos formales."
  cefrLevel="A2"
  onComplete={(result) => console.log(result)}
/>
```

---

## 🎨 Nueva Personalización Visual

### Opciones de Colores Personalizados

Ahora puedes personalizar:

1. **textColor** - Color del texto en ejercicios
2. **exerciseBackground** - Fondo de las tarjetas de ejercicio
3. **cardBackground** - Fondo de cards internas
4. **borderColor** - Color de los bordes

**Configuración en SettingsPanel:**
```jsx
{
  customColors: {
    textColor: '#2c3e50',           // Color de texto
    exerciseBackground: '#ecf0f1',  // Fondo ejercicio
    cardBackground: '#ffffff',      // Fondo cards
    borderColor: '#3498db'          // Bordes
  }
}
```

**Guardado automático en Firestore:**
```
users/{userId}/configs/designLab/
  customColors:
    textColor: string | null
    exerciseBackground: string | null
    cardBackground: string | null
    borderColor: string | null
```

**Uso en componentes:**
Los colores se aplican automáticamente mediante `config.customColors`:

```jsx
const { config } = useDesignLabConfig();

<div style={{
  color: config.customColors?.textColor,
  backgroundColor: config.customColors?.exerciseBackground,
  borderColor: config.customColors?.borderColor
}}>
```

---

## 📊 Tabla Comparativa de Ejercicios

| Ejercicio | Tipo | Interactividad | Nivel | Características Especiales |
|-----------|------|----------------|-------|----------------------------|
| **AudioListeningExercise** | Auditiva | Alta | B1+ | 🎧 Audio rioplatense, velocidad variable |
| **TextSelectionExercise** | Vocabulario | Media | A2+ | 🇨🇳 Traducciones al chino, tooltips |
| **DragDropOrderExercise** | Sintaxis | Alta | A1+ | 🎯 Drag & drop real (HTML5) |
| **DialogueRolePlayExercise** | Conversación | Muy Alta | A2+ | 💬 Role-play interactivo |

---

## 🔧 Integración en DesignLabPage

Los 4 nuevos ejercicios están incluidos en los ejemplos:

```jsx
import {
  AudioListeningExercise,
  TextSelectionExercise,
  DragDropOrderExercise,
  DialogueRolePlayExercise
} from '../components/designlab/exercises';

// Renderizado condicional
{example.type === 'audio-listening' && <AudioListeningExercise {...props} />}
{example.type === 'text-selection' && <TextSelectionExercise {...props} />}
{example.type === 'dragdrop-order' && <DragDropOrderExercise {...props} />}
{example.type === 'dialogue-roleplay' && <DialogueRolePlayExercise {...props} />}
```

---

## 📝 Ejemplos de Uso Completos

### Ejemplo 1: Audio Listening (Rioplatense)

```jsx
<AudioListeningExercise
  title="Diálogo en el Supermercado"
  audioUrl="/audio/supermercado-rioplatense.mp3"
  transcript="Che, ¿vos sabés dónde están las galletitas? Sí, mirá, están en el pasillo tres, al lado de los cereales."
  questions={[
    {
      question: '¿Qué está buscando la persona?',
      options: [
        { value: 'a', label: 'Cereales' },
        { value: 'b', label: 'Galletitas' },
        { value: 'c', label: 'Pan' }
      ],
      correctAnswer: 'b'
    },
    {
      question: '¿En qué pasillo están las galletitas?',
      options: [
        { value: 'a', label: 'Pasillo 1' },
        { value: 'b', label: 'Pasillo 2' },
        { value: 'c', label: 'Pasillo 3' }
      ],
      correctAnswer: 'c'
    }
  ]}
  explanation="El español rioplatense usa 'vos' en lugar de 'tú' y tiene entonación característica."
  cefrLevel="B1"
  showTranscript={false}
  onComplete={(result) => {
    console.log('Score:', result.score);
    console.log('Correct:', result.correct);
  }}
/>
```

### Ejemplo 2: Text Selection (Chino)

```jsx
<TextSelectionExercise
  instruction="Selecciona la palabra que significa 'libro'"
  text="En la mesa hay un libro, una pluma y un cuaderno."
  words={[
    { spanish: 'mesa', chinese: '桌子', start: 6, end: 10 },
    { spanish: 'libro', chinese: '书', start: 18, end: 23 },
    { spanish: 'pluma', chinese: '钢笔', start: 29, end: 34 },
    { spanish: 'cuaderno', chinese: '笔记本', start: 40, end: 48 }
  ]}
  targetWord="libro"
  explanation="书 (shū) significa 'libro' en chino."
  cefrLevel="A2"
  onComplete={(result) => console.log(result)}
/>
```

### Ejemplo 3: Drag & Drop Order

```jsx
<DragDropOrderExercise
  instruction="Arrastra las palabras para formar la oración correcta"
  items={['Yo', 'me', 'levanto', 'a', 'las', 'ocho']}
  explanation="En español, el verbo reflexivo va después del pronombre."
  cefrLevel="A1"
  showNumbers={true}
  onComplete={(result) => {
    console.log('Correct order:', result.correct);
    console.log('User order:', result.userOrder);
  }}
/>
```

### Ejemplo 4: Dialogue Role-Play

```jsx
<DialogueRolePlayExercise
  title="Conversación en un Restaurante"
  context="Estás en un restaurante y el mesero viene a tomar tu orden."
  dialogue={[
    { speaker: 'A', text: 'Buenas tardes, ¿qué desea ordenar?' },
    {
      speaker: 'B',
      userInput: true,
      correctAnswers: ['Quiero una pizza', 'Una pizza por favor', 'Me gustaría una pizza']
    },
    { speaker: 'A', text: '¿Qué sabor de pizza prefiere?' },
    {
      speaker: 'B',
      userInput: true,
      correctAnswers: ['Margherita', 'De queso', 'Napolitana']
    },
    { speaker: 'A', text: 'Perfecto, ¿algo para tomar?' },
    {
      speaker: 'B',
      userInput: true,
      correctAnswers: ['Agua', 'Una gaseosa', 'Agua mineral']
    }
  ]}
  roleA="Mesero"
  roleB="Cliente"
  userRole="B"
  explanation="Es importante usar 'por favor' y expresiones corteses en contextos formales."
  cefrLevel="A2"
  onComplete={(result) => {
    console.log('Dialogue completed:', result.correct);
    console.log('User inputs:', result.userInputs);
  }}
/>
```

---

## ✅ Checklist de Características

### AudioListeningExercise:
- [x] Reproductor de audio completo
- [x] Control de velocidad (0.75x - 1.5x)
- [x] Transcripción toggleable
- [x] Preguntas MCQ de comprensión
- [x] Seek bar con progreso visual
- [x] Soporte español rioplatense

### TextSelectionExercise:
- [x] Click para seleccionar palabras
- [x] Hover tooltips con traducción chino
- [x] Glosario desplegable completo
- [x] Visual highlighting
- [x] Validación de palabra correcta

### DragDropOrderExercise:
- [x] HTML5 drag & drop API
- [x] Números de posición
- [x] Feedback visual durante drag
- [x] Botón shuffle
- [x] Vista previa de oración

### DialogueRolePlayExercise:
- [x] Interfaz de chat
- [x] Role selection (A o B)
- [x] Inputs interactivos
- [x] Audio por turno
- [x] Múltiples respuestas válidas
- [x] Barra de progreso

### Personalización Visual:
- [x] Color de texto personalizado
- [x] Fondo de ejercicio personalizado
- [x] Fondo de cards personalizado
- [x] Color de bordes personalizado
- [x] Picker de colores visual
- [x] Input manual de hex codes
- [x] Botón de reset
- [x] Guardado en Firestore

---

## 📚 Documentación Adicional

Para documentación completa del Design Lab original, ver:
- `.claude/DESIGN_LAB.md` - Guía completa original
- `src/components/designlab/README.md` - Referencia de componentes

---

**Versión:** 2.0
**Fecha:** 2025-11-08
**Total de tipos de ejercicios:** 8 (4 originales + 4 nuevos)
