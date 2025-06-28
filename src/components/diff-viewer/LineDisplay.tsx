import React from 'react';
import type { DiffLine } from '../../types/diff-viewer-types';

interface LineDisplayProps {
  line: DiffLine;
}

const LineDisplay: React.FC<LineDisplayProps> = ({ line }) => {
  let lineClasses = 'transition-colors duration-100';
  let prefix = ' ';
  let prefixClasses = 'w-4 text-center select-none shrink-0';
  let contentClasses = 'flex-1 whitespace-pre-wrap break-all py-0.5 pr-2 sm:pr-4';

  if (line.type === 'add') {
    lineClasses += ' bg-green-100 dark:bg-green-500 dark:bg-opacity-10 hover:bg-green-200 dark:hover:bg-green-500 dark:hover:bg-opacity-20';
    contentClasses += ' text-green-800 dark:text-green-300';
    prefix = '+';
    prefixClasses += ' text-green-400';
  } else if (line.type === 'delete') {
    lineClasses += ' bg-red-100 dark:bg-red-500 dark:bg-opacity-10 hover:bg-red-200 dark:hover:bg-red-500 dark:hover:bg-opacity-20';
    contentClasses += ' text-red-800 dark:text-red-300';
    prefix = '-';
    prefixClasses += ' text-red-400';
  } else if (line.text.startsWith('\\')) { // Special case for "\ No newline at end of file"
    lineClasses += ' bg-gray-200 dark:bg-gray-700 dark:bg-opacity-50 hover:bg-gray-300 dark:hover:bg-gray-700';
    contentClasses += ' text-gray-500 italic';
    prefix = ' ';
  } else { // context
    lineClasses += ' hover:bg-gray-200 dark:hover:bg-gray-700';
    contentClasses += ' text-gray-600 dark:text-gray-400';
  }

  // Ensure content exists, use text if content is somehow undefined (e.g. for \ No newline)
  const displayContent = line.content === undefined ? line.text : line.content;

  return (
    <div className={`flex font-mono text-xs sm:text-sm [content-visibility:auto] ${lineClasses}`}>
      <div className="w-10 sm:w-12 text-right pr-2 sm:pr-3 select-none shrink-0 text-gray-400 dark:text-gray-600">
        {line.oldLineNumber !== undefined ? line.oldLineNumber : ''}
      </div>
      <div className="w-10 sm:w-12 text-right pr-2 sm:pr-3 select-none shrink-0 text-gray-400 dark:text-gray-600">
        {line.newLineNumber !== undefined ? line.newLineNumber : ''}
      </div>
      <div className={prefixClasses}>
        {prefix}
      </div>
      <pre className={contentClasses}>
        {displayContent}
      </pre>
    </div>
  );
};

export const MemoizedLineDisplay = React.memo(LineDisplay);
