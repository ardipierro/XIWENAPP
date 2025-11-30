# Configurar Dashboard Assistant en Firestore

## Resumen
He actualizado el código para que el asistente del dashboard use una función AI exclusiva llamada `dashboard_assistant` con el proveedor Claude.

## Pasos para completar la configuración

### 1. Ir a Firebase Console
Abre: https://console.firebase.google.com/

### 2. Navegar a Firestore
- Selecciona tu proyecto: `xiwen-app-2026`
- Ve a **Firestore Database** en el menú lateral
- Navega a la colección `ai_config`
- Selecciona el documento `global`

### 3. Agregar el campo `dashboard_assistant`
En el documento `global`, dentro del objeto `functions`, agrega este nuevo campo:

```json
{
  "functions": {
    "pronunciation_coach": {
      ...existente...
      "enabled": false    <- CAMBIAR A false
    },
    "dashboard_assistant": {    <- AGREGAR NUEVO
      "apiKey": "",
      "enabled": true,
      "model": "claude-sonnet-4-5",
      "parameters": {
        "maxTokens": 2000,
        "temperature": 0.7,
        "topP": 1
      },
      "provider": "claude",
      "systemPrompt": "Eres un asistente inteligente para el dashboard de XIWENAPP, una plataforma educativa de enseñanza de chino mandarín. Ayudas a profesores y administradores a obtener información sobre estudiantes, tareas, pagos y métricas del sistema. Respondes de forma clara, concisa y profesional en español."
    }
  }
}
```

### 4. Guardar cambios
Haz clic en **Update** o **Guardar**

## Verificar que funciona

1. Abre el dashboard de XIWENAPP
2. Haz clic en el botón flotante del asistente (icono de estrella)
3. Prueba con una consulta como: "¿cuántos alumnos hay?"
4. Deberías ver la respuesta de Claude

## Archivos modificados

- `src/services/QueryAnalyzerService.js`: Ahora prioriza buscar `dashboard_assistant` antes que otras funciones
- El asistente usará Claude exclusivamente para consultas del dashboard

## Alternativa rápida

También puedes copiar el contenido del archivo `update-dashboard-config.json` y pegarlo manualmente en Firestore bajo `functions.dashboard_assistant`.
