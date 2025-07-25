class PageSetupManager {
  constructor(editor) {
    this.editor = editor
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

  }

  // Add page break component to GrapesJS
  addPageBreakComponent() {
    // Add the block to the Extra category
    this.editor.BlockManager.add("page-break", {
      category: "Extra",
      label: `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px;">
          <div style="font-size: 20px; color: #ff6b6b;">✂️</div>
          <span style="font-size: 10px; font-weight: bold; color: #333;">Page Break</span>
        </div>
      `,
      content: {
        type: "page-break",
      },
    })

    // Define the page break component
    this.editor.DomComponents.addType("page-break", {
      model: {
        defaults: {
          tagName: "div",
          classes: ["page-break-element"],
          droppable: false,
          editable: false,
          selectable: true,
          removable: true,
          copyable: true,
          attributes: {
            "data-page-break": "true",
            contenteditable: "false",
          },
          traits: [
            {
              type: "checkbox",
              name: "force-new-page",
              label: "Force New Page",
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
          content: '<span style="font-size: 10px; letter-spacing: 1px;">✂️ PAGE BREAK</span>',
        },

        init() {
          this.on("change:attributes", this.handlePageBreak.bind(this))
          this.on("add", this.handlePageBreak.bind(this))
        },

        handlePageBreak() {
          // Delay execution to ensure DOM is ready
          setTimeout(() => {
            this.processPageBreak()
          }, 100)
        },

        processPageBreak() {
          const pageSetupManager = this.em.get("PageSetupManager")
          if (pageSetupManager && pageSetupManager.isInitialized) {
            pageSetupManager.handlePageBreakInsertion(this)
          }
        },
      },

      view: {
        onRender() {
          const el = this.el
          el.innerHTML = '<span style="font-size: 10px; letter-spacing: 1px;">✂️ PAGE BREAK</span>'

          // Add hover effect
          el.addEventListener("mouseenter", () => {
            el.style.background = "linear-gradient(90deg, #ff5252 0%, #ff7979 50%, #ff5252 100%)"
            el.style.transform = "scale(1.02)"
          })

          el.addEventListener("mouseleave", () => {
            el.style.background = "linear-gradient(90deg, #ff6b6b 0%, #ff8e8e 50%, #ff6b6b 100%)"
            el.style.transform = "scale(1)"
          })
        },
      },
    })

  }

  // Handle page break insertion and content movement
  handlePageBreakInsertion(pageBreakComponent) {
    if (!this.isInitialized) return

    try {
      // Find which page contains this page break
      const pageContainer = pageBreakComponent.closest(".page-container")
      if (!pageContainer) return

      const pageIndex = Number.parseInt(pageContainer.getAttributes()["data-page-index"])
      if (isNaN(pageIndex)) return

      // Get all content after the page break in the same content area
      const contentArea = pageBreakComponent.closest(".main-content-area")
      if (!contentArea) return

      const allComponents = contentArea.components()
      const pageBreakIndex = allComponents.indexOf(pageBreakComponent)

      if (pageBreakIndex === -1) return

      // Get components after the page break
      const componentsToMove = []
      for (let i = pageBreakIndex + 1; i < allComponents.length; i++) {
        componentsToMove.push(allComponents.at(i))
      }

      if (componentsToMove.length === 0) return

      // Ensure we have a next page or create one
      const targetPageIndex = pageIndex + 1
      if (targetPageIndex >= this.pageSettings.numberOfPages) {
        this.addNewPage()
      }

      // Move components to the next page
      this.moveComponentsToPage(componentsToMove, targetPageIndex)

      console.log(
        `Page break processed: moved ${componentsToMove.length} components from page ${pageIndex + 1} to page ${targetPageIndex + 1}`,
      )
    } catch (error) {
      console.error("Error handling page break:", error)
    }
  }

  // Move components from one page to another
  moveComponentsToPage(components, targetPageIndex) {
    try {
      // Get target page's content area
      const targetPageComponent = this.editor.getWrapper().find(`[data-page-index="${targetPageIndex}"]`)[0]
      if (!targetPageComponent) return

      const targetContentArea = targetPageComponent.find(".main-content-area")[0]
      if (!targetContentArea) return

      // Move each component
      components.forEach((component) => {
        // Clone the component to preserve all properties
        const clonedComponent = component.clone()

        // Remove from current location
        component.remove()

        // Add to target page
        targetContentArea.append(clonedComponent)
      })

      // Check if target page is now full and needs overflow handling
      this.checkPageOverflow(targetPageIndex)
    } catch (error) {
      console.error("Error moving components to page:", error)
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
          pageNumbers: null,
        };

        const headerRegion = pageComponent.find('.page-header-element')[0];
        if (headerRegion) {
          const headerComponents = headerRegion.components();
          if (headerComponents.length > 0) {
            pageContent.header = {
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

        const footerRegion = pageComponent.find('.page-footer-element')[0];
        if (footerRegion) {
          const footerComponents = footerRegion.components();
          if (footerComponents.length > 0) {
            pageContent.footer = {
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

        const mainContentArea = pageComponent.find(".main-content-area")[0];
        if (mainContentArea) {
          const mainComponents = mainContentArea.components();
          if (mainComponents.length > 0) {
            pageContent.mainContent = mainComponents.map((comp) => ({
              html: comp.toHTML(),
              styles: comp.getStyle(),
              attributes: comp.getAttributes(),
              type: comp.get("type"),
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


  // FIXED: Restore all preserved content
  restoreAllContent() {
    if (!this.isInitialized || this.pageContents.size === 0) return;

    try {
      const allPages = this.editor.getWrapper().find(".page-container");

      console.log("Restoring content for", allPages.length, "pages");

      allPages.forEach((pageComponent, index) => {
        const preserved = this.pageContents.get(index);
        if (!preserved) return;

        // ✅ Restore Main Content
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

        // ✅ Restore Header (Per Page)
        const headerRegion = pageComponent.find(".page-header-element")[0];
        if (headerRegion && preserved.header?.components?.length > 0) {
          console.log(`Restoring ${preserved.header.components.length} components to header of page ${index}`);
          headerRegion.components().reset();
          headerRegion.addStyle(preserved.header.styles || {});
          headerRegion.addAttributes(preserved.header.attributes || {});

          preserved.header.components.forEach((compData) => {
            const newComp = headerRegion.append(compData.html)[0];
            if (newComp) {
              newComp.setStyle(compData.styles || {});
              newComp.addAttributes(compData.attributes || {});
            }
          });
        }

        // ✅ Restore Footer (Per Page)
        const footerRegion = pageComponent.find(".page-footer-element")[0];
        if (footerRegion && preserved.footer?.components?.length > 0) {
          console.log(`Restoring ${preserved.footer.components.length} components to footer of page ${index}`);
          footerRegion.components().reset();
          footerRegion.addStyle(preserved.footer.styles || {});
          footerRegion.addAttributes(preserved.footer.attributes || {});

          preserved.footer.components.forEach((compData) => {
            const newComp = footerRegion.append(compData.html)[0];
            if (newComp) {
              newComp.setStyle(compData.styles || {});
              newComp.addAttributes(compData.attributes || {});
            }
          });
        }
      });

      console.log("✅ Finished restoring content");
    } catch (error) {
      console.error("❌ Error restoring all content:", error);
    }
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
    editor.on("component:add", (model) => {
      if (this._syncInProgress) return

      const sharedRegion = model.closest("[data-shared-region]")
      if (sharedRegion) {
        const regionType = sharedRegion.getAttributes()["data-shared-region"]
        setTimeout(() => {
          this.syncSharedRegion(regionType, sharedRegion)
        }, 50)
      }
    })

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
    editor.on("component:remove", (model) => {
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
    if (this._syncInProgress) return

    this._syncInProgress = true

    try {
      // Get all regions of the same type across all pages
      const allRegions = this.editor.getWrapper().find(`[data-shared-region="${regionType}"]`)

      if (allRegions.length <= 1) {
        this._syncInProgress = false
        return
      }

      // Get the complete structure from source region
      const sourceComponents = sourceRegion.components()
      const sourceStyles = sourceRegion.getStyle()
      const sourceAttributes = sourceRegion.getAttributes()

      // Sync to all other regions
      allRegions.forEach((targetRegion) => {
        if (targetRegion === sourceRegion) return

        // Clear existing content
        targetRegion.components().reset()

        // Copy components
        if (sourceComponents.length > 0) {
          sourceComponents.forEach((comp) => {
            const clonedComp = comp.clone()
            targetRegion.append(clonedComp)
          })
        }

        // Copy styles
        targetRegion.setStyle(sourceStyles)

        // Copy relevant attributes (excluding data-shared-region)
        const filteredAttributes = { ...sourceAttributes }
        delete filteredAttributes["data-shared-region"]
        Object.keys(filteredAttributes).forEach((key) => {
          if (key !== "data-shared-region") {
            targetRegion.addAttributes({ [key]: filteredAttributes[key] })
          }
        })
      })

      console.log(`Synced ${regionType} across ${allRegions.length} pages`)
    } catch (error) {
      console.error(`Error syncing shared region ${regionType}:`, error)
    } finally {
      this._syncInProgress = false
    }
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
          display: grid;
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
  const format = document.getElementById("pageFormat").value;
  const orientation = document.getElementById("pageOrientation").value;
  const numberOfPages = Number.parseInt(document.getElementById("numberOfPages").value) || 1;
  const backgroundColor = document.getElementById("pageBackgroundColor")?.value || "#ffffff";

  // Header/Footer values
  const headerEnabled = document.getElementById("settingsHeaderEnabled")?.checked !== false;
  const footerEnabled = document.getElementById("settingsFooterEnabled")?.checked !== false;
  const headerHeight = Number.parseFloat(document.getElementById("settingsHeaderHeight")?.value) || 12.7;
  const footerHeight = Number.parseFloat(document.getElementById("settingsFooterHeight")?.value) || 12.7;

  // 👇 NEW: Apply scope (all, even, odd)
  const applyScope = document.getElementById("headerFooterApplyScope")?.value || "all";

  const margins = {
    top: Number.parseFloat(document.getElementById("marginTop").value) || 0,
    bottom: Number.parseFloat(document.getElementById("marginBottom").value) || 0,
    left: Number.parseFloat(document.getElementById("marginLeft").value) || 0,
    right: Number.parseFloat(document.getElementById("marginRight").value) || 0,
  };

  const pageNumberingEnabled = document.getElementById("enablePageNumbering")?.checked || false;
  const startFromPage = Number.parseInt(document.getElementById("startFromPage")?.value) || 1;

  const watermarkEnabled = document.getElementById("enableWatermark")?.checked || false;
  const watermarkType = document.querySelector(".watermark-type-btn.active")?.dataset.type || "text";
  const watermarkPosition = document.querySelector(".watermark-controls .position-option.selected")?.dataset.position || "center";

  let width, height;
  if (format === "custom") {
    width = Number.parseFloat(document.getElementById("customWidth").value) || 210;
    height = Number.parseFloat(document.getElementById("customHeight").value) || 297;
  } else {
    const dimensions = this.pageFormats[format] || this.pageFormats.a4;
    width = orientation === "landscape" ? dimensions.height : dimensions.width;
    height = orientation === "landscape" ? dimensions.width : dimensions.height;
  }

  // ✅ Build pageSettings
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
    },
  };

  // ✅ Per page header/footer logic
  for (let i = 0; i < numberOfPages; i++) {
    const isEven = (i + 1) % 2 === 0;
    const isOdd = !isEven;

    let applyHeader = true;
    let applyFooter = true;

    if (applyScope === "even") {
      applyHeader = isEven;
      applyFooter = isEven;
    } else if (applyScope === "odd") {
      applyHeader = isOdd;
      applyFooter = isOdd;
    }

    this.pageSettings.pages.push({
      id: `page-${i + 1}`,
      name: `Page ${i + 1}`,
      pageNumber: i + 1,
      backgroundColor,
      header: {
        enabled: applyHeader,
        content: "",
        height: applyHeader ? headerHeight : 0,
        padding: 10,
        fontSize: 12,
        color: "#333333",
        backgroundColor: backgroundColor,
        position: "center",
      },
      footer: {
        enabled: applyFooter,
        content: "",
        height: applyFooter ? footerHeight : 0,
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
    });
  }

  this.setupEditorPages();
  this.setupCanvasScrolling();

  const modal = document.getElementById("pageSetupModal");
  if (modal) modal.style.display = "none";

  this.isInitialized = true;
  this.updateNavbarButton();
  this.updateAddPageButton();

  console.log("Enhanced page setup applied:", this.pageSettings);
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

    let pageOptions = ""
    for (let i = 1; i <= this.pageSettings.numberOfPages; i++) {
      const selected = this.pageSettings.pageNumbering.startFromPage === i ? "selected" : ""
      pageOptions += `<option value="${i}" ${selected}>Page ${i}</option>`
    }

    this.editor.Modal.setTitle("Enhanced Page Elements Settings")
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
                <input type="url" id="settingsWatermarkImageUrl" class="page-setup-control" value="${this.pageSettings.watermark.image.url}" placeholder="Enter image URL">
              </div>
              <div class="size-controls">
                <div>
                  <label>Width (px):</label>
                  <input type="number" id="settingsWatermarkImageWidth" class="page-setup-control" value="${this.pageSettings.watermark.image.width}" min="50" max="500">
                </div>
                <div>
                  <label>Height (px):</label>
                  <input type="number" id="settingsWatermarkImageHeight" class="page-setup-control" value="${this.pageSettings.watermark.image.height}" min="50" max="500">
                </div>
              </div>
            </div>

            <div class="page-setup-row">
              <label class="page-setup-label">Position:</label>
              <div class="position-grid">
                <div class="position-option ${this.pageSettings.watermark.position === "top-left" ? "selected" : ""}" data-position="top-left">Top Left</div>
                <div class="position-option ${this.pageSettings.watermark.position === "top-center" ? "selected" : ""}" data-position="top-center">Top Center</div>
                <div class="position-option ${this.pageSettings.watermark.position === "top-right" ? "selected" : ""}" data-position="top-right">Top Right</div>
                <div class="position-option ${this.pageSettings.watermark.position === "center-left" ? "selected" : ""}" data-position="center-left">Center Left</div>
                <div class="position-option ${this.pageSettings.watermark.position === "center" ? "selected" : ""}" data-position="center">Center</div>
                <div class="position-option ${this.pageSettings.watermark.position === "center-right" ? "selected" : ""}" data-position="center-right">Center Right</div>
                <div class="position-option ${this.pageSettings.watermark.position === "bottom-left" ? "selected" : ""}" data-position="bottom-left">Bottom Left</div>
                <div class="position-option ${this.pageSettings.watermark.position === "bottom-center" ? "selected" : ""}" data-position="bottom-center">Bottom Center</div>
                <div class="position-option ${this.pageSettings.watermark.position === "bottom-right" ? "selected" : ""}" data-position="bottom-right">Bottom Right</div>
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
          <h3>📄 Header & Footer Settings</h3>
          <p style="font-size: 12px; color: #666; margin-bottom: 15px;">Enable/disable headers and footers. Content will be preserved when toggling.</p>
          <div class="header-footer-controls">
            <div class="header-footer-section">
              <h4>📋 Header</h4>
              <div class="page-setup-row">
                <label>
                  <input type="checkbox" id="settingsHeaderEnabled" ${this.pageSettings.headerFooter.headerEnabled ? "checked" : ""} style="border: 2px solid #000 !important;"> Enable Header
                </label>
              </div>
              <div class="size-input-group">
                <label>Height:</label>
                <input type="number" id="settingsHeaderHeight" value="${this.pageSettings.headerFooter.headerHeight}" min="5" max="50" step="0.1">
                <span style="font-size: 12px; color: #666;">mm</span>
              </div>
            </div>
            <div class="header-footer-section">
              <h4>📋 Footer</h4>
              <div class="page-setup-row">
                <label>
                  <input type="checkbox" id="settingsFooterEnabled" ${this.pageSettings.headerFooter.footerEnabled ? "checked" : ""} style="border: 2px solid #000 !important;"> Enable Footer
                </label>
              </div>
              <div class="size-input-group">
                <label>Height:</label>
                <input type="number" id="settingsFooterHeight" value="${this.pageSettings.headerFooter.footerHeight}" min="5" max="50" step="0.1">
                <span style="font-size: 12px; color: #666;">mm</span>
              </div>
            </div>

             <div class="page-setup-row" style="margin-top: 15px;">
    <label style="font-weight: 500;">Apply changes to:</label>
    <select id="headerFooterApplyScope" style="margin-left: 10px;">
      <option value="all">All Pages</option>
      <option value="even">Even Pages Only</option>
      <option value="odd">Odd Pages Only</option>
    </select>
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
          <button id="applyPageElementsSettings" class="page-setup-btn page-setup-btn-primary">Apply Settings</button>
          <button id="resetPageElementsSettings" class="page-setup-btn page-setup-btn-secondary">Reset</button>
        </div>
      </div>
    `)

    this.editor.Modal.open()

    setTimeout(() => {
      this.setupPageElementsListeners()
      this.updateFormatPreview()
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
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("position-option")) {
        const parent = e.target.parentElement;
        parent.querySelectorAll(".position-option").forEach((opt) => opt.classList.remove("selected"));
        e.target.classList.add("selected");
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
      // Preserve all content before applying changes
      this.preserveAllContent()

      const newMargins = {
        top: Math.max(0, Number.parseFloat(document.getElementById("settingsMarginTop")?.value) || 0),
        bottom: Math.max(0, Number.parseFloat(document.getElementById("settingsMarginBottom")?.value) || 0),
        left: Math.max(0, Number.parseFloat(document.getElementById("settingsMarginLeft")?.value) || 0),
        right: Math.max(0, Number.parseFloat(document.getElementById("settingsMarginRight")?.value) || 0),
      }

      const newBackgroundColor = document.getElementById("settingsPageBackgroundColor")?.value || "#ffffff"

      // Get header/footer settings with validation
      const headerEnabled = document.getElementById("settingsHeaderEnabled")?.checked !== false
      const footerEnabled = document.getElementById("settingsFooterEnabled")?.checked !== false
      const headerHeight = Math.max(
        5,
        Math.min(50, Number.parseFloat(document.getElementById("settingsHeaderHeight")?.value) || 12.7),
      )
      const footerHeight = Math.max(
        5,
        Math.min(50, Number.parseFloat(document.getElementById("settingsFooterHeight")?.value) || 12.7),
      )

      // Update global settings
      this.pageSettings.margins = newMargins
      this.pageSettings.backgroundColor = newBackgroundColor
      this.pageSettings.headerFooter = {
        headerEnabled,
        footerEnabled,
        headerHeight,
        footerHeight,
      }

      const headerSettings = {
        enabled: headerEnabled,
        content: "",
        height: headerHeight,
        padding: 10,
        fontSize: 12,
        color: "#333333",
        backgroundColor: newBackgroundColor,
        position: "center",
      }

      const footerSettings = {
        enabled: footerEnabled,
        content: "",
        height: footerHeight,
        padding: 10,
        fontSize: 12,
        color: "#333333",
        backgroundColor: newBackgroundColor,
        position: "center",
      }

      const pageNumberSettings = {
        enabled: document.getElementById("pageNumberEnabled")?.checked || false,
        format: document.getElementById("pageNumberFormat")?.value || "Page {n}",
        position:
          document.querySelector(".position-grid .position-option.selected")?.dataset.position || "bottom-right",
        fontSize: Math.max(
          8,
          Math.min(20, Number.parseInt(document.getElementById("pageNumberFontSize")?.value) || 11),
        ),
        color: document.getElementById("pageNumberColor")?.value || "#333333",
        backgroundColor: document.getElementById("pageNumberBackgroundColor")?.value || "#ffffff",
        showBorder: document.getElementById("pageNumberShowBorder")?.checked || true,
      }

      const startFromPage = Math.max(
        1,
        Math.min(
          this.pageSettings.numberOfPages,
          Number.parseInt(document.getElementById("pageNumberStartFrom")?.value) || 1,
        ),
      )
      this.pageSettings.pageNumbering.startFromPage = startFromPage
      this.pageSettings.pageNumbering.excludedPages = Array.from({ length: startFromPage - 1 }, (_, i) => i + 1)
      this.pageSettings.pageNumbering.enabled = pageNumberSettings.enabled

      // 🌊 Watermark Settings
      const watermarkEnabled = document.getElementById("settingsWatermarkEnabled")?.checked || false
      const watermarkType = document.querySelector(".watermark-type-btn.active")?.dataset.type || "text"
      const watermarkPosition = document.querySelector("#settingsWatermarkControls .position-option.selected")?.dataset.position || "center"

      const watermarkTextSettings = {
        content: document.getElementById("settingsWatermarkText")?.value || "",
        fontSize: Math.max(12, Math.min(100, Number.parseInt(document.getElementById("settingsWatermarkFontSize")?.value) || 36)),
        color: document.getElementById("settingsWatermarkColor")?.value || "#000000",
        opacity: (Number.parseInt(document.getElementById("settingsWatermarkOpacity")?.value) || 40) / 100,
        rotation: Number.parseInt(document.getElementById("settingsWatermarkRotation")?.value) || 0,
      }

      const watermarkImageSettings = {
        url: document.getElementById("settingsWatermarkImageUrl")?.value || "",
        width: Math.max(50, Math.min(500, Number.parseInt(document.getElementById("settingsWatermarkImageWidth")?.value) || 100)),
        height: Math.max(50, Math.min(500, Number.parseInt(document.getElementById("settingsWatermarkImageHeight")?.value) || 100)),
      }

      this.pageSettings.watermark = {
        enabled: watermarkEnabled,
        type: watermarkType,
        position: watermarkPosition,
        text: watermarkTextSettings,
        image: watermarkImageSettings,
      }

      // Apply to ALL pages
      this.pageSettings.pages.forEach((page) => {
        page.backgroundColor = newBackgroundColor
        page.header = { ...headerSettings }
        page.footer = { ...footerSettings }
        page.pageNumber = { ...pageNumberSettings }
        page.watermark = { ...this.pageSettings.watermark }
      })

      // Apply background color to existing page components without removing content
      this.applyBackgroundColorToPages(newBackgroundColor)

      // Recalculate page dimensions and update visuals
      this.setupEditorPages()

      // Wait for pages to be set up, then restore content and update visuals
      setTimeout(() => {
        this.restoreAllContent()
        this.updateAllPageVisuals()
      }, 300)

      this.editor.Modal.close()

      console.log("✅ Enhanced page elements settings applied to all pages including watermark")
    } catch (error) {
      console.error("❌ Error applying page elements settings:", error)
      alert("Error applying settings. Please check your input values.")
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
      const mmToPx = 96 / 25.4
      const totalPageWidth = Math.round(this.pageSettings.width * mmToPx)
      const totalPageHeight = Math.round(this.pageSettings.height * mmToPx)

      const marginTopPx = Math.round(this.pageSettings.margins.top * mmToPx)
      const marginBottomPx = Math.round(this.pageSettings.margins.bottom * mmToPx)
      const marginLeftPx = Math.round(this.pageSettings.margins.left * mmToPx)
      const marginRightPx = Math.round(this.pageSettings.margins.right * mmToPx)

      const contentWidth = totalPageWidth - marginLeftPx - marginRightPx
      const contentHeight = totalPageHeight - marginTopPx - marginBottomPx

      // Clear existing pages
      this.editor.getWrapper().components().reset()

      for (let i = 0; i < this.pageSettings.numberOfPages; i++) {
        const pageData = this.pageSettings.pages[i]

        const pageComponent = this.editor.getWrapper().append(`
        <div class="page-container" data-page-id="${pageData.id}" data-page-index="${i}">
          <div class="page-content" style="
            width: ${contentWidth}px; 
            height: ${contentHeight}px; 
            margin: ${marginTopPx}px ${marginRightPx}px ${marginBottomPx}px ${marginLeftPx}px;
            position: relative;
            overflow: hidden;
            background-color: ${pageData.backgroundColor || this.pageSettings.backgroundColor};
          ">
            <!-- Content will be added here -->
          </div>
        </div>
      `)[0]

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
            border:
              this.pageSettings.margins.top > 0 ||
                this.pageSettings.margins.bottom > 0 ||
                this.pageSettings.margins.left > 0 ||
                this.pageSettings.margins.right > 0
                ? "1px dashed #dee2e6"
                : "none",
            "-webkit-print-color-adjust": "exact",
            "color-adjust": "exact",
            "print-color-adjust": "exact",
          })
        }
      }

      this.setupCanvasScrolling()

      // ✅ STEP 1: Wait for visuals to be applied
      setTimeout(() => {
        this.updateAllPageVisuals()

        // ✅ STEP 2: Wait for visuals to finish rendering
        setTimeout(() => {
          console.log("🔍 Checking structure before restoring content...")

          const pages = this.editor.getWrapper().find(".page-container")
          pages.forEach((page, index) => {
            const header = page.find(".page-header-element")[0]
            const footer = page.find(".page-footer-element")[0]
            const content = page.find(".main-content-area")[0]
            console.log(`Page ${index} has:`, {
              headerExists: !!header,
              footerExists: !!footer,
              contentExists: !!content,
            })
          })

          // ✅ Now safe to restore
          this.restoreAllContent()
        }, 200)
      }, 100)
    } catch (error) {
      console.error("❌ Error setting up editor pages:", error)
    }
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
      }
    })
  }

  // FIXED: Enhanced updateSinglePageVisuals method that properly creates and displays headers/footers
  updateSinglePageVisuals(pageElement, pageSettings, pageIndex) {
    const allPages = this.editor.getWrapper().find(".page-container")
    const pageComponent = allPages.find(p => p.getAttributes()["data-page-id"] === pageSettings.id)
    if (!pageComponent) return

    const currentIndex = allPages.indexOf(pageComponent)
    const pageContentComponent = pageComponent.find(".page-content")[0]
    if (!pageContentComponent) return

    // 🔁 Preserve header/footer components
    const existingHeader = pageContentComponent.find(".page-header-element")[0]
    const existingFooter = pageContentComponent.find(".page-footer-element")[0]
    const headerContent = existingHeader ? existingHeader.components().map(c => c.clone()) : []
    const footerContent = existingFooter ? existingFooter.components().map(c => c.clone()) : []
    const headerTraits = existingHeader ? existingHeader.getAllTraits() : []
    const footerTraits = existingFooter ? existingFooter.getAllTraits() : []
    const headerStyle = existingHeader ? existingHeader.getStyle() : {}
    const footerStyle = existingFooter ? existingFooter.getStyle() : {}

    // 🔁 Remove previously added elements
    const selectors = [
      ".header-wrapper", ".footer-wrapper", ".page-number-element",
      ".page-watermark", ".content-wrapper", ".page-number-label"
    ]
    selectors.forEach(selector => {
      pageContentComponent.find(selector).forEach(comp => comp.remove())
    })

    // 🧭 Page label indicator
    const existingIndicator = pageElement.querySelector(".page-indicator")
    if (existingIndicator) existingIndicator.remove()
    const indicator = document.createElement("div")
    indicator.className = "page-indicator"
    indicator.textContent = `${pageSettings.name}`
    pageElement.appendChild(indicator)

    // 📐 Measurements
    const mmToPx = 96 / 25.4
    const marginTopPx = Math.round(this.pageSettings.margins.top * mmToPx)
    const marginBottomPx = Math.round(this.pageSettings.margins.bottom * mmToPx)
    const marginLeftPx = Math.round(this.pageSettings.margins.left * mmToPx)
    const marginRightPx = Math.round(this.pageSettings.margins.right * mmToPx)
    const totalPageWidth = Math.round(this.pageSettings.width * mmToPx)
    const totalPageHeight = Math.round(this.pageSettings.height * mmToPx)
    const contentWidth = totalPageWidth - marginLeftPx - marginRightPx
    const contentHeight = totalPageHeight - marginTopPx - marginBottomPx

    const headerHeight = pageSettings.header?.enabled
      ? Math.round(pageSettings.header.height * mmToPx)
      : 0
    const footerHeight = pageSettings.footer?.enabled
      ? Math.round(pageSettings.footer.height * mmToPx)
      : 0
    const mainContentHeight = contentHeight - headerHeight - footerHeight

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
    })

    // ✅ HEADER
    if (pageSettings.header?.enabled) {
      const header = pageContentComponent.append(`
      <div class="header-wrapper" style="width: 100%; height: ${headerHeight}px;">
        <div class="page-header-element" style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;"></div>
      </div>
    `)[0]
      const headerEl = header.find(".page-header-element")[0]
      if (headerEl) {
        headerEl.set({
          'custom-name': `Header (Page ${pageIndex + 1})`,
          droppable: true, editable: true, selectable: true, draggable: false,
          copyable: false, removable: false
        })
        headerEl.addStyle(headerStyle)
        headerTraits.forEach(trait => headerEl.addTrait(trait))
        headerContent.forEach(comp => headerEl.append(comp))
      }
    }

    // ✅ MAIN CONTENT
    const contentWrapper = pageContentComponent.append(`
    <div class="content-wrapper" style="flex: 1; display: flex; flex-direction: column;">
      <div class="main-content-area" style="height: ${mainContentHeight}px;"></div>
    </div>
  `)[0]
    const mainContentArea = contentWrapper.find(".main-content-area")[0]
    mainContentArea.set({
      'custom-name': `Content Area (Page ${pageIndex + 1})`,
      droppable: true, editable: true, selectable: true
    })

    // ✅ FOOTER
    if (pageSettings.footer?.enabled) {
      const footer = pageContentComponent.append(`
      <div class="footer-wrapper" style="width: 100%; height: ${footerHeight}px;">
        <div class="page-footer-element" style="width: 100%; height: 100%; display: flex; justify-content: center; align-items: center;"></div>
      </div>
    `)[0]
      const footerEl = footer.find(".page-footer-element")[0]
      if (footerEl) {
        footerEl.set({
          'custom-name': `Footer (Page ${pageIndex + 1})`,
          droppable: true, editable: true, selectable: true, draggable: false,
          copyable: false, removable: false
        })
        footerEl.addStyle(footerStyle)
        footerTraits.forEach(trait => footerEl.addTrait(trait))
        footerContent.forEach(comp => footerEl.append(comp))
      }
    }

    // 🏷️ Page number
    setTimeout(() => {
      pageContentComponent.append(`
      <div class="page-number-label" style="
        position: absolute;
        top: 4px;
        right: 10px;
        font-weight: bold;
        font-size: 12px;
        color: #000;
        z-index: 9999;
        pointer-events: none;
      ">Page ${pageIndex + 1}</div>
    `)[0].set({
        editable: false, removable: false, selectable: false,
        draggable: false, copyable: false
      })
    }, 100)

    // ✅ WATERMARK
    this.addWatermarkToPage(pageContentComponent, pageIndex)
  }







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
    let positionStyles = "display: flex !important; align-items: center !important; justify-content: center !important;";

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

    if (watermarkContent) {
      console.log("🚀 Injecting watermark HTML into page content component");
      const watermarkGjsComponent = pageContentComponent.append(`
      <div class="page-watermark" style="
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

      console.log("✅ Watermark component added");
    }
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


  // FIXED: Enhanced addNewPage method that properly applies page number settings
  addNewPage() {
    // Preserve all content before adding a new page
    this.preserveAllContent()

    this.pageSettings.numberOfPages++

    const newPageNumber = this.pageSettings.numberOfPages
    const newPageId = `page-${newPageNumber}`

    // Get the current page number settings from the first page
    const firstPage = this.pageSettings.pages[0] || {}
    const currentPageNumberSettings = firstPage.pageNumber || {
      enabled: false,
      format: "Page {n}",
      position: "bottom-right",
      fontSize: 11,
      color: "#333333",
      backgroundColor: "#ffffff",
      showBorder: true,
    }

    const newPage = {
      id: newPageId,
      name: `Page ${newPageNumber}`,
      pageNumber: newPageNumber,
      backgroundColor: this.pageSettings.backgroundColor,
      header: {
        enabled: this.pageSettings.headerFooter.headerEnabled,
        content: "",
        height: this.pageSettings.headerFooter.headerHeight,
        padding: 10,
        fontSize: 12,
        color: "#333333",
        backgroundColor: this.pageSettings.backgroundColor,
        position: "center",
      },
      footer: {
        enabled: this.pageSettings.headerFooter.footerEnabled,
        content: "",
        height: this.pageSettings.headerFooter.footerHeight,
        padding: 10,
        fontSize: 12,
        color: "#333333",
        backgroundColor: this.pageSettings.backgroundColor,
        position: "center",
      },
      // FIXED: Apply current page number settings to new page
      pageNumber: { ...currentPageNumberSettings },
    }

    this.pageSettings.pages.push(newPage)

    // Recreate pages
    this.setupEditorPages()

    // Restore content after recreation
    setTimeout(() => {
      this.restoreAllContent()
      this.updateAllPageVisuals()
    }, 300)

    this.updatePageHeadersWithNumbers(); // <- add this at the end


    console.log(`New page added: ${newPageId}`)
  }

}
