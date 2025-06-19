// pageManager.js

function registerPageBreakComponent(editor) {
  const domc = editor.DomComponents;

  domc.addType('page-break', {
    isComponent: el => el.classList?.contains('page-break'),
    model: {
      defaults: {
        name: 'Page Break',
        tagName: 'div',
        droppable: false,
        draggable: true,
        editable: false,
        selectable: true,
        highlightable: true,
        stylable: false,
        copyable: true,
        attributes: { class: 'page-break' },
        components: `<span class="page-break-label">--- Page Break ---</span>`,
      }
    },
    view: {
      init() {
        const label = this.el.querySelector('.page-break-label');
        if (label) {
          label.style.color = '#999';
          label.style.textAlign = 'center';
          label.style.fontStyle = 'italic';
        }
      }
    }
  });
}
