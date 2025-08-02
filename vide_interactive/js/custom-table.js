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

      /* Page-aware table styles */
      .page-container .dataTables_wrapper {
        max-width: 100%;
        overflow: hidden;
      }
      
      .main-content-area .dataTables_wrapper {
        width: 100% !important;
        box-sizing: border-box;
      }
      
      /* Print styles for tables in pages */
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
      }
    `; 
    head.appendChild(style);  
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
      <div style="background: #e3f2fd; padding: 10px; border-radius: 4px; margin-bottom: 15px; font-size: 12px; color: #1976d2;">
        <strong>Target:</strong> Table will be added to ${containerInfo}
      </div>
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
      
      // Generate the DataTable script with page-aware functionality
      let tableScript = `
        <script class="table-script-${uniqueID}"> 
          (function() {
            // Wait for jQuery and DataTables to be available
            function initTable() {
              if (typeof jQuery === 'undefined' || typeof jQuery.fn.DataTable === 'undefined') {
                setTimeout(initTable, 100);
                return;
              }
              
              // Check if we're in a page system
              const tableElement = document.getElementById('table${uniqueID}');
              const isInPageSystem = tableElement && tableElement.closest('.page-container');
              
              // Configure DataTable options based on context
              const dtOptions = {
                dom: 'Bfrtip',
                paging: ${tblPagination},
                "info": ${tblPagination}, 
                "lengthChange": true,
                fixedHeader: false, // Disable for page system compatibility
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
      
      try {
        // Add the table to the selected container
        const tableComponent = container.append(tableWrapper.outerHTML)[0];
        
        // Set table wrapper properties for better integration
        if (tableComponent) {
          tableComponent.set({
            draggable: true,
            droppable: false,
            editable: false,
            selectable: true,
            removable: true,
            copyable: true,
            'custom-name': `Table ${uniqueID}`,
            tagName: 'div'
          });
          
          // Add responsive styling
          tableComponent.addStyle({
            'max-width': '100%',
            'overflow': 'hidden',
            'box-sizing': 'border-box',
            'margin': '10px 0'
          });
        }
        
        // Add the script component
        container.append(tableScript);
        
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
        
        showToast(`Table created successfully in ${containerType}!`, 'success');
        
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
  // Use more common GrapesJS events instead of custom page events
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

  // Enhanced print handling for page system
  if (typeof window !== 'undefined') {
    // Store original print function
    const originalPrint = window.print;
    
    window.print = function() {
      try {
        // Before printing, ensure all tables are properly formatted
        const tables = document.querySelectorAll('table[id^="table"]');
        tables.forEach(table => {
          try {
            // Ensure table attributes for print
            table.setAttribute("border", "1");
            table.style.borderCollapse = "collapse";
            table.style.width = "100%";
            table.style.fontFamily = "Arial, sans-serif";
            
            // Hide DataTable controls for print
            const wrapper = table.closest('.dataTables_wrapper');
            if (wrapper) {
              const controls = wrapper.querySelectorAll('.dataTables_length, .dataTables_filter, .dataTables_info, .dataTables_paginate, .dt-buttons');
              controls.forEach(control => {
                control.style.display = 'none';
              });
            }
          } catch (error) {
            console.warn('Error preparing table for print:', error);
          }
        });
        
        // Call original print function
        originalPrint.call(this);
        
        // Restore controls after print (with delay to ensure print dialog has appeared)
        setTimeout(() => {
          try {
            const tables = document.querySelectorAll('table[id^="table"]');
            tables.forEach(table => {
              try {
                const wrapper = table.closest('.dataTables_wrapper');
                if (wrapper) {
                  const controls = wrapper.querySelectorAll('.dataTables_length, .dataTables_filter, .dataTables_info, .dataTables_paginate, .dt-buttons');
                  controls.forEach(control => {
                    control.style.display = '';
                  });
                }
              } catch (error) {
                console.warn('Error restoring table controls after print:', error);
              }
            });
          } catch (error) {
            console.warn('Error in print restoration:', error);
          }
        }, 1000);
      } catch (error) {
        console.warn('Error in custom print function, using original:', error);
        // Fallback to original print if there's an error
        originalPrint.call(this);
      }
    };
  }

  // Initialize page table instances storage
  if (typeof window !== 'undefined' && !window.pageTableInstances) {
    window.pageTableInstances = {};
  }

  console.log('Custom Table function initialized with page system integration');
}