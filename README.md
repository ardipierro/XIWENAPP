# XIWENAPP 📚

Aplicación educativa web para la gestión de cursos, estudiantes y lecciones con sistema de roles para profesores y estudiantes.

## 🚀 Características

### 👤 Sistema de Roles
- **Profesor**: Gestión completa de estudiantes, cursos, contenido y ejercicios
- **Estudiante**: Acceso a cursos, lecciones, ejercicios y seguimiento de progreso
- **Administrador**: Panel de administración completo con analytics
- **Tutor/Padre**: Dashboard para seguimiento de estudiantes a cargo

### 📚 Gestión Académica
- **Cursos y contenido**: Creación y administración de material educativo
- **Ejercicios**: 8 tipos diferentes (opción múltiple, verdadero/falso, completar, etc.)
- **Asignaciones**: Sistema de tareas con fechas de entrega y calificaciones
- **Grupos**: Organización de estudiantes y asignación masiva de cursos

### 💳 Sistema de Pagos (MercadoPago Argentina)
- **Matrícula**: Pago único de inscripción anual
- **Cuotas mensuales**: Generación automática y gestión de pagos recurrentes
- **Becas**: Sistema de descuentos y scholarships
- **Descuentos familiares**: 20% segundo hermano, 30% tercero+
- **Panel administrativo**: Dashboard de ingresos y control de pagos
- **Ver documentación**: [PAYMENT_SYSTEM_SETUP.md](./PAYMENT_SYSTEM_SETUP.md) y [FIRESTORE_COLLECTIONS.md](./FIRESTORE_COLLECTIONS.md)

### 🎮 Gamificación
- **Sistema de puntos** y niveles
- **Badges y logros** por completar actividades
- **Racha de días** consecutivos
- **Leaderboard** para motivar a estudiantes

### 📅 Calendario y Organización
- **Vista de calendario** con asignaciones y eventos
- **Fechas de entrega** y recordatorios
- **Integración** con sistema de asignaciones

### 💬 Comunicación
- **Sistema de mensajería** interno entre usuarios
- **Notificaciones** en tiempo real
- **VideoChat** integrado con LiveKit

### 🎨 Interfaz y Diseño
- **100% Tailwind CSS** siguiendo estándares de código
- **Modo oscuro** completo
- **Diseño responsivo** para mobile, tablet y desktop
- **Componentes reutilizables** (Base Components)

## 🛠️ Tecnologías

- **Frontend**: React 18 + Vite 5
- **Estilos**: Tailwind CSS 3.4
- **Base de datos**: Firebase Firestore
- **Autenticación**: Firebase Auth
- **Backend**: Firebase Cloud Functions (Node.js 18)
- **Pagos**: MercadoPago SDK (Argentina)
- **VideoChat**: LiveKit
- **Iconos**: Lucide React
- **Lenguaje**: JavaScript (ES6+)

## 📚 Documentación

### Documentación para Desarrollo
- **[.claude/GUIDE.md](./.claude/GUIDE.md)** - 🚀 **EMPEZAR AQUÍ** - Guía principal del proyecto
- **[.claude/CODING_STANDARDS.md](./.claude/CODING_STANDARDS.md)** - Estándares de código y componentes base
- **[.claude/DESIGN_SYSTEM.md](./.claude/DESIGN_SYSTEM.md)** - Sistema de diseño y responsive
- **[.claude/EXERCISE_BUILDER.md](./.claude/EXERCISE_BUILDER.md)** - Sistema de ejercicios ELE
- **[.claude/CONTENT_SCHEMA.md](./.claude/CONTENT_SCHEMA.md)** - Arquitectura de contenidos
- **[.claude/CHANGELOG.md](./.claude/CHANGELOG.md)** - Historial de cambios en documentación

### Documentación Técnica
- **[PAYMENT_SYSTEM_SETUP.md](./PAYMENT_SYSTEM_SETUP.md)** - Guía completa de configuración del sistema de pagos
- **[FIRESTORE_COLLECTIONS.md](./FIRESTORE_COLLECTIONS.md)** - Esquema de base de datos y colecciones
- **[TestPage Component](./src/components/TestPage.jsx)** - Página de prueba para nuevos componentes

## 📦 Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/ardipierro/XIWENAPP.git
   cd XIWENAPP
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**

   Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:
   ```bash
   cp .env.example .env
   ```

   Luego edita `.env` con tus credenciales de Firebase, MercadoPago y LiveKit:
   ```env
   # Firebase
   VITE_FIREBASE_API_KEY=tu-api-key
   VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=tu-project-id

   # MercadoPago (ver PAYMENT_SYSTEM_SETUP.md)
   VITE_MERCADOPAGO_PUBLIC_KEY=TEST-xxxxx-xxxxx-xxxxx
   VITE_APP_URL=http://localhost:5173

   # LiveKit (opcional, para videochat)
   VITE_LIVEKIT_URL=wss://your-project.livekit.cloud
   ```

4. **Configurar Firebase Functions (para sistema de pagos)**
   ```bash
   cd functions
   npm install

   # Configurar MercadoPago Access Token
   firebase functions:config:set mercadopago.access_token="TEST-xxxxx-xxxxx-xxxxx"

   # Ver guía completa: PAYMENT_SYSTEM_SETUP.md
   ```

5. **Iniciar el servidor de desarrollo**
   ```bash
   npm run dev
   ```

6. **Abrir en el navegador**

   La aplicación estará disponible en `http://localhost:5173`

## 🔧 Scripts Disponibles

- `npm run dev` - Inicia el servidor de desarrollo
- `npm run build` - Genera la versión de producción
- `npm run preview` - Previsualiza la build de producción
- `npm run lint` - Ejecuta el linter para revisar el código

## 📁 Estructura del Proyecto

```
XIWENAPP/
├── src/
│   ├── components/              # Componentes React
│   │   ├── common/              # Componentes base reutilizables
│   │   │   ├── BaseButton.jsx
│   │   │   ├── BaseInput.jsx
│   │   │   ├── BaseModal.jsx
│   │   │   └── BaseSelect.jsx
│   │   ├── AdminDashboard.jsx   # Dashboard administrador
│   │   ├── TeacherDashboard.jsx # Dashboard profesor
│   │   ├── StudentDashboard.jsx # Dashboard estudiante
│   │   ├── GuardianDashboard.jsx # Dashboard tutor/padre
│   │   ├── AssignmentSystem.jsx # Sistema de asignaciones
│   │   ├── GamificationSystem.jsx # Sistema de gamificación
│   │   ├── CalendarView.jsx     # Vista de calendario
│   │   ├── MessagingSystem.jsx  # Sistema de mensajería
│   │   └── ...
│   ├── contexts/            # React Contexts
│   │   └── ThemeContext.jsx # Contexto de tema claro/oscuro
│   ├── firebase/            # Configuración y módulos Firebase
│   │   ├── config.js        # Configuración de Firebase
│   │   ├── courses.js       # CRUD de cursos
│   │   ├── exercises.js     # CRUD de ejercicios
│   │   ├── groups.js        # CRUD de grupos
│   │   ├── content.js       # CRUD de contenido
│   │   └── storage.js       # Firebase Storage
│   ├── App.jsx              # Componente principal
│   ├── main.jsx             # Punto de entrada
│   └── globals.css          # Estilos globales
├── functions/               # Firebase Cloud Functions
│   ├── index.js             # Entry point de functions
│   ├── studentPayments.js   # Sistema de pagos estudiantes
│   └── package.json         # Dependencias de functions
├── public/                  # Archivos estáticos
│   ├── manifest.json        # PWA manifest
│   └── icons/               # Iconos de la app
├── .claude/                 # Documentación del proyecto
│   ├── GUIDE.md             # 🚀 Guía principal (EMPEZAR AQUÍ)
│   ├── CHANGELOG.md         # Historial de cambios
│   ├── CODING_STANDARDS.md  # Estándares de código
│   ├── DESIGN_SYSTEM.md     # Sistema de diseño
│   ├── EXERCISE_BUILDER.md  # Sistema de ejercicios
│   └── CONTENT_SCHEMA.md    # Arquitectura de contenidos
├── firebase.json            # Configuración de Firebase
├── firestore.rules          # Reglas de seguridad Firestore
├── firestore.indexes.json   # Índices de Firestore
├── .env.example             # Variables de entorno ejemplo
├── PAYMENT_SYSTEM_SETUP.md  # Guía de configuración de pagos
├── FIRESTORE_COLLECTIONS.md # Esquema de base de datos
├── vite.config.js           # Configuración de Vite
├── tailwind.config.js       # Configuración de Tailwind
└── package.json             # Dependencias del proyecto
```

## 🔐 Configuración de Firebase

Para configurar Firebase en tu proyecto:

1. **Crear proyecto en [Firebase Console](https://console.firebase.google.com/)**
2. **Habilitar servicios:**
   - Firestore Database
   - Authentication (Email/Password)
   - Cloud Functions (requiere Blaze plan)
   - Storage (para imágenes de cursos)
3. **Copiar credenciales de configuración al archivo `.env`**
4. **Configurar reglas de seguridad:**
   ```bash
   firebase deploy --only firestore:rules
   ```
5. **Para el sistema de pagos, ver:** [PAYMENT_SYSTEM_SETUP.md](./PAYMENT_SYSTEM_SETUP.md)

## 💳 Configuración de MercadoPago

Para habilitar el sistema de pagos de estudiantes:

1. **Crear cuenta en [MercadoPago Argentina](https://www.mercadopago.com.ar/developers)**
2. **Crear aplicación de tipo "Checkout Pro"**
3. **Obtener credenciales TEST para desarrollo**
4. **Configurar Firebase Functions:**
   ```bash
   firebase functions:config:set mercadopago.access_token="TEST-xxxxx"
   ```
5. **Desplegar Cloud Functions:**
   ```bash
   firebase deploy --only functions
   ```
6. **Configurar webhook en MercadoPago dashboard**

**Guía completa:** [PAYMENT_SYSTEM_SETUP.md](./PAYMENT_SYSTEM_SETUP.md)

## 👥 Roles de Usuario

### 👨‍🏫 Profesor
- Gestión completa de estudiantes
- Creación y administración de cursos, contenido y ejercicios
- Asignación de cursos y creación de grupos
- Sistema de asignaciones con calificaciones
- Dashboard de analytics de progreso de estudiantes

### 🎓 Estudiante
- Acceso a cursos asignados y contenido
- Completar ejercicios de 8 tipos diferentes
- Entregar asignaciones y ver calificaciones
- Sistema de gamificación (puntos, niveles, badges)
- Calendario con fechas de entrega
- Mensajería con profesores

### 👨‍💼 Administrador
- Panel completo de administración
- Gestión de usuarios, cursos y contenido
- Dashboard de pagos e ingresos
- Control de matrículas y cuotas mensuales
- Gestión de becas y descuentos familiares
- Analytics completo de la plataforma

### 👪 Tutor/Padre
- Dashboard para seguimiento de estudiantes a cargo
- Ver progreso académico y calificaciones
- Acceso a calendario de asignaciones
- Mensajería con profesores
- Gestión de pagos (matrícula y cuotas)

## 🚧 Estado del Proyecto

Este proyecto está en desarrollo activo. Nuevas características y mejoras se agregan regularmente.

## 📝 Licencia

Este proyecto es de uso privado y educativo.

## 👨‍💻 Autor

**ardipierro** - [GitHub](https://github.com/ardipierro)

## 🤝 Contribuciones

Las contribuciones, issues y feature requests son bienvenidos.

---

⭐ Si este proyecto te resulta útil, considera darle una estrella en GitHub
