function customTableOfContents(editor) {
  editor.on("load", () => {
    const iframe = editor.Canvas.getFrameEl();
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

    const styleEl = iframeDoc.createElement("style");
    styleEl.innerHTML = `
      .table-of-contents {
        border: 1px dashed #555;
        padding: 10px;
        margin: 10px 0;
        background: #f8f8f8;
        font-family: sans-serif;
      }

      .table-of-contents h2 {
        margin-top: 0;
        font-size: 18px;
      }

      .table-of-contents ul {
        margin: 0;
        padding-left: 20px;
      }

      .table-of-contents li {
        margin-bottom: 6px;
        font-size: 14px;
      }

      .table-of-contents a {
        color: #0645ad;
        text-decoration: none;
      }

      .table-of-contents a:hover {
        text-decoration: underline;
      }
    `;
    iframeDoc.head.appendChild(styleEl);
  });

  // Add block
  editor.BlockManager.add("table-of-contents", {
    label: "Table of Contents",
    category: "Basic",
    content: `
      <div class="table-of-contents">
        <h2>Table of Contents</h2>
        <ul></ul>
      </div>
    `,
  });

  // Add TOC title trait to headings
  const typesToPatch = ["text", "default"];
  typesToPatch.forEach((type) => {
    const typeDef = editor.DomComponents.getType(type);
    if (typeDef) {
      const model = typeDef.model;
      const origInit = model.prototype.init;

      model.prototype.init = function () {
        origInit && origInit.apply(this, arguments);
        this.addTrait({
          type: "text",
          name: "data-toc-title",
          label: "TOC Title",
          placeholder: "e.g. Chapter 1",
        });
      };
    }
  });

  // ✅ Set TOC innerHTML into GrapesJS component + iframe DOM
  function setTOCContent(component, htmlContent) {
    const iframe = editor.Canvas.getFrameEl();
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;

    // 1. Update component content model
    component.components(htmlContent, { parse: true });

    // 2. Update raw DOM inside iframe
    const compEl = iframeDoc.querySelector(`#${component.getId()}`);
    if (compEl) {
      const ul = compEl.querySelector("ul");
      if (ul) {
        ul.innerHTML = htmlContent;
      }
    }

  }

  // Generate TOC command
  editor.Commands.add("generate-toc", {
    run(editor) {
      const comps = editor.getWrapper().find(".table-of-contents");
      if (!comps.length) {
        console.warn("⚠️ No TOC component found.");
        return;
      }

      const tocComp = comps[0];
      const doc = editor.Canvas.getDocument();
      const targets = doc.querySelectorAll("[data-toc-title]");
      const items = [];

      targets.forEach((el, i) => {
        const title = el.getAttribute("data-toc-title");
        if (!title) return;

        let id = el.id || `toc-section-${i + 1}`;
        el.setAttribute("id", id);

        items.push(`<li><a href="#${id}">${title}</a></li>`);
      });

      const htmlContent = items.join("");
      setTOCContent(tocComp, htmlContent);

      console.log(`✅ TOC generated with ${items.length} items.`);
    },
  });

  // Panel button
  editor.Panels.addButton("options", {
    id: "generate-toc",
    className: "fa fa-list",
    command: "generate-toc",
    attributes: { title: "Generate Table of Contents" },
  });

  // Smooth scroll script for export
  editor.on("export:html", ({ head, body }) => {
    const scrollScript = `
      <script>
        document.addEventListener('DOMContentLoaded', function () {
          document.querySelectorAll('.table-of-contents a').forEach(link => {
            link.addEventListener('click', function (e) {
              e.preventDefault();
              const target = document.getElementById(this.getAttribute('href').substring(1));
              if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
              }
            });
          });
        });
      </script>
    `;
    body += scrollScript;
    return { head, body };
  });
}

