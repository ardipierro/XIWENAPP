# 🚀 Deploy del Dashboard Assistant

## Guía Rápida de Instalación

### Paso 1: Configurar API Keys en Firebase

El asistente necesita al menos **una** API key de IA. Recomendamos Claude Sonnet 4.5.

#### Opción A: Claude (Recomendado)

```bash
# Ir a https://console.anthropic.com/settings/keys
# Crear una nueva API key

# En tu terminal:
firebase functions:secrets:set CLAUDE_API_KEY
# Pegar tu API key cuando te lo pida
```

#### Opción B: OpenAI

```bash
# Ir a https://platform.openai.com/api-keys
# Crear una nueva API key

firebase functions:secrets:set OPENAI_API_KEY
```

#### Opción C: Google Gemini

```bash
# Ir a https://aistudio.google.com/app/apikey
# Crear una nueva API key

firebase functions:secrets:set GEMINI_API_KEY
```

### Paso 2: Deploy de Cloud Functions

```bash
# Instalar dependencias
cd functions
npm install

# Deploy solo la función del asistente
firebase deploy --only functions:dashboardAssistant

# O deploy de todas las funciones
firebase deploy --only functions
```

### Paso 3: Verificar que funciona

```bash
# Ver logs en tiempo real
firebase functions:log --only dashboardAssistant

# O visitar Firebase Console
# https://console.firebase.google.com/project/YOUR_PROJECT/functions
```

### Paso 4: Probar en la App

1. Iniciar sesión en XIWENAPP
2. Ir al Dashboard (teacher o admin)
3. Click en el botón flotante del asistente (abajo derecha)
4. Probar con: "¿Cuántos estudiantes tengo?"

---

## 🔍 Verificación de Secretos

Para ver qué API keys están configuradas:

```bash
# Listar todos los secretos
firebase functions:secrets:access CLAUDE_API_KEY --version latest

# Verificar desde la app
# El servicio DashboardAssistantService.checkCredentials()
# puede verificar qué providers están disponibles
```

---

## 🛠️ Troubleshooting

### Error: "API key not configured"

**Solución:**
```bash
firebase functions:secrets:set CLAUDE_API_KEY
firebase deploy --only functions:dashboardAssistant
```

### Error: "Permission denied"

**Solución:**
Verificar que estás autenticado:
```bash
firebase login
firebase use xiwen-app-43cbc  # Reemplazar con tu project ID
```

### La función no aparece en Firebase Console

**Solución:**
```bash
# Verificar que el deploy fue exitoso
firebase deploy --only functions:dashboardAssistant --debug
```

### Respuestas muy lentas (>10 segundos)

**Posibles causas:**
1. Firestore queries sin índices
2. Muchos estudiantes/cursos (>100)
3. API de IA lenta

**Solución:**
Implementar cache (ver Fase 2 en DASHBOARD_ASSISTANT.md)

---

## 💰 Costos Estimados

### Claude Sonnet 4.5
- **Input:** $3 por millón de tokens
- **Output:** $15 por millón de tokens

**Ejemplo:**
- Query típica: 2000 tokens input + 500 tokens output
- Costo por query: ~$0.015 USD
- 100 queries/día: ~$1.50 USD/día

### OpenAI GPT-4o-mini
- **Input:** $0.15 por millón de tokens
- **Output:** $0.60 por millón de tokens

**Ejemplo:**
- Query típica: 2000 tokens input + 500 tokens output
- Costo por query: ~$0.0006 USD
- 100 queries/día: ~$0.06 USD/día

### Gemini 2.0 Flash
- **Gratis** hasta 1500 queries/día
- Luego: muy económico (~$0.001 por query)

---

## 🔒 Seguridad

### Proteger las API Keys

✅ **Correcto:**
- Usar Firebase Secret Manager
- NUNCA commitear las keys al repo
- NUNCA exponerlas en el frontend

❌ **Incorrecto:**
```javascript
// ❌ NUNCA HACER ESTO
const CLAUDE_API_KEY = 'sk-ant-abc123...';
```

### Rate Limiting

Agregar en `functions/dashboardAssistant.js`:

```javascript
// TODO: Implementar rate limiting
// Ejemplo: 10 queries por minuto por usuario
```

---

## 📊 Monitoreo

### Ver uso en Firebase Console

1. Ir a **Functions** → **dashboardAssistant**
2. Ver métricas:
   - Invocaciones/día
   - Tiempo de ejecución
   - Errores

### Logs útiles

```bash
# Ver solo errores
firebase functions:log --only dashboardAssistant | grep ERROR

# Ver últimas 100 líneas
firebase functions:log --only dashboardAssistant --limit 100
```

---

## 🎯 Checklist de Deploy

- [ ] API key configurada en Secret Manager
- [ ] `npm install` ejecutado en `/functions`
- [ ] `firebase deploy --only functions:dashboardAssistant` exitoso
- [ ] Función visible en Firebase Console
- [ ] Logs sin errores
- [ ] Probado desde la app
- [ ] Respuestas coherentes y rápidas (<5s)

---

## 📞 Soporte

Si hay problemas:

1. Revisar logs: `firebase functions:log --only dashboardAssistant`
2. Verificar secretos: `firebase functions:secrets:access CLAUDE_API_KEY`
3. Contactar soporte de Anthropic/OpenAI si hay issues con las APIs

---

**Última actualización:** $(date)
