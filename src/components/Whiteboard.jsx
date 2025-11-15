import logger from '../utils/logger';

import { useState, useRef, useEffect } from 'react';
import BaseButton from './common/BaseButton';
import {
  Pencil,
  Square,
  Circle,
  ArrowRight,
  Type,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Upload,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Move,
  Palette,
  Save,
  FolderOpen,
  Pen,
  Highlighter,
  Bold,
  Italic,
  Underline,
  MousePointer2,
  StickyNote,
  FileText,
  Monitor,
  Film,
  FileImage
} from 'lucide-react';
import getStroke from 'perfect-freehand';
import {
  createWhiteboardSession,
  updateWhiteboardSession,
  getUserWhiteboardSessions,
  createActiveWhiteboardSession,
  joinActiveWhiteboardSession,
  leaveActiveWhiteboardSession,
  subscribeToActiveWhiteboardSession,
  addStrokeToActiveSession,
  clearSlideInActiveSession,
  shareContentInSession,
  clearSharedContent,
  addObjectToActiveSession,
  updateObjectInActiveSession,
  deleteObjectFromActiveSession,
  updateActiveSelection
} from '../firebase/whiteboard';
import { auth } from '../firebase/config';
import SharedContentViewer from './SharedContentViewer';
import './SharedContentViewer.css';

function Whiteboard({ onBack, initialSession = null, isCollaborative = false, collaborativeSessionId = null }) {
  // Session management
  const [currentSessionId, setCurrentSessionId] = useState(initialSession?.id || null);
  const [sessionTitle, setSessionTitle] = useState(initialSession?.title || '');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [savedSessions, setSavedSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pencil'); // pencil, pen, marker, highlighter, line, arrow, rectangle, circle, text, eraser, move, select, stickyNote, textBox
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [slides, setSlides] = useState(initialSession?.slides || [{ id: 1, data: null, thumbnail: null }]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [textInput, setTextInput] = useState({ show: false, x: 0, y: 0, value: '' });
  const textInputRef = useRef(null);
  // Text formatting states
  const [textBold, setTextBold] = useState(false);
  const [textItalic, setTextItalic] = useState(false);
  const [textUnderline, setTextUnderline] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  // Objects (sticky notes, text boxes)
  const [objects, setObjects] = useState([]);
  const [selectedObject, setSelectedObject] = useState(null);
  const [editingObject, setEditingObject] = useState(null); // ID del objeto en modo edición
  const [isDraggingObject, setIsDraggingObject] = useState(false);
  const [dragObjectOffset, setDragObjectOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null); // 'se', 'sw', 'ne', 'nw'
  // Canvas strokes (trazos seleccionables)
  const [strokes, setStrokes] = useState([]);
  const [selectedStroke, setSelectedStroke] = useState(null);
  const [isDraggingStroke, setIsDraggingStroke] = useState(false);
  const [baseCanvasImage, setBaseCanvasImage] = useState(null); // Captura del canvas sin el trazo seleccionado
  // Resize state
  const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0 });
  const [resizeStartSize, setResizeStartSize] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const [toolbarPos, setToolbarPos] = useState({ x: 0, y: 0 });
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isVertical, setIsVertical] = useState(false);
  const [verticalSide, setVerticalSide] = useState('right'); // 'left' or 'right'
  const [lastVerticalState, setLastVerticalState] = useState(false); // Para histéresis
  const [pendingOrientation, setPendingOrientation] = useState(null); // Orientación pendiente al soltar
  const toolbarRef = useRef(null);
  const colorButtonRef = useRef(null);
  const [colorPickerPos, setColorPickerPos] = useState({ top: 0, left: 0 });
  const [currentPoints, setCurrentPoints] = useState([]);
  // Tool groups expansion state
  const [expandedGroup, setExpandedGroup] = useState(null); // 'draw', 'shapes', 'objects'
  const [tempCanvas, setTempCanvas] = useState(null);

  // Collaborative state
  const [participants, setParticipants] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [sharedContent, setSharedContent] = useState(null);
  const [isHost, setIsHost] = useState(false); // Si el usuario actual es el creador de la sesión
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareContentUrl, setShareContentUrl] = useState('');
  const [shareContentType, setShareContentType] = useState('video'); // 'video', 'pdf', 'image'
  const [activeSelections, setActiveSelections] = useState({}); // Selecciones de otros usuarios
  const unsubscribeRef = useRef(null);

  // Colores predefinidos
  const presetColors = [
    '#000000', // Negro
    '#FFFFFF', // Blanco
    '#FF0000', // Rojo
    '#0066CC', // Azul
    '#00AA00', // Verde
    '#FF6600', // Naranja
    '#9900CC', // Púrpura
    '#00CCCC', // Cyan
    '#FFCC00', // Amarillo dorado
    '#CC0066', // Magenta
    '#666666', // Gris oscuro
    '#FF99CC'  // Rosa
  ];

  // Collaborative mode: Join/Create session
  useEffect(() => {
    if (!isCollaborative || !collaborativeSessionId) return;

    const joinSession = async () => {
      if (!auth.currentUser) {
        logger.debug('⚠️ No user logged in');
        return;
      }

      try {
        const user = {
          uid: auth.currentUser.uid,
          displayName: auth.currentUser.displayName || auth.currentUser.email || 'Usuario'
        };

        logger.debug('🟢 Joining collaborative session:', collaborativeSessionId);

        // Try to create session (will work if it doesn't exist)
        try {
          await createActiveWhiteboardSession(collaborativeSessionId, user, {
            title: 'Pizarra Colaborativa',
            slides: slides
          });
        } catch (error) {
          // Session might already exist, try to join
          await joinActiveWhiteboardSession(collaborativeSessionId, user);
        }

        setIsConnected(true);

        // Subscribe to updates
        const unsubscribe = subscribeToActiveWhiteboardSession(collaborativeSessionId, (sessionData) => {
          if (sessionData) {
            logger.debug('📡 Session update received:', sessionData);
            setParticipants(sessionData.participants || []);

            // Set if current user is host
            if (auth.currentUser) {
              const isUserHost = sessionData.createdBy === auth.currentUser.uid;
              logger.debug('🎯 isHost check:', {
                createdBy: sessionData.createdBy,
                currentUserId: auth.currentUser.uid,
                isHost: isUserHost
              });
              setIsHost(isUserHost);
            }

            // Update shared content
            if (sessionData.sharedContent) {
              setSharedContent(sessionData.sharedContent);
            } else {
              setSharedContent(null);
            }

            // Update active selections from other users
            if (sessionData.activeSelections) {
              setActiveSelections(sessionData.activeSelections);
            }

            // Update slides from collaborative session
            if (sessionData.slides && sessionData.slides.length > 0) {
              const newSlides = sessionData.slides;

              // Only update if there are actual changes
              setSlides(prevSlides => {
                // Check if we have new strokes
                const currentSlideData = newSlides[currentSlide];
                const prevSlideData = prevSlides[currentSlide];

                if (currentSlideData && prevSlideData) {
                  const newStrokesCount = currentSlideData.strokes?.length || 0;
                  const prevStrokesCount = prevSlideData.strokes?.length || 0;

                  // If there are new strokes, draw only the new ones
                  if (newStrokesCount > prevStrokesCount) {
                    const newStrokes = currentSlideData.strokes.slice(prevStrokesCount);
                    logger.debug('🎨 Drawing', newStrokes.length, 'new strokes');
                    drawNewStrokesOnCanvas(newStrokes);
                  }

                  // Update objects from Firebase
                  if (currentSlideData.objects) {
                    setObjects(currentSlideData.objects);
                  }
                }

                return newSlides;
              });
            }
          }
        });

        unsubscribeRef.current = unsubscribe;

      } catch (error) {
        logger.error('❌ Error joining session:', error);
      }
    };

    joinSession();

    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
      if (auth.currentUser && collaborativeSessionId) {
        leaveActiveWhiteboardSession(collaborativeSessionId, auth.currentUser.uid);
      }
    };
  }, [isCollaborative, collaborativeSessionId]);

  // Event listeners para arrastrar y redimensionar objetos
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDraggingStroke && selectedStroke) {
        // Mover trazo seleccionado
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        const newX = (e.clientX - rect.left) * scaleX - dragObjectOffset.x;
        const newY = (e.clientY - rect.top) * scaleY - dragObjectOffset.y;

        setStrokes(strokes.map(stroke => {
          if (stroke.id === selectedStroke) {
            const deltaX = newX - stroke.x;
            const deltaY = newY - stroke.y;

            // Actualizar posición del bounding box
            const updated = { ...stroke, x: newX, y: newY };

            // Actualizar puntos internos según el tipo de trazo
            if (stroke.type === 'line' || stroke.type === 'arrow') {
              updated.startX = stroke.startX + deltaX;
              updated.startY = stroke.startY + deltaY;
              updated.endX = stroke.endX + deltaX;
              updated.endY = stroke.endY + deltaY;
            } else if (stroke.type === 'rectangle') {
              updated.startX = stroke.startX + deltaX;
              updated.startY = stroke.startY + deltaY;
            } else if (stroke.type === 'circle') {
              updated.centerX = stroke.centerX + deltaX;
              updated.centerY = stroke.centerY + deltaY;
            } else if (stroke.type === 'pencil' && stroke.points) {
              // Handle both flattened and legacy formats
              if (stroke.points.xs && stroke.points.ys && stroke.points.ps) {
                // Flattened format
                updated.points = {
                  xs: stroke.points.xs.map(x => x + deltaX),
                  ys: stroke.points.ys.map(y => y + deltaY),
                  ps: stroke.points.ps
                };
              } else {
                // Legacy nested array format
                updated.points = stroke.points.map(p => [p[0] + deltaX, p[1] + deltaY, p[2]]);
              }
            }

            return updated;
          }
          return stroke;
        }));
      } else if (isDraggingObject && selectedObject && !isResizing) {
        const newX = e.clientX - dragObjectOffset.x;
        const newY = e.clientY - dragObjectOffset.y;

        setObjects(objects.map(obj =>
          obj.id === selectedObject
            ? { ...obj, x: newX, y: newY }
            : obj
        ));
      } else if (isResizing && selectedObject && resizeHandle) {
        // Calcular delta desde la posición inicial del mouse
        const deltaX = e.clientX - resizeStartPos.x;
        const deltaY = e.clientY - resizeStartPos.y;

        let newWidth = resizeStartSize.width;
        let newHeight = resizeStartSize.height;
        let newX = resizeStartSize.x;
        let newY = resizeStartSize.y;

        // Ajustar según el handle
        if (resizeHandle.includes('e')) {
          newWidth = Math.max(100, resizeStartSize.width + deltaX);
        }
        if (resizeHandle.includes('w')) {
          newWidth = Math.max(100, resizeStartSize.width - deltaX);
          newX = resizeStartSize.x + (resizeStartSize.width - newWidth);
        }
        if (resizeHandle.includes('s')) {
          newHeight = Math.max(60, resizeStartSize.height + deltaY);
        }
        if (resizeHandle.includes('n')) {
          newHeight = Math.max(60, resizeStartSize.height - deltaY);
          newY = resizeStartSize.y + (resizeStartSize.height - newHeight);
        }

        setObjects(objects.map(o =>
          o.id === selectedObject
            ? { ...o, x: newX, y: newY, width: newWidth, height: newHeight }
            : o
        ));
      }
    };

    const handleMouseUp = () => {
      // Sync object position/size to Firebase when drag/resize ends
      if ((isDraggingObject || isResizing) && selectedObject && isCollaborative && collaborativeSessionId) {
        const updatedObject = objects.find(obj => obj.id === selectedObject);
        if (updatedObject) {
          updateObjectInActiveSession(
            collaborativeSessionId,
            currentSlide,
            selectedObject,
            {
              x: updatedObject.x,
              y: updatedObject.y,
              width: updatedObject.width,
              height: updatedObject.height
            }
          );
        }
      }

      setIsDraggingObject(false);
      setIsDraggingStroke(false);
      setIsResizing(false);
      setResizeHandle(null);
    };

    if (isDraggingObject || isResizing || isDraggingStroke) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingObject, isDraggingStroke, isResizing, selectedObject, selectedStroke, dragObjectOffset, resizeHandle, objects, strokes, resizeStartPos, resizeStartSize]);

  // Redibujar canvas solo cuando se está arrastrando un trazo
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (isDraggingStroke && selectedStroke && baseCanvasImage) {
      // Durante el drag: restaurar imagen base y redibujar solo el trazo seleccionado
      ctx.putImageData(baseCanvasImage, 0, 0);

      const stroke = strokes.find(s => s.id === selectedStroke);
      if (!stroke) return;

      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Redibujar solo el trazo que se está moviendo
      if (stroke.type === 'pencil') {
        ctx.fillStyle = stroke.color;

        // Convert flattened points back to nested array format for perfect-freehand
        let pointsArray;
        if (stroke.points.xs && stroke.points.ys && stroke.points.ps) {
          // New flattened format from Firebase
          pointsArray = stroke.points.xs.map((x, i) => [x, stroke.points.ys[i], stroke.points.ps[i]]);
        } else {
          // Legacy format (nested arrays) - for backwards compatibility
          pointsArray = stroke.points;
        }

        const outlinePoints = getStroke(pointsArray, {
          size: stroke.lineWidth * 2.5,
          thinning: 0.4,
          smoothing: 0.8,
          streamline: 0.7,
          easing: (t) => t,
          start: { taper: 20, easing: (t) => t * t, cap: true },
          end: { taper: 20, easing: (t) => t * t, cap: true }
        });
        if (outlinePoints.length > 0) {
          ctx.beginPath();
          ctx.moveTo(outlinePoints[0][0], outlinePoints[0][1]);
          for (let i = 1; i < outlinePoints.length; i++) {
            ctx.lineTo(outlinePoints[i][0], outlinePoints[i][1]);
          }
          ctx.closePath();
          ctx.fill();
        }
      } else if (stroke.type === 'line') {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.lineWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(stroke.startX, stroke.startY);
        ctx.lineTo(stroke.endX, stroke.endY);
        ctx.stroke();
      } else if (stroke.type === 'arrow') {
        const angle = Math.atan2(stroke.endY - stroke.startY, stroke.endX - stroke.startX);
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.lineWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(stroke.startX, stroke.startY);
        ctx.lineTo(stroke.endX, stroke.endY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(stroke.endX, stroke.endY);
        ctx.lineTo(stroke.endX - stroke.headLength * Math.cos(angle - Math.PI / 6), stroke.endY - stroke.headLength * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(stroke.endX - stroke.headLength * Math.cos(angle + Math.PI / 6), stroke.endY - stroke.headLength * Math.sin(angle + Math.PI / 6));
        ctx.lineTo(stroke.endX, stroke.endY);
        ctx.fillStyle = stroke.color;
        ctx.fill();
      } else if (stroke.type === 'rectangle') {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.lineWidth;
        ctx.lineCap = 'round';
        ctx.strokeRect(stroke.startX, stroke.startY, stroke.width - 20, stroke.height - 20);
      } else if (stroke.type === 'circle') {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.lineWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(stroke.centerX, stroke.centerY, stroke.radius, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // Dibujar bounding box
      ctx.strokeStyle = '#0ea5e9';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(stroke.x, stroke.y, stroke.width, stroke.height);
      ctx.setLineDash([]);

      ctx.restore();
    } else if (selectedStroke && !isDraggingStroke) {
      // Solo mostrar bounding box sin redibujar todo
      const stroke = strokes.find(s => s.id === selectedStroke);
      if (stroke) {
        ctx.save();
        ctx.strokeStyle = '#0ea5e9';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(stroke.x, stroke.y, stroke.width, stroke.height);
        ctx.setLineDash([]);
        ctx.restore();
      }
    }
  }, [isDraggingStroke, selectedStroke, strokes, baseCanvasImage]);

  // Función auxiliar para dibujar el stroke de perfect-freehand
  const drawSmoothStroke = (points, ctx) => {
    if (points.length === 0) return;

    const stroke = getStroke(points, {
      size: lineWidth * 2.5,
      thinning: 0.4,
      smoothing: 0.8,
      streamline: 0.7,
      easing: (t) => t,
      start: {
        taper: 20,
        easing: (t) => t * t,
        cap: true
      },
      end: {
        taper: 20,
        easing: (t) => t * t,
        cap: true
      },
      simulatePressure: true
    });

    if (stroke.length === 0) return;

    // Dibujar el path con curvas suaves
    ctx.fillStyle = color;
    ctx.beginPath();

    if (stroke.length < 2) {
      // Si es muy corto, dibujar un punto
      const [x, y] = stroke[0];
      ctx.arc(x, y, lineWidth / 2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }

    ctx.moveTo(stroke[0][0], stroke[0][1]);

    // Usar curvas cuadráticas para suavizar
    for (let i = 1; i < stroke.length - 1; i++) {
      const [x0, y0] = stroke[i];
      const [x1, y1] = stroke[i + 1];
      const xMid = (x0 + x1) / 2;
      const yMid = (y0 + y1) / 2;
      ctx.quadraticCurveTo(x0, y0, xMid, yMid);
    }

    // Última línea
    const [lastX, lastY] = stroke[stroke.length - 1];
    ctx.lineTo(lastX, lastY);

    ctx.closePath();
    ctx.fill();
  };

  // Draw new strokes incrementally without clearing the canvas
  const drawNewStrokesOnCanvas = (strokes) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      logger.warn('⚠️ No canvas ref when trying to draw strokes');
      return;
    }

    const ctx = canvas.getContext('2d');

    logger.debug('🖌️ Drawing', strokes.length, 'new strokes on canvas');
    // Draw each new stroke on top of existing canvas
    strokes.forEach((stroke, index) => {
      logger.debug(`  Drawing stroke ${index}:`, stroke.type, stroke);
      drawSingleStroke(stroke, ctx);
    });
  };

  // Helper to draw a single stroke
  const drawSingleStroke = (stroke, ctx) => {
    if (!stroke || !stroke.type) return;

    if (stroke.type === 'pencil') {
      // Convert flattened points back to nested array for perfect-freehand
      let pointsArray;
      if (stroke.points.xs && stroke.points.ys && stroke.points.ps) {
        // New flattened format
        pointsArray = stroke.points.xs.map((x, i) => [x, stroke.points.ys[i], stroke.points.ps[i]]);
      } else {
        // Legacy format
        pointsArray = stroke.points;
      }

      ctx.fillStyle = stroke.color;
      const outlinePoints = getStroke(pointsArray, {
        size: stroke.lineWidth * 2.5,
        thinning: 0.4,
        smoothing: 0.8,
        streamline: 0.7,
        easing: (t) => t,
        start: { taper: 20, easing: (t) => t * t, cap: true },
        end: { taper: 20, easing: (t) => t * t, cap: true }
      });

      if (outlinePoints.length > 0) {
        ctx.beginPath();
        ctx.moveTo(outlinePoints[0][0], outlinePoints[0][1]);
        for (let i = 1; i < outlinePoints.length; i++) {
          ctx.lineTo(outlinePoints[i][0], outlinePoints[i][1]);
        }
        ctx.closePath();
        ctx.fill();
      }
    } else if (stroke.type === 'line') {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.lineWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(stroke.startX, stroke.startY);
      ctx.lineTo(stroke.endX, stroke.endY);
      ctx.stroke();
    } else if (stroke.type === 'arrow') {
      const angle = Math.atan2(stroke.endY - stroke.startY, stroke.endX - stroke.startX);
      const headLength = stroke.headLength || 20;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.lineWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(stroke.startX, stroke.startY);
      ctx.lineTo(stroke.endX, stroke.endY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(stroke.endX, stroke.endY);
      ctx.lineTo(stroke.endX - headLength * Math.cos(angle - Math.PI / 6), stroke.endY - headLength * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(stroke.endX - headLength * Math.cos(angle + Math.PI / 6), stroke.endY - headLength * Math.sin(angle + Math.PI / 6));
      ctx.lineTo(stroke.endX, stroke.endY);
      ctx.fillStyle = stroke.color;
      ctx.fill();
    } else if (stroke.type === 'rectangle') {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.lineWidth;
      ctx.lineCap = 'round';
      const width = (stroke.width || 0) - 20;
      const height = (stroke.height || 0) - 20;
      ctx.strokeRect(stroke.startX, stroke.startY, width, height);
    } else if (stroke.type === 'circle') {
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.lineWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(stroke.centerX, stroke.centerY, stroke.radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
  };


  // Inicializar canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Establecer tamaño del canvas
    const resizeCanvas = () => {
      // Obtener dimensiones reales del viewport
      const width = window.innerWidth;
      const height = window.innerHeight;

      logger.debug('🎨 Resizing canvas to:', width, 'x', height);

      // Guardar contenido actual antes de cambiar el tamaño
      let imageData = null;
      if (canvas.width > 0 && canvas.height > 0) {
        try {
          imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } catch (e) {
          logger.warn('No se pudo guardar el contenido del canvas');
        }
      }

      // Establecer nuevo tamaño del canvas (resolución interna)
      canvas.width = width;
      canvas.height = height;

      // Fondo blanco por defecto
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // En modo colaborativo, redibujar todos los strokes del slide actual
      if (isCollaborative && slides[currentSlide]?.strokes?.length > 0) {
        logger.debug('🔄 Redrawing', slides[currentSlide].strokes.length, 'collaborative strokes after resize');
        slides[currentSlide].strokes.forEach(stroke => {
          drawSingleStroke(stroke, ctx);
        });
      }
      // En modo normal, restaurar contenido escalado si existe
      else if (slides[currentSlide].data) {
        const img = new Image();
        img.onload = () => {
          // Limpiar el canvas
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Escalar la imagen para que se ajuste al nuevo tamaño del canvas
          // Manteniendo la proporción y centrando
          const imgRatio = img.width / img.height;
          const canvasRatio = canvas.width / canvas.height;

          let drawWidth, drawHeight, offsetX = 0, offsetY = 0;

          if (imgRatio > canvasRatio) {
            // La imagen es más ancha proporcionalmente
            drawWidth = canvas.width;
            drawHeight = canvas.width / imgRatio;
            offsetY = (canvas.height - drawHeight) / 2;
          } else {
            // La imagen es más alta proporcionalmente
            drawHeight = canvas.height;
            drawWidth = canvas.height * imgRatio;
            offsetX = (canvas.width - drawWidth) / 2;
          }

          // Dibujar la imagen escalada y centrada
          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        };
        img.src = slides[currentSlide].data;
      }
    };

    // Pequeño delay para asegurar que el DOM está listo
    setTimeout(resizeCanvas, 0);

    window.addEventListener('resize', resizeCanvas);
    // También escuchar cambios de orientación en móvil
    window.addEventListener('orientationchange', () => {
      setTimeout(resizeCanvas, 100);
    });

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('orientationchange', resizeCanvas);
    };
  }, [currentSlide, slides]);

  // Guardar en historial
  const saveToHistory = () => {
    const canvas = canvasRef.current;
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(canvas.toDataURL());
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  // Deshacer
  const undo = () => {
    if (historyStep > 0) {
      setHistoryStep(historyStep - 1);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = history[historyStep - 1];
    }
  };

  // Rehacer
  const redo = () => {
    if (historyStep < history.length - 1) {
      setHistoryStep(historyStep + 1);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = history[historyStep + 1];
    }
  };

  // Obtener posición del mouse/touch
  const getPosition = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  // Iniciar dibujo
  const startDrawing = (e) => {
    // Manejar herramienta de selección de trazos
    if (tool === 'select') {
      const pos = getPosition(e);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      // Buscar trazo clickeado (en orden inverso para seleccionar el más reciente primero)
      for (let i = strokes.length - 1; i >= 0; i--) {
        const stroke = strokes[i];
        // Verificar si el click está dentro del bounding box del trazo
        if (pos.x >= stroke.x && pos.x <= stroke.x + stroke.width &&
            pos.y >= stroke.y && pos.y <= stroke.y + stroke.height) {
          // Guardar imagen base del canvas antes de empezar a arrastrar
          setBaseCanvasImage(ctx.getImageData(0, 0, canvas.width, canvas.height));
          setSelectedStroke(stroke.id);
          setIsDraggingStroke(true);
          setDragObjectOffset({
            x: pos.x - stroke.x,
            y: pos.y - stroke.y
          });
          return;
        }
      }
      // Si no se clickeó ningún trazo, deseleccionar
      setSelectedStroke(null);
      return;
    }

    // Manejar sticky notes
    if (tool === 'stickyNote') {
      const pos = getPosition(e);
      const newNote = {
        id: Date.now(),
        type: 'stickyNote',
        x: pos.x,
        y: pos.y,
        width: 200,
        height: 200,
        content: '',
        color: '#fef08a', // yellow-200
        fontSize: 14
      };
      setObjects([...objects, newNote]);
      setSelectedObject(newNote.id);

      // Sync to Firebase in collaborative mode
      if (isCollaborative && collaborativeSessionId) {
        addObjectToActiveSession(collaborativeSessionId, currentSlide, newNote);
      }

      return;
    }

    // Manejar text boxes
    if (tool === 'textBox') {
      const pos = getPosition(e);
      const newTextBox = {
        id: Date.now(),
        type: 'textBox',
        x: pos.x,
        y: pos.y,
        width: 300,
        height: 150,
        content: '',
        fontSize: 16,
        bold: false,
        italic: false,
        underline: false
      };
      setObjects([...objects, newTextBox]);
      setSelectedObject(newTextBox.id);

      // Sync to Firebase in collaborative mode
      if (isCollaborative && collaborativeSessionId) {
        addObjectToActiveSession(collaborativeSessionId, currentSlide, newTextBox);
      }

      return;
    }

    if (tool === 'text') {
      // Para texto, capturar coordenadas antes de cualquier procesamiento
      const clientX = e.clientX || (e.touches ? e.touches[0].clientX : 0);
      const clientY = e.clientY || (e.touches ? e.touches[0].clientY : 0);
      const pos = getPosition(e);

      setTextInput({
        show: true,
        x: clientX,
        y: clientY,
        canvasX: pos.x,
        canvasY: pos.y,
        value: ''
      });

      // Focus en el input después de un pequeño delay
      setTimeout(() => {
        if (textInputRef.current) {
          textInputRef.current.focus();
        }
      }, 10);
      return;
    }

    const pos = getPosition(e);
    setIsDrawing(true);
    setStartPos(pos);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (tool === 'pencil') {
      // Guardar el estado actual del canvas
      setTempCanvas(ctx.getImageData(0, 0, canvas.width, canvas.height));
      // Iniciar array de puntos para perfect-freehand
      // Aplicar pequeño offset de corrección (ajustable)
      const offsetX = 0;
      const offsetY = 0;
      setCurrentPoints([[pos.x + offsetX, pos.y + offsetY, e.pressure || 0.5]]);
    } else if (tool === 'pen' || tool === 'marker' || tool === 'highlighter') {
      // Para pen, marker y highlighter: dibujo simple sin perfect-freehand
      ctx.strokeStyle = tool === 'highlighter' ? `${color}40` : color; // 40 = 25% opacity para highlighter
      ctx.lineWidth = tool === 'pen' ? 1 : tool === 'marker' ? lineWidth * 2 : lineWidth * 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  // Dibujar
  const draw = (e) => {
    if (!isDrawing) return;

    const pos = getPosition(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (tool === 'pencil') {
      // Aplicar mismo offset de corrección
      const offsetX = 0;
      const offsetY = 0;

      // Agregar punto al array
      const newPoints = [...currentPoints, [pos.x + offsetX, pos.y + offsetY, e.pressure || 0.5]];
      setCurrentPoints(newPoints);

      // Restaurar canvas temporal
      if (tempCanvas) {
        ctx.putImageData(tempCanvas, 0, 0);
      }

      // Dibujar el stroke actual
      drawSmoothStroke(newPoints, ctx);
    } else if (tool === 'pen' || tool === 'marker' || tool === 'highlighter') {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (tool === 'eraser') {
      ctx.clearRect(pos.x - lineWidth / 2, pos.y - lineWidth / 2, lineWidth * 2, lineWidth * 2);
    }
  };

  // Finalizar dibujo
  const stopDrawing = (e) => {
    if (!isDrawing) return;

    const pos = getPosition(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    let newStroke = null;

    if (tool === 'pencil') {
      // El trazo ya está dibujado, solo limpiamos los puntos y el canvas temporal
      if (currentPoints.length > 0) {
        // Calcular bounding box
        const xs = currentPoints.map(p => p[0]);
        const ys = currentPoints.map(p => p[1]);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        // Flatten points array for Firebase (no nested arrays allowed)
        // Convert [[x,y,p], ...] to {xs: [x...], ys: [y...], ps: [p...]}
        const flatPoints = {
          xs: currentPoints.map(p => p[0]),
          ys: currentPoints.map(p => p[1]),
          ps: currentPoints.map(p => p[2] || 0.5)
        };

        newStroke = {
          id: Date.now(),
          type: 'pencil',
          points: flatPoints, // Use flattened structure for Firebase compatibility
          color: color,
          lineWidth: lineWidth,
          x: minX - 10,
          y: minY - 10,
          width: maxX - minX + 20,
          height: maxY - minY + 20
        };
      }
      setCurrentPoints([]);
      setTempCanvas(null);
    } else if (tool === 'line') {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();

      newStroke = {
        id: Date.now(),
        type: 'line',
        startX: startPos.x,
        startY: startPos.y,
        endX: pos.x,
        endY: pos.y,
        color: color,
        lineWidth: lineWidth,
        x: Math.min(startPos.x, pos.x) - 10,
        y: Math.min(startPos.y, pos.y) - 10,
        width: Math.abs(pos.x - startPos.x) + 20,
        height: Math.abs(pos.y - startPos.y) + 20
      };
    } else if (tool === 'arrow') {
      const headLength = 20;
      const angle = Math.atan2(pos.y - startPos.y, pos.x - startPos.x);

      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(pos.x - headLength * Math.cos(angle - Math.PI / 6), pos.y - headLength * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(pos.x - headLength * Math.cos(angle + Math.PI / 6), pos.y - headLength * Math.sin(angle + Math.PI / 6));
      ctx.lineTo(pos.x, pos.y);
      ctx.fillStyle = color;
      ctx.fill();

      newStroke = {
        id: Date.now(),
        type: 'arrow',
        startX: startPos.x,
        startY: startPos.y,
        endX: pos.x,
        endY: pos.y,
        color: color,
        lineWidth: lineWidth,
        headLength: headLength,
        x: Math.min(startPos.x, pos.x) - headLength,
        y: Math.min(startPos.y, pos.y) - headLength,
        width: Math.abs(pos.x - startPos.x) + headLength * 2,
        height: Math.abs(pos.y - startPos.y) + headLength * 2
      };
    } else if (tool === 'rectangle') {
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.strokeRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);

      newStroke = {
        id: Date.now(),
        type: 'rectangle',
        startX: startPos.x,
        startY: startPos.y,
        width: pos.x - startPos.x,
        height: pos.y - startPos.y,
        color: color,
        lineWidth: lineWidth,
        x: Math.min(startPos.x, pos.x) - 10,
        y: Math.min(startPos.y, pos.y) - 10
      };
      newStroke.width = Math.abs(newStroke.width) + 20;
      newStroke.height = Math.abs(newStroke.height) + 20;
    } else if (tool === 'circle') {
      const radius = Math.sqrt(Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2));
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
      ctx.stroke();

      newStroke = {
        id: Date.now(),
        type: 'circle',
        centerX: startPos.x,
        centerY: startPos.y,
        radius: radius,
        color: color,
        lineWidth: lineWidth,
        x: startPos.x - radius - 10,
        y: startPos.y - radius - 10,
        width: radius * 2 + 20,
        height: radius * 2 + 20
      };
    }

    // Guardar el trazo como objeto seleccionable (excepto eraser)
    if (newStroke && tool !== 'eraser') {
      setStrokes([...strokes, newStroke]);
    }

    // Collaborative mode: Sync stroke to Firebase
    if (isCollaborative && collaborativeSessionId && newStroke) {
      logger.debug('🔵 Publishing stroke to Firebase:', newStroke.type, newStroke);
      const updatedSlides = [...slides];
      if (!updatedSlides[currentSlide].strokes) {
        updatedSlides[currentSlide].strokes = [];
      }
      updatedSlides[currentSlide].strokes.push(newStroke);

      addStrokeToActiveSession(collaborativeSessionId, currentSlide, newStroke)
        .then(() => logger.debug('✅ Stroke published successfully'))
        .catch(err => logger.error('❌ Error syncing stroke:', err));
    } else {
      logger.debug('⚠️ Not syncing:', { isCollaborative, collaborativeSessionId, hasStroke: !!newStroke });
    }

    setIsDrawing(false);
    saveToHistory();
  };

  // Aplicar texto al canvas
  const applyText = (force = false) => {
    if (!textInput.value.trim()) {
      setTextInput({ show: false, x: 0, y: 0, value: '' });
      return;
    }

    if (!force) return; // Solo aplicar si es forzado (Enter key)

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Construir font string con formato enriquecido
    const fontWeight = textBold ? 'bold' : 'normal';
    const fontStyle = textItalic ? 'italic' : 'normal';
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px Arial`;
    ctx.fillStyle = color;

    // Dibujar el texto
    ctx.fillText(textInput.value, textInput.canvasX, textInput.canvasY);

    // Si tiene subrayado, dibujarlo
    if (textUnderline) {
      const textWidth = ctx.measureText(textInput.value).width;
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1, fontSize / 16);
      ctx.beginPath();
      ctx.moveTo(textInput.canvasX, textInput.canvasY + 2);
      ctx.lineTo(textInput.canvasX + textWidth, textInput.canvasY + 2);
      ctx.stroke();
    }

    setTextInput({ show: false, x: 0, y: 0, value: '' });
    saveToHistory();
  };

  // Manejar teclas en el input de texto
  const handleTextKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyText(true);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setTextInput({ show: false, x: 0, y: 0, value: '' });
    }
  };

  // Limpiar canvas
  const clearCanvas = async () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Collaborative mode: Clear on Firebase
    if (isCollaborative && collaborativeSessionId) {
      try {
        await clearSlideInActiveSession(collaborativeSessionId, currentSlide);
        logger.debug('✅ Canvas cleared in collaborative mode');
      } catch (error) {
        logger.error('❌ Error clearing canvas:', error);
      }
    }

    saveToHistory();
  };

  // Drag toolbar
  const handleToolbarMouseDown = (e) => {
    if (e.target.closest('.tool-btn') || e.target.closest('.color-picker-wrapper') || e.target.closest('.line-width-control')) {
      return; // No iniciar drag si se clickea un botón o control
    }
    setIsDraggingToolbar(true);
    const toolbar = toolbarRef.current;
    const rect = toolbar.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleToolbarMouseMove = (e) => {
    if (!isDraggingToolbar) return;

    const container = canvasRef.current.parentElement;
    const containerRect = container.getBoundingClientRect();
    const toolbar = toolbarRef.current;
    const toolbarRect = toolbar.getBoundingClientRect();

    let newX = e.clientX - containerRect.left - dragOffset.x;
    let newY = e.clientY - containerRect.top - dragOffset.y;

    // NO limitar dentro del contenedor - permitir salir hasta la mitad
    // Solo limitar para que al menos la mitad de la barra sea visible
    const halfToolbarWidth = toolbarRect.width / 2;
    const halfToolbarHeight = toolbarRect.height / 2;

    newX = Math.max(-halfToolbarWidth, Math.min(newX, containerRect.width - halfToolbarWidth));
    newY = Math.max(-halfToolbarHeight, Math.min(newY, containerRect.height - halfToolbarHeight));

    // Calcular el centro de la toolbar
    const toolbarCenterX = newX + toolbarRect.width / 2;
    const toolbarCenterY = newY + toolbarRect.height / 2;

    // Puntos medios de cada borde
    const leftEdgeMidpoint = { x: 0, y: containerRect.height / 2 };
    const rightEdgeMidpoint = { x: containerRect.width, y: containerRect.height / 2 };
    const topEdgeMidpoint = { x: containerRect.width / 2, y: 0 };
    const bottomEdgeMidpoint = { x: containerRect.width / 2, y: containerRect.height };

    // Calcular distancia del centro de la toolbar a cada punto medio de borde
    // Histéresis: diferentes umbrales para activar y desactivar
    const activateThreshold = 150; // Distancia para ACTIVAR el volteo
    const deactivateThreshold = 200; // Distancia para DESACTIVAR el volteo (más grande)

    const distToLeftMid = Math.sqrt(
      Math.pow(toolbarCenterX - leftEdgeMidpoint.x, 2) +
      Math.pow(toolbarCenterY - leftEdgeMidpoint.y, 2)
    );
    const distToRightMid = Math.sqrt(
      Math.pow(toolbarCenterX - rightEdgeMidpoint.x, 2) +
      Math.pow(toolbarCenterY - rightEdgeMidpoint.y, 2)
    );
    const distToTopMid = Math.sqrt(
      Math.pow(toolbarCenterX - topEdgeMidpoint.x, 2) +
      Math.pow(toolbarCenterY - topEdgeMidpoint.y, 2)
    );
    const distToBottomMid = Math.sqrt(
      Math.pow(toolbarCenterX - bottomEdgeMidpoint.x, 2) +
      Math.pow(toolbarCenterY - bottomEdgeMidpoint.y, 2)
    );

    // Determinar cuál punto medio de borde está más cerca
    const minDist = Math.min(distToLeftMid, distToRightMid, distToTopMid, distToBottomMid);

    // Usar histéresis: umbral diferente según el estado actual
    const currentThreshold = lastVerticalState ? deactivateThreshold : activateThreshold;

    // SOLO guardar la orientación pendiente, NO aplicarla mientras se arrastra
    if (minDist < currentThreshold) {
      if (minDist === distToLeftMid || minDist === distToRightMid) {
        // Cerca del medio del borde izquierdo o derecho -> vertical pendiente
        setPendingOrientation({
          isVertical: true,
          side: minDist === distToLeftMid ? 'left' : 'right'
        });
      } else {
        // Cerca del medio del borde superior o inferior -> horizontal pendiente
        setPendingOrientation({
          isVertical: false,
          side: null
        });
      }
    } else {
      // Lejos de todos los puntos medios -> horizontal pendiente
      setPendingOrientation({
        isVertical: false,
        side: null
      });
    }

    setToolbarPos({ x: newX, y: newY });
  };

  const handleToolbarMouseUp = (e) => {
    setIsDraggingToolbar(false);

    // Aplicar la orientación pendiente AHORA que se soltó
    if (pendingOrientation) {
      const toolbar = toolbarRef.current;
      const container = canvasRef.current.parentElement;
      const containerRect = container.getBoundingClientRect();
      const toolbarRect = toolbar.getBoundingClientRect();

      // Calcular el punto de agarre relativo a la toolbar ANTES de rotar
      const gripPointX = dragOffset.x; // Offset X desde el inicio del drag
      const gripPointY = dragOffset.y; // Offset Y desde el inicio del drag

      // Posición actual del mouse (punto de agarre en coordenadas del contenedor)
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;

      // Si va a cambiar de orientación, ajustar la posición para rotar desde el punto de agarre
      const wasVertical = isVertical;
      const willBeVertical = pendingOrientation.isVertical;

      if (wasVertical !== willBeVertical) {
        // Está cambiando de orientación - necesitamos reposicionar
        let newX, newY;

        if (willBeVertical) {
          // Horizontal → Vertical
          // El punto de agarre en horizontal (gripPointX, gripPointY)
          // debe mapear al mismo punto relativo en vertical
          newX = mouseX - gripPointY; // X se calcula desde gripY (rotación 90°)
          newY = mouseY - (toolbarRect.width - gripPointX); // Y desde el ancho - gripX
        } else {
          // Vertical → Horizontal
          // El punto de agarre en vertical debe mapear a horizontal
          newX = mouseX - (toolbarRect.height - gripPointY); // X desde altura - gripY
          newY = mouseY - gripPointX; // Y desde gripX (rotación -90°)
        }

        // Limitar para que al menos la mitad sea visible
        const halfToolbarWidth = willBeVertical ? 52 : toolbarRect.width;
        const halfToolbarHeight = willBeVertical ? toolbarRect.height : 60;

        newX = Math.max(-halfToolbarWidth / 2, Math.min(newX, containerRect.width - halfToolbarWidth / 2));
        newY = Math.max(-halfToolbarHeight / 2, Math.min(newY, containerRect.height - halfToolbarHeight / 2));

        setToolbarPos({ x: newX, y: newY });
      }

      setIsVertical(pendingOrientation.isVertical);
      setLastVerticalState(pendingOrientation.isVertical);
      if (pendingOrientation.side) {
        setVerticalSide(pendingOrientation.side);
      }
      setPendingOrientation(null);
    }
  };

  // Agregar event listeners para el drag
  useEffect(() => {
    if (isDraggingToolbar) {
      window.addEventListener('mousemove', handleToolbarMouseMove);
      window.addEventListener('mouseup', handleToolbarMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleToolbarMouseMove);
        window.removeEventListener('mouseup', handleToolbarMouseUp);
      };
    }
  }, [isDraggingToolbar, dragOffset]);

  // Guardar slide actual
  const saveCurrentSlide = () => {
    const canvas = canvasRef.current;
    const data = canvas.toDataURL();
    const thumbnail = canvas.toDataURL('image/png', 0.1);
    const newSlides = [...slides];
    newSlides[currentSlide] = { ...newSlides[currentSlide], data, thumbnail, objects };
    setSlides(newSlides);
  };

  // Agregar nuevo slide
  const addSlide = () => {
    saveCurrentSlide();
    const newSlide = { id: slides.length + 1, data: null, thumbnail: null, strokes: [], objects: [] };
    setSlides([...slides, newSlide]);
    setCurrentSlide(slides.length);
    setObjects([]); // Clear objects when moving to new slide
  };

  // Eliminar slide
  const deleteSlide = () => {
    if (slides.length === 1) return;
    const newSlides = slides.filter((_, index) => index !== currentSlide);
    setSlides(newSlides);
    setCurrentSlide(Math.max(0, currentSlide - 1));
  };

  // Cambiar de slide
  const goToSlide = (index) => {
    saveCurrentSlide();
    setCurrentSlide(index);
    // Load objects from the target slide
    setObjects(slides[index]?.objects || []);
  };

  // Descargar presentación
  const downloadPresentation = () => {
    saveCurrentSlide();
    const data = JSON.stringify(slides);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `presentacion_${new Date().getTime()}.json`;
    a.click();
  };

  // Cargar presentación
  const loadPresentation = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        setSlides(data);
        setCurrentSlide(0);
      } catch (error) {
        alert('Error al cargar la presentación');
      }
    };
    reader.readAsText(file);
  };

  // Save session to Firebase
  const handleSaveSession = async () => {
    if (!auth.currentUser) {
      alert('Debes iniciar sesión para guardar sesiones');
      return;
    }

    logger.debug('🔵 [Whiteboard] Iniciando guardado...');
    logger.debug('🔵 [Whiteboard] Usuario:', auth.currentUser.uid);

    // Guardar slide actual y obtener los slides actualizados sincrónicamente
    const canvas = canvasRef.current;
    const data = canvas.toDataURL();
    const thumbnail = canvas.toDataURL('image/png', 0.1);
    const updatedSlides = [...slides];
    updatedSlides[currentSlide] = { ...updatedSlides[currentSlide], data, thumbnail };

    logger.debug('🔵 [Whiteboard] Slides a guardar:', updatedSlides.length);

    const title = sessionTitle.trim() || `Pizarra ${new Date().toLocaleDateString()}`;
    logger.debug('🔵 [Whiteboard] Título:', title);

    try {
      if (currentSessionId) {
        // Update existing session
        logger.debug('🔵 [Whiteboard] Actualizando sesión existente:', currentSessionId);
        await updateWhiteboardSession(currentSessionId, {
          title,
          slides: updatedSlides
        });
        setSlides(updatedSlides); // Actualizar estado después de guardar
        logger.debug('✅ [Whiteboard] Sesión actualizada');
        alert('Sesión actualizada correctamente');
      } else {
        // Create new session
        logger.debug('🔵 [Whiteboard] Creando nueva sesión...');
        const sessionId = await createWhiteboardSession({
          title,
          slides: updatedSlides,
          userId: auth.currentUser.uid,
          userName: auth.currentUser.displayName || auth.currentUser.email
        });
        logger.debug('✅ [Whiteboard] Sesión creada con ID:', sessionId);
        setCurrentSessionId(sessionId);
        setSlides(updatedSlides); // Actualizar estado después de guardar
        alert('Sesión guardada correctamente');
      }
      setShowSaveModal(false);
      setSessionTitle('');
    } catch (error) {
      logger.error('❌ [Whiteboard] Error saving session:', error);
      alert('Error al guardar la sesión');
    }
  };

  // Load sessions from Firebase
  const handleLoadSessions = async () => {
    if (!auth.currentUser) {
      alert('Debes iniciar sesión para cargar sesiones');
      return;
    }

    setIsLoadingSessions(true);
    try {
      const sessions = await getUserWhiteboardSessions(auth.currentUser.uid);
      setSavedSessions(sessions);
      setShowLoadModal(true);
    } catch (error) {
      logger.error('Error loading sessions:', error);
      alert('Error al cargar las sesiones');
    } finally {
      setIsLoadingSessions(false);
    }
  };

  // Load a specific session
  const loadSession = (session) => {
    setSlides(session.slides || [{ id: 1, data: null, thumbnail: null }]);
    setCurrentSlide(0);
    setCurrentSessionId(session.id);
    setSessionTitle(session.title);
    setShowLoadModal(false);
  };

  // Share content in collaborative session
  const handleShareContent = async () => {
    if (!isCollaborative || !collaborativeSessionId) {
      alert('Solo disponible en sesiones colaborativas');
      return;
    }

    if (!isHost) {
      alert('Solo el presentador puede compartir contenido');
      return;
    }

    if (!shareContentUrl.trim()) {
      alert('Por favor ingresa una URL válida');
      return;
    }

    try {
      await shareContentInSession(collaborativeSessionId, {
        type: shareContentType,
        url: shareContentUrl.trim(),
        title: `${shareContentType.toUpperCase()} compartido`
      });

      setShowShareModal(false);
      setShareContentUrl('');
      alert('Contenido compartido exitosamente');
    } catch (error) {
      logger.error('Error sharing content:', error);
      alert('Error al compartir contenido');
    }
  };

  // Create new session
  const handleNewSession = () => {
    if (confirm('¿Crear una nueva sesión? Los cambios no guardados se perderán.')) {
      setSlides([{ id: 1, data: null, thumbnail: null }]);
      setCurrentSlide(0);
      setCurrentSessionId(null);
      setSessionTitle('');
      setHistory([]);
      setHistoryStep(-1);
      clearCanvas();
    }
  };

  return (
    <div className="whiteboard-container">
      {/* Floating Back Button */}
      <button onClick={onBack} className="floating-back-btn" title="Volver">
        <ChevronLeft size={20} />
        <span>Volver</span>
      </button>

      <div className="whiteboard-main">
        {/* Canvas */}
        <div className="whiteboard-canvas-container">
          <canvas
            ref={canvasRef}
            className="whiteboard-canvas"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />

          {/* Floating Toolbar */}
          <div
            ref={toolbarRef}
            className={`floating-toolbar ${isDraggingToolbar ? 'dragging' : ''} ${isVertical ? 'vertical' : ''} ${isVertical && verticalSide === 'left' ? 'left' : ''}`}
            style={{
              left: toolbarPos.x ? `${toolbarPos.x}px` : '50%',
              transform: toolbarPos.x ? 'none' : 'translateX(-50%)',
              bottom: toolbarPos.y ? 'auto' : '20px',
              top: toolbarPos.y ? `${toolbarPos.y}px` : 'auto'
            }}
            onMouseDown={handleToolbarMouseDown}
          >
            {/* Selection Tool */}
            <div className="toolbar-group">
              <button
                className={`tool-btn ${tool === 'select' ? 'active' : ''}`}
                onClick={() => setTool('select')}
                title="Seleccionar"
              >
                <MousePointer2 size={20} />
              </button>
            </div>

            {/* Separator */}
            <div className="toolbar-separator"></div>

            {/* Objects Group (Collapsible) */}
            <div className="toolbar-group tool-group-collapsible">
              <button
                className={`tool-btn ${['stickyNote', 'textBox'].includes(tool) ? 'active' : ''}`}
                onClick={() => setExpandedGroup(expandedGroup === 'objects' ? null : 'objects')}
                title="Objetos"
              >
                <StickyNote size={20} />
              </button>
              {expandedGroup === 'objects' && (
                <div className="tool-submenu">
                  <button
                    className={`tool-btn ${tool === 'stickyNote' ? 'active' : ''}`}
                    onClick={() => { setTool('stickyNote'); setExpandedGroup(null); }}
                    title="Nota Adhesiva"
                  >
                    <StickyNote size={18} />
                  </button>
                  <button
                    className={`tool-btn ${tool === 'textBox' ? 'active' : ''}`}
                    onClick={() => { setTool('textBox'); setExpandedGroup(null); }}
                    title="Cuadro de Texto"
                  >
                    <FileText size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="toolbar-separator"></div>

            {/* Drawing Tools Group (Collapsible) */}
            <div className="toolbar-group tool-group-collapsible">
              <button
                className={`tool-btn ${['pencil', 'pen', 'marker', 'highlighter'].includes(tool) ? 'active' : ''}`}
                onClick={() => setExpandedGroup(expandedGroup === 'draw' ? null : 'draw')}
                title="Dibujo"
              >
                <Pencil size={20} />
              </button>
              {expandedGroup === 'draw' && (
                <div className="tool-submenu">
                  <button
                    className={`tool-btn ${tool === 'pencil' ? 'active' : ''}`}
                    onClick={() => { setTool('pencil'); setExpandedGroup(null); }}
                    title="Lápiz"
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    className={`tool-btn ${tool === 'pen' ? 'active' : ''}`}
                    onClick={() => { setTool('pen'); setExpandedGroup(null); }}
                    title="Bolígrafo"
                  >
                    <Pen size={18} />
                  </button>
                  <button
                    className={`tool-btn ${tool === 'marker' ? 'active' : ''}`}
                    onClick={() => { setTool('marker'); setExpandedGroup(null); }}
                    title="Marcador"
                  >
                    <Pencil size={18} strokeWidth={3} />
                  </button>
                  <button
                    className={`tool-btn ${tool === 'highlighter' ? 'active' : ''}`}
                    onClick={() => { setTool('highlighter'); setExpandedGroup(null); }}
                    title="Resaltador"
                  >
                    <Highlighter size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="toolbar-separator"></div>

            {/* Shapes Group (Collapsible) */}
            <div className="toolbar-group tool-group-collapsible">
              <button
                className={`tool-btn ${['line', 'arrow', 'rectangle', 'circle', 'text'].includes(tool) ? 'active' : ''}`}
                onClick={() => setExpandedGroup(expandedGroup === 'shapes' ? null : 'shapes')}
                title="Formas"
              >
                <Square size={20} />
              </button>
              {expandedGroup === 'shapes' && (
                <div className="tool-submenu">
                  <button
                    className={`tool-btn ${tool === 'line' ? 'active' : ''}`}
                    onClick={() => { setTool('line'); setExpandedGroup(null); }}
                    title="Línea"
                  >
                    <Minus size={18} />
                  </button>
                  <button
                    className={`tool-btn ${tool === 'arrow' ? 'active' : ''}`}
                    onClick={() => { setTool('arrow'); setExpandedGroup(null); }}
                    title="Flecha"
                  >
                    <ArrowRight size={18} />
                  </button>
                  <button
                    className={`tool-btn ${tool === 'rectangle' ? 'active' : ''}`}
                    onClick={() => { setTool('rectangle'); setExpandedGroup(null); }}
                    title="Rectángulo"
                  >
                    <Square size={18} />
                  </button>
                  <button
                    className={`tool-btn ${tool === 'circle' ? 'active' : ''}`}
                    onClick={() => { setTool('circle'); setExpandedGroup(null); }}
                    title="Círculo"
                  >
                    <Circle size={18} />
                  </button>
                  <button
                    className={`tool-btn ${tool === 'text' ? 'active' : ''}`}
                    onClick={() => { setTool('text'); setExpandedGroup(null); }}
                    title="Texto"
                  >
                    <Type size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="toolbar-separator"></div>

            {/* Eraser */}
            <div className="toolbar-group">
              <button
                className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
                onClick={() => setTool('eraser')}
                title="Borrador"
              >
                <Eraser size={20} />
              </button>
            </div>

            {/* Separator */}
            <div className="toolbar-separator"></div>

            {/* Color Picker */}
            <div className="toolbar-group">
              <div className="color-picker-wrapper">
                <button
                  className="tool-btn color-btn"
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  title="Color"
                >
                  <div className="color-indicator" style={{ backgroundColor: color }}></div>
                </button>
                {showColorPicker && (
                  <div className="floating-color-picker">
                    <div className="color-grid">
                      {presetColors.map((c) => (
                        <button
                          key={c}
                          className={`color-swatch ${color === c ? 'active' : ''}`}
                          style={{ backgroundColor: c }}
                          onClick={() => { setColor(c); setShowColorPicker(false); }}
                          title={c}
                        />
                      ))}
                    </div>
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="color-input-custom"
                    />
                  </div>
                )}
              </div>

              {/* Line Width */}
              <div className="line-width-control">
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={lineWidth}
                  onChange={(e) => setLineWidth(parseInt(e.target.value))}
                  className="line-width-slider-floating"
                  title={`Grosor: ${lineWidth}px`}
                />
                <span className="line-width-value">{lineWidth}</span>
              </div>
            </div>

            {/* Separator */}
            <div className="toolbar-separator"></div>

            {/* Text Formatting - Solo visible cuando tool === 'text' */}
            {tool === 'text' && (
              <>
                <div className="toolbar-group">
                  <button
                    className={`tool-btn ${textBold ? 'active' : ''}`}
                    onClick={() => setTextBold(!textBold)}
                    title="Negrita"
                  >
                    <Bold size={20} />
                  </button>
                  <button
                    className={`tool-btn ${textItalic ? 'active' : ''}`}
                    onClick={() => setTextItalic(!textItalic)}
                    title="Cursiva"
                  >
                    <Italic size={20} />
                  </button>
                  <button
                    className={`tool-btn ${textUnderline ? 'active' : ''}`}
                    onClick={() => setTextUnderline(!textUnderline)}
                    title="Subrayado"
                  >
                    <Underline size={20} />
                  </button>

                  {/* Font Size */}
                  <div className="line-width-control">
                    <input
                      type="range"
                      min="12"
                      max="72"
                      value={fontSize}
                      onChange={(e) => setFontSize(parseInt(e.target.value))}
                      className="line-width-slider-floating"
                      title={`Tamaño: ${fontSize}px`}
                    />
                    <span className="line-width-value">{fontSize}</span>
                  </div>
                </div>

                {/* Separator */}
                <div className="toolbar-separator"></div>
              </>
            )}

            {/* Actions */}
            <div className="toolbar-group">
              <button onClick={undo} className="tool-btn" disabled={historyStep <= 0} title="Deshacer">
                <Undo2 size={20} />
              </button>
              <button onClick={redo} className="tool-btn" disabled={historyStep >= history.length - 1} title="Rehacer">
                <Redo2 size={20} />
              </button>
              <button onClick={clearCanvas} className="tool-btn" title="Limpiar todo">
                <Trash2 size={20} />
              </button>
            </div>

            {/* Separator */}
            <div className="toolbar-separator"></div>

            {/* Slide Navigation */}
            <div className="toolbar-group">
              <button
                onClick={() => goToSlide(Math.max(0, currentSlide - 1))}
                className="tool-btn"
                disabled={currentSlide === 0}
                title="Diapositiva anterior"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="slide-counter-compact">
                {currentSlide + 1}/{slides.length}
              </div>
              <button
                onClick={() => goToSlide(Math.min(slides.length - 1, currentSlide + 1))}
                className="tool-btn"
                disabled={currentSlide === slides.length - 1}
                title="Diapositiva siguiente"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Separator */}
            <div className="toolbar-separator"></div>

            {/* Slide Management */}
            <div className="toolbar-group">
              <button onClick={addSlide} className="tool-btn" title="Nueva diapositiva">
                <Plus size={20} />
              </button>
              <button onClick={deleteSlide} className="tool-btn" disabled={slides.length === 1} title="Eliminar diapositiva">
                <Minus size={20} />
              </button>
              <button onClick={() => setShowSaveModal(true)} className="tool-btn" title="Guardar sesión">
                <Save size={20} />
              </button>
              <button onClick={handleLoadSessions} className="tool-btn" title="Cargar sesión" disabled={isLoadingSessions}>
                <FolderOpen size={20} />
              </button>
            </div>

            {/* Share Content (only in collaborative mode and only for host) */}
            {(() => {
              logger.debug('🔍 Share button render check:', { isCollaborative, isHost, shouldShow: isCollaborative && isHost });
              return null;
            })()}
            {isCollaborative && isHost && (
              <>
                <div className="toolbar-separator"></div>
                <div className="toolbar-group">
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="tool-btn share-btn"
                    title="Compartir contenido"
                  >
                    <Monitor size={20} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Text Input Overlay */}
      {textInput.show && (
        <div
          className="text-input-overlay"
          style={{
            position: 'fixed',
            left: `${textInput.x}px`,
            top: `${textInput.y}px`,
            zIndex: 9999
          }}
        >
          <input
            ref={textInputRef}
            type="text"
            value={textInput.value}
            onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
            onKeyDown={handleTextKeyDown}
            className="text-input-field"
            placeholder="Escribe aquí... (Enter para aplicar)"
            autoFocus
          />
        </div>
      )}

      {/* Sticky Notes and Text Boxes */}
      {objects.map((obj) => {
        const isEditing = editingObject === obj.id;
        const isSelected = selectedObject === obj.id;

        // Check if another user has this object selected
        const otherUserSelection = auth.currentUser && Object.entries(activeSelections || {}).find(
          ([userId, selection]) =>
            userId !== auth.currentUser.uid &&
            selection?.objectId === obj.id &&
            selection?.slideIndex === currentSlide
        );

        if (obj.type === 'stickyNote') {
          return (
            <div
              key={obj.id}
              className={`sticky-note ${isSelected ? 'selected' : ''} ${isEditing ? 'editing' : ''} ${otherUserSelection ? 'selected-by-other' : ''}`}
              style={{
                left: `${obj.x}px`,
                top: `${obj.y}px`,
                width: `${obj.width}px`,
                height: `${obj.height}px`,
                backgroundColor: obj.color,
                cursor: isEditing ? 'text' : (tool === 'select' && isSelected ? 'move' : 'pointer'),
                ...(otherUserSelection && {
                  boxShadow: '0 0 0 3px #3b82f6, 0 8px 20px rgba(59, 130, 246, 0.3)'
                })
              }}
              onClick={(e) => {
                if (tool === 'select') {
                  e.stopPropagation();
                  setSelectedObject(obj.id);

                  // Sync selection to Firebase in collaborative mode
                  if (isCollaborative && collaborativeSessionId && auth.currentUser) {
                    updateActiveSelection(
                      collaborativeSessionId,
                      auth.currentUser.uid,
                      auth.currentUser.displayName || 'Usuario',
                      obj.id,
                      currentSlide
                    );
                  }
                }
              }}
              onDoubleClick={(e) => {
                if (tool === 'select') {
                  e.stopPropagation();
                  setEditingObject(obj.id);
                  setSelectedObject(obj.id);
                }
              }}
              onMouseDown={(e) => {
                if (tool === 'select' && isSelected && !isEditing) {
                  e.stopPropagation();
                  setIsDraggingObject(true);
                  setDragObjectOffset({
                    x: e.clientX - obj.x,
                    y: e.clientY - obj.y
                  });
                }
              }}
            >
              <textarea
                className="sticky-note-textarea"
                value={obj.content}
                onChange={(e) => {
                  const newObjects = objects.map(o =>
                    o.id === obj.id ? { ...o, content: e.target.value } : o
                  );
                  setObjects(newObjects);

                  // Sync to Firebase in collaborative mode
                  if (isCollaborative && collaborativeSessionId) {
                    updateObjectInActiveSession(collaborativeSessionId, currentSlide, obj.id, { content: e.target.value });
                  }
                }}
                onMouseDown={(e) => {
                  if (isEditing) {
                    e.stopPropagation();
                  }
                }}
                onBlur={() => {
                  if (editingObject === obj.id) {
                    setEditingObject(null);
                  }
                }}
                placeholder={isEditing ? "Escribe aquí..." : "Doble click para editar"}
                style={{
                  fontSize: `${obj.fontSize}px`,
                  pointerEvents: isEditing ? 'auto' : 'none',
                  userSelect: isEditing ? 'text' : 'none'
                }}
                readOnly={!isEditing}
              />
              {isSelected && (
                <>
                  <button
                    className="object-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setObjects(objects.filter(o => o.id !== obj.id));
                      setSelectedObject(null);
                      setEditingObject(null);

                      // Sync to Firebase in collaborative mode
                      if (isCollaborative && collaborativeSessionId) {
                        deleteObjectFromActiveSession(collaborativeSessionId, currentSlide, obj.id);
                      }
                    }}
                  >
                    <Trash2 size={14} />
                  </button>

                  {/* Font size controls - visible cuando está seleccionado */}
                  <div className="object-font-controls">
                    <button
                      className="font-control-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setObjects(objects.map(o =>
                          o.id === obj.id ? { ...o, fontSize: Math.max(8, o.fontSize - 2) } : o
                        ));
                      }}
                      title="Reducir tamaño"
                    >
                      <span style={{ fontSize: '12px' }}>A-</span>
                    </button>
                    <span className="font-size-display">{obj.fontSize}px</span>
                    <button
                      className="font-control-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setObjects(objects.map(o =>
                          o.id === obj.id ? { ...o, fontSize: Math.min(72, o.fontSize + 2) } : o
                        ));
                      }}
                      title="Aumentar tamaño"
                    >
                      <span style={{ fontSize: '16px' }}>A+</span>
                    </button>
                  </div>

                  {!isEditing && (
                    <>
                      {/* Resize handles - solo visibles cuando NO está editando */}
                      <div
                        className="resize-handle resize-se"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setResizeStartPos({ x: e.clientX, y: e.clientY });
                          setResizeStartSize({ width: obj.width, height: obj.height, x: obj.x, y: obj.y });
                          setIsResizing(true);
                          setResizeHandle('se');
                        }}
                      />
                      <div
                        className="resize-handle resize-sw"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setResizeStartPos({ x: e.clientX, y: e.clientY });
                          setResizeStartSize({ width: obj.width, height: obj.height, x: obj.x, y: obj.y });
                          setIsResizing(true);
                          setResizeHandle('sw');
                        }}
                      />
                      <div
                        className="resize-handle resize-ne"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setResizeStartPos({ x: e.clientX, y: e.clientY });
                          setResizeStartSize({ width: obj.width, height: obj.height, x: obj.x, y: obj.y });
                          setIsResizing(true);
                          setResizeHandle('ne');
                        }}
                      />
                      <div
                        className="resize-handle resize-nw"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setResizeStartPos({ x: e.clientX, y: e.clientY });
                          setResizeStartSize({ width: obj.width, height: obj.height, x: obj.x, y: obj.y });
                          setIsResizing(true);
                          setResizeHandle('nw');
                        }}
                      />
                    </>
                  )}
                </>
              )}

              {/* Show label if another user has selected this object */}
              {otherUserSelection && (
                <div className="other-user-selection-label">
                  ✏️ {otherUserSelection[1].userName}
                </div>
              )}
            </div>
          );
        } else if (obj.type === 'textBox') {
          return (
            <div
              key={obj.id}
              className={`text-box ${isSelected ? 'selected' : ''} ${isEditing ? 'editing' : ''} ${otherUserSelection ? 'selected-by-other' : ''}`}
              style={{
                left: `${obj.x}px`,
                top: `${obj.y}px`,
                width: `${obj.width}px`,
                height: `${obj.height}px`,
                cursor: isEditing ? 'text' : (tool === 'select' && isSelected ? 'move' : 'pointer'),
                ...(otherUserSelection && {
                  boxShadow: '0 0 0 3px #3b82f6, 0 8px 20px rgba(59, 130, 246, 0.3)'
                })
              }}
              onClick={(e) => {
                if (tool === 'select') {
                  e.stopPropagation();
                  setSelectedObject(obj.id);

                  // Sync selection to Firebase in collaborative mode
                  if (isCollaborative && collaborativeSessionId && auth.currentUser) {
                    updateActiveSelection(
                      collaborativeSessionId,
                      auth.currentUser.uid,
                      auth.currentUser.displayName || 'Usuario',
                      obj.id,
                      currentSlide
                    );
                  }
                }
              }}
              onDoubleClick={(e) => {
                if (tool === 'select') {
                  e.stopPropagation();
                  setEditingObject(obj.id);
                  setSelectedObject(obj.id);
                }
              }}
              onMouseDown={(e) => {
                if (tool === 'select' && isSelected && !isEditing) {
                  e.stopPropagation();
                  setIsDraggingObject(true);
                  setDragObjectOffset({
                    x: e.clientX - obj.x,
                    y: e.clientY - obj.y
                  });
                }
              }}
            >
              <textarea
                className="text-box-textarea"
                value={obj.content}
                onChange={(e) => {
                  const newObjects = objects.map(o =>
                    o.id === obj.id ? { ...o, content: e.target.value } : o
                  );
                  setObjects(newObjects);

                  // Sync to Firebase in collaborative mode
                  if (isCollaborative && collaborativeSessionId) {
                    updateObjectInActiveSession(collaborativeSessionId, currentSlide, obj.id, { content: e.target.value });
                  }
                }}
                onMouseDown={(e) => {
                  if (isEditing) {
                    e.stopPropagation();
                  }
                }}
                onBlur={() => {
                  if (editingObject === obj.id) {
                    setEditingObject(null);
                  }
                }}
                placeholder={isEditing ? "Escribe aquí..." : "Doble click para editar"}
                style={{
                  fontSize: `${obj.fontSize}px`,
                  fontWeight: obj.bold ? 'bold' : 'normal',
                  fontStyle: obj.italic ? 'italic' : 'normal',
                  textDecoration: obj.underline ? 'underline' : 'none',
                  pointerEvents: isEditing ? 'auto' : 'none',
                  userSelect: isEditing ? 'text' : 'none'
                }}
                readOnly={!isEditing}
              />
              {isSelected && (
                <>
                  <button
                    className="object-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setObjects(objects.filter(o => o.id !== obj.id));
                      setSelectedObject(null);
                      setEditingObject(null);

                      // Sync to Firebase in collaborative mode
                      if (isCollaborative && collaborativeSessionId) {
                        deleteObjectFromActiveSession(collaborativeSessionId, currentSlide, obj.id);
                      }
                    }}
                  >
                    <Trash2 size={14} />
                  </button>

                  {/* Font size controls - visible cuando está seleccionado */}
                  <div className="object-font-controls">
                    <button
                      className="font-control-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setObjects(objects.map(o =>
                          o.id === obj.id ? { ...o, fontSize: Math.max(8, o.fontSize - 2) } : o
                        ));
                      }}
                      title="Reducir tamaño"
                    >
                      <span style={{ fontSize: '12px' }}>A-</span>
                    </button>
                    <span className="font-size-display">{obj.fontSize}px</span>
                    <button
                      className="font-control-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setObjects(objects.map(o =>
                          o.id === obj.id ? { ...o, fontSize: Math.min(72, o.fontSize + 2) } : o
                        ));
                      }}
                      title="Aumentar tamaño"
                    >
                      <span style={{ fontSize: '16px' }}>A+</span>
                    </button>
                  </div>

                  {!isEditing && (
                    <>
                      {/* Resize handles - solo visibles cuando NO está editando */}
                      <div
                        className="resize-handle resize-se"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setResizeStartPos({ x: e.clientX, y: e.clientY });
                          setResizeStartSize({ width: obj.width, height: obj.height, x: obj.x, y: obj.y });
                          setIsResizing(true);
                          setResizeHandle('se');
                        }}
                      />
                      <div
                        className="resize-handle resize-sw"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setResizeStartPos({ x: e.clientX, y: e.clientY });
                          setResizeStartSize({ width: obj.width, height: obj.height, x: obj.x, y: obj.y });
                          setIsResizing(true);
                          setResizeHandle('sw');
                        }}
                      />
                      <div
                        className="resize-handle resize-ne"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setResizeStartPos({ x: e.clientX, y: e.clientY });
                          setResizeStartSize({ width: obj.width, height: obj.height, x: obj.x, y: obj.y });
                          setIsResizing(true);
                          setResizeHandle('ne');
                        }}
                      />
                      <div
                        className="resize-handle resize-nw"
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setResizeStartPos({ x: e.clientX, y: e.clientY });
                          setResizeStartSize({ width: obj.width, height: obj.height, x: obj.x, y: obj.y });
                          setIsResizing(true);
                          setResizeHandle('nw');
                        }}
                      />
                    </>
                  )}
                </>
              )}

              {/* Show label if another user has selected this object */}
              {otherUserSelection && (
                <div className="other-user-selection-label">
                  ✏️ {otherUserSelection[1].userName}
                </div>
              )}
            </div>
          );
        }
        return null;
      })}

      {/* Save Session Modal */}
      {showSaveModal && (
        <div className="whiteboard-modal-overlay" onClick={() => setShowSaveModal(false)}>
          <div className="whiteboard-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="whiteboard-modal-title">Guardar Sesión</h3>
            <input
              type="text"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              placeholder={`Pizarra ${new Date().toLocaleDateString()}`}
              className="whiteboard-modal-input"
              autoFocus
            />
            <div className="whiteboard-modal-actions">
              <BaseButton onClick={() => setShowSaveModal(false)} variant="secondary">
                Cancelar
              </BaseButton>
              <BaseButton onClick={handleSaveSession} variant="primary">
                {currentSessionId ? 'Actualizar' : 'Guardar'}
              </BaseButton>
            </div>
          </div>
        </div>
      )}

      {/* Load Session Modal */}
      {showLoadModal && (
        <div className="whiteboard-modal-overlay" onClick={() => setShowLoadModal(false)}>
          <div className="whiteboard-modal large" onClick={(e) => e.stopPropagation()}>
            <h3 className="whiteboard-modal-title">Cargar Sesión</h3>
            {savedSessions.length === 0 ? (
              <p className="whiteboard-modal-empty">No hay sesiones guardadas</p>
            ) : (
              <div className="whiteboard-sessions-list">
                {savedSessions.map((session) => (
                  <div key={session.id} className="whiteboard-session-item">
                    <div className="whiteboard-session-info">
                      <h4 className="whiteboard-session-title">{session.title}</h4>
                      <p className="whiteboard-session-meta">
                        {session.slides?.length || 0} diapositivas •
                        {session.updatedAt ? new Date(session.updatedAt.seconds * 1000).toLocaleDateString() : 'Sin fecha'}
                      </p>
                    </div>
                    <BaseButton
                      onClick={() => loadSession(session)}
                      variant="primary"
                    >
                      Cargar
                    </BaseButton>
                  </div>
                ))}
              </div>
            )}
            <div className="whiteboard-modal-actions">
              <BaseButton onClick={() => setShowLoadModal(false)} variant="secondary">
                Cerrar
              </BaseButton>
            </div>
          </div>
        </div>
      )}

      {/* Share Content Modal */}
      {showShareModal && (
        <div className="whiteboard-modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="whiteboard-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="whiteboard-modal-title">Compartir Contenido</h3>

            <div className="share-content-type-selector">
              <BaseButton
                variant={shareContentType === 'video' ? 'primary' : 'outline'}
                onClick={() => setShareContentType('video')}
                icon={Film}
              >
                Video
              </BaseButton>
              <BaseButton
                variant={shareContentType === 'pdf' ? 'primary' : 'outline'}
                onClick={() => setShareContentType('pdf')}
                icon={FileText}
              >
                PDF
              </BaseButton>
              <BaseButton
                variant={shareContentType === 'image' ? 'primary' : 'outline'}
                onClick={() => setShareContentType('image')}
                icon={FileImage}
              >
                Imagen
              </BaseButton>
            </div>

            <input
              type="url"
              value={shareContentUrl}
              onChange={(e) => setShareContentUrl(e.target.value)}
              placeholder={`URL del ${shareContentType === 'video' ? 'video (YouTube, Vimeo, MP4)' : shareContentType === 'pdf' ? 'PDF' : 'imagen'}`}
              className="whiteboard-modal-input"
              autoFocus
            />

            <div className="share-content-info">
              <p>💡 El contenido se sincronizará en tiempo real con todos los participantes</p>
              {shareContentType === 'video' && (
                <p>📹 Solo el presentador puede controlar la reproducción</p>
              )}
              {shareContentType === 'pdf' && (
                <p>📄 Solo el presentador puede cambiar de página</p>
              )}
            </div>

            <div className="whiteboard-modal-actions">
              <BaseButton onClick={() => setShowShareModal(false)} variant="secondary">
                Cancelar
              </BaseButton>
              <BaseButton onClick={handleShareContent} variant="primary">
                Compartir
              </BaseButton>
            </div>
          </div>
        </div>
      )}

      {/* Shared Content Viewer (for collaborative sessions) */}
      {isCollaborative && sharedContent && (
        <SharedContentViewer
          sharedContent={sharedContent}
          sessionId={collaborativeSessionId}
          onClose={() => clearSharedContent(collaborativeSessionId)}
          isHost={isHost}
        />
      )}
    </div>
  );
}

export default Whiteboard;
