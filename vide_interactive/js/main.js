const editor = InteractiveDesigner.init({
  height: "100%",
  container: "#editor",
  fromElement: 1,
  allowScripts: 1,
  showOffsets: true,
  fromElement: true,
  noticeOnUnload: false,
  storageManager: false,  
  selectorManager: {
    componentFirst: true,
  },
  plugins: [ 
    "code-editor-component",
    "postcss-parser-component",
    "webpage-component", 
    customChartCommonJson, 
    customTable,
    // customTable2,
    source,
    customCarousel,
    customNewFontUrl,
    customLoadingPage, 
    customVideoIn,
    "basic-block-component", 
    "countdown-component",
    "forms-component",
    "table-component", 
    newComponents,  
    object,
    customTabWithNav,
    "image-editor-component",
    "zip-export-component",
    "custom-code-component",
    "toolbox-component",
    "tooltip-component",
    "typed-component",
    "style-bg-component", 
    "navbar-component",     
  ],
  pluginsOpts: {
    "grapesjs-plugin-toolbox": {
      panels: true,
    }, 
  },
  canvas: {
    styles: [
      "https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css",
      "https://use.fontawesome.com/releases/v5.8.2/css/all.css",
      "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap",
      "https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.5.0/css/bootstrap.min.css",
      "https://cdnjs.cloudflare.com/ajax/libs/mdbootstrap/4.19.1/css/mdb.min.css",  
      "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css",
      "https://fonts.googleapis.com/icon?family=Material+Icons", 
      "https://cdn.datatables.net/1.10.13/css/jquery.dataTables.min.css",
      "https://cdn.datatables.net/buttons/1.2.4/css/buttons.dataTables.min.css"
    ],
    scripts: [
      "https://code.jquery.com/jquery-3.3.1.slim.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js",
      "https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js",  
      "https://code.jquery.com/jquery-2.1.1.min.js",
      "https://cdn.datatables.net/1.10.13/js/jquery.dataTables.min.js",
      "https://cdnjs.cloudflare.com/ajax/libs/jszip/2.5.0/jszip.min.js", 
      "https://cdn.rawgit.com/bpampuch/pdfmake/0.1.24/build/pdfmake.min.js",
      "https://cdn.rawgit.com/bpampuch/pdfmake/0.1.24/build/vfs_fonts.js",
      "https://cdn.datatables.net/buttons/1.2.4/js/buttons.html5.min.js",
      "https://cdn.datatables.net/buttons/1.2.1/js/buttons.print.min.js",
      "https://cdn.datatables.net/buttons/1.2.4/js/dataTables.buttons.min.js",  
      "https://code.highcharts.com/highcharts.js",
      "https://code.highcharts.com/modules/drilldown.js",  
      "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
      "https://cdn.datatables.net/1.11.5/js/jquery.dataTables.min.js",
      "https://code.jquery.com/jquery-3.6.0.min.js",

    ],
  }, 
  
});  
const pn = editor.Panels; 
const panelViews = pn.addPanel({
  id: "views",
});

panelViews.get("buttons").add([
  {
    attributes: {
      title: "Open Code",
    },
    className: "fa fa-file-code-o",
    command: "open-code",
    togglable: false,
    id: "open-code",
  },
]);

editor.Panels.addPanel({ id: "devices-c" })
  .get("buttons")
  .add([
    {
      id: "exportPDF",
      attributes: { title: "Export PDF", id: "exportPDF" },
      className: "exportPDF fa fa-file-pdf-o",
    },
    {
      id: "savePage",
      attributes: { title: "Save Page", id: "savePage" },
      className: "fa fa-download",
    },
    {
      id: "importPage",
      attributes: { title: "Import Page", id: "importPage" },
      className: "fa fa-upload",
    },
    {
      id: "jsonFileUpload",
      attributes: { title: "Upload json file", id: "jsonFileUpload" },
      className: "fa fa-file",
    },
    {
      id: "multiLanguage",
      attributes: { title: "Change Language", id: "multiLanguage" },
      className: "fa fa-language",
    },  
    // {
    //   id: "allTemplateList",
    //   attributes: { title: "View All Template", id: "allTemplateList" },
    //   className: "fa fa-list",
    // },  
    // {
    //   id: "allLogs",
    //   attributes: { title: "View All Logs", id: "allLogs" },
    //   className: "fa fa-envelope",
    // },  
  ]);

var el = document.getElementById("exportPDF"); 
// el.addEventListener("click", generatePDF, true);
var save = document.getElementById("savePage");
save.addEventListener("click", savePage, true); 

var importPage = document.getElementById("importPage");
importPage.addEventListener("click", importSinglePages, true);

// var viewAllPage = document.getElementById("allTemplateList");
// viewAllPage.addEventListener("click", viewAllTemplates, true);

// var viewAllLogsP = document.getElementById("allLogs");
// viewAllLogsP.addEventListener("click", viewAllLogsD, true);


// function generatePDF() { 
//   var iframe = document.querySelector('#editor iframe');  
//   const tabs = iframe.contentDocument.querySelectorAll('.tab-content');  
//   const tabContents = [];
//   tabs.forEach((tab) => {  
//     const tabContainer = tab.querySelectorAll('.tab-container'); 
//     tabContainer.forEach((tabs) => {  
//     tabs.style.display = 'none';
//   });  
//     tabContents.push(tab.innerHTML);
//     tab.style.display = 'block'; 
//     tabContainer.forEach((tabs) => {  
//       tabs.style.display = 'block';
//     });  
//   }); 
//   var iframeContent = iframe.contentDocument.body.innerHTML;   
//   if(tabs.length ===0){ 
//     tabContents.push(iframeContent);
//   }   
//   var opt = {
//     filename: "interactive-designer.pdf",
//     margin: 1, 
//     jsPDF: {
//       format: 'A2', 
//     } 
//   };   
//    const data =`<head><meta charset="utf-8"><link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css"><link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.8.2/css/all.css"><link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.5.0/css/bootstrap.min.css"><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/mdbootstrap/4.19.1/css/mdb.min.css"><link rel="stylesheet" href="https://cdn.datatables.net/v/bs4/dt-1.13.2/datatables.min.css"><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"> <link rel="stylesheet" href="https://cdn.datatables.net/1.10.13/css/jquery.dataTables.min.css"><link rel="stylesheet" href="https://cdn.datatables.net/buttons/1.2.4/css/buttons.dataTables.min.css"><link rel="stylesheet" href="https://fonts.googleapis.com/icon?family=Material+Icons"><script src="https://code.jquery.com/jquery-3.3.1.slim.min.js"></script>  <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js"></script> <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js"></script><script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script><script src="https://code.jquery.com/jquery-2.1.1.min.js"></script><script src="https://cdn.datatables.net/1.10.13/js/jquery.dataTables.min.js"></script><script src="https://cdn.datatables.net/buttons/1.2.4/js/dataTables.buttons.min.js"></script><script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/2.5.0/jszip.min.js"></script><script src="https://cdn.rawgit.com/bpampuch/pdfmake/0.1.24/build/pdfmake.min.js"></script><script src="https://cdn.rawgit.com/bpampuch/pdfmake/0.1.24/build/vfs_fonts.js"></script><script src="https://cdn.datatables.net/buttons/1.2.4/js/buttons.html5.min.js"></script><script src="https://cdn.datatables.net/buttons/1.2.1/js/buttons.print.min.js"></script><script src="https://code.highcharts.com/highcharts.js"></script><script src="https://code.highcharts.com/modules/drilldown.js"></script>
//   <style>.tab-contents{min-height:auto!important;padding: 0px!important;}${editor.getCss()}</style></head><body> 
//    ${tabContents.join('')} 
//    </body>`;    
//   html2pdf().set(opt).from(data).save();  
// }

var singlePageData = JSON.parse(localStorage.getItem("single-page")); 
editor.setComponents(singlePageData); 
 

var pageName = 'index';
function savePage() {
  editor.Modal.setTitle('Add Page Name');
  editor.Modal.setContent(`<div class="new-table-form">
  <div> 
      <input type="text" class="form-control class="popupaddbtn"" value="" placeholder="Enter page name" style="width:95%"  name="singleSavePageName" id="singleSavePageName">
  </div>  
  <input id="saveSinglePage" type="button" value="Add" class="popupaddbtn" data-component-id="c1006">
  </div>
  </div>
  `);
  editor.Modal.open(); 
  var el = document.getElementById("saveSinglePage");
  el.addEventListener("click", downloadPage, true);   
} 

function downloadPage() {
  const pageName = document.getElementById('singleSavePageName').value;
  if (!pageName) {
    alert('Page name required');
    return false;
  }

  const html = editor.getHtml();
  const css = editor.getCss();
  const components = editor.getComponents();
  const style = editor.getStyle();

  const pageData = {
    html,
    css,
    components: components.toJSON(),
    style: style.toJSON(),
    traits: {}
  };

  // Save the custom traits' values
  editor.getWrapper().find('[data-i_designer-type]').forEach(comp => {
    console.log(comp.cid,'comp.cid');
    console.log(comp.getTraits(),'comp.cid');
    pageData.traits[comp.cid] = comp.getTraits().map(trait => ({
      name: trait.attributes.name,
      value: trait.get('value')
    }));
  });

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(pageData));
  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute("href", dataStr);
  downloadAnchorNode.setAttribute("download", pageName + ".json");
  document.body.appendChild(downloadAnchorNode); // required for firefox
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
  editor.Modal.close();
} 
 

function viewAllPage() { 
  var htmlContent = editor.getHtml();
  var cssContent = editor.getCss();
  htmlContent =
    "<html><head><style>" +
    cssContent +
    "</style></head>" +
    htmlContent +
    "</html>";
  var getallpage = localStorage.getItem("all-page");
  var allpage = JSON.parse(getallpage);
  for (var i = 0; i < allpage.length; i++) {
    if (allpage[i].name === singlePageData.name) {
      allpage.splice(
        allpage.findIndex((a) => a.name === singlePageData.name),
        1
      );
      allpage.push({
        name: singlePageData.name,
        data: htmlContent,
      });
      localStorage.setItem("all-page", JSON.stringify(allpage));
      window.location.replace("page.html");
    }
  }
}

function importSinglePages(){ 
  editor.Modal.setTitle('Add Page Name');
  editor.Modal.setContent(`<div class="new-table-form">
  <div> 
      <input type="file" class="form-control popupinput2" value="" accept="application/json" placeholder="Enter page name" style="width:95%"  name="importSinglePageInput" id="importSinglePageInput">
  </div>  
  <input id="import-single-file" class="popupaddbtn" type="button" value="Add" data-component-id="c1006">
  </div>
  </div>
  `);
  editor.Modal.open(); 
  var el = document.getElementById("import-single-file");
  el.addEventListener("click", importFile, true);   
}

// function viewAllTemplates(){
//   window.location.href = 'template.html';
// }  

// function viewAllLogsD(){
//   window.location.href = 'logs.html';
// } 


// console.log(editor.getWrapper(),'editor.getWrapper()===')

// function importFile(){
//   const input = document.getElementById('importSinglePageInput');
//   const file = input.files[0];
//   if (file) { 
//     const reader = new FileReader();
//     reader.onload = function(e) {
//       const code = e.target.result;  
//       localStorage.setItem('single-page',  JSON.stringify(code)); 
//       console.log(code,'code====');
//       // console.log( JSON.stringify(code),'Latest HTML File');
//       editor.setComponents(code); 
//       editor.Modal.close();  
//     }
//     reader.readAsText(file);
//   } else {
//     alert('No file selected'); 
//   } 
// }  


function importFile() {
  const input = document.getElementById('importSinglePageInput');
  const file = input.files[0];
  if (!file) {
    alert('No file selected');
    return;
  }

  const reader = new FileReader();
  reader.onload = e => {
    const content = e.target.result;
    const pageData = JSON.parse(content);

    editor.setComponents(pageData.components);
    editor.setStyle(pageData.style);

    // Apply HTML and CSS separately to ensure complete restoration
    const wrapper = editor.getWrapper();
    wrapper.set('content', '');
    wrapper.components(pageData.html);
    editor.addStyle(pageData.css);

    // Restore custom traits' values
    for (const cid in pageData.traits) {
      if (pageData.traits.hasOwnProperty(cid)) {
        const comp = wrapper.find(`#${cid}`)[0];
        if (comp) {
          pageData.traits[cid].forEach(traitData => {
            const trait = comp.getTrait(traitData.name);
            if (trait) {
              trait.set('value', traitData.value);
            }
          });
        }
      }
    } 
    editor.Modal.close();
    updateComponentsWithNewJson(editor);
  };
  reader.readAsText(file);
} 


function updateComponentsWithNewJson(editor) {   
  var jsonDataString = localStorage.getItem("common_json"); 
  var jsonData = [JSON.parse(jsonDataString)]; 
  let custom_language =  localStorage.getItem('language');  
  var jsonData2 = jsonData;  
  var styleTags2 = editor.getCss();
  var jsonDataNew = {};
  var styleContent = styleTags2;
  var regex = /#(\w+)\s*{\s*[^{}]*my-input-json:\s*([^;]+)\s*;[^{}]*}/g;
  var matches;
  while ((matches = regex.exec(styleContent)) !== null) {
      var divId = matches[1];
      var jsonKey = matches[2];
      var lang = jsonKey;
      jsonDataNew[divId] = lang;
  }
  if(custom_language === null){
    custom_language = 'english';
  }
  let updateDivContenthtml = editor.getHtml();  
  for (var divId in jsonDataNew) {  
      var jsonKey2 = jsonDataNew[divId];   
      const str = 'jsonData2[0].' + custom_language + '.' + jsonKey2;  
      var value = eval(str);   
      if (divId && value) {
          var parser = new DOMParser();
          var doc = parser.parseFromString(updateDivContenthtml, 'text/html');
          var myDiv = doc.getElementById(divId); 
          if (myDiv) {
              myDiv.textContent = value; 
              var component = editor.getWrapper().find(`#${divId}`)[0];
              if (component) {
                  component.components(value);
              }
          }
      }
  } 
}  

editor.on('run:core:canvas-clear', () => {
  // 🧹 Cleanup slide UI and state
  const thumbContainer = document.getElementById("slides-thumbnails");
  if (thumbContainer) thumbContainer.remove(); // Remove thumbnails container
  slides = [];
  transitions = {};
  clickStates = {};
  currentSlideIndex = 1;
});

