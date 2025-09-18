function customCarousel(editor) {
  editor.Blocks.add("carousel", {
    category: "Extra",
    label: '<h1><i class="fa fa-sliders fa-lg"></i></h1> Carousel',
    content: '<carousel></carousel>',
  });

  editor.on("block:drag:stop", (block) => {
    if (block.get("tagName") === "carousel") {
      addCarousel();
    }
  });

  function addCarousel() {
    editor.Modal.setTitle("Create New Carousel");
    editor.Modal.setContent(`
      <div class="new-table-form">
        <div>
          <label for="nColumns">Number of slides</label>
          <input type="number" class="form-control" value="3" name="nColumns" id="nColumns" min="2">
        </div> 
        <div>
          <label for="nRows">Scroll Time (ms)</label>
          <input type="number" class="form-control" value="2000" name="nRows" id="nRows" min="1000">
        </div> 
        <div>
          <input id="table-button-create-new" type="button" value="Create Carousel" data-component-id="c1006">
        </div>
      </div>
    `);
    editor.Modal.open();

    var el = document.getElementById("table-button-create-new");
    el.addEventListener("click", createCarousel, true);

    // remove placeholder <carousel> element
    editor.DomComponents.getComponents().forEach((component) => {
      if (component.get("tagName") === "carousel") {
        component.remove("content", "");
      }
    });

    function createCarousel() {
      let sliderCount = parseInt(document.getElementById("nColumns").value);
      if (sliderCount < 2) sliderCount = 2;

      let dataInterval = parseInt(document.getElementById("nRows").value);
      if (dataInterval < 1000) dataInterval = 1000;

      // build carousel-inner
      const innerHtml = document.createElement("div");
      innerHtml.classList.add("carousel-inner");

      for (let i = 0; i < sliderCount; i++) {
        const carouselItem = document.createElement("div");
        carouselItem.classList.add("carousel-item");
        if (i === 0) carouselItem.classList.add("active");

        const carouselA = document.createElement("a");
        carouselA.classList.add("d-inline-block");
        carouselA.style.width = "100%";

        const carouselImg = document.createElement("img");
        carouselImg.src = "https://via.placeholder.com/800x400.png?text=Slide+" + (i + 1);
        carouselImg.style.width = "100%";
        carouselImg.style.margin = "5px 190px";
        carouselImg.style.height = "300px";

        carouselA.append(carouselImg);
        carouselItem.append(carouselA);
        innerHtml.append(carouselItem);
      }

      const uniqueID = Math.floor(100 + Math.random() * 900);

      // correct Bootstrap markup
      const carousel = `
        <div id="Carousel${uniqueID}" class="carousel slide" data-ride="carousel" data-interval="${dataInterval}" style="padding:5px 0px">
          ${innerHtml.outerHTML}
          <a class="carousel-control-prev" href="#Carousel${uniqueID}" role="button" data-slide="prev">
            <span class="carousel-control-prev-icon" aria-hidden="true"></span>
            <span class="sr-only">Previous</span>
          </a>
          <a class="carousel-control-next" href="#Carousel${uniqueID}" role="button" data-slide="next">
            <span class="carousel-control-next-icon" aria-hidden="true"></span>
            <span class="sr-only">Next</span>
          </a>
        </div>`;

      // insert into GrapesJS DOM (works in plain canvas or page section)
      // find the placeholder <carousel> element in the editor
const comps = editor.DomComponents.getWrapper().find('carousel');
if (comps.length > 0) {
  comps[0].replaceWith(carousel);   // replace placeholder with actual carousel HTML
} else {
  // fallback: add to root if no placeholder found
  editor.DomComponents.addComponent(carousel);
}


      editor.Modal.close();

      // optional: force Bootstrap to initialize carousel JS
      setTimeout(() => {
        if (window.jQuery && $("#Carousel" + uniqueID).carousel) {
          $("#Carousel" + uniqueID).carousel();
        }
      }, 200);
    }
  }
}
