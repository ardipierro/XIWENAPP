#!/usr/bin/env python3

"""
Script para generar audio SIN REGISTRO usando Google TTS (gTTS)

NO requiere tokens, cuentas, ni registros
100% gratis y automático

Ejecutar: python3 generate-audio-gtts.py
"""

import os
import sys
from pathlib import Path

try:
    from gtts import gTTS
except ImportError:
    print('❌ Error: gTTS no está instalado')
    print('   Ejecutar: pip3 install gtts')
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

print('\n🎙️  Generando audio con Google TTS (SIN REGISTRO)')
print('📦 Voz: Spanish (Spain) - Google Neural Voice')
print('✅ 100% gratis, sin tokens, sin cuentas')
print('')

def generate_audio(phrase):
    """Genera audio para una frase usando gTTS"""
    output_path = OUTPUT_DIR / phrase['filename']

    print(f"⏳ Generando: {phrase['description']}")
    print(f'   Texto: "{phrase["text"]}"')

    try:
        # Crear objeto gTTS
        # lang='es' para español, tld='es' para acento de España
        tts = gTTS(text=phrase['text'], lang='es', tld='es', slow=False)

        # Guardar archivo
        tts.save(str(output_path))

        # Obtener tamaño del archivo
        file_size = os.path.getsize(output_path) / 1024

        print(f'✅ Guardado: {output_path}')
        print(f'   Tamaño: {file_size:.2f} KB')
        print('')
        return True

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
        print('⚠️  Algunos archivos fallaron.')
        print('')
        print('Si necesitas mejor calidad de voz, considera:')
        print('- Hugging Face API: HF_TOKEN="token" python3 generate-audio-hf.py')
        print('- Servicios manuales: ttsMP3.com, Luvvoice.com')

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
