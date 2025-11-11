#!/usr/bin/env python3

"""
Genera archivos de audio simples pero funcionales para testing
Los archivos contendrán tonos que permiten probar la funcionalidad
Luego pueden reemplazarse con audio real de mejor calidad
"""

import wave
import math
import struct
from pathlib import Path

# Directorio de salida
OUTPUT_DIR = Path('./public/audio/ai')
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Configuración de audio
SAMPLE_RATE = 44100  # Hz
DURATION = 2  # segundos por archivo

phrases = [
    ('buenos-dias.mp3', 'Buenos días', 440),  # La
    ('jirafa.mp3', 'La jirafa jaranera', 523),  # Do
    ('tigres.mp3', 'Tres tristes tigres', 659),  # Mi
    ('perro.mp3', 'El perro de Rosa', 784),  # Sol
]

print('🎙️  Generando archivos de audio funcionales para testing...')
print('📝 Nota: Estos son archivos de prueba con tonos simples')
print('   Para producción, reemplazar con audio real usando:')
print('   - Hugging Face API (requiere token gratuito)')
print('   - Generación manual en ttsMP3.com o Luvvoice.com')
print('')

for filename, description, frequency in phrases:
    # Cambiar extensión a .wav ya que generaremos WAV
    # Los navegadores modernos reproducen WAV sin problemas
    output_path = OUTPUT_DIR / filename.replace('.mp3', '.wav')

    print(f'⏳ Generando: {description}')

    # Generar onda sinusoidal
    num_samples = SAMPLE_RATE * DURATION
    wav_data = []

    for i in range(num_samples):
        # Generar onda sinusoidal con fade in/out
        value = math.sin(2 * math.pi * frequency * i / SAMPLE_RATE)

        # Aplicar envelope (fade in/out) para evitar clicks
        envelope = 1.0
        fade_samples = int(SAMPLE_RATE * 0.1)  # 100ms fade

        if i < fade_samples:
            envelope = i / fade_samples
        elif i > num_samples - fade_samples:
            envelope = (num_samples - i) / fade_samples

        # Convertir a 16-bit integer
        sample = int(value * envelope * 32767 * 0.3)  # 30% volumen
        wav_data.append(struct.pack('<h', sample))

    # Crear archivo WAV
    with wave.open(str(output_path), 'wb') as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(SAMPLE_RATE)
        wav_file.writeframes(b''.join(wav_data))

    file_size = output_path.stat().st_size / 1024
    print(f'✅ Creado: {output_path}')
    print(f'   Tamaño: {file_size:.2f} KB')
    print('')

print('=' * 60)
print('✅ Archivos de audio de prueba creados correctamente')
print('')
print('📝 IMPORTANTE:')
print('   Los archivos son WAV con tonos simples para TESTING')
print('   Para PRODUCCIÓN, reemplazar con audio de voz real:')
print('')
print('   Opción 1 - Hugging Face (mejor calidad, requiere token):')
print('   $ HF_TOKEN="tu-token" python3 generate-audio-hf.py')
print('')
print('   Opción 2 - Manual (5 min, sin registro):')
print('   - Ir a https://ttsmp3.com')
print('   - Generar las 4 frases')
print('   - Guardar en public/audio/ai/')
print('')
print('   Opción 3 - Luvvoice (mejor calidad, sin registro):')
print('   - Ir a https://luvvoice.com')
print('   - Usar voces neurales en español')
print('=' * 60)
