import logger from '../utils/logger';

import { useState } from 'react';
import { z } from 'zod';
import { ROLES, ROLE_INFO } from '../firebase/roleConfig';
import { userSchema, validateData } from '../utils/validationSchemas';
import './AddUserModal.css';

function AddUserModal({ isOpen, onClose, onUserCreated, userRole, isAdmin }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'student',
    password: '',
    phone: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [generatedPassword, setGeneratedPassword] = useState('');

  // Determinar qué roles puede crear este usuario
  const getAvailableRoles = () => {
    if (isAdmin) {
      // Admin puede crear cualquier rol
      return Object.values(ROLES);
    } else {
      // Profesores solo pueden crear estudiantes
      return [ROLES.STUDENT, ROLES.LISTENER, ROLES.TRIAL];
    }
  };

  const availableRoles = getAvailableRoles();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Limpiar error general al escribir
    setFieldErrors(prev => ({ ...prev, [name]: '' })); // Limpiar error del campo
  };

  const validateForm = () => {
    // Crear schema personalizado sin password (no requerido en creación)
    const createUserSchema = userSchema.omit({ password: true }).extend({
      name: userSchema.shape.name.optional().or(z.literal('')),
      phone: userSchema.shape.phone
    });

    // Validar con Zod
    const validation = validateData(createUserSchema, {
      name: formData.name || undefined,
      email: formData.email,
      role: formData.role,
      phone: formData.phone || undefined
    });

    if (!validation.success) {
      setFieldErrors(validation.errors);
      // Tomar el primer error para mostrar como error general
      const firstError = Object.values(validation.errors)[0];
      setError(firstError);
      return false;
    }

    setFieldErrors({});
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Llamar a la función de creación pasada como prop
      const result = await onUserCreated(formData);

      if (result.success) {
        // Mostrar contraseña generada si fue automática
        if (result.password && result.isGenerated) {
          setGeneratedPassword(result.password);
        } else {
          // Si el usuario estableció su propia contraseña, cerrar inmediatamente
          setFormData({
            name: '',
            email: '',
            role: 'student',
            password: '',
            phone: '',
            notes: ''
          });
          onClose();
        }
      } else {
        setError(result.error || 'Error al crear usuario');
      }
    } catch (err) {
      setError('Error inesperado al crear usuario');
      logger.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        email: '',
        role: 'student',
        password: '',
        phone: '',
        notes: ''
      });
      setError('');
      setGeneratedPassword('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-box flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header - Fixed */}
        <div className="modal-header flex-shrink-0 px-6 pt-6 pb-4">
          <h3 className="modal-title">
            {isAdmin ? 'Crear Nuevo Usuario' : 'Agregar Alumno'}
          </h3>
          <button
            className="modal-close-btn"
            onClick={handleClose}
            disabled={loading}
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className="modal-content flex-1 overflow-y-auto px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email (obligatorio) */}
            <div className="form-group">
              <label htmlFor="email" className="form-label required">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`form-input ${fieldErrors.email ? 'error' : ''}`}
                placeholder="usuario@ejemplo.com"
                required
                disabled={loading}
              />
              {fieldErrors.email ? (
                <span className="form-error">{fieldErrors.email}</span>
              ) : (
                <span className="form-hint">
                  El usuario usará este email para iniciar sesión
                </span>
              )}
            </div>

            {/* Contraseña (opcional - se genera automática si no se provee) */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Contraseña
              </label>
              <input
                type="text"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`form-input ${fieldErrors.password ? 'error' : ''}`}
                placeholder="Dejar vacío para generar automáticamente"
                disabled={loading}
              />
              {fieldErrors.password ? (
                <span className="form-error">{fieldErrors.password}</span>
              ) : (
                <span className="form-hint">
                  Si no ingresas una, se generará automáticamente
                </span>
              )}
            </div>

            {/* Nombre (opcional) */}
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Nombre completo
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`form-input ${fieldErrors.name ? 'error' : ''}`}
                placeholder="Ej: Juan Pérez"
                disabled={loading}
              />
              {fieldErrors.name ? (
                <span className="form-error">{fieldErrors.name}</span>
              ) : (
                <span className="form-hint">
                  Opcional - puede configurarlo después
                </span>
              )}
            </div>

            {/* Rol */}
            <div className="form-group">
              <label htmlFor="role" className="form-label required">
                Rol
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`form-select ${fieldErrors.role ? 'error' : ''}`}
                required
                disabled={loading}
              >
                {availableRoles.map(role => (
                  <option key={role} value={role}>
                    {ROLE_INFO[role].icon} {ROLE_INFO[role].name}
                  </option>
                ))}
              </select>
              {fieldErrors.role ? (
                <span className="form-error">{fieldErrors.role}</span>
              ) : (
                <span className="form-hint">
                  {ROLE_INFO[formData.role]?.description}
                </span>
              )}
            </div>

            {/* Teléfono (opcional) */}
            <div className="form-group">
              <label htmlFor="phone" className="form-label">
                Teléfono
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`form-input ${fieldErrors.phone ? 'error' : ''}`}
                placeholder="Ej: 123456789"
                disabled={loading}
              />
              {fieldErrors.phone && (
                <span className="form-error">{fieldErrors.phone}</span>
              )}
            </div>

            {/* Notas (opcional) */}
            <div className="form-group">
              <label htmlFor="notes" className="form-label">
                Notas
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="form-textarea"
                placeholder="Información adicional sobre el usuario..."
                rows="3"
                disabled={loading}
              />
            </div>

            {/* Error message */}
            {error && (
              <div className="error-message">
                ⚠️ {error}
              </div>
            )}

            {/* Success message with generated password */}
            {generatedPassword && (
              <div className="success-message-box">
                <div className="success-header">
                  ✅ Usuario creado exitosamente
                </div>
                <div className="password-display">
                  <p className="password-label">Contraseña temporal:</p>
                  <div className="password-value">
                    <code>{generatedPassword}</code>
                    <button
                      type="button"
                      className="copy-password-btn"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedPassword);
                        alert('Contraseña copiada al portapapeles');
                      }}
                    >
                      📋 Copiar
                    </button>
                  </div>
                  <p className="password-warning">
                    ⚠️ Guarda esta contraseña. El usuario deberá usarla para su primer inicio de sesión.
                  </p>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer - Fixed */}
        <div className="modal-footer">
          {generatedPassword ? (
            <button
              type="button"
              onClick={() => {
                setGeneratedPassword('');
                setFormData({
                  name: '',
                  email: '',
                  role: 'student',
                  password: '',
                  phone: '',
                  notes: ''
                });
                onClose();
              }}
              className="btn btn-primary"
            >
              Cerrar
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="btn btn-ghost"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                onClick={handleSubmit}
              >
                {loading ? 'Creando...' : 'Crear Usuario'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AddUserModal;
