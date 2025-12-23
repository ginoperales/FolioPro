export enum FolioPosition {
  TopLeft = 'top-left',
  TopCenter = 'top-center',
  TopRight = 'top-right',
  BottomLeft = 'bottom-left',
  BottomCenter = 'bottom-center',
  BottomRight = 'bottom-right',
  Custom = 'custom'
}

export enum NumberingType {
  Numeric = 'numeric', // 1, 2, 3
  Roman = 'roman',     // I, II, III
  Alpha = 'alpha'      // A, B, C
}

export enum FolioDirection {
  Ascending = 'asc',
  Descending = 'desc'
}

export type PageOrientation = 'auto' | 'vertical' | 'horizontal';

export interface FolioSettings {
  startNumber: number;
  direction: FolioDirection;
  type: NumberingType;
  format: string; // Template like "Exp-2024-{n}"
  position: FolioPosition;
  pageOrientation: PageOrientation; // New Setting
  marginX: number;
  marginY: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  opacity: number;
  rotation: number;
  bold: boolean;
  italic: boolean;
  backgroundColor: string; // 'transparent' or hex
  excludePages: number[]; // Array of page indices to exclude
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  pageCount: number;
  color: string; // UI Color grouping
  isDuplicate?: boolean; // Flag for duplicate files
}

export interface PDFPageMeta {
  id: string; // Unique ID for React keys
  originalIndex: number; // Index in the source file
  sourceFileId: string; // To handle multiple files
  fileName: string; // Display name
  rotation: number;
  excluded: boolean;
  scale?: number; // Individual zoom per page. If undefined, uses "Fit to Screen"
  previewUrl?: string; // Blob URL for thumbnail
}

export interface AppState {
  files: UploadedFile[];
  pages: PDFPageMeta[];
  pdfFileMap: Record<string, ArrayBuffer>; // Store raw file data by ID
  settings: FolioSettings;
  activePageIndex: number;
  isProcessing: boolean;
  isDragging: boolean;
  viewMode: 'grid' | 'list';
  sidebarTab: 'pages' | 'files';
  
  // Actions
  addFiles: (files: File[]) => Promise<void>;
  removePage: (pageId: string) => void;
  removeFile: (fileId: string) => void;
  movePage: (dragIndex: number, hoverIndex: number) => void;
  reorderFiles: (dragIndex: number, hoverIndex: number) => void;
  togglePageExclusion: (pageId: string) => void;
  updateSettings: (settings: Partial<FolioSettings>) => void;
  setActivePage: (index: number) => void;
  setPageScale: (pageId: string, scale: number) => void; // New action
  rotatePage: (pageId: string) => void;
  toggleViewMode: () => void;
  setSidebarTab: (tab: 'pages' | 'files') => void;
  reset: () => void;
}