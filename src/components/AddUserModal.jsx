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
    phone: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

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
        // Limpiar formulario y cerrar
        setFormData({
          name: '',
          email: '',
          role: 'student',
          phone: '',
          notes: ''
        });
        onClose();
      } else {
        setError(result.error || 'Error al crear usuario');
      }
    } catch (err) {
      setError('Error inesperado al crear usuario');
      console.error('Error:', err);
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
        phone: '',
        notes: ''
      });
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-box add-user-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            {isAdmin ? 'Crear Nuevo Usuario' : 'Agregar Alumno'}
          </h2>
          <button
            className="modal-close-btn"
            onClick={handleClose}
            disabled={loading}
            aria-label="Cerrar modal"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="modal-content">
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
                className={`select ${fieldErrors.role ? 'error' : ''}`}
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
          </form>
        </div>

        {/* Footer con botones */}
        <div className="modal-footer">
          <button
            type="button"
            onClick={handleClose}
            className="btn btn-outline"
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
        </div>
      </div>
    </div>
  );
}

export default AddUserModal;
