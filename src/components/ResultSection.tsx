import React, { useRef, useState, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChevronUp } from 'lucide-react';
import { DiffLine, DiffType, DiffResult, ThreeWayDiffResult, ThreeWayDiffSection } from '../utils/diffUtils';
import { ViewMode } from '../types/diff-viewer-types';
import { DiffType as DiffModeType } from './DiffChecker';
import { useTheme } from '../context/useTheme';

interface ResultSectionProps {
  diffResult: DiffResult | null;
  threeWayResult: ThreeWayDiffResult | null;
  viewMode: ViewMode;
  diffType: DiffModeType;
}

interface RenderDiffLineProps {
  line: DiffLine | null;
  side: 'left' | 'right';
  getDiffTypeClass: (type: DiffType) => string;
  lineNumber: number | null;
  viewMode: ViewMode;
}

interface ThreeWayLineProps {
  section: ThreeWayDiffSection;
  index: number;
  getDiffTypeClass: (type: string) => string;
}

interface InlineDiffLineProps {
  inlineLine?: {
    content: string;
    type: DiffType;
    lineNumber: string;
    changes?: { start: number; end: number }[];
  };
  getDiffTypeClass: (type: DiffType) => string;
  viewMode: ViewMode;
}

const ResultSection: React.FC<ResultSectionProps> = ({ 
  diffResult, 
  threeWayResult, 
  viewMode, 
  diffType 
}) => {
  const { theme } = useTheme();
  const parentRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const currentResult = diffType === 'three-way' ? threeWayResult : diffResult;

  const linesWithLineNumbers = React.useMemo(() => {
    if (diffType === 'three-way' || !diffResult) return [];
    
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
  }, [diffResult, diffType]);

  const getDiffTypeClass = (type: DiffType | string): string => {
    switch (type) {
      case 'added':
      case 'right-only':
        return theme === 'dark' ? 'bg-green-900/50' : 'bg-green-100';
      case 'removed':
      case 'left-only':
        return theme === 'dark' ? 'bg-red-900/50' : 'bg-red-100';
      case 'modified':
      case 'resolved':
        return theme === 'dark' ? 'bg-blue-900/50' : 'bg-blue-100';
      case 'conflict':
        return theme === 'dark' ? 'bg-yellow-900/50' : 'bg-yellow-100';
      case 'base-only':
        return theme === 'dark' ? 'bg-purple-900/50' : 'bg-purple-100';
      default:
        return '';
    }
  };

  // For inline view, we need to flatten the diff pairs into individual lines
  const inlineLines = React.useMemo(() => {
    if (diffType === 'three-way' || !diffResult || viewMode !== 'inline') return [];
    
    const lines: Array<{
      content: string;
      type: DiffType;
      lineNumber: string;
      changes?: { start: number; end: number }[];
    }> = [];
    
    let leftLineNumber = 1;
    let rightLineNumber = 1;
    
    for (const pair of diffResult.lines) {
      if (pair.left && pair.right && pair.left.type === 'unchanged') {
        // Unchanged line - show once
        lines.push({
          content: pair.left.content,
          type: 'unchanged',
          lineNumber: `${leftLineNumber},${rightLineNumber}`,
        });
        leftLineNumber++;
        rightLineNumber++;
      } else {
        // Changed lines - show removals first, then additions
        if (pair.left) {
          lines.push({
            content: pair.left.content,
            type: pair.left.type,
            lineNumber: leftLineNumber.toString(),
            changes: pair.left.changes,
          });
          leftLineNumber++;
        }
        if (pair.right) {
          lines.push({
            content: pair.right.content,
            type: pair.right.type,
            lineNumber: rightLineNumber.toString(),
            changes: pair.right.changes,
          });
          rightLineNumber++;
        }
      }
    }
    
    return lines;
  }, [diffResult, diffType, viewMode]);

  const itemCount = diffType === 'three-way' 
    ? threeWayResult?.sections.length || 0 
    : viewMode === 'inline'
      ? inlineLines.length
      : diffResult?.lines.length || 0;

  const rowVirtualizer = useVirtualizer({
    count: itemCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => {
      switch (viewMode) {
        case 'compact':
          return 20; // Smaller height for compact view
        case 'inline':
          return 24; // Medium height for inline
        default:
          return 28; // Default height
      }
    },
    overscan: 10,
    measureElement: (element) => {
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

  if (!currentResult) return null;

  const scrollToTop = () => {
    if (parentRef.current) {
      parentRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  const renderHeader = () => {
    if (diffType === 'three-way') {
      return (
        <div className="flex border-b">
          <div className={`w-1/3 p-3 font-semibold border-r ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'}`}>
            Base
          </div>
          <div className={`w-1/3 p-3 font-semibold border-r ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'}`}>
            Left
          </div>
          <div className={`w-1/3 p-3 font-semibold ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
            Right
          </div>
        </div>
      );
    }

    switch (viewMode) {
      case 'inline':
        return (
          <div className={`p-3 font-semibold border-b ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'}`}>
            <div className="flex items-center gap-4">
              <span>Git-style Inline Diff</span>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <span className="text-red-500">-</span>
                  <span>Removed</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-green-500">+</span>
                  <span>Added</span>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'compact':
        return (
          <div className={`p-2 text-sm font-semibold border-b ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'}`}>
            <div className="flex justify-between items-center">
              <span>Compact View</span>
              <div className="flex gap-2 text-xs">
                <span className="px-1 bg-green-200 text-green-800">+</span>
                <span className="px-1 bg-red-200 text-red-800">-</span>
                <span className="px-1 bg-blue-200 text-blue-800">~</span>
              </div>
            </div>
          </div>
        );
      
      default: // split (now the default)
        return (
          <div className="flex border-b">
            <div className={`w-1/2 p-4 font-semibold border-r ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'}`}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                Original
              </div>
            </div>
            <div className={`w-1/2 p-4 font-semibold ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                Modified
              </div>
            </div>
          </div>
        );
    }
  };



  return (
    <div className="w-full mt-4 relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">
          {diffType === 'three-way' ? '3-Way Merge Result' : 'Diff Result'}
        </h2>
        
        {/* Enhanced Statistics */}
        {currentResult.metadata && (
          <div className={`
            flex items-center gap-4 text-sm
            ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}
          `}>
            <div className="flex items-center gap-2">
              <span className="font-medium">{currentResult.metadata.algorithm}</span>
              <span className={`
                px-2 py-0.5 rounded-full text-xs
                ${theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}
              `}>
                {currentResult.metadata.processingTime.toFixed(1)}ms
              </span>
              <span className={`
                px-2 py-0.5 rounded-full text-xs font-medium capitalize
                ${viewMode === 'compact' ? 'bg-orange-100 text-orange-800' : 
                  viewMode === 'inline' ? 'bg-purple-100 text-purple-800' :
                  viewMode === 'split' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'}
              `}>
                {viewMode}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Statistics Bar */}
      {diffType === 'three-way' && threeWayResult ? (
        <div className={`
          grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 p-4 rounded-lg
          ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'}
        `}>
          <div className="text-center">
            <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
              {threeWayResult.stats.leftChanges}
            </div>
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Left Changes
            </div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
              {threeWayResult.stats.rightChanges}
            </div>
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Right Changes
            </div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
              {threeWayResult.stats.conflicts}
            </div>
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Conflicts
            </div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
              {threeWayResult.stats.resolved}
            </div>
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Resolved
            </div>
          </div>
        </div>
      ) : diffResult && (
        <div className={`
          grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 p-4 rounded-lg
          ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'}
        `}>
          <div className="text-center">
            <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`}>
              +{diffResult.stats.additions}
            </div>
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Additions
            </div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
              -{diffResult.stats.deletions}
            </div>
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Deletions
            </div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
              ~{diffResult.stats.modifications}
            </div>
            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Modifications
            </div>
          </div>
        </div>
      )}
      
      <div className={`
        rounded-lg border overflow-hidden transition-colors duration-200
        ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}
      `}>
        {renderHeader()}
        
        <div 
          ref={parentRef}
          className="overflow-auto"
          style={{
            height: `${Math.max(Math.min(itemCount * (viewMode === 'compact' ? 20 : viewMode === 'inline' ? 24 : 28), 800), 400)}px`,
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
                  {diffType === 'three-way' && threeWayResult ? (
                    <ThreeWayLine 
                      section={threeWayResult.sections[virtualRow.index]}
                      index={virtualRow.index}
                      getDiffTypeClass={getDiffTypeClass}
                    />
                  ) : viewMode === 'inline' ? (
                    <InlineDiffLine
                      inlineLine={inlineLines[virtualRow.index]}
                      getDiffTypeClass={getDiffTypeClass}
                      viewMode={viewMode}
                    />
                  ) : diffResult && (
                    <>
                      <RenderDiffLine 
                        line={linesWithLineNumbers[virtualRow.index]?.left || null} 
                        side="left" 
                        getDiffTypeClass={getDiffTypeClass}
                        lineNumber={linesWithLineNumbers[virtualRow.index]?.leftLineNumber || null}
                        viewMode={viewMode}
                      />
                      <RenderDiffLine 
                        line={linesWithLineNumbers[virtualRow.index]?.right || null} 
                        side="right" 
                        getDiffTypeClass={getDiffTypeClass}
                        lineNumber={linesWithLineNumbers[virtualRow.index]?.rightLineNumber || null}
                        viewMode={viewMode}
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Scroll to top button for results content only */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className={`
              fixed bottom-6 right-20 p-3 rounded-full shadow-lg transition-all z-10
              ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-50'}
              border ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'}
            `}
            aria-label="Scroll results to top"
          >
            <ChevronUp size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

const ThreeWayLine: React.FC<ThreeWayLineProps> = ({ section, index, getDiffTypeClass }) => {
  const { theme } = useTheme();
  
  return (
    <>
      {/* Base column */}
      <div className={`w-1/3 flex border-r ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className={`
          w-12 flex-shrink-0 p-2 text-right font-mono text-sm border-r select-none
          ${theme === 'dark' ? 'bg-gray-900 text-gray-500 border-gray-700' : 'bg-gray-100 text-gray-400 border-gray-200'}
        `}>
          {index + 1}
        </div>
        <div className={`
          flex-1 p-2 font-mono text-sm whitespace-pre-wrap break-all
          ${section.base ? getDiffTypeClass(section.base.type) : theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'}
        `}>
          {section.base?.content || '\u00A0'}
        </div>
      </div>
      
      {/* Left column */}
      <div className={`w-1/3 flex border-r ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className={`
          w-12 flex-shrink-0 p-2 text-right font-mono text-sm border-r select-none
          ${theme === 'dark' ? 'bg-gray-900 text-gray-500 border-gray-700' : 'bg-gray-100 text-gray-400 border-gray-200'}
        `}>
          {index + 1}
        </div>
        <div className={`
          flex-1 p-2 font-mono text-sm whitespace-pre-wrap break-all
          ${section.left ? getDiffTypeClass(section.left.type) : theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'}
        `}>
          {section.left?.content || '\u00A0'}
        </div>
      </div>
      
      {/* Right column */}
      <div className="w-1/3 flex">
        <div className={`
          w-12 flex-shrink-0 p-2 text-right font-mono text-sm border-r select-none
          ${theme === 'dark' ? 'bg-gray-900 text-gray-500 border-gray-700' : 'bg-gray-100 text-gray-400 border-gray-200'}
        `}>
          {index + 1}
        </div>
        <div className={`
          flex-1 p-2 font-mono text-sm whitespace-pre-wrap break-all
          ${section.right ? getDiffTypeClass(section.right.type) : theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50'}
        `}>
          {section.right?.content || '\u00A0'}
        </div>
      </div>
    </>
  );
};

const RenderDiffLine: React.FC<RenderDiffLineProps> = ({ line, side, getDiffTypeClass, lineNumber, viewMode }) => {
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
  
  // Adjust spacing and font size based on view mode
  const spacing = viewMode === 'compact' ? 'p-1' : viewMode === 'split' ? 'p-3' : 'p-2';
  const fontSize = viewMode === 'compact' ? 'text-xs' : 'text-sm';
  const lineNumberWidth = viewMode === 'compact' ? 'w-8' : 'w-12';

  return (
    <div className={`
      w-1/2 flex
      ${side === 'left' ? 'border-r' : ''}
      ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}
      ${viewMode === 'split' ? 'bg-gradient-to-r from-transparent to-gray-50 dark:to-gray-800' : ''}
    `}>
      <div className={`
        ${lineNumberWidth} flex-shrink-0 ${spacing} text-right font-mono ${fontSize} border-r select-none
        ${theme === 'dark' ? 'bg-gray-900 text-gray-500' : 'bg-gray-100 text-gray-400'}
        ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}
      `}>
        {lineNumber || '\u00A0'}
      </div>
      <div className={`
        flex-1 ${spacing} font-mono ${fontSize} whitespace-pre-wrap break-all
        ${line ? getDiffTypeClass(line.type) : ''}
        ${!line && (theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50')}
        ${viewMode === 'split' && line?.type === 'added' ? 'border-l-2 border-green-400' : ''}
        ${viewMode === 'split' && line?.type === 'removed' ? 'border-l-2 border-red-400' : ''}
        ${viewMode === 'split' && line?.type === 'modified' ? 'border-l-2 border-blue-400' : ''}
      `}>
        {line ? renderContent(line) : '\u00A0'}
      </div>
    </div>
  );
};

const InlineDiffLine: React.FC<InlineDiffLineProps> = ({ inlineLine, getDiffTypeClass, viewMode }) => {
  const { theme } = useTheme();
  
  if (!inlineLine) return <div className="w-full h-6"></div>;
  
  const getPrefix = () => {
    switch (inlineLine.type) {
      case 'added':
        return { symbol: '+', color: 'text-green-600 dark:text-green-400' };
      case 'removed':
        return { symbol: '-', color: 'text-red-600 dark:text-red-400' };
      case 'modified':
        return { symbol: '~', color: 'text-blue-600 dark:text-blue-400' };
      default:
        return { symbol: ' ', color: 'text-gray-500' };
    }
  };
  
  const prefix = getPrefix();
  
  return (
    <div className={`
      w-full flex
      ${getDiffTypeClass(inlineLine.type)}
    `}>
      <div className={`
        w-12 flex-shrink-0 text-right font-mono text-xs border-r select-none
        ${viewMode === 'compact' ? 'p-1' : 'p-2'}
        ${theme === 'dark' ? 'bg-gray-900 text-gray-500 border-gray-700' : 'bg-gray-100 text-gray-400 border-gray-200'}
      `}>
        {inlineLine.lineNumber}
      </div>
      <div className={`
        w-8 flex-shrink-0 text-center font-mono font-bold border-r
        ${viewMode === 'compact' ? 'p-1 text-xs' : 'p-2 text-sm'}
        ${prefix.color}
        ${theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-gray-100 border-gray-200'}
      `}>
        {prefix.symbol}
      </div>
      <div className={`
        flex-1 font-mono whitespace-pre-wrap break-all
        ${viewMode === 'compact' ? 'p-1 text-xs' : 'p-2 text-sm'}
      `}>
        {inlineLine.content || '\u00A0'}
      </div>
    </div>
  );
};

export default ResultSection;