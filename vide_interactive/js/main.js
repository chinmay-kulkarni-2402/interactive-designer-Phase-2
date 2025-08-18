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
    customSections,
    addFormattedRichTextComponent,
    marqueTag,
    addQRBarcodeComponent,
   // jsonTableComponent,
    registerCustomShapes,
   // customJsonTable,
    customTableOfContents,
    addLiveLineChartComponent,
   // loadCustomTextboxComponent,
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
    "pageBreakPlugin",
    "grapesjsHideOnPrint",
    window.addEventListener('load', () => {
  drawingTool(editor);
}), 
  ],
  pluginsOpts: {
    "grapesjs-plugin-toolbox": {
      panels: true,
    },
    "page-manager-component": {
      category: "Pages",
      defaultPages: ["Home"],
    },
    grapesjsHideOnPrint: {
      label: "Hide on print",
      traitName: "hideOnPrint",
      className: "hide-on-print",
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
      "https://code.highcharts.com/stock/highstock.js",
      "https://code.highcharts.com/highcharts-3d.js",
      "https://code.highcharts.com/highcharts-more.js",
      "https://code.highcharts.com/modules/data.js",
      "https://code.highcharts.com/modules/exporting.js",
      "https://code.highcharts.com/modules/accessibility.js",
      "https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.4/moment.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/numeral.js/2.0.6/numeral.min.js",
      "https://cdn.jsdelivr.net/npm/bwip-js/dist/bwip-js-min.js",
      "https://code.highcharts.com/modules/drilldown.js",
      "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
      "https://cdn.datatables.net/1.11.5/js/jquery.dataTables.min.js",
      "https://code.jquery.com/jquery-3.6.0.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js",
      "https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js",
      "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js",
    ],
  },
});

// // Add CSS for fixed A4 page size with visible boundary in editor too
// const styleEl = document.createElement("style");
// styleEl.innerHTML = `
//   .gjs-page {
//     width: 210mm;
//     height: 297mm;
//     border: 1px solid #ccc;
//     margin: auto;
//     padding: 10mm;
//     box-sizing: border-box;
//     background: white;
//     page-break-after: always;
//   }

//   @media print {
//     body * { visibility: hidden; }
//     .print-container, .print-container * { visibility: visible; }
//     .print-container { position: absolute; top: 0; left: 0; }
//   }
// `;
// document.head.appendChild(styleEl);

// // Ensure all pages get the gjs-page class and show A4 in editor
// editor.Pages.getAll().forEach(page => {
//   page.getMainComponent().addClass('gjs-page');
// });
// editor.on('page:add', page => {
//   page.getMainComponent().addClass('gjs-page');
// });

// // Max A4 height in pixels (approx.)
// const MAX_PAGE_HEIGHT_PX = 297 * 3.78 - (20 * 3.78); // height - padding

// // Function to check and split overflowing content into a new page
// function splitIfOverflow(page) {
//   const iframe = editor.Canvas.getFrameEl();
//   const doc = iframe.contentDocument;
//   const el = doc.querySelector('.gjs-page');
//   const mainComp = page.getMainComponent();

//   if (el && el.scrollHeight > MAX_PAGE_HEIGHT_PX) {
//     const newPage = editor.Pages.add({ name: `Page ${editor.Pages.getAll().length + 1}` });
//     const newMain = newPage.getMainComponent();
//     newMain.addClass('gjs-page');

//     // Move overflowing components
//     while (el.scrollHeight > MAX_PAGE_HEIGHT_PX && mainComp.components().length > 1) {
//       const lastChild = mainComp.components().pop();
//       newMain.components().add(lastChild);
//     }

//     // Automatically switch to the new page so user continues there
//     editor.Pages.select(newPage);
//     return newPage;
//   }
//   return page;
// }

// // Live split while editing
// editor.on('component:update', () => {
//   const currentPage = editor.Pages.getSelected();
//   const nextPage = splitIfOverflow(currentPage);
//   if (nextPage !== currentPage) {
//     // Focus remains on new page for smooth continuation
//     editor.Pages.select(nextPage);
//   }
// });

// // Add Pages Manager button
// editor.Panels.addButton('options', {
//   id: 'open-pages-manager',
//   className: 'fa fa-copy',
//   attributes: { title: 'Pages Manager' },
//   command: 'open-pages-manager'
// });

// // Add Print All Pages button
// editor.Panels.addButton('options', {
//   id: 'print-all-pages',
//   className: 'fa fa-print',
//   attributes: { title: 'Print All Pages' },
//   command: 'print-all-pages'
// });

// // Command to open Pages Manager
// editor.Commands.add('open-pages-manager', {
//   run(ed) {
//     const pages = ed.Pages.getAll();
//     let html = `<div style="font-family: sans-serif;">`;

//     pages.forEach((page, idx) => {
//       const name = page.get('name') || `Page ${idx + 1}`;
//       const selected = page === ed.Pages.getSelected() ? ' (current)' : '';
//       html += `
//         <div style="margin-bottom: 8px; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
//           <strong>${name}${selected}</strong><br>
//           <button data-action="select" data-id="${page.getId()}">Select</button>
//           <button data-action="rename" data-id="${page.getId()}">Rename</button>
//           <button data-action="delete" data-id="${page.getId()}">Delete</button>
//         </div>
//       `;
//     });

//     html += `
//       <hr>
//       <button id="add-page-btn">+ Add New Page</button>
//     </div>`;

//     ed.Modal.open({
//       title: 'Pages Manager',
//       content: html
//     });

//     const modalEl = ed.Modal.getContentEl();

//     modalEl.querySelectorAll('button[data-action]').forEach(btn => {
//       btn.addEventListener('click', () => {
//         const action = btn.dataset.action;
//         const pageId = btn.dataset.id;
//         const page = ed.Pages.get(pageId);

//         if (action === 'select') {
//           ed.Pages.select(page);
//         }
//         else if (action === 'rename') {
//           const newName = prompt('Enter new page name:', page.get('name'));
//           if (newName) page.set('name', newName);
//         }
//         else if (action === 'delete') {
//           if (confirm('Delete this page?')) ed.Pages.remove(page);
//         }

//         ed.Commands.run('open-pages-manager');
//       });
//     });

//     modalEl.querySelector('#add-page-btn').addEventListener('click', () => {
//       const name = prompt('Enter page name:', `Page ${pages.length + 1}`);
//       ed.Pages.add({ name: name || `Page ${pages.length + 1}` });
//       ed.Commands.run('open-pages-manager');
//     });
//   }
// });

// // Print all pages command
// editor.Commands.add('print-all-pages', {
//   run(ed) {
//     const pages = ed.Pages.getAll();
//     const printContainer = document.createElement('div');
//     printContainer.classList.add('print-container');

//     pages.forEach(page => {
//       const html = page.getMainComponent().toHTML();
//       const pageDiv = document.createElement('div');
//       pageDiv.classList.add('gjs-page');
//       pageDiv.innerHTML = html;
//       printContainer.appendChild(pageDiv);
//     });

//     document.body.appendChild(printContainer);
//     window.print();
//     document.body.removeChild(printContainer);
//   }
// });

// // Function to insert JSON data and auto-split into pages
// function insertJsonData(data) {
//   let currentPage = editor.Pages.getSelected();
//   let currentContainer = currentPage.getMainComponent();

//   data.forEach(item => {
//     currentContainer.append(`<p>${item.text}</p>`);
//     const nextPage = splitIfOverflow(currentPage);
//     currentPage = nextPage; // always continue on new page if split
//     currentContainer = currentPage.getMainComponent();
//   });

//   // Make sure editor shows the last page after insertion
//   editor.Pages.select(currentPage);
// }
// // Export all pages into one HTML looking exactly like print
// editor.on('run:export-template', () => {
//   const pages = editor.Pages.getAll();

//   // Your A4 CSS styling for HTML + print
//   const pageCSS = `
//     body {
//       background: #e5e5e5;
//       padding: 20px 0;
//     }
//     .gjs-page {
//       width: 210mm;
//       height: 297mm;
//       border: 1px solid #ccc;
//       margin: auto;
//       padding: 10mm;
//       box-sizing: border-box;
//       background: white;
//       page-break-after: always;
//     }
//     @media print {
//       body {
//         background: white;
//         padding: 0;
//       }
//       .gjs-page {
//         border: none;
//         margin: 0;
//         box-shadow: none;
//         page-break-after: always;
//       }
//     }
//   `;

//   let allPagesHtml = '';
//   pages.forEach(page => {
//     allPagesHtml += `<div class="gjs-page">${page.getMainComponent().toHTML()}</div>`;
//   });

//   const fullHtml = `
//     <!DOCTYPE html>
//     <html>
//     <head>
//       <meta charset="utf-8">
//       <style>${pageCSS}</style>
//     </head>
//     <body>
//       ${allPagesHtml}
//     </body>
//     </html>
//   `;

//   // Create and download HTML file
//   const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
//   saveAs(blob, 'all-pages.html');
// });

// // Initialize the page manager after editor is loaded
let pageManager = null;
let pageSetupManager = null;

editor.on("load", () => {
  // Safely attempt to get page manager plugin
  pageManager = editor.Plugins?.get?.("page-manager-component");

  // Initialize Page Setup Manager
  pageSetupManager = new PageSetupManager(editor);
});

const pn = editor.Panels;
const panelViews = pn.addPanel({
  id: "views",
});

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
]);

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
    //   id: "filterTable",
    //   attributes: { title: "Report Parameter", id: "filterTable" },
    //   className: "fa fa-search",
    // },
  ]);

var el = document.getElementById("exportPDF");
el.addEventListener("click", generatePrintDialog, true);
var save = document.getElementById("savePage");
save.addEventListener("click", savePage, true);

var importPage = document.getElementById("importPage");
importPage.addEventListener("click", importSinglePages, true);

// var filterBtn = document.getElementById("filterTable");
// let filtersEnabled = false;
// const activeFilters = new Map(); // Store active filters per table & column
// filterBtn.addEventListener("click", () => {
//   const canvasDoc = editor.Canvas.getDocument();
//   const tables = canvasDoc.querySelectorAll('table');
//   if (!tables.length) {
//     alert('No table found in the canvas!');
//     return;
//   }
//   if (!filtersEnabled) {
//     tables.forEach((table, tableIndex) => {
//       const headers = table.querySelectorAll('th');
//       headers.forEach((th, colIndex) => {
//         if (th.querySelector('.filter-icon')) return;
//         const icon = document.createElement('i');
//         icon.className = 'filter-icon fa fa-search';
//         icon.style.cssText = 'cursor:pointer;position:absolute;right:15px;top:50%;transform:translateY(-50%);';
//         icon.onclick = () => {
//           showFilterModal(th.innerText.trim(), table, colIndex, tableIndex);
//         };
//         th.style.position = 'relative';
//         th.appendChild(icon);
//       });
//     });
//     filtersEnabled = true;
//   } else {
//     // Disable all filters & reset
//     tables.forEach((table, tableIndex) => {
//       table.querySelectorAll('th .filter-icon').forEach(i => i.remove());
//       table.querySelectorAll('tbody tr').forEach(row => {
//         row.style.display = '';
//       });
//     });
//     activeFilters.clear();
//     removeModal();
//     filtersEnabled = false;
//   }
// }, true);
// function showFilterModal(columnName, table, colIndex, tableIndex) {
//   removeModal(); // remove existing modal if any
//   const modal = document.createElement('div');
//   modal.id = 'filterModal';
//   modal.style.cssText = `
//     position: fixed;
//     top: 50%; left: 50%;
//     transform: translate(-50%, -50%);
//     background: white;
//     border: 1px solid #ccc;
//     padding: 20px;
//     z-index: 1000;
//     box-shadow: 0 4px 12px rgba(0,0,0,0.15);
//     min-width: 298px;
//     border-radius: 8px;
//   `;
//   // Get clean column name (remove any existing filter icons)
//   const cleanColumnName = columnName;
//   modal.innerHTML = `
//     <h3 style="margin-top:0">Report Parameter</h3>
//     <p style="margin: 10px 0;">${cleanColumnName}</p>
//     <input type="text" id="filterValue" placeholder="Search..." style="width: 100%; padding: 5px; margin-bottom: 15px;">
//     <div style="text-align: right;">
//       <button id="filterOK" style="margin-right: 10px;">OK</button>
//       <button id="filterCancel">Cancel</button>
//     </div>
//   `;
//   document.body.appendChild(modal);
//   document.getElementById('filterOK').onclick = () => {
//     const value = document.getElementById('filterValue').value.trim().toLowerCase();
//     const key = `${tableIndex}-${colIndex}`;
//     if (value) {
//       activeFilters.set(key, { value, table, colIndex });
//     } else {
//       activeFilters.delete(key);
//     }
//     applyAllFilters();
//     removeModal();
//   };
//   document.getElementById('filterCancel').onclick = removeModal;
// }
// function removeModal() {
//   const modal = document.getElementById('filterModal');
//   if (modal) modal.remove();
// }
// function applyAllFilters() {
//   // Reset all rows first
//   const tableGroups = new Map();
//   activeFilters.forEach(({ table, colIndex }) => {
//     const rows = table.querySelectorAll('tbody tr');
//     tableGroups.set(table, rows);
//   });
//   tableGroups.forEach((rows, table) => {
//     rows.forEach(row => {
//       row.style.display = ''; // Reset display
//     });
//   });
//   // Apply filters cumulatively
//   activeFilters.forEach(({ value, table, colIndex }) => {
//     const rows = table.querySelectorAll('tbody tr');
//     rows.forEach(row => {
//       const cell = row.children[colIndex];
//       const text = cell?.textContent.toLowerCase() || '';
//       if (!text.includes(value)) {
//         row.style.display = 'none';
//       }
//     });
//   });
// }

// Enhanced PDF generation function with proper page break support
// Enhanced PDF generation function with exact Bootstrap print support
function generatePrintDialog() {
  try {
    if (typeof editor === "undefined") {
      console.error(
        "The 'editor' variable is not defined. Ensure it is properly initialized or imported."
      );
      alert("Editor not initialized. Please check the console for details.");
      return;
    }

    const editorHTML = editor.getHtml();
    const editorCSS = editor.getCss();
    console.log("html", editorHTML);
    
    // Create a hidden iframe for printing
    const printFrame = document.createElement("iframe");
    printFrame.style.position = "absolute";
    printFrame.style.left = "-9999px";
    printFrame.style.top = "0";
    printFrame.style.width = "100%";
    printFrame.style.height = "100%";
    printFrame.style.border = "none";

    document.body.appendChild(printFrame);

    // Get hide-on-print class name
    const HIDE_CLASS = "hide-on-print";

    // Process HTML to handle page breaks properly
    const processedHTML = processPageBreaks(editorHTML);

    // Enhanced function to convert Bootstrap classes and preserve ALL table styling
    function convertBootstrapToInlineStyles(html) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Get the current iframe document to access formula data and styling
      const currentIframeDoc = editor.Canvas.getDocument();
      
      // Helper function to extract all computed styles from an element
      function extractAllStyles(sourceElement, targetElement) {
        if (!sourceElement || !targetElement) return;
        
        // Get computed styles from the source element
        const computedStyle = window.getComputedStyle(sourceElement);
        const inlineStyle = sourceElement.style;
        
        // Preserve all visual styles
        const stylesToPreserve = [
          'background-color', 'background', 'background-image', 'background-repeat', 'background-position', 'background-size',
          'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
          'border-color', 'border-style', 'border-width',
          'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
          'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style',
          'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
          'border-radius', 'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius',
          'color', 'font-family', 'font-size', 'font-weight', 'font-style',
          'text-align', 'vertical-align', 'text-decoration', 'text-transform',
          'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
          'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
          'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
          'opacity', 'box-shadow', 'text-shadow', 'border-collapse'
        ];
        
        // First, copy inline styles (highest priority)
        for (let i = 0; i < inlineStyle.length; i++) {
          const property = inlineStyle[i];
          const value = inlineStyle.getPropertyValue(property);
          const priority = inlineStyle.getPropertyPriority(property);
          if (value) {
            targetElement.style.setProperty(property, value, priority || 'important');
          }
        }
        
        // Then, copy computed styles for important visual properties
        stylesToPreserve.forEach(property => {
          const value = computedStyle.getPropertyValue(property);
          if (value && value !== 'initial' && value !== 'inherit' && value !== 'auto' && value !== 'none') {
            // Only set if not already set by inline styles
            if (!inlineStyle.getPropertyValue(property)) {
              targetElement.style.setProperty(property, value, 'important');
            }
          }
        });

        if (sourceElement.hasAttribute('data-running-total-cell') || 
    sourceElement.hasAttribute('data-running-total-for') ||
    sourceElement.hasAttribute('data-running-total-value')) {
  
  // Copy all running total attributes
  ['data-running-total-cell', 'data-running-total-for', 'data-running-total-value', 'data-running-total-header'].forEach(attr => {
    if (sourceElement.hasAttribute(attr)) {
      targetElement.setAttribute(attr, sourceElement.getAttribute(attr));
    }
  });
  
  // Ensure running total cell content is preserved
  if (sourceElement.hasAttribute('data-running-total-value')) {
    const runningValue = sourceElement.getAttribute('data-running-total-value');
    const displayValue = parseFloat(runningValue);
    if (!isNaN(displayValue)) {
      targetElement.textContent = displayValue.toFixed(2);
    }
  }
}
        // Special handling for JSON tables with default black borders
        if (sourceElement.tagName === 'TABLE' || sourceElement.tagName === 'TH' || sourceElement.tagName === 'TD') {
          // Check if this is a JSON table (has data attributes or is within custom_table)
          const isJsonTable = sourceElement.hasAttribute('data-display-value') || 
                             sourceElement.hasAttribute('data-formula') ||
                             sourceElement.closest('[data-i_designer-type="custom_table"]');
          
          if (isJsonTable) {
            // Preserve the default JSON table styling
            if (sourceElement.tagName === 'TABLE') {
              targetElement.style.setProperty('border-collapse', 'collapse', 'important');
              if (!targetElement.style.border) {
                targetElement.style.setProperty('border', '1px solid #000', 'important');
              }
            }
            
            if (sourceElement.tagName === 'TH' || sourceElement.tagName === 'TD') {
              if (!targetElement.style.border) {
                targetElement.style.setProperty('border', '1px solid #000', 'important');
              }
              if (!targetElement.style.padding) {
                targetElement.style.setProperty('padding', '8px', 'important');
              }
              if (!targetElement.style.textAlign) {
                targetElement.style.setProperty('text-align', 'left', 'important');
              }
            }
            
            if (sourceElement.tagName === 'TH') {
              if (!targetElement.style.fontWeight) {
                targetElement.style.setProperty('font-weight', 'bold', 'important');
              }
              if (!targetElement.style.backgroundColor) {
                targetElement.style.setProperty('background-color', '#e0e0e0', 'important');
              }
            }
          }
        }
      }
      
      // First, handle all custom tables and DataTables
      const allTables = tempDiv.querySelectorAll('table, [id*="table"], [data-i_designer-type="custom_table"] table');
      allTables.forEach(table => {
        const tableId = table.id;
        let parentContainer = table.closest('[data-i_designer-type="custom_table"]');
        
        // If it's inside a custom table container, get the container ID
        let containerId = null;
        if (parentContainer) {
          containerId = parentContainer.id;
        }
        
        // Find corresponding table in current iframe to get current data AND styling
        let sourceTable = null;
        let sourceContainer = null;
        
        if (currentIframeDoc) {
          if (containerId) {
            sourceContainer = currentIframeDoc.getElementById(containerId);
            if (sourceContainer) {
              sourceTable = sourceContainer.querySelector('table');
            }
          } else if (tableId) {
            sourceTable = currentIframeDoc.getElementById(tableId);
          }
          
          // For JSON tables, also try to find by table ID within custom containers
          if (!sourceTable && tableId) {
            const allCustomContainers = currentIframeDoc.querySelectorAll('[data-i_designer-type="custom_table"]');
            allCustomContainers.forEach(container => {
              const innerTable = container.querySelector(`#${tableId}`);
              if (innerTable) {
                sourceTable = innerTable;
                sourceContainer = container;
              }
            });
          }
        }
        
        // Remove DataTables wrapper and controls
        const wrapper = table.closest('.dataTables_wrapper');
        if (wrapper) {
          // Extract the table from wrapper
          const parent = wrapper.parentNode;
          parent.insertBefore(table, wrapper);
          parent.removeChild(wrapper);
        }
        
        // Preserve table-level styling from source
        if (sourceTable) {
          extractAllStyles(sourceTable, table);
        }
        
        // Ensure basic table structure for print
        table.className = (table.className || '') + ' table table-bordered print-table';
        table.style.setProperty('width', '100%', 'important');
        table.style.setProperty('border-collapse', 'collapse', 'important');
        table.style.setProperty('page-break-inside', 'auto', 'important');
        
        // Process table headers with style preservation
        const headers = table.querySelectorAll('thead th, thead td');
        headers.forEach((header, headerIndex) => {
          // Find corresponding source header
          let sourceHeader = null;
          if (sourceTable) {
            const sourceHeaderRow = sourceTable.querySelector('thead tr');
            if (sourceHeaderRow && sourceHeaderRow.cells[headerIndex]) {
              sourceHeader = sourceHeaderRow.cells[headerIndex];
            }
          }
          
          // Preserve header styling
          if (sourceHeader) {
            extractAllStyles(sourceHeader, header);
          } else {
            // Apply default JSON table header styling if no source found
            header.style.setProperty('border', '1px solid #000', 'important');
            header.style.setProperty('padding', '8px', 'important');
            header.style.setProperty('text-align', 'left', 'important');
            header.style.setProperty('vertical-align', 'middle', 'important');
            header.style.setProperty('font-weight', 'bold', 'important');
            header.style.setProperty('background-color', '#e0e0e0', 'important');
          }
          
          // Handle header content - check for divs, spans, or direct text
          const headerDiv = header.querySelector('div');
          const headerSpan = header.querySelector('.cell-display, span');
          
          let content = '';
          
          if (sourceHeader) {
            // Get the display value from the source
            const displaySpan = sourceHeader.querySelector('.cell-display');
            const displayValue = sourceHeader.getAttribute('data-display-value');
            
            if (displaySpan && displaySpan.textContent) {
              content = displaySpan.textContent;
            } else if (displayValue) {
              content = displayValue;
            } else {
              // For JSON tables, extract from div content
              const sourceDiv = sourceHeader.querySelector('div');
              if (sourceDiv) {
                content = sourceDiv.textContent || sourceDiv.innerText || '';
              } else {
                content = sourceHeader.textContent || sourceHeader.innerText || '';
              }
            }
          }
          
          // Fallback to current content if no source found
          if (!content) {
            if (headerDiv) {
              content = headerDiv.textContent || headerDiv.innerHTML;
            } else if (headerSpan) {
              content = headerSpan.textContent || headerSpan.innerHTML;
            } else {
              content = header.textContent || header.innerHTML;
            }
          }
          
          header.innerHTML = content.trim();
        });
        
        // Process table body cells with enhanced data extraction AND style preservation
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach((row, rowIndex) => {
          // Preserve row styling
          let sourceRow = null;
          if (sourceTable) {
            const sourceBodyRows = sourceTable.querySelectorAll('tbody tr');
            if (sourceBodyRows[rowIndex]) {
              sourceRow = sourceBodyRows[rowIndex];
              extractAllStyles(sourceRow, row);
            }
          }
          
          row.style.setProperty('page-break-inside', 'avoid', 'important');
          row.style.setProperty('break-inside', 'avoid', 'important');
          
         const cells = row.querySelectorAll('td, th');
cells.forEach((cell, cellIndex) => {
  let sourceCell = null;
  if (sourceRow && sourceRow.cells[cellIndex]) {
    sourceCell = sourceRow.cells[cellIndex];
    // Preserve all cell styling
    extractAllStyles(sourceCell, cell);
  } else {
    // Apply default JSON table cell styling if no source found
    cell.style.setProperty('border', '1px solid #000', 'important');
    cell.style.setProperty('padding', '8px', 'important');
    cell.style.setProperty('text-align', 'left', 'important');
    cell.style.setProperty('vertical-align', 'middle', 'important');
  }
  
  // Ensure basic print cell styling (only if not already styled)
  if (!cell.style.border) {
    cell.style.setProperty('border', '1px solid #333', 'important');
  }
  if (!cell.style.padding) {
    cell.style.setProperty('padding', '8px', 'important');
  }
  if (!cell.style.textAlign) {
    cell.style.setProperty('text-align', 'left', 'important');
  }
  if (!cell.style.verticalAlign) {
    cell.style.setProperty('vertical-align', 'middle', 'important');
  }
  cell.style.setProperty('word-break', 'break-word', 'important');
  
  let content = '';
  
  // PRIORITY: Check for running total cells first
  if (sourceCell && (sourceCell.hasAttribute('data-running-total-cell') || sourceCell.hasAttribute('data-running-total-header'))) {
    // Copy running total attributes
    ['data-running-total-cell', 'data-running-total-for', 'data-running-total-value', 'data-running-total-header'].forEach(attr => {
      if (sourceCell.hasAttribute(attr)) {
        cell.setAttribute(attr, sourceCell.getAttribute(attr));
      }
    });
    
    if (sourceCell.hasAttribute('data-running-total-value')) {
      // This is a running total data cell
      const runningValue = sourceCell.getAttribute('data-running-total-value');
      const displayValue = parseFloat(runningValue);
      content = !isNaN(displayValue) ? displayValue.toFixed(2) : runningValue;
    } else if (sourceCell.hasAttribute('data-running-total-header')) {
      // This is a running total header cell
      content = sourceCell.textContent || sourceCell.innerText || 'Running Total';
    } else {
      // Fallback to regular cell content extraction
      content = sourceCell.textContent || sourceCell.innerText || '';
    }
  } else {
    // Regular cell processing (existing logic)
    
    // Try to get data from source table first
    if (sourceCell) {
      // For JSON tables, prioritize data-display-value attribute
      const displayValue = sourceCell.getAttribute('data-display-value');
      const formulaValue = sourceCell.getAttribute('data-formula');
      const displaySpan = sourceCell.querySelector('.cell-display');
      
      if (displayValue !== null && displayValue !== '') {
        content = displayValue;
      } else if (displaySpan && displaySpan.textContent.trim()) {
        content = displaySpan.textContent.trim();
      } else if (formulaValue && !formulaValue.startsWith('=')) {
        content = formulaValue;
      } else {
        // Get text content but exclude input values
        const inputs = sourceCell.querySelectorAll('input');
        let cellText = sourceCell.textContent || sourceCell.innerText || '';
        
        // Remove input values from text content
        inputs.forEach(input => {
          if (input.value && cellText.includes(input.value)) {
            cellText = cellText.replace(input.value, '').trim();
          }
        });
        
        content = cellText;
      }
      
      // If we have a formula, try to get calculated result
      if (!content && formulaValue && formulaValue.startsWith('=')) {
        // Look for any text that's not the formula itself
        const allText = sourceCell.textContent || sourceCell.innerText || '';
        if (allText && allText !== formulaValue) {
          content = allText;
        }
      }
    }
    
    // Fallback to current cell content if no source data found
    if (!content) {
      // Check for data attributes first (common in JSON tables)
      const displayValue = cell.getAttribute('data-display-value');
      if (displayValue !== null && displayValue !== '') {
        content = displayValue;
      } else {
        const cellDiv = cell.querySelector('div');
        const cellSpan = cell.querySelector('.cell-display, span');
        
        if (cellDiv) {
          content = cellDiv.textContent || cellDiv.innerHTML;
        } else if (cellSpan) {
          content = cellSpan.textContent || cellSpan.innerHTML;
        } else {
          content = cell.textContent || cell.innerHTML;
        }
      }
    }
  }
  
  // Clean up content and set it
  content = content.replace(/^\s+|\s+$/g, ''); // Trim whitespace
  content = content.replace(/\n\s*\n/g, '\n'); // Remove multiple newlines
  
  cell.innerHTML = content || '';
  
  // Remove any remaining input elements for print
  const inputs = cell.querySelectorAll('input');
  inputs.forEach(input => input.remove());
  
  // Remove formula indicators for print (but keep running total attributes)
  cell.style.setProperty('position', 'relative', 'important');
  if (!cell.hasAttribute('data-running-total-cell') && !cell.hasAttribute('data-running-total-header')) {
    cell.removeAttribute('data-formula');
    cell.removeAttribute('data-display-value');
    cell.removeAttribute('data-cell-ref');
  }
});
        });
        
        // Ensure thead is properly displayed
        const thead = table.querySelector('thead');
        if (thead) {
          if (sourceTable) {
            const sourceThead = sourceTable.querySelector('thead');
            if (sourceThead) {
              extractAllStyles(sourceThead, thead);
            }
          }
          thead.style.setProperty('display', 'table-header-group', 'important');
          thead.style.setProperty('page-break-after', 'avoid', 'important');
        }
        
        // Ensure tbody is properly displayed
        const tbody = table.querySelector('tbody');
        if (tbody) {
          if (sourceTable) {
            const sourceTbody = sourceTable.querySelector('tbody');
            if (sourceTbody) {
              extractAllStyles(sourceTbody, tbody);
            }
          }
          tbody.style.setProperty('display', 'table-row-group', 'important');
        }
      });
      
      // Process all elements with Bootstrap classes (keep existing Bootstrap logic)
      const allElements = tempDiv.querySelectorAll('*');
      
      allElements.forEach(element => {
        const classList = Array.from(element.classList);
        let computedStyles = {};
        
        // Handle container classes
        if (classList.includes('container') || classList.includes('container-fluid')) {
          computedStyles.width = '100%';
          computedStyles.maxWidth = 'none';
          computedStyles.margin = '0';
          computedStyles.padding = '0';
        }
        
        // Handle row classes
        if (classList.includes('row')) {
          computedStyles.display = 'flex';
          computedStyles.flexWrap = 'wrap';
          computedStyles.margin = '0';
          computedStyles.width = '100%';
          computedStyles.minHeight = 'auto';
        }
        
        // Handle column classes - check all possible Bootstrap column classes
        let isColumn = false;
        classList.forEach(className => {
          // Handle col-* classes
          if (className.match(/^col-(\d+)$/)) {
            const colSize = parseInt(className.split('-')[1]);
            computedStyles.flex = `0 0 ${(colSize / 12) * 100}%`;
            computedStyles.maxWidth = `${(colSize / 12) * 100}%`;
            computedStyles.position = 'relative';
            computedStyles.width = '100%';
            isColumn = true;
          }
          
          // Handle col-sm-*, col-md-*, col-lg-*, col-xl-* classes
          if (className.match(/^col-(sm|md|lg|xl)-(\d+)$/)) {
            const colSize = parseInt(className.split('-')[2]);
            computedStyles.flex = `0 0 ${(colSize / 12) * 100}%`;
            computedStyles.maxWidth = `${(colSize / 12) * 100}%`;
            computedStyles.position = 'relative';
            computedStyles.width = '100%';
            isColumn = true;
          }
          
          // Handle plain col class
          if (className === 'col') {
            computedStyles.flex = '1 0 0%';
            computedStyles.position = 'relative';
            computedStyles.width = '100%';
            isColumn = true;
          }
        });
        
        // For columns, ensure proper height calculation
        if (isColumn) {
          const hasContent = element.textContent.trim().length > 0 || element.children.length > 0;
          if (hasContent) {
            computedStyles.minHeight = 'auto';
            computedStyles.height = 'auto';
          } else {
            computedStyles.minHeight = '45px';
          }
          
          computedStyles.boxSizing = 'border-box';
          computedStyles.display = 'block';
        }
        
        // Apply computed styles as inline styles (only if not conflicting with preserved styles)
        Object.keys(computedStyles).forEach(property => {
          const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
          // Only apply if the element doesn't already have this style set
          if (!element.style.getPropertyValue(cssProperty)) {
            element.style.setProperty(cssProperty, computedStyles[property], 'important');
          }
        });
      });
      
      return tempDiv.innerHTML;
    }

    // Convert Bootstrap classes to inline styles with enhanced table preservation
    const processedHTMLWithInlineStyles = convertBootstrapToInlineStyles(processedHTML);

    // Prepare the print content with comprehensive print support
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Print Document</title>
        <style>
          /* Global reset and print setup */
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box !important;
          }
          
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            font-family: Arial, sans-serif !important;
            line-height: 1.4 !important;
            color: #333 !important;
          }
          
          @page {
            margin: 0.5in !important;
            size: auto !important;
          }
          
          /* Enhanced table print styles with FULL style preservation */
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box !important;
            }
            
            /* Table-specific print styles - preserve ALL styling */
            table.print-table,
            table.table,
            table.dataTable,
            table[id*="table"],
            [data-i_designer-type="custom_table"] table {
              width: 100% !important;
              border-collapse: collapse !important;
              page-break-inside: auto !important;
              margin: 10px 0 !important;
              display: table !important;
              visibility: visible !important;
              opacity: 1 !important;
              /* Preserve custom styling - DO NOT override border, background, colors if already set */
            }
            
            table.print-table thead,
            table.table thead,
            table.dataTable thead,
            table[id*="table"] thead,
            [data-i_designer-type="custom_table"] table thead {
              display: table-header-group !important;
              page-break-after: avoid !important;
              page-break-inside: avoid !important;
              break-after: avoid !important;
              break-inside: avoid !important;
            }
            
            table.print-table tbody,
            table.table tbody,
            table.dataTable tbody,
            table[id*="table"] tbody,
            [data-i_designer-type="custom_table"] table tbody {
              display: table-row-group !important;
            }
            
            table.print-table tr,
            table.table tr,
            table.dataTable tr,
            table[id*="table"] tr,
            [data-i_designer-type="custom_table"] table tr {
              display: table-row !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            
            table.print-table th,
            table.print-table td,
            table.table th,
            table.table td,
            table.dataTable th,
            table.dataTable td,
            table[id*="table"] th,
            table[id*="table"] td,
            [data-i_designer-type="custom_table"] table th,
            [data-i_designer-type="custom_table"] table td {
              display: table-cell !important;
              word-break: break-word !important;
              position: relative !important;
              /* DO NOT override styling that was already preserved inline */
            }
            
            /* Only apply fallback styling if no inline styles exist */
            table th:not([style*="border"]),
            table td:not([style*="border"]) {
              border: 1px solid #333 !important;
            }
            
            table th:not([style*="padding"]),
            table td:not([style*="padding"]) {
              padding: 6px 8px !important;
            }
            
            table th:not([style*="text-align"]),
            table td:not([style*="text-align"]) {
              text-align: left !important;
            }
            
            table th:not([style*="vertical-align"]),
            table td:not([style*="vertical-align"]) {
              vertical-align: middle !important;
            }
            
            table th:not([style*="background"]) {
              background-color: #f2f2f2 !important;
            }
            
            table th:not([style*="font-weight"]) {
              font-weight: bold !important;
            }
            
            /* Hide all input elements in tables */
            table input,
            table .cell-input,
            [data-i_designer-type="custom_table"] input,
            [data-i_designer-type="custom_table"] .cell-input {
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
              position: absolute !important;
              left: -9999px !important;
              width: 0 !important;
              height: 0 !important;
            }
            
            /* Ensure display spans are visible */
            table .cell-display,
            [data-i_designer-type="custom_table"] .cell-display {
              display: block !important;
              visibility: visible !important;
              opacity: 1 !important;
              position: static !important;
              width: 100% !important;
              height: auto !important;
            }
            
            /* Hide DataTables controls */
            .dataTables_wrapper .dataTables_length,
            .dataTables_wrapper .dataTables_filter,
            .dataTables_wrapper .dataTables_info,
            .dataTables_wrapper .dataTables_paginate,
            .dataTables_wrapper .dataTables_processing,
            .dt-buttons,
            .dataTables_scrollHead,
            .dataTables_scrollFoot {
              display: none !important;
              visibility: hidden !important;
              height: 0 !important;
              width: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            /* Force table visibility on all pages */
            .dataTables_wrapper,
            .dataTables_scroll,
            .dataTables_scrollBody {
              display: block !important;
              width: 100% !important;
              height: auto !important;
              overflow: visible !important;
              position: static !important;
            }
            
            /* Custom table containers - Enhanced for JSON tables */
            [data-i_designer-type="custom_table"] {
              display: block !important;
              visibility: visible !important;
              opacity: 1 !important;
              width: 100% !important;
              height: auto !important;
              overflow: visible !important;
              position: static !important;
            }
            
            /* Enhanced JSON table styling with stronger specificity */
            [data-i_designer-type="custom_table"] table {
              width: 100% !important;
              border-collapse: collapse !important;
              border: 1px solid #000 !important;
              page-break-inside: auto !important;
              margin: 10px 0 !important;
              display: table !important;
              visibility: visible !important;
              opacity: 1 !important;
            }
            
            [data-i_designer-type="custom_table"] table th,
            [data-i_designer-type="custom_table"] table td {
              display: table-cell !important;
              border: 1px solid #000 !important;
              padding: 8px !important;
              text-align: left !important;
              vertical-align: middle !important;
              position: relative !important;
              word-break: break-word !important;
            }
            
            [data-i_designer-type="custom_table"] table th {
              font-weight: bold !important;
              background-color: #e0e0e0 !important;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            [data-i_designer-type="custom_table"] table td {
              background-color: #fff !important;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            /* Override any conflicting styles for JSON tables */
            [data-i_designer-type="custom_table"] table[style*="border-collapse"] {
              border-collapse: collapse !important;
            }
            
            [data-i_designer-type="custom_table"] table th[style*="border"],
            [data-i_designer-type="custom_table"] table td[style*="border"] {
              /* Keep existing border styles if they exist */
            }
            
            /* Fallback styling for JSON tables if no inline styles */
            [data-i_designer-type="custom_table"] table th:not([style*="border"]),
            [data-i_designer-type="custom_table"] table td:not([style*="border"]) {
              border: 1px solid #000 !important;
            }
            
            [data-i_designer-type="custom_table"] table th:not([style*="padding"]),
            [data-i_designer-type="custom_table"] table td:not([style*="padding"]) {
              padding: 8px !important;
            }
            
            [data-i_designer-type="custom_table"] table th:not([style*="background"]) {
              background-color: #e0e0e0 !important;
            }
            
            [data-i_designer-type="custom_table"] table td:not([style*="background"]) {
              background-color: #fff !important;
            }
            
            /* Preserve all background colors and images */
            *[style*="background-color"],
            *[style*="background"],
            *[class*="bg-"] {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            /* Bootstrap Grid System - Force Layout */
            .container,
            .container-fluid {
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 0 !important;
              display: block !important;
            }
            
            .row {
              display: flex !important;
              flex-wrap: wrap !important;
              margin: 0 !important;
              width: 100% !important;
              min-height: auto !important;
              height: auto !important;
            }
            
            /* Force all column classes to work with proper height */
            [class*="col-"] {
              position: relative !important;
              width: 100% !important;
              display: block !important;
              float: none !important;
              min-height: auto !important;
              height: auto !important;
              box-sizing: border-box !important;
            }
            
            /* Specific column widths with proper height handling */
            .col-1, .col-sm-1, .col-md-1, .col-lg-1, .col-xl-1 { 
              flex: 0 0 8.333333% !important; 
              max-width: 8.333333% !important; 
              min-height: auto !important;
              height: auto !important;
            }
            .col-2, .col-sm-2, .col-md-2, .col-lg-2, .col-xl-2 { 
              flex: 0 0 16.666667% !important; 
              max-width: 16.666667% !important; 
              min-height: auto !important;
              height: auto !important;
            }
            .col-3, .col-sm-3, .col-md-3, .col-lg-3, .col-xl-3 { 
              flex: 0 0 25% !important; 
              max-width: 25% !important; 
              min-height: auto !important;
              height: auto !important;
            }
            .col-4, .col-sm-4, .col-md-4, .col-lg-4, .col-xl-4 { 
              flex: 0 0 33.333333% !important; 
              max-width: 33.333333% !important; 
              min-height: auto !important;
              height: auto !important;
            }
            .col-5, .col-sm-5, .col-md-5, .col-lg-5, .col-xl-5 { 
              flex: 0 0 41.666667% !important; 
              max-width: 41.666667% !important; 
              min-height: auto !important;
              height: auto !important;
            }
            .col-6, .col-sm-6, .col-md-6, .col-lg-6, .col-xl-6 { 
              flex: 0 0 50% !important; 
              max-width: 50% !important; 
              min-height: auto !important;
              height: auto !important;
            }
            .col-7, .col-sm-7, .col-md-7, .col-lg-7, .col-xl-7 { 
              flex: 0 0 58.333333% !important; 
              max-width: 58.333333% !important; 
              min-height: auto !important;
              height: auto !important;
            }
            .col-8, .col-sm-8, .col-md-8, .col-lg-8, .col-xl-8 { 
              flex: 0 0 66.666667% !important; 
              max-width: 66.666667% !important; 
              min-height: auto !important;
              height: auto !important;
            }
            .col-9, .col-sm-9, .col-md-9, .col-lg-9, .col-xl-9 { 
              flex: 0 0 75% !important; 
              max-width: 75% !important; 
              min-height: auto !important;
              height: auto !important;
            }
            .col-10, .col-sm-10, .col-md-10, .col-lg-10, .col-xl-10 { 
              flex: 0 0 83.333333% !important; 
              max-width: 83.333333% !important; 
              min-height: auto !important;
              height: auto !important;
            }
            .col-11, .col-sm-11, .col-md-11, .col-lg-11, .col-xl-11 { 
              flex: 0 0 91.666667% !important; 
              max-width: 91.666667% !important; 
              min-height: auto !important;
              height: auto !important;
            }
            .col-12, .col-sm-12, .col-md-12, .col-lg-12, .col-xl-12 { 
              flex: 0 0 100% !important; 
              max-width: 100% !important; 
              min-height: auto !important;
              height: auto !important;
            }
            
            /* Auto columns */
            .col, .col-sm, .col-md, .col-lg, .col-xl {
              flex: 1 0 0% !important;
              max-width: 100% !important;
              min-height: auto !important;
              height: auto !important;
            }
            
            /* Bootstrap utility classes */
            .d-flex { display: flex !important; }
            .d-block { display: block !important; }
            .d-inline { display: inline !important; }
            .d-inline-block { display: inline-block !important; }
            
            .justify-content-start { justify-content: flex-start !important; }
            .justify-content-end { justify-content: flex-end !important; }
            .justify-content-center { justify-content: center !important; }
            .justify-content-between { justify-content: space-between !important; }
            .justify-content-around { justify-content: space-around !important; }
            
            .align-items-start { align-items: flex-start !important; }
            .align-items-end { align-items: flex-end !important; }
            .align-items-center { align-items: center !important; }
            .align-items-baseline { align-items: baseline !important; }
            .align-items-stretch { align-items: stretch !important; }
            
            /* Text alignment */
            .text-left { text-align: left !important; }
            .text-center { text-align: center !important; }
            .text-right { text-align: right !important; }
            .text-justify { text-align: justify !important; }
            
            /* Hide on print */
            .${HIDE_CLASS} {
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
              height: 0 !important;
              width: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              overflow: hidden !important;
            }
            
            /* Page break handling */
            .page-break {
              display: none !important;
              visibility: hidden !important;
              height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              page-break-before: always !important;
              break-before: page !important;
            }
            
            .page-break + * {
              page-break-before: always !important;
              break-before: page !important;
            }
            
            .force-page-break {
              page-break-before: always !important;
              break-before: page !important;
            }
            
            /* Editor specific elements */
            .page-indicator,
            .virtual-sections-panel,
            .section-panel-toggle,
            .page-section-label,
            .page-section-dashed-line {
              display: none !important;
            }
            
            .page-container {
              page-break-after: always !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
              width: 100% !important;
              height: auto !important;
              display: block !important;
              overflow: visible !important;
            }
            
            .page-content {
              width: 100% !important;
              height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: visible !important;
            }
            
            .main-content-area {
              width: 100% !important;
              height: auto !important;
              overflow: visible !important;
              position: relative !important;
            }

            .page-section {
              border: none !important;
              background: transparent !important;
            }
            
            .page-header-element,
            .page-footer-element {
              display: flex !important;
              position: static !important;
              background: transparent !important;
              border: none !important;
              box-shadow: none !important;
            }
            
            .page-number-element {
              display: flex !important;
              position: absolute !important;
              background: transparent !important;
              border: none !important;
              box-shadow: none !important;
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
            
            /* Ensure tables appear on all pages */
            .page-container table,
            .main-content-area table,
            [data-i_designer-type="custom_table"] table {
              display: table !important;
              visibility: visible !important;
              opacity: 1 !important;
            }
          }
          
          /* Screen styles */
          @media screen {
            body {
              font-family: Arial, sans-serif;
              line-height: 1.4;
              color: #333;
              background: white;
              margin: 0;
            }
          }
          
          /* Original editor CSS */
          ${editorCSS}
        </style>
      </head>
      <body>
        ${processedHTMLWithInlineStyles}
      </body>
      </html>
    `;

    // Write content to iframe
    const frameDoc = printFrame.contentDocument || printFrame.contentWindow.document;
    frameDoc.open();
    frameDoc.write(printContent);
    frameDoc.close();

    // Wait for content to load, then trigger print dialog
    printFrame.onload = () => {
      setTimeout(() => {
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();

        // Cleanup after print dialog is triggered
        setTimeout(() => {
          if (document.body.contains(printFrame)) {
            document.body.removeChild(printFrame);
          }
        }, 100);
      }, 500);
    };
  } catch (error) {
    console.error("Error generating print dialog:", error);
    alert("Error opening print dialog. Please try again.");
  }
}

function processPageBreaks(html) {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  const pageBreaks = tempDiv.querySelectorAll(".page-break");

  pageBreaks.forEach((pageBreak) => {
    const nextElement = pageBreak.nextElementSibling;
    if (nextElement) {
      nextElement.classList.add("force-page-break");
    }

    pageBreak.classList.add("hide-on-print");
    pageBreak.setAttribute("data-page-break", "true");
  });

  return tempDiv.innerHTML;
}

// Preserve all existing functionality
var singlePageData = JSON.parse(localStorage.getItem("single-page")) || {};
if (Object.keys(singlePageData).length > 0) {
  editor.setComponents(singlePageData);
}

var pageName = "index";
function savePage() {
  editor.Modal.setTitle("Add Page Name");
  editor.Modal.setContent(`<div class="new-table-form">
  <div> 
      <input type="text" class="form-control class="popupaddbtn"" value="" placeholder="Enter page name" style="width:95%"  name="singleSavePageName" id="singleSavePageName">
  </div>  
  <input id="saveSinglePage" type="button" value="Add" class="popupaddbtn" data-component-id="c1006">
  </div>
  </div>
  `);
  editor.Modal.open();
  var el = document.getElementById("saveSinglePage");
  el.addEventListener("click", downloadPage, true);
}

function downloadPage() {
  const pageName = document.getElementById("singleSavePageName").value;
  if (!pageName) {
    alert("Page name required");
    return false;
  }

  const html = editor.getHtml();
  const css = editor.getCss();
  const components = editor.getComponents();
  const style = editor.getStyle();

  const pageData = {
    html,
    css,
    components: components.toJSON(),
    style: style.toJSON(),
    traits: {},
  };

  editor
    .getWrapper()
    .find("[data-i_designer-type]")
    .forEach((comp) => {
      pageData.traits[comp.cid] = comp.getTraits().map((trait) => ({
        name: trait.attributes.name,
        value: trait.get("value"),
      }));
    });

  const dataStr =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(pageData));
  const downloadAnchorNode = document.createElement("a");
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", pageName + ".json");
  document.body.appendChild(downloadAnchorNode);
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
  editor.Modal.close();
}

// *********start resize and drag code ***********

editor.on('component:add', function (component) {
  // Add resizable & rotatable options if not set
  if (!component.get('resizable')) {
    component.set('resizable', {
      tl: 1, tc: 1, tr: 1,
      cl: 1, cr: 1,
      bl: 1, bc: 1, br: 1,
      minDim: 20,
      maxDim: 2000,
      step: 1,
      unitHeight: 'px',
      unitWidth: 'px',
      handleSize: 8,
      rotator: true,
    });
  }
});

editor.BlockManager.add('draggable-section-container', {
  label: 'Draggable Container',
  category: 'Basic',
  media: '<svg viewBox="0 0 24 24">\n        <path fill="currentColor" d="M2 20h20V4H2v16Zm-1 0V4a1 1 0 0 1 1-1h20a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1Z"/>\n      </svg>',
  content: `
  <style>
      @media print {
        .draggable-section-container {
          border: none !important;
        }
      }
    </style>
    <div class="draggable-section-container" style="position: relative; border: 2px dashed #888; padding: 10px; min-height: 67px;">
      <div class="draggable-child" style="width: 200px; height: 47px;">
        Drag me inside
      </div>
    </div>
  `,
});

// === State variables for drag & rotation ===
let isDragging = false;
let startX = 0;
let startY = 0;
let currentX = 0;
let currentY = 0;
let currentRotation = 0;   // ✅ track rotation
let selectedEl = null;
let parentEl = null;

editor.on('component:selected', (component) => {
  const el = component.getEl();

  // ✅ Enable rotation logic for line & rectangle
  if (component.get('type') === 'line' || component.get('type') === 'rectangle') {
    const resizable = component.get('resizable') || {};
    resizable.rotator = true;

    // ✅ Add rotation handler to merge transform
    resizable.onRotate = (event, { rotation }) => {
      currentRotation = rotation;
      component.addStyle({
        transform: `translate(${currentX}px, ${currentY}px) rotate(${currentRotation}deg)`
      });
    };

    component.set('resizable', resizable);
  }

  // Check if it's a direct child of .custom-container
  if (el?.parentElement?.classList.contains('draggable-section-container')) {
    const parent = el.parentElement;
    parent.style.position = 'relative';
    selectedEl = el;
    parentEl = parent;

    const compId = component.getId();
    const selector = `#${compId}`;

    el.onmousedown = function (e) {
      e.preventDefault();
      isDragging = true;
      startX = e.clientX - currentX;
      startY = e.clientY - currentY;

      document.onmousemove = function (e) {
        if (!isDragging) return;

        const newX = e.clientX - startX;
        const newY = e.clientY - startY;

        const parentRect = parentEl.getBoundingClientRect();
        currentX = Math.max(0, Math.min(newX, parentRect.width - selectedEl.offsetWidth));
        currentY = Math.max(0, Math.min(newY, parentRect.height - selectedEl.offsetHeight));

        // ✅ Merge translate + rotate in drag
        const cssRule = editor.CssComposer.getRule(selector) || editor.CssComposer.add([selector]);
        cssRule.addStyle({
          transform: `translate(${currentX}px, ${currentY}px) rotate(${currentRotation}deg)`
        });
      };

      document.onmouseup = function () {
        isDragging = false;
        document.onmousemove = null;
        document.onmouseup = null;
      };
    };
  } else {
    // If selected component is not child of custom container, disable custom dragging
    if (el) {
      el.onmousedown = null;
    }
  }
});

// ******* END Resize and drag code ***********


function importSinglePages() {
  editor.Modal.setTitle("Add Pages From JSON");

  const container = document.createElement("div");
  container.className = "new-table-form";

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.className = "form-control popupinput2";
  fileInput.style.width = "95%";
  fileInput.accept = "application/json";
  fileInput.multiple = true;
  fileInput.id = "importMultiplePageInput";

  const addButton = document.createElement("input");
  addButton.type = "button";
  addButton.value = "Add";
  addButton.className = "popupaddbtn";
  addButton.id = "import-multiple-file";

  container.appendChild(fileInput);
  container.appendChild(addButton);

  editor.Modal.setContent("");
  editor.Modal.setContent(container);
  editor.Modal.open();

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

        const wrapper = editor.getWrapper();
        const container = wrapper.append(
          `<div class="imported-page" data-filename="${file.name}"></div>`
        )[0];

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

// Remaining utility functions...
function updateComponentsWithNewJson(editor) {
  var jsonDataString = localStorage.getItem("common_json");
  if (!jsonDataString) return;

  var jsonData = [JSON.parse(jsonDataString)];
  let custom_language = localStorage.getItem("language");
  var jsonData2 = jsonData;
  var styleTags2 = editor.getCss();
  var jsonDataNew = {};
  var styleContent = styleTags2;
  var regex = /#(\w+)\s*{\s*[^{}]*my-input-json:\s*([^;]+)\s*;[^{}]*}/g;
  var matches;
  while ((matches = regex.exec(styleContent)) !== null) {
    var divId = matches[1];
    var jsonKey = matches[2];
    var lang = jsonKey;
    jsonDataNew[divId] = lang;
  }
  if (custom_language === null) {
    custom_language = "english";
  }
  const updateDivContenthtml = editor.getHtml();
  for (var divIdLocal in jsonDataNew) {
    var jsonKey2 = jsonDataNew[divIdLocal];
    const str = "jsonData2[0]." + custom_language + "." + jsonKey2;
    var value = eval(str);
    if (divIdLocal && value) {
      var parser = new DOMParser();
      var doc = parser.parseFromString(updateDivContenthtml, "text/html");
      var myDiv = doc.getElementById(divIdLocal);
      if (myDiv) {
        myDiv.textContent = value;
        var component = editor.getWrapper().find(`#${divIdLocal}`)[0];
        if (component) {
          component.components(value);
        }
      }
    }
  }
}

let slides = [];
let transitions = {};
let clickStates = {};
let currentSlideIndex = 1;

editor.on("run:core:canvas-clear", () => {
  const thumbContainer = document.getElementById("slides-thumbnails");
  if (thumbContainer) thumbContainer.remove();
  slides = [];
  transitions = {};
  clickStates = {};
  currentSlideIndex = 1;

});
