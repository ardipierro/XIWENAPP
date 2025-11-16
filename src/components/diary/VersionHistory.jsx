import React, { useState, useEffect } from 'react';
import { History, Clock, RotateCcw, Eye, Trash2 } from 'lucide-react';

/**
 * VersionHistory - Sistema de historial de versiones guardadas
 *
 * @param {string} blockId - ID del bloque de texto
 * @param {string} currentContent - Contenido HTML actual
 * @param {Function} onRestore - Callback para restaurar una versión
 */
export function VersionHistory({ blockId, currentContent, onRestore }) {
  const [versions, setVersions] = useState(() => {
    try {
      const saved = localStorage.getItem(`versionHistory_${blockId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showPreview, setShowPreview] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  // Auto-guardar versión cada 5 minutos si hay cambios
  useEffect(() => {
    if (!currentContent || !blockId) return;

    const interval = setInterval(() => {
      const lastVersion = versions[0];
      const hasChanges = !lastVersion || lastVersion.content !== currentContent;

      if (hasChanges) {
        saveVersion();
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [currentContent, versions, blockId]);

  // Guardar versión nueva
  const saveVersion = () => {
    const newVersion = {
      id: Date.now(),
      content: currentContent,
      timestamp: Date.now(),
      preview: currentContent.substring(0, 100).replace(/<[^>]*>/g, '')
    };

    const updated = [newVersion, ...versions].slice(0, 20); // Máx 20 versiones
    setVersions(updated);
    localStorage.setItem(`versionHistory_${blockId}`, JSON.stringify(updated));
  };

  // Restaurar versión
  const handleRestore = (version) => {
    if (confirm('¿Restaurar esta versión? Los cambios actuales se guardarán como una nueva versión.')) {
      // Guardar versión actual antes de restaurar
      saveVersion();

      // Restaurar
      onRestore(version.content);
      setIsOpen(false);
    }
  };

  // Eliminar versión
  const handleDelete = (versionId) => {
    if (confirm('¿Eliminar esta versión?')) {
      const updated = versions.filter(v => v.id !== versionId);
      setVersions(updated);
      localStorage.setItem(`versionHistory_${blockId}`, JSON.stringify(updated));
    }
  };

  // Formatear fecha
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Hace un momento';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;

    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="version-history">
      {/* Botón toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg
                 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300
                 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors
                 border-2 border-gray-300 dark:border-gray-600"
        title="Ver historial de versiones"
      >
        <History size={16} />
        <span className="text-sm font-semibold">Historial</span>
        {versions.length > 0 && (
          <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
            {versions.length}
          </span>
        )}
      </button>

      {/* Panel de versiones */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
             onClick={() => setIsOpen(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl max-h-[80vh]
                         flex flex-col shadow-2xl"
               onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b
                           border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <History size={24} className="text-blue-500" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    Historial de Versiones
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {versions.length} versión{versions.length !== 1 ? 'es' : ''} guardada{versions.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <span className="text-2xl">&times;</span>
              </button>
            </div>

            {/* Lista de versiones */}
            <div className="flex-1 overflow-y-auto p-6">
              {versions.length === 0 ? (
                <div className="text-center py-12">
                  <Clock size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No hay versiones guardadas aún
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    Las versiones se guardan automáticamente cada 5 minutos
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {versions.map((version, index) => (
                    <div
                      key={version.id}
                      className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg
                               hover:border-blue-400 dark:hover:border-blue-600 transition-colors
                               bg-white dark:bg-gray-900"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {/* Timestamp */}
                          <div className="flex items-center gap-2 mb-2">
                            <Clock size={14} className="text-gray-500" />
                            <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {formatDate(version.timestamp)}
                            </span>
                            {index === 0 && (
                              <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900
                                           text-green-800 dark:text-green-100 text-xs
                                           font-bold rounded">
                                Más reciente
                              </span>
                            )}
                          </div>

                          {/* Preview */}
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {version.preview || 'Sin contenido'}
                          </p>
                        </div>

                        {/* Acciones */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowPreview(version.id === showPreview ? null : version.id)}
                            className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900
                                     text-blue-600 dark:text-blue-300 hover:bg-blue-200
                                     dark:hover:bg-blue-800 transition-colors"
                            title="Vista previa"
                          >
                            <Eye size={16} />
                          </button>

                          <button
                            onClick={() => handleRestore(version)}
                            className="p-2 rounded-lg bg-green-100 dark:bg-green-900
                                     text-green-600 dark:text-green-300 hover:bg-green-200
                                     dark:hover:bg-green-800 transition-colors"
                            title="Restaurar versión"
                          >
                            <RotateCcw size={16} />
                          </button>

                          <button
                            onClick={() => handleDelete(version.id)}
                            className="p-2 rounded-lg bg-red-100 dark:bg-red-900
                                     text-red-600 dark:text-red-300 hover:bg-red-200
                                     dark:hover:bg-red-800 transition-colors"
                            title="Eliminar versión"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Preview expandido */}
                      {showPreview === version.id && (
                        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg
                                       border border-gray-200 dark:border-gray-700">
                          <div className="prose dark:prose-invert max-w-none text-sm"
                               dangerouslySetInnerHTML={{ __html: version.content }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700
                           bg-gray-50 dark:bg-gray-900">
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
                💾 Las versiones se guardan automáticamente cada 5 minutos • Máximo 20 versiones
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VersionHistory;
