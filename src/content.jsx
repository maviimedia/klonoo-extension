import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

if (!document.getElementById('klonoo-extension-root')) {
  
  if (!document.getElementById('klonoo-fonts')) {
    const fontStyle = document.createElement('style')
    fontStyle.id = 'klonoo-fonts'
    fontStyle.textContent = `
      @font-face {
        font-family: 'Manrope';
        src: url('${chrome.runtime.getURL('manrope/Manrope-Regular.ttf')}') format('truetype');
        font-weight: 400;
        font-style: normal;
      }
      @font-face {
        font-family: 'Manrope';
        src: url('${chrome.runtime.getURL('manrope/Manrope-Medium.ttf')}') format('truetype');
        font-weight: 500;
        font-style: normal;
      }
      @font-face {
        font-family: 'Manrope';
        src: url('${chrome.runtime.getURL('manrope/Manrope-SemiBold.ttf')}') format('truetype');
        font-weight: 600;
        font-style: normal;
      }
    `
    document.head.appendChild(fontStyle)
  }

  const hostElement = document.createElement('div')
  hostElement.id = 'klonoo-extension-root'
  hostElement.style.position = 'fixed'
  hostElement.style.top = '0'
  hostElement.style.left = '0'
  hostElement.style.width = '100%'
  hostElement.style.height = '0'
  hostElement.style.zIndex = '2147483647'
  hostElement.style.pointerEvents = 'none'
  
  document.body.appendChild(hostElement)

  const shadowRoot = hostElement.attachShadow({ mode: 'open' })

  const styleLink = document.createElement('link')
  styleLink.rel = 'stylesheet'
  styleLink.href = chrome.runtime.getURL('klonoo.css')
  shadowRoot.appendChild(styleLink)

  const renderRoot = document.createElement('div')
  shadowRoot.appendChild(renderRoot)

  ReactDOM.createRoot(renderRoot).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}