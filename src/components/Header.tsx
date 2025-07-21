import React from 'react';
import { Sun, Moon, GitCompareArrows as FileCompare } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/useTheme';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? theme === 'dark'
          ? 'bg-primary-500 text-white'
          : 'bg-accent-400 text-white'
        : theme === 'dark'
        ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
        : 'text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900'
    }`;

  return (
    <header className={`
      py-4 px-6 shadow-md transition-colors duration-200 fixed top-0 left-0 right-0 w-full z-50
      ${theme === 'dark' ? 'bg-gray-800' : 'bg-neutral-100'}
    `}>
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <FileCompare className={`h-8 w-8 ${theme === 'dark' ? 'text-primary-500' : 'text-cinnabar'}`} />
            <div className="flex flex-col">
              <div className="flex items-center">
                <span className={`text-2xl font-bold ${theme === 'dark' ? 'text-primary-400' : 'text-accent-500'}`}>diff</span>
                <span className={`text-2xl font-bold mx-0.5 ${theme === 'dark' ? 'text-ultra-400' : 'text-sienna-400'}`}>:</span>
                <span className={`text-2xl font-bold ${theme === 'dark' ? 'text-violet-300' : 'text-violet-400'}`}>ract</span>
              </div>
              <span className={`text-xs -mt-1 ${theme === 'dark' ? 'text-neutral-500' : 'text-neutral-500'}`}>by Jezz.WTF</span>
            </div>
          </div>
          <nav className="flex items-center gap-4">
            <NavLink to="/" className={getLinkClass}>
              Home
            </NavLink>
            <NavLink to="/diff-viewer" className={getLinkClass}>
              File Parser
            </NavLink>
          </nav>
        </div>
        
        <button
          onClick={toggleTheme}
          className={`
            p-2 rounded-full transition-colors duration-200 hover:bg-opacity-80
            ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-neutral-200 hover:bg-neutral-300'}
          `}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 text-amber-300" />
          ) : (
            <Moon className="h-5 w-5 text-ultra-400" />
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
