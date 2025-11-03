
window.editor = InteractiveDesigner.init({
  
  height: "100%",
  container: "#editor",
  fromElement: 1,
  allowScripts: 1,
  telemetry: false,
  showOffsets: true,
  fromElement: true,
  noticeOnUnload: true,
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
    jsontablecustom,
    addFormattedRichTextComponent,
    marqueTag,
    exportPlugin,
    addQRBarcodeComponent,
    registerCustomShapes,
    customTableOfContents,
    addLiveLineChartComponent,
    linkTrackerPlugin,
    backgroundMusic,
   // customFlowColumns,
   // initNotificationsPlugin,
    subreportPlugin,
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
      "https://cdn.jsdelivr.net/npm/hot-formula-parser@4.0.0/dist/formula-parser.min.js",
      "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js",
      "https://cdn.jsdelivr.net/npm/html-docx-js/dist/html-docx.js",
      "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
      "https://cdn.jsdelivr.net/npm/html-to-rtf@2.1.0/app/browser/bundle.min.js"

    ],
  },
});



// window.addEventListener("load", () => {
//   initNotificationsPlugin(editor); // sets up plugin, commands, navbar
//   console.log("hrhrhrhrhrhr")
// });

// Listen to component name or trait updates
// Update layer name when component is selected, updated, or attributes change
editor.on('component:update:name component:update:attributes component:selected', (component) => {
  updateLayerName(component);
});

// Update layer name when a new layer is rendered
editor.on('layer:component', ({ model }) => {
  updateLayerName(model);
});

// Update layer name immediately after a component is dropped/added
editor.on('component:add', (component) => {
  updateLayerName(component);
});

// Update all layers once editor is fully loaded
editor.on('load', () => {
  editor.getComponents().forEach((component) => {
updateLayerName(component)
  });
});

function updateLayerRecursively(component) {
  updateLayerName(component);
  if (component.components && component.components.length) {
    component.components.each(updateLayerRecursively);
  }
}

function updateLayerName(component) {
  if (!component) return;

  const layers = editor.Layers;
  if (!layers) return;

  // Get custom ID from trait if available
  const customId = component.getTrait('id')?.get('value');
  const idToShow = customId || component.getId();

  // Remove existing " #..." suffix
  let baseName = component.getName();
  if (baseName.includes(' #')) baseName = baseName.split(' #')[0];

  // Build name
  const layerName = `${baseName} #${idToShow}`;

  // Delay slightly to ensure GrapesJS finished rendering the layer label

    try {
      layers.setName(component, layerName);
    } catch (err) {
      console.warn('Layer update failed:', err);
    }
}

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
      id: "bulkpage",
      className: "fa fa-files-o",
      attributes: { title: "Bulk PDF Generation", id: "bulkpage" },
      command: "open-modal",
    },

    {
      id: "allTemplateList",
      attributes: { title: "View All Template", id: "allTemplateList" },
      className: "fa fa-list",
    },
    {
      id: "allLogs",
      attributes: { title: "View All Logs", id: "allLogs" },
      className: "fa fa-envelope",
    },
    // {
    //   id: "save-template",
    //   className: "fa fa-save",
    //   attributes: { title: "Save Template", id: "save-template" },
    //   command: "save-template-to-api",
    // },
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


var viewAllPage = document.getElementById("allTemplateList");
viewAllPage.addEventListener("click", viewAllTemplates, true);

var viewAllLogsP = document.getElementById("allLogs");
viewAllLogsP.addEventListener("click", viewAllLogsD, true);

function viewAllTemplates() {
  window.location.href = 'template.html';
}

function viewAllLogsD() {
  window.location.href = 'logs.html';
}

let uploadedJsonFiles = [];
// Updated modal command with hierarchical JSON key selection
editor.Commands.add("open-modal", {
  run(editor) {
    const html = editor.getHtml();
    const css = editor.getCss();
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    // 1️⃣ Collect payload mappings
    const mappingMap = {};
    tempDiv.querySelectorAll("[my-input-json]").forEach(el => {
      const id = el.id || null;
      if (id) {
        const jsonPath = el.getAttribute("my-input-json");
        // Remove language prefix (e.g., "user1.customer_name" becomes "customer_name")
        const pathWithoutLanguage = jsonPath.includes('.') ? jsonPath.split('.').slice(1).join('.') : jsonPath;
        mappingMap[id] = pathWithoutLanguage;
      }
    });

    const cssRegex = /#([\w-]+)\s*{[^}]*my-input-json\s*:\s*([^;]+);/g;
    let match;
    while ((match = cssRegex.exec(css)) !== null) {
      const id = match[1].trim();
      const value = match[2].trim();
      // Remove language prefix from CSS values as well
      const pathWithoutLanguage = value.includes('.') ? value.split('.').slice(1).join('.') : value;
      mappingMap[id] = pathWithoutLanguage;
    }

    const inputJsonMappings = Object.keys(mappingMap).map(id => ({ [id]: mappingMap[id] }));

    const uploadedJsonStr = localStorage.getItem("common_json") || "{}";
    const uploadedJson = JSON.parse(uploadedJsonStr);

    // State objects
    let fileNameSaved = [];      // array of { key, indexes }
    let passwordSaved = [];      // array of { key, indexes }
    let passwordCustom = "";     // string if custom password
    uploadedJsonFiles = [];      // Array of { name, content, fromLocal }



// Load all JSON files from localStorage separately
// Load all JSON files from localStorage separately
for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i);
  if (key.startsWith("common_json")) {
    const content = localStorage.getItem(key);

    try {
      const parsed = JSON.parse(content);

      // ✅ Only push if parsed is an object/array
      if (typeof parsed === "object" && parsed !== null) {
        console.log(`📂 Found JSON in localStorage [${key}]:`, parsed);

        uploadedJsonFiles.push({
          name: `${key}.json`,
          content: content,
          fromLocal: true,
          storageKey: key
        });
      } else {
        console.warn(`⚠️ Skipping ${key} because it’s not a JSON object/array:`, parsed);
      }

    } catch (err) {
      console.warn(`⚠️ Failed to parse JSON from localStorage key: ${key}`, content);
      // ❌ do not push invalid JSONs
    }
  }
}

// 🔹 Immediately render the list so it's shown in modal
setTimeout(() => renderUploadedJsonList(), 0);

// 🔹 Immediately render the list so it's shown in modal
setTimeout(() => renderUploadedJsonList(), 0);

    // Modal HTML
    editor.Modal.open({
      title: "Bulk Export",
      content: `
<div style="height:100%; overflow:auto;">

  <button id="payload-preview-btn" style="margin-bottom:10px; display: none;">View Payload Mappings</button>
  <div id="payload-preview-container"></div>
  
  <h5>Upload JSON Files</h5>
  <input type="file" 
         class="form-control popupinput2"
         accept="application/json,.xml,.json"
         multiple
         style="width:95%"  
         name="importJsonInputFile"
         id="json-upload-input">
  <div id="uploaded-json-list" style="margin-top:10px; font-size:0.9em; color:#333;"></div>

</div>

        <hr>

        <h5>Export Type</h5>
        <select id="export-type-dropdown">
          <option value="pdf">PDF</option>
          <option value="html">HTML</option>
        </select>
        <hr>
        <!-- File Name Section -->
        <h5>File Name</h5>
        <select id="file-name-mode">
          <option value="none">None</option>
          <option value="json">JSON Keys</option>
        </select>

        <div id="file-name-key-section" style="display:none; margin-top:5px;">
          <label>Select Language:</label>
          <select id="file-name-language-dropdown"><option value="">--Select Language--</option></select>
          <div id="file-name-key-dropdown-section" style="display:none; margin-top:5px;">
            <label>Select JSON Key:</label>
            <select id="file-name-key-dropdown"><option value="">--Select Key--</option></select>
          </div>
        </div>

        <div id="file-name-index-section" style="display:none; margin-top:5px;">
          <input type="text" id="file-name-index-input" placeholder="Enter indexes, e.g., 0,1" style="width:70%">
          <button id="file-name-add-btn">Add</button>
        </div>

        <div id="file-name-saved" style="margin-top:5px; font-size:0.9em;"></div>

        <hr>

        <!-- Password Section -->
        <h5>Password</h5>
        <select id="password-mode">
          <option value="none">None</option>
          <option value="json">JSON Keys</option>
          <option value="custom">Custom String</option>
        </select>

        <!-- Password JSON Keys -->
        <div id="password-key-section" style="display:none; margin-top:5px;">
          <label>Select Language:</label>
          <select id="password-language-dropdown"><option value="">--Select Language--</option></select>
          <div id="password-key-dropdown-section" style="display:none; margin-top:5px;">
            <label>Select JSON Key:</label>
            <select id="password-key-dropdown"><option value="">--Select Key--</option></select>
          </div>
        </div>

        <div id="password-index-section" style="display:none; margin-top:5px;">
          <input type="text" id="password-index-input" placeholder="Enter indexes, e.g., 0,1" style="width:70%">
          <button id="password-add-btn">Add</button>
        </div>

<!-- Password Custom -->
<div id="password-custom-section" style="display:none; margin-top:5px;">
  <input type="text" id="password-custom-input" placeholder="Enter custom password" style="width:70%">
  <button id="password-custom-add-btn">Add</button>
</div>

        <div id="password-saved" style="margin-top:5px; font-size:0.9em;"></div>

        <button id="send-api-btn" style="margin-top:15px;">Send</button>
      </div>
      `,
      attributes: { class: "export-modal" }
    });
    // Payload preview button handler
    document.getElementById("payload-preview-btn").addEventListener("click", () => {
      const container = document.getElementById("payload-preview-container");
      container.innerHTML = '';

      inputJsonMappings.forEach((mapping, index) => {
        const [id, jsonPath] = Object.entries(mapping)[0];
        const row = document.createElement("div");
        row.style.cssText = "display:flex; justify-content:space-between; align-items:center; padding:5px; background:#f5f5f5; margin:3px 0; border-radius:3px;";
        row.innerHTML = `
      <span><strong>ID:</strong> ${id} → <strong>Field:</strong> ${jsonPath}</span>
      <button class="remove-mapping-btn" data-index="${index}" style="background:#ff4444; color:white; border:none; padding:3px 8px; cursor:pointer; border-radius:3px;">Cancel</button>
    `;
        container.appendChild(row);
      });

      // Add event listeners for remove buttons
      container.querySelectorAll(".remove-mapping-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const idx = parseInt(e.target.getAttribute("data-index"));
          inputJsonMappings.splice(idx, 1);
          // Refresh the preview
          document.getElementById("payload-preview-btn").click();
        });
      });
    });

    // Helper function to extract keys from nested object
    function extractMetaDataKeys(obj, prefix = '') {
      let keys = [];
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          let newKey;
          if (Array.isArray(obj)) {
            newKey = `${prefix}[${key}]`;
          } else {
            newKey = prefix ? `${prefix}.${key}` : key;
          }
          keys.push(newKey);
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            keys = keys.concat(extractMetaDataKeys(obj[key], newKey));
          }
        }
      }
      return keys;
    }

    // Populate language dropdowns
// Populate language dropdowns - merge all JSON files
const fileNameLanguageDropdown = document.getElementById("file-name-language-dropdown");
const passwordLanguageDropdown = document.getElementById("password-language-dropdown");

// Merge all uploaded JSON files to get language keys
const mergedJson = {};
uploadedJsonFiles.forEach(f => {
  try {
    const jsonData = JSON.parse(f.content);
    Object.assign(mergedJson, jsonData);
  } catch (e) {
    console.warn(`Failed to parse ${f.name}:`, e);
  }
});

const topLevelKeys = Object.keys(mergedJson);
topLevelKeys.forEach(k => {
  const opt1 = document.createElement("option"); opt1.value = k; opt1.textContent = k; fileNameLanguageDropdown.appendChild(opt1);
  const opt2 = document.createElement("option"); opt2.value = k; opt2.textContent = k; passwordLanguageDropdown.appendChild(opt2);
});

    // Mode change handlers
    document.getElementById("file-name-mode").addEventListener("change", e => {
      const val = e.target.value;
      document.getElementById("file-name-key-section").style.display = val === "json" ? "block" : "none";
      document.getElementById("file-name-key-dropdown-section").style.display = "none";
      document.getElementById("file-name-index-section").style.display = "none";
      fileNameSaved = [];
      renderSaved(fileNameSaved, "file-name-saved");
    });

    document.getElementById("password-mode").addEventListener("change", e => {
      const val = e.target.value;
      document.getElementById("password-key-section").style.display = val === "json" ? "block" : "none";
      document.getElementById("password-key-dropdown-section").style.display = "none";
      document.getElementById("password-index-section").style.display = "none";
      document.getElementById("password-custom-section").style.display = val === "custom" ? "block" : "none";
      passwordSaved = [];
      passwordCustom = "";
      renderSaved(passwordSaved, "password-saved");
    });

    // Handle JSON file uploads
document.getElementById("json-upload-input").addEventListener("change", async (e) => {
  const files = Array.from(e.target.files);
  for (const file of files) {
    const text = await file.text();
    uploadedJsonFiles.push({ name: file.name, content: text, fromLocal: false });
  }
  renderUploadedJsonList();
  e.target.value = ""; // reset input
});


    // Render JSON file list
// Render JSON file list
function renderUploadedJsonList() {
  const container = document.getElementById("uploaded-json-list");
  container.innerHTML = "";
  uploadedJsonFiles.forEach((f, i) => {
    const row = document.createElement("div");
    row.style.cssText =
      "display:flex; justify-content:space-between; align-items:center; padding:4px; color:white; margin:2px 0; border-radius:3px;";
    row.innerHTML = `
      <span>${f.name}${f.fromLocal ? " (localStorage)" : ""}</span>
      <button data-index="${i}" style="background:#ff4444; color:white; border:none; padding:2px 6px; cursor:pointer; border-radius:3px;">✕</button>
    `;
    container.appendChild(row);
  });
  container.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const idx = parseInt(e.target.getAttribute("data-index"));
      uploadedJsonFiles.splice(idx, 1);
      renderUploadedJsonList();
      
      // ✅ Refresh language dropdowns after deletion
      refreshLanguageDropdowns();
    });
  });
}

// ✅ Add new function to refresh language dropdowns
function refreshLanguageDropdowns() {
  const fileNameLanguageDropdown = document.getElementById("file-name-language-dropdown");
  const passwordLanguageDropdown = document.getElementById("password-language-dropdown");
  
  // Clear existing options
  fileNameLanguageDropdown.innerHTML = '<option value="">--Select Language--</option>';
  passwordLanguageDropdown.innerHTML = '<option value="">--Select Language--</option>';
  
  // Merge all remaining JSON files
  const mergedJson = {};
  uploadedJsonFiles.forEach(f => {
    try {
      const jsonData = JSON.parse(f.content);
      Object.assign(mergedJson, jsonData);
    } catch (e) {
      console.warn(`Failed to parse ${f.name}:`, e);
    }
  });
  
  // Re-populate dropdowns
  const topLevelKeys = Object.keys(mergedJson);
  topLevelKeys.forEach(k => {
    const opt1 = document.createElement("option"); opt1.value = k; opt1.textContent = k; fileNameLanguageDropdown.appendChild(opt1);
    const opt2 = document.createElement("option"); opt2.value = k; opt2.textContent = k; passwordLanguageDropdown.appendChild(opt2);
  });
  
  // Hide key selection sections
  document.getElementById("file-name-key-dropdown-section").style.display = "none";
  document.getElementById("password-key-dropdown-section").style.display = "none";
  document.getElementById("file-name-index-section").style.display = "none";
  document.getElementById("password-index-section").style.display = "none";
}


    // Language selection handlers
// For file name language dropdown (line ~204):
fileNameLanguageDropdown.addEventListener("change", e => {
  const selectedLanguage = e.target.value;
  const fileNameKeyDropdown = document.getElementById("file-name-key-dropdown");
  const fileNameKeySection = document.getElementById("file-name-key-dropdown-section");

  if (selectedLanguage) {
    fileNameKeyDropdown.innerHTML = '<option value="">--Select Key--</option>';

    // Merge all JSON files to get the language data
    const mergedJson = {};
    uploadedJsonFiles.forEach(f => {
      try {
        const jsonData = JSON.parse(f.content);
        Object.assign(mergedJson, jsonData);
      } catch (e) {
        console.warn(`Failed to parse ${f.name}:`, e);
      }
    });

    const languageData = mergedJson[selectedLanguage];
    if (languageData) {
      const keys = extractMetaDataKeys(languageData);
      keys.forEach(key => {
        const opt = document.createElement("option");
        opt.value = `${selectedLanguage}.${key}`;
        opt.textContent = key;
        fileNameKeyDropdown.appendChild(opt);
      });
    }
    fileNameKeySection.style.display = "block";
  } else {
    fileNameKeySection.style.display = "none";
  }
  document.getElementById("file-name-index-section").style.display = "none";
});

passwordLanguageDropdown.addEventListener("change", e => {
  const selectedLanguage = e.target.value;
  const passwordKeyDropdown = document.getElementById("password-key-dropdown");
  const passwordKeySection = document.getElementById("password-key-dropdown-section");

  if (selectedLanguage) {
    passwordKeyDropdown.innerHTML = '<option value="">--Select Key--</option>';

    // Merge all JSON files to get the language data
    const mergedJson = {};
    uploadedJsonFiles.forEach(f => {
      try {
        const jsonData = JSON.parse(f.content);
        Object.assign(mergedJson, jsonData);
      } catch (e) {
        console.warn(`Failed to parse ${f.name}:`, e);
      }
    });

    const languageData = mergedJson[selectedLanguage];
    if (languageData) {
      const keys = extractMetaDataKeys(languageData);
      keys.forEach(key => {
        const opt = document.createElement("option");
        opt.value = `${selectedLanguage}.${key}`;
        opt.textContent = key;
        passwordKeyDropdown.appendChild(opt);
      });
    }
    passwordKeySection.style.display = "block";
  } else {
    passwordKeySection.style.display = "none";
  }
  document.getElementById("password-index-section").style.display = "none";
});

    // File name key selection
    document.getElementById("file-name-key-dropdown").addEventListener("change", e => {
      if (e.target.value) {
        document.getElementById("file-name-index-section").style.display = "block";
      } else {
        document.getElementById("file-name-index-section").style.display = "none";
      }
    });

    // Password key selection
    document.getElementById("password-key-dropdown").addEventListener("change", e => {
      if (e.target.value) {
        document.getElementById("password-index-section").style.display = "block";
      } else {
        document.getElementById("password-index-section").style.display = "none";
      }
    });

    // Add buttons
    document.getElementById("file-name-add-btn").addEventListener("click", () => {
      const key = document.getElementById("file-name-key-dropdown").value;
      const idx = document.getElementById("file-name-index-input").value.trim();
      if (key) {
        fileNameSaved.push({ key, indexes: idx });
        renderSaved(fileNameSaved, "file-name-saved");
        document.getElementById("file-name-index-input").value = "";
        document.getElementById("file-name-key-dropdown").value = "";
        document.getElementById("file-name-index-section").style.display = "none";
      }
    });

document.getElementById("password-add-btn").addEventListener("click", () => {
  const key = document.getElementById("password-key-dropdown").value;
  const idx = document.getElementById("password-index-input").value.trim();
  if (key) {
    passwordSaved.push({ key, indexes: idx });
    renderSaved(passwordSaved, "password-saved");
    document.getElementById("password-index-input").value = "";
    document.getElementById("password-key-dropdown").value = "";
    document.getElementById("password-index-section").style.display = "none";
  }
});

// Add listener for custom password button
document.getElementById("password-custom-add-btn").addEventListener("click", () => {
  const val = document.getElementById("password-custom-input").value.trim();
  if (val) {
    passwordCustom = val;
    document.getElementById("password-saved").innerHTML = `Custom: ${val}`;
  }
});

    function renderSaved(arr, containerId) {
      const div = document.getElementById(containerId);
      div.innerHTML = arr.map(o => `${o.key}${o.indexes ? `[${o.indexes}]` : ''}`).join(", ");
    }

    // Send button
    document.getElementById("send-api-btn").addEventListener("click", async () => {
  // ✅ Validate payload mappings
  if (inputJsonMappings.length === 0) {
    alert("⚠️ No payload mappings found. Please add at least one mapping before sending.");
    return;
  }
      editor.Modal.close();

      let fileNamePayload;
      if (document.getElementById("file-name-mode").value === "json" && fileNameSaved.length) {
        fileNamePayload = fileNameSaved.map(o => {
          const keyWithoutLanguage = o.key.includes('.') ? o.key.split('.').slice(1).join('.') : o.key;
          return o.indexes ? `${keyWithoutLanguage}[${o.indexes}]` : keyWithoutLanguage;
        });
      }

      let passwordPayload;
      const pwMode = document.getElementById("password-mode").value;
      if (pwMode === "json" && passwordSaved.length) {
        passwordPayload = passwordSaved.map(o => {
          const keyWithoutLanguage = o.key.includes('.') ? o.key.split('.').slice(1).join('.') : o.key;
          return o.indexes ? `${keyWithoutLanguage}[${o.indexes}]` : keyWithoutLanguage;
        });
      } else if (pwMode === "custom") {
        const val = document.getElementById("password-custom-input").value.trim();
        if (val) passwordPayload = [val];
      }

      const finalPayload = [...inputJsonMappings];

      if (fileNamePayload) {
        finalPayload.push({ file_name: fileNamePayload });
      }

      if (passwordPayload) {
        finalPayload.push({ password: passwordPayload });
      }

      try {
        const message = await exportDesignAndSend(editor, finalPayload);
        alert("✅ " + message);
      } catch (err) {
        console.error(err);
        alert("❌ Error: " + err.message);
      }
    });
  }
});

// 3️⃣ Helper: inject CSS into HTML
function htmlWithCss(html, css) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>${css}</style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `;
}
// 🔹 Helper: Extract filename from response headers
function getFilenameFromResponse(response, fallback = "export.pdf") {

  console.log("🔍 response Raw Content-Disposition:", response);
  const contentDisp = response.headers.get("Content-Disposition");
  console.log("🔍 Raw Content-Disposition:", contentDisp);


  if (!contentDisp) return fallback;

  const match = contentDisp.match(/filename\*?=(?:UTF-8''|")?([^;\n"]+)/i);
  if (match && match[1]) {
    return decodeURIComponent(match[1].trim());
  }
  return fallback;
}

// Add this helper function at the top level (after uploadedJsonFiles declaration)
async function convertXmlToJson(xmlContent, fileName) {
    return new Promise((resolve, reject) => {
        try {
            // Load X2JS if not already loaded
            if (typeof window.X2JS === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/x2js/1.2.0/xml2json.min.js';
                script.onload = function() {
                    performConversion();
                };
                script.onerror = function() {
                    reject(new Error('Failed to load X2JS library'));
                };
                document.head.appendChild(script);
            } else {
                performConversion();
            }

            function normalizeXMLtoJSON(obj, parentKey = '') {
                if (obj === null || obj === undefined) {
                    return obj;
                }
                
                if (Array.isArray(obj)) {
                    return obj.map(item => normalizeXMLtoJSON(item, parentKey));
                }
                
                if (typeof obj !== 'object') {
                    return obj;
                }
                
                const normalized = {};
                
                for (let key in obj) {
                    if (!obj.hasOwnProperty(key)) continue;
                    
                    const value = obj[key];
                    
                    if (key === 'item' && Object.keys(obj).length === 1) {
                        return normalizeXMLtoJSON(value, key);
                    }
                    
                    if (value && typeof value === 'object') {
                        if (value.item !== undefined) {
                            if (Array.isArray(value.item)) {
                                normalized[key] = value.item.map(item => normalizeXMLtoJSON(item, key));
                            } else {
                                normalized[key] = [normalizeXMLtoJSON(value.item, key)];
                            }
                        }
                        else if (value.level !== undefined) {
                            if (Array.isArray(value.level)) {
                                normalized[key] = value.level.map(level => normalizeXMLtoJSON(level, 'level'));
                            } else {
                                normalized[key] = [normalizeXMLtoJSON(value.level, 'level')];
                            }
                        }
                        else if (value.row !== undefined) {
                            if (Array.isArray(value.row)) {
                                normalized[key] = value.row.map(row => normalizeXMLtoJSON(row, 'row'));
                            } else {
                                normalized[key] = [normalizeXMLtoJSON(value.row, 'row')];
                            }
                        }
                        else if (value.header !== undefined) {
                            if (Array.isArray(value.header)) {
                                normalized[key] = value.header.map(header => normalizeXMLtoJSON(header, 'header'));
                            } else {
                                normalized[key] = [normalizeXMLtoJSON(value.header, 'header')];
                            }
                        }
                        else if (value.cell !== undefined) {
                            if (Array.isArray(value.cell)) {
                                normalized[key] = value.cell.map(cell => normalizeXMLtoJSON(cell, 'cell'));
                            } else {
                                normalized[key] = [normalizeXMLtoJSON(value.cell, 'cell')];
                            }
                        }
                        else if (Array.isArray(value)) {
                            normalized[key] = value.map(item => normalizeXMLtoJSON(item, key));
                        }
                        else {
                            normalized[key] = normalizeXMLtoJSON(value, key);
                        }
                    } else {
                        normalized[key] = value;
                    }
                }
                
                return normalized;
            }

            function performConversion() {
                try {
                    const x2js = new X2JS();
                    const xmlDoc = new DOMParser().parseFromString(xmlContent, 'text/xml');
                    const xmlJson = x2js.xml2json(xmlDoc);
                    const normalizedJson = normalizeXMLtoJSON(xmlJson);
                    
                    console.log(`✅ Converted XML to JSON: ${fileName}`);
                    resolve({
                        json: normalizedJson,
                        jsonString: JSON.stringify(normalizedJson)
                    });
                } catch (err) {
                    console.error(`❌ Error converting XML ${fileName}:`, err);
                    reject(err);
                }
            }
        } catch (err) {
            reject(err);
        }
    });
}

// Update the exportDesignAndSend function - replace the file appending section
async function exportDesignAndSend(editor, inputJsonMappings) {
  const exportType = document.getElementById("export-type-dropdown")?.value || "pdf";
  const apiUrl =
    exportType === "pdf"
      ? "http://192.168.0.188:8081/jsonApi/uploadPdf"
      : "http://192.168.0.188:8081/jsonApi/uploadHtml";

  const html = editor.getHtml();
  const css = editor.getCss();

  let finalHtml;

  if (exportType === "pdf") {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    
    const pageContainers = tempDiv.querySelectorAll(".page-container");
    const idsToClean = [];
    
    pageContainers.forEach(el => {
      if (el.id) {
        idsToClean.push(el.id);
      }
    });
    
    let cleanedCss = css;
    idsToClean.forEach(id => {
      const idRegex = new RegExp(`(#${id}\\s*{[^}]*?)margin[^;]*;`, 'g');
      cleanedCss = cleanedCss.replace(idRegex, '$1');
    });
    
    finalHtml = htmlWithCss(html, cleanedCss);
  } else {
    finalHtml = htmlWithCss(html, css);
  }

  const formData = new FormData();
  formData.append("file", new Blob([finalHtml], { type: "text/html" }), "template.html");

  // ✅ Convert XML files to JSON before sending
  for (let idx = 0; idx < uploadedJsonFiles.length; idx++) {
    const f = uploadedJsonFiles[idx];
    const fileExtension = f.name.split('.').pop().toLowerCase();
    
    let jsonContent = f.content;
    let jsonFileName = f.name;
    
    // If it's an XML file, convert it to JSON
    if (fileExtension === 'xml') {
      try {
        console.log(`🔄 Converting XML file: ${f.name}`);
        const converted = await convertXmlToJson(f.content, f.name);
        jsonContent = converted.jsonString;
        // Change extension from .xml to .json
        jsonFileName = f.name.replace(/\.xml$/i, '.json');
        console.log(`✅ Converted ${f.name} → ${jsonFileName}`);
      } catch (err) {
        console.error(`❌ Failed to convert XML file ${f.name}:`, err);
        alert(`Failed to convert XML file: ${f.name}`);
        throw err;
      }
    }
    
    // Append the JSON file (either original or converted)
    formData.append(
      "jsonFile",
      new Blob([jsonContent], { type: "application/json" }),
      jsonFileName
    );
  }

  formData.append("payload", JSON.stringify(inputJsonMappings));

  console.log("🚀 Sending Export Request");
  console.log("👉 API URL:", apiUrl);
  console.log("👉 Export Type:", exportType);
  console.log("👉 Payload (inputJsonMappings):", JSON.stringify(inputJsonMappings, null, 2));
  console.log("👉 Final HTML being sent:\n", finalHtml);

  try {
    const debugUrl = URL.createObjectURL(new Blob([finalHtml], { type: "text/html" }));
    const debugLink = document.createElement("a");
    debugLink.href = debugUrl;
    debugLink.download = exportType === "pdf" ? "sent_to_api_pdf.html" : "sent_to_api_html.html";
    debugLink.click();
    URL.revokeObjectURL(debugUrl);
    console.log("💾 Debug copy of HTML downloaded for verification");
  } catch (err) {
    console.warn("⚠️ Could not auto-download debug HTML:", err);
  }

  const response = await fetch(apiUrl, { method: "POST", body: formData });

  console.log("📩 Raw response headers:", [...response.headers.entries()]);

  if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);

  const blob = await response.blob();
  const filename = getFilenameFromResponse(response, "export.zip");

  console.log("📦 ZIP filename resolved:", filename);

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);

  return "Export sent & ZIP file downloaded successfully!";
}



// function generatePrintDialog() {

//   // Add this function before the try block in generatePrintDialog
//   async function captureChartsAsImages(htmlContent) {
//     const tempDiv = document.createElement('div');
//     tempDiv.innerHTML = htmlContent;

//     // Find all chart containers
//     const chartContainers = tempDiv.querySelectorAll('[data-i_designer-type="custom_line_chart"]');

//     for (let container of chartContainers) {
//       const chartId = container.id;
//       if (!chartId) continue;

//       try {
//         // Get the actual chart element from the editor
//         const editorDoc = editor.Canvas.getDocument();
//         const sourceChartContainer = editorDoc.getElementById(chartId);

//         if (sourceChartContainer) {
//           // Get chart instance
//           const chartInstance = sourceChartContainer.chartInstance;

//           if (chartInstance && window.Highcharts) {
//             try {
//               // Use Highcharts built-in export functionality
//               const chartSVG = chartInstance.getSVG({
//                 chart: {
//                   backgroundColor: '#ffffff'
//                 },
//                 exporting: {
//                   sourceWidth: chartInstance.chartWidth || 800,
//                   sourceHeight: chartInstance.chartHeight || 400
//                 }
//               });

//               // Convert SVG to base64 image
//               const canvas = document.createElement('canvas');
//               const ctx = canvas.getContext('2d');
//               const img = new Image();

//               await new Promise((resolve, reject) => {
//                 img.onload = () => {
//                   canvas.width = img.width || 800;
//                   canvas.height = img.height || 400;
//                   ctx.fillStyle = '#ffffff';
//                   ctx.fillRect(0, 0, canvas.width, canvas.height);
//                   ctx.drawImage(img, 0, 0);

//                   const imageDataUrl = canvas.toDataURL('image/png');

//                   // Replace chart container with image
//                   const imgElement = document.createElement('img');
//                   imgElement.src = imageDataUrl;
//                   imgElement.style.cssText = `
//                   width: 100% !important;
//                   height: auto !important;
//                   max-width: 100% !important;
//                   display: block !important;
//                   margin: 10px 0 !important;
//                   page-break-inside: avoid !important;
//                   break-inside: avoid !important;
//                 `;

//                   // Copy container's styling to image wrapper
//                   const imgWrapper = document.createElement('div');
//                   imgWrapper.style.cssText = container.style.cssText;
//                   imgWrapper.appendChild(imgElement);

//                   container.parentNode.replaceChild(imgWrapper, container);
//                   resolve();
//                 };

//                 img.onerror = reject;
//                 img.src = 'data:image/svg+xml;base64,' + btoa(chartSVG);
//               });

//             } catch (svgError) {
//               console.warn('SVG export failed, trying canvas capture:', svgError);
//               await fallbackCanvasCapture(sourceChartContainer, container);
//             }
//           } else {
//             console.warn('No chart instance found, trying canvas capture');
//             await fallbackCanvasCapture(sourceChartContainer, container);
//           }
//         }
//       } catch (error) {
//         console.error('Error capturing chart:', chartId, error);
//       }
//     }

//     return tempDiv.innerHTML;
//   }

//   // Fallback canvas capture method
//   async function fallbackCanvasCapture(sourceElement, targetContainer) {
//     if (!sourceElement) return;

//     try {
//       // Use html2canvas if available, otherwise create placeholder
//       if (typeof html2canvas !== 'undefined') {
//         const canvas = await html2canvas(sourceElement, {
//           backgroundColor: '#ffffff',
//           scale: 2,
//           useCORS: true,
//           allowTaint: true,
//           width: sourceElement.offsetWidth || 800,
//           height: sourceElement.offsetHeight || 400
//         });

//         const imageDataUrl = canvas.toDataURL('image/png');

//         const imgElement = document.createElement('img');
//         imgElement.src = imageDataUrl;
//         imgElement.style.cssText = `
//         width: 100% !important;
//         height: auto !important;
//         max-width: 100% !important;
//         display: block !important;
//         margin: 10px 0 !important;
//         page-break-inside: avoid !important;
//         break-inside: avoid !important;
//       `;

//         targetContainer.innerHTML = '';
//         targetContainer.appendChild(imgElement);
//       } else {
//         // Create a placeholder if html2canvas is not available
//         targetContainer.innerHTML = `
//         <div style="
//           width: 100%; 
//           height: 300px; 
//           border: 2px dashed #ccc; 
//           display: flex; 
//           align-items: center; 
//           justify-content: center;
//           background: #f9f9f9;
//           margin: 10px 0;
//           page-break-inside: avoid;
//         ">
//           <span style="color: #666; font-family: Arial, sans-serif;">Chart (ID: ${targetContainer.id})</span>
//         </div>
//       `;
//       }
//     } catch (error) {
//       console.error('Canvas capture failed:', error);
//     }
//   }
//   try {
//     if (typeof editor === "undefined") {
//       console.error(
//         "The 'editor' variable is not defined. Ensure it is properly initialized or imported."
//       );
//       alert("Editor not initialized. Please check the console for details.");
//       return;
//     }

//     const editorHTML = editor.getHtml();
//     const editorCSS = editor.getCss();
//     console.log("html", editorHTML);
//     console.log("css", editorCSS)

//     // Create a hidden iframe for printing
//     const printFrame = document.createElement("iframe");
//     printFrame.style.position = "absolute";
//     printFrame.style.left = "-9999px";
//     printFrame.style.top = "0";
//     printFrame.style.width = "100%";
//     printFrame.style.height = "100%";
//     printFrame.style.border = "none";

//     document.body.appendChild(printFrame);

//     // Get hide-on-print class name
//     const HIDE_CLASS = "hide-on-print";

//     // Process HTML to handle page breaks properly
//     // First capture current display styles from live document
//     const htmlWithCurrentStyles = captureCurrentDisplayStyles(editorHTML);
//     const processedHTML = processPageBreaks(htmlWithCurrentStyles);

//     // Function to capture current computed display styles from the live document
//     function captureCurrentDisplayStyles(htmlContent) {
//       const tempDiv = document.createElement('div');
//       tempDiv.innerHTML = htmlContent;

//       // Get the current iframe document to check actual computed styles
//       const currentIframeDoc = editor.Canvas.getDocument();

//       if (currentIframeDoc) {
//         // Find all elements in the temp content
//         const allElements = tempDiv.querySelectorAll('*[id]');

//         allElements.forEach(element => {
//           const elementId = element.id;
//           if (elementId) {
//             // Find the corresponding element in the live document
//             const liveElement = currentIframeDoc.getElementById(elementId);
//             if (liveElement) {
//               // Check the computed style of the live element
//               const computedStyle = currentIframeDoc.defaultView.getComputedStyle(liveElement);
//               const displayValue = computedStyle.getPropertyValue('display');

//               // If the live element is hidden, hide it in the print version too
//               if (displayValue === 'none' || liveElement.style.display === 'none') {
//                 element.style.setProperty('display', 'none', 'important');
//                 // Also add a class to ensure it's hidden
//                 element.classList.add('dynamic-hidden-element');
//               }
//             }
//           }
//         });
//       }

//       return tempDiv.innerHTML;
//     }
//     // Enhanced function to convert Bootstrap classes and preserve ALL table styling
//     function convertBootstrapToInlineStyles(html) {
//       const tempDiv = document.createElement('div');
//       tempDiv.innerHTML = html;

//       // Get current editor CSS for display:none checking
//       const currentEditorCSS = editor.getCss();

//       // Remove elements that should be hidden in print
//       const allElementsToCheck = tempDiv.querySelectorAll('*');
//       const elementsToRemove = [];

//       allElementsToCheck.forEach(element => {
//         if (shouldHideInPrint(element, currentEditorCSS)) {
//           elementsToRemove.push(element);
//         }
//       });

//       // Remove hidden elements
//       elementsToRemove.forEach(element => {
//         if (element.parentNode) {
//           element.parentNode.removeChild(element);
//         }
//       });
//       // Get the current iframe document to access formula data and styling
//       const currentIframeDoc = editor.Canvas.getDocument();

//       // Helper function to extract all computed styles from an element
//       function extractAllStyles(sourceElement, targetElement) {
//         if (!sourceElement || !targetElement) return;

//         // Get computed styles from the source element
//         const computedStyle = window.getComputedStyle(sourceElement);
//         const inlineStyle = sourceElement.style;

//         // Preserve all visual styles
//         const stylesToPreserve = [
//           'background-color', 'background', 'background-image', 'background-repeat', 'background-position', 'background-size',
//           'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
//           'border-color', 'border-style', 'border-width',
//           'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
//           'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style',
//           'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
//           'border-radius', 'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius',
//           'color', 'font-family', 'font-size', 'font-weight', 'font-style',
//           'text-align', 'vertical-align', 'text-decoration', 'text-transform',
//           'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
//           'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
//           'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
//           'opacity', 'box-shadow', 'text-shadow', 'border-collapse'
//         ];

//         // First, copy inline styles (highest priority)
//         for (let i = 0; i < inlineStyle.length; i++) {
//           const property = inlineStyle[i];
//           const value = inlineStyle.getPropertyValue(property);
//           const priority = inlineStyle.getPropertyPriority(property);
//           if (value) {
//             targetElement.style.setProperty(property, value, priority || 'important');
//           }
//         }

//         // Then, copy computed styles for important visual properties
//         stylesToPreserve.forEach(property => {
//           const value = computedStyle.getPropertyValue(property);
//           if (value && value !== 'initial' && value !== 'inherit' && value !== 'auto' && value !== 'none') {
//             // Only set if not already set by inline styles
//             if (!inlineStyle.getPropertyValue(property)) {
//               targetElement.style.setProperty(property, value, 'important');
//             }
//           }
//         });

//         if (sourceElement.hasAttribute('data-running-total-cell') ||
//           sourceElement.hasAttribute('data-running-total-for') ||
//           sourceElement.hasAttribute('data-running-total-value')) {

//           // Copy all running total attributes
//           ['data-running-total-cell', 'data-running-total-for', 'data-running-total-value', 'data-running-total-header'].forEach(attr => {
//             if (sourceElement.hasAttribute(attr)) {
//               targetElement.setAttribute(attr, sourceElement.getAttribute(attr));
//             }
//           });

//           // Ensure running total cell content is preserved
//           if (sourceElement.hasAttribute('data-running-total-value')) {
//             const runningValue = sourceElement.getAttribute('data-running-total-value');
//             const displayValue = parseFloat(runningValue);
//             if (!isNaN(displayValue)) {
//               targetElement.textContent = displayValue.toFixed(2);
//             }
//           }
//         }
//         // Special handling for JSON tables with default black borders
//         // if (sourceElement.tagName === 'TABLE' || sourceElement.tagName === 'TH' || sourceElement.tagName === 'TD') {
//         //   // Check if this is a JSON table (has data attributes or is within custom_table)
//         //   const isJsonTable = sourceElement.hasAttribute('data-display-value') ||
//         //     sourceElement.hasAttribute('data-formula') ||
//         //     sourceElement.closest('[data-i_designer-type="custom_table"]');

//         //   if (isJsonTable) {
//         //     // Preserve the default JSON table styling
//         //     if (sourceElement.tagName === 'TABLE') {
//         //       targetElement.style.setProperty('border-collapse', 'collapse', 'important');
//         //       if (!targetElement.style.border) {
//         //         targetElement.style.setProperty('border', '1px solid #000', 'important');
//         //       }
//         //     }

//         //     if (sourceElement.tagName === 'TH' || sourceElement.tagName === 'TD') {
//         //       if (!targetElement.style.border) {
//         //         targetElement.style.setProperty('border', '1px solid #000', 'important');
//         //       }
//         //       if (!targetElement.style.padding) {
//         //         targetElement.style.setProperty('padding', '8px', 'important');
//         //       }
//         //       if (!targetElement.style.textAlign) {
//         //         targetElement.style.setProperty('text-align', 'left', 'important');
//         //       }
//         //     }

//         //     if (sourceElement.tagName === 'TH') {
//         //       if (!targetElement.style.fontWeight) {
//         //         targetElement.style.setProperty('font-weight', 'bold', 'important');
//         //       }
//         //       if (!targetElement.style.backgroundColor) {
//         //         targetElement.style.setProperty('background-color', '#e0e0e0', 'important');
//         //       }
//         //     }
//         //   }
//         // }
//       }
//       // Function to check if element should be hidden in print based on CSS
//       function shouldHideInPrint(element, editorCSS) {
//         const elementId = element.id;
//         const elementClasses = Array.from(element.classList);

//         // Check inline styles first
//         if (element.style.display === 'none') {
//           return true;
//         }

//         // Check CSS for ID selector
//         if (elementId) {
//           const idRegex = new RegExp(`#${elementId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^{}]*{[^{}]*display\\s*:\\s*none`, 'i');
//           if (idRegex.test(editorCSS)) {
//             return true;
//           }
//         }

//         // Check CSS for class selectors
//         for (const className of elementClasses) {
//           const classRegex = new RegExp(`\\.${className.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^{}]*{[^{}]*display\\s*:\\s*none`, 'i');
//           if (classRegex.test(editorCSS)) {
//             return true;
//           }
//         }

//         return false;
//       }
//       // First, handle all custom tables and DataTables
//       const allTables = tempDiv.querySelectorAll('table, [id*="table"], [data-i_designer-type="custom_table"] table');
//       allTables.forEach(table => {
//         const tableId = table.id;
//         let parentContainer = table.closest('[data-i_designer-type="custom_table"]');

//         // If it's inside a custom table container, get the container ID
//         let containerId = null;
//         if (parentContainer) {
//           containerId = parentContainer.id;
//         }

//         // Find corresponding table in current iframe to get current data AND styling
//         let sourceTable = null;
//         let sourceContainer = null;

//         if (currentIframeDoc) {
//           if (containerId) {
//             sourceContainer = currentIframeDoc.getElementById(containerId);
//             if (sourceContainer) {
//               sourceTable = sourceContainer.querySelector('table');
//             }
//           } else if (tableId) {
//             sourceTable = currentIframeDoc.getElementById(tableId);
//           }

//           // For JSON tables, also try to find by table ID within custom containers
//           if (!sourceTable && tableId) {
//             const allCustomContainers = currentIframeDoc.querySelectorAll('[data-i_designer-type="custom_table"]');
//             allCustomContainers.forEach(container => {
//               const innerTable = container.querySelector(`#${tableId}`);
//               if (innerTable) {
//                 sourceTable = innerTable;
//                 sourceContainer = container;
//               }
//             });
//           }
//         }

//         // Remove DataTables wrapper and controls
//         const wrapper = table.closest('.dataTables_wrapper');
//         if (wrapper) {
//           // Extract the table from wrapper
//           const parent = wrapper.parentNode;
//           parent.insertBefore(table, wrapper);
//           parent.removeChild(wrapper);
//         }

//         // Preserve table-level styling from source
//         if (sourceTable) {
//           extractAllStyles(sourceTable, table);
//         }

//         // Ensure basic table structure for print
//         table.className = (table.className || '') + ' table table-bordered print-table';
//         table.style.setProperty('width', '100%', 'important');
//         table.style.setProperty('border-collapse', 'collapse', 'important');
//         table.style.setProperty('page-break-inside', 'auto', 'important');

//         // Process table headers with style preservation
//         const headers = table.querySelectorAll('thead th, thead td');
//         headers.forEach((header, headerIndex) => {
//           // Find corresponding source header
//           let sourceHeader = null;
//           if (sourceTable) {
//             const sourceHeaderRow = sourceTable.querySelector('thead tr');
//             if (sourceHeaderRow && sourceHeaderRow.cells[headerIndex]) {
//               sourceHeader = sourceHeaderRow.cells[headerIndex];
//             }
//           }

//           // Preserve header styling
//           if (sourceHeader) {
//             extractAllStyles(sourceHeader, header);
//           } else {
//             // Apply default JSON table header styling if no source found
//             header.style.setProperty('border', '1px solid #000', 'important');
//             header.style.setProperty('padding', '8px', 'important');
//             header.style.setProperty('text-align', 'left', 'important');
//             header.style.setProperty('vertical-align', 'middle', 'important');
//             header.style.setProperty('font-weight', 'bold', 'important');
//             header.style.setProperty('background-color', '#e0e0e0', 'important');
//           }

//           // Handle header content - check for divs, spans, or direct text
//           const headerDiv = header.querySelector('div');
//           const headerSpan = header.querySelector('.cell-display, span');

//           let content = '';

//           if (sourceHeader) {
//             // Get the display value from the source
//             const displaySpan = sourceHeader.querySelector('.cell-display');
//             const displayValue = sourceHeader.getAttribute('data-display-value');

//             if (displaySpan && displaySpan.textContent) {
//               content = displaySpan.textContent;
//             } else if (displayValue) {
//               content = displayValue;
//             } else {
//               // For JSON tables, extract from div content
//               const sourceDiv = sourceHeader.querySelector('div');
//               if (sourceDiv) {
//                 content = sourceDiv.textContent || sourceDiv.innerText || '';
//               } else {
//                 content = sourceHeader.textContent || sourceHeader.innerText || '';
//               }
//             }
//           }

//           // Fallback to current content if no source found
//           if (!content) {
//             if (headerDiv) {
//               content = headerDiv.textContent || headerDiv.innerHTML;
//             } else if (headerSpan) {
//               content = headerSpan.textContent || headerSpan.innerHTML;
//             } else {
//               content = header.textContent || header.innerHTML;
//             }
//           }

//           header.innerHTML = content.trim();
//         });

//         // Process table body cells with enhanced data extraction AND style preservation
//         const rows = table.querySelectorAll('tbody tr');
//         rows.forEach((row, rowIndex) => {
//           // Preserve row styling
//           let sourceRow = null;
//           if (sourceTable) {
//             const sourceBodyRows = sourceTable.querySelectorAll('tbody tr');
//             if (sourceBodyRows[rowIndex]) {
//               sourceRow = sourceBodyRows[rowIndex];
//               extractAllStyles(sourceRow, row);
//             }
//           }

//           row.style.setProperty('page-break-inside', 'avoid', 'important');
//           row.style.setProperty('break-inside', 'avoid', 'important');

//           const cells = row.querySelectorAll('td, th');
//           cells.forEach((cell, cellIndex) => {
//             let sourceCell = null;
//             if (sourceRow && sourceRow.cells[cellIndex]) {
//               sourceCell = sourceRow.cells[cellIndex];
//               // Preserve all cell styling
//               extractAllStyles(sourceCell, cell);
//             } else {
//               // Apply default JSON table cell styling if no source found
//               cell.style.setProperty('border', '1px solid #000', 'important');
//               cell.style.setProperty('padding', '8px', 'important');
//               cell.style.setProperty('text-align', 'left', 'important');
//               cell.style.setProperty('vertical-align', 'middle', 'important');
//             }

//             // Ensure basic print cell styling (only if not already styled)
//             if (!cell.style.border) {
//               cell.style.setProperty('border', '1px solid #333', 'important');
//             }
//             if (!cell.style.padding) {
//               cell.style.setProperty('padding', '8px', 'important');
//             }
//             if (!cell.style.textAlign) {
//               cell.style.setProperty('text-align', 'left', 'important');
//             }
//             if (!cell.style.verticalAlign) {
//               cell.style.setProperty('vertical-align', 'middle', 'important');
//             }
//             cell.style.setProperty('word-break', 'break-word', 'important');

//             let content = '';

//             // PRIORITY: Check for running total cells first
//             if (sourceCell && (sourceCell.hasAttribute('data-running-total-cell') || sourceCell.hasAttribute('data-running-total-header'))) {
//               // Copy running total attributes
//               ['data-running-total-cell', 'data-running-total-for', 'data-running-total-value', 'data-running-total-header'].forEach(attr => {
//                 if (sourceCell.hasAttribute(attr)) {
//                   cell.setAttribute(attr, sourceCell.getAttribute(attr));
//                 }
//               });

//               if (sourceCell.hasAttribute('data-running-total-value')) {
//                 // This is a running total data cell
//                 const runningValue = sourceCell.getAttribute('data-running-total-value');
//                 const displayValue = parseFloat(runningValue);
//                 content = !isNaN(displayValue) ? displayValue.toFixed(2) : runningValue;
//               } else if (sourceCell.hasAttribute('data-running-total-header')) {
//                 // This is a running total header cell
//                 content = sourceCell.textContent || sourceCell.innerText || 'Running Total';
//               } else {
//                 // Fallback to regular cell content extraction
//                 content = sourceCell.textContent || sourceCell.innerText || '';
//               }
//             } else {
//               // Regular cell processing (existing logic)

//               // Try to get data from source table first
//               if (sourceCell) {
//                 // For JSON tables, prioritize data-display-value attribute
//                 const displayValue = sourceCell.getAttribute('data-display-value');
//                 const formulaValue = sourceCell.getAttribute('data-formula');
//                 const displaySpan = sourceCell.querySelector('.cell-display');

//                 if (displayValue !== null && displayValue !== '') {
//                   content = displayValue;
//                 } else if (displaySpan && displaySpan.textContent.trim()) {
//                   content = displaySpan.textContent.trim();
//                 } else if (formulaValue && !formulaValue.startsWith('=')) {
//                   content = formulaValue;
//                 } else {
//                   // Get text content but exclude input values
//                   const inputs = sourceCell.querySelectorAll('input');
//                   let cellText = sourceCell.textContent || sourceCell.innerText || '';

//                   // Remove input values from text content
//                   inputs.forEach(input => {
//                     if (input.value && cellText.includes(input.value)) {
//                       cellText = cellText.replace(input.value, '').trim();
//                     }
//                   });

//                   content = cellText;
//                 }

//                 // If we have a formula, try to get calculated result
//                 if (!content && formulaValue && formulaValue.startsWith('=')) {
//                   // Look for any text that's not the formula itself
//                   const allText = sourceCell.textContent || sourceCell.innerText || '';
//                   if (allText && allText !== formulaValue) {
//                     content = allText;
//                   }
//                 }
//               }

//               // Fallback to current cell content if no source data found
//               if (!content) {
//                 // Check for data attributes first (common in JSON tables)
//                 const displayValue = cell.getAttribute('data-display-value');
//                 if (displayValue !== null && displayValue !== '') {
//                   content = displayValue;
//                 } else {
//                   const cellDiv = cell.querySelector('div');
//                   const cellSpan = cell.querySelector('.cell-display, span');

//                   if (cellDiv) {
//                     content = cellDiv.textContent || cellDiv.innerHTML;
//                   } else if (cellSpan) {
//                     content = cellSpan.textContent || cellSpan.innerHTML;
//                   } else {
//                     content = cell.textContent || cell.innerHTML;
//                   }
//                 }
//               }
//             }

//             // Clean up content and set it
//             content = content.replace(/^\s+|\s+$/g, ''); // Trim whitespace
//             content = content.replace(/\n\s*\n/g, '\n'); // Remove multiple newlines

//             cell.innerHTML = content || '';

//             // Remove any remaining input elements for print
//             const inputs = cell.querySelectorAll('input');
//             inputs.forEach(input => input.remove());

//             // Remove formula indicators for print (but keep running total attributes)
//             cell.style.setProperty('position', 'relative', 'important');
//             if (!cell.hasAttribute('data-running-total-cell') && !cell.hasAttribute('data-running-total-header')) {
//               cell.removeAttribute('data-formula');
//               cell.removeAttribute('data-display-value');
//               cell.removeAttribute('data-cell-ref');
//             }
//           });
//         });

//         // Ensure thead is properly displayed
//         const thead = table.querySelector('thead');
//         if (thead) {
//           if (sourceTable) {
//             const sourceThead = sourceTable.querySelector('thead');
//             if (sourceThead) {
//               extractAllStyles(sourceThead, thead);
//             }
//           }
//           thead.style.setProperty('display', 'table-header-group', 'important');
//           thead.style.setProperty('page-break-after', 'avoid', 'important');
//         }

//         // Ensure tbody is properly displayed
//         const tbody = table.querySelector('tbody');
//         if (tbody) {
//           if (sourceTable) {
//             const sourceTbody = sourceTable.querySelector('tbody');
//             if (sourceTbody) {
//               extractAllStyles(sourceTbody, tbody);
//             }
//           }
//           tbody.style.setProperty('display', 'table-row-group', 'important');
//         }
//       });


//       // Process all elements with Bootstrap classes (keep existing Bootstrap logic)
//       const allElements = tempDiv.querySelectorAll('*');

//       allElements.forEach(element => {
//         const classList = Array.from(element.classList);
//         let computedStyles = {};

//         // Handle container classes
//         if (classList.includes('container') || classList.includes('container-fluid')) {
//           computedStyles.width = '100%';
//           computedStyles.maxWidth = 'none';
//           computedStyles.margin = '0';
//           computedStyles.padding = '0';
//         }

//         // Handle row classes
//         if (classList.includes('row')) {
//           computedStyles.display = 'flex';
//           computedStyles.flexWrap = 'wrap';
//           computedStyles.margin = '0';
//           computedStyles.width = '100%';
//           computedStyles.minHeight = 'auto';
//         }

//         // Handle column classes - check all possible Bootstrap column classes
//         let isColumn = false;
//         classList.forEach(className => {
//           // Handle col-* classes
//           if (className.match(/^col-(\d+)$/)) {
//             const colSize = parseInt(className.split('-')[1]);
//             computedStyles.flex = `0 0 ${(colSize / 12) * 100}%`;
//             computedStyles.maxWidth = `${(colSize / 12) * 100}%`;
//             computedStyles.position = 'relative';
//             computedStyles.width = '100%';
//             isColumn = true;
//           }

//           // Handle col-sm-*, col-md-*, col-lg-*, col-xl-* classes
//           if (className.match(/^col-(sm|md|lg|xl)-(\d+)$/)) {
//             const colSize = parseInt(className.split('-')[2]);
//             computedStyles.flex = `0 0 ${(colSize / 12) * 100}%`;
//             computedStyles.maxWidth = `${(colSize / 12) * 100}%`;
//             computedStyles.position = 'relative';
//             computedStyles.width = '100%';
//             isColumn = true;
//           }

//           // Handle plain col class
//           if (className === 'col') {
//             computedStyles.flex = '1 0 0%';
//             computedStyles.position = 'relative';
//             computedStyles.width = '100%';
//             isColumn = true;
//           }
//         });

//         // For columns, ensure proper height calculation
//         if (isColumn) {
//           const hasContent = element.textContent.trim().length > 0 || element.children.length > 0;
//           if (hasContent) {
//             computedStyles.minHeight = 'auto';
//             computedStyles.height = 'auto';
//           } else {
//             computedStyles.minHeight = '45px';
//           }

//           computedStyles.boxSizing = 'border-box';
//           computedStyles.display = 'block';
//         }

//         // Apply computed styles as inline styles (only if not conflicting with preserved styles)
//         Object.keys(computedStyles).forEach(property => {
//           const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase();
//           // Only apply if the element doesn't already have this style set
//           if (!element.style.getPropertyValue(cssProperty)) {
//             element.style.setProperty(cssProperty, computedStyles[property], 'important');
//           }
//         });
//       });

//       return tempDiv.innerHTML;
//     }

//     // Convert Bootstrap classes to inline styles with enhanced table preservation
//     const processedHTMLWithInlineStyles = convertBootstrapToInlineStyles(processedHTML);

//     // Prepare the print content with comprehensive print support
//     const printContent = `
//       <!DOCTYPE html>
//       <html>
//       <head>
//         <meta charset="utf-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1">
//         <title>Print Document</title>
//         <style>
//           /* Global reset and print setup */
//           * {
//             -webkit-print-color-adjust: exact !important;
//             color-adjust: exact !important;
//             print-color-adjust: exact !important;
//             box-sizing: border-box !important;
//           }
          
//           html, body {
//             margin: 0 !important;
//             padding: 0 !important;
//             width: 100% !important;
//             height: auto !important;
//             background: white !important;
//             font-family: Arial, sans-serif !important;
//             line-height: 1.4 !important;
//             color: #333 !important;
//           }
          
//           @page {
//             margin: 0.5in !important;
//             size: auto !important;
//           }
          
//           /* Enhanced table print styles with FULL style preservation */
//           @media print {
//             * {
//               -webkit-print-color-adjust: exact !important;
//               color-adjust: exact !important;
//               print-color-adjust: exact !important;
//               box-sizing: border-box !important;
//             }
            
//             /* Table-specific print styles - preserve ALL styling */
//             table.print-table,
//             table.table,
//             table.dataTable,
//             table[id*="table"],
//             [data-i_designer-type="custom_table"] table {
//               width: 100% !important;
//               border-collapse: collapse !important;
//               page-break-inside: auto !important;
//               margin: 10px 0 !important;
//               display: table !important;
//               visibility: visible !important;
//               opacity: 1 !important;
//               /* Preserve custom styling - DO NOT override border, background, colors if already set */
//             }
            
//             table.print-table thead,
//             table.table thead,
//             table.dataTable thead,
//             table[id*="table"] thead,
//             [data-i_designer-type="custom_table"] table thead {
//               display: table-header-group !important;
//               page-break-after: avoid !important;
//               page-break-inside: avoid !important;
//               break-after: avoid !important;
//               break-inside: avoid !important;
//             }
            
//             table.print-table tbody,
//             table.table tbody,
//             table.dataTable tbody,
//             table[id*="table"] tbody,
//             [data-i_designer-type="custom_table"] table tbody {
//               display: table-row-group !important;
//             }
            
//             table.print-table tr,
//             table.table tr,
//             table.dataTable tr,
//             table[id*="table"] tr,
//             [data-i_designer-type="custom_table"] table tr {
//               display: table-row !important;
//               page-break-inside: avoid !important;
//               break-inside: avoid !important;
//             }
            
//             table.print-table th,
//             table.print-table td,
//             table.table th,
//             table.table td,
//             table.dataTable th,
//             table.dataTable td,
//             table[id*="table"] th,
//             table[id*="table"] td,
//             [data-i_designer-type="custom_table"] table th,
//             [data-i_designer-type="custom_table"] table td {
//               display: table-cell !important;
//               word-break: break-word !important;
//               position: relative !important;
//               /* DO NOT override styling that was already preserved inline */
//             }
            
//             /* Only apply fallback styling if no inline styles exist */
//             table th:not([style*="border"]),
//             table td:not([style*="border"]) {
//               border: 1px solid #333 !important;
//             }
            
//             table th:not([style*="padding"]),
//             table td:not([style*="padding"]) {
//               padding: 6px 8px !important;
//             }
            
//             table th:not([style*="text-align"]),
//             table td:not([style*="text-align"]) {
//               text-align: left !important;
//             }
            
//             table th:not([style*="vertical-align"]),
//             table td:not([style*="vertical-align"]) {
//               vertical-align: middle !important;
//             }
            
//             table th:not([style*="background"]) {
//               background-color: #f2f2f2 !important;
//             }
            
//             table th:not([style*="font-weight"]) {
//               font-weight: bold !important;
//             }
            
//             /* Hide all input elements in tables */
//             table input,
//             table .cell-input,
//             [data-i_designer-type="custom_table"] input,
//             [data-i_designer-type="custom_table"] .cell-input {
//               display: none !important;
//               visibility: hidden !important;
//               opacity: 0 !important;
//               position: absolute !important;
//               left: -9999px !important;
//               width: 0 !important;
//               height: 0 !important;
//             }
            
//             /* Ensure display spans are visible */
//             table .cell-display,
//             [data-i_designer-type="custom_table"] .cell-display {
//               display: block !important;
//               visibility: visible !important;
//               opacity: 1 !important;
//               position: static !important;
//               width: 100% !important;
//               height: auto !important;
//             }
            
//             /* Hide DataTables controls */
//             .dataTables_wrapper .dataTables_length,
//             .dataTables_wrapper .dataTables_filter,
//             .dataTables_wrapper .dataTables_info,
//             .dataTables_wrapper .dataTables_paginate,
//             .dataTables_wrapper .dataTables_processing,
//             .dt-buttons,
//             .dataTables_scrollHead,
//             .dataTables_scrollFoot {
//               display: none !important;
//               visibility: hidden !important;
//               height: 0 !important;
//               width: 0 !important;
//               margin: 0 !important;
//               padding: 0 !important;
//             }
            
//             /* Force table visibility on all pages */
//             .dataTables_wrapper,
//             .dataTables_scroll,
//             .dataTables_scrollBody {
//               display: block !important;
//               width: 100% !important;
//               height: auto !important;
//               overflow: visible !important;
//               position: static !important;
//             }
            
//             /* Custom table containers - Enhanced for JSON tables */
//             [data-i_designer-type="custom_table"] {
//               display: block !important;
//               visibility: visible !important;
//               opacity: 1 !important;
//               width: 100% !important;
//               height: auto !important;
//               overflow: visible !important;
//               position: static !important;
//             }
            
//             /* Enhanced JSON table styling with stronger specificity */
//             [data-i_designer-type="custom_table"] table {
//               width: 100% !important;
//               border-collapse: collapse !important;
//               border: 1px solid #000 !important;
//               page-break-inside: auto !important;
//               margin: 10px 0 !important;
//               display: table !important;
//               visibility: visible !important;
//               opacity: 1 !important;
//             }
            
//             [data-i_designer-type="custom_table"] table th,
//             [data-i_designer-type="custom_table"] table td {
//               display: table-cell !important;
//               border: 1px solid #000 !important;
//               padding: 8px !important;
//               text-align: left !important;
//               vertical-align: middle !important;
//               position: relative !important;
//               word-break: break-word !important;
//             }
            
//             [data-i_designer-type="custom_table"] table th {
//               font-weight: bold !important;
//               background-color: #e0e0e0 !important;
//               -webkit-print-color-adjust: exact !important;
//               color-adjust: exact !important;
//               print-color-adjust: exact !important;
//             }
            
//             [data-i_designer-type="custom_table"] table td {
//               background-color: #fff !important;
//               -webkit-print-color-adjust: exact !important;
//               color-adjust: exact !important;
//               print-color-adjust: exact !important;
//             }
            
//             /* Override any conflicting styles for JSON tables */
//             [data-i_designer-type="custom_table"] table[style*="border-collapse"] {
//               border-collapse: collapse !important;
//             }
            
//             [data-i_designer-type="custom_table"] table th[style*="border"],
//             [data-i_designer-type="custom_table"] table td[style*="border"] {
//               /* Keep existing border styles if they exist */
//             }
            
//             /* Fallback styling for JSON tables if no inline styles */
//             [data-i_designer-type="custom_table"] table th:not([style*="border"]),
//             [data-i_designer-type="custom_table"] table td:not([style*="border"]) {
//               border: 1px solid #000 !important;
//             }
            
//             [data-i_designer-type="custom_table"] table th:not([style*="padding"]),
//             [data-i_designer-type="custom_table"] table td:not([style*="padding"]) {
//               padding: 8px !important;
//             }
            
//             [data-i_designer-type="custom_table"] table th:not([style*="background"]) {
//               background-color: #e0e0e0 !important;
//             }
            
//             [data-i_designer-type="custom_table"] table td:not([style*="background"]) {
//               background-color: #fff !important;
//             }
            
//             /* Preserve all background colors and images */
//             *[style*="background-color"],
//             *[style*="background"],
//             *[class*="bg-"] {
//               -webkit-print-color-adjust: exact !important;
//               color-adjust: exact !important;
//               print-color-adjust: exact !important;
//             }
            
//             /* Bootstrap Grid System - Force Layout */
//             .container,
//             .container-fluid {
//               width: 100% !important;
//               max-width: none !important;
//               margin: 0 !important;
//               padding: 0 !important;
//               display: block !important;
//             }
            
//             .row {
//               display: flex !important;
//               flex-wrap: wrap !important;
//               margin: 0 !important;
//               width: 100% !important;
//               min-height: auto !important;
//               height: auto !important;
//             }
            
//             /* Force all column classes to work with proper height */
//             [class*="col-"] {
//               position: relative !important;
//               width: 100% !important;
//               display: block !important;
//               float: none !important;
//               min-height: auto !important;
//               height: auto !important;
//               box-sizing: border-box !important;
//             }
            
//             /* Specific column widths with proper height handling */
//             .col-1, .col-sm-1, .col-md-1, .col-lg-1, .col-xl-1 { 
//               flex: 0 0 8.333333% !important; 
//               max-width: 8.333333% !important; 
//               min-height: auto !important;
//               height: auto !important;
//             }
//             .col-2, .col-sm-2, .col-md-2, .col-lg-2, .col-xl-2 { 
//               flex: 0 0 16.666667% !important; 
//               max-width: 16.666667% !important; 
//               min-height: auto !important;
//               height: auto !important;
//             }
//             .col-3, .col-sm-3, .col-md-3, .col-lg-3, .col-xl-3 { 
//               flex: 0 0 25% !important; 
//               max-width: 25% !important; 
//               min-height: auto !important;
//               height: auto !important;
//             }
//             .col-4, .col-sm-4, .col-md-4, .col-lg-4, .col-xl-4 { 
//               flex: 0 0 33.333333% !important; 
//               max-width: 33.333333% !important; 
//               min-height: auto !important;
//               height: auto !important;
//             }
//             .col-5, .col-sm-5, .col-md-5, .col-lg-5, .col-xl-5 { 
//               flex: 0 0 41.666667% !important; 
//               max-width: 41.666667% !important; 
//               min-height: auto !important;
//               height: auto !important;
//             }
//             .col-6, .col-sm-6, .col-md-6, .col-lg-6, .col-xl-6 { 
//               flex: 0 0 50% !important; 
//               max-width: 50% !important; 
//               min-height: auto !important;
//               height: auto !important;
//             }
//             .col-7, .col-sm-7, .col-md-7, .col-lg-7, .col-xl-7 { 
//               flex: 0 0 58.333333% !important; 
//               max-width: 58.333333% !important; 
//               min-height: auto !important;
//               height: auto !important;
//             }
//             .col-8, .col-sm-8, .col-md-8, .col-lg-8, .col-xl-8 { 
//               flex: 0 0 66.666667% !important; 
//               max-width: 66.666667% !important; 
//               min-height: auto !important;
//               height: auto !important;
//             }
//             .col-9, .col-sm-9, .col-md-9, .col-lg-9, .col-xl-9 { 
//               flex: 0 0 75% !important; 
//               max-width: 75% !important; 
//               min-height: auto !important;
//               height: auto !important;
//             }
//             .col-10, .col-sm-10, .col-md-10, .col-lg-10, .col-xl-10 { 
//               flex: 0 0 83.333333% !important; 
//               max-width: 83.333333% !important; 
//               min-height: auto !important;
//               height: auto !important;
//             }
//             .col-11, .col-sm-11, .col-md-11, .col-lg-11, .col-xl-11 { 
//               flex: 0 0 91.666667% !important; 
//               max-width: 91.666667% !important; 
//               min-height: auto !important;
//               height: auto !important;
//             }
//             .col-12, .col-sm-12, .col-md-12, .col-lg-12, .col-xl-12 { 
//               flex: 0 0 100% !important; 
//               max-width: 100% !important; 
//               min-height: auto !important;
//               height: auto !important;
//             }
            
//             /* Auto columns */
//             .col, .col-sm, .col-md, .col-lg, .col-xl {
//               flex: 1 0 0% !important;
//               max-width: 100% !important;
//               min-height: auto !important;
//               height: auto !important;
//             }
            
//             /* Bootstrap utility classes */
//             .d-flex { display: flex !important; }
//             .d-block { display: block !important; }
//             .d-inline { display: inline !important; }
//             .d-inline-block { display: inline-block !important; }
            
//             .justify-content-start { justify-content: flex-start !important; }
//             .justify-content-end { justify-content: flex-end !important; }
//             .justify-content-center { justify-content: center !important; }
//             .justify-content-between { justify-content: space-between !important; }
//             .justify-content-around { justify-content: space-around !important; }
            
//             .align-items-start { align-items: flex-start !important; }
//             .align-items-end { align-items: flex-end !important; }
//             .align-items-center { align-items: center !important; }
//             .align-items-baseline { align-items: baseline !important; }
//             .align-items-stretch { align-items: stretch !important; }
            
//             /* Text alignment */
//             .text-left { text-align: left !important; }
//             .text-center { text-align: center !important; }
//             .text-right { text-align: right !important; }
//             .text-justify { text-align: justify !important; }
            
//             /* Hide on print */
//             .${HIDE_CLASS} {
//               display: none !important;
//               visibility: hidden !important;
//               opacity: 0 !important;
//               height: 0 !important;
//               width: 0 !important;
//               margin: 0 !important;
//               padding: 0 !important;
//               border: none !important;
//               overflow: hidden !important;
//             }
            
//             /* Page break handling */
//             .page-break {
//               display: none !important;
//               visibility: hidden !important;
//               height: 0 !important;
//               margin: 0 !important;
//               padding: 0 !important;
//               border: none !important;
//               page-break-before: always !important;
//               break-before: page !important;
//             }
            
//             .page-break + * {
//               page-break-before: always !important;
//               break-before: page !important;
//             }
            
//             .force-page-break {
//               page-break-before: always !important;
//               break-before: page !important;
//             }
            
//             /* Editor specific elements */
//             .page-indicator,
//             .virtual-sections-panel,
//             .section-panel-toggle,
//             .page-section-label,
//             .page-section-dashed-line
//             .sections-container {
//               display: none !important;
//             }
            
//             .page-container {
//               page-break-after: always !important;
//               margin: 0 !important;
//               box-shadow: none !important;
//               border: none !important;
//               width: 100% !important;
//               height:297mm !important;
//               display: block !important;
//               overflow: visible !important;
//             }
            
//             .page-content {
//               width: 100% !important;
//               height: 100% !important;
//               margin: 0 !important;
//               padding: 0 !important;
//               overflow: visible !important;
//             }
            
//             .main-content-area {
//               width: 100% !important;
//               height: 100% !important;
//               overflow: visible !important;
//               position: relative !important;
//             }


//             .page-section {
//               border: none !important;
//               background: transparent !important;
//             }
            
//             .page-header-element,
//             .page-footer-element {
//               display: flex !important;
//               position: static !important;
//               background: transparent !important;
//               border: none !important;
//               box-shadow: none !important;
//             }
// .page-number-element {
//   display: block !important;
//   visibility: visible !important;
//   opacity: 1 !important;
//   position: absolute !important;
//   z-index: 9999 !important;
//   font-family: Arial, sans-serif !important;
//   background: transparent !important;
//   white-space: nowrap !important;
//   pointer-events: none !important;
// }
            
//             .page-watermark {
//               display: flex !important;
//               position: absolute !important;
//               top: 0 !important;
//               left: 0 !important;
//               right: 0 !important;
//               bottom: 0 !important;
//               pointer-events: none !important;
//               z-index: 1 !important;
//             }
            
//             /* Ensure tables appear on all pages */
//             .page-container table,
//             .main-content-area table,
//             [data-i_designer-type="custom_table"] table {
//               display: table !important;
//               visibility: visible !important;
//               opacity: 1 !important;
//             }
// /* Hide dynamically hidden elements */
// .dynamic-hidden-element {
//   display: none !important;
//   visibility: hidden !important;
//   opacity: 0 !important;
//   height: 0 !important;
//   width: 0 !important;
//   margin: 0 !important;
//   padding: 0 !important;
//   border: none !important;
//   overflow: hidden !important;
//   position: absolute !important;
//   left: -9999px !important;
// }

// /* Also hide by inline style */
// *[style*="display: none"],
// *[style*="display:none"] {
//   display: none !important;
//   visibility: hidden !important;
//   opacity: 0 !important;
//   height: 0 !important;
//   width: 0 !important;
//   margin: 0 !important;
//   padding: 0 !important;
//   border: none !important;
//   overflow: hidden !important;
//   position: absolute !important;
//   left: -9999px !important;
// }

//               /* Highcharts container handling */
//   [data-i_designer-type="custom_line_chart"],
//   .highcharts-container,
//   .highcharts-root {
//     display: block !important;
//     visibility: visible !important;
//     opacity: 1 !important;
//     width: 100% !important;
//     height: auto !important;
//     min-height: 300px !important;
//     overflow: visible !important;
//     position: relative !important;
//     page-break-inside: avoid !important;
//     break-inside: avoid !important;
//     background: white !important;
//     -webkit-print-color-adjust: exact !important;
//     color-adjust: exact !important;
//     print-color-adjust: exact !important;
//   }
  
//   /* Highcharts SVG elements */
//   .highcharts-container svg,
//   .highcharts-root svg {
//     width: 100% !important;
//     height: auto !important;
//     max-width: 100% !important;
//     display: block !important;
//     visibility: visible !important;
//     opacity: 1 !important;
//     position: relative !important;
//     background: white !important;
//     -webkit-print-color-adjust: exact !important;
//     color-adjust: exact !important;
//     print-color-adjust: exact !important;
//   }
  
//   /* Force chart elements to be visible */
//   .highcharts-series,
//   .highcharts-series-group,
//   .highcharts-markers,
//   .highcharts-line-series,
//   .highcharts-area-series,
//   .highcharts-column-series,
//   .highcharts-bar-series,
//   .highcharts-pie-series,
//   .highcharts-legend,
//   .highcharts-title,
//   .highcharts-subtitle,
//   .highcharts-axis,
//   .highcharts-axis-labels,
//   .highcharts-grid {
//     display: block !important;
//     visibility: visible !important;
//     opacity: 1 !important;
//     -webkit-print-color-adjust: exact !important;
//     color-adjust: exact !important;
//     print-color-adjust: exact !important;
//   }
  
//   /* Hide chart loading indicators */
//   .highcharts-loading,
//   .highcharts-loading-inner {
//     display: none !important;
//     visibility: hidden !important;
//   }
  
//   /* Ensure chart labels are readable */
//   .highcharts-axis-labels text,
//   .highcharts-data-labels text,
//   .highcharts-legend-item text,
//   .highcharts-title,
//   .highcharts-subtitle {
//     fill: #333 !important;
//     color: #333 !important;
//     font-size: 12px !important;
//     font-family: Arial, sans-serif !important;
//   }
//           }
          
//           /* Screen styles */
//           @media screen {
//             body {
//               font-family: Arial, sans-serif;
//               line-height: 1.4;
//               color: #333;
//               background: white;
//               margin: 0;
//             }
//           }
          
//           /* Original editor CSS */
//           ${editorCSS}
//         </style>
//       </head>
//       <body>
//         ${processedHTMLWithInlineStyles}
//       </body>
//       </html>
//     `;

//     // Write content to iframe
//     const frameDoc = printFrame.contentDocument || printFrame.contentWindow.document;
//     frameDoc.open();
//     const checkAndProcessLinks = (htmlContent) => {
//       const tempDiv = document.createElement('div');
//       tempDiv.innerHTML = htmlContent;

//       // Get current editor CSS to check for pointer-events: none rules
//       const editorCSS = editor.getCss();

//       // Find all anchor tags
//       const allLinks = tempDiv.querySelectorAll('a[id]');

//       allLinks.forEach(link => {
//         const linkId = link.id;

//         // Check if CSS contains pointer-events: none for this ID
//         const idSelector = `#${linkId}`;
//         const cssRegex = new RegExp(`#${linkId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^{}]*{[^{}]*pointer-events\\s*:\\s*none`, 'i');

//         if (cssRegex.test(editorCSS)) {
//           // Remove href attribute completely
//           link.removeAttribute('href');
//           console.log(`Removed href from link: ${linkId}`);
//         }
//       });

//       return tempDiv.innerHTML;
//     };

//     // Process the HTML content
//     const processedHTMLWithLinksFixed = checkAndProcessLinks(processedHTMLWithInlineStyles);

//     const finalPrintContent = printContent.replace(processedHTMLWithInlineStyles, processedHTMLWithLinksFixed);
//     frameDoc.write(finalPrintContent);
//     frameDoc.close();
//     // Wait for content to load, then trigger print dialog
//     printFrame.onload = () => {
//       setTimeout(() => {
//         printFrame.contentWindow.focus();
//         printFrame.contentWindow.print();

//         // Cleanup after print dialog is triggered
//         setTimeout(() => {
//           if (document.body.contains(printFrame)) {
//             document.body.removeChild(printFrame);
//           }
//         }, 100);
//       }, 500);
//     };
//   } catch (error) {
//     console.error("Error generating print dialog:", error);
//     alert("Error opening print dialog. Please try again.");
//   }
// }

// function processPageBreaks(html) {
//   const tempDiv = document.createElement("div");
//   tempDiv.innerHTML = html;

//   const pageBreaks = tempDiv.querySelectorAll(".page-break");

//   pageBreaks.forEach((pageBreak) => {
//     const nextElement = pageBreak.nextElementSibling;
//     if (nextElement) {
//       nextElement.classList.add("force-page-break");
//     }

//     pageBreak.classList.add("hide-on-print");
//     pageBreak.setAttribute("data-page-break", "true");
//   });

//   return tempDiv.innerHTML;
// }

async function generatePrintDialog() {
 const apiUrl = "http://192.168.0.188:8081/jsonApi/uploadHtmlToPdf";

  // --- Create and show loading overlay ---
  let overlay = document.createElement("div");
  overlay.id = "pdf-loading-overlay";
  Object.assign(overlay.style, {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "rgba(0,0,0,0.5)",
    color: "#fff",
    fontSize: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  });
  overlay.innerText = "Generating PDF...";
  document.body.appendChild(overlay);

  try {
    // Get GrapesJS HTML & CSS
    const html = editor.getHtml();
    const css = editor.getCss();

    // --- Prepare Final HTML with CSS ---
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;

    // Remove margins from .page-container elements
    const pageContainers = tempDiv.querySelectorAll(".page-container");
    const idsToClean = [];

    pageContainers.forEach(el => {
      if (el.id) idsToClean.push(el.id);
    });

    let cleanedCss = css;
    idsToClean.forEach(id => {
      const idRegex = new RegExp(`(#${id}\\s*{[^}]*?)margin[^;]*;`, "g");
      cleanedCss = cleanedCss.replace(idRegex, "$1");
    });

    // --- Add external CSS and JS resources ---
    const canvasResources = {
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
        "https://cdn.jsdelivr.net/npm/hot-formula-parser@4.0.0/dist/formula-parser.min.js",
        "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js",
        "https://cdn.jsdelivr.net/npm/html-docx-js/dist/html-docx.js",
        "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
        "https://cdn.jsdelivr.net/npm/html-to-rtf@2.1.0/app/browser/bundle.min.js"
      ]
    };

    const externalStyles = canvasResources.styles
      .map((url) => `<link rel="stylesheet" href="${url}">`)
      .join("\n");

    const externalScripts = canvasResources.scripts
      .map((url) => `<script src="${url}" defer></script>`)
      .join("\n");

      // --- Handle Subreport Embedding ---
const subreports = tempDiv.querySelectorAll('.subreport-container');
for (const sub of subreports) {
  const src = sub.getAttribute('data-subreport-src');
  if (src) {
    try {
      const res = await fetch(src);
      const subHtml = await res.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(subHtml, 'text/html');

      // Remove any duplicate <html>/<body>
      const subContent = doc.body ? doc.body.innerHTML : subHtml;

      // Optional: Add subreport boundary for visual clarity
      const wrapper = document.createElement('div');
      wrapper.classList.add('embedded-subreport');
      wrapper.innerHTML = subContent;

      // Merge header/footer logic placeholder
      if (sub.getAttribute('data-merge-header-footer') === 'true') {
        // You can inject or align header/footer from main report here
      }

      sub.innerHTML = wrapper.outerHTML;
    } catch (err) {
      console.warn('⚠️ Subreport Load Failed:', src, err);
      sub.innerHTML = `<div style="color:red;">Failed to embed subreport (${src})</div>`;
    }
  }
}

    // Combine everything into full HTML
    const finalHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          ${externalStyles}
          <style>${css}</style>
          ${externalScripts}
        </head>
        <body>${tempDiv.innerHTML}</body>
      </html>
    `;

    // --- Debug: Log & download HTML before hitting API ---
    console.log("🚀 Final HTML being sent to PDF API:\n", finalHtml);
    try {
      const debugUrl = URL.createObjectURL(new Blob([finalHtml], { type: "text/html" }));
      const debugLink = document.createElement("a");
      debugLink.href = debugUrl;
      debugLink.download = "sent_to_pdf_api.html";
      debugLink.click();
      URL.revokeObjectURL(debugUrl);
      console.log("💾 Debug copy of HTML downloaded for verification");
    } catch (err) {
      console.warn("⚠️ Could not auto-download debug HTML:", err);
    }

    // --- Prepare FormData (only HTML file) ---
    const formData = new FormData();
    formData.append("file", new Blob([finalHtml], { type: "text/html" }), "template.html");

    console.log("🚀 Sending HTML to PDF API:", apiUrl);

    // --- Send to backend ---
    const response = await fetch(apiUrl, { method: "POST", body: formData });
    if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);

    const blob = await response.blob();
    const contentType = response.headers.get("Content-Type");

    if (contentType && contentType.includes("pdf")) {
      // ✅ Trigger browser download (opens Save As dialog in Windows)
      const pdfUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = pdfUrl;
      a.download = "generated.pdf"; // default filename
      a.click();
      URL.revokeObjectURL(pdfUrl);

      console.log("✅ PDF download triggered successfully!");
    } else {
      console.warn("⚠️ Unexpected response type:", contentType);
      alert("Unexpected response from server, PDF not received.");
    }
  } catch (err) {
    console.error("❌ Error generating PDF:", err);
    alert("Failed to generate PDF. Check console for details.");
  } finally {
    // --- Remove overlay ---
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }
}



// Attach event listener to button
var el = document.getElementById("exportPDF");
if (el) {
  el.addEventListener("click", generatePrintDialog, true);
}

// Preserve all existing functionality
var singlePageData = JSON.parse(sessionStorage.getItem("single-page")) || {};
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

function downloadPage(){
  pageName = document.getElementById('singleSavePageName').value; 
  if(pageName === null ||pageName ===undefined || pageName ===''){
    alert('Page name required');
    return false;
  }
  var htmlContent = editor.getHtml();
  var cssContent = editor.getCss();
  htmlContent =
    "<html><head><style>" +
    cssContent + `  .navbar-div .hamburger-menu { display: none !important;  text-align: right;
      font-size: 30px; padding: 10px; color: #472e90; cursor: pointer;
    }  @media (max-width: 991px) {  .navbar-div .hamburger-menu { display: block !important; }
      .navbar-div .tab-container, .navbar-div .tab{ width:99%; text-align:center; }
     .navbar-div .tab-container{display:none}
    } 
    @media (max-width: 767px){ .navbar-div .hamburger-menu {   display: block !important; }
     .navbar-div .tab-container, .navbar-div .tab{
       width:98%; } 
    .navbar-div .tab-container{display:none}
    }` +
    "</style></head>" + 
    htmlContent + `<script>
    var hamburgerMenu = document.getElementById("hamburgerMenu"); 
        if(hamburgerMenu !==null){
          var tabContainer = document.querySelector(".tab-container");  
          hamburgerMenu.addEventListener("click", function() {
              if (tabContainer.style.display === "block") {
                tabContainer.style.display = "none";
              } else {
                tabContainer.style.display = "block";
              }
            });   
          function  updateView(){   
            const viewportWidth = Math.max(document.documentElement.clientWidth, window.innerWidth || 0); 
            const tabContainer = document.querySelector(".tab-container");  
            if (viewportWidth >= 991) {  
              tabContainer.style.display = "block";
            } else{
              tabContainer.style.display = "none";
            } 
          }  
          window.addEventListener('resize', updateView); 
        }
    </script>` +
    "</html>";  
    sessionStorage.setItem('single-page',  JSON.stringify(htmlContent)); 
    var blob = new Blob([htmlContent], {type: "text/html;charset=utf-8"});  
    var url = URL.createObjectURL(blob);  
    var link = document.createElement("a");
    link.href = url;
    link.download = pageName+".html";  
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link); 
    URL.revokeObjectURL(url);
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

// editor.BlockManager.add('draggable-section-container', {
//   label: 'Draggable Container',
//   category: 'Basic',
//   media: '<svg viewBox="0 0 24 24">\n        <path fill="currentColor" d="M2 20h20V4H2v16Zm-1 0V4a1 1 0 0 1 1-1h20a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1Z"/>\n      </svg>',
//   content: `
//   <style>
//       @media print {
//         .draggable-section-container {
//           border: none !important;
//         }
//       }
//     </style>
//     <div class="draggable-section-container" style="position: relative; border: 2px dashed #888; padding: 10px; min-height: 67px;">
//       <div class="draggable-child" style="width: 200px; height: 47px;">
//         Drag me inside
//       </div>
//     </div>
//   `,
// });

// // === State variables for drag & rotation ===
// let isDragging = false;
// let startX = 0;
// let startY = 0;
// let currentX = 0;
// let currentY = 0;
// let currentRotation = 0;   // ✅ track rotation
// let selectedEl = null;
// let parentEl = null;

// editor.on('component:selected', (component) => {
//   const el = component.getEl();

//   // ✅ Enable rotation logic for line & rectangle
//   if (component.get('type') === 'line' || component.get('type') === 'rectangle') {
//     const resizable = component.get('resizable') || {};
//     resizable.rotator = true;

//     // ✅ Add rotation handler to merge transform
//     resizable.onRotate = (event, { rotation }) => {
//       currentRotation = rotation;
//       component.addStyle({
//         transform: `translate(${currentX}px, ${currentY}px) rotate(${currentRotation}deg)`
//       });
//     };

//     component.set('resizable', resizable);
//   }

//   // Check if it's a direct child of .custom-container
//   if (el?.parentElement?.classList.contains('draggable-section-container')) {
//     const parent = el.parentElement;
//     parent.style.position = 'relative';
//     selectedEl = el;
//     parentEl = parent;

//     const compId = component.getId();
//     const selector = `#${compId}`;

//     el.onmousedown = function (e) {
//       e.preventDefault();
//       isDragging = true;
//       startX = e.clientX - currentX;
//       startY = e.clientY - currentY;

//       document.onmousemove = function (e) {
//         if (!isDragging) return;

//         const newX = e.clientX - startX;
//         const newY = e.clientY - startY;

//         const parentRect = parentEl.getBoundingClientRect();
//         currentX = Math.max(0, Math.min(newX, parentRect.width - selectedEl.offsetWidth));
//         currentY = Math.max(0, Math.min(newY, parentRect.height - selectedEl.offsetHeight));

//         // ✅ Merge translate + rotate in drag
//         const cssRule = editor.CssComposer.getRule(selector) || editor.CssComposer.add([selector]);
//         cssRule.addStyle({
//           transform: `translate(${currentX}px, ${currentY}px) rotate(${currentRotation}deg)`
//         });
//       };

//       document.onmouseup = function () {
//         isDragging = false;
//         document.onmousemove = null;
//         document.onmouseup = null;
//       };
//     };
//   } else {
//     // If selected component is not child of custom container, disable custom dragging
//     if (el) {
//       el.onmousedown = null;
//     }
//   }
// });

// ******* END Resize and drag code ***********
// ✅ Always track internal <a> links

editor.on('load', () => {
  console.log("hiiiiiii")
  const scanLinks = () => {
    const wrapper = editor.getWrapper();
    const allLinks = wrapper.find('a');

    allLinks.forEach(linkComp => {
      const href = linkComp.getAttributes().href || '';

      if (href.startsWith('#')) {
        console.log("# found)")
        const pageContainer = linkComp.closest('.page-container');
        if (!pageContainer) return;

        const targetId = href.slice(1); // remove "#"
        const target = pageContainer.find(`#${targetId}`);

        if (target && target.length > 0) {
          // ✅ Target found → force styles
          linkComp.setStyle({
            ...linkComp.getStyle(),
            color: 'black',
            cursor: 'text',
          });
        } else {
          // ❌ Target missing → reset only our forced styles
          const style = { ...linkComp.getStyle() };
          delete style.color;
          delete style.cursor;
          linkComp.setStyle(style);
        }
      } else {
        // ❌ Not an internal anchor → reset styles if we forced them
        const style = { ...linkComp.getStyle() };
        delete style.color;
        delete style.cursor;
        linkComp.setStyle(style);
      }
    });
  };

  // 🔄 Initial run
  scanLinks();

  // 🔄 Keep scanning on any change
  editor.on('component:add', scanLinks);
  editor.on('component:update', scanLinks);
  editor.on('component:remove', scanLinks);
});


// ******** Same Link Page disable code

function importSinglePages() {
  editor.Modal.setTitle('Add Page Name');
  editor.Modal.setContent(`<div class="new-table-form">
  <div> 
      <input type="file" class="form-control popupinput2" value="" accept="application/html" placeholder="Enter page name" style="width:95%"  name="importSinglePageInput" id="importSinglePageInput">
  </div>  
  <input id="import-single-file" class="popupaddbtn" type="button" value="Add" data-component-id="c1006">
  </div>
  </div>
  `);
  editor.Modal.open();
  var el = document.getElementById("import-single-file");
  el.addEventListener("click", importFile, true);
}

function importFile(){
  const input = document.getElementById('importSinglePageInput');
  const file = input.files[0];
  if (file) { 
    const reader = new FileReader();
    reader.onload = function(e) {
      const code = e.target.result;  
      sessionStorage.setItem('single-page', JSON.stringify(code)); 
      editor.setComponents(code); 
      editor.Modal.close(); 

      // ✅ Run embedded scripts manually
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = code;
      tempDiv.querySelectorAll('script').forEach(scr => {
        const newScript = document.createElement('script');
        if (scr.src) {
          newScript.src = scr.src;
        } else {
          newScript.textContent = scr.innerHTML;
        }
        document.body.appendChild(newScript);
      });
    }
    reader.readAsText(file);
  } else {
    alert('No file selected'); 
  } 
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


// let hasChanges = false;

// // Listen for any changes in the editor
// editor.on('update', () => {
//   hasChanges = true;
// });

// // Add an event listener for the beforeunload event
// window.addEventListener('beforeunload', function (e) {
//   if (hasChanges) {
//     // Cancel the event
//     e.preventDefault(); 
//     // Chrome requires returnValue to be set
//     e.returnValue = ''; 
//     // The browser will display a generic confirmation message (e.g., "Changes you made may not be saved")
//   }
// });