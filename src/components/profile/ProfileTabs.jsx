/**
 * @fileoverview Sistema de pestañas para el perfil de usuario
 * @module components/profile/ProfileTabs
 *
 * Mobile First:
 * - Tabs horizontales con scroll en móvil
 * - Touch targets mínimo 48px
 * - Dark mode completo
 */

import { useState } from 'react';

/**
 * ProfileTabs - Sistema de pestañas contextual por rol
 *
 * @param {Array} tabs - Array de tabs { id, label, icon, component }
 * @param {string} defaultTab - ID de la pestaña por defecto
 * @param {Function} onTabChange - Callback al cambiar de pestaña
 */
function ProfileTabs({ tabs, defaultTab, onTabChange }) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (onTabChange) {
      onTabChange(tabId);
    }
  };

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="flex flex-col h-full">
      {/* Tabs Header - Scrollable en móvil */}
      <div className="flex-shrink-0 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto scrollbar-hide">
        <div className="flex min-w-max">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 min-h-[48px]
                  font-medium text-sm transition-all duration-200
                  border-b-2 flex-shrink-0
                `}
                style={isActive ? {
                  borderBottomColor: 'var(--color-text-primary)',
                  color: 'var(--color-text-primary)',
                } : {
                  borderBottomColor: 'transparent',
                  color: 'var(--color-text-secondary)',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--color-text-primary)';
                    e.currentTarget.style.borderBottomColor = 'var(--color-border-focus)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                    e.currentTarget.style.borderBottomColor = 'transparent';
                  }
                }}
                aria-selected={isActive}
                role="tab"
              >
                {Icon && <Icon size={18} strokeWidth={2} />}
                <span className="whitespace-nowrap">{tab.label}</span>
                {tab.badge && (
                  <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-500 text-white">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTabData?.component}
      </div>
    </div>
  );
}

export default ProfileTabs;
