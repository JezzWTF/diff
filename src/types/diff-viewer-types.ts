export interface DiffLine {
  type: 'add' | 'delete' | 'context';
  text: string; // The raw line text from the diff (e.g., "+ added line")
  content: string; // The line content without the +/-/space prefix
  oldLineNumber?: number; // Absolute line number in old file
  newLineNumber?: number; // Absolute line number in new file
}

export interface DiffHunk {
  oldStartLine: number;
  oldLineCount: number;
  newStartLine: number;
  newLineCount: number;
  header: string; // The original "@@ ... @@" line, including trailing context if any
  lines: DiffLine[];
}

export interface FileDiff {
  oldPath: string;
  newPath: string;
  isNewFile: boolean;
  isDeletedFile: boolean;
  isRenamed: boolean;
  isBinary?: boolean; // If "Binary files ... differ"
  fileModeChange?: { oldMode: string; newMode: string };
  similarityIndex?: string; // e.g. "100%"
  hunks: DiffHunk[];
  headerLines: string[]; // Git diff header lines before '---' (e.g., diff --git, index, mode changes)
  fileMetaLines: string[]; // Lines between '---'/'+++' and the first hunk (e.g. similarity index, rename from/to)
}

export type ParsedDiff = FileDiff[];
