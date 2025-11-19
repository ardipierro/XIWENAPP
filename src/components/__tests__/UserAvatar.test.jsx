/**
 * @fileoverview Tests unitarios para UserAvatar
 * @module components/__tests__/UserAvatar.test
 *
 * Para ejecutar estos tests:
 * 1. Instalar vitest: npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
 * 2. Agregar a package.json: "test": "vitest", "test:ui": "vitest --ui"
 * 3. Crear vitest.config.js (ver archivo de configuración)
 * 4. Ejecutar: npm test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import UserAvatar from '../UserAvatar';
import * as firestore from '../../firebase/firestore';

// Mock de Firebase
vi.mock('../../firebase/firestore', () => ({
  getUserAvatar: vi.fn(),
  getUserBanner: vi.fn()
}));

// Mock de logger
vi.mock('../../utils/logger', () => ({
  default: {
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  }
}));

// Mock de AVATARS
vi.mock('../AvatarSelector', () => ({
  AVATARS: {
    default: { icon: () => null, label: 'Usuario' },
    student1: { icon: () => null, label: 'Estudiante' },
    teacher: { icon: () => null, label: 'Profesor' }
  }
}));

describe('UserAvatar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ==========================================
  // TESTS BÁSICOS - RENDERIZADO
  // ==========================================

  describe('Renderizado básico', () => {
    it('debe renderizar sin errores con props mínimas', () => {
      render(<UserAvatar name="John Doe" email="john@test.com" />);
      expect(screen.getByText('JD')).toBeInTheDocument(); // Iniciales
    });

    it('debe mostrar iniciales cuando no hay imagen', () => {
      render(<UserAvatar name="María García" email="maria@test.com" />);
      expect(screen.getByText('MG')).toBeInTheDocument();
    });

    it('debe mostrar solo primera inicial de email si no hay nombre', () => {
      render(<UserAvatar email="test@example.com" />);
      expect(screen.getByText('TE')).toBeInTheDocument();
    });

    it('debe mostrar "??" cuando no hay nombre ni email', () => {
      render(<UserAvatar showInitials={true} />);
      expect(screen.getByText('??')).toBeInTheDocument();
    });
  });

  // ==========================================
  // TESTS DE TAMAÑOS
  // ==========================================

  describe('Tamaños del avatar', () => {
    it('debe aplicar clase de tamaño xs correctamente', () => {
      const { container } = render(<UserAvatar size="xs" name="Test" />);
      const avatar = container.querySelector('.w-6');
      expect(avatar).toBeInTheDocument();
    });

    it('debe aplicar clase de tamaño sm correctamente', () => {
      const { container } = render(<UserAvatar size="sm" name="Test" />);
      const avatar = container.querySelector('.w-8');
      expect(avatar).toBeInTheDocument();
    });

    it('debe aplicar clase de tamaño md por defecto', () => {
      const { container } = render(<UserAvatar name="Test" />);
      const avatar = container.querySelector('.w-12');
      expect(avatar).toBeInTheDocument();
    });

    it('debe aplicar clase de tamaño xl correctamente', () => {
      const { container } = render(<UserAvatar size="xl" name="Test" />);
      const avatar = container.querySelector('.w-24');
      expect(avatar).toBeInTheDocument();
    });
  });

  // ==========================================
  // TESTS DE IMÁGENES
  // ==========================================

  describe('Carga de imágenes', () => {
    it('debe mostrar imagen cuando avatarUrl es proporcionado', () => {
      const testUrl = 'https://example.com/avatar.jpg';
      render(<UserAvatar avatarUrl={testUrl} name="Test" />);
      const img = screen.getByAlt('Test');
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', testUrl);
    });

    it('debe cargar avatar desde Firebase cuando se proporciona userId', async () => {
      firestore.getUserAvatar.mockResolvedValue('https://firebase.com/avatar.jpg');

      render(<UserAvatar userId="user123" name="Test User" />);

      await waitFor(() => {
        const img = screen.getByAlt('Test User');
        expect(img).toHaveAttribute('src', 'https://firebase.com/avatar.jpg');
      });

      expect(firestore.getUserAvatar).toHaveBeenCalledWith('user123');
    });

    it('debe manejar error de carga de avatar desde Firebase', async () => {
      firestore.getUserAvatar.mockRejectedValue(new Error('Firebase error'));

      render(<UserAvatar userId="user123" name="Test" />);

      await waitFor(() => {
        // Debería mostrar iniciales como fallback
        expect(screen.getByText('TE')).toBeInTheDocument();
      });
    });

    it('debe cambiar a fallback cuando imagen falla al cargar', () => {
      const { container } = render(
        <UserAvatar avatarUrl="https://invalid.com/img.jpg" name="Test" />
      );

      const img = container.querySelector('img');
      if (img) {
        // Simular error de carga
        img.onerror();
      }

      // Debería mostrar iniciales después del error
      expect(screen.getByText('TE')).toBeInTheDocument();
    });
  });

  // ==========================================
  // TESTS DE BADGES DE ESTADO
  // ==========================================

  describe('Badges de estado', () => {
    it('debe mostrar badge verde cuando status es "online"', () => {
      const { container } = render(
        <UserAvatar name="Test" status="online" showStatusBadge={true} />
      );
      const badge = container.querySelector('.bg-green-500');
      expect(badge).toBeInTheDocument();
    });

    it('debe mostrar badge rojo cuando status es "busy"', () => {
      const { container } = render(
        <UserAvatar name="Test" status="busy" showStatusBadge={true} />
      );
      const badge = container.querySelector('.bg-red-500');
      expect(badge).toBeInTheDocument();
    });

    it('debe mostrar badge ámbar cuando status es "away"', () => {
      const { container } = render(
        <UserAvatar name="Test" status="away" showStatusBadge={true} />
      );
      const badge = container.querySelector('.bg-amber-500');
      expect(badge).toBeInTheDocument();
    });

    it('no debe mostrar badge cuando showStatusBadge es false', () => {
      const { container } = render(
        <UserAvatar name="Test" status="online" showStatusBadge={false} />
      );
      const badge = container.querySelector('.bg-green-500');
      expect(badge).not.toBeInTheDocument();
    });

    it('debe tener aria-label correcto para accesibilidad', () => {
      render(
        <UserAvatar name="Test" status="online" showStatusBadge={true} />
      );
      expect(screen.getByLabelText('En línea')).toBeInTheDocument();
    });
  });

  // ==========================================
  // TESTS DE BADGES DE NOTIFICACIONES
  // ==========================================

  describe('Badges de notificaciones', () => {
    it('debe mostrar contador de notificaciones cuando > 0', () => {
      render(
        <UserAvatar
          name="Test"
          notificationCount={5}
          showNotificationBadge={true}
        />
      );
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('debe mostrar "99+" cuando notificationCount > 99', () => {
      render(
        <UserAvatar
          name="Test"
          notificationCount={150}
          showNotificationBadge={true}
        />
      );
      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('no debe mostrar badge cuando notificationCount es 0', () => {
      const { container } = render(
        <UserAvatar
          name="Test"
          notificationCount={0}
          showNotificationBadge={true}
        />
      );
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('no debe mostrar badge cuando showNotificationBadge es false', () => {
      const { container } = render(
        <UserAvatar
          name="Test"
          notificationCount={5}
          showNotificationBadge={false}
        />
      );
      expect(screen.queryByText('5')).not.toBeInTheDocument();
    });

    it('debe tener aria-label correcto para accesibilidad', () => {
      render(
        <UserAvatar
          name="Test"
          notificationCount={3}
          showNotificationBadge={true}
        />
      );
      expect(screen.getByLabelText('3 notificaciones')).toBeInTheDocument();
    });
  });

  // ==========================================
  // TESTS DE BANNER
  // ==========================================

  describe('Banner de fondo', () => {
    it('debe cargar banner desde Firebase cuando bannerId es proporcionado', async () => {
      firestore.getUserBanner.mockResolvedValue('https://firebase.com/banner.jpg');

      const { container } = render(
        <UserAvatar
          name="Test"
          showBanner={true}
          bannerId="user123"
        />
      );

      await waitFor(() => {
        const bannerImg = container.querySelector('img[alt="Banner"]');
        expect(bannerImg).toBeInTheDocument();
        expect(bannerImg).toHaveAttribute('src', 'https://firebase.com/banner.jpg');
      });

      expect(firestore.getUserBanner).toHaveBeenCalledWith('user123');
    });

    it('debe mostrar gradiente por defecto cuando no hay banner', () => {
      const { container } = render(
        <UserAvatar name="Test" showBanner={true} />
      );
      const gradient = container.querySelector('.bg-gradient-to-br');
      expect(gradient).toBeInTheDocument();
    });

    it('debe usar bannerUrl directamente cuando es proporcionado', () => {
      const testBannerUrl = 'https://example.com/banner.jpg';
      const { container } = render(
        <UserAvatar
          name="Test"
          showBanner={true}
          bannerUrl={testBannerUrl}
        />
      );
      const bannerImg = container.querySelector('img[alt="Banner"]');
      expect(bannerImg).toHaveAttribute('src', testBannerUrl);
    });
  });

  // ==========================================
  // TESTS DE INTERACTIVIDAD
  // ==========================================

  describe('Interactividad', () => {
    it('debe aplicar estilos hover cuando clickable es true', () => {
      const { container } = render(
        <UserAvatar name="Test" clickable={true} />
      );
      const avatar = container.querySelector('.cursor-pointer');
      expect(avatar).toBeInTheDocument();
    });

    it('debe llamar onClick cuando se hace click', () => {
      const handleClick = vi.fn();
      const { container } = render(
        <UserAvatar name="Test" onClick={handleClick} clickable={true} />
      );

      const avatar = container.querySelector('.cursor-pointer');
      avatar.click();

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('no debe tener cursor pointer cuando clickable es false', () => {
      const { container } = render(
        <UserAvatar name="Test" clickable={false} />
      );
      const avatar = container.querySelector('.cursor-pointer');
      expect(avatar).not.toBeInTheDocument();
    });
  });

  // ==========================================
  // TESTS DE OPTIMIZACIÓN (REACT.MEMO)
  // ==========================================

  describe('Optimización con React.memo', () => {
    it('no debe re-renderizar cuando props no cambian', () => {
      const { rerender } = render(<UserAvatar name="Test" email="test@test.com" />);

      const initialInitials = screen.getByText('TE');

      // Re-renderizar con las mismas props
      rerender(<UserAvatar name="Test" email="test@test.com" />);

      // Debería ser el mismo elemento
      const updatedInitials = screen.getByText('TE');
      expect(initialInitials).toBe(updatedInitials);
    });

    it('debe re-renderizar cuando props relevantes cambian', () => {
      const { rerender } = render(<UserAvatar name="Test" />);
      expect(screen.getByText('TE')).toBeInTheDocument();

      // Cambiar el nombre
      rerender(<UserAvatar name="John" />);
      expect(screen.getByText('JO')).toBeInTheDocument();
      expect(screen.queryByText('TE')).not.toBeInTheDocument();
    });
  });

  // ==========================================
  // TESTS DE ACCESIBILIDAD
  // ==========================================

  describe('Accesibilidad', () => {
    it('debe tener alt text correcto en imágenes', () => {
      render(<UserAvatar avatarUrl="https://test.com/img.jpg" name="Test User" />);
      const img = screen.getByAlt('Test User');
      expect(img).toBeInTheDocument();
    });

    it('debe tener aria-label en badges de estado', () => {
      render(
        <UserAvatar name="Test" status="online" showStatusBadge={true} />
      );
      expect(screen.getByLabelText('En línea')).toBeInTheDocument();
    });

    it('debe tener aria-label en badges de notificaciones', () => {
      render(
        <UserAvatar name="Test" notificationCount={5} showNotificationBadge={true} />
      );
      expect(screen.getByLabelText('5 notificaciones')).toBeInTheDocument();
    });
  });

  // ==========================================
  // TESTS DE CLASES PERSONALIZADAS
  // ==========================================

  describe('Clases CSS personalizadas', () => {
    it('debe aplicar clases CSS personalizadas', () => {
      const { container } = render(
        <UserAvatar name="Test" className="custom-class another-class" />
      );
      const avatar = container.querySelector('.custom-class');
      expect(avatar).toBeInTheDocument();
    });

    it('debe combinar clases personalizadas con clases por defecto', () => {
      const { container } = render(
        <UserAvatar name="Test" className="custom" size="lg" />
      );
      const avatar = container.querySelector('.custom.w-16');
      expect(avatar).toBeInTheDocument();
    });
  });

  // ==========================================
  // TESTS DE LOADING STATE
  // ==========================================

  describe('Estado de carga', () => {
    it('debe mostrar skeleton loader durante la carga', async () => {
      // Mock que tarda en resolver
      firestore.getUserAvatar.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('test'), 100))
      );

      const { container } = render(<UserAvatar userId="user123" name="Test" />);

      // Debería mostrar el skeleton
      const skeleton = container.querySelector('.animate-pulse');
      expect(skeleton).toBeInTheDocument();

      // Esperar a que termine la carga
      await waitFor(() => {
        expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();
      });
    });
  });
});
