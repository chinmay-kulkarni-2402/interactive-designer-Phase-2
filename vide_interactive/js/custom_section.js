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

      /* Ensure all elements inside sections can be positioned absolutely */
      .gjs-editor-header > *:not(.gjs-resizer-c),
      .gjs-editor-content > *:not(.gjs-resizer-c),
      .gjs-editor-footer > *:not(.gjs-resizer-c) {
        position: absolute !important;
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
            components: [
              {
                tagName: "div",
                content: "Header Content",
                attributes: { class: "sample-element" },
                style: {
                  position: "absolute",
                  left: "5%",
                  top: "10%",
                  width: "200px",
                  height: "40px",
                  border: "1px solid #888",
                  padding: "10px",
                  "background-color": "#e8f4fd",
                  "border-radius": "4px"
                }
              }
            ]
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
            components: [
              {
                tagName: "div",
                content: "Content Area",
                attributes: { class: "sample-element" },
                style: {
                  position: "absolute",
                  left: "10%",
                  top: "15%",
                  width: "300px",
                  height: "60px",
                  border: "1px solid #888",
                  padding: "10px",
                  "background-color": "#f0f8f0",
                  "border-radius": "4px"
                }
              }
            ]
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
            components: [
              {
                tagName: "div",
                content: "Footer Content",
                attributes: { class: "sample-element" },
                style: {
                  position: "absolute",
                  left: "5%",
                  top: "20%",
                  width: "250px",
                  height: "30px",
                  border: "1px solid #888",
                  padding: "10px",
                  "background-color": "#fff4e6",
                  "border-radius": "4px"
                }
              }
            ]
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
  function setupPercentageDragging(component, el, sectionEl) {
    el.onmousedown = function (e) {
      // Don't interfere with resize handles
      if (e.target.classList.contains('gjs-resizer-h') || e.target.closest('.gjs-resizer-c')) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      isDragging = true;

      const style = window.getComputedStyle(el);
      const parentRect = parentEl.getBoundingClientRect();

      // Get current left/top from style (in % or px)
      let left = parseFloat(style.left) || 0;
      let top = parseFloat(style.top) || 0;

      // Convert to pixels if currently in percentage
      if (style.left.includes('%')) {
        left = (parseFloat(style.left) / 100) * parentRect.width;
      }
      if (style.top.includes('%')) {
        top = (parseFloat(style.top) / 100) * parentRect.height;
      }

      currentX = left;
      currentY = top;

      // Calculate the offset from mouse to element's current position
const elRect = el.getBoundingClientRect();
startX = e.clientX - elRect.left;
startY = e.clientY - elRect.top;

      document.onmousemove = function (e) {
        if (!isDragging) return;

        const parentRect = parentEl.getBoundingClientRect();
        
        // Calculate new position based on mouse movement
        const newX = e.clientX - parentRect.left - startX;
        const newY = e.clientY - parentRect.top - startY;

        const parentWidth = parentRect.width;
        const parentHeight = parentRect.height;

        // Convert to percentage values
        const newLeftPercent = (newX / parentWidth) * 100;
        const newTopPercent = (newY / parentHeight) * 100;

        // Clamp within bounds (0% to 100% minus element size)
        const elWidth = el.offsetWidth;
        const elHeight = el.offsetHeight;
        const maxLeftPercent = 100 - (elWidth / parentWidth) * 100;
        const maxTopPercent = 100 - (elHeight / parentHeight) * 100;

        const clampedLeft = Math.max(0, Math.min(newLeftPercent, maxLeftPercent));
        const clampedTop = Math.max(0, Math.min(newTopPercent, maxTopPercent));

        // Update component style with percentage values
        const compId = component.getId();
        const selector = `#${compId}`;
        const cssRule = editor.CssComposer.getRule(selector) || editor.CssComposer.add([selector]);
        
        cssRule.addStyle({
          position: "absolute",
          left: `${clampedLeft}%`,
          top: `${clampedTop}%`
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
  editor.on('component:add', (component) => {
    const sectionInfo = isInsideSection(component);
    
    if (sectionInfo.isInside) {
      // Auto-position new components absolutely with percentage values
      setTimeout(() => {
        component.addStyle({
          position: 'absolute',
          left: '5%',
          top: '10%'
        });
      }, 100);
    }
  });

  // Ensure style manager works properly for elements in sections
  editor.on('component:styleUpdate', (component) => {
    const sectionInfo = isInsideSection(component);
    
    if (sectionInfo.isInside) {
      // Ensure position stays absolute when styles are updated
      const currentPosition = component.getStyle('position');
      if (currentPosition !== 'absolute') {
        component.addStyle({ position: 'absolute' });
      }
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