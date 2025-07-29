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
      "https://code.highcharts.com/highcharts.js",
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
    {
      id: "backgroundMusic",
      attributes: { title: "Add Background Music", id: "backgroundMusic" },
      className: "fa fa-music",
      command: 'open-background-music-modal', 
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

// var backMusic = document.getElementById("backgroundMusic");
// backMusic.addEventListener("click", addBackgroundMusic, true);


editor.Commands.add('open-background-music-modal', {
  run(editor) {
    const modal = editor.Modal;
    const container = document.createElement('div');
    container.style.padding = '10px';

    container.innerHTML = `
      <div style="margin-bottom: 10px;">
        <label><strong>Audio File Path:</strong></label><br/>
        <input type="text" id="bg-audio-path" style="width: 100%;" placeholder="Enter audio URL or path"/>
      </div>
      <div style="margin-bottom: 10px;">
        <label>
          <input type="checkbox" id="bg-audio-once" />
          Play only once
        </label>
      </div>
      <div style="margin-bottom: 10px;">
        <label>
          <input type="checkbox" id="bg-audio-autoplay" checked />
          Auto-play on page load
        </label>
      </div>
      <div style="margin-bottom: 10px;">
        <label>
          <input type="checkbox" id="bg-audio-controls" />
          Show audio controls
        </label>
      </div>
      <button id="add-bg-audio-btn" class="gjs-btn gjs-btn-prim">Add Background Music</button>
    `;

    modal.setTitle('Add Background Music');
    modal.setContent(container);
    modal.open();

    setTimeout(() => {
      document.getElementById('add-bg-audio-btn').onclick = () => {
        const audioPath = document.getElementById('bg-audio-path').value.trim();
        const playOnce = document.getElementById('bg-audio-once').checked;
        const autoplay = document.getElementById('bg-audio-autoplay').checked;
        const showControls = document.getElementById('bg-audio-controls').checked;

        if (!audioPath) {
          alert('Please enter a valid audio file path.');
          return;
        }

        // Generate unique ID for the audio element
        const audioId = 'bg-audio-' + Date.now();

        const audioAttrs = {
          src: audioPath,
          id: audioId,
          preload: 'auto'
        };

        // Add attributes based on user selection
        if (!playOnce) {
          audioAttrs.loop = true;
        }
        
        if (showControls) {
          audioAttrs.controls = true;
        }

        if (autoplay) {
          audioAttrs.autoplay = true;
        }

        // Create the audio component
        const audioComponent = editor.addComponents({
          tagName: 'audio',
          attributes: audioAttrs,
          style: showControls ? {} : { display: 'none' },
        });

        // Add initialization script to the head
        const head = editor.getWrapper().find('head')[0];
        if (head) {
          head.append({
            tagName: 'script',
            content: `
              // Background Music Auto-play Script
              document.addEventListener('DOMContentLoaded', function() {
                const bgAudio = document.getElementById('${audioId}');
                if (bgAudio) {
                  // For browsers that block autoplay, try to play on user interaction
                  const playAudio = () => {
                    bgAudio.play().catch(e => {
                      console.log('Audio autoplay blocked by browser');
                      // Show a play button if autoplay fails
                      if (!bgAudio.controls) {
                        const playBtn = document.createElement('button');
                        playBtn.innerText = '🎵 Play Background Music';
                        playBtn.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 9999; padding: 10px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;';
                        playBtn.onclick = () => {
                          bgAudio.play();
                          playBtn.remove();
                        };
                        document.body.appendChild(playBtn);
                      }
                    });
                  };
                  
                  // Try to play immediately
                  if (${autoplay}) {
                    playAudio();
                  }
                  
                  // Also try on first user interaction
                  document.addEventListener('click', playAudio, { once: true });
                  document.addEventListener('keydown', playAudio, { once: true });
                }
              });
            `
          });
        } else {
          // If no head element, add script to body
          editor.addComponents({
            tagName: 'script',
            content: `
              // Background Music Auto-play Script
              document.addEventListener('DOMContentLoaded', function() {
                const bgAudio = document.getElementById('${audioId}');
                if (bgAudio) {
                  const playAudio = () => {
                    bgAudio.play().catch(e => {
                      console.log('Audio autoplay blocked by browser');
                      if (!bgAudio.controls) {
                        const playBtn = document.createElement('button');
                        playBtn.innerText = '🎵 Play Background Music';
                        playBtn.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 9999; padding: 10px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;';
                        playBtn.onclick = () => {
                          bgAudio.play();
                          playBtn.remove();
                        };
                        document.body.appendChild(playBtn);
                      }
                    });
                  };
                  
                  if (${autoplay}) {
                    playAudio();
                  }
                  
                  document.addEventListener('click', playAudio, { once: true });
                  document.addEventListener('keydown', playAudio, { once: true });
                }
              });
            `
          });
        }

        modal.close();
        
        // Show success message
        editor.Modal.setTitle('Success');
        editor.Modal.setContent('<div style="padding: 20px; text-align: center;">Background music added successfully!</div>');
        editor.Modal.open();
        setTimeout(() => editor.Modal.close(), 2000);
      };
    }, 0);
  }
});

// Backend URL configuration
const BACKEND_URL = "http://localhost:3000";
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

    // Function to convert Bootstrap classes to inline styles for print
    function convertBootstrapToInlineStyles(html) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      
      // Process all elements with Bootstrap classes
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
          // Ensure row maintains its height
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
        
        // For columns, calculate and preserve actual content height
        if (isColumn) {
          // Get the actual computed height of the element
          const actualElement = document.querySelector(`[class*="col"]`);
          if (actualElement) {
            const computedHeight = window.getComputedStyle(element).height;
            const computedMinHeight = window.getComputedStyle(element).minHeight;
            
            // Use the larger of computed height or content height
            if (computedHeight && computedHeight !== 'auto' && computedHeight !== '0px') {
              computedStyles.minHeight = computedHeight;
            } else {
              // Calculate content height by measuring the element's content
              const contentHeight = element.scrollHeight;
              if (contentHeight > 0) {
                computedStyles.minHeight = `${contentHeight}px`;
              } else {
                // Ensure minimum height for columns with content
                const hasContent = element.textContent.trim().length > 0 || element.children.length > 0;
                if (hasContent) {
                  computedStyles.minHeight = 'auto';
                  computedStyles.height = 'auto';
                } else {
                  computedStyles.minHeight = '45px';
                }
              }
            }
          } else {
            // Fallback: ensure columns have proper height
            const hasContent = element.textContent.trim().length > 0 || element.children.length > 0;
            if (hasContent) {
              computedStyles.minHeight = 'auto';
              computedStyles.height = 'auto';
            } else {
              computedStyles.minHeight = '45px';
            }
          }
          
          // Ensure columns don't collapse
          computedStyles.boxSizing = 'border-box';
          computedStyles.display = 'block';
        }
        
        // Apply computed styles as inline styles
        Object.keys(computedStyles).forEach(property => {
          const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
          element.style.setProperty(cssProperty, computedStyles[property], 'important');
        });
      });
      
      return tempDiv.innerHTML;
    }

    // Convert Bootstrap classes to inline styles
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
          
          /* Force all elements to preserve their computed styles */
          @media print {
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
              box-sizing: border-box !important;
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
            
            /* Ensure columns with inline styles preserve their height */
            [class*="col-"][style*="min-height"] {
              /* Inline styles will take precedence */
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
            
            /* Spacing utilities */
            .m-0 { margin: 0 !important; }
            .mt-0 { margin-top: 0 !important; }
            .mr-0 { margin-right: 0 !important; }
            .mb-0 { margin-bottom: 0 !important; }
            .ml-0 { margin-left: 0 !important; }
            .mx-0 { margin-left: 0 !important; margin-right: 0 !important; }
            .my-0 { margin-top: 0 !important; margin-bottom: 0 !important; }
            
            .p-0 { padding: 0 !important; }
            .pt-0 { padding-top: 0 !important; }
            .pr-0 { padding-right: 0 !important; }
            .pb-0 { padding-bottom: 0 !important; }
            .pl-0 { padding-left: 0 !important; }
            .px-0 { padding-left: 0 !important; padding-right: 0 !important; }
            .py-0 { padding-top: 0 !important; padding-bottom: 0 !important; }
            
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
            
            /* Table fixes */
            table.table-bordered {
              display: table !important;
              width: 100% !important;
              border-collapse: collapse !important;
              margin: 0 !important;
              position: relative !important;
            }
            
            table.table-bordered thead, table.table-bordered tbody {
              display: table-row-group !important;
            }
            
            table.table-bordered tr {
              display: table-row !important;
            }
            
            table.table-bordered th, table.table-bordered td {
              display: table-cell !important;
              border: 1px solid #ddd !important;
              padding: 8px !important;
              text-align: left !important;
              vertical-align: middle !important;
            }
            
            table.table-bordered th {
              background-color: #f2f2f2 !important;
              font-weight: bold !important;
            }
            
            table.table-bordered th div {
              display: block !important;
              margin-right: 0 !important;
            }
            
            table.table-bordered th span {
              display: none !important;
            }
            
            /* Editor specific elements */
            .page-indicator,
            .virtual-sections-panel,
            .section-panel-toggle,
            .page-section-label,
            .page-section-dashed-line {
              display: none !important;
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
            
            /* Force inline styles to take precedence */
            *[style] {
              /* Inline styles will automatically have higher specificity */
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
              padding: 20px;
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
  // Set resizable if not set  
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

let isDragging = false;
let startX = 0;
let startY = 0;
let currentX = 0;
let currentY = 0;
let selectedEl = null;
let parentEl = null;

editor.on('component:selected', (component) => {
  const el = component.getEl();

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

        // Add CSS Rule via CssComposer
        const cssRule = editor.CssComposer.getRule(selector) || editor.CssComposer.add([selector]);
 
        cssRule.addStyle({
        transform: `translate(${currentX}px, ${currentY}px)`,
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
