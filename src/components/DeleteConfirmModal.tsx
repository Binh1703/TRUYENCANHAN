import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { AudioStoryItem } from '../types/drive';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  item: AudioStoryItem | null;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  item,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            Xác nhận xóa tệp trên Google Drive
          </h3>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Hành động này sẽ xóa vĩnh viễn tệp truyện audio khỏi Google Drive của bạn và không thể hoàn tác:
          </p>

          <div className="mt-4 p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <div className="flex items-center justify-between text-sm font-semibold text-slate-800 dark:text-slate-100 break-all">
              <span>{item.name}</span>
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span>Kích thước: {item.formattedSize}</span>
              {item.companionTextFileName && (
                <span className="text-amber-600 dark:text-amber-400">• Kèm file text ({item.companionTextFileName})</span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? 'Đang xóa...' : 'Xác nhận xóa khỏi Drive'}
          </button>
        </div>
      </div>
    </div>
  );
};
