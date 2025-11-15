/**
 * @fileoverview Preview component for Landing Page configuration
 * Shows real-time preview of landing page changes
 * @module components/settings/LandingPagePreview
 */

import {
  GraduationCap, CheckCircle, Check, BookOpen, Users,
  Target, Award, CreditCard, ChevronLeft, ChevronRight
} from 'lucide-react';
import BaseButton from '../common/BaseButton';

// Icon map for dynamic icon loading
const ICON_MAP = {
  BookText: BookOpen,
  Video: BookOpen,
  CreditCard,
  Gamepad2: Target,
  MessageSquare: BookOpen,
  Calendar: BookOpen,
  Moon: BookOpen,
  Layout: BookOpen,
  BarChart3: Target,
  Globe: Target,
  Palette: Target,
  Users,
  GraduationCap,
  CheckCircle,
  BookOpen,
  Award,
  Target
};

function LandingPagePreview({ config }) {
  if (!config) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          No hay configuración para previsualizar
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto bg-white dark:bg-gray-900 scrollbar-gutter-stable">
      {/* Mini Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <GraduationCap size={20} className="text-purple-600" />
            <span className="font-bold text-sm">XIWEN</span>
          </div>
          <div className="flex gap-2">
            <div className="w-16 h-6 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="w-16 h-6 bg-purple-600 rounded"></div>
          </div>
        </div>
      </nav>

      {/* Hero Preview */}
      <section className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">
            {config.hero?.title || 'Título'}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {config.hero?.titleGradient || ''}
            </span>
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 max-w-2xl mx-auto">
            {config.hero?.subtitle || 'Subtítulo'}
          </p>
          <div className="flex gap-2 justify-center mb-4">
            <div className="w-24 h-8 bg-purple-600 rounded-lg"></div>
            <div className="w-24 h-8 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg"></div>
          </div>
          <div className="flex gap-4 justify-center text-xs">
            {config.hero?.stats?.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="font-bold text-purple-600 dark:text-purple-400">{stat.number}</div>
                <div className="text-gray-600 dark:text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="px-4 py-8 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              ¿Por qué elegir XIWEN?
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              La plataforma más completa
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {config.features?.slice(0, 6).map((feature, index) => {
              const Icon = ICON_MAP[feature.icon] || BookOpen;
              return (
                <div
                  key={index}
                  className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-2">
                    <Icon size={16} className="text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="text-xs font-semibold text-gray-900 dark:text-white mb-1 truncate">
                    {feature.title}
                  </h3>
                  <p className="text-[10px] text-gray-600 dark:text-gray-400 line-clamp-2">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
          {config.features?.length > 6 && (
            <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-3">
              +{config.features.length - 6} más características
            </p>
          )}
        </div>
      </section>

      {/* Featured Content Preview (if enabled) */}
      {config.featuredContent?.enabled &&
       ((config.featuredContent.exercises?.length > 0) ||
        (config.featuredContent.videos?.length > 0)) && (
        <section className="px-4 py-8 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Contenido Destacado
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ejercicios y videos seleccionados
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
              <div className="aspect-video bg-gray-100 dark:bg-gray-900 flex items-center justify-center relative">
                <div className="text-center p-4">
                  <BookOpen size={32} className="mx-auto mb-2 text-purple-600 dark:text-purple-400" />
                  <p className="text-xs font-medium text-gray-900 dark:text-white">Contenido Interactivo</p>
                  <p className="text-[10px] text-gray-600 dark:text-gray-400 mt-1">
                    {config.featuredContent.exercises?.length || 0} ejercicios • {config.featuredContent.videos?.length || 0} videos
                  </p>
                </div>
                {/* Mini controls */}
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-gray-800 rounded-full shadow flex items-center justify-center">
                  <ChevronLeft size={12} />
                </div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 bg-white dark:bg-gray-800 rounded-full shadow flex items-center justify-center">
                  <ChevronRight size={12} />
                </div>
              </div>
              <div className="p-2 text-center">
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  Rotación: {config.featuredContent.rotationSpeed / 1000}s
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FAQs Preview */}
      <section className="px-4 py-8 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Preguntas Frecuentes
            </h2>
          </div>
          <div className="space-y-2">
            {config.faqs?.slice(0, 3).map((faq, index) => (
              <div
                key={index}
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-gray-900 dark:text-white flex-1 truncate">
                    {faq.question}
                  </h4>
                  <span className="text-gray-400">+</span>
                </div>
              </div>
            ))}
          </div>
          {config.faqs?.length > 3 && (
            <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-3">
              +{config.faqs.length - 3} más preguntas
            </p>
          )}
        </div>
      </section>

      {/* CTA Preview */}
      <section className="px-4 py-8 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl font-bold text-white mb-2">
            {config.cta?.title || 'Call to Action'}
          </h2>
          <p className="text-sm text-purple-100 mb-4">
            {config.cta?.subtitle || 'Subtítulo del CTA'}
          </p>
          <div className="flex gap-2 justify-center">
            <div className="px-4 py-2 bg-white text-purple-600 rounded-lg text-xs font-semibold">
              {config.cta?.primaryButtonText || 'Botón Principal'}
            </div>
            <div className="px-4 py-2 bg-transparent border border-white text-white rounded-lg text-xs font-semibold">
              {config.cta?.secondaryButtonText || 'Botón Secundario'}
            </div>
          </div>
        </div>
      </section>

      {/* Footer Preview */}
      <footer className="px-4 py-6 bg-gray-900 dark:bg-black border-t border-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <GraduationCap size={16} className="text-white" />
            <span className="text-sm font-bold text-white">XIWEN</span>
          </div>
          <p className="text-xs text-gray-400">
            &copy; 2025 XIWEN. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPagePreview;
