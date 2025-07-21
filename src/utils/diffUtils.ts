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
  metadata?: {
    algorithm: string;
    processingTime: number;
  };
}

// Three-way diff types
export type ThreeWayDiffType = 'conflict' | 'left-only' | 'right-only' | 'base-only' | 'resolved' | 'unchanged';

export interface ThreeWayDiffLine {
  content: string;
  type: ThreeWayDiffType;
  conflictId?: string;
}

export interface ThreeWayDiffSection {
  base: ThreeWayDiffLine | null;
  left: ThreeWayDiffLine | null;
  right: ThreeWayDiffLine | null;
}

export interface ThreeWayDiffResult {
  sections: ThreeWayDiffSection[];
  conflicts: number;
  stats: {
    leftChanges: number;
    rightChanges: number;
    conflicts: number;
    resolved: number;
  };
  metadata?: {
    algorithm: string;
    processingTime: number;
  };
}

export function computeDiff(leftText: string, rightText: string, diffMode: string = 'lines'): DiffResult {
  const startTime = performance.now();
  
  // Choose the appropriate diff algorithm based on diffMode
  let diffResult: diffLib.Change[];
  let algorithmName: string;

  switch (diffMode) {
    case 'words':
      diffResult = diffLib.diffWordsWithSpace(leftText, rightText);
      algorithmName = 'Word-by-Word';
      break;
    case 'chars':
      diffResult = diffLib.diffChars(leftText, rightText);
      algorithmName = 'Character-by-Character';
      break;
    case 'lines':
    default:
      diffResult = diffLib.diffLines(leftText, rightText);
      algorithmName = 'Line-by-Line';
      break;
  }
  
  const diffPairs: DiffPair[] = [];
  let additions = 0;
  let deletions = 0;
  let modifications = 0;
  
  
  // Process the diff result and convert to our DiffPair format
  for (const part of diffResult) {
    // For word and character diffs, we need to handle them differently
    if (diffMode === 'words' || diffMode === 'chars') {
      if (part.added) {
        additions++;
        diffPairs.push({
          left: null,
          right: { content: part.value, type: 'added' }
        });
      } else if (part.removed) {
        deletions++;
        diffPairs.push({
          left: { content: part.value, type: 'removed' },
          right: null
        });
      } else {
        diffPairs.push({
          left: { content: part.value, type: 'unchanged' },
          right: { content: part.value, type: 'unchanged' }
        });
      }
    } else {
      // Line-based diff (original logic)
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
        }
      } else if (part.removed) {
        // Removed lines
        deletions += lines.length;
        for (const line of lines) {
          diffPairs.push({
            left: { content: line, type: 'removed' },
            right: null
          });
        }
      } else {
        // Unchanged lines
        for (const line of lines) {
          diffPairs.push({
            left: { content: line, type: 'unchanged' },
            right: { content: line, type: 'unchanged' }
          });
        }
      }
    }
  }
  
  // Process potential modifications (only for line-based diffs)
  const processedDiffPairs: DiffPair[] = [];
  
  if (diffMode === 'lines') {
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
  } else {
    // For word and character diffs, use the pairs as-is
    processedDiffPairs.push(...diffPairs);
  }
  
  const endTime = performance.now();
  
  return {
    lines: processedDiffPairs,
    stats: {
      additions,
      deletions,
      modifications
    },
    metadata: {
      algorithm: algorithmName,
      processingTime: endTime - startTime
    }
  };
}

export function computeThreeWayDiff(
  baseText: string, 
  leftText: string, 
  rightText: string, 
  diffMode: string = 'lines'
): ThreeWayDiffResult {
  const startTime = performance.now();
  
  // Split texts into arrays based on diff mode
  const baseItems = diffMode === 'lines' ? baseText.split('\n') : 
                   diffMode === 'words' ? baseText.split(/\s+/) : 
                   baseText.split('');
  const leftItems = diffMode === 'lines' ? leftText.split('\n') : 
                   diffMode === 'words' ? leftText.split(/\s+/) : 
                   leftText.split('');
  const rightItems = diffMode === 'lines' ? rightText.split('\n') : 
                    diffMode === 'words' ? rightText.split(/\s+/) : 
                    rightText.split('');
  
  const sections: ThreeWayDiffSection[] = [];
  let conflicts = 0;
  let leftChanges = 0;
  let rightChanges = 0;
  let resolved = 0;
  
  // Simple three-way merge approach
  let baseIndex = 0;
  let leftIndex = 0;
  let rightIndex = 0;
  
  while (baseIndex < baseItems.length || leftIndex < leftItems.length || rightIndex < rightItems.length) {
    const baseItem = baseIndex < baseItems.length ? baseItems[baseIndex] : undefined;
    const leftItem = leftIndex < leftItems.length ? leftItems[leftIndex] : undefined;
    const rightItem = rightIndex < rightItems.length ? rightItems[rightIndex] : undefined;
    
    // All three are the same or at least base matches both
    if (baseItem !== undefined && baseItem === leftItem && baseItem === rightItem) {
      sections.push({
        base: { content: baseItem, type: 'unchanged' },
        left: { content: leftItem!, type: 'unchanged' },
        right: { content: rightItem!, type: 'unchanged' }
      });
      baseIndex++;
      leftIndex++;
      rightIndex++;
    }
    // Base matches left, but right is different
    else if (baseItem !== undefined && baseItem === leftItem && baseItem !== rightItem) {
      if (rightItem !== undefined) {
        // Right changed the line
        sections.push({
          base: { content: baseItem, type: 'unchanged' },
          left: { content: leftItem!, type: 'unchanged' },
          right: { content: rightItem, type: 'right-only' }
        });
        rightChanges++;
        baseIndex++;
        leftIndex++;
        rightIndex++;
      } else {
        // Right removed the line
        sections.push({
          base: { content: baseItem, type: 'base-only' },
          left: { content: leftItem!, type: 'unchanged' },
          right: null
        });
        rightChanges++;
        baseIndex++;
        leftIndex++;
      }
    }
    // Base matches right, but left is different  
    else if (baseItem !== undefined && baseItem === rightItem && baseItem !== leftItem) {
      if (leftItem !== undefined) {
        // Left changed the line
        sections.push({
          base: { content: baseItem, type: 'unchanged' },
          left: { content: leftItem, type: 'left-only' },
          right: { content: rightItem!, type: 'unchanged' }
        });
        leftChanges++;
        baseIndex++;
        leftIndex++;
        rightIndex++;
      } else {
        // Left removed the line
        sections.push({
          base: { content: baseItem, type: 'base-only' },
          left: null,
          right: { content: rightItem!, type: 'unchanged' }
        });
        leftChanges++;
        baseIndex++;
        rightIndex++;
      }
    }
    // Left and right are the same but different from base
    else if (leftItem !== undefined && rightItem !== undefined && leftItem === rightItem && leftItem !== baseItem) {
      // Both sides made the same change - resolved
      sections.push({
        base: baseItem ? { content: baseItem, type: 'base-only' } : null,
        left: { content: leftItem, type: 'resolved' },
        right: { content: rightItem, type: 'resolved' }
      });
      resolved++;
      if (baseItem !== undefined) baseIndex++;
      leftIndex++;
      rightIndex++;
    }
    // Only left has content (insertion)
    else if (leftItem !== undefined && rightItem === undefined && baseItem === undefined) {
      sections.push({
        base: null,
        left: { content: leftItem, type: 'left-only' },
        right: null
      });
      leftChanges++;
      leftIndex++;
    }
    // Only right has content (insertion)
    else if (rightItem !== undefined && leftItem === undefined && baseItem === undefined) {
      sections.push({
        base: null,
        left: null,
        right: { content: rightItem, type: 'right-only' }
      });
      rightChanges++;
      rightIndex++;
    }
    // Conflict - all three different or complex case
    else {
      // Check if this is a proper conflict (base differs from left OR right, AND left differs from right)
      const isConflict = (baseItem !== leftItem || baseItem !== rightItem) && leftItem !== rightItem;
      
      if (isConflict) {
        conflicts++;
        const conflictId = `conflict-${conflicts}`;
        
        sections.push({
          base: baseItem ? { content: baseItem, type: 'conflict', conflictId } : null,
          left: leftItem ? { content: leftItem, type: 'conflict', conflictId } : null,
          right: rightItem ? { content: rightItem, type: 'conflict', conflictId } : null
        });
      } else {
        // Not a conflict, handle as regular change
        if (baseItem === leftItem && rightItem !== undefined) {
          sections.push({
            base: { content: baseItem!, type: 'unchanged' },
            left: { content: leftItem!, type: 'unchanged' },
            right: { content: rightItem, type: 'right-only' }
          });
          rightChanges++;
        } else if (baseItem === rightItem && leftItem !== undefined) {
          sections.push({
            base: { content: baseItem!, type: 'unchanged' },
            left: { content: leftItem, type: 'left-only' },
            right: { content: rightItem!, type: 'unchanged' }
          });
          leftChanges++;
        }
      }
      
      if (baseItem !== undefined) baseIndex++;
      if (leftItem !== undefined) leftIndex++;
      if (rightItem !== undefined) rightIndex++;
    }
  }
  
  const endTime = performance.now();
  
  return {
    sections,
    conflicts,
    stats: {
      leftChanges,
      rightChanges,
      conflicts,
      resolved
    },
    metadata: {
      algorithm: `3-Way Merge (${diffMode})`,
      processingTime: endTime - startTime
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