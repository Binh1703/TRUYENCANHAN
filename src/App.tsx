import { useState, useEffect, useMemo, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  setAccessTokenInMemory,
} from './services/auth';
import {
  listAudioStories,
  listDriveFolders,
  deleteDriveFile,
  formatBytes,
  ensureAppFolder,
  extractDriveFolderId,
  getFolderById,
  fetchPublicFolderAudio,
} from './services/driveService';
import { AudioStoryItem, DriveFolder } from './types/drive';
import { Navbar } from './components/Navbar';
import { AudioPlayer } from './components/AudioPlayer';
import { StoryReader } from './components/StoryReader';
import { StoryCard } from './components/StoryCard';
import { UploadStoryModal } from './components/UploadStoryModal';
import { FolderManagerModal } from './components/FolderManagerModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { DriveFolderInputBar } from './components/DriveFolderInputBar';
import { DriveEmbedViewer } from './components/DriveEmbedViewer';
import { UserGuideModal } from './components/UserGuideModal';
import { GoogleSignInButton } from './components/GoogleSignInButton';
import { PlaylistOrderManager, SortMode } from './components/PlaylistOrderManager';
import {
  Search,
  Folder,
  SlidersHorizontal,
  Headphones,
  HardDrive,
  FileAudio,
  AlertTriangle,
  Key,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  ListMusic,
  FolderOpen,
} from 'lucide-react';

const DEFAULT_TARGET_FOLDER = '1ESn1qxHVscGhXQ7-eIwuyJvj5z7LoDax';

/**
 * Robust natural chapter/part number extraction for audiobook ordering
 * Handles "phan 12", "chuong 13", "chương 23 phân 2", etc.
 */
export const extractNumericOrder = (name: string): number => {
  const complexMatch = name.match(
    /(?:chương|chuong|tập|tap|phần|phan|ep|part)\s*(\d+)(?:\s*(?:phần|phan|tập|tap|ep|part)\s*(\d+))?/i
  );
  if (complexMatch) {
    const main = parseInt(complexMatch[1], 10);
    const sub = complexMatch[2] ? parseInt(complexMatch[2], 10) / 10 : 0;
    return main + sub;
  }
  const anyNum = name.match(/\d+(\.\d+)?/);
  return anyNum ? parseFloat(anyNum[0]) : 999999;
};

// Immediate playable & readable chapters for 1ESn1qxHVscGhXQ7-eIwuyJvj5z7LoDax
const INITIAL_FOLDER_STORIES: AudioStoryItem[] = [
  {
    id: 'story-ch1',
    name: 'Chuong_01_Khoi_Dau_Hanh_Trinh.mp3',
    title: 'Chương 01: Khởi Đầu Hành Trình Tu Tiên',
    chapter: 'Chương 1',
    sizeBytes: 15420000,
    formattedSize: '14.7 MB',
    modifiedTime: new Date().toISOString(),
    mimeType: 'audio/mpeg',
    folderId: DEFAULT_TARGET_FOLDER,
    folderName: 'Thư mục Truyện Audio (1ESn1qx...)',
    companionTextFileName: 'Chuong_01_Khoi_Dau_Hanh_Trinh.txt',
    audioUrl: 'https://actions.google.com/sounds/v1/ambiences/rain_heavy.ogg',
    textContent: `Chương 1: Khởi Đầu Hành Trình Tu Tiên\n\nGió thu thổi qua những rặng trúc xanh rì rào, mang theo hơi thở mát lạnh của sương mai. Tại một ngôi làng nhỏ dưới chân núi Cửu Long, thiếu niên Hàn Lập đang ngồi trên tảng đá lớn trước hiên nhà, tay mân mê một viên ngọc màu xanh lục biếc.\n\nTừ nhỏ, hắn đã nghe người trong làng kể về những vị tiên nhân có thể đạp mây cưỡi gió, vung tay dời non lấp biển. Hắn vốn chỉ là một đứa trẻ chất phác, chưa từng dám mơ một ngày mình sẽ bước chân vào thế giới huyền diệu ấy.\n\n"Hàn Lập! Mau vào ăn cơm, hôm nay trưởng thôn triệu tập thanh thiếu niên trong thôn để tham gia khảo hạch của Huyền Thiên Tông đấy!" - Giọng nói ấm áp của người mẹ từ trong bếp vọng ra.\n\nHàn Lập giật mình, vội vàng cất kỹ viên đá vào trong túi áo ngực rồi đứng dậy chạy vào nhà. Trong lòng hắn rạo rực một ngọn lửa mơ ước vừa được nhen nhóm. Cuộc đời bình lặng của một chàng trai thôn quê từ khoảnh khắc này chính thức rẽ sang một trang sử hoàn toàn mới...`,
    duration: 340,
    savedProgress: 0,
  },
  {
    id: 'story-ch2',
    name: 'Chuong_02_Linh_Duoc_Ngan_Nam.mp3',
    title: 'Chương 02: Linh Dược Ngàn Năm Và Cổ Kiếm',
    chapter: 'Chương 2',
    sizeBytes: 18920000,
    formattedSize: '18.0 MB',
    modifiedTime: new Date(Date.now() - 86400000).toISOString(),
    mimeType: 'audio/mpeg',
    folderId: DEFAULT_TARGET_FOLDER,
    folderName: 'Thư mục Truyện Audio (1ESn1qx...)',
    companionTextFileName: 'Chuong_02_Linh_Duoc_Ngan_Nam.txt',
    audioUrl: 'https://actions.google.com/sounds/v1/water/creek_flowing.ogg',
    textContent: `Chương 2: Linh Dược Ngàn Năm Và Cổ Kiếm\n\nKhu rừng rậm phía sau Huyền Thiên Tông bao phủ bởi một làn sương mù dày đặc. Từng nhánh cây cổ thụ vươn lên cao vút như những chiếc ô khổng lồ che khuất ánh mặt trời.\n\nHàn Lập thận trọng từng bước tiến sâu vào sơn cốc. Viên ngọc xanh trước ngực hắn đột nhiên phát ra ánh sáng nhè nhẹ, đập theo từng nhịp tim. Có điều gì đó kỳ lạ đang vẫy gọi hắn từ phía hang đá phía trước.\n\nKhi hắn bước vào cửa hang, một mùi hương thanh khiết lan tỏa ngào ngạt. Giữa lòng hồ nước ngầm tĩnh lặng, một đóa Cửu Diệp Huyết Liên đang tỏa ra ánh hào quang bảy màu, cạnh đó là thanh kiếm cổ rỉ sét cắm sâu vào thạch bích.\n\n"Đây chính là linh dược trong truyền thuyết sao?" - Hàn Lập ngỡ ngàng thì thào. Không ai ngờ được rằng, chính cơ duyên này đã giúp hắn mở ra cánh cửa tu chân đầu tiên trong đời...`,
    duration: 410,
    savedProgress: 45,
  },
  {
    id: 'story-ch3',
    name: 'Chuong_03_Dot_Pha_Canh_Gioi.mp3',
    title: 'Chương 03: Đột Phá Cảnh Giới Luyện Khí',
    chapter: 'Chương 3',
    sizeBytes: 16800000,
    formattedSize: '16.1 MB',
    modifiedTime: new Date(Date.now() - 172800000).toISOString(),
    mimeType: 'audio/mpeg',
    folderId: DEFAULT_TARGET_FOLDER,
    folderName: 'Thư mục Truyện Audio (1ESn1qx...)',
    companionTextFileName: 'Chuong_03_Dot_Pha_Canh_Gioi.txt',
    audioUrl: 'https://actions.google.com/sounds/v1/weather/thunder_crack.ogg',
    textContent: `Chương 3: Đột Phá Cảnh Giới Luyện Khí\n\nSau khi hấp thu linh lực từ Cửu Diệp Huyết Liên, toàn thân Hàn Lập như bốc hỏa. Những luồng khí hỗn độn cuồn cuộn chảy qua kinh mạch, rèn giũa cốt cách của hắn.\n\nHắn cắn chặt răng, ngồi xếp bằng tĩnh tọa theo khẩu quyết mà sư phụ đã truyền thụ. Từng giọt mồ hôi đen kịt bài trừ tạp chất rơi lộp bộp xuống nền đá.\n\n"Ầm!"\n\nMột tiếng nổ trầm đục vang lên trong đan điền. Linh khí quanh sơn cốc như tìm thấy nguồn cội, điên cuồng ùa vào kinh mạch hắn. Cảm giác bế tắc hoàn toàn tan biến, thay vào đó là một nguồn sức mạnh dồi dào chưa từng thấy.\n\nLuyện Khí Tầng Ba! Hắn đã chính thức vượt qua ngưỡng cửa khó khăn nhất của phàm nhân để trở thành một tu tiên giả thực thụ!`,
    duration: 380,
    savedProgress: 0,
  },
];

export default function App() {
  // Theme state persisted in localStorage
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('app_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Active View Tab: 'library' (Player + Reader) or 'embed' (Direct Google Drive folder)
  const [activeTab, setActiveTab] = useState<'library' | 'embed'>('library');

  // Drive Data State - Preloaded directly with the requested folder
  const [stories, setStories] = useState<AudioStoryItem[]>(INITIAL_FOLDER_STORIES);
  const [folders, setFolders] = useState<DriveFolder[]>([
    { id: DEFAULT_TARGET_FOLDER, name: 'Thư mục Truyện Audio (1ESn1qx...)' },
  ]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>(DEFAULT_TARGET_FOLDER);
  const [selectedFolderName, setSelectedFolderName] = useState<string>(
    'Thư mục Truyện Audio (1ESn1qx...)'
  );

  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [isScopeError, setIsScopeError] = useState(false);

  // Recent Drive Folders
  const [recentFolders, setRecentFolders] = useState<Array<{ id: string; name: string }>>(() => {
    const saved = localStorage.getItem('recent_drive_folders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [
      { id: DEFAULT_TARGET_FOLDER, name: 'Thư mục Truyện Audio (1ESn1qx...)' },
    ];
  });

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWithTextOnly, setFilterWithTextOnly] = useState(false);

  // Playlist sort mode & custom order persistence
  const [sortMode, setSortMode] = useState<SortMode>(() => {
    const saved = localStorage.getItem('app_playlist_sort_mode');
    return (saved as SortMode) || 'chapter-asc';
  });

  const [customOrderIds, setCustomOrderIds] = useState<string[]>(() => {
    const saved = localStorage.getItem(`custom_playlist_order_${DEFAULT_TARGET_FOLDER}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // Sync custom order when folder changes
  useEffect(() => {
    const saved = localStorage.getItem(`custom_playlist_order_${selectedFolderId}`);
    if (saved) {
      try {
        setCustomOrderIds(JSON.parse(saved));
      } catch {
        setCustomOrderIds([]);
      }
    } else {
      setCustomOrderIds([]);
    }
  }, [selectedFolderId]);

  const handleSelectSortMode = (mode: SortMode) => {
    setSortMode(mode);
    localStorage.setItem('app_playlist_sort_mode', mode);
  };

  const handleMoveStory = (storyId: string, direction: 'up' | 'down') => {
    setSortMode('custom');
    localStorage.setItem('app_playlist_sort_mode', 'custom');

    const currentList = [...displayedStories];
    const idx = currentList.findIndex((s) => s.id === storyId);
    if (idx < 0) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentList.length) return;

    // Swap
    const temp = currentList[idx];
    currentList[idx] = currentList[targetIdx];
    currentList[targetIdx] = temp;

    const newOrderIds = currentList.map((s) => s.id);
    setCustomOrderIds(newOrderIds);
    localStorage.setItem(`custom_playlist_order_${selectedFolderId}`, JSON.stringify(newOrderIds));
  };

  const handleReverseOrder = () => {
    setSortMode('custom');
    localStorage.setItem('app_playlist_sort_mode', 'custom');
    const reversed = [...displayedStories].reverse();
    const newOrderIds = reversed.map((s) => s.id);
    setCustomOrderIds(newOrderIds);
    localStorage.setItem(`custom_playlist_order_${selectedFolderId}`, JSON.stringify(newOrderIds));
  };

  const handleResetOrder = () => {
    setSortMode('chapter-asc');
    localStorage.setItem('app_playlist_sort_mode', 'chapter-asc');
    localStorage.removeItem(`custom_playlist_order_${selectedFolderId}`);
    setCustomOrderIds([]);
  };

  // Playback & Reader (Default to the first chapter)
  const [currentStory, setCurrentStory] = useState<AudioStoryItem | null>(INITIAL_FOLDER_STORIES[0]);
  const [isReaderOpen, setIsReaderOpen] = useState(true);
  // Stories List Visibility (Can be toggled show/hide by user)
  const [isStoriesListOpen, setIsStoriesListOpen] = useState(true);
  // Playback control state - Default to FALSE (NEVER autoplay on initial load)
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AudioStoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Total storage calculation
  const totalStorageBytes = useMemo(() => {
    return stories.reduce((acc, curr) => acc + curr.sizeBytes, 0);
  }, [stories]);

  // Load Google Drive Data
  const loadDriveData = useCallback(async (accessToken: string, targetFolderId?: string) => {
    try {
      setIsLoadingFiles(true);
      setDataError(null);
      setIsScopeError(false);

      const activeFolder = targetFolderId || selectedFolderId;

      // Fetch folders list from Drive
      const fetchedFolders = await listDriveFolders(accessToken).catch(() => []);
      setFolders((prev) => {
        const map = new Map<string, DriveFolder>();
        fetchedFolders.forEach((f) => map.set(f.id, f));
        prev.forEach((f) => {
          if (!map.has(f.id)) map.set(f.id, f);
        });
        return Array.from(map.values());
      });

      // Fetch audio stories and companion text files
      const { stories: loadedStories } = await listAudioStories(
        accessToken,
        activeFolder
      );

      if (loadedStories && loadedStories.length > 0) {
        // Map folder names to stories
        const mappedStories = loadedStories.map((story) => {
          if (story.folderId) {
            const matched = fetchedFolders.find((f) => f.id === story.folderId);
            if (matched) {
              return { ...story, folderName: matched.name };
            }
          }
          return story;
        });

        setStories(mappedStories);

        // Pick current story
        setCurrentStory((prev) => {
          if (!prev) return mappedStories[0];
          const updated = mappedStories.find((s) => s.id === prev.id);
          return updated || mappedStories[0];
        });
      } else {
        // If folder currently has no files on Drive, keep sample stories so user can preview!
        console.log('Folder is empty on Drive, maintaining preview stories.');
      }
    } catch (err: unknown) {
      console.error('Error loading drive data:', err);
      const isScope =
        (err as { isScopeError?: boolean })?.isScopeError ||
        (err instanceof Error &&
          (err.message.toLowerCase().includes('scope') ||
            err.message.toLowerCase().includes('insufficient') ||
            err.message.toLowerCase().includes('quyền') ||
            err.message.toLowerCase().includes('permission')));

      setIsScopeError(!!isScope);
      setDataError(
        isScope
          ? 'Tài khoản chưa được cấp quyền truy cập Google Drive. Vui lòng bấm "Cấp quyền Google Drive ngay" bên dưới để hoàn tất cấp quyền.'
          : err instanceof Error
          ? err.message
          : 'Lỗi đồng bộ dữ liệu từ Google Drive'
      );
    } finally {
      setIsLoadingFiles(false);
      setIsRefreshing(false);
    }
  }, [selectedFolderId]);

  // Open folder by URL or ID
  const handleOpenFolderByUrl = async (folderIdOrUrl: string) => {
    const cleanId = extractDriveFolderId(folderIdOrUrl);
    setSelectedFolderId(cleanId);

    try {
      setIsLoadingFiles(true);
      setDataError(null);

      // 1. Fetch live files directly from Google Drive folder via proxy
      const { folderTitle, stories: fetchedStories } = await fetchPublicFolderAudio(cleanId);

      setSelectedFolderName(folderTitle);

      const folderInfo = { id: cleanId, name: folderTitle };
      setFolders((prev) => {
        if (prev.some((f) => f.id === folderInfo.id)) return prev;
        return [folderInfo, ...prev];
      });

      setRecentFolders((prev) => {
        const filtered = prev.filter((f) => f.id !== folderInfo.id);
        const updated = [folderInfo, ...filtered].slice(0, 6);
        localStorage.setItem('recent_drive_folders', JSON.stringify(updated));
        return updated;
      });

      if (fetchedStories && fetchedStories.length > 0) {
        setStories(fetchedStories);
        setCurrentStory(fetchedStories[0]);
      } else {
        const currentToken = token || (await getAccessToken());
        if (currentToken) {
          await loadDriveData(currentToken, cleanId);
        }
      }
    } catch (err: unknown) {
      console.warn('Direct folder fetch error, falling back to authenticated Drive API:', err);
      const currentToken = token || (await getAccessToken());
      if (currentToken) {
        await loadDriveData(currentToken, cleanId);
      } else {
        setDataError(err instanceof Error ? err.message : 'Không thể mở thư mục này');
      }
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // On mount: Automatically load all real MP3 files from 1ESn1qxHVscGhXQ7-eIwuyJvj5z7LoDax
  useEffect(() => {
    handleOpenFolderByUrl(DEFAULT_TARGET_FOLDER);
  }, []);

  // Initialize Firebase Auth listener on mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setAccessTokenInMemory(accessToken);
        setIsLoadingAuth(false);
        loadDriveData(accessToken, selectedFolderId);
      },
      () => {
        setUser(null);
        setToken(null);
        setAccessTokenInMemory(null);
        setIsLoadingAuth(false);
      }
    );

    return () => unsubscribe();
  }, [loadDriveData, selectedFolderId]);

  // Handle Login
  const handleLogin = async () => {
    try {
      setIsLoadingAuth(true);
      setDataError(null);
      setIsScopeError(false);
      const result = await googleSignIn(true);
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        await ensureAppFolder(result.accessToken).catch(() => null);
        await loadDriveData(result.accessToken, selectedFolderId);
      }
    } catch (err: unknown) {
      console.error('Login error:', err);
      setDataError(err instanceof Error ? err.message : 'Lỗi đăng nhập Google');
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setStories(INITIAL_FOLDER_STORIES);
    setCurrentStory(INITIAL_FOLDER_STORIES[0]);
  };

  // Reload data
  const handleRefresh = async () => {
    const currentToken = token || (await getAccessToken());
    if (currentToken) {
      setIsRefreshing(true);
      await loadDriveData(currentToken, selectedFolderId);
    }
  };

  // Handle folder change
  const handleFolderChange = async (folderId: string) => {
    setSelectedFolderId(folderId);
    const matched = folders.find((f) => f.id === folderId);
    if (matched) setSelectedFolderName(matched.name);

    const currentToken = token || (await getAccessToken());
    if (currentToken) {
      await loadDriveData(currentToken, folderId);
    }
  };

  // Delete Action
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const currentToken = token || (await getAccessToken());
    if (!currentToken) return;

    try {
      setIsDeleting(true);
      await deleteDriveFile(currentToken, deleteTarget.id);

      if (deleteTarget.companionTextFileId) {
        await deleteDriveFile(currentToken, deleteTarget.companionTextFileId).catch(() => null);
      }

      setStories((prev) => prev.filter((s) => s.id !== deleteTarget.id));
      if (currentStory?.id === deleteTarget.id) {
        const remaining = stories.filter((s) => s.id !== deleteTarget.id);
        setCurrentStory(remaining.length > 0 ? remaining[0] : null);
      }

      setDeleteTarget(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Lỗi xóa file trên Google Drive');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle Companion Text Updated
  const handleCompanionUpdated = (
    storyId: string,
    textFileId: string,
    textFileName: string
  ) => {
    setStories((prev) =>
      prev.map((s) =>
        s.id === storyId
          ? {
              ...s,
              companionTextFileId: textFileId,
              companionTextFileName: textFileName,
            }
          : s
      )
    );
    if (currentStory && currentStory.id === storyId) {
      setCurrentStory((prev) =>
        prev
          ? {
              ...prev,
              companionTextFileId: textFileId,
              companionTextFileName: textFileName,
            }
          : null
      );
    }
  };

  // Filtered and Sorted Stories
  const displayedStories = useMemo(() => {
    let result = [...stories];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q) ||
          (s.folderName && s.folderName.toLowerCase().includes(q))
      );
    }

    if (filterWithTextOnly) {
      result = result.filter((s) => !!s.companionTextFileName);
    }

    if (sortMode === 'custom' && customOrderIds.length > 0) {
      const orderMap = new Map(customOrderIds.map((id, index) => [id, index]));
      result.sort((a, b) => {
        const idxA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999999;
        const idxB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999999;
        if (idxA !== idxB) return idxA - idxB;
        return extractNumericOrder(a.name || a.title) - extractNumericOrder(b.name || b.title);
      });
    } else if (sortMode === 'chapter-asc') {
      result.sort((a, b) => extractNumericOrder(a.name || a.title) - extractNumericOrder(b.name || b.title));
    } else if (sortMode === 'chapter-desc') {
      result.sort((a, b) => extractNumericOrder(b.name || b.title) - extractNumericOrder(a.name || a.title));
    } else if (sortMode === 'name-asc') {
      result.sort((a, b) => (a.title || a.name).localeCompare(b.title || b.name, 'vi'));
    } else if (sortMode === 'name-desc') {
      result.sort((a, b) => (b.title || b.name).localeCompare(a.title || a.name, 'vi'));
    }

    return result;
  }, [stories, searchQuery, filterWithTextOnly, sortMode, customOrderIds]);

  // Playlist navigation
  const currentIndex = useMemo(() => {
    if (!currentStory) return -1;
    return displayedStories.findIndex((s) => s.id === currentStory.id);
  }, [currentStory, displayedStories]);

  const handlePlayStory = (story: AudioStoryItem) => {
    if (currentStory?.id === story.id) {
      setIsPlaying((prev) => !prev);
    } else {
      setCurrentStory(story);
      setIsPlaying(true);
      setAutoPlay(true);
    }
  };

  const handleNextTrack = () => {
    if (currentIndex >= 0 && currentIndex < displayedStories.length - 1) {
      setCurrentStory(displayedStories[currentIndex + 1]);
      setIsPlaying(true);
      setAutoPlay(true);
    }
  };

  const handlePrevTrack = () => {
    if (currentIndex > 0) {
      setCurrentStory(displayedStories[currentIndex - 1]);
      setIsPlaying(true);
      setAutoPlay(true);
    }
  };

  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
    e.dataTransfer.effectAllowed = 'move';
    setDraggedIdx(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIdx !== index) {
      setDragOverIdx(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIdx(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const sourceIndexStr = e.dataTransfer.getData('text/plain');
    const sourceIndex = sourceIndexStr !== '' ? parseInt(sourceIndexStr, 10) : draggedIdx;

    setDraggedIdx(null);
    setDragOverIdx(null);

    if (sourceIndex === null || sourceIndex === undefined || isNaN(sourceIndex) || sourceIndex === targetIndex) {
      return;
    }

    const updated = [...displayedStories];
    const [movedItem] = updated.splice(sourceIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    setSortMode('custom');
    localStorage.setItem('app_playlist_sort_mode', 'custom');
    const newOrderIds = updated.map((s) => s.id);
    setCustomOrderIds(newOrderIds);
    localStorage.setItem(`custom_playlist_order_${selectedFolderId}`, JSON.stringify(newOrderIds));
    setStories(updated);
  };

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleMoveToPosition = (fromIndex: number, targetPosition: number) => {
    const targetIndex = targetPosition - 1;
    if (targetIndex < 0 || targetIndex >= displayedStories.length || targetIndex === fromIndex) {
      return;
    }

    const updated = [...displayedStories];
    const [movedItem] = updated.splice(fromIndex, 1);
    updated.splice(targetIndex, 0, movedItem);

    setSortMode('custom');
    localStorage.setItem('app_playlist_sort_mode', 'custom');
    const newOrderIds = updated.map((s) => s.id);
    setCustomOrderIds(newOrderIds);
    localStorage.setItem(`custom_playlist_order_${selectedFolderId}`, JSON.stringify(newOrderIds));
    setStories(updated);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar
        user={user}
        isLoadingAuth={isLoadingAuth}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenFolderManager={() => setIsFolderModalOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        totalStories={stories.length}
        totalStorageStr={formatBytes(totalStorageBytes)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 pb-36 space-y-5">
        {/* Main Library & Reader Container */}
        <div className="space-y-5">
          {/* Search, Filter & Folder Bar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4 transition-colors">
            {/* Search bar */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm truyện, chương, tập..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  Xóa
                </button>
              )}
            </div>

            {/* Folder Info & External Link */}
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700">
              <Folder className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px] sm:max-w-xs">
                {selectedFolderName}
              </span>
              <a
                href={`https://drive.google.com/drive/folders/${extractDriveFolderId(selectedFolderId)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1 font-medium ml-1"
                title="Mở thư mục trên Google Drive"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

              {/* Folder Selector and Sorting */}
              <div className="w-full md:w-auto flex flex-wrap items-center gap-2.5">
                {/* Folder dropdown */}
                <div className="flex items-center gap-1.5">
                  <Folder className="w-4 h-4 text-amber-500" />
                  <select
                    value={selectedFolderId}
                    onChange={(e) => handleFolderChange(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                    <option value="all">Tất cả Google Drive</option>
                  </select>
                </div>

                {/* Sort dropdown */}
                <div className="flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={sortMode}
                    onChange={(e) => handleSelectSortMode(e.target.value as SortMode)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
                  >
                    <option value="chapter-asc">Chương tăng dần (1 → N)</option>
                    <option value="chapter-desc">Chương giảm dần (N → 1)</option>
                    <option value="name-asc">Tên tệp A-Z</option>
                    <option value="name-desc">Tên tệp Z-A</option>
                    <option value="custom">Tự xếp theo ý tôi 🖐️</option>
                  </select>
                </div>

                {/* Text only filter toggle */}
                <button
                  onClick={() => setFilterWithTextOnly(!filterWithTextOnly)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors border ${
                    filterWithTextOnly
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {filterWithTextOnly ? '✓ Có nội dung chữ' : 'Tất cả'}
                </button>
              </div>
            </div>

            {/* Error banner if any */}
            {dataError && (
              <div
                className={`p-4 rounded-2xl text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs ${
                  isScopeError
                    ? 'bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                    : 'bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {isScopeError ? (
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 dark:text-rose-400" />
                  )}
                  <span className="font-medium">{dataError}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isScopeError ? (
                    <button
                      onClick={handleLogin}
                      disabled={isLoadingAuth}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>{isLoadingAuth ? 'Đang mở cấp quyền...' : 'Cấp quyền Google Drive ngay'}</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleRefresh}
                      className="font-semibold underline hover:text-rose-900 dark:hover:text-rose-300 text-xs px-2 py-1"
                    >
                      Thử lại
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Collapsed Story List Banner when hidden */}
            {!isStoriesListOpen && (
              <div className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-xs transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <ListMusic className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <span>Danh sách tập truyện đang ẩn ({displayedStories.length} tập)</span>
                      <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
                        • Bấm "Hiện danh sách" để duyệt hoặc chọn tập khác
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsStoriesListOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Hiện danh sách truyện</span>
                </button>
              </div>
            )}

            {/* Content Layout: Split Grid (Left: Stories List, Right: Companion Reader) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Stories Library (Can be hidden / shown) */}
              {isStoriesListOpen && (
                <div className={`${isReaderOpen ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <FileAudio className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <span>Danh sách tập truyện ({displayedStories.length})</span>
                    </h3>

                    <div className="flex items-center gap-2">
                      {/* Hide story list button */}
                      <button
                        type="button"
                        onClick={() => setIsStoriesListOpen(false)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                        title="Ẩn danh sách tập truyện"
                      >
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Ẩn danh sách</span>
                      </button>

                      {user && (
                        <button
                          onClick={() => setIsUploadOpen(true)}
                          className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer ml-1"
                        >
                          + Tải thêm tập mới vào Drive
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Playlist Ordering & Sorting Manager */}
                  <PlaylistOrderManager
                    sortMode={sortMode}
                    onSelectSortMode={handleSelectSortMode}
                    onReverseOrder={handleReverseOrder}
                    onResetOrder={handleResetOrder}
                    totalStories={displayedStories.length}
                  />

                  {/* Stories Loading State */}
                  {isLoadingFiles ? (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/90 dark:border-slate-800 p-12 text-center transition-colors">
                      <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Đang đọc cơ sở dữ liệu từ Google Drive của bạn...
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        Đang tìm kiếm các tệp âm thanh MP3 và tệp nội dung liên quan
                      </p>
                    </div>
                  ) : (
                    /* Story Items Grid */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {displayedStories.map((story, idx) => (
                        <StoryCard
                          key={story.id}
                          story={story}
                          index={idx + 1}
                          totalItems={displayedStories.length}
                          isCurrent={currentStory?.id === story.id}
                          isPlaying={currentStory?.id === story.id && isPlaying}
                          onPlay={handlePlayStory}
                          onSelectForReader={(s) => {
                            setCurrentStory(s);
                            setIsReaderOpen(true);
                          }}
                          onRequestDelete={(s) => setDeleteTarget(s)}
                          onMoveUp={() => handleMoveStory(story.id, 'up')}
                          onMoveDown={() => handleMoveStory(story.id, 'down')}
                          onMoveToPosition={(pos) => handleMoveToPosition(idx, pos)}
                          canMoveUp={idx > 0}
                          canMoveDown={idx < displayedStories.length - 1}
                          showReorderControls={sortMode === 'custom'}
                          isDragging={draggedIdx === idx}
                          isDragOver={dragOverIdx === idx && draggedIdx !== idx}
                          onDragStart={(e) => handleDragStart(e, idx)}
                          onDragOver={(e) => handleDragOver(e, idx)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, idx)}
                          onDragEnd={handleDragEnd}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Right Column: Companion Reader (Synchronized story reading) */}
              {isReaderOpen && (
                <div className={`${isStoriesListOpen ? 'lg:col-span-5' : 'lg:col-span-12'} sticky top-20 h-[calc(100vh-160px)] min-h-[500px]`}>
                  <StoryReader
                    currentStory={currentStory}
                    token={token || ''}
                    onCompanionUpdated={handleCompanionUpdated}
                  />
                </div>
              )}
            </div>
          </div>
      </main>

      {/* Persistent Audio Player at bottom */}
      {currentStory && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <AudioPlayer
            currentStory={currentStory}
            token={token || ''}
            autoPlay={autoPlay}
            isPlaying={isPlaying}
            onPlayPauseToggle={(p) => setIsPlaying(p)}
            onNextTrack={handleNextTrack}
            onPrevTrack={handlePrevTrack}
            hasNext={currentIndex < displayedStories.length - 1}
            hasPrev={currentIndex > 0}
            onToggleReader={() => setIsReaderOpen(!isReaderOpen)}
            isReaderOpen={isReaderOpen}
            onToggleStoriesList={() => setIsStoriesListOpen(!isStoriesListOpen)}
            isStoriesListOpen={isStoriesListOpen}
          />
        </div>
      )}

      {/* Upload Story Modal */}
      {user && token && (
        <UploadStoryModal
          isOpen={isUploadOpen}
          onClose={() => setIsUploadOpen(false)}
          token={token}
          folders={folders}
          defaultFolderId={selectedFolderId !== 'all' ? selectedFolderId : undefined}
          onUploadSuccess={() => handleRefresh()}
        />
      )}

      {/* Folder Manager Modal */}
      {user && token && (
        <FolderManagerModal
          isOpen={isFolderModalOpen}
          onClose={() => setIsFolderModalOpen(false)}
          token={token}
          folders={folders}
          onFolderCreated={(newFolder) => {
            setFolders((prev) => [newFolder, ...prev]);
            setSelectedFolderId(newFolder.id);
            handleRefresh();
          }}
        />
      )}

      {/* User Guide Modal */}
      <UserGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onTryExampleLink={() => {
          handleOpenFolderByUrl(DEFAULT_TARGET_FOLDER);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        item={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
