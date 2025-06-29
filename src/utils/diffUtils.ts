import * as diffLib from 'diff';

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
  
  // Use the diff library to compute line-level differences
  const diffResult = diffLib.diffLines(leftText, rightText);
  
  const diffPairs: DiffPair[] = [];
  let additions = 0;
  let deletions = 0;
  let modifications = 0;
  
  let leftIndex = 0;
  let rightIndex = 0;
  
  // Process the diff result and convert to our DiffPair format
  for (const part of diffResult) {
    const lines = part.value.split('\n');
    // Remove empty line at the end if the last character was a newline
    if (lines.length > 0 && part.value.endsWith('\n')) {
      lines.pop();
    }
    
    if (part.added) {
      // Added lines
      additions += lines.length;
      for (const line of lines) {
        diffPairs.push({
          left: null,
          right: { content: line, type: 'added' }
        });
        rightIndex++;
      }
    } else if (part.removed) {
      // Removed lines
      deletions += lines.length;
      for (const line of lines) {
        diffPairs.push({
          left: { content: line, type: 'removed' },
          right: null
        });
        leftIndex++;
      }
    } else {
      // Unchanged lines
      for (const line of lines) {
        diffPairs.push({
          left: { content: line, type: 'unchanged' },
          right: { content: line, type: 'unchanged' }
        });
        leftIndex++;
        rightIndex++;
      }
    }
  }
  
  // Process potential modifications (adjacent removed and added lines)
  const processedDiffPairs: DiffPair[] = [];
  
  for (let i = 0; i < diffPairs.length; i++) {
    const current = diffPairs[i];
    
    if (current.left?.type === 'removed' && i + 1 < diffPairs.length && diffPairs[i + 1]?.right?.type === 'added') {
      const similarity = calculateSimilarity(
        current.left.content,
        diffPairs[i + 1].right!.content
      );
      
      if (similarity > 0.5) {
        // These lines are similar enough to be considered a modification
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

function findCharacterChanges(oldStr: string, newStr: string): {
  left: { start: number; end: number; }[];
  right: { start: number; end: number; }[];
} {
  // Use the diff library for character-level diffs
  const changes = diffLib.diffChars(oldStr, newStr);
  
  const result = {
    left: [] as { start: number; end: number; }[],
    right: [] as { start: number; end: number; }[]
  };
  
  let leftPos = 0;
  let rightPos = 0;
  
  for (const part of changes) {
    if (part.added) {
      // Added content in the right string
      result.right.push({
        start: rightPos,
        end: rightPos + part.value.length
      });
      rightPos += part.value.length;
    } else if (part.removed) {
      // Removed content from the left string
      result.left.push({
        start: leftPos,
        end: leftPos + part.value.length
      });
      leftPos += part.value.length;
    } else {
      // Unchanged content
      leftPos += part.value.length;
      rightPos += part.value.length;
    }
  }
  
  return result;
}

function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  
  // Use the diff library to calculate similarity
  const changes = diffLib.diffChars(a, b);
  
  let changeLengthSum = 0;
  for (const part of changes) {
    if (part.added || part.removed) {
      changeLengthSum += part.value.length;
    }
  }
  
  const maxLength = Math.max(a.length, b.length);
  return 1 - changeLengthSum / (2 * maxLength);
}