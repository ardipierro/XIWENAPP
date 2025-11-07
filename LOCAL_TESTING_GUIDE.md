# 🧪 Local Testing Guide - Student Payment System

Guía completa para testear el sistema de pagos localmente usando Firebase Emulators.

## 📋 Pre-requisitos

- ✅ Node.js 18+ instalado
- ✅ Firebase CLI instalado (`npm install -g firebase-tools`)
- ✅ Cuenta MercadoPago Argentina (para TEST credentials)

---

## 🔧 Paso 1: Obtener Credenciales de MercadoPago TEST

### 1.1 Crear cuenta en MercadoPago Developers

1. Ir a: https://www.mercadopago.com.ar/developers
2. Iniciar sesión o crear cuenta
3. Ir a **"Mis aplicaciones"** → **"Crear aplicación"**
4. Seleccionar:
   - Tipo: **"Pagos en línea"**
   - Producto: **"Checkout Pro"**
5. Completar formulario y crear

### 1.2 Obtener TEST Access Token

1. En tu aplicación creada, ir a **"Credenciales"**
2. En la sección **"Credenciales de prueba"** encontrarás:
   - **Public Key**: `TEST-xxxxx-xxxxx-xxxxx` (para frontend)
   - **Access Token**: `TEST-xxxxx-xxxxx-xxxxx` (para backend) ← **ESTE necesitamos**

### 1.3 Configurar en el proyecto

Editar el archivo `functions/.runtimeconfig.json`:

```json
{
  "mercadopago": {
    "access_token": "TEST-1234567890-012345-abc123def456ghi789jkl012mno345-123456789"
  },
  "app": {
    "webhook_url": "http://localhost:5001/xiwen-app-2026/us-central1/mercadopagoWebhook"
  }
}
```

⚠️ **IMPORTANTE:** Este archivo está en `.gitignore` y NO se debe commitear.

---

## 🚀 Paso 2: Iniciar Firebase Emulators

### 2.1 Instalar dependencias

```bash
# Desde la raíz del proyecto
cd functions
npm install
cd ..
```

### 2.2 Iniciar emulators

```bash
firebase emulators:start
```

Esto iniciará:
- **Functions Emulator**: http://localhost:5001
- **Firestore Emulator**: http://localhost:8080
- **Emulator UI**: http://localhost:4000

### 2.3 Verificar que están corriendo

Abrir en el navegador: http://localhost:4000

Deberías ver el **Firebase Emulator UI** con:
- Functions (10 funciones disponibles)
- Firestore (vacío inicialmente)

---

## 📊 Paso 3: Crear Datos de Prueba en Firestore

### 3.1 Vía Emulator UI (Manual)

1. Abrir http://localhost:4000
2. Ir a **"Firestore"** tab
3. Crear estas colecciones manualmente:

#### Collection: `users`

**Documento 1** (Estudiante):
```json
{
  "id": "student001",
  "name": "Juan Pérez",
  "email": "juan.perez@test.com",
  "role": "student"
}
```

**Documento 2** (Tutor):
```json
{
  "id": "guardian001",
  "name": "María Pérez",
  "email": "maria.perez@test.com",
  "role": "guardian"
}
```

#### Collection: `student_enrollments`

**Documento 1**:
```json
{
  "studentId": "student001",
  "studentName": "Juan Pérez",
  "studentEmail": "juan.perez@test.com",
  "guardianId": "guardian001",
  "enrollmentType": "annual",
  "academicYear": "2025",
  "matriculaAmount": 15000,
  "cuotaAmount": 8000,
  "discount": 0,
  "status": "pending",
  "matriculaPaid": false,
  "createdAt": "2025-01-07T12:00:00Z"
}
```

#### Collection: `courses`

**Documento 1**:
```json
{
  "id": "course001",
  "name": "Matemáticas 101",
  "description": "Curso de matemáticas básicas",
  "price": 5000,
  "active": true,
  "studentCount": 0
}
```

### 3.2 Vía Script (Automático)

Ejecutar el script de seed:

```bash
node test/seed-test-data.js
```

*(Script pendiente de crear - ver Paso 5)*

---

## 🧪 Paso 4: Testear Cloud Functions

### 4.1 Testear Cron Jobs (Manualmente)

**Simular generación de cuotas mensuales:**

```bash
# Llamar función directamente desde terminal
curl -X POST http://localhost:5001/xiwen-app-2026/us-central1/generateMonthlyFees
```

**Verificar resultado:**
1. Ir a http://localhost:4000 → Firestore
2. Buscar colección `monthly_fees`
3. Debería haber una nueva cuota para `student001`

**Simular check de cuotas vencidas:**

```bash
curl -X POST http://localhost:5001/xiwen-app-2026/us-central1/checkOverdueFees
```

### 4.2 Testear Payment Functions (desde Frontend)

**Ejemplo con curl (simular llamada desde frontend):**

```bash
# 1. Crear preferencia de pago de matrícula
curl -X POST http://localhost:5001/xiwen-app-2026/us-central1/createMatriculaPayment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer fake-test-token" \
  -d '{
    "data": {
      "enrollmentId": "ENROLLMENT_DOC_ID",
      "returnUrl": "http://localhost:5173/payment-result"
    }
  }'
```

**Respuesta esperada:**
```json
{
  "result": {
    "success": true,
    "preferenceId": "123456789-abcd-1234-abcd-123456789012",
    "initPoint": "https://www.mercadopago.com.ar/checkout/v1/redirect?pref_id=...",
    "sandboxInitPoint": "https://sandbox.mercadopago.com.ar/checkout/v1/redirect?pref_id=..."
  }
}
```

### 4.3 Testear con Tarjetas de Prueba MercadoPago

Una vez obtenido el `sandboxInitPoint`, abrir en navegador y usar:

**Tarjetas de prueba:**
- **Aprobada**: `5031 7557 3453 0604` | CVV: `123` | Venc: `11/25`
- **Pendiente**: `5031 4332 1540 6351` | CVV: `123` | Venc: `11/25`
- **Rechazada**: `5031 4500 1234 0003` | CVV: `123` | Venc: `11/25`

**Email de prueba:** `test_user_123@testuser.com`
**CPF/CUIL:** `12345678909`

### 4.4 Verificar Webhook

Después de completar un pago en el checkout de MercadoPago:

1. MercadoPago enviará notificación a `mercadopagoWebhook`
2. Verificar logs en terminal donde corre `firebase emulators:start`
3. Verificar en Firestore:
   - `student_enrollments` → `matriculaPaid: true`
   - `payments` → nuevo documento con detalles del pago

---

## 📝 Paso 5: Scripts de Testing Automatizados

### 5.1 Script de Seed (Crear datos de prueba)

**Archivo:** `test/seed-test-data.js`

```javascript
const admin = require('firebase-admin');

// Conectar a emulador
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';

admin.initializeApp({ projectId: 'xiwen-app-2026' });
const db = admin.firestore();

async function seedData() {
  console.log('🌱 Seeding test data...');

  // Crear usuarios
  await db.collection('users').doc('student001').set({
    name: 'Juan Pérez',
    email: 'juan.perez@test.com',
    role: 'student'
  });

  await db.collection('users').doc('guardian001').set({
    name: 'María Pérez',
    email: 'maria.perez@test.com',
    role: 'guardian'
  });

  // Crear enrollment
  const enrollmentRef = await db.collection('student_enrollments').add({
    studentId: 'student001',
    studentName: 'Juan Pérez',
    studentEmail: 'juan.perez@test.com',
    guardianId: 'guardian001',
    enrollmentType: 'annual',
    academicYear: '2025',
    matriculaAmount: 15000,
    cuotaAmount: 8000,
    discount: 0,
    status: 'pending',
    matriculaPaid: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  // Crear curso
  await db.collection('courses').doc('course001').set({
    name: 'Matemáticas 101',
    description: 'Curso de matemáticas básicas',
    price: 5000,
    active: true,
    studentCount: 0
  });

  console.log('✅ Test data created successfully!');
  console.log(`   - Enrollment ID: ${enrollmentRef.id}`);

  process.exit(0);
}

seedData().catch(console.error);
```

**Ejecutar:**
```bash
node test/seed-test-data.js
```

### 5.2 Script de Test de Functions

**Archivo:** `test/test-functions.js`

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:5001/xiwen-app-2026/us-central1';

async function testFunctions() {
  console.log('🧪 Testing Cloud Functions...\n');

  // Test 1: Generate Monthly Fees
  console.log('1️⃣ Testing generateMonthlyFees...');
  try {
    const response = await axios.post(`${BASE_URL}/generateMonthlyFees`);
    console.log('✅ Success:', response.data);
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  console.log('\n---\n');

  // Test 2: Check Overdue Fees
  console.log('2️⃣ Testing checkOverdueFees...');
  try {
    const response = await axios.post(`${BASE_URL}/checkOverdueFees`);
    console.log('✅ Success:', response.data);
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  console.log('\n---\n');

  // Más tests...
}

testFunctions().catch(console.error);
```

---

## ✅ Checklist de Testing

Antes de hacer deploy a producción, verificar:

### Funcionalidad:
- [ ] generateMonthlyFees crea cuotas correctamente
- [ ] checkOverdueFees marca cuotas vencidas y calcula recargos
- [ ] createMatriculaPayment genera preferencia MercadoPago
- [ ] createMonthlyFeePayment genera preferencia con late fee
- [ ] createCoursePayment verifica si curso es gratuito
- [ ] applyFamilyDiscount calcula descuentos (20%, 30%)
- [ ] applyScholarship aplica becas correctamente
- [ ] mercadopagoWebhook procesa pagos aprobados
- [ ] mercadopagoWebhook actualiza Firestore correctamente
- [ ] checkSubscriptionStatus verifica status activo/expired
- [ ] getPaymentHistory retorna historial de pagos

### Seguridad:
- [ ] Todas las callable functions verifican autenticación
- [ ] Permisos verificados (student/guardian/admin)
- [ ] Firestore rules impiden escritura directa de pagos
- [ ] Access token MercadoPago no expuesto en cliente

### Logs:
- [ ] Todos los logs usan `functions.logger.*`
- [ ] No hay `console.*` en el código
- [ ] Logs informativos para debugging

---

## 🐛 Troubleshooting

### Error: "MercadoPago access token not configured"

**Solución:** Verificar que `functions/.runtimeconfig.json` existe y tiene el access token correcto.

### Error: "Port 5001 already in use"

**Solución:**
```bash
# Matar proceso en puerto 5001
lsof -ti:5001 | xargs kill -9
```

### Error: "Firebase CLI not found"

**Solución:**
```bash
npm install -g firebase-tools
```

### Emulators no se ven en UI

**Solución:** Verificar que `firebase.json` tiene la sección `emulators` configurada.

---

## 📚 Recursos

- **MercadoPago Docs:** https://www.mercadopago.com.ar/developers/es/docs
- **Firebase Emulators:** https://firebase.google.com/docs/emulator-suite
- **Cloud Functions Testing:** https://firebase.google.com/docs/functions/local-emulator

---

**Última actualización:** 2025-01-07
