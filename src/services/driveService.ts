import { DriveFile, DriveFolder, AudioStoryItem } from '../types/drive';

// In-memory cache for audio object URLs to prevent redundant downloads
const audioBlobUrlCache = new Map<string, string>();

export const formatBytes = (bytes: number, decimals = 1): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  const mDisplay = m < 10 ? `0${m}` : `${m}`;
  const sDisplay = s < 10 ? `0${s}` : `${s}`;

  if (h > 0) {
    const hDisplay = h < 10 ? `0${h}` : `${h}`;
    return `${hDisplay}:${mDisplay}:${sDisplay}`;
  }
  return `${mDisplay}:${sDisplay}`;
};

export class DriveApiError extends Error {
  isScopeError: boolean;
  status: number;

  constructor(message: string, status: number, isScopeError = false) {
    super(message);
    this.name = 'DriveApiError';
    this.status = status;
    this.isScopeError = isScopeError;
  }
}

const parseDriveError = async (res: Response, defaultMessage: string): Promise<DriveApiError> => {
  const data = await res.json().catch(() => ({}));
  const rawMsg = data.error?.message || `${defaultMessage} (${res.status} ${res.statusText})`;
  const isInsufficientScope =
    res.status === 401 ||
    res.status === 403 ||
    rawMsg.toLowerCase().includes('insufficient') ||
    rawMsg.toLowerCase().includes('scope') ||
    rawMsg.toLowerCase().includes('permission');

  if (isInsufficientScope) {
    return new DriveApiError(
      'Tài khoản Google chưa được cấp quyền truy cập Google Drive. Vui lòng bấm nút "Cấp quyền truy cập Google Drive" bên dưới để hoàn tất.',
      res.status,
      true
    );
  }

  return new DriveApiError(rawMsg, res.status, false);
};

/**
 * List all folders in Google Drive
 */
export const listDriveFolders = async (token: string): Promise<DriveFolder[]> => {
  const query = "mimeType = 'application/vnd.google-apps.folder' and trashed = false";
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&pageSize=50&orderBy=name`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw await parseDriveError(res, 'Lỗi tải danh mục thư mục');
  }

  const data = await res.json();
  return (data.files || []).map((f: { id: string; name: string }) => ({
    id: f.id,
    name: f.name,
  }));
};

/**
 * Create a new folder in Google Drive
 */
export const createDriveFolder = async (
  token: string,
  name: string,
  parentId?: string
): Promise<DriveFolder> => {
  const metadata: { name: string; mimeType: string; parents?: string[] } = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) {
    metadata.parents = [parentId];
  }

  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Lỗi tạo thư mục: ${res.statusText}`);
  }

  const data = await res.json();
  return { id: data.id, name: data.name };
};

/**
 * Find or create a dedicated "Truyện Audio (DriveAudio)" folder
 */
export const ensureAppFolder = async (token: string): Promise<DriveFolder> => {
  const query = "mimeType = 'application/vnd.google-apps.folder' and name = 'Truyện Audio' and trashed = false";
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.ok) {
    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return { id: data.files[0].id, name: data.files[0].name };
    }
  }

  // Create new folder
  return await createDriveFolder(token, 'Truyện Audio');
};

/**
 * Extract Google Drive Folder ID from a full URL or direct ID
 * Examples:
 * - https://drive.google.com/drive/folders/1ESn1qxHVscGhXQ7-eIwuyJvj5z7LoDax
 * - https://drive.google.com/drive/u/0/folders/1ESn1qxHVscGhXQ7-eIwuyJvj5z7LoDax?usp=sharing
 * - 1ESn1qxHVscGhXQ7-eIwuyJvj5z7LoDax
 */
export const extractDriveFolderId = (input: string): string => {
  const trimmed = input.trim();
  const match = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return match[1];
  }
  const idMatch = trimmed.match(/^[a-zA-Z0-9_-]{15,}$/);
  if (idMatch) {
    return idMatch[0];
  }
  return trimmed;
};

/**
 * Fetch all audio files directly from any Google Drive folder (public or shared)
 */
export const fetchPublicFolderAudio = async (
  folderId: string
): Promise<{ folderTitle: string; stories: AudioStoryItem[]; subfolders: DriveFolder[] }> => {
  const cleanId = extractDriveFolderId(folderId);
  const res = await fetch(`/api/drive/public-folder/${cleanId}`);

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Không thể đọc thư mục Google Drive (${res.status})`);
  }

  const data = await res.json();
  const folderTitle = data.folderTitle || 'Thư mục Google Drive';

  const subfolders: DriveFolder[] = (data.subfolders || []).map((sf: { id: string; name: string }) => ({
    id: sf.id,
    name: sf.name,
  }));

  const stories: AudioStoryItem[] = (data.files || []).map((file: { id: string; name: string }) => {
    let title = file.name.replace(/\.[^/.]+$/, '');
    let chapter = '';
    const chapterMatch = title.match(/(chương|chuong|tập|tap|hồi|hoi|phần|phan|ep|episode|part)\s*(\d+[-_0-9]*)/i);
    if (chapterMatch) {
      chapter = `${chapterMatch[1]} ${chapterMatch[2]}`;
    }

    const isFolderItem = /shared folder|folder|thư mục/i.test(file.name);

    return {
      id: file.id,
      name: file.name,
      title: title.charAt(0).toUpperCase() + title.slice(1),
      chapter,
      sizeBytes: 15000000,
      formattedSize: isFolderItem ? 'Thư mục chứa tệp' : 'Audio MP3',
      modifiedTime: new Date().toISOString(),
      mimeType: isFolderItem ? 'application/vnd.google-apps.folder' : 'audio/mpeg',
      webViewLink: `https://drive.google.com/file/d/${file.id}/view`,
      audioUrl: `/api/drive/stream/${file.id}`,
      folderId: cleanId,
      folderName: folderTitle,
      savedProgress: 0,
      isFolder: isFolderItem,
    };
  });

  return { folderTitle, stories, subfolders };
};

/**
 * Get folder metadata by ID
 */
export const getFolderById = async (token: string, folderId: string): Promise<DriveFolder> => {
  const cleanId = extractDriveFolderId(folderId);
  const url = `https://www.googleapis.com/drive/v3/files/${cleanId}?fields=id,name,mimeType&supportsAllDrives=true`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw await parseDriveError(res, 'Không thể tìm thấy thông tin thư mục này trên Google Drive');
  }

  const data = await res.json();
  return {
    id: data.id,
    name: data.name,
  };
};

/**
 * Load audio files and text files from Google Drive
 */
export const listAudioStories = async (
  token: string,
  folderId?: string
): Promise<{ stories: AudioStoryItem[]; textFiles: DriveFile[] }> => {
  let query = 'trashed = false and (';
  // Audio MIME types and common extensions
  query += "mimeType contains 'audio/' or name contains '.mp3' or name contains '.m4a' or name contains '.wav' or name contains '.aac' or name contains '.ogg' or name contains '.flac'";
  // Also fetch text companion files (.txt, .md, text/plain)
  query += " or mimeType = 'text/plain' or name contains '.txt' or name contains '.md'";
  query += ')';

  if (folderId && folderId !== 'all') {
    const cleanFolderId = extractDriveFolderId(folderId);
    query = `'${cleanFolderId}' in parents and ${query}`;
  }

  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
    query
  )}&fields=files(id,name,mimeType,size,createdTime,modifiedTime,webViewLink,parents,description)&pageSize=150&orderBy=name&supportsAllDrives=true&includeItemsFromAllDrives=true`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw await parseDriveError(res, 'Lỗi tải danh sách file từ Drive');
  }

  const data = await res.json();
  const allFiles: DriveFile[] = data.files || [];

  const audioFiles: DriveFile[] = [];
  const textFiles: DriveFile[] = [];

  for (const file of allFiles) {
    const isAudio =
      file.mimeType.startsWith('audio/') ||
      /\.(mp3|m4a|wav|aac|ogg|flac)$/i.test(file.name);
    const isText =
      file.mimeType === 'text/plain' ||
      /\.(txt|md|lrc)$/i.test(file.name);

    if (isAudio) {
      audioFiles.push(file);
    } else if (isText) {
      textFiles.push(file);
    }
  }

  // Build audio stories and pair with companion text files if present
  const stories: AudioStoryItem[] = audioFiles.map((audio) => {
    const baseName = audio.name.replace(/\.[^/.]+$/, '').trim().toLowerCase();
    
    // Look for matching companion text file
    const matchedText = textFiles.find((txt) => {
      const txtBaseName = txt.name.replace(/\.[^/.]+$/, '').trim().toLowerCase();
      return (
        txtBaseName === baseName ||
        txtBaseName === `${baseName}_content` ||
        txtBaseName === `${baseName}_transcript` ||
        txtBaseName === `${baseName}_lyrics`
      );
    });

    const sizeNum = parseInt(audio.size || '0', 10);

    // Extract cleaner title and chapter if available
    let title = audio.name.replace(/\.[^/.]+$/, '');
    let chapter = '';
    const chapterMatch = title.match(/(chương|chuong|tập|tap|hồi|hoi|phần|ep|episode|part)\s*(\d+[-_0-9]*)/i);
    if (chapterMatch) {
      chapter = `${chapterMatch[1]} ${chapterMatch[2]}`;
    }

    // Retrieve saved progress from localStorage if any
    const saved = localStorage.getItem(`audio_pos_${audio.id}`);
    const savedProgress = saved ? parseFloat(saved) : 0;

    return {
      id: audio.id,
      name: audio.name,
      title,
      chapter,
      sizeBytes: sizeNum,
      formattedSize: formatBytes(sizeNum),
      modifiedTime: audio.modifiedTime || audio.createdTime || '',
      mimeType: audio.mimeType,
      webViewLink: audio.webViewLink,
      folderId: audio.parents?.[0],
      companionTextFileId: matchedText?.id,
      companionTextFileName: matchedText?.name,
      savedProgress,
    };
  });

  return { stories, textFiles };
};

/**
 * Fetch audio stream as a blob URL
 */
export const getAudioBlobUrl = async (token: string, fileId: string): Promise<string> => {
  if (audioBlobUrlCache.has(fileId)) {
    return audioBlobUrlCache.get(fileId)!;
  }

  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Không thể phát file audio này (HTTP ${res.status}). Vui lòng thử lại.`);
  }

  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);
  audioBlobUrlCache.set(fileId, blobUrl);
  return blobUrl;
};

/**
 * Fetch text content of companion text file
 */
export const getFileTextContent = async (token: string, fileId: string): Promise<string> => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Lỗi tải nội dung văn bản (HTTP ${res.status}).`);
  }

  return await res.text();
};

/**
 * Upload Audio File (MP3, etc.) and optional Companion Text to Google Drive
 */
export const uploadAudioStoryToDrive = async (
  token: string,
  params: {
    audioFile: File;
    customTitle?: string;
    companionText?: string;
    folderId?: string;
    onProgress?: (percent: number) => void;
  }
): Promise<{ audioId: string; textId?: string }> => {
  const { audioFile, customTitle, companionText, folderId, onProgress } = params;

  const audioFileName = customTitle
    ? `${customTitle}.${audioFile.name.split('.').pop() || 'mp3'}`
    : audioFile.name;

  const metadata: { name: string; mimeType: string; parents?: string[] } = {
    name: audioFileName,
    mimeType: audioFile.type || 'audio/mpeg',
  };

  if (folderId && folderId !== 'all') {
    metadata.parents = [folderId];
  }

  // Upload Audio via multipart upload
  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metaPart = `Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
    metadata
  )}`;
  const fileHeader = `Content-Type: ${audioFile.type || 'audio/mpeg'}\r\n\r\n`;

  const audioArrayBuffer = await audioFile.arrayBuffer();

  const preBody = new TextEncoder().encode(delimiter + metaPart + delimiter + fileHeader);
  const postBody = new TextEncoder().encode(closeDelimiter);

  const fullBody = new Uint8Array(
    preBody.byteLength + audioArrayBuffer.byteLength + postBody.byteLength
  );
  fullBody.set(preBody, 0);
  fullBody.set(new Uint8Array(audioArrayBuffer), preBody.byteLength);
  fullBody.set(postBody, preBody.byteLength + audioArrayBuffer.byteLength);

  onProgress?.(40);

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: fullBody,
    }
  );

  if (!uploadRes.ok) {
    const err = await uploadRes.json().catch(() => ({}));
    throw new Error(err.error?.message || `Lỗi tải file audio lên Google Drive (${uploadRes.status})`);
  }

  const audioResult = await uploadRes.json();
  const audioId = audioResult.id;
  onProgress?.(80);

  let textId: string | undefined;

  // If companion text was provided, create matching .txt file
  if (companionText && companionText.trim().length > 0) {
    const baseName = audioFileName.replace(/\.[^/.]+$/, '');
    const txtFileName = `${baseName}.txt`;
    const txtRes = await saveCompanionTextToDrive(token, txtFileName, companionText, folderId);
    textId = txtRes.id;
  }

  onProgress?.(100);
  return { audioId, textId };
};

/**
 * Save companion text (.txt) file to Google Drive
 */
export const saveCompanionTextToDrive = async (
  token: string,
  fileName: string,
  content: string,
  folderId?: string,
  existingFileId?: string
): Promise<{ id: string; name: string }> => {
  const metadata: { name: string; mimeType: string; parents?: string[] } = {
    name: fileName,
    mimeType: 'text/plain',
  };

  if (!existingFileId && folderId && folderId !== 'all') {
    metadata.parents = [folderId];
  }

  const boundary = '-------text314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const metaPart = `Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
    metadata
  )}`;
  const fileHeader = 'Content-Type: text/plain; charset=UTF-8\r\n\r\n';

  const bodyString =
    delimiter +
    metaPart +
    delimiter +
    fileHeader +
    content +
    closeDelimiter;

  const url = existingFileId
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

  const method = existingFileId ? 'PATCH' : 'POST';

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body: bodyString,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Lỗi lưu nội dung văn bản (${res.status})`);
  }

  const data = await res.json();
  return { id: data.id, name: data.name };
};

/**
 * Delete file from Google Drive (Requires explicit confirmation before invocation)
 */
export const deleteDriveFile = async (token: string, fileId: string): Promise<void> => {
  // Clear from audio blob cache if present
  if (audioBlobUrlCache.has(fileId)) {
    URL.revokeObjectURL(audioBlobUrlCache.get(fileId)!);
    audioBlobUrlCache.delete(fileId);
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok && res.status !== 204 && res.status !== 404) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Lỗi xóa file trên Google Drive (${res.status})`);
  }
};
