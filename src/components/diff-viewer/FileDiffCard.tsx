import React, { useState } from 'react';
import type { FileDiff } from '../../types/diff-viewer-types';
import { HunkDisplay } from './HunkDisplay';
import { ChevronDownIcon, ChevronUpIcon, PlusCircleIcon, MinusCircleIcon, ArrowPathIcon, DocumentTextIcon } from './Icons';

interface FileDiffCardProps {
  fileDiff: FileDiff;
}

export const FileDiffCard: React.FC<FileDiffCardProps> = ({ fileDiff }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  let statusText = "Modified";
  let statusColor = "text-yellow-400";
  let StatusIcon = ArrowPathIcon;

  if (fileDiff.isNewFile) {
    statusText = "Added";
    statusColor = "text-green-400";
    StatusIcon = PlusCircleIcon;
  } else if (fileDiff.isDeletedFile) {
    statusText = "Deleted";
    statusColor = "text-red-400";
    StatusIcon = MinusCircleIcon;
  } else if (fileDiff.isRenamed) {
    statusText = "Renamed";
    statusColor = "text-blue-400";
    StatusIcon = ArrowPathIcon; // Or a specific rename icon
  } else if (fileDiff.isBinary) {
    statusText = "Binary file";
    statusColor = "text-purple-400";
    StatusIcon = DocumentTextIcon;
  }


  const oldPathDisplay = fileDiff.isNewFile ? '/dev/null' : (fileDiff.oldPath.startsWith('a/') ? fileDiff.oldPath.substring(2) : fileDiff.oldPath);
  const newPathDisplay = fileDiff.isDeletedFile ? '/dev/null' : (fileDiff.newPath.startsWith('b/') ? fileDiff.newPath.substring(2) : fileDiff.newPath);

  const renderPath = () => {
    if (fileDiff.isNewFile) return <span className="text-green-600 dark:text-green-400">{newPathDisplay}</span>;
    if (fileDiff.isDeletedFile) return <span className="text-red-600 dark:text-red-400">{oldPathDisplay}</span>;
    if (fileDiff.isRenamed) return <> 
      <span className="text-red-600 line-through dark:text-red-400">{oldPathDisplay}</span> 
      <span className="mx-1 text-gray-500">&rarr;</span> 
      <span className="text-green-600 dark:text-green-400">{newPathDisplay}</span>
    </>;
    return <span className="text-sky-600 dark:text-sky-400">{newPathDisplay}</span>; // Modified
  };
  
  const totalAdditions = fileDiff.hunks.reduce((sum, hunk) => sum + hunk.lines.filter(l => l.type === 'add').length, 0);
  const totalDeletions = fileDiff.hunks.reduce((sum, hunk) => sum + hunk.lines.filter(l => l.type === 'delete').length, 0);


  return (
    <div className="rounded-lg shadow-lg overflow-hidden transition-all duration-300 ease-in-out bg-white dark:bg-gray-800">
      <header 
        className="flex items-center justify-between p-3 sm:p-4 cursor-pointer transition-colors bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:bg-opacity-50 dark:hover:bg-gray-700"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center min-w-0">
          <StatusIcon className={`w-5 h-5 sm:w-6 sm:h-6 mr-2 shrink-0 ${statusColor}`} />
          <div className="font-mono text-xs sm:text-sm truncate" title={fileDiff.isRenamed ? `${oldPathDisplay} → ${newPathDisplay}` : newPathDisplay}>
            {renderPath()}
          </div>
          <span className={`ml-3 px-2 py-0.5 text-xs font-semibold rounded-full ${statusColor} bg-opacity-20 ${statusColor.replace('text-', 'bg-')}`}>{statusText}</span>
        </div>
        <div className="flex items-center">
            {totalAdditions > 0 && <span className="text-green-400 text-xs sm:text-sm mr-2">+{totalAdditions}</span>}
            {totalDeletions > 0 && <span className="text-red-400 text-xs sm:text-sm mr-3">-{totalDeletions}</span>}
            {isCollapsed ? <ChevronDownIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" /> : <ChevronUpIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
        </div>
      </header>

      {!isCollapsed && (
        <div className="p-0 sm:p-1 md:p-2">
          {fileDiff.headerLines && fileDiff.headerLines.length > 0 && (
            <div className="px-3 py-2 sm:px-4 sm:py-3 bg-gray-200 dark:bg-gray-900 dark:bg-opacity-30">
              {fileDiff.headerLines.map((line, idx) => (
                <pre key={`header-${idx}`} className="font-mono text-xs text-gray-500 whitespace-pre-wrap break-all">{line}</pre>
              ))}
            </div>
          )}
          {fileDiff.fileMetaLines && fileDiff.fileMetaLines.length > 0 && (
             <div className="px-3 py-2 sm:px-4 sm:py-3 bg-gray-100 dark:bg-gray-800">
              {fileDiff.fileMetaLines.map((line, idx) => (
                 <pre key={`meta-${idx}`} className={`font-mono text-xs whitespace-pre-wrap break-all ${line.startsWith('---') || line.startsWith('+++') ? 'text-gray-400' : 'text-gray-500'}`}>{line}</pre>
              ))}
            </div>
          )}

          {fileDiff.isBinary ? (
            <div className="p-4 text-center text-gray-500">
              Binary file changes are not displayed in detail.
            </div>
          ) : fileDiff.hunks.length > 0 ? (
            fileDiff.hunks.map((hunk, index) => (
              <HunkDisplay key={index} hunk={hunk} />
            ))
          ) : (
             <div className="p-4 text-center text-gray-500">
              { fileDiff.fileModeChange ? `File mode changed: ${fileDiff.fileModeChange.oldMode || ''} → ${fileDiff.fileModeChange.newMode || ''}` :  "No textual changes in this file (e.g., only mode change or empty diff)." }
            </div>
          )}
        </div>
      )}
    </div>
  );
};
