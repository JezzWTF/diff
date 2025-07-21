import React, { useState } from 'react';
import InputSection from './InputSection';
import ResultSection from './ResultSection';
import { computeDiff, computeThreeWayDiff, DiffResult, ThreeWayDiffResult } from '../utils/diffUtils';
import { Loader2, Split, GitMerge } from 'lucide-react';
import { useTheme } from '../context/useTheme';
import { ViewMode } from '../types/diff-viewer-types';

export type DiffType = 'two-way' | 'three-way';

interface DiffCheckerProps {
  diffMode?: string;
}

const DiffChecker: React.FC<DiffCheckerProps> = ({ diffMode = 'lines' }) => {
  const [leftText, setLeftText] = useState<string>('');
  const [rightText, setRightText] = useState<string>('');
  const [baseText, setBaseText] = useState<string>(''); // For 3-way diff
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [threeWayResult, setThreeWayResult] = useState<ThreeWayDiffResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [diffType, setDiffType] = useState<DiffType>('two-way');
  const { theme } = useTheme();

  const handleCompare = () => {
    setLoading(true);
    
    // Use setTimeout to prevent UI freeze on large texts
    setTimeout(() => {
      if (diffType === 'three-way') {
        const result = computeThreeWayDiff(baseText, leftText, rightText, diffMode);
        setThreeWayResult(result);
        setDiffResult(null);
      } else {
        const result = computeDiff(leftText, rightText, diffMode);
        setDiffResult(result);
        setThreeWayResult(null);
      }
      setLoading(false);
    }, 0);
  };

  const handleReset = () => {
    setLeftText('');
    setRightText('');
    setBaseText('');
    setDiffResult(null);
    setThreeWayResult(null);
  };

  const toggleDiffType = () => {
    setDiffType(diffType === 'two-way' ? 'three-way' : 'two-way');
    setDiffResult(null);
    setThreeWayResult(null);
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-[95%] mx-auto">
      {/* Diff Type and View Mode Controls */}
      <div className={`
        p-4 rounded-xl border flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between
        ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
      `}>
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Diff Type Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Mode:</span>
            <button
              onClick={toggleDiffType}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                ${diffType === 'two-way'
                  ? theme === 'dark' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-blue-100 text-blue-800'
                  : theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gray-200 hover:bg-gray-300'
                }
              `}
            >
              <Split size={16} />
              2-Way Diff
            </button>
            <button
              onClick={toggleDiffType}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                ${diffType === 'three-way'
                  ? theme === 'dark' 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-purple-100 text-purple-800'
                  : theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gray-200 hover:bg-gray-300'
                }
              `}
            >
              <GitMerge size={16} />
              3-Way Merge
            </button>
          </div>
        </div>

        {/* View Mode Selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">View:</span>
          {(['split', 'inline', 'compact'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`
                px-3 py-1.5 rounded text-sm font-medium transition-all capitalize
                ${viewMode === mode
                  ? theme === 'dark'
                    ? 'bg-sky-600 text-white'
                    : 'bg-sky-100 text-sky-800'
                  : theme === 'dark'
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gray-200 hover:bg-gray-300'
                }
              `}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      <InputSection
        leftText={leftText}
        rightText={rightText}
        baseText={baseText}
        setLeftText={setLeftText}
        setRightText={setRightText}
        setBaseText={setBaseText}
        onCompare={handleCompare}
        onReset={handleReset}
        loading={loading}
        diffType={diffType}
      />
      
      {loading && (
        <div className={`
          flex flex-col items-center justify-center p-8 rounded-lg border shadow-lg
          ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}
        `}>
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-sky-500 mb-4" />
            <div className="absolute inset-0 rounded-full animate-ping bg-sky-400 opacity-20"></div>
          </div>
          <p className="text-lg font-medium">
            Processing {diffType === 'three-way' ? '3-way merge' : 'diff comparison'}...
          </p>
          <p className="text-sm text-gray-500 mt-2">This may take a moment for large files</p>
        </div>
      )}
      
      {!loading && (diffResult || threeWayResult) && (
        <ResultSection 
          diffResult={diffResult} 
          threeWayResult={threeWayResult}
          viewMode={viewMode}
          diffType={diffType}
        />
      )}
    </div>
  );
};

export default DiffChecker;