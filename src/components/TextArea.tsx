import React from 'react';
import { useTheme } from '../context/ThemeContext';

interface TextAreaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  readOnly?: boolean;
}

const TextArea: React.FC<TextAreaProps> = ({ 
  value, 
  onChange, 
  placeholder,
  readOnly = false
}) => {
  const { theme } = useTheme();
  
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      className={`
        w-full h-64 p-4 rounded-lg font-mono text-sm resize-none transition-colors duration-200
        ${theme === 'dark' 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-300'}
        border focus:outline-none focus:ring-2 focus:ring-primary-500
      `}
    />
  );
};

export default TextArea;