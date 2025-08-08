function customJsonTableWithFilter(editor) {
  const props_test_table = (i) => i;  
  const id_Trait = {
    name: "id",
    label: "Id",
  };

  const title_Trait = {
    name: "title",
    label: "Title",
  }; 
 
  const test_chart_Props = {
    name: "Table",   
    jsonpath:"",  
    pageLength: 5, 
    FileDownload:`["copy", "csv", "excel", "pdf", "print","msword"]`,
  };

  const name_Trait = {
    changeProp: 1,
    type: "text",
    name: "name",
    label: "name",
    placeholder: "Chart Name",
  };  

  const Footer_Trait = ["Footer"].map((name) => ({
    changeProp: 1,
    type: "select", 
      options: [
          {value: true, label: 'Yes'},
          {value: false, label: 'No'}, 
        ],
    name,
  }));
    
  const File_Download_Trait = ["FileDownload"].map((name) => ({
      changeProp: 1,
      type: "text", 
      label:"File Download",
      default:`["copy", "csv", "excel", "pdf", "print"]`,
      name,
  }));

  const Pagination_Trait = ["Pagination"].map((name) => ({
      changeProp: 1,
      type: "select", 
      label:"Pagination",
      options: [
          {value: true, label: 'Yes'},
          {value: false, label: 'No'}, 
        ],
      name,
  }));

  const PageLength_Trait = ["pageLength"].map((name) => ({
    changeProp: 1,
    type: "number",  
    label:"Page Length",
    name,
    default:5,
    placeholder:"Enter page length"
  })); 

  const Search_Trait = ["Search"].map((name) => ({
      changeProp: 1,
      type: "select", 
      options: [
          {value: true, label: 'Yes'},
          {value: false, label: 'No'}, 
        ],
      name,
  }));
  
  const Caption_Trait = ["Caption"].map((name) => ({
    changeProp: 1,
    type: "select", 
    options: [
        {value: true, label: 'Yes'},
        {value: false, label: 'No'}, 
      ],
    name,
  }));

  const CaptionAlign_Trait = ["CaptionAlign"].map((name) => ({
    changeProp: 1,
    type: "select", 
    label:"Caption Align",
    options: [
        {value: 'left', label: 'Left'},
        {value: 'right', label: 'Right'}, 
        {value: 'center', label: 'Center'}, 
      ],
    name,
  }));

  const json_path_Trait = ["jsonpath"].map((name) => ({
      changeProp: 1,
      type: "text",
      label:"Json Path",
      placeholder: "Enter Json Path",
      name, 
    }));

  const json_button_sugesstionTrait = ["jsonButtonSugesstionTrait"].map((name) => ({
    changeProp: 1,
    type: "button",
    label:"Json Suggestion",
    placeholder: "Json Suggestion", 
    name,
    id: "json-suggestion-btn",  
    text: "Suggestion", 
    class:"json-suggestion-btn",  
  }));
  
  // New trait for header preview
  const header_preview_Trait = ["headerPreviewTrait"].map((name) => ({
    changeProp: 1,
    type: "button",
    label:"Header Preview",
    placeholder: "Header Preview", 
    name,
    id: "header-preview-btn",  
    text: "Preview Headers", 
    class:"header-preview-btn",  
  }));
  
  const all_Traits = [
    name_Trait, 
    ...Footer_Trait,
    ...File_Download_Trait,
    ...Pagination_Trait,
    ...PageLength_Trait,
    ...Search_Trait,
    ...Caption_Trait,
    ...CaptionAlign_Trait,
    ...json_path_Trait, 
    ...json_button_sugesstionTrait,
    ...header_preview_Trait
  ];
   
  let jsonData = [];  
  let common_json = JSON.parse(localStorage.getItem("common_json"));  
  if(common_json !==null){
    jsonData.length= 0;  
    jsonData.push(common_json); 
    jsonData = JSON.stringify(jsonData); 
  }

  // Get custom language from main file
  let custom_language = localStorage.getItem('language');
  if (custom_language === null) {
      custom_language = 'english';
  }

  // Copy required functions from main file
  function extractMetaDataKeys(obj, prefix = '') {
      let keys = [];
      for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
              let newKey;
              if (Array.isArray(obj)) {
                  newKey = `${prefix}[${key}]`;
              } else {
                  newKey = prefix ? `${prefix}.${key}` : key;
              }
              keys.push(newKey);
              if (typeof obj[key] === 'object' && obj[key] !== null) {
                  keys = keys.concat(extractMetaDataKeys(obj[key], newKey));
              }
          }
      }
      return keys;
  }

  function filterSuggestions(query) {
      const suggestionResults = document.querySelector('.suggestion-results');
      const metaDataKeys = Array.from(suggestionResults.children);
      metaDataKeys.forEach(key => {
          if (key.textContent.toLowerCase().includes(query.toLowerCase())) {
              key.style.display = "block";
          } else {
              key.style.display = "none";
          }
      });
  }

  function openSuggestionJsonModalChartTable() {
      const commonJson = JSON.parse(localStorage.getItem('common_json'));
      if (!commonJson) {
          alert('No JSON data found. Please upload JSON file first.');
          return;
      }
      
      const customLanguage = localStorage.getItem('language') || 'english';
      const metaDataKeys = extractMetaDataKeys(commonJson[customLanguage]);
      
      let modalContent = `
      <div class="new-table-form">
        <div style="padding-bottom:10px">
          <input type="text" id="searchInput" placeholder="Search json">
        </div>
        <div class="suggestion-results" style="height: 200px; overflow: hidden; overflow-y: scroll;">
    `;

      metaDataKeys.forEach(key => {
          modalContent += `<div class="suggestion" data-value="${key}">${key}</div>`;
      });
      modalContent += `
        </div>
      </div>
    `;

      editor.Modal.setTitle('Json Suggestion');
      editor.Modal.setContent(modalContent);
      editor.Modal.open();

      document.getElementById("searchInput").addEventListener("input", function () {
          filterSuggestions(this.value);
      });

      const suggestionItems = document.querySelectorAll('.suggestion');
      suggestionItems.forEach(item => {
          item.addEventListener('click', function () {
              const selectedValue = this.getAttribute('data-value'); 
              const inputField = document.querySelector('.i_designer-trt-trait__wrp-jsonpath input');
              if (inputField) {
                  inputField.value = selectedValue;
                  var event = new Event('change', {
                      bubbles: true,
                      cancelable: true
                  });
                  inputField.dispatchEvent(event);
              }
              editor.Modal.close();
          });
      });
  }

  // New function for header preview modal
  function openHeaderPreviewModal() {
      const commonJson = JSON.parse(localStorage.getItem('common_json'));
      if (!commonJson) {
          alert('No JSON data found. Please upload JSON file first.');
          return;
      }

      const customLanguage = localStorage.getItem('language') || 'english';
      const selectedComponent = editor.getSelected();
      const jsonPath = selectedComponent.get('jsonpath');
      
      if (!jsonPath) {
          alert('Please set JSON path first');
          return;
      }

      let tableData;
      try {
          const str = commonJson[customLanguage][jsonPath];
          tableData = eval(str);
      } catch (error) {
          alert('Invalid JSON path or data structure');
          return;
      }

      if (!tableData || !tableData.heading) {
          alert('No table headers found in the specified JSON path');
          return;
      }

      const headerKeys = Object.keys(tableData.heading);
      const globalFilters = window.tableFilters || {};
      
      // CSS styles for the modal
      const modalStyles = `
        <style>
          .header-preview-modal {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 100%;
            width: 90vw;
            max-height: 80vh;
            overflow-y: auto;
          }
          .header-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header-row {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .header-cell {
            padding: 15px 10px;
            text-align: left;
            font-weight: 600;
            position: relative;
            border-right: 1px solid rgba(255,255,255,0.2);
          }
          .header-cell:last-child {
            border-right: none;
          }
          .filter-icon {
            position: absolute;
            top: 50%;
            right: 8px;
            transform: translateY(-50%);
            cursor: pointer;
            width: 20px;
            height: 20px;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            transition: all 0.3s ease;
          }
          .filter-icon:hover {
            background: rgba(255,255,255,0.4);
            transform: translateY(-50%) scale(1.1);
          }
          .filter-icon.active {
            background: #ff6b6b;
            color: white;
          }
          .preview-actions {
            margin: 20px 0;
            text-align: center;
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-wrap: wrap;
          }
          .preview-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            cursor: pointer;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
          }
          .preview-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
          }
          .clear-btn {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
            box-shadow: 0 4px 15px rgba(255, 107, 107, 0.3);
          }
          .clear-btn:hover {
            box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
          }
          .filter-status {
            margin: 15px 0;
            padding: 10px;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #667eea;
          }
          .active-filters {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 10px;
          }
          .filter-tag {
            background: #667eea;
            color: white;
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 5px;
          }
          .filter-tag .remove {
            cursor: pointer;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
          }
          .filter-popup {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            padding: 25px;
            z-index: 10001;
            min-width: 300px;
            max-width: 90vw;
          }
          .filter-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 10000;
          }
          .filter-popup h3 {
            margin: 0 0 20px 0;
            color: #333;
            font-size: 18px;
          }
          .filter-input {
            width: 100%;
            padding: 12px;
            border: 2px solid #e1e5e9;
            border-radius: 8px;
            font-size: 14px;
            margin-bottom: 15px;
            transition: border-color 0.3s ease;
            box-sizing: border-box;
          }
          .filter-input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          }
          .filter-actions {
            display: flex;
            gap: 10px;
            justify-content: flex-end;
          }
          .filter-actions button {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
          }
          .apply-filter {
            background: #667eea;
            color: white;
          }
          .apply-filter:hover {
            background: #5a6fd8;
          }
          .cancel-filter {
            background: #6c757d;
            color: white;
          }
          .cancel-filter:hover {
            background: #5a6268;
          }
          @media (max-width: 768px) {
            .header-preview-modal {
              width: 95vw;
              padding: 10px;
            }
            .header-table {
              font-size: 12px;
            }
            .header-cell {
              padding: 10px 5px;
            }
            .filter-icon {
              width: 16px;
              height: 16px;
              font-size: 10px;
            }
            .preview-actions {
              flex-direction: column;
              align-items: center;
            }
            .preview-btn {
              width: 100%;
              max-width: 200px;
            }
            .filter-popup {
              width: 90vw;
              min-width: auto;
            }
          }
        </style>
      `;

      let modalContent = modalStyles + `
        <div class="header-preview-modal">
          <div class="filter-status">
            <strong>Header Preview & Filter Setup</strong>
            <div class="active-filters" id="activeFiltersDisplay"></div>
          </div>
          <table class="header-table">
            <thead>
              <tr class="header-row">
      `;

      headerKeys.forEach((key, index) => {
          const hasFilter = globalFilters[key] && globalFilters[key].trim() !== '';
          modalContent += `
            <th class="header-cell">
              ${tableData.heading[key]}
              <span class="filter-icon ${hasFilter ? 'active' : ''}" 
                    data-column="${key}" 
                    data-index="${index}">
                🔍
              </span>
            </th>
          `;
      });

      modalContent += `
              </tr>
            </thead>
          </table>
          <div class="preview-actions">
            <button class="preview-btn" id="previewFilteredData">Preview Filtered Data</button>
            <button class="preview-btn clear-btn" id="clearAllFilters">Clear All Filters</button>
          </div>
        </div>
      `;

      editor.Modal.setTitle('Table Headers & Filters');
      editor.Modal.setContent(modalContent);
      editor.Modal.open();

      // Update active filters display
      updateActiveFiltersDisplay();

      // Add filter icon click handlers
      document.querySelectorAll('.filter-icon').forEach(icon => {
          icon.addEventListener('click', function(e) {
              e.stopPropagation();
              const column = this.getAttribute('data-column');
              const currentFilter = globalFilters[column] || '';
              openFilterPopup(column, tableData.heading[column], currentFilter);
          });
      });

      // Preview filtered data button
      document.getElementById('previewFilteredData').addEventListener('click', function() {
          previewFilteredData(tableData, globalFilters);
      });

      // Clear all filters button
      document.getElementById('clearAllFilters').addEventListener('click', function() {
          window.tableFilters = {};
          updateActiveFiltersDisplay();
          // Update filter icons
          document.querySelectorAll('.filter-icon').forEach(icon => {
              icon.classList.remove('active');
          });
      });
  }

  function updateActiveFiltersDisplay() {
      const activeFiltersDiv = document.getElementById('activeFiltersDisplay');
      if (!activeFiltersDiv) return;

      const globalFilters = window.tableFilters || {};
      const activeFilters = Object.keys(globalFilters).filter(key => 
          globalFilters[key] && globalFilters[key].trim() !== ''
      );

      if (activeFilters.length === 0) {
          activeFiltersDiv.innerHTML = '<em style="color: #6c757d;">No active filters</em>';
          return;
      }

      let filtersHtml = '<div style="margin-top: 8px;"><strong>Active Filters:</strong></div>';
      activeFilters.forEach(key => {
          filtersHtml += `
            <span class="filter-tag">
              ${key}: ${globalFilters[key]}
              <span class="remove" onclick="removeFilter('${key}')">×</span>
            </span>
          `;
      });
      activeFiltersDiv.innerHTML = filtersHtml;
  }

  function openFilterPopup(column, headerName, currentValue) {
      // Remove existing popup if any
      const existingPopup = document.querySelector('.filter-popup');
      const existingOverlay = document.querySelector('.filter-overlay');
      if (existingPopup) existingPopup.remove();
      if (existingOverlay) existingOverlay.remove();

      // Create overlay
      const overlay = document.createElement('div');
      overlay.className = 'filter-overlay';
      
      // Create popup
      const popup = document.createElement('div');
      popup.className = 'filter-popup';
      popup.innerHTML = `
        <h3>Filter: ${headerName}</h3>
        <input type="text" class="filter-input" id="filterValue" 
               placeholder="Enter filter value..." value="${currentValue}">
        <div class="filter-actions">
          <button class="cancel-filter" id="cancelFilter">Cancel</button>
          <button class="apply-filter" id="applyFilter">Apply Filter</button>
        </div>
      `;

      document.body.appendChild(overlay);
      document.body.appendChild(popup);

      // Focus on input
      document.getElementById('filterValue').focus();

      // Event handlers
      document.getElementById('cancelFilter').addEventListener('click', closeFilterPopup);
      overlay.addEventListener('click', closeFilterPopup);
      
      document.getElementById('applyFilter').addEventListener('click', function() {
          const filterValue = document.getElementById('filterValue').value.trim();
          applyFilter(column, filterValue);
          closeFilterPopup();
      });

      // Enter key to apply
      document.getElementById('filterValue').addEventListener('keypress', function(e) {
          if (e.key === 'Enter') {
              const filterValue = this.value.trim();
              applyFilter(column, filterValue);
              closeFilterPopup();
          }
      });
  }

  function closeFilterPopup() {
      const popup = document.querySelector('.filter-popup');
      const overlay = document.querySelector('.filter-overlay');
      if (popup) popup.remove();
      if (overlay) overlay.remove();
  }

  function applyFilter(column, value) {
      if (!window.tableFilters) {
          window.tableFilters = {};
      }
      
      if (value === '') {
          delete window.tableFilters[column];
      } else {
          window.tableFilters[column] = value;
      }

      // Update the filter icon
      const filterIcon = document.querySelector(`[data-column="${column}"]`);
      if (filterIcon) {
          if (value) {
              filterIcon.classList.add('active');
          } else {
              filterIcon.classList.remove('active');
          }
      }

      updateActiveFiltersDisplay();
  }

  function previewFilteredData(tableData, filters) {
      if (!tableData || !tableData.data) {
          alert('No table data available');
          return;
      }

      let filteredData = tableData.data;
      
      // Apply filters
      Object.keys(filters).forEach(column => {
          const filterValue = filters[column];
          if (filterValue && filterValue.trim() !== '') {
              filteredData = filteredData.filter(row => {
                  const cellValue = String(row[column] || '').toLowerCase();
                  return cellValue.includes(filterValue.toLowerCase());
              });
          }
      });

      // Create preview modal
      const headerKeys = Object.keys(tableData.heading);
      
      let previewContent = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
          <div style="margin-bottom: 15px; padding: 10px; background: #e3f2fd; border-radius: 8px;">
            <strong>Filtered Results: ${filteredData.length} of ${tableData.data.length} rows</strong>
          </div>
          <div style="max-height: 60vh; overflow-y: auto; border-radius: 8px; border: 1px solid #ddd;">
            <table style="width: 100%; border-collapse: collapse; background: white;">
              <thead>
                <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
      `;

      headerKeys.forEach(key => {
          previewContent += `<th style="padding: 12px 8px; text-align: left; font-weight: 600; border-right: 1px solid rgba(255,255,255,0.2);">${tableData.heading[key]}</th>`;
      });

      previewContent += `
                </tr>
              </thead>
              <tbody>
      `;

      filteredData.slice(0, 50).forEach((row, index) => { // Limit to first 50 rows for performance
          previewContent += `<tr style="border-bottom: 1px solid #eee; ${index % 2 === 0 ? 'background: #f8f9fa;' : ''}">`;
          headerKeys.forEach(key => {
              previewContent += `<td style="padding: 10px 8px; border-right: 1px solid #eee;">${row[key] || ''}</td>`;
          });
          previewContent += '</tr>';
      });

      if (filteredData.length > 50) {
          previewContent += `
            <tr>
              <td colspan="${headerKeys.length}" style="padding: 15px; text-align: center; background: #fff3cd; color: #856404;">
                Showing first 50 rows of ${filteredData.length} filtered results
              </td>
            </tr>
          `;
      }

      previewContent += `
              </tbody>
            </table>
          </div>
          <div style="margin-top: 20px; text-align: center;">
            <button id="applyToTable" class="preview-btn">Apply Filters to Table</button>
          </div>
        </div>
      `;

      editor.Modal.setTitle('Filtered Data Preview');
      editor.Modal.setContent(previewContent);

      // Apply to table button
      document.getElementById('applyToTable').addEventListener('click', function() {
          applyFiltersToActualTable();
          editor.Modal.close();
      });
  }

  function applyFiltersToActualTable() {
      // Trigger table refresh with filters
      const selectedComponent = editor.getSelected();
      if (selectedComponent && selectedComponent.attributes.type === 'custom_table') {
          selectedComponent.tableInitialized = false;
          selectedComponent.trigger('change:script');
      }
  }

  // Global function to remove individual filters
  window.removeFilter = function(column) {
      if (window.tableFilters) {
          delete window.tableFilters[column];
          updateActiveFiltersDisplay();
          
          // Update filter icon
          const filterIcon = document.querySelector(`[data-column="${column}"]`);
          if (filterIcon) {
              filterIcon.classList.remove('active');
          }
      }
  };

  editor.Components.addType("custom_table", {
      model: {
        defaults: props_test_table({
          ...test_chart_Props,
          tagName: "div",
          resizable: 1,
          droppable: 0,
          attributes: { 'data-i_designer-type': 'custom_table' },
          custom_line_chartsrc: "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js",
          stylable: 1,
          traits: [id_Trait, title_Trait, ...all_Traits],
          style: {
            padding: "10px 0px",
          },
          script: function () {  
            if (this.tableInitialized) return;
              this.tableInitialized = true;
            const init1 = () => {
              const ctx = this.id;
              let footer = "{[ Footer ]}";
              let downloadFile = JSON.parse('{[ FileDownload ]}');
              let pagination = "{[ Pagination ]}";
              let pagelengthF = "{[ pageLength ]}";
              let search = "{[ Search ]}";
              let caption = "{[ Caption ]}";
              let captionAlign = "{[ CaptionAlign ]}";
              let JsonPath1 = "{[ jsonpath ]}";
              let custom_language = localStorage.getItem('language');
              if (custom_language == null) {
                custom_language = 'english';
              }
              let project_type = 'developmentJsonType';
              const jsonDataN = JSON.parse(localStorage.getItem("common_json"));
              const jsonDataa = [];
              jsonDataa.push(jsonDataN);
              let str = jsonDataa[0][custom_language][JsonPath1];
              if (typeof project_type2 !== 'undefined' && project_type2 === 'downloadedJsonType') {
                project_type = 'downloadedJsonType';
              }
              if (project_type === 'downloadedJsonType') {
                str = jsonData1[0][custom_language][JsonPath1];
              }
              let tableData = [];
              if (str !== undefined) {
                tableData = eval(str);
                
                // Apply filters if they exist
                const globalFilters = window.tableFilters || {};
                let filteredTableData = {...tableData};
                
                if (Object.keys(globalFilters).length > 0) {
                  filteredTableData.data = tableData.data.filter(row => {
                    return Object.keys(globalFilters).every(column => {
                      const filterValue = globalFilters[column];
                      if (!filterValue || filterValue.trim() === '') return true;
                      const cellValue = String(row[column] || '').toLowerCase();
                      return cellValue.includes(filterValue.toLowerCase());
                    });
                  });
                }
                
                setTimeout(() => {
                  const length = Object.keys(filteredTableData.heading).length;
                  if (length === 0) {
                    alert("Table json format not proper");
                    return false;
                  } else {
                    let uniqueID = ctx;
                    const divElement = document.getElementById(ctx);
                    let downloadBtn = downloadFile;
                    for (var i = 0; i < downloadBtn.length; i++) {
                      if (downloadBtn[i] === "msword") {
                        downloadBtn.splice(i, 1);
                        downloadBtn.push({
                          text: 'MS Word',
                          action: function () {
                            const table = document.getElementById('table' + uniqueID);
                            table.setAttribute('border', '1');
                            table.style.borderCollapse = 'collapse';
                            table.style.width = '100%';
                            table.style.fontFamily = 'Arial, sans-serif';
                            const html = table.outerHTML;
                            const url = 'data:application/msword,' + encodeURIComponent(html);
                            const downloadLink = document.createElement("a");
                            downloadLink.href = url;
                            downloadLink.download = 'data.doc';
                            downloadLink.style.display = 'none';
                            document.body.appendChild(downloadLink);
                            window.location.href = downloadLink.href;
                            document.body.removeChild(downloadLink);
                          }
                        });
                        break;
                      }
                      if (downloadBtn[i] === "print") {
                        downloadBtn.splice(i, 1);
                        downloadBtn.push({
                          text: 'Print',
                          action: function () {
                            window.print();
                          }
                        });
                        break;
                      }
                    }
                    const rows = Object.keys(filteredTableData.heading).length;
                    let table = document.createElement('table');
                    table.setAttribute('width', '100%');
                    table.setAttribute('class', 'table table-bordered');
                    table.setAttribute('id', 'table' + uniqueID); 
                    if (divElement.firstChild) {
                      divElement.removeChild(divElement.firstChild);
                    }
    
                    if (caption === "true") {
                      if (filteredTableData.caption === undefined || filteredTableData.caption === null) {
                        alert("Caption data not found in json file");
                        return false;
                      }
                      if (captionAlign === null || captionAlign === undefined || captionAlign === '') {
                        captionAlign = 'left';
                      }
                      let caption1a = document.createElement('caption');
                      caption1a.textContent = filteredTableData.caption;
                      caption1a.style.captionSide = 'top';
                      caption1a.style.textAlign = captionAlign;
                      table.appendChild(caption1a);
                    }
                    let thead = document.createElement('thead');
                    let thtr = document.createElement('tr');
                    const objectName = Object.keys(filteredTableData.heading);
                    for (let j = 0; j < rows; j++) {
                      let th = document.createElement('th');
                      th.setAttribute("class", "col" + uniqueID + j);
                      let div1 = document.createElement('div');
                      div1.textContent = eval('filteredTableData.heading.' + objectName[j]);
                      th.appendChild(div1);
                      thtr.appendChild(th);
                    }
                    thead.appendChild(thtr);
                    table.appendChild(thead);
                    
                    let tbody = document.createElement('tbody');
                    for (let i = 0; i < filteredTableData.data.length; i++) {
                      let tr = document.createElement('tr');
                      for (let j = 0; j < rows; j++) {
                        let td = document.createElement('td');
                        td.setAttribute("class", "col" + uniqueID + j);
                        let div = document.createElement('div');
                        const textValue = eval('filteredTableData.data[' + i + '].' + objectName[j]);
                        div.textContent = textValue;
                        
                        // Make cells editable and update DOM immediately
                        div.contentEditable = true;
                        div.addEventListener('input', function() {
                          // Update the underlying data
                          const newValue = this.textContent;
                          eval('filteredTableData.data[' + i + '].' + objectName[j] + ' = "' + newValue + '"');
                          
                          // Force DOM update for print/PDF
                          this.setAttribute('data-original-text', newValue);
                        });
                        
                        div.addEventListener('blur', function() {
                          // Ensure data is saved
                          const newValue = this.textContent;
                          eval('filteredTableData.data[' + i + '].' + objectName[j] + ' = "' + newValue + '"');
                        });
                        
                        td.appendChild(div);
                        tr.appendChild(td);
                      }
                      tbody.appendChild(tr);
                    }
    
                    table.appendChild(tbody);
                    let tfoot = document.createElement('tfoot');
                    let tfoottr = document.createElement('tr');
                    if (footer === 'true') {
                      if (filteredTableData.footer === undefined || filteredTableData.footer === null) {
                        alert("Footer data not found in json file");
                        return false;
                      }
                      const objectName2 = Object.keys(filteredTableData.footer);
                      for (let k = 0; k < rows; k++) {
                        let th = document.createElement('th');
                        th.setAttribute("class", "col" + uniqueID + k);
                        let div1 = document.createElement('div');
                        div1.textContent = eval('filteredTableData.footer.' + objectName2[k]);
                        
                        // Make footer editable
                        div1.contentEditable = true;
                        div1.addEventListener('input', function() {
                          const newValue = this.textContent;
                          eval('filteredTableData.footer.' + objectName2[k] + ' = "' + newValue + '"');
                          this.setAttribute('data-original-text', newValue);
                        });
                        
                        div1.addEventListener('blur', function() {
                          const newValue = this.textContent;
                          eval('filteredTableData.footer.' + objectName2[k] + ' = "' + newValue + '"');
                        });
                        
                        th.appendChild(div1);
                        tfoottr.appendChild(th);
                      }
                      tfoot.appendChild(tfoottr);
                      table.appendChild(tfoot);
                    }
                    
                    // Double click to focus editing
                    table.addEventListener('dblclick', function(e) {
                      e.preventDefault();
                      const target = e.target.closest('div[contenteditable]');
                      if (target) {
                        target.focus();
                        // Select all text for easy editing
                        const range = document.createRange();
                        range.selectNodeContents(target);
                        const selection = window.getSelection();
                        selection.removeAllRanges();
                        selection.addRange(range);
                      }
                    });
                    
                    divElement.appendChild(table);
                    if (search === '' || search === undefined || search === null) {
                      search = false;
                    }
                    if (pagination === '' || pagination === undefined || pagination === null) {
                      pagination = false;
                    }
                    var scrollXValue = false;
                    const newValue = window.innerWidth <= 768;
                    if (newValue) {
                      scrollXValue = true;
                    } else {
                      scrollXValue = false;
                    }
                    pagelengthF = pagelengthF * 1; 
                    if ($.fn.DataTable.isDataTable('#table' + uniqueID)) {
                      $('#table' + uniqueID).DataTable().destroy();
                    }
                    $(document).ready(function () {
                      $('#table' + uniqueID).DataTable({
                        dom: 'Bfrtip',
                        paging: pagination,
                        "pageLength": pagelengthF,
                        "info": pagination,
                        "lengthChange": true,
                        "scrollX": scrollXValue,
                        searching: search,
                        buttons: downloadBtn,
                      });
                    });
                  }
                }, 1000);
              }
              if (str === undefined) {
                tableData = [];
                if (JsonPath1 !== '' && JsonPath1 !== null && JsonPath1 !== undefined && JsonPath1 !== ' ') {
                  alert("JSON path not found");
                  return false;
                }
                const divElement = document.getElementById(ctx);
                const pElement = document.createElement('p');
                pElement.textContent = 'Table';
                divElement.appendChild(pElement);
              }
            };
            if (!window.Highcharts) {
              const scr = document.createElement("script");
              scr.src = "{[ custom_line_chartsrc ]}";
              scr.onload = init1;
              document.head.appendChild(scr);
            } else {
              init1();
            }
            this.on('removed', function () {
              this.tableInitialized = false;
            });
          },
        }),
        init() {
          const events = all_Traits
            .filter((i) => ["strings"].indexOf(i.name) < 0)
            .map((i) => `change:${i.name}`)
            .join(" ");
              this.on(events, () => {
              this.tableInitialized = false;  
              this.trigger("change:script");
              });
        },
      },
  });  

  editor.Blocks.add("custom_table", {
    label: "JSON Table",
    category: "Extra",
    attributes: {
      class: "fa fa-table",
    },
    content: {
      type: "custom_table",
    },
  });  

  // Handle table component selection for JSON suggestion and header preview
  editor.on('component:selected', (component) => {
      if (component.attributes.type === 'custom_table') {
          setTimeout(() => {
              // Handle JSON suggestion button
              const jsonBtnWrapper = document.querySelector('.i_designer-trt-trait__wrp-json-suggestion-btn');
              if (jsonBtnWrapper) {
                  const jsonBtn = jsonBtnWrapper.querySelector('.i_designer-btn-prim');
                  if (jsonBtn) {
                      jsonBtn.id = 'json-suggestion-btn-custom-table'; 
                      // Remove existing event listeners
                      const newBtn = jsonBtn.cloneNode(true);
                      jsonBtn.parentNode.replaceChild(newBtn, jsonBtn);
                      
                      newBtn.addEventListener('click', function (e) {
                          e.preventDefault();
                          e.stopPropagation();
                          openSuggestionJsonModalChartTable();
                      });
                  }
              }

              // Handle header preview button
              const headerBtnWrapper = document.querySelector('.i_designer-trt-trait__wrp-header-preview-trait');
              if (headerBtnWrapper) {
                  const headerBtn = headerBtnWrapper.querySelector('.i_designer-btn-prim');
                  if (headerBtn) {
                      headerBtn.id = 'header-preview-btn-custom-table';
                      // Remove existing event listeners
                      const newHeaderBtn = headerBtn.cloneNode(true);
                      headerBtn.parentNode.replaceChild(newHeaderBtn, headerBtn);
                      
                      newHeaderBtn.addEventListener('click', function (e) {
                          e.preventDefault();
                          e.stopPropagation();
                          openHeaderPreviewModal();
                      });
                  }
              }
          }, 1000);
      }
  });

  // Update table components with new JSON
  function updateTableComponentsWithNewJson() {
    const jsonData1 = JSON.parse(localStorage.getItem("common_json"));  
    if(jsonData1 !==null){
      jsonData.length= 0;  
      jsonData = [];
      jsonData.push(jsonData1);  
    }   

    // Clear filters when JSON is updated
    window.tableFilters = {};

    editor.getWrapper().find('[data-i_designer-type="custom_table"]').forEach(table => {
        table.tableInitialized = false;
        table.trigger('change:script');
    });
  }

  // Expose functions to be called from main file
  window.updateTableComponents = updateTableComponentsWithNewJson;
  window.openHeaderPreviewModal = openHeaderPreviewModal;
}