# Configuración de Secrets de Firebase para APIs de IA

Para que las Cloud Functions puedan llamar a las APIs de IA de forma segura, necesitas configurar los secrets en Firebase.

## Pasos para configurar los secrets:

### 1. Preparar las API Keys

Asegúrate de tener las API keys de los proveedores que quieres usar:

- **OpenAI**: https://platform.openai.com/api-keys
- **Google Gemini**: https://aistudio.google.com/app/apikey
- **xAI Grok**: https://console.x.ai/
- **Anthropic Claude**: https://console.anthropic.com/settings/keys

### 2. Configurar secrets en Firebase

Ejecuta los siguientes comandos **UNO POR UNO** en tu terminal:

```bash
# Cambiar al directorio del proyecto
cd "C:\Users\ardip\OneDrive\XIWEN 2025\XIWENAPP"

# OpenAI (REQUERIDO si quieres usar GPT)
firebase functions:secrets:set OPENAI_API_KEY
# Cuando te pida el valor, pega tu API key de OpenAI y presiona Enter

# Google Gemini (OPCIONAL)
firebase functions:secrets:set GEMINI_API_KEY
# Cuando te pida el valor, pega tu API key de Gemini y presiona Enter

# xAI Grok (OPCIONAL)
firebase functions:secrets:set GROK_API_KEY
# Cuando te pida el valor, pega tu API key de Grok y presiona Enter

# Anthropic Claude (OPCIONAL)
firebase functions:secrets:set CLAUDE_API_KEY
# Cuando te pida el valor, pega tu API key de Claude y presiona Enter
```

### 3. Desplegar las Functions

Una vez configurados los secrets, despliega las functions:

```bash
firebase deploy --only functions
```

### 4. Verificar que funciona

1. Inicia sesión en la aplicación
2. Ve a **Configuración de IA**
3. Abre cualquier función de IA (ej: "Generador de Ejercicios")
4. Configura el proveedor y modelo
5. Click en **"Probar Ahora"**
6. Si todo está bien, deberías ver una respuesta de la IA

## Notas importantes:

- Los secrets se guardan de forma segura en Google Cloud Secret Manager
- Solo las Cloud Functions pueden acceder a estos secrets
- Las API keys NUNCA se exponen al navegador
- Si cambias una API key, debes volver a ejecutar el comando `firebase functions:secrets:set`

## Troubleshooting:

### Error: "Secret Payload cannot be empty"
- Asegúrate de pegar la API key completa cuando te lo pida
- No dejes espacios al principio o al final

### Error: "Permission denied"
- Verifica que tienes permisos de Owner o Editor en el proyecto Firebase
- Ve a: https://console.firebase.google.com/project/xiwen-app-2026/settings/iam

### Error: "CORS" en el navegador
- Esto significa que las functions aún no están desplegadas
- Ejecuta: `firebase deploy --only functions`

### Error: "API key not configured"
- El secret no está configurado correctamente
- Vuelve a ejecutar: `firebase functions:secrets:set NOMBRE_API_KEY`
