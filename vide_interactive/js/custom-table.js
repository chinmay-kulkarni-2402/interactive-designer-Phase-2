function customTable(editor) {
  // Add Table block in the Block Manager
  editor.Blocks.add("table", {
    label: "Table",
    category: "Extra",
    content: "<div class='table-placeholder' data-table-trigger='true'>Click to configure table</div>",
    attributes: {
      class: "fa fa-table",
    },
  });

  // CSS styles for table and formula button
  editor.on("load", () => {
    const iframe = editor.getContainer().querySelector("iframe");
    const contentWindow = iframe.contentWindow;
    const iframeDocument = contentWindow.document;
    const head = iframeDocument.head;
    const style = document.createElement("style");
    style.type = "text/css";
    style.innerHTML = `
      <style>
        .table-wrapper {
          position: relative;
          overflow-x: auto;
        }
        .table-placeholder {
          border: 2px dashed #ccc;
          padding: 20px;
          text-align: center;
          color: #666;
          cursor: pointer;
          background: #f9f9f9;
          border-radius: 4px;
        }
        .table-placeholder:hover {
          border-color: #007bff;
          color: #007bff;
        }
        .custom-table {
          width: 100%;
          border-collapse: collapse;
          border: 1px solid #ccc;
        }
        .custom-table td, .custom-table th {
          border: 1px solid #ccc;
          padding: 8px;
          position: relative;
          min-width: 100px;
          background: white;
        }
        .custom-table th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        .custom-table td[contenteditable="true"]:focus,
        .custom-table th[contenteditable="true"]:focus {
          outline: 2px solid #007bff;
          background-color: #f8f9ff;
        }
        .formula-btn {
          position: absolute;
          top: 2px;
          right: 2px;
          width: 16px;
          height: 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 3px;
          font-size: 10px;
          cursor: pointer;
          display: none;
          z-index: 10;
        }
        .custom-table td:hover .formula-btn,
        .custom-table th:hover .formula-btn {
          display: block;
        }
        .formula-btn:hover {
          background: #0056b3;
        }
        .formula-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          border: 1px solid #ccc;
          border-radius: 5px;
          padding: 20px;
          z-index: 1000;
          max-width: 600px;
          max-height: 500px;
          overflow-y: auto;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .formula-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.5);
          z-index: 999;
        }
        .formula-category {
          margin-bottom: 15px;
        }
        .formula-category h4 {
          margin: 0 0 8px 0;
          color: #333;
          border-bottom: 1px solid #eee;
          padding-bottom: 4px;
        }
        .formula-list {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
        }
        .formula-item {
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          padding: 5px 10px;
          border-radius: 3px;
          cursor: pointer;
          font-size: 12px;
          transition: background-color 0.2s;
        }
        .formula-item:hover {
          background: #e9ecef;
        }
        .formula-input {
          width: 100%;
          padding: 8px;
          margin: 10px 0;
          border: 1px solid #ccc;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
        }
        .formula-buttons {
          text-align: right;
          margin-top: 15px;
        }
        .formula-buttons button {
          margin-left: 10px;
          padding: 8px 15px;
          border: 1px solid #ccc;
          border-radius: 3px;
          cursor: pointer;
        }
        .formula-buttons .btn-primary {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }
        .formula-buttons .btn-primary:hover {
          background: #0056b3;
        }
        .cell-with-formula {
          background-color: #fff3cd !important;
          font-weight: bold;
        }
        a.dt-button{
          border: 1px solid #ccc !important;
        } 
        .dataTables_wrapper .dataTables_filter input{
          border: 1px solid #ccc !important;
        }
        .dataTables_wrapper .dataTables_filter input:focus-visible{
          outline: 0px!important;
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
      </style>
    `;
    head.appendChild(style);
  });

  // Formula categories and functions
  const formulaCategories = {
    "Arithmetic": [
      { name: "SUM", formula: "SUM(A1:A10)", description: "Sum of range" },
      { name: "AVERAGE", formula: "AVERAGE(A1:A10)", description: "Average of range" },
      { name: "COUNT", formula: "COUNT(A1:A10)", description: "Count numbers in range" },
      { name: "MAX", formula: "MAX(A1:A10)", description: "Maximum value" },
      { name: "MIN", formula: "MIN(A1:A10)", description: "Minimum value" },
      { name: "PRODUCT", formula: "PRODUCT(A1:A10)", description: "Product of range" },
      { name: "POWER", formula: "POWER(2,3)", description: "Power function" },
      { name: "SQRT", formula: "SQRT(16)", description: "Square root" }
    ],
    "Logical": [
      { name: "IF", formula: "IF(A1>10,\"High\",\"Low\")", description: "Conditional logic" },
      { name: "AND", formula: "AND(A1>5,B1<10)", description: "Logical AND" },
      { name: "OR", formula: "OR(A1>5,B1<10)", description: "Logical OR" },
      { name: "NOT", formula: "NOT(A1=0)", description: "Logical NOT" },
      { name: "IFERROR", formula: "IFERROR(A1/B1,0)", description: "Handle errors" },
      { name: "ISBLANK", formula: "ISBLANK(A1)", description: "Check if blank" },
      { name: "ISNUMBER", formula: "ISNUMBER(A1)", description: "Check if number" }
    ],
    "Text": [
      { name: "CONCATENATE", formula: "CONCATENATE(A1,\" \",B1)", description: "Join text" },
      { name: "LEFT", formula: "LEFT(A1,5)", description: "Left characters" },
      { name: "RIGHT", formula: "RIGHT(A1,5)", description: "Right characters" },
      { name: "MID", formula: "MID(A1,2,3)", description: "Middle characters" },
      { name: "LEN", formula: "LEN(A1)", description: "Text length" },
      { name: "UPPER", formula: "UPPER(A1)", description: "Uppercase" },
      { name: "LOWER", formula: "LOWER(A1)", description: "Lowercase" },
      { name: "TRIM", formula: "TRIM(A1)", description: "Remove spaces" }
    ],
    "Date & Time": [
      { name: "TODAY", formula: "TODAY()", description: "Today's date" },
      { name: "NOW", formula: "NOW()", description: "Current date and time" },
      { name: "YEAR", formula: "YEAR(A1)", description: "Extract year" },
      { name: "MONTH", formula: "MONTH(A1)", description: "Extract month" },
      { name: "DAY", formula: "DAY(A1)", description: "Extract day" },
      { name: "WEEKDAY", formula: "WEEKDAY(A1)", description: "Day of week" },
      { name: "DATEDIF", formula: "DATEDIF(A1,B1,\"D\")", description: "Date difference" }
    ],
    "Lookup": [
      { name: "VLOOKUP", formula: "VLOOKUP(A1,B:D,2,FALSE)", description: "Vertical lookup" },
      { name: "HLOOKUP", formula: "HLOOKUP(A1,B1:D3,2,FALSE)", description: "Horizontal lookup" },
      { name: "INDEX", formula: "INDEX(A:A,5)", description: "Get value by position" },
      { name: "MATCH", formula: "MATCH(A1,B:B,0)", description: "Find position" }
    ]
  };

  // Formula calculation engine
  function calculateFormula(formula, table) {
    try {
      // Remove = sign if present
      formula = formula.replace(/^=/, '');
      
      // Basic formula parsing and calculation
      if (formula.startsWith('SUM(')) {
        const range = formula.match(/SUM\(([^)]+)\)/)[1];
        return calculateSum(range, table);
      } else if (formula.startsWith('AVERAGE(')) {
        const range = formula.match(/AVERAGE\(([^)]+)\)/)[1];
        return calculateAverage(range, table);
      } else if (formula.startsWith('COUNT(')) {
        const range = formula.match(/COUNT\(([^)]+)\)/)[1];
        return calculateCount(range, table);
      } else if (formula.startsWith('MAX(')) {
        const range = formula.match(/MAX\(([^)]+)\)/)[1];
        return calculateMax(range, table);
      } else if (formula.startsWith('MIN(')) {
        const range = formula.match(/MIN\(([^)]+)\)/)[1];
        return calculateMin(range, table);
      } else if (formula.match(/^\d+[\+\-\*\/]\d+/)) {
        // Simple arithmetic
        return eval(formula);
      } else if (formula.match(/^[A-Z]\d+$/)) {
        // Single cell reference
        return getCellValue(formula, table);
      }
      
      return 'Error';
    } catch (e) {
      return 'Error';
    }
  }

  function getCellValue(cellRef, table) {
    const col = cellRef.match(/[A-Z]+/)[0];
    const row = parseInt(cellRef.match(/\d+/)[0]);
    const colIndex = col.charCodeAt(0) - 65; // A=0, B=1, etc.
    
    const rows = table.querySelectorAll('tr');
    if (row > 0 && row <= rows.length) {
      const cells = rows[row - 1].querySelectorAll('td, th');
      if (colIndex < cells.length) {
        const value = cells[colIndex].textContent.trim();
        return isNaN(value) ? value : parseFloat(value);
      }
    }
    return 0;
  }

  function calculateSum(range, table) {
    const values = getRangeValues(range, table);
    return values.reduce((sum, val) => sum + (isNaN(val) ? 0 : parseFloat(val)), 0);
  }

  function calculateAverage(range, table) {
    const values = getRangeValues(range, table);
    const numbers = values.filter(val => !isNaN(val) && val !== '');
    return numbers.length > 0 ? numbers.reduce((sum, val) => sum + parseFloat(val), 0) / numbers.length : 0;
  }

  function calculateCount(range, table) {
    const values = getRangeValues(range, table);
    return values.filter(val => !isNaN(val) && val !== '').length;
  }

  function calculateMax(range, table) {
    const values = getRangeValues(range, table);
    const numbers = values.filter(val => !isNaN(val) && val !== '').map(val => parseFloat(val));
    return numbers.length > 0 ? Math.max(...numbers) : 0;
  }

  function calculateMin(range, table) {
    const values = getRangeValues(range, table);
    const numbers = values.filter(val => !isNaN(val) && val !== '').map(val => parseFloat(val));
    return numbers.length > 0 ? Math.min(...numbers) : 0;
  }

  function getRangeValues(range, table) {
    if (range.includes(':')) {
      const [start, end] = range.split(':');
      const startCol = start.match(/[A-Z]+/)[0];
      const startRow = parseInt(start.match(/\d+/)[0]);
      const endCol = end.match(/[A-Z]+/)[0];
      const endRow = parseInt(end.match(/\d+/)[0]);
      
      const values = [];
      const rows = table.querySelectorAll('tr');
      
      for (let r = startRow; r <= endRow; r++) {
        if (r > 0 && r <= rows.length) {
          const cells = rows[r - 1].querySelectorAll('td, th');
          for (let c = startCol.charCodeAt(0); c <= endCol.charCodeAt(0); c++) {
            const colIndex = c - 65;
            if (colIndex < cells.length) {
              values.push(cells[colIndex].textContent.trim());
            }
          }
        }
      }
      return values;
    } else {
      return [getCellValue(range, table)];
    }
  }

  // Event listener for component add/drop
  editor.on("component:add", function (component) {
    const el = component.getEl();
    if (el && el.classList && el.classList.contains('table-placeholder')) {
      // Trigger table creation modal
      setTimeout(() => {
        addTable();
      }, 100);
    }
  });

  // Alternative event listener for block drop
  editor.on("block:drag:stop", function (block, component) {
    if (block.get('id') === 'table') {
      setTimeout(() => {
        addTable();
      }, 100);
    }
  });

  // Click event for table placeholder
  editor.on("component:selected", function (component) {
    const el = component.getEl();
    if (el && el.classList && el.classList.contains('table-placeholder')) {
      addTable();
    }
  });

  // Function to create formula modal
  function createFormulaModal(cell) {
    const iframe = editor.getContainer().querySelector("iframe");
    const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
    
    // Remove existing modal if any
    const existingOverlay = iframeDocument.querySelector('.formula-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    // Create overlay
    const overlay = iframeDocument.createElement('div');
    overlay.className = 'formula-overlay';
    
    // Create modal
    const modal = iframeDocument.createElement('div');
    modal.className = 'formula-modal';
    
    let modalHTML = `
      <h3>Formula Builder</h3>
      <input type="text" class="formula-input" placeholder="Enter formula (e.g., =SUM(A1:A5) or =A1+B1)" value="${cell.textContent.startsWith('=') ? cell.textContent : ''}">
      <p><small>Press Enter to apply formula or use buttons below</small></p>
    `;
    
    // Add formula categories
    Object.keys(formulaCategories).forEach(category => {
      modalHTML += `
        <div class="formula-category">
          <h4>${category}</h4>
          <div class="formula-list">
      `;
      formulaCategories[category].forEach(formula => {
        modalHTML += `
          <div class="formula-item" data-formula="${formula.formula}" title="${formula.description}">
            ${formula.name}
          </div>
        `;
      });
      modalHTML += `
          </div>
        </div>
      `;
    });
    
    modalHTML += `
      <div class="formula-buttons">
        <button class="btn-cancel">Cancel</button>
        <button class="btn-primary">Apply Formula</button>
      </div>
    `;
    
    modal.innerHTML = modalHTML;
    
    // Add event listeners
    const formulaInput = modal.querySelector('.formula-input');
    const formulaItems = modal.querySelectorAll('.formula-item');
    const cancelBtn = modal.querySelector('.btn-cancel');
    const applyBtn = modal.querySelector('.btn-primary');
    
    // Function to apply formula
    function applyFormula() {
      const formula = formulaInput.value.trim();
      if (formula) {
        // Store the original formula as data attribute
        cell.dataset.formula = formula;
        
        // Calculate and display result
        const table = cell.closest('table');
        if (formula.startsWith('=')) {
          const result = calculateFormula(formula, table);
          cell.textContent = result;
          cell.classList.add('cell-with-formula');
        } else {
          cell.textContent = formula;
          cell.classList.remove('cell-with-formula');
        }
        
        // Update the component in GrapesJS
        const component = editor.getWrapper().find(comp => {
          const el = comp.getEl();
          return el && el.contains(cell);
        })[0];
        if (component) {
          component.set('content', cell.parentElement.innerHTML);
        }
      }
      overlay.remove();
    }
    
    formulaItems.forEach(item => {
      item.addEventListener('click', () => {
        formulaInput.value = '=' + item.dataset.formula;
        formulaInput.focus();
      });
    });
    
    // Enter key to apply formula
    formulaInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        applyFormula();
      }
    });
    
    cancelBtn.addEventListener('click', () => {
      overlay.remove();
    });
    
    applyBtn.addEventListener('click', applyFormula);
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
    
    overlay.appendChild(modal);
    iframeDocument.body.appendChild(overlay);
    
    formulaInput.focus();
    formulaInput.select();
  }

  // Function to make cells editable
  function makeCellsEditable(table) {
    const cells = table.querySelectorAll('td, th');
    cells.forEach(cell => {
      cell.setAttribute('contenteditable', 'true');
      
      // Handle cell editing
      cell.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          cell.blur();
        }
      });
      
      // Handle formula calculation on blur
      cell.addEventListener('blur', () => {
        const content = cell.textContent.trim();
        if (content.startsWith('=')) {
          // Store the original formula
          cell.dataset.formula = content;
          
          // Calculate and display result
          const result = calculateFormula(content, table);
          cell.textContent = result;
          cell.classList.add('cell-with-formula');
        } else {
          cell.classList.remove('cell-with-formula');
        }
        
        // Update component
        const component = editor.getWrapper().find(comp => {
          const el = comp.getEl();
          return el && el.contains(cell);
        })[0];
        if (component) {
          component.set('content', table.outerHTML);
        }
      });
      
      // Show original formula on focus if it's a formula cell
      cell.addEventListener('focus', () => {
        if (cell.dataset.formula && cell.classList.contains('cell-with-formula')) {
          cell.textContent = cell.dataset.formula;
        }
      });
    });
  }

  // Function to add formula buttons to table cells
  function addFormulaButtons(table) {
    const iframe = editor.getContainer().querySelector("iframe");
    const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
    
    const cells = table.querySelectorAll('td, th');
    cells.forEach(cell => {
      // Remove existing formula button if any
      const existingBtn = cell.querySelector('.formula-btn');
      if (existingBtn) {
        existingBtn.remove();
      }
      
      // Create formula button
      const formulaBtn = iframeDocument.createElement('button');
      formulaBtn.className = 'formula-btn';
      formulaBtn.innerHTML = 'ƒ';
      formulaBtn.title = 'Add Formula';
      
      formulaBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        createFormulaModal(cell);
      });
      
      cell.appendChild(formulaBtn);
    });
  }

  // Define a function to add table using popup modal
  function addTable() {
    editor.Modal.setTitle("Create New Table");
    editor.Modal.setContent(`
      <div class="new-table-form">
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
          <label for="tbl_formula">Add Formula</label>
          <input type="checkbox" class="form-control" value='true' name="tbl_formula" id="tbl_formula" checked>
        </div>
        <div> 
          <input id="table-button-create-new" type="button" value="Create Table" data-component-id="c1006">
        </div>
      </div>
    `);
    
    editor.Modal.open();
    
    const createBtn = document.getElementById("table-button-create-new");
    const fileDownloadCheckbox = document.getElementById("tbl_file_download");
    const paginationCheckbox = document.getElementById("tbl_pagination");
    const searchCheckbox = document.getElementById("tbl_Search");
    const footerCheckbox = document.getElementById("tbl_footer");
    const captionCheckbox = document.getElementById("tbl_caption");
    const formulaCheckbox = document.getElementById("tbl_formula");
    
    // Checkbox event listeners
    [fileDownloadCheckbox, paginationCheckbox, searchCheckbox, footerCheckbox, captionCheckbox, formulaCheckbox].forEach(checkbox => {
      checkbox.addEventListener("change", function () {
        this.value = this.checked.toString();
      });
    });
    
    createBtn.addEventListener("click", createTable, true);

    function createTable() {
      const uniqueID = Math.floor(100 + Math.random() * 900);
      const rows = parseInt(document.getElementById("nRows").value);
      const cols = parseInt(document.getElementById("nColumns").value);
      const colsScroll = parseInt(document.getElementById("nColumnsScroll").value);
      
      const tblFileDownload = document.getElementById("tbl_file_download").value;
      const tblPagination = document.getElementById("tbl_pagination").value;
      const tblSearch = document.getElementById("tbl_Search").value;
      const tblFooter = document.getElementById("tbl_footer").value;
      const tblCaption = document.getElementById("tbl_caption").value;
      const tblFormula = document.getElementById("tbl_formula").value;
      
      let downloadBtn = "[]";
      if (tblFileDownload === "true") {
        downloadBtn = `["copy", "csv", "excel", "pdf", "print", {
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

      // Create table wrapper
      const tableWrapper = document.createElement("div");
      tableWrapper.className = "table-wrapper";
      tableWrapper.style.padding = "10px 0px";
      tableWrapper.style.position = "relative";

      // Create table
      const table = document.createElement("table");
      table.setAttribute("width", "100%");
      table.setAttribute("class", "table table-striped table-bordered custom-table");
      table.setAttribute("id", "table" + uniqueID);

      // Add caption if enabled
      if (tblCaption === "true") {
        const caption = document.createElement("caption");
        caption.textContent = "Insert your text here";
        caption.style.captionSide = "top";
        caption.setAttribute('contenteditable', 'true');
        table.appendChild(caption);
      }

      // Create header
      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");
      for (let j = 0; j < cols; j++) {
        const th = document.createElement("th");
        th.setAttribute("class", "col" + uniqueID + j);
        th.setAttribute("contenteditable", "true");
        th.textContent = "Header " + (j + 1);
        headerRow.appendChild(th);
      }
      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Create body
      const tbody = document.createElement("tbody");
      for (let i = 0; i < rows; i++) {
        const tr = document.createElement("tr");
        for (let j = 0; j < cols; j++) {
          const td = document.createElement("td");
          td.setAttribute("class", "col" + uniqueID + j);
          td.setAttribute("contenteditable", "true");
          td.textContent = "Cell " + (i + 1) + "-" + (j + 1);
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }

      // Add footer if enabled
      if (tblFooter === "true") {
        const footerRow = document.createElement("tr");
        for (let k = 0; k < cols; k++) {
          const th = document.createElement("th");
          th.style.fontWeight = "800";
          th.setAttribute("class", "col" + uniqueID + k);
          th.setAttribute("contenteditable", "true");
          th.textContent = "Footer " + (k + 1);
          footerRow.appendChild(th);
        }
        tbody.appendChild(footerRow);
      }

      table.appendChild(tbody);
      tableWrapper.appendChild(table);

      // Check if horizontal scroll is needed
      const scrollXCol = colsScroll < cols;

      // Create DataTable script if any DataTable features are enabled
      let tableScript = "";
      if (tblFileDownload === "true" || tblPagination === "true" || tblSearch === "true") {
        tableScript = `
          <script class="table-script"> 
            if (typeof $ !== 'undefined' && $.fn.DataTable) {
              $('#table${uniqueID}').DataTable({
                dom: 'Bfrtip',
                paging: ${tblPagination},
                "info": ${tblPagination}, 
                "lengthChange": true,
                fixedHeader: true, 
                "scrollX": ${scrollXCol}, 
                fixedColumns: true, 
                searching: ${tblSearch},  
                buttons: ${downloadBtn}
              });
            }
          </script>
        `;
      }

      // Add the table to GrapesJS
      const selectedComponent = editor.getSelected();
      if (selectedComponent) {
        // Replace the placeholder with the actual table
        selectedComponent.set('content', tableWrapper.outerHTML);
        selectedComponent.set('attributes', {});
        selectedComponent.removeClass('table-placeholder');
        
        // Add script if needed
        if (tableScript) {
          editor.DomComponents.addComponent(tableScript);
        }
        
        // Make cells editable and add formula functionality
        setTimeout(() => {
          const iframe = editor.getContainer().querySelector("iframe");
          const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
          const tableElement = iframeDocument.getElementById("table" + uniqueID);
          if (tableElement) {
            makeCellsEditable(tableElement);
            if (tblFormula === "true") {
              addFormulaButtons(tableElement);
            }
          }
        }, 500);
      } else {
        // If no component is selected, add as new component
        const newComponent = editor.DomComponents.addComponent(tableWrapper.outerHTML);
        
        // Add script if needed
        if (tableScript) {
          editor.DomComponents.addComponent(tableScript);
        }
        
        // Make cells editable and add formula functionality
        setTimeout(() => {
          const iframe = editor.getContainer().querySelector("iframe");
          const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
          const tableElement = iframeDocument.getElementById("table" + uniqueID);
          if (tableElement) {
            makeCellsEditable(tableElement);
            if (tblFormula === "true") {
              addFormulaButtons(tableElement);
            }
          }
        }, 500);
      }

      // Close modal after table creation
      editor.Modal.close();
    }
  }

  // Component update event to maintain formula buttons and editability
  editor.on('component:update', function(component) {
    if (component.get('tagName') === 'table') {
      setTimeout(() => {
        const tableEl = component.getEl();
        if (tableEl && tableEl.classList.contains('custom-table')) {
          makeCellsEditable(tableEl);
          addFormulaButtons(tableEl);
        }
      }, 100);
    }
  });

  // Canvas update event to maintain formula buttons and editability
  editor.on('canvas:frame:load', function() {
    setTimeout(() => {
      const iframe = editor.getContainer().querySelector("iframe");
      const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
      const tables = iframeDocument.querySelectorAll('.custom-table');
      tables.forEach(table => {
        makeCellsEditable(table);
        addFormulaButtons(table);
      });
    }, 1000);
  });

  // Handle component selection to maintain functionality
  editor.on('component:selected', function(component) {
    if (component.get('tagName') === 'table') {
      setTimeout(() => {
        const tableEl = component.getEl();
        if (tableEl && tableEl.classList.contains('custom-table')) {
          makeCellsEditable(tableEl);
          addFormulaButtons(tableEl);
        }
      }, 100);
    }
  });
}