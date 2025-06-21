function registerPageBreakComponent(editor) {
  const domc = editor.DomComponents

  domc.addType("page-break", {
    isComponent: (el) => el.classList?.contains("page-break"),
    model: {
      defaults: {
        name: "Page Break",
        tagName: "div",
        droppable: false,
        draggable: true,
        editable: false,
        selectable: true,
        highlightable: true,
        stylable: false,
        copyable: true,
        attributes: {
          class: "page-break hide-on-print",
          "data-page-break": "true",
        },
        components: `<span class="page-break-label hide-on-print">--- Page Break ---</span>`,
        styles: `
          .page-break {
            display: block;
            width: 100%;
            height: 20px;
            margin: 10px 0;
            border: 2px dashed #007cff;
            background: rgba(0, 124, 255, 0.05);
            position: relative;
            cursor: pointer;
            transition: all 0.2s ease;
            clear: both;
          }
          
          .page-break:hover {
            background: rgba(0, 124, 255, 0.1);
            border-color: #0056cc;
          }
          
          .page-break-label {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #007cff;
            font-size: 12px;
            font-weight: 500;
            background: white;
            padding: 2px 8px;
            border-radius: 3px;
            white-space: nowrap;
            pointer-events: none;
          }
          
          /* Critical: Hide page breaks completely during print and force page break */
          @media print {
            .page-break {
              display: none !important;
              visibility: hidden !important;
              height: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              page-break-before: always !important;
              page-break-after: avoid !important;
              break-before: page !important;
              break-after: avoid !important;
            }
            
            .page-break-label {
              display: none !important;
            }
            
            /* Force page break for elements that follow a page-break */
            .page-break + * {
              page-break-before: always !important;
              break-before: page !important;
            }
            
            /* Ensure content after page break starts on new page */
            .page-break ~ * {
              page-break-before: auto !important;
            }
            
            /* Hide all elements with hide-on-print class */
            .hide-on-print {
              display: none !important;
              visibility: hidden !important;
              opacity: 0 !important;
              height: 0 !important;
              width: 0 !important;
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              overflow: hidden !important;
            }
          }
        `,
      },

      init() {
        this.addPageBreakStyles()
        this.setupPageBreakBehavior()

        this.on("component:selected", () => {
          if (this.get("tagName") === "div" && this.get("attributes").class?.includes("page-break")) {
            console.log("Page Break selected - Content after this will start on a new page when printed")
          }
        })
      },

      addPageBreakStyles() {
        const editor = this.em
        const css = this.get("styles")

        if (css && editor.getCss().indexOf(".page-break") === -1) {
          editor.addStyle(css)
        }
      },

      setupPageBreakBehavior() {
        // Add special handling for page breaks in print mode
        const editor = this.em

        // Listen for print events to ensure proper page break handling
        if (typeof window !== "undefined") {
          window.addEventListener("beforeprint", () => {
            this.prepareForPrint()
          })

          window.addEventListener("afterprint", () => {
            this.restoreAfterPrint()
          })
        }
      },

      prepareForPrint() {
        // Ensure page breaks are properly handled for printing
        const pageBreaks = document.querySelectorAll(".page-break")
        pageBreaks.forEach((pageBreak) => {
          // Add CSS to force page break
          pageBreak.style.pageBreakBefore = "always"
          pageBreak.style.breakBefore = "page"
          pageBreak.style.display = "none"

          // Ensure next element starts on new page
          const nextElement = pageBreak.nextElementSibling
          if (nextElement) {
            nextElement.style.pageBreakBefore = "always"
            nextElement.style.breakBefore = "page"
          }
        })
      },

      restoreAfterPrint() {
        // Restore normal display after printing
        const pageBreaks = document.querySelectorAll(".page-break")
        pageBreaks.forEach((pageBreak) => {
          pageBreak.style.display = "block"

          const nextElement = pageBreak.nextElementSibling
          if (nextElement) {
            nextElement.style.pageBreakBefore = "auto"
            nextElement.style.breakBefore = "auto"
          }
        })
      },
    },

    view: {
      init() {
        this.setupPageBreakView()
      },

      setupPageBreakView() {
        const el = this.el
        const label = el.querySelector(".page-break-label")

        // Ensure proper styling
        if (label) {
          label.style.color = "#007cff"
          label.style.textAlign = "center"
          label.style.fontStyle = "normal"
          label.style.fontWeight = "500"
        }

        // Add hover effects
        el.addEventListener("mouseenter", () => {
          if (label) {
            label.textContent = "--- Page Break (Content after this will start on new page) ---"
          }
        })

        el.addEventListener("mouseleave", () => {
          if (label) {
            label.textContent = "--- Page Break ---"
          }
        })

        // Add click handler for better UX
        el.addEventListener("click", (e) => {
          e.stopPropagation()
          this.model.trigger("component:selected")
        })

        // Ensure page break is properly positioned
        el.style.clear = "both"
        el.style.width = "100%"
        el.style.display = "block"
      },
    },
  })
}