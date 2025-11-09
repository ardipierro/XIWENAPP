# 🎙️ Generador de Audio con Hugging Face (GRATIS)

**¡YO LO HAGO POR VOS!** Este script genera automáticamente las 4 frases de audio necesarias para el ejercicio de pronunciación usando la **API GRATUITA de Hugging Face**.

---

## ✅ Ventajas

- ✅ **100% gratis** (API de Hugging Face)
- ✅ **Sin tarjeta de crédito**
- ✅ **Token gratuito permanente**
- ✅ **Alta calidad** (MeloTTS-Spanish)
- ✅ **Automático** (genera las 4 frases con un comando)
- ✅ **Sin límites** (API gratuita tiene rate limiting pero suficiente)

---

## 🚀 Pasos Rápidos (5 minutos)

### 1. Crear Token de Hugging Face (2 minutos)

```bash
# 1. Ir a:
https://huggingface.co/join

# 2. Crear cuenta (email + contraseña) - SIN TARJETA

# 3. Ir a:
https://huggingface.co/settings/tokens

# 4. Click en "Create new token"
   - Name: "tts-token"
   - Type: Read
   - Click "Generate"

# 5. Copiar el token (empieza con "hf_...")
```

### 2. Instalar Dependencias (1 minuto)

**Opción A: Node.js**
```bash
npm install @huggingface/inference
```

**Opción B: Python**
```bash
pip install huggingface_hub requests
```

### 3. Generar Audio (2 minutos)

**Opción A: Node.js**
```bash
HF_TOKEN="hf_tu_token_aqui" node generate-audio-hf.js
```

**Opción B: Python**
```bash
HF_TOKEN="hf_tu_token_aqui" python3 generate-audio-hf.py
```

### 4. ¡Listo! ✅

Los 4 archivos MP3 estarán en `public/audio/ai/`:
- `buenos-dias.mp3`
- `jirafa.mp3`
- `tigres.mp3`
- `perro.mp3`

---

## 📖 Guía Detallada

### Paso 1: Obtener Token de Hugging Face

#### ¿Qué es Hugging Face?
Hugging Face es una plataforma de modelos de IA **gratuita y open source**. No requiere tarjeta de crédito.

#### Crear cuenta (GRATIS):

1. **Ir a:** https://huggingface.co/join

2. **Completar formulario:**
   - Email
   - Contraseña
   - Username

3. **Verificar email**

4. **Crear token:**
   - Ir a: https://huggingface.co/settings/tokens
   - Click: "Create new token"
   - Name: `tts-token`
   - Type: **Read** (no Write)
   - Click: "Generate"

5. **Copiar token:**
   ```
   Ejemplo: hf_AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
   ```

**IMPORTANTE:** Guarda este token en un lugar seguro. Lo necesitarás para ejecutar el script.

---

### Paso 2: Instalar Dependencias

#### Opción A: Node.js (Recomendado)

```bash
# Verificar que Node.js esté instalado
node --version

# Si no tienes Node.js, instalar desde:
# https://nodejs.org (versión LTS)

# Instalar dependencia
npm install @huggingface/inference
```

#### Opción B: Python

```bash
# Verificar que Python esté instalado
python3 --version

# Si no tienes Python, instalar desde:
# https://www.python.org/downloads/

# Instalar dependencias
pip install huggingface_hub requests
```

---

### Paso 3: Ejecutar Script

#### Opción A: Node.js

```bash
# Forma 1: Variable de entorno inline
HF_TOKEN="hf_tu_token_aqui" node generate-audio-hf.js

# Forma 2: Exportar variable
export HF_TOKEN="hf_tu_token_aqui"
node generate-audio-hf.js

# Forma 3: Archivo .env
# Crear archivo .env con:
# HF_TOKEN=hf_tu_token_aqui
# Luego ejecutar:
node generate-audio-hf.js
```

#### Opción B: Python

```bash
# Forma 1: Variable de entorno inline
HF_TOKEN="hf_tu_token_aqui" python3 generate-audio-hf.py

# Forma 2: Exportar variable
export HF_TOKEN="hf_tu_token_aqui"
python3 generate-audio-hf.py
```

---

### Paso 4: Verificar Archivos

```bash
# Listar archivos generados
ls -lh public/audio/ai/

# Deberías ver:
# buenos-dias.mp3
# jirafa.mp3
# tigres.mp3
# perro.mp3
```

---

## 🎬 Ejemplo de Ejecución

```bash
$ HF_TOKEN="hf_..." node generate-audio-hf.js

📁 Directorio: public/audio/ai

🎙️  Generando audio con Hugging Face API
📦 Modelo: myshell-ai/MeloTTS-Spanish
🔑 Token: hf_AbCdEfG...

🚀 Iniciando generación de 4 archivos de audio...

⏳ Generando: Saludo formal básico
   Texto: "Buenos días, ¿cómo está usted?"
✅ Guardado: public/audio/ai/buenos-dias.mp3
   Tamaño: 45.23 KB

⏳ Generando: Trabalenguas con sonido "j"
   Texto: "La jirafa jaranera jugaba en el jardín"
✅ Guardado: public/audio/ai/jirafa.mp3
   Tamaño: 67.89 KB

⏳ Generando: Trabalenguas con sonido "tr"
   Texto: "Tres tristes tigres tragaban trigo en un trigal"
✅ Guardado: public/audio/ai/tigres.mp3
   Tamaño: 78.45 KB

⏳ Generando: Trabalenguas con sonido "rr"
   Texto: "El perro de Rosa corrió por la carretera"
✅ Guardado: public/audio/ai/perro.mp3
   Tamaño: 65.12 KB

═══════════════════════════════════════════════════
📊 Resumen:
   ✅ Exitosos: 4
   ❌ Fallidos: 0
   📁 Directorio: public/audio/ai
═══════════════════════════════════════════════════

🎉 ¡Todos los archivos de audio generados correctamente!

Próximos pasos:
1. Verifica los archivos en public/audio/ai/
2. Prueba el AIAudioPronunciationExercise en tu app
3. ¡Disfruta de tu ejercicio de pronunciación!
```

---

## 🔧 Solución de Problemas

### Error: "HF_TOKEN is required"

**Problema:** No se proporcionó el token.

**Solución:**
```bash
# Asegúrate de pasar el token:
HF_TOKEN="hf_tu_token_aqui" node generate-audio-hf.js
```

### Error: "Model is loading"

**Problema:** El modelo está cargándose (primera vez).

**Solución:**
- Espera 10-20 segundos y el script reintentará automáticamente
- Si persiste, espera 1 minuto y vuelve a ejecutar

### Error: "Rate limit exceeded"

**Problema:** Demasiadas requests en poco tiempo.

**Solución:**
- Espera 1 minuto
- Vuelve a ejecutar el script
- El script ya incluye delays entre requests

### Error: "Module not found"

**Problema:** Falta instalar dependencias.

**Solución Node.js:**
```bash
npm install @huggingface/inference
```

**Solución Python:**
```bash
pip install huggingface_hub requests
```

### Error: "Permission denied"

**Problema:** No hay permisos para crear archivos.

**Solución:**
```bash
# Verificar permisos del directorio
ls -la public/audio/

# Crear directorio si no existe
mkdir -p public/audio/ai
```

---

## 🎨 Personalización

### Cambiar el Modelo

Edita el script y cambia la variable `MODEL`:

```javascript
// Node.js (generate-audio-hf.js)
const MODEL = SPANISH_MODELS.facebook; // Voz masculina

// Python (generate-audio-hf.py)
MODEL = SPANISH_MODELS['mms'] # Multilingüe
```

### Modelos Disponibles:

| Modelo | Descripción | Calidad |
|--------|-------------|---------|
| `myshell-ai/MeloTTS-Spanish` | Voz femenina, rápido | ⭐⭐⭐⭐⭐ |
| `facebook/tts_transformer-es-css10` | Voz masculina | ⭐⭐⭐⭐ |
| `facebook/mms-tts-spa` | Multilingüe (1100+ idiomas) | ⭐⭐⭐⭐ |

### Agregar Más Frases

Edita el array `phrases` en el script:

```javascript
// Node.js
const phrases = [
  {
    text: 'Tu nueva frase aquí',
    filename: 'mi-frase.mp3',
    description: 'Descripción'
  },
  // ... más frases
];
```

```python
# Python
phrases = [
    {
        'text': 'Tu nueva frase aquí',
        'filename': 'mi-frase.mp3',
        'description': 'Descripción'
    },
    # ... más frases
]
```

---

## 📊 Comparación con Otras Opciones

| Método | Registro | Costo | Calidad | Velocidad |
|--------|----------|-------|---------|-----------|
| **Hugging Face (Este script)** | ✅ Gratis | $0 | ⭐⭐⭐⭐⭐ | 2 min |
| ttsMP3.com | ❌ No | $0 | ⭐⭐⭐⭐ | 5 min manual |
| Luvvoice | ❌ No | $0 | ⭐⭐⭐⭐⭐ | 5 min manual |
| Google Cloud TTS | ✅ Sí + Tarjeta | $4/millón | ⭐⭐⭐⭐⭐ | Instantáneo |
| ElevenLabs | ✅ Sí + Pago | $5/mes | ⭐⭐⭐⭐⭐ | Instantáneo |

---

## 💡 Tips

1. **Guardar el token:** Crea un archivo `.env` con tu token para no tener que escribirlo cada vez:
   ```bash
   echo 'HF_TOKEN=hf_tu_token_aqui' > .env
   ```

2. **Automatizar:** Agrega el script a tu `package.json`:
   ```json
   {
     "scripts": {
       "generate-audio": "node generate-audio-hf.js"
     }
   }
   ```
   Luego ejecuta: `npm run generate-audio`

3. **Verificar calidad:** Prueba el audio en tu navegador antes de usarlo en producción.

4. **Cambiar voz:** Experimenta con diferentes modelos para encontrar la voz que más te guste.

---

## 🎉 ¡Todo Listo!

Ahora tienes:
- ✅ Script de generación automática
- ✅ API gratuita de Hugging Face
- ✅ 4 archivos de audio de alta calidad
- ✅ Sin cuentas premium ni tarjetas

**Próximo paso:** Ejecuta el script y prueba tu `AIAudioPronunciationExercise` 🚀

---

## 📚 Recursos

- **Hugging Face:** https://huggingface.co
- **Token Settings:** https://huggingface.co/settings/tokens
- **MeloTTS Model:** https://huggingface.co/myshell-ai/MeloTTS-Spanish
- **API Docs:** https://huggingface.co/docs/api-inference/index

---

**Creado:** 2025-01-09
**Versión:** 1.0
**Tiempo total:** ~5 minutos
**Costo:** $0
