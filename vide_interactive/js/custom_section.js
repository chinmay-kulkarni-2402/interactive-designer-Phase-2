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

  editor.Components.addType("sections", {
    model: {
      defaults: {
        tagName: "div",
        name: "Sections",
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
            components: []
          },
          {
            tagName: "div",
            name: "Content", 
            attributes: { 
              class: "section-content gjs-editor-content",
              'data-gjs-name': 'Content'
            },
            components: []
          },
          {
            tagName: "div",
            name: "Footer",
            attributes: { 
              class: "section-footer gjs-editor-footer",
              'data-gjs-name': 'Footer'
            },
            components: []
          }
        ],
        traits: [
          {
            type: "text",
            label: "Header Min Height",
            name: "header-min-height",
            placeholder: "60px, 5vh",
            changeProp: 1,
            default: "60px",
          },
          {
            type: "text",
            label: "Content Min Height",
            name: "content-min-height",
            placeholder: "200px, 30vh",
            changeProp: 1,
            default: "200px",
          },
          {
            type: "text",
            label: "Footer Min Height",
            name: "footer-min-height",
            placeholder: "50px, 5vh",
            changeProp: 1,
            default: "50px",
          },
        ],
        style: {
          "display": "flex",
          "flex-direction": "column",
          "width": "100%",
          "min-height": "50vh",
          "margin": "10px 0",
          "padding": "5px"
        },
      },

      init() {
        this.listenTo(
          this,
          "change:header-min-height change:content-min-height change:footer-min-height change:layout-style",
          this.updateSections
        );
        this.initializeSections();
      },

      initializeSections() {
        const components = this.components();

        const headerComponent = components.at(0);
        if (headerComponent) {
          headerComponent.addStyle({
            "padding": "10px",
            "min-height": "60px",
            "position": "relative"
          });
        }

        const contentComponent = components.at(1);
        if (contentComponent) {
          contentComponent.addStyle({
            "flex": "1",
            "padding": "10px",
            "min-height": "200px",
            "position": "relative"
          });
        }

        const footerComponent = components.at(2);
        if (footerComponent) {
          footerComponent.addStyle({
            "padding": "10px",
            "min-height": "50px",
            "position": "relative"
          });
        }
      },

      updateSections() {
        const headerMinHeight = this.get("header-min-height") || "60px";
        const contentMinHeight = this.get("content-min-height") || "200px";
        const footerMinHeight = this.get("footer-min-height") || "50px";
        const components = this.components();

        const headerComponent = components.at(0);
        if (headerComponent) {
          let headerStyles = {
            "min-height": headerMinHeight,
            "padding": "10px",
            "position": "relative"
          };
          headerComponent.addStyle(headerStyles);
        }

        const contentComponent = components.at(1);
        if (contentComponent) {
          let contentStyles = {
            "min-height": contentMinHeight,
            "flex": "1",
            "padding": "10px",
            "position": "relative"
          };
          contentComponent.addStyle(contentStyles);
        }

        const footerComponent = components.at(2);
        if (footerComponent) {
          let footerStyles = {
            "min-height": footerMinHeight,
            "padding": "10px",
            "position": "relative"
          };
          footerComponent.addStyle(footerStyles);
        }
      },
    },
  });
}
