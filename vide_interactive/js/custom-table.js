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

  // Global variable to track if formula parser is loaded
  let formulaParserLoaded = false;

  // Function to load HyperFormula library
  function loadFormulaParser() {
    if (formulaParserLoaded) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const iframe = editor.Canvas.getFrameEl();
      const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

      const script = iframeDoc.createElement('script');
      script.src = "https://cdn.jsdelivr.net/npm/hyperformula@2.7.1/dist/hyperformula.min.js";
      script.onload = () => {
        formulaParserLoaded = true;
        console.log('HyperFormula loaded successfully');
        resolve();
      };
      script.onerror = () => {
        console.error('Failed to load HyperFormula');
        reject(new Error('Failed to load HyperFormula'));
      };

      iframeDoc.head.appendChild(script);
    });
  }

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

  // Define a function to add table using popup model
  editor.on('block:drag:stop', (block) => {  
    if (block.get('tagName') === 'table') { 
      addTable();
    } 
  });

  editor.on('load', (block) => {
  const iframe = editor.getContainer().querySelector('iframe'); 
  const contentWindow = iframe.contentWindow; 
  const iframeDocument = contentWindow.document; 
  const head = iframeDocument.head;  
  
  // Add DataTables CSS if not already present
  if (!head.querySelector('link[href*="datatables"]')) {
    const datatablesCss = document.createElement('link');
    datatablesCss.rel = 'stylesheet';
    datatablesCss.href = 'https://cdn.datatables.net/1.11.5/css/dataTables.bootstrap4.min.css';
    head.appendChild(datatablesCss);
    
    const buttonsCSS = document.createElement('link');
    buttonsCSS.rel = 'stylesheet';
    buttonsCSS.href = 'https://cdn.datatables.net/buttons/2.2.2/css/buttons.bootstrap4.min.css';
    head.appendChild(buttonsCSS);
  }
  
  const style = document.createElement('style');
  style.type = 'text/css'; 
  style.innerHTML = `
    a.dt-button{
      border: 1px solid #ccc !important;
    } 
    .dataTables_wrapper .dataTables_filter input{
      border: 1px solid #ccc !important;
    }
    .dataTables_wrapper .dataTables_filter input:focus-visible{
      outline: 0px!important;
    }
    
    .i_designer-dashed *[data-i_designer-highlightable]{
      border: 1px solid #ccc !important;
    }
    .dataTables_wrapper .dataTables_paginate .paginate_button.current{
      border: 1px solid #ccc !important;
    }
    .dataTables_wrapper .dataTables_paginate .paginate_button:hover{
      border: 1px solid #ccc !important;
      background: linear-gradient(to bottom, #fff 0%, #dcdcdc 100%) !important;
    }
    table.dataTable{
      border: 1px solid #ccc !important;
    }
    table.dataTable thead th{
      border-bottom: 1px solid #ccc !important;
    }
    
    /* Formula cell styles */
    .formula-cell {
      position: relative;
      min-height: 20px;
    }
    .formula-cell.editing {
      background-color: #f0f8ff !important;
      border: 2px solid #007bff !important;
    }
    .formula-cell[data-formula]::before {
      content: "fx";
      position: absolute;
      top: -8px;
      left: 2px;
      font-size: 10px;
      color: #007bff;
      font-weight: bold;
      background: white;
      padding: 0 2px;
      border-radius: 2px;
      z-index: 10;
    }
    .formula-cell.error {
      background-color: #ffe6e6 !important;
      color: #d32f2f !important;
    }

    /* Updated highlighted cell styles - applied to td/th instead of div */
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
      
      /* Hide the indicators in print to avoid clutter */
      td[data-highlighted="true"]::after, th[data-highlighted="true"]::after,
      .formula-cell[data-formula]::before {
        display: none !important;
      }
    }
  `; 
  head.appendChild(style);  
});

  // Add custom table component type with traits
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
      
      editor.trigger('component:update', selected);
    }
  }
});
 
  // Define a function to add table using popup model
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
    editor.Modal.setContent(`<div class="new-table-form">
     
      <div>
        <label for="nColumns">Number of columns</label>
        <input type="number" class="form-control" value="3" name="nColumns" id="nColumns" min="1">
      </div>  
      <div>
        <label for="nRows">Number of rows</label>
        <input type="number" class="form-control" value="4" name="nRows" id="nRows" min="1">
      </div>  
      <div>
        <label for="nColumnsScroll">Scroll Columns length</label>
        <input type="number" class="form-control" value="5" name="nColumnsScroll" id="nColumnsScroll" min="5">
      </div> 
      <div>
        <label for="tbl_file_download">Add File Download</label>
        <input type="checkbox" class="form-control" value='false' name="tbl_file_download" id="tbl_file_download">
      </div>
      <div>
        <label for="tbl_pagination">Add Pagination</label>
        <input type="checkbox" class="form-control" value='false' name="tbl_pagination" id="tbl_pagination">
      </div>
      <div> 
        <label for="tbl_Search">Add Search</label>
        <input type="checkbox" class="form-control" value='false' name="tbl_Search" id="tbl_Search">
      </div>
      <div>
        <label for="tbl_footer">Add Footer</label>
        <input type="checkbox" class="form-control" value='false' name="tbl_footer" id="tbl_footer">
      </div>
      <div>
        <label for="tbl_caption">Add Caption</label>
        <input type="checkbox" class="form-control" value='false' name="tbl_caption" id="tbl_caption">
      </div>
      <div>
        <label for="tbl_formula">Enable Formula Support (Excel-like)</label>
        <input type="checkbox" class="form-control" value='false' name="tbl_formula" id="tbl_formula">
      </div>
      <div> 
        <input id="table-button-create-new" type="button" value="Create Table" data-component-id="c1006">
      </div>
    </div>`);
    
    editor.Modal.open(); 
    
    var el = document.getElementById("table-button-create-new");
    el.addEventListener("click", () => createTable(targetContainer), true); 
    
    const fileDownloadCheckbox = document.getElementById("tbl_file_download");
    const paginationCheckbox = document.getElementById("tbl_pagination");
    const searchCheckbox = document.getElementById("tbl_Search");
    const footerCheckbox = document.getElementById("tbl_footer");
    const captionCheckbox = document.getElementById("tbl_caption");
    const formulaCheckbox = document.getElementById("tbl_formula");
    
    fileDownloadCheckbox.addEventListener("change", function() {
      fileDownloadCheckbox.value = this.checked.toString(); 
    });
    paginationCheckbox.addEventListener("change", function() {
      paginationCheckbox.value = this.checked.toString(); 
    });
    searchCheckbox.addEventListener("change", function() {
      searchCheckbox.value = this.checked.toString();
    });
    footerCheckbox.addEventListener("change", function() {
      footerCheckbox.value = this.checked.toString();
    }); 
    captionCheckbox.addEventListener("change", function() {
      captionCheckbox.value = this.checked.toString();
    });
    formulaCheckbox.addEventListener("change", function() {
      formulaCheckbox.value = this.checked.toString();
    });
     
    // Clear any existing empty table components
    editor.DomComponents.getComponents().forEach(component => {
      if (component.get('tagName') === 'table') { 
        component.remove('content', '');
      }
    });
    
    async function createTable(container) {   
      let uniqueID = Math.floor(100 + Math.random() * 900);  
      let tblFileDownload = document.getElementById("tbl_file_download").value;
      let tblPagination = document.getElementById("tbl_pagination").value;
      let tblSearch = document.getElementById("tbl_Search").value;  
      let tblFooter = document.getElementById("tbl_footer").value;  
      let tblCaption = document.getElementById("tbl_caption").value;
      let tblFormula = document.getElementById("tbl_formula").value;
      let tblHeader = 'true';
      let downloadBtn = '[]';
      
      // Load formula parser if needed
      if (tblFormula === 'true') {
        try {
          await loadFormulaParser();
          showToast('Formula parser loaded successfully!', 'success');
        } catch (error) {
          showToast('Failed to load formula parser. Formula functionality may not work.', 'error');
        }
      }
      
      if (tblFileDownload === 'true') {
        downloadBtn = `["copy", "csv", "excel", "pdf", "print",{
          text: "MS Word",
          action: function() {   
            const table = document.getElementById("table${uniqueID}");  
            table.setAttribute("border", "1");  
            table.style.borderCollapse = "collapse";
            table.style.width = "100%";
            table.style.fontFamily = "Arial, sans-serif";
            const html = table.outerHTML; 
            const url = "data:application/msword," + encodeURIComponent(html);  
            const downloadLink = document.createElement("a");  
            downloadLink.href = url;
            downloadLink.download = "data.doc";
            downloadLink.style.display = "none";
            document.body.appendChild(downloadLink); 
            window.location.href = downloadLink.href; 
            document.body.removeChild(downloadLink);   
          }
        }]`; 
      }  
      
      const rows = parseInt(document.getElementById('nRows').value); 
      const cols = parseInt(document.getElementById('nColumns').value);  
      const colsScroll = parseInt(document.getElementById('nColumnsScroll').value);

      // Create a wrapper div for better page integration
      let tableWrapper = document.createElement('div');  
      tableWrapper.style.cssText = `
        padding: 10px 0px;
        position: relative;
        width: 100%;
        max-width: 100%;
        overflow: hidden;
        box-sizing: border-box;
      `;
      tableWrapper.className = 'table-wrapper-' + uniqueID;

      let table = document.createElement('table');  
      table.setAttribute('width','100%'); 
      table.setAttribute('class','table table-striped table-bordered'); 
      table.setAttribute('id','table'+uniqueID);
      
      if (tblFormula === 'true') {
        table.setAttribute('data-formula-enabled', 'true');
      }
      
      if (tblCaption === 'true') { 
        let caption1a = document.createElement('caption'); 
        caption1a.textContent = 'Caption Text';  
        caption1a.style.captionSide = 'top';  
        table.appendChild(caption1a);  
      }

      let thead = document.createElement('thead');
      for (let j = 0; j < cols; j++) {
        let th = document.createElement('th'); 
        th.setAttribute("class", "col"+uniqueID+j);
        let div1 = document.createElement('div');
        div1.textContent = 'Header ' + (j + 1);
        if (tblFormula === 'true') {
          div1.setAttribute('contenteditable', 'true');
          div1.className = 'formula-cell';
        }
        th.appendChild(div1);
        thead.appendChild(th);
      } 

      if (tblHeader === 'true') { 
        table.appendChild(thead);
      }   
    
      let tbody = document.createElement('tbody');
      for (let i = 0; i < rows; i++) {
        let tr = document.createElement('tr');
        for (let j = 0; j < cols; j++) {
          let td = document.createElement('td');
          td.setAttribute("class", "col"+uniqueID+j);
          let div = document.createElement('div');
          div.textContent = 'Cell ' + (i + 1) + '-' + (j + 1);
          if (tblFormula === 'true') {
            div.setAttribute('contenteditable', 'true');
            div.className = 'formula-cell';
            div.setAttribute('data-row', i);
            div.setAttribute('data-col', j);
            console.log('Formula cell created at row:', i, 'col:', j);
          }
          td.appendChild(div);
          tr.appendChild(td);
        }  
        tbody.appendChild(tr);
      }    
      
      if (tblFooter === 'true') {  
        let tr = document.createElement('tr');
        for (let k = 0; k < cols; k++) {
          let th = document.createElement('th'); 
          th.style.fontWeight = '800'; 
          th.setAttribute("class", "col"+uniqueID+k);
          let div1 = document.createElement('div');
          div1.textContent = 'Footer ' + (k + 1);
          if (tblFormula === 'true') {
            div1.setAttribute('contenteditable', 'true');
            div1.className = 'formula-cell';
          }
          th.appendChild(div1);
          tr.appendChild(th);
        }  
        tbody.appendChild(tr);
      }   
      
      var scrollXCol = colsScroll < cols;
      table.appendChild(tbody); 
      tableWrapper.appendChild(table);   
      
      // Generate the DataTable script with enhanced formula functionality
      let tableScript = `
        <script class="table-script-${uniqueID}"> 
          (function() {
            let hyperformulaInstance = null;
            let tableData = [];
            
            // Wait for jQuery and DataTables to be available
            function initTable() {
              if (typeof jQuery === 'undefined' || typeof jQuery.fn.DataTable === 'undefined') {
                setTimeout(initTable, 100);
                return;
              }
              
              // Check if we're in a page system
              const tableElement = document.getElementById('table${uniqueID}');
              const isInPageSystem = tableElement && tableElement.closest('.page-container');
              
              // Initialize HyperFormula if formulas are enabled
if (tableElement && tableElement.hasAttribute('data-formula-enabled')) {
  initializeHyperFormula().then(() => {
    console.log('HyperFormula initialization completed');
    setupFormulaHandlers('${uniqueID}');
  }).catch(error => {
    console.warn('HyperFormula initialization failed, formulas will use fallback evaluator:', error);
    setupFormulaHandlers('${uniqueID}');
  });
} else {
  setupFormulaHandlers('${uniqueID}');
}
              
              // Configure DataTable options based on context
              const dtOptions = {
                dom: 'Bfrtip',
                paging: ${tblPagination},
                "info": ${tblPagination}, 
                "lengthChange": true,
                fixedHeader: false,
                "scrollX": ${scrollXCol}, 
                fixedColumns: ${scrollXCol}, 
                searching: ${tblSearch},  
                buttons: ${downloadBtn},
                drawCallback: function() {
                  setupFormulaHandlers('${uniqueID}');
                  
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
                    display: jQuery.fn.dataTable.Responsive.display.childRowImmediate,
                    type: 'none',
                    target: ''
                  }
                } : false
              };
              
              // Initialize DataTable
              const dataTable = jQuery('#table${uniqueID}').DataTable(dtOptions);
              
              // Store reference for cleanup
              if (window.pageTableInstances) {
                window.pageTableInstances = window.pageTableInstances || {};
                window.pageTableInstances['table${uniqueID}'] = dataTable;
              }
              
              // Initial setup of formula handlers
              setupFormulaHandlers('${uniqueID}');
            }
            
            // Initialize HyperFormula engine
function initializeHyperFormula() {
  return new Promise((resolve, reject) => {
    try {
      // Get the iframe's window object where HyperFormula was loaded
      const iframe = document.querySelector('iframe');
      const iframeWindow = iframe ? iframe.contentWindow : window;
      
      // Check if HyperFormula is available in the iframe context
      const HF = iframeWindow.HyperFormula || window.HyperFormula;
      
      if (!HF) {
        console.error('HyperFormula not found in iframe or main window');
        reject(new Error('HyperFormula not available'));
        return;
      }
      
      console.log('HyperFormula found:', HF);
      
      const options = {
        licenseKey: 'gpl-v3',
        useColumnIndex: true,
        useArrayArithmetic: true,
      };
      
      hyperformulaInstance = HF.buildEmpty(options);
      console.log('HyperFormula instance created successfully:', hyperformulaInstance);
      
      // Initialize table data structure
      initializeTableData();
      resolve(hyperformulaInstance);
      
    } catch (error) {
      console.error('Failed to initialize HyperFormula:', error);
      hyperformulaInstance = null;
      reject(error);
    }
  });
}

// ADD this new function
function simpleFormulaEvaluator(formula, tableData, currentRow, currentCol) {
  try {
    let cleanFormula = formula.trim();
    if (cleanFormula.startsWith('=')) {
      cleanFormula = cleanFormula.substring(1);
    }
    
    // Replace cell references (A1, B2, etc.) with actual values
    cleanFormula = cleanFormula.replace(/([A-Z]+)(\d+)/g, (match, colStr, rowStr) => {
      const row = parseInt(rowStr) - 1;
      let col = 0;
      for (let i = 0; i < colStr.length; i++) {
        col = col * 26 + (colStr.charCodeAt(i) - 64);
      }
      col -= 1;
      
      if (tableData[row] && tableData[row][col] !== undefined) {
        const value = tableData[row][col];
        return typeof value === 'number' ? value : (parseFloat(value) || 0);
      }
      return 0;
    });
    
    // Handle basic functions like SUM
    cleanFormula = cleanFormula.replace(/SUM\(([^)]+)\)/gi, (match, range) => {
      const rangeMatch = range.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
      if (rangeMatch) {
        const startRow = parseInt(rangeMatch[2]) - 1;
        const endRow = parseInt(rangeMatch[4]) - 1;
        let startCol = 0, endCol = 0;
        
        for (let i = 0; i < rangeMatch[1].length; i++) {
          startCol = startCol * 26 + (rangeMatch[1].charCodeAt(i) - 64);
        }
        startCol -= 1;
        
        for (let i = 0; i < rangeMatch[3].length; i++) {
          endCol = endCol * 26 + (rangeMatch[3].charCodeAt(i) - 64);
        }
        endCol -= 1;
        
        let sum = 0;
        for (let r = startRow; r <= endRow; r++) {
          for (let c = startCol; c <= endCol; c++) {
            if (tableData[r] && tableData[r][c] !== undefined) {
              const val = typeof tableData[r][c] === 'number' ? tableData[r][c] : parseFloat(tableData[r][c]);
              if (!isNaN(val)) sum += val;
            }
          }
        }
        return sum;
      }
      return 0;
    });
    
    // Evaluate the mathematical expression safely
    const result = Function('"use strict"; return (' + cleanFormula + ')')();
    return { error: false, result: result };
    
  } catch (error) {
    console.warn('Simple formula evaluation error:', error);
    return { error: true, result: '#ERROR' };
  }
}

// ADD this new function
function getCurrentTableData() {
  const table = document.getElementById('table${uniqueID}');
  if (!table) return [];
  
  const rows = table.querySelectorAll('tbody tr');
  const tableData = [];
  
  rows.forEach((row, rowIndex) => {
    const cells = row.querySelectorAll('td');
    const rowData = [];
    
    cells.forEach((cell, colIndex) => {
      const div = cell.querySelector('div');
      let value = div ? div.textContent.trim() : '';
      
      const numValue = parseFloat(value);
      rowData.push(isNaN(numValue) ? value : numValue);
    });
    
    tableData.push(rowData);
  });
  
  return tableData;
}
            console.log('HyperFormula instance created:', hyperformulaInstance);
            // Initialize table data structure for formulas
            function initializeTableData() {
              const table = document.getElementById('table${uniqueID}');
              if (!table) return;
              
              const rows = table.querySelectorAll('tbody tr');
              tableData = [];
              
              rows.forEach((row, rowIndex) => {
                const cells = row.querySelectorAll('td');
                const rowData = [];
                
                cells.forEach((cell, colIndex) => {
                  const div = cell.querySelector('div');
                  const value = div ? div.textContent.trim() : '';
                  
                  // Convert to number if possible, otherwise keep as string
                  const numValue = parseFloat(value);
                  rowData.push(isNaN(numValue) ? value : numValue);
                });
                
                tableData.push(rowData);
              });
              
              // Add data to HyperFormula
              if (hyperformulaInstance && tableData.length > 0) {
                const sheetName = 'Table${uniqueID}';
                try {
                  hyperformulaInstance.addSheet(sheetName);
                  hyperformulaInstance.setSheetContent(0, tableData);
                } catch (error) {
                  console.warn('Error setting up HyperFormula sheet:', error);
                }
              }
            }
            
            // Convert cell reference (A1, B2, etc.) to row/col indices
            function cellRefToIndices(cellRef) {
              if (!cellRef || typeof cellRef !== 'string') return null;
              
              const match = cellRef.match(/^([A-Z]+)(\\d+)$/);
              if (!match) return null;
              
              const colStr = match[1];
              const rowNum = parseInt(match[2]);
              
              let col = 0;
              for (let i = 0; i < colStr.length; i++) {
                col = col * 26 + (colStr.charCodeAt(i) - 64);
              }
              col -= 1; // Convert to 0-based
              const row = rowNum - 1; // Convert to 0-based
              
              return { row, col };
            }
            
            // Convert row/col indices to cell reference (A1, B2, etc.)
            function indicesToCellRef(row, col) {
              let colStr = '';
              let colNum = col + 1;
              
              while (colNum > 0) {
                colNum--;
                colStr = String.fromCharCode(65 + (colNum % 26)) + colStr;
                colNum = Math.floor(colNum / 26);
              }
              
              return colStr + (row + 1);
            }
            
            // Evaluate formula using HyperFormula
// REPLACE the existing evaluateFormula function
function evaluateFormula(formula, currentRow, currentCol) {
  console.log('Evaluating formula:', formula, 'at position:', currentRow, currentCol);
  
  const tableData = getCurrentTableData();
  console.log('Current table data:', tableData);
  
  // Try HyperFormula first
  if (hyperformulaInstance) {
    try {
      let cleanFormula = formula.trim();
      if (cleanFormula.startsWith('=')) {
        cleanFormula = cleanFormula.substring(1);
      }
      
      updateHyperFormulaData();
      
      const tempAddress = { sheet: 0, row: currentRow, col: currentCol };
      hyperformulaInstance.setCellContents(tempAddress, '=' + cleanFormula);
      const result = hyperformulaInstance.getCellValue(tempAddress);
      
      if (result && typeof result === 'object' && result.type === 'ERROR') {
        console.log('HyperFormula error, falling back to simple evaluator');
        return simpleFormulaEvaluator(formula, tableData, currentRow, currentCol);
      }
      
      console.log('HyperFormula result:', result);
      return { error: false, result: result };
      
    } catch (error) {
      console.warn('HyperFormula evaluation failed, using fallback:', error);
      return simpleFormulaEvaluator(formula, tableData, currentRow, currentCol);
    }
  } else {
    console.log('HyperFormula not available, using simple evaluator');
    return simpleFormulaEvaluator(formula, tableData, currentRow, currentCol);
  }
}
            
            // Update HyperFormula with current table data
function updateHyperFormulaData() {
  const table = document.getElementById('table${uniqueID}');
  if (!table || !hyperformulaInstance) return;
  
  const rows = table.querySelectorAll('tbody tr');
  const newTableData = [];
  
  rows.forEach((row, rowIndex) => {
    const cells = row.querySelectorAll('td');
    const rowData = [];
    
    cells.forEach((cell, colIndex) => {
      const div = cell.querySelector('div');
      let value = div ? div.textContent.trim() : '';
      
      // For non-formula cells, convert to number if possible
      if (!div || !div.hasAttribute('data-formula')) {
        const numValue = parseFloat(value);
        rowData.push(isNaN(numValue) ? value : numValue);
      } else {
        // For formula cells, we need to get their actual computed value
        // But don't include the formula itself in the data
        const numValue = parseFloat(value);
        rowData.push(isNaN(numValue) ? value : numValue);
      }
    });
    
    newTableData.push(rowData);
  });
  
  try {
    // Clear and reset the sheet with new data
    if (hyperformulaInstance.getSheetNames().length > 0) {
      hyperformulaInstance.removeSheet(0);
    }
    hyperformulaInstance.addSheet('Table${uniqueID}');
    hyperformulaInstance.setSheetContent(0, newTableData);
    
    console.log('Updated HyperFormula data:', newTableData); // Debug log
  } catch (error) {
    console.warn('Error updating HyperFormula data:', error);
  }
}
            
function setupFormulaHandlers(tableId) {
  const table = document.getElementById('table' + tableId);
  if (!table || !table.hasAttribute('data-formula-enabled')) return;
  
  const cells = table.querySelectorAll('.formula-cell');
  
  console.log('Setting up formula handlers for', cells.length, 'cells'); // Debug log
  
  cells.forEach((cell, index) => {
    // Remove existing listeners to prevent duplicates
    cell.removeEventListener('focus', handleCellFocus);
    cell.removeEventListener('blur', handleCellBlur);
    cell.removeEventListener('keydown', handleCellKeydown);
    
    // Add new listeners
    cell.addEventListener('focus', handleCellFocus);
    cell.addEventListener('blur', handleCellBlur);
    cell.addEventListener('keydown', handleCellKeydown);
    
    // Ensure proper data attributes are set
    if (!cell.hasAttribute('data-row') || !cell.hasAttribute('data-col')) {
      const td = cell.closest('td');
      const tr = td ? td.closest('tr') : null;
      if (tr && td) {
        const rowIndex = Array.from(tr.parentNode.children).indexOf(tr);
        const colIndex = Array.from(tr.children).indexOf(td);
        cell.setAttribute('data-row', rowIndex);
        cell.setAttribute('data-col', colIndex);
      }
    }
  });
}
            
function handleCellFocus(event) {
  const cell = event.target;
  cell.classList.add('editing');
  
  console.log('Cell focused:', cell); // Debug log
  
  // If cell has a formula, show the formula instead of the result
  if (cell.hasAttribute('data-formula')) {
    const formula = cell.getAttribute('data-formula');
    cell.textContent = formula;
    console.log('Showing formula:', formula); // Debug log
  }
  
  // Clear any error styling
  cell.classList.remove('error');
  
  // Select all text for easy editing
  setTimeout(() => {
    if (document.activeElement === cell) {
      const range = document.createRange();
      range.selectNodeContents(cell);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }, 10);
}
            
function handleCellKeydown(event) {
  // Allow Enter to confirm formula entry and prevent default behavior
  if (event.key === 'Enter') {
    event.preventDefault(); // Prevent default Enter behavior
    event.target.blur(); // This will trigger handleCellBlur
  }
  // Allow Escape to cancel editing
  if (event.key === 'Escape') {
    event.preventDefault();
    const cell = event.target;
    // Restore original content if it was a formula
    if (cell.hasAttribute('data-formula')) {
      const result = evaluateFormula(cell.getAttribute('data-formula'), 
        parseInt(cell.getAttribute('data-row')) || 0,
        parseInt(cell.getAttribute('data-col')) || 0
      );
      cell.textContent = result.error ? result.result : result.result;
    }
    cell.blur();
  }
}
            
function handleCellBlur(event) {
  const cell = event.target;
  cell.classList.remove('editing');
  
  const content = cell.textContent.trim();
  const row = parseInt(cell.getAttribute('data-row')) || 0;
  const col = parseInt(cell.getAttribute('data-col')) || 0;
  
  console.log('Cell blur - Content:', content, 'Row:', row, 'Col:', col); // Debug log
  
  if (content.startsWith('=')) {
    // This is a formula
    try {
      cell.setAttribute('data-formula', content);
      
      // Update table data first
      updateHyperFormulaData();
      
      // Then evaluate the formula
      const result = evaluateFormula(content, row, col);
      
      console.log('Formula result:', result); // Debug log
      
      if (result.error) {
        cell.textContent = result.result;
        cell.classList.add('error');
      } else {
        // Format the result appropriately
        let displayValue = result.result;
        if (typeof displayValue === 'number') {
          // Round to reasonable decimal places
          displayValue = Math.round(displayValue * 100000) / 100000;
        }
        cell.textContent = displayValue;
        cell.classList.remove('error');
      }
      
      // Update other formula cells that might depend on this one
      setTimeout(() => updateDependentFormulas(), 100);
      
    } catch (error) {
      console.warn('Formula error:', error);
      cell.textContent = '#ERROR';
      cell.classList.add('error');
    }
  } else {
    // Regular text/number, remove formula data
    cell.removeAttribute('data-formula');
    cell.classList.remove('error');
    
    // Update HyperFormula data and recalculate dependent formulas
    updateHyperFormulaData();
    setTimeout(() => updateDependentFormulas(), 100);
  }
}
            
            // Update all formula cells when data changes
function updateDependentFormulas() {
  const table = document.getElementById('table${uniqueID}');
  if (!table) return;
  
  const formulaCells = table.querySelectorAll('.formula-cell[data-formula]');
  
  console.log('Updating', formulaCells.length, 'dependent formulas'); // Debug log
  
  formulaCells.forEach(cell => {
    if (cell.classList.contains('editing')) return; // Skip currently editing cell
    
    const formula = cell.getAttribute('data-formula');
    const row = parseInt(cell.getAttribute('data-row')) || 0;
    const col = parseInt(cell.getAttribute('data-col')) || 0;
    
    if (formula && formula.startsWith('=')) {
      try {
        const result = evaluateFormula(formula, row, col);
        
        if (result.error) {
          cell.textContent = result.result;
          cell.classList.add('error');
        } else {
          // Format the result appropriately
          let displayValue = result.result;
          if (typeof displayValue === 'number') {
            displayValue = Math.round(displayValue * 100000) / 100000;
          }
          cell.textContent = displayValue;
          cell.classList.remove('error');
        }
      } catch (error) {
        cell.textContent = '#ERROR';
        cell.classList.add('error');
      }
    }
  });
}

            
            // Expose functions globally for access
            window.setupFormulaHandlers = setupFormulaHandlers;
            window.handleCellFocus = handleCellFocus;
            window.handleCellBlur = handleCellBlur;
            window.handleCellKeydown = handleCellKeydown;
            window.evaluateFormula = evaluateFormula;
            window.updateDependentFormulas = updateDependentFormulas;
            
            initTable();
          })();
        </script>`;
      
      try {
        // Add the table to the selected container
        const tableComponent = container.append(tableWrapper.outerHTML)[0];
        
        // Set table wrapper properties for better integration
        if (tableComponent) {
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
        
        // Add the script component
        const scriptComponent = container.append(tableScript)[0];
        
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
          
          actualTable.addStyle({
            'cursor': 'pointer',
            'user-select': 'none'
          });
        }
        
        editor.Modal.close();
        
        // Clean up temporary elements
        if (tableWrapper.parentNode) {
          tableWrapper.parentNode.removeChild(tableWrapper);
        }
        
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
        
        const formulaMessage = tblFormula === 'true' ? ' with Excel-like formula support' : '';
        showToast(`Enhanced table${formulaMessage} created successfully in ${containerType}!`, 'success');
        
        // If in page system, trigger any overflow checking
        if (pageContainer && window.pageSetupManager) {
          setTimeout(() => {
            if (window.pageSetupManager.checkContentOverflow) {
              window.pageSetupManager.checkContentOverflow();
            }
          }, 1000);
        }
        
      } catch (error) {
        console.error('Error creating table:', error);
        showToast('Error creating table. Please try again.', 'error');
      }
    };
  }  
   
  // Event listener when a component drag ends - enhanced for page system
  editor.on('component:drag:end', function (event) { 
    var selectedComponent = editor.getSelected();
    if (selectedComponent) {
      var childComponents = selectedComponent.components();
      if (childComponents.length > 0) {
        var firstChild = childComponents.models[0]; 
        var childTagName = firstChild.get('tagName');  
        if (childTagName === 'table') {  
          // Handle table in page system
          const pageContainer = selectedComponent.closest('.page-container');
          if (pageContainer) {
            console.log('Table moved within page system, updating layout...');
            // Give time for the table to settle before updating
            setTimeout(() => {
              var htmlContent = editor.getHtml();  
              var css = editor.getCss();    
              updateComponents(editor.getHtml()); 
              var modifiedHtml = addInlineCssToCaptions(htmlContent); 
              setTimeout(() => {  
                editor.setComponents(modifiedHtml);  
                editor.setStyle(css);  
              }, 500); 
            }, 200);
          } else {
            // Original behavior for non-page system
            var htmlContent = editor.getHtml();  
            var css = editor.getCss();    
            updateComponents(editor.getHtml()); 
            var modifiedHtml = addInlineCssToCaptions(htmlContent); 
            setTimeout(() => {  
              editor.setComponents(modifiedHtml);  
              editor.setStyle(css);  
            }, 1000); 
          }
        } 
      }  
    } 
  });  

  // Function to update the components without duplication
  function updateComponents(htmlContent) {
    editor.DomComponents.clear();  
    editor.setComponents(htmlContent); 
    editor.UndoManager.add(editor.getComponents());
  }

  // Event listener for undo and redo actions
  editor.on('undo redo', function(eventType) {
    if (eventType === 'undo') {
      editor.UndoManager.undo();
      updateComponents(editor.getHtml());
    } else if (eventType === 'redo') {
      editor.UndoManager.redo();
      updateComponents(editor.getHtml());
    }  
  }); 

  // Add captionSide Top css in Caption Tag
  function addInlineCssToCaptions(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var captionTags = doc.querySelectorAll('caption');
    captionTags.forEach(function(captionTag) { 
      captionTag.style.captionSide = 'top'; 
    }); 
    return doc.documentElement.outerHTML;
  }

  // Custom command to add table to selected component
  editor.Commands.add('add-table-to-selected', {
    run(editor) {
      addTable();
    }
  });

  // Add a toolbar button or context menu option (optional)
  editor.on('component:selected', function(component) {
    if (component && component.get('droppable') !== false) {
      // Could add custom toolbar buttons here for quick table insertion
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

  console.log('Enhanced Custom Table function initialized with Excel-like formula support, highlighting traits and page system integration');
}