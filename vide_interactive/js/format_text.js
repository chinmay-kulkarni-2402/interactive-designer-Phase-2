function formatText(editor) {
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
      patterns: ['0', '0.0', '0.00', '0.000', '#,###', '#,###.##', '#,###.000'],
      defaultPattern: '0.00',
      icon: '🔢'
    },
    currency: {
      label: 'Currency',
      patterns: ['$0', '$0.00', '€0.00', '₹0.00', '¥0', '£0.00'],
      defaultPattern: '$0.00',
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
      patterns: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'MMM DD, YYYY', 'DD MMM YYYY', 'MMMM DD, YYYY'],
      defaultPattern: 'MM/DD/YYYY',
      icon: '📅'
    },
    // time: {
    //   label: 'Time',
    //   patterns: ['HH:mm', 'HH:mm:ss', 'hh:mm AM/PM', 'hh:mm:ss AM/PM'],
    //   defaultPattern: 'HH:mm',
    //   icon: '⏰'
    // }
  };

  // Helper functions for format conversion
  const formatHelpers = {
    // Validation functions
    canConvertToNumber(value) {
      if (typeof value === 'number') return true;
      const cleanValue = String(value).replace(/[^\d.-]/g, '');
      return cleanValue !== '' && !isNaN(parseFloat(cleanValue)) && isFinite(parseFloat(cleanValue));
    },

    canConvertToDate(value) {
      if (value instanceof Date) return true;
      
      const dateFormats = [
        /^\d{1,2}\/\d{1,2}\/\d{4}$/,
        /^\d{4}-\d{1,2}-\d{1,2}$/,
        /^\d{1,2}-\d{1,2}-\d{4}$/,
        /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}$/i,
        /^\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}$/i
      ];

      const str = String(value).trim();
      return dateFormats.some(format => format.test(str)) || !isNaN(Date.parse(str));
    },

    canConvertToTime(value) {
      if (value instanceof Date) return true;
      const timePattern = /^\d{1,2}:\d{2}(:\d{2})?(\s*(AM|PM))?$/i;
      return timePattern.test(String(value).trim());
    },

    validateFormat(value, formatType) {
      const str = String(value).trim();
      
      switch (formatType) {
        case 'text':
          return { valid: true };
        case 'number':
        case 'currency':
        case 'percentage':
          if (!this.canConvertToNumber(value)) {
            return { 
              valid: false, 
              error: `"${str}" cannot be converted to ${formatType}. Please enter a valid number.` 
            };
          }
          return { valid: true };
        case 'date':
          if (!this.canConvertToDate(value)) {
            return { 
              valid: false, 
              error: `"${str}" cannot be converted to date. Please enter a valid date (e.g., MM/DD/YYYY, YYYY-MM-DD).` 
            };
          }
          return { valid: true };
        case 'time':
          if (!this.canConvertToTime(value)) {
            return { 
              valid: false, 
              error: `"${str}" cannot be converted to time. Please enter a valid time (e.g., HH:MM, HH:MM AM/PM).` 
            };
          }
          return { valid: true };
        default:
          return { valid: true };
      }
    },

    parseNumber(value) {
      if (typeof value === 'number') return value;
      const cleanValue = String(value).replace(/[^\d.-]/g, '');
      const parsed = parseFloat(cleanValue);
      return isNaN(parsed) ? 0 : parsed;
    },

    parseDate(value) {
      if (value instanceof Date) return value;
      
      const dateFormats = [
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
        /(\d{4})-(\d{1,2})-(\d{1,2})/,
        /(\d{1,2})-(\d{1,2})-(\d{4})/
      ];

      for (let format of dateFormats) {
        const match = String(value).match(format);
        if (match) {
          const date = new Date(match[0]);
          if (!isNaN(date.getTime())) return date;
        }
      }

      const parsed = new Date(value);
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
        case '0.000':
          return num.toFixed(3);
        case '#,###':
          return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(num);
        case '#,###.##':
          return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
        case '#,###.000':
          return new Intl.NumberFormat('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(num);
        default:
          return num.toString();
      }
    },

    formatCurrency(value, pattern) {
      const num = this.parseNumber(value);
      const currencySymbol = pattern.charAt(0);
      const decimals = (pattern.match(/\.0+/) || [''])[0].length - 1;
      
      if (decimals > 0) {
        return currencySymbol + new Intl.NumberFormat('en-US', { 
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals 
        }).format(num);
      } else {
        return currencySymbol + new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(num);
      }
    },

    formatPercentage(value, pattern) {
      const num = this.parseNumber(value);
      const decimals = (pattern.match(/\.0+/) || [''])[0].length - 1;
      // Don't multiply by 100 - treat input as already the percentage value
      return num.toFixed(decimals) + '%';
    },

    formatDate(value, pattern) {
      const date = this.parseDate(value);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const fullMonthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                             'July', 'August', 'September', 'October', 'November', 'December'];

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
        case 'MMMM DD, YYYY':
          return `${fullMonthNames[month - 1]} ${day}, ${year}`;
        default:
          return date.toLocaleDateString();
      }
    },

    formatTime(value, pattern) {
      let date;
      if (value instanceof Date) {
        date = value;
      } else {
        const timeMatch = String(value).match(/(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?/i);
        if (timeMatch) {
          date = new Date();
          let hours = parseInt(timeMatch[1]);
          const minutes = parseInt(timeMatch[2]);
          const seconds = timeMatch[3] ? parseInt(timeMatch[3]) : 0;
          const ampm = timeMatch[4];
          
          if (ampm && ampm.toUpperCase() === 'PM' && hours !== 12) hours += 12;
          if (ampm && ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
          
          date.setHours(hours, minutes, seconds);
        } else {
          date = new Date();
        }
      }

      const hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();

      switch (pattern) {
        case 'HH:mm':
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        case 'HH:mm:ss':
          return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        case 'hh:mm AM/PM':
          const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
          const ampm = hours >= 12 ? 'PM' : 'AM';
          return `${hour12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${ampm}`;
        case 'hh:mm:ss AM/PM':
          const hour12s = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
          const ampms = hours >= 12 ? 'PM' : 'AM';
          return `${hour12s.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${ampms}`;
        default:
          return date.toLocaleTimeString();
      }
    },

    applyFormat(value, formatType, pattern) {
      switch (formatType) {
        case 'number':
          return this.formatNumber(value, pattern);
        case 'currency':
          return this.formatCurrency(value, pattern);
        case 'percentage':
          return this.formatPercentage(value, pattern);
        case 'date':
          return this.formatDate(value, pattern);
        case 'time':
          return this.formatTime(value, pattern);
        default:
          return String(value);
      }
    }
  };

  // Show error function
  function showFormatError(message) {
    alert(message);
    console.error('Format Error:', message);
  }

  // Override the text component with enhanced functionality
  editor.DomComponents.addType('text', {
    model: {
      defaults: {
        tagName: 'div',
        draggable: true,
        droppable: false,
        editable: true,
        content: 'Insert your text here',
        attributes: {
          'data-gjs-type': 'text',
          'contenteditable': 'true'
        },
        traits: [
          {
            type: 'select',
            name: 'format-type',
            label: 'Format Type',
            options: Object.keys(formatConfigs).map(key => ({
              value: key,
              label: `${formatConfigs[key].icon} ${formatConfigs[key].label}`
            })),
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
        this.listenTo(this, 'change:format-type', this.handleFormatTypeChange);
        this.listenTo(this, 'change:format-pattern', this.updateFormattedContent);
        
        // Initialize format pattern options
        this.updateFormatPattern();
      },

      handleFormatTypeChange() {
        const newFormatType = this.get('format-type');
        const previousFormatType = this.previous('format-type');
        const rawContent = this.get('raw-content') || '';

        // Validate if content can be converted to new format
        const validation = formatHelpers.validateFormat(rawContent, newFormatType);
        
        if (!validation.valid) {
          // Show error
          showFormatError(validation.error);
          
          // Prevent the change by using stopListening temporarily
          this.stopListening(this, 'change:format-type', this.handleFormatTypeChange);
          
          // Revert to previous format type
          this.set('format-type', previousFormatType);
          
          // Update trait manager UI
          setTimeout(() => {
            const traitManager = this.em && this.em.get('TraitManager');
            if (traitManager) {
              const traits = traitManager.getCurrent();
              if (traits) {
                const formatTypeTrait = traits.at(0); // First trait is format-type
                if (formatTypeTrait && formatTypeTrait.view) {
                  // Force UI update
                  formatTypeTrait.view.model.set('value', previousFormatType);
                  formatTypeTrait.view.render();
                }
              }
            }
            
            // Re-enable listening
            this.listenTo(this, 'change:format-type', this.handleFormatTypeChange);
          }, 50);
          
          return;
        }
        
        // If validation passes, update format pattern and content
        this.updateFormatPattern();
        this.updateFormattedContent();
      },

      updateFormatPattern() {
        const formatType = this.get('format-type') || 'text';
        const config = formatConfigs[formatType];
        
        if (config) {
          // Update pattern options
          const patternTrait = this.getTrait('format-pattern');
          if (patternTrait) {
            patternTrait.set('options', config.patterns.map(pattern => ({
              value: pattern,
              label: pattern
            })));
            
            // Set default pattern
            this.set('format-pattern', config.defaultPattern);
            
            // Update trait UI
            setTimeout(() => {
              if (patternTrait.view) {
                patternTrait.view.model.set('value', config.defaultPattern);
                patternTrait.view.render();
              }
            }, 10);
          }
        }
      },

      updateFormattedContent() {
        const formatType = this.get('format-type') || 'text';
        const pattern = this.get('format-pattern') || 'None';
        const rawContent = this.get('raw-content') || '';

        if (formatType === 'text' || pattern === 'None') {
          this.setContent(rawContent);
        } else {
          try {
            const formatted = formatHelpers.applyFormat(rawContent, formatType, pattern);
            this.setContent(formatted);
          } catch (error) {
            console.warn('Format error:', error);
            this.setContent(rawContent);
          }
        }
        
        this.updateComponentType();
      },

      setContent(content) {
  // Update model content & raw content
  this.set('content', content);
  this.set('raw-content', content);
  this.addAttributes({
    'data-formatted-content': content,
    'data-raw-content': content
  });

  // Update live DOM content
  const iframe = editor.Canvas.getFrameEl();
  const el = iframe.contentDocument.querySelector(`#${this.getId()}`);

  if (el) {
    el.textContent = content;
    el.setAttribute('data-raw-content', content);
    el.setAttribute('data-formatted-content', content);
  }

  // Ensure GrapesJS uses updated content in export
  // Ensure GrapesJS uses updated content in export
const comp = editor.getWrapper().find(`#${this.getId()}`)[0];

if (comp) {
  const comps = comp.components();

  if (comps.length > 0) {
    // ✅ Update the inner text node content
    const child = comps.at(0);
    child.set('content', content);
  } else {
    // ✅ If no text node exists, create one
    comp.components([{ type: 'textnode', content }]);
  }
}
}, 
      updateComponentType() {
        const formatType = this.get('format-type') || 'text';
        const pattern = this.get('format-pattern') || 'None';
        
        this.addAttributes({
          'data-format-type': formatType,
          'data-format-pattern': pattern,
          'data-raw-content': this.get('raw-content') || ''
        });
      }
    },

    view: {
      events: {
        'blur': 'handleBlur',
        'input': 'handleInput',
        'focus': 'handleFocus'
      },

      init() {
        this.listenTo(this.model, 'change:content', this.updateElementContent);
      },

      handleFocus(event) {
        // Show raw content when editing
        const rawContent = this.model.get('raw-content') || '';
        this.el.textContent = rawContent;
        this.model.set('is-editing', true, { silent: true });
      },

      handleInput(event) {
        event.stopPropagation();
        const content = this.getContentFromElement();
        this.model.set('raw-content', content, { silent: true });
      },

      handleBlur(event) {
        event.stopPropagation();
        
        if (!this.model.get('is-editing')) return;
        
        const content = this.getContentFromElement();
        const formatType = this.model.get('format-type');
        
        // Validate the content for current format
        const validation = formatHelpers.validateFormat(content, formatType);
        
        if (!validation.valid) {
          showFormatError(validation.error);
          // Restore previous raw content
          const previousRawContent = this.model.get('raw-content');
          this.el.textContent = previousRawContent;
          this.model.set('is-editing', false, { silent: true });
          
          // Apply previous formatting
          setTimeout(() => {
            this.model.updateFormattedContent();
          }, 10);
          return;
        }
        
        // Update raw content and apply formatting
        this.model.set('raw-content', content, { silent: true });
        this.model.set('is-editing', false, { silent: true });
        
        // Apply formatting
        this.model.updateFormattedContent();
      },

      getContentFromElement() {
        return this.el.textContent || this.el.innerText || '';
      },

      updateElementContent() {
        // Only update if not currently editing
        if (!this.model.get('is-editing') && document.activeElement !== this.el) {
          const content = this.model.get('content') || '';
          this.el.textContent = content;
        }
      },

      onRender() {
        this.el.setAttribute('contenteditable', 'true');
        this.model.updateComponentType();
      }
    }
  });

  // Ensure formatted content is preserved in export
  editor.on('component:export', (component) => {
    if (component.get('type') === 'text') {
      const formattedContent = component.get('content');
      const formatType = component.get('format-type');
      const pattern = component.get('format-pattern');
      
      // Ensure the exported HTML contains the formatted content
      if (formattedContent && formatType !== 'text') {
        component.set('content', formattedContent);
        component.addAttributes({
          'data-original-content': component.get('raw-content'),
          'data-format-applied': `${formatType}:${pattern}`
        });
      }
    }
  });

  // Handle PDF export by ensuring formatted content is in the DOM
  editor.on('canvas:frame:load', () => {
    const canvas = editor.Canvas;
    const canvasDoc = canvas.getDocument();
    
    if (canvasDoc) {
      const textElements = canvasDoc.querySelectorAll('[data-gjs-type="text"]');
      textElements.forEach(el => {
        const formattedContent = el.getAttribute('data-formatted-content');
        if (formattedContent) {
          el.textContent = formattedContent;
        }
      });
    }
  });

  // Add custom CSS for better display
  editor.addStyle(`
    [data-gjs-type="text"] {
      min-height: 20px;
      outline: none;
      cursor: text;
      position: relative;
    }
    
    [data-gjs-type="text"]:focus {
      background-color: rgba(0, 123, 255, 0.1);
      border: 1px dashed #007bff;
    }
    
    .gjs-selected[data-gjs-type="text"] {
      outline: 2px solid #3498db !important;
    }
  `);

  // Update component labels for better identification
  editor.on('component:selected', (component) => {
    if (component.get('type') === 'text') {
      const formatType = component.get('format-type') || 'text';
      const config = formatConfigs[formatType];
      
      if (config) {
        const displayLabel = formatType === 'text' ? 'Text' : `${config.icon} ${config.label}`;
        component.set('custom-name', displayLabel);
      }
    }
  });

  // Initialize existing components
  editor.on('load', () => {
    const wrapper = editor.DomComponents.getWrapper();
    if (wrapper) {
      wrapper.find('[data-gjs-type="text"]').forEach(component => {
        if (!component.get('format-type')) {
          component.set({
            'format-type': 'text',
            'format-pattern': 'None',
            'raw-content': component.get('content') || 'Insert your text here',
            'editable': true,
            'is-editing': false
          }, { silent: true });
        }
      });
    }
  });

  console.log('Enhanced text formatter initialized successfully!');
}