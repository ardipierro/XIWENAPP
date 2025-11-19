/**
 * @fileoverview Panel de administración del caché de audios TTS
 * @module components/settings/AudioCacheTab
 */

import { useState, useEffect } from 'react';
import {
  Database,
  Trash2,
  RefreshCw,
  Download,
  HardDrive,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  Clock,
  FileAudio
} from 'lucide-react';
import { BaseButton, BaseBadge } from '../common';
import { UniversalCard } from '../cards';
import audioCacheService from '../../services/audioCache';
import logger from '../../utils/logger';

/**
 * Tab de administración de caché de audio en Settings
 */
function AudioCacheTab() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const globalStats = await audioCacheService.getCacheStats();
      setStats(globalStats);
      setLastRefresh(new Date());
      logger.info('Cache stats loaded:', globalStats);
    } catch (err) {
      logger.error('Error loading cache stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('⚠️ ¿Estás seguro de que quieres eliminar TODOS los audios cacheados?\n\nEsto no se puede deshacer y los audios deberán regenerarse.')) {
      return;
    }

    setClearing(true);
    try {
      // Limpiar todos los contextos conocidos
      const contexts = ['interactive-book', 'dialogue', 'exercise'];
      let totalDeleted = 0;

      for (const context of contexts) {
        const result = await audioCacheService.clearCache(context);
        totalDeleted += result.deletedCount || 0;
      }

      alert(`✅ Caché limpiado exitosamente!\n\n${totalDeleted} archivos eliminados.`);
      await loadStats(); // Recargar stats
    } catch (err) {
      logger.error('Error clearing cache:', err);
      alert('❌ Error al limpiar el caché. Ver consola para detalles.');
    } finally {
      setClearing(false);
    }
  };

  const handleClearOld = async () => {
    const months = prompt('¿Eliminar archivos de más de cuántos meses?\n\n(Por ejemplo: 3 para eliminar archivos de hace más de 3 meses)', '6');

    if (!months) return;

    const monthsNum = parseInt(months);
    if (isNaN(monthsNum) || monthsNum < 1) {
      alert('❌ Número de meses inválido');
      return;
    }

    setClearing(true);
    try {
      const oldDate = new Date();
      oldDate.setMonth(oldDate.getMonth() - monthsNum);

      const contexts = ['interactive-book', 'dialogue', 'exercise'];
      let totalDeleted = 0;

      for (const context of contexts) {
        const result = await audioCacheService.clearCache(context, {
          olderThan: oldDate
        });
        totalDeleted += result.deletedCount || 0;
      }

      alert(`✅ Limpieza de archivos antiguos completada!\n\n${totalDeleted} archivos eliminados (más de ${monthsNum} meses).`);
      await loadStats();
    } catch (err) {
      logger.error('Error clearing old cache:', err);
      alert('❌ Error al limpiar archivos antiguos. Ver consola para detalles.');
    } finally {
      setClearing(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const hitRate = stats?.sessionStats ? audioCacheService.getHitRate() : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="animate-spin text-purple-600 dark:text-purple-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Database size={28} className="text-purple-600 dark:text-purple-400" />
            Caché de Audio TTS
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Sistema de caché inteligente para audios generados por ElevenLabs
          </p>
        </div>
        <BaseButton
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={loadStats}
          disabled={loading}
        >
          Actualizar
        </BaseButton>
      </div>

      {/* Estadísticas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total de Archivos */}
        <UniversalCard variant="default" size="sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Archivos Cacheados
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats?.totalFiles || 0}
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <FileAudio size={24} className="text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </UniversalCard>

        {/* Tamaño Total */}
        <UniversalCard variant="default" size="sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Espacio Usado
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats?.totalSizeFormatted || '0 B'}
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-blue-900/30 flex items-center justify-center">
              <HardDrive size={24} className="text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </UniversalCard>

        {/* Hit Rate */}
        <UniversalCard variant="default" size="sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Hit Rate (Sesión)
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {hitRate}%
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Zap size={24} className="text-green-600 dark:text-green-400" />
            </div>
          </div>
        </UniversalCard>
      </div>

      {/* Estadísticas de Sesión */}
      {stats?.sessionStats && (
        <UniversalCard
          variant="default"
          size="md"
          title="Estadísticas de la Sesión Actual"
          subtitle="Rendimiento del caché desde que abriste la aplicación"
        >
          <div className="grid grid-cols-3 gap-4">
            {/* Cache Hits */}
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle size={32} className="mx-auto mb-2 text-green-600 dark:text-green-400" />
              <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                {stats.sessionStats.hits}
              </div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                Cache Hits
              </div>
            </div>

            {/* Cache Misses */}
            <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <XCircle size={32} className="mx-auto mb-2 text-orange-600 dark:text-orange-400" />
              <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                {stats.sessionStats.misses}
              </div>
              <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                Cache Misses
              </div>
            </div>

            {/* Errors */}
            <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <AlertCircle size={32} className="mx-auto mb-2 text-red-600 dark:text-red-400" />
              <div className="text-2xl font-bold text-red-700 dark:text-red-300">
                {stats.sessionStats.errors}
              </div>
              <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                Errores
              </div>
            </div>
          </div>

          {/* Explicación */}
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/20 rounded-lg">
            <div className="flex items-start gap-2">
              <TrendingUp size={18} className="text-gray-600 dark:text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Hit Rate alto</strong> = Más audios servidos desde caché (más rápido, menos costos).
                <br />
                <strong>Cache Miss</strong> = Audio no estaba en caché, se generó con ElevenLabs.
              </div>
            </div>
          </div>
        </UniversalCard>
      )}

      {/* Información del Sistema */}
      <UniversalCard
        variant="default"
        size="md"
        title="Información del Sistema"
      >
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Última actualización
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {formatDate(lastRefresh)}
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Límite de Firebase (Free Tier)
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              5 GB (~33,000 audios)
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Tamaño promedio por audio
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              ~150 KB
            </span>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Capacidad restante estimada
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {stats?.totalSize
                ? formatBytes(5 * 1024 * 1024 * 1024 - stats.totalSize)
                : '5 GB'}
            </span>
          </div>
        </div>
      </UniversalCard>

      {/* Acciones de Mantenimiento */}
      <UniversalCard
        variant="default"
        size="md"
        title="Mantenimiento del Caché"
        subtitle="Gestiona el espacio de almacenamiento de audios"
      >
        <div className="space-y-4">
          {/* Botón: Limpiar archivos antiguos */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                Limpiar Archivos Antiguos
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Elimina audios de más de X meses sin uso
              </div>
            </div>
            <BaseButton
              variant="outline"
              size="sm"
              icon={Clock}
              onClick={handleClearOld}
              disabled={clearing}
            >
              Limpiar Antiguos
            </BaseButton>
          </div>

          {/* Botón: Limpiar todo */}
          <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div>
              <div className="font-medium text-red-700 dark:text-red-300">
                Limpiar Todo el Caché
              </div>
              <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                ⚠️ Elimina TODOS los audios cacheados (no se puede deshacer)
              </div>
            </div>
            <BaseButton
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={handleClearAll}
              disabled={clearing}
            >
              {clearing ? 'Limpiando...' : 'Limpiar Todo'}
            </BaseButton>
          </div>

          {/* Advertencia */}
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-700 dark:text-amber-300">
                Al limpiar el caché, los audios deberán regenerarse con ElevenLabs en la próxima reproducción.
                Esto aumentará temporalmente las llamadas a la API.
              </div>
            </div>
          </div>
        </div>
      </UniversalCard>

      {/* Cómo Funciona */}
      <UniversalCard
        variant="default"
        size="md"
        title="Cómo Funciona el Caché"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-purple-600 dark:text-purple-400">1</span>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                Generación de Hash
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Cada audio se identifica con un hash único basado en: texto, voz, velocidad
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-purple-600 dark:text-purple-400">2</span>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                Verificación en Caché
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Antes de generar, verifica si el audio ya existe en Firebase Storage
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-purple-600 dark:text-purple-400">3</span>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                Servir o Generar
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Si existe: descarga instantánea (~500ms). Si no: genera con ElevenLabs y guarda
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle size={18} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-700 dark:text-green-300">
                <strong>Resultado:</strong> Ahorro de ~99% en llamadas a API para contenido repetido
                y reproducción 4-10x más rápida en revisitas.
              </div>
            </div>
          </div>
        </div>
      </UniversalCard>
    </div>
  );
}

export default AudioCacheTab;
