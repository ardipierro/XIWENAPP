/**
 * @fileoverview Error Boundary para capturar errores de React
 * @module components/ErrorBoundary
 */

import React from 'react';
import logger from '../utils/logger.js';

/**
 * Error Boundary Component
 * Captura errores en el árbol de componentes hijo y muestra UI de fallback
 *
 * @example
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  /**
   * Actualiza el estado cuando ocurre un error
   */
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  /**
   * Log del error y envío a servicio de telemetría
   */
  componentDidCatch(error, errorInfo) {
    // Log del error
    logger.error(
      'Error capturado por Error Boundary',
      error,
      this.props.context || 'ErrorBoundary'
    );

    // Guardar información del error en el estado
    this.setState({
      error,
      errorInfo
    });

    // TODO: Enviar a servicio de telemetría (Sentry, LogRocket, etc.)
    // if (import.meta.env.PROD) {
    //   Sentry.captureException(error, { contexts: { react: errorInfo } });
    // }
  }

  /**
   * Resetear el error boundary
   */
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    // Si hay callback de reset, ejecutarlo
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // UI de fallback personalizada si se proporciona
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          resetError: this.handleReset
        });
      }

      // UI de fallback por defecto
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            <h1>Algo salió mal</h1>
            <p>
              Lo sentimos, ocurrió un error inesperado. Por favor, intenta nuevamente.
            </p>

            {!import.meta.env.PROD && this.state.error && (
              <details className="error-details">
                <summary>Detalles del error (solo desarrollo)</summary>
                <pre>
                  <strong>Error:</strong> {this.state.error.toString()}
                  {'\n\n'}
                  <strong>Component Stack:</strong>
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="error-actions">
              <button
                className="btn btn-primary"
                onClick={this.handleReset}
              >
                Reintentar
              </button>
              <button
                className="btn btn-outline"
                onClick={() => window.location.href = '/'}
              >
                Volver al Inicio
              </button>
            </div>
          </div>

          <style>{`
            .error-boundary-container {
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
              background: var(--color-bg-primary, #f5f5f5);
            }

            .error-boundary-content {
              max-width: 600px;
              width: 100%;
              text-align: center;
              background: var(--color-bg-secondary, white);
              padding: 40px;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }

            .error-icon {
              font-size: 64px;
              margin-bottom: 20px;
              animation: pulse 2s ease-in-out infinite;
            }

            @keyframes pulse {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.1); }
            }

            .error-boundary-content h1 {
              color: var(--color-text-primary, #1a1a1a);
              margin-bottom: 12px;
              font-size: 28px;
            }

            .error-boundary-content p {
              color: var(--color-text-secondary, #666);
              margin-bottom: 24px;
              font-size: 16px;
              line-height: 1.6;
            }

            .error-details {
              text-align: left;
              margin: 20px 0;
              padding: 16px;
              background: var(--color-bg-primary, #f5f5f5);
              border-radius: 8px;
              border: 1px solid var(--color-border, #e0e0e0);
            }

            .error-details summary {
              cursor: pointer;
              font-weight: 600;
              color: var(--color-text-primary, #1a1a1a);
              margin-bottom: 12px;
              user-select: none;
            }

            .error-details summary:hover {
              color: var(--color-primary, #6366f1);
            }

            .error-details pre {
              white-space: pre-wrap;
              word-wrap: break-word;
              font-size: 12px;
              color: var(--color-text-secondary, #666);
              font-family: 'Courier New', monospace;
              line-height: 1.5;
            }

            .error-actions {
              display: flex;
              gap: 12px;
              justify-content: center;
              margin-top: 24px;
            }

            .btn {
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 16px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s;
              border: none;
            }

            .btn-primary {
              background: var(--color-primary, #6366f1);
              color: white;
            }

            .btn-primary:hover {
              background: var(--color-primary-dark, #4f46e5);
              transform: translateY(-1px);
            }

            .btn-outline {
              background: transparent;
              color: var(--color-text-primary, #1a1a1a);
              border: 2px solid var(--color-border, #e0e0e0);
            }

            .btn-outline:hover {
              border-color: var(--color-primary, #6366f1);
              color: var(--color-primary, #6366f1);
            }

            /* Dark mode support */
            @media (prefers-color-scheme: dark) {
              .error-boundary-container {
                background: var(--color-bg-primary, #1a1a1a);
              }

              .error-boundary-content {
                background: var(--color-bg-secondary, #2a2a2a);
              }

              .error-boundary-content h1 {
                color: var(--color-text-primary, #ffffff);
              }

              .error-boundary-content p {
                color: var(--color-text-secondary, #b0b0b0);
              }

              .error-details {
                background: var(--color-bg-primary, #1a1a1a);
                border-color: var(--color-border, #404040);
              }

              .btn-outline {
                color: var(--color-text-primary, #ffffff);
                border-color: var(--color-border, #404040);
              }
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
