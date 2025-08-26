function customTableOfContents(editor) {
  const domc = editor.DomComponents;

  // ✅ Custom Heading component (H1-H3) - Fixed text height changes
  domc.addType('custom-heading', {
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
          ],
          changeProp: 1,
        },
      ],
        level: 'h1',
        styles: `
          h1.custom-heading { font-size: 32px; font-weight: bold; margin: 16px 0; }
          h2.custom-heading { font-size: 24px; font-weight: bold; margin: 14px 0; }
          h3.custom-heading { font-size: 18px; font-weight: bold; margin: 12px 0; }
        `,
        attributes: { class: 'custom-heading' },
      },
      init() {
        this.on('change:level', this.updateTag);
      },
      updateTag() {
        const newTag = this.get('level') || 'h1';
        const currentContent = this.view.el ? this.view.el.textContent : this.get('content');
        const cursorPosition = this.view.getCursorPosition ? this.view.getCursorPosition() : 0;
        
        // Store current content
        const preservedContent = currentContent || this.get('content') || 'New Heading';
        
        // Update the tag name and preserve content silently
        this.set({
          tagName: newTag,
          content: preservedContent
        }, { silent: true });
        
        // Update attributes
        this.addAttributes({ class: 'custom-heading' });
        
        // Force view update with preserved content and cursor position
        if (this.view.el) {
          const newEl = document.createElement(newTag);
          newEl.className = 'custom-heading';
          newEl.textContent = preservedContent;
          newEl.setAttribute('contenteditable', 'true');
          
          // Generate and preserve ID for TOC linking
          const existingId = this.view.el.id;
          if (existingId) {
            newEl.id = existingId;
          }
          
          // Remove old event listeners
          if (this.view.blurHandler) {
            this.view.el.removeEventListener('blur', this.view.blurHandler);
          }
          if (this.view.inputHandler) {
            this.view.el.removeEventListener('input', this.view.inputHandler);
          }
          
          this.view.el.parentNode.replaceChild(newEl, this.view.el);
          this.view.el = newEl;
          
          // Re-attach event listeners
          this.view.blurHandler = () => {
            this.set('content', this.view.el.textContent, { silent: true });
            editor.runCommand('generate-toc');
          };
          
          this.view.inputHandler = () => {
            this.set('content', this.view.el.textContent, { silent: true });
          };
          
          newEl.addEventListener('blur', this.view.blurHandler);
          newEl.addEventListener('input', this.view.inputHandler);
          
          // Restore cursor position
          setTimeout(() => {
            if (this.view.setCursorPosition) {
              this.view.setCursorPosition(cursorPosition);
            }
            newEl.focus();
          }, 10);
        }
        
        // Refresh TOC
        setTimeout(() => editor.runCommand('generate-toc'), 100);
      },
    },
    view: {
      onRender() {
        const el = this.el;
        const model = this.model;
        
        // Ensure correct tag name
        const currentTag = model.get('tagName') || 'h1';
        if (el.tagName.toLowerCase() !== currentTag) {
          const preservedContent = el.textContent || model.get('content') || 'New Heading';
          const cursorPosition = this.getCursorPosition();
          const existingId = el.id; // Preserve existing ID
          
          const newEl = document.createElement(currentTag);
          newEl.className = 'custom-heading';
          newEl.textContent = preservedContent;
          newEl.setAttribute('contenteditable', 'true');
          
          // Preserve ID if it exists
          if (existingId) {
            newEl.id = existingId;
          }
          
          if (el.parentNode) {
            el.parentNode.replaceChild(newEl, el);
          }
          this.el = newEl;
          
          // Restore cursor position
          this.setCursorPosition(cursorPosition);
        }
        
        this.el.setAttribute('contenteditable', 'true');
        
        // Remove existing event listeners to prevent duplicates
        this.el.removeEventListener('blur', this.blurHandler);
        this.el.removeEventListener('input', this.inputHandler);
        
        // Create bound event handlers
        this.blurHandler = () => {
          model.set('content', this.el.textContent, { silent: true });
          editor.runCommand('generate-toc');
        };
        
        this.inputHandler = () => {
          // Update model silently to prevent re-render
          model.set('content', this.el.textContent, { silent: true });
        };
        
        // Add event listeners
        this.el.addEventListener('blur', this.blurHandler);
        this.el.addEventListener('input', this.inputHandler);
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
        while (node = walker.nextNode()) {
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

  // ✅ Add Heading block
  editor.BlockManager.add('custom-heading', {
    label: 'Heading',
    category: 'Basic',
    content: { type: 'custom-heading' },
  });

  // ✅ TOC block type - Fixed bullet display issues
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
        attributes: { class: 'table-of-contents toc-container' },
        components: `<h2>Table of Contents</h2><ul></ul>`,
        styles: `
          .table-of-contents {
            padding: 15px;
            margin: 15px 0;
            font-family: Arial, sans-serif;
            border: 1px solid #ddd;
          }
          .table-of-contents h2 {
            margin-top: 0;
            margin-bottom: 15px;
            font-size: 18px;
            font-weight: bold;
          }
          
          /* Unordered list styles */
          .table-of-contents ul {
            margin: 0;
            padding: 0;
            list-style: none;
          }
          .table-of-contents ul li {
            font-size: 14px;
            margin: 6px 0;
            position: relative;
          }
          .table-of-contents ul li::before {
            content: "•";
            color: #333;
            font-size: 16px;
            position: absolute;
            left: 0;
            top: 0;
          }
          
          /* Ordered list styles with smart numbering */
          .table-of-contents ol {
            margin: 0;
            padding: 0;
            list-style: none;
          }
          .table-of-contents ol li {
            font-size: 14px;
            margin: 6px 0;
            position: relative;
          }
          .table-of-contents ol li .number {
            color: #333;
            font-weight: bold;
            position: absolute;
            left: 0;
            top: 0;
          }
          
          /* Common link styles - Make entire row clickable */
          .table-of-contents a {
            color: #333;
            text-decoration: none;
            display: flex;
            align-items: center;
            width: 100%;
            font-weight: normal;
            padding-left: 25px; /* Space for bullet/number */
          }
          .table-of-contents a:hover {
            color: #007cba;
            text-decoration: underline;
          }
          .table-of-contents .heading-text {
            flex-shrink: 0;
          }
          .table-of-contents .dots {
            flex-grow: 1;
            border-bottom: 1px dotted #999;
            margin-left: 4px; /* Minimal space after heading text */
            margin-right: 8px;
            height: 1px;
          }
          .table-of-contents .page-num {
            flex-shrink: 0;
            min-width: 30px;
            text-align: right;
            font-weight: bold;
            color: #666;
          }
          
          /* Border styles when want-border is enabled */
.table-of-contents.with-borders ul li {
  border-bottom: 1px solid #ddd;
  padding-bottom: 6px;
  margin-bottom: 6px;
}
.table-of-contents.with-borders ol li {
  border-bottom: 1px solid #ddd;
  padding-bottom: 6px;
  margin-bottom: 6px;
}
/* Remove border from last item */
.table-of-contents.with-borders ul li:last-child,
.table-of-contents.with-borders ol li:last-child {
  border-bottom: none;
  margin-bottom: 6px;
}
          /* Level indentation */
          .table-of-contents .level-1 a { padding-left: 25px; }
          .table-of-contents .level-2 a { padding-left: 45px; }
          .table-of-contents .level-3 a { padding-left: 65px; }
        `,
        'list-type': 'ul',
        'want-border': false,
      },
      init() {
        this.on('change:list-type', () => {
          setTimeout(() => editor.runCommand('generate-toc'), 100);
        });
        this.on('change:want-border', () => {
          const wantBorder = this.get('want-border');
          const tocContainer = this.view?.el;
          if (tocContainer) {
            if (wantBorder) {
              tocContainer.classList.add('with-borders');
            } else {
              tocContainer.classList.remove('with-borders');
            }
          }
        });
      },
    },
  });

  // ✅ Add TOC block
  editor.BlockManager.add('table-of-contents', {
    label: 'Table of Contents',
    category: 'Basic',
    content: { type: 'toc-block' },
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

  // ✅ Generate TOC command - Fixed ID generation for all heading levels
  editor.Commands.add('generate-toc', {
    run(editor) {
      const tocComp = editor.getWrapper().find('.toc-container')[0];
      if (!tocComp) return;

      const listType = tocComp.get('list-type') || 'ul';
      const doc = editor.Canvas.getDocument();
      const headings = doc.querySelectorAll('h1.custom-heading, h2.custom-heading, h3.custom-heading');
      const items = [];

      // Smart numbering system
      const counters = [0, 0, 0]; // H1, H2, H3 counters

      headings.forEach((el, i) => {
        const text = el.innerText.trim();
        if (!text) return;

        // Get heading level (1, 2, or 3)
        const level = parseInt(el.tagName.substring(1));
        
        // Generate unique ID - FIXED: Ensure all levels get proper IDs
        let id = el.id;
        if (!id || id === '') {
          id = generateUniqueId(text, level, i);
          el.setAttribute('id', id);
          console.log(`Generated ID for ${el.tagName}: ${id}`); // Debug log
        }

        // Ensure ID is always set properly
        if (el.getAttribute('id') !== id) {
          el.setAttribute('id', id);
        }

        // Update counters with smart hierarchy
        if (level === 1) {
          counters[0]++; // Increment H1
          counters[1] = 0; // Reset H2
          counters[2] = 0; // Reset H3
        } else if (level === 2) {
          counters[1]++; // Increment H2
          counters[2] = 0; // Reset H3
        } else if (level === 3) {
          counters[2]++; // Increment H3
        }

        // Generate smart numbering string
        let numberString = '';
        if (listType === 'ol') {
          if (level === 1) {
            numberString = `${counters[0]}.`;
          } else if (level === 2) {
            numberString = `${counters[0]}.${counters[1]}`;
          } else if (level === 3) {
            numberString = `${counters[0]}.${counters[1]}.${counters[2]}`;
          }
        }
        
        // Find page number
        const pageEl = el.closest('.page-container');
        const pageNum = pageEl ? parseInt(pageEl.getAttribute('data-page-index')) + 1 : i + 1;

        // Create list item with proper level class and smart numbering
        // FIXED: Ensure href is properly formatted for all levels
        // For unordered list (ul):
        if (listType === 'ul') {
          items.push(`
            <li class="level-${level}">
              <a href="#${id}" data-target="${id}">
                <span class="heading-text">${text}</span>
                <span class="dots"></span>
                <span class="page-num">${pageNum}</span>
              </a>
            </li>
          `);
        } else {
          // For ordered list (ol):
          items.push(`
            <li class="level-${level}">
              <span class="number">${numberString}</span>
              <a href="#${id}" data-target="${id}">
                <span class="heading-text">${text}</span>
                <span class="dots"></span>
                <span class="page-num">${pageNum}</span>
              </a>
            </li>
          `);
        }

        console.log(`TOC item created for ${el.tagName} (${level}): href="#${id}"`); // Debug log
      });

      // Generate HTML content
      const htmlContent = items.length > 0 ? items.join('') : '<li>No headings found</li>';

      // Find existing list component and update it
      const existingList = tocComp.components().find(c => 
        c.get('tagName') === 'ul' || c.get('tagName') === 'ol'
      );

      if (existingList) {
        // Remove existing list
        existingList.remove();
      }

      // Add new list with correct type
      const newListHtml = `<${listType}>${htmlContent}</${listType}>`;
      const titleComp = tocComp.components().find(c => c.get('tagName') === 'h2');
      
      if (titleComp) {
        // Add after title
        tocComp.components().add(newListHtml, { 
          parse: true,
          at: tocComp.components().indexOf(titleComp) + 1
        });
      } else {
        // Add to end
        tocComp.components().add(newListHtml, { parse: true });
      }

      // Force re-render
      tocComp.view.render();

      console.log(`TOC generated with ${items.length} items`); // Debug log
    },
  });

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
          document.querySelectorAll('h1.custom-heading, h2.custom-heading, h3.custom-heading').forEach((heading, index) => {
            console.log('Heading', index, heading.tagName, 'ID:', heading.id, 'Text:', heading.textContent);
          });
        });
      </script>
    `;
    body += scrollScript;
    return { head, body };
  });
}