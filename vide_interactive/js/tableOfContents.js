function customTableOfContents(editor) {
  const domc = editor.DomComponents;

  // ✅ Custom Heading component (H1-H7) - Final Version with multi-change fix
  domc.addType('custom-heading', {
    // Recognize existing headings as custom-heading
    isComponent(el) {
      if (el.tagName && /^H[1-7]$/.test(el.tagName) && el.classList.contains('custom-heading')) {
        return { type: 'custom-heading' };
      }
    },

    model: {
      defaults: {
        tagName: 'h1',
        name: 'Heading',
        content: 'New Heading',
        editable: true,
        droppable: false,
        traits: [
          {
            type: 'select',
            name: 'level',
            label: 'Heading Level',
            options: [
              { id: 'h1', name: 'Header 1' },
              { id: 'h2', name: 'Header 2' },
              { id: 'h3', name: 'Header 3' },
              { id: 'h4', name: 'Header 4' },
              { id: 'h5', name: 'Header 5' },
              { id: 'h6', name: 'Header 6' },
              { id: 'h7', name: 'Header 7' },
            ],
            changeProp: 1,
          },
        ],
        level: 'h1',
        styles: `
        h1.custom-heading { font-size: 32px; font-weight: bold; margin: 16px 0; }
        h2.custom-heading { font-size: 24px; font-weight: bold; margin: 14px 0; }
        h3.custom-heading { font-size: 18px; font-weight: bold; margin: 12px 0; }
        h4.custom-heading { font-size: 16px; font-weight: bold; margin: 10px 0; }
        h5.custom-heading { font-size: 14px; font-weight: bold; margin: 8px 0; }
        h6.custom-heading { font-size: 12px; font-weight: bold; margin: 6px 0; }
        h7.custom-heading { font-size: 11px; font-weight: bold; margin: 4px 0; }
      `,
        attributes: { class: 'custom-heading' },
      },

      init() {
        this.on('change:level', this.updateTag);
      },

      updateTag() {
        const newTag = this.get('level') || 'h1';
        const preservedContent = this.view.el
          ? this.view.el.textContent
          : this.get('content') || 'New Heading';

        const existingId = this.view.el?.id;

        // ✅ Replace DOM element with new heading tag
        if (this.view.el) {
          const newEl = document.createElement(newTag);
          newEl.className = 'custom-heading';
          newEl.textContent = preservedContent;
          newEl.setAttribute('contenteditable', 'true');
          if (existingId) newEl.id = existingId;

          this.view.el.parentNode.replaceChild(newEl, this.view.el);
          this.view.el = newEl;

          // reattach listeners
          this.view.attachListeners(newEl);
        }

        // ✅ Sync content, but don't reset tagName in model
        this.set('content', preservedContent, { silent: true });

        // Refresh TOC
        setTimeout(() => editor.runCommand('generate-toc'), 100);
      },
    },

    view: {
      setupMutationObserver() {
        if (this.observer) {
          this.observer.disconnect();
        }

        this.observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'childList' || mutation.type === 'characterData') {
              clearTimeout(this.mutationTimeout);
              this.mutationTimeout = setTimeout(() => {
                this.model.set('content', this.el.textContent, { silent: true });
                editor.runCommand('generate-toc');
              }, 10); // Very fast update for mutations
            }
          });
        });

        this.observer.observe(this.el, {
          childList: true,
          subtree: true,
          characterData: true
        });
      },
      onRender() {
        const model = this.model;
        const tag = this.el.tagName.toLowerCase();

        // ✅ Keep trait dropdown in sync with actual DOM tag
        model.set('level', tag, { silent: true });

        this.el.setAttribute('contenteditable', 'true');

        // Attach event listeners
        this.attachListeners(this.el);
        this.setupMutationObserver();

      },

      attachListeners(el) {
        const model = this.model;

        // Clean old listeners
        el.removeEventListener('blur', this.blurHandler);
        el.removeEventListener('input', this.inputHandler);

        this.blurHandler = () => {
          model.set('content', this.el.textContent, { silent: true });
          // Immediate TOC update without delay
          editor.runCommand('generate-toc');
        };

        this.inputHandler = () => {
          model.set('content', this.el.textContent, { silent: true });
          // Add instant update on input as well for JSON data changes
          clearTimeout(this.updateTimeout);
          this.updateTimeout = setTimeout(() => {
            editor.runCommand('generate-toc');
          }, 50); // Reduced delay for faster response
        };

        el.addEventListener('blur', this.blurHandler);
        el.addEventListener('input', this.inputHandler);
      },

      getCursorPosition() {
        if (!this.el || !window.getSelection) return 0;
        const selection = window.getSelection();
        if (selection.rangeCount === 0) return 0;
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(this.el);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        return preCaretRange.toString().length;
      },

      setCursorPosition(position) {
        if (!this.el || !window.getSelection) return;
        const selection = window.getSelection();
        const range = document.createRange();

        let currentPos = 0;
        const walker = document.createTreeWalker(
          this.el,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );

        let node;
        while ((node = walker.nextNode())) {
          const nodeLength = node.textContent.length;
          if (currentPos + nodeLength >= position) {
            range.setStart(node, position - currentPos);
            range.setEnd(node, position - currentPos);
            break;
          }
          currentPos += nodeLength;
        }

        selection.removeAllRanges();
        selection.addRange(range);
      },
    },
  });

  // ✅ Add Heading block with fa-heading icon
  editor.BlockManager.add('custom-heading', {
    label: 'Heading',
    category: 'Basic',
    content: { type: 'custom-heading' },
    media: '<i class="fa fa-heading"></i>',
  });


  // ✅ TOC Block Type
  domc.addType('toc-block', {
    model: {
      defaults: {
        name: 'Table of Contents',
        tagName: 'div',
        draggable: true,
        droppable: false,
        stylable: 1,
        traits: [
          {
            type: 'select', name: 'list-type', label: 'List Type', options: [
              { id: 'ol', name: 'Ordered' }, { id: 'ul', name: 'Unordered' }], changeProp: 1
          },
          { type: 'checkbox', name: 'want-border', label: 'Show Borders', changeProp: 1 },
          {
            type: 'select', name: 'toc-style', label: 'TOC Style', options: [
              { id: 'classic', name: 'Classic (Word-like)' },
              { id: 'modern', name: 'Modern Minimal' },
              { id: 'boxed', name: 'Boxed with Shading' }], changeProp: 1
          },
          {
            type: 'select', name: 'tab-leader', label: 'Tab Leader', options: [
              { id: 'dots', name: 'Dotted (....)' }, { id: 'dashes', name: 'Dashed (----)' },
              { id: 'solid', name: 'Solid (____)' }, { id: 'none', name: 'None' }], changeProp: 1
          },
          // ✅ Per-level spacing
          ...[1, 2, 3, 4, 5, 6, 7].map(l => ({
            type: 'number', name: `spacing-h${l}`, label: `Spacing H${l} (px)`, min: 0, max: 100, step: 2, changeProp: 1
          })),
          { type: 'checkbox', name: 'clickable', label: 'Clickable Headings', changeProp: 1 },
          { type: 'checkbox', name: 'show-page-num', label: 'Show Page Numbers', changeProp: 1 },
          { type: 'color', name: 'text-color', label: 'Text Color', changeProp: 1 },
        ],

        attributes: { class: 'table-of-contents toc-container' },
        components: `<h2>Table of Contents</h2><ul></ul>`,
styles: `
        .table-of-contents { padding: 15px; margin: 15px 0; font-family: Arial, sans-serif; border: 1px solid #ddd; }
        .table-of-contents h2 { margin-top: 0; margin-bottom: 15px; font-size: 18px; font-weight: bold; }
        .table-of-contents ul, .table-of-contents ol { margin: 0; padding: 0; list-style: none; }
        .table-of-contents li { font-size: 14px; padding: 4px 8px; display: flex; align-items: center; justify-content: space-between; }
        .table-of-contents a, .table-of-contents span.no-link { color: #333; text-decoration: none; display: flex; flex: 1; align-items: center; }
        .table-of-contents a:hover { color: #007cba; text-decoration: underline; }
        .table-of-contents .heading-text { flex-shrink: 0; margin-right: 6px; }
        .table-of-contents .dots { flex-grow: 1; border-bottom: 1px dotted #999; margin: 0 6px; height: 1px; }
        .table-of-contents .page-num { flex-shrink: 0; min-width: 30px; font-weight: bold; color: #666; }
        .table-of-contents.with-borders li { border-bottom: 1px solid #333; background: #fafafa; }
        .table-of-contents.with-borders li:nth-child(even) { background: #fff; }
        .table-of-contents.toc-style-classic .heading-text { font-family: "Times New Roman", serif; font-size: 14px; }
        .table-of-contents.toc-style-modern .heading-text { font-family: Arial, sans-serif; font-size: 15px; font-weight: 500; }
        .table-of-contents.toc-style-boxed { background: #f9f9f9; border: 2px solid #bbb; padding: 12px; border-radius: 4px; }
        .table-of-contents.toc-tab-dots .dots { border-bottom: 1px dotted #000; }
        .table-of-contents.toc-tab-dashes .dots { border-bottom: 1px dashed #000; }
        .table-of-contents.toc-tab-solid .dots { border-bottom: 1px solid #000; }
        .table-of-contents.toc-tab-none .dots { border: none; }
        .table-of-contents.toc-align-right .page-num { text-align: right; }
        .table-of-contents.toc-align-left .page-num { text-align: left; }
        .table-of-contents.toc-align-center .page-num { text-align: center; }
        
        /* ✅ Custom color support for all elements including tab leaders and TOC title */
        .table-of-contents.custom-text-color h2,
        .table-of-contents.custom-text-color a,
        .table-of-contents.custom-text-color span.no-link,
        .table-of-contents.custom-text-color .heading-text,
        .table-of-contents.custom-text-color .page-num,
        .table-of-contents.custom-text-color .number { color: var(--toc-text-color) !important; }
        
        /* ✅ Tab leader colors (dots, dashes, solid lines) */
        .table-of-contents.custom-text-color.toc-tab-dots .dots { border-bottom-color: var(--toc-text-color) !important; }
        .table-of-contents.custom-text-color.toc-tab-dashes .dots { border-bottom-color: var(--toc-text-color) !important; }
        .table-of-contents.custom-text-color.toc-tab-solid .dots { border-bottom-color: var(--toc-text-color) !important; }
        
        /* ✅ Hover state with custom color */
        .table-of-contents.custom-text-color a:hover { 
          opacity: 0.8; 
          color: var(--toc-text-color) !important; 
        }
        
        /* ✅ Print/PDF support - ensure colors are preserved */
        @media print {
          .table-of-contents.custom-text-color h2,
          .table-of-contents.custom-text-color a,
          .table-of-contents.custom-text-color span.no-link,
          .table-of-contents.custom-text-color .heading-text,
          .table-of-contents.custom-text-color .page-num,
          .table-of-contents.custom-text-color .number { 
            color: var(--toc-text-color) !important; 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .table-of-contents.custom-text-color.toc-tab-dots .dots { 
            border-bottom-color: var(--toc-text-color) !important; 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .table-of-contents.custom-text-color.toc-tab-dashes .dots { 
            border-bottom-color: var(--toc-text-color) !important; 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .table-of-contents.custom-text-color.toc-tab-solid .dots { 
            border-bottom-color: var(--toc-text-color) !important; 
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `,
        'list-type': 'ul',
        'want-border': false,
        'toc-style': 'classic',
        'text-color': '#000',
        'levels': 7,
        'tab-leader': 'dots',
        'page-align': 'right',
        'clickable': true,
        'show-page-num': true,
        ...Object.fromEntries([1, 2, 3, 4, 5, 6, 7].map(l => [`spacing-h${l}`, 4]))
      },

      init() {
        const refresh = () => setTimeout(() => editor.runCommand('generate-toc'), 100);
        this.on('change', refresh);
      },
    }
  });

  // ✅ Add TOC block with fa-list icon
  editor.BlockManager.add('table-of-contents', {
    label: 'Table of Contents',
    category: 'Basic',
    content: { type: 'toc-block' },
    media: '<i class="fa fa-list"></i>', // Font Awesome list icon
  });

  // ✅ Generate unique ID helper function
  function generateUniqueId(text, level, index) {
    // Create a base ID from the text content
    const baseId = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .substring(0, 50); // Limit length

    // Add level and index to ensure uniqueness
    return `${baseId}-h${level}-${index + 1}`;
  }

  // ✅ Advanced TOC Generator with per-level spacing  
// ✅ Advanced TOC Generator with Export-Compatible CSS
editor.Commands.add('generate-toc', {
  run(editor) {
    const tocComp = editor.getWrapper().find('.toc-container')[0];
    if (!tocComp) return;

    const listType = tocComp.get('list-type') || 'ul';
    const maxLevel = parseInt(tocComp.get('levels') || 7);
    const clickable = tocComp.get('clickable');
    const showPageNum = tocComp.get('show-page-num');
    const textColor = tocComp.get('text-color') || '#000';

    const doc = editor.Canvas.getDocument();
    const headings = doc.querySelectorAll(
      'h1.custom-heading, h2.custom-heading, h3.custom-heading, h4.custom-heading, h5.custom-heading, h6.custom-heading, h7.custom-heading'
    );

    const items = [];
    const counters = [0, 0, 0, 0, 0, 0, 0];

    headings.forEach((el, i) => {
      const text = el.innerText.trim();
      if (!text) return;

      const level = parseInt(el.tagName.substring(1));
      if (level > maxLevel) return;

      let id = el.id;
      if (!id) {
        id = `heading-${level}-${i}-${Date.now()}`;
        el.setAttribute('id', id);
      }

      counters[level - 1]++;
      for (let j = level; j < counters.length; j++) counters[j] = 0;

      let numberString = '';
      if (listType === 'ol') {
        numberString = counters.slice(0, level).filter(n => n > 0).join('.') + '.';
      }

      const pageEl = el.closest('.page-container');
      const pageNum = pageEl ? parseInt(pageEl.getAttribute('data-page-index')) + 1 : i + 1;

      const linkStart = clickable ? `<a href="#${id}" data-target="${id}">` : `<span class="no-link">`;
      const linkEnd = clickable ? `</a>` : `</span>`;
      const pageSpan = showPageNum ? `<span class="page-num">${pageNum}</span>` : '';

      items.push(`
        <li class="level-${level}" data-level="${level}">
          ${listType === 'ol' ? `<span class="number">${numberString}</span>` : ''}
          ${linkStart}
            <span class="heading-text">${text}</span>
            <span class="dots"></span>
            ${pageSpan}
          ${linkEnd}
        </li>
      `);
    });

    const htmlContent = items.length > 0 ? items.join('') : '<li>No headings found</li>';

    const existingList = tocComp.components().find(c => c.get('tagName') === 'ul' || c.get('tagName') === 'ol');
    if (existingList) existingList.remove();

    const newListHtml = `<${listType}>${htmlContent}</${listType}>`;
    const titleComp = tocComp.components().find(c => c.get('tagName') === 'h2');

    if (titleComp) {
      tocComp.components().add(newListHtml, { parse: true, at: tocComp.components().indexOf(titleComp) + 1 });
    } else {
      tocComp.components().add(newListHtml, { parse: true });
    }

    // ✅ Apply spacing
    const tocEl = tocComp.view.el;
    tocEl.querySelectorAll('li').forEach(li => {
      const lvl = parseInt(li.getAttribute('data-level')) || 1;
      const spacing = tocComp.get(`spacing-h${lvl}`) || 4;
      li.style.margin = `${spacing}px 0`;
    });

    // ✅ Reapply style classes
    const classes = tocEl.classList;
    classes.toggle('with-borders', tocComp.get('want-border'));

    classes.remove('toc-style-classic', 'toc-style-modern', 'toc-style-boxed');
    classes.add(`toc-style-${tocComp.get('toc-style')}`);

    classes.remove('toc-tab-dots', 'toc-tab-dashes', 'toc-tab-solid', 'toc-tab-none');
    classes.add(`toc-tab-${tocComp.get('tab-leader')}`);

    classes.remove('toc-align-right', 'toc-align-left', 'toc-align-center');
    classes.add(`toc-align-${tocComp.get('page-align')}`);

    // ✅ Generate or get unique TOC container ID
    let tocId = tocEl.id;
    if (!tocId) {
      tocId = `toc-container-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      tocEl.id = tocId;
    }

    // ✅ Apply colors and styles - BOTH canvas and CSS Manager
    this.updateTocColors(editor, tocId, textColor, tocComp);

    console.log(`TOC generated with ${items.length} items, ID: ${tocId}`);
  },

  // ✅ Helper function to update TOC colors - Export Compatible
  updateTocColors(editor, tocId, textColor, tocComp) {
    const doc = editor.Canvas.getDocument();
    
    // ✅ Step 1: Update Canvas Document Styles (for immediate visual feedback)
    let canvasStyleElement = doc.getElementById('toc-color-styles');
    if (!canvasStyleElement) {
      canvasStyleElement = doc.createElement('style');
      canvasStyleElement.id = 'toc-color-styles';
      doc.head.appendChild(canvasStyleElement);
    }

    // ✅ Step 2: Get all TOC settings for comprehensive styling
    const wantBorder = tocComp.get('want-border');
    const tocStyle = tocComp.get('toc-style') || 'classic';
    const tabLeader = tocComp.get('tab-leader') || 'dots';
    const pageAlign = tocComp.get('page-align') || 'right';

    // ✅ Generate comprehensive CSS rules
    let canvasCssRules = '';
    let exportCssRules = '';

    if (textColor && textColor !== '#000' && textColor !== '#000000') {
      const cssTemplate = `
        /* TOC Container with ID ${tocId} - Custom Colors */
        #${tocId} h2 { color: ${textColor} !important; }
        #${tocId} a, #${tocId} span.no-link, #${tocId} .heading-text, #${tocId} .page-num, #${tocId} .number { color: ${textColor} !important; }
        #${tocId}.toc-tab-dots .dots { border-bottom-color: ${textColor} !important; }
        #${tocId}.toc-tab-dashes .dots { border-bottom-color: ${textColor} !important; }
        #${tocId}.toc-tab-solid .dots { border-bottom-color: ${textColor} !important; }
        #${tocId} a:hover { color: ${textColor} !important; opacity: 0.8; }
        #${tocId}.with-borders li { border-bottom-color: ${textColor} !important; }
        
        /* Print/Export Support */
        @media print {
          #${tocId} h2, #${tocId} a, #${tocId} span.no-link, #${tocId} .heading-text, #${tocId} .page-num, #${tocId} .number { 
            color: ${textColor} !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #${tocId}.toc-tab-dots .dots, #${tocId}.toc-tab-dashes .dots, #${tocId}.toc-tab-solid .dots { 
            border-bottom-color: ${textColor} !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          #${tocId}.with-borders li { 
            border-bottom-color: ${textColor} !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `;

      canvasCssRules = cssTemplate;
      exportCssRules = cssTemplate;
    }

    // ✅ Apply to Canvas Document
    canvasStyleElement.textContent = canvasCssRules;

    // ✅ Step 3: Add to GrapesJS CSS Manager for export compatibility
    try {
      const cssManager = editor.Css;
      
      // Remove existing rules for this TOC ID
      const existingRules = cssManager.getAll().filter(rule => {
        const selector = rule.get('selectors');
        return selector && selector.toString().includes(tocId);
      });
      
      existingRules.forEach(rule => cssManager.remove(rule));

      // Add new rules if we have custom colors
      if (exportCssRules) {
        // ✅ Parse and add individual rules to CSS Manager
        const rulesToAdd = [
          { selector: `#${tocId} h2`, style: { color: textColor } },
          { selector: `#${tocId} a, #${tocId} span.no-link, #${tocId} .heading-text, #${tocId} .page-num, #${tocId} .number`, style: { color: textColor } },
          { selector: `#${tocId}.toc-tab-dots .dots`, style: { 'border-bottom-color': textColor } },
          { selector: `#${tocId}.toc-tab-dashes .dots`, style: { 'border-bottom-color': textColor } },
          { selector: `#${tocId}.toc-tab-solid .dots`, style: { 'border-bottom-color': textColor } },
          { selector: `#${tocId} a:hover`, style: { color: textColor, opacity: '0.8' } },
          { selector: `#${tocId}.with-borders li`, style: { 'border-bottom-color': textColor } }
        ];

        rulesToAdd.forEach(ruleData => {
          try {
            cssManager.addRules(`${ruleData.selector} { ${Object.entries(ruleData.style).map(([prop, val]) => `${prop}: ${val} !important`).join('; ')} }`);
          } catch (e) {
            console.warn('Failed to add CSS rule:', ruleData.selector, e);
          }
        });

        // ✅ Add print media queries for export
        const printRules = [
          `@media print { #${tocId} h2, #${tocId} a, #${tocId} span.no-link, #${tocId} .heading-text, #${tocId} .page-num, #${tocId} .number { color: ${textColor} !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }`,
          `@media print { #${tocId}.toc-tab-dots .dots, #${tocId}.toc-tab-dashes .dots, #${tocId}.toc-tab-solid .dots { border-bottom-color: ${textColor} !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }`,
          `@media print { #${tocId}.with-borders li { border-bottom-color: ${textColor} !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } }`
        ];

        printRules.forEach(rule => {
          try {
            cssManager.addRules(rule);
          } catch (e) {
            console.warn('Failed to add print CSS rule:', rule, e);
          }
        });
      }

      console.log(`TOC styles added to CSS Manager for export compatibility. Color: ${textColor}`);
    } catch (e) {
      console.warn('CSS Manager update failed:', e.message);
    }

    // ✅ Step 4: Force immediate visual update in canvas
    const tocEl = doc.getElementById(tocId);
    if (tocEl && textColor !== '#000') {
      // Apply inline styles as fallback for immediate visual feedback
      tocEl.querySelectorAll('h2, a, span.no-link, .heading-text, .page-num, .number').forEach(el => {
        el.style.color = textColor;
      });
      
      tocEl.querySelectorAll('.dots').forEach(el => {
        el.style.borderBottomColor = textColor;
      });
    }

    console.log(`TOC colors updated for ID: ${tocId}, Color: ${textColor}, Export ready: ${!!exportCssRules}`);
  }
});



  // ✅ Generate TOC command - Fixed ID generation for all heading levels
  // editor.Commands.add('generate-toc', {
  //   run(editor) {
  //     const tocComp = editor.getWrapper().find('.toc-container')[0];
  //     if (!tocComp) return;

  //     const listType = tocComp.get('list-type') || 'ul';
  //     const doc = editor.Canvas.getDocument();
  //     const headings = doc.querySelectorAll('h1.custom-heading, h2.custom-heading, h3.custom-heading, h4.custom-heading, h5.custom-heading, h6.custom-heading, h7.custom-heading');
  //     const items = [];

  //     // Smart numbering system
  //     const counters = [0, 0, 0, 0, 0, 0, 0]; // H1, H2, H3, H4, H5, H6, H7 counters

  //     headings.forEach((el, i) => { 

  //       const text = el.innerText.trim();
  //       if (!text) return;

  //       // Get heading level (1, 2, 3, 4, 5, 6, 7)
  //       const level = parseInt(el.tagName.substring(1));
  //         // Skip headings beyond selected level
  //       const maxLevel = parseInt(tocComp.get('levels') || 7);
  //       if (level > maxLevel) return;
  //       // Generate unique ID - FIXED: Ensure all levels get proper IDs
  //       let id = el.id;
  //       if (!id || id === '') {
  //         id = generateUniqueId(text, level, i);
  //         el.setAttribute('id', id);
  //         console.log(`Generated ID for ${el.tagName}: ${id}`); // Debug log
  //       }

  //       // Ensure ID is always set properly
  //       if (el.getAttribute('id') !== id) {
  //         el.setAttribute('id', id);
  //       }

  //       // Update counters with smart hierarchy
  //       if (level === 1) {
  //         counters[0]++; // Increment H1
  //         counters[1] = 0; // Reset H2
  //         counters[2] = 0; // Reset H3
  //         counters[3] = 0; // Reset H4
  //         counters[4] = 0; // Reset H5
  //         counters[5] = 0; // Reset H6
  //         counters[6] = 0; // Reset H7
  //       } else if (level === 2) {
  //         counters[1]++; // Increment H2
  //         counters[2] = 0; // Reset H3
  //         counters[3] = 0; // Reset H4
  //         counters[4] = 0; // Reset H5
  //         counters[5] = 0; // Reset H6
  //         counters[6] = 0; // Reset H7
  //       } else if (level === 3) {
  //         counters[2]++; // Increment H3
  //         counters[3] = 0; // Reset H4
  //         counters[4] = 0; // Reset H5
  //         counters[5] = 0; // Reset H6
  //         counters[6] = 0; // Reset H7
  //       } else if (level === 4) {
  //         counters[3]++; // Increment H4
  //         counters[4] = 0; // Reset H5
  //         counters[5] = 0; // Reset H6
  //         counters[6] = 0; // Reset H7
  //       } else if (level === 5) {
  //         counters[4]++; // Increment H5
  //         counters[5] = 0; // Reset H6
  //         counters[6] = 0; // Reset H7
  //       } else if (level === 6) {
  //         counters[5]++; // Increment H6
  //         counters[6] = 0; // Reset H7
  //       } else if (level === 7) {
  //         counters[6]++; // Increment H7
  //       }


  //       // Generate smart numbering string
  //       let numberString = '';
  //       if (listType === 'ol') {
  //         if (level === 1) {
  //           numberString = `${counters[0]}.`;
  //         } else if (level === 2) {
  //           numberString = `${counters[0]}.${counters[1]}`;
  //         } else if (level === 3) {
  //           numberString = `${counters[0]}.${counters[1]}.${counters[2]}`;
  //         } else if (level === 4) {
  //           numberString = `${counters[0]}.${counters[1]}.${counters[2]}.${counters[3]}`;
  //         } else if (level === 5) {
  //           numberString = `${counters[0]}.${counters[1]}.${counters[2]}.${counters[3]}.${counters[4]}`;
  //         } else if (level === 6) {
  //           numberString = `${counters[0]}.${counters[1]}.${counters[2]}.${counters[3]}.${counters[4]}.${counters[5]}`;
  //         } else if (level === 7) {
  //           numberString = `${counters[0]}.${counters[1]}.${counters[2]}.${counters[3]}.${counters[4]}.${counters[5]}.${counters[6]}`;
  //         }
  //       }


  //       // Find page number
  //       const pageEl = el.closest('.page-container');
  //       const pageNum = pageEl ? parseInt(pageEl.getAttribute('data-page-index')) + 1 : i + 1;

  //       // Create list item with proper level class and smart numbering
  //       // FIXED: Ensure href is properly formatted for all levels
  //       // For unordered list (ul):
  //       if (listType === 'ul') {
  //         items.push(`
  //           <li class="level-${level}">
  //             <a href="#${id}" data-target="${id}">
  //               <span class="heading-text">${text}</span>
  //               <span class="dots"></span>
  //               <span class="page-num">${pageNum}</span>
  //             </a>
  //           </li>
  //         `);
  //       } else {
  //         // For ordered list (ol):
  //         items.push(`
  //           <li class="level-${level}">
  //             <span class="number">${numberString}</span>
  //             <a href="#${id}" data-target="${id}">
  //               <span class="heading-text">${text}</span>
  //               <span class="dots"></span>
  //               <span class="page-num">${pageNum}</span>
  //             </a>
  //           </li>
  //         `);
  //       }

  //       console.log(`TOC item created for ${el.tagName} (${level}): href="#${id}"`); // Debug log
  //     });

  //     // Generate HTML content
  //     const htmlContent = items.length > 0 ? items.join('') : '<li>No headings found</li>';

  //     // Find existing list component and update it
  //     const existingList = tocComp.components().find(c => 
  //       c.get('tagName') === 'ul' || c.get('tagName') === 'ol'
  //     );

  //     if (existingList) {
  //       // Remove existing list
  //       existingList.remove();
  //     }

  //     // Add new list with correct type
  //     const newListHtml = `<${listType}>${htmlContent}</${listType}>`;
  //     const titleComp = tocComp.components().find(c => c.get('tagName') === 'h2');

  //     if (titleComp) {
  //       // Add after title
  //       tocComp.components().add(newListHtml, { 
  //         parse: true,
  //         at: tocComp.components().indexOf(titleComp) + 1
  //       });
  //     } else {
  //       // Add to end
  //       tocComp.components().add(newListHtml, { parse: true });
  //     }

  //     // Force re-render and maintain border state
  //     tocComp.view.render();

  //     // Restore border state if it was enabled
  //     const wantBorder = tocComp.get('want-border');
  //     if (wantBorder) {
  //       setTimeout(() => {
  //         const tocContainer = tocComp.view?.el;
  //         if (tocContainer && !tocContainer.classList.contains('with-borders')) {
  //           tocContainer.classList.add('with-borders');
  //         }
  //       }, 50);
  //     }

  //     console.log(`TOC generated with ${items.length} items`); // Debug log
  //   },
  // });

  // ✅ Auto-update TOC on heading changes
  editor.on('component:add', comp => {
    if (comp.get('type') === 'custom-heading') {
      setTimeout(() => editor.runCommand('generate-toc'), 200);

      // Listen for content changes
      comp.on('change:content', () => {
        setTimeout(() => editor.runCommand('generate-toc'), 100);
      });

      // Listen for level changes
      comp.on('change:level', () => {
        setTimeout(() => editor.runCommand('generate-toc'), 100);
      });
    }
  });

  editor.on('component:remove', comp => {
    if (comp.get('type') === 'custom-heading') {
      setTimeout(() => editor.runCommand('generate-toc'), 100);
    }
  });

  // ✅ Enhanced smooth scroll on export with better ID handling
  editor.on('export:html', ({ head, body }) => {
    const scrollScript = `
      <script>
        document.addEventListener('DOMContentLoaded', function () {
          console.log('TOC scroll handler loaded');
          
          document.querySelectorAll('.table-of-contents a').forEach((link, index) => {
            console.log('Setting up TOC link', index, 'href:', link.getAttribute('href'));
            
            link.addEventListener('click', function (e) {
              e.preventDefault();
              const targetId = this.getAttribute('href').substring(1);
              const target = document.getElementById(targetId);
              
              console.log('TOC link clicked:', targetId, 'Target found:', !!target);
              
              if (target) {
                target.scrollIntoView({ 
                  behavior: 'smooth',
                  block: 'start' 
                });
                
                // Add visual feedback
                target.style.backgroundColor = '#ffffcc';
                setTimeout(() => {
                  target.style.backgroundColor = '';
                }, 2000);
              } else {
                console.warn('Target element not found for ID:', targetId);
              }
            });
          });
          
          // Debug: Log all heading IDs
          document.querySelectorAll('h1.custom-heading, h2.custom-heading, h3.custom-heading, h4.custom-heading, h5.custom-heading, h6.custom-heading, h7.custom-heading').forEach((heading, index) => {
            console.log('Heading', index, heading.tagName, 'ID:', heading.id, 'Text:', heading.textContent);
          });
        });
      </script>
    `;
    body += scrollScript;
    return { head, body };
  });
}