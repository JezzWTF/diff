import type { ParsedDiff, FileDiff, DiffHunk, DiffLine } from '../types/diff-viewer-types';
import * as diffLib from 'diff';

// Constants for large file detection
const LARGE_FILE_THRESHOLD = 400; // Lines changed
const LARGE_FILE_HUNK_THRESHOLD = 20; // Number of hunks

// Helper function to normalize git diff paths
function normalizePath(path: string): string {
  if (path === '/dev/null') return path;
  if (path.startsWith('a/')) return path.substring(2);
  if (path.startsWith('b/')) return path.substring(2);
  return path;
}

export function parseDiff(diffContent: string): ParsedDiff {
  // For git-style unified diffs, we'll use the built-in parsePatch method
  // which handles the complex parsing of git diff format
  const parsedPatches = diffLib.parsePatch(diffContent);
  const files: ParsedDiff = [];
  
  for (const patch of parsedPatches) {
    // Normalize paths for proper comparison
    const normalizedOldPath = normalizePath(patch.oldFileName);
    const normalizedNewPath = normalizePath(patch.newFileName);
    
    const fileDiff: FileDiff = {
      oldPath: patch.oldFileName,
      newPath: patch.newFileName,
      isNewFile: patch.oldFileName === '/dev/null',
      isDeletedFile: patch.newFileName === '/dev/null',
      isRenamed: normalizedOldPath !== normalizedNewPath && 
                normalizedOldPath !== '/dev/null' && 
                normalizedNewPath !== '/dev/null',
      hunks: [],
      headerLines: [],
      fileMetaLines: []
    };
    
    // Detect if this is a markdown file
    const filePath = fileDiff.newPath || fileDiff.oldPath;
    fileDiff.isMarkdown = /\.md$/i.test(filePath);
    
    // Extract header lines from the diff
    const diffLines = diffContent.split('\n');
    let headerStartIndex = -1;
    
    // Find the start of this file's diff section
    // Look for the diff --git line that matches this file
    for (let i = 0; i < diffLines.length; i++) {
      const line = diffLines[i];
      if (line.startsWith('diff --git')) {
        // Check if this diff line is for our current file
        // For new files: diff --git /dev/null b/path/to/file.ext
        // For deleted files: diff --git a/path/to/file.ext /dev/null
        // For renamed files: diff --git a/oldpath b/newpath
        if (line.includes(patch.oldFileName) || line.includes(patch.newFileName)) {
          headerStartIndex = i;
          break;
        }
      }
    }
    
    if (headerStartIndex >= 0) {
      // Extract header lines
      let i = headerStartIndex;
      while (i < diffLines.length && !diffLines[i].startsWith('--- ')) {
        fileDiff.headerLines.push(diffLines[i]);
        
        // Parse additional information
        if (diffLines[i].startsWith('new file mode ')) {
          fileDiff.isNewFile = true;
          const match = diffLines[i].match(/new file mode (\d+)/);
          if (match) fileDiff.fileModeChange = { oldMode: '', newMode: match[1] };
        } else if (diffLines[i].startsWith('deleted file mode ')) {
          fileDiff.isDeletedFile = true;
          const match = diffLines[i].match(/deleted file mode (\d+)/);
          if (match) fileDiff.fileModeChange = { oldMode: match[1], newMode: '' };
        } else if (diffLines[i].startsWith('old mode ')) {
          const match = diffLines[i].match(/old mode (\d+)/);
          if (match && fileDiff.fileModeChange) fileDiff.fileModeChange.oldMode = match[1];
          else if (match) fileDiff.fileModeChange = {oldMode: match[1], newMode: ''};
        } else if (diffLines[i].startsWith('new mode ')) {
          const match = diffLines[i].match(/new mode (\d+)/);
          if (match && fileDiff.fileModeChange) fileDiff.fileModeChange.newMode = match[1];
          else if (match) fileDiff.fileModeChange = {oldMode: '', newMode: match[1]};
        } else if (diffLines[i].startsWith('similarity index ')) {
          fileDiff.similarityIndex = diffLines[i].substring('similarity index '.length);
        } else if (diffLines[i].startsWith('Binary files ')) {
          fileDiff.isBinary = true;
        } else if (diffLines[i].startsWith('rename from ') || diffLines[i].startsWith('rename to ')) {
          // Additional confirmation of rename
          fileDiff.isRenamed = true;
        }
        
        i++;
      }
      
      // Extract file meta lines
      while (i < diffLines.length && !diffLines[i].startsWith('@@ ')) {
        if (diffLines[i].startsWith('--- ') || diffLines[i].startsWith('+++ ')) {
          fileDiff.fileMetaLines.push(diffLines[i]);
        }
        i++;
      }
    } else {
      // Debug: If we can't find the header, let's see what we have
      console.warn('Could not find header for file:', {
        oldPath: patch.oldFileName,
        newPath: patch.newFileName,
        diffLines: diffLines.slice(0, 10) // First 10 lines for debugging
      });
    }
    
    // Convert hunks from diff library format to our format
    for (const hunk of patch.hunks) {
      const diffHunk: DiffHunk = {
        oldStartLine: hunk.oldStart,
        oldLineCount: hunk.oldLines,
        newStartLine: hunk.newStart,
        newLineCount: hunk.newLines,
        header: `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@`,
        lines: []
      };
      
      let oldLineNumber = hunk.oldStart;
      let newLineNumber = hunk.newStart;
      
      for (const line of hunk.lines) {
        const diffLine: DiffLine = {
          text: line,
          content: line.substring(1),
          type: 'context' // Default
        };
        
        if (line.startsWith('+')) {
          diffLine.type = 'add';
          diffLine.newLineNumber = newLineNumber++;
        } else if (line.startsWith('-')) {
          diffLine.type = 'delete';
          diffLine.oldLineNumber = oldLineNumber++;
        } else if (line.startsWith(' ')) {
          diffLine.type = 'context';
          diffLine.oldLineNumber = oldLineNumber++;
          diffLine.newLineNumber = newLineNumber++;
        } else if (line.startsWith('\\')) {
          diffLine.type = 'context';
          diffLine.content = line; // Keep the backslash for display
        }
        
        diffHunk.lines.push(diffLine);
      }
      
      fileDiff.hunks.push(diffHunk);
    }
    
    // Calculate total changes and determine if this is a large file
    const totalAdditions = fileDiff.hunks.reduce((sum, hunk) => 
      sum + hunk.lines.filter(l => l.type === 'add').length, 0);
    const totalDeletions = fileDiff.hunks.reduce((sum, hunk) => 
      sum + hunk.lines.filter(l => l.type === 'delete').length, 0);
    
    fileDiff.totalChanges = totalAdditions + totalDeletions;
    fileDiff.isLargeFile = fileDiff.totalChanges > LARGE_FILE_THRESHOLD || 
                          fileDiff.hunks.length > LARGE_FILE_HUNK_THRESHOLD;
    
    files.push(fileDiff);
  }
  
  return files;
}
