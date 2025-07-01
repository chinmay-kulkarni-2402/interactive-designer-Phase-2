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

  // Store the target component where table should be added
  let targetComponent = null;
  let actualDropTarget = null; // New variable to store the actual drop target

  // Define a function to add table using popup model
  editor.on('block:drag:stop', (block, component) => {  
    if (block.get('tagName') === 'table') { 
        // Store both the component and the actual drop target
        targetComponent = component;
        actualDropTarget = component; // This is where the block was actually dropped
        console.log('Table dropped on component:', component);
        console.log('Component attributes:', component.getAttributes ? component.getAttributes() : component.get('attributes'));
        console.log('Component parent:', component.parent ? component.parent() : component.get('parent'));
        addTable();
    } 
  });

  editor.on('load',(block) =>{
    const iframe = editor.getContainer().querySelector('iframe'); 
    const contentWindow = iframe.contentWindow; 
    const iframeDocument = contentWindow.document; 
    const head = iframeDocument.head;  
    const style = document.createElement('style');
    style.type = 'text/css'; 
    style.innerHTML = `
    <style>
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
    </style>
    `; 
    head.appendChild(style);  
  });

  // Improved function to find the correct page based on drop target
  function findPageFromDropTarget(dropTarget) {
    if (!dropTarget) return null;
    
    console.log('Finding page for drop target:', dropTarget);
    
    // Traverse up the component tree to find the page container
    let current = dropTarget;
    while (current) {
      // Use proper GrapesJS methods
      const attrs = current.getAttributes ? current.getAttributes() : current.get('attributes') || {};
      console.log('Checking component:', current.get ? current.get('tagName') : 'unknown', attrs);
      
      // Check if this component is a page container
      if (attrs.class && (attrs.class.includes('page-container') || attrs.class.includes('page'))) {
        console.log('Found page container:', current, attrs);
        return current;
      }
      
      // Check for data-page attributes
      if (attrs['data-page-id'] || attrs['data-page-index']) {
        console.log('Found page by data attribute:', current, attrs);
        return current;
      }
      
      // Move to parent using proper GrapesJS method
      current = current.parent ? current.parent() : current.get('parent');
    }
    
    console.log('No page found in component tree');
    return null;
  }

  // Alternative method: Find page based on DOM position
  function findPageFromDOMPosition(component) {
    try {
      const iframe = editor.getContainer().querySelector('iframe');
      if (!iframe || !iframe.contentWindow) return null;
      
      const iframeDoc = iframe.contentWindow.document;
      
      // Get the component's DOM element
      const componentView = component.getView();
      const componentEl = componentView ? componentView.el : null;
      
      if (!componentEl) return null;
      
      // Find the closest page container in the DOM
      let element = componentEl;
      while (element && element !== iframeDoc.body) {
        if (element.classList.contains('page-container') || 
            element.classList.contains('page') ||
            element.hasAttribute('data-page-id') ||
            element.hasAttribute('data-page-index')) {
          
          // Find the corresponding GrapesJS component
          const pageId = element.id || 
                        element.getAttribute('data-page-id') || 
                        element.getAttribute('data-page-index');
          
          if (pageId) {
            const wrapper = editor.getWrapper();
            const pages = wrapper.find('.page-container, .page, [data-page-id], [data-page-index]');
            
            for (let page of pages) {
              const pageAttrs = page.getAttributes();
              if (pageAttrs.id === pageId || 
                  pageAttrs['data-page-id'] === pageId || 
                  pageAttrs['data-page-index'] === pageId) {
                console.log('Found page via DOM:', page, pageAttrs);
                return page;
              }
            }
          }
        }
        element = element.parentElement;
      }
      
      console.log('No page found via DOM traversal');
      return null;
    } catch (error) {
      console.error('Error in DOM-based page detection:', error);
      return null;
    }
  }

  // Improved function to get the target page
  function getTargetPage() {
    console.log('Getting target page...');
    
    // Method 1: Use actual drop target
    if (actualDropTarget) {
      console.log('Trying Method 1: Drop target approach');
      const pageFromDrop = findPageFromDropTarget(actualDropTarget);
      if (pageFromDrop) {
        console.log('Found page from drop target:', pageFromDrop.getAttributes());
        return pageFromDrop;
      }
      
      // Try DOM-based approach
      console.log('Trying Method 1b: DOM-based approach');
      const pageFromDOM = findPageFromDOMPosition(actualDropTarget);
      if (pageFromDOM) {
        console.log('Found page from DOM:', pageFromDOM.getAttributes());
        return pageFromDOM;
      }
    }
    
    // Method 2: Use currently selected component
    console.log('Trying Method 2: Selected component approach');
    const selected = editor.getSelected();
    if (selected) {
      const pageFromSelected = findPageFromDropTarget(selected);
      if (pageFromSelected) {
        console.log('Found page from selected:', pageFromSelected.getAttributes ? pageFromSelected.getAttributes() : pageFromSelected.get('attributes'));
        return pageFromSelected;
      }
    }
    
    // Method 3: Check visible pages in iframe
    console.log('Trying Method 3: Visible page detection');
    try {
      const iframe = editor.getContainer().querySelector('iframe');
      if (iframe && iframe.contentWindow) {
        const iframeDoc = iframe.contentWindow.document;
        const visiblePages = iframeDoc.querySelectorAll('.page-container:not([style*="display: none"]), .page:not([style*="display: none"])');
        
        console.log('Visible pages found:', visiblePages.length);
        
        if (visiblePages.length > 0) {
          // Get the last visible page (most likely the active one)
          const lastVisiblePage = visiblePages[visiblePages.length - 1];
          const pageId = lastVisiblePage.id || 
                        lastVisiblePage.getAttribute('data-page-id') || 
                        lastVisiblePage.getAttribute('data-page-index');
          
          if (pageId) {
            const wrapper = editor.getWrapper();
            const pages = wrapper.find('.page-container, .page, [data-page-id], [data-page-index]');
            
            for (let page of pages) {
              const pageAttrs = page.getAttributes ? page.getAttributes() : page.get('attributes') || {};
              if (pageAttrs.id === pageId || 
                  pageAttrs['data-page-id'] === pageId || 
                  pageAttrs['data-page-index'] === pageId) {
                console.log('Found visible page:', pageAttrs);
                return page;
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in visible page detection:', error);
    }
    
    // Method 4: Use global page state
    console.log('Trying Method 4: Global state approach');
    if (window.PageSetupManager && typeof window.pageSetupManager !== 'undefined') {
      try {
        const currentPageIndex = window.pageSetupManager.getCurrentPageIndex();
        const wrapper = editor.getWrapper();
        const pages = wrapper.find('.page-container, .page, [data-page-index]');
        
        const targetPage = pages.find(p => {
          const attrs = p.getAttributes ? p.getAttributes() : p.get('attributes') || {};
          return attrs['data-page-index'] === currentPageIndex.toString();
        });
        
        if (targetPage) {
          console.log('Found page from PageSetupManager:', targetPage.getAttributes ? targetPage.getAttributes() : targetPage.get('attributes'));
          return targetPage;
        }
      } catch (error) {
        console.error('Error with PageSetupManager:', error);
      }
    }
    
    if (typeof window.currentPageIndex !== 'undefined') {
      try {
        const wrapper = editor.getWrapper();
        const pages = wrapper.find('.page-container, .page, [data-page-index]');
        
        const targetPage = pages.find(p => {
          const attrs = p.getAttributes ? p.getAttributes() : p.get('attributes') || {};
          return attrs['data-page-index'] === window.currentPageIndex.toString();
        });
        
        if (targetPage) {
          console.log('Found page from global currentPageIndex:', targetPage.getAttributes ? targetPage.getAttributes() : targetPage.get('attributes'));
          return targetPage;
        }
      } catch (error) {
        console.error('Error with global currentPageIndex:', error);
      }
    }
    
    // Method 5: Fallback to first page
    console.log('Using fallback: first page');
    const wrapper = editor.getWrapper();
    const pages = wrapper.find('.page-container, .page');
    
    if (pages.length > 0) {
      console.log('Fallback to first page:', pages[0].getAttributes ? pages[0].getAttributes() : pages[0].get('attributes'));
      return pages[0];
    }
    
    console.log('No page found, using wrapper');
    return wrapper;
  }
  
  // Define a function to add table using popup model
  function addTable() {
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
    <input id="table-button-create-new" type="button" value="Create Table" data-component-id="c1006">
    </div>
    </div>
    `);
    editor.Modal.open(); 
    var el = document.getElementById("table-button-create-new");
    el.addEventListener("click", createTable, true); 
    const fileDownloadCheckbox = document.getElementById("tbl_file_download");
    const paginationCheckbox = document.getElementById("tbl_pagination");
    const searchCheckbox = document.getElementById("tbl_Search");
    const footerCheckbox = document.getElementById("tbl_footer");
    const captionCheckbox = document.getElementById("tbl_caption"); 
    fileDownloadCheckbox.addEventListener("change", function() {
      const checkbox = this.checked;
      fileDownloadCheckbox.value = checkbox.toString(); 
    });
    paginationCheckbox.addEventListener("change", function() {
      const checkbox = this.checked;
      paginationCheckbox.value = checkbox.toString(); 
    });
    searchCheckbox.addEventListener("change", function() {
      const checkbox = this.checked;
      searchCheckbox.value = checkbox.toString();
    });
    footerCheckbox.addEventListener("change", function() {
      const checkbox = this.checked; 
      footerCheckbox.value = checkbox.toString();
    }); 
    captionCheckbox.addEventListener("change", function() {
      const checkbox = this.checked; 
      captionCheckbox.value = checkbox.toString();
    }); 
   
    // Clean up any empty table components that might have been created during drag
    editor.DomComponents.getComponents().forEach(component => {
        if (component.get('tagName') === 'table' && !component.get('content')) { 
          component.remove();
        }
    });
    
    function createTable() {
      let uniqueID = Math.floor(100 + Math.random() * 900);
      let tblFileDownload = document.getElementById("tbl_file_download").value;
      let tblPagination = document.getElementById("tbl_pagination").value;
      let tblSearch = document.getElementById("tbl_Search").value;
      let tblFooter = document.getElementById("tbl_footer").value;
      let tblCaption = document.getElementById("tbl_caption").value;
      let tblHeader = 'true';
      let downloadBtn = '[]';

      if (tblFileDownload === 'true') {
          downloadBtn = `["copy", "csv", "excel", "pdf", "print", {
              text: "MS Word",
              action: function() {
                  const table = document.getElementById("table" + ${uniqueID});
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
                  downloadLink.click();
                  document.body.removeChild(downloadLink);
              }
          }]`;
      }

      const rows = parseInt(document.getElementById('nRows').value);
      const cols = parseInt(document.getElementById('nColumns').value);
      const colsScroll = parseInt(document.getElementById('nColumnsScroll').value);

      let table = document.createElement('table');
      table.setAttribute('width', '100%');
      table.setAttribute('class', 'table table-striped table-bordered');
      table.setAttribute('id', 'table' + uniqueID);

      if (tblCaption === 'true') {
          let caption = document.createElement('caption');
          caption.textContent = 'Caption Text';
          caption.style.captionSide = 'top';
          table.appendChild(caption);
      }

      let thead = document.createElement('thead');
      for (let j = 0; j < cols; j++) {
          let th = document.createElement('th');
          th.className = `col${uniqueID}${j}`;
          th.innerHTML = `<div>Text</div>`;
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
              td.className = `col${uniqueID}${j}`;
              td.innerHTML = `<div>Text</div>`;
              tr.appendChild(td);
          }
          tbody.appendChild(tr);
      }

      if (tblFooter === 'true') {
          let tr = document.createElement('tr');
          for (let j = 0; j < cols; j++) {
              let th = document.createElement('th');
              th.className = `col${uniqueID}${j}`;
              th.style.fontWeight = '800';
              th.innerHTML = `<div>Text</div>`;
              tr.appendChild(th);
          }
          tbody.appendChild(tr);
      }

      table.appendChild(tbody);

      let tableScript = `
          <script>
              $('#table${uniqueID}').DataTable({
                  dom: 'Bfrtip',
                  paging: ${tblPagination},
                  "info": ${tblPagination},
                  "lengthChange": true,
                  fixedHeader: true,
                  "scrollX": ${colsScroll < cols},
                  fixedColumns: true,
                  searching: ${tblSearch},
                  buttons: ${downloadBtn}
              });
          </script>`;

      // Get the target page using improved detection
      const targetPage = getTargetPage();
      
      console.log('Final target page selected:', targetPage ? (targetPage.getAttributes ? targetPage.getAttributes() : targetPage.get('attributes')) : 'null');
      
      // Determine the container within the page
      let tableContainer = targetPage;
      
      if (targetPage) {
        // Look for page-content within the page
        const pageContent = targetPage.find('.page-content');
        if (pageContent && pageContent.length > 0) {
          tableContainer = pageContent[0];
          console.log('Using page-content container:', tableContainer.getAttributes ? tableContainer.getAttributes() : tableContainer.get('attributes'));
        } else {
          console.log('Using page container directly:', tableContainer.getAttributes ? tableContainer.getAttributes() : tableContainer.get('attributes'));
        }
      }

      // Add the table to the determined container
      try {
        if (tableContainer) {
          // Add table directly to the target container
          const tableComponent = tableContainer.append(`<div>${table.outerHTML}</div>${tableScript}`);
          console.log('✅ Table successfully added to:', tableContainer.getAttributes ? tableContainer.getAttributes() : tableContainer.get('attributes'));
          
          // Trigger a re-render to ensure the table appears
          setTimeout(() => {
            const iframe = editor.getCanvas().getFrameEl();
            if (iframe && iframe.contentWindow) {
              iframe.contentWindow.location.reload();
            }
          }, 100);
          
        } else {
          // Last resort fallback
          console.log('⚠️ Using fallback: adding to wrapper');
          editor.DomComponents.addComponent(`<div>${table.outerHTML}</div>${tableScript}`);
        }
      } catch (error) {
        console.error('❌ Error adding table:', error);
        // Emergency fallback
        editor.DomComponents.addComponent(`<div>${table.outerHTML}</div>${tableScript}`);
      }

      // Reset target variables for next use
      targetComponent = null;
      actualDropTarget = null;
      
      editor.Modal.close();
    }
  }

  editor.on('component:drag:end', function (event) { 
    var selectedComponent = editor.getSelected();
    if (selectedComponent) {
      var childComponents = selectedComponent.components();
      if (childComponents.length > 0) {
        var firstChild = childComponents.models[0]; 
        var childTagName = firstChild.get('tagName');  
        if(childTagName === 'table'){  
          var htmlContent = editor.getHtml();  
          var css = editor.getCss();    
          updateComponents(editor.getHtml()); 
          var modifiedHtml = addInlineCssToCaptions(htmlContent); 
          setTimeout(() => {  
            editor.setComponents(modifiedHtml);  
            editor.setStyle(css);  
          }, 500); 
        } 
      }  
    } 
  });  

  function updateComponents(htmlContent) {
    editor.DomComponents.clear();  
    editor.setComponents(htmlContent); 
    editor.UndoManager.add(editor.getComponents());
  }

  editor.on('undo redo', function(eventType) {
    if (eventType === 'undo') {
      editor.UndoManager.undo();
      updateComponents(editor.getHtml());
    } else if (eventType === 'redo') {
      editor.UndoManager.redo();
      updateComponents(editor.getHtml());
    }  
  }); 

  function addInlineCssToCaptions(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var captionTags = doc.querySelectorAll('caption');
    captionTags.forEach(function(captionTag) { 
      captionTag.style.captionSide = 'top'; 
    }); 
    return doc.documentElement.outerHTML;
  } 
}