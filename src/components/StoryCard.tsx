import React, { useState } from 'react';
import {
  Play,
  FileText,
  Trash2,
  ExternalLink,
  Folder,
  Clock,
  HardDrive,
  ArrowUp,
  ArrowDown,
  GripVertical,
} from 'lucide-react';
import { AudioStoryItem } from '../types/drive';
import { formatTime } from '../services/driveService';

interface StoryCardProps {
  story: AudioStoryItem;
  index: number;
  totalItems: number;
  isPlaying: boolean;
  isCurrent: boolean;
  onPlay: (story: AudioStoryItem) => void;
  onSelectForReader: (story: AudioStoryItem) => void;
  onRequestDelete: (story: AudioStoryItem) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onMoveToPosition?: (targetPosition: number) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  showReorderControls?: boolean;
  isDragging?: boolean;
  isDragOver?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export const StoryCard: React.FC<StoryCardProps> = ({
  story,
  index,
  totalItems,
  isPlaying,
  isCurrent,
  onPlay,
  onSelectForReader,
  onRequestDelete,
  onMoveUp,
  onMoveDown,
  onMoveToPosition,
  canMoveUp = false,
  canMoveDown = false,
  showReorderControls = false,
  isDragging = false,
  isDragOver = false,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}) => {
  const [isChangingPosition, setIsChangingPosition] = useState(false);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`group relative p-4 rounded-2xl border transition-all duration-200 select-none ${
        isDragging
          ? 'opacity-40 scale-95 border-indigo-500 border-dashed bg-indigo-50/50 dark:bg-indigo-950/30'
          : isDragOver
          ? 'ring-4 ring-indigo-500/40 border-indigo-600 bg-indigo-50/80 dark:bg-indigo-900/40 shadow-lg scale-[1.02]'
          : isCurrent
          ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/20 shadow-md'
          : 'bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/80 border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs hover:shadow-sm'
      }`}
    >
      {/* Drop Target Guide Overlay when dragging over */}
      {isDragOver && (
        <div className="absolute inset-0 bg-indigo-600/10 dark:bg-indigo-500/20 border-2 border-indigo-600 border-dashed rounded-2xl pointer-events-none flex items-center justify-center z-10">
          <div className="bg-indigo-600 text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce">
            <span>👉 Thả vào vị trí số #{index}</span>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div
          className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 pt-3 flex-shrink-0 transition-colors"
          title="Nhấn giữ và kéo thả truyện đến số thứ tự mong muốn"
        >
          <GripVertical className="w-5 h-5" />
        </div>

        {/* Play Button with Position Badge */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => onPlay(story)}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform active:scale-95 shadow-sm ${
              isCurrent && isPlaying
                ? 'bg-indigo-600 text-white shadow-indigo-200 dark:shadow-indigo-900'
                : isCurrent
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-600 group-hover:text-white text-slate-700 dark:text-slate-300'
            }`}
            title={isCurrent && isPlaying ? 'Tạm dừng' : `Phát tập số #${index}`}
          >
            {isCurrent && isPlaying ? (
              <div className="flex items-end gap-0.5 h-4">
                <span className="w-0.5 bg-white rounded-full animate-eq-1" />
                <span className="w-0.5 bg-white rounded-full animate-eq-2" />
                <span className="w-0.5 bg-white rounded-full animate-eq-3" />
              </div>
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </button>

          {/* Sequential Order Number Badge with Quick Position Selector */}
          <div className="absolute -top-2.5 -left-1.5 z-20">
            {isChangingPosition ? (
              <select
                autoFocus
                value={index}
                onChange={(e) => {
                  onMoveToPosition?.(Number(e.target.value));
                  setIsChangingPosition(false);
                }}
                onBlur={() => setIsChangingPosition(false)}
                className="bg-indigo-600 text-white font-extrabold text-[11px] rounded-md px-1 py-0.5 shadow-md focus:outline-none cursor-pointer"
              >
                {Array.from({ length: totalItems }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    #{i + 1}
                  </option>
                ))}
              </select>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsChangingPosition(true);
                }}
                className="px-1.5 py-0.5 bg-slate-900 hover:bg-indigo-600 text-white text-[11px] font-extrabold rounded-md shadow-xs cursor-pointer transition-colors border border-slate-700"
                title="Bấm vào để chọn đổi sang số thứ tự khác"
              >
                #{index}
              </button>
            )}
          </div>
        </div>

        {/* Story details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h4
              onClick={() => onPlay(story)}
              className={`text-sm font-bold truncate cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 ${
                isCurrent
                  ? 'text-indigo-900 dark:text-indigo-200 font-extrabold'
                  : 'text-slate-900 dark:text-slate-100'
              }`}
            >
              {story.title}
            </h4>

            {/* Quick Move Up/Down Buttons */}
            {showReorderControls && (
              <div className="flex items-center gap-1 flex-shrink-0 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
                <button
                  type="button"
                  onClick={onMoveUp}
                  disabled={!canMoveUp}
                  className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  title="Di chuyển lên 1 bậc"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onMoveDown}
                  disabled={!canMoveDown}
                  className="p-1 rounded text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  title="Di chuyển xuống 1 bậc"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 font-mono">
              <HardDrive className="w-3 h-3 text-slate-400 dark:text-slate-500" />
              {story.formattedSize}
            </span>

            {story.folderName && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                <Folder className="w-3 h-3" />
                {story.folderName}
              </span>
            )}

            {story.companionTextFileName ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <FileText className="w-3 h-3" />
                Có lời đọc
              </span>
            ) : (
              <span className="text-slate-400 dark:text-slate-500 italic">Chưa có chữ</span>
            )}
          </div>

          {/* Saved progress */}
          {story.savedProgress && story.savedProgress > 5 && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-100/60 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md w-fit">
              <Clock className="w-3 h-3" />
              <span>Đã nghe đến: {formatTime(story.savedProgress)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <button
          onClick={() => onSelectForReader(story)}
          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
            story.companionTextFileName
              ? 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60'
              : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Mở nội dung văn bản theo dõi"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{story.companionTextFileName ? 'Đọc nội dung' : 'Thêm chữ'}</span>
        </button>

        <div className="flex items-center gap-1">
          {story.webViewLink && (
            <a
              href={story.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Xem trên Google Drive"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <button
            onClick={() => onRequestDelete(story)}
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Xóa tệp khỏi danh sách"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
