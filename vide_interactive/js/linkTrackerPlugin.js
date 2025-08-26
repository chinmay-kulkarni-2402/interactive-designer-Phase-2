function linkTrackerPlugin(editor) {
  editor.on('load', () => {
    console.log("🔗 Link Tracker started...");

    const cssc = editor.CssComposer;

    const scanLinks = () => {
      const wrapper = editor.getWrapper();
      const allLinks = wrapper.find('a');

      allLinks.forEach(linkComp => {
        const href = linkComp.getAttributes().href || '';

        // Ensure every link has a unique ID
        let linkId = linkComp.getId();
        if (!linkId) {
          linkId = `link-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          linkComp.addAttributes({ id: linkId });
        }

        const selector = `#${linkId}`;

        // Store link text for print replacement
        const linkText = linkComp.get('content') || '';
        linkComp.addAttributes({ 'data-text': linkText });

        if (href.startsWith('#')) {
          const pageContainer = linkComp.closest('.page-container');
          if (!pageContainer) return;

          const targetId = href.slice(1);
          const target = pageContainer.find(`#${targetId}`);

          if (target && target.length > 0) {
            // ✅ Valid self-link → disable pointer/cursor in editor
            cssc.setRule(selector, {
              'pointer-events': 'none',
              cursor: 'default',
            });

            // ✅ Print/PDF: replace link with plain text using ::after
            const printSelector = `@media print { ${selector} }`;
            cssc.setRule(printSelector, {
              'pointer-events': 'none',
              cursor: 'default',
              color: 'inherit',
              'text-decoration': 'none',
              'position': 'relative',
            });
            const printAfterSelector = `@media print { ${selector}::after }`;
            cssc.setRule(printAfterSelector, {
              content: `attr(data-text)`,
            });

          } else {
            // ❌ Broken anchor → clear styles
            cssc.setRule(selector, { 'pointer-events': '', cursor: '' });
            const printSelector = `@media print { ${selector} }`;
            cssc.setRule(printSelector, { 'pointer-events': '', cursor: '' });
            const printAfterSelector = `@media print { ${selector}::after }`;
            cssc.setRule(printAfterSelector, { content: '' });
          }
        } else {
          // ❌ External/normal link → clear styles
          cssc.setRule(selector, { 'pointer-events': '', cursor: '' });
          const printSelector = `@media print { ${selector} }`;
          cssc.setRule(printSelector, { 'pointer-events': '', cursor: '' });
          const printAfterSelector = `@media print { ${selector}::after }`;
          cssc.setRule(printAfterSelector, { content: '' });
        }
      });
    };

    // Run once
    scanLinks();

    // Track changes
    editor.on('component:add', scanLinks);
    editor.on('component:update', scanLinks);
    editor.on('component:remove', scanLinks);
  });
}
