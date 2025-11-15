/**
 * @fileoverview Servicio de caché de audios generados por TTS
 * Implementa patrón de caché basado en hash siguiendo las best practices de ElevenLabs
 * Referencia: https://elevenlabs.io/docs/cookbooks/text-to-speech/streaming-and-caching-with-supabase
 * @module services/audioCache
 */

import { ref, getDownloadURL, uploadBytes, getMetadata, listAll, deleteObject } from 'firebase/storage';
import { storage } from '../firebase/config';
import logger from '../utils/logger';
import { generateAudioHash, generateShortHash, validateHashParams } from '../utils/audioHash';

/**
 * Servicio de caché de audios en Firebase Storage
 *
 * Estrategia:
 * 1. Genera hash único del audio basado en texto + voiceConfig
 * 2. Verifica si existe en Firebase Storage
 * 3. Si existe: retorna URL del caché
 * 4. Si NO existe: genera, guarda en Storage, retorna URL
 *
 * Path structure: audio-cache/{context}/{hash}.mp3
 * - context: courseId, 'interactive-book', 'exercise', etc.
 * - hash: SHA-256 del contenido + parámetros
 */
class AudioCacheService {
  constructor() {
    this.cacheBasePath = 'audio-cache';
    this.stats = {
      hits: 0,      // Audios servidos desde caché
      misses: 0,    // Audios que tuvieron que generarse
      errors: 0     // Errores al cachear
    };
  }

  /**
   * Obtiene un audio del caché o lo genera si no existe
   *
   * @param {string} text - Texto a convertir en audio
   * @param {Object} voiceConfig - Configuración de voz (provider, voiceId, rate)
   * @param {string} context - Contexto del audio (courseId, 'interactive-book', etc.)
   * @param {Function} generateFn - Función async que genera el audio si no existe en caché
   *                                 Debe retornar { audioUrl: string } o { audioBlob: Blob }
   * @returns {Promise<Object>} { audioUrl: string, cached: boolean, hash: string }
   */
  async getOrGenerateAudio(text, voiceConfig, context, generateFn) {
    try {
      // Validar parámetros
      const validation = validateHashParams(text, voiceConfig);
      if (!validation.valid) {
        throw new Error(`Invalid params: ${validation.error}`);
      }

      // 1. Generar hash único
      const hash = await generateAudioHash(text, voiceConfig);
      const shortHash = hash.substring(0, 12);

      logger.info(`🔍 Audio cache lookup: ${shortHash}... (provider: ${voiceConfig.provider})`, 'AudioCache');

      // 2. Construir path en Storage
      const cachePath = `${this.cacheBasePath}/${context}/${hash}.mp3`;
      const storageRef = ref(storage, cachePath);

      // 3. Verificar si existe en Storage
      try {
        // getMetadata es más rápido que getDownloadURL
        const metadata = await getMetadata(storageRef);

        // Archivo existe en caché!
        const url = await getDownloadURL(storageRef);

        this.stats.hits++;

        logger.info(
          `✅ Cache HIT! ${shortHash}... (${this._formatBytes(metadata.size)})`,
          'AudioCache'
        );

        return {
          audioUrl: url,
          cached: true,
          hash: hash,
          size: metadata.size,
          generatedAt: metadata.customMetadata?.generatedAt
        };

      } catch (error) {
        // Error al obtener metadata
        if (error.code === 'storage/object-not-found') {
          // 4. Cache MISS - El archivo no existe, hay que generarlo
          this.stats.misses++;

          logger.info(
            `⚠️ Cache MISS: ${shortHash}... - Generando nuevo audio...`,
            'AudioCache'
          );

          // 5. Generar el audio usando la función provista
          const result = await generateFn();

          if (!result) {
            throw new Error('generateFn returned null or undefined');
          }

          // 6. Obtener el blob del audio
          let audioBlob;

          if (result.audioBlob) {
            // Si la función ya retorna un blob, usarlo directamente
            audioBlob = result.audioBlob;
          } else if (result.audioUrl) {
            // Si retorna una URL (blob: o http:), descargarla
            logger.info(`📥 Descargando audio para cachear...`, 'AudioCache');
            const response = await fetch(result.audioUrl);

            if (!response.ok) {
              throw new Error(`Failed to fetch audio: ${response.status}`);
            }

            audioBlob = await response.blob();
          } else {
            throw new Error('generateFn must return { audioUrl } or { audioBlob }');
          }

          // 7. Subir a Firebase Storage
          logger.info(`💾 Guardando en caché (${this._formatBytes(audioBlob.size)})...`, 'AudioCache');

          const uploadMetadata = {
            contentType: 'audio/mpeg',
            cacheControl: 'public, max-age=31536000', // Cache 1 año en CDN
            customMetadata: {
              text: text.substring(0, 200), // Primeros 200 chars para debug
              textLength: text.length.toString(),
              provider: voiceConfig.provider || 'unknown',
              voiceId: voiceConfig.voiceId || 'default',
              rate: (voiceConfig.rate || 1.0).toString(),
              context: context,
              generatedAt: new Date().toISOString(),
              hash: hash
            }
          };

          await uploadBytes(storageRef, audioBlob, uploadMetadata);

          // 8. Obtener URL permanente del archivo cacheado
          const permanentUrl = await getDownloadURL(storageRef);

          logger.info(
            `✅ Audio cacheado exitosamente: ${shortHash}...`,
            'AudioCache'
          );

          return {
            audioUrl: permanentUrl,
            cached: false,
            hash: hash,
            size: audioBlob.size,
            generatedAt: new Date().toISOString()
          };

        } else {
          // Otro tipo de error (permisos, red, etc.)
          throw error;
        }
      }

    } catch (error) {
      this.stats.errors++;

      logger.error(`❌ Error en AudioCache: ${error.message}`, 'AudioCache', error);

      // Fallback: intentar generar sin cachear
      try {
        logger.warn('⚠️ Fallback: generando audio SIN cachear', 'AudioCache');

        const result = await generateFn();

        return {
          ...result,
          cached: false,
          error: error.message
        };
      } catch (fallbackError) {
        logger.error('❌ Fallback también falló', 'AudioCache', fallbackError);
        throw fallbackError;
      }
    }
  }

  /**
   * Pre-genera y cachea un audio
   * Útil para generar audios en background antes de que el usuario los necesite
   *
   * @param {string} text - Texto a convertir en audio
   * @param {Object} voiceConfig - Configuración de voz
   * @param {string} context - Contexto del audio
   * @param {Function} generateFn - Función que genera el audio
   * @returns {Promise<Object>} Resultado del caché
   */
  async preGenerateAudio(text, voiceConfig, context, generateFn) {
    logger.info(`🔄 Pre-generando audio para caché...`, 'AudioCache');
    return this.getOrGenerateAudio(text, voiceConfig, context, generateFn);
  }

  /**
   * Verifica si un audio existe en caché sin descargarlo
   *
   * @param {string} text - Texto del audio
   * @param {Object} voiceConfig - Configuración de voz
   * @param {string} context - Contexto
   * @returns {Promise<boolean>} true si existe en caché
   */
  async existsInCache(text, voiceConfig, context) {
    try {
      const hash = await generateAudioHash(text, voiceConfig);
      const cachePath = `${this.cacheBasePath}/${context}/${hash}.mp3`;
      const storageRef = ref(storage, cachePath);

      await getMetadata(storageRef);
      return true;
    } catch (error) {
      if (error.code === 'storage/object-not-found') {
        return false;
      }
      throw error;
    }
  }

  /**
   * Limpia el caché de un contexto específico
   *
   * @param {string} context - Contexto a limpiar (ej: courseId)
   * @param {Object} options - Opciones de limpieza
   * @param {Date} options.olderThan - Eliminar archivos más antiguos que esta fecha
   * @returns {Promise<Object>} { deletedCount: number, errors: number }
   */
  async clearCache(context, options = {}) {
    try {
      const cachePath = `${this.cacheBasePath}/${context}`;
      const folderRef = ref(storage, cachePath);

      logger.info(`🗑️ Limpiando caché: ${context}...`, 'AudioCache');

      const listResult = await listAll(folderRef);

      let deletedCount = 0;
      let errors = 0;

      for (const itemRef of listResult.items) {
        try {
          // Si hay filtro de fecha, verificar
          if (options.olderThan) {
            const metadata = await getMetadata(itemRef);
            const generatedAt = new Date(metadata.customMetadata?.generatedAt);

            if (generatedAt > options.olderThan) {
              continue; // Skip - archivo es más reciente
            }
          }

          await deleteObject(itemRef);
          deletedCount++;
        } catch (err) {
          errors++;
          logger.error(`Error eliminando ${itemRef.fullPath}:`, err);
        }
      }

      logger.info(
        `✅ Caché limpiado: ${deletedCount} archivos eliminados, ${errors} errores`,
        'AudioCache'
      );

      return { deletedCount, errors };

    } catch (error) {
      logger.error('Error limpiando caché:', error);
      throw error;
    }
  }

  /**
   * Obtiene estadísticas del caché
   *
   * @param {string} context - Contexto (opcional)
   * @returns {Promise<Object>} Estadísticas
   */
  async getCacheStats(context = null) {
    try {
      const cachePath = context
        ? `${this.cacheBasePath}/${context}`
        : this.cacheBasePath;

      const folderRef = ref(storage, cachePath);
      const listResult = await listAll(folderRef);

      let totalSize = 0;
      let totalFiles = 0;

      // Si no hay contexto específico, contar subcarpetas también
      if (!context) {
        for (const prefixRef of listResult.prefixes) {
          const subStats = await this.getCacheStats(prefixRef.name);
          totalSize += subStats.totalSize;
          totalFiles += subStats.totalFiles;
        }
      }

      // Contar archivos en esta carpeta
      for (const itemRef of listResult.items) {
        const metadata = await getMetadata(itemRef);
        totalSize += metadata.size;
        totalFiles++;
      }

      return {
        context: context || 'all',
        totalFiles,
        totalSize,
        totalSizeFormatted: this._formatBytes(totalSize),
        sessionStats: { ...this.stats }
      };

    } catch (error) {
      logger.error('Error obteniendo stats de caché:', error);
      return {
        context: context || 'all',
        totalFiles: 0,
        totalSize: 0,
        error: error.message
      };
    }
  }

  /**
   * Resetea las estadísticas de la sesión
   */
  resetStats() {
    this.stats = { hits: 0, misses: 0, errors: 0 };
  }

  /**
   * Obtiene el hit rate del caché (% de aciertos)
   * @returns {number} Hit rate (0-100)
   */
  getHitRate() {
    const total = this.stats.hits + this.stats.misses;
    if (total === 0) return 0;
    return ((this.stats.hits / total) * 100).toFixed(2);
  }

  /**
   * Formatea bytes a formato legible
   * @private
   */
  _formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }
}

// Singleton
const audioCacheService = new AudioCacheService();

export default audioCacheService;
