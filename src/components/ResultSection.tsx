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
              <RenderDiffLine line={line.left} side="left" getDiffTypeClass={getDiffTypeClass} />
              <RenderDiffLine line={line.right} side="right" getDiffTypeClass={getDiffTypeClass} />
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
}

const RenderDiffLine: React.FC<RenderDiffLineProps> = ({ line, side, getDiffTypeClass }) => {
  const { theme } = useTheme();
  
  if (!line) {
    return (
      <div className={`
        w-1/2 p-2 border-b font-mono text-sm whitespace-pre-wrap
        ${side === 'left' ? 'border-r' : ''}
        ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}
      `}>
        &nbsp;
      </div>
    );
  }

  return (
    <div className={`
      w-1/2 p-2 border-b font-mono text-sm whitespace-pre-wrap ${getDiffTypeClass(line.type)}
      ${side === 'left' ? 'border-r' : ''}
      ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}
    `}>
      {line.content || '\u00A0'}
    </div>
  );
};

export default ResultSection;