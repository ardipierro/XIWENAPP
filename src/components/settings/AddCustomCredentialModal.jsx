/**
 * @fileoverview Modal para agregar credenciales personalizadas
 * Refactorizado para usar BaseModal
 * @module components/settings/AddCustomCredentialModal
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Eye, EyeOff, Save, Key } from 'lucide-react';
import { BaseModal, BaseButton, BaseInput, BaseAlert } from '../common';

function AddCustomCredentialModal({ onSave, onClose, existingNames = [] }) {
  const [providerName, setProviderName] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const isValid = providerName.trim().length > 0 && apiKey.trim().length > 0;

  // Verificar si el nombre ya existe
  const nameExists = existingNames.some(
    name => name.toLowerCase() === providerName.trim().toLowerCase()
  );

  const handleSave = async () => {
    if (!isValid) return;

    if (nameExists) {
      setError('Ya existe una credencial con ese nombre');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await onSave(providerName.trim(), apiKey.trim());
    } catch (err) {
      setError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title="Agregar Credencial"
      icon={Key}
      size="sm"
      loading={saving}
      footer={
        <div className="flex justify-end gap-3">
          <BaseButton variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </BaseButton>
          <BaseButton
            variant="primary"
            onClick={handleSave}
            disabled={saving || !isValid || nameExists}
            loading={saving}
            iconLeft={Save}
          >
            Guardar
          </BaseButton>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Error */}
        {error && (
          <BaseAlert variant="danger" size="sm">
            {error}
          </BaseAlert>
        )}

        {/* Provider Name */}
        <BaseInput
          label="Nombre del Proveedor"
          value={providerName}
          onChange={(e) => setProviderName(e.target.value)}
          placeholder="Ej: DeepSeek, Mistral, Cohere..."
          autoFocus
          error={nameExists ? 'Ya existe una credencial con este nombre' : null}
        />

        {/* API Key */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-[var(--color-text-primary)]">
            API Key
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Ingresa tu API key"
              className="w-full px-3 py-2 pr-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
            >
              {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <p className="text-xs text-[var(--color-text-tertiary)]">
          La credencial se guardará localmente en tu navegador con el nombre especificado.
        </p>
      </div>
    </BaseModal>
  );
}

AddCustomCredentialModal.propTypes = {
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  existingNames: PropTypes.arrayOf(PropTypes.string)
};

export default AddCustomCredentialModal;
