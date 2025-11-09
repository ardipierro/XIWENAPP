# Content Reader con Anotaciones

Sistema completo de lectura de contenido educativo con herramientas avanzadas de anotación, subrayado y notas.

## 🎯 Características

### 📝 Anotaciones de Texto
- **Subrayado/Highlighting**: Selecciona texto y aplica diferentes colores de resaltado
- **6 colores disponibles**: Amarillo, Verde, Azul, Rosa, Púrpura y Naranja
- **Persistencia**: Todos los highlights se guardan en Firebase

### 📌 Sistema de Notas
- **Notas contextuales**: Vinculadas a fragmentos específicos de texto
- **Notas flotantes**: Se muestran junto al texto relacionado
- **Edición y eliminación**: Gestión completa de notas

### 🎨 Pizarra de Dibujo
- **Canvas overlay**: Dibuja directamente sobre el contenido
- **Múltiples colores**: Usa los mismos 6 colores del sistema
- **Undo/Redo**: Historial completo de trazos
- **Borrar todo**: Limpia la pizarra completamente

### 💾 Persistencia y Exportación
- **Guardar en Firebase**: Todas las anotaciones se guardan por usuario y contenido
- **Exportar JSON**: Descarga tus anotaciones como archivo JSON
- **Importar JSON**: Carga anotaciones desde un archivo

## 📁 Estructura de Archivos

```
src/
├── components/
│   └── ContentReader.jsx          # Componente principal
├── pages/
│   ├── ContentReaderPage.jsx      # Página con integración Firebase
│   └── ContentReaderDemo.jsx      # Demostración interactiva
├── firebase/
│   └── annotations.js             # Servicio de persistencia
└── docs/
    └── CONTENT_READER.md          # Esta documentación
```

## 🚀 Uso

### Acceso Directo a la Demo

Navega a `/content-reader-demo` para ver una demostración completa con contenido de ejemplo.

```
http://localhost:5173/content-reader-demo
```

### Integración en tu Código

#### 1. Usar ContentReader directamente

```jsx
import ContentReader from '../components/ContentReader';

function MiComponente() {
  const content = `
    <h1>Mi Contenido</h1>
    <p>Texto de ejemplo...</p>
  `;

  return (
    <ContentReader
      contentId="mi-contenido-id"
      initialContent={content}
      userId={user.uid}
      readOnly={false}
    />
  );
}
```

#### 2. Usar ContentReaderPage con rutas

```jsx
// En tu componente, redirige al lector
import { useNavigate } from 'react-router-dom';

function MiLista() {
  const navigate = useNavigate();

  const abrirContenido = (contentId) => {
    navigate(`/content-reader/${contentId}`);
  };

  return (
    <button onClick={() => abrirContenido('123')}>
      Leer Contenido
    </button>
  );
}
```

## 🔧 Props del Componente

### ContentReader

| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `contentId` | string | Sí | ID único del contenido |
| `initialContent` | string | No | HTML del contenido a mostrar |
| `userId` | string | Sí | ID del usuario actual |
| `readOnly` | boolean | No | Modo solo lectura (default: false) |

## 🎨 Herramientas Disponibles

### 1. Seleccionar (👆)
- Modo por defecto
- Permite leer el texto sin interacción

### 2. Subrayar (✏️)
- Selecciona texto para aplicar highlight
- Elige un color del picker
- El highlight se guarda automáticamente

### 3. Nota (📝)
- Selecciona texto
- Escribe una nota relacionada
- La nota aparece flotante junto al texto

### 4. Dibujar (🖊️)
- Activa el canvas de dibujo
- Dibuja libremente sobre el contenido
- Usa Undo/Redo para gestionar trazos
- Limpia todo con el botón de borrar

### 5. Selector de Color (🎨)
- 6 colores predefinidos
- Se aplica a highlights y dibujos
- Diseño accesible con dark mode

## 💾 Firebase - Estructura de Datos

### Colección: `annotations`

Cada documento tiene el formato:

```javascript
{
  id: "contentId_userId",          // ID único compuesto
  contentId: "contenido-123",      // ID del contenido
  userId: "usuario-456",            // ID del usuario
  highlights: [
    {
      id: "1234567890",
      text: "texto seleccionado",
      color: "yellow",
      timestamp: 1234567890
    }
  ],
  notes: [
    {
      id: "0987654321",
      text: "Mi nota",
      selectedText: "texto relacionado",
      position: { x: 100, y: 200 },
      timestamp: 1234567890
    }
  ],
  drawings: [
    {
      id: "1122334455",
      points: [[x1, y1], [x2, y2], ...],
      color: "blue",
      timestamp: 1234567890
    }
  ],
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## 🔌 API del Servicio

### Importar el servicio

```javascript
import {
  getAnnotations,
  saveAnnotations,
  deleteAnnotations,
  getAllUserAnnotations,
  getUserAnnotationStats
} from '../firebase/annotations';
```

### Métodos Disponibles

#### `getAnnotations(contentId, userId)`
Obtiene las anotaciones de un usuario para un contenido específico.

```javascript
const annotations = await getAnnotations('content-123', 'user-456');
// Returns: { highlights: [], notes: [], drawings: [] } | null
```

#### `saveAnnotations(contentId, userId, annotationsData)`
Guarda las anotaciones del usuario.

```javascript
await saveAnnotations('content-123', 'user-456', {
  highlights: [...],
  notes: [...],
  drawings: [...]
});
```

#### `deleteAnnotations(contentId, userId)`
Elimina todas las anotaciones de un contenido.

```javascript
await deleteAnnotations('content-123', 'user-456');
```

#### `getAllUserAnnotations(userId)`
Obtiene todas las anotaciones de un usuario en todos los contenidos.

```javascript
const allAnnotations = await getAllUserAnnotations('user-456');
// Returns: Array de objetos de anotaciones
```

#### `getUserAnnotationStats(userId)`
Obtiene estadísticas de anotaciones del usuario.

```javascript
const stats = await getUserAnnotationStats('user-456');
// Returns: {
//   totalAnnotations: 10,
//   totalHighlights: 25,
//   totalNotes: 15,
//   totalDrawings: 8,
//   contentCount: 10
// }
```

## 🎨 Estilos y Theming

El componente usa **100% Tailwind CSS** y soporta **Dark Mode** automáticamente.

### Variables de Color

Los colores utilizan las clases de Tailwind:

```javascript
const HIGHLIGHT_COLORS = {
  yellow: { bg: 'bg-yellow-200', text: 'text-yellow-900', hex: '#fef08a' },
  green: { bg: 'bg-green-200', text: 'text-green-900', hex: '#bbf7d0' },
  blue: { bg: 'bg-blue-200', text: 'text-blue-900', hex: '#bfdbfe' },
  pink: { bg: 'bg-pink-200', text: 'text-pink-900', hex: '#fbcfe8' },
  purple: { bg: 'bg-purple-200', text: 'text-purple-900', hex: '#e9d5ff' },
  orange: { bg: 'bg-orange-200', text: 'text-orange-900', hex: '#fed7aa' },
};
```

## 📱 Responsive Design

El componente es totalmente responsive:

- **Desktop**: Toolbar completo con etiquetas de texto
- **Tablet**: Toolbar con iconos y texto reducido
- **Mobile**: Solo iconos en el toolbar

## ♿ Accesibilidad

- Todos los botones tienen `title` para tooltips
- Estados de hover y focus claramente definidos
- Contraste adecuado en modo claro y oscuro
- Navegación por teclado soportada

## 🔒 Seguridad

- Las anotaciones son privadas por usuario
- Cada usuario solo puede ver/editar sus propias anotaciones
- El modo `readOnly` previene modificaciones
- Validación de permisos en Firebase Rules (recomendado):

```javascript
// Firestore Rules recomendadas
match /annotations/{annotationId} {
  allow read: if request.auth != null;
  allow write: if request.auth != null &&
    request.resource.data.userId == request.auth.uid;
}
```

## 🚦 Próximas Mejoras

- [ ] Soporte para múltiples formatos (Markdown, PDF)
- [ ] Compartir anotaciones entre usuarios
- [ ] Anotaciones colaborativas en tiempo real
- [ ] Búsqueda de anotaciones
- [ ] Exportar a PDF con anotaciones
- [ ] Integración con sistema de tareas/asignaciones
- [ ] Estadísticas y analytics de lectura
- [ ] Modo presentación sin anotaciones

## 🐛 Troubleshooting

### Las anotaciones no se guardan
- Verifica que el usuario esté autenticado (`userId` válido)
- Confirma que Firebase esté configurado correctamente
- Revisa las reglas de seguridad en Firestore

### Los highlights no aparecen después de recargar
- Asegúrate de llamar a `handleSaveAnnotations()` antes de cerrar
- El auto-guardado no está implementado por defecto

### El canvas no se dibuja correctamente
- Verifica que el `containerRef` tenga dimensiones válidas
- Asegúrate de que el canvas se inicialice después del render

## 📞 Soporte

Para preguntas o problemas, contacta al equipo de desarrollo o abre un issue en el repositorio.

---

**Desarrollado con ❤️ para XIWEN APP**
