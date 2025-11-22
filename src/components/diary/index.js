/**
 * Diary Components - Sistema de visualización y edición para Diario de Clases
 *
 * Este módulo exporta los componentes principales para el sistema del Diario:
 *
 * CORE:
 * - UnifiedExerciseRenderer: Renderiza dinámicamente 19+ tipos de ejercicios
 * - EditableTextBlock: Bloques de texto enriquecido editables con Tiptap (versión básica)
 * - EnhancedTextEditor: Editor avanzado COMPLETO con TODAS las características profesionales
 * - InSituContentEditor: Edición in-situ de contenidos para profesores
 *
 * COMPONENTES DE EDICIÓN (UNIFICADOS V2):
 * - UnifiedToolbarButton: Botón estándar para toda la toolbar (px-3 py-2, iconos 16px, consistente)
 * - ColorPicker: Selector de colores simplificado (8 colores, 180px)
 * - HighlightPicker: Selector de resaltado simplificado (6 colores, 180px)
 * - ColorFavorites: Galería de colores favoritos guardados
 * - PencilPresets: Presets de estilos para el lápiz (básico, 8 presets)
 * - PencilPresetsExtended: 15+ presets expandidos + personalizables
 * - SimplePencilPresets: Selector SIMPLE (5 grosores + 5 colores editables)
 *
 * DIBUJO:
 * - DrawingCanvas: Canvas de dibujo con perfect-freehand (básico)
 * - DrawingCanvasAdvanced: Canvas avanzado con undo/redo, capas y zoom
 * - DrawingViewer: Visualizador de trazos guardados (SOLO LECTURA - soluciona bug de invisibilidad)
 * - StrokeWidthSelector: Selector de grosor de trazo (1-20px)
 * - ZoomControls: Controles de zoom (0.5x - 3x)
 *
 * CARACTERÍSTICAS AVANZADAS:
 * - ImageUploader: Sistema de importar imágenes (subir, URL, pegar)
 * - VersionHistory: Historial de versiones con auto-guardado
 */

export { UnifiedExerciseRenderer } from './UnifiedExerciseRenderer';
export { EditableTextBlock } from './EditableTextBlock';
export { EnhancedTextEditor } from './EnhancedTextEditor';
export { InSituContentEditor } from './InSituContentEditor';
export { UnifiedToolbarButton } from './UnifiedToolbarButton';
export { ColorPicker } from './ColorPicker';
export { SimpleColorButton } from './SimpleColorButton';
export { ColorFavorites } from './ColorFavorites';
export { HighlightPicker } from './HighlightPicker';
export { PencilPresets } from './PencilPresets';
export { PencilPresetsExtended } from './PencilPresetsExtended';
export { SimplePencilPresets } from './SimplePencilPresets';
export { DrawingCanvas } from './DrawingCanvas';
export { DrawingCanvasAdvanced } from './DrawingCanvasAdvanced';
export { DrawingViewer } from './DrawingViewer';
export { StrokeWidthSelector } from './StrokeWidthSelector';
export { ZoomControls } from './ZoomControls';
export { ImageUploader } from './ImageUploader';
export { VersionHistory } from './VersionHistory';
export { default as EntryOptionsMenu } from './EntryOptionsMenu';
