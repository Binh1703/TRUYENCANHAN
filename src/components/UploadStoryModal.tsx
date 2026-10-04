import React, { useState, useRef } from 'react';
import { UploadCloud, Music, FileText, Folder, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { DriveFolder } from '../types/drive';
import { uploadAudioStoryToDrive, formatBytes } from '../services/driveService';

interface UploadStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  folders: DriveFolder[];
  defaultFolderId?: string;
  onUploadSuccess: () => void;
}

export const UploadStoryModal: React.FC<UploadStoryModalProps> = ({
  isOpen,
  onClose,
  token,
  folders,
  defaultFolderId,
  onUploadSuccess,
}) => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState(defaultFolderId || '');
  const [companionText, setCompanionText] = useState('');
  const [textFile, setTextFile] = useState<File | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAudioFile(file);
      if (!customTitle) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '');
        setCustomTitle(cleanName);
      }
      setError(null);
    }
  };

  const handleTextFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setTextFile(file);
      const text = await file.text();
      setCompanionText(text);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile) {
      setError('Vui lòng chọn tệp audio MP3/M4A cần tải lên.');
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(15);

      await uploadAudioStoryToDrive(token, {
        audioFile,
        customTitle: customTitle.trim() || undefined,
        companionText: companionText.trim() || undefined,
        folderId: selectedFolderId || undefined,
        onProgress: (p) => setUploadProgress(p),
      });

      setUploadSuccess(true);
      setTimeout(() => {
        onUploadSuccess();
        onClose();
        setAudioFile(null);
        setCustomTitle('');
        setCompanionText('');
        setTextFile(null);
        setUploadSuccess(false);
        setIsUploading(false);
        setUploadProgress(0);
      }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi không xác định khi tải lên');
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden my-8">
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Tải truyện Audio lên Google Drive
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lưu trữ trực tiếp vào kho dữ liệu Google Drive của bạn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isUploading}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleUpload} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2.5 text-sm text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2.5 text-sm text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>Tải lên Google Drive thành công! Đang làm mới danh sách...</span>
            </div>
          )}

          {/* 1. Select Audio File */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Chọn tệp Audio Truyện (MP3, M4A, WAV, AAC...) *
            </label>
            <input
              type="file"
              ref={audioInputRef}
              onChange={handleAudioChange}
              accept="audio/*,.mp3,.m4a,.wav,.aac,.ogg,.flac"
              className="hidden"
            />

            {!audioFile ? (
              <div
                onClick={() => audioInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 bg-slate-50 dark:bg-slate-800/50 hover:bg-indigo-50/30 rounded-2xl p-6 text-center cursor-pointer transition-colors"
              >
                <Music className="w-10 h-10 mx-auto text-indigo-400 mb-2" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Nhấn để chọn tệp âm thanh từ thiết bị
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Định dạng hỗ trợ: MP3, M4A, WAV, AAC, OGG
                </p>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3.5 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-2xl">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                    <Music className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                      {audioFile.name}
                    </p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                      {formatBytes(audioFile.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => audioInputRef.current?.click()}
                  className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-xs border border-indigo-200 dark:border-indigo-800"
                >
                  Thay đổi
                </button>
              </div>
            )}
          </div>

          {/* 2. Custom Title / Chapter */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tên truyện / Tiêu đề chương
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              placeholder="VD: Phàm Nhân Tu Tiên - Chương 01"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-100 transition-all"
            />
          </div>

          {/* 3. Folder Destination in Google Drive */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Folder className="w-4 h-4 text-amber-500" />
              <span>Thư mục lưu trữ trên Google Drive</span>
            </label>
            <select
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-100 transition-all"
            >
              <option value="">Thư mục mặc định (Truyện Audio)</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  📁 {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Companion Text Content for Reading Along */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Nội dung văn bản / Lời đọc để theo dõi (Tùy chọn)</span>
              </label>
              <button
                type="button"
                onClick={() => textInputRef.current?.click()}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
              >
                + Nhập từ file (.txt)
              </button>
              <input
                type="file"
                ref={textInputRef}
                onChange={handleTextFileChange}
                accept=".txt,.md,.lrc"
                className="hidden"
              />
            </div>
            {textFile && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-2 font-medium">
                ✓ Đã nạp nội dung từ {textFile.name}
              </p>
            )}
            <textarea
              rows={4}
              value={companionText}
              onChange={(e) => setCompanionText(e.target.value)}
              placeholder="Dán nội dung truyện, lời thoại hoặc tóm tắt chương vào đây để tiện theo dõi song song khi nghe..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-100 transition-all"
            />
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium">
                <span>Đang tải lên Google Drive...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isUploading || !audioFile}
              className="inline-flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-200 dark:shadow-indigo-900/40 disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4" />
              {isUploading ? 'Đang lưu vào Drive...' : 'Tải lên Google Drive'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
