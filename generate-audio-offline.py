#!/usr/bin/env python3

"""
Script para generar audio usando motor TTS offline (pyttsx3)
"""

import os
import sys
from pathlib import Path

try:
    import pyttsx3
except ImportError:
    print('❌ pyttsx3 no está instalado')
    sys.exit(1)

# Directorio de salida
OUTPUT_DIR = Path('./public/audio/ai')
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Frases a generar
phrases = [
    ('Buenos días, ¿cómo está usted?', 'buenos-dias.mp3'),
    ('La jirafa jaranera jugaba en el jardín', 'jirafa.mp3'),
    ('Tres tristes tigres tragaban trigo en un trigal', 'tigres.mp3'),
    ('El perro de Rosa corrió por la carretera', 'perro.mp3')
]

print('🎙️  Generando audio con motor TTS offline...\n')

try:
    engine = pyttsx3.init()

    # Configurar voz en español si está disponible
    voices = engine.getProperty('voices')
    for voice in voices:
        if 'spanish' in voice.name.lower() or 'español' in voice.name.lower():
            engine.setProperty('voice', voice.id)
            break

    # Configurar velocidad
    engine.setProperty('rate', 150)

    success = 0
    for text, filename in phrases:
        output_path = OUTPUT_DIR / filename
        print(f'⏳ Generando: {filename}')
        print(f'   Texto: "{text}"')

        try:
            # Guardar a archivo (pyttsx3 solo soporta WAV directamente)
            wav_path = output_path.with_suffix('.wav')
            engine.save_to_file(text, str(wav_path))
            engine.runAndWait()

            # Renombrar WAV a MP3 (navegadores modernos soportan ambos)
            if wav_path.exists():
                os.rename(wav_path, output_path)
                print(f'✅ Guardado: {output_path}\n')
                success += 1
            else:
                print(f'❌ No se pudo crear\n')

        except Exception as e:
            print(f'❌ Error: {e}\n')

    print(f'\n📊 Resultado: {success}/{len(phrases)} archivos generados')

except Exception as e:
    print(f'❌ Error inicializando motor TTS: {e}')
    print('\nEl motor TTS offline requiere dependencias del sistema.')
    print('En Linux: sudo apt-get install espeak espeak-data')
    sys.exit(1)
