import React, { useState } from 'react';
import InputSection from './InputSection';
import ResultSection from './ResultSection';
import { computeDiff, DiffResult } from '../utils/diffUtils';
import { Loader2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const DiffChecker: React.FC = () => {
  const [leftText, setLeftText] = useState<string>('');
  const [rightText, setRightText] = useState<string>('');
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const { theme } = useTheme();

  const handleCompare = () => {
    setLoading(true);
    
    // Use setTimeout to prevent UI freeze on large texts
    setTimeout(() => {
      const result = computeDiff(leftText, rightText);
      setDiffResult(result);
      setLoading(false);
    }, 0);
  };

  const handleReset = () => {
    setLeftText('');
    setRightText('');
    setDiffResult(null);
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-[95%] mx-auto">
      <InputSection
        leftText={leftText}
        rightText={rightText}
        setLeftText={setLeftText}
        setRightText={setRightText}
        onCompare={handleCompare}
        onReset={handleReset}
        loading={loading}
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
          <p className="text-lg font-medium">Processing diff comparison...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a moment for large files</p>
        </div>
      )}
      
      {!loading && diffResult && (
        <ResultSection diffResult={diffResult} />
      )}
    </div>
  );
};

export default DiffChecker;