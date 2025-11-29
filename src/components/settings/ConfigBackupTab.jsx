/**
 * @fileoverview Pestaña de Backup y Restauración de Configuraciones de IA
 * @module components/settings/ConfigBackupTab
 */

import { useState, useEffect } from 'react';
import {
  Download,
  Upload,
  Save,
  RotateCcw,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import {
  exportAllConfigurations,
  saveBackupToStorage,
  listBackups,
  restoreFromBackup,
  cleanOldBackups,
  downloadConfigurationsAsFile,
  importConfigurationsFromFile
} from '../../firebase/configBackup';
import { BaseButton, BaseAlert, BaseLoading, BaseModal } from '../common';
import logger from '../../utils/logger';

function ConfigBackupTab() {
  const { user } = useAuth();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      setLoading(true);
      const backupList = await listBackups();
      setBackups(backupList);
    } catch (err) {
      logger.error('Error cargando backups:', err);
      setError('Error al cargar lista de backups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setCreating(true);
      setError(null);
      setSuccess(null);

      await saveBackupToStorage(user.uid);
      setSuccess('Backup creado exitosamente');

      // Recargar lista de backups
      await loadBackups();

      // Limpiar backups antiguos (mantener últimos 10)
      await cleanOldBackups(10);
    } catch (err) {
      logger.error('Error creando backup:', err);
      setError('Error al crear backup: ' + err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async () => {
    try {
      setError(null);
      await downloadConfigurationsAsFile();
      setSuccess('Configuraciones descargadas');
    } catch (err) {
      logger.error('Error descargando:', err);
      setError('Error al descargar: ' + err.message);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setRestoring(true);
      setError(null);
      setSuccess(null);

      const results = await importConfigurationsFromFile(file, { overwrite: false });

      setSuccess(
        `Configuraciones importadas: ${results.success} exitosas, ${results.errors} errores`
      );

      // Limpiar input
      event.target.value = '';
    } catch (err) {
      logger.error('Error importando archivo:', err);
      setError('Error al importar: ' + err.message);
    } finally {
      setRestoring(false);
    }
  };

  const handleRestoreFromStorage = async () => {
    if (!selectedBackup) return;

    try {
      setRestoring(true);
      setError(null);
      setSuccess(null);

      const results = await restoreFromBackup(selectedBackup.path, { overwrite: false });

      setSuccess(
        `Configuraciones restauradas: ${results.success} exitosas, ${results.errors} errores`
      );
      setShowRestoreModal(false);
      setSelectedBackup(null);
    } catch (err) {
      logger.error('Error restaurando:', err);
      setError('Error al restaurar: ' + err.message);
    } finally {
      setRestoring(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header con explicación */}
      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-3">
          <Database className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
              Sistema de Backup de Configuraciones
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Protege tus configuraciones de IA contra pérdida accidental de datos. Los backups se guardan
              automáticamente en Firebase Storage y se pueden restaurar en cualquier momento.
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <BaseAlert
          variant="success"
          dismissible
          onDismiss={() => setSuccess(null)}
        >
          {success}
        </BaseAlert>
      )}

      {error && (
        <BaseAlert
          variant="danger"
          dismissible
          onDismiss={() => setError(null)}
        >
          {error}
        </BaseAlert>
      )}

      {/* Acciones rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-start gap-3 mb-3">
            <Save className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Crear Backup</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Guarda todas las configuraciones en Firebase Storage
              </p>
            </div>
          </div>
          <BaseButton
            variant="primary"
            onClick={handleCreateBackup}
            disabled={creating}
            fullWidth
          >
            {creating ? 'Creando...' : 'Crear Backup'}
          </BaseButton>
        </div>

        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-start gap-3 mb-3">
            <Download className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Descargar Archivo</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Exporta configuraciones a tu computadora (JSON)
              </p>
            </div>
          </div>
          <BaseButton
            variant="secondary"
            onClick={handleDownload}
            fullWidth
          >
            Descargar JSON
          </BaseButton>
        </div>

        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div className="flex items-start gap-3 mb-3">
            <Upload className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">Importar Archivo</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Restaura desde un archivo JSON descargado
              </p>
            </div>
          </div>
          <label className="block">
            <input
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              disabled={restoring}
              className="hidden"
            />
            <BaseButton
              variant="secondary"
              as="span"
              fullWidth
              disabled={restoring}
            >
              {restoring ? 'Importando...' : 'Seleccionar Archivo'}
            </BaseButton>
          </label>
        </div>
      </div>

      {/* Lista de backups en Storage */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Backups en Firebase Storage
        </h3>

        {loading ? (
          <BaseLoading text="Cargando backups..." />
        ) : backups.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No hay backups disponibles</p>
            <p className="text-sm mt-1">Crea tu primer backup usando el botón de arriba</p>
          </div>
        ) : (
          <div className="space-y-2">
            {backups.map((backup) => (
              <div
                key={backup.path}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatDate(backup.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {backup.sizeFormatted} • {backup.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <BaseButton
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedBackup(backup);
                      setShowRestoreModal(true);
                    }}
                  >
                    <RotateCcw size={16} strokeWidth={2} className="mr-1" />
                    Restaurar
                  </BaseButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de confirmación de restauración */}
      <BaseModal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        title="Confirmar Restauración"
        size="md"
      >
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="text-sm text-amber-900 dark:text-amber-100">
                  <strong>Importante:</strong> Esta acción restaurará las configuraciones de IA
                  desde el backup seleccionado.
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-200 mt-2">
                  Los documentos existentes NO serán eliminados, solo se agregarán/actualizarán
                  los del backup.
                </p>
              </div>
            </div>
          </div>

          {selectedBackup && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Backup:</strong> {formatDate(selectedBackup.createdAt)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Tamaño:</strong> {selectedBackup.sizeFormatted}
              </p>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <BaseButton
              variant="secondary"
              onClick={() => {
                setShowRestoreModal(false);
                setSelectedBackup(null);
              }}
              disabled={restoring}
            >
              Cancelar
            </BaseButton>
            <BaseButton
              variant="primary"
              onClick={handleRestoreFromStorage}
              disabled={restoring}
            >
              {restoring ? 'Restaurando...' : 'Confirmar Restauración'}
            </BaseButton>
          </div>
        </div>
      </BaseModal>
    </div>
  );
}

export default ConfigBackupTab;
