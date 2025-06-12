import type { ParsedDiff, FileDiff, DiffHunk, DiffLine } from '../types/diff-viewer-types';

export function parseDiff(diffContent: string): ParsedDiff {
  const files: ParsedDiff = [];
  const lines = diffContent.split('\n');
  let i = 0;

  while (i < lines.length) {
    let currentFile: Partial<FileDiff> = { hunks: [], headerLines: [], fileMetaLines: [] };
    let inHeader = true;

    // Find start of a file diff section
    // Common start: "diff --git a/... b/..."
    // Alternative start: "--- a/..."
    let fileStartIndex = i;
    while (i < lines.length && !lines[i].startsWith('diff --git') && !lines[i].startsWith('--- ')) {
      i++; // Skip lines that are not starting a diff section
    }
    if (i >= lines.length) break; // End of content

    fileStartIndex = i; // Mark the actual start of a potential file section

    // 1. Parse 'diff --git' and subsequent header lines
    if (lines[i].startsWith('diff --git')) {
      currentFile.headerLines?.push(lines[i]);
      i++;
      while (i < lines.length && !lines[i].startsWith('--- ') && !lines[i].startsWith('Binary files ')) {
        if (lines[i].startsWith('new file mode ')) {
          currentFile.isNewFile = true;
          // Example: new file mode 100644
          const match = lines[i].match(/new file mode (\d+)/);
          if (match) currentFile.fileModeChange = { oldMode: '', newMode: match[1] };
        } else if (lines[i].startsWith('deleted file mode ')) {
          currentFile.isDeletedFile = true;
           const match = lines[i].match(/deleted file mode (\d+)/);
          if (match) currentFile.fileModeChange = { oldMode: match[1], newMode: '' };
        } else if (lines[i].startsWith('old mode ')) {
           const match = lines[i].match(/old mode (\d+)/);
           if (match && currentFile.fileModeChange) currentFile.fileModeChange.oldMode = match[1];
           else if (match) currentFile.fileModeChange = {oldMode: match[1], newMode: ''};
        } else if (lines[i].startsWith('new mode ')) {
           const match = lines[i].match(/new mode (\d+)/);
           if (match && currentFile.fileModeChange) currentFile.fileModeChange.newMode = match[1];
           else if (match) currentFile.fileModeChange = {oldMode: '', newMode: match[1]};
        } else if (lines[i].startsWith('similarity index ')) {
            currentFile.similarityIndex = lines[i].substring('similarity index '.length);
        }
        // Add other git header parsers here (index, rename from/to etc.)
        currentFile.headerLines?.push(lines[i]);
        i++;
      }
    }
    
    // Handle binary files separately
    if (i < lines.length && lines[i].startsWith('Binary files ')) {
        // Example: Binary files a/image.png and b/image.png differ
        const binaryMatch = lines[i].match(/Binary files (.*) and (.*) differ/);
        if (binaryMatch) {
            currentFile.oldPath = binaryMatch[1].startsWith('a/') ? binaryMatch[1] : `a/${binaryMatch[1]}`;
            currentFile.newPath = binaryMatch[2].startsWith('b/') ? binaryMatch[2] : `b/${binaryMatch[2]}`;
            currentFile.isBinary = true;
            currentFile.hunks = []; // No hunks for binary files in this parser
            files.push(currentFile as FileDiff);
            i++;
            continue;
        }
    }


    // 2. Parse '--- a/...' and '+++ b/...'
    if (i < lines.length && lines[i].startsWith('--- ')) {
      currentFile.oldPath = lines[i].substring(4).trim();
      currentFile.fileMetaLines?.push(lines[i]);
      i++;
    } else if (!currentFile.oldPath) {
      // If 'diff --git' was present but no '---', implies new file from /dev/null
      currentFile.oldPath = '/dev/null';
    }

    if (i < lines.length && lines[i].startsWith('+++ ')) {
      currentFile.newPath = lines[i].substring(4).trim();
      currentFile.fileMetaLines?.push(lines[i]);
      i++;
    } else if (!currentFile.newPath) {
       // If '---' was present but no '+++', implies deleted file to /dev/null
      currentFile.newPath = '/dev/null';
    }
    
    // If paths are still undefined, this block is not a valid file diff part
    if (typeof currentFile.oldPath !== 'string' || typeof currentFile.newPath !== 'string') {
        i = fileStartIndex + 1; // Move past the line that initiated this attempt
        continue; 
    }

    currentFile.isNewFile = currentFile.isNewFile || currentFile.oldPath === '/dev/null';
    currentFile.isDeletedFile = currentFile.isDeletedFile || currentFile.newPath === '/dev/null';

    if (!currentFile.isNewFile && !currentFile.isDeletedFile) {
      const oldP = currentFile.oldPath.startsWith('a/') ? currentFile.oldPath.substring(2) : currentFile.oldPath;
      const newP = currentFile.newPath.startsWith('b/') ? currentFile.newPath.substring(2) : currentFile.newPath;
      currentFile.isRenamed = oldP !== newP;
    } else {
      currentFile.isRenamed = false;
    }

    // Capture additional meta lines before hunks
     while (i < lines.length && !lines[i].startsWith('@@ ')) {
        if (lines[i].trim() === '' && i === lines.length -1) {i++; break;} // trailing empty line
        if (lines[i].startsWith('diff --git')) break; // Start of next file
        currentFile.fileMetaLines?.push(lines[i]);
        i++;
    }


    // 3. Parse hunks '@@ -old,len +new,len @@ ...'
    while (i < lines.length && lines[i].startsWith('@@ ')) {
      const hunkHeaderLine = lines[i];
      const hunkHeaderMatch = hunkHeaderLine.match(/^@@ -(\d+)(,(\d+))? \+(\d+)(,(\d+))? @@(.*)/);
      if (!hunkHeaderMatch) {
        // This shouldn't happen if line starts with @@, but good for robustness
        // Or if it's a malformed hunk header, we might skip it or the file.
        break; 
      }

      const hunk: DiffHunk = {
        oldStartLine: parseInt(hunkHeaderMatch[1]),
        oldLineCount: hunkHeaderMatch[3] ? parseInt(hunkHeaderMatch[3]) : 1,
        newStartLine: parseInt(hunkHeaderMatch[4]),
        newLineCount: hunkHeaderMatch[6] ? parseInt(hunkHeaderMatch[6]) : 1,
        header: hunkHeaderLine, // Store full header line
        lines: [],
      };
      // Handle "@@ -0,0 +1 @@" case for oldLineCount (new file)
      if (hunk.oldStartLine === 0 && hunk.oldLineCount === 0) hunk.oldLineCount = 0;
      // Handle "@@ -1 +0,0 @@" case for newLineCount (deleted file)
      if (hunk.newStartLine === 0 && hunk.newLineCount === 0) hunk.newLineCount = 0;


      i++; // Move to first line of hunk content

      let currentOldLineNum = hunk.oldStartLine;
      let currentNewLineNum = hunk.newStartLine;

      while (i < lines.length && (lines[i].startsWith('+') || lines[i].startsWith('-') || lines[i].startsWith(' ') || lines[i].startsWith('\\'))) {
        const lineContent = lines[i];
        const diffLine: Partial<DiffLine> = {
          text: lineContent,
          content: lineContent.substring(1),
        };

        if (lineContent.startsWith('+')) {
          diffLine.type = 'add';
          diffLine.newLineNumber = currentNewLineNum;
          if (hunk.newLineCount > 0) currentNewLineNum++; // Increment only if lines are expected in this part of hunk
        } else if (lineContent.startsWith('-')) {
          diffLine.type = 'delete';
          diffLine.oldLineNumber = currentOldLineNum;
          if (hunk.oldLineCount > 0) currentOldLineNum++;
        } else if (lineContent.startsWith(' ')) {
          diffLine.type = 'context';
          diffLine.oldLineNumber = currentOldLineNum;
          diffLine.newLineNumber = currentNewLineNum;
          if (hunk.oldLineCount > 0) currentOldLineNum++;
          if (hunk.newLineCount > 0) currentNewLineNum++;
        } else if (lineContent.startsWith('\\')) { // "\ No newline at end of file"
          diffLine.type = 'context'; // Treat as context, doesn't affect line counts
          diffLine.content = lineContent; // Keep the backslash for display
        }
        hunk.lines.push(diffLine as DiffLine);
        i++;
      }
      currentFile.hunks?.push(hunk);
    }
    
    // Only add if we have a valid file (defined paths)
    if (currentFile.oldPath && currentFile.newPath) {
         // If no hunks were found but paths exist, it might be a file mode change only or empty file.
        files.push(currentFile as FileDiff);
    } else if (fileStartIndex < i) { // Progress was made but no valid file created
        // This case should be rare if logic above is correct.
        // It means we consumed lines but didn't form a complete FileDiff.
    } else if (fileStartIndex === i) {
        // No progress, stuck on a line. This indicates an issue with outer loop logic or unhandled line type.
        i++; // Force progress to avoid infinite loop on malformed input.
    }
  }
  return files;
}
