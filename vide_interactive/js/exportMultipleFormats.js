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
async function exportRTF(editor, doc) {
  // RTF Helper Functions
  function escapeRTF(text) {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/{/g, '\\{')
      .replace(/}/g, '\\}')
      .replace(/\n/g, '\\line ')
      .replace(/[^\x00-\x7F]/g, c => `\\u${c.charCodeAt(0)}?`);
  }

  function rgbToRTFColor(r, g, b) {
    return `\\red${r}\\green${g}\\blue${b};`;
  }

  function getColorIndex(colorStr, colorTable) {
    let r = 0, g = 0, b = 0;

    if (colorStr.startsWith('#')) {
      const hex = colorStr.substring(1);
      r = parseInt(hex.substring(0, 2), 16);
      g = parseInt(hex.substring(2, 4), 16);
      b = parseInt(hex.substring(4, 6), 16);
    } else if (colorStr.startsWith('rgb')) {
      const match = colorStr.match(/\d+/g);
      if (match) {
        r = parseInt(match[0]);
        g = parseInt(match[1]);
        b = parseInt(match[2]);
      }
    }

    const colorKey = `${r},${g},${b}`;
    if (!colorTable.has(colorKey)) {
      colorTable.set(colorKey, colorTable.size + 1);
    }
    return colorTable.get(colorKey);
  }

  function getFontIndex(font, fontTable) {
    const fontKey = font.split(',')[0].trim().replace(/['"]/g, '');
    if (!fontTable.has(fontKey)) {
      fontTable.set(fontKey, fontTable.size);
    }
    return fontTable.get(fontKey);
  }

  function getInlineStyleRTF(el, colorTable, fontTable) {
    const style = getComputedStyle(el);
    let codes = '';

    // Color
    const color = style.color;
    if (color && color !== 'transparent' && color !== 'rgba(0, 0, 0, 0)') {
      const index = getColorIndex(color, colorTable);
      if (index > 0) codes += `\\cf${index} `;
    }

    // Font family
    const font = style.fontFamily;
    if (font) {
      const index = getFontIndex(font, fontTable);
      codes += `\\f${index} `;
    }

    // Font size
    const size = parseFloat(style.fontSize);
    if (!isNaN(size)) {
      const halfPoints = Math.round(size * 2); // px to half-points (approximation)
      codes += `\\fs${halfPoints} `;
    }

    // Bold
    if (style.fontWeight === 'bold' || parseInt(style.fontWeight) >= 700) {
      codes += '\\b ';
    }

    // Italic
    if (style.fontStyle === 'italic' || style.fontStyle === 'oblique') {
      codes += '\\i ';
    }

    // Underline
    if (style.textDecoration.includes('underline')) {
      codes += '\\ul ';
    }

    // Strikethrough
    if (style.textDecoration.includes('line-through')) {
      codes += '\\strike ';
    }

    // Text background (highlight)
    const bg = style.backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
      const index = getColorIndex(bg, colorTable);
      if (index > 0) codes += `\\highlight${index} `;
    }

    return codes;
  }

  function getParaStyleRTF(el, colorTable, fontTable) {
    const style = getComputedStyle(el);
    let codes = '';

    // Alignment
    const align = style.textAlign;
    if (align === 'center') codes += '\\qc ';
    else if (align === 'right') codes += '\\qr ';
    else if (align === 'justify') codes += '\\qj ';

    // Indent (margin-left)
    const marginLeft = parseFloat(style.marginLeft);
    if (!isNaN(marginLeft) && marginLeft > 0) {
      const twips = Math.round(marginLeft * 15);
      codes += `\\li${twips} `;
    }

    // Add inline styles for font, size, etc.
    codes += getInlineStyleRTF(el, colorTable, fontTable);

    return codes;
  }

  function getBorderRTF(side, el, colorTable) {
    const style = getComputedStyle(el);
    const widthStr = style[`border-${side}-width`];
    const bStyle = style[`border-${side}-style`];
    if (bStyle === 'none' || parseFloat(widthStr) === 0) return '';

    let width = parseFloat(widthStr);
    if (isNaN(width)) width = 0.5; // Default for thin
    const wTwips = Math.round(width * 15);

    let bType = '\\brdrs'; // solid
    switch (bStyle) {
      case 'dotted': bType = '\\brdrdot'; break;
      case 'dashed': bType = '\\brdrdash'; break;
      case 'double': bType = '\\brdrdb'; break;
    }

    const color = style[`border-${side}-color`];
    let cf = '';
    if (color && color !== 'transparent' && color !== 'rgb(0, 0, 0)') {
      const index = getColorIndex(color, colorTable);
      if (index > 0) cf = `\\brdrcf${index} `;
    }

    return `${bType}\\brdrw${wTwips} ${cf}`;
  }

  // Convert image to RTF hex format
  async function imageToRTFHex(imgSrc) {
    try {
      let blob;
      if (imgSrc.startsWith('data:')) {
        const response = await fetch(imgSrc);
        blob = await response.blob();
      } else {
        const response = await fetch(imgSrc);
        blob = await response.blob();
      }

      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      let hex = '';
      for (let byte of uint8Array) {
        hex += byte.toString(16).padStart(2, '0');
      }
      return hex;
    } catch (e) {
      console.warn('Failed to convert image:', e);
      return null;
    }
  }

  // Convert DOM element to RTF
  async function convertElement(el, colorTable, fontTable) {
    if (el.nodeType === 3) {
      return escapeRTF(el.textContent);
    }

    if (['STYLE', 'SCRIPT', 'LINK', 'META'].includes(el.tagName)) {
      return '';
    }

    const style = getComputedStyle(el);
    const tag = el.tagName;

    // Special handling for BR
    if (tag === 'BR') {
      return '\\line ';
    }

    // Images
    if (tag === 'IMG') {
      const hex = await imageToRTFHex(el.src);
      if (hex) {
        const width = (parseFloat(style.width) || el.width || 200) * 15;
        const height = (parseFloat(style.height) || el.height || 150) * 15;
        return `{\\pict\\pngblip\\picw${width}\\pich${height}\\picwgoal${width}\\pichgoal${height} ${hex}}\\par `;
      }
      return '';
    }

    // Tables
    if (tag === 'TABLE') {
      return await tableToRTF(el, colorTable, fontTable);
    }

    // Headings
    if (/^H[1-6]$/.test(tag)) {
      const level = parseInt(tag[1]);
      const baseSize = 24 - (level * 2); // Adjustable: h1 largest
      let rtf = '\\pard ';
      rtf += getParaStyleRTF(el, colorTable, fontTable);
      rtf += `\\fs${baseSize * 2} `; // Override with heading size if not set in style
      rtf += await getChildren(el, colorTable, fontTable);
      rtf += '\\par ';
      return rtf;
    }

    // Paragraphs and Divs (block elements)
    if (tag === 'P' || tag === 'DIV' || style.display === 'block') {
      let rtf = '\\pard ';
      rtf += getParaStyleRTF(el, colorTable, fontTable);
      rtf += await getChildren(el, colorTable, fontTable);
      rtf += '\\par ';
      return rtf;
    }

    // Inline elements (wrap in group for nesting)
    const open = getInlineStyleRTF(el, colorTable, fontTable);
    const content = await getChildren(el, colorTable, fontTable);
    if (open) {
      return `{${open}${content}}`;
    } else {
      return content;
    }
  }

  async function getChildren(el, colorTable, fontTable) {
    const children = Array.from(el.childNodes);
    const results = await Promise.all(children.map(c => convertElement(c, colorTable, fontTable)));
    return results.join('');
  }

  async function tableToRTF(table, colorTable, fontTable) {
    let rtf = '';
    const rows = table.querySelectorAll('tr');

    for (const row of rows) {
      const cells = row.querySelectorAll('th, td');
      rtf += '\\trowd\\trgaph108\\trleft0\n';

      let cellx = 0;
      for (const cell of cells) {
        const width = parseFloat(getComputedStyle(cell).width);
        const widthTwips = Math.round((isNaN(width) ? 200 : width) * 15);
        if (widthTwips < 100) continue;
        cellx += widthTwips;

        // Cell background
        const bgColor = getComputedStyle(cell).backgroundColor;
        let bgDef = '';
        if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
          const bgIndex = getColorIndex(bgColor, colorTable);
          if (bgIndex > 0) bgDef = `\\clcbpat${bgIndex} `;
        }

        // Borders
        const top = getBorderRTF('top', cell, colorTable);
        const bottom = getBorderRTF('bottom', cell, colorTable);
        const left = getBorderRTF('left', cell, colorTable);
        const right = getBorderRTF('right', cell, colorTable);

        rtf += bgDef;
        if (top) rtf += `\\clbrdrt${top} `;
        if (bottom) rtf += `\\clbrdrb${bottom} `;
        if (left) rtf += `\\clbrdrl${left} `;
        if (right) rtf += `\\clbrdrr${right} `;
        rtf += `\\cellx${cellx}\n`;
      }

      for (const cell of cells) {
        rtf += '\\pard\\intbl ';
        rtf += getParaStyleRTF(cell, colorTable, fontTable);
        rtf += await getChildren(cell, colorTable, fontTable); // Use getChildren to allow nested elements
        rtf += ' \\cell\n';
      }
      rtf += '\\row\n';
    }

    return rtf;
  }

  // Build tables
  const colorTable = new Map();
  colorTable.set('0,0,0', 1); // Black as cf1

  const fontTable = new Map();
  fontTable.set('Arial', 0); // Default font

  // Convert content
  const content = await convertElement(doc.body, colorTable, fontTable);

  // Build font table RTF
  let fontTableRTF = '{\\fonttbl';
  const sortedFonts = Array.from(fontTable.entries()).sort((a, b) => a[1] - b[1]);
  sortedFonts.forEach(([font, index]) => {
    fontTableRTF += `{\\f${index}\\fswiss\\fcharset0 ${font};}`;
  });
  fontTableRTF += '}';

  // Build color table RTF
  let colorTableRTF = '{\\colortbl;'; // First ; for auto (cf0)
  const sortedColors = Array.from(colorTable.entries()).sort((a, b) => a[1] - b[1]);
  sortedColors.forEach(([color]) => {
    const [r, g, b] = color.split(',').map(Number);
    colorTableRTF += rgbToRTFColor(r, g, b);
  });
  colorTableRTF += '}';

  // Generate full RTF
  const rtfContent = `{\\rtf1\\ansi\\ansicpg1252\\deff0
${fontTableRTF}
${colorTableRTF}
\\viewkind4\\uc1\\pard\\f0\\fs20
${content}
}`;

  downloadFile(rtfContent, 'export.rtf', 'application/rtf');
}

  async function exportPDF(body) {
    if (!window.html2canvas || !window.jspdf) {
      alert("Please include html2canvas and jsPDF libraries!");
      return;
    }

    const canvas = await html2canvas(body, { 
      scale: 2,
      useCORS: true,
      allowTaint: true
    });
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'pt', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
    const centerX = (pageWidth - imgWidth * ratio) / 2;
    
    pdf.addImage(imgData, 'PNG', centerX, 0, imgWidth * ratio, imgHeight * ratio);
    const blob = pdf.output('blob');
    downloadFile(blob, 'export.pdf');
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