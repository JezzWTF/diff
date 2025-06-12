import React from 'react';
import type { DiffHunk } from '../../types/diff-viewer-types';
import { LineDisplay } from './LineDisplay';

interface HunkDisplayProps {
  hunk: DiffHunk;
}

export const HunkDisplay: React.FC<HunkDisplayProps> = ({ hunk }) => {
  return (
    <div className="my-2 sm:my-3">
      <div className="bg-gray-700 text-cyan-400 p-1.5 sm:p-2 px-3 sm:px-4 font-mono text-xs sm:text-sm select-none sticky top-0 z-10">
        {hunk.header}
      </div>
      <div className="bg-gray-800 bg-opacity-50">
        {hunk.lines.map((line, index) => (
          <LineDisplay key={index} line={line} />
        ))}
      </div>
    </div>
  );
};
