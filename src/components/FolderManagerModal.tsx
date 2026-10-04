import React, { useState } from 'react';
import { FolderPlus, Folder, X, Plus } from 'lucide-react';
import { DriveFolder } from '../types/drive';
import { createDriveFolder } from '../services/driveService';

interface FolderManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  folders: DriveFolder[];
  onFolderCreated: (newFolder: DriveFolder) => void;
}

export const FolderManagerModal: React.FC<FolderManagerModalProps> = ({
  isOpen,
  onClose,
  token,
  folders,
  onFolderCreated,
}) => {
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      setIsCreating(true);
      setError(null);
      const created = await createDriveFolder(token, newFolderName.trim());
      onFolderCreated(created);
      setNewFolderName('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi tạo thư mục');
    } finally {
      setIsCreating(false);
    }
  };

  const quickFolderSuggestions = ['Tiên Hiệp', 'Kiếm Hiệp', 'Trinh Thám', 'Ngôn Tình', 'Truyện Ngắn', 'Truyện Ma Audio', 'Podcast & Sách Nói'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Quản lý thư mục Google Drive
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Phân loại truyện theo từng thể loại hoặc bộ truyện
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          {/* Create Form */}
          <form onSubmit={handleCreate} className="space-y-3">
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
              Tạo thư mục mới trong Google Drive
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Tên thư mục (VD: Kiếm Hiệp Audio)"
                className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-100"
              />
              <button
                type="submit"
                disabled={isCreating || !newFolderName.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 shadow-xs"
              >
                <Plus className="w-4 h-4" />
                {isCreating ? 'Đang tạo...' : 'Tạo'}
              </button>
            </div>
          </form>

          {/* Quick suggestions */}
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">Gợi ý tên thể loại nhanh:</p>
            <div className="flex flex-wrap gap-1.5">
              {quickFolderSuggestions.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setNewFolderName(tag)}
                  className="px-2.5 py-1 text-xs bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-700 dark:hover:text-amber-300 text-slate-600 dark:text-slate-300 rounded-lg transition-colors border border-slate-200/60 dark:border-slate-700"
                >
                  + {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Current Folders List */}
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              Các thư mục hiện có ({folders.length})
            </label>
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {folders.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Chưa có thư mục nào</p>
              ) : (
                folders.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center gap-2.5 p-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-sm text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-800"
                  >
                    <Folder className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span className="truncate font-medium">{f.name}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex justify-end border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
