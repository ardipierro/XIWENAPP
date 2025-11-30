/**
 * @fileoverview Panel de administración del caché de Google Translate
 * @module components/settings/GoogleTranslateCacheTab
 */

import { useState, useEffect } from 'react';
import {
  Database,
  Trash2,
  RefreshCw,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  Languages,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import { BaseButton } from '../common';
import { UniversalCard } from '../cards';
import googleTranslateCache from '../../utils/googleTranslateCache';
import logger from '../../utils/logger';

/**
 * Tab de administración de caché de Google Translate en Settings
 */
function GoogleTranslateCacheTab() {
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
      const cacheStats = googleTranslateCache.getCacheStats();
      setStats(cacheStats);
      setLastRefresh(new Date());
      logger.info('Google Translate cache stats loaded:', cacheStats);
    } catch (err) {
      logger.error('Error loading Google Translate cache stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('⚠️ ¿Estás seguro de que quieres eliminar TODAS las traducciones cacheadas?\n\nEsto no se puede deshacer y las traducciones deberán hacerse nuevamente con Google Translate API.')) {
      return;
    }

    setClearing(true);
    try {
      googleTranslateCache.clearCache();
      alert(`✅ Caché limpiado exitosamente!\n\nTodas las traducciones han sido eliminadas.`);
      await loadStats(); // Recargar stats
    } catch (err) {
      logger.error('Error clearing Google Translate cache:', err);
      alert('❌ Error al limpiar el caché. Ver consola para detalles.');
    } finally {
      setClearing(false);
    }
  };

  const handleExport = () => {
    try {
      const cacheData = googleTranslateCache.exportCache();
      const dataStr = JSON.stringify(cacheData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `google-translate-cache-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      alert('✅ Caché exportado exitosamente!');
    } catch (err) {
      logger.error('Error exporting cache:', err);
      alert('❌ Error al exportar el caché.');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const cacheData = JSON.parse(event.target.result);
          googleTranslateCache.importCache(cacheData);
          alert('✅ Caché importado exitosamente!');
          loadStats();
        } catch (err) {
          logger.error('Error importing cache:', err);
          alert('❌ Error al importar el caché. Verifica que el archivo sea válido.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
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

  const hitRate = stats?.sessionStats ? googleTranslateCache.getHitRate() : 0;

  // Calcular ahorro estimado ($0.02 por 1000 caracteres en Google Translate)
  const estimatedSavings = stats?.sessionStats
    ? (stats.sessionStats.hits * 0.02).toFixed(2)
    : '0.00';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="animate-spin text-blue-600 dark:text-blue-400" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Languages size={28} className="text-blue-600 dark:text-blue-400" />
            Caché de Google Translate
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Sistema de caché para reducir costos y mejorar velocidad de traducciones
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Total de Traducciones */}
        <UniversalCard variant="default" size="sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Traducciones
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats?.totalEntries || 0}
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Languages size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </UniversalCard>

        {/* Tamaño del Caché */}
        <UniversalCard variant="default" size="sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Tamaño
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats?.cacheSizeFormatted || '0 B'}
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <Database size={24} className="text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </UniversalCard>

        {/* Hit Rate */}
        <UniversalCard variant="default" size="sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Hit Rate
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

        {/* Ahorro Estimado */}
        <UniversalCard variant="default" size="sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Ahorro (USD)
              </div>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                ${estimatedSavings}
              </div>
            </div>
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <DollarSign size={24} className="text-emerald-600 dark:text-emerald-400" />
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
                API Calls
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
                <strong>Hit Rate alto</strong> = Más traducciones servidas desde caché (instantáneo, $0).
                <br />
                <strong>API Calls</strong> = Traducción no estaba en caché, se consultó Google Translate API ($).
              </div>
            </div>
          </div>
        </UniversalCard>
      )}

      {/* Configuración del Caché */}
      <UniversalCard
        variant="default"
        size="md"
        title="Configuración del Caché"
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
              Capacidad máxima
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {stats?.maxSize || 1000} traducciones
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Tiempo de expiración
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {stats?.expiryDays || 90} días
            </span>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Espacio disponible
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {stats?.totalEntries
                ? `${stats.maxSize - stats.totalEntries} traducciones`
                : `${stats?.maxSize || 1000} traducciones`}
            </span>
          </div>
        </div>
      </UniversalCard>

      {/* Acciones de Mantenimiento */}
      <UniversalCard
        variant="default"
        size="md"
        title="Mantenimiento del Caché"
        subtitle="Gestiona tus traducciones cacheadas"
      >
        <div className="space-y-4">
          {/* Exportar/Importar */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                Exportar / Importar Caché
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Guarda o restaura tus traducciones cacheadas
              </div>
            </div>
            <div className="flex gap-2">
              <BaseButton
                variant="outline"
                size="sm"
                icon={Download}
                onClick={handleExport}
              >
                Exportar
              </BaseButton>
              <BaseButton
                variant="outline"
                size="sm"
                icon={Upload}
                onClick={handleImport}
              >
                Importar
              </BaseButton>
            </div>
          </div>

          {/* Botón: Limpiar todo */}
          <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div>
              <div className="font-medium text-red-700 dark:text-red-300">
                Limpiar Todo el Caché
              </div>
              <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                ⚠️ Elimina TODAS las traducciones cacheadas (no se puede deshacer)
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
                Al limpiar el caché, las traducciones deberán consultarse nuevamente con Google Translate API.
                Esto aumentará temporalmente los costos y el tiempo de respuesta.
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
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">1</span>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                Verificación en Caché
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Antes de llamar a Google Translate API, busca si la traducción ya existe en localStorage
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">2</span>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                Servir o Consultar
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Si existe: retorna instantáneamente ($0). Si no: consulta Google Translate API y guarda
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">3</span>
            </div>
            <div>
              <div className="font-medium text-gray-900 dark:text-white">
                Gestión Automática
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Las traducciones expiran después de 90 días. Límite de 1000 traducciones (se borran las más antiguas)
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle size={18} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-green-700 dark:text-green-300">
                <strong>Resultado:</strong> Ahorro de ~90% en costos de API para traducciones repetidas
                y respuesta instantánea para contenido ya traducido.
              </div>
            </div>
          </div>
        </div>
      </UniversalCard>

      {/* Información de Costos */}
      <UniversalCard
        variant="default"
        size="md"
        title="Información de Costos de Google Translate API"
      >
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Costo por 1000 caracteres
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              $0.02 USD
            </span>
          </div>

          <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Promedio por traducción
            </span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              ~$0.001 USD (50 chars)
            </span>
          </div>

          <div className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Ahorro estimado (sesión)
            </span>
            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
              ${estimatedSavings} USD
            </span>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-start gap-2">
            <DollarSign size={18} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              El caché puede ahorrar cientos de dólares al año en aplicaciones con traducciones repetidas.
            </div>
          </div>
        </div>
      </UniversalCard>
    </div>
  );
}

export default GoogleTranslateCacheTab;
