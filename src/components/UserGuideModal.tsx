import React from 'react';
import {
  HelpCircle,
  X,
  FolderPlus,
  UploadCloud,
  Link as LinkIcon,
  PlayCircle,
  FileText,
  Copy,
  Check,
} from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTryExampleLink: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({
  isOpen,
  onClose,
  onTryExampleLink,
}) => {
  const [copied, setCopied] = React.useState(false);
  const sampleLink = 'https://drive.google.com/drive/folders/1ESn1qxHVscGhXQ7-eIwuyJvj5z7LoDax';

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden my-6">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Hướng dẫn sử dụng Kho truyện Google Drive
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Các bước đưa file truyện MP3 lên Drive và tải vào web tự động
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

        {/* Content */}
        <div className="p-6 space-y-6 text-sm text-slate-700 dark:text-slate-300">
          {/* Step 1 */}
          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
              1
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderPlus className="w-4 h-4 text-amber-500" />
                Tạo thư mục trên Google Drive của bạn
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Vào Google Drive và tạo 1 thư mục chứa truyện (ví dụ đặt tên là <em>"Truyện Kiếm Hiệp"</em> hoặc <em>"Truyện Audio"</em>).
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
              2
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-emerald-500" />
                Tải các file MP3 và file chữ vào thư mục
              </h4>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 space-y-1">
                <p>Thả các file audio của từng chương/tập vào thư mục đó:</p>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700 font-mono text-[11px] text-slate-800 dark:text-slate-200">
                  <p>📁 Thư mục truyện</p>
                  <p className="pl-4 text-indigo-600 dark:text-indigo-400">🎵 Chuong_01.mp3</p>
                  <p className="pl-4 text-emerald-600 dark:text-emerald-400">📄 Chuong_01.txt (văn bản lời đọc để xem song song)</p>
                  <p className="pl-4 text-indigo-600 dark:text-indigo-400">🎵 Chuong_02.mp3</p>
                  <p className="pl-4 text-emerald-600 dark:text-emerald-400">📄 Chuong_02.txt</p>
                </div>
                <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                  💡 Mẹo: Đặt tên file text trùng với tên file audio thì ứng dụng sẽ tự động ghép chữ và tiếng lại với nhau!
                </p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
              3
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-blue-500" />
                Lấy Link hoặc ID thư mục đưa vào trang web
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Mở thư mục đó trên trình duyệt web, copy toàn bộ đường link trên thanh địa chỉ (hoặc mã ID ở cuối link).
              </p>

              {/* Sample link box */}
              <div className="mt-2.5 p-3 bg-indigo-50/70 dark:bg-indigo-950/40 rounded-xl border border-indigo-200/80 dark:border-indigo-800 flex items-center justify-between gap-2">
                <div className="overflow-hidden">
                  <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 block">
                    Ví dụ đường link thư mục bạn đã đưa:
                  </span>
                  <span className="font-mono text-xs text-slate-700 dark:text-slate-300 truncate block">
                    {sampleLink}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1 text-slate-700 dark:text-slate-200 flex-shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã sao chép' : 'Sao chép'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex gap-4 items-start">
            <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
              4
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-purple-500" />
                Dán vào thanh "Mở thư mục" và thưởng thức
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Dán link vào ô nhập trên màn hình chính rồi nhấn <strong>"Mở thư mục"</strong>. Ứng dụng sẽ tự động tải tất cả các tập truyện, hiển thị giao diện phát âm thanh và hiển thị văn bản theo dõi song song!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              onClose();
              onTryExampleLink();
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Thử mở ngay với Link mẫu của bạn</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Đã hiểu, đóng lại
          </button>
        </div>
      </div>
    </div>
  );
};
