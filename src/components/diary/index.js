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
 * COMPONENTES DE EDICIÓN:
 * - ColorPicker: Selector de colores con presets
 * - ColorFavorites: Galería de colores favoritos guardados
 * - HighlightPicker: Selector de colores de resaltado
 * - PencilPresets: Presets de estilos para el lápiz (básico, 8 presets)
 * - PencilPresetsExtended: 15+ presets expandidos + personalizables
 *
 * DIBUJO:
 * - DrawingCanvas: Canvas de dibujo con perfect-freehand (básico)
 * - DrawingCanvasAdvanced: Canvas avanzado con undo/redo, capas y zoom
 * - StrokeWidthSelector: Selector de grosor de trazo (1-20px)
 * - ZoomControls: Controles de zoom (0.5x - 3x)
 *
 * CARACTERÍSTICAS AVANZADAS:
 * - ImageUploader: Sistema de importar imágenes (subir, URL, pegar)
 * - VersionHistory: Historial de versiones con auto-guardado
 */

export { UnifiedExerciseRenderer } from './UnifiedExerciseRenderer';
// export { EditableTextBlock } from './EditableTextBlock'; // DEPRECATED - Usar EnhancedTextEditor
export { EnhancedTextEditor } from './EnhancedTextEditor';
export { InSituContentEditor } from './InSituContentEditor';
export { ColorPicker } from './ColorPicker';
export { ColorFavorites } from './ColorFavorites';
export { HighlightPicker } from './HighlightPicker';
export { PencilPresets } from './PencilPresets';
export { PencilPresetsExtended } from './PencilPresetsExtended';
export { DrawingCanvas } from './DrawingCanvas';
export { DrawingCanvasAdvanced } from './DrawingCanvasAdvanced';
export { StrokeWidthSelector } from './StrokeWidthSelector';
export { ZoomControls } from './ZoomControls';
export { ImageUploader } from './ImageUploader';
export { VersionHistory } from './VersionHistory';
