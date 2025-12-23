import React from 'react';
import { useStore } from '../store';
import { 
  GripVertical, Trash2, RotateCw, Eye, EyeOff, 
  LayoutGrid, List as ListIcon, FileText, Files, FileStack 
} from 'lucide-react';

export const PageThumbnails: React.FC = () => {
  const { 
    pages, 
    files,
    activePageIndex, 
    setActivePage, 
    movePage, 
    removePage,
    removeFile,
    reorderFiles,
    togglePageExclusion,
    rotatePage,
    viewMode,
    toggleViewMode,
    sidebarTab,
    setSidebarTab
  } = useStore();

  const [draggedItem, setDraggedItem] = React.useState<number | null>(null);

  const onDragStart = (e: React.DragEvent, index: number) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setDragImage(e.currentTarget, 20, 20);
  };

  const onDragOver = (e: React.DragEvent, index: number, type: 'page' | 'file') => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;
    
    if (type === 'page') {
      movePage(draggedItem, index);
    } else {
      reorderFiles(draggedItem, index);
    }
    setDraggedItem(index);
  };

  const onDragEnd = () => {
    setDraggedItem(null);
  };

  return (
    <div className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col h-full z-10 transition-all duration-300">
      
      {/* TABS HEADER */}
      <div className="bg-white border-b border-slate-200">
        <div className="flex">
          <button 
            onClick={() => setSidebarTab('pages')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-colors ${sidebarTab === 'pages' ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <Files size={14} /> Páginas
          </button>
          <button 
            onClick={() => setSidebarTab('files')}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border-b-2 transition-colors ${sidebarTab === 'files' ? 'border-blue-500 text-blue-600 bg-blue-50/50' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <FileStack size={14} /> Archivos
          </button>
        </div>

        {sidebarTab === 'pages' && (
          <div className="p-2 flex items-center justify-between bg-slate-50 border-t border-slate-100">
             <span className="text-[10px] text-slate-500 font-medium pl-1">{pages.length} página(s)</span>
             <button 
               onClick={toggleViewMode} 
               className="p-1.5 hover:bg-slate-200 rounded text-slate-500 transition"
               title={viewMode === 'grid' ? "Ver lista" : "Ver miniaturas"}
             >
               {viewMode === 'grid' ? <ListIcon size={16} /> : <LayoutGrid size={16} />}
             </button>
          </div>
        )}
      </div>
      
      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        
        {/* --- FILES VIEW --- */}
        {sidebarTab === 'files' && (
           <div className="space-y-2">
              {files.map((file, index) => (
                <div
                  key={file.id}
                  draggable
                  onDragStart={(e) => onDragStart(e, index)}
                  onDragOver={(e) => onDragOver(e, index, 'file')}
                  onDragEnd={onDragEnd}
                  className={`
                    relative bg-white rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md transition-all
                    ${draggedItem === index ? 'opacity-0' : 'opacity-100'}
                  `}
                >
                   <div className="flex items-start gap-3">
                      <div className="mt-1 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500">
                         <GripVertical size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                         <div className="flex flex-wrap items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${file.color.replace('bg-', 'bg-').replace('100', '500')}`}></div>
                            <h4 className="text-sm font-semibold text-slate-700 truncate max-w-[120px]" title={file.name}>{file.name}</h4>
                            {file.isDuplicate && (
                              <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 rounded border border-amber-200 font-medium whitespace-nowrap">
                                Repetido
                              </span>
                            )}
                         </div>
                         <div className="flex items-center text-[10px] text-slate-400 gap-2">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded">{file.pageCount} págs</span>
                            <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                         </div>
                      </div>
                      <button 
                        onClick={() => removeFile(file.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition"
                        title="Eliminar archivo y sus páginas"
                      >
                         <Trash2 size={16} />
                      </button>
                   </div>
                </div>
              ))}
              
              {files.length === 0 && (
                <div className="text-center p-8 text-slate-400 text-xs">
                   No hay archivos cargados.
                </div>
              )}
           </div>
        )}

        {/* --- PAGES VIEW --- */}
        {sidebarTab === 'pages' && (
          <>
            {pages.map((page, index) => (
              <div
                key={page.id}
                draggable
                onDragStart={(e) => onDragStart(e, index)}
                onDragOver={(e) => onDragOver(e, index, 'page')}
                onDragEnd={onDragEnd}
                onClick={() => setActivePage(index)}
                className={`
                  relative group rounded-lg border transition-all duration-200 cursor-pointer 
                  ${activePageIndex === index ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200' : 'border-slate-200 bg-white hover:border-blue-300'}
                  ${page.excluded ? 'opacity-60 grayscale' : ''}
                  ${draggedItem === index ? 'opacity-0' : 'opacity-100'}
                  ${viewMode === 'list' ? 'p-2 flex items-center gap-3' : 'p-2 flex flex-col gap-2'}
                `}
              >
                {/* Pages: LIST MODE */}
                {viewMode === 'list' && (
                  <>
                     <GripVertical size={16} className="text-slate-300 cursor-grab active:cursor-grabbing flex-shrink-0" />
                     <span className="bg-slate-200 text-slate-600 text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded flex-shrink-0">
                        {index + 1}
                     </span>
                     <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700 truncate">{page.fileName}</p>
                        <p className="text-[10px] text-slate-400 truncate">Pág {page.originalIndex + 1} {page.rotation !== 0 ? `• ${page.rotation}°` : ''}</p>
                     </div>
                     <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.stopPropagation(); togglePageExclusion(page.id); }} className="p-1 hover:bg-slate-200 rounded text-slate-500">
                          {page.excluded ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); removePage(page.id); }} className="p-1 hover:bg-red-100 text-red-500 rounded">
                          <Trash2 size={14} />
                        </button>
                     </div>
                  </>
                )}

                {/* Pages: GRID MODE */}
                {viewMode === 'grid' && (
                  <>
                    <div className="flex items-center justify-between mb-1">
                      <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-1.5 rounded">
                        {index + 1}
                      </span>
                      <GripVertical size={14} className="text-slate-300 cursor-grab active:cursor-grabbing" />
                    </div>

                    <div className="relative aspect-[3/4] bg-slate-200 rounded overflow-hidden shadow-sm">
                        {page.previewUrl ? (
                            <img 
                              src={page.previewUrl} 
                              className="w-full h-full object-contain" 
                              style={{ transform: `rotate(${page.rotation}deg)`}}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">...</div>
                        )}
                    </div>
                    
                    <div className="absolute top-2 right-2 bottom-2 left-2 bg-black/60 rounded opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                       <div className="flex gap-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); rotatePage(page.id); }}
                            className="p-1.5 bg-white rounded-full hover:bg-blue-100 text-slate-700 shadow" title="Rotar +90°"
                          >
                            <RotateCw size={14} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); togglePageExclusion(page.id); }}
                            className="p-1.5 bg-white rounded-full hover:bg-slate-100 text-slate-700 shadow" title="Excluir/Incluir"
                          >
                            {page.excluded ? <Eye size={14} /> : <EyeOff size={14} />}
                          </button>
                       </div>
                       <button 
                          onClick={(e) => { e.stopPropagation(); removePage(page.id); }}
                          className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow" title="Eliminar"
                       >
                         <Trash2 size={14} />
                       </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </>
        )}

        {pages.length === 0 && (
          <div className="text-center p-8 text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-lg">
             <FileText size={24} className="mx-auto mb-2 opacity-50"/>
             Arrastra PDF aquí
          </div>
        )}
      </div>
    </div>
  );
};