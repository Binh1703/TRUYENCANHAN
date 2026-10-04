import React, { useState } from 'react';
import { Folder, Link as LinkIcon, ArrowRight, Clock, Sparkles } from 'lucide-react';
import { extractDriveFolderId } from '../services/driveService';

interface DriveFolderInputBarProps {
  onOpenFolderUrl: (folderIdOrUrl: string) => Promise<void>;
  isLoading: boolean;
  currentFolderId: string;
  recentFolders: Array<{ id: string; name: string }>;
}

export const DriveFolderInputBar: React.FC<DriveFolderInputBarProps> = ({
  onOpenFolderUrl,
  isLoading,
  currentFolderId,
  recentFolders,
}) => {
  const [folderInput, setFolderInput] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderInput.trim()) return;

    try {
      setInputError(null);
      const cleanId = extractDriveFolderId(folderInput);
      if (!cleanId || cleanId.length < 5) {
        setInputError('Đường dẫn hoặc ID thư mục Google Drive không hợp lệ.');
        return;
      }
      await onOpenFolderUrl(cleanId);
      setFolderInput('');
    } catch (err: unknown) {
      setInputError(err instanceof Error ? err.message : 'Không thể mở thư mục này');
    }
  };

  const handleQuickExample = async (exampleId: string) => {
    setFolderInput(exampleId);
    try {
      setInputError(null);
      await onOpenFolderUrl(exampleId);
    } catch (err: unknown) {
      setInputError(err instanceof Error ? err.message : 'Không thể mở thư mục này');
    }
  };

  const exampleFolderId = '1ESn1qxHVscGhXQ7-eIwuyJvj5z7LoDax';

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 shadow-xs transition-colors duration-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <LinkIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>Mở thư mục bằng Link hoặc ID Google Drive</span>
              <span className="text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full">
                Tiện lợi
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Dán đường dẫn link thư mục từ Google Drive để ứng dụng tự động quét và trình bày toàn bộ tệp truyện MP3
            </p>
          </div>
        </div>

        {/* Example Quick Trigger */}
        <button
          type="button"
          onClick={() => handleQuickExample(exampleFolderId)}
          className="inline-flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold bg-indigo-50/60 dark:bg-indigo-950/40 px-3 py-1.5 rounded-xl border border-indigo-200/60 dark:border-indigo-800 transition-colors w-fit"
          title="Nhấn để thử link thư mục mẫu bạn đã cung cấp"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Thử thư mục mẫu của bạn</span>
        </button>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Folder className="w-4 h-4 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={folderInput}
            onChange={(e) => {
              setFolderInput(e.target.value);
              setInputError(null);
            }}
            placeholder="Dán link Google Drive (VD: https://drive.google.com/drive/folders/1ESn1qxHVscGhXQ7...)"
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !folderInput.trim()}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-xs disabled:opacity-50 transition-all active:scale-95"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
          <span>{isLoading ? 'Đang đọc...' : 'Mở thư mục'}</span>
        </button>
      </form>

      {inputError && (
        <p className="mt-2 text-xs text-rose-600 dark:text-rose-400 font-medium">
          {inputError}
        </p>
      )}

      {/* Recent Folders Quick Access */}
      {recentFolders.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Đã mở gần đây:
          </span>
          {recentFolders.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => handleQuickExample(f.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                currentFolderId === f.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Folder className="w-3 h-3 text-amber-500" />
              <span className="truncate max-w-[180px]">{f.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
