function loadCustomTextboxComponent(editor) {
  const domc = editor.DomComponents;
  const defaultType = domc.getType('default');
  const defaultModel = defaultType.model;
  const defaultView = defaultType.view;

  domc.addType('custom-textbox', {
    model: {
      defaults: {
        tagName: 'div',
        droppable: false,
        editable: true,
        stylable: true,
        attributes: {},
        traits: [
          {
            name: 'name',
            label: 'Name',
            type: 'text',
            changeProp: 1,
          },
          {
            name: 'id',
            label: 'ID',
            type: 'text',
            changeProp: 1,
          },
          {
            name: 'link',
            label: 'Link to (Target ID)',
            type: 'text',
            placeholder: 'Enter ID of target element',
            changeProp: 1,
          },
        ],
        components: [
          {
            tagName: 'a',
            classes: ['rte-link'],
            attributes: {
              href: '#',
              style: 'text-decoration: underline; color: blue;',
            },
            content: 'Link Text (edit me)',
          },
        ],

        script: function () {
          const el = this;
          const linkId = el.getAttribute('link');
          let selfId = el.getAttribute('id');

          // Auto-generate ID if missing
          if (!selfId) {
            selfId = 'textbox-' + Math.random().toString(36).substr(2, 9);
            el.setAttribute('id', selfId);
          }

          const linkEl = el.querySelector('.rte-link');
          if (!linkEl) return;

          // Clear previous styles and handlers
          linkEl.style.pointerEvents = 'auto';
          linkEl.style.color = 'blue';
          linkEl.style.textDecoration = 'underline';
          linkEl.removeAttribute('disabled');
          linkEl.onclick = null;

          if (linkId) {
            const targetEl = document.getElementById(linkId);

            if (targetEl) {
              const currentPage = el.closest('[data-page-id]');
              const targetPage = targetEl.closest('[data-page-id]');

              const currentPageId = currentPage?.getAttribute('data-page-id');
              const targetPageId = targetPage?.getAttribute('data-page-id');

              if (currentPageId && targetPageId && currentPageId === targetPageId) {
                // SAME page: Disable link
                linkEl.style.pointerEvents = 'none';
                linkEl.style.color = 'gray';
                linkEl.style.textDecoration = 'none';
                linkEl.innerText = linkEl.innerText.replace(/ \(current\)/, '') + ' (current)';
              } else {
                // DIFFERENT page: Scroll on click
                linkEl.onclick = (e) => {
                  e.preventDefault();
                  const target = document.getElementById(linkId);
                  if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  } else {
                    alert('Target not found');
                  }
                };
              }
            } else {
              // No target found
              linkEl.style.pointerEvents = 'none';
              linkEl.style.color = 'red';
              linkEl.title = 'Invalid target ID';
            }
          } else {
            // No link provided
            linkEl.style.pointerEvents = 'none';
            linkEl.style.color = 'gray';
            linkEl.style.textDecoration = 'none';
          }
        },
      },

      init() {
        this.on('change:attributes:link change:attributes:id', () => {
          this.trigger('change:script');
        });

        // Auto-generate ID on init if not present
        this.once('change', () => {
          const id = this.getAttributes().id;
          if (!id) {
            const newId = 'textbox-' + Math.random().toString(36).substr(2, 9);
            this.addAttributes({ id: newId });
          }
        });
      },
    },

    view: defaultView.extend({
      onRender() {
        const model = this.model;
        const comps = model.get('components');

        // Ensure anchor element is present
        if (!comps.length || !comps.models.find(c => c.classes?.includes('rte-link'))) {
          model.components([
            {
              tagName: 'a',
              classes: ['rte-link'],
              attributes: {
                href: '#',
                style: 'text-decoration: underline; color: blue;',
              },
              content: model.get('attributes')?.name || 'Link Text',
            },
          ]);
        }
      }
    })
  });

  editor.BlockManager.add('custom-textbox', {
  label: 'Custom Textbox',
  content: {
    type: 'custom-textbox'
  },
  category: 'Basic'
});

}
