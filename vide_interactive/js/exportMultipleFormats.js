function exportPlugin(editor) {
  const modal = editor.Modal;
  const pn = editor.Panels;

  // Navbar button
  pn.addButton('options', {
    id: 'export-plugin',
    className: 'fa fa-download',
    attributes: { title: 'Export Project' },
    command: 'open-export-modal'
  });

  // Open modal
  editor.Commands.add('open-export-modal', {
    run() {
      modal.setTitle('Export Project');
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

  // Main export handler
  async function exportContent(editor, format) {
    const iframe = editor.Canvas.getFrameEl();
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    const contentHTML = doc.documentElement.outerHTML;

    switch (format) {
      case 'txt': return exportTXT(doc);
      case 'csv': return exportCSV(doc);
      case 'xlsx': return exportXLSX(doc);
      case 'docx': return exportDOCX(contentHTML);
      case 'rtf': return exportRTF(doc.body);
      case 'ps': return exportPS(doc.body);
    }
  }

  // TXT Export
  function exportTXT(doc) {
    const text = doc.body.innerText;
    downloadFile(text, 'export.txt', 'text/plain');
  }

  // CSV Export (text only)
  function exportCSV(doc) {
    let csv = '';
    const tables = doc.querySelectorAll('table');
    if (tables.length === 0) csv = doc.body.innerText;
    tables.forEach(table => {
      for (const row of table.rows) {
        const cells = [...row.cells].map(td => `"${td.innerText.trim()}"`);
        csv += cells.join(',') + '\n';
      }
      csv += '\n';
    });
    downloadFile(csv, 'export.csv', 'text/csv');
  }

  // XLSX Export (text only)
  function exportXLSX(doc) {
    const tables = doc.querySelectorAll('table');
    const wb = XLSX.utils.book_new();
    if (tables.length === 0) {
      const ws = XLSX.utils.aoa_to_sheet([[doc.body.innerText]]);
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    } else {
      tables.forEach((table, i) => {
        const data = [...table.rows].map(r =>
          [...r.cells].map(td => td.innerText.trim())
        );
        const ws = XLSX.utils.aoa_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, `Sheet${i + 1}`);
      });
    }
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    downloadFile(new Blob([wbout], { type: 'application/octet-stream' }), 'export.xlsx');
  }

  // DOCX Export
  function exportDOCX(html) {
    if (!window.htmlDocx) {
      alert("DOCX library not loaded!");
      return;
    }
    const blob = window.htmlDocx.asBlob(html);
    downloadFile(blob, 'export.docx');
  }

  // RTF Export
  function exportRTF(body) {
    function convertElement(el) {
      if (el.nodeType === 3) {
        return el.textContent.replace(/\n/g, '\\line ');
      }
      if (el.tagName === 'B' || el.tagName === 'STRONG') {
        return `\\b ${getChildren(el)} \\b0 `;
      }
      if (el.tagName === 'I' || el.tagName === 'EM') {
        return `\\i ${getChildren(el)} \\i0 `;
      }
      if (el.tagName === 'U') {
        return `\\ul ${getChildren(el)} \\ul0 `;
      }
      if (el.tagName === 'BR') {
        return '\\line ';
      }
      if (el.tagName === 'P' || el.tagName === 'DIV') {
        return getChildren(el) + '\\par ';
      }
      if (el.tagName === 'TABLE') {
        let rtf = '';
        for (const row of el.rows) {
          rtf += '\\trowd ';
          let cellx = 0;
          for (const cell of row.cells) {
            cellx += 2000;
            rtf += `\\cellx${cellx} ${getChildren(cell)} \\cell `;
          }
          rtf += '\\row ';
        }
        return rtf;
      }
      if (el.tagName === 'IMG' || el.tagName === 'CANVAS') {
        try {
          let canvas;
          if (el.tagName === 'CANVAS') {
            canvas = el;
          } else {
            canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = el.width;
            canvas.height = el.height;
            ctx.drawImage(el, 0, 0);
          }
          const data = canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
          return `{\\pict\\pngblip\n${data}\n}`;
        } catch {
          return '';
        }
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

  // PostScript Export
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

  // Download helper
  function downloadFile(content, filename, type) {
    let blob = content instanceof Blob ? content : new Blob([content], { type });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  }
}
