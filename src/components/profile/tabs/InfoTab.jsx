/**
 * @fileoverview Pestaña de información personal del usuario
 * @module components/profile/tabs/InfoTab
 */

import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Shield, Save } from 'lucide-react';
import { BaseButton } from '../../common';
import { updateUser } from '../../../firebase/users';
import logger from '../../../utils/logger';

/**
 * InfoTab - Información personal del usuario
 *
 * @param {Object} user - Usuario actual
 * @param {string} userRole - Rol del usuario
 * @param {boolean} isAdmin - Si el usuario actual es admin
 * @param {boolean} isOwnProfile - Si está viendo su propio perfil
 * @param {Function} onUpdate - Callback al actualizar
 * @param {Function} onEditingChange - Callback cuando cambia el modo de edición
 */
function InfoTab({ user, userRole, isAdmin, isOwnProfile, onUpdate, onEditingChange }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.displayName || user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    birthDate: user?.birthDate || '',
    chineseFirstName: user?.chineseFirstName || '',
    chineseLastName: user?.chineseLastName || '',
    role: userRole || 'student',
    status: user?.status || 'active'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Determinar qué campos son editables
  const canEditAll = isAdmin && !isOwnProfile;
  const canEditLimited = isOwnProfile;

  useEffect(() => {
    setFormData({
      name: user?.displayName || user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      birthDate: user?.birthDate || '',
      chineseFirstName: user?.chineseFirstName || '',
      chineseLastName: user?.chineseLastName || '',
      role: userRole || 'student',
      status: user?.status || 'active'
    });
  }, [user, userRole]);

  // Notificar al padre cuando cambia el estado de edición
  useEffect(() => {
    if (onEditingChange) {
      onEditingChange(editing);
    }
  }, [editing, onEditingChange]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updates = {};

      // Solo incluir campos que el usuario puede editar
      if (canEditLimited) {
        if (formData.name !== user?.displayName) updates.name = formData.name;
        if (formData.phone !== user?.phone) updates.phone = formData.phone;
        if (formData.address !== user?.address) updates.address = formData.address;
        if (formData.birthDate !== user?.birthDate) updates.birthDate = formData.birthDate;
        if (formData.chineseFirstName !== user?.chineseFirstName) updates.chineseFirstName = formData.chineseFirstName;
        if (formData.chineseLastName !== user?.chineseLastName) updates.chineseLastName = formData.chineseLastName;
      }

      // Admin puede editar todo
      if (canEditAll) {
        updates.name = formData.name;
        updates.phone = formData.phone;
        updates.address = formData.address;
        updates.birthDate = formData.birthDate;
        updates.chineseFirstName = formData.chineseFirstName;
        updates.chineseLastName = formData.chineseLastName;
        updates.role = formData.role;
        updates.status = formData.status;
      }

      if (Object.keys(updates).length === 0) {
        setSuccess('No hay cambios que guardar');
        setEditing(false);
        return;
      }

      await updateUser(user.uid, updates);
      setSuccess('Perfil actualizado correctamente');
      setEditing(false);

      if (onUpdate) onUpdate();
    } catch (err) {
      logger.error('Error updating user profile:', err);
      setError('Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadge = () => {
    const badges = {
      admin: { text: 'Administrador', color: 'bg-red-500' },
      teacher: { text: 'Profesor', color: 'bg-green-500' },
      trial_teacher: { text: 'Profesor (Prueba)', color: 'bg-amber-500' },
      student: { text: 'Estudiante', color: 'bg-gray-500' },
      listener: { text: 'Oyente', color: 'bg-gray-500' },
      trial: { text: 'Prueba', color: 'bg-amber-500' },
    };
    return badges[formData.role] || { text: formData.role, color: 'bg-gray-500' };
  };

  const roleBadge = getRoleBadge();

  return (
    <div className="p-6">
      {/* Formulario */}
      <form id="profile-info-form" onSubmit={handleSave} className="space-y-5">
        {/* Nombre */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            <User size={16} strokeWidth={2} />
            Nombre (Español)
          </label>
          <input
            type="text"
            className="w-full px-3.5 py-2.5 text-[15px] rounded-md transition-all
                       text-zinc-900 dark:text-zinc-50
                       bg-white dark:bg-zinc-950
                       border border-zinc-200 dark:border-zinc-800
                       focus:outline-none focus:ring-2 focus:ring-gray-400
                       disabled:opacity-60 disabled:cursor-not-allowed"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Tu nombre completo"
            disabled={!editing || (!canEditLimited && !canEditAll)}
          />
        </div>

        {/* Nombre en Chino */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Apellido en Chino
            </label>
            <input
              type="text"
              className="w-full px-3.5 py-2.5 text-[15px] rounded-md transition-all
                         text-zinc-900 dark:text-zinc-50
                         bg-white dark:bg-zinc-950
                         border border-zinc-200 dark:border-zinc-800
                         focus:outline-none focus:ring-2 focus:ring-gray-400
                         disabled:opacity-60 disabled:cursor-not-allowed"
              value={formData.chineseLastName}
              onChange={(e) => handleChange('chineseLastName', e.target.value)}
              placeholder="姓"
              disabled={!editing || (!canEditLimited && !canEditAll)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Nombre en Chino
            </label>
            <input
              type="text"
              className="w-full px-3.5 py-2.5 text-[15px] rounded-md transition-all
                         text-zinc-900 dark:text-zinc-50
                         bg-white dark:bg-zinc-950
                         border border-zinc-200 dark:border-zinc-800
                         focus:outline-none focus:ring-2 focus:ring-gray-400
                         disabled:opacity-60 disabled:cursor-not-allowed"
              value={formData.chineseFirstName}
              onChange={(e) => handleChange('chineseFirstName', e.target.value)}
              placeholder="名"
              disabled={!editing || (!canEditLimited && !canEditAll)}
            />
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            <Mail size={16} strokeWidth={2} />
            Email
          </label>
          <input
            type="email"
            className="w-full px-3.5 py-2.5 text-[15px] rounded-md
                       text-zinc-900 dark:text-zinc-50
                       bg-zinc-100 dark:bg-zinc-900
                       border border-zinc-200 dark:border-zinc-800
                       cursor-not-allowed opacity-60"
            value={formData.email}
            disabled
          />
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            El email no se puede cambiar
          </p>
        </div>

        {/* Teléfono */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            <Phone size={16} strokeWidth={2} />
            Teléfono
          </label>
          <input
            type="tel"
            className="w-full px-3.5 py-2.5 text-[15px] rounded-md transition-all
                       text-zinc-900 dark:text-zinc-50
                       bg-white dark:bg-zinc-950
                       border border-zinc-200 dark:border-zinc-800
                       focus:outline-none focus:ring-2 focus:ring-gray-400
                       disabled:opacity-60 disabled:cursor-not-allowed"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+00 000 000 000"
            disabled={!editing || (!canEditLimited && !canEditAll)}
          />
        </div>

        {/* Dirección */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            <MapPin size={16} strokeWidth={2} />
            Dirección
          </label>
          <input
            type="text"
            className="w-full px-3.5 py-2.5 text-[15px] rounded-md transition-all
                       text-zinc-900 dark:text-zinc-50
                       bg-white dark:bg-zinc-950
                       border border-zinc-200 dark:border-zinc-800
                       focus:outline-none focus:ring-2 focus:ring-gray-400
                       disabled:opacity-60 disabled:cursor-not-allowed"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="Tu dirección"
            disabled={!editing || (!canEditLimited && !canEditAll)}
          />
        </div>

        {/* Fecha de nacimiento */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            <Calendar size={16} strokeWidth={2} />
            Fecha de nacimiento
          </label>
          <input
            type="date"
            className="w-full px-3.5 py-2.5 text-[15px] rounded-md transition-all
                       text-zinc-900 dark:text-zinc-50
                       bg-white dark:bg-zinc-950
                       border border-zinc-200 dark:border-zinc-800
                       focus:outline-none focus:ring-2 focus:ring-gray-400
                       disabled:opacity-60 disabled:cursor-not-allowed"
            value={formData.birthDate}
            onChange={(e) => handleChange('birthDate', e.target.value)}
            disabled={!editing || (!canEditLimited && !canEditAll)}
          />
        </div>

        {/* Rol - Solo visible */}
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            <Shield size={16} strokeWidth={2} />
            Rol
          </label>
          {canEditAll && editing ? (
            <select
              className="w-full px-3.5 py-2.5 text-[15px] rounded-md transition-all
                         text-zinc-900 dark:text-zinc-50
                         bg-white dark:bg-zinc-950
                         border border-zinc-200 dark:border-zinc-800
                         focus:outline-none focus:ring-2 focus:ring-gray-400"
              value={formData.role}
              onChange={(e) => handleChange('role', e.target.value)}
            >
              <option value="student">Estudiante</option>
              <option value="teacher">Profesor</option>
              <option value="trial_teacher">Profesor (Prueba)</option>
              <option value="admin">Administrador</option>
              <option value="listener">Oyente</option>
              <option value="trial">Prueba</option>
            </select>
          ) : (
            <div className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-semibold text-white w-fit ${roleBadge.color}`}>
              {roleBadge.text}
            </div>
          )}
        </div>

        {/* Estado - Solo para admin */}
        {canEditAll && (
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              Estado
            </label>
            {editing ? (
              <select
                className="w-full px-3.5 py-2.5 text-[15px] rounded-md transition-all
                           text-zinc-900 dark:text-zinc-50
                           bg-white dark:bg-zinc-950
                           border border-zinc-200 dark:border-zinc-800
                           focus:outline-none focus:ring-2 focus:ring-gray-400"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
                <option value="suspended">Suspendido</option>
                <option value="deleted">Eliminado</option>
              </select>
            ) : (
              <div className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-semibold w-fit ${
                formData.status === 'active' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' :
                formData.status === 'inactive' ? 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-400' :
                formData.status === 'suspended' ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400' :
                'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              }`}>
                {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
              </div>
            )}
          </div>
        )}

        {/* ID del usuario - Solo para admin */}
        {isAdmin && (
          <div className="flex flex-col gap-2 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <label className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              ID de Usuario
            </label>
            <code className="px-3 py-2 text-xs bg-zinc-100 dark:bg-zinc-900 rounded border border-zinc-200 dark:border-zinc-800 font-mono text-zinc-700 dark:text-zinc-300">
              {user?.uid}
            </code>
          </div>
        )}
      </form>
    </div>
  );
}

export default InfoTab;
