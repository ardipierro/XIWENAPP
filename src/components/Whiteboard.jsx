import { useState, useRef, useEffect } from 'react';
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
  Palette
} from 'lucide-react';
import './Whiteboard.css';

function Whiteboard({ onBack }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pencil'); // pencil, line, arrow, rectangle, circle, text, eraser, move
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [slides, setSlides] = useState([{ id: 1, data: null, thumbnail: null }]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [history, setHistory] = useState([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [textInput, setTextInput] = useState({ show: false, x: 0, y: 0, value: '' });
  const textInputRef = useRef(null);

  // Colores predefinidos
  const presetColors = [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF',
    '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080',
    '#808080', '#C0C0C0'
  ];

  // Inicializar canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Establecer tamaño del canvas
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;

      // Restaurar contenido si existe
      if (slides[currentSlide].data) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
        };
        img.src = slides[currentSlide].data;
      } else {
        // Fondo blanco por defecto
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
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

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';

    if (tool === 'pencil') {
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

    if (tool === 'line') {
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (tool === 'arrow') {
      const headLength = 20;
      const angle = Math.atan2(pos.y - startPos.y, pos.x - startPos.x);

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
    } else if (tool === 'rectangle') {
      ctx.strokeRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
    } else if (tool === 'circle') {
      const radius = Math.sqrt(Math.pow(pos.x - startPos.x, 2) + Math.pow(pos.y - startPos.y, 2));
      ctx.beginPath();
      ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
      ctx.stroke();
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
    ctx.font = `${lineWidth * 10}px Arial`;
    ctx.fillStyle = color;
    ctx.fillText(textInput.value, textInput.canvasX, textInput.canvasY);

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
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
  };

  // Guardar slide actual
  const saveCurrentSlide = () => {
    const canvas = canvasRef.current;
    const data = canvas.toDataURL();
    const thumbnail = canvas.toDataURL('image/png', 0.1);
    const newSlides = [...slides];
    newSlides[currentSlide] = { ...newSlides[currentSlide], data, thumbnail };
    setSlides(newSlides);
  };

  // Agregar nuevo slide
  const addSlide = () => {
    saveCurrentSlide();
    const newSlide = { id: slides.length + 1, data: null, thumbnail: null };
    setSlides([...slides, newSlide]);
    setCurrentSlide(slides.length);
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

  return (
    <div className="whiteboard-container">
      {/* Header */}
      <div className="whiteboard-header">
        <button onClick={onBack} className="btn btn-ghost">
          ← Volver
        </button>
        <h1 className="whiteboard-title">Pizarra Interactiva</h1>
        <div className="whiteboard-actions">
          <input
            type="file"
            accept=".json"
            onChange={loadPresentation}
            style={{ display: 'none' }}
            id="load-presentation"
          />
          <label htmlFor="load-presentation" className="btn btn-secondary" title="Cargar presentación">
            <Upload size={18} />
          </label>
          <button onClick={downloadPresentation} className="btn btn-secondary" title="Descargar presentación">
            <Download size={18} />
          </button>
        </div>
      </div>

      <div className="whiteboard-main">
        {/* Toolbar */}
        <div className="whiteboard-toolbar">
          <div className="toolbar-section">
            <h3 className="toolbar-label">Herramientas</h3>
            <button
              className={`toolbar-btn ${tool === 'pencil' ? 'active' : ''}`}
              onClick={() => setTool('pencil')}
              title="Lápiz"
            >
              <Pencil size={20} />
            </button>
            <button
              className={`toolbar-btn ${tool === 'line' ? 'active' : ''}`}
              onClick={() => setTool('line')}
              title="Línea"
            >
              <Minus size={20} />
            </button>
            <button
              className={`toolbar-btn ${tool === 'arrow' ? 'active' : ''}`}
              onClick={() => setTool('arrow')}
              title="Flecha"
            >
              <ArrowRight size={20} />
            </button>
            <button
              className={`toolbar-btn ${tool === 'rectangle' ? 'active' : ''}`}
              onClick={() => setTool('rectangle')}
              title="Rectángulo"
            >
              <Square size={20} />
            </button>
            <button
              className={`toolbar-btn ${tool === 'circle' ? 'active' : ''}`}
              onClick={() => setTool('circle')}
              title="Círculo"
            >
              <Circle size={20} />
            </button>
            <button
              className={`toolbar-btn ${tool === 'text' ? 'active' : ''}`}
              onClick={() => setTool('text')}
              title="Texto"
            >
              <Type size={20} />
            </button>
            <button
              className={`toolbar-btn ${tool === 'eraser' ? 'active' : ''}`}
              onClick={() => setTool('eraser')}
              title="Borrador"
            >
              <Eraser size={20} />
            </button>
          </div>

          <div className="toolbar-section">
            <h3 className="toolbar-label">Color</h3>
            <button
              className="toolbar-btn color-picker-btn"
              onClick={() => setShowColorPicker(!showColorPicker)}
              title="Selector de color"
            >
              <Palette size={20} />
              <div className="color-preview" style={{ backgroundColor: color }}></div>
            </button>
            {showColorPicker && (
              <div className="color-picker-dropdown">
                {presetColors.map((c) => (
                  <button
                    key={c}
                    className={`color-swatch ${color === c ? 'active' : ''}`}
                    style={{ backgroundColor: c }}
                    onClick={() => { setColor(c); setShowColorPicker(false); }}
                    title={c}
                  />
                ))}
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="color-input"
                />
              </div>
            )}
          </div>

          <div className="toolbar-section">
            <h3 className="toolbar-label">Grosor</h3>
            <input
              type="range"
              min="1"
              max="20"
              value={lineWidth}
              onChange={(e) => setLineWidth(parseInt(e.target.value))}
              className="line-width-slider"
            />
            <span className="line-width-label">{lineWidth}px</span>
          </div>

          <div className="toolbar-section">
            <h3 className="toolbar-label">Acciones</h3>
            <button onClick={undo} className="toolbar-btn" disabled={historyStep <= 0} title="Deshacer">
              <Undo2 size={20} />
            </button>
            <button onClick={redo} className="toolbar-btn" disabled={historyStep >= history.length - 1} title="Rehacer">
              <Redo2 size={20} />
            </button>
            <button onClick={clearCanvas} className="toolbar-btn" title="Limpiar">
              <Trash2 size={20} />
            </button>
          </div>
        </div>

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
        </div>

        {/* Slides Panel */}
        <div className="whiteboard-slides">
          <div className="slides-header">
            <h3 className="slides-title">Diapositivas</h3>
            <button onClick={addSlide} className="btn-icon" title="Nueva diapositiva">
              <Plus size={18} />
            </button>
          </div>
          <div className="slides-list">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                className={`slide-item ${currentSlide === index ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
              >
                <div className="slide-number">{index + 1}</div>
                {slide.thumbnail ? (
                  <img src={slide.thumbnail} alt={`Slide ${index + 1}`} className="slide-thumbnail" />
                ) : (
                  <div className="slide-thumbnail-empty">
                    <span>Vacía</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="slides-footer">
            <button onClick={deleteSlide} className="btn btn-danger btn-sm" disabled={slides.length === 1}>
              <Trash2 size={16} /> Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="whiteboard-navigation">
        <button
          onClick={() => goToSlide(Math.max(0, currentSlide - 1))}
          className="nav-btn"
          disabled={currentSlide === 0}
        >
          <ChevronLeft size={20} />
        </button>
        <span className="slide-counter">
          {currentSlide + 1} / {slides.length}
        </span>
        <button
          onClick={() => goToSlide(Math.min(slides.length - 1, currentSlide + 1))}
          className="nav-btn"
          disabled={currentSlide === slides.length - 1}
        >
          <ChevronRight size={20} />
        </button>
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
    </div>
  );
}

export default Whiteboard;
