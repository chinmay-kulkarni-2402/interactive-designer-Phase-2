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
          <button class="exp-btn" data-format="ps">PostScript</button>
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

  // ===== Helpers =====
  function parseTable(table) {
    const grid = [];
    const rowSpans = {};

    for (let r = 0; r < table.rows.length; r++) {
      const row = table.rows[r];
      const outRow = [];
      let colIndex = 0;

      while (rowSpans[`${r},${colIndex}`]) {
        outRow[colIndex] = '';
        colIndex++;
      }

      for (let c = 0; c < row.cells.length; c++) {
        const cell = row.cells[c];
        const text = cell.innerText.trim();

        while (outRow[colIndex] !== undefined) colIndex++;

        const colspan = cell.colSpan || 1;
        const rowspan = cell.rowSpan || 1;

        outRow[colIndex] = text;

        for (let cc = 1; cc < colspan; cc++) {
          outRow[colIndex + cc] = '';
        }

        for (let rr = 1; rr < rowspan; rr++) {
          for (let cc = 0; cc < colspan; cc++) {
            rowSpans[`${r + rr},${colIndex + cc}`] = true;
          }
        }

        colIndex += colspan;
      }

      grid.push(outRow);
    }

    return grid;
  }

  // ===== Export functions =====
  async function exportContent(editor, format) {
    const iframe = editor.Canvas.getFrameEl();
    const doc = iframe.contentDocument || iframe.contentWindow.document;

    switch (format) {
      case 'txt': return exportTXT(doc);
      case 'csv': return exportCSV(doc);
      case 'xlsx': return exportXLSX(doc);
      case 'docx': return exportDOCX(editor, doc);
      case 'rtf': return exportRTF(doc.body);
      case 'ps': return exportPS(doc.body);
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
        const grid = parseTable(node);
        grid.forEach(row => {
          csv += row.map(v => `"${v.replace(/"/g, '""')}"`).join(',') + '\n';
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

// Excel export with images and merged cells
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
        const table = node;
        const rowSpans = {};
        for (let r = 0; r < table.rows.length; r++) {
          const row = table.rows[r];
          let colIndex = 1;

          while (rowSpans[`${r},${colIndex}`]) colIndex++;

          for (let c = 0; c < row.cells.length; c++) {
            const cell = row.cells[c];
            const cellValue = cell.innerText.trim();
            const colspan = cell.colSpan || 1;
            const rowspan = cell.rowSpan || 1;

            sheet.getRow(rowIndex).getCell(colIndex).value = cellValue;

            // Apply merge if colspan or rowspan
            if (colspan > 1 || rowspan > 1) {
              sheet.mergeCells(rowIndex, colIndex, rowIndex + rowspan - 1, colIndex + colspan - 1);
            }

            colIndex += colspan;

            // Add images in cell if <img> inside cell
            const imgEl = cell.querySelector('img');
            if (imgEl && imgEl.src) {
              try {
                const resp = await fetch(imgEl.src);
                const buffer = await resp.arrayBuffer();
                const imageId = workbook.addImage({
                  buffer,
                  extension: imgEl.src.split('.').pop().split(/\#|\?/)[0], // png/jpg/etc
                });
                sheet.addImage(imageId, {
                  tl: { col: colIndex - 1, row: rowIndex - 1 },
                  ext: { width: 100, height: 50 }
                });
              } catch (e) {
                console.warn("Failed to add image in Excel:", e);
              }
            }
          }

          rowIndex++;
        }
      } else {
        for (const child of node.childNodes) {
          await processNode(child);
        }
        if (['P', 'DIV', 'BR'].includes(node.tagName)) rowIndex++;
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

  // Get HTML + CSS from GrapesJS
  const html = editor.getHtml();
  const css = editor.getCss();

  // Create a temp DOM to process images
  const tempEl = document.createElement('div');
  tempEl.innerHTML = html;

  // Convert all <img> and <canvas> to base64
  const images = tempEl.querySelectorAll('img, canvas');

  for (const el of images) {
    let dataUrl = null;

    if (el.tagName === 'IMG') {
      try {
        const img = await fetch(el.src);
        const blob = await img.blob();
        dataUrl = await new Promise(resolve => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch (e) {
        console.warn("Failed to inline image:", el.src, e);
      }
    } else if (el.tagName === 'CANVAS') {
      try {
        dataUrl = el.toDataURL('image/png');
      } catch (e) {
        console.warn("Failed to inline canvas:", e);
      }
    }

    if (dataUrl) {
      el.setAttribute('src', dataUrl);
    }
  }

  // Build full styled HTML
  const styledHtml = `
    <html>
      <head>
        <style>
          table, td, th {
            border: 1px solid #000;
            border-collapse: collapse;
          }
          td, th {
            padding: 4px;
          }
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


  function exportRTF(body) {
    function convertElement(el) {
      if (el.nodeType === 3) {
        return el.textContent.replace(/\n/g, '\\line ');
      }
      if (['B', 'STRONG'].includes(el.tagName)) {
        return `\\b ${getChildren(el)} \\b0 `;
      }
      if (['I', 'EM'].includes(el.tagName)) {
        return `\\i ${getChildren(el)} \\i0 `;
      }
      if (el.tagName === 'U') {
        return `\\ul ${getChildren(el)} \\ul0 `;
      }
      if (el.tagName === 'BR') {
        return '\\line ';
      }
      if (['P', 'DIV'].includes(el.tagName)) {
        return getChildren(el) + '\\par ';
      }
      if (el.tagName === 'TABLE') {
        let rtf = '';
        const grid = parseTable(el);
        grid.forEach(row => {
          rtf += '\\trowd ';
          let cellx = 0;
          row.forEach(cellText => {
            cellx += 2000;
            rtf += `\\cellx${cellx} ${cellText} \\cell `;
          });
          rtf += '\\row ';
        });
        return rtf;
      }
      return getChildren(el);
    }

    function getChildren(el) {
      return Array.from(el.childNodes).map(convertElement).join('');
    }

    const rtfContent = `
{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0 Arial;}}
{\\colortbl;\\red0\\green0\\blue0;}
\\f0\\fs20
${getChildren(body)}
}
`;
    downloadFile(rtfContent, 'export.rtf', 'application/rtf');
  }

  async function exportPS(body) {
    const canvas = await html2canvas(body, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
    const blob = doc.output('blob');
    downloadFile(blob, 'export.ps');
  }

  function downloadFile(content, filename, type) {
    let blob = content instanceof Blob ? content : new Blob([content], { type });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }
}
