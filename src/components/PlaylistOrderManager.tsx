import React from 'react';
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ArrowDown10,
  ArrowUp10,
  ArrowUpDown,
  MoveVertical,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export type SortMode = 'chapter-asc' | 'chapter-desc' | 'name-asc' | 'name-desc' | 'custom';

interface PlaylistOrderManagerProps {
  sortMode: SortMode;
  onSelectSortMode: (mode: SortMode) => void;
  onReverseOrder: () => void;
  onResetOrder: () => void;
  totalStories: number;
}

export const PlaylistOrderManager: React.FC<PlaylistOrderManagerProps> = ({
  sortMode,
  onSelectSortMode,
  onReverseOrder,
  onResetOrder,
  totalStories,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs transition-colors space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <span>Sắp xếp thứ tự nghe ({totalStories} tập)</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                • Tự động phát tiếp theo thứ tự
              </span>
            </h4>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Chapter Ascending (Default standard for audiobooks) */}
          <button
            type="button"
            onClick={() => onSelectSortMode('chapter-asc')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              sortMode === 'chapter-asc'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
            title="Sắp xếp tập/chương tăng dần: Phần 12 → Chương 13 → Chương 14..."
          >
            <ArrowUp10 className="w-3.5 h-3.5" />
            <span>Chương tăng dần (1 → N)</span>
          </button>

          {/* Chapter Descending */}
          <button
            type="button"
            onClick={() => onSelectSortMode('chapter-desc')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              sortMode === 'chapter-desc'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
            title="Sắp xếp tập/chương giảm dần: Chương 25 → Chương 22..."
          >
            <ArrowDown10 className="w-3.5 h-3.5" />
            <span>Mới nhất (N → 1)</span>
          </button>

          {/* Name A-Z */}
          <button
            type="button"
            onClick={() => onSelectSortMode('name-asc')}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 transition-all ${
              sortMode === 'name-asc'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
            }`}
            title="Sắp xếp theo tên A-Z"
          >
            <ArrowDownAZ className="w-3.5 h-3.5" />
            <span>A-Z</span>
          </button>

          {/* Custom Order Toggle */}
          <button
            type="button"
            onClick={() => onSelectSortMode('custom')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              sortMode === 'custom'
                ? 'bg-amber-500 text-white shadow-xs ring-2 ring-amber-400/40'
                : 'bg-slate-100 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 dark:hover:text-amber-400 text-slate-700 dark:text-slate-300'
            }`}
            title="Tự do bấm ⬆️ Lên / ⬇️ Xuống trên từng tập truyện để xếp đúng theo ý bạn"
          >
            <MoveVertical className="w-3.5 h-3.5" />
            <span>Tự xếp theo ý tôi 🖐️</span>
          </button>

          {/* Reverse button */}
          <button
            type="button"
            onClick={onReverseOrder}
            className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs transition-colors"
            title="Đảo ngược thứ tự danh sách hiện tại"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Helpful tip banner when in Custom mode */}
      {sortMode === 'custom' && (
        <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span>
              <strong>Kéo thả hoặc chọn số:</strong> Bạn có thể nhấn giữ biểu tượng <strong>⠿</strong> rồi kéo thả thẻ truyện trực tiếp đến số thứ tự mong muốn, hoặc bấm vào huy hiệu số <strong>#</strong> trên thẻ để đổi vị trí!
            </span>
          </span>
          <button
            type="button"
            onClick={onResetOrder}
            className="ml-2 font-bold underline hover:text-amber-950 dark:hover:text-white flex-shrink-0"
          >
            Đặt lại mặc định
          </button>
        </div>
      )}
    </div>
  );
};
