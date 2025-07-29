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
      patterns: ['$ 0', '$ 0.00', '€ 0.00', '₹ 0.00', '¥ 0', '£ 0.00'],
      defaultPattern: '₹ 0.00',
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
      patterns: ['₹ #,##,###', '$ #,###.##', '€ #,###.00', '¥ #,###']
    },
    'number+percentage': {
      label: 'Number + Percentage',
      icon: '🔢📊',
      patterns: ['#,###%', '#,###.##%', '#,##,###.00%']
    }
  };

  // Enhanced format helper functions with conditional support
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

    // Enhanced method to check if a condition string is a number condition
    isNumberCondition(condition) {
      const conditionPattern = /^(<|<=|>|>=|=|!=)\s*\d+(\.\d+)?$|^\d+(\.\d+)?\s*<\s*\(\s*value\s*\)\s*<\s*\d+(\.\d+)?$|^\d+(\.\d+)?\s*<=\s*\(\s*value\s*\)\s*<=\s*\d+(\.\d+)?$|^\d+(\.\d+)?\s*<\s*value\s*<\s*\d+(\.\d+)?$|^\d+(\.\d+)?\s*<=\s*value\s*<=\s*\d+(\.\d+)?$/;
      return conditionPattern.test(condition.trim());
    },

    // Parse and evaluate number conditions
    parseNumberCondition(condition) {
      const trimmed = condition.trim();
      
      // Handle range conditions: 100<value<1000, 100<=value<=1000, etc.
      const rangePattern = /^(\d+(?:\.\d+)?)\s*(<|<=)\s*(?:\(?\s*value\s*\)?)\s*(<|<=)\s*(\d+(?:\.\d+)?)$/;
      const rangeMatch = trimmed.match(rangePattern);
      
      if (rangeMatch) {
        const [, min, minOp, maxOp, max] = rangeMatch;
        const minValue = parseFloat(min);
        const maxValue = parseFloat(max);
        const minInclusive = minOp === '<=';
        const maxInclusive = maxOp === '<=';
        
        return {
          type: 'range',
          min: minValue,
          max: maxValue,
          minInclusive,
          maxInclusive,
          evaluate: (value) => {
            const num = parseFloat(value);
            if (isNaN(num)) return false;
            
            const minCondition = minInclusive ? num >= minValue : num > minValue;
            const maxCondition = maxInclusive ? num <= maxValue : num < maxValue;
            
            return minCondition && maxCondition;
          }
        };
      }
      
      // Handle simple conditions: <1000, >=500, =100, !=50, etc.
      const simplePattern = /^(<|<=|>|>=|=|!=)\s*(\d+(?:\.\d+)?)$/;
      const simpleMatch = trimmed.match(simplePattern);
      
      if (simpleMatch) {
        const [, operator, valueStr] = simpleMatch;
        const conditionValue = parseFloat(valueStr);
        
        return {
          type: 'simple',
          operator,
          value: conditionValue,
          evaluate: (value) => {
            const num = parseFloat(value);
            if (isNaN(num)) return false;
            
            switch (operator) {
              case '<': return num < conditionValue;
              case '<=': return num <= conditionValue;
              case '>': return num > conditionValue;
              case '>=': return num >= conditionValue;
              case '=': return num === conditionValue;
              case '!=': return num !== conditionValue;
              default: return false;
            }
          }
        };
      }
      
      return null;
    },

    // Extract all numbers from text content
    extractNumbers(content) {
      const text = this.extractTextContent(content);
      const numberPattern = /\b\d+(?:\.\d+)?\b/g;
      const matches = text.match(numberPattern);
      return matches ? matches.map(match => parseFloat(match)) : [];
    },

    // Check if any number in the content matches the condition
    evaluateNumberCondition(content, condition) {
      const conditionObj = this.parseNumberCondition(condition);
      if (!conditionObj) return false;
      
      const numbers = this.extractNumbers(content);
      return numbers.some(num => conditionObj.evaluate(num));
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

      return currencySymbol + ' ' + new Intl.NumberFormat(locale, {
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

  // Add the formatted-rich-text component with enhanced conditional formatting
  editor.DomComponents.addType('formatted-rich-text', {
    model: {
      defaults: {
        tagName: 'div',
        draggable: true,
        droppable: false,
        editable: false,
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
          },
          {
            type: 'text',
            name: 'my-input-json',
            label: 'Json Path',
            changeProp: 1
          },
          {
            type: 'text',
            name: 'hide-words',
            label: 'Hide Words/Conditions',
            placeholder: 'Examples:\n• word1, word2, phrase\n• <1000 (hide if any number < 1000)\n• >=500 (hide if any number >= 500)\n• 100<value<1000 (hide if any number between 100-1000)',
            changeProp: 1
          },
          {
            type: 'text',
            name: 'highlight-words',
            label: 'Highlight Words/Conditions',
            placeholder: 'Examples:\n• word1, word2, phrase\n• >1000 (highlight if any number > 1000)\n• <=100 (highlight if any number <= 100)\n• 50<=value<=200 (highlight if any number between 50-200)',
            changeProp: 1
          },
          {
            type: 'color',
            name: 'highlight-color',
            label: 'Highlight Color',
            changeProp: 1
          }
        ],
        'format-type': 'text',
        'format-pattern': 'None',
        'raw-content': 'Insert your text here',
        'is-editing': false,
        'hide-words': '',
        'highlight-words': '',
        'highlight-color': '#ffff00'
      },

      init() {
        this.on('change:format-type', this.handleFormatTypeChange);
        this.on('change:format-pattern', this.updateContent);
        this.on('change:hide-words', this.updateContent);
        this.on('change:highlight-words', this.updateContent);
        this.on('change:highlight-color', this.updateContent);
        this.on('change:my-input-json', this.handleJsonPathChange);
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
        this.updateContent();
        this.updateTooltip();
      },

      // FIXED: Enhanced handleJsonPathChange that works with your existing JSON system
handleJsonPathChange() {
  console.log('=== COMPONENT JSON PATH CHANGE ===');
  const jsonPath = this.get('my-input-json');
  console.log('JSON Path:', jsonPath);
  
  // CRITICAL FIX: Force stop RTE before updating
  if (this.view && this.view.rteActive) {
    console.log('RTE active, forcing stop before JSON update');
    this.view.stopRTE();
  }
  
  if (jsonPath && jsonPath.trim()) {
    try {
      const commonJson = JSON.parse(localStorage.getItem("common_json"));
      const fullJsonPath = `commonJson.${custom_language}.${jsonPath}`;
      const value = eval(fullJsonPath);
      console.log('Evaluated value:', value);
      
      if (value !== undefined && value !== null) {
        const stringValue = String(value);
        console.log('Setting raw-content to:', stringValue);
        
        // Set raw-content and trigger immediate update
        this.set('raw-content', stringValue, { silent: true });
        this.updateContent();
        console.log('Content updated');
        
        // CRITICAL FIX: Force immediate view update
        if (this.view && this.view.el) {
          this.view.render();
          console.log('View rendered immediately');
          
          // Force canvas refresh
          if (this.em) {
            this.em.trigger('change:canvasOffset');
          }
        }
      }
    } catch (e) {
      console.error("Error evaluating JSON path:", e);
    }
  }
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

      // Helper method to escape regex special characters
      escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      },

      // FIXED: Improved conditional formatting with better content preservation
      applyConditionalFormatting(content) {
        // FIXED: Return early if content is empty or null
        if (!content || typeof content !== 'string') {
          return content || '';
        }

        let processedContent = content;
        const hideWords = this.get('hide-words') || '';
        const highlightWords = this.get('highlight-words') || '';
        const highlightColor = this.get('highlight-color') || '#ffff00';

        // FIXED: Clean up existing conditional formatting more precisely
        // Only remove spans that were specifically added by our conditional formatting
        processedContent = processedContent.replace(/<span class="hidden-word"[^>]*>.*?<\/span>/gi, '');
        processedContent = processedContent.replace(/<span class="highlighted-word"[^>]*>(.*?)<\/span>/gi, '$1');

        // FIXED: Early return if no conditions to preserve content integrity
        const hasHideConditions = hideWords.trim().length > 0;
        const hasHighlightConditions = highlightWords.trim().length > 0;
        
        if (!hasHideConditions && !hasHighlightConditions) {
          return processedContent;
        }

        // Apply hide functionality with conditional support
        if (hasHideConditions) {
          const conditions = hideWords.split(',').map(cond => cond.trim()).filter(cond => cond);
          
          conditions.forEach(condition => {
            if (condition) {
              // Check if it's a number condition
              if (formatHelpers.isNumberCondition(condition)) {
                // Apply number condition logic
                if (formatHelpers.evaluateNumberCondition(processedContent, condition)) {
                  // Hide the entire text block by wrapping it
                  processedContent = `<span class="hidden-word" style="display: none;">${processedContent}</span>`;
                }
              } else {
                // Apply word-based hiding (existing logic)
                const escapedWord = this.escapeRegex(condition);
                const regex = new RegExp(`\\b${escapedWord}\\b`, 'gi');
                processedContent = processedContent.replace(regex, 
                  `<span class="hidden-word" style="display: none;">${condition}</span>`
                );
              }
            }
          });
        }

        // Apply highlight functionality with conditional support
        if (hasHighlightConditions) {
          const conditions = highlightWords.split(',').map(cond => cond.trim()).filter(cond => cond);
          
          conditions.forEach(condition => {
            if (condition) {
              // Check if it's a number condition
              if (formatHelpers.isNumberCondition(condition)) {
                // Apply number condition logic
                if (formatHelpers.evaluateNumberCondition(processedContent, condition)) {
                  // Highlight numbers that meet the condition
                  const numbers = formatHelpers.extractNumbers(processedContent);
                  const conditionObj = formatHelpers.parseNumberCondition(condition);
                  
                  if (conditionObj) {
                    numbers.forEach(num => {
                      if (conditionObj.evaluate(num)) {
                        const escapedNum = this.escapeRegex(num.toString());
                        const regex = new RegExp(`\\b${escapedNum}\\b`, 'g');
                        processedContent = processedContent.replace(regex, 
                          `<span class="highlighted-word" style="background-color: ${highlightColor}; padding: 1px 2px; border-radius: 2px;">${num}</span>`
                        );
                      }
                    });
                  }
                }
              } else {
                // Apply word-based highlighting (existing logic)
                const escapedWord = this.escapeRegex(condition);
                // FIXED: Improved regex to avoid double-wrapping
                const regex = new RegExp(`(?!<[^>]*?>)\\b(${escapedWord})\\b(?![^<]*?<\/span>)`, 'gi');
                processedContent = processedContent.replace(regex, 
                  `<span class="highlighted-word" style="background-color: ${highlightColor}; padding: 1px 2px; border-radius: 2px;">$1</span>`
                );
              }
            }
          });
        }

        return processedContent;
      },

      // FIXED: Enhanced updateContent method with better state management
      updateContent() {
        const formatType = this.get('format-type') || 'text';
        const pattern = this.get('format-pattern') || 'None';
        let rawContent = this.get('raw-content') || '';

        // FIXED: Ensure rawContent is always a string and handle edge cases
        if (typeof rawContent !== 'string') {
          rawContent = String(rawContent);
        }

        // FIXED: Store previous content to check for actual changes
        const previousContent = this.get('content');

        let formattedContent;
        
        if (formatType === 'text' || pattern === 'None') {
          formattedContent = rawContent;
        } else {
          try {
            formattedContent = formatHelpers.applyFormat(rawContent, formatType, pattern);
          } catch (error) {
            console.warn('Format error:', error);
            formattedContent = rawContent;
          }
        }

        // Apply conditional formatting (show/hide and highlight)
        const finalContent = this.applyConditionalFormatting(formattedContent);
        
        // FIXED: Only update if content actually changed to prevent infinite loops
        if (finalContent !== previousContent) {
          this.set('content', finalContent);
        }
      },

      // FIXED: Add method to handle external JSON updates
      updateFromJsonPath(jsonPath) {
        if (jsonPath && jsonPath.trim()) {
          this.set('my-input-json', jsonPath, { silent: true });
          this.handleJsonPathChange();
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
        this.listenTo(this.model, 'change:content', this.render);
        this.rteActive = false;
      },

      handleSingleClick(e) {
        // Allow normal GrapesJS selection behavior on single click
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
  console.log('=== DOUBLE CLICK DETECTED ===');
  e.preventDefault();
  e.stopPropagation();

  // Check if already in RTE mode
  if (this.rteActive) {
    console.log('RTE already active, ignoring double click');
    return;
  }

  // Check if content is hidden
  const hideWords = this.model.get('hide-words') || '';
  if (hideWords.trim()) {
    const content = this.model.get('content') || '';
    if (content.includes('class="hidden-word"') && content.includes('display: none')) {
      console.log('Content is hidden, cannot edit');
      return;
    }
  }

  console.log('Enabling RTE...');
  this.model.enableRTE();
},

      startRTE() {
  console.log('=== STARTING RTE ===');
  
  if (this.rteActive) {
    console.log('RTE already active, aborting start');
    return;
  }

  const em = this.model.em;
  if (!em) {
    console.log('No editor manager found');
    return;
  }

  const rte = em.get('RichTextEditor');
  if (!rte) {
    console.log('No RTE found');
    return;
  }

  console.log('Setting rteActive to true');
  this.rteActive = true;

  // Store original actions
  this.originalActions = rte.getAll().slice();
  console.log('Stored original actions:', this.originalActions.length);
  
  // Clear existing actions
  this.originalActions.forEach(action => {
    try {
      rte.remove(action.name);
    } catch (e) {
      console.log('Error removing action:', action.name);
    }
  });

  // Add custom actions
  customRteActions.forEach(action => {
    try {
      rte.add(action.name, action);
    } catch (e) {
      console.log('Error adding action:', action.name);
    }
  });

  // Set content from raw content for editing
  const rawContent = this.model.get('raw-content') || '';
  console.log('Setting element content to raw content:', rawContent);
  this.el.innerHTML = rawContent;

  // Enable RTE
  try {
    console.log('Enabling RTE on element');
    rte.enable(this, null, { 
      actions: customRteActions.map(a => a.name)
    });
    console.log('RTE enabled successfully');
  } catch (e) {
    console.error('RTE enable error:', e);
  }

  // Enhanced content change handler
  this.rteChangeHandler = () => {
    const content = this.el.innerHTML;
    console.log("Content changed in RTE:", content);
    this.model.set('raw-content', content, { silent: true });
  };

  console.log('Adding event listeners');
  this.el.addEventListener('input', this.rteChangeHandler);
  this.el.addEventListener('blur', this.handleRTEBlur.bind(this));
  
  // Add escape key handler
  this.escapeHandler = (e) => {
    if (e.key === 'Escape') {
      console.log('Escape key pressed, closing RTE');
      this.handleRTEBlur();
    }
  };
  document.addEventListener('keydown', this.escapeHandler);
  
  console.log('RTE startup complete');
},

      stopRTE() {
  console.log('=== STOPPING RTE ===');
  
  if (!this.rteActive) {
    console.log('RTE not active, nothing to stop');
    return;
  }

  const em = this.model.em;
  if (!em) {
    console.log('No editor manager found');
    return;
  }

  const rte = em.get('RichTextEditor');
  if (!rte) {
    console.log('No RTE found');
    return;
  }

  console.log('Setting rteActive to false');
  this.rteActive = false;

  // Remove event listeners
  if (this.rteChangeHandler) {
    console.log('Removing event listeners');
    this.el.removeEventListener('input', this.rteChangeHandler);
    this.el.removeEventListener('blur', this.handleRTEBlur);
    this.rteChangeHandler = null;
  }

  // Remove escape key handler
  if (this.escapeHandler) {
    console.log('Removing escape key handler');
    document.removeEventListener('keydown', this.escapeHandler);
    this.escapeHandler = null;
  }

  // Disable RTE
  try {
    console.log('Disabling RTE');
    rte.disable(this);
    console.log('RTE disabled successfully');
  } catch (e) {
    console.error('RTE disable error:', e);
  }

  // Restore original actions
  if (this.originalActions) {
    console.log('Restoring original actions');
    
    // Remove custom actions first
    customRteActions.forEach(action => {
      try {
        rte.remove(action.name);
      } catch (e) {
        console.log('Error removing custom action:', action.name);
      }
    });

    // Add back original actions
    this.originalActions.forEach(action => {
      try {
        rte.add(action.name, action);
      } catch (e) {
        console.log('Error restoring action:', action.name);
      }
    });
    
    this.originalActions = null;
    console.log('Original actions restored');
  }

  // Ensure element is not editable
  console.log('Setting contentEditable to false');
  this.el.contentEditable = false;
  
  console.log('RTE stop complete');
},

forceStopRTE() {
  console.log('=== FORCE STOP RTE ===');
  if (this.view && this.view.rteActive) {
    console.log('Forcing RTE to stop');
    this.view.stopRTE();
    this.set('is-editing', false, { silent: true });
  }
},
      handleRTEBlur() {
  console.log('=== RTE BLUR TRIGGERED ===');
  
  const content = this.el.innerHTML;
  console.log('Content on blur:', content);
  
  const formatType = this.model.get('format-type');
  console.log('Format type:', formatType);
  
  // Validate format before applying
  const validation = formatHelpers.validateFormat(content, formatType);
  
  if (!validation.valid) {
    console.log('Validation failed:', validation.error);
    alert(validation.error);
    // Revert to previous content
    const previousContent = this.model.get('raw-content');
    this.el.innerHTML = previousContent;
  } else {
    console.log('Validation passed, updating content');
    this.model.set('raw-content', content, { silent: true });
    this.model.updateContent();
  }
  
  // Disable editing
  console.log('Disabling RTE from blur handler');
  this.model.disableRTE();
},

onRender() {
  console.log('=== VIEW RENDER ===');
  console.log('RTE Active:', this.rteActive);
  
  // Ensure element is not editable by default
  this.el.contentEditable = false;
  
  // Set tooltip based on format type
  const formatType = this.model.get('format-type') || 'text';
  const label = getFormatLabel(formatType);
  this.el.setAttribute('title', label);
  
  // Get current content
  const content = this.model.get('content') || '';
  console.log('Content to render:', content);
  console.log('Current element innerHTML:', this.el.innerHTML);
  
  // CRITICAL FIX: Always update content if not in RTE mode
  if (!this.rteActive) {
    console.log('Updating element innerHTML (not in RTE mode)');
    this.el.innerHTML = content;
  } else {
    console.log('Skipping innerHTML update - RTE is active');
  }
},
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
      position: relative;
      padding: 12px;
      border: 1px solid transparent;
      background: transparent;
      transition: all 0.2s ease;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    [data-gjs-type="formatted-rich-text"]:hover {

    }
    
    [data-gjs-type="formatted-rich-text"][contenteditable="true"] {
      border: 1px dashed #007bff;
      cursor: text;
    }
    
    .gjs-selected[data-gjs-type="formatted-rich-text"] {
      outline: 2px solid #3498db !important;
      background-color: rgba(52, 152, 219, 0.1);
    }
    
    [data-gjs-type="formatted-rich-text"] a {
      color: #007bff;
      text-decoration: underline;
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
    
    /* Conditional formatting styles */
    [data-gjs-type="formatted-rich-text"] .hidden-word {
      display: none !important;
    }
    
    [data-gjs-type="formatted-rich-text"] .highlighted-word {
      border-radius: 2px;
      padding: 1px 2px;
      transition: background-color 0.2s ease;
    }
    
    [data-gjs-type="formatted-rich-text"] .highlighted-word:hover {
      opacity: 0.8;
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
    }
    
    /* Editing state indicator */
    [data-gjs-type="formatted-rich-text"][contenteditable="true"]::before {
      position: absolute;
      top: -20px;
      left: 0;
      font-size: 10px;
      color: white;
      padding: 2px 6px;
      border-radius: 3px;
      z-index: 1000;
    }
    
    /* Trait textarea styling for better UX */
    .gjs-pn-panel .gjs-pn-buttons textarea[name="hide-words"],
    .gjs-pn-panel .gjs-pn-buttons textarea[name="highlight-words"] {
      min-height: 80px;
      font-family: monospace;
      font-size: 12px;
      line-height: 1.4;
      resize: vertical;
    }
  `);

  console.log('Enhanced Formatted Rich Text component with conditional number formatting initialized successfully!');
  
  // Return helper functions for external use
  return {
    formatHelpers,
    customRteActions,
    getAllFormatOptions,
    
    // Additional utility methods for conditional formatting
    utils: {
      // Test if a condition string is valid
      isValidCondition(condition) {
        return formatHelpers.isNumberCondition(condition) || condition.trim().length > 0;
      },
      
      // Parse a condition and return its type and details
      parseCondition(condition) {
        if (formatHelpers.isNumberCondition(condition)) {
          return {
            type: 'number',
            details: formatHelpers.parseNumberCondition(condition)
          };
        }
        return {
          type: 'text',
          details: { value: condition.trim() }
        };
      },
      
      // Evaluate a condition against content
      evaluateCondition(content, condition) {
        if (formatHelpers.isNumberCondition(condition)) {
          return formatHelpers.evaluateNumberCondition(content, condition);
        }
        // For text conditions, check if the word exists
        const text = formatHelpers.extractTextContent(content);
        return text.toLowerCase().includes(condition.toLowerCase());
      }
    }
  };
}