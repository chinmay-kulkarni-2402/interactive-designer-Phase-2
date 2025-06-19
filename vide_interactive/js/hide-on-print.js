// grapesjs-hide-on-print.js

function grapesjsHideOnPrint(editor, opts = {}) {
  const TRAIT_NAME = opts.traitName || 'hideOnPrint';
  const CLASS_NAME = opts.className || 'hide-on-print';

  const applyTraitToComponent = (component) => {
    const traits = component.get('traits');

    const alreadyHasTrait = traits.some(tr => tr.get('name') === TRAIT_NAME);
    if (!alreadyHasTrait) {
      component.addTrait({
        type: 'checkbox',
        label: opts.label || 'Hide on print',
        name: TRAIT_NAME,
        changeProp: 1,
      });
    }

    if (!component._hasHideOnPrintHandler) {
      component.on(`change:${TRAIT_NAME}`, () => {
        const shouldHide = component.get(TRAIT_NAME);
        const classes = component.get('classes');
        const existingClass = classes.find(cls => cls.get('name') === CLASS_NAME);

        if (shouldHide && !existingClass) {
          classes.add({ name: CLASS_NAME });
        } else if (!shouldHide && existingClass) {
          classes.remove(existingClass);
        }
      });

      component._hasHideOnPrintHandler = true;
    }

    // Recurse through nested components
    component.get('components').forEach(child => applyTraitToComponent(child));
  };

  editor.on('load', () => {
    const wrapper = editor.getWrapper();
    applyTraitToComponent(wrapper);

    // Inject print CSS
    const style = `
      <style>
        @media print {
          .${CLASS_NAME} {
            display: none !important;
          }
        }
      </style>
    `;
    editor.addComponents(style);
  });

  // Apply to all newly added components
  editor.on('component:add', component => {
    applyTraitToComponent(component);
  });
}
