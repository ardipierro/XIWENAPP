/**
 * @fileoverview Error Boundary para capturar errores de React
 * @module components/common/ErrorBoundary
 */

import React from 'react';
import logger from '../../utils/logger.js';

/**
 * Error Boundary Component
 * Captura errores en el árbol de componentes de React
 * y muestra una UI de fallback en vez de crashear la app
 *
 * @see https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
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
   * Lifecycle: getDerivedStateFromError
   * Actualiza el estado cuando hay un error
   * @param {Error} error - El error capturado
   * @returns {Object} Nuevo estado
   */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  /**
   * Lifecycle: componentDidCatch
   * Se llama cuando se captura un error
   * @param {Error} error - El error capturado
   * @param {Object} errorInfo - Información adicional sobre el error
   */
  componentDidCatch(error, errorInfo) {
    // Log del error
    logger.error('Error capturado por ErrorBoundary', error, 'ErrorBoundary');
    logger.error('Component stack:', errorInfo?.componentStack, 'ErrorBoundary');

    // Actualizar estado con información del error
    this.setState({
      error,
      errorInfo
    });

    // TODO: Enviar a servicio de logging externo (Sentry, etc.)
    // if (import.meta.env.PROD) {
    //   sendErrorToMonitoringService(error, errorInfo);
    // }
  }

  /**
   * Maneja el clic en "Intentar de nuevo"
   */
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  /**
   * Maneja el clic en "Recargar página"
   */
  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // UI de fallback cuando hay error
      const { error, errorInfo } = this.state;
      const { fallback } = this.props;

      // Si se provee un fallback personalizado, usarlo
      if (fallback) {
        return fallback(error, this.handleReset, this.handleReload);
      }

      // Fallback por defecto
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backgroundColor: '#f9fafb',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          <div
            style={{
              maxWidth: '600px',
              backgroundColor: 'white',
              borderRadius: '12px',
              padding: '40px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              textAlign: 'center'
            }}
          >
            {/* Icon */}
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>
              ⚠️
            </div>

            {/* Título */}
            <h1
              style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#1f2937',
                margin: '0 0 12px 0'
              }}
            >
              Algo salió mal
            </h1>

            {/* Descripción */}
            <p
              style={{
                fontSize: '16px',
                color: '#6b7280',
                margin: '0 0 24px 0',
                lineHeight: '1.5'
              }}
            >
              Lo sentimos, ocurrió un error inesperado. Puedes intentar recargar la página o contactar a soporte si el problema persiste.
            </p>

            {/* Detalles del error (solo en desarrollo) */}
            {!import.meta.env.PROD && error && (
              <details
                style={{
                  marginBottom: '24px',
                  textAlign: 'left',
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  padding: '16px'
                }}
              >
                <summary
                  style={{
                    cursor: 'pointer',
                    fontWeight: '600',
                    color: '#dc2626',
                    marginBottom: '12px'
                  }}
                >
                  Detalles del error (solo en desarrollo)
                </summary>
                <pre
                  style={{
                    fontSize: '12px',
                    overflow: 'auto',
                    backgroundColor: '#fff',
                    padding: '12px',
                    borderRadius: '4px',
                    margin: '0',
                    color: '#1f2937',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  {error.toString()}
                  {'\n\n'}
                  {error.stack}
                  {errorInfo?.componentStack && (
                    <>
                      {'\n\nComponent Stack:'}
                      {errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}

            {/* Botones */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}
            >
              <button
                onClick={this.handleReset}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#4a5a7a',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#3d4a63';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#4a5a7a';
                }}
              >
                Intentar de nuevo
              </button>

              <button
                onClick={this.handleReload}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'white',
                  color: '#4a5a7a',
                  border: '2px solid #4a5a7a',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'white';
                }}
              >
                Recargar página
              </button>
            </div>
          </div>

          {/* Información de contacto */}
          <p
            style={{
              marginTop: '24px',
              fontSize: '14px',
              color: '#9ca3af'
            }}
          >
            Si el problema persiste, contacta a soporte
          </p>
        </div>
      );
    }

    // Renderizar children normalmente si no hay error
    return this.props.children;
  }
}

export default ErrorBoundary;
