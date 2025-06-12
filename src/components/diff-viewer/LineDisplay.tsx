import React from 'react';
import type { DiffLine } from '../../types/diff-viewer-types';
import { useTheme } from '../../context/ThemeContext';

interface LineDisplayProps {
  line: DiffLine;
}

export const LineDisplay: React.FC<LineDisplayProps> = ({ line }) => {
  const { theme } = useTheme();
  
  let bgColor = theme === 'dark' 
    ? 'hover:bg-gray-700' 
    : 'hover:bg-gray-200';
  let textColor = theme === 'dark' 
    ? 'text-gray-300' 
    : 'text-gray-700';
  let prefix = ' ';
  let prefixColor = theme === 'dark'
    ? 'text-gray-500'
    : 'text-gray-400';

  if (line.type === 'add') {
    bgColor = theme === 'dark'
      ? 'bg-green-500 bg-opacity-10 hover:bg-green-500 hover:bg-opacity-20'
      : 'bg-green-100 hover:bg-green-200';
    textColor = theme === 'dark'
      ? 'text-green-300'
      : 'text-green-800';
    prefix = '+';
    prefixColor = 'text-green-400';
  } else if (line.type === 'delete') {
    bgColor = theme === 'dark'
      ? 'bg-red-500 bg-opacity-10 hover:bg-red-500 hover:bg-opacity-20'
      : 'bg-red-100 hover:bg-red-200';
    textColor = theme === 'dark'
      ? 'text-red-300'
      : 'text-red-800';
    prefix = '-';
    prefixColor = 'text-red-400';
  } else if (line.text.startsWith('\\')) { // Special case for "\ No newline at end of file"
    bgColor = theme === 'dark'
      ? 'bg-gray-700 bg-opacity-50 hover:bg-gray-700'
      : 'bg-gray-200 hover:bg-gray-300';
    textColor = 'text-gray-500 italic';
    prefix = ' '; // No specific prefix for this, content is the full line
  } else { // context
    textColor = theme === 'dark'
      ? 'text-gray-400'
      : 'text-gray-600';
  }

  // Ensure content exists, use text if content is somehow undefined (e.g. for \ No newline)
  const displayContent = line.content === undefined ? line.text : line.content;

  return (
    <div className={`flex font-mono text-xs sm:text-sm transition-colors duration-100 ${bgColor}`}>
      <div className={`w-10 sm:w-12 text-right pr-2 sm:pr-3 select-none shrink-0 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>
        {line.oldLineNumber !== undefined ? line.oldLineNumber : ''}
      </div>
      <div className={`w-10 sm:w-12 text-right pr-2 sm:pr-3 select-none shrink-0 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-400'}`}>
        {line.newLineNumber !== undefined ? line.newLineNumber : ''}
      </div>
      <div className={`w-4 text-center select-none shrink-0 ${prefixColor}`}>
        {prefix}
      </div>
      <pre className={`flex-1 whitespace-pre-wrap break-all py-0.5 pr-2 sm:pr-4 ${textColor}`}>
        {displayContent}
      </pre>
    </div>
  );
};
