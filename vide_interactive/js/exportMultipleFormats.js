function exportPlugin(editor) {
  const modal = editor.Modal;

  editor.on("load", () => {
    const devicesPanel = editor.Panels.getPanel("devices-c");

    if (devicesPanel) {
      devicesPanel.get("buttons").add([{
        id: "export-plugin",
        className: "fa fa-external-link",
        command: "open-export-modal",
        attributes: { title: "Export" }
      }]);
    }
  });

  // Open modal
  editor.Commands.add('open-export-modal', {
    run() {
      modal.setTitle('Export');
      modal.setContent(`
        <style>
          .exp-container {
            padding: 15px;
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
            gap: 12px;
          }
          .exp-btn {
            padding: 10px 14px;
            border: none;
            border-radius: 8px;
            background: #4a90e2;
            color: #fff;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease-in-out;
            text-align: center;
          }
          .exp-btn:hover {
            background: #357abd;
            transform: translateY(-2px);
            box-shadow: 0 3px 6px rgba(0,0,0,0.15);
          }
          .exp-spinner {
            display: none;
            justify-content: center;
            align-items: center;
            margin-top: 15px;
          }
          .exp-spinner div {
            width: 28px;
            height: 28px;
            border: 3px solid #4a90e2;
            border-top: 3px solid transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .exp-toast {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #323232;
            color: #fff;
            padding: 8px 14px;
            border-radius: 6px;
            font-size: 13px;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.4s ease;
          }
          .exp-toast.show {
            opacity: 1;
          }
        </style>
        <div class="exp-container">
          <button class="exp-btn" data-format="txt">TXT</button>
          <button class="exp-btn" data-format="csv">CSV</button>
          <button class="exp-btn" data-format="docx">DOCX</button>
          <button class="exp-btn" data-format="rtf">RTF</button>
          <button class="exp-btn" data-format="xlsx">XLSX</button>
          <button class="exp-btn" data-format="pdf">PDF</button>
        </div>
        <div class="exp-spinner"><div></div></div>
        <div class="exp-toast" id="exp-toast"></div>
      `);

      modal.open();

      modal.getContentEl().querySelectorAll('.exp-btn').forEach(btn => {
        btn.onclick = async () => {
          const format = btn.dataset.format;
          const spinner = modal.getContentEl().querySelector('.exp-spinner');
          const toast = modal.getContentEl().querySelector('#exp-toast');
          spinner.style.display = 'flex';
          try {
            await exportContent(editor, format);
            showToast(toast, `Exported as ${format.toUpperCase()} ✅`);
          } catch (e) {
            showToast(toast, `Export failed ❌`);
            console.error(e);
          } finally {
            spinner.style.display = 'none';
          }
        };
      });
    }
  });

  function showToast(toast, msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  // ===== Export functions =====
  async function exportContent(editor, format) {
    const iframe = editor.Canvas.getFrameEl();
    const doc = iframe.contentDocument || iframe.contentWindow.document;

    switch (format) {
      case 'txt': return exportTXT(doc);
      case 'csv': return exportCSV(doc);
      case 'xlsx': return exportXLSX(doc);
      case 'docx': return exportDOCX(editor);
      case 'rtf': return await exportRTF(editor, doc);
      case 'pdf': return await exportPDF(doc.body);
    }
  }

  function exportTXT(doc) {
    const text = doc.body.innerText;
    downloadFile(text, 'export.txt', 'text/plain');
  }

  async function exportCSV(doc) {
    let csv = '';

    function processNode(node) {
      if (node.nodeType === 3) {
        const text = node.textContent.trim();
        if (text) csv += `"${text.replace(/"/g, '""')}"\n`;
      } else if (node.nodeType === 1) {
        if (['STYLE', 'SCRIPT'].includes(node.tagName)) return;
        if (node.tagName === 'TABLE') {
          const rows = node.querySelectorAll('tr');
          rows.forEach(row => {
            const cells = Array.from(row.querySelectorAll('td, th'));
            csv += cells.map(c => `"${c.innerText.trim().replace(/"/g, '""')}"`).join(',') + '\n';
          });
          csv += '\n';
        } else {
          node.childNodes.forEach(processNode);
          if (['P', 'DIV', 'BR'].includes(node.tagName)) csv += '\n';
        }
      }
    }

    doc.body.childNodes.forEach(processNode);
    downloadFile(csv, 'export.csv', 'text/csv');
  }

  async function exportXLSX(doc) {
    if (!window.ExcelJS) {
      alert("Please include ExcelJS library!");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sheet1');
    let rowIndex = 1;

    async function processNode(node) {
      if (node.nodeType === 3) {
        const text = node.textContent.trim();
        if (text) {
          sheet.getRow(rowIndex).getCell(1).value = text;
          rowIndex++;
        }
      } else if (node.nodeType === 1) {
        if (['STYLE', 'SCRIPT'].includes(node.tagName)) return;

        if (node.tagName === 'TABLE') {
          const rows = node.querySelectorAll('tr');
          for (const row of rows) {
            const cells = row.querySelectorAll('td, th');
            let colIndex = 1;
            for (const cell of cells) {
              sheet.getRow(rowIndex).getCell(colIndex).value = cell.innerText.trim();
              colIndex++;
            }
            rowIndex++;
          }
        } else {
          for (const child of node.childNodes) {
            await processNode(child);
          }
          if (['P', 'DIV', 'BR', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(node.tagName)) {
            rowIndex++;
          }
        }
      }
    }

    await processNode(doc.body);

    const buffer = await workbook.xlsx.writeBuffer();
    downloadFile(new Blob([buffer], { type: 'application/octet-stream' }), 'export.xlsx');
  }

  async function exportDOCX(editor) {
    if (!window.htmlDocx) {
      alert("DOCX library not loaded!");
      return;
    }

    const html = editor.getHtml();
    const css = editor.getCss();
    const tempEl = document.createElement('div');
    tempEl.innerHTML = html;

    // Convert images to base64
    const images = tempEl.querySelectorAll('img');
    for (const img of images) {
      try {
        const response = await fetch(img.src);
        const blob = await response.blob();
        const dataUrl = await new Promise(resolve => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
        img.setAttribute('src', dataUrl);
      } catch (e) {
        console.warn("Failed to inline image:", img.src, e);
      }
    }

    const styledHtml = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            table, td, th { border: 1px solid #000; border-collapse: collapse; }
            td, th { padding: 8px; }
            img { max-width: 600px; height: auto; }
            ${css}
          </style>
        </head>
        <body>
          ${tempEl.innerHTML}
        </body>
      </html>
    `;

    const blob = window.htmlDocx.asBlob(styledHtml);
    downloadFile(blob, 'export.docx');
  }

  // Enhanced RTF Export with proper image handling
async function exportRTF(body) {
  const apiUrl = "http://192.168.0.188:8081/api/toRtf";

  // --- Create and show loading overlay ---
  let overlay = document.createElement("div");
  overlay.id = "rtf-loading-overlay";
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
  overlay.innerText = "Generating RTF...";
  document.body.appendChild(overlay);

  try {
    // --- Prepare clean HTML for API ---
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = body.outerHTML;

    // 🧹 Remove unwanted IDs from common page containers
    const classesToClean = [
      "page-container",
      "page-content",
      "header-wrapper",
      "page-header-element",
      "content-wrapper",
      "main-content-area",
      "footer-wrapper",
      "page-footer-element",
    ];
    classesToClean.forEach((cls) => {
      tempDiv.querySelectorAll(`.${cls}`).forEach((el) => {
        if (el.hasAttribute("id")) el.removeAttribute("id");
      });
    });

    // --- External CSS and JS Resources ---
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
        "https://cdn.datatables.net/1.10.13/js/jquery.dataTables.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/jszip/2.5.0/jszip.min.js",
        "https://cdn.datatables.net/buttons/1.2.4/js/buttons.html5.min.js",
        "https://cdn.datatables.net/buttons/1.2.4/js/dataTables.buttons.min.js",
        "https://code.highcharts.com/highcharts.js",
        "https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.4/moment.min.js",
        "https://cdn.jsdelivr.net/npm/html-to-rtf@2.1.0/app/browser/bundle.min.js"
      ],
    };

    const externalStyles = canvasResources.styles
      .map((url) => `<link rel="stylesheet" href="${url}">`)
      .join("\n");

    const externalScripts = canvasResources.scripts
      .map((url) => `<script src="${url}" defer></script>`)
      .join("\n");

    // --- Construct full HTML ---
    const finalHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          ${externalStyles}
          <style>body { margin: 0; padding: 0; }</style>
          ${externalScripts}
        </head>
        <body>${tempDiv.innerHTML}</body>
      </html>
    `;

    // --- Optional: Debug HTML before sending ---
    try {
      const debugUrl = URL.createObjectURL(new Blob([finalHtml], { type: "text/html" }));
      const debugLink = document.createElement("a");
      debugLink.href = debugUrl;
      debugLink.download = "sent_to_rtf_api.html";
      debugLink.click();
      URL.revokeObjectURL(debugUrl);
    } catch (err) {
      console.warn("⚠️ Could not auto-download debug HTML:", err);
    }

    // --- Send HTML to RTF API ---
    const formData = new FormData();
    formData.append("file", new Blob([finalHtml], { type: "text/html" }), "export.html");

    const response = await fetch(apiUrl, { method: "POST", body: formData });
    if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);

    const blob = await response.blob();
    const contentType = response.headers.get("Content-Type");

    if (contentType && (contentType.includes("rtf") || contentType.includes("application/octet-stream"))) {
      const rtfUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = rtfUrl;
      a.download = "export.rtf";
      a.click();
      URL.revokeObjectURL(rtfUrl);
      console.log("✅ RTF downloaded successfully!");
    } else {
      console.warn("⚠️ Unexpected response type:", contentType);
      alert("Unexpected response from server — RTF not received.");
    }

  } catch (err) {
    console.error("❌ Error exporting RTF:", err);
    alert("Failed to export RTF. Check console for details.");
  } finally {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }
}


async function exportPDF(body) {
  const apiUrl = "http://192.168.0.188:8081/jsonApi/uploadSinglePagePdf";

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
    // --- Prepare Final HTML with external CSS/JS and cleaned DOM ---
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = body.outerHTML;

    // 🧹 Remove IDs from specific page-related classes
    const classesToClean = [
      "page-container",
      "page-content",
      "header-wrapper",
      "page-header-element",
      "content-wrapper",
      "main-content-area",
      "footer-wrapper",
      "page-footer-element",
    ];
    classesToClean.forEach((cls) => {
      tempDiv.querySelectorAll(`.${cls}`).forEach((el) => {
        if (el.hasAttribute("id")) el.removeAttribute("id");
      });
    });

    // --- External CSS and JS ---
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
        "https://cdn.datatables.net/1.10.13/js/jquery.dataTables.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/jszip/2.5.0/jszip.min.js",
        "https://cdn.rawgit.com/bpampuch/pdfmake/0.1.24/build/pdfmake.min.js",
        "https://cdn.rawgit.com/bpampuch/pdfmake/0.1.24/build/vfs_fonts.js",
        "https://cdn.datatables.net/buttons/1.2.4/js/buttons.html5.min.js",
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
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
        "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js",
        "https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js",
        "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js",
        "https://cdn.jsdelivr.net/npm/hot-formula-parser@4.0.0/dist/formula-parser.min.js",
        "https://cdn.jsdelivr.net/npm/html-to-rtf@2.1.0/app/browser/bundle.min.js"
      ]
    };

    const externalStyles = canvasResources.styles
      .map((url) => `<link rel="stylesheet" href="${url}">`)
      .join("\n");

    const externalScripts = canvasResources.scripts
      .map((url) => `<script src="${url}" defer></script>`)
      .join("\n");

    // --- Combine everything into one HTML ---
    const finalHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          ${externalStyles}
          <style>
            body { margin: 0; padding: 0; }
          </style>
          ${externalScripts}
        </head>
        <body>${tempDiv.innerHTML}</body>
      </html>
    `;

    // --- Debug: Log and download HTML sent to backend ---
    try {
      const debugUrl = URL.createObjectURL(new Blob([finalHtml], { type: "text/html" }));
      const debugLink = document.createElement("a");
      debugLink.href = debugUrl;
      debugLink.download = "sent_to_single_page_pdf_api.html";
      debugLink.click();
      URL.revokeObjectURL(debugUrl);
      console.log("💾 Debug HTML downloaded for inspection");
    } catch (err) {
      console.warn("⚠️ Could not auto-download debug HTML:", err);
    }

    // --- Send to backend API ---
    const formData = new FormData();
    formData.append("file", new Blob([finalHtml], { type: "text/html" }), "single_page.html");

    const response = await fetch(apiUrl, { method: "POST", body: formData });
    if (!response.ok) throw new Error(`API Error: ${response.status} ${response.statusText}`);

    const blob = await response.blob();
    const contentType = response.headers.get("Content-Type");

    if (contentType && contentType.includes("pdf")) {
      const pdfUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = pdfUrl;
      a.download = "export.pdf";
      a.click();
      URL.revokeObjectURL(pdfUrl);
      console.log("✅ PDF downloaded successfully!");
    } else {
      console.warn("⚠️ Unexpected response type:", contentType);
      alert("Unexpected response from server, PDF not received.");
    }

  } catch (err) {
    console.error("❌ Error exporting PDF:", err);
    alert("Failed to export PDF. Check console for details.");
  } finally {
    // --- Remove overlay ---
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
  }
}


  function downloadFile(content, filename, type) {
    let blob = content instanceof Blob ? content : new Blob([content], { type });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}

// Export the plugin
if (typeof module !== 'undefined' && module.exports) {
  module.exports = exportPlugin;
}