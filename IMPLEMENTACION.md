# 🎨 XIWENAPP - Sistema de Diseño

## 📦 Archivos incluidos:

1. **globals.css** - Archivo CSS global con variables y componentes base
2. **tailwind.config.js** - Configuración de Tailwind personalizada
3. **Components.jsx** - Componentes React reutilizables

---

## 🚀 Cómo implementar:

### Paso 1: Reemplazar archivos

1. **globals.css**
   - Ubicación: `src/globals.css` (o `src/index.css`)
   - Acción: Reemplaza tu CSS actual con este archivo

2. **tailwind.config.js**
   - Ubicación: Raíz del proyecto (donde está package.json)
   - Acción: Reemplaza tu tailwind.config.js actual

3. **Components.jsx**
   - Ubicación: `src/components/common/` (crea la carpeta si no existe)
   - Acción: Guarda este archivo como `src/components/common/Components.jsx`

### Paso 2: Importar globals.css en tu proyecto

En tu archivo `src/main.jsx`:

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './globals.css'; // ← Agregar esta línea

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### Paso 3: Usar los componentes

Importa los componentes donde los necesites:

```javascript
import { Button, Card, Input, Badge } from './components/common/Components';

function MiComponente() {
  return (
    <Card title="Mi Card">
      <Input label="Nombre" placeholder="Ingresa tu nombre" />
      <Badge variant="success">Activo</Badge>
      <Button variant="primary">Guardar</Button>
    </Card>
  );
}
```

---

## 🎨 Paleta de colores:

### Colores principales:
- **Primary (Azul)**: `bg-primary`, `text-primary`
- **Secondary (Verde)**: `bg-secondary`, `text-secondary`
- **Accent (Naranja)**: `bg-accent`, `text-accent`

### Colores de rol:
- **Teacher (Púrpura)**: `bg-teacher`, `text-teacher`
- **Student (Azul)**: `bg-student`, `text-student`

### Colores de estado:
- **Success**: `bg-success`, `text-success`
- **Warning**: `bg-warning`, `text-warning`
- **Error**: `bg-error`, `text-error`
- **Info**: `bg-info`, `text-info`

---

## 📐 Componentes disponibles:

### 1. Button
```jsx
<Button variant="primary" size="lg">Guardar</Button>
<Button variant="secondary">Continuar</Button>
<Button variant="danger" size="sm">Eliminar</Button>
<Button variant="outline">Cancelar</Button>
```

Variantes: `primary`, `secondary`, `accent`, `danger`, `outline`, `ghost`  
Tamaños: `sm`, `md` (default), `lg`

### 2. Card
```jsx
<Card title="Título de la Card">
  <p>Contenido aquí...</p>
</Card>
```

### 3. Input
```jsx
<Input 
  label="Nombre" 
  required 
  value={name}
  onChange={(e) => setName(e.target.value)}
  error={errors.name}
/>
```

### 4. Badge
```jsx
<Badge variant="success">Activo</Badge>
<Badge variant="warning">Pendiente</Badge>
<Badge variant="teacher">Profesor</Badge>
```

Variantes: `success`, `warning`, `error`, `info`, `teacher`, `student`

### 5. Alert
```jsx
<Alert variant="success" onClose={() => setShowAlert(false)}>
  ¡Operación exitosa!
</Alert>
```

### 6. Modal
```jsx
<Modal 
  isOpen={showModal} 
  onClose={() => setShowModal(false)}
  title="Confirmar"
  footer={
    <>
      <Button variant="ghost" onClick={close}>Cancelar</Button>
      <Button variant="danger" onClick={confirm}>Confirmar</Button>
    </>
  }
>
  <p>¿Estás seguro?</p>
</Modal>
```

### 7. Spinner
```jsx
<Spinner size="lg" />
```

### 8. Avatar
```jsx
<Avatar src="/path/image.jpg" size="lg" />
<Avatar fallback="JP" size="md" />
```

### 9. StatCard (para dashboards)
```jsx
<StatCard 
  title="Total Estudiantes" 
  value="45" 
  trend={12}
  color="primary"
/>
```

### 10. EmptyState
```jsx
<EmptyState 
  title="No hay datos"
  description="Comienza agregando elementos"
  action={<Button onClick={add}>Agregar</Button>}
/>
```

---

## 💡 Clases CSS disponibles:

### Clases de utilidad personalizadas:
```css
.text-gradient       /* Texto con gradiente */
.shadow-elevated     /* Sombra elevada */
.backdrop-blur       /* Fondo difuminado */
.animate-fade-in     /* Animación fade in */
.animate-slide-in    /* Animación slide in */
```

### Clases base (sin Tailwind):
```css
.btn                 /* Botón base */
.card                /* Card base */
.input               /* Input base */
.badge               /* Badge base */
.alert               /* Alert base */
```

---

## 🔄 Migrar componentes existentes:

### Antes (sin sistema de diseño):
```jsx
<button 
  className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
  onClick={handleClick}
>
  Guardar
</button>
```

### Después (con sistema de diseño):
```jsx
<Button variant="primary" onClick={handleClick}>
  Guardar
</Button>
```

**Beneficios:**
- ✅ Más limpio y legible
- ✅ Consistente en toda la app
- ✅ Fácil de mantener
- ✅ Cambios globales desde un solo lugar

---

## 🎯 Ejemplo completo de uso:

```jsx
import React, { useState } from 'react';
import { 
  Button, 
  Card, 
  Input, 
  Badge, 
  Alert,
  Modal 
} from './components/common/Components';

function StudentForm() {
  const [name, setName] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Lógica de guardado...
    setShowSuccess(true);
  };

  return (
    <div className="container py-8">
      {showSuccess && (
        <Alert 
          variant="success" 
          onClose={() => setShowSuccess(false)}
        >
          ¡Estudiante guardado exitosamente!
        </Alert>
      )}

      <Card title="Agregar Estudiante">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nombre completo"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Juan Pérez"
          />

          <div className="flex items-center gap-2">
            <Badge variant="student">Estudiante</Badge>
            <Badge variant="success">Activo</Badge>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="ghost" type="button">
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              Guardar
            </Button>
          </div>
        </form>
      </Card>

      <Modal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Confirmar eliminación"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Eliminar
            </Button>
          </>
        }
      >
        <p>¿Estás seguro de eliminar este estudiante?</p>
      </Modal>
    </div>
  );
}
```

---

## 🔧 Personalización:

### Cambiar colores globales:

En `globals.css`, modifica las variables:

```css
:root {
  --color-primary: #3b82f6;     /* Cambia este valor */
  --color-secondary: #10b981;   /* Cambia este valor */
  /* ... etc */
}
```

Todos los componentes se actualizarán automáticamente.

### Agregar nuevos colores:

En `tailwind.config.js`:

```javascript
colors: {
  primary: { /* ... */ },
  miColor: {
    DEFAULT: '#123456',
    light: '#234567',
    dark: '#012345',
  }
}
```

Luego úsalo: `bg-miColor`, `text-miColor-light`

---

## 📱 Responsive:

Todos los componentes son responsive por defecto. Usa las clases de Tailwind:

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Card>...</Card>
  <Card>...</Card>
  <Card>...</Card>
</div>
```

---

## ✅ Checklist de implementación:

- [ ] Reemplazar `globals.css`
- [ ] Reemplazar `tailwind.config.js`
- [ ] Crear carpeta `src/components/common/`
- [ ] Guardar `Components.jsx`
- [ ] Importar `globals.css` en `main.jsx`
- [ ] Probar un componente (ej: Button)
- [ ] Migrar componentes existentes gradualmente

---

## 🎉 ¡Listo!

Ya tienes un sistema de diseño completo y profesional. Ahora puedes:

1. **Usar los componentes** en lugar de escribir clases manualmente
2. **Cambiar colores globalmente** desde un solo lugar
3. **Mantener consistencia** en toda la aplicación
4. **Escalar fácilmente** agregando nuevos componentes

---

## 💬 Soporte:

Si tienes dudas sobre cómo usar algún componente o necesitas crear uno nuevo, ¡pregúntame!
