class PageSetupManager {

  constructor(editor) {

    this.editor = editor;
    this.registerDynamicHeaderFooter();
    document.addEventListener('arrayDataSelected', function (event) {
      const { data, jsonPath } = event.detail;

      // Call the distribution handler
      // Note: Replace 'pageManagerInstance' with your actual instance variable
      if (window.pageManagerInstance && window.pageManagerInstance.handleArrayDataDistribution) {
        window.pageManagerInstance.handleArrayDataDistribution(data, jsonPath);
      } else if (typeof handleArrayDataDistribution === 'function') {
        // If it's a standalone function, call it directly
        handleArrayDataDistribution(data, jsonPath);
      } else {
        console.error('No page manager instance or function available to handle array data');
      }
    });

    document.addEventListener('canvasCleared', () => {
      this.isInitialized = false;
      this.updateNavbarButton();
      this.updateAddPageButton();

      this.resetInitialSetupModalInputs();
    });



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

    this.openSuggestionJsonModal = this.openSuggestionJsonModal.bind(this);
    this.handleArrayDataDistribution = this.handleArrayDataDistribution.bind(this);

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
    this.setupJsonSuggestionButton()
    this.initializeArrayDataListener()
    const MAX_HEIGHT = 1027;


    // Trigger processing when component is added to parent
    this.on("change:parent", () => {
      if (this.parent()) {

        // Get the PageSetupManager
        const editor = this.em;
        const pageSetupManager = editor?.get?.("PageSetupManager");

        if (pageSetupManager && pageSetupManager.splitPagesByBreaks) {
          // Schedule processing after a delay to ensure DOM is ready
          setTimeout(() => {
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


  resetInitialization() {
    this.isInitialized = false;
    this.updateNavbarButton();
    this.updateAddPageButton();
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

    const wrapper = this.editor.getWrapper();
    const newPageIndex = wrapper.find('[data-page-index]').length;

    // +Latest+ use buildPageSkeleton so that new page looks exactly like existing pages
    const newPage = wrapper.append(this.addNewPage());

    // ✅ GrapesJS component return karega
    return newPage[0];
  }

  handlePageBreak(pageIndex) {
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

  }

  ////////////////////////////////// auto-pagtination ////////////////////////////////////////////////////

  handleAutoPagination(pageIndex) {
    console.log("handleautopagination")
    this.handlePageBreak(pageIndex);

    if (this.paginationInProgress) {
      return;
    }

    this.paginationInProgress = true;

    const resetFlag = () => {
      this.paginationInProgress = false;
    };

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

      // Check if we have sections structure
      const sectionsContainer = contentArea.find('.sections-container')[0];
      let targetArea = contentArea;
      let availableHeight = contentArea.getEl().clientHeight;

      if (sectionsContainer) {
        // Work with section-content instead
        const sectionContent = sectionsContainer.components().find(c => c.get('name') === 'Content');

        if (sectionContent) {
          targetArea = sectionContent;

          // Calculate available height (main-content-area height - header - footer - padding)
          const mainContentEl = contentArea.getEl();
          const mainContentHeight = mainContentEl.clientHeight;

          const headerComp = sectionsContainer.components().find(c => c.get('name') === 'Header');
          const footerComp = sectionsContainer.components().find(c => c.get('name') === 'Footer');

          let headerHeight = 0;
          let footerHeight = 0;

          if (headerComp && headerComp.getEl()) {
            headerHeight = this.getAccurateComponentHeight(headerComp.getEl());
          }

          if (footerComp && footerComp.getEl()) {
            footerHeight = this.getAccurateComponentHeight(footerComp.getEl());
          }

          // Available height = total - header - footer - some padding
          availableHeight = mainContentHeight - headerHeight - footerHeight - 40;

         
        }
      }

      const targetEl = targetArea.getEl();
      if (!targetEl) {
        console.warn(`❌ Target element not found for page ${pageIndex}`);
        resetFlag();
        return;
      }

      // Force layout recalculation
      targetEl.offsetHeight;
      const actualHeight = targetEl.scrollHeight;

      const isOverflowing = actualHeight > availableHeight + 10;

     

      if (!isOverflowing) {
        resetFlag();
        return;
      }


      // Get components from target area
      const components = targetArea.components();
      if (components.length === 0) {
        resetFlag();
        return;
      }

      // Height-based splitting
      const splitSuccess = this.splitContentByHeight(targetArea, components, pageIndex, availableHeight);

      if (splitSuccess) {
        setTimeout(() => {
          resetFlag();

          setTimeout(() => {
            const nextPageIndex = pageIndex + 1;
            if (nextPageIndex < this.pageSettings.numberOfPages) {
              this.checkPageForOverflow(nextPageIndex);
            }
          }, 800);
        }, 500);
      } else {
        console.error(`❌ Split strategy failed for page ${pageIndex}`);
        resetFlag();
      }

    } catch (error) {
      console.error(`❌ Error in handleAutoPagination for page ${pageIndex}:`, error);
      resetFlag();
    }
  }

  splitContentByHeight(contentArea, components, pageIndex, maxHeight) {

    const contentEl = contentArea.getEl();
    const componentsToKeep = [];
    const componentsToMove = [];

    let accumulatedHeight = 0;
    let splitPointFound = false;

    for (let i = 0; i < components.length; i++) {
      const component = components.at(i);
      const compEl = component.getEl();

      if (!compEl) continue;

      const compHeight = this.getAccurateComponentHeight(compEl);


      // Calculate remaining space
      const remainingSpace = maxHeight - accumulatedHeight;

      // If this component would overflow
      if (accumulatedHeight + compHeight > maxHeight) {
        splitPointFound = true;

        // If there's reasonable space left (more than 20% of page height), try to fill it
        if (remainingSpace > maxHeight * 0.2) {

          // Split this component's text content using remaining space
          const splitResult = this.splitLargeComponent(component, compEl, remainingSpace);

          if (splitResult.moveComponent) {
            componentsToMove.push(splitResult.moveComponent);
          }

          // Move remaining components
          for (let j = i + 1; j < components.length; j++) {
            componentsToMove.push(components.at(j));
          }

          break;
        } else {
          // Not enough space, move entire component to next page
          for (let j = i; j < components.length; j++) {
            componentsToMove.push(components.at(j));
          }
          break;
        }
      } else {
        componentsToKeep.push(component);
        accumulatedHeight += compHeight;
      }
    }

    // If no split point found and only one component that's too large
    if (!splitPointFound && components.length === 1) {
      const component = components.at(0);
      const compEl = component.getEl();
      // Use 95% of maxHeight to ensure we fill the page properly
      const splitResult = this.splitLargeComponent(component, compEl, maxHeight * 0.95);

      if (splitResult.moveComponent) {
        componentsToMove.push(splitResult.moveComponent);
      }
    }

    if (componentsToMove.length === 0) {
      console.warn(`⚠️ No components to move after split calculation`);
      return false;
    }


    // Ensure next page exists
    const nextPageIndex = pageIndex + 1;
    if (nextPageIndex >= this.pageSettings.numberOfPages) {
      this.addNewPage();

      setTimeout(() => {
        this.moveComponentsToPage(componentsToMove, nextPageIndex);
      }, 600);
    } else {
      this.moveComponentsToPage(componentsToMove, nextPageIndex);
    }

    return true;
  }

  splitLargeComponent(component, compEl, targetHeight) {

    const innerHTML = compEl.innerHTML;
    const textContent = compEl.textContent || compEl.innerText || '';

    if (!textContent.trim()) {
      return { keepComponent: null, moveComponent: null };
    }

    const totalHeight = compEl.scrollHeight;

   

    // Simple ratio: if component is 2000px and target is 1000px, we need 50% of content
    const simpleRatio = targetHeight / totalHeight;


    // Apply the ratio to find split point
    const splitPosition = Math.floor(textContent.length * simpleRatio);

    // Find a good break point near this position
    const actualSplitPos = this.findGoodBreakPoint(textContent, splitPosition);

    const firstPart = textContent.substring(0, actualSplitPos).trim();
    const secondPart = textContent.substring(actualSplitPos).trim();

   

    if (!firstPart || !secondPart) {
      console.warn(`⚠️ Split resulted in empty part`);
      return { keepComponent: null, moveComponent: null };
    }

    // Get component properties
    const componentType = component.get('type');
    const componentTag = component.get('tagName') || 'div';
    const componentStyle = component.getStyle();
    const componentAttrs = component.getAttributes();

    // Update current component with first part
    component.set('content', firstPart);

    if (component.view) {
      component.view.render();
    }

    // Create new component for second part  
    const newComponent = this.editor.Components.addComponent({
      type: componentType,
      tagName: componentTag,
      content: secondPart,
      style: { ...componentStyle },
      attributes: { ...componentAttrs }
    });


    return {
      keepComponent: null,
      moveComponent: newComponent
    };
  }

  findGoodBreakPoint(text, targetPosition) {
    // Look for sentence end (period + space)
    const searchStart = Math.max(0, targetPosition - 200);
    const searchEnd = Math.min(text.length, targetPosition + 200);

    // Search backwards from target for a period
    for (let i = targetPosition; i >= searchStart; i--) {
      if (text[i] === '.' && i + 1 < text.length && text[i + 1] === ' ') {
        return i + 2; // After period and space
      }
    }

    // Look for paragraph break (newline)
    for (let i = targetPosition; i >= searchStart; i--) {
      if (text[i] === '\n') {
        return i + 1;
      }
    }

    // Look for any space
    for (let i = targetPosition; i >= searchStart; i--) {
      if (text[i] === ' ') {
        return i + 1;
      }
    }

    return targetPosition;
  }


  moveComponentsToPage(components, targetPageIndex) {
    console.log("movecomponentto new page")
    try {
      const targetPageComponent = this.editor.getWrapper().find(`[data-page-index="${targetPageIndex}"]`)[0];
      if (!targetPageComponent) {
        console.error(`❌ Target page ${targetPageIndex} not found`);
        return false;
      }

      let targetContentArea = targetPageComponent.find(".main-content-area")[0];
      if (!targetContentArea) {
        console.error(`❌ Target content area not found`);
        return false;
      }

      // Check if target page has sections structure
      const sectionsContainer = targetContentArea.find('.sections-container')[0];
      if (sectionsContainer) {
        const sectionContent = sectionsContainer.components().find(c => c.get('name') === 'Content');
        if (sectionContent) {
          targetContentArea = sectionContent;
        }
      }


      // Temporarily disconnect observer
      if (this.pageObservers.has(targetPageIndex)) {
        this.pageObservers.get(targetPageIndex).disconnect();
      }

      let successCount = 0;

      components.forEach((component, index) => {
        try {
          if (!component) return;

          // Remove from current location
          component.remove();

          // Add to target page
          targetContentArea.append(component);
          successCount++;

        } catch (compError) {
          console.error(`❌ Error moving component ${index}:`, compError);
        }
      });

      // Reconnect observer
      setTimeout(() => {
        this.setupPageObserver(targetPageIndex);
      }, 400);

      return successCount > 0;

    } catch (error) {
      console.error(`❌ Error in moveComponentsToPage:`, error);
      return false;
    }
  }

  getAccurateComponentHeight(element) {
    if (!element) return 0;

    // Force layout
    element.offsetHeight;

    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);

    const marginTop = parseFloat(style.marginTop) || 0;
    const marginBottom = parseFloat(style.marginBottom) || 0;
    const paddingTop = parseFloat(style.paddingTop) || 0;
    const paddingBottom = parseFloat(style.paddingBottom) || 0;

    // Use the maximum of all possible height measurements
    const scrollHeight = element.scrollHeight;
    const offsetHeight = element.offsetHeight;
    const rectHeight = Math.ceil(rect.height);

    const contentHeight = Math.max(scrollHeight, offsetHeight, rectHeight);
    const totalHeight = contentHeight + marginTop + marginBottom;

    return totalHeight;
  }

  clearAllObservers() {
    this.pageObservers.forEach((observer, pageIndex) => {
      if (observer) {
        observer.disconnect();
      }
    });
    this.pageObservers.clear();

    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }

  setupPageObserver(pageIndex) {
    console.log("setuppGEOBSERVER")
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

    if (this.pageObservers.has(pageIndex)) {
      this.pageObservers.get(pageIndex).disconnect();
    }
console.log("observer return")

    let lastContentHeight = contentEl.scrollHeight;

    const observer = new MutationObserver((mutations) => {
      // Check if user is editing
      const activeElement = document.activeElement;
      const isEditingText = activeElement && (
        activeElement.isContentEditable ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.tagName === 'INPUT'
      );

      if (isEditingText) {
        return;
      }

      // Check if height actually changed significantly
      const currentHeight = contentEl.scrollHeight;
      const heightChange = Math.abs(currentHeight - lastContentHeight);

      if (heightChange < 50) {
        return;
      }

      lastContentHeight = currentHeight;

      // Check if mutations are meaningful
      const meaningfulMutation = mutations.some(mutation => {
        return (
          (mutation.type === 'childList' &&
            (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0))
        );
      });

      if (!meaningfulMutation) {
        return;
      }

      // Clear existing debounce timer
      if (this.debounceTimers.has(pageIndex)) {
        clearTimeout(this.debounceTimers.get(pageIndex));
      }

      // Set new debounced timer with longer delay
      const timer = setTimeout(() => {
        if (!this.paginationInProgress) {
          this.handleAutoPagination(pageIndex);
        }
      }, 1000); // Increased to 1 second

      this.debounceTimers.set(pageIndex, timer);
    });

    observer.observe(contentEl, {
      childList: true,
      subtree: true,
      characterData: false, // Disable to reduce noise
      attributes: false
    });

    this.pageObservers.set(pageIndex, observer);
  }

  checkPageForOverflow(pageIndex) {
    console.log("checkpageoverflow")
    this.handlePageBreak(pageIndex);

    const pageComponent = this.editor.getWrapper().find(`[data-page-index="${pageIndex}"]`)[0];
    if (!pageComponent) return;

    const contentArea = pageComponent.find(".main-content-area")[0];
    if (!contentArea) return;

    // Check for sections structure
    const sectionsContainer = contentArea.find('.sections-container')[0];
    let targetArea = contentArea;
    let maxHeight = contentArea.getEl().clientHeight;

    if (sectionsContainer) {
      const sectionContent = sectionsContainer.components().find(c => c.get('name') === 'Content');

      if (sectionContent) {
        targetArea = sectionContent;

        // Calculate available height
        const mainContentHeight = contentArea.getEl().clientHeight;
        const headerComp = sectionsContainer.components().find(c => c.get('name') === 'Header');
        const footerComp = sectionsContainer.components().find(c => c.get('name') === 'Footer');

        let headerHeight = 0;
        let footerHeight = 0;

        if (headerComp && headerComp.getEl()) {
          headerHeight = this.getAccurateComponentHeight(headerComp.getEl());
        }

        if (footerComp && footerComp.getEl()) {
          footerHeight = this.getAccurateComponentHeight(footerComp.getEl());
        }

        maxHeight = mainContentHeight - headerHeight - footerHeight - 40;
      }
    }

    const contentEl = targetArea.getEl();
    if (!contentEl) return;

    // Force layout recalculation
    contentEl.offsetHeight;

    const contentHeight = contentEl.scrollHeight;

    // Check for overflow
    const hasScrollOverflow = contentHeight > maxHeight;
    const hasVisualOverflow = this.checkDeepVisualOverflow(contentEl, maxHeight);
    const hasTextOverflow = this.checkTextOverflow(contentEl);

   

    const needsPagination =
      contentHeight > maxHeight ||
      hasScrollOverflow ||
      hasVisualOverflow ||
      hasTextOverflow;

    if (needsPagination) {
      setTimeout(() => this.handleAutoPagination(pageIndex), 100);
    } else {
    }
  }

  checkDeepVisualOverflow(container, maxHeight) {
    const containerRect = container.getBoundingClientRect();
    const allElements = container.querySelectorAll('*');

    for (let element of allElements) {
      const rect = element.getBoundingClientRect();
      if (rect.bottom > containerRect.bottom + 5) {
        return true;
      }
    }
    return false;
  }

  checkTextOverflow(container) {
    const textElements = container.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6');

    for (let element of textElements) {
      if (element.scrollHeight > element.clientHeight + 2) {
        return true;
      }
    }
    return false;
  }


  ////////////////////////////////// auto-pagtination ////////////////////////////////////////////////////


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
    } catch (error) {
      console.error("❌ Error preserving all content:", error);
    }
  }

  preserveContentForModeSwitch() {
    try {

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
          }
        });
      });

      // Store the backup for later restoration
      this._modeSwitchContentBackup = contentBackup;


    } catch (error) {
      console.error("❌ Error preserving components for mode switch:", error);
    }
  }

  restoreContentAfterModeSwitch() {
    try {
      if (!this._modeSwitchContentBackup) {
        return;
      }

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

          }
        });
      });

      // Clean up the backup
      delete this._modeSwitchContentBackup;


    } catch (error) {
      console.error("❌ Error restoring components after mode switch:", error);
    }
  }


  restoreAllContent() {
    if (!this.isInitialized || this.pageContents.size === 0) return;
    try {
      const allPages = this.editor.getWrapper().find(".page-container");

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
              headerRegion.components().reset();
            }
          } else {
            // Header disabled, clear content
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
              footerRegion.components().reset();
            }
          } else {
            // Footer disabled, clear content
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

      // // Preserve header content
      // const headerRegion = firstPageComponent.find('[data-shared-region="header"]')[0];
      // if (headerRegion) {
      //   const headerComponents = headerRegion.components();
      //   if (headerComponents.length > 0) {
      //     this.sharedContent.header = {
      //       components: headerComponents.map((comp) => ({
      //         html: comp.toHTML(),
      //         styles: comp.getStyle(),
      //         attributes: comp.getAttributes(),
      //         type: comp.get("type"),
      //       })),
      //       styles: headerRegion.getStyle(),
      //       attributes: headerRegion.getAttributes(),
      //     };
      //   }
      // }

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

    } catch (error) {
      console.error("❌ Error preserving shared content:", error);
    }
  }

  // Restore shared content after operations
  restoreSharedContent() {
    // if (!this.isInitialized) return

    // try {
    //   const allPageComponents = this.editor.getWrapper().find(".page-container")

    //   allPageComponents.forEach((pageComponent) => {
    //     // Restore header content
    //     if (this.sharedContent.header && this.pageSettings.headerFooter.headerEnabled) {
    //       const headerRegion = pageComponent.find('[data-shared-region="header"]')[0]
    //       if (headerRegion && this.sharedContent.header.components.length > 0) {
    //         // Clear existing content
    //         headerRegion.components().reset()

    //         // Restore components
    //         this.sharedContent.header.components.forEach((compData) => {
    //           try {
    //             const newComponent = headerRegion.append(compData.html)[0]
    //             if (newComponent) {
    //               if (compData.styles) {
    //                 newComponent.setStyle(compData.styles)
    //               }
    //               if (compData.attributes) {
    //                 Object.keys(compData.attributes).forEach((key) => {
    //                   newComponent.addAttributes({ [key]: compData.attributes[key] })
    //                 })
    //               }
    //             }
    //           } catch (error) {
    //             console.error("Error restoring shared header component:", error)
    //           }
    //         })
    //       }
    //     }

    //     // Restore footer content
    //     if (this.sharedContent.footer && this.pageSettings.headerFooter.footerEnabled) {
    //       const footerRegion = pageComponent.find('[data-shared-region="footer"]')[0]
    //       if (footerRegion && this.sharedContent.footer.components.length > 0) {
    //         // Clear existing content
    //         footerRegion.components().reset()

    //         // Restore components
    //         this.sharedContent.footer.components.forEach((compData) => {
    //           try {
    //             const newComponent = footerRegion.append(compData.html)[0]
    //             if (newComponent) {
    //               if (compData.styles) {
    //                 newComponent.setStyle(compData.styles)
    //               }
    //               if (compData.attributes) {
    //                 Object.keys(compData.attributes).forEach((key) => {
    //                   newComponent.addAttributes({ [key]: compData.attributes[key] })
    //                 })
    //               }
    //             }
    //           } catch (error) {
    //             console.error("Error restoring shared footer component:", error)
    //           }
    //         })
    //       }
    //     }
    //   })
    // } catch (error) {
    //   console.error("Error restoring shared content:", error)
    // }
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
      return;
    }

    if (this._syncInProgress) return;
    this._syncInProgress = true;

    try {
      const allRegions = this.editor.getWrapper().find(`[data-shared-region="${regionType}"]`);
      if (allRegions.length <= 1) {
        this._syncInProgress = false;
        return;
      }

      const sourceComponents = sourceRegion.components();
      const sourceAttributes = sourceRegion.getAttributes();


      allRegions.forEach((targetRegion) => {
        if (targetRegion === sourceRegion) return;

        // Mark region as “silent” to prevent triggering trait/component listeners
        targetRegion._silentSync = true;

        targetRegion.components().reset();
        sourceComponents.forEach((comp) => {
          const clonedComp = comp.clone();
          targetRegion.append(clonedComp);
        });

        const filteredAttributes = { ...sourceAttributes };
        delete filteredAttributes["data-shared-region"];
        Object.keys(filteredAttributes).forEach((key) => {
          targetRegion.addAttributes({ [key]: filteredAttributes[key] });
        });

        // Remove silent flag after sync
        delete targetRegion._silentSync;
      });

    } catch (error) {
      console.error(`❌ Error syncing shared region ${regionType}:`, error);
    } finally {
      this._syncInProgress = false;
    }
  }


  resetTextChangeFlags() {
    this._headerTextChanged = false;
    this._footerTextChanged = false;
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

  setupContentBoundaryEnforcement() {
    const pages = document.querySelectorAll('.page-wrapper');

    pages.forEach((page, index) => {
      const contentArea = page.querySelector('.content-area');
      if (!contentArea) return;

      // Calculate available height accounting for headers/footers
      const availableHeight = this.calculateAvailableContentHeight(page);
      contentArea.style.maxHeight = `${availableHeight}mm`;
      contentArea.style.overflow = 'hidden';

      observer.observe(contentArea, {
        childList: true,
        subtree: true,
        characterData: true
      });
    });

    // Prevent content from being added outside page boundaries
    this.editor.on("component:add", (component) => {
      if (this.isInitialized) {
        setTimeout(() => {
          this.enforceContentBoundaries()
        }, 100)
      }
    })

    this.editor.on("component:update", (component) => {
      if (this.isInitialized) {
        setTimeout(() => {
          this.enforceContentBoundaries()
        }, 100)
      }
    })

    // Enhanced boundary enforcement - prevent adding content outside pages
    this.editor.on("component:drag:start", (component) => {
      if (this.isInitialized) {
        this.setupDragBoundaries()
      }
    })
    
  }

  // enforceContentBoundaries() {
  //   if (!this.isInitialized) return

  //   const canvasBody = this.editor.Canvas.getBody()
  //   const pageElements = canvasBody.querySelectorAll(".page-container")

  //   // Check for content outside all pages
  //   const allComponents = this.editor.getWrapper().components()

  //   allComponents.forEach((component) => {
  //     const componentEl = component.getEl()
  //     if (!componentEl || componentEl.classList.contains("page-container")) return

  //     let isInsidePage = false
  //     pageElements.forEach((pageElement) => {
  //       const pageRect = pageElement.getBoundingClientRect()
  //       const componentRect = componentEl.getBoundingClientRect()

  //       if (
  //         componentRect.left >= pageRect.left &&
  //         componentRect.right <= pageRect.right &&
  //         componentRect.top >= pageRect.top &&
  //         componentRect.bottom <= pageRect.bottom
  //       ) {
  //         isInsidePage = true
  //       }
  //     })

  //     if (!isInsidePage) {
  //       // Show error and remove component
  //       this.showBoundaryError()
  //       component.remove()
  //       return
  //     }
  //   })

  //   pageElements.forEach((pageElement, pageIndex) => {
  //     const pageContent = pageElement.querySelector(".main-content-area")
  //     if (pageContent) {
  //       // Get all child elements in the main content area
  //       const children = pageContent.querySelectorAll("*")
  //       children.forEach((child) => {
  //         const rect = child.getBoundingClientRect()
  //         const pageRect = pageContent.getBoundingClientRect()

  //         // Check if element is outside page boundaries
  //         if (
  //           rect.right > pageRect.right ||
  //           rect.bottom > pageRect.bottom ||
  //           rect.left < pageRect.left ||
  //           rect.top < pageRect.top
  //         ) {
  //           // Show error and adjust element position to stay within boundaries
  //           this.showBoundaryError()

  //           const style = window.getComputedStyle(child)
  //           const left = Number.parseInt(style.left) || 0
  //           const top = Number.parseInt(style.top) || 0

  //           if (rect.right > pageRect.right) {
  //             child.style.left = Math.max(0, left - (rect.right - pageRect.right)) + "px"
  //           }
  //           if (rect.bottom > pageRect.bottom) {
  //             child.style.top = Math.max(0, top - (rect.bottom - pageRect.bottom)) + "px"
  //           }
  //           if (rect.left < pageRect.left) {
  //             child.style.left = Math.max(0, left + (pageRect.left - rect.left)) + "px"
  //           }
  //           if (rect.top < pageRect.top) {
  //             child.style.top = Math.max(0, top + (pageRect.top - rect.top)) + "px"
  //           }
  //         }
  //       })
  //     }
  //   })
  // }

   enforceContentBoundaries(){}
  setupStrictBoundaryEnforcement() {
    const editor = this.editor;
    const domc = editor.DomComponents;
    const canvasBody = editor.Canvas.getBody();

    // 1️⃣ Prevent components from being created outside main-content-area
    editor.on('component:create', (component) => {
      const el = component.getEl();
      if (!el) return;

      const insideMain = el.closest('.main-content-area');
      const insidePage = el.closest('.page-container');

      if (!insideMain || !insidePage) {
        console.warn('🚫 Blocked component creation outside page boundaries');
        component.remove(); // instantly remove
        this.showBoundaryError?.();
      }
    });

    // 2️⃣ Reject drag drops before they happen
    editor.on('drag:drag', (dragData) => {
      const target = dragData?.target;
      const validTarget = target?.closest?.('.main-content-area');
      if (!validTarget) {
        dragData.abort = true; // stops GrapesJS drag logic
        console.warn('🚫 Drop prevented outside main-content-area');
      }
    });

    // 3️⃣ Re-check on drop event (fallback)
    editor.on('canvas:drop', (data) => {
      const droppedEl = data?.target?.closest?.('.main-content-area');
      if (!droppedEl) {
        console.warn('🚫 Drop rejected — outside any page');
        if (data?.component) data.component.remove();
        this.showBoundaryError?.();
      }
    });

    // 4️⃣ Mark main-content-area as the only droppable area
    const allMainAreas = canvasBody.querySelectorAll('.page-container .main-content-area');
    allMainAreas.forEach((el) => {
      el.setAttribute('data-droppable', 'true');
      el.style.position = 'relative';
    });

    // 5️⃣ Disable drops anywhere else
    const allCanvasChildren = [...canvasBody.children];
    allCanvasChildren.forEach((child) => {
      if (!child.classList.contains('page-container')) {
        child.removeAttribute('data-droppable');
        child.setAttribute('data-droppable', 'false');
      }
    });
  }

  setupCanvasObserver() {
    // Observer to watch for canvas changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList" && this.isInitialized) {
          setTimeout(() => {
            this.updateAllPageVisuals()
            this.enforceContentBoundaries();
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

.watermark-text-position-option.selected{
background-color: #007cba;
  color: white;
}

.watermark-image-position-option.selected{
background-color: #007cba;
  color: white;
}

.watermark-text-position-option{
padding: 8px;
    border: 2px solid #e9ecef;
    border-radius: 4px;
    text-align: center;
    cursor: pointer;
    font-size: 11px;
    transition: all 0.2s;
    color: #000 !important;
}

.watermark-image-position-option{
padding: 8px;
    border: 2px solid #e9ecef;
    border-radius: 4px;
    text-align: center;
    cursor: pointer;
    font-size: 11px;
    transition: all 0.2s;
    color: #000 !important;
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

  resetInitialSetupModalInputs() {
    const modal = document.getElementById("pageSetupModal");
    if (!modal) return;

    // Page format & orientation
    document.getElementById("pageFormat").value = "a4";
    document.getElementById("pageOrientation").value = "portrait";
    document.getElementById("numberOfPages").value = 1;
    // document.getElementById("pageBackgroundColor").value = "#ffffff";
    const bgInput = document.getElementById("pageBackgroundColor");
    if (bgInput) {
      bgInput.value = "#ffffff";
      const preview = document.getElementById("backgroundColorPreview");
      if (preview) preview.style.backgroundColor = "#ffffff";
    }

    // Header & footer
    document.getElementById("headerEnabled").checked = true;
    document.getElementById("headerHeight").value = 12.7;

    document.getElementById("footerEnabled").checked = true;
    document.getElementById("footerHeight").value = 12.7;

    // Margins
    document.getElementById("marginTop").value = 0;
    document.getElementById("marginBottom").value = 0;
    document.getElementById("marginLeft").value = 0;
    document.getElementById("marginRight").value = 0;

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
        // Validate max 10 pages on input change
        const value = Number.parseInt(e.target.value);
        if (value > 10) {
          e.target.value = 10;
          alert("⚠️ Maximum 10 pages allowed in initial creation. You can add more pages later.");
        }
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
    const format = document.getElementById("pageFormat").value;
    const orientation = document.getElementById("pageOrientation").value;
    let numberOfPages = Number.parseInt(document.getElementById("numberOfPages").value) || 1;

    // ===== LIMIT TO 10 PAGES =====
    const MAX_PAGES = 10;
    if (numberOfPages > MAX_PAGES) {
      alert(`⚠️ Maximum ${MAX_PAGES} pages allowed in initial creation. You requested ${numberOfPages} pages.\n\nYou can add more pages later using the "Add Page" button.`);
      numberOfPages = MAX_PAGES;
      // Update the input field to reflect the limit
      const numberOfPagesInput = document.getElementById("numberOfPages");
      if (numberOfPagesInput) {
        numberOfPagesInput.value = MAX_PAGES;
      }
    }

    console.time("PageCreationTime");
    const backgroundColor = document.getElementById("pageBackgroundColor")?.value || "#ffffff";

    // Header/footer settings
    const headerEnabled = document.getElementById("headerEnabled")?.checked !== false;
    const footerEnabled = document.getElementById("footerEnabled")?.checked !== false;
    const headerHeight = Number.parseFloat(document.getElementById("headerHeight")?.value) || 12.7;
    const footerHeight = Number.parseFloat(document.getElementById("footerHeight")?.value) || 12.7;

    // Margins
    const margins = {
      top: Number.parseFloat(document.getElementById("marginTop").value) || 0,
      bottom: Number.parseFloat(document.getElementById("marginBottom").value) || 0,
      left: Number.parseFloat(document.getElementById("marginLeft").value) || 0,
      right: Number.parseFloat(document.getElementById("marginRight").value) || 0,
    };

    // Page numbering
    const pageNumberingEnabled = document.getElementById("enablePageNumbering")?.checked || false;
    const startFromPage = Number.parseInt(document.getElementById("startFromPage")?.value) || 1;

    // Watermark
    const watermarkEnabled = document.getElementById("enableWatermark")?.checked || false;
    const watermarkType = document.querySelector(".watermark-type-btn.active")?.dataset.type || "text";
    const watermarkTextPosition = document.querySelector(".watermark-text-position-option.selected")?.dataset.position || "center";
    const watermarkImagePosition = document.querySelector(".watermark-image-position-option.selected")?.dataset.position || "center";

    let width, height;
    if (format === "custom") {
      width = Number.parseFloat(document.getElementById("customWidth").value) || 210;
      height = Number.parseFloat(document.getElementById("customHeight").value) || 297;
    } else {
      const dimensions = this.pageFormats[format] || this.pageFormats.a4;
      width = orientation === "landscape" ? dimensions.height : dimensions.width;
      height = orientation === "landscape" ? dimensions.width : dimensions.height;
    }

    // Update main pageSettings
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
        startFromPage,
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
          rotation: Number.parseInt(document.getElementById("watermarkRotation")?.value) || 0,
        },
        image: {
          url: document.getElementById("watermarkImageUrl")?.value || "",
          width: Number.parseInt(document.getElementById("watermarkImageWidth")?.value) || 200,
          height: Number.parseInt(document.getElementById("watermarkImageHeight")?.value) || 200,
          opacity: Number.parseFloat(document.getElementById("watermarkImageOpacity")?.value) / 100 || 0.3,
          rotation: Number.parseInt(document.getElementById("watermarkImageRotation")?.value) || 0,
        },
        textPosition: watermarkTextPosition,    // Separate position for text
        imagePosition: watermarkImagePosition,  // Separate position for image
        position: watermarkType === "text" ? watermarkTextPosition : watermarkImagePosition, // Fallback
        applyToAllPages: true,
        tiled: document.getElementById("watermarkTiled")?.checked || false,
      },
    };

    // ---------------- Batch Page Creation ----------------
    let created = 0;
    const batchSize = 5; // pages per batch

    // Close modal immediately
    const modal = document.getElementById("pageSetupModal");
    if (modal) modal.style.display = "none";

    const createBatch = () => {
      for (let i = 0; i < batchSize && created < numberOfPages; i++, created++) {
        const pageIndex = created;
        this.pageSettings.pages.push({
          id: `page-${pageIndex + 1}`,
          name: `Page ${pageIndex + 1}`,
          pageNumber: pageIndex + 1,
          backgroundColor,
          header: {
            enabled: headerEnabled,
            content: "",
            height: headerHeight,
            padding: 10,
            fontSize: 12,
            color: "#333333",
            backgroundColor,
            position: "center",
          },
          footer: {
            enabled: footerEnabled,
            content: "",
            height: footerHeight,
            padding: 10,
            fontSize: 12,
            color: "#333333",
            backgroundColor,
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
        });
      }

      // render current batch

      if (created < numberOfPages) {
        setTimeout(createBatch, 50); // schedule next batch
      } else {
        this.setupEditorPages();
        this.isInitialized = true;
        this.updateNavbarButton();
        this.updateAddPageButton();
        console.timeEnd("PageCreationTime");

        // Show info message if limit was reached
        if (numberOfPages === MAX_PAGES) {
          setTimeout(() => {
          }, 500);
        }
      }
    };

    createBatch(); // start batch creation
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

     <!-- Replace the watermark section in showPageElementsSettings() -->

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
    
    <!-- TEXT WATERMARK CONTROLS -->
    <div id="settingsWatermarkTextControls" style="display: ${this.pageSettings.watermark.type === "text" || this.pageSettings.watermark.type === "both" ? "block" : "none"};">
      <h4 style="margin-top: 15px; color: #333;">Text Watermark</h4>
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
      
      <!-- TEXT POSITION GRID -->
      <div class="page-setup-row">
        <label class="page-setup-label">Text Position:</label>
        <div class="position-grid watermark-text-position-grid">
          <div class="watermark-text-position-option ${(this.pageSettings.watermark.textPosition || this.pageSettings.watermark.position) === "top-left" ? "selected" : ""}" data-position="top-left">Top Left</div>
          <div class="watermark-text-position-option ${(this.pageSettings.watermark.textPosition || this.pageSettings.watermark.position) === "top-center" ? "selected" : ""}" data-position="top-center">Top Center</div>
          <div class="watermark-text-position-option ${(this.pageSettings.watermark.textPosition || this.pageSettings.watermark.position) === "top-right" ? "selected" : ""}" data-position="top-right">Top Right</div>
          <div class="watermark-text-position-option ${(this.pageSettings.watermark.textPosition || this.pageSettings.watermark.position) === "center-left" ? "selected" : ""}" data-position="center-left">Center Left</div>
          <div class="watermark-text-position-option ${(this.pageSettings.watermark.textPosition || this.pageSettings.watermark.position) === "center" ? "selected" : ""}" data-position="center">Center</div>
          <div class="watermark-text-position-option ${(this.pageSettings.watermark.textPosition || this.pageSettings.watermark.position) === "center-right" ? "selected" : ""}" data-position="center-right">Center Right</div>
          <div class="watermark-text-position-option ${(this.pageSettings.watermark.textPosition || this.pageSettings.watermark.position) === "bottom-left" ? "selected" : ""}" data-position="bottom-left">Bottom Left</div>
          <div class="watermark-text-position-option ${(this.pageSettings.watermark.textPosition || this.pageSettings.watermark.position) === "bottom-center" ? "selected" : ""}" data-position="bottom-center">Bottom Center</div>
          <div class="watermark-text-position-option ${(this.pageSettings.watermark.textPosition || this.pageSettings.watermark.position) === "bottom-right" ? "selected" : ""}" data-position="bottom-right">Bottom Right</div>
        </div>
      </div>
    </div>

    <!-- IMAGE WATERMARK CONTROLS -->
    <div id="settingsWatermarkImageControls" style="display: ${this.pageSettings.watermark.type === "image" || this.pageSettings.watermark.type === "both" ? "block" : "none"};">
      <h4 style="margin-top: 15px; color: #333;">Image Watermark</h4>
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
        <div>
          <label>Opacity:</label>
          <input type="range" id="settingsWatermarkImageOpacity" class="page-setup-control" 
            value="${Math.round((this.pageSettings.watermark.image.opacity || 0.4) * 100)}" min="10" max="80">
        </div>
        <div>
          <label>Rotation:</label>
          <input type="range" id="settingsWatermarkImageRotation" class="page-setup-control" 
            value="${this.pageSettings.watermark.image.rotation || 0}" min="-90" max="90">
        </div>
      </div>
      
      <!-- IMAGE POSITION GRID -->
      <div class="page-setup-row">
        <label class="page-setup-label">Image Position:</label>
        <div class="position-grid watermark-image-position-grid">
          <div class="watermark-image-position-option ${(this.pageSettings.watermark.imagePosition || this.pageSettings.watermark.position) === "top-left" ? "selected" : ""}" data-position="top-left">Top Left</div>
          <div class="watermark-image-position-option ${(this.pageSettings.watermark.imagePosition || this.pageSettings.watermark.position) === "top-center" ? "selected" : ""}" data-position="top-center">Top Center</div>
          <div class="watermark-image-position-option ${(this.pageSettings.watermark.imagePosition || this.pageSettings.watermark.position) === "top-right" ? "selected" : ""}" data-position="top-right">Top Right</div>
          <div class="watermark-image-position-option ${(this.pageSettings.watermark.imagePosition || this.pageSettings.watermark.position) === "center-left" ? "selected" : ""}" data-position="center-left">Center Left</div>
          <div class="watermark-image-position-option ${(this.pageSettings.watermark.imagePosition || this.pageSettings.watermark.position) === "center" ? "selected" : ""}" data-position="center">Center</div>
          <div class="watermark-image-position-option ${(this.pageSettings.watermark.imagePosition || this.pageSettings.watermark.position) === "center-right" ? "selected" : ""}" data-position="center-right">Center Right</div>
          <div class="watermark-image-position-option ${(this.pageSettings.watermark.imagePosition || this.pageSettings.watermark.position) === "bottom-left" ? "selected" : ""}" data-position="bottom-left">Bottom Left</div>
          <div class="watermark-image-position-option ${(this.pageSettings.watermark.imagePosition || this.pageSettings.watermark.position) === "bottom-center" ? "selected" : ""}" data-position="bottom-center">Bottom Center</div>
          <div class="watermark-image-position-option ${(this.pageSettings.watermark.imagePosition || this.pageSettings.watermark.position) === "bottom-right" ? "selected" : ""}" data-position="bottom-right">Bottom Right</div>
        </div>
      </div>
    </div>

    <!-- TILED OPTION -->
    <div class="page-setup-row">
      <label>
        <input type="checkbox" id="settingsWatermarkTiled" ${this.pageSettings.watermark.tiled ? "checked" : ""}> 
        Tiled Watermark (Repeat across page)
      </label>
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
      }

      // 8. Position grid - restore selected position
      const savedPosition = pageNumberSettings.position || "bottom-center";
      setTimeout(() => {
        const allPositionOptions = document.querySelectorAll(".position-option");
        allPositionOptions.forEach(opt => {
          opt.classList.remove("selected");
          if (opt.getAttribute("data-position") === savedPosition) {
            opt.classList.add("selected");
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

    const pageNumberInputs = ['pageNumberEnabled', 'pageNumberStartFrom', 'pageNumberFormat',
      'pageNumberFontSize', 'pageNumberColor', 'pageNumberBackgroundColor',
      'pageNumberShowBorder'];

    pageNumberInputs.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener('change', () => {
          // Update the setting in pageSettings first
          // this.updatePageNumberSetting(id, element);

          // Re-render page numbers
          setTimeout(() => this.renderPageNumbers(), 100);
        });
      }
    });

    // Position grid listener
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('position-option')) {
        const parent = e.target.parentElement;
        if (parent.classList.contains('position-grid')) {
          // Update position setting
          this.pageSettings.pageNumber = this.pageSettings.pageNumber || {};
          this.pageSettings.pageNumber.position = e.target.getAttribute('data-position');

          // Re-render if enabled
          if (this.pageSettings.pageNumber.enabled) {
            setTimeout(() => this.renderPageNumbers(), 100);
          }
        }
      }
    });

    // === Header Text Input Listener ===
    const headerTextInput = document.getElementById("settingsHeaderText");
    if (headerTextInput) {
      headerTextInput.addEventListener("input", (e) => {
        // Always mark as changed when user types
        this._headerTextChanged = true;

        // Ensure pageSettings.pages[0].header exists
        if (!this.pageSettings.pages[0].header) {
          this.pageSettings.pages[0].header = {};
        }
        this.pageSettings.pages[0].header.text = e.target.value;
      });

      // Also detect when user focuses and changes the field
      headerTextInput.addEventListener("focus", () => {
        this._headerTextOriginal = headerTextInput.value;
      });

      headerTextInput.addEventListener("blur", () => {
        if (headerTextInput.value !== this._headerTextOriginal) {
          this._headerTextChanged = true;
        }
      });
    }

    // === Footer Text Input Listener ===
    const footerTextInput = document.getElementById("settingsFooterText");
    if (footerTextInput) {
      footerTextInput.addEventListener("input", (e) => {
        // Always mark as changed when user types
        this._footerTextChanged = true;

        // Ensure pageSettings.pages[0].footer exists
        if (!this.pageSettings.pages[0].footer) {
          this.pageSettings.pages[0].footer = {};
        }
        this.pageSettings.pages[0].footer.text = e.target.value;
      });

      // Also detect when user focuses and changes the field
      footerTextInput.addEventListener("focus", () => {
        this._footerTextOriginal = footerTextInput.value;
      });

      footerTextInput.addEventListener("blur", () => {
        if (footerTextInput.value !== this._footerTextOriginal) {
          this._footerTextChanged = true;
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
      });
    }

    // Page Number Position Listener
    document.querySelectorAll(".position-option").forEach((el) => {
      el.addEventListener("click", () => {
        // Only affect page number position options (not watermark)
        const parent = el.parentElement;
        if (parent.classList.contains("position-grid") && !parent.classList.contains("watermark-text-position-grid") && !parent.classList.contains("watermark-image-position-grid")) {
          parent.querySelectorAll(".position-option").forEach((opt) =>
            opt.classList.remove("selected")
          );
          el.classList.add("selected");

          // Initialize if doesn't exist
          if (!this.pageSettings.pageNumber) {
            this.pageSettings.pageNumber = {};
          }
          this.pageSettings.pageNumber.position = el.getAttribute("data-position");
        }
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
      });
    }

    const bgColorInput = document.getElementById("pageNumberBackgroundColor");
    if (bgColorInput) {
      bgColorInput.addEventListener("input", (e) => {
        if (!this.pageSettings.pageNumber) {
          this.pageSettings.pageNumber = {};
        }
        this.pageSettings.pageNumber.backgroundColor = e.target.value;
      });
    }

    const borderToggle = document.getElementById("pageNumberShowBorder");
    if (borderToggle) {
      borderToggle.addEventListener("change", (e) => {
        if (!this.pageSettings.pageNumber) {
          this.pageSettings.pageNumber = {};
        }
        this.pageSettings.pageNumber.showBorder = e.target.checked;
      });
    }

    // === Watermark Text Settings Listeners ===
    const watermarkTextInput = document.getElementById("settingsWatermarkText");
    if (watermarkTextInput) {
      watermarkTextInput.addEventListener("input", (e) => {
        if (!this.pageSettings.watermark) {
          this.pageSettings.watermark = {};
        }
        if (!this.pageSettings.watermark.text) {
          this.pageSettings.watermark.text = {};
        }
        this.pageSettings.watermark.text.content = e.target.value;
      });
    }

    const watermarkFontSizeInput = document.getElementById("settingsWatermarkFontSize");
    if (watermarkFontSizeInput) {
      watermarkFontSizeInput.addEventListener("input", (e) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value)) {
          if (!this.pageSettings.watermark) {
            this.pageSettings.watermark = {};
          }
          if (!this.pageSettings.watermark.text) {
            this.pageSettings.watermark.text = {};
          }
          this.pageSettings.watermark.text.fontSize = value;
        }
      });
    }

    const watermarkColorInput = document.getElementById("settingsWatermarkColor");
    if (watermarkColorInput) {
      watermarkColorInput.addEventListener("input", (e) => {
        if (!this.pageSettings.watermark) {
          this.pageSettings.watermark = {};
        }
        if (!this.pageSettings.watermark.text) {
          this.pageSettings.watermark.text = {};
        }
        this.pageSettings.watermark.text.color = e.target.value;
      });
    }

    const textOpacityInput = document.getElementById("settingsWatermarkOpacity");
    if (textOpacityInput) {
      textOpacityInput.addEventListener("input", (e) => {
        if (!this.pageSettings.watermark) {
          this.pageSettings.watermark = {};
        }
        if (!this.pageSettings.watermark.text) {
          this.pageSettings.watermark.text = {};
        }
        this.pageSettings.watermark.text.opacity = parseInt(e.target.value) / 100;
      });
    }

    const textRotationInput = document.getElementById("settingsWatermarkRotation");
    if (textRotationInput) {
      textRotationInput.addEventListener("input", (e) => {
        if (!this.pageSettings.watermark) {
          this.pageSettings.watermark = {};
        }
        if (!this.pageSettings.watermark.text) {
          this.pageSettings.watermark.text = {};
        }
        this.pageSettings.watermark.text.rotation = parseInt(e.target.value);
      });
    }

    // === Watermark Image Settings Listeners ===
    const imageUrlInput = document.getElementById("settingsWatermarkImageUrl");
    if (imageUrlInput) {
      imageUrlInput.addEventListener("input", (e) => {
        if (!this.pageSettings.watermark) {
          this.pageSettings.watermark = {};
        }
        if (!this.pageSettings.watermark.image) {
          this.pageSettings.watermark.image = {};
        }
        this.pageSettings.watermark.image.url = e.target.value;
      });
    }

    const imageWidthInput = document.getElementById("settingsWatermarkImageWidth");
    if (imageWidthInput) {
      imageWidthInput.addEventListener("input", (e) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value)) {
          if (!this.pageSettings.watermark) {
            this.pageSettings.watermark = {};
          }
          if (!this.pageSettings.watermark.image) {
            this.pageSettings.watermark.image = {};
          }
          this.pageSettings.watermark.image.width = value;
        }
      });
    }

    const imageHeightInput = document.getElementById("settingsWatermarkImageHeight");
    if (imageHeightInput) {
      imageHeightInput.addEventListener("input", (e) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value)) {
          if (!this.pageSettings.watermark) {
            this.pageSettings.watermark = {};
          }
          if (!this.pageSettings.watermark.image) {
            this.pageSettings.watermark.image = {};
          }
          this.pageSettings.watermark.image.height = value;
        }
      });
    }

    const imageOpacityInput = document.getElementById("settingsWatermarkImageOpacity");
    if (imageOpacityInput) {
      imageOpacityInput.addEventListener("input", (e) => {
        if (!this.pageSettings.watermark) {
          this.pageSettings.watermark = {};
        }
        if (!this.pageSettings.watermark.image) {
          this.pageSettings.watermark.image = {};
        }
        this.pageSettings.watermark.image.opacity = parseInt(e.target.value) / 100;
      });
    }

    const imageRotationInput = document.getElementById("settingsWatermarkImageRotation");
    if (imageRotationInput) {
      imageRotationInput.addEventListener("input", (e) => {
        if (!this.pageSettings.watermark) {
          this.pageSettings.watermark = {};
        }
        if (!this.pageSettings.watermark.image) {
          this.pageSettings.watermark.image = {};
        }
        this.pageSettings.watermark.image.rotation = parseInt(e.target.value);
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

    // === Global Click Event Delegation ===
    document.addEventListener("click", (e) => {
      // Page Number Position Handling
      if (e.target.classList.contains("position-option")) {
        const selectedPosition = e.target.getAttribute("data-position");
        const parent = e.target.parentElement;

        // Update visuals - only for position grids (page numbers)
        if (parent.classList.contains("position-grid") && !parent.classList.contains("watermark-text-position-grid") && !parent.classList.contains("watermark-image-position-grid")) {
          parent.querySelectorAll(".position-option").forEach((opt) => opt.classList.remove("selected"));
          e.target.classList.add("selected");

          // Persist selected position
          if (!this.pageSettings.pageNumber) {
            this.pageSettings.pageNumber = {};
          }
          this.pageSettings.pageNumber.position = selectedPosition;
        }
      }

      // === TEXT WATERMARK POSITION HANDLING ===
      if (e.target.classList.contains("watermark-text-position-option")) {
        // Remove selection from all text position options
        document.querySelectorAll(".watermark-text-position-option").forEach((opt) =>
          opt.classList.remove("selected")
        );
        e.target.classList.add("selected");

        // Store text position separately
        this.pageSettings.watermark = this.pageSettings.watermark || {};
        this.pageSettings.watermark.textPosition = e.target.getAttribute("data-position");
      }

      // === IMAGE WATERMARK POSITION HANDLING ===
      if (e.target.classList.contains("watermark-image-position-option")) {
        // Remove selection from all image position options
        document.querySelectorAll(".watermark-image-position-option").forEach((opt) =>
          opt.classList.remove("selected")
        );
        e.target.classList.add("selected");

        // Store image position separately
        this.pageSettings.watermark = this.pageSettings.watermark || {};
        this.pageSettings.watermark.imagePosition = e.target.getAttribute("data-position");
      }

      // Watermark Type Button Handling
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

      // Background Color Preview Handling
      if (e.target.id === "settingsBackgroundColorPreview") {
        const colorInput = document.getElementById("settingsPageBackgroundColor");
        if (colorInput) {
          colorInput.click();
        }
      }
    });

    // === Global Change Event Delegation ===
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

          };
          reader.readAsDataURL(file);
        }
      });
    }

    // === Button Click Handlers ===
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
      // 1️⃣ Preserve current page content
      this.preserveAllContent();

      // 2️⃣ Get all form values
      const marginTop = Math.max(0, parseFloat(document.getElementById("settingsMarginTop")?.value) || 0);
      const marginBottom = Math.max(0, parseFloat(document.getElementById("settingsMarginBottom")?.value) || 0);
      const marginLeft = Math.max(0, parseFloat(document.getElementById("settingsMarginLeft")?.value) || 0);
      const marginRight = Math.max(0, parseFloat(document.getElementById("settingsMarginRight")?.value) || 0);
      const newBackgroundColor = document.getElementById("settingsPageBackgroundColor")?.value || "#ffffff";

      // --- Header settings ---
      const headerEnabled = document.getElementById("settingsHeaderEnabled")?.checked !== false;
      const headerHeight = Math.max(5, Math.min(50, parseFloat(document.getElementById("settingsHeaderHeight")?.value) || 12.7));
      const headerApplyMode = document.getElementById("headerApplyMode")?.value || "all";
      const headerCustomPageList = document.getElementById("headerCustomPageList")?.value || "";
      const headerText = document.getElementById("settingsHeaderText")?.value || "";

      // --- Footer settings ---
      const footerEnabled = document.getElementById("settingsFooterEnabled")?.checked !== false;
      const footerHeight = Math.max(5, Math.min(50, parseFloat(document.getElementById("settingsFooterHeight")?.value) || 12.7));
      const footerApplyMode = document.getElementById("footerApplyMode")?.value || "all";
      const footerCustomPageList = document.getElementById("footerCustomPageList")?.value || "";
      const footerText = document.getElementById("settingsFooterText")?.value || "";

      // --- Page Number settings ---
      const pageNumberEnabled = document.getElementById("pageNumberEnabled")?.checked || false;
      const pageNumberStartFrom = parseInt(document.getElementById("pageNumberStartFrom")?.value || "1", 10);
      const pageNumberFormat = document.getElementById("pageNumberFormat")?.value || "Page {n}";
      const pageNumberPosition = document.querySelector(".position-option.selected")?.dataset?.position || "bottom-center";
      const storedPageNumber = this.pageSettings.pageNumber || {};
      const pageNumberFontSize = storedPageNumber.fontSize || parseInt(document.getElementById("pageNumberFontSize")?.value || "11", 10);
      const pageNumberColor = storedPageNumber.color || document.getElementById("pageNumberColor")?.value || "#333333";
      const pageNumberBackgroundColor = storedPageNumber.backgroundColor || document.getElementById("pageNumberBackgroundColor")?.value || "#ffffff";
      const pageNumberShowBorder = storedPageNumber.showBorder !== undefined ? storedPageNumber.showBorder : (document.getElementById("pageNumberShowBorder")?.checked || false);

      // --- Watermark settings ---
      const watermarkEnabled = document.getElementById("settingsWatermarkEnabled")?.checked || false;
      const watermarkType = document.querySelector(".watermark-type-btn.active")?.dataset?.type || "text";
      const watermarkTiled = document.getElementById("settingsWatermarkTiled")?.checked || false;

      // Text watermark settings
      const watermarkTextContent = document.getElementById("settingsWatermarkText")?.value || "CONFIDENTIAL";
      const watermarkFontSize = parseInt(document.getElementById("settingsWatermarkFontSize")?.value) || 36;
      const watermarkColor = document.getElementById("settingsWatermarkColor")?.value || "#000000";
      const watermarkOpacity = parseInt(document.getElementById("settingsWatermarkOpacity")?.value) / 100 || 0.4;
      const watermarkRotation = parseInt(document.getElementById("settingsWatermarkRotation")?.value) || 0;
      const watermarkTextPosition = document.querySelector(".watermark-text-position-option.selected")?.dataset?.position || "center";

      // Image watermark settings
      const watermarkImageUrl = document.getElementById("settingsWatermarkImageUrl")?.value || "";
      const watermarkImageWidth = parseInt(document.getElementById("settingsWatermarkImageWidth")?.value) || 200;
      const watermarkImageHeight = parseInt(document.getElementById("settingsWatermarkImageHeight")?.value) || 200;
      const watermarkImageOpacity = parseInt(document.getElementById("settingsWatermarkImageOpacity")?.value) / 100 || 0.4;
      const watermarkImageRotation = parseInt(document.getElementById("settingsWatermarkImageRotation")?.value) || 0;
      const watermarkImagePosition = document.querySelector(".watermark-image-position-option.selected")?.dataset?.position || "center";

      // --- Parse custom page lists ---
      const headerCustomPages = this.parsePageList(headerCustomPageList);
      const footerCustomPages = this.parsePageList(footerCustomPageList);

     

      // --- Store settings for persistence ---
      this._lastHeaderApplyMode = headerApplyMode;
      this._lastFooterApplyMode = footerApplyMode;
      this._lastHeaderCustomPageList = headerCustomPageList;
      this._lastFooterCustomPageList = footerCustomPageList;
      this._lastHeaderCustomPages = headerCustomPages;
      this._lastFooterCustomPages = footerCustomPages;

      // --- Update global page settings ---
      this.pageSettings.headerFooter = {
        headerEnabled,
        footerEnabled,
        headerHeight,
        footerHeight,
        headerText,
        footerText,
        headerApplyMode,
        footerApplyMode,
        headerCustomPages,
        footerCustomPages
      };

      this.pageSettings.margins = {
        top: marginTop,
        bottom: marginBottom,
        left: marginLeft,
        right: marginRight
      };

      this.pageSettings.backgroundColor = newBackgroundColor;

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

      // Store watermark settings with separate positions for text and image
      this.pageSettings.watermark = {
        enabled: watermarkEnabled,
        type: watermarkType,
        tiled: watermarkTiled,
        textPosition: watermarkTextPosition,    // Separate position for text
        imagePosition: watermarkImagePosition,  // Separate position for image
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
          height: watermarkImageHeight,
          opacity: watermarkImageOpacity,
          rotation: watermarkImageRotation
        }
      };

      // --- Update individual page settings before setup ---
      this.updateIndividualPageSettings();

      // --- Apply background color immediately for live preview ---
      this.applyBackgroundColorToPages(newBackgroundColor);

      // --- Preserve content for mode switch ---
      this.preserveContentForModeSwitch();

      // --- Setup pages ---
      this.setupEditorPages();

      // --- Restore content and update visuals ---
      this.restoreAllContent();
      this.restoreContentAfterModeSwitch();
      this.updateAllPageVisuals();

      // --- Re-apply background color after all visuals are rendered ---
      setTimeout(() => {
        this.applyBackgroundColorToPages(newBackgroundColor);

        // --- Apply conditional header/footer content ---
        setTimeout(() => {
          this.applyConditionalHeaderFooterContent();
          this.resetTextChangeFlags();
        }, 300);

      }, 250);

      // --- Close modal ---
      this.editor.Modal.close();

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
            } else {
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
            } else {
            }
          }
        }
      });

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

        
      }

    } catch (error) {
      console.error("❌ Error updating individual page settings:", error);
    }
  }

  applyBackgroundColorToPages(backgroundColor, specificPages = null) {
    // Apply background color to all existing page components or a subset of pages
    const allPageComponents = this.editor.getWrapper().find(".page-container");

    allPageComponents.forEach((pageComponent, index) => {
      if (specificPages && !specificPages.includes(index + 1)) return; // apply only to selected pages

      // Update page container background
      pageComponent.addStyle({
        background: backgroundColor,
        "background-color": backgroundColor,
      });

      // Update page content background
      const pageContentComponent = pageComponent.find(".page-content")[0];
      if (pageContentComponent) {
        pageContentComponent.addStyle({
          "background-color": backgroundColor,
        });
      }

      // Update header background if exists
      const headerComponent = pageComponent.find(".header-wrapper")[0];
      if (headerComponent) {
        headerComponent.addStyle({
          "background-color": backgroundColor,
        });

        const headerElement = headerComponent.find(".page-header-element")[0];
        if (headerElement) {
          headerElement.addStyle({
            background: backgroundColor,
            "background-color": backgroundColor,
          });
        }
      }

      // Update footer background if exists
      const footerComponent = pageComponent.find(".footer-wrapper")[0];
      if (footerComponent) {
        footerComponent.addStyle({
          "background-color": backgroundColor,
        });

        const footerElement = footerComponent.find(".page-footer-element")[0];
        if (footerElement) {
          footerElement.addStyle({
            background: backgroundColor,
            "background-color": backgroundColor,
          });
        }
      }
    });
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

  }

  // FIXED: Enhanced setupEditorPages method that properly creates headers/footers
  setupEditorPages() {
    try {
      // Clear any existing observers before creating new pages
      this.clearAllObservers();

      const mmToPx = 96 / 25.4;
      const totalPageWidth = Math.round(this.pageSettings.width * mmToPx);
      const totalPageHeight = Math.round(this.pageSettings.height * mmToPx);

      const marginTopPx = Math.round(this.pageSettings.margins.top * mmToPx);
      const marginBottomPx = Math.round(this.pageSettings.margins.bottom * mmToPx);
      const marginLeftPx = Math.round(this.pageSettings.margins.left * mmToPx);
      const marginRightPx = Math.round(this.pageSettings.margins.right * mmToPx);

      const contentWidth = totalPageWidth - marginLeftPx - marginRightPx;
      const contentHeight = totalPageHeight - marginTopPx - marginBottomPx;

      const defaultHeaderHeight = Math.round((this.pageSettings.headerFooter?.headerHeight || 12.7) * mmToPx);
      const defaultFooterHeight = Math.round((this.pageSettings.headerFooter?.footerHeight || 12.7) * mmToPx);
      const mainContentAreaHeight = contentHeight - defaultHeaderHeight - defaultFooterHeight;

      // Clear existing pages
      this.editor.getWrapper().components().reset();

      for (let i = 0; i < this.pageSettings.numberOfPages; i++) {
        const pageData = this.pageSettings.pages[i];
        const pageNumber = i + 1;
        const isEvenPage = pageNumber % 2 === 0;
        const isOddPage = pageNumber % 2 !== 0;
        const isFirstPage = pageNumber === 1;
        const isLastPage = pageNumber === this.pageSettings.numberOfPages;

        // Determine header/footer regions
        const headerApplyMode = this._lastHeaderApplyMode || "all";
        const footerApplyMode = this._lastFooterApplyMode || "all";

        let headerRegionType = "header";
        let footerRegionType = "footer";
        let headerCondition = "all";
        let footerCondition = "all";
        let headerLabel = "";
        let footerLabel = "";

        // ----- HEADER LOGIC -----
        if (headerApplyMode === "all") {
          headerCondition = "all";
          headerLabel = "Header (Shared across all pages)";
        } else if (headerApplyMode === "first") {
          headerCondition = isFirstPage ? "first" : "hidden";
          headerLabel = isFirstPage ? "First Page Header" : "Header (Hidden - First Page Only)";
        } else if (headerApplyMode === "last") {
          headerCondition = isLastPage ? "last" : "hidden";
          headerLabel = isLastPage ? "Last Page Header" : "Header (Hidden - Last Page Only)";
        } else if (headerApplyMode === "even") {
          headerCondition = isEvenPage ? "even" : "hidden";
          headerLabel = isEvenPage
            ? "Even Page Header (Pages 2, 4, 6...)"
            : "Header (Hidden - Even Pages Only)";
        } else if (headerApplyMode === "odd") {
          headerCondition = isOddPage ? "odd" : "hidden";
          headerLabel = isOddPage
            ? "Odd Page Header (Pages 1, 3, 5...)"
            : "Header (Hidden - Odd Pages Only)";
        } else if (headerApplyMode === "different") {
          headerCondition = isEvenPage ? "even" : "odd";
          headerLabel = isEvenPage ? "Even Page Header" : "Odd Page Header";
        } else if (headerApplyMode === "custom") {
          const headerCustomPages = this._lastHeaderCustomPages || [];
          const pageIsInCustomList = headerCustomPages.includes(pageNumber);
          headerCondition = pageIsInCustomList ? "custom" : "hidden";
          headerLabel = pageIsInCustomList
            ? `Custom Header (Page ${pageNumber})`
            : "Header (Hidden - Custom Range)";
        }

        // ----- FOOTER LOGIC -----
        if (footerApplyMode === "all") {
          footerCondition = "all";
          footerLabel = "Footer (Shared across all pages)";
        } else if (footerApplyMode === "first") {
          footerCondition = isFirstPage ? "first" : "hidden";
          footerLabel = isFirstPage ? "First Page Footer" : "Footer (Hidden - First Page Only)";
        } else if (footerApplyMode === "last") {
          footerCondition = isLastPage ? "last" : "hidden";
          footerLabel = isLastPage ? "Last Page Footer" : "Footer (Hidden - Last Page Only)";
        } else if (footerApplyMode === "even") {
          footerCondition = isEvenPage ? "even" : "hidden";
          footerLabel = isEvenPage
            ? "Even Page Footer (Pages 2, 4, 6...)"
            : "Footer (Hidden - Even Pages Only)";
        } else if (footerApplyMode === "odd") {
          footerCondition = isOddPage ? "odd" : "hidden";
          footerLabel = isOddPage
            ? "Odd Page Footer (Pages 1, 3, 5...)"
            : "Footer (Hidden - Odd Pages Only)";
        } else if (footerApplyMode === "different") {
          footerCondition = isEvenPage ? "even" : "odd";
          footerLabel = isEvenPage ? "Even Page Footer" : "Odd Page Footer";
        } else if (footerApplyMode === "custom") {
          const footerCustomPages = this._lastFooterCustomPages || [];
          const pageIsInCustomList = footerCustomPages.includes(pageNumber);
          footerCondition = pageIsInCustomList ? "custom" : "hidden";
          footerLabel = pageIsInCustomList
            ? `Custom Footer (Page ${pageNumber})`
            : "Footer (Hidden - Custom Range)";
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
            <div class="header-wrapper" data-shared-region="${headerRegionType}" data-condition="${headerCondition}" style="
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
            <div class="footer-wrapper" data-shared-region="${footerRegionType}" data-condition="${footerCondition}" style="
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

        // Create the page component
        const pageComponent = this.editor.getWrapper().append(pageHTML)[0];

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
        });

        // Configure components with proper settings
        const pageContentComponent = pageComponent.find(".page-content")[0];
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
          });
        }

        // Configure header component properties
        const headerElement = pageComponent.find(".page-header-element")[0];
        if (headerElement) {
          headerElement.set({
            droppable: true,
            editable: true,
            selectable: true,
            draggable: false,
            copyable: false,
            removable: false,
            "custom-name": headerLabel,
          });
        }

        // Configure main content area
        const mainContentArea = pageComponent.find(".main-content-area")[0];
        if (mainContentArea) {
          mainContentArea.set({
            droppable: true,
            editable: true,
            selectable: true,
            "custom-name": "Content Area",
          });
        }

        // Configure footer component properties
        const footerElement = pageComponent.find(".page-footer-element")[0];
        if (footerElement) {
          footerElement.set({
            droppable: true,
            editable: true,
            selectable: true,
            draggable: false,
            copyable: false,
            removable: false,
            "custom-name": footerLabel,
          });
        }

        // Setup observer with proper debouncing
        this.setupPageObserver(i);
      }

      // Setup the sections container listener
      this.setupSectionsContainerListener();

      this.setupCanvasScrolling();

      // Restore content after structure is ready
      setTimeout(() => {
        this.restoreAllContent();
        // this.startContentMonitoring();

        this.renderPageNumbers();
        this.setupStrictBoundaryEnforcement();

      
      }, 100);
    } catch (error) {
      console.error("❌ Error setting up Word-style editor pages:", error);
    }
  }


  /////////////////////////////////////// daynamic section added from here //////////////////////////////////////////////////////////////////////
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

      return matches;
    };

    // Listen to BlockManager events (when blocks are dragged from the panel)
    this.editor.BlockManager.getAll().models.forEach(block => {
      const blockId = block.get('id');
      if (sectionsRequiredBlocks.includes(blockId)) {
      } else if (regularContentBlocks.includes(blockId)) {
      }
    });

    // Listen for block drag start
    this.editor.on('block:drag:start.sections', (block) => {
      const blockId = block.get('id');

      if (sectionsRequiredBlocks.includes(blockId)) {
        // Set a flag that we're dragging a required block
        this._isDraggingRequiredBlock = true;
        this._draggedBlockId = blockId;
      } else {
        this._isDraggingRequiredBlock = false;
      }
    });

    // Listen for block drag stop
    this.editor.on('block:drag:stop.sections', (block) => {
      const blockId = block.get('id');

      if (this._isDraggingRequiredBlock && sectionsRequiredBlocks.includes(blockId)) {
        setTimeout(() => {
          this.addSectionsContainerToAllPages();
          this._isDraggingRequiredBlock = false;
          this._draggedBlockId = null;
        }, 300);
      } else {
        this._isDraggingRequiredBlock = false;
        this._draggedBlockId = null;
      }
    });

    // Listen for component additions (backup detection)
    this.editor.on('component:add.sections', (component) => {

      // Additional check for components that might be created from blocks
      const parent = component.parent();
      const isInMainContent = parent && (
        parent.getEl().classList.contains('main-content-area') ||
        parent.find('.main-content-area').length > 0
      );

      if (isInMainContent && requiresSections(component)) {
        setTimeout(() => {
          this.addSectionsContainerToAllPages();
        }, 200);
      }
    });

    // Listen for canvas changes (alternative detection method)
    this.editor.on('canvas:drop.sections', (dataTransfer, component) => {

      if (requiresSections(component)) {
        setTimeout(() => {
          this.addSectionsContainerToAllPages();
        }, 200);
      }
    });

    // Periodically check for required blocks (fallback method)
    this._sectionsCheckInterval = setInterval(() => {
      this.checkForRequiredBlocks();
    }, 3000);

  }

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
        }
      });
    });

    if (foundRequiredBlock) {
      this.addSectionsContainerToAllPages();
    }
  }

  addSectionsContainerToAllPages() {
    try {
      const wrapper = this.editor.getWrapper();
      const allPageComponents = wrapper.find('.page-container');


      for (let i = 0; i < allPageComponents.length; i++) {
        const pageComponent = allPageComponents[i];
        const mainContentArea = pageComponent.find('.main-content-area')[0];

        if (!mainContentArea) continue;

        const existingSections = mainContentArea.find('.sections-container');

        if (existingSections && existingSections.length > 0) {
          continue;
        }


        // Use the registered component type
        mainContentArea.append({
          type: 'Dynamic Header Footer'
        });

      }

      this.editor.trigger('change:canvasOffset');
    } catch (error) {
      console.error("Error adding sections:", error);
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

  /////////////////////////////////////// daynamic section ended from here //////////////////////////////////////////////////////////////////////


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
    this.setupStrictBoundaryEnforcement();
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


      const header = pageComponent.find('[data-shared-region="header"]')[0];
      if (header) {
        if (shouldSyncHeaders && pageHasHeaderContent) {
          this.syncSharedRegion("header", header);
        } else {
          header.setContent('');
        }
      }

      const footer = pageComponent.find('[data-shared-region="footer"]')[0];
      if (footer) {
        if (shouldSyncFooters && pageHasFooterContent) {
          this.syncSharedRegion("footer", footer);
        } else {
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

    }

    // Add padding between tiles (20% of tile size)
    const paddingX = tileWidth * 0.2;
    const paddingY = tileHeight * 0.2;

    const effectiveTileWidth = tileWidth + paddingX;
    const effectiveTileHeight = tileHeight + paddingY;

    // Calculate grid dimensions
    const cols = Math.max(1, Math.floor(pageWidthPx / effectiveTileWidth));
    const rows = Math.max(1, Math.floor(pageHeightPx / effectiveTileHeight));


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
    if (!this.pageSettings.watermark?.enabled) {
      return;
    }

    const watermark = this.pageSettings.watermark;

    let watermarkContent = "";
    let positionStyles = "";

    // ✅ Helper function for absolute placement
    const getAbsolutePosition = (position) => {
      switch (position) {
        case "top-left": return "top: 20px; left: 20px;";
        case "top-center": return "top: 20px; left: 50%; transform: translateX(-50%);";
        case "top-right": return "top: 20px; right: 20px;";
        case "center-left": return "top: 50%; left: 20px; transform: translateY(-50%);";
        case "center": return "top: 50%; left: 50%; transform: translate(-50%, -50%);";
        case "center-right": return "top: 50%; right: 20px; transform: translateY(-50%);";
        case "bottom-left": return "bottom: 20px; left: 20px;";
        case "bottom-center": return "bottom: 20px; left: 50%; transform: translateX(-50%);";
        case "bottom-right": return "bottom: 20px; right: 20px;";
        default: return "top: 50%; left: 50%; transform: translate(-50%, -50%);";
      }
    };

    // 🧩 Tiled Watermark
    if (watermark.tiled) {
      const gridInfo = this.calculateTiledGrid(watermark);

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
          opacity: ${watermark.image.opacity || 0.4} !important;
          transform: rotate(${watermark.image.rotation || 0}deg) !important;
          object-fit: contain !important;
          user-select: none !important;
          pointer-events: none !important;
          display: block !important;
          margin: 0 auto !important;
        "/>
      `;
      }

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


      if (watermarkContent) {
        const existingWatermarks = pageContentComponent.find('.page-watermark');
        existingWatermarks.forEach(wm => wm.remove());

        const watermarkGjsComponent = pageContentComponent.append(`
        <div class="page-watermark tiled" style="
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

      }
    }
    // 🧩 SINGLE Watermark (with separate positions)
    else {
      const existingWatermarks = pageContentComponent.find('.page-watermark');
      existingWatermarks.forEach(wm => wm.remove());

      // TEXT watermark
      if (watermark.type === "text" || watermark.type === "both") {
        const textPosition = watermark.textPosition || watermark.position || "center";

        const absTextPos = getAbsolutePosition(textPosition);

        const textWatermarkContent = `
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

        const textWatermarkGjsComponent = pageContentComponent.append(`
        <div class="page-watermark page-watermark-text-container single" style="
          position: absolute !important;
          ${absTextPos}
          pointer-events: none !important;
          user-select: none !important;
          z-index: 1 !important;
        ">${textWatermarkContent}</div>
      `)[0];

        textWatermarkGjsComponent.set({
          selectable: false,
          editable: false,
          removable: false,
          draggable: false,
          copyable: false,
        });

      }

      // IMAGE watermark
      if ((watermark.type === "image" || watermark.type === "both") && watermark.image.url) {
        const imagePosition = watermark.imagePosition || watermark.position || "center";
       

        const absImgPos = getAbsolutePosition(imagePosition);

        const imageWatermarkContent = `
        <img class="page-watermark-image" src="${watermark.image.url}" style="
          width: ${watermark.image.width}px !important;
          height: ${watermark.image.height}px !important;
          opacity: ${watermark.image.opacity || 0.4} !important;
          transform: rotate(${watermark.image.rotation || 0}deg) !important;
          max-width: 100% !important;
          max-height: 100% !important;
          object-fit: contain !important;
          user-select: none !important;
          pointer-events: none !important;
        " onerror="console.error('Failed to load watermark image:', this.src); this.style.display='none';" />
      `;

        const imageWatermarkGjsComponent = pageContentComponent.append(`
        <div class="page-watermark page-watermark-image-container single" style="
          position: absolute !important;
          ${absImgPos}
          pointer-events: none !important;
          user-select: none !important;
          z-index: 1 !important;
        ">${imageWatermarkContent}</div>
      `)[0];

        imageWatermarkGjsComponent.set({
          selectable: false,
          editable: false,
          removable: false,
          draggable: false,
          copyable: false,
        });

      }
    }
  }


  // renderPageNumbers() {

  //   if (!this.pageSettings.pageNumber?.enabled) {
  //     this.removeAllPageNumbers();
  //     return;
  //   }

  //   const settings = this.pageSettings.pageNumber;
  //   const startFrom = settings.startFrom || 1;
  //   const format = settings.format || "Page {n}";
  //   const position = settings.position || "bottom-center";
  //   const pages = this.editor.getWrapper().find('.page-container');
  //   let currentNumber = startFrom;

  //   pages.forEach((pageComponent, index) => {
  //     // Check if page already has a page number element
  //     const existing = pageComponent.find('.page-number-element');
  //     if (existing.length > 0) {
  //       // Already has a number → skip or update if you want
  //       currentNumber++;
  //       return;
  //     }

  //     const pageText = format
  //       .replace('{n}', currentNumber.toString())
  //       .replace('{total}', (pages.length - startFrom + 1).toString());

  //     const positionStyles = this.getPageNumberPositionStyles(position);

  //     const pageNumberHTML = `
  //       <div class="page-number-element" style="
  //           position: absolute;
  //           font-family: ${settings.fontFamily || 'Arial'};
  //           font-size: ${settings.fontSize || 11}px;
  //           color: ${settings.color || '#333333'};
  //           background-color: ${settings.backgroundColor || 'transparent'};
  //           border: ${settings.showBorder ? '1px solid ' + (settings.color || '#333333') : 'none'};
  //           padding: ${settings.showBorder ? '2px 6px' : '2px'};
  //           border-radius: 3px;
  //           z-index: 1000;
  //           pointer-events: none;
  //           white-space: nowrap;
  //           ${positionStyles}
  //       ">${pageText}</div>
  //       `;

  //     const pageContent = pageComponent.find('.page-content')[0];
  //     if (pageContent) {
  //       pageContent.append(pageNumberHTML);
  //     } else {
  //     }

  //     currentNumber++;
  //   });

  // }


  getPageNumberPositionStyles(position) {
    const positions = {
      'top-left': 'top: 10px; left: 10px;',
      'top-center': 'top: 10px; left: 50%; transform: translateX(-50%);',
      'top-right': 'top: 10px; right: 10px;',
      'center-left': 'top: 50%; left: 10px; transform: translateY(-50%);',
      'center-center': 'top: 50%; left: 50%; transform: translate(-50%, -50%);',
      'center-right': 'top: 50%; right: 10px; transform: translateY(-50%);',
      'bottom-left': 'bottom: 10px; left: 10px;',
      'bottom-center': 'bottom: 10px; left: 50%; transform: translateX(-50%);',
      'bottom-right': 'bottom: 10px; right: 10px;'
    };

    return positions[position] || positions['bottom-center'];
  }

  removeAllPageNumbers() {
    const pages = this.editor.getWrapper().find('.page-container');
    pages.forEach(pageComponent => {
      const pageNumbers = pageComponent.find('.page-number-element');
      pageNumbers.forEach(element => element.remove());
    });
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

  shouldShowPageNumber(pageIndex) {
    const pageNumber = pageIndex + 1
    return (
      !this.pageSettings.pageNumbering.excludedPages.includes(pageNumber) && this.pageSettings.pageNumbering.enabled
    )
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
      // Prevent recursive pagination during page creation
      const originalPaginationState = this.paginationInProgress;
      this.paginationInProgress = true;

      const newPageIndex = this.pageSettings.numberOfPages;
      const newPageId = `page-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;


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

      // Convert dimensions from mm → px
      const mmToPx = 96 / 25.4;
      const marginTopPx = Math.round(this.pageSettings.margins.top * mmToPx);
      const marginBottomPx = Math.round(this.pageSettings.margins.bottom * mmToPx);
      const marginLeftPx = Math.round(this.pageSettings.margins.left * mmToPx);
      const marginRightPx = Math.round(this.pageSettings.margins.right * mmToPx);
      const totalPageWidth = Math.round(this.pageSettings.width * mmToPx);
      const totalPageHeight = Math.round(this.pageSettings.height * mmToPx);
      const contentWidth = totalPageWidth - marginLeftPx - marginRightPx;
      const contentHeight = totalPageHeight - marginTopPx - marginBottomPx;
      const defaultHeaderHeight = Math.round(newPageSettings.header.height * mmToPx);
      const defaultFooterHeight = Math.round(newPageSettings.footer.height * mmToPx);
      const mainContentAreaHeight = contentHeight - defaultHeaderHeight - defaultFooterHeight;

      // Build HTML structure
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

      // Apply styles to page container
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

      // Configure header, content, footer components
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

      // Add watermark
      const pageContentComponent = pageComponent.find(".page-content")[0];
      if (pageContentComponent) {
        this.addWatermarkToPage(pageContentComponent, newPageIndex);
      }

      // Add page number only for this page
      this.renderPageNumberForPage(pageComponent, newPageIndex);

      // Setup observer AFTER page is fully created
      setTimeout(() => {
        this.paginationInProgress = originalPaginationState;
        this.setupPageObserver(newPageIndex);
      }, 500);

      return newPageSettings;

    } catch (error) {
      console.error("❌ Error creating new page:", error);
      this.paginationInProgress = false;
      return null;
    }
  }

  // Helper method: render page number for a single page
  renderPageNumberForPage(pageComponent, pageIndex) {
    if (!this.pageSettings.pageNumber?.enabled) return;

    const settings = this.pageSettings.pageNumber;
    const format = settings.format || "Page {n}";
    const position = settings.position || "bottom-center";

    const pageNumber = pageIndex + 1;
    const displayNumber = format
      .replace('{n}', pageNumber)
      .replace('{total}', this.pageSettings.numberOfPages.toString());

    const positionStyles = this.getPageNumberPositionStyles(position);
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
        ">${displayNumber}</div>
    `;

    const pageContent = pageComponent.find('.page-content')[0];
    if (pageContent) pageContent.append(pageNumberHTML);
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


  //////////////////////////////////section header workiing code from here///////////////////////////////////////

  _originalHeaderContent = '';
  _originalFooterContent = '';

  // 🔹 Register dynamic header/footer
  registerDynamicHeaderFooter() {
    this.editor.Components.addType("Dynamic Header Footer", {
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
              attributes: { class: "section-header gjs-editor-header", 'data-gjs-name': 'Header' },
              style: { padding: "10px", "min-height": "80px", position: "relative" },
              traits: [
                {
                  type: "select",
                  label: "Apply To",
                  name: "headerApplyMode",
                  options: [
                    { id: "all", label: "All" },
                    { id: "even", label: "Even" },
                    { id: "odd", label: "Odd" },
                    { id: "custom", label: "Custom" }
                  ],
                  default: "all",
                  changeProp: 1
                },
                {
                  type: "text",
                  label: "Custom Range",
                  name: "headerCustomRange",
                  placeholder: "e.g. 2,4-6",
                  changeProp: 1
                }
              ]
            },
            {
              tagName: "div",
              name: "section Content",
              attributes: { class: "section-content gjs-editor-content", 'data-gjs-name': 'Content' },
              style: { flex: "1", padding: "10px", position: "relative", "min-height": "845px" }
            },
            {
              tagName: "div",
              name: "Footer",
              attributes: { class: "section-footer gjs-editor-footer", 'data-gjs-name': 'Footer' },
              style: { padding: "10px", "min-height": "60px", position: "relative" },
              traits: [
                {
                  type: "select",
                  label: "Apply To",
                  name: "footerApplyMode",
                  options: [
                    { id: "all", label: "All" },
                    { id: "even", label: "Even" },
                    { id: "odd", label: "Odd" },
                    { id: "custom", label: "Custom" }
                  ],
                  default: "all",
                  changeProp: 1
                },
                {
                  type: "text",
                  label: "Custom Range",
                  name: "footerCustomRange",
                  placeholder: "e.g. 1,3-5",
                  changeProp: 1
                }
              ]
            }
          ],
          style: {
            display: "flex",
            "flex-direction": "column",
            width: "100%",
            // "min-height": "50vh",
            // height: "100px",
            margin: "10px 0",
            padding: "5px"
          }
        }
      }
    });

    // Listen for content changes to capture header/footer text
    this.editor.on('component:update', (component) => {
      const parent = component.parent();
      if (!parent) return;

      const parentName = parent.get('name');

      // Capture header content
      if (parentName === 'Header') {
        const content = component.get('content');
        if (content && content.trim()) {
          this._originalHeaderContent = content;
        }
      }

      // Capture footer content
      if (parentName === 'Footer') {
        const content = component.get('content');
        if (content && content.trim()) {
          this._originalFooterContent = content;
        }
      }
    });

    // Event binding for trait changes
    this.editor.on('trait:update', (eventData) => {
      const { trait, component } = eventData;

      // 🔒 Prevent recursion: skip if a global silent sync is in progress
      if (this._silentSync) return;

      const traitName = trait.get('name');
      const componentName = component.get('name');


      if (componentName === 'Header' && (traitName === 'headerApplyMode' || traitName === 'headerCustomRange')) {
        const rteComp = component.find('[data-gjs-type="formatted-rich-text"]')[0];
        if (rteComp) {
          const content = rteComp.get('content');
          if (content && content.trim()) {
            this._originalHeaderContent = content;
          }
        }

        const mode = component.get('headerApplyMode');
        const range = component.get('headerCustomRange') || '';

        // ⚡️ Wrap the sync in silent mode to prevent recursion
        this._silentSync = true;
        try {
          this.syncHeaderTraitsAcrossPages(component, mode, range);
        } finally {
          this._silentSync = false;
        }

        setTimeout(() => {
          this.updateAllSectionHeadersFooters();
        }, 50);

      } else if (componentName === 'Footer' && (traitName === 'footerApplyMode' || traitName === 'footerCustomRange')) {
        const rteComp = component.components().at(0);
        if (rteComp) {
          const content = rteComp.get('content');
          if (content && content.trim()) {
            this._originalFooterContent = content;
          }
        }

        const mode = component.get('footerApplyMode');
        const range = component.get('footerCustomRange') || '';

        // ⚡️ Wrap the sync in silent mode to prevent recursion
        this._silentSync = true;
        try {
          this.syncFooterTraitsAcrossPages(component, mode, range);
        } finally {
          this._silentSync = false;
        }

        setTimeout(() => {
          this.updateAllSectionHeadersFooters();
        }, 50);
      }
    });


  }

  // 🔹 Sync header traits across all pages
  syncHeaderTraitsAcrossPages(sourceComponent, newMode, newRange) {
    const allPages = this.editor.getWrapper().find('.page-container');

    allPages.forEach((pageComponent, i) => {
      const sectionContainer = pageComponent.find('.sections-container')[0];
      if (!sectionContainer) return;

      const headerComp = sectionContainer.components().find(c => c.get('name') === 'Header');
      if (!headerComp) return;

      headerComp.set('headerApplyMode', newMode);
      headerComp.set('headerCustomRange', newRange);

      const modeTrait = headerComp.getTrait('headerApplyMode');
      const rangeTrait = headerComp.getTrait('headerCustomRange');

      if (modeTrait) {
        modeTrait.set('value', newMode);
        if (modeTrait.view) {
          modeTrait.view.model.set('value', newMode);
          modeTrait.view.render();
        }
      }

      if (rangeTrait) {
        rangeTrait.set('value', newRange);
        if (rangeTrait.view) {
          rangeTrait.view.model.set('value', newRange);
          rangeTrait.view.render();
        }
      }

    });
  }

  // 🔹 Sync footer traits across all pages
  syncFooterTraitsAcrossPages(sourceComponent, newMode, newRange) {
    const allPages = this.editor.getWrapper().find('.page-container');

    allPages.forEach((pageComponent, i) => {
      const sectionContainer = pageComponent.find('.sections-container')[0];
      if (!sectionContainer) return;

      const footerComp = sectionContainer.components().find(c => c.get('name') === 'Footer');
      if (!footerComp) return;

      // Update both properties on the component
      footerComp.set('footerApplyMode', newMode);
      footerComp.set('footerCustomRange', newRange);

      // Update the trait UI
      const modeTrait = footerComp.getTrait('footerApplyMode');
      const rangeTrait = footerComp.getTrait('footerCustomRange');

      if (modeTrait) {
        modeTrait.set('value', newMode);
        if (modeTrait.view) {
          modeTrait.view.model.set('value', newMode);
          modeTrait.view.render();
        }
      }

      if (rangeTrait) {
        rangeTrait.set('value', newRange);
        if (rangeTrait.view) {
          rangeTrait.view.model.set('value', newRange);
          rangeTrait.view.render();
        }
      }

    });
  }

  // 🔹 Check if a page should show a section
  checkSectionApplyMode(mode, range, pageIndex) {
    const pageNum = pageIndex + 1;

    if (mode === "all") return true;
    if (mode === "even") return pageNum % 2 === 0;
    if (mode === "odd") return pageNum % 2 !== 0;
    if (mode === "custom") {
      if (!range || range.trim() === '') {
        return false;
      }

      const shouldShow = range.split(',').some(part => {
        const trimmedPart = part.trim();
        if (trimmedPart.includes('-')) {
          const [start, end] = trimmedPart.split('-').map(n => parseInt(n.trim(), 10));
          const inRange = pageNum >= start && pageNum <= end;
          return inRange;
        } else {
          const targetPage = parseInt(trimmedPart, 10);
          const matches = targetPage === pageNum;
          return matches;
        }
      });

      return shouldShow;
    }
    return true;
  }


  // 🔹 Update header per page
  updateSectionHeader(pageComponent, pageIndex) {
    const sectionContainer = pageComponent.find('.sections-container')[0];
    if (!sectionContainer) return;

    const headerComp = sectionContainer.components().find(c => c.get('name') === 'Header');
    if (!headerComp) return;

    const mode = headerComp.get('headerApplyMode') || 'all';
    const range = headerComp.get('headerCustomRange') || '';
    const show = this.checkSectionApplyMode(mode, range, pageIndex);

    const rteComp = headerComp.components().find(c => c.get('attributes')['data-gjs-type'] === 'formatted-rich-text');
    if (!rteComp) return;

    if (show) {
      rteComp.set('content', `Header for page ${pageIndex + 1}`);
    } else {
      rteComp.set('content', '');
    }

    if (rteComp.view) rteComp.view.render();
  }

  // 🔹 Update footer per page
  updateSectionFooter(pageComponent, pageIndex) {
    const sectionContainer = pageComponent.find('.sections-container')[0];
    if (!sectionContainer) return;

    const footerComp = sectionContainer.components().find(c => c.get('name') === 'Footer');
    if (!footerComp) return;

    const mode = footerComp.get('footerApplyMode') || 'all';
    const range = footerComp.get('footerCustomRange') || '';
    const show = this.checkSectionApplyMode(mode, range, pageIndex);

    footerComp.getEl().style.display = 'block';

    const rteComp = footerComp.components().at(0);
    if (rteComp) {
      if (show) {
        const sourceContent = this._lastSectionFooterContent || `Footer for page ${pageIndex + 1}`;
        rteComp.set('content', sourceContent);
      } else {
        rteComp.set('content', '');
      }
      if (rteComp.view) rteComp.view.render();
    }

    if (show) {
      this._lastSectionFooterContent = footerComp.components().at(0)?.get('content') || '';
    }
  }

  // 🔹 Update all pages
  updateAllSectionHeadersFooters() {
    const allPages = this.editor.getWrapper().find('.page-container');

    allPages.forEach((pageComponent, i) => {
      const sectionContainer = pageComponent.find('.sections-container')[0];
      if (!sectionContainer) return;

      const headerComp = sectionContainer.components().find(c => c.get('name') === 'Header');

      if (headerComp) {
        const mode = headerComp.get('headerApplyMode') || 'all';
        const range = headerComp.get('headerCustomRange') || '';
        const show = this.checkSectionApplyMode(mode, range, i);


        // Find or create rich text component
        let rteComp = headerComp.find('[data-gjs-type="formatted-rich-text"]')[0];

        if (!rteComp) {
          rteComp = headerComp.append({
            tagName: 'div',
            attributes: { 'data-gjs-type': 'formatted-rich-text' },
            content: ''
          })[0];
        }

        if (rteComp) {
          if (show && this._originalHeaderContent) {
            rteComp.set('content', this._originalHeaderContent);
          } else {
            rteComp.set('content', ''); // Just clear the text, don't hide header
          }

          if (rteComp.view) rteComp.view.render();
        }
      }

      // Same for footer
      const footerComp = sectionContainer.components().find(c => c.get('name') === 'Footer');
      if (footerComp) {
        const mode = footerComp.get('footerApplyMode') || 'all';
        const range = footerComp.get('footerCustomRange') || '';
        const show = this.checkSectionApplyMode(mode, range, i);

        let rteComp = footerComp.components().at(0);

        if (!rteComp) {
          rteComp = footerComp.append({
            tagName: 'div',
            attributes: { 'data-gjs-type': 'formatted-rich-text' },
            content: ''
          })[0];
        }

        if (rteComp) {
          if (show && this._originalFooterContent) {
            rteComp.set('content', this._originalFooterContent);
          } else {
            rteComp.set('content', ''); // Just clear the text
          }

          if (rteComp.view) rteComp.view.render();
        }
      }
    });

  }

  /////////////////////////////////////////section header footer code end here////////////////////////////////////////////

  // //////////////////////////////////////////////daynamic header footer from json//////////////////////

  setupJsonSuggestionButton() {
    const jsonSector = document.querySelector('.i_designer-sm-sector__JSON');
    if (!jsonSector) return;

    const jsonPathInput = jsonSector.querySelector('.i_designer-fields');
    if (!jsonPathInput) return;

    const button = document.createElement('button');
    button.innerHTML = 'Json Suggestion';
    button.id = 'json-suggestion-btn';
    button.style.marginLeft = '0px';
    jsonPathInput.parentNode.appendChild(button);

    button.addEventListener('click', () => this.openSuggestionJsonModal());
  }

  openSuggestionJsonModal() {
    const commonJson = JSON.parse(localStorage.getItem('common_json'));
    const customLanguage = localStorage.getItem('custom_language') || 'english';
    const metaDataKeys = this.extractMetaDataKeys(commonJson[customLanguage]);

    let modalContent = `
            <div class="new-table-form">
                <div style="padding-bottom:10px">
                    <input type="text" id="searchInput" placeholder="Search json">
                </div>
                <div class="suggestion-results" style="height: 200px; overflow: auto;">
        `;
    metaDataKeys.forEach(key => {
      modalContent += `<div class="suggestion" data-value="${key}">${key}</div>`;
    });
    modalContent += `</div></div>`;

    this.editor.Modal.setTitle('Json Suggestion');
    this.editor.Modal.setContent(modalContent);
    this.editor.Modal.open();

    document.getElementById("searchInput").addEventListener("input", function () {
      filterSuggestions(this.value);
    });

    document.querySelectorAll('.suggestion').forEach(item => {
      item.addEventListener('click', () => {
        const selectedValue = item.getAttribute('data-value');
        const selectedData = this.getNestedValue(commonJson[customLanguage], selectedValue); // <-- use 'this.'

        if (Array.isArray(selectedData)) {
          const arrayEvent = new CustomEvent('arrayDataSelected', {
            detail: { data: selectedData, jsonPath: selectedValue }
          });
          document.dispatchEvent(arrayEvent);
        } else {
          const inputField = document.querySelector('.i_designer-sm-property__my-input-json input');
          if (inputField) {
            inputField.value = selectedValue;
            inputField.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
          }
        }

        this.editor.Modal.close();
      });
    });
  }


  initializeArrayDataListener() {
    document.addEventListener('arrayDataSelected', event => {
      const { data, jsonPath } = event.detail;
      if (typeof this.handleArrayDataDistribution === 'function') {
        this.handleArrayDataDistribution(data, jsonPath);
      } else {
        console.error('handleArrayDataDistribution function not found');
      }
    });
  }

  handleArrayDataDistribution(arrayData, jsonPath) {
    const currentPageCount = this.pageSettings.numberOfPages || 1;
    const requiredPages = arrayData.length;

    if (requiredPages > currentPageCount) {
      this.createAdditionalPages(requiredPages - currentPageCount);
    }

    arrayData.forEach((item, index) => {
      this.insertDataIntoPageHeader(item, index, jsonPath);
    });

    this.updateAllPagesAfterDataInsertion(requiredPages);
  }

  insertDataIntoPageHeader(data, pageIndex, jsonPath) {
    const allPages = this.editor.getWrapper().find('.page-container');
    const targetPage = allPages[pageIndex];
    if (!targetPage) return;

    const headerSection = targetPage.find('.section-header[data-gjs-name="Header"]')[0];
    if (!headerSection) return;

    const richTextComponent = headerSection.find('[data-gjs-type="formatted-rich-text"]')[0];
    if (!richTextComponent) return;

    let contentToInsert = '';

    // Handle arrays
    if (Array.isArray(data)) {
      const item = data[pageIndex]; // Get per-page item
      if (typeof item === 'object') {
        // Convert object to HTML string
        contentToInsert = Object.entries(item)
          .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
          .join('<br>');
      } else {
        contentToInsert = String(item);
      }
    }
    // Handle objects (like analytics_pie)
    else if (typeof data === 'object') {
      if (jsonPath === 'analytics_pie') {
        const pieData = data.series?.[0]?.data || [];
        const pieItem = pieData[pageIndex];
        if (pieItem) {
          contentToInsert = `<strong>${pieItem.name}:</strong> ${pieItem.y}`;
        }
      } else {
        contentToInsert = JSON.stringify(data, null, 2);
      }
    }
    // Handle strings
    else {
      contentToInsert = String(data);
    }

    richTextComponent.components(contentToInsert);
  }

  createAdditionalPages(additionalPagesCount) {
    const allPages = this.editor.getWrapper().find('.page-container');
    const firstPage = allPages[0];
    if (!firstPage) return;

    for (let i = 0; i < additionalPagesCount; i++) {
      const newPageIndex = this.pageSettings.numberOfPages + i;
      const newPageId = `page-${Date.now()}-${newPageIndex}`;

      const newPageSettings = { ...this.pageSettings.pages[0], id: newPageId, name: `Page ${newPageIndex + 1}` };
      this.pageSettings.pages.push(newPageSettings);
      this.pageSettings.numberOfPages += 1;

      const newPageClone = firstPage.clone();
      newPageClone.setAttributes({ 'data-page-id': newPageId });

      const lastPage = allPages.at(-1);
      lastPage.parent().append(newPageClone);
    }
  }


  updateAllPagesAfterDataInsertion(pageCount) {
    const allPages = this.editor.getWrapper().find('.page-container');

    for (let i = 0; i < pageCount; i++) {
      const pageElement = allPages[i];
      const pageSettings = this.pageSettings.pages[i];
      if (pageElement && pageSettings && typeof this.updateSinglePageVisuals === 'function') {
        this.updateSinglePageVisuals(pageElement.getEl(), pageSettings, i);
      }
    }
  }

  extractMetaDataKeys(jsonObj) {
    if (!jsonObj || typeof jsonObj !== 'object') return [];
    return Object.keys(jsonObj); // Return all keys at top level
  }

  getNestedValue(obj, path) {
    if (!obj || !path) return null;
    const keys = path.split('.');
    let result = obj;
    for (let key of keys) {
      if (result[key] === undefined) return undefined;
      result = result[key];
    }
    return result;
  }
  //////////////////////////////////////////////////////daynamic header footer from json///////////////////////////









}
