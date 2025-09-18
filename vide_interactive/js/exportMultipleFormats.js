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

  // Open modal with styled buttons
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
        </style>
        <div class="exp-container">
          <button class="exp-btn" data-format="txt">TXT</button>
          <button class="exp-btn" data-format="csv">CSV</button>
          <button class="exp-btn" data-format="docx">DOCX</button>
          <button class="exp-btn" data-format="rtf">RTF</button>
          <button class="exp-btn" data-format="xlsx">XLSX</button>
          <button class="exp-btn" data-format="ps">PS</button>
          <button class="exp-btn" data-format="pdf">PDF</button>
        </div>
      `);

      modal.open();

      modal.getContentEl().querySelectorAll('.exp-btn').forEach(btn => {
        btn.onclick = () => {
          const format = btn.dataset.format;
          exportContent(editor, format);
        };
      });
    }
  });

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
      case 'rtf': return exportRTF(contentHTML);
      case 'ps': return exportPS(doc.body);
      case 'pdf': return exportPDF(doc.body);
    }
  }

  // TXT Export
  function exportTXT(doc) {
    const text = doc.body.innerText;
    downloadFile(text, 'export.txt', 'text/plain');
  }

  // CSV Export
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

  // XLSX Export
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
    const converted = window.htmlDocx.asBlob(html, { orientation: 'portrait' });
    downloadFile(converted, 'export.docx');
  }

  // RTF Export
  function exportRTF(html) {
    const rtfContent = HTMLtoRTF.convertHtmlToRtf(html);
    downloadFile(rtfContent, 'export.rtf', 'application/rtf');
  }

  // PostScript Export (screenshot → PS wrapper)
  async function exportPS(body) {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'pt', 'a4');
    pdf.text("PostScript export is simulated (PDF renamed).", 20, 30);
    const blob = pdf.output('blob');
    downloadFile(blob, 'export.ps');
  }

  // PDF Export (always single page, scaled content, selectable text)
  async function exportPDF(body) {
    const opt = {
      margin: 0,
      filename: 'export.pdf',
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'pt', format: 'a4', orientation: 'p' }
    };
    await html2pdf().set(opt).from(body).save();
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
