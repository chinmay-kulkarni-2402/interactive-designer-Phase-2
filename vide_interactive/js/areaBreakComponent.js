/**
 * FLOW LAYOUT — Combined fixes for:
 * 1) Partial splitting (only overflow moved)
 * 2) Immediate DOM update when changing content (model-first)
 * 3) Reliable, debounced reflow on updates (no click needed)
 *
 * Usage: replace existing flowLayoutComponent implementation with this.
 */
function flowLayoutComponent(editor) {
  const domc = editor.DomComponents;
  const bm = editor.BlockManager;

  const LAYOUT = "flow-layout";
  const COL = "flow-column";
  const CUSTOM_TEXT_TYPE = "formatted-rich-text";

  // Simple debounce for reflow calls
  let reflowTimer = null;
  const scheduleReflow = (view, delay = 80) => {
    if (reflowTimer) clearTimeout(reflowTimer);
    reflowTimer = setTimeout(() => {
      try {
        view.reflow();
      } catch (e) {
        // ignore
      }
      reflowTimer = null;
    }, delay);
  };

  // Ensure DOM id & keep model attributes in-sync
  const ensureIdSync = (itemEl, compModel) => {
    if (!itemEl.id) itemEl.id = "flow-item-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 10000);
    if (compModel && compModel.getAttributes) {
      const attrs = Object.assign({}, compModel.getAttributes());
      if (attrs.id !== itemEl.id) {
        attrs.id = itemEl.id;
        try { compModel.set({ attributes: attrs }, { silent: true }); } catch (e) { /* ignore */ }
      }
    }
    return itemEl.id;
  };

  // Find model by DOM id via wrapper.find
  const findModelByDOMId = (id) => {
    if (!id) return null;
    return editor.getWrapper().find("#" + id)[0] || null;
  };

  /* ---------------------------
   * Column
   * --------------------------- */
  domc.addType(COL, {
    isComponent(el) {
      return el?.classList?.contains("flow-col") ? { type: COL } : false;
    },
    model: {
      defaults: {
        name: "Flow Column",
        tagName: "div",
        attributes: { class: "flow-col" },
        style: {
          "flex-grow": "1",
          "flex-basis": "50%",
          padding: "10px",
          "box-sizing": "border-box",
          overflow: "hidden",
        },
        droppable: ".flow-content",
        removable: false,
        copyable: false,
        components: [
          {
            tagName: "div",
            attributes: { class: "flow-content" },
            style: {
              position: "relative",
              height: "100%",
              overflow: "visible",
            },
          },
        ],
      },
    },
  });

  /* ---------------------------
   * Layout
   * --------------------------- */
  domc.addType(LAYOUT, {
    isComponent(el) {
      return el?.classList?.contains("flow-layout") ? { type: LAYOUT } : false;
    },

    model: {
      defaults: {
        name: "Flow Layout",
        tagName: "div",
        attributes: { class: "flow-layout" },
        style: {
          display: "flex",
          "flex-direction": "row",
          width: "100%",
          height: "300px",
          border: "1px solid #ccc",
          overflow: "hidden",
        },
        components: [{ type: COL }, { type: COL }],
        traits: [
          { type: "number", name: "columns", label: "Columns", min: 2, max: 12, value: 2, changeProp: 1 },
          { type: "number", name: "height", label: "Height (px)", min: 100, value: 300, changeProp: 1 },
        ],
      },

      init() {
        this.listenTo(this, "change:columns", this.updateColumns);
        this.listenTo(this, "change:height", this.updateHeight);
        if (!this.get("columns")) this.set("columns", 2);
        if (!this.get("height")) this.set("height", 300);
        this.updateHeight();
      },

      updateHeight() {
        const h = parseInt(this.get("height")) || 300;
        this.addStyle({ height: h + "px" });
        if (this.view?.el) this.view.el.style.height = h + "px";
      },

      updateColumns() {
        const target = parseInt(this.get("columns")) || 2;
        const comps = this.components();
        const current = comps.length;
        if (target > current) {
          for (let i = current; i < target; i++) comps.add({ type: COL });
        } else if (target < current) {
          for (let i = current - 1; i >= target; i--) comps.at(i).remove();
        }
        setTimeout(() => this.view?.render(), 20);
      },
    },

    view: {
      init() {
        // Listen a wide set of events and schedule a debounced reflow
        const evs = [
          "component:drop",
          "component:add",
          "component:remove",
          "component:update",
          "component:style:update",
          "component:content:update",
        ];
        evs.forEach((ev) => editor.on(ev, () => scheduleReflow(this, 80)));

        // Also listen model-level content changes (safer for some custom components)
        editor.getWrapper().on("change:components", () => scheduleReflow(this, 100));
      },

      onRender() {
        scheduleReflow(this, 60);
      },

      /**
       * Try to split content to fit remainPx (pixels).
       * Returns { remainingHTML, overflowHTML } or null if can't split.
       */
      splitTextContent(itemEl, compModel, remainPx) {
        if (!itemEl || remainPx <= 0) return null;

        // Prefer model-stored content; fallback to view DOM innerHTML
        let originalHTML = "";
        try {
          if (compModel && compModel.get) {
            const c = compModel.get("content");
            if (c != null && c !== undefined && String(c).trim() !== "") originalHTML = String(c);
          }
        } catch (e) { }
        if (!originalHTML) originalHTML = itemEl.innerHTML || "";

        // Tokenize: keep tags as tokens and words/spaces as tokens
        const tokens = originalHTML.match(/(<[^>]+>|[^<\s]+[\s]*)/g) || [];

        if (tokens.length <= 1) return null;

        const flow = itemEl.closest(".flow-content") || this.el;

        let left = 0;
        let right = tokens.length;
        let best = -1;

        while (left <= right) {
          const mid = Math.floor((left + right) / 2);
          const testHTML = tokens.slice(0, mid).join("");

          // Create a measuring node inside same flow container for identical wrapping
          const temp = itemEl.cloneNode(false);
          const cs = window.getComputedStyle(itemEl);
          temp.style.cssText = cs.cssText || "";
          // Force width to flow width to avoid %/inherit mismatch
          temp.style.width = (flow.clientWidth) + "px";
          temp.style.position = "absolute";
          temp.style.visibility = "hidden";
          temp.style.height = "auto";
          temp.style.left = "0";
          temp.style.top = "0";
          temp.innerHTML = testHTML;

          flow.appendChild(temp);
          const h = temp.offsetHeight;
          flow.removeChild(temp);

          if (h <= remainPx) {
            best = mid;
            left = mid + 1;
          } else {
            right = mid - 1;
          }
        }

        if (best > 0 && best < tokens.length) {
          return {
            remainingHTML: tokens.slice(0, best).join(""),
            overflowHTML: tokens.slice(best).join(""),
          };
        }
        return null;
      },

      /**
       * Reflow implementation
       */
      reflow() {
        const layoutEl = this.el;
        if (!layoutEl) return;
        const layoutRect = layoutEl.getBoundingClientRect();
        const layoutHeight = layoutRect.height;
        if (!layoutHeight) return;

        const cols = Array.from(layoutEl.querySelectorAll(".flow-col"));
        if (!cols.length) return;

        for (let colIndex = 0; colIndex < cols.length; colIndex++) {
          const col = cols[colIndex];
          const flow = col.querySelector(".flow-content");
          if (!flow) continue;

          // Snapshot children since DOM may change during loop
          const items = Array.from(flow.children);
          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            // Ensure id + model sync
            ensureIdSync(item, findModelByDOMId(item.id));

            const itemRect = item.getBoundingClientRect();
            const flowRect = flow.getBoundingClientRect();

            // item top relative to flow (pixel)
            const itemTopRel = itemRect.top - flowRect.top;
            const itemHeight = itemRect.height;
            const itemBottomRel = itemTopRel + itemHeight;

            // remaining pixels inside layout from this item's top
            const remainPx = Math.floor(layoutHeight - itemTopRel);

            if (itemBottomRel > layoutHeight) {
              const nextCol = cols[colIndex + 1];
              if (!nextCol) continue;
              const nextFlow = nextCol.querySelector(".flow-content");
              if (!nextFlow) continue;

              const compModel = findModelByDOMId(item.id);
              const isTextLike = compModel && ((compModel.is && compModel.is("text")) || (compModel.get && compModel.get("type") === CUSTOM_TEXT_TYPE));

              let handled = false;

              // Attempt partial split for text-like items if some remainPx available
              if (isTextLike && remainPx > 8) {
                try {
                  const splitRes = this.splitTextContent(item, compModel, remainPx);
                  if (splitRes) {
                    // 1) Update model FIRST (silent), then DOM immediately to avoid model overwriting
                    try {
                      // Some custom components store content differently; we attempt common methods:
                      if (compModel && compModel.set) {
                        compModel.set({ content: splitRes.remainingHTML }, { silent: true });
                      }
                    } catch (e) { /* ignore set error */ }

                    // Force DOM sync immediately (model.view may be available)
                    try {
                      const viewEl = compModel && compModel.view && compModel.view.el;
                      if (viewEl) {
                        viewEl.innerHTML = splitRes.remainingHTML;
                      } else {
                        item.innerHTML = splitRes.remainingHTML;
                      }
                    } catch (e) {
                      item.innerHTML = splitRes.remainingHTML;
                    }

                    // 2) Create new model for overflow and insert at top of next column's model
                    let newModel = null;
                    try {
                      newModel = editor.Components.addComponent({
                        type: compModel.get("type"),
                        content: splitRes.overflowHTML,
                        style: compModel.getStyle ? compModel.getStyle() : undefined,
                        attributes: compModel.getAttributes ? compModel.getAttributes() : undefined,
                      });
                    } catch (e) {
                      // fallback minimal
                      newModel = editor.Components.addComponent({
                        type: compModel.get("type") || "text",
                        content: splitRes.overflowHTML,
                      });
                    }

                    // Add to target model flow if possible
                    try {
                      const layoutModel = this.model;
                      const colModels = layoutModel.components();
                      const targetColModel = colModels.at(colIndex + 1);
                      const targetFlowModel = targetColModel && targetColModel.components().at(0);

                      if (targetFlowModel) {
                        targetFlowModel.components().add(newModel, { at: 0 });
                      } else {
                        nextFlow.insertBefore(document.createRange().createContextualFragment(splitRes.overflowHTML), nextFlow.firstChild);
                      }
                    } catch (e) {
                      // DOM fallback
                      try { nextFlow.insertBefore(document.createRange().createContextualFragment(splitRes.overflowHTML), nextFlow.firstChild); } catch (err) { }
                    }

                    // Clear selection and select newly added overflow for UX
                    editor.select(null);
                    setTimeout(() => {
                      try { editor.select(newModel); } catch (e) { }
                    }, 10);

                    handled = true;
                    // After partial-split we must recompute layout
                    scheduleReflow(this, 30);
                    return;
                  }
                } catch (err) {
                  console.warn("Flow: partial split error", err);
                }
              }

              // Fallback: move the entire block (DOM + model if available)
              try {
                nextFlow.insertBefore(item, nextFlow.firstChild);

                if (compModel) {
                  // Move model objects between columns in GrapesJS model tree
                  const layoutModel = this.model;
                  const colModels = layoutModel.components();
                  const sourceColModel = colModels.at(colIndex);
                  const targetColModel = colModels.at(colIndex + 1);
                  const sourceFlowModel = sourceColModel && sourceColModel.components().at(0);
                  const targetFlowModel = targetColModel && targetColModel.components().at(0);

                  if (sourceFlowModel && targetFlowModel) {
                    sourceFlowModel.components().remove(compModel);
                    targetFlowModel.components().add(compModel, { at: 0 });
                  }
                }

                handled = true;
                scheduleReflow(this, 30);
                return;
              } catch (err) {
                console.warn("Flow: move fallback failed", err);
              }

              if (!handled) continue;
            } // if overflow
          } // for items
        } // for cols
      }, // reflow
    },
  });

  // add block to block manager
  bm.add("flow-layout", {
    label: "Flow Layout",
    category: "Layout",
    attributes: { class: "fa fa-columns" },
    content: { type: LAYOUT },
  });
}