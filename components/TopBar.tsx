import React, { useRef, useState } from 'react';
import { useStore } from '../store';
import { downloadFoliatedPDF } from '../services/pdfService';
import { Download, Upload, FilePlus, RefreshCcw, AlertTriangle, X, Check } from 'lucide-react';

export const TopBar: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addFiles, pages, pdfFileMap, settings, reset, isProcessing, files: existingFiles } = useStore();
  
  // State for duplicate handling
  const [duplicateFiles, setDuplicateFiles] = useState<File[]>([]);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      const existingNames = existingFiles.map(f => f.name);

      const duplicates = selectedFiles.filter(f => existingNames.includes(f.name));
      const uniqueFiles = selectedFiles.filter(f => !existingNames.includes(f.name));

      // 1. Add unique files immediately
      if (uniqueFiles.length > 0) {
        addFiles(uniqueFiles);
      }

      // 2. If duplicates exist, trigger modal
      if (duplicates.length > 0) {
        setDuplicateFiles(duplicates);
        setShowDuplicateModal(true);
      }
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const confirmDuplicates = () => {
    addFiles(duplicateFiles); // The store will mark them as duplicate automatically
    closeModal();
  };

  const closeModal = () => {
    setDuplicateFiles([]);
    setShowDuplicateModal(false);
  };

  const handleDownload = async () => {
    if (pages.length === 0) return;
    await downloadFoliatedPDF(pages, pdfFileMap, settings);
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-30">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-bold text-lg">
            F
          </div>
          <h1 className="font-bold text-slate-800 text-lg">FolioPro <span className="text-slate-400 font-normal text-sm ml-2">Editor de Expedientes</span></h1>
        </div>

        <div className="flex items-center gap-3">
          <input 
            type="file" 
            multiple 
            accept="application/pdf" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange}
          />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition"
            disabled={isProcessing}
          >
            {isProcessing ? 'Procesando...' : (
               <>
                 {pages.length > 0 ? <FilePlus size={18} /> : <Upload size={18} />}
                 {pages.length > 0 ? 'Agregar PDF' : 'Cargar PDF'}
               </>
            )}
          </button>

          {pages.length > 0 && (
            <>
               <div className="h-6 w-px bg-slate-200 mx-1"></div>
               
               <button 
                 onClick={reset}
                 className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                 title="Empezar de nuevo"
               >
                 <RefreshCcw size={20} />
               </button>

               <button 
                 onClick={handleDownload}
                 className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-200 transition transform hover:-translate-y-0.5"
               >
                 <Download size={18} />
                 Descargar PDF
               </button>
            </>
          )}
        </div>
      </header>

      {/* Duplicate File Modal */}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-amber-50">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Archivos Duplicados</h3>
                <p className="text-xs text-slate-500">Se detectaron {duplicateFiles.length} archivo(s) con nombres existentes.</p>
              </div>
            </div>
            
            <div className="p-5 max-h-60 overflow-y-auto">
              <p className="text-sm text-slate-600 mb-3">Los siguientes archivos ya existen en tu proyecto:</p>
              <ul className="space-y-2">
                {duplicateFiles.map((f, i) => (
                  <li key={i} className="text-xs bg-slate-50 p-2 rounded border border-slate-200 flex items-center gap-2 text-slate-700 font-medium">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                    {f.name}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex gap-3 justify-end">
              <button 
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition flex items-center gap-2"
              >
                <X size={16} /> Rechazar
              </button>
              <button 
                onClick={confirmDuplicates}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-md transition flex items-center gap-2"
              >
                <Check size={16} /> Agregar copia
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};