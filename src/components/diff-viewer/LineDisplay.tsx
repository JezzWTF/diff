import React from 'react';
import type { DiffLine } from '../../types/diff-viewer-types';

interface LineDisplayProps {
  line: DiffLine;
}

export const LineDisplay: React.FC<LineDisplayProps> = ({ line }) => {
  let bgColor = 'hover:bg-gray-700'; // Default hover for context lines
  let textColor = 'text-gray-300';
  let prefix = ' ';
  let prefixColor = 'text-gray-500';

  if (line.type === 'add') {
    bgColor = 'bg-green-500 bg-opacity-10 hover:bg-green-500 hover:bg-opacity-20';
    textColor = 'text-green-300';
    prefix = '+';
    prefixColor = 'text-green-400';
  } else if (line.type === 'delete') {
    bgColor = 'bg-red-500 bg-opacity-10 hover:bg-red-500 hover:bg-opacity-20';
    textColor = 'text-red-300';
    prefix = '-';
    prefixColor = 'text-red-400';
  } else if (line.text.startsWith('\\')) { // Special case for "\ No newline at end of file"
    bgColor = 'bg-gray-700 bg-opacity-50 hover:bg-gray-700';
    textColor = 'text-gray-500 italic';
    prefix = ' '; // No specific prefix for this, content is the full line
  } else { // context
     textColor = 'text-gray-400';
  }

  // Ensure content exists, use text if content is somehow undefined (e.g. for \ No newline)
  const displayContent = line.content === undefined ? line.text : line.content;

  return (
    <div className={`flex font-mono text-xs sm:text-sm transition-colors duration-100 ${bgColor}`}>
      <div className="w-10 sm:w-12 text-right pr-2 sm:pr-3 text-gray-600 select-none shrink-0">
        {line.oldLineNumber !== undefined ? line.oldLineNumber : ''}
      </div>
      <div className="w-10 sm:w-12 text-right pr-2 sm:pr-3 text-gray-600 select-none shrink-0">
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
