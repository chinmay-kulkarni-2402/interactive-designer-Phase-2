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
      patterns: ['0', '0.0', '0.00', '#,###', '#,###.##', '#,##,###', '#,##,###.##', '#,##,###.###'],
      defaultPattern: '#,##,###',
      icon: '🔢'
    },
    currency: {
      label: 'Currency',
      patterns: ['$ 0', '$ 0.00', '₹ 0.00', '₹ 0', '¥ 0', '£ 0.00', '€ 0.00', 'IDR 0.000', 'OMR 0.000'],
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
          case '#,##,###.###':
          return new Intl.NumberFormat('en-IN', { minimumFractionDigits: 3 }).format(num);
        default:
          return num.toString();
      }
    },

    formatCurrency(value, pattern) {
  const num = this.parseNumber(value);
  // Extract currency symbol or code (leading non-digit, non-space part)
  const symbolMatch = pattern.match(/^([^\d\s]+|[A-Z]{3})\s*/);
  const currencySymbol = symbolMatch ? symbolMatch[1] : '';
  // Determine decimal places from pattern (e.g., '.00' -> 2, '.000' -> 3)
  const decimalsMatch = pattern.match(/\.0+/);
  const decimals = decimalsMatch ? decimalsMatch[0].length - 1 : 0;

  let locale;
  let options = {
    minimumFractionDigits: decimals > 0 ? decimals : 0,
    maximumFractionDigits: decimals > 0 ? decimals : 0,
    useGrouping: true
  };

  if (currencySymbol === '₹') {
    // Indian numbering system: en-IN already uses 00,00,000 grouping
    locale = 'en-IN';
  } else if (currencySymbol === 'IDR') {
    // Indonesian formatting: use id-ID (dot as thousand separator, comma as decimal)
    locale = 'id-ID';
  } else {
    // Default western grouping
    locale = 'en-US';
  }

  const formattedNumber = new Intl.NumberFormat(locale, options).format(num);

  // For symbols like 'OMR' (three-letter code), keep as-is; others prepend with space
  const separator = /^[A-Z]{3}$/.test(currencySymbol) ? ' ' : ' ';
  return currencySymbol + separator + formattedNumber;
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
    
    return options;
  }

  // Get format label for hover tooltip
  function getFormatLabel(formatType) {
    if (formatConfigs[formatType]) {
      return formatConfigs[formatType].label;
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
            placeholder: 'Examples: word1, word2, <1000, >=500',
            changeProp: 1
          },
          {
            type: 'select',
            name: 'highlight-condition-type',
            label: 'Highlight Condition',
            options: [
              { value: '', label: 'Select Condition Type' },
              { value: 'contains', label: 'Text: Contains' },
              { value: 'starts-with', label: 'Text: Starts With' },
              { value: 'ends-with', label: 'Text: Ends With' },
              { value: '>', label: 'Number: > (Greater than)' },
              { value: '>=', label: 'Number: >= (Greater than or equal)' },
              { value: '<', label: 'Number: < (Less than)' },
              { value: '<=', label: 'Number: <= (Less than or equal)' },
              { value: '=', label: 'Number: = (Equal to)' },
              { value: '!=', label: 'Number: != (Not equal to)' },
              { value: 'between', label: 'Number: Between (range)' }
            ],
            changeProp: 1
          },
          {
            type: 'text',
            name: 'highlight-words',
            label: 'Highlight Words/Conditions',
            placeholder: 'Examples: word1, word2, >1000, <=100',
            changeProp: 1
          },
          {
            type: 'color',
            name: 'highlight-color',
            label: 'Highlight Color',
            changeProp: 1
          },
        ],
        'format-type': 'text',
        'format-pattern': 'None',
        'raw-content': 'Insert your text here',
        'is-editing': false,
        'hide-words': '',
        'highlight-condition-type': '',
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
        this.on('change:highlight-condition-type', this.updateContent);
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

      handleJsonPathChange() {
        console.log('=== COMPONENT JSON PATH CHANGE ===');
        const jsonPath = this.get('my-input-json');
        console.log('JSON Path:', jsonPath);
        
        // FIXED: Force stop RTE before updating
        if (this.view && this.view.rteActive) {
          console.log('RTE active, forcing stop before JSON update');
          this.view.forceStopRTE();
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
              
              this.set('raw-content', stringValue, { silent: true });
              this.updateContent();
              console.log('Content updated');
              
              if (this.view && this.view.el) {
                this.view.render();
                console.log('View rendered immediately');
                
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
        const config = formatConfigs[formatType];
        
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

      escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      },

applyConditionalFormatting(content) {
  if (!content || typeof content !== 'string') {
    return content || '';
  }

  let processedContent = content;
  const hideWords = this.get('hide-words') || '';
  const highlightWords = this.get('highlight-words') || '';
  const highlightColor = this.get('highlight-color') || '#ffff00';
  const highlightConditionType = this.get('highlight-condition-type') || '';

  processedContent = processedContent.replace(/<span class="hidden-word"[^>]*>.*?<\/span>/gi, '');
  processedContent = processedContent.replace(/<span class="highlighted-word"[^>]*>(.*?)<\/span>/gi, '$1');

  const hasHideConditions = hideWords.trim().length > 0;
  const hasHighlightConditions = highlightWords.trim().length > 0;
  
  if (!hasHideConditions && !hasHighlightConditions) {
    return processedContent;
  }

  if (hasHideConditions) {
    const conditions = hideWords.split(',').map(cond => cond.trim()).filter(cond => cond);
    
    conditions.forEach(condition => {
      if (condition) {
        if (formatHelpers.isNumberCondition(condition)) {
          if (formatHelpers.evaluateNumberCondition(processedContent, condition)) {
            processedContent = `<span class="hidden-word" style="display: none;">${processedContent}</span>`;
          }
        } else {
          const escapedWord = this.escapeRegex(condition);
          const regex = new RegExp(`\\b${escapedWord}\\b`, 'gi');
          processedContent = processedContent.replace(regex, 
            `<span class="hidden-word" style="display: none;">${condition}</span>`
          );
        }
      }
    });
  }

  if (hasHighlightConditions) {
    const conditions = highlightWords.split(',').map(cond => cond.trim()).filter(cond => cond);
    
    conditions.forEach(condition => {
      if (condition) {
        // Check if it's a number condition based on highlight condition type
        const isNumberConditionType = ['>', '>=', '<', '<=', '=', '!=', 'between'].includes(highlightConditionType);
        
        if (isNumberConditionType) {
          // For number conditions, handle based on condition type
          if (highlightConditionType === 'between') {
            // For 'between', expect format like "100 < value < 1000" or "100 <= value <= 1000"
            if (formatHelpers.isNumberCondition(condition)) {
              if (formatHelpers.evaluateNumberCondition(processedContent, condition)) {
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
            }
          } else {
            // For other number conditions (>, >=, <, <=, =, !=)
            // Create the condition string using the type and value
            const conditionString = highlightConditionType + condition;
            
            if (formatHelpers.isNumberCondition(conditionString)) {
              if (formatHelpers.evaluateNumberCondition(processedContent, conditionString)) {
                const numbers = formatHelpers.extractNumbers(processedContent);
                const conditionObj = formatHelpers.parseNumberCondition(conditionString);
                
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
            }
          }
        } else {
          // Text-based highlighting (contains, starts-with, ends-with, or default)
          let regex;
          
          if (highlightConditionType === 'contains') {
            const escapedWord = this.escapeRegex(condition);
            regex = new RegExp(`(?!<[^>]*?>)\\b(\\w*${escapedWord}\\w*)\\b(?![^<]*?<\\/span>)`, 'gi');
          } else if (highlightConditionType === 'starts-with') {
            const escapedWord = this.escapeRegex(condition);
            regex = new RegExp(`(?!<[^>]*?>)\\b(${escapedWord}\\w*)(?![^<]*?<\/span>)`, 'gi');
          } else if (highlightConditionType === 'ends-with') {
            const escapedWord = this.escapeRegex(condition);
            regex = new RegExp(`(?!<[^>]*?>)\\b(\\w*${escapedWord})\\b(?![^<]*?<\/span>)`, 'gi');
          } else {
            // Default behavior (exact word match)
            const escapedWord = this.escapeRegex(condition);
            regex = new RegExp(`(?!<[^>]*?>)\\b(${escapedWord})\\b(?![^<]*?<\/span>)`, 'gi');
          }
          
          processedContent = processedContent.replace(regex, 
            `<span class="highlighted-word" style="background-color: ${highlightColor}; padding: 1px 2px; border-radius: 2px;">$1</span>`
          );
        }
      }
    });
  }

  return processedContent;
},

      updateContent() {
  const formatType = this.get('format-type') || 'text';
  const pattern = this.get('format-pattern') || 'None';
  let rawContent = this.get('raw-content') || '';

  if (typeof rawContent !== 'string') {
    rawContent = String(rawContent);
  }

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

  const finalContent = this.applyConditionalFormatting(formattedContent);
  
  if (finalContent !== previousContent) {
    this.set('content', finalContent);
    // FIXED: Update raw-content to match when formatting is applied
    if (formatType !== 'text' && pattern !== 'None') {
      this.set('raw-content', formatHelpers.extractTextContent(finalContent), { silent: true });
    }
  }
},

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
        this.rteTimeout = null;
      },

      handleSingleClick(e) {
  // Check if the clicked element is a link or inside a link
  const clickedElement = e.target;
  const linkElement = clickedElement.closest('a');
  
  if (linkElement) {
    // Prevent the event from bubbling up to avoid selecting the text component
    e.stopPropagation();
    
    // Get the editor manager
    const em = this.model.em;
    if (!em) return;
    
    // Create a temporary DOM component for the link
    const linkComponent = {
      tagName: 'a',
      attributes: {
        href: linkElement.getAttribute('href') || '',
        target: linkElement.getAttribute('target') || '_self'
      },
      content: linkElement.innerHTML
    };
    
    // Create traits for the link
    const linkTraits = [
      {
        type: 'text',
        name: 'href',
        label: 'Href',
        value: linkElement.getAttribute('href') || ''
      },
      {
        type: 'select',
        name: 'target',
        label: 'Target',
        options: [
          { value: '_self', label: 'This window' },
          { value: '_blank', label: 'New window' }
        ],
        value: linkElement.getAttribute('target') || '_self'
      }
    ];
    
    // Show the traits panel with link-specific traits
    const traitManager = em.get('TraitManager');
    if (traitManager) {
      // Clear existing traits
      traitManager.getCurrent().forEach(trait => {
        traitManager.removeTrait(trait.get('name'));
      });
      
      // Add link traits
      linkTraits.forEach(traitConfig => {
        const trait = traitManager.addTrait(traitConfig);
        
        // Handle trait changes
        trait.on('change:value', () => {
          const traitName = trait.get('name');
          const traitValue = trait.get('value');
          
          // Update the actual link element
          if (traitName === 'href') {
            linkElement.setAttribute('href', traitValue);
          } else if (traitName === 'target') {
            linkElement.setAttribute('target', traitValue);
          }
          
          // Update the model's raw content
          this.model.set('raw-content', this.el.innerHTML, { silent: true });
        });
      });
      
      // Trigger trait update
      traitManager.trigger('update');
    }
    
    return;
  }
  
  // If not clicking on a link, allow normal GrapesJS selection behavior
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

  // FIXED: Clear any pending timeout
  if (this.rteTimeout) {
    clearTimeout(this.rteTimeout);
    this.rteTimeout = null;
  }

  // FIXED: Force stop any existing RTE first
  if (this.rteActive) {
    console.log('RTE already active, forcing stop first');
    this.forceStopRTE();
    // Wait a bit before starting new RTE session
    setTimeout(() => {
      this.model.enableRTE();
    }, 100);
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

  // FIXED: Set state immediately to prevent double initialization
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

  // FIXED: Proper content handling for editing
  const rawContent = this.model.get('raw-content') || '';
  console.log('Raw content for editing:', rawContent);
  
  // Set element content to raw content for editing
  this.el.innerHTML = rawContent;
  
  // FIXED: Make element editable BEFORE enabling RTE
  this.el.contentEditable = true;

  // Enable RTE with enhanced configuration
  try {
    console.log('Enabling RTE on element');
    rte.enable(this, null, { 
      actions: customRteActions.map(a => a.name),
      styleWithCSS: false
    });
    console.log('RTE enabled successfully');
  } catch (e) {
    console.error('RTE enable error:', e);
    this.rteActive = false;
    this.el.contentEditable = false;
    return;
  }

  // FIXED: Enhanced content change handler with debouncing
  this.rteChangeHandler = this.debounce(() => {
    const content = this.el.innerHTML;
    console.log("Content changed in RTE:", content);
    this.model.set('raw-content', content, { silent: true });
  }, 150);

  console.log('Adding event listeners');
  this.el.addEventListener('input', this.rteChangeHandler);
  this.el.addEventListener('paste', this.handleRTEPaste.bind(this));
  
  // FIXED: Add global click handler to detect outside clicks
// In startRTE, replace the globalClickHandler assignment:
this.globalClickHandler = (e) => {
  if (!this.el.contains(e.target) && !e.target.closest('.gjs-rte-toolbar')) {
    console.log('Clicked outside, stopping RTE');
    this.handleRTEExit(); // Changed from handleRTEFocusOut
  }
};

// And update escape handler:
this.escapeHandler = (e) => {
  if (e.key === 'Escape') {
    console.log('Escape key pressed, closing RTE');
    this.handleRTEExit(); // Changed from handleRTEFocusOut
  }
};
  
  // FIXED: Add event listeners with proper timing
  setTimeout(() => {
    document.addEventListener('click', this.globalClickHandler);
    document.addEventListener('keydown', this.escapeHandler);
  }, 100);
  
  // FIXED: Focus the element with proper timing and cursor positioning
  setTimeout(() => {
    if (this.rteActive && this.el) {
      this.el.focus();
      
      // FIXED: Set cursor to end of content
      const range = document.createRange();
      const selection = window.getSelection();
      
      // Find the last text node
      const walker = document.createTreeWalker(
        this.el,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      let lastTextNode = null;
      let node;
      while (node = walker.nextNode()) {
        lastTextNode = node;
      }
      
      if (lastTextNode) {
        range.setStart(lastTextNode, lastTextNode.textContent.length);
        range.setEnd(lastTextNode, lastTextNode.textContent.length);
      } else {
        // If no text nodes, set range to end of element
        range.selectNodeContents(this.el);
        range.collapse(false);
      }
      
      selection.removeAllRanges();
      selection.addRange(range);
      
      console.log('Element focused with cursor positioned');
    }
  }, 200);
  
  console.log('RTE startup complete');
},

      // FIXED: Add debounce utility function
      debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
          const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
          };
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
        };
      },

      // FIXED: Handle paste events properly
      handleRTEPaste(e) {
        console.log('Paste event detected');
        // Let the default paste happen, then update raw content
        setTimeout(() => {
          const content = this.el.innerHTML;
          console.log("Content after paste:", content);
          this.model.set('raw-content', content, { silent: true });
        }, 10);
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

  // FIXED: Set state immediately to prevent race conditions
  this.rteActive = false;

  // Remove event listeners first
  if (this.rteChangeHandler) {
    console.log('Removing event listeners');
    this.el.removeEventListener('input', this.rteChangeHandler);
    this.el.removeEventListener('paste', this.handleRTEPaste);
    this.rteChangeHandler = null;
  }

  // FIXED: Remove global event handlers
  if (this.globalClickHandler) {
    console.log('Removing global click handler');
    document.removeEventListener('click', this.globalClickHandler);
    this.globalClickHandler = null;
  }

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

  // FIXED: Clear any pending timeouts
  if (this.rteTimeout) {
    clearTimeout(this.rteTimeout);
    this.rteTimeout = null;
  }

  // FIXED: Ensure element is properly reset
  this.el.contentEditable = false;
  this.el.blur();
  
  console.log('RTE stop complete');
},

      // FIXED: Force stop method for external calls
      forceStopRTE() {
  console.log('=== FORCE STOP RTE ===');
  if (this.rteActive) {
    console.log('Forcing RTE to stop');
    
    // FIXED: Clear timeouts before stopping
    if (this.rteTimeout) {
      clearTimeout(this.rteTimeout);
      this.rteTimeout = null;
    }
    
    this.stopRTE();
    this.model.set('is-editing', false, { silent: true });
    
    // FIXED: Ensure element state is reset
    if (this.el) {
      this.el.contentEditable = false;
      this.el.blur();
    }
  }
},

      // FIXED: Use focusout instead of blur for better handling
      // FIXED: Remove handleRTEFocusOut method completely and replace with this simpler version
handleRTEExit() {
  console.log('=== RTE EXIT TRIGGERED ===');
  
  if (!this.rteActive) {
    console.log('RTE already inactive, ignoring exit');
    return;
  }
  
  const content = this.el.innerHTML;
  console.log('Content on exit:', content);
  
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
  console.log('Disabling RTE from exit handler');
  this.model.disableRTE();
},

      // FIXED: Enhanced render method
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
        
        // FIXED: Only update content if not in RTE mode and content has changed
        if (!this.rteActive) {
          if (this.el.innerHTML !== content) {
            console.log('Updating element innerHTML (not in RTE mode)');
            this.el.innerHTML = content;
          }
        } else {
          console.log('Skipping innerHTML update - RTE is active');
        }
        
        // FIXED: Ensure proper styling
        this.el.style.minHeight = '40px';
        this.el.style.padding = '12px';
        this.el.style.wordWrap = 'break-word';
        this.el.style.overflowWrap = 'break-word';
      },

      // FIXED: Override destroy method to cleanup
      destroy() {
        console.log('=== VIEW DESTROY ===');
        
        // Force stop RTE if active
        if (this.rteActive) {
          this.forceStopRTE();
        }
        
        // Clear any pending timeouts
        if (this.rteTimeout) {
          clearTimeout(this.rteTimeout);
          this.rteTimeout = null;
        }
        
        // Call parent destroy
        if (this.constructor.__super__ && this.constructor.__super__.destroy) {
          this.constructor.__super__.destroy.apply(this, arguments);
        }
      }
    }
  });

  // Add component to blocks
  // editor.BlockManager.add('formatted-rich-text', {
  //   label: 'Text',
  //   content: {
  //     type: 'formatted-rich-text',
  //     content: 'Double-click to edit rich text content'
  //   },
  //   category: 'Text',
  //   attributes: {
  //     class: 'gjs-block-formatted-rich-text'
  //   }
  // });

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
      cursor: pointer;
    }
    
    [data-gjs-type="formatted-rich-text"]:hover {
      background-color: rgba(0, 123, 255, 0.05);
      border-color: rgba(0, 123, 255, 0.2);
    }
    
    [data-gjs-type="formatted-rich-text"][contenteditable="true"] {
      border: 2px dashed #007bff !important;
      background-color: rgba(0, 123, 255, 0.1) !important;
      cursor: text;
      outline: none;
    }
    
    [data-gjs-type="formatted-rich-text"][contenteditable="true"]:focus {
      border-color: #0056b3 !important;
      background-color: rgba(0, 123, 255, 0.15) !important;
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
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
    
    /* Loading state */
    [data-gjs-type="formatted-rich-text"].loading {
      opacity: 0.7;
      pointer-events: none;
    }
    
    [data-gjs-type="formatted-rich-text"].loading::after {
      content: "Loading...";
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 12px;
      color: #666;
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
      transition: transform 0.2s ease;
    }
    
    .gjs-block-formatted-rich-text:hover {
      transform: translateY(-2px);
    }
    
    /* RTE Toolbar Enhancement */
    .gjs-rte-toolbar {
      z-index: 10000 !important;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      border-radius: 4px;
    }
    
    .gjs-rte-action {
      transition: all 0.2s ease;
    }
    
    .gjs-rte-action:hover {
      background-color: rgba(0, 123, 255, 0.1);
    }
    
    /* Editing state indicator */
    [data-gjs-type="formatted-rich-text"][contenteditable="true"]::before {
      content: "✏️ Editing";
      position: absolute;
      top: -25px;
      left: 0;
      background: #007bff;
      color: white;
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 3px;
      z-index: 1000;
      white-space: nowrap;
    }
    
    /* Better visual feedback */
    [data-gjs-type="formatted-rich-text"].format-error {
      border-color: #dc3545 !important;
      background-color: rgba(220, 53, 69, 0.1) !important;
    }
    
    [data-gjs-type="formatted-rich-text"].format-success {
      border-color: #28a745 !important;
      background-color: rgba(40, 167, 69, 0.1) !important;
    }
  `);

  console.log('Text component initialized successfully!');
  
}