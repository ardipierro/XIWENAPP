import React, { useState, useEffect } from 'react';
import {
  GraduationCap, Gamepad2, Zap, BarChart3, Globe, Palette, Users,
  CheckCircle, Check, BookOpen, Target, Video, MessageSquare, Calendar,
  Moon, Layout, CreditCard, Award, BookText, Mic, ChevronLeft, ChevronRight
} from 'lucide-react';
import BaseButton from './components/common/BaseButton';
import { getLandingConfig } from './firebase/landingConfig';
import logger from './utils/logger';
import './LandingPage.css';

// Icon map for dynamic icon loading
const ICON_MAP = {
  BookText, Video, CreditCard, Gamepad2, MessageSquare, Calendar,
  Moon, Layout, BarChart3, Globe, Palette, Users, GraduationCap,
  CheckCircle, BookOpen, Award, Target
};

function LandingPage({ onNavigateToLogin, onNavigateToRegister }) {
  const [activeFAQ, setActiveFAQ] = useState(null);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    loadConfig();
  }, []);

  // Auto-rotate featured content
  useEffect(() => {
    if (!config?.featuredContent?.enabled) return;

    const totalSlides = (config.featuredContent.exercises?.length || 0) +
                       (config.featuredContent.videos?.length || 0);

    if (totalSlides <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % totalSlides);
    }, config.featuredContent.rotationSpeed || 5000);

    return () => clearInterval(interval);
  }, [config]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await getLandingConfig();
      setConfig(data);
      logger.debug('Landing config loaded for public page');
    } catch (error) {
      logger.error('Error loading landing config:', error);
      // Keep loading = true to show nothing if config fails
    } finally {
      setLoading(false);
    }
  };

  const toggleFAQ = (index) => {
    setActiveFAQ(activeFAQ === index ? null : index);
  };

  const nextSlide = () => {
    const totalSlides = (config.featuredContent.exercises?.length || 0) +
                       (config.featuredContent.videos?.length || 0);
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    const totalSlides = (config.featuredContent.exercises?.length || 0) +
                       (config.featuredContent.videos?.length || 0);
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  if (loading || !config) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="container nav-container">
          <div className="nav-brand">
            <span className="nav-logo">
              <GraduationCap size={32} strokeWidth={2} />
            </span>
            <h1>XIWEN</h1>
          </div>
          <div className="nav-links">
            <a href="#features">Características</a>
            <a href="#pricing">Precios</a>
            <a href="#faq">FAQ</a>
            <BaseButton variant="outline" onClick={onNavigateToLogin}>
              Iniciar Sesión
            </BaseButton>
            <BaseButton variant="primary" onClick={onNavigateToRegister}>
              Registrarse
            </BaseButton>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                {config.hero.title}
                <span className="gradient-text">{config.hero.titleGradient}</span>
              </h1>
              <p className="hero-description">
                {config.hero.subtitle}
              </p>
              <div className="hero-buttons">
                <BaseButton
                  variant="primary"
                  size="lg"
                  onClick={onNavigateToRegister}
                >
                  Comenzar Ahora
                </BaseButton>
                <BaseButton
                  variant="outline"
                  size="lg"
                  onClick={onNavigateToLogin}
                >
                  Iniciar Sesión
                </BaseButton>
              </div>
              <div className="hero-stats">
                {config.hero.stats.map((stat, index) => (
                  <div className="stat" key={index}>
                    <div className="stat-number">{stat.number}</div>
                    <div className="stat-label">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="hero-image">
              <div className="mockup-container">
                <div className="mockup-screen">
                  <div className="mockup-header">
                    <div className="mockup-dot"></div>
                    <div className="mockup-dot"></div>
                    <div className="mockup-dot"></div>
                  </div>
                  <div className="mockup-content">
                    <div className="quiz-demo">
                      <div className="demo-question">
                        <h3>¿Cómo se dice "Hello" en chino?</h3>
                        <div className="demo-options">
                          <div className="demo-option">你好 (Nǐ hǎo)</div>
                          <div className="demo-option">谢谢 (Xièxiè)</div>
                          <div className="demo-option">再见 (Zàijiàn)</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">¿Por qué elegir XIWEN?</h2>
            <p className="section-subtitle">
              La plataforma más completa para instituciones educativas
            </p>
          </div>
          <div className="features-grid">
            {config.features.map((feature) => {
              const Icon = ICON_MAP[feature.icon] || BookOpen;
              return (
                <div className="feature-card" key={feature.id}>
                  <div className="feature-icon">
                    <Icon size={40} strokeWidth={2} />
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Content Section (NEW - DYNAMIC) */}
      {config.featuredContent?.enabled &&
       ((config.featuredContent.exercises?.length > 0) ||
        (config.featuredContent.videos?.length > 0)) && (
        <section className="featured-section bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 py-12 md:py-20">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Contenido Destacado</h2>
              <p className="section-subtitle">
                Descubre algunos de nuestros ejercicios y recursos más populares
              </p>
            </div>

            <div className="relative max-w-4xl mx-auto">
              {/* Carousel */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
                <div className="aspect-video relative bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
                  {/* Content goes here - exercises or videos */}
                  <div className="text-center p-8">
                    <BookOpen size={48} className="mx-auto mb-4 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                      Contenido Interactivo
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Ejercicios y videos seleccionados por nuestros profesores
                    </p>
                  </div>
                </div>

                {/* Controls */}
                {((config.featuredContent.exercises?.length || 0) +
                  (config.featuredContent.videos?.length || 0)) > 1 && (
                  <>
                    <button
                      onClick={prevSlide}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      aria-label="Anterior"
                    >
                      <ChevronLeft size={24} className="text-gray-900 dark:text-white" />
                    </button>
                    <button
                      onClick={nextSlide}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      aria-label="Siguiente"
                    >
                      <ChevronRight size={24} className="text-gray-900 dark:text-white" />
                    </button>

                    {/* Dots indicator */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      {Array.from({
                        length: (config.featuredContent.exercises?.length || 0) +
                               (config.featuredContent.videos?.length || 0)
                      }).map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentSlide(index)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            index === currentSlide
                              ? 'bg-purple-600 dark:bg-purple-400 w-8'
                              : 'bg-gray-300 dark:bg-gray-600'
                          }`}
                          aria-label={`Ir a slide ${index + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Benefits Section */}
      <section className="benefits-section">
        <div className="container">
          <div className="benefits-grid">
            <div className="benefit-item">
              <div className="benefit-content">
                <h3>👨‍🏫 Para Profesores</h3>
                <ul className="benefit-list">
                  <li><CheckCircle size={20} strokeWidth={2} className="inline-icon" /> Crea 8 tipos diferentes de ejercicios</li>
                  <li><CheckCircle size={20} strokeWidth={2} className="inline-icon" /> Gestiona cursos, grupos y asignaciones</li>
                  <li><CheckCircle size={20} strokeWidth={2} className="inline-icon" /> Califica automáticamente con feedback instantáneo</li>
                  <li><CheckCircle size={20} strokeWidth={2} className="inline-icon" /> DesignLab para crear contenido personalizado</li>
                  <li><CheckCircle size={20} strokeWidth={2} className="inline-icon" /> Analytics completo de progreso estudiantil</li>
                </ul>
              </div>
              <div className="benefit-image">
                <div className="teacher-mockup">
                  <div className="mockup-card">
                    <div className="card-header">Dashboard del Profesor</div>
                    <div className="card-stats">
                      <div className="mini-stat"><BookOpen size={16} strokeWidth={2} className="inline-icon" /> Cursos</div>
                      <div className="mini-stat"><Users size={16} strokeWidth={2} className="inline-icon" /> Grupos</div>
                      <div className="mini-stat"><Target size={16} strokeWidth={2} className="inline-icon" /> Analytics</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="benefit-item reverse">
              <div className="benefit-image">
                <div className="student-mockup">
                  <div className="mockup-card">
                    <div className="card-header">Mi Progreso</div>
                    <div className="progress-bars">
                      <div className="progress-item">
                        <span>Nivel 12 - 2,450 pts</span>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{width: '75%'}}></div>
                        </div>
                      </div>
                      <div className="progress-item">
                        <span>Racha: 15 días 🔥</span>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{width: '60%'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="benefit-content">
                <h3>🎓 Para Estudiantes</h3>
                <ul className="benefit-list">
                  <li><CheckCircle size={20} strokeWidth={2} className="inline-icon" /> Aprende con ejercicios interactivos variados</li>
                  <li><CheckCircle size={20} strokeWidth={2} className="inline-icon" /> Sistema de puntos, niveles y badges</li>
                  <li><CheckCircle size={20} strokeWidth={2} className="inline-icon" /> Content Reader con TTS y anotaciones</li>
                  <li><CheckCircle size={20} strokeWidth={2} className="inline-icon" /> Calendario de asignaciones y recordatorios</li>
                  <li><CheckCircle size={20} strokeWidth={2} className="inline-icon" /> VideoChat para clases en vivo</li>
                </ul>
              </div>
            </div>

            <div className="benefit-item">
              <div className="benefit-content">
                <h3>👪 Para Tutores/Padres</h3>
                <ul className="benefit-list">
                  <li><CheckCircle size={20} strokeWidth={2} className="inline-icon" /> Dashboard de seguimiento académico completo</li>
                  <li><CheckCircle size={20} strokeWidth={2} className="inline-icon" /> Ve calificaciones y progreso en tiempo real</li>
                  <li><CheckCircle size={20} strokeWidth={2} className="inline-icon" /> Gestiona pagos de matrícula y cuotas</li>
                  <li><CheckCircle size={20} strokeWidth={2} className="inline-icon" /> Mensajería directa con profesores</li>
                  <li><CheckCircle size={20} strokeWidth={2} className="inline-icon" /> Notificaciones de asignaciones y eventos</li>
                </ul>
              </div>
              <div className="benefit-image">
                <div className="teacher-mockup">
                  <div className="mockup-card">
                    <div className="card-header">Dashboard Tutor</div>
                    <div className="card-stats">
                      <div className="mini-stat"><Users size={16} strokeWidth={2} className="inline-icon" /> Estudiantes</div>
                      <div className="mini-stat"><Award size={16} strokeWidth={2} className="inline-icon" /> Progreso</div>
                      <div className="mini-stat"><CreditCard size={16} strokeWidth={2} className="inline-icon" /> Pagos</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="benefit-item reverse">
              <div className="benefit-image">
                <div className="student-mockup">
                  <div className="mockup-card">
                    <div className="card-header">Panel de Administración</div>
                    <div className="progress-bars">
                      <div className="progress-item">
                        <span>Ingresos del mes</span>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{width: '90%'}}></div>
                        </div>
                      </div>
                      <div className="progress-item">
                        <span>Usuarios activos</span>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{width: '85%'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="benefit-content">
                <h3>👨‍💼 Para Administradores</h3>
                <ul className="benefit-list">
                  <li><CheckCircle size={20} strokeWidth={2} className="inline-icon" /> Panel completo de gestión institucional</li>
                  <li><CheckCircle size={20} strokeWidth={2} className="inline-icon" /> Control de pagos, matrículas y cuotas</li>
                  <li><CheckCircle size={20} strokeWidth={2} className="inline-icon" /> Gestión de becas y descuentos familiares</li>
                  <li><CheckCircle size={20} strokeWidth={2} className="inline-icon" /> Analytics avanzado y reportes exportables</li>
                  <li><CheckCircle size={20} strokeWidth={2} className="inline-icon" /> Administración de usuarios y permisos</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Soluciones para Instituciones Educativas</h2>
            <p className="section-subtitle">
              Sistema flexible de gestión académica y pagos integrados
            </p>
          </div>
          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="pricing-header">
                <h3>Demo</h3>
                <div className="price">
                  <span className="price-amount">Prueba</span>
                  <span className="price-period">Gratuita</span>
                </div>
              </div>
              <ul className="pricing-features">
                <li><Check size={16} strokeWidth={2} className="inline-icon" /> Hasta 20 estudiantes</li>
                <li><Check size={16} strokeWidth={2} className="inline-icon" /> Todas las funcionalidades</li>
                <li><Check size={16} strokeWidth={2} className="inline-icon" /> 30 días de prueba</li>
                <li><Check size={16} strokeWidth={2} className="inline-icon" /> Soporte por email</li>
              </ul>
              <BaseButton variant="outline" fullWidth onClick={onNavigateToRegister}>
                Comenzar Demo
              </BaseButton>
            </div>

            <div className="pricing-card featured">
              <div className="popular-badge">Instituciones</div>
              <div className="pricing-header">
                <h3>Institución</h3>
                <div className="price">
                  <span className="price-amount">Contactar</span>
                  <span className="price-period">para cotización</span>
                </div>
              </div>
              <ul className="pricing-features">
                <li><Check size={16} strokeWidth={2} className="inline-icon" /> Usuarios ilimitados</li>
                <li><Check size={16} strokeWidth={2} className="inline-icon" /> Sistema completo de pagos (MercadoPago)</li>
                <li><Check size={16} strokeWidth={2} className="inline-icon" /> VideoChat y mensajería integrada</li>
                <li><Check size={16} strokeWidth={2} className="inline-icon" /> Dashboard multi-rol (Admin, Profesor, Estudiante, Tutor)</li>
                <li><Check size={16} strokeWidth={2} className="inline-icon" /> Descuentos familiares automáticos</li>
                <li><Check size={16} strokeWidth={2} className="inline-icon" /> Analytics avanzado y reportes</li>
                <li><Check size={16} strokeWidth={2} className="inline-icon" /> Capacitación y soporte dedicado</li>
                <li><Check size={16} strokeWidth={2} className="inline-icon" /> Personalización de marca</li>
              </ul>
              <BaseButton variant="primary" fullWidth onClick={onNavigateToRegister}>
                Solicitar Demo
              </BaseButton>
            </div>

            <div className="pricing-card">
              <div className="pricing-header">
                <h3>Características</h3>
                <div className="price">
                  <span className="price-amount">Todo</span>
                  <span className="price-period">incluido</span>
                </div>
              </div>
              <ul className="pricing-features">
                <li><Check size={16} strokeWidth={2} className="inline-icon" /> 8 tipos de ejercicios</li>
                <li><Check size={16} strokeWidth={2} className="inline-icon" /> Content Reader + TTS</li>
                <li><Check size={16} strokeWidth={2} className="inline-icon" /> DesignLab & Whiteboard</li>
                <li><Check size={16} strokeWidth={2} className="inline-icon" /> Gamificación completa</li>
                <li><Check size={16} strokeWidth={2} className="inline-icon" /> Calendario y asignaciones</li>
                <li><Check size={16} strokeWidth={2} className="inline-icon" /> Modo oscuro & temas</li>
                <li><Check size={16} strokeWidth={2} className="inline-icon" /> PWA (funciona offline)</li>
                <li><Check size={16} strokeWidth={2} className="inline-icon" /> Exportación PDF/Excel</li>
              </ul>
              <BaseButton variant="outline" fullWidth onClick={onNavigateToLogin}>
                Ver Funcionalidades
              </BaseButton>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="faq-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Preguntas Frecuentes</h2>
          </div>
          <div className="faq-container">
            {config.faqs.map((faq, index) => (
              <div
                key={faq.id}
                className={`faq-item ${activeFAQ === index ? 'active' : ''}`}
                onClick={() => toggleFAQ(index)}
              >
                <div className="faq-question">
                  <h4>{faq.question}</h4>
                  <span className="faq-icon">{activeFAQ === index ? '−' : '+'}</span>
                </div>
                {activeFAQ === index && (
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">{config.cta.title}</h2>
            <p className="cta-description">
              {config.cta.subtitle}
            </p>
            <div className="cta-buttons">
              <BaseButton
                variant="white"
                size="lg"
                onClick={onNavigateToRegister}
              >
                {config.cta.primaryButtonText}
              </BaseButton>
              <BaseButton
                variant="outline"
                size="lg"
                onClick={onNavigateToLogin}
              >
                {config.cta.secondaryButtonText}
              </BaseButton>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3 className="flex items-center gap-2">
                <GraduationCap size={24} strokeWidth={2} /> XIWEN
              </h3>
              <p>Educación interactiva del futuro</p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Producto</h4>
                <a href="#features">Características</a>
                <a href="#pricing">Precios</a>
                <a href="#demo">Demo</a>
              </div>
              <div className="footer-column">
                <h4>Soporte</h4>
                <a href="#help">Ayuda</a>
                <a href="#contact">Contacto</a>
                <a href="#faq">FAQ</a>
              </div>
              <div className="footer-column">
                <h4>Legal</h4>
                <a href="#privacy">Privacidad</a>
                <a href="#terms">Términos</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 XIWEN. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
