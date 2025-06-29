import React, { useRef } from 'react';
import { Upload, Play, RotateCcw, Loader2 } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import TextArea from './TextArea';

interface InputSectionProps {
  leftText: string;
  rightText: string;
  setLeftText: (text: string) => void;
  setRightText: (text: string) => void;
  onCompare: () => void;
  onReset: () => void;
  loading: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({
  leftText,
  rightText,
  setLeftText,
  setRightText,
  onCompare,
  onReset,
  loading
}) => {
  const { theme } = useTheme();
  const leftFileInputRef = useRef<HTMLInputElement>(null);
  const rightFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (side: 'left' | 'right', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (side === 'left') {
        setLeftText(content);
      } else {
        setRightText(content);
      }
    };
    reader.readAsText(file);
    
    // Reset the input value so the same file can be selected again
    e.target.value = '';
  };

  return (
    <div className="w-full">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col flex-1 gap-2">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Original Text</h3>
              <button
                className={`
                  flex items-center gap-1 px-3 py-1 rounded-md text-sm transition-colors
                  ${theme === 'dark' 
                    ? 'bg-gray-700 hover:bg-gray-600' 
                    : 'bg-gray-200 hover:bg-gray-300'}
                `}
                onClick={() => leftFileInputRef.current?.click()}
              >
                <Upload size={16} />
                <span>Upload</span>
              </button>
              <input
                type="file"
                ref={leftFileInputRef}
                onChange={(e) => handleFileUpload('left', e)}
                className="hidden"
                accept=".txt,.md,.json,.js,.jsx,.ts,.tsx,.html,.css,.yml,.yaml"
              />
            </div>
            <TextArea 
              value={leftText}
              onChange={(e) => setLeftText(e.target.value)}
              placeholder="Paste or type original text here..."
            />
          </div>
          
          <div className="flex flex-col flex-1 gap-2">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Modified Text</h3>
              <button
                className={`
                  flex items-center gap-1 px-3 py-1 rounded-md text-sm transition-colors
                  ${theme === 'dark' 
                    ? 'bg-gray-700 hover:bg-gray-600' 
                    : 'bg-gray-200 hover:bg-gray-300'}
                `}
                onClick={() => rightFileInputRef.current?.click()}
              >
                <Upload size={16} />
                <span>Upload</span>
              </button>
              <input
                type="file"
                ref={rightFileInputRef}
                onChange={(e) => handleFileUpload('right', e)}
                className="hidden"
                accept=".txt,.md,.json,.js,.jsx,.ts,.tsx,.html,.css,.yml,.yaml"
              />
            </div>
            <TextArea 
              value={rightText}
              onChange={(e) => setRightText(e.target.value)}
              placeholder="Paste or type modified text here..."
            />
          </div>
        </div>
        
        <div className="flex justify-center gap-4 mt-2">
          <button
            className={`
              flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all
              ${loading ? 'opacity-90 cursor-not-allowed' : 'hover:shadow-lg active:scale-95'}
              bg-sky-600 hover:bg-sky-700 text-white
            `}
            onClick={onCompare}
            disabled={loading || !leftText || !rightText}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Play size={16} />
            )}
            <span>{loading ? 'Processing...' : 'Compare'}</span>
          </button>
          <button
            className={`
              flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-all hover:shadow-lg active:scale-95
              ${theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}
            `}
            onClick={onReset}
            disabled={loading}
          >
            <RotateCcw size={16} />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputSection;