import JSZip from 'jszip';
import React, { useState, useEffect, useRef } from 'react';
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

  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const [isSelectingElement, setIsSelectingElement] = useState(false);
  const [hoveredRect, setHoveredRect] = useState(null);
  const hoveredRectRef = useRef(null);

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

  const triggerScreenSelection = () => {
    setIsSelecting(true);
  };

  const triggerElementSelection = () => {
    setIsSelectingElement(true);
    setHoveredRect(null);
    hoveredRectRef.current = null;
  };

  useEffect(() => {
    if (!isSelectingElement) return;

  const handleMouseMove = (e) => {
      const elements = document.elementsFromPoint(e.clientX, e.clientY);
      const target = elements.find(el => 
        !el.closest('#klonoo-extension-root') && 
        el.id !== 'klonoo-element-highlight'
      );

      if (target) {
        const rect = target.getBoundingClientRect();
        const newRect = {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        };
        setHoveredRect(newRect);
        hoveredRectRef.current = newRect; 
      }
    };

  const handleClick = (e) => {
      e.preventDefault();
      e.stopPropagation();

      const rectToCapture = hoveredRectRef.current;
      setHoveredRect(null);
      hoveredRectRef.current = null;

      if (!rectToCapture || rectToCapture.width === 0 || rectToCapture.height === 0) {
        setIsSelectingElement(false);
        return;
      }

      setTimeout(() => {
        chrome.runtime.sendMessage({ action: "CAPTURE_VISIBLE" }, (response) => {
          if (response && response.dataUrl) {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const dpr = window.devicePixelRatio || 1;

              const viewportY = Math.max(0, rectToCapture.top);
              const viewportX = Math.max(0, rectToCapture.left);
              const cutTop = viewportY - rectToCapture.top;
              const cutLeft = viewportX - rectToCapture.left;
              const visibleWidth = Math.min(rectToCapture.width - cutLeft, window.innerWidth - viewportX);
              const visibleHeight = Math.min(rectToCapture.height - cutTop, window.innerHeight - viewportY);

              canvas.width = visibleWidth * dpr;
              canvas.height = visibleHeight * dpr;
              const ctx = canvas.getContext('2d');

              ctx.drawImage(
                img,
                viewportX * dpr, viewportY * dpr, visibleWidth * dpr, visibleHeight * dpr,
                0, 0, visibleWidth * dpr, visibleHeight * dpr
              );

              const croppedDataUrl = canvas.toDataURL('image/png');
              const a = document.createElement('a');
              a.href = croppedDataUrl;
              const siteName = window.location.hostname.replace('www.', '') || 'website';
              a.download = `klonoo-${siteName}-element.png`;
              a.click();

              setIsSelectingElement(false); 
              switchView('MAIN');
            };
            img.src = response.dataUrl;
          } else {
            setIsSelectingElement(false);
            switchView('MAIN');
          }
        });
      }, 400);
    };

  const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsSelectingElement(false);
        setHoveredRect(null);
        hoveredRectRef.current = null;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, true);
    window.addEventListener('click', handleClick, true);
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove, true);
      window.removeEventListener('click', handleClick, true);
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isSelectingElement]);

  const handleMouseDown = (e) => {
    setStartPos({ x: e.clientX, y: e.clientY });
    setCurrentPos({ x: e.clientX, y: e.clientY });
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setCurrentPos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = async () => {
    setIsDragging(false);

    const x = Math.min(startPos.x, currentPos.x);
    const y = Math.min(startPos.y, currentPos.y);
    const width = Math.abs(currentPos.x - startPos.x);
    const height = Math.abs(currentPos.y - startPos.y);

    if (width < 10 || height < 10) {
      setIsSelecting(false);
      return; 
    }

    setTimeout(() => {
      try {
        chrome.runtime.sendMessage({ action: "CAPTURE_VISIBLE" }, (response) => {
          if (response && response.dataUrl) {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              const dpr = window.devicePixelRatio || 1;
              
              canvas.width = width * dpr;
              canvas.height = height * dpr;
              const ctx = canvas.getContext('2d');

              ctx.drawImage(
                img,
                x * dpr, y * dpr, width * dpr, height * dpr,
                0, 0, width * dpr, height * dpr
              );

              const croppedDataUrl = canvas.toDataURL('image/png');
              const a = document.createElement('a');
              a.href = croppedDataUrl;
              const siteName = window.location.hostname.replace('www.', '') || 'website';
              a.download = `klonoo-${siteName}-screen.png`;
              a.click();
              
              setIsSelecting(false);
              switchView('MAIN');
            };
            img.src = response.dataUrl;
          } else {
            setIsSelecting(false);
            switchView('MAIN');
          }
        });
      } catch (e) {
        setIsSelecting(false);
        switchView('MAIN');
      }
    }, 400);
  };

  const handleFullPageCapture = async () => {
    switchView('CAPTURING');
    
    const klonooRoot = document.getElementById('klonoo-extension-root');
    if (klonooRoot) klonooRoot.style.display = 'none';

    const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    let totalHeight = Math.max(
      document.body.scrollHeight, 
      document.documentElement.scrollHeight,
      document.body.offsetHeight, 
      document.documentElement.offsetHeight,
      document.documentElement.clientHeight
    );
    const viewportHeight = window.innerHeight;

    window.scrollTo(0, 0);
    await wait(600); 

    const freezeStyle = document.createElement('style');
    freezeStyle.id = 'klonoo-freeze';
    freezeStyle.innerHTML = `
      *, *::before, *::after {
        transition: none !important;
        animation: none !important;
        scroll-behavior: auto !important;
      }
      ::-webkit-scrollbar { display: none !important; }
      body { overflow-x: hidden !important; }
    `;
    document.head.appendChild(freezeStyle);

    const dpr = window.devicePixelRatio || 1;
    const canvas = document.createElement('canvas');
    canvas.width = window.innerWidth * dpr;
    canvas.height = totalHeight * dpr;
    const ctx = canvas.getContext('2d');

    const hideFloatingElements = () => {
      const hidden = [];
      const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_ELEMENT, null, false);
      let node;
      while (node = walker.nextNode()) {
        if (node.id === 'klonoo-extension-root') continue;
        const style = window.getComputedStyle(node);
        if (style.position === 'fixed' || style.position === 'sticky') {
          hidden.push({ node, originalStyle: node.getAttribute('style') });
          node.style.setProperty('opacity', '0', 'important');
          node.style.setProperty('visibility', 'hidden', 'important');
        }
      }
      return hidden;
    };

    const restoreFloatingElements = (hidden) => {
      hidden.forEach(item => {
        if (item.originalStyle === null) {
          item.node.removeAttribute('style');
        } else {
          item.node.setAttribute('style', item.originalStyle);
        }
      });
    };

    let globalHiddenElements = [];

    for (let currentY = 0; currentY < totalHeight; currentY += viewportHeight) {
      window.scrollTo(0, currentY);
      await wait(400); 

      if (currentY > 0) {
        globalHiddenElements = hideFloatingElements();
        await wait(50); 
      }

      const response = await new Promise(resolve => {
        chrome.runtime.sendMessage({ action: "CAPTURE_VISIBLE" }, resolve);
      });
      
      if (response && response.dataUrl) {
        const img = new Image();
        await new Promise((resolve) => {
          img.onload = () => {
            const drawY = window.scrollY * dpr;
            ctx.drawImage(
              img, 
              0, 0, img.width, img.height,
              0, drawY, window.innerWidth * dpr, window.innerHeight * dpr
            );
            resolve();
          };
          img.src = response.dataUrl;
        });
      }

      if (currentY > 0) {
        restoreFloatingElements(globalHiddenElements);
      }
    }

    if (document.getElementById('klonoo-freeze')) {
      document.head.removeChild(freezeStyle);
    }
    
    window.scrollTo(0, 0);
    if (klonooRoot) klonooRoot.style.display = 'block';

    const finalDataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = finalDataUrl;
    const siteName = window.location.hostname.replace('www.', '') || 'website';
    a.download = `klonoo-${siteName}-fullpage.png`;
    a.click();
    
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

      <button onClick={triggerScreenSelection} className="flex items-center px-3 py-1.5 hover:bg-white/10 rounded-lg transition-all duration-200 cursor-pointer active:scale-95 text-gray-300 hover:text-white">
        <span>Screen</span>
      </button>
      
      <button onClick={triggerElementSelection} className="flex items-center px-3 py-1.5 hover:bg-white/10 rounded-lg transition-all duration-200 cursor-pointer active:scale-95 text-gray-300 hover:text-white">
        <span>Element</span>
      </button>
      
      <button onClick={handleFullPageCapture} className="flex items-center px-3 py-1.5 hover:bg-white/10 rounded-lg transition-all duration-200 cursor-pointer active:scale-95 text-gray-300 hover:text-white">
        <span>Full Page</span>
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
    <>
      {isSelecting && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            cursor: 'crosshair',
            zIndex: 2147483647,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            pointerEvents: 'auto'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove} 
          onMouseUp={handleMouseUp}
        >
          {isDragging && (
            <div
              style={{
                position: 'absolute',
                border: '2px dashed #3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.15)',
                left: `${Math.min(startPos.x, currentPos.x)}px`,
                top: `${Math.min(startPos.y, currentPos.y)}px`,
                width: `${Math.abs(currentPos.x - startPos.x)}px`,
                height: `${Math.abs(currentPos.y - startPos.y)}px`,
                pointerEvents: 'none'
              }}
            />
          )}
        </div>
      )}

      {isSelectingElement && hoveredRect && (
        <div
          id="klonoo-element-highlight"
          style={{
            position: 'fixed',
            top: `${hoveredRect.top}px`,
            left: `${hoveredRect.left}px`,
            width: `${hoveredRect.width}px`,
            height: `${hoveredRect.height}px`,
            border: '2px solid #3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.15)',
            pointerEvents: 'none', 
            zIndex: 2147483647,
            transition: 'all 0.05s linear', 
            cursor: 'crosshair'
          }}
        />
      )}

      <div
        style={{
          position: 'absolute',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          pointerEvents: 'auto',
          zIndex: 2147483646,
          display: isSelecting || isSelectingElement ? 'none' : 'block' 
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
    </>
  );
}