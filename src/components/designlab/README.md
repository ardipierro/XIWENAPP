# 🎨 Design Lab - Sistema de Ejercicios Interactivos ELE

**Versión:** 3.0 | **Última actualización:** 2025-01-09

Sistema completo para crear y ejecutar ejercicios interactivos de **Español como Lengua Extranjera (ELE)**. Incluye **12 tipos de ejercicios**, **50+ opciones de personalización visual**, y soporte multilingüe.

---

## 🚀 Inicio Rápido (5 minutos)

### 1. Importar Ejercicios

```jsx
import {
  // Básicos (1-4)
  MultipleChoiceExercise,
  FillInBlankExercise,
  MatchingExercise,
  TrueFalseExercise,
  // Intermedios (5-8)
  AudioListeningExercise,
  TextSelectionExercise,
  DragDropOrderExercise,
  DialogueRolePlayExercise,
  // Avanzados (9-12)
  VerbIdentificationExercise,
  InteractiveReadingExercise,
  AIAudioPronunciationExercise,
  FreeDragDropExercise
} from './components/designlab/exercises';
```

### 2. Usar un Ejercicio

```jsx
<AIAudioPronunciationExercise
  title="Práctica de Pronunciación"
  phrases={[
    {
      text: 'Buenos días, ¿cómo está usted?',
      aiAudioUrl: '/audio/ai/buenos-dias.mp3',
      phonetic: 'ˈbwe.nos ˈdi.as ˈko.mo es.ˈta us.ˈteð',
      difficulty: 'easy',
      tips: 'Nota la entonación ascendente en la pregunta'
    }
  ]}
  voiceType="female"
  accent="spain"
  cefrLevel="A2"
  onComplete={(result) => console.log(result)}
/>
```

---

## 📚 12 Tipos de Ejercicios Disponibles

### Básicos (1-4)

| # | Tipo | Dificultad | Ideal Para |
|---|------|-----------|------------|
| 1 | **MultipleChoiceExercise** | ⭐⭐ | Gramática, vocabulario básico |
| 2 | **FillInBlankExercise** | ⭐⭐ | Vocabulario en contexto |
| 3 | **MatchingExercise** | ⭐⭐⭐ | Asociaciones, traducciones |
| 4 | **TrueFalseExercise** | ⭐ | Comprensión rápida |

### Intermedios (5-8)

| # | Tipo | Dificultad | Ideal Para |
|---|------|-----------|------------|
| 5 | **AudioListeningExercise** | ⭐⭐⭐⭐ | Comprensión auditiva (Español Rioplatense) |
| 6 | **TextSelectionExercise** | ⭐⭐⭐ | Vocabulario con traducciones (中文) |
| 7 | **DragDropOrderExercise** | ⭐⭐⭐ | Orden de palabras, sintaxis |
| 8 | **DialogueRolePlayExercise** | ⭐⭐⭐⭐ | Conversación interactiva |

### Avanzados (9-12) ⭐ NUEVOS

| # | Tipo | Dificultad | Ideal Para |
|---|------|-----------|------------|
| 9 | **VerbIdentificationExercise** | ⭐⭐⭐⭐ | Gramática avanzada, análisis verbal |
| 10 | **InteractiveReadingExercise** | ⭐⭐⭐⭐⭐ | Lectura comprensiva con vocabulario |
| 11 | **AIAudioPronunciationExercise** | ⭐⭐⭐⭐⭐ | Pronunciación con audio IA natural |
| 12 | **FreeDragDropExercise** | ⭐⭐⭐⭐ | Categorización flexible |

---

## 📁 Estructura del Proyecto

```
src/components/designlab/
├── exercises/                           # 12 tipos de ejercicios
│   ├── MultipleChoiceExercise.jsx
│   ├── FillInBlankExercise.jsx
│   ├── MatchingExercise.jsx
│   ├── TrueFalseExercise.jsx
│   ├── AudioListeningExercise.jsx
│   ├── TextSelectionExercise.jsx
│   ├── DragDropOrderExercise.jsx
│   ├── DialogueRolePlayExercise.jsx
│   ├── VerbIdentificationExercise.jsx       ⭐ NUEVO
│   ├── InteractiveReadingExercise.jsx       ⭐ NUEVO
│   ├── AIAudioPronunciationExercise.jsx     ⭐ NUEVO
│   ├── FreeDragDropExercise.jsx             ⭐ NUEVO
│   └── index.js
├── TextToExerciseParser.jsx             # Parser texto → React
├── SettingsPanel.jsx                    # Configuración visual (6 tabs)
└── README.md                            # Este archivo

src/hooks/
├── useDesignLabConfig.js                # Hook de configuración (Firestore)
└── useExerciseState.js                  # Hook de estado de ejercicios

src/firebase/
└── designLabConfig.js                   # CRUD + DEFAULT_CONFIG (50+ opciones)

.claude/
├── DESIGN_LAB.md                        # Docs ejercicios 1-4
├── DESIGN_LAB_NEW_EXERCISES.md          # Docs ejercicios 5-8
├── DESIGN_LAB_ADVANCED_EXERCISES.md     # Docs ejercicios 9-12 ⭐ NUEVO
└── AUDIO_IA_GENERATION_GUIDE.md         # Guía completa de audio IA ⭐ NUEVO
```

---

## 🎨 Personalización Visual (50+ opciones)

### Panel de Configuración con 6 Tabs

El `SettingsPanel` incluye:

#### 1. **General**
- Tema (claro/oscuro)
- Nivel CEFR (A1-C2)
- Opciones de interacción (animaciones, sonidos, autocorrección, pistas)

#### 2. **Tipografía** (5 opciones)
- Tamaño de fuente (12-24px)
- Familia de fuente (sans-serif, serif, mono, dyslexic-friendly)
- Espaciado de línea (1.2 - 2.2)
- Espaciado de letras (tight, normal, wide)
- Peso de fuente (light → bold)

#### 3. **Colores** (15+ opciones)
- Colores de feedback (correcto, incorrecto, neutral)
- Colores base (texto, fondos, bordes)
- Colores de acento (primario, secundario, links, hover, focus)
- Colores de estado (success, warning, error, info)
- Gradientes (inicio, fin) con preview en vivo

#### 4. **Estilos** (13+ opciones)
- Bordes redondeados, grosor de bordes, intensidad de sombra
- Espaciado interno, ancho de cards
- Tamaño de botones e iconos
- Estilo de badges y barras de progreso
- Efectos hover, velocidad de transiciones
- Densidad de contenido

#### 5. **Efectos**
- Blur, gradientes, glassmorphism, neumorphism

#### 6. **Accesibilidad**
- Alto contraste, movimiento reducido
- Indicadores de enfoque
- Optimización para lectores de pantalla

### Usar la Configuración

```jsx
import { useDesignLabConfig } from '../../hooks/useDesignLabConfig';

function MyComponent() {
  const { config, updateField } = useDesignLabConfig();

  return (
    <div style={{
      fontSize: `${config.fontSize}px`,
      fontFamily: config.fontFamily,
      lineHeight: config.lineHeight,
      color: config.customColors?.textColor
    }}>
      {/* Tu contenido se adaptará automáticamente */}
    </div>
  );
}
```

---

## 🎙️ Audio IA Natural (IMPORTANTE)

Para el ejercicio `AIAudioPronunciationExercise`, necesitas generar audio de **alta calidad con voz natural (NO robótica)**.

### Opción Rápida: Play.ht (Sin código, 5 minutos)

1. Ve a [play.ht](https://play.ht)
2. Selecciona idioma: **Spanish**
3. Elige acento: **Spain**, **Mexico**, o **Argentina**
4. Escribe tu texto: `"Buenos días, ¿cómo está usted?"`
5. Genera y descarga el MP3
6. Guarda en `public/audio/ai/buenos-dias.mp3`

### Opción Profesional: Google Cloud TTS

```javascript
// generate-audio.js
const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');

async function generateAudio(text, outputFile) {
  const client = new textToSpeech.TextToSpeechClient();

  const request = {
    input: { text },
    voice: {
      languageCode: 'es-ES',
      name: 'es-ES-Neural2-A', // Voz femenina neural (ALTA CALIDAD)
      ssmlGender: 'FEMALE'
    },
    audioConfig: {
      audioEncoding: 'MP3',
      sampleRateHertz: 24000
    }
  };

  const [response] = await client.synthesizeSpeech(request);
  fs.writeFileSync(outputFile, response.audioContent, 'binary');
  console.log(`✅ Audio guardado: ${outputFile}`);
}

// Uso
generateAudio(
  'Buenos días, ¿cómo está usted?',
  'public/audio/ai/buenos-dias.mp3'
);
```

**📖 Guía completa con 5 servicios recomendados:** Ver `.claude/AUDIO_IA_GENERATION_GUIDE.md`

---

## 📖 Documentación Completa

### Por Tipo de Ejercicio

| Ejercicios | Archivo de Documentación |
|------------|-------------------------|
| **1-4** (Básicos) | `.claude/DESIGN_LAB.md` |
| **5-8** (Intermedios) | `.claude/DESIGN_LAB_NEW_EXERCISES.md` |
| **9-12** (Avanzados) | `.claude/DESIGN_LAB_ADVANCED_EXERCISES.md` ⭐ |

### Guías Técnicas

- **Audio IA Natural:** `.claude/AUDIO_IA_GENERATION_GUIDE.md` ⭐
- **Configuración Visual:** `src/firebase/designLabConfig.js` (ver `DEFAULT_CONFIG`)
- **Standards:** `.claude/MASTER_STANDARDS.md`

Cada documentación incluye:
- ✅ Props detallados con tipos
- ✅ Ejemplos de uso completos
- ✅ Casos de uso recomendados
- ✅ Mejores prácticas
- ✅ Errores comunes a evitar

---

## 🎯 Ejemplo Completo: Lección de 4 Ejercicios

```jsx
import { useState } from 'react';
import {
  InteractiveReadingExercise,
  VerbIdentificationExercise,
  AIAudioPronunciationExercise,
  FreeDragDropExercise
} from './components/designlab/exercises';

function SpanishLesson() {
  const [currentExercise, setCurrentExercise] = useState(0);
  const [results, setResults] = useState([]);

  const handleComplete = (result) => {
    setResults([...results, result]);
    if (currentExercise < 3) {
      setCurrentExercise(currentExercise + 1);
    }
  };

  const exercises = [
    // 1. Lectura interactiva con vocabulario
    <InteractiveReadingExercise
      title="Un Día en Barcelona"
      text="Barcelona es una ciudad cosmopolita situada en la costa mediterránea..."
      vocabulary={[
        {
          spanish: 'cosmopolita',
          english: 'cosmopolitan',
          chinese: '国际化的',
          start: 25,
          end: 36,
          context: 'Ciudad internacional',
          audioUrl: '/audio/cosmopolita.mp3'
        }
      ]}
      questions={[
        {
          question: '¿Dónde está Barcelona?',
          options: ['Costa atlántica', 'Costa mediterránea', 'Interior'],
          correctAnswer: 1
        }
      ]}
      cefrLevel="B1"
      onComplete={handleComplete}
    />,

    // 2. Identificar verbos
    <VerbIdentificationExercise
      instruction="Selecciona todos los verbos en el siguiente texto"
      text="María estudia español. Ella practica todos los días."
      words={[
        { text: 'María', start: 0, end: 5, isVerb: false },
        { text: 'estudia', start: 6, end: 13, isVerb: true,
          conjugation: '3ª persona singular', infinitive: 'estudiar' },
        { text: 'practica', start: 31, end: 39, isVerb: true,
          conjugation: '3ª persona singular', infinitive: 'practicar' }
      ]}
      verbsToFind={2}
      cefrLevel="A2"
      onComplete={handleComplete}
    />,

    // 3. Práctica de pronunciación con IA
    <AIAudioPronunciationExercise
      title="Practica tu Pronunciación"
      phrases={[
        {
          text: 'Buenos días, ¿cómo está usted?',
          aiAudioUrl: '/audio/ai/buenos-dias.mp3',
          phonetic: 'ˈbwe.nos ˈdi.as ˈko.mo es.ˈta us.ˈteð',
          difficulty: 'easy',
          tips: 'Nota la entonación ascendente en la pregunta'
        }
      ]}
      voiceType="female"
      accent="spain"
      cefrLevel="A2"
      onComplete={handleComplete}
    />,

    // 4. Categorización por género
    <FreeDragDropExercise
      title="Clasifica por Género"
      instruction="Arrastra cada sustantivo a la categoría correcta"
      items={[
        { id: 1, text: 'el libro', correctCategory: 'masculino' },
        { id: 2, text: 'la mesa', correctCategory: 'femenino' }
      ]}
      categories={[
        { id: 'masculino', name: 'Masculino', color: '#3b82f6' },
        { id: 'femenino', name: 'Femenino', color: '#ec4899' }
      ]}
      cefrLevel="A1"
      onComplete={handleComplete}
    />
  ];

  return (
    <div>
      <h1>Lección de Español</h1>
      <p>Ejercicio {currentExercise + 1} de 4</p>
      {exercises[currentExercise]}
      <div>Puntuación total: {results.reduce((sum, r) => sum + r.score, 0)}</div>
    </div>
  );
}
```

---

## 🔧 Hooks Disponibles

### useDesignLabConfig

Gestiona configuración del Design Lab con persistencia en Firestore.

```jsx
import { useDesignLabConfig } from '../../hooks/useDesignLabConfig';

const {
  config,        // Objeto de configuración (50+ opciones)
  loading,       // Estado de carga inicial
  saving,        // Estado de guardado
  updateField,   // Actualizar un campo específico
  updateConfig,  // Actualizar toda la config
  resetConfig,   // Resetear a valores por defecto
  reloadConfig   // Recargar desde Firestore
} = useDesignLabConfig();

// Ejemplos de uso:
updateField('fontSize', 18);
updateField('theme', 'dark');
updateField('customColors', {
  ...config.customColors,
  textColor: '#000000'
});
```

### useExerciseState

Gestiona el estado de cualquier ejercicio (gamificación, validación, etc.).

```jsx
import { useExerciseState } from '../../hooks/useExerciseState';

const {
  userAnswer,     // Respuesta actual del usuario
  setUserAnswer,  // Actualizar respuesta
  isCorrect,      // Boolean: ¿es correcta?
  showFeedback,   // Boolean: mostrar feedback
  checkAnswer,    // Función para verificar
  resetExercise,  // Reiniciar ejercicio
  score,          // Puntuación (0-100)
  stars,          // Estrellas (0-3)
  attempts,       // Número de intentos
  hints,          // Pistas usadas
  showNextHint    // Mostrar siguiente pista
} = useExerciseState({
  exerciseType: 'verb-identification',
  correctAnswer: ['estudia', 'practica'],
  validateFn: (userAnswer, correct) => {
    // Lógica de validación personalizada
    return userAnswer.length === correct.length;
  },
  maxPoints: 100
});
```

---

## 🎮 Formato del Callback onComplete

Todos los ejercicios llaman a `onComplete` con este objeto:

```javascript
{
  exerciseType: string,        // Tipo de ejercicio
  correct: boolean,            // ¿Respuesta correcta?
  score: number,               // Puntuación (0-100)
  stars: number,               // Estrellas (0-3)
  attempts: number,            // Intentos realizados
  timeSpent: number | null,    // Tiempo en ms
  userAnswer: any,             // Respuesta del usuario
  correctAnswer: any,          // Respuesta correcta
  hintsUsed: number            // Pistas utilizadas
}
```

---

## 🔥 Características Destacadas

### ✅ Lo que Incluye

- **12 tipos de ejercicios** listos para usar
- **Gamificación completa** (puntos, estrellas, intentos, tiempo)
- **Firestore integration** (guardar configuraciones por usuario)
- **Dark mode** nativo en todos los componentes
- **Responsive design** (móvil, tablet, desktop)
- **Accesibilidad** (ARIA, keyboard navigation)
- **50+ opciones de personalización** visual
- **Audio IA natural** (soporte para múltiples acentos)
- **Multilingüe** (Español/English/中文)
- **100% Tailwind CSS** (sin archivos CSS custom)
- **Parser de texto a React** componentes
- **Documentación exhaustiva** (3 archivos .md completos)

### ❌ Lo que NO Incluye

- Archivos de audio (debes generarlos con servicios de IA)
- Contenido de ejercicios (solo ejemplos de demostración)
- Backend API (usa Firestore directamente)
- Sistema de autenticación completo

---

## 🛠️ Próximos Pasos Recomendados

### 1. Generar Audio IA ⭐ PRIORITARIO

**Sin audio, `AIAudioPronunciationExercise` no funcionará.**

**Opción A: Rápido (5 minutos)**
1. Ir a [play.ht](https://play.ht)
2. Generar 4 frases de ejemplo
3. Descargar como MP3
4. Guardar en `public/audio/ai/`

**Opción B: Profesional (30 minutos)**
1. Configurar Google Cloud TTS
2. Ejecutar script de generación automática
3. Ver `.claude/AUDIO_IA_GENERATION_GUIDE.md`

### 2. Crear Contenido de Ejemplo

Edita `src/pages/DesignLabPage.jsx` para:
- Agregar más ejemplos de ejercicios
- Personalizar textos para tu audiencia
- Ajustar niveles CEFR según tus estudiantes

### 3. Configurar Firebase

1. Crear proyecto en Firebase Console
2. Habilitar Firestore
3. Configurar reglas de seguridad
4. Actualizar `src/firebase/config.js` con tus credenciales

### 4. Personalizar Estilos

Usa el `SettingsPanel` (componente React) para:
- Elegir colores de tu marca
- Ajustar tipografía según preferencias
- Configurar efectos visuales

---

## ❓ FAQ

**P: ¿Funciona sin archivos de audio?**
R: Sí, excepto `AIAudioPronunciationExercise` y `AudioListeningExercise` que requieren archivos MP3.

**P: ¿Puedo usar voces gratuitas?**
R: Sí, Google Cloud TTS ofrece 1 millón de caracteres gratis al mes (voces WaveNet). Suficiente para ~500 frases.

**P: ¿Cómo agrego mi propio tipo de ejercicio?**
R:
1. Crea componente en `src/components/designlab/exercises/MiEjercicio.jsx`
2. Usa hooks `useExerciseState` y `useDesignLabConfig`
3. Exporta en `exercises/index.js`
4. Documenta props y uso

**P: ¿Soporta otros idiomas además de español?**
R: La estructura es agnóstica al idioma. Cambia el contenido y textos para usar cualquier idioma.

**P: ¿Necesito conocimientos de React?**
R: Básicos. Debes saber importar componentes, pasar props, y usar hooks. Ver ejemplos arriba.

**P: ¿Puedo cambiar los colores del tema?**
R: Sí, usa el `SettingsPanel` o actualiza `config.customColors` directamente.

---

## 📞 Soporte

- **Documentación completa:** Ver archivos en `.claude/`
- **Código fuente:** `src/components/designlab/`
- **Issues:** Reportar problemas en el repositorio del proyecto

---

## 🎉 ¡Listo para Empezar!

1. ✅ Importa los ejercicios que necesitas
2. ✅ Lee la documentación específica (`.claude/DESIGN_LAB_*.md`)
3. ✅ Genera audio IA (`.claude/AUDIO_IA_GENERATION_GUIDE.md`)
4. ✅ Crea tu primera lección de español

**¡Buena suerte con tus ejercicios de ELE! 🚀**

---

**Versión:** 3.0
**Ejercicios totales:** 12
**Opciones de personalización:** 50+
**Última actualización:** 2025-01-09
