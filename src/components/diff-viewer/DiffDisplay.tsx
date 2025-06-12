import React from 'react';
import type { ParsedDiff } from '../../types/diff-viewer-types';
import { FileDiffCard } from './FileDiffCard';

interface DiffDisplayProps {
  parsedDiff: ParsedDiff;
}

export const DiffDisplay: React.FC<DiffDisplayProps> = ({ parsedDiff }) => {
  if (!parsedDiff || parsedDiff.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500">
        <p>No diff content to display, or the diff was empty.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {parsedDiff.map((fileDiff, index) => (
        <FileDiffCard key={`${fileDiff.oldPath}-${fileDiff.newPath}-${index}`} fileDiff={fileDiff} />
      ))}
    </div>
  );
};
