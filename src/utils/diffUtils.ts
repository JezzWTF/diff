export type DiffType = 'added' | 'removed' | 'unchanged' | 'modified';

export interface DiffLine {
  content: string;
  type: DiffType;
  changes?: {
    start: number;
    end: number;
  }[];
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
  
  const lcs = computeLCSMatrix(leftLines, rightLines);
  const diffPairs: DiffPair[] = [];
  let additions = 0;
  let deletions = 0;
  let modifications = 0;
  
  let i = leftLines.length;
  let j = rightLines.length;
  
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && leftLines[i - 1] === rightLines[j - 1]) {
      diffPairs.unshift({
        left: { content: leftLines[i - 1], type: 'unchanged' },
        right: { content: rightLines[j - 1], type: 'unchanged' }
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || lcs[i][j - 1] >= lcs[i - 1][j])) {
      additions++;
      diffPairs.unshift({
        left: null,
        right: { content: rightLines[j - 1], type: 'added' }
      });
      j--;
    } else if (i > 0 && (j === 0 || lcs[i][j - 1] < lcs[i - 1][j])) {
      deletions++;
      diffPairs.unshift({
        left: { content: leftLines[i - 1], type: 'removed' },
        right: null
      });
      i--;
    }
  }
  
  const processedDiffPairs: DiffPair[] = [];
  
  for (let i = 0; i < diffPairs.length; i++) {
    const current = diffPairs[i];
    
    if (current.left?.type === 'removed' && diffPairs[i + 1]?.right?.type === 'added') {
      const similarity = calculateSimilarity(
        current.left.content,
        diffPairs[i + 1].right!.content
      );
      
      if (similarity > 0.5) {
        modifications++;
        deletions--;
        additions--;
        
        const charChanges = findCharacterChanges(
          current.left.content,
          diffPairs[i + 1].right!.content
        );
        
        processedDiffPairs.push({
          left: { 
            ...current.left, 
            type: 'modified',
            changes: charChanges.left
          },
          right: { 
            ...diffPairs[i + 1].right!, 
            type: 'modified',
            changes: charChanges.right
          }
        });
        
        i++;
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

function findCharacterChanges(oldStr: string, newStr: string): {
  left: { start: number; end: number; }[];
  right: { start: number; end: number; }[];
} {
  const changes = {
    left: [] as { start: number; end: number; }[],
    right: [] as { start: number; end: number; }[]
  };
  
  let start = 0;
  while (start < oldStr.length && start < newStr.length && oldStr[start] === newStr[start]) {
    start++;
  }
  
  let end = 0;
  while (
    end < oldStr.length - start &&
    end < newStr.length - start &&
    oldStr[oldStr.length - 1 - end] === newStr[newStr.length - 1 - end]
  ) {
    end++;
  }
  
  if (start < oldStr.length - end) {
    changes.left.push({
      start,
      end: oldStr.length - end
    });
  }
  
  if (start < newStr.length - end) {
    changes.right.push({
      start,
      end: newStr.length - end
    });
  }
  
  return changes;
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
  
  const distance = levenshteinDistance(a, b);
  const maxLength = Math.max(a.length, b.length);
  
  return 1 - distance / maxLength;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= b.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  return matrix[a.length][b.length];
}