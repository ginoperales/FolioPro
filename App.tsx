import React from 'react';
import { TopBar } from './components/TopBar';
import { PageThumbnails } from './components/PageThumbnails';
import { PDFWorkspace } from './components/PDFWorkspace';
import { SettingsPanel } from './components/SettingsPanel';

export default function App() {
  return (
    <div className="flex flex-col h-screen w-screen bg-slate-100 overflow-hidden">
      <TopBar />
      
      <main className="flex-1 flex overflow-hidden">
        {/* Left: Thumbnails */}
        <PageThumbnails />
        
        {/* Center: Workspace */}
        <PDFWorkspace />
        
        {/* Right: Settings */}
        <SettingsPanel />
      </main>
    </div>
  );
}
