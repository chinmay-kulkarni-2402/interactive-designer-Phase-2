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
      localStorage.removeItem('editTemplateName');
      localStorage.removeItem('editTemplateId');
      sessionStorage.removeItem('single-page');
      localStorage.removeItem('single-page');
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
    if (this.isInitialized) {
      this.updatePageRule();
    }
    this.addToGrapesJSSettings()
    this.setupCanvasObserver()
    this.setupContentBoundaryEnforcement()
    this.initSharedRegionSync()
    this.setupSectionSelection()
    this.addPageBreakComponent()
    //  this.setupJsonSuggestionButton()
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


  }

  resetInitialization() {
    this.isInitialized = false;
    this.updateNavbarButton();
    this.updateAddPageButton();
  }

  // ===============================
  //+Latest+ Create New Page
  // ===============================
  createNewPage() {
    return this.addNewPage();
  }


  // ===============================
  // +Latest+ Handle Page Break
  // ===============================
  handlePageBreak(pageIndex) {
    console.log('PAGE BREAK CALL ==========', pageIndex);

    // ✅ PREVENT RECURSION - check if already processing this page break
    if (this._processingPageBreak === pageIndex) {
      console.log('⏭️ Already processing page break for page', pageIndex);
      return;
    }
    this._processingPageBreak = pageIndex;

    const wrapper = this.editor.getWrapper();
    if (!wrapper) {
      this._processingPageBreak = null;
      return;
    }

    // Step 1: Get current page
    const pageComponents = wrapper.find(`[data-page-index="${pageIndex}"]`);
    if (!pageComponents.length) {
      this._processingPageBreak = null;
      return;
    }

    const pageComponent = pageComponents[0];
    const contentArea = pageComponent.find('.main-content-area')[0];
    if (!contentArea) {
      this._processingPageBreak = null;
      return;
    }

    const contentEl = contentArea.getEl();
    if (!contentEl) {
      this._processingPageBreak = null;
      return;
    }

    const pageBreakEl = contentEl.querySelector('.page-break');
    if (!pageBreakEl) {
      this._processingPageBreak = null;
      return;
    }

    // Step 2: Collect elements after break
    let foundBreak = false;
    const allChildren = Array.from(contentArea.components());
    const afterBreak = [];

    for (let cmp of allChildren) {
      if (foundBreak) {
        afterBreak.push(cmp);
      }
      if (cmp.getEl() === pageBreakEl) {
        foundBreak = true;
      }
    }

    console.log(`📦 Found ${afterBreak.length} components after page break`);

    // Step 3: Find next page or create one
    let nextPage = wrapper.find(`[data-page-index="${pageIndex + 1}"]`)[0];
    if (!nextPage) {
      console.log('📄 Creating new page...');
      nextPage = this.createNewPage(); // ✅ now returns component
    }

    if (!nextPage) {
      console.warn('❌ Failed to create or find next page');
      this._processingPageBreak = null;
      return;
    }

    // Step 4: Get next main-content-area
    const nextContentArea = nextPage.find('.main-content-area')[0];
    if (!nextContentArea) {
      console.warn('❌ next page does not have a main-content-area');
      this._processingPageBreak = null;
      return;
    }

    // Step 5: Move elements using GrapesJS API
    console.log(`🔄 Moving ${afterBreak.length} components...`);
    afterBreak.reverse().forEach(cmp => {
      cmp.remove({ temporary: true });
      nextContentArea.components().add(cmp, { at: 0 });
    });

    // Step 6: Remove the page-break element
    const breakCmp = allChildren.find(c => c.getEl() === pageBreakEl);
    if (breakCmp) {
      breakCmp.remove();
    }

    console.log(`✅ Moved ${afterBreak.length} components to page ${pageIndex + 1}`);

    // ✅ CLEAR PROCESSING FLAG
    this._processingPageBreak = null;
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
      <div class="page-content" style="height:${contentHeight}px; margin:${marginTopPx}px ${marginRightPx}px ${marginBottomPx}px ${marginLeftPx}px; display:flex; flex-direction:column;">
        <div class="header-wrapper"><div class="page-header-element"></div></div>
        <div class="content-wrapper" style="flex:1; display:flex; flex-direction:column;">
          <div class="main-content-area"></div>
        </div>
        <div class="footer-wrapper"><div class="page-footer-element"></div></div>
      </div>
    </div>`;
  }
  ////////////////////////////////// auto-pagtination ////////////////////////////////////////////////////

  checkAllPagesForOverflow() {
    if (this.paginationInProgress) {
      console.log("Pagination already in progress. Skipping full check.");
      return;
    }
    for (let i = 0; i < this.pageSettings.numberOfPages; i++) {
      const currentPageIndex = i;
      this.handleAutoPagination(currentPageIndex);
    }
  }

  handleAutoPagination(pageIndex) {
    console.log(pageIndex, 'handleAutoPagination ====');

    // ======================================================
    // PRECHECK: Locate the page + content
    // ======================================================
    const pageComponent = this.editor.getWrapper().find(`[data-page-index="${pageIndex}"]`)[0];
    if (!pageComponent) return;

    const contentArea = pageComponent.find('.main-content-area')[0];
    if (!contentArea) return;

    const contentEl = contentArea.getEl();
    if (!contentEl) return;

    // ======================================================
    // NEW LOGIC: Detect if page has REAL content
    // ======================================================
    const hasActualContent =
      contentEl.children.length > 0 &&
      Array.from(contentEl.children).some(child =>
        !child.classList.contains('page-break') &&
        (child.textContent.trim() !== '' || child.querySelector('img, table, video'))
      );

    const shouldCheckPageBreak =
      pageIndex > 0 ||
      (pageIndex === 0 && hasActualContent && contentEl.scrollHeight > contentEl.clientHeight);

    if (shouldCheckPageBreak) {
      this.handlePageBreak(pageIndex);
    }

    // ======================================================
    // Prevent concurrent pagination
    // ======================================================
    if (this.paginationInProgress) return;
    this.paginationInProgress = true;

    const resetFlag = () => (this.paginationInProgress = false);
    setTimeout(resetFlag, 15000);

    try {
      // --------------------------------------------------
      // IDENTIFY TARGET AREA
      // --------------------------------------------------
      let targetArea = contentArea;
      let availableHeight = contentEl.clientHeight;

      const sectionsContainer = contentArea.find('.sections-container')[0];
      const manualSectionContent = contentArea.find('.section-content')[0];

      if (manualSectionContent) {
        targetArea = manualSectionContent;
      } else if (sectionsContainer) {
        const sectionContent = sectionsContainer
          .components()
          .find(c => c.get('name') === 'Content');
        if (sectionContent) targetArea = sectionContent;
      }

      // --------------------------------------------------
      // CONDITIONAL PAGE BREAKS
      // --------------------------------------------------
      const conditionalBreakSettings = this.pageSettings.conditionalPageBreak;
      let conditionalBreakPosition = null;

      if (conditionalBreakSettings?.enabled) {
        const pageNumber = pageIndex + 1;
        const overrides = conditionalBreakSettings.pageOverrides || {};

        let distanceInMm;

        if (overrides[pageNumber]) {
          distanceInMm = this.convertToMm(
            overrides[pageNumber].distance,
            overrides[pageNumber].unit
          );
        } else {
          distanceInMm = this.convertToMm(
            conditionalBreakSettings.defaultDistance || 50,
            conditionalBreakSettings.defaultUnit || 'mm'
          );
        }

        const mmToPx = 96 / 25.4;
        const distanceInPx = Math.round(distanceInMm * mmToPx);

        conditionalBreakPosition = availableHeight - distanceInPx;
      }

      // --------------------------------------------------
      // CALCULATE AVAILABLE HEIGHT WITH SECTIONS
      // --------------------------------------------------
      if (sectionsContainer && targetArea !== contentArea) {
        const mainContentHeight = contentEl.clientHeight;

        const headerComp = sectionsContainer.components().find(c => c.get('name') === 'Header');
        const footerComp = sectionsContainer.components().find(c => c.get('name') === 'Footer');

        const headerHeight = headerComp?.getEl()
          ? this.getAccurateComponentHeight(headerComp.getEl())
          : 0;

        const footerHeight = footerComp?.getEl()
          ? this.getAccurateComponentHeight(footerComp.getEl())
          : 0;

        const bufferSpace = 20;

        availableHeight = mainContentHeight - headerHeight - footerHeight - bufferSpace;

        if (conditionalBreakPosition !== null) {
          availableHeight = Math.min(availableHeight, conditionalBreakPosition);
        }
      } else if (conditionalBreakPosition !== null) {
        availableHeight = Math.min(availableHeight, conditionalBreakPosition);
      }

      // --------------------------------------------------
      // CHECK OVERFLOW
      // --------------------------------------------------
      const targetEl = targetArea.getEl();
      if (!targetEl) return resetFlag();

      targetEl.offsetHeight;
      const actualHeight = targetEl.scrollHeight;

      const isOverflowing = actualHeight > availableHeight + 10;
      if (!isOverflowing) return resetFlag();

      // --------------------------------------------------
      // SPLIT CONTENT
      // --------------------------------------------------
      const components = targetArea.components();
      if (components.length === 0) return resetFlag();

      const splitSuccess = this.splitContentByHeight(
        targetArea,
        components,
        pageIndex,
        availableHeight
      );

      if (!splitSuccess) return resetFlag();

      // --------------------------------------------------
      // CONTINUE PAGINATION
      // --------------------------------------------------
      setTimeout(() => {
        // ================================================
        // 🔥 NEW BLOCK: SUBREPORT PAGE MARKING
        // ================================================
        const nextPageIndex = pageIndex + 1;

        const nextPageExists =
          nextPageIndex < this.pageSettings.pages.length &&
          this.pageSettings.pages[nextPageIndex];

        if (nextPageExists) {
          const hasSubreport = components.some(comp => comp.get('type') === 'subreport');

          if (hasSubreport) {
            const subreportComp = components.find(comp => comp.get('type') === 'subreport');
            const sharePageNumber = subreportComp?.getAttributes()?.sharePageNumber;

            if (sharePageNumber === false || sharePageNumber === 'false') {
              const newPageSettings = this.pageSettings.pages[nextPageIndex];
              newPageSettings.isSubreportPage = true;
              newPageSettings.skipPageNumber = true;

              console.log(
                `🏷️ Autopaginated page ${nextPageIndex + 1} marked as SUBREPORT PAGE (no page number)`
              );
            }
          }
        }
        // ================================================

        resetFlag();

        setTimeout(() => {
          if (nextPageIndex < this.pageSettings.numberOfPages) {
            this.checkPageForOverflow(nextPageIndex);
          }
        }, 800);

      }, 500);

    } catch (err) {
      console.error(`❌ Error in handleAutoPagination(Page ${pageIndex})`, err);
      resetFlag();
    }
  }



  splitContentByHeight(contentArea, components, pageIndex, maxHeight) {

    console.log('splitContentByHeight ====');
    const contentEl = contentArea.getEl();
    const componentsToKeep = [];
    const componentsToMove = [];

    let accumulatedHeight = 0;
    let splitPointFound = false;

    // ✅ Check if conditional break is active
    // Find this section in splitContentByHeight() and update it:

    // ✅ Check if conditional break is active
    const conditionalBreakSettings = this.pageSettings.conditionalPageBreak;
    let conditionalBreakActive = false;
    let conditionalBreakHeight = maxHeight;

    if (conditionalBreakSettings?.enabled) {
      const pageNumber = pageIndex + 1;
      const overrides = conditionalBreakSettings.pageOverrides || {};

      let distanceInMm;

      // Check for page-specific override first
      if (overrides[pageNumber]) {
        distanceInMm = this.convertToMm(overrides[pageNumber].distance, overrides[pageNumber].unit);
        console.log(`🎯 Using override for page ${pageNumber}: ${overrides[pageNumber].distance}${overrides[pageNumber].unit}`);
      } else {
        distanceInMm = this.convertToMm(
          conditionalBreakSettings.defaultDistance || 50,
          conditionalBreakSettings.defaultUnit || 'mm'
        );
        console.log(`📋 Using default for page ${pageNumber}: ${conditionalBreakSettings.defaultDistance}${conditionalBreakSettings.defaultUnit}`);
      }

      const mmToPx = 96 / 25.4;
      const distanceInPx = Math.round(distanceInMm * mmToPx);
      const contentAreaHeight = contentEl.clientHeight;
      conditionalBreakHeight = contentAreaHeight - distanceInPx;
      conditionalBreakActive = true;
      console.log(`✂️ Conditional break active at ${conditionalBreakHeight}px for page ${pageNumber}`);
    }

    for (let i = 0; i < components.length; i++) {
      const component = components.at(i);
      const compEl = component.getEl();

      if (!compEl) continue;

      const isSubreport = component.get('type') === 'subreport' ||
        compEl.classList.contains('subreport-block') ||
        compEl.classList.contains('subreport-container');
      const compHeight = this.getAccurateComponentHeight(compEl);
      const effectiveMaxHeight = conditionalBreakActive ? conditionalBreakHeight : maxHeight;
      const remainingSpace = effectiveMaxHeight - accumulatedHeight;

      console.log(`Component ${i}: height=${compHeight}px, accumulated=${accumulatedHeight}px, remaining=${remainingSpace}px`);

      // ✅ NEW: Special handling for tables and complex components
      const componentType = component.get('type');
      const isTable = componentType === 'table' || compEl.tagName === 'TABLE' ||
        compEl.querySelector('table') !== null ||
        component.find('table').length > 0;

      const isJsonTable = compEl.classList.contains('json-table-container') ||
        compEl.classList.contains('json-data-table');

      // If this component would overflow
      if (accumulatedHeight + compHeight > effectiveMaxHeight) {
        splitPointFound = true;

        if (isSubreport) {
          const subreportChildren = component.components();

          if (subreportChildren.length > 0) {
            console.log(`📦 Subreport with ${subreportChildren.length} children detected`);

            // Try to split subreport's children instead of moving entire subreport
            let childrenToMove = [];
            let childAccHeight = accumulatedHeight;

            for (let j = 0; j < subreportChildren.length; j++) {
              const childComp = subreportChildren.at(j);
              const childEl = childComp.getEl();
              if (!childEl) continue;

              const childHeight = this.getAccurateComponentHeight(childEl);

              if (childAccHeight + childHeight > effectiveMaxHeight) {
                // This child and all following need to move
                for (let k = j; k < subreportChildren.length; k++) {
                  childrenToMove.push(subreportChildren.at(k));
                }
                break;
              }

              childAccHeight += childHeight;
            }

            if (childrenToMove.length > 0 && childrenToMove.length < subreportChildren.length) {
              console.log(`✂️ Splitting subreport: keeping ${subreportChildren.length - childrenToMove.length}, moving ${childrenToMove.length} children`);

              // Move overflow children to componentsToMove array
              componentsToMove.push(...childrenToMove);

              // Keep the subreport component on current page
              componentsToKeep.push(component);
              accumulatedHeight = childAccHeight;

              // Move all remaining components after subreport
              for (let j = i + 1; j < components.length; j++) {
                componentsToMove.push(components.at(j));
              }
              break;
            }
          }

          // If we can't split children, move entire subreport
          componentsToMove.push(component);
          for (let j = i + 1; j < components.length; j++) {
            componentsToMove.push(components.at(j));
          }
          break;
        }

        // ✅ Handle tables specially - try to split by rows if possible
        // ✅ Handle tables specially - NEVER split mid-cell
        // ✅ Handle tables specially - ONLY split rows, never duplicate entire table
        if (isTable || isJsonTable) {
          const tableHeight = this.getAccurateComponentHeight(compEl);

          if (accumulatedHeight + compHeight > effectiveMaxHeight) {
            // Table doesn't fit - need to split or move
            if (remainingSpace > effectiveMaxHeight * 0.15) {
              // Enough space to split some rows
              const splitResult = this.handleTableSplit(component, compEl, remainingSpace, effectiveMaxHeight);

              // ✅ CRITICAL: Don't push keepComponent if it has no rows
              if (splitResult.keepComponent && splitResult.keptRowCount > 0) {
                componentsToKeep.push(component); // Keep modified original
                accumulatedHeight += this.getAccurateComponentHeight(compEl);
              }

              // ✅ CRITICAL: Only move continuation component with remaining rows
              if (splitResult.moveComponent && splitResult.movedRowCount > 0) {
                componentsToMove.push(splitResult.moveComponent);
              }
            } else {
              // Not enough space - move entire table to next page
              console.log(`📊 Moving entire table to next page (height: ${compHeight}px)`);
              componentsToMove.push(component);
            }

            // Move all remaining components
            for (let j = i + 1; j < components.length; j++) {
              componentsToMove.push(components.at(j));
            }
            break;
          } else {
            // Table fits completely on current page
            componentsToKeep.push(component);
            accumulatedHeight += compHeight;
            continue;
          }
        }
        // Handle conditional breaks for text
        else if (conditionalBreakActive) {
          console.log(`🔸 Conditional break triggered - moving component ${i} and all after`);

          if (remainingSpace > effectiveMaxHeight * 0.15 &&
            component.get('type') === 'formatted-rich-text') {
            const splitResult = this.splitLargeComponent(component, remainingSpace);

            if (splitResult.moveComponent) {
              componentsToMove.push(splitResult.moveComponent);
            }

            for (let j = i + 1; j < components.length; j++) {
              componentsToMove.push(components.at(j));
            }
            break;
          } else {
            for (let j = i; j < components.length; j++) {
              componentsToMove.push(components.at(j));
            }
            break;
          }
        }
        // Original text splitting logic
        else {
          if (remainingSpace > maxHeight * 0.2) {
            const splitResult = this.splitLargeComponent(component, remainingSpace);

            if (splitResult.moveComponent) {
              componentsToMove.push(splitResult.moveComponent);
            }

            for (let j = i + 1; j < components.length; j++) {
              componentsToMove.push(components.at(j));
            }
            break;
          } else {
            for (let j = i; j < components.length; j++) {
              componentsToMove.push(components.at(j));
            }
            break;
          }
        }
      } else {
        componentsToKeep.push(component);
        accumulatedHeight += compHeight;
      }
    }

    // Handle single large component (including tables)
    if (!splitPointFound && components.length === 1 && accumulatedHeight > effectiveMaxHeight) {
      const component = components.at(0);
      const compEl = component.getEl();
      const isTable = compEl.tagName === 'TABLE' || compEl.querySelector('table') !== null;
      const isJsonTable = compEl.classList.contains('json-table-container');

      if (isTable || isJsonTable) {
        const splitResult = this.handleTableSplit(component, compEl, effectiveMaxHeight * 0.95, effectiveMaxHeight);
        if (splitResult.moveComponent) {
          componentsToMove.push(splitResult.moveComponent);
        }
      } else {
        const splitResult = this.splitLargeComponent(component, effectiveMaxHeight * 0.95);
        if (splitResult.moveComponent) {
          componentsToMove.push(splitResult.moveComponent);
        }
      }
    }

    if (componentsToMove.length === 0) {
      console.warn(`⚠️ No components to move after split calculation`);
      return false;
    }

    console.log(`📦 Moving ${componentsToMove.length} components to next page`);

    const nextPageIndex = pageIndex + 1;
    const wrapper = this.editor.getWrapper();
    let newPage = wrapper.find(`[data-page-index="${nextPageIndex}"]`)[0];

    //extra method section count
    let sourceSectionCount = null;
    const sourceSection = contentArea.closest('.sections-container');
    if (sourceSection) {
      sourceSectionCount = sourceSection.getAttributes()['data-section-count'];
      console.log(`📦 Source section count: ${sourceSectionCount}`);
    }

    // Around line 1055 - where you create sections during autopagination
    if (!newPage) {
      console.log(`📄 Creating missing page ${nextPageIndex}...`);
      newPage = this.addNewPage();
      this.pageSettings.numberOfPages = nextPageIndex + 1;
    }

    setTimeout(() => {
      try {
        const currentPage = wrapper.find(`[data-page-index="${pageIndex}"]`)[0];
        const newPageRef = wrapper.find(`[data-page-index="${nextPageIndex}"]`)[0];

        if (currentPage && newPageRef) {
          const newMainContent = newPageRef.find('.main-content-area')[0];

          // ✅ ONLY add section if source page has sections AND content is overflowing
          if (newMainContent && sourceSectionCount) {
            let existingSection = newMainContent.find('.sections-container')[0];

            if (!existingSection) {
              console.log(`🏗️ Autopagination: Creating section with SAME count ${sourceSectionCount} on page ${nextPageIndex}...`);

              // ✅ Pass sourceSectionCount to preserve the count during autopagination
              existingSection = this.addSectionsContainerToSpecificPage(nextPageIndex, sourceSectionCount);

              console.log(`✅ Autopagination: Section created on page ${nextPageIndex} with count: ${sourceSectionCount}`);
            }
          }

          // ✅ CRITICAL FIX: Copy section-header content BEFORE moving overflow
          const oldSections = currentPage.find(".sections-container")[0];
          const newSections = newPageRef.find(".sections-container")[0];

          if (oldSections && newSections) {
            const oldHeader = oldSections.find(".section-header")[0];
            const newHeader = newSections.find(".section-header")[0];

            if (oldHeader && newHeader) {
              // Don't reset - preserve any existing content
              const existingComponents = newHeader.components().length;
              if (existingComponents === 0) {
                oldHeader.components().forEach((comp) => {
                  newHeader.append(comp.clone());
                });
                console.log(`✅ Copied section-header to page ${nextPageIndex}`);
              }
            }
          }
        }
      } catch (err) {
        console.warn("⚠️ Header copy skipped:", err);
      }
      if (!this._headerPreferenceCache) {
        this._headerPreferenceCache = new Map();
      }

      // Check if any components being moved are tables with the copy-header attribute
      componentsToMove.forEach(comp => {
        const copyHeaderAttr = comp.getAttributes?.()['data-copy-header'];
        if (copyHeaderAttr !== undefined) {
          const tableId = comp.getAttributes?.()['data-original-table-id'] || comp.getId();
          this._headerPreferenceCache.set(tableId, copyHeaderAttr === 'true');
          console.log(`📝 Cached header preference for table ${tableId}: ${copyHeaderAttr}`);
        }
      });
      // ✅ STEP 4: NOW safely move overflow components WITH DELAY
      setTimeout(() => {
        this.moveComponentsToPage(componentsToMove, nextPageIndex);
        // Call duplicate removal after move
        setTimeout(() => {
          this.removeDuplicateRowsFromPreviousPage(pageIndex, componentsToMove);
        }, 500);
      }, 200);

    }, 700);

    return true;
  }

  // Add this NEW function after splitContentByHeight (around line 1100)

  removeDuplicateRowsFromPreviousPage(currentPageIndex, movedComponents) {
    console.log('🔍 Checking for duplicate rows on previous page...');

    if (!movedComponents || movedComponents.length === 0) {
      console.log('⚪ No components moved, skipping duplicate check');
      return;
    }

    const wrapper = this.editor.getWrapper();
    const currentPage = wrapper.find(`[data-page-index="${currentPageIndex}"]`)[0];
    if (!currentPage) return;

    const currentContentArea = currentPage.find('.main-content-area')[0];
    if (!currentContentArea) return;

    // Find all table components on current page
    const currentTables = currentContentArea.find('[data-gjs-type="json-table"]');

    currentTables.forEach(tableComp => {
      const tableEl = tableComp.getEl();
      if (!tableEl) return;

      const tbody = tableEl.querySelector('tbody');
      if (!tbody || !tbody.rows) return;

      const rows = Array.from(tbody.rows);
      if (rows.length === 0) return;

      console.log(`📊 Checking table with ${rows.length} rows for duplicates`);

      // Get data from moved components to compare
      const movedTableData = [];
      movedComponents.forEach(comp => {
        const compEl = comp.getEl();
        if (compEl && (compEl.tagName === 'TABLE' || compEl.querySelector('table'))) {
          const movedTbody = compEl.querySelector('tbody') || compEl.querySelector('table tbody');
          if (movedTbody && movedTbody.rows) {
            Array.from(movedTbody.rows).forEach(row => {
              const cellData = Array.from(row.cells).map(cell => cell.textContent.trim());
              movedTableData.push(cellData);
            });
          }
        }
      });

      if (movedTableData.length === 0) return;

      console.log(`📋 Found ${movedTableData.length} rows in moved components`);

      // Compare from bottom up and find duplicates
      const rowsToRemove = [];
      for (let i = rows.length - 1; i >= 0; i--) {
        const currentRowData = Array.from(rows[i].cells).map(cell => cell.textContent.trim());

        // Check if this row matches any moved row
        const isDuplicate = movedTableData.some(movedRow => {
          if (movedRow.length !== currentRowData.length) return false;
          return movedRow.every((cell, idx) => cell === currentRowData[idx]);
        });

        if (isDuplicate) {
          rowsToRemove.push(i);
          console.log(`🗑️ Found duplicate row at index ${i}`);
        } else {
          // Stop checking once we find a non-duplicate
          break;
        }
      }

      // Remove duplicate rows from DOM and GrapesJS
      if (rowsToRemove.length > 0) {
        console.log(`✂️ Removing ${rowsToRemove.length} duplicate rows from previous page`);

        // Remove from GrapesJS component tree
        const tbodyComp = tableComp.find('tbody')[0];
        if (tbodyComp) {
          const rowComps = tbodyComp.components();
          rowsToRemove.forEach(rowIndex => {
            const rowComp = rowComps.at(rowIndex);
            if (rowComp) {
              rowComp.remove();
            }
          });
        }

        // Remove from DOM
        rowsToRemove.forEach(rowIndex => {
          if (tbody.rows[rowIndex]) {
            tbody.deleteRow(rowIndex);
          }
        });

        console.log(`✅ Removed ${rowsToRemove.length} duplicate rows successfully`);
      }
    });
  }

  // UPDATED handleTableSplit (replace the old implementation)
  handleTableSplit(component, compEl, remainingSpace, maxHeight) {
    console.log('🔧 handleTableSplit called (UPDATED)');

    try {
      // Find the actual table element (support wrapped/table element)
      let tableEl = compEl && compEl.tagName === 'TABLE' ? compEl : compEl?.querySelector?.('table');

      if (!tableEl) {
        console.warn('⚠️ No table element found, moving entire component');
        return { keepComponent: null, moveComponent: component, keptRowCount: 0, movedRowCount: 0 };
      }

      // Prefer GrapesJS component tree tbody if available
      const tbodyComp = component.find && component.find('tbody') ? component.find('tbody')[0] : null;
      const tbody = tableEl.querySelector('tbody') || (tbodyComp && tbodyComp.getEl && tbodyComp.getEl());

      // If no tbody or no rows, move whole component
      const domTbodyRows = tableEl.querySelectorAll ? Array.from(tableEl.querySelectorAll('tbody > tr')) : [];
      if (!tbody || domTbodyRows.length === 0) {
        console.warn('⚠️ No tbody or rows found, moving entire component');
        return { keepComponent: null, moveComponent: component, keptRowCount: 0, movedRowCount: 0 };
      }

      // Account for DataTables wrapper and controls (if present)
      const dtWrapper = compEl.querySelector('.dataTables_wrapper');
      const dtInfo = dtWrapper?.querySelector('.dataTables_info');
      const dtPaginate = dtWrapper?.querySelector('.dataTables_paginate');
      const dtButtons = dtWrapper?.querySelector('.dt-buttons');

      let controlsHeight = 0;
      if (dtInfo) controlsHeight += dtInfo.offsetHeight + 10;
      if (dtPaginate) controlsHeight += dtPaginate.offsetHeight + 10;
      if (dtButtons) controlsHeight += dtButtons.offsetHeight + 10;

      // Prepare rows array from DOM to measure heights reliably
      const rows = domTbodyRows;
      const headerHeight = tableEl.querySelector('thead')?.offsetHeight || 0;
      const footerHeight = tableEl.querySelector('tfoot')?.offsetHeight || 0;

      // Safety margin included (-50)
      const availableHeight = remainingSpace - headerHeight - footerHeight - controlsHeight - 10;

      if (availableHeight < 100) {
        console.log('⚠️ Not enough space for table rows, moving entire table');
        return { keepComponent: null, moveComponent: component, keptRowCount: 0, movedRowCount: 0 };
      }

      // Determine how many COMPLETE rows will fit
      let accumulatedRowHeight = 0;
      let rowsToKeep = 0;
      for (let i = 0; i < rows.length; i++) {
        const rowHeight = rows[i].offsetHeight || 0;
        if (accumulatedRowHeight + rowHeight <= availableHeight) {
          accumulatedRowHeight += rowHeight;
          rowsToKeep++;
        } else {
          break;
        }
      }

      const MIN_ROWS_TO_SPLIT = 3;
      if (rowsToKeep < MIN_ROWS_TO_SPLIT) {
        console.log(`⚠️ Only ${rowsToKeep} rows fit (minimum ${MIN_ROWS_TO_SPLIT} required), moving entire table`);
        return { keepComponent: null, moveComponent: component, keptRowCount: 0, movedRowCount: 0 };
      }

      if (rowsToKeep === rows.length) {
        console.log('✅ All table rows fit on current page');
        return { keepComponent: component, moveComponent: null, keptRowCount: rowsToKeep, movedRowCount: 0 };
      }

      console.log(`📊 Splitting table: ${rowsToKeep} rows on current page, ${rows.length - rowsToKeep} rows to next page`);

      // -------------------------
      // Preserve DataTable settings (if applicable)
      // -------------------------
      let dtSettings = null;
      const tableId = tableEl.id;
      try {
        if (tableId && typeof $ !== 'undefined' && $.fn && $.fn.DataTable && $.fn.DataTable.isDataTable && $.fn.DataTable.isDataTable(`#${tableId}`)) {
          const dt = $(`#${tableId}`).DataTable();
          const info = dt.page ? dt.page.info() : {};
          dtSettings = {
            paging: !!info.length,
            pageLength: info.length || dt.page.len?.() || null,
            searching: dt.settings && dt.settings()[0]?.oFeatures?.bFilter,
            ordering: dt.settings && dt.settings()[0]?.aaSorting,
            buttons: (dt.buttons && dt.buttons().container && dt.buttons().context?.[0]?.inst?.s?.buttons) || []
          };
          // Destroy DataTable to manipulate DOM safely
          try { dt.destroy(); } catch (e) { /* ignore destroy errors */ }
        }
      } catch (err) {
        console.warn('⚠️ Error while extracting/destroying DataTable:', err);
      }

      // -------------------------
      // STEP 1: Extract rows to move as HTML to avoid DOM/component references
      // -------------------------
      const rowsToMoveHTML = [];
      for (let i = rowsToKeep; i < rows.length; i++) {
        rowsToMoveHTML.push(rows[i].outerHTML);
      }

      // -------------------------
      // STEP 2: Remove moving rows from original GrapesJS component tree (if present) AND DOM
      // -------------------------
      // Remove from GrapesJS component tree first (safer)
      if (tbodyComp && typeof tbodyComp.components === 'function') {
        const rowComponents = tbodyComp.components();
        const totalRows = rowComponents.length;
        for (let i = totalRows - 1; i >= rowsToKeep; i--) {
          const rowComp = rowComponents.at(i);
          if (rowComp) {
            try {
              console.log(`🗑️ Removing GrapesJS row component at index ${i}`);
              rowComp.remove();
            } catch (err) {
              console.warn('⚠️ Failed to remove GrapesJS row component:', err);
            }
          }
        }
      }

      // Remove from DOM as a fallback / double-safety
      for (let i = rows.length - 1; i >= rowsToKeep; i--) {
        if (rows[i] && rows[i].parentNode) {
          try {
            console.log(`🗑️ Removing DOM row at index ${i}`);
            rows[i].parentNode.removeChild(rows[i]);
          } catch (err) {
            console.warn('⚠️ Failed to remove DOM row:', err);
          }
        }
      }

      // Force update original component view to reflect removals
      setTimeout(() => {
        try {
          const currentTbodyComp = component.find && component.find('tbody') ? component.find('tbody')[0] : null;
          if (currentTbodyComp && typeof currentTbodyComp.components === 'function') {
            const remainingRows = currentTbodyComp.components().length;
            console.log(`✅ Original table now has ${remainingRows} rows (kept ${rowsToKeep})`);
          }
          if (component.view && typeof component.view.render === 'function') component.view.render();
        } catch (e) {
          console.warn('⚠️ Error updating original component view:', e);
        }
      }, 120);

      console.log(`✂️ Removed ${rowsToMoveHTML.length} rows from original table`);

      // NEW: Set contenteditable and reattach handlers on kept table
      setTimeout(() => {
        const keptEl = component.getEl();
        if (!keptEl) {
          console.warn("⚠️ keptComponent element not available");
          return;
        }

        const keptTableEl = keptEl.querySelector('table') || keptEl;
        if (!keptTableEl) {
          console.warn("⚠️ No <table> element found in kept component!");
          return;
        }

        console.log("✅ Found kept table element:", keptTableEl.id);

        // ✅ Reattach DOM cell editability
        const tdCells = keptTableEl.querySelectorAll('td, th');
        tdCells.forEach((cell, i) => {
          cell.setAttribute('contenteditable', 'true');
          console.log(`🟩 DOM editable set for kept cell [${i}] → id: ${cell.id || '(no id)'}`);
        });

        // ✅ Reattach GrapesJS model editability for cell components
        const cellComponents = component.find('td, th');
        console.log(`🔍 Found ${cellComponents.length} GrapesJS kept cell components`);
        cellComponents.forEach((cellComp, i) => {
          cellComp.addAttributes({ contenteditable: 'true' });
          cellComp.set({ editable: true });
          console.log(`🟦 GrapesJS editable set for kept cell component [${i}] → id: ${cellComp.getId()}`);
        });

        console.log(`✅ Kept table editable setup complete — ${tdCells.length} DOM cells, ${cellComponents.length} model cells.`);

        // ✅ CALL THE REATTACH HANDLER FUNCTION (PageSetupManager)
        const pageSetupManager = this.editor.get('PageSetupManager');
        if (pageSetupManager && typeof pageSetupManager.reattachAllCellHandlers === 'function') {
          const keptTableId = keptTableEl.id;
          if (keptTableId) {
            pageSetupManager.reattachAllCellHandlers(keptTableId);
            console.log(`✅ Reattached all cell handlers for kept table: ${keptTableId}`);
          } else {
            console.warn('⚠️ Kept table has no id — cannot reattach by id.');
          }
        }
      }, 400);

      // -------------------------
      // STEP 3: Build continuation table (structure only, then insert moved rows)
      // -------------------------
      // NEW: Ask user if they want header on next page
      // NEW: Ask user if they want header on next page
      let copyHeader = false;
      const hasThead = !!tableEl.querySelector('thead');
      if (hasThead && rowsToKeep > 0 && rowsToMoveHTML.length > 0) {
        // Use confirm with OK/Cancel - OK returns true, Cancel returns false
        copyHeader = confirm("Do you want to repeat the table header on the next page?\n\nClick OK to include header\nClick Cancel to skip header");
      }

      const continuationTableEl = tableEl.cloneNode(false); // shallow clone (no children)
      const continuationThead = copyHeader ? tableEl.querySelector('thead')?.cloneNode(true) : null;
      const continuationTbody = document.createElement('tbody');
      const continuationTfoot = tableEl.querySelector('tfoot')?.cloneNode(true);

      // Only add thead if user confirmed
      if (copyHeader && continuationThead) {
        continuationTableEl.appendChild(continuationThead);
        console.log('✅ Header will be included on next page');
      } else {
        console.log('⏭️ Header will NOT be included on next page (user choice)');
      }

      continuationTableEl.appendChild(continuationTbody);
      if (continuationTfoot) continuationTableEl.appendChild(continuationTfoot);

      // Insert moved rows HTML
      continuationTbody.innerHTML = rowsToMoveHTML.join('');
      console.log(`✅ Created continuation table with ${continuationTbody.rows.length} rows`);

      // Wrap continuation table in a container matching original component structure
      const continuationWrapper = compEl.cloneNode(false);
      continuationWrapper.innerHTML = '';
      const newTableId = `table-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      continuationTableEl.id = newTableId;
      continuationWrapper.appendChild(continuationTableEl);

      // -------------------------
      // STEP 4: Modify JSON/state attribute for continuation component if present
      // -------------------------
      let modifiedState = null;
      const originalStateAttr = component.getAttributes && component.getAttributes()['data-json-state'];
      if (originalStateAttr) {
        try {
          const stateData = JSON.parse(decodeURIComponent(originalStateAttr));
          if (stateData && Array.isArray(stateData.data)) {
            // Keep only the rows that moved
            stateData.data = stateData.data.slice(rowsToKeep);
            stateData.dataRows = stateData.data.length;
            modifiedState = encodeURIComponent(JSON.stringify(stateData));
            console.log(`🔧 Modified state for continuation: ${stateData.data.length} data rows`);
          }
        } catch (err) {
          console.warn('⚠️ Error parsing/modifying state attribute:', err);
        }
      }

      // -------------------------
      // STEP 5: Create NEW GrapesJS component for continuation (fresh component)
      // -------------------------
      // Around line 1480 in handleTableSplit, replace the newComponentConfig section:

      // -------------------------
      // STEP 5: Create NEW GrapesJS component for continuation (fresh component)
      // -------------------------
      const newComponentConfig = {
        type: component.get && component.get('type') || 'default',
        tagName: component.get && component.get('tagName') || 'div',
        content: continuationWrapper.outerHTML,
        attributes: {
          ...component.getAttributes(),
          'data-continuation-table': 'true',
          'data-original-table-id': tableId || '',
          'data-rows-kept': rowsToKeep,
          'data-split-table': 'continuation',
          'data-copy-header': copyHeader ? 'true' : 'false'
        },
        classes: [...(component.getClasses ? component.getClasses() : [])],
        style: { ...(component.getStyle ? component.getStyle() : {}) }
      };

      if (modifiedState) {
        newComponentConfig.attributes['data-json-state'] = modifiedState;
      }

      // Add new component to GrapesJS
      const newComponent = this.editor.Components.addComponent(newComponentConfig);

      // ✅ IMMEDIATELY remove thead from GrapesJS component if user chose not to copy
      if (!copyHeader && newComponent) {
        setTimeout(() => {
          const theadComp = newComponent.find('thead')[0];
          if (theadComp) {
            console.log('🗑️ Removing thead component from GrapesJS tree immediately');
            theadComp.remove();

            // Also remove from DOM to ensure sync
            const newTableEl = newComponent.getEl()?.querySelector('table');
            if (newTableEl) {
              const theadEl = newTableEl.querySelector('thead');
              if (theadEl) {
                theadEl.remove();
                console.log('🗑️ Removed thead from DOM as well');
              }
            }

            // Force view update
            if (newComponent.view && newComponent.view.render) {
              newComponent.view.render();
            }
          }
        }, 100);
      }
      // -------------------------
      // STEP 6: Reinitialize DataTable on kept portion ONLY (if settings captured)
      // -------------------------
      if (dtSettings && tableId) {
        setTimeout(() => {
          try {
            const keptTableEl = component.getEl()?.querySelector('table');
            if (keptTableEl && typeof $ !== 'undefined' && $.fn && $.fn.DataTable) {
              if ($.fn.DataTable.isDataTable(keptTableEl)) {
                try { $(keptTableEl).DataTable().destroy(); } catch (e) { /* ignore */ }
              }
              // Reinitialize with minimal features for static view
              $(keptTableEl).DataTable({
                paging: false,
                searching: false,
                ordering: false,
                info: false
              });
            }
          } catch (err) {
            console.warn('⚠️ Error reinitializing DataTable on kept portion:', err);
          }
        }, 300);
      }

      // -------------------------
      // STEP 7: Extra verification/fix (best-effort) to ensure GrapesJS tree matches expected kept rows
      // -------------------------
      setTimeout(() => {
        try {
          const originalTbodyComp = component.find && component.find('tbody') ? component.find('tbody')[0] : null;
          if (originalTbodyComp && typeof originalTbodyComp.components === 'function') {
            const rowsLeft = originalTbodyComp.components().length;
            console.log(`🔎 Verification: Original table has ${rowsLeft} rows (should be ${rowsToKeep})`);
            if (rowsLeft !== rowsToKeep) {
              console.error(`❌ Row count mismatch! Expected ${rowsToKeep}, got ${rowsLeft} — attempting correction.`);
              const allRows = originalTbodyComp.components();
              for (let i = allRows.length - 1; i >= rowsToKeep; i--) {
                try {
                  allRows.at(i).remove();
                } catch (err) {
                  console.warn('⚠️ Failed to remove extra row component during correction:', err);
                }
              }
            }
          }
        } catch (err) {
          console.warn('⚠️ Verification step failed:', err);
        }
      }, 200);

      console.log(`✅ Table split complete - original: ${rowsToKeep} rows, continuation: ${rowsToMoveHTML.length} rows`);

      return {
        keepComponent: component,
        moveComponent: newComponent,
        keptRowCount: rowsToKeep,
        movedRowCount: rowsToMoveHTML.length
      };
    } catch (error) {
      console.error('❌ Error splitting table (catch):', error);
      return {
        keepComponent: null,
        moveComponent: component,
        keptRowCount: 0,
        movedRowCount: 0
      };
    }
  }

  splitLargeComponent(component, availableSpace) {
    console.log('splitLargeComponent ====');
    const compEl = component.getEl();

    if (!compEl || component.get('type') !== 'formatted-rich-text') {
      return { keepComponent: component, moveComponent: null };
    }

    // ✅ CRITICAL FIX: Check if content actually fits before splitting
    const currentHeight = compEl.scrollHeight;

    // If content fits within available space (with small buffer), don't split
    if (currentHeight <= availableSpace + 50) {
      console.log(`✅ Content fits (${currentHeight}px <= ${availableSpace}px), no split needed`);
      return { keepComponent: component, moveComponent: null };
    }

    // ✅ Capture ALL styles before splitting
    const computed = window.getComputedStyle(compEl);
    const preservedStyles = {};

    // Capture comprehensive style list
    ['display', 'position', 'width', 'height', 'margin', 'padding',
      'border', 'background', 'background-color', 'color', 'font-family',
      'font-size', 'font-weight', 'font-style', 'text-align', 'line-height',
      'letter-spacing', 'text-decoration', 'text-transform', 'vertical-align',
      'white-space', 'word-wrap', 'word-break', 'overflow-wrap'
    ].forEach(prop => {
      const value = computed.getPropertyValue(prop);
      if (value && value !== 'none' && value !== 'normal') {
        preservedStyles[prop] = value;
      }
    });

    // ✅ Get original content BEFORE clearing
    const originalHTML = compEl.innerHTML;
    const originalNodes = Array.from(compEl.childNodes);

    // Safety check - if no nodes, don't split
    if (originalNodes.length === 0) {
      console.log('⚠️ No nodes to split');
      return { keepComponent: component, moveComponent: null };
    }

    const nodesToMove = [];

    // Clear temporarily
    compEl.innerHTML = '';

    // --- Node Splitting Logic ---
    for (let i = 0; i < originalNodes.length; i++) {
      const node = originalNodes[i];

      // 1. Add node back to div
      compEl.appendChild(node);

      const currentContentHeight = compEl.offsetHeight;

      if (currentContentHeight > availableSpace) {
        // 🛑 OVERFLOW FOUND!

        // 2. Remove the overflowing node
        compEl.removeChild(node);

        // 3. SPECIAL HANDLING: If it's a Text Node 
        if (node.nodeType === Node.TEXT_NODE) {
          const fullText = node.textContent;

          // Call character-level splitting function
          const { textToKeep, textToMove } = this._splitLongTextNode(
            fullText,
            compEl,
            availableSpace
          );

          // If splitting successful
          if (textToKeep && textToKeep.length > 0 && textToMove && textToMove.length > 0) {
            // a) Update original node with new content
            node.textContent = textToKeep;

            // b) Add original node back to compEl
            compEl.appendChild(node);

            // c) Create new Text Node to move
            const newNodeToMove = document.createTextNode(textToMove);

            // d) Add new node and remaining nodes to move list
            nodesToMove.push(newNodeToMove, ...originalNodes.slice(i + 1));

            break;
          }
        }

        // Default action (Non-Text Node or Text Splitting failed)
        nodesToMove.push(node, ...originalNodes.slice(i + 1));
        break;
      }
    }
    // --- End Node Splitting Logic ---

    // ✅ CRITICAL FIX: If no nodes to move, restore original content
    if (nodesToMove.length === 0) {
      console.log('⚠️ No nodes to move - restoring original content');
      compEl.innerHTML = originalHTML;
      return { keepComponent: component, moveComponent: null };
    }

    // 1. Original Component (Current Page) Sync
    const contentThatFits = compEl.innerHTML;

    // Safety check - ensure we're not setting empty content
    if (!contentThatFits || contentThatFits.trim() === '') {
      console.log('⚠️ Content that fits is empty - restoring original');
      compEl.innerHTML = originalHTML;
      return { keepComponent: component, moveComponent: null };
    }

    component.set('content', contentThatFits);

    // ✅ Reapply styles to original component
    component.setStyle(preservedStyles);

    // 2. Create new component for overflow content
    let secondPartHTML = '';
    nodesToMove.forEach(node => {
      if (node.outerHTML) {
        secondPartHTML += node.outerHTML;
      } else if (node.textContent) {
        secondPartHTML += node.textContent;
      }
    });

    // Safety check - ensure we have content to move
    if (!secondPartHTML || secondPartHTML.trim() === '') {
      console.log('⚠️ No content to move - keeping all on current page');
      return { keepComponent: component, moveComponent: null };
    }

    // 3. Create new component via GrapesJS
    const newComponent = this.editor.Components.addComponent({
      type: component.get('type'),
      tagName: component.get('tagName') || 'div',
      content: secondPartHTML,
      style: preservedStyles,
      attributes: { ...component.getAttributes() },
      classes: component.getClasses()
    });

    // ✅ Force render with styles
    if (newComponent.view) {
      newComponent.view.render();
    }

    console.log(`✅ Split successful - kept ${contentThatFits.length} chars, moving ${secondPartHTML.length} chars`);

    return {
      keepComponent: component,
      moveComponent: newComponent
    };
  }

  _splitLongTextNode(fullText, containerEl, availableSpace) {
    let textToKeep = '';
    const testNode = document.createTextNode('');

    // 1. containerEl mein temporary node daalo
    // Note: containerEl mein abhi sirf woh nodes hain jo fit ho chuke hain 
    // (splitLargeComponent ke loop se).
    containerEl.appendChild(testNode);

    for (let charIndex = 0; charIndex < fullText.length; charIndex++) {
      textToKeep += fullText[charIndex];
      testNode.textContent = textToKeep;

      // Height check: Ab containerEl.offsetHeight mein fit hone waala content +
      // current temporary text node ka content dono shamil hai.
      if (containerEl.offsetHeight > availableSpace) {
        // Height exceed ho gayi. Aakhri character wapas le lo.
        textToKeep = textToKeep.substring(0, textToKeep.length - 1);

        if (textToKeep.length === 0) {
          break;
        }
        break;
      }
    }

    // Temporary testNode ko hata do
    containerEl.removeChild(testNode);

    const textToMove = fullText.substring(textToKeep.length);

    return { textToKeep, textToMove };
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

  async moveComponentsToPage(components, targetPageIndex) {
    console.log('🟦 moveComponentsToPage called for page:', targetPageIndex);

    try {
      // === START: CRITICAL FIX - extract subreport children ===
      const originalFirstComponent = components && components[0];

      const actualComponentsToMove = [];

      for (const component of components) {
        const isSubreport =
          (typeof component.get === 'function' && component.get('type') === 'subreport') ||
          (component.getEl && component.getEl()?.classList?.contains('subreport-block'));

        if (isSubreport) {
          console.log('📦 Subreport detected, extracting children...');
          const children = component.components && component.components();

          if (children && children.length > 0) {
            console.log(`✂️ Extracting ${children.length} children from subreport`);

            children.forEach((child) => {
              // Mark extracted child so we can identify it later
              try {
                if (typeof child.addAttributes === 'function') {
                  child.addAttributes({ 'data-subreport-content': 'true' });
                } else if (child.getAttributes && child.getAttributes()) {
                  // fallback: mutate attributes object
                  const attrs = child.getAttributes() || {};
                  attrs['data-subreport-content'] = 'true';
                  if (typeof child.addAttributes === 'function') child.addAttributes(attrs);
                }
              } catch (e) {
                // non-fatal
              }

              actualComponentsToMove.push(child);
            });

            // Remove children from subreport (they will be moved independently)
            try {
              component.components().reset();
            } catch (e) {
              // ignore if reset unavailable
            }

            console.log(`✅ Extracted ${children.length} components from subreport`);
          } else {
            // Empty subreport, move the subreport itself
            actualComponentsToMove.push(component);
          }
        } else {
          // Regular component
          actualComponentsToMove.push(component);
        }
      }

      console.log(`📊 Total components to move: ${actualComponentsToMove.length}`);
      // === END: extraction ===

      const wrapper = this.editor.getWrapper();
      const targetPageComponent = wrapper.find(`[data-page-index="${targetPageIndex}"]`)[0];
      if (!targetPageComponent) {
        console.error(`❌ Target page ${targetPageIndex} not found`);
        return false;
      }

      let targetContentArea = targetPageComponent.find('.main-content-area')[0];
      if (!targetContentArea) {
        console.error(`❌ Target content area not found`);
        return false;
      }

      // ✅ STEP 1: Get the source section's count BEFORE any operations
      let sourceSectionCount = null;
      const firstComponent = originalFirstComponent;
      if (firstComponent) {
        const sourceSection = firstComponent.closest && firstComponent.closest('.sections-container');
        if (sourceSection) {
          sourceSectionCount = sourceSection.getAttributes && sourceSection.getAttributes()['data-section-count'];
          console.log(`📦 Source section count: ${sourceSectionCount}`);
        }
      }

      // Wait for DOM to stabilize
      await new Promise((resolve) => setTimeout(resolve, 150));

      // ✅ STEP 2: Check if target page needs sections container
      let targetSection = targetContentArea.find('.sections-container')[0];

      if (!targetSection && sourceSectionCount) {
        console.log(`🏗️ Creating section container BEFORE moving content...`);

        // Create section container with SAME count (autopagination)
        targetSection = targetContentArea.append({
          type: 'Sections',
          attributes: {
            'data-section-count': sourceSectionCount // ✅ Use same count
          }
        })[0];

        const allPages = wrapper.find('.page-container');
        for (let page of allPages) {
          const existingSection = page.find('.sections-container')[0];
          if (existingSection) {
            const existingCount = existingSection.getAttributes && existingSection.getAttributes()['data-section-count'];
            if (existingCount === sourceSectionCount && existingSection !== targetSection) {
              // Found source section - copy header
              const sourceHeader = existingSection.find('.section-header')[0];
              const targetHeader = targetSection.find('.section-header')[0];

              if (sourceHeader && targetHeader) {
                targetHeader.components().reset();
                sourceHeader.components().forEach((comp) => {
                  targetHeader.append(comp.clone());
                });
                console.log(`✅ Copied header content to new section on page ${targetPageIndex}`);
              }
              break;
            }
          }
        }

        console.log(`✅ Created section on page ${targetPageIndex} with preserved count: ${sourceSectionCount}`);
        // Wait for section to be created in DOM
        await new Promise((resolve) => setTimeout(resolve, 200));
      } else if (targetSection) {
        // ✅ Verify existing section has correct count
        const existingCount = targetSection.getAttributes && targetSection.getAttributes()['data-section-count'];
        console.log(`✅ Section already exists with count: ${existingCount}`);

        // If count doesn't match and we have source count, update it
        if (sourceSectionCount && existingCount !== sourceSectionCount) {
          console.log(`🔄 Updating section count from ${existingCount} to ${sourceSectionCount}`);
          targetSection.addAttributes({
            'data-section-count': sourceSectionCount
          });
        }
      }

      // ✅ STEP 3: Determine final target (section-content or main-content-area)
      let finalTarget = targetContentArea;

      if (targetSection) {
        const sectionContent = targetSection.find('.section-content')[0];
        if (sectionContent) {
          finalTarget = sectionContent;
          console.log(`✅ Using '.section-content' as target on page ${targetPageIndex}`);
        } else {
          const namedContent = targetSection.components()
            .find((c) => c.get('name') === 'Content' || c.get('name') === 'section Content');
          if (namedContent) {
            finalTarget = namedContent;
            console.log(`✅ Using named 'Content' section as target on page ${targetPageIndex}`);
          }
        }
      }

      targetContentArea = finalTarget;

      // ✅ STEP 4: Now move components to the prepared target
      // Temporarily disconnect observer
      const observer = this.pageObservers.get(targetPageIndex);
      if (observer) observer.disconnect();

      let moved = 0;

      // === START: MAIN LOOP - iterate over extracted components ===
      for (const [index, component] of actualComponentsToMove.entries()) {
        if (!component) continue;

        try {
          const compEl = component.getEl && component.getEl();
          const isTable =
            compEl &&
            (compEl.tagName === 'TABLE' || compEl.querySelector('table') !== null || compEl.classList.contains('json-table-container') || compEl.classList.contains('json-data-table'));

          // ✅ ADD: Special handling flag for subreport-extracted content
          const isFromSubreport = (component.getAttributes && component.getAttributes()['data-subreport-content'] === 'true') || false;
          if (isFromSubreport) {
            console.log(`📄 Moving subreport content: ${component.get('tagName') || 'unknown'}`);
          }

          // ------------------ Handle table components ------------------
          if (isTable) {
            console.log(`📊 Handling table component ${index}`);

            const attrs = component.getAttributes && component.getAttributes();
            const isSplitTable = attrs && (attrs['data-split-table'] === 'continuation' || attrs['data-continuation-table'] === 'true');

            const copyHeaderAttr = attrs && attrs['data-copy-header'];
            const shouldRemoveHeader = copyHeaderAttr === 'false';

            let dtData = null;
            const tableEl = compEl.tagName === 'TABLE' ? compEl : compEl.querySelector('table');

            if (!isSplitTable && tableEl && typeof $ !== 'undefined' && $.fn.DataTable && $.fn.DataTable.isDataTable(tableEl)) {
              const dt = $(tableEl).DataTable();
              dtData = {
                data: dt.rows().data().toArray(),
                columns: dt.settings()[0].aoColumns,
                order: dt.order()
              };
              dt.destroy();
              console.log('📦 Preserved DataTable state');
            }

            // ✅ Remove thead from component BEFORE getting HTML if user chose not to copy
            if (shouldRemoveHeader) {
              console.log('🗑️ Removing header from component before moving...');
              const theadComp = component.find && component.find('thead') && component.find('thead')[0];
              if (theadComp) {
                theadComp.remove();
                console.log('✅ Removed thead from GrapesJS component tree');
              }

              // Also remove from DOM
              if (tableEl) {
                const theadEl = tableEl.querySelector('thead');
                if (theadEl) {
                  theadEl.remove();
                  console.log('✅ Removed thead from DOM');
                }
              }
            }

            const fullHTML = component.toHTML();
            component.remove();

            const newComponent = targetContentArea.append(fullHTML)[0];
            const componentType = component.get && component.get('type');
            const isSubreport = componentType === 'subreport';
            const sharePageNumber = component.getAttributes && component.getAttributes().sharePageNumber;

            if (isSubreport && sharePageNumber === false) {
              // Mark this page as subreport page that should skip numbering
              const targetPageSettings = this.pageSettings.pages[targetPageIndex];
              if (targetPageSettings) {
                targetPageSettings.isSubreportPage = true;
                targetPageSettings.skipPageNumber = true;
                console.log(`🏷️ Page ${targetPageIndex + 1} marked as subreport page (skip numbering)`);
              }
            }

            console.log('🧩 New table component added:', newComponent?.getId?.() || '(unknown)');

            // Primary setup for table cells
            setTimeout(() => {
              const newEl = newComponent.getEl && newComponent.getEl();
              if (!newEl) {
                console.warn('⚠️ newComponent element not yet available');
                return;
              }

              const tableEl = newEl.querySelector('table') || newEl;
              if (!tableEl) {
                console.warn('⚠️ No <table> element found inside new component!');
                return;
              }

              console.log('✅ Found table element:', tableEl.id);

              // ✅ CRITICAL: Double-check header removal in new component
              if (shouldRemoveHeader) {
                const theadComp = newComponent.find && newComponent.find('thead') && newComponent.find('thead')[0];
                if (theadComp) {
                  console.log('🗑️ Removing thead from new component (double-check)');
                  theadComp.remove();
                }

                const theadEl = tableEl.querySelector('thead');
                if (theadEl) {
                  console.log('🗑️ Removing thead from new DOM (double-check)');
                  theadEl.remove();
                }

                // Force component update
                if (newComponent.view && newComponent.view.render) {
                  newComponent.view.render();
                }
              }

              // ✅ Reattach DOM cell editability
              const tdCells = tableEl.querySelectorAll('td, th');
              tdCells.forEach((cell) => {
                cell.setAttribute('contenteditable', 'true');
              });

              // ✅ Reattach GrapesJS model editability for cell components
              const cellComponents = newComponent.find && newComponent.find('td, th');
              (cellComponents || []).forEach((cellComp) => {
                try {
                  cellComp.addAttributes({ contenteditable: 'true' });
                  cellComp.set({ editable: true });
                } catch (e) {
                  // ignore
                }
              });

              console.log(`✅ Table editable setup complete — ${tdCells.length} DOM cells, ${(cellComponents || []).length} model cells.`);

              // ✅ Reattach cell handlers
              const pageSetupManager = this.editor.get('PageSetupManager');
              if (pageSetupManager && typeof pageSetupManager.reattachAllCellHandlers === 'function') {
                const tableId = tableEl.id;
                if (tableId) {
                  pageSetupManager.reattachAllCellHandlers(tableId);
                  console.log(`✅ Reattached all cell handlers for table: ${tableId}`);
                }
              }

              // DataTable reinitialization
              if (dtData) {
                const newTableEl = newEl.querySelector('table') || newEl;
                if (newTableEl && typeof $ !== 'undefined' && $.fn.DataTable) {
                  $(newTableEl).DataTable({
                    data: dtData.data,
                    columns: dtData.columns,
                    order: dtData.order,
                    paging: false,
                    searching: false,
                    info: false
                  });
                  console.log('🔁 Reinitialized DataTable');
                }
              } else {
                const newTableEl = newEl.querySelector('table') || newEl;
                if (newTableEl && typeof $ !== 'undefined' && $.fn.DataTable) {
                  if ($.fn.DataTable.isDataTable(newTableEl)) {
                    $(newTableEl).DataTable().destroy();
                  }
                  $(newTableEl).DataTable({
                    paging: false,
                    searching: false,
                    ordering: false,
                    info: false
                  });
                  console.log('🔁 Initialized new DataTable on moved/continuation table');
                }
              }
            }, 400);

            // Copy data-* attributes
            if (newComponent) {
              setTimeout(() => {
                const newTableEl = newComponent.getEl && newComponent.getEl();
                if (newTableEl) {
                  const allCells = newTableEl.querySelectorAll('td, th');
                  allCells.forEach((cell) => {
                    if (!cell.hasAttribute('contenteditable')) {
                      cell.setAttribute('contenteditable', 'true');
                    }

                    const originalCell = compEl.querySelector && compEl.querySelector(`#${cell.id}`);
                    if (originalCell) {
                      Array.from(originalCell.attributes).forEach((attr) => {
                        if (attr.name.startsWith('data-')) {
                          cell.setAttribute(attr.name, attr.value);
                        }
                      });
                    }
                  });
                }
              }, 300);

              moved++;
              console.log(`✅ Moved table component ${index} with editability preserved`);
            }

            continue;
          }
          // ------------------ End table handling ------------------

          // ✅ Regular component logic
          const clonedComponent = component.clone && component.clone();
          const fullHTML = component.toHTML && component.toHTML();

          const sourceEl = component.getEl && component.getEl();
          let computedStyles = {};
          if (sourceEl) {
            const computed = window.getComputedStyle(sourceEl);
            const stylesToCapture = [
              'display', 'position', 'width', 'height', 'margin', 'padding',
              'border', 'background', 'color', 'font-family', 'font-size',
              'font-weight', 'text-align', 'line-height', 'vertical-align',
              'flex', 'flex-direction', 'justify-content', 'align-items',
              'grid', 'grid-template-columns', 'grid-gap',
              'overflow', 'white-space', 'word-wrap', 'text-overflow',
              'box-sizing', 'z-index', 'opacity', 'transform'
            ];
            stylesToCapture.forEach((prop) => {
              const value = computed.getPropertyValue(prop);
              if (value && value !== 'none' && value !== 'normal') {
                computedStyles[prop] = value;
              }
            });
          }

          const preservedData = {
            html: fullHTML,
            attributes: JSON.parse(JSON.stringify(component.getAttributes && component.getAttributes() || {})),
            classes: [...(component.getClasses && component.getClasses() || [])],
            style: JSON.parse(JSON.stringify(component.getStyle && component.getStyle() || {})),
            computedStyles,
            name: component.get('name'),
            editable: component.get('editable')
          };

          const parent = component.parent && component.parent();
          component.remove && component.remove();
          if (parent && parent.components && parent.components().length === 0 && parent.getEl && parent.getEl() && parent.getEl().innerHTML.trim() === '') {
            console.log('🗑️ Removing empty parent container');
            parent.remove && parent.remove();
          }

          try {
            targetContentArea.components().add(clonedComponent, { at: 0 });
            moved++;
            console.log(`✅ Moved cloned component ${index}`);
            continue;
          } catch (cloneError) {
            console.warn('⚠️ Clone failed, using HTML reconstruction:', cloneError);
          }

          try {
            const newComponent = targetContentArea.append(preservedData.html)[0];
            if (newComponent) {
              const combinedStyles = { ...preservedData.computedStyles, ...preservedData.style };
              newComponent.setStyle && newComponent.setStyle(combinedStyles);
              newComponent.addAttributes && newComponent.addAttributes(preservedData.attributes);
              newComponent.setClass && newComponent.setClass(preservedData.classes);
              newComponent.set && newComponent.set({ editable: preservedData.editable });
              moved++;
              console.log(`✅ Moved reconstructed component ${index} with styles`);
            }
          } catch (reconstructError) {
            console.error(`❌ Failed to reconstruct component ${index}:`, reconstructError);
          }

        } catch (err) {
          console.error(`❌ Error moving component ${index}:`, err);
        }
      }
      // === END: MAIN LOOP ===

      // Reconnect observer
      setTimeout(() => {
        this.setupPageObserver(targetPageIndex);
      }, 300);

      return moved > 0;
    } catch (error) {
      console.error('❌ Error in moveComponentsToPage:', error);
      return false;
    }
  }







  getAccurateComponentHeight(element) {
    if (!element) return 0;

    // ✅ Special handling for json-table wrapper
    if (element.classList.contains('json-table-wrapper') ||
      element.classList.contains('json-table-container')) {

      const table = element.querySelector('table');
      if (table) {
        // Force layout recalculation
        table.offsetHeight;

        // ✅ Account for pagination controls
        const wrapper = element.querySelector('.dataTables_wrapper');
        if (wrapper) {
          const wrapperHeight = wrapper.scrollHeight; // Use scrollHeight instead of offsetHeight
          const computedStyle = window.getComputedStyle(wrapper);
          const marginTop = parseFloat(computedStyle.marginTop) || 0;
          const marginBottom = parseFloat(computedStyle.marginBottom) || 0;

          // Add extra buffer to prevent cell cutting
          const buffer = 30;
          return wrapperHeight + marginTop + marginBottom + buffer;
        }

        // Fallback: Calculate from actual table content
        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');
        const tfoot = table.querySelector('tfoot');

        let totalHeight = 0;
        if (thead) totalHeight += thead.offsetHeight;
        if (tbody) {
          // Sum all row heights to get accurate tbody height
          Array.from(tbody.rows).forEach(row => {
            totalHeight += row.offsetHeight;
          });
        }
        if (tfoot) totalHeight += tfoot.offsetHeight;

        const tableStyle = window.getComputedStyle(table);
        const marginTop = parseFloat(tableStyle.marginTop) || 0;
        const marginBottom = parseFloat(tableStyle.marginBottom) || 0;

        return totalHeight + marginTop + marginBottom + 30; // Buffer for borders/spacing
      }
    }
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
    console.log('🟢 setupPageObserver:', pageIndex);

    // 🔹 Step 1: Locate the page component and main content area
    const pageComponent = this.editor.getWrapper().find(`[data-page-index="${pageIndex}"]`)[0];
    if (!pageComponent) return console.warn(`❌ Page component not found for index ${pageIndex}`);

    const contentArea = pageComponent.find('.main-content-area')[0];
    if (!contentArea) return console.warn(`❌ .main-content-area not found in page ${pageIndex}`);

    // Always attach observer to .main-content-area
    const contentEl = contentArea.getEl();
    if (!contentEl) return console.warn(`❌ contentEl (DOM) not available for page ${pageIndex}`);

    // 🔹 Step 2: Disconnect existing observer if any
    if (this.pageObservers.has(pageIndex)) {
      this.pageObservers.get(pageIndex).disconnect();
    }

    let lastContentHeight = contentEl.scrollHeight;

    // 🔹 Step 3: Define MutationObserver
    const observer = new MutationObserver((mutations) => {
      const activeEl = document.activeElement;
      const isEditing =
        activeEl &&
        (activeEl.isContentEditable || ['TEXTAREA', 'INPUT'].includes(activeEl.tagName));

      if (isEditing) return; // Skip when user is typing/editing

      // 🔹 Dynamically find the most relevant section container
      const sectionsContainer = contentArea.components().find(c =>
        c.getClasses().includes('sections-container')
      );

      let currentSectionContent = null;
      if (sectionsContainer) {
        currentSectionContent =
          sectionsContainer.find('.section-content')[0] ||
          sectionsContainer.components().find(c => c.get('name') === 'Content');
      }

      // Target the best possible element for height calculation
      const targetEl = currentSectionContent ? currentSectionContent.getEl() : contentEl;
      const currentHeight = targetEl.scrollHeight;
      const heightDiff = Math.abs(currentHeight - lastContentHeight);

      console.log(heightDiff, 'heightDiff');
      console.log(currentSectionContent, 'sectionContent');
      console.log(contentArea, 'contentArea');

      // Ignore small changes
      if (heightDiff < 20) return;

      lastContentHeight = currentHeight;

      // Detect DOM structure changes
      const hasDOMChange = mutations.some(m =>
        m.type === 'childList' && (m.addedNodes.length || m.removedNodes.length)
      );
      if (!hasDOMChange) return;

      // 🔹 Debounce pagination triggers
      if (this.debounceTimers.has(pageIndex)) {
        clearTimeout(this.debounceTimers.get(pageIndex));
      }

      const timer = setTimeout(() => {
        if (this.paginationInProgress) return;

        observer.disconnect(); // Pause observer during pagination
        console.log('handleAutoPagination call');
        this.handleAutoPagination(pageIndex);

        // Reconnect after short delay
        setTimeout(() => {
          const obs = this.pageObservers.get(pageIndex);
          if (obs) {
            obs.observe(contentEl, { childList: true, subtree: true });
          }
        }, 500);
      }, 500);

      this.debounceTimers.set(pageIndex, timer);
    });

    // 🔹 Step 4: Start observing
    observer.observe(contentEl, { childList: true, subtree: true });

    this.pageObservers.set(pageIndex, observer);
  }
  restoreCellEditability(tableElement) {
    if (!tableElement) return;

    const allCells = tableElement.querySelectorAll('td, th');

    allCells.forEach(cell => {
      // Make cell editable
      cell.setAttribute('contenteditable', 'true');

      // Ensure cell has proper GrapesJS attributes
      if (!cell.hasAttribute('data-gjs-type')) {
        cell.setAttribute('data-gjs-type', 'json-table-cell');
      }

      // Make cell selectable
      cell.style.cursor = 'text';

      // Add hover effect
      cell.addEventListener('mouseenter', () => {
        cell.style.outline = '1px dashed #3b97e3';
      });

      cell.addEventListener('mouseleave', () => {
        if (!cell.matches(':focus')) {
          cell.style.outline = '';
        }
      });

      // Handle focus
      cell.addEventListener('focus', () => {
        cell.style.outline = '2px solid #3b97e3';
      });

      cell.addEventListener('blur', () => {
        cell.style.outline = '';
      });
    });

    console.log(`✅ Restored editability for ${allCells.length} cells`);
  }
  checkPageForOverflow(pageIndex) {

    console.log('🟢 checkPageForOverflow:', pageIndex);

    // Run basic page break handler first
    this.handlePageBreak(pageIndex);

    // 🔹 Step 1: Locate page and content area
    const pageComponent = this.editor.getWrapper().find(`[data-page-index="${pageIndex}"]`)[0];
    if (!pageComponent) return;

    const contentArea = pageComponent.find('.main-content-area')[0];
    if (!contentArea) return;

    // 🔹 Step 2: Default setup
    let targetArea = contentArea;
    let maxHeight = contentArea.getEl().clientHeight;

    // ✅ NEW: Check for conditional break FIRST
    // Find and update the conditional break section:

    // ✅ Check for conditional break FIRST
    const conditionalBreakSettings = this.pageSettings.conditionalPageBreak;
    let conditionalBreakPosition = null;

    if (conditionalBreakSettings?.enabled) {
      const pageNumber = pageIndex + 1;
      const overrides = conditionalBreakSettings.pageOverrides || {};

      let distanceInMm;

      if (overrides[pageNumber]) {
        distanceInMm = this.convertToMm(overrides[pageNumber].distance, overrides[pageNumber].unit);
        console.log(`🎯 Page ${pageNumber} using override: ${overrides[pageNumber].distance}${overrides[pageNumber].unit}`);
      } else {
        distanceInMm = this.convertToMm(
          conditionalBreakSettings.defaultDistance || 50,
          conditionalBreakSettings.defaultUnit || 'mm'
        );
        console.log(`📋 Page ${pageNumber} using default: ${conditionalBreakSettings.defaultDistance}${conditionalBreakSettings.defaultUnit}`);
      }

      const mmToPx = 96 / 25.4;
      const distanceInPx = Math.round(distanceInMm * mmToPx);
      conditionalBreakPosition = maxHeight - distanceInPx;

      console.log(`✂️ Conditional break position for page ${pageNumber}: ${conditionalBreakPosition}px (distance from bottom: ${distanceInPx}px)`);
    }

    // 🔹 Step 3: Handle section-based layout
    const sectionsContainer = contentArea.find('.sections-container')[0];
    if (sectionsContainer) {
      // Try to find `.section-content` first
      let sectionContent =
        sectionsContainer.find('.section-content')[0] ||
        sectionsContainer.components().find(c => c.get('name') === 'Content');

      // If found, adjust target and maxHeight based on header/footer
      if (sectionContent) {
        targetArea = sectionContent;

        const mainContentHeight = contentArea.getEl().clientHeight;
        const headerComp = sectionsContainer.components().find(c => c.get('name') === 'Header');
        const footerComp = sectionsContainer.components().find(c => c.get('name') === 'Footer');

        let headerHeight = 0;
        let footerHeight = 0;

        if (headerComp?.getEl()) {
          headerHeight = this.getAccurateComponentHeight(headerComp.getEl());
        }

        if (footerComp?.getEl()) {
          footerHeight = this.getAccurateComponentHeight(footerComp.getEl());
        }

        // Subtract header/footer and padding
        console.log("📐 MAIN CONTENT DIMENSIONS (before maxHeight calc)");
        console.log("   mainContentHeight:", mainContentHeight);
        console.log("   headerHeight:", headerHeight);
        console.log("   footerHeight:", footerHeight);

        maxHeight = mainContentHeight - headerHeight - footerHeight - 35;

        console.log("📏 Calculated maxHeight:", maxHeight);


        // ✅ Apply conditional break to section content
        if (conditionalBreakPosition !== null) {
          maxHeight = Math.min(maxHeight, conditionalBreakPosition);
          console.log(`📏 Section content max height: ${maxHeight}px (conditional break applied)`);
        }
      }
    } else if (conditionalBreakPosition !== null) {
      // ✅ Apply conditional break to main content
      maxHeight = Math.min(maxHeight, conditionalBreakPosition);
      console.log(`📏 Main content max height: ${maxHeight}px (conditional break applied)`);
    }

    // 🔹 Step 4: Target DOM element for measurement
    const contentEl = targetArea.getEl();
    if (!contentEl) return;

    // Force browser layout recalculation
    contentEl.offsetHeight;

    const contentHeight = contentEl.scrollHeight;

    // 🔹 Step 5: Check overflow conditions
    const hasScrollOverflow = contentHeight > maxHeight;
    console.log("📏 contentHeight:", contentHeight, " maxHeight:", maxHeight, " => hasScrollOverflow:", hasScrollOverflow);

    const hasVisualOverflow = this.checkDeepVisualOverflow(contentEl, maxHeight);
    console.log("👁️ hasVisualOverflow:", hasVisualOverflow, " element:", contentEl);

    const hasTextOverflow = this.checkTextOverflow(contentEl);
    console.log("🔤 hasTextOverflow:", hasTextOverflow, " element:", contentEl);

    const needsPagination =
      contentHeight > maxHeight ||
      hasScrollOverflow ||
      hasVisualOverflow ||
      hasTextOverflow;

    console.log("🧩 needsPagination:", needsPagination, {
      contentHeight,
      maxHeight,
      hasScrollOverflow,
      hasVisualOverflow,
      hasTextOverflow
    });


    // 🔹 Step 6: Trigger pagination if needed
    if (needsPagination) {
      console.log(`📄 Overflow detected on page ${pageIndex}, triggering pagination...`);
      setTimeout(() => this.handleAutoPagination(pageIndex), 100);
    } else {
      console.log(`✅ No overflow on page ${pageIndex}`);
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


        // Update snapshot
        this.lastContentSnapshot.set(i, currentSnapshot);

        // Check for overflow with delay to allow DOM to settle
        setTimeout(() => {
          this.checkPageForOverflow(i);
        }, 100);
      }
    }
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

  initSharedRegionSync() {
    const editor = this.editor
    if (!editor) return
    // ⬇️ place immediately after you set this.editor = editor (and pass the early-return)
    if (!this._patchedGetCss) {
      const originalGetCss = editor.getCss.bind(editor);
      editor.getCss = (opts = {}) => {
        const raw = originalGetCss(opts);

        // strip any existing @page to avoid duplicates from styles/components
        const cleaned = raw.replace(/@page\s*{[^}]*}/g, '').trim();

        const ps = this.pageSettings || {};
        const format = (ps.format || 'a4').toUpperCase();
        const orientation = (ps.orientation || 'portrait').toLowerCase();
        const m = ps.margins || { top: 0, right: 0, bottom: 0, left: 0 };

        // Use named sizes for standard formats; fallback to mm only for custom
        const sizeValue = format === 'CUSTOM'
          ? (orientation === 'landscape'
            ? `${ps.height}mm ${ps.width}mm`
            : `${ps.width}mm ${ps.height}mm`)
          : `${format} ${orientation}`;

        const pageRule = `@page { size: ${sizeValue}; margin: ${m.top}mm ${m.right}mm ${m.bottom}mm ${m.left}mm; }`;

        return `${pageRule}\n${cleaned}`;
      };
      this._patchedGetCss = true;
    }


    // Track sync operations to prevent infinite loops
    this._syncInProgress = false

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
            // adjust element position to stay within boundaries

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

  setupStrictBoundaryEnforcement() {
    const editor = this.editor;

    /* ---------------------------------------------
     * 1️⃣ Prevent component creation outside page
     * --------------------------------------------- */
    editor.on('component:create', (component) => {
      if (!component || !component.getEl) return;   // <-- prevents undefined crash

      const el = component.getEl();
      if (!el) return;

      const insideMain = el.closest('.main-content-area');
      const insidePage = el.closest('.page-container');

      if (!insideMain || !insidePage) {
        console.warn("🚫 Blocked component creation outside page boundaries");
        component.remove();
      }
    });

    /* ---------------------------------------------
     * 2️⃣ STOP drag over invalid zones (prevents drop)
     * --------------------------------------------- */
    editor.on('drag:drag', (dragData) => {
      const target = dragData?.target;
      if (!target) return;

      const insideMain = target.closest?.('.main-content-area');

      if (!insideMain) {
        dragData.abort = true;
        console.warn("🚫 Drop prevented during drag (not a valid area)");
      }
    });

    /* ---------------------------------------------
     * 3️⃣ Final validation INSIDE IFRAME on drop 
     * (this was causing your issue)
     * --------------------------------------------- */
    editor.on('canvas:drop', (data) => {
      const iframeDoc = editor.Canvas.getDocument();
      const targetEl = data?.target;

      if (!targetEl) return;

      const insideMain = targetEl.closest('.main-content-area');
      const insidePage = targetEl.closest('.page-container');

      if (!insideMain || !insidePage) {
        console.warn("🚫 Drop rejected — outside any valid page area");
        if (data.component) data.component.remove();
      }
    });

    /* ---------------------------------------------
     * 4️⃣ Mark ONLY main-content-area as droppable
     * --------------------------------------------- */
    editor.on('load', () => {
      const iframeBody = editor.Canvas.getBody();

      const allMainAreas = iframeBody.querySelectorAll('.page-container .main-content-area');
      allMainAreas.forEach((el) => {
        el.setAttribute('data-droppable', 'true');
        el.style.position = 'relative';
      });

      /* Disable droppable for everything else */
      const allElems = iframeBody.querySelectorAll('body *');
      allElems.forEach((elem) => {
        if (!elem.classList.contains('main-content-area')) {
          elem.setAttribute('data-droppable', 'false');
        }
      });
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
            @page {
        size: ${this.pageSettings.format.toUpperCase()} ${this.pageSettings.orientation};
        margin: 0;
      }
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
          font-size: 8px !important;
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
/* Conditional Break Indicator */
.conditional-break-indicator {
  position: absolute !important;
  pointer-events: none !important;
  user-select: none !important;
  z-index: 999 !important;
}

.conditional-break-indicator span {
  pointer-events: none !important;
  user-select: none !important;
}

@media print {
  .conditional-break-indicator {
    display: none !important;
  }
}
      [data-continuation-table="true"][data-copy-header="false"] thead,
    [data-split-table="continuation"][data-copy-header="false"] thead {
      display: none !important;
    }
    
    /* Ensure headers are hidden in PDF export */
    @media print {
      [data-continuation-table="true"][data-copy-header="false"] thead,
      [data-split-table="continuation"][data-copy-header="false"] thead {
        display: none !important;
        visibility: hidden !important;
        height: 0 !important;
        overflow: hidden !important;
      }
    }
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
            <h2>📄 Page Setup</h2>
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
            <h3>📄 Header & Footer</h3>
            <p style="font-size: 12px; color: #666; margin-bottom: 15px;">Headers and footers are enabled by default with 1.27cm height.</p>
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
          </div>

          <div class="page-setup-section">
            <h3>📏 Page Margins (mm)</h3>
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

  updatePageRule() {
    // Remove existing @page style if it exists
    const existingStyle = document.getElementById('dynamic-page-rule');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Create new @page rule
    const pageRule = `
    @page {
      size: ${this.pageSettings.format.toUpperCase()} ${this.pageSettings.orientation};
      margin: ${this.pageSettings.margins.top}mm ${this.pageSettings.margins.right}mm ${this.pageSettings.margins.bottom}mm ${this.pageSettings.margins.left}mm;
    }
  `;

    const styleElement = document.createElement('style');
    styleElement.id = 'dynamic-page-rule';
    styleElement.innerHTML = pageRule;
    document.head.appendChild(styleElement);
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

    this.updatePageRule();

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

      <!--
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
      </div> -->

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
            <!-- <div class="position-option ${globalPageNumber.position === "center-left" ? "selected" : ""}" data-position="center-left">Center Left</div>
            <div class="position-option ${globalPageNumber.position === "center-center" ? "selected" : ""}" data-position="center-center">Center</div>
            <div class="position-option ${globalPageNumber.position === "center-right" ? "selected" : ""}" data-position="center-right">Center Right</div> -->
            <div class="position-option ${globalPageNumber.position === "bottom-left" ? "selected" : ""}" data-position="bottom-left">Bottom Left</div>
            <div class="position-option ${globalPageNumber.position === "bottom-center" ? "selected" : ""}" data-position="bottom-center">Bottom Center</div>
            <div class="position-option ${globalPageNumber.position === "bottom-right" ? "selected" : ""}" data-position="bottom-right">Bottom Right</div>
          </div>
        </div>
        <div class="size-controls">
          <div>
            <label>Font Size:</label>
            <input type="number" id="pageNumberFontSize" class="page-setup-control" value="${globalPageNumber.fontSize || 8}" min="8" max="20">
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
    <label>Rotation:</label>
    <input type="range" id="pageNumberRotation" class="page-setup-control" value="${globalPageNumber.rotation || 0}" min="-90" max="90">
    <span id="pageNumberRotationValue" style="font-size: 11px; color: #666;">${globalPageNumber.rotation || 0}°</span>
  </div>
          <div>
            <label>
              <input type="checkbox" id="pageNumberShowBorder" ${globalPageNumber.showBorder ? "checked" : ""} style="border: 2px solid #000 !important;"> Show Border
            </label>
          </div>
        </div>
      </div>
<div class="page-setup-section">
  <h3>✂️ Conditional Page Break Settings</h3>
<div class="page-setup-row">
  <label>
    <input type="checkbox" id="conditionalPageBreakEnabled" ${this.pageSettings.conditionalPageBreak?.enabled ? "checked" : ""} style="border: 2px solid #000 !important;"> Enable Conditional Page Break
  </label>
</div>
  <div id="conditionalPageBreakControls" class="page-numbering-controls ${this.pageSettings.conditionalPageBreak?.enabled ? "active" : ""}">
    
    <!-- GLOBAL DEFAULT SETTINGS -->
    <div class="page-setup-row" style="margin-bottom: 15px; padding: 15px; background: #e3f2fd; border-radius: 6px;">
      <div style="margin-bottom: 10px;">
        <strong style="color: #1976d2;">Default Settings (for all unspecified pages)</strong>
        <p style="font-size: 11px; color: #666; margin: 5px 0 10px 0;">
          This will apply to all pages that don't have specific settings, including dynamically created pages.
        </p>
      </div>
      <div style="display: flex; gap: 10px; align-items: center;">
        <label style="min-width: 120px;">Distance from Bottom:</label>
        <input type="number" id="conditionalBreakDefaultDistance" class="page-setup-control" value="${this.pageSettings.conditionalPageBreak?.defaultDistance || 50}" min="1" max="200" step="0.1" style="flex: 1; max-width: 120px;">
        <select id="conditionalBreakDefaultUnit" class="page-setup-control" style="width: 80px;">
          <option value="mm" ${(this.pageSettings.conditionalPageBreak?.defaultUnit || 'mm') === 'mm' ? 'selected' : ''}>mm</option>
          <option value="cm" ${this.pageSettings.conditionalPageBreak?.defaultUnit === 'cm' ? 'selected' : ''}>cm</option>
          <option value="inch" ${this.pageSettings.conditionalPageBreak?.defaultUnit === 'inch' ? 'selected' : ''}>inch</option>
        </select>
      </div>
    </div>

    <!-- SPECIFIC PAGE OVERRIDES -->
    <div style="margin-top: 20px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <strong style="color: #333;">Page-Specific Overrides (Optional)</strong>
        <button type="button" id="addPageBreakOverride" class="page-setup-btn" style="padding: 5px 10px; font-size: 12px; background: #28a745; color: white;">
          <i class="fa fa-plus"></i> Add Override
        </button>
      </div>
      <p style="font-size: 11px; color: #666; margin-bottom: 10px;">
        Set different break distances for specific pages. Leave others to use default settings.
      </p>
      
      <div id="pageBreakOverridesList" style="max-height: 300px; overflow-y: auto; border: 1px solid #e9ecef; border-radius: 6px; padding: 10px; background: #f8f9fa;">
        ${this.generatePageBreakOverrides()}
      </div>
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
      this.attachOverrideItemListeners();

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
        let fontSize = 8; // default
        if (typeof storedSize === 'number') {
          fontSize = storedSize;
        } else if (typeof storedSize === 'string') {
          fontSize = parseInt(storedSize.replace("px", "")) || 8;
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
      // ✅ 8. Rotation slider and display value
      const rotationInput = document.getElementById("pageNumberRotation");
      const rotationValue = document.getElementById("pageNumberRotationValue");
      if (rotationInput && rotationValue) {
        const rotation = pageNumberSettings.rotation || 0;
        rotationInput.value = rotation;
        rotationValue.textContent = `${rotation}°`;
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

  generatePageBreakOverrides() {
    const overrides = this.pageSettings.conditionalPageBreak?.pageOverrides || {};

    let html = `
    <!-- Add Override Form -->
    <div id="addOverrideForm" style="margin-bottom: 15px; padding: 15px; background: #fff3cd; border-radius: 6px; border: 1px solid #ffc107; display: none;">
      <h4 style="margin: 0 0 10px 0; color: #856404; font-size: 14px;">Add New Override</h4>
      <div style="margin-bottom: 10px;">
        <label style="display: block; margin-bottom: 5px; font-size: 12px; font-weight: 500;">Page Number(s):</label>
        <input type="text" id="newOverridePages" class="page-setup-control" placeholder="e.g., 1 or 2,5,8 or 3-7" style="width: 100%; font-size: 12px;">
        <p style="font-size: 10px; color: #666; margin: 3px 0 0 0;">
          Enter single page, multiple pages (comma-separated), or range (e.g., "3-7")
        </p>
      </div>
      <div style="display: flex; gap: 10px; margin-bottom: 10px;">
        <div style="flex: 1;">
          <label style="display: block; margin-bottom: 5px; font-size: 12px; font-weight: 500;">Distance:</label>
          <input type="number" id="newOverrideDistance" class="page-setup-control" value="50" min="1" max="200" step="0.1" style="width: 100%; font-size: 12px;">
        </div>
        <div style="width: 80px;">
          <label style="display: block; margin-bottom: 5px; font-size: 12px; font-weight: 500;">Unit:</label>
          <select id="newOverrideUnit" class="page-setup-control" style="width: 100%; font-size: 12px;">
            <option value="mm">mm</option>
            <option value="cm">cm</option>
            <option value="inch">inch</option>
          </select>
        </div>
      </div>
      <div style="display: flex; gap: 10px;">
        <button type="button" id="confirmAddOverride" class="page-setup-btn page-setup-btn-primary" style="flex: 1; padding: 6px 12px; font-size: 12px;">
          <i class="fa fa-check"></i> Add Override
        </button>
        <button type="button" id="cancelAddOverride" class="page-setup-btn page-setup-btn-secondary" style="flex: 1; padding: 6px 12px; font-size: 12px;">
          <i class="fa fa-times"></i> Cancel
        </button>
      </div>
    </div>
  `;

    // Existing overrides list
    if (Object.keys(overrides).length === 0) {
      html += '<div id="noOverridesMessage" style="text-align: center; color: #999; padding: 15px; font-size: 12px;">No page-specific overrides yet.</div>';
    } else {
      const sortedPages = Object.keys(overrides).sort((a, b) => parseInt(a) - parseInt(b));

      sortedPages.forEach(pageNum => {
        const setting = overrides[pageNum];
        html += `
        <div class="page-break-override-item" data-page-num="${pageNum}" style="margin-bottom: 8px; padding: 10px; background: white; border-radius: 4px; border: 1px solid #dee2e6; display: flex; align-items: center; gap: 8px;">
          <label style="min-width: 55px; font-weight: 500; color: #333; font-size: 12px;">Page ${pageNum}:</label>
          <input type="number" 
                 class="page-setup-control override-distance" 
                 data-page-num="${pageNum}"
                 value="${setting.distance}" 
                 min="1" 
                 max="200" 
                 step="0.1" 
                 style="flex: 1; max-width: 90px; font-size: 12px;">
          <select class="page-setup-control override-unit" 
                  data-page-num="${pageNum}"
                  style="width: 65px; font-size: 12px;">
            <option value="mm" ${setting.unit === 'mm' ? 'selected' : ''}>mm</option>
            <option value="cm" ${setting.unit === 'cm' ? 'selected' : ''}>cm</option>
            <option value="inch" ${setting.unit === 'inch' ? 'selected' : ''}>inch</option>
          </select>
          <button type="button" class="remove-override" data-page-num="${pageNum}" style="padding: 5px 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 11px;">
            <i class="fa fa-trash"></i>
          </button>
        </div>
      `;
      });
    }

    return html;
  }

  confirmPageBreakOverride() {
    const pageNumbersInput = document.getElementById('overridePageNumbers')?.value.trim();
    const distance = parseFloat(document.getElementById('overrideDistance')?.value);
    const unit = document.getElementById('overrideUnit')?.value;

    if (!pageNumbersInput) {
      alert('Please enter page number(s)');
      return;
    }

    if (isNaN(distance) || distance <= 0) {
      alert('Please enter a valid distance');
      return;
    }

    // Parse page numbers
    const pageNumbers = this.parsePageNumbers(pageNumbersInput);

    if (pageNumbers.length === 0) {
      alert('Invalid page number format');
      return;
    }

    // Initialize if needed
    if (!this.pageSettings.conditionalPageBreak) {
      this.pageSettings.conditionalPageBreak = {};
    }
    if (!this.pageSettings.conditionalPageBreak.pageOverrides) {
      this.pageSettings.conditionalPageBreak.pageOverrides = {};
    }

    // Add overrides
    pageNumbers.forEach(pageNum => {
      this.pageSettings.conditionalPageBreak.pageOverrides[pageNum] = {
        distance: distance,
        unit: unit
      };
    });

    this.editor.Modal.close();
    setTimeout(() => this.showPageElementsSettings(), 100);
  }

  parsePageNumbers(input) {
    const pages = [];
    const parts = input.split(',');

    parts.forEach(part => {
      part = part.trim();

      if (part.includes('-')) {
        // Range like "3-7"
        const [start, end] = part.split('-').map(n => parseInt(n.trim()));
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) {
            if (!pages.includes(i)) pages.push(i);
          }
        }
      } else {
        // Single number
        const pageNum = parseInt(part);
        if (!isNaN(pageNum) && !pages.includes(pageNum)) {
          pages.push(pageNum);
        }
      }
    });

    return pages.sort((a, b) => a - b);
  }

  attachOverrideItemListeners() {
    // Override distance inputs
    document.querySelectorAll('.override-distance').forEach(input => {
      input.removeEventListener('input', this._overrideDistanceHandler);
      this._overrideDistanceHandler = (e) => {
        const pageNum = e.target.getAttribute('data-page-num');
        const distance = parseFloat(e.target.value);

        if (!this.pageSettings.conditionalPageBreak) {
          this.pageSettings.conditionalPageBreak = { pageOverrides: {} };
        }
        if (!this.pageSettings.conditionalPageBreak.pageOverrides) {
          this.pageSettings.conditionalPageBreak.pageOverrides = {};
        }

        if (!this.pageSettings.conditionalPageBreak.pageOverrides[pageNum]) {
          this.pageSettings.conditionalPageBreak.pageOverrides[pageNum] = { unit: 'mm' };
        }

        this.pageSettings.conditionalPageBreak.pageOverrides[pageNum].distance = distance;
        console.log(`📝 Updated page ${pageNum} distance: ${distance}`);
      };
      input.addEventListener('input', this._overrideDistanceHandler);
    });

    // Override unit selects
    document.querySelectorAll('.override-unit').forEach(select => {
      select.removeEventListener('change', this._overrideUnitHandler);
      this._overrideUnitHandler = (e) => {
        const pageNum = e.target.getAttribute('data-page-num');
        const unit = e.target.value;

        if (!this.pageSettings.conditionalPageBreak) {
          this.pageSettings.conditionalPageBreak = { pageOverrides: {} };
        }
        if (!this.pageSettings.conditionalPageBreak.pageOverrides) {
          this.pageSettings.conditionalPageBreak.pageOverrides = {};
        }

        if (!this.pageSettings.conditionalPageBreak.pageOverrides[pageNum]) {
          this.pageSettings.conditionalPageBreak.pageOverrides[pageNum] = { distance: 50 };
        }

        this.pageSettings.conditionalPageBreak.pageOverrides[pageNum].unit = unit;
        console.log(`📝 Updated page ${pageNum} unit: ${unit}`);
      };
      select.addEventListener('change', this._overrideUnitHandler);
    });

    // Remove override buttons
    document.querySelectorAll('.remove-override').forEach(btn => {
      btn.removeEventListener('click', this._removeOverrideHandler);
      this._removeOverrideHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const pageNum = e.target.closest('.remove-override').getAttribute('data-page-num');

        if (confirm(`Remove conditional break override for page ${pageNum}?`)) {
          if (this.pageSettings.conditionalPageBreak?.pageOverrides) {
            delete this.pageSettings.conditionalPageBreak.pageOverrides[pageNum];
            console.log(`🗑️ Removed override for page ${pageNum}`);
          }

          // Refresh the list
          const overridesList = document.getElementById('pageBreakOverridesList');
          if (overridesList) {
            overridesList.innerHTML = this.generatePageBreakOverrides();
            setTimeout(() => this.attachOverrideItemListeners(), 100);
          }
        }
      };
      btn.addEventListener('click', this._removeOverrideHandler);
    });
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

    // Position grid listener
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('position-option')) {
        const parent = e.target.parentElement;
        if (parent.classList.contains('position-grid')) {
          // Update position setting
          this.pageSettings.pageNumber = this.pageSettings.pageNumber || {};
          this.pageSettings.pageNumber.position = e.target.getAttribute('data-position');
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
        const value = parseInt(e.target.value, 8);
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
    // Add this after the borderToggle listener
    const rotationInput = document.getElementById("pageNumberRotation");
    const rotationValue = document.getElementById("pageNumberRotationValue");
    if (rotationInput && rotationValue) {
      rotationInput.addEventListener("input", (e) => {
        const value = parseInt(e.target.value, 10);
        rotationValue.textContent = `${value}°`;
        if (!this.pageSettings.pageNumber) {
          this.pageSettings.pageNumber = {};
        }
        this.pageSettings.pageNumber.rotation = value;
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
    // === Conditional Page Break Listeners ===
    // Default distance/unit listeners

    // ===============================
    // CONDITIONAL BREAK — ENABLED TOGGLE  (NEW UPDATED CODE)
    // ===============================
    const conditionalBreakEnabled = document.getElementById("conditionalPageBreakEnabled");
    const conditionalBreakControls = document.getElementById("conditionalPageBreakControls");

    if (conditionalBreakEnabled && conditionalBreakControls) {
      conditionalBreakEnabled.addEventListener("change", (e) => {
        if (!this.pageSettings.conditionalPageBreak) {
          this.pageSettings.conditionalPageBreak = {};
        }
        this.pageSettings.conditionalPageBreak.enabled = e.target.checked;

        // ✅ IMMEDIATE SHOW/HIDE — no modal re-open needed
        if (e.target.checked) {
          conditionalBreakControls.classList.add('active');
          conditionalBreakControls.style.display = 'block';
        } else {
          conditionalBreakControls.classList.remove('active');
          conditionalBreakControls.style.display = 'none';
        }
      });
    }

    // ===============================
    // GLOBAL DEFAULT DISTANCE / UNIT (OLD)
    // ===============================
    const defaultDistance = document.getElementById("conditionalBreakDefaultDistance");
    if (defaultDistance) {
      defaultDistance.addEventListener("input", (e) => {
        if (!this.pageSettings.conditionalPageBreak) {
          this.pageSettings.conditionalPageBreak = {};
        }
        this.pageSettings.conditionalPageBreak.defaultDistance = parseFloat(e.target.value);
      });
    }

    const defaultUnit = document.getElementById("conditionalBreakDefaultUnit");
    if (defaultUnit) {
      defaultUnit.addEventListener("change", (e) => {
        if (!this.pageSettings.conditionalPageBreak) {
          this.pageSettings.conditionalPageBreak = {};
        }
        this.pageSettings.conditionalPageBreak.defaultUnit = e.target.value;
      });
    }

    // ===============================
    // ADD OVERRIDE BUTTON (OLD)
    // ===============================
    // Replace the existing addOverrideBtn listener with:
    const addOverrideBtn = document.getElementById("addPageBreakOverride");
    if (addOverrideBtn) {
      addOverrideBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const addForm = document.getElementById("addOverrideForm");
        if (addForm) {
          // Toggle form visibility
          if (addForm.style.display === 'none' || !addForm.style.display) {
            addForm.style.display = 'block';
            // Clear previous values
            document.getElementById('newOverridePages').value = '';
            document.getElementById('newOverrideDistance').value = '50';
            document.getElementById('newOverrideUnit').value = 'mm';
          } else {
            addForm.style.display = 'none';
          }
        }
      });
    }

    // Confirm add override button
    // Replace the confirmAddOverride event listener in setupPageElementsListeners():

    document.addEventListener('click', (e) => {
      if (e.target.id === 'confirmAddOverride' || e.target.closest('#confirmAddOverride')) {
        e.preventDefault();
        e.stopPropagation();

        const pagesInput = document.getElementById('newOverridePages')?.value.trim();
        const distance = parseFloat(document.getElementById('newOverrideDistance')?.value);
        const unit = document.getElementById('newOverrideUnit')?.value;

        if (!pagesInput) {
          alert('Please enter page number(s)');
          return;
        }

        if (isNaN(distance) || distance <= 0) {
          alert('Please enter a valid distance');
          return;
        }

        // Parse page numbers
        const pageNumbers = this.parsePageNumbers(pagesInput);

        if (pageNumbers.length === 0) {
          alert('Invalid page number format. Use formats like: 5, or 2,5,8, or 3-7');
          return;
        }

        // ✅ Initialize structure properly
        if (!this.pageSettings.conditionalPageBreak) {
          this.pageSettings.conditionalPageBreak = {
            enabled: true,
            defaultDistance: 50,
            defaultUnit: 'mm',
            pageOverrides: {}
          };
        }

        if (!this.pageSettings.conditionalPageBreak.pageOverrides) {
          this.pageSettings.conditionalPageBreak.pageOverrides = {};
        }

        // ✅ Add overrides to the settings object
        pageNumbers.forEach(pageNum => {
          this.pageSettings.conditionalPageBreak.pageOverrides[pageNum] = {
            distance: distance,
            unit: unit
          };
        });

        console.log(`✅ Added overrides for pages: ${pageNumbers.join(', ')}`);
        console.log('Current pageOverrides:', JSON.stringify(this.pageSettings.conditionalPageBreak.pageOverrides, null, 2));

        // ✅ Refresh the overrides list in the DOM
        const overridesList = document.getElementById('pageBreakOverridesList');
        if (overridesList) {
          overridesList.innerHTML = this.generatePageBreakOverrides();

          // ✅ Reattach event listeners for the new elements
          setTimeout(() => {
            this.attachOverrideItemListeners();
          }, 100);
        }

        // Hide the form
        const addForm = document.getElementById('addOverrideForm');
        if (addForm) {
          addForm.style.display = 'none';
        }
      }
    });

    // Cancel add override button
    document.addEventListener('click', (e) => {
      if (e.target.id === 'cancelAddOverride' || e.target.closest('#cancelAddOverride')) {
        e.preventDefault();
        const addForm = document.getElementById('addOverrideForm');
        if (addForm) {
          addForm.style.display = 'none';
        }
      }
    });

    // ===============================
    // APPLY MODE TOGGLE (OLD)
    // ===============================
    const conditionalBreakApplyMode = document.getElementById("conditionalBreakApplyMode");
    if (conditionalBreakApplyMode) {
      conditionalBreakApplyMode.addEventListener("change", (e) => {
        const mode = e.target.value;

        if (!this.pageSettings.conditionalPageBreak) {
          this.pageSettings.conditionalPageBreak = {};
        }
        this.pageSettings.conditionalPageBreak.applyMode = mode;

        // Toggle visibility
        const globalSettings = document.getElementById("globalBreakSettings");
        const perPageSettings = document.getElementById("perPageBreakSettings");

        if (globalSettings) {
          globalSettings.style.display = mode === 'all' ? 'block' : 'none';
        }
        if (perPageSettings) {
          perPageSettings.style.display = mode === 'perPage' ? 'block' : 'none';
        }
      });
    }

    // ===============================
    // PER-PAGE UNIT SELECTS (OLD)
    // ===============================
    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('per-page-break-unit')) {
        const pageId = e.target.getAttribute('data-page-id');
        const unit = e.target.value;

        if (!this.pageSettings.conditionalPageBreak) {
          this.pageSettings.conditionalPageBreak = {};
        }
        if (!this.pageSettings.conditionalPageBreak.perPageSettings) {
          this.pageSettings.conditionalPageBreak.perPageSettings = {};
        }
        if (!this.pageSettings.conditionalPageBreak.perPageSettings[pageId]) {
          this.pageSettings.conditionalPageBreak.perPageSettings[pageId] = {};
        }

        this.pageSettings.conditionalPageBreak.perPageSettings[pageId].unit = unit;
      }
    });

  }


  logConditionalBreakSettings() {
    console.group('🔍 Conditional Break Settings');
    console.log('Enabled:', this.pageSettings.conditionalPageBreak?.enabled);
    console.log('Default Distance:', this.pageSettings.conditionalPageBreak?.defaultDistance);
    console.log('Default Unit:', this.pageSettings.conditionalPageBreak?.defaultUnit);
    console.log('Overrides:', this.pageSettings.conditionalPageBreak?.pageOverrides);
    console.groupEnd();
  }

  preserveHeaderFooterContent() {
    try {
      // Get first page as the source
      const firstPage = this.editor.getWrapper().find('[data-page-index="0"]')[0];
      if (!firstPage) return;

      // Preserve header content
      const headerElement = firstPage.find('.page-header-element')[0];
      if (headerElement && headerElement.components().length > 0) {
        this._originalHeaderComponents = headerElement.components().map(comp => ({
          html: comp.toHTML(),
          styles: comp.getStyle(),
          attributes: comp.getAttributes(),
          type: comp.get('type')
        }));
        console.log('✅ Preserved header content from page 1');
      }

      // Preserve footer content
      const footerElement = firstPage.find('.page-footer-element')[0];
      if (footerElement && footerElement.components().length > 0) {
        this._originalFooterComponents = footerElement.components().map(comp => ({
          html: comp.toHTML(),
          styles: comp.getStyle(),
          attributes: comp.getAttributes(),
          type: comp.get('type')
        }));
        console.log('✅ Preserved footer content from page 1');
      }
    } catch (error) {
      console.error('❌ Error preserving header/footer content:', error);
    }
  }

  applyPageElementsSettings() {
    try {
      this.preserveHeaderFooterContent();


      const conditionalBreakEnabled = document.getElementById("conditionalPageBreakEnabled")?.checked || false;
      const conditionalBreakDefaultDistance = parseFloat(document.getElementById("conditionalBreakDefaultDistance")?.value) || 50;
      const conditionalBreakDefaultUnit = document.getElementById("conditionalBreakDefaultUnit")?.value || "mm";

      // Collect all overrides from the form
      const pageOverrides = {};
      document.querySelectorAll('.page-break-override-item').forEach(item => {
        const pageNum = item.getAttribute('data-page-num');
        const distanceInput = item.querySelector('.override-distance');
        const unitSelect = item.querySelector('.override-unit');

        if (distanceInput && unitSelect) {
          pageOverrides[pageNum] = {
            distance: parseFloat(distanceInput.value),
            unit: unitSelect.value
          };
        }
      });

      // Store settings
      // Store settings
      this.pageSettings.conditionalPageBreak = {
        enabled: conditionalBreakEnabled,
        defaultDistance: conditionalBreakDefaultDistance,
        defaultUnit: conditionalBreakDefaultUnit,
        pageOverrides: pageOverrides
      };
      // 1️⃣ Preserve current page content
      this.preserveAllContent();

      // 2️⃣ Get all form values
      const marginTop = Math.max(0, parseFloat(document.getElementById("settingsMarginTop")?.value) || 0);
      const marginBottom = Math.max(0, parseFloat(document.getElementById("settingsMarginBottom")?.value) || 0);
      const marginLeft = Math.max(0, parseFloat(document.getElementById("settingsMarginLeft")?.value) || 0);
      const marginRight = Math.max(0, parseFloat(document.getElementById("settingsMarginRight")?.value) || 0);
      const newBackgroundColor = document.getElementById("settingsPageBackgroundColor")?.value || "#ffffff";

      // ✅ Clear old background color reference
      delete this._lastAppliedBackgroundColor;

      // Force update background in pageSettings
      this.pageSettings.backgroundColor = newBackgroundColor;
      this.pageSettings.pages.forEach(page => {
        page.backgroundColor = newBackgroundColor;
      });

      console.log(`✅ Background color set to: ${newBackgroundColor}`);

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
      const pageNumberFontSize = storedPageNumber.fontSize || parseInt(document.getElementById("pageNumberFontSize")?.value || "8", 8);
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

      const pageNumberRotation = parseInt(document.getElementById("pageNumberRotation")?.value || "0", 10);

      // Store settings for persistence
      this._lastHeaderApplyMode = headerApplyMode;
      this._lastFooterApplyMode = footerApplyMode;
      this._lastHeaderCustomPageList = headerCustomPageList;
      this._lastFooterCustomPageList = footerCustomPageList;
      this._lastHeaderCustomPages = headerCustomPages;
      this._lastFooterCustomPages = footerCustomPages;

      // ✅ ADD: Also store in pageSettings object for setupEditorPages to access
      this.pageSettings.headerFooter.headerApplyMode = headerApplyMode;
      this.pageSettings.headerFooter.footerApplyMode = footerApplyMode;
      this.pageSettings.headerFooter.headerCustomPages = headerCustomPages;
      this.pageSettings.headerFooter.footerCustomPages = footerCustomPages;

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
      this.updatePageRule();


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
        rotation: pageNumberRotation,
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

      // Apply conditional page breaks to existing pages immediately
      if (conditionalBreakEnabled) {
        console.log('🔄 Applying conditional breaks to existing pages...');

        // ✅ FIX: Use the correct property path
        const settingsToLog = {
          enabled: this.pageSettings.conditionalPageBreak.enabled,
          defaultDistance: this.pageSettings.conditionalPageBreak.defaultDistance,
          defaultUnit: this.pageSettings.conditionalPageBreak.defaultUnit,
          pageOverrides: this.pageSettings.conditionalPageBreak.pageOverrides
        };
        console.log('Settings:', JSON.stringify(settingsToLog, null, 2));

        setTimeout(() => {
          this.removeAllConditionalPageBreaks();

          setTimeout(() => {
            this.insertConditionalPageBreaksToAllPages();

            // Verify application
            setTimeout(() => {
              const allPages = this.editor.getWrapper().find('.page-container');
              allPages.forEach((page, idx) => {
                const indicator = page.find('.conditional-break-indicator[data-conditional="true"]')[0];
                if (indicator) {
                  const pageNum = idx + 1;
                  const override = this.pageSettings.conditionalPageBreak.pageOverrides?.[pageNum];
                  console.log(`✅ Page ${pageNum} has break indicator. Override:`, override || 'using default');
                }
              });
            }, 500);
          }, 200);
        }, 500);
      } else {
        this.removeAllConditionalPageBreaks();
      }

      this.logConditionalBreakSettings();
      // --- Update individual page settings before setup ---
      this.updateIndividualPageSettings();

      // --- Apply background color immediately for live preview ---
      this.applyBackgroundColorToPages(newBackgroundColor);

      // --- Preserve content for mode switch ---
      // âœ… CRITICAL: Preserve ALL content BEFORE any changes
      this.preserveAllContent();
      this.preserveContentForModeSwitch();

      // âœ… Store main content separately to ensure it's not lost
      const mainContentBackup = new Map();
      const allPages = this.editor.getWrapper().find('.page-container');
      allPages.forEach((page, index) => {
        const mainContent = page.find('.main-content-area')[0];
        if (mainContent && mainContent.components().length > 0) {
          mainContentBackup.set(index, {
            components: mainContent.components().map(comp => ({
              html: comp.toHTML(),
              styles: comp.getStyle(),
              attributes: comp.getAttributes(),
              type: comp.get('type')
            }))
          });
        }
      });

      // --- Setup pages ---
      this.setupEditorPages();

      // --- Restore content with extended timeout ---
      setTimeout(() => {
        // âœ… First restore from main backup
        this.restoreAllContent();

        // âœ… Then restore main content specifically
        setTimeout(() => {
          const newPages = this.editor.getWrapper().find('.page-container');
          newPages.forEach((page, index) => {
            const backup = mainContentBackup.get(index);
            if (backup && backup.components) {
              const mainContent = page.find('.main-content-area')[0];
              if (mainContent) {
                // Clear only if we have backup to restore
                mainContent.components().reset();

                backup.components.forEach(compData => {
                  try {
                    const newComp = mainContent.append(compData.html)[0];
                    if (newComp) {
                      newComp.setStyle(compData.styles || {});
                      newComp.addAttributes(compData.attributes || {});
                    }
                  } catch (err) {
                    console.warn('Failed to restore component:', err);
                  }
                });
              }
            }
          });

          // âœ… Restore mode-switch content
          this.restoreContentAfterModeSwitch();

          // âœ… Update visuals
          this.updateAllPageVisuals();

        }, 200);

      }, 300);

      // --- Re-apply background color after all visuals are rendered ---
      setTimeout(() => {
        this.applyBackgroundColorToPages(newBackgroundColor);

        // --- Apply conditional header/footer content ---
        setTimeout(() => {
          this.applyConditionalHeaderFooterContent();
          this.resetTextChangeFlags();
        }, 300);

      }, 250);
      // ✅ ADD: Force update section header/footer visibility after applying settings
      setTimeout(() => {
        this.updateAllSectionHeadersFooters();

        // Force re-render of all sections
        const allPages = this.editor.getWrapper().find('.page-container');
        allPages.forEach((pageComponent, i) => {
          const sectionContainer = pageComponent.find('.sections-container')[0];
          if (!sectionContainer) return;

          // Update both header and footer for this page
          this.updateSectionHeader(pageComponent, i);
          this.updateSectionFooter(pageComponent, i);
        });
      }, 300);
      // --- Close modal ---
      this.editor.Modal.close();

    } catch (err) {
      console.error("❌ Error in applyPageElementsSettings:", err);
      alert("Failed to apply settings.");
    }
  }


  convertToMm(value, unit) {
    switch (unit) {
      case 'cm':
        return value * 10;
      case 'inch':
        return value * 25.4;
      case 'mm':
      default:
        return value;
    }
  }
  insertConditionalPageBreaksToAllPages() {
    if (!this.pageSettings.conditionalPageBreak?.enabled) {
      return;
    }

    const allPages = this.editor.getWrapper().find('.page-container');

    allPages.forEach((pageComponent, index) => {
      this.insertConditionalPageBreakToPage(pageComponent, index);
    });

    console.log('✂️ Conditional page breaks inserted to all pages');
  }
  insertConditionalPageBreakToPage(pageComponent, pageIndex) {
    if (!this.pageSettings.conditionalPageBreak?.enabled) return;

    const mainContentArea = pageComponent.find('.main-content-area')[0];
    if (!mainContentArea) return;

    // Remove existing conditional indicators from DOM
    const mainContentAreaEl = mainContentArea.view.el;
    const existingIndicators = mainContentAreaEl.querySelectorAll('.conditional-break-indicator');
    existingIndicators.forEach(ind => ind.remove());

    const pageNumber = pageIndex + 1; // 1-indexed for user-facing page numbers

    // Check for page-specific override first
    const overrides = this.pageSettings.conditionalPageBreak.pageOverrides || {};
    let distance, unit;

    if (overrides[pageNumber]) {
      // Use page-specific override
      distance = overrides[pageNumber].distance;
      unit = overrides[pageNumber].unit;
      console.log(`🎯 Using override for page ${pageNumber}: ${distance}${unit}`);
    } else {
      // Use default settings
      distance = this.pageSettings.conditionalPageBreak.defaultDistance || 50;
      unit = this.pageSettings.conditionalPageBreak.defaultUnit || 'mm';
      console.log(`📋 Using default for page ${pageNumber}: ${distance}${unit}`);
    }

    const distanceInMm = this.convertToMm(distance, unit);
    const mmToPx = 96 / 25.4;
    const distanceInPx = Math.round(distanceInMm * mmToPx);

    const contentEl = mainContentArea.getEl();
    if (!contentEl) return;

    const contentHeight = contentEl.clientHeight;
    const breakPosition = contentHeight - distanceInPx;

    if (breakPosition <= 0 || breakPosition >= contentHeight) {
      console.warn(`⚠️ Invalid conditional break position for page ${pageNumber}`);
      return;
    }

    // Check for manual page breaks (these are actual components)
    const allBreaks = mainContentArea.find('.page-break:not([data-conditional="true"])');
    if (allBreaks.length > 0) {
      console.log(`⏭️ Skipping conditional break on page ${pageNumber} - manual break exists`);
      return;
    }

    const label = overrides[pageNumber] ? `Override: ${distance}${unit}` : `Default: ${distance}${unit}`;

    const visualIndicatorHTML = `
    <div class="conditional-break-indicator" 
         data-conditional="true"
         data-page-number="${pageNumber}"
         style="
           position: absolute;
           bottom: ${distanceInPx}px;
           left: 0;
           right: 0;
           height: 2px;
           border-top: 2px dashed ${overrides[pageNumber] ? '#4caf50' : '#ff6b6b'};
           z-index: 999;
           pointer-events: none;
           background: rgba(${overrides[pageNumber] ? '76, 175, 80' : '255, 107, 107'}, 0.05);
         ">
      <span style="
        position: absolute;
        right: 0;
        top: -20px;
        background: ${overrides[pageNumber] ? '#4caf50' : '#ff6b6b'};
        color: white;
        padding: 2px 8px;
        border-radius: 3px;
        font-size: 10px;
        font-weight: bold;
        z-index: 100;
        white-space: nowrap;
      ">Conditional Break (P${pageNumber}): ${label}</span>
    </div>
  `;

    const pageContent = pageComponent.find('.page-content')[0];
    if (!pageContent) return;

    const pageContentEl = pageContent.view.el;
    pageContentEl.insertAdjacentHTML('beforeend', visualIndicatorHTML);

    console.log(`📏 Conditional break added to page ${pageNumber} at ${distanceInPx}px from bottom`);
  }
  removeAllConditionalPageBreaks() {
    const allPages = this.editor.getWrapper().find('.page-container');

    allPages.forEach(pageComponent => {
      // Remove from page-content (visual indicators)
      const pageContent = pageComponent.find('.page-content')[0];
      if (pageContent) {
        const conditionalIndicators = pageContent.find('.conditional-break-indicator[data-conditional="true"]');
        conditionalIndicators.forEach(ind => ind.remove());
      }

      // Also check main-content-area (in case any were added there)
      const mainContentArea = pageComponent.find('.main-content-area')[0];
      if (mainContentArea) {
        const conditionalBreaks = mainContentArea.find('[data-conditional="true"]');
        conditionalBreaks.forEach(br => br.remove());
      }
    });

    console.log('🗑️ All conditional break indicators removed');
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
      enabled: false,
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
  // FIXED: Enhanced setupEditorPages method that properly creates headers/footers
  setupEditorPages() {
    try {

      const wrapper = this.editor.getWrapper();

      // Clear ALL components including cached ones
      wrapper.components().reset();

      // Force clear the canvas DOM
      const canvasBody = this.editor.Canvas.getBody();
      if (canvasBody) {
        // Remove all page containers from DOM
        const existingPages = canvasBody.querySelectorAll('.page-container');
        existingPages.forEach(page => page.remove());
      }

      // Clear page contents cache
      this.pageContents.clear();
      this.sharedContent = { header: null, footer: null };

      // Reset background color flags
      delete this._lastAppliedBackgroundColor;

      console.log('✅ Canvas completely cleared');
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
      // âœ… ONLY clear if no content needs preserving
      const hasExistingContent = this.pageContents.size > 0;
      if (!hasExistingContent) {
        this.editor.getWrapper().components().reset();
      } else {
        // Clear only page containers, preserve other content
        const wrapper = this.editor.getWrapper();
        const pageContainers = wrapper.find('.page-container');
        pageContainers.forEach(page => page.remove());
      }

      for (let i = 0; i < this.pageSettings.numberOfPages; i++) {
        const pageData = this.pageSettings.pages[i];
        const pageNumber = i + 1;
        const isEvenPage = pageNumber % 2 === 0;
        const isOddPage = pageNumber % 2 !== 0;
        const isFirstPage = pageNumber === 1;
        const isLastPage = pageNumber === this.pageSettings.numberOfPages;

        // ✅ FIX: Get the ACTUAL apply mode from settings, not local variable
        const headerApplyMode = this.pageSettings.headerFooter?.headerApplyMode ||
          this._lastHeaderApplyMode || "all";
        const footerApplyMode = this.pageSettings.headerFooter?.footerApplyMode ||
          this._lastFooterApplyMode || "all";
        const headerCustomPages = this.pageSettings.headerFooter?.headerCustomPages ||
          this._lastHeaderCustomPages || [];
        const footerCustomPages = this.pageSettings.headerFooter?.footerCustomPages ||
          this._lastFooterCustomPages || [];

        let headerRegionType = "header";
        let footerRegionType = "footer";
        let headerCondition = "all";
        let footerCondition = "all";
        let headerLabel = "";
        let footerLabel = "";

        // ----- HEADER LOGIC -----
        if (headerApplyMode === "all") {
          headerCondition = "all";
          headerLabel = "Header";
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
          const pageIsInCustomList = headerCustomPages.includes(pageNumber);
          headerCondition = pageIsInCustomList ? "custom" : "hidden";
          headerLabel = pageIsInCustomList
            ? `Custom Header (Page ${pageNumber})`
            : "Header (Hidden - Custom Range)";
        }

        // ----- FOOTER LOGIC ----- (same pattern)
        if (footerApplyMode === "all") {
          footerCondition = "all";
          footerLabel = "Footer";
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
          const pageIsInCustomList = footerCustomPages.includes(pageNumber);
          footerCondition = pageIsInCustomList ? "custom" : "hidden";
          footerLabel = pageIsInCustomList
            ? `Custom Footer (Page ${pageNumber})`
            : "Footer (Hidden - Custom Range)";
        }

        // Create page structure - ALWAYS include header and footer wrappers
        // ✅ ADD: Determine if header/footer should be visible
        const headerDisplayStyle = headerCondition === "hidden" ? "display: none;" : "";
        const footerDisplayStyle = footerCondition === "hidden" ? "display: none;" : "";

        let pageHTML = `
  <div class="page-container" data-page-id="${pageData.id}" data-page-index="${i}">
    <div class="page-content" style="
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
        ${headerDisplayStyle}
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
        ${footerDisplayStyle}
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
            "background-color": pageData.backgroundColor || this.pageSettings.backgroundColor,
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
        this.startContentMonitoring();
        this.setupStrictBoundaryEnforcement();


      }, 100);
    } catch (error) {
      console.error("❌ Error setting up Word-style editor pages:", error);
    }
  }


  /////////////////////////////////////// daynamic section added from here //////////////////////////////////////////////////////////////////////
  setupSectionsContainerListener() {
    console.log("🔧 setup section listener started");

    // Clear any existing listeners
    this.editor.off('component:add');
    this.editor.off('block:drag:stop');

    // ✅ Listen to ALL component additions
    this.editor.on('component:add', (component) => {
      // Check if this is a Sections component
      const isSectionsComponent =
        component.get('name') === 'Sections' ||
        component.get('type') === 'Sections' ||
        component.getClasses().includes('sections-container');

      if (isSectionsComponent) {
        console.log("✅ Sections component detected!");

        // ✅ CRITICAL: Check if it already has a count OR if it's undefined/empty
        const currentCount = component.getAttributes()['data-section-count'];
        const needsCount = !currentCount || currentCount === '' || currentCount === 'undefined';

        console.log("Current section count:", currentCount, "Needs count:", needsCount);

        if (needsCount) {
          console.log("⚠️ No valid section count, will assign...");

          setTimeout(() => {
            const wrapper = this.editor.getWrapper();
            const allPages = wrapper.find('.page-container');

            let targetPageIndex = 0;
            let foundPage = false;

            // Find which page this belongs to
            let parent = component.parent();
            while (parent && !foundPage) {
              if (parent.getClasses && parent.getClasses().includes('page-container')) {
                const pageId = parent.getAttributes()['data-page-index'];
                if (pageId !== undefined) {
                  targetPageIndex = parseInt(pageId);
                  foundPage = true;
                  console.log("✅ Found page via parent:", targetPageIndex);
                }
              }
              parent = parent.parent();
            }

            if (!foundPage) {
              allPages.forEach((page, idx) => {
                const sections = page.find('.sections-container');
                sections.forEach(sec => {
                  if (sec === component || sec.getId() === component.getId()) {
                    targetPageIndex = idx;
                    foundPage = true;
                    console.log("✅ Found page via search:", targetPageIndex);
                  }
                });
              });
            }

            console.log(`🎯 Assigning count to section on page ${targetPageIndex}`);
            this.addSectionsContainerToSpecificPage(targetPageIndex, null);

          }, 200);
        } else {
          console.log("ℹ️ Section already has valid count:", currentCount);
        }
      }
    });

    console.log("✅ Section listeners attached");
  }
  checkAndAddSections() {
    const sectionsRequiredBlocks = [
      "column1", "column2", "column3", "column3-7", "text",
      "separator", "Sections", "link", "image",
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
      this.addSectionsContainerToSpecificPage();
    }
  }

  addSectionsContainerToSpecificPage(pageIndex, sourceSectionCount = null) {
    console.log("=".repeat(50));
    console.log("🔧 addSectionsContainerToSpecificPage called");
    console.log("   pageIndex:", pageIndex);
    console.log("   sourceSectionCount:", sourceSectionCount);
    console.log("=".repeat(50));

    try {
      const wrapper = this.editor.getWrapper();
      const allPages = wrapper.find('.page-container');

      if (pageIndex < 0 || pageIndex >= allPages.length) {
        console.warn(`❌ Invalid page index: ${pageIndex}`);
        pageIndex = 0;
      }

      const pageComponent = allPages[pageIndex];
      if (!pageComponent) {
        console.warn(`❌ Page component not found for index ${pageIndex}`);
        return;
      }

      const mainContentArea = pageComponent.find('.main-content-area')[0];
      if (!mainContentArea) {
        console.warn(`❌ Main content area not found on page ${pageIndex}`);
        return;
      }

      const existingSections = mainContentArea.find('.sections-container');
      console.log(`📊 Found ${existingSections.length} existing sections on page ${pageIndex}`);

      // ✅ CRITICAL FIX: For manual drag, check if section already has a valid count
      if (sourceSectionCount === null) {
        // Manual drag scenario
        const unassignedSections = existingSections.filter(sec => {
          const count = sec.getAttributes()['data-section-count'];
          return !count || count === '' || count === 'undefined';
        });

        console.log(`Found ${unassignedSections.length} unassigned sections (manual drag)`);

        // If all sections have valid counts, don't add another
        if (unassignedSections.length === 0 && existingSections.length > 0) {
          console.log(`✅ Section already exists with valid count on page ${pageIndex}`);
          return existingSections[0];
        }

        // Track highest count BEFORE adding
        let highestCount = 0;
        allPages.forEach((page) => {
          const sections = page.find('.sections-container');
          sections.forEach((section) => {
            const count = parseInt(section.getAttributes()['data-section-count'] || '0');
            if (count > highestCount) highestCount = count;
          });
        });

        console.log("Highest section count found:", highestCount);

        // Increment for new section group
        const newSectionCount = String(highestCount + 1);
        console.log(`➕ Manual drag: Assigning NEW count ${newSectionCount}`);

        // If there's an unassigned section, assign it the count
        if (unassignedSections.length > 0) {
          const sectionToUpdate = unassignedSections[0];
          sectionToUpdate.addAttributes({
            'data-section-count': newSectionCount
          });
          console.log(`✅ Assigned count ${newSectionCount} to existing section on page ${pageIndex}`);
          return sectionToUpdate;
        }

        // Otherwise create new section with incremented count
        const newSection = mainContentArea.append({
          type: 'Sections',
          attributes: {
            'data-section-count': newSectionCount
          }
        })[0];

        console.log(`✅ Created NEW section with count ${newSectionCount} on page ${pageIndex}`);
        this.editor.trigger('change:canvasOffset');
        return newSection;

      } else {
        // Autopagination scenario - use provided count
        console.log(`🔄 Autopagination: Using source count ${sourceSectionCount}`);

        // Check if section with this count already exists
        const matchingSections = existingSections.filter(sec =>
          sec.getAttributes()['data-section-count'] === sourceSectionCount
        );

        if (matchingSections.length > 0) {
          console.log(`✅ Section with count ${sourceSectionCount} already exists on page ${pageIndex}`);
          return matchingSections[0];
        }

        // Create new section with autopagination count
        const newSection = mainContentArea.append({
          type: 'Sections',
          attributes: {
            'data-section-count': sourceSectionCount
          }
        })[0];

        console.log(`✅ Created autopaginated section with count ${sourceSectionCount} on page ${pageIndex}`);
        this.editor.trigger('change:canvasOffset');
        return newSection;
      }

    } catch (error) {
      console.error("Error adding section to specific page:", error);
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
    this.addSectionsContainerToSpecificPage();
  }

  shouldHaveSectionsContainer() {
    const sectionsRequiredBlocks = [
      "column1", "column2", "column3", "column3-7", "text",
      "separator", "Sections", "link", "image",
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
  parsePositionStyles(styleString) {
    const styles = {};
    const rules = styleString.split(';').filter(r => r.trim());

    rules.forEach(rule => {
      const [property, value] = rule.split(':').map(s => s.trim());
      if (property && value) {
        styles[property] = value;
      }
    });

    return styles;
  }
  // FIXED: Enhanced updateSinglePageVisuals method that properly creates and displays headers/footers
  updateSinglePageVisuals(pageElement, pageSettings, pageIndex) {
    const allPages = this.editor.getWrapper().find('.page-container');
    const pageComponent = allPages.find(p => p.getAttributes()['data-page-id'] === pageSettings.id);
    if (!pageComponent) return;

    const pageContentComponent = pageComponent.find(".page-content")[0];
    if (!pageContentComponent) return;

    // ===============================
    // ✅ PROTECT SECTIONS FROM PAGE SETTINGS HEIGHT CHANGES - ENHANCED
    // ===============================
    const sectionsContainer = pageComponent.find('.sections-container')[0];

    // We'll capture references here so they can be used both for preserving and restoring.
    const sectionHeader = sectionsContainer ? sectionsContainer.find('.section-header')[0] : null;
    const sectionContent = sectionsContainer ? sectionsContainer.find('.section-content')[0] : null;
    const sectionFooter = sectionsContainer ? sectionsContainer.find('.section-footer')[0] : null;

    let preservedHeaderHeight = null;
    let preservedContentHeight = null;
    let preservedFooterHeight = null;

    if (sectionsContainer) {
      // Get current heights BEFORE any page-settings-driven changes
      if (sectionHeader) {
        const headerEl = sectionHeader.getEl();
        if (headerEl) {
          preservedHeaderHeight = headerEl.style.height || window.getComputedStyle(headerEl).height;
        }
      }

      if (sectionContent) {
        const contentEl = sectionContent.getEl();
        if (contentEl) {
          preservedContentHeight = contentEl.style.height || window.getComputedStyle(contentEl).height;
        }
      }

      if (sectionFooter) {
        const footerEl = sectionFooter.getEl();
        if (footerEl) {
          preservedFooterHeight = footerEl.style.height || window.getComputedStyle(footerEl).height;
        }
      }

      console.log(`🔒 Preserved section heights (page ${pageIndex + 1}):`, {
        header: preservedHeaderHeight,
        content: preservedContentHeight,
        footer: preservedFooterHeight
      });
    }

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
    // Sync logic (REPLACED with new content-only hide/show logic)
    // ======================================================
    setTimeout(() => {
      // ✅ FIX: Read from pageSettings FIRST, then fallback to _last variables
      const headerApplyMode = this.pageSettings.headerFooter?.headerApplyMode ||
        this._lastHeaderApplyMode || "all";
      const footerApplyMode = this.pageSettings.headerFooter?.footerApplyMode ||
        this._lastFooterApplyMode || "all";
      const headerCustomPages = this.pageSettings.headerFooter?.headerCustomPages ||
        this._lastHeaderCustomPages || [];
      const footerCustomPages = this.pageSettings.headerFooter?.footerCustomPages ||
        this._lastFooterCustomPages || [];

      const pageNumber = pageIndex + 1;
      const isFirstPage = pageNumber === 1;
      const isLastPage = pageNumber === this.pageSettings.numberOfPages;

      // ✅ DEBUG: Log what mode we're using
      console.log(`🔍 Page ${pageNumber} - Mode: ${headerApplyMode}, From settings: ${this.pageSettings.headerFooter?.headerApplyMode}, From _last: ${this._lastHeaderApplyMode}`);

      // ✅ FIXED: Determine if header/footer CONTENT should be visible on this page
      let shouldShowHeaderContent = false;
      let shouldShowFooterContent = false;

      // --- HEADER VISIBILITY LOGIC ---
      if (headerApplyMode === "all") {
        shouldShowHeaderContent = true;
      } else if (headerApplyMode === "first") {
        shouldShowHeaderContent = isFirstPage;
      } else if (headerApplyMode === "last") {
        shouldShowHeaderContent = isLastPage;
      } else if (headerApplyMode === "even") {
        shouldShowHeaderContent = (pageNumber % 2 === 0);
      } else if (headerApplyMode === "odd") {
        shouldShowHeaderContent = (pageNumber % 2 !== 0);
      } else if (headerApplyMode === "different") {
        shouldShowHeaderContent = true; // Show on all, but use different content
      } else if (headerApplyMode === "custom") {
        shouldShowHeaderContent = headerCustomPages.includes(pageNumber);
      }

      // --- FOOTER VISIBILITY LOGIC --- (same pattern)
      if (footerApplyMode === "all") {
        shouldShowFooterContent = true;
      } else if (footerApplyMode === "first") {
        shouldShowFooterContent = isFirstPage;
      } else if (footerApplyMode === "last") {
        shouldShowFooterContent = isLastPage;
      } else if (footerApplyMode === "even") {
        shouldShowFooterContent = (pageNumber % 2 === 0);
      } else if (footerApplyMode === "odd") {
        shouldShowFooterContent = (pageNumber % 2 !== 0);
      } else if (footerApplyMode === "different") {
        shouldShowFooterContent = true;
      } else if (footerApplyMode === "custom") {
        shouldShowFooterContent = footerCustomPages.includes(pageNumber);
      }

      console.log(`📄 Page ${pageNumber} - Header: ${shouldShowHeaderContent}, Footer: ${shouldShowFooterContent}`);

      // Rest of the code stays the same...
      // =========================
      // ✅ APPLY HEADER CONTENT VISIBILITY (KEEP WRAPPER VISIBLE)
      // =========================
      // ✅ APPLY HEADER CONTENT VISIBILITY (KEEP WRAPPER VISIBLE)
      const headerWrapper = pageComponent.find(".header-wrapper")[0];
      if (headerWrapper) {
        // Always keep the wrapper visible
        try {
          headerWrapper.addStyle({ display: '' });
        } catch (e) {
          const hwEl = headerWrapper.getEl && headerWrapper.getEl();
          if (hwEl) hwEl.style.display = '';
        }

        const headerElement = headerWrapper.find(".page-header-element")[0];
        if (headerElement) {
          if (shouldShowHeaderContent) {
            // ✅ FIXED: Restore from preserved content instead of cloning from page
            headerElement.components().reset();

            if (this._originalHeaderComponents && this._originalHeaderComponents.length > 0) {
              this._originalHeaderComponents.forEach(compData => {
                try {
                  const newComp = headerElement.append(compData.html)[0];
                  if (newComp) {
                    newComp.setStyle(compData.styles || {});
                    newComp.addAttributes(compData.attributes || {});
                  }
                } catch (err) {
                  console.warn('Failed to restore header component:', err);
                }
              });
              console.log(`✅ Restored header content on page ${pageNumber}`);
            }

            // Make content visible
            headerElement.addStyle({
              opacity: '1',
              visibility: 'visible',
              display: 'flex'
            });
          } else {
            // ✅ HIDE ONLY CONTENT - keep the element wrapper
            headerElement.components().reset();
            headerElement.addStyle({
              opacity: '0',
              visibility: 'hidden'
            });
            console.log(`🔒 Header content hidden on page ${pageNumber} (space preserved)`);
          }
        }
      }

      // =========================
      // ✅ APPLY FOOTER CONTENT VISIBILITY (KEEP WRAPPER VISIBLE)
      // =========================
      // ✅ APPLY FOOTER CONTENT VISIBILITY (KEEP WRAPPER VISIBLE)
      const footerWrapper = pageComponent.find(".footer-wrapper")[0];
      if (footerWrapper) {
        // Always keep the wrapper visible
        try {
          footerWrapper.addStyle({ display: '' });
        } catch (e) {
          const fwEl = footerWrapper.getEl && footerWrapper.getEl();
          if (fwEl) fwEl.style.display = '';
        }

        const footerElement = footerWrapper.find(".page-footer-element")[0];
        if (footerElement) {
          if (shouldShowFooterContent) {
            // ✅ FIXED: Restore from preserved content instead of cloning from page
            footerElement.components().reset();

            if (this._originalFooterComponents && this._originalFooterComponents.length > 0) {
              this._originalFooterComponents.forEach(compData => {
                try {
                  const newComp = footerElement.append(compData.html)[0];
                  if (newComp) {
                    newComp.setStyle(compData.styles || {});
                    newComp.addAttributes(compData.attributes || {});
                  }
                } catch (err) {
                  console.warn('Failed to restore footer component:', err);
                }
              });
              console.log(`✅ Restored footer content on page ${pageNumber}`);
            }

            // Make content visible
            footerElement.addStyle({
              opacity: '1',
              visibility: 'visible',
              display: 'flex'
            });
          } else {
            // ✅ HIDE ONLY CONTENT - keep the element wrapper
            footerElement.components().reset();
            footerElement.addStyle({
              opacity: '0',
              visibility: 'hidden'
            });
            console.log(`🔒 Footer content hidden on page ${pageNumber} (space preserved)`);
          }
        }
      }
      // ✅ PAGE NUMBERS - COMPLETELY SEPARATE LOGIC
      // Remove existing page numbers first
      const existingPageNumbers = pageComponent.find('.page-number-element');
      existingPageNumbers.forEach(pn => pn.remove());

      // Add page numbers if enabled
      if (this.pageSettings.pageNumber?.enabled) {
        const settings = this.pageSettings.pageNumber;
        const format = settings.format || "Page {n}";
        const position = settings.position || "bottom-center";
        const rotation = settings.rotation || 0;
        const startFrom = settings.startFrom || 1;

        // Check if this page should show page number
        const shouldShowNumber = this.shouldShowPageNumberForPage(pageIndex, startFrom);

        if (shouldShowNumber.show) {
          const displayNumber = format
            .replace('{n}', shouldShowNumber.displayNumber)
            .replace('{total}', shouldShowNumber.totalPages.toString());

          const positionStyles = this.getPageNumberPositionStylesWithRotation(position, rotation);

          const pageNumberHTML = `
          <div class="page-number-element" style="
            position: absolute;
            font-family: ${settings.fontFamily || 'Arial'};
            font-size: ${settings.fontSize || 8}px;
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
          if (pageContent) {
            pageContent.append(pageNumberHTML);
            console.log(`✅ Page number added to page ${pageNumber}: "${displayNumber}"`);
          }
        } else {
          console.log(`⏭️ Page number skipped for page ${pageNumber} (before startFrom or excluded)`);
        }
      }
    }, 1000);

    // ===============================
    // ✅ RESTORE SECTION HEIGHTS AFTER PAGE SETTINGS (if we preserved any)
    // ===============================
    if (sectionsContainer) {
      setTimeout(() => {
        if (sectionHeader && preservedHeaderHeight) {
          sectionHeader.addStyle({
            'height': preservedHeaderHeight,
            'min-height': preservedHeaderHeight
          });
        }

        if (sectionContent && preservedContentHeight) {
          sectionContent.addStyle({
            'height': preservedContentHeight,
            'min-height': preservedContentHeight,
            'flex': '1'
          });
        }

        if (sectionFooter && preservedFooterHeight) {
          sectionFooter.addStyle({
            'height': preservedFooterHeight,
            'min-height': preservedFooterHeight
          });
        }

        console.log(`🔒 Restored section heights on page ${pageIndex + 1}`);
      }, 100);
    }

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

  getPageNumberPositionStylesWithRotation(position, rotation) {
    let styles = '';

    // Vertical positioning
    if (position.includes('top')) {
      styles += 'top: 10px; ';
    } else if (position.includes('bottom')) {
      styles += 'bottom: 10px; ';
    } else {
      styles += 'top: 50%; ';
    }

    // Horizontal positioning
    if (position.includes('left')) {
      styles += 'left: 10px; ';
    } else if (position.includes('right')) {
      styles += 'right: 10px; ';
    } else {
      styles += 'left: 50%; ';
    }

    // ✅ Combine transforms for rotation and centering
    let transformValue = '';

    if (position.includes('center')) {
      // Check if both horizontal and vertical centering needed
      const needsHorizontalCenter = !position.includes('left') && !position.includes('right');
      const needsVerticalCenter = !position.includes('top') && !position.includes('bottom');

      if (needsHorizontalCenter && needsVerticalCenter) {
        transformValue = `translate(-50%, -50%) rotate(${rotation}deg)`;
      } else if (needsHorizontalCenter) {
        transformValue = `translateX(-50%) rotate(${rotation}deg)`;
      } else if (needsVerticalCenter) {
        transformValue = `translateY(-50%) rotate(${rotation}deg)`;
      } else {
        transformValue = `rotate(${rotation}deg)`;
      }
    } else {
      transformValue = `rotate(${rotation}deg)`;
    }

    styles += `transform: ${transformValue}; transform-origin: center center;`;

    return styles;
  }

  // In PageSetupManager class, add this new method after getPageNumberPositionStylesWithRotation:

  shouldShowPageNumberForPage(pageIndex, startFrom) {
    const pageSettings = this.pageSettings.pages[pageIndex];

    // Check if this page should be skipped
    if (pageSettings?.skipPageNumber === true) {
      console.log(`⏭️ Skipping page number for page ${pageIndex + 1} (subreport page)`);
      return { show: false, displayNumber: 0, totalPages: 0 };
    }

    // Calculate actual page number by counting only non-skipped pages
    let displayNumber = 0;
    let totalPages = 0;

    // Count pages that should show numbers (from startFrom onwards, excluding skipped)
    for (let i = startFrom - 1; i < this.pageSettings.pages.length; i++) {
      const ps = this.pageSettings.pages[i];
      if (ps?.skipPageNumber !== true) {
        totalPages++;
        if (i < pageIndex) {
          displayNumber++;
        } else if (i === pageIndex) {
          displayNumber++;
        }
      }
    }

    // Check if current page is before startFrom
    if (pageIndex < startFrom - 1) {
      return { show: false, displayNumber: 0, totalPages };
    }

    return {
      show: true,
      displayNumber,
      totalPages
    };
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
        },
        isSubreportPage: false,
        skipPageNumber: false
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
          "custom-name": "Header"
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
          "custom-name": "Footer"
        });
      }

      // ✅✅✅ --- START OF REQUIRED FIX --- ✅✅✅
      try {
        const existingHeader = this.editor
          .getWrapper()
          .find('[data-shared-region="header"] .page-header-element')[0];

        const newHeader = pageComponent.find(".page-header-element")[0];

        if (existingHeader && newHeader) {
          const clonedHeader = existingHeader.clone();
          newHeader.components(clonedHeader.components().map(c => c.clone()));
        }
      } catch (e) {
        console.warn("Header clone failed:", e);
      }

      try {
        const existingFooter = this.editor
          .getWrapper()
          .find('[data-shared-region="footer"] .page-footer-element')[0];

        const newFooter = pageComponent.find(".page-footer-element")[0];

        if (existingFooter && newFooter) {
          const clonedFooter = existingFooter.clone();
          newFooter.components(clonedFooter.components().map(c => c.clone()));
        }
      } catch (e) {
        console.warn("Footer clone failed:", e);
      }
      // ✅✅✅ --- END OF REQUIRED FIX --- ✅✅✅

      // Add watermark
      const pageContentComponent = pageComponent.find(".page-content")[0];
      if (pageContentComponent) {
        this.addWatermarkToPage(pageContentComponent, newPageIndex);
      }
      // Setup observer AFTER page is fully created
      setTimeout(() => {
        this.paginationInProgress = originalPaginationState;
        this.setupPageObserver(newPageIndex);
      }, 500);
      // Apply conditional page break to new page if enabled

      // Apply conditional page breaks to existing pages
      // Apply conditional page breaks
      if (this.pageSettings.conditionalPageBreak?.enabled) {
        setTimeout(() => {
          // New page will automatically use default settings or specific override if defined
          this.insertConditionalPageBreakToPage(pageComponent, newPageIndex);
        }, 500);
      }
      // ✅ RETURN THE COMPONENT, NOT SETTINGS
      return pageComponent;
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
    const rotation = settings.rotation || 0;

    const pageNumber = pageIndex + 1;
    const displayNumber = format
      .replace('{n}', pageNumber)
      .replace('{total}', this.pageSettings.numberOfPages.toString());

    const positionStyles = this.getPageNumberPositionStylesWithRotation(position, rotation);
    const pageNumberHTML = `
        <div class="page-number-element" style="
            position: absolute;
            font-family: ${settings.fontFamily || 'Arial'};
            font-size: ${settings.fontSize || 8}px;
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

    // Page container (Sections block wrapper)
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

    // Find the first Sections page
    const pageBlocks = wrapper.find('[data-gjs-type="Sections"]');
    if (!pageBlocks.length) {
      alert("⚠️ No Sections block found.");
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
          type: "Sections",
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
    this.editor.Components.addType("Sections", {
      model: {
        defaults: {
          tagName: "div",
          name: "Sections",
          attributes: {
            class: "sections-container",
          },
          selectable: true,
          highlightable: true,
          stylable: true,

          traits: [
            // ---------------- HEADER APPLY MODE ----------------
            {
              type: "select",
              label: "Apply To Header",
              name: "headerApplyMode",
              options: [
                { id: "all", label: "All" },
                { id: "even", label: "Even" },
                { id: "odd", label: "Odd" },
                { id: "allhide", label: "Hide" },
                { id: "custom", label: "Custom" },
              ],
              default: "all",
              changeProp: 1,
            },

            // ---------------- HEADER CUSTOM RANGE (HIDDEN INITIALLY) ----------------
            {
              type: "text",
              label: "Header Custom Range",
              name: "headerCustomRange",
              placeholder: "e.g. 2,4-6",
              changeProp: 1,
              visible: false,
            },

            // ---------------- FOOTER APPLY MODE ----------------
            {
              type: "select",
              label: "Apply To Footer",
              name: "footerApplyMode",
              options: [
                { id: "all", label: "All" },
                { id: "even", label: "Even" },
                { id: "odd", label: "Odd" },
                { id: "allhide", label: "Hide" },
                { id: "custom", label: "Custom" },
              ],
              default: "all",
              changeProp: 1,
            },

            // ---------------- FOOTER CUSTOM RANGE (HIDDEN INITIALLY) ----------------
            {
              type: "text",
              label: "Footer Custom Range",
              name: "footerCustomRange",
              placeholder: "e.g. 1,3-5",
              changeProp: 1,
              visible: false,
            },
          ],

          components: [
            {
              tagName: "div",
              name: "Header",
              attributes: {
                class: "section-header gjs-editor-header",
                "data-gjs-name": "Header",
              },
              style: {
                padding: "10px",
                "min-height": "80px",
                position: "relative",
                top: '0px !important',
                left: '0px !important',
              },
            },
            {
              tagName: "div",
              name: "section Content",
              attributes: {
                class: "section-content gjs-editor-content",
                "data-gjs-name": "Content",
              },
              style: {
                flex: "1",
                padding: "10px",
                position: "relative",
                "min-height": "845px",
              },
            },
            {
              tagName: "div",
              name: "Footer",
              attributes: {
                class: "section-footer gjs-editor-footer",
                "data-gjs-name": "Footer",
              },
              style: {
                padding: "10px",
                "min-height": "60px",
                position: "relative",
                top: '0px !important',
                left: '0px !important',
              },
            },
          ],

          style: {
            display: "flex",
            "flex-direction": "column",
            width: "100%",
            margin: "10px 0",
            padding: "5px",
          },
        },
      },
    });

    // ---------------- CONTENT CAPTURE EVENTS ----------------
    this.editor.on("component:update", (component) => {
      const parent = component.parent();
      if (!parent) return;

      const parentName = parent.get("name");

      if (parentName === "Header") {
        const content = component.get("content");
        if (content && content.trim()) {
          this._originalHeaderContent = content;
        }
      }

      if (parentName === "Footer") {
        const content = component.get("content");
        if (content && content.trim()) {
          this._originalFooterContent = content;
        }
      }
    });

    // ---------------- TRAIT UPDATE EVENTS ----------------
    this.editor.on("trait:update", ({ trait, component }) => {
      if (this._silentSync) return;

      const componentName = component.get("name");
      const traitName = trait.get("name");

      // ------------------------------------------------------------------------------------------
      // 🚀 SHOW/HIDE TRAITS LOGIC (MAIN FIX — Custom Range Visible Only on Custom Mode)
      // ------------------------------------------------------------------------------------------
      if (componentName === "Sections") {
        if (traitName === "headerApplyMode") {
          const mode = trait.getValue();
          component.getTrait("headerCustomRange").set("visible", mode === "custom");
        }

        if (traitName === "footerApplyMode") {
          const mode = trait.getValue();
          component.getTrait("footerCustomRange").set("visible", mode === "custom");
        }
      }

      // ------------------------------------------------------------------------------------------
      // 🔽 ORIGINAL SYNC HEADER LOGIC
      // ------------------------------------------------------------------------------------------
      if (
        componentName === "Sections" &&
        (traitName === "headerApplyMode" || traitName === "headerCustomRange")
      ) {
        const rteComp = component.find('[data-gjs-type="formatted-rich-text"]')[0];
        if (rteComp) {
          const content = rteComp.get("content");
          if (content && content.trim()) {
            const sectionContainer = component.closest(".sections-container");
            if (sectionContainer) {
              const sectionCount = sectionContainer.getAttributes()["data-section-count"];
              this[`_originalHeaderContent_${sectionCount}`] = content;
            }
          }
        }

        const mode = component.getTrait("headerApplyMode").getValue();
        const range = component.getTrait("headerCustomRange")?.getValue() || "";

        this._silentSync = true;
        try {
          this.syncHeaderTraitsAcrossPages(component, mode, range);
        } finally {
          this._silentSync = false;
        }

        setTimeout(() => this.updateAllSectionHeadersFooters(), 100);
      }

      // ------------------------------------------------------------------------------------------
      // 🔽 ORIGINAL SYNC FOOTER LOGIC
      // ------------------------------------------------------------------------------------------
      if (
        componentName === "Sections" &&
        (traitName === "footerApplyMode" || traitName === "footerCustomRange")
      ) {
        const rteComp = component.components().at(0);
        if (rteComp) {
          const content = rteComp.get("content");
          if (content && content.trim()) {
            const sectionContainer = component.closest(".sections-container");
            if (sectionContainer) {
              const sectionCount = sectionContainer.getAttributes()["data-section-count"];
              this[`_originalFooterContent_${sectionCount}`] = content;
            }
          }
        }

        const mode = component.getTrait("footerApplyMode").getValue();
        const range = component.getTrait("footerCustomRange")?.getValue() || "";

        this._silentSync = true;
        try {
          this.syncFooterTraitsAcrossPages(component, mode, range);
        } finally {
          this._silentSync = false;
        }

        setTimeout(() => this.updateAllSectionHeadersFooters(), 100);
      }
    });
  }

  // 🔹 Sync header traits across all pages
  // 🔹 Sync header traits across all pages WITH SAME SECTION COUNT
  syncHeaderTraitsAcrossPages(sourceComponent, newMode, newRange) {
    // Get the source section's count
    const sourceSection = sourceComponent.closest('.sections-container');
    if (!sourceSection) return;

    const sourceSectionCount = sourceSection.getAttributes()['data-section-count'];
    if (!sourceSectionCount) return;

    console.log(`🔄 Syncing header traits for sections with count: ${sourceSectionCount}`);

    const allPages = this.editor.getWrapper().find('.page-container');

    allPages.forEach((pageComponent, i) => {
      const sectionContainer = pageComponent.find('.sections-container')[0];
      if (!sectionContainer) return;

      // ✅ ONLY sync if section count matches
      const targetSectionCount = sectionContainer.getAttributes()['data-section-count'];
      if (targetSectionCount !== sourceSectionCount) {
        console.log(`⏭️ Skipping page ${i + 1} - different section count (${targetSectionCount} vs ${sourceSectionCount})`);
        return;
      }

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

      console.log(`✅ Synced header traits for page ${i + 1} (count: ${targetSectionCount})`);
    });
  }

  // 🔹 Sync footer traits across all pages
  // 🔹 Sync footer traits across all pages WITH SAME SECTION COUNT
  syncFooterTraitsAcrossPages(sourceComponent, newMode, newRange) {
    // Get the source section's count
    const sourceSection = sourceComponent.closest('.sections-container');
    if (!sourceSection) return;

    const sourceSectionCount = sourceSection.getAttributes()['data-section-count'];
    if (!sourceSectionCount) return;

    console.log(`🔄 Syncing footer traits for sections with count: ${sourceSectionCount}`);

    const allPages = this.editor.getWrapper().find('.page-container');

    allPages.forEach((pageComponent, i) => {
      const sectionContainer = pageComponent.find('.sections-container')[0];
      if (!sectionContainer) return;

      // ✅ ONLY sync if section count matches
      const targetSectionCount = sectionContainer.getAttributes()['data-section-count'];
      if (targetSectionCount !== sourceSectionCount) {
        console.log(`⏭️ Skipping page ${i + 1} - different section count (${targetSectionCount} vs ${sourceSectionCount})`);
        return;
      }

      const footerComp = sectionContainer.components().find(c => c.get('name') === 'Footer');
      if (!footerComp) return;

      footerComp.set('footerApplyMode', newMode);
      footerComp.set('footerCustomRange', newRange);

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

      console.log(`✅ Synced footer traits for page ${i + 1} (count: ${targetSectionCount})`);
    });
  }

  // 🔹 Check if a page should show a section - UPDATED FOR SECTION GROUPS
  /**
* Checks if the header/footer should be applied (shown) on the current page number 
* based on the apply mode (all, even, odd, custom, allhide).
* @param {number} pageNumber - The 1-based index of the page (e.g., 1, 2, 3...).
* @param {string} mode - The trait value ('all', 'even', 'odd', 'custom', 'allhide').
* @param {string} customRange - The custom range string (e.g., '2,4-6').
* @returns {boolean} - True if the element should be SHOWN, False if it should be HIDDEN.
*/

  checkSectionApplyMode(pageNumber, mode, customRange) {
    if (mode === 'all') {
      return true; // Show on all pages
    }
    if (mode === 'allhide') {
      return false; // Hide on all pages
    }

    // 1. Even/Odd Logic
    if (mode === 'even') {
      // Even numbers: 2, 4, 6...
      return pageNumber % 2 === 0;
    }
    if (mode === 'odd') {
      // Odd numbers: 1, 3, 5...
      return pageNumber % 2 !== 0;
    }

    // 2. Custom Range Logic
    if (mode === 'custom' && customRange) {
      // Custom range parsing logic
      const ranges = customRange.split(',').map(s => s.trim()).filter(s => s.length > 0);

      for (const range of ranges) {
        if (range.includes('-')) {
          // Handle range like '4-6'
          const [startStr, endStr] = range.split('-');
          const start = parseInt(startStr, 10);
          const end = parseInt(endStr, 10);

          if (!isNaN(start) && !isNaN(end) && pageNumber >= start && pageNumber <= end) {
            return true;
          }
        } else {
          // Handle single number like '2'
          const singlePage = parseInt(range, 10);
          if (!isNaN(singlePage) && pageNumber === singlePage) {
            return true;
          }
        }
      }
      // If the page number is not found in any custom range, hide it
      return false;
    }

    // Default to show if mode is not recognized or customRange is empty for custom mode
    return true;
  }

  // checkSectionApplyMode(mode, range, pageIndex) {
  //   const allPages = this.editor.getWrapper().find('.page-container');
  //   const currentPage = allPages[pageIndex];
  //   if (!currentPage) return true;

  //   const sectionContainer = currentPage.find('.sections-container')[0];
  //   if (!sectionContainer) return true;

  //   const sectionCount = sectionContainer.getAttributes()['data-section-count'];

  //   // ✅ Calculate relative page number within this section group
  //   let relativePageNum = 1;
  //   for (let i = 0; i <= pageIndex; i++) {
  //     const page = allPages[i];
  //     const section = page.find('.sections-container')[0];
  //     if (section) {
  //       const count = section.getAttributes()['data-section-count'];
  //       if (count === sectionCount) {
  //         if (i === pageIndex) break;
  //         relativePageNum++;
  //       }
  //     }
  //   }

  //   console.log(`📍 Page ${pageIndex + 1} (absolute) = Page ${relativePageNum} (relative in group ${sectionCount})`);

  //   if (mode === "all") return true;
  //   if (mode === "even") return relativePageNum % 2 === 0;
  //   if (mode === "odd") return relativePageNum % 2 !== 0;
  //   if (mode === "custom") {
  //     if (!range || range.trim() === '') {
  //       return false;
  //     }

  //     const shouldShow = range.split(',').some(part => {
  //       const trimmedPart = part.trim();
  //       if (trimmedPart.includes('-')) {
  //         const [start, end] = trimmedPart.split('-').map(n => parseInt(n.trim(), 10));
  //         return relativePageNum >= start && relativePageNum <= end;
  //       } else {
  //         const targetPage = parseInt(trimmedPart, 10);
  //         return targetPage === relativePageNum;
  //       }
  //     });

  //     return shouldShow;
  //   }
  //   return true;
  // }


  // 🔹 Update header per page
  updateSectionHeader(pageComponent, pageIndex) {
    const sectionContainer = pageComponent.find('.sections-container')[0];
    if (!sectionContainer) return;

    const sectionCount = sectionContainer.getAttributes()['data-section-count'];
    const headerComp = sectionContainer.components().find(c => c.get('name') === 'Header');
    if (!headerComp) return;

    const mode = headerComp.get('headerApplyMode') || headerComp.getTrait('headerApplyMode')?.getValue() || 'all';
    const range = headerComp.get('headerCustomRange') || headerComp.getTrait('headerCustomRange')?.getValue() || '';
    const show = this.checkSectionApplyMode(mode, range, pageIndex);

    let rteComp = headerComp.find('[data-gjs-type="formatted-rich-text"]')[0];

    if (!rteComp) {
      rteComp = headerComp.append({
        tagName: 'div',
        attributes: { 'data-gjs-type': 'formatted-rich-text' },
        content: ''
      })[0];
    }

    if (rteComp) {
      const headerContentKey = `_originalHeaderContent_${sectionCount}`;
      const storedContent = this[headerContentKey];

      if (show && storedContent) {
        rteComp.set('content', storedContent);
      } else if (show) {
        // Keep existing content if no stored content
        const existingContent = rteComp.get('content');
        if (!existingContent || existingContent.trim() === '') {
          rteComp.set('content', `Header for page ${pageIndex + 1}`);
        }
      } else {
        rteComp.set('content', '');
      }

      if (rteComp.view) rteComp.view.render();
    }

    // Update visibility
    headerComp.getEl().style.display = show ? 'block' : 'none';
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

  getPxValue(style, key, defaultVal) {
    const val = style[key];
    if (val && typeof val === 'string' && val.endsWith('px')) {
      return parseFloat(val);
    }
    return defaultVal;
  }

  updateAllSectionHeadersFooters() {
    // Default/base heights used when components do not have explicit min-height values
    const HEADER_DEFAULT_MIN_HEIGHT = 80;
    const FOOTER_DEFAULT_MIN_HEIGHT = 60;
    const CONTENT_DEFAULT_MIN_HEIGHT = 845;

    const wrapper = this.editor.getWrapper();

    // 1. Identify the currently selected "Sections" component 
    const selectedComponent = this.editor.getSelected();
    if (!selectedComponent || selectedComponent.get('name') !== 'Sections') {
      return;
    }

    // Retrieve trait values from the selected Sections component
    const sectionCountToTarget = selectedComponent.getAttributes()['data-section-count'];
    const headerMode = selectedComponent.getTrait('headerApplyMode').getValue();
    const headerRange = selectedComponent.getTrait('headerCustomRange')?.getValue() || '';
    const footerMode = selectedComponent.getTrait('footerApplyMode').getValue();
    const footerRange = selectedComponent.getTrait('footerCustomRange')?.getValue() || '';

    // 2. Find all Sections components that have the same data-section-count
    const allMatchingSections = wrapper.find(`.sections-container[data-section-count="${sectionCountToTarget}"]`);

    allMatchingSections.forEach((sectionComponent, index) => {
      const pageNumber = index + 1;
      const headerComponent = sectionComponent.find('.section-header')[0];
      const footerComponent = sectionComponent.find('.section-footer')[0];

      // The content area of the section (where compensation will be applied)
      const contentComponent = sectionComponent.find('.section-content')[0];
      if (!contentComponent) return;

      // This variable tracks how much height should be added to the content
      let contentCompensationHeight = 0;

      // ---------------- HEADER LOGIC ----------------
      if (headerComponent) {
        const isHeaderVisible = this.checkSectionApplyMode(pageNumber, headerMode, headerRange);

        // Read the header’s min-height (or use default if missing)
        const headerHeightPx = this.getPxValue(
          headerComponent.getStyle(),
          'min-height',
          HEADER_DEFAULT_MIN_HEIGHT
        );

        if (isHeaderVisible) {
          // Header should be shown → remove any forced hidden display settings
          headerComponent.set({
            'style': {
              ...headerComponent.getStyle(),
              'display': ''
            }
          });
        } else {
          // Header should be hidden → record the header height for compensation
          contentCompensationHeight += headerHeightPx;

          // Hide header
          headerComponent.set({
            'style': { 'display': 'none' }
          });
        }
      }

      // ---------------- FOOTER LOGIC ----------------
      if (footerComponent) {
        const isFooterVisible = this.checkSectionApplyMode(pageNumber, footerMode, footerRange);

        // Read the footer’s min-height (or use default if missing)
        const footerHeightPx = this.getPxValue(
          footerComponent.getStyle(),
          'min-height',
          FOOTER_DEFAULT_MIN_HEIGHT
        );

        if (isFooterVisible) {
          // Footer should be shown → remove any forced hidden display settings
          footerComponent.set({
            'style': {
              ...footerComponent.getStyle(),
              'display': ''
            }
          });
        } else {
          // Footer should be hidden → add its height to compensation
          contentCompensationHeight += footerHeightPx;

          // Hide footer
          footerComponent.set({
            'style': { 'display': 'none' }
          });
        }
      }

      // ---------------- CONTENT HEIGHT COMPENSATION ----------------
      // Calculate the new content min-height after adding compensations
      const newMinHeight = CONTENT_DEFAULT_MIN_HEIGHT + contentCompensationHeight;

      // Apply the final compensated height to the content section
      const currentContentStyles = contentComponent.getStyle();
      contentComponent.set('style', {
        ...currentContentStyles,
        'min-height': `${newMinHeight}px`
      });
    });
  }

  // 🔹 Update all pages
  // 🔹 Update all pages - RESPECTING SECTION COUNT GROUPS
  // updateAllSectionHeadersFooters() {
  //   const allPages = this.editor.getWrapper().find('.page-container');

  //   allPages.forEach((pageComponent, i) => {
  //     const sectionContainer = pageComponent.find('.sections-container')[0];
  //     if (!sectionContainer) return;

  //     const sectionCount = sectionContainer.getAttributes()['data-section-count'];
  //     console.log(`🔍 Processing page ${i + 1} with section count: ${sectionCount}`);

  //     const headerComp = sectionContainer.components().find(c => c.get('name') === 'Header');

  //     if (headerComp) {
  //       const mode = headerComp.get('headerApplyMode') || 'all';
  //       const range = headerComp.get('headerCustomRange') || '';
  //       const show = this.checkSectionApplyMode(mode, range, i);

  //       // Find or create rich text component
  //       let rteComp = headerComp.find('[data-gjs-type="formatted-rich-text"]')[0];

  //       if (!rteComp) {
  //         rteComp = headerComp.append({
  //           tagName: 'div',
  //           attributes: { 'data-gjs-type': 'formatted-rich-text' },
  //           content: ''
  //         })[0];
  //       }

  //       if (rteComp) {
  //         // ✅ Use section-count-specific stored content
  //         const headerContentKey = `_originalHeaderContent_${sectionCount}`;
  //         const storedContent = this[headerContentKey];

  //         if (show && storedContent) {
  //           rteComp.set('content', storedContent);
  //           console.log(`✅ Applied header content for page ${i + 1} (count: ${sectionCount})`);
  //         } else {
  //           rteComp.set('content', '');
  //           console.log(`🚫 Cleared header content for page ${i + 1} (show: ${show})`);
  //         }

  //         if (rteComp.view) rteComp.view.render();
  //       }
  //     }

  //     // Same for footer
  //     const footerComp = sectionContainer.components().find(c => c.get('name') === 'Footer');
  //     if (footerComp) {
  //       const mode = footerComp.get('footerApplyMode') || 'all';
  //       const range = footerComp.get('footerCustomRange') || '';
  //       const show = this.checkSectionApplyMode(mode, range, i);

  //       let rteComp = footerComp.components().at(0);

  //       if (!rteComp) {
  //         rteComp = footerComp.append({
  //           tagName: 'div',
  //           attributes: { 'data-gjs-type': 'formatted-rich-text' },
  //           content: ''
  //         })[0];
  //       }

  //       if (rteComp) {
  //         // ✅ Use section-count-specific stored content
  //         const footerContentKey = `_originalFooterContent_${sectionCount}`;
  //         const storedContent = this[footerContentKey];

  //         if (show && storedContent) {
  //           rteComp.set('content', storedContent);
  //           console.log(`✅ Applied footer content for page ${i + 1} (count: ${sectionCount})`);
  //         } else {
  //           rteComp.set('content', '');
  //           console.log(`🚫 Cleared footer content for page ${i + 1} (show: ${show})`);
  //         }

  //         if (rteComp.view) rteComp.view.render();
  //       }
  //     }
  //   });
  // }

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