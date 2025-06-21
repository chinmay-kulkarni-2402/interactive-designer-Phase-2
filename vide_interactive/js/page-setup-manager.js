class PageSetupManager {
  constructor(editor) {
    this.editor = editor
    this.pageSettings = {
      format: "a4",
      orientation: "portrait",
      numberOfPages: 1,
      pages: [],
      width: 210,
      height: 297,
      margins: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      },
      backgroundColor: "#ffffff", // Added background color setting
      pageNumbering: {
        enabled: false,
        startFromPage: 1,
        excludedPages: [],
      },
      watermark: {
        enabled: false,
        type: "text", // 'text', 'image', 'both'
        text: {
          content: "CONFIDENTIAL",
          font: "Arial",
          fontSize: 48,
          color: "#cccccc",
          opacity: 0.3,
          rotation: -45,
        },
        image: {
          url: "",
          width: 200,
          height: 200,
          opacity: 0.3,
        },
        position: "center", // 'center', 'top-left', 'top-right', 'bottom-left', 'bottom-right'
        applyToAllPages: true,
      },
    }
    this.isInitialized = false
    this.currentPageIndex = 0

    // Page format dimensions in mm
    this.pageFormats = {
      a4: { width: 210, height: 297 },
      a3: { width: 297, height: 420 },
      a2: { width: 420, height: 594 },
      a1: { width: 594, height: 841 },
      a0: { width: 841, height: 1189 },
      letter: { width: 215.9, height: 279.4 },
      legal: { width: 215.9, height: 355.6 },
      a5: { width: 148, height: 210 },
      custom: { width: 210, height: 297 },
    }

    // Default header/footer sizes
    this.defaultSizes = {
      header: { height: 20, padding: 10 },
      footer: { height: 20, padding: 10 },
    }

    // Sections functionality
    this.sectionsSettings = {
      enabled: false,
      sections: [],
    }

    this.init()
  }

  init() {
    this.createInitialSetupModal()
    this.setupEventListeners()
    this.injectPageSetupStyles()
    this.addToGrapesJSSettings()
    this.setupCanvasObserver()
    this.setupContentBoundaryEnforcement()
  }

  setupCanvasObserver() {
    // Observer to watch for canvas changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList" && this.isInitialized) {
          setTimeout(() => {
            this.updateAllPageVisuals()
            this.enforceContentBoundaries()
            if (this.sectionsSettings.enabled) {
              this.updateSectionsDisplay()
            }
          }, 100)
        }
      })
    })

    // Start observing when editor is ready
    this.editor.on("load", () => {
      const canvas = this.editor.Canvas.getBody()
      if (canvas) {
        observer.observe(canvas, {
          childList: true,
          subtree: true,
        })
      }
    })
  }

  setupContentBoundaryEnforcement() {
    // Prevent content from being added outside page boundaries
    this.editor.on("component:add", (component) => {
      if (this.isInitialized) {
        setTimeout(() => {
          this.enforceContentBoundaries()
        }, 100)
      }
    })

    this.editor.on("component:update", (component) => {
      if (this.isInitialized) {
        setTimeout(() => {
          this.enforceContentBoundaries()
        }, 100)
      }
    })

    // Enhanced boundary enforcement - prevent adding content outside pages
    this.editor.on("component:drag:start", (component) => {
      if (this.isInitialized) {
        this.setupDragBoundaries()
      }
    })
  }

  enforceContentBoundaries() {
    if (!this.isInitialized) return

    const canvasBody = this.editor.Canvas.getBody()
    const pageElements = canvasBody.querySelectorAll(".page-container")

    // Check for content outside all pages
    const allComponents = this.editor.getWrapper().components()

    allComponents.forEach((component) => {
      const componentEl = component.getEl()
      if (!componentEl || componentEl.classList.contains("page-container")) return

      let isInsidePage = false
      pageElements.forEach((pageElement) => {
        const pageRect = pageElement.getBoundingClientRect()
        const componentRect = componentEl.getBoundingClientRect()

        if (
          componentRect.left >= pageRect.left &&
          componentRect.right <= pageRect.right &&
          componentRect.top >= pageRect.top &&
          componentRect.bottom <= pageRect.bottom
        ) {
          isInsidePage = true
        }
      })

      if (!isInsidePage) {
        // Show error and remove component
        this.showBoundaryError()
        component.remove()
        return
      }
    })

    pageElements.forEach((pageElement, pageIndex) => {
      const pageContent = pageElement.querySelector(".main-content-area")
      if (pageContent) {
        // Get all child elements in the main content area
        const children = pageContent.querySelectorAll("*")
        children.forEach((child) => {
          const rect = child.getBoundingClientRect()
          const pageRect = pageContent.getBoundingClientRect()

          // Check if element is outside page boundaries
          if (
            rect.right > pageRect.right ||
            rect.bottom > pageRect.bottom ||
            rect.left < pageRect.left ||
            rect.top < pageRect.top
          ) {
            // Show error and adjust element position to stay within boundaries
            this.showBoundaryError()

            const style = window.getComputedStyle(child)
            const left = Number.parseInt(style.left) || 0
            const top = Number.parseInt(style.top) || 0

            if (rect.right > pageRect.right) {
              child.style.left = Math.max(0, left - (rect.right - pageRect.right)) + "px"
            }
            if (rect.bottom > pageRect.bottom) {
              child.style.top = Math.max(0, top - (rect.bottom - pageRect.bottom)) + "px"
            }
            if (rect.left < pageRect.left) {
              child.style.left = Math.max(0, left + (pageRect.left - rect.left)) + "px"
            }
            if (rect.top < pageRect.top) {
              child.style.top = Math.max(0, top + (pageRect.top - rect.top)) + "px"
            }
          }
        })
      }
    })
  }

  showBoundaryError() {
    // Show error message for boundary violation
    const errorMsg = document.createElement("div")
    errorMsg.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #dc3545;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      z-index: 10000;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
      animation: slideIn 0.3s ease-out;
    `
    errorMsg.innerHTML = "⚠️ Content cannot be placed outside page boundaries!"

    // Add animation
    const style = document.createElement("style")
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `
    document.head.appendChild(style)

    document.body.appendChild(errorMsg)

    setTimeout(() => {
      errorMsg.remove()
      style.remove()
    }, 3000)
  }

  setupDragBoundaries() {
    // Enhanced drag boundary setup
    const canvasBody = this.editor.Canvas.getBody()
    const pageElements = canvasBody.querySelectorAll(".page-container .main-content-area")

    // Set droppable areas only to main content areas
    pageElements.forEach((pageContent) => {
      pageContent.style.position = "relative"
      pageContent.setAttribute("data-droppable", "true")
    })
  }

  injectPageSetupStyles() {
    const styles = `
      <style id="enhanced-page-setup-styles">
        .page-setup-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          z-index: 10001;
          display: none;
          align-items: center;
          justify-content: center;
        }
        
        .page-setup-content {
          background: white;
          border-radius: 12px;
          padding: 30px;
          max-width: 800px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          color: #000 !important;
        }
        
        .page-setup-content * {
          color: #000 !important;
        }
        
        .page-setup-header {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .page-setup-header h2 {
          color: #333 !important;
          margin: 0 0 10px 0;
          font-size: 24px;
          font-weight: bold;
        }
        
        .page-setup-section {
          margin-bottom: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }
        
        .page-setup-section h3 {
          margin: 0 0 15px 0;
          color: #333 !important;
          font-size: 16px;
          font-weight: 600;
        }
        
        .page-setup-row {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
          gap: 15px;
        }
        
        .page-setup-label {
          min-width: 120px;
          font-weight: 500;
          color: #555 !important;
        }
        
        .page-setup-control {
          flex: 1;
          padding: 8px 10px;
          border: 2px solid #e9ecef;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
          color: #000 !important;
        }
        
        .page-setup-control:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        }
        
        .page-setup-custom-size {
          display: none;
          margin-top: 15px;
          padding: 15px;
          background: white;
          border-radius: 6px;
          border: 1px solid #dee2e6;
        }
        
        .page-setup-custom-size.active {
          display: block;
        }
        
        .page-setup-custom-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 10px;
        }

        .margins-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 10px;
          margin-top: 10px;
        }

        .watermark-controls {
          display: none;
          margin-top: 15px;
          padding: 15px;
          background: white;
          border-radius: 6px;
          border: 1px solid #dee2e6;
        }

        .watermark-controls.active {
          display: block;
        }

        .watermark-type-controls {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          margin: 10px 0;
        }

        .watermark-type-btn {
          padding: 8px 12px;
          border: 2px solid #e9ecef;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          text-align: center;
          transition: all 0.2s;
        }

        .watermark-type-btn.active {
          border-color: #007bff;
          background: #007bff;
          color: white !important;
        }
        
        .page-setup-actions {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin-top: 30px;
        }
        
        .page-setup-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 100px;
        }
        
        .page-setup-btn-primary {
          background: #007bff;
          color: white !important;
        }
        
        .page-setup-btn-primary:hover {
          background: #0056b3;
        }
        
        .page-setup-btn-secondary {
          background: #6c757d;
          color: white !important;
        }
        
        .page-setup-btn-secondary:hover {
          background: #545b62;
        }
        
        .page-canvas-container {
          position: relative;
          background: #f0f0f0;
          border: 2px solid #ddd;
          margin: 20px;
          overflow: visible;
        }
        
        .page-canvas {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          margin: 20px auto;
          position: relative;
          border: 2px solid transparent !important; /* Fixed: Always show full border */
          overflow: hidden !important;
          transition: border-color 0.2s ease;
        }
        
        .page-canvas:hover {
          border-color: #007bff !important; /* Fixed: Show full border on hover */
        }
        
        .page-canvas.selected,
        .page-canvas:focus {
          border-color: #007bff !important; /* Fixed: Show full border when selected */
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3) !important;
        }
        
        .page-indicator {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(0, 123, 255, 0.9);
          color: white;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          z-index: 1000;
          pointer-events: none;
        }
        
        .page-delete-btn {
          background: #dc3545;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          margin-left: 10px;
        }
        
        .page-delete-btn:hover {
          background: #c82333;
        }

        .page-watermark {
          position: absolute !important;
          pointer-events: none !important;
          user-select: none !important;
          z-index: 1 !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        .page-watermark-text {
          font-family: Arial, sans-serif !important;
          font-weight: bold !important;
          white-space: nowrap !important;
        }

        .page-watermark-image {
          max-width: 100% !important;
          max-height: 100% !important;
          object-fit: contain !important;
        }

        /* Page Elements Styles - Contained within page */
        .page-header-element {
          position: static !important; /* Fixed: Changed from absolute to static */
          width: 100% !important;
          padding: 10px !important;
          text-align: center !important;
          font-size: 12px !important;
          color: #333 !important;
          z-index: 1000 !important;
          min-height: 20px !important;
          box-sizing: border-box !important;
          pointer-events: none !important;
          user-select: none !important;
          display: flex !important;
          align-items: center !important;
          font-family: Arial, sans-serif !important;
          flex-shrink: 0 !important;
        }
        
        .page-footer-element {
          position: static !important; /* Fixed: Changed from absolute to static */
          width: 100% !important;
          padding: 10px !important;
          text-align: center !important;
          font-size: 12px !important;
          color: #333 !important;
          z-index: 1000 !important;
          min-height: 20px !important;
          box-sizing: border-box !important;
          pointer-events: none !important;
          user-select: none !important;
          display: flex !important;
          align-items: center !important;
          font-family: Arial, sans-serif !important;
          flex-shrink: 0 !important;
        }
        
        .page-number-element {
          position: absolute !important;
          background: rgba(255, 255, 255, 0.9) !important;
          padding: 4px 8px !important;
          border-radius: 3px !important;
          font-size: 11px !important;
          color: #333 !important;
          z-index: 2000 !important;
          border: 1px solid #dee2e6 !important;
          pointer-events: none !important;
          user-select: none !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          min-width: 20px !important;
          min-height: 20px !important;
          font-family: Arial, sans-serif !important;
        }

        /* Position Grid */
        .position-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 10px;
        }
        
        .position-option {
          padding: 8px;
          border: 2px solid #e9ecef;
          border-radius: 4px;
          text-align: center;
          cursor: pointer;
          font-size: 11px;
          transition: all 0.2s;
          color: #000 !important;
        }
        
        .position-option:hover {
          border-color: #007bff;
          background: #f8f9ff;
        }
        
        .position-option.selected {
          border-color: #007bff;
          background: #007bff;
          color: white !important;
        }

        .size-controls {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 10px;
        }

        /* Enhanced Sections Styles - Fixed positioning and visibility */
        .virtual-sections-panel {
          position: absolute;
          left: -220px;
          top: 0;
          width: 200px;
          height: 100%;
          background: rgba(255, 255, 255, 0.98);
          border: 2px solid #007bff;
          border-radius: 8px 0 0 8px;
          z-index: 1500;
          pointer-events: none;
          user-select: none;
          box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
        }

        .page-section {
          position: absolute;
          left: 0;
          right: 0;
          border-bottom: 2px dashed #007bff;
          background: rgba(0, 123, 255, 0.08);
          z-index: 500;
          box-sizing: border-box;
          min-height: 20px;
        }

        .page-section-label {
          position: absolute;
          left: -200px;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.98);
          padding: 6px 12px;
          border: 2px solid #007bff;
          border-radius: 6px;
          font-size: 12px;
          color: #007bff;
          font-weight: 600;
          white-space: nowrap;
          z-index: 1600;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          min-width: 80px;
          text-align: center;
        }

        .page-section-label.header-label {
          color: #28a745;
          border-color: #28a745;
        }

        .page-section-label.footer-label {
          color: #dc3545;
          border-color: #dc3545;
        }

        .page-section-dashed-line {
          position: absolute;
          left: 0;
          right: -30px;
          bottom: 0;
          height: 0;
          border-top: 2px dashed #007bff;
          z-index: 550;
        }

        .section-panel-toggle {
          position: fixed;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: #007bff;
          color: white;
          border: none;
          padding: 10px;
          border-radius: 50%;
          cursor: pointer;
          z-index: 1001;
          font-size: 14px;
          width: 40px;
          height: 40px;
          display: none;
        }

        .section-panel-toggle.active {
          display: block;
        }

        .sections-list {
          max-height: 200px;
          overflow-y: auto;
          border: 1px solid #e9ecef;
          border-radius: 4px;
          padding: 10px;
          margin-top: 10px;
        }

        .section-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px;
          margin-bottom: 5px;
          background: #f8f9fa;
          border-radius: 4px;
          border: 1px solid #e9ecef;
        }

        .section-item-info {
          flex: 1;
        }

        .section-item-name {
          font-weight: 500;
          color: #333 !important;
          font-size: 12px;
        }

        .section-item-height {
          font-size: 11px;
          color: #666 !important;
        }

        .section-item-actions {
          display: flex;
          gap: 5px;
        }

        .section-btn-small {
          padding: 4px 8px;
          border: none;
          border-radius: 3px;
          font-size: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .section-btn-edit {
          background: #28a745;
          color: white;
        }

        .section-btn-delete {
          background: #dc3545;
          color: white;
        }

        /* Content boundary enforcement */
        .page-content {
          overflow: hidden !important;
          position: relative !important;
        }

        .main-content-area {
          overflow: hidden !important;
          position: relative !important;
        }

        .main-content-area > * {
          max-width: 100% !important;
          word-wrap: break-word !important;
          box-sizing: border-box !important;
        }
        
        @media (max-width: 768px) {
          .page-setup-content {
            padding: 20px;
            margin: 10px;
          }
          
          .page-setup-row {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
          }
          
          .page-setup-label {
            min-width: auto;
          }
        }
        
        /* Enhanced Print styles for exact page capture */
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          .page-container {
            page-break-after: always !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            height: 100vh !important;
            display: block !important;
            position: relative !important;
            overflow: hidden !important;
            /* Preserve background color in print */
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .page-content {
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            position: relative !important;
            overflow: hidden !important;
            /* Preserve background color in print */
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .main-content-area {
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            position: relative !important;
            /* Preserve background color in print */
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          .page-indicator,
          .virtual-sections-panel,
          .section-panel-toggle,
          .page-section-label,
          .page-section-dashed-line,
          .page-section {
            display: none !important;
          }

          .page-watermark {
            display: flex !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            pointer-events: none !important;
            z-index: 1 !important;
          }

          .page-header-element {
            display: flex !important;
            position: static !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-family: Arial, sans-serif !important;
            z-index: 1000 !important;
          }
          
          .page-footer-element {
            display: flex !important;
            position: static !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-family: Arial, sans-serif !important;
            z-index: 1000 !important;
          }
          
          .page-number-element {
            display: flex !important;
            position: absolute !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-family: Arial, sans-serif !important;
            z-index: 2000 !important;
          }
        }

        .page-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          background: #e3f2fd;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #bbdefb;
        }
        .page-info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .page-info-item label {
          font-weight: 500;
          color: #1976d2 !important;
          font-size: 12px;
        }
        .page-info-value {
          font-weight: 600;
          color: #0d47a1 !important;
          font-size: 12px;
          background: white;
          padding: 4px 8px;
          border-radius: 4px;
          border: 1px solid #90caf9;
        }

        .page-numbering-controls {
          display: none;
          margin-top: 15px;
          padding: 15px;
          background: white;
          border-radius: 6px;
          border: 1px solid #dee2e6;
        }

        .page-numbering-controls.active {
          display: block;
        }

        /* Background color controls */
        .background-color-controls {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          align-items: center;
          margin-top: 10px;
        }

        .color-preview {
          width: 40px;
          height: 40px;
          border: 2px solid #dee2e6;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .color-preview:hover {
          border-color: #007bff;
          transform: scale(1.05);
        }
      </style>
    `

    if (!document.getElementById("enhanced-page-setup-styles")) {
      document.head.insertAdjacentHTML("beforeend", styles)
    }
  }

  createInitialSetupModal() {
    const modalHTML = `
      <div id="pageSetupModal" class="page-setup-modal">
        <div class="page-setup-content">
          <div class="page-setup-header">
            <h2>📄 Enhanced Page Setup</h2>
            <p>Configure your document pages with advanced features</p>
          </div>
          
          <div class="page-setup-section">
            <h3>📐 Page Format & Orientation</h3>
            <div class="page-setup-row">
              <label class="page-setup-label">Format:</label>
              <select id="pageFormat" class="page-setup-control">
                <option value="a4" selected>A4 (210 × 297 mm)</option>
                <option value="a3">A3 (297 × 420 mm)</option>
                <option value="a2">A2 (420 × 594 mm)</option>
                <option value="a1">A1 (594 × 841 mm)</option>
                <option value="a0">A0 (841 × 1189 mm)</option>
                <option value="letter">Letter (8.5 × 11 in)</option>
                <option value="legal">Legal (8.5 × 14 in)</option>
                <option value="a5">A5 (148 × 210 mm)</option>
                <option value="custom">Custom Size</option>
              </select>
            </div>
            
            <div class="page-setup-row">
              <label class="page-setup-label">Orientation:</label>
              <select id="pageOrientation" class="page-setup-control">
                <option value="portrait" selected>Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
            
            <div id="customSizeSection" class="page-setup-custom-size">
              <h4>Custom Dimensions</h4>
              <div class="page-setup-custom-row">
                <div>
                  <label>Width:</label>
                  <input type="number" id="customWidth" class="page-setup-control" value="210" min="50" max="2000">
                </div>
                <div>
                  <label>Height:</label>
                  <input type="number" id="customHeight" class="page-setup-control" value="297" min="50" max="2000">
                </div>
              </div>
            </div>
          </div>

          <div class="page-setup-section">
            <h3>🎨 Page Background</h3>
            <div class="page-setup-row">
              <label class="page-setup-label">Background Color:</label>
              <div class="background-color-controls">
                <input type="color" id="pageBackgroundColor" class="page-setup-control" value="#ffffff">
                <div class="color-preview" id="backgroundColorPreview" style="background-color: #ffffff;"></div>
              </div>
            </div>
            <p style="font-size: 12px; color: #666; margin-top: 5px;">Background color will be preserved in headers, footers, and print/PDF output</p>
          </div>

          <div class="page-setup-section">
            <h3>📏 Page Margins (mm)</h3>
            <p style="font-size: 12px; color: #666; margin-bottom: 10px;">Margins will reduce the available content area</p>
            <div class="margins-grid">
              <div>
                <label>Top:</label>
                <input type="number" id="marginTop" class="page-setup-control" value="0" min="0" max="50">
              </div>
              <div>
                <label>Bottom:</label>
                <input type="number" id="marginBottom" class="page-setup-control" value="0" min="0" max="50">
              </div>
              <div>
                <label>Left:</label>
                <input type="number" id="marginLeft" class="page-setup-control" value="0" min="0" max="50">
              </div>
              <div>
                <label>Right:</label>
                <input type="number" id="marginRight" class="page-setup-control" value="0" min="0" max="50">
              </div>
            </div>
          </div>
          
          <div class="page-setup-section">
            <h3>📊 Pages</h3>
            <div class="page-setup-row">
              <label class="page-setup-label">Number of Pages:</label>
              <input type="number" id="numberOfPages" class="page-setup-control" value="1" min="1" max="100">
            </div>
          </div>

        <!--  <div class="page-setup-section">
            <h3>💧 Page Watermark</h3>
            <div class="page-setup-row">
              <label>
                <input type="checkbox" id="enableWatermark" style="border: 2px solid #000 !important;"> Enable Watermark
              </label>
            </div>
            <div id="watermarkControls" class="watermark-controls">
              <div class="page-setup-row">
                <label class="page-setup-label">Type:</label>
                <div class="watermark-type-controls">
                  <div class="watermark-type-btn active" data-type="text">Text</div>
                  <div class="watermark-type-btn" data-type="image">Image</div>
                  <div class="watermark-type-btn" data-type="both">Both</div>
                </div>
              </div>
              
              <div id="watermarkTextControls">
                <div class="page-setup-row">
                  <label class="page-setup-label">Text:</label>
                  <input type="text" id="watermarkText" class="page-setup-control" value="CONFIDENTIAL" placeholder="Enter watermark text">
                </div>
                <div class="size-controls">
                  <div>
                    <label>Font Size:</label>
                    <input type="number" id="watermarkFontSize" class="page-setup-control" value="48" min="12" max="100">
                  </div>
                  <div>
                    <label>Color:</label>
                    <input type="color" id="watermarkColor" class="page-setup-control" value="#cccccc">
                  </div>
                  <div>
                    <label>Opacity:</label>
                    <input type="range" id="watermarkOpacity" class="page-setup-control" value="30" min="10" max="80">
                  </div>
                  <div>
                    <label>Rotation:</label>
                    <input type="range" id="watermarkRotation" class="page-setup-control" value="-45" min="-90" max="90">
                  </div>
                </div>
              </div>

              <div id="watermarkImageControls" style="display: none;">
                <div class="page-setup-row">
                  <label class="page-setup-label">Image URL:</label>
                  <input type="url" id="watermarkImageUrl" class="page-setup-control" placeholder="Enter image URL">
                </div>
                <div class="size-controls">
                  <div>
                    <label>Width (px):</label>
                    <input type="number" id="watermarkImageWidth" class="page-setup-control" value="200" min="50" max="500">
                  </div>
                  <div>
                    <label>Height (px):</label>
                    <input type="number" id="watermarkImageHeight" class="page-setup-control" value="200" min="50" max="500">
                  </div>
                </div>
              </div>

              <div class="page-setup-row">
                <label class="page-setup-label">Position:</label>
                <div class="position-grid">
                  <div class="position-option" data-position="top-left">Top Left</div>
                  <div class="position-option" data-position="top-center">Top Center</div>
                  <div class="position-option" data-position="top-right">Top Right</div>
                  <div class="position-option" data-position="center-left">Center Left</div>
                  <div class="position-option selected" data-position="center">Center</div>
                  <div class="position-option" data-position="center-right">Center Right</div>
                  <div class="position-option" data-position="bottom-left">Bottom Left</div>
                  <div class="position-option" data-position="bottom-center">Bottom Center</div>
                  <div class="position-option" data-position="bottom-right">Bottom Right</div>
                </div>
              </div>
            </div>
          </div> -->
          
          <div class="page-setup-actions">
            <button id="pageSetupCancel" class="page-setup-btn page-setup-btn-secondary">Cancel</button>
            <button id="pageSetupApply" class="page-setup-btn page-setup-btn-primary">Create Pages</button>
          </div>
        </div>
      </div>
    `

    if (!document.getElementById("pageSetupModal")) {
      document.body.insertAdjacentHTML("beforeend", modalHTML)
    }
  }

  addToGrapesJSSettings() {
    const settingsPanel = this.editor.Panels.getPanel("options")

    if (settingsPanel) {
      this.updateNavbarButton()
      this.updateAddPageButton()
    }

    // Add commands
    this.editor.Commands.add("open-page-setup", {
      run: () => this.showInitialSetup(),
    })

    this.editor.Commands.add("open-page-elements-settings", {
      run: () => this.showPageElementsSettings(),
    })

    this.editor.Commands.add("add-new-page", {
      run: () => this.addNewPage(),
    })

    this.editor.Commands.add("delete-pages", {
      run: () => this.showPageDeleteModal(),
    })
  }

  updateNavbarButton() {
    const settingsPanel = this.editor.Panels.getPanel("options")
    if (!settingsPanel) return

    const existingSetupBtn = settingsPanel.get("buttons").get("page-setup")
    const existingSettingsBtn = settingsPanel.get("buttons").get("page-elements-settings")

    if (existingSetupBtn) {
      settingsPanel.get("buttons").remove(existingSetupBtn)
    }
    if (existingSettingsBtn) {
      settingsPanel.get("buttons").remove(existingSettingsBtn)
    }

    if (!this.isInitialized) {
      settingsPanel.get("buttons").add({
        id: "page-setup",
        className: "fa fa-file-o",
        command: "open-page-setup",
        attributes: { title: "Setup Pages" },
      })
    } else {
      settingsPanel.get("buttons").add({
        id: "page-elements-settings",
        className: "fa fa-cogs",
        command: "open-page-elements-settings",
        attributes: { title: "Page Elements Settings" },
      })
    }
  }

  updateAddPageButton() {
    const settingsPanel = this.editor.Panels.getPanel("options")
    if (!settingsPanel) return

    const existingAddBtn = settingsPanel.get("buttons").get("add-page")

    if (this.isInitialized && !existingAddBtn) {
      settingsPanel.get("buttons").add({
        id: "add-page",
        className: "fa fa-plus",
        command: "add-new-page",
        attributes: { title: "Add New Page" },
      })
    } else if (!this.isInitialized && existingAddBtn) {
      settingsPanel.get("buttons").remove(existingAddBtn)
    }
  }

  setupEventListeners() {
    // Format change handler
    document.addEventListener("change", (e) => {
      if (e.target.id === "pageFormat") {
        const customSection = document.getElementById("customSizeSection")
        if (customSection) {
          if (e.target.value === "custom") {
            customSection.classList.add("active")
          } else {
            customSection.classList.remove("active")
          }
        }
      }

      if (e.target.id === "enablePageNumbering") {
        const controls = document.getElementById("pageNumberingControls")
        if (controls) {
          if (e.target.checked) {
            controls.classList.add("active")
            this.updateStartFromPageOptions()
          } else {
            controls.classList.remove("active")
          }
        }
      }

      if (e.target.id === "enableWatermark") {
        const controls = document.getElementById("watermarkControls")
        if (controls) {
          if (e.target.checked) {
            controls.classList.add("active")
          } else {
            controls.classList.remove("active")
          }
        }
      }

      if (e.target.id === "numberOfPages") {
        this.updateStartFromPageOptions()
      }

      // Background color preview update
      if (e.target.id === "pageBackgroundColor") {
        const preview = document.getElementById("backgroundColorPreview")
        if (preview) {
          preview.style.backgroundColor = e.target.value
        }
      }
    })

    // Watermark type selection
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("watermark-type-btn")) {
        document.querySelectorAll(".watermark-type-btn").forEach((btn) => btn.classList.remove("active"))
        e.target.classList.add("active")

        const type = e.target.dataset.type
        const textControls = document.getElementById("watermarkTextControls")
        const imageControls = document.getElementById("watermarkImageControls")

        if (type === "text") {
          textControls.style.display = "block"
          imageControls.style.display = "none"
        } else if (type === "image") {
          textControls.style.display = "none"
          imageControls.style.display = "block"
        } else if (type === "both") {
          textControls.style.display = "block"
          imageControls.style.display = "block"
        }
      }

      if (e.target.classList.contains("position-option")) {
        const parent = e.target.parentElement
        parent.querySelectorAll(".position-option").forEach((opt) => opt.classList.remove("selected"))
        e.target.classList.add("selected")
      }

      if (e.target.id === "pageSetupApply") {
        this.applyPageSetup()
      } else if (e.target.id === "pageSetupCancel") {
        this.cancelPageSetup()
      }

      // Background color preview click
      if (e.target.id === "backgroundColorPreview") {
        const colorInput = document.getElementById("pageBackgroundColor")
        if (colorInput) {
          colorInput.click()
        }
      }
    })
  }

  updateStartFromPageOptions() {
    const numberOfPages = Number.parseInt(document.getElementById("numberOfPages")?.value) || 1
    const startFromPageSelect = document.getElementById("startFromPage")

    if (startFromPageSelect) {
      startFromPageSelect.innerHTML = ""
      for (let i = 1; i <= numberOfPages; i++) {
        const option = document.createElement("option")
        option.value = i
        option.textContent = `Page ${i}`
        startFromPageSelect.appendChild(option)
      }
    }
  }

  showInitialSetup() {
    const modal = document.getElementById("pageSetupModal")
    if (modal) {
      modal.style.display = "flex"
      this.updateStartFromPageOptions()

      // Set current background color if already initialized
      if (this.isInitialized) {
        const bgColorInput = document.getElementById("pageBackgroundColor")
        const bgColorPreview = document.getElementById("backgroundColorPreview")
        if (bgColorInput && bgColorPreview) {
          bgColorInput.value = this.pageSettings.backgroundColor
          bgColorPreview.style.backgroundColor = this.pageSettings.backgroundColor
        }
      }
    } else {
      console.error("Page setup modal not found")
      this.createInitialSetupModal()
      setTimeout(() => {
        const newModal = document.getElementById("pageSetupModal")
        if (newModal) {
          newModal.style.display = "flex"
          this.updateStartFromPageOptions()
        }
      }, 100)
    }
  }

  applyPageSetup() {
    let slides = []
    let transitions = {}
    let clickStates = {}
    let currentSlideIndex = 1

    const editor = this.editor

    editor.on("run:core:canvas-clear", () => {
      const thumbContainer = document.getElementById("slides-thumbnails")
      if (thumbContainer) thumbContainer.remove()
      slides = []
      transitions = {}
      clickStates = {}
      currentSlideIndex = 1
    })

    // Collect settings from modal
    const format = document.getElementById("pageFormat").value
    const orientation = document.getElementById("pageOrientation").value
    const numberOfPages = Number.parseInt(document.getElementById("numberOfPages").value) || 1
    const backgroundColor = document.getElementById("pageBackgroundColor")?.value || "#ffffff"

    // Collect margin settings
    const margins = {
      top: Number.parseFloat(document.getElementById("marginTop").value) || 0,
      bottom: Number.parseFloat(document.getElementById("marginBottom").value) || 0,
      left: Number.parseFloat(document.getElementById("marginLeft").value) || 0,
      right: Number.parseFloat(document.getElementById("marginRight").value) || 0,
    }

    // Collect page numbering settings
    const pageNumberingEnabled = document.getElementById("enablePageNumbering")?.checked || false
    const startFromPage = Number.parseInt(document.getElementById("startFromPage")?.value) || 1

    // Collect watermark settings
    const watermarkEnabled = document.getElementById("enableWatermark")?.checked || false
    const watermarkType = document.querySelector(".watermark-type-btn.active")?.dataset.type || "text"
    const watermarkPosition =
      document.querySelector(".watermark-controls .position-option.selected")?.dataset.position || "center"

    let width, height
    if (format === "custom") {
      width = Number.parseFloat(document.getElementById("customWidth").value) || 210
      height = Number.parseFloat(document.getElementById("customHeight").value) || 297
    } else {
      const dimensions = this.pageFormats[format] || this.pageFormats.a4
      width = orientation === "landscape" ? dimensions.height : dimensions.width
      height = orientation === "landscape" ? dimensions.width : dimensions.height
    }

    // Update settings
    this.pageSettings = {
      format,
      orientation,
      numberOfPages,
      width,
      height,
      margins,
      backgroundColor, // Added background color
      pages: [],
      pageNumbering: {
        enabled: pageNumberingEnabled,
        startFromPage: startFromPage,
        excludedPages: Array.from({ length: startFromPage - 1 }, (_, i) => i + 1),
      },
      watermark: {
        enabled: watermarkEnabled,
        type: watermarkType,
        text: {
          content: document.getElementById("watermarkText")?.value || "CONFIDENTIAL",
          fontSize: Number.parseInt(document.getElementById("watermarkFontSize")?.value) || 48,
          color: document.getElementById("watermarkColor")?.value || "#cccccc",
          opacity: Number.parseInt(document.getElementById("watermarkOpacity")?.value) / 100 || 0.3,
          rotation: Number.parseInt(document.getElementById("watermarkRotation")?.value) || -45,
        },
        image: {
          url: document.getElementById("watermarkImageUrl")?.value || "",
          width: Number.parseInt(document.getElementById("watermarkImageWidth")?.value) || 200,
          height: Number.parseInt(document.getElementById("watermarkImageHeight")?.value) || 200,
          opacity: 0.3,
        },
        position: watermarkPosition,
        applyToAllPages: true,
      },
    }

    // Initialize pages with individual settings
    for (let i = 0; i < numberOfPages; i++) {
      this.pageSettings.pages.push({
        id: `page-${i + 1}`,
        name: `Page ${i + 1}`,
        pageNumber: i + 1,
        backgroundColor: backgroundColor, // Added background color to each page
        header: {
          enabled: false,
          content: "",
          height: this.defaultSizes.header.height,
          padding: this.defaultSizes.header.padding,
          fontSize: 12,
          color: "#333333",
          backgroundColor: backgroundColor, // Header inherits page background color
          position: "center",
        },
        footer: {
          enabled: false,
          content: "",
          height: this.defaultSizes.footer.height,
          padding: this.defaultSizes.footer.padding,
          fontSize: 12,
          color: "#333333",
          backgroundColor: backgroundColor, // Footer inherits page background color
          position: "center",
        },
        pageNumber: {
          enabled: false,
          format: "Page {n}",
          position: "bottom-right",
          fontSize: 11,
          color: "#333333",
          backgroundColor: "#ffffff",
          showBorder: true,
        },
      })
    }

    // Apply to editor
    this.setupEditorPages()
    this.setupCanvasScrolling()

    // Hide modal
    const modal = document.getElementById("pageSetupModal")
    if (modal) {
      modal.style.display = "none"
    }

    this.isInitialized = true
    this.updateNavbarButton()
    this.updateAddPageButton()

    console.log("Enhanced page setup applied:", this.pageSettings)
  }

  cancelPageSetup() {
    const modal = document.getElementById("pageSetupModal")
    if (modal) {
      modal.style.display = "none"
    }
  }


  showPageElementsSettings() {
    if (!this.isInitialized || this.pageSettings.pages.length === 0) {
      alert("Please set up pages first")
      return
    }

    const firstPage = this.pageSettings.pages[0]
    const globalHeader = firstPage.header || {}
    const globalFooter = firstPage.footer || {}
    const globalPageNumber = firstPage.pageNumber || {}

    // Generate page options for numbering start
    let pageOptions = ""
    for (let i = 1; i <= this.pageSettings.numberOfPages; i++) {
      const selected = this.pageSettings.pageNumbering.startFromPage === i ? "selected" : ""
      pageOptions += `<option value="${i}" ${selected}>Page ${i}</option>`
    }

    this.editor.Modal.setTitle("Enhanced Page Elements Settings")
    this.editor.Modal.setContent(`
      <div class="page-settings-content" style="color: #000 !important;">
        <div class="page-setup-section">
          <h3>📋 Page Information</h3>
          <div class="page-info-grid">
            <div class="page-info-item">
              <label>Format:</label>
              <span class="page-info-value">${this.pageSettings.format.toUpperCase()}</span>
            </div>
            <div class="page-info-item">
              <label>Orientation:</label>
              <span class="page-info-value">${this.pageSettings.orientation.charAt(0).toUpperCase() + this.pageSettings.orientation.slice(1)}</span>
            </div>
            <div class="page-info-item">
              <label>Total Pages:</label>
              <span class="page-info-value">${this.pageSettings.numberOfPages}</span>
            </div>
            <div class="page-info-item">
              <label>Dimensions:</label>
              <span class="page-info-value">${this.pageSettings.width} × ${this.pageSettings.height} mm</span>
            </div>
            <div class="page-info-item">
              <label>Margins:</label>
              <span class="page-info-value">${this.pageSettings.margins.top}/${this.pageSettings.margins.bottom}/${this.pageSettings.margins.left}/${this.pageSettings.margins.right} mm</span>
            </div>
            <div class="page-info-item">
              <label>Content Area:</label>
              <span class="page-info-value">${(this.pageSettings.width - this.pageSettings.margins.left - this.pageSettings.margins.right).toFixed(1)} × ${(this.pageSettings.height - this.pageSettings.margins.top - this.pageSettings.margins.bottom).toFixed(1)} mm</span>
            </div>
          </div>
        </div>

        <div class="page-setup-section">
          <h3>🎨 Page Background</h3>
          <div class="page-setup-row">
            <label class="page-setup-label">Background Color:</label>
            <div class="background-color-controls">
              <input type="color" id="settingsPageBackgroundColor" class="page-setup-control" value="${this.pageSettings.backgroundColor || "#ffffff"}">
              <div class="color-preview" id="settingsBackgroundColorPreview" style="background-color: ${this.pageSettings.backgroundColor || "#ffffff"};"></div>
            </div>
          </div>
          <p style="font-size: 12px; color: #666; margin-top: 5px;">Background color will be preserved in headers, footers, and print/PDF output</p>
        </div>

        <div class="page-setup-section">
          <h3>📏 Page Margins (mm)</h3>
          <div class="margins-grid">
            <div>
              <label>Top:</label>
              <input type="number" id="settingsMarginTop" class="page-setup-control" value="${this.pageSettings.margins.top}" min="0" max="50">
            </div>
            <div>
              <label>Bottom:</label>
              <input type="number" id="settingsMarginBottom" class="page-setup-control" value="${this.pageSettings.margins.bottom}" min="0" max="50">
            </div>
            <div>
              <label>Left:</label>
              <input type="number" id="settingsMarginLeft" class="page-setup-control" value="${this.pageSettings.margins.left}" min="0" max="50">
            </div>
            <div>
              <label>Right:</label>
              <input type="number" id="settingsMarginRight" class="page-setup-control" value="${this.pageSettings.margins.right}" min="0" max="50">
            </div>
          </div>
        </div>
        
        <div class="page-setup-section">
          <h3>📄 Header Settings</h3>
          <div class="page-setup-row">
            <label>
              <input type="checkbox" id="headerEnabled" ${globalHeader.enabled ? "checked" : ""} style="border: 2px solid #000 !important;"> Enable Header
            </label>
          </div>
          <div class="page-setup-row">
            <label class="page-setup-label">Content:</label>
            <textarea id="headerContent" class="page-setup-control" placeholder="Header content" rows="2">${globalHeader.content || ""}</textarea>
          </div>
          <div class="page-setup-row">
            <label class="page-setup-label">Position:</label>
            <select id="headerPosition" class="page-setup-control">
              <option value="left" ${globalHeader.position === "left" ? "selected" : ""}>Left</option>
              <option value="center" ${globalHeader.position === "center" ? "selected" : ""}>Center</option>
              <option value="right" ${globalHeader.position === "right" ? "selected" : ""}>Right</option>
            </select>
          </div>
          <div class="size-controls">
            <div>
              <label>Height (mm):</label>
              <input type="number" id="headerHeight" class="page-setup-control" value="${globalHeader.height || 20}" min="5" max="50">
            </div>
            <div>
              <label>Padding (px):</label>
              <input type="number" id="headerPadding" class="page-setup-control" value="${globalHeader.padding || 10}" min="0" max="30">
            </div>
            <div>
              <label>Font Size:</label>
              <input type="number" id="headerFontSize" class="page-setup-control" value="${globalHeader.fontSize || 12}" min="8" max="24">
            </div>
            <div>
              <label>Text Color:</label>
              <input type="color" id="headerColor" class="page-setup-control" value="${globalHeader.color || "#333333"}">
            </div>
          </div>
        </div>
        
        <div class="page-setup-section">
          <h3>📄 Footer Settings</h3>
          <div class="page-setup-row">
            <label>
              <input type="checkbox" id="footerEnabled" ${globalFooter.enabled ? "checked" : ""} style="border: 2px solid #000 !important;"> Enable Footer
            </label>
          </div>
          <div class="page-setup-row">
            <label class="page-setup-label">Content:</label>
            <textarea id="footerContent" class="page-setup-control" placeholder="Footer content" rows="2">${globalFooter.content || ""}</textarea>
          </div>
          <div class="page-setup-row">
            <label class="page-setup-label">Position:</label>
            <select id="footerPosition" class="page-setup-control">
              <option value="left" ${globalFooter.position === "left" ? "selected" : ""}>Left</option>
              <option value="center" ${globalFooter.position === "center" ? "selected" : ""}>Center</option>
              <option value="right" ${globalFooter.position === "right" ? "selected" : ""}>Right</option>
            </select>
          </div>
          <div class="size-controls">
            <div>
              <label>Height (mm):</label>
              <input type="number" id="footerHeight" class="page-setup-control" value="${globalFooter.height || 20}" min="5" max="50">
            </div>
            <div>
              <label>Padding (px):</label>
              <input type="number" id="footerPadding" class="page-setup-control" value="${globalFooter.padding || 10}" min="0" max="30">
            </div>
            <div>
              <label>Font Size:</label>
              <input type="number" id="footerFontSize" class="page-setup-control" value="${globalFooter.fontSize || 12}" min="8" max="24">
            </div>
            <div>
              <label>Text Color:</label>
              <input type="color" id="footerColor" class="page-setup-control" value="${globalFooter.color || "#333333"}">
            </div>
          </div>
        </div>
        
        <div class="page-setup-section">
          <h3>🔢 Enhanced Page Number Settings</h3>
          <div class="page-setup-row">
            <label>
              <input type="checkbox" id="pageNumberEnabled" ${globalPageNumber.enabled ? "checked" : ""} style="border: 2px solid #000 !important;"> Enable Page Numbers
            </label>
          </div>
          <div class="page-setup-row">
            <label class="page-setup-label">Start From Page:</label>
            <select id="pageNumberStartFrom" class="page-setup-control">
              ${pageOptions}
            </select>
          </div>
          <p style="font-size: 12px; color: #666; margin: 10px 0;">Pages before the selected page will be excluded from numbering</p>
          <div class="page-setup-row">
            <label class="page-setup-label">Format:</label>
            <select id="pageNumberFormat" class="page-setup-control">
              <option value="Page {n}" ${globalPageNumber.format === "Page {n}" ? "selected" : ""}>Page {n}</option>
              <option value="{n}" ${globalPageNumber.format === "{n}" ? "selected" : ""}>{n}</option>
              <option value="{n} of {total}" ${globalPageNumber.format === "{n} of {total}" ? "selected" : ""}>{n} of {total}</option>
              <option value="- {n} -" ${globalPageNumber.format === "- {n} -" ? "selected" : ""}>- {n} -</option>
              <option value="[{n}]" ${globalPageNumber.format === "[{n}]" ? "selected" : ""}}>[{n}]</option>
            </select>
          </div>
          <div class="page-setup-row">
            <label class="page-setup-label">Position:</label>
            <div class="position-grid">
              <div class="position-option ${globalPageNumber.position === "top-left" ? "selected" : ""}" data-position="top-left">Top Left</div>
              <div class="position-option ${globalPageNumber.position === "top-center" ? "selected" : ""}" data-position="top-center">Top Center</div>
              <div class="position-option ${globalPageNumber.position === "top-right" ? "selected" : ""}" data-position="top-right">Top Right</div>
              <div class="position-option ${globalPageNumber.position === "center-left" ? "selected" : ""}" data-position="center-left">Center Left</div>
              <div class="position-option ${globalPageNumber.position === "center-center" ? "selected" : ""}" data-position="center-center">Center</div>
              <div class="position-option ${globalPageNumber.position === "center-right" ? "selected" : ""}" data-position="center-right">Center Right</div>
              <div class="position-option ${globalPageNumber.position === "bottom-left" ? "selected" : ""}" data-position="bottom-left">Bottom Left</div>
              <div class="position-option ${globalPageNumber.position === "bottom-center" ? "selected" : ""}" data-position="bottom-center">Bottom Center</div>
              <div class="position-option ${globalPageNumber.position === "bottom-right" ? "selected" : ""}" data-position="bottom-right">Bottom Right</div>
            </div>
          </div>
          <div class="size-controls">
            <div>
              <label>Font Size:</label>
              <input type="number" id="pageNumberFontSize" class="page-setup-control" value="${globalPageNumber.fontSize || 11}" min="8" max="20">
            </div>
            <div>
              <label>Text Color:</label>
              <input type="color" id="pageNumberColor" class="page-setup-control" value="${globalPageNumber.color || "#333333"}">
            </div>
            <div>
              <label>Background:</label>
              <input type="color" id="pageNumberBackgroundColor" class="page-setup-control" value="${globalPageNumber.backgroundColor || "#ffffff"}">
            </div>
            <div>
              <label>
                <input type="checkbox" id="pageNumberShowBorder" ${globalPageNumber.showBorder ? "checked" : ""} style="border: 2px solid #000 !important;"> Show Border
              </label>
            </div>
          </div>
        </div>

      <!--  <div class="page-setup-section">
          <h3>💧 Page Watermark Settings</h3>
          <div class="page-setup-row">
            <label>
              <input type="checkbox" id="settingsWatermarkEnabled" ${this.pageSettings.watermark.enabled ? "checked" : ""} style="border: 2px solid #000 !important;"> Enable Watermark
            </label>
          </div>
          <div id="settingsWatermarkControls" class="watermark-controls ${this.pageSettings.watermark.enabled ? "active" : ""}">
            <div class="page-setup-row">
              <label class="page-setup-label">Type:</label>
              <div class="watermark-type-controls">
                <div class="watermark-type-btn ${this.pageSettings.watermark.type === "text" ? "active" : ""}" data-type="text">Text</div>
                <div class="watermark-type-btn ${this.pageSettings.watermark.type === "image" ? "active" : ""}" data-type="image">Image</div>
                <div class="watermark-type-btn ${this.pageSettings.watermark.type === "both" ? "active" : ""}" data-type="both">Both</div>
              </div>
            </div>
            
            <div id="settingsWatermarkTextControls" style="display: ${this.pageSettings.watermark.type === "text" || this.pageSettings.watermark.type === "both" ? "block" : "none"};">
              <div class="page-setup-row">
                <label class="page-setup-label">Text:</label>
                <input type="text" id="settingsWatermarkText" class="page-setup-control" value="${this.pageSettings.watermark.text.content}" placeholder="Enter watermark text">
              </div>
              <div class="size-controls">
                <div>
                  <label>Font Size:</label>
                  <input type="number" id="settingsWatermarkFontSize" class="page-setup-control" value="${this.pageSettings.watermark.text.fontSize}" min="12" max="100">
                </div>
                <div>
                  <label>Color:</label>
                  <input type="color" id="settingsWatermarkColor" class="page-setup-control" value="${this.pageSettings.watermark.text.color}">
                </div>
                <div>
                  <label>Opacity:</label>
                  <input type="range" id="settingsWatermarkOpacity" class="page-setup-control" value="${Math.round(this.pageSettings.watermark.text.opacity * 100)}" min="10" max="80">
                </div>
                <div>
                  <label>Rotation:</label>
                  <input type="range" id="settingsWatermarkRotation" class="page-setup-control" value="${this.pageSettings.watermark.text.rotation}" min="-90" max="90">
                </div>
              </div>
            </div>

            <div id="settingsWatermarkImageControls" style="display: ${this.pageSettings.watermark.type === "image" || this.pageSettings.watermark.type === "both" ? "block" : "none"};">
              <div class="page-setup-row">
                <label class="page-setup-label">Image URL:</label>
                <input type="url" id="settingsWatermarkImageUrl" class="page-setup-control" value="${this.pageSettings.watermark.image.url}" placeholder="Enter image URL">
              </div>
              <div class="size-controls">
                <div>
                  <label>Width (px):</label>
                  <input type="number" id="settingsWatermarkImageWidth" class="page-setup-control" value="${this.pageSettings.watermark.image.width}" min="50" max="500">
                </div>
                <div>
                  <label>Height (px):</label>
                  <input type="number" id="settingsWatermarkImageHeight" class="page-setup-control" value="${this.pageSettings.watermark.image.height}" min="50" max="500">
                </div>
              </div>
            </div>

            <div class="page-setup-row">
              <label class="page-setup-label">Position:</label>
              <div class="position-grid">
                <div class="position-option ${this.pageSettings.watermark.position === "top-left" ? "selected" : ""}" data-position="top-left">Top Left</div>
                <div class="position-option ${this.pageSettings.watermark.position === "top-center" ? "selected" : ""}" data-position="top-center">Top Center</div>
                <div class="position-option ${this.pageSettings.watermark.position === "top-right" ? "selected" : ""}" data-position="top-right">Top Right</div>
                <div class="position-option ${this.pageSettings.watermark.position === "center-left" ? "selected" : ""}" data-position="center-left">Center Left</div>
                <div class="position-option ${this.pageSettings.watermark.position === "center" ? "selected" : ""}" data-position="center">Center</div>
                <div class="position-option ${this.pageSettings.watermark.position === "center-right" ? "selected" : ""}" data-position="center-right">Center Right</div>
                <div class="position-option ${this.pageSettings.watermark.position === "bottom-left" ? "selected" : ""}" data-position="bottom-left">Bottom Left</div>
                <div class="position-option ${this.pageSettings.watermark.position === "bottom-center" ? "selected" : ""}" data-position="bottom-center">Bottom Center</div>
                <div class="position-option ${this.pageSettings.watermark.position === "bottom-right" ? "selected" : ""}" data-position="bottom-right">Bottom Right</div>
              </div>
            </div>
          </div>
        </div> -->
        
        <div class="page-setup-section">
          <h3>🗑️ Page Management</h3>
          <div class="page-setup-row">
            <button id="deletePages" class="page-setup-btn page-setup-btn-secondary">Delete Pages</button>
          </div>
        </div>
        
        <div class="page-setup-actions">
          <button id="applyPageElementsSettings" class="page-setup-btn page-setup-btn-primary">Apply Settings</button>
          <button id="resetPageElementsSettings" class="page-setup-btn page-setup-btn-secondary">Reset</button>
        </div>
      </div>
    `)

    this.editor.Modal.open()

    setTimeout(() => {
      this.setupPageElementsListeners()
    }, 100)
  }

  setupPageElementsListeners() {
    // Position selection
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("position-option")) {
        const parent = e.target.parentElement
        parent.querySelectorAll(".position-option").forEach((opt) => opt.classList.remove("selected"))
        e.target.classList.add("selected")
      }
    })

    // Background color preview update
    document.addEventListener("change", (e) => {
      if (e.target.id === "settingsPageBackgroundColor") {
        const preview = document.getElementById("settingsBackgroundColorPreview")
        if (preview) {
          preview.style.backgroundColor = e.target.value
        }
      }

      if (e.target.id === "settingsWatermarkEnabled") {
        const controls = document.getElementById("settingsWatermarkControls")
        if (controls) {
          if (e.target.checked) {
            controls.classList.add("active")
          } else {
            controls.classList.remove("active")
          }
        }
      }
    })

    // Background color preview click
    document.addEventListener("click", (e) => {
      if (e.target.id === "settingsBackgroundColorPreview") {
        const colorInput = document.getElementById("settingsPageBackgroundColor")
        if (colorInput) {
          colorInput.click()
        }
      }
    })

    // Watermark type selection
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("watermark-type-btn")) {
        document.querySelectorAll(".watermark-type-btn").forEach((btn) => btn.classList.remove("active"))
        e.target.classList.add("active")

        const type = e.target.dataset.type
        const textControls = document.getElementById("settingsWatermarkTextControls")
        const imageControls = document.getElementById("settingsWatermarkImageControls")

        if (type === "text") {
          textControls.style.display = "block"
          imageControls.style.display = "none"
        } else if (type === "image") {
          textControls.style.display = "none"
          imageControls.style.display = "block"
        } else if (type === "both") {
          textControls.style.display = "block"
          imageControls.style.display = "block"
        }
      }
    })

    // Delete pages button
    const deletePagesBtn = document.getElementById("deletePages")
    if (deletePagesBtn) {
      deletePagesBtn.addEventListener("click", () => {
        this.editor.Modal.close()
        setTimeout(() => {
          this.showPageDeleteModal()
        }, 100)
      })
    }

    // Apply settings
    const applyBtn = document.getElementById("applyPageElementsSettings")
    if (applyBtn) {
      applyBtn.addEventListener("click", () => {
        this.applyPageElementsSettings()
      })
    }

    // Reset settings
    const resetBtn = document.getElementById("resetPageElementsSettings")
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        this.resetPageElementsSettings()
      })
    }
  }

  applyPageElementsSettings() {
    // Collect margin settings
    const newMargins = {
      top: Number.parseFloat(document.getElementById("settingsMarginTop")?.value) || 0,
      bottom: Number.parseFloat(document.getElementById("settingsMarginBottom")?.value) || 0,
      left: Number.parseFloat(document.getElementById("settingsMarginLeft")?.value) || 0,
      right: Number.parseFloat(document.getElementById("settingsMarginRight")?.value) || 0,
    }

    // Collect background color
    const newBackgroundColor = document.getElementById("settingsPageBackgroundColor")?.value || "#ffffff"

    // Update margins and background color
    this.pageSettings.margins = newMargins
    this.pageSettings.backgroundColor = newBackgroundColor

    // Collect settings from form
    const headerSettings = {
      enabled: document.getElementById("headerEnabled")?.checked || false,
      content: document.getElementById("headerContent")?.value || "",
      position: document.getElementById("headerPosition")?.value || "center",
      height: Number.parseFloat(document.getElementById("headerHeight")?.value) || 20,
      padding: Number.parseFloat(document.getElementById("headerPadding")?.value) || 10,
      fontSize: Number.parseFloat(document.getElementById("headerFontSize")?.value) || 12,
      color: document.getElementById("headerColor")?.value || "#333333",
      backgroundColor: newBackgroundColor, // Header inherits page background color
    }

    const footerSettings = {
      enabled: document.getElementById("footerEnabled")?.checked || false,
      content: document.getElementById("footerContent")?.value || "",
      position: document.getElementById("footerPosition")?.value || "center",
      height: Number.parseFloat(document.getElementById("footerHeight")?.value) || 20,
      padding: Number.parseFloat(document.getElementById("footerPadding")?.value) || 10,
      fontSize: Number.parseFloat(document.getElementById("footerFontSize")?.value) || 12,
      color: document.getElementById("footerColor")?.value || "#333333",
      backgroundColor: newBackgroundColor, // Footer inherits page background color
    }

    const pageNumberSettings = {
      enabled: document.getElementById("pageNumberEnabled")?.checked || false,
      format: document.getElementById("pageNumberFormat")?.value || "Page {n}",
      position: document.querySelector(".position-grid .position-option.selected")?.dataset.position || "bottom-right",
      fontSize: Number.parseInt(document.getElementById("pageNumberFontSize")?.value) || 11,
      color: document.getElementById("pageNumberColor")?.value || "#333333",
      backgroundColor: document.getElementById("pageNumberBackgroundColor")?.value || "#ffffff",
      showBorder: document.getElementById("pageNumberShowBorder")?.checked || true,
    }

    // Update page numbering settings - Fixed: Preserve page numbering after settings update
    const startFromPage = Number.parseInt(document.getElementById("pageNumberStartFrom")?.value) || 1
    this.pageSettings.pageNumbering.startFromPage = startFromPage
    this.pageSettings.pageNumbering.excludedPages = Array.from({ length: startFromPage - 1 }, (_, i) => i + 1)
    this.pageSettings.pageNumbering.enabled = pageNumberSettings.enabled // Fixed: Preserve enabled state

    // Update watermark settings
    const watermarkEnabled = document.getElementById("settingsWatermarkEnabled")?.checked || false
    const watermarkType =
      document.querySelector("#settingsWatermarkControls .watermark-type-btn.active")?.dataset.type || "text"
    const watermarkPosition =
      document.querySelector("#settingsWatermarkControls .position-option.selected")?.dataset.position || "center"

    this.pageSettings.watermark = {
      enabled: watermarkEnabled,
      type: watermarkType,
      text: {
        content: document.getElementById("settingsWatermarkText")?.value || "CONFIDENTIAL",
        fontSize: Number.parseInt(document.getElementById("settingsWatermarkFontSize")?.value) || 48,
        color: document.getElementById("settingsWatermarkColor")?.value || "#cccccc",
        opacity: Number.parseInt(document.getElementById("settingsWatermarkOpacity")?.value) / 100 || 0.3,
        rotation: Number.parseInt(document.getElementById("settingsWatermarkRotation")?.value) || -45,
      },
      image: {
        url: document.getElementById("settingsWatermarkImageUrl")?.value || "",
        width: Number.parseInt(document.getElementById("settingsWatermarkImageWidth")?.value) || 200,
        height: Number.parseInt(document.getElementById("settingsWatermarkImageHeight")?.value) || 200,
        opacity: 0.3,
      },
      position: watermarkPosition,
      applyToAllPages: true,
    }

    // Apply to ALL pages
    this.pageSettings.pages.forEach((page) => {
      page.backgroundColor = newBackgroundColor // Update page background color
      page.header = { ...headerSettings }
      page.footer = { ...footerSettings }
      page.pageNumber = { ...pageNumberSettings }
    })

    // Recalculate page dimensions with new margins and update visuals
    this.setupEditorPages()
    this.updateAllPageVisuals()

    // Close modal
    this.editor.Modal.close()

    console.log("Enhanced page elements settings applied to all pages")
  }

  resetPageElementsSettings() {
    // Reset margins
    this.pageSettings.margins = {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    }

    // Reset background color
    this.pageSettings.backgroundColor = "#ffffff"

    // Reset page numbering
    this.pageSettings.pageNumbering = {
      enabled: false,
      startFromPage: 1,
      excludedPages: [],
    }

    // Reset watermark
    this.pageSettings.watermark = {
      enabled: false,
      type: "text",
      text: {
        content: "CONFIDENTIAL",
        fontSize: 48,
        color: "#cccccc",
        opacity: 0.3,
        rotation: -45,
      },
      image: {
        url: "",
        width: 200,
        height: 200,
        opacity: 0.3,
      },
      position: "center",
      applyToAllPages: true,
    }

    // Reset all pages to default settings
    this.pageSettings.pages.forEach((page) => {
      page.backgroundColor = "#ffffff"
      page.header = {
        enabled: false,
        content: "",
        height: this.defaultSizes.header.height,
        padding: this.defaultSizes.header.padding,
        fontSize: 12,
        color: "#333333",
        backgroundColor: "#ffffff",
        position: "center",
      }
      page.footer = {
        enabled: false,
        content: "",
        height: this.defaultSizes.footer.height,
        padding: this.defaultSizes.footer.padding,
        fontSize: 12,
        color: "#333333",
        backgroundColor: "#ffffff",
        position: "center",
      }
      page.pageNumber = {
        enabled: false,
        format: "Page {n}",
        position: "bottom-right",
        fontSize: 11,
        color: "#333333",
        backgroundColor: "#ffffff",
        showBorder: true,
      }
    })

    // Recalculate and update visuals
    this.setupEditorPages()
    this.updateAllPageVisuals()

    // Close modal
    this.editor.Modal.close()

    console.log("Page elements settings reset")
  }

  setupEditorPages() {
    try {
      // Calculate page dimensions in pixels (96 DPI standard)
      const mmToPx = 96 / 25.4
      const totalPageWidth = Math.round(this.pageSettings.width * mmToPx)
      const totalPageHeight = Math.round(this.pageSettings.height * mmToPx)

      // Calculate content area dimensions (subtracting margins)
      const marginTopPx = Math.round(this.pageSettings.margins.top * mmToPx)
      const marginBottomPx = Math.round(this.pageSettings.margins.bottom * mmToPx)
      const marginLeftPx = Math.round(this.pageSettings.margins.left * mmToPx)
      const marginRightPx = Math.round(this.pageSettings.margins.right * mmToPx)

      const contentWidth = totalPageWidth - marginLeftPx - marginRightPx
      const contentHeight = totalPageHeight - marginTopPx - marginBottomPx

      // Clear existing content
      this.editor.getWrapper().components().reset()

      // Create page containers
      for (let i = 0; i < this.pageSettings.numberOfPages; i++) {
        const pageData = this.pageSettings.pages[i]

        const pageComponent = this.editor.getWrapper().append(`
          <div class="page-container" data-page-id="${pageData.id}" data-page-index="${i}">
            <div class="page-content" style="
              width: ${contentWidth}px; 
              height: ${contentHeight}px; 
              margin: ${marginTopPx}px ${marginRightPx}px ${marginBottomPx}px ${marginLeftPx}px;
              position: relative;
              overflow: hidden;
              background-color: ${pageData.backgroundColor || this.pageSettings.backgroundColor};
            ">
              <!-- Content will be added here -->
            </div>
          </div>
        `)[0]

        // Set page styling with fixed dimensions and background color
        pageComponent.addStyle({
          width: `${totalPageWidth}px`,
          height: `${totalPageHeight}px`,
          background: pageData.backgroundColor || this.pageSettings.backgroundColor, // Apply background color
          margin: "20px auto",
          "box-shadow": "0 4px 12px rgba(0, 0, 0, 0.15)",
          border: "2px solid transparent", // Fixed: Always show full border
          position: "relative",
          "page-break-after": "always",
          overflow: "hidden",
          "box-sizing": "border-box",
          transition: "border-color 0.2s ease",
          "-webkit-print-color-adjust": "exact", // Preserve background color in print
          "color-adjust": "exact",
          "print-color-adjust": "exact",
        })

        // Set content area styling with margin enforcement and background color
        const pageContentComponent = pageComponent.find(".page-content")[0]
        if (pageContentComponent) {
          pageContentComponent.addStyle({
            overflow: "hidden",
            position: "relative",
            "box-sizing": "border-box",
            display: "flex",
            "flex-direction": "column",
            height: `${contentHeight}px`,
            width: `${contentWidth}px`,
            "background-color": pageData.backgroundColor || this.pageSettings.backgroundColor, // Apply background color
            border:
              this.pageSettings.margins.top > 0 ||
              this.pageSettings.margins.bottom > 0 ||
              this.pageSettings.margins.left > 0 ||
              this.pageSettings.margins.right > 0
                ? "1px dashed #dee2e6"
                : "none",
            "-webkit-print-color-adjust": "exact", // Preserve background color in print
            "color-adjust": "exact",
            "print-color-adjust": "exact",
          })
        }
      }

      // Update canvas container for scrolling
      this.setupCanvasScrolling()

      // Apply initial page visuals
      setTimeout(() => {
        this.updateAllPageVisuals()
      }, 500)
    } catch (error) {
      console.error("Error setting up editor pages:", error)
    }
  }

  setupCanvasScrolling() {
    const canvasContainer = this.editor.Canvas.getElement()
    if (canvasContainer) {
      canvasContainer.style.height = "calc(100vh - 120px)"
      canvasContainer.style.background = "#f0f0f0"
    }

    const rightPanel = document.querySelector(".gjs-pn-panels-right")
    if (rightPanel) {
      rightPanel.style.position = "fixed"
      rightPanel.style.right = "0"
      rightPanel.style.top = "0"
      rightPanel.style.height = "100vh"
      rightPanel.style.overflow = "auto"
      rightPanel.style.zIndex = "1000"
    }
  }

  updateAllPageVisuals() {
    this.pageSettings.pages.forEach((page, index) => {
      const canvasBody = this.editor.Canvas.getBody()
      const pageElement = canvasBody.querySelector(`[data-page-index="${index}"]`)
      if (pageElement) {
        this.updateSinglePageVisuals(pageElement, page, index)
      }
    })
  }

  updateSinglePageVisuals(pageElement, pageSettings, pageIndex) {
    // Remove existing GrapesJS components for headers, footers, page numbers, and watermarks
    const pageComponent = this.editor.getWrapper().find(`[data-page-index="${pageIndex}"]`)[0]
    if (pageComponent) {
      const pageContentComponent = pageComponent.find(".page-content")[0]
      if (pageContentComponent) {
        // Remove existing elements
        const existingHeaders = pageContentComponent.find(".page-header-element")
        const existingFooters = pageContentComponent.find(".page-footer-element")
        const existingPageNumbers = pageContentComponent.find(".page-number-element")
        const existingWatermarks = pageContentComponent.find(".page-watermark")
        const existingMainContent = pageContentComponent.find(".main-content-area")

        existingHeaders.forEach((comp) => comp.remove())
        existingFooters.forEach((comp) => comp.remove())
        existingPageNumbers.forEach((comp) => comp.remove())
        existingWatermarks.forEach((comp) => comp.remove())
        existingMainContent.forEach((comp) => comp.remove())
      }
    }

    // Remove existing DOM elements
    const existingIndicator = pageElement.querySelector(".page-indicator")
    if (existingIndicator) existingIndicator.remove()

    // Add page indicator
    const indicator = document.createElement("div")
    indicator.className = "page-indicator"
    indicator.textContent = `${pageSettings.name}`
    pageElement.appendChild(indicator)

    // Calculate dimensions and space allocation
    const mmToPx = 96 / 25.4
    const marginTopPx = Math.round(this.pageSettings.margins.top * mmToPx)
    const marginBottomPx = Math.round(this.pageSettings.margins.bottom * mmToPx)
    const marginLeftPx = Math.round(this.pageSettings.margins.left * mmToPx)
    const marginRightPx = Math.round(this.pageSettings.margins.right * mmToPx)

    const totalPageWidth = Math.round(this.pageSettings.width * mmToPx)
    const totalPageHeight = Math.round(this.pageSettings.height * mmToPx)
    const contentWidth = totalPageWidth - marginLeftPx - marginRightPx
    const contentHeight = totalPageHeight - marginTopPx - marginBottomPx

    // Calculate exact space needed for header and footer
    let headerHeight = 0
    let footerHeight = 0

    if (pageSettings.header.enabled && pageSettings.header.content) {
      headerHeight = Math.round(pageSettings.header.height * mmToPx + pageSettings.header.padding * 2)
    }

    if (pageSettings.footer.enabled && pageSettings.footer.content) {
      footerHeight = Math.round(pageSettings.footer.height * mmToPx + pageSettings.footer.padding * 2)
    }

    // Calculate available main content area height
    const mainContentHeight = contentHeight - headerHeight - footerHeight

    if (pageComponent) {
      const pageContentComponent = pageComponent.find(".page-content")[0]
      if (pageContentComponent) {
        // Reset and set exact page content dimensions with background color
        pageContentComponent.addStyle({
          display: "flex",
          "flex-direction": "column",
          height: `${contentHeight}px`,
          width: `${contentWidth}px`,
          "box-sizing": "border-box",
          overflow: "hidden",
          position: "relative",
          "background-color": pageSettings.backgroundColor || this.pageSettings.backgroundColor, // Apply background color
          "-webkit-print-color-adjust": "exact", // Preserve background color in print
          "color-adjust": "exact",
          "print-color-adjust": "exact",
        })

        // Add watermark first (behind all content)
        if (this.pageSettings.watermark.enabled) {
          this.addWatermarkToPage(pageContentComponent, pageIndex)
        }

        // Add header if enabled
        if (pageSettings.header.enabled && pageSettings.header.content) {
          const headerGjsComponent = pageContentComponent.append(`
            <div class="page-header-element" style="
              position: static !important;
              width: 100% !important;
              height: ${headerHeight}px !important;
              background: ${pageSettings.header.backgroundColor || pageSettings.backgroundColor || this.pageSettings.backgroundColor} !important;
              color: ${pageSettings.header.color} !important;
              font-size: ${pageSettings.header.fontSize}px !important;
              text-align: ${pageSettings.header.position} !important;
              padding: ${pageSettings.header.padding}px !important;
              box-sizing: border-box !important;
              display: flex !important;
              align-items: center !important;
              justify-content: ${pageSettings.header.position === "left" ? "flex-start" : pageSettings.header.position === "right" ? "flex-end" : "center"} !important;
              pointer-events: none !important;
              user-select: none !important;
              font-family: Arial, sans-serif !important;
              border-bottom: 1px solid #e9ecef !important;
              flex-shrink: 0 !important;
              z-index: 1000 !important;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }">${pageSettings.header.content}</div>
          `)[0]

          headerGjsComponent.set({
            selectable: false,
            editable: false,
            removable: false,
            draggable: false,
            copyable: false,
          })
        }

        // Add main content area with calculated height
        const mainContentArea = pageContentComponent.append(`
          <div class="main-content-area" style="
            flex: 0 0 ${mainContentHeight}px !important;
            width: 100% !important;
            height: ${mainContentHeight}px !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            position: relative !important;
            background: transparent !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          "></div>
        `)[0]

        mainContentArea.set({
          selectable: true,
          editable: true,
          droppable: true,
          "custom-name": "Content Area",
        })

        // Add footer if enabled
        if (pageSettings.footer.enabled && pageSettings.footer.content) {
          const footerGjsComponent = pageContentComponent.append(`
            <div class="page-footer-element" style="
              position: static !important;
              width: 100% !important;
              height: ${footerHeight}px !important;
              background: ${pageSettings.footer.backgroundColor || pageSettings.backgroundColor || this.pageSettings.backgroundColor} !important;
              color: ${pageSettings.footer.color} !important;
              font-size: ${pageSettings.footer.fontSize}px !important;
              text-align: ${pageSettings.footer.position} !important;
              padding: ${pageSettings.footer.padding}px !important;
              box-sizing: border-box !important;
              display: flex !important;
              align-items: center !important;
              justify-content: ${pageSettings.footer.position === "left" ? "flex-start" : pageSettings.footer.position === "right" ? "flex-end" : "center"} !important;
              pointer-events: none !important;
              user-select: none !important;
              font-family: Arial, sans-serif !important;
              border-top: 1px solid #e9ecef !important;
              flex-shrink: 0 !important;
              z-index: 1000 !important;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }">${pageSettings.footer.content}</div>
          `)[0]

          footerGjsComponent.set({
            selectable: false,
            editable: false,
            removable: false,
            draggable: false,
            copyable: false,
          })
        }
      }
    }

    // Add page number as overlay (positioned absolutely for flexibility)
    if (pageSettings.pageNumber.enabled && this.shouldShowPageNumber(pageIndex)) {
      const actualPageNumber = this.getActualPageNumber(pageIndex)
      let pageNumberText = pageSettings.pageNumber.format
      pageNumberText = pageNumberText.replace("{n}", actualPageNumber)
      pageNumberText = pageNumberText.replace("{total}", this.getTotalNumberedPages())

      const position = pageSettings.pageNumber.position || "bottom-right"
      let positionStyles = ""

      switch (position) {
        case "top-left":
          positionStyles = "top: 10px !important; left: 10px !important;"
          break
        case "top-center":
          positionStyles = "top: 10px !important; left: 50% !important; transform: translateX(-50%) !important;"
          break
        case "top-right":
          positionStyles = "top: 10px !important; right: 10px !important;"
          break
        case "center-left":
          positionStyles = "top: 50% !important; left: 10px !important; transform: translateY(-50%) !important;"
          break
        case "center-center":
          positionStyles = "top: 50% !important; left: 50% !important; transform: translate(-50%, -50%) !important;"
          break
        case "center-right":
          positionStyles = "top: 50% !important; right: 10px !important; transform: translateY(-50%) !important;"
          break
        case "bottom-left":
          positionStyles = "bottom: 10px !important; left: 10px !important;"
          break
        case "bottom-center":
          positionStyles = "bottom: 10px !important; left: 50% !important; transform: translateX(-50%) !important;"
          break
        case "bottom-right":
        default:
          positionStyles = "bottom: 10px !important; right: 10px !important;"
          break
      }

      if (pageComponent) {
        const pageContentComponent = pageComponent.find(".page-content")[0]
        if (pageContentComponent) {
          const pageNumberGjsComponent = pageContentComponent.append(`
            <div class="page-number-element" style="
              position: absolute !important;
              ${positionStyles}
              background: ${pageSettings.pageNumber.backgroundColor} !important;
              color: ${pageSettings.pageNumber.color} !important;
              font-size: ${pageSettings.pageNumber.fontSize}px !important;
              padding: 4px 8px !important;
              border-radius: 3px !important;
              border: ${pageSettings.pageNumber.showBorder ? "1px solid #dee2e6" : "none"} !important;
              z-index: 2000 !important;
              pointer-events: none !important;
              user-select: none !important;
              font-family: Arial, sans-serif !important;
              white-space: nowrap !important;
              min-width: 20px !important;
              min-height: 20px !important;
              display: flex !important;
              align-items: center !important;
              justify-content: center !important;
            )">${pageNumberText}</div>
          `)[0]

          pageNumberGjsComponent.set({
            selectable: false,
            editable: false,
            removable: false,
            draggable: false,
            copyable: false,
          })
        }
      }
    }
  }

  addWatermarkToPage(pageContentComponent, pageIndex) {
    if (!this.pageSettings.watermark.enabled) return

    const watermark = this.pageSettings.watermark
    let watermarkContent = ""

    // Position styles
    let positionStyles = "display: flex !important; align-items: center !important; justify-content: center !important;"

    switch (watermark.position) {
      case "top-left":
        positionStyles =
          "display: flex !important; align-items: flex-start !important; justify-content: flex-start !important; padding: 20px !important;"
        break
      case "top-center":
        positionStyles =
          "display: flex !important; align-items: flex-start !important; justify-content: center !important; padding: 20px !important;"
        break
      case "top-right":
        positionStyles =
          "display: flex !important; align-items: flex-start !important; justify-content: flex-end !important; padding: 20px !important;"
        break
      case "center-left":
        positionStyles =
          "display: flex !important; align-items: center !important; justify-content: flex-start !important; padding: 20px !important;"
        break
      case "center":
        positionStyles = "display: flex !important; align-items: center !important; justify-content: center !important;"
        break
      case "center-right":
        positionStyles =
          "display: flex !important; align-items: center !important; justify-content: flex-end !important; padding: 20px !important;"
        break
      case "bottom-left":
        positionStyles =
          "display: flex !important; align-items: flex-end !important; justify-content: flex-start !important; padding: 20px !important;"
        break
      case "bottom-center":
        positionStyles =
          "display: flex !important; align-items: flex-end !important; justify-content: center !important; padding: 20px !important;"
        break
      case "bottom-right":
        positionStyles =
          "display: flex !important; align-items: flex-end !important; justify-content: flex-end !important; padding: 20px !important;"
        break
    }

    // Create watermark content based on type
    if (watermark.type === "text" || watermark.type === "both") {
      watermarkContent += `
        <div class="page-watermark-text" style="
          font-family: ${watermark.text.font || "Arial"}, sans-serif !important;
          font-size: ${watermark.text.fontSize}px !important;
          color: ${watermark.text.color} !important;
          opacity: ${watermark.text.opacity} !important;
          transform: rotate(${watermark.text.rotation}deg) !important;
          font-weight: bold !important;
          white-space: nowrap !important;
          user-select: none !important;
          pointer-events: none !important;
        ">${watermark.text.content}</div>
      `
    }

    if (watermark.type === "image" || watermark.type === "both") {
      if (watermark.image.url) {
        watermarkContent += `
          <img class="page-watermark-image" src="${watermark.image.url}" style="
            width: ${watermark.image.width}px !important;
            height: ${watermark.image.height}px !important;
            opacity: ${watermark.image.opacity} !important;
            max-width: 100% !important;
            max-height: 100% !important;
            object-fit: contain !important;
            user-select: none !important;
            pointer-events: none !important;
          " />
        `
      }
    }

    if (watermarkContent) {
      const watermarkGjsComponent = pageContentComponent.append(`
        <div class="page-watermark" style="
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          pointer-events: none !important;
          user-select: none !important;
          z-index: 1 !important;
          ${positionStyles}
        ">${watermarkContent}</div>
      `)[0]

      watermarkGjsComponent.set({
        selectable: false,
        editable: false,
        removable: false,
        draggable: false,
        copyable: false,
      })
    }
  }

  shouldShowPageNumber(pageIndex) {
    const pageNumber = pageIndex + 1
    return (
      !this.pageSettings.pageNumbering.excludedPages.includes(pageNumber) && this.pageSettings.pageNumbering.enabled
    )
  }

  getActualPageNumber(pageIndex) {
    const pageNumber = pageIndex + 1
    const excludedCount = this.pageSettings.pageNumbering.excludedPages.filter((p) => p < pageNumber).length
    return pageNumber - excludedCount
  }

  getTotalNumberedPages() {
    return this.pageSettings.numberOfPages - this.pageSettings.pageNumbering.excludedPages.length
  }

  showPageDeleteModal() {
    if (this.pageSettings.numberOfPages <= 1) {
      alert("Cannot delete the last page")
      return
    }

    let pageListHTML = ""
    this.pageSettings.pages.forEach((page, index) => {
      const isExcluded = this.pageSettings.pageNumbering.excludedPages.includes(index + 1)
      const pageNumberInfo = this.shouldShowPageNumber(index)
        ? `Page # ${this.getActualPageNumber(index)}`
        : "Excluded from numbering"

      pageListHTML += `
        <div class="page-delete-item" data-page-index="${index}">
          <div class="page-delete-info">
            <div class="page-delete-icon">
              <i class="fa fa-file-text-o"></i>
            </div>
            <div class="page-delete-details">
              <div class="page-delete-name">${page.name}</div>
              <div class="page-delete-meta">
                ${page.header.enabled ? '<span class="feature-tag">Header</span>' : ""}
                ${page.footer.enabled ? '<span class="feature-tag">Footer</span>' : ""}
                ${page.pageNumber.enabled ? '<span class="feature-tag">Page #</span>' : ""}
                ${this.pageSettings.watermark.enabled ? '<span class="feature-tag">Watermark</span>' : ""}
                <span class="feature-tag ${isExcluded ? "excluded" : "numbered"}">${pageNumberInfo}</span>
              </div>
            </div>
          </div>
          <button class="page-delete-btn-item" data-page-index="${index}">
            <i class="fa fa-trash"></i>
          </button>
        </div>
      `
    })

    this.editor.Modal.setTitle("🗑️ Delete Pages")
    this.editor.Modal.setContent(`
      <div class="page-delete-modal-content" style="color: #000 !important;">
        <div class="delete-warning">
          <i class="fa fa-exclamation-triangle"></i>
          <p>Select a page to delete. Page numbering will be automatically adjusted.</p>
        </div>
        <div class="page-delete-list">
          ${pageListHTML}
        </div>
        <div class="page-setup-actions" style="margin-top: 20px;">
          <button id="cancelPageDelete" class="page-setup-btn page-setup-btn-secondary">
            <i class="fa fa-times"></i> Cancel
          </button>
        </div>
      </div>
      <style>
        .delete-warning {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 6px;
          padding: 15px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .delete-warning i {
          color: #856404;
          font-size: 18px;
        }
        .delete-warning p {
          margin: 0;
          color: #856404 !important;
          font-weight: 500;
        }
        .page-delete-list {
          max-height: 400px;
          overflow-y: auto;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 15px;
          background: #f8f9fa;
        }
        .page-delete-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          margin-bottom: 10px;
          background: white;
          border-radius: 8px;
          border: 2px solid #e9ecef;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .page-delete-item:hover {
          border-color: #dc3545;
          box-shadow: 0 4px 8px rgba(220,53,69,0.15);
        }
        .page-delete-item:last-child {
          margin-bottom: 0;
        }
        .page-delete-info {
          display: flex;
          align-items: center;
          gap: 15px;
          flex: 1;
        }
        .page-delete-icon {
          width: 40px;
          height: 40px;
          background: #007bff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 16px;
        }
        .page-delete-details {
          flex: 1;
        }
        .page-delete-name {
          font-weight: 600;
          color: #333 !important;
          font-size: 14px;
          margin-bottom: 5px;
        }
        .page-delete-meta {
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
        }
        .feature-tag {
          background: #e3f2fd;
          color: #1976d2 !important;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 500;
          border: 1px solid #bbdefb;
        }
        .feature-tag.excluded {
          background: #ffebee;
          color: #c62828 !important;
          border-color: #ffcdd2;
        }
        .feature-tag.numbered {
          background: #e8f5e8;
          color: #2e7d32 !important;
          border-color: #c8e6c9;
        }
        .page-delete-btn-item {
          background: #dc3545;
          color: white;
          border: none;
          padding: 10px 15px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 5px;
          min-width: 80px;
          justify-content: center;
        }
        .page-delete-btn-item:hover {
          background: #c82333;
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(220,53,69,0.3);
        }
        .page-setup-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          justify-content: center;
        }
      </style>
    `)

    this.editor.Modal.open()

    setTimeout(() => {
      document.querySelectorAll(".page-delete-btn-item").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const pageIndex = Number.parseInt(e.target.closest(".page-delete-btn-item").dataset.pageIndex)
          this.confirmDeletePage(pageIndex)
        })
      })

      const cancelBtn = document.getElementById("cancelPageDelete")
      if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
          this.editor.Modal.close()
        })
      }
    }, 100)
  }

  confirmDeletePage(pageIndex) {
    const page = this.pageSettings.pages[pageIndex]
    if (confirm(`Are you sure you want to delete "${page.name}"?`)) {
      this.performPageDeletion(pageIndex)
      this.editor.Modal.close()
    }
  }

  performPageDeletion(pageIndex) {
    const deletedPageNumber = pageIndex + 1

    // Remove page from settings
    this.pageSettings.pages.splice(pageIndex, 1)
    this.pageSettings.numberOfPages--

    // Remove page from editor
    const component = this.editor.getWrapper().find(`[data-page-index="${pageIndex}"]`)[0]
    if (component) {
      component.remove()
    }

    // Fixed: Properly maintain page numbering settings after deletion
    // Update excluded pages list (remove deleted page and adjust remaining page numbers)
    this.pageSettings.pageNumbering.excludedPages = this.pageSettings.pageNumbering.excludedPages
      .filter((pageNum) => pageNum !== deletedPageNumber)
      .map((pageNum) => (pageNum > deletedPageNumber ? pageNum - 1 : pageNum))

    // Adjust startFromPage if necessary
    if (this.pageSettings.pageNumbering.startFromPage > deletedPageNumber) {
      this.pageSettings.pageNumbering.startFromPage--
    } else if (this.pageSettings.pageNumbering.startFromPage === deletedPageNumber) {
      // If the starting page was deleted, find the next non-excluded page
      let newStartPage = deletedPageNumber
      while (
        newStartPage <= this.pageSettings.numberOfPages &&
        this.pageSettings.pageNumbering.excludedPages.includes(newStartPage)
      ) {
        newStartPage++
      }
      if (newStartPage <= this.pageSettings.numberOfPages) {
        this.pageSettings.pageNumbering.startFromPage = newStartPage
      } else {
        this.pageSettings.pageNumbering.startFromPage = 1
      }

      // Update excluded pages accordingly
      this.pageSettings.pageNumbering.excludedPages = Array.from(
        { length: this.pageSettings.pageNumbering.startFromPage - 1 },
        (_, i) => i + 1,
      )
    }

    // Renumber all remaining pages and update their attributes
    this.pageSettings.pages.forEach((page, newIndex) => {
      page.pageNumber = newIndex + 1
      page.name = `Page ${newIndex + 1}`
      page.id = `page-${newIndex + 1}`
    })

    // Update all remaining page components with new indices
    const remainingComponents = this.editor.getWrapper().find(".page-container")
    remainingComponents.forEach((component, index) => {
      if (index < this.pageSettings.numberOfPages) {
        const page = this.pageSettings.pages[index]
        component.addAttributes({
          "data-page-index": index,
          "data-page-id": page.id,
        })
      }
    })

    // Adjust current page index
    if (this.currentPageIndex >= this.pageSettings.numberOfPages) {
      this.currentPageIndex = this.pageSettings.numberOfPages - 1
    }

    // Update all page visuals to reflect new numbering
    setTimeout(() => {
      this.updateAllPageVisuals()
    }, 100)

    console.log(`Page deleted. Remaining pages: ${this.pageSettings.numberOfPages}`)
    console.log("Updated page numbering settings:", this.pageSettings.pageNumbering)
  }

  addNewPage() {
    const newPageIndex = this.pageSettings.numberOfPages

    // Get current global settings from first page
    const currentSettings = this.pageSettings.pages[0] || {}

    const newPage = {
      id: `page-${newPageIndex + 1}`,
      name: `Page ${newPageIndex + 1}`,
      pageNumber: newPageIndex + 1,
      backgroundColor: this.pageSettings.backgroundColor, // Fixed: New page inherits background color
      header: {
        enabled: currentSettings.header?.enabled || false,
        content: currentSettings.header?.content || "",
        height: currentSettings.header?.height || this.defaultSizes.header.height,
        padding: currentSettings.header?.padding || this.defaultSizes.header.padding,
        fontSize: currentSettings.header?.fontSize || 12,
        color: currentSettings.header?.color || "#333333",
        backgroundColor: this.pageSettings.backgroundColor, // Fixed: Header inherits page background color
        position: currentSettings.header?.position || "center",
      },
      footer: {
        enabled: currentSettings.footer?.enabled || false,
        content: currentSettings.footer?.content || "",
        height: currentSettings.footer?.height || this.defaultSizes.footer.height,
        padding: currentSettings.footer?.padding || this.defaultSizes.footer.padding,
        fontSize: currentSettings.footer?.fontSize || 12,
        color: currentSettings.footer?.color || "#333333",
        backgroundColor: this.pageSettings.backgroundColor, // Fixed: Footer inherits page background color
        position: currentSettings.footer?.position || "center",
      },
      pageNumber: {
        enabled: currentSettings.pageNumber?.enabled || false,
        format: currentSettings.pageNumber?.format || "Page {n}",
        position: currentSettings.pageNumber?.position || "bottom-right",
        fontSize: currentSettings.pageNumber?.fontSize || 11,
        color: currentSettings.pageNumber?.color || "#333333",
        backgroundColor: currentSettings.pageNumber?.backgroundColor || "#ffffff",
        showBorder: currentSettings.pageNumber?.showBorder !== false,
      },
    }

    this.pageSettings.pages.push(newPage)
    this.pageSettings.numberOfPages++

    // Add page to editor
    const mmToPx = 96 / 25.4
    const totalPageWidth = Math.round(this.pageSettings.width * mmToPx)
    const totalPageHeight = Math.round(this.pageSettings.height * mmToPx)
    const marginTopPx = Math.round(this.pageSettings.margins.top * mmToPx)
    const marginBottomPx = Math.round(this.pageSettings.margins.bottom * mmToPx)
    const marginLeftPx = Math.round(this.pageSettings.margins.left * mmToPx)
    const marginRightPx = Math.round(this.pageSettings.margins.right * mmToPx)
    const contentWidth = totalPageWidth - marginLeftPx - marginRightPx
    const contentHeight = totalPageHeight - marginTopPx - marginBottomPx

    try {
      const pageComponent = this.editor.getWrapper().append(`
        <div class="page-container" data-page-id="${newPage.id}" data-page-index="${newPageIndex}">
          <div class="page-content" style="
            width: ${contentWidth}px; 
            height: ${contentHeight}px; 
            margin: ${marginTopPx}px ${marginRightPx}px ${marginBottomPx}px ${marginLeftPx}px;
            position: relative;
            overflow: hidden;
            background-color: ${newPage.backgroundColor};
          ">
            <!-- Content will be added here -->
          </div>
        </div>
      `)[0]

      pageComponent.addStyle({
        width: `${totalPageWidth}px`,
        height: `${totalPageHeight}px`,
        background: newPage.backgroundColor, // Fixed: Apply background color to new page
        margin: "20px auto",
        "box-shadow": "0 4px 12px rgba(0, 0, 0, 0.15)",
        border: "2px solid transparent", // Fixed: Always show full border
        position: "relative",
        "page-break-after": "always",
        overflow: "hidden",
        "box-sizing": "border-box",
        transition: "border-color 0.2s ease",
        "-webkit-print-color-adjust": "exact", // Preserve background color in print
        "color-adjust": "exact",
        "print-color-adjust": "exact",
      })

      // Set proper flex layout for new page content
      const pageContentComponent = pageComponent.find(".page-content")[0]
      if (pageContentComponent) {
        pageContentComponent.addStyle({
          overflow: "hidden",
          position: "relative",
          "box-sizing": "border-box",
          display: "flex",
          "flex-direction": "column",
          height: `${contentHeight}px`,
          width: `${contentWidth}px`,
          "background-color": newPage.backgroundColor, // Fixed: Apply background color
          border:
            this.pageSettings.margins.top > 0 ||
            this.pageSettings.margins.bottom > 0 ||
            this.pageSettings.margins.left > 0 ||
            this.pageSettings.margins.right > 0
              ? "1px dashed #dee2e6"
              : "none",
          "-webkit-print-color-adjust": "exact", // Preserve background color in print
          "color-adjust": "exact",
          "print-color-adjust": "exact",
        })
      }

      // Navigate to new page
      this.currentPageIndex = newPageIndex

      // Update page visuals
      setTimeout(() => {
        this.updateAllPageVisuals()

        // Show confirmation popup
        const appliedFeatures = []
        if (newPage.header.enabled) appliedFeatures.push("Header")
        if (newPage.footer.enabled) appliedFeatures.push("Footer")
        if (newPage.pageNumber.enabled) appliedFeatures.push("Page Number")
        if (this.pageSettings.watermark.enabled) appliedFeatures.push("Watermark")
        if (newPage.backgroundColor !== "#ffffff") appliedFeatures.push("Background Color")

        const featuresText =
          appliedFeatures.length > 0
            ? `\n\nApplied features: ${appliedFeatures.join(", ")}`
            : "\n\nNo additional features applied."

        alert(`✅ New page "${newPage.name}" has been added successfully!${featuresText}`)
      }, 100)

      console.log("New page added:", newPage)
    } catch (error) {
      console.error("Error adding new page:", error)
    }
  }

  // Basic getter methods for integration
  getPageSettings() {
    return this.pageSettings
  }

  getCurrentPageIndex() {
    return this.currentPageIndex
  }

  isPageManagerInitialized() {
    return this.isInitialized
  }
}

// Export for use in main.js
window.PageSetupManager = PageSetupManager
