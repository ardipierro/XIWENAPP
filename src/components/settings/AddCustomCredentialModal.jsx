/**
 * @fileoverview Modal para agregar credenciales personalizadas
 * @module components/settings/AddCustomCredentialModal
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Eye, EyeOff, Save, X, Key } from 'lucide-react';
import { BaseButton } from '../common';

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        {/* Header */}
        <div className="modal-header bg-gradient-to-r from-slate-600 to-slate-700">
          <div className="flex items-center gap-3">
            <div className="text-4xl">🔑</div>
            <div>
              <h3 className="modal-title text-white m-0">Agregar Credencial</h3>
              <p className="text-sm text-white/90 m-0">Configura un proveedor personalizado</p>
            </div>
          </div>
          <button className="modal-close-btn text-white" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Provider Name */}
          <div className="form-group mb-4">
            <label className="form-label">Nombre del Proveedor</label>
            <input
              type="text"
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
              placeholder="Ej: DeepSeek, Mistral, Cohere..."
              className="input"
              autoFocus
            />
            {nameExists && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Ya existe una credencial con este nombre
              </p>
            )}
          </div>

          {/* API Key */}
          <div className="form-group">
            <label className="form-label">API Key</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Ingresa tu API key"
                  className="input font-mono text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            La credencial se guardará localmente en tu navegador con el nombre especificado.
          </p>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <BaseButton variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </BaseButton>
          <BaseButton
            variant="primary"
            onClick={handleSave}
            disabled={saving || !isValid || nameExists}
            loading={saving}
          >
            <Save size={18} />
            Guardar
          </BaseButton>
        </div>
      </div>
    </div>
  );
}

AddCustomCredentialModal.propTypes = {
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  existingNames: PropTypes.arrayOf(PropTypes.string)
};

export default AddCustomCredentialModal;
