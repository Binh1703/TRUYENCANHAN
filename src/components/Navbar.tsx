import React from 'react';
import { User } from 'firebase/auth';
import {
  Headphones,
  UploadCloud,
  FolderPlus,
  RefreshCw,
  LogOut,
  Database,
  HardDrive,
  Sun,
  Moon,
  HelpCircle,
  Folder,
  History,
  Lock,
} from 'lucide-react';
import { GoogleSignInButton } from './GoogleSignInButton';

interface NavbarProps {
  user: User | null;
  isLoadingAuth: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onLogin: () => void;
  onLogout: () => void;
  onOpenUpload: () => void;
  onOpenFolderManager: () => void;
  onOpenGuide: () => void;
  onRefresh: () => void;
  onOpenHistoryBackup?: () => void;
  onLockApp?: () => void;
  isRefreshing: boolean;
  totalStories: number;
  totalStorageStr: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  isLoadingAuth,
  theme,
  onToggleTheme,
  onLogin,
  onLogout,
  onOpenUpload,
  onOpenFolderManager,
  onOpenGuide,
  onRefresh,
  onOpenHistoryBackup,
  onLockApp,
  isRefreshing,
  totalStories,
  totalStorageStr,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                DriveAudio
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800">
                <Database className="w-3 h-3" />
                Google Drive DB
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:block">
              Kho truyện Audio MP3 & Đọc chữ từ Google Drive
            </p>
          </div>
        </div>

        {/* Center / Action buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* History Backup JSON Modal button */}
          <button
            onClick={onOpenHistoryBackup}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 rounded-xl text-xs sm:text-sm font-semibold transition-all active:scale-95"
            title="Tải về hoặc Tải lên file Lịch sử nghe & Thứ tự truyện"
          >
            <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Tải / Up Lịch sử</span>
          </button>

          {/* Guide / Instruction Button */}
          <button
            onClick={onOpenGuide}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-medium transition-colors"
            title="Hướng dẫn liên kết thư mục Google Drive"
          >
            <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Hướng dẫn</span>
          </button>

          {user && (
            <>
              {/* Upload Button */}
              <button
                onClick={onOpenUpload}
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm shadow-indigo-500/20 transition-all active:scale-95"
              >
                <UploadCloud className="w-4 h-4" />
                <span className="hidden xs:inline">Tải lên Drive</span>
              </button>

              {/* Folder Manager */}
              <button
                onClick={onOpenFolderManager}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs sm:text-sm font-medium transition-colors"
                title="Quản lý thư mục Google Drive"
              >
                <FolderPlus className="w-4 h-4 text-amber-500" />
                <span className="hidden md:inline">Thư mục</span>
              </button>

              {/* Refresh */}
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className={`p-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                  isRefreshing ? 'animate-spin text-indigo-600' : ''
                }`}
                title="Đồng bộ lại danh sách từ Drive"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Theme Toggle (Light / Dark) */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-700"
            title={theme === 'dark' ? 'Chuyển sang giao diện Sáng' : 'Chuyển sang giao diện Tối'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          {/* Lock App Button */}
          <button
            onClick={onLockApp}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-700"
            title="Khóa bảo mật trang web (BINHCK)"
          >
            <Lock className="w-4 h-4 text-rose-500" />
          </button>
        </div>

        {/* Right Auth Profile */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              {/* Storage Stats badge */}
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-end gap-1">
                  <HardDrive className="w-3 h-3 text-slate-400" />
                  {totalStories} tập ({totalStorageStr})
                </span>
                <span className="text-[10px] text-slate-400">Đã đồng bộ Drive</span>
              </div>

              {/* User Avatar & Logout */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-semibold">
              <Folder className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Đã mở quyền truy cập</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
