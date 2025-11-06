# 🎥 Configuración de LiveKit para Clases en Vivo

LiveKit ha sido integrado en tu plataforma para permitir clases en vivo con video, audio y screen sharing.

## 📋 Pasos para Configurar

### 1. Crear Cuenta en LiveKit Cloud (GRATIS)

1. Ve a https://cloud.livekit.io
2. Registrarte con tu email
3. Crea un nuevo proyecto (ej: "xiwen-classes")

### 2. Obtener Credenciales

1. En el dashboard de LiveKit, ve a **Settings > Keys**
2. Copia los siguientes valores:
   - **WebSocket URL**: `wss://your-project-xxxxx.livekit.cloud`
   - **API Key**: `APIxxxxx...`
   - **API Secret**: `xxxxx...`

### 3. Configurar Variables de Entorno

Abre tu archivo `.env` y agrega:

```env
VITE_LIVEKIT_URL=wss://your-project-xxxxx.livekit.cloud
VITE_LIVEKIT_API_KEY=APIxxxxx...
VITE_LIVEKIT_API_SECRET=xxxxx...
```

### 4. Reiniciar el Servidor de Desarrollo

```bash
npm run dev
```

---

## 🚀 Uso

### Para Profesores

1. Ve al panel de "Clases en Vivo"
2. Haz click en "Crear Clase"
3. Llena el formulario:
   - Título de la clase
   - Curso (opcional)
   - Fecha y hora programada
   - Duración
   - Máximo de participantes
4. Haz click en "Iniciar Clase" cuando estés listo
5. Comparte el link con tus estudiantes

### Para Estudiantes

1. Ve a "Mis Clases"
2. Verás las clases programadas de tus cursos
3. Haz click en "Unirse" cuando la clase esté disponible
4. Permite acceso a tu cámara y micrófono

---

## 💰 Costos

### Plan Gratuito
- ✅ **10,000 minutos/mes** gratis
- ✅ Hasta 50 participantes por sala
- ✅ Todas las features (screen share, grabación, etc.)

**Tu caso**: 120 clases/mes × 60 min × 6 personas = 43,200 min/mes

- Primeros 10,000 min: **$0**
- Siguientes 33,200 min: **$49.80-$99.60/mes** (según calidad SD/HD)

### Optimizaciones

1. **Clases de conversación**: Usa solo audio = $16.60/mes
2. **Clases con material**: Usa video SD = $49.80/mes
3. **Clases premium**: Usa video HD = $99.60/mes

---

## 🛠️ Testing Local (Opcional)

Si quieres probar sin conectarte a LiveKit Cloud:

1. Instalar LiveKit Server localmente:
```bash
# macOS/Linux
brew install livekit

# Windows: Descargar desde https://github.com/livekit/livekit/releases
```

2. Ejecutar en modo desarrollo:
```bash
livekit-server --dev
```

3. Usar estas credenciales en `.env`:
```env
VITE_LIVEKIT_URL=ws://localhost:7880
VITE_LIVEKIT_API_KEY=devkey
VITE_LIVEKIT_API_SECRET=secret
```

---

## 📚 Recursos

- **Documentación**: https://docs.livekit.io
- **Dashboard**: https://cloud.livekit.io
- **Ejemplos**: https://github.com/livekit/livekit-examples
- **Soporte**: https://livekit.io/support

---

## 🎯 Próximos Pasos

1. ✅ Configurar LiveKit Cloud
2. ⏳ Crear tu primera clase de prueba
3. ⏳ Invitar a un estudiante para probar
4. ⏳ Explorar features avanzadas (grabación, screen sharing)

---

## ⚠️ Notas Importantes

- **No compartas** tu API Secret con nadie
- **No subas** el archivo `.env` a Git (ya está en `.gitignore`)
- Las **credenciales de desarrollo** (devkey/secret) solo funcionan en localhost
- Para **producción**, siempre usa credenciales de LiveKit Cloud

---

## 🐛 Troubleshooting

### "Error al conectar"
- Verifica que las credenciales en `.env` sean correctas
- Asegúrate de haber reiniciado el servidor después de editar `.env`
- Revisa la consola del navegador para más detalles

### "No se ve el video"
- Verifica permisos de cámara/micrófono en el navegador
- Prueba en una ventana de incógnito
- Revisa que tu firewall no esté bloqueando WebRTC

### "Clase llena"
- Aumenta `maxParticipants` al crear la clase
- Ten en cuenta que el tier gratis soporta hasta 50 participantes por sala

---

¿Necesitas ayuda? Consulta la documentación o contacta al soporte de LiveKit.
