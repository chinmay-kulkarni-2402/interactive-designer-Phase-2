function customCarousel(editor) {  
  editor.Blocks.add("carousel", {
    category: "Extra",
    label: '<h1><i class="fa fa-sliders fa-lg"></i></h1> Carousel',
    content: '<carousel></carousel>', 
  }); 
  editor.on('block:drag:stop', (block) => {   
    if (block.get('tagName') === 'carousel') { 
        addCarousel();
    }
});


  function  addCarousel(){ 
    editor.Modal.setTitle('Create New Carousel');
    editor.Modal.setContent(`<div class="new-table-form">
    <div>
        <label for="nColumns">Number of slider</label>
        <input type="number" class="form-control" value="3" name="nColumns" id="nColumns" min="1">
        </div> 
    <div>
    <div>
      <label for="nRows">Scroll Time</label>
      <input type="number" class="form-control" value="2000" name="nRows" id="nRows" min="1">
      </div> 
    <div>
    <input id="table-button-create-new" type="button" value="Create Carousel" data-component-id="c1006">
    </div>
    </div>
    `);
    editor.Modal.open(); 
    var el = document.getElementById("table-button-create-new");
    el.addEventListener("click", createTable, true); 
    editor.DomComponents.getComponents().forEach(component => {  
      if (component.get('tagName') === 'carousel') {  
        component.remove('content', ''); 
      }
    });  
    function createTable() { 
      var slider = parseInt(document.getElementById('nColumns').value);   
      if(slider < 2){  
        slider = 2; 
      }
      var dataInterval = parseInt(document.getElementById('nRows').value);   
      if(nRows < 1000){  
        nRows = 1000; 
      }

      var innerHtml = document.createElement('div');
      innerHtml.classList.add('carousel-inner');
      for (let index = 0; index < slider; index++) {
        const active = index === 0 ? 'active' : '';
        const carouselItem = document.createElement('div');
        carouselItem.classList.add('carousel-item'); 
        if(active ==='active'){
          carouselItem.classList.add(active); 
        } 
        const carouselA = document.createElement('a');
        carouselA.classList.add('d-inline-block');
        carouselA.style.width = '100%'; 
        var imageNum = index + 1; 
        const carouselImg = document.createElement('img');
        carouselImg.src = "https://via.placeholder.com/800x400.png?text=Slide+"+imageNum;
        carouselImg.style.width = '100%';
        carouselImg.style.margin = '5px 0px';
        carouselImg.style.height = '300px';   
        carouselA.append(carouselImg);
        carouselItem.append(carouselA);  
        innerHtml.append(carouselItem);
      }   
      var uniqueID  = Math.floor(100 + Math.random() * 900); 
      var carousel = `<div class="carousel" data-interval=${dataInterval} id="Carousel${uniqueID}"  data-ride="carousel" style="padding:5px 0px"> 
        ${innerHtml.outerHTML}
      <a class="carousel-control-prev" href="#Carousel${uniqueID}" role="button" data-slide="prev">
        <span class="carousel-control-prev-icon" aria-hidden="true"></span>
        <span class="sr-only">Previous</span>
      </a>
      <a class="carousel-control-next" id="nextBtn" href="#Carousel${uniqueID}" role="button" data-slide="next">
        <span class="carousel-control-next-icon" aria-hidden="true"></span>
        <span class="sr-only">Next</span>
      </a>
    </div> `; 
        editor.DomComponents.addComponent(carousel);
        editor.Modal.close();   
      };   
  }   
  
}
