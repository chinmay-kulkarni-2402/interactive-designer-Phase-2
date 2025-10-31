function subreportPlugin(editor) {
  console.log("📦 Initializing Subreport Plugin...");

  const apiUrl = "http://192.168.0.221:9998/api/getTemplate";

  editor.DomComponents.addType("subreport", {
    model: {
      defaults: {
        tagName: "div",
        classes: ["subreport-block"],
        attributes: { class: "subreport-container" },
        droppable: false,
        draggable: true,
        resizable: true,
        copyable: true,
        editable: false,
        content: "📄 Double-click to open or set subreport",
        traits: [
          { type: "checkbox", label: "Show Data", name: "showData", value: false },
          { type: "checkbox", label: "Share Parameters", name: "shareParams", value: true },
          { type: "checkbox", label: "Share Page Number", name: "sharePageNum", value: false },
          // Merge trait — hide by default; we'll explicitly set visibility in init()
          { type: "checkbox", label: "Merge Header/Footer", name: "mergeHeaderFooter", value: false, visible: false },
        ],
      },

      init() {
        console.log("🚀 Subreport component initialized");

        // Ensure Merge trait is hidden initially to avoid it showing before a template is loaded.
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
      events: { dblclick: "onDoubleClick" },

      render() {
        const attrs = this.model.getAttributes();
        const filePath = attrs.filePath;
        const showData = attrs.showData === true || attrs.showData === "true";

        if (!filePath) {
          this.el.innerHTML = `<div style="color:gray;">📄 Double-click to choose subreport</div>`;
        } else if (showData && this.cachedSubreport) {
          // respect mergeHeaderFooter setting
          const merge = attrs.mergeHeaderFooter !== false && attrs.mergeHeaderFooter !== "false";
          // Always unwrap page-container / page-content before rendering; merge controls whether we include all pages or just main-content-area
          const processed = this.getProcessedInnerContent(this.cachedSubreport.innerContent);
          this.el.innerHTML = this.getRenderedSubreportHTML(processed, merge);
        } else {
          const templateName = attrs.templateName || filePath || "Unknown Template";
          this.el.innerHTML = `<div style="color:gray;">📄 Data loaded with ${templateName}</div>`;
        }

        return this;
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

                  this.render();

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

      // Load template HTML and detect whether header/footer are present.
      async loadSubreportFromHTML(htmlContent, name = "") {
        try {
          const { innerContent, styles, hasHeaderOrFooter } = this.extractSubreportHTML(htmlContent);

          // Show/hide Merge trait based on presence of header-wrapper or footer-wrapper
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
          console.log("✅ Subreport HTML loaded successfully:", name);
        } catch (err) {
          console.error("❌ Error processing HTML:", err);
          this.el.innerHTML = `<div style="color:red;">⚠️ Failed to load: ${err.message}</div>`;
        }
      },

      toggleSubreportDisplay(showData) {
        this.render();
      },

      toggleMergeHeaderFooter(merge) {
        console.log("🔄 Updating merge header/footer view:", merge);
        this.render();
      },

      // Parse incoming HTML, collect styles, detect header/footer presence, and return body innerHTML
      extractSubreportHTML(htmlText) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");

        const styles = [];
        doc.querySelectorAll("style, link[rel='stylesheet']").forEach(tag => {
          styles.push(tag.outerHTML);
        });

        const bodyEl = doc.querySelector("body");
        let innerContent = bodyEl ? bodyEl.innerHTML.trim() : htmlText.trim();

        // Detect header/footer wrappers
        const hasHeaderOrFooter = !!doc.querySelector(".header-wrapper, .footer-wrapper");

        return { innerContent, styles, hasHeaderOrFooter };
      },

      injectStylesToCanvas(stylesArray) {
        const frameDoc = editor.Canvas.getFrameEl()?.contentDocument;
        if (!frameDoc) return console.warn("⚠️ Frame document not found");
        const head = frameDoc.querySelector("head");
        stylesArray.forEach(styleHtml =>
          head.insertAdjacentHTML("beforeend", styleHtml)
        );
      },

// Unwrap only the wrapper divs with classes 'page-container' or 'page-content'
// Unwrap only the wrapper divs with classes 'page-container' or 'page-content'
// Unwrap only the wrapper divs with classes 'page-container' or 'page-content'
getProcessedInnerContent(innerHTML) {
  const parser = new DOMParser();
  const tempDoc = parser.parseFromString(`<div id="__tmp_wrapper__">${innerHTML}</div>`, "text/html");
  const wrapper = tempDoc.getElementById("__tmp_wrapper__");
  if (!wrapper) return innerHTML;

  // 1️⃣ Unwrap page-container and page-content
  const unwrapTargets = wrapper.querySelectorAll(".page-container, .page-content");
  unwrapTargets.forEach(el => {
    const parent = el.parentNode;
    const frag = tempDoc.createDocumentFragment();
    while (el.firstChild) frag.appendChild(el.firstChild);
    parent.replaceChild(frag, el);
  });

  // 2️⃣ Remove IDs from wrapper elements
  const idRemoveClasses = [
    "header-wrapper",
    "page-header-element",
    "content-wrapper",
    "main-content-area",
    "footer-wrapper",
    "page-footer-element",
  ];
  idRemoveClasses.forEach(cls => {
    wrapper.querySelectorAll(`.${cls}[id]`).forEach(el => el.removeAttribute("id"));
  });

  const cleanedHTML = wrapper.innerHTML;
  return cleanedHTML;
},

toggleSubreportDisplay(showData) {
  if (showData) {
    // When showing data, check if we should merge
    this.performMergeIfNeeded();
  }
  this.render();
},

performMergeIfNeeded() {
  try {
    const frameDoc = editor.Canvas.getFrameEl()?.contentDocument;
    if (!frameDoc) return;

    const subEl = this.el; // The subreport-block element itself
    if (!subEl) return;

    // Check if subreport is in main-content-area or section-content
    const isInMainContent = !!subEl.closest(".main-content-area");
    const isInSectionContent = !!subEl.closest(".section-content");

    console.log(`🔍 Subreport location - Main: ${isInMainContent}, Section: ${isInSectionContent}`);

    if (isInMainContent || isInSectionContent) {
      const pageContainer = subEl.closest(".page-container");
      
      if (!pageContainer) {
        console.log("⚠️ No page-container found");
        return;
      }

      console.log("✅ Found page-container, checking if fresh...");

      // Check if page-container is fresh (no elements in key sections except subreport)
      const sectionsToCheck = [
        { selector: ".page-content", name: "page-content" },
        { selector: ".header-wrapper", name: "header-wrapper" },
        { selector: ".page-header-element", name: "page-header-element" },
        { selector: ".content-wrapper", name: "content-wrapper" },
        { selector: ".main-content-area", name: "main-content-area" },
        { selector: ".footer-wrapper", name: "footer-wrapper" },
        { selector: ".page-footer-element", name: "page-footer-element" },
      ];

      let isFreshPage = true;
      for (const { selector, name } of sectionsToCheck) {
        const section = pageContainer.querySelector(selector);
        if (section) {
          // Clone and remove subreport to check actual content
          const clone = section.cloneNode(true);
          const subInClone = clone.querySelector(".subreport-block");
          if (subInClone) subInClone.remove();
          
          // Count remaining children
          const childCount = clone.children.length;
          const hasContent = clone.textContent.trim().length > 0;
          
          if (childCount > 0 || hasContent) {
            isFreshPage = false;
            console.log(`❌ Page not fresh: ${name} has ${childCount} children or content`);
            break;
          }
        }
      }

      if (isFreshPage) {
        console.log("🆕 Fresh page detected! Checking merge option...");
        
        // Get merge option from attributes
        const attrs = this.model.getAttributes();
        const shouldMerge = attrs.mergeHeaderFooter !== false && attrs.mergeHeaderFooter !== "false";
        
        if (!shouldMerge) {
          console.log("ℹ️ Merge option is disabled, skipping merge");
          return;
        }

        if (!this.cachedSubreport) {
          console.log("⚠️ No cached subreport data");
          return;
        }

        console.log("✅ Merge enabled! Merging subreport template elements into main report...");

        // Parse the subreport template HTML
        const tempDiv = frameDoc.createElement("div");
        const processed = this.getProcessedInnerContent(this.cachedSubreport.innerContent);
        tempDiv.innerHTML = processed;

        // 📋 Copy all styles from cached subreport
        const headEl = frameDoc.querySelector("head");
        if (this.cachedSubreport.styles && Array.isArray(this.cachedSubreport.styles)) {
          this.cachedSubreport.styles.forEach((styleHtml, idx) => {
            const tempStyleDiv = frameDoc.createElement("div");
            tempStyleDiv.innerHTML = styleHtml;
            const styleNode = tempStyleDiv.firstElementChild;
            
            if (styleNode) {
              if (styleNode.tagName === "STYLE") {
                const cssText = styleNode.textContent;
                const styleHash = btoa(cssText.substring(0, 100)).replace(/[^a-zA-Z0-9]/g, '');
                if (!frameDoc.querySelector(`style[data-subreport-hash="${styleHash}"]`)) {
                  const newStyle = frameDoc.createElement("style");
                  newStyle.textContent = cssText;
                  newStyle.setAttribute("data-subreport-hash", styleHash);
                  headEl.appendChild(newStyle);
                  console.log(`✅ Style ${idx + 1} copied to head`);
                }
              } else if (styleNode.tagName === "LINK") {
                const href = styleNode.getAttribute("href");
                if (href && !frameDoc.querySelector(`link[href="${href}"]`)) {
                  const newLink = frameDoc.createElement("link");
                  newLink.rel = "stylesheet";
                  newLink.href = href;
                  headEl.appendChild(newLink);
                  console.log(`✅ Stylesheet linked: ${href}`);
                }
              }
            }
          });
        }

        // 🔀 Merge template elements INTO main report sections
        const mergeMapping = [
          { templateClass: ".page-header-element", mainClass: ".page-header-element" },
          { templateClass: ".main-content-area", mainClass: ".main-content-area" },
          { templateClass: ".page-footer-element", mainClass: ".page-footer-element" },
        ];

        mergeMapping.forEach(({ templateClass, mainClass }) => {
          const templateSection = tempDiv.querySelector(templateClass);
          const mainSection = pageContainer.querySelector(mainClass);
          
          if (templateSection && mainSection) {
            console.log(`🔄 Merging ${templateClass} into main report ${mainClass}`);
            
            // Get all child nodes from template section
            const templateChildren = Array.from(templateSection.children);
            
            // If merging into main-content-area, insert BEFORE the subreport block
            if (mainClass === ".main-content-area" && mainSection.contains(subEl)) {
              templateChildren.forEach(child => {
                const clonedChild = child.cloneNode(true);
                mainSection.insertBefore(clonedChild, subEl);
              });
            } else {
              // For header and footer, just append
              templateChildren.forEach(child => {
                const clonedChild = child.cloneNode(true);
                mainSection.appendChild(clonedChild);
              });
            }
            
            console.log(`✅ Merged ${templateChildren.length} elements from ${templateClass} to ${mainClass}`);
          } else {
            if (!templateSection) console.log(`ℹ️ No ${templateClass} in subreport template`);
            if (!mainSection) console.log(`⚠️ No ${mainClass} in main page-container`);
          }
        });

        // Hide the subreport block itself after merging
        subEl.style.display = "none";
        subEl.setAttribute("data-merged", "true");

        console.log("✅ Fresh page merge completed - subreport elements merged into main report!");
      } else {
        console.log("ℹ️ Page-container is not fresh, skipping merge");
      }
    }
  } catch (e) {
    console.error("❌ Error merging subreport template:", e);
    console.error(e.stack);
  }
},

// Update render method to check if already merged
render() {
  const attrs = this.model.getAttributes();
  const filePath = attrs.filePath;
  const showData = attrs.showData === true || attrs.showData === "true";

  // Check if already merged
  if (this.el.getAttribute("data-merged") === "true") {
    console.log("ℹ️ Subreport already merged, keeping hidden");
    return this;
  }

  if (!filePath) {
    this.el.innerHTML = `<div style="color:gray;">📄 Double-click to choose subreport</div>`;
  } else if (showData && this.cachedSubreport) {
    const merge = attrs.mergeHeaderFooter !== false && attrs.mergeHeaderFooter !== "false";
    const processed = this.getProcessedInnerContent(this.cachedSubreport.innerContent);
    this.el.innerHTML = this.getRenderedSubreportHTML(processed, merge);
  } else {
    const templateName = attrs.templateName || filePath || "Unknown Template";
    this.el.innerHTML = `<div style="color:gray;">📄 Data loaded with ${templateName}</div>`;
  }

  return this;
},
      // Decide what part to render: if merge === false, show only .main-content-area if present; else full content
      getRenderedSubreportHTML(innerHTML, merge) {
        if (!merge) {
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = innerHTML;
          const main = tempDiv.querySelector(".main-content-area");
          return main ? main.outerHTML : innerHTML;
        }
        return innerHTML;
      },
    },
  });

  editor.BlockManager.add("subreport", {
    label: "Subreport",
    category: "Reports",
    attributes: { class: "fa fa-copy" },
    content: { type: "subreport" },
  });

  console.log("✅ Subreport Plugin with Merge Header/Footer improved behavior loaded successfully.");
}
