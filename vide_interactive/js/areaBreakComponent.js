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
    return (editor.getWrapper().find("#" + id) || [])[0] || null;
  };

  // Deep clone all inline and computed styles
  const cloneStyles = (sourceEl) => {
    const styles = {};
    try {
      const computed = window.getComputedStyle(sourceEl);
      // Copy important style properties
      const props = [
        'color', 'fontSize', 'fontFamily', 'fontWeight', 'fontStyle',
        'textAlign', 'textDecoration', 'lineHeight', 'letterSpacing',
        'backgroundColor', 'padding', 'margin', 'border', 'borderRadius',
        'display', 'width', 'maxWidth', 'minWidth'
      ];
      props.forEach(prop => {
        const value = computed.getPropertyValue(prop);
        if (value) styles[prop] = value;
      });
    } catch(e) { /* ignore */ }
    return styles;
  };

  // Helper: remove width/max-width rules from GrapesJS CSS manager for an id
  const removeIdWidthRule = (id) => {
    if (!id) return;
    try {
      const CssC = editor && editor.Css;
      if (CssC) {
        const rule = CssC.getRule(`#${id}`);
        if (rule) {
          let ruleStyle = {};
          try { ruleStyle = rule.getStyle(); } catch(e){ ruleStyle = rule.style || {}; }
          let updated = false;
          if (ruleStyle.width) { delete ruleStyle.width; updated = true; }
          if (ruleStyle['max-width']) { delete ruleStyle['max-width']; updated = true; }
          if (ruleStyle.maxWidth) { delete ruleStyle.maxWidth; updated = true; }
          if (updated && rule.setStyle) rule.setStyle(ruleStyle);
        }
      }
    } catch (e) { console.warn('removeIdWidthRule failed', id, e); }
  };

  // Helper: cleanup model style and DOM inline width properties
  const cleanupWidthFromModelAndDom = (model, domEl) => {
    try {
      if (model && model.getStyle && model.setStyle) {
        const ms = Object.assign({}, model.getStyle());
        if (ms.width) { delete ms.width; }
        if (ms['max-width']) { delete ms['max-width']; }
        if (ms.maxWidth) { delete ms.maxWidth; }
        model.setStyle(ms, { silent: true });
      }
    } catch (e) { /* ignore */ }

    try {
      if (domEl && domEl.style) {
        domEl.style.width = '';
        domEl.style.maxWidth = '';
        if (domEl.style.removeProperty) {
          try { domEl.style.removeProperty('width'); } catch(e){}
          try { domEl.style.removeProperty('max-width'); } catch(e){}
        }
      }
    } catch (e) { /* ignore */ }
  };

  // Check if element is a table
  const isTable = (el) => {
    if (!el) return false;
    return el.tagName === 'TABLE' ||
           (el.classList && el.classList.contains('table')) ||
           (el.closest && el.closest('table') !== null);
  };

  // Check if element is a JSON table
  const isJsonTable = (el) => {
    if (!el) return false;
    return el.getAttribute && (el.getAttribute('data-gjs-type') === 'json-table' || (el.classList && el.classList.contains('json-table-container')));
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

        // add or remove columns
        if (target > current) {
          for (let i = current; i < target; i++) comps.add({ type: COL });
        } else if (target < current) {
          for (let i = current - 1; i >= target; i--) comps.at(i).remove();
        }

        // Update flex-basis for every column
        const basisValue = (100 / target).toFixed(2) + '%';

        comps.each(colModel => {
          let colStyle = colModel.getStyle ? colModel.getStyle() : {};
          if (colStyle['flex-basis'] !== basisValue) {
            colStyle['flex-basis'] = basisValue;
            if (colModel.setStyle) colModel.setStyle(colStyle);
          }

          // Cleanup inner items styles (remove width/max-width rules)
          const flowModel = colModel.components().at(0);
          if (flowModel) {
            flowModel.components().each(itemModel => {
              const type = itemModel.get('type');
              // For text-like items, remove width rules
              if (type === CUSTOM_TEXT_TYPE || type === 'text') {
                try {
                  let currentStyle = itemModel.getStyle ? itemModel.getStyle() : {};
                  let needsUpdate = false;
                  if (currentStyle.width) { delete currentStyle.width; needsUpdate = true; }
                  if (currentStyle['max-width']) { delete currentStyle['max-width']; needsUpdate = true; }
                  if (needsUpdate && itemModel.setStyle) {
                    itemModel.setStyle(currentStyle, { silent: true });
                  }
                } catch (e) { /* ignore */ }

                try {
                  const itemEl = itemModel.view && itemModel.view.el;
                  if (itemEl) {
                    itemEl.style.width = '';
                    itemEl.style.maxWidth = '';
                    if (itemEl.style.removeProperty) {
                      try { itemEl.style.removeProperty('width'); } catch(e){}
                      try { itemEl.style.removeProperty('max-width'); } catch(e){}
                    }
                  }
                } catch (e) {}

                // Remove CSS rule for the id
                try {
                  const itemId = itemModel.getId ? itemModel.getId() : null;
                  if (itemId) removeIdWidthRule(itemId);
                } catch(e){}
              }
            });
          }
        });

        // Trigger a reflow after changes
        this.view?.reflow();
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

        // Ensure layout reflow when wrapper or canvas resizes
        try {
          const cm = editor.Canvas && editor.Canvas.getFrameEl && editor.Canvas.getFrameEl();
          if (cm && typeof window !== 'undefined') {
            // window resize handled globally, but we attach a listener to schedule reflow
            window.addEventListener('resize', () => scheduleReflow(this, 120));
          }
        } catch(e){}
      },

      onRender() {
        scheduleReflow(this, 60);
      },

      /**
       * Split table rows intelligently
       */
      splitTableContent(tableEl, compModel, remainPx) {
        if (!tableEl || remainPx <= 0) return null;

        const tbody = tableEl.querySelector('tbody') || tableEl;
        const rows = Array.from(tbody.querySelectorAll('tr'));
        if (rows.length <= 1) return null;

        // Get headers
        let headerHTML = '';
        const thead = tableEl.querySelector('thead');
        if (thead) {
          headerHTML = thead.outerHTML;
        } else {
          const firstRow = rows[0];
          if (firstRow && firstRow.querySelector('th')) {
            headerHTML = `<thead>${firstRow.outerHTML}</thead>`;
            rows.shift();
          }
        }

        if (rows.length === 0) return null;

        const flow = tableEl.closest && tableEl.closest('.flow-content');
        if (!flow) return null;

        let left = 1;
        let right = rows.length;
        let best = -1;

        while (left <= right) {
          const mid = Math.floor((left + right) / 2);
          const testTable = tableEl.cloneNode(false);
          testTable.style.cssText = tableEl.style.cssText || '';
          if (tableEl.className) testTable.className = tableEl.className;
          if (tableEl.border) testTable.border = tableEl.border;
          if (tableEl.cellPadding) testTable.cellPadding = tableEl.cellPadding;
          if (tableEl.cellSpacing) testTable.cellSpacing = tableEl.cellSpacing;

          testTable.innerHTML = headerHTML + '<tbody>' + rows.slice(0, mid).map(r => r.outerHTML).join('') + '</tbody>';
          testTable.style.position = 'absolute';
          testTable.style.visibility = 'hidden';
          testTable.style.width = flow.clientWidth + 'px';

          flow.appendChild(testTable);
          const h = testTable.offsetHeight;
          flow.removeChild(testTable);

          if (h <= remainPx) {
            best = mid;
            left = mid + 1;
          } else {
            right = mid - 1;
          }
        }

        if (best > 0 && best < rows.length) {
          const remainingRows = rows.slice(0, best).map(r => r.outerHTML).join('');
          const overflowRows = rows.slice(best).map(r => r.outerHTML).join('');

          return {
            remainingHTML: headerHTML + '<tbody>' + remainingRows + '</tbody>',
            overflowHTML: headerHTML + '<tbody>' + overflowRows + '</tbody>',
          };
        }
        return null;
      },

      /**
       * Try to split content to fit remainPx (pixels).
       * Returns { remainingHTML, overflowHTML } or null if can't split.
       */
      splitTextContent(itemEl, compModel, remainPx) {
        if (!itemEl || remainPx <= 0) return null;

        let originalHTML = "";
        try {
          if (compModel && compModel.get) {
            const c = compModel.get("content");
            if (c != null && c !== undefined && String(c).trim() !== "") originalHTML = String(c);
          }
        } catch (e) { }
        if (!originalHTML) originalHTML = itemEl.innerHTML || "";

        const tokens = originalHTML.match(/(<[^>]+>|[^<\s]+[\s]*)/g) || [];
        if (tokens.length <= 1) return null;

        const flow = itemEl.closest && (itemEl.closest('.flow-content') || this.el);

        let left = 0;
        let right = tokens.length;
        let best = -1;

        while (left <= right) {
          const mid = Math.floor((left + right) / 2);
          const testHTML = tokens.slice(0, mid).join("");

          const temp = itemEl.cloneNode(false);
          const cs = window.getComputedStyle(itemEl);
          temp.style.cssText = cs.cssText || "";
          temp.style.width = (flow && flow.clientWidth ? flow.clientWidth : itemEl.clientWidth) + "px";
          temp.style.position = "absolute";
          temp.style.visibility = "hidden";
          temp.style.height = "auto";
          temp.style.left = "0";
          temp.style.top = "0";
          temp.innerHTML = testHTML;

          (flow || document.body).appendChild(temp);
          const h = temp.offsetHeight;
          (flow || document.body).removeChild(temp);

          if (h <= remainPx) {
            best = mid;
            left = mid + 1;
          } else {
            right = mid - 1;
          }
        }

        if (best > 0 && best < tokens.length) {
          return {
            remainingHTML: tokens.slice(0, best).join("") ,
            overflowHTML: tokens.slice(best).join("") ,
          };
        }
        return null;
      },

      /**
       * Reflow implementation - processes ALL columns sequentially
       */
      reflow() {
        const layoutEl = this.el;
        if (!layoutEl) return;
        const layoutRect = layoutEl.getBoundingClientRect();
        const layoutHeight = layoutRect.height;
        if (!layoutHeight) return;

        const cols = Array.from(layoutEl.querySelectorAll(".flow-col"));
        if (!cols.length) return;

        // Track processed items globally to prevent infinite loops
        const processedIds = new Set();

        // Process each column sequentially
        for (let colIndex = 0; colIndex < cols.length; colIndex++) {
          const col = cols[colIndex];
          const flow = col.querySelector(".flow-content");
          if (!flow) continue;

          const isLastColumn = colIndex === cols.length - 1;

          // Get fresh list of items for this column
          const items = Array.from(flow.children);

          for (let i = 0; i < items.length; i++) {
            const item = items[i];

            // Skip if already processed in this reflow cycle
            const itemId = ensureIdSync(item, findModelByDOMId(item.id));
            if (processedIds.has(itemId)) continue;

            const itemRect = item.getBoundingClientRect();
            const flowRect = flow.getBoundingClientRect();

            // item top relative to flow (pixel)
            const itemTopRel = itemRect.top - flowRect.top;
            const itemHeight = itemRect.height;
            const itemBottomRel = itemTopRel + itemHeight;

            // remaining pixels inside layout from this item's top
            const remainPx = Math.floor(layoutHeight - itemTopRel);

            // Check if item overflows
            if (itemBottomRel > layoutHeight) {
              // If this is the last column, hide overflow instead of moving
              if (isLastColumn) {
                item.style.maxHeight = remainPx + 'px';
                item.style.overflow = 'hidden';
                processedIds.add(itemId);
                continue;
              }

              const nextCol = cols[colIndex + 1];
              if (!nextCol) continue; // No next column available

              const nextFlow = nextCol.querySelector(".flow-content");
              if (!nextFlow) continue;

              const compModel = findModelByDOMId(item.id);

              // Check if it's a table (HTML or JSON)
              const isTableEl = isTable(item);
              const isJsonTableEl = isJsonTable(item);

              let handled = false;

              // Handle table splitting
              if (isTableEl && remainPx > 50) {
                try {
                  let actualTable = item;
                  if (item.tagName !== 'TABLE') {
                    actualTable = item.querySelector('table');
                  }

                  if (actualTable) {
                    const splitRes = this.splitTableContent(actualTable, compModel, remainPx);
                    if (splitRes && splitRes.remainingHTML && splitRes.overflowHTML) {
                      // Update current table with remaining rows
                      actualTable.innerHTML = splitRes.remainingHTML;

                      // Create overflow table with proper styling
                      const newTableWrapper = item.cloneNode(false);
                      const newTable = actualTable.cloneNode(false);
                      newTable.innerHTML = splitRes.overflowHTML;

                      // Copy all styles from original table
                      const tableStyles = cloneStyles(actualTable);
                      Object.assign(newTable.style, tableStyles);

                      // Generate unique ID for the new table
                      const newItemId = "flow-item-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 10000);

                      if (item.tagName === 'TABLE') {
                        newTable.id = newItemId;
                        nextFlow.insertBefore(newTable, nextFlow.firstChild);
                      } else {
                        newTableWrapper.id = newItemId;
                        const wrapperStyles = cloneStyles(item);
                        Object.assign(newTableWrapper.style, wrapperStyles);
                        newTableWrapper.appendChild(newTable);
                        nextFlow.insertBefore(newTableWrapper, nextFlow.firstChild);
                      }

                      // Create model for new table
                      if (compModel) {
                        try {
                          const newModel = compModel.clone();
                          newModel.set('attributes', {
                            id: newItemId,
                            'data-table-continuation': 'true'
                          });

                          const layoutModel = this.model;
                          const colModels = layoutModel.components();
                          const targetColModel = colModels.at(colIndex + 1);
                          const targetFlowModel = targetColModel && targetColModel.components().at(0);

                          if (targetFlowModel) {
                            targetFlowModel.components().add(newModel, { at: 0 });

                            // Remove any id-based width rules
                            const finalNewItemId = newModel.getId();
                            if (finalNewItemId) removeIdWidthRule(finalNewItemId);

                            // Cleanup model & DOM inline
                            cleanupWidthFromModelAndDom(newModel, newModel.view && newModel.view.el);
                          }
                        } catch (e) {
                          console.warn("Table model creation failed", e);
                        }
                      }

                      handled = true;
                      processedIds.add(itemId);
                      processedIds.add(newItemId);

                      // Mark original item as processed to prevent re-processing
                      item.setAttribute('data-table-split', 'true');

                      scheduleReflow(this, 50);
                      return;
                    } else {
                      // If split fails but table overflows, try to move entire table
                      if (!isLastColumn) {
                        const capturedStyles = cloneStyles(item);
                        const capturedClasses = item.className;

                        nextFlow.insertBefore(item, nextFlow.firstChild);
                        Object.assign(item.style, capturedStyles);
                        item.className = capturedClasses;

                        if (compModel) {
                          const layoutModel = this.model;
                          const colModels = layoutModel.components();
                          const sourceColModel = colModels.at(colIndex);
                          const targetColModel = colModels.at(colIndex + 1);
                          const sourceFlowModel = sourceColModel && sourceColModel.components().at(0);
                          const targetFlowModel = targetColModel && targetColModel.components().at(0);

                          if (sourceFlowModel && targetFlowModel) {
                            sourceFlowModel.components().remove(compModel);
                            targetFlowModel.components().add(compModel, { at: 0 });

                            // cleanup id-based rule for moved comp
                            const newId = compModel.getId ? compModel.getId() : item.id;
                            if (newId) removeIdWidthRule(newId);
                            cleanupWidthFromModelAndDom(compModel, item);
                          }
                        }

                        handled = true;
                        processedIds.add(itemId);
                        scheduleReflow(this, 50);
                        return;
                      }
                    }
                  }
                } catch (err) {
                  console.warn("Table split error", err);
                }
              }

              // Handle JSON table - move entire table to next column
              if (isJsonTableEl && !handled) {
                try {
                  const clonedJsonTable = item.cloneNode(true);
                  const newItemId = "flow-item-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 10000);
                  clonedJsonTable.id = newItemId;

                  nextFlow.insertBefore(clonedJsonTable, nextFlow.firstChild);

                  // Remove from current column
                  item.remove();

                  if (compModel) {
                    const layoutModel = this.model;
                    const colModels = layoutModel.components();
                    const sourceColModel = colModels.at(colIndex);
                    const targetColModel = colModels.at(colIndex + 1);
                    const sourceFlowModel = sourceColModel && sourceColModel.components().at(0);
                    const targetFlowModel = targetColModel && targetColModel.components().at(0);

                    if (sourceFlowModel && targetFlowModel) {
                      sourceFlowModel.components().remove(compModel);
                      compModel.set('attributes', { id: newItemId });
                      targetFlowModel.components().add(compModel, { at: 0 });

                      // cleanup rules & styles for moved component
                      removeIdWidthRule(newItemId);
                      cleanupWidthFromModelAndDom(compModel, nextFlow.querySelector('#' + newItemId));
                    }
                  }

                  handled = true;
                  processedIds.add(itemId);
                  processedIds.add(newItemId);
                  scheduleReflow(this, 50);
                  return;
                } catch (err) {
                  console.warn("JSON table move error", err);
                }
              }

              // Handle text splitting for text-like elements
              const isTextLike = compModel && ((compModel.is && compModel.is("text")) || (compModel.get && compModel.get("type") === CUSTOM_TEXT_TYPE));

              if (!handled && isTextLike && remainPx > 8) {
                try {
                  const splitRes = this.splitTextContent(item, compModel, remainPx);
                  if (splitRes) {
                    // Check if remaining content is too small (orphaned text)
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = splitRes.remainingHTML;
                    const remainingText = tempDiv.textContent.trim();

                    // If remaining text is less than 20 characters or very short, move entire element
                    if (remainingText.length < 20) {
                      const capturedStyles = cloneStyles(item);
                      const capturedClasses = item.className;

                      nextFlow.insertBefore(item, nextFlow.firstChild);
                      Object.assign(item.style, capturedStyles);
                      item.className = capturedClasses;

                      if (compModel) {
                        const layoutModel = this.model;
                        const colModels = layoutModel.components();
                        const sourceColModel = colModels.at(colIndex);
                        const targetColModel = colModels.at(colIndex + 1);
                        const sourceFlowModel = sourceColModel && sourceColModel.components().at(0);
                        const targetFlowModel = targetColModel && targetColModel.components().at(0);

                        if (sourceFlowModel && targetFlowModel) {
                          const modelStyles = compModel.getStyle ? compModel.getStyle() : {};
                          sourceFlowModel.components().remove(compModel);
                          targetFlowModel.components().add(compModel, { at: 0 });

                          // cleanup id-based rules & inline styles
                          const newId = compModel.getId ? compModel.getId() : item.id;
                          if (newId) removeIdWidthRule(newId);
                          cleanupWidthFromModelAndDom(compModel, item);

                          if (compModel.setStyle) {
                            compModel.setStyle(Object.assign({}, modelStyles, capturedStyles));
                          }
                        }
                      }

                      handled = true;
                      processedIds.add(itemId);
                      scheduleReflow(this, 50);
                      return;
                    }

                    // Capture styles BEFORE any changes
                    const capturedStyles = cloneStyles(item);

                    // 1) Update current element content (model + DOM)
                    try {
                      if (compModel && compModel.set) {
                        compModel.set({ content: splitRes.remainingHTML }, { silent: true });
                      }
                    } catch (e) { /* ignore */ }

                    // Update DOM
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

                    // 2) Create new element for overflow with FULL style copying but NO padding
                    const newItemId = "flow-item-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 10000);
                    let newModel = null;

                    // Remove padding from continuation styles
                    const continuationStyles = Object.assign({}, capturedStyles);
                    continuationStyles.padding = '0';
                    continuationStyles.paddingTop = '0';
                    continuationStyles.paddingBottom = '0';
                    continuationStyles.paddingLeft = '0';
                    continuationStyles.paddingRight = '0';
                    continuationStyles.margin = '0';
                    continuationStyles.marginTop = '0';
                    continuationStyles.marginBottom = '0';

                    if (continuationStyles.width) delete continuationStyles.width;
                    if (continuationStyles['max-width']) delete continuationStyles['max-width'];
                    if (continuationStyles.maxWidth) delete continuationStyles.maxWidth;

                    try {
                      const modelConfig = {
                        type: compModel.get("type"),
                        content: splitRes.overflowHTML,
                        attributes: Object.assign({}, compModel.getAttributes ? compModel.getAttributes() : {}, {
                          id: newItemId,
                          'data-flow-continuation': 'true'
                        })
                      };

                      if (compModel.getStyle) {
                        const baseStyle = Object.assign({}, compModel.getStyle());
                        if (baseStyle.width) delete baseStyle.width;
                        if (baseStyle['max-width']) delete baseStyle['max-width'];
                        if (baseStyle.maxWidth) delete baseStyle.maxWidth;
                        modelConfig.style = Object.assign({}, baseStyle, continuationStyles);
                      } else {
                        modelConfig.style = continuationStyles;
                      }

                      const layoutModel = this.model;
                      const colModels = layoutModel.components();
                      const targetColModel = colModels.at(colIndex + 1);
                      const targetFlowModel = targetColModel && targetColModel.components().at(0);

                      if (targetFlowModel) {
                        newModel = targetFlowModel.components().add(modelConfig, { at: 0 });

                        // Remove id-based rules on the created model
                        const finalNewItemId = newModel.getId ? newModel.getId() : newItemId;
                        if (finalNewItemId) removeIdWidthRule(finalNewItemId);

                        // Force style application on the new element and cleanup inline widths
                        setTimeout(() => {
                          try {
                            const newEl = newModel.view && newModel.view.el;
                            if (newEl) {
                              Object.assign(newEl.style, continuationStyles);
                              newEl.style.width = '';
                              newEl.style.maxWidth = '';
                              if (newEl.style.removeProperty) {
                                try { newEl.style.removeProperty('width'); } catch(e){}
                                try { newEl.style.removeProperty('max-width'); } catch(e){}
                              }
                            }
                          } catch (e) {}
                        }, 10);

                        // Cleanup model styles too
                        cleanupWidthFromModelAndDom(newModel, newModel.view && newModel.view.el);
                      } else {
                        // fallback
                        newModel = editor.Components.addComponent(modelConfig);
                        if (targetColModel) targetColModel.components().add(newModel, { at: 0 });
                        if (newModel && newModel.getId) removeIdWidthRule(newModel.getId());
                      }
                    } catch (e) {
                      console.warn("Failed to create new model for split text", e);
                      // fallback create plain component
                      newModel = editor.Components.addComponent({
                        type: compModel.get("type") || "text",
                        content: splitRes.overflowHTML,
                        attributes: { id: newItemId, 'data-flow-continuation': 'true' },
                        style: continuationStyles
                      });
                      const layoutModel = this.model;
                      const colModels = layoutModel.components();
                      const targetColModel = colModels.at(colIndex + 1);
                      const targetFlowModel = targetColModel && targetColModel.components().at(0);
                      if (targetFlowModel) targetFlowModel.components().add(newModel, { at: 0 });
                      if (newModel && newModel.getId) removeIdWidthRule(newModel.getId());
                    }

                    // Mark as processed
                    processedIds.add(itemId);
                    if (newModel) processedIds.add(newModel.getId ? newModel.getId() : newItemId);
                    else processedIds.add(newItemId);

                    // Clear selection and select new model
                    editor.select(null);
                    setTimeout(() => {
                      try { editor.select(newModel); } catch (e) { }
                    }, 10);

                    handled = true;
                    scheduleReflow(this, 50);
                    return;
                  }
                } catch (err) {
                  console.warn("Flow: partial split error", err);
                }
              }

              // Fallback: move entire element with full style copying
              if (!handled) {
                try {
                  const capturedStyles = cloneStyles(item);
                  const capturedClasses = item.className;

                  nextFlow.insertBefore(item, nextFlow.firstChild);

                  Object.assign(item.style, capturedStyles);
                  item.className = capturedClasses;

                  if (compModel) {
                    const layoutModel = this.model;
                    const colModels = layoutModel.components();
                    const sourceColModel = colModels.at(colIndex);
                    const targetColModel = colModels.at(colIndex + 1);
                    const sourceFlowModel = sourceColModel && sourceColModel.components().at(0);
                    const targetFlowModel = targetColModel && targetColModel.components().at(0);

                    if (sourceFlowModel && targetFlowModel) {
                      const modelStyles = compModel.getStyle ? compModel.getStyle() : {};
                      sourceFlowModel.components().remove(compModel);
                      targetFlowModel.components().add(compModel, { at: 0 });

                      // Reapply styles to model
                      if (compModel.setStyle) {
                        compModel.setStyle(Object.assign({}, modelStyles, capturedStyles));
                      }

                      // Cleanup any id-based width rule and inline width
                      const newId = compModel.getId ? compModel.getId() : item.id;
                      if (newId) removeIdWidthRule(newId);
                      cleanupWidthFromModelAndDom(compModel, item);
                    }
                  }

                  handled = true;
                  processedIds.add(itemId);
                  scheduleReflow(this, 50);
                  return;
                } catch (err) {
                  console.warn("Flow: move fallback failed", err);
                }
              }
            } else {
              // Item fits - mark as processed
              processedIds.add(itemId);
            }
          }
        }
      },

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