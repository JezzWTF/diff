import React, { useRef, useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { DiffResult, DiffLine, DiffType } from '../utils/diffUtils';
import { useVirtualizer } from '@tanstack/react-virtual';

interface ResultSectionProps {
  diffResult: DiffResult;
}

const ResultSection: React.FC<ResultSectionProps> = ({ diffResult }) => {
  const { theme } = useTheme();
  const parentRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const linesWithLineNumbers = React.useMemo(() => {
    let leftLineNumber = 1;
    let rightLineNumber = 1;
    return diffResult.lines.map((line) => {
      const currentLeftNumber = line.left ? leftLineNumber++ : null;
      const currentRightNumber = line.right ? rightLineNumber++ : null;
      return {
        ...line,
        leftLineNumber: currentLeftNumber,
        rightLineNumber: currentRightNumber,
      };
    });
  }, [diffResult.lines]);

  const getDiffTypeClass = (type: DiffType): string => {
    if (type === 'added') {
      return theme === 'dark' ? 'bg-green-900/50' : 'bg-green-100';
    } else if (type === 'removed') {
      return theme === 'dark' ? 'bg-red-900/50' : 'bg-red-100';
    } else if (type === 'modified') {
      return theme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-100';
    }
    return '';
  };

  const rowVirtualizer = useVirtualizer({
    count: diffResult.lines.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 28, // Increased height to accommodate wrapped text
    overscan: 10, // Render 10 items over and under the visible area
    measureElement: (element) => {
      // Dynamically measure the actual height of each row
      return element.getBoundingClientRect().height;
    },
  });

  // Handle scroll event to show/hide scroll-to-top button
  useEffect(() => {
    const scrollContainer = parentRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      setShowScrollTop(scrollContainer.scrollTop > 300);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    if (parentRef.current) {
      parentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="w-full mt-4 relative">
      <h2 className="text-xl font-bold mb-4">Diff Result</h2>
      
      <div className={`
        rounded-lg border overflow-hidden transition-colors duration-200
        ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}
      `}>
        <div className="flex border-b">
          <div className={`
            w-1/2 p-3 font-semibold border-r
            ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'}
          `}>
            Original
          </div>
          <div className={`
            w-1/2 p-3 font-semibold
            ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}
          `}>
            Modified
          </div>
        </div>
        
        <div 
          ref={parentRef}
          className="overflow-auto"
          style={{
            height: `${Math.min(diffResult.lines.length * 28, 600)}px`, // Set a max height
            contain: 'content',
            maxWidth: '100%',
          }}
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const line = linesWithLineNumbers[virtualRow.index];
              
              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  style={{
                    position: 'absolute',
                    top: `${virtualRow.start}px`,
                    left: 0,
                    width: '100%',
                    minHeight: `${virtualRow.size}px`,
                  }}
                  className="flex w-full"
                >
                  <RenderDiffLine 
                    line={line.left} 
                    side="left" 
                    getDiffTypeClass={getDiffTypeClass}
                    lineNumber={line.leftLineNumber}
                  />
                  <RenderDiffLine 
                    line={line.right} 
                    side="right" 
                    getDiffTypeClass={getDiffTypeClass}
                    lineNumber={line.rightLineNumber}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Scroll to top button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className={`
              absolute bottom-4 right-4 p-2 rounded-full shadow-md transition-opacity duration-200
              ${theme === 'dark' 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-white hover:bg-gray-100 text-gray-800'}
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500
            `}
            aria-label="Scroll to top"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      
      <div className="flex gap-6 mt-4 justify-center">
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-full ${theme === 'dark' ? 'bg-green-500' : 'bg-green-400'}`}></div>
          <span>Added</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-full ${theme === 'dark' ? 'bg-red-500' : 'bg-red-400'}`}></div>
          <span>Removed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded-full ${theme === 'dark' ? 'bg-blue-500' : 'bg-blue-400'}`}></div>
          <span>Modified</span>
        </div>
      </div>
    </div>
  );
};

interface RenderDiffLineProps {
  line: DiffLine | null;
  side: 'left' | 'right';
  getDiffTypeClass: (type: DiffType) => string;
  lineNumber: number | null;
}

const RenderDiffLine: React.FC<RenderDiffLineProps> = ({ line, side, getDiffTypeClass, lineNumber }) => {
  const { theme } = useTheme();
  
  const renderContent = (line: DiffLine) => {
    if (!line.changes || line.changes.length === 0) {
      return line.content;
    }

    const parts: JSX.Element[] = [];
    let lastEnd = 0;

    line.changes.forEach(({ start, end }, index) => {
      // Add unchanged text before the change
      if (start > lastEnd) {
        parts.push(
          <span key={`unchanged-${index}-1`}>
            {line.content.slice(lastEnd, start)}
          </span>
        );
      }

      // Add changed text
      parts.push(
        <span
          key={`changed-${index}`}
          className={`
            font-semibold
            ${theme === 'dark'
              ? line.type === 'removed'
                ? 'text-red-400'
                : line.type === 'modified' // Check if the line type is 'modified'
                ? 'text-yellow-400'      // Apply yellow for modified text in dark mode
                : 'text-blue-400'        // Fallback (original blue)
              : line.type === 'removed'
                ? 'text-red-600'
                : line.type === 'modified' // Check if the line type is 'modified'
                ? 'text-yellow-600'      // Apply yellow for modified text in light mode
                : 'text-blue-600'        // Fallback (original blue)
            }
          `}
        >
          {line.content.slice(start, end)}
        </span>
      );

      lastEnd = end;
    });

    // Add any remaining unchanged text
    if (lastEnd < line.content.length) {
      parts.push(
        <span key="unchanged-last">
          {line.content.slice(lastEnd)}
        </span>
      );
    }

    return <>{parts}</>;
  };
  
  return (
    <div className={`
      w-1/2 flex
      ${side === 'left' ? 'border-r' : ''}
      ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}
    `}>
      <div className={`
        w-12 flex-shrink-0 p-2 text-right font-mono text-sm border-r select-none
        ${theme === 'dark' ? 'bg-gray-900 text-gray-500' : 'bg-gray-100 text-gray-400'}
        ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}
      `}>
        {lineNumber || '\u00A0'}
      </div>
      <div className={`
        flex-1 p-2 font-mono text-sm whitespace-pre-wrap break-all
        ${line ? getDiffTypeClass(line.type) : ''}
        ${!line && (theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50')}
      `}>
        {line ? renderContent(line) : '\u00A0'}
      </div>
    </div>
  );
};

export default ResultSection;