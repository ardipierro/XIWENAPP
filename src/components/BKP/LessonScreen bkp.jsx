import { useState, useEffect } from 'react';
import { getLesson, addLesson } from '../firebase/firestore';

function LessonScreen({ courseId, lessonId, onBack, onComplete }) {
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonType, setNewLessonType] = useState('text');
  const [newLessonContent, setNewLessonContent] = useState('');

  useEffect(() => {
    if (lessonId) loadLesson();
  }, [lessonId]);

  const loadLesson = async () => {
    setLoading(true);
    const data = await getLesson(lessonId);
    setLesson(data);
    setLoading(false);
  };

  const handleAddLesson = async () => {
    if (!newLessonTitle.trim()) return;
    const id = await addLesson(courseId, {
      title: newLessonTitle,
      type: newLessonType,
      content: newLessonContent
    });
    if (id) {
      setNewLessonTitle('');
      setNewLessonType('text');
      setNewLessonContent('');
      // Refresh o notify
    }
  };

  if (loading) return <div>Cargando lección...</div>;

  return (
    <div>
      <h2>Lección: {lesson ? lesson.title : 'Nueva'}</h2>
      {lesson ? (
        <div>
          <p>Tipo: {lesson.type}</p>
          <p>Contenido: {lesson.content}</p>
          <button onClick={() => onComplete(courseId, lesson.id)}>Completar</button>
        </div>
      ) : (
        <div>
          <input 
            value={newLessonTitle} 
            onChange={e => setNewLessonTitle(e.target.value)} 
            placeholder="Título de lección" 
          />
          <select value={newLessonType} onChange={e => setNewLessonType(e.target.value)}>
            <option value="text">Texto</option>
            <option value="video">Video</option>
            <option value="quiz">Quiz</option>
          </select>
          <textarea 
            value={newLessonContent} 
            onChange={e => setNewLessonContent(e.target.value)} 
            placeholder="Contenido" 
          />
          <button onClick={handleAddLesson}>Agregar Lección</button>
        </div>
      )}
      <button onClick={onBack}>Volver a Cursos</button>
    </div>
  );
}

export default LessonScreen;