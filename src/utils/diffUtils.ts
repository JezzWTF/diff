export type DiffType = 'added' | 'removed' | 'unchanged' | 'modified';

export interface DiffLine {
  content: string;
  type: DiffType;
}

export interface DiffPair {
  left: DiffLine | null;
  right: DiffLine | null;
}

export interface DiffResult {
  lines: DiffPair[];
  stats: {
    additions: number;
    deletions: number;
    modifications: number;
  };
}

export function computeDiff(leftText: string, rightText: string): DiffResult {
  const leftLines = leftText.split('\n');
  const rightLines = rightText.split('\n');
  
  // Compute LCS matrix
  const lcs = computeLCSMatrix(leftLines, rightLines);
  
  // Backtrack to get the diff
  const diffPairs: DiffPair[] = [];
  let additions = 0;
  let deletions = 0;
  let modifications = 0;
  
  let i = leftLines.length;
  let j = rightLines.length;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && leftLines[i - 1] === rightLines[j - 1]) {
      // Lines are the same
      diffPairs.unshift({
        left: { content: leftLines[i - 1], type: 'unchanged' },
        right: { content: rightLines[j - 1], type: 'unchanged' }
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
      // Addition
      additions++;
      diffPairs.unshift({
        left: null,
        right: { content: rightLines[j - 1], type: 'added' }
      });
      j--;
    } else if (i > 0 && (j === 0 || lcs[i][j - 1] < lcs[i - 1][j])) {
      // Deletion
      deletions++;
      diffPairs.unshift({
        left: { content: leftLines[i - 1], type: 'removed' },
        right: null
      });
      i--;
    }
  }
  
  // Post-processing to identify modifications
  const processedDiffPairs: DiffPair[] = [];
  
  for (let i = 0; i < diffPairs.length; i++) {
    const current = diffPairs[i];
    
    // Check if this is a potential modification
    if (current.left?.type === 'removed' && diffPairs[i + 1]?.right?.type === 'added') {
      // This is a potential modification
      const similarity = calculateSimilarity(
        current.left.content,
        diffPairs[i + 1].right!.content
      );
      
      if (similarity > 0.5) {
        // Consider it a modification
        modifications++;
        deletions--;
        additions--;
        
        processedDiffPairs.push({
          left: { ...current.left, type: 'modified' },
          right: { ...diffPairs[i + 1].right!, type: 'modified' }
        });
        
        i++; // Skip the next pair since we've processed it
      } else {
        processedDiffPairs.push(current);
      }
    } else {
      processedDiffPairs.push(current);
    }
  }
  
  return {
    lines: processedDiffPairs,
    stats: {
      additions,
      deletions,
      modifications
    }
  };
}

function computeLCSMatrix(leftLines: string[], rightLines: string[]): number[][] {
  const matrix: number[][] = Array(leftLines.length + 1)
    .fill(null)
    .map(() => Array(rightLines.length + 1).fill(0));
  
  for (let i = 1; i <= leftLines.length; i++) {
    for (let j = 1; j <= rightLines.length; j++) {
      if (leftLines[i - 1] === rightLines[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1] + 1;
      } else {
        matrix[i][j] = Math.max(matrix[i - 1][j], matrix[i][j - 1]);
      }
    }
  }
  
  return matrix;
}

function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  
  // Calculate Levenshtein distance
  const distance = levenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);
  
  return 1 - distance / maxLength;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  // Initialize matrix
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }
  
  // Fill matrix
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  
  return matrix[a.length][b.length];
}