function customTable(editor) { 

  // Add Table block in the Block Manager
  editor.Blocks.add('table', {
    label: 'Table',
    category: "Extra",  
    content: '<table></table>', 
    attributes: {
      class: 'fa fa-table',
    },    
  }); 

  // Detect table block drag stop
  editor.on('block:drag:stop', (block) => {  
    if (block.get('tagName') === 'table') {
      // Remove the default empty table that was created
      block.remove();
      // Open the configuration modal
      addTable();
    } 
  });

  // Load CSS inside GrapesJS iframe
  editor.on('load', () => {
    const iframe = editor.getContainer().querySelector('iframe'); 
    const head = iframe.contentDocument.head;  
    const style = document.createElement('style');
    style.type = 'text/css'; 
    style.innerHTML = `
      a.dt-button { border: 1px solid #ccc !important; }
      .dataTables_wrapper .dataTables_filter input {
        border: 1px solid #ccc !important;
      }
      .dataTables_wrapper .dataTables_filter input:focus-visible { outline: 0px!important; }
      .i_designer-dashed *[data-i_designer-highlightable] {
        border: 1px solid #ccc !important;
      }
      .dataTables_wrapper .dataTables_paginate .paginate_button.current {
        border: 1px solid #ccc !important;
      }
      .dataTables_wrapper .dataTables_paginate .paginate_button:hover {
        border: 1px solid #ccc !important;
        background: linear-gradient(to bottom, #fff 0%, #dcdcdc 100%) !important;
      }
      table.dataTable { border: 1px solid #ccc !important; }
      table.dataTable thead th { border-bottom: 1px solid #ccc !important; }
    `;
    head.appendChild(style);

    // Inject formula parser library into iframe
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/hot-formula-parser/dist/formula-parser.min.js";
    head.appendChild(script);
  });

  // Function to open table creation modal
  function addTable() {
    editor.Modal.setTitle('Create New Table');
    editor.Modal.setContent(`
      <div class="new-table-form">
        <div>
          <label>Number of columns</label>
          <input type="number" value="3" id="nColumns" min="1">
        </div>  
        <div>
          <label>Number of rows</label>
          <input type="number" value="4" id="nRows" min="1">
        </div>  
        <div>
          <label>Scroll Columns length</label>
          <input type="number" value="5" id="nColumnsScroll" min="5">
        </div> 
        <div><label>Add File Download</label><input type="checkbox" id="tbl_file_download"></div>
        <div><label>Add Pagination</label><input type="checkbox" id="tbl_pagination"></div>
        <div><label>Add Search</label><input type="checkbox" id="tbl_Search"></div>
        <div><label>Add Footer</label><input type="checkbox" id="tbl_footer"></div>
        <div><label>Add Caption</label><input type="checkbox" id="tbl_caption"></div>
        <div><input id="table-button-create-new" type="button" value="Create Table"></div>
      </div>
    `);
    editor.Modal.open(); 
    
    // Remove any existing event listeners and add a new one
    const createBtn = document.getElementById("table-button-create-new");
    createBtn.removeEventListener("click", createTable, true);
    createBtn.addEventListener("click", createTable, true);
  }

  function createTable() {
    let uniqueID = Math.floor(100 + Math.random() * 900);
    let tblFileDownload = document.getElementById("tbl_file_download").checked;
    let tblPagination = document.getElementById("tbl_pagination").checked;
    let tblSearch = document.getElementById("tbl_Search").checked;
    let tblFooter = document.getElementById("tbl_footer").checked;
    let tblCaption = document.getElementById("tbl_caption").checked;
    let tblHeader = true;
    let downloadBtn = '[]';

    if (tblFileDownload) {
      downloadBtn = '["copy", "csv", "excel", "pdf", "print"]';
    }

    const rows = parseInt(document.getElementById('nRows').value);
    const cols = parseInt(document.getElementById('nColumns').value);
    const colsScroll = parseInt(document.getElementById('nColumnsScroll').value);

    // Build table
    let table = document.createElement('table');
    table.setAttribute('width', '100%');
    table.setAttribute('class', 'table table-striped table-bordered');
    table.setAttribute('id', 'table' + uniqueID);

    if (tblCaption) {
      let caption = document.createElement('caption');
      caption.textContent = 'Caption Text';
      caption.style.captionSide = 'top';
      table.appendChild(caption);
    }

    let thead = document.createElement('thead');
    for (let j = 0; j < cols; j++) {
      let th = document.createElement('th');
      th.innerHTML = `<div>Text</div>`;
      thead.appendChild(th);
    }
    if (tblHeader) table.appendChild(thead);

    let tbody = document.createElement('tbody');
    for (let i = 0; i < rows; i++) {
      let tr = document.createElement('tr');
      for (let j = 0; j < cols; j++) {
        let td = document.createElement('td');
        td.innerHTML = `<div>Text</div>`;
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }

    if (tblFooter) {
      let tr = document.createElement('tr');
      for (let j = 0; j < cols; j++) {
        let th = document.createElement('th');
        th.style.fontWeight = '800';
        th.innerHTML = `<div>Text</div>`;
        tr.appendChild(th);
      }
      tbody.appendChild(tr);
    }

    table.appendChild(tbody);

    // DataTables script
    let tableScript = `
      <script>
        $('#table${uniqueID}').DataTable({
          dom: 'Bfrtip',
          paging: ${tblPagination},
          info: ${tblPagination},
          lengthChange: true,
          fixedHeader: true,
          scrollX: ${colsScroll < cols},
          fixedColumns: true,
          searching: ${tblSearch},
          buttons: ${downloadBtn}
        });
      </script>
    `;

    editor.DomComponents.addComponent(`<div>${table.outerHTML}</div>${tableScript}`);
    editor.Modal.close();

    // Enable formulas in cells
    setTimeout(() => enableFormulaEditing(`table${uniqueID}`), 500);
  }

  // Formula editing handler
// Formula editing handler - FIXED VERSION
function enableFormulaEditing(tableId) {
  const iframeDoc = editor.Canvas.getDocument();
  const parser = new iframeDoc.defaultView.formulaParser.Parser();

  parser.on('callCellValue', function(cellCoord, done) {
    let col = cellCoord.column.index;
    let row = cellCoord.row.index;
    let tableElem = iframeDoc.getElementById(tableId);
    let cell = tableElem.rows[row]?.cells[col];
    if (cell) {
      let val = cell.getAttribute('data-formula') || cell.innerText;
      if (val.startsWith('=')) {
        try {
          let res = parser.parse(val.substring(1));
          done(res.result);
        } catch {
          done('#ERROR');
        }
      } else {
        done(parseFloat(val) || val);
      }
    } else {
      done(null);
    }
  });

  // Function to attach event listeners to cells
  function attachCellListeners() {
    const tableElem = iframeDoc.getElementById(tableId);
    if (!tableElem) return;

    tableElem.querySelectorAll('td, th').forEach(cell => {
      // Skip if already has listeners (check for a custom attribute)
      if (cell.hasAttribute('data-formula-enabled')) return;
      
      cell.contentEditable = "true";
      cell.setAttribute('data-formula-enabled', 'true');

      cell.addEventListener('focus', handleCellFocus);
      cell.addEventListener('blur', handleCellBlur);
    });
  }

  function handleCellFocus() {
    let formula = this.getAttribute('data-formula');
    if (formula) this.innerText = formula;
  }

  function handleCellBlur() {
    const cell = this;
    let val = cell.innerText.trim();
    
    if (val.startsWith('=')) {
      cell.setAttribute('data-formula', val);
      try {
        let res = parser.parse(val.substring(1));
        cell.innerText = res.result !== undefined ? res.result : '#ERROR';
      } catch {
        cell.innerText = '#ERROR';
      }
    } else {
      cell.removeAttribute('data-formula');
      cell.innerText = val;
    }

    // 🔹 Update GrapesJS component WITHOUT replacing HTML
    updateComponentContent(tableId);
  }

  // Function to update component content without destroying DOM structure
  function updateComponentContent(tableId) {
    // We don't need to sync back to GrapesJS component for formula calculations
    // The visual updates in the iframe are sufficient for user interaction
    // GrapesJS will capture the final state when the user saves or exports
    return;
  }

  // Initial attachment of listeners
  attachCellListeners();

  // Re-attach listeners when component is updated/re-rendered
  editor.on('component:update', (component) => {
    if (component.getId() === tableId || component.find(`#${tableId}`).length > 0) {
      // Small delay to ensure DOM is updated
      setTimeout(() => {
        attachCellListeners();
      }, 100);
    }
  });

  // Also listen for canvas updates
  editor.on('canvas:frame:load', () => {
    setTimeout(() => {
      attachCellListeners();
    }, 100);
  });
}
}