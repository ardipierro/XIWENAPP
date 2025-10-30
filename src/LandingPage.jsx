import React, { useState } from 'react';
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
            <span className="nav-logo">🎓</span>
            <h1>Quiz Xiwen</h1>
          </div>
          <div className="nav-links">
            <a href="#features">Características</a>
            <a href="#pricing">Precios</a>
            <a href="#faq">FAQ</a>
            <button className="btn btn-outline" onClick={onNavigateToLogin}>
              Iniciar Sesión
            </button>
            <button className="btn btn-primary" onClick={onNavigateToRegister}>
              Registrarse
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Transforma tus Clases con
                <span className="gradient-text"> Quiz Interactivos</span>
              </h1>
              <p className="hero-description">
                La plataforma educativa que convierte el aprendizaje en una experiencia 
                divertida e interactiva. Ideal para profesores de idiomas y estudiantes 
                que quieren aprender jugando.
              </p>
              <div className="hero-buttons">
                <button 
                  className="btn btn-primary btn-large"
                  onClick={onNavigateToRegister}
                >
                  Comenzar Gratis
                </button>
                <button 
                  className="btn btn-outline btn-large"
                  onClick={onNavigateToLogin}
                >
                  Ver Demo
                </button>
              </div>
              <div className="hero-stats">
                <div className="stat">
                  <div className="stat-number">500+</div>
                  <div className="stat-label">Profesores</div>
                </div>
                <div className="stat">
                  <div className="stat-number">10K+</div>
                  <div className="stat-label">Estudiantes</div>
                </div>
                <div className="stat">
                  <div className="stat-number">50K+</div>
                  <div className="stat-label">Quiz Creados</div>
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
            <h2 className="section-title">¿Por qué elegir Quiz Xiwen?</h2>
            <p className="section-subtitle">
              Todo lo que necesitas para crear experiencias de aprendizaje inolvidables
            </p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🎮</div>
              <h3>Gamificación Total</h3>
              <p>
                Convierte cualquier lección en un juego interactivo. 
                Puntajes en tiempo real, rankings y premios virtuales.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Resultados Instantáneos</h3>
              <p>
                Feedback inmediato para estudiantes y análisis en tiempo real 
                para profesores. Sin esperas, sin complicaciones.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Análisis Avanzado</h3>
              <p>
                Métricas detalladas de rendimiento, progreso individual y 
                reportes automáticos para padres.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌐</div>
              <h3>100% Online</h3>
              <p>
                Accesible desde cualquier dispositivo. Clases presenciales, 
                híbridas o completamente remotas.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3>Personalizable</h3>
              <p>
                Crea quizzes adaptados a tu metodología. Imágenes, audio, 
                videos y más formatos de preguntas.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Colaborativo</h3>
              <p>
                Equipos de trabajo, competencias entre grupos y 
                aprendizaje social integrado.
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
                <h3>Para Profesores</h3>
                <ul className="benefit-list">
                  <li>✅ Crea quizzes en minutos, no en horas</li>
                  <li>✅ Gestiona múltiples clases desde un solo lugar</li>
                  <li>✅ Evalúa automáticamente y ahorra tiempo</li>
                  <li>✅ Exporta reportes para padres y directivos</li>
                  <li>✅ Biblioteca de preguntas reutilizables</li>
                </ul>
              </div>
              <div className="benefit-image">
                <div className="teacher-mockup">
                  <div className="mockup-card">
                    <div className="card-header">Dashboard del Profesor</div>
                    <div className="card-stats">
                      <div className="mini-stat">📚 5 Cursos</div>
                      <div className="mini-stat">👥 120 Alumnos</div>
                      <div className="mini-stat">🎯 95% Participación</div>
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
                        <span>Español</span>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{width: '85%'}}></div>
                        </div>
                      </div>
                      <div className="progress-item">
                        <span>Matemáticas</span>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{width: '72%'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="benefit-content">
                <h3>Para Estudiantes</h3>
                <ul className="benefit-list">
                  <li>✅ Aprende jugando y divirtiéndote</li>
                  <li>✅ Ve tu progreso en tiempo real</li>
                  <li>✅ Compite sanamente con compañeros</li>
                  <li>✅ Recibe feedback instantáneo</li>
                  <li>✅ Accede desde móvil o computadora</li>
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
            <h2 className="section-title">Precios Simples y Transparentes</h2>
            <p className="section-subtitle">
              Elige el plan que mejor se adapte a tus necesidades
            </p>
          </div>
          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="pricing-header">
                <h3>Gratis</h3>
                <div className="price">
                  <span className="price-amount">$0</span>
                  <span className="price-period">/mes</span>
                </div>
              </div>
              <ul className="pricing-features">
                <li>✓ Hasta 30 estudiantes</li>
                <li>✓ 10 quizzes por mes</li>
                <li>✓ Reportes básicos</li>
                <li>✓ Soporte por email</li>
              </ul>
              <button className="btn btn-outline btn-block" onClick={onNavigateToRegister}>
                Comenzar Gratis
              </button>
            </div>

            <div className="pricing-card featured">
              <div className="popular-badge">Más Popular</div>
              <div className="pricing-header">
                <h3>Profesional</h3>
                <div className="price">
                  <span className="price-amount">$29</span>
                  <span className="price-period">/mes</span>
                </div>
              </div>
              <ul className="pricing-features">
                <li>✓ Estudiantes ilimitados</li>
                <li>✓ Quizzes ilimitados</li>
                <li>✓ Análisis avanzado</li>
                <li>✓ Soporte prioritario</li>
                <li>✓ Exportar a Excel/PDF</li>
                <li>✓ Personalización completa</li>
              </ul>
              <button className="btn btn-primary btn-block" onClick={onNavigateToRegister}>
                Probar 14 días gratis
              </button>
            </div>

            <div className="pricing-card">
              <div className="pricing-header">
                <h3>Institución</h3>
                <div className="price">
                  <span className="price-amount">$99</span>
                  <span className="price-period">/mes</span>
                </div>
              </div>
              <ul className="pricing-features">
                <li>✓ Todo de Profesional</li>
                <li>✓ Múltiples profesores</li>
                <li>✓ API access</li>
                <li>✓ SSO/SAML</li>
                <li>✓ Capacitación incluida</li>
                <li>✓ Account manager dedicado</li>
              </ul>
              <button className="btn btn-outline btn-block" onClick={onNavigateToRegister}>
                Contactar Ventas
              </button>
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
                <h4>¿Necesito conocimientos técnicos para usar la plataforma?</h4>
                <span className="faq-icon">{activeFAQ === 0 ? '−' : '+'}</span>
              </div>
              {activeFAQ === 0 && (
                <div className="faq-answer">
                  <p>
                    ¡Para nada! Quiz Xiwen está diseñado para ser intuitivo. Si sabes 
                    usar WhatsApp o Instagram, puedes crear quizzes en minutos. 
                    Además, tenemos tutoriales y soporte para ayudarte.
                  </p>
                </div>
              )}
            </div>

            <div 
              className={`faq-item ${activeFAQ === 1 ? 'active' : ''}`}
              onClick={() => toggleFAQ(1)}
            >
              <div className="faq-question">
                <h4>¿Funciona en dispositivos móviles?</h4>
                <span className="faq-icon">{activeFAQ === 1 ? '−' : '+'}</span>
              </div>
              {activeFAQ === 1 && (
                <div className="faq-answer">
                  <p>
                    Sí, perfectamente. Los estudiantes pueden participar desde celulares, 
                    tablets o computadoras. La interfaz se adapta automáticamente a 
                    cualquier tamaño de pantalla.
                  </p>
                </div>
              )}
            </div>

            <div 
              className={`faq-item ${activeFAQ === 2 ? 'active' : ''}`}
              onClick={() => toggleFAQ(2)}
            >
              <div className="faq-question">
                <h4>¿Puedo usar mis propias preguntas y contenido?</h4>
                <span className="faq-icon">{activeFAQ === 2 ? '−' : '+'}</span>
              </div>
              {activeFAQ === 2 && (
                <div className="faq-answer">
                  <p>
                    Por supuesto. Tienes control total sobre el contenido. Puedes crear 
                    preguntas desde cero, importarlas desde Google Sheets, o usar nuestra 
                    biblioteca de preguntas como punto de partida.
                  </p>
                </div>
              )}
            </div>

            <div 
              className={`faq-item ${activeFAQ === 3 ? 'active' : ''}`}
              onClick={() => toggleFAQ(3)}
            >
              <div className="faq-question">
                <h4>¿Qué pasa si necesito cancelar mi suscripción?</h4>
                <span className="faq-icon">{activeFAQ === 3 ? '−' : '+'}</span>
              </div>
              {activeFAQ === 3 && (
                <div className="faq-answer">
                  <p>
                    Puedes cancelar en cualquier momento sin penalización. Tu cuenta 
                    permanece activa hasta el final del período pagado. Todos tus datos 
                    se conservan por 90 días por si decides volver.
                  </p>
                </div>
              )}
            </div>

            <div 
              className={`faq-item ${activeFAQ === 4 ? 'active' : ''}`}
              onClick={() => toggleFAQ(4)}
            >
              <div className="faq-question">
                <h4>¿Ofrecen capacitación o soporte?</h4>
                <span className="faq-icon">{activeFAQ === 4 ? '−' : '+'}</span>
              </div>
              {activeFAQ === 4 && (
                <div className="faq-answer">
                  <p>
                    Sí. Todos los planes incluyen acceso a nuestra base de conocimientos, 
                    tutoriales en video y soporte por email. Los planes Profesional e 
                    Institución tienen soporte prioritario y capacitación personalizada.
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
            <h2 className="cta-title">¿Listo para Comenzar?</h2>
            <p className="cta-description">
              Únete a cientos de profesores y alumnos que ya están 
              transformando la educación
            </p>
            <div className="cta-buttons">
              <button 
                className="btn btn-white btn-large"
                onClick={onNavigateToRegister}
              >
                Crear Cuenta Gratis
              </button>
              <button 
                className="btn btn-outline btn-large"
                onClick={onNavigateToLogin}
              >
                Ya Tengo Cuenta
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <h3>🎓 Quiz Xiwen</h3>
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
            <p>&copy; 2025 Quiz Xiwen. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
