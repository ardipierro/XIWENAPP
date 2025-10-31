# Exercise Parser - Formatos Soportados

Este documento describe todos los formatos de ejercicios soportados por el parser avanzado.

## 📋 Tabla de Contenidos

1. [Multiple Choice (Opción Múltiple)](#1-multiple-choice)
2. [Fill in the Blank (Completar)](#2-fill-in-the-blank)
3. [True/False (Verdadero/Falso)](#3-truefalse)
4. [Matching (Emparejar)](#4-matching)
5. [Order (Ordenar)](#5-order)
6. [Highlight (Destacar Palabras)](#6-highlight)
7. [Drag & Drop (Arrastrar y Soltar)](#7-drag--drop)
8. [Table (Completar Tabla)](#8-table)

---

## 1. Multiple Choice

**Formato:**
```
[MULTIPLE_CHOICE]

¿Cuál es la capital de Francia?
Londres
*París
Madrid
Roma

¿Cuánto es 2 + 2?
3
*4
5
6
```

**Reglas:**
- Marcar la respuesta correcta con `*` al inicio
- Cada pregunta tiene exactamente 4 opciones
- Las preguntas están separadas por líneas en blanco

---

## 2. Fill in the Blank

**Formato:**
```
[FILL_BLANK]

La capital de Francia es _____.
ANSWER: París

El resultado de 2 + 2 es _____.
ANSWER: 4, cuatro

El color del cielo es _____.
RESPUESTA: azul
```

**Reglas:**
- Usar `___` para indicar el espacio en blanco
- La línea siguiente debe comenzar con `ANSWER:` o `RESPUESTA:`
- Puedes listar múltiples respuestas correctas separadas por comas
- No distingue mayúsculas/minúsculas

---

## 3. True/False

**Formato:**
```
[TRUE_FALSE]

La Tierra es plana.
FALSE

El agua hierve a 100°C.
TRUE

2 + 2 = 5
FALSO

París es la capital de Francia.
VERDADERO
```

**Reglas:**
- Cada afirmación seguida de TRUE/FALSE o VERDADERO/FALSO
- También acepta V/F
- Separar ejercicios con líneas en blanco

---

## 4. Matching

**Formato:**
```
[MATCHING]

MATCH:
Dog = Perro
Cat = Gato
Bird = Pájaro
Fish = Pez

MATCH:
1 = One
2 = Two
3 = Three
```

**Reglas:**
- Comenzar con `MATCH:`
- Formato: `izquierda = derecha`
- Cada par en una línea
- Separar diferentes ejercicios con líneas en blanco

---

## 5. Order

**Formato:**
```
[ORDER]

ORDER: The quick brown fox jumps
WORDS: fox|brown|The|jumps|quick

ORDER: Pasos para hacer un café
ITEMS: Hervir agua|Poner café en filtro|Verter agua|Servir
```

**Reglas:**
- `ORDER:` seguido de la descripción o frase correcta
- `WORDS:` o `ITEMS:` seguido de los elementos separados por `|`
- Los elementos se mostrarán desordenados automáticamente

---

## 6. Highlight

**Formato:**
```
[HIGHLIGHT]

HIGHLIGHT: The quick brown fox jumps over the lazy dog
WORDS: quick,fox,lazy

HIGHLIGHT: Me gusta el café con leche y azúcar
WORDS: café,leche,azúcar
```

**Reglas:**
- `HIGHLIGHT:` seguido de la oración completa
- `WORDS:` seguido de las palabras a seleccionar, separadas por comas
- Las palabras deben aparecer exactamente como en la oración

---

## 7. Drag & Drop

**Formato:**
```
[DRAG_DROP]

DRAG: Complete the sentence
SENTENCE: The ___ is ___
OPTIONS: cat,dog,bird|running,sleeping,eating
ANSWERS: cat,sleeping

DRAG: Completa la oración
SENTENCE: En ___ me gusta ___ en el parque
OPTIONS: verano,invierno,otoño|correr,caminar,descansar
ANSWERS: verano,correr
```

**Reglas:**
- `DRAG:` descripción del ejercicio
- `SENTENCE:` oración con `___` para espacios
- `OPTIONS:` grupos de opciones separados por `|`, opciones dentro del grupo separadas por `,`
- `ANSWERS:` respuestas correctas en orden, separadas por comas

---

## 8. Table

**Formato:**
```
[TABLE]

TABLE: Complete the multiplication table
HEADER: x|2|3|4
ROW: 2|4|6|___
ROW: 3|6|9|___
ANSWER: 8
ANSWER: 12

TABLE: Conjugación del verbo "ser"
HEADER: Pronombre|Presente|Pasado
ROW: Yo|___| fui
ROW: Tú|eres|___
ANSWER: soy
ANSWER: fuiste
```

**Reglas:**
- `TABLE:` descripción de la tabla
- `HEADER:` encabezados separados por `|`
- `ROW:` filas con `___` para celdas vacías
- `ANSWER:` respuestas en orden, una por línea

---

## 💡 Notas Importantes

### Compatibilidad
El parser mantiene compatibilidad con el formato antiguo de multiple choice sin necesidad de usar `[MULTIPLE_CHOICE]`.

### Archivo de Ejercicios Mixtos
Puedes combinar diferentes tipos de ejercicios en un mismo archivo:

```
[MULTIPLE_CHOICE]

¿Cuál es la capital de España?
Barcelona
*Madrid
Sevilla
Valencia

[TRUE_FALSE]

Madrid es la capital de España.
TRUE

[FILL_BLANK]

La capital de España es _____.
ANSWER: Madrid
```

### Mejores Prácticas

1. **Usa líneas en blanco** para separar ejercicios del mismo tipo
2. **Especifica el tipo** al inicio de cada sección con `[TIPO]`
3. **Mantén la consistencia** en el formato dentro de cada tipo
4. **Prueba los ejercicios** antes de usarlos en clase
5. **Usa UTF-8** para caracteres especiales (tildes, ñ, etc.)

---

## 🔄 Migración desde Formato Antiguo

Si tienes archivos en el formato antiguo (solo multiple choice), no necesitas hacer nada. El parser es compatible.

Para aprovechar los nuevos tipos, simplemente agrega las marcas `[TIPO]` y sigue los formatos descritos arriba.

---

## 📝 Ejemplos Completos

Consulta la carpeta `examples/` para ver archivos de ejemplo completos de cada tipo de ejercicio.

---

## 🐛 Solución de Problemas

### El ejercicio no se reconoce
- Verifica que la marca `[TIPO]` esté correcta
- Asegúrate de seguir el formato exacto
- Revisa que no haya líneas extra o faltantes

### Las respuestas no se validan correctamente
- En fill_blank, verifica que las respuestas estén después de `ANSWER:`
- En matching, asegúrate de usar el signo `=`
- En order, separa los items con `|`

### Caracteres especiales no se muestran
- Guarda el archivo con codificación UTF-8
- Evita usar caracteres raros o emojis en las marcas de formato
