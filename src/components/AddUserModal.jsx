import logger from '../utils/logger';

import { useState } from 'react';
import { z } from 'zod';
import { ROLES, ROLE_INFO } from '../firebase/roleConfig';
import { userSchema, validateData } from '../utils/validationSchemas';
import { BaseModal, BaseButton, BaseInput, BaseSelect, BaseTextarea, BaseAlert } from './common';

function AddUserModal({ isOpen, onClose, onUserCreated, userRole, isAdmin }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'student',
    password: '',
    phone: '',
    notes: '',
    chineseFirstName: '',
    chineseLastName: '',
    birthDate: ''
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
            notes: '',
            chineseFirstName: '',
            chineseLastName: '',
            birthDate: ''
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
        notes: '',
        chineseFirstName: '',
        chineseLastName: '',
        birthDate: ''
      });
      setError('');
      setGeneratedPassword('');
      onClose();
    }
  };

  // Prepare role options for BaseSelect
  const roleOptions = availableRoles.map(role => ({
    value: role,
    label: `${ROLE_INFO[role].emoji} ${ROLE_INFO[role].name}`
  }));

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={isAdmin ? 'Crear Nuevo Usuario' : 'Agregar Alumno'}
      size="lg"
      closeOnOverlayClick={!loading}
      footer={
        generatedPassword ? (
          <BaseButton
            variant="primary"
            onClick={() => {
              setGeneratedPassword('');
              setFormData({
                name: '',
                email: '',
                role: 'student',
                password: '',
                phone: '',
                notes: '',
                chineseFirstName: '',
                chineseLastName: '',
                birthDate: ''
              });
              onClose();
            }}
          >
            Cerrar
          </BaseButton>
        ) : (
          <>
            <BaseButton
              variant="ghost"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </BaseButton>
            <BaseButton
              variant="primary"
              onClick={handleSubmit}
              loading={loading}
            >
              Crear Usuario
            </BaseButton>
          </>
        )
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email (obligatorio) */}
        <BaseInput
          type="email"
          id="email"
          name="email"
          label="Email"
          value={formData.email}
          onChange={handleChange}
          placeholder="usuario@ejemplo.com"
          required
          disabled={loading}
          error={fieldErrors.email}
          helperText={fieldErrors.email || 'El usuario usará este email para iniciar sesión'}
        />

        {/* Contraseña (opcional - se genera automática si no se provee) */}
        <BaseInput
          type="text"
          id="password"
          name="password"
          label="Contraseña"
          value={formData.password}
          onChange={handleChange}
          placeholder="Dejar vacío para generar automáticamente"
          disabled={loading}
          error={fieldErrors.password}
          helperText={fieldErrors.password || 'Si no ingresas una, se generará automáticamente'}
        />

        {/* Nombre (opcional) */}
        <BaseInput
          type="text"
          id="name"
          name="name"
          label="Nombre completo (Español)"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ej: Juan Pérez"
          disabled={loading}
          error={fieldErrors.name}
          helperText={fieldErrors.name || 'Opcional - puede configurarlo después'}
        />

        {/* Nombres en Chino */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BaseInput
            type="text"
            id="chineseLastName"
            name="chineseLastName"
            label="Apellido en Chino"
            value={formData.chineseLastName}
            onChange={handleChange}
            placeholder="姓"
            disabled={loading}
          />
          <BaseInput
            type="text"
            id="chineseFirstName"
            name="chineseFirstName"
            label="Nombre en Chino"
            value={formData.chineseFirstName}
            onChange={handleChange}
            placeholder="名"
            disabled={loading}
          />
        </div>

        {/* Fecha de nacimiento */}
        <BaseInput
          type="date"
          id="birthDate"
          name="birthDate"
          label="Fecha de Nacimiento"
          value={formData.birthDate}
          onChange={handleChange}
          disabled={loading}
          helperText="Opcional - puede configurarlo después"
        />

        {/* Rol */}
        <div>
          <BaseSelect
            id="role"
            name="role"
            label="Rol"
            value={formData.role}
            onChange={handleChange}
            options={roleOptions}
            required
            disabled={loading}
            error={fieldErrors.role}
          />
          {!fieldErrors.role && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {ROLE_INFO[formData.role]?.description}
            </p>
          )}
        </div>

        {/* Teléfono (opcional) */}
        <BaseInput
          type="tel"
          id="phone"
          name="phone"
          label="Teléfono"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Ej: 123456789"
          disabled={loading}
          error={fieldErrors.phone}
        />

        {/* Notas (opcional) */}
        <BaseTextarea
          id="notes"
          name="notes"
          label="Notas"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Información adicional sobre el usuario..."
          rows={3}
          disabled={loading}
        />

        {/* Error message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm text-red-800 dark:text-red-200">
              ⚠️ {error}
            </p>
          </div>
        )}

        {/* Success message with generated password */}
        {generatedPassword && (
          <BaseAlert variant="success" title="Usuario creado exitosamente">
            <div className="space-y-2 mt-2">
              <p className="text-sm font-medium">
                Contraseña temporal:
              </p>
              <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-3">
                <code className="flex-1 text-sm font-mono text-gray-900 dark:text-gray-100">
                  {generatedPassword}
                </code>
                <BaseButton
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPassword);
                    alert('Contraseña copiada al portapapeles');
                  }}
                >
                  📋 Copiar
                </BaseButton>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                ⚠️ Guarda esta contraseña. El usuario deberá usarla para su primer inicio de sesión.
              </p>
            </div>
          </BaseAlert>
        )}
      </form>
    </BaseModal>
  );
}

export default AddUserModal;
