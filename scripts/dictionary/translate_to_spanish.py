#!/usr/bin/env python3
"""
Traductor de definiciones CC-CEDICT de Inglés a Español
Usa deep-translator con Google Translate (gratis) o DeepL (API key)
"""

import json
import time
import sys
from pathlib import Path
from typing import List, Dict, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
import argparse

# Intentar importar deep-translator
try:
    from deep_translator import GoogleTranslator, DeeplTranslator
    TRANSLATOR_AVAILABLE = True
except ImportError:
    TRANSLATOR_AVAILABLE = False
    print("⚠️  deep-translator no instalado. Ejecuta: pip install deep-translator")

class DictionaryTranslator:
    """Traduce definiciones del diccionario de inglés a español"""

    def __init__(self, service: str = 'google', api_key: Optional[str] = None):
        """
        Args:
            service: 'google' o 'deepl'
            api_key: API key para DeepL (opcional para Google)
        """
        self.service = service
        self.api_key = api_key
        self.translator = self._create_translator()
        self.cache = {}
        self.stats = {
            'translated': 0,
            'cached': 0,
            'errors': 0
        }

    def _create_translator(self):
        """Crea instancia del traductor"""
        if not TRANSLATOR_AVAILABLE:
            return None

        if self.service == 'deepl' and self.api_key:
            return DeeplTranslator(
                api_key=self.api_key,
                source='en',
                target='es'
            )
        else:
            return GoogleTranslator(source='en', target='es')

    def translate_text(self, text: str) -> str:
        """Traduce un texto individual"""
        if not text or not text.strip():
            return text

        # Verificar caché
        if text in self.cache:
            self.stats['cached'] += 1
            return self.cache[text]

        try:
            translated = self.translator.translate(text)
            self.cache[text] = translated
            self.stats['translated'] += 1
            return translated
        except Exception as e:
            self.stats['errors'] += 1
            print(f"    Error traduciendo '{text[:50]}...': {e}")
            return text  # Retornar original si falla

    def translate_definitions(self, definitions: List[str]) -> List[str]:
        """Traduce una lista de definiciones"""
        return [self.translate_text(d) for d in definitions]

    def translate_entry(self, entry: Dict) -> Dict:
        """Traduce una entrada completa del diccionario"""
        translated_entry = entry.copy()
        translated_entry['definitions_es'] = self.translate_definitions(
            entry.get('definitions', [])
        )
        translated_entry['definitions_en'] = entry.get('definitions', [])
        return translated_entry

    def translate_batch(self, entries: List[Dict],
                       batch_size: int = 50,
                       delay: float = 0.5,
                       progress_callback=None) -> List[Dict]:
        """
        Traduce un lote de entradas con rate limiting

        Args:
            entries: Lista de entradas a traducir
            batch_size: Entradas por lote
            delay: Segundos entre lotes (evita rate limiting)
            progress_callback: Función callback(current, total)

        Returns:
            Lista de entradas traducidas
        """
        translated = []
        total = len(entries)

        for i in range(0, total, batch_size):
            batch = entries[i:i + batch_size]

            for entry in batch:
                translated_entry = self.translate_entry(entry)
                translated.append(translated_entry)

            if progress_callback:
                progress_callback(len(translated), total)

            # Rate limiting
            if i + batch_size < total:
                time.sleep(delay)

        return translated

def load_parsed_cedict(filepath: str) -> Dict:
    """Carga un archivo CC-CEDICT parseado"""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_translated_dict(data: Dict, filepath: str, compress: bool = False):
    """Guarda el diccionario traducido"""
    if compress:
        import gzip
        with gzip.open(filepath + '.gz', 'wt', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False)
    else:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

def create_spanish_search_index(entries: List[Dict]) -> Dict:
    """Crea índice de búsqueda inversa (español -> chino)"""
    index = {}

    for i, entry in enumerate(entries):
        for defn in entry.get('definitions_es', []):
            # Extraer palabras clave de la definición
            words = defn.lower().split()
            for word in words:
                # Limpiar puntuación
                word = ''.join(c for c in word if c.isalnum())
                if len(word) >= 2:  # Ignorar palabras muy cortas
                    if word not in index:
                        index[word] = []
                    if i not in index[word]:
                        index[word].append(i)

    return index

def progress_bar(current: int, total: int, width: int = 50):
    """Muestra barra de progreso"""
    percent = current / total
    filled = int(width * percent)
    bar = '█' * filled + '░' * (width - filled)
    sys.stdout.write(f'\r  [{bar}] {current}/{total} ({percent:.1%})')
    sys.stdout.flush()

def main():
    parser = argparse.ArgumentParser(
        description='Traduce CC-CEDICT de Inglés a Español'
    )
    parser.add_argument(
        'input_file',
        help='Archivo JSON de CC-CEDICT parseado'
    )
    parser.add_argument(
        '-o', '--output',
        help='Archivo de salida (default: input_es.json)'
    )
    parser.add_argument(
        '-l', '--limit',
        type=int,
        help='Limitar número de entradas (para pruebas)'
    )
    parser.add_argument(
        '-s', '--service',
        choices=['google', 'deepl'],
        default='google',
        help='Servicio de traducción (default: google)'
    )
    parser.add_argument(
        '-k', '--api-key',
        help='API key para DeepL'
    )
    parser.add_argument(
        '-b', '--batch-size',
        type=int,
        default=50,
        help='Tamaño de lote (default: 50)'
    )
    parser.add_argument(
        '-d', '--delay',
        type=float,
        default=0.5,
        help='Delay entre lotes en segundos (default: 0.5)'
    )
    parser.add_argument(
        '-c', '--compress',
        action='store_true',
        help='Comprimir salida con gzip'
    )

    args = parser.parse_args()

    if not TRANSLATOR_AVAILABLE:
        print("❌ Instala deep-translator: pip install deep-translator")
        sys.exit(1)

    # Cargar datos
    print(f"📖 Cargando {args.input_file}...")
    data = load_parsed_cedict(args.input_file)
    entries = data.get('entries', [])

    if args.limit:
        entries = entries[:args.limit]
        print(f"   Limitado a {args.limit} entradas")

    print(f"   Total entradas: {len(entries)}")

    # Crear traductor
    print(f"\n🌐 Iniciando traducción con {args.service}...")
    translator = DictionaryTranslator(
        service=args.service,
        api_key=args.api_key
    )

    # Traducir
    print(f"   Batch size: {args.batch_size}, Delay: {args.delay}s\n")

    translated_entries = translator.translate_batch(
        entries,
        batch_size=args.batch_size,
        delay=args.delay,
        progress_callback=progress_bar
    )

    print(f"\n\n✅ Traducción completada!")
    print(f"   Traducciones nuevas: {translator.stats['translated']}")
    print(f"   Desde caché: {translator.stats['cached']}")
    print(f"   Errores: {translator.stats['errors']}")

    # Crear índice español
    print("\n📇 Creando índice de búsqueda español...")
    spanish_index = create_spanish_search_index(translated_entries)
    print(f"   Palabras indexadas: {len(spanish_index)}")

    # Preparar salida
    output_data = {
        'metadata': {
            'source': 'CC-CEDICT',
            'translated_by': args.service,
            'entries_count': len(translated_entries),
            'language_definitions': 'es',
            'language_chinese': 'zh'
        },
        'entries': translated_entries,
        'index': data.get('index', {}),
        'index_spanish': spanish_index
    }

    # Guardar
    output_path = args.output or args.input_file.replace('.json', '_es.json')
    print(f"\n💾 Guardando en {output_path}...")
    save_translated_dict(output_data, output_path, compress=args.compress)

    # Mostrar ejemplo
    if translated_entries:
        print("\n📝 Ejemplo de entrada traducida:")
        example = translated_entries[0]
        print(f"   Chino: {example['simplified']} ({example['traditional']})")
        print(f"   Pinyin: {example['pinyin']}")
        print(f"   EN: {example.get('definitions_en', [])[:2]}")
        print(f"   ES: {example.get('definitions_es', [])[:2]}")

    print("\n✨ ¡Listo!")

if __name__ == '__main__':
    main()
