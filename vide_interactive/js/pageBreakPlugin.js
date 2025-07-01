/**
 * GrapesJS Page Break Plugin
 * Adds MS Word-like page break functionality to GrapesJS
 */

function pageBreakPlugin(editor, options = {}) {
  const opts = {
    // Plugin options
    id: "page-break",
    label: "Page Break",
    category: "Extra",
    icon: `<svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 3H5c-1.1 0-2 .9-2 2v4h2V5h14v4h2V5c0-1.1-.9-2-2-2z"/>
      <path d="M19 15v4H5v-4H3v4c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-4h-2z"/>
      <path d="M3 12h18v-2H3v2z"/>
      <path d="M7 10l4-4 4 4H7z"/>
      <path d="M7 14l4 4 4-4H7z"/>
    </svg>`,
    attributes: { class: "fa fa-scissors" },
    activate: true,
    ...options,
  }

  // Add the page break component
  editor.DomComponents.addType("page-break", {
    model: {
      defaults: {
        tagName: "div",
        draggable: true,
        droppable: false,
        editable: false,
        selectable: true,
        copyable: true,
        removable: true,
        resizable: false,
        attributes: {
          "data-page-break": "true",
          "data-gjs-type": "page-break",
        },
        classes: ["page-break-element"],
        traits: [
          {
            type: "select",
            label: "Break Type",
            name: "break-type",
            options: [
              { value: "page", name: "Page Break" },
              { value: "column", name: "Column Break" },
              { value: "section", name: "Section Break" },
            ],
            changeProp: 1,
          },
          {
            type: "checkbox",
            label: "Force New Page",
            name: "force-new-page",
            changeProp: 1,
          },
          {
            type: "text",
            label: "Break Label",
            name: "break-label",
            placeholder: "Optional label for this break",
            changeProp: 1,
          },
        ],
        style: {
          width: "100%",
          height: "20px",
          background: "linear-gradient(90deg, #ff6b6b 0%, #ff8e8e 50%, #ff6b6b 100%)",
          border: "2px dashed #ff4757",
          "border-radius": "4px",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          color: "white",
          "font-size": "12px",
          "font-weight": "bold",
          margin: "10px 0",
          position: "relative",
          cursor: "pointer",
          transition: "all 0.2s ease",
          "user-select": "none",
        },
        content: "",
      },

      init() {
        this.on("change:break-type", this.updateBreakDisplay)
        this.on("change:break-label", this.updateBreakDisplay)
        this.on("change:force-new-page", this.updateBreakDisplay)
        this.updateBreakDisplay()
      },

      updateBreakDisplay() {
        const breakType = this.get("break-type") || "page"
        const breakLabel = this.get("break-label") || ""
        const forceNewPage = this.get("force-new-page")

        let displayText = ""
        let bgColor = ""
        let borderColor = ""

        switch (breakType) {
          case "page":
            displayText = "📄 PAGE BREAK"
            bgColor = "linear-gradient(90deg, #ff6b6b 0%, #ff8e8e 50%, #ff6b6b 100%)"
            borderColor = "#ff4757"
            break
          case "column":
            displayText = "📰 COLUMN BREAK"
            bgColor = "linear-gradient(90deg, #4834d4 0%, #686de0 50%, #4834d4 100%)"
            borderColor = "#3742fa"
            break
          case "section":
            displayText = "📑 SECTION BREAK"
            bgColor = "linear-gradient(90deg, #00d2d3 0%, #54a0ff 50%, #00d2d3 100%)"
            borderColor = "#0abde3"
            break
        }

        if (breakLabel) {
          displayText += ` - ${breakLabel}`
        }

        if (forceNewPage) {
          displayText += " (FORCED)"
        }

        // Update the component's content and style
        this.set("content", `<span style="font-size: 10px; letter-spacing: 1px;">${displayText}</span>`)

        const currentStyle = this.getStyle()
        this.setStyle({
          ...currentStyle,
          background: bgColor,
          "border-color": borderColor,
        })

        // Add data attributes for print processing
        this.addAttributes({
          "data-break-type": breakType,
          "data-break-label": breakLabel || "",
          "data-force-new-page": forceNewPage ? "true" : "false",
        })
      },

      // Custom method to get break information for print processing
      getBreakInfo() {
        return {
          type: this.get("break-type") || "page",
          label: this.get("break-label") || "",
          forceNewPage: this.get("force-new-page") || false,
          position: this.getEl()?.getBoundingClientRect() || null,
        }
      },
    },

    view: {
      events: {
        mouseenter: "onMouseEnter",
        mouseleave: "onMouseLeave",
        click: "onClick",
      },

      onMouseEnter() {
        const el = this.el
        if (el) {
          el.style.transform = "scale(1.02)"
          el.style.boxShadow = "0 4px 12px rgba(255, 71, 87, 0.3)"
        }
      },

      onMouseLeave() {
        const el = this.el
        if (el) {
          el.style.transform = "scale(1)"
          el.style.boxShadow = "none"
        }
      },

      onClick(e) {
        e.stopPropagation()
        // Select the component when clicked
        editor.select(this.model)
      },

      onRender() {
        const el = this.el
        if (el) {
          // Add hover effects and ensure proper styling
          el.style.transition = "all 0.2s ease"
          el.style.cursor = "pointer"

          // Add pseudo-element for the line effect
          const style = document.createElement("style")
          style.textContent = `
            .page-break-element::after {
              content: '';
              position: absolute;
              top: 50%;
              left: 0;
              right: 0;
              height: 1px;
              background: rgba(255, 255, 255, 0.5);
              z-index: 1;
              pointer-events: none;
            }
          `
          if (!document.getElementById("page-break-styles")) {
            style.id = "page-break-styles"
            document.head.appendChild(style)
          }
        }
      },
    },
  })

  // Add the component to the blocks manager
  editor.BlockManager.add(opts.id, {
    label: opts.label,
    category: opts.category,
    content: {
      type: "page-break",
    },
    media: opts.icon,
    attributes: opts.attributes,
  })

  // Add custom commands for page break functionality
  editor.Commands.add("insert-page-break", {
    run(editor, sender, options = {}) {
      const selected = editor.getSelected()
      const wrapper = editor.getWrapper()

      // Find the main content area to insert the page break
      let targetContainer = null

      if (selected) {
        // Try to find the closest main content area
        const selectedEl = selected.getEl()
        const mainContentArea = selectedEl?.closest(".main-content-area")
        if (mainContentArea) {
          const component = editor.getWrapper().find((comp) => comp.getEl() === mainContentArea)[0]
          if (component) {
            targetContainer = component
          }
        }
      }

      // If no suitable container found, try to find any main content area
      if (!targetContainer) {
        const mainContentAreas = wrapper.find(".main-content-area")
        if (mainContentAreas.length > 0) {
          targetContainer = mainContentAreas[0]
        }
      }

      // If still no container, use the wrapper
      if (!targetContainer) {
        targetContainer = wrapper
      }

      // Create and add the page break component
      const pageBreak = targetContainer.append({
        type: "page-break",
        ...options,
      })[0]

      // Select the newly created page break
      editor.select(pageBreak)

      return pageBreak
    },
  })

  // Add command to remove all page breaks
  editor.Commands.add("remove-all-page-breaks", {
    run(editor) {
      const wrapper = editor.getWrapper()
      const pageBreaks = wrapper.find('[data-page-break="true"]')

      pageBreaks.forEach((pageBreak) => {
        pageBreak.remove()
      })

      console.log(`Removed ${pageBreaks.length} page breaks`)
    },
  })

  // Add command to get all page breaks for print processing
  editor.Commands.add("get-page-breaks", {
    run(editor) {
      const wrapper = editor.getWrapper()
      const pageBreaks = wrapper.find('[data-page-break="true"]')

      return pageBreaks.map((pageBreak) => {
        if (typeof pageBreak.getBreakInfo === "function") {
          return pageBreak.getBreakInfo()
        }

        // Fallback for getting break info
        const el = pageBreak.getEl()
        return {
          type: el?.getAttribute("data-break-type") || "page",
          label: el?.getAttribute("data-break-label") || "",
          forceNewPage: el?.getAttribute("data-force-new-page") === "true",
          position: el?.getBoundingClientRect() || null,
          component: pageBreak,
        }
      })
    },
  })

  // Add keyboard shortcut for inserting page breaks
  editor.Keymaps.add("insert-page-break", "ctrl+enter", "insert-page-break")

  // Add CSS for print media to hide page breaks
  const printStyles = `
  <style id="page-break-print-styles">
    @media print {
      .page-break-element {
        display: none !important;
        page-break-before: always !important;
        height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      [data-break-type="page"] {
        page-break-before: always !important;
      }
      
      [data-break-type="column"] {
        break-before: column !important;
      }
      
      [data-break-type="section"] {
        break-before: page !important;
      }
      
      [data-force-new-page="true"] {
        page-break-before: always !important;
      }

      /* Ensure content after page breaks respects header/footer space */
      .page-break-element + * {
        margin-top: 0 !important;
        padding-top: 0 !important;
      }

      /* Maintain header/footer positioning in print */
      .header-wrapper {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        z-index: 1000 !important;
      }

      .footer-wrapper {
        position: fixed !important;
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
        z-index: 1000 !important;
      }

      .main-content-area {
        margin-top: var(--header-height, 0) !important;
        margin-bottom: var(--footer-height, 0) !important;
      }
    }
  </style>
`

  if (!document.getElementById("page-break-print-styles")) {
    document.head.insertAdjacentHTML("beforeend", printStyles)
  }

  // Extend the PageSetupManager to work with page breaks
  if (window.PageSetupManager) {
    const originalPreparePrintLayout = window.PageSetupManager.prototype.preparePrintLayout

    window.PageSetupManager.prototype.preparePrintLayout = function () {
      // Get all page breaks first
      const pageBreaks = editor.runCommand("get-page-breaks")

      // Store page breaks for processing
      this.pageBreaks = pageBreaks

      // Call the original method
      const printElements = originalPreparePrintLayout.call(this)

      // Process page breaks with header/footer awareness
      return this.processPageBreaksInPrint(printElements)
    }

    // Enhanced method to process page breaks in print layout with header/footer support
    window.PageSetupManager.prototype.processPageBreaksInPrint = function (printElements) {
      if (!this.pageBreaks || this.pageBreaks.length === 0) {
        return printElements
      }

      const processedPages = []
      const mmToPx = 96 / 25.4

      // Calculate available content area considering headers and footers
      const headerHeightMm = this.pageSettings.headerFooter.headerEnabled
        ? this.pageSettings.headerFooter.headerHeight
        : 0
      const footerHeightMm = this.pageSettings.headerFooter.footerEnabled
        ? this.pageSettings.headerFooter.footerHeight
        : 0

      const totalPageHeight = this.pageSettings.height
      const marginTop = this.pageSettings.margins.top
      const marginBottom = this.pageSettings.margins.bottom

      const availableContentHeight = totalPageHeight - marginTop - marginBottom - headerHeightMm - footerHeightMm

      printElements.forEach((page) => {
        const pageBreaksInPage = this.pageBreaks.filter((pb) => {
          const pageEl = document.querySelector(`[data-page-index="${page.pageIndex}"]`)
          if (!pageEl || !pb.position) return false

          const pageRect = pageEl.getBoundingClientRect()
          const contentArea = pageEl.querySelector(".main-content-area")
          const contentRect = contentArea ? contentArea.getBoundingClientRect() : pageRect

          return pb.position.top >= contentRect.top && pb.position.bottom <= contentRect.bottom
        })

        if (pageBreaksInPage.length === 0) {
          // No page breaks, but still need to account for header/footer in positioning
          const adjustedPage = {
            ...page,
            elements: page.elements.map((element) => ({
              ...element,
              position: {
                ...element.position,
                // Adjust Y position to account for header
                y: element.position.y + (headerHeightMm > 0 ? headerHeightMm : 0),
              },
            })),
            headerHeight: headerHeightMm,
            footerHeight: footerHeightMm,
            availableContentHeight,
          }
          processedPages.push(adjustedPage)
          return
        }

        // Sort page breaks by Y position within content area
        pageBreaksInPage.sort((a, b) => a.position.top - b.position.top)

        let currentPageElements = []
        let currentContentY = 0

        page.elements.forEach((element) => {
          // Skip page break elements in final output
          if (element.isPageBreak) return

          // Find if this element comes after a page break
          const breakBefore = pageBreaksInPage.find((pb) => {
            const elementRect = element.element?.getBoundingClientRect()
            if (!elementRect) return false

            return pb.position.top <= elementRect.top && elementRect.top < pb.position.top + 20 // 20px is page break height
          })

          if (breakBefore && currentPageElements.length > 0) {
            // Create new page with current elements
            processedPages.push({
              ...page,
              elements: currentPageElements.map((el) => ({
                ...el,
                position: {
                  ...el.position,
                  // Ensure content starts after header
                  y: el.position.y + headerHeightMm,
                },
              })),
              isGeneratedFromBreak: true,
              breakInfo: breakBefore,
              headerHeight: headerHeightMm,
              footerHeight: footerHeightMm,
              availableContentHeight,
            })

            // Reset for new page
            currentPageElements = []
            currentContentY = 0
          }

          // Add element to current page with proper positioning
          const adjustedElement = {
            ...element,
            position: {
              ...element.position,
              // Position relative to content area start, accounting for header
              y: currentContentY + headerHeightMm,
            },
          }

          currentPageElements.push(adjustedElement)

          // Update current Y position for next element
          currentContentY += element.position.height + 5 // 5mm spacing
        })

        // Add remaining elements as final page
        if (currentPageElements.length > 0) {
          processedPages.push({
            ...page,
            elements: currentPageElements.map((el) => ({
              ...el,
              position: {
                ...el.position,
                y: el.position.y + headerHeightMm,
              },
            })),
            isGeneratedFromBreak: pageBreaksInPage.length > 0,
            headerHeight: headerHeightMm,
            footerHeight: footerHeightMm,
            availableContentHeight,
          })
        }
      })

      return processedPages
    }

    // Add method to calculate proper content positioning with headers/footers
    window.PageSetupManager.prototype.calculateContentPosition = function (element, pageIndex, afterPageBreak = false) {
      const mmToPx = 96 / 25.4
      const headerHeightMm = this.pageSettings.headerFooter.headerEnabled
        ? this.pageSettings.headerFooter.headerHeight
        : 0

      const marginTopMm = this.pageSettings.margins.top

      // Base Y position accounts for page margins and header
      let baseY = marginTopMm + headerHeightMm

      if (afterPageBreak) {
        // Content after page break starts fresh from top of content area
        baseY = marginTopMm + headerHeightMm
      }

      return {
        x: element.position.x,
        y: baseY + element.position.y,
        width: element.position.width,
        height: element.position.height,
      }
    }
  }

  // Add panel button for page break tools (optional)
  // if (opts.activate && editor.Panels) {
  //   editor.Panels.addButton("options", {
  //     id: "page-break-tools",
  //     className: "fa fa-scissors",
  //     command: "insert-page-break",
  //     attributes: { title: "Insert Page Break (Ctrl+Enter)" },
  //   })
  //}

  console.log("Page Break Plugin loaded successfully")
}

// Export the plugin
if (typeof module !== "undefined" && module.exports) {
  module.exports = pageBreakPlugin
} else {
  window.pageBreakPlugin = pageBreakPlugin
}
