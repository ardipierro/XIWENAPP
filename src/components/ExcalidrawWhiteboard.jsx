import { useState, useCallback, useEffect, useRef } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import '@excalidraw/excalidraw/index.css';
import { X, Save } from 'lucide-react';
import { saveExcalidrawContent } from '../firebase/excalidraw';
import './ExcalidrawWhiteboard.css';

/**
 * Componente de Pizarra usando Excalidraw
 * Esta es una implementación ALTERNATIVA a la pizarra clásica
 */
function ExcalidrawWhiteboard({ onBack, initialSession }) {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const autoSaveTimeoutRef = useRef(null);

  const handleSave = useCallback(async () => {
    if (!excalidrawAPI || !initialSession?.id) {
      alert('No hay sesión activa para guardar');
      return;
    }

    setSaving(true);
    try {
      const elements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();
      const files = excalidrawAPI.getFiles();

      // Convertir todo a strings JSON para evitar problemas con arrays anidados en Firestore
      const elementsJSON = JSON.stringify(elements);

      // Filtrar solo propiedades serializables de appState y convertir a JSON
      const cleanAppState = {
        viewBackgroundColor: appState.viewBackgroundColor,
        currentItemStrokeColor: appState.currentItemStrokeColor,
        currentItemBackgroundColor: appState.currentItemBackgroundColor,
        currentItemFillStyle: appState.currentItemFillStyle,
        currentItemStrokeWidth: appState.currentItemStrokeWidth,
        currentItemStrokeStyle: appState.currentItemStrokeStyle,
        currentItemRoughness: appState.currentItemRoughness,
        currentItemOpacity: appState.currentItemOpacity,
        currentItemFontFamily: appState.currentItemFontFamily,
        currentItemFontSize: appState.currentItemFontSize,
        currentItemTextAlign: appState.currentItemTextAlign,
        currentItemRoundness: appState.currentItemRoundness,
        gridSize: appState.gridSize,
        scrollX: appState.scrollX,
        scrollY: appState.scrollY,
        zoom: appState.zoom,
      };
      const appStateJSON = JSON.stringify(cleanAppState);

      // Convertir files Map a objeto simple y luego a JSON
      const filesObject = {};
      if (files) {
        for (const [key, value] of Object.entries(files)) {
          if (value && value.dataURL) {
            filesObject[key] = {
              id: value.id,
              dataURL: value.dataURL,
              mimeType: value.mimeType,
              created: value.created,
            };
          }
        }
      }
      const filesJSON = JSON.stringify(filesObject);

      await saveExcalidrawContent(initialSession.id, elementsJSON, appStateJSON, filesJSON);

      setLastSaved(new Date());
      setHasChanges(false);
      console.log('✅ Pizarra guardada');
    } catch (error) {
      console.error('Error guardando pizarra:', error);
      alert('Error al guardar la pizarra');
    } finally {
      setSaving(false);
    }
  }, [excalidrawAPI, initialSession]);

  // Auto-save cada 10 segundos si hay cambios
  const handleChange = useCallback(() => {
    setHasChanges(true);

    // Cancelar timeout anterior
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Nuevo timeout para auto-save
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (excalidrawAPI && initialSession?.id) {
        handleSave();
      }
    }, 10000); // 10 segundos
  }, [excalidrawAPI, initialSession, handleSave]);

  // Cleanup del timeout
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="excalidraw-whiteboard-container">
      {/* Header con botón de cerrar */}
      <div className="excalidraw-header">
        <button
          onClick={onBack}
          className="excalidraw-close-btn"
          title="Volver"
        >
          <X size={20} />
          Volver
        </button>
        <h2 className="excalidraw-title">
          {initialSession?.title || 'Pizarra Excalidraw'}
        </h2>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
          {lastSaved && (
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Guardado: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleSave}
            className="excalidraw-close-btn"
            disabled={saving || !initialSession?.id}
            title="Guardar"
          >
            <Save size={18} />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* Contenedor de Excalidraw */}
      <div className="excalidraw-content">
        <Excalidraw
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
          initialData={{
            elements: typeof initialSession?.elements === 'string'
              ? JSON.parse(initialSession.elements)
              : (initialSession?.elements || []),
            appState: typeof initialSession?.appState === 'string'
              ? JSON.parse(initialSession.appState)
              : (initialSession?.appState || {}),
            files: typeof initialSession?.files === 'string'
              ? JSON.parse(initialSession.files)
              : (initialSession?.files || {}),
          }}
          onChange={handleChange}
          theme="light"
        />
      </div>
    </div>
  );
}

export default ExcalidrawWhiteboard;
