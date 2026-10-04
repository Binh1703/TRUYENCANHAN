import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Clock,
  Bookmark as BookmarkIcon,
  Repeat,
  Repeat1,
  Maximize2,
  Minimize2,
  AlertCircle,
  Folder,
  ListMusic,
} from 'lucide-react';
import { AudioStoryItem, Bookmark } from '../types/drive';
import { getAudioBlobUrl, formatTime } from '../services/driveService';

interface AudioPlayerProps {
  currentStory: AudioStoryItem | null;
  token: string;
  autoPlay?: boolean;
  isPlaying?: boolean;
  onPlayPauseToggle?: (playing: boolean) => void;
  onNextTrack?: () => void;
  onPrevTrack?: () => void;
  hasNext: boolean;
  hasPrev: boolean;
  onToggleReader?: () => void;
  isReaderOpen?: boolean;
  onToggleStoriesList?: () => void;
  isStoriesListOpen?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  currentStory,
  token,
  autoPlay = false,
  isPlaying: externalIsPlaying,
  onPlayPauseToggle,
  onNextTrack,
  onPrevTrack,
  hasNext,
  hasPrev,
  onToggleReader,
  isReaderOpen,
  onToggleStoriesList,
  isStoriesListOpen = true,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [loopMode, setLoopMode] = useState<'off' | 'all' | 'one'>('off');

  // Loading & error state
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  // Sleep Timer
  const [sleepTimerMinutes, setSleepTimerMinutes] = useState<number | null>(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState<number | null>(null);
  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [newBookmarkNote, setNewBookmarkNote] = useState('');

  // Expand full-screen / immersive player mode
  const [isExpanded, setIsExpanded] = useState(false);

  // Load bookmarks from localStorage
  useEffect(() => {
    if (currentStory) {
      const stored = localStorage.getItem(`bookmarks_${currentStory.id}`);
      if (stored) {
        try {
          setBookmarks(JSON.parse(stored));
        } catch {
          setBookmarks([]);
        }
      } else {
        setBookmarks([]);
      }
    }
  }, [currentStory]);

  // Handle Loading Audio Source when currentStory changes
  useEffect(() => {
    if (!currentStory) {
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    let isCancelled = false;

    const loadAudio = async () => {
      try {
        setIsLoadingAudio(true);
        setAudioError(null);

        let audioSrc = '';
        if (currentStory.audioUrl) {
          audioSrc = currentStory.audioUrl;
        } else if (token) {
          audioSrc = await getAudioBlobUrl(token, currentStory.id);
        } else {
          throw new Error('Vui lòng kết nối Google Drive để phát tệp này.');
        }

        if (isCancelled) return;

        if (audioRef.current) {
          audioRef.current.src = audioSrc;
          audioRef.current.playbackRate = playbackRate;
          audioRef.current.volume = isMuted ? 0 : volume;

          // Check if there was saved progress
          const savedPos = localStorage.getItem(`audio_pos_${currentStory.id}`);
          const startSeconds = savedPos ? parseFloat(savedPos) : 0;

          // Audio loaded metadata
          audioRef.current.onloadedmetadata = () => {
            if (isCancelled) return;
            setDuration(audioRef.current?.duration || 0);

            if (startSeconds > 0 && startSeconds < (audioRef.current?.duration || 0) - 5) {
              audioRef.current!.currentTime = startSeconds;
              setCurrentTime(startSeconds);
            }

            // ONLY play if autoPlay is explicitly true (NEVER autoplay on initial page load)
            if (autoPlay) {
              audioRef.current
                ?.play()
                .then(() => {
                  setIsPlaying(true);
                  onPlayPauseToggle?.(true);
                })
                .catch(() => {
                  setIsPlaying(false);
                  onPlayPauseToggle?.(false);
                });
            } else {
              setIsPlaying(false);
              onPlayPauseToggle?.(false);
            }
          };
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setAudioError(
            err instanceof Error ? err.message : 'Không thể tải luồng phát âm thanh từ Google Drive'
          );
          setIsPlaying(false);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingAudio(false);
        }
      }
    };

    loadAudio();

    return () => {
      isCancelled = true;
    };
  }, [currentStory, token]);

  // Sleep Timer countdown
  useEffect(() => {
    if (sleepTimerRemaining === null || sleepTimerRemaining <= 0) return;

    const timer = setInterval(() => {
      setSleepTimerRemaining((prev) => {
        if (prev === null || prev <= 1) {
          // Pause audio when time expires
          if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
          }
          setSleepTimerMinutes(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [sleepTimerRemaining]);

  // Sync with external isPlaying state if controlled from outside
  useEffect(() => {
    if (externalIsPlaying !== undefined && audioRef.current) {
      if (externalIsPlaying && audioRef.current.paused) {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      } else if (!externalIsPlaying && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [externalIsPlaying]);

  // Play / Pause Toggle
  const togglePlay = () => {
    if (!audioRef.current || !currentStory) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      onPlayPauseToggle?.(false);
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          onPlayPauseToggle?.(true);
        })
        .catch((err) => {
          console.error('Play failed:', err);
          setIsPlaying(false);
          onPlayPauseToggle?.(false);
        });
    }
  };

  // Time update listener
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const cur = audioRef.current.currentTime;
    setCurrentTime(cur);

    // Save progress periodically to localStorage
    if (currentStory && Math.floor(cur) % 3 === 0) {
      localStorage.setItem(`audio_pos_${currentStory.id}`, cur.toString());
    }
  };

  // Track Ended
  const handleEnded = () => {
    if (loopMode === 'one') {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else if (loopMode === 'all' || hasNext) {
      onNextTrack?.();
    } else {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  // Seek handler
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  // Skip relative
  const skip = (delta: number) => {
    if (!audioRef.current) return;
    const newTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + delta));
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  // Volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  // Change playback speed
  const changeSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  // Add Bookmark
  const addBookmark = () => {
    if (!currentStory) return;
    const newBm: Bookmark = {
      id: Date.now().toString(),
      storyId: currentStory.id,
      storyTitle: currentStory.title,
      timestamp: currentTime,
      label: newBookmarkNote.trim() || `Mốc ${formatTime(currentTime)}`,
      createdAt: Date.now(),
    };
    const updated = [newBm, ...bookmarks];
    setBookmarks(updated);
    localStorage.setItem(`bookmarks_${currentStory.id}`, JSON.stringify(updated));
    setNewBookmarkNote('');
  };

  const jumpToBookmark = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      if (!isPlaying) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const deleteBookmark = (bmId: string) => {
    if (!currentStory) return;
    const updated = bookmarks.filter((b) => b.id !== bmId);
    setBookmarks(updated);
    localStorage.setItem(`bookmarks_${currentStory.id}`, JSON.stringify(updated));
  };

  const setSleepTimer = (mins: number) => {
    setSleepTimerMinutes(mins);
    setSleepTimerRemaining(mins * 60);
    setIsSleepModalOpen(false);
  };

  const cancelSleepTimer = () => {
    setSleepTimerMinutes(null);
    setSleepTimerRemaining(null);
    setIsSleepModalOpen(false);
  };

  if (!currentStory) return null;

  return (
    <div className="bg-slate-900 text-white border-t border-slate-800 shadow-2xl transition-all duration-300">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={() => setAudioError('Lỗi đọc dữ liệu phát âm thanh')}
      />

      {/* Error Notice */}
      {audioError && (
        <div className="bg-rose-950/80 border-b border-rose-800 px-4 py-2 text-xs text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{audioError}</span>
          </div>
          <button
            onClick={() => setAudioError(null)}
            className="text-xs underline hover:text-white"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Track Info */}
        <div className="flex items-center gap-3.5 w-full md:w-1/4 min-w-0">
          <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0 flex items-center justify-center shadow-md shadow-indigo-500/20 overflow-hidden">
            {isPlaying ? (
              <div className="flex items-end gap-0.5 h-6">
                <span className="w-1 bg-white rounded-full animate-eq-1" />
                <span className="w-1 bg-white rounded-full animate-eq-2" />
                <span className="w-1 bg-white rounded-full animate-eq-3" />
                <span className="w-1 bg-white rounded-full animate-eq-4" />
              </div>
            ) : (
              <Play className="w-5 h-5 text-white ml-0.5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-semibold text-slate-100 truncate">
              {currentStory.title}
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="truncate">{currentStory.formattedSize}</span>
              {currentStory.folderName && (
                <span className="flex items-center gap-1 text-amber-400 truncate">
                  <Folder className="w-3 h-3" />
                  {currentStory.folderName}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center Controls & Progress Bar */}
        <div className="w-full md:w-2/4 flex flex-col items-center gap-1.5">
          {/* Action Buttons */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Loop Toggle */}
            <button
              onClick={() => {
                if (loopMode === 'off') setLoopMode('all');
                else if (loopMode === 'all') setLoopMode('one');
                else setLoopMode('off');
              }}
              className={`p-1.5 rounded-lg transition-colors ${
                loopMode !== 'off'
                  ? 'text-indigo-400 bg-indigo-950/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={
                loopMode === 'one'
                  ? 'Lặp lại 1 tập'
                  : loopMode === 'all'
                  ? 'Lặp lại danh sách'
                  : 'Tắt lặp'
              }
            >
              {loopMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            </button>

            {/* Skip Back 10s */}
            <button
              onClick={() => skip(-10)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              title="Lùi lại 10 giây"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Prev Track */}
            <button
              onClick={onPrevTrack}
              disabled={!hasPrev}
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Tập trước"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              disabled={isLoadingAudio}
              className="w-11 h-11 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition-transform active:scale-95 disabled:opacity-50"
            >
              {isLoadingAudio ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </button>

            {/* Next Track */}
            <button
              onClick={onNextTrack}
              disabled={!hasNext}
              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Tập kế tiếp"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            {/* Skip Forward 10s */}
            <button
              onClick={() => skip(10)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
              title="Tua tới 10 giây"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Sleep Timer Indicator */}
            <button
              onClick={() => setIsSleepModalOpen(true)}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 transition-colors ${
                sleepTimerRemaining !== null
                  ? 'text-amber-400 bg-amber-950/60 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Hẹn giờ tắt (Sleep Timer)"
            >
              <Clock className="w-4 h-4" />
              {sleepTimerRemaining !== null && (
                <span>{Math.ceil(sleepTimerRemaining / 60)}p</span>
              )}
            </button>
          </div>

          {/* Scrubber Progress Bar */}
          <div className="w-full flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400 w-10 text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:h-2 transition-all"
            />
            <span className="text-xs font-mono text-slate-400 w-10">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Right Tools: Speed, Volume, Bookmark, Reader toggle */}
        <div className="w-full md:w-1/4 flex items-center justify-end gap-2.5">
          {/* Speed selector */}
          <div className="relative group">
            <button className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-mono font-medium rounded-lg text-slate-300">
              {playbackRate}x
            </button>
            <div className="absolute bottom-full right-0 mb-2 hidden group-hover:flex flex-col bg-slate-800 border border-slate-700 rounded-xl p-1 shadow-xl z-20">
              {[0.75, 1, 1.25, 1.5, 1.75, 2].map((r) => (
                <button
                  key={r}
                  onClick={() => changeSpeed(r)}
                  className={`px-3 py-1 text-xs text-left rounded-lg transition-colors ${
                    playbackRate === r
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {r}x
                </button>
              ))}
            </div>
          </div>

          {/* Volume */}
          <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
            <button
              onClick={toggleMute}
              className="p-1 hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>

          {/* Bookmark Button */}
          <button
            onClick={() => setShowBookmarks(!showBookmarks)}
            className={`p-1.5 rounded-lg transition-colors ${
              bookmarks.length > 0
                ? 'text-amber-400 bg-amber-950/40'
                : 'text-slate-400 hover:text-white'
            }`}
            title={`Đánh dấu mốc nghe (${bookmarks.length})`}
          >
            <BookmarkIcon className="w-4 h-4" />
          </button>

          {/* Toggle Stories List button */}
          {onToggleStoriesList && (
            <button
              onClick={onToggleStoriesList}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isStoriesListOpen
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
              title={isStoriesListOpen ? 'Ẩn danh sách tập truyện' : 'Hiện danh sách tập truyện'}
            >
              <ListMusic className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isStoriesListOpen ? 'Ẩn DS' : 'Hiện DS'}
              </span>
            </button>
          )}

          {/* Toggle Companion Reader button */}
          {onToggleReader && (
            <button
              onClick={onToggleReader}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isReaderOpen
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {isReaderOpen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">
                {isReaderOpen ? 'Thu gọn chữ' : 'Đọc chữ'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Bookmarks Drawer / Panel */}
      {showBookmarks && (
        <div className="bg-slate-950/90 border-t border-slate-800 p-4 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <BookmarkIcon className="w-3.5 h-3.5 text-amber-400" />
              Các mốc thời gian đã đánh dấu ({bookmarks.length})
            </h5>
            <button
              onClick={() => setShowBookmarks(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Đóng
            </button>
          </div>

          {/* Add bookmark form */}
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newBookmarkNote}
              onChange={(e) => setNewBookmarkNote(e.target.value)}
              placeholder={`Ghi chú tại phút ${formatTime(currentTime)} (VD: Đoạn giao chiến hấp dẫn)`}
              className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            />
            <button
              onClick={addBookmark}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition-colors"
            >
              + Đánh dấu tại {formatTime(currentTime)}
            </button>
          </div>

          {/* List of bookmarks */}
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {bookmarks.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Chưa có mốc đánh dấu nào</p>
            ) : (
              bookmarks.map((bm) => (
                <div
                  key={bm.id}
                  className="flex items-center gap-2 px-3 py-1 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs"
                >
                  <button
                    onClick={() => jumpToBookmark(bm.timestamp)}
                    className="font-mono text-indigo-400 hover:underline"
                  >
                    {formatTime(bm.timestamp)}
                  </button>
                  <span className="text-slate-300 max-w-xs truncate">{bm.label}</span>
                  <button
                    onClick={() => deleteBookmark(bm.id)}
                    className="text-slate-500 hover:text-rose-400 font-bold ml-1"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Sleep Timer Modal */}
      {isSleepModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-slate-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm">Hẹn giờ tắt tự động</h4>
                <p className="text-xs text-slate-400">
                  Tự động dừng phát sau khi hết thời gian
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {[15, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  onClick={() => setSleepTimer(mins)}
                  className={`p-3 rounded-xl border text-sm font-semibold transition-all ${
                    sleepTimerMinutes === mins
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
                  }`}
                >
                  {mins} phút
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              {sleepTimerRemaining !== null ? (
                <button
                  onClick={cancelSleepTimer}
                  className="text-xs text-rose-400 hover:underline"
                >
                  Hủy hẹn giờ
                </button>
              ) : (
                <div />
              )}
              <button
                onClick={() => setIsSleepModalOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-semibold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
