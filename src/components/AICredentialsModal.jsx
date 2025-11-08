/**
 * @fileoverview Modal para configurar credenciales de proveedores de IA
 * @module components/AICredentialsModal
 */

import { useState, useEffect } from 'react';
import { Save, Key, Eye, EyeOff } from 'lucide-react';
import { BaseModal, BaseButton, BaseInput, BaseAlert } from './common';
import logger from '../utils/logger';

/**
 * Modal para configurar las API Keys de proveedores de IA
 */
function AICredentialsModal({ isOpen, onClose, provider, onSave, isConfigured = false }) {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isOpen && provider) {
      // Si está configurado en Firebase Secret Manager, mostrar asteriscos
      if (isConfigured) {
        setApiKey('••••••••••••••••••••••••••••••••••••');
      } else {
        // Cargar API key actual desde localStorage o .env
        const envKey = import.meta.env[`VITE_${provider.name.toUpperCase()}_API_KEY`];
        const storedKey = localStorage.getItem(`ai_credentials_${provider.name}`);
        setApiKey(storedKey || envKey || '');
      }
      setSuccess(false);
      setError(null);
    }
  }, [isOpen, provider, isConfigured]);

  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError('Por favor, ingresa una API key válida');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Guardar en localStorage
      localStorage.setItem(`ai_credentials_${provider.name}`, apiKey.trim());

      // Llamar callback si existe
      if (onSave) {
        await onSave(provider.name, apiKey.trim());
      }

      setSuccess(true);
      logger.info('API key saved successfully:', provider.name);

      // Cerrar después de 1 segundo
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      logger.error('Failed to save API key:', err);
      setError(`Error al guardar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (confirm(`¿Estás seguro de eliminar las credenciales de ${provider?.label}?`)) {
      localStorage.removeItem(`ai_credentials_${provider.name}`);
      setApiKey('');
      setSuccess(true);
      logger.info('API key deleted:', provider.name);

      setTimeout(() => {
        onClose();
      }, 1000);
    }
  };

  if (!provider) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Configurar credenciales: ${provider.label}`}
      icon={Key}
      size="md"
      footer={
        <>
          <BaseButton
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </BaseButton>
          {apiKey && (
            <BaseButton
              variant="danger"
              onClick={handleDelete}
              disabled={saving}
            >
              Eliminar
            </BaseButton>
          )}
          <BaseButton
            variant="primary"
            icon={Save}
            onClick={handleSave}
            loading={saving}
          >
            Guardar
          </BaseButton>
        </>
      }
    >
      <div className="space-y-6">
        {/* Success Alert */}
        {success && (
          <BaseAlert variant="success" title="¡Listo!">
            Credenciales guardadas exitosamente
          </BaseAlert>
        )}

        {/* Error Alert */}
        {error && (
          <BaseAlert variant="danger" title="Error">
            {error}
          </BaseAlert>
        )}

        {/* Provider Info */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{provider.icon}</span>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-white">
                {provider.label}
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Modelo: {provider.model}
              </p>
            </div>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
            📘 Obtén tu API key en: <a href={provider.docsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">{provider.docsUrl}</a>
          </p>
        </div>

        {/* API Key Input */}
        <div className="relative">
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            API Key
          </label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="input w-full pr-12"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors"
            >
              {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
            Tu API key se guarda de forma segura en el navegador
          </p>
        </div>

        {/* Info Box */}
        {isConfigured ? (
          <BaseAlert variant="success">
            <p className="text-sm">
              ✅ <strong>Credenciales configuradas en Firebase Secret Manager</strong><br />
              Las API keys están almacenadas de forma segura en el backend. No es necesario configurarlas nuevamente.
            </p>
          </BaseAlert>
        ) : (
          <BaseAlert variant="info">
            <p className="text-sm">
              Las credenciales se guardan localmente en tu navegador. No se comparten con otros usuarios ni se suben a ningún servidor.
            </p>
          </BaseAlert>
        )}
      </div>
    </BaseModal>
  );
}

export default AICredentialsModal;
