import logger from '../utils/logger';

import { useState, useCallback, useEffect, useRef, Suspense, lazy } from 'react';
// Lazy load Excalidraw to avoid circular dependency issues
const Excalidraw = lazy(() =>
  import('@excalidraw/excalidraw').then(module => ({ default: module.Excalidraw }))
);
import '@excalidraw/excalidraw/index.css';
import { X, Save } from 'lucide-react';
import { saveExcalidrawContent } from '../firebase/excalidraw';
import BaseButton from './common/BaseButton';

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
      logger.debug('✅ Pizarra guardada');
    } catch (error) {
      logger.error('Error guardando pizarra:', error);
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
    <div className="fixed inset-0 w-screen h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--color-bg-primary)', zIndex: 9999 }}>
      {/* Header con botón de cerrar */}
      <div className="flex items-center gap-4 px-5 py-3 h-[60px] border-b shadow-sm" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
        <BaseButton
          onClick={onBack}
          variant="secondary"
          icon={X}
          size="sm"
          title="Volver"
        >
          Volver
        </BaseButton>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {initialSession?.title || 'Pizarra Excalidraw'}
        </h2>

        <div className="ml-auto flex gap-3 items-center">
          {lastSaved && (
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Guardado: {lastSaved.toLocaleTimeString()}
            </span>
          )}
          <BaseButton
            onClick={handleSave}
            variant="primary"
            icon={Save}
            size="sm"
            disabled={saving || !initialSession?.id}
            title="Guardar"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </BaseButton>
        </div>
      </div>

      {/* Contenedor de Excalidraw con Suspense para lazy loading */}
      <div className="absolute top-[60px] left-0 right-0 bottom-0">
        <Suspense fallback={
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            fontSize: '18px',
            color: 'var(--text-secondary)'
          }}>
            Cargando pizarra...
          </div>
        }>
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
        </Suspense>
      </div>
    </div>
  );
}

export default ExcalidrawWhiteboard;
