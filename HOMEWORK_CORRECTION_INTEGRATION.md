# Sistema de Corrección Automática de Tareas - Guía de Integración

## 📋 Descripción

Sistema completo de análisis y corrección automática de tareas escritas usando IA Vision (Claude Sonnet 4.5 o GPT-4 Vision).

## 🎯 Flujo del Sistema

```
1. Estudiante sube imagen de tarea → Firebase Storage
2. Sistema crea documento en homework_reviews (status: processing)
3. Cloud Function se activa automáticamente (Firestore Trigger)
4. IA Vision analiza la imagen:
   - Extrae texto (OCR)
   - Identifica errores (ortografía, gramática, puntuación, vocabulario)
   - Genera correcciones detalladas
   - Sugiere calificación
5. Actualiza documento con resultados (status: completed)
6. Profesor ve análisis en HomeworkReviewPanel
7. Profesor revisa, edita y aprueba
8. Estudiante ve correcciones en StudentFeedbackView
```

## 📦 Archivos Implementados

### Backend
- `src/firebase/homework_reviews.js` - CRUD functions
- `functions/homeworkAnalyzer.js` - Cloud Function con trigger automático
- `functions/index.js` - Export de la función

### Frontend
- `src/components/HomeworkReviewPanel.jsx` - Panel para profesores
- `src/components/StudentFeedbackView.jsx` - Vista para estudiantes
- `src/constants/aiFunctions.js` - Configuración del prompt de IA

### Integración
- `src/firebase/submissions.js` - Función `triggerHomeworkAnalysis()`

## 🔧 Configuración Necesaria

### 1. Habilitar la función de IA

En el dashboard de configuración de IA, habilitar:
- **Función**: `homework_analyzer`
- **Provider**: Claude (recomendado) o OpenAI
- **Modelo**: `claude-sonnet-4-5` o `gpt-4o`

### 2. Desplegar Cloud Function

```bash
cd functions
npm install
firebase deploy --only functions:analyzeHomeworkImage
```

### 3. Configurar Firestore Security Rules

Agregar a `firestore.rules`:

```javascript
match /homework_reviews/{reviewId} {
  // Teachers can read all reviews
  allow read: if isTeacher();

  // Students can only read their own approved reviews
  allow read: if request.auth.uid == resource.data.studentId &&
                 resource.data.teacherReviewed == true;

  // System (Cloud Functions) can write
  allow write: if request.auth == null; // Cloud Functions auth
}
```

## 📚 Guía de Integración

### Para Estudiantes - StudentAssignmentsView.jsx

Actualizar `SubmissionModal` para:

1. **Permitir upload de imágenes**:

```jsx
import { uploadMessageAttachment } from '../firebase/storage';
import { triggerHomeworkAnalysis } from '../firebase/submissions';

// En SubmissionModal
const [imageFiles, setImageFiles] = useState([]);

const handleFileChange = async (e) => {
  const files = Array.from(e.target.files);

  // Filter images
  const images = files.filter(f => f.type.startsWith('image/'));

  if (images.length > 0) {
    setImageFiles(images);
  }
};

const handleSubmit = async () => {
  // ... existing save logic ...

  // Upload images
  const uploadedAttachments = [];
  for (const file of imageFiles) {
    const url = await uploadMessageAttachment(
      file,
      `submissions/${assignment.id}`,
      studentId
    );
    uploadedAttachments.push({
      url,
      filename: file.name,
      type: file.type,
      size: file.size
    });
  }

  // Save submission with attachments
  const result = await save({
    assignmentId: assignment.id,
    studentId,
    content: text,
    attachments: uploadedAttachments,
    status: 'submitted'
  });

  // Trigger AI analysis for images
  if (result.success && uploadedAttachments.length > 0) {
    await triggerHomeworkAnalysis(
      result.id,
      assignment.id,
      studentId,
      uploadedAttachments
    );
  }
};
```

2. **Mostrar feedback cuando esté disponible**:

```jsx
import StudentFeedbackView from './StudentFeedbackView';

// En SubmissionModal, después del feedback del profesor
{isSubmitted && submission && (
  <div className="mt-6">
    <h3 className="text-lg font-semibold mb-3">Corrección Automática</h3>
    <StudentFeedbackView
      submission={submission}
      studentId={studentId}
    />
  </div>
)}
```

### Para Profesores - Vista de Submissions

Crear un componente `TeacherSubmissionView.jsx`:

```jsx
import HomeworkReviewPanel from './HomeworkReviewPanel';

export default function TeacherSubmissionView({ submission, assignment }) {
  const [showReview, setShowReview] = useState(false);

  // Check if submission has image attachments
  const hasImages = submission.attachments?.some(att =>
    att.type.startsWith('image/')
  );

  return (
    <div className="space-y-6">
      {/* Student submission content */}
      <Card>
        <h3 className="font-semibold mb-2">Respuesta del Estudiante</h3>
        <p>{submission.content}</p>

        {/* Attachments */}
        {submission.attachments?.map((att, idx) => (
          <div key={idx}>
            <img src={att.url} alt="Tarea" />
          </div>
        ))}
      </Card>

      {/* AI Review Panel (if images exist) */}
      {hasImages && (
        <>
          <button
            onClick={() => setShowReview(!showReview)}
            className="btn btn-primary"
          >
            {showReview ? 'Ocultar' : 'Ver'} Corrección Automática
          </button>

          {showReview && (
            <HomeworkReviewPanel
              submission={submission}
              onReviewApproved={(review) => {
                console.log('Review approved:', review);
                // Optional: Grade submission automatically
                // gradeSubmission(submission.id, review.suggestedGrade, review.overallFeedback);
              }}
            />
          )}
        </>
      )}

      {/* Manual grading form */}
      <Card>
        <h3 className="font-semibold mb-2">Calificación Manual</h3>
        <input type="number" placeholder="Nota" />
        <textarea placeholder="Comentarios" />
        <button className="btn btn-primary">Calificar</button>
      </Card>
    </div>
  );
}
```

### En AssignmentManager.jsx

Agregar vista de submissions con análisis:

```jsx
import { getSubmissionsByAssignment } from '../firebase/submissions';
import { getPendingReviews } from '../firebase/homework_reviews';

function AssignmentCard({ assignment }) {
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [pendingReviews, setPendingReviews] = useState(0);

  useEffect(() => {
    // Load submissions
    getSubmissionsByAssignment(assignment.id).then(setSubmissions);

    // Count pending reviews
    getPendingReviews().then(reviews => {
      const count = reviews.filter(r => r.assignmentId === assignment.id).length;
      setPendingReviews(count);
    });
  }, [assignment.id]);

  return (
    <Card>
      {/* Assignment info */}
      <h3>{assignment.title}</h3>

      {/* Badge showing pending AI reviews */}
      {pendingReviews > 0 && (
        <Badge color="warning">
          {pendingReviews} correcciones pendientes
        </Badge>
      )}

      <button onClick={() => setShowSubmissions(!showSubmissions)}>
        Ver Entregas ({submissions.length})
      </button>

      {showSubmissions && (
        <div className="mt-4 space-y-4">
          {submissions.map(sub => (
            <TeacherSubmissionView
              key={sub.id}
              submission={sub}
              assignment={assignment}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
```

## 🎨 Personalización

### Modificar el Prompt de Análisis

Editar `src/constants/aiFunctions.js` línea 259+:

```javascript
systemPrompt: `Tu prompt personalizado aquí...`
```

### Cambiar el Provider de IA

En la configuración de IA del dashboard:
- Claude Sonnet 4.5 → Mejor análisis de imágenes manuscritas
- GPT-4 Vision → Alternativa compatible

### Ajustar Criterios de Calificación

Editar el prompt para cambiar los porcentajes:
```
- Gramática (40%)
- Ortografía (20%)
- Vocabulario (20%)
- Estructura (20%)
```

## 🧪 Testing

### Test Manual

1. Como estudiante, crear submission con imagen
2. Ver en Firestore que se crea documento en `homework_reviews`
3. Ver logs de Cloud Function en Firebase Console
4. Verificar que el documento se actualiza con status `completed`
5. Como profesor, ver el HomeworkReviewPanel
6. Aprobar la revisión
7. Como estudiante, ver el StudentFeedbackView

### Test de Integración

```javascript
// En consola de Firebase
const { triggerHomeworkAnalysis } = require('./src/firebase/submissions');

triggerHomeworkAnalysis(
  'submission-id',
  'assignment-id',
  'student-id',
  [{
    url: 'https://storage.googleapis.com/...',
    type: 'image/jpeg',
    filename: 'tarea.jpg'
  }]
);
```

## 🔍 Monitoring

### Ver análisis en proceso

```javascript
import { subscribeToPendingReviews } from '../firebase/homework_reviews';

useEffect(() => {
  const unsubscribe = subscribeToPendingReviews((reviews) => {
    console.log('Pending reviews:', reviews);
  });
  return unsubscribe;
}, []);
```

### Ver logs de Cloud Function

```bash
firebase functions:log --only analyzeHomeworkImage
```

## 🚀 Próximos Pasos

1. ✅ Sistema de corrección automática funcionando
2. 📊 Dashboard de estadísticas de errores comunes
3. 🎯 Recomendaciones personalizadas por estudiante
4. 📈 Tracking de progreso a lo largo del tiempo
5. 🤖 Sugerencias de ejercicios basadas en errores

## 📞 Soporte

Si hay errores:
1. Verificar que la Cloud Function está desplegada
2. Revisar logs en Firebase Console
3. Verificar que la API key de Claude/OpenAI está configurada
4. Comprobar que la función `homework_analyzer` está habilitada en AI Config

## 🎉 Resultado Final

Los profesores reciben:
- ✅ Análisis automático de todas las tareas con imágenes
- ✅ Conteo de errores por categoría
- ✅ Correcciones detalladas con explicaciones
- ✅ Calificación sugerida
- ✅ Posibilidad de editar antes de aprobar

Los estudiantes reciben:
- ✅ Feedback detallado y constructivo
- ✅ Explicaciones pedagógicas de cada error
- ✅ Visualización clara de áreas de mejora
- ✅ Recomendaciones para mejorar

¡El sistema está listo para usar! 🚀
