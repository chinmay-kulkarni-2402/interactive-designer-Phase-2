function customTableOfContents(editor) {
  const domc = editor.DomComponents;

  let isTOCButtonAdded = false;

  // ✅ Check if a component type is eligible for TOC title trait
  function isEligibleForTOC(comp) {
    const type = comp.get('type');
    const eligibleTypes = [
      'text', 'textnode', 'link', 'paragraph',
      'list', 'heading', 'quote', 'link-block', 'formatted-rich-text',
    ];
    return eligibleTypes.includes(type);
  }

  // ✅ Utility: Recursively get all components
  function getAllComponents(component) {
    let all = [component];
    component.components().forEach(child => {
      all = all.concat(getAllComponents(child));
    });
    return all;
  }

  // ✅ Utility: Set inner list content of TOC
  function setTOCContent(component, htmlContent) {
    const listComp = component.components().find(c =>
      ['ul', 'ol'].includes(c.get('tagName'))
    );
    if (listComp) {
      listComp.components(htmlContent, { parse: true });
    }
  }

  // ✅ Define TOC block type
  domc.addType('toc-block', {
    model: {
      defaults: {
        name: 'Table of Contents',
        tagName: 'div',
        draggable: true,
        droppable: false,
        traits: [
          {
            type: 'select',
            name: 'list-type',
            label: 'List Type',
            options: [
              { id: 'ul', name: 'Unordered' },
              { id: 'ol', name: 'Ordered' },
            ],
            changeProp: 1,
          },
        ],
        attributes: { class: 'table-of-contents' },
        components: `
          <h2>Table of Contents</h2>
          <ul></ul>
        `,
        styles: `
          .table-of-contents {
            padding: 10px;
            margin: 10px 0;
            font-family: sans-serif;
          }

          .table-of-contents h2 {
            margin-top: 0;
            font-size: 18px;
          }

          .table-of-contents ul,
          .table-of-contents ol {
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
        `,
        'list-type': 'ul',
      },

      init() {
        this.on('change:list-type', () => this.updateListType());
      },

      updateListType() {
        const listType = this.get('list-type');
        const comps = this.components();
        const oldList = comps.find(comp => ['ul', 'ol'].includes(comp.get('tagName')));
        if (oldList) {
          const newList = { ...oldList.toJSON(), tagName: listType };
          comps.remove(oldList);
          comps.add(newList);
        }
      },
    },
  });

  // ✅ Add TOC block to BlockManager
  editor.BlockManager.add('table-of-contents', {
    label: 'Table of Contents',
    category: 'Basic',
    content: { type: 'toc-block' },
  });

  // ✅ Enhance eligible components when TOC is added
  editor.on('component:add', (model) => {
    if (!model || typeof model.get !== 'function') return;

    if (model.get('type') === 'toc-block') {
      const existingTOCs = editor.getWrapper().find('.table-of-contents');

      if (existingTOCs.length > 1) {
        alert('⚠️ Only one Table of Contents block is allowed.');
        model.remove(); // Remove duplicate TOC
        return;
      }

      // ✅ Add trait to eligible components only once
      const allComponents = getAllComponents(editor.getWrapper());
      allComponents.forEach(comp => {
        if (
          typeof comp.addTrait === 'function' &&
          isEligibleForTOC(comp) &&
          !comp.getTraits().some(t => t.name === 'data-toc-title')
        ) {
          comp.addTrait({
            type: 'text',
            name: 'data-toc-title',
            label: 'TOC Title',
            placeholder: 'e.g. Chapter 1',
          });
        }
      });

      // ✅ Add button to panel only once
      if (!isTOCButtonAdded) {
        editor.Panels.addButton('options', {
          id: 'generate-toc',
          className: 'fa fa-list',
          command: 'generate-toc',
          attributes: { title: 'Generate Table of Contents' },
        });
        isTOCButtonAdded = true;
      }
    }
  });

  // ✅ Dynamically apply trait to eligible components during init
  const allTypes = Object.keys(domc.getTypes());
  allTypes.forEach((type) => {
    const typeDef = domc.getType(type);
    if (!typeDef || !typeDef.model) return;

    const model = typeDef.model;
    const origInit = model.prototype.init;

    model.prototype.init = function () {
      origInit && origInit.apply(this, arguments);

      const hasTOC = !!editor.getWrapper().find('.table-of-contents').length;

      if (
        hasTOC &&
        isEligibleForTOC(this) &&
        typeof this.addTrait === 'function' &&
        !this.getTraits().some(t => t.name === 'data-toc-title')
      ) {
        this.addTrait({
          type: 'text',
          name: 'data-toc-title',
          label: 'TOC Title',
          placeholder: 'e.g. Chapter 1',
        });
      }
    };
  });

  // ✅ Generate TOC content from elements with data-toc-title
  editor.Commands.add('generate-toc', {
    run(editor) {
      const comps = editor.getWrapper().find('.table-of-contents');
      if (!comps.length) {
        console.warn('⚠️ No TOC component found.');
        return;
      }

      const tocComp = comps[0];
      const listType = tocComp.get('list-type') || 'ul';

      const doc = editor.Canvas.getDocument();
      const targets = doc.querySelectorAll('[data-toc-title]');
      const items = [];

      targets.forEach((el, i) => {
        const title = el.getAttribute('data-toc-title');
        if (!title) return;

        let id = el.id || `toc-section-${i + 1}`;
        el.setAttribute('id', id);

        items.push(`<li><a href="#${id}">${title}</a></li>`);
      });

      const htmlContent = `<${listType}>${items.join('')}</${listType}>`;
      setTOCContent(tocComp, htmlContent);

      console.log(`✅ TOC generated with ${items.length} items.`);
    },
  });

  // ✅ Add smooth scroll script on export
  editor.on('export:html', ({ head, body }) => {
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
