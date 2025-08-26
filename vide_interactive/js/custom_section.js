function customSections(editor) {
  editor.on("load", () => {
    const iframe = editor.Canvas.getFrameEl();
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

    const styleEl = iframeDoc.createElement("style");
    styleEl.innerHTML = `
      .gjs-editor-header,
      .gjs-editor-content,
      .gjs-editor-footer {
        position: relative;
        border: 1px dashed #999;
      }

      .gjs-editor-header::before,
      .gjs-editor-content::before,
      .gjs-editor-footer::before {
        content: attr(data-gjs-name);
        position: absolute;
        left: 0;
        top: -14px;
        font-size: 11px;
        font-weight: bold;
        background: #f0f0f0;
        color: #444;
        padding: 1px 5px;
        border-radius: 3px;
        pointer-events: none;
        z-index: 10;
      }

      .sections-container:hover {
        outline: 2px dashed #aaa;
        outline-offset: -3px;
        cursor: pointer;
      }

      /* Make sure resize handles work properly */
      .gjs-resizer-c {
        position: absolute !important;
        z-index: 1000 !important;
      }

      @media print {
        .gjs-editor-header::before,
        .gjs-editor-content::before,
        .gjs-editor-footer::before,
        .gjs-editor-header,
        .gjs-editor-content,
        .gjs-editor-footer {
          border: none !important;
          content: none !important;
        }
      }
    `;
    iframeDoc.head.appendChild(styleEl);
  });

  // Dragging state variables
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;
  let selectedComponent = null;
  let parentEl = null;

  editor.Components.addType("Dynamic Header Footer", {
    model: {
      defaults: {
        tagName: "div",
        name: "Dynamic Header Footer",
        attributes: { class: "sections-container" },
        selectable: true,
        highlightable: true,
        components: [
          {
            tagName: "div",
            name: "Header",
            attributes: {
              class: "section-header gjs-editor-header",
              'data-gjs-name': 'Header'
            },
            style: {
              "padding": "10px",
              "min-height": "80px",
              "position": "relative"
            },
          },
          {
            tagName: "div",
            name: "Content",
            attributes: {
              class: "section-content gjs-editor-content",
              'data-gjs-name': 'Content'
            },
            style: {
              "flex": "1",
              "padding": "10px",
              "position": "relative"
            },
          },
          {
            tagName: "div",
            name: "Footer",
            attributes: {
              class: "section-footer gjs-editor-footer",
              'data-gjs-name': 'Footer'
            },
            style: {
              "padding": "10px",
              "min-height": "60px",
              "position": "relative"
            },
          }
        ],
        style: {
          "display": "flex",
          "flex-direction": "column",
          "width": "100%",
          "min-height": "50vh",
          "margin": "10px 0",
          "padding": "5px"
        },
      }
    },
  });

  // Function to check if element is inside a section
  function isInsideSection(component) {
    let parent = component.parent();
    while (parent) {
      const parentEl = parent.getEl();
      if (parentEl && (parentEl.classList.contains('gjs-editor-header') || 
                      parentEl.classList.contains('gjs-editor-content') || 
                      parentEl.classList.contains('gjs-editor-footer'))) {
        return { isInside: true, section: parent, sectionEl: parentEl };
      }
      parent = parent.parent();
    }
    return { isInside: false };
  }

  // Enhanced component selection handler
  editor.on('component:selected', (component) => {
    const sectionInfo = isInsideSection(component);
    
    if (sectionInfo.isInside) {
      const el = component.getEl();
      if (!el) return;

      // Ensure parent is positioned relative
      sectionInfo.sectionEl.style.position = "relative";
      selectedComponent = component;
      parentEl = sectionInfo.sectionEl;

      // Setup dragging with percentage-based positioning
      setupPercentageDragging(component, el, sectionInfo.sectionEl);
    }
  });

  // Percentage-based dragging setup (restored from original)
function setupPercentageDragging(component, el) {
  el.onmousedown = function (e) {
    // Skip GrapesJS resizer handles
    if (
      e.target.classList.contains("gjs-resizer-h") ||
      e.target.closest(".gjs-resizer-c")
    ) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    isDragging = true;

    // 🔑 Resolve parent dynamically every time
    const parentEl = el.closest(".gjs-editor-header, .gjs-editor-content, .gjs-editor-footer");
    if (!parentEl) return;

    // Force absolute positioning when drag begins
    el.style.position = "absolute";

    const style = window.getComputedStyle(el);
    const parentRect = parentEl.getBoundingClientRect();

    // Convert current left/top into px for base calculations
    let left = parseFloat(style.left) || 0;
    let top = parseFloat(style.top) || 0;

    if (style.left.includes("%")) {
      left = (parseFloat(style.left) / 100) * parentRect.width;
    }
    if (style.top.includes("%")) {
      top = (parseFloat(style.top) / 100) * parentRect.height;
    }

    currentX = left;
    currentY = top;

    // Track mouse offset within element
    const elRect = el.getBoundingClientRect();
    startX = e.clientX - elRect.left;
    startY = e.clientY - elRect.top;

    document.onmousemove = function (e) {
      if (!isDragging) return;

      const parentRect = parentEl.getBoundingClientRect();
      const newX = e.clientX - parentRect.left - startX;
      const newY = e.clientY - parentRect.top - startY;

      const parentWidth = parentRect.width;
      const parentHeight = parentRect.height;

      // Convert to %
      const newLeftPercent = (newX / parentWidth) * 100;
      const newTopPercent = (newY / parentHeight) * 100;

      // Clamp to bounds
      const elWidth = el.offsetWidth;
      const elHeight = el.offsetHeight;
      const maxLeftPercent = 100 - (elWidth / parentWidth) * 100;
      const maxTopPercent = 100 - (elHeight / parentHeight) * 100;

      const clampedLeft = Math.max(0, Math.min(newLeftPercent, maxLeftPercent));
      const clampedTop = Math.max(0, Math.min(newTopPercent, maxTopPercent));

      // Apply via CSSComposer so GrapesJS saves it
      const compId = component.getId();
      const selector = `#${compId}`;
      const cssRule =
        editor.CssComposer.getRule(selector) ||
        editor.CssComposer.add([selector]);

      cssRule.addStyle({
        position: "absolute",
        left: `${clampedLeft}%`,
        top: `${clampedTop}%`,
      });
    };

    document.onmouseup = function () {
      isDragging = false;
      document.onmousemove = null;
      document.onmouseup = null;
    };
  };
}



  // Handle new components added to sections

// Handle new components added to sections
editor.on('component:add', (component) => {
  const sectionInfo = isInsideSection(component);

  if (sectionInfo.isInside) {
    // Let new elements flow normally, don't force absolute yet
    setTimeout(() => {
      if (component.getStyle('position') !== 'absolute') {
        component.addStyle({
          position: 'relative',   // keep in normal flow
          display: 'block',
          margin: '10px 0',       // give some space so they don’t overlap
          width: 'auto',
          top: 'auto',
          left: 'auto'
        });
      }
    }, 50);
  }
});

  // Ensure style manager works properly for elements in sections
editor.on('component:styleUpdate', (component) => {
  const sectionInfo = isInsideSection(component);

  if (sectionInfo.isInside) {
  }
});


  // Clean up when component is deselected
  editor.on('component:deselected', (component) => {
    if (selectedComponent === component) {
      isDragging = false;
      selectedComponent = null;
      parentEl = null;
    }
  });
}