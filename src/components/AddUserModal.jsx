import { useState } from 'react';
import { ROLES, ROLE_INFO } from '../firebase/roleConfig';
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
    setError(''); // Limpiar error al escribir
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      setError('El email es obligatorio');
      return false;
    }

    // Validación básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('El email no es válido');
      return false;
    }

    if (!formData.role) {
      setError('Debes seleccionar un rol');
      return false;
    }

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
      <div className="modal-content add-user-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            {isAdmin ? '➕ Crear Nuevo Usuario' : '➕ Agregar Alumno'}
          </h2>
          <button
            className="modal-close"
            onClick={handleClose}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
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
                className="form-input"
                placeholder="usuario@ejemplo.com"
                required
                disabled={loading}
              />
              <span className="form-hint">
                El usuario usará este email para iniciar sesión
              </span>
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
                className="form-input"
                placeholder="Ej: Juan Pérez"
                disabled={loading}
              />
              <span className="form-hint">
                Opcional - puede configurarlo después
              </span>
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
                className="form-select"
                required
                disabled={loading}
              >
                {availableRoles.map(role => (
                  <option key={role} value={role}>
                    {ROLE_INFO[role].icon} {ROLE_INFO[role].name}
                  </option>
                ))}
              </select>
              <span className="form-hint">
                {ROLE_INFO[formData.role]?.description}
              </span>
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
                className="form-input"
                placeholder="Ej: +54 11 1234-5678"
                disabled={loading}
              />
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

            {/* Footer con botones */}
            <div className="modal-footer">
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
              >
                {loading ? '⏳ Creando...' : '✅ Crear Usuario'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AddUserModal;
