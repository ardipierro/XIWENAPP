import { spacing, typography } from '../../config/designTokens';

/**
 * SectionHeader Component
 *
 * Encabezado estandarizado para secciones/páginas.
 * Garantiza consistencia visual en todos los dashboards.
 *
 * @param {string} title - Título principal (required)
 * @param {string} subtitle - Subtítulo descriptivo
 * @param {React.ReactNode} actions - Botones de acción (ej: Crear, Filtrar)
 * @param {string} className - Clases adicionales
 *
 * @example
 * <SectionHeader
 *   title="Gestión de Cursos"
 *   subtitle="156 cursos disponibles"
 *   actions={
 *     <BaseButton variant="primary" icon={Plus}>
 *       Crear Curso
 *     </BaseButton>
 *   }
 * />
 */
export function SectionHeader({
  title,
  subtitle = null,
  actions = null,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col md:flex-row md:items-center md:justify-between gap-4 ${spacing.headerMarginBottom} ${className}`}
    >
      {/* Title and subtitle */}
      <div className="flex-1">
        <h1
          className={typography.h1}
          style={{ color: 'var(--color-text-primary)' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {/* Actions */}
      {actions && (
        <div className="flex flex-wrap gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}

/**
 * SubsectionHeader Component
 *
 * Encabezado para subsecciones dentro de una página.
 * Más pequeño que SectionHeader.
 *
 * @example
 * <SubsectionHeader
 *   title="Cursos Activos"
 *   subtitle="24 cursos"
 * />
 */
export function SubsectionHeader({
  title,
  subtitle = null,
  actions = null,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 ${className}`}
    >
      <div>
        <h2
          className={typography.h3}
          style={{ color: 'var(--color-text-primary)' }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className="text-xs mt-0.5"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {subtitle}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

export default SectionHeader;
