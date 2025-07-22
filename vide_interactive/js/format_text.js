function addFormattedRichTextComponent(editor) {
  // Format configurations
  const formatConfigs = {
    text: {
      label: 'Text',
      patterns: ['None'],
      defaultPattern: 'None',
      icon: '📝'
    },
    number: {
      label: 'Number',
      patterns: ['0', '0.0', '0.00', '#,###', '#,###.##', '#,##,###', '#,##,###.##'],
      defaultPattern: '#,##,###',
      icon: '🔢'
    },
    currency: {
      label: 'Currency',
      patterns: ['$0', '$0.00', '€0.00', '₹0.00', '¥0', '£0.00'],
      defaultPattern: '₹0.00',
      icon: '💰'
    },
    percentage: {
      label: 'Percentage',
      patterns: ['0%', '0.0%', '0.00%'],
      defaultPattern: '0.00%',
      icon: '📊'
    },
    date: {
      label: 'Date',
      patterns: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'MMM DD, YYYY', 'DD MMM YYYY'],
      defaultPattern: 'MM/DD/YYYY',
      icon: '📅'
    }
  };

  // Combined format patterns
  const combinedFormats = {
    'number+currency': {
      label: 'Number + Currency',
      icon: '🔢💰',
      patterns: ['₹#,##,###', '$#,###.##', '€#,###.00', '¥#,###']
    },
    'number+percentage': {
      label: 'Number + Percentage',
      icon: '🔢📊',
      patterns: ['#,###%', '#,###.##%', '#,##,###.00%']
    }
  };

  // Format helper functions
  const formatHelpers = {
    canConvertToNumber(value) {
      if (typeof value === 'number') return true;
      const cleanValue = String(value).replace(/[^\d.-]/g, '');
      return cleanValue !== '' && !isNaN(parseFloat(cleanValue));
    },

    canConvertToDate(value) {
      if (value instanceof Date) return true;
      const str = String(value).trim();
      return !isNaN(Date.parse(str)) || /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str);
    },

    extractTextContent(htmlContent) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      return tempDiv.textContent || tempDiv.innerText || '';
    },

    preserveRichTextStructure(htmlContent, newTextContent) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      
      // Find all text nodes and replace with formatted content
      const walker = document.createTreeWalker(
        tempDiv,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      const textNodes = [];
      let node;
      while (node = walker.nextNode()) {
        if (node.textContent.trim()) {
          textNodes.push(node);
        }
      }
      
      if (textNodes.length === 1) {
        textNodes[0].textContent = newTextContent;
      } else if (textNodes.length === 0) {
        tempDiv.textContent = newTextContent;
      }
      
      return tempDiv.innerHTML;
    },

    validateFormat(value, formatType) {
      const textContent = this.extractTextContent(value);
      
      if (formatType.includes('+')) {
        const [primary] = formatType.split('+');
        return this.validateFormat(textContent, primary);
      }
      
      switch (formatType) {
        case 'text':
          return { valid: true };
        case 'number':
        case 'currency':
        case 'percentage':
          if (!this.canConvertToNumber(textContent)) {
            return { 
              valid: false, 
              error: `"${textContent}" cannot be converted to ${formatType}. Please enter a valid number.` 
            };
          }
          return { valid: true };
        case 'date':
          if (!this.canConvertToDate(textContent)) {
            return { 
              valid: false, 
              error: `"${textContent}" cannot be converted to date.` 
            };
          }
          return { valid: true };
        default:
          return { valid: true };
      }
    },

    parseNumber(value) {
      const textContent = this.extractTextContent(value);
      if (typeof textContent === 'number') return textContent;
      const cleanValue = String(textContent).replace(/[^\d.-]/g, '');
      const parsed = parseFloat(cleanValue);
      return isNaN(parsed) ? 0 : parsed;
    },

    parseDate(value) {
      const textContent = this.extractTextContent(value);
      if (textContent instanceof Date) return textContent;
      const parsed = new Date(textContent);
      return isNaN(parsed.getTime()) ? new Date() : parsed;
    },

    formatNumber(value, pattern) {
      const num = this.parseNumber(value);
      
      switch (pattern) {
        case '0':
          return Math.round(num).toString();
        case '0.0':
          return num.toFixed(1);
        case '0.00':
          return num.toFixed(2);
        case '#,###':
          return new Intl.NumberFormat('en-US').format(num);
        case '#,###.##':
          return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(num);
        case '#,##,###':
          return new Intl.NumberFormat('en-IN').format(num);
        case '#,##,###.##':
          return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(num);
        default:
          return num.toString();
      }
    },

    formatCurrency(value, pattern) {
      const num = this.parseNumber(value);
      const currencySymbol = pattern.charAt(0);
      const decimals = (pattern.match(/\.0+/) || [''])[0].length - 1;
      const locale = currencySymbol === '₹' ? 'en-IN' : 'en-US';

      return currencySymbol + new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals > 0 ? decimals : 0,
        maximumFractionDigits: decimals > 0 ? decimals : 0
      }).format(num);
    },

    formatPercentage(value, pattern) {
      const num = this.parseNumber(value);
      const decimals = (pattern.match(/\.0+/) || [''])[0].length - 1;
      return num.toFixed(decimals) + '%';
    },

    formatDate(value, pattern) {
      const date = this.parseDate(value);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      switch (pattern) {
        case 'MM/DD/YYYY':
          return `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`;
        case 'DD/MM/YYYY':
          return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
        case 'YYYY-MM-DD':
          return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        case 'MMM DD, YYYY':
          return `${monthNames[month - 1]} ${day}, ${year}`;
        case 'DD MMM YYYY':
          return `${day} ${monthNames[month - 1]} ${year}`;
        default:
          return date.toLocaleDateString();
      }
    },

    formatCombined(value, pattern) {
      const num = this.parseNumber(value);
      
      if (pattern.includes('₹')) {
        return '₹' + new Intl.NumberFormat('en-IN').format(num);
      } else if (pattern.startsWith('$')) {
        return '$' + new Intl.NumberFormat('en-US').format(num);
      } else if (pattern.startsWith('€')) {
        return '€' + new Intl.NumberFormat('en-US').format(num);
      } else if (pattern.startsWith('¥')) {
        return '¥' + new Intl.NumberFormat('en-US').format(num);
      }
      
      if (pattern.includes('%')) {
        const decimals = pattern.includes('.##') ? 2 : pattern.includes('.00') ? 2 : 0;
        const locale = pattern.includes('#,##,###') ? 'en-IN' : 'en-US';
        return new Intl.NumberFormat(locale, { 
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals 
        }).format(num) + '%';
      }
      
      return this.extractTextContent(value);
    },

    applyFormat(value, formatType, pattern) {
      if (formatType.includes('+')) {
        const formattedText = this.formatCombined(value, pattern);
        return this.preserveRichTextStructure(value, formattedText);
      }
      
      let formattedText;
      switch (formatType) {
        case 'number':
          formattedText = this.formatNumber(value, pattern);
          break;
        case 'currency':
          formattedText = this.formatCurrency(value, pattern);
          break;
        case 'percentage':
          formattedText = this.formatPercentage(value, pattern);
          break;
        case 'date':
          formattedText = this.formatDate(value, pattern);
          break;
        default:
          return value;
      }
      
      return this.preserveRichTextStructure(value, formattedText);
    }
  };

  // Get all format options
  function getAllFormatOptions() {
    const options = Object.keys(formatConfigs).map(key => ({
      value: key,
      label: `${formatConfigs[key].icon} ${formatConfigs[key].label}`
    }));
    
    Object.keys(combinedFormats).forEach(key => {
      options.push({
        value: key,
        label: `${combinedFormats[key].icon} ${combinedFormats[key].label}`
      });
    });
    
    return options;
  }

  // Get format label for hover tooltip
  function getFormatLabel(formatType) {
    if (formatConfigs[formatType]) {
      return formatConfigs[formatType].label;
    }
    if (combinedFormats[formatType]) {
      return combinedFormats[formatType].label;
    }
    return 'Text';
  }

  // Custom RTE actions
  const customRteActions = [
    {
      name: "bold",
      icon: "<b>B</b>",
      attributes: { title: "Bold" },
      result: function (rte) {
        return rte.exec("bold");
      }
    },
    {
      name: "italic", 
      icon: "<i>I</i>",
      attributes: { title: "Italic" },
      result: function (rte) {
        return rte.exec("italic");
      }
    },
    {
      name: "underline",
      icon: "<u>U</u>",
      attributes: { title: "Underline" },
      result: function (rte) {
        return rte.exec("underline");
      }
    },
    {
      name: "strikethrough",
      icon: "<s>S</s>",
      attributes: { title: "Strike-through" },
      result: function (rte) {
        return rte.exec("strikeThrough");
      }
    },
    {
      name: "link",
      icon: `<svg viewBox="0 0 24 24" style="width:14px;height:14px;">
        <path fill="currentColor" d="M3.9,12C3.9,10.29 5.29,8.9 7,8.9H11V7H7A5,5 0 0,0 2,12A5,5 0 0,0 7,17H11V15.1H7C5.29,15.1 3.9,13.71 3.9,12M8,13H16V11H8V13M17,7H13V8.9H17C18.71,8.9 20.1,10.29 20.1,12C20.1,13.71 18.71,15.1 17,15.1H13V17H17A5,5 0 0,0 22,12A5,5 0 0,0 17,7Z" />
      </svg>`,
      attributes: {
        style: "font-size:1.4rem;padding:0 4px 2px;",
        title: "Link"
      },
      state: function (rte) {
        const selection = rte && rte.selection();
        if (!selection) return 0;
        const anchorNode = selection.anchorNode;
        const focusNode = selection.focusNode;
        const anchorParent = anchorNode?.parentNode;
        const focusParent = focusNode?.parentNode;
        return (anchorParent?.nodeName === 'A' || focusParent?.nodeName === 'A') ? 1 : 0;
      },
      result: function (rte) {
        const selection = rte.selection();
        if (!selection) return;
        
        const anchorNode = selection.anchorNode;
        const focusNode = selection.focusNode;
        const anchorParent = anchorNode?.parentNode;
        const focusParent = focusNode?.parentNode;
        const hasLink = anchorParent?.nodeName === 'A' || focusParent?.nodeName === 'A';
        
        if (hasLink) {
          rte.exec("unlink");
        } else {
          const selectedText = selection.toString();
          if (selectedText) {
            rte.insertHTML(`<a href="" data-selectme>${selectedText}</a>`, { select: true });
          }
        }
      }
    }
  ];

  // Add the formatted-rich-text component
  editor.DomComponents.addType('formatted-rich-text', {
    model: {
      defaults: {
        tagName: 'div',
        draggable: true,
        droppable: false,
        editable: false, // Always false to prevent default RTE
        content: 'Insert your text here',
        attributes: {
          'data-gjs-type': 'formatted-rich-text'
        },
        traits: [
          {
            type: 'select',
            name: 'format-type',
            label: 'Format Type',
            options: getAllFormatOptions(),
            changeProp: 1
          },
          {
            type: 'select',
            name: 'format-pattern',
            label: 'Format Pattern',
            options: [{ value: 'None', label: 'None' }],
            changeProp: 1
          }
        ],
        'format-type': 'text',
        'format-pattern': 'None',
        'raw-content': 'Insert your text here',
        'is-editing': false
      },

      init() {
        this.on('change:format-type', this.handleFormatTypeChange);
        this.on('change:format-pattern', this.updateFormattedContent);
        this.updateFormatPattern();
        this.updateTooltip();
      },

      updateTooltip() {
        const formatType = this.get('format-type') || 'text';
        const label = getFormatLabel(formatType);
        this.set('custom-name', label, { silent: true });
      },

      handleFormatTypeChange() {
        const newFormatType = this.get('format-type');
        const rawContent = this.get('raw-content') || '';

        const validation = formatHelpers.validateFormat(rawContent, newFormatType);
        
        if (!validation.valid) {
          alert(validation.error);
          return;
        }
        
        this.updateFormatPattern();
        this.updateFormattedContent();
        this.updateTooltip();
      },

      updateFormatPattern() {
        const formatType = this.get('format-type') || 'text';
        let config = formatConfigs[formatType] || combinedFormats[formatType];
        
        if (config) {
          const patternTrait = this.getTrait('format-pattern');
          if (patternTrait) {
            patternTrait.set('options', config.patterns.map(pattern => ({
              value: pattern,
              label: pattern
            })));
            
            const defaultPattern = config.defaultPattern || config.patterns[0];
            this.set('format-pattern', defaultPattern);
          }
        }
      },

      updateFormattedContent() {
        const formatType = this.get('format-type') || 'text';
        const pattern = this.get('format-pattern') || 'None';
        const rawContent = this.get('raw-content') || '';

        if (formatType === 'text' || pattern === 'None') {
          this.set('content', rawContent);
        } else {
          try {
            const formatted = formatHelpers.applyFormat(rawContent, formatType, pattern);
            this.set('content', formatted);
          } catch (error) {
            console.warn('Format error:', error);
            this.set('content', rawContent);
          }
        }
      },

      enableRTE() {
        this.set('is-editing', true);
      },

      disableRTE() {
        this.set('is-editing', false);
      }
    },

    view: {
      events: {
        'dblclick': 'enableRichTextEditing',
        'click': 'handleSingleClick'
      },

      init() {
        this.listenTo(this.model, 'change:is-editing', this.handleEditingChange);
        this.rteActive = false;
      },

      handleSingleClick(e) {
        // Allow normal GrapesJS selection behavior on single click
        // Don't prevent default, let GrapesJS handle component selection
      },

      handleEditingChange() {
        const isEditing = this.model.get('is-editing');
        if (isEditing && !this.rteActive) {
          this.startRTE();
        } else if (!isEditing && this.rteActive) {
          this.stopRTE();
        }
      },

      enableRichTextEditing(e) {
        e.preventDefault();
        e.stopPropagation();

        if (!this.rteActive) {
          this.model.enableRTE();
        }
      },

      startRTE() {
        if (this.rteActive) return; // Prevent multiple RTE instances

        const em = this.model.em;
        if (!em) return;

        const rte = em.get('RichTextEditor');
        if (!rte) return;

        this.rteActive = true;

        // Store original actions and replace with custom ones
        this.originalActions = rte.getAll().slice(); // Create a copy
        
        // Clear existing actions
        this.originalActions.forEach(action => {
          try {
            rte.remove(action.name);
          } catch (e) {
            // Ignore errors when removing actions
          }
        });

        // Add custom actions
        customRteActions.forEach(action => {
          try {
            rte.add(action.name, action);
          } catch (e) {
            // Ignore errors when adding actions
          }
        });

        // Set content from current formatted content
        const currentContent = this.model.get('content') || '';
        this.el.innerHTML = currentContent;

        // Enable RTE
        try {
          rte.enable(this, null, { 
            actions: customRteActions.map(a => a.name)
          });
        } catch (e) {
          console.warn('RTE enable error:', e);
        }

        // Handle content changes
        this.rteChangeHandler = () => {
          const content = this.el.innerHTML;
          this.model.set('raw-content', content, { silent: true });
        };

        this.el.addEventListener('input', this.rteChangeHandler);
        this.el.addEventListener('blur', this.handleRTEBlur.bind(this));
      },

      stopRTE() {
        if (!this.rteActive) return;

        const em = this.model.em;
        if (!em) return;

        const rte = em.get('RichTextEditor');
        if (!rte) return;

        this.rteActive = false;

        // Remove event listeners
        if (this.rteChangeHandler) {
          this.el.removeEventListener('input', this.rteChangeHandler);
          this.el.removeEventListener('blur', this.handleRTEBlur);
          this.rteChangeHandler = null;
        }

        // Disable RTE
        try {
          rte.disable(this);
        } catch (e) {
          console.warn('RTE disable error:', e);
        }

        // Restore original actions
        if (this.originalActions) {
          // Clear custom actions
          customRteActions.forEach(action => {
            try {
              rte.remove(action.name);
            } catch (e) {
              // Ignore errors
            }
          });

          // Restore original actions
          this.originalActions.forEach(action => {
            try {
              rte.add(action.name, action);
            } catch (e) {
              // Ignore errors
            }
          });
          
          this.originalActions = null;
        }
      },

      handleRTEBlur() {
        const content = this.el.innerHTML;
        const formatType = this.model.get('format-type');
        
        // Validate format before applying
        const validation = formatHelpers.validateFormat(content, formatType);
        
        if (!validation.valid) {
          alert(validation.error);
          // Revert to previous content
          const previousContent = this.model.get('raw-content');
          this.el.innerHTML = previousContent;
        } else {
          this.model.set('raw-content', content, { silent: true });
          this.model.updateFormattedContent();
        }
        
        // Disable editing after blur
        setTimeout(() => {
          this.model.disableRTE();
        }, 100);
      },

      onRender() {
        // Ensure element is not editable by default
        this.el.contentEditable = false;
        
        // Set tooltip based on format type
        const formatType = this.model.get('format-type') || 'text';
        const label = getFormatLabel(formatType);
        this.el.setAttribute('title', label);
      }
    }
  });

  // Add component to blocks
  editor.BlockManager.add('formatted-rich-text', {
    label: 'Text',
    content: {
      type: 'formatted-rich-text',
      content: 'Double-click to edit rich text content'
    },
    category: 'Text',
    attributes: {
      class: 'gjs-block-formatted-rich-text'
    }
  });

  // Add custom styles using GrapesJS CSS classes for responsiveness
  editor.addStyle(`
    [data-gjs-type="formatted-rich-text"] {
      min-height: 40px;
      outline: none;
      cursor: pointer;
      position: relative;
      padding: 12px;
      border: 1px solid transparent;
      background: transparent;
      transition: all 0.2s ease;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    [data-gjs-type="formatted-rich-text"]:hover {
      background-color: rgba(0, 123, 255, 0.02);
      border: 1px dashed rgba(0, 123, 255, 0.3);
      cursor: pointer;
    }
    
    [data-gjs-type="formatted-rich-text"][contenteditable="true"] {
      background-color: rgba(0, 123, 255, 0.05);
      border: 1px dashed #007bff;
      outline: none;
      cursor: text;
    }
    
    .gjs-selected[data-gjs-type="formatted-rich-text"] {
      outline: 2px solid #3498db !important;
      background-color: rgba(52, 152, 219, 0.1);
    }
    
    [data-gjs-type="formatted-rich-text"] a {
      color: #007bff;
      text-decoration: underline;
      cursor: pointer;
    }
    
    [data-gjs-type="formatted-rich-text"] a:hover {
      color: #0056b3;
    }
    
    [data-gjs-type="formatted-rich-text"] b,
    [data-gjs-type="formatted-rich-text"] strong {
      font-weight: bold;
    }
    
    [data-gjs-type="formatted-rich-text"] i,
    [data-gjs-type="formatted-rich-text"] em {
      font-style: italic;
    }
    
    [data-gjs-type="formatted-rich-text"] u {
      text-decoration: underline;
    }
    
    [data-gjs-type="formatted-rich-text"] s {
      text-decoration: line-through;
    }
    
    /* Responsive text sizes using GrapesJS responsive classes */
    @media (max-width: 768px) {
      [data-gjs-type="formatted-rich-text"] {
        padding: 8px;
        font-size: 0.9em;
      }
    }
    
    @media (max-width: 480px) {
      [data-gjs-type="formatted-rich-text"] {
        padding: 6px;
        font-size: 0.85em;
      }
    }
    
    /* Block manager icon */
    .gjs-block-formatted-rich-text {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 4px;
      padding: 8px;
      text-align: center;
      font-weight: 500;
    }
    
    .gjs-block-formatted-rich-text:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    
    /* Editing state indicator */
    [data-gjs-type="formatted-rich-text"][contenteditable="true"]::before {
      content: "✏️ Editing";
      position: absolute;
      top: -20px;
      left: 0;
      font-size: 10px;
      background: #007bff;
      color: white;
      padding: 2px 6px;
      border-radius: 3px;
      z-index: 1000;
    }
  `);

  console.log('Formatted Rich Text component (standalone) initialized successfully!');
  
  return {
    formatHelpers,
    customRteActions,
    getAllFormatOptions
  };
}