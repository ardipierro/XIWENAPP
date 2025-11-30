# 💳 Payment System Setup Guide

Complete setup guide for the XIWEN App student payment system using MercadoPago and Firebase Cloud Functions.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [MercadoPago Setup](#mercadopago-setup)
3. [Firebase Functions Setup](#firebase-functions-setup)
4. [Environment Configuration](#environment-configuration)
5. [Deploy Functions](#deploy-functions)
6. [Testing](#testing)
7. [Production Checklist](#production-checklist)

---

## 1. Prerequisites

### Required Accounts
- ✅ MercadoPago account (Argentina): https://www.mercadopago.com.ar
- ✅ Firebase project with Blaze plan (required for Cloud Functions)
- ✅ Node.js 18+ installed locally

### Required Tools
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (if not done)
firebase init
```

---

## 2. MercadoPago Setup

### Step 1: Create MercadoPago Application

1. Go to https://www.mercadopago.com.ar/developers
2. Click "Mis aplicaciones" → "Crear aplicación"
3. Fill in:
   - **Nombre:** XIWEN App - Pagos Estudiantes
   - **Tipo:** Pagos en línea
   - **Modelo de integración:** Checkout Pro
4. Click "Crear aplicación"

### Step 2: Get Credentials

**⚠️ You'll have 2 sets of credentials: TEST (sandbox) and PRODUCTION**

#### Test/Sandbox Credentials (for development)
1. In your application, go to "Credenciales de prueba"
2. Copy:
   - **Public Key:** `TEST-xxx-xxx-xxx` (for frontend)
   - **Access Token:** `TEST-xxx-xxx-xxx` (for backend)

#### Production Credentials (for live payments)
1. In your application, go to "Credenciales de producción"
2. Copy:
   - **Public Key:** `APP_USR-xxx-xxx-xxx` (for frontend)
   - **Access Token:** `APP_USR-xxx-xxx-xxx` (for backend)

### Step 3: Configure Webhooks

1. In your MercadoPago application, go to "Webhooks"
2. Click "Configurar notificaciones"
3. Add webhook URL:
   ```
   https://YOUR_PROJECT_ID.cloudfunctions.net/mercadopagoWebhook
   ```
4. Select events to receive:
   - ✅ `payment` - Payment notifications
   - ✅ `merchant_order` - Order notifications
5. Save configuration

**Note:** You'll get the exact URL after deploying Firebase Functions (Step 5)

### Step 4: Test Cards (Sandbox Mode)

For testing, use these test cards:

| Card Number | CVV | Expiry | Result |
|-------------|-----|--------|--------|
| `5031 7557 3453 0604` | 123 | 11/25 | Approved |
| `5031 4332 1540 6351` | 123 | 11/25 | Pending |
| `5031 4500 1234 0003` | 123 | 11/25 | Rejected |

**Test user data:**
- Email: `test_user_123@testuser.com`
- CPF/CUIL: `12345678909`

---

## 3. Firebase Functions Setup

### Step 1: Install Dependencies

```bash
cd functions
npm install
```

This will install:
- `firebase-admin` - Firebase SDK
- `firebase-functions` - Cloud Functions
- `mercadopago` - MercadoPago SDK

### Step 2: Configure Functions

The functions are already created in:
- `functions/index.js` - Main entry point
- `functions/studentPayments.js` - Payment logic

---

## 4. Environment Configuration

### Step 1: Configure MercadoPago Access Token

**For TEST/Sandbox:**
```bash
firebase functions:config:set mercadopago.access_token="TEST-xxxxx-xxxxx-xxxxx"
firebase functions:config:set app.webhook_url="https://YOUR_PROJECT_ID.cloudfunctions.net/mercadopagoWebhook"
```

**For PRODUCTION:**
```bash
firebase functions:config:set mercadopago.access_token="APP_USR-xxxxx-xxxxx-xxxxx"
firebase functions:config:set app.webhook_url="https://YOUR_PROJECT_ID.cloudfunctions.net/mercadopagoWebhook"
```

### Step 2: Verify Configuration

```bash
firebase functions:config:get
```

Expected output:
```json
{
  "mercadopago": {
    "access_token": "TEST-xxxxx-xxxxx"
  },
  "app": {
    "webhook_url": "https://your-project.cloudfunctions.net/mercadopagoWebhook"
  }
}
```

### Step 3: Configure Frontend Environment

Create/update `.env` file in project root:

```bash
# MercadoPago Public Key (Frontend)
VITE_MERCADOPAGO_PUBLIC_KEY=TEST-xxxxx-xxxxx-xxxxx

# App URL (for payment redirects)
VITE_APP_URL=http://localhost:5173

# Firebase Function URLs (auto-detected, but can override)
# VITE_FIREBASE_FUNCTIONS_URL=https://YOUR_PROJECT_ID.cloudfunctions.net
```

**For production `.env.production`:**
```bash
VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxx-xxxxx-xxxxx
VITE_APP_URL=https://xiwen.app
```

---

## 5. Deploy Functions

### Step 1: Deploy All Functions

```bash
# Deploy all functions
firebase deploy --only functions
```

Expected output:
```
✔ functions[generateMonthlyFees(us-central1)] Successful create operation.
✔ functions[checkOverdueFees(us-central1)] Successful create operation.
✔ functions[createMatriculaPayment(us-central1)] Successful create operation.
✔ functions[createMonthlyFeePayment(us-central1)] Successful create operation.
✔ functions[createCoursePayment(us-central1)] Successful create operation.
✔ functions[applyFamilyDiscount(us-central1)] Successful create operation.
✔ functions[applyScholarship(us-central1)] Successful create operation.
✔ functions[mercadopagoWebhook(us-central1)] Successful create operation.
✔ functions[checkSubscriptionStatus(us-central1)] Successful create operation.
✔ functions[getPaymentHistory(us-central1)] Successful create operation.
```

### Step 2: Get Function URLs

```bash
firebase functions:list
```

Copy the `mercadopagoWebhook` URL and add it to MercadoPago (Step 2.3)

### Step 3: Deploy Specific Function (optional)

```bash
# Deploy single function
firebase deploy --only functions:mercadopagoWebhook

# Deploy multiple functions
firebase deploy --only functions:createMatriculaPayment,functions:createMonthlyFeePayment
```

---

## 6. Testing

### Step 1: Test Cron Jobs Locally

```bash
# Start Firebase emulator
cd functions
npm run serve

# In another terminal, test functions
firebase functions:shell

# Inside shell:
> generateMonthlyFees()
> checkOverdueFees()
```

### Step 2: Test Payment Flow (End-to-End)

1. **Create test enrollment:**
   ```javascript
   // In Firestore console
   db.collection('student_enrollments').add({
     studentId: "YOUR_TEST_USER_ID",
     studentName: "Test Student",
     studentEmail: "test@example.com",
     enrollmentType: "annual",
     academicYear: "2025",
     matriculaAmount: 15000,
     cuotaAmount: 8000,
     discount: 0,
     discountReason: "",
     status: "pending",
     matriculaPaid: false,
     enrolledAt: admin.firestore.FieldValue.serverTimestamp(),
     createdAt: admin.firestore.FieldValue.serverTimestamp()
   });
   ```

2. **Test matricula payment:**
   - Login as test student
   - Click "Pagar Matrícula"
   - Should redirect to MercadoPago sandbox
   - Use test card: `5031 7557 3453 0604`
   - Complete payment
   - Should redirect back with success

3. **Verify in Firestore:**
   - `student_enrollments` → `matriculaPaid: true`
   - `payments` → new payment record created

4. **Test monthly fee generation:**
   ```bash
   firebase functions:shell
   > generateMonthlyFees()
   ```

5. **Check Firestore:**
   - `monthly_fees` → new fees created for all active students

### Step 3: Test Webhooks

1. Go to MercadoPago Developer Dashboard
2. "Webhooks" → "Simulador"
3. Select "payment" event
4. Send test notification
5. Check Firebase Functions logs:
   ```bash
   firebase functions:log
   ```

---

## 7. Production Checklist

Before going live, verify:

### MercadoPago
- [ ] Switch to PRODUCTION credentials
- [ ] Webhook URL configured with production function URL
- [ ] Test production webhook (send 1 real payment)
- [ ] Verify business info in MercadoPago account

### Firebase
- [ ] Blaze plan enabled (required for Cloud Functions)
- [ ] Production MercadoPago access token configured
- [ ] All functions deployed successfully
- [ ] Functions logs show no errors
- [ ] Firestore security rules configured (see `FIRESTORE_COLLECTIONS.md`)

### Frontend
- [ ] `.env.production` configured with production keys
- [ ] Payment redirect URLs use production domain
- [ ] Error handling implemented
- [ ] Loading states implemented
- [ ] Success/failure pages created

### Cron Jobs
- [ ] `generateMonthlyFees` scheduled correctly (1st of month, 00:00 AM)
- [ ] `checkOverdueFees` scheduled correctly (daily, 2:00 AM)
- [ ] Time zone configured: `America/Argentina/Buenos_Aires`

### Testing
- [ ] End-to-end test with real card (small amount)
- [ ] Webhook receives notifications
- [ ] Payment records created in Firestore
- [ ] Student access granted correctly
- [ ] Refund process tested (if applicable)

### Monitoring
- [ ] Firebase Functions monitoring enabled
- [ ] Set up alerts for function errors
- [ ] Set up alerts for webhook failures
- [ ] MercadoPago email notifications configured

---

## 🔧 Common Issues & Solutions

### Issue: Function deployment fails

**Solution:**
```bash
# Check Node version (must be 18)
node --version

# Reinstall dependencies
cd functions
rm -rf node_modules package-lock.json
npm install

# Deploy again
firebase deploy --only functions
```

### Issue: Webhook not receiving notifications

**Possible causes:**
1. Webhook URL incorrect in MercadoPago
2. Function not deployed
3. MercadoPago access token invalid

**Solution:**
```bash
# Verify function URL
firebase functions:list | grep webhook

# Test function manually
curl -X POST https://YOUR_PROJECT.cloudfunctions.net/mercadopagoWebhook?topic=payment&id=123

# Check logs
firebase functions:log --only mercadopagoWebhook
```

### Issue: Payment approved but student access not granted

**Possible causes:**
1. Webhook not processed
2. Metadata missing in payment

**Solution:**
```bash
# Check webhook logs
firebase functions:log --only mercadopagoWebhook

# Check payment record in Firestore
# Should have: type, userId, enrollmentId/feeId/courseId

# Manually grant access if needed (in Firestore console)
```

### Issue: Cron job not running

**Possible causes:**
1. Time zone incorrect
2. Schedule syntax error

**Solution:**
```bash
# View cron job status
firebase functions:list | grep Monthly

# Check logs for manual execution
firebase functions:shell
> generateMonthlyFees()

# Verify schedule in functions/studentPayments.js
```

---

## 📊 Cost Estimates (Firebase Blaze Plan)

### Firebase Cloud Functions Pricing

**Free tier (monthly):**
- 2M invocations
- 400K GB-seconds
- 200K CPU-seconds

**After free tier:**
- $0.40 per million invocations
- $0.0000025 per GB-second
- $0.0000100 per GHz-second

**Estimated monthly cost for 500 students:**
- Webhook calls: ~1,000/month → FREE
- Cron jobs: ~60/month → FREE
- Payment creation: ~2,000/month → FREE
- **Total: $0 - $5/month**

### MercadoPago Pricing (Argentina)

- **Credit card:** 3.99% + IVA per transaction
- **Debit card:** 2.59% + IVA per transaction
- **No monthly fees**
- **No setup fees**

**Example:**
- Payment: $8,000 ARS
- Fee: ~$400 ARS (5%)
- **You receive: ~$7,600 ARS**

---

## 📞 Support

### MercadoPago Support
- Email: developers@mercadopago.com
- Docs: https://www.mercadopago.com.ar/developers/es/docs
- Status: https://status.mercadopago.com/

### Firebase Support
- Docs: https://firebase.google.com/docs/functions
- Support: https://firebase.google.com/support
- Stack Overflow: firebase tag

---

## 🔗 Useful Links

- **MercadoPago Developer Dashboard:** https://www.mercadopago.com.ar/developers
- **MercadoPago SDK Docs:** https://github.com/mercadopago/sdk-nodejs
- **Firebase Functions Docs:** https://firebase.google.com/docs/functions
- **Firestore Security Rules:** https://firebase.google.com/docs/firestore/security/get-started
- **Cron Expression Builder:** https://crontab.guru/

---

**Last updated:** 2025-11-07
**Version:** 1.0.0
**Status:** ✅ Ready for production
