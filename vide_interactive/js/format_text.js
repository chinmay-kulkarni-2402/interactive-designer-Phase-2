function addFormattedRichTextComponent(editor) {

  const FormulaParser = HyperFormula.HyperFormula;

  // Create a HyperFormula instance for formula evaluation
  const formulaEngine = HyperFormula.buildEmpty({
    licenseKey: 'gpl-v3'
  });

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
      patterns: [
        '$ 0', '$ 0.00',           // USA, Canada
        '₹ 0.00', '₹ 0',           // India (existing)
        '¥ 0', '£ 0.00', '€ 0.00', // Existing
        'IDR 0.000',               // Indonesia (existing)
        'OMR 0.000',               // Oman (existing)
        'R 0.00',                  // South Africa (ZAR)
        '¥ 0.00',                  // China (CNY - different from JPY)
        'S$ 0.00',                 // Singapore (SGD)
        'RM 0.00',                 // Malaysia (MYR)
        'Rs. 0.00',                // Sri Lanka (LKR)
        'AED 0.00',                // UAE/Dubai (AED)
        'SR 0.00',                 // Saudi Arabia (SAR)
        '₽ 0.00'                   // Russia (RUB)
      ],
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

      const str = String(textContent).trim();

      // Handle Indonesian format (dots as thousands, comma as decimal)
      // Example: "1.234.567,89" should become 1234567.89
      if (str.includes('.') && str.includes(',')) {
        // Check if this looks like Indonesian format
        const lastComma = str.lastIndexOf(',');
        const lastDot = str.lastIndexOf('.');

        if (lastComma > lastDot) {
          // Indonesian format: dots for thousands, comma for decimal
          const cleanValue = str.replace(/\./g, '').replace(',', '.');
          const parsed = parseFloat(cleanValue.replace(/[^\d.-]/g, ''));
          return isNaN(parsed) ? 0 : parsed;
        }
      }

      // Handle standard format or other edge cases
      const cleanValue = str.replace(/[^\d.,-]/g, '');

      // If there are multiple dots and no comma, assume dots are thousand separators
      if (cleanValue.split('.').length > 2 && !cleanValue.includes(',')) {
        // Remove all dots except the last one (if it's followed by 1-3 digits)
        const parts = cleanValue.split('.');
        const lastPart = parts[parts.length - 1];

        if (lastPart.length <= 3) {
          // Last dot is decimal separator
          const wholePart = parts.slice(0, -1).join('');
          const parsed = parseFloat(wholePart + '.' + lastPart);
          return isNaN(parsed) ? 0 : parsed;
        } else {
          // All dots are thousand separators
          const parsed = parseFloat(parts.join(''));
          return isNaN(parsed) ? 0 : parsed;
        }
      }

      // Standard parsing for most formats
      const standardClean = cleanValue.replace(/,/g, ''); // Remove commas (thousand separators)
      const parsed = parseFloat(standardClean);
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
      const symbolMatch = pattern.match(/^([^\d\s]+|[A-Z]{2,3})\s*/);
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

      // Determine locale based on currency symbol
      if (currencySymbol === '₹') {
        // Indian numbering system: en-IN uses 00,00,000 grouping
        locale = 'en-IN';
      } else if (currencySymbol === 'IDR') {
        // Indonesian formatting: use id-ID (dots as thousands, comma as decimal)
        locale = 'id-ID';
      } else if (currencySymbol === 'R') {
        // South African Rand: use en-ZA
        locale = 'en-ZA';
      } else if (currencySymbol === '¥' && decimals === 2) {
        // Chinese Yuan (has decimals): use zh-CN
        locale = 'zh-CN';
      } else if (currencySymbol === '¥' && decimals === 0) {
        // Japanese Yen (no decimals): use ja-JP
        locale = 'ja-JP';
      } else if (currencySymbol === 'S$') {
        // Singapore Dollar: use en-SG
        locale = 'en-SG';
      } else if (currencySymbol === 'RM') {
        // Malaysian Ringgit: use ms-MY
        locale = 'ms-MY';
      } else if (currencySymbol === 'Rs.') {
        // Sri Lankan Rupee: use si-LK
        locale = 'si-LK';
      } else if (currencySymbol === 'AED') {
        // UAE Dirham: use ar-AE
        locale = 'ar-AE';
      } else if (currencySymbol === 'SR') {
        // Saudi Riyal: use ar-SA
        locale = 'ar-SA';
      } else if (currencySymbol === '₽') {
        // Russian Ruble: use ru-RU
        locale = 'ru-RU';
      } else if (currencySymbol === 'OMR') {
        // Omani Rial: use ar-OM
        locale = 'ar-OM';
      } else if (currencySymbol === '£') {
        // British Pound: use en-GB
        locale = 'en-GB';
      } else if (currencySymbol === '€') {
        // Euro: use de-DE
        locale = 'de-DE';
      } else {
        // Default western grouping (USD, CAD, etc.)
        locale = 'en-US';
      }

      let formattedNumber;

      // Special handling for Indonesian format
      if (currencySymbol === 'IDR') {
        // Indonesian uses dots for thousands and comma for decimal
        if (decimals > 0) {
          const integerPart = Math.floor(num);
          const decimalPart = (num - integerPart).toFixed(decimals).substring(2);

          // Format integer part with dots as thousand separators
          const integerFormatted = integerPart.toLocaleString('de-DE'); // German format uses dots for thousands
          formattedNumber = integerFormatted + ',' + decimalPart;
        } else {
          formattedNumber = Math.floor(num).toLocaleString('de-DE'); // Use dots for thousands
        }
      } else {
        // Use standard Intl.NumberFormat for other currencies
        formattedNumber = new Intl.NumberFormat(locale, options).format(num);
      }

      // For three-letter currency codes, use space separator; for symbols, use space
      const separator = ' ';
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
    },
    evaluateFormula(formulaString) {
      try {
        // Clean the formula string
        const cleanFormula = formulaString.trim();

        // Add the formula to the engine (row 0, col 0)
        formulaEngine.addSheet('calculations');
        const sheetId = formulaEngine.getSheetId('calculations');

        // Set the formula in cell A1
        formulaEngine.setCellContents({
          row: 0,
          col: 0,
          sheet: sheetId
        }, cleanFormula);

        // Get the calculated value
        const result = formulaEngine.getCellValue({
          row: 0,
          col: 0,
          sheet: sheetId
        });

        // Clean up
        formulaEngine.removeSheet(sheetId);

        return result;
      } catch (error) {
        console.error('Formula evaluation error:', error);
        return `#ERROR: ${error.message}`;
      }
    },

    isFormula(content) {
      const textContent = this.extractTextContent(content);
      return typeof textContent === 'string' && textContent.trim().startsWith('=');
    },

    processFormulaContent(content, isFormulaEnabled) {
      if (!isFormulaEnabled) {
        return content;
      }

      const textContent = this.extractTextContent(content);

      if (this.isFormula(textContent)) {
        const formulaString = textContent.trim();
        const result = this.evaluateFormula(formulaString);

        // If result is an error, show both formula and error
        if (typeof result === 'string' && result.startsWith('#ERROR')) {
          return this.preserveRichTextStructure(content, `${formulaString} → ${result}`);
        } else {
          // Return the calculated result
          return this.preserveRichTextStructure(content, String(result));
        }
      }

      return content;
    },

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

  function initializeConditionManager(component, initialConditions) {
    const conditionTypeSelect = document.getElementById('condition-type');
    const singleValueInput = document.getElementById('single-value-input');
    const rangeInputs = document.getElementById('range-inputs');
    const conditionValue = document.getElementById('condition-value');
    const minValue = document.getElementById('min-value');
    const maxValue = document.getElementById('max-value');
    const caseSensitive = document.getElementById('case-sensitive');
    const highlightBgColor = document.getElementById('highlight-bg-color');
    const highlightTextColor = document.getElementById('highlight-text-color');
    const highlightFontFamily = document.getElementById('highlight-font-family');
    const addBtn = document.getElementById('add-condition-btn');
    const closeBtn = document.getElementById('close-manager-btn');
    const applyBtn = document.getElementById('apply-conditions-btn');
    const conditionsList = document.getElementById('conditions-list');

    let currentConditions = [...initialConditions];

    // Initialize with current component settings
    highlightBgColor.value = component.get('highlight-color') || '#ffff00';
    highlightTextColor.value = component.get('highlight-text-color') || '#000000';
    highlightFontFamily.value = component.get('highlight-font-family') || 'Default';

    // Handle condition type change
    conditionTypeSelect.addEventListener('change', function () {
      const selectedType = this.value;

      if (selectedType === 'between') {
        singleValueInput.style.display = 'none';
        rangeInputs.style.display = 'block';
        caseSensitive.disabled = true;
        caseSensitive.checked = false;
      } else {
        singleValueInput.style.display = 'block';
        rangeInputs.style.display = 'none';
        caseSensitive.disabled = false;
      }

      // Update placeholder and input type based on condition type
      if (['>', '>=', '<', '<=', '=', '!='].includes(selectedType)) {
        conditionValue.placeholder = 'Enter number';
        conditionValue.type = 'number';
        caseSensitive.disabled = true;
        caseSensitive.checked = false;
      } else if (selectedType === 'once-if') {
        conditionValue.placeholder = 'Enter letters, numbers, or spaces to highlight';
        conditionValue.type = 'text';
      } else {
        conditionValue.placeholder = 'Enter text';
        conditionValue.type = 'text';
      }
    });

    // Add condition
    addBtn.addEventListener('click', function () {
      const type = conditionTypeSelect.value;

      if (!type) {
        alert('Please select a condition type');
        return;
      }

      let newCondition;

      if (type === 'between') {
        const min = parseFloat(minValue.value);
        const max = parseFloat(maxValue.value);

        if (isNaN(min) || isNaN(max)) {
          alert('Please enter valid numbers for min and max values');
          return;
        }

        if (min >= max) {
          alert('Min value must be less than max value');
          return;
        }

        newCondition = {
          type: 'between',
          minValue: min,
          maxValue: max,
          label: `Between ${min} and ${max}`,
          caseSensitive: false
        };

        minValue.value = '';
        maxValue.value = '';
      } else {
        const value = conditionValue.value; // Don't trim for once-if to preserve spaces

        if (!value && value !== ' ') {
          alert('Please enter a value');
          return;
        }

        const typeLabels = {
          'contains': 'Contains',
          'starts-with': 'Starts with',
          'ends-with': 'Ends with',
          'exact': 'Exact match',
          'once-if': 'Once if',
          '>': 'Greater than',
          '>=': 'Greater than or equal to',
          '<': 'Less than',
          '<=': 'Less than or equal to',
          '=': 'Equal to',
          '!=': 'Not equal to'
        };

        const isCaseSensitive = caseSensitive.checked && !['>', '>=', '<', '<=', '=', '!='].includes(type);
        const displayValue = value === ' ' ? 'space' : `"${value}"`;

        newCondition = {
          type: type,
          value: value,
          caseSensitive: isCaseSensitive,
          label: `${typeLabels[type]}: ${displayValue}${isCaseSensitive ? ' (case sensitive)' : ''}`
        };

        conditionValue.value = '';
      }

      currentConditions.push(newCondition);
      renderConditionsList();

      // Reset form
      conditionTypeSelect.value = '';
      singleValueInput.style.display = 'block';
      rangeInputs.style.display = 'none';
      caseSensitive.checked = false;
      caseSensitive.disabled = false;
    });

    // Render conditions list
    function renderConditionsList() {
      if (currentConditions.length === 0) {
        conditionsList.innerHTML = '<p style="color: #bbb;">No conditions added yet.</p>';
        return;
      }

      const conditionsHtml = currentConditions.map((condition, index) => `
      <div class="condition-item" style="display: flex; justify-content: space-between; align-items: center; padding: 12px; margin-bottom: 8px; border-radius: 6px; border: 1px solid #555;">
        <span style="color: #f8f9fa;">${condition.label}</span>
        <button onclick="removeCondition(${index})" style="background: #e74c3c; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold;">Remove</button>
      </div>
    `).join('');

      conditionsList.innerHTML = conditionsHtml;
    }

    // Remove condition function (global scope for onclick)
    window.removeCondition = function (index) {
      currentConditions.splice(index, 1);
      renderConditionsList();
    };

    // Apply conditions
    applyBtn.addEventListener('click', function () {
      // Set all styling properties
      component.set('highlight-color', highlightBgColor.value);
      component.set('highlight-text-color', highlightTextColor.value);
      component.set('highlight-font-family', highlightFontFamily.value);
      component.setHighlightConditions(currentConditions);
      editor.Modal.close();
    });

    // Close modal
    closeBtn.addEventListener('click', function () {
      editor.Modal.close();
    });

    // Initial render
    renderConditionsList();
  }

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
            type: 'checkbox',
            name: 'formula-label',
            label: 'Enable Formula',
            changeProp: 1
          },
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
            type: 'button',
            name: 'manage-highlight-conditions',
            label: 'Manage Highlight Conditions',
            text: 'Add/Edit Conditions',
            full: true,
            command: 'open-condition-manager',
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
        'formula-label': false,
        'hide-words': '',
        'highlight-conditions': [],
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
        this.on('change:formula-label', this.updateContent);
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

      getHighlightConditions() {
        return this.get('highlight-conditions') || [];
      },

      setHighlightConditions(conditions) {
        this.set('highlight-conditions', conditions);
        // Update the old format for backward compatibility
        const conditionStrings = conditions.map(cond => {
          if (cond.type === 'once-if') {
            return `once-if:${cond.value}`;
          } else if (['>', '>=', '<', '<=', '=', '!='].includes(cond.type)) {
            return `${cond.type}${cond.value}`;
          } else if (cond.type === 'between') {
            return `${cond.minValue}<value<${cond.maxValue}`;
          } else {
            return `${cond.type}:${cond.value}`;
          }
        });
        this.set('highlight-words', conditionStrings.join(', '), { silent: true });
        this.updateContent();
      },

      addHighlightCondition(condition) {
        const conditions = this.getHighlightConditions();
        conditions.push(condition);
        this.setHighlightConditions(conditions);
      },

      removeHighlightCondition(index) {
        const conditions = this.getHighlightConditions();
        conditions.splice(index, 1);
        this.setHighlightConditions(conditions);
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

      applyOnceIfHighlight(content, condition, highlightColor, textColor, fontFamily, caseSensitive) {
        const characters = condition.split('');

        characters.forEach(char => {
          if (char || char === ' ') { // Allow spaces
            const escapedChar = this.escapeRegex(char);
            let regex;

            if (char === ' ') {
              // Special handling for spaces - match any whitespace but replace with non-breaking space
              regex = /(\s)/g;
            } else if (/\d/.test(char)) {
              regex = new RegExp(`(?!<[^>]*?>)(${escapedChar})(?![^<]*?<\/span>)`, caseSensitive ? 'g' : 'gi');
            } else if (/[a-zA-Z]/.test(char)) {
              regex = new RegExp(`(?!<[^>]*?>)(${escapedChar})(?![^<]*?<\/span>)`, caseSensitive ? 'g' : 'gi');
            } else {
              // Special characters
              regex = new RegExp(`(?!<[^>]*?>)(${escapedChar})(?![^<]*?<\/span>)`, 'g');
            }

            if (regex) {
              const fontStyle = fontFamily && fontFamily !== 'Default' ? `font-family: ${fontFamily};` : '';
              const colorStyle = textColor ? `color: ${textColor};` : '';
              const replacement = char === ' ' ?
                `<span class="highlighted-word" style="background-color: ${highlightColor};  border-radius: 2px; ${fontStyle} ${colorStyle}">&nbsp;</span>` :
                `<span class="highlighted-word" style="background-color: ${highlightColor};  border-radius: 2px; ${fontStyle} ${colorStyle}">$1</span>`;

              content = content.replace(regex, replacement);
            }
          }
        });

        return content;
      },
      applyHighlightCondition(content, condition, highlightColor, textColor, fontFamily) {
        const conditionType = condition.type;
        const conditionValue = condition.value;
        const caseSensitive = condition.caseSensitive || false;

        // Handle "once-if" condition type
        if (conditionType === 'once-if') {
          return this.applyOnceIfHighlight(content, conditionValue, highlightColor, textColor, fontFamily, caseSensitive);
        }

        // Create style string
        const fontStyle = fontFamily && fontFamily !== 'Default' ? `font-family: ${fontFamily};` : '';
        const colorStyle = textColor ? `color: ${textColor};` : '';
        const styleString = `background-color: ${highlightColor}; padding: 1px 2px; border-radius: 2px; ${fontStyle} ${colorStyle}`;

        // Handle number conditions
        if (['>', '>=', '<', '<=', '=', '!='].includes(conditionType)) {
          const conditionString = conditionType + conditionValue;

          if (formatHelpers.isNumberCondition(conditionString)) {
            if (formatHelpers.evaluateNumberCondition(content, conditionString)) {
              const numbers = formatHelpers.extractNumbers(content);
              const conditionObj = formatHelpers.parseNumberCondition(conditionString);

              if (conditionObj) {
                numbers.forEach(num => {
                  if (conditionObj.evaluate(num)) {
                    const escapedNum = this.escapeRegex(num.toString());
                    const regex = new RegExp(`(?!<[^>]*>)\\b(${escapedNum})\\b(?![^<]*<\\/span>)`, 'g');
                    content = content.replace(regex,
                      `<span class="highlighted-word" style="${styleString}">$1</span>`
                    );
                  }
                });
              }
            }
          }
          return content;
        }

        // Handle between condition
        if (conditionType === 'between') {
          const betweenCondition = `${condition.minValue}<value<${condition.maxValue}`;
          if (formatHelpers.isNumberCondition(betweenCondition)) {
            if (formatHelpers.evaluateNumberCondition(content, betweenCondition)) {
              const numbers = formatHelpers.extractNumbers(content);
              const conditionObj = formatHelpers.parseNumberCondition(betweenCondition);

              if (conditionObj) {
                numbers.forEach(num => {
                  if (conditionObj.evaluate(num)) {
                    const escapedNum = this.escapeRegex(num.toString());
                    const regex = new RegExp(`(?!<[^>]*>)\\b(${escapedNum})\\b(?![^<]*<\\/span>)`, 'g');
                    content = content.replace(regex,
                      `<span class="highlighted-word" style="${styleString}">$1</span>`
                    );
                  }
                });
              }
            }
          }
          return content;
        }

        // Handle text-based highlighting
        let regex;
        const flags = caseSensitive ? 'g' : 'gi';

        if (conditionType === 'contains') {
          const escapedWord = this.escapeRegex(conditionValue);
          regex = new RegExp(`(?!<[^>]*?>)(\\w*${escapedWord}\\w*)(?![^<]*?<\\/span>)`, flags);
        } else if (conditionType === 'starts-with') {
          const escapedWord = this.escapeRegex(conditionValue);
          regex = new RegExp(`(?!<[^>]*?>)(${escapedWord}\\w*)(?![^<]*?<\/span>)`, flags);
        } else if (conditionType === 'ends-with') {
          const escapedWord = this.escapeRegex(conditionValue);
          regex = new RegExp(`(?!<[^>]*?>)(\\w*${escapedWord})\\b(?![^<]*?<\\/span>)`, flags);
        } else if (conditionType === 'exact') {
          const escapedWord = this.escapeRegex(conditionValue);
          regex = new RegExp(`(?!<[^>]*?>)\\b(${escapedWord})\\b(?![^<]*?<\/span>)`, flags);
        }

        if (regex) {
          content = content.replace(regex,
            `<span class="highlighted-word" style="${styleString}">$1</span>`
          );
        }

        return content;
      },
      applyConditionalFormatting(content) {
        if (!content || typeof content !== 'string') {
          return content || '';
        }

        let processedContent = content;
        const hideWords = this.get('hide-words') || '';
        const highlightConditions = this.getHighlightConditions();
        const highlightColor = this.get('highlight-color') || '#ffff00';
        const highlightTextColor = this.get('highlight-text-color') || '#000000';
        const highlightFontFamily = this.get('highlight-font-family') || 'Default';

        // Remove existing formatting
        processedContent = processedContent.replace(/<span class="hidden-word"[^>]*>.*?<\/span>/gi, '');
        processedContent = processedContent.replace(/<span class="highlighted-word"[^>]*>(.*?)<\/span>/gi, '$1');

        const hasHideConditions = hideWords.trim().length > 0;
        const hasHighlightConditions = highlightConditions.length > 0;

        if (!hasHideConditions && !hasHighlightConditions) {
          return processedContent;
        }

        // Handle hide conditions (existing logic)
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

        // Apply highlight conditions with styling
        if (hasHighlightConditions) {
          highlightConditions.forEach(condition => {
            processedContent = this.applyHighlightCondition(processedContent, condition, highlightColor, highlightTextColor, highlightFontFamily);
          });
        }

        return processedContent;
      },
      updateContent() {
        const formatType = this.get('format-type') || 'text';
        const pattern = this.get('format-pattern') || 'None';
        const isFormulaEnabled = this.get('formula-label') || false;
        let rawContent = this.get('raw-content') || '';

        if (typeof rawContent !== 'string') {
          rawContent = String(rawContent);
        }

        const previousContent = this.get('content');

        let formattedContent;

        // NEW: Process formula first if enabled
        if (isFormulaEnabled) {
          const formulaProcessed = formatHelpers.processFormulaContent(rawContent, true);
          rawContent = formulaProcessed;
        }

        // Then apply regular formatting
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
          // UPDATED: Handle raw-content updates with formula consideration
          if (formatType !== 'text' && pattern !== 'None' && !isFormulaEnabled) {
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
        const isFormulaEnabled = this.model.get('formula-label') || false;
        console.log('Format type:', formatType, 'Formula enabled:', isFormulaEnabled);

        // NEW: Special handling for formula content
        if (isFormulaEnabled) {
          const textContent = formatHelpers.extractTextContent(content);

          if (formatHelpers.isFormula(textContent)) {
            // For formulas, validate that it's a proper formula syntax
            try {
              const result = formatHelpers.evaluateFormula(textContent.trim());
              if (typeof result === 'string' && result.startsWith('#ERROR')) {
                console.log('Formula validation failed:', result);
                alert(`Formula Error: ${result.replace('#ERROR: ', '')}`);
                // Revert to previous content
                const previousContent = this.model.get('raw-content');
                this.el.innerHTML = previousContent;
                return;
              }
            } catch (error) {
              console.log('Formula validation error:', error);
              alert(`Formula Error: ${error.message}`);
              // Revert to previous content
              const previousContent = this.model.get('raw-content');
              this.el.innerHTML = previousContent;
              return;
            }
          }

          // For formula-enabled content, skip format validation since formula result will be formatted
          console.log('Formula content validated, updating');
          this.model.set('raw-content', content, { silent: true });
          this.model.updateContent();
        } else {
          // Existing validation for non-formula content
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

        // NEW: Add formula indicator
        const isFormulaEnabled = this.model.get('formula-label') || false;
        if (isFormulaEnabled) {
          this.el.setAttribute('data-formula', 'true');
        } else {
          this.el.removeAttribute('data-formula');
        }

        // Get current content
        const content = this.model.get('content') || '';
        console.log('Content to render:', content);
        console.log('Current element innerHTML:', this.el.innerHTML);

        // Only update content if not in RTE mode and content has changed
        if (!this.rteActive) {
          if (this.el.innerHTML !== content) {
            console.log('Updating element innerHTML (not in RTE mode)');
            this.el.innerHTML = content;
          }
        } else {
          console.log('Skipping innerHTML update - RTE is active');
        }

        // Ensure proper styling
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

  editor.Commands.add('open-condition-manager', {
    run(editor) {
      const selected = editor.getSelected();
      if (!selected || selected.get('type') !== 'formatted-rich-text') return;

      const conditions = selected.getHighlightConditions();

      // Create modal content
      const modalContent = `
<div class="condition-manager" style="padding: 0 20px 20px 30px; max-width: 700px;color: white; border-radius: 8px;">
  <!-- Highlight Styles Section -->
  <div class="highlight-styles" style="padding: 10px 20px 20px 0; border-radius: 8px;">
    <h4 style="margin-top: 0; margin-bottom: 20px; color: #f8f9fa;">Highlight Styles</h4>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; align-items: end;">
      <div>
        <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #f8f9fa;">Background Color:</label>
        <input type="color" id="highlight-bg-color" value="#ffff00" style="width: 100%; height: 40px; border: 2px solid #666; border-radius: 4px; background: none;">
      </div>
      
      <div>
        <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #f8f9fa;">Text Color:</label>
        <input type="color" id="highlight-text-color" value="#000000" style="width: 100%; height: 40px; border: 2px solid #666; border-radius: 4px; background: none;">
      </div>
      
      <div>
        <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #f8f9fa;">Font Family:</label>
        <select id="highlight-font-family" style="width: 100%; padding: 8px; border: 2px solid #666; border-radius: 4px;">
          <option value="Default">Default</option>
          <option value="Arial">Arial</option>
          <option value="Arial Black">Arial Black</option>
          <option value="Brush Script MT">Brush Script MT</option>
          <option value="Comic Sans MS">Comic Sans MS</option>
          <option value="Courier New">Courier New</option>
          <option value="Georgia">Georgia</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Impact">Impact</option>
          <option value="Lucida Sans Unicode">Lucida Sans Unicode</option>
          <option value="Tahoma">Tahoma</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Trebuchet MS">Trebuchet MS</option>
          <option value="Verdana">Verdana</option>
        </select>
      </div>
    </div>
  </div>

  <!-- Add New Condition Section -->
  <div class="add-condition-form">
    <h4 style="margin-top: 10px; margin-bottom: 20px; color: #f8f9fa;">Add New Condition</h4>
    
    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 15px;">
      <div>
        <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #f8f9fa;">Condition Type:</label>
        <select id="condition-type" style="width: 100%; padding: 10px; border: 2px solid #666; border-radius: 4px;">
          <option value="">Select Condition Type</option>
          <option value="contains">Text: Contains</option>
          <option value="starts-with">Text: Starts With</option>
          <option value="ends-with">Text: Ends With</option>
          <option value="exact">Text: Exact Match</option>
          <option value="once-if">Once If: Highlight individual letters/numbers/spaces</option>
          <option value=">">Number: > (Greater than)</option>
          <option value=">=">Number: >= (Greater than or equal)</option>
          <option value="<">Number: < (Less than)</option>
          <option value="<=">Number: <= (Less than or equal)</option>
          <option value="=">Number: = (Equal to)</option>
          <option value="!=">Number: != (Not equal to)</option>
          <option value="between">Number: Between (range)</option>
        </select>
      </div>
      
      <div style="display: flex; align-items: center; margin-top:27px;">
        <label style="display: flex; align-items: center; color: #f8f9fa; cursor: pointer;">
          <input type="checkbox" id="case-sensitive" style="margin-right: 8px; transform: scale(1.2);">
          <span style="font-weight: bold;">Case Sensitive</span>
        </label>
      </div>
    </div>
    
    <div id="condition-inputs">
      <div id="single-value-input" style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #f8f9fa;">Value:</label>
        <input type="text" id="condition-value" style="width: 97%; padding: 10px; border: 2px solid #666; border-radius: 4px;" placeholder="Enter text, number, or space">
      </div>
      
      <div id="range-inputs" style="display: none; margin-bottom: 15px;">
        <div style="display: flex; gap: 15px;">
          <div style="flex: 1;">
            <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #f8f9fa;">Min Value:</label>
            <input type="number" id="min-value" style="width: 90%; padding: 10px; border: 2px solid #666; border-radius: 4px;">
          </div>
          <div style="flex: 1;">
            <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #f8f9fa;">Max Value:</label>
            <input type="number" id="max-value" style="width: 90%; padding: 10px; border: 2px solid #666; border-radius: 4px;">
          </div>
        </div>
      </div>
    </div>
    
    <button id="add-condition-btn" style="background: #3498db; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: bold;">Add Condition</button>
  </div>
  
  <!-- Existing Conditions Section -->
  <div class="existing-conditions" style=" padding: 20px 20px 20px 0; border-radius: 8px; margin-bottom: 3px;">
    <div style="margin-top: 5px; color: #f8f9fa; font-weight: bold">Existing Conditions</div>
    <div id="conditions-list" style="max-height: 300px; overflow-y: auto;">
      ${conditions.length === 0 ? '<p style="color: #bbb;">No conditions added yet.</p>' : ''}
    </div>
  </div>
  
  <!-- Action Buttons -->
  <div style="text-align: right;">
    <button id="close-manager-btn" style="background: #95a5a6; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; margin-right: 15px; font-weight: bold;">Close</button>
    <button id="apply-conditions-btn" style="background: #27ae60; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; font-weight: bold;">Apply Changes</button>
  </div>
</div>
`;

      // Create and show modal
      const modal = editor.Modal;
      modal.setTitle('Text Highlight Condition Manager');
      modal.setContent(modalContent);
      modal.open();

      // Initialize the condition manager
      setTimeout(() => {
        initializeConditionManager(selected, conditions);
      }, 100);
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
      transition: background-color 0.2s ease;
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
        [data-gjs-type="formatted-rich-text"][data-formula="true"]::after {
    content: "ƒx";
    position: absolute;
    top: 2px;
    right: 6px;
    background: #28a745;
    color: white;
    font-size: 10px;
    padding: 1px 4px;
    border-radius: 2px;
    z-index: 1000;
    font-weight: bold;
  }
  
  [data-gjs-type="formatted-rich-text"][data-formula="true"] {
    border-left: 3px solid #28a745;
  }
  `);

  console.log('Text component initialized successfully!');

}