# 🎯 ExerciseMakerESL - Generador de Ejercicios ESL con IA

Componente modal para generar ejercicios de español como lengua extranjera (ESL/ELE) usando inteligencia artificial, con parseo en vivo y componentes interactivos.

## ✨ Características

- 🤖 **Múltiples Proveedores de IA**: Soporta OpenAI (ChatGPT), Google Gemini y xAI Grok
- 🔄 **Cambio Dinámico**: Selector visual para cambiar entre proveedores al vuelo
- 🎨 **Mobile First**: Diseño responsive con Tailwind CSS
- 🎭 **4 Tipos de Ejercicios**:
  - **Gap-fill**: Rellenar espacios en blanco
  - **Multiple-choice**: Opción múltiple con feedback visual
  - **Drag-to-match**: Arrastrar y emparejar elementos
  - **Listening**: Comprensión auditiva con síntesis de voz
- 📊 **Niveles CEFR**: A1, A2, B1, B2, C1, C2
- ⚡ **Feedback Instantáneo**: Validación y corrección inmediata
- 🌙 **Dark Mode**: Soporte completo para modo oscuro
- ⌨️ **Accesibilidad**: Cierra con ESC, navegable por teclado

## 📦 Instalación y Configuración

### 1. Variables de Entorno

Configura uno o más proveedores de IA en tu archivo `.env`:

```bash
# OpenAI (ChatGPT)
VITE_OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
VITE_OPENAI_MODEL=gpt-4o-mini

# Google Gemini
VITE_GEMINI_API_KEY=your-gemini-key
VITE_GEMINI_MODEL=gemini-2.0-flash-exp

# xAI Grok
VITE_GROK_API_KEY=your-grok-key
VITE_GROK_MODEL=grok-2-latest

# Proveedor por defecto
VITE_AI_PROVIDER=openai
```

### Obtener API Keys

| Proveedor | URL | Notas |
|-----------|-----|-------|
| **OpenAI** | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) | $5 gratis para nuevos usuarios |
| **Gemini** | [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) | Gratis con límites generosos |
| **Grok** | [console.x.ai](https://console.x.ai) | Beta, requiere cuenta de X |

> 💡 **Consejo**: Puedes usar solo un proveedor o configurar varios para tener opciones de respaldo

### 2. Archivos Involucrados

```
src/
├── services/
│   ├── AIService.js              # Servicio multi-proveedor (factory pattern)
│   └── providers/
│       ├── BaseAIProvider.js     # Clase base abstracta
│       ├── OpenAIProvider.js     # Implementación OpenAI
│       ├── GeminiProvider.js     # Implementación Google Gemini
│       └── GrokProvider.js       # Implementación xAI Grok
└── components/
    └── ExerciseMakerESL.jsx      # Componente modal con selector de proveedores
```

## 🚀 Uso Básico

### Importar y Usar en tu Componente

```jsx
import { useState } from 'react';
import ExerciseMakerESL from './components/ExerciseMakerESL';
import { Sparkles } from 'lucide-react';

function TeacherDashboard() {
  const [showExerciseMaker, setShowExerciseMaker] = useState(false);

  return (
    <div>
      <button onClick={() => setShowExerciseMaker(true)}>
        <Sparkles className="w-5 h-5" />
        Crear Ejercicios con IA
      </button>

      <ExerciseMakerESL
        isOpen={showExerciseMaker}
        onClose={() => setShowExerciseMaker(false)}
      />
    </div>
  );
}
```

## 🎛️ Controles del Formulario

| Campo | Opciones | Descripción |
|-------|----------|-------------|
| **Tema** | Gramática, Vocabulario, Pronunciación | Área principal del ejercicio |
| **Subtema** | Verbos, Adjetivos, Sustantivos, Preguntas, etc. | Especificación del tema |
| **Tipo** | Gap-fill, Multiple-choice, Drag-to-match, Listening | Formato del ejercicio |
| **Nivel CEFR** | A1, A2, B1, B2, C1, C2 | Dificultad del ejercicio |
| **Cantidad** | 1-10 | Número de ejercicios a generar |
| **Contexto** | Texto libre (opcional) | Ej: "usa animales cotidianos" |

## 🎨 Ejemplos de Uso

### Ejemplo 1: Ejercicios de Verbos para Principiantes

```
Tema: Gramática
Subtema: Verbos
Tipo: Gap-fill
Nivel: A1
Cantidad: 5
Contexto: usa verbos cotidianos y acciones diarias
```

**Resultado esperado**:
```
Yo [___] agua todos los días.
=bebo=

María [___] al trabajo en autobús.
=va=
```

### Ejemplo 2: Vocabulario de Animales

```
Tema: Vocabulario
Subtema: Sustantivos
Tipo: Drag-to-match
Nivel: A2
Cantidad: 3
Contexto: animales domésticos y sus características
```

**Resultado esperado**:
```
<drag>perro</drag> <drag>gato</drag> <drag>pájaro</drag>
<drop>ladra</drop> <drop>maúlla</drop> <drop>canta</drop>
```

### Ejemplo 3: Comprensión Auditiva

```
Tema: Pronunciación
Subtema: Preguntas
Tipo: Listening
Nivel: B1
Cantidad: 2
Contexto: situaciones de viaje y turismo
```

**Resultado esperado**:
```
<audio>¿Dónde está la estación de tren?</audio>
¿Qué pregunta la persona?
**--A-- La ubicación de la estación**
--B-- El precio del billete
--C-- El horario del tren
--D-- La duración del viaje
```

## 🔧 Formato de Parseo de la IA

El componente interpreta estos marcadores automáticamente:

### Gap-fill (Rellenar espacios)
```
El gato [___] en el sofá.
=duerme=
```
- `[___]` → Input editable
- `=respuesta=` → Respuesta correcta

### Multiple-choice (Opción múltiple)
```
¿Cuál es el verbo correcto?
--A-- como
**--B-- comer**
--C-- comiendo
--D-- comí
```
- `--A--` → Opción A
- `**--B--**` → Opción correcta marcada con **

### Drag-to-match (Arrastrar y emparejar)
```
<drag>perro</drag> <drag>gato</drag>
<drop>guau</drop> <drop>miau</drop>
```
- `<drag>texto</drag>` → Elemento arrastrable
- `<drop>texto</drop>` → Zona de destino

### Listening (Comprensión auditiva)
```
<audio>Texto para leer en voz alta</audio>
¿Qué dice el audio?
**--A-- Respuesta correcta**
--B-- Opción incorrecta
```
- `<audio>texto</audio>` → Texto sintetizado
- Seguido de pregunta multiple-choice

## 🎯 Componentes Interactivos

### FillGap
- Input para escribir la respuesta
- Validación al presionar Enter o botón
- Feedback visual verde/rojo
- Muestra respuesta correcta si falla

### MultipleChoice
- Botones de opción con hover effects
- Marca visual de correcto/incorrecto
- Animaciones de feedback
- Deshabilita después de responder

### DragMatch
- Elementos arrastrables con hover
- Zonas de destino con feedback visual
- Validación completa al terminar
- Muestra todas las conexiones correctas/incorrectas

### ListeningExercise
- Botón de reproducción con Web Speech API
- Síntesis de voz en español
- Pregunta multiple-choice después de escuchar
- Puede reproducirse múltiples veces

## 📱 Responsive Design

### Mobile (< 768px)
- Modal fullscreen en móviles pequeños
- Grid de 1 columna para formularios
- Botones de ancho completo
- Texto escalable

### Tablet (768px - 1024px)
- Grid de 2 columnas
- Modal tamaño XL
- Espaciado optimizado

### Desktop (> 1024px)
- Grid de 2 columnas
- Modal centrado con sombras
- Hover effects completos

## 🎨 Clases Tailwind Clave

```jsx
// Modal overlay
"fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm"

// Input correcto
"border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700"

// Input incorrecto
"border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700"

// Botón opción correcta
"border-green-500 bg-green-50 dark:bg-green-900/20"

// Elemento arrastrable
"px-4 py-2 rounded-lg border-2 cursor-move hover:scale-105"
```

## 🔌 API del Servicio

### AIService.generateExercises(params)

```javascript
const result = await AIService.generateExercises({
  theme: 'gramática',
  subtheme: 'verbos',
  type: 'gap-fill',
  difficulty: 'A2',
  quantity: 5,
  context: 'usa animales cotidianos'
});

if (result.success) {
  console.log(result.data); // Texto generado
} else {
  console.error(result.error); // Mensaje de error
}
```

**Retorna**:
```javascript
{
  success: boolean,
  data?: string,      // Texto generado si success=true
  error?: string      // Mensaje de error si success=false
}
```

### AIService.testConnection()

```javascript
const test = await AIService.testConnection();
console.log(test.success); // true si la API key es válida
```

### AIService.setProvider(providerName)

Cambia el proveedor de IA activo:

```javascript
// Cambiar a Gemini
AIService.setProvider('gemini');

// Cambiar a Grok
AIService.setProvider('grok');

// Cambiar a OpenAI
AIService.setProvider('openai');
```

### AIService.getCurrentProvider()

Obtiene el proveedor actual:

```javascript
const current = AIService.getCurrentProvider();
console.log(current); // 'openai', 'gemini', o 'grok'
```

### AIService.getAvailableProviders()

Obtiene lista de proveedores con su estado de configuración:

```javascript
const providers = AIService.getAvailableProviders();
// [
//   {
//     name: 'openai',
//     label: 'OpenAI (ChatGPT)',
//     icon: '🤖',
//     model: 'gpt-4o-mini',
//     configured: true
//   },
//   {
//     name: 'gemini',
//     label: 'Google Gemini',
//     icon: '✨',
//     model: 'gemini-2.0-flash-exp',
//     configured: false
//   },
//   ...
// ]
```

### AIService.testAllProviders()

Prueba conexión de todos los proveedores:

```javascript
const results = await AIService.testAllProviders();
// [
//   { provider: 'openai', success: true },
//   { provider: 'gemini', success: false, error: 'API key no configurada' },
//   { provider: 'grok', success: true }
// ]
```

## 🚧 Troubleshooting

### Error: "API key no configurada"
- ✅ Verifica que `VITE_OPENAI_API_KEY` esté en tu `.env`
- ✅ Reinicia el servidor de desarrollo después de añadir variables
- ✅ No incluyas comillas en el valor de la variable

### Los ejercicios no se parsean correctamente
- ✅ Verifica que la respuesta de la IA use los marcadores exactos
- ✅ Revisa la consola para ver el texto raw generado
- ✅ Ajusta el prompt en `AIService.js` si es necesario

### El audio no funciona
- ✅ Verifica que tu navegador soporte Web Speech API
- ✅ Chrome/Edge tienen mejor soporte que Firefox
- ✅ Permite permisos de audio si el navegador lo solicita

### Modal no cierra con ESC
- ✅ Verifica que `closeOnOverlayClick` no esté en false
- ✅ Asegúrate de que no haya otros modales encima
- ✅ BaseModal maneja ESC automáticamente

## 🎓 Mejores Prácticas

1. **Contexto Específico**: Usa el campo de contexto para guiar a la IA
   ```
   "usa verbos de acción cotidianos"
   "vocabulario de comida mexicana"
   "situaciones formales de negocios"
   ```

2. **Cantidad Apropiada**: Para móviles, 3-5 ejercicios es óptimo

3. **Progresión de Dificultad**: Empieza con A1-A2 para probar

4. **Revisión Manual**: Siempre revisa los ejercicios generados antes de asignar

5. **Guardar Ejercicios**: Considera integrar con `ExerciseRepository` para guardar los generados

## 🔮 Próximas Mejoras

- [ ] Guardar ejercicios directamente en Firebase
- [ ] Exportar ejercicios a PDF
- [ ] Editor inline para ajustar ejercicios generados
- [ ] Soporte para imágenes en ejercicios
- [ ] Historial de ejercicios generados
- [ ] Templates predefinidos
- [ ] Integración con sistema de asignaciones

## 📚 Referencias

- [OpenAI API Docs](https://platform.openai.com/docs/api-reference)
- [CEFR Levels](https://en.wikipedia.org/wiki/Common_European_Framework_of_Reference_for_Languages)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 👨‍💻 Autor

Creado con ❤️ usando Claude Code - Anthropic's AI-powered coding assistant

---

**Master de Coding y Diseño** 🚀
