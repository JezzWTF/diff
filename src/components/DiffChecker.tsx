import React, { useState } from 'react';
import InputSection from './InputSection';
import ResultSection from './ResultSection';
import { computeDiff, DiffResult } from '../utils/diffUtils';

const DiffChecker: React.FC = () => {
  const [leftText, setLeftText] = useState<string>('');
  const [rightText, setRightText] = useState<string>('');
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

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
    <div className="flex flex-col gap-8">
      <InputSection
        leftText={leftText}
        rightText={rightText}
        setLeftText={setLeftText}
        setRightText={setRightText}
        onCompare={handleCompare}
        onReset={handleReset}
        loading={loading}
      />
      
      {diffResult && (
        <ResultSection diffResult={diffResult} />
      )}
    </div>
  );
};

export default DiffChecker;