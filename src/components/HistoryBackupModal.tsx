import React, { useState, useRef } from 'react';
import { Download, Upload, X, Sparkles, CheckCircle2, History, AlertCircle } from 'lucide-react';
import { AudioStoryItem } from '../types/drive';

interface HistoryBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: string;
  folderName: string;
  stories: AudioStoryItem[];
  currentStory: AudioStoryItem | null;
  customOrderIds: string[];
  onRestoreHistory: (restoredData: {
    currentFolderId?: string;
    lastListenedStoryId?: string;
    allSavedProgress?: Record<string, number>;
    allFolderOrders?: Record<string, string[]>;
  }) => void;
}

export const HistoryBackupModal: React.FC<HistoryBackupModalProps> = ({
  isOpen,
  onClose,
  folderId,
  folderName,
  stories,
  currentStory,
  customOrderIds,
  onRestoreHistory,
}) => {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // 1. Export History Data across ALL subfolders
  const handleExportJSON = () => {
    try {
      setSuccessMsg(null);
      setErrorMsg(null);

      const allSavedProgress: Record<string, number> = {};
      const allFolderOrders: Record<string, string[]> = {};
      const bookmarksMap: Record<string, any[]> = {};

      // Scan localStorage for all audio_pos_* entries
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key) continue;

        if (key.startsWith('audio_pos_')) {
          const storyId = key.replace('audio_pos_', '');
          const val = localStorage.getItem(key);
          if (val) {
            allSavedProgress[storyId] = parseFloat(val);
          }
        } else if (key.startsWith('custom_playlist_order_')) {
          const fId = key.replace('custom_playlist_order_', '');
          const val = localStorage.getItem(key);
          if (val) {
            try {
              allFolderOrders[fId] = JSON.parse(val);
            } catch {
              // ignore
            }
          }
        } else if (key.startsWith('bookmarks_')) {
          const storyId = key.replace('bookmarks_', '');
          const val = localStorage.getItem(key);
          if (val) {
            try {
              bookmarksMap[storyId] = JSON.parse(val);
            } catch {
              // ignore
            }
          }
        }
      }

      // Also ensure current folder order is saved
      if (customOrderIds.length > 0) {
        allFolderOrders[folderId] = customOrderIds;
      }

      const backupData = {
        app: 'DriveAudio',
        version: '2.0',
        exportDate: new Date().toISOString(),
        currentFolderId: folderId,
        currentFolderName: folderName,
        lastListenedStoryId: currentStory?.id || null,
        allFolderOrders,
        allSavedProgress,
        bookmarksMap,
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const dateStr = new Date().toISOString().slice(0, 10);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DriveAudio_LichSu_Nghe_DaThuMuc_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccessMsg('Đã xuất file lịch sử nghe và thứ tự sắp xếp (toàn bộ các thư mục truyện) thành công!');
    } catch (err) {
      setErrorMsg('Không thể xuất file lịch sử. Vui lòng thử lại.');
    }
  };

  // 2. Import History Data from JSON file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSuccessMsg(null);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed || (parsed.app !== 'DriveAudio' && !parsed.allSavedProgress && !parsed.savedProgressMap)) {
          setErrorMsg('File JSON không hợp lệ hoặc không đúng định dạng DriveAudio!');
          return;
        }

        const progressMap = parsed.allSavedProgress || parsed.savedProgressMap || {};
        const folderOrders = parsed.allFolderOrders || {};

        // Restore progress map into localStorage
        Object.entries(progressMap).forEach(([storyId, posSeconds]) => {
          if (typeof posSeconds === 'number') {
            localStorage.setItem(`audio_pos_${storyId}`, posSeconds.toString());
          }
        });

        // Restore folder orders into localStorage
        Object.entries(folderOrders).forEach(([fId, orderArr]) => {
          if (Array.isArray(orderArr)) {
            localStorage.setItem(`custom_playlist_order_${fId}`, JSON.stringify(orderArr));
          }
        });

        // Restore bookmarks
        if (parsed.bookmarksMap && typeof parsed.bookmarksMap === 'object') {
          Object.entries(parsed.bookmarksMap).forEach(([storyId, bms]) => {
            localStorage.setItem(`bookmarks_${storyId}`, JSON.stringify(bms));
          });
        }

        localStorage.setItem('app_playlist_sort_mode', 'custom');

        // Trigger callback in parent
        onRestoreHistory({
          currentFolderId: parsed.currentFolderId || parsed.folderId,
          lastListenedStoryId: parsed.lastListenedStoryId,
          allSavedProgress: progressMap,
          allFolderOrders: folderOrders,
        });

        setSuccessMsg(
          'Khôi phục thành công! Đã phục hồi vị trí đang nghe và thứ tự xếp truyện trên tất cả các thư mục!'
        );

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (err) {
        setErrorMsg('Không thể đọc file JSON này. Vui lòng kiểm tra lại!');
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md transition-all">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Sao lưu Lịch sử & Thứ tự (Đa thư mục)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Lưu lại đoạn đang nghe và thứ tự xếp truyện của tất cả các bộ truyện / thư mục con
            </p>
          </div>
        </div>

        {/* Action Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Export Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm mb-1">
                <Download className="w-4 h-4" />
                <span>1. Tải file về máy</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Xuất file `.json` sao lưu toàn bộ thứ tự và mốc thời gian đang nghe của tất cả thư mục truyện.
              </p>
            </div>
            <button
              onClick={handleExportJSON}
              className="w-full py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Tải file Lịch sử (.json)</span>
            </button>
          </div>

          {/* Import Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm mb-1">
                <Upload className="w-4 h-4" />
                <span>2. Upload file lịch sử</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tải file `.json` lên để khôi phục lại ngay lập tức vị trí nghe và sắp xếp của các bộ truyện.
              </p>
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
                id="history-file-upload"
              />
              <label
                htmlFor="history-file-upload"
                className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Upload className="w-4 h-4" />
                <span>Chọn File Lịch sử để khôi phục</span>
              </label>
            </div>
          </div>
        </div>

        {/* Feedback Alerts */}
        {successMsg && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Tip */}
        <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500 flex-shrink-0" />
          <span>
            <strong>Mẹo:</strong> Tiến trình nghe và thứ tự sắp xếp ở mọi thư mục con đều được đóng gói đầy đủ vào 1 file duy nhất. Khi up file lên, bạn sẽ lập tức trở lại đúng bộ truyện và giây nghe dở!
          </span>
        </div>
      </div>
    </div>
  );
};
