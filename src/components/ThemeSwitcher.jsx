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
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex items-center justify-center p-2 bg-transparent border-none rounded-md text-zinc-900 dark:text-zinc-100 cursor-pointer transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Cambiar tema"
        title={`Tema actual: ${currentThemeInfo.name}`}
      >
        <Palette size={20} strokeWidth={2} />
      </button>

      {isOpen && (
        <div className="dropdown">
          <div className="dropdown-options">
            {Object.values(THEMES).map((theme) => {
              const info = THEME_INFO[theme];
              const isSelected = currentTheme === theme;

              return (
                <button
                  key={theme}
                  className={`dropdown-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleThemeSelect(theme)}
                >
                  <div className="dropdown-option-content">
                    <div className="dropdown-option-title">{info.name}</div>
                    <div className="dropdown-option-description">{info.description}</div>
                  </div>
                  {isSelected && (
                    <Check size={18} strokeWidth={2} className="dropdown-check" />
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
