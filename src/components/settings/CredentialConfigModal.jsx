/**
 * @fileoverview Modal para configurar credenciales de proveedores IA
 * Refactorizado para usar BaseModal
 * @module components/settings/CredentialConfigModal
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Eye, EyeOff, ExternalLink, CheckCircle, Save, Key } from 'lucide-react';
import { BaseModal, BaseButton, BaseInput, BaseAlert } from '../common';

function CredentialConfigModal({ provider, initialValue = '', onSave, onClose }) {
  const [apiKey, setApiKey] = useState(initialValue);
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);

  const hasChanged = apiKey !== initialValue;
  const IconComponent = provider.icon;

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(provider.apiKeyField, apiKey, provider.name);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <BaseModal
      isOpen={true}
      onClose={onClose}
      title={`Configurar ${provider.name}`}
      icon={IconComponent || Key}
      size="md"
      loading={saving}
      footer={
        <div className="flex justify-end gap-3">
          <BaseButton variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </BaseButton>
          <BaseButton
            variant="primary"
            onClick={handleSave}
            disabled={saving || !hasChanged}
            loading={saving}
            iconLeft={Save}
          >
            Guardar
          </BaseButton>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Provider info */}
        {provider.description && (
          <p className="text-sm text-[var(--color-text-secondary)]">
            {provider.description}
          </p>
        )}

        {/* API Key input with toggle */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-[var(--color-text-primary)]">
            API Key
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`Ingresa tu ${provider.name} API key`}
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

        {/* Docs link */}
        {provider.docsUrl && (
          <a
            href={provider.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-primary)] hover:underline"
          >
            <ExternalLink size={16} />
            ¿Dónde obtengo mi API key?
          </a>
        )}

        {/* Services list */}
        {provider.services && provider.services.length > 0 && (
          <div className="pt-2">
            <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">
              Servicios disponibles:
            </h4>
            <ul className="space-y-1.5">
              {provider.services.map((service, index) => (
                <li
                  key={index}
                  className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]"
                >
                  <CheckCircle size={16} className="flex-shrink-0 mt-0.5 text-[var(--color-success)]" />
                  {service}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </BaseModal>
  );
}

CredentialConfigModal.propTypes = {
  provider: PropTypes.object.isRequired,
  initialValue: PropTypes.string,
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

export default CredentialConfigModal;
