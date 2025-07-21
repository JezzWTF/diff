import React, { useState, useCallback, useRef, DragEvent } from 'react';
import { parseDiff } from '../services/diffParser';
import type { ParsedDiff } from '../types/diff-viewer-types';
import { DiffDisplay } from '../components/diff-viewer/DiffDisplay';
import { UploadIcon, CogIcon, ExclamationTriangleIcon } from '../components/diff-viewer/Icons';
import { useTheme } from '../context/useTheme';

const DiffViewerPage: React.FC = () => {
  const { theme } = useTheme();
  const dropAreaRef = useRef<HTMLDivElement>(null);

  const [diffText, setDiffText] = useState<string>('');
  const [parsedDiff, setParsedDiff] = useState<ParsedDiff | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const processFile = (file: File) => {
    if (file) {
      setFileName(file.name);
      setIsLoading(true);
      setError(null);
      setParsedDiff(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setDiffText(text);
        try {
          const parsed = parseDiff(text);
          setParsedDiff(parsed);
          if (parsed.length === 0 && text.trim().length > 0) {
            setError("No parsable diff sections found. Ensure the format is a standard unified diff.");
          }
        } catch (err: unknown) {
          console.error("Diff parsing error:", err);
          let message = 'Unknown error';
          if (err instanceof Error) {
            message = err.message;
          } else if (typeof err === 'string') {
            message = err;
          }
          setError(`Error parsing diff: ${message}`);
          setParsedDiff(null);
        } finally {
          setIsLoading(false);
        }
      };
      reader.onerror = () => {
        setError("Failed to read file.");
        setParsedDiff(null);
        setIsLoading(false);
      };
      reader.readAsText(file);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only set isDragging to false if we're leaving the drop area
    // and not entering a child element
    if (dropAreaRef.current && !dropAreaRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // Check if the file is a diff or patch file
      if (file.name.endsWith('.diff') || file.name.endsWith('.patch')) {
        processFile(file);
      } else {
        setError("Please upload only .diff or .patch files.");
      }
    }
  };

  const handleParseFromTextArea = useCallback(() => {
    if (!diffText.trim()) {
      setError("No diff content to parse. Please paste a diff or upload a file.");
      setParsedDiff(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    setParsedDiff(null);
    setFileName('Pasted Content');

    setTimeout(() => {
      try {
        const parsed = parseDiff(diffText);
        setParsedDiff(parsed);
        if (parsed.length === 0 && diffText.trim().length > 0) {
          setError("No parsable diff sections found. Ensure the format is a standard unified diff.");
        }
      } catch (err: unknown) {
        console.error("Diff parsing error:", err);
        let message = 'Unknown error';
        if (err instanceof Error) {
          message = err.message;
        } else if (typeof err === 'string') {
          message = err;
        }
        setError(`Error parsing diff: ${message}`);
        setParsedDiff(null);
      } finally {
        setIsLoading(false);
      }
    }, 50);
  }, [diffText]);

  return (
    <div className="flex flex-col gap-8">
      <div className={`p-6 rounded-xl shadow-2xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="file-upload" className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Upload a file (.diff, .patch)
            </label>
            <div 
              ref={dropAreaRef}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors 
                ${isDragging ? 'border-sky-500 bg-sky-50 dark:bg-sky-900 dark:bg-opacity-20' : ''} 
                ${theme === 'dark' ? 'border-gray-600 bg-gray-800 hover:border-sky-500' : 'border-gray-300 bg-white hover:border-sky-500'}`}
            >
              <div className="space-y-1 text-center">
                <UploadIcon className={`mx-auto h-12 w-12 ${isDragging ? 'text-sky-500' : theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`} />
                <div className={`flex flex-col text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  <div className="flex items-center justify-center">
                    <label
                      htmlFor="file-upload"
                      className={`relative cursor-pointer rounded-md font-medium hover:text-sky-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-white focus-within:ring-sky-500 ${theme === 'dark' ? 'text-sky-400' : 'text-sky-600'}`}
                    >
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".diff,.patch" />
                    </label>
                    <p className={`ml-1 text-xs ${theme === 'dark' ? 'text-gray-500' : 'text-gray-600'}`}>(.diff, .patch files)</p>
                  </div>
                  <p className={`text-xs mt-2 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                    or drag and drop file here
                  </p>
                  {fileName && <p className="text-xs text-green-400 mt-1">Loaded: {fileName}</p>}
                </div>
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="diff-textarea" className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Or paste diff content
            </label>
            <textarea
              id="diff-textarea"
              rows={8}
              className={`block w-full border rounded-md shadow-sm p-3 text-sm focus:ring-sky-500 focus:border-sky-500 placeholder-gray-500 ${theme === 'dark' ? 'bg-gray-900 border-gray-700 text-gray-200' : 'bg-white border-gray-300 text-gray-900'}`}
              placeholder="Paste diff content here..."
              value={diffText}
              onChange={(e) => setDiffText(e.target.value)}
            />
            <button
              onClick={handleParseFromTextArea}
              disabled={isLoading}
              className={`mt-3 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white focus:ring-sky-500 disabled:opacity-50 ${theme === 'dark' ? 'bg-sky-600 hover:bg-sky-700 text-white' : 'bg-sky-600 hover:bg-sky-700 text-white'}`}
            >
              <CogIcon className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Parse Pasted Content
            </button>
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="text-center py-10">
          <CogIcon className="h-12 w-12 text-sky-500 animate-spin mx-auto" />
          <p className="mt-2 text-lg">Parsing diff...</p>
        </div>
      )}

      {error && (
        <div className={`rounded-lg relative mb-6 px-4 py-3 border text-red-300 bg-red-800 bg-opacity-50 border-red-700`} role="alert">
          <div className="flex">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-400 mr-3 shrink-0" />
            <div>
              <strong className="font-bold">Error:</strong>
              <span className="block sm:inline ml-1">{error}</span>
            </div>
          </div>
        </div>
      )}

      {parsedDiff && parsedDiff.length > 0 && (
        <DiffDisplay parsedDiff={parsedDiff} />
      )}

      {parsedDiff && parsedDiff.length === 0 && !isLoading && !error && diffText.trim().length > 0 && (
        <div className="text-center py-10 rounded-lg bg-yellow-500 bg-opacity-20">
          <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto" />
          <p className="mt-2 text-lg">No diff changes found in the provided content.</p>
          <p className="text-sm">The content was processed, but it seems to contain no standard diff sections.</p>
        </div>
      )}
    </div>
  );
};

export default DiffViewerPage;
