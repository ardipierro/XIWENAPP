/**
 * @fileoverview Credentials Tab Component (Refactored)
 * @module components/settings/CredentialsTab
 *
 * Uses the new centralized CredentialsService and CredentialsContext.
 * Visual design is identical to the previous version.
 */

import { useState, useEffect } from 'react';
import { Key, CheckCircle, XCircle, Plus, Trash2, RefreshCw } from 'lucide-react';
import { useCredentials } from '../../contexts/CredentialsContext';
import { AI_PROVIDERS, PROVIDER_COLORS } from '../../constants/providers';
import { migrateCredentials } from '../../firebase/credentials';
import { BaseAlert, BaseLoading } from '../common';
import SearchBar from '../common/SearchBar';
import CredentialConfigModal from './CredentialConfigModal';
import AddCustomCredentialModal from './AddCustomCredentialModal';
import logger from '../../utils/logger';
import { UniversalCard } from '../cards';

/**
 * CredentialsTab Component
 * Displays and manages AI provider credentials
 */
function CredentialsTab() {
  // Use the credentials context
  const {
    credentials,
    customCredentials,
    loading,
    error: contextError,
    providers,
    configuredCount,
    setCredential,
    setCustomCredential,
    deleteCredential,
    refreshBackend
  } = useCredentials();

  // Local UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [filter, setFilter] = useState('all');
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [migrating, setMigrating] = useState(false);
  const [hasMigrated, setHasMigrated] = useState(false);

  // Run migration on first load (once per session)
  useEffect(() => {
    const migrationKey = 'credentials_migrated_v2';
    const alreadyMigrated = sessionStorage.getItem(migrationKey);

    if (!alreadyMigrated && !loading && !hasMigrated) {
      runMigration();
    }
  }, [loading, hasMigrated]);

  // Run migration
  const runMigration = async () => {
    try {
      setMigrating(true);
      const result = await migrateCredentials();

      if (result.migrated.length > 0) {
        logger.info(`Migration complete: ${result.migrated.length} credentials migrated`, 'CredentialsTab');
        setSuccess(`Se migraron ${result.migrated.length} credenciales al nuevo sistema`);
        setTimeout(() => setSuccess(null), 5000);
      }

      sessionStorage.setItem('credentials_migrated_v2', 'true');
      setHasMigrated(true);
    } catch (err) {
      logger.error('Migration failed', err, 'CredentialsTab');
    } finally {
      setMigrating(false);
    }
  };

  // Clear email autofill from search
  useEffect(() => {
    if (searchTerm && searchTerm.includes('@')) {
      setSearchTerm('');
    }
  }, [searchTerm]);

  // Handle save credential
  const handleSaveCredential = async (apiKeyField, value, providerName) => {
    try {
      // Find provider by name
      const provider = AI_PROVIDERS.find(p => p.name === providerName);
      if (!provider) {
        throw new Error(`Provider ${providerName} not found`);
      }

      // Save using context
      const result = await setCredential(provider.id, value?.trim());

      if (!result.success) {
        throw new Error(result.error);
      }

      // Success feedback
      setSuccess('Credencial guardada exitosamente');
      setTimeout(() => {
        setSuccess(null);
        setSelectedProvider(null);
      }, 2000);

    } catch (err) {
      logger.error(`Error saving credential for ${providerName}`, err, 'CredentialsTab');
      throw new Error(`Error al guardar: ${err.message}`);
    }
  };

  // Handle save custom credential
  const handleSaveCustomCredential = async (providerName, apiKey) => {
    try {
      const result = await setCustomCredential(providerName, apiKey);

      if (!result.success) {
        throw new Error(result.error);
      }

      setShowAddCustomModal(false);
      setSuccess(`Credencial "${providerName}" guardada exitosamente`);
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      logger.error('Error saving custom credential', err, 'CredentialsTab');
      throw err;
    }
  };

  // Handle delete custom credential
  const handleDeleteCustomCredential = async (providerId) => {
    const displayName = credentials[providerId]?.displayName || providerId;

    if (!confirm(`¿Eliminar la credencial "${displayName}"?`)) return;

    try {
      const result = await deleteCredential(providerId);

      if (!result.success) {
        throw new Error(result.error);
      }

      setSuccess(`Credencial eliminada`);
      setTimeout(() => setSuccess(null), 3000);

    } catch (err) {
      logger.error('Error deleting custom credential', err, 'CredentialsTab');
      setError(`Error al eliminar: ${err.message}`);
      setTimeout(() => setError(null), 3000);
    }
  };

  // Check if provider is configured
  const isProviderConfigured = (provider) => {
    const cred = credentials[provider.id];
    return !!(cred?.apiKey?.trim());
  };

  // Get credential value for a provider
  const getCredentialValue = (provider) => {
    const cred = credentials[provider.id];
    return cred?.apiKey || '';
  };

  // Filter providers
  const filteredProviders = providers.filter(provider => {
    const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         provider.description.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'configured') return provider.configured;
    if (filter === 'unconfigured') return !provider.configured;
    return true;
  });

  // Filter custom credentials
  const filteredCustomCredentials = customCredentials.filter(cred => {
    const name = cred.displayName || cred.id;
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'configured') return !!(cred.apiKey?.trim());
    if (filter === 'unconfigured') return !(cred.apiKey?.trim());
    return true;
  });

  // Totals for filter buttons
  const totalCount = AI_PROVIDERS.length + customCredentials.length;
  const totalConfigured = configuredCount + customCredentials.filter(c => c.apiKey?.trim()).length;
  const totalUnconfigured = totalCount - totalConfigured;

  // Loading state
  if (loading || migrating) {
    return <BaseLoading variant="card" text={migrating ? "Migrando credenciales..." : "Cargando..."} />;
  }

  return (
    <div className="w-full">
      {/* Alerts */}
      {(error || contextError) && (
        <BaseAlert variant="danger" title="Error" dismissible onDismiss={() => setError(null)}>
          {error || contextError}
        </BaseAlert>
      )}
      {success && (
        <BaseAlert variant="success" title="Éxito" dismissible onDismiss={() => setSuccess(null)}>
          {success}
        </BaseAlert>
      )}

      {/* Search - wrapped in form to block autofill */}
      <form autoComplete="off" onSubmit={(e) => e.preventDefault()} style={{ margin: 0 }}>
        <input type="email" name="fake-email" autoComplete="email" style={{ position: 'absolute', top: '-9999px', left: '-9999px' }} tabIndex="-1" />
        <input type="text" name="fake-search" autoComplete="off" style={{ position: 'absolute', top: '-9999px', left: '-9999px' }} tabIndex="-1" />
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Buscar proveedores..."
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          className="mb-4 w-full"
        />
      </form>

      {/* Filters */}
      <div className="w-full flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
          >
            Todos ({totalCount})
          </button>
          <button
            onClick={() => setFilter('configured')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'configured' ? 'bg-green-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
          >
            Configurados ({totalConfigured})
          </button>
          <button
            onClick={() => setFilter('unconfigured')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${filter === 'unconfigured' ? 'bg-amber-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
          >
            Sin Configurar ({totalUnconfigured})
          </button>
          <button
            onClick={() => setShowAddCustomModal(true)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Plus size={16} />
            Agregar Credencial
          </button>
        </div>

        <button
          onClick={refreshBackend}
          className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-2"
          title="Actualizar credenciales del backend"
        >
          <RefreshCw size={16} />
          Actualizar
        </button>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="w-full grid-responsive-cards gap-4">
          {/* Standard providers */}
          {filteredProviders.map((provider) => {
            const isConfigured = provider.configured;
            return (
              <UniversalCard
                key={provider.id}
                variant="default"
                size="sm"
                icon={() => <div className="text-5xl">{provider.emoji}</div>}
                title={provider.name}
                description={provider.description}
                badges={[
                  isConfigured
                    ? { variant: 'success', children: <><CheckCircle size={14} className="inline" /> Configurado</> }
                    : { variant: 'warning', children: <><XCircle size={14} className="inline" /> Sin Configurar</> }
                ]}
                actions={
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedProvider(provider);
                    }}
                    className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium"
                  >
                    {isConfigured ? 'Editar' : 'Configurar'}
                  </button>
                }
              />
            );
          })}

          {/* Custom credentials */}
          {filteredCustomCredentials.map((cred) => {
            const hasKey = !!(cred.apiKey?.trim());
            const displayName = cred.displayName || cred.id.replace('custom_', '');

            return (
              <UniversalCard
                key={cred.id}
                variant="default"
                size="sm"
                icon={() => <div className="text-5xl">🔑</div>}
                title={displayName}
                description="Credencial personalizada"
                badges={[
                  hasKey
                    ? { variant: 'success', children: <><CheckCircle size={14} className="inline" /> Configurado</> }
                    : { variant: 'warning', children: <><XCircle size={14} className="inline" /> Sin Configurar</> },
                  { variant: 'info', children: 'Personalizado' }
                ]}
                actions={
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteCustomCredential(cred.id);
                      }}
                      className="px-3 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                }
              />
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="w-full flex flex-col gap-3">
          {/* Standard providers - List view */}
          {filteredProviders.map((provider) => {
            const isConfigured = provider.configured;
            return (
              <UniversalCard
                key={provider.id}
                variant="compact"
                layout="row"
                icon={() => <span className="text-4xl">{provider.emoji}</span>}
                title={provider.name}
                description={provider.description}
                badges={[
                  isConfigured
                    ? { variant: 'success', children: <><CheckCircle size={14} className="inline mr-1" /> Configurado</> }
                    : { variant: 'warning', children: <><XCircle size={14} className="inline mr-1" /> Sin Configurar</> }
                ]}
                actions={[
                  <button
                    key="config"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProvider(provider);
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm"
                  >
                    {isConfigured ? 'Editar' : 'Configurar'}
                  </button>
                ]}
                onClick={() => setSelectedProvider(provider)}
              />
            );
          })}

          {/* Custom credentials - List view */}
          {filteredCustomCredentials.map((cred) => {
            const hasKey = !!(cred.apiKey?.trim());
            const displayName = cred.displayName || cred.id.replace('custom_', '');

            return (
              <UniversalCard
                key={cred.id}
                variant="compact"
                layout="row"
                icon={() => <span className="text-4xl">🔑</span>}
                title={displayName}
                description="Credencial personalizada"
                badges={[
                  hasKey
                    ? { variant: 'success', children: <><CheckCircle size={14} className="inline mr-1" /> Configurado</> }
                    : { variant: 'warning', children: <><XCircle size={14} className="inline mr-1" /> Sin Configurar</> },
                  { variant: 'info', children: 'Personalizado' }
                ]}
                actions={[
                  <button
                    key="delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCustomCredential(cred.id);
                    }}
                    className="px-3 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg"
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                ]}
              />
            );
          })}
        </div>
      )}

      {/* Provider Config Modal */}
      {selectedProvider && (
        <CredentialConfigModal
          provider={{
            ...selectedProvider,
            apiKeyField: `${selectedProvider.id}_api_key` // Legacy field name for modal
          }}
          initialValue={getCredentialValue(selectedProvider)}
          onSave={handleSaveCredential}
          onClose={() => setSelectedProvider(null)}
        />
      )}

      {/* Add Custom Credential Modal */}
      {showAddCustomModal && (
        <AddCustomCredentialModal
          onSave={handleSaveCustomCredential}
          onClose={() => setShowAddCustomModal(false)}
          existingNames={[
            ...AI_PROVIDERS.map(p => p.name),
            ...customCredentials.map(c => c.displayName || c.id)
          ]}
        />
      )}
    </div>
  );
}

export default CredentialsTab;
