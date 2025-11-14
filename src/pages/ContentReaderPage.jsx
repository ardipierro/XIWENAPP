/**
 * @fileoverview Content Reader Page
 * Página para leer contenido educativo con herramientas de anotación
 * @module pages/ContentReaderPage
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react';
import ContentReader from '../components/ContentReader';
import { getContentById } from '../firebase/content';
import useAuth from '../hooks/useAuth';
import logger from '../utils/logger';

/**
 * Content Reader Page
 * Página principal para leer contenido con anotaciones
 */
function ContentReaderPage() {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Cargar contenido desde Firebase
   */
  useEffect(() => {
    if (!contentId) {
      setError('No se especificó un ID de contenido');
      setLoading(false);
      return;
    }

    loadContent();
  }, [contentId]);

  /**
   * Cargar contenido
   */
  const loadContent = async () => {
    try {
      setLoading(true);
      const data = await getContentById(contentId);

      if (!data) {
        setError('Contenido no encontrado');
        return;
      }

      setContent(data);
    } catch (err) {
      logger.error('Error loading content:', err, 'ContentReaderPage');
      setError('Error al cargar el contenido');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Convertir contenido a HTML
   * Esto es un ejemplo básico, ajusta según tus necesidades
   */
  const getContentHTML = () => {
    if (!content) return '';

    // Si el contenido ya tiene HTML
    if (content.body || content.html) {
      return content.body || content.html;
    }

    // Si solo tiene texto plano, convertirlo a HTML con párrafos
    if (content.description || content.text) {
      const text = content.description || content.text;
      const paragraphs = text.split('\n\n').filter(p => p.trim());
      return paragraphs.map(p => `<p>${p}</p>`).join('');
    }

    // Contenido de ejemplo si no hay nada
    return '<p>No hay contenido disponible para mostrar.</p>';
  };

  /**
   * Renderizar estado de carga
   */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-primary-50 dark:bg-primary-950">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-accent-500 animate-spin" />
          <p className="text-sm font-medium text-primary-600 dark:text-primary-400">
            Cargando contenido...
          </p>
        </div>
      </div>
    );
  }

  /**
   * Renderizar estado de error
   */
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-primary-50 dark:bg-primary-950">
        <div className="max-w-md w-full p-8">
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
            </div>
            <h2 className="text-xl font-bold text-red-900 dark:text-red-100 mb-2">
              Error al cargar contenido
            </h2>
            <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-medium"
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  /**
   * Renderizar contenido
   */
  return (
    <div className="min-h-screen bg-primary-50 dark:bg-primary-950">
      {/* Header */}
      <div className="bg-white dark:bg-primary-900 border-b border-primary-200 dark:border-primary-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-800 rounded-lg transition-all"
                title="Volver"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-100 dark:bg-accent-900 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-accent-600 dark:text-accent-400" />
                </div>

                <div>
                  <h1 className="text-xl font-bold text-primary-900 dark:text-primary-100">
                    {content?.title || 'Lector de Contenido'}
                  </h1>
                  {content?.type && (
                    <p className="text-sm text-primary-600 dark:text-primary-400">
                      Tipo: {content.type}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {content?.metadata?.difficulty && (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    content.metadata.difficulty === 'beginner'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : content.metadata.difficulty === 'intermediate'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}
                >
                  {content.metadata.difficulty}
                </span>
              )}
            </div>
          </div>

          {/* Descripción breve */}
          {content?.description && (
            <div className="mt-4 p-4 bg-primary-50 dark:bg-primary-800 rounded-lg">
              <p className="text-sm text-primary-700 dark:text-primary-300">
                {content.description}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Content Reader */}
      {user && (
        <ContentReader
          contentId={contentId}
          initialContent={getContentHTML()}
          userId={user.uid}
          readOnly={false}
          onClose={() => navigate(-1)}
        />
      )}
    </div>
  );
}

export default ContentReaderPage;
