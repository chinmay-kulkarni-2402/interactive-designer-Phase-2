
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

// // Initialize the page manager after editor is loaded
let pageManager = null
let pageSetupManager = null

// editor.on("load", () => {
//   // Safely attempt to get page manager plugin
//   pageManager = editor.Plugins?.get?.("page-manager-component")

//   // Initialize Page Setup Manager
//   pageSetupManager = new PageSetupManager(editor)

//   // Show initial setup modal on first load with a slight delay to ensure DOM is ready
//   setTimeout(() => {
//     if (pageSetupManager && !pageSetupManager.isPageManagerInitialized()) {
//       pageSetupManager.showInitialSetup()
//     }
//   }, 500)
// })

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
    {
      id: "filterTable",
      attributes: { title: "Report Parameter", id: "filterTable" },
      className: "fa fa-search",
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
var filterBtn = document.getElementById("filterTable");
let filtersEnabled = false;
const activeFilters = new Map(); // Store active filters per table & column
filterBtn.addEventListener("click", () => {
  const canvasDoc = editor.Canvas.getDocument();
  const tables = canvasDoc.querySelectorAll('table');
  if (!tables.length) {
    alert('No table found in the canvas!');
    return;
  }
  if (!filtersEnabled) {
    tables.forEach((table, tableIndex) => {
      const headers = table.querySelectorAll('th');
      headers.forEach((th, colIndex) => {
        if (th.querySelector('.filter-icon')) return;
        const icon = document.createElement('i');
        icon.className = 'filter-icon fa fa-search';
        icon.style.cssText = 'cursor:pointer;position:absolute;right:15px;top:50%;transform:translateY(-50%);';
        icon.onclick = () => {
          showFilterModal(th.innerText.trim(), table, colIndex, tableIndex);
        };
        th.style.position = 'relative';
        th.appendChild(icon);
      });
    });
    filtersEnabled = true;
  } else {
    // Disable all filters & reset
    tables.forEach((table, tableIndex) => {
      table.querySelectorAll('th .filter-icon').forEach(i => i.remove());
      table.querySelectorAll('tbody tr').forEach(row => {
        row.style.display = '';
      });
    });
    activeFilters.clear();
    removeModal();
    filtersEnabled = false;
  }
}, true);
function showFilterModal(columnName, table, colIndex, tableIndex) {
  removeModal(); // remove existing modal if any
  const modal = document.createElement('div');
  modal.id = 'filterModal';
  modal.style.cssText = `
    position: fixed;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border: 1px solid #ccc;
    padding: 20px;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    min-width: 298px;
    border-radius: 8px;
  `;
  // Get clean column name (remove any existing filter icons)
  const cleanColumnName = columnName;
  modal.innerHTML = `
    <h3 style="margin-top:0">Report Parameter</h3>
    <p style="margin: 10px 0;">${cleanColumnName}</p>
    <input type="text" id="filterValue" placeholder="Search..." style="width: 100%; padding: 5px; margin-bottom: 15px;">
    <div style="text-align: right;">
      <button id="filterOK" style="margin-right: 10px;">OK</button>
      <button id="filterCancel">Cancel</button>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('filterOK').onclick = () => {
    const value = document.getElementById('filterValue').value.trim().toLowerCase();
    const key = `${tableIndex}-${colIndex}`;
    if (value) {
      activeFilters.set(key, { value, table, colIndex });
    } else {
      activeFilters.delete(key);
    }
    applyAllFilters();
    removeModal();
  };
  document.getElementById('filterCancel').onclick = removeModal;
}
function removeModal() {
  const modal = document.getElementById('filterModal');
  if (modal) modal.remove();
}
function applyAllFilters() {
  // Reset all rows first
  const tableGroups = new Map();
  activeFilters.forEach(({ table, colIndex }) => {
    const rows = table.querySelectorAll('tbody tr');
    tableGroups.set(table, rows);
  });
  tableGroups.forEach((rows, table) => {
    rows.forEach(row => {
      row.style.display = ''; // Reset display
    });
  });
  // Apply filters cumulatively
  activeFilters.forEach(({ value, table, colIndex }) => {
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
      const cell = row.children[colIndex];
      const text = cell?.textContent.toLowerCase() || '';
      if (!text.includes(value)) {
        row.style.display = 'none';
      }
    });
  });
}
// ENHANCED: Smart PDF System with Intelligent Text/Image Separation
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
                        <button id="pdfPrint" class="pdf-btn pdf-btn-primary">⬇ Download PDF</button>
                        
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
            
            .pdf-preview-content {
                background: white;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                border-radius: 4px;
                overflow: hidden;
                position: relative;
                border: 2px solid #007bff;
                display: flex;
                flex-direction: column;
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

            /* Enhanced selectable text styles */
            .pdf-text-selectable {
                user-select: text !important;
                -webkit-user-select: text !important;
                -moz-user-select: text !important;
                -ms-user-select: text !important;
                cursor: text !important;
            }

            .pdf-image-component {
                user-select: none !important;
                -webkit-user-select: none !important;
                -moz-user-select: none !important;
                -ms-user-select: none !important;
                pointer-events: none;
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

// ENHANCED: Smart Component Classifier using GrapesJS Component Data
const SmartComponentClassifier = {
  // Components that should be rendered as images (complex/interactive)
  IMAGE_COMPONENT_TYPES: [
    "canvas",
    "chart",
    "chart-container",
    "highcharts-container",
    "google-map",
    "api-component",
    "external-component",
    "carousel",
    "video",
    "video-container",
    "interactive-element",
    "custom-widget",
    "countdown-component",
    "typed-component",
    "dataTables_wrapper",
    "complex-table",
    "iframe",
  ],

  // Components that should remain as selectable text/HTML
  TEXT_COMPONENT_TYPES: [
    "text",
    "textnode",
    "default",
    "wrapper",
    "row",
    "cell",
    "column",
    "container",
    "section",
    "div",
    "span",
    "paragraph",
    "heading",
    "list",
    "list-item",
    "link",
    "button",
  ],

  // Simple components that can remain as HTML
  SIMPLE_COMPONENT_TYPES: ["image", "img", "table", "tbody", "thead", "tr", "td", "th"],

  classifyGrapesJSComponent(component) {
    const componentType = component.get("type") || "default"
    const tagName = component.get("tagName") || "div"
    const classes = component.getClasses()
    const attributes = component.getAttributes()

    // Check for image components first
    if (this.IMAGE_COMPONENT_TYPES.includes(componentType)) {
      return "image"
    }

    // Check for class-based identification
    const hasImageClasses = classes.some((cls) =>
      [
        "chart",
        "api",
        "external",
        "carousel",
        "video",
        "interactive",
        "widget",
        "countdown",
        "typed",
        "dataTables",
      ].some((keyword) => cls.toLowerCase().includes(keyword)),
    )

    if (hasImageClasses) {
      return "image"
    }

    // Check for iframe or canvas elements
    if (["iframe", "canvas", "video"].includes(tagName.toLowerCase())) {
      return "image"
    }

    // Check for simple components
    if (
      this.SIMPLE_COMPONENT_TYPES.includes(componentType) ||
      ["img", "table", "tbody", "thead", "tr", "td", "th"].includes(tagName.toLowerCase())
    ) {
      return "simple"
    }

    // Check for text components
    if (
      this.TEXT_COMPONENT_TYPES.includes(componentType) ||
      ["p", "h1", "h2", "h3", "h4", "h5", "h6", "span", "div", "ul", "ol", "li", "a", "button"].includes(
        tagName.toLowerCase(),
      )
    ) {
      return "text"
    }

    // Check for complex styling that might not render correctly
    const styles = component.getStyle()
    if (this.hasComplexStyling(styles)) {
      return "image"
    }

    // Default to text for unknown components
    return "text"
  },

  hasComplexStyling(styles) {
    const complexProperties = ["transform", "animation", "transition", "filter", "backdrop-filter", "clip-path", "mask"]
    return complexProperties.some((prop) => styles[prop] && styles[prop] !== "none" && styles[prop] !== "initial")
  },
}

// ENHANCED: Main PDF generation function using editor data
function generateAdvancedPDF() {
  initializePDFSystem()

  try {
    // Get all editor data
    const editorHTML = editor.getHtml()
    const editorCSS = editor.getCss()
    const editorComponents = editor.getComponents()
    const editorStyles = editor.getStyle()

    console.log("Editor HTML:", editorHTML)
    console.log("Editor CSS:", editorCSS)
    console.log("Editor Components:", editorComponents)
    console.log("Editor Styles:", editorStyles)

    // Process the editor data
    processEditorDataForPDF(editorHTML, editorCSS, editorComponents, editorStyles)
  } catch (error) {
    console.error("Error generating PDF:", error)
    alert("Error generating PDF. Please try again.")
  }
}

// ENHANCED: Process editor data for smart PDF generation
function processEditorDataForPDF(html, css, components, styles) {
  try {
    // Analyze components for intelligent classification
    const componentAnalysis = analyzeGrapesJSComponents(components)

    // Create enhanced content structure
    const contentStructure = {
      html: html,
      css: css,
      components: componentAnalysis,
      styles: styles ? styles.toJSON() : [],
      metadata: {
        totalComponents: componentAnalysis.length,
        textComponents: componentAnalysis.filter((c) => c.classification === "text").length,
        imageComponents: componentAnalysis.filter((c) => c.classification === "image").length,
        simpleComponents: componentAnalysis.filter((c) => c.classification === "simple").length,
      },
    }

    console.log("Content Structure:", contentStructure)

    // Process content for preview
    processContentForSmartPreview(contentStructure)
  } catch (error) {
    console.error("Error processing editor data:", error)
    alert("Error processing content. Please try again.")
  }
}

// ENHANCED: Analyze GrapesJS components for intelligent classification
function analyzeGrapesJSComponents(components) {
  const componentAnalysis = []

  function analyzeComponent(component, parentPath = "") {
    const componentId = component.getId() || component.cid
    const componentType = component.get("type") || "default"
    const tagName = component.get("tagName") || "div"
    const classes = component.getClasses()
    const content = component.get("content") || ""
    const attributes = component.getAttributes()
    const styles = component.getStyle()

    // Classify the component
    const classification = SmartComponentClassifier.classifyGrapesJSComponent(component)

    const analysis = {
      id: componentId,
      type: componentType,
      tagName: tagName,
      classes: classes,
      content: content,
      attributes: attributes,
      styles: styles,
      classification: classification,
      path: parentPath ? `${parentPath}/${componentId}` : componentId,
      hasChildren: component.components().length > 0,
      children: [],
    }

    // Recursively analyze child components
    component.components().forEach((child, index) => {
      const childAnalysis = analyzeComponent(child, analysis.path)
      analysis.children.push(childAnalysis)
    })

    componentAnalysis.push(analysis)
    return analysis
  }

  // Analyze all root components
  components.forEach((component) => {
    analyzeComponent(component)
  })

  return componentAnalysis
}

// ENHANCED: Process content for smart preview with hybrid approach
function processContentForSmartPreview(contentStructure) {
  pdfSystemData.originalContent = contentStructure
  pdfSystemData.totalPages = 1
  pdfSystemData.currentPage = 1

  // Create hybrid HTML content
  const hybridContent = createHybridHTMLContent(contentStructure)
  pdfSystemData.currentContent = hybridContent

  showEnhancedPDFPreview()
}

// ENHANCED: Create hybrid HTML content with smart text/image separation
function createHybridHTMLContent(contentStructure) {
  const { html, css, components, styles } = contentStructure

  // Enhanced CSS with text selection support and exact editor styles
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
        margin: 0 !important;
        padding: 0 !important;
        position: relative;
        overflow: hidden;
        height: 100vh;
        width: 100vw;
      }

      /* Enhanced text selection styles */
      .pdf-text-selectable {
        user-select: text !important;
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        cursor: text !important;
      }

      .pdf-text-selectable p,
      .pdf-text-selectable h1,
      .pdf-text-selectable h2,
      .pdf-text-selectable h3,
      .pdf-text-selectable h4,
      .pdf-text-selectable h5,
      .pdf-text-selectable h6,
      .pdf-text-selectable span,
      .pdf-text-selectable div,
      .pdf-text-selectable td,
      .pdf-text-selectable th,
      .pdf-text-selectable li,
      .pdf-text-selectable a,
      .pdf-text-selectable button {
        user-select: text !important;
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
      }

      .pdf-image-component {
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        pointer-events: none;
      }

      /* Preserve exact editor styles */
      ${css}
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

  // Process HTML content with smart classification
  const processedHTML = processHTMLWithSmartClassification(html, components)

  const contentInitialization = `
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() {
          // Initialize components and handle smart content
          console.log('Smart PDF content initialized');
          
          // Mark text elements as selectable
          document.querySelectorAll('.pdf-text-selectable').forEach(el => {
            el.style.userSelect = 'text';
            el.style.webkitUserSelect = 'text';
            el.style.cursor = 'text';
          });
          
          // Mark image elements as non-selectable
          document.querySelectorAll('.pdf-image-component').forEach(el => {
            el.style.userSelect = 'none';
            el.style.webkitUserSelect = 'none';
            el.style.pointerEvents = 'none';
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
      <title>Smart PDF Preview</title>
      ${styleLinks}
      ${enhancedCSS}
    </head>
    <body>
      <div class="pdf-page" data-page="1">
        ${processedHTML}
      </div>
      ${scriptTags}
      ${contentInitialization}
    </body>
    </html>
  `

  return htmlContent
}

// ENHANCED: Process HTML with smart classification based on component analysis
function processHTMLWithSmartClassification(html, componentAnalysis) {
  const processedHTML = html

  // Create a temporary DOM to work with
  const tempDiv = document.createElement("div")
  tempDiv.innerHTML = processedHTML

  // Apply smart classification to elements
  function applyClassificationToElement(element, analysis) {
    if (!element || !analysis) return

    const elementId = element.id
    const componentData = findComponentById(analysis, elementId)

    if (componentData) {
      // Apply classification based on component analysis
      if (componentData.classification === "text") {
        element.classList.add("pdf-text-selectable")
        // Ensure all child text elements are also selectable
        const textChildren = element.querySelectorAll("p, h1, h2, h3, h4, h5, h6, span, div, td, th, li, a, button")
        textChildren.forEach((child) => {
          child.classList.add("pdf-text-selectable")
        })
      } else if (componentData.classification === "image") {
        element.classList.add("pdf-image-component")
        element.setAttribute("data-convert-to-image", "true")
      } else if (componentData.classification === "simple") {
        element.classList.add("pdf-text-selectable")
      }

      // Add metadata for processing
      element.setAttribute("data-component-type", componentData.type)
      element.setAttribute("data-classification", componentData.classification)
    }

    // Process child elements
    Array.from(element.children).forEach((child) => {
      applyClassificationToElement(child, analysis)
    })
  }

  // Apply classification to all elements
  Array.from(tempDiv.children).forEach((element) => {
    applyClassificationToElement(element, componentAnalysis)
  })

  return tempDiv.innerHTML
}

// Helper function to find component by ID in analysis
function findComponentById(analysis, id) {
  for (const component of analysis) {
    if (component.id === id) {
      return component
    }
    // Search in children recursively
    const found = findComponentInChildren(component.children, id)
    if (found) {
      return found
    }
  }
  return null
}

function findComponentInChildren(children, id) {
  for (const child of children) {
    if (child.id === id) {
      return child
    }
    const found = findComponentInChildren(child.children, id)
    if (found) {
      return found
    }
  }
  return null
}

function getExactPDFDimensions() {
  // Use Page Setup Manager settings if available
  if (pageSetupManager && pageSetupManager.isPageManagerInitialized()) {
    const pageSettings = pageSetupManager.getPageSettings()
    const width = pageSettings.width
    const height = pageSettings.height

    const mmToPx = 96 / 25.4

    return {
      width: Math.round(width * mmToPx),
      height: Math.round(height * mmToPx),
      actualWidth: Math.round(width * mmToPx),
      actualHeight: Math.round(height * mmToPx),
      mmToPxRatio: mmToPx,
    }
  }

  // Fallback to existing logic
  const format = pdfSystemData.settings.pageFormat
  const orientation = pdfSystemData.settings.orientation

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

  const mmToPx = 96 / 25.4

  width = Math.round(width * mmToPx)
  height = Math.round(height * mmToPx)

  return {
    width: width,
    height: height,
    actualWidth: width,
    actualHeight: height,
    mmToPxRatio: mmToPx,
  }
}

// Enhanced function to apply dynamic positioning based on PDF format and orientation
function applyDynamicPositioning(previewContent, dimensions) {
  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  // Get the available space in the preview container (accounting for toolbar and settings panel)
  const toolbar = document.querySelector(".pdf-toolbar")
  const settingsPanel = document.querySelector(".pdf-settings-panel")
  const toolbarHeight = toolbar ? toolbar.offsetHeight : 60
  const settingsPanelWidth = settingsPanel && settingsPanel.style.display !== "none" ? settingsPanel.offsetWidth : 0

  // Calculate available space with minimal padding
  const availableWidth = viewportWidth - settingsPanelWidth - 20
  const availableHeight = viewportHeight - toolbarHeight - 20

  // Calculate scale factor to maximize content size while maintaining aspect ratio
  const scaleX = availableWidth / dimensions.width
  const scaleY = availableHeight / dimensions.height

  const scale = Math.min(scaleX, scaleY)

  // Calculate final dimensions after scaling
  const finalWidth = dimensions.width * scale
  const finalHeight = dimensions.height * scale

  // Calculate dynamic margins for centering with minimal spacing
  const horizontalMargin = Math.max(0, (availableWidth - finalWidth) / 2)
  const verticalMargin = Math.max(0, (availableHeight - finalHeight) / 2)

  // Apply dynamic positioning and scaling
  previewContent.style.transform = `scale(${scale})`
  previewContent.style.transformOrigin = "top left"

  // Apply minimal margins to reduce empty space
  previewContent.style.marginTop = Math.max(5, verticalMargin) + "px"
  previewContent.style.marginLeft = Math.max(5, horizontalMargin) + "px"
  previewContent.style.marginRight = "0px"
  previewContent.style.marginBottom = "0px"

  // Update the content wrapper to handle the scaled content properly
  const contentWrapper = previewContent.parentElement
  if (contentWrapper) {
    contentWrapper.style.justifyContent = "flex-start"
    contentWrapper.style.alignItems = "flex-start"
    contentWrapper.style.padding = "0"
    contentWrapper.style.overflow = "auto"
  }
}

function showEnhancedPDFPreview() {
  const modal = document.getElementById("pdfPreviewModal")
  const previewContent = document.getElementById("pdfPreviewContent")

  modal.style.display = "flex"

  // Create iframe with exact PDF page dimensions
  const iframe = document.createElement("iframe")
  iframe.className = "pdf-preview-iframe"

  // Calculate exact PDF dimensions and apply dynamic positioning
  const dimensions = getExactPDFDimensions()

  // Set the preview content container to exact PDF page size
  previewContent.style.width = dimensions.width + "px"
  previewContent.style.height = dimensions.height + "px"
  previewContent.style.maxWidth = "none"
  previewContent.style.maxHeight = "none"
  previewContent.style.minWidth = dimensions.width + "px"
  previewContent.style.minHeight = dimensions.height + "px"

  // Apply dynamic positioning based on PDF dimensions and viewport
  applyDynamicPositioning(previewContent, dimensions)

  // Clear loading content and add iframe
  previewContent.innerHTML = ""
  previewContent.appendChild(iframe)

  // Write content to iframe with proper error handling
  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
    iframeDoc.open()
    iframeDoc.write(pdfSystemData.currentContent)
    iframeDoc.close()

    // Wait for content to load then update UI
    iframe.onload = () => {
      updatePreviewUI()
      setupEventListeners()
    }

    // Fallback in case onload doesn't fire
    setTimeout(() => {
      updatePreviewUI()
      setupEventListeners()
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

function updatePreviewUI() {
  document.getElementById("pdfCurrentPage").value = pdfSystemData.currentPage
  document.getElementById("pdfTotalPages").textContent = `/ ${pdfSystemData.totalPages}`

  document.getElementById("pdfPrevPage").disabled = pdfSystemData.currentPage <= 1
  document.getElementById("pdfNextPage").disabled = pdfSystemData.currentPage >= pdfSystemData.totalPages

  // Update PDF settings from Page Setup Manager if available
  if (pageSetupManager && pageSetupManager.isPageManagerInitialized()) {
    const pageSettings = pageSetupManager.getPageSettings()
    document.getElementById("pdfPageFormat").value = pageSettings.format
    document.getElementById("pdfOrientation").value = pageSettings.orientation
  } else {
    document.getElementById("pdfPageFormat").value = pdfSystemData.settings.pageFormat
    document.getElementById("pdfOrientation").value = pdfSystemData.settings.orientation
  }

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

// ENHANCED: Smart PDF download with hybrid approach
async function downloadSmartPDF() {
  if (!validatePassword()) {
    return
  }

  try {
    const downloadBtn = document.getElementById("pdfDownload")
    const originalText = downloadBtn.textContent
    downloadBtn.textContent = "Generating Smart PDF..."
    downloadBtn.disabled = true

    // Process content for smart PDF generation
    const smartContent = await processContentForSmartPDF(pdfSystemData.currentContent)

    if (pdfSystemData.settings.security.passwordProtected) {
      await generateAndEncryptSmartPDF(smartContent)
    } else {
      await generateSmartPDFWithLibraries(smartContent)
    }

    downloadBtn.textContent = originalText
    downloadBtn.disabled = false
  } catch (error) {
    console.error("Error generating smart PDF:", error)
    alert("Error generating PDF. Please try again.")

    const downloadBtn = document.getElementById("pdfDownload")
    downloadBtn.textContent = "⬇ Download PDF"
    downloadBtn.disabled = false
  }
}

// ENHANCED: Process content for smart PDF with hybrid text/image approach
async function processContentForSmartPDF(htmlContent) {
  // Create a temporary iframe to process the content
  const tempIframe = document.createElement("iframe")
  tempIframe.style.position = "absolute"
  tempIframe.style.left = "-9999px"
  tempIframe.style.width = "1200px"
  tempIframe.style.height = "800px"
  document.body.appendChild(tempIframe)

  try {
    const iframeDoc = tempIframe.contentDocument || tempIframe.contentWindow.document
    iframeDoc.open()
    iframeDoc.write(htmlContent)
    iframeDoc.close()

    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Process elements marked for image conversion only
    const elementsToConvert = iframeDoc.querySelectorAll('[data-convert-to-image="true"]')
    console.log(`Converting ${elementsToConvert.length} elements to images`)

    for (let i = 0; i < elementsToConvert.length; i++) {
      const element = elementsToConvert[i]
      try {
        // Make sure the element is visible for capture
        element.style.display = "block"
        element.style.visibility = "visible"

        const html2canvas = window.html2canvas
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          width: element.offsetWidth || 800,
          height: element.offsetHeight || 400,
          onclone: (clonedDoc) => {
            const clonedElement = clonedDoc.querySelector(`#${element.id}`)
            if (clonedElement) {
              clonedElement.style.display = "block"
              clonedElement.style.visibility = "visible"
            }
          },
        })

        const imageDataUrl = canvas.toDataURL("image/png")

        // Replace the element with an image while preserving positioning
        const img = iframeDoc.createElement("img")
        img.src = imageDataUrl
        img.style.cssText = element.style.cssText
        img.style.width = (element.offsetWidth || 800) + "px"
        img.style.height = "auto"
        img.style.maxWidth = "100%"
        img.className = "pdf-image-component"
        img.alt = `Generated image for ${element.tagName}`

        element.parentNode.replaceChild(img, element)
        console.log(`Converted element ${element.id} to image`)
      } catch (error) {
        console.warn("Failed to convert element to image:", error)
        // Keep the original element but mark it as non-selectable
        element.classList.add("pdf-image-component")
        element.removeAttribute("data-convert-to-image")
      }
    }

    // Ensure text elements remain selectable
    const textElements = iframeDoc.querySelectorAll(".pdf-text-selectable")
    console.log(`Keeping ${textElements.length} elements as selectable text`)

    textElements.forEach((element) => {
      element.style.userSelect = "text"
      element.style.webkitUserSelect = "text"
      element.style.cursor = "text"
    })

    // Get the processed HTML
    const processedHTML = iframeDoc.documentElement.outerHTML
    return processedHTML
  } finally {
    document.body.removeChild(tempIframe)
  }
}

async function generateAndEncryptSmartPDF(htmlContent) {
  try {
    const tempPdfBlob = await generateTempSmartPDFBlob(htmlContent)

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
    a.download = `encrypted-smart-report-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error("Error with backend encryption:", error)
    alert(`Error encrypting PDF: ${error.message}. Downloading without encryption.`)
    await generateSmartPDFWithLibraries(htmlContent)
  }
}

async function generateTempSmartPDFBlob(htmlContent) {
  const tempContainer = document.createElement("div")
  tempContainer.style.position = "absolute"
  tempContainer.style.left = "-9999px"
  tempContainer.style.top = "0"

  // Get format and orientation from Page Setup Manager if available
  let format, orientation, dimensions
  if (pageSetupManager && pageSetupManager.isPageManagerInitialized()) {
    const pageSettings = pageSetupManager.getPageSettings()
    format = pageSettings.format
    orientation = pageSettings.orientation
    dimensions = {
      width: pageSettings.width,
      height: pageSettings.height,
    }
  } else {
    format = pdfSystemData.settings.pageFormat
    orientation = pdfSystemData.settings.orientation
    const standardDimensions = {
      a4: { width: 210, height: 297 },
      a3: { width: 297, height: 420 },
      a2: { width: 420, height: 594 },
      letter: { width: 216, height: 279 },
      legal: { width: 216, height: 356 },
      tabloid: { width: 279, height: 432 },
    }
    const dim = standardDimensions[format] || standardDimensions["a4"]
    dimensions = {
      width: orientation === "landscape" ? dim.height : dim.width,
      height: orientation === "landscape" ? dim.width : dim.height,
    }
  }

  tempContainer.style.width = `${dimensions.width}mm`
  tempContainer.style.height = `${dimensions.height}mm`
  tempContainer.style.background = "white"

  // Create iframe to render the HTML content
  const iframe = document.createElement("iframe")
  iframe.style.width = "100%"
  iframe.style.height = "100%"
  iframe.style.border = "none"
  tempContainer.appendChild(iframe)
  document.body.appendChild(tempContainer)

  try {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
    iframeDoc.open()
    iframeDoc.write(htmlContent)
    iframeDoc.close()

    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Use html2canvas to capture the final result
    const { html2canvas } = window
    const canvas = await html2canvas(iframe.contentDocument.body, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: iframe.contentDocument.body.scrollWidth,
      height: iframe.contentDocument.body.scrollHeight,
    })

    const { jsPDF } = window.jspdf
    const pdfFormat = format.toUpperCase()
    const pdfOrientation = orientation

    const pdf = new jsPDF({
      orientation: pdfOrientation,
      unit: "mm",
      format: pdfFormat,
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    const imgWidth = pageWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    const imgData = canvas.toDataURL("image/png")
    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)

    return pdf.output("blob")
  } finally {
    document.body.removeChild(tempContainer)
  }
}

async function generateSmartPDFWithLibraries(htmlContent) {
  try {
    // Use enhanced approach with iframe rendering
    const tempContainer = document.createElement("div")
    tempContainer.style.position = "absolute"
    tempContainer.style.left = "-9999px"
    tempContainer.style.top = "0"

    // Get format and orientation
    let format, orientation, dimensions
    if (pageSetupManager && pageSetupManager.isPageManagerInitialized()) {
      const pageSettings = pageSetupManager.getPageSettings()
      format = pageSettings.format
      orientation = pageSettings.orientation
      dimensions = {
        width: pageSettings.width,
        height: pageSettings.height,
      }
    } else {
      format = pdfSystemData.settings.pageFormat
      orientation = pdfSystemData.settings.orientation
      const standardDimensions = {
        a4: { width: 210, height: 297 },
        a3: { width: 297, height: 420 },
        a2: { width: 420, height: 594 },
        letter: { width: 216, height: 279 },
        legal: { width: 216, height: 356 },
        tabloid: { width: 279, height: 432 },
      }
      const dim = standardDimensions[format] || standardDimensions["a4"]
      dimensions = {
        width: orientation === "landscape" ? dim.height : dim.width,
        height: orientation === "landscape" ? dim.width : dim.height,
      }
    }

    tempContainer.style.width = `${dimensions.width}mm`
    tempContainer.style.height = `${dimensions.height}mm`
    tempContainer.style.background = "white"

    // Create iframe for rendering
    const iframe = document.createElement("iframe")
    iframe.style.width = "100%"
    iframe.style.height = "100%"
    iframe.style.border = "none"
    tempContainer.appendChild(iframe)
    document.body.appendChild(tempContainer)

    try {
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
      iframeDoc.open()
      iframeDoc.write(htmlContent)
      iframeDoc.close()

      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Enhanced PDF generation with smart text preservation
      const { jsPDF } = window.jspdf
      const pdfFormat = format.toUpperCase()
      const pdfOrientation = orientation

      const pdf = new jsPDF({
        orientation: pdfOrientation,
        unit: "mm",
        format: pdfFormat,
      })

      // Use html2canvas with enhanced text handling
      const { html2canvas } = window
      const canvas = await html2canvas(iframe.contentDocument.body, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: iframe.contentDocument.body.scrollWidth,
        height: iframe.contentDocument.body.scrollHeight,
        onclone: (clonedDoc) => {
          // Ensure text elements remain selectable in the clone
          const textElements = clonedDoc.querySelectorAll(".pdf-text-selectable")
          textElements.forEach((el) => {
            el.style.userSelect = "text"
            el.style.webkitUserSelect = "text"
          })
        },
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = pageWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      const imgData = canvas.toDataURL("image/png")
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight)

      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-")
      const filename = `smart-report-${timestamp}.pdf`
      pdf.save(filename)
    } finally {
      document.body.removeChild(tempContainer)
    }
  } catch (error) {
    console.error("Error generating smart PDF:", error)
    alert("Error generating PDF. Please try again.")
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

  // Recalculate positioning when settings panel is toggled
  setTimeout(() => {
    const previewContent = document.getElementById("pdfPreviewContent")
    const dimensions = getExactPDFDimensions()
    applyDynamicPositioning(previewContent, dimensions)
  }, 100)
}

function updatePreviewDynamically() {
  updateSettingsFromUI()

  // Regenerate content with new settings
  if (pdfSystemData.originalContent) {
    const hybridContent = createHybridHTMLContent(pdfSystemData.originalContent)
    pdfSystemData.currentContent = hybridContent

    const iframe = document.querySelector(".pdf-preview-iframe")
    const previewContent = document.getElementById("pdfPreviewContent")

    if (iframe && previewContent) {
      // Update container dimensions and positioning when format/orientation changes
      const dimensions = getExactPDFDimensions()
      previewContent.style.width = dimensions.width + "px"
      previewContent.style.height = dimensions.height + "px"
      previewContent.style.minWidth = dimensions.width + "px"
      previewContent.style.minHeight = dimensions.height + "px"

      // Reapply dynamic positioning for new dimensions
      applyDynamicPositioning(previewContent, dimensions)

      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
        iframeDoc.open()
        iframeDoc.write(hybridContent)
        iframeDoc.close()
      } catch (error) {
        console.error("Error updating preview:", error)
      }
    }
  }
}

function updateSettingsFromUI() {
  pdfSystemData.settings.pageFormat = document.getElementById("pdfPageFormat").value
  pdfSystemData.settings.orientation = document.getElementById("pdfOrientation").value
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
  document.getElementById("pdfSettingsPanel").style.display = "none"
}

document.addEventListener("DOMContentLoaded", () => {
  initializePDFSystem()
})

window.generateAdvancedPDF = generateAdvancedPDF

// Preserve all existing functionality
var singlePageData = JSON.parse(localStorage.getItem("single-page")) || {}
if (Object.keys(singlePageData).length > 0) {
  editor.setComponents(singlePageData)
}

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

// Remaining utility functions...
function updateComponentsWithNewJson(editor) {
  var jsonDataString = localStorage.getItem("common_json")
  if (!jsonDataString) return

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

function generateFromCanvas() {
  const canvas = document.querySelector("canvas")
  if (!canvas) {
    alert("No canvas element found")
    return
  }

  const dataURL = canvas.toDataURL("image/png")

  const pdf = new jsPDF()
  const imgWidth = pdf.internal.pageSize.getWidth()
  const imgHeight = (canvas.height * imgWidth) / canvas.width

  pdf.addImage(dataURL, "PNG", 0, 0, imgWidth, imgHeight)
  pdf.save("canvas-report.pdf")
}
