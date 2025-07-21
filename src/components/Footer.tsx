import React from 'react';
import { useTheme } from '../context/useTheme';

const Footer: React.FC = () => {
  const { theme } = useTheme();
  
  return (
    <footer className={`
      py-4 px-6 shadow-inner transition-colors duration-200
      ${theme === 'dark' ? 'bg-gray-800' : 'bg-neutral-100'}
    `}>
      <div className="container mx-auto text-center">
        <p className="text-sm flex items-center justify-center">
          <span className={`font-medium ${theme === 'dark' ? 'text-primary-400' : 'text-accent-500'}`}>Jezz</span>
          <span className={`font-medium ${theme === 'dark' ? 'text-ultra-400' : 'text-sienna-400'}`}>.</span>
          <span className={`font-medium ${theme === 'dark' ? 'text-violet-300' : 'text-violet-400'}`}>WTF</span>
          <span className={`ml-1 ${theme === 'dark' ? 'text-gray-400' : 'text-neutral-600'}`}>&copy; {new Date().getFullYear()}</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
