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
    lineClasses += ' bg-diff-add-bg dark:bg-green-500 dark:bg-opacity-10 hover:bg-green-200 dark:hover:bg-green-500 dark:hover:bg-opacity-20';
    contentClasses += ' text-diff-add-text dark:text-green-300';
    prefix = '+';
    prefixClasses += ' text-diff-add-text dark:text-green-400';
  } else if (line.type === 'delete') {
    lineClasses += ' bg-diff-del-bg dark:bg-red-500 dark:bg-opacity-10 hover:bg-red-200 dark:hover:bg-red-500 dark:hover:bg-opacity-20';
    contentClasses += ' text-diff-del-text dark:text-red-300';
    prefix = '-';
    prefixClasses += ' text-diff-del-text dark:text-red-400';
  } else if (line.text.startsWith('\\')) { // Special case for "\ No newline at end of file"
    lineClasses += ' bg-neutral-200 dark:bg-gray-700 dark:bg-opacity-50 hover:bg-neutral-300 dark:hover:bg-gray-700';
    contentClasses += ' text-neutral-500 italic';
    prefix = ' ';
  } else { // context
    lineClasses += ' hover:bg-neutral-200 dark:hover:bg-gray-700';
    contentClasses += ' text-neutral-700 dark:text-gray-400';
  }

  // Ensure content exists, use text if content is somehow undefined (e.g. for \ No newline)
  const displayContent = line.content === undefined ? line.text : line.content;

  return (
    <div className={`flex font-mono text-xs sm:text-sm h-full ${lineClasses}`}>
      <div className="w-10 sm:w-12 text-right pr-2 sm:pr-3 select-none shrink-0 text-neutral-400 dark:text-gray-600">
        {line.oldLineNumber !== undefined ? line.oldLineNumber : ''}
      </div>
      <div className="w-10 sm:w-12 text-right pr-2 sm:pr-3 select-none shrink-0 text-neutral-400 dark:text-gray-600">
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
