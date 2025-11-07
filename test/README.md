# 🧪 Testing Suite - Student Payment System

Scripts de testing para el sistema de pagos con Firebase Emulators.

## 📁 Archivos

### `seed-test-data.js`
Crea datos de prueba en Firestore emulator:
- 4 usuarios (2 estudiantes, 1 tutor, 1 admin)
- 2 inscripciones (con y sin descuento)
- 3 cursos (2 pagos, 1 gratuito)
- 1 cuota vencida

**Uso:**
```bash
node test/seed-test-data.js
```

**Pre-requisito:** Emuladores de Firebase corriendo

---

### `test-functions.js`
Valida configuración y documenta cómo probar cada Cloud Function.

**Uso:**
```bash
node test/test-functions.js
```

**Tests incluidos:**
1. ✅ Validación de configuración (.runtimeconfig.json)
2. ✅ Verificación de credenciales MercadoPago TEST
3. 📋 Documentación de cómo testear cada función
4. 📊 Resumen de configuración

---

## 🚀 Quick Start

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar credenciales TEST
# Editar: functions/.runtimeconfig.json
# Agregar tu TEST access token de MercadoPago

# 3. Iniciar emuladores
firebase emulators:start

# 4. (En otra terminal) Crear datos de prueba
node test/seed-test-data.js

# 5. Validar configuración
node test/test-functions.js

# 6. Abrir Emulator UI
# http://localhost:4000
```

---

## 📚 Más Información

Ver: `LOCAL_TESTING_GUIDE.md` en la raíz del proyecto para guía completa.
