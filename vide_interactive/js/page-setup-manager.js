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
  }

  setupCanvasObserver() {
    // Observer to watch for canvas changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList" && this.isInitialized) {
          setTimeout(() => {
            this.updateAllPageVisuals()
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
          max-width: 700px;
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
          overflow: visible; /* Changed from hidden to visible */
        }
        
        .page-canvas {
          background: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          margin: 20px auto;
          position: relative;
          border: 1px solid #ccc;
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

        /* Page Elements Styles - Contained within page */
        .page-header-element {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
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
        }
        
        .page-footer-element {
          position: absolute !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
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
          left: -220px; /* Increased from -200px to ensure visibility */
          top: 0;
          width: 200px; /* Increased from 180px */
          height: 100%;
          background: rgba(255, 255, 255, 0.98);
          border: 2px solid #007bff;
          border-radius: 8px 0 0 8px;
          z-index: 1500; /* Increased z-index */
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
          left: -200px; /* Adjusted positioning */
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

        /* Special styling for header/footer labels */
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
          right: -30px; /* Extended line */
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

        .page-content > * {
          max-width: 100% !important;
          word-wrap: break-word !important;
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
        
        /* Enhanced Print styles for PDF generation */
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
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            height: 100vh !important;
            display: block !important;
            position: relative !important;
          }
          
          .page-content {
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            position: relative !important;
          }
          
          .page-indicator,
          .virtual-sections-panel,
          .section-panel-toggle,
          .page-section-label,
          .page-section-dashed-line,
          .page-section {
            display: none !important;
          }

          /* Ensure headers and footers print with transparent background */
          .page-header-element {
            display: flex !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
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
            position: absolute !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
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
            <h2>📄 Page Setup</h2>
            <p>Configure your document pages</p>
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
            <h3>📊 Pages</h3>
            <div class="page-setup-row">
              <label class="page-setup-label">Number of Pages:</label>
              <input type="number" id="numberOfPages" class="page-setup-control" value="1" min="1" max="100">
            </div>
          </div>
          
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
    // Add page setup options to GrapesJS settings panel
    const settingsPanel = this.editor.Panels.getPanel("options")

    if (settingsPanel) {
      settingsPanel.get("buttons").add([
        {
          id: "page-elements-settings",
          className: "fa fa-cogs",
          command: "open-page-elements-settings",
          attributes: { title: "Page Elements Settings" },
        },
        {
          id: "sections-settings",
          className: "fa fa-th-list",
          command: "open-sections-settings",
          attributes: { title: "Sections Settings" },
        },
        {
          id: "add-page",
          className: "fa fa-plus",
          command: "add-new-page",
          attributes: { title: "Add New Page" },
        },
        {
          id: "delete-page",
          className: "fa fa-trash",
          command: "delete-current-page",
          attributes: { title: "Delete Current Page" },
        },
      ])
    }

    // Add commands
    this.editor.Commands.add("open-page-elements-settings", {
      run: () => this.showPageElementsSettings(),
    })

    this.editor.Commands.add("open-sections-settings", {
      run: () => this.showSectionsSettings(),
    })

    this.editor.Commands.add("add-new-page", {
      run: () => this.addNewPage(),
    })

    this.editor.Commands.add("delete-current-page", {
      run: () => this.deleteCurrentPage(),
    })
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
    })

    // Setup modal buttons
    document.addEventListener("click", (e) => {
      if (e.target.id === "pageSetupApply") {
        this.applyPageSetup()
      } else if (e.target.id === "pageSetupCancel") {
        this.cancelPageSetup()
      }
    })
  }

  showInitialSetup() {
    const modal = document.getElementById("pageSetupModal")
    if (modal) {
      modal.style.display = "flex"
    } else {
      console.error("Page setup modal not found")
      this.createInitialSetupModal()
      setTimeout(() => {
        const newModal = document.getElementById("pageSetupModal")
        if (newModal) {
          newModal.style.display = "flex"
        }
      }, 100)
    }
  }

  applyPageSetup() {
    // Collect settings from modal
    const format = document.getElementById("pageFormat").value
    const orientation = document.getElementById("pageOrientation").value
    const numberOfPages = Number.parseInt(document.getElementById("numberOfPages").value) || 1

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
      pages: [],
    }

    // Initialize pages with individual settings
    for (let i = 0; i < numberOfPages; i++) {
      this.pageSettings.pages.push({
        id: `page-${i + 1}`,
        name: `Page ${i + 1}`,
        pageNumber: i + 1,
        header: {
          enabled: false,
          content: "",
          height: this.defaultSizes.header.height,
          padding: this.defaultSizes.header.padding,
          fontSize: 12,
          color: "#333333",
          backgroundColor: "#FFFFFF",
          position: "center",
        },
        footer: {
          enabled: false,
          content: "",
          height: this.defaultSizes.footer.height,
          padding: this.defaultSizes.footer.padding,
          fontSize: 12,
          color: "#333333",
          backgroundColor: "#FFFFFF",
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

    console.log("Page setup applied:", this.pageSettings)
  }

  cancelPageSetup() {
    const modal = document.getElementById("pageSetupModal")
    if (modal) {
      modal.style.display = "none"
    }

    // Continue with default single page setup
    this.pageSettings.numberOfPages = 1
    this.pageSettings.pages = [
      {
        id: "page-1",
        name: "Page 1",
        pageNumber: 1,
        header: {
          enabled: false,
          content: "",
          height: this.defaultSizes.header.height,
          padding: this.defaultSizes.header.padding,
          fontSize: 12,
          color: "#333333",
          backgroundColor: "#FFFFFF",
          position: "center",
        },
        footer: {
          enabled: false,
          content: "",
          height: this.defaultSizes.footer.height,
          padding: this.defaultSizes.footer.padding,
          fontSize: 12,
          color: "#333333",
          backgroundColor: "#FFFFFF",
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
      },
    ]
    this.isInitialized = true
    this.setupCanvasScrolling()
  }

  showSectionsSettings() {
    if (!this.isInitialized || this.pageSettings.pages.length === 0) {
      alert("Please set up pages first")
      return
    }

    // Create sections list HTML
    let sectionsListHTML = ""
    if (this.sectionsSettings.sections.length > 0) {
      this.sectionsSettings.sections.forEach((section, index) => {
        sectionsListHTML += `
        <div class="section-item">
          <div class="section-item-info">
            <div class="section-item-name">${section.name}</div>
            <div class="section-item-height">${section.height}px</div>
          </div>
          <div class="section-item-actions">
            <button class="section-btn-small section-btn-edit" data-section-index="${index}">Edit</button>
            <button class="section-btn-small section-btn-delete" data-section-index="${index}">Delete</button>
          </div>
        </div>
      `
      })
    } else {
      sectionsListHTML = '<p style="color: #666; text-align: center; padding: 20px;">No sections added yet</p>'
    }

    this.editor.Modal.setTitle("Sections Settings")
    this.editor.Modal.setContent(`
      <div class="sections-settings-content" style="color: #000 !important;">
        <div class="page-setup-section">
          <h3>📋 Sections Configuration</h3>
          <div class="page-setup-row">
            <label>
              <input type="checkbox" id="sectionsEnabled" ${this.sectionsSettings.enabled ? "checked" : ""} style="border: 2px solid #000 !important;"> Enable Sections
            </label>
          </div>
          
          <div id="sectionsControls" style="display: ${this.sectionsSettings.enabled ? "block" : "none"};">
            <div class="page-setup-row">
              <label class="page-setup-label">Section Name:</label>
              <input type="text" id="sectionName" class="page-setup-control" placeholder="Enter section name">
            </div>
            <div class="page-setup-row">
              <label class="page-setup-label">Height (px):</label>
              <input type="number" id="sectionHeight" class="page-setup-control" value="100" min="20" max="500">
            </div>
            <div class="page-setup-row">
              <button id="addSection" class="page-setup-btn page-setup-btn-primary">Add Section</button>
            </div>
            
            <h4>Current Sections:</h4>
            <div class="sections-list">
              ${sectionsListHTML}
            </div>
          </div>
        </div>
        
        <div class="page-setup-actions">
          <button id="applySectionsSettings" class="page-setup-btn page-setup-btn-primary">Apply Settings</button>
          <button id="resetSectionsSettings" class="page-setup-btn page-setup-btn-secondary">Reset</button>
        </div>
      </div>
    `)

    this.editor.Modal.open()

    // Setup event listeners
    setTimeout(() => {
      this.setupSectionsListeners()
    }, 100)
  }

  setupSectionsListeners() {
    // Enable/disable sections
    const sectionsEnabledCheckbox = document.getElementById("sectionsEnabled")
    const sectionsControls = document.getElementById("sectionsControls")

    if (sectionsEnabledCheckbox) {
      sectionsEnabledCheckbox.addEventListener("change", (e) => {
        sectionsControls.style.display = e.target.checked ? "block" : "none"
      })
    }

    // Add section
    const addSectionBtn = document.getElementById("addSection")
    if (addSectionBtn) {
      addSectionBtn.addEventListener("click", () => {
        const name = document.getElementById("sectionName").value.trim()
        const height = Number.parseInt(document.getElementById("sectionHeight").value) || 100

        if (!name) {
          alert("Please enter a section name")
          return
        }

        this.sectionsSettings.sections.push({
          id: `section-${Date.now()}`,
          name: name,
          height: height,
        })

        // Refresh the modal
        this.showSectionsSettings()
      })
    }

    // Edit/Delete section buttons
    document.querySelectorAll(".section-btn-edit").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = Number.parseInt(e.target.dataset.sectionIndex)
        this.editSection(index)
      })
    })

    document.querySelectorAll(".section-btn-delete").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = Number.parseInt(e.target.dataset.sectionIndex)
        this.deleteSection(index)
      })
    })

    // Apply settings
    const applyBtn = document.getElementById("applySectionsSettings")
    if (applyBtn) {
      applyBtn.addEventListener("click", () => {
        this.applySectionsSettings()
      })
    }

    // Reset settings
    const resetBtn = document.getElementById("resetSectionsSettings")
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        this.resetSectionsSettings()
      })
    }
  }

  editSection(index) {
    const section = this.sectionsSettings.sections[index]
    const newName = prompt("Enter new section name:", section.name)
    const newHeight = prompt("Enter new height (px):", section.height)

    if (newName && newName.trim()) {
      section.name = newName.trim()
    }
    if (newHeight && !isNaN(newHeight)) {
      section.height = Number.parseInt(newHeight)
    }

    this.showSectionsSettings()
  }

  deleteSection(index) {
    const section = this.sectionsSettings.sections[index]
    if (confirm(`Are you sure you want to delete section "${section.name}"?`)) {
      this.sectionsSettings.sections.splice(index, 1)
      this.showSectionsSettings()
    }
  }

  applySectionsSettings() {
    this.sectionsSettings.enabled = document.getElementById("sectionsEnabled")?.checked || false

    if (this.sectionsSettings.enabled) {
      this.updateSectionsDisplay()
    } else {
      this.hideSectionsDisplay()
    }

    this.editor.Modal.close()
    console.log("Sections settings applied:", this.sectionsSettings)
  }

  resetSectionsSettings() {
    this.sectionsSettings = {
      enabled: false,
      sections: [],
    }
    this.hideSectionsDisplay()
    this.editor.Modal.close()
    console.log("Sections settings reset")
  }

  // FIXED: Enhanced sections display with proper positioning and header/footer labels
  updateSectionsDisplay() {
    if (!this.sectionsSettings.enabled) return

    this.pageSettings.pages.forEach((page, pageIndex) => {
      const canvasBody = this.editor.Canvas.getBody()
      const pageElement = canvasBody.querySelector(`[data-page-index="${pageIndex}"]`)
      if (pageElement) {
        this.addSectionsToPage(pageElement, pageIndex)
      }
    })
  }

  // FIXED: Proper section display with header/footer labels
  addSectionsToPage(pageElement, pageIndex) {
    // Remove existing sections elements
    const existingSectionsElements = pageElement.querySelectorAll(
      ".virtual-sections-panel, .page-section, .page-section-label, .page-section-dashed-line",
    )
    existingSectionsElements.forEach((el) => el.remove())

    const pageContent = pageElement.querySelector(".page-content")
    const pageHeight = pageContent.offsetHeight
    const pageSettings = this.pageSettings.pages[pageIndex]

    let currentTop = 0
    const mmToPx = 96 / 25.4

    // Add header section label if enabled
    if (pageSettings.header.enabled) {
      const headerHeightPx = pageSettings.header.height * mmToPx + pageSettings.header.padding * 2

      const headerLabel = document.createElement("div")
      headerLabel.className = "page-section-label header-label"
      headerLabel.textContent = "Default Header"
      headerLabel.style.cssText = `
        position: absolute;
        left: -200px;
        top: ${currentTop + headerHeightPx / 2}px;
        transform: translateY(-50%);
        background: rgba(255, 255, 255, 0.98);
        padding: 6px 12px;
        border: 2px solid #28a745;
        border-radius: 6px;
        font-size: 12px;
        color: #28a745;
        font-weight: 600;
        white-space: nowrap;
        z-index: 1600;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        min-width: 80px;
        text-align: center;
      `
      pageElement.appendChild(headerLabel)

      currentTop += headerHeightPx
    }

    // Add custom sections
    this.sectionsSettings.sections.forEach((section, index) => {
      if (currentTop + section.height <= pageHeight) {
        // Create section visual area
        const sectionElement = document.createElement("div")
        sectionElement.className = "page-section"
        sectionElement.style.cssText = `
          position: absolute;
          left: 0;
          top: ${currentTop}px;
          right: 0;
          height: ${section.height}px;
          border-bottom: 2px dashed #007bff;
          background: rgba(0, 123, 255, 0.08);
          z-index: 500;
          box-sizing: border-box;
        `

        // Create section label
        const sectionLabel = document.createElement("div")
        sectionLabel.className = "page-section-label"
        sectionLabel.textContent = section.name
        sectionLabel.style.cssText = `
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
        `

        // Create dashed line extending to the right
        const dashedLine = document.createElement("div")
        dashedLine.className = "page-section-dashed-line"
        dashedLine.style.cssText = `
          position: absolute;
          left: 0;
          right: -30px;
          bottom: 0;
          height: 0;
          border-top: 2px dashed #007bff;
          z-index: 550;
        `

        sectionElement.appendChild(sectionLabel)
        sectionElement.appendChild(dashedLine)
        pageElement.appendChild(sectionElement)

        currentTop += section.height
      }
    })

    // Add footer section label if enabled
    if (pageSettings.footer.enabled) {
      const footerHeightPx = pageSettings.footer.height * mmToPx + pageSettings.footer.padding * 2

      const footerLabel = document.createElement("div")
      footerLabel.className = "page-section-label footer-label"
      footerLabel.textContent = "Default Footer"
      footerLabel.style.cssText = `
        position: absolute;
        left: -200px;
        bottom: ${footerHeightPx / 2}px;
        transform: translateY(50%);
        background: rgba(255, 255, 255, 0.98);
        padding: 6px 12px;
        border: 2px solid #dc3545;
        border-radius: 6px;
        font-size: 12px;
        color: #dc3545;
        font-weight: 600;
        white-space: nowrap;
        z-index: 1600;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        min-width: 80px;
        text-align: center;
      `
      pageElement.appendChild(footerLabel)
    }
  }

  hideSectionsDisplay() {
    this.pageSettings.pages.forEach((page, pageIndex) => {
      const canvasBody = this.editor.Canvas.getBody()
      const pageElement = canvasBody.querySelector(`[data-page-index="${pageIndex}"]`)
      if (pageElement) {
        // Remove all section-related elements
        const sectionsElements = pageElement.querySelectorAll(
          ".virtual-sections-panel, .page-section, .page-section-label, .page-section-dashed-line",
        )
        sectionsElements.forEach((el) => el.remove())
      }
    })
  }

  showPageElementsSettings() {
    if (!this.isInitialized || this.pageSettings.pages.length === 0) {
      alert("Please set up pages first")
      return
    }

    // Get current global settings (from first page or defaults)
    const firstPage = this.pageSettings.pages[0]
    const globalHeader = firstPage.header || {}
    const globalFooter = firstPage.footer || {}
    const globalPageNumber = firstPage.pageNumber || {}

    this.editor.Modal.setTitle("Page Elements Settings")
    this.editor.Modal.setContent(`
      <div class="page-settings-content" style="color: #000 !important;">
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
          <div class="page-setup-row">
            <label class="page-setup-label">Background:</label>
            <input type="color" id="headerBackgroundColor" class="page-setup-control" value="${globalHeader.backgroundColor || "#FFFFFF#f8f9fa"}">
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
          <div class="page-setup-row">
            <label class="page-setup-label">Background:</label>
            <input type="color" id="footerBackgroundColor" class="page-setup-control" value="${globalFooter.backgroundColor || "#FFFFFF"}">
          </div>
        </div>
        
        <div class="page-setup-section">
          <h3>🔢 Page Number Settings</h3>
          <div class="page-setup-row">
            <label>
              <input type="checkbox" id="pageNumberEnabled" ${globalPageNumber.enabled ? "checked" : ""} style="border: 2px solid #000 !important;"> Enable Page Numbers
            </label>
          </div>
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
        
        <div class="page-setup-actions">
          <button id="applyPageElementsSettings" class="page-setup-btn page-setup-btn-primary">Apply Settings</button>
          <button id="resetPageElementsSettings" class="page-setup-btn page-setup-btn-secondary">Reset</button>
        </div>
      </div>
    `)

    this.editor.Modal.open()

    // Setup event listeners
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
    // Collect settings from form
    const headerSettings = {
      enabled: document.getElementById("headerEnabled")?.checked || false,
      content: document.getElementById("headerContent")?.value || "",
      position: document.getElementById("headerPosition")?.value || "center",
      height: Number.parseFloat(document.getElementById("headerHeight")?.value) || 20,
      padding: Number.parseFloat(document.getElementById("headerPadding")?.value) || 10,
      fontSize: Number.parseFloat(document.getElementById("headerFontSize")?.value) || 12,
      color: document.getElementById("headerColor")?.value || "#333333",
      backgroundColor: document.getElementById("headerBackgroundColor")?.value || "#FFFFFF",
    }

    const footerSettings = {
      enabled: document.getElementById("footerEnabled")?.checked || false,
      content: document.getElementById("footerContent")?.value || "",
      position: document.getElementById("footerPosition")?.value || "center",
      height: Number.parseFloat(document.getElementById("footerHeight")?.value) || 20,
      padding: Number.parseFloat(document.getElementById("footerPadding")?.value) || 10,
      fontSize: Number.parseFloat(document.getElementById("footerFontSize")?.value) || 12,
      color: document.getElementById("footerColor")?.value || "#333333",
      backgroundColor: document.getElementById("footerBackgroundColor")?.value || "#FFFFFF",
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

    // Apply to ALL pages (removed individual page option)
    this.pageSettings.pages.forEach((page) => {
      page.header = { ...headerSettings }
      page.footer = { ...footerSettings }
      page.pageNumber = { ...pageNumberSettings }
    })

    // Update visuals
    this.updateAllPageVisuals()

    // Update sections display if enabled
    if (this.sectionsSettings.enabled) {
      this.updateSectionsDisplay()
    }

    // Close modal
    this.editor.Modal.close()

    console.log("Page elements settings applied to all pages")
  }

  resetPageElementsSettings() {
    // Reset all pages to default settings
    this.pageSettings.pages.forEach((page) => {
      page.header = {
        enabled: false,
        content: "",
        height: this.defaultSizes.header.height,
        padding: this.defaultSizes.header.padding,
        fontSize: 12,
        color: "#333333",
        backgroundColor: "#FFFFFF",
        position: "center",
      }
      page.footer = {
        enabled: false,
        content: "",
        height: this.defaultSizes.footer.height,
        padding: this.defaultSizes.footer.padding,
        fontSize: 12,
        color: "#333333",
        backgroundColor: "#FFFFFF",
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

    // Update visuals
    this.updateAllPageVisuals()

    // Update sections display if enabled
    if (this.sectionsSettings.enabled) {
      this.updateSectionsDisplay()
    }

    // Close modal
    this.editor.Modal.close()

    console.log("Page elements settings reset")
  }

// FIXED: Updated setupEditorPages to properly account for header/footer space
setupEditorPages() {
  try {
    // Calculate page dimensions in pixels (96 DPI standard)
    const mmToPx = 96 / 25.4
    const pageWidth = Math.round(this.pageSettings.width * mmToPx)
    const pageHeight = Math.round(this.pageSettings.height * mmToPx)

    // Clear existing content
    this.editor.getWrapper().components().reset()

    // Create page containers
    for (let i = 0; i < this.pageSettings.numberOfPages; i++) {
      const pageData = this.pageSettings.pages[i]

      const pageComponent = this.editor.getWrapper().append(`
        <div class="page-container" data-page-id="${pageData.id}" data-page-index="${i}">
          <div class="page-content" style="min-height: ${pageHeight}px; position: relative;">
            <!-- Content will be added here -->
          </div>
        </div>
      `)[0]

      // Set page styling with fixed dimensions and content boundaries
      pageComponent.addStyle({
        width: `${pageWidth}px`,
        height: `${pageHeight}px`,
        background: "white",
        margin: "20px auto",
        "box-shadow": "0 4px 12px rgba(0, 0, 0, 0.15)",
        border: "1px solid #ccc",
        position: "relative",
        "page-break-after": "always",
        overflow: "hidden", // Enforce content boundaries
        "box-sizing": "border-box"
      })

      // FIXED: Set content area styling to use flexbox layout with exact height
      const pageContentComponent = pageComponent.find(".page-content")[0]
      if (pageContentComponent) {
        pageContentComponent.addStyle({
          overflow: "hidden",
          position: "relative",
          "box-sizing": "border-box",
          display: "flex",
          "flex-direction": "column",
          height: `${pageHeight}px`, // FIXED: Use exact height instead of min-height
          width: "100%"
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
  // Make only the canvas scrollable, not the entire window
  const canvasContainer = this.editor.Canvas.getElement()
  if (canvasContainer) {
    canvasContainer.style.overflow = "auto"
    canvasContainer.style.height = "calc(100vh - 120px)"
    canvasContainer.style.background = "#f0f0f0"
  }

  // Ensure the right panel doesn't scroll with canvas
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

// FIXED: Updated methods to properly calculate and manage page content area heights

updateSinglePageVisuals(pageElement, pageSettings, pageIndex) {
  // Remove existing GrapesJS components for headers, footers, and page numbers
  const pageComponent = this.editor.getWrapper().find(`[data-page-index="${pageIndex}"]`)[0]
  if (pageComponent) {
    const pageContentComponent = pageComponent.find(".page-content")[0]
    if (pageContentComponent) {
      // Remove existing header, footer, and page number components
      const existingHeaders = pageContentComponent.find(".page-header-element")
      const existingFooters = pageContentComponent.find(".page-footer-element")
      const existingPageNumbers = pageContentComponent.find(".page-number-element")
      const existingMainContent = pageContentComponent.find(".main-content-area")

      existingHeaders.forEach((comp) => comp.remove())
      existingFooters.forEach((comp) => comp.remove())
      existingPageNumbers.forEach((comp) => comp.remove())
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
  const totalPageHeight = Math.round(this.pageSettings.height * mmToPx)

  // FIXED: Calculate exact space needed for header and footer
  let headerHeight = 0
  let footerHeight = 0

  if (pageSettings.header.enabled && pageSettings.header.content) {
    headerHeight = Math.round((pageSettings.header.height * mmToPx) + (pageSettings.header.padding * 2))
  }

  if (pageSettings.footer.enabled && pageSettings.footer.content) {
    footerHeight = Math.round((pageSettings.footer.height * mmToPx) + (pageSettings.footer.padding * 2))
  }

  // FIXED: Calculate available main content area height
  const mainContentHeight = totalPageHeight - headerHeight - footerHeight

  if (pageComponent) {
    const pageContentComponent = pageComponent.find(".page-content")[0]
    if (pageContentComponent) {
      // FIXED: Reset and set exact page content height
      pageContentComponent.addStyle({
        'display': 'flex',
        'flex-direction': 'column',
        'height': `${totalPageHeight}px`,
        'width': '100%',
        'box-sizing': 'border-box',
        'overflow': 'hidden'
      })

      // Add header if enabled
      if (pageSettings.header.enabled && pageSettings.header.content) {
        const headerGjsComponent = pageContentComponent.append(`
          <div class="page-header-element" style="
            position: static !important;
            width: 100% !important;
            height: ${headerHeight}px !important;
            background: ${pageSettings.header.backgroundColor} !important;
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
          ">${pageSettings.header.content}</div>
        `)[0]

        // Make it non-selectable and non-editable
        headerGjsComponent.set({
          selectable: false,
          editable: false,
          removable: false,
          draggable: false,
          copyable: false,
        })
      }

      // FIXED: Add main content area with calculated height
      const mainContentArea = pageContentComponent.append(`
        <div class="main-content-area" style="
          flex: 0 0 ${mainContentHeight}px !important;
          width: 100% !important;
          height: ${mainContentHeight}px !important;
          box-sizing: border-box !important;
          overflow: visible !important;
          position: relative !important;
          background: transparent !important;
        "></div>
      `)[0]

      // Make the main content area selectable and editable for user content
      mainContentArea.set({
        selectable: true,
        editable: true,
        droppable: true,
        'custom-name': 'Content Area'
      })

      // Add footer if enabled
      if (pageSettings.footer.enabled && pageSettings.footer.content) {
        const footerGjsComponent = pageContentComponent.append(`
          <div class="page-footer-element" style="
            position: static !important;
            width: 100% !important;
            height: ${footerHeight}px !important;
            background: ${pageSettings.footer.backgroundColor} !important;
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
          ">${pageSettings.footer.content}</div>
        `)[0]

        // Make it non-selectable and non-editable
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
  if (pageSettings.pageNumber.enabled) {
    // Format page number text
    let pageNumberText = pageSettings.pageNumber.format
    pageNumberText = pageNumberText.replace("{n}", pageIndex + 1)
    pageNumberText = pageNumberText.replace("{total}", this.pageSettings.numberOfPages)

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
        // Add page number as an absolute positioned overlay
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
          ">${pageNumberText}</div>
        `)[0]

        // Make it non-selectable and non-editable
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

  // FIXED: Log the calculated dimensions for verification
  console.log(`Page ${pageIndex + 1} Layout:`, {
    totalPageHeight,
    headerHeight,
    footerHeight,
    mainContentHeight,
    availableForContent: mainContentHeight - 30 // minus padding
  })
}

updatePageIndicators() {
  this.pageSettings.pages.forEach((page, index) => {
    const canvasBody = this.editor.Canvas.getBody()
    const pageElement = canvasBody.querySelector(`[data-page-index="${index}"]`)
    if (pageElement) {
      // Remove existing indicator
      const existingIndicator = pageElement.querySelector(".page-indicator")
      if (existingIndicator) existingIndicator.remove()

      // Add page indicator
      const indicator = document.createElement("div")
      indicator.className = "page-indicator"
      indicator.textContent = `${page.name}`
      pageElement.appendChild(indicator)
    }
  })
}

deleteCurrentPage() {
  this.showPageDeleteModal()
}

showPageDeleteModal() {
  if (this.pageSettings.numberOfPages <= 1) {
    alert("Cannot delete the last page")
    return
  }

  // Create page list HTML
  let pageListHTML = ""
  this.pageSettings.pages.forEach((page, index) => {
    pageListHTML += `
    <div class="page-delete-item" data-page-index="${index}">
      <span class="page-delete-name">${page.name}</span>
      <button class="page-delete-btn-item" data-page-index="${index}">
        <i class="fa fa-trash"></i> Delete
      </button>
    </div>
  `
  })

  this.editor.Modal.setTitle("Delete Pages")
  this.editor.Modal.setContent(`
  <div class="page-delete-modal-content" style="color: #000 !important;">
    <p style="margin-bottom: 20px; color: #666 !important;">Select a page to delete:</p>
    <div class="page-delete-list">
      ${pageListHTML}
    </div>
    <div class="page-setup-actions" style="margin-top: 20px;">
      <button id="cancelPageDelete" class="page-setup-btn page-setup-btn-secondary">Cancel</button>
    </div>
  </div>
  <style>
    .page-delete-list {
      max-height: 300px;
      overflow-y: auto;
      border: 1px solid #e9ecef;
      border-radius: 6px;
      padding: 10px;
    }
    .page-delete-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px;
      margin-bottom: 8px;
      background: #f8f9fa;
      border-radius: 4px;
      border: 1px solid #e9ecef;
    }
    .page-delete-name {
      font-weight: 500;
      color: #333 !important;
    }
    .page-delete-btn-item {
      background: #dc3545;
      color: white;
      border: none;
      padding: 6px 12px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: background 0.2s;
    }
    .page-delete-btn-item:hover {
      background: #c82333;
    }
  </style>
`)

  this.editor.Modal.open()

  // Setup event listeners for delete buttons
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

// FIXED: Proper page deletion with automatic page number adjustment
performPageDeletion(pageIndex) {
  // Remove page from settings
  this.pageSettings.pages.splice(pageIndex, 1)
  this.pageSettings.numberOfPages--

  // Remove page from editor
  const component = this.editor.getWrapper().find(`[data-page-index="${pageIndex}"]`)[0]
  if (component) {
    component.remove()
  }

  // FIXED: Properly renumber all remaining pages and update their attributes
  this.pageSettings.pages.forEach((page, newIndex) => {
    // Update page data
    page.pageNumber = newIndex + 1
    page.name = `Page ${newIndex + 1}`
    page.id = `page-${newIndex + 1}`

    // FIXED: Find the specific component by its current data-page-id and update it
    const specificComponent = this.editor.getWrapper().find(`[data-page-id="${page.id}"]`)[0]
    if (specificComponent) {
      specificComponent.addAttributes({
        "data-page-index": newIndex,
        "data-page-id": page.id,
      })
    }
  })

  // ALTERNATIVE APPROACH: Update components by finding them with current attributes
  // and then updating them sequentially
  const remainingComponents = this.editor.getWrapper().find(".page-container")
  remainingComponents.forEach((component, index) => {
    if (index < this.pageSettings.numberOfPages) {
      const page = this.pageSettings.pages[index]
      component.addAttributes({
        "data-page-index": index,
        "data-page-id": page.id,
      })
      
      // Also update any text content that shows page numbers
      const pageNumberElements = component.find('[data-page-number]')
      pageNumberElements.forEach(el => {
        el.components().reset()
        el.components().add({
          type: 'textnode',
          content: `Page ${index + 1}`
        })
      })
    }
  })

  // Adjust current page index
  if (this.currentPageIndex >= this.pageSettings.numberOfPages) {
    this.currentPageIndex = this.pageSettings.numberOfPages - 1
  }
  
  // Refresh the page list UI if you have one
  this.refreshPageList()
}

// Helper method to refresh page list UI
refreshPageList() {
  // Update any UI elements that display page numbers/names
  const pageListContainer = document.querySelector('.page-list')
  if (pageListContainer) {
    pageListContainer.innerHTML = ''
    this.pageSettings.pages.forEach((page, index) => {
      const pageItem = document.createElement('div')
      pageItem.textContent = page.name
      pageItem.dataset.pageIndex = index
      pageListContainer.appendChild(pageItem)
    })
  }
}

// FIXED: Updated addNewPage to properly calculate available content space
addNewPage() {
  const newPageIndex = this.pageSettings.numberOfPages

  // Get current global settings from first page
  const currentSettings = this.pageSettings.pages[0] || {}

  const newPage = {
    id: `page-${newPageIndex + 1}`,
    name: `Page ${newPageIndex + 1}`,
    pageNumber: newPageIndex + 1,
    header: {
      enabled: currentSettings.header?.enabled || false,
      content: currentSettings.header?.content || "",
      height: currentSettings.header?.height || this.defaultSizes.header.height,
      padding: currentSettings.header?.padding || this.defaultSizes.header.padding,
      fontSize: currentSettings.header?.fontSize || 12,
      color: currentSettings.header?.color || "#333333",
      backgroundColor: currentSettings.header?.backgroundColor || "#f8f9fa",
      position: currentSettings.header?.position || "center",
    },
    footer: {
      enabled: currentSettings.footer?.enabled || false,
      content: currentSettings.footer?.content || "",
      height: currentSettings.footer?.height || this.defaultSizes.footer.height,
      padding: currentSettings.footer?.padding || this.defaultSizes.footer.padding,
      fontSize: currentSettings.footer?.fontSize || 12,
      color: currentSettings.footer?.color || "#333333",
      backgroundColor: currentSettings.footer?.backgroundColor || "#f8f9fa",
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
  const pageWidth = Math.round(this.pageSettings.width * mmToPx)
  const pageHeight = Math.round(this.pageSettings.height * mmToPx)

  try {
    const pageComponent = this.editor.getWrapper().append(`
      <div class="page-container" data-page-id="${newPage.id}" data-page-index="${newPageIndex}">
        <div class="page-content" style="height: ${pageHeight}px; position: relative;">
          <!-- Content will be added here -->
        </div>
      </div>
    `)[0]

    pageComponent.addStyle({
      width: `${pageWidth}px`,
      height: `${pageHeight}px`,
      background: "white",
      margin: "20px auto",
      "box-shadow": "0 4px 12px rgba(0, 0, 0, 0.15)",
      border: "1px solid #ccc",
      position: "relative",
      "page-break-after": "always",
      overflow: "hidden",
      "box-sizing": "border-box"
    })

    // FIXED: Set proper flex layout for new page content with exact height
    const pageContentComponent = pageComponent.find(".page-content")[0]
    if (pageContentComponent) {
      pageContentComponent.addStyle({
        overflow: "hidden",
        position: "relative",
        "box-sizing": "border-box",
        display: "flex",
        "flex-direction": "column",
        height: `${pageHeight}px`,
        width: "100%"
      })
    }

    // Navigate to new page
    this.currentPageIndex = newPageIndex

    // Update page visuals
    setTimeout(() => {
      this.updateAllPageVisuals()

      // Update sections display if enabled
      if (this.sectionsSettings.enabled) {
        this.updateSectionsDisplay()
      }

      // Show confirmation popup
      const appliedFeatures = []
      if (newPage.header.enabled) appliedFeatures.push("Header")
      if (newPage.footer.enabled) appliedFeatures.push("Footer")
      if (newPage.pageNumber.enabled) appliedFeatures.push("Page Number")

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

getSectionsSettings() {
  return this.sectionsSettings
}
}
// Export for use in main.js
window.PageSetupManager = PageSetupManager
