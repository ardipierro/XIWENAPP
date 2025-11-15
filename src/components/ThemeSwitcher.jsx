import { useState, useRef, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';
import { useTheme, THEMES, THEME_INFO } from '../contexts/ThemeContext';

function ThemeSwitcher() {
  const { currentTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleThemeSelect = (theme) => {
    setTheme(theme);
    setIsOpen(false);
  };

  const currentThemeInfo = THEME_INFO[currentTheme];

  return (
    <div className="theme-switcher" ref={dropdownRef}>
      <button
        className="theme-switcher-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Cambiar tema"
        title={`Tema actual: ${currentThemeInfo.name}`}
      >
        <Palette size={20} strokeWidth={2} />
      </button>

      {isOpen && (
        <div className="dropdown theme-switcher-dropdown">
          <div className="dropdown-options theme-switcher-options">
            {Object.values(THEMES).map((theme) => {
              const info = THEME_INFO[theme];
              const isSelected = currentTheme === theme;

              return (
                <button
                  key={theme}
                  className={`dropdown-option theme-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleThemeSelect(theme)}
                >
                  <div className="dropdown-option-content theme-option-info">
                    <div className="dropdown-option-title theme-option-name">{info.name}</div>
                    <div className="dropdown-option-description theme-option-description">{info.description}</div>
                  </div>
                  {isSelected && (
                    <Check size={18} strokeWidth={2} className="dropdown-check theme-option-check" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ThemeSwitcher;
