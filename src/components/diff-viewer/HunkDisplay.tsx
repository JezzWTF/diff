import React, { useRef, useState, useEffect } from 'react';
import type { DiffHunk } from '../../types/diff-viewer-types';
import { MemoizedLineDisplay } from './LineDisplay';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useTheme } from '../../context/useTheme';
import { ChevronUpIcon } from './Icons';

interface HunkDisplayProps {
  hunk: DiffHunk;
}

export const HunkDisplay: React.FC<HunkDisplayProps> = ({ hunk }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const { theme } = useTheme();
  const [showScrollTop, setShowScrollTop] = useState(false);

  const rowVirtualizer = useVirtualizer({
    count: hunk.lines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 22, // Approximate height of a single line in px
    overscan: 10, // Render 10 items over and under the visible area
  });

  useEffect(() => {
    const handleScroll = () => {
      if (parentRef.current) {
        // Show button when scrolled down more than 50px in this hunk
        setShowScrollTop(parentRef.current.scrollTop > 50);
      }
    };

    const scrollElement = parentRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const scrollToHunkTop = () => {
    if (parentRef.current) {
      parentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="my-2 sm:my-3 relative">
      <div className={`p-1.5 sm:p-2 px-3 sm:px-4 font-mono text-xs sm:text-sm select-none sticky top-0 z-1 bg-diff-hunk-bg ${theme === 'dark' ? 'text-blue-600 dark:bg-gray-700 dark:text-cyan-400' : 'text-ultra-500'}`}>
        {hunk.header}
      </div>
      <div 
        ref={parentRef} 
        data-hunk-scroll
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
      
      {/* Return to top button for this hunk */}
      {showScrollTop && (
        <button
          onClick={scrollToHunkTop}
          className={`absolute bottom-2 right-2 p-1.5 rounded-full shadow-md transition-all duration-300 z-20 ${
            theme === 'dark' 
              ? 'bg-gray-700 hover:bg-gray-600 text-white' 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          } border ${
            theme === 'dark' ? 'border-gray-600' : 'border-gray-300'
          }`}
          aria-label={`Scroll to top of hunk`}
          title={`Back to top of this hunk`}
        >
          <ChevronUpIcon className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};
