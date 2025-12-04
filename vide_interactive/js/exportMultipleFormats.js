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
        </style>
        <div class="exp-container">
          <button class="exp-btn" data-format="txt">TXT</button>
          <button class="exp-btn" data-format="csv">CSV</button>
          <button class="exp-btn" data-format="docx">DOCX</button>
          <button class="exp-btn" data-format="rtf">RTF</button>
          <button class="exp-btn" data-format="xlsx">XLSX</button>
          <button class="exp-btn" data-format="pdf">Single Page PDF</button>
        </div>
        <div class="exp-spinner"><div></div></div>
      `);

      modal.open();

      modal.getContentEl().querySelectorAll('.exp-btn').forEach(btn => {
        btn.onclick = async () => {
          const format = btn.dataset.format;
          const spinner = modal.getContentEl().querySelector('.exp-spinner');
          spinner.style.display = 'flex';
          try {
            await exportContent(editor, format);
            // Toasts removed by request — no UI toast shown on success
          } catch (e) {
            // Toasts removed by request — no UI toast shown on error
            console.error(e);
          } finally {
            spinner.style.display = 'none';
          }
        };
      });
    }
  });

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

  // ---------- Helper: detect chart nodes (only checks the node itself) ----------
  function isHighchartNode(node) {
    if (!node || node.nodeType !== 1) return false; // only element nodes

    const tag = (node.tagName || '').toUpperCase();

    // <figure data-i_designer-type="custom_line_chart">
    if (tag === 'FIGURE' && node.getAttribute('data-i_designer-type') === 'custom_line_chart') {
      return true;
    }

    // Any element that has csvurl attribute (your live-data wrapper)
    if (node.hasAttribute && node.hasAttribute('csvurl')) {
      return true;
    }

    // Elements that are the highcharts render container itself
    if (node.classList && node.classList.contains && node.classList.contains('highchart-live-areaspline')) {
      return true;
    }

    return false;
  }

  // ---------- CSV exporter ----------
  async function exportCSV(doc) {
    let csvLines = [];

    // helper to push a plain text line (escape quotes for CSV)
    function pushTextLine(text) {
      if (text == null) return;
      const trimmed = String(text).replace(/\s+/g, ' ').trim();
      if (!trimmed) return;
      csvLines.push('"' + trimmed.replace(/"/g, '""') + '"');
    }

    function processNodeForCSV(node) {
      if (node.nodeType === 3) { // text node
        const text = node.textContent;
        if (text && text.trim()) pushTextLine(text);
        return;
      }

      if (node.nodeType !== 1) return; // ignore other node types

      // Skip chart nodes only (do not skip parents)
      if (isHighchartNode(node)) return;

      const tag = (node.tagName || '').toUpperCase();

      // Skip style/script
      if (tag === 'STYLE' || tag === 'SCRIPT') return;

      // If it's a TABLE, export table rows as CSV rows (columns comma separated)
      // If it's a TABLE, export table rows as CSV rows (columns comma separated)
      if (tag === 'TABLE') {
        const rows = node.querySelectorAll('tr');
        rows.forEach(row => {
          // Skip summary rows if needed, or include them based on your preference
          const cells = Array.from(row.querySelectorAll('th, td'));
          if (cells.length === 0) return;

          const rowValues = cells.map(cell => {
            // Handle merged cells (rowspan/colspan)
            const text = cell.innerText.trim();
            const rowspan = cell.getAttribute('rowspan');
            const colspan = cell.getAttribute('colspan');

            // If cell has rowspan > 1, it's a grouped cell - keep it
            // If cell has colspan > 1, it spans multiple columns
            return '"' + text.replace(/"/g, '""') + '"';
          }).join(',');

          csvLines.push(rowValues);
        });
        // blank line after table
        csvLines.push('');
        return;
      }

      // For lists, create one line per li (but still process children to capture nested text)
      if (tag === 'UL' || tag === 'OL') {
        const items = node.querySelectorAll(':scope > li');
        if (items.length) {
          items.forEach(li => {
            // collect li text (flatten)
            const text = Array.from(li.childNodes).map(n => n.nodeType === 3 ? n.textContent : (n.innerText || '')).join(' ').replace(/\s+/g, ' ').trim();
            if (text) csvLines.push('"' + text.replace(/"/g, '""') + '"');
          });
          csvLines.push('');
          return;
        }
      }

      // Otherwise, recurse children
      node.childNodes.forEach(child => processNodeForCSV(child));

      // If block-level element, add a blank line separator (to keep paragraphs separate)
      const blockTags = ['P', 'DIV', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'MAIN', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BR'];
      if (blockTags.includes(tag)) {
        csvLines.push('');
      }
    }

    // Start from body children to avoid skipping if body itself contains chart descendant
    doc.body.childNodes.forEach(child => processNodeForCSV(child));

    // Filter out any accidental runs of empty lines and join
    const compacted = [];
    let lastWasEmpty = false;
    csvLines.forEach(line => {
      const isEmpty = (line === '' || line == null);
      if (isEmpty && lastWasEmpty) return;
      compacted.push(isEmpty ? '' : line);
      lastWasEmpty = isEmpty;
    });

    const csv = compacted.join('\n');
    downloadFile(csv, 'export.csv', 'text/csv');
  }

  // ---------- XLSX exporter (ExcelJS required) ----------
  async function exportXLSX(doc) {
    if (!window.ExcelJS) {
      alert("Please include ExcelJS library!");
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Sheet1');
    let nextRow = 1;

    // helper: append a simple text row (single column)
    function appendTextRow(text) {
      const trimmed = text == null ? '' : String(text).replace(/\s+/g, ' ').trim();
      if (!trimmed) return;
      sheet.getRow(nextRow).getCell(1).value = trimmed;
      nextRow++;
    }

    // helper: append a row with array of values (for tables)
    function appendRowArray(arr) {
      if (!arr || !arr.length) return;
      const row = sheet.getRow(nextRow);
      for (let i = 0; i < arr.length; i++) {
        row.getCell(i + 1).value = arr[i];
      }
      nextRow++;
    }

    async function processNodeForXLSX(node) {
      if (node.nodeType === 3) {
        const text = node.textContent;
        if (text && text.trim()) appendTextRow(text);
        return;
      }
      if (node.nodeType !== 1) return;

      // Skip chart nodes only
      if (isHighchartNode(node)) return;

      const tag = (node.tagName || '').toUpperCase();
      if (tag === 'STYLE' || tag === 'SCRIPT') return;

      if (tag === 'TABLE') {
        const rows = node.querySelectorAll('tr');
        for (const row of rows) {
          const cells = Array.from(row.querySelectorAll('th, td'));
          const values = [];
          let colIndex = 0;

          for (const cell of cells) {
            const text = cell.innerText.trim();
            const colspan = parseInt(cell.getAttribute('colspan')) || 1;
            const rowspan = parseInt(cell.getAttribute('rowspan')) || 1;

            // Add the cell value
            values.push(text);

            // Handle colspan - add empty cells for spanned columns
            for (let i = 1; i < colspan; i++) {
              values.push('');
            }

            // Handle rowspan - mark cells below for merging
            if (rowspan > 1) {
              const currentRow = nextRow;
              const currentCol = colIndex + 1; // Excel columns are 1-indexed

              // Merge cells
              try {
                sheet.mergeCells(
                  currentRow,
                  currentCol,
                  currentRow + rowspan - 1,
                  currentCol + colspan - 1
                );
              } catch (e) {
                console.warn('Could not merge cells:', e);
              }
            }

            colIndex += colspan;
          }

          if (values.length) appendRowArray(values);
        }
        // add a blank row after a table for spacing
        nextRow++;
        return;
      }

      if (tag === 'UL' || tag === 'OL') {
        const items = node.querySelectorAll(':scope > li');
        if (items.length) {
          for (const li of items) {
            const text = Array.from(li.childNodes).map(n => n.nodeType === 3 ? n.textContent : (n.innerText || '')).join(' ').replace(/\s+/g, ' ').trim();
            if (text) appendTextRow(text);
          }
          nextRow++;
          return;
        }
      }

      // Recurse children
      for (const child of Array.from(node.childNodes)) {
        await processNodeForXLSX(child);
      }

      // For block-level tags, increment a blank row to separate paragraphs
      const blockTags = ['P', 'DIV', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'MAIN', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BR'];
      if (blockTags.includes(tag)) nextRow++;
    }

    await processNodeForXLSX(doc.body);

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

    // Convert charts to PNG images using html2canvas
    const chartElements = tempEl.querySelectorAll('[data-i_designer-type="custom_line_chart"], [csvurl], .highchart-live-areaspline');
    for (const chart of chartElements) {
      try {
        // Find the actual chart container in the live canvas
        const iframe = editor.Canvas.getFrameEl();
        const doc = iframe.contentDocument || iframe.contentWindow.document;
        const liveChart = doc.querySelector(`[id="${chart.id}"]`) || chart;

        if (window.html2canvas) {
          const canvas = await window.html2canvas(liveChart, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false
          });
          const dataUrl = canvas.toDataURL('image/png');

          // Replace chart with img tag
          const img = document.createElement('img');
          img.src = dataUrl;
          img.style.maxWidth = '600px';
          img.style.height = 'auto';
          chart.parentNode.replaceChild(img, chart);
        }
      } catch (e) {
        console.warn("Failed to convert chart to image:", e);
      }
    }

    // Convert regular images to base64
    const images = tempEl.querySelectorAll('img');
    for (const img of images) {
      try {
        // Skip if already base64
        if (img.src.startsWith('data:')) continue;

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

  async function convertHighchartsToPNG(html, editor) {
  const temp = document.createElement("div");
  temp.innerHTML = html;

  const chartNodes = temp.querySelectorAll(
    '[data-i_designer-type="custom_line_chart"], [csvurl], .highchart-live-areaspline'
  );

  if (chartNodes.length === 0) return temp.innerHTML;

  const iframe = editor.Canvas.getFrameEl();
  const liveDoc = iframe.contentDocument || iframe.contentWindow.document;

  for (let chart of chartNodes) {
    try {
      let liveChart = liveDoc.getElementById(chart.id) || chart;

      if (!liveChart) continue;

      if (!window.html2canvas) {
        console.warn("html2canvas not loaded");
        continue;
      }

      const canvas = await html2canvas(liveChart, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
      });

      const dataUrl = canvas.toDataURL("image/png");

      // Create IMG with same size
      const rect = liveChart.getBoundingClientRect();
      const img = document.createElement("img");
      img.src = dataUrl;
      img.style.width = rect.width + "px";
      img.style.height = rect.height + "px";
      img.style.display = "block";

      chart.parentNode.replaceChild(img, chart);
    } catch (err) {
      console.warn("Chart PNG conversion failed:", err);
    }
  }

  return temp.innerHTML;
}


  // Enhanced RTF Export with proper image handling
async function exportRTF(editor) {
  const apiUrl = "http://192.168.0.188:8081/api/toRtf";
  const html = editor.getHtml();
  const css = editor.getCss();

  // --- Show loading overlay ---
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
    // ⭐ STEP 1 — Convert Highcharts → PNG before RTF
    let processedHtml = await convertHighchartsToPNG(html, editor);

    // Prepare clean HTML container
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = processedHtml;

    // ⭐ NEW: Reduce height inside .standard tables (100% → 5%)
try {
    const standardTables = tempDiv.querySelectorAll(".standard");

    standardTables.forEach(table => {
        const cells = table.querySelectorAll("th, td, div");

        cells.forEach(cell => {
            let style = cell.getAttribute("style") || "";

            // Replace height:100% → height:5%
            style = style.replace(/height\s*:\s*100%/gi, "height:5%");

            cell.setAttribute("style", style.trim());
        });
    });

    console.log("✔ Standard tables height normalized (100% → 5%)");
} catch (err) {
    console.warn("⚠️ Failed during .standard table height processing:", err);
}


    // Cleanup IDs
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

    // External CSS/JS needed during RTF conversion
    const canvasResources = {
      styles: [
        "https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css",
        "https://use.fontawesome.com/releases/v5.8.2/css/all.css",
        "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap",
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
        "https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.4/moment.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/numeral.js/2.0.6/numeral.min.js",
        "https://cdn.jsdelivr.net/npm/bwip-js/dist/bwip-js-min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
        "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js",
        "https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js",
        "https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js",
        "https://cdn.jsdelivr.net/npm/hot-formula-parser@4.0.0/dist/formula-parser.min.js",
        "https://cdn.jsdelivr.net/npm/html-to-rtf@2.1.0/app/browser/bundle.min.js",
      ],
    };

    const externalStyles = canvasResources.styles
      .map((url) => `<link rel="stylesheet" href="${url}">`)
      .join("\n");

    const externalScripts = canvasResources.scripts
      .map((url) => `<script src="${url}" defer></script>`)
      .join("\n");


    // ⭐ Final HTML for RTF conversion
    const finalHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        ${externalStyles}
        ${externalScripts}
        <style>${css}</style>
      </head>
      <body>${tempDiv.innerHTML}</body>
    </html>
    `;

                // --- Debug: Log and download HTML sent to backend ---
      try {
        const debugUrl = URL.createObjectURL(new Blob([finalHtml], { type: "text/html" }));
        const debugLink = document.createElement("a");
        debugLink.href = debugUrl;
        debugLink.download = "sent_to_rtf.html";
        debugLink.click();
        URL.revokeObjectURL(debugUrl);
        console.log("💾 Debug HTML downloaded for inspection");
      } catch (err) {
        console.warn("⚠️ Could not auto-download debug HTML:", err);
      }
    // Send to backend
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([finalHtml], { type: "text/html" }),
      "export.html"
    );

    const response = await fetch(apiUrl, { method: "POST", body: formData });
    if (!response.ok)
      throw new Error(`API Error: ${response.status} ${response.statusText}`);

    const blob = await response.blob();
    const rtfUrl = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = rtfUrl;
    a.download = "export.rtf";
    a.click();

    URL.revokeObjectURL(rtfUrl);
  } catch (err) {
    console.error("❌ RTF Export Failed:", err);
    alert("RTF export failed. Check console.");
  } finally {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }
}


  async function exportPDF(body) {
    const apiUrl = "http://192.168.0.188:8081/jsonApi/uploadSinglePagePdf";

    const html = editor.getHtml();
    const css = editor.getCss();

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
      tempDiv.innerHTML = html;

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
          "https://use.fontawesome.com/releases/v5.8.2/css/all.css",
          "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap",
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
          "https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.4/moment.min.js",
          "https://cdnjs.cloudflare.com/ajax/libs/numeral.js/2.0.6/numeral.min.js",
          "https://cdn.jsdelivr.net/npm/bwip-js/dist/bwip-js-min.js",
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
          ${externalScripts}
          <style>${css}</style>
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