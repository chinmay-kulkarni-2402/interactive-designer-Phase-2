function loadBackButtonComponent(editor) {
  const domc = editor.DomComponents;

  domc.addType('back-button', {
    model: {
      defaults: {
        tagName: 'button',
        draggable: true,
        droppable: false,
        attributes: { class: 'back-button' },
        content: 'Back',
        traits: [
          {
            type: 'text',
            name: 'buttonName',
            label: 'Button Name',
            changeProp: 1,
          },
          {
            type: 'number',
            name: 'navigateTo',
            label: 'Navigate to (Slide #)',
            placeholder: 'e.g., 2',
            changeProp: 1,
          },
        ],
        stylable: [
          'width', 'height', 'padding', 'margin',
          'font-family', 'font-size', 'color', 'background-color',
          'border', 'border-radius', 'box-shadow',
          'text-align', 'text-decoration', 'font-weight',
          'display', 'justify-content', 'align-items'
        ],
        editable: true,
        script: function () {
          const el = this;
          const targetSlide = el.getAttribute('navigate-to-slide');
          console.log('Back button script initialized, target slide:', targetSlide);
          
          el.addEventListener('click', (event) => {
            console.log('Back button clicked, target slide:', targetSlide);
            event.preventDefault();
            
            if (targetSlide) {
              // Convert to 0-based index (slide numbers are 1-based for users)
              const slideIndex = parseInt(targetSlide) - 1;
              console.log('Calculated slide index:', slideIndex);
              
              // Dispatch custom event that the slideshow can listen to
              const navigateEvent = new CustomEvent('navigate-to-slide', {
                detail: { 
                  slideNumber: parseInt(targetSlide),
                  slideIndex: slideIndex
                },
                bubbles: true
              });
              
              console.log('Dispatching navigate event:', navigateEvent.detail);
              window.dispatchEvent(navigateEvent);
              
              // Also try direct function call as fallback
              if (typeof window.jumpToSlide === 'function') {
                console.log('Direct function call to jumpToSlide');
                window.jumpToSlide(slideIndex);
              } else {
                console.log('jumpToSlide function not available');
              }
            } else {
              console.log('No target slide specified');
            }
          });
        }
      },

      init() {
        this.on('change:buttonName', () => {
          this.components(this.get('buttonName'));
        });

        this.on('change:navigateTo', () => {
          const val = this.get('navigateTo');
          this.addAttributes({ 'navigate-to-slide': val });
        });
      },
    },

    view: {
      events: {
        dblclick: 'enableEditing',
        blur: 'saveEditing',
        keydown: 'onKeyDown',
      },

      enableEditing() {
        const el = this.el;
        el.setAttribute('contenteditable', true);
        el.focus();

        const sel = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(el);
        sel.removeAllRanges();
        sel.addRange(range);
      },

      saveEditing() {
        const el = this.el;
        el.removeAttribute('contenteditable');
        const newText = el.innerText.trim();

        if (this.model) {
          this.model.set('buttonName', newText);
          this.model.components(newText);
        }
      },

      onKeyDown(e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.el.blur(); // triggers saveEditing
        }
      },
    },
  });

  editor.BlockManager.add('back-button', {
    label: 'Back Button',
    category: 'Basic',
    attributes: { class: 'fa fa-arrow-left' },
    content: { type: 'back-button' },
  });
}