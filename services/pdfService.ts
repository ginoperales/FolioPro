import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import { AppState, FolioPosition, PDFPageMeta } from '../types';
import { formatFolio } from '../utils/folioUtils';

// Handle PDF.js import inconsistency (ESM vs CJS interop)
const getPdfJs = () => {
  // @ts-ignore
  return pdfjsLib.default || pdfjsLib;
};

const pdfJs = getPdfJs();

// Configure PDF.js worker
const PDFJS_VERSION = '4.10.38';
const WORKER_SRC = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;
const CMAP_URL = `https://unpkg.com/pdfjs-dist@${PDFJS_VERSION}/cmaps/`;

// Browser canvas limits (safe estimate)
const MAX_CANVAS_DIMENSION = 4096;

if (pdfJs.GlobalWorkerOptions && !pdfJs.GlobalWorkerOptions.workerSrc) {
  pdfJs.GlobalWorkerOptions.workerSrc = WORKER_SRC;
}

export const getPageThumbnail = async (fileBuffer: ArrayBuffer, pageIndex: number): Promise<string> => {
  try {
    const data = fileBuffer.slice(0);
    const loadingTask = pdfJs.getDocument({ 
      data,
      cMapUrl: CMAP_URL,
      cMapPacked: true,
    });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(pageIndex + 1); 
    
    const viewport = page.getViewport({ scale: 0.5 }); 
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    if (!context) throw new Error("Canvas context not available");

    await page.render({ canvasContext: context, viewport: viewport }).promise;
    return canvas.toDataURL();
  } catch (error) {
    console.error("Error generating thumbnail:", error);
    return "";
  }
};

export const getPageDimensions = async (
  fileBuffer: ArrayBuffer,
  pageIndex: number,
  rotationOverride: number = 0
) => {
  try {
    const data = fileBuffer.slice(0);
    const loadingTask = pdfJs.getDocument({ 
      data,
      cMapUrl: CMAP_URL,
      cMapPacked: true,
    });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale: 1, rotation: rotationOverride });
    return { width: viewport.width, height: viewport.height };
  } catch (error) {
    console.error("Error getting page dimensions:", error);
    return { width: 612, height: 792 }; 
  }
};

export const renderPageOnCanvas = async (
  fileBuffer: ArrayBuffer,
  pageIndex: number,
  canvas: HTMLCanvasElement,
  scale: number,
  rotationOverride: number = 0,
  signal?: AbortSignal
) => {
  let renderTask: any = null;
  
  try {
    if (signal?.aborted) return;

    const data = fileBuffer.slice(0);
    const loadingTask = pdfJs.getDocument({ 
      data,
      cMapUrl: CMAP_URL,
      cMapPacked: true,
    });
    
    const pdf = await loadingTask.promise;
    if (signal?.aborted) return;
    
    const page = await pdf.getPage(pageIndex + 1);
    if (signal?.aborted) return;
    
    // Initial viewport calculation
    let viewport = page.getViewport({ scale, rotation: rotationOverride });
    
    // SAFETY CAP: Prevent massive canvases that crash the browser or take forever
    // If dimensions exceed MAX_CANVAS_DIMENSION, we reduce the scale
    const maxDim = Math.max(viewport.width, viewport.height);
    if (maxDim > MAX_CANVAS_DIMENSION) {
      const reductionFactor = MAX_CANVAS_DIMENSION / maxDim;
      const safeScale = scale * reductionFactor;
      viewport = page.getViewport({ scale: safeScale, rotation: rotationOverride });
    }
    
    canvas.height = viewport.height;
    canvas.width = viewport.width;
    
    const context = canvas.getContext('2d');
    if (!context) throw new Error("Context not available");

    renderTask = page.render({ canvasContext: context, viewport });

    if (signal) {
      signal.addEventListener('abort', () => {
        if (renderTask) renderTask.cancel();
      }, { once: true });
    }

    await renderTask.promise;
  } catch (error: any) {
    if (error?.name === 'RenderingCancelledException') return;
    if (signal?.aborted) return;
    console.error("Error generating preview:", error);
    throw error;
  }
};

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? rgb(
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255
  ) : rgb(0, 0, 0);
};

export const downloadFoliatedPDF = async (
  pages: PDFPageMeta[],
  fileMap: Record<string, ArrayBuffer>,
  settings: AppState['settings']
) => {
  const mergedPdf = await PDFDocument.create();
  
  let font = await mergedPdf.embedFont(StandardFonts.Helvetica);
  if (settings.fontFamily === 'Times-Roman') font = await mergedPdf.embedFont(StandardFonts.TimesRoman);
  if (settings.fontFamily === 'Courier') font = await mergedPdf.embedFont(StandardFonts.Courier);
  if (settings.bold) {
     if (settings.fontFamily === 'Helvetica') font = await mergedPdf.embedFont(StandardFonts.HelveticaBold);
  }

  const validPages = pages.filter(p => !p.excluded);
  let validPageIndex = 0;

  for (const pageMeta of pages) {
    const srcDoc = await PDFDocument.load(fileMap[pageMeta.sourceFileId]);
    const [copiedPage] = await mergedPdf.copyPages(srcDoc, [pageMeta.originalIndex]);
    
    // Get geometry with robust CropBox/MediaBox handling
    const mediaBox = copiedPage.getMediaBox();
    const cropBox = copiedPage.getCropBox();
    // Use CropBox if available, otherwise MediaBox
    const box = cropBox || mediaBox;
    const { x: originX, y: originY, width, height } = box;

    const originalRotation = copiedPage.getRotation().angle;
    
    // Calculate total effective rotation (0, 90, 180, 270)
    const totalRotation = (originalRotation + pageMeta.rotation) % 360;
    
    // Apply the rotation metadata to the PDF page object
    copiedPage.setRotation(degrees(totalRotation));

    if (!pageMeta.excluded) {
      const text = formatFolio(validPageIndex, validPages.length, {
        startNumber: settings.startNumber,
        direction: settings.direction,
        type: settings.type,
        format: settings.format
      });

      const textWidth = font.widthOfTextAtSize(text, settings.fontSize);
      const textHeight = settings.fontSize;

      // Coordinate Calculation Logic
      let x = 0;
      let y = 0;
      
      const mX = settings.marginX;
      const mY = settings.marginY;

      // Logic mapping based on rotation.
      let mappingRotation = totalRotation;
      
      if (settings.pageOrientation === 'vertical') {
        mappingRotation = 0;
      } else if (settings.pageOrientation === 'horizontal') {
        mappingRotation = 90;
      }

      mappingRotation = (mappingRotation + 360) % 360;
      
      switch(mappingRotation) {
        case 0:
          if (settings.position.includes('left')) x = mX;
          if (settings.position.includes('right')) x = width - mX - textWidth;
          if (settings.position.includes('center')) x = (width / 2) - (textWidth / 2);

          if (settings.position.includes('top')) y = height - mY - textHeight;
          if (settings.position.includes('bottom')) y = mY;
          break;

        case 90:
          if (settings.position.includes('top')) x = mY; 
          if (settings.position.includes('bottom')) x = width - mY - textHeight; 
          
          if (settings.position.includes('left')) y = mX;
          if (settings.position.includes('right')) y = height - mX - textWidth;
          if (settings.position.includes('center')) y = (height / 2) - (textWidth / 2);
          break;

        case 180:
          if (settings.position.includes('left')) x = width - mX - textWidth;
          if (settings.position.includes('right')) x = mX;
          if (settings.position.includes('center')) x = (width / 2) - (textWidth / 2);

          if (settings.position.includes('top')) y = mY;
          if (settings.position.includes('bottom')) y = height - mY - textHeight;
          break;

        case 270:
          if (settings.position.includes('top')) x = width - mY - textHeight;
          if (settings.position.includes('bottom')) x = mY;

          if (settings.position.includes('left')) y = height - mX - textWidth;
          if (settings.position.includes('right')) y = mX;
          if (settings.position.includes('center')) y = (height / 2) - (textWidth / 2);
          break;
      }
      
      // Calculate final coordinates including box origin
      const finalX = x + originX;
      const finalY = y + originY;

      // Calculate relative text rotation to visually match screen preference
      const textRotation = (settings.rotation - totalRotation);

      copiedPage.drawText(text, {
        x: finalX,
        y: finalY,
        size: settings.fontSize,
        font: font,
        color: hexToRgb(settings.color),
        opacity: settings.opacity,
        rotate: degrees(textRotation),
      });

      validPageIndex++;
    }

    mergedPdf.addPage(copiedPage);
  }

  const pdfBytes = await mergedPdf.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `foliado_${Date.now()}.pdf`;
  link.click();
};