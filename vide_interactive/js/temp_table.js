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



//=======================================

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

  // Function to show toast/warning
  function showToast(message, type = 'warning') {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 4px;
      color: white;
      font-family: Arial, sans-serif;
      font-size: 14px;
      z-index: 10000;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      ${type === 'warning' ? 'background-color: #f39c12;' : type === 'success' ? 'background-color: #27ae60;' : 'background-color: #e74c3c;'}
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  // Function to evaluate highlighting conditions
  function evaluateCondition(cellValue, condition) {
    if (!condition || !condition.trim()) return false;
    
    try {
      // Clean the condition
      const cleanCondition = condition.trim();
      
      // Convert cell value to number if possible
      const numericValue = parseFloat(cellValue);
      const isNumeric = !isNaN(numericValue);
      
      // Handle different condition types
      if (cleanCondition.includes('>=')) {
        const threshold = parseFloat(cleanCondition.replace('>=', '').trim());
        return isNumeric && numericValue >= threshold;
      } else if (cleanCondition.includes('<=')) {
        const threshold = parseFloat(cleanCondition.replace('<=', '').trim());
        return isNumeric && numericValue <= threshold;
      } else if (cleanCondition.includes('>')) {
        const threshold = parseFloat(cleanCondition.replace('>', '').trim());
        return isNumeric && numericValue > threshold;
      } else if (cleanCondition.includes('<')) {
        const threshold = parseFloat(cleanCondition.replace('<', '').trim());
        return isNumeric && numericValue < threshold;
      } else if (cleanCondition.includes('=')) {
        const targetValue = cleanCondition.replace('=', '').trim();
        const targetNumeric = parseFloat(targetValue);
        if (!isNaN(targetNumeric)) {
          return isNumeric && numericValue === targetNumeric;
        } else {
          return cellValue.toString().toLowerCase() === targetValue.toLowerCase();
        }
      } else if (cleanCondition.includes('!=')) {
        const targetValue = cleanCondition.replace('!=', '').trim();
        const targetNumeric = parseFloat(targetValue);
        if (!isNaN(targetNumeric)) {
          return isNumeric && numericValue !== targetNumeric;
        } else {
          return cellValue.toString().toLowerCase() !== targetValue.toLowerCase();
        }
      } else if (cleanCondition.startsWith('contains:')) {
        const searchTerm = cleanCondition.replace('contains:', '').trim().toLowerCase();
        return cellValue.toString().toLowerCase().includes(searchTerm);
      } else if (cleanCondition.startsWith('startswith:')) {
        const searchTerm = cleanCondition.replace('startswith:', '').trim().toLowerCase();
        return cellValue.toString().toLowerCase().startsWith(searchTerm);
      } else if (cleanCondition.startsWith('endswith:')) {
        const searchTerm = cleanCondition.replace('endswith:', '').trim().toLowerCase();
        return cellValue.toString().toLowerCase().endsWith(searchTerm);
      } else {
        // Exact text match (case insensitive)
        return cellValue.toString().toLowerCase() === cleanCondition.toLowerCase();
      }
    } catch (error) {
      console.warn('Error evaluating highlight condition:', error);
      return false;
    }
  }

  // Function to apply highlighting to table cells
  function applyHighlighting(tableId, condition, highlightColor) {
    try {
      const canvasBody = editor.Canvas.getBody();
      const table = canvasBody.querySelector(`#${tableId}`);
      if (!table) return;

      const wrapper = editor.DomComponents.getWrapper();

      // === Always: Clear previous highlights
      const prev = table.querySelectorAll('td[data-highlighted="true"], th[data-highlighted="true"]');
      prev.forEach(td => {
        td.style.backgroundColor = '';
        td.removeAttribute('data-highlighted');

        const id = td.id;
        if (id) {
          const comp = wrapper.find(`#${id}`)[0];
          if (comp) {
            comp.removeStyle('background-color');
            comp.removeStyle('background');
          }
        }
      });

      // === Only apply new highlights if condition exists
      if (condition && condition.trim()) {
        const bodyCells = table.querySelectorAll('tbody td');
        bodyCells.forEach(td => {
          const div = td.querySelector('div');
          const val = div ? div.textContent.trim() : td.textContent.trim();

          if (evaluateCondition(val, condition)) {
            const bg = highlightColor || '#ffff99';
            td.style.backgroundColor = bg;
            td.setAttribute('data-highlighted', 'true');

            const id = td.id;
            if (id) {
              const comp = wrapper.find(`#${id}`)[0];
              if (comp) {
                comp.addStyle({
                  'background-color': bg,
                  '-webkit-print-color-adjust': 'exact',
                  'color-adjust': 'exact',
                  'print-color-adjust': 'exact'
                });
              }
            }
          }
        });
      }

    } catch (err) {
      console.warn('Error applying highlighting:', err);
    }
  }

  // Enhanced function to get target container that works with page system
  function getTargetContainer() {
    const selected = editor.getSelected();
    
    // First priority: Check if something is selected and can accept children
    if (selected) {
      const droppable = selected.get('droppable');
      if (droppable !== false) {
        // Check if it's a main content area (preferred for pages)
        if (selected.getEl()?.classList.contains('main-content-area') || 
            selected.closest('.main-content-area')) {
          return selected.closest('.main-content-area') || selected;
        }
        return selected;
      }
      
      // Try to find a droppable parent
      let parent = selected.parent();
      while (parent) {
        if (parent.get('droppable') !== false) {
          // Prefer main content area if available
          if (parent.getEl()?.classList.contains('main-content-area') || 
              parent.closest('.main-content-area')) {
            return parent.closest('.main-content-area') || parent;
          }
          return parent;
        }
        parent = parent.parent();
      }
    }
    
    // Second priority: Look for main content area in current page
    const allPages = editor.getWrapper().find('.page-container');
    if (allPages.length > 0) {
      // Try to find the currently visible or active page
      const canvasBody = editor.Canvas.getBody();
      let targetPage = null;
      
      // Find the page that's currently in view or the first page
      allPages.forEach(page => {
        const pageEl = page.getEl();
        if (pageEl && canvasBody.contains(pageEl)) {
          const rect = pageEl.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          // Check if page is visible in viewport
          if (rect.top < viewportHeight && rect.bottom > 0) {
            targetPage = page;
          }
        }
      });
      
      // If no page is in view, use the first page
      if (!targetPage) {
        targetPage = allPages.at(0);
      }
      
      if (targetPage) {
        const mainContentArea = targetPage.find('.main-content-area')[0];
        if (mainContentArea) {
          return mainContentArea;
        }
      }
    }
    
    // Third priority: Use the main canvas wrapper
    const wrapper = editor.DomComponents.getWrapper();
    return wrapper;
  }

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

      /* Enhanced highlighted cell styles - applied to td/th instead of div */
      td[data-highlighted="true"], th[data-highlighted="true"] {
        position: relative;
      }
      td[data-highlighted="true"]::after, th[data-highlighted="true"]::after {
        content: "★";
        position: absolute;
        top: 2px;
        right: 2px;
        font-size: 10px;
        color: #ff6b35;
        font-weight: bold;
        z-index: 1;
      }

      /* Page-aware table styles */
      .page-container .dataTables_wrapper {
        max-width: 100%;
        overflow: hidden;
      }
      
      .main-content-area .dataTables_wrapper {
        width: 100% !important;
        box-sizing: border-box;
      }
      
      /* Enhanced print styles for tables in pages with cell highlighting preservation */
      @media print {
        .page-container table.dataTable {
          border-collapse: collapse !important;
          width: 100% !important;
          font-size: 10px !important;
          page-break-inside: avoid !important;
        }
        
        .page-container .dataTables_wrapper .dataTables_length,
        .page-container .dataTables_wrapper .dataTables_filter,
        .page-container .dataTables_wrapper .dataTables_info,
        .page-container .dataTables_wrapper .dataTables_paginate,
        .page-container .dataTables_wrapper .dt-buttons {
          display: none !important;
        }
        
        .page-container table.dataTable thead th,
        .page-container table.dataTable tbody td {
          border: 1px solid #000 !important;
          padding: 4px !important;
          text-align: left !important;
        }
        
        .page-container table.dataTable thead th {
          background-color: #f5f5f5 !important;
          font-weight: bold !important;
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        /* Preserve cell highlighting in print - critical for PDF generation */
        td[data-highlighted="true"], th[data-highlighted="true"] {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        /* Ensure background colors are preserved in print/PDF */
        * {
          -webkit-print-color-adjust: exact !important;
          color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
        
        /* Hide the star indicator in print to avoid clutter */
        td[data-highlighted="true"]::after, th[data-highlighted="true"]::after {
          display: none !important;
        }
      }
    `;
    head.appendChild(style);

    // Inject formula parser library into iframe
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/hot-formula-parser/dist/formula-parser.min.js";
    head.appendChild(script);
  });

  // Add custom table component type with highlighting traits
  editor.DomComponents.addType('enhanced-table', {
    isComponent: el => el.tagName === 'TABLE' && el.id && el.id.startsWith('table'),
    model: {
      defaults: {
        tagName: 'table',
        selectable: true,
        hoverable: true,
        editable: true,
        droppable: false,
        draggable: true,
        removable: true,
        copyable: true,
        resizable: false,
        traits: [
          {
            type: 'text',
            name: 'highlight-condition',
            label: 'Highlight Condition',
            placeholder: 'e.g., >50, <=100, =text, contains:word',
            changeProp: 1,
          },
          {
            type: 'color',
            name: 'highlight-color',
            label: 'Highlight Color',
            placeholder: '#ffff99',
            changeProp: 1,
          }
        ],
        'custom-name': 'Enhanced Table'
      },
      
      init() {
        this.on('change:highlight-condition change:highlight-color', this.handleHighlightChange);
      },

      handleHighlightChange() {
        const tableId = this.getId();
        const condition = this.get('highlight-condition');
        const color = this.get('highlight-color');
        
        if (condition) {
          applyHighlighting(tableId, condition, color);
          // Trigger update to ensure GrapesJS recognizes changes
          editor.trigger('component:update', this);
        }
      }
    }
  });

  // Add commands for highlighting
  editor.Commands.add('apply-table-highlighting', {
    run(editor) {
      const selected = editor.getSelected();
      if (selected && selected.get('tagName') === 'table') {
        const tableId = selected.getId();
        const condition = selected.get('highlight-condition');
        const color = selected.get('highlight-color');
        
        if (!condition) {
          showToast('Please enter a highlight condition first', 'warning');
          return;
        }
        
        applyHighlighting(tableId, condition, color);
        showToast('Cell highlighting applied successfully!', 'success');
        
        // Trigger editor update to ensure GrapesJS recognizes the changes
        editor.trigger('component:update', selected);
      }
    }
  });

  // Enhanced command for clearing highlighting with GrapesJS sync
  editor.Commands.add('clear-table-highlighting', {
    run(editor) {
      const selected = editor.getSelected();
      if (selected && selected.get('tagName') === 'table') {
        const tableId = selected.getId();
        
        // Clear highlighting by applying empty condition
        applyHighlighting(tableId, '', '');
        
        // Clear the traits
        selected.set('highlight-condition', '');
        selected.set('highlight-color', '');
        
        showToast('Highlighting cleared successfully!', 'success');
        
        // Trigger editor update
        editor.trigger('component:update', selected);
      }
    }
  });

  // Function to open table creation modal
  function addTable() {
    const targetContainer = getTargetContainer();
    
    if (!targetContainer) {
      showToast('No suitable container found for placing the table', 'error');
      return;
    }

    // Check if target is within a page system
    const isInPageSystem = targetContainer.closest('.page-container') || 
                          targetContainer.find('.page-container').length > 0 ||
                          targetContainer.getEl()?.closest('.page-container');
    
    let containerInfo = 'main canvas';
    if (isInPageSystem) {
      const pageContainer = targetContainer.closest('.page-container');
      if (pageContainer) {
        const pageIndex = pageContainer.getAttributes()['data-page-index'];
        containerInfo = `Page ${parseInt(pageIndex) + 1}`;
      } else {
        containerInfo = 'page content area';
      }
    } else if (targetContainer.get('tagName')) {
      containerInfo = targetContainer.get('tagName') || 'selected container';
    }

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
    createBtn.removeEventListener("click", () => createTable(targetContainer), true);
    createBtn.addEventListener("click", () => createTable(targetContainer), true);
  }

  function createTable(container) {
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

    // Check if target is within a page system
    const isInPageSystem = container.closest('.page-container') || 
                          container.find('.page-container').length > 0 ||
                          container.getEl()?.closest('.page-container');

    // Create a wrapper div for better page integration
    let tableWrapper = document.createElement('div');
    if (isInPageSystem) {
      tableWrapper.style.cssText = `
        padding: 10px 0px;
        position: relative;
        width: 100%;
        max-width: 100%;
        overflow: hidden;
        box-sizing: border-box;
      `;
    }
    tableWrapper.className = 'table-wrapper-' + uniqueID;

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

    // Append table to wrapper if in page system
    if (isInPageSystem) {
      tableWrapper.appendChild(table);
    }

    // DataTables script with page system awareness
    let tableScript = `
      <script>
        (function() {
          // Wait for jQuery and DataTables to be available
          function initTable() {
            if (typeof $ === 'undefined' || typeof $.fn.DataTable === 'undefined') {
              setTimeout(initTable, 100);
              return;
            }
            
            const tableElement = document.getElementById('table${uniqueID}');
            const isInPageSystem = tableElement && tableElement.closest('.page-container');
            
            // Configure DataTable options based on context
            const dtOptions = {
              dom: 'Bfrtip',
              paging: ${tblPagination},
              info: ${tblPagination},
              lengthChange: true,
              fixedHeader: ${!isInPageSystem}, // Disable for page system compatibility
              scrollX: ${colsScroll < cols},
              fixedColumns: ${colsScroll < cols},
              searching: ${tblSearch},
              buttons: ${downloadBtn},
              drawCallback: function() {
                // Re-enable formula editing after DataTable draw
                setTimeout(() => enableFormulaEditing('table${uniqueID}'), 100);
                
                // Ensure table fits within page boundaries
                if (isInPageSystem) {
                  const wrapper = this.closest('.dataTables_wrapper');
                  if (wrapper) {
                    wrapper.style.maxWidth = '100%';
                    wrapper.style.overflow = 'hidden';
                  }
                }
              },
              responsive: isInPageSystem ? {
                details: {
                  display: $.fn.dataTable.Responsive.display.childRowImmediate,
                  type: 'none',
                  target: ''
                }
              } : false
            };
            
            $('#table${uniqueID}').DataTable(dtOptions);
          }
          
          initTable();
        })();
      </script>
    `;

    try {
      // Add the table to the selected container
      let tableComponent;
      if (isInPageSystem) {
        tableComponent = container.append(tableWrapper.outerHTML)[0];
      } else {
        tableComponent = container.append(`<div>${table.outerHTML}</div>${tableScript}`)[0];
      }

      // Set table wrapper properties for better integration
      if (tableComponent && isInPageSystem) {
        tableComponent.set({
          draggable: false,
          droppable: false,
          editable: false,
          selectable: false,
          removable: false,
          copyable: false,
          'custom-name': `Table Wrapper ${uniqueID}`,
          tagName: 'div'
        });
      }

      // Add the script component for page system
      if (isInPageSystem) {
        const scriptComponent = container.append(tableScript)[0];
      }

      // Add the actual table component with enhanced-table type for traits
      const actualTable = tableComponent.find('table')[0];
      if (actualTable) {
        actualTable.set({
          type: 'enhanced-table',
          'custom-name': `Enhanced Table ${uniqueID}`,
          tagName: 'table',
          selectable: true,
          hoverable: true,
          editable: true,
          removable: true,
          draggable: true,
          attributes: {
            id: `table${uniqueID}`,
            class: 'table table-striped table-bordered',
            width: '100%'
          }
        });
      }

      editor.Modal.close();

      // Enable formulas in cells
      setTimeout(() => enableFormulaEditing(`table${uniqueID}`), 500);

      // Determine container type for success message
      let containerType = 'container';
      const pageContainer = container.closest('.page-container');
      if (pageContainer) {
        const pageIndex = pageContainer.getAttributes()['data-page-index'];
        containerType = `Page ${parseInt(pageIndex) + 1}`;
      } else if (container.getEl()?.classList.contains('main-content-area')) {
        containerType = 'content area';
      } else if (container.get('tagName')) {
        containerType = container.get('tagName');
      }

      showToast(`Enhanced table with highlighting created successfully in ${containerType}!`, 'success');

    } catch (error) {
      console.error('Error creating table:', error);
      showToast('Error creating table. Please try again.', 'error');
    }
  }

  // Formula editing handler - EXACT COPY FROM ORIGINAL
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

  // Enhanced event listener for table selection to apply highlighting traits
  editor.on('component:selected', function(component) {
    if (component && component.get('tagName') === 'table' && component.getId() && component.getId().startsWith('table')) {
      // Ensure this is recognized as an enhanced table
      if (component.get('type') !== 'enhanced-table') {
        component.set('type', 'enhanced-table');
      }
      
      // Apply any existing highlighting conditions
      const condition = component.get('highlight-condition');
      const color = component.get('highlight-color');
      
      if (condition) {
        setTimeout(() => {
          applyHighlighting(component.getId(), condition, color);
        }, 100);
      }
    }
  });

  // Global function to update highlighting for external access
  window.updateTableHighlighting = function(tableId, condition, color) {
    applyHighlighting(tableId, condition, color);
    
    // Find the table component and trigger update
    const canvasBody = editor.Canvas.getBody();
    const tableEl = canvasBody.querySelector(`#${tableId}`);
    if (tableEl) {
      const tableComponent = editor.DomComponents.getComponentFromElement(tableEl);
      if (tableComponent) {
        editor.trigger('component:update', tableComponent);
      }
    }
  };

  // Page system integration - ensure tables work properly when pages are created/modified
  editor.on('component:add component:update', function(component) {
    // Only process if this might be related to page structure changes
    if (component && (
      component.get('tagName') === 'div' || 
      component.getClasses().includes('page-container') ||
      component.getClasses().includes('main-content-area')
    )) {
      // Re-initialize any tables that might have been affected by page changes
      setTimeout(() => {
        try {
          const canvasBody = editor.Canvas.getBody();
          if (canvasBody && typeof canvasBody.querySelectorAll === 'function') {
            const tables = canvasBody.querySelectorAll('table[id^="table"]');
            tables.forEach(table => {
              const tableId = table.id;
              // Check if table needs re-initialization
              if (!window.pageTableInstances || !window.pageTableInstances[tableId]) {
                // Find and re-execute the table script
                const scriptId = tableId.replace('table', '');
                const scriptElement = canvasBody.querySelector(`.table-script-${scriptId}`);
                if (scriptElement && scriptElement.textContent) {
                  try {
                    eval(scriptElement.textContent);
                  } catch (error) {
                    console.warn('Error re-initializing table:', error);
                  }
                }
              }
            });
          }
        } catch (error) {
          console.warn('Error in page system table integration:', error);
        }
      }, 500);
    }
  });

  // Cleanup function for page system integration
  editor.on('component:remove', function(component) {
    // Clean up any DataTable instances when components are removed
    try {
      if (component && typeof component.getEl === 'function') {
        const element = component.getEl();
        if (element && typeof element.querySelectorAll === 'function') {
          const tables = element.querySelectorAll('table[id^="table"]');
          tables.forEach(table => {
            const tableId = table.id;
            if (window.pageTableInstances && window.pageTableInstances[tableId]) {
              try {
                window.pageTableInstances[tableId].destroy();
                delete window.pageTableInstances[tableId];
              } catch (error) {
                console.warn('Error destroying DataTable:', error);
              }
            }
          });
        }
      }
    } catch (error) {
      console.warn('Error in table cleanup:', error);
    }
  });

  // Enhanced print handling for page system
  if (typeof window !== 'undefined') {
    // Store original print function
    const originalPrint = window.print;
    
    window.print = function() {
      try {
        // Before printing, ensure all highlighted cells use GrapesJS background colors
        const tables = document.querySelectorAll('table[id^="table"]');
        tables.forEach(table => {
          try {
            // Ensure table attributes for print
            table.setAttribute("border", "1");
            table.style.borderCollapse = "collapse";
            table.style.width = "100%";
            table.style.fontFamily = "Arial, sans-serif";
            
            // Find highlighted cells and ensure background color is properly set
            const highlightedCells = table.querySelectorAll('td[data-highlighted="true"], th[data-highlighted="true"]');
            highlightedCells.forEach(cell => {
              // Get background color from GrapesJS component if available
              const cellComponent = editor.DomComponents.getComponentFromElement(cell);
              let bgColor = '#ffff99'; // default
              
              if (cellComponent) {
                const componentBgColor = cellComponent.getStyle()['background-color'];
                if (componentBgColor) {
                  bgColor = componentBgColor;
                }
              }
              
              // Apply inline styles for print compatibility
              cell.style.backgroundColor = bgColor;
              cell.style.webkitPrintColorAdjust = 'exact';
              cell.style.colorAdjust = 'exact';
              cell.style.printColorAdjust = 'exact';
            });
            
          } catch (error) {
            console.warn('Error preparing table for print:', error);
          }
        });
        
        // Call original print function
        originalPrint.call(this);
        
      } catch (error) {
        console.warn('Error in custom print function, using original:', error);
        originalPrint.call(this);
      }
    };
  }

  // Initialize page table instances storage
  if (typeof window !== 'undefined' && !window.pageTableInstances) {
    window.pageTableInstances = {};
  }

  // Custom command to add table to selected component
  editor.Commands.add('add-table-to-selected', {
    run(editor) {
      addTable();
    }
  });

  console.log('Enhanced Custom Table function initialized with highlighting traits and page system integration');
}