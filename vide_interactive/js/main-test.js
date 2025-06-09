
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
    // Add page manager plugin options
    "page-manager-component": {
      category: "Pages",
      defaultPages: ["Home"], // Optional: add default pages
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
  // Get the page manager instance
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
    // {
    //   id: "addNewPage",
    //   attributes: { title: "Add New Page", id: "addNewPage" },
    //   className: "fa fa-plus-square",
    // },
    // {
    //   id: "managePagesBtn",
    //   attributes: { title: "Manage Pages", id: "managePagesBtn" },
    //   className: "fa fa-files-o",
    // },
  ])

var el = document.getElementById("exportPDF")
el.addEventListener("click", generateAdvancedPDF, true)
var save = document.getElementById("savePage")
save.addEventListener("click", savePage, true)

var importPage = document.getElementById("importPage")
importPage.addEventListener("click", importSinglePages, true)

// // Add event listeners for new page management buttons
// var addNewPageBtn = document.getElementById("addNewPage")
// addNewPageBtn.addEventListener("click", addNewPage, true)

// var managePagesBtn = document.getElementById("managePagesBtn")
// managePagesBtn.addEventListener("click", managePages, true)

// // Page Management Functions
// function addNewPage() {
//   editor.Modal.setTitle("Add New Page")
//   editor.Modal.setContent(`<div class="new-table-form">
//   <div> 
//       <input type="text" class="form-control popupinput2" value="" placeholder="Enter page name" style="width:95%" name="newPageName" id="newPageName">
//   </div>  
//   <input id="createNewPage" type="button" value="Create Page" class="popupaddbtn" data-component-id="c1006">
//   </div>
//   </div>
//   `)
//   editor.Modal.open()
//   var el = document.getElementById("createNewPage")
//   el.addEventListener("click", createNewPage, true)
// }

// function createNewPage() {
//   const pageName = document.getElementById("newPageName").value
//   if (!pageName) {
//     alert("Page name required")
//     return false
//   }

//   // Use the page manager to create a new page
//   if (pageManager && pageManager.createPage) {
//     const newPage = pageManager.createPage(pageName)
//     if (newPage) {
//       pageManager.switchToPage(newPage.id)
//       editor.Modal.close()
//       alert(`Page "${pageName}" created successfully!`)
//     } else {
//       alert("Error creating page")
//     }
//   } else {
//     alert("Page manager not initialized yet")
//   }
// }

// function managePages() {
//   if (!pageManager) {
//     alert("Page manager not initialized yet")
//     return
//   }

//   const pages = pageManager.getAllPages()
//   const currentPage = pageManager.getCurrentPage()
//   let pagesList = '<div class="pages-manager"><h4>Manage Pages</h4>'

//   pages.forEach((page) => {
//     const isCurrentPage = currentPage && currentPage.id === page.id
//     const currentIndicator = isCurrentPage ? " (Current)" : ""
//     pagesList += `
//       <div class="page-item" style="margin: 10px 0; padding: 10px; border: 1px solid #ccc; ${isCurrentPage ? "background-color: #e3f2fd;" : ""}">
//         <span>${page.name}${currentIndicator}</span>
//         <div>
//           ${!isCurrentPage ? `<button onclick="switchToPage('${page.id}')" class="btn btn-sm btn-primary" style="margin-left: 5px;">Switch</button>` : ""}
//           <button onclick="renamePage('${page.id}', '${page.name}')" class="btn btn-sm btn-info" style="margin-left: 5px;">Rename</button>
//           <button onclick="duplicatePage('${page.id}')" class="btn btn-sm btn-success" style="margin-left: 5px;">Duplicate</button>
//           ${pages.length > 1 ? `<button onclick="removePage('${page.id}')" class="btn btn-sm btn-danger" style="margin-left: 5px;">Remove</button>` : ""}
//         </div>
//       </div>`
//   })

//   pagesList += "</div>"

//   editor.Modal.setTitle("Page Manager")
//   editor.Modal.setContent(pagesList)
//   editor.Modal.open()
// }

// // Global functions for page management (accessible from modal buttons)
// window.switchToPage = (pageId) => {
//   if (pageManager && pageManager.switchToPage) {
//     const success = pageManager.switchToPage(pageId)
//     if (success) {
//       editor.Modal.close()
//       alert("Switched to page successfully!")
//     } else {
//       alert("Error switching to page")
//     }
//   }
// }

// window.removePage = (pageId) => {
//   if (confirm("Are you sure you want to remove this page?")) {
//     if (pageManager && pageManager.removePage) {
//       const success = pageManager.removePage(pageId)
//       if (success) {
//         editor.Modal.close()
//         alert("Page removed successfully!")
//         // Refresh the page manager modal
//         setTimeout(() => managePages(), 100)
//       } else {
//         alert("Error removing page or cannot remove the last page")
//       }
//     }
//   }
// }

// window.renamePage = (pageId, currentName) => {
//   const newName = prompt("Enter new page name:", currentName)
//   if (newName && newName !== currentName) {
//     if (pageManager && pageManager.renamePage) {
//       const success = pageManager.renamePage(pageId, newName)
//       if (success) {
//         editor.Modal.close()
//         alert("Page renamed successfully!")
//         setTimeout(() => managePages(), 100)
//       } else {
//         alert("Error renaming page")
//       }
//     }
//   }
// }

// window.duplicatePage = (pageId) => {
//   if (pageManager && pageManager.duplicatePage) {
//     const duplicatedPage = pageManager.duplicatePage(pageId)
//     if (duplicatedPage) {
//       editor.Modal.close()
//       alert(`Page duplicated successfully as "${duplicatedPage.name}"!`)
//       setTimeout(() => managePages(), 100)
//     } else {
//       alert("Error duplicating page")
//     }
//   }
// }

// Backend URL configuration
const BACKEND_URL = 'http://localhost:3000'

// Enhanced PDF Preview and Generation System with Backend Password Protection
function initializePDFSystem() {
  // Create PDF preview modal HTML with enhanced features including element reordering
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
                    <!--   
                    <select id="pdfZoom" class="pdf-zoom-select">
                            <option value="0.5">50%</option>
                            <option value="0.75">75%</option>
                            <option value="1" selected>100%</option>
                            <option value="1.25">125%</option>
                            <option value="1.5">150%</option>
                            <option value="2">200%</option>
                            <option value="fit">Fit Width</option>
                            <option value="fitPage">Fit Page</option>
                        </select>
                        -->
                        <button id="pdfSettings" class="pdf-btn">⚙️</button>
                       <!-- <button id="pdfSearch" class="pdf-btn">🔍</button> -->
                        <button id="pdfPrint" class="pdf-btn">🖨</button>
                        <button id="pdfDownload" class="pdf-btn pdf-btn-primary">⬇ Download PDF</button>
                    </div>
                </div>
                
                <div class="pdf-main-container">
                    <!-- Preview Content on Left -->
                    <div class="pdf-preview-container">
                    <!--
                        <div class="pdf-search-bar" id="pdfSearchBar" style="display: none;">
                            <input type="text" id="pdfSearchInput" placeholder="Search in document...">
                            <button id="pdfSearchPrev" class="pdf-btn">▲</button>
                            <button id="pdfSearchNext" class="pdf-btn">▼</button>
                            <button id="pdfSearchClose" class="pdf-btn">×</button>
                            <span id="pdfSearchResults" class="pdf-search-results"></span>
                        </div>
                        -->
                        <div class="pdf-content-wrapper">
                            <div id="pdfPreviewContent" class="pdf-preview-content">
                                <div class="pdf-loading">Loading preview...</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Settings Panel on Right -->
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
                                        <input type="password" id="pdfPassword" class="pdf-control" placeholder="Enter password">
                                    </div>
                                    <div class="pdf-settings-row">
                                        <label>Confirm:</label>
                                        <input type="password" id="pdfPasswordConfirm" class="pdf-control" placeholder="Confirm password">
                                    </div>
                                </div>
                            </div>
                            <!--
                            <div class="pdf-settings-section">
                                <h4>Watermark</h4>
                                <div class="pdf-settings-row">
                                    <label>Type:</label>
                                    <select id="pdfWatermarkType" class="pdf-control">
                                        <option value="none" selected>None</option>
                                        <option value="text">Text</option>
                                        <option value="image">Image</option>
                                    </select>
                                </div>
                                <div id="pdfWatermarkTextOptions" class="pdf-watermark-options" style="display: none;">
                                    <input type="text" id="pdfWatermarkText" placeholder="Watermark text" class="pdf-control">
                                    <div class="pdf-settings-row">
                                        <label>Font Size:</label>
                                        <input type="number" id="pdfWatermarkFontSize" class="pdf-control" value="48" min="12" max="100">
                                    </div>
                                    <div class="pdf-settings-row">
                                        <label>Color:</label>
                                        <input type="color" id="pdfWatermarkColor" class="pdf-control" value="#cccccc">
                                    </div>
                                </div>
                                <div id="pdfWatermarkImageOptions" class="pdf-watermark-options" style="display: none;">
                                    <input type="file" id="pdfWatermarkImage" accept="image/*" class="pdf-control">
                                </div>
                                <div id="pdfWatermarkCommonOptions" class="pdf-watermark-options" style="display: none;">
                                    <div class="pdf-settings-row">
                                        <label>Opacity:</label>
                                        <input type="range" id="pdfWatermarkOpacity" class="pdf-control" min="0" max="1" step="0.1" value="0.3">
                                        <span id="pdfWatermarkOpacityValue">30%</span>
                                    </div>
                                    <div class="pdf-settings-row">
                                        <label>Position:</label>
                                        <select id="pdfWatermarkPosition" class="pdf-control">
                                            <option value="center" selected>Center</option>
                                            <option value="top-left">Top Left</option>
                                            <option value="top-right">Top Right</option>
                                            <option value="bottom-left">Bottom Left</option>
                                            <option value="bottom-right">Bottom Right</option>
                                        </select>
                                    </div>
                                    <div class="pdf-settings-row">
                                        <label>Rotation:</label>
                                        <input type="range" id="pdfWatermarkRotation" class="pdf-control" min="-180" max="180" value="0">
                                        <span id="pdfWatermarkRotationValue">0°</span>
                                    </div>
                                </div>
                            </div>
                            -->
                            <div class="pdf-settings-section">
                                <h4>Page Selection</h4>
                                <div class="pdf-settings-row">
                                    <label>Pages:</label>
                                    <select id="pdfPageSelection" class="pdf-control">
                                        <option value="all" selected>All Pages</option>
                                        <option value="odd">Odd Pages</option>
                                        <option value="even">Even Pages</option>
                                        <option value="custom">Custom Range</option>
                                    </select>
                                </div>
                                <div id="pdfCustomPageRange" class="pdf-settings-row" style="display: none;">
                                    <input type="text" id="pdfCustomPages" placeholder="e.g., 1,3,5-8" class="pdf-control">
                                    <small>Enter page numbers separated by commas or ranges with dashes</small>
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

  // Enhanced PDF preview styles with element reordering controls
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
            }
            
            .pdf-toolbar-left, .pdf-toolbar-center, .pdf-toolbar-right {
                display: flex;
                align-items: center;
                gap: 10px;
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
            
            .pdf-zoom-select {
                padding: 5px;
                border: 1px solid #ccc;
                border-radius: 4px;
                background: white;
            }
            
            /* Main Container - Side by Side Layout */
            .pdf-main-container {
                display: flex;
                flex: 1;
                overflow: hidden;
            }
            
            .pdf-preview-container {
                flex: 1;
                display: flex;
                flex-direction: column;
                background: #e9ecef;
            }
            
            /* Settings Panel Styles - Right Side */
            .pdf-settings-panel {
                width: 350px;
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

               /* Ensure proper scrollbar styling */
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
                gap: 10px;
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
            
            .pdf-permissions {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            
            .pdf-permissions label {
                font-size: 12px;
                min-width: auto;
            }
            
            .pdf-watermark-options {
                margin-top: 10px;
                padding: 10px;
                background: #f8f9fa;
                border-radius: 4px;
            }
            
            .pdf-settings-actions {
                display: flex;
                gap: 10px;
                justify-content: flex-end;
                margin-top: 20px;
            }
            
            .pdf-search-bar {
                padding: 10px 15px;
                background: #fff3cd;
                border-bottom: 1px solid #ffeaa7;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .pdf-search-bar input {
                flex: 1;
                padding: 5px 10px;
                border: 1px solid #ccc;
                
                border-radius: 4px;
            }
            
            .pdf-search-results {
                font-size: 12px;
                color: #666;
            }
            
            .pdf-content-wrapper {
                flex: 1;
                overflow: auto;
                display: flex;
                justify-content: center;
                align-items: flex-start;
                padding: 20px;
            }
            
            .pdf-preview-content {
                background: white;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                width: 100%;
                max-width: none;
                transform-origin: top center;
                transition: transform 0.2s;
                position: relative;
            }
            
            .pdf-loading {
                padding: 40px;
                text-align: center;
                font-size: 18px;
                color: #666;
            }
            
            .pdf-page {
                margin-bottom: 20px;
                page-break-after: always;
                position: relative;
            }
            
            .pdf-watermark {
                position: absolute;
                pointer-events: none;
                z-index: 1000;
                font-family: Arial, sans-serif;
                font-weight: bold;
                text-align: center;
                user-select: none;
            }
            
            .pdf-highlight {
                background-color: yellow;
                padding: 1px 2px;
            }
            
            .pdf-highlight-current {
                background-color: orange;
            }
            
            .pdf-preview-iframe {
                width: 100%;
                border: none;
                background: white;
            }

            /* Element Reordering Styles */
            .pdf-element-container {
                position: relative;
                margin: 10px 0;
                border: 2px dashed transparent;
                transition: all 0.3s ease;
            }

            .pdf-element-container:hover {
                border-color: #007bff;
                background-color: rgba(0, 123, 255, 0.05);
            }

            .pdf-element-container.selected {
                border-color: #28a745;
                background-color: rgba(40, 167, 69, 0.1);
            }

            .pdf-element-controls {
                position: absolute;
                top: -15px;
                right: -15px;
                display: none;
                background: white;
                border: 1px solid #ccc;
                border-radius: 4px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                z-index: 1001;
            }

            .pdf-element-container:hover .pdf-element-controls,
            .pdf-element-container.selected .pdf-element-controls {
                display: flex;
            }

            .pdf-element-btn {
                padding: 4px 8px;
                border: none;
                background: white;
                cursor: pointer;
                font-size: 12px;
                border-right: 1px solid #ccc;
                transition: background-color 0.2s;
            }

            .pdf-element-btn:last-child {
                border-right: none;
            }

            .pdf-element-btn:hover {
                background-color: #f8f9fa;
            }

            .pdf-element-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }

            .pdf-element-position {
                position: absolute;
                top: -15px;
                left: -15px;
                background: #007bff;
                color: white;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 10px;
                font-weight: bold;
                display: none;
            }

            .pdf-element-container:hover .pdf-element-position,
            .pdf-element-container.selected .pdf-element-position {
                display: block;
            }

            .pdf-reorder-mode {
                background-color: #fff3cd !important;
                border: 2px solid #ffc107 !important;
            }

            .pdf-reorder-mode::before {
                content: "🔄 Element Reordering Mode - Click elements to select and reorder";
                position: absolute;
                top: -30px;
                left: 0;
                right: 0;
                background: #ffc107;
                color: #212529;
                padding: 5px 10px;
                font-size: 12px;
                font-weight: bold;
                text-align: center;
                border-radius: 4px 4px 0 0;
                z-index: 1002;
            }
            
            @media print {
                .pdf-modal, .pdf-toolbar, .pdf-search-bar, .pdf-settings-panel {
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
            
            @media (max-width: 768px) {
                .pdf-main-container {
                    flex-direction: column;
                }
                
                .pdf-settings-panel {
                    width: 100%;
                    max-height: 50%;
                }
                
                .pdf-toolbar {
                    flex-direction: column;
                    align-items: stretch;
                }
                
                .pdf-toolbar-left, .pdf-toolbar-center, .pdf-toolbar-right {
                    justify-content: center;
                }
                
                .pdf-margin-inputs {
                    grid-template-columns: 1fr;
                }
            }
        </style>
    `

  // Inject styles and modal HTML into document
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

// Enhanced global variables for PDF system with element reordering
var pdfSystemData = {
  currentContent: "",
  originalContent: "",
  currentPage: 1,
  totalPages: 1,
  zoomLevel: 1,
  searchTerm: "",
  searchResults: [],
  currentSearchIndex: 0,
  elementOrder: [], // Track element order for each page
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

        // Extract elements and their order for reordering functionality
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

// New function to extract elements and their metadata for reordering
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
      // Skip if element is inside another tracked element
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

  // Initialize element order for each page
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

  // Enhanced CSS with proper margin application and element reordering styles
  const enhancedCSS = `
        <style>
            * {
                -webkit-print-color-adjust: exact !important;
                color-adjust: exact !important;
                print-color-adjust: exact !important;
            }
            
            body {
                font-family: Arial, sans-serif;
                line-height: 1.4;
                color: #333;
                background: white;
                margin: ${pdfSystemData.settings.margins.top}${pdfSystemData.settings.margins.unit} 
                       ${pdfSystemData.settings.margins.right}${pdfSystemData.settings.margins.unit} 
                       ${pdfSystemData.settings.margins.bottom}${pdfSystemData.settings.margins.unit} 
                       ${pdfSystemData.settings.margins.left}${pdfSystemData.settings.margins.unit} !important;
                padding: ${pdfSystemData.settings.margins.top}${pdfSystemData.settings.margins.unit} 
                        ${pdfSystemData.settings.margins.right}${pdfSystemData.settings.margins.unit} 
                        ${pdfSystemData.settings.margins.bottom}${pdfSystemData.settings.margins.unit} 
                        ${pdfSystemData.settings.margins.left}${pdfSystemData.settings.margins.unit} !important;
                position: relative;
                background: white;
            }
            
            .tab-contents {
                min-height: auto !important;
                padding: 0px !important;
            }
            
            table {
                border-collapse: collapse;
                width: 100%;
                margin-bottom: 15px;
            }
            
            table, th, td {
                border: 1px solid #ddd;
            }
            
            th, td {
                padding: 8px;
                text-align: left;
            }
            
            th {
                background-color: #f2f2f2;
                font-weight: bold;
            }
            
            img {
                max-width: 100%;
                height: auto;
            }
            
            /* Ensure external components are visible and properly styled */
            .chart-container, .api-component, .external-component {
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                padding: 15px;
                margin: 10px 0;
                border-radius: 4px;
                min-height: 300px;
                display: block !important;
                visibility: visible !important;
            }
            
            canvas, iframe, object, embed {
                max-width: 100%;
                height: auto;
                display: block !important;
                visibility: visible !important;
            }
            
            /* DataTables styling */
            .dataTables_wrapper {
                width: 100%;
                display: block !important;
            }
            
            .dataTables_wrapper table {
                width: 100% !important;
                display: table !important;
            }
            
            /* Chart.js and Highcharts compatibility */
            .highcharts-container, .chartjs-render-monitor {
                display: block !important;
                visibility: visible !important;
            }
            
            /* Bootstrap components */
            .container, .container-fluid, .row, .col, [class*="col-"] {
                display: block !important;
                visibility: visible !important;
            }
            
            /* FontAwesome icons */
            .fa, .fas, .far, .fab, .fal {
                display: inline-block !important;
                visibility: visible !important;
            }
            
            ${editorCSS}
        </style>
    `

  // Include all external scripts and styles for proper rendering
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
                    ${processContentWithReorderableElements(tab.content, tab.elements, index)}
                    <!-- ${/* generateWatermark() */ ""} -->
                </div>`,
              )
              .join("")}
            ${scriptTags}
            <script>
                // Initialize external components and element reordering after load
                document.addEventListener('DOMContentLoaded', function() {
                    // Wait for all external scripts to load
                    setTimeout(function() {
                        // Reinitialize DataTables if present
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
                                            dom: 't'
                                        });
                                    } catch(e) {
                                        console.warn('DataTable initialization failed:', e);
                                    }
                                }
                            });
                        }
                        
                        // Reinitialize charts if present
                        if (typeof Highcharts !== 'undefined') {
                            try {
                                Highcharts.charts.forEach(function(chart) {
                                    if (chart) chart.redraw();
                                });
                            } catch(e) {
                                console.warn('Highcharts redraw failed:', e);
                            }
                        }
                        
                        // Ensure all external components are visible
                        document.querySelectorAll('.chart-container, .api-component, canvas, iframe').forEach(function(el) {
                            el.style.display = 'block';
                            el.style.visibility = 'visible';
                        });

                        // Initialize element reordering functionality
                        initializeElementReordering();
                    }, 1000);
                });

                // Element reordering functionality
                function initializeElementReordering() {
                    const elements = document.querySelectorAll('.pdf-element-container');
                    elements.forEach(function(container) {
                        container.addEventListener('click', function(e) {
                            if (window.parent && window.parent.handleElementSelection) {
                                e.stopPropagation();
                                window.parent.handleElementSelection(container.dataset.elementId, container.dataset.pageIndex);
                            }
                        });
                    });
                }

                // Function to reorder elements (called from parent window)
                function reorderElement(elementId, direction, pageIndex) {
                    const container = document.querySelector('[data-element-id="' + elementId + '"]');
                    if (!container) return false;

                    const page = container.closest('.pdf-page');
                    const allContainers = Array.from(page.querySelectorAll('.pdf-element-container'));
                    const currentIndex = allContainers.indexOf(container);
                    
                    let targetIndex;
                    if (direction === 'up') {
                        targetIndex = currentIndex - 1;
                    } else if (direction === 'down') {
                        targetIndex = currentIndex + 1;
                    } else {
                        return false;
                    }

                    if (targetIndex < 0 || targetIndex >= allContainers.length) {
                        return false;
                    }

                    const targetContainer = allContainers[targetIndex];
                    
                    if (direction === 'up') {
                        page.insertBefore(container, targetContainer);
                    } else {
                        page.insertBefore(container, targetContainer.nextSibling);
                    }

                    // Update position indicators
                    updatePositionIndicators(page);
                    
                    return true;
                }

                function updatePositionIndicators(page) {
                    const containers = page.querySelectorAll('.pdf-element-container');
                    containers.forEach(function(container, index) {
                        const indicator = container.querySelector('.pdf-element-position');
                        if (indicator) {
                            indicator.textContent = index + 1;
                        }
                    });
                }

                // Make functions available to parent window
                window.reorderElement = reorderElement;
                window.updatePositionIndicators = updatePositionIndicators;
            </script>
        </body>
        </html>
    `

  return htmlContent
}

// Enhanced function to wrap elements with reordering controls
function processContentWithReorderableElements(content, elements, pageIndex) {
  if (!elements || elements.length === 0) {
    return processContentWithExternalComponents(content)
  }

  let processedContent = processContentWithExternalComponents(content)

  // Wrap each tracked element with reordering container
  elements.forEach((elementData, index) => {
    const elementId = elementData.id
    const elementType = elementData.type

    // Create regex to find the element by ID
    const elementRegex = new RegExp(`(<[^>]*id=["']${elementId}["'][^>]*>)`, "gi")

    processedContent = processedContent.replace(elementRegex, (match) => {
      return `<div class="pdf-element-container" data-element-id="${elementId}" data-page-index="${pageIndex}" data-element-type="${elementType}">
                <div class="pdf-element-position">${index + 1}</div>
                <div class="pdf-element-controls">
                  <button class="pdf-element-btn" onclick="moveElementUp('${elementId}', ${pageIndex})" title="Move Up">↑</button>
                  <button class="pdf-element-btn" onclick="moveElementDown('${elementId}', ${pageIndex})" title="Move Down">↓</button>
                </div>
                ${match}`
    })
  })

  // If no elements were wrapped, wrap the entire content
  if (!processedContent.includes("pdf-element-container")) {
    processedContent = `<div class="pdf-element-container" data-element-id="page-content-${pageIndex}" data-page-index="${pageIndex}" data-element-type="Content">
                        <div class="pdf-element-position">1</div>
                        <div class="pdf-element-controls">
                          <span style="padding: 4px 8px; font-size: 12px;">Page Content</span>
                        </div>
                        ${processedContent}
                      </div>`
  }

  return processedContent
}

// Enhanced function to capture external components as images
async function captureExternalComponentsAsImages(content) {
  let processedContent = content

  // Create a temporary iframe to render external components
  const tempIframe = document.createElement("iframe")
  tempIframe.style.position = "absolute"
  tempIframe.style.left = "-9999px"
  tempIframe.style.width = "1200px"
  tempIframe.style.height = "800px"
  document.body.appendChild(tempIframe)

  try {
    // Write content to iframe
    const iframeDoc = tempIframe.contentDocument || tempIframe.contentWindow.document
    iframeDoc.open()
    iframeDoc.write(processedContent)
    iframeDoc.close()

    // Wait for external components to load
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Find and capture external components
    const externalComponents = iframeDoc.querySelectorAll(
      '.chart-container, canvas, .highcharts-container, .dataTables_wrapper, iframe[src*="chart"], iframe[src*="graph"]',
    )

    for (let i = 0; i < externalComponents.length; i++) {
      const component = externalComponents[i]
      try {
        // Capture component as image using html2canvas
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

        // Replace component with image in the content
        const componentId = component.id || `external-component-${i}`
        component.id = componentId

        const imageHtml = `<img src="${imageDataUrl}" style="width: 100%; max-width: ${component.offsetWidth || 800}px; height: auto;" alt="External Component ${i + 1}">`

        // Replace in the original content string
        const componentOuterHTML = component.outerHTML
        processedContent = processedContent.replace(componentOuterHTML, imageHtml)
      } catch (error) {
        console.warn("Failed to capture external component:", error)
        // Fallback: replace with placeholder
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

  // Remove any display:none styles that might hide external components
  processedContent = processedContent.replace(/style\s*=\s*["'][^"']*display\s*:\s*none[^"']*["']/gi, "")

  // Ensure external components have proper classes for styling
  processedContent = processedContent.replace(/<div([^>]*)(id|class)="[^"]*chart[^"]*"([^>]*)>/gi, (match) => {
    if (!match.includes("chart-container")) {
      return match.replace(/class="/, 'class="chart-container ')
    }
    return match
  })

  // Fix any broken image sources
  processedContent = processedContent.replace(/src=["'](?!http|data:)[^"']*["']/gi, (match) => {
    console.warn("Fixed relative image source:", match)
    return 'src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2Y4ZjlmYSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNjY2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2U8L3RleHQ+PC9zdmc+"'
  })

  // Process DataTables components
  processedContent = processedContent.replace(/<table[^>]*class="[^"]*display[^"]*"[^>]*>/gi, (match) => {
    return match.replace(/class="/, 'class="table table-striped table-bordered ')
  })

  // Process chart containers
  processedContent = processedContent.replace(/<div[^>]*id="[^"]*chart[^"]*"[^>]*>/gi, (match) => {
    if (!match.includes("style=")) {
      return match.replace(">", ' style="min-height: 400px; width: 100%; display: block !important;">')
    }
    return match
  })

  // Ensure iframe content is properly handled
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

// // Fixed watermark generation with proper positioning
// function generateWatermark() {
//   const settings = pdfSystemData.settings.watermark

//   if (settings.type === "none") {
//     return ""
//   }

//   let watermarkContent = ""
//   const position = getWatermarkPosition(settings.position)
//   const transform = `rotate(${settings.rotation}deg)`

//   if (settings.type === "text" && settings.text) {
//     watermarkContent = `
//             <div class="pdf-watermark" style="
//                 position: absolute;
//                 ${position}
//                 transform: ${transform};
//                 opacity: ${settings.opacity};
//                 color: ${settings.color};
//                 font-size: ${settings.fontSize}px;
//                 font-weight: bold;
//                 pointer-events: none;
//                 z-index: 1000;
//                 white-space: nowrap;
//                 user-select: none;
//             ">${settings.text}</div>
//         `
//   } else if (settings.type === "image" && settings.image) {
//     watermarkContent = `
//             <div class="pdf-watermark" style="
//                 position: absolute;
//                 ${position}
//                 transform: ${transform};
//                 opacity: ${settings.opacity};
//                 pointer-events: none;
//                 z-index: 1000;
//             ">
//                 <img src="${settings.image}" style="max-width: 200px; max-height: 200px;" alt="Watermark">
//             </div>
//         `
//   }

//   return watermarkContent
// }

// // Fixed watermark positioning function
// function getWatermarkPosition(position) {
//   switch (position) {
//     case "top-left":
//       return "top: 10%; left: 10%; transform-origin: top left;"
//     case "top-right":
//       return "top: 10%; right: 10%; transform-origin: top right;"
//     case "bottom-left":
//       return "bottom: 10%; left: 10%; transform-origin: bottom left;"
//     case "bottom-right":
//       return "bottom: 10%; right: 10%; transform-origin: bottom right;"
//     case "center":
//     default:
//       return "top: 50%; left: 50%; transform: translate(-50%, -50%);"
//   }
// }

function showEnhancedPDFPreview() {
  const modal = document.getElementById("pdfPreviewModal")
  const previewContent = document.getElementById("pdfPreviewContent")

  modal.style.display = "flex"

  const iframe = document.createElement("iframe")
  iframe.className = "pdf-preview-iframe"
  iframe.style.height = getPreviewHeight()

  previewContent.innerHTML = ""
  previewContent.appendChild(iframe)

  const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
  iframeDoc.open()
  iframeDoc.write(pdfSystemData.currentContent)
  iframeDoc.close()

  updatePreviewUI()
  setupEventListeners()
 // applyZoom()
}

function getPreviewHeight() {
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
  const height = orientation === "landscape" ? dim.width : dim.height

  return `${Math.round(height * 3.78)}px`
}

function updatePreviewUI() {
  document.getElementById("pdfCurrentPage").value = pdfSystemData.currentPage
  document.getElementById("pdfTotalPages").textContent = `/ ${pdfSystemData.totalPages}`

  document.getElementById("pdfPrevPage").disabled = pdfSystemData.currentPage <= 1
  document.getElementById("pdfNextPage").disabled = pdfSystemData.currentPage >= pdfSystemData.totalPages

  document.getElementById("pdfPageFormat").value = pdfSystemData.settings.pageFormat
  document.getElementById("pdfOrientation").value = pdfSystemData.settings.orientation
  // document.getElementById("pdfZoom").value = pdfSystemData.zoomLevel

  document.getElementById("pdfMarginTop").value = pdfSystemData.settings.margins.top
  document.getElementById("pdfMarginRight").value = pdfSystemData.settings.margins.right
  document.getElementById("pdfMarginBottom").value = pdfSystemData.settings.margins.bottom
  document.getElementById("pdfMarginLeft").value = pdfSystemData.settings.margins.left
  document.getElementById("pdfMarginUnit").value = pdfSystemData.settings.margins.unit

  document.getElementById("pdfPasswordProtected").checked = pdfSystemData.settings.security.passwordProtected
  document.getElementById("pdfPassword").value = pdfSystemData.settings.security.password
  document.getElementById("pdfPasswordConfirm").value = pdfSystemData.settings.security.password

  // document.getElementById("pdfWatermarkType").value = pdfSystemData.settings.watermark.type
  // document.getElementById("pdfWatermarkText").value = pdfSystemData.settings.watermark.text
  // document.getElementById("pdfWatermarkFontSize").value = pdfSystemData.settings.watermark.fontSize
  // document.getElementById("pdfWatermarkColor").value = pdfSystemData.settings.watermark.color
  // document.getElementById("pdfWatermarkOpacity").value = pdfSystemData.settings.watermark.opacity
  // document.getElementById("pdfWatermarkOpacityValue").textContent =
  //   Math.round(pdfSystemData.settings.watermark.opacity * 100) + "%"
  // document.getElementById("pdfWatermarkPosition").value = pdfSystemData.settings.watermark.position
  // document.getElementById("pdfWatermarkRotation").value = pdfSystemData.settings.watermark.rotation
  // document.getElementById("pdfWatermarkRotationValue").textContent = pdfSystemData.settings.watermark.rotation + "°"

  togglePasswordOptions()
 // toggleWatermarkOptions()

  // document.getElementById("pdfPageSelection").value = pdfSystemData.settings.pageSelection
  // document.getElementById("pdfCustomPages").value = pdfSystemData.settings.customPages
  // toggleCustomPageRange()
}

// Enhanced event listeners setup with element reordering functionality
function setupEventListeners() {
  document.getElementById("pdfClose").onclick = closePDFPreview
  document.getElementById("pdfPrevPage").onclick = () => navigatePage(-1)
  document.getElementById("pdfNextPage").onclick = () => navigatePage(1)
  document.getElementById("pdfCurrentPage").onchange = goToPage

  // document.getElementById("pdfZoom").onchange = handleZoomChange

  document.getElementById("pdfSettings").onclick = toggleSettings
  document.getElementById("pdfSettingsClose").onclick = toggleSettings
  document.getElementById("pdfApplySettings").onclick = applySettings
  document.getElementById("pdfResetSettings").onclick = resetSettings

  document.getElementById("pdfPageFormat").onchange = updatePreviewDynamically
  document.getElementById("pdfOrientation").onchange = updatePreviewDynamically

  // Real-time margin events - Fixed to update immediately
  ;["pdfMarginTop", "pdfMarginRight", "pdfMarginBottom", "pdfMarginLeft", "pdfMarginUnit"].forEach((id) => {
    const element = document.getElementById(id)
    element.oninput = updatePreviewDynamically // Real-time update on input
    element.onchange = updatePreviewDynamically
    element.onkeyup = updatePreviewDynamically // Also update on key release
  })

  document.getElementById("pdfPasswordProtected").onchange = handlePasswordProtectionChange
  document.getElementById("pdfPassword").oninput = updateSecuritySettings
  document.getElementById("pdfPasswordConfirm").oninput = updateSecuritySettings

  // document.getElementById("pdfWatermarkType").onchange = handleWatermarkTypeChange
  // document.getElementById("pdfWatermarkText").oninput = updatePreviewDynamically
  // document.getElementById("pdfWatermarkFontSize").onchange = updatePreviewDynamically
  // document.getElementById("pdfWatermarkColor").onchange = updatePreviewDynamically
  // document.getElementById("pdfWatermarkOpacity").oninput = handleWatermarkOpacityChange
  // document.getElementById("pdfWatermarkPosition").onchange = updatePreviewDynamically
  // document.getElementById("pdfWatermarkRotation").oninput = handleWatermarkRotationChange
  // document.getElementById("pdfWatermarkImage").onchange = handleWatermarkImageChange

  // document.getElementById("pdfPageSelection").onchange = handlePageSelectionChange
  // document.getElementById("pdfCustomPages").onchange = updatePreviewDynamically

  // document.getElementById("pdfSearch").onclick = toggleSearch
  // document.getElementById("pdfSearchClose").onclick = closeSearch
  // document.getElementById("pdfSearchInput").oninput = performSearch
  // document.getElementById("pdfSearchPrev").onclick = () => navigateSearchResults(-1)
  // document.getElementById("pdfSearchNext").onclick = () => navigateSearchResults(1)

  document.getElementById("pdfDownload").onclick = downloadPDFDirect
  document.getElementById("pdfPrint").onclick = printPDF

  document.addEventListener("keydown", handleKeyboardShortcuts)
}

// New element reordering functions
window.moveElementUp = (elementId, pageIndex) => {
  const iframe = document.querySelector(".pdf-preview-iframe")
  if (iframe && iframe.contentWindow && iframe.contentWindow.reorderElement) {
    const success = iframe.contentWindow.reorderElement(elementId, "up", pageIndex)
    if (success) {
      updateElementOrderInData(elementId, "up", pageIndex)
    }
  }
}

window.moveElementDown = (elementId, pageIndex) => {
  const iframe = document.querySelector(".pdf-preview-iframe")
  if (iframe && iframe.contentWindow && iframe.contentWindow.reorderElement) {
    const success = iframe.contentWindow.reorderElement(elementId, "down", pageIndex)
    if (success) {
      updateElementOrderInData(elementId, "down", pageIndex)
    }
  }
}

window.handleElementSelection = (elementId, pageIndex) => {
  // Handle element selection for future enhancements
  pdfSystemData.selectedElement = { id: elementId, pageIndex: pageIndex }

  // Visual feedback in iframe
  const iframe = document.querySelector(".pdf-preview-iframe")
  if (iframe && iframe.contentDocument) {
    const containers = iframe.contentDocument.querySelectorAll(".pdf-element-container")
    containers.forEach((container) => {
      container.classList.remove("selected")
    })

    const selectedContainer = iframe.contentDocument.querySelector(`[data-element-id="${elementId}"]`)
    if (selectedContainer) {
      selectedContainer.classList.add("selected")
    }
  }
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

  // Swap elements in the order array
  const temp = currentOrder[currentIndex]
  currentOrder[currentIndex] = currentOrder[newIndex]
  currentOrder[newIndex] = temp

  // Update the original content to reflect new order
  updateOriginalContentOrder(pageIndex)
}

function updateOriginalContentOrder(pageIndex) {
  if (!pdfSystemData.originalContent[pageIndex] || !pdfSystemData.originalContent[pageIndex].elements) return

  const page = pdfSystemData.originalContent[pageIndex]
  const newElementOrder = pdfSystemData.elementOrder[pageIndex]

  // Reorder elements array based on new order
  const reorderedElements = []
  newElementOrder.forEach((elementId) => {
    const element = page.elements.find((el) => el.id === elementId)
    if (element) {
      reorderedElements.push(element)
    }
  })

  page.elements = reorderedElements

  // Apply changes to editor when preview is closed
  applyReorderingToEditor()
}

function applyReorderingToEditor() {
  // This function will be called when the preview is closed
  // to apply the reordering changes back to the main editor
  if (!editor || !pdfSystemData.originalContent) return

  try {
    pdfSystemData.originalContent.forEach((page, pageIndex) => {
      if (!page.elements || !pdfSystemData.elementOrder[pageIndex]) return

      const newOrder = pdfSystemData.elementOrder[pageIndex]
      const wrapper = editor.getWrapper()

      // Find components in the editor that correspond to reordered elements
      newOrder.forEach((elementId, newIndex) => {
        const component = wrapper.find(`#${elementId}`)[0]
        if (component) {
          // Move component to new position
          const parent = component.parent()
          if (parent) {
            const components = parent.components()
            const currentIndex = components.indexOf(component)

            if (currentIndex !== -1 && currentIndex !== newIndex) {
              // Remove from current position
              components.remove(component)
              // Insert at new position
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

// Enhanced direct download function with backend password protection
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

    // Capture external components as images before generating PDF
    const contentWithImages = await captureExternalComponentsAsImages(filteredContent)

    // Check if password protection is enabled
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

// New function to generate PDF and encrypt with backend
async function generateAndEncryptPDFWithBackend(htmlContent) {
  try {
    // First generate a temporary PDF using the existing method
    const tempPdfBlob = await generateTempPDFBlob(htmlContent)

    // Prepare form data for backend
    const formData = new FormData()
    formData.append("pdf", tempPdfBlob, "temp.pdf")
    formData.append("password", pdfSystemData.settings.security.password)


    // Send to backend for encryption
    const response = await fetch(`${BACKEND_URL}/encrypt-pdf`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
      throw new Error(errorData.message || `Server error: ${response.status}`)
    }

    // Download the encrypted PDF
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

    // Fallback to client-side generation without encryption
    await generatePDFWithLibraries(htmlContent)
  }
}

// Helper function to generate temporary PDF blob
async function generateTempPDFBlob(htmlContent) {
  const tempContainer = document.createElement("div")
  tempContainer.style.position = "absolute"
  tempContainer.style.left = "-9999px"
  tempContainer.style.top = "0"
  tempContainer.style.width = "210mm"
  tempContainer.style.background = "white"
  tempContainer.innerHTML = htmlContent
  document.body.appendChild(tempContainer)

  try {
    // Wait for external components to load
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Ensure all external components are rendered
    const charts = tempContainer.querySelectorAll(".chart-container, canvas, iframe")
    charts.forEach((chart) => {
      chart.style.display = "block"
      chart.style.visibility = "visible"
    })

    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: tempContainer.scrollWidth,
      height: tempContainer.scrollHeight,
      onclone: (clonedDoc) => {
        // Ensure external components are visible in cloned document
        const clonedCharts = clonedDoc.querySelectorAll(".chart-container, canvas, iframe, .external-component")
        clonedCharts.forEach((el) => {
          el.style.display = "block"
          el.style.visibility = "visible"
        })
      },
    })

    const { jsPDF } = window.jspdf
    const format = pdfSystemData.settings.pageFormat.toUpperCase()
    const orientation = pdfSystemData.settings.orientation

    const pdf = new jsPDF({
      orientation: orientation,
      unit: "mm",
      format: format,
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    // Apply margins correctly
    const margins = pdfSystemData.settings.margins
    const imgWidth = pageWidth - (margins.left + margins.right)
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    const imgData = canvas.toDataURL("image/png")
    pdf.addImage(imgData, "PNG", margins.left, margins.top, imgWidth, imgHeight)

    // Return as blob for backend processing
    return pdf.output("blob")
  } finally {
    document.body.removeChild(tempContainer)
  }
}

// Original PDF generation function (for non-encrypted PDFs)
async function generatePDFWithLibraries(htmlContent) {
  const tempContainer = document.createElement("div")
  tempContainer.style.position = "absolute"
  tempContainer.style.left = "-9999px"
  tempContainer.style.top = "0"
  tempContainer.style.width = "210mm"
  tempContainer.style.background = "white"
  tempContainer.innerHTML = htmlContent
  document.body.appendChild(tempContainer)

  try {
    // Wait longer for external components to load
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Ensure all external components are rendered
    const charts = tempContainer.querySelectorAll(".chart-container, canvas, iframe")
    charts.forEach((chart) => {
      chart.style.display = "block"
      chart.style.visibility = "visible"
    })

    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: tempContainer.scrollWidth,
      height: tempContainer.scrollHeight,
      onclone: (clonedDoc) => {
        // Ensure external components are visible in cloned document
        const clonedCharts = clonedDoc.querySelectorAll(".chart-container, canvas, iframe, .external-component")
        clonedCharts.forEach((el) => {
          el.style.display = "block"
          el.style.visibility = "visible"
        })
      },
    })

    const { jsPDF } = window.jspdf
    const format = pdfSystemData.settings.pageFormat.toUpperCase()
    const orientation = pdfSystemData.settings.orientation

    const pdf = new jsPDF({
      orientation: orientation,
      unit: "mm",
      format: format,
    })

    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    // Apply margins correctly
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

// function handleZoomChange() {
//   const zoomSelect = document.getElementById("pdfZoom")
//   pdfSystemData.zoomLevel = zoomSelect.value
//   applyZoom()
// }

// function applyZoom() {
//   const iframe = document.querySelector(".pdf-preview-iframe")
//   if (!iframe) return

//   const zoomValue = pdfSystemData.zoomLevel

//   if (zoomValue === "fit") {
//     iframe.style.width = "100%"
//     iframe.style.transform = "scale(1)"
//   } else if (zoomValue === "fitPage") {
//     const container = document.querySelector(".pdf-content-wrapper")
//     const containerWidth = container.clientWidth - 40
//     const containerHeight = container.clientHeight - 40

//     const naturalWidth = Number.parseFloat(iframe.style.width) || 800
//     const naturalHeight = Number.parseFloat(iframe.style.height) || 1000

//     const scaleX = containerWidth / naturalWidth
//     const scaleY = containerHeight / naturalHeight
//     const scale = Math.min(scaleX, scaleY)

//     iframe.style.transform = `scale(${scale})`
//   } else {
//     const scale = Number.parseFloat(zoomValue)
//     iframe.style.transform = `scale(${scale})`
//   }
// }

function toggleSettings() {
  const panel = document.getElementById("pdfSettingsPanel")
  panel.style.display = panel.style.display === "none" ? "block" : "none"
}

// Fixed real-time preview update function
function updatePreviewDynamically() {
  updateSettingsFromUI()

  const fullContent = prepareEnhancedHTMLContent(pdfSystemData.originalContent)
  pdfSystemData.currentContent = fullContent

  const iframe = document.querySelector(".pdf-preview-iframe")
  if (iframe) {
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
    iframeDoc.open()
    iframeDoc.write(fullContent)
    iframeDoc.close()

    iframe.style.height = getPreviewHeight()

    // Wait for content to load before applying zoom
    setTimeout(() => {
    //  applyZoom()
    }, 100)
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

  // pdfSystemData.settings.watermark.type = document.getElementById("pdfWatermarkType").value
  // pdfSystemData.settings.watermark.text = document.getElementById("pdfWatermarkText").value
  // pdfSystemData.settings.watermark.fontSize =
  //   Number.parseInt(document.getElementById("pdfWatermarkFontSize").value) || 48
  // pdfSystemData.settings.watermark.color = document.getElementById("pdfWatermarkColor").value
  // pdfSystemData.settings.watermark.opacity = Number.parseFloat(document.getElementById("pdfWatermarkOpacity").value)
  // pdfSystemData.settings.watermark.position = document.getElementById("pdfWatermarkPosition").value
  // pdfSystemData.settings.watermark.rotation =
  //   Number.parseInt(document.getElementById("pdfWatermarkRotation").value) || 0

  // pdfSystemData.settings.pageSelection = document.getElementById("pdfPageSelection").value
  // pdfSystemData.settings.customPages = document.getElementById("pdfCustomPages").value

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

// function handleWatermarkTypeChange() {
//   toggleWatermarkOptions()
//   updatePreviewDynamically()
// }

// function toggleWatermarkOptions() {
//   const type = document.getElementById("pdfWatermarkType").value
//   const textOptions = document.getElementById("pdfWatermarkTextOptions")
//   const imageOptions = document.getElementById("pdfWatermarkImageOptions")
//   const commonOptions = document.getElementById("pdfWatermarkCommonOptions")

//   textOptions.style.display = type === "text" ? "block" : "none"
//   imageOptions.style.display = type === "image" ? "block" : "none"
//   commonOptions.style.display = type !== "none" ? "block" : "none"
// }

// function handleWatermarkOpacityChange() {
//   const opacity = document.getElementById("pdfWatermarkOpacity").value
//   document.getElementById("pdfWatermarkOpacityValue").textContent = Math.round(opacity * 100) + "%"
//   updatePreviewDynamically()
// }

// function handleWatermarkRotationChange() {
//   const rotation = document.getElementById("pdfWatermarkRotation").value
//   document.getElementById("pdfWatermarkRotationValue").textContent = rotation + "°"
//   updatePreviewDynamically()
// }

// function handleWatermarkImageChange() {
//   const fileInput = document.getElementById("pdfWatermarkImage")
//   const file = fileInput.files[0]

//   if (file) {
//     const reader = new FileReader()
//     reader.onload = (e) => {
//       pdfSystemData.settings.watermark.image = e.target.result
//       updatePreviewDynamically()
//     }
//     reader.readAsDataURL(file)
//   }
// }

// function handlePageSelectionChange() {
//   toggleCustomPageRange()
//   updatePreviewDynamically()
// }

// function toggleCustomPageRange() {
//   const selection = document.getElementById("pdfPageSelection").value
//   const customRange = document.getElementById("pdfCustomPageRange")
//   customRange.style.display = selection === "custom" ? "block" : "none"
// }

// function toggleSearch() {
//   const searchBar = document.getElementById("pdfSearchBar")
//   searchBar.style.display = searchBar.style.display === "none" ? "flex" : "none"

//   if (searchBar.style.display === "flex") {
//     document.getElementById("pdfSearchInput").focus()
//   }
// }

// function closeSearch() {
//   document.getElementById("pdfSearchBar").style.display = "none"
//   clearSearchHighlights()
// }

// function performSearch() {
//   const searchTerm = document.getElementById("pdfSearchInput").value.toLowerCase()
//   const iframe = document.querySelector(".pdf-preview-iframe")

//   if (!searchTerm || !iframe) {
//     clearSearchHighlights()
//     return
//   }

//   clearSearchHighlights()

//   const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
//   const textNodes = getTextNodes(iframeDoc.body)

//   pdfSystemData.searchResults = []
//   pdfSystemData.currentSearchIndex = 0

//   textNodes.forEach((node, index) => {
//     const text = node.textContent.toLowerCase()
//     let startIndex = 0

//     while (true) {
//       const foundIndex = text.indexOf(searchTerm, startIndex)
//       if (foundIndex === -1) break

//       pdfSystemData.searchResults.push({
//         node: node,
//         start: foundIndex,
//         length: searchTerm.length,
//         index: index,
//       })

//       startIndex = foundIndex + 1
//     }
//   })

//   highlightSearchResults()
//   updateSearchResultsDisplay()
// }

// function getTextNodes(element) {
//   const textNodes = []
//   const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false)

//   let node
//   while ((node = walker.nextNode())) {
//     if (node.textContent.trim()) {
//       textNodes.push(node)
//     }
//   }

//   return textNodes
// }

// function highlightSearchResults() {
//   pdfSystemData.searchResults.forEach((result, index) => {
//     const node = result.node
//     const text = node.textContent
//     const before = text.substring(0, result.start)
//     const match = text.substring(result.start, result.start + result.length)
//     const after = text.substring(result.start + result.length)

//     const highlightClass =
//       index === pdfSystemData.currentSearchIndex ? "pdf-highlight pdf-highlight-current" : "pdf-highlight"

//     const wrapper = document.createElement("span")
//     wrapper.innerHTML = `${before}<span class="${highlightClass}">${match}</span>${after}`

//     node.parentNode.replaceChild(wrapper, node)
//   })
// }

// function clearSearchHighlights() {
//   const iframe = document.querySelector(".pdf-preview-iframe")
//   if (!iframe) return

//   const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
//   const highlights = iframeDoc.querySelectorAll(".pdf-highlight")

//   highlights.forEach((highlight) => {
//     const parent = highlight.parentNode
//     parent.replaceChild(document.createTextNode(highlight.textContent), highlight)
//     parent.normalize()
//   })
// }

// function navigateSearchResults(direction) {
//   if (pdfSystemData.searchResults.length === 0) return

//   pdfSystemData.currentSearchIndex += direction

//   if (pdfSystemData.currentSearchIndex < 0) {
//     pdfSystemData.currentSearchIndex = pdfSystemData.searchResults.length - 1
//   } else if (pdfSystemData.currentSearchIndex >= pdfSystemData.searchResults.length) {
//     pdfSystemData.currentSearchIndex = 0
//   }

//   highlightSearchResults()
//   scrollToCurrentSearchResult()
//   updateSearchResultsDisplay()
// }

// function scrollToCurrentSearchResult() {
//   if (pdfSystemData.searchResults.length === 0) return

//   const iframe = document.querySelector(".pdf-preview-iframe")
//   if (!iframe) return

//   const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
//   const currentHighlight = iframeDoc.querySelector(".pdf-highlight-current")

//   if (currentHighlight) {
//     currentHighlight.scrollIntoView({ behavior: "smooth", block: "center" })
//   }
// }

// function updateSearchResultsDisplay() {
//   const resultsSpan = document.getElementById("pdfSearchResults")
//   if (pdfSystemData.searchResults.length > 0) {
//     resultsSpan.textContent = `${pdfSystemData.currentSearchIndex + 1} of ${pdfSystemData.searchResults.length}`
//   } else {
//     resultsSpan.textContent = "No results"
//   }
// }

// function getSelectedPages() {
//   const selection = pdfSystemData.settings.pageSelection
//   const totalPages = pdfSystemData.totalPages
//   const pages = []

//   switch (selection) {
//     case "all":
//       for (let i = 1; i <= totalPages; i++) {
//         pages.push(i)
//       }
//       break

//     case "odd":
//       for (let i = 1; i <= totalPages; i += 2) {
//         pages.push(i)
//       }
//       break

//     case "even":
//       for (let i = 2; i <= totalPages; i += 2) {
//         pages.push(i)
//       }
//       break

//     case "custom":
//       const customPages = pdfSystemData.settings.customPages
//       const ranges = customPages.split(",")

//       ranges.forEach((range) => {
//         range = range.trim()
//         if (range.includes("-")) {
//           const [start, end] = range.split("-").map((n) => Number.parseInt(n.trim()))
//           for (let i = start; i <= end && i <= totalPages; i++) {
//             if (i >= 1 && !pages.includes(i)) {
//               pages.push(i)
//             }
//           }
//         } else {
//           const page = Number.parseInt(range)
//           if (page >= 1 && page <= totalPages && !pages.includes(page)) {
//             pages.push(page)
//           }
//         }
//       })
//       break
//   }

//   return pages.sort((a, b) => a - b)
// }

// function createFilteredContent(pagesToInclude) {
//   const originalContent = pdfSystemData.originalContent
//   const filteredTabs = originalContent.filter((tab, index) => pagesToInclude.includes(index + 1))

//   return prepareEnhancedHTMLContent(filteredTabs)
// }

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

// Enhanced close function that applies reordering changes to editor
function closePDFPreview() {
  const modal = document.getElementById("pdfPreviewModal")
  modal.style.display = "none"

  // Apply element reordering changes to the main editor
  applyReorderingToEditor()

  //clearSearchHighlights()
  // document.getElementById("pdfSearchBar").style.display = "none"
  document.getElementById("pdfSettingsPanel").style.display = "none"
}

// Initialize the system when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  initializePDFSystem()
})

// Export function for global access
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
  editor.Modal.setTitle("Add Pages From JSON");

  // Create container
  const container = document.createElement('div');
  container.className = "new-table-form";

  // File input
  const fileInput = document.createElement('input');
  fileInput.type = "file";
  fileInput.className = "form-control popupinput2";
  fileInput.style.width = "95%";
  fileInput.accept = "application/json";
  fileInput.multiple = true; // ✅ Important line

  fileInput.id = "importMultiplePageInput";

  // Button
  const addButton = document.createElement('input');
  addButton.type = "button";
  addButton.value = "Add";
  addButton.className = "popupaddbtn";
  addButton.id = "import-multiple-file";

  // Append elements
  container.appendChild(fileInput);
  container.appendChild(addButton);

  // Set modal content and open
  editor.Modal.setContent('');
  editor.Modal.setContent(container);
  editor.Modal.open();

  // Bind logic
  addButton.addEventListener("click", importMultipleFiles, true);
}


function importMultipleFiles() {
  const input = document.getElementById("importMultiplePageInput");
  const files = Array.from(input.files);

  if (!files.length) {
    alert("No files selected");
    return;
  }

  files.forEach((file) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const pageData = JSON.parse(e.target.result);

        // Create a new page (slide/component/etc.) – update as needed
        const wrapper = editor.getWrapper();

        // Optional: Add each page as a separate container div
        const container = wrapper.append(`<div class="imported-page" data-filename="${file.name}"></div>`)[0];

        container.components(pageData.html);
        editor.addStyle(pageData.css);

        for (const cid in pageData.traits) {
          if (pageData.traits.hasOwnProperty(cid)) {
            const comp = wrapper.find(`#${cid}`)[0];
            if (comp) {
              pageData.traits[cid].forEach((traitData) => {
                const trait = comp.getTrait(traitData.name);
                if (trait) {
                  trait.set("value", traitData.value);
                }
              });
            }
          }
        }
      } catch (err) {
        console.error(`Error parsing JSON from file ${file.name}:`, err);
        alert(`Invalid JSON in file: ${file.name}`);
      }
    };

    reader.readAsText(file);
  });

  editor.Modal.close();
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
