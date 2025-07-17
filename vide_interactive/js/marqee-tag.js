function marqueTag(editor) {
  editor.on("load", () => {
    const iframe = editor.Canvas.getFrameEl();
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

    const styleEl = iframeDoc.createElement("style");
    styleEl.innerHTML = `
      marquee {
        border: 1px dashed #999;
        padding: 10px;
        background: #fafafa;
        font-size: 16px;
        display: block;
        white-space: nowrap;
        animation-play-state: running !important;
        will-change: transform;
        min-height: 50px;
        min-width: 200px;
      }

      .gjs-trt-trait__speed-range input[type=range] {
        width: 100%;
      }

      html, body {
        overflow: visible !important;
      }

      .gjs-cv-canvas {
        overflow: visible !important;
      }
    `;
    iframeDoc.head.appendChild(styleEl);
  });

  // Speed range trait
  editor.TraitManager.addType("speed-range", {
    createInput({ trait }) {
      const el = document.createElement("div");
      el.className = "gjs-trt-trait__speed-range";

      const label = document.createElement("div");
      label.style.marginTop = "4px";
      label.style.fontSize = "12px";

      const input = document.createElement("input");
      input.type = "range";
      input.min = 1;
      input.max = 20;
      input.value = trait.get("value") || 6;

      input.oninput = () => {
        label.innerText = `Speed: ${input.value}`;
        trait.set("value", input.value);
        trait.view.model.set("scrollamount", input.value);
      };

      label.innerText = `Speed: ${input.value}`;
      el.appendChild(input);
      el.appendChild(label);
      return el;
    },
  });

  editor.DomComponents.addType("Marquee", {
    model: {
      defaults: {
        tagName: "marquee",
        name: "Marquee",
        attributes: {
          direction: "left",
          scrollamount: "6",
        },
        traits: [
          {
            type: "select",
            name: "direction",
            label: "Direction",
            options: [
              { value: "left", name: "Left" },
              { value: "right", name: "Right" },
              { value: "up", name: "Up" },
              { value: "down", name: "Down" },
            ],
            changeProp: 1,
          },
          {
            type: "speed-range",
            name: "scrollamount",
            label: "Speed",
            changeProp: 1,
          },
          {
            type: "text",
            name: "loop",
            label: "Loop Count (-1 for infinite)",
            placeholder: "-1",
            changeProp: 1,
          },
          {
            type: "checkbox",
            name: "pause-on-hover",
            label: "Pause on Hover",
            changeProp: 1,
            default: false,
          },
        ],
        components: [],
        droppable: true,
        editable: false,
        highlightable: true,
        stylable: true,
        style: {
          "min-height": "50px",
          "min-width": "200px",
          padding: "10px",
          display: "block",
        },
      },

      init() {
        this.listenTo(this, "change:direction", this.updateDirection);
        this.listenTo(this, "change:scrollamount", this.updateScrollAmount);
        this.listenTo(this, "change:loop", this.updateLoop);
        this.listenTo(this, "change:pause-on-hover", this.updatePauseHover);
      },

      updateDirection() {
        this.addAttributes({ direction: this.get("direction") || "left" });
      },

      updateScrollAmount() {
        this.addAttributes({ scrollamount: this.get("scrollamount") || "6" });
      },

      updateLoop() {
        const val = this.get("loop");
        if (!val || val === "-1") {
          this.removeAttributes("loop");
        } else {
          this.addAttributes({ loop: val });
        }
      },

      updatePauseHover() {
        const pause = this.get("pause-on-hover");
        if (pause) {
          this.addAttributes({
            onmouseover: "this.stop()",
            onmouseout: "this.start()",
          });
        } else {
          this.removeAttributes("onmouseover");
          this.removeAttributes("onmouseout");
        }
      },

      toHTML() {
        const innerHTML = this.components().map(comp => comp.toHTML()).join("");
        const attrs = this.getAttributes();
        const attrStr = Object.entries(attrs)
          .map(([k, v]) => `${k}="${v}"`)
          .join(" ");
        return `<marquee ${attrStr}>${innerHTML}</marquee>`;
      },
    },
  });
}
