import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { DiffResult, DiffLine, DiffType } from '../utils/diffUtils';

interface ResultSectionProps {
  diffResult: DiffResult;
}

const ResultSection: React.FC<ResultSectionProps> = ({ diffResult }) => {
  const { theme } = useTheme();
  
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

  let leftLineCount = 1;
  let rightLineCount = 1;

  return (
    <div className="w-full mt-4">
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
        
        <div className="overflow-auto max-h-[600px]">
          {diffResult.lines.map((line, index) => (
            <div key={index} className="flex">
              <RenderDiffLine 
                line={line.left} 
                side="left" 
                getDiffTypeClass={getDiffTypeClass}
                lineNumber={line.left ? leftLineCount++ : null}
              />
              <RenderDiffLine 
                line={line.right} 
                side="right" 
                getDiffTypeClass={getDiffTypeClass}
                lineNumber={line.right ? rightLineCount++ : null}
              />
            </div>
          ))}
        </div>
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
        flex-1 p-2 font-mono text-sm whitespace-pre-wrap
        ${line ? getDiffTypeClass(line.type) : ''}
        ${!line && (theme === 'dark' ? 'bg-gray-800/50' : 'bg-gray-50')}
      `}>
        {line ? renderContent(line) : '\u00A0'}
      </div>
    </div>
  );
};

export default ResultSection;