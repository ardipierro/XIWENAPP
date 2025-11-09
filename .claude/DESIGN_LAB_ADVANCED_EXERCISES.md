# Design Lab - Ejercicios Avanzados (Lote 3)

**Fecha:** 2025-01-09
**Versión:** 3.0

## 📋 Resumen

Este documento describe los 4 nuevos ejercicios avanzados agregados al Design Lab, completando un total de **12 tipos de ejercicios interactivos**:

### Nuevos Ejercicios (9-12):

1. **VerbIdentificationExercise** - Identificación de verbos en texto
2. **InteractiveReadingExercise** - Lectura con traducciones modales
3. **AIAudioPronunciationExercise** - Pronunciación con audio IA natural
4. **FreeDragDropExercise** - Categorización con drag & drop flexible

---

## 🎯 1. VerbIdentificationExercise

### Descripción
Ejercicio donde los estudiantes deben identificar y seleccionar todos los verbos en un texto dado. Incluye información de conjugación al hacer hover sobre cada verbo.

### Props

```javascript
{
  instruction: string,           // Instrucción principal
  text: string,                  // Texto completo a analizar
  words: Array<{                 // Palabras del texto
    text: string,                // Palabra
    start: number,               // Posición inicio
    end: number,                 // Posición fin
    isVerb: boolean,             // Si es verbo
    conjugation?: string,        // Conjugación (e.g., "3ª persona singular")
    infinitive?: string,         // Forma infinitiva
    tense?: string,              // Tiempo verbal
    mood?: string                // Modo (indicativo, subjuntivo, etc.)
  }>,
  explanation: string,           // Explicación al completar
  cefrLevel: string,             // Nivel CEFR (A1-C2)
  verbsToFind: number,           // Número de verbos a encontrar
  onComplete: Function           // Callback al completar
}
```

### Características

- ✅ Click para seleccionar/deseleccionar verbos
- ✅ Contador de progreso (X / Y verbos seleccionados)
- ✅ Tooltips con información de conjugación
- ✅ Muestra verbos perdidos en feedback
- ✅ Tabla de información verbal
- ✅ Validación automática

### Ejemplo de Uso

```jsx
import { VerbIdentificationExercise } from '../components/designlab/exercises';

<VerbIdentificationExercise
  instruction="Selecciona todos los verbos en el siguiente texto"
  text="María estudia español todos los días. Ella practica con sus amigos."
  words={[
    { text: 'María', start: 0, end: 5, isVerb: false },
    { text: 'estudia', start: 6, end: 13, isVerb: true,
      conjugation: '3ª persona singular',
      infinitive: 'estudiar',
      tense: 'presente',
      mood: 'indicativo' },
    { text: 'español', start: 14, end: 21, isVerb: false },
    // ... más palabras
  ]}
  explanation="Los verbos conjugados indican acciones o estados."
  cefrLevel="A2"
  verbsToFind={2}
  onComplete={(result) => console.log(result)}
/>
```

### Casos de Uso

- Identificación de verbos en textos literarios
- Práctica de análisis gramatical
- Reconocimiento de tiempos verbales
- Ejercicios de conjugación

---

## 📖 2. InteractiveReadingExercise

### Descripción
Ejercicio de lectura interactiva donde los estudiantes pueden hacer click en palabras para ver sus traducciones en un modal flotante. Incluye opciones para audio de pronunciación y preguntas de comprensión.

### Props

```javascript
{
  title: string,                 // Título del ejercicio
  text: string,                  // Texto completo de lectura
  vocabulary: Array<{            // Vocabulario interactivo
    spanish: string,             // Palabra en español
    english: string,             // Traducción al inglés
    chinese: string,             // Traducción al chino (中文)
    start: number,               // Posición inicio
    end: number,                 // Posición fin
    context?: string,            // Contexto de uso
    audioUrl?: string            // URL de audio (opcional)
  }>,
  questions: Array<{             // Preguntas de comprensión (opcional)
    question: string,
    options: string[],
    correctAnswer: number
  }>,
  explanation: string,           // Explicación final
  cefrLevel: string,             // Nivel CEFR
  onComplete: Function           // Callback al completar
}
```

### Características

- ✅ Modal flotante que aparece cerca de la palabra clickeada
- ✅ Traducciones multilingües (Español/English/中文)
- ✅ Audio de pronunciación opcional
- ✅ Tracking de palabras exploradas
- ✅ Preguntas de comprensión opcionales
- ✅ Vista de vocabulario expandible
- ✅ Progreso de exploración

### Ejemplo de Uso

```jsx
import { InteractiveReadingExercise } from '../components/designlab/exercises';

<InteractiveReadingExercise
  title="Lectura: Un Día en Madrid"
  text="María visita el Museo del Prado en Madrid. Es un día soleado y perfecto para caminar por las calles históricas."
  vocabulary={[
    {
      spanish: 'visita',
      english: 'visits',
      chinese: '访问',
      start: 6,
      end: 12,
      context: 'Verbo: ir a ver un lugar',
      audioUrl: '/audio/visita.mp3'
    },
    {
      spanish: 'soleado',
      english: 'sunny',
      chinese: '阳光明媚',
      start: 52,
      end: 59,
      context: 'Adjetivo: con mucho sol'
    }
    // ... más vocabulario
  ]}
  questions={[
    {
      question: '¿Dónde está María?',
      options: ['En Barcelona', 'En Madrid', 'En Valencia', 'En Sevilla'],
      correctAnswer: 1
    }
  ]}
  explanation="La lectura interactiva ayuda a expandir tu vocabulario en contexto."
  cefrLevel="B1"
  onComplete={(result) => console.log(result)}
/>
```

### Casos de Uso

- Lectura de textos auténticos con apoyo de traducción
- Aprendizaje de vocabulario en contexto
- Comprensión lectora con verificación
- Práctica de pronunciación con audio

---

## 🎙️ 3. AIAudioPronunciationExercise

### Descripción
Ejercicio de práctica de pronunciación con audio generado por IA de alta calidad y voz natural (no robótica). Los estudiantes escuchan frases, ven la transcripción fonética, y reciben consejos de pronunciación.

### Props

```javascript
{
  title: string,                 // Título del ejercicio
  phrases: Array<{               // Frases para practicar
    text: string,                // Texto de la frase
    aiAudioUrl: string,          // URL del audio IA natural
    phonetic?: string,           // Transcripción fonética IPA
    difficulty?: string,         // 'easy' | 'medium' | 'hard'
    tips?: string                // Consejos de pronunciación
  }>,
  voiceType: string,             // 'male' | 'female' | 'neutral'
  accent: string,                // 'spain' | 'mexico' | 'argentina' | etc.
  explanation: string,           // Explicación final
  cefrLevel: string,             // Nivel CEFR
  onComplete: Function           // Callback al completar
}
```

### Características

- ✅ Audio IA de calidad natural (NO robótico)
- ✅ Control de velocidad de reproducción (0.5x - 1.25x)
- ✅ Navegación frase por frase
- ✅ Transcripción fonética opcional (IPA)
- ✅ Consejos de pronunciación específicos
- ✅ Indicadores de dificultad
- ✅ Progreso visual con dots
- ✅ Marcar frases como completadas
- ✅ Selección de voz (masculina/femenina/neutral)
- ✅ Selección de acento (España, México, Argentina, etc.)

### Ejemplo de Uso

```jsx
import { AIAudioPronunciationExercise } from '../components/designlab/exercises';

<AIAudioPronunciationExercise
  title="Práctica de Pronunciación: Sonidos Difíciles"
  phrases={[
    {
      text: 'La jirafa jaranera jugaba en el jardín',
      aiAudioUrl: '/audio/ai/phrase1.mp3',
      phonetic: 'la xi.ˈɾa.fa xa.ɾa.ˈne.ɾa xu.ˈɣa.βa en el xaɾ.ˈdin',
      difficulty: 'hard',
      tips: 'La "j" en español es un sonido gutural, similar a la "h" inglesa pero más fuerte.'
    },
    {
      text: 'Tres tristes tigres tragaban trigo',
      aiAudioUrl: '/audio/ai/phrase2.mp3',
      phonetic: 'tɾes ˈtɾis.tes ˈti.ɣɾes tɾa.ˈɣa.βan ˈtɾi.ɣo',
      difficulty: 'hard',
      tips: 'Practica el sonido "tr" manteniendo la lengua detrás de los dientes superiores.'
    }
  ]}
  voiceType="female"
  accent="spain"
  explanation="La práctica regular mejora la pronunciación. Escucha varias veces cada frase."
  cefrLevel="B2"
  onComplete={(result) => console.log(result)}
/>
```

### Casos de Uso

- Práctica de trabalenguas
- Entrenamiento de sonidos específicos
- Imitación de acentos nativos
- Mejora de fluidez oral
- Práctica de entonación

### Recomendaciones de Audio IA

Para generar audio de calidad natural, se recomienda usar servicios como:

- **Google Cloud Text-to-Speech** (voces WaveNet/Neural2)
- **Amazon Polly** (voces neurales)
- **Microsoft Azure Speech** (voces neurales)
- **ElevenLabs** (voces IA de alta calidad)
- **Play.ht** (voces realistas)

**Parámetros recomendados:**
- Formato: MP3 o WAV
- Sample rate: 24kHz o superior
- Calidad: Neural/WaveNet (no Standard)
- Acento: Especificar región (es-ES, es-MX, es-AR, etc.)

---

## 🎲 4. FreeDragDropExercise

### Descripción
Ejercicio de categorización flexible donde los estudiantes arrastran elementos a diferentes categorías. A diferencia del DragDropOrderExercise (que ordena en secuencia), este permite categorización libre en múltiples "buckets".

### Props

```javascript
{
  title: string,                 // Título del ejercicio
  instruction: string,           // Instrucción principal
  items: Array<{                 // Items a categorizar
    id: number | string,         // ID único
    text: string,                // Texto del item
    correctCategory: string      // ID de categoría correcta
  }>,
  categories: Array<{            // Categorías disponibles
    id: string,                  // ID único
    name: string,                // Nombre de la categoría
    color: string,               // Color hex (#rrggbb)
    icon?: string                // Icono (opcional)
  }>,
  explanation: string,           // Explicación final
  cefrLevel: string,             // Nivel CEFR
  onComplete: Function           // Callback al completar
}
```

### Características

- ✅ Drag & drop entre múltiples categorías
- ✅ Área de items sin categorizar
- ✅ Mover items entre categorías libremente
- ✅ Feedback visual durante el drag (hover states)
- ✅ Colores personalizados por categoría
- ✅ Validación automática
- ✅ Muestra items mal categorizados
- ✅ Progreso visual (X/Y categorizados)

### Ejemplo de Uso

```jsx
import { FreeDragDropExercise } from '../components/designlab/exercises';

<FreeDragDropExercise
  title="Categoriza las Palabras por Género"
  instruction="Arrastra cada sustantivo a la categoría correcta"
  items={[
    { id: 1, text: 'el libro', correctCategory: 'masculino' },
    { id: 2, text: 'la mesa', correctCategory: 'femenino' },
    { id: 3, text: 'el perro', correctCategory: 'masculino' },
    { id: 4, text: 'la casa', correctCategory: 'femenino' },
    { id: 5, text: 'el coche', correctCategory: 'masculino' },
    { id: 6, text: 'la flor', correctCategory: 'femenino' }
  ]}
  categories={[
    { id: 'masculino', name: 'Masculino', color: '#3b82f6' },
    { id: 'femenino', name: 'Femenino', color: '#ec4899' }
  ]}
  explanation="En español, todos los sustantivos tienen género gramatical."
  cefrLevel="A1"
  onComplete={(result) => console.log(result)}
/>
```

### Otros Ejemplos

**Categorizar por Tiempo Verbal:**
```javascript
categories={[
  { id: 'presente', name: 'Presente', color: '#10b981' },
  { id: 'preterito', name: 'Pretérito', color: '#f59e0b' },
  { id: 'futuro', name: 'Futuro', color: '#8b5cf6' }
]}

items={[
  { id: 1, text: 'como', correctCategory: 'presente' },
  { id: 2, text: 'comí', correctCategory: 'preterito' },
  { id: 3, text: 'comeré', correctCategory: 'futuro' }
]}
```

**Categorizar por Tipo de Palabra:**
```javascript
categories={[
  { id: 'sustantivo', name: 'Sustantivos', color: '#3b82f6' },
  { id: 'verbo', name: 'Verbos', color: '#ef4444' },
  { id: 'adjetivo', name: 'Adjetivos', color: '#10b981' }
]}
```

### Casos de Uso

- Clasificación de género gramatical
- Ordenar verbos por tiempo/modo
- Categorizar artículos (definidos/indefinidos)
- Agrupar palabras por familia semántica
- Separar cognados falsos de cognados verdaderos
- Clasificar pronombres por persona

---

## 📊 Tabla Comparativa de los 12 Ejercicios

| # | Tipo | Dificultad | Interactividad | Multimedia | Ideal Para |
|---|------|-----------|----------------|------------|------------|
| 1 | MultipleChoice | ⭐⭐ | Click | - | Gramática, vocabulario básico |
| 2 | FillInBlank | ⭐⭐ | Texto | Audio | Vocabulario en contexto |
| 3 | Matching | ⭐⭐⭐ | Click | - | Asociaciones, traducciones |
| 4 | TrueFalse | ⭐ | Click | - | Comprensión rápida |
| 5 | AudioListening | ⭐⭐⭐⭐ | Audio + Click | Audio | Comprensión auditiva |
| 6 | TextSelection | ⭐⭐⭐ | Click + Hover | - | Vocabulario en contexto |
| 7 | DragDropOrder | ⭐⭐⭐ | Drag & Drop | - | Orden de palabras |
| 8 | DialogueRolePlay | ⭐⭐⭐⭐ | Texto + Audio | Audio | Conversación |
| 9 | VerbIdentification | ⭐⭐⭐⭐ | Click + Hover | - | Gramática avanzada |
| 10 | InteractiveReading | ⭐⭐⭐⭐⭐ | Click + Modal | Audio | Lectura comprensiva |
| 11 | AIAudioPronunciation | ⭐⭐⭐⭐⭐ | Audio IA | Audio IA | Pronunciación nativa |
| 12 | FreeDragDrop | ⭐⭐⭐⭐ | Drag & Drop | - | Categorización |

---

## 🎨 Configuración Visual Ampliada

### Nuevas Opciones de Personalización

El SettingsPanel ha sido expandido con **6 tabs organizados**:

#### 1. **General**
- Tema (claro/oscuro)
- Nivel CEFR (A1-C2)
- Opciones de interacción (animaciones, sonidos, autocorrección, pistas)

#### 2. **Tipografía**
- Tamaño de fuente (12-24px)
- Familia de fuente (sans-serif, serif, mono, dyslexic-friendly)
- Espaciado de línea (1.2 - 2.2)
- Espaciado de letras (tight, normal, wide)
- Peso de fuente (light, normal, medium, semibold, bold)

#### 3. **Colores** (15+ opciones)
- Colores de feedback (correcto, incorrecto, neutral)
- Colores base (texto, fondo ejercicio, fondo cards, bordes)
- Colores de acento (primario, secundario, links, hover, focus)
- Colores de estado (success, warning, error, info)
- Gradientes (inicio, fin)

#### 4. **Estilos** (13+ opciones)
- Bordes redondeados (sharp, slight, normal, rounded, pill)
- Grosor de bordes (thin, normal, thick)
- Intensidad de sombra (none, subtle, normal, strong)
- Espaciado interno (compact, normal, comfortable, spacious)
- Ancho de cards (narrow, normal, wide, full)
- Tamaño de botones e iconos (sm, normal, lg, xl)
- Estilo de badges (filled, outlined, soft)
- Estilo de barra de progreso (solid, gradient, striped)
- Efecto hover (none, subtle, normal, strong)
- Velocidad de transiciones (instant, fast, normal, slow)
- Densidad de contenido (compact, normal, comfortable)

#### 5. **Efectos**
- Efectos de blur
- Usar gradientes
- Glassmorphism
- Neumorphism

#### 6. **Accesibilidad**
- Modo alto contraste
- Reducir movimiento
- Indicadores de enfoque (subtle, normal, strong)
- Subrayar enlaces
- Áreas de click más grandes
- Optimizado para lectores de pantalla

### DEFAULT_CONFIG Expandido

```javascript
export const DEFAULT_CONFIG = {
  // Tema
  theme: 'light',

  // Tipografía
  fontSize: 16,
  fontFamily: 'sans-serif',
  lineHeight: 1.6,
  letterSpacing: 'normal',
  fontWeight: 'normal',

  // Colores de feedback
  feedbackColors: {
    correct: '#10b981',
    incorrect: '#ef4444',
    neutral: '#71717a'
  },

  // Colores personalizados (15 opciones)
  customColors: {
    textColor: null,
    exerciseBackground: null,
    cardBackground: null,
    borderColor: null,
    primaryAccent: null,
    secondaryAccent: null,
    successColor: null,
    warningColor: null,
    errorColor: null,
    infoColor: null,
    linkColor: null,
    hoverColor: null,
    focusColor: null,
    gradientStart: null,
    gradientEnd: null
  },

  // Estilos personalizados (13 opciones)
  customStyles: {
    borderRadius: 'normal',
    borderWidth: 'normal',
    shadowIntensity: 'normal',
    padding: 'normal',
    cardWidth: 'normal',
    buttonSize: 'normal',
    iconSize: 'normal',
    badgeStyle: 'filled',
    progressBarStyle: 'gradient',
    hoverEffect: 'normal',
    transitionSpeed: 'normal',
    contentDensity: 'normal'
  },

  // Efectos visuales
  visualEffects: {
    blur: false,
    gradients: true,
    glassmorphism: false,
    neumorphism: false
  },

  // Interacción
  animations: true,
  soundEffects: true,
  autoCorrect: false,
  showHints: true,

  // Accesibilidad
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    focusIndicators: 'normal',
    underlineLinks: false,
    largerClickTargets: false,
    screenReaderOptimized: false
  },

  // General
  difficultyLevel: 'intermediate',
  language: 'es',
  cefrLevel: 'A1'
};
```

---

## 🚀 Uso Avanzado

### Combinar Múltiples Ejercicios

```jsx
function LessonPlan() {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [results, setResults] = useState([]);

  const exercises = [
    // 1. Primero, lectura con vocabulario
    <InteractiveReadingExercise
      title="Lectura: Mi familia"
      text="..."
      vocabulary={[...]}
      onComplete={(result) => handleComplete(result, 0)}
    />,

    // 2. Luego, identificar verbos del texto
    <VerbIdentificationExercise
      instruction="Encuentra los verbos en el texto anterior"
      text="..."
      words={[...]}
      onComplete={(result) => handleComplete(result, 1)}
    />,

    // 3. Práctica de pronunciación
    <AIAudioPronunciationExercise
      title="Practica las frases clave"
      phrases={[...]}
      onComplete={(result) => handleComplete(result, 2)}
    />,

    // 4. Categorización gramatical
    <FreeDragDropExercise
      title="Clasifica las palabras por tipo"
      items={[...]}
      categories={[...]}
      onComplete={(result) => handleComplete(result, 3)}
    />
  ];

  const handleComplete = (result, index) => {
    setResults([...results, result]);
    if (index < exercises.length - 1) {
      setCurrentExercise(index + 1);
    }
  };

  return exercises[currentExercise];
}
```

---

## 📝 Guía de Integración

### 1. Importar los Nuevos Ejercicios

```javascript
import {
  VerbIdentificationExercise,
  InteractiveReadingExercise,
  AIAudioPronunciationExercise,
  FreeDragDropExercise
} from '../components/designlab/exercises';
```

### 2. Usar el Hook de Configuración

```javascript
import { useDesignLabConfig } from '../hooks/useDesignLabConfig';

function MyComponent() {
  const { config, updateField } = useDesignLabConfig();

  return (
    <div style={{
      fontSize: `${config.fontSize}px`,
      fontFamily: config.fontFamily,
      lineHeight: config.lineHeight
    }}>
      {/* Contenido */}
    </div>
  );
}
```

### 3. Aplicar Estilos Personalizados

Todos los ejercicios respetan automáticamente la configuración visual del usuario gracias al hook `useDesignLabConfig()`.

---

## 🎯 Mejores Prácticas

### Para VerbIdentificationExercise

✅ **Hacer:**
- Incluir verbos de diferentes conjugaciones
- Proporcionar información de conjugación detallada
- Usar textos auténticos y relevantes

❌ **Evitar:**
- Textos con demasiados verbos (máx. 10-12)
- Omitir información de conjugación
- Usar solo un tiempo verbal

### Para InteractiveReadingExercise

✅ **Hacer:**
- Seleccionar vocabulario clave del texto
- Proporcionar traducciones precisas
- Incluir contexto de uso
- Agregar audio cuando sea posible

❌ **Evitar:**
- Marcar demasiadas palabras como interactivas (>30% del texto)
- Omitir traducciones multilingües
- Textos demasiado largos (>300 palabras)

### Para AIAudioPronunciationExercise

✅ **Hacer:**
- Usar audio de ALTA CALIDAD (voces neurales)
- Proporcionar transcripción fonética IPA
- Dar consejos específicos de pronunciación
- Ordenar de fácil a difícil

❌ **Evitar:**
- Usar voces robóticas o de baja calidad
- Frases demasiado largas (>15 palabras)
- Omitir el campo `phonetic` para principiantes

### Para FreeDragDropExercise

✅ **Hacer:**
- Usar colores distintivos por categoría
- Limitar a 3-4 categorías máximo
- 6-12 items total
- Nombres de categoría claros

❌ **Evitar:**
- Demasiadas categorías (>5)
- Demasiados items (>15)
- Colores similares entre categorías

---

## 📚 Recursos Adicionales

### Audio IA Recomendado

**Google Cloud Text-to-Speech:**
```bash
# Español de España (voz neural femenina)
--voice es-ES-Neural2-A

# Español de México (voz neural masculina)
--voice es-MX-Neural2-B

# Español de Argentina
--voice es-AR-Neural2-A
```

**Amazon Polly:**
```python
# Voz neural española
voice_id='Lucia'  # España (mujer)
voice_id='Sergio' # España (hombre)

# Voz neural mexicana
voice_id='Mia'    # México (mujer)
```

### Transcripción Fonética

**Herramientas IPA:**
- [easypronunciation.com/es](https://easypronunciation.com/es) - Conversor español → IPA
- [toPhonetics](https://tophonetics.com) - Conversor multilingüe
- [IPA Chart](https://www.ipachart.com) - Tabla de referencia IPA

---

## 🔄 Migración desde Versiones Anteriores

Si ya tienes ejercicios del Design Lab (versión 1.0 o 2.0), no hay cambios breaking. Los nuevos ejercicios se agregan sin afectar los existentes.

**Actualización de DEFAULT_CONFIG:**

Si tienes configuraciones guardadas en Firestore, el sistema automáticamente hace merge con los nuevos campos usando valores por defecto:

```javascript
const userConfig = await getDesignLabConfig(userId);
// userConfig contendrá los nuevos campos con valores por defecto
```

---

## ✅ Checklist de Implementación

- [ ] Importar los 4 nuevos ejercicios
- [ ] Actualizar imports en `exercises/index.js`
- [ ] Preparar audio IA para AIAudioPronunciationExercise
- [ ] Crear contenido de ejemplo para cada ejercicio
- [ ] Probar SettingsPanel con todas las nuevas opciones
- [ ] Verificar responsive design en móvil
- [ ] Validar accesibilidad (ARIA)
- [ ] Testear en modo claro y oscuro
- [ ] Documentar ejercicios personalizados

---

## 📞 Soporte

Para problemas o preguntas:
- Revisar `.claude/DESIGN_LAB.md` (ejercicios 1-4)
- Revisar `.claude/DESIGN_LAB_NEW_EXERCISES.md` (ejercicios 5-8)
- Revisar este documento (ejercicios 9-12)
- Consultar código fuente en `src/components/designlab/exercises/`

---

**Versión:** 3.0
**Ejercicios Totales:** 12
**Opciones de Personalización:** 50+
**Última Actualización:** 2025-01-09
