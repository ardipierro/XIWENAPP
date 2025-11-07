# 📖 Guía de Migración Manual

Si el script automático no funciona por permisos, puedes hacer la migración manualmente.

## 🔧 Opción 1: Actualizar Reglas de Firestore (Temporal)

1. **Ir a Firebase Console** → Firestore → Rules

2. **Agregar regla temporal** (SOLO para migración):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // ... tus reglas existentes ...

    // TEMPORAL: Permitir escritura en contents para tu usuario
    match /contents/{contentId} {
      allow write: if request.auth != null &&
                   request.auth.token.email == 'TU_EMAIL_ADMIN@ejemplo.com';
    }
  }
}
```

3. **Publicar reglas**

4. **Ejecutar el script**:
```bash
npm run migrate:unified-content
```

5. **IMPORTANTE**: Revertir las reglas después de la migración

---

## 🔧 Opción 2: Usar Firebase Console (Recomendado)

### Paso 1: Exportar datos existentes

1. Ve a **Firebase Console** → **Firestore**
2. Ve a la colección `content`
3. Exporta a JSON manualmente o usa el script de exportación

### Paso 2: Transformar datos

Usa este template para transformar cada documento:

#### De `content` a `contents`:

```javascript
// Documento original en 'content'
{
  id: "abc123",
  title: "Mi Lección",
  type: "lesson",
  body: "...",
  teacherId: "xyz",
  createdAt: Timestamp
}

// Transformado en 'contents'
{
  id: "abc123", // MISMO ID
  title: "Mi Lección",
  type: "lesson", // lesson, reading, video, link
  description: "",
  body: "...",
  metadata: {
    difficulty: null,
    duration: null,
    points: null,
    tags: [],
    language: "es"
  },
  createdBy: "xyz",
  parentCourseIds: [],
  imageUrl: "",
  active: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### De `exercises` a `contents`:

```javascript
// Documento original en 'exercises'
{
  id: "ex001",
  title: "Verbos Irregulares",
  type: "multiple-choice",
  questions: [...],
  difficulty: "intermediate",
  points: 100
}

// Transformado en 'contents'
{
  id: "ex-ex001", // PREFIJO 'ex-'
  title: "Verbos Irregulares",
  type: "exercise",
  contentType: "multiple-choice", // subtipo
  questions: [...],
  metadata: {
    difficulty: "intermediate",
    duration: 15,
    points: 100,
    tags: [],
    language: "es"
  },
  createdBy: "teacherId",
  parentCourseIds: [],
  active: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### De `courses` a `contents`:

```javascript
// Documento original en 'courses'
{
  id: "course001",
  name: "Chino HSK 1",
  description: "...",
  teacherId: "xyz",
  students: [...]
}

// Transformado en 'contents'
{
  id: "co-course001", // PREFIJO 'co-'
  title: "Chino HSK 1",
  type: "course",
  description: "...",
  childContentIds: [], // IDs de contenidos incluidos
  metadata: {
    difficulty: null,
    duration: null,
    points: null,
    tags: [],
    language: "zh"
  },
  createdBy: "xyz",
  imageUrl: "",
  active: true,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Paso 3: Crear documentos manualmente

1. En **Firebase Console** → **Firestore**
2. Crea la colección `contents` si no existe
3. Agrega cada documento transformado manualmente
4. Usa "Add Document" con el ID correspondiente

---

## 🔧 Opción 3: Script con Firebase Admin SDK

Si necesitas migrar muchos documentos, puedo crear un script con Firebase Admin SDK que use credenciales de servicio.

**Requisitos:**
1. Tener una Service Account Key de Firebase
2. Descargar el archivo JSON de credenciales
3. Ejecutar el script en Node.js con acceso al archivo

¿Prefieres que cree este script alternativo?

---

## 🔧 Opción 4: Cloud Function (Más seguro)

Puedo crear una Cloud Function que haga la migración desde Firebase Functions:

```javascript
// functions/migrations/migrateContent.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.migrateToUnifiedContent = functions
  .runWith({ timeoutSeconds: 540 }) // 9 minutos
  .https.onRequest(async (req, res) => {
    // Verificar que solo admins puedan ejecutar
    if (!req.auth || req.auth.token.role !== 'admin') {
      return res.status(403).send('Forbidden');
    }

    // ... lógica de migración ...

    res.json({ success: true, migrated: count });
  });
```

Luego ejecutas:
```bash
firebase deploy --only functions:migrateToUnifiedContent
curl -X POST https://your-region-your-project.cloudfunctions.net/migrateToUnifiedContent
```

---

## 🤔 ¿Qué opción elegir?

- **Opción 1**: Si tienes pocos documentos (< 50) y quieres hacerlo rápido
- **Opción 2**: Si prefieres control total y verificar cada documento
- **Opción 3**: Si tienes muchos documentos (> 50) y acceso a service account
- **Opción 4**: Más seguro, pero requiere deploy de functions

## 📞 Siguiente paso

Dime cuál opción prefieres y te ayudo a completar la migración.
