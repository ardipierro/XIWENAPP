# Diccionario Español-Chino basado en CC-CEDICT

## Resumen

Este directorio contiene scripts para generar un diccionario español-chino a partir de CC-CEDICT.

**CC-CEDICT**: Diccionario chino-inglés con 124,000+ entradas bajo licencia CC BY-SA 4.0.

## Archivos

```
scripts/dictionary/
├── cedict_parser.py        # Parser de formato CC-CEDICT
├── translate_to_spanish.py # Traductor EN→ES usando deep-translator
├── sample_cedict.txt       # Muestra de 200 entradas para pruebas
└── README.md              # Esta documentación
```

## Requisitos

```bash
pip install deep-translator
```

## Uso

### 1. Descargar CC-CEDICT

```bash
# Descargar desde MDBG (oficial)
curl -L -o cedict_ts.u8.gz \
  "https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz"

# Descomprimir
gunzip cedict_ts.u8.gz
```

### 2. Parsear el diccionario

```bash
python cedict_parser.py cedict_ts.u8
# Genera: cedict_ts_parsed.json
```

### 3. Traducir a español

```bash
# Con Google Translate (gratis)
python translate_to_spanish.py cedict_ts_parsed.json -o cedict_es.json

# Con DeepL (mejor calidad, requiere API key)
python translate_to_spanish.py cedict_ts_parsed.json -o cedict_es.json \
  -s deepl -k TU_API_KEY

# Opciones útiles:
#   -l 1000        Limitar a 1000 entradas (para pruebas)
#   -b 100         Batch size (default: 50)
#   -d 0.5         Delay entre batches (default: 0.5s)
#   -c             Comprimir salida con gzip
```

### 4. Integrar en XIWEN

```bash
# Copiar a public/dictionaries/
cp cedict_es.json ../../public/dictionaries/

# O comprimir si es muy grande
gzip -c cedict_es.json > ../../public/dictionaries/cedict_es.json.gz
```

## Estimación de Costos

| Entradas | Caracteres aprox. | Google (gratis) | DeepL Free | DeepL Pro |
|----------|-------------------|-----------------|------------|-----------|
| 1,000    | ~50,000          | Inmediato       | Inmediato  | ~€0.30    |
| 10,000   | ~500,000         | 1 mes           | 1 mes      | ~€3.00    |
| 124,000  | ~6,200,000       | 12-13 meses     | 12-13 meses| ~€35.00   |

## Formato de Salida

```json
{
  "metadata": {
    "source": "CC-CEDICT",
    "entries_count": 124000,
    "language_definitions": "es"
  },
  "entries": [
    {
      "s": "你好",           // Simplificado
      "t": "你好",           // Tradicional
      "p": "nǐ hǎo",         // Pinyin con marcas
      "d": ["hola", "¿cómo estás?"]  // Definiciones en español
    }
  ]
}
```

## Licencia

- **CC-CEDICT**: CC BY-SA 4.0 (Creative Commons Attribution-ShareAlike)
- **Traducciones**: Derivado de CC-CEDICT, misma licencia

Al usar este diccionario, debes incluir atribución a CC-CEDICT:
> Basado en CC-CEDICT, disponible en https://cc-cedict.org/
