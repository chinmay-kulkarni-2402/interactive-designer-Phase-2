function customJsonTable(editor) {
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
    ...json_button_sugesstionTrait
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
                setTimeout(() => {
                  const length = Object.keys(tableData.heading).length;
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
                    const rows = Object.keys(tableData.heading).length;
                    let table = document.createElement('table');
                    table.setAttribute('width', '100%');
                    table.setAttribute('class', 'table table-bordered');
                    table.setAttribute('id', 'table' + uniqueID); 
                    if (divElement.firstChild) {
                      divElement.removeChild(divElement.firstChild);
                    }
    
                    if (caption === "true") {
                      if (tableData.caption === undefined || tableData.caption === null) {
                        alert("Caption data not found in json file");
                        return false;
                      }
                      if (captionAlign === null || captionAlign === undefined || captionAlign === '') {
                        captionAlign = 'left';
                      }
                      let caption1a = document.createElement('caption');
                      caption1a.textContent = tableData.caption;
                      caption1a.style.captionSide = 'top';
                      caption1a.style.textAlign = captionAlign;
                      table.appendChild(caption1a);
                    }
                    let thead = document.createElement('thead');
                    let thtr = document.createElement('tr');
                    const objectName = Object.keys(tableData.heading);
                    for (let j = 0; j < rows; j++) {
                      let th = document.createElement('th');
                      th.setAttribute("class", "col" + uniqueID + j);
                      let div1 = document.createElement('div');
                      div1.textContent = eval('tableData.heading.' + objectName[j]);
                      th.appendChild(div1);
                      thtr.appendChild(th);
                    }
                    thead.appendChild(thtr);
                    table.appendChild(thead);
                    
                    let tbody = document.createElement('tbody');
                    for (let i = 0; i < tableData.data.length; i++) {
                      let tr = document.createElement('tr');
                      for (let j = 0; j < rows; j++) {
                        let td = document.createElement('td');
                        td.setAttribute("class", "col" + uniqueID + j);
                        let div = document.createElement('div');
                        const textValue = eval('tableData.data[' + i + '].' + objectName[j]);
                        div.textContent = textValue;
                        
                        // Make cells editable and update DOM immediately
                        div.contentEditable = true;
                        div.addEventListener('input', function() {
                          // Update the underlying data
                          const newValue = this.textContent;
                          eval('tableData.data[' + i + '].' + objectName[j] + ' = "' + newValue + '"');
                          
                          // Force DOM update for print/PDF
                          this.setAttribute('data-original-text', newValue);
                        });
                        
                        div.addEventListener('blur', function() {
                          // Ensure data is saved
                          const newValue = this.textContent;
                          eval('tableData.data[' + i + '].' + objectName[j] + ' = "' + newValue + '"');
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
                      if (tableData.footer === undefined || tableData.footer === null) {
                        alert("Footer data not found in json file");
                        return false;
                      }
                      const objectName2 = Object.keys(tableData.footer);
                      for (let k = 0; k < rows; k++) {
                        let th = document.createElement('th');
                        th.setAttribute("class", "col" + uniqueID + k);
                        let div1 = document.createElement('div');
                        div1.textContent = eval('tableData.footer.' + objectName2[k]);
                        
                        // Make footer editable
                        div1.contentEditable = true;
                        div1.addEventListener('input', function() {
                          const newValue = this.textContent;
                          eval('tableData.footer.' + objectName2[k] + ' = "' + newValue + '"');
                          this.setAttribute('data-original-text', newValue);
                        });
                        
                        div1.addEventListener('blur', function() {
                          const newValue = this.textContent;
                          eval('tableData.footer.' + objectName2[k] + ' = "' + newValue + '"');
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

  // Handle table component selection for JSON suggestion
  editor.on('component:selected', (component) => {
      if (component.attributes.type === 'custom_table') {
          setTimeout(() => {
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
                  } else {
                      console.error('Json Suggestion button not found within the wrapper element');
                  }
              } else {
                  console.error('Json Suggestion button wrapper not found within the selected component');
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

    editor.getWrapper().find('[data-i_designer-type="custom_table"]').forEach(table => {
        table.tableInitialized = false;
        table.trigger('change:script');
    });
  }

  // Expose function to be called from main file
  window.updateTableComponents = updateTableComponentsWithNewJson;
}