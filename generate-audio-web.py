#!/usr/bin/env python3

"""
Script para generar audio usando web scraping de servicios gratuitos
SIN registro, SIN tokens, SIN cuentas

Ejecutar: python3 generate-audio-web.py
"""

import os
import sys
import time
import urllib.request
import urllib.parse
import json
from pathlib import Path

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

print('\n🎙️  Generando audio con servicios web gratuitos')
print('✅ 100% gratis, sin tokens, sin cuentas')
print('')

def generate_audio_voicerss(phrase):
    """Genera audio usando VoiceRSS API (gratuita)"""
    output_path = OUTPUT_DIR / phrase['filename']

    print(f"⏳ Generando: {phrase['description']}")
    print(f'   Texto: "{phrase["text"]}"')

    try:
        # VoiceRSS tiene una API gratuita limitada
        # Parámetros
        params = {
            'key': 'demo',  # API key demo (limitado pero funcional)
            'src': phrase['text'],
            'hl': 'es-es',
            'c': 'MP3',
            'f': '48khz_16bit_stereo'
        }

        # Construir URL
        url = 'http://api.voicerss.org/?' + urllib.parse.urlencode(params)

        # Descargar audio
        urllib.request.urlretrieve(url, output_path)

        # Verificar que se creó el archivo
        if output_path.exists():
            file_size = os.path.getsize(output_path) / 1024
            print(f'✅ Guardado: {output_path}')
            print(f'   Tamaño: {file_size:.2f} KB')
            print('')
            return True
        else:
            print(f'❌ No se pudo crear el archivo')
            print('')
            return False

    except Exception as error:
        print(f'❌ Error generando {phrase["filename"]}:')
        print(f'   {str(error)}')
        print('')
        return False

def generate_audio_ttsmp3(phrase):
    """Genera audio usando ttsMP3.com API (gratuita, sin registro)"""
    output_path = OUTPUT_DIR / phrase['filename']

    print(f"⏳ Generando: {phrase['description']}")
    print(f'   Texto: "{phrase["text"]}"')

    try:
        # Preparar datos para POST
        data = urllib.parse.urlencode({
            'msg': phrase['text'],
            'lang': 'Lucia',  # Voz española
            'source': 'ttsmp3'
        }).encode('utf-8')

        # Headers
        headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0'
        }

        # Request a la API
        req = urllib.request.Request(
            'https://ttsmp3.com/makemp3_new.php',
            data=data,
            headers=headers
        )

        with urllib.request.urlopen(req, timeout=30) as response:
            result = json.loads(response.read().decode('utf-8'))

            if 'URL' in result:
                # Descargar el audio
                audio_url = result['URL']
                urllib.request.urlretrieve(audio_url, output_path)

                file_size = os.path.getsize(output_path) / 1024
                print(f'✅ Guardado: {output_path}')
                print(f'   Tamaño: {file_size:.2f} KB')
                print('')
                return True
            else:
                print(f'❌ No se obtuvo URL de audio')
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

    for i, phrase in enumerate(phrases):
        # Intentar primero con VoiceRSS (más confiable)
        success = generate_audio_voicerss(phrase)

        # Si falla, intentar con ttsMP3
        if not success:
            print('   Reintentando con método alternativo...')
            time.sleep(1)
            success = generate_audio_ttsmp3(phrase)

        if success:
            success_count += 1
        else:
            fail_count += 1

        # Esperar entre requests (rate limiting)
        if i < len(phrases) - 1:
            time.sleep(2)

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
    elif success_count > 0:
        print(f'⚠️  {success_count} de {len(phrases)} archivos generados.')
        print('   Los archivos faltantes pueden generarse manualmente.')
    else:
        print('❌ No se pudieron generar archivos automáticamente.')
        print('')
        print('Opciones:')
        print('1. Usar Hugging Face (requiere token gratuito):')
        print('   - Ir a https://huggingface.co/settings/tokens')
        print('   - Crear token (solo email, sin tarjeta)')
        print('   - HF_TOKEN="tu-token" python3 generate-audio-hf.py')
        print('')
        print('2. Generar manualmente (5 minutos):')
        print('   - Ir a https://ttsmp3.com')
        print('   - Generar las 4 frases una por una')
        print('   - Guardar en public/audio/ai/')

# Ejecutar
if __name__ == '__main__':
    try:
        generate_all()
    except KeyboardInterrupt:
        print('\n\n⚠️  Proceso interrumpido por el usuario')
        sys.exit(0)
    except Exception as error:
        print(f'\n❌ Error fatal: {error}')
        import traceback
        traceback.print_exc()
        sys.exit(1)
