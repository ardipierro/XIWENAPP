#!/usr/bin/env python3
"""
CC-CEDICT Parser - Convierte el diccionario CC-CEDICT a JSON estructurado
Formato de entrada: tradicional simplificado [pinyin] /definiciones/
Ejemplo: 漢字 汉字 [han4 zi4] /Chinese character/CL:個|个/
"""

import re
import json
import gzip
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict

@dataclass
class DictionaryEntry:
    """Representa una entrada del diccionario"""
    traditional: str
    simplified: str
    pinyin: str
    pinyin_tones: str  # Con números de tonos
    definitions: List[str]
    classifiers: List[str]  # Clasificadores/medidores

def parse_pinyin_numbers(pinyin_with_numbers: str) -> str:
    """
    Convierte pinyin con números a pinyin con marcas de tono
    Ejemplo: han4 zi4 -> hàn zì
    """
    tone_marks = {
        'a': ['ā', 'á', 'ǎ', 'à', 'a'],
        'e': ['ē', 'é', 'ě', 'è', 'e'],
        'i': ['ī', 'í', 'ǐ', 'ì', 'i'],
        'o': ['ō', 'ó', 'ǒ', 'ò', 'o'],
        'u': ['ū', 'ú', 'ǔ', 'ù', 'u'],
        'ü': ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
        'v': ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],  # v se usa como ü en algunos sistemas
    }

    def convert_syllable(syllable: str) -> str:
        """Convierte una sílaba individual"""
        if not syllable:
            return syllable

        # Extraer el número de tono (1-5, donde 5 es tono neutro)
        match = re.match(r'([a-züv]+)([1-5])?', syllable.lower())
        if not match:
            return syllable

        letters = match.group(1)
        tone = int(match.group(2)) if match.group(2) else 5

        # Reglas para colocar la marca de tono:
        # 1. Si hay 'a' o 'e', va ahí
        # 2. Si hay 'ou', va en la 'o'
        # 3. En otros casos, va en la última vocal

        result = list(letters)
        vowel_positions = [(i, c) for i, c in enumerate(letters) if c in 'aeiouüv']

        if not vowel_positions:
            return syllable

        # Determinar posición de la marca
        tone_pos = None
        for i, v in vowel_positions:
            if v in 'ae':
                tone_pos = i
                break

        if tone_pos is None:
            # Buscar 'ou'
            if 'ou' in letters:
                tone_pos = letters.index('o')
            else:
                # Última vocal
                tone_pos = vowel_positions[-1][0]

        # Aplicar marca de tono
        vowel = result[tone_pos]
        if vowel in tone_marks:
            result[tone_pos] = tone_marks[vowel][tone - 1]

        return ''.join(result)

    # Separar en sílabas y convertir cada una
    syllables = pinyin_with_numbers.split()
    converted = [convert_syllable(s) for s in syllables]
    return ' '.join(converted)

def parse_cedict_line(line: str) -> Optional[DictionaryEntry]:
    """
    Parsea una línea del formato CC-CEDICT
    Formato: tradicional simplificado [pinyin] /def1/def2/.../
    """
    # Ignorar comentarios y líneas vacías
    line = line.strip()
    if not line or line.startswith('#'):
        return None

    # Regex para extraer componentes
    # Ejemplo: 漢字 汉字 [han4 zi4] /Chinese character/CL:個|个/
    pattern = r'^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+/(.+)/$'
    match = re.match(pattern, line)

    if not match:
        return None

    traditional = match.group(1)
    simplified = match.group(2)
    pinyin_numbers = match.group(3)
    definitions_raw = match.group(4)

    # Separar definiciones
    definitions = []
    classifiers = []

    for defn in definitions_raw.split('/'):
        defn = defn.strip()
        if not defn:
            continue
        # Detectar clasificadores (CL:...)
        if defn.startswith('CL:'):
            classifiers.append(defn[3:])
        else:
            definitions.append(defn)

    # Convertir pinyin a formato con marcas
    pinyin_marked = parse_pinyin_numbers(pinyin_numbers)

    return DictionaryEntry(
        traditional=traditional,
        simplified=simplified,
        pinyin=pinyin_marked,
        pinyin_tones=pinyin_numbers,
        definitions=definitions,
        classifiers=classifiers
    )

def parse_cedict_file(filepath: str, limit: Optional[int] = None) -> List[Dict]:
    """
    Parsea el archivo CC-CEDICT completo

    Args:
        filepath: Ruta al archivo .txt o .txt.gz
        limit: Límite de entradas (None = todas)

    Returns:
        Lista de diccionarios con las entradas
    """
    entries = []
    path = Path(filepath)

    # Determinar si es gzip
    if path.suffix == '.gz':
        open_func = lambda p: gzip.open(p, 'rt', encoding='utf-8')
    else:
        open_func = lambda p: open(p, 'r', encoding='utf-8')

    with open_func(path) as f:
        for line in f:
            if limit and len(entries) >= limit:
                break

            entry = parse_cedict_line(line)
            if entry:
                entries.append(asdict(entry))

    return entries

def create_search_index(entries: List[Dict]) -> Dict:
    """
    Crea índices de búsqueda para acceso rápido

    Returns:
        Dict con índices por: simplified, traditional, pinyin
    """
    index = {
        'by_simplified': {},
        'by_traditional': {},
        'by_pinyin': {},
        'by_definition': {}  # Para búsqueda inversa (español -> chino)
    }

    for i, entry in enumerate(entries):
        # Índice por caracteres simplificados
        simp = entry['simplified']
        if simp not in index['by_simplified']:
            index['by_simplified'][simp] = []
        index['by_simplified'][simp].append(i)

        # Índice por caracteres tradicionales
        trad = entry['traditional']
        if trad not in index['by_traditional']:
            index['by_traditional'][trad] = []
        index['by_traditional'][trad].append(i)

        # Índice por pinyin (normalizado)
        pinyin_key = entry['pinyin'].lower().replace(' ', '')
        if pinyin_key not in index['by_pinyin']:
            index['by_pinyin'][pinyin_key] = []
        index['by_pinyin'][pinyin_key].append(i)

    return index

def main():
    """Ejemplo de uso"""
    import sys

    if len(sys.argv) < 2:
        print("Uso: python cedict_parser.py <archivo_cedict> [limite]")
        print("Ejemplo: python cedict_parser.py cedict_ts.u8 1000")
        sys.exit(1)

    filepath = sys.argv[1]
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else None

    print(f"Parseando {filepath}...")
    entries = parse_cedict_file(filepath, limit)
    print(f"Entradas parseadas: {len(entries)}")

    # Crear índice
    print("Creando índices de búsqueda...")
    index = create_search_index(entries)

    # Guardar resultado
    output = {
        'metadata': {
            'source': 'CC-CEDICT',
            'entries_count': len(entries),
            'language_from': 'en',
            'language_to': 'zh'
        },
        'entries': entries,
        'index': index
    }

    output_path = Path(filepath).stem + '_parsed.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"Guardado en: {output_path}")

    # Mostrar ejemplo
    if entries:
        print("\nEjemplo de entrada:")
        print(json.dumps(entries[0], ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
