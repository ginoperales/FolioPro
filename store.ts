import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { AppState, PDFPageMeta, UploadedFile } from './types';
import { INITIAL_SETTINGS } from './constants';
import { getPageThumbnail } from './services/pdfService';
import { PDFDocument } from 'pdf-lib';

// Helper to assign random pastel colors to files for UI distinction
const getRandomColor = () => {
  const colors = ['bg-blue-100', 'bg-green-100', 'bg-purple-100', 'bg-orange-100', 'bg-pink-100', 'bg-teal-100'];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const useStore = create<AppState>((set, get) => ({
  files: [],
  pages: [],
  pdfFileMap: {},
  settings: INITIAL_SETTINGS,
  activePageIndex: 0,
  isProcessing: false,
  isDragging: false,
  viewMode: 'grid',
  sidebarTab: 'pages',

  addFiles: async (rawFiles: File[]) => {
    set({ isProcessing: true });
    
    const newFiles: UploadedFile[] = [];
    const newPages: PDFPageMeta[] = [];
    const newFileMap: Record<string, ArrayBuffer> = { ...get().pdfFileMap };
    
    // Check against current state to find duplicates
    const currentFileNames = new Set(get().files.map(f => f.name));

    for (const file of rawFiles) {
      const fileId = uuidv4();
      const arrayBuffer = await file.arrayBuffer();
      newFileMap[fileId] = arrayBuffer;

      // Load PDF to count pages
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pageCount = pdfDoc.getPageCount();

      // Check duplicate
      const isDuplicate = currentFileNames.has(file.name);

      newFiles.push({
        id: fileId,
        name: file.name,
        size: file.size,
        pageCount: pageCount,
        color: getRandomColor(),
        isDuplicate: isDuplicate
      });

      for (let i = 0; i < pageCount; i++) {
        // Generate thumb asynchronously
        const thumb = await getPageThumbnail(arrayBuffer, i);
        newPages.push({
          id: uuidv4(),
          originalIndex: i,
          sourceFileId: fileId,
          fileName: file.name,
          rotation: 0,
          excluded: false,
          scale: undefined, // Default to auto/fit
          previewUrl: thumb
        });
      }
    }

    set(state => ({
      pdfFileMap: newFileMap,
      files: [...state.files, ...newFiles],
      pages: [...state.pages, ...newPages],
      isProcessing: false,
      activePageIndex: state.pages.length > 0 ? state.pages.length : 0,
      sidebarTab: 'pages' // Switch to pages view to show result
    }));
  },

  removePage: (pageId) => set(state => {
    const newPages = state.pages.filter(p => p.id !== pageId);
    return { 
      pages: newPages,
      activePageIndex: Math.min(state.activePageIndex, newPages.length - 1)
    };
  }),

  removeFile: (fileId) => set(state => {
    const newFiles = state.files.filter(f => f.id !== fileId);
    // Remove all pages associated with this file
    const newPages = state.pages.filter(p => p.sourceFileId !== fileId);
    const newFileMap = { ...state.pdfFileMap };
    delete newFileMap[fileId];

    return {
      files: newFiles,
      pages: newPages,
      pdfFileMap: newFileMap,
      activePageIndex: 0
    };
  }),

  movePage: (dragIndex, hoverIndex) => set(state => {
    const newPages = [...state.pages];
    const [removed] = newPages.splice(dragIndex, 1);
    newPages.splice(hoverIndex, 0, removed);
    return { pages: newPages, activePageIndex: hoverIndex };
  }),

  reorderFiles: (dragIndex, hoverIndex) => set(state => {
    const newFiles = [...state.files];
    const [removed] = newFiles.splice(dragIndex, 1);
    newFiles.splice(hoverIndex, 0, removed);

    // Reconstruct pages array based on new file order
    let newPages: PDFPageMeta[] = [];
    
    newFiles.forEach(file => {
      const filePages = state.pages.filter(p => p.sourceFileId === file.id);
      newPages = [...newPages, ...filePages];
    });

    return { 
      files: newFiles, 
      pages: newPages,
      activePageIndex: 0 
    };
  }),

  togglePageExclusion: (pageId) => set(state => ({
    pages: state.pages.map(p => p.id === pageId ? { ...p, excluded: !p.excluded } : p)
  })),

  updateSettings: (newSettings) => set(state => ({
    settings: { ...state.settings, ...newSettings }
  })),

  setActivePage: (index) => set({ activePageIndex: index }),
  
  setPageScale: (pageId, scale) => set(state => ({
    pages: state.pages.map(p => p.id === pageId ? { ...p, scale } : p)
  })),
  
  rotatePage: (pageId) => set(state => ({
    pages: state.pages.map(p => p.id === pageId ? { ...p, rotation: (p.rotation + 90) % 360 } : p)
  })),

  toggleViewMode: () => set(state => ({ 
    viewMode: state.viewMode === 'grid' ? 'list' : 'grid' 
  })),

  setSidebarTab: (tab) => set({ sidebarTab: tab }),

  reset: () => set({ 
    files: [],
    pages: [], 
    pdfFileMap: {}, 
    settings: INITIAL_SETTINGS, 
    activePageIndex: 0,
    viewMode: 'grid'
  })
}));