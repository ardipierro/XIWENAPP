# Despliegue de Cloud Function para LiveKit

## ¿Por qué es necesario?

La Cloud Function `generateLiveKitToken` **debe estar desplegada en producción** porque:

1. **Seguridad**: El API secret de LiveKit NO debe estar en el cliente (navegador)
2. **Tokens válidos**: LiveKit Cloud solo acepta tokens firmados con el API secret correcto desde un servidor confiable
3. **Emulador local**: El emulador de Functions no puede generar tokens válidos para LiveKit Cloud

## Pasos para Desplegar

### 1. Autenticarse en Firebase

```bash
firebase login
```

Esto abrirá tu navegador para autenticarte con tu cuenta de Google.

### 2. Verificar proyecto

```bash
firebase use xiwen-app-2026
```

Debería mostrar: `Now using project xiwen-app-2026`

### 3. Desplegar Cloud Functions

```bash
firebase deploy --only functions
```

### 4. Verificar despliegue

Una vez completado, deberías ver:

```
✔  functions[us-central1-generateLiveKitToken(us-central1)] Successful update operation.

Function URL (generateLiveKitToken(us-central1)): https://us-central1-xiwen-app-2026.cloudfunctions.net/generateLiveKitToken
```

## Variables de Entorno

Las credenciales de LiveKit están configuradas en `functions/.env.yaml`:

- `LIVEKIT_API_KEY`: APIK86wVNDkBfE3
- `LIVEKIT_API_SECRET`: yNRwfDDuLo8V5ZBZmv8TQbIC1girRLWUfL5TVU9DW9JY

**IMPORTANTE**: Este archivo NO debe committearse a Git (ya está en `.gitignore`).

## Después del Despliegue

1. Las clases en vivo deberían funcionar correctamente
2. No verás más el warning "You should not include your API secret in your web client bundle"
3. Los tokens se generarán de forma segura en el backend

## Troubleshooting

### Error: "Failed to authenticate"

Ejecuta:
```bash
firebase logout
firebase login
```

### Error: "Permission denied"

Verifica que tu cuenta de Google tenga permisos de administrador en el proyecto Firebase.

### Error en el deploy

Revisa los logs:
```bash
firebase functions:log
```

## Testing

Para probar después del deploy:

1. Abre la aplicación en `http://localhost:5179`
2. Inicia sesión como profesor
3. Ve a "Clases en Vivo"
4. Crea una nueva clase
5. Únete a la clase
6. Debería conectarse correctamente a LiveKit Cloud

## Configuración de Variables de Entorno

Si necesitas actualizar las credenciales:

1. Edita `functions/.env.yaml`
2. Vuelve a desplegar: `firebase deploy --only functions`

## Monitoreo

Ver logs en tiempo real:
```bash
firebase functions:log --only generateLiveKitToken
```

Ver en la consola de Firebase:
https://console.firebase.google.com/project/xiwen-app-2026/functions
