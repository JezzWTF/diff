import React from 'react';
import { Sun, Moon, GitCompare as FileCompare } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-primary-500 text-white'
        : theme === 'dark'
        ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
        : 'text-gray-600 hover:bg-gray-200 hover:text-black'
    }`;

  return (
    <header className={`
      py-4 px-6 shadow-md transition-colors duration-200
      ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}
    `}>
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <FileCompare className="h-8 w-8 text-primary-500" />
            <h1 className="text-2xl font-bold">Diff Checker</h1>
          </div>
          <nav className="flex items-center gap-4">
            <NavLink to="/" className={getLinkClass}>
              Home
            </NavLink>
            <NavLink to="/diff-viewer" className={getLinkClass}>
              Diff Viewer
            </NavLink>
          </nav>
        </div>
        
        <button
          onClick={toggleTheme}
          className={`
            p-2 rounded-full transition-colors duration-200 hover:bg-opacity-80
            ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}
          `}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 text-amber-300" />
          ) : (
            <Moon className="h-5 w-5 text-indigo-700" />
          )}
        </button>
      </div>
    </header>
  );
};

export default Header;
