# 🧪 Guía de Testing para XIWENAPP

## 📋 Tabla de Contenidos

- [Instalación](#instalación)
- [Configuración](#configuración)
- [Ejecutar Tests](#ejecutar-tests)
- [Escribir Tests](#escribir-tests)
- [Cobertura de Tests](#cobertura-de-tests)
- [Mejores Prácticas](#mejores-prácticas)

---

## 🚀 Instalación

### 1. Instalar dependencias de testing

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/ui
```

### 2. Actualizar package.json

Agregar estos scripts a `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## ⚙️ Configuración

La configuración de Vitest ya está creada en:

- `vitest.config.js` - Configuración principal
- `src/test/setup.js` - Setup global para todos los tests

---

## 🏃 Ejecutar Tests

### Modo Watch (desarrollo)
```bash
npm test
```

### Ejecutar una vez (CI/CD)
```bash
npm run test:run
```

### UI Mode (interfaz visual)
```bash
npm run test:ui
```

### Con cobertura de código
```bash
npm run test:coverage
```

### Ejecutar un archivo específico
```bash
npm test UserAvatar.test.jsx
```

### Ejecutar tests que coincidan con un patrón
```bash
npm test -- -t "debe mostrar badge"
```

---

## ✍️ Escribir Tests

### Estructura básica

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MiComponente from '../MiComponente';

describe('MiComponente', () => {
  it('debe renderizar correctamente', () => {
    render(<MiComponente />);
    expect(screen.getByText('Hola')).toBeInTheDocument();
  });
});
```

### Testing de componentes UserAvatar

Ejemplo completo en `src/components/__tests__/UserAvatar.test.jsx`

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import UserAvatar from '../UserAvatar';

describe('UserAvatar', () => {
  it('debe mostrar iniciales', () => {
    render(<UserAvatar name="John Doe" />);
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('debe mostrar badge de estado online', () => {
    const { container } = render(
      <UserAvatar
        name="Test"
        status="online"
        showStatusBadge={true}
      />
    );
    const badge = container.querySelector('.bg-green-500');
    expect(badge).toBeInTheDocument();
  });
});
```

### Mocking de Firebase

```jsx
import { vi } from 'vitest';
import * as firestore from '../../firebase/firestore';

// Mock al inicio del archivo
vi.mock('../../firebase/firestore', () => ({
  getUserAvatar: vi.fn(),
  getUserBanner: vi.fn()
}));

// Usar en el test
firestore.getUserAvatar.mockResolvedValue('https://test.com/avatar.jpg');
```

---

## 📊 Cobertura de Tests

### Generar reporte de cobertura

```bash
npm run test:coverage
```

El reporte se generará en `coverage/index.html`

### Objetivos de cobertura

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

### Ver cobertura actual

```bash
open coverage/index.html  # Mac
start coverage/index.html # Windows
xdg-open coverage/index.html # Linux
```

---

## 🎯 Mejores Prácticas

### 1. Organización de archivos

```
src/
├── components/
│   ├── UserAvatar.jsx
│   └── __tests__/
│       └── UserAvatar.test.jsx
```

### 2. Nombrar tests descriptivamente

✅ **Bien:**
```jsx
it('debe mostrar badge verde cuando status es "online"', () => {
  // test...
});
```

❌ **Mal:**
```jsx
it('test badge', () => {
  // test...
});
```

### 3. Seguir patrón AAA (Arrange, Act, Assert)

```jsx
it('debe llamar onClick cuando se hace click', () => {
  // Arrange
  const handleClick = vi.fn();
  render(<UserAvatar onClick={handleClick} clickable={true} />);

  // Act
  const avatar = screen.getByRole('button');
  avatar.click();

  // Assert
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### 4. Limpiar mocks después de cada test

```jsx
import { beforeEach } from 'vitest';

beforeEach(() => {
  vi.clearAllMocks();
});
```

### 5. Testing de accesibilidad

```jsx
it('debe tener aria-label correcto', () => {
  render(<UserAvatar status="online" showStatusBadge={true} />);
  expect(screen.getByLabelText('En línea')).toBeInTheDocument();
});
```

### 6. Testing de estados asíncronos

```jsx
import { waitFor } from '@testing-library/react';

it('debe cargar avatar desde Firebase', async () => {
  firestore.getUserAvatar.mockResolvedValue('https://test.com/img.jpg');

  render(<UserAvatar userId="user123" />);

  await waitFor(() => {
    expect(screen.getByAlt('Avatar')).toHaveAttribute('src', 'https://test.com/img.jpg');
  });
});
```

---

## 🔍 Testing de Casos Específicos

### Testing de React.memo

```jsx
it('no debe re-renderizar cuando props no cambian', () => {
  const { rerender } = render(<UserAvatar name="Test" />);
  const initial = screen.getByText('TE');

  rerender(<UserAvatar name="Test" />);
  const updated = screen.getByText('TE');

  expect(initial).toBe(updated);
});
```

### Testing de Loading States

```jsx
it('debe mostrar skeleton durante la carga', async () => {
  firestore.getUserAvatar.mockImplementation(
    () => new Promise(resolve => setTimeout(() => resolve('test'), 100))
  );

  const { container } = render(<UserAvatar userId="user123" />);

  expect(container.querySelector('.animate-pulse')).toBeInTheDocument();

  await waitFor(() => {
    expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();
  });
});
```

---

## 📚 Recursos

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
- [User Event Documentation](https://testing-library.com/docs/user-event/intro)

---

## ✅ Checklist de Testing

Antes de hacer commit, asegúrate de:

- [ ] Todos los tests pasan: `npm run test:run`
- [ ] Cobertura > 80%: `npm run test:coverage`
- [ ] Tests descriptivos y bien organizados
- [ ] Mocks limpiados después de cada test
- [ ] Testing de casos edge (errores, null, undefined)
- [ ] Testing de accesibilidad (aria-labels, alt text)
- [ ] No hay console.error en tests

---

**Última actualización:** Noviembre 2024
