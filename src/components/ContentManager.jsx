import { useState, useEffect } from 'react';
import { getContentByTeacher, deleteContent } from '../firebase/content';

function ContentManager({ user }) {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, lesson, reading, video, link
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadContents();
  }, [user]);

  const loadContents = async () => {
    setLoading(true);
    const data = await getContentByTeacher(user.uid);
    setContents(data);
    setLoading(false);
  };

  const handleDelete = async (contentId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este contenido?')) {
      const result = await deleteContent(contentId);
      if (result.success) {
        setContents(contents.filter(c => c.id !== contentId));
      } else {
        alert('Error al eliminar el contenido');
      }
    }
  };

  const filteredContents = contents.filter(content => {
    const matchesFilter = filter === 'all' || content.type === filter;
    const matchesSearch = content.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         content.body?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getTypeIcon = (type) => {
    const icons = {
      lesson: '📖',
      reading: '📚',
      video: '🎥',
      link: '🔗'
    };
    return icons[type] || '📄';
  };

  const getTypeLabel = (type) => {
    const types = {
      lesson: 'Lección',
      reading: 'Lectura',
      video: 'Video',
      link: 'Enlace'
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="spinner"></div>
        <p className="ml-4 text-gray-600 dark:text-gray-300">Cargando contenido...</p>
      </div>
    );
  }

  return (
    <div className="content-manager">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Gestión de Contenido</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {contents.length} contenido{contents.length !== 1 ? 's' : ''} creado{contents.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button className="btn btn-primary">
          + Crear Nuevo Contenido
        </button>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Buscar por título o contenido..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input"
            />
          </div>

          {/* Filtro por tipo */}
          <div className="w-full md:w-64">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input"
            >
              <option value="all">Todos los tipos</option>
              <option value="lesson">Lección</option>
              <option value="reading">Lectura</option>
              <option value="video">Video</option>
              <option value="link">Enlace</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Contenido */}
      {filteredContents.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {contents.length === 0 ? 'No hay contenido creado' : 'No se encontró contenido'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {contents.length === 0
              ? 'Crea tu primer contenido para empezar'
              : 'Intenta con otros filtros de búsqueda'}
          </p>
          {contents.length === 0 && (
            <button className="btn btn-primary">
              Crear Primer Contenido
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredContents.map((content) => (
            <div key={content.id} className="card hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-3xl">{getTypeIcon(content.type)}</span>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                      {content.title || 'Sin título'}
                    </h3>
                    <span className="badge badge-info">
                      {getTypeLabel(content.type)}
                    </span>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {content.body || 'Sin contenido'}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                    {content.courseId && (
                      <span>📚 Curso asignado</span>
                    )}
                    {content.order !== undefined && (
                      <span>📊 Orden: {content.order}</span>
                    )}
                    {content.createdAt && (
                      <span>📅 {new Date(content.createdAt.seconds * 1000).toLocaleDateString('es-AR')}</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => console.log('Editar', content.id)}
                  >
                    ✏️ Editar
                  </button>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => console.log('Ver', content.id)}
                  >
                    👁️ Ver
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(content.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ContentManager;
