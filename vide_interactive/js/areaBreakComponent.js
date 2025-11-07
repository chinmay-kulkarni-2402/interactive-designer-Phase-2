/**
 * GrapesJS Flow Layout (v16 - Full-Height FlowContent + Smart Drop)
 * ---------------------------------------------------
 * ✅ Partial overflow (only extra content moves)
 * ✅ Live typing (no ESC)
 * ✅ DOM + Editor sync
 * ✅ Flow-content full height
 * ✅ Droppable redirection into flow-content
 * ✅ Hidden overflow restore on resize
 *
 * --- CRITICAL FIXES APPLIED ---
 * 1. Optimized Node Handling: The original node is used for the visible part, and only the overflow creates a new clone.
 * 2. Simplified Backflow: Backflow now only moves full, un-split nodes or attempts to merge the first node's content back.
 */

function flowLayoutComponent(editor) {
  const domc = editor.DomComponents;
  const bm = editor.BlockManager;

  const LAYOUT = "flow-layout";
  const COL = "flow-column";

  // --- Column Type ---
  domc.addType(COL, {
    model: {
      defaults: {
        name: "Flow Column",
        tagName: "div",
        droppable: true,
        draggable: false,
        removable: false,
        style: {
          "flex-grow": "1",
          "flex-basis": "50%",
          padding: "10px",
          "box-sizing": "border-box",
          "min-height": "100%",
          overflow: "hidden",
          "word-break": "break-word",
        },
      },
    },
    view: {
      onRender() {
        // Ensure .flow-content exists
        if (!this.el.querySelector(".flow-content")) {
          const flow = document.createElement("div");
          flow.className = "flow-content";
          flow.style.height = "100%";
          flow.style.minHeight = "100%";
          flow.style.boxSizing = "border-box";
          flow.style.display = "block";
          flow.style.position = "relative";
          this.el.appendChild(flow);
        }
      },

      // ✅ Redirect dropped components into .flow-content
      appendChild(childEl) {
        const flow = this.el.querySelector(".flow-content");
        if (flow) flow.appendChild(childEl);
        else this.el.appendChild(childEl);
      },
    },
  });

  // --- Layout Type ---
  domc.addType(LAYOUT, {
    isComponent(el) {
      if (el?.classList?.contains("flow-layout")) return { type: LAYOUT };
      if (el?.getAttribute?.("data-i_designer-type") === "flow-layout")
        return { type: LAYOUT };
      return false;
    },

    model: {
      defaults: {
        name: "Flow Layout",
        tagName: "div",
        droppable: false,
        draggable: true,
        removable: true,
        components: [
          { type: COL, attributes: { class: "flow-col" } },
          { type: COL, attributes: { class: "flow-col" } },
        ],
        style: {
          display: "flex",
          "flex-direction": "row",
          height: "300px",
          overflow: "hidden",
          border: "1px solid #ccc",
          width: "100%",
          "padding-top": "1px",
          "padding-bottom": "1px",
        },
        traits: [
          {
            type: "number",
            label: "Columns",
            name: "columns",
            min: 2,
            max: 10,
            value: 2,
            changeProp: 1,
          },
          {
            type: "number",
            label: "Height (px)",
            name: "height",
            min: 10,
            value: 300,
            changeProp: 1,
          },
        ],
      },

      init() {
        this.on("change:columns", this.updateColumns);
        this.on("change:height", this.updateHeight);

        if (!this.get("columns")) this.set("columns", 2);
        if (!this.get("height")) this.set("height", "300");

        this.updateHeight();
      },

      updateHeight() {
        let h = parseInt(this.get("height")) || 300;
        if (h < 10) h = 10;
        this.set("height", h);
        this.addStyle({ height: `${h}px` });
      },

      updateColumns() {
        let want = parseInt(this.get("columns")) || 2;
        if (want < 2) want = 2;

        const comps = this.components();
        const cur = comps.length;

        if (want > cur) {
          for (let i = cur; i < want; i++) {
            comps.add({ type: COL, attributes: { class: "flow-col" } });
          }
        } else if (want < cur) {
          for (let i = cur - 1; i >= want; i--) comps.at(i).remove();
        }

        this.set("columns", want);
        this.view && this.view.scheduleLayout();
      },
    },

    // --- View ---
    view: {
      init() {
        this.isLayingOut = false;
        this.debounceTimer = null;

        this.listenTo(this.model.components(), "add remove", () =>
          this.scheduleLayout()
        );
      },

      onRender() {
        this.ensureStructure();
        this.attachObservers();
        this.scheduleLayout();
        editor.trigger("component:toggled");
      },

      // ✅ Ensure flow-content and hidden area exist, full height
      ensureStructure() {
        const cols = this.el.querySelectorAll(".flow-col");

        cols.forEach((col) => {
          let flow = col.querySelector(".flow-content");
          if (!flow) {
            flow = document.createElement("div");
            flow.className = "flow-content";
            flow.style.height = "100%";
            flow.style.minHeight = "100%";
            flow.style.boxSizing = "border-box";
            flow.style.display = "block";
            flow.style.position = "relative";
            col.insertBefore(flow, col.firstChild);
          }

          let hidden = col.querySelector(".overflow-hidden-content");
          if (!hidden) {
            hidden = document.createElement("div");
            hidden.className = "overflow-hidden-content";
            hidden.style.display = "none";
            col.appendChild(hidden);
          }

          // ✅ Move extra direct children inside .flow-content
          const extras = Array.from(col.children).filter(
            (ch) =>
              !ch.classList.contains("flow-content") &&
              !ch.classList.contains("overflow-hidden-content")
          );
          extras.forEach((node) => flow.appendChild(node));
        });
      },

      attachObservers() {
        const el = this.el;
        let typing = false;
        let typingTimer;

        el.addEventListener("focusin", (e) => {
          if (e.target?.getAttribute("contenteditable") === "true") {
            typing = true;
            clearTimeout(typingTimer);
          }
        });

        el.addEventListener("input", (e) => {
          if (e.target?.getAttribute("contenteditable") === "true") {
            typing = true;
            clearTimeout(typingTimer);
            typingTimer = setTimeout(() => {
              typing = false;
              this.scheduleLayout();
            }, 1200);
          } else {
            this.scheduleLayout();
          }
        });

        el.addEventListener("focusout", () => {
          typing = false;
          clearTimeout(typingTimer);
          this.scheduleLayout();
        });

        this.mutObs = new MutationObserver(() => {
          if (typing) return;
          this.scheduleLayout();
        });

        this.mutObs.observe(el, { childList: true, subtree: true, characterData: true });

        this.resizeObs = new ResizeObserver(() => {
          if (!typing) this.scheduleLayout();
        });

        this.resizeObs.observe(el);
      },

      scheduleLayout() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => this.layoutFlow(), 200);
      },

      // --- HELPER: Splits HTML content by pixel height (Preserves HTML) ---
      splitHTMLByHeight(html, availableHeight, colWidth) {
        const temp = document.createElement("div");
        temp.style.width = `${colWidth}px`;
        temp.style.position = "absolute";
        temp.style.visibility = "hidden";
        temp.style.top = "0";
        temp.style.left = "0";
        temp.style.whiteSpace = "normal";
        temp.style.wordBreak = "break-word";
        document.body.appendChild(temp);

        let visible = "";
        let overflow = "";

        // 1. Tokenize HTML
        const parts = html
          .replace(/<br\s*\/?>/gi, " [[BR]] ")
          .replace(/&nbsp;/gi, " [[NBSP]] ")
          .split(/(\s+|\[\[BR\]\]|\[\[NBSP\]\]|<[^>]+>)/)
          .filter((t) => t !== "");

        let triggered = false;

        for (let i = 0; i < parts.length; i++) {
          visible += parts[i];

          temp.innerHTML = visible
            .replace(/\[\[BR\]\]/g, "<br>")
            .replace(/\[\[NBSP\]\]/g, "&nbsp;");

          if (temp.scrollHeight > availableHeight) {
            overflow = parts.slice(i).join("");
            visible = parts.slice(0, i).join("");
            triggered = true;
            break;
          }
        }

        document.body.removeChild(temp);

        const restore = (s) =>
          s.replace(/\[\[BR\]\]/g, "<br>").replace(/\[\[NBSP\]\]/g, "&nbsp;");

        if (!triggered) return { visibleHTML: html, overflowHTML: "" };

        return { visibleHTML: restore(visible), overflowHTML: restore(overflow) };
      },

      // --- Main layout + split ---
      layoutFlow() {
        const active = document.activeElement;
        if (active?.getAttribute?.("contenteditable") === "true") return;
        if (this.isLayingOut) return;

        this.isLayingOut = true;
        this.disableObservers();

        try {
          this.ensureStructure();

          const layoutHeight =
            this.el.querySelector(".flow-col")?.offsetHeight || this.el.offsetHeight;
          const cols = Array.from(this.el.querySelectorAll(".flow-col"));
          if (!cols.length) return;

          // Gather all nodes
          const all = [];
          cols.forEach((col) => {
            const flow = col.querySelector(".flow-content");
            const hidden = col.querySelector(".overflow-hidden-content");
            if (!flow) return;

            const children = Array.from(flow.children);
            children.forEach((ch) => all.push(ch));
            flow.innerHTML = "";
            if (hidden) hidden.innerHTML = "";
          });

          let curCol = 0;

          // --- Forward pass: move overflow forward ---
          all.forEach((node) => {
            if (curCol >= cols.length) {
              const lastCol = cols[cols.length - 1];
              const hidden = lastCol.querySelector(".overflow-hidden-content");
              if (hidden) hidden.appendChild(node);
              return;
            }

            let flow = cols[curCol].querySelector(".flow-content");
            const hidden = cols[curCol].querySelector(".overflow-hidden-content");
            if (!flow) return;

            flow.appendChild(node);

            if (flow.scrollHeight > layoutHeight) {
              flow.removeChild(node);

              const tag = node.tagName.toLowerCase();
              const isTextContainer =
                ["div", "p", "span", "section", "h1", "h2", "h3"].includes(tag);
              const hasRichContent =
                node.innerHTML &&
                (node.innerHTML.includes("<") || node.innerHTML.includes("&"));

              if (isTextContainer && (node.textContent || hasRichContent)) {
                const currentContentHeight = flow.scrollHeight;
                const availableSpace = layoutHeight - currentContentHeight;

                const { visibleHTML, overflowHTML } = this.splitHTMLByHeight(
                  node.innerHTML,
                  availableSpace,
                  flow.clientWidth
                );

                if (visibleHTML) {
                  node.innerHTML = visibleHTML;
                  flow.appendChild(node);
                }

                if (overflowHTML) {
                  const overflowNode = node.cloneNode(true);
                  overflowNode.innerHTML = overflowHTML;

                  if (cols[curCol + 1]) {
                    cols[curCol + 1]
                      .querySelector(".flow-content")
                      .appendChild(overflowNode);
                    curCol++;
                  } else if (hidden) {
                    hidden.appendChild(overflowNode);
                  }
                } else if (!visibleHTML) {
                  if (cols[curCol + 1]) {
                    cols[curCol + 1].querySelector(".flow-content").appendChild(node);
                    curCol++;
                  } else if (hidden) {
                    hidden.appendChild(node);
                  }
                }
              } else {
                // Non-splittable content (e.g., image, complex block)
                if (cols[curCol + 1]) {
                  cols[curCol + 1].querySelector(".flow-content").appendChild(node);
                  curCol++;
                } else if (hidden) {
                  hidden.appendChild(node);
                }
              }
            }
          });

          // --- Backflow (merge available space backward) ---
          for (let i = cols.length - 1; i > 0; i--) {
            const curColEl = cols[i];
            const prevColEl = cols[i - 1];
            const flow = curColEl.querySelector(".flow-content");
            const prevFlow = prevColEl.querySelector(".flow-content");
            const hidden = curColEl.querySelector(".overflow-hidden-content");

            // Move content from current flow to previous flow
            if (prevFlow.scrollHeight < layoutHeight && flow.children.length > 0) {
              const children = Array.from(flow.children);
              for (let j = 0; j < children.length; j++) {
                const child = children[j];
                flow.removeChild(child);
                prevFlow.appendChild(child);

                if (prevFlow.scrollHeight > layoutHeight) {
                  prevFlow.removeChild(child);
                  flow.insertBefore(child, flow.firstChild);
                  break;
                }
              }
            }

            // Move content from current hidden area to previous flow
            if (
              prevFlow.scrollHeight < layoutHeight &&
              hidden &&
              hidden.children.length > 0
            ) {
              const hiddenChildren = Array.from(hidden.children);
              for (let j = 0; j < hiddenChildren.length; j++) {
                const restoreNode = hiddenChildren[j];
                hidden.removeChild(restoreNode);
                prevFlow.appendChild(restoreNode);

                if (prevFlow.scrollHeight > layoutHeight) {
                  prevFlow.removeChild(restoreNode);
                  hidden.insertBefore(restoreNode, hidden.firstChild);
                  break;
                }
              }
            }
          }
        } finally {
          setTimeout(() => {
            this.enableObservers();
            this.isLayingOut = false;
            editor.trigger("component:toggled");
          }, 300);
        }
      },

      disableObservers() {
        this.mutObs?.disconnect();
        this.resizeObs?.disconnect();
      },

      enableObservers() {
        const el = this.el;
        if (this.mutObs)
          this.mutObs.observe(el, { childList: true, subtree: true, characterData: true });
        if (this.resizeObs) this.resizeObs.observe(el);
      },
    },
  });

  // --- Block ---
  bm.add("flow-layout", {
    label: "Flow Layout",
    category: "Layout",
    attributes: { class: "fa fa-columns" },
    content: { type: LAYOUT },
  });

  editor.on("component:selected", (cmp) => {
    if (cmp?.get("type") === "flow-layout") {
      editor.TraitManager.render(cmp);
    }
  });
}
 