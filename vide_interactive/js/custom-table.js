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

  // Function to load formula parser script
  function loadFormulaParser() {
  if (formulaParserLoaded) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const iframe = editor.Canvas.getFrameEl(); // GrapesJS method
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

    const script = iframeDoc.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/hot-formula-parser@3.0.0/dist/formula-parser.umd.js";
    script.onload = () => {
      formulaParserLoaded = true;
      resolve();
    };
    script.onerror = reject;

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
      ${type === 'warning' ? 'background-color: #f39c12;' : 'background-color: #e74c3c;'}
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  // Function to get selected component or find droppable container
  function getTargetContainer() {
    const selected = editor.getSelected();
    
    if (selected) {
      // Check if selected component can accept children
      const droppable = selected.get('droppable');
      if (droppable !== false) {
        return selected;
      }
      
      // Try to find a droppable parent
      let parent = selected.parent();
      while (parent) {
        if (parent.get('droppable') !== false) {
          return parent;
        }
        parent = parent.parent();
      }
    }
    
    // If no suitable container found, use the main canvas
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
      }
      .formula-cell.editing {
        background-color: #f0f8ff !important;
      }
      .formula-cell[data-formula]::before {
        content: "f(x)";
        position: absolute;
        top: -2px;
        right: 2px;
        font-size: 10px;
        color: #007bff;
        font-weight: bold;
      }
    `; 
    head.appendChild(style);  
  });
 
  // Define a function to add table using popup model
  function addTable() {
    const targetContainer = getTargetContainer();
    
    if (!targetContainer) {
      showToast('No suitable container found for placing the table');
      return;
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
        <label for="tbl_formula">Enable Formula Support</label>
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

      let row = document.createElement('div');  
      row.style.padding = '10px 0px';  
      row.style.position = 'relative';  

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
      row.appendChild(table);   
      
      // Generate the DataTable script
      let tableScript = `
        <script class="table-script-${uniqueID}"> 
          (function() {
            // Wait for jQuery and DataTables to be available
            function initTable() {
              if (typeof jQuery === 'undefined' || typeof jQuery.fn.DataTable === 'undefined') {
                setTimeout(initTable, 100);
                return;
              }
              
              jQuery('#table${uniqueID}').DataTable({
                dom: 'Bfrtip',
                paging: ${tblPagination},
                "info": ${tblPagination}, 
                "lengthChange": true,
                fixedHeader: true, 
                "scrollX": ${scrollXCol}, 
                fixedColumns: true, 
                searching: ${tblSearch},  
                buttons: ${downloadBtn},
                drawCallback: function() {
                  setupFormulaHandlers('${uniqueID}');
                }
              });
              
              // Initial setup of formula handlers
              setupFormulaHandlers('${uniqueID}');
            }
            
            function setupFormulaHandlers(tableId) {
              const table = document.getElementById('table' + tableId);
              if (!table || !table.hasAttribute('data-formula-enabled')) return;
              
              const cells = table.querySelectorAll('.formula-cell');
              cells.forEach(cell => {
                cell.removeEventListener('focus', handleCellFocus);
                cell.removeEventListener('blur', handleCellBlur);
                cell.addEventListener('focus', handleCellFocus);
                cell.addEventListener('blur', handleCellBlur);
              });
            }
            
            function handleCellFocus(event) {
              const cell = event.target;
              cell.classList.add('editing');
              
              // If cell has a formula, show the formula instead of the result
              if (cell.hasAttribute('data-formula')) {
                cell.textContent = cell.getAttribute('data-formula');
              }
            }
            
            function handleCellBlur(event) {
              const cell = event.target;
              cell.classList.remove('editing');
              
              const content = cell.textContent.trim();
              
              if (content.startsWith('=') && typeof FormulaParser !== 'undefined') {
                try {
                  // Store the formula
                  cell.setAttribute('data-formula', content);
                  
                  // Parse and evaluate the formula
                  const parser = new FormulaParser();
                  const result = parser.parse(content.substring(1)); // Remove the '=' sign
                  
                  if (result.error) {
                    cell.textContent = '#ERROR';
                    cell.style.color = 'red';
                  } else {
                    cell.textContent = result.result;
                    cell.style.color = '';
                  }
                } catch (error) {
                  cell.textContent = '#ERROR';
                  cell.style.color = 'red';
                }
              } else if (content.startsWith('=')) {
                // Formula parser not available
                cell.textContent = '#PARSER_ERROR';
                cell.style.color = 'red';
              } else {
                // Regular text, remove formula data
                cell.removeAttribute('data-formula');
                cell.style.color = '';
              }
            }
            
            // Expose functions globally for access
            window.setupFormulaHandlers = setupFormulaHandlers;
            window.handleCellFocus = handleCellFocus;
            window.handleCellBlur = handleCellBlur;
            
            initTable();
          })();
        </script>`;  
      
      // Add the table to the selected container
      const tableComponent = container.append(row.outerHTML)[0];
      
      // Add the script component
      container.append(tableScript);
      
      editor.Modal.close();
      row.remove();
      
      showToast(`Table created successfully in ${container.get('tagName') || 'container'}!`, 'success');
    };
  }  
   
  // Event listener when a component drag ends
  editor.on('component:drag:end', function (event) { 
    var selectedComponent = editor.getSelected();
    if (selectedComponent) {
      var childComponents = selectedComponent.components();
      if (childComponents.length > 0) {
        var firstChild = childComponents.models[0]; 
        var childTagName = firstChild.get('tagName');  
        if (childTagName === 'table') {  
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
}