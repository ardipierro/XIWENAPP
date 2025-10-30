# XIWENAPP 📚

Aplicación educativa web para la gestión de cursos, estudiantes y lecciones con sistema de roles para profesores y estudiantes.

## 🚀 Características

- **Sistema de autenticación** con roles diferenciados (Profesor/Estudiante)
- **Dashboard de Profesor**: Gestión completa de estudiantes, cursos y lecciones
- **Dashboard de Estudiante**: Visualización de cursos asignados y progreso
- **Gestión de cursos**: Creación y administración de contenido educativo
- **Sistema de lecciones**: Organización estructurada del material de aprendizaje
- **Interfaz moderna y responsiva** con Tailwind CSS
- **Base de datos en tiempo real** con Firebase Firestore

## 🛠️ Tecnologías

- **Frontend**: React 18 + Vite
- **Estilos**: Tailwind CSS
- **Base de datos**: Firebase Firestore
- **Autenticación**: Firebase Auth
- **Lenguaje**: JavaScript (ES6+)

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
   
   Luego edita `.env` con tus credenciales de Firebase:
   ```env
   VITE_FIREBASE_API_KEY=tu-api-key
   VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=tu-project-id
   VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=tu-sender-id
   VITE_FIREBASE_APP_ID=tu-app-id
   ```

4. **Iniciar el servidor de desarrollo**
   ```bash
   npm run dev
   ```

5. **Abrir en el navegador**
   
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
│   ├── components/         # Componentes React
│   │   ├── SetupScreen.jsx
│   │   ├── StudentDashboard.jsx
│   │   ├── StudentLogin.jsx
│   │   ├── StudentManager.jsx
│   │   ├── TeacherDashboard.jsx
│   │   └── ...
│   ├── firebase/          # Configuración de Firebase
│   ├── App.jsx            # Componente principal
│   └── main.jsx           # Punto de entrada
├── public/                # Archivos estáticos
├── index.html             # HTML principal
├── vite.config.js         # Configuración de Vite
├── tailwind.config.js     # Configuración de Tailwind
└── package.json           # Dependencias del proyecto
```

## 🔐 Configuración de Firebase

Para configurar Firebase en tu proyecto:

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilita Firestore Database
3. Habilita Authentication (Email/Password)
4. Copia las credenciales de configuración al archivo `.env`

## 👥 Roles de Usuario

### Profesor
- Gestión de estudiantes (crear, editar, eliminar)
- Creación y administración de cursos
- Asignación de cursos a estudiantes
- Gestión de contenido educativo

### Estudiante
- Visualización de cursos asignados
- Acceso a lecciones y materiales
- Seguimiento de progreso

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
