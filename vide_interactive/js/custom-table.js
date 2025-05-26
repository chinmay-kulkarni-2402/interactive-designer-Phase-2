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


// Define a function to add table using popup model
editor.on('block:drag:stop', (block) => {  
    if (block.get('tagName') === 'table') { 
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
})
 
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
     
    editor.DomComponents.getComponents().forEach(component => {
        // Check if the component is a table
        if (component.get('tagName') === 'table') { 
          // Reset the table to remove its content
          component.remove('content', '');
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
  
      // File download options
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
  
      // Create the table
      let table = document.createElement('table');
      table.setAttribute('width', '100%');
      table.setAttribute('class', 'table table-striped table-bordered');
      table.setAttribute('id', 'table' + uniqueID);
  
      // Add caption if needed
      if (tblCaption === 'true') {
          let caption = document.createElement('caption');
          caption.textContent = 'Caption Text';
          caption.style.captionSide = 'top';
          table.appendChild(caption);
      }
  
      // Create header
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
  
      // Create table body
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
  
      // Footer row if required
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
  
      // DataTable script for the generated table
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
  
      // ✅ Locate the active slide using `currentSlideIndex`
      const activeSlide = window.presentationState.slides[window.presentationState.currentSlideIndex - 1];
  
      if (activeSlide) {
          // Append the table and script to the active slide
          activeSlide.append(`<div>${table.outerHTML}</div>${tableScript}`);
          
      } else {
        editor.DomComponents.addComponent(`<div>${table.outerHTML}</div>${tableScript}`);
      }
  
      editor.Modal.close();
  }
  
}  
   
    // Event listener when a component drag ends
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
}