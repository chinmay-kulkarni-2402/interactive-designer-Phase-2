function formatText(editor) {
  // Format configurations with combination support
  const formatConfigs = {
    text: {
      label: 'Text',
      patterns: ['None'],
      defaultPattern: 'None',
      icon: '📝',
      canCombine: false
    },
    number: {
      label: 'Number',
      patterns: ['0', '0.0', '0.00', '0.000', '#,###', '##,###', '#,###.##', '#,###.000', '#,##,###', '#,##,###.##', '#,##,###.000'],
      defaultPattern: '#,##,###',
      icon: '🔢',
      canCombine: true,
      combinesWith: ['currency', 'percentage']
    },
    currency: {
      label: 'Currency',
      patterns: ['$0', '$0.00', '€0.00', '₹0.00', '¥0', '£0.00'],
      defaultPattern: '₹0.00',
      icon: '💰',
      canCombine: true,
      combinesWith: ['number']
    },
    percentage: {
      label: 'Percentage',
      patterns: ['0%', '0.0%', '0.00%'],
      defaultPattern: '0.00%',
      icon: '📊',
      canCombine: true,
      combinesWith: ['number']
    },
    date: {
      label: 'Date',
      patterns: ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'MMM DD, YYYY', 'DD MMM YYYY', 'MMMM DD, YYYY'],
      defaultPattern: 'MM/DD/YYYY',
      icon: '📅',
      canCombine: true,
      combinesWith: ['time']
    },
    // time: {
    //   label: 'Time',
    //   patterns: ['HH:mm', 'HH:mm:ss', 'hh:mm AM/PM', 'hh:mm:ss AM/PM'],
    //   defaultPattern: 'HH:mm',
    //   icon: '⏰',
    //   canCombine: true,
    //   combinesWith: ['date']
    // }
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
    },
    'date+time': {
      label: 'Date + Time',
      icon: '📅⏰',
      patterns: ['MM/DD/YYYY HH:mm', 'DD/MM/YYYY HH:mm:ss', 'MMM DD, YYYY hh:mm AM/PM']
    }
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
      
      // Handle combined formats
      if (formatType.includes('+')) {
        const [primary] = formatType.split('+');
        return this.validateFormat(value, primary);
      }
      
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
          return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(num);
        case '#,###.000':
          return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3
          }).format(num);
        case '#,##,###':
          return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(num);
        case '#,##,###.##':
          return new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }).format(num);
        case '#,##,###.000':
          return new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3
          }).format(num);
        default:
          return num.toString();
      }
    },

    formatCurrency(value, pattern) {
      const num = this.parseNumber(value);
      const currencySymbol = pattern.charAt(0);
      const decimals = (pattern.match(/\.0+/) || [''])[0].length - 1;

      let locale = 'en-US';
      if (currencySymbol === '₹') {
        locale = 'en-IN';
      }

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

    // Handle combined format patterns
    formatCombined(value, pattern) {
      const num = this.parseNumber(value);
      
      // Combined number + currency patterns
      if (pattern.includes('₹')) {
        const formatted = new Intl.NumberFormat('en-IN').format(num);
        return '₹'+ formatted ;
      } else if (pattern.startsWith('$')) {
        const formatted = new Intl.NumberFormat('en-US').format(num);
        return '$' + formatted;
      } else if (pattern.startsWith('€')) {
        const formatted = new Intl.NumberFormat('en-US').format(num);
        return '€' + formatted;
      } else if (pattern.startsWith('¥')) {
        const formatted = new Intl.NumberFormat('en-US').format(num);
        return '¥' + formatted;
      }
      
      // Combined number + percentage patterns
      if (pattern.includes('%')) {
        if (pattern.includes('.##')) {
          return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2 }).format(num) + '%';
        } else if (pattern.includes('.00')) {
          return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 2 }).format(num) + '%';
        } else {
          return new Intl.NumberFormat('en-US').format(num) + '%';
        }
      }
      
      // Combined date + time patterns
      if (pattern.includes(' ')) {
        const date = this.parseDate(value);
        const [datePart, timePart] = pattern.split(' ');
        const formattedDate = this.formatDate(date, datePart);
        const formattedTime = this.formatTime(date, timePart);
        return `${formattedDate} ${formattedTime}`;
      }
      
      return String(value);
    },

    applyFormat(value, formatType, pattern) {
      // Handle combined formats
      if (formatType.includes('+')) {
        return this.formatCombined(value, pattern);
      }
      
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

  function showFormatError(message) {
    alert(message);
    console.error('Format Error:', message);
  }

  // Get all format options including combined formats
  function getAllFormatOptions() {
    const options = Object.keys(formatConfigs).map(key => ({
      value: key,
      label: `${formatConfigs[key].icon} ${formatConfigs[key].label}`
    }));
    
    // Add combined format options
    Object.keys(combinedFormats).forEach(key => {
      options.push({
        value: key,
        label: `${combinedFormats[key].icon} ${combinedFormats[key].label}`
      });
    });
    
    return options;
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
        'raw-content': 'Insert your text here'
      },

      init() {
        this.listenTo(this, 'change:format-type', this.handleFormatTypeChange);
        this.listenTo(this, 'change:format-pattern', this.updateFormattedContent);
        this.updateFormatPattern();
      },

      handleFormatTypeChange() {
        const newFormatType = this.get('format-type');
        const previousFormatType = this.previous('format-type');
        const rawContent = this.get('raw-content') || '';

        const validation = formatHelpers.validateFormat(rawContent, newFormatType);
        
        if (!validation.valid) {
          showFormatError(validation.error);
          this.stopListening(this, 'change:format-type', this.handleFormatTypeChange);
          this.set('format-type', previousFormatType);
          
          setTimeout(() => {
            const traitManager = this.em && this.em.get('TraitManager');
            if (traitManager) {
              const traits = traitManager.getCurrent();
              if (traits) {
                const formatTypeTrait = traits.at(0);
                if (formatTypeTrait && formatTypeTrait.view) {
                  formatTypeTrait.view.model.set('value', previousFormatType);
                  formatTypeTrait.view.render();
                }
              }
            }
            this.listenTo(this, 'change:format-type', this.handleFormatTypeChange);
          }, 50);
          
          return;
        }
        
        this.updateFormatPattern();
        this.updateFormattedContent();
      },

      updateFormatPattern() {
        const formatType = this.get('format-type') || 'text';
        let config = formatConfigs[formatType];
        
        // Check if it's a combined format
        if (!config && combinedFormats[formatType]) {
          config = combinedFormats[formatType];
        }
        
        if (config) {
          const patternTrait = this.getTrait('format-pattern');
          if (patternTrait) {
            patternTrait.set('options', config.patterns.map(pattern => ({
              value: pattern,
              label: pattern
            })));
            
            const defaultPattern = config.defaultPattern || config.patterns[0];
            this.set('format-pattern', defaultPattern);
            
            setTimeout(() => {
              if (patternTrait.view) {
                patternTrait.view.model.set('value', defaultPattern);
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
      },

      setContent(content) {
        this.set('content', content);
        this.set('raw-content', content);
        this.addAttributes({
          'data-raw-content': content
        });

        const iframe = editor.Canvas.getFrameEl();
        const el = iframe.contentDocument.querySelector(`#${this.getId()}`);

        if (el) {
          el.textContent = content;
          el.setAttribute('data-raw-content', content);
        }

        const comp = editor.getWrapper().find(`#${this.getId()}`)[0];
        if (comp) {
          const comps = comp.components();
          if (comps.length > 0) {
            const child = comps.at(0);
            child.set('content', content);
          } else {
            comp.components([{ type: 'textnode', content }]);
          }
        }
    },

    updateComponentType() {
        
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
        
        const validation = formatHelpers.validateFormat(content, formatType);
        
        if (!validation.valid) {
          showFormatError(validation.error);
          const previousRawContent = this.model.get('raw-content');
          this.el.textContent = previousRawContent;
          this.model.set('is-editing', false, { silent: true });
          
          setTimeout(() => {
            this.model.updateFormattedContent();
          }, 10);
          return;
        }
        
        this.model.set('raw-content', content, { silent: true });
        this.model.set('is-editing', false, { silent: true });
        this.model.updateFormattedContent();
      },

      getContentFromElement() {
        return this.el.textContent || this.el.innerText || '';
      },

      updateElementContent() {
        if (!this.model.get('is-editing') && document.activeElement !== this.el) {
          const content = this.model.get('content') || '';
          this.el.textContent = content;
        }
      },

      onRender() {
        this.el.setAttribute('contenteditable', 'true');
      }
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
      let config = formatConfigs[formatType] || combinedFormats[formatType];
      
      if (config) {
        const displayLabel = formatType === 'text' ? 'Text' : `${config.icon} ${config.label}`;
        component.set('custom-name', displayLabel);
      }
    }
  });



  console.log('Enhanced text formatter with combined formats initialized successfully!');
}