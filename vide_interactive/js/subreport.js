function subreportPlugin(editor) {
  console.log("📦 Initializing Subreport Plugin (Components Approach)...");

  const apiUrl = "http://192.168.0.188:8081/api/getTemplate";

  editor.DomComponents.addType("subreport", {
    model: {
      defaults: {
        tagName: "div",
        classes: ["subreport-block"],
        attributes: { class: "subreport-container" },
        droppable: true, // Now allows children
        draggable: true,
        resizable: true,
        copyable: true,
        editable: false,
        style: {
          'min-height': '60px',
          'display': 'block',
          'width': '100%'
        },
        traits: [
          { type: "checkbox", label: "Show Data", name: "showData", value: false },
          { type: "checkbox", label: "Share Parameters", name: "shareParams", value: true },
          { type: "checkbox", label: "Share Page Number", name: "sharePageNum", value: false },
          { type: "checkbox", label: "Merge Header/Footer", name: "mergeHeaderFooter", value: false, visible: false },
        ],
      },

      init() {
        console.log("🚀 Subreport component initialized");

        // Hide merge trait initially
        try {
          const traits = this.get("traits");
          if (traits && typeof traits.find === "function") {
            const mt = traits.find(t => {
              try { return t.get("name") === "mergeHeaderFooter"; } catch (e) { return false; }
            });
            if (mt) {
              mt.set("visible", false);
              console.log("🔒 Merge trait hidden by default");
            }
          }
        } catch (e) {
          console.warn("⚠️ Couldn't set merge trait visibility in init():", e);
        }

        this.on("change:attributes:showData", this.onShowDataToggle);
        this.on("change:attributes:filePath", this.onPathChange);
        this.on("change:attributes:mergeHeaderFooter", this.onMergeHeaderToggle);
        this.silentUpdate = false;

        // Add initial placeholder component if empty
        if (this.components().length === 0) {
          this.components().add({
            type: 'text',
            content: '📄 Double-click to choose subreport',
            style: {
              color: '#999',
              padding: '15px',
              'text-align': 'center',
              'font-style': 'italic',
              'background-color': '#f5f5f5',
              'border': '2px dashed #ccc',
              'border-radius': '4px',
              'cursor': 'pointer'
            },
            attributes: {
              'data-subreport-placeholder': 'true'
            }
          });
        }
      },

      onPathChange() {
        const newPath = this.getAttributes().filePath;
        console.log("🔁 Subreport filePath changed to:", newPath);

        if (this.silentUpdate) {
          console.log("⚡ Skipping subreport fetch (set from modal).");
          this.silentUpdate = false;
          return;
        }

        const view = this.view;
        if (view && typeof view.loadSubreport === "function") {
          view.loadSubreport(newPath);
        }
      },

      onShowDataToggle() {
        const showData = this.getAttributes().showData;
        const view = this.view;
        console.log("🧩 Show Data changed to:", showData);
        if (view && typeof view.toggleSubreportDisplay === "function") {
          view.toggleSubreportDisplay(showData);
        }
      },

      onMergeHeaderToggle() {
        const merge = this.getAttributes().mergeHeaderFooter;
        console.log("🧩 Merge Header/Footer changed to:", merge);
        const view = this.view;
        if (view && typeof view.toggleMergeHeaderFooter === "function") {
          view.toggleMergeHeaderFooter(merge);
        }
      },
    },

    view: {
      events: { 
        dblclick: "onDoubleClick"
      },

      onRender() {
        // Ensure placeholder is visible on initial render
        const attrs = this.model.getAttributes();
        if (!attrs.filePath && this.model.components().length === 0) {
          this.showInitialPlaceholder();
        }
      },

      init() {
        this.listenTo(this.model, 'change:attributes:showData', this.handleShowDataChange);
      },

      handleShowDataChange() {
        const showData = this.model.getAttributes().showData;
        this.toggleSubreportDisplay(showData === true || showData === "true");
      },

      async onDoubleClick() {
        console.log("🖱️ Double-click detected on subreport component");
        const model = this.model;
        const attrs = model.getAttributes();
        const currentFile = attrs.filePath || "";

        const modal = editor.Modal;
        modal.setTitle("📑 Select Subreport Template");
        modal.setContent(`<div id="subreport-modal-content" style="padding:10px;">Loading templates...</div>`);
        modal.open();

        try {
          const res = await fetch(apiUrl, { cache: "no-store" });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const templates = await res.json();

          let currentPage = 1;
          const pageSize = 10;
          let filtered = [...templates];

          const renderTable = () => {
            const start = (currentPage - 1) * pageSize;
            const pageData = filtered.slice(start, start + pageSize);
            const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

            const tableHTML = `
              <input type="text" id="template-search" placeholder="🔍 Search templates..."
                style="width:100%; padding:6px; margin-bottom:10px; border:1px solid #ccc; border-radius:4px;" />
              <table style="width:100%; border-collapse:collapse;">
                <thead>
                  <tr>
                    <th style="border:1px solid #ccc; padding:6px;">ID</th>
                    <th style="border:1px solid #ccc; padding:6px;">Name</th>
                    <th style="border:1px solid #ccc; padding:6px;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${pageData.map(t => `
                    <tr>
                      <td style="border:1px solid #ccc; padding:6px;">${t.id}</td>
                      <td style="border:1px solid #ccc; padding:6px;">${t.name}</td>
                      <td style="border:1px solid #ccc; text-align:center; padding:6px;">
                        <button class="add-subreport-btn"
                          data-id="${t.id}"
                          data-name="${t.name}"
                          style="background:#4CAF50; color:white; border:none; padding:5px 10px; cursor:pointer; border-radius:4px;">
                          ➕ Add
                        </button>
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
              <div style="text-align:center; margin-top:10px;">
                <button id="prevPage" ${currentPage === 1 ? "disabled" : ""}
                  style="margin-right:5px; padding:5px 10px;">⬅ Prev</button>
                <span>Page ${currentPage} of ${totalPages}</span>
                <button id="nextPage" ${currentPage === totalPages ? "disabled" : ""}
                  style="margin-left:5px; padding:5px 10px;">Next ➡</button>
              </div>
            `;

            document.getElementById("subreport-modal-content").innerHTML = tableHTML;

            document.getElementById("prevPage")?.addEventListener("click", () => {
              if (currentPage > 1) {
                currentPage--;
                renderTable();
              }
            });
            document.getElementById("nextPage")?.addEventListener("click", () => {
              if (currentPage < totalPages) {
                currentPage++;
                renderTable();
              }
            });

            document.getElementById("template-search").addEventListener("input", (e) => {
              const query = e.target.value.toLowerCase();
              filtered = templates.filter(t => t.name.toLowerCase().includes(query));
              currentPage = 1;
              renderTable();
            });

            document.querySelectorAll(".add-subreport-btn").forEach(btn => {
              btn.addEventListener("click", async (e) => {
                const name = e.target.dataset.name;
                const templateId = e.target.dataset.id;

                if (currentFile && currentFile === templateId) {
                  alert(`"${name}" is already added.`);
                  return;
                }

                if (currentFile && currentFile !== templateId) {
                  const proceed = confirm(`"${currentFile}" is already added. Replace it with "${name}"?`);
                  if (!proceed) return;
                }

                modal.close();
                console.log("📡 Fetching selected template:", name, templateId);

                try {
                  const templateRes = await fetch(`${apiUrl}/${templateId}`, { cache: "no-store" });
                  if (!templateRes.ok) throw new Error(`HTTP ${templateRes.status}`);
                  const templateData = await templateRes.json();
                  const htmlContent = templateData.EditableHtml;
                  if (!htmlContent) throw new Error("No EditableHtml found");

                  await this.loadSubreportFromHTML(htmlContent, name);

                  model.silentUpdate = true;
                  model.addAttributes({
                    filePath: templateId,
                    templateName: name,
                    showData: false,
                  });

                  // Clear any existing placeholder
                  this.clearPlaceholder();

                } catch (err) {
                  console.error("❌ Failed to fetch subreport template:", err);
                  alert(`Failed to fetch template: ${err.message}`);
                }
              });
            });
          };

          renderTable();
        } catch (err) {
          console.error("❌ Failed to load templates:", err);
          document.getElementById("subreport-modal-content").innerHTML =
            `<div style="color:red;">⚠️ Failed to fetch templates: ${err.message}</div>`;
        }
      },

      async loadSubreportFromHTML(htmlContent, name = "") {
        try {
          const { innerContent, styles, hasHeaderOrFooter } = this.extractSubreportHTML(htmlContent);

          // Update merge trait visibility
          try {
            const traits = this.model.get("traits");
            if (traits && typeof traits.find === "function") {
              const mt = traits.find(t => {
                try { return t.get("name") === "mergeHeaderFooter"; } catch (e) { return false; }
              });
              if (mt) {
                mt.set("visible", !!hasHeaderOrFooter);
                console.log(`🔎 Merge trait visibility set to ${!!hasHeaderOrFooter}`);
              }
            }
          } catch (e) {
            console.warn("⚠️ Couldn't update merge trait visibility:", e);
          }

          this.cachedSubreport = { innerContent, styles, templateName: name, hasHeaderOrFooter };
          this.injectStylesToCanvas(styles);
          
          // Show placeholder message
          this.showPlaceholder(name);
          
          console.log("✅ Subreport HTML loaded successfully:", name);
        } catch (err) {
          console.error("❌ Error processing HTML:", err);
          this.showErrorPlaceholder(err.message);
        }
      },

      showPlaceholder(templateName) {
        // Clear any existing components first
        this.model.components().reset();
        
        // Add a simple text placeholder
        this.model.components().add({
          type: 'text',
          content: `📄 Subreport loaded: ${templateName || 'Unknown'}<br><small style="color:#888;">Toggle "Show Data" to render content</small>`,
          style: {
            color: '#666',
            padding: '15px',
            'text-align': 'center',
            'background-color': '#e8f5e9',
            'border': '2px solid #4CAF50',
            'border-radius': '4px'
          },
          attributes: {
            'data-subreport-placeholder': 'true'
          }
        });
      },

      showInitialPlaceholder() {
        this.model.components().reset();
        this.model.components().add({
          type: 'text',
          content: '📄 Double-click to choose subreport',
          style: {
            color: '#999',
            padding: '15px',
            'text-align': 'center',
            'font-style': 'italic',
            'background-color': '#f5f5f5',
            'border': '2px dashed #ccc',
            'border-radius': '4px',
            'cursor': 'pointer',
            'min-height': '60px',
            'display': 'flex',
            'align-items': 'center',
            'justify-content': 'center'
          },
          attributes: {
            'data-subreport-placeholder': 'true'
          }
        });
      },

      showErrorPlaceholder(message) {
        this.model.components().reset();
        this.model.components().add({
          type: 'text',
          content: `⚠️ Failed to load: ${message}`,
          style: {
            color: 'red',
            padding: '10px'
          }
        });
      },

      clearPlaceholder() {
        this.model.components().reset();
      },

      toggleSubreportDisplay(showData) {
        console.log("🔄 Toggle subreport display:", showData);
        
        if (!showData) {
          // Hide: show placeholder
          const attrs = this.model.getAttributes();
          const templateName = attrs.templateName || attrs.filePath || "Unknown";
          this.showPlaceholder(templateName);
          return;
        }

        // Show: render components
        if (!this.cachedSubreport) {
          console.warn("⚠️ No cached subreport to display");
          return;
        }

        this.renderSubreportAsComponents();
      },

      toggleMergeHeaderFooter(merge) {
        console.log("🔄 Merge header/footer toggled:", merge);
        // Re-render if data is shown
        const showData = this.model.getAttributes().showData;
        if (showData === true || showData === "true") {
          this.renderSubreportAsComponents();
        }
      },

      renderSubreportAsComponents() {
        console.log("🎨 Rendering subreport as GrapeJS components...");
        
        const attrs = this.model.getAttributes();
        const merge = attrs.mergeHeaderFooter !== false && attrs.mergeHeaderFooter !== "false";
        
        // Clear existing content
        this.model.components().reset();

        // Process HTML content
        const processed = this.getProcessedInnerContent(this.cachedSubreport.innerContent);
        
        // Parse HTML and convert to components
        const parser = new DOMParser();
        const tempDoc = parser.parseFromString(processed, "text/html");
        const body = tempDoc.body;

        // Handle merge logic
        if (merge && this.cachedSubreport.hasHeaderOrFooter) {
          this.handleMergeMode(body);
        } else {
          this.handleNormalMode(body, merge);
        }
      },

      handleNormalMode(bodyElement, merge) {
        // If merge is false, extract only main-content-area
        let contentRoot = bodyElement;
        
        if (!merge) {
          const mainContent = bodyElement.querySelector(".main-content-area");
          if (mainContent) {
            contentRoot = mainContent;
            console.log("📌 Extracting only .main-content-area (merge disabled)");
          }
        }

        // Convert HTML elements to GrapeJS components
        this.convertHTMLToComponents(contentRoot, this.model);
      },

      handleMergeMode(bodyElement) {
        console.log("🔀 Merge mode: Checking if page is fresh...");
        
        const frameDoc = editor.Canvas.getFrameEl()?.contentDocument;
        if (!frameDoc) {
          console.warn("⚠️ No frame document found");
          this.handleNormalMode(bodyElement, true);
          return;
        }

        const subEl = this.el;
        const isInMainContent = !!subEl.closest(".main-content-area");
        const isInSectionContent = !!subEl.closest(".section-content");

        if (!isInMainContent && !isInSectionContent) {
          console.log("ℹ️ Subreport not in main content, using normal mode");
          this.handleNormalMode(bodyElement, true);
          return;
        }

        const pageContainer = subEl.closest(".page-container");
        if (!pageContainer) {
          console.log("⚠️ No page-container found");
          this.handleNormalMode(bodyElement, true);
          return;
        }

        // Check if page is fresh
        if (this.isPageFresh(pageContainer, subEl)) {
          console.log("✅ Fresh page detected! Merging into page sections...");
          this.performPageMerge(bodyElement, pageContainer);
          // Hide the subreport block after merge
          this.model.addStyle({ display: 'none' });
          this.model.set('subreport-merged', true);
        } else {
          console.log("ℹ️ Page not fresh, using normal mode");
          this.handleNormalMode(bodyElement, true);
        }
      },

      isPageFresh(pageContainer, subreportEl) {
        const sectionsToCheck = [
          ".page-content", ".header-wrapper", ".page-header-element",
          ".content-wrapper", ".main-content-area",
          ".footer-wrapper", ".page-footer-element"
        ];

        for (const selector of sectionsToCheck) {
          const section = pageContainer.querySelector(selector);
          if (section) {
            const clone = section.cloneNode(true);
            const subInClone = clone.querySelector(".subreport-block");
            if (subInClone) subInClone.remove();
            
            const childCount = clone.children.length;
            const hasContent = clone.textContent.trim().length > 0;
            
            if (childCount > 0 || hasContent) {
              console.log(`❌ Page not fresh: ${selector} has content`);
              return false;
            }
          }
        }
        
        return true;
      },

      performPageMerge(subreportBody, pageContainer) {
        console.log("🔀 Performing page-level merge...");
        
        // Find target sections in main page
        const headerTarget = pageContainer.querySelector(".page-header-element");
        const contentTarget = pageContainer.querySelector(".main-content-area");
        const footerTarget = pageContainer.querySelector(".page-footer-element");

        // Find source sections in subreport
        const headerSource = subreportBody.querySelector(".page-header-element");
        const contentSource = subreportBody.querySelector(".main-content-area");
        const footerSource = subreportBody.querySelector(".page-footer-element");

        // Find GrapeJS components for targets
        const pageModel = this.findPageModel(pageContainer);
        
        if (!pageModel) {
          console.warn("⚠️ Could not find page model");
          return;
        }

        // Merge header
        if (headerSource && headerTarget) {
          const headerModel = this.findComponentByEl(pageModel, headerTarget);
          if (headerModel) {
            console.log("📤 Merging header elements...");
            this.convertHTMLToComponents(headerSource, headerModel);
          }
        }

        // Merge content
        if (contentSource && contentTarget) {
          const contentModel = this.findComponentByEl(pageModel, contentTarget);
          if (contentModel) {
            console.log("📤 Merging content elements...");
            // Insert before subreport block
            const subreportModel = this.model;
            const subreportIndex = contentModel.components().indexOf(subreportModel);
            this.convertHTMLToComponents(contentSource, contentModel, subreportIndex);
          }
        }

        // Merge footer
        if (footerSource && footerTarget) {
          const footerModel = this.findComponentByEl(pageModel, footerTarget);
          if (footerModel) {
            console.log("📤 Merging footer elements...");
            this.convertHTMLToComponents(footerSource, footerModel);
          }
        }

        console.log("✅ Page merge completed!");
      },

      findPageModel(pageEl) {
        const wrapper = editor.DomComponents.getWrapper();
        return this.findComponentByEl(wrapper, pageEl);
      },

      findComponentByEl(parent, targetEl) {
        if (parent.getEl() === targetEl) return parent;
        
        const children = parent.components();
        for (let i = 0; i < children.length; i++) {
          const found = this.findComponentByEl(children.at(i), targetEl);
          if (found) return found;
        }
        
        return null;
      },

      convertHTMLToComponents(htmlElement, parentModel, insertIndex = -1) {
        const children = Array.from(htmlElement.children);
        
        children.forEach((child, idx) => {
          const componentDef = this.htmlElementToComponent(child);
          if (componentDef) {
            if (insertIndex >= 0) {
              parentModel.components().add(componentDef, { at: insertIndex + idx });
            } else {
              parentModel.components().add(componentDef);
            }
          }
        });
      },

      htmlElementToComponent(element) {
        // Convert HTML element to GrapeJS component definition
        const tagName = element.tagName.toLowerCase();
        const classes = Array.from(element.classList);
        const attributes = {};
        
        // Copy attributes
        Array.from(element.attributes).forEach(attr => {
          if (attr.name !== 'class' && attr.name !== 'style') {
            attributes[attr.name] = attr.value;
          }
        });

        // Extract inline styles
        const style = {};
        if (element.style.cssText) {
          element.style.cssText.split(';').forEach(rule => {
            const [prop, value] = rule.split(':').map(s => s.trim());
            if (prop && value) {
              style[prop] = value;
            }
          });
        }

        const componentDef = {
          tagName,
          classes,
          attributes,
          style,
        };

        // Handle different element types
        if (tagName === 'table') {
          componentDef.type = 'table';
        } else if (tagName === 'img') {
          componentDef.type = 'image';
          if (element.src) componentDef.attributes.src = element.src;
        } else if (tagName === 'a') {
          componentDef.type = 'link';
          if (element.href) componentDef.attributes.href = element.href;
        } else if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'div'].includes(tagName)) {
          componentDef.type = 'text';
          componentDef.content = element.innerHTML;
        }

        // Recursively convert children if not a text element
        if (element.children.length > 0 && !['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span'].includes(tagName)) {
          componentDef.components = Array.from(element.children).map(child => 
            this.htmlElementToComponent(child)
          ).filter(Boolean);
        } else if (!componentDef.content && element.textContent.trim()) {
          componentDef.content = element.innerHTML;
        }

        return componentDef;
      },

      extractSubreportHTML(htmlText) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");

        const styles = [];
        doc.querySelectorAll("style, link[rel='stylesheet']").forEach(tag => {
          styles.push(tag.outerHTML);
        });

        const bodyEl = doc.querySelector("body");
        let innerContent = bodyEl ? bodyEl.innerHTML.trim() : htmlText.trim();

        const hasHeaderOrFooter = !!doc.querySelector(".header-wrapper, .footer-wrapper");

        return { innerContent, styles, hasHeaderOrFooter };
      },

      injectStylesToCanvas(stylesArray) {
        const frameDoc = editor.Canvas.getFrameEl()?.contentDocument;
        if (!frameDoc) return console.warn("⚠️ Frame document not found");
        const head = frameDoc.querySelector("head");
        
        stylesArray.forEach((styleHtml, idx) => {
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = styleHtml;
          const styleNode = tempDiv.firstElementChild;
          
          if (styleNode) {
            if (styleNode.tagName === "STYLE") {
              const cssText = styleNode.textContent;
              const styleHash = btoa(cssText.substring(0, 100)).replace(/[^a-zA-Z0-9]/g, '');
              if (!frameDoc.querySelector(`style[data-subreport-hash="${styleHash}"]`)) {
                const newStyle = frameDoc.createElement("style");
                newStyle.textContent = cssText;
                newStyle.setAttribute("data-subreport-hash", styleHash);
                head.appendChild(newStyle);
                console.log(`✅ Style ${idx + 1} injected`);
              }
            } else if (styleNode.tagName === "LINK") {
              const href = styleNode.getAttribute("href");
              if (href && !frameDoc.querySelector(`link[href="${href}"]`)) {
                const newLink = frameDoc.createElement("link");
                newLink.rel = "stylesheet";
                newLink.href = href;
                head.appendChild(newLink);
                console.log(`✅ Stylesheet linked: ${href}`);
              }
            }
          }
        });
      },

      getProcessedInnerContent(innerHTML) {
        const parser = new DOMParser();
        const tempDoc = parser.parseFromString(`<div id="__tmp_wrapper__">${innerHTML}</div>`, "text/html");
        const wrapper = tempDoc.getElementById("__tmp_wrapper__");
        if (!wrapper) return innerHTML;

        // Unwrap page-container and page-content
        const unwrapTargets = wrapper.querySelectorAll(".page-container, .page-content");
        unwrapTargets.forEach(el => {
          const parent = el.parentNode;
          const frag = tempDoc.createDocumentFragment();
          while (el.firstChild) frag.appendChild(el.firstChild);
          parent.replaceChild(frag, el);
        });

        // Remove IDs from wrapper elements
        const idRemoveClasses = [
          "header-wrapper", "page-header-element", "content-wrapper",
          "main-content-area", "footer-wrapper", "page-footer-element"
        ];
        idRemoveClasses.forEach(cls => {
          wrapper.querySelectorAll(`.${cls}[id]`).forEach(el => el.removeAttribute("id"));
        });

        return wrapper.innerHTML;
      },
    },
  });

  editor.BlockManager.add("subreport", {
    label: "Subreport",
    category: "Reports",
    attributes: { class: "fa fa-copy" },
    content: { type: "subreport" },
  });

  console.log("✅ Subreport Plugin (Components Approach) loaded successfully.");
}