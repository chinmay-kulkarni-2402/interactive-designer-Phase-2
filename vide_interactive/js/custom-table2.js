function customTable2(editor) { 
     
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

  
    editor.Components.addType("custom_table", {
      model: {
        defaults: props_test_table({
          ...test_chart_Props, 
          tagName: "div",   
          resizable: 1, 
          droppable: 0,
          custom_line_chartsrc: "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js",
          stylable: 1,
          traits: [id_Trait, title_Trait, ...all_Traits],
          style: {
            padding: "10px 0px", 
          },  
          script: `
          const init = () => { 
          const ctx = this.id;      
          let footer = "{[ Footer ]}"; 
          let downloadFile =  {[ FileDownload ]} ;   
          let pagination = "{[ Pagination ]}";  
          let pagelengthF = "{[ pageLength ]}";    
          let search = "{[ Search ]}";        
          let caption = "{[ Caption ]}";    
          let captionAlign = "{[ CaptionAlign ]}";
          let JsonPath1 = "{[ jsonpath ]}";   
          let custom_language =  localStorage.getItem('language');   
          if(custom_language==null){
            custom_language = 'english';
          }      
          let project_type = 'developmentJsonType';   
          console.log(${jsonData},'jsonData==');
          let str = ${jsonData}[0][custom_language][JsonPath1];    
          if(typeof project_type2 !== 'undefined' &&  project_type2 === 'downloadedJsonType'){
            project_type = 'downloadedJsonType'; 
          }
          if(project_type === 'downloadedJsonType'){ 
            str = jsonData1[0][custom_language][JsonPath1];
          } 
          let tableData = []; 
          if(str !== undefined){  
              tableData = eval(str);    
            setTimeout(() => { 
              const length = Object.keys(tableData.heading).length; 
                if(length === 0){
                  alert("Table json formate not proper");
                  return false; 
                } else{   
                let uniqueID  =  ctx;     
                const divElement = document.getElementById(ctx); 
                let downloadBtn = downloadFile;   
                for (var i = 0; i < downloadBtn.length; i++) {
                  if (downloadBtn[i] === "msword") { 
                    downloadBtn.splice(i, 1);
                    downloadBtn.push({
                      text: 'MS Word',
                      action: function () { 
                        const table = document.getElementById('table'+uniqueID);  
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
                }  
                const rows = Object.keys(tableData.heading).length;  
                let table = document.createElement('table');    
                table.setAttribute('width','100%'); 
                table.setAttribute('class','table table-bordered'); 
                table.setAttribute('id','table'+uniqueID);  
                if(caption==="true"){ 
                  if(tableData.caption === undefined || tableData.caption === null){
                    alert("Caption data not found in json file");
                    return false;
                  } 
                  if(captionAlign === null || captionAlign === undefined || captionAlign ===''){
                    captionAlign = 'left';
                  }
                  let caption1a = document.createElement('caption'); 
                  caption1a.textContent =  tableData.caption;  
                  caption1a.style.captionSide = 'top';   
                  caption1a.style.textAlign = captionAlign;  
                  table.appendChild(caption1a);   
                } 
                let thead = document.createElement('thead');  
                let thtr = document.createElement('tr'); 
                const objectName = Object.keys(tableData.heading);   
                  for (let j = 0; j < rows; j++) {
                    let th = document.createElement('th'); 
                    th.setAttribute("class",  "col"+uniqueID+j);
                    let div1 = document.createElement('div'); 
                    div1.textContent = eval('tableData.heading.'+objectName[j]);
                    th.appendChild(div1);
                    thtr.appendChild(th);
                } 
                thead.appendChild(thtr);  
                table.appendChild(thead);
                let tbody = document.createElement('tbody');
                  for (let i = 0; i < tableData.data.length ; i++) {
                  let tr = document.createElement('tr');
                  for (let j = 0; j < rows; j++) {
                      let td = document.createElement('td');
                      td.setAttribute("class",  "col"+uniqueID+j);
                      let div = document.createElement('div');
                      const textValue =  eval('tableData.data['+i+'].'+objectName[j]); 
                      div.textContent = textValue;
                      td.appendChild(div);
                      tr.appendChild(td);
                  } 
                  tbody.appendChild(tr);  
                  }   
        
                  table.appendChild(tbody);  
                  let tfoot = document.createElement('tfoot');  
                  let tfoottr = document.createElement('tr');  
                  if(footer==='true'){ 
                  if(tableData.footer === undefined || tableData.footer === null){
                    alert("Footer data not found in json file");
                    return false;
                  }
                  const objectName2 = Object.keys(tableData.footer); 
                    for (let k = 0; k < rows; k++) {
                      let th = document.createElement('th'); 
                      th.setAttribute("class", "col"+uniqueID+k);
                      let div1 = document.createElement('div');
                      div1.textContent = eval('tableData.footer.'+objectName2[k]);
                      th.appendChild(div1);
                      tfoottr.appendChild(th);
                  } 
                  tfoot.appendChild(tfoottr);
                    table.appendChild(tfoot);
                  }    
                  divElement.appendChild(table);  
                  if(search==='' || search===undefined || search === null ){
                    search = false;
                  } 
                  if(pagination==='' || pagination === undefined || pagination === null ){
                    pagination = false;
                  }     
                  var scrollXValue = false;  
                  const newValue = window.innerWidth <= 768;
                  if (newValue) {
                    scrollXValue = true; 
                  } else {
                    scrollXValue = false; 
                  } 
                  pagelengthF = pagelengthF*1;  
                  $(document).ready(function() {
                    $('#table'+uniqueID).DataTable({
                      dom: 'Bfrtip',   
                      paging : pagination,
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
          if(str === undefined){ 
            tableData = []; 
            if(JsonPath1 !=='' && JsonPath1 !==null && JsonPath1 !==undefined && JsonPath1 !==' ' ){
              alert("JSON path not found");
              return false;
            }  
            const divElement = document.getElementById(ctx);
            const pElement = document.createElement('p');
            pElement.textContent =  'Table';
            divElement.appendChild(pElement);
          }   
        };  
        if (!window.Highcharts) {  
          const scr = document.createElement("script");
          scr.src = "{[ custom_line_chartsrc ]}";
          scr.onload = init;
          document.head.appendChild(scr);
        } else {
          init(); 
        }`,
        }),
  
        init() {     
          const events = all_Traits
          .filter((i) => ["strings"].indexOf(i.name) < 0)
          .map((i) => `change:${i.name}`)
          .join(" ");
        this.on(events, () => {
        const common_json2 = JSON.parse(localStorage.getItem("common_json"));  
            if(common_json2 !==null){
              jsonData.length= 0;  
              jsonData = [];
              jsonData.push(common_json2);  
            } 
          this.trigger("change:script")
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
         
  }