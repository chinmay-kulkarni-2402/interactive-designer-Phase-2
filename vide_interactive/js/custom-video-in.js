function customVideoIn(editor){
editor.on("component:add", (model) => {
  if (model.get("type") === "videoIn") {
    // Ask number of pages when video block is added
    askNumberOfPages();
  }
});

// 🎯 Step 1: Show modal to ask for number of pages
function askNumberOfPages() {
  editor.Modal.setTitle("Enter Number of Pages");
  editor.Modal.setContent(`
    <div>
      <label for="customPageCount">How many pages do you want?</label>
      <input type="number" id="customPageCount" class="form-control" min="1" placeholder="Enter a number" style="margin-top: 10px;" />
      
      <button id="confirmPageCount" class="btn btn-primary" style="margin-top: 15px;">Next</button>
    </div>
  `);

  editor.Modal.open();

  // Confirm button handler
  document
    .getElementById("confirmPageCount")
    .addEventListener("click", handlePageSelection);
}

// 🎨 Handle page selection and proceed to canvas size
function handlePageSelection() {
  const numPages = parseInt(document.getElementById("customPageCount").value);

  if (isNaN(numPages) || numPages <= 0) {
    alert("Please enter a valid number of pages.");
    return;
  }

  // Proceed to canvas size selection
  askCanvasSize(numPages);
}

function askCanvasSize(numPages) {
  editor.Modal.setTitle("Select Canvas Size");
  editor.Modal.setContent(`
    <div>
      <label for="canvasSizeSelect">Choose Canvas Size:</label>
      <select id="canvasSizeSelect" class="form-control">
        <option value="A4">A4 (595px x 842px)</option>
        <option value="720p">720p (1280px x 720px)</option>
        <option value="custom">Custom Size</option>
      </select>

      <div id="customSizeInputs" style="display:none; margin-top: 10px;">
        <label for="customWidth">Width:</label>
        <input type="text" id="customWidth" class="form-control" placeholder="Enter width (e.g., 800px)" />

        <label for="customHeight" style="margin-top: 10px;">Height:</label>
        <input type="text" id="customHeight" class="form-control" placeholder="Enter height (e.g., 600px)" />
      </div>

      <button id="confirmCanvasSize" class="btn btn-primary" style="margin-top: 15px;">Confirm</button>
    </div>
  `);

  editor.Modal.open();

  // ✅ Bind events *after* modal is rendered
  document
    .getElementById("canvasSizeSelect")
    .addEventListener("change", handleSizeChange);

  document
    .getElementById("confirmCanvasSize")
    .addEventListener("click", () => handleCanvasSelection(numPages));
}


// 🎯 Handle size selection and custom input visibility
function handleSizeChange() {
  const selectedSize = document.getElementById("canvasSizeSelect").value;
  const customInputs = document.getElementById("customSizeInputs");

  if (selectedSize === "custom") {
    customInputs.style.display = "block"; // Show inputs
  } else {
    customInputs.style.display = "none"; // Hide inputs
  }
}

// 🎨 Handle canvas selection and create slides
function handleCanvasSelection(numPages) {
  const selectedSize = document.getElementById("canvasSizeSelect").value;
  let width, height;

  switch (selectedSize) {
    case "A4":
      width = "595px";
      height = "840px";
      break;
    case "720p":
      width = "1280px";
      height = "720px";
      break;
    case "custom":
      width = document.getElementById("customWidth").value;
      height = document.getElementById("customHeight").value;
      if (!isValidSize(width) || !isValidSize(height)) {
        alert("Invalid custom size. Please enter valid dimensions.");
        return;
      }
      break;
    default:
      alert("Invalid option. Using default A4 size.");
      width = "595px";
      height = "842px";
  }

  // Create slides with selected size
  createSlides(numPages, width, height);
  editor.Modal.close();
}

// 🎨 Validate custom size format
function isValidSize(size) {
  return size && size.match(/^\d+(px|%)$/);
}



let transitions = {};
let thumbnailNames = {};
let clickStates = {}; 
window.presentationState = {
  currentSlideIndex: 1, // Current active slide index
   slides: [],          // Stores slide components
}

let currentSlideIndex = window.presentationState.currentSlideIndex; // Keep track of active slide
let slides = window.presentationState.slides;

const activeStyle = document.createElement('style');
activeStyle.innerHTML = `
  .thumbnail.active-thumbnail {
    transform: scale(1.2) !important;
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.25) !important;
    border-color: #007bff;
  }
`;
document.head.appendChild(activeStyle);


// 🎨 Enhanced styling for slide thumbnails
function createSlides(numPages, width, height) {
   window.presentationState.slides = slides;
  const slidesContainer = document.createElement("div");
  slidesContainer.id = "slides-thumbnails";
  slidesContainer.style.position = "sticky";
  slidesContainer.style.bottom = "0";
  slidesContainer.style.left = "0";
  slidesContainer.style.width = "82.9%";
  slidesContainer.style.zIndex = "999";
  slidesContainer.style.display = "flex";
  slidesContainer.style.overflowX = "auto";
  slidesContainer.style.background = "#f9f9f9";
  slidesContainer.style.padding = "10px 15px";
  slidesContainer.style.border = "1px solid #ccc";
  slidesContainer.style.alignItems = "center";

  function createDeleteButton(thumbnail, slideIndex) {
    const deleteBtn = document.createElement("div");
    deleteBtn.innerHTML = "&times;";
    deleteBtn.style.position = "absolute";
    deleteBtn.style.top = "1px";
    deleteBtn.style.right = "4px";
    deleteBtn.style.fontSize = "23px";
    deleteBtn.style.color = "#000000";
   // deleteBtn.style.background = "#2e0d7d";
    deleteBtn.style.cursor = "pointer";
    deleteBtn.style.zIndex = "10";
    deleteBtn.title = "Delete Slide";

    deleteBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!window.confirm("Are you sure you want to delete this slide?")) return;
      const index = parseInt(thumbnail.getAttribute("data-slide-index"));

      // Remove slide component and thumbnail
      slides[index - 1].remove();
      slides.splice(index - 1, 1);
      thumbnail.remove();

      delete transitions[index];
      delete clickStates[index];

      // Reindex slides, thumbnails, transitions, clickStates
      const allThumbnails = slidesContainer.querySelectorAll(".thumbnail");
      allThumbnails.forEach((thumb, idx) => {
        const newIndex = idx + 1;
        thumb.innerText = `Page ${newIndex}`;
        thumb.setAttribute("data-slide-index", newIndex);
      
        // Remove old delete buttons if any
        const oldDelete = thumb.querySelector("div");
        if (oldDelete) oldDelete.remove();
      
        // Add fresh delete button
        const newDeleteBtn = createDeleteButton(thumb, newIndex);
        thumb.appendChild(newDeleteBtn);
      
        const slide = slides[idx];
        slide.addAttributes({
          "data-slide": newIndex
        });
        transitions[newIndex] = transitions[newIndex] || { type: "none", duration: 0, direction: "none" };
        clickStates[newIndex] = clickStates[newIndex] || false;
      });
      
      // Clean up stale keys
      const keys = Object.keys(transitions);
      keys.forEach((key) => {
        if (parseInt(key) > slides.length) delete transitions[key];
      });

      currentSlideIndex = Math.min(currentSlideIndex, slides.length);
       window.presentationState.currentSlideIndex = currentSlideIndex;
      switchSlide(currentSlideIndex);
    });

    return deleteBtn;
  }

  for (let i = 1; i <= numPages; i++) {
    let slide = editor.Components.addComponent({
      tagName: "div",
      attributes: {
        "data-slide": i,
        "data-transition-type": "none",
        "data-transition-duration": "0",
        "data-transition-direction": "none",
        "data-slide-input":"False",
      },
      content: ``,
      style: {
        width,
        height,
        border: "1px solid #ccc",
        textAlign: "center",
        lineHeight: height,
        backgroundColor: "#f4f4f4",
        display: i === 1 ? "block" : "none",
        borderRadius: "8px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
      },
    });

    transitions[i] = { type: "none", duration: 0, direction: "none", slideInput:"False", hasMusic: false, musicFile: null, musicLoop: false};
    slides.push(slide);

    let thumbnail = document.createElement("div");
    thumbnail.innerText = `Page ${i}`;
    thumbnail.classList.add("thumbnail");
    thumbnail.setAttribute("data-slide-index", i);
    thumbnail.style.width = "80px";
    thumbnail.style.height = "60px";
    thumbnail.style.border = "1px solid #888";
    thumbnail.style.cursor = "pointer";
    thumbnail.style.display = "flex";
    thumbnail.style.alignItems = "center";
    thumbnail.style.justifyContent = "center";
    thumbnail.style.position = "relative";
    thumbnail.style.fontSize = "16px";
    thumbnail.style.fontWeight = "bold";
    thumbnail.style.color = "#333";
    thumbnail.style.borderRadius = "6px";
    thumbnail.style.marginRight = "10px";
    thumbnail.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
    thumbnail.style.transition = "transform 0.3s ease, box-shadow 0.3s ease";
    thumbnail.style.backgroundSize = "cover";
    thumbnail.style.backgroundPosition = "center";

    const blurEffect = document.createElement('style');
    blurEffect.innerHTML = `
      .thumbnail::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url('https://blogs.windows.com/wp-content/uploads/prod/sites/44/2022/09/photos-newicon.png') center center no-repeat;
        background-size: cover;
        filter: blur(1.5px);
        z-index: -1;
      }
    `;
    document.head.appendChild(blurEffect);

    const deleteBtn = createDeleteButton(thumbnail, i);
    thumbnail.appendChild(deleteBtn);

    clickStates[i] = false;

    thumbnail.addEventListener("mouseenter", () => {
      thumbnail.style.transform = "scale(1.1)";
      thumbnail.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.2)";
    });

    thumbnail.addEventListener("mouseleave", () => {
      thumbnail.style.transform = "scale(1)";
      thumbnail.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
    });

    thumbnail.addEventListener("click", () => {
      const index = parseInt(thumbnail.getAttribute("data-slide-index"));
      if (currentSlideIndex === index) {
        askTransitionSettings(index);
      } else {
        editor.Modal.close();
        switchSlide(index);
      }
      clickStates[index] = !clickStates[index];
    });

    thumbnail.addEventListener("dblclick", (e) => {
  e.stopPropagation();
  const slideIndex = parseInt(thumbnail.getAttribute("data-slide-index"));
  const currentName = thumbnailNames[slideIndex] || `Page ${slideIndex}`;
  
  const input = document.createElement("input");
  input.type = "text";
  input.value = currentName;
  input.style.width = "70px";
  input.style.textAlign = "center";
  input.style.fontSize = "14px";
  input.style.fontWeight = "bold";
  input.style.border = "1px solid #007bff";
  input.style.borderRadius = "3px";
  
  // Store the current delete button to restore it later
  const existingDeleteBtn = thumbnail.querySelector('.delete-btn');
  
  thumbnail.innerHTML = "";
  thumbnail.appendChild(input);
  input.focus();
  input.select();
  
  const saveEdit = () => {
    const newName = input.value.trim() || `Page ${slideIndex}`;
    thumbnailNames[slideIndex] = newName; // Save the name
    thumbnail.innerHTML = newName;
    
    // Re-add the EXISTING delete button (don't create new one)
    if (existingDeleteBtn) {
      thumbnail.appendChild(existingDeleteBtn);
    }
  };
  
  input.addEventListener("blur", saveEdit);
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      saveEdit();
    }
  });
});
    if (i === 1) {
      thumbnail.classList.add("active-thumbnail"); // ✅ Start with first thumbnail highlighted
    }

    slidesContainer.appendChild(thumbnail);
  }

  // ➕ Add "+" button to add a new slide
  let addSlideBtn = document.createElement("div");
  addSlideBtn.innerText = "+";
  addSlideBtn.style.width = "60px";
  addSlideBtn.style.height = "60px";
  addSlideBtn.style.display = "flex";
  addSlideBtn.style.alignItems = "center";
  addSlideBtn.style.justifyContent = "center";
  addSlideBtn.style.fontSize = "32px";
  addSlideBtn.style.color = "#007bff";
  addSlideBtn.style.border = "2px dashed #007bff";
  addSlideBtn.style.borderRadius = "8px";
  addSlideBtn.style.cursor = "pointer";
  addSlideBtn.style.transition = "transform 0.3s ease, box-shadow 0.3s ease";
  addSlideBtn.title = "Add New Slide";

  addSlideBtn.addEventListener("mouseenter", () => {
    addSlideBtn.style.transform = "scale(1.1)";
  });
  addSlideBtn.addEventListener("mouseleave", () => {
    addSlideBtn.style.transform = "scale(1)";
  });

  addSlideBtn.addEventListener("click", () => {
    const newIndex = slides.length + 1;
    const slide = editor.Components.addComponent({
      tagName: "div",
      attributes: {
        "data-slide": newIndex,
        "data-transition-type": "none",
        "data-transition-duration": "0",
        "data-transition-direction": "none",
        "data-slide-input": "False",
      },
      content: ``,
      style: {
        width,
        height,
        border: "1px solid #ccc",
        textAlign: "center",
        lineHeight: height,
        backgroundColor: "#f4f4f4",
        display: "none",
        borderRadius: "8px",
        boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        transition: "transform 0.3s ease, box-shadow 0.3s ease",
      },
    });

    transitions[newIndex] = { type: "none", duration: 0, direction: "none" , slideInput: "False"};
    slides.push(slide);

    let thumbnail = document.createElement("div");
    thumbnail.innerText = `Page ${newIndex}`;
    thumbnail.classList.add("thumbnail");
    thumbnail.setAttribute("data-slide-index", newIndex);
    thumbnail.style.width = "80px";
    thumbnail.style.height = "60px";
    thumbnail.style.border = "1px solid #888";
    thumbnail.style.cursor = "pointer";
    thumbnail.style.display = "flex";
    thumbnail.style.alignItems = "center";
    thumbnail.style.justifyContent = "center";
    thumbnail.style.position = "relative";
    thumbnail.style.fontSize = "16px";
    thumbnail.style.fontWeight = "bold";
    thumbnail.style.color = "#333";
    thumbnail.style.borderRadius = "6px";
    thumbnail.style.marginRight = "10px";
    thumbnail.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
    thumbnail.style.transition = "transform 0.3s ease, box-shadow 0.3s ease";
    thumbnail.style.backgroundSize = "cover";
    thumbnail.style.backgroundPosition = "center";

    const deleteBtn = createDeleteButton(thumbnail, newIndex);
    thumbnail.appendChild(deleteBtn);

    clickStates[newIndex] = false;

    thumbnail.addEventListener("mouseenter", () => {
      thumbnail.style.transform = "scale(1.1)";
      thumbnail.style.boxShadow = "0 8px 16px rgba(0, 0, 0, 0.2)";
    });

    thumbnail.addEventListener("mouseleave", () => {
      thumbnail.style.transform = "scale(1)";
      thumbnail.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
    });

    thumbnail.addEventListener("click", () => {
      if (!clickStates[newIndex]) {
        switchSlide(newIndex);
      } else {
        askTransitionSettings(newIndex);
      }
      clickStates[newIndex] = !clickStates[newIndex];
    });

    thumbnail.addEventListener("dblclick", (e) => {
  e.stopPropagation();
  const slideIndex = parseInt(thumbnail.getAttribute("data-slide-index"));
  const currentName = thumbnailNames[slideIndex] || `Page ${slideIndex}`;
  
  const input = document.createElement("input");
  input.type = "text";
  input.value = currentName;
  input.style.width = "70px";
  input.style.textAlign = "center";
  input.style.fontSize = "14px";
  input.style.fontWeight = "bold";
  input.style.border = "1px solid #007bff";
  input.style.borderRadius = "3px";
  
  // Store the current delete button
  const existingDeleteBtn = thumbnail.querySelector('.delete-btn');
  
  thumbnail.innerHTML = "";
  thumbnail.appendChild(input);
  input.focus();
  input.select();
  
  const saveEdit = () => {
    const newName = input.value.trim() || `Page ${slideIndex}`;
    thumbnailNames[slideIndex] = newName; // Save the name
    thumbnail.innerHTML = newName;
    
    // Re-add the EXISTING delete button
    if (existingDeleteBtn) {
      thumbnail.appendChild(existingDeleteBtn);
    }
  };
  
  input.addEventListener("blur", saveEdit);
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      saveEdit();
    }
  });
});
    slidesContainer.insertBefore(thumbnail, addSlideBtn);
  });

  slidesContainer.appendChild(addSlideBtn);
  document.body.appendChild(slidesContainer);

  // ✅ Modify iframe styling
const iframe = document.querySelector("iframe.i_designer-frame");
if (iframe) {
  iframe.style.height = "89.16%";
  iframe.style.margin = "0";
}
document.body.style.overflow = "hidden";


  // Only show the download button if a "videoIn" component is added
  const videoInComponent = editor.getWrapper().find('[data-i_designer-type="videoIn"]');
  if (videoInComponent.length > 0) {
    const downloadBtn = document.createElement("button");
    downloadBtn.textContent = "Download";
    downloadBtn.className = "btn btn-success";
    downloadBtn.style.marginLeft = "65px";
    downloadBtn.style.padding = "12px 24px";
    downloadBtn.style.fontSize = "16px";
    downloadBtn.style.borderRadius = "8px";
    downloadBtn.style.backgroundColor = "#28a745";
    downloadBtn.style.color = "#fff";
    downloadBtn.style.border = "none";
    downloadBtn.style.cursor = "pointer";
    downloadBtn.style.transition = "background-color 0.3s ease, transform 0.3s ease"; // Smooth hover effect

    const checkboxContainer = document.createElement("div");
    checkboxContainer.style.display = "inline-flex";
    checkboxContainer.style.alignItems = "center";
    checkboxContainer.style.marginLeft = "20px";
    
    const thumbnailCheckbox = document.createElement("input");
    thumbnailCheckbox.type = "checkbox";
    thumbnailCheckbox.id = "hideThumbnails";
    thumbnailCheckbox.style.marginRight = "8px";
    thumbnailCheckbox.style.cursor = "pointer";
    
    const checkboxLabel = document.createElement("label");
    checkboxLabel.htmlFor = "hideThumbnails";
    checkboxLabel.textContent = "Hide Thumbnails";
    checkboxLabel.style.cursor = "pointer";
    checkboxLabel.style.fontSize = "14px";
    checkboxLabel.style.color = "#333";
    
    checkboxContainer.appendChild(thumbnailCheckbox);
    checkboxContainer.appendChild(checkboxLabel);

    slidesContainer.appendChild(checkboxContainer);
    slidesContainer.appendChild(downloadBtn);

    // Add upload sound button
const uploadSoundBtn = document.createElement("button");
uploadSoundBtn.textContent = "Upload Sound";
uploadSoundBtn.className = "btn btn-info";
uploadSoundBtn.style.marginLeft = "20px";
uploadSoundBtn.style.padding = "12px 24px";
uploadSoundBtn.style.fontSize = "16px";
uploadSoundBtn.style.borderRadius = "8px";
uploadSoundBtn.style.backgroundColor = "#17a2b8";
uploadSoundBtn.style.color = "#fff";
uploadSoundBtn.style.border = "none";
uploadSoundBtn.style.cursor = "pointer";
uploadSoundBtn.style.transition = "background-color 0.3s ease, transform 0.3s ease";

uploadSoundBtn.addEventListener("mouseenter", () => {
  uploadSoundBtn.style.backgroundColor = "#138496";
  uploadSoundBtn.style.transform = "scale(1.05)";
});

uploadSoundBtn.addEventListener("mouseleave", () => {
  uploadSoundBtn.style.backgroundColor = "#17a2b8";
  uploadSoundBtn.style.transform = "scale(1)";
});

uploadSoundBtn.onclick = () => {
  askForSoundFile();
};

slidesContainer.appendChild(uploadSoundBtn);


    downloadBtn.onclick = () => {
  //       let hasInvalidVideo = false;
  // let invalidSlideNumbers = [];
  
  // slideElements.forEach((el, idx) => {
  //   const slideIndex = idx + 1;
  //   const videoElement = el.querySelector('video');
  //   const slideTimer = parseFloat(el.getAttribute("data-slide-timer")) || 0;
    
  //   if (videoElement && slideTimer <= 0) {
  //     hasInvalidVideo = true;
  //     invalidSlideNumbers.push(slideIndex);
  //   }
  // });
  
  // if (hasInvalidVideo) {
  //   alert(`Cannot download slideshow. Please set slide timer for slides with videos: ${invalidSlideNumbers.join(', ')}`);
  //   return;
  // }
  
  const hideThumbnails = document.getElementById("hideThumbnails").checked;
  generateInteractiveSlideshowHTML(hideThumbnails);
    };

    // Add hover effect to the download button
    downloadBtn.addEventListener("mouseenter", () => {
      downloadBtn.style.backgroundColor = "#218838";
      downloadBtn.style.transform = "scale(1.05)";
    });

    downloadBtn.addEventListener("mouseleave", () => {
      downloadBtn.style.backgroundColor = "#28a745";
      downloadBtn.style.transform = "scale(1)";
    });

    slidesContainer.appendChild(downloadBtn); // 👉 Append right next to slides
  }
}


function switchSlide(index) {
  slides.forEach((slide, i) => {
    let el = slide.getEl();
    if (el) el.style.display = i + 1 === index ? "block" : "none";
  });

  currentSlideIndex = index;
  window.presentationState.currentSlideIndex = currentSlideIndex;

  // Automatically select the active slide so new components go into it
  const selectedSlide = slides[index - 1];
  if (selectedSlide) {
    editor.select(selectedSlide);
  }

  // ✅ Highlight the current thumbnail
  const allThumbnails = document.querySelectorAll(".thumbnail");
  allThumbnails.forEach((thumb) => {
    const idx = parseInt(thumb.getAttribute("data-slide-index"));
    thumb.classList.toggle("active-thumbnail", idx === index);
  });
}

function askTransitionSettings(slideIndex) {
  const transition = transitions[slideIndex] || {
    type: "none",
    duration: 0,
    direction: "none",
    slideTimer: 0,
    isHidden: false,
    wordToHide: "",
    slideInput: "False",
    hasMusic: false,
    musicFile: null,
    musicLoop: false
  };

  const slide = slides[slideIndex - 1];
  const slideEl = slide?.view?.el;

  // Check for video
  const video = slideEl?.querySelector("video");

  // Check for input fields (input, select, textarea, contenteditable elements)
  const hasInputs = !!slideEl?.querySelector("input, select, textarea, [contenteditable='true']");

  editor.Modal.setTitle(`Transition for Slide ${slideIndex}`);
  editor.Modal.setContent(`
    <div>
      <label for="transitionType">Transition Type:</label>
      <select id="transitionType" class="form-control">
        <option value="none" ${transition.type === "none" ? "selected" : ""}>None</option>
        <option value="fade" ${transition.type === "fade" ? "selected" : ""}>Fade</option>
        <option value="slide" ${transition.type === "slide" ? "selected" : ""}>Slide</option>
        <option value="zoom" ${transition.type === "zoom" ? "selected" : ""}>Zoom</option>
      </select>

      <label for="transitionDuration" style="margin-top: 10px;">Transition Duration (seconds):</label>
      <input type="number" id="transitionDuration" class="form-control" min="0" step="0.1" value="${transition.duration || 0}" /><br>

      <label for="slideTimer" style="margin-top: 10px;">Slide Timer (seconds):</label>
      <input type="number" id="slideTimer" class="form-control" min="0" step="0.1" value="${transition.slideTimer || 0}" />

      <div id="directionField" style="display:${transition.type === "slide" ? "block" : "none"}; margin-top: 10px;">
        <label for="transitionDirection">Direction:</label>
        <select id="transitionDirection" class="form-control">
          <option value="left" ${transition.direction === "left" ? "selected" : ""}>Left</option>
          <option value="right" ${transition.direction === "right" ? "selected" : ""}>Right</option>
          <option value="up" ${transition.direction === "up" ? "selected" : ""}>Up</option>
          <option value="down" ${transition.direction === "down" ? "selected" : ""}>Down</option>
        </select>
      </div>

      <label for="hideSlide" style="margin-top: 10px;">
        <input type="checkbox" id="hideSlide" ${transition.isHidden ? "checked" : ""} />
        Hide Slide in Downloaded Slideshow
      </label>

      <div id="wordToHideDiv" style="display:${transition.isHidden ? "block" : "none"}; margin-top: 10px;">
        <label for="wordToHide">Enter word to hide this slide:</label>
        <input type="text" id="wordToHide" class="form-control" value="${transition.wordToHide || ""}" />
      </div>

      ${hasInputs ? `
        <label style="margin-top: 10px;">
          <input type="checkbox" id="stopOnInput" ${transition.slideInput === "True" ? "checked" : ""} />
          Stop on Input Fields
        </label>
      ` : ""}
      <hr style="margin: 20px 0;">
      <h5>Slide Music</h5>
      
      <label for="addMusic" style="margin-top: 10px;">
        <input type="checkbox" id="addMusic" ${transition.hasMusic ? "checked" : ""} />
        Add Music to This Slide
      </label>

      <div id="musicOptions" style="display:${transition.hasMusic ? "block" : "none"}; margin-top: 10px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
        <label for="musicFile">Select Audio File:</label>
        <input type="file" id="musicFile" class="form-control" accept="audio/*" style="margin-top: 5px;" />
        
        <div style="margin-top: 10px;">
          <label>Playback Mode:</label><br>
          <label style="margin-right: 15px;">
            <input type="radio" name="musicMode" value="single" ${!transition.musicLoop ? "checked" : ""} />
            Play Once
          </label>
          <label>
            <input type="radio" name="musicMode" value="loop" ${transition.musicLoop ? "checked" : ""} />
            Loop
          </label>
        </div>

        ${transition.musicFile ? `
          <div style="margin-top: 10px;">
            <small style="color: green;">✓ Music file already selected</small>
            <button type="button" id="testMusic" class="btn btn-sm btn-secondary" style="margin-left: 10px;">Test</button>
            <button type="button" id="removeMusic" class="btn btn-sm btn-danger" style="margin-left: 5px;">Remove</button>
          </div>
        ` : ""}
      </div>


      <div id="videoWarning" style="color:red;display:none;margin-top:10px;"></div>

      <button id="saveTransition" class="btn btn-primary" style="margin-top: 15px;">Save</button>
    </div>
  `);

  editor.Modal.open();

  // Toggle extra fields
  document.getElementById("hideSlide").addEventListener("change", (e) => {
    document.getElementById("wordToHideDiv").style.display = e.target.checked ? "block" : "none";
  });

  document.getElementById("transitionType").addEventListener("change", (e) => {
    document.getElementById("directionField").style.display = e.target.value === "slide" ? "block" : "none";
  });

  // NEW MUSIC EVENT LISTENERS
  document.getElementById("addMusic").addEventListener("change", (e) => {
    document.getElementById("musicOptions").style.display = e.target.checked ? "block" : "none";
  });

  // Test music button
  const testMusicBtn = document.getElementById("testMusic");
  if (testMusicBtn) {
    testMusicBtn.addEventListener("click", () => {
      if (transition.musicFile) {
        const testAudio = new Audio(`data:audio/mp3;base64,${transition.musicFile}`);
        testAudio.volume = 0.5;
        testAudio.play().catch(e => console.log("Test audio failed:", e));
        setTimeout(() => {
          testAudio.pause();
          testAudio.currentTime = 0;
        }, 3000);
      }
    });
  }

  // Remove music button
  const removeMusicBtn = document.getElementById("removeMusic");
  if (removeMusicBtn) {
    removeMusicBtn.addEventListener("click", () => {
      transition.musicFile = null;
      transition.hasMusic = false;
      document.getElementById("addMusic").checked = false;
      document.getElementById("musicOptions").style.display = "none";
      alert("Music removed from this slide.");
    });
  }

  // Video Duration Handling
  const slideTimerInput = document.getElementById("slideTimer");
  const warning = document.getElementById("videoWarning");
  let videoDuration = 0;
  let timerAlreadyValid = !isNaN(transition.slideTimer) && transition.slideTimer > 0;

  if (video) {
    const updateIfValid = () => {
      if (!isNaN(video.duration) && isFinite(video.duration) && video.duration > 0) {
        videoDuration = video.duration;
        if (!timerAlreadyValid || parseFloat(slideTimerInput.value) <= videoDuration) {
          slideTimerInput.value = videoDuration.toFixed(1);
        }
        slideTimerInput.min = videoDuration.toFixed(1);
        warning.style.display = "block";
        warning.innerText = `This slide contains a video of ${videoDuration.toFixed(1)}s. Slide timer must be ≥ video length.`;
      }
    };

    if (video.readyState >= 1) {
      updateIfValid();
    } else {
      video.addEventListener("loadedmetadata", updateIfValid);
      try {
        video.play().then(() => video.pause()).catch(() => {});
      } catch (e) {}
    }
  }

  // Save button handler
  document.getElementById("saveTransition").addEventListener("click", () => {
    const slideTimer = parseFloat(slideTimerInput.value);
    if (video && videoDuration > 0 && slideTimer < videoDuration) {
      alert(`Slide timer must be at least ${videoDuration.toFixed(1)} seconds due to embedded video.`);
      return;
    }
    saveTransition(slideIndex, hasInputs);
  });
}

function saveTransition(slideIndex, hasInputs) {
  const type = document.getElementById("transitionType").value;
  let transitionDuration = parseFloat(document.getElementById("transitionDuration").value);
  let slideTimer = parseFloat(document.getElementById("slideTimer").value);
  const direction = type === "slide" ? document.getElementById("transitionDirection").value : "none";
  const isHidden = document.getElementById("hideSlide").checked;
  const wordToHide = document.getElementById("wordToHide").value.trim();

  const inputCheckbox = document.getElementById("stopOnInput");
  const slideInput = hasInputs && inputCheckbox?.checked ? "True" : "False";

  // Music handling
  const hasMusic = document.getElementById("addMusic").checked;
  const musicLoop = hasMusic ? document.querySelector('input[name="musicMode"]:checked').value === "loop" : false;
  const musicFileInput = document.getElementById("musicFile");

  if (isNaN(transitionDuration)) transitionDuration = 0;
  if (isNaN(slideTimer)) slideTimer = 0;

  // Handle music file upload
  if (hasMusic && musicFileInput.files.length > 0) {
    const file = musicFileInput.files[0];
    const reader = new FileReader();
    
    reader.onload = function(e) {
      const base64String = e.target.result.split(',')[1]; // Remove data:audio/...;base64, prefix
      
      // Store in transition object
      transitions[slideIndex] = {
        type,
        transitionDuration,
        direction,
        slideTimer,
        isHidden,
        wordToHide: wordToHide || "",
        slideInput,
        hasMusic,
        musicFile: base64String,
        musicLoop
      };

      updateSlideAttributes(slideIndex);
      editor.Modal.close();
      switchSlide(currentSlideIndex);
    };
    
    reader.readAsDataURL(file);
  } else {
    // No new file uploaded, keep existing music data
    transitions[slideIndex] = {
      type,
      transitionDuration,
      direction,
      slideTimer,
      isHidden,
      wordToHide: wordToHide || "",
      slideInput,
      hasMusic,
      musicFile: hasMusic ? (transitions[slideIndex].musicFile || null) : null,
      musicLoop
    };

    updateSlideAttributes(slideIndex);
    editor.Modal.close();
    switchSlide(currentSlideIndex);
  }
}

function updateSlideAttributes(slideIndex) {
  const slide = slides[slideIndex - 1];
  const transition = transitions[slideIndex];
  
  if (slide) {
    slide.addAttributes({
      "data-transition-type": transition.type,
      "data-transition-duration": transition.transitionDuration,
      "data-transition-direction": transition.direction,
      "data-slide-timer": transition.slideTimer,
      "data-hide": transition.isHidden ? "true" : "false",
      "data-word-to-hide": transition.wordToHide || "",
      "data-slide-input": transition.slideInput,
      "data-has-music": transition.hasMusic ? "true" : "false",
      "data-music-loop": transition.musicLoop ? "true" : "false"
    });
  }
}

// Global variable to store sound file path
let slideshowSoundPath = null;

function askForSoundFile() {
  editor.Modal.setTitle("Add Background Sound");
  editor.Modal.setContent(`
    <div>
      <label for="soundFilePath">Sound File Path (.mp3):</label>
      <input type="text" id="soundFilePath" class="form-control" placeholder="Enter local file path or server URL" value="${slideshowSoundPath || ''}" style="margin-top: 10px;" />
      <small class="form-text text-muted">Example: ./sounds/background.mp3 or https://example.com/audio.mp3</small>
      
      <div style="margin-top: 15px;">
        <button id="testSound" class="btn btn-secondary" style="margin-right: 10px;">Test Sound</button>
        <button id="removeSoundBtn" class="btn btn-danger" style="margin-right: 10px;">Remove Sound</button>
        <button id="confirmSound" class="btn btn-primary">Confirm</button>
      </div>
    </div>
  `);

  editor.Modal.open();

  // Test sound button
  document.getElementById("testSound").addEventListener("click", () => {
    const soundPath = document.getElementById("soundFilePath").value.trim();
    if (soundPath) {
      const testAudio = new Audio(soundPath);
      testAudio.volume = 0.5;
      testAudio.play().catch(e => {
        alert("Cannot play audio. Please check the file path.");
      });
      
      // Stop test audio after 3 seconds
      setTimeout(() => {
        testAudio.pause();
        testAudio.currentTime = 0;
      }, 3000);
    } else {
      alert("Please enter a sound file path first.");
    }
  });

  // Remove sound button
  document.getElementById("removeSoundBtn").addEventListener("click", () => {
    slideshowSoundPath = null;
    document.getElementById("soundFilePath").value = "";
    alert("Background sound removed.");
  });

  // Confirm button
  document.getElementById("confirmSound").addEventListener("click", () => {
    const soundPath = document.getElementById("soundFilePath").value.trim();
    if (soundPath) {
      slideshowSoundPath = soundPath;
      alert("Background sound added successfully!");
    } else {
      slideshowSoundPath = null;
    }
    editor.Modal.close();
  });
}

async function generateInteractiveSlideshowHTML(hideThumbnails = false)  { 
  const uploadedId = localStorage.getItem('uploadedFileId');
  console.log('Previously uploaded ID:', uploadedId);
  const iframe = document.querySelector('#editor iframe'); 
  const iframeDoc = iframe?.contentDocument || iframe?.contentWindow?.document; 
  const slideElements = iframeDoc?.querySelectorAll('[data-slide]'); 
  
  if (!slideElements?.length) { 
    alert('No slides found!'); 
    return; 
  } 
  
  const slideData = []; 
  const editorHtml = editor.getHtml(); 
  const editorCss = editor.getCss(); 
  
  const styles = (editor.canvas && editor.canvas.styles) || []; 
  const scripts = (editor.canvas && editor.canvas.scripts) || []; 
  
  for (let i = 0; i < slideElements.length; i++) { 
    const el = slideElements[i]; 
    const slideIndex = i + 1; 
    
    slideElements.forEach((s, idx) => s.style.display = idx === i ? 'block' : 'none'); 
    await new Promise(r => setTimeout(r, 800)); 
    
    const computed = getComputedStyle(el); 
    const width = parseFloat(computed.width); 
    const height = parseFloat(computed.height); 
    const img = encodeURIComponent(el.innerHTML); 
    const transition = parseFloat(el.getAttribute("data-transition-duration")) || 0; 
    const display = parseFloat(el.getAttribute("data-slide-timer")) || 1; 
    const type = el.getAttribute("data-transition-type") || "fade"; 
    const dir = el.getAttribute("data-transition-direction") || "left"; 
    const backgroundColor = computed.backgroundColor || "#fff"; 
    const isHidden = el.getAttribute("data-hide") === "true"; 
    const wordToHide = el.getAttribute("data-word-to-hide") || ""; 
    const slideInput = el.getAttribute("data-slide-input"); 
    const hasMusic = el.getAttribute("data-has-music") === "true";
    const musicLoop = el.getAttribute("data-music-loop") === "true";
    const musicFile = hasMusic ? transitions[slideIndex]?.musicFile : null;

    
    // Check for video in slide
    const videoElement = el.querySelector('video');
    const hasVideo = videoElement !== null;
    let videoSrc = null;
    
    if (hasVideo) {
      videoSrc = videoElement.getAttribute('src') || 
                 (videoElement.querySelector('source') ? videoElement.querySelector('source').getAttribute('src') : null);
    }
    
    if (isHidden && !wordToHide) { 
      continue; 
    } 
    
    if (isHidden && wordToHide) { 
      const jsonDataString = localStorage.getItem("common_json"); 
      const jsonData = JSON.parse(jsonDataString || "{}"); 
      const custom_language = localStorage.getItem("language") || "english"; 
      const divs = el.querySelectorAll("div[id]"); 
      let matchFound = false; 
      
      divs.forEach((div) => { 
        const divId = div.id; 
        const styleContent = editor.getCss(); 
        const regex = new RegExp(`#${divId}\\s*{[^}]*my-input-json:\\s*([^;]+);`, "i"); 
        const match = regex.exec(styleContent); 
        
        if (match) { 
          const jsonKey = match[1].trim(); 
          const value = jsonData?.[custom_language]?.[jsonKey]; 
          if (typeof value === "string" && value.includes(wordToHide)) { 
            matchFound = true; 
          } 
        } 
      }); 
      
      if (matchFound) { 
        continue; 
      } 
    } 
    
    slideData.push({ 
      img, 
      width, 
      height, 
      transition, 
      display, 
      type, 
      dir, 
      backgroundColor,
      hasVideo,
      videoSrc,
      slideInput,
      hasMusic,
      musicFile,
      musicLoop
    }); 
  } 
  
  const totalDuration = slideData.reduce((acc, s) => acc + s.transition + s.display, 0); 

  // Check if the HTML content from the editor contains a table 
  const containsTable = editorHtml.includes('<table'); 
  const tableInitializationScript = containsTable ? 
    `<script> 
      $(document).ready(function() { 
        $('table').DataTable({ 
          dom: 'Bfrtip', 
          buttons: ['copy', 'csv', 'excel', 'pdf', 'print'] 
        }); 
      }); 
    </script>` : ''; 
  

const dragDropScript = `
<script>
  // Drag and Drop functionality for custom input components
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing custom input drag and drop...');
    
    // Setup draggable buttons
    const buttons = document.querySelectorAll('[data-custom-input-button="true"]');
    buttons.forEach(button => {
      button.setAttribute('draggable', 'true');
      button.style.cursor = 'grab';
      
      button.addEventListener('dragstart', function(e) {
        console.log('Drag started for button:', this.getAttribute('name'), 'value:', this.getAttribute('value'));
        
        const buttonData = {
          name: this.getAttribute('name') || '',
          value: this.getAttribute('value') || this.innerText,
          type: 'custom-button'
        };
        
        e.dataTransfer.setData('text/plain', JSON.stringify(buttonData));
        e.dataTransfer.effectAllowed = 'copy';
        this.style.opacity = '0.7';
      });
      
      button.addEventListener('dragend', function(e) {
        this.style.opacity = '';
      });
      
      button.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.05)';
        this.style.transition = 'transform 0.2s ease';
      });
      
      button.addEventListener('mouseleave', function() {
        this.style.transform = '';
      });
    });
    
    // Setup drop zones
    const dropzones = document.querySelectorAll('[data-custom-dropzone="true"]');
    dropzones.forEach(dropzone => {
      dropzone.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      });
      
      
      dropzone.addEventListener('drop', function(e) {
        e.preventDefault();
        console.log('Drop event on dropzone:', this.getAttribute('name'));
        
        try {
          const data = e.dataTransfer.getData('text/plain');
          let buttonInfo = JSON.parse(data);
          
          // CHECK NAME MATCHING
          var dropzoneName = this.getAttribute('name');
          var buttonName = buttonInfo.name;
          
          console.log('Checking names - Button:', buttonName, 'Dropzone:', dropzoneName);
          
          if (buttonName !== dropzoneName) {
            alert('Error: Button name "' + buttonName + '" does not match dropzone name "' + dropzoneName + '"');
            return;
          }
          
          if (buttonInfo && buttonInfo.value) {
            console.log('Setting dropzone value to:', buttonInfo.value);
            this.value = buttonInfo.value;
            this.setAttribute('value', buttonInfo.value);
            this.dispatchEvent(new Event('change', { bubbles: true }));
            this.dispatchEvent(new Event('input', { bubbles: true }));
          }
        } catch (error) {
          console.error('Error handling drop:', error);
        }
      });
    });
    
    console.log('Custom input drag and drop initialization complete');
  });
</script>
`;

// THEN UPDATE the headContent to include dragDropScript:
const headContent = [
  `<style>${editorCss}</style>`,
  ...styles.map(url => `<link rel="stylesheet" href="${url}">`),
  ...scripts.map(url => `<script src="${url}"></script>`),
  dragDropScript, // ADD this line back
  tableInitializationScript
].join('');
 const fullHTML = `<!DOCTYPE html> 
<html lang="en"> 
<head> 
  <meta charset="UTF-8" /> 
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/> 
  <title>Interactive Slideshow</title> 
  ${headContent} 
  <!-- External Styles --> 
  <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css"> 
  <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.8.2/css/all.css"> 
  <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"> 
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.5.0/css/bootstrap.min.css"> 
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/mdbootstrap/4.19.1/css/mdb.min.css"> 
  <link rel="stylesheet" href="https://cdn.datatables.net/v/bs4/dt-1.13.2/datatables.min.css"> 
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"> 
  <link rel="stylesheet" href="https://cdn.datatables.net/1.10.13/css/jquery.dataTables.min.css"> 
  <link rel="stylesheet" href="https://cdn.datatables.net/buttons/1.2.4/css/buttons.dataTables.min.css"> 
  <!-- External Scripts --> 
  <script src="https://code.jquery.com/jquery-3.3.1.slim.min.js"></script> 
  <script src="https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js"></script> 
  <script src="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js"></script> 
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script> 
  <script src="https://code.jquery.com/jquery-2.1.1.min.js"></script> 
  <script src="https://cdn.datatables.net/1.10.13/js/jquery.dataTables.min.js"></script> 
  <script src="https://cdn.datatables.net/buttons/1.2.4/js/dataTables.buttons.min.js"></script> 
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/2.5.0/jszip.min.js"></script> 
  <script src="https://cdn.rawgit.com/bpampuch/pdfmake/0.1.24/build/pdfmake.min.js"></script> 
  <script src="https://cdn.rawgit.com/bpampuch/pdfmake/0.1.24/build/vfs_fonts.js"></script> 
  <script src="https://cdn.datatables.net/buttons/1.2.4/js/buttons.html5.min.js"></script> 
  <script src="https://cdn.datatables.net/buttons/1.2.1/js/buttons.print.min.js"></script> 
  <script src="https://code.highcharts.com/highcharts.js"></script> 
  <script src="https://code.highcharts.com/modules/drilldown.js"></script> 
  <script>
    // Form submission handler
    document.addEventListener('DOMContentLoaded', function() {
      // Handle all form submissions
      document.addEventListener('submit', function(e) {
        var form = e.target;
        if (form.tagName === 'FORM') {
          e.preventDefault();
          
          var action = form.getAttribute('action');
          var method = form.getAttribute('method') || 'GET';
          var formData = new FormData(form);
          
          // Show loading indicator (optional)
          var submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
          var originalText = '';
          if (submitBtn) {
            originalText = submitBtn.textContent || submitBtn.value;
            if (submitBtn.tagName === 'BUTTON') {
              submitBtn.textContent = 'Sending...';
            } else {
              submitBtn.value = 'Sending...';
            }
            submitBtn.disabled = true;
          }
          
          // Convert FormData to object
          var data = {};
          formData.forEach(function(value, key) {
            data[key] = value;
          });
          
          // Make AJAX request
          if (action) {
            var xhr = new XMLHttpRequest();
            xhr.open(method.toUpperCase(), action, true);
            
            xhr.onload = function() {
              if (xhr.status >= 200 && xhr.status < 300) {
                console.log('Form submitted successfully:', xhr.responseText);
                
                // Handle response - you can customize this part
                try {
                  var response = JSON.parse(xhr.responseText);
                  // Display response in the form or elsewhere
                  handleFormResponse(form, response);
                } catch (e) {
                  console.log('Response is not JSON:', xhr.responseText);
                }
                
                // Trigger custom event
                form.dispatchEvent(new CustomEvent('formSubmitSuccess', {
                  detail: { response: xhr.responseText }
                }));
              } else {
                console.error('Form submission failed:', xhr.status);
                alert('Form submission failed. Please try again.');
                
                form.dispatchEvent(new CustomEvent('formSubmitError', {
                  detail: { status: xhr.status, response: xhr.responseText }
                }));
              }
              
              // Reset button
              if (submitBtn) {
                if (submitBtn.tagName === 'BUTTON') {
                  submitBtn.textContent = originalText;
                } else {
                  submitBtn.value = originalText;
                }
                submitBtn.disabled = false;
              }
            };
            
            xhr.onerror = function() {
              console.error('Network error during form submission');
              alert('Network error. Please check your connection.');
              
              // Reset button
              if (submitBtn) {
                if (submitBtn.tagName === 'BUTTON') {
                  submitBtn.textContent = originalText;
                } else {
                  submitBtn.value = originalText;
                }
                submitBtn.disabled = false;
              }
            };
            
            if (method.toUpperCase() === 'POST') {
              xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
              xhr.send(new URLSearchParams(data).toString());
            } else {
              // For GET requests, append data to URL
              var params = new URLSearchParams(data).toString();
              xhr.open('GET', action + (action.includes('?') ? '&' : '?') + params, true);
              xhr.send();
            }
          }
        }
      });
      
      // Custom function to handle form responses
      function handleFormResponse(form, response) {
        try {
          const formKey = form.getAttribute('id') || form.getAttribute('action') || 'global-form-response';
          sessionStorage.setItem('formResponse', JSON.stringify(response));
        } catch (e) {
          console.error('Failed to store form response in sessionStorage:', e);
        }
      }
    });
  </script>
  <style> 
  html, body { 
    margin: 0; 
    padding: 0; 
    background: #FFFFFF; 
    width: 100%; 
    height: 100%; 
    overflow: hidden; 
    font-family: 'Roboto', sans-serif;
  } 
  
  .slide { 
    position: absolute; 
    top: 50%; 
    left: 50%; 
    display: none; 
    opacity: 0; 
    transform: translate(-50%, -50%); 
    transition: opacity 0.5s ease, transform 0.5s ease; 
  } 
  
  /* Hide video controls */
  .slide video {
    pointer-events: none;
  }
  
  .slide video::-webkit-media-controls {
    display: none !important;
  }
  
  .slide video::-webkit-media-controls-panel {
    display: none !important;
  }
  
  .slide video::-webkit-media-controls-play-button {
    display: none !important;
  }
  
  .slide video::-webkit-media-controls-start-playback-button {
    display: none !important;
  }
  
  .slide video::-webkit-media-controls-timeline {
    display: none !important;
  }
  
  .slide video::-webkit-media-controls-current-time-display {
    display: none !important;
  }
  
  .slide video::-webkit-media-controls-time-remaining-display {
    display: none !important;
  }
  
  .slide video::-webkit-media-controls-mute-button {
    display: none !important;
  }
  
  .slide video::-webkit-media-controls-volume-slider {
    display: none !important;
  }
  
  .slide video::-webkit-media-controls-fullscreen-button {
    display: none !important;
  }
  
  .slide video::-webkit-media-controls-picture-in-picture-button {
    display: none !important;
  }
  
  .controls { 
    position: absolute; 
    bottom: 15px; 
    left: 50%; 
    transform: translateX(-50%); 
    display: flex; 
    gap: 15px; 
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 10;
  } 
  
  .controls.visible {
    opacity: 1;
  }
  
  .controls button { 
    width: 55px;
    height: 55px;
    font-size: 20px; 
    background: linear-gradient(145deg, #2c2c2c, #1a1a1a);
    color: white; 
    border: none; 
    border-radius: 50%; 
    cursor: pointer; 
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2),
                inset 0 2px 2px rgba(255,255,255,0.1);
  } 
  
  .controls button:hover {
    background: linear-gradient(145deg, #333333, #222222);
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 6px 20px rgba(0,0,0,0.25),
                inset 0 2px 2px rgba(255,255,255,0.1);
  }
  
  .controls button:active {
    transform: translateY(1px);
    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  }
  
  .controls button i {
    text-shadow: 0 2px 4px rgba(0,0,0,0.3);
  }
  
  #progressContainer { 
    position: absolute; 
    bottom: 0; 
    left: 0; 
    width: 100%; 
    height: 10px; 
    background: rgba(0,0,0,0.3); 
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.3s ease, height 0.2s ease;
    z-index: 5;
  } 
  
  #progressContainer.visible {
    opacity: 1;
  }
  
  #progressContainer:hover {
    height: 16px;
  }
  
  #progressBar { 
    height: 100%; 
    width: 0%; 
    background: linear-gradient(90deg, #ff3636, #ff5252);
    box-shadow: 0 0 8px rgba(255,50,50,0.5);
    transition: width 0.2s linear; 
    position: relative; 
    z-index: 1; 
  } 
  
  #progressBar::after {
    content: '';
    position: absolute;
    right: -8px;
    top: 50%;
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    background: #ff3636;
    border-radius: 50%;
    box-shadow: 0 0 10px rgba(255,50,50,0.8);
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  #progressContainer:hover #progressBar::after {
    opacity: 1;
  }
  
  .marker { 
    position: absolute; 
    top: 0; 
    bottom: 0; 
    width: 3px; 
    background-color: rgba(0, 0, 0, 0.6); 
    z-index: 2;
    box-shadow: 0 0 5px rgba(0, 0, 0, 0.3);
  } 
  
  #timeLabel { 
    position: absolute; 
    bottom: 20px; 
    right: 20px; 
    font-size: 14px; 
    color: #fff; 
    background: rgba(0,0,0,0.7);
    padding: 6px 10px;
    border-radius: 20px;
    font-family: 'Roboto', sans-serif;
    font-weight: 500;
    letter-spacing: 0.5px;
    opacity: 0;
    transition: opacity 0.3s ease;
    box-shadow: 0 3px 10px rgba(0,0,0,0.2);
  } 
  
  #timeLabel.visible {
    opacity: 1;
  }

  /* Thumbnail Navigation Styles */
  #thumbnailContainer {
    position: absolute;
    bottom: 25px;
    left: 0;
    width: 100%;
    height: 90px;
    display: ${hideThumbnails ? 'none' : 'flex'}; 
    overflow-x: auto;
    padding: 10px 20px;
    opacity: 0;
    transition: opacity 0.3s ease;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.3) transparent;
    z-index: 4;
  }
  
  #thumbnailContainer::-webkit-scrollbar {
    height: 6px;
  }
  
  #thumbnailContainer::-webkit-scrollbar-track {
    background: transparent;
  }
  
  #thumbnailContainer::-webkit-scrollbar-thumb {
    background-color: rgba(255,255,255,0.3);
    border-radius: 6px;
  }
  
  #thumbnailContainer.visible {
    opacity: 1;
  }
  
  .thumbnail {
    min-width: 120px;
    height: 70px;
    margin: 0 6px;
    background-color: #000;
    background-image: url('https://blogs.windows.com/wp-content/uploads/prod/sites/44/2022/09/photos-newicon.png');
    background-size: cover;
    background-position: center;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid rgba(255,255,255,0.2);
    border-radius: 6px;
    position: relative;
    overflow: hidden;
    transition: transform 0.2s ease, border-color 0.2s ease;
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  }
  
  .thumbnail:hover {
    transform: scale(1.08);
    border-color: rgba(255,255,255,0.7);
  }
  
  .thumbnail.active {
    border: 3px solid #ff3636;
    box-shadow: 0 0 15px rgba(255, 50, 50, 0.5);
  }

  .thumbnail-label {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    text-align: center;
    color: white;
    font-size: 16px;
    padding: 5px 0;
    font-weight: bold;
    text-shadow: 0 1px 2px rgba(0,0,0,0.8);
  }
  </style> 
</head> 
<body> 
  ${slideData.map((s, i) => `<div class="slide" id="slide-${i}" style="width:${s.width}px;height:${s.height}px;background-color:${s.backgroundColor};"> 
    ${decodeURIComponent(s.img)} 
  </div>`).join('')} 
  
  <!-- Thumbnail Navigation -->
<div id="thumbnailContainer">
  ${slideData.map((s, i) => {
    const slideIndex = i + 1;
    const displayName = thumbnailNames[slideIndex] || `Slide ${slideIndex}`;
    return `<div class="thumbnail" id="thumb-${i}" onclick="jumpToSlide(${i})">
      <div class="thumbnail-label">${displayName}</div>
    </div>`;
  }).join('')}
</div>
  
  <!-- Background Audio -->
  ${slideshowSoundPath ? `<audio id="backgroundAudio" loop preload="auto"><source src="${slideshowSoundPath}" type="audio/mpeg"></audio>` : ''}
  
  <div class="controls"> 
    <button onclick="togglePlay()" id="playBtn"><i class="fas fa-pause"></i></button> 
  </div> 
  <div id="progressContainer" onclick="seek(event)"> 
    <div id="progressBar"></div> 
  </div> 
  <div id="timeLabel">00:00 / 00:00</div> 
  
  <script> 
  const slides = [...document.querySelectorAll('.slide')];
console.log("slides:", slides);

const thumbnails = [...document.querySelectorAll('.thumbnail')];
console.log("thumbnails:", thumbnails);

const slideData = ${JSON.stringify(slideData)};
console.log("slideData:", slideData);

const totalTime = ${totalDuration};
console.log("totalTime:", totalTime);

const progressBar = document.getElementById("progressBar");
console.log("progressBar:", progressBar);

const timeLabel = document.getElementById("timeLabel");
console.log("timeLabel:", timeLabel);

const ID = ${uploadedId};
console.log("Id is: ", ID);

let currentSlideAudio = null;
let slideAudioStarted = false;

function setupSlideAudio() {
  // Stop and cleanup previous slide audio
  if (currentSlideAudio) {
    currentSlideAudio.pause();
    currentSlideAudio.currentTime = 0;
    currentSlideAudio = null;
    slideAudioStarted = false;
  }

  // Setup new slide audio if exists
  if (slideData[current].hasMusic && slideData[current].musicFile) {
    currentSlideAudio = new Audio(\`data:audio/mp3;base64,\${slideData[current].musicFile}\`);
    currentSlideAudio.volume = 0.7;
    currentSlideAudio.loop = slideData[current].musicLoop;
    
    // If we're in display phase and playing, start the audio
    if (playing && phase === 'display') {
      slideAudioStarted = true;
      currentSlideAudio.play().catch(e => console.log('Slide audio play failed:', e));
    }
  }
}

function startSlideAudio() {
  if (currentSlideAudio && !slideAudioStarted && playing) {
    slideAudioStarted = true;
    currentSlideAudio.currentTime = 0;
    currentSlideAudio.play().catch(e => console.log('Slide audio play failed:', e));
  }
}

function pauseSlideAudio() {
  if (currentSlideAudio && !currentSlideAudio.paused) {
    currentSlideAudio.pause();
  }
}

function resumeSlideAudio() {
  if (currentSlideAudio && slideAudioStarted && currentSlideAudio.paused) {
    currentSlideAudio.play().catch(e => console.log('Slide audio resume failed:', e));
  }
}

function stopSlideAudio() {
  if (currentSlideAudio) {
    currentSlideAudio.pause();
    currentSlideAudio.currentTime = 0;
    slideAudioStarted = false;
  }
}

// Background audio setup
const backgroundAudio = document.getElementById('backgroundAudio');
console.log("Background audio:", backgroundAudio);
let backgroundAudioStarted = false;
  
  // Video sync variables
  let currentVideo = null;
  let videoSyncMode = false;
  let videoStartTime = 0;
  let slideDisplayStartTime = 0
  // Video loading state
let videoLoading = false;
let videoLoadTimeout = null;
  
  // Input validation variables
  let waitingForInput = false;
  let inputValidationListener = null;
  
  // Add slide boundary markers 
  const progressContainer = document.getElementById("progressContainer"); 
  let accumulated = 0; 
  for (let i = 0; i < slideData.length - 1; i++) { 
    accumulated += slideData[i].transition + slideData[i].display; 
    const pct = (accumulated / totalTime) * 100; 
    const marker = document.createElement('div'); 
    marker.className = 'marker'; 
    marker.style.left = pct + '%'; 
    progressContainer.appendChild(marker); 
  } 
  
  let current = 0; 
  let phase = 'transition'; 
  let remaining = slideData[0].transition; 
  let elapsed = 0; 
  let playing = true; 
  let last = null; 
  let rafId; 
  
  // Background audio functions
  function startBackgroundAudio() {
    if (backgroundAudio && !backgroundAudioStarted) {
      backgroundAudio.volume = 0.3; // Set volume to 30%
      backgroundAudio.currentTime = 0;
      backgroundAudio.play().catch(e => {
        console.log('Background audio play failed:', e);
      });
      backgroundAudioStarted = true;
    }
  }
  
  function pauseBackgroundAudio() {
    if (backgroundAudio) {
      backgroundAudio.pause();
    }
  }
  
  function resumeBackgroundAudio() {
    if (backgroundAudio && backgroundAudioStarted) {
      backgroundAudio.play().catch(e => {
        console.log('Background audio resume failed:', e);
      });
    }
  }
  
  function stopBackgroundAudio() {
    if (backgroundAudio) {
      backgroundAudio.pause();
      backgroundAudio.currentTime = 0;
      backgroundAudioStarted = false;
    }
  }
  
  function format(t) { 
    const m = Math.floor(t / 60).toString().padStart(2, '0'); 
    const s = Math.floor(t % 60).toString().padStart(2, '0'); 
    return m + ':' + s; 
  } 
  
  function updateProgressUI() { 
    const percent = (elapsed / totalTime) * 100; 
    progressBar.style.width = percent + '%'; 
    timeLabel.textContent = format(elapsed) + ' / ' + format(totalTime); 
    
    // Update active thumbnail
    thumbnails.forEach((thumb, i) => {
      thumb.classList.toggle('active', i === current);
    });
  } 
  
  function getCurrentSlideVideo() {
    const slideElement = slides[current];
    return slideElement ? slideElement.querySelector('video') : null;
  }
  
  function setupVideoSync() {
  // Clear any existing video references and listeners
  if (currentVideo) {
    currentVideo.removeEventListener('loadedmetadata', onVideoLoaded);
    currentVideo.removeEventListener('timeupdate', onVideoTimeUpdate);
    currentVideo.removeEventListener('ended', onVideoEnded);
    currentVideo.removeEventListener('contextmenu', preventContextMenu);
    currentVideo.removeEventListener('canplay', onVideoCanPlay);
    currentVideo.removeEventListener('waiting', onVideoWaiting);
    currentVideo.removeEventListener('error', onVideoError);
    currentVideo.removeEventListener('play', onVideoPlay);
    currentVideo.pause();
    currentVideo.currentTime = 0;
  }
  
  currentVideo = getCurrentSlideVideo();
  
  if (currentVideo && slideData[current].hasVideo) {
    videoSyncMode = true;
    videoLoading = false; // Reset loading state
    
    // Clear any existing timeout
    if (videoLoadTimeout) {
      clearTimeout(videoLoadTimeout);
      videoLoadTimeout = null;
    }
    
    // Add event listeners
    currentVideo.addEventListener('loadedmetadata', onVideoLoaded);
    currentVideo.addEventListener('timeupdate', onVideoTimeUpdate);
    currentVideo.addEventListener('ended', onVideoEnded);
    currentVideo.addEventListener('contextmenu', preventContextMenu);
    currentVideo.addEventListener('canplay', onVideoCanPlay);
    currentVideo.addEventListener('waiting', onVideoWaiting);
    currentVideo.addEventListener('error', onVideoError);
    currentVideo.addEventListener('play', onVideoPlay);
    
    // Set video attributes to hide controls
    currentVideo.setAttribute('controls', false);
    currentVideo.setAttribute('controlsList', 'nodownload nofullscreen noremoteplaybook');
    currentVideo.setAttribute('disablePictureInPicture', true);
    
    // Reset video to beginning
    currentVideo.currentTime = 0;
    
    // If we're in display phase and playing, start video immediately
    if (playing && phase === 'display') {
      currentVideo.play().catch(e => console.log('Video play failed:', e));
    }
  } else {
    videoSyncMode = false;
    currentVideo = null;
    videoLoading = false;
  }
}
  
  function preventContextMenu(event) {
    event.preventDefault();
  }
  
  function onVideoLoaded() {
  // Video metadata loaded, ensure it's ready to play
  if (currentVideo) {
    currentVideo.currentTime = 0;
    
    // If we're in display phase and playing, start video
    if (playing && phase === 'display') {
      requestAnimationFrame(() => {
        currentVideo.play().catch(e => console.log('Video play failed:', e));
      });
    }
  }
}
  
  function onVideoTimeUpdate() {
    // Only sync during active playback
    if (!playing || !videoSyncMode || !currentVideo || phase !== 'display') return;
    
    const videoTime = currentVideo.currentTime;
    const slideDisplayTime = slideDisplayStartTime + videoTime;
    
    // Small tolerance for sync differences
    const tolerance = 0.1;
    const expectedTime = elapsed - (getCurrentSlideStartTime() + slideData[current].transition);
    
    if (Math.abs(videoTime - expectedTime) > tolerance) {
      // Sync video to slide timer only during playback
      const targetVideoTime = Math.max(0, expectedTime);
      if (targetVideoTime <= currentVideo.duration) {
        currentVideo.currentTime = targetVideoTime;
      }
    }
  }
  
  function onVideoEnded() {
    // Video has ended, but slide timer might still be running
    // Let the slide timer continue normally
  }

  function onVideoCanPlay() {
  videoLoading = false;
  hideLoadingIndicator();
  
  // Clear timeout
  if (videoLoadTimeout) {
    clearTimeout(videoLoadTimeout);
    videoLoadTimeout = null;
  }
  
  // If we're in display phase and playing, start video
  if (playing && phase === 'display') {
    requestAnimationFrame(() => {
      currentVideo.play().catch(e => console.log('Video play failed:', e));
    });
  }
}

function onVideoWaiting() {
  videoLoading = true;
  showLoadingIndicator();
}

function onVideoError(e) {
  console.error('Video error:', e);
  videoLoading = false;
  hideLoadingIndicator();
  
  // Clear timeout
  if (videoLoadTimeout) {
    clearTimeout(videoLoadTimeout);
    videoLoadTimeout = null;
  }
  
  // Pause slideshow on
  // Pause slideshow on error
 if (playing) {
   togglePlay();
   alert('Video failed to load. Slideshow paused.');
 }
}

function onVideoPlay() {
 // If video starts playing but slideshow is paused, update the UI
 if (!playing && currentVideo && !currentVideo.paused) {
   playing = true;
   document.getElementById("playBtn").innerHTML = '<i class="fas fa-pause"></i>';
   
   // Start the animation loop if not running
   if (!rafId) {
     last = null;
     rafId = requestAnimationFrame(run);
   }
 }
}

function showLoadingIndicator() {
 let loader = document.getElementById('videoLoader');
 if (!loader) {
   loader = document.createElement('div');
   loader.id = 'videoLoader';
   loader.innerHTML = '<div class="spinner"></div><div>Loading video...</div>';
   loader.style.cssText = \`
     position: fixed;
     top: 50%;
     left: 50%;
     transform: translate(-50%, -50%);
     background: rgba(0,0,0,0.8);
     color: white;
     padding: 20px;
     border-radius: 8px;
     z-index: 10000;
     text-align: center;
   \`;
   document.body.appendChild(loader);
   
   // Add spinner styles
   const style = document.createElement('style');
   style.textContent = \`
     .spinner {
       border: 3px solid #f3f3f3;
       border-top: 3px solid #3498db;
       border-radius: 50%;
       width: 40px;
       height: 40px;
       animation: spin 1s linear infinite;
       margin: 0 auto 10px;
     }
     @keyframes spin {
       0% { transform: rotate(0deg); }
       100% { transform: rotate(360deg); }
     }
   \`;
   document.head.appendChild(style);
 }
 loader.style.display = 'block';
}

function hideLoadingIndicator() {
 const loader = document.getElementById('videoLoader');
 if (loader) {
   loader.style.display = 'none';
 }
}
 
 function getCurrentSlideStartTime() {
   let time = 0;
   for (let i = 0; i < current; i++) {
     time += slideData[i].transition + slideData[i].display;
   }
   return time;
 }
 
 function syncVideoToSlideTime() {
 // Only sync during active playback
 if (!playing || !videoSyncMode || !currentVideo || phase !== 'display') return;
 
 const slideStartTime = getCurrentSlideStartTime() + slideData[current].transition;
 const videoTime = elapsed - slideStartTime;
 
 if (videoTime >= 0 && videoTime <= currentVideo.duration) {
   const timeDiff = Math.abs(currentVideo.currentTime - videoTime);
   if (timeDiff > 0.1) { // Only sync if difference is significant
     currentVideo.currentTime = videoTime;
   }
 }
}
 
 function checkInputValidation() {
   if (!slideData[current].slideInput) return true;
   
   const slideElement = slides[current];
   const Inputs = slideElement.querySelectorAll('input, textarea, select');
   
   // Check if all inputs are filled
   for (let input of Inputs) {
     if (!input.value.trim()) {
       return false;
     }
   }
   
   return true;
 }

   function populateFormFromSessionStorage() {
 const slideElement = slides[current];
 const forms = slideElement.querySelectorAll('form');

 // Parse the stored response object from session storage
 const storedDataStr = sessionStorage.getItem('formResponse');
 if (!storedDataStr) return;

 let storedData;
 try {
   storedData = JSON.parse(storedDataStr);
 } catch (err) {
   console.error('Invalid session data:', err);
   return;
 }

 forms.forEach(form => {
   const method = form.getAttribute('method')?.toLowerCase() || '';
   const action = form.getAttribute('action') || '';

   // Only populate forms with method="get" and no action
   if (method === 'get' && action === '') {
     const inputs = form.querySelectorAll('input, textarea, select');

     inputs.forEach(input => {
       const key = input.name;
       if (!key) return;

       const value = storedData[key];
       if (value === undefined || value === null) return;

       if (input.type === 'checkbox') {
         input.checked = value === 'true';
       } else if (input.type === 'radio') {
         if (input.value === value) {
           input.checked = true;
         }
       } else {
         input.value = value;
       }
     });
   }
 });
 
}
 
 function setupInputValidation() {
    console.log("current slide input", slideData[current].slideInput)
   if (slideData[current].slideInput === "False") return;
   
   const slideElement = slides[current];
   const submitButton = slideElement.querySelector('button[type="submit"], input[type="submit"]');
   const Inputs = slideElement.querySelectorAll('input, textarea, select');
   
   if (submitButton && Inputs.length > 0) {
     waitingForInput = true;
     
     // Remove existing listener if any
     if (inputValidationListener) {
       submitButton.removeEventListener('click', inputValidationListener);
     }
     
     // Add new listener
     inputValidationListener = function(event) {
       if (checkInputValidation()) {
         waitingForInput = false;
         // Resume slideshow
         if (!playing) {
           togglePlay();
         }
         submitButton.removeEventListener('click', inputValidationListener);
         inputValidationListener = null;
       }
     };
     
     submitButton.addEventListener('click', inputValidationListener);
     
     // Pause slideshow if it's playing
     if (playing) {
       togglePlay();
     }
   }
 }
 
 // Also update the showSlide function to ensure proper visibility
function showSlide(index) { 
 slides.forEach((s, i) => { 
   if (i === index) {
     s.style.display = 'block';
     // Don't set opacity here - let transition handle it
     const { type, dir } = slideData[i]; 
     if (type === 'zoom') { 
       s.style.transform = 'translate(-50%, -50%) scale(0.8)'; 
     } else if (type === 'slide') { 
       let tx = 0, ty = 0, dist = 100; 
       if (dir === 'left') tx = -dist; 
       if (dir === 'right') tx = dist; 
       if (dir === 'up') ty = -dist; 
       if (dir === 'down') ty = dist; 
       s.style.transform = \`translate(calc(-50% + \${tx}%), calc(-50% + \${ty}%))\`; 
     } else { 
       s.style.transform = 'translate(-50%, -50%)'; 
     }
   } else {
     s.style.display = 'none'; 
     s.style.opacity = 0; 
   }
 }); 
 
 // Populate forms with sessionStorage data
 populateFormFromSessionStorage();

 // Setup video sync for the new slide
 setupVideoSync();

 setupSlideAudio();
 
 // Hide all video controls for the current slide
 const slideVideos = slides[index].querySelectorAll('video');
 slideVideos.forEach(video => {
   video.setAttribute('controls', false);
   video.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback');
   video.setAttribute('disablePictureInPicture', true);
   video.addEventListener('contextmenu', preventContextMenu);
 });

 setupBackButtonNavigation(index);
} 
 
 function renderTransition(progress) { 
   const slide = slides[current]; 
   const { type, dir } = slideData[current]; 
   if (type === 'fade') { 
     slide.style.opacity = progress; 
     slide.style.transform = 'translate(-50%, -50%)'; 
   } else if (type === 'zoom') { 
     slide.style.opacity = 1; 
     slide.style.transform = \`translate(-50%, -50%) scale(\${0.8 + 0.2 * progress})\`; 
   } else if (type === 'slide') { 
     slide.style.opacity = 1; 
     let tx = 0, ty = 0; 
     const dist = 100; 
     if (dir === 'left') tx = -dist * (1 - progress); 
     if (dir === 'right') tx = dist * (1 - progress); 
     if (dir === 'up') ty = -dist * (1 - progress); 
     if (dir === 'down') ty = dist * (1 - progress); 
     slide.style.transform = \`translate(calc(-50% + \${tx}%), calc(-50% + \${ty}%))\`; 
   } 
 } 
 
 function setupBackButtonNavigation(slideIndex) {
  const slideElement = slides[slideIndex];
  const backButtons = slideElement.querySelectorAll('button[navigate-to-slide]');
  
  backButtons.forEach(button => {
    // Remove any existing listeners to prevent duplicates
    button.removeEventListener('click', handleBackButtonClick);
    
    // Add new listener
    button.addEventListener('click', handleBackButtonClick);
  });
}

function handleBackButtonClick(event) {
  event.preventDefault();
  event.stopPropagation();
  
  const targetSlide = event.target.getAttribute('navigate-to-slide');
  console.log('Back button clicked, target slide:', targetSlide);
  
  if (targetSlide) {
    // Convert to 0-based index (slide numbers are 1-based for users)
    const slideIndex = parseInt(targetSlide) - 1;
    console.log('Calculated slide index:', slideIndex);
    
    if (slideIndex >= 0 && slideIndex < slideData.length) {
      jumpToSlide(slideIndex);
    } else {
      console.log('Invalid slide index:', slideIndex);
    }
  } else {
    console.log('No target slide specified');
  }
}

 function run(timestamp) { 
 if (!last) last = timestamp; 
 const delta = (timestamp - last) / 1000; 
 last = timestamp; 
 
 // Don't progress if waiting for input or video is loading
 if (waitingForInput || videoLoading) {
   if (playing) rafId = requestAnimationFrame(run);
   return;
 }
 
 remaining -= delta; 
 elapsed += delta; 
 updateProgressUI(); 
 
 if (phase === 'transition') { 
   const full = slideData[current].transition; 
   if (full > 0) {
     const progress = Math.min(1, Math.max(0, 1 - (remaining / full))); 
     renderTransition(progress); 
   } else {
     // No transition, go directly to display
     slides[current].style.opacity = 1;
     slides[current].style.transform = 'translate(-50%, -50%)';
     phase = 'display';
     remaining = slideData[current].display;
     
     // Start video playback when display phase begins
     if (videoSyncMode && currentVideo && playing) {
       currentVideo.currentTime = 0;
       requestAnimationFrame(() => {
         currentVideo.play().catch(e => console.log('Video play failed:', e));
       });
     }
     
     setupInputValidation();
   }
 } else if (phase === 'display') {
  // Start slide audio when display phase begins
  startSlideAudio();
   // Sync video during display phase
   syncVideoToSlideTime();
 }
 
 if (remaining <= 0) { 
   if (phase === 'transition') { 
     phase = 'display'; 
     remaining = slideData[current].display; 
     slides[current].style.opacity = 1; 
     slides[current].style.transform = 'translate(-50%, -50%)';
     
    // Start slide audio when display phase begins
    startSlideAudio();

     // Start video playback when display phase begins (transition just ended)
     if (videoSyncMode && currentVideo && playing) {
       currentVideo.currentTime = 0;
       requestAnimationFrame(() => {
         currentVideo.play().catch(e => console.log('Video play failed:', e));
       });
     }
     
     // Check for input validation requirement
     setupInputValidation();
   } else { 
     if (current === slideData.length - 1) { 
       playing = false; 
       document.getElementById("playBtn").innerHTML = '<i class="fas fa-play"></i>'; 
       
       // Pause video if it's playing
       if (currentVideo) {
         currentVideo.pause();
       }
       
       // Stop background audio when slideshow ends
       stopBackgroundAudio();
       stopSlideAudio();
       return; 
     } 
     
     // Pause and reset current video before moving to next slide
     if (currentVideo) {
       currentVideo.pause();
       currentVideo.currentTime = 0;
     }
     
     stopSlideAudio();
     current++; 
     phase = 'transition'; 
     remaining = slideData[current].transition; 
     showSlide(current); 
   } 
 } 
 
 if (playing) rafId = requestAnimationFrame(run); 
}

 
 function togglePlay() {
  // Don't allow play if waiting for input validation
  if (waitingForInput && !playing) {
    return;
  }
  
  playing = !playing;
  const btn = document.getElementById("playBtn");
  
  if (playing) {
    btn.innerHTML = '<i class="fas fa-pause"></i>';
    last = null;
    rafId = requestAnimationFrame(run);
    
    // Start background audio on first play
    if (!backgroundAudioStarted) {
      startBackgroundAudio();
    } else {
      resumeBackgroundAudio();
    }
    
    // Resume video if in display phase
    if (phase === 'display' && currentVideo && videoSyncMode) {
      currentVideo.play().catch(e => console.log('Video play failed:', e));
    }
      resumeSlideAudio();
  } else {
    btn.innerHTML = '<i class="fas fa-play"></i>';
    if (rafId) cancelAnimationFrame(rafId);
    
    // Pause background audio only if not waiting for input
    if (!waitingForInput) {
      pauseBackgroundAudio();
      pauseSlideAudio();
    }
    
    // Pause video
    if (currentVideo) {
      currentVideo.pause();
    }
  }
}
 
function seek(event) {
  const rect = event.currentTarget.getBoundingClientRect();
  const percent = (event.clientX - rect.left) / rect.width;
  const targetTime = percent * totalTime;
  
  // Find which slide this time corresponds to
  let acc = 0;
  for (let i = 0; i < slideData.length; i++) {
    const slideEnd = acc + slideData[i].transition + slideData[i].display;
    if (targetTime <= slideEnd) {
      // Clear existing video state properly
      if (currentVideo) {
        currentVideo.pause();
        currentVideo.currentTime = 0;
        // Remove all event listeners
        currentVideo.removeEventListener('loadedmetadata', onVideoLoaded);
        currentVideo.removeEventListener('timeupdate', onVideoTimeUpdate);
        currentVideo.removeEventListener('ended', onVideoEnded);
        currentVideo.removeEventListener('contextmenu', preventContextMenu);
        currentVideo.removeEventListener('canplay', onVideoCanPlay);
        currentVideo.removeEventListener('waiting', onVideoWaiting);
        currentVideo.removeEventListener('error', onVideoError);
        currentVideo.removeEventListener('play', onVideoPlay);
      }
      
      // Clear any input validation state when manually seeking
      const wasWaitingForInput = waitingForInput;
      waitingForInput = false;
      if (inputValidationListener) {
        const oldSlideElement = slides[current];
        const oldSubmitButton = oldSlideElement.querySelector('button[type="submit"], input[type="submit"]');
        if (oldSubmitButton) {
          oldSubmitButton.removeEventListener('click', inputValidationListener);
        }
        inputValidationListener = null;
      }
      
      current = i;
      const slideStart = acc;
      const slideTime = targetTime - slideStart;
      
      if (slideTime < slideData[i].transition) {
        phase = 'transition';
        remaining = slideData[i].transition - slideTime;
        
        // Show slide and render transition at correct progress
        showSlide(current);
        const progress = slideTime / slideData[i].transition;
        renderTransition(progress);
      } else {
        phase = 'display';
        remaining = slideData[i].display - (slideTime - slideData[i].transition);
        
        // Show slide with full opacity
        showSlide(current);
        slides[current].style.opacity = 1;
        slides[current].style.transform = 'translate(-50%, -50%)';
        
        // Setup video and resume playback if there's a video and we're playing
        if (videoSyncMode && currentVideo && playing) {
          const videoTime = slideTime - slideData[current].transition;
          if (videoTime >= 0 && videoTime <= currentVideo.duration) {
            currentVideo.currentTime = videoTime;
            currentVideo.play().catch(e => console.log('Video play failed:', e));
          }
        }
        
        setupSlideAudio();

        // Check for input validation requirement
        setupInputValidation();
      }
      
      // If we were waiting for input and seeked to a new slide, resume if playing
      if (wasWaitingForInput && playing) {
        resumeBackgroundAudio();
        resumeSlideAudio();

      }
      
      elapsed = targetTime;
      updateProgressUI();
      
      // Resume animation if playing and not running
      if (playing && !rafId) {
        last = null;
        rafId = requestAnimationFrame(run);
      }
      
      break;
    }
    acc = slideEnd;
  }
} 
function jumpToSlide(index) {
  if (index < 0 || index >= slideData.length) return;
  
  // Clear any existing video state properly
  if (currentVideo) {
    currentVideo.pause();
    currentVideo.currentTime = 0;
    // Remove all event listeners to prevent conflicts
    currentVideo.removeEventListener('loadedmetadata', onVideoLoaded);
    currentVideo.removeEventListener('timeupdate', onVideoTimeUpdate);
    currentVideo.removeEventListener('ended', onVideoEnded);
    currentVideo.removeEventListener('contextmenu', preventContextMenu);
    currentVideo.removeEventListener('canplay', onVideoCanPlay);
    currentVideo.removeEventListener('waiting', onVideoWaiting);
    currentVideo.removeEventListener('error', onVideoError);
    currentVideo.removeEventListener('play', onVideoPlay);
  }
  
  // Clear any input validation state when jumping to a new slide
  const wasWaitingForInput = waitingForInput;
  waitingForInput = false;
  if (inputValidationListener) {
    const oldSlideElement = slides[current];
    const oldSubmitButton = oldSlideElement.querySelector('button[type="submit"], input[type="submit"]');
    if (oldSubmitButton) {
      oldSubmitButton.removeEventListener('click', inputValidationListener);
    }
    inputValidationListener = null;
  }
  
  // Calculate the time at the start of the target slide
  let targetTime = 0;
  for (let i = 0; i < index; i++) {
    targetTime += slideData[i].transition + slideData[i].display;
  }
  
  current = index;
  phase = 'transition';
  remaining = slideData[index].transition;
  elapsed = targetTime;
  
  // Show the slide and setup video properly
  showSlide(current);
  
  setupSlideAudio();

  // If transition duration is 0, go directly to display phase
  if (slideData[index].transition === 0) {
    phase = 'display';
    remaining = slideData[index].display;
    slides[current].style.opacity = 1;
    slides[current].style.transform = 'translate(-50%, -50%)';
    
    // If there's a video on this slide and we're playing, start it
    if (videoSyncMode && currentVideo && playing) {
      currentVideo.currentTime = 0;
      requestAnimationFrame(() => {
        currentVideo.play().catch(e => console.log('Video play failed:', e));
      });
    }
    
    // Check for input validation requirement on the new slide
    setupInputValidation();
  } else {
    // Start transition from beginning
    renderTransition(0);
  }
  
  // If we were waiting for input and jumped to a new slide, resume if playing
  if (wasWaitingForInput && playing) {
    // Resume background audio
    resumeBackgroundAudio();
    resumeSlideAudio();
  }
  
  updateProgressUI();
  
  // Resume animation if playing and not already running
  if (playing && !rafId) {
    last = null;
    rafId = requestAnimationFrame(run);
  }
} 
 // Mouse movement detection for UI visibility
 let mouseTimeout;
 let isMouseMoving = false;
 
 function showUI() {
 document.querySelector('.controls').classList.add('visible');
 document.getElementById('progressContainer').classList.add('visible');
 document.getElementById('timeLabel').classList.add('visible');
 
 // Only show thumbnails if not hidden
 const thumbnailContainer = document.getElementById('thumbnailContainer');
 if (thumbnailContainer && thumbnailContainer.style.display !== 'none') {
   thumbnailContainer.classList.add('visible');
 }
 
 clearTimeout(mouseTimeout);
 mouseTimeout = setTimeout(hideUI, 3000);
}
 
 function hideUI() {
   if (!isMouseMoving) {
     document.querySelector('.controls').classList.remove('visible');
     document.getElementById('progressContainer').classList.remove('visible');
     document.getElementById('timeLabel').classList.remove('visible');
     document.getElementById('thumbnailContainer').classList.remove('visible');
   }
 }
 
 // Enhanced video control hiding
 function hideAllVideoControls() {
   slides.forEach(slide => {
     const videos = slide.querySelectorAll('video');
     videos.forEach(video => {
       // Hide native controls
       video.setAttribute('controls', false);
       video.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback');
       video.setAttribute('disablePictureInPicture', true);
       video.style.pointerEvents = 'none';
       
       // Prevent context menu
       video.addEventListener('contextmenu', event => event.preventDefault());
       
       // Hide controls on hover/mouse events
       video.addEventListener('mouseenter', () => {
         video.setAttribute('controls', false);
       });
       
       video.addEventListener('mouseover', () => {
         video.setAttribute('controls', false);
       });
       
       video.addEventListener('focus', () => {
         video.blur();
       });
       
       // Prevent keyboard controls
       video.addEventListener('keydown', event => {
         event.preventDefault();
       });
     });
   });
 }
 
 // Mouse event listeners
 document.addEventListener('mousemove', () => {
   isMouseMoving = true;
   showUI();
   
   clearTimeout(mouseTimeout);
   mouseTimeout = setTimeout(() => {
     isMouseMoving = false;
     hideUI();
   }, 3000);
 });
 
 document.addEventListener('mouseenter', showUI);
 document.addEventListener('mouseleave', () => {
   isMouseMoving = false;
   hideUI();
 });
 
window.jumpToSlide = jumpToSlide; 
 
// Initialize slideshow
function init() {
 // Start with slideshow paused
 playing = false;
 document.getElementById("playBtn").innerHTML = '<i class="fas fa-play"></i>';
 
 // Hide all video controls initially
 hideAllVideoControls();
 
 // Show first slide
 showSlide(0);
 
 // Render the first slide at full opacity if no transition
 if (slideData[0].transition === 0) {
   slides[0].style.opacity = 1;
   slides[0].style.transform = 'translate(-50%, -50%)';
 } else {
   // Show first frame of transition
   renderTransition(0);
 }
 
 updateProgressUI();
 
 // Don't start the animation loop automatically
 // User must press play to start
 
  setupBackButtonNavigation(0);
  
 // Initial UI state
 showUI();
}
 
 // Start when DOM is ready
 if (document.readyState === 'loading') {
   document.addEventListener('DOMContentLoaded', init);
 } else {
   init();
 }
 
 </script> 
</body> 
</html>`;
  
  // Create and download the file
  const blob = new Blob([fullHTML], { type: 'text/html' }); 
  const url = URL.createObjectURL(blob); 
  const a = document.createElement('a'); 
  a.href = url; 
  a.download = 'interactive_slideshow.html'; 
  a.click(); 
  URL.revokeObjectURL(url); 
}}