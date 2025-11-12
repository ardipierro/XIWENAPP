# Guía de Proveedores de Imágenes IA

## Descripción General

XIWENAPP ahora soporta generación de imágenes educativas usando dos poderosos proveedores de IA:

- **DALL-E** (OpenAI) - Ideal para imágenes simples, claras y educativas
- **Stability AI** - Perfecto para ilustraciones artísticas con gran control creativo

## Características

### ✨ Funciones de IA para Imágenes

1. **Generador de Imágenes** (`image_generator`)
   - Proveedor: DALL-E
   - Propósito: Crear imágenes educativas para lecciones y ejercicios
   - Casos de uso: Vocabulario básico, conceptos visuales, material didáctico

2. **Creador de Ilustraciones** (`illustration_creator`)
   - Proveedor: Stability AI
   - Propósito: Generar ilustraciones artísticas para contenido educativo
   - Casos de uso: Material de lectura, portadas de cursos, ilustraciones complejas

3. **Vocabulario Visual** (`visual_vocabulary`)
   - Proveedor: DALL-E
   - Propósito: Imágenes específicas para enseñar vocabulario
   - Casos de uso: Flashcards, ejercicios de matching, material de repaso

### 🎯 Tareas de Demostración

Se incluyen 8 tareas predefinidas con 40 palabras de vocabulario:

- **Animales** (A1) - 5 palabras
- **Comida** (A1) - 5 palabras
- **Colores** (A1) - 5 palabras
- **Acciones** (A2) - 5 palabras
- **Emociones** (A2) - 5 palabras
- **Clima** (A2) - 5 palabras
- **Lugares** (B1) - 5 palabras
- **Profesiones** (B1) - 5 palabras

## Acceso a la Funcionalidad

### En el Menú Lateral

1. Navega a **Administración** → **Imágenes IA**
2. La pantalla muestra:
   - Panel de configuración de proveedores
   - Botón "Tareas de Demostración"

### Configuración de API Keys

Las API keys se configuran en **Tareas IA** del menú lateral:

1. Ve a **Tareas IA**
2. Busca las funciones de imagen:
   - Generador de Imágenes
   - Creador de Ilustraciones
   - Vocabulario Visual
3. Haz clic en cada una para configurar:
   - Selecciona el proveedor (DALL-E o Stability)
   - Ingresa tu API Key
   - Ajusta parámetros (tamaño, calidad, etc.)
   - Guarda la configuración

## Uso del Servicio

### Importar el Servicio

```javascript
import imageService from '../services/imageService';
```

### Generar una Imagen Simple

```javascript
// Inicializar el servicio
await imageService.initialize();

// Generar imagen
const result = await imageService.generateImage({
  prompt: 'Un gato jugando con una pelota, estilo cartoon colorido',
  functionId: 'image_generator',
  size: '1024x1024'
});

if (result.success) {
  console.log('Imagen generada:', result.images[0].url);
}
```

### Generar Imagen de Vocabulario

```javascript
const result = await imageService.generateVocabularyImage(
  'perro',      // palabra
  'A1',         // nivel CEFR
  'for kids'    // contexto adicional
);
```

### Generar Ilustración para Lección

```javascript
const result = await imageService.generateLessonIllustration(
  'El mercado',                           // tema
  'Un mercado tradicional con vendedores', // descripción
  'friendly'                               // estilo
);
```

### Generar Múltiples Imágenes

```javascript
const items = ['manzana', 'pera', 'naranja'];
const results = await imageService.generateExerciseImages(
  'matching',  // tipo de ejercicio
  items,       // palabras
  'A1'        // nivel
);
```

## Uso de Tareas Predefinidas

### Importar Tareas

```javascript
import {
  IMAGE_GENERATION_TASKS,
  executeImageTask,
  executeTasksByLevel,
  getTasksSummary
} from '../utils/imageGenerationTasks';
```

### Ejecutar una Tarea

```javascript
// Ejecutar tarea de animales
const result = await executeImageTask('vocab_animals', (progress) => {
  console.log(`Generando ${progress.current}/${progress.total}: ${progress.item}`);
});

// Resultado
result.results.forEach((item) => {
  if (item.success) {
    console.log(`${item.word}: ${item.imageUrl}`);
  }
});
```

### Ejecutar Todas las Tareas de un Nivel

```javascript
const results = await executeTasksByLevel('A1', (progress) => {
  console.log(`Progreso: ${progress.task} - ${progress.item}`);
});
```

### Obtener Resumen de Tareas

```javascript
const summary = getTasksSummary();
console.log('Total de tareas:', summary.totalTasks);
console.log('Total de imágenes:', summary.totalItems);
```

## Estructura de Datos

### Configuración de Función

```javascript
{
  id: 'image_generator',
  name: 'Generador de Imágenes',
  description: 'Crea imágenes educativas...',
  icon: Image,
  category: 'content',
  defaultConfig: {
    enabled: false,
    provider: 'dalle',
    model: 'dall-e-3',
    apiKey: '',
    systemPrompt: '...',
    parameters: {
      size: '1024x1024',
      quality: 'standard',
      n: 1
    }
  }
}
```

### Resultado de Generación

```javascript
{
  success: true,
  images: [
    {
      url: 'https://...',           // URL de la imagen (DALL-E)
      b64_json: 'data:image/...'    // Base64 (Stability)
    }
  ],
  provider: 'dalle',
  model: 'dall-e-3'
}
```

## Parámetros de Generación

### DALL-E

- **size**: `1024x1024`, `1024x1792`, `1792x1024`
- **quality**: `standard`, `hd`
- **n**: Número de imágenes (1-10)

### Stability AI

- **size**: `1024x1024`, `512x512`, `768x1344`, `1344x768`
- **steps**: Pasos de difusión (10-50)
- **cfg_scale**: Fuerza del prompt (0-35)
- **negative_prompt**: Qué evitar en la imagen

## Componentes

### ImageProvidersConfig

Panel principal de configuración con:
- Lista de funciones de imagen
- Estado de configuración
- Prueba rápida de generación
- Generación con prompt personalizado
- Acceso a tareas de demostración

### ImageGenerationDemo

Interfaz para ejecutar tareas predefinidas con:
- Vista grid/list de tareas
- Ejecución de tareas
- Barra de progreso en tiempo real
- Galería de resultados
- Descarga individual y masiva

## Integración en el Sistema

### Archivos Nuevos

```
src/
├── services/
│   └── imageService.js              # Servicio de generación
├── components/
│   ├── ImageProvidersConfig.jsx     # Panel de configuración
│   ├── ImageProvidersConfig.css     # Estilos del panel
│   ├── ImageGenerationDemo.jsx      # Tareas de demostración
│   └── ImageGenerationDemo.css      # Estilos de demo
├── utils/
│   └── imageGenerationTasks.js      # Tareas predefinidas
└── constants/
    └── aiFunctions.js               # Configuración actualizada
```

### Archivos Modificados

- `src/constants/aiFunctions.js` - Agregados proveedores y funciones
- `src/components/AdminDashboard.jsx` - Nueva ruta `imageProviders`
- `src/components/SideMenu.jsx` - Nueva opción "Imágenes IA"

## Ejemplo Completo

```javascript
import imageService from '../services/imageService';
import { executeImageTask } from '../utils/imageGenerationTasks';

async function generateVocabularySet() {
  // 1. Inicializar servicio
  await imageService.initialize();

  // 2. Ejecutar tarea predefinida
  const result = await executeImageTask('vocab_animals', (progress) => {
    console.log(`${progress.current}/${progress.total}: ${progress.item}`);
  });

  // 3. Procesar resultados
  const successful = result.results.filter(r => r.success);
  console.log(`✅ ${successful.length} imágenes generadas`);

  // 4. Usar en la aplicación
  successful.forEach((item) => {
    console.log(`${item.word}: ${item.imageUrl}`);
    // Guardar en Firestore, Storage, etc.
  });
}
```

## Mejores Prácticas

### Prompts Efectivos

✅ **Buenos prompts:**
- "Un perro amigable, ilustración educativa simple y colorida"
- "Una manzana roja sobre fondo blanco, estilo educativo"
- "Niño leyendo un libro en biblioteca, ilustración cartoon amigable"

❌ **Prompts a evitar:**
- "Perro" (muy genérico)
- Prompts con texto en la imagen
- Descripciones ambiguas

### Optimización de Costos

1. **Usa DALL-E 2** para pruebas rápidas y económicas
2. **Usa DALL-E 3** para imágenes finales de alta calidad
3. **Caché de imágenes**: Guarda imágenes generadas en Firebase Storage
4. **Tamaño apropiado**: Usa 1024x1024 para la mayoría de casos

### Manejo de Errores

```javascript
try {
  const result = await imageService.generateImage({...});

  if (!result.success) {
    console.error('Error:', result.error);
    // Mostrar mensaje al usuario
  }
} catch (error) {
  console.error('Error de red:', error);
  // Reintentar o notificar
}
```

## Limitaciones

1. **DALL-E**:
   - Máximo 10 imágenes por llamada
   - Costos variables según calidad
   - Requiere API key de OpenAI

2. **Stability AI**:
   - Tiempos de generación más largos
   - Requiere ajuste de parámetros
   - Requiere API key de Stability

## Próximos Pasos

- [ ] Integrar generación automática en creación de ejercicios
- [ ] Agregar caché de imágenes en Firebase Storage
- [ ] Implementar generación por lotes optimizada
- [ ] Agregar más tareas predefinidas (C1, C2)
- [ ] Sistema de plantillas de prompts
- [ ] Integración con biblioteca de imágenes

## Soporte

Para reportar problemas o sugerir mejoras:
- GitHub Issues: [XIWENAPP/issues](https://github.com/ardipierro/XIWENAPP/issues)
- Email: [tu-email@example.com]

---

**Última actualización:** 2025-01-11
**Versión:** 1.0.0
