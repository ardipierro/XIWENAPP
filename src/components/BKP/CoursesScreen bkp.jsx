import { useState, useEffect } from 'react';
import { loadCourses, createCourse } from '../firebase/firestore';

function CoursesScreen({ user, userRole, onSelectCourse, onBack }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCourseTitle, setNewCourseTitle] = useState('');
  const [newCourseDesc, setNewCourseDesc] = useState('');

  useEffect(() => {
    loadAllCourses();
  }, []);

  const loadAllCourses = async () => {
    setLoading(true);
    const loadedCourses = await loadCourses();
    setCourses(loadedCourses);
    setLoading(false);
  };

  const handleCreateCourse = async () => {
    if (!newCourseTitle.trim()) return;
    const id = await createCourse({
      title: newCourseTitle,
      description: newCourseDesc,
      teacherId: user.uid
    });
    if (id) {
      setNewCourseTitle('');
      setNewCourseDesc('');
      loadAllCourses();
    }
  };

  if (loading) return <div>Cargando cursos...</div>;

  return (
    <div>
      <h2>Cursos</h2>
      {/* Form para crear (solo teacher/admin) */}
      {(userRole === 'teacher' || userRole === 'admin') && (
        <div>
          <input 
            value={newCourseTitle} 
            onChange={e => setNewCourseTitle(e.target.value)} 
            placeholder="Título del curso" 
          />
          <textarea 
            value={newCourseDesc} 
            onChange={e => setNewCourseDesc(e.target.value)} 
            placeholder="Descripción" 
          />
          <button onClick={handleCreateCourse}>Crear Curso</button>
        </div>
      )}

      {/* Lista de cursos */}
      <ul>
        {courses.map(course => (
          <li key={course.id}>
            {course.title} - {course.description}
            <button onClick={() => onSelectCourse(course.id)}>Ver Lecciones</button>
          </li>
        ))}
      </ul>

      <button onClick={onBack}>Volver</button>
    </div>
  );
}

export default CoursesScreen;