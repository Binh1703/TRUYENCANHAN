export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime?: string;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  parents?: string[];
  description?: string;
}

export interface DriveFolder {
  id: string;
  name: string;
}

export interface AudioStoryItem {
  id: string;
  name: string;
  title: string;
  chapter?: string;
  sizeBytes: number;
  formattedSize: string;
  modifiedTime: string;
  mimeType: string;
  webViewLink?: string;
  audioUrl?: string;
  folderId?: string;
  folderName?: string;
  companionTextFileId?: string;
  companionTextFileName?: string;
  textContent?: string;
  duration?: number; // in seconds if detected
  savedProgress?: number; // in seconds
}

export interface Bookmark {
  id: string;
  storyId: string;
  storyTitle: string;
  timestamp: number;
  label: string;
  createdAt: number;
}
