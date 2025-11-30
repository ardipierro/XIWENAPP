# Sistema de Mensajería - Guía de Integración

## 📋 Resumen

Sistema completo de mensajería en tiempo real para comunicación entre usuarios (profesores, estudiantes, admin).

## 🏗️ Arquitectura

### Firestore Collections

```
conversations/
  - {conversationId}
    - participants: [userId1, userId2]
    - lastMessage: string
    - lastMessageAt: timestamp
    - createdAt: timestamp
    - unreadCount: { userId: number }

messages/
  - {messageId}
    - conversationId: string
    - senderId: string
    - senderName: string
    - content: string
    - createdAt: timestamp
    - read: boolean
```

### Componentes

1. **MessagesPanel** - Panel principal con lista de conversaciones
2. **MessageThread** - Vista de mensajes individuales
3. **NewMessageModal** - Modal para iniciar nuevas conversaciones

### Firebase Functions

- `getOrCreateConversation(userId1, userId2)` - Obtener o crear conversación
- `sendMessage({ conversationId, senderId, senderName, receiverId, content })` - Enviar mensaje
- `getUserConversations(userId)` - Obtener conversaciones del usuario
- `getConversationMessages(conversationId, limit)` - Obtener mensajes
- `markMessagesAsRead(conversationId, userId)` - Marcar como leídos
- `subscribeToMessages(conversationId, callback)` - Suscripción en tiempo real
- `subscribeToConversations(userId, callback)` - Suscripción en tiempo real
- `searchUsers(searchTerm, currentUserId)` - Buscar usuarios

## 🔌 Integración en Dashboards

### Step 1: Import Components

```javascript
import MessagesPanel from './MessagesPanel';
```

### Step 2: Agregar Screen en currentScreen State

```javascript
const [currentScreen, setCurrentScreen] = useState('dashboard');
// Valores posibles: ..., 'messages'
```

### Step 3: Agregar Handler en handleMenuAction

```javascript
const handleMenuAction = (action) => {
  const actionMap = {
    dashboard: () => setCurrentScreen('dashboard'),
    courses: () => setCurrentScreen('courses'),
    messages: () => setCurrentScreen('messages'), // ← AGREGAR ESTO
    // ... otros handlers
  };

  const handler = actionMap[action];
  if (handler) {
    handler();
  }
};
```

### Step 4: Renderizar MessagesPanel

```javascript
// Renderizar Messages Screen - CON Layout
if (currentScreen === 'messages') {
  return (
    <DashboardLayout
      user={user}
      userRole={userRole}
      onLogout={onLogout}
      onMenuAction={handleMenuAction}
      currentScreen={currentScreen}
    >
      <MessagesPanel user={user} />
    </DashboardLayout>
  );
}
```

### Step 5: Agregar en SideMenu

En `src/components/SideMenu.jsx`, agregar el ítem de menú:

```javascript
import { MessageCircle } from 'lucide-react';

// En el array de menu items:
{
  icon: MessageCircle,
  label: 'Mensajes',
  path: '/teacher', // o /student
  action: 'messages'
}
```

## 📝 Ejemplo Completo - TeacherDashboard

```javascript
import MessagesPanel from './MessagesPanel';

function TeacherDashboard({ user, userRole, onLogout }) {
  const [currentScreen, setCurrentScreen] = useState('dashboard');

  const handleMenuAction = (action) => {
    const actionMap = {
      dashboard: () => setCurrentScreen('dashboard'),
      courses: () => setCurrentScreen('courses'),
      messages: () => setCurrentScreen('messages'), // NUEVO
      // ... otros
    };

    const handler = actionMap[action];
    if (handler) {
      handler();
    }
  };

  // NUEVO: Renderizar Messages
  if (currentScreen === 'messages') {
    return (
      <DashboardLayout
        user={user}
        userRole={userRole}
        onLogout={onLogout}
        onMenuAction={handleMenuAction}
        currentScreen={currentScreen}
      >
        <MessagesPanel user={user} />
      </DashboardLayout>
    );
  }

  // ... resto del código
}
```

## 🎨 Estilos

Los estilos están en `src/components/Messages.css` y usan variables CSS globales:
- `--color-bg-primary`
- `--color-bg-secondary`
- `--color-bg-tertiary`
- `--color-text-primary`
- `--color-text-secondary`
- `--color-border`
- `--color-primary`

## 🔒 Seguridad

### Firestore Security Rules

```javascript
// Conversations
match /conversations/{conversationId} {
  allow read: if request.auth != null &&
              request.auth.uid in resource.data.participants;
  allow create: if request.auth != null;
  allow update: if request.auth != null &&
                request.auth.uid in resource.data.participants;
}

// Messages
match /messages/{messageId} {
  allow read: if request.auth != null && (
    request.auth.uid == get(/databases/$(database)/documents/conversations/$(resource.data.conversationId)).data.participants[0] ||
    request.auth.uid == get(/databases/$(database)/documents/conversations/$(resource.data.conversationId)).data.participants[1]
  );
  allow create: if request.auth != null;
}
```

## 🚀 Features

✅ **Mensajería en tiempo real** - onSnapshot listeners
✅ **Búsqueda de usuarios** - Iniciar conversaciones con cualquier usuario
✅ **Indicadores de no leídos** - Contador de mensajes sin leer
✅ **Marcado como leído** - Automático al abrir conversación
✅ **Responsive** - Mobile y desktop
✅ **Dark mode** - Soporte completo
✅ **Typing indicators** - (placeholder para futuro)
✅ **Archivar conversaciones** - Soft delete
✅ **Avatares con iniciales** - Colores basados en rol

## 📱 Responsive Design

El diseño es completamente responsive:
- Desktop: Sidebar + Thread view
- Mobile: Stack vertical

## 🎯 Próximas Mejoras

- [ ] Indicadores de "escribiendo..."
- [ ] Envío de archivos/imágenes
- [ ] Notificaciones push
- [ ] Búsqueda en conversaciones
- [ ] Grupos/conversaciones múltiples
- [ ] Emojis/reacciones
- [ ] Mensajes de voz

## 🧪 Testing

Para probar el sistema:

1. Crear dos usuarios con roles diferentes
2. Login con usuario 1
3. Ir a "Mensajes"
4. Click en "Nuevo mensaje"
5. Buscar usuario 2
6. Enviar mensaje
7. Login con usuario 2
8. Ver mensaje recibido
9. Responder
10. Verificar que aparece en tiempo real en usuario 1

## 📊 Performance

- **Real-time updates**: Firestore onSnapshot
- **Optimistic UI**: Mensajes aparecen inmediatamente
- **Lazy loading**: Solo últimos 50 mensajes
- **Debounce search**: 300ms delay en búsqueda

## 🐛 Troubleshooting

**Problema**: No aparecen mensajes
- Verificar Firestore rules
- Verificar que user.uid existe
- Check console errors

**Problema**: No se actualiza en tiempo real
- Verificar suscripciones (useEffect cleanup)
- Verificar conexión a Firebase

**Problema**: No se encuentran usuarios
- Verificar que existen documentos en `/users`
- Verificar índices en Firestore

---

**Autor**: Claude Code
**Fecha**: 2025-01-06
**Branch**: claude/messaging-system-011CUq52VgnZ7L8THL3iKxJJ
