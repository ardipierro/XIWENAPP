import React, { useState } from 'react';
import {
  GraduationCap, Gamepad2, Zap, BarChart3, Globe, Palette, Users,
  CheckCircle, Check, BookOpen, Target, Video, MessageSquare, Calendar,
  Moon, Layout, CreditCard, Award, BookText, Mic
} from 'lucide-react';
import BaseButton from './components/common/BaseButton';
import './LandingPage.css';

function LandingPage({ onNavigateToLogin, onNavigateToRegister }) {
  const [activeFAQ, setActiveFAQ] = useState(null);

  const toggleFAQ = (index) => {
    setActiveFAQ(activeFAQ === index ? null : index);
  };

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
                Plataforma Educativa
                <span className="gradient-text"> Todo en Uno</span>
              </h1>
              <p className="hero-description">
                La solución completa para instituciones educativas modernas.
                Gestión académica, pagos, comunicación, ejercicios interactivos y más,
                todo en una sola plataforma.
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
                <div className="stat">
                  <div className="stat-number">8+</div>
                  <div className="stat-label">Tipos de Ejercicios</div>
                </div>
                <div className="stat">
                  <div className="stat-number">4</div>
                  <div className="stat-label">Roles de Usuario</div>
                </div>
                <div className="stat">
                  <div className="stat-number">100%</div>
                  <div className="stat-label">Online & PWA</div>
                </div>
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
            <div className="feature-card">
              <div className="feature-icon">
                <BookText size={40} strokeWidth={2} />
              </div>
              <h3>8 Tipos de Ejercicios</h3>
              <p>
                Opción múltiple, verdadero/falso, completar, matching, y más.
                Content Reader interactivo con anotaciones y TTS.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Video size={40} strokeWidth={2} />
              </div>
              <h3>VideoChat Integrado</h3>
              <p>
                Clases en vivo con LiveKit. Sala de espera virtual,
                compartir pantalla y comunicación en tiempo real.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <CreditCard size={40} strokeWidth={2} />
              </div>
              <h3>Sistema de Pagos</h3>
              <p>
                MercadoPago integrado. Gestión de matrículas, cuotas mensuales,
                becas y descuentos familiares automáticos.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Gamepad2 size={40} strokeWidth={2} />
              </div>
              <h3>Gamificación</h3>
              <p>
                Sistema de puntos, niveles, badges y racha de días consecutivos.
                Leaderboard para motivar a estudiantes.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <MessageSquare size={40} strokeWidth={2} />
              </div>
              <h3>Mensajería Interna</h3>
              <p>
                Comunicación directa entre profesores, estudiantes y tutores.
                Notificaciones en tiempo real y sistema de alertas.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Calendar size={40} strokeWidth={2} />
              </div>
              <h3>Calendario Integrado</h3>
              <p>
                Vista completa de asignaciones, fechas de entrega y eventos.
                Recordatorios automáticos y sincronización.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Moon size={40} strokeWidth={2} />
              </div>
              <h3>Modo Oscuro & Temas</h3>
              <p>
                Interfaz adaptable con modo oscuro completo. Múltiples temas:
                Ocean, Forest, Sunset y Midnight.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <Layout size={40} strokeWidth={2} />
              </div>
              <h3>DesignLab & Whiteboard</h3>
              <p>
                Espacio colaborativo para crear ejercicios personalizados.
                Herramientas de diseño integradas para profesores.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <BarChart3 size={40} strokeWidth={2} />
              </div>
              <h3>Analytics Avanzado</h3>
              <p>
                Dashboard completo con métricas de progreso, rendimiento
                individual y reportes exportables a PDF/Excel.
              </p>
            </div>
          </div>
        </div>
      </section>

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
            <div
              className={`faq-item ${activeFAQ === 0 ? 'active' : ''}`}
              onClick={() => toggleFAQ(0)}
            >
              <div className="faq-question">
                <h4>¿Qué tipos de ejercicios puedo crear en la plataforma?</h4>
                <span className="faq-icon">{activeFAQ === 0 ? '−' : '+'}</span>
              </div>
              {activeFAQ === 0 && (
                <div className="faq-answer">
                  <p>
                    XIWEN soporta 8 tipos diferentes de ejercicios: opción múltiple,
                    verdadero/falso, completar espacios, matching, drag & drop, identificación de verbos,
                    lectura interactiva y pronunciación con IA. Además, incluye un Content Reader
                    con funciones de TTS (text-to-speech) y anotaciones.
                  </p>
                </div>
              )}
            </div>

            <div
              className={`faq-item ${activeFAQ === 1 ? 'active' : ''}`}
              onClick={() => toggleFAQ(1)}
            >
              <div className="faq-question">
                <h4>¿Cómo funciona el sistema de pagos integrado?</h4>
                <span className="faq-icon">{activeFAQ === 1 ? '−' : '+'}</span>
              </div>
              {activeFAQ === 1 && (
                <div className="faq-answer">
                  <p>
                    La plataforma integra MercadoPago (Argentina) para gestionar matrículas y
                    cuotas mensuales automáticamente. Incluye sistema de becas, descuentos
                    familiares (20% segundo hermano, 30% tercero en adelante), y un dashboard
                    completo para administradores. Los tutores pueden ver y gestionar pagos desde
                    su panel.
                  </p>
                </div>
              )}
            </div>

            <div
              className={`faq-item ${activeFAQ === 2 ? 'active' : ''}`}
              onClick={() => toggleFAQ(2)}
            >
              <div className="faq-question">
                <h4>¿Funciona en dispositivos móviles?</h4>
                <span className="faq-icon">{activeFAQ === 2 ? '−' : '+'}</span>
              </div>
              {activeFAQ === 2 && (
                <div className="faq-answer">
                  <p>
                    Sí, XIWEN es una Progressive Web App (PWA) completamente responsiva.
                    Funciona perfectamente en celulares, tablets y computadoras. Incluso puede
                    instalarse como aplicación nativa y funcionar offline. La interfaz se adapta
                    automáticamente a cualquier tamaño de pantalla.
                  </p>
                </div>
              )}
            </div>

            <div
              className={`faq-item ${activeFAQ === 3 ? 'active' : ''}`}
              onClick={() => toggleFAQ(3)}
            >
              <div className="faq-question">
                <h4>¿Qué roles de usuario están disponibles?</h4>
                <span className="faq-icon">{activeFAQ === 3 ? '−' : '+'}</span>
              </div>
              {activeFAQ === 3 && (
                <div className="faq-answer">
                  <p>
                    La plataforma soporta 4 roles: <strong>Administrador</strong> (gestión completa
                    y control de pagos), <strong>Profesor</strong> (creación de cursos, ejercicios
                    y calificaciones), <strong>Estudiante</strong> (acceso a contenido y actividades),
                    y <strong>Tutor/Padre</strong> (seguimiento académico y gestión de pagos).
                    Cada rol tiene su propio dashboard personalizado.
                  </p>
                </div>
              )}
            </div>

            <div
              className={`faq-item ${activeFAQ === 4 ? 'active' : ''}`}
              onClick={() => toggleFAQ(4)}
            >
              <div className="faq-question">
                <h4>¿Incluye videoconferencia para clases en vivo?</h4>
                <span className="faq-icon">{activeFAQ === 4 ? '−' : '+'}</span>
              </div>
              {activeFAQ === 4 && (
                <div className="faq-answer">
                  <p>
                    Sí, la plataforma integra LiveKit para videochat en tiempo real. Incluye
                    sala de espera virtual, compartir pantalla, audio y video de alta calidad.
                    Además, hay un sistema de mensajería interna para comunicación asíncrona
                    entre profesores, estudiantes y tutores.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">¿Listo para Transformar tu Institución?</h2>
            <p className="cta-description">
              Plataforma todo-en-uno para gestión académica, pagos, comunicación y más.
              Comienza tu prueba gratuita de 30 días.
            </p>
            <div className="cta-buttons">
              <BaseButton
                variant="white"
                size="lg"
                onClick={onNavigateToRegister}
              >
                Solicitar Demo
              </BaseButton>
              <BaseButton
                variant="outline"
                size="lg"
                onClick={onNavigateToLogin}
              >
                Iniciar Sesión
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
