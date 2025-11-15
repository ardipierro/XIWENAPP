/**
 * @fileoverview CardSystemTab - Pestaña de visualización del sistema de cards
 * @module components/settings/CardSystemTab
 *
 * Vista de desarrollo para visualizar todas las variantes de cards
 * en formato grid y horizontal (fila)
 */

import { useState } from 'react';
import { Users, BookOpen, Calendar, TrendingUp, Sparkles, Eye, Edit2, Trash2 } from 'lucide-react';
import { UniversalCard } from '../cards';
import { BaseButton, BaseBadge } from '../common';

/**
 * CardSystemTab - Componente de visualización de cards
 */
function CardSystemTab() {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Datos de ejemplo para las cards
  const exampleData = {
    user: {
      variant: 'user',
      avatar: 'JP',
      avatarColor: '#3b82f6',
      title: 'Juan Pérez',
      subtitle: 'juan@example.com',
      badges: [
        { variant: 'success', children: 'Student' }
      ],
      stats: [
        { label: 'Cursos', value: 12, icon: BookOpen },
        { label: 'Créditos', value: 450 }
      ],
      actions: [
        <BaseButton key="view" variant="ghost" size="sm" icon={Eye}>
          Ver
        </BaseButton>,
        <BaseButton key="edit" variant="ghost" size="sm" icon={Edit2}>
          Editar
        </BaseButton>
      ]
    },

    userNoImage: {
      variant: 'user',
      // Sin avatar - NO debe mostrar header
      title: 'María García',
      subtitle: 'maria@example.com',
      badges: [
        { variant: 'info', children: 'Teacher' }
      ],
      stats: [
        { label: 'Estudiantes', value: 45, icon: Users }
      ],
      actions: [
        <BaseButton key="view" variant="ghost" size="sm">
          Ver
        </BaseButton>
      ]
    },

    default: {
      variant: 'default',
      icon: Users,
      title: 'Estudiantes',
      description: 'Gestiona tus estudiantes',
      stats: [
        { label: 'Total', value: 150 }
      ],
      badges: [
        { variant: 'primary', children: 'Activo' }
      ]
    },

    defaultNoIcon: {
      variant: 'default',
      // Sin icono - NO debe mostrar header
      title: 'Dashboard',
      description: 'Panel de control principal',
      stats: [
        { label: 'Usuarios', value: 250 }
      ]
    },

    content: {
      variant: 'content',
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop',
      title: 'React desde Cero',
      subtitle: '40 horas • Nivel Intermedio',
      description: 'Aprende React con proyectos reales',
      badges: [
        { variant: 'success', children: 'Activo' },
        { variant: 'info', children: 'Nuevo' }
      ],
      actions: [
        <BaseButton key="view" variant="primary" size="sm" fullWidth>
          Ver Curso
        </BaseButton>
      ]
    },

    contentNoImage: {
      variant: 'content',
      // Sin imagen - NO debe mostrar header
      title: 'JavaScript Avanzado',
      subtitle: '30 horas • Nivel Avanzado',
      description: 'Domina JavaScript moderno',
      badges: [
        { variant: 'warning', children: 'Draft' }
      ],
      actions: [
        <BaseButton key="edit" variant="ghost" size="sm">
          Editar
        </BaseButton>
      ]
    },

    stats: {
      variant: 'stats',
      icon: TrendingUp,
      title: 'Total Estudiantes',
      bigNumber: '1,542',
      trend: 'up',
      trendText: 'vs. mes anterior'
    },

    compact: {
      variant: 'compact',
      icon: Calendar,
      title: 'Clases Hoy',
      badges: [
        { variant: 'success', children: '8 activas' }
      ],
      stats: [
        { label: 'Total', value: 12 }
      ]
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Sistema de Cards
        </h2>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Visualiza todas las variantes de cards en diferentes formatos.
          Esta pestaña es temporal para desarrollo y testing.
        </p>
      </div>

      {/* View Mode Toggle */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          Modo de vista:
        </span>
        <div className="flex gap-2">
          <BaseButton
            variant={viewMode === 'grid' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            Grid (Tarjetas)
          </BaseButton>
          <BaseButton
            variant={viewMode === 'list' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            List (Filas)
          </BaseButton>
        </div>
      </div>

      {/* Sección: Cards CON contenido visual (imagen/icono/avatar) */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Cards CON Header (imagen/icono/avatar)
        </h3>

        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
          : 'flex flex-col gap-4'
        }>
          <UniversalCard
            {...exampleData.user}
            layout={viewMode === 'list' ? 'horizontal' : 'vertical'}
            size="md"
          />
          <UniversalCard
            {...exampleData.default}
            layout={viewMode === 'list' ? 'horizontal' : 'vertical'}
            size="md"
          />
          <UniversalCard
            {...exampleData.content}
            layout={viewMode === 'list' ? 'horizontal' : 'vertical'}
            size="md"
          />
          <UniversalCard
            {...exampleData.stats}
            layout={viewMode === 'list' ? 'horizontal' : 'vertical'}
            size="md"
          />
          <UniversalCard
            {...exampleData.compact}
            layout={viewMode === 'list' ? 'horizontal' : 'vertical'}
            size="md"
          />
        </div>
      </div>

      {/* Sección: Cards SIN contenido visual */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Cards SIN Header (sin imagen/icono/avatar)
        </h3>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Estas cards NO deben mostrar la sección de header vacía con fondo gris.
        </p>

        <div className={viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
          : 'flex flex-col gap-4'
        }>
          <UniversalCard
            {...exampleData.userNoImage}
            layout={viewMode === 'list' ? 'horizontal' : 'vertical'}
            size="md"
          />
          <UniversalCard
            {...exampleData.defaultNoIcon}
            layout={viewMode === 'list' ? 'horizontal' : 'vertical'}
            size="md"
          />
          <UniversalCard
            {...exampleData.contentNoImage}
            layout={viewMode === 'list' ? 'horizontal' : 'vertical'}
            size="md"
          />
        </div>
      </div>

      {/* Sección: Footer Sticky Demo */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Footer Sticky (Grid)
        </h3>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          En formato grid, los badges y actions deben estar siempre a la misma altura (pegados al fondo).
          Observa cómo todas las cards tienen el footer alineado independientemente del contenido.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <UniversalCard
            variant="user"
            avatar="JP"
            avatarColor="#3b82f6"
            title="Card con poco texto"
            subtitle="Subtítulo corto"
            badges={[{ variant: 'success', children: 'Badge' }]}
            actions={[
              <BaseButton key="view" variant="ghost" size="sm">Ver</BaseButton>
            ]}
            size="md"
          />
          <UniversalCard
            variant="user"
            avatar="MG"
            avatarColor="#10b981"
            title="Card con texto mediano"
            subtitle="Este subtítulo es un poco más largo"
            description="Y además tiene descripción que ocupa más espacio en la card"
            badges={[{ variant: 'info', children: 'Badge' }]}
            actions={[
              <BaseButton key="view" variant="ghost" size="sm">Ver</BaseButton>
            ]}
            size="md"
          />
          <UniversalCard
            variant="user"
            avatar="AB"
            avatarColor="#f59e0b"
            title="Card con mucho texto"
            subtitle="Este subtítulo es considerablemente más extenso"
            description="Y la descripción también es muy larga para demostrar cómo el footer sticky mantiene los badges y botones alineados al fondo sin importar cuánto contenido haya arriba. Esto es especialmente útil en grids donde queremos consistencia visual."
            badges={[{ variant: 'warning', children: 'Badge' }]}
            actions={[
              <BaseButton key="view" variant="ghost" size="sm">Ver</BaseButton>
            ]}
            size="md"
          />
        </div>
      </div>

      {/* Sección: Layout Horizontal (Fila) */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
          Layout Horizontal (Fila)
        </h3>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          En formato fila, el contenido se distribuye a lo largo de toda la fila:
          Texto principal (flex-1) → Stats → Badges → Actions
        </p>

        <div className="flex flex-col gap-4">
          <UniversalCard
            {...exampleData.user}
            layout="horizontal"
            size="md"
          />
          <UniversalCard
            {...exampleData.userNoImage}
            layout="horizontal"
            size="md"
          />
          <UniversalCard
            {...exampleData.default}
            layout="horizontal"
            size="md"
          />
        </div>
      </div>

      {/* Info de desarrollo */}
      <div
        className="p-4 rounded-lg"
        style={{
          background: 'var(--color-bg-tertiary)',
          border: '1px solid var(--color-border)'
        }}
      >
        <h4 className="text-sm font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          ℹ️ Notas de Desarrollo
        </h4>
        <ul className="text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
          <li>✅ Gradientes ahora usan CSS variables (no hardcoded)</li>
          <li>✅ Header solo aparece si hay imagen/icono/avatar (no badge solo)</li>
          <li>✅ Footer sticky en grid mantiene badges/actions alineados</li>
          <li>✅ Layout horizontal distribuye contenido a lo largo de la fila</li>
          <li>✅ Sin divs vacíos con fondo gris cuando no hay imagen</li>
        </ul>
      </div>
    </div>
  );
}

export default CardSystemTab;
