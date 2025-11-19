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
    <div className="w-full h-full overflow-y-auto bg-white dark:bg-gray-900">
      {/* Mini Navigation */}
      <nav style={{ background: 'var(--color-bg-primary)', borderBottom: '1px solid var(--color-border)' }} className="px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <GraduationCap size={20} style={{ color: 'var(--color-text-primary)' }} />
            <span className="font-bold text-sm" style={{ color: 'var(--color-text-primary)' }}>XIWEN</span>
          </div>
          <div className="flex gap-2">
            <BaseButton variant="ghost" size="sm">Login</BaseButton>
            <BaseButton variant="primary" size="sm">Registro</BaseButton>
          </div>
        </div>
      </nav>

      {/* Hero Preview */}
      <section style={{ background: 'linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%)' }} className="px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: 'var(--color-text-primary)' }}>
            {config.hero?.title || 'Título'}
            {' '}
            <span style={{
              background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-light) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              {config.hero?.titleGradient || ''}
            </span>
          </h1>
          <p className="text-sm mb-4 max-w-2xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
            {config.hero?.subtitle || 'Subtítulo'}
          </p>
          <div className="flex gap-2 justify-center mb-4">
            <BaseButton variant="primary" size="sm">Comenzar Ahora</BaseButton>
            <BaseButton variant="outline" size="sm">Ver Demo</BaseButton>
          </div>
          <div className="flex gap-4 justify-center text-xs">
            {config.hero?.stats?.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="font-bold" style={{ color: 'var(--color-text-primary)' }}>{stat.number}</div>
                <div style={{ color: 'var(--color-text-secondary)' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="px-4 py-8" style={{ background: 'var(--color-bg-secondary)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              ¿Por qué elegir XIWEN?
            </h2>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              La plataforma más completa
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {config.features?.slice(0, 6).map((feature, index) => {
              const Icon = ICON_MAP[feature.icon] || BookOpen;
              return (
                <div
                  key={index}
                  className="p-3 rounded-lg"
                  style={{
                    background: 'var(--color-bg-primary)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{
                    background: 'var(--color-bg-tertiary)'
                  }}>
                    <Icon size={16} style={{ color: 'var(--color-accent)' }} />
                  </div>
                  <h3 className="text-xs font-semibold mb-1 truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {feature.title}
                  </h3>
                  <p className="text-[10px] line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
          {config.features?.length > 6 && (
            <p className="text-center text-xs mt-3" style={{ color: 'var(--color-text-muted)' }}>
              +{config.features.length - 6} más características
            </p>
          )}
        </div>
      </section>

      {/* Featured Content Preview (if enabled) */}
      {config.featuredContent?.enabled &&
       ((config.featuredContent.exercises?.length > 0) ||
        (config.featuredContent.videos?.length > 0)) && (
        <section className="px-4 py-8" style={{ background: 'linear-gradient(135deg, var(--color-bg-primary) 0%, var(--color-bg-secondary) 100%)' }}>
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-4">
              <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Contenido Destacado
              </h2>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Ejercicios y videos seleccionados
              </p>
            </div>
            <div className="rounded-xl overflow-hidden shadow-lg" style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}>
              <div className="aspect-video flex items-center justify-center relative" style={{ background: 'var(--color-bg-tertiary)' }}>
                <div className="text-center p-4">
                  <BookOpen size={32} className="mx-auto mb-2" style={{ color: 'var(--color-accent)' }} />
                  <p className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>Contenido Interactivo</p>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    {config.featuredContent.exercises?.length || 0} ejercicios • {config.featuredContent.videos?.length || 0} videos
                  </p>
                </div>
                {/* Mini controls */}
                <div className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full shadow flex items-center justify-center" style={{ background: 'var(--color-bg-primary)' }}>
                  <ChevronLeft size={12} style={{ color: 'var(--color-text-primary)' }} />
                </div>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full shadow flex items-center justify-center" style={{ background: 'var(--color-bg-primary)' }}>
                  <ChevronRight size={12} style={{ color: 'var(--color-text-primary)' }} />
                </div>
              </div>
              <div className="p-2 text-center">
                <p className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                  Rotación: {config.featuredContent.rotationSpeed / 1000}s
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FAQs Preview */}
      <section className="px-4 py-8" style={{ background: 'var(--color-bg-primary)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Preguntas Frecuentes
            </h2>
          </div>
          <div className="space-y-2">
            {config.faqs?.slice(0, 3).map((faq, index) => (
              <div
                key={index}
                className="p-3 rounded-lg"
                style={{
                  background: 'var(--color-bg-secondary)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold flex-1 truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {faq.question}
                  </h4>
                  <span style={{ color: 'var(--color-text-muted)' }}>+</span>
                </div>
              </div>
            ))}
          </div>
          {config.faqs?.length > 3 && (
            <p className="text-center text-xs mt-3" style={{ color: 'var(--color-text-muted)' }}>
              +{config.faqs.length - 3} más preguntas
            </p>
          )}
        </div>
      </section>

      {/* CTA Preview */}
      <section className="px-4 py-8" style={{ background: 'var(--color-accent)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl font-bold text-white mb-2">
            {config.cta?.title || 'Call to Action'}
          </h2>
          <p className="text-sm text-white opacity-90 mb-4">
            {config.cta?.subtitle || 'Subtítulo del CTA'}
          </p>
          <div className="flex gap-2 justify-center">
            <BaseButton variant="white" size="sm">
              {config.cta?.primaryButtonText || 'Botón Principal'}
            </BaseButton>
            <BaseButton variant="outline" size="sm" className="text-white border-white hover:bg-white/10">
              {config.cta?.secondaryButtonText || 'Botón Secundario'}
            </BaseButton>
          </div>
        </div>
      </section>

      {/* Footer Preview */}
      <footer className="px-4 py-6 border-t" style={{ background: 'var(--color-bg-secondary)', borderTop: '1px solid var(--color-border)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <GraduationCap size={16} style={{ color: 'var(--color-text-primary)' }} />
            <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>XIWEN</span>
          </div>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            &copy; 2025 XIWEN. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPagePreview;
