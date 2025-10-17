function customFlowColumns(editor) {
  const domc = editor.Components;

  // Flow Column Component (Individual Column)
  domc.addType("flow-column", {
    model: {
      defaults: {
        tagName: "div",
        name: "Flow Column",
        draggable: '[data-gjs-type="flow-columns"]',
        droppable: true,
        attributes: { class: "flow-column" },
        traits: [
          {
            type: "number",
            label: "Width (%)",
            name: "column-width",
            placeholder: "e.g. 50",
            changeProp: 1,
            min: 10,
            max: 100,
            default: 50,
          },
          {
            type: "number",
            label: "Height (px)",
            name: "column-height",
            placeholder: "e.g. 400",
            changeProp: 1,
            min: 100,
            default: 400,
          },
        ],
        style: {
          "height": "400px",
          "max-height": "400px",
          "width": "50%",
          "border": "1px solid #ddd",
          "padding": "10px",
          "box-sizing": "border-box",
          "overflow": "hidden",
          "position": "relative",
          "page-break-inside": "avoid",
          "break-inside": "avoid",
          "word-wrap": "break-word",
          "overflow-wrap": "break-word",
        },
      },

      init() {
        this.listenTo(
          this,
          "change:column-width change:column-height",
          this.updateColumnStyle
        );
        this.listenTo(this, "component:add component:remove", this.handleContentChange);
      },

      updateColumnStyle() {
        const width = this.get("column-width") || 50;
        const height = this.get("column-height") || 400;

        this.addStyle({
          "width": `${width}%`,
          "height": `${height}px`,
          "max-height": `${height}px`,
        });
      },

      handleContentChange() {
        const parent = this.parent();
        if (parent && parent.get("type") === "flow-columns") {
          setTimeout(() => {
            parent.trigger("redistribute:content");
          }, 100);
        }
      },
    },
  });

  // Flow Columns Container
  domc.addType("flow-columns", {
    model: {
      defaults: {
        tagName: "div",
        name: "Flow Columns",
        draggable: true,
        droppable: false,
        attributes: { class: "flow-columns-container" },
        traits: [
          {
            type: "number",
            label: "Number of Columns",
            name: "columns-count",
            changeProp: 1,
            min: 1,
            max: 10,
            default: 2,
          },
          {
            type: "number",
            label: "Gap (px)",
            name: "columns-gap",
            placeholder: "e.g. 10",
            changeProp: 1,
            min: 0,
            default: 10,
          },
          {
            type: "checkbox",
            label: "Auto Flow Content",
            name: "auto-flow",
            changeProp: 1,
            default: true,
          },
        ],
        style: {
          "display": "flex",
          "flex-direction": "row",
          "gap": "10px",
          "width": "100%",
          "min-height": "400px",
          "padding": "10px",
          "box-sizing": "border-box",
          "page-break-inside": "avoid",
          "break-inside": "avoid",
        },
        components: [],
      },

      init() {
        this.listenTo(
          this,
          "change:columns-count change:columns-gap",
          this.updateContainerStyle
        );
        this.listenTo(this, "redistribute:content", this.redistributeContent);

        const numCols = this.get("columns-count") || 2;
        this.initializeColumns(numCols);
      },

      updateContainerStyle() {
        const gap = this.get("columns-gap") || 10;
        const numCols = this.get("columns-count") || 2;

        this.addStyle({
          "gap": `${gap}px`,
        });

        this.updateColumnCount(numCols);
      },

      initializeColumns(count) {
        const colWidth = Math.floor(100 / count);
        for (let i = 0; i < count; i++) {
          this.append({
            type: "flow-column",
            "column-width": colWidth,
            "column-height": 400,
          });
        }
      },

      updateColumnCount(count) {
        const currentColumns = this.components().length;

        if (currentColumns < count) {
          const colWidth = Math.floor(100 / count);
          for (let i = currentColumns; i < count; i++) {
            this.append({
              type: "flow-column",
              "column-width": colWidth,
              "column-height": 400,
            });
          }
        } else if (currentColumns > count) {
          const toRemove = currentColumns - count;
          for (let i = 0; i < toRemove; i++) {
            const lastCol = this.components().at(this.components().length - 1);
            if (lastCol) lastCol.remove();
          }
        }

        this.equalizeColumnWidths();
      },

      equalizeColumnWidths() {
        const columns = this.components();
        const count = columns.length;
        if (count === 0) return;

        const equalWidth = Math.floor(100 / count);
        columns.each((col) => {
          col.set("column-width", equalWidth);
          col.updateColumnStyle();
        });
      },

      redistributeContent() {
        if (!this.get("auto-flow")) return;

        const columns = this.components().models;
        if (columns.length === 0) return;

        setTimeout(() => {
          const columnsEls = columns.map(col => col.getEl()).filter(el => el);
          if (columnsEls.length === 0) return;
          
          this.distributeContentAcrossColumns(columns, columnsEls);
        }, 200);
      },

      distributeContentAcrossColumns(columns, columnsEls) {
        let allContent = [];

        columns.forEach((col) => {
          const colComponents = col.components().models;
          allContent = allContent.concat(colComponents);
        });

        columns.forEach((col) => col.components(""));

        let currentColumnIndex = 0;

        for (let i = 0; i < allContent.length; i++) {
          if (currentColumnIndex >= columns.length) {
            this.addOverflowIndicator(columns[columns.length - 1]);
            break;
          }

          const currentColumn = columns[currentColumnIndex];
          const currentContent = allContent[i];
          const colEl = columnsEls[currentColumnIndex];

          const scrollBefore = colEl ? colEl.scrollHeight : 0;
          const clientHeight = colEl ? colEl.clientHeight : 0;

          currentColumn.append(currentContent);

          setTimeout(() => {}, 50);

          const scrollAfter = colEl ? colEl.scrollHeight : 0;

          if (scrollAfter > clientHeight + 5) {
            currentContent.remove();
            currentColumnIndex++;
            i--;
          }
        }

        if (currentColumnIndex >= columns.length && allContent.length > 0) {
          this.addOverflowIndicator(columns[columns.length - 1]);
        }
      },

      addOverflowIndicator(column) {
        const existingIndicator = column.find('.overflow-indicator')[0];
        if (existingIndicator) return;

        column.addStyle({
          "overflow": "hidden",
        });

        column.append({
          tagName: "div",
          attributes: { class: "overflow-indicator" },
          content: "...",
          style: {
            "position": "absolute",
            "bottom": "5px",
            "right": "10px",
            "background": "#fff",
            "padding": "2px 8px",
            "font-weight": "bold",
            "font-size": "18px",
            "color": "#666",
            "z-index": "10",
          },
        });
      },
    },
  });

  // Add Block
  editor.BlockManager.add("flow-columns", {
    label: "Flow Columns",
    category: "Layout",
    content: {
      type: "flow-columns",
      "columns-count": 2,
    },
    media: `<svg viewBox="0 0 24 24">
      <path fill="currentColor" d="M3,3H11V21H3V3M13,3H21V10H13V3M13,12H21V21H13V12Z"/>
    </svg>`,
  });

  // Add Custom Styles
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @media print {
      .flow-columns-container {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      
      .flow-column {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        overflow: hidden !important;
      }
      
      .overflow-indicator {
        display: block !important;
      }
    }
    
    .flow-column {
      border: 1px dashed #ccc;
    }
    
    .flow-column:hover {
      border-color: #3b97e3;
      background-color: rgba(59, 151, 227, 0.05);
    }
    
    .flow-columns-container {
      outline: 2px dashed #888;
      outline-offset: -2px;
    }
    
    .flow-column * {
      word-wrap: break-word;
      overflow-wrap: break-word;
      word-break: break-word;
      hyphens: auto;
    }
    
    .flow-column img {
      max-width: 100%;
      height: auto;
    }
    
    .flow-column table {
      width: 100%;
      table-layout: fixed;
    }
  `;
  document.head.appendChild(styleSheet);
}