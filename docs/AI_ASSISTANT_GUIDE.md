# 🤖 Guía del Asistente de IA - XIWENAPP

## 📋 Índice
1. [Introducción](#introducción)
2. [Características](#características)
3. [Cómo Usar](#cómo-usar)
4. [Consultas Disponibles](#consultas-disponibles)
5. [Comandos de Voz](#comandos-de-voz)
6. [Arquitectura Técnica](#arquitectura-técnica)
7. [Configuración](#configuración)
8. [Limitaciones y Futuras Mejoras](#limitaciones-y-futuras-mejoras)

---

## 🎯 Introducción

El **Asistente de IA** es un sistema conversacional inteligente integrado en XIWENAPP que permite a administradores, profesores y estudiantes realizar consultas sobre la plataforma en lenguaje natural, tanto por texto como por voz.

### ✨ ¿Qué puede hacer?

- 📚 **Consultar información** sobre estudiantes, tareas y rendimiento
- 💰 **Verificar pagos** vencidos y próximos
- 🎯 **Detectar estudiantes en riesgo** de abandono o con bajo rendimiento
- ✍️ **Generar contenido educativo** automáticamente
- 🎤 **Comandos de voz** para consultas manos libres

---

## 🚀 Características

### 1. **Análisis de Lenguaje Natural**
El asistente entiende consultas en español coloquial y extrae la intención del usuario.

**Ejemplos:**
- "¿Cuántos alumnos no entregaron la tarea de esta semana?"
- "Muéstrame los estudiantes con bajo rendimiento"
- "¿Quiénes deben pagar esta semana?"

### 2. **Comandos de Voz (Web Speech API)**
Presiona el botón del micrófono y habla directamente. El sistema transcribirá tu voz y procesará la consulta automáticamente.

**Requisitos:**
- Navegador compatible (Chrome, Edge, Safari)
- Permisos de micrófono habilitados
- Conexión a internet estable

### 3. **Sugerencias Inteligentes**
El asistente proporciona sugerencias contextuales según el rol del usuario.

### 4. **Interfaz Flotante**
Widget discreto que aparece en la esquina inferior derecha de todos los dashboards.

---

## 📖 Cómo Usar

### Paso 1: Abrir el Asistente
Haz clic en el **ícono flotante** (⭐ Sparkles) en la esquina inferior derecha de tu dashboard.

### Paso 2: Elegir Modo de Interacción

#### **Modo Texto:**
1. Escribe tu consulta en el campo de texto
2. Presiona Enter o el botón **Enviar** (icono de avión)
3. Espera la respuesta del asistente

#### **Modo Voz:**
1. Presiona el botón del **micrófono** 🎤
2. Habla claramente tu consulta
3. El sistema transcribirá y procesará automáticamente

### Paso 3: Revisar Respuestas
El asistente mostrará:
- **Resumen textual** de los resultados
- **Lista detallada** de datos (hasta 5 items visibles)
- **Indicador de cantidad** si hay más resultados

---

## 🔍 Consultas Disponibles

### 📚 **Sobre Estudiantes y Tareas**

#### Tareas No Entregadas
```
"¿Cuántos alumnos no entregaron la tarea de esta semana?"
"Muéstrame quiénes no han entregado tareas"
```
**Respuesta:** Lista de estudiantes con tareas pendientes

#### Bajo Rendimiento
```
"¿Qué estudiantes tienen bajo rendimiento?"
"Muéstrame alumnos con más de 3 errores en las tareas"
"¿Quiénes tienen promedio menor a 60%?"
```
**Respuesta:** Lista de estudiantes con promedio bajo (< 60%)

#### Estudiantes en Riesgo
```
"¿Qué alumnos están en riesgo de abandonar?"
"Muéstrame estudiantes inactivos"
```
**Respuesta:** Estudiantes que:
- No han entregado tareas en 2 semanas
- Tienen rendimiento < 50%

---

### 💰 **Sobre Pagos y Créditos**

#### Pagos Vencidos
```
"¿Cuántos pagos están vencidos?"
"¿Qué estudiantes están atrasados con los pagos?"
"Muéstrame deudores"
```
**Respuesta:** Lista de pagos pendientes con días de atraso

#### Pagos Próximos
```
"¿Quiénes deben pagar esta semana?"
"¿Cuántos pagos vencen pronto?"
```
**Respuesta:** Pagos que vencen en los próximos 7 días

#### Créditos Bajos
```
"¿Qué estudiantes tienen pocos créditos?"
"Muéstrame alumnos con menos de 2 créditos"
```
**Respuesta:** Estudiantes con créditos disponibles < 2

---

### ✨ **Generación de Contenido** *(Próximamente)*

#### Crear Tareas
```
"Crea una tarea de gramática HSK 3 para el grupo B, entrega el viernes"
"Genera una tarea de vocabulario nivel básico para mañana"
```

#### Generar Ejercicios
```
"Genera 5 ejercicios de nivel intermedio sobre verbos"
"Crea ejercicios de comprensión lectora para principiantes"
```

---

## 🎤 Comandos de Voz

### **Requisitos del Navegador**

| Navegador | Soporte | Notas |
|-----------|---------|-------|
| Google Chrome | ✅ Completo | Mejor compatibilidad |
| Microsoft Edge | ✅ Completo | Basado en Chromium |
| Safari (macOS/iOS) | ✅ Completo | Requiere iOS 14.3+ |
| Firefox | ⚠️ Limitado | Soporte experimental |
| Opera | ✅ Completo | Basado en Chromium |

### **Consejos para Mejor Reconocimiento**

1. **Habla claramente** y a ritmo normal
2. **Evita ruido de fondo** excesivo
3. **Sé específico** en tus consultas
4. **Usa frases completas** (no solo palabras sueltas)

### **Ejemplo de Uso con Voz**

1. Click en 🎤
2. Di: *"Muéstrame los alumnos que no entregaron tareas esta semana"*
3. El asistente responde automáticamente

---

## 🏗️ Arquitectura Técnica

### **Servicios Implementados**

```
src/services/
├── SpeechToTextService.js       # Reconocimiento de voz (Web Speech API)
├── QueryAnalyzerService.js      # Análisis de intenciones con IA
├── StudentAnalyticsService.js   # Consultas de estudiantes y tareas
├── PaymentAnalyticsService.js   # Consultas de pagos
└── AIAssistantService.js        # Orquestador principal
```

### **Componentes UI**

```
src/components/
└── AIAssistantWidget.jsx        # Widget flotante del asistente
```

### **Flujo de Procesamiento**

```
Usuario → Voz/Texto
    ↓
SpeechToTextService (si es voz)
    ↓
QueryAnalyzerService (analiza intención con IA)
    ↓
AIAssistantService (ejecuta acción)
    ↓
StudentAnalyticsService / PaymentAnalyticsService
    ↓
Respuesta al usuario
```

---

## ⚙️ Configuración

### **Requisitos Previos**

1. **Proveedor de IA configurado** en Admin → AI Config
   - OpenAI (GPT-4)
   - Claude (Anthropic)
   - Gemini (Google)
   - Grok (xAI)

2. **Permisos de micrófono** habilitados en el navegador (para comandos de voz)

### **Verificar Configuración**

1. Ve a **Admin Dashboard** → **AI Config**
2. Asegúrate de tener al menos un provider habilitado
3. Verifica que tenga API key configurada

---

## 📊 Roles y Permisos

| Rol | Consultas Disponibles |
|-----|----------------------|
| **Admin** | ✅ Todas (estudiantes, pagos, análisis, generación) |
| **Teacher** | ✅ Estudiantes, tareas, generación de contenido |
| **Student** | 🔜 Próximamente (mis tareas, mi progreso) |

---

## ⚠️ Limitaciones y Futuras Mejoras

### **Limitaciones Actuales**

1. **Web Speech API:**
   - Requiere conexión a internet
   - Soporte variable según navegador
   - Solo funciona en HTTPS (producción)

2. **Consultas Soportadas:**
   - Limitado a consultas predefinidas
   - No responde preguntas generales fuera del contexto de XIWENAPP

3. **Idioma:**
   - Solo español por ahora

### **🚀 Roadmap - Próximas Mejoras**

#### **Fase 2: Comandos Avanzados** (En desarrollo)
- ✅ Crear tareas por voz
- ✅ Asignar contenido a grupos
- ✅ Generar ejercicios personalizados

#### **Fase 3: Análisis Avanzado** (Planificado)
- 📊 Dashboard de insights automáticos
- 📧 Alertas proactivas por email
- 📈 Predicciones de rendimiento
- 🎯 Recomendaciones personalizadas

#### **Fase 4: Multimodal** (Futuro)
- 🎤 Whisper API (mejor transcripción)
- 🗣️ Text-to-Speech (respuestas habladas)
- 📸 Análisis de imágenes (tareas)
- 🌐 Soporte multiidioma

---

## 🐛 Solución de Problemas

### **El micrófono no funciona**

1. Verifica permisos del navegador
2. Asegúrate de estar en HTTPS
3. Prueba con Chrome/Edge
4. Revisa que tu micrófono esté conectado

### **El asistente no entiende mi consulta**

1. Reformula usando palabras clave:
   - "alumnos", "tareas", "pagos", "vencidos"
2. Prueba con una consulta sugerida
3. Sé más específico en tu pregunta

### **No aparece el widget flotante**

1. Verifica que estés en un dashboard (Admin/Teacher/Student)
2. Recarga la página
3. Revisa la consola del navegador (F12) por errores

---

## 📞 Soporte

Si tienes problemas o sugerencias:

1. **Reporta bugs** en GitHub Issues
2. **Consulta documentación** en `/docs`
3. **Contacta al equipo** de desarrollo

---

## 📝 Changelog

### **v1.0.0 - Prototipo Inicial** (2025-01-11)

**Implementado:**
- ✅ Widget flotante en dashboards
- ✅ Comandos de voz con Web Speech API
- ✅ Consultas sobre estudiantes (tareas no entregadas, bajo rendimiento, en riesgo)
- ✅ Consultas sobre pagos (vencidos, próximos)
- ✅ Análisis de intenciones con IA
- ✅ Sugerencias contextuales por rol

**En desarrollo:**
- 🔜 Creación de tareas por voz
- 🔜 Generación de contenido educativo
- 🔜 Dashboard de insights

---

**¡Disfruta del Asistente de IA de XIWENAPP!** 🎉

*Generated with ❤️ by Claude Code*
