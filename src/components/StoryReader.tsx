import React, { useState, useEffect } from 'react';
import {
  FileText,
  Save,
  Edit3,
  Search,
  Type,
  Sun,
  Moon,
  Coffee,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  BookOpen,
} from 'lucide-react';
import { AudioStoryItem } from '../types/drive';
import { getFileTextContent, saveCompanionTextToDrive } from '../services/driveService';

interface StoryReaderProps {
  currentStory: AudioStoryItem | null;
  token: string;
  onCompanionUpdated?: (storyId: string, textFileId: string, textFileName: string) => void;
}

type ReaderTheme = 'light' | 'sepia' | 'dark';

export const StoryReader: React.FC<StoryReaderProps> = ({
  currentStory,
  token,
  onCompanionUpdated,
}) => {
  const [textContent, setTextContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reader typography settings
  const [fontSize, setFontSize] = useState<number>(16);
  const [theme, setTheme] = useState<ReaderTheme>('light');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Load companion text when currentStory changes
  useEffect(() => {
    if (!currentStory) {
      setTextContent('');
      setEditedText('');
      return;
    }

    const loadText = async () => {
      if (currentStory.textContent) {
        setTextContent(currentStory.textContent);
        setEditedText(currentStory.textContent);
        return;
      }

      if (currentStory.companionTextFileId && token) {
        try {
          setIsLoading(true);
          setError(null);
          const text = await getFileTextContent(token, currentStory.companionTextFileId);
          setTextContent(text);
          setEditedText(text);
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : 'Lỗi tải nội dung văn bản');
        } finally {
          setIsLoading(false);
        }
      } else {
        setTextContent('');
        setEditedText('');
      }
    };

    loadText();
    setIsEditing(false);
  }, [currentStory, token]);

  const handleSaveToDrive = async () => {
    if (!currentStory) return;

    try {
      setIsSaving(true);
      setError(null);

      const baseName = currentStory.name.replace(/\.[^/.]+$/, '');
      const fileName = `${baseName}.txt`;

      const result = await saveCompanionTextToDrive(
        token,
        fileName,
        editedText,
        currentStory.folderId,
        currentStory.companionTextFileId
      );

      setTextContent(editedText);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);

      onCompanionUpdated?.(currentStory.id, result.id, result.name);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Lỗi lưu vào Google Drive');
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentStory) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-500 flex items-center justify-center mb-4">
          <BookOpen className="w-8 h-8" />
        </div>
        <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100">
          Chưa chọn truyện nào
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mt-1">
          Chọn một tập truyện từ danh sách Google Drive bên trái để nghe và xem nội dung chữ đồng thời.
        </p>
      </div>
    );
  }

  // Theme-based style classes
  const themeClasses = {
    light: 'bg-white text-slate-800 border-slate-200',
    sepia: 'bg-[#fbf7ee] text-[#433422] border-[#e8dfcf]',
    dark: 'bg-slate-900 text-slate-100 border-slate-800',
  };

  const themeInnerClasses = {
    light: 'text-slate-700 selection:bg-indigo-100',
    sepia: 'text-[#433422] selection:bg-[#ebd9bd]',
    dark: 'text-slate-300 selection:bg-indigo-900 selection:text-white',
  };

  return (
    <div
      className={`h-full flex flex-col rounded-2xl border shadow-sm transition-colors duration-200 overflow-hidden ${themeClasses[theme]}`}
    >
      {/* Header bar */}
      <div className="p-4 border-b border-inherit flex flex-wrap items-center justify-between gap-3 bg-opacity-50">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <FileText className="w-5 h-5 text-indigo-500 flex-shrink-0" />
          <div className="truncate">
            <h3 className="text-sm font-bold truncate">
              {currentStory.title}
            </h3>
            <p className="text-xs opacity-75 truncate">
              {currentStory.companionTextFileName
                ? `Tệp nội dung: ${currentStory.companionTextFileName}`
                : 'Chưa có file nội dung kèm theo'}
            </p>
          </div>
        </div>

        {/* Reader Controls Toolbar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Search Toggle */}
          <button
            type="button"
            onClick={() => setShowSearch(!showSearch)}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
              showSearch
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 border-inherit'
            }`}
            title="Tìm kiếm trong nội dung"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Font Size */}
          <div className="flex items-center border border-inherit rounded-lg px-1.5 py-0.5 text-xs gap-1">
            <Type className="w-3.5 h-3.5 opacity-70" />
            <button
              onClick={() => setFontSize((s) => Math.max(12, s - 2))}
              className="px-1 font-bold hover:text-indigo-500"
            >
              -
            </button>
            <span className="font-mono text-xs">{fontSize}px</span>
            <button
              onClick={() => setFontSize((s) => Math.min(28, s + 2))}
              className="px-1 font-bold hover:text-indigo-500"
            >
              +
            </button>
          </div>

          {/* Theme selector */}
          <div className="flex items-center border border-inherit rounded-lg p-0.5 gap-0.5 text-xs">
            <button
              onClick={() => setTheme('light')}
              className={`p-1 rounded-md ${theme === 'light' ? 'bg-slate-200 text-slate-900 font-bold' : 'opacity-60'}`}
              title="Giao diện Sáng"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('sepia')}
              className={`p-1 rounded-md ${theme === 'sepia' ? 'bg-[#e4dac6] text-[#433422] font-bold' : 'opacity-60'}`}
              title="Giao diện Sepia (Đỡ mỏi mắt)"
            >
              <Coffee className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`p-1 rounded-md ${theme === 'dark' ? 'bg-slate-800 text-slate-100 font-bold' : 'opacity-60'}`}
              title="Giao diện Tối"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Edit / Save toggle */}
          {isEditing ? (
            <button
              onClick={handleSaveToDrive}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              {isSaving ? 'Đang lưu...' : 'Lưu vào Drive'}
            </button>
          ) : (
            <button
              onClick={() => {
                setEditedText(textContent);
                setIsEditing(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {textContent ? 'Chỉnh sửa' : '+ Thêm nội dung'}
            </button>
          )}

          {currentStory.webViewLink && (
            <a
              href={currentStory.webViewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-xs opacity-75 hover:opacity-100 rounded-lg border border-inherit"
              title="Mở file trên Google Drive"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Search Input Bar */}
      {showSearch && (
        <div className="p-2 border-b border-inherit bg-slate-500/5 flex items-center gap-2">
          <Search className="w-4 h-4 opacity-50 ml-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm cụm từ trong đoạn truyện..."
            className="w-full bg-transparent text-xs py-1 focus:outline-none"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs px-2 opacity-60 hover:opacity-100"
            >
              Xóa
            </button>
          )}
        </div>
      )}

      {/* Notifications */}
      {saveSuccess && (
        <div className="mx-4 mt-3 p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Đã lưu nội dung văn bản thành công vào Google Drive!</span>
        </div>
      )}

      {error && (
        <div className="mx-4 mt-3 p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Reader Content Body */}
      <div className="flex-1 overflow-y-auto p-6 leading-relaxed">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs opacity-75">Đang tải nội dung văn bản từ Google Drive...</p>
          </div>
        ) : isEditing ? (
          <div className="h-full flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs opacity-75">
              <span>Nhập hoặc dán nội dung chữ / lời đọc cho tập truyện này:</span>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="underline hover:opacity-100"
              >
                Hủy sửa
              </button>
            </div>
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              placeholder="Dán nội dung truyện, chương truyện, lời thoại hoặc tóm tắt vào đây. Khi nhấn 'Lưu vào Drive', ứng dụng sẽ tạo/cập nhật tệp .txt đi kèm trên Google Drive của bạn..."
              className="w-full flex-1 min-h-[350px] p-4 bg-transparent border border-inherit rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-sm font-sans"
              style={{ fontSize: `${fontSize}px` }}
            />
          </div>
        ) : textContent ? (
          <div
            className={`font-serif space-y-4 ${themeInnerClasses[theme]}`}
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.8 }}
          >
            {textContent.split('\n\n').map((paragraph, index) => {
              if (!paragraph.trim()) return null;

              // If searching, highlight matches
              if (searchQuery && paragraph.toLowerCase().includes(searchQuery.toLowerCase())) {
                const parts = paragraph.split(new RegExp(`(${searchQuery})`, 'gi'));
                return (
                  <p key={index} className="text-justify indent-6">
                    {parts.map((part, i) =>
                      part.toLowerCase() === searchQuery.toLowerCase() ? (
                        <mark
                          key={i}
                          className="bg-amber-300 dark:bg-amber-600 text-slate-900 rounded-xs px-0.5"
                        >
                          {part}
                        </mark>
                      ) : (
                        part
                      )
                    )}
                  </p>
                );
              }

              return (
                <p key={index} className="text-justify indent-6">
                  {paragraph}
                </p>
              );
            })}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center py-12 text-center">
            <FileText className="w-12 h-12 opacity-30 mb-3" />
            <h5 className="text-sm font-semibold opacity-90">
              Chưa có file nội dung văn bản cho tập này
            </h5>
            <p className="text-xs opacity-60 max-w-sm mt-1 mb-4">
              Bạn có thể dễ dàng thêm nội dung lời đọc, kịch bản hoặc tóm tắt chương để vừa nghe vừa theo dõi.
            </p>
            <button
              onClick={() => {
                setEditedText('');
                setIsEditing(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
            >
              <Edit3 className="w-4 h-4" />
              Soạn hoặc dán nội dung ngay
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
