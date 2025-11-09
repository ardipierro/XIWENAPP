// ============================================
// XIWENAPP - COMPONENTES REUTILIZABLES
// ============================================
// @deprecated Este archivo es LEGACY y NO debe usarse en código nuevo
//
// USAR EN SU LUGAR:
// - Button → BaseButton (./BaseButton.jsx)
// - Card → BaseCard (./BaseCard.jsx)
// - Input → BaseInput (./BaseInput.jsx)
// - Badge → BaseBadge (./BaseBadge.jsx)
// - Alert → BaseAlert (./BaseAlert.jsx)
// - Modal → BaseModal (./BaseModal.jsx)
// - Spinner → BaseLoading (./BaseLoading.jsx)
//
// Este archivo se mantiene solo para compatibilidad retroactiva
// y será eliminado en una futura versión.
// ============================================

import React from 'react';

// ============================================
// BOTONES
// ============================================

/**
 * Botón reutilizable con diferentes variantes
 * 
 * @param {string} variant - 'primary' | 'secondary' | 'accent' | 'danger' | 'outline' | 'ghost'
 * @param {string} size - 'sm' | 'md' | 'lg'
 * @param {boolean} disabled
 * @param {function} onClick
 * @param {ReactNode} children
 */
export const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  onClick, 
  className = '',
  children,
  ...props 
}) => {
  const baseClasses = 'btn';
  const variantClass = `btn-${variant}`;
  const sizeClass = size !== 'md' ? `btn-${size}` : '';
  
  return (
    <button
      className={`${baseClasses} ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

// Ejemplos de uso:
// <Button variant="primary">Guardar</Button>
// <Button variant="secondary" size="lg">Continuar</Button>
// <Button variant="danger" size="sm" disabled>Eliminar</Button>

// ============================================
// CARDS
// ============================================

/**
 * Card reutilizable con header y body opcionales
 */
export const Card = ({ 
  title, 
  children, 
  className = '',
  hover = true,
  ...props 
}) => {
  return (
    <div className={`card ${hover ? '' : 'hover:shadow-md hover:transform-none'} ${className}`} {...props}>
      {title && (
        <div className="card-header">
          <h3 className="card-title">{title}</h3>
        </div>
      )}
      <div className="card-body">
        {children}
      </div>
    </div>
  );
};

// Ejemplo de uso:
// <Card title="Información del Estudiante">
//   <p>Contenido aquí...</p>
// </Card>

// ============================================
// INPUTS
// ============================================

/**
 * Input reutilizable con label y error
 */
export const Input = ({ 
  label, 
  error, 
  required = false,
  type = 'text',
  className = '',
  ...props 
}) => {
  return (
    <div className="mb-4">
      {label && (
        <label className={`label ${required ? 'label-required' : ''}`}>
          {label}
        </label>
      )}
      <input
        type={type}
        className={`input ${error ? 'input-error' : ''} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-sm text-error mt-1">{error}</p>
      )}
    </div>
  );
};

// Ejemplo de uso:
// <Input 
//   label="Nombre" 
//   required 
//   value={name}
//   onChange={(e) => setName(e.target.value)}
//   error={errors.name}
// />

// ============================================
// BADGES
// ============================================

/**
 * Badge para estados y etiquetas
 */
export const Badge = ({ 
  variant = 'info', 
  children, 
  className = '',
  ...props 
}) => {
  return (
    <span className={`badge badge-${variant} ${className}`} {...props}>
      {children}
    </span>
  );
};

// Ejemplos de uso:
// <Badge variant="success">Activo</Badge>
// <Badge variant="warning">Pendiente</Badge>
// <Badge variant="teacher">Profesor</Badge>

// ============================================
// ALERTS
// ============================================

/**
 * Alert para mensajes y notificaciones
 */
export const Alert = ({ 
  variant = 'info', 
  children, 
  onClose,
  className = '',
  ...props 
}) => {
  return (
    <div className={`alert alert-${variant} ${className}`} {...props}>
      <div className="flex justify-between items-start">
        <div className="flex-1">{children}</div>
        {onClose && (
          <button 
            onClick={onClose}
            className="ml-4 text-current opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

// Ejemplo de uso:
// <Alert variant="success" onClose={() => setShowAlert(false)}>
//   ¡Guardado exitosamente!
// </Alert>

// ============================================
// MODAL
// ============================================

/**
 * Modal reutilizable
 */
export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  footer,
  className = '',
  ...props 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fade-in" onClick={onClose}>
      <div 
        className={`bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto ${className}`}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {/* Header */}
        {title && (
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Body */}
        <div className="p-6">
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="flex justify-end gap-2 p-6 border-t border-gray-200">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// Ejemplo de uso:
// <Modal 
//   isOpen={showModal} 
//   onClose={() => setShowModal(false)}
//   title="Confirmar acción"
//   footer={
//     <>
//       <Button variant="ghost" onClick={() => setShowModal(false)}>Cancelar</Button>
//       <Button variant="danger" onClick={handleDelete}>Eliminar</Button>
//     </>
//   }
// >
//   <p>¿Estás seguro de que quieres eliminar este elemento?</p>
// </Modal>

// ============================================
// LOADING SPINNER
// ============================================

/**
 * Spinner de carga
 */
export const Spinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={`spinner ${sizeClasses[size]} ${className}`} />
  );
};

// Ejemplo de uso:
// <Spinner size="lg" />

// ============================================
// CONTAINER
// ============================================

/**
 * Container responsive
 */
export const Container = ({ 
  size = 'default', 
  children, 
  className = '',
  ...props 
}) => {
  const sizeClass = size !== 'default' ? `container-${size}` : '';
  
  return (
    <div className={`container ${sizeClass} ${className}`} {...props}>
      {children}
    </div>
  );
};

// Ejemplo de uso:
// <Container size="sm">
//   <h1>Contenido</h1>
// </Container>

// ============================================
// AVATAR
// ============================================

/**
 * Avatar de usuario
 */
export const Avatar = ({ 
  src, 
  alt, 
  size = 'md',
  fallback,
  className = '',
  ...props 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl',
  };

  return (
    <div 
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center bg-primary text-white font-semibold overflow-hidden ${className}`}
      {...props}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <span>{fallback || '?'}</span>
      )}
    </div>
  );
};

// Ejemplo de uso:
// <Avatar src="/path/to/image.jpg" alt="Usuario" size="lg" />
// <Avatar fallback="JP" size="md" />

// ============================================
// DASHBOARD STAT CARD
// ============================================

/**
 * Card de estadísticas para dashboards
 */
export const StatCard = ({ 
  title, 
  value, 
  icon,
  trend,
  color = 'primary',
  className = '',
  ...props 
}) => {
  return (
    <Card className={`${className}`} {...props}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className={`text-3xl font-bold text-${color}`}>{value}</p>
          {trend && (
            <p className={`text-sm mt-2 ${trend > 0 ? 'text-success' : 'text-error'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </p>
          )}
        </div>
        {icon && (
          <div className={`p-3 bg-${color} bg-opacity-10 rounded-lg`}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

// Ejemplo de uso:
// <StatCard 
//   title="Total Estudiantes" 
//   value="45" 
//   trend={12}
//   icon={<UserIcon />}
//   color="primary"
// />

// ============================================
// EMPTY STATE
// ============================================

/**
 * Estado vacío
 */
export const EmptyState = ({ 
  title, 
  description, 
  action,
  icon,
  className = '',
  ...props 
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`} {...props}>
      {icon && (
        <div className="mb-4 text-gray-400">
          {icon}
        </div>
      )}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-600 mb-6 max-w-sm">{description}</p>
      )}
      {action}
    </div>
  );
};

// Ejemplo de uso:
// <EmptyState 
//   title="No hay estudiantes"
//   description="Comienza agregando tu primer estudiante"
//   icon={<UsersIcon className="w-16 h-16" />}
//   action={<Button variant="primary" onClick={handleAdd}>Agregar Estudiante</Button>}
// />

// ============================================
// EXPORTS
// ============================================

export default {
  Button,
  Card,
  Input,
  Badge,
  Alert,
  Modal,
  Spinner,
  Container,
  Avatar,
  StatCard,
  EmptyState,
};
