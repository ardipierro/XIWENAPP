# Configuración de Firebase Realtime Database

## ⚠️ El warning que estás viendo indica que Firebase Realtime Database no está configurado correctamente

## Pasos para configurar:

### 1. Habilitar Realtime Database en Firebase Console

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto: **xiwen-app-2026**
3. En el menú lateral, busca **"Realtime Database"**
4. Click en **"Create Database"** (si no existe aún)
5. Selecciona una ubicación (recomendado: **United States (us-central1)**)
6. Selecciona modo de seguridad:
   - Para desarrollo: **"Start in test mode"** (permite lectura/escritura temporal)
   - Para producción: **"Start in locked mode"** (luego configuraremos reglas)

### 2. Verificar la URL de tu base de datos

Una vez creada, Firebase te mostrará la URL. Debería ser:
```
https://xiwen-app-2026-default-rtdb.firebaseio.com
```

### 3. Agregar la URL a tu archivo .env

Abre el archivo `.env` en la raíz del proyecto y agrega esta línea:

```bash
VITE_FIREBASE_DATABASE_URL=https://xiwen-app-2026-default-rtdb.firebaseio.com
```

### 4. Configurar reglas de seguridad

En la Firebase Console, ve a **Realtime Database > Rules** y configura:

#### Para desarrollo (temporal):
```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

#### Para producción (recomendado):
```json
{
  "rules": {
    "game_sessions": {
      "$sessionId": {
        ".read": true,  // Público para que estudiantes puedan leer
        ".write": "auth != null && (
          root.child('game_sessions').child($sessionId).child('teacherId').val() === auth.uid ||
          auth.token.role === 'admin'
        )"
      }
    }
  }
}
```

### 5. Reiniciar el servidor de desarrollo

Después de agregar la variable al `.env`, DEBES reiniciar:

```bash
# Detener el servidor actual (Ctrl+C)
# Luego iniciar de nuevo:
npm run dev
```

## ✅ Verificación

Después de seguir estos pasos, el warning debería desaparecer y verás algo como:

```
✅ Firebase Realtime Database conectado correctamente
```

## 🔍 Si aún tienes problemas:

1. Verifica que la base de datos esté creada en Firebase Console
2. Verifica que la URL en `.env` sea exactamente la misma que en Firebase Console
3. Asegúrate de haber reiniciado el servidor después de modificar `.env`
4. Verifica las reglas de seguridad en Firebase Console

## 📚 Recursos:

- [Firebase Realtime Database - Get Started](https://firebase.google.com/docs/database/web/start)
- [Security Rules](https://firebase.google.com/docs/database/security)
