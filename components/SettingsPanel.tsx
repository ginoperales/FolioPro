import React from 'react';
import { useStore } from '../store';
import { FolioPosition, FolioDirection, NumberingType, PageOrientation } from '../types';
import { AVAILABLE_FONTS, PRESETS } from '../constants';
import { 
  Type, AlignLeft, ArrowDown01, Hash, 
  PaintBucket, Layout, Settings2, FileText, Smartphone, Monitor
} from 'lucide-react';

export const SettingsPanel: React.FC = () => {
  const { settings, updateSettings } = useStore();

  return (
    <div className="w-80 bg-white border-l border-slate-200 h-full flex flex-col shadow-lg z-20 flex-shrink-0">
      <div className="p-5 border-b border-slate-200 bg-slate-50">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Settings2 size={20} /> Configuración
        </h2>
        <p className="text-xs text-slate-500 mt-1">Personaliza el foliado de tu documento.</p>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        
        {/* Presets */}
        <section>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Plantillas Rápidas</label>
          <div className="grid grid-cols-2 gap-2">
            {PRESETS.map((p, i) => (
              <button 
                key={i}
                onClick={() => updateSettings({ format: p.template })}
                className="text-xs border border-slate-200 p-2 rounded hover:bg-blue-50 hover:border-blue-300 transition text-left"
              >
                {p.name}
              </button>
            ))}
          </div>
        </section>

        {/* General Settings */}
        <section className="space-y-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block flex items-center gap-2">
            <Hash size={14} /> Numeración
          </label>
          
          <div className="grid grid-cols-2 gap-3">
             <div>
               <span className="text-xs text-slate-500 block mb-1">Inicio</span>
               <input 
                type="number" 
                value={settings.startNumber}
                onChange={(e) => updateSettings({ startNumber: parseInt(e.target.value) || 1 })}
                className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
               />
             </div>
             <div>
               <span className="text-xs text-slate-500 block mb-1">Dirección</span>
               <select 
                 value={settings.direction}
                 onChange={(e) => updateSettings({ direction: e.target.value as FolioDirection })}
                 className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
               >
                 <option value={FolioDirection.Ascending}>Ascendente (1→N)</option>
                 <option value={FolioDirection.Descending}>Descendente (N→1)</option>
               </select>
             </div>
          </div>

          <div>
             <span className="text-xs text-slate-500 block mb-1">Tipo</span>
             <div className="flex bg-slate-100 rounded p-1">
               {[NumberingType.Numeric, NumberingType.Roman, NumberingType.Alpha].map(t => (
                 <button
                   key={t}
                   onClick={() => updateSettings({ type: t })}
                   className={`flex-1 text-xs py-1 rounded capitalize ${settings.type === t ? 'bg-white shadow text-blue-600 font-medium' : 'text-slate-500'}`}
                 >
                   {t}
                 </button>
               ))}
             </div>
          </div>

          <div>
            <span className="text-xs text-slate-500 block mb-1">Formato (Use {'{n}'} para el número)</span>
            <input 
              type="text"
              value={settings.format}
              onChange={(e) => updateSettings({ format: e.target.value })}
              className="w-full border border-slate-300 rounded px-3 py-2 text-sm font-mono"
            />
          </div>
        </section>

        {/* Orientation & Position */}
        <section className="space-y-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block flex items-center gap-2">
            <Layout size={14} /> Disposición
          </label>

          {/* Page Orientation Selector */}
          <div>
             <span className="text-xs text-slate-500 block mb-1">Orientación de Hoja</span>
             <div className="flex bg-slate-100 rounded p-1">
               {(['auto', 'vertical', 'horizontal'] as PageOrientation[]).map(o => (
                 <button
                   key={o}
                   onClick={() => updateSettings({ pageOrientation: o })}
                   className={`flex-1 text-xs py-1.5 rounded capitalize transition-all ${settings.pageOrientation === o ? 'bg-white shadow text-blue-600 font-bold' : 'text-slate-500'}`}
                 >
                   {o === 'auto' ? 'Auto' : o === 'vertical' ? 'Vert.' : 'Horiz.'}
                 </button>
               ))}
             </div>
             <p className="text-[10px] text-slate-400 mt-1 leading-tight">
               Define cómo se calculan las coordenadas. "Vertical" asume hoja estándar.
             </p>
          </div>
          
          <div className="grid grid-cols-3 gap-2 bg-slate-100 p-2 rounded">
            {[
              FolioPosition.TopLeft, FolioPosition.TopCenter, FolioPosition.TopRight,
              FolioPosition.BottomLeft, FolioPosition.BottomCenter, FolioPosition.BottomRight
            ].map(pos => (
              <button
                key={pos}
                onClick={() => updateSettings({ position: pos })}
                className={`h-8 rounded border flex items-center justify-center ${settings.position === pos ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-400 hover:border-slate-400'}`}
              >
                <div className={`w-2 h-2 rounded-full ${settings.position === pos ? 'bg-white' : 'bg-current'}`} />
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-slate-500">Margen X</span>
              <input 
                type="range" min="0" max="200"
                value={settings.marginX}
                onChange={(e) => updateSettings({ marginX: parseInt(e.target.value) })}
                className="w-full mt-1"
              />
            </div>
            <div>
              <span className="text-xs text-slate-500">Margen Y</span>
              <input 
                type="range" min="0" max="200"
                value={settings.marginY}
                onChange={(e) => updateSettings({ marginY: parseInt(e.target.value) })}
                className="w-full mt-1"
              />
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="space-y-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block flex items-center gap-2">
            <Type size={14} /> Tipografía
          </label>

          <select 
             value={settings.fontFamily}
             onChange={(e) => updateSettings({ fontFamily: e.target.value })}
             className="w-full border border-slate-300 rounded px-2 py-1.5 text-sm"
           >
             {AVAILABLE_FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
           </select>

           {/* Text Rotation */}
           <div>
             <span className="text-xs text-slate-500 block mb-1">Rotación del Texto</span>
             <div className="flex gap-2">
                <button 
                  onClick={() => updateSettings({ rotation: 0 })}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs border rounded transition ${settings.rotation === 0 ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600'}`}
                >
                  <Monitor size={14} /> Horizontal (0°)
                </button>
                <button 
                  onClick={() => updateSettings({ rotation: 90 })}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 text-xs border rounded transition ${settings.rotation === 90 || settings.rotation === 270 ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600'}`}
                >
                  <Smartphone size={14} /> Vertical (90°)
                </button>
             </div>
           </div>

           <div className="flex items-center gap-2">
             <input 
               type="color" 
               value={settings.color}
               onChange={(e) => updateSettings({ color: e.target.value })}
               className="h-8 w-8 rounded overflow-hidden border-0 cursor-pointer"
             />
             <div className="flex-1">
               <span className="text-xs text-slate-500">Tamaño: {settings.fontSize}px</span>
               <input 
                  type="range" min="8" max="72"
                  value={settings.fontSize}
                  onChange={(e) => updateSettings({ fontSize: parseInt(e.target.value) })}
                  className="w-full"
                />
             </div>
           </div>
           
           <div className="flex gap-2">
             <button 
               onClick={() => updateSettings({ bold: !settings.bold })}
               className={`flex-1 py-1 text-sm border rounded ${settings.bold ? 'bg-slate-800 text-white' : 'bg-white'}`}
             >
               Bold
             </button>
             <button 
               onClick={() => updateSettings({ italic: !settings.italic })}
               className={`flex-1 py-1 text-sm border rounded italic ${settings.italic ? 'bg-slate-800 text-white' : 'bg-white'}`}
             >
               Italic
             </button>
           </div>
        </section>
      </div>
    </div>
  );
};