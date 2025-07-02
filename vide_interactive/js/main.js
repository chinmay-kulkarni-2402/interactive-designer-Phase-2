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
    formatText,
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

    // Prepare the print content with enhanced page break handling
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Print Document</title>
        <style>
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
            box-sizing: border-box;
          }
          
          @media print {
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
          }
          
          @media print {
            body {
              margin: 0;
              padding: 0;
              background: white;
            }
            
            @page {
              margin: 0.5in;
              size: auto;
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
            
            .page-header-element {
              display: flex !important;
              position: static !important;
              background: transparent !important;
              border: none !important;
              box-shadow: none !important;
            }
            
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
          }
          
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
          
          ${editorCSS}
          
          @media print {
            .${HIDE_CLASS} {
              display: none !important;
            }
            
            .page-break {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        ${processedHTML}
      </body>
      </html>
    `;

    // Write content to iframe
    const frameDoc =
      printFrame.contentDocument || printFrame.contentWindow.document;
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
