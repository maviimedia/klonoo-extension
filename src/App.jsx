import { useState, useEffect } from 'react';
import {
  RiAiGenerate,
  RiCodeAiLine,
  RiAiGenerateText,
  RiCloseLine,
  RiFontSizeAi,
  RiColorFilterAiLine,
  RiImageAiLine,
  RiPaintingAiLine,
  RiWindowLine,
  RiCheckboxMultipleBlankLine
} from '@remixicon/react';

export default function App() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [currentView, setCurrentView] = useState('MAIN');
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const handleMessage = (request) => {
      if (request.action === 'TOGGLE_KLONOO') {
        setIsVisible((prev) => {
          if (prev) {
            setIsClosing(true);
            setTimeout(() => {
              setIsVisible(false);
              setIsClosing(false);
              setCurrentView('MAIN');
            }, 200);
            return prev;
          }
          setIsClosing(false);
          setCurrentView('MAIN');
          return true;
        });
      }
    };

    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(handleMessage);
    }
  }, []);

  const closeToolbar = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      setCurrentView('MAIN');
    }, 200);
  };

  const switchView = (newView) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentView(newView);
      setIsTransitioning(false);
    }, 200);
  };

  if (!isVisible && !isClosing) return null;

  const logoUrl = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.getURL
    ? chrome.runtime.getURL('logo.png')
    : '/logo.png';

  const renderMainView = () => (
    <>
      <div className="flex items-center justify-center w-8 h-8 rounded-lg cursor-default ml-1">
        <img src={logoUrl} alt="Klonoo Logo" className="w-4 h-4" />
      </div>
      <div className="w-[1px] h-4 bg-white/20 mx-1"></div>
      <button onClick={() => switchView('SNAPSHOT')} className="flex items-center gap-2 hover:bg-white/10 px-2 py-1.5 rounded-lg transition-all duration-200 cursor-pointer group relative active:scale-95">
        <RiAiGenerate className="text-base text-gray-400 group-hover:text-white transition-colors duration-200" />
        <span className="hidden min-[769px]:inline-block">Web snapshot</span>
        <span className="absolute top-full mt-2 bg-[#2a2a2a] text-white text-[11px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg border border-white/10 hidden max-[768px]:block" style={{ left: '50%', transform: 'translateX(-50%)' }}>Web Snapshot</span>
      </button>
      <button onClick={() => switchView('CODE')} className="flex items-center gap-2 hover:bg-white/10 px-2 py-1.5 rounded-lg transition-all duration-200 cursor-pointer group relative active:scale-95">
        <RiCodeAiLine className="text-base text-gray-400 group-hover:text-white transition-colors duration-200" />
        <span className="hidden min-[769px]:inline-block">Code capture</span>
        <span className="absolute top-full mt-2 bg-[#2a2a2a] text-white text-[11px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg border border-white/10 hidden max-[768px]:block" style={{ left: '50%', transform: 'translateX(-50%)' }}>Code Capture</span>
      </button>
      <button onClick={() => switchView('EXPORT')} className="flex items-center gap-2 hover:bg-white/10 px-2 py-1.5 rounded-lg transition-all duration-200 cursor-pointer group relative active:scale-95">
        <RiAiGenerateText className="text-base text-gray-400 group-hover:text-white transition-colors duration-200" />
        <span className="hidden min-[769px]:inline-block">Export resource</span>
        <span className="absolute top-full mt-2 bg-[#2a2a2a] text-white text-[11px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg border border-white/10 hidden max-[768px]:block" style={{ left: '50%', transform: 'translateX(-50%)' }}>Export Resource</span>
      </button>
      <div className="w-[1px] h-4 bg-white/20 mx-1"></div>
      <button onClick={closeToolbar} className="flex items-center justify-center hover:bg-red-500/20 w-8 h-8 rounded-lg transition-all duration-200 cursor-pointer text-gray-400 hover:text-red-400 group relative active:scale-95">
        <RiCloseLine className="text-lg" />
        <span className="absolute top-full mt-2 bg-[#2a2a2a] text-white text-[11px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg border border-white/10" style={{ left: '50%', transform: 'translateX(-50%)' }}>Close</span>
      </button>
    </>
  );

  const renderExportView = () => (
    <>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl group relative cursor-default">
        <img src={logoUrl} alt="Klonoo Logo" className="w-4 h-4" />
        <span className="hidden min-[769px]:inline-block">Web Resources</span>
        <span className="absolute top-full mt-2 bg-[#2a2a2a] text-white text-[11px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg border border-white/10 hidden max-[768px]:block" style={{ left: '50%', transform: 'translateX(-50%)' }}>Export Resources</span>
      </div>
      <div className="w-[1px] h-4 bg-white/20 mx-1"></div>
      <button className="flex items-center gap-2 hover:bg-white/10 px-2 py-1.5 rounded-lg transition-all duration-200 cursor-pointer group relative active:scale-95">
        <RiFontSizeAi className="text-base text-gray-400 group-hover:text-white transition-colors duration-200" />
        <span className="hidden min-[769px]:inline-block">Font</span>
        <span className="absolute top-full mt-2 bg-[#2a2a2a] text-white text-[11px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg border border-white/10 hidden max-[768px]:block" style={{ left: '50%', transform: 'translateX(-50%)' }}>Font</span>
      </button>
      <button className="flex items-center gap-2 hover:bg-white/10 px-2 py-1.5 rounded-lg transition-all duration-200 cursor-pointer group relative active:scale-95">
        <RiColorFilterAiLine className="text-base text-gray-400 group-hover:text-white transition-colors duration-200" />
        <span className="hidden min-[769px]:inline-block">Icon</span>
        <span className="absolute top-full mt-2 bg-[#2a2a2a] text-white text-[11px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg border border-white/10 hidden max-[768px]:block" style={{ left: '50%', transform: 'translateX(-50%)' }}>Icons</span>
      </button>
      <button className="flex items-center gap-2 hover:bg-white/10 px-2 py-1.5 rounded-lg transition-all duration-200 cursor-pointer group relative active:scale-95">
        <RiImageAiLine className="text-base text-gray-400 group-hover:text-white transition-colors duration-200" />
        <span className="hidden min-[769px]:inline-block">Image</span>
        <span className="absolute top-full mt-2 bg-[#2a2a2a] text-white text-[11px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg border border-white/10 hidden max-[768px]:block" style={{ left: '50%', transform: 'translateX(-50%)' }}>Images</span>
      </button>
      <button className="flex items-center gap-2 hover:bg-white/10 px-2 py-1.5 rounded-lg transition-all duration-200 cursor-pointer group relative active:scale-95">
        <RiPaintingAiLine className="text-base text-gray-400 group-hover:text-white transition-colors duration-200" />
        <span className="hidden min-[769px]:inline-block">Design System</span>
        <span className="absolute top-full mt-2 bg-[#2a2a2a] text-white text-[11px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg border border-white/10 hidden max-[768px]:block" style={{ left: '50%', transform: 'translateX(-50%)' }}>Design</span>
      </button>
      <div className="w-[1px] h-4 bg-white/20 mx-1"></div>
      <button onClick={() => switchView('MAIN')} className="flex items-center justify-center hover:bg-red-500/20 w-8 h-8 rounded-lg transition-all duration-200 cursor-pointer text-gray-400 hover:text-red-400 group relative active:scale-95">
        <RiCloseLine className="text-lg" />
        <span className="absolute top-full mt-2 bg-[#2a2a2a] text-white text-[11px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg border border-white/10" style={{ left: '50%', transform: 'translateX(-50%)' }}>Close</span>
      </button>
    </>
  );

  const renderSnapshotView = () => (
    <>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl group relative cursor-default">
        <img src={logoUrl} alt="Klonoo Logo" className="w-4 h-4" />
        <span className="hidden min-[769px]:inline-block">Web Snapshot</span>
        <span className="absolute top-full mt-2 bg-[#2a2a2a] text-white text-[11px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg border border-white/10 hidden max-[768px]:block" style={{ left: '50%', transform: 'translateX(-50%)' }}>Web Snapshot</span>
      </div>
      <div className="w-[1px] h-4 bg-white/20 mx-1"></div>
      <button className="flex items-center px-3 py-1.5 hover:bg-white/10 rounded-lg transition-all duration-200 cursor-pointer active:scale-95 text-gray-300 hover:text-white">
        <span>Screen</span>
      </button>
      <button className="flex items-center px-3 py-1.5 hover:bg-white/10 rounded-lg transition-all duration-200 cursor-pointer active:scale-95 text-gray-300 hover:text-white">
        <span>Full Page</span>
      </button>
      <button className="flex items-center px-3 py-1.5 hover:bg-white/10 rounded-lg transition-all duration-200 cursor-pointer active:scale-95 text-gray-300 hover:text-white">
        <span>Smart</span>
      </button>
      <div className="w-[1px] h-4 bg-white/20 mx-1"></div>
      <button onClick={() => switchView('MAIN')} className="flex items-center justify-center hover:bg-red-500/20 w-8 h-8 rounded-lg transition-all duration-200 cursor-pointer text-gray-400 hover:text-red-400 group relative active:scale-95">
        <RiCloseLine className="text-lg" />
        <span className="absolute top-full mt-2 bg-[#2a2a2a] text-white text-[11px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg border border-white/10" style={{ left: '50%', transform: 'translateX(-50%)' }}>Close</span>
      </button>
    </>
  );

  const renderCodeView = () => (
    <>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl group relative cursor-default">
        <img src={logoUrl} alt="Klonoo Logo" className="w-4 h-4" />
        <span className="hidden min-[769px]:inline-block">Klonoo</span>
        <span className="absolute top-full mt-2 bg-[#2a2a2a] text-white text-[11px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg border border-white/10 hidden max-[768px]:block" style={{ left: '50%', transform: 'translateX(-50%)' }}>Klonoo</span>
      </div>
      <div className="w-[1px] h-4 bg-white/20 mx-1"></div>
      <button className="flex items-center gap-2 hover:bg-white/10 px-2 py-1.5 rounded-lg transition-all duration-200 cursor-pointer group relative active:scale-95">
        <RiWindowLine className="text-base text-gray-400 group-hover:text-white transition-colors duration-200" />
        <span className="hidden min-[769px]:inline-block">Capture page</span>
        <span className="absolute top-full mt-2 bg-[#2a2a2a] text-white text-[11px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg border border-white/10 hidden max-[768px]:block" style={{ left: '50%', transform: 'translateX(-50%)' }}>Capture page</span>
      </button>
      <button className="flex items-center gap-2 hover:bg-white/10 px-2 py-1.5 rounded-lg transition-all duration-200 cursor-pointer group relative active:scale-95">
        <RiCheckboxMultipleBlankLine className="text-base text-gray-400 group-hover:text-white transition-colors duration-200" />
        <span className="hidden min-[769px]:inline-block">Select element</span>
        <span className="absolute top-full mt-2 bg-[#2a2a2a] text-white text-[11px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg border border-white/10 hidden max-[768px]:block" style={{ left: '50%', transform: 'translateX(-50%)' }}>Select element</span>
      </button>
      <div className="w-[1px] h-4 bg-white/20 mx-1"></div>
      <button onClick={() => switchView('MAIN')} className="flex items-center justify-center hover:bg-red-500/20 w-8 h-8 rounded-lg transition-all duration-200 cursor-pointer text-gray-400 hover:text-red-400 group relative active:scale-95">
        <RiCloseLine className="text-lg" />
        <span className="absolute top-full mt-2 bg-[#2a2a2a] text-white text-[11px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg border border-white/10" style={{ left: '50%', transform: 'translateX(-50%)' }}>Close</span>
      </button>
    </>
  );

  return (
    <div
      style={{
        position: 'absolute',
        top: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        pointerEvents: 'auto',
        zIndex: 2147483647
      }}
    >
      <div
        id="floating-toolbar"
        className={isClosing || isTransitioning ? 'animate-scale-out' : 'animate-slide-down'}
      >
        <div
          className="flex items-center bg-[#1e1e1e] text-[#e0e0e0] rounded-xl px-1.5 py-1.5 shadow-2xl text-[13px] font-medium border border-white/10"
          style={{ fontFamily: '"Manrope", sans-serif' }}
        >
          {currentView === 'MAIN' && renderMainView()}
          {currentView === 'EXPORT' && renderExportView()}
          {currentView === 'SNAPSHOT' && renderSnapshotView()}
          {currentView === 'CODE' && renderCodeView()}
        </div>
      </div>
    </div>
  );
}