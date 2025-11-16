# 📦 Guía del Generador de Paquetes de Diapositivas ADE1

## 🎯 Propósito

**SlidePackageGenerator** es un componente temporal para procesar las 537 diapositivas del libro ADE1 (formato PowerPoint → JSON) y exportarlas al Content Manager como paquetes listos para usar en el Diario de Clase.

---

## 📍 Ubicación

**Componente:** `src/components/SlidePackageGenerator.jsx`
**Acceso:** Dashboard Profesor → Gestión de Contenidos → Pestaña "Generador PPT ADE1"

---

## 🚀 Workflow Completo

### 1️⃣ Preparación del JSON

El archivo `xiwen_contenidos/ade1_2026_content.json` contiene 537 diapositivas extraídas del PowerPoint ADE1_2026.pptx

**Estructura del JSON:**
```json
{
  "metadata": {
    "filename": "ADE1_2026.pptx",
    "total_slides": 537,
    "slide_width": 12192000,
    "slide_height": 6858000
  },
  "slides": [
    {
      "slide_number": 1,
      "title": null,
      "content": [...],  // Texto con formato
      "tables": [...],   // Tablas (phonética, conjugación, Q&A)
      "images": [...],   // Imágenes (placeholder por ahora)
      "notes": null
    }
  ]
}
```

### 2️⃣ Detección Automática de Tipos

El componente detecta automáticamente:

| Tipo | Descripción | Badge Color |
|------|-------------|-------------|
| **fill_in_blank** | Texto con espacios `___` para completar | 🟢 Verde |
| **conjugation_table** | Tablas con pronombres (yo, tú, él, nosotros...) | 🔵 Azul |
| **qa_table** | Tablas con filas de pregunta + filas vacías | 🟡 Amarillo |
| **table_only** | Solo tablas (fonética, vocabulario) | ⚪ Gris |
| **table_with_text** | Combinación de texto + tabla | ⚪ Gris |
| **text_only** | Solo texto (instrucciones, explicaciones) | ⚪ Gris |
| **has_images** | Contiene imágenes | 🟣 Morado |

### 3️⃣ Interfaz del Generador

#### Panel de Estadísticas
- **Total Diapositivas:** 537
- **Seleccionadas:** Contador dinámico
- **Fill-in-Blanks:** ~116 ejercicios
- **Tablas Ejercicios:** ~200 (conjugación + Q&A)

#### Controles de Filtrado
1. **Búsqueda:** Por número, título o contenido
2. **Filtro por tipo:** Fill-in-Blank, Conjugación, Q&A, etc.
3. **Selección:**
   - Seleccionar Todo
   - Deseleccionar Todo
   - Selección individual con checkbox

#### Vista de Diapositivas
Cada diapositiva muestra:
- ✅ Checkbox para seleccionar
- 📄 Número y título
- 🏷️ Badges de tipo, tablas, imágenes
- 🔽 Expandir para ver preview completo

### 4️⃣ Preview de Contenido

Al expandir una diapositiva, se muestra:

#### Texto Formateado
```jsx
- Tamaño de fuente (font_size)
- Negrita (bold)
- Cursiva (italic)
- Detección de blanks (___) resaltados en azul
```

#### Tablas
```jsx
- Renderizado completo de filas/columnas
- Celdas vacías marcadas en amarillo
- Indicador "[vacío - para responder]"
```

#### Imágenes (Placeholder)
```jsx
- Contenedor con dimensiones originales
- Icono de imagen
- Datos: width x height (EMU)
```

### 5️⃣ Configuración de Formato

```javascript
formatSettings = {
  baseFontSize: 16,        // Tamaño base de texto
  titleFontSize: 24,       // Tamaño de títulos
  fontFamily: 'system-ui', // Familia de fuente
  lineHeight: 1.6,         // Altura de línea
  tableStyle: 'bordered'   // 'bordered' | 'minimal' | 'striped'
}
```

### 6️⃣ Exportar al Content Manager

1. **Seleccionar diapositivas** (1 o más)
2. **Click en "Exportar Seleccionadas"**
3. El sistema crea un contenido tipo `lesson` con:
   ```json
   {
     "type": "lesson",
     "title": "ADE1 - Diapositivas 1-50",
     "description": "Paquete de 50 diapositivas del libro ADE1",
     "body": JSON.stringify({
       slides: [...],
       formatSettings: {...},
       metadata: {...}
     }),
     "metadata": {
       "slideCount": 50,
       "slideRange": "1-50",
       "types": [...],
       "source": "SlidePackageGenerator"
     }
   }
   ```

### 7️⃣ Visualización en Diario de Clase

Una vez exportado, el paquete estará disponible en:
- **Content Manager** → Ver contenido exportado
- **Asignar** a cursos/grupos
- **Diario de Clase** → Los alumnos verán las diapositivas procesadas

---

## 🎨 Casos de Uso Típicos

### Caso 1: Exportar Ejercicios Fill-in-Blank
```
1. Filtrar por tipo: "Fill-in-Blank"
2. Seleccionar Todo (116 diapositivas)
3. Exportar como "ADE1 - Ejercicios de Completar"
```

### Caso 2: Exportar Tablas de Conjugación
```
1. Filtrar por tipo: "Conjugación"
2. Revisar previews
3. Seleccionar las deseadas
4. Exportar como "ADE1 - Conjugación de Verbos"
```

### Caso 3: Exportar Unidad Completa
```
1. Búsqueda: "Unidad 1"
2. Seleccionar todas las diapositivas de la unidad
3. Exportar como "ADE1 - Unidad 1 Completa"
```

### Caso 4: Exportar Secuencia Específica
```
1. Búsqueda: número específico (ej: "115")
2. Expandir y revisar
3. Seleccionar rango (ej: 115-125)
4. Exportar como paquete temático
```

---

## 🔧 Detección Inteligente de Ejercicios

### Fill-in-Blank
```javascript
// Detecta cualquier texto con ___ (3 o más guiones bajos)
"Yo _____ español"
"Nosotros vivimos con mis padres. ______casa está cerca"
```

### Tablas Q&A
```javascript
// Detecta tablas con patrón:
// Fila con pregunta + Fila vacía
[
  ["¿Cómo te llamas?", ""],
  ["", ""]  // Fila para responder
]
```

### Tablas de Conjugación
```javascript
// Detecta si contiene pronombres:
- yo
- tú / vos
- él / ella / usted
- nosotros/as
- ellos/as / ustedes
```

---

## 📊 Estadísticas del Archivo ADE1

```
Total: 537 diapositivas

Distribución:
- 274 (51%) - Solo TABLAS
- 125 (23%) - TABLA + TEXTO
- 61 (11%)  - Solo TEXTO
- 77 (14%)  - Con IMÁGENES

Por tipo de ejercicio:
- ~116 Fill-in-Blanks
- ~100 Tablas de conjugación
- ~100 Tablas Q&A
- ~150 Tablas de fonética/vocabulario
```

---

## ⚙️ Configuración Técnica

### Archivo JSON
**Ubicación:** `public/xiwen_contenidos/ade1_2026_content.json`
**Tamaño:** 674 KB
**Formato:** UTF-8

### Carga del Archivo
```javascript
const response = await fetch('/xiwen_contenidos/ade1_2026_content.json');
const data = await response.json();
```

### Export Hook
```javascript
import { useContentExport } from '../hooks/useContentExport';

const { exportContent, loading } = useContentExport();

await exportContent({
  type: 'lesson',
  title: '...',
  body: JSON.stringify(slideData),
  metadata: {...},
  createdBy: user.uid
});
```

---

## 🚧 Limitaciones Actuales

1. **Imágenes:** Solo placeholders (no extraídas del PPT aún)
2. **Edición Inline:** Planificada pero no implementada
3. **Corrección Automática:** No incluida (solo inputs libres)
4. **Audio:** No incluido

---

## 🔮 Mejoras Futuras (Opcionales)

1. **Edición Inline**
   - Corregir errores de texto antes de exportar
   - Modificar tamaños de fuente
   - Ajustar formato de tablas

2. **Extracción de Imágenes**
   - Extraer imágenes del PPT original
   - Subir a Firebase Storage
   - Referenciar en el JSON

3. **Corrección Automática**
   - Agregar respuestas correctas a fill-in-blanks
   - Validación de ejercicios
   - Sistema de puntos

4. **Agrupación Inteligente**
   - Auto-detectar "unidades"
   - Sugerir paquetes temáticos
   - Exportar por temas

---

## 📝 Notas de Desarrollo

- **Componente temporal:** Diseñado para procesamiento masivo inicial
- **Una vez exportado:** El contenido vive en Firebase, no en el generador
- **No modifica el JSON original:** Solo lee y procesa
- **Reutilizable:** Puede usarse con otros archivos JSON del mismo formato

---

## 💡 Tips de Uso

1. **Empezar por tipos específicos:** Exportar primero fill-in-blanks (más fáciles)
2. **Revisar previews:** Expandir algunas slides antes de exportar todo
3. **Paquetes pequeños:** Mejor 20-30 slides por paquete que 537 de una vez
4. **Nombrado claro:** Usar nombres descriptivos al exportar
5. **Testear primero:** Exportar 1-2 slides, ver en diario de clase, luego escalar

---

## 🆘 Troubleshooting

### Error: "No se pudo cargar el archivo JSON"
- Verificar que existe: `public/xiwen_contenidos/ade1_2026_content.json`
- Permisos de lectura correctos
- Servidor dev corriendo

### No se ven las diapositivas
- Verificar que el usuario tiene permiso `create-content`
- Revisar consola del navegador (F12)

### Export falla
- Usuario debe estar logueado
- Verificar Firebase config
- Revisar permisos de Firestore

---

## 📞 Soporte

Para agregar funcionalidades o reportar bugs, ver:
- `src/components/SlidePackageGenerator.jsx` (código principal)
- `src/hooks/useContentExport.js` (lógica de export)
- Firebase console → `unified_content` collection

---

**Versión:** 1.0.0
**Fecha:** Noviembre 2025
**Autor:** XIWEN App Development Team
