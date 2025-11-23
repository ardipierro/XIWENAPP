import { useState } from 'react';
import PropTypes from 'prop-types';
import { Eye, EyeOff, ExternalLink, CheckCircle, Save, X } from 'lucide-react';
import { BaseButton } from '../common';

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        {/* Header */}
        <div className={`modal-header bg-gradient-to-r from-${provider.color}-500 to-${provider.color}-600`}>
          <div className="flex items-center gap-3">
            <div className="text-4xl">
              {provider.emoji || (IconComponent && <IconComponent size={32} className="text-white" />)}
            </div>
            <div>
              <h3 className="modal-title text-white m-0">Configurar {provider.name}</h3>
              <p className="text-sm text-white/90 m-0">{provider.description}</p>
            </div>
          </div>
          <button className="modal-close-btn text-white" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">API Key</label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={`Ingresa tu ${provider.name} API key`}
                  className="input font-mono text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <a href={provider.docsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 mt-2">
            <ExternalLink size={16} />
            ¿Dónde obtengo mi API key?
          </a>

          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Servicios disponibles:</h4>
            <ul className="space-y-2">
              {provider.services.map((service, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircle size={16} className="flex-shrink-0 mt-0.5 text-purple-600" />
                  {service}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <BaseButton variant="outline" onClick={onClose} disabled={saving}>Cancelar</BaseButton>
          <BaseButton variant="primary" onClick={handleSave} disabled={saving || !hasChanged} loading={saving}>
            <Save size={18} />
            Guardar
          </BaseButton>
        </div>
      </div>
    </div>
  );
}

CredentialConfigModal.propTypes = {
  provider: PropTypes.object.isRequired,
  initialValue: PropTypes.string,
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired
};

export default CredentialConfigModal;
