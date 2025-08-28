// daynamic header and footer


class PageSetupManager {
  constructor(editor) {
    this._lastAppliedHeaderText = "";
    this._lastAppliedFooterText = "";
    this._overflowAttempts = new Map();
    this._maxOverflowAttempts = 3;
    this.pageObservers = new Map();
    this.paginationInProgress = false;
    this.debounceTimers = new Map();
    this.lastContentSnapshot = new Map();
    this.contentCheckInterval = null;
    this._isProcessingOverflow = false;
    this._overflowCheckTimeout = null;
    this._componentAddHandler = null;
    this._componentUpdateHandler = null;
    this._pasteHandler = null;
    this.editor = editor;
    this.pageSettings = {
      autoFlow: true,
      preserveFormatting: true,
      wordWrap: true,
      lineHeight: 1.2,
      fontSize: 12
    };
    this.pageSettings = {
      format: "a4",
      orientation: "portrait",
      numberOfPages: 1,
      pages: [],
      width: 210,
      height: 297,
      margins: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      },
      backgroundColor: "#ffffff",
      pageNumbering: {
        enabled: false,
        startFromPage: 1,
        excludedPages: [],
      },
      // Header/footer settings with default enabled state
      headerFooter: {
        headerEnabled: true,
        footerEnabled: true,
        headerHeight: 12.7, // 1.27cm in mm
        footerHeight: 12.7, // 1.27cm in mm
      },
    }
    this.isInitialized = false
    this.currentPageIndex = 0
    this.selectedSection = null
    this.pageBreaks = [] // Track page breaks for print/PDF

    // Store shared content to preserve during operations
    this.sharedContent = {
      header: null,
      footer: null,
    }

    // Store all page content to preserve during operations
    this.pageContents = new Map()

    // Page format dimensions in mm
    this.pageFormats = {
      a4: { width: 210, height: 297 },
      a3: { width: 297, height: 420 },
      a2: { width: 420, height: 594 },
      a1: { width: 594, height: 841 },
      a0: { width: 841, height: 1189 },
      letter: { width: 215.9, height: 279.4 },
      legal: { width: 215.9, height: 355.6 },
      a5: { width: 148, height: 210 },
      custom: { width: 210, height: 297 },
    }

    // Default header/footer sizes (1.27cm = 12.7mm)
    this.defaultSizes = {
      header: { height: 12.7, padding: 10 },
      footer: { height: 12.7, padding: 10 },
    }

    // Sections functionality
    this.sectionsSettings = {
      enabled: false,
      sections: [],
    }

    this.pageSettings.watermark = {
      // ...other config
      watermark: {
        enabled: true, // ✅ Make sure this is true on init
        type: "text",
        position: "center",
        text: {
          content: "CONFIDENTIAL",
          font: "Arial",
          fontSize: 60,
          color: "red",
          opacity: 0.2,
          rotation: -30,
        },
        image: {
          url: "",
          width: 100,
          height: 100,
          opacity: 0.3,
        },
        applyToAllPages: true,
      }
    }


    this.init()
  }


  init() {
    this.createInitialSetupModal()
    this.setupEventListeners()
    this.injectPageSetupStyles()
    this.addToGrapesJSSettings()
    this.setupCanvasObserver()
    this.setupContentBoundaryEnforcement()
    this.initSharedRegionSync()
    this.setupSectionSelection()
    this.addPageBreakComponent()
    const MAX_HEIGHT = 1027;

    console.log("🆕 Page break component initialized");

    // Trigger processing when component is added to parent
    this.on("change:parent", () => {
      if (this.parent()) {
        console.log("📍 Page break added to parent, scheduling processing...");

        // Get the PageSetupManager
        const editor = this.em;
        const pageSetupManager = editor?.get?.("PageSetupManager");

        if (pageSetupManager && pageSetupManager.splitPagesByBreaks) {
          // Schedule processing after a delay to ensure DOM is ready
          setTimeout(() => {
            console.log("🔄 Auto-triggering page break processing...");
            pageSetupManager.processPendingPageBreaks();
          }, 300);
        } else {
          console.warn("⚠️ PageSetupManager not found or doesn't have splitPagesByBreaks method");
        }
      }
    });



  }

  // Add page break component to GrapesJS
  // Replace your existing addPageBreakComponent method with this improved version

  addPageBreakComponent() {
    // Add the block to the Extra category
    // this.editor.BlockManager.add("page-break", {
    //   category: "Extra",
    //   label: `
    //   <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px;">
    //     <div style="font-size: 20px; color: #ff6b6b;">✂️</div>
    //     <span style="font-size: 10px; font-weight: bold; color: #333;">Page Break</span>
    //   </div>
    // `,
    //   content: {
    //     type: "page-break",
    //   },
    // });

      editor.BlockManager.add('page-break', {
    label: `
      <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px;">
        <div style="font-size: 20px; color: #ff6b6b;">✂️</div>
        <span style="font-size: 10px; font-weight: bold; color: #333;">Page Break</span>
      </div>
    `,
    category: 'Basic',
    content: '<div class="page-break" style="height:0; border-top:1px dashed #999; margin:20px 0;"></div>'
  });

    // Add CSS rules for page breaks first
    // this.addPageBreakCSS();

    // Define the page break component
    // this.editor.DomComponents.addType("page-break", {
    //   model: {
    //     defaults: {
    //       tagName: "div",
    //       classes: ["page-break-element"],
    //       droppable: false,
    //       editable: false,
    //       selectable: true,
    //       removable: true,
    //       copyable: true,
    //       draggable: true,
    //       attributes: {
    //         "data-page-break": "true",
    //         contenteditable: "false",
    //       },
    //       traits: [
    //         {
    //           type: "checkbox",
    //           name: "force-new-page",
    //           label: "Force New Page",
    //           changeProp: 1,
    //         },
    //       ],
    //       style: {
    //         width: "100%",
    //         height: "30px",
    //         margin: "20px 0",
    //         position: "relative",
    //         cursor: "move",
    //       },
    //       content: '<span class="page-break-label">✂️ PAGE BREAK</span>',
    //     },



    //     handlePageBreakInsertion() {
    //       console.log("🔄 Page break insertion detected");

    //       // Get the editor instance
    //       const editor = this.em?.get?.("Editor") || this.em || this.collection?.editor;
    //       if (!editor) {
    //         console.error("❌ Editor not found in page break component");
    //         return;
    //       }

    //       // Get the PageSetupManager
    //       const pageSetupManager = editor.get?.("PageSetupManager");
    //       if (!pageSetupManager) {
    //         console.warn("⚠️ PageSetupManager not found - page break functionality may be limited");
    //         this.addPrintPageBreakCSS();
    //         return;
    //       }

    //       // Check if PageSetupManager is initialized
    //       if (!pageSetupManager.isInitialized) {
    //         console.warn("⚠️ PageSetupManager not initialized yet, retrying in 1 second...");
    //         setTimeout(() => {
    //           this.handlePageBreakInsertion();
    //         }, 1000);
    //         return;
    //       }

    //       try {
    //         // Create insertion context
    //         const insertionContext = {
    //           component: this,
    //           parent: this.parent(),
    //           index: this.index(),
    //           previousSibling: this.parent()?.components().at(this.index() - 1),
    //           nextSibling: this.parent()?.components().at(this.index() + 1)
    //         };

    //         // Call the page setup manager to handle the break
    //         pageSetupManager.handlePageBreakInsertion(this, insertionContext);
    //         console.log("✅ Page break processed successfully");

    //       } catch (error) {
    //         console.error("❌ Error processing page break:", error);
    //         // Fallback: at least add CSS for print
    //         this.addPrintPageBreakCSS();
    //       }
    //     },

    //     addPrintPageBreakCSS() {
    //       const view = this.view;
    //       if (view && view.el) {
    //         view.el.classList.add('print-page-break');

    //         // Ensure CSS is added
    //         const css = `
    //         @media print {
    //           .print-page-break {
    //             page-break-before: always !important;
    //             break-before: page !important;
    //             display: none !important;
    //           }
    //         }
    //       `;

    //         const editor = this.em || this.collection?.editor;
    //         if (editor) {
    //           try {
    //             const cssManager = editor.Css || editor.CssComposer;
    //             if (cssManager && cssManager.add) {
    //               cssManager.add(css);
    //             }
    //           } catch (error) {
    //             console.warn("Could not add CSS through editor");
    //           }
    //         }
    //       }
    //     },
    //   },

    //   view: {
    //     onRender() {
    //       const el = this.el;
    //       if (!el) {
    //         console.error("Page break element not found during render");
    //         return;
    //       }

    //       try {
    //         // Set the content
    //         el.innerHTML = '<span class="page-break-label">✂️ PAGE BREAK</span>';

    //         // Add CSS classes
    //         el.classList.add('page-break-element', 'rendered-page-break');

    //         // Add data attributes for better identification
    //         el.setAttribute('data-gjs-type', 'page-break');
    //         el.setAttribute('title', 'Page Break - Content after this will start on a new page');

    //         // Add hover effects
    //         this.addInteractionEffects();

    //         console.log("Page break component rendered successfully");
    //       } catch (error) {
    //         console.error("Error rendering page break component:", error);
    //       }
    //     },

    //     addInteractionEffects() {
    //       const el = this.el;
    //       if (!el) return;

    //       // Hover effects
    //       el.addEventListener('mouseenter', () => {
    //         el.style.transform = 'scale(1.02)';
    //         el.style.boxShadow = '0 2px 10px rgba(255, 75, 87, 0.4)';
    //       });

    //       el.addEventListener('mouseleave', () => {
    //         el.style.transform = 'scale(1)';
    //         el.style.boxShadow = 'none';
    //       });

    //       // Click handling
    //       el.addEventListener('click', (e) => {
    //         e.stopPropagation();
    //         console.log("Page break clicked");
    //         this.model.trigger('active');
    //       });
    //     },

    //     onRemove() {
    //       // Clean up event listeners if needed
    //       console.log("Page break component removed");
    //     },
    //   },
    // });
  }

  // createNewPage() {
  //   debugger
  // console.log('createNewPage CALL');
  //   // Your logic to create a new page
  //   const wrapper = this.editor.getWrapper();

  //   const newPageIndex = wrapper.find('[data-page-index]').length;

  //   const newPage = document.createElement('div');
  //   newPage.className = 'page';
  //   newPage.setAttribute('data-page-index', newPageIndex);

  //   const mainContent = document.createElement('div');
  //   mainContent.className = 'main-content-area';
  //   newPage.appendChild(mainContent);

  //   wrapper.getEl().appendChild(newPage);
  // }
  
//  createNewPage() {
//   console.log('createNewPage CALL ============');

//   const wrapper = this.editor.getWrapper();
//   const newPageIndex = wrapper.find('[data-page-index]').length;

//   // Use GrapesJS API instead of raw DOM
//   const newPage = wrapper.append(`
//     <div class="page-container" data-page-id="page-${newPageIndex + 1}" data-page-index="${newPageIndex}">
//       <div class="page-content">
//         <div data-shared-region="header" class="header-wrapper">
//           <div class="page-header-element"></div>
//         </div>
//         <div class="content-wrapper">
//           <div class="main-content-area"></div>
//         </div>
//         <div data-shared-region="footer" class="footer-wrapper">
//           <div class="page-footer-element"></div>
//         </div>
//       </div>
//     </div>
//   `);

//   // ✅ wrapper.append() returns an array of components
//   return newPage[0];
// } 


// handlePageBreak(pageIndex) {
//   console.log('PAGE BREAK CALL ==========');
//   const wrapper = this.editor.getWrapper();
//   if (!wrapper) return;

//   // Step 1: Current page lo
//   const pageComponents = wrapper.find(`[data-page-index="${pageIndex}"]`);
//   if (!pageComponents.length) return;

//   const pageComponent = pageComponents[0];
//   const contentArea = pageComponent.find('.main-content-area')[0];
//   if (!contentArea) return;

//   const contentEl = contentArea.getEl();
//   if (!contentEl) return;

//   const pageBreakEl = contentEl.querySelector('.page-break');
//   if (!pageBreakEl) return;

//   // Step 2: Collect elements after break
//   let foundBreak = false;
//   const allChildren = Array.from(contentArea.components()); // ✅ GrapesJS components, not raw DOM
//   const afterBreak = [];

//   for (let cmp of allChildren) {
//     if (foundBreak) afterBreak.push(cmp);
//     if (cmp.getEl() === pageBreakEl) foundBreak = true;
//   }

//   if (afterBreak.length === 0) return;

//   // Step 3: Find next page or create one
//   let nextPage = wrapper.find(`[data-page-index="${pageIndex + 1}"]`)[0];
//   if (!nextPage) {
//     nextPage = this.createNewPage();
//   }

//   if (!nextPage) {
//     console.warn('❌ Failed to create or find next page');
//     return;
//   }

//   // Step 4: Get next main-content-area
//   const nextContentArea = nextPage.find('.main-content-area')[0];
//   if (!nextContentArea) {
//     console.warn('❌ next page does not have a main-content-area');
//     return;
//   }

//   // Step 5: Move elements using GrapesJS API
//   afterBreak.forEach(cmp => {
//     nextContentArea.append(cmp); // ✅ GrapesJS way
//   });

//   // Remove the page-break element
//   const breakCmp = this.editor.getComponents().find(c => c.getEl() === pageBreakEl);
//   if (breakCmp) breakCmp.remove();

//   console.log(`✅ Moved ${afterBreak.length} components to page ${pageIndex + 1}`);
// }


// ===============================
//+Latest+ Create New Page
// ===============================
createNewPage() {
  console.log('createNewPage CALL ============');

  const wrapper = this.editor.getWrapper();
  const newPageIndex = wrapper.find('[data-page-index]').length;

  // +Latest+ use buildPageSkeleton so that new page looks exactly like existing pages
  const newPage = wrapper.append(this.addNewPage());

  // ✅ GrapesJS component return karega
  return newPage[0];
}


// ===============================
// +Latest+ Handle Page Break
// ===============================
handlePageBreak(pageIndex) {
  console.log('PAGE BREAK CALL ==========');
  const wrapper = this.editor.getWrapper();
  if (!wrapper) return;

  // Step 1: Get current page
  const pageComponents = wrapper.find(`[data-page-index="${pageIndex}"]`);
  if (!pageComponents.length) return;

  const pageComponent = pageComponents[0];
  const contentArea = pageComponent.find('.main-content-area')[0];
  if (!contentArea) return;

  const contentEl = contentArea.getEl();
  if (!contentEl) return;

  const pageBreakEl = contentEl.querySelector('.page-break');
  if (!pageBreakEl) return;

  // Step 2: Collect elements after break
  let foundBreak = false;
  const allChildren = Array.from(contentArea.components()); // ✅ GrapesJS components
  const afterBreak = [];

  for (let cmp of allChildren) {
    if (foundBreak) afterBreak.push(cmp);
    if (cmp.getEl() === pageBreakEl) foundBreak = true;
  }

  if (afterBreak.length === 0) return;

  // Step 3: Find next page or create one
  let nextPage = wrapper.find(`[data-page-index="${pageIndex + 1}"]`)[0];
  if (!nextPage) {
    nextPage = this.createNewPage(); // ✅ returns GrapesJS component
  }
  

  if (!nextPage) {
    console.warn('❌ Failed to create or find next page');
    return;
  }

  // Step 4: Get next main-content-area
  const nextContentArea = nextPage.find('.main-content-area')[0];
  if (!nextContentArea) {
    console.warn('❌ next page does not have a main-content-area');
    return;
  }

 // Step 5: Move elements using GrapesJS API (MOVE, not CLONE)
// +Latest+
afterBreak.reverse().forEach(cmp => {
  // remove from current parent first
  cmp.remove({ temporary: true }); // ✅ moves component out of old page without destroying
  
  // then add to next page at top
  nextContentArea.components().add(cmp, { at: 0 });
});



  // Step 6: Remove the page-break element
  const breakCmp = this.editor.getComponents().find(c => c.getEl() === pageBreakEl);
  if (breakCmp) breakCmp.remove();

  console.log(`✅ Moved ${afterBreak.length} components to page ${pageIndex + 1}`);
}



  startPageBreakMonitoring() {
    console.log("👁️ Starting page break monitoring...");

    // Monitor for new page break components
    this.editor.on('component:add', (component) => {
      if (component.getAttributes()['data-page-break'] === 'true') {
        console.log("🆕 New page break detected, scheduling processing...");

        setTimeout(() => {
          this.processPendingPageBreaks();
        }, 500);
      }
    });
  }

  // Also update your CSS method
  addPageBreakCSS() {
    const css = `
    /* Page Break Element Styles */
    .page-break-element {
      width: 100% !important;
      height: 30px !important;
      background: linear-gradient(90deg, #ff6b6b 0%, #ff8e8e 50%, #ff6b6b 100%) !important;
      border: 2px dashed #ff4757 !important;
      border-radius: 6px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      margin: 20px 0 !important;
      position: relative !important;
      cursor: move !important;
      transition: all 0.2s ease !important;
      user-select: none !important;
      z-index: 100 !important;
      box-sizing: border-box !important;
    }

    .page-break-element .page-break-label {
      color: white !important;
      font-size: 12px !important;
      font-weight: bold !important;
      letter-spacing: 1px !important;
      pointer-events: none !important;
    }

    /* Hover effects */
    .page-break-element:hover {
      background: linear-gradient(90deg, #ff5252 0%, #ff7979 50%, #ff5252 100%) !important;
      transform: scale(1.02) !important;
      box-shadow: 0 2px 10px rgba(255, 75, 87, 0.4) !important;
    }

    /* Selection state */
    .page-break-element.gjs-selected {
      outline: 3px solid #ff4757 !important;
      outline-offset: 3px !important;
    }

    /* Print styles for actual page breaks */
    @media print {
      .page-break-element {
        display: none !important;
      }
      
      .page-break-element + * {
        page-break-before: always !important;
        break-before: page !important;
      }
      
      .print-page-break {
        page-break-before: always !important;
        break-before: page !important;
        display: none !important;
      }
    }

    /* Editor-specific improvements */
    .gjs-cv-canvas .page-break-element {
      min-height: 30px !important;
    }

    /* Ensure page break is visible in editor */
    .gjs-frame .page-break-element {
      display: flex !important;
      visibility: visible !important;
    }
  `;

    // Try to add CSS through the editor's CSS manager
    try {
      if (this.editor && this.editor.Css) {
        this.editor.Css.add(css);
      } else if (this.editor && this.editor.CssComposer) {
        this.editor.CssComposer.add(css);
      } else {
        // Fallback: add directly to document head
        this.addCSSToHead(css);
      }
    } catch (error) {
      console.warn("Could not add CSS through editor, using fallback method");
      this.addCSSToHead(css);
    }
  }

  // Handle page break insertion and content movement
  handlePageBreakInsertion(breakComponent) {
    const breakEl = breakComponent.getEl();
    const pageContainer = breakEl.closest(".page-container");
    if (!pageContainer) return;

    const editor = breakComponent.em.get("Editor");
    const domComponents = editor.DomComponents;

    // Find main content area of current page
    const currentMain = pageContainer.querySelector(".main-content-area");
    if (!currentMain) return;

    // Gather all siblings after the break
    const nodesToMove = [];
    let next = breakEl.nextSibling;
    while (next) {
      nodesToMove.push(next);
      next = next.nextSibling;
    }

    if (!nodesToMove.length) return; // nothing to move

    // Create new page container via GrapesJS
    const newPage = domComponents.addComponent({
      tagName: "div",
      classes: ["page-container"],
      attributes: {
        "data-page-id": `page-${Date.now()}`,
        "data-page-index": "x", // you can update indices later
      },
      components: [
        {
          tagName: "div",
          classes: ["page-content"],
          components: [
            { tagName: "div", classes: ["header-wrapper"], components: [] },
            {
              tagName: "div",
              classes: ["content-wrapper"],
              components: [{ tagName: "div", classes: ["main-content-area"], components: [] }]
            },
            { tagName: "div", classes: ["footer-wrapper"], components: [] }
          ]
        }
      ]
    });

    // Find new main content
    const newMain = newPage.find(".main-content-area")[0];
    if (!newMain) return;

    // Move components after break into new page
    nodesToMove.forEach(node => {
      const comp = domComponents.getWrapper().find(`#${node.id}`)[0];
      if (comp) {
        newMain.append(comp);
      }
    });

    // Optional: remove break element after split
    breakComponent.remove();
  }


  splitPagesByBreaks() {
    const wrapper = this.editor.getWrapper();
    const pageContainers = wrapper.find('.page-container');

    pageContainers.forEach((page, pageIndex) => {
      const mainContent = page.find('.main-content-area')[0];
      if (!mainContent) return;

      const breakComps = mainContent.find('[data-page-break="true"]');
      if (!breakComps.length) return;

      breakComps.forEach(breakComp => {
        const breakEl = breakComp.getEl();
        let nextNodes = [];
        let sibling = breakEl.nextSibling;

        while (sibling) {
          nextNodes.push(sibling);
          sibling = sibling.nextSibling;
        }

        if (!nextNodes.length) return;

        // Create new page container with same skeleton
        const newPage = wrapper.append(this.buildPageSkeleton())[0];
        const newMain = newPage.find('.main-content-area')[0];

        // Move components after break into new page
        nextNodes.forEach(node => {
          const comp = wrapper.find(`#${node.id}`)[0];
          if (comp) newMain.append(comp);
        });

        // Optionally remove the break itself
        breakComp.remove();

        // Update settings so your visual update runs correctly
        this.pageSettings.numberOfPages++;
      });
    });

    console.log("✅ Pages split by manual breaks");
  }

  // +Latest+ matched CSS of first static page (794x1123px etc.)

// buildPageSkeleton() {
//   return `
//     <div class="page-container" data-page-id="page-${Date.now()}">
//       <div class="page-content" style="width:794px; height:1123px; margin:0; position:relative; overflow:hidden; background-color:#ffffff; display:flex; flex-direction:column; box-sizing:border-box; border:1px dashed #dee2e6; -webkit-print-color-adjust:exact; color-adjust:exact; print-color-adjust:exact;">
//         <div data-shared-region="header" class="header-wrapper" style="width:100%; height:48px; flex-shrink:0;">
//           <div class="page-header-element" style="width:100%; height:100%; display:flex; justify-content:center; align-items:center; border:2px dashed transparent;"></div>
//         </div>
//         <div class="content-wrapper" style="flex:1; display:flex; flex-direction:column; height:1027px;">
//           <div class="main-content-area" style="width:100%; height:100%; border:2px dashed transparent; transition:border-color 0.2s ease; overflow:hidden; position:relative;"></div>
//         </div>
//         <div data-shared-region="footer" class="footer-wrapper" style="width:100%; height:48px; flex-shrink:0;">
//           <div class="page-footer-element" style="width:100%; height:100%; display:flex; justify-content:center; align-items:center; border:2px dashed transparent;"></div>
//         </div>
//       </div>
//     </div>`;
// }


  buildPageSkeleton() {
    const mmToPx = 96 / 25.4;
    const totalPageWidth = Math.round(this.pageSettings.width * mmToPx);
    const totalPageHeight = Math.round(this.pageSettings.height * mmToPx);
    const marginTopPx = Math.round(this.pageSettings.margins.top * mmToPx);
    const marginBottomPx = Math.round(this.pageSettings.margins.bottom * mmToPx);
    const marginLeftPx = Math.round(this.pageSettings.margins.left * mmToPx);
    const marginRightPx = Math.round(this.pageSettings.margins.right * mmToPx);

    const contentWidth = totalPageWidth - marginLeftPx - marginRightPx;
    const contentHeight = totalPageHeight - marginTopPx - marginBottomPx;

    return `
    <div class="page-container" data-page-id="page-${Date.now()}">
      <div class="page-content" style="width:${contentWidth}px; height:${contentHeight}px; margin:${marginTopPx}px ${marginRightPx}px ${marginBottomPx}px ${marginLeftPx}px; display:flex; flex-direction:column;">
        <div class="header-wrapper"><div class="page-header-element"></div></div>
        <div class="content-wrapper" style="flex:1; display:flex; flex-direction:column;">
          <div class="main-content-area"></div>
        </div>
        <div class="footer-wrapper"><div class="page-footer-element"></div></div>
      </div>
    </div>`;
  }




  moveComponentsToPage(components, targetPageIndex) {
    try {
      const targetPageComponent = this.editor.getWrapper().find(`[data-page-index="${targetPageIndex}"]`)[0];
      if (!targetPageComponent) {
        console.error(`❌ Target page ${targetPageIndex} not found`);
        return;
      }

      const targetContentArea = targetPageComponent.find(".main-content-area")[0];
      if (!targetContentArea) {
        console.error(`❌ Target content area not found for page ${targetPageIndex}`);
        return;
      }

      console.log(`📦 Moving ${components.length} components to page ${targetPageIndex}`);

      // Temporarily disconnect the target page observer to prevent cascading mutations
      if (this.pageObservers.has(targetPageIndex)) {
        this.pageObservers.get(targetPageIndex).disconnect();
        console.log(`⏸️ Temporarily disconnected observer for target page ${targetPageIndex}`);
      }

      components.forEach((component, index) => {
        try {
          // Prevent circular references
          if (targetContentArea === component || component.components().includes(targetContentArea)) {
            console.warn(`🚫 Skipping component ${index} to avoid circular reference`);
            return;
          }

          // Clone and move
          const clonedComponent = component.clone({ deep: true });
          if (!clonedComponent || clonedComponent === component) {
            console.warn(`⚠️ Invalid clone for component ${index}, skipping`);
            return;
          }

          component.remove();
          targetContentArea.append(clonedComponent);
          console.log(`✅ Moved component ${index} to page ${targetPageIndex}`);

        } catch (compError) {
          console.error(`❌ Error moving component ${index}:`, compError);
        }
      });

      // Reconnect observer after a delay
      setTimeout(() => {
        this.setupPageObserver(targetPageIndex);
        console.log(`🔄 Reconnected observer for page ${targetPageIndex}`);
      }, 200);

    } catch (error) {
      console.error("❌ Error moving components to page:", error);
    }
  }


  // Check if page content overflows and handle it
  checkPageOverflow(pageIndex) {
    try {
      const pageComponent = this.editor.getWrapper().find(`[data-page-index="${pageIndex}"]`)[0]
      if (!pageComponent) return

      const contentArea = pageComponent.find(".main-content-area")[0]
      if (!contentArea) return

      // Get the actual DOM element to check dimensions
      const contentEl = contentArea.getEl()
      if (!contentEl) return

      const contentHeight = contentEl.scrollHeight
      const availableHeight = contentEl.clientHeight

      // If content overflows, we could implement auto-pagination here
      if (contentHeight > availableHeight) {
        console.log(`Page ${pageIndex + 1} content overflows - auto-pagination could be implemented here`)
        // Future enhancement: automatically move overflow content to next page
      }
    } catch (error) {
      console.error("Error checking page overflow:", error)
    }
  }

  setupPageObserver(pageIndex) {
    const pageComponent = this.editor.getWrapper().find(`[data-page-index="${pageIndex}"]`)[0];
    if (!pageComponent) {
      console.warn(`❌ Page component not found for index ${pageIndex}`);
      return;
    }

    const contentArea = pageComponent.find(".main-content-area")[0];
    if (!contentArea) {
      console.warn(`❌ .main-content-area not found in page ${pageIndex}`);
      return;
    }

    const contentEl = contentArea.getEl();
    if (!contentEl) {
      console.warn(`❌ contentEl (DOM) not available for page ${pageIndex}`);
      return;
    }

    // Disconnect existing observer if any
    if (this.pageObservers.has(pageIndex)) {
      this.pageObservers.get(pageIndex).disconnect();
    }

    console.log(`🔍 Setting up enhanced observer for page ${pageIndex}`);

    const observer = new MutationObserver((mutations) => {
      // FIXED: More selective mutation filtering
      let hasSignificantChange = false;

      for (const mutation of mutations) {
        // Only care about actual content additions/removals or substantial text changes
        if (mutation.type === 'childList') {
          const addedNodes = Array.from(mutation.addedNodes);
          const removedNodes = Array.from(mutation.removedNodes);

          // Filter out insignificant changes (like empty text nodes)
          const significantAdded = addedNodes.filter(node =>
            node.nodeType === Node.ELEMENT_NODE ||
            (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 5)
          );

          const significantRemoved = removedNodes.filter(node =>
            node.nodeType === Node.ELEMENT_NODE ||
            (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 5)
          );

          if (significantAdded.length > 0 || significantRemoved.length > 0) {
            hasSignificantChange = true;
            break;
          }
        } else if (mutation.type === 'characterData') {
          // Only trigger on substantial text changes
          if (mutation.target.textContent && mutation.target.textContent.trim().length > 20) {
            hasSignificantChange = true;
            break;
          }
        }
      }

      if (!hasSignificantChange) {
        return; // Skip insignificant mutations
      }

      // Clear existing debounce timer
      if (this.debounceTimers.has(pageIndex)) {
        clearTimeout(this.debounceTimers.get(pageIndex));
      }

      // FIXED: Longer debounce time for stability
      const timer = setTimeout(() => {
        // Double-check pagination flag before proceeding
        if (!this.paginationInProgress) {
          console.log(`🔁 Processing significant content change on page ${pageIndex}`);
          this.handleAutoPagination(pageIndex);
        } else {
          console.log(`⏸️ Skipping pagination check - operation in progress`);
        }
      }, 750); // Increased to 750ms for better stability

      this.debounceTimers.set(pageIndex, timer);
    });

    // FIXED: Observe only meaningful changes
    observer.observe(contentEl, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: false, // Ignore attribute changes
      attributeOldValue: false,
      characterDataOldValue: false
    });

    this.pageObservers.set(pageIndex, observer);
  }

  //// new pagition v2///
  handleAutoPagination(pageIndex) {
    
    this.handlePageBreak(pageIndex);
    if (this.paginationInProgress) {
      console.log(`⏸️ Pagination already in progress, skipping page ${pageIndex}`);
      return;
    }

    this.paginationInProgress = true;
    console.log(`🔄 Starting pagination for page ${pageIndex}`);

    const resetFlag = () => {
      this.paginationInProgress = false;
      console.log(`✅ Pagination flag reset for page ${pageIndex}`);
    };

    // Safety timeout to prevent permanent blocking
    setTimeout(resetFlag, 15000);

    try {
      const pageComponent = this.editor.getWrapper().find(`[data-page-index="${pageIndex}"]`)[0];
      if (!pageComponent) {
        console.warn(`❌ Page ${pageIndex} not found`);
        resetFlag();
        return;
      }

      const contentArea = pageComponent.find(".main-content-area")[0];
      if (!contentArea) {
        console.warn(`❌ Content area not found for page ${pageIndex}`);
        resetFlag();
        return;
      }

      const contentEl = contentArea.getEl();
      if (!contentEl) {
        console.warn(`❌ Content element not found for page ${pageIndex}`);
        resetFlag();
        return;
      }

      // ENHANCED: Force layout recalculation and get accurate measurements
      contentEl.offsetHeight;
      const actualHeight = Math.max(contentEl.scrollHeight, contentEl.offsetHeight);
      const availableHeight = contentEl.clientHeight;

      // FIXED: More lenient overflow detection
      const isOverflowing = actualHeight > (availableHeight + 10); // 10px tolerance

      console.log(`📊 OVERFLOW CHECK - Page ${pageIndex}:`);
      console.log(`   Content height: ${actualHeight}px`);
      console.log(`   Available height: ${availableHeight}px`);
      console.log(`   Overflow detected: ${isOverflowing}`);

      if (!isOverflowing) {
        console.log(`✅ No overflow on page ${pageIndex}`);
        resetFlag();
        return;
      }

      console.log(`🚨 OVERFLOW CONFIRMED - Processing content split`);

      // Get all components in content area
      const components = contentArea.components();
      if (components.length === 0) {
        console.log(`🔭 No components to move from page ${pageIndex}`);
        resetFlag();
        return;
      }

      console.log(`📦 Found ${components.length} components in overflowing page`);

      // ENHANCED: Try multiple splitting strategies
      let splitSuccess = false;

      // Strategy 1: Component-level splitting for multiple components
      if (components.length > 1) {
        console.log(`🔧 Strategy 1: Component-level split (${components.length} components)`);
        splitSuccess = this.splitMultipleComponentsEnhanced(components, pageIndex, availableHeight);
      }

      // Strategy 2: Single component intelligent splitting  
      if (!splitSuccess && components.length === 1) {
        console.log(`🔧 Strategy 2: Single component intelligent split`);
        splitSuccess = this.splitSingleComponentEnhanced(components.at(0), pageIndex, availableHeight);
      }

      // Strategy 3: Emergency content splitting
      if (!splitSuccess) {
        console.log(`🔧 Strategy 3: Emergency content split`);
        splitSuccess = this.emergencyContentSplit(contentArea, pageIndex, availableHeight);
      }

      if (splitSuccess) {
        setTimeout(() => {
          resetFlag();
          console.log(`✅ Pagination completed successfully for page ${pageIndex}`);

          // Check next page after a delay
          setTimeout(() => {
            const nextPageIndex = pageIndex + 1;
            if (nextPageIndex < this.pageSettings.numberOfPages) {
              this.checkPageForOverflow(nextPageIndex);
            }
          }, 800);
        }, 500);
      } else {
        console.error(`❌ All split strategies failed for page ${pageIndex}`);
        resetFlag();
      }

      

    } catch (error) {
      console.error(`❌ Error in handleAutoPagination for page ${pageIndex}:`, error);
      resetFlag();
    }
  }


  splitMultipleComponentsEnhanced(components, pageIndex, maxHeight) {
    console.log(`🔧 Enhanced multi-component split: ${components.length} components`);

    let totalHeight = 0;
    let splitIndex = -1;

    // Calculate cumulative heights to find optimal split point
    for (let i = 0; i < components.length; i++) {
      const component = components.at(i);
      const compEl = component.getEl();

      if (!compEl) continue;

      // ENHANCED: More accurate height calculation
      const compHeight = this.getEnhancedComponentHeight(compEl);
      totalHeight += compHeight;

      console.log(`📦 Component ${i}: ${compHeight}px (cumulative: ${totalHeight}px / ${maxHeight}px)`);

      // Find split point where we exceed maxHeight
      if (totalHeight > maxHeight && i > 0) {
        splitIndex = i;
        console.log(`✂️ Split point found at component ${i}`);
        break;
      }
    }

    // If no good split point found, split roughly in half
    if (splitIndex === -1 || splitIndex === 0) {
      splitIndex = Math.ceil(components.length / 2);
      console.log(`⚙️ Using half-split at component ${splitIndex}`);
    }

    // Ensure we don't split everything
    if (splitIndex >= components.length) {
      splitIndex = components.length - 1;
    }

    // Collect components to move
    const componentsToMove = [];
    for (let i = splitIndex; i < components.length; i++) {
      componentsToMove.push(components.at(i));
    }

    if (componentsToMove.length === 0) {
      console.warn(`⚠️ No components to move after split calculation`);
      return false;
    }

    console.log(`📤 Moving ${componentsToMove.length} components to next page`);

    // Ensure next page exists
    const nextPageIndex = pageIndex + 1;
    if (nextPageIndex >= this.pageSettings.numberOfPages) {
      console.log(`📄 Creating new page ${nextPageIndex + 1}`);
      this.addNewPage();

      // Wait for page creation then move content
      setTimeout(() => {
        this.moveComponentsToPageEnhanced(componentsToMove, nextPageIndex);
      }, 600);
    } else {
      this.moveComponentsToPageEnhanced(componentsToMove, nextPageIndex);
    }

    return true;
  }

  splitSingleComponentEnhanced(component, pageIndex, maxHeight) {
    console.log(`✂️ Enhanced single component split on page ${pageIndex}`);

    const compEl = component.getEl();
    if (!compEl) {
      console.warn(`❌ Component element not found`);
      return false;
    }

    // ENHANCED: Try multiple content splitting approaches
    console.log(`🔍 Analyzing component content structure...`);

    // Method 1: Split by child elements (divs, paragraphs, etc.)
    const childElements = Array.from(compEl.children);
    if (childElements.length > 1) {
      console.log(`🔧 Method 1: Split by child elements (${childElements.length} children)`);
      return this.splitByChildElementsEnhanced(component, childElements, pageIndex, maxHeight);
    }

    // Method 2: Split by line breaks in text content
    const textContent = compEl.textContent || compEl.innerText || '';
    if (textContent.includes('\n') && textContent.split('\n').length > 3) {
      console.log(`🔧 Method 2: Split by line breaks (${textContent.split('\n').length} lines)`);
      return this.splitByLinesEnhanced(component, pageIndex, maxHeight);
    }

    // Method 3: Split by sentences
    if (textContent.includes('.') && textContent.split('.').length > 3) {
      console.log(`🔧 Method 3: Split by sentences`);
      return this.splitBySentencesEnhanced(component, pageIndex, maxHeight);
    }

    // Method 4: Force split by character count
    if (textContent.length > 500) {
      console.log(`🔧 Method 4: Force split by character count`);
      return this.splitByCharacterCountEnhanced(component, pageIndex, maxHeight);
    }

    console.warn(`⚠️ Cannot split single component - no suitable split points found`);
    return false;
  }

  splitByChildElementsEnhanced(component, childElements, pageIndex, maxHeight) {
    console.log(`🔧 Splitting ${childElements.length} child elements`);

    let accumulatedHeight = 0;
    let splitPoint = -1;

    for (let i = 0; i < childElements.length; i++) {
      const child = childElements[i];
      const childHeight = this.getEnhancedElementHeight(child);
      accumulatedHeight += childHeight;

      console.log(`📦 Child ${i} (${child.tagName}): ${childHeight}px (total: ${accumulatedHeight}px)`);

      if (accumulatedHeight > maxHeight && i > 0) {
        splitPoint = i;
        break;
      }
    }

    if (splitPoint === -1 || splitPoint === 0) {
      splitPoint = Math.ceil(childElements.length / 2);
    }

    const elementsToMove = childElements.slice(splitPoint);
    const overflowHTML = elementsToMove.map(el => el.outerHTML).join('');

    // Remove elements from original
    elementsToMove.forEach(el => el.remove());

    // Create overflow component
    return this.createAndMoveOverflowComponent(overflowHTML, component, pageIndex);
  }

  splitByLinesEnhanced(component, pageIndex, maxHeight) {
    const compEl = component.getEl();
    const originalText = compEl.textContent || compEl.innerText || '';
    const lines = originalText.split('\n').filter(line => line.trim().length > 0);

    if (lines.length <= 1) return false;

    console.log(`📄 Splitting ${lines.length} lines`);

    // Estimate how many lines fit in the available space
    const sampleLineHeight = 20; // Approximate line height in pixels
    const approximateLinesPerPage = Math.floor(maxHeight / sampleLineHeight);
    let splitPoint = Math.min(approximateLinesPerPage, Math.ceil(lines.length * 0.6));

    if (splitPoint <= 0) splitPoint = 1;
    if (splitPoint >= lines.length) splitPoint = lines.length - 1;

    const remainingLines = lines.slice(0, splitPoint);
    const overflowLines = lines.slice(splitPoint);

    console.log(`📝 Keeping ${remainingLines.length} lines, moving ${overflowLines.length} lines`);

    // Update original component
    compEl.textContent = remainingLines.join('\n');

    // Create overflow component
    const overflowText = overflowLines.join('\n');
    return this.createAndMoveOverflowComponent(overflowText, component, pageIndex);
  }

  splitBySentencesEnhanced(component, pageIndex, maxHeight) {
    const compEl = component.getEl();
    const originalText = compEl.textContent || compEl.innerText || '';
    const sentences = originalText.split(/[.!?]+/).filter(s => s.trim().length > 0);

    if (sentences.length <= 1) return false;

    console.log(`📝 Splitting ${sentences.length} sentences`);

    const splitPoint = Math.ceil(sentences.length * 0.6); // Take 60% for first page
    const remainingSentences = sentences.slice(0, splitPoint);
    const overflowSentences = sentences.slice(splitPoint);

    // Update original
    compEl.textContent = remainingSentences.join('. ') + '.';

    // Create overflow
    const overflowText = overflowSentences.join('. ') + '.';
    return this.createAndMoveOverflowComponent(overflowText, component, pageIndex);
  }

  splitByCharacterCountEnhanced(component, pageIndex, maxHeight) {
    const compEl = component.getEl();
    const originalText = compEl.textContent || compEl.innerText || '';

    if (originalText.length <= 100) return false;

    console.log(`📝 Force splitting text (${originalText.length} characters)`);

    // Split at 60% of content
    const splitPoint = Math.floor(originalText.length * 0.6);

    // Try to split at a word boundary near the split point
    let actualSplitPoint = splitPoint;
    for (let i = splitPoint; i < Math.min(splitPoint + 50, originalText.length); i++) {
      if (originalText[i] === ' ' || originalText[i] === '\n') {
        actualSplitPoint = i;
        break;
      }
    }

    const firstPart = originalText.substring(0, actualSplitPoint);
    const secondPart = originalText.substring(actualSplitPoint);

    // Update original
    compEl.textContent = firstPart;

    // Create overflow
    return this.createAndMoveOverflowComponent(secondPart, component, pageIndex);
  }

  createAndMoveOverflowComponent(content, originalComponent, pageIndex) {
    try {
      console.log(`📦 Creating overflow component for page ${pageIndex + 1}`);

      // Create new component with same styling as original
      const newComponent = this.editor.Components.addComponent({
        tagName: originalComponent.get('tagName') || 'div',
        content: content,
        style: {
          width: '100%',
          'box-sizing': 'border-box',
          ...originalComponent.getStyle()
        },
        attributes: {
          ...originalComponent.getAttributes()
        }
      });

      // Ensure next page exists
      const nextPageIndex = pageIndex + 1;
      if (nextPageIndex >= this.pageSettings.numberOfPages) {
        console.log(`📄 Creating new page ${nextPageIndex + 1}`);
        this.addNewPage();

        // Wait for page creation, then move content
        setTimeout(() => {
          this.moveComponentsToPageEnhanced([newComponent], nextPageIndex);
        }, 600);
      } else {
        this.moveComponentsToPageEnhanced([newComponent], nextPageIndex);
      }

      return true;

    } catch (error) {
      console.error(`❌ Error creating overflow component:`, error);
      return false;
    }
  }

  moveComponentsToPageEnhanced(components, targetPageIndex) {
    try {
      const targetPageComponent = this.editor.getWrapper().find(`[data-page-index="${targetPageIndex}"]`)[0];
      if (!targetPageComponent) {
        console.error(`❌ Target page ${targetPageIndex} not found`);
        return false;
      }

      const targetContentArea = targetPageComponent.find(".main-content-area")[0];
      if (!targetContentArea) {
        console.error(`❌ Target content area not found`);
        return false;
      }

      console.log(`📤 Moving ${components.length} components to page ${targetPageIndex + 1}`);

      // Temporarily disconnect observer to prevent cascading mutations
      if (this.pageObservers.has(targetPageIndex)) {
        this.pageObservers.get(targetPageIndex).disconnect();
        console.log(`⏸️ Temporarily disconnected observer for page ${targetPageIndex}`);
      }

      let successCount = 0;

      components.forEach((component, index) => {
        try {
          if (!component || !component.getEl()) {
            console.warn(`⚠️ Component ${index} invalid, skipping`);
            return;
          }

          // ENHANCED: Proper component movement
          component.remove();
          targetContentArea.append(component);
          successCount++;

          console.log(`✅ Moved component ${index} successfully`);

        } catch (compError) {
          console.error(`❌ Error moving component ${index}:`, compError);
        }
      });

      // Reconnect observer after delay
      setTimeout(() => {
        this.setupPageObserver(targetPageIndex);
        console.log(`🔄 Reconnected observer for page ${targetPageIndex + 1}`);
      }, 400);

      console.log(`📋 Movement complete: ${successCount}/${components.length} components moved successfully`);
      return successCount > 0;

    } catch (error) {
      console.error(`❌ Error in moveComponentsToPageEnhanced:`, error);
      return false;
    }
  }

  emergencyContentSplit(contentArea, pageIndex, maxHeight) {
    console.log(`🚨 EMERGENCY SPLIT for page ${pageIndex}`);

    try {
      const contentEl = contentArea.getEl();
      if (!contentEl) return false;

      // Get ALL content as HTML
      const allHTML = contentEl.innerHTML;
      if (!allHTML || allHTML.trim().length === 0) return false;

      console.log(`📄 Emergency splitting HTML content (${allHTML.length} characters)`);

      // ENHANCED: Try to find a good break point
      const halfLength = Math.floor(allHTML.length * 0.6); // Take 60% for first page
      let breakPoint = halfLength;

      // Look for tag boundaries near the break point
      for (let i = halfLength; i < allHTML.length && i < halfLength + 300; i++) {
        if (allHTML.substring(i, i + 5) === '</br>' ||
          allHTML.substring(i, i + 6) === '</div>' ||
          allHTML.substring(i, i + 4) === '</p>') {
          breakPoint = i + allHTML.substring(i).indexOf('>') + 1;
          break;
        }
      }

      const firstPart = allHTML.substring(0, breakPoint);
      const secondPart = allHTML.substring(breakPoint);

      console.log(`✂️ Emergency split: ${firstPart.length} chars stay, ${secondPart.length} chars move`);

      // Update current page content
      contentEl.innerHTML = firstPart;

      // Create overflow component with second part
      const overflowComponent = this.editor.Components.addComponent({
        tagName: 'div',
        content: secondPart,
        style: {
          width: '100%',
          'box-sizing': 'border-box'
        }
      });

      // Move to next page
      const nextPageIndex = pageIndex + 1;
      if (nextPageIndex >= this.pageSettings.numberOfPages) {
        this.addNewPage();

        setTimeout(() => {
          this.moveComponentsToPageEnhanced([overflowComponent], nextPageIndex);
        }, 600);
      } else {
        this.moveComponentsToPageEnhanced([overflowComponent], nextPageIndex);
      }

      console.log(`✅ Emergency split completed`);
      return true;

    } catch (error) {
      console.error(`❌ Emergency split failed:`, error);
      return false;
    }
  }

  getEnhancedComponentHeight(element) {
    if (!element) return 0;

    // Force layout recalculation
    element.offsetHeight;

    // Get multiple height measurements
    const offsetHeight = element.offsetHeight;
    const scrollHeight = element.scrollHeight;
    const boundingHeight = element.getBoundingClientRect().height;

    // Account for margins
    const computedStyle = window.getComputedStyle(element);
    const marginTop = parseFloat(computedStyle.marginTop) || 0;
    const marginBottom = parseFloat(computedStyle.marginBottom) || 0;

    // Return the maximum height plus margins
    const maxHeight = Math.max(offsetHeight, scrollHeight, boundingHeight);
    return maxHeight + marginTop + marginBottom;
  }

  getEnhancedElementHeight(element) {
    if (!element) return 0;

    // Force layout
    element.offsetHeight;

    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    const marginTop = parseFloat(style.marginTop) || 0;
    const marginBottom = parseFloat(style.marginBottom) || 0;

    return Math.max(element.offsetHeight, element.scrollHeight, rect.height) + marginTop + marginBottom;
  }

  // end of new pagition v2///

  splitAnyContentType(component, pageIndex, maxHeight) {
    console.log(`✂️ UNIVERSAL SPLIT: Analyzing component content type`);

    const compEl = component.getEl();
    if (!compEl) return false;

    const componentHeight = Math.max(compEl.scrollHeight, compEl.offsetHeight);
    console.log(`📏 Component total height: ${componentHeight}px (max allowed: ${maxHeight}px)`);

    // Strategy 1: Try to split by child elements (divs, paragraphs, etc.)
    const childElements = Array.from(compEl.children);
    if (childElements.length > 1) {
      console.log(`🔧 Strategy 1: Split by child elements (${childElements.length} children)`);
      return this.splitByChildElements(component, childElements, pageIndex, maxHeight);
    }

    // Strategy 2: Try to split by nested content (p, div, h1-h6, li, etc.)
    const nestedElements = compEl.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6, li, section, article');
    if (nestedElements.length > 1) {
      console.log(`🔧 Strategy 2: Split by nested elements (${nestedElements.length} elements)`);
      return this.splitByNestedElements(component, nestedElements, pageIndex, maxHeight);
    }

    // Strategy 3: Split by text content (for plain text or single paragraph)
    const textContent = compEl.textContent || compEl.innerText || '';
    if (textContent.trim().length > 100) {
      console.log(`🔧 Strategy 3: Split by text content (${textContent.length} characters)`);
      return this.splitByTextContent(component, pageIndex, maxHeight);
    }

    // Strategy 4: Emergency - just move the whole component
    console.log(`🔧 Strategy 4: Emergency - move entire component`);
    return this.moveEntireComponent(component, pageIndex);
  }

  // STRATEGY 1: Split by direct child elements
  splitByChildElements(component, childElements, pageIndex, maxHeight) {
    console.log(`🔧 Splitting by ${childElements.length} child elements`);

    let accumulatedHeight = 0;
    let splitPoint = -1;

    for (let i = 0; i < childElements.length; i++) {
      const child = childElements[i];
      const childHeight = Math.max(child.offsetHeight, child.scrollHeight);
      accumulatedHeight += childHeight;

      console.log(`📦 Child ${i}: ${childHeight}px (total: ${accumulatedHeight}px)`);

      if (accumulatedHeight > maxHeight && i > 0) {
        splitPoint = i;
        break;
      }
    }

    if (splitPoint === -1) {
      // If no split point found, split roughly in half
      splitPoint = Math.ceil(childElements.length / 2);
    }

    if (splitPoint === 0) splitPoint = 1; // Never split at 0

    const elementsToMove = childElements.slice(splitPoint);
    const overflowHTML = elementsToMove.map(el => el.outerHTML).join('');

    // Remove elements from original
    elementsToMove.forEach(el => el.remove());

    // Create new component with overflow content
    this.createOverflowComponent(overflowHTML, component, pageIndex);

    console.log(`✅ Split by child elements: moved ${elementsToMove.length} elements`);
    return true;
  }

  splitByNestedElements(component, nestedElements, pageIndex, maxHeight) {
    console.log(`🔧 Splitting by ${nestedElements.length} nested elements`);

    let accumulatedHeight = 0;
    let splitPoint = -1;

    for (let i = 0; i < nestedElements.length; i++) {
      const element = nestedElements[i];
      const elementHeight = Math.max(element.offsetHeight, element.scrollHeight);
      accumulatedHeight += elementHeight;

      console.log(`📦 Nested ${i} (${element.tagName}): ${elementHeight}px (total: ${accumulatedHeight}px)`);

      if (accumulatedHeight > maxHeight && i > 0) {
        splitPoint = i;
        break;
      }
    }

    if (splitPoint === -1) {
      splitPoint = Math.ceil(nestedElements.length / 2);
    }

    if (splitPoint === 0) splitPoint = 1;

    const elementsToMove = Array.from(nestedElements).slice(splitPoint);
    const overflowHTML = elementsToMove.map(el => el.outerHTML).join('');

    // Remove elements from original
    elementsToMove.forEach(el => el.remove());

    // Create new component with overflow content
    this.createOverflowComponent(overflowHTML, component, pageIndex);

    console.log(`✅ Split by nested elements: moved ${elementsToMove.length} elements`);
    return true;
  }

  // STRATEGY 3: Split by text content (for plain text, JSON, etc.)
  splitByTextContent(component, pageIndex, maxHeight) {
    console.log(`🔧 Splitting by text content`);

    const compEl = component.getEl();
    const originalText = compEl.textContent || compEl.innerText || '';

    if (originalText.trim().length === 0) {
      console.warn(`⚠️ No text content to split`);
      return false;
    }

    console.log(`📝 Original text length: ${originalText.length} characters`);

    // UNIVERSAL: Try different text splitting methods
    let splitSuccess = false;

    // Method 1: Split by lines/paragraphs
    if (originalText.includes('\n')) {
      console.log(`🔧 Splitting by line breaks`);
      splitSuccess = this.splitTextByLines(component, originalText, pageIndex, maxHeight);
    }

    // Method 2: Split by sentences
    if (!splitSuccess && originalText.includes('.')) {
      console.log(`🔧 Splitting by sentences`);
      splitSuccess = this.splitTextBySentences(component, originalText, pageIndex, maxHeight);
    }

    // Method 3: Split by words (last resort)
    if (!splitSuccess) {
      console.log(`🔧 Splitting by words (last resort)`);
      splitSuccess = this.splitTextByWords(component, originalText, pageIndex, maxHeight);
    }

    return splitSuccess;
  }

  splitTextByLines(component, originalText, pageIndex, maxHeight) {
    const lines = originalText.split('\n').filter(line => line.trim().length > 0);

    if (lines.length <= 1) return false;

    console.log(`📄 Splitting ${lines.length} lines`);

    // FIXED: Calculate how many lines fit based on estimated line height
    const estimatedLineHeight = maxHeight / lines.length;
    const approximateLinesPerPage = Math.floor(maxHeight / Math.max(estimatedLineHeight, 20));

    let splitPoint = Math.min(approximateLinesPerPage, Math.ceil(lines.length / 2));
    if (splitPoint === 0) splitPoint = 1;

    const remainingLines = lines.slice(0, splitPoint);
    const overflowLines = lines.slice(splitPoint);

    // Update original component
    component.getEl().textContent = remainingLines.join('\n');

    // Create overflow component
    const overflowText = overflowLines.join('\n');
    this.createOverflowComponent(overflowText, component, pageIndex);

    console.log(`✅ Split by lines: ${remainingLines.length} stayed, ${overflowLines.length} moved`);
    return true;
  }

  // Split text by sentences
  splitTextBySentences(component, originalText, pageIndex, maxHeight) {
    const sentences = originalText.split(/[.!?]+/).filter(s => s.trim().length > 0);

    if (sentences.length <= 1) return false;

    console.log(`📄 Splitting ${sentences.length} sentences`);

    const splitPoint = Math.ceil(sentences.length / 2);
    const remainingSentences = sentences.slice(0, splitPoint);
    const overflowSentences = sentences.slice(splitPoint);

    // Update original
    component.getEl().textContent = remainingSentences.join('. ') + '.';

    // Create overflow
    const overflowText = overflowSentences.join('. ') + '.';
    this.createOverflowComponent(overflowText, component, pageIndex);

    console.log(`✅ Split by sentences: ${remainingSentences.length} stayed, ${overflowSentences.length} moved`);
    return true;
  }

  // Split text by words (last resort)
  splitTextByWords(component, originalText, pageIndex, maxHeight) {
    const words = originalText.split(/\s+/).filter(w => w.trim().length > 0);

    if (words.length <= 10) {
      // Too few words, just move entire component
      return this.moveEntireComponent(component, pageIndex);
    }

    console.log(`📄 Splitting ${words.length} words`);

    const splitPoint = Math.ceil(words.length / 2);
    const remainingWords = words.slice(0, splitPoint);
    const overflowWords = words.slice(splitPoint);

    // Update original
    component.getEl().textContent = remainingWords.join(' ');

    // Create overflow
    const overflowText = overflowWords.join(' ');
    this.createOverflowComponent(overflowText, component, pageIndex);

    console.log(`✅ Split by words: ${remainingWords.length} stayed, ${overflowWords.length} moved`);
    return true;
  }

  createOverflowComponent(content, originalComponent, pageIndex) {
    try {
      console.log(`📦 Creating overflow component for page ${pageIndex + 1}`);

      // Create new component with same styling as original
      const newComponent = this.editor.Components.addComponent({
        tagName: originalComponent.get('tagName') || 'div',
        content: content,
        style: {
          width: '100%',
          'box-sizing': 'border-box',
          ...originalComponent.getStyle()
        },
        attributes: {
          ...originalComponent.getAttributes()
        }
      });

      // Ensure next page exists
      const nextPageIndex = pageIndex + 1;
      if (nextPageIndex >= this.pageSettings.numberOfPages) {
        console.log(`📄 Creating new page ${nextPageIndex + 1}`);
        this.addNewPage();

        // Wait for page creation, then move content
        setTimeout(() => {
          this.moveToTargetPage(newComponent, nextPageIndex);
        }, 400);
      } else {
        this.moveToTargetPage(newComponent, nextPageIndex);
      }

      return true;

    } catch (error) {
      console.error(`❌ Error creating overflow component:`, error);
      return false;
    }
  }

  moveEntireComponent(component, pageIndex) {
    console.log(`🚚 Moving entire component from page ${pageIndex} to next page`);

    try {
      const nextPageIndex = pageIndex + 1;

      // Ensure next page exists
      if (nextPageIndex >= this.pageSettings.numberOfPages) {
        console.log(`📄 Creating new page ${nextPageIndex + 1} for entire component`);
        this.addNewPage();

        setTimeout(() => {
          this.moveToTargetPage(component, nextPageIndex);
        }, 400);
      } else {
        this.moveToTargetPage(component, nextPageIndex);
      }

      return true;

    } catch (error) {
      console.error(`❌ Error moving entire component:`, error);
      return false;
    }
  }

  splitMultipleComponents(components, pageIndex, maxHeight) {
    console.log(`🔧 Splitting ${components.length} components`);

    let totalHeight = 0;
    let splitIndex = -1;

    // Find where total height exceeds maxHeight
    for (let i = 0; i < components.length; i++) {
      const component = components.at(i);
      const compEl = component.getEl();

      if (!compEl) continue;

      const compHeight = Math.max(compEl.offsetHeight, compEl.scrollHeight);
      totalHeight += compHeight;

      console.log(`📦 Component ${i}: ${compHeight}px (total: ${totalHeight}px)`);

      if (totalHeight > maxHeight && i > 0) {
        splitIndex = i;
        console.log(`✂️ Split at component ${i}`);
        break;
      }
    }

    if (splitIndex === -1 || splitIndex === 0) {
      // If can't find good split, split in half
      splitIndex = Math.ceil(components.length / 2);
      console.log(`⚙️ Using half-split at component ${splitIndex}`);
    }

    // Collect components to move
    const componentsToMove = [];
    for (let i = splitIndex; i < components.length; i++) {
      componentsToMove.push(components.at(i));
    }

    if (componentsToMove.length === 0) return false;

    console.log(`📤 Moving ${componentsToMove.length} components to next page`);

    // Ensure next page exists
    const nextPageIndex = pageIndex + 1;
    if (nextPageIndex >= this.pageSettings.numberOfPages) {
      this.addNewPage();

      setTimeout(() => {
        this.moveMultipleComponents(componentsToMove, nextPageIndex);
      }, 400);
    } else {
      this.moveMultipleComponents(componentsToMove, nextPageIndex);
    }

    return true;
  }

  moveToTargetPage(component, targetPageIndex) {
    try {
      const targetPageComponent = this.editor.getWrapper().find(`[data-page-index="${targetPageIndex}"]`)[0];
      if (!targetPageComponent) {
        console.error(`❌ Target page ${targetPageIndex} not found`);
        return false;
      }

      const targetContentArea = targetPageComponent.find(".main-content-area")[0];
      if (!targetContentArea) {
        console.error(`❌ Target content area not found`);
        return false;
      }

      // Temporarily disconnect observer
      if (this.pageObservers.has(targetPageIndex)) {
        this.pageObservers.get(targetPageIndex).disconnect();
        console.log(`⏸️ Disconnected observer for page ${targetPageIndex}`);
      }

      // Move component
      component.remove();
      targetContentArea.append(component);

      console.log(`✅ Component moved to page ${targetPageIndex + 1}`);

      // Reconnect observer
      setTimeout(() => {
        this.setupPageObserver(targetPageIndex);
        console.log(`🔄 Reconnected observer for page ${targetPageIndex + 1}`);
      }, 200);

      return true;

    } catch (error) {
      console.error(`❌ Error moving to target page:`, error);
      return false;
    }
  }

  moveMultipleComponents(components, targetPageIndex) {
    try {
      const targetPageComponent = this.editor.getWrapper().find(`[data-page-index="${targetPageIndex}"]`)[0];
      if (!targetPageComponent) {
        console.error(`❌ Target page ${targetPageIndex} not found`);
        return false;
      }

      const targetContentArea = targetPageComponent.find(".main-content-area")[0];
      if (!targetContentArea) {
        console.error(`❌ Target content area not found`);
        return false;
      }

      // Temporarily disconnect observer
      if (this.pageObservers.has(targetPageIndex)) {
        this.pageObservers.get(targetPageIndex).disconnect();
      }

      console.log(`📤 Moving ${components.length} components to page ${targetPageIndex + 1}`);

      let successCount = 0;

      components.forEach((component, index) => {
        try {
          if (!component || !component.getEl()) {
            console.warn(`⚠️ Component ${index} invalid, skipping`);
            return;
          }

          component.remove();
          targetContentArea.append(component);
          successCount++;

          console.log(`✅ Moved component ${index}`);

        } catch (error) {
          console.error(`❌ Error moving component ${index}:`, error);
        }
      });

      // Reconnect observer
      setTimeout(() => {
        this.setupPageObserver(targetPageIndex);
      }, 200);

      console.log(`📋 Moved ${successCount}/${components.length} components successfully`);
      return successCount > 0;

    } catch (error) {
      console.error(`❌ Error moving multiple components:`, error);
      return false;
    }
  }


  emergencySplitContent(contentArea, pageIndex, maxHeight) {
    console.log(`🚨 EMERGENCY SPLIT for page ${pageIndex}`);

    try {
      const contentEl = contentArea.getEl();
      if (!contentEl) return false;

      // Get ALL content as HTML
      const allHTML = contentEl.innerHTML;

      if (!allHTML || allHTML.trim().length === 0) return false;

      console.log(`📄 Emergency splitting HTML content (${allHTML.length} characters)`);

      // Simple approach: split content roughly in half
      const halfLength = Math.floor(allHTML.length / 2);

      // Try to find a good break point near the middle
      let breakPoint = halfLength;

      // Look for tag boundaries near the middle
      for (let i = halfLength; i < allHTML.length && i < halfLength + 200; i++) {
        if (allHTML[i] === '>' && allHTML[i - 1] !== '-') {
          breakPoint = i + 1;
          break;
        }
      }

      const firstHalf = allHTML.substring(0, breakPoint);
      const secondHalf = allHTML.substring(breakPoint);

      console.log(`✂️ Emergency split: ${firstHalf.length} chars stay, ${secondHalf.length} chars move`);

      // Update current page content
      contentEl.innerHTML = firstHalf;

      // Create overflow component with second half
      const overflowComponent = this.editor.Components.addComponent({
        tagName: 'div',
        content: secondHalf,
        style: {
          width: '100%',
          'box-sizing': 'border-box'
        }
      });

      // Move to next page
      const nextPageIndex = pageIndex + 1;
      if (nextPageIndex >= this.pageSettings.numberOfPages) {
        this.addNewPage();

        setTimeout(() => {
          this.moveToTargetPage(overflowComponent, nextPageIndex);
        }, 400);
      } else {
        this.moveToTargetPage(overflowComponent, nextPageIndex);
      }

      console.log(`✅ Emergency split completed`);
      return true;

    } catch (error) {
      console.error(`❌ Emergency split failed:`, error);
      return false;
    }
  }

  detectRealOverflow(contentEl, pageIndex) {
    // Force layout recalculation
    contentEl.offsetHeight;

    const scrollHeight = contentEl.scrollHeight;
    const clientHeight = contentEl.clientHeight;
    const offsetHeight = contentEl.offsetHeight;

    console.log(`🔍 UNIVERSAL OVERFLOW CHECK for page ${pageIndex}:`);
    console.log(`   scrollHeight: ${scrollHeight}px`);
    console.log(`   clientHeight: ${clientHeight}px`);
    console.log(`   offsetHeight: ${offsetHeight}px`);

    // Primary check: content height vs available height
    const heightOverflow = scrollHeight > (clientHeight + 5);

    // Secondary check: can the element scroll?
    const canScroll = contentEl.scrollTop !== contentEl.scrollHeight - contentEl.clientHeight;

    // Tertiary check: visual overflow
    let hasVisualOverflow = false;
    const containerRect = contentEl.getBoundingClientRect();
    const allChildren = contentEl.querySelectorAll('*');

    for (let child of allChildren) {
      const childRect = child.getBoundingClientRect();
      if (childRect.bottom > containerRect.bottom + 5) {
        console.log(`🔍 Visual overflow: ${child.tagName}#${child.id} extends beyond container`);
        hasVisualOverflow = true;
        break;
      }
    }

    const isOverflowing = heightOverflow || hasVisualOverflow || (scrollHeight > clientHeight);

    console.log(`📊 OVERFLOW DECISION: ${isOverflowing}`);
    console.log(`   Height overflow: ${heightOverflow}`);
    console.log(`   Visual overflow: ${hasVisualOverflow}`);
    console.log(`   Scroll possible: ${scrollHeight > clientHeight}`);

    return isOverflowing;
  }

  triggerPaginationForPage(pageIndex) {
    console.log(`🧪 MANUAL TRIGGER: Testing pagination for page ${pageIndex}`);

    // Reset any stuck state
    this.paginationInProgress = false;

    // Clear existing timers
    if (this.debounceTimers.has(pageIndex)) {
      clearTimeout(this.debounceTimers.get(pageIndex));
      this.debounceTimers.delete(pageIndex);
    }

    // Force immediate check
    setTimeout(() => {
      this.handleAutoPagination(pageIndex);
    }, 100);
  }

  forceSplitPage(pageIndex) {
    console.log(`🔨 FORCE SPLIT: Page ${pageIndex}`);

    const pageComponent = this.editor.getWrapper().find(`[data-page-index="${pageIndex}"]`)[0];
    if (!pageComponent) return;

    const contentArea = pageComponent.find(".main-content-area")[0];
    if (!contentArea) return;

    const components = contentArea.components();
    if (components.length === 0) return;

    // Force split regardless of height
    if (components.length === 1) {
      // Single component - force text split
      const component = components.at(0);
      const compEl = component.getEl();
      const content = compEl.textContent || compEl.innerHTML;

      if (content.length > 50) {
        const midPoint = Math.floor(content.length / 2);
        const firstHalf = content.substring(0, midPoint);
        const secondHalf = content.substring(midPoint);

        compEl.textContent = firstHalf;
        this.createOverflowComponent(secondHalf, component, pageIndex);

        console.log(`✅ Force split single component completed`);
      }
    } else {
      // Multiple components - move half
      const splitIndex = Math.ceil(components.length / 2);
      const componentsToMove = [];

      for (let i = splitIndex; i < components.length; i++) {
        componentsToMove.push(components.at(i));
      }

      if (nextPageIndex >= this.pageSettings.numberOfPages) {
        this.addNewPage();
      }

      this.moveMultipleComponents(componentsToMove, pageIndex + 1);
      console.log(`✅ Force split multiple components completed`);
    }
  }

  findComponentSplitPoint(components, maxHeight) {
    let totalHeight = 0;
    let splitIndex = -1;

    for (let i = 0; i < components.length; i++) {
      const component = components.at(i);
      const compEl = component.getEl();

      if (!compEl) continue;

      const compHeight = this.getAccurateComponentHeight(compEl);

      console.log(`📦 Component ${i}: ${compHeight}px (total: ${totalHeight + compHeight}px/${maxHeight}px)`);

      // Check if adding this component would exceed the limit
      if (totalHeight + compHeight > maxHeight && i > 0) {
        splitIndex = i;
        console.log(`✂️ Split point found at component ${i}`);
        break;
      }

      totalHeight += compHeight;
    }

    if (splitIndex <= 0) {
      return { canSplit: false };
    }

    // Collect overflow components
    const overflowComponents = [];
    for (let i = splitIndex; i < components.length; i++) {
      overflowComponents.push(components.at(i));
    }

    return {
      canSplit: true,
      splitType: 'components',
      overflowComponents: overflowComponents
    };
  }

  splitSingleLargeComponent(component, pageIndex, maxHeight) {
    console.log(`✂️ Splitting single large component on page ${pageIndex}`);

    const compEl = component.getEl();
    if (!compEl) {
      console.warn(`❌ Component element not found`);
      return false;
    }

    // Find all paragraphs or breakable elements
    const breakableElements = compEl.querySelectorAll('p, div.paragraph, h1, h2, h3, h4, h5, h6');

    if (breakableElements.length === 0) {
      console.warn(`⚠️ No breakable elements found in component`);
      return false;
    }

    console.log(`📝 Found ${breakableElements.length} breakable elements`);

    // FIXED: Calculate split point based on cumulative height
    let accumulatedHeight = 0;
    let splitAtElement = -1;
    const containerRect = compEl.getBoundingClientRect();

    for (let i = 0; i < breakableElements.length; i++) {
      const element = breakableElements[i];
      const elementHeight = Math.max(
        element.offsetHeight,
        element.scrollHeight,
        element.getBoundingClientRect().height
      );

      accumulatedHeight += elementHeight;

      console.log(`📄 Element ${i} (${element.tagName}): ${elementHeight}px (total: ${accumulatedHeight}px)`);

      // Split when we exceed maxHeight, but not on the first element
      if (accumulatedHeight > maxHeight && i > 0) {
        splitAtElement = i;
        console.log(`✂️ Split point found at element ${i}`);
        break;
      }
    }

    if (splitAtElement === -1 || splitAtElement === 0) {
      console.log(`⚠️ Cannot find valid split point in component`);
      return false;
    }

    try {
      // FIXED: Split the content properly
      const elementsToMove = Array.from(breakableElements).slice(splitAtElement);

      if (elementsToMove.length === 0) {
        console.log(`📭 No elements to move after split point`);
        return false;
      }

      console.log(`📦 Moving ${elementsToMove.length} elements to next page`);

      // Create new component with overflow content
      const overflowContent = elementsToMove.map(el => el.outerHTML).join('');

      // Remove overflow elements from original component
      elementsToMove.forEach(el => el.remove());

      // Create new component for next page
      const newComponent = this.editor.Components.addComponent({
        tagName: 'div',
        content: overflowContent,
        style: {
          width: '100%',
          'box-sizing': 'border-box'
        }
      });

      // Ensure next page exists
      const nextPageIndex = pageIndex + 1;
      if (nextPageIndex >= this.pageSettings.numberOfPages) {
        this.addNewPage();

        // Wait for page creation
        setTimeout(() => {
          this.moveComponentToNextPage(newComponent, nextPageIndex);
        }, 300);
      } else {
        this.moveComponentToNextPage(newComponent, nextPageIndex);
      }

      console.log(`✅ Single component split completed`);
      return true;

    } catch (error) {
      console.error(`❌ Error splitting single component:`, error);
      return false;
    }
  }

  moveComponentToNextPage(component, targetPageIndex) {
    try {
      const targetPageComponent = this.editor.getWrapper().find(`[data-page-index="${targetPageIndex}"]`)[0];
      if (!targetPageComponent) {
        console.error(`❌ Target page ${targetPageIndex} not found`);
        return false;
      }

      const targetContentArea = targetPageComponent.find(".main-content-area")[0];
      if (!targetContentArea) {
        console.error(`❌ Target content area not found`);
        return false;
      }

      // Temporarily disconnect observer
      if (this.pageObservers.has(targetPageIndex)) {
        this.pageObservers.get(targetPageIndex).disconnect();
      }

      // Move the component
      targetContentArea.append(component);

      console.log(`✅ Component moved to page ${targetPageIndex + 1}`);

      // Reconnect observer after delay
      setTimeout(() => {
        this.setupPageObserver(targetPageIndex);
      }, 200);

      return true;

    } catch (error) {
      console.error(`❌ Error moving component to page ${targetPageIndex}:`, error);
      return false;
    }
  }

  performComponentMove(components, targetPageIndex, callback) {
    try {
      const targetPageComponent = this.editor.getWrapper().find(`[data-page-index="${targetPageIndex}"]`)[0];
      if (!targetPageComponent) {
        console.error(`❌ Target page ${targetPageIndex} not found`);
        callback();
        return;
      }

      const targetContentArea = targetPageComponent.find(".main-content-area")[0];
      if (!targetContentArea) {
        console.error(`❌ Target content area not found`);
        callback();
        return;
      }

      console.log(`📤 Moving ${components.length} components to page ${targetPageIndex + 1}`);

      // Temporarily disconnect observer to prevent mutation loops
      if (this.pageObservers.has(targetPageIndex)) {
        this.pageObservers.get(targetPageIndex).disconnect();
        console.log(`⏸️ Disconnected observer for target page ${targetPageIndex}`);
      }

      let successCount = 0;

      // Move components one by one with error handling
      components.forEach((component, index) => {
        try {
          if (!component || !component.getEl()) {
            console.warn(`⚠️ Component ${index} is invalid, skipping`);
            return;
          }

          // FIXED: Simple remove and append without cloning
          component.remove();
          targetContentArea.append(component);

          successCount++;
          console.log(`✅ Moved component ${index} to page ${targetPageIndex + 1}`);

        } catch (compError) {
          console.error(`❌ Error moving component ${index}:`, compError);
        }
      });

      // Reconnect observer and finish
      setTimeout(() => {
        this.setupPageObserver(targetPageIndex);
        console.log(`🔄 Reconnected observer for page ${targetPageIndex + 1}`);

        // Schedule check for next page if it has content
        if (successCount > 0) {
          setTimeout(() => {
            const nextPageComponent = this.editor.getWrapper().find(`[data-page-index="${targetPageIndex}"]`)[0];
            if (nextPageComponent) {
              const nextContentArea = nextPageComponent.find(".main-content-area")[0];
              if (nextContentArea && nextContentArea.components().length > 0) {
                console.log(`🔄 Checking next page ${targetPageIndex + 1} for overflow`);
                this.handleAutoPagination(targetPageIndex);
              }
            }
          }, 500);
        }

        callback();
      }, 300);

      console.log(`📋 Component movement completed: ${successCount}/${components.length} successful`);

    } catch (error) {
      console.error(`❌ Error performing component move:`, error);
      callback();
    }
  }

  forceContentSplit(pageIndex) {
    console.log(`🔧 Force splitting content on page ${pageIndex}`);

    const pageComponent = this.editor.getWrapper().find(`[data-page-index="${pageIndex}"]`)[0];
    if (!pageComponent) return false;

    const contentArea = pageComponent.find(".main-content-area")[0];
    if (!contentArea) return false;

    const components = contentArea.components();
    if (components.length === 0) return false;

    // FIXED: Force split even if it's a single large component
    if (components.length === 1) {
      console.log(`🔨 Force splitting single large component`);
      return this.forceSplitLargeComponent(components.at(0), pageIndex);
    }

    // For multiple components, split roughly in half
    const splitIndex = Math.ceil(components.length / 2);
    const overflowComponents = [];

    for (let i = splitIndex; i < components.length; i++) {
      overflowComponents.push(components.at(i));
    }

    if (overflowComponents.length === 0) return false;

    // Ensure next page exists
    const nextPageIndex = pageIndex + 1;
    if (nextPageIndex >= this.pageSettings.numberOfPages) {
      this.addNewPage();
    }

    // Force move components
    this.performComponentMove(overflowComponents, nextPageIndex, () => {
      console.log(`✅ Force split completed for page ${pageIndex}`);
    });

    return true;
  }

  forceSplitLargeComponent(component, pageIndex) {
    console.log(`🔨 Force splitting large component on page ${pageIndex}`);

    const compEl = component.getEl();
    if (!compEl) return false;

    // Try to find any breakable content
    let breakableElements = compEl.querySelectorAll('p');

    if (breakableElements.length === 0) {
      // If no paragraphs, try divs
      breakableElements = compEl.querySelectorAll('div');
    }

    if (breakableElements.length === 0) {
      console.warn(`⚠️ No breakable elements found in large component`);
      return false;
    }

    console.log(`📝 Force splitting ${breakableElements.length} elements`);

    // FIXED: Split roughly in half regardless of height calculations
    const splitPoint = Math.ceil(breakableElements.length / 2);
    const elementsToMove = Array.from(breakableElements).slice(splitPoint);

    if (elementsToMove.length === 0) {
      console.warn(`📭 No elements to move after force split`);
      return false;
    }

    try {
      // Create content for new component
      const overflowHTML = elementsToMove.map(el => el.outerHTML).join('');

      // Remove elements from original
      elementsToMove.forEach(el => el.remove());

      // Create new component
      const newComponent = this.editor.Components.addComponent({
        tagName: 'div',
        content: `<div id="split-content">${overflowHTML}</div>`,
        style: component.getStyle() // Copy original styles
      });

      // Ensure next page exists
      const nextPageIndex = pageIndex + 1;
      if (nextPageIndex >= this.pageSettings.numberOfPages) {
        this.addNewPage();

        setTimeout(() => {
          this.moveComponentToNextPage(newComponent, nextPageIndex);
        }, 300);
      } else {
        this.moveComponentToNextPage(newComponent, nextPageIndex);
      }

      console.log(`✅ Force split completed - moved ${elementsToMove.length} elements`);
      return true;

    } catch (error) {
      console.error(`❌ Error in force split:`, error);
      return false;
    }
  }

  testPaginationOnPage(pageIndex) {
    console.log(`🧪 Testing pagination on page ${pageIndex}`);

    // Reset any stuck state
    this.paginationInProgress = false;

    // Clear timers
    if (this.debounceTimers.has(pageIndex)) {
      clearTimeout(this.debounceTimers.get(pageIndex));
      this.debounceTimers.delete(pageIndex);
    }

    // Force check
    setTimeout(() => {
      this.handleAutoPagination(pageIndex);
    }, 100);
  }

  unstickPagination() {
    console.log(`🚨 Emergency pagination unstick`);

    // Reset all flags and timers
    this.paginationInProgress = false;
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();

    // Clear and recreate all observers
    this.clearAllObservers();

    setTimeout(() => {
      for (let i = 0; i < this.pageSettings.numberOfPages; i++) {
        this.setupPageObserver(i);
      }
      console.log(`✅ All observers recreated - pagination unstuck`);
    }, 300);
  }

  detectRealOverflow(contentEl, pageIndex) {
    // Force layout recalculation
    contentEl.offsetHeight;

    const contentHeight = contentEl.scrollHeight;
    const maxHeight = contentEl.clientHeight;
    const tolerance = 5; // 5px tolerance

    // Basic height check with tolerance
    const heightOverflow = contentHeight > (maxHeight + tolerance);

    // Check if element can actually scroll
    const canScroll = contentEl.scrollHeight > contentEl.clientHeight;

    // Check for visual positioning overflow
    const hasVisualOverflow = this.checkVisualOverflow(contentEl);

    // Check text content overflow within elements
    const hasTextOverflow = this.checkTextContentOverflow(contentEl);

    console.log(`⚙️ Overflow analysis for page ${pageIndex}:`);
    console.log(`   Content: ${contentHeight}px vs Available: ${maxHeight}px`);
    console.log(`   Height overflow: ${heightOverflow}`);
    console.log(`   Can scroll: ${canScroll}`);
    console.log(`   Visual overflow: ${hasVisualOverflow}`);
    console.log(`   Text overflow: ${hasTextOverflow}`);

    // Return true only if there's actual overflow
    return heightOverflow || canScroll || hasVisualOverflow || hasTextOverflow;
  }


  findOptimalSplitPoint(components, containerEl) {
    const maxHeight = containerEl.clientHeight;
    let totalHeight = 0;
    let splitIndex = -1;

    // Calculate where to split based on actual rendered heights
    for (let i = 0; i < components.length; i++) {
      const component = components.at(i);
      const compEl = component.getEl();

      if (!compEl) continue;

      const compHeight = this.getAccurateComponentHeight(compEl);
      totalHeight += compHeight;

      console.log(`📦 Component ${i}: ${compHeight}px (total: ${totalHeight}px/${maxHeight}px)`);

      if (totalHeight > maxHeight) {
        splitIndex = Math.max(1, i); // Never split at 0
        break;
      }
    }

    // Handle single large component case
    if (splitIndex === -1 && components.length === 1) {
      const singleComponent = components.at(0);
      const singleEl = singleComponent.getEl();

      if (singleEl && this.canSplitComponent(singleEl)) {
        return {
          canSplit: true,
          splitType: 'paragraph',
          component: singleComponent,
          overflowComponents: []
        };
      }
    }

    if (splitIndex <= 0) {
      return { canSplit: false };
    }

    // Collect components to move
    const overflowComponents = [];
    for (let i = splitIndex; i < components.length; i++) {
      overflowComponents.push(components.at(i));
    }

    return {
      canSplit: true,
      splitType: 'components',
      overflowComponents: overflowComponents
    };
  }

  async moveOverflowComponents(components, sourcePageIndex) {
    if (!components || components.length === 0) {
      return { success: false, reason: 'No components to move' };
    }

    try {
      const targetPageIndex = sourcePageIndex + 1;

      // Create new page if needed
      if (targetPageIndex >= this.pageSettings.numberOfPages) {
        console.log(`📄 Creating new page ${targetPageIndex + 1} for overflow`);
        const newPage = this.addNewPage();
        if (!newPage) {
          return { success: false, reason: 'Failed to create new page' };
        }

        // Wait for page creation to complete
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const targetPageComponent = this.editor.getWrapper().find(`[data-page-index="${targetPageIndex}"]`)[0];
      if (!targetPageComponent) {
        return { success: false, reason: 'Target page not found' };
      }

      const targetContentArea = targetPageComponent.find(".main-content-area")[0];
      if (!targetContentArea) {
        return { success: false, reason: 'Target content area not found' };
      }

      console.log(`📦 Moving ${components.length} components to page ${targetPageIndex + 1}`);

      // Temporarily disconnect observers to prevent cascading mutations
      this.temporarilyDisconnectObserver(targetPageIndex);

      let successCount = 0;

      // Move components one by one with error handling
      components.forEach((component, index) => {
        try {
          // FIXED: Validate component before moving
          if (!component || !component.getEl()) {
            console.warn(`⚠️ Invalid component ${index}, skipping`);
            return;
          }

          // FIXED: Simple move without cloning to avoid circular references
          component.remove();
          targetContentArea.append(component);

          successCount++;
          console.log(`✅ Moved component ${index} successfully`);

        } catch (compError) {
          console.error(`❌ Error moving component ${index}:`, compError);
        }
      });

      // Reconnect observer
      setTimeout(() => {
        this.setupPageObserver(targetPageIndex);
      }, 300);

      return {
        success: successCount > 0,
        movedCount: successCount,
        totalCount: components.length
      };

    } catch (error) {
      console.error("❌ Error in moveOverflowComponents:", error);
      return { success: false, reason: error.message };
    }
  }

  temporarilyDisconnectObserver(pageIndex) {
    if (this.pageObservers.has(pageIndex)) {
      this.pageObservers.get(pageIndex).disconnect();
      console.log(`⏸️ Temporarily disconnected observer for page ${pageIndex}`);
    }
  }

  getAccurateComponentHeight(element) {
    if (!element) return 0;

    // Force layout recalculation
    element.offsetHeight;

    // Get multiple height measurements
    const offsetHeight = element.offsetHeight;
    const scrollHeight = element.scrollHeight;
    const boundingHeight = element.getBoundingClientRect().height;

    // Account for margins
    const computedStyle = window.getComputedStyle(element);
    const marginTop = parseFloat(computedStyle.marginTop) || 0;
    const marginBottom = parseFloat(computedStyle.marginBottom) || 0;

    // Return the maximum height plus margins
    const maxHeight = Math.max(offsetHeight, scrollHeight, boundingHeight);
    return maxHeight + marginTop + marginBottom;
  }

  canSplitComponent(element) {
    const paragraphs = element.querySelectorAll('p, div');
    return paragraphs.length > 2; // Can split if has multiple paragraphs
  }

  checkVisualOverflow(containerEl) {
    const containerRect = containerEl.getBoundingClientRect();
    const children = containerEl.children;

    for (let child of children) {
      const childRect = child.getBoundingClientRect();

      // Check if child extends beyond container bounds
      if (childRect.bottom > containerRect.bottom + 3 ||
        childRect.right > containerRect.right + 3) {
        return true;
      }

      // Recursively check nested elements
      if (this.checkVisualOverflow(child)) {
        return true;
      }
    }

    return false;
  }

  checkTextContentOverflow(containerEl) {
    const textElements = containerEl.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6');

    for (let element of textElements) {
      if (element.scrollHeight > element.clientHeight + 2) {
        return true;
      }
    }

    return false;
  }

  calculateDeepElementHeight(element) {
    let maxBottom = 0;
    const elementTop = element.offsetTop;

    // Get all nested elements
    const allNested = element.querySelectorAll('*');

    allNested.forEach(nested => {
      const rect = nested.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      const relativeBottom = rect.bottom - elementRect.top;
      maxBottom = Math.max(maxBottom, relativeBottom);
    });

    return Math.max(element.offsetHeight, element.scrollHeight, maxBottom);
  }

  hasBreakableContent(element) {
    const breakableElements = element.querySelectorAll('p, div, li, h1, h2, h3, h4, h5, h6');
    return breakableElements.length > 3; // Has multiple breakable elements
  }

  splitLongContentComponent(component, pageIndex, maxHeight) {
    console.log(`✂️ Attempting to split long content component on page ${pageIndex}`);

    const compEl = component.getEl();
    if (!compEl) return false;

    // Find all paragraph elements in the nested structure
    const paragraphs = compEl.querySelectorAll('p');
    if (paragraphs.length === 0) return false;

    console.log(`📝 Found ${paragraphs.length} paragraphs to potentially split`);

    // FIXED: More accurate paragraph-level splitting
    let accumulatedHeight = 0;
    let splitAtParagraph = -1;

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];
      const paragraphHeight = Math.max(
        paragraph.offsetHeight,
        paragraph.scrollHeight,
        paragraph.getBoundingClientRect().height
      );

      accumulatedHeight += paragraphHeight;

      console.log(`📄 Paragraph ${i}: ${paragraphHeight}px (accumulated: ${accumulatedHeight}px / ${maxHeight}px)`);

      if (accumulatedHeight > maxHeight && i > 0) {
        splitAtParagraph = i;
        console.log(`✂️ Split point found at paragraph ${i}`);
        break;
      }
    }

    if (splitAtParagraph === -1 || splitAtParagraph === 0) {
      console.log(`⚠️ Cannot find good paragraph split point`);
      return false;
    }

    // Create overflow content from remaining paragraphs
    const overflowParagraphs = Array.from(paragraphs).slice(splitAtParagraph);

    if (overflowParagraphs.length === 0) return false;

    console.log(`📦 Creating new component with ${overflowParagraphs.length} overflow paragraphs`);

    // FIXED: Better content preservation during split
    const overflowHTML = overflowParagraphs.map(p => p.outerHTML).join('');

    // Create new component with same structure as original
    const newComponent = this.editor.Components.addComponent({
      tagName: 'div',
      attributes: { ...component.getAttributes() },
      content: `<div id="lipsum">${overflowHTML}</div>`,
      style: { ...component.getStyle() }
    });

    // Remove overflow paragraphs from original component
    overflowParagraphs.forEach(p => p.remove());

    // Ensure next page exists
    const nextPageIndex = pageIndex + 1;
    if (nextPageIndex >= this.pageSettings.numberOfPages) {
      this.addNewPage();
    }

    // Move new component to next page
    const moveResult = this.moveOverflowComponents([newComponent], pageIndex);

    if (moveResult.success) {
      console.log(`✅ Successfully split content at paragraph level`);
      return true;
    } else {
      console.error(`❌ Failed to move split content:`, moveResult.reason);
      return false;
    }
  }


  // FIXED: Enhanced content preservation methods
  preserveAllContent() {
    if (!this.isInitialized) return;

    try {
      this.pageContents.clear();
      const allPageComponents = this.editor.getWrapper().find(".page-container");

      allPageComponents.forEach((pageComponent, index) => {
        const pageContent = {
          header: null,
          footer: null,
          mainContent: [],
        };

        const headerRegion = pageComponent.find('[data-shared-region="header"]')[0];
        if (headerRegion) {
          const headerComponents = headerRegion.components();
          if (headerComponents.length > 0) {
            pageContent.header = {
              components: headerComponents.map((comp) => ({
                html: comp.toHTML(),
                styles: comp.getStyle(),
                attributes: comp.getAttributes(),
              })),
              attributes: headerRegion.getAttributes(),
            };
          }
        }

        const footerRegion = pageComponent.find('[data-shared-region="footer"]')[0];
        if (footerRegion) {
          const footerComponents = footerRegion.components();
          if (footerComponents.length > 0) {
            pageContent.footer = {
              components: footerComponents.map((comp) => ({
                html: comp.toHTML(),
                styles: comp.getStyle(),
                attributes: comp.getAttributes(),
              })),
              attributes: footerRegion.getAttributes(),
            };
          }
        }

        const mainContentArea = pageComponent.find(".main-content-area")[0];
        if (mainContentArea) {
          const mainComponents = mainContentArea.components();
          if (mainComponents.length > 0) {
            pageContent.mainContent = mainComponents.map((comp) => ({
              html: comp.toHTML(),
              styles: comp.getStyle(),
              attributes: comp.getAttributes(),
            }));
          }
        }

        this.pageContents.set(index, pageContent);
      });

      this.preserveSharedContent();
      console.log("✅ Content preserved for", this.pageContents.size, "pages");
    } catch (error) {
      console.error("❌ Error preserving all content:", error);
    }
  }

  preserveContentForModeSwitch() {
    try {
      console.log("🔄 Preserving GrapesJS components for mode switch...");

      const contentBackup = {
        headers: {},
        footers: {}
      };

      // Get all pages and extract their header/footer COMPONENTS
      const allPages = this.editor.getWrapper().find('.page-container');

      allPages.forEach((page, index) => {
        const pageNumber = index + 1;

        // Find all header regions on this page
        const headerRegions = page.find('[data-shared-region^="header"]');
        headerRegions.forEach(headerRegion => {
          const regionType = headerRegion.getAttributes()['data-shared-region'];
          const headerElement = headerRegion.find('.page-header-element')[0];

          if (headerElement && headerElement.components().length > 0) {
            // Store actual GrapesJS component data, not HTML
            contentBackup.headers[regionType] = {
              components: headerElement.components().map(comp => ({
                html: comp.toHTML(),
                styles: comp.getStyle(),
                attributes: comp.getAttributes(),
                type: comp.get('type'),
                content: comp.get('content')
              })),
              elementStyles: headerElement.getStyle(),
              elementAttributes: headerElement.getAttributes()
            };
            console.log(`📦 Preserved header components from ${regionType} on page ${pageNumber}`);
          }
        });

        // Find all footer regions on this page  
        const footerRegions = page.find('[data-shared-region^="footer"]');
        footerRegions.forEach(footerRegion => {
          const regionType = footerRegion.getAttributes()['data-shared-region'];
          const footerElement = footerRegion.find('.page-footer-element')[0];

          if (footerElement && footerElement.components().length > 0) {
            // Store actual GrapesJS component data, not HTML
            contentBackup.footers[regionType] = {
              components: footerElement.components().map(comp => ({
                html: comp.toHTML(),
                styles: comp.getStyle(),
                attributes: comp.getAttributes(),
                type: comp.get('type'),
                content: comp.get('content')
              })),
              elementStyles: footerElement.getStyle(),
              elementAttributes: footerElement.getAttributes()
            };
            console.log(`📦 Preserved footer components from ${regionType} on page ${pageNumber}`);
          }
        });
      });

      // Store the backup for later restoration
      this._modeSwitchContentBackup = contentBackup;

      console.log("✅ GrapesJS component backup created:", contentBackup);

    } catch (error) {
      console.error("❌ Error preserving components for mode switch:", error);
    }
  }

  restoreContentAfterModeSwitch() {
    try {
      if (!this._modeSwitchContentBackup) {
        console.log("ℹ️ No component backup found for restoration");
        return;
      }

      console.log("🔄 Restoring GrapesJS components after mode switch...");

      const backup = this._modeSwitchContentBackup;

      // Get all pages after recreation
      const allPages = this.editor.getWrapper().find('.page-container');

      allPages.forEach((page, index) => {
        const pageNumber = index + 1;

        // RESTORE HEADER COMPONENTS
        const headerRegions = page.find('[data-shared-region^="header"]');
        headerRegions.forEach(headerRegion => {
          const newRegionType = headerRegion.getAttributes()['data-shared-region'];
          const headerElement = headerRegion.find('.page-header-element')[0];

          if (!headerElement) return;

          let contentToRestore = null;

          // Map old content to new regions based on mode transition
          if (newRegionType === 'header') {
            // For "all" regions, prefer any existing content
            contentToRestore = backup.headers['header'] ||
              backup.headers['header-even'] ||
              backup.headers['header-odd'];
          } else if (newRegionType === 'header-even') {
            // For even regions, prefer even content, fallback to all
            contentToRestore = backup.headers['header-even'] ||
              backup.headers['header'];
          } else if (newRegionType === 'header-odd') {
            // For odd regions, prefer odd content, fallback to all
            contentToRestore = backup.headers['header-odd'] ||
              backup.headers['header'];
          }

          // Restore the GrapesJS components if found
          if (contentToRestore && contentToRestore.components) {
            headerElement.components().reset();

            contentToRestore.components.forEach(compData => {
              try {
                const newComp = headerElement.append(compData.html)[0];
                if (newComp) {
                  newComp.setStyle(compData.styles || {});
                  newComp.addAttributes(compData.attributes || {});
                  if (compData.content) {
                    newComp.set('content', compData.content);
                  }
                }
              } catch (error) {
                console.warn("Warning: Could not restore component:", error);
              }
            });

            // Restore header element styles and attributes
            if (contentToRestore.elementStyles) {
              headerElement.setStyle(contentToRestore.elementStyles);
            }
            if (contentToRestore.elementAttributes) {
              headerElement.addAttributes(contentToRestore.elementAttributes);
            }

            console.log(`✅ Restored header components to page ${pageNumber} (${newRegionType})`);
          }
        });

        // RESTORE FOOTER COMPONENTS (same logic)
        const footerRegions = page.find('[data-shared-region^="footer"]');
        footerRegions.forEach(footerRegion => {
          const newRegionType = footerRegion.getAttributes()['data-shared-region'];
          const footerElement = footerRegion.find('.page-footer-element')[0];

          if (!footerElement) return;

          let contentToRestore = null;

          if (newRegionType === 'footer') {
            contentToRestore = backup.footers['footer'] ||
              backup.footers['footer-even'] ||
              backup.footers['footer-odd'];
          } else if (newRegionType === 'footer-even') {
            contentToRestore = backup.footers['footer-even'] ||
              backup.footers['footer'];
          } else if (newRegionType === 'footer-odd') {
            contentToRestore = backup.footers['footer-odd'] ||
              backup.footers['footer'];
          }

          // Restore the GrapesJS components if found
          if (contentToRestore && contentToRestore.components) {
            footerElement.components().reset();

            contentToRestore.components.forEach(compData => {
              try {
                const newComp = footerElement.append(compData.html)[0];
                if (newComp) {
                  newComp.setStyle(compData.styles || {});
                  newComp.addAttributes(compData.attributes || {});
                  if (compData.content) {
                    newComp.set('content', compData.content);
                  }
                }
              } catch (error) {
                console.warn("Warning: Could not restore component:", error);
              }
            });

            // Restore footer element styles and attributes
            if (contentToRestore.elementStyles) {
              footerElement.setStyle(contentToRestore.elementStyles);
            }
            if (contentToRestore.elementAttributes) {
              footerElement.addAttributes(contentToRestore.elementAttributes);
            }

            console.log(`✅ Restored footer components to page ${pageNumber} (${newRegionType})`);
          }
        });
      });

      // Clean up the backup
      delete this._modeSwitchContentBackup;

      console.log("✅ GrapesJS component restoration complete");

    } catch (error) {
      console.error("❌ Error restoring components after mode switch:", error);
    }
  }


  restoreAllContent() {
    if (!this.isInitialized || this.pageContents.size === 0) return;
    try {
      const allPages = this.editor.getWrapper().find(".page-container");
      console.log("Restoring content for", allPages.length, "pages");

      allPages.forEach((pageComponent, index) => {
        const preserved = this.pageContents.get(index);
        if (!preserved) return;

        // Get current page settings to check for new text
        const currentPageSettings = this.pageSettings.pages[index];
        const hasNewHeaderText = currentPageSettings?.header?.enabled && currentPageSettings?.header?.text;
        const hasNewFooterText = currentPageSettings?.footer?.enabled && currentPageSettings?.footer?.text;

        // 🔁 Restore Main Content
        const mainContentArea = pageComponent.find(".main-content-area")[0];
        if (mainContentArea && preserved.mainContent?.length > 0) {
          mainContentArea.components().reset();
          preserved.mainContent.forEach((compData) => {
            const newComp = mainContentArea.append(compData.html)[0];
            if (newComp) {
              newComp.setStyle(compData.styles || {});
              newComp.addAttributes(compData.attributes || {});
            }
          });
        }

        // 🔁 Restore Header
        const headerRegion = pageComponent.find('[data-shared-region="header"]')[0];
        if (headerRegion) {
          const isHeaderEnabled = currentPageSettings?.header?.enabled;

          if (isHeaderEnabled) {
            // Check if user changed the header text input OR if there's new text and no preserved content
            const shouldUseInputText = this._headerTextChanged ||
              (hasNewHeaderText && (!preserved.header?.components?.length));

            if (shouldUseInputText && hasNewHeaderText) {
              console.log(`🔄 Using input field header text for page ${index + 1}: "${currentPageSettings.header.text}"`);
              headerRegion.components().reset();

              const textComp = headerRegion.append(`
              <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #333;">
                ${currentPageSettings.header.text}
              </div>
            `)[0];

              if (textComp) {
                textComp.set({
                  droppable: false,
                  editable: true,
                  selectable: true,
                  draggable: false,
                  copyable: false,
                  removable: true,
                  "custom-name": "Header Text"
                });
              }
            } else if (preserved.header?.components?.length > 0) {
              // Restore preserved content
              console.log(`Restoring preserved header content for page ${index + 1}`);
              headerRegion.components().reset();
              headerRegion.addAttributes(preserved.header.attributes || {});
              preserved.header.components.forEach((compData) => {
                const newComp = headerRegion.append(compData.html)[0];
                if (newComp) {
                  newComp.setStyle(compData.styles || {});
                  newComp.addAttributes(compData.attributes || {});
                }
              });
            } else {
              // Header enabled but no content
              console.log(`Header enabled but no content for page ${index + 1} - leaving empty`);
              headerRegion.components().reset();
            }
          } else {
            // Header disabled, clear content
            console.log(`Header disabled for page ${index + 1} - clearing content`);
            headerRegion.components().reset();
          }
        }

        // 🔁 Restore Footer (same logic as header)
        const footerRegion = pageComponent.find('[data-shared-region="footer"]')[0];
        if (footerRegion) {
          const isFooterEnabled = currentPageSettings?.footer?.enabled;

          if (isFooterEnabled) {
            // Check if user changed the footer text input OR if there's new text and no preserved content
            const shouldUseInputText = this._footerTextChanged ||
              (hasNewFooterText && (!preserved.footer?.components?.length));

            if (shouldUseInputText && hasNewFooterText) {
              console.log(`🔄 Using input field footer text for page ${index + 1}: "${currentPageSettings.footer.text}"`);
              footerRegion.components().reset();

              const textComp = footerRegion.append(`
              <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #333;">
                ${currentPageSettings.footer.text}
              </div>
            `)[0];

              if (textComp) {
                textComp.set({
                  droppable: false,
                  editable: true,
                  selectable: true,
                  draggable: false,
                  copyable: false,
                  removable: true,
                  "custom-name": "Footer Text"
                });
              }
            } else if (preserved.footer?.components?.length > 0) {
              // Restore preserved content
              console.log(`Restoring preserved footer content for page ${index + 1}`);
              footerRegion.components().reset();
              footerRegion.addAttributes(preserved.footer.attributes || {});
              preserved.footer.components.forEach((compData) => {
                const newComp = footerRegion.append(compData.html)[0];
                if (newComp) {
                  newComp.setStyle(compData.styles || {});
                  newComp.addAttributes(compData.attributes || {});
                }
              });
            } else {
              // Footer enabled but no content
              console.log(`Footer enabled but no content for page ${index + 1} - leaving empty`);
              footerRegion.components().reset();
            }
          } else {
            // Footer disabled, clear content
            console.log(`Footer disabled for page ${index + 1} - clearing content`);
            footerRegion.components().reset();
          }
        }
      });

      // Track what was applied this time
      const currentPageSettings = this.pageSettings.pages[0];
      this._lastAppliedHeaderText = currentPageSettings?.header?.text || "";
      this._lastAppliedFooterText = currentPageSettings?.footer?.text || "";

      // Reset change flags after restoration
      this._headerTextChanged = false;
      this._footerTextChanged = false;

      console.log("✅ Finished restoring content");
    } catch (error) {
      console.error("❌ Error restoring all content:", error);
    }
  }

  hasRichHeaderFooterContent(components) {
    if (!components || components.length === 0) return false;

    // Check if there are multiple components or non-basic components
    if (components.length > 1) return true;

    // Check if the single component is something other than basic text
    const component = components[0];
    if (!component.html) return false;

    // Check for specific component types that indicate rich content
    const html = component.html.toLowerCase();
    const hasTextArea = html.includes('contenteditable') || html.includes('textarea');
    const hasImage = html.includes('<img') || html.includes('image');
    const hasCustomComponent = html.includes('data-gjs-type') && !html.includes('text');
    const hasCustomClasses = component.attributes && Object.keys(component.attributes).length > 1;
    const hasComplexStyles = component.styles && Object.keys(component.styles).length > 3;

    // If it's a dragged component (not just the basic text we add), preserve it
    return hasTextArea || hasImage || hasCustomComponent || hasCustomClasses || hasComplexStyles;
  }

  // Store shared content to preserve during operations
  preserveSharedContent() {
    if (!this.isInitialized) return;

    try {
      const firstPageComponent = this.editor.getWrapper().find(".page-container")[0];
      if (!firstPageComponent) return;

      this.sharedContent = {
        header: null,
        footer: null,
      };

      // Preserve header content
      const headerRegion = firstPageComponent.find('[data-shared-region="header"]')[0];
      if (headerRegion) {
        const headerComponents = headerRegion.components();
        if (headerComponents.length > 0) {
          this.sharedContent.header = {
            components: headerComponents.map((comp) => ({
              html: comp.toHTML(),
              styles: comp.getStyle(),
              attributes: comp.getAttributes(),
              type: comp.get("type"),
            })),
            styles: headerRegion.getStyle(),
            attributes: headerRegion.getAttributes(),
          };
        }
      }

      // Preserve footer content
      const footerRegion = firstPageComponent.find('[data-shared-region="footer"]')[0];
      if (footerRegion) {
        const footerComponents = footerRegion.components();
        if (footerComponents.length > 0) {
          this.sharedContent.footer = {
            components: footerComponents.map((comp) => ({
              html: comp.toHTML(),
              styles: comp.getStyle(),
              attributes: comp.getAttributes(),
              type: comp.get("type"),
            })),
            styles: footerRegion.getStyle(),
            attributes: footerRegion.getAttributes(),
          };
        }
      }

      console.log("✅ Shared content preserved.");
    } catch (error) {
      console.error("❌ Error preserving shared content:", error);
    }
  }

  // Restore shared content after operations
  restoreSharedContent() {
    if (!this.isInitialized) return

    try {
      const allPageComponents = this.editor.getWrapper().find(".page-container")

      allPageComponents.forEach((pageComponent) => {
        // Restore header content
        if (this.sharedContent.header && this.pageSettings.headerFooter.headerEnabled) {
          const headerRegion = pageComponent.find('[data-shared-region="header"]')[0]
          if (headerRegion && this.sharedContent.header.components.length > 0) {
            // Clear existing content
            headerRegion.components().reset()

            // Restore components
            this.sharedContent.header.components.forEach((compData) => {
              try {
                const newComponent = headerRegion.append(compData.html)[0]
                if (newComponent) {
                  if (compData.styles) {
                    newComponent.setStyle(compData.styles)
                  }
                  if (compData.attributes) {
                    Object.keys(compData.attributes).forEach((key) => {
                      newComponent.addAttributes({ [key]: compData.attributes[key] })
                    })
                  }
                }
              } catch (error) {
                console.error("Error restoring shared header component:", error)
              }
            })
          }
        }

        // Restore footer content
        if (this.sharedContent.footer && this.pageSettings.headerFooter.footerEnabled) {
          const footerRegion = pageComponent.find('[data-shared-region="footer"]')[0]
          if (footerRegion && this.sharedContent.footer.components.length > 0) {
            // Clear existing content
            footerRegion.components().reset()

            // Restore components
            this.sharedContent.footer.components.forEach((compData) => {
              try {
                const newComponent = footerRegion.append(compData.html)[0]
                if (newComponent) {
                  if (compData.styles) {
                    newComponent.setStyle(compData.styles)
                  }
                  if (compData.attributes) {
                    Object.keys(compData.attributes).forEach((key) => {
                      newComponent.addAttributes({ [key]: compData.attributes[key] })
                    })
                  }
                }
              } catch (error) {
                console.error("Error restoring shared footer component:", error)
              }
            })
          }
        }
      })
    } catch (error) {
      console.error("Error restoring shared content:", error)
    }
  }

  initSharedRegionSync() {
    const editor = this.editor
    if (!editor) return

    // Track sync operations to prevent infinite loops
    this._syncInProgress = false

    // Listen for component additions
    // editor.on("component:add", (model) => {
    //   if (this._syncInProgress) return

    //   const sharedRegion = model.closest("[data-shared-region]")
    //   if (sharedRegion) {
    //     const regionType = sharedRegion.getAttributes()["data-shared-region"]
    //     setTimeout(() => {
    //       this.syncSharedRegion(regionType, sharedRegion)
    //     }, 50)
    //   }
    // })

    // Listen for component updates (style, content, attributes)
    editor.on("component:update", (model) => {
      if (this._syncInProgress) return

      const sharedRegion = model.closest("[data-shared-region]")
      if (sharedRegion) {
        const regionType = sharedRegion.getAttributes()["data-shared-region"]
        setTimeout(() => {
          this.syncSharedRegion(regionType, sharedRegion)
        }, 50)
      }
    })

    // Listen for component removals
    // editor.on("component:remove", (model) => {
    //   if (this._syncInProgress) return

    //   const sharedRegion = model.closest("[data-shared-region]")
    //   if (sharedRegion) {
    //     const regionType = sharedRegion.getAttributes()["data-shared-region"]
    //     setTimeout(() => {
    //       this.syncSharedRegion(regionType, sharedRegion)
    //     }, 50)
    //   }
    // })

    // Listen for style changes
    editor.on("component:styleUpdate", (model) => {
      if (this._syncInProgress) return

      const sharedRegion = model.closest("[data-shared-region]")
      if (sharedRegion) {
        const regionType = sharedRegion.getAttributes()["data-shared-region"]
        setTimeout(() => {
          this.syncSharedRegion(regionType, sharedRegion)
        }, 50)
      }
    })

    // Listen for drag and drop operations
    editor.on("component:drag:end", (model) => {
      if (this._syncInProgress) return

      const el = model.view?.el
      const sharedRegion = el?.closest("[data-shared-region]")

      if (sharedRegion) {
        const regionType = sharedRegion.getAttributes()["data-shared-region"]
        setTimeout(() => {
          this.syncSharedRegion(regionType, sharedRegion)
        }, 100)
      }
    })
  }

  syncSharedRegion(regionType, sourceRegion) {
    // 🚫 Prevent syncing when text was explicitly changed via input field
    if ((regionType.includes("header") && this._headerTextChanged) ||
      (regionType.includes("footer") && this._footerTextChanged)) {
      console.log(`🚫 GLOBAL BLOCK: Skipping ${regionType} sync - user changed text via input field`);
      return;
    }

    if (this._syncInProgress) return;
    this._syncInProgress = true;

    try {
      // Find all regions of the SAME type (e.g., all "header-even" regions)
      const allRegions = this.editor.getWrapper().find(`[data-shared-region="${regionType}"]`);
      if (allRegions.length <= 1) {
        this._syncInProgress = false;
        return;
      }

      const sourceComponents = sourceRegion.components();
      const sourceAttributes = sourceRegion.getAttributes();

      console.log(`✅ WORD-STYLE SYNC: Syncing ${regionType} to ${allRegions.length} matching pages`);

      // Sync to ALL regions of the same type
      allRegions.forEach((targetRegion) => {
        if (targetRegion === sourceRegion) return;

        // 🔄 Reset and copy components to all matching regions
        targetRegion.components().reset();
        sourceComponents.forEach((comp) => {
          const clonedComp = comp.clone();
          targetRegion.append(clonedComp);
        });

        // ✅ Copy attributes (excluding data-shared-region)
        const filteredAttributes = { ...sourceAttributes };
        delete filteredAttributes["data-shared-region"];
        Object.keys(filteredAttributes).forEach((key) => {
          targetRegion.addAttributes({ [key]: filteredAttributes[key] });
        });
      });

      console.log(`✅ Synced ${regionType} across ${allRegions.length} pages of the same type`);
    } catch (error) {
      console.error(`❌ Error syncing shared region ${regionType}:`, error);
    } finally {
      this._syncInProgress = false;
    }
  }

  resetTextChangeFlags() {
    this._headerTextChanged = false;
    this._footerTextChanged = false;
    console.log("🔄 Reset header/footer text change flags");
  }

  setupSectionSelection() {
    this.editor.on("component:selected", (model) => {
      this.clearSectionBorders()

      const sharedRegion = model.closest("[data-shared-region]")
      if (sharedRegion) {
        const regionType = sharedRegion.getAttributes()["data-shared-region"]
        this.highlightSection(regionType)
        this.selectedSection = regionType
      } else if (model.getEl()?.closest(".main-content-area")) {
        this.highlightSection("content")
        this.selectedSection = "content"
      }
    })

    this.editor.on("component:deselected", () => {
      this.clearSectionBorders()
      this.selectedSection = null
    })
  }

  highlightSection(sectionType) {
    const canvasBody = this.editor.Canvas.getBody()
    const pages = canvasBody.querySelectorAll(".page-container")

    pages.forEach((page) => {
      let selector = ""
      switch (sectionType) {
        case "header":
          selector = '[data-shared-region="header"]'
          break
        case "footer":
          selector = '[data-shared-region="footer"]'
          break
        case "content":
          selector = ".main-content-area"
          break
      }

      if (selector) {
        const section = page.querySelector(selector)
        if (section) {
          section.style.border = "2px solid #007bff"
          section.style.boxShadow = "0 0 10px rgba(0, 123, 255, 0.3)"
        }
      }
    })
  }

  clearSectionBorders() {
    const canvasBody = this.editor.Canvas.getBody()
    const sections = canvasBody.querySelectorAll("[data-shared-region], .main-content-area")

    sections.forEach((section) => {
      section.style.border = ""
      section.style.boxShadow = ""
    })
  }

  setupCanvasObserver() {
    // Observer to watch for canvas changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList" && this.isInitialized) {
          setTimeout(() => {
            this.updateAllPageVisuals()
            this.enforceContentBoundaries()
            if (this.sectionsSettings.enabled) {
              this.updateSectionsDisplay()
            }
          }, 100)
        }
      })
    })

    // Start observing when editor is ready
    this.editor.on("load", () => {
      const canvas = this.editor.Canvas.getBody()
      if (canvas) {
        observer.observe(canvas, {
          childList: true,
          subtree: true,
        })
      }
    })
  }

  setupContentBoundaryEnforcement() {
    const pages = document.querySelectorAll('.page-wrapper');

    pages.forEach((page, index) => {
      const contentArea = page.querySelector('.content-area');
      if (!contentArea) return;

      // Calculate available height accounting for headers/footers
      const availableHeight = this.calculateAvailableContentHeight(page);
      contentArea.style.maxHeight = `${availableHeight}mm`;
      contentArea.style.overflow = 'hidden';

      // Monitor content changes
      const observer = new MutationObserver(() => {
        this.checkContentOverflow(contentArea, index);
      });

      observer.observe(contentArea, {
        childList: true,
        subtree: true,
        characterData: true
      });
    });
  }

  calculateAvailableContentHeight(page) {
    const { headerHeight, footerHeight } = this.pageSettings.headerFooter;
    const { top, bottom } = this.pageSettings.margins;

    return this.pageSettings.height - headerHeight - footerHeight - top - bottom;
  }

  handleJSONPaste(jsonData) {
    // Format JSON with proper line breaks
    const formattedJSON = JSON.stringify(jsonData, null, 2);
    const lines = formattedJSON.split('\n');

    // Insert content with proper pagination
    this.insertContentWithPagination(lines);
  }

  checkContentOverflow(contentArea, pageIndex) {
    const maxHeight = this.calculateAvailableContentHeight();
    const actualHeight = contentArea.scrollHeight;

    if (actualHeight > maxHeight) {
      // Content overflows - need to split
      this.handleContentOverflow(contentArea, pageIndex);
    }
  }

  handleContentOverflow(contentArea, pageIndex) {
    const overflowContent = this.extractOverflowContent(contentArea);

    // Create next page if it doesn't exist
    this.ensurePageExists(pageIndex + 1);

    // Move overflow content to next page
    const nextPageContent = document.querySelector(`#page-${pageIndex + 1} .content-area`);
    if (nextPageContent) {
      nextPageContent.insertAdjacentHTML('afterbegin', overflowContent);
    }
  }

  insertContentWithPagination(lines) {
    let currentPage = 0;
    let currentHeight = 0;
    const lineHeight = 20; // Adjust based on your font size
    const maxHeight = this.calculateAvailableContentHeight();

    lines.forEach(line => {
      if (currentHeight + lineHeight > maxHeight) {
        // Create new page or move to next page
        currentPage++;
        currentHeight = 0;
        this.ensurePageExists(currentPage);
      }

      this.insertLineToPage(line, currentPage);
      currentHeight += lineHeight;
    });
  }



  enforceContentBoundaries() {
    if (!this.isInitialized) return

    const canvasBody = this.editor.Canvas.getBody()
    const pageElements = canvasBody.querySelectorAll(".page-container")

    // Check for content outside all pages
    const allComponents = this.editor.getWrapper().components()

    allComponents.forEach((component) => {
      const componentEl = component.getEl()
      if (!componentEl || componentEl.classList.contains("page-container")) return

      let isInsidePage = false
      pageElements.forEach((pageElement) => {
        const pageRect = pageElement.getBoundingClientRect()
        const componentRect = componentEl.getBoundingClientRect()

        if (
          componentRect.left >= pageRect.left &&
          componentRect.right <= pageRect.right &&
          componentRect.top >= pageRect.top &&
          componentRect.bottom <= pageRect.bottom
        ) {
          isInsidePage = true
        }
      })

      if (!isInsidePage) {
        // Show error and remove component
        this.showBoundaryError()
        component.remove()
        return
      }
    })

    pageElements.forEach((pageElement, pageIndex) => {
      const pageContent = pageElement.querySelector(".main-content-area")
      if (pageContent) {
        // Get all child elements in the main content area
        const children = pageContent.querySelectorAll("*")
        children.forEach((child) => {
          const rect = child.getBoundingClientRect()
          const pageRect = pageContent.getBoundingClientRect()

          // Check if element is outside page boundaries
          if (
            rect.right > pageRect.right ||
            rect.bottom > pageRect.bottom ||
            rect.left < pageRect.left ||
            rect.top < pageRect.top
          ) {
            // Show error and adjust element position to stay within boundaries
            this.showBoundaryError()

            const style = window.getComputedStyle(child)
            const left = Number.parseInt(style.left) || 0
            const top = Number.parseInt(style.top) || 0

            if (rect.right > pageRect.right) {
              child.style.left = Math.max(0, left - (rect.right - pageRect.right)) + "px"
            }
            if (rect.bottom > pageRect.bottom) {
              child.style.top = Math.max(0, top - (rect.bottom - pageRect.bottom)) + "px"
            }
            if (rect.left < pageRect.left) {
              child.style.left = Math.max(0, left + (pageRect.left - rect.left)) + "px"
            }
            if (rect.top < pageRect.top) {
              child.style.top = Math.max(0, top + (pageRect.top - rect.top)) + "px"
            }
          }
        })
      }
    })
  }

  showBoundaryError() {
    // Show error message for boundary violation - COMMENTED OUT
    /*
    const errorMsg = document.createElement("div")
    errorMsg.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      color: white;
      padding: 12px 20px;
      border-radius: 6px;
      z-index: 10000;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
      animation: slideIn 0.3s ease-out;
    `
    errorMsg.innerHTML = ""

    // Add animation
    const style = document.createElement("style")
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `
    document.head.appendChild(style)

    document.body.appendChild(errorMsg)

    setTimeout(() => {
      errorMsg.remove()
      style.remove()
    }, 3000)
    */
  }

  setupDragBoundaries() {
    // Enhanced drag boundary setup
    const canvasBody = this.editor.Canvas.getBody()
    const pageElements = canvasBody.querySelectorAll(".page-container .main-content-area")

    // Set droppable areas only to main content areas
    pageElements.forEach((pageContent) => {
      pageContent.style.position = "relative"
      pageContent.setAttribute("data-droppable", "true")
    })
  }

  injectPageSetupStyles() {
    const styles = `
      <style id="enhanced-page-setup-styles">
        .page-setup-modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          z-index: 10001;
          display: none;
          align-items: center;
          justify-content: center;
        }

        .watermark-position-option {
  /* Same styles as .position-option */
  cursor: pointer;
  padding: 8px;
  border: 1px solid #ccc;
  text-align: center;
  border-radius: 4px;
}

.watermark-position-option.selected {
  background-color: #007cba;
  color: white;
}
        
        .page-setup-content {
          background: white;
          border-radius: 12px;
          padding: 30px;
          max-width: 800px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          color: #000 !important;
        }
        
        .page-setup-content * {
          color: #000 !important;
        }
        
        .page-setup-header {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .page-setup-header h2 {
          color: #333 !important;
          margin: 0 0 10px 0;
          font-size: 24px;
          font-weight: bold;
        }
        
        .page-setup-section {
          margin-bottom: 20px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }
        
        .page-setup-section h3 {
          margin: 0 0 15px 0;
          color: #333 !important;
          font-size: 16px;
          font-weight: 600;
        }
        
        .page-setup-row {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
          gap: 15px;
        }
        
        .page-setup-label {
          min-width: 120px;
          font-weight: 500;
          color: #555 !important;
        }
        
        .page-setup-control {
          flex: 1;
          padding: 8px 10px;
          border: 2px solid #e9ecef;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
          color: #000 !important;
        }
        
        .page-setup-control:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
        }
        
        .page-setup-custom-size {
          display: none;
          margin-top: 15px;
          padding: 15px;
          background: white;
          border-radius: 6px;
          border: 1px solid #dee2e6;
        }
        
        .page-setup-custom-size.active {
          display: block;
        }
        
        .page-setup-custom-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 10px;
        }

        .margins-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr 1fr;
          gap: 10px;
          margin-top: 10px;
        }

        .watermark-controls {
          display: none;
          margin-top: 15px;
          padding: 15px;
          background: white;
          border-radius: 6px;
          border: 1px solid #dee2e6;
        }

        .watermark-controls.active {
          display: block;
        }

        .watermark-type-controls {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
          margin: 10px 0;
        }

        .watermark-type-btn {
          padding: 8px 12px;
          border: 2px solid #e9ecef;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          text-align: center;
          transition: all 0.2s;
        }

        .watermark-type-btn.active {
          border-color: #007bff;
          background: #007bff;
          color: white !important;
        }
        
        .page-setup-actions {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin-top: 30px;
        }
        
        .page-setup-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 100px;
        }
        
        .page-setup-btn-primary {
          background: #007bff;
          color: white !important;
        }
        
        .page-setup-btn-primary:hover {
          background: #0056b3;
        }
        
        .page-setup-btn-secondary {
          background: #6c757d;
          color: white !important;
        }
        
        .page-setup-btn-secondary:hover {
          background: #545b62;
        }
        
        .page-canvas-container {
          position: relative;
          background: #f0f0f0;
          border: 2px solid #ddd;
          margin: 20px;
          overflow: visible;
        }
        
        .page-canvas {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          margin: 20px auto;
          position: relative;
          border: 2px solid transparent !important;
          overflow: hidden !important;
          transition: border-color 0.2s ease;
        }
        
        .page-canvas:hover {
          border-color: #007bff !important;
        }
        
        .page-canvas.selected,
        .page-canvas:focus {
          border-color: #007bff !important;
          box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3) !important;
        }
        
        .page-indicator {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(0, 123, 255, 0.9);
          color: white;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          z-index: 1000;
          pointer-events: none;
        }
        
        .page-delete-btn {
          background: #dc3545;
          color: white;
          border: none;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          margin-left: 10px;
        }
        
        .page-delete-btn:hover {
          background: #c82333;
        }

        .page-watermark {
          position: absolute !important;
          pointer-events: none !important;
          user-select: none !important;
          z-index: 1 !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        .page-watermark-text {
          font-family: Arial, sans-serif !important;
          font-weight: bold !important;
          white-space: nowrap !important;
        }

        .page-watermark-image {
          max-width: 100% !important;
          max-height: 100% !important;
          object-fit: contain !important;
        }

        /* FIXED: Enhanced Header/Footer Styles with proper display */
        .header-wrapper {
          position: relative !important;
          width: 100% !important;
          box-sizing: border-box !important;
          flex-shrink: 0 !important;
          display: block !important;
        }

        .footer-wrapper {
          position: relative !important;
          width: 100% !important;
          box-sizing: border-box !important;
          flex-shrink: 0 !important;
          display: block !important;
        }

        .header-wrapper::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 1px;
          background: #007bff;
          z-index: 1000;
          pointer-events: none;
        }

        .footer-wrapper::before {
          content: '';
          position: absolute;
          top: -1px;
          left: 0;
          right: 0;
          height: 1px;
          background: #007bff;
          z-index: 1000;
          pointer-events: none;
        }

        .page-header-element {
          position: relative !important;
          width: 100% !important;
          padding: 10px !important;
          text-align: center !important;
          font-size: 12px !important;
          color: #333 !important;
          z-index: 1000 !important;
          min-height: 48px !important;
          box-sizing: border-box !important;
          display: flex !important;
          align-items: center !important;
          font-family: Arial, sans-serif !important;
          flex-shrink: 0 !important;
          border: 2px dashed transparent !important;
          transition: border-color 0.2s ease !important;
        }

        .page-header-element:hover {
          border-color: #28a745 !important;
          background: rgba(40, 167, 69, 0.05) !important;
        }
        
        .page-footer-element {
          position: relative !important;
          width: 100% !important;
          padding: 10px !important;
          text-align: center !important;
          font-size: 12px !important;
          color: #333 !important;
          z-index: 1000 !important;
          min-height: 48px !important;
          box-sizing: border-box !important;
          display: flex !important;
          align-items: center !important;
          font-family: Arial, sans-serif !important;
          flex-shrink: 0 !important;
          border: 2px dashed transparent !important;
          transition: border-color 0.2s ease !important;
        }

        .page-footer-element:hover {
          border-color: #dc3545 !important;
          background: rgba(220, 53, 69, 0.05) !important;
        }
        
        /* FIXED: Page number positioning for print */
        .page-number-element {
          position: absolute !important;
          background: rgba(255, 255, 255, 0.9) !important;
          padding: 4px 8px !important;
          border-radius: 3px !important;
          font-size: 11px !important;
          color: #333 !important;
          z-index: 2000 !important;
          border: 1px solid #dee2e6 !important;
          pointer-events: none !important;
          user-select: none !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          min-width: 20px !important;
          min-height: 20px !important;
          font-family: Arial, sans-serif !important;
        }

        /* Content Area Styles */
        .content-wrapper {
          position: relative !important;
          width: 100% !important;
          box-sizing: border-box !important;
          flex: 1 !important;
          display: flex !important;
          flex-direction: column !important;
        }

        .main-content-area {
          position: relative !important;
          width: 100% !important;
          box-sizing: border-box !important;
          overflow: hidden !important;
          background: transparent !important;
          flex: 1 !important;
          border: 2px dashed transparent !important;
          transition: border-color 0.2s ease !important;
        }

        .main-content-area:hover {
          border-color: #007bff !important;
          background: rgba(0, 123, 255, 0.02) !important;
        }

        /* Position Grid */
        .position-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-top: 10px;
        }
        
        .position-option {
          padding: 8px;
          border: 2px solid #e9ecef;
          border-radius: 4px;
          text-align: center;
          cursor: pointer;
          font-size: 11px;
          transition: all 0.2s;
          color: #000 !important;
        }
        
        .position-option:hover {
          border-color: #007bff;
          background: #f8f9ff;
        }
        
        .position-option.selected {
          border-color: #007bff;
          background: #007bff;
          color: white !important;
        }

        .size-controls {
          display: block;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-top: 10px;
        }

        /* Enhanced Page Break Styles */
        .page-break-element {
          width: 100% !important;
          height: 20px !important;
          background: linear-gradient(90deg, #ff6b6b 0%, #ff8e8e 50%, #ff6b6b 100%) !important;
          border: 2px dashed #ff4757 !important;
          border-radius: 4px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          color: white !important;
          font-size: 12px !important;
          font-weight: bold !important;
          margin: 10px 0 !important;
          position: relative !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          user-select: none !important;
          box-sizing: border-box !important;
        }

        .page-break-element:hover {
          background: linear-gradient(90deg, #ff5252 0%, #ff7979 50%, #ff5252 100%) !important;
          transform: scale(1.02) !important;
          box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3) !important;
        }

        .page-break-element::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 1px;
          background: rgba(255, 255, 255, 0.5);
          z-index: 1;
        }

        /* Content boundary enforcement */
        .page-content {
          overflow: hidden !important;
          position: relative !important;
        }

        .main-content-area > * {
          max-width: 100% !important;
          word-wrap: break-word !important;
          box-sizing: border-box !important;
        }
        
        @media (max-width: 768px) {
          .page-setup-content {
            padding: 20px;
            margin: 10px;
          }
          
          .page-setup-row {
            flex-direction: column;
            align-items: stretch;
            gap: 8px;
          }
          
          .page-setup-label {
            min-width: auto;
          }
        }
        
        /* FIXED: Enhanced Print styles for exact positioning and proper page breaks */
        @media print {
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }

          .page-container {
            page-break-after: always !important;
            page-break-inside: avoid !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            height: 100vh !important;
            display: flex !important;
            flex-direction: column !important;
            position: relative !important;
            overflow: hidden !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .page-container:last-child {
            page-break-after: avoid !important;
          }
          
          .page-content {
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            position: relative !important;
            overflow: hidden !important;
            display: flex !important;
            flex-direction: column !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .main-content-area {
            width: 100% !important;
            height: auto !important;
            overflow: visible !important;
            position: relative !important;
            flex: 1 !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Hide editor-only elements */
          .page-indicator,
          .header-wrapper::after,
          .footer-wrapper::before {
            display: none !important;
          }

          /* FIXED: Page breaks should trigger actual page breaks in print */
          .page-break-element {
            display: block !important;
            page-break-before: always !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            background: none !important;
            visibility: hidden !important;
          }

          .page-watermark {
            display: flex !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            pointer-events: none !important;
            z-index: 1 !important;
          }

          .page-header-element {
            display: flex !important;
            position: static !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-family: Arial, sans-serif !important;
            z-index: 1000 !important;
          }
          
          .page-footer-element {
            display: flex !important;
            position: static !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-family: Arial, sans-serif !important;
            z-index: 1000 !important;
          }
          
          /* FIXED: Page number positioning in print - respect actual position */
          .page-number-element {
            display: flex !important;
            position: absolute !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-family: Arial, sans-serif !important;
            z-index: 2000 !important;
          }

          /* Ensure header and footer stay within page bounds */
          .header-wrapper {
            flex-shrink: 0 !important;
            position: relative !important;
          }

          .footer-wrapper {
            flex-shrink: 0 !important;
            position: relative !important;
          }

          .content-wrapper {
            flex: 1 !important;
            overflow: hidden !important;
          }
        }

        .page-info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          background: #e3f2fd;
          padding: 15px;
          border-radius: 6px;
          border: 1px solid #bbdefb;
        }
        .page-info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .page-info-item label {
          font-weight: 500;
          color: #1976d2 !important;
          font-size: 12px;
        }
        .page-info-value {
          font-weight: 600;
          color: #0d47a1 !important;
          font-size: 12px;
          background: white;
          padding: 4px 8px;
          border-radius: 4px;
          border: 1px solid #90caf9;
        }

        .page-numbering-controls {
          display: none;
          margin-top: 15px;
          padding: 15px;
          background: white;
          border-radius: 6px;
          border: 1px solid #dee2e6;
        }

        .page-numbering-controls.active {
          display: block;
        }

        /* Background color controls */
        .background-color-controls {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 10px;
          align-items: center;
          margin-top: 10px;
        }

        .color-preview {
          width: 40px;
          height: 40px;
          border: 2px solid #dee2e6;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .color-preview:hover {
          border-color: #007bff;
          transform: scale(1.05);
        }

        /* Header/Footer Controls */
        .header-footer-controls {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-top: 15px;
        }

        .header-footer-section {
          padding: 15px;
          background: white;
          border-radius: 6px;
          border: 1px solid #dee2e6;
        }

        .header-footer-section h4 {
          margin: 0 0 10px 0;
          color: #333 !important;
          font-size: 14px;
          font-weight: 600;
        }

        .size-input-group {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 10px;
        }

        .size-input-group label {
          min-width: 80px;
          font-size: 12px;
          color: #666 !important;
        }

        .size-input-group input {
          flex: 1;
          padding: 6px 8px;
          border: 1px solid #dee2e6;
          border-radius: 4px;
          font-size: 12px;
        }

        /* Format and Orientation Change Section */
        .format-change-section {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .format-change-section h3 {
          color: #856404 !important;
          margin-bottom: 15px;
        }

        .format-change-warning {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          border-radius: 6px;
          padding: 10px;
          margin-bottom: 15px;
          font-size: 12px;
          color: #721c24 !important;
        }

        .format-change-controls {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
      </style>
    `

    if (!document.getElementById("enhanced-page-setup-styles")) {
      document.head.insertAdjacentHTML("beforeend", styles)
    }
  }

  createInitialSetupModal() {
    const modalHTML = `
      <div id="pageSetupModal" class="page-setup-modal">
        <div class="page-setup-content">
          <div class="page-setup-header">
            <h2>📄 Enhanced Page Setup</h2>
            <p>Configure your document pages with advanced features</p>
          </div>
          
          <div class="page-setup-section">
            <h3>📐 Page Format & Orientation</h3>
            <div class="page-setup-row">
              <label class="page-setup-label">Format:</label>
              <select id="pageFormat" class="page-setup-control">
                <option value="a4" selected>A4 (210 × 297 mm)</option>
                <option value="a3">A3 (297 × 420 mm)</option>
                <option value="a2">A2 (420 × 594 mm)</option>
                <option value="a1">A1 (594 × 841 mm)</option>
                <option value="a0">A0 (841 × 1189 mm)</option>
                <option value="letter">Letter (8.5 × 11 in)</option>
                <option value="legal">Legal (8.5 × 14 in)</option>
                <option value="a5">A5 (148 × 210 mm)</option>
                <option value="custom">Custom Size</option>
              </select>
            </div>
            
            <div class="page-setup-row">
              <label class="page-setup-label">Orientation:</label>
              <select id="pageOrientation" class="page-setup-control">
                <option value="portrait" selected>Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
            
            <div id="customSizeSection" class="page-setup-custom-size">
              <h4>Custom Dimensions</h4>
              <div class="page-setup-custom-row">
                <div>
                  <label>Width:</label>
                  <input type="number" id="customWidth" class="page-setup-control" value="210" min="50" max="2000">
                </div>
                <div>
                  <label>Height:</label>
                  <input type="number" id="customHeight" class="page-setup-control" value="297" min="50" max="2000">
                </div>
              </div>
            </div>
          </div>

          <div class="page-setup-section">
            <h3>📄 Header & Footer (Default: Enabled)</h3>
            <p style="font-size: 12px; color: #666; margin-bottom: 15px;">Headers and footers are enabled by default with 1.27cm height. You can drag components into them and they will appear on all pages.</p>
            <div class="header-footer-controls">
              <div class="header-footer-section">
                <h4>📋 Header Settings</h4>
                <div class="page-setup-row">
                  <label>
                    <input type="checkbox" id="headerEnabled" checked style="border: 2px solid #000 !important;"> Enable Header
                  </label>
                </div>
                <div class="size-input-group">
                  <label>Height:</label>
                  <input type="number" id="headerHeight" value="12.7" min="5" max="50" step="0.1">
                  <span style="font-size: 12px; color: #666;">mm</span>
                </div>
              </div>
              <div class="header-footer-section">
                <h4>📋 Footer Settings</h4>
                <div class="page-setup-row">
                  <label>
                    <input type="checkbox" id="footerEnabled" checked style="border: 2px solid #000 !important;"> Enable Footer
                  </label>
                </div>
                <div class="size-input-group">
                  <label>Height:</label>
                  <input type="number" id="footerHeight" value="12.7" min="5" max="50" step="0.1">
                  <span style="font-size: 12px; color: #666;">mm</span>
                </div>
              </div>
            </div>
          </div>

          <div class="page-setup-section">
            <h3>🎨 Page Background</h3>
            <div class="page-setup-row">
              <label class="page-setup-label">Background Color:</label>
              <div class="background-color-controls">
                <input type="color" id="pageBackgroundColor" class="page-setup-control" value="#ffffff">
                <div class="color-preview" id="backgroundColorPreview" style="background-color: #ffffff;"></div>
              </div>
            </div>
            <p style="font-size: 12px; color: #666; margin-top: 5px;">Background color will be preserved in headers, footers, and print/PDF output</p>
          </div>

          <div class="page-setup-section">
            <h3>📏 Page Margins (mm)</h3>
            <p style="font-size: 12px; color: #666; margin-bottom: 10px;">Margins will reduce the available content area</p>
            <div class="margins-grid">
              <div>
                <label>Top:</label>
                <input type="number" id="marginTop" class="page-setup-control" value="0" min="0" max="50">
              </div>
              <div>
                <label>Bottom:</label>
                <input type="number" id="marginBottom" class="page-setup-control" value="0" min="0" max="50">
              </div>
              <div>
                <label>Left:</label>
                <input type="number" id="marginLeft" class="page-setup-control" value="0" min="0" max="50">
              </div>
              <div>
                <label>Right:</label>
                <input type="number" id="marginRight" class="page-setup-control" value="0" min="0" max="50">
              </div>
            </div>
          </div>
          
          <div class="page-setup-section">
            <h3>📊 Pages</h3>
            <div class="page-setup-row">
              <label class="page-setup-label">Number of Pages:</label>
              <input type="number" id="numberOfPages" class="page-setup-control" value="1" min="1" max="100">
            </div>
          </div>
          
          <div class="page-setup-actions">
            <button id="pageSetupCancel" class="page-setup-btn page-setup-btn-secondary">Cancel</button>
            <button id="pageSetupApply" class="page-setup-btn page-setup-btn-primary">Create Pages</button>
          </div>
        </div>
      </div>
    `

    if (!document.getElementById("pageSetupModal")) {
      document.body.insertAdjacentHTML("beforeend", modalHTML)
    }
  }

  addToGrapesJSSettings() {
    const settingsPanel = this.editor.Panels.getPanel("options")

    if (settingsPanel) {
      this.updateNavbarButton()
      this.updateAddPageButton()
    }

    this.editor.Commands.add("open-page-setup", {
      run: () => this.showInitialSetup(),
    })

    this.editor.Commands.add("open-page-elements-settings", {
      run: () => this.showPageElementsSettings(),
    })

    this.editor.Commands.add("add-new-page", {
      run: () => this.addNewPage(),
    })

    this.editor.Commands.add("delete-pages", {
      run: () => this.showPageDeleteModal(),
    })
  }

  createPagesFromContent() {
    const container = document.getElementById("iemb");
    const content = document.getElementById("ibpc").innerHTML;

    // Convert JSON/text into HTML blocks (example: mock data rows)
    let data;
    try {
      data = JSON.parse(content); // If valid JSON
    } catch (e) {
      data = content.split(/\n+/).map(line => ({ text: line }));
    }

    // Calculate usable page height (A4 portrait minus header/footer/margins)
    const pageHeight = 1123; // px for A4 portrait @ 96dpi approx
    const headerHeight = 60; // px
    const footerHeight = 60; // px
    const marginTop = 20, marginBottom = 20;
    const usableHeight = pageHeight - (headerHeight + footerHeight + marginTop + marginBottom);

    // Clear current content
    container.innerHTML = "";

    let currentPage = createPage();
    let currentHeight = 0;
    container.appendChild(currentPage);

    data.forEach((item, index) => {
      const block = document.createElement("div");
      block.className = "content-block";
      block.innerText = item.first_name ?
        `${item.id}. ${item.first_name} ${item.last_name} - ${item.email}` :
        item.text;

      currentPage.querySelector(".section-content").appendChild(block);

      if (block.offsetHeight + currentHeight > usableHeight) {
        // Move block to next page
        currentPage = createPage();
        container.appendChild(currentPage);
        currentPage.querySelector(".section-content").appendChild(block);
        currentHeight = block.offsetHeight;
      } else {
        currentHeight += block.offsetHeight;
      }
    });
  }

  createPage() {
    const page = document.createElement("div");
    page.className = "sections-container";
    page.innerHTML = `
    <div class="section-header gjs-editor-header" data-gjs-name="Header"></div>
    <div class="section-content gjs-editor-content" data-gjs-name="Content"></div>
    <div class="section-footer gjs-editor-footer" data-gjs-name="Footer"></div>
  `;
    return page;
  }


  updateNavbarButton() {
    const settingsPanel = this.editor.Panels.getPanel("options")
    if (!settingsPanel) return

    const existingSetupBtn = settingsPanel.get("buttons").get("page-setup")
    const existingSettingsBtn = settingsPanel.get("buttons").get("page-elements-settings")

    if (existingSetupBtn) {
      settingsPanel.get("buttons").remove(existingSetupBtn)
    }
    if (existingSettingsBtn) {
      settingsPanel.get("buttons").remove(existingSettingsBtn)
    }

    if (!this.isInitialized) {
      settingsPanel.get("buttons").add({
        id: "page-setup",
        className: "fa fa-file-o",
        command: "open-page-setup",
        attributes: { title: "Setup Pages" },
      })
    } else {
      settingsPanel.get("buttons").add({
        id: "page-elements-settings",
        className: "fa fa-cogs",
        command: "open-page-elements-settings",
        attributes: { title: "Page Elements Settings" },
      })
    }
  }

  updateAddPageButton() {
    const settingsPanel = this.editor.Panels.getPanel("options")
    if (!settingsPanel) return

    const existingAddBtn = settingsPanel.get("buttons").get("add-page")

    if (this.isInitialized && !existingAddBtn) {
      settingsPanel.get("buttons").add({
        id: "add-page",
        className: "fa fa-plus",
        command: "add-new-page",
        attributes: { title: "Add New Page" },
      })
    } else if (!this.isInitialized && existingAddBtn) {
      settingsPanel.get("buttons").remove(existingAddBtn)
    }
  }

  setupEventListeners() {
    document.addEventListener("change", (e) => {
      if (e.target.id === "pageFormat") {
        const customSection = document.getElementById("customSizeSection")
        if (customSection) {
          if (e.target.value === "custom") {
            customSection.classList.add("active")
          } else {
            customSection.classList.remove("active")
          }
        }
      }

      if (e.target.id === "enablePageNumbering") {
        const controls = document.getElementById("pageNumberingControls")
        if (controls) {
          if (e.target.checked) {
            controls.classList.add("active")
            this.updateStartFromPageOptions()
          } else {
            controls.classList.remove("active")
          }
        }
      }

      if (e.target.id === "enableWatermark") {
        const controls = document.getElementById("watermarkControls")
        if (controls) {
          if (e.target.checked) {
            controls.classList.add("active")
          } else {
            controls.classList.remove("active")
          }
        }
      }

      if (e.target.id === "numberOfPages") {
        this.updateStartFromPageOptions()
      }

      if (e.target.id === "pageBackgroundColor") {
        const preview = document.getElementById("backgroundColorPreview")
        if (preview) {
          preview.style.backgroundColor = e.target.value
        }
      }

      // Settings modal event handlers
      if (e.target.id === "settingsPageFormat" || e.target.id === "settingsPageOrientation") {
        this.updateFormatPreview()
      }
    })

    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("watermark-type-btn")) {
        document.querySelectorAll(".watermark-type-btn").forEach((btn) => btn.classList.remove("active"))
        e.target.classList.add("active")

        const type = e.target.dataset.type
        const textControls = document.getElementById("watermarkTextControls")
        const imageControls = document.getElementById("watermarkImageControls")

        if (type === "text") {
          textControls.style.display = "block"
          imageControls.style.display = "none"
        } else if (type === "image") {
          textControls.style.display = "none"
          imageControls.style.display = "block"
        } else if (type === "both") {
          textControls.style.display = "block"
          imageControls.style.display = "block"
        }
      }

      if (e.target.classList.contains("position-option")) {
        const parent = e.target.parentElement
        parent.querySelectorAll(".position-option").forEach((opt) => opt.classList.remove("selected"))
        e.target.classList.add("selected")
      }

      if (e.target.id === "pageSetupApply") {
        this.applyPageSetup()
      } else if (e.target.id === "pageSetupCancel") {
        this.cancelPageSetup()
      }

      if (e.target.id === "backgroundColorPreview") {
        const colorInput = document.getElementById("pageBackgroundColor")
        if (colorInput) {
          colorInput.click()
        }
      }

      // Format change button
      if (e.target.id === "applyFormatChange") {
        this.applyFormatAndOrientationChange()
      }
    })
  }

  updateStartFromPageOptions() {
    const numberOfPages = Number.parseInt(document.getElementById("numberOfPages")?.value) || 1
    const startFromPageSelect = document.getElementById("startFromPage")

    if (startFromPageSelect) {
      startFromPageSelect.innerHTML = ""
      for (let i = 1; i <= numberOfPages; i++) {
        const option = document.createElement("option")
        option.value = i
        option.textContent = `Page ${i}`
        startFromPageSelect.appendChild(option)
      }
    }
  }

  updateFormatPreview() {
    const format = document.getElementById("settingsPageFormat")?.value || this.pageSettings.format
    const orientation = document.getElementById("settingsPageOrientation")?.value || this.pageSettings.orientation

    let dimensions
    if (format === "custom") {
      const width = Number.parseFloat(document.getElementById("settingsCustomWidth")?.value) || this.pageSettings.width
      const height =
        Number.parseFloat(document.getElementById("settingsCustomHeight")?.value) || this.pageSettings.height
      dimensions = { width, height }
    } else {
      dimensions = this.pageFormats[format] || this.pageFormats.a4
    }

    const finalWidth = orientation === "landscape" ? dimensions.height : dimensions.width
    const finalHeight = orientation === "landscape" ? dimensions.width : dimensions.height

    const previewElement = document.getElementById("formatPreviewDimensions")
    if (previewElement) {
      previewElement.textContent = `${finalWidth} × ${finalHeight} mm`
    }
  }

  showInitialSetup() {
    const modal = document.getElementById("pageSetupModal")
    if (modal) {
      modal.style.display = "flex"
      this.updateStartFromPageOptions()

      if (this.isInitialized) {
        const bgColorInput = document.getElementById("pageBackgroundColor")
        const bgColorPreview = document.getElementById("backgroundColorPreview")
        if (bgColorInput && bgColorPreview) {
          bgColorInput.value = this.pageSettings.backgroundColor
          bgColorPreview.style.backgroundColor = this.pageSettings.backgroundColor
        }
      }
    } else {
      console.error("Page setup modal not found")
      this.createInitialSetupModal()
      setTimeout(() => {
        const newModal = document.getElementById("pageSetupModal")
        if (newModal) {
          newModal.style.display = "flex"
          this.updateStartFromPageOptions()
        }
      }, 100)
    }
  }

  applyPageSetup() {
    const format = document.getElementById("pageFormat").value
    const orientation = document.getElementById("pageOrientation").value
    const numberOfPages = Number.parseInt(document.getElementById("numberOfPages").value) || 1
    const backgroundColor = document.getElementById("pageBackgroundColor")?.value || "#ffffff"

    // Get header/footer settings
    const headerEnabled = document.getElementById("headerEnabled")?.checked !== false
    const footerEnabled = document.getElementById("footerEnabled")?.checked !== false
    const headerHeight = Number.parseFloat(document.getElementById("headerHeight")?.value) || 12.7
    const footerHeight = Number.parseFloat(document.getElementById("footerHeight")?.value) || 12.7

    const margins = {
      top: Number.parseFloat(document.getElementById("marginTop").value) || 0,
      bottom: Number.parseFloat(document.getElementById("marginBottom").value) || 0,
      left: Number.parseFloat(document.getElementById("marginLeft").value) || 0,
      right: Number.parseFloat(document.getElementById("marginRight").value) || 0,
    }

    const pageNumberingEnabled = document.getElementById("enablePageNumbering")?.checked || false
    const startFromPage = Number.parseInt(document.getElementById("startFromPage")?.value) || 1

    const watermarkEnabled = document.getElementById("enableWatermark")?.checked || false
    const watermarkType = document.querySelector(".watermark-type-btn.active")?.dataset.type || "text"
    const watermarkPosition =
      document.querySelector(".watermark-controls .position-option.selected")?.dataset.position || "center"

    let width, height
    if (format === "custom") {
      width = Number.parseFloat(document.getElementById("customWidth").value) || 210
      height = Number.parseFloat(document.getElementById("customHeight").value) || 297
    } else {
      const dimensions = this.pageFormats[format] || this.pageFormats.a4
      width = orientation === "landscape" ? dimensions.height : dimensions.width
      height = orientation === "landscape" ? dimensions.width : dimensions.height
    }

    // Update settings with new header/footer configuration
    this.pageSettings = {
      format,
      orientation,
      numberOfPages,
      width,
      height,
      margins,
      backgroundColor,
      pages: [],
      headerFooter: {
        headerEnabled,
        footerEnabled,
        headerHeight,
        footerHeight,
      },
      pageNumbering: {
        enabled: pageNumberingEnabled,
        startFromPage: startFromPage,
        excludedPages: Array.from({ length: startFromPage - 1 }, (_, i) => i + 1),
      },
      watermark: {
        enabled: watermarkEnabled,
        type: watermarkType,
        text: {
          content: document.getElementById("watermarkText")?.value || "CONFIDENTIAL",
          fontSize: Number.parseInt(document.getElementById("watermarkFontSize")?.value) || 48,
          color: document.getElementById("watermarkColor")?.value || "#cccccc",
          opacity: Number.parseInt(document.getElementById("watermarkOpacity")?.value) / 100 || 0.3,
          rotation: Number.parseInt(document.getElementById("watermarkRotation")?.value) || -45,
        },
        image: {
          url: document.getElementById("watermarkImageUrl")?.value || "",
          width: Number.parseInt(document.getElementById("watermarkImageWidth")?.value) || 200,
          height: Number.parseInt(document.getElementById("watermarkImageHeight")?.value) || 200,
          opacity: 0.3,
        },
        position: watermarkPosition,
        applyToAllPages: true,
        tiled: document.getElementById("watermarkTiled")?.checked || false,
      },
    }

    // Initialize pages with individual settings
    for (let i = 0; i < numberOfPages; i++) {
      this.pageSettings.pages.push({
        id: `page-${i + 1}`,
        name: `Page ${i + 1}`,
        pageNumber: i + 1,
        backgroundColor: backgroundColor,
        header: {
          enabled: headerEnabled,
          content: "",
          height: headerHeight,
          padding: 10,
          fontSize: 12,
          color: "#333333",
          backgroundColor: backgroundColor,
          position: "center",
        },
        footer: {
          enabled: footerEnabled,
          content: "",
          height: footerHeight,
          padding: 10,
          fontSize: 12,
          color: "#333333",
          backgroundColor: backgroundColor,
          position: "center",
        },
        pageNumber: {
          enabled: false,
          format: "Page {n}",
          position: "bottom-right",
          fontSize: 11,
          color: "#333333",
          backgroundColor: "#ffffff",
          showBorder: true,
        },
      })
    }

    this.setupEditorPages()
    this.setupCanvasScrolling()

    const modal = document.getElementById("pageSetupModal")
    if (modal) {
      modal.style.display = "none"
    }

    this.isInitialized = true
    this.updateNavbarButton()
    this.updateAddPageButton()

    console.log("Enhanced page setup applied:", this.pageSettings)
  }

  cancelPageSetup() {
    const modal = document.getElementById("pageSetupModal")
    if (modal) {
      modal.style.display = "none"
    }
  }

  showPageElementsSettings() {
    if (!this.isInitialized || this.pageSettings.pages.length === 0) {
      alert("Please set up pages first")
      return
    }

    const firstPage = this.pageSettings.pages[0]
    const globalHeader = firstPage.header || {}
    const globalFooter = firstPage.footer || {}
    const globalPageNumber = firstPage.pageNumber || {}

    const headerHeight = this._lastHeaderHeight ?? this.pageSettings.headerFooter.headerHeight ?? 12.7;
    const footerHeight = this._lastFooterHeight ?? this.pageSettings.headerFooter.footerHeight ?? 12.7;
    const headerApplyMode = this._lastHeaderApplyMode ?? "all";
    const footerApplyMode = this._lastFooterApplyMode ?? "all"

    let pageOptions = ""
    for (let i = 1; i <= this.pageSettings.numberOfPages; i++) {
      const selected = this.pageSettings.pageNumbering.startFromPage === i ? "selected" : ""
      pageOptions += `<option value="${i}" ${selected}>Page ${i}</option>`
    }

    this.editor.Modal.setTitle("Word-Style Page Elements Settings")
    this.editor.Modal.setContent(`
    <div class="page-settings-content" style="color: #000 !important;">
      <div class="page-setup-section">
        <h3>📋 Page Information</h3>
        <div class="page-info-grid">
          <div class="page-info-item">
            <label>Format:</label>
            <span class="page-info-value">${this.pageSettings.format.toUpperCase()}</span>
          </div>
          <div class="page-info-item">
            <label>Orientation:</label>
            <span class="page-info-value">${this.pageSettings.orientation.charAt(0).toUpperCase() + this.pageSettings.orientation.slice(1)}</span>
          </div>
          <div class="page-info-item">
            <label>Total Pages:</label>
            <span class="page-info-value">${this.pageSettings.numberOfPages}</span>
          </div>
          <div class="page-info-item">
            <label>Dimensions:</label>
            <span class="page-info-value">${this.pageSettings.width} × ${this.pageSettings.height} mm</span>
          </div>
          <div class="page-info-item">
            <label>Margins:</label>
            <span class="page-info-value">${this.pageSettings.margins.top}/${this.pageSettings.margins.bottom}/${this.pageSettings.margins.left}/${this.pageSettings.margins.right} mm</span>
          </div>
          <div class="page-info-item">
            <label>Content Area:</label>
            <span class="page-info-value">${(this.pageSettings.width - this.pageSettings.margins.left - this.pageSettings.margins.right).toFixed(1)} × ${(this.pageSettings.height - this.pageSettings.margins.top - this.pageSettings.margins.bottom).toFixed(1)} mm</span>
          </div>
        </div>
      </div>

      <div class="page-setup-section format-change-section">
        <h3>📐 Change Page Format & Orientation</h3>
        <div class="format-change-warning">
          <strong>⚠️ Warning:</strong> Changing format or orientation will automatically adjust content positions to maintain relative positioning. Content at center will remain centered, content at edges will be repositioned proportionally.
        </div>
        <div class="format-change-controls">
          <div>
            <label class="page-setup-label">New Format:</label>
            <select id="settingsPageFormat" class="page-setup-control">
              <option value="a4" ${this.pageSettings.format === "a4" ? "selected" : ""}>A4 (210 × 297 mm)</option>
              <option value="a3" ${this.pageSettings.format === "a3" ? "selected" : ""}>A3 (297 × 420 mm)</option>
              <option value="a2" ${this.pageSettings.format === "a2" ? "selected" : ""}>A2 (420 × 594 mm)</option>
              <option value="a1" ${this.pageSettings.format === "a1" ? "selected" : ""}>A1 (594 × 841 mm)</option>
              <option value="a0" ${this.pageSettings.format === "a0" ? "selected" : ""}>A0 (841 × 1189 mm)</option>
              <option value="letter" ${this.pageSettings.format === "letter" ? "selected" : ""}>Letter (8.5 × 11 in)</option>
              <option value="legal" ${this.pageSettings.format === "legal" ? "selected" : ""}>Legal (8.5 × 14 in)</option>
              <option value="a5" ${this.pageSettings.format === "a5" ? "selected" : ""}>A5 (148 × 210 mm)</option>
              <option value="custom" ${this.pageSettings.format === "custom" ? "selected" : ""}>Custom Size</option>
            </select>
          </div>
          <div>
            <label class="page-setup-label">New Orientation:</label>
            <select id="settingsPageOrientation" class="page-setup-control">
              <option value="portrait" ${this.pageSettings.orientation === "portrait" ? "selected" : ""}>Portrait</option>
              <option value="landscape" ${this.pageSettings.orientation === "landscape" ? "selected" : ""}>Landscape</option>
            </select>
          </div>
        </div>
        <div id="settingsCustomSizeSection" class="page-setup-custom-size ${this.pageSettings.format === "custom" ? "active" : ""}">
          <h4>Custom Dimensions</h4>
          <div class="page-setup-custom-row">
            <div>
              <label>Width:</label>
              <input type="number" id="settingsCustomWidth" class="page-setup-control" value="${this.pageSettings.width}" min="50" max="2000">
            </div>
            <div>
              <label>Height:</label>
              <input type="number" id="settingsCustomHeight" class="page-setup-control" value="${this.pageSettings.height}" min="50" max="2000">
            </div>
          </div>
        </div>
        <div style="margin-top: 15px;">
          <strong>Preview:</strong> <span id="formatPreviewDimensions">${this.pageSettings.width} × ${this.pageSettings.height} mm</span>
        </div>
        <div style="margin-top: 15px;">
          <button id="applyFormatChange" class="page-setup-btn page-setup-btn-primary">Apply Format Change</button>
        </div>
      </div>

      <div class="page-setup-section">
        <h3>🎨 Page Background</h3>
        <div class="page-setup-row">
          <label class="page-setup-label">Background Color:</label>
          <div class="background-color-controls">
            <input type="color" id="settingsPageBackgroundColor" class="page-setup-control" value="${this.pageSettings.backgroundColor || "#ffffff"}">
            <div class="color-preview" id="settingsBackgroundColorPreview" style="background-color: ${this.pageSettings.backgroundColor || "#ffffff"};"></div>
          </div>
        </div>
        <p style="font-size: 12px; color: #666; margin-top: 5px;">Background color will be preserved in headers, footers, and print/PDF output</p>
      </div>

      <div class="page-setup-section">
        <h3>💧 Page Watermark Settings</h3>
        <div class="page-setup-row">
          <label>
            <input type="checkbox" id="settingsWatermarkEnabled" ${this.pageSettings.watermark.enabled ? "checked" : ""} style="border: 2px solid #000 !important;"> Enable Watermark
          </label>
        </div>
        <div id="settingsWatermarkControls" class="watermark-controls ${this.pageSettings.watermark.enabled ? "active" : ""}">
          <div class="page-setup-row">
            <label class="page-setup-label">Type:</label>
            <div class="watermark-type-controls">
              <div class="watermark-type-btn ${this.pageSettings.watermark.type === "text" ? "active" : ""}" data-type="text">Text</div>
              <div class="watermark-type-btn ${this.pageSettings.watermark.type === "image" ? "active" : ""}" data-type="image">Image</div>
              <div class="watermark-type-btn ${this.pageSettings.watermark.type === "both" ? "active" : ""}" data-type="both">Both</div>
            </div>
          </div>
          
          <div id="settingsWatermarkTextControls" style="display: ${this.pageSettings.watermark.type === "text" || this.pageSettings.watermark.type === "both" ? "block" : "none"};">
            <div class="page-setup-row">
              <label class="page-setup-label">Text:</label>
              <input type="text" id="settingsWatermarkText" class="page-setup-control" value="${this.pageSettings.watermark.text.content}" placeholder="Enter watermark text">
            </div>
            <div class="size-controls">
              <div>
                <label>Font Size:</label>
                <input type="number" id="settingsWatermarkFontSize" class="page-setup-control" value="${this.pageSettings.watermark.text.fontSize}" min="12" max="100">
              </div>
              <div>
                <label>Color:</label>
                <input type="color" id="settingsWatermarkColor" class="page-setup-control" value="${this.pageSettings.watermark.text.color}">
              </div>
              <div>
                <label>Opacity:</label>
                <input type="range" id="settingsWatermarkOpacity" class="page-setup-control" value="${Math.round(this.pageSettings.watermark.text.opacity * 100)}" min="10" max="80">
              </div>
              <div>
                <label>Rotation:</label>
                <input type="range" id="settingsWatermarkRotation" class="page-setup-control" value="${this.pageSettings.watermark.text.rotation}" min="-90" max="90">
              </div>
            </div>
          </div>

          <div id="settingsWatermarkImageControls" style="display: ${this.pageSettings.watermark.type === "image" || this.pageSettings.watermark.type === "both" ? "block" : "none"};">

    <div class="page-setup-row">
      <label class="page-setup-label">Image URL:</label>
      <input type="url" id="settingsWatermarkImageUrl" class="page-setup-control"
             value="${this.pageSettings.watermark.image.url}" placeholder="Enter image URL">
    </div>

    <div class="page-setup-row">
      <label class="page-setup-label">Or Upload Image:</label>
      <input type="file" id="settingsWatermarkImageFile" accept="image/*" class="page-setup-control">
    </div>

    <div class="size-controls">
      <div>
        <label>Width (px):</label>
        <input type="number" id="settingsWatermarkImageWidth" class="page-setup-control"
               value="${this.pageSettings.watermark.image.width}" min="50" max="500">
      </div>
      <div>
        <label>Height (px):</label>
        <input type="number" id="settingsWatermarkImageHeight" class="page-setup-control"
               value="${this.pageSettings.watermark.image.height}" min="50" max="500">
      </div>
    </div>

  </div>
<div class="page-setup-row">
  <label>
    <input type="checkbox" id="settingsWatermarkTiled" ${this.pageSettings.watermark.tiled ? "checked" : ""}> 
    Tiled Watermark (Repeat across page)
  </label>
</div>

          <div class="page-setup-row">
            <label class="page-setup-label">Position:</label>
            <div class="position-grid">
              <div class="watermark-position-option ${this.pageSettings.watermark.position === "top-left" ? "selected" : ""}" data-position="top-left">Top Left</div>
              <div class="watermark-position-option ${this.pageSettings.watermark.position === "top-center" ? "selected" : ""}" data-position="top-center">Top Center</div>
              <div class="watermark-position-option ${this.pageSettings.watermark.position === "top-right" ? "selected" : ""}" data-position="top-right">Top Right</div>
              <div class="watermark-position-option ${this.pageSettings.watermark.position === "center-left" ? "selected" : ""}" data-position="center-left">Center Left</div>
              <div class="watermark-position-option ${this.pageSettings.watermark.position === "center" ? "selected" : ""}" data-position="center">Center</div>
              <div class="watermark-position-option ${this.pageSettings.watermark.position === "center-right" ? "selected" : ""}" data-position="center-right">Center Right</div>
              <div class="watermark-position-option ${this.pageSettings.watermark.position === "bottom-left" ? "selected" : ""}" data-position="bottom-left">Bottom Left</div>
              <div class="watermark-position-option ${this.pageSettings.watermark.position === "bottom-center" ? "selected" : ""}" data-position="bottom-center">Bottom Center</div>
              <div class="watermark-position-option ${this.pageSettings.watermark.position === "bottom-right" ? "selected" : ""}" data-position="bottom-right">Bottom Right</div>
            </div>
          </div>
        </div>
      </div>

      <div class="page-setup-section">
        <h3>📏 Page Margins (mm)</h3>
        <div class="margins-grid">
          <div>
            <label>Top:</label>
            <input type="number" id="settingsMarginTop" class="page-setup-control" value="${this.pageSettings.margins.top}" min="0" max="50">
          </div>
          <div>
            <label>Bottom:</label>
            <input type="number" id="settingsMarginBottom" class="page-setup-control" value="${this.pageSettings.margins.bottom}" min="0" max="50">
          </div>
          <div>
            <label>Left:</label>
            <input type="number" id="settingsMarginLeft" class="page-setup-control" value="${this.pageSettings.margins.left}" min="0" max="50">
          </div>
          <div>
            <label>Right:</label>
            <input type="number" id="settingsMarginRight" class="page-setup-control" value="${this.pageSettings.margins.right}" min="0" max="50">
          </div>
        </div>
      </div>

      <div class="page-setup-section">
        <div class="word-style-notice" style="background: #e3f2fd; border: 1px solid #2196f3; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
          <h4 style="margin: 0 0 10px 0; color: #1976d2 !important;">📝 Word-Style Headers & Footers</h4>
          <p style="margin: 0; font-size: 12px; color: #1565c0 !important;">
            <strong>All Pages:</strong> Same content on every page<br>
            <strong>Even Pages Only:</strong> Headers/footers appear only on pages 2, 4, 6...<br>
            <strong>Odd Pages Only:</strong> Headers/footers appear only on pages 1, 3, 5...<br>
            <strong>Different Odd & Even:</strong> Separate header/footer content for odd and even pages<br>
            <strong>Custom Range:</strong> Headers/footers appear only on specified pages
          </p>
        </div>
        
        <!-- Header Controls -->
        <div class="header-footer-section">
          <h4>📋 Header Settings</h4>
          <div class="page-setup-row">
            <label><input type="checkbox" id="settingsHeaderEnabled" ${this.pageSettings.headerFooter.headerEnabled ? "checked" : ""}> Enable Header</label>
          </div>
        
          <div class="size-input-group">
            <label>Height:</label>
            <input type="number" id="settingsHeaderHeight" value="${headerHeight}" min="5" max="50" step="0.1">
            <span style="font-size: 12px; color: #666;">mm</span>
          </div>
          
          <div class="page-setup-row">
            <label class="page-setup-label">Apply Header To:</label>
            <select id="headerApplyMode" class="page-setup-control">
        <option value="all" ${headerApplyMode === "all" ? "selected" : ""}>All Pages</option>
        <option value="first" ${headerApplyMode === "first" ? "selected" : ""}>First Page Only</option>
        <option value="last" ${headerApplyMode === "last" ? "selected" : ""}>Last Page Only</option>
        <option value="even" ${headerApplyMode === "even" ? "selected" : ""}>Even Pages Only (2, 4, 6...)</option>
        <option value="odd" ${headerApplyMode === "odd" ? "selected" : ""}>Odd Pages Only (1, 3, 5...)</option>
        <option value="different" ${headerApplyMode === "different" ? "selected" : ""}>Different Odd & Even Pages</option>
        <option value="custom" ${headerApplyMode === "custom" ? "selected" : ""}>Custom Range</option>
      </select>
          </div>
          
          <div class="page-setup-row custom-range" id="headerCustomRangeInputs" style="display: ${headerApplyMode === "custom" ? "block" : "none"};">
            <input type="text" id="headerCustomPageList" placeholder="e.g. 1,3,5-7" value="${this._lastHeaderCustomPageList || ''}" style="width: 100%;">
          </div>
        </div>

        <!-- Footer Controls -->
        <div class="header-footer-section">
          <h4>📋 Footer Settings</h4>
          <div class="page-setup-row">
            <label><input type="checkbox" id="settingsFooterEnabled" ${this.pageSettings.headerFooter.footerEnabled ? "checked" : ""}> Enable Footer</label>
          </div>
          
          <div class="size-input-group">
            <label>Height:</label>
            <input type="number" id="settingsFooterHeight" value="${footerHeight}" min="5" max="50" step="0.1">
            <span style="font-size: 12px; color: #666;">mm</span>
          </div>
          
          <div class="page-setup-row">
            <label class="page-setup-label">Apply Footer To:</label>
            <select id="footerApplyMode" class="page-setup-control">
        <option value="all" ${footerApplyMode === "all" ? "selected" : ""}>All Pages</option>
        <option value="first" ${footerApplyMode === "first" ? "selected" : ""}>First Page Only</option>
        <option value="last" ${footerApplyMode === "last" ? "selected" : ""}>Last Page Only</option>
        <option value="even" ${footerApplyMode === "even" ? "selected" : ""}>Even Pages Only (2, 4, 6...)</option>
        <option value="odd" ${footerApplyMode === "odd" ? "selected" : ""}>Odd Pages Only (1, 3, 5...)</option>
        <option value="different" ${footerApplyMode === "different" ? "selected" : ""}>Different Odd & Even Pages</option>
        <option value="custom" ${footerApplyMode === "custom" ? "selected" : ""}>Custom Range</option>
      </select>
          </div>
          
          <div class="page-setup-row custom-range" id="footerCustomRangeInputs" style="display: ${footerApplyMode === "custom" ? "block" : "none"};">
            <input type="text" id="footerCustomPageList" placeholder="e.g. 2,4-6,9" value="${this._lastFooterCustomPageList || ''}" style="width: 100%;">
          </div>
        </div>
      </div>

      <div class="page-setup-section">
        <h3>🔢 Enhanced Page Number Settings</h3>
        <div class="page-setup-row">
          <label>
            <input type="checkbox" id="pageNumberEnabled" ${globalPageNumber.enabled ? "checked" : ""} style="border: 2px solid #000 !important;"> Enable Page Numbers
          </label>
        </div>
        <div class="page-setup-row">
          <label class="page-setup-label">Start From Page:</label>
          <select id="pageNumberStartFrom" class="page-setup-control">
            ${pageOptions}
          </select>
        </div>
        <p style="font-size: 12px; color: #666; margin: 10px 0;">Pages before the selected page will be excluded from numbering</p>
        <div class="page-setup-row">
          <label class="page-setup-label">Format:</label>
          <select id="pageNumberFormat" class="page-setup-control">
            <option value="Page {n}" ${globalPageNumber.format === "Page {n}" ? "selected" : ""}>Page {n}</option>
            <option value="{n}" ${globalPageNumber.format === "{n}" ? "selected" : ""}>{n}</option>
            <option value="{n} of {total}" ${globalPageNumber.format === "{n} of {total}" ? "selected" : ""}>{n} of {total}</option>
            <option value="- {n} -" ${globalPageNumber.format === "- {n} -" ? "selected" : ""}>- {n} -</option>
            <option value="[{n}]" ${globalPageNumber.format === "[{n}]" ? "selected" : ""}>[{n}]</option>
          </select>
        </div>
        <div class="page-setup-row">
          <label class="page-setup-label">Position:</label>
          <div class="position-grid">
            <div class="position-option ${globalPageNumber.position === "top-left" ? "selected" : ""}" data-position="top-left">Top Left</div>
            <div class="position-option ${globalPageNumber.position === "top-center" ? "selected" : ""}" data-position="top-center">Top Center</div>
            <div class="position-option ${globalPageNumber.position === "top-right" ? "selected" : ""}" data-position="top-right">Top Right</div>
            <div class="position-option ${globalPageNumber.position === "center-left" ? "selected" : ""}" data-position="center-left">Center Left</div>
            <div class="position-option ${globalPageNumber.position === "center-center" ? "selected" : ""}" data-position="center-center">Center</div>
            <div class="position-option ${globalPageNumber.position === "center-right" ? "selected" : ""}" data-position="center-right">Center Right</div>
            <div class="position-option ${globalPageNumber.position === "bottom-left" ? "selected" : ""}" data-position="bottom-left">Bottom Left</div>
            <div class="position-option ${globalPageNumber.position === "bottom-center" ? "selected" : ""}" data-position="bottom-center">Bottom Center</div>
            <div class="position-option ${globalPageNumber.position === "bottom-right" ? "selected" : ""}" data-position="bottom-right">Bottom Right</div>
          </div>
        </div>
        <div class="size-controls">
          <div>
            <label>Font Size:</label>
            <input type="number" id="pageNumberFontSize" class="page-setup-control" value="${globalPageNumber.fontSize || 11}" min="8" max="20">
          </div>
          <div>
            <label>Text Color:</label>
            <input type="color" id="pageNumberColor" class="page-setup-control" value="${globalPageNumber.color || "#333333"}">
          </div>
          <div>
            <label>Background:</label>
            <input type="color" id="pageNumberBackgroundColor" class="page-setup-control" value="${globalPageNumber.backgroundColor || "#ffffff"}">
          </div>
          <div>
            <label>
              <input type="checkbox" id="pageNumberShowBorder" ${globalPageNumber.showBorder ? "checked" : ""} style="border: 2px solid #000 !important;"> Show Border
            </label>
          </div>
        </div>
      </div>

      <div class="page-setup-section">
        <h3>🗑️ Page Management</h3>
        <div class="page-setup-row">
          <button id="deletePages" class="page-setup-btn page-setup-btn-secondary">Delete Pages</button>
        </div>
      </div>
      
      <div class="page-setup-actions">
        <button id="applyPageElementsSettings" class="page-setup-btn page-setup-btn-primary">Apply Word-Style Settings</button>
        <button id="resetPageElementsSettings" class="page-setup-btn page-setup-btn-secondary">Reset</button>
      </div>
    </div>
  `)

    this.editor.Modal.open()
    this.populatePageSettingsForm();

    setTimeout(() => {
      this.setupPageElementsListeners();
      this.updateFormatPreview();

      // ENHANCED: Properly restore all page number settings
      const pageNumberSettings = this.pageSettings.pageNumber || {};

      // 1. Enable/Disable checkbox
      const enabledCheckbox = document.getElementById("pageNumberEnabled");
      if (enabledCheckbox) {
        enabledCheckbox.checked = !!pageNumberSettings.enabled;
      }

      // 2. Start From dropdown
      const startFromSelect = document.getElementById("pageNumberStartFrom");
      if (startFromSelect) {
        startFromSelect.value = pageNumberSettings.startFrom || 1;
      }

      // 3. Format dropdown
      const formatSelect = document.getElementById("pageNumberFormat");
      if (formatSelect) {
        formatSelect.value = pageNumberSettings.format || "Page {n}";
      }

      // 4. Font Size input
      const fontSizeInput = document.getElementById("pageNumberFontSize");
      if (fontSizeInput) {
        const storedSize = pageNumberSettings.fontSize;
        // Handle both number and string values
        let fontSize = 11; // default
        if (typeof storedSize === 'number') {
          fontSize = storedSize;
        } else if (typeof storedSize === 'string') {
          fontSize = parseInt(storedSize.replace("px", "")) || 11;
        }
        fontSizeInput.value = fontSize;
        console.log("📏 Font size restored:", fontSize);
      }

      // 5. Text Color input
      const colorInput = document.getElementById("pageNumberColor");
      if (colorInput) {
        colorInput.value = pageNumberSettings.color || "#333333";
      }

      // 6. Background Color input
      const bgColorInput = document.getElementById("pageNumberBackgroundColor");
      if (bgColorInput) {
        bgColorInput.value = pageNumberSettings.backgroundColor || "#ffffff";
      }

      // 7. Border checkbox
      const borderCheckbox = document.getElementById("pageNumberShowBorder");
      if (borderCheckbox) {
        borderCheckbox.checked = !!pageNumberSettings.showBorder;
        console.log("🔲 Border restored:", !!pageNumberSettings.showBorder);
      }

      // 8. Position grid - restore selected position
      const savedPosition = pageNumberSettings.position || "bottom-center";
      setTimeout(() => {
        const allPositionOptions = document.querySelectorAll(".position-option");
        allPositionOptions.forEach(opt => {
          opt.classList.remove("selected");
          if (opt.getAttribute("data-position") === savedPosition) {
            opt.classList.add("selected");
            console.log("🎯 Position element found and selected visually:", savedPosition);
          }
        });
      }, 50);

    }, 100)
  }

  applyFormatAndOrientationChange() {
    if (!this.isInitialized) return

    // Preserve all content before making changes
    this.preserveAllContent()

    const newFormat = document.getElementById("settingsPageFormat")?.value || this.pageSettings.format
    const newOrientation = document.getElementById("settingsPageOrientation")?.value || this.pageSettings.orientation

    let newWidth, newHeight
    if (newFormat === "custom") {
      newWidth = Number.parseFloat(document.getElementById("settingsCustomWidth")?.value) || this.pageSettings.width
      newHeight = Number.parseFloat(document.getElementById("settingsCustomHeight")?.value) || this.pageSettings.height
    } else {
      const dimensions = this.pageFormats[newFormat] || this.pageFormats.a4
      newWidth = newOrientation === "landscape" ? dimensions.height : dimensions.width
      newHeight = newOrientation === "landscape" ? dimensions.width : dimensions.height
    }

    // Calculate scaling factors for content adjustment
    const scaleX = newWidth / this.pageSettings.width
    const scaleY = newHeight / this.pageSettings.height

    // Store old dimensions for content adjustment
    const oldWidth = this.pageSettings.width
    const oldHeight = this.pageSettings.height

    // Update page settings
    this.pageSettings.format = newFormat
    this.pageSettings.orientation = newOrientation
    this.pageSettings.width = newWidth
    this.pageSettings.height = newHeight

    // Update all page settings
    this.pageSettings.pages.forEach((page) => {
      page.backgroundColor = page.backgroundColor || this.pageSettings.backgroundColor
    })

    try {
      // Adjust content positions in all pages
      this.adjustContentForNewFormat(scaleX, scaleY, oldWidth, oldHeight, newWidth, newHeight)

      // Recreate pages with new dimensions
      this.setupEditorPages()

      // Restore all content after recreation
      setTimeout(() => {
        this.restoreAllContent()
        this.updateAllPageVisuals()
      }, 200)

      alert(
        `✅ Page format changed to ${newFormat.toUpperCase()} ${newOrientation}!\n\nContent has been automatically adjusted to maintain relative positioning.`,
      )
    } catch (error) {
      console.error("Error applying format change:", error)
      alert("Error applying format change. Please try again.")
    }
  }

  adjustContentForNewFormat(scaleX, scaleY, oldWidth, oldHeight, newWidth, newHeight) {
    try {
      const allPageComponents = this.editor.getWrapper().find(".page-container")

      allPageComponents.forEach((pageComponent) => {
        const mainContentArea = pageComponent.find(".main-content-area")[0]
        if (!mainContentArea) return

        // Adjust all content components
        mainContentArea.components().forEach((component) => {
          this.adjustComponentPosition(component, scaleX, scaleY, oldWidth, oldHeight, newWidth, newHeight)
        })
      })
    } catch (error) {
      console.error("Error adjusting content for new format:", error)
    }
  }

  adjustComponentPosition(component, scaleX, scaleY, oldWidth, oldHeight, newWidth, newHeight) {
    try {
      const currentStyles = component.getStyle()

      // Adjust position properties
      if (currentStyles.left) {
        const leftValue = Number.parseFloat(currentStyles.left)
        if (!isNaN(leftValue)) {
          const unit = currentStyles.left.replace(leftValue.toString(), "")
          let newLeft

          if (unit === "px" || unit === "") {
            // Convert px to relative position and scale
            const relativeLeft = (leftValue / ((oldWidth * 96) / 25.4)) * 100 // Convert to percentage
            newLeft = relativeLeft * scaleX + "%"
          } else if (unit === "%") {
            // Keep percentage but adjust for content area changes
            newLeft = leftValue * scaleX + "%"
          } else {
            newLeft = leftValue * scaleX + unit
          }

          component.addStyle({ left: newLeft })
        }
      }

      if (currentStyles.top) {
        const topValue = Number.parseFloat(currentStyles.top)
        if (!isNaN(topValue)) {
          const unit = currentStyles.top.replace(topValue.toString(), "")
          let newTop

          if (unit === "px" || unit === "") {
            // Convert px to relative position and scale
            const relativeTop = (topValue / ((oldHeight * 96) / 25.4)) * 100 // Convert to percentage
            newTop = relativeTop * scaleY + "%"
          } else if (unit === "%") {
            // Keep percentage but adjust for content area changes
            newTop = topValue * scaleY + "%"
          } else {
            newTop = topValue * scaleY + unit
          }

          component.addStyle({ top: newTop })
        }
      }

      // Adjust width and height if they are set
      if (currentStyles.width) {
        const widthValue = Number.parseFloat(currentStyles.width)
        if (!isNaN(widthValue)) {
          const unit = currentStyles.width.replace(widthValue.toString(), "")
          if (unit === "px" || unit === "") {
            const relativeWidth = (widthValue / ((oldWidth * 96) / 25.4)) * 100
            const newWidth = relativeWidth * scaleX + "%"
            component.addStyle({ width: newWidth })
          } else if (unit === "%") {
            component.addStyle({ width: widthValue * scaleX + "%" })
          }
        }
      }

      if (currentStyles.height) {
        const heightValue = Number.parseFloat(currentStyles.height)
        if (!isNaN(heightValue)) {
          const unit = currentStyles.height.replace(heightValue.toString(), "")
          if (unit === "px" || unit === "") {
            const relativeHeight = (heightValue / ((oldHeight * 96) / 25.4)) * 100
            const newHeight = relativeHeight * scaleY + "%"
            component.addStyle({ height: newHeight })
          } else if (unit === "%") {
            component.addStyle({ height: heightValue * scaleY + "%" })
          }
        }
      }

      // Handle transform properties for centered content
      if (currentStyles.transform && currentStyles.transform.includes("translate")) {
        // Preserve transform-based centering
        const transform = currentStyles.transform
        component.addStyle({ transform: transform })
      }

      // Recursively adjust child components
      component.components().forEach((childComponent) => {
        this.adjustComponentPosition(childComponent, scaleX, scaleY, oldWidth, oldHeight, newWidth, newHeight)
      })
    } catch (error) {
      console.error("Error adjusting component position:", error)
    }
  }


  setupPageElementsListeners() {
    const headerModeSelect = document.getElementById("headerApplyMode");
    const footerModeSelect = document.getElementById("footerApplyMode");
    const headerCustom = document.getElementById("headerCustomRangeInputs");
    const footerCustom = document.getElementById("footerCustomRangeInputs");

    // Store original values to detect changes
    const originalHeaderText = document.getElementById("settingsHeaderText")?.value || "";
    const originalFooterText = document.getElementById("settingsFooterText")?.value || "";

    // === Header Text Input Listener ===
    const headerTextInput = document.getElementById("settingsHeaderText");
    if (headerTextInput) {
      headerTextInput.addEventListener("input", (e) => {
        // Always mark as changed when user types
        this._headerTextChanged = true;
        console.log("🔄 Header text changed by user input");

        // Ensure pageSettings.pages[0].header exists
        if (!this.pageSettings.pages[0].header) {
          this.pageSettings.pages[0].header = {};
        }
        this.pageSettings.pages[0].header.text = e.target.value;
        console.log("Header text updated:", e.target.value);
      });

      // Also detect when user focuses and changes the field
      headerTextInput.addEventListener("focus", () => {
        this._headerTextOriginal = headerTextInput.value;
      });

      headerTextInput.addEventListener("blur", () => {
        if (headerTextInput.value !== this._headerTextOriginal) {
          this._headerTextChanged = true;
          console.log("🔄 Header text changed on blur");
        }
      });
    }

    // === Footer Text Input Listener ===
    const footerTextInput = document.getElementById("settingsFooterText");
    if (footerTextInput) {
      footerTextInput.addEventListener("input", (e) => {
        // Always mark as changed when user types
        this._footerTextChanged = true;
        console.log("🔄 Footer text changed by user input");

        // Ensure pageSettings.pages[0].footer exists
        if (!this.pageSettings.pages[0].footer) {
          this.pageSettings.pages[0].footer = {};
        }
        this.pageSettings.pages[0].footer.text = e.target.value;
        console.log("Footer text updated:", e.target.value);
      });

      // Also detect when user focuses and changes the field
      footerTextInput.addEventListener("focus", () => {
        this._footerTextOriginal = footerTextInput.value;
      });

      footerTextInput.addEventListener("blur", () => {
        if (footerTextInput.value !== this._footerTextOriginal) {
          this._footerTextChanged = true;
          console.log("🔄 Footer text changed on blur");
        }
      });
    }

    // === Page Number Settings Listeners ===
    const pageNumberEnabled = document.getElementById("pageNumberEnabled");
    const pageNumberControls = document.getElementById("pageNumberControls");

    if (pageNumberEnabled && pageNumberControls) {
      pageNumberEnabled.addEventListener("change", (e) => {
        // Initialize if doesn't exist
        if (!this.pageSettings.pageNumber) {
          this.pageSettings.pageNumber = {};
        }
        this.pageSettings.pageNumber.enabled = e.target.checked;
        pageNumberControls.style.display = e.target.checked ? "block" : "none";
        console.log("📝 Page numbers enabled:", e.target.checked);
      });
    }

    const pageNumberStartFrom = document.getElementById("pageNumberStartFrom");
    if (pageNumberStartFrom) {
      pageNumberStartFrom.addEventListener("change", (e) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value)) {
          if (!this.pageSettings.pageNumber) {
            this.pageSettings.pageNumber = {};
          }
          this.pageSettings.pageNumber.startFrom = value;
          console.log("📝 Page number start from:", value);
        }
      });
    }

    const pageNumberFormat = document.getElementById("pageNumberFormat");
    if (pageNumberFormat) {
      pageNumberFormat.addEventListener("change", (e) => {
        if (!this.pageSettings.pageNumber) {
          this.pageSettings.pageNumber = {};
        }
        this.pageSettings.pageNumber.format = e.target.value;
        console.log("📝 Page number format:", e.target.value);
      });
    }

    // Page Number Position Listener
    document.querySelectorAll(".position-option").forEach((el) => {
      el.addEventListener("click", () => {
        // Only affect page number position options (not watermark)
        const parent = el.parentElement;
        if (parent.classList.contains("position-grid")) {
          parent.querySelectorAll(".position-option").forEach((opt) =>
            opt.classList.remove("selected")
          );
          el.classList.add("selected");

          // Initialize if doesn't exist
          if (!this.pageSettings.pageNumber) {
            this.pageSettings.pageNumber = {};
          }
          this.pageSettings.pageNumber.position = el.getAttribute("data-position");
          console.log("📍 Page number position stored:", el.getAttribute("data-position"));
        }
      });
    });

    // Watermark Position Listener
    document.querySelectorAll(".watermark-position-option").forEach((el) => {
      el.addEventListener("click", () => {
        // Only affect watermark position options
        document.querySelectorAll(".watermark-position-option").forEach((opt) =>
          opt.classList.remove("selected")
        );
        el.classList.add("selected");
        this.pageSettings.watermark = this.pageSettings.watermark || {};
        this.pageSettings.watermark.position = el.getAttribute("data-position");
        console.log("💧 Watermark position set to:", el.getAttribute("data-position"));
      });
    });

    const fontSizeInput = document.getElementById("pageNumberFontSize");
    if (fontSizeInput) {
      fontSizeInput.addEventListener("input", (e) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value)) {
          // Initialize if doesn't exist
          if (!this.pageSettings.pageNumber) {
            this.pageSettings.pageNumber = {};
          }
          this.pageSettings.pageNumber.fontSize = value;
          console.log("📏 Font size stored:", value);
        }
      });
    }

    const colorInput = document.getElementById("pageNumberColor");
    if (colorInput) {
      colorInput.addEventListener("input", (e) => {
        if (!this.pageSettings.pageNumber) {
          this.pageSettings.pageNumber = {};
        }
        this.pageSettings.pageNumber.color = e.target.value;
        console.log("🎨 Color stored:", e.target.value);
      });
    }

    const bgColorInput = document.getElementById("pageNumberBackgroundColor");
    if (bgColorInput) {
      bgColorInput.addEventListener("input", (e) => {
        if (!this.pageSettings.pageNumber) {
          this.pageSettings.pageNumber = {};
        }
        this.pageSettings.pageNumber.backgroundColor = e.target.value;
        console.log("🎨 Background color stored:", e.target.value);
      });
    }

    const borderToggle = document.getElementById("pageNumberShowBorder");
    if (borderToggle) {
      borderToggle.addEventListener("change", (e) => {
        if (!this.pageSettings.pageNumber) {
          this.pageSettings.pageNumber = {};
        }
        this.pageSettings.pageNumber.showBorder = e.target.checked;
        console.log("🔲 Border stored:", e.target.checked);
      });
    }

    // === Header/Footer Apply Mode Listeners ===
    if (headerModeSelect && headerCustom) {
      headerModeSelect.addEventListener("change", () => {
        headerCustom.style.display = headerModeSelect.value === "custom" ? "block" : "none";
      });
    }

    if (footerModeSelect && footerCustom) {
      footerModeSelect.addEventListener("change", () => {
        footerCustom.style.display = footerModeSelect.value === "custom" ? "block" : "none";
      });
    }

    // === Header/Footer Height Listeners ===
    const headerHeightInput = document.getElementById("settingsHeaderHeight");
    if (headerHeightInput) {
      headerHeightInput.addEventListener("input", (e) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value)) {
          this._lastHeaderHeight = value;
          this.pageSettings.headerFooter.headerHeight = value;
        }
      });
    }

    const footerHeightInput = document.getElementById("settingsFooterHeight");
    if (footerHeightInput) {
      footerHeightInput.addEventListener("input", (e) => {
        const value = parseFloat(e.target.value);
        if (!isNaN(value)) {
          this._lastFooterHeight = value;
          this.pageSettings.headerFooter.footerHeight = value;
        }
      });
    }

    // === Header/Footer Enable/Disable Listeners ===
    const headerEnabledInput = document.getElementById("settingsHeaderEnabled");
    if (headerEnabledInput) {
      headerEnabledInput.addEventListener("change", (e) => {
        this.pageSettings.headerFooter.headerEnabled = e.target.checked;
      });
    }

    const footerEnabledInput = document.getElementById("settingsFooterEnabled");
    if (footerEnabledInput) {
      footerEnabledInput.addEventListener("change", (e) => {
        this.pageSettings.headerFooter.footerEnabled = e.target.checked;
      });
    }

    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("position-option")) {
        const selectedPosition = e.target.getAttribute("data-position");
        const parent = e.target.parentElement;

        // Update visuals - only for position grids (page numbers)
        if (parent.classList.contains("position-grid")) {
          parent.querySelectorAll(".position-option").forEach((opt) => opt.classList.remove("selected"));
          e.target.classList.add("selected");

          // 🧠 Persist selected position
          if (!this.pageSettings.pageNumber) {
            this.pageSettings.pageNumber = {};
          }
          this.pageSettings.pageNumber.position = selectedPosition;
          console.log("📍 Page number position clicked and stored:", selectedPosition);
        }
      }

      if (e.target.classList.contains("watermark-type-btn")) {
        const selectedType = e.target.getAttribute("data-type");
        document.querySelectorAll(".watermark-type-btn").forEach((btn) => btn.classList.remove("active"));
        e.target.classList.add("active");

        // Toggle type-specific controls
        const textControls = document.getElementById("settingsWatermarkTextControls");
        const imageControls = document.getElementById("settingsWatermarkImageControls");

        if (textControls) textControls.style.display = selectedType === "text" || selectedType === "both" ? "block" : "none";
        if (imageControls) imageControls.style.display = selectedType === "image" || selectedType === "both" ? "block" : "none";
      }

      if (e.target.id === "settingsBackgroundColorPreview") {
        const colorInput = document.getElementById("settingsPageBackgroundColor");
        if (colorInput) {
          colorInput.click();
        }
      }
    });

    document.addEventListener("change", (e) => {
      if (e.target.id === "settingsPageBackgroundColor") {
        const preview = document.getElementById("settingsBackgroundColorPreview");
        if (preview) {
          preview.style.backgroundColor = e.target.value;
        }
      }

      if (e.target.id === "settingsWatermarkEnabled") {
        const controls = document.getElementById("settingsWatermarkControls");
        if (controls) {
          if (e.target.checked) {
            controls.classList.add("active");
          } else {
            controls.classList.remove("active");
          }
        }
      }

      if (e.target.id === "settingsPageFormat") {
        const customSection = document.getElementById("settingsCustomSizeSection");
        if (customSection) {
          if (e.target.value === "custom") {
            customSection.classList.add("active");
          } else {
            customSection.classList.remove("active");
          }
        }
        this.updateFormatPreview();
      }

      if (
        e.target.id === "settingsPageOrientation" ||
        e.target.id === "settingsCustomWidth" ||
        e.target.id === "settingsCustomHeight"
      ) {
        this.updateFormatPreview();
      }
    });

    // === Watermark Image File Upload ===
    const watermarkFileInput = document.getElementById("settingsWatermarkImageFile");
    if (watermarkFileInput) {
      watermarkFileInput.addEventListener("change", (e) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result;
            if (!this.pageSettings.watermark) {
              this.pageSettings.watermark = {};
            }
            if (!this.pageSettings.watermark.image) {
              this.pageSettings.watermark.image = {};
            }

            this.pageSettings.watermark.image.url = base64;

            // Optionally reflect the value in the URL input
            const urlInput = document.getElementById("settingsWatermarkImageUrl");
            if (urlInput) {
              urlInput.value = base64;
            }

            console.log("📸 Local image converted to base64 and stored in settings");
          };
          reader.readAsDataURL(file);
        }
      });
    }


    const deletePagesBtn = document.getElementById("deletePages");
    if (deletePagesBtn) {
      deletePagesBtn.addEventListener("click", () => {
        this.editor.Modal.close();
        setTimeout(() => {
          this.showPageDeleteModal();
        }, 100);
      });
    }

    const applyBtn = document.getElementById("applyPageElementsSettings");
    if (applyBtn) {
      applyBtn.addEventListener("click", () => {
        this.applyPageElementsSettings();
      });
    }

    const resetBtn = document.getElementById("resetPageElementsSettings");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        this.resetPageElementsSettings();
      });
    }

    const formatChangeBtn = document.getElementById("applyFormatChange");
    if (formatChangeBtn) {
      formatChangeBtn.addEventListener("click", () => {
        this.applyFormatAndOrientationChange();
      });
    }
  }


  applyPageElementsSettings() {
    try {
      this.preserveAllContent();

      // Get all form values
      const marginTop = Math.max(0, parseFloat(document.getElementById("settingsMarginTop")?.value) || 0);
      const marginBottom = Math.max(0, parseFloat(document.getElementById("settingsMarginBottom")?.value) || 0);
      const marginLeft = Math.max(0, parseFloat(document.getElementById("settingsMarginLeft")?.value) || 0);
      const marginRight = Math.max(0, parseFloat(document.getElementById("settingsMarginRight")?.value) || 0);
      const newBackgroundColor = document.getElementById("settingsPageBackgroundColor")?.value || "#ffffff";

      // Header settings
      const headerEnabled = document.getElementById("settingsHeaderEnabled")?.checked !== false;
      const headerHeight = Math.max(5, Math.min(50, parseFloat(document.getElementById("settingsHeaderHeight")?.value) || 12.7));
      const headerApplyMode = document.getElementById("headerApplyMode")?.value || "all";
      const headerCustomPageList = document.getElementById("headerCustomPageList")?.value || "";
      const headerText = document.getElementById("settingsHeaderText")?.value || "";

      // Footer settings
      const footerEnabled = document.getElementById("settingsFooterEnabled")?.checked !== false;
      const footerHeight = Math.max(5, Math.min(50, parseFloat(document.getElementById("settingsFooterHeight")?.value) || 12.7));
      const footerApplyMode = document.getElementById("footerApplyMode")?.value || "all";
      const footerCustomPageList = document.getElementById("footerCustomPageList")?.value || "";
      const footerText = document.getElementById("settingsFooterText")?.value || "";

      // Page Number and Watermark settings
      const pageNumberEnabled = document.getElementById("pageNumberEnabled")?.checked || false;
      const pageNumberStartFrom = parseInt(document.getElementById("pageNumberStartFrom")?.value || "1", 10);
      const pageNumberFormat = document.getElementById("pageNumberFormat")?.value || "Page {n}";
      const pageNumberPosition = document.querySelector(".position-option.selected")?.dataset?.position || "bottom-center";
      const storedPageNumber = this.pageSettings.pageNumber || {};
      const pageNumberFontSize = storedPageNumber.fontSize || parseInt(document.getElementById("pageNumberFontSize")?.value || "11", 10);
      const pageNumberColor = storedPageNumber.color || document.getElementById("pageNumberColor")?.value || "#333333";
      const pageNumberBackgroundColor = storedPageNumber.backgroundColor || document.getElementById("pageNumberBackgroundColor")?.value || "#ffffff";
      const pageNumberShowBorder = storedPageNumber.showBorder !== undefined ? storedPageNumber.showBorder : (document.getElementById("pageNumberShowBorder")?.checked || false);

      const watermarkEnabled = document.getElementById("settingsWatermarkEnabled")?.checked || false;
      const watermarkType = document.querySelector(".watermark-type-btn.active")?.dataset?.type || "text";
      const watermarkTextContent = document.getElementById("settingsWatermarkText")?.value || "CONFIDENTIAL";
      const watermarkFontSize = parseInt(document.getElementById("settingsWatermarkFontSize")?.value) || 36;
      const watermarkColor = document.getElementById("settingsWatermarkColor")?.value || "#000000";
      const watermarkOpacity = parseInt(document.getElementById("settingsWatermarkOpacity")?.value) / 100 || 0.4;
      const watermarkRotation = parseInt(document.getElementById("settingsWatermarkRotation")?.value) || 0;
      const watermarkImageUrl = document.getElementById("settingsWatermarkImageUrl")?.value || "";
      const watermarkImageWidth = parseInt(document.getElementById("settingsWatermarkImageWidth")?.value) || 200;
      const watermarkImageHeight = parseInt(document.getElementById("settingsWatermarkImageHeight")?.value) || 200;
      const watermarkPosition = document.querySelector(".watermark-position-option.selected")?.dataset?.position || "center";

      // Parse custom page lists
      const headerCustomPages = this.parsePageList(headerCustomPageList);
      const footerCustomPages = this.parsePageList(footerCustomPageList);

      console.log("📋 Custom page lists parsed:", {
        headerPages: headerCustomPages,
        footerPages: footerCustomPages,
        headerMode: headerApplyMode,
        footerMode: footerApplyMode
      });

      // Store settings for persistence
      this._lastHeaderApplyMode = headerApplyMode;
      this._lastFooterApplyMode = footerApplyMode;
      this._lastHeaderCustomPageList = headerCustomPageList;
      this._lastFooterCustomPageList = footerCustomPageList;
      this._lastHeaderCustomPages = headerCustomPages;
      this._lastFooterCustomPages = footerCustomPages;

      // Update global page settings
      this.pageSettings.headerFooter = {
        headerEnabled: headerEnabled,
        footerEnabled: footerEnabled,
        headerHeight,
        footerHeight,
        headerText,
        footerText,
        headerApplyMode,
        footerApplyMode,
        headerCustomPages,
        footerCustomPages
      };

      this.pageSettings.margins = { top: marginTop, bottom: marginBottom, left: marginLeft, right: marginRight };
      this.pageSettings.backgroundColor = newBackgroundColor;

      // Store Page Number and Watermark Settings
      this.pageSettings.pageNumber = {
        enabled: pageNumberEnabled,
        startFrom: pageNumberStartFrom,
        format: pageNumberFormat,
        position: pageNumberPosition,
        fontSize: pageNumberFontSize,
        fontFamily: storedPageNumber.fontFamily || "Arial",
        color: pageNumberColor,
        backgroundColor: pageNumberBackgroundColor,
        showBorder: pageNumberShowBorder,
        visibility: storedPageNumber.visibility || "all",
      };
const watermarkTiled = document.getElementById("settingsWatermarkTiled")?.checked || false;
      this.pageSettings.watermark = {
        enabled: watermarkEnabled,
        type: watermarkType,
        position: watermarkPosition,
        tiled: watermarkTiled,
        text: {
          content: watermarkTextContent,
          fontSize: watermarkFontSize,
          color: watermarkColor,
          opacity: watermarkOpacity,
          rotation: watermarkRotation
        },
        image: {
          url: watermarkImageUrl,
          width: watermarkImageWidth,
          height: watermarkImageHeight
        }
      };

      // ✅ UPDATE INDIVIDUAL PAGE SETTINGS BEFORE SETUP
      this.updateIndividualPageSettings();

      console.log("✅ Custom mode settings applied:", {
        headerMode: headerApplyMode,
        footerMode: footerApplyMode,
        headerCustomPages,
        footerCustomPages,
        pageNumbers: pageNumberEnabled,
        watermark: watermarkEnabled
      });

      // Apply background color and recreate pages
      this.applyBackgroundColorToPages(newBackgroundColor);
      this.preserveContentForModeSwitch();
      this.setupEditorPages();

      // Restore content and update visuals
      setTimeout(() => {
        this.restoreAllContent();
        this.restoreContentAfterModeSwitch();
        this.updateAllPageVisuals();

        // Apply conditional content clearing based on custom settings
        setTimeout(() => {
          this.applyConditionalHeaderFooterContent();
          this.resetTextChangeFlags();
          console.log("🗑️ Custom mode setup complete");
        }, 300);
      }, 250);

      this.editor.Modal.close();
      console.log("✅ Custom header/footer settings applied successfully");

    } catch (err) {
      console.error("❌ Error in applyPageElementsSettings:", err);
      alert("Failed to apply settings.");
    }
  }

  populatePageSettingsForm() {
    const watermark = this.pageSettings?.watermark || {};
    const watermarkImage = watermark.image || {};
    const watermarkText = watermark.text || {};

    // Restore watermark toggle
    document.getElementById("settingsWatermarkEnabled").checked = watermark.enabled || false;
    document.getElementById("settingsWatermarkTiled").checked = watermark.tiled || false;

    // Restore watermark type buttons (image / text)
    document.querySelectorAll(".watermark-type-btn").forEach(btn => {
      btn.classList.remove("active");
      if (btn.dataset.type === watermark.type) {
        btn.classList.add("active");
      }
    });

    // Restore image URL and dimensions
    document.getElementById("settingsWatermarkImageUrl").value = watermarkImage.url || "";
    document.getElementById("settingsWatermarkImageWidth").value = watermarkImage.width || 200;
    document.getElementById("settingsWatermarkImageHeight").value = watermarkImage.height || 200;

    // Restore watermark text
    document.getElementById("settingsWatermarkText").value = watermarkText.content || "CONFIDENTIAL";
    document.getElementById("settingsWatermarkFontSize").value = watermarkText.fontSize || 36;
    document.getElementById("settingsWatermarkColor").value = watermarkText.color || "#000000";
    document.getElementById("settingsWatermarkOpacity").value = Math.round((watermarkText.opacity || 0.4) * 100);
    document.getElementById("settingsWatermarkRotation").value = watermarkText.rotation || 0;

    // Restore watermark position
    document.querySelectorAll(".watermark-position-option").forEach(btn => {
      btn.classList.remove("selected");
      if (btn.dataset.position === watermark.position) {
        btn.classList.add("selected");
      }
    });

    // Optionally update image preview (if you added one)
    const preview = document.getElementById("settingsWatermarkPreview");
    if (preview && watermarkImage.url) {
      preview.src = watermarkImage.url;
      preview.style.display = "block";
    }
  }


  applyConditionalHeaderFooterContent() {
    try {
      console.log("🧹 Applying conditional header/footer content based on page settings...");
      const allPageComponents = this.editor.getWrapper().find(".page-container");

      allPageComponents.forEach((pageComponent, index) => {
        const pageSettings = this.pageSettings.pages[index];
        if (!pageSettings) {
          console.warn(`⚠️ No settings found for page ${index + 1}`);
          return;
        }

        const pageNumber = index + 1;

        // Handle header content
        const headerRegion = pageComponent.find('[data-shared-region="header"]')[0];
        if (headerRegion) {
          const headerElement = headerRegion.find('.page-header-element')[0];
          if (headerElement) {
            const shouldShowHeaderContent = pageSettings.header?.shouldShowContent !== false;

            if (!shouldShowHeaderContent) {
              // Clear only the content inside the header element, keep the header structure
              headerElement.components().reset();
              console.log(`🧹 Cleared header content from page ${pageNumber} (structure remains)`);
            } else {
              console.log(`✅ Header content preserved on page ${pageNumber}`);
            }
          }
        }

        // Handle footer content
        const footerRegion = pageComponent.find('[data-shared-region="footer"]')[0];
        if (footerRegion) {
          const footerElement = footerRegion.find('.page-footer-element')[0];
          if (footerElement) {
            const shouldShowFooterContent = pageSettings.footer?.shouldShowContent !== false;

            if (!shouldShowFooterContent) {
              // Clear only the content inside the footer element, keep the footer structure
              footerElement.components().reset();
              console.log(`🧹 Cleared footer content from page ${pageNumber} (structure remains)`);
            } else {
              console.log(`✅ Footer content preserved on page ${pageNumber}`);
            }
          }
        }
      });

      console.log("✅ Conditional header/footer content clearing complete");
    } catch (error) {
      console.error("❌ Error applying conditional header/footer content:", error);
    }
  }

  parsePageList(pageListString) {
    if (!pageListString || pageListString.trim() === "") {
      return [];
    }

    const pages = [];
    const parts = pageListString.split(',');

    for (const part of parts) {
      const trimmedPart = part.trim();
      if (trimmedPart.includes('-')) {
        // Handle ranges like "5-7"
        const [start, end] = trimmedPart.split('-').map(num => parseInt(num.trim(), 10));
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) {
            if (!pages.includes(i)) {
              pages.push(i);
            }
          }
        }
      } else {
        // Handle single numbers
        const pageNum = parseInt(trimmedPart, 10);
        if (!isNaN(pageNum) && !pages.includes(pageNum)) {
          pages.push(pageNum);
        }
      }
    }

    return pages.sort((a, b) => a - b);
  }


  updateIndividualPageSettings() {
    try {
      const totalPages = this.pageSettings.pages.length;
      const headerApplyMode = this._lastHeaderApplyMode || "all";
      const footerApplyMode = this._lastFooterApplyMode || "all";
      const headerCustomPages = this._lastHeaderCustomPages || [];
      const footerCustomPages = this._lastFooterCustomPages || [];

      console.log("🔧 Updating individual page settings for", totalPages, "pages");
      console.log("Header mode:", headerApplyMode, "Custom pages:", headerCustomPages);
      console.log("Footer mode:", footerApplyMode, "Custom pages:", footerCustomPages);

      for (let i = 0; i < this.pageSettings.pages.length; i++) {
        const pageSettings = this.pageSettings.pages[i];
        const pageNumber = i + 1;
        const isFirstPage = pageNumber === 1;
        const isLastPage = pageNumber === this.pageSettings.numberOfPages;

        // Initialize if needed
        if (!pageSettings.header) pageSettings.header = {};
        if (!pageSettings.footer) pageSettings.footer = {};

        // Determine if this page should show header content
        let shouldShowHeaderContent = false;
        if (headerApplyMode === "all") {
          shouldShowHeaderContent = true;
        } else if (headerApplyMode === "first" && isFirstPage) {
          shouldShowHeaderContent = true;
        } else if (headerApplyMode === "last" && isLastPage) {
          shouldShowHeaderContent = true;
        } else if (headerApplyMode === "even" && pageNumber % 2 === 0) {
          shouldShowHeaderContent = true;
        } else if (headerApplyMode === "odd" && pageNumber % 2 !== 0) {
          shouldShowHeaderContent = true;
        } else if (headerApplyMode === "different") {
          shouldShowHeaderContent = true;
        } else if (headerApplyMode === "custom" && headerCustomPages.includes(pageNumber)) {
          shouldShowHeaderContent = true;
        }

        // Determine if this page should show footer content
        let shouldShowFooterContent = false;
        if (footerApplyMode === "all") {
          shouldShowFooterContent = true;
        } else if (footerApplyMode === "first" && isFirstPage) {
          shouldShowFooterContent = true;
        } else if (footerApplyMode === "last" && isLastPage) {
          shouldShowFooterContent = true;
        } else if (footerApplyMode === "even" && pageNumber % 2 === 0) {
          shouldShowFooterContent = true;
        } else if (footerApplyMode === "odd" && pageNumber % 2 !== 0) {
          shouldShowFooterContent = true;
        } else if (footerApplyMode === "different") {
          shouldShowFooterContent = true;
        } else if (footerApplyMode === "custom" && footerCustomPages.includes(pageNumber)) {
          shouldShowFooterContent = true;
        }

        // Store the decision
        pageSettings.header.shouldShowContent = shouldShowHeaderContent;
        pageSettings.footer.shouldShowContent = shouldShowFooterContent;

        console.log(`📄 Page ${pageNumber} settings:`, {
          headerMode: headerApplyMode,
          footerMode: footerApplyMode,
          showHeader: shouldShowHeaderContent,
          showFooter: shouldShowFooterContent,
          isFirst: isFirstPage,
          isLast: isLastPage
        });
      }

      console.log("✅ Individual page settings updated successfully");
    } catch (error) {
      console.error("❌ Error updating individual page settings:", error);
    }
  }

  applyBackgroundColorToPages(backgroundColor) {
    // Apply background color to all existing page components and their content areas
    const allPageComponents = this.editor.getWrapper().find(".page-container")

    allPageComponents.forEach((pageComponent) => {
      // Update page container background
      pageComponent.addStyle({
        background: backgroundColor,
        "background-color": backgroundColor,
      })

      // Update page content background
      const pageContentComponent = pageComponent.find(".page-content")[0]
      if (pageContentComponent) {
        pageContentComponent.addStyle({
          "background-color": backgroundColor,
        })
      }

      // Update header background if exists
      const headerComponent = pageComponent.find(".header-wrapper")[0]
      if (headerComponent) {
        headerComponent.addStyle({
          "background-color": backgroundColor,
        })

        const headerElement = headerComponent.find(".page-header-element")[0]
        if (headerElement) {
          headerElement.addStyle({
            background: backgroundColor,
            "background-color": backgroundColor,
          })
        }
      }

      // Update footer background if exists
      const footerComponent = pageComponent.find(".footer-wrapper")[0]
      if (footerComponent) {
        footerComponent.addStyle({
          "background-color": backgroundColor,
        })

        const footerElement = footerComponent.find(".page-footer-element")[0]
        if (footerElement) {
          footerElement.addStyle({
            background: backgroundColor,
            "background-color": backgroundColor,
          })
        }
      }
    })
  }

  resetPageElementsSettings() {
    // Preserve all content before reset
    this.preserveAllContent()

    this.pageSettings.margins = {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    }

    this.pageSettings.backgroundColor = "#ffffff"
    this.pageSettings.headerFooter = {
      headerEnabled: true,
      footerEnabled: true,
      headerHeight: 12.7,
      footerHeight: 12.7,
    }

    this.pageSettings.pageNumbering = {
      enabled: false,
      startFromPage: 1,
      excludedPages: [],
    }

    this.pageSettings.watermark = {
      enabled: true,
      type: "text",
      text: {
        content: "CONFIDENTIAL",
        font: "Arial",
        fontSize: 60,
        color: "red",
        opacity: 0.2,
        rotation: -30,
      },
      image: {
        url: "",
        width: 100,
        height: 100,
        opacity: 0.3,
      },
      position: "center",
      applyToAllPages: true,
      tiled: false,
    }


    this.pageSettings.pages.forEach((page) => {
      page.backgroundColor = "#ffffff"
      page.header = {
        enabled: true,
        content: "",
        height: 12.7,
        padding: 10,
        fontSize: 12,
        color: "#333333",
        backgroundColor: "#ffffff",
        position: "center",
      }
      page.footer = {
        enabled: true,
        content: "",
        height: 12.7,
        padding: 10,
        fontSize: 12,
        color: "#333333",
        backgroundColor: "#ffffff",
        position: "center",
      }
      page.pageNumber = {
        enabled: false,
        format: "Page {n}",
        position: "bottom-right",
        fontSize: 11,
        color: "#333333",
        backgroundColor: "#ffffff",
        showBorder: true,
      }
    })

    this.setupEditorPages()

    setTimeout(() => {
      this.restoreAllContent()
      this.updateAllPageVisuals()
    }, 300)

    this.editor.Modal.close()

    console.log("Page elements settings reset")
  }

  // FIXED: Enhanced setupEditorPages method that properly creates headers/footers
 setupEditorPages() {
    try {
      // Clear any existing observers before creating new pages
      this.clearAllObservers();

      const mmToPx = 96 / 25.4
      const totalPageWidth = Math.round(this.pageSettings.width * mmToPx)
      const totalPageHeight = Math.round(this.pageSettings.height * mmToPx)

      const marginTopPx = Math.round(this.pageSettings.margins.top * mmToPx)
      const marginBottomPx = Math.round(this.pageSettings.margins.bottom * mmToPx)
      const marginLeftPx = Math.round(this.pageSettings.margins.left * mmToPx)
      const marginRightPx = Math.round(this.pageSettings.margins.right * mmToPx)

      const contentWidth = totalPageWidth - marginLeftPx - marginRightPx
      const contentHeight = totalPageHeight - marginTopPx - marginBottomPx

      const defaultHeaderHeight = Math.round((this.pageSettings.headerFooter?.headerHeight || 12.7) * mmToPx)
      const defaultFooterHeight = Math.round((this.pageSettings.headerFooter?.footerHeight || 12.7) * mmToPx)
      const mainContentAreaHeight = contentHeight - defaultHeaderHeight - defaultFooterHeight

      // Clear existing pages
      this.editor.getWrapper().components().reset()

      for (let i = 0; i < this.pageSettings.numberOfPages; i++) {
        const pageData = this.pageSettings.pages[i]
        const pageNumber = i + 1
        const isEvenPage = pageNumber % 2 === 0
        const isOddPage = pageNumber % 2 !== 0
        const isFirstPage = pageNumber === 1
        const isLastPage = pageNumber === this.pageSettings.numberOfPages

        // Determine header/footer regions (keeping your existing logic)
        const headerApplyMode = this._lastHeaderApplyMode || "all"
        const footerApplyMode = this._lastFooterApplyMode || "all"

        let headerRegionType = ""
        let footerRegionType = ""
        let headerLabel = ""
        let footerLabel = ""

        // Header logic - ALWAYS set a region type for structure
        if (headerApplyMode === "all") {
          headerRegionType = "header"
          headerLabel = "Header (Shared across all pages)"
        } else if (headerApplyMode === "first") {
          headerRegionType = isFirstPage ? "header-first" : "header-empty"
          headerLabel = isFirstPage ? "First Page Header" : "Header (Hidden - First Page Only)"
        } else if (headerApplyMode === "last") {
          headerRegionType = isLastPage ? "header-last" : "header-empty"
          headerLabel = isLastPage ? "Last Page Header" : "Header (Hidden - Last Page Only)"
        } else if (headerApplyMode === "even") {
          headerRegionType = isEvenPage ? "header-even" : "header-empty"
          headerLabel = isEvenPage ? "Even Page Header (Pages 2, 4, 6...)" : "Header (Hidden - Even Pages Only)"
        } else if (headerApplyMode === "odd") {
          headerRegionType = isOddPage ? "header-odd" : "header-empty"
          headerLabel = isOddPage ? "Odd Page Header (Pages 1, 3, 5...)" : "Header (Hidden - Odd Pages Only)"
        } else if (headerApplyMode === "different") {
          headerRegionType = isEvenPage ? "header-even" : "header-odd"
          headerLabel = isEvenPage ? "Even Page Header" : "Odd Page Header"
        } else if (headerApplyMode === "custom") {
          const headerCustomPages = this._lastHeaderCustomPages || [];
          const pageIsInCustomList = headerCustomPages.includes(pageNumber);
          headerRegionType = pageIsInCustomList ? "header" : "header-empty"
          headerLabel = pageIsInCustomList ? `Custom Header (Page ${pageNumber})` : "Header (Hidden - Custom Range)"
        }

        // Footer logic - ALWAYS set a region type for structure  
        if (footerApplyMode === "all") {
          footerRegionType = "footer"
          footerLabel = "Footer (Shared across all pages)"
        } else if (footerApplyMode === "first") {
          footerRegionType = isFirstPage ? "footer-first" : "footer-empty"
          footerLabel = isFirstPage ? "First Page Footer" : "Footer (Hidden - First Page Only)"
        } else if (footerApplyMode === "last") {
          footerRegionType = isLastPage ? "footer-last" : "footer-empty"
          footerLabel = isLastPage ? "Last Page Footer" : "Footer (Hidden - Last Page Only)"
        } else if (footerApplyMode === "even") {
          footerRegionType = isEvenPage ? "footer-even" : "footer-empty"
          footerLabel = isEvenPage ? "Even Page Footer (Pages 2, 4, 6...)" : "Footer (Hidden - Even Pages Only)"
        } else if (footerApplyMode === "odd") {
          footerRegionType = isOddPage ? "footer-odd" : "footer-empty"
          footerLabel = isOddPage ? "Odd Page Footer (Pages 1, 3, 5...)" : "Footer (Hidden - Odd Pages Only)"
        } else if (footerApplyMode === "different") {
          footerRegionType = isEvenPage ? "footer-even" : "footer-odd"
          footerLabel = isEvenPage ? "Even Page Footer" : "Odd Page Footer"
        } else if (footerApplyMode === "custom") {
          const footerCustomPages = this._lastFooterCustomPages || [];
          const pageIsInCustomList = footerCustomPages.includes(pageNumber);
          footerRegionType = pageIsInCustomList ? "footer" : "footer-empty"
          footerLabel = pageIsInCustomList ? `Custom Footer (Page ${pageNumber})` : "Footer (Hidden - Custom Range)"
        }

        // Create page structure - ALWAYS include header and footer wrappers
        let pageHTML = `
        <div class="page-container" data-page-id="${pageData.id}" data-page-index="${i}">
          <div class="page-content" style="
            width: ${contentWidth}px; 
            height: ${contentHeight}px; 
            margin: ${marginTopPx}px ${marginRightPx}px ${marginBottomPx}px ${marginLeftPx}px;
            position: relative;
            overflow: hidden;
            background-color: ${pageData.backgroundColor || this.pageSettings.backgroundColor};
            display: flex;
            flex-direction: column;
          ">
            <div class="header-wrapper" data-shared-region="${headerRegionType}" style="
              width: 100%;
              height: ${defaultHeaderHeight}px;
              flex-shrink: 0;
            ">
              <div class="page-header-element" style="
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                border: 2px dashed transparent;
                transition: border-color 0.2s ease;
              "></div>
            </div>
            <div class="content-wrapper" style="
              flex: 1;
              display: flex;
              flex-direction: column;
              height: ${mainContentAreaHeight}px;
            ">
              <div class="main-content-area" style="
                width: 100%;
                height: 100%;
                border: 2px dashed transparent;
                transition: border-color 0.2s ease;
                overflow: hidden;
                position: relative;
              "></div>
            </div>
            <div class="footer-wrapper" data-shared-region="${footerRegionType}" style="
              width: 100%;
              height: ${defaultFooterHeight}px;
              flex-shrink: 0;
            ">
              <div class="page-footer-element" style="
                width: 100%;
                height: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                border: 2px dashed transparent;
                transition: border-color 0.2s ease;
              "></div>
            </div>
          </div>
        </div>`

        // Create the page component
        const pageComponent = this.editor.getWrapper().append(pageHTML)[0]

        // Style the page container
        pageComponent.addStyle({
          width: `${totalPageWidth}px`,
          height: `${totalPageHeight}px`,
          background: pageData.backgroundColor || this.pageSettings.backgroundColor,
          margin: "20px auto",
          "box-shadow": "0 4px 12px rgba(0, 0, 0, 0.15)",
          border: "2px solid transparent",
          position: "relative",
          "page-break-after": "always",
          overflow: "hidden",
          "box-sizing": "border-box",
          transition: "border-color 0.2s ease",
          "-webkit-print-color-adjust": "exact",
          "color-adjust": "exact",
          "print-color-adjust": "exact",
        })

        // Configure components with proper settings
        const pageContentComponent = pageComponent.find(".page-content")[0]
        if (pageContentComponent) {
          pageContentComponent.addStyle({
            overflow: "hidden",
            position: "relative",
            "box-sizing": "border-box",
            display: "flex",
            "flex-direction": "column",
            height: `${contentHeight}px`,
            width: `${contentWidth}px`,
            "background-color": pageData.backgroundColor || this.pageSettings.backgroundColor,
            border: "1px dashed #dee2e6",
            "-webkit-print-color-adjust": "exact",
            "color-adjust": "exact",
            "print-color-adjust": "exact",
          })
        }

        // Configure header component properties
        const headerElement = pageComponent.find(".page-header-element")[0]
        if (headerElement) {
          headerElement.set({
            droppable: true,
            editable: true,
            selectable: true,
            draggable: false,
            copyable: false,
            removable: false,
            "custom-name": headerLabel
          })
        }

        // Configure main content area
        const mainContentArea = pageComponent.find(".main-content-area")[0]
        if (mainContentArea) {
          mainContentArea.set({
            droppable: true,
            editable: true,
            selectable: true,
            "custom-name": "Content Area"
          })
        }

        // Configure footer component properties
        const footerElement = pageComponent.find(".page-footer-element")[0]
        if (footerElement) {
          footerElement.set({
            droppable: true,
            editable: true,
            selectable: true,
            draggable: false,
            copyable: false,
            removable: false,
            "custom-name": footerLabel
          })
        }

        // FIXED: Setup observer with proper debouncing
        this.setupPageObserver(i);
      }

      // ADD THIS LINE: Setup the sections container listener
      this.setupSectionsContainerListener();

      this.setupCanvasScrolling()

      // Restore content after structure is ready
      setTimeout(() => {
        this.restoreAllContent()
        this.startContentMonitoring();

        // ADD THIS LINE:
        this.renderPageNumbers();

        console.log("✅ Word-style page setup complete")
        console.log("✅ Content monitoring started");
      }, 100)

    } catch (error) {
      console.error("❌ Error setting up Word-style editor pages:", error)
    }
  }

  setupSectionsContainerListener() {
    // ONLY the "Dynamic Header Footer" block should trigger sections-container
    const sectionsRequiredBlocks = [
      "Dynamic Header Footer"
    ];

    // These are regular content blocks that should NOT trigger sections
    const regularContentBlocks = [
      "column1",
      "column2",
      "column3",
      "column3-7",
      "text",
      "separator",
      "link",
      "image",
      "video",
      "videoIn",
      "map"
    ];

    console.log("🎧 Setting up sections container listeners...");
    console.log("📝 Sections will only be added for: Dynamic Header Footer");
    console.log("📝 Regular content blocks (text, image, etc.) will NOT trigger sections");

    // Clear any existing listeners to prevent duplicates
    this.editor.off('component:add.sections');
    this.editor.off('component:create.sections');
    this.editor.off('block:drag:start.sections');
    this.editor.off('block:drag:stop.sections');

    // Method to check if a component or block needs sections (ONLY Dynamic Header Footer)
    const requiresSections = (component) => {
      if (!component) return false;

      // Check various properties that might contain the block identifier
      const blockType = component.get ? component.get('type') : component.type;
      const customName = component.get ? component.get('custom-name') : component['custom-name'];
      const tagName = component.get ? component.get('tagName') : component.tagName;
      const className = component.get ? component.get('attributes')?.class : component.attributes?.class;
      const blockId = component.getId ? component.getId() : component.id;

      console.log(`🔍 Checking component:`, {
        blockType,
        customName,
        tagName,
        className,
        blockId
      });

      // ONLY check for "Dynamic Header Footer" - ignore all other blocks
      const matches = sectionsRequiredBlocks.some(block => {
        return (
          blockType === block ||
          customName === block ||
          tagName === block ||
          (className && className.includes(block)) ||
          (blockId && blockId.includes(block)) ||
          // Check for partial matches (case insensitive)
          (blockType && blockType.toLowerCase().includes(block.toLowerCase())) ||
          (customName && customName.toLowerCase().includes(block.toLowerCase()))
        );
      });

      console.log(`🎯 Component matches "Dynamic Header Footer": ${matches}`);
      return matches;
    };

    // Listen to BlockManager events (when blocks are dragged from the panel)
    this.editor.BlockManager.getAll().models.forEach(block => {
      const blockId = block.get('id');
      if (sectionsRequiredBlocks.includes(blockId)) {
        console.log(`📦 Monitoring block for sections: ${blockId}`);
      } else if (regularContentBlocks.includes(blockId)) {
        console.log(`📄 Regular content block (no sections): ${blockId}`);
      }
    });

    // Listen for block drag start
    this.editor.on('block:drag:start.sections', (block) => {
      const blockId = block.get('id');
      console.log(`🎪 Block drag started: ${blockId}`);

      if (sectionsRequiredBlocks.includes(blockId)) {
        console.log(`🎯 Dragging "Dynamic Header Footer" block: ${blockId}`);
        // Set a flag that we're dragging a required block
        this._isDraggingRequiredBlock = true;
        this._draggedBlockId = blockId;
      } else {
        console.log(`📄 Dragging regular content block: ${blockId} (no sections needed)`);
        this._isDraggingRequiredBlock = false;
      }
    });

    // Listen for block drag stop
    this.editor.on('block:drag:stop.sections', (block) => {
      const blockId = block.get('id');
      console.log(`🎪 Block drag stopped: ${blockId}`);

      if (this._isDraggingRequiredBlock && sectionsRequiredBlocks.includes(blockId)) {
        console.log(`🎯 "Dynamic Header Footer" block dropped: ${blockId} - adding sections to all pages`);
        setTimeout(() => {
          this.addSectionsContainerToAllPages();
          this._isDraggingRequiredBlock = false;
          this._draggedBlockId = null;
        }, 300);
      } else {
        console.log(`📄 Regular content block dropped: ${blockId} - no sections added`);
        this._isDraggingRequiredBlock = false;
        this._draggedBlockId = null;
      }
    });

    // Listen for component additions (backup detection)
    this.editor.on('component:add.sections', (component) => {
      console.log("➕ Component add event triggered");

      // Additional check for components that might be created from blocks
      const parent = component.parent();
      const isInMainContent = parent && (
        parent.getEl().classList.contains('main-content-area') ||
        parent.find('.main-content-area').length > 0
      );

      if (isInMainContent && requiresSections(component)) {
        console.log(`🎯 Added component in main content requires sections`);
        setTimeout(() => {
          this.addSectionsContainerToAllPages();
        }, 200);
      }
    });

    // Listen for canvas changes (alternative detection method)
    this.editor.on('canvas:drop.sections', (dataTransfer, component) => {
      console.log("🎨 Canvas drop event triggered");

      if (requiresSections(component)) {
        console.log(`🎯 Canvas drop requires sections`);
        setTimeout(() => {
          this.addSectionsContainerToAllPages();
        }, 200);
      }
    });

    // Periodically check for required blocks (fallback method)
    this._sectionsCheckInterval = setInterval(() => {
      this.checkForRequiredBlocks();
    }, 3000);

    console.log("✅ All sections container listeners setup complete");
  }

  // Alternative method to periodically check and add sections if needed
  checkAndAddSections() {
    const sectionsRequiredBlocks = [
      "column1", "column2", "column3", "column3-7", "text",
      "separator", "Dynamic Header Footer", "link", "image",
      "video", "videoIn", "map"
    ];

    // Check all components in all pages
    const allPages = this.editor.getWrapper().find('.page-container');
    let foundRequiredBlock = false;

    allPages.forEach((pageComponent, pageIndex) => {
      const allComponents = pageComponent.find('*');

      allComponents.forEach((component) => {
        const blockType = component.get('type') || '';
        const customName = component.get('custom-name') || '';
        const tagName = component.get('tagName') || '';

        if (sectionsRequiredBlocks.some(block =>
          blockType.toLowerCase().includes(block.toLowerCase()) ||
          customName.toLowerCase().includes(block.toLowerCase()) ||
          tagName.toLowerCase().includes(block.toLowerCase())
        )) {
          foundRequiredBlock = true;
          console.log(`✅ Found required block "${blockType || customName || tagName}" on page ${pageIndex + 1}`);
        }
      });
    });

    if (foundRequiredBlock) {
      console.log("🎯 Required blocks found - ensuring all pages have sections");
      this.addSectionsContainerToAllPages();
    }
  }

  addSectionsContainerToAllPages() {
    try {
      console.log("🚀 Starting to add sections-container to all pages...");

      const wrapper = this.editor.getWrapper();
      const allPageComponents = wrapper.find('.page-container');

      console.log(`📊 Found ${allPageComponents.length} pages to process`);

      if (!allPageComponents || allPageComponents.length === 0) {
        console.error("❌ No page containers found!");
        return;
      }

      let pagesProcessed = 0;
      let pagesSkipped = 0;

      // Process each page
      for (let i = 0; i < allPageComponents.length; i++) {
        const pageComponent = allPageComponents[i];

        try {
          const pageIndex = pageComponent.getAttributes()['data-page-index'] || i;
          console.log(`🔄 Processing page ${parseInt(pageIndex) + 1}...`);

          const mainContentArea = pageComponent.find('.main-content-area')[0];

          if (!mainContentArea) {
            console.warn(`⚠️ No main-content-area found on page ${parseInt(pageIndex) + 1}`);
            continue;
          }

          // Check if sections-container already exists
          const existingSections = mainContentArea.find('.sections-container');

          if (existingSections && existingSections.length > 0) {
            console.log(`✅ Sections-container already exists on page ${parseInt(pageIndex) + 1}`);
            pagesSkipped++;
            continue;
          }

          console.log(`➕ Adding sections-container to page ${parseInt(pageIndex) + 1}`);

          // Create sections-container using GrapesJS components
          const sectionsComponent = mainContentArea.append([{
            tagName: 'div',
            classes: ['sections-container'],
            components: [
              {
                tagName: 'div',
                classes: ['section-header', 'gjs-editor-header'],
                attributes: { 'data-gjs-name': 'Header' }
              },
              {
                tagName: 'div',
                classes: ['section-content', 'gjs-editor-content'],
                attributes: { 'data-gjs-name': 'Content' }
              },
              {
                tagName: 'div',
                classes: ['section-footer', 'gjs-editor-footer'],
                attributes: { 'data-gjs-name': 'Footer' }
              }
            ],
            styles: {
              'width': '100%',
              'height': '100%',
              'display': 'flex',
              'flex-direction': 'column',
              'position': 'relative'
            }
          }])[0];

          if (sectionsComponent) {
            // Configure sections components
            sectionsComponent.set({
              droppable: true,
              editable: false,
              selectable: true,
              removable: false,
              "custom-name": "Sections Container"
            });

            // Configure individual sections
            setTimeout(() => {
              const sectionHeader = sectionsComponent.find(".section-header")[0];
              if (sectionHeader) {
                sectionHeader.setStyle({
                  'flex-shrink': '0',
                  'min-height': '50px',
                  'border': '1px dashed #dee2e6',
                  'margin-bottom': '10px',
                  'box-sizing': 'border-box'
                });
                sectionHeader.set({
                  droppable: true,
                  editable: true,
                  selectable: true,
                  "custom-name": "Section Header"
                });
              }

              const sectionContent = sectionsComponent.find(".section-content")[0];
              if (sectionContent) {
                sectionContent.setStyle({
                  'flex': '1',
                  'border': '1px dashed #dee2e6',
                  'margin-bottom': '10px',
                  'box-sizing': 'border-box',
                  'min-height': '100px'
                });
                sectionContent.set({
                  droppable: true,
                  editable: true,
                  selectable: true,
                  "custom-name": "Section Content"
                });
              }

              const sectionFooter = sectionsComponent.find(".section-footer")[0];
              if (sectionFooter) {
                sectionFooter.setStyle({
                  'flex-shrink': '0',
                  'min-height': '50px',
                  'border': '1px dashed #dee2e6',
                  'box-sizing': 'border-box'
                });
                sectionFooter.set({
                  droppable: true,
                  editable: true,
                  selectable: true,
                  "custom-name": "Section Footer"
                });
              }
            }, 100);

            pagesProcessed++;
            console.log(`✅ Successfully added sections-container to page ${parseInt(pageIndex) + 1}`);
          } else {
            console.error(`❌ Failed to create sections-container on page ${parseInt(pageIndex) + 1}`);
          }

        } catch (pageError) {
          console.error(`❌ Error processing page ${i + 1}:`, pageError);
        }
      }

      console.log(`🎉 Sections-container processing complete! ${pagesProcessed} added, ${pagesSkipped} skipped, ${allPageComponents.length} total pages`);

      // Trigger editor refresh
      this.editor.trigger('change:canvasOffset');

    } catch (error) {
      console.error("❌ Error in addSectionsContainerToAllPages:", error);
    }
  }

  checkForRequiredBlocks() {
    const sectionsRequiredBlocks = [
      "Dynamic Header Footer"
    ];

    const wrapper = this.editor.getWrapper();
    const allComponents = wrapper.find('*');

    let foundRequiredBlock = false;
    let hasAllPagesWithSections = true;

    // Check if we have "Dynamic Header Footer" blocks ONLY
    allComponents.forEach(component => {
      const blockType = component.get('type') || '';
      const customName = component.get('custom-name') || '';
      const tagName = component.get('tagName') || '';

      if (sectionsRequiredBlocks.some(block =>
        blockType === block ||
        customName === block ||
        tagName === block ||
        blockType.toLowerCase().includes(block.toLowerCase()) ||
        customName.toLowerCase().includes(block.toLowerCase())
      )) {
        foundRequiredBlock = true;
      }
    });

    // Check if all pages have sections-container
    const allPages = wrapper.find('.page-container');
    allPages.forEach(pageComponent => {
      const mainContentArea = pageComponent.find('.main-content-area')[0];
      if (mainContentArea) {
        const existingSections = mainContentArea.find('.sections-container');
        if (!existingSections || existingSections.length === 0) {
          hasAllPagesWithSections = false;
        }
      }
    });

    // If we have "Dynamic Header Footer" blocks but not all pages have sections, add them
    if (foundRequiredBlock && !hasAllPagesWithSections) {
      console.log("🔄 Periodic check: Dynamic Header Footer found but missing sections on some pages");
      this.addSectionsContainerToAllPages();
    }
  }

  cleanupSectionsListener() {
    if (this._sectionsCheckInterval) {
      clearInterval(this._sectionsCheckInterval);
      this._sectionsCheckInterval = null;
    }

    this.editor.off('component:add.sections');
    this.editor.off('component:create.sections');
    this.editor.off('block:drag:start.sections');
    this.editor.off('block:drag:stop.sections');
    this.editor.off('canvas:drop.sections');
  }



  forceSectionsToAllPages() {
    console.log("🔧 Manually forcing sections to all pages...");
    this.addSectionsContainerToAllPages();
  }

  shouldHaveSectionsContainer() {
    const sectionsRequiredBlocks = [
      "column1", "column2", "column3", "column3-7", "text",
      "separator", "Dynamic Header Footer", "link", "image",
      "video", "videoIn", "map"
    ];

    // Check all components in all pages
    const allPages = this.editor.getWrapper().find('.page-container');

    for (let pageComponent of allPages) {
      const allComponents = pageComponent.find('*');

      for (let component of allComponents) {
        const blockType = component.get('type') || component.get('custom-name') || '';

        if (sectionsRequiredBlocks.includes(blockType) ||
          sectionsRequiredBlocks.some(block => blockType.toLowerCase().includes(block.toLowerCase()))) {
          return true;
        }
      }
    }

    return false;
  }

  setupCanvasScrolling() {
    const canvasContainer = this.editor.Canvas.getElement()
    if (canvasContainer) {
      canvasContainer.style.height = "calc(100vh - 120px)"
      canvasContainer.style.background = "#f0f0f0"
    }

    const rightPanel = document.querySelector(".gjs-pn-panels-right")
    if (rightPanel) {
      rightPanel.style.position = "fixed"
      rightPanel.style.right = "0"
      rightPanel.style.top = "0"
      rightPanel.style.height = "100vh"
      rightPanel.style.overflow = "auto"
      rightPanel.style.zIndex = "1000"
    }
  }

  // FIXED: Enhanced updateAllPageVisuals method that properly shows headers/footers
  updateAllPageVisuals() {
    this.pageSettings.pages.forEach((page, index) => {
      const canvasBody = this.editor.Canvas.getBody()
      const pageElement = canvasBody.querySelector(`[data-page-index="${index}"]`)
      if (pageElement) {
        this.updateSinglePageVisuals(pageElement, page, index)
        // FIXED: Use 'index' instead of 'i'
        this.setupPageObserver(index);
      }
    })
  }

  // FIXED: Enhanced updateSinglePageVisuals method that properly creates and displays headers/footers
 updateSinglePageVisuals(pageElement, pageSettings, pageIndex) {
    const allPages = this.editor.getWrapper().find('.page-container');
    const pageComponent = allPages.find(p => p.getAttributes()['data-page-id'] === pageSettings.id);
    if (!pageComponent) return;

    const pageContentComponent = pageComponent.find(".page-content")[0];
    if (!pageContentComponent) return;

    // ======================================================
    // ➕ Utility helpers for Apply Mode (NEW)
    // ======================================================
    const shouldApply = (mode, range, pageNum) => {
      if (mode === "all") return true;
      if (mode === "even") return pageNum % 2 === 0;
      if (mode === "odd") return pageNum % 2 !== 0;
      if (mode === "custom") return checkCustomRange(range, pageNum);
      return true;
    };

    const checkCustomRange = (range, pageNum) => {
      if (!range) return false;
      return range.split(",").some(part => {
        if (part.includes("-")) {
          const [start, end] = part.split("-").map(n => parseInt(n.trim(), 10));
          return pageNum >= start && pageNum <= end;
        } else {
          return parseInt(part.trim(), 10) === pageNum;
        }
      });
    };

    // ======================================================
    // Remove/Add page indicator (same as your code)
    // ======================================================
    const existingIndicator = pageElement.querySelector(".page-indicator");
    if (existingIndicator) existingIndicator.remove();

    const indicator = document.createElement("div");
    indicator.className = "page-indicator";
    indicator.textContent = `${pageSettings.name}`;
    pageElement.appendChild(indicator);

    // ======================================================
    // Dimensions
    // ======================================================
    const mmToPx = 96 / 25.4;
    const marginTopPx = Math.round(this.pageSettings.margins.top * mmToPx);
    const marginBottomPx = Math.round(this.pageSettings.margins.bottom * mmToPx);
    const marginLeftPx = Math.round(this.pageSettings.margins.left * mmToPx);
    const marginRightPx = Math.round(this.pageSettings.margins.right * mmToPx);

    const totalPageWidth = Math.round(this.pageSettings.width * mmToPx);
    const totalPageHeight = Math.round(this.pageSettings.height * mmToPx);
    const contentWidth = totalPageWidth - marginLeftPx - marginRightPx;
    const contentHeight = totalPageHeight - marginTopPx - marginBottomPx;

    const defaultHeaderHeight = Math.round((this.pageSettings.headerFooter?.headerHeight || 12.7) * mmToPx);
    const defaultFooterHeight = Math.round((this.pageSettings.headerFooter?.footerHeight || 12.7) * mmToPx);
    const mainContentHeight = contentHeight - defaultHeaderHeight - defaultFooterHeight;

    // ======================================================
    // Page content styles
    // ======================================================
    pageContentComponent.addStyle({
      display: "flex",
      "flex-direction": "column",
      height: `${contentHeight}px`,
      width: `${contentWidth}px`,
      position: "relative",
      "background-color": pageSettings.backgroundColor || this.pageSettings.backgroundColor,
      overflow: "hidden",
      "box-sizing": "border-box",
      "-webkit-print-color-adjust": "exact",
      "print-color-adjust": "exact",
      "color-adjust": "exact"
    });

    console.log(`📏 Page ${pageIndex + 1} - Headers/Footers structure always present:`);
    console.log(`    Header height: ${defaultHeaderHeight}px, Footer height: ${defaultFooterHeight}px`);

    // ======================================================
    // Header Wrapper
    // ======================================================
    const existingHeaderWrapper = pageComponent.find(".header-wrapper")[0];
    if (existingHeaderWrapper) {
      existingHeaderWrapper.addStyle({
        width: "100%",
        height: `${defaultHeaderHeight}px`,
        "flex-shrink": "0",
        direction: "ltr",
      });
      console.log(`✅ Updated header styles for page ${pageIndex + 1}`);
    }

    // ======================================================
    // Content Wrapper
    // ======================================================
    const existingContentWrapper = pageComponent.find(".content-wrapper")[0];
    if (existingContentWrapper) {
      existingContentWrapper.addStyle({
        "flex": "1",
        "display": "flex",
        "flex-direction": "column",
        "height": `${mainContentHeight}px`
      });

      const existingMainContentArea = existingContentWrapper.find(".main-content-area")[0];
      if (existingMainContentArea) {
        existingMainContentArea.addStyle({
          "width": "100%",
          "height": "100%",
          "overflow": "hidden",
          "position": "relative"
        });
      }
      console.log(`✅ Updated content area styles for page ${pageIndex + 1}`);
    }

    // ======================================================
    // Footer Wrapper
    // ======================================================
    const existingFooterWrapper = pageComponent.find(".footer-wrapper")[0];
    if (existingFooterWrapper) {
      existingFooterWrapper.addStyle({
        width: "100%",
        height: `${defaultFooterHeight}px`,
        "flex-shrink": "0"
      });
      console.log(`✅ Updated footer styles for page ${pageIndex + 1}`);
    }

    // ======================================================
    // 🔹 NEW: Apply Trait Logic for Section Header/Footer
    // ======================================================
    const headerComp = pageComponent.find('.section-header')[0];
    if (headerComp) {
      const mode = headerComp.getTrait('headerApplyMode')?.getValue() || "all";
      const range = headerComp.getTrait('headerCustomRange')?.getValue() || "";
      const apply = shouldApply(mode, range, pageIndex + 1);
      headerComp.getEl().style.display = apply ? "block" : "none";
    }

    const footerComp = pageComponent.find('.section-footer')[0];
    if (footerComp) {
      const mode = footerComp.getTrait('footerApplyMode')?.getValue() || "all";
      const range = footerComp.getTrait('footerCustomRange')?.getValue() || "";
      const apply = shouldApply(mode, range, pageIndex + 1);
      footerComp.getEl().style.display = apply ? "block" : "none";
    }

    // ======================================================
    // Sync logic (same as your code, untouched)
    // ======================================================
    setTimeout(() => {
      const headerApplyMode = this._lastHeaderApplyMode || "all";
      const footerApplyMode = this._lastFooterApplyMode || "all";
      const pageNumber = pageIndex + 1;
      const isFirstPage = pageNumber === 1;
      const isLastPage = pageNumber === this.pageSettings.numberOfPages;

      let shouldSyncHeaders = false;
      let shouldSyncFooters = false;

      if (headerApplyMode === "all") {
        shouldSyncHeaders = true;
      } else if (headerApplyMode === "first" && isFirstPage) {
        shouldSyncHeaders = true;
      } else if (headerApplyMode === "last" && isLastPage) {
        shouldSyncHeaders = true;
      } else if (headerApplyMode === "even" && pageNumber % 2 === 0) {
        shouldSyncHeaders = true;
      } else if (headerApplyMode === "odd" && pageNumber % 2 !== 0) {
        shouldSyncHeaders = true;
      } else if (headerApplyMode === "different") {
        shouldSyncHeaders = true;
      } else if (headerApplyMode === "custom") {
        const headerCustomPages = this._lastHeaderCustomPages || [];
        shouldSyncHeaders = headerCustomPages.includes(pageNumber);
      }

      if (footerApplyMode === "all") {
        shouldSyncFooters = true;
      } else if (footerApplyMode === "first" && isFirstPage) {
        shouldSyncFooters = true;
      } else if (footerApplyMode === "last" && isLastPage) {
        shouldSyncFooters = true;
      } else if (footerApplyMode === "even" && pageNumber % 2 === 0) {
        shouldSyncFooters = true;
      } else if (footerApplyMode === "odd" && pageNumber % 2 !== 0) {
        shouldSyncFooters = true;
      } else if (footerApplyMode === "different") {
        shouldSyncFooters = true;
      } else if (footerApplyMode === "custom") {
        const footerCustomPages = this._lastFooterCustomPages || [];
        shouldSyncFooters = footerCustomPages.includes(pageNumber);
      }

      const pageHasHeaderContent = pageSettings.header?.shouldShowContent !== false;
      const pageHasFooterContent = pageSettings.footer?.shouldShowContent !== false;

      console.log(`🔄 Sync check for page ${pageIndex + 1}:`);
      console.log(`    Header apply mode: ${headerApplyMode}, should sync: ${shouldSyncHeaders}`);
      console.log(`    Footer apply mode: ${footerApplyMode}, should sync: ${shouldSyncFooters}`);

      const header = pageComponent.find('[data-shared-region="header"]')[0];
      if (header) {
        if (shouldSyncHeaders && pageHasHeaderContent) {
          console.log(`🔄 Syncing header WITH CONTENT for page ${pageIndex + 1}`);
          this.syncSharedRegion("header", header);
        } else {
          console.log(`🔄 Syncing header WITH EMPTY CONTENT for page ${pageIndex + 1}`);
          header.setContent('');
        }
      }

      const footer = pageComponent.find('[data-shared-region="footer"]')[0];
      if (footer) {
        if (shouldSyncFooters && pageHasFooterContent) {
          console.log(`🔄 Syncing footer WITH CONTENT for page ${pageIndex + 1}`);
          this.syncSharedRegion("footer", footer);
        } else {
          console.log(`🔄 Syncing footer WITH EMPTY CONTENT for page ${pageIndex + 1}`);
          footer.setContent('');
        }
      }

      // ======================================================
      // Page Numbers (untouched)
      // ======================================================
      if (this.pageSettings.pageNumber?.enabled) {
        const visibility = this.pageSettings.pageNumber.visibility || "all";
        const startFromIndex = (this.pageSettings.pageNumber.startFrom || 1) - 1;

        const shouldShowPageNumber =
          visibility === "all" ||
          (visibility === "even" && (pageIndex + 1) % 2 === 0) ||
          (visibility === "odd" && (pageIndex + 1) % 2 !== 0);

        if (pageIndex >= startFromIndex && shouldShowPageNumber) {
          const totalPagesWithNumbers = this.editor
            .getWrapper()
            .find('.page-container')
            .filter((_, i) => {
              return (
                i >= startFromIndex &&
                (visibility === "all" ||
                  (visibility === "even" && (i + 1) % 2 === 0) ||
                  (visibility === "odd" && (i + 1) % 2 !== 0))
              );
            }).length;

          const currentNumber = pageIndex - startFromIndex + 1;
          const numberText = this.pageSettings.pageNumber.format
            .replace("{n}", String(currentNumber))
            .replace("{total}", String(totalPagesWithNumbers));

          const pageNumberDiv = document.createElement("div");
          pageNumberDiv.className = "page-number";
          pageNumberDiv.textContent = numberText;

          const styleMap = {
            position: "absolute",
            fontSize: `${this.pageSettings.pageNumber.fontSize || 12}px`,
            color: this.pageSettings.pageNumber.color || "#000",
            backgroundColor: this.pageSettings.pageNumber.backgroundColor || "#fff",
            padding: "4px 8px",
            borderRadius: "3px",
            border: this.pageSettings.pageNumber.showBorder ? "1px solid #dee2e6" : "none",
            zIndex: "99",
            fontFamily: this.pageSettings.pageNumber.fontFamily || "Arial"
          };

          const position = this.pageSettings.pageNumber.position || "bottom-center";

          if (position.includes("top")) {
            styleMap.top = "5px";
          } else {
            styleMap.bottom = "5px";
          }

          if (position.includes("left")) {
            styleMap.left = "10px";
          } else if (position.includes("right")) {
            styleMap.right = "10px";
          } else {
            styleMap.left = "50%";
            styleMap.transform = "translateX(-50%)";
          }

          Object.assign(pageNumberDiv.style, styleMap);
          pageElement.appendChild(pageNumberDiv);
          console.log(`🧾 Added page number on page ${pageIndex + 1}: ${numberText}`);
        }
      }
    }, 200);

    // ======================================================
    // Watermark (untouched)
    // ======================================================
    this.addWatermarkToPage(pageContentComponent, pageIndex);
  }

calculateTiledGrid(watermark) {
  // Get page dimensions in pixels (approximate conversion from mm to pixels at 96 DPI)
  const mmToPx = 3.78; // 1mm ≈ 3.78px at 96 DPI
  const pageWidthPx = this.pageSettings.width * mmToPx;
  const pageHeightPx = this.pageSettings.height * mmToPx;
  
  console.log(`📏 Page dimensions: ${pageWidthPx.toFixed(0)}px × ${pageHeightPx.toFixed(0)}px`);
  
  let tileWidth, tileHeight;
  
  if (watermark.type === "text" || watermark.type === "both") {
    // For text watermark, estimate dimensions based on font size and content
    const fontSize = watermark.text.fontSize || 48;
    const textContent = watermark.text.content || "CONFIDENTIAL";
    const rotation = Math.abs(watermark.text.rotation || 0);
    
    // Estimate text width (rough approximation: 0.6 * fontSize * character count)
    const estimatedTextWidth = fontSize * 0.6 * textContent.length;
    const estimatedTextHeight = fontSize * 1.2; // Line height factor
    
    // Account for rotation - use bounding box
    if (rotation !== 0) {
      const radians = (rotation * Math.PI) / 180;
      const cos = Math.abs(Math.cos(radians));
      const sin = Math.abs(Math.sin(radians));
      
      tileWidth = estimatedTextWidth * cos + estimatedTextHeight * sin;
      tileHeight = estimatedTextWidth * sin + estimatedTextHeight * cos;
    } else {
      tileWidth = estimatedTextWidth;
      tileHeight = estimatedTextHeight;
    }
    
    console.log(`📝 Text tile dimensions: ${tileWidth.toFixed(0)}px × ${tileHeight.toFixed(0)}px`);
  }
  
  if (watermark.type === "image" || watermark.type === "both") {
    // For image watermark, use specified dimensions
    const imageWidth = watermark.image.width || 200;
    const imageHeight = watermark.image.height || 200;
    
    if (watermark.type === "both") {
      // For both text and image, use the larger dimensions
      tileWidth = Math.max(tileWidth || 0, imageWidth);
      tileHeight = Math.max(tileHeight || 0, imageHeight);
    } else {
      tileWidth = imageWidth;
      tileHeight = imageHeight;
    }
    
    console.log(`🖼️ Image tile dimensions: ${imageWidth}px × ${imageHeight}px`);
  }
  
  // Add padding between tiles (20% of tile size)
  const paddingX = tileWidth * 0.2;
  const paddingY = tileHeight * 0.2;
  
  const effectiveTileWidth = tileWidth + paddingX;
  const effectiveTileHeight = tileHeight + paddingY;
  
  // Calculate grid dimensions
  const cols = Math.max(1, Math.floor(pageWidthPx / effectiveTileWidth));
  const rows = Math.max(1, Math.floor(pageHeightPx / effectiveTileHeight));
  
  console.log(`🏗️ Calculated grid: ${cols} × ${rows} = ${cols * rows} tiles`);
  
  return {
    cols,
    rows,
    totalTiles: cols * rows,
    tileWidth,
    tileHeight,
    effectiveTileWidth,
    effectiveTileHeight
  };
}

// Updated addWatermarkToPage method with dynamic grid calculation
addWatermarkToPage(pageContentComponent, pageIndex) {
  console.log("🔧 Calling addWatermarkToPage...");
  if (!this.pageSettings.watermark?.enabled) {
    console.warn(`⚠️ Watermark disabled — skipping`);
    return;
  }

  const watermark = this.pageSettings.watermark;
  console.log(`🧪 Attempting to add watermark to page ${pageIndex + 1}`);
  console.log("🔍 Watermark config:", watermark);

  let watermarkContent = "";
  let positionStyles = "";
  
  // Check if tiled watermark is enabled
  if (watermark.tiled) {
    console.log("🔄 Creating dynamic tiled watermark");
    
    // Calculate optimal grid size
    const gridInfo = this.calculateTiledGrid(watermark);
    
    // For tiled watermarks, we create a repeating pattern
    let tileContent = "";
    
    if (watermark.type === "text" || watermark.type === "both") {
      tileContent += `
        <div class="page-watermark-text-tile" style="
          font-family: ${watermark.text.font || "Arial"}, sans-serif !important;
          font-size: ${watermark.text.fontSize}px !important;
          color: ${watermark.text.color} !important;
          opacity: ${watermark.text.opacity} !important;
          transform: rotate(${watermark.text.rotation}deg) !important;
          font-weight: bold !important;
          white-space: nowrap !important;
          user-select: none !important;
          pointer-events: none !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        ">${watermark.text.content}</div>
      `;
    }
    
    if ((watermark.type === "image" || watermark.type === "both") && watermark.image.url) {
      tileContent += `
        <img class="page-watermark-image-tile" src="${watermark.image.url}" style="
          width: ${watermark.image.width}px !important;
          height: ${watermark.image.height}px !important;
          opacity: ${watermark.image.opacity} !important;
          object-fit: contain !important;
          user-select: none !important;
          pointer-events: none !important;
          display: block !important;
          margin: 0 auto !important;
        " />
      `;
    }
    
    // Create tiles based on calculated grid
    let tiledContent = "";
    for (let i = 0; i < gridInfo.totalTiles; i++) {
      tiledContent += `
        <div class="watermark-tile" style="
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          overflow: hidden !important;
        ">${tileContent}</div>
      `;
    }
    
    watermarkContent = tiledContent;
    positionStyles = `
      display: grid !important;
      grid-template-columns: repeat(${gridInfo.cols}, 1fr) !important;
      grid-template-rows: repeat(${gridInfo.rows}, 1fr) !important;
      gap: 10px !important;
      width: 100% !important;
      height: 100% !important;
      padding: 20px !important;
      box-sizing: border-box !important;
    `;
    
    console.log(`✅ Dynamic grid created: ${gridInfo.cols}×${gridInfo.rows} (${gridInfo.totalTiles} tiles)`);
    
  } else {
    // Original single watermark logic
    positionStyles = "display: flex !important; align-items: center !important; justify-content: center !important;";

    switch (watermark.position) {
      case "top-left":
        positionStyles = "display: flex !important; align-items: flex-start !important; justify-content: flex-start !important; padding: 20px !important;";
        break;
      case "top-center":
        positionStyles = "display: flex !important; align-items: flex-start !important; justify-content: center !important; padding: 20px !important;";
        break;
      case "top-right":
        positionStyles = "display: flex !important; align-items: flex-start !important; justify-content: flex-end !important; padding: 20px !important;";
        break;
      case "center-left":
        positionStyles = "display: flex !important; align-items: center !important; justify-content: flex-start !important; padding: 20px !important;";
        break;
      case "center":
        positionStyles = "display: flex !important; align-items: center !important; justify-content: center !important;";
        break;
      case "center-right":
        positionStyles = "display: flex !important; align-items: center !important; justify-content: flex-end !important; padding: 20px !important;";
        break;
      case "bottom-left":
        positionStyles = "display: flex !important; align-items: flex-end !important; justify-content: flex-start !important; padding: 20px !important;";
        break;
      case "bottom-center":
        positionStyles = "display: flex !important; align-items: flex-end !important; justify-content: center !important; padding: 20px !important;";
        break;
      case "bottom-right":
        positionStyles = "display: flex !important; align-items: flex-end !important; justify-content: flex-end !important; padding: 20px !important;";
        break;
    }

    if (watermark.type === "text" || watermark.type === "both") {
      console.log("✅ Adding text watermark:", watermark.text.content);
      watermarkContent += `
        <div class="page-watermark-text" style="
          font-family: ${watermark.text.font || "Arial"}, sans-serif !important;
          font-size: ${watermark.text.fontSize}px !important;
          color: ${watermark.text.color} !important;
          opacity: ${watermark.text.opacity} !important;
          transform: rotate(${watermark.text.rotation}deg) !important;
          font-weight: bold !important;
          white-space: nowrap !important;
          user-select: none !important;
          pointer-events: none !important;
        ">${watermark.text.content}</div>
      `;
    }

    if ((watermark.type === "image" || watermark.type === "both") && watermark.image.url) {
      watermarkContent += `
        <img class="page-watermark-image" src="${watermark.image.url}" style="
          width: ${watermark.image.width}px !important;
          height: ${watermark.image.height}px !important;
          opacity: ${watermark.image.opacity} !important;
          max-width: 100% !important;
          max-height: 100% !important;
          object-fit: contain !important;
          user-select: none !important;
          pointer-events: none !important;
        " />
      `;
    }
  }

  if (watermarkContent) {
    console.log("🚀 Injecting watermark HTML into page content component");
    const watermarkGjsComponent = pageContentComponent.append(`
      <div class="page-watermark ${watermark.tiled ? 'tiled' : 'single'}" style="
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        pointer-events: none !important;
        user-select: none !important;
        z-index: 1 !important;
        ${positionStyles}
      ">${watermarkContent}</div>
    `)[0];

    watermarkGjsComponent.set({
      selectable: false,
      editable: false,
      removable: false,
      draggable: false,
      copyable: false,
    });

    console.log(`✅ ${watermark.tiled ? 'Dynamic tiled' : 'Single'} watermark component added`);
  }
}

 renderPageNumbers() {
    console.log("Starting page number rendering...");

    if (!this.pageSettings.pageNumber?.enabled) {
      console.log("Page numbers disabled - removing existing ones");
      this.removeAllPageNumbers();
      return;
    }

    const settings = this.pageSettings.pageNumber;
    const startFrom = settings.startFrom || 1;
    const format = settings.format || "Page {n}";
    const position = settings.position || "bottom-center";

    console.log("Page number settings:", { startFrom, format, position });

    // Get all page containers
    const pages = this.editor.getWrapper().find('.page-container');

    // Calculate total pages that will actually have page numbers
    const startFromIndex = (startFrom - 1); // Convert to zero-based index
    const pagesWithNumbers = pages.length - startFromIndex;

    pages.forEach((pageComponent, index) => {
      const actualPageNumber = index + 1;

      console.log(`Processing page ${actualPageNumber}, startFrom: ${startFrom}`);

      // Remove existing page number
      const existingPageNumbers = pageComponent.find('.page-number-element');
      existingPageNumbers.forEach(el => el.remove());

      // Only add page number if this page is at or after the "start from" page
      if (actualPageNumber >= startFrom) {
        const displayPageNumber = actualPageNumber - startFrom + 1; // Reset numbering from 1
        const pageText = format
          .replace('{n}', displayPageNumber.toString())
          .replace('{total}', pagesWithNumbers.toString());

        // Get position styles
        const positionStyles = this.getPageNumberPositionStyles(position);

        // Create page number HTML
        const pageNumberHTML = `
        <div class="page-number-element" style="
          position: absolute;
          font-family: ${settings.fontFamily || 'Arial'};
          font-size: ${settings.fontSize || 11}px;
          color: ${settings.color || '#333333'};
          background-color: ${settings.backgroundColor || 'transparent'};
          border: ${settings.showBorder ? '1px solid ' + (settings.color || '#333333') : 'none'};
          padding: ${settings.showBorder ? '2px 6px' : '2px'};
          border-radius: 3px;
          z-index: 1000;
          pointer-events: none;
          white-space: nowrap;
          ${positionStyles}
        ">${pageText}</div>
      `;

        // Add to page content
        const pageContent = pageComponent.find('.page-content')[0];
        if (pageContent) {
          pageContent.append(pageNumberHTML);
          console.log(`Added page number "${pageText}" to page ${actualPageNumber}`);
        } else {
          console.warn(`Could not find page-content for page ${actualPageNumber}`);
        }
      } else {
        console.log(`Skipping page number for page ${actualPageNumber} (before start page)`);
      }
    });

    console.log("Page number rendering complete");
  }


  shouldShowPageNumber(pageIndex) {
    const pageNumber = pageIndex + 1
    return (
      !this.pageSettings.pageNumbering.excludedPages.includes(pageNumber) && this.pageSettings.pageNumbering.enabled
    )
  }

  getActualPageNumber(pageIndex) {
    const pageNumber = pageIndex + 1
    const excludedCount = this.pageSettings.pageNumbering.excludedPages.filter((p) => p < pageNumber).length
    return pageNumber - excludedCount
  }

  getTotalNumberedPages() {
    return this.pageSettings.numberOfPages - this.pageSettings.pageNumbering.excludedPages.length
  }

  showPageDeleteModal() {
    if (this.pageSettings.numberOfPages <= 1) {
      alert("Cannot delete the last page")
      return
    }

    let pageListHTML = ""
    this.pageSettings.pages.forEach((page, index) => {
      const isExcluded = this.pageSettings.pageNumbering.excludedPages.includes(index + 1)
      const pageNumberInfo = this.shouldShowPageNumber(index)
        ? `Page # ${this.getActualPageNumber(index)}`
        : "Excluded from numbering"

      pageListHTML += `
        <div class="page-delete-item" data-page-index="${index}">
          <div class="page-delete-info">
            <div class="page-delete-icon">
              <i class="fa fa-file-text-o"></i>
            </div>
            <div class="page-delete-details">
              <div class="page-delete-name">${page.name}</div>
              <div class="page-delete-meta">
                ${page.header.enabled ? '<span class="feature-tag">Header</span>' : ""}
                ${page.footer.enabled ? '<span class="feature-tag">Footer</span>' : ""}
                ${page.pageNumber.enabled ? '<span class="feature-tag">Page #</span>' : ""}
                ${this.pageSettings.watermark.enabled ? '<span class="feature-tag">Watermark</span>' : ""}
                <span class="feature-tag ${isExcluded ? "excluded" : "numbered"}">${pageNumberInfo}</span>
              </div>
            </div>
          </div>
          <button class="page-delete-btn-item" data-page-index="${index}">
            <i class="fa fa-trash"></i>
          </button>
        </div>
      `
    })

    this.editor.Modal.setTitle("🗑️ Delete Pages")
    this.editor.Modal.setContent(`
      <div class="page-delete-modal-content" style="color: #000 !important;">
        <div class="delete-warning">
          <i class="fa fa-exclamation-triangle"></i>
          <p>Select a page to delete. Page numbering will be automatically adjusted.</p>
        </div>
        <div class="page-delete-list">
          ${pageListHTML}
        </div>
        <div class="page-setup-actions" style="margin-top: 20px;">
          <button id="cancelPageDelete" class="page-setup-btn page-setup-btn-secondary">
            <i class="fa fa-times"></i> Cancel
          </button>
        </div>
      </div>
      <style>
        .delete-warning {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 6px;
          padding: 15px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .delete-warning i {
          color: #856404;
          font-size: 18px;
        }
        .delete-warning p {
          margin: 0;
          color: #856404 !important;
          font-weight: 500;
        }
        .page-delete-list {
          max-height: 400px;
          overflow-y: auto;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 15px;
          background: #f8f9fa;
        }
        .page-delete-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 15px;
          margin-bottom: 10px;
          background: white;
          border-radius: 8px;
          border: 2px solid #e9ecef;
          transition: all 0.2s ease;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
        .page-delete-item:hover {
          border-color: #dc3545;
          box-shadow: 0 4px 8px rgba(220,53,69,0.15);
        }
        .page-delete-item:last-child {
          margin-bottom: 0;
        }
        .page-delete-info {
          display: flex;
          align-items: center;
          gap: 15px;
          flex: 1;
        }
        .page-delete-icon {
          width: 40px;
          height: 40px;
          background: #007bff;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 16px;
        }
        .page-delete-details {
          flex: 1;
        }
        .page-delete-name {
          font-weight: 600;
          color: #333 !important;
          font-size: 14px;
          margin-bottom: 5px;
        }
        .page-delete-meta {
          display: flex;
          gap: 5px;
          flex-wrap: wrap;
        }
        .feature-tag {
          background: #e3f2fd;
          color: #1976d2 !important;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 500;
          border: 1px solid #bbdefb;
        }
        .feature-tag.excluded {
          background: #ffcdd2;
          color: #d32f2f !important;
          border-color: #ef9a9a;
        }
        .feature-tag.numbered {
          background: #c8e6c9;
          color: #388e3c !important;
          border-color: #a5d6a7;
        }
        .page-delete-btn-item {
          background: #f8d7da;
          color: #721c24;
          border: none;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s ease;
        }
        .page-delete-btn-item:hover {
          background: #f5c6cb;
        }
      </style>
    `)

    this.editor.Modal.open()

    setTimeout(() => {
      this.setupPageDeleteListeners()
    }, 100)
  }

  setupPageDeleteListeners() {
    document.addEventListener("click", (e) => {
      const deleteBtn = e.target.closest(".page-delete-btn-item");
      if (deleteBtn) {
        const pageIndex = Number.parseInt(deleteBtn.dataset.pageIndex, 10);
        if (!isNaN(pageIndex)) {
          this.deletePage(pageIndex);
        }
        return; // Important: prevent fallthrough
      }

      const cancelBtn = e.target.closest("#cancelPageDelete");
      if (cancelBtn) {
        this.editor.Modal.close();
      }
    });
  }


  deletePage(pageIndex) {
    if (this.pageSettings.numberOfPages <= 1) {
      alert("Cannot delete the last page");
      return;
    }

    // Preserve content before deletion
    this.preserveAllContent();

    // Remove the page from settings
    this.pageSettings.pages.splice(pageIndex, 1);
    this.pageSettings.numberOfPages--;

    // Adjust excluded pages list
    const deletedPageNumber = pageIndex + 1;
    if (this.pageSettings.pageNumbering.excludedPages.includes(deletedPageNumber)) {
      this.pageSettings.pageNumbering.excludedPages = this.pageSettings.pageNumbering.excludedPages.filter(
        p => p !== deletedPageNumber
      );
    } else {
      this.pageSettings.pageNumbering.excludedPages = this.pageSettings.pageNumbering.excludedPages.map(p =>
        p > deletedPageNumber ? p - 1 : p
      );
    }

    // Ensure startFromPage is within valid range
    this.pageSettings.pageNumbering.startFromPage = Math.min(
      this.pageSettings.pageNumbering.startFromPage,
      this.pageSettings.numberOfPages
    );

    // Recreate pages
    this.setupEditorPages();

    // Restore content and visuals
    setTimeout(() => {
      this.pageContents.delete(pageIndex);

      // Shift remaining page contents
      const newPageContents = new Map();
      for (const [index, content] of this.pageContents.entries()) {
        if (index < pageIndex) {
          newPageContents.set(index, content);
        } else if (index > pageIndex) {
          newPageContents.set(index - 1, content);
        }
      }
      this.pageContents = newPageContents;

      this.restoreAllContent();
      this.updateAllPageVisuals();
    }, 300);

    // ✅ Close modal after delete
    this.editor.Modal.close();

    // ✅ Rebuild modal labels (optional: open it again if needed)
    setTimeout(() => {
      // Uncomment this to reopen the modal with updated page labels
      // this.showPageDeleteModal();

      // Or refresh only if modal is still open
      if (this.editor.Modal.isOpen && this.editor.Modal.isOpen()) {
        this.showPageDeleteModal();
      }
    }, 500);

    console.log(`Page ${pageIndex + 1} deleted`);
  }


  updateAllPageIndicesAndLabels() {
    const allPages = this.editor.getWrapper().find(".page-container");

    allPages.forEach((pageComponent, newIndex) => {
      pageComponent.addAttributes({ "data-page-index": newIndex });

      // Find header region and label
      const headerRegion = pageComponent.find('[data-shared-region="header"]')[0];
      if (headerRegion) {
        const label = headerRegion.find(".page-number-label")[0];
        if (label) {
          label.components(`Page ${newIndex + 1}`);
        } else {
          // Inject label if it doesn't exist
          const newLabel = headerRegion.append(`
          <div class="page-number-label" style="
            position: absolute;
            top: 4px;
            right: 10px;
            font-weight: bold;
            font-size: 12px;
            color: #000;
            z-index: 9999;
            pointer-events: none;
          ">Page ${newIndex + 1}</div>
        `)[0];

          newLabel.set({
            editable: false,
            removable: false,
            selectable: false,
            draggable: false,
            copyable: false
          });
        }
      }
    });
  }


  addNewPage() {
    if (!this.isInitialized) return null;

    try {
      // PREVENT recursive pagination during page creation
      const originalPaginationState = this.paginationInProgress;
      this.paginationInProgress = true;

      const newPageIndex = this.pageSettings.numberOfPages;
      const newPageId = `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      console.log(`📄 Creating new page with ID: ${newPageId} at index: ${newPageIndex}`);

      // Add to page count FIRST
      this.pageSettings.numberOfPages++;

      const newPageSettings = {
        id: newPageId,
        name: `Page ${newPageIndex + 1}`,
        margins: { ...this.pageSettings.margins },
        backgroundColor: this.pageSettings.backgroundColor,
        header: {
          enabled: this.pageSettings.headerFooter?.headerEnabled || false,
          height: this.pageSettings.headerFooter?.headerHeight || 12.7,
          text: this.pageSettings.headerFooter?.headerText || "",
          shouldShowContent: true
        },
        footer: {
          enabled: this.pageSettings.headerFooter?.footerEnabled || false,
          height: this.pageSettings.headerFooter?.footerHeight || 12.7,
          text: this.pageSettings.headerFooter?.footerText || "",
          shouldShowContent: true
        }
      };

      this.pageSettings.pages.push(newPageSettings);

      // Calculate dimensions
      const mmToPx = 96 / 25.4;
      const marginTopPx = Math.round(this.pageSettings.margins.top * mmToPx);
      const marginBottomPx = Math.round(this.pageSettings.margins.bottom * mmToPx);
      const marginLeftPx = Math.round(this.pageSettings.margins.left * mmToPx);
      const marginRightPx = Math.round(this.pageSettings.margins.right * mmToPx);
      const totalPageWidth = Math.round(this.pageSettings.width * mmToPx);
      const totalPageHeight = Math.round(this.pageSettings.height * mmToPx);
      const contentWidth = totalPageWidth - marginLeftPx - marginRightPx;
      const contentHeight = totalPageHeight - marginTopPx - marginBottomPx;
      const defaultHeaderHeight = Math.round((this.pageSettings.headerFooter?.headerHeight || 12.7) * mmToPx);
      const defaultFooterHeight = Math.round((this.pageSettings.headerFooter?.footerHeight || 12.7) * mmToPx);
      const mainContentAreaHeight = contentHeight - defaultHeaderHeight - defaultFooterHeight;

      // Create page with full structure
      const pageHTML = `
      <div class="page-container" data-page-id="${newPageId}" data-page-index="${newPageIndex}">
        <div class="page-content" style="
          width: ${contentWidth}px; 
          height: ${contentHeight}px; 
          margin: ${marginTopPx}px ${marginRightPx}px ${marginBottomPx}px ${marginLeftPx}px;
          position: relative;
          overflow: hidden;
          background-color: ${newPageSettings.backgroundColor};
          display: flex;
          flex-direction: column;
        ">
          <div class="header-wrapper" data-shared-region="header" style="
            width: 100%;
            height: ${defaultHeaderHeight}px;
            flex-shrink: 0;
          ">
            <div class="page-header-element" style="
              width: 100%;
              height: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
              border: 2px dashed transparent;
              transition: border-color 0.2s ease;
            "></div>
          </div>
          <div class="content-wrapper" style="
            flex: 1;
            display: flex;
            flex-direction: column;
            height: ${mainContentAreaHeight}px;
          ">
            <div class="main-content-area" style="
              width: 100%;
              height: 100%;
              border: 2px dashed transparent;
              transition: border-color 0.2s ease;
              overflow: hidden;
              position: relative;
            "></div>
          </div>
          <div class="footer-wrapper" data-shared-region="footer" style="
            width: 100%;
            height: ${defaultFooterHeight}px;
            flex-shrink: 0;
          ">
            <div class="page-footer-element" style="
              width: 100%;
              height: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
              border: 2px dashed transparent;
              transition: border-color 0.2s ease;
            "></div>
          </div>
        </div>
      </div>`;

      const pageComponent = this.editor.getWrapper().append(pageHTML)[0];

      // Apply styles
      pageComponent.addStyle({
        width: `${totalPageWidth}px`,
        height: `${totalPageHeight}px`,
        background: newPageSettings.backgroundColor,
        margin: "20px auto",
        "box-shadow": "0 4px 12px rgba(0, 0, 0, 0.15)",
        border: "2px solid transparent",
        position: "relative",
        "page-break-after": "always",
        overflow: "hidden",
        "box-sizing": "border-box",
        transition: "border-color 0.2s ease"
      });

      // Configure component properties
      const headerElement = pageComponent.find(".page-header-element")[0];
      if (headerElement) {
        headerElement.set({
          droppable: true,
          editable: true,
          selectable: true,
          draggable: false,
          copyable: false,
          removable: false,
          "custom-name": "Header (Shared across all pages)"
        });
      }

      const mainContentArea = pageComponent.find(".main-content-area")[0];
      if (mainContentArea) {
        mainContentArea.set({
          droppable: true,
          editable: true,
          selectable: true,
          "custom-name": "Content Area"
        });
      }

      const footerElement = pageComponent.find(".page-footer-element")[0];
      if (footerElement) {
        footerElement.set({
          droppable: true,
          editable: true,
          selectable: true,
          draggable: false,
          copyable: false,
          removable: false,
          "custom-name": "Footer (Shared across all pages)"
        });
      }

      // CRITICAL: Setup observer AFTER page is fully created, with delay
      setTimeout(() => {
        // Restore pagination state
        this.paginationInProgress = originalPaginationState;

        // Setup observer for new page
        this.setupPageObserver(newPageIndex);
        console.log(`✅ New page ${newPageIndex + 1} created and observer attached`);
      }, 500); // Longer delay to ensure page is fully ready

      return newPageSettings;

    } catch (error) {
      console.error("❌ Error creating new page:", error);
      this.paginationInProgress = false;
      return null;
    }
  }

  clearAllObservers() {
    this.pageObservers.forEach((observer, pageIndex) => {
      if (observer) {
        observer.disconnect();
        console.log(`🗑️ Disconnected observer for page ${pageIndex}`);
      }
    });
    this.pageObservers.clear();

    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }

  // FIXED: New method to setup individual page observer with debouncing
  setupPageObserver(pageIndex) {
    const pageComponent = this.editor.getWrapper().find(`[data-page-index="${pageIndex}"]`)[0];
    if (!pageComponent) {
      console.warn(`❌ Page component not found for index ${pageIndex}`);
      return;
    }

    const contentArea = pageComponent.find(".main-content-area")[0];
    if (!contentArea) {
      console.warn(`❌ .main-content-area not found in page ${pageIndex}`);
      return;
    }

    const contentEl = contentArea.getEl();
    if (!contentEl) {
      console.warn(`❌ contentEl (DOM) not available for page ${pageIndex}`);
      return;
    }

    // Disconnect existing observer if any
    if (this.pageObservers.has(pageIndex)) {
      this.pageObservers.get(pageIndex).disconnect();
    }

    console.log(`🔍 Setting up debounced observer for page ${pageIndex}`);

    const observer = new MutationObserver((mutations) => {
      // FIXED: Check if mutations are actually meaningful
      const meaningfulMutation = mutations.some(mutation => {
        // Only trigger on actual content changes, not style changes
        return (
          (mutation.type === 'childList' &&
            (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)) ||
          (mutation.type === 'characterData' &&
            mutation.target.textContent && mutation.target.textContent.length > 10)
        );
      });

      if (!meaningfulMutation) {
        return; // Skip insignificant mutations
      }

      // Clear existing debounce timer
      if (this.debounceTimers.has(pageIndex)) {
        clearTimeout(this.debounceTimers.get(pageIndex));
      }

      // Set new debounced timer
      const timer = setTimeout(() => {
        if (!this.paginationInProgress) {
          console.log(`🔁 Debounced mutation handling for page ${pageIndex}`);
          this.handleAutoPagination(pageIndex);
        }
      }, 500); // FIXED: Increased debounce to 500ms for better stability

      this.debounceTimers.set(pageIndex, timer);
    });

    observer.observe(contentEl, {
      childList: true,
      subtree: true,
      characterData: true, // FIXED: Re-enable to catch text changes
      attributes: false // Keep disabled to reduce noise
    });

    this.pageObservers.set(pageIndex, observer);
  }

  disableAutoPagination() {
    this.paginationInProgress = true;
    console.log("⏸️ Auto-pagination disabled");
  }

  // New method to re-enable auto-pagination
  enableAutoPagination() {
    this.paginationInProgress = false;
    console.log("▶️ Auto-pagination enabled");
  }

  checkAllPagesForOverflow() {
    console.log("🔍 Manually checking all pages for overflow...");

    for (let i = 0; i < this.pageSettings.numberOfPages; i++) {
      const pageComponent = this.editor.getWrapper().find(`[data-page-index="${i}"]`)[0];
      if (!pageComponent) continue;

      const contentArea = pageComponent.find(".main-content-area")[0];
      if (!contentArea) continue;

      const contentEl = contentArea.getEl();
      if (!contentEl) continue;

      // Force a layout recalculation
      contentEl.offsetHeight;

      const contentHeight = contentEl.scrollHeight;
      const maxHeight = contentEl.clientHeight;

      console.log(`📏 Page ${i}: ${contentHeight}px content in ${maxHeight}px available`);

      const actuallyOverflowing =
        contentHeight > maxHeight ||
        contentEl.scrollHeight > contentEl.clientHeight ||
        this.hasVisualOverflowInPage(contentEl, maxHeight);

      if (actuallyOverflowing) {
        console.log(`🚨 Manual overflow check triggered pagination for page ${i}`);
        setTimeout(() => this.handleAutoPagination(i), 100);
        break;
      }
    }
  }

  hasVisualOverflowInPage(contentEl, maxHeight) {
    const children = contentEl.children;

    for (let child of children) {
      const rect = child.getBoundingClientRect();
      const containerRect = contentEl.getBoundingClientRect();

      // Check if child extends beyond container bottom
      if (rect.bottom > containerRect.bottom) {
        console.log(`🔍 Visual overflow found: child extends ${rect.bottom - containerRect.bottom}px beyond container`);
        return true;
      }

      // Check if child has internal overflow
      if (child.scrollHeight > child.clientHeight) {
        console.log(`🔍 Child element has internal overflow: ${child.scrollHeight}px > ${child.clientHeight}px`);
        return true;
      }
    }

    return false;
  }

  forcePaginationForPage(pageIndex) {
    console.log(`🔧 Force pagination triggered for page ${pageIndex}`);

    if (this.paginationInProgress) {
      setTimeout(() => this.forcePaginationForPage(pageIndex), 1000);
      return;
    }

    const pageComponent = this.editor.getWrapper().find(`[data-page-index="${pageIndex}"]`)[0];
    if (!pageComponent) return;

    const contentArea = pageComponent.find(".main-content-area")[0];
    if (!contentArea) return;

    const components = contentArea.components();
    if (components.length === 0) return;

    // Split content roughly in half
    const splitIndex = Math.ceil(components.length / 2);

    if (splitIndex >= components.length) return;

    const overflowComponents = [];
    for (let i = splitIndex; i < components.length; i++) {
      overflowComponents.push(components.at(i));
    }

    const nextPageIndex = pageIndex + 1;

    if (nextPageIndex >= this.pageSettings.numberOfPages) {
      this.addNewPage();
    }

    this.moveComponentsToPage(overflowComponents, nextPageIndex);

    console.log(`✅ Force pagination completed for page ${pageIndex}`);
  }

  startContentMonitoring() {
    // Clear any existing monitoring
    if (this.contentCheckInterval) {
      clearInterval(this.contentCheckInterval);
    }

    // FIXED: Check less frequently to reduce noise
    this.contentCheckInterval = setInterval(() => {
      // Only check if not currently paginating
      if (!this.paginationInProgress) {
        this.checkForContentChanges();
      }
    }, 3000); // Increased to 3 seconds

    console.log("🔍 Started periodic content monitoring");
  }

  checkForContentChanges() {
    for (let i = 0; i < this.pageSettings.numberOfPages; i++) {
      const pageComponent = this.editor.getWrapper().find(`[data-page-index="${i}"]`)[0];
      if (!pageComponent) continue;

      const contentArea = pageComponent.find(".main-content-area")[0];
      if (!contentArea) continue;

      const contentEl = contentArea.getEl();
      if (!contentEl) continue;

      // Create more detailed content snapshot
      const currentSnapshot = {
        innerHTML: contentEl.innerHTML,
        scrollHeight: contentEl.scrollHeight,
        childCount: contentEl.children.length,
        textLength: (contentEl.textContent || '').trim().length,
        hasOverflow: contentEl.scrollHeight > contentEl.clientHeight
      };

      const lastSnapshot = this.lastContentSnapshot.get(i);

      // FIXED: Only trigger on significant changes
      const hasSignificantChange = !lastSnapshot ||
        lastSnapshot.childCount !== currentSnapshot.childCount ||
        Math.abs(lastSnapshot.scrollHeight - currentSnapshot.scrollHeight) > 10 ||
        Math.abs(lastSnapshot.textLength - currentSnapshot.textLength) > 50;

      if (hasSignificantChange) {
        console.log(`📝 Content change detected on page ${i}`);
        console.log(`   Previous: ${lastSnapshot?.scrollHeight || 0}px, Current: ${currentSnapshot.scrollHeight}px`);

        // Update snapshot
        this.lastContentSnapshot.set(i, currentSnapshot);

        // Check for overflow with delay to allow DOM to settle
        setTimeout(() => {
          this.checkPageForOverflow(i);
        }, 100);
      }
    }
  }

  checkPageForOverflow(pageIndex) {
    
    this.handlePageBreak(pageIndex);
    const pageComponent = this.editor.getWrapper().find(`[data-page-index="${pageIndex}"]`)[0];
    if (!pageComponent) return;

    const contentArea = pageComponent.find(".main-content-area")[0];
    if (!contentArea) return;

    const contentEl = contentArea.getEl();
    if (!contentEl) return;

    // Force layout recalculation
    contentEl.offsetHeight;

    const contentHeight = contentEl.scrollHeight;
    const maxHeight = contentEl.clientHeight;

    // Check for various types of overflow
    const hasScrollOverflow = contentEl.scrollHeight > contentEl.clientHeight;
    const hasVisualOverflow = this.checkDeepVisualOverflow(contentEl, maxHeight);
    const hasTextOverflow = this.checkTextOverflow(contentEl);

    console.log(`🔍 Comprehensive overflow check for page ${pageIndex}:`);
    console.log(`   Content: ${contentHeight}px in ${maxHeight}px available`);
    console.log(`   Scroll overflow: ${hasScrollOverflow}`);
    console.log(`   Visual overflow: ${hasVisualOverflow}`);
    console.log(`   Text overflow: ${hasTextOverflow}`);

    // FIXED: Detect overflow even when heights match exactly
    const needsPagination =
      contentHeight > maxHeight ||
      hasScrollOverflow ||
      hasVisualOverflow ||
      hasTextOverflow ||
      (contentHeight === maxHeight && this.contentLooksOverflowing(contentEl));

    if (needsPagination) {
      console.log(`🚨 OVERFLOW DETECTED - triggering pagination for page ${pageIndex}`);
      setTimeout(() => this.handleAutoPagination(pageIndex), 100);
    } else {
      console.log(`✅ No overflow on page ${pageIndex}`);
    }
    
  }

  contentLooksOverflowing(contentEl) {
    // Count total text content
    const textContent = contentEl.textContent || '';
    const textLength = textContent.trim().length;

    // Count paragraphs and other block elements
    const paragraphs = contentEl.querySelectorAll('p, div, h1, h2, h3, h4, h5, h6');
    const totalElements = contentEl.querySelectorAll('*').length;

    console.log(`📊 Content analysis:`);
    console.log(`   Text length: ${textLength} characters`);
    console.log(`   Paragraphs/blocks: ${paragraphs.length}`);
    console.log(`   Total elements: ${totalElements}`);

    // Heuristic: if there's a lot of text content, it probably overflows
    return (
      textLength > 3000 ||  // More than 3000 characters
      paragraphs.length > 8 || // More than 8 paragraphs
      totalElements > 15    // More than 15 nested elements
    );
  }

  checkDeepVisualOverflow(container, maxHeight) {
    const containerRect = container.getBoundingClientRect();
    const allElements = container.querySelectorAll('*');

    for (let element of allElements) {
      const rect = element.getBoundingClientRect();
      if (rect.bottom > containerRect.bottom + 5) {
        console.log(`🔍 Deep visual overflow: ${element.tagName}#${element.id} extends beyond container`);
        return true;
      }
    }
    return false;
  }

  checkTextOverflow(container) {
    const textElements = container.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6');

    for (let element of textElements) {
      if (element.scrollHeight > element.clientHeight + 2) {
        console.log(`📝 Text overflow in ${element.tagName}#${element.id}: ${element.scrollHeight}px > ${element.clientHeight}px`);
        return true;
      }
    }
    return false;
  }

  triggerPaginationCheck() {
    console.log("🔧 Manual pagination check triggered");

    // Reset pagination flag to ensure it's not stuck
    this.paginationInProgress = false;

    // Force content change check
    this.checkForContentChanges();

    // Also try direct overflow check on all pages
    setTimeout(() => {
      for (let i = 0; i < this.pageSettings.numberOfPages; i++) {
        this.checkPageForOverflow(i);
      }
    }, 200);
  }

  resetPaginationState() {
    console.log("🔄 Emergency pagination state reset");

    this.paginationInProgress = false;

    // Clear all debounce timers
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();

    // Clear and re-setup all observers
    this.clearAllObservers();

    setTimeout(() => {
      for (let i = 0; i < this.pageSettings.numberOfPages; i++) {
        this.setupPageObserver(i);
      }
      console.log("✅ All observers re-established");
    }, 500);
  }

  setupGlobalPasteListener() {
    // Listen for paste events on the entire canvas
    const canvasBody = this.editor.Canvas.getBody();

    if (canvasBody) {
      canvasBody.addEventListener('paste', (e) => {
        console.log("📋 Paste event detected");

        // Wait for paste to complete, then check for overflow
        setTimeout(() => {
          this.triggerPaginationCheck();
        }, 500);
      });

      // Also listen for input events (typing, content changes)
      canvasBody.addEventListener('input', (e) => {
        console.log("⌨️ Input event detected");

        // Debounced check for typing
        clearTimeout(this.inputDebounceTimer);
        this.inputDebounceTimer = setTimeout(() => {
          this.triggerPaginationCheck();
        }, 1000);
      });

      console.log("📋 Global paste/input listeners attached");
    }
  }

  // Enhanced cleanup method
  destroy() {
    this.clearAllObservers();

    if (this.contentCheckInterval) {
      clearInterval(this.contentCheckInterval);
    }

    if (this.inputDebounceTimer) {
      clearTimeout(this.inputDebounceTimer);
    }

    this.paginationInProgress = false;
    console.log("🗑️ PageSetupManager cleanup completed");
  }


  getUsableHeight(contentArea) {
    // GrapesJS DOM element for content
    const el = contentArea.view.el;

    // Page container (Dynamic Header Footer block wrapper)
    const pageContainer = el.closest('.sections-container');
    const totalHeight = pageContainer ? pageContainer.clientHeight : 1123;

    // Header + Footer height
    const header = pageContainer.querySelector('.gjs-editor-header');
    const footer = pageContainer.querySelector('.gjs-editor-footer');
    const headerH = header ? header.clientHeight : 0;
    const footerH = footer ? footer.clientHeight : 0;

    // Margins (stored as dataset from modal if available)
    const topMargin = parseInt(pageContainer.dataset.marginTop || 0, 10);
    const bottomMargin = parseInt(pageContainer.dataset.marginBottom || 0, 10);

    // Usable height for content area
    return totalHeight - (headerH + footerH + topMargin + bottomMargin);
  }


  createPagesFromEditor(editor) {
    const wrapper = editor.getWrapper();

    // Find the first Dynamic Header Footer page
    const pageBlocks = wrapper.find('[data-gjs-type="Dynamic Header Footer"]');
    if (!pageBlocks.length) {
      alert("⚠️ No Dynamic Header Footer block found.");
      return;
    }

    const firstPage = pageBlocks[0];
    const contentArea = firstPage.find('.gjs-editor-content')[0];

    if (!contentArea) {
      alert("⚠️ No content area found.");
      return;
    }

    // Get pasted content (inside textarea/text component)
    let rawContent = "";
    contentArea.components().forEach(cmp => {
      if (cmp.get('type') === 'text' || cmp.get('tagName') === 'textarea') {
        rawContent += cmp.get('content') || cmp.view.el.innerText || "";
      }
    });

    if (!rawContent.trim()) {
      alert("⚠️ Content area is empty.");
      return;
    }

    // Try parsing JSON, fallback to plain text
    let data;
    try {
      data = JSON.parse(rawContent);
    } catch (e) {
      data = rawContent.split(/\n+/).map(line => ({ text: line }));
    }

    // Clear existing content area before distributing
    contentArea.components().reset();

    // Measure usable height dynamically
    let usableHeight = getUsableHeight(contentArea);
    let currentPage = firstPage;
    let currentContentArea = contentArea;
    let currentHeight = 0;

    data.forEach(item => {
      const block = document.createElement("div");
      block.className = "content-block";
      block.innerText = item.first_name
        ? `${item.id}. ${item.first_name} ${item.last_name} - ${item.email}`
        : item.text;

      // Temporarily append to measure height
      currentContentArea.view.el.appendChild(block);
      const blockHeight = block.offsetHeight || 20;

      if (currentHeight + blockHeight > usableHeight) {
        // Need a new page
        currentPage = editor.addComponents({
          type: "Dynamic Header Footer",
          content: ""
        })[0];

        currentContentArea = currentPage.find('.gjs-editor-content')[0];

        // Append block to new page
        currentContentArea.view.el.appendChild(block);

        usableHeight = getUsableHeight(currentContentArea);
        currentHeight = blockHeight;
      } else {
        currentHeight += blockHeight;
      }
    });

    alert("✅ Pages created successfully!");
  }













}
