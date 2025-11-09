# Guía de Generación de Audio IA Natural para Design Lab

**Última actualización:** 2025-01-09
**Versión:** 1.0

## 📋 Resumen

Esta guía te ayudará a generar audio de **alta calidad y voz natural (NO robótica)** para los ejercicios de pronunciación del Design Lab, específicamente para el componente `AIAudioPronunciationExercise`.

---

## 🎯 Requisitos de Calidad

### ✅ Audio Aceptable:
- **Voz neural/WaveNet** (NO voz estándar/robótica)
- **Sample rate:** 24kHz o superior
- **Formato:** MP3 (320kbps) o WAV (sin compresión)
- **Acento específico:** España (es-ES), México (es-MX), Argentina (es-AR), etc.
- **Entonación natural:** Pausas, énfasis, ritmo humano

### ❌ Audio NO Aceptable:
- Voces "estándar" o "básicas" (suenan robóticas)
- Sample rate inferior a 16kHz
- Entonación plana sin variación
- Transiciones mecánicas entre palabras

---

## 🌟 Servicios Recomendados

### 1. Google Cloud Text-to-Speech (⭐⭐⭐⭐⭐)

**Calificación:** La mejor calidad precio/calidad
**Precio:** $4 por millón de caracteres (voces WaveNet), $16 por millón (Neural2)

#### Voces Recomendadas para Español:

```javascript
// España - Voz femenina (MEJOR CALIDAD)
voice: 'es-ES-Neural2-A'
// España - Voz femenina alternativa
voice: 'es-ES-Neural2-C'
// España - Voz masculina
voice: 'es-ES-Neural2-B'

// México - Voz femenina
voice: 'es-MX-Neural2-A'
// México - Voz masculina
voice: 'es-MX-Neural2-B'

// Argentina - Voz femenina
voice: 'es-AR-Neural2-A'
// Argentina - Voz masculina
voice: 'es-AR-Neural2-B'
```

#### Script de ejemplo (Node.js):

```javascript
const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');

async function generateAudio(text, outputFile, accent = 'es-ES') {
  const client = new textToSpeech.TextToSpeechClient();

  const request = {
    input: { text },
    voice: {
      languageCode: accent,
      name: `${accent}-Neural2-A`, // Voz femenina
      ssmlGender: 'FEMALE'
    },
    audioConfig: {
      audioEncoding: 'MP3',
      sampleRateHertz: 24000,
      speakingRate: 1.0, // Velocidad normal
      pitch: 0.0, // Tono normal
      volumeGainDb: 0.0
    }
  };

  const [response] = await client.synthesizeSpeech(request);
  const writeFile = util.promisify(fs.writeFile);
  await writeFile(outputFile, response.audioContent, 'binary');

  console.log(`Audio saved to ${outputFile}`);
}

// Uso:
generateAudio(
  'La jirafa jaranera jugaba en el jardín',
  'public/audio/ai/jirafa.mp3',
  'es-ES'
);
```

#### Script de ejemplo (Python):

```python
from google.cloud import texttospeech
import os

def generate_audio(text, output_file, accent='es-ES', voice_type='FEMALE'):
    client = texttospeech.TextToSpeechClient()

    synthesis_input = texttospeech.SynthesisInput(text=text)

    voice = texttospeech.VoiceSelectionParams(
        language_code=accent,
        name=f'{accent}-Neural2-A' if voice_type == 'FEMALE' else f'{accent}-Neural2-B',
        ssml_gender=texttospeech.SsmlVoiceGender.FEMALE if voice_type == 'FEMALE' else texttospeech.SsmlVoiceGender.MALE
    )

    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.MP3,
        sample_rate_hertz=24000,
        speaking_rate=1.0,
        pitch=0.0,
        volume_gain_db=0.0
    )

    response = client.synthesize_speech(
        input=synthesis_input,
        voice=voice,
        audio_config=audio_config
    )

    with open(output_file, 'wb') as out:
        out.write(response.audio_content)
        print(f'Audio guardado en {output_file}')

# Uso:
generate_audio(
    'Tres tristes tigres tragaban trigo en un trigal',
    'public/audio/ai/tigres.mp3',
    accent='es-ES',
    voice_type='FEMALE'
)
```

#### Configuración (necesitas credenciales de GCP):

1. Crea un proyecto en [Google Cloud Console](https://console.cloud.google.com)
2. Habilita la API de Text-to-Speech
3. Crea una Service Account y descarga el JSON de credenciales
4. Configura la variable de entorno:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/credentials.json"
   ```

---

### 2. Amazon Polly (⭐⭐⭐⭐)

**Calificación:** Excelente calidad, buena para español latinoamericano
**Precio:** $4 por millón de caracteres (voces neurales)

#### Voces Recomendadas:

```javascript
// España - Voz femenina
VoiceId: 'Lucia'  // Neural
// España - Voz masculina
VoiceId: 'Sergio' // Neural

// México - Voz femenina
VoiceId: 'Mia'    // Neural
// México - Voz masculina
VoiceId: 'Andrés' // Neural

// US Spanish - Voz femenina
VoiceId: 'Lupe'   // Neural
// US Spanish - Voz masculino
VoiceId: 'Pedro'  // Neural
```

#### Script de ejemplo (Node.js):

```javascript
const AWS = require('aws-sdk');
const fs = require('fs');

const polly = new AWS.Polly({
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

async function generateAudio(text, outputFile, voiceId = 'Lucia') {
  const params = {
    Text: text,
    OutputFormat: 'mp3',
    VoiceId: voiceId,
    Engine: 'neural', // IMPORTANTE: usar engine neural
    SampleRate: '24000',
    TextType: 'text'
  };

  const { AudioStream } = await polly.synthesizeSpeech(params).promise();

  fs.writeFileSync(outputFile, AudioStream);
  console.log(`Audio guardado en ${outputFile}`);
}

// Uso:
generateAudio(
  'El perro de Rosa corrió por la carretera',
  'public/audio/ai/perro.mp3',
  'Lucia'
);
```

---

### 3. Microsoft Azure Speech (⭐⭐⭐⭐)

**Calificación:** Muy buena calidad, muchas voces disponibles
**Precio:** $15 por millón de caracteres (voces neurales)

#### Voces Recomendadas:

```javascript
// España - Voces neurales
'es-ES-ElviraNeural'  // Mujer
'es-ES-AlvaroNeural'  // Hombre

// México - Voces neurales
'es-MX-DaliaNeural'   // Mujer
'es-MX-JorgeNeural'   // Hombre

// Argentina - Voces neurales
'es-AR-ElenaNeural'   // Mujer
'es-AR-TomasNeural'   // Hombre
```

#### Script de ejemplo (Node.js):

```javascript
const sdk = require('microsoft-cognitiveservices-speech-sdk');
const fs = require('fs');

async function generateAudio(text, outputFile, voiceName = 'es-ES-ElviraNeural') {
  const speechConfig = sdk.SpeechConfig.fromSubscription(
    process.env.AZURE_SPEECH_KEY,
    process.env.AZURE_SPEECH_REGION
  );

  speechConfig.speechSynthesisVoiceName = voiceName;
  speechConfig.speechSynthesisOutputFormat = sdk.SpeechSynthesisOutputFormat.Audio24Khz160KBitRateMonoMp3;

  const audioConfig = sdk.AudioConfig.fromAudioFileOutput(outputFile);
  const synthesizer = new sdk.SpeechSynthesizer(speechConfig, audioConfig);

  return new Promise((resolve, reject) => {
    synthesizer.speakTextAsync(
      text,
      result => {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          console.log(`Audio guardado en ${outputFile}`);
          resolve();
        } else {
          reject(new Error(result.errorDetails));
        }
        synthesizer.close();
      },
      error => {
        synthesizer.close();
        reject(error);
      }
    );
  });
}

// Uso:
generateAudio(
  'Buenos días, ¿cómo está usted?',
  'public/audio/ai/buenos-dias.mp3',
  'es-ES-ElviraNeural'
);
```

---

### 4. ElevenLabs (⭐⭐⭐⭐⭐)

**Calificación:** LA MEJOR CALIDAD (ultra realista), pero más caro
**Precio:** Desde $5/mes (30,000 caracteres), hasta $99/mes (300,000)

#### Características:
- **Voces ultra realistas** con emociones y matices
- **Clonación de voz** (puedes clonar la voz de un nativo)
- **Múltiples idiomas y acentos**
- **Control fino de entonación**

#### Script de ejemplo (Python):

```python
import requests
import os

ELEVENLABS_API_KEY = os.getenv('ELEVENLABS_API_KEY')

def generate_audio(text, output_file, voice_id='your-voice-id'):
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"

    headers = {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
    }

    data = {
        'text': text,
        'model_id': 'eleven_multilingual_v2',
        'voice_settings': {
            'stability': 0.5,
            'similarity_boost': 0.75,
            'style': 0.0,
            'use_speaker_boost': True
        }
    }

    response = requests.post(url, json=data, headers=headers)

    if response.status_code == 200:
        with open(output_file, 'wb') as f:
            f.write(response.content)
        print(f'Audio guardado en {output_file}')
    else:
        print(f'Error: {response.status_code} - {response.text}')

# Uso (necesitas crear una voz en español primero en la web de ElevenLabs):
generate_audio(
    'La jirafa jaranera jugaba en el jardín',
    'public/audio/ai/jirafa.mp3',
    voice_id='tu-voice-id-aqui'
)
```

**Cómo obtener voces en español:**
1. Ve a [elevenlabs.io](https://elevenlabs.io)
2. Crea una cuenta
3. En "Voice Library", busca voces en español
4. Clona una voz nativa o usa voces prediseñadas
5. Copia el Voice ID

---

### 5. Play.ht (⭐⭐⭐⭐)

**Calificación:** Excelente para español, interfaz fácil de usar
**Precio:** Desde $19/mes (2 horas de audio)

#### Características:
- Interfaz web muy intuitiva (no requiere código)
- **Ultra-realistic voices**
- Descarga directa en MP3
- Soporte para español de múltiples regiones

#### Uso (interfaz web):

1. Ve a [play.ht](https://play.ht)
2. Crea una cuenta
3. Selecciona idioma: **Spanish**
4. Elige acento: Spain, Mexico, Argentina, etc.
5. Escribe tu texto
6. Ajusta velocidad (0.5x - 2x)
7. Genera y descarga el MP3

**Voces recomendadas:**
- **Jorge (Spain)** - Voz masculina natural
- **María (Spain)** - Voz femenina profesional
- **Carlos (Mexico)** - Acento mexicano auténtico

---

## 🎨 Control de Entonación con SSML

Para mayor control sobre la pronunciación, usa **SSML (Speech Synthesis Markup Language)**:

### Ejemplo con Google Cloud:

```javascript
const request = {
  input: {
    ssml: `
      <speak>
        <prosody rate="slow" pitch="-2st">
          La jirafa jaranera
        </prosody>
        <break time="500ms"/>
        <prosody rate="medium">
          jugaba en el jardín
        </prosody>
      </speak>
    `
  },
  voice: {
    languageCode: 'es-ES',
    name: 'es-ES-Neural2-A'
  },
  audioConfig: {
    audioEncoding: 'MP3',
    sampleRateHertz: 24000
  }
};
```

### Tags SSML útiles:

```xml
<!-- Pausas -->
<break time="500ms"/>
<break strength="strong"/>

<!-- Velocidad -->
<prosody rate="slow">texto lento</prosody>
<prosody rate="fast">texto rápido</prosody>
<prosody rate="80%">80% de velocidad normal</prosody>

<!-- Tono/Pitch -->
<prosody pitch="+5st">tono más alto</prosody>
<prosody pitch="-2st">tono más bajo</prosody>

<!-- Volumen -->
<prosody volume="loud">más fuerte</prosody>
<prosody volume="soft">más suave</prosody>

<!-- Énfasis -->
<emphasis level="strong">palabra enfatizada</emphasis>

<!-- Pronunciación fonética -->
<phoneme alphabet="ipa" ph="xaɾ.ˈdin">jardín</phoneme>

<!-- Decir como número, fecha, etc. -->
<say-as interpret-as="cardinal">1234</say-as>
<say-as interpret-as="date" format="dmy">10-01-2025</say-as>
```

---

## 📂 Estructura de Archivos Recomendada

```
public/
└── audio/
    ├── ai/                    # Audio generado por IA
    │   ├── jirafa.mp3
    │   ├── tigres.mp3
    │   ├── perro.mp3
    │   ├── buenos-dias.mp3
    │   ├── spain/             # Por acento
    │   │   ├── phrase1.mp3
    │   │   └── phrase2.mp3
    │   ├── mexico/
    │   │   └── phrase1.mp3
    │   └── argentina/
    │       └── phrase1.mp3
    ├── vocabulary/            # Audio de vocabulario
    │   ├── cosmopolita.mp3
    │   └── atrae.mp3
    └── examples/              # Ejemplos de diálogos
        └── rioplatense.mp3
```

---

## 🔧 Script Automatizado de Generación

Crea un script para generar todo el audio de una vez:

```javascript
// generate-audio.js
const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const path = require('path');

const phrases = [
  {
    text: 'La jirafa jaranera jugaba en el jardín',
    file: 'jirafa.mp3',
    accent: 'es-ES'
  },
  {
    text: 'Tres tristes tigres tragaban trigo en un trigal',
    file: 'tigres.mp3',
    accent: 'es-ES'
  },
  {
    text: 'El perro de Rosa corrió por la carretera',
    file: 'perro.mp3',
    accent: 'es-ES'
  },
  {
    text: 'Buenos días, ¿cómo está usted?',
    file: 'buenos-dias.mp3',
    accent: 'es-ES'
  }
];

async function generateAll() {
  const client = new textToSpeech.TextToSpeechClient();
  const outputDir = 'public/audio/ai';

  // Crear directorio si no existe
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const phrase of phrases) {
    const request = {
      input: { text: phrase.text },
      voice: {
        languageCode: phrase.accent,
        name: `${phrase.accent}-Neural2-A`,
        ssmlGender: 'FEMALE'
      },
      audioConfig: {
        audioEncoding: 'MP3',
        sampleRateHertz: 24000,
        speakingRate: 1.0
      }
    };

    const [response] = await client.synthesizeSpeech(request);
    const outputPath = path.join(outputDir, phrase.file);

    fs.writeFileSync(outputPath, response.audioContent, 'binary');
    console.log(`✅ Generado: ${phrase.file}`);
  }

  console.log('\n🎉 Todos los audios generados exitosamente!');
}

generateAll().catch(console.error);
```

**Ejecutar:**
```bash
node generate-audio.js
```

---

## 📊 Comparativa de Servicios

| Servicio | Calidad | Precio/Millón | Facilidad de Uso | Acentos ES | Recomendado Para |
|----------|---------|---------------|------------------|------------|------------------|
| **Google Cloud TTS** | ⭐⭐⭐⭐⭐ | $4-$16 | Media | 🇪🇸🇲🇽🇦🇷🇨🇴🇺🇸 | Mejor relación calidad/precio |
| **Amazon Polly** | ⭐⭐⭐⭐ | $4 | Media | 🇪🇸🇲🇽🇺🇸 | AWS infrastructure |
| **Azure Speech** | ⭐⭐⭐⭐ | $15 | Media | 🇪🇸🇲🇽🇦🇷🇨🇴 | Microsoft ecosystem |
| **ElevenLabs** | ⭐⭐⭐⭐⭐ | $5-$99/mes | Fácil | Global | Máxima calidad |
| **Play.ht** | ⭐⭐⭐⭐ | $19/mes | Muy fácil | 🇪🇸🇲🇽🇦🇷 | Sin código |

---

## ✅ Checklist de Calidad

Antes de usar el audio en producción, verifica:

- [ ] Voz neural/WaveNet (NO estándar)
- [ ] Sample rate ≥ 24kHz
- [ ] Formato MP3 (320kbps) o WAV
- [ ] Acento correcto (España/México/Argentina)
- [ ] Entonación natural (pausas apropiadas)
- [ ] Sin ruidos o artefactos
- [ ] Volumen consistente entre archivos
- [ ] Prueba en diferentes dispositivos

---

## 🎯 Recomendación Final

**Para comenzar rápidamente:**
1. Usa **Play.ht** (interfaz web, sin código)
2. Genera 4-5 frases de ejemplo
3. Descarga como MP3

**Para producción a escala:**
1. Usa **Google Cloud Text-to-Speech**
2. Script automatizado con Node.js/Python
3. Voces Neural2 para España, México, Argentina

**Para máxima calidad:**
1. Usa **ElevenLabs**
2. Clona voz de hablante nativo
3. Control fino de emociones

---

## 📞 Soporte

- Google Cloud TTS: https://cloud.google.com/text-to-speech/docs
- Amazon Polly: https://docs.aws.amazon.com/polly/
- Azure Speech: https://docs.microsoft.com/azure/cognitive-services/speech-service/
- ElevenLabs: https://elevenlabs.io/docs
- Play.ht: https://play.ht/docs

---

**Versión:** 1.0
**Última actualización:** 2025-01-09
**Mantenido por:** Design Lab Team
