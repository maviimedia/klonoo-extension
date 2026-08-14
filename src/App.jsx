import JSZip from 'jszip';
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
  RiCheckboxMultipleBlankLine,
  RiLoader4Line
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

  const extractAndDownloadFonts = async () => {
    const zip = new JSZip();
    let hasFonts = false;
    const fontUrls = new Set();
    const externalLinks = new Set();

    const styleSheets = Array.from(document.styleSheets);
    for (const sheet of styleSheets) {
      if (sheet.ownerNode && sheet.ownerNode.id === 'klonoo-fonts') {
        continue;
      }

      try {
        const rules = Array.from(sheet.cssRules || []);
        for (const rule of rules) {
          if (rule.type === CSSRule.FONT_FACE_RULE) {
            const src = rule.style.getPropertyValue('src');
            const urls = src.match(/url\((['"]?)(.*?)\1\)/g);
            if (urls) {
              urls.forEach(u => {
                const match = u.match(/url\((['"]?)(.*?)\1\)/);
                if (match && match[2]) {
                  const fontUrl = match[2];
                  if (!fontUrl.startsWith('data:') && !fontUrl.startsWith('chrome-extension://')) {
                    fontUrls.add(fontUrl);
                  }
                }
              });
            }
          }
        }
      } catch (e) {
        if (sheet.href && (sheet.href.includes('fonts.googleapis.com') || sheet.href.includes('fonts.bunny.net') || sheet.href.includes('use.typekit.net'))) {
           externalLinks.add(sheet.href);
        }
      }
    }

    const linkTags = document.querySelectorAll('link[rel="stylesheet"], link[rel="preconnect"]');
    linkTags.forEach(link => {
      const href = link.href;
      if (href.includes('fonts.googleapis.com') || href.includes('fonts.gstatic.com') || href.includes('use.typekit.net')) {
        externalLinks.add(href);
      }
    });

    for (const url of fontUrls) {
      try {
        const absoluteUrl = new URL(url, window.location.href).href;
        const response = await fetch(absoluteUrl);
        if (response.ok) {
          const blob = await response.blob();
          const fileName = absoluteUrl.split('/').pop().split('?')[0] || `font-${Date.now()}.woff2`;
          zip.file(`fonts/${fileName}`, blob);
          hasFonts = true;
        } else {
           externalLinks.add(absoluteUrl);
        }
      } catch (e) {
        externalLinks.add(new URL(url, window.location.href).href);
      }
    }

    if (externalLinks.size > 0) {
      const linksText = Array.from(externalLinks).join('\n');
      zip.file('external-fonts-links.txt', linksText);
      hasFonts = true;
    }

    if (!hasFonts) return false;

    const content = await zip.generateAsync({ type: 'blob' });
    const downloadUrl = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = downloadUrl;
    
    const siteName = window.location.hostname.replace('www.', '') || 'website';
    a.download = `klonoo-${siteName}-fonts.zip`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);

    return true;
  };

  const extractAndDownloadIcons = async () => {
    const zip = new JSZip();
    let hasIcons = false;
    const externalLinks = new Set();
    const iconsFolder = zip.folder("icons");

    const iconLinks = document.querySelectorAll('link[rel~="icon"], link[rel="apple-touch-icon"]');
    for (const link of iconLinks) {
      if (link.href) {
        try {
          const absoluteUrl = new URL(link.href, window.location.href).href;
          const response = await fetch(absoluteUrl);
          if (response.ok) {
            const blob = await response.blob();
            const fileName = absoluteUrl.split('/').pop().split('?')[0] || `favicon-${Date.now()}.ico`;
            iconsFolder.file(fileName, blob);
            hasIcons = true;
          } else {
            externalLinks.add(absoluteUrl);
          }
        } catch (e) {
          externalLinks.add(link.href);
        }
      }
    }

    const svgs = document.querySelectorAll('svg');
    let svgCount = 0;
    svgs.forEach((svg) => {
      try {
        const serializer = new XMLSerializer();
        let source = serializer.serializeToString(svg);

        if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
          source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        if (!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)) {
          source = source.replace(/^<svg/, '<svg xmlns:xlink="http://www.w3.org/1999/xlink"');
        }

        source = '<?xml version="1.0" standalone="no"?>\r\n' + source;

        const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
        svgCount++;
        iconsFolder.file(`inline-icon-${Date.now()}-${svgCount}.svg`, blob);
        hasIcons = true;
      } catch (e) {
      }
    });

    if (externalLinks.size > 0) {
      const linksText = Array.from(externalLinks).join('\n');
      zip.file('external-icons-links.txt', linksText);
      hasIcons = true;
    }

    if (!hasIcons) return false;

    const content = await zip.generateAsync({ type: 'blob' });
    const downloadUrl = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = downloadUrl;
    
    const siteName = window.location.hostname.replace('www.', '') || 'website';
    a.download = `klonoo-${siteName}-icons.zip`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);

    return true;
  };

  const extractAndDownloadImages = async () => {
    const zip = new JSZip();
    let hasImages = false;
    const imageUrls = new Set();
    const externalLinks = new Set();
    const imagesFolder = zip.folder("images");

    const imgTags = document.querySelectorAll('img');
    imgTags.forEach(img => {
      if (img.src && !img.src.startsWith('data:') && !img.src.startsWith('chrome-extension://')) {
        imageUrls.add(img.src);
      }
    });

    const sourceTags = document.querySelectorAll('source');
    sourceTags.forEach(source => {
      if (source.srcset) {
        const urls = source.srcset.split(',').map(s => s.trim().split(' ')[0]);
        urls.forEach(url => {
          if (url && !url.startsWith('data:') && !url.startsWith('chrome-extension://')) {
            try {
              imageUrls.add(new URL(url, window.location.href).href);
            } catch (e) {
            }
          }
        });
      }
    });

    const elementsWithInlineBg = document.querySelectorAll('[style*="background"]');
    elementsWithInlineBg.forEach(el => {
      const bg = el.style.backgroundImage;
      if (bg && bg !== 'none') {
        const match = bg.match(/url\((['"]?)(.*?)\1\)/);
        if (match && match[2] && !match[2].startsWith('data:') && !match[2].startsWith('chrome-extension://')) {
          imageUrls.add(match[2]);
        }
      }
    });

    const styleSheets = Array.from(document.styleSheets);
    for (const sheet of styleSheets) {
      if (sheet.ownerNode && sheet.ownerNode.id === 'klonoo-fonts') {
        continue;
      }
      try {
        const rules = Array.from(sheet.cssRules || []);
        for (const rule of rules) {
          if (rule.type === CSSRule.STYLE_RULE && rule.style.backgroundImage && rule.style.backgroundImage !== 'none') {
            const bg = rule.style.backgroundImage;
            const urls = bg.match(/url\((['"]?)(.*?)\1\)/g);
            if (urls) {
              urls.forEach(u => {
                const match = u.match(/url\((['"]?)(.*?)\1\)/);
                if (match && match[2] && !match[2].startsWith('data:') && !match[2].startsWith('chrome-extension://')) {
                  imageUrls.add(match[2]);
                }
              });
            }
          }
        }
      } catch (e) {
      }
    }

    let imgCount = 0;
    for (const url of imageUrls) {
      try {
        const absoluteUrl = new URL(url, window.location.href).href;
        const response = await fetch(absoluteUrl);
        if (response.ok) {
          const blob = await response.blob();
          let fileName = absoluteUrl.split('/').pop().split('?')[0];
          if (!fileName || !fileName.includes('.')) {
            fileName = `image-${Date.now()}-${imgCount}.png`;
          }
          imagesFolder.file(fileName, blob);
          hasImages = true;
          imgCount++;
        } else {
          externalLinks.add(absoluteUrl);
        }
      } catch (e) {
        externalLinks.add(new URL(url, window.location.href).href);
      }
    }

    if (externalLinks.size > 0) {
      const linksText = Array.from(externalLinks).join('\n');
      zip.file('external-images-links.txt', linksText);
      hasImages = true;
    }

    if (!hasImages) return false;

    const content = await zip.generateAsync({ type: 'blob' });
    const downloadUrl = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = downloadUrl;
    
    const siteName = window.location.hostname.replace('www.', '') || 'website';
    a.download = `klonoo-${siteName}-images.zip`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);

    return true;
  };

  const extractAndDownloadDesignSystem = async () => {
    const ds = {
      colors: { text: new Set(), bg: new Set(), border: new Set() },
      typography: { families: new Set(), sizes: new Set(), weights: new Set(), lineHeights: new Set(), letterSpacings: new Set() },
      spacing: { padding: new Set(), margin: new Set(), gap: new Set() },
      borders: { radii: new Set(), widths: new Set() },
      effects: { shadows: new Set(), blur: new Set(), zIndex: new Set() },
      transitions: new Set()
    };

    const elements = document.querySelectorAll('body *:not(script):not(style):not(noscript):not(#klonoo-extension-root *)');

    const rgb2hex = (rgb) => {
      const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!match) return rgb;
      return "#" + match.slice(1).map(n => parseInt(n, 10).toString(16).padStart(2, '0')).join('');
    };

    elements.forEach(el => {
      const styles = window.getComputedStyle(el);

      if (styles.color && styles.color !== 'rgba(0, 0, 0, 0)') ds.colors.text.add(rgb2hex(styles.color));
      if (styles.backgroundColor && styles.backgroundColor !== 'rgba(0, 0, 0, 0)') ds.colors.bg.add(rgb2hex(styles.backgroundColor));
      if (styles.borderColor && styles.borderColor !== 'rgba(0, 0, 0, 0)') ds.colors.border.add(rgb2hex(styles.borderColor));

      if (styles.fontFamily) ds.typography.families.add(styles.fontFamily);
      if (styles.fontSize) ds.typography.sizes.add(styles.fontSize);
      if (styles.fontWeight) ds.typography.weights.add(styles.fontWeight);
      if (styles.lineHeight && styles.lineHeight !== 'normal') ds.typography.lineHeights.add(styles.lineHeight);
      if (styles.letterSpacing && styles.letterSpacing !== 'normal') ds.typography.letterSpacings.add(styles.letterSpacing);

      if (styles.padding && styles.padding !== '0px') ds.spacing.padding.add(styles.padding);
      if (styles.margin && styles.margin !== '0px') ds.spacing.margin.add(styles.margin);
      if (styles.gap && styles.gap !== 'normal') ds.spacing.gap.add(styles.gap);

      if (styles.borderRadius && styles.borderRadius !== '0px') ds.borders.radii.add(styles.borderRadius);
      if (styles.borderWidth && styles.borderWidth !== '0px') ds.borders.widths.add(styles.borderWidth);

      if (styles.boxShadow && styles.boxShadow !== 'none') ds.effects.shadows.add(styles.boxShadow);
      if (styles.backdropFilter && styles.backdropFilter !== 'none') ds.effects.blur.add(styles.backdropFilter);
      if (styles.zIndex && styles.zIndex !== 'auto') ds.effects.zIndex.add(styles.zIndex);

      if (styles.transitionDuration && styles.transitionDuration !== '0s') ds.transitions.add(styles.transition);
    });

    const sortPx = (a, b) => parseFloat(a) - parseFloat(b);

    const dsJSON = {
      colors: {
        text: Array.from(ds.colors.text),
        background: Array.from(ds.colors.bg),
        border: Array.from(ds.colors.border),
      },
      typography: {
        families: Array.from(ds.typography.families),
        sizes: Array.from(ds.typography.sizes).sort(sortPx),
        weights: Array.from(ds.typography.weights).sort(),
        lineHeights: Array.from(ds.typography.lineHeights).sort(sortPx),
        letterSpacings: Array.from(ds.typography.letterSpacings).sort(sortPx)
      },
      spacing: {
        padding: Array.from(ds.spacing.padding),
        margin: Array.from(ds.spacing.margin),
        gap: Array.from(ds.spacing.gap)
      },
      borders: {
        radii: Array.from(ds.borders.radii).sort(sortPx),
        widths: Array.from(ds.borders.widths).sort(sortPx)
      },
      effects: {
        shadows: Array.from(ds.effects.shadows),
        blur: Array.from(ds.effects.blur),
        zIndex: Array.from(ds.effects.zIndex).sort(sortPx)
      },
      transitions: Array.from(ds.transitions)
    };

    let cssContent = ':root {\n';
    Object.entries(dsJSON.colors).forEach(([type, values]) => {
      values.forEach((val, i) => cssContent += `  --color-${type}-${i + 1}: ${val};\n`);
    });
    dsJSON.typography.sizes.forEach((val, i) => cssContent += `  --font-size-${i + 1}: ${val};\n`);
    dsJSON.borders.radii.forEach((val, i) => cssContent += `  --radius-${i + 1}: ${val};\n`);
    cssContent += '}\n';

    const zip = new JSZip();
    zip.file('design-system.json', JSON.stringify(dsJSON, null, 2));
    zip.file('design-tokens.css', cssContent);

    const content = await zip.generateAsync({ type: 'blob' });
    const downloadUrl = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = downloadUrl;
    
    const siteName = window.location.hostname.replace('www.', '') || 'website';
    a.download = `klonoo-${siteName}-design-system.zip`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);

    return true;
  };

  const handleFontExport = async () => {
    switchView('CAPTURING');
    
    try {
      const success = await extractAndDownloadFonts();
      if (!success) {
        alert('No extractable fonts found on this page.');
      }
    } catch (error) {
      alert('An error occurred while exporting fonts.');
    }
    
    switchView('MAIN');
  };

  const handleIconExport = async () => {
    switchView('CAPTURING');
    
    try {
      const success = await extractAndDownloadIcons();
      if (!success) {
        alert('No extractable icons found on this page.');
      }
    } catch (error) {
      alert('An error occurred while exporting icons.');
    }
    
    switchView('MAIN');
  };

  const handleImageExport = async () => {
    switchView('CAPTURING');
    
    try {
      const success = await extractAndDownloadImages();
      if (!success) {
        alert('No extractable images found on this page.');
      }
    } catch (error) {
      alert('An error occurred while exporting images.');
    }
    
    switchView('MAIN');
  };

  const handleDesignExport = async () => {
    switchView('CAPTURING');
    
    try {
      const success = await extractAndDownloadDesignSystem();
      if (!success) {
        alert('No design elements could be extracted.');
      }
    } catch (error) {
      alert('An error occurred while exporting the design system.');
    }
    
    switchView('MAIN');
  };

  const cancelCapture = () => {
    switchView('EXPORT');
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

      <button onClick={handleFontExport} className="flex items-center gap-2 hover:bg-white/10 px-2 py-1.5 rounded-lg transition-all duration-200 cursor-pointer group relative active:scale-95">
        <RiFontSizeAi className="text-base text-gray-400 group-hover:text-white transition-colors duration-200" />
        <span className="hidden min-[769px]:inline-block">Font</span>
        <span className="absolute top-full mt-2 bg-[#2a2a2a] text-white text-[11px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg border border-white/10 hidden max-[768px]:block" style={{ left: '50%', transform: 'translateX(-50%)' }}>Font</span>
      </button>

      <button onClick={handleIconExport} className="flex items-center gap-2 hover:bg-white/10 px-2 py-1.5 rounded-lg transition-all duration-200 cursor-pointer group relative active:scale-95">
        <RiColorFilterAiLine className="text-base text-gray-400 group-hover:text-white transition-colors duration-200" />
        <span className="hidden min-[769px]:inline-block">Icon</span>
        <span className="absolute top-full mt-2 bg-[#2a2a2a] text-white text-[11px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg border border-white/10 hidden max-[768px]:block" style={{ left: '50%', transform: 'translateX(-50%)' }}>Icons</span>
      </button>

      <button onClick={handleImageExport} className="flex items-center gap-2 hover:bg-white/10 px-2 py-1.5 rounded-lg transition-all duration-200 cursor-pointer group relative active:scale-95">
        <RiImageAiLine className="text-base text-gray-400 group-hover:text-white transition-colors duration-200" />
        <span className="hidden min-[769px]:inline-block">Image</span>
        <span className="absolute top-full mt-2 bg-[#2a2a2a] text-white text-[11px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap shadow-lg border border-white/10 hidden max-[768px]:block" style={{ left: '50%', transform: 'translateX(-50%)' }}>Images</span>
      </button>

      <button onClick={handleDesignExport} className="flex items-center gap-2 hover:bg-white/10 px-2 py-1.5 rounded-lg transition-all duration-200 cursor-pointer group relative active:scale-95">
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

  const renderCapturingView = () => (
    <>
      <div className="flex items-center gap-2 px-3 py-1.5 cursor-default">
        <RiLoader4Line className="text-base text-gray-400 animate-spin" />
        <span>Capturing...</span>
      </div>
      <div className="w-[1px] h-4 bg-white/20 mx-1"></div>
      <button onClick={cancelCapture} className="flex items-center gap-2 hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all duration-200 cursor-pointer active:scale-95 text-gray-300 hover:text-white">
        <span>Cancel</span>
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
          {currentView === 'CAPTURING' && renderCapturingView()}
        </div>
      </div>
    </div>
  );
}