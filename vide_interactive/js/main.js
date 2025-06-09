const editor = InteractiveDesigner.init({
  height: "100%",
  container: "#editor",
  fromElement: 1,
  allowScripts: 1,
  showOffsets: true,
  fromElement: true,
  noticeOnUnload: false,
  storageManager: false,
  selectorManager: {
    componentFirst: true,
  },
  plugins: [
    "code-editor-component",
    "postcss-parser-component",
    "webpage-component",
    customChartCommonJson,
    customTable,
    source,
    customCarousel,
    customNewFontUrl,
    customLoadingPage,
    customVideoIn,
    customSeparator,
    "basic-block-component",
    "countdown-component",
    "forms-component",
    "table-component",
    newComponents,
    object,
    customTabWithNav,
    "image-editor-component",
    "zip-export-component",
    "custom-code-component",
    "toolbox-component",
    "tooltip-component",
    "typed-component",
    "style-bg-component",
    "navbar-component",
    "page-manager-component",
  ],
  pluginsOpts: {
    "grapesjs-plugin-toolbox": {
      panels: true,
    },
    "page-manager-component": {
      category: "Pages",
      defaultPages: ["Home"],
    },
  },
  canvas: {
    styles: [
      "https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css",
      "https://use.fontawesome.com/releases/v5.8.2/css/all.css",
      "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap",
      "https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.5.0/css/bootstrap.min.css",
      "https://cdnjs.cloudflare.com/ajax/libs/mdbootstrap/4.19.1/css/mdb.min.css",
      "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css",
      "https://fonts.googleapis.com/icon?family=Material+Icons",
      "https://cdn.datatables.net/1.10.13/css/jquery.dataTables.min.css",
      "https://cdn.datatables.net/buttons/1.2.4/css/buttons.dataTables.min.css",
    ],
    scripts: [
      "https://code.jquery.com/jquery-3.3.1.slim.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js",
      "https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js",
      "https://code.jquery.com/jquery-2.1.1.min.js",
      "https://cdn.datatables.net/1.10.13/js/jquery.dataTables.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/jszip/2.5.0/jszip.min.js",
      "https://cdn.rawgit.com/bpampuch/pdfmake/0.1.24/build/pdfmake.min.js",
      "https://cdn.rawgit.com/bpampuch/pdfmake/0.1.24/build/vfs_fonts.js",
      "https://cdn.datatables.net/buttons/1.2.4/js/buttons.html5.min.js",
      "https://cdn.datatables.net/buttons/1.2.1/js/buttons.print.min.js",
      "https://cdn.datatables.net/buttons/1.2.4/js/dataTables.buttons.min.js",
      "https://code.highcharts.com/highcharts.js",
      "https://code.highcharts.com/modules/drilldown.js",
      "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
      "https://cdn.datatables.net/1.11.5/js/jquery.dataTables.min.js",
      "https://code.jquery.com/jquery-3.6.0.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
    ],
  },
})

// Initialize the page manager after editor is loaded
let pageManager = null
editor.on("load", () => {
  pageManager = editor.Plugins.get("page-manager-component")
})

const pn = editor.Panels
const panelViews = pn.addPanel({
  id: "views",
})

panelViews.get("buttons").add([
  {
    attributes: {
      title: "Open Code",
    },
    className: "fa fa-file-code-o",
    command: "open-code",
    togglable: false,
    id: "open-code",
  },
])

editor.Panels.addPanel({ id: "devices-c" })
  .get("buttons")
  .add([
    {
      id: "exportPDF",
      attributes: { title: "Export PDF", id: "exportPDF" },
      className: "exportPDF fa fa-file-pdf-o",
    },
    {
      id: "savePage",
      attributes: { title: "Save Page", id: "savePage" },
      className: "fa fa-download",
    },
    {
      id: "importPage",
      attributes: { title: "Import Page", id: "importPage" },
      className: "fa fa-upload",
    },
    {
      id: "jsonFileUpload",
      attributes: { title: "Upload json file", id: "jsonFileUpload" },
      className: "fa fa-file",
    },
    {
      id: "multiLanguage",
      attributes: { title: "Change Language", id: "multiLanguage" },
      className: "fa fa-language",
    },
  ])

var el = document.getElementById("exportPDF")
el.addEventListener("click", generateAdvancedPDF, true)
var save = document.getElementById("savePage")
save.addEventListener("click", savePage, true)

var importPage = document.getElementById("importPage")
importPage.addEventListener("click", importSinglePages, true)

// Backend URL configuration
const BACKEND_URL = "http://localhost:3000"

// FIXED: Enhanced PDF Preview and Generation System with Accurate Page Boundaries
function initializePDFSystem() {
  const modalHTML = `
        <div id="pdfPreviewModal" class="pdf-modal" style="display: none;">
            <div class="pdf-modal-content">
                <div class="pdf-toolbar">
                    <div class="pdf-toolbar-left">
                        <button id="pdfClose" class="pdf-btn pdf-btn-close">×</button>
                        <span class="pdf-title">Report Preview</span>
                    </div>
                    <div class="pdf-toolbar-center">
                        <button id="pdfPrevPage" class="pdf-btn">◀</button>
                        <input type="number" id="pdfCurrentPage" class="pdf-page-input" value="1" min="1">
                        <span id="pdfTotalPages" class="pdf-page-info">/ 1</span>
                        <button id="pdfNextPage" class="pdf-btn">▶</button>
                    </div>
                    <div class="pdf-toolbar-right">
                        <button id="pdfSettings" class="pdf-btn">⚙️</button>
                        <button id="pdfPrint" class="pdf-btn">🖨</button>
                        <button id="pdfDownload" class="pdf-btn pdf-btn-primary">⬇ Download PDF</button>
                    </div>
                </div>
                
                <div class="pdf-main-container">
                    <div class="pdf-preview-container">
                        <div class="pdf-content-wrapper">
                            <div id="pdfPreviewContent" class="pdf-preview-content">
                                <div class="pdf-loading">Loading preview...</div>
                            </div>
                            <div id="pdfPageIndicator" class="pdf-page-indicator">
                            </div>
                        </div>
                    </div>
                    
                    <div class="pdf-settings-panel" id="pdfSettingsPanel" style="display: none;">
                        <div class="pdf-settings-header">
                            <h3>PDF Settings</h3>
                            <button id="pdfSettingsClose" class="pdf-btn">×</button>
                        </div>
                        
                        <div class="pdf-settings-content">
                            <div class="pdf-settings-section">
                                <h4>Page Settings</h4>
                                <div class="pdf-settings-row">
                                    <label>Format:</label>
                                    <select id="pdfPageFormat" class="pdf-control">
                                        <option value="a4" selected>A4</option>
                                        <option value="a3">A3</option>
                                        <option value="a2">A2</option>
                                        <option value="letter">Letter</option>
                                        <option value="legal">Legal</option>
                                        <option value="tabloid">Tabloid</option>
                                    </select>
                                </div>
                                <div class="pdf-settings-row">
                                    <label>Orientation:</label>
                                    <select id="pdfOrientation" class="pdf-control">
                                        <option value="portrait" selected>Portrait</option>
                                        <option value="landscape">Landscape</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="pdf-settings-section">
                                <h4>Margins (Real-time Preview)</h4>
                                <div class="pdf-settings-row">
                                    <label>Unit:</label>
                                    <select id="pdfMarginUnit" class="pdf-control">
                                        <option value="mm" selected>mm</option>
                                        <option value="px">px</option>
                                        <option value="in">inches</option>
                                        <option value="pt">points</option>
                                    </select>
                                </div>
                                <div class="pdf-margin-inputs">
                                    <div class="pdf-margin-row">
                                        <label>Top:</label>
                                        <input type="number" id="pdfMarginTop" class="pdf-margin-input" value="0" min="0" step="0.1">
                                    </div>
                                    <div class="pdf-margin-row">
                                        <label>Right:</label>
                                        <input type="number" id="pdfMarginRight" class="pdf-margin-input" value="0" min="0" step="0.1">
                                    </div>
                                    <div class="pdf-margin-row">
                                        <label>Bottom:</label>
                                        <input type="number" id="pdfMarginBottom" class="pdf-margin-input" value="0" min="0" step="0.1">
                                    </div>
                                    <div class="pdf-margin-row">
                                        <label>Left:</label>
                                        <input type="number" id="pdfMarginLeft" class="pdf-margin-input" value="0" min="0" step="0.1">
                                    </div>
                                </div>
                            </div>
                            
                            <div class="pdf-settings-section">
                                <h4>Security Settings</h4>
                                <div class="pdf-settings-row">
                                    <label>
                                        <input type="checkbox" id="pdfPasswordProtected" class="pdf-checkbox">
                                        Password Protect PDF
                                    </label>
                                </div>
                                <div id="pdfPasswordOptions" class="pdf-password-options" style="display: none;">
                                    <div class="pdf-settings-row">
                                        <label>Password:</label>
                                        <div class="pdf-password-input-container">
                                            <input type="password" id="pdfPassword" class="pdf-control pdf-password-field" placeholder="Enter password">
                                            <button type="button" id="pdfPasswordToggle" class="pdf-password-toggle" title="Show/Hide Password">
                                                <i class="fa fa-eye"></i>
                                            </button>
                                        </div>
                                    </div>
                                    <div class="pdf-settings-row">
                                        <label>Confirm:</label>
                                        <div class="pdf-password-input-container">
                                            <input type="password" id="pdfPasswordConfirm" class="pdf-control pdf-password-field" placeholder="Confirm password">
                                            <button type="button" id="pdfPasswordConfirmToggle" class="pdf-password-toggle" title="Show/Hide Password">
                                                <i class="fa fa-eye"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="pdf-settings-actions">
                                <button id="pdfApplySettings" class="pdf-btn pdf-btn-primary">Apply Settings</button>
                                <button id="pdfResetSettings" class="pdf-btn">Reset</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `

  // FIXED: Enhanced PDF preview styles with accurate page boundary visualization and dynamic positioning
  const stylesHTML = `
        <style>
            .pdf-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .pdf-modal-content {
                width: 95%;
                height: 95%;
                max-width: 1400px;
                max-height: 900px;
                background: white;
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            }
            
            .pdf-toolbar {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 15px;
                background: #f8f9fa;
                border-bottom: 1px solid #dee2e6;
                border-radius: 8px 8px 0 0;
                flex-wrap: wrap;
                gap: 10px;
                min-height: 60px;
            }
            
            .pdf-toolbar-left, .pdf-toolbar-center, .pdf-toolbar-right {
                display: flex;
                align-items: center;
                gap: 10px;
                flex-wrap: wrap;
            }
            
            .pdf-btn {
                padding: 8px 12px;
                border: 1px solid #ccc;
                background: white;
                cursor: pointer;
                border-radius: 4px;
                font-size: 14px;
                transition: all 0.2s;
                white-space: nowrap;
            }
            
            .pdf-btn:hover {
                background: #e9ecef;
            }
            
            .pdf-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
            
            .pdf-btn-primary {
                background: #007bff;
                color: white;
                border-color: #007bff;
            }
            
            .pdf-btn-primary:hover {
                background: #0056b3;
            }
            
            .pdf-btn-close {
                background: #dc3545;
                color: white;
                border-color: #dc3545;
                font-size: 18px;
                font-weight: bold;
                padding: 5px 10px;
            }
            
            .pdf-btn-close:hover {
                background: #c82333;
            }
            
            .pdf-title {
                font-weight: bold;
                font-size: 16px;
                margin-left: 10px;
            }
            
            .pdf-page-input {
                width: 60px;
                text-align: center;
                border: 1px solid #ccc;
                border-radius: 4px;
                padding: 5px;
            }
            
            .pdf-page-info {
                font-size: 14px;
                color: #666;
            }
            
            .pdf-main-container {
                display: flex;
                flex: 1;
                overflow: hidden;
                min-height: 0;
            }
            
            .pdf-preview-container {
                flex: 1;
                display: flex;
                flex-direction: column;
                background: #e9ecef;
                min-width: 0;
                overflow: hidden;
            }
            
            .pdf-settings-panel {
                width: 350px;
                min-width: 300px;
                background: #f8f9fa;
                border-left: 1px solid #dee2e6;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            
            .pdf-settings-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px;
                border-bottom: 1px solid #dee2e6;
                background: white;
            }
            
            .pdf-settings-header h3 {
                margin: 0;
                font-size: 18px;
                font-weight: bold;
                color: #333;
            }
            
            .pdf-settings-content {
                flex: 1;
                overflow-y: auto;
                overflow-x: hidden;
                padding: 15px;
                height: 85%;
                min-height: 0;
            }

            .pdf-settings-content::-webkit-scrollbar {
                width: 8px;
            }
            
            .pdf-settings-content::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 4px;
            }
            
            .pdf-settings-content::-webkit-scrollbar-thumb {
                background: #c1c1c1;
                border-radius: 4px;
            }
            
            .pdf-settings-content::-webkit-scrollbar-thumb:hover {
                background: #a8a8a8;
            }
            
            .pdf-settings-section {
                margin-bottom: 20px;
                padding: 15px;
                background: white;
                border-radius: 4px;
                border: 1px solid #dee2e6;
            }
            
            .pdf-settings-section h4 {
                margin: 0 0 15px 0;
                font-size: 16px;
                font-weight: bold;
                color: #333;
            }
            
            .pdf-settings-row {
                display: flex;
                align-items: center;
                margin-bottom: 10px;
            }
            
            .pdf-settings-row label {
                min-width: 80px;
                font-weight: 500;
                font-size: 14px;
            }
            
            .pdf-control {
                padding: 5px 8px;
                border: 1px solid #ccc;
                border-radius: 4px;
                font-size: 14px;
                flex: 1;
            }
            
            .pdf-checkbox {
                margin-right: 8px;
            }
            
            .pdf-margin-inputs {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
            }
            
            .pdf-margin-row {
                display: flex;
                align-items: center;
                gap: 5px;
            }
            
            .pdf-margin-row label {
                min-width: 50px;
                font-size: 12px;
            }
            
            .pdf-margin-input {
                width: 80px;
                padding: 3px 5px;
                border: 1px solid #ccc;
                border-radius: 3px;
            }
            
            .pdf-password-options {
                margin-top: 10px;
                padding: 10px;
                background: #fff3cd;
                border-radius: 4px;
                border: 1px solid #ffeaa7;
            }
            
            .pdf-password-input-container {
                position: relative;
                display: flex;
                align-items: center;
                flex: 1;
            }
            
            .pdf-password-field {
                flex: 1;
            }
            
            .pdf-password-toggle {
                position: absolute;
                right: 2px;
                background: none;
                border: none;
                cursor: pointer;
                color: #666;
                font-size: 14px;
                padding: 4px;
                border-radius: 3px;
                transition: color 0.2s;
            }
            
            .pdf-password-toggle:hover {
                color: #333;
                background: #f8f9fa;
            }
            
            .pdf-password-toggle i {
                pointer-events: none;
            }
            
            .pdf-settings-actions {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                margin-top: 20px;
            }
            
            .pdf-content-wrapper {
                flex: 1;
                overflow: auto;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                padding: 0;
                min-height: 0;
                background: #e9ecef;
                position: relative;
            }
            
            /* FIXED: Dynamic PDF page preview with responsive positioning */
            .pdf-preview-content {
                background: white;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                border-radius: 4px;
                overflow: hidden;
                position: relative;
                border: 2px solid #007bff;
                display: flex;
                flex-direction: column;
                /* Dynamic dimensions and positioning will be set via JavaScript */
                transition: all 0.3s ease;
            }
            
            .pdf-loading {
                padding: 40px;
                text-align: center;
                font-size: 18px;
                color: #666;
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 400px;
            }
            
            .pdf-page {
                margin-bottom: 20px;
                page-break-after: always;
                position: relative;
                background: white;
            }
            
            /* FIXED: Responsive iframe sizing for PDF preview with dynamic clipping */
            .pdf-preview-iframe {
                border: none;
                background: white;
                display: block;
                width: 100%;
                height: 100%;
                min-height: 600px;
                border-radius: 4px;
                overflow: hidden;
            }

            .pdf-element-container {
                position: relative;
                border: none !important;
                background: none !important;
                margin: 0;
            }

            .pdf-element-controls {
                display: none !important;
            }

            .pdf-element-position {
                display: none !important;
            }

            .pdf-element-btn {
                display: none !important;
            }
            
            /* FIXED: Content overflow indicator */
            .pdf-content-overflow-indicator {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 30px;
                background: linear-gradient(transparent, rgba(255, 193, 7, 0.8));
                display: flex;
                align-items: flex-end;
                justify-content: center;
                font-size: 11px;
                font-weight: bold;
                color: #856404;
                padding-bottom: 5px;
                z-index: 100;
            }
            
            @media print {
                .pdf-modal, .pdf-toolbar, .pdf-settings-panel {
                    display: none !important;
                }
                
                .pdf-preview-content {
                    box-shadow: none;
                    padding: 0;
                    transform: none !important;
                }

                .pdf-element-controls, .pdf-element-position {
                    display: none !important;
                }

                .pdf-element-container {
                    border: none !important;
                    background: none !important;
                }
            }
            
            @media (max-width: 1024px) {
                .pdf-modal-content {
                    width: 98%;
                    height: 98%;
                }
                
                .pdf-main-container {
                    flex-direction: column;
                }
                
                .pdf-settings-panel {
                    width: 100%;
                    max-height: 40%;
                    min-width: auto;
                }
                
                .pdf-preview-container {
                    min-height: 60%;
                }
            }
            
            @media (max-width: 768px) {
                .pdf-toolbar {
                    flex-direction: column;
                    align-items: stretch;
                    padding: 8px;
                    min-height: auto;
                }
                
                .pdf-toolbar-left, .pdf-toolbar-center, .pdf-toolbar-right {
                    justify-content: center;
                    margin: 2px 0;
                }
                
                .pdf-btn {
                    padding: 6px 10px;
                    font-size: 12px;
                }
                
                .pdf-title {
                    font-size: 14px;
                    margin-left: 5px;
                }
                
                .pdf-settings-panel {
                    max-height: 50%;
                }
                
                .pdf-margin-inputs {
                    grid-template-columns: 1fr;
                }
                
                .pdf-content-wrapper {
                    padding: 0;
                }
                
                .pdf-settings-content {
                    padding: 10px;
                }
            }
            
            @media (max-width: 480px) {
                .pdf-modal-content {
                    width: 100%;
                    height: 100%;
                    border-radius: 0;
                }
                
                .pdf-toolbar {
                    padding: 5px;
                }
                
                .pdf-btn {
                    padding: 4px 8px;
                    font-size: 11px;
                }
                
                .pdf-page-input {
                    width: 50px;
                }
                
                .pdf-settings-actions {
                    flex-direction: column;
                }
                
                .pdf-content-wrapper {
                    padding: 0;
                }
                
                .pdf-settings-content {
                    padding: 5px;
                }
            }
        </style>
    `

  if (!document.getElementById("pdfPreviewStyles")) {
    const styleElement = document.createElement("div")
    styleElement.id = "pdfPreviewStyles"
    styleElement.innerHTML = stylesHTML
    document.head.appendChild(styleElement)
  }

  if (!document.getElementById("pdfPreviewModal")) {
    document.body.insertAdjacentHTML("beforeend", modalHTML)
  }
}

// Enhanced global variables for PDF system
var pdfSystemData = {
  currentContent: "",
  originalContent: "",
  currentPage: 1,
  totalPages: 1,
  zoomLevel: 1,
  searchTerm: "",
  searchResults: [],
  currentSearchIndex: 0,
  elementOrder: [],
  reorderMode: false,
  selectedElement: null,
  settings: {
    pageFormat: "a4",
    orientation: "portrait",
    margins: { top: 0, right: 0, bottom: 0, left: 0, unit: "mm" },
    watermark: {
      type: "none",
      text: "",
      image: null,
      fontSize: 48,
      color: "#cccccc",
      opacity: 0.3,
      position: "center",
      rotation: 0,
    },
    pageSelection: "all",
    customPages: "",
    security: {
      passwordProtected: false,
      password: "",
      permissions: {
        print: true,
        copy: true,
        modify: false,
        annotate: false,
      },
    },
  },
}

function generateAdvancedPDF() {
  initializePDFSystem()

  var iframe = document.querySelector("#editor iframe")
  if (!iframe) {
    const canvas = document.querySelector("canvas")
    if (canvas) {
      generateFromCanvas()
      return
    } else {
      alert("No content source found (iframe or canvas)")
      return
    }
  }

  extractContentFromIframe(iframe)
}

function extractContentFromIframe(iframe) {
  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
    const tabs = iframeDoc.querySelectorAll(".tab-content")
    const tabContents = []

    if (tabs.length > 0) {
      tabs.forEach((tab, index) => {
        const tabContainer = tab.querySelectorAll(".tab-container")
        tabContainer.forEach((container) => {
          container.style.display = "none"
        })

        const elements = extractElementsFromTab(tab, index)

        tabContents.push({
          content: tab.innerHTML,
          title: `Page ${index + 1}`,
          elements: elements,
        })

        tab.style.display = "block"
        tabContainer.forEach((container) => {
          container.style.display = "block"
        })
      })
    } else {
      const elements = extractElementsFromTab(iframeDoc.body, 0)
      tabContents.push({
        content: iframeDoc.body.innerHTML,
        title: "Page 1",
        elements: elements,
      })
    }

    processContentForPreview(tabContents)
  } catch (error) {
    console.error("Error extracting content from iframe:", error)
    alert("Error accessing iframe content. Please ensure the content is loaded.")
  }
}

function extractElementsFromTab(tabElement, pageIndex) {
  const elements = []
  const elementSelectors = [
    "img",
    "table",
    'div[class*="text"]',
    "p",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    ".chart-container",
    ".api-component",
    "canvas",
    "iframe",
    ".external-component",
  ]

  elementSelectors.forEach((selector) => {
    const foundElements = tabElement.querySelectorAll(selector)
    foundElements.forEach((el, index) => {
      const isNested = elementSelectors.some((parentSelector) => {
        if (parentSelector === selector) return false
        const parents = tabElement.querySelectorAll(parentSelector)
        return Array.from(parents).some((parent) => parent.contains(el) && parent !== el)
      })

      if (!isNested) {
        const elementId = el.id || `element-${pageIndex}-${selector.replace(/[^a-zA-Z0-9]/g, "")}-${index}`
        if (!el.id) {
          el.id = elementId
        }

        elements.push({
          id: elementId,
          type: getElementType(el),
          selector: selector,
          originalIndex: elements.length,
          element: el,
        })
      }
    })
  })

  return elements
}

function getElementType(element) {
  if (element.tagName === "IMG") return "Image"
  if (element.tagName === "TABLE") return "Table"
  if (element.tagName === "CANVAS") return "Chart/Canvas"
  if (element.tagName === "IFRAME") return "External Content"
  if (element.classList.contains("chart-container")) return "Chart"
  if (element.classList.contains("api-component")) return "API Component"
  if (["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6"].includes(element.tagName)) return "Text"
  return "Element"
}

function generateFromCanvas() {
  const canvas = document.querySelector("canvas")
  const canvasDataURL = canvas.toDataURL("image/png")

  const tabContents = [
    {
      content: `<img src="${canvasDataURL}" style="width: 100%; height: auto;">`,
      title: "Canvas Content",
      elements: [
        {
          id: "canvas-element-0",
          type: "Image",
          selector: "img",
          originalIndex: 0,
        },
      ],
    },
  ]

  processContentForPreview(tabContents)
}

function processContentForPreview(tabContents) {
  pdfSystemData.originalContent = tabContents
  pdfSystemData.elementOrder = tabContents.map((tab) => (tab.elements ? tab.elements.map((el) => el.id) : []))

  const fullContent = prepareEnhancedHTMLContent(tabContents)
  pdfSystemData.currentContent = fullContent
  pdfSystemData.totalPages = tabContents.length
  pdfSystemData.currentPage = 1

  showEnhancedPDFPreview()
}

function prepareEnhancedHTMLContent(tabContents) {
  var editorCSS = ""
  try {
    if (typeof editor !== "undefined" && editor.getCss) {
      editorCSS = editor.getCss()
    }
  } catch (e) {
    console.warn("Could not get editor CSS:", e)
  }

  // FIXED: Enhanced CSS for accurate PDF preview with proper page boundaries and dynamic margins
  const enhancedCSS = `
        <style>
            * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
                box-sizing: border-box;
            }
            
            html, body {
                margin: 0;
                padding: 0;
                width: 100%;
                height: 100%;
                font-family: Arial, sans-serif;
                line-height: 1.4;
                color: #333;
                background: white;
                overflow: hidden;
            }
            
            body {
                margin: ${pdfSystemData.settings.margins.top}${pdfSystemData.settings.margins.unit} 
                       ${pdfSystemData.settings.margins.right}${pdfSystemData.settings.margins.unit} 
                       ${pdfSystemData.settings.margins.bottom}${pdfSystemData.settings.margins.unit} 
                       ${pdfSystemData.settings.margins.left}${pdfSystemData.settings.margins.unit} !important;
                padding: 0 !important;
                position: relative;
                overflow: hidden;
                height: calc(100vh - ${pdfSystemData.settings.margins.top}${pdfSystemData.settings.margins.unit} - ${pdfSystemData.settings.margins.bottom}${pdfSystemData.settings.margins.unit});
                width: calc(100vw - ${pdfSystemData.settings.margins.left}${pdfSystemData.settings.margins.unit} - ${pdfSystemData.settings.margins.right}${pdfSystemData.settings.margins.unit});
            }
            
            .tab-contents {
                min-height: auto !important;
                padding: 0px !important;
                width: 100%;
                max-height: 100%;
                overflow: hidden;
            }
            
            table {
                border-collapse: collapse;
                width: 100%;
                table-layout: auto;
                word-wrap: break-word;
                max-width: 100%;
                overflow: hidden;
            }
            
            table, th, td {
                border: 1px solid #ddd;
            }
            
            th, td {
                text-align: left;
                overflow: hidden;
                text-overflow: ellipsis;
                word-break: break-word;
                max-width: 200px;
            }
            
            th {
                background-color: #f2f2f2;
                font-weight: bold;
            }
            
            img {
                max-width: 100%;
                height: auto;
                object-fit: contain;
                max-height: 80vh;
            }
            
            .chart-container, .api-component, .external-component {
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                padding: 15px;
                margin: 10px 0;
                border-radius: 4px;
                min-height: 300px;
                display: block !important;
                visibility: visible !important;
                max-width: 100%;
                max-height: 60vh;
                overflow: hidden;
            }
            
            canvas, iframe, object, embed {
                max-width: 100%;
                height: auto;
                display: block !important;
                visibility: visible !important;
                max-height: 60vh;
            }
            
            .dataTables_wrapper {
                width: 100%;
                display: block !important;
                overflow: hidden;
                max-height: 70vh;
            }
            
            .dataTables_wrapper table {
                width: 100% !important;
                display: table !important;
                table-layout: fixed;
            }
            
            .highcharts-container, .chartjs-render-monitor {
                display: block !important;
                visibility: visible !important;
                max-width: 100% !important;
                max-height: 50vh !important;
            }
            
            .container, .container-fluid, .row, .col, [class*="col-"] {
                display: block !important;
                visibility: visible !important;
                max-width: 100%;
                overflow: hidden;
            }
            
            .fa, .fas, .far, .fab, .fal {
                display: inline-block !important;
                visibility: visible !important;
            }
            
            * {
                page-break-inside: avoid;
            }
            
            h1, h2, h3, h4, h5, h6 {
                page-break-after: avoid;
                margin: 0 0 10px 0;
                padding: 0;
            }
            
            p, div, h1, h2, h3, h4, h5, h6 {
                margin: 0 0 10px 0;
                padding: 0;
                word-wrap: break-word;
                overflow-wrap: break-word;
            }
            
            .pdf-element-container {
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
                background: none !important;
                max-width: 100%;
                overflow: hidden;
            }
            
            ${editorCSS}
        </style>
    `

  const externalStyles = [
    "https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css",
    "https://use.fontawesome.com/releases/v5.8.2/css/all.css",
    "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap",
    "https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.5.0/css/bootstrap.min.css",
    "https://cdnjs.cloudflare.com/ajax/libs/mdbootstrap/4.19.1/css/mdb.min.css",
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css",
    "https://fonts.googleapis.com/icon?family=Material+Icons",
    "https://cdn.datatables.net/1.10.13/css/jquery.dataTables.min.css",
    "https://cdn.datatables.net/buttons/1.2.4/css/buttons.dataTables.min.css",
  ]

  const externalScripts = [
    "https://code.jquery.com/jquery-3.6.0.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js",
    "https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js",
    "https://cdn.datatables.net/1.10.13/js/jquery.dataTables.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/jszip/2.5.0/jszip.min.js",
    "https://cdn.rawgit.com/bpampuch/pdfmake/0.1.24/build/pdfmake.min.js",
    "https://cdn.rawgit.com/bpampuch/pdfmake/0.1.24/build/vfs_fonts.js",
    "https://cdn.datatables.net/buttons/1.2.4/js/buttons.html5.min.js",
    "https://cdn.datatables.net/buttons/1.2.1/js/buttons.print.min.js",
    "https://cdn.datatables.net/buttons/1.2.4/js/dataTables.buttons.min.js",
    "https://code.highcharts.com/highcharts.js",
    "https://code.highcharts.com/modules/drilldown.js",
    "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
  ]

  const styleLinks = externalStyles.map((url) => `<link rel="stylesheet" href="${url}">`).join("\n")
  const scriptTags = externalScripts.map((url) => `<script src="${url}"></script>`).join("\n")

  // FIXED: Enhanced content overflow check with better component initialization
  const contentOverflowCheck = `
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(function() {
                    const bodyHeight = document.body.scrollHeight;
                    const viewportHeight = window.innerHeight;
                    
                    // Initialize external components
                    if (typeof $ !== 'undefined' && $.fn.DataTable) {
                        $('table.display, table.dataTable').each(function() {
                            if (!$.fn.DataTable.isDataTable(this)) {
                                try {
                                    $(this).DataTable({
                                        responsive: true,
                                        pageLength: 50,
                                        searching: false,
                                        paging: false,
                                        info: false,
                                        dom: 't',
                                        scrollY: '400px',
                                        scrollCollapse: true
                                    });
                                } catch(e) {
                                    console.warn('DataTable initialization failed:', e);
                                }
                            }
                        });
                    }
                    
                    if (typeof Highcharts !== 'undefined') {
                        try {
                            Highcharts.charts.forEach(function(chart) {
                                if (chart) {
                                    chart.setSize(null, Math.min(400, window.innerHeight * 0.5));
                                    chart.redraw();
                                }
                            });
                        } catch(e) {
                            console.warn('Highcharts redraw failed:', e);
                        }
                    }
                    
                    document.querySelectorAll('.chart-container, .api-component, canvas, iframe').forEach(function(el) {
                        el.style.display = 'block';
                        el.style.visibility = 'visible';
                        if (el.offsetHeight > window.innerHeight * 0.6) {
                            el.style.height = (window.innerHeight * 0.6) + 'px';
                            el.style.overflow = 'hidden';
                        }
                    });
                }, 1000);
            });
        </script>
    `

  const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Report Preview</title>
            ${styleLinks}
            ${enhancedCSS}
        </head>
        <body>
            ${tabContents
              .map(
                (tab, index) =>
                  `<div class="pdf-page" data-page="${index + 1}">
                    ${processContentForFinalPreview(tab.content, tab.elements, index)}
                </div>`,
              )
              .join("")}
            ${scriptTags}
            ${contentOverflowCheck}
        </body>
        </html>
    `

  return htmlContent
}

function processContentForFinalPreview(content, elements, pageIndex) {
  let processedContent = processContentWithExternalComponents(content)

  if (elements && elements.length > 0) {
    elements.forEach((elementData, index) => {
      const elementId = elementData.id
      const elementType = elementData.type

      const elementRegex = new RegExp(`(<[^>]*id=["']${elementId}["'][^>]*>)`, "gi")

      processedContent = processedContent.replace(elementRegex, (match) => {
        return `<div class="pdf-element-container" data-element-id="${elementId}" data-page-index="${pageIndex}" data-element-type="${elementType}" style="border: none !important; background: none !important; margin: 0 !important; padding: 0 !important; max-width: 100%; overflow: hidden;">
                  ${match}`
      })
    })
  }

  return processedContent
}

async function captureExternalComponentsAsImages(content) {
  let processedContent = content

  const tempIframe = document.createElement("iframe")
  tempIframe.style.position = "absolute"
  tempIframe.style.left = "-9999px"
  tempIframe.style.width = "1200px"
  tempIframe.style.height = "800px"
  document.body.appendChild(tempIframe)

  try {
    const iframeDoc = tempIframe.contentDocument || tempIframe.contentWindow.document
    iframeDoc.open()
    iframeDoc.write(processedContent)
    iframeDoc.close()

    await new Promise((resolve) => setTimeout(resolve, 1000))

    const externalComponents = iframeDoc.querySelectorAll(
      '.chart-container, canvas, .highcharts-container, .dataTables_wrapper, iframe[src*="chart"], iframe[src*="graph"]',
    )

    for (let i = 0; i < externalComponents.length; i++) {
      const component = externalComponents[i]
      try {
        const html2canvas = window.html2canvas
        const canvas = await html2canvas(component, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          width: component.offsetWidth || 800,
          height: component.offsetHeight || 400,
        })

        const imageDataUrl = canvas.toDataURL("image/png")

        const componentId = component.id || `external-component-${i}`
        component.id = componentId

        const imageHtml = `<img src="${imageDataUrl}" style="width: 100%; max-width: ${component.offsetWidth || 800}px; height: auto;" alt="External Component ${i + 1}">`

        const componentOuterHTML = component.outerHTML
        processedContent = processedContent.replace(componentOuterHTML, imageHtml)
      } catch (error) {
        console.warn("Failed to capture external component:", error)
        const placeholderHtml = `<div style="width: 100%; height: 300px; background: #f8f9fa; border: 2px dashed #dee2e6; display: flex; align-items: center; justify-content: center; font-size: 16px; color: #666;">External Component (Chart/Table)</div>`
        processedContent = processedContent.replace(component.outerHTML, placeholderHtml)
      }
    }
  } finally {
    document.body.removeChild(tempIframe)
  }

  return processedContent
}

function processContentWithExternalComponents(content) {
  let processedContent = content

  processedContent = processedContent.replace(/style\s*=\s*["'][^"']*display\s*:\s*none[^"']*["']/gi, "")

  processedContent = processedContent.replace(/<div([^>]*)(id|class)="[^"]*chart[^"]*"([^>]*)>/gi, (match) => {
    if (!match.includes("chart-container")) {
      return match.replace(/class="/, 'class="chart-container ')
    }
    return match
  })

  processedContent = processedContent.replace(/src=["'](?!http|data:)[^"']*["']/gi, (match) => {
    console.warn("Fixed relative image source:", match)
    return 'src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y4ZjlmYSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2U8L3RleHQ+PC9zdmc+"'
  })

  processedContent = processedContent.replace(/<table[^>]*class="[^"]*display[^"]*"[^>]*>/gi, (match) => {
    return match.replace(/class="/, 'class="table table-striped table-bordered ')
  })

  processedContent = processedContent.replace(/<div[^>]*id="[^"]*chart[^"]*"[^>]*>/gi, (match) => {
    if (!match.includes("style=")) {
      return match.replace(">", ' style="min-height: 400px; width: 100%; display: block !important;">')
    }
    return match
  })

  processedContent = processedContent.replace(/<iframe[^>]*>/gi, (match) => {
    if (!match.includes("style=")) {
      return match.replace(
        ">",
        ' style="width: 100%; min-height: 400px; border: 1px solid #ddd; display: block !important;">',
      )
    }
    return match
  })

  return processedContent
}

// FIXED: Enhanced PDF preview display function with dynamic positioning for all formats and orientations
function showEnhancedPDFPreview() {
  const modal = document.getElementById("pdfPreviewModal")
  const previewContent = document.getElementById("pdfPreviewContent")

  modal.style.display = "flex"

  // FIXED: Create iframe with exact PDF page dimensions
  const iframe = document.createElement("iframe")
  iframe.className = "pdf-preview-iframe"

  // FIXED: Calculate exact PDF dimensions and apply dynamic positioning
  const dimensions = getExactPDFDimensions()
  
  // FIXED: Set the preview content container to exact PDF page size
  previewContent.style.width = dimensions.width + "px"
  previewContent.style.height = dimensions.height + "px"
  previewContent.style.maxWidth = "none"
  previewContent.style.maxHeight = "none"
  previewContent.style.minWidth = dimensions.width + "px"
  previewContent.style.minHeight = dimensions.height + "px"

  // FIXED: Apply dynamic positioning based on PDF dimensions and viewport
  applyDynamicPositioning(previewContent, dimensions)

  console.log("PDF Preview Dimensions:", {
    width: dimensions.width + "px",
    height: dimensions.height + "px",
    format: pdfSystemData.settings.pageFormat,
    orientation: pdfSystemData.settings.orientation,
  })

  // Clear loading content and add iframe
  previewContent.innerHTML = ""
  previewContent.appendChild(iframe)

  // FIXED: Write content to iframe with proper error handling
  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
    iframeDoc.open()
    iframeDoc.write(pdfSystemData.currentContent)
    iframeDoc.close()

    // Wait for content to load then update UI
    iframe.onload = () => {
      updatePreviewUI()
      setupEventListeners()
      checkContentOverflow(iframe)
    }

    // Fallback in case onload doesn't fire
    setTimeout(() => {
      updatePreviewUI()
      setupEventListeners()
      checkContentOverflow(iframe)
    }, 1000)
  } catch (error) {
    console.error("Error loading iframe content:", error)
    previewContent.innerHTML = `
      <div class="pdf-loading">
        <div>Error loading preview</div>
        <div style="font-size: 14px; color: #999; margin-top: 10px;">
          ${error.message}
        </div>
      </div>
    `
  }
}

// FIXED: Function to get exact PDF dimensions with improved calculations for all formats
function getExactPDFDimensions() {
  const format = pdfSystemData.settings.pageFormat
  const orientation = pdfSystemData.settings.orientation

  // Standard page dimensions in millimeters (more comprehensive list)
  const dimensions = {
    a4: { width: 210, height: 297 },
    a3: { width: 297, height: 420 },
    a2: { width: 420, height: 594 },
    a1: { width: 594, height: 841 },
    a0: { width: 841, height: 1189 },
    letter: { width: 215.9, height: 279.4 },
    legal: { width: 215.9, height: 355.6 },
    tabloid: { width: 279.4, height: 431.8 },
    ledger: { width: 431.8, height: 279.4 },
  }

  const dim = dimensions[format] || dimensions["a4"]
  let width = orientation === "landscape" ? dim.height : dim.width
  let height = orientation === "landscape" ? dim.width : dim.height

  // FIXED: Use precise DPI conversion (96 pixels per inch is standard for web)
  // 1 inch = 25.4 mm, so 1 mm = 96/25.4 ≈ 3.7795275591 pixels
  const mmToPx = 96 / 25.4

  width = Math.round(width * mmToPx)
  height = Math.round(height * mmToPx)

  console.log("Exact PDF Dimensions Calculation:", {
    format: format,
    orientation: orientation,
    mmDimensions: { width: dim.width, height: dim.height },
    orientedMmDimensions: { 
      width: orientation === "landscape" ? dim.height : dim.width, 
      height: orientation === "landscape" ? dim.width : dim.height 
    },
    mmToPxRatio: mmToPx,
    finalPixels: { width, height },
  })

  return {
    width: width,
    height: height,
    actualWidth: width,
    actualHeight: height,
    mmToPxRatio: mmToPx,
  }
}

// FIXED: Enhanced function to apply dynamic positioning based on PDF format and orientation
// with improved space utilization and reduced empty space
function applyDynamicPositioning(previewContent, dimensions) {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight
  
  // Get the available space in the preview container (accounting for toolbar and settings panel)
  const toolbar = document.querySelector('.pdf-toolbar')
  const settingsPanel = document.querySelector('.pdf-settings-panel')
  const toolbarHeight = toolbar ? toolbar.offsetHeight : 60
  const settingsPanelWidth = settingsPanel && settingsPanel.style.display !== 'none' ? settingsPanel.offsetWidth : 0
  
  // Calculate available space with minimal padding
  const availableWidth = viewportWidth - settingsPanelWidth - 20 // Reduced padding from 40px to 20px
  const availableHeight = viewportHeight - toolbarHeight - 20 // Reduced padding from 40px to 20px
  
  // Calculate scale factor to maximize content size while maintaining aspect ratio
  const scaleX = availableWidth / dimensions.width
  const scaleY = availableHeight / dimensions.height
  
  // Use the minimum scale to ensure content fits, but aim for larger display
  // Increase minimum scale to 0.9 to ensure preview is not too small
  const scale = Math.min(scaleX, scaleY)
  
  // Calculate final dimensions after scaling
  const finalWidth = dimensions.width * scale
  const finalHeight = dimensions.height * scale
  
  // Calculate dynamic margins for centering with minimal spacing
  const horizontalMargin = Math.max(0, (availableWidth - finalWidth) / 2)
  const verticalMargin = Math.max(0, (availableHeight - finalHeight) / 2)
  
  // Apply dynamic positioning and scaling
  previewContent.style.transform = `scale(${scale})`
  previewContent.style.transformOrigin = 'top left'
  
  // Apply minimal margins to reduce empty space
  previewContent.style.marginTop = Math.max(5, verticalMargin) + "px"
  previewContent.style.marginLeft = Math.max(5, horizontalMargin) + "px"
  previewContent.style.marginRight = "0px" // Remove right margin
  previewContent.style.marginBottom = "0px" // Remove bottom margin
  
  // Update the content wrapper to handle the scaled content properly
  const contentWrapper = previewContent.parentElement
  if (contentWrapper) {
    contentWrapper.style.justifyContent = 'flex-start'
    contentWrapper.style.alignItems = 'flex-start'
    contentWrapper.style.padding = '0' // Remove padding to maximize space
    contentWrapper.style.overflow = 'auto' // Allow scrolling if needed
  }
  
  console.log("Dynamic Positioning Applied:", {
    format: pdfSystemData.settings.pageFormat,
    orientation: pdfSystemData.settings.orientation,
    originalDimensions: { width: dimensions.width, height: dimensions.height },
    availableSpace: { width: availableWidth, height: availableHeight },
    scale: scale,
    finalDimensions: { width: finalWidth, height: finalHeight },
    appliedMargins: {
      top: Math.max(5, verticalMargin),
      left: Math.max(5, horizontalMargin),
      right: 0,
      bottom: 0
    },
    viewportDimensions: { width: viewportWidth, height: viewportHeight },
    toolbarHeight: toolbarHeight,
    settingsPanelWidth: settingsPanelWidth
  })
}

// FIXED: Function to check if content overflows the page boundaries
function checkContentOverflow(iframe) {
  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
    const iframeWindow = iframe.contentWindow

    setTimeout(() => {
      const bodyHeight = iframeDoc.body.scrollHeight
      const viewportHeight = iframeWindow.innerHeight
      const bodyWidth = iframeDoc.body.scrollWidth
      const viewportWidth = iframeWindow.innerWidth

      console.log("Content Overflow Check:", {
        bodyHeight,
        viewportHeight,
        bodyWidth,
        viewportWidth,
        heightOverflow: bodyHeight > viewportHeight,
        widthOverflow: bodyWidth > viewportWidth,
      })
    }, 1500)
  } catch (error) {
    console.error("Error checking content overflow:", error)
  }
}

function updatePreviewUI() {
  document.getElementById("pdfCurrentPage").value = pdfSystemData.currentPage
  document.getElementById("pdfTotalPages").textContent = `/ ${pdfSystemData.totalPages}`

  document.getElementById("pdfPrevPage").disabled = pdfSystemData.currentPage <= 1
  document.getElementById("pdfNextPage").disabled = pdfSystemData.currentPage >= pdfSystemData.totalPages

  document.getElementById("pdfPageFormat").value = pdfSystemData.settings.pageFormat
  document.getElementById("pdfOrientation").value = pdfSystemData.settings.orientation

  document.getElementById("pdfMarginTop").value = pdfSystemData.settings.margins.top
  document.getElementById("pdfMarginRight").value = pdfSystemData.settings.margins.right
  document.getElementById("pdfMarginBottom").value = pdfSystemData.settings.margins.bottom
  document.getElementById("pdfMarginLeft").value = pdfSystemData.settings.margins.left
  document.getElementById("pdfMarginUnit").value = pdfSystemData.settings.margins.unit

  document.getElementById("pdfPasswordProtected").checked = pdfSystemData.settings.security.passwordProtected
  document.getElementById("pdfPassword").value = pdfSystemData.settings.security.password
  document.getElementById("pdfPasswordConfirm").value = pdfSystemData.settings.security.password
  togglePasswordOptions()
}

function setupEventListeners() {
  // Remove existing listeners to prevent duplicates
  const existingListeners = document.querySelectorAll("[data-pdf-listener]")
  existingListeners.forEach((el) => {
    el.removeAttribute("data-pdf-listener")
  })

  document.getElementById("pdfClose").onclick = closePDFPreview
  document.getElementById("pdfClose").setAttribute("data-pdf-listener", "true")

  document.getElementById("pdfPrevPage").onclick = () => navigatePage(-1)
  document.getElementById("pdfPrevPage").setAttribute("data-pdf-listener", "true")

  document.getElementById("pdfNextPage").onclick = () => navigatePage(1)
  document.getElementById("pdfNextPage").setAttribute("data-pdf-listener", "true")

  document.getElementById("pdfCurrentPage").onchange = goToPage
  document.getElementById("pdfCurrentPage").setAttribute("data-pdf-listener", "true")

  document.getElementById("pdfSettings").onclick = toggleSettings
  document.getElementById("pdfSettings").setAttribute("data-pdf-listener", "true")

  document.getElementById("pdfSettingsClose").onclick = toggleSettings
  document.getElementById("pdfSettingsClose").setAttribute("data-pdf-listener", "true")

  document.getElementById("pdfApplySettings").onclick = applySettings
  document.getElementById("pdfApplySettings").setAttribute("data-pdf-listener", "true")

  document.getElementById("pdfResetSettings").onclick = resetSettings
  document.getElementById("pdfResetSettings").setAttribute("data-pdf-listener", "true")

  document.getElementById("pdfPageFormat").onchange = updatePreviewDynamically
  document.getElementById("pdfPageFormat").setAttribute("data-pdf-listener", "true")

  document.getElementById("pdfOrientation").onchange = updatePreviewDynamically
  document.getElementById("pdfOrientation").setAttribute("data-pdf-listener", "true")
  ;["pdfMarginTop", "pdfMarginRight", "pdfMarginBottom", "pdfMarginLeft", "pdfMarginUnit"].forEach((id) => {
    const element = document.getElementById(id)
    element.oninput = updatePreviewDynamically
    element.onchange = updatePreviewDynamically
    element.onkeyup = updatePreviewDynamically
    element.setAttribute("data-pdf-listener", "true")
  })

  document.getElementById("pdfPasswordProtected").onchange = handlePasswordProtectionChange
  document.getElementById("pdfPasswordProtected").setAttribute("data-pdf-listener", "true")

  document.getElementById("pdfPassword").oninput = updateSecuritySettings
  document.getElementById("pdfPassword").setAttribute("data-pdf-listener", "true")

  document.getElementById("pdfPasswordConfirm").oninput = updateSecuritySettings
  document.getElementById("pdfPasswordConfirm").setAttribute("data-pdf-listener", "true")

  document.getElementById("pdfPasswordToggle").onclick = () =>
    togglePasswordVisibility("pdfPassword", "pdfPasswordToggle")
  document.getElementById("pdfPasswordToggle").setAttribute("data-pdf-listener", "true")

  document.getElementById("pdfPasswordConfirmToggle").onclick = () =>
    togglePasswordVisibility("pdfPasswordConfirm", "pdfPasswordConfirmToggle")
  document.getElementById("pdfPasswordConfirmToggle").setAttribute("data-pdf-listener", "true")

  document.getElementById("pdfDownload").onclick = downloadPDFDirect
  document.getElementById("pdfDownload").setAttribute("data-pdf-listener", "true")

  document.getElementById("pdfPrint").onclick = printPDF
  document.getElementById("pdfPrint").setAttribute("data-pdf-listener", "true")

  document.addEventListener("keydown", handleKeyboardShortcuts)
}

function togglePasswordVisibility(inputId, toggleId) {
  const passwordInput = document.getElementById(inputId)
  const toggleButton = document.getElementById(toggleId)
  const icon = toggleButton.querySelector("i")

  if (passwordInput.type === "password") {
    passwordInput.type = "text"
    icon.className = "fa fa-eye-slash"
    toggleButton.title = "Hide Password"
  } else {
    passwordInput.type = "password"
    icon.className = "fa fa-eye"
    toggleButton.title = "Show Password"
  }
}

// Element reordering functions (functionality preserved, UI hidden)
window.moveElementUp = (elementId, pageIndex) => {
  updateElementOrderInData(elementId, "up", pageIndex)
}

window.moveElementDown = (elementId, pageIndex) => {
  updateElementOrderInData(elementId, "down", pageIndex)
}

window.handleElementSelection = (elementId, pageIndex) => {
  pdfSystemData.selectedElement = { id: elementId, pageIndex: pageIndex }
}

function updateElementOrderInData(elementId, direction, pageIndex) {
  if (!pdfSystemData.elementOrder[pageIndex]) return

  const currentOrder = pdfSystemData.elementOrder[pageIndex]
  const currentIndex = currentOrder.indexOf(elementId)

  if (currentIndex === -1) return

  let newIndex
  if (direction === "up") {
    newIndex = currentIndex - 1
  } else if (direction === "down") {
    newIndex = currentIndex + 1
  }

  if (newIndex < 0 || newIndex >= currentOrder.length) return

  const temp = currentOrder[currentIndex]
  currentOrder[currentIndex] = currentOrder[newIndex]
  currentOrder[newIndex] = temp

  updateOriginalContentOrder(pageIndex)
}

function updateOriginalContentOrder(pageIndex) {
  if (!pdfSystemData.originalContent[pageIndex] || !pdfSystemData.originalContent[pageIndex].elements) return

  const page = pdfSystemData.originalContent[pageIndex]
  const newElementOrder = pdfSystemData.elementOrder[pageIndex]

  const reorderedElements = []
  newElementOrder.forEach((elementId) => {
    const element = page.elements.find((el) => el.id === elementId)
    if (element) {
      reorderedElements.push(element)
    }
  })

  page.elements = reorderedElements
  applyReorderingToEditor()
}

function applyReorderingToEditor() {
  if (!editor || !pdfSystemData.originalContent) return

  try {
    pdfSystemData.originalContent.forEach((page, pageIndex) => {
      if (!page.elements || !pdfSystemData.elementOrder[pageIndex]) return

      const newOrder = pdfSystemData.elementOrder[pageIndex]
      const wrapper = editor.getWrapper()

      newOrder.forEach((elementId, newIndex) => {
        const component = wrapper.find(`#${elementId}`)[0]
        if (component) {
          const parent = component.parent()
          if (parent) {
            const components = parent.components()
            const currentIndex = components.indexOf(component)

            if (currentIndex !== -1 && currentIndex !== newIndex) {
              components.remove(component)
              components.add(component, { at: newIndex })
            }
          }
        }
      })
    })

    console.log("Element reordering applied to editor successfully")
  } catch (error) {
    console.error("Error applying reordering to editor:", error)
  }
}

function handlePasswordProtectionChange() {
  const isProtected = document.getElementById("pdfPasswordProtected").checked
  pdfSystemData.settings.security.passwordProtected = isProtected
  togglePasswordOptions()
}

function togglePasswordOptions() {
  const isProtected = document.getElementById("pdfPasswordProtected").checked
  const passwordOptions = document.getElementById("pdfPasswordOptions")
  passwordOptions.style.display = isProtected ? "block" : "none"
}

function updateSecuritySettings() {
  pdfSystemData.settings.security.password = document.getElementById("pdfPassword").value
}

function validatePassword() {
  const password = document.getElementById("pdfPassword").value
  const confirmPassword = document.getElementById("pdfPasswordConfirm").value

  if (pdfSystemData.settings.security.passwordProtected) {
    if (!password) {
      alert("Password is required for password-protected PDF")
      return false
    }
    if (password !== confirmPassword) {
      alert("Passwords do not match")
      return false
    }
    if (password.length < 4) {
      alert("Password must be at least 4 characters long")
      return false
    }
  }
  return true
}

async function downloadPDFDirect() {
  if (!validatePassword()) {
    return
  }

  try {
    const pagesToInclude = getSelectedPages()

    if (pagesToInclude.length === 0) {
      alert("No pages selected for download")
      return
    }

    const downloadBtn = document.getElementById("pdfDownload")
    const originalText = downloadBtn.textContent
    downloadBtn.textContent = "Generating PDF..."
    downloadBtn.disabled = true

    const filteredContent = createFilteredContent(pagesToInclude)
    const contentWithImages = await captureExternalComponentsAsImages(filteredContent)

    if (pdfSystemData.settings.security.passwordProtected) {
      await generateAndEncryptPDFWithBackend(contentWithImages)
    } else {
      await generatePDFWithLibraries(contentWithImages)
    }

    downloadBtn.textContent = originalText
    downloadBtn.disabled = false
  } catch (error) {
    console.error("Error generating PDF:", error)
    alert("Error generating PDF. Please try again.")

    const downloadBtn = document.getElementById("pdfDownload")
    downloadBtn.textContent = "⬇ Download PDF"
    downloadBtn.disabled = false
  }
}

function getSelectedPages() {
  return Array.from({ length: pdfSystemData.totalPages }, (_, i) => i)
}

function createFilteredContent(pagesToInclude) {
  return pdfSystemData.currentContent
}

async function generateAndEncryptPDFWithBackend(htmlContent) {
  try {
    const tempPdfBlob = await generateTempPDFBlob(htmlContent)

    const formData = new FormData()
    formData.append("pdf", tempPdfBlob, "temp.pdf")
    formData.append("password", pdfSystemData.settings.security.password)

    const response = await fetch(`${BACKEND_URL}/encrypt-pdf`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      throw new Error(errorData.message || `Server error: ${response.status}`)
    }

    const encryptedBlob = await response.blob()
    const url = URL.createObjectURL(encryptedBlob)
    const a = document.createElement("a")
    a.href = url
    a.download = `encrypted-report-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Error with backend encryption:", error)
    alert(`Error encrypting PDF: ${error.message}. Downloading without encryption.`)
    await generatePDFWithLibraries(htmlContent)
  }
}

async function generateTempPDFBlob(htmlContent) {
  const tempContainer = document.createElement("div")
  tempContainer.style.position = "absolute"
  tempContainer.style.left = "-9999px"
  tempContainer.style.top = "0"

  const format = pdfSystemData.settings.pageFormat
  const orientation = pdfSystemData.settings.orientation
  const dimensions = {
    a4: { width: 210, height: 297 },
    a3: { width: 297, height: 420 },
    a2: { width: 420, height: 594 },
    letter: { width: 216, height: 279 },
    legal: { width: 216, height: 356 },
    tabloid: { width: 279, height: 432 },
  }

  const dim = dimensions[format] || dimensions["a4"]
  const containerWidth = orientation === "landscape" ? dim.height : dim.width
  const containerHeight = orientation === "landscape" ? dim.width : dim.height

  tempContainer.style.width = `${containerWidth}mm`
  tempContainer.style.height = `${containerHeight}mm`
  tempContainer.style.background = "white"
  tempContainer.innerHTML = htmlContent
  document.body.appendChild(tempContainer)

  try {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const charts = tempContainer.querySelectorAll(".chart-container, canvas, iframe")
    charts.forEach((chart) => {
      chart.style.display = "block"
      chart.style.visibility = "visible"
    })

    const { html2canvas } = window
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: tempContainer.scrollWidth,
      height: tempContainer.scrollHeight,
      onclone: (clonedDoc) => {
        const clonedCharts = clonedDoc.querySelectorAll(".chart-container, canvas, iframe, .external-component")
        clonedCharts.forEach((el) => {
          el.style.display = "block"
          el.style.visibility = "visible"
        })
      },
    })

    const { jsPDF } = window.jspdf
    const pdfFormat = pdfSystemData.settings.pageFormat.toUpperCase()
    const pdfOrientation = pdfSystemData.settings.orientation

    const pdf = new jsPDF({
      orientation: pdfOrientation,
      unit: "mm",
      format: pdfFormat,
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    const margins = pdfSystemData.settings.margins
    const imgWidth = pageWidth - (margins.left + margins.right)
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    const imgData = canvas.toDataURL("image/png")
    pdf.addImage(imgData, "PNG", margins.left, margins.top, imgWidth, imgHeight)

    return pdf.output("blob")
  } finally {
    document.body.removeChild(tempContainer)
  }
}

async function generatePDFWithLibraries(htmlContent) {
  const tempContainer = document.createElement("div")
  tempContainer.style.position = "absolute"
  tempContainer.style.left = "-9999px"
  tempContainer.style.top = "0"

  const format = pdfSystemData.settings.pageFormat
  const orientation = pdfSystemData.settings.orientation
  const dimensions = {
    a4: { width: 210, height: 297 },
    a3: { width: 297, height: 420 },
    a2: { width: 420, height: 594 },
    letter: { width: 216, height: 279 },
    legal: { width: 216, height: 356 },
    tabloid: { width: 279, height: 432 },
  }

  const dim = dimensions[format] || dimensions["a4"]
  const containerWidth = orientation === "landscape" ? dim.height : dim.width
  const containerHeight = orientation === "landscape" ? dim.width : dim.height

  tempContainer.style.width = `${containerWidth}mm`
  tempContainer.style.height = `${containerHeight}mm`
  tempContainer.style.background = "white"
  tempContainer.innerHTML = htmlContent
  document.body.appendChild(tempContainer)

  try {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const charts = tempContainer.querySelectorAll(".chart-container, canvas, iframe")
    charts.forEach((chart) => {
      chart.style.display = "block"
      chart.style.visibility = "visible"
    })

    const { html2canvas } = window
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: tempContainer.scrollWidth,
      height: tempContainer.scrollHeight,
      onclone: (clonedDoc) => {
        const clonedCharts = clonedDoc.querySelectorAll(".chart-container, canvas, iframe, .external-component")
        clonedCharts.forEach((el) => {
          el.style.display = "block"
          el.style.visibility = "visible"
        })
      },
    })

    const { jsPDF } = window.jspdf
    const pdfFormat = pdfSystemData.settings.pageFormat.toUpperCase()
    const pdfOrientation = pdfSystemData.settings.orientation

    const pdf = new jsPDF({
      orientation: pdfOrientation,
      unit: "mm",
      format: pdfFormat,
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    const margins = pdfSystemData.settings.margins
    const imgWidth = pageWidth - (margins.left + margins.right)
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    const imgData = canvas.toDataURL("image/png")
    pdf.addImage(imgData, "PNG", margins.left, margins.top, imgWidth, imgHeight)

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-")
    const filename = `report-${timestamp}.pdf`
    pdf.save(filename)
  } finally {
    document.body.removeChild(tempContainer)
  }
}

function navigatePage(direction) {
  const newPage = pdfSystemData.currentPage + direction
  if (newPage >= 1 && newPage <= pdfSystemData.totalPages) {
    pdfSystemData.currentPage = newPage
    scrollToPage(newPage)
    updatePreviewUI()
  }
}

function goToPage() {
  const pageInput = document.getElementById("pdfCurrentPage")
  const page = Number.parseInt(pageInput.value)
  if (page >= 1 && page <= pdfSystemData.totalPages) {
    pdfSystemData.currentPage = page
    scrollToPage(page)
    updatePreviewUI()
  } else {
    pageInput.value = pdfSystemData.currentPage
  }
}

function scrollToPage(pageNumber) {
  const iframe = document.querySelector(".pdf-preview-iframe")
  if (iframe && iframe.contentDocument) {
    const page = iframe.contentDocument.querySelector(`[data-page="${pageNumber}"]`)
    if (page) {
      page.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }
}

function toggleSettings() {
  const panel = document.getElementById("pdfSettingsPanel")
  panel.style.display = panel.style.display === "none" ? "block" : "none"
  
  // FIXED: Recalculate positioning when settings panel is toggled
  setTimeout(() => {
    const previewContent = document.getElementById("pdfPreviewContent")
    const dimensions = getExactPDFDimensions()
    applyDynamicPositioning(previewContent, dimensions)
  }, 100)
}

// FIXED: Enhanced real-time preview update function with accurate dimensions and positioning
function updatePreviewDynamically() {
  updateSettingsFromUI()

  const fullContent = prepareEnhancedHTMLContent(pdfSystemData.originalContent)
  pdfSystemData.currentContent = fullContent

  const iframe = document.querySelector(".pdf-preview-iframe")
  const previewContent = document.getElementById("pdfPreviewContent")

  if (iframe && previewContent) {
    // FIXED: Update container dimensions and positioning when format/orientation changes
    const dimensions = getExactPDFDimensions()
    previewContent.style.width = dimensions.width + "px"
    previewContent.style.height = dimensions.height + "px"
    previewContent.style.minWidth = dimensions.width + "px"
    previewContent.style.minHeight = dimensions.height + "px"

    // FIXED: Reapply dynamic positioning for new dimensions
    applyDynamicPositioning(previewContent, dimensions)

    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
      iframeDoc.open()
      iframeDoc.write(fullContent)
      iframeDoc.close()

      // Check for content overflow after update
      setTimeout(() => checkContentOverflow(iframe), 1000)
    } catch (error) {
      console.error("Error updating preview:", error)
    }
  }
}

function updateSettingsFromUI() {
  pdfSystemData.settings.pageFormat = document.getElementById("pdfPageFormat").value
  pdfSystemData.settings.orientation = document.getElementById("pdfOrientation").value

  pdfSystemData.settings.margins.top = Number.parseFloat(document.getElementById("pdfMarginTop").value) || 0
  pdfSystemData.settings.margins.right = Number.parseFloat(document.getElementById("pdfMarginRight").value) || 0
  pdfSystemData.settings.margins.bottom = Number.parseFloat(document.getElementById("pdfMarginBottom").value) || 0
  pdfSystemData.settings.margins.left = Number.parseFloat(document.getElementById("pdfMarginLeft").value) || 0
  pdfSystemData.settings.margins.unit = document.getElementById("pdfMarginUnit").value

  updateSecuritySettings()
}

function applySettings() {
  updatePreviewDynamically()
  document.getElementById("pdfSettingsPanel").style.display = "none"
}

function resetSettings() {
  pdfSystemData.settings = {
    pageFormat: "a4",
    orientation: "portrait",
    margins: { top: 0, right: 0, bottom: 0, left: 0, unit: "mm" },
    watermark: {
      type: "none",
      text: "",
      image: null,
      fontSize: 48,
      color: "#cccccc",
      opacity: 0.3,
      position: "center",
      rotation: 0,
    },
    pageSelection: "all",
    customPages: "",
    security: {
      passwordProtected: false,
      password: "",
      permissions: {
        print: true,
        copy: true,
        modify: true,
        annotate: true,
      },
    },
  }

  updatePreviewUI()
  updatePreviewDynamically()
}

function printPDF() {
  const iframe = document.querySelector(".pdf-preview-iframe")
  if (iframe && iframe.contentWindow) {
    iframe.contentWindow.print()
  }
}

function handleKeyboardShortcuts(event) {
  if (document.getElementById("pdfPreviewModal").style.display !== "flex") return

  switch (event.key) {
    case "Escape":
      closePDFPreview()
      break
    case "ArrowLeft":
      if (event.ctrlKey) {
        navigatePage(-1)
        event.preventDefault()
      }
      break
    case "ArrowRight":
      if (event.ctrlKey) {
        navigatePage(1)
        event.preventDefault()
      }
      break
    case "f":
      if (event.ctrlKey) {
        toggleSearch()
        event.preventDefault()
      }
      break
    case "p":
      if (event.ctrlKey) {
        printPDF()
        event.preventDefault()
      }
      break
  }
}

function closePDFPreview() {
  const modal = document.getElementById("pdfPreviewModal")
  modal.style.display = "none"

  applyReorderingToEditor()
  document.getElementById("pdfSettingsPanel").style.display = "none"
}

document.addEventListener("DOMContentLoaded", () => {
  initializePDFSystem()
})

window.generateAdvancedPDF = generateAdvancedPDF

// Preserve all existing functionality
var singlePageData = JSON.parse(localStorage.getItem("single-page"))
editor.setComponents(singlePageData)

var pageName = "index"
function savePage() {
  editor.Modal.setTitle("Add Page Name")
  editor.Modal.setContent(`<div class="new-table-form">
  <div> 
      <input type="text" class="form-control class="popupaddbtn"" value="" placeholder="Enter page name" style="width:95%"  name="singleSavePageName" id="singleSavePageName">
  </div>  
  <input id="saveSinglePage" type="button" value="Add" class="popupaddbtn" data-component-id="c1006">
  </div>
  </div>
  `)
  editor.Modal.open()
  var el = document.getElementById("saveSinglePage")
  el.addEventListener("click", downloadPage, true)
}

function downloadPage() {
  const pageName = document.getElementById("singleSavePageName").value
  if (!pageName) {
    alert("Page name required")
    return false
  }

  const html = editor.getHtml()
  const css = editor.getCss()
  const components = editor.getComponents()
  const style = editor.getStyle()

  const pageData = {
    html,
    css,
    components: components.toJSON(),
    style: style.toJSON(),
    traits: {},
  }

  editor
    .getWrapper()
    .find("[data-i_designer-type]")
    .forEach((comp) => {
      console.log(comp.cid, "comp.cid")
      console.log(comp.getTraits(), "comp.cid")
      pageData.traits[comp.cid] = comp.getTraits().map((trait) => ({
        name: trait.attributes.name,
        value: trait.get("value"),
      }))
    })

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(pageData))
  const downloadAnchorNode = document.createElement("a")
  downloadAnchorNode.setAttribute("href", dataStr)
  downloadAnchorNode.setAttribute("download", pageName + ".json")
  document.body.appendChild(downloadAnchorNode)
  downloadAnchorNode.click()
  downloadAnchorNode.remove()
  editor.Modal.close()
}

function viewAllPage() {
  var htmlContent = editor.getHtml()
  var cssContent = editor.getCss()
  htmlContent = "<html><head><style>" + cssContent + "</style></head>" + htmlContent + "</html>"
  var getallpage = localStorage.getItem("all-page")
  var allpage = JSON.parse(getallpage)
  for (var i = 0; i < allpage.length; i++) {
    if (allpage[i].name === singlePageData.name) {
      allpage.splice(
        allpage.findIndex((a) => a.name === singlePageData.name),
        1,
      )
      allpage.push({
        name: singlePageData.name,
        data: htmlContent,
      })
      localStorage.setItem("all-page", JSON.stringify(allpage))
      window.location.replace("page.html")
    }
  }
}

function importSinglePages() {
  editor.Modal.setTitle("Add Pages From JSON")

  const container = document.createElement("div")
  container.className = "new-table-form"

  const fileInput = document.createElement("input")
  fileInput.type = "file"
  fileInput.className = "form-control popupinput2"
  fileInput.style.width = "95%"
  fileInput.accept = "application/json"
  fileInput.multiple = true
  fileInput.id = "importMultiplePageInput"

  const addButton = document.createElement("input")
  addButton.type = "button"
  addButton.value = "Add"
  addButton.className = "popupaddbtn"
  addButton.id = "import-multiple-file"

  container.appendChild(fileInput)
  container.appendChild(addButton)

  editor.Modal.setContent("")
  editor.Modal.setContent(container)
  editor.Modal.open()

  addButton.addEventListener("click", importMultipleFiles, true)
}

function importMultipleFiles() {
  const input = document.getElementById("importMultiplePageInput")
  const files = Array.from(input.files)

  if (!files.length) {
    alert("No files selected")
    return
  }

  files.forEach((file) => {
    const reader = new FileReader()

    reader.onload = (e) => {
      try {
        const pageData = JSON.parse(e.target.result)

        const wrapper = editor.getWrapper()
        const container = wrapper.append(`<div class="imported-page" data-filename="${file.name}"></div>`)[0]

        container.components(pageData.html)
        editor.addStyle(pageData.css)

        for (const cid in pageData.traits) {
          if (pageData.traits.hasOwnProperty(cid)) {
            const comp = wrapper.find(`#${cid}`)[0]
            if (comp) {
              pageData.traits[cid].forEach((traitData) => {
                const trait = comp.getTrait(traitData.name)
                if (trait) {
                  trait.set("value", traitData.value)
                }
              })
            }
          }
        }
      } catch (err) {
        console.error(`Error parsing JSON from file ${file.name}:`, err)
        alert(`Invalid JSON in file: ${file.name}`)
      }
    }

    reader.readAsText(file)
  })

  editor.Modal.close()
}

function updateComponentsWithNewJson(editor) {
  var jsonDataString = localStorage.getItem("common_json")
  var jsonData = [JSON.parse(jsonDataString)]
  let custom_language = localStorage.getItem("language")
  var jsonData2 = jsonData
  var styleTags2 = editor.getCss()
  var jsonDataNew = {}
  var styleContent = styleTags2
  var regex = /#(\w+)\s*{\s*[^{}]*my-input-json:\s*([^;]+)\s*;[^{}]*}/g
  var matches
  while ((matches = regex.exec(styleContent)) !== null) {
    var divId = matches[1]
    var jsonKey = matches[2]
    var lang = jsonKey
    jsonDataNew[divId] = lang
  }
  if (custom_language === null) {
    custom_language = "english"
  }
  const updateDivContenthtml = editor.getHtml()
  for (var divIdLocal in jsonDataNew) {
    var jsonKey2 = jsonDataNew[divIdLocal]
    const str = "jsonData2[0]." + custom_language + "." + jsonKey2
    var value = eval(str)
    if (divIdLocal && value) {
      var parser = new DOMParser()
      var doc = parser.parseFromString(updateDivContenthtml, "text/html")
      var myDiv = doc.getElementById(divIdLocal)
      if (myDiv) {
        myDiv.textContent = value
        var component = editor.getWrapper().find(`#${divIdLocal}`)[0]
        if (component) {
          component.components(value)
        }
      }
    }
  }
}

let slides = []
let transitions = {}
let clickStates = {}
let currentSlideIndex = 1

editor.on("run:core:canvas-clear", () => {
  const thumbContainer = document.getElementById("slides-thumbnails")
  if (thumbContainer) thumbContainer.remove()
  slides = []
  transitions = {}
  clickStates = {}
  currentSlideIndex = 1
})

const toggleSearch = () => {
  alert("Search toggled")
}