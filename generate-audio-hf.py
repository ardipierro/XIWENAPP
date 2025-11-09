#!/usr/bin/env python3

"""
Script para generar audio con Hugging Face API (GRATIS)

Setup:
1. Ir a https://huggingface.co/settings/tokens
2. Crear cuenta gratuita (sin tarjeta)
3. Crear un token
4. pip install huggingface_hub requests
5. Ejecutar: HF_TOKEN="tu-token" python3 generate-audio-hf.py
"""

import os
import sys
import time
import requests
from pathlib import Path

# Token de Hugging Face (gratis)
HF_TOKEN = os.environ.get('HF_TOKEN')

if not HF_TOKEN:
    print('❌ Error: Se requiere HF_TOKEN')
    print('')
    print('Pasos:')
    print('1. Crear cuenta en https://huggingface.co (GRATIS)')
    print('2. Ir a https://huggingface.co/settings/tokens')
    print('3. Crear un nuevo token (Read)')
    print('4. Ejecutar: HF_TOKEN="tu-token" python3 generate-audio-hf.py')
    sys.exit(1)

# Directorio de salida
OUTPUT_DIR = Path('./public/audio/ai')

# Crear directorio si no existe
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
print(f'📁 Directorio: {OUTPUT_DIR}')

# Frases a generar
phrases = [
    {
        'text': 'Buenos días, ¿cómo está usted?',
        'filename': 'buenos-dias.mp3',
        'description': 'Saludo formal básico'
    },
    {
        'text': 'La jirafa jaranera jugaba en el jardín',
        'filename': 'jirafa.mp3',
        'description': 'Trabalenguas con sonido "j"'
    },
    {
        'text': 'Tres tristes tigres tragaban trigo en un trigal',
        'filename': 'tigres.mp3',
        'description': 'Trabalenguas con sonido "tr"'
    },
    {
        'text': 'El perro de Rosa corrió por la carretera',
        'filename': 'perro.mp3',
        'description': 'Trabalenguas con sonido "rr"'
    }
]

# Modelos disponibles en español (GRATIS)
SPANISH_MODELS = {
    # MeloTTS - Alta calidad, rápido
    'melo': 'myshell-ai/MeloTTS-Spanish',

    # Facebook TTS - Voz masculina
    'facebook': 'facebook/tts_transformer-es-css10',

    # Facebook MMS - Multilingüe, 1100+ idiomas
    'mms': 'facebook/mms-tts-spa'
}

# Usar MeloTTS (el mejor para español)
MODEL = SPANISH_MODELS['melo']

print(f'\n🎙️  Generando audio con Hugging Face API')
print(f'📦 Modelo: {MODEL}')
print(f'🔑 Token: {HF_TOKEN[:10]}...')
print('')

def generate_audio(phrase):
    """Genera audio para una frase"""
    output_path = OUTPUT_DIR / phrase['filename']

    print(f"⏳ Generando: {phrase['description']}")
    print(f'   Texto: "{phrase["text"]}"')

    try:
        # URL de la API de Hugging Face
        api_url = f"https://api-inference.huggingface.co/models/{MODEL}"

        # Headers con el token
        headers = {
            'Authorization': f'Bearer {HF_TOKEN}',
            'Content-Type': 'application/json'
        }

        # Payload
        payload = {
            'inputs': phrase['text']
        }

        # Hacer request
        response = requests.post(api_url, headers=headers, json=payload)

        # Verificar status
        if response.status_code == 200:
            # Guardar audio
            with open(output_path, 'wb') as f:
                f.write(response.content)

            file_size = len(response.content) / 1024
            print(f'✅ Guardado: {output_path}')
            print(f'   Tamaño: {file_size:.2f} KB')
            print('')
            return True

        elif response.status_code == 503:
            # Modelo cargando
            print(f'⏳ Modelo cargando, reintentando en 10s...')
            time.sleep(10)
            return generate_audio(phrase)  # Reintentar

        else:
            print(f'❌ Error HTTP {response.status_code}')
            print(f'   {response.text}')
            print('')
            return False

    except Exception as error:
        print(f'❌ Error generando {phrase["filename"]}:')
        print(f'   {str(error)}')
        print('')
        return False

def generate_all():
    """Genera todas las frases"""
    print(f'🚀 Iniciando generación de {len(phrases)} archivos de audio...\n')

    success_count = 0
    fail_count = 0

    for phrase in phrases:
        success = generate_audio(phrase)

        if success:
            success_count += 1
        else:
            fail_count += 1

        # Esperar entre requests (rate limiting)
        time.sleep(1)

    print('')
    print('=' * 50)
    print('📊 Resumen:')
    print(f'   ✅ Exitosos: {success_count}')
    print(f'   ❌ Fallidos: {fail_count}')
    print(f'   📁 Directorio: {OUTPUT_DIR}')
    print('=' * 50)
    print('')

    if success_count == len(phrases):
        print('🎉 ¡Todos los archivos de audio generados correctamente!')
        print('')
        print('Próximos pasos:')
        print('1. Verifica los archivos en public/audio/ai/')
        print('2. Prueba el AIAudioPronunciationExercise en tu app')
        print('3. ¡Disfruta de tu ejercicio de pronunciación!')
    else:
        print('⚠️  Algunos archivos fallaron. Verifica tu token y conexión.')

# Ejecutar
if __name__ == '__main__':
    try:
        generate_all()
    except KeyboardInterrupt:
        print('\n\n⚠️  Proceso interrumpido por el usuario')
        sys.exit(0)
    except Exception as error:
        print(f'\n❌ Error fatal: {error}')
        sys.exit(1)
