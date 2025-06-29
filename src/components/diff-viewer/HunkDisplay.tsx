import React, { useRef } from 'react';
import type { DiffHunk } from '../../types/diff-viewer-types';
import { MemoizedLineDisplay } from './LineDisplay';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTheme } from '../../context/ThemeContext';

interface HunkDisplayProps {
  hunk: DiffHunk;
}

export const HunkDisplay: React.FC<HunkDisplayProps> = ({ hunk }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();

  const rowVirtualizer = useVirtualizer({
    count: hunk.lines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 22, // Approximate height of a single line in px
    overscan: 10, // Render 10 items over and under the visible area
  });

  return (
    <div className="my-2 sm:my-3">
      <div className={`p-1.5 sm:p-2 px-3 sm:px-4 font-mono text-xs sm:text-sm select-none sticky top-0 z-10 bg-diff-hunk-bg ${theme === 'dark' ? 'text-blue-600 dark:bg-gray-700 dark:text-cyan-400' : 'text-ultra-500'}`}>
        {hunk.header}
      </div>
      <div 
        ref={parentRef} 
        className="bg-white dark:bg-gray-800 dark:bg-opacity-50 overflow-y-auto"
        style={{
          height: `${Math.min(hunk.lines.length * 22, 500)}px`, // Set a max height
          contain: 'strict',
        }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const line = hunk.lines[virtualItem.index];
            return (
              <div
                key={virtualItem.key}
                data-index={virtualItem.index}
                style={{
                  position: 'absolute',
                  top: `${virtualItem.start}px`,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                }}
              >
                <MemoizedLineDisplay line={line} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
