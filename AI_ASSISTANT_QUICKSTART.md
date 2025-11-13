# 🤖 Dashboard AI Assistant - Quick Start

## ¿Qué es esto?

Un asistente de IA **súper inteligente** que:

✅ Conoce **todos tus datos reales** (cursos, estudiantes, tareas)
✅ Responde con **números exactos y actualizados**
✅ Usa **Claude Sonnet 4.5** (el mejor modelo de IA actual)
✅ Aparece como **widget flotante** en el dashboard

---

## 🚀 Cómo activarlo (3 pasos)

### 1️⃣ Crear API Key de Claude

1. Ir a: https://console.anthropic.com/settings/keys
2. Click en **"Create Key"**
3. Copiar la key (empieza con `sk-ant-...`)

### 2️⃣ Configurar en Firebase

```bash
firebase functions:secrets:set CLAUDE_API_KEY
# Pegar tu API key cuando te lo pida
```

### 3️⃣ Deploy

```bash
cd functions
npm install
firebase deploy --only functions:dashboardAssistant
```

**¡Listo!** 🎉

---

## 💬 Cómo usarlo

1. Entrar al dashboard de teacher o admin
2. Click en el botón flotante (⚡ abajo a la derecha)
3. Hacer preguntas como:

**Ejemplos:**
- "¿Cuántos estudiantes tengo en total?"
- "¿Quiénes no entregaron tareas esta semana?"
- "¿Qué estudiantes tienen bajo rendimiento?"
- "¿Cuántos ejercicios de gramática tengo disponibles?"

El asistente responde con **datos reales** de tu cuenta.

---

## 🎯 Ejemplos de Preguntas

### Para Profesores

| Pregunta | Qué hace |
|----------|----------|
| ¿Cuántos alumnos tengo? | Cuenta tus estudiantes en todos los cursos |
| ¿Quién no entregó la tarea? | Lista estudiantes sin entregas |
| ¿Qué cursos tengo activos? | Lista tus cursos y número de alumnos |
| ¿Cuántas entregas debo revisar? | Cuenta submissions pendientes |

### Para Admins

| Pregunta | Qué hace |
|----------|----------|
| ¿Cuántos cursos hay en total? | Stats globales de cursos |
| ¿Qué pagos están vencidos? | Lista pagos pendientes |
| Dame un resumen general | Overview completo de la plataforma |

---

## 🏗️ Qué hace por detrás

```
Usuario: "¿Cuántos estudiantes tengo?"
   ↓
Frontend llama a Cloud Function
   ↓
Cloud Function consulta Firestore:
  - Tus cursos
  - Estudiantes inscritos
  - Tareas recientes
  - Stats actualizadas
   ↓
Envía todo ese contexto a Claude
   ↓
Claude responde con datos precisos
   ↓
Usuario ve: "Tienes 23 estudiantes en 2 cursos"
```

**Tiempo total:** 2-4 segundos

---

## 💰 ¿Cuánto cuesta?

**Claude Sonnet 4.5:**
- ~$0.015 USD por consulta
- Si haces 100 consultas/día: ~$1.50 USD/día
- Si haces 20 consultas/día: ~$0.30 USD/día

**Alternativa económica: Gemini**
```bash
firebase functions:secrets:set GEMINI_API_KEY
```
- Gratis hasta 1500 queries/día
- Muy rápido y económico

---

## 🔍 Verificar que funciona

### Ver logs en tiempo real

```bash
firebase functions:log --only dashboardAssistant
```

### Probar en la app

1. Login en XIWENAPP
2. Ir al dashboard
3. Click en el botón flotante
4. Escribir: "¿Cuántos estudiantes tengo?"
5. Debería responder en 2-4 segundos

---

## 📁 Archivos principales

| Archivo | Qué hace |
|---------|----------|
| `functions/dashboardAssistant.js` | Backend con acceso a Firestore |
| `src/services/DashboardAssistantService.js` | Servicio frontend |
| `src/components/DashboardAssistant.jsx` | Widget UI |

---

## 🐛 Solución de Problemas

### ❌ Error: "API key not configured"

```bash
firebase functions:secrets:set CLAUDE_API_KEY
firebase deploy --only functions:dashboardAssistant
```

### ❌ El botón no aparece

Verificar en `TeacherDashboard.jsx` o `AdminDashboard.jsx`:
```javascript
import DashboardAssistant from './DashboardAssistant';

// Al final del componente:
<DashboardAssistant />
```

### ❌ Respuestas lentas (>10 seg)

Normal si tienes muchos estudiantes. Ver **DASHBOARD_ASSISTANT.md** para optimizaciones.

---

## 🎯 Próximos Pasos

### Fase 2: Acciones Ejecutables
El asistente podrá:
- Crear tareas automáticamente
- Asignar ejercicios
- Enviar mensajes a estudiantes

### Fase 3: Memoria Conversacional
- Recordar conversaciones anteriores
- Referencias: "¿y los de HSK 4?" (sin repetir contexto)

### Fase 4: Voz
- Hablar con el asistente
- Respuestas en audio

---

## 📚 Docs Completas

- **DASHBOARD_ASSISTANT.md** - Arquitectura detallada
- **DEPLOY_ASSISTANT.md** - Guía completa de deploy
- Este archivo - Quick start

---

## ✅ Checklist

- [ ] API key de Claude configurada
- [ ] Function deployeada
- [ ] Botón visible en dashboard
- [ ] Primera pregunta respondida correctamente
- [ ] Respuesta basada en datos reales

**¡Felicidades! Tu asistente IA está funcionando.** 🎉

---

**Creado:** Enero 2025
**Versión:** 1.0.0
