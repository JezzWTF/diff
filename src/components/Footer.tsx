import React from 'react';
import { useTheme } from '../context/ThemeContext';

const Footer: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <footer className={`
      py-4 px-6 shadow-inner transition-colors duration-200
      ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}
    `}>
      <div className="container mx-auto text-center">
        <p className="text-sm">
          Jezz.WTF &copy; {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
