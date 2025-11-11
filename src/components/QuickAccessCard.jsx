import { ArrowRight, Plus } from 'lucide-react';

/**
 * Tarjeta de acceso rápido para el dashboard
 * Diseño consistente con las tarjetas de los managers
 */
function QuickAccessCard({ icon: Icon, title, description, count, countLabel, onClick, createLabel, onCreateClick }) {
  const handleBadgeClick = (e) => {
    e.stopPropagation(); // Evitar que se dispare el onClick de la tarjeta
    if (onCreateClick) {
      onCreateClick();
    }
  };

  return (
    <div
      className="group relative flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-[0_1px_3px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_24px_rgba(0,0,0,0.15)] hover:-translate-y-1 hover:border-gray-300 dark:hover:border-zinc-700 h-full cursor-pointer animate-fade-in"
      onClick={onClick}
    >
      {/* Icon Header - Similar a card-image-placeholder */}
      <div className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-zinc-800 dark:to-zinc-900 flex items-center justify-center text-gray-500 dark:text-zinc-500 flex-shrink-0">
        <Icon size={48} strokeWidth={2} />
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-2">{title}</h3>

        {description && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-0">{description}</p>
        )}

        {/* Stats */}
        {count !== undefined && (
          <div className="flex items-baseline gap-2 my-4 py-3 border-t border-b border-gray-200 dark:border-zinc-800">
            <span className="text-[28px] font-extrabold text-zinc-900 dark:text-zinc-50 leading-none">{count}</span>
            <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">{countLabel}</span>
          </div>
        )}

        {/* Action Badge */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-md text-[13px] font-semibold mt-auto w-fit"
          onClick={handleBadgeClick}
          style={{ cursor: onCreateClick ? 'pointer' : 'default' }}
        >
          <Plus size={16} strokeWidth={2} />
          <span>{createLabel}</span>
        </div>

        {/* Arrow indicator */}
        <div className="absolute bottom-5 right-5 text-gray-400 dark:text-gray-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
          <ArrowRight size={20} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}

export default QuickAccessCard;
