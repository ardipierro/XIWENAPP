# 📱 Análisis y Propuesta de Mejoras - Sistema de Mensajería

**Fecha:** 2025-11-15
**Autor:** Análisis técnico de XIWENAPP
**Objetivo:** Modernizar el sistema de mensajería manteniendo ligereza y agilidad

---

## 📊 Estado Actual del Sistema

### ✅ Funcionalidades Implementadas

**Componentes Principales:**
- `MessagesPanel.jsx` - Panel principal con lista de conversaciones
- `MessageThread.jsx` - Vista de conversación individual
- `NewMessageModal.jsx` - Iniciar nueva conversación
- `firebase/messages.js` - Operaciones de backend (Firestore)
- `hooks/useUnreadMessages.js` - Hook para contador de no leídos

**Características Actuales:**
1. ✅ Conversaciones en tiempo real (Firebase Realtime)
2. ✅ Indicador de "escribiendo..." (typing indicators)
3. ✅ Búsqueda de mensajes dentro de conversación
4. ✅ Búsqueda de conversaciones
5. ✅ Adjuntar archivos (imágenes, documentos)
6. ✅ Mensajes de voz
7. ✅ Reacciones a mensajes (emojis)
8. ✅ Emojis en mensajes
9. ✅ Contador de mensajes no leídos
10. ✅ Marcado de leídos automático
11. ✅ Archivar conversaciones
12. ✅ Avatares con iniciales y colores por rol

### ⚠️ Limitaciones Identificadas

**Funcionalidad:**
1. ❌ No se pueden eliminar mensajes individuales
2. ❌ No se pueden editar mensajes
3. ❌ No hay confirmación de entrega
4. ❌ No hay confirmación de lectura (checkmarks)
5. ❌ No hay mensajes de difusión/grupos
6. ❌ No hay respuesta a mensajes específicos (reply/quote)
7. ❌ No hay reenvío de mensajes
8. ❌ No hay mensajes destacados/favoritos
9. ❌ No hay exportación de conversaciones
10. ❌ No hay bloqueo de usuarios
11. ❌ No hay mensajes programados
12. ❌ No hay encuestas/polls
13. ❌ No hay compartir ubicación
14. ❌ No hay videollamadas/llamadas
15. ❌ No hay estado de usuario (online/offline/ausente)

**UX/UI:**
1. ⚠️ No hay vista previa de enlaces (link preview)
2. ⚠️ No hay scroll infinito (carga paginada de mensajes)
3. ⚠️ No hay zoom en imágenes
4. ⚠️ No hay arrastrar y soltar archivos
5. ⚠️ No hay vista de galería de medios
6. ⚠️ No hay notificaciones de escritorio
7. ⚠️ No hay sonidos de notificación
8. ⚠️ No hay temas personalizables por conversación

**Técnico:**
1. ⚠️ Límite fijo de 50 mensajes por conversación
2. ⚠️ No hay caché local de mensajes
3. ⚠️ No hay compresión de imágenes
4. ⚠️ No hay sincronización offline

---

## 🎯 Propuesta de Mejoras por Etapas

### 📦 ETAPA 1: Funcionalidades Críticas (1-2 semanas)
**Objetivo:** Operaciones básicas de mensajería moderna

#### 1.1 Eliminar Mensajes (Alta Prioridad)
**Impacto:** Alto | **Complejidad:** Media

**Características:**
- Eliminar para mí (oculta el mensaje solo para el usuario actual)
- Eliminar para todos (elimina el mensaje para ambos usuarios - dentro de 1 hora)
- Indicador de "mensaje eliminado" cuando se elimina para todos
- Confirmación antes de eliminar

**Implementación:**
```javascript
// Agregar a firebase/messages.js
export async function deleteMessage(messageId, userId, deleteForEveryone = false) {
  const messageRef = doc(db, 'messages', messageId);
  const messageDoc = await getDoc(messageRef);

  if (!messageDoc.exists()) return;

  const data = messageDoc.data();

  if (deleteForEveryone) {
    // Verificar que no haya pasado más de 1 hora
    const createdAt = data.createdAt.toDate();
    const hourAgo = new Date(Date.now() - 3600000);

    if (createdAt < hourAgo) {
      throw new Error('Solo puedes eliminar mensajes de la última hora');
    }

    // Marcar como eliminado para todos
    await updateDoc(messageRef, {
      deleted: true,
      deletedAt: serverTimestamp(),
      deletedBy: userId
    });
  } else {
    // Agregar userId a lista de usuarios que ocultaron el mensaje
    await updateDoc(messageRef, {
      [`hiddenFor.${userId}`]: true
    });
  }
}
```

**UI:**
- Botón de menú contextual (3 puntos) en cada mensaje propio
- Modal de confirmación con opciones "Eliminar para mí" / "Eliminar para todos"

---

#### 1.2 Editar Mensajes (Alta Prioridad)
**Impacto:** Alto | **Complejidad:** Media

**Características:**
- Editar mensajes enviados (dentro de 15 minutos)
- Indicador de "editado" con timestamp
- Historial de ediciones (opcional para admins/profesores)

**Implementación:**
```javascript
export async function editMessage(messageId, userId, newContent) {
  const messageRef = doc(db, 'messages', messageId);
  const messageDoc = await getDoc(messageRef);

  if (!messageDoc.exists()) return;

  const data = messageDoc.data();

  // Verificar que sea el autor
  if (data.senderId !== userId) {
    throw new Error('No autorizado');
  }

  // Verificar tiempo límite (15 minutos)
  const createdAt = data.createdAt.toDate();
  const fifteenMinAgo = new Date(Date.now() - 900000);

  if (createdAt < fifteenMinAgo) {
    throw new Error('Solo puedes editar mensajes de los últimos 15 minutos');
  }

  await updateDoc(messageRef, {
    content: newContent,
    edited: true,
    editedAt: serverTimestamp(),
    originalContent: data.content // Guardar original
  });
}
```

---

#### 1.3 Estado de Mensaje (Checkmarks)
**Impacto:** Alto | **Complejidad:** Baja

**Características:**
- ✓ Enviado (gris)
- ✓✓ Entregado (gris)
- ✓✓ Leído (azul)

**Implementación:**
```javascript
// Agregar campos al mensaje
{
  status: 'sent' | 'delivered' | 'read',
  sentAt: Timestamp,
  deliveredAt: Timestamp,
  readAt: Timestamp
}
```

**UI:**
```jsx
const MessageStatus = ({ status, readAt }) => {
  if (status === 'sent') return <Check size={14} className="text-gray-400" />;
  if (status === 'delivered') return <CheckCheck size={14} className="text-gray-400" />;
  if (status === 'read') return <CheckCheck size={14} className="text-blue-500" />;
};
```

---

#### 1.4 Responder a Mensaje (Reply/Quote)
**Impacto:** Alto | **Complejidad:** Media-Alta

**Características:**
- Citar mensaje específico en la respuesta
- Vista previa del mensaje citado
- Scroll automático al mensaje original al hacer clic en la cita

**Implementación:**
```javascript
// Agregar campo replyTo al mensaje
{
  replyTo: {
    messageId: string,
    content: string,
    senderName: string,
    attachment: object | null
  }
}
```

**UI:**
```jsx
{message.replyTo && (
  <div className="reply-preview" onClick={() => scrollToMessage(message.replyTo.messageId)}>
    <div className="reply-line"></div>
    <div>
      <strong>{message.replyTo.senderName}</strong>
      <p>{message.replyTo.content}</p>
    </div>
  </div>
)}
```

---

### 📦 ETAPA 2: Mejoras de UX (2-3 semanas)
**Objetivo:** Experiencia de usuario más fluida y moderna

#### 2.1 Estado de Usuario (Online/Offline)
**Impacto:** Alto | **Complejidad:** Media

**Características:**
- Indicador verde cuando está online
- "Última vez hace X minutos/horas/días"
- Actualización en tiempo real

**Implementación:**
```javascript
// Usar Firebase Realtime Database para presencia
import { getDatabase, ref, onDisconnect, set } from 'firebase/database';

export function updateUserPresence(userId) {
  const db = getDatabase();
  const userStatusRef = ref(db, `/status/${userId}`);

  set(userStatusRef, {
    state: 'online',
    lastChanged: Date.now()
  });

  onDisconnect(userStatusRef).set({
    state: 'offline',
    lastChanged: Date.now()
  });
}
```

---

#### 2.2 Vista Previa de Enlaces (Link Preview)
**Impacto:** Medio | **Complejidad:** Media

**Características:**
- Detectar URLs en mensajes
- Mostrar título, descripción e imagen
- Uso de API externa (Open Graph) o service worker

**Implementación:**
```javascript
// Detectar URLs con regex
const urlRegex = /(https?:\/\/[^\s]+)/g;
const urls = content.match(urlRegex);

// Fetch metadata (backend con Cloud Function)
export async function fetchLinkPreview(url) {
  const response = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
  return response.json();
}
```

---

#### 2.3 Drag & Drop de Archivos
**Impacto:** Medio | **Complejidad:** Baja

**Características:**
- Arrastrar archivos directamente al área de chat
- Vista previa antes de enviar
- Indicador visual de zona de drop

**Implementación:**
```jsx
const handleDrop = (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  handleFileSelect({ target: { files: [file] } });
};

<div
  className="messages-list"
  onDragOver={(e) => e.preventDefault()}
  onDrop={handleDrop}
>
```

---

#### 2.4 Zoom en Imágenes (Image Viewer)
**Impacto:** Medio | **Complejidad:** Baja

**Características:**
- Modal lightbox al hacer clic en imagen
- Zoom in/out
- Navegación entre imágenes de la conversación
- Descargar imagen

**Implementación:**
- Usar librería `react-image-lightbox` o implementar modal custom
- Recopilar todas las imágenes de la conversación en un array

---

#### 2.5 Galería de Medios
**Impacto:** Medio | **Complejidad:** Media

**Características:**
- Vista de todas las fotos/videos/documentos compartidos
- Filtrado por tipo
- Descarga masiva

**Implementación:**
```jsx
const MediaGallery = ({ conversationId }) => {
  const [media, setMedia] = useState([]);
  const [filter, setFilter] = useState('all'); // all, images, files, audio

  useEffect(() => {
    // Query messages con attachments
    const q = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      where('attachment', '!=', null)
    );
    // ...
  }, [conversationId]);

  return (
    <div className="media-gallery">
      <div className="filters">
        <button onClick={() => setFilter('all')}>Todos</button>
        <button onClick={() => setFilter('images')}>Fotos</button>
        <button onClick={() => setFilter('files')}>Archivos</button>
        <button onClick={() => setFilter('audio')}>Audio</button>
      </div>
      <div className="media-grid">
        {/* Grid de medios */}
      </div>
    </div>
  );
};
```

---

#### 2.6 Notificaciones de Escritorio
**Impacto:** Alto | **Complejidad:** Baja

**Características:**
- Notificación cuando llega mensaje nuevo
- Permiso del navegador
- Click en notificación abre la conversación

**Implementación:**
```javascript
export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

export function showMessageNotification(senderName, content, conversationId) {
  if (Notification.permission === 'granted') {
    const notification = new Notification(senderName, {
      body: content,
      icon: '/icon-192.png',
      tag: conversationId
    });

    notification.onclick = () => {
      window.focus();
      // Navegar a la conversación
    };
  }
}
```

---

### 📦 ETAPA 3: Funcionalidades Avanzadas (3-4 semanas)
**Objetivo:** Diferenciadores y funcionalidades únicas

#### 3.1 Mensajes de Grupo
**Impacto:** Muy Alto | **Complejidad:** Alta

**Características:**
- Crear grupos con múltiples participantes
- Nombre y foto del grupo
- Roles: admin, miembro
- Agregar/quitar participantes
- Salir del grupo

**Cambios en la estructura:**
```javascript
// Nueva colección: groups
{
  id: string,
  name: string,
  photoURL: string,
  createdBy: string,
  createdAt: Timestamp,
  participants: string[], // userIds
  admins: string[], // userIds que son admins
}

// Modificar conversations para soportar grupos
{
  participants: string[],
  isGroup: boolean,
  groupId: string | null,
  groupName: string | null,
  // ...
}
```

---

#### 3.2 Reenviar Mensajes
**Impacto:** Medio | **Complejidad:** Media

**Características:**
- Seleccionar mensaje y reenviarlo a otra conversación
- Vista previa antes de reenviar
- Indicador de "reenviado"

**Implementación:**
```javascript
export async function forwardMessage(messageId, toConversationId, fromUserId) {
  const messageDoc = await getDoc(doc(db, 'messages', messageId));
  const original = messageDoc.data();

  await sendMessage({
    conversationId: toConversationId,
    senderId: fromUserId,
    content: original.content,
    attachment: original.attachment,
    forwarded: true,
    forwardedFrom: {
      messageId,
      senderName: original.senderName
    }
  });
}
```

---

#### 3.3 Mensajes Destacados/Favoritos
**Impacto:** Medio | **Complejidad:** Baja

**Características:**
- Marcar mensajes como favoritos/importantes
- Lista de mensajes destacados por conversación
- Búsqueda en favoritos

**Implementación:**
```javascript
export async function toggleMessageStar(messageId, userId) {
  const messageRef = doc(db, 'messages', messageId);
  const messageDoc = await getDoc(messageRef);
  const starred = messageDoc.data().starredBy || [];

  if (starred.includes(userId)) {
    // Quitar estrella
    await updateDoc(messageRef, {
      starredBy: starred.filter(id => id !== userId)
    });
  } else {
    // Agregar estrella
    await updateDoc(messageRef, {
      starredBy: [...starred, userId]
    });
  }
}
```

---

#### 3.4 Encuestas (Polls)
**Impacto:** Medio | **Complejidad:** Alta

**Características:**
- Crear encuestas con opciones múltiples
- Votar en encuestas
- Ver resultados en tiempo real
- Límite de tiempo opcional

**Implementación:**
```javascript
// Nueva colección: polls
{
  id: string,
  messageId: string, // mensaje que contiene la encuesta
  conversationId: string,
  createdBy: string,
  question: string,
  options: [
    { id: string, text: string, votes: string[] } // votes = userIds
  ],
  multipleChoice: boolean,
  expiresAt: Timestamp | null,
  createdAt: Timestamp
}
```

**UI:**
```jsx
const PollMessage = ({ poll, currentUserId }) => {
  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);

  return (
    <div className="poll-container">
      <h4>{poll.question}</h4>
      {poll.options.map(option => {
        const percentage = totalVotes > 0
          ? (option.votes.length / totalVotes * 100).toFixed(0)
          : 0;
        const hasVoted = option.votes.includes(currentUserId);

        return (
          <div key={option.id} className="poll-option" onClick={() => vote(poll.id, option.id)}>
            <div className="poll-bar" style={{ width: `${percentage}%` }} />
            <span>{option.text}</span>
            <span>{percentage}%</span>
            {hasVoted && <Check size={16} />}
          </div>
        );
      })}
      <div className="poll-footer">
        {totalVotes} votos
      </div>
    </div>
  );
};
```

---

#### 3.5 Mensajes Programados
**Impacto:** Bajo | **Complejidad:** Alta

**Características:**
- Programar envío de mensaje para fecha/hora futura
- Editar/cancelar mensajes programados
- Lista de mensajes programados

**Implementación:**
- Usar Firebase Cloud Functions con `functions.pubsub.schedule()`
- O guardar en Firestore y usar un worker que revise periódicamente

---

#### 3.6 Exportar Conversación
**Impacto:** Bajo | **Complejidad:** Media

**Características:**
- Exportar conversación completa a PDF o TXT
- Incluir adjuntos como enlaces
- Filtrado por fecha

**Implementación:**
```javascript
export async function exportConversation(conversationId, format = 'txt') {
  const messages = await getConversationMessages(conversationId, 1000);

  if (format === 'txt') {
    let text = '';
    messages.forEach(msg => {
      text += `[${msg.createdAt.toLocaleString()}] ${msg.senderName}: ${msg.content}\n`;
    });

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-${conversationId}.txt`;
    a.click();
  }

  // Para PDF usar librería jsPDF
}
```

---

### 📦 ETAPA 4: Optimizaciones (2-3 semanas)
**Objetivo:** Rendimiento y escalabilidad

#### 4.1 Scroll Infinito y Paginación
**Impacto:** Alto | **Complejidad:** Media

**Características:**
- Cargar mensajes en bloques de 50
- Cargar más al hacer scroll arriba
- Mantener posición de scroll

**Implementación:**
```javascript
const [messages, setMessages] = useState([]);
const [lastDoc, setLastDoc] = useState(null);
const [loadingMore, setLoadingMore] = useState(false);

const loadMoreMessages = async () => {
  if (!lastDoc || loadingMore) return;

  setLoadingMore(true);

  const q = query(
    collection(db, 'messages'),
    where('conversationId', '==', conversationId),
    orderBy('createdAt', 'desc'),
    startAfter(lastDoc),
    limit(50)
  );

  const snapshot = await getDocs(q);
  const newMessages = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  setMessages(prev => [...newMessages.reverse(), ...prev]);
  setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
  setLoadingMore(false);
};
```

---

#### 4.2 Compresión de Imágenes
**Impacto:** Medio | **Complejidad:** Media

**Características:**
- Comprimir imágenes antes de subir
- Generar thumbnails
- Lazy loading de imágenes

**Implementación:**
```javascript
import imageCompression from 'browser-image-compression';

export async function compressImage(file) {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true
  };

  try {
    const compressed = await imageCompression(file, options);
    return compressed;
  } catch (error) {
    console.error('Error compressing image:', error);
    return file;
  }
}
```

---

#### 4.3 Caché Local (IndexedDB)
**Impacto:** Alto | **Complejidad:** Alta

**Características:**
- Guardar mensajes en IndexedDB
- Cargar desde caché primero
- Sincronizar con Firebase en background

**Implementación:**
- Usar librería `Dexie.js` para IndexedDB
- Implementar estrategia cache-first

---

#### 4.4 Soporte Offline
**Impacto:** Alto | **Complejidad:** Alta

**Características:**
- Enviar mensajes offline (queue)
- Sincronizar cuando vuelve la conexión
- Indicador de "pendiente de envío"

**Implementación:**
- Usar `navigator.onLine` para detectar conectividad
- Guardar mensajes pendientes en localStorage
- Sincronizar al recuperar conexión

---

## 🎨 Mejoras de UI Propuestas

### Modernización Visual

1. **Burbujas de mensaje más redondeadas**
   ```css
   .message-bubble {
     border-radius: 18px;
     padding: 10px 14px;
   }
   ```

2. **Animaciones sutiles**
   ```css
   .message-bubble-container {
     animation: slideIn 0.2s ease-out;
   }

   @keyframes slideIn {
     from {
       opacity: 0;
       transform: translateY(10px);
     }
     to {
       opacity: 1;
       transform: translateY(0);
     }
   }
   ```

3. **Indicador de scroll down**
   - Botón flotante para volver al final cuando hay mensajes nuevos

4. **Mejores placeholders**
   - Skeleton loaders en lugar de spinners

5. **Temas por conversación**
   - Permitir personalizar color de burbujas por conversación

---

## 📋 Priorización Recomendada

### 🔥 Must Have (Implementar Ya)
1. Eliminar mensajes (para mí / para todos)
2. Estado de mensaje (checkmarks)
3. Responder a mensaje (reply)
4. Estado online/offline
5. Notificaciones de escritorio

### 🌟 Should Have (Siguiente Iteración)
6. Editar mensajes
7. Vista previa de enlaces
8. Zoom en imágenes
9. Drag & drop archivos
10. Galería de medios

### 💡 Nice to Have (Futuro)
11. Mensajes de grupo
12. Reenviar mensajes
13. Mensajes favoritos
14. Encuestas
15. Exportar conversación

### ⚡ Performance (Paralelo)
16. Scroll infinito
17. Compresión de imágenes
18. Caché local
19. Soporte offline

---

## 🛠️ Stack Tecnológico Recomendado

**Librerías a agregar:**
```json
{
  "dependencies": {
    "browser-image-compression": "^2.0.2",
    "react-image-lightbox": "^5.1.4",
    "dexie": "^3.2.4",
    "linkify-react": "^4.1.1"
  }
}
```

**Firebase Features:**
- Firestore (mensajes, conversaciones)
- Realtime Database (presencia online/offline)
- Cloud Storage (archivos adjuntos)
- Cloud Functions (link preview, mensajes programados)
- Cloud Messaging (notificaciones push)

---

## 📊 Estimaciones de Tiempo

| Etapa | Características | Tiempo Estimado | Complejidad |
|-------|----------------|-----------------|-------------|
| Etapa 1 | Funcionalidades Críticas | 1-2 semanas | Media-Alta |
| Etapa 2 | Mejoras de UX | 2-3 semanas | Media |
| Etapa 3 | Funcionalidades Avanzadas | 3-4 semanas | Alta |
| Etapa 4 | Optimizaciones | 2-3 semanas | Alta |
| **TOTAL** | | **8-12 semanas** | |

---

## 🎯 Roadmap Sugerido

### Mes 1: Fundamentos
- ✅ Semana 1-2: Eliminar mensajes, Editar mensajes, Checkmarks
- ✅ Semana 3-4: Responder mensajes, Estado online/offline

### Mes 2: Experiencia de Usuario
- ✅ Semana 1-2: Link preview, Drag & drop, Image viewer
- ✅ Semana 3-4: Galería de medios, Notificaciones

### Mes 3: Avanzado
- ✅ Semana 1-2: Mensajes de grupo
- ✅ Semana 3-4: Reenviar, Favoritos, Encuestas

### Mes 4: Optimización
- ✅ Semana 1-2: Scroll infinito, Compresión
- ✅ Semana 3-4: Caché local, Offline support

---

## 💰 Consideraciones de Costos (Firebase)

**Firestore:**
- Reads: ~100-500 reads por conversación abierta
- Writes: 1 write por mensaje enviado
- Realtime listeners: Puede incrementar costos

**Storage:**
- Con compresión de imágenes: ~500KB promedio por imagen
- Mensajes de voz: ~100KB por minuto

**Recomendaciones:**
1. Implementar caché local para reducir reads
2. Comprimir imágenes antes de subir
3. Límite de tamaño de archivos (actual: probablemente 5MB)
4. Cleanup de conversaciones archivadas antiguas

---

## 🔒 Consideraciones de Seguridad

1. **Validación de permisos:**
   - Solo el autor puede editar/eliminar sus mensajes
   - Solo participantes pueden ver mensajes de la conversación

2. **Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /messages/{messageId} {
      allow read: if request.auth != null &&
                     request.auth.uid in get(/databases/$(database)/documents/conversations/$(resource.data.conversationId)).data.participants;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.senderId;
      allow update: if request.auth != null && request.auth.uid == resource.data.senderId;
      allow delete: if request.auth != null && request.auth.uid == resource.data.senderId;
    }
  }
}
```

3. **Sanitización:**
   - Escapar HTML en mensajes para prevenir XSS
   - Validar tipos de archivo
   - Limitar tamaño de mensajes

---

## 📱 Responsive y Accesibilidad

1. **Mobile-first:**
   - Vista de conversación ocupa toda la pantalla en móvil
   - Gestos de swipe para acciones rápidas

2. **Accesibilidad:**
   - ARIA labels en botones
   - Navegación por teclado
   - Lector de pantalla compatible
   - Alto contraste en modo oscuro

3. **PWA:**
   - Notificaciones push
   - Trabajar offline
   - Instalable en dispositivo

---

## ✅ Conclusión

El sistema de mensajería actual tiene una **base sólida** con características modernas como:
- Tiempo real
- Archivos adjuntos
- Mensajes de voz
- Reacciones

**Prioridades inmediatas:**
1. Eliminar mensajes
2. Checkmarks de estado
3. Responder mensajes
4. Estado online/offline

Estas 4 funcionalidades transformarán la experiencia del usuario significativamente sin agregar mucha complejidad.

**Enfoque recomendado:** Implementar por etapas, validar con usuarios, iterar.

---

**¿Por dónde empezamos? 🚀**
