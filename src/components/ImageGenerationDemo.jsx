/**
 * @fileoverview Image Generation Demo Component
 * @module components/ImageGenerationDemo
 *
 * Componente para demostrar y probar la generación de imágenes con tareas predefinidas
 */

import { useState } from 'react';
import {
  Play,
  Pause,
  Download,
  CheckCircle,
  XCircle,
  Loader,
  Image as ImageIcon,
  Grid3x3,
  List
} from 'lucide-react';
import {
  IMAGE_GENERATION_TASKS,
  executeImageTask,
  getTasksSummary
} from '../utils/imageGenerationTasks';
import './ImageGenerationDemo.css';

function ImageGenerationDemo() {
  const [selectedTask, setSelectedTask] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(null);
  const [results, setResults] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  const summary = getTasksSummary();

  const handleRunTask = async (taskId) => {
    setSelectedTask(taskId);
    setIsRunning(true);
    setProgress(null);
    setResults(null);

    try {
      const result = await executeImageTask(taskId, (progressData) => {
        setProgress(progressData);
      });

      setResults(result);
    } catch (error) {
      console.error('Error ejecutando tarea:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsRunning(false);
      setProgress(null);
    }
  };

  const handleDownloadAll = () => {
    if (!results) return;

    results.results.forEach((item, index) => {
      if (item.success && item.imageUrl) {
        const link = document.createElement('a');
        link.href = item.imageUrl;
        link.download = `${item.word}-${Date.now()}.png`;
        link.click();
      }
    });
  };

  const getSuccessRate = () => {
    if (!results) return 0;
    const successful = results.results.filter(r => r.success).length;
    return Math.round((successful / results.results.length) * 100);
  };

  return (
    <div className="image-demo-container">
      <div className="demo-header">
        <div className="header-content">
          <ImageIcon size={32} />
          <div>
            <h1>Tareas de Generación de Imágenes</h1>
            <p>Prueba la generación automática de imágenes educativas con tareas predefinidas</p>
          </div>
        </div>

        <div className="header-stats">
          <div className="stat-card">
            <span className="stat-value">{summary.totalTasks}</span>
            <span className="stat-label">Tareas</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{summary.totalItems}</span>
            <span className="stat-label">Imágenes</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{summary.levels.length}</span>
            <span className="stat-label">Niveles</span>
          </div>
        </div>
      </div>

      {/* Summary by Level */}
      <div className="summary-section">
        <h2>Resumen por Nivel CEFR</h2>
        <div className="level-cards">
          {summary.levels.map((level) => (
            <div key={level.id} className="level-card">
              <div className="level-badge">{level.id}</div>
              <div className="level-info">
                <span>{level.tasks} tareas</span>
                <span>{level.items} imágenes</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="tasks-section">
        <div className="section-header">
          <h2>Tareas Disponibles</h2>
          <div className="view-toggle">
            <button
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
            >
              <Grid3x3 size={18} />
            </button>
            <button
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              <List size={18} />
            </button>
          </div>
        </div>

        <div className={`tasks-${viewMode}`}>
          {IMAGE_GENERATION_TASKS.map((task) => (
            <div key={task.id} className="task-card">
              <div className="task-header">
                <h3>{task.name}</h3>
                <span className={`level-badge level-${task.level.toLowerCase()}`}>
                  {task.level}
                </span>
              </div>

              <div className="task-info">
                <span className="task-function">{task.functionId}</span>
                <span className="task-count">{task.items.length} imágenes</span>
              </div>

              <div className="task-items-preview">
                {task.items.slice(0, 5).map((item, idx) => (
                  <span key={idx} className="item-chip">
                    {item.word}
                  </span>
                ))}
                {task.items.length > 5 && (
                  <span className="item-chip more">
                    +{task.items.length - 5}
                  </span>
                )}
              </div>

              <button
                className="btn-run-task"
                onClick={() => handleRunTask(task.id)}
                disabled={isRunning}
              >
                {isRunning && selectedTask === task.id ? (
                  <>
                    <Loader className="spinner" size={16} />
                    Generando...
                  </>
                ) : (
                  <>
                    <Play size={16} />
                    Ejecutar Tarea
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Progress */}
      {isRunning && progress && (
        <div className="progress-section">
          <div className="progress-header">
            <h3>Generando: {progress.task}</h3>
            <span>
              {progress.current} / {progress.total}
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${(progress.current / progress.total) * 100}%`
              }}
            />
          </div>
          <p className="progress-item">Generando imagen para: {progress.item}</p>
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="results-section">
          <div className="results-header">
            <div>
              <h2>Resultados: {results.taskName}</h2>
              <p>
                {results.results.filter(r => r.success).length} de {results.totalItems}{' '}
                imágenes generadas exitosamente ({getSuccessRate()}%)
              </p>
            </div>
            <button className="btn-download-all" onClick={handleDownloadAll}>
              <Download size={18} />
              Descargar Todas
            </button>
          </div>

          <div className="results-grid">
            {results.results.map((result, index) => (
              <div
                key={index}
                className={`result-card ${result.success ? 'success' : 'error'}`}
              >
                <div className="result-header">
                  <h4>{result.word}</h4>
                  {result.success ? (
                    <CheckCircle size={20} className="icon-success" />
                  ) : (
                    <XCircle size={20} className="icon-error" />
                  )}
                </div>

                {result.success && result.imageUrl ? (
                  <div className="result-image">
                    <img
                      src={result.imageUrl}
                      alt={result.word}
                      loading="lazy"
                    />
                    <div className="image-overlay">
                      <a
                        href={result.imageUrl}
                        download={`${result.word}.png`}
                        className="download-btn"
                      >
                        <Download size={18} />
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="result-error">
                    <XCircle size={32} />
                    <p>{result.error || 'Error desconocido'}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageGenerationDemo;
