/**
 * @fileoverview Sistema de Backup y Restauración de Configuraciones de IA
 * Protege contra pérdida de datos por eliminación accidental de Firestore
 * @module firebase/configBackup
 */

import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import {
  ref,
  uploadString,
  getDownloadURL,
  listAll,
  getMetadata,
  deleteObject
} from 'firebase/storage';
import { db, storage } from './config';
import logger from '../utils/logger';

/**
 * Colecciones de configuración a respaldar
 */
const CONFIG_COLLECTIONS = {
  AI_CREDENTIALS: 'ai_credentials',
  AI_CONFIG: 'ai_config',
  CORRECTION_PROFILES: 'correction_profiles',
  LANDING_CONFIG: 'landing_config',
  EXERCISE_BUILDER_CONFIG: 'exercise_builder_config'
};

/**
 * Exporta todas las configuraciones de IA a un objeto JSON
 * @returns {Promise<Object>} Objeto con todas las configuraciones
 */
export async function exportAllConfigurations() {
  try {
    logger.info('Exportando configuraciones de IA...', 'configBackup');

    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      collections: {}
    };

    // Exportar cada colección
    for (const [key, collectionName] of Object.entries(CONFIG_COLLECTIONS)) {
      try {
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);

        backup.collections[collectionName] = [];

        snapshot.forEach(doc => {
          backup.collections[collectionName].push({
            id: doc.id,
            data: doc.data()
          });
        });

        logger.debug(`✅ ${collectionName}: ${snapshot.size} documentos`, 'configBackup');
      } catch (err) {
        logger.warn(`⚠️ Error exportando ${collectionName}:`, err, 'configBackup');
        backup.collections[collectionName] = [];
      }
    }

    logger.info('✅ Exportación completa', 'configBackup');
    return backup;
  } catch (err) {
    logger.error('❌ Error exportando configuraciones:', err, 'configBackup');
    throw err;
  }
}

/**
 * Importa configuraciones desde un objeto JSON
 * @param {Object} backup - Objeto de backup
 * @param {Object} options - Opciones de importación
 * @param {boolean} options.overwrite - Si sobreescribir documentos existentes
 * @returns {Promise<Object>} Resultado de la importación
 */
export async function importAllConfigurations(backup, options = { overwrite: false }) {
  try {
    logger.info('Importando configuraciones...', 'configBackup');

    const results = {
      success: 0,
      skipped: 0,
      errors: 0,
      collections: {}
    };

    for (const [collectionName, documents] of Object.entries(backup.collections)) {
      if (!documents || !Array.isArray(documents)) {
        logger.warn(`⚠️ Colección ${collectionName} vacía o inválida`, 'configBackup');
        continue;
      }

      results.collections[collectionName] = {
        success: 0,
        skipped: 0,
        errors: 0
      };

      for (const { id, data } of documents) {
        try {
          const docRef = doc(db, collectionName, id);

          await setDoc(docRef, data, {
            merge: !options.overwrite
          });

          results.success++;
          results.collections[collectionName].success++;
        } catch (err) {
          logger.error(`❌ Error importando ${collectionName}/${id}:`, err, 'configBackup');
          results.errors++;
          results.collections[collectionName].errors++;
        }
      }

      logger.debug(
        `✅ ${collectionName}: ${results.collections[collectionName].success} importados`,
        'configBackup'
      );
    }

    logger.info('✅ Importación completa', 'configBackup');
    return results;
  } catch (err) {
    logger.error('❌ Error importando configuraciones:', err, 'configBackup');
    throw err;
  }
}

/**
 * Guarda un backup en Firebase Storage
 * @param {string} userId - ID del usuario que crea el backup
 * @returns {Promise<string>} URL del backup guardado
 */
export async function saveBackupToStorage(userId) {
  try {
    logger.info('Guardando backup en Firebase Storage...', 'configBackup');

    // Exportar configuraciones
    const backup = await exportAllConfigurations();

    // Agregar metadata
    backup.metadata = {
      createdBy: userId,
      createdAt: new Date().toISOString(),
      app: 'XIWEN',
      type: 'ai_configurations'
    };

    // Crear nombre de archivo con timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `ai-config-backup-${timestamp}.json`;
    const filePath = `backups/ai-configs/${fileName}`;

    // Convertir a JSON string
    const jsonString = JSON.stringify(backup, null, 2);

    // Subir a Storage
    const storageRef = ref(storage, filePath);
    await uploadString(storageRef, jsonString, 'raw', {
      contentType: 'application/json',
      customMetadata: {
        createdBy: userId,
        createdAt: backup.metadata.createdAt
      }
    });

    // Obtener URL de descarga
    const downloadURL = await getDownloadURL(storageRef);

    logger.info(`✅ Backup guardado: ${fileName}`, 'configBackup');
    return downloadURL;
  } catch (err) {
    logger.error('❌ Error guardando backup:', err, 'configBackup');
    throw err;
  }
}

/**
 * Lista todos los backups disponibles en Storage
 * @returns {Promise<Array>} Lista de backups con metadata
 */
export async function listBackups() {
  try {
    logger.info('Listando backups disponibles...', 'configBackup');

    const storageRef = ref(storage, 'backups/ai-configs');
    const result = await listAll(storageRef);

    const backups = await Promise.all(
      result.items.map(async (itemRef) => {
        try {
          const metadata = await getMetadata(itemRef);
          const downloadURL = await getDownloadURL(itemRef);

          return {
            name: itemRef.name,
            path: itemRef.fullPath,
            downloadURL,
            createdAt: metadata.customMetadata?.createdAt || metadata.timeCreated,
            createdBy: metadata.customMetadata?.createdBy,
            size: metadata.size,
            sizeFormatted: formatBytes(metadata.size)
          };
        } catch (err) {
          logger.warn(`⚠️ Error obteniendo metadata de ${itemRef.name}`, 'configBackup');
          return null;
        }
      })
    );

    // Filtrar nulls y ordenar por fecha (más reciente primero)
    const validBackups = backups
      .filter(b => b !== null)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    logger.info(`✅ ${validBackups.length} backups encontrados`, 'configBackup');
    return validBackups;
  } catch (err) {
    logger.error('❌ Error listando backups:', err, 'configBackup');
    return [];
  }
}

/**
 * Restaura configuraciones desde un backup en Storage
 * @param {string} backupPath - Path del backup en Storage
 * @param {Object} options - Opciones de restauración
 * @returns {Promise<Object>} Resultado de la restauración
 */
export async function restoreFromBackup(backupPath, options = { overwrite: false }) {
  try {
    logger.info(`Restaurando desde backup: ${backupPath}`, 'configBackup');

    // Descargar backup
    const storageRef = ref(storage, backupPath);
    const downloadURL = await getDownloadURL(storageRef);

    const response = await fetch(downloadURL);
    const backup = await response.json();

    // Importar configuraciones
    const results = await importAllConfigurations(backup, options);

    logger.info('✅ Restauración completa', 'configBackup');
    return results;
  } catch (err) {
    logger.error('❌ Error restaurando backup:', err, 'configBackup');
    throw err;
  }
}

/**
 * Elimina backups antiguos (mantiene solo los últimos N)
 * @param {number} keepCount - Número de backups a mantener
 * @returns {Promise<number>} Número de backups eliminados
 */
export async function cleanOldBackups(keepCount = 10) {
  try {
    logger.info(`Limpiando backups antiguos (manteniendo ${keepCount})...`, 'configBackup');

    const backups = await listBackups();

    if (backups.length <= keepCount) {
      logger.info('✅ No hay backups para limpiar', 'configBackup');
      return 0;
    }

    // Eliminar los más antiguos
    const toDelete = backups.slice(keepCount);
    let deletedCount = 0;

    for (const backup of toDelete) {
      try {
        const storageRef = ref(storage, backup.path);
        await deleteObject(storageRef);
        deletedCount++;
        logger.debug(`🗑️ Eliminado: ${backup.name}`, 'configBackup');
      } catch (err) {
        logger.warn(`⚠️ Error eliminando ${backup.name}`, 'configBackup');
      }
    }

    logger.info(`✅ ${deletedCount} backups eliminados`, 'configBackup');
    return deletedCount;
  } catch (err) {
    logger.error('❌ Error limpiando backups:', err, 'configBackup');
    return 0;
  }
}

/**
 * Descarga configuraciones como archivo JSON
 * @param {string} filename - Nombre del archivo (opcional)
 */
export async function downloadConfigurationsAsFile(filename) {
  try {
    const backup = await exportAllConfigurations();

    const jsonString = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const defaultFilename = `xiwen-ai-config-${new Date().toISOString().split('T')[0]}.json`;
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || defaultFilename;
    link.click();

    URL.revokeObjectURL(url);

    logger.info(`✅ Configuraciones descargadas: ${link.download}`, 'configBackup');
  } catch (err) {
    logger.error('❌ Error descargando configuraciones:', err, 'configBackup');
    throw err;
  }
}

/**
 * Importa configuraciones desde un archivo JSON
 * @param {File} file - Archivo JSON
 * @param {Object} options - Opciones de importación
 * @returns {Promise<Object>} Resultado de la importación
 */
export async function importConfigurationsFromFile(file, options = { overwrite: false }) {
  try {
    logger.info('Importando configuraciones desde archivo...', 'configBackup');

    const text = await file.text();
    const backup = JSON.parse(text);

    // Validar estructura
    if (!backup.collections) {
      throw new Error('Archivo de backup inválido: falta propiedad "collections"');
    }

    const results = await importAllConfigurations(backup, options);

    logger.info('✅ Configuraciones importadas desde archivo', 'configBackup');
    return results;
  } catch (err) {
    logger.error('❌ Error importando desde archivo:', err, 'configBackup');
    throw err;
  }
}

/**
 * Formatea bytes a tamaño legible
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
