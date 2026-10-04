import React from 'react';
import { ExternalLink, Folder, RefreshCw, Eye } from 'lucide-react';
import { extractDriveFolderId } from '../services/driveService';

interface DriveEmbedViewerProps {
  folderId: string;
  folderName?: string;
}

export const DriveEmbedViewer: React.FC<DriveEmbedViewerProps> = ({
  folderId,
  folderName,
}) => {
  const cleanId = extractDriveFolderId(folderId);
  const embedUrl = `https://drive.google.com/embeddedfolderview?id=${cleanId}#list`;
  const directUrl = `https://drive.google.com/drive/folders/${cleanId}`;

  const [key, setKey] = React.useState(0);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[700px] transition-colors">
      {/* Header bar */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
            <Folder className="w-5 h-5" />
          </div>
          <div className="truncate">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate flex items-center gap-2">
              <span>{folderName || 'Thư mục Google Drive'}</span>
              <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
                ID: {cleanId.slice(0, 12)}...
              </span>
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Trực tiếp từ máy chủ Google Drive
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setKey((k) => k + 1)}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Tải lại khung xem Drive"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <a
            href={directUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-semibold transition-colors"
          >
            <span>Mở trong Google Drive</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Embedded iframe */}
      <div className="flex-1 w-full bg-slate-50 dark:bg-slate-950 relative">
        <iframe
          key={key}
          src={embedUrl}
          title="Google Drive Folder View"
          className="w-full h-full border-none"
          sandbox="allow-scripts allow-same-origin allow-popups"
        />
      </div>

      {/* Footer Notice */}
      <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-indigo-500" />
          <span>Bạn có thể xem các tệp gốc được lưu trữ trong thư mục này.</span>
        </span>
        <span className="text-[11px] text-slate-400">
          Chế độ xem nhúng Google Drive
        </span>
      </div>
    </div>
  );
};
