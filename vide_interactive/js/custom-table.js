function customTable(editor) {

  // Add Table block in the Block Manager
  editor.Blocks.add('table', {
    label: 'Table',
    category: "Extra",
    content: '<table></table>',
    attributes: {
      class: 'fa fa-table',
    },
  });

  // Function to show toast/warning
  function showToast(message, type = 'warning') {
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 4px;
      color: white;
      font-family: Arial, sans-serif;
      font-size: 14px;
      z-index: 10000;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      ${type === 'warning' ? 'background-color: #f39c12;' : type === 'success' ? 'background-color: #27ae60;' : 'background-color: #e74c3c;'}
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  // Function to evaluate highlighting conditions
  function evaluateCondition(cellValue, conditionType, conditionValue) {
    if (!conditionType || !conditionType.trim()) return false;

    try {
      // Handle null/empty condition
      if (conditionType === 'null') {
        return !cellValue || cellValue.toString().trim() === '';
      }

      // If no condition value provided for non-null conditions, return false
      if (!conditionValue && conditionType !== 'null') return false;

      const conditions = conditionValue.split(',').map(cond => cond.trim()).filter(cond => cond);

      return conditions.some(condition => {
        // Check if it's a number condition based on condition type
        const isNumberConditionType = ['>', '>=', '<', '<=', '=', '!=', 'between'].includes(conditionType);

        if (isNumberConditionType) {
          const numericValue = parseFloat(cellValue);
          const isNumeric = !isNaN(numericValue);

          if (!isNumeric) return false;

          if (conditionType === 'between') {
            // For 'between', expect format like "100 < value < 1000" or "100 <= value <= 1000"
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

              const minCondition = minInclusive ? numericValue >= minValue : numericValue > minValue;
              const maxCondition = maxInclusive ? numericValue <= maxValue : numericValue < maxValue;

              return minCondition && maxCondition;
            }
            return false;
          } else {
            // For other number conditions (>, >=, <, <=, =, !=)
            const threshold = parseFloat(condition);
            if (isNaN(threshold)) return false;

            switch (conditionType) {
              case '>': return numericValue > threshold;
              case '>=': return numericValue >= threshold;
              case '<': return numericValue < threshold;
              case '<=': return numericValue <= threshold;
              case '=': return numericValue === threshold;
              case '!=': return numericValue !== threshold;
              default: return false;
            }
          }
        } else {
          // Text-based conditions
          const cellText = cellValue.toString();
          const conditionText = condition;

          switch (conditionType) {
            case 'contains':
              return cellText.includes(conditionText);
            case 'starts-with':
              return cellText.startsWith(conditionText);
            case 'ends-with':
              return cellText.endsWith(conditionText);
            default:
              // Exact match
              return cellText === conditionText;
          }
        }
      });

    } catch (error) {
      console.warn('Error evaluating highlight condition:', error);
      return false;
    }
  }

  // Function to apply highlighting to table cells
  function applyHighlighting(tableId, conditionType, conditionValue, highlightColor) {
    try {
      const canvasBody = editor.Canvas.getBody();
      const table = canvasBody.querySelector(`#${tableId}`);
      if (!table) return;

      const wrapper = editor.DomComponents.getWrapper();

      // === Always: Clear previous highlights
      const prev = table.querySelectorAll('td[data-highlighted="true"], th[data-highlighted="true"]');
      prev.forEach(td => {
        td.style.backgroundColor = '';
        td.removeAttribute('data-highlighted');

        const id = td.id;
        if (id) {
          const comp = wrapper.find(`#${id}`)[0];
          if (comp) {
            comp.removeStyle('background-color');
            comp.removeStyle('background');
          }
        }
      });

      // === Only apply new highlights if condition exists
      if (conditionType && conditionType.trim()) {
        const bodyCells = table.querySelectorAll('tbody td');
        bodyCells.forEach(td => {
          const div = td.querySelector('div');
          const val = div ? div.textContent.trim() : td.textContent.trim();

          if (evaluateCondition(val, conditionType, conditionValue)) {
            const bg = highlightColor || '#ffff99';
            td.style.backgroundColor = bg;
            td.setAttribute('data-highlighted', 'true');

            const id = td.id;
            if (id) {
              const comp = wrapper.find(`#${id}`)[0];
              if (comp) {
                comp.addStyle({
                  'background-color': bg,
                  '-webkit-print-color-adjust': 'exact',
                  'color-adjust': 'exact',
                  'print-color-adjust': 'exact'
                });
              }
            }
          }
        });
      }

    } catch (err) {
      console.warn('Error applying highlighting:', err);
    }
  }

  // Function to apply multiple highlighting conditions to table cells

  function applyMultipleHighlightingWithStyles(tableId, conditions, styles = {}) {
    try {
      const canvasBody = editor.Canvas.getBody();
      const table = canvasBody.querySelector(`#${tableId}`);
      if (!table) return;

      const wrapper = editor.DomComponents.getWrapper();
      const defaultStyles = {
        backgroundColor: '#ffff99',
        textColor: '#000000',
        fontFamily: ''
      };

      const highlightStyles = { ...defaultStyles, ...styles };

      // Clear previous highlights
      const prev = table.querySelectorAll('td[data-highlighted="true"], th[data-highlighted="true"]');
      prev.forEach(td => {
        td.style.backgroundColor = '';
        td.style.color = '';
        td.style.fontFamily = '';
        td.removeAttribute('data-highlighted');

        const id = td.id;
        if (id) {
          const comp = wrapper.find(`#${id}`)[0];
          if (comp) {
            comp.removeStyle('background-color');
            comp.removeStyle('color');
            comp.removeStyle('font-family');
            comp.removeStyle('background');
          }
        }
      });

      // Apply highlights only if conditions exist
      if (conditions && conditions.length > 0) {
        const bodyCells = table.querySelectorAll('tbody td');
        bodyCells.forEach(td => {
          const div = td.querySelector('div');
          const val = div ? div.textContent.trim() : td.textContent.trim();

          // Check if any condition matches
          let shouldHighlight = false;
          for (let condition of conditions) {
            if (evaluateConditionWithCaseSensitivity(val, condition.type, condition.value, condition.caseSensitive)) {
              shouldHighlight = true;
              break;
            }
          }

          if (shouldHighlight) {
            // Apply all styles
            td.style.backgroundColor = highlightStyles.backgroundColor;
            td.style.color = highlightStyles.textColor;
            if (highlightStyles.fontFamily) {
              td.style.fontFamily = highlightStyles.fontFamily;
            }
            td.setAttribute('data-highlighted', 'true');

            const id = td.id;
            if (id) {
              const comp = wrapper.find(`#${id}`)[0];
              if (comp) {
                const styleObj = {
                  'background-color': highlightStyles.backgroundColor,
                  'color': highlightStyles.textColor,
                  '-webkit-print-color-adjust': 'exact',
                  'color-adjust': 'exact',
                  'print-color-adjust': 'exact'
                };

                if (highlightStyles.fontFamily) {
                  styleObj['font-family'] = highlightStyles.fontFamily;
                }

                comp.addStyle(styleObj);
              }
            }
          }
        });
      }

    } catch (err) {
      console.warn('Error applying highlighting with styles:', err);
    }
  }

  // Enhanced evaluation function with case sensitivity support
  function evaluateConditionWithCaseSensitivity(cellValue, conditionType, conditionValue, caseSensitive = false) {
    if (!conditionType || !conditionType.trim()) return false;

    try {
      // Handle null/empty condition
      if (conditionType === 'null') {
        return !cellValue || cellValue.toString().trim() === '';
      }

      // If no condition value provided for non-null conditions, return false
      if (!conditionValue && conditionType !== 'null') return false;

      const conditions = conditionValue.split(',').map(cond => cond.trim()).filter(cond => cond);

      return conditions.some(condition => {
        // Check if it's a number condition based on condition type
        const isNumberConditionType = ['>', '>=', '<', '<=', '=', '!=', 'between'].includes(conditionType);

        if (isNumberConditionType) {
          const numericValue = parseFloat(cellValue);
          const isNumeric = !isNaN(numericValue);

          if (!isNumeric) return false;

          if (conditionType === 'between') {
            // For 'between', expect format like "100 < value < 1000" or "100 <= value <= 1000"
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

              const minCondition = minInclusive ? numericValue >= minValue : numericValue > minValue;
              const maxCondition = maxInclusive ? numericValue <= maxValue : numericValue < maxValue;

              return minCondition && maxCondition;
            }
            return false;
          } else {
            // For other number conditions (>, >=, <, <=, =, !=)
            const threshold = parseFloat(condition);
            if (isNaN(threshold)) return false;

            switch (conditionType) {
              case '>': return numericValue > threshold;
              case '>=': return numericValue >= threshold;
              case '<': return numericValue < threshold;
              case '<=': return numericValue <= threshold;
              case '=': return numericValue === threshold;
              case '!=': return numericValue !== threshold;
              default: return false;
            }
          }
        } else {
          // Text-based conditions with case sensitivity support
          let cellText = cellValue.toString();
          let conditionText = condition;

          // Apply case sensitivity
          if (!caseSensitive) {
            cellText = cellText.toLowerCase();
            conditionText = conditionText.toLowerCase();
          }

          switch (conditionType) {
            case 'contains':
              return cellText.includes(conditionText);
            case 'starts-with':
              return cellText.startsWith(conditionText);
            case 'ends-with':
              return cellText.endsWith(conditionText);
            default:
              // Exact match
              return cellText === conditionText;
          }
        }
      });

    } catch (error) {
      console.warn('Error evaluating highlight condition:', error);
      return false;
    }
  }
  // Enhanced function to get target container that works with page system
  function getTargetContainer() {
    const selected = editor.getSelected();

    // First priority: Check if something is selected and can accept children
    if (selected) {
      const droppable = selected.get('droppable');
      if (droppable !== false) {
        // Check if it's a main content area (preferred for pages)
        if (selected.getEl()?.classList.contains('main-content-area') ||
          selected.closest('.main-content-area')) {
          return selected.closest('.main-content-area') || selected;
        }
        return selected;
      }

      // Try to find a droppable parent
      let parent = selected.parent();
      while (parent) {
        if (parent.get('droppable') !== false) {
          // Prefer main content area if available
          if (parent.getEl()?.classList.contains('main-content-area') ||
            parent.closest('.main-content-area')) {
            return parent.closest('.main-content-area') || parent;
          }
          return parent;
        }
        parent = parent.parent();
      }
    }

    // Second priority: Look for main content area in current page
    const allPages = editor.getWrapper().find('.page-container');
    if (allPages.length > 0) {
      // Try to find the currently visible or active page
      const canvasBody = editor.Canvas.getBody();
      let targetPage = null;

      // Find the page that's currently in view or the first page
      allPages.forEach(page => {
        const pageEl = page.getEl();
        if (pageEl && canvasBody.contains(pageEl)) {
          const rect = pageEl.getBoundingClientRect();
          const viewportHeight = window.innerHeight;
          // Check if page is visible in viewport
          if (rect.top < viewportHeight && rect.bottom > 0) {
            targetPage = page;
          }
        }
      });

      // If no page is in view, use the first page
      if (!targetPage) {
        targetPage = allPages.at(0);
      }

      if (targetPage) {
        const mainContentArea = targetPage.find('.main-content-area')[0];
        if (mainContentArea) {
          return mainContentArea;
        }
      }
    }

    // Third priority: Use the main canvas wrapper
    const wrapper = editor.DomComponents.getWrapper();
    return wrapper;
  }

  // Function to get available formulas
  // Function to get available formulas
  function getAvailableFormulas() {
    try {
      const iframe = editor.getContainer().querySelector('iframe');
      let formulas = [];

      if (iframe && iframe.contentWindow && iframe.contentWindow.formulaParser && iframe.contentWindow.formulaParser.SUPPORTED_FORMULAS) {
        // Get supported formulas from the loaded parser
        formulas = [...iframe.contentWindow.formulaParser.SUPPORTED_FORMULAS];
      } else {
        // Fallback list of common Excel formulas
        formulas = [
          'ABS', 'ACOS', 'ACOSH', 'AND', 'ASIN', 'ASINH', 'ATAN', 'ATAN2', 'ATANH',
          'AVERAGE', 'AVERAGEA', 'AVERAGEIF', 'AVERAGEIFS', 'CEILING', 'CHOOSE',
          'CONCATENATE', 'COS', 'COSH', 'COUNT', 'COUNTA', 'COUNTBLANK', 'COUNTIF',
          'COUNTIFS', 'DATE', 'DATEVALUE', 'DAY', 'EVEN', 'EXP', 'FACT', 'FALSE',
          'FIND', 'FLOOR', 'IF', 'INDEX', 'INT', 'ISBLANK', 'ISERROR', 'ISEVEN',
          'ISLOGICAL', 'ISNA', 'ISNONTEXT', 'ISNUMBER', 'ISODD', 'ISTEXT', 'LEFT',
          'LEN', 'LN', 'LOG', 'LOG10', 'LOWER', 'MATCH', 'MAX', 'MAXA', 'MID',
          'MIN', 'MINA', 'MOD', 'MONTH', 'NOT', 'NOW', 'ODD', 'OR', 'PI', 'POWER',
          'PRODUCT', 'PROPER', 'RAND', 'RANDBETWEEN', 'REPLACE', 'REPT', 'RIGHT',
          'ROUND', 'ROUNDDOWN', 'ROUNDUP', 'SEARCH', 'SIN', 'SINH', 'SQRT', 'SUBSTITUTE',
          'SUM', 'SUMIF', 'SUMIFS', 'SUMPRODUCT', 'TAN', 'TANH', 'TIME', 'TIMEVALUE',
          'TODAY', 'TRIM', 'TRUE', 'TRUNC', 'UPPER', 'VALUE', 'VLOOKUP', 'WEEKDAY',
          'YEAR'
        ];
      }

      // Add our custom formulas
      const customFormulas = ['PERCENT', 'NUMTOWORDS'];
      customFormulas.forEach(f => {
        if (!formulas.includes(f)) {
          formulas.push(f);
        }
      });

      return formulas.sort();

    } catch (error) {
      console.warn('Error getting formulas:', error);
      return ['SUM', 'AVERAGE', 'COUNT', 'MAX', 'MIN', 'IF', 'VLOOKUP', 'PERCENT', 'NUMTOWORDS'].sort();
    }
  }


  // Function to show all formulas in modal
  function showAllFormulasModal() {
    const availableFormulas = getAvailableFormulas();

    // Group formulas by category (first letter for simplicity)
    const groupedFormulas = {};
    availableFormulas.forEach(formula => {
      const firstLetter = formula.charAt(0);
      if (!groupedFormulas[firstLetter]) {
        groupedFormulas[firstLetter] = [];
      }
      groupedFormulas[firstLetter].push(formula);
    });

    let modalContent = `
      <div class="formulas-modal" style="font-family: Arial, sans-serif;">
        <div style="margin-bottom: 15px;">
          <input type="text" id="formula-search" placeholder="Search formula..." 
                 style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; box-sizing: border-box;">
        </div>
        <div id="formulas-container" style="max-height: 350px; overflow-y: auto; border: 1px solid #eee; padding: 15px; background: #fafafa;">
    `;

    // Add grouped formulas
    Object.keys(groupedFormulas).sort().forEach(letter => {
      modalContent += `<div class="formula-group" style="margin-bottom: 20px;">`;
      modalContent += `<h4 style="margin: 0 0 8px 0; color: #444; border-bottom: 2px solid #ddd; padding-bottom: 4px; font-size: 14px; font-weight: bold;">${letter} (${groupedFormulas[letter].length})</h4>`;
      modalContent += `<div style="display: flex; flex-wrap: wrap; gap: 8px;">`;

      groupedFormulas[letter].forEach(formula => {
        modalContent += `
          <span class="formula-item" data-formula="${formula}" 
                style="padding: 6px 10px; background: #f8f9fa; border: 1px solid #dee2e6; 
                       border-radius: 4px; cursor: pointer; font-size: 11px; font-family: 'Courier New', monospace;
                       transition: all 0.2s ease; display: inline-block; font-weight: 500;
                       user-select: none; color: #495057;">
            ${formula}
          </span>`;
      });

      modalContent += `</div></div>`;
    });

    modalContent += `
        </div>
        <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #eee; text-align: right;">
          <button id="close-formulas-modal" 
                  style="padding: 10px 20px; background: #007cba; color: white; border: none; 
                         border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 500;
                         transition: background-color 0.2s ease;">
            Close
          </button>
        </div>
      </div>
    `;

    editor.Modal.setTitle('Formula');
    editor.Modal.setContent(modalContent);
    editor.Modal.open();

    // Add event listeners after modal opens
    setTimeout(() => {
      const searchInput = document.getElementById('formula-search');
      const formulasContainer = document.getElementById('formulas-container');
      const closeBtn = document.getElementById('close-formulas-modal');

      if (!searchInput || !formulasContainer || !closeBtn) {
        console.warn('Modal elements not found');
        return;
      }

      // Search functionality
      searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const formulaItems = formulasContainer.querySelectorAll('.formula-item');
        const groups = formulasContainer.querySelectorAll('.formula-group');

        formulaItems.forEach(item => {
          const formula = item.getAttribute('data-formula').toLowerCase();
          if (formula.includes(searchTerm)) {
            item.style.display = 'inline-block';
          } else {
            item.style.display = 'none';
          }
        });

        // Hide empty groups and show count
        groups.forEach(group => {
          const visibleItems = group.querySelectorAll('.formula-item[style*="inline-block"], .formula-item:not([style*="none"])');
          if (visibleItems.length > 0) {
            group.style.display = 'block';
          } else {
            group.style.display = 'none';
          }
        });
      });

      // Formula item click handlers
      const formulaItems = formulasContainer.querySelectorAll('.formula-item');
      formulaItems.forEach(item => {
        // Mouse hover effects
        item.addEventListener('mouseenter', () => {
          item.style.backgroundColor = '#007cba';
          item.style.color = 'white';
          item.style.borderColor = '#006ba6';
          item.style.transform = 'translateY(-1px)';
          item.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        });

        item.addEventListener('mouseleave', () => {
          item.style.backgroundColor = '#f8f9fa';
          item.style.color = '#495057';
          item.style.borderColor = '#dee2e6';
          item.style.transform = 'translateY(0)';
          item.style.boxShadow = 'none';
        });

        // Click handler
        item.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();

          const formula = item.getAttribute('data-formula');

          // Try to insert into currently focused cell
          const canvasDoc = editor.Canvas.getDocument();
          const activeCell = canvasDoc.querySelector('td:focus, th:focus');

          if (activeCell) {
            // Get current text content
            const targetDiv = activeCell.querySelector('div');
            const currentText = targetDiv ? targetDiv.textContent : activeCell.textContent;

            let newText;
            if (currentText.trim() === '' || currentText.trim() === '=') {
              newText = `=${formula}(`;
            } else if (currentText.endsWith('=')) {
              newText = currentText + formula + '(';
            } else {
              newText = `=${formula}(`;
            }

            // Update cell content
            if (targetDiv) {
              targetDiv.textContent = newText;
            } else {
              activeCell.textContent = newText;
            }

            // Ensure cell is in edit mode and focused
            activeCell.contentEditable = "true";
            activeCell.focus();

            // Position cursor after opening parenthesis
            setTimeout(() => {
              try {
                const range = canvasDoc.createRange();
                const sel = canvasDoc.defaultView.getSelection();

                sel.removeAllRanges();

                let textNode = null;
                if (targetDiv && targetDiv.firstChild) {
                  textNode = targetDiv.firstChild;
                } else if (activeCell.firstChild) {
                  textNode = activeCell.firstChild;
                }

                if (textNode && textNode.nodeType === Node.TEXT_NODE) {
                  range.setStart(textNode, newText.length);
                  range.setEnd(textNode, newText.length);
                  sel.addRange(range);
                } else {
                  // Create text node if needed
                  const newTextNode = canvasDoc.createTextNode(newText);
                  if (targetDiv) {
                    targetDiv.innerHTML = '';
                    targetDiv.appendChild(newTextNode);
                  } else {
                    activeCell.innerHTML = '';
                    activeCell.appendChild(newTextNode);
                  }
                  range.setStart(newTextNode, newText.length);
                  range.setEnd(newTextNode, newText.length);
                  sel.addRange(range);
                }

                activeCell.focus();

              } catch (error) {
                console.warn('Error positioning cursor:', error);
                activeCell.focus();
              }
            }, 100);

            showToast(`Formula ${formula} inserted into cell`, 'success');
            editor.Modal.close();

          } else {
            // No active cell - copy to clipboard as fallback
            const tempInput = document.createElement('input');
            tempInput.value = `=${formula}()`;
            document.body.appendChild(tempInput);
            tempInput.select();

            try {
              document.execCommand('copy');
              showToast(`Formula ${formula} copied to clipboard!`, 'success');
            } catch (err) {
              showToast(`Formula copied: =${formula}()`, 'info');
            }

            document.body.removeChild(tempInput);
          }
        });
      });

      // Close button
      closeBtn.addEventListener('mouseenter', () => {
        closeBtn.style.backgroundColor = '#006ba6';
      });

      closeBtn.addEventListener('mouseleave', () => {
        closeBtn.style.backgroundColor = '#007cba';
      });

      closeBtn.addEventListener('click', () => {
        editor.Modal.close();
      });

      // Focus search input
      searchInput.focus();

    }, 150);
  }

  // Helper function to get cell value
  function getCellValue(cell) {
    try {
      // Check for formula first
      const formula = cell.getAttribute('data-formula');
      if (formula && formula.startsWith('=')) {
        // Return the calculated value, not the formula
        const displayValue = cell.querySelector('div') ? cell.querySelector('div').textContent : cell.textContent;
        const numValue = parseFloat(displayValue);
        return isNaN(numValue) ? displayValue : numValue;
      }

      // Return regular cell value
      const textValue = cell.querySelector('div') ? cell.querySelector('div').textContent : cell.textContent;
      const numValue = parseFloat(textValue);
      return isNaN(numValue) ? textValue : numValue;
    } catch (error) {
      console.warn('Error getting cell value:', error);
      return '';
    }
  }

  // Detect table block drag stop
  editor.on('block:drag:stop', (block) => {
    if (block.get('tagName') === 'table') {
      // Remove the default empty table that was created
      block.remove();
      // Open the configuration modal
      addTable();
    }
  });

  // Load CSS inside GrapesJS iframe
  editor.on('load', () => {
    const iframe = editor.getContainer().querySelector('iframe');
    const head = iframe.contentDocument.head;
    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = `
  a.dt-button { border: 1px solid #ccc !important; }
  .dataTables_wrapper .dataTables_filter input {
    border: 1px solid #ccc !important;
  }
  .dataTables_wrapper .dataTables_filter input:focus-visible { outline: 0px!important; }
  .i_designer-dashed *[data-i_designer-highlightable] {
    border: 1px solid #ccc !important;
  }
  .dataTables_wrapper .dataTables_paginate .paginate_button.current {
    border: 1px solid #ccc !important;
  }
  .dataTables_wrapper .dataTables_paginate .paginate_button:hover {
    border: 1px solid #ccc !important;
    background: linear-gradient(to bottom, #fff 0%, #dcdcdc 100%) !important;
  }
  table.dataTable { border: 1px solid #ccc !important; }
  table.dataTable thead th { border-bottom: 1px solid #ccc !important; }

  /* Enhanced highlighted cell styles - applied to td/th instead of div */
  td[data-highlighted="true"], th[data-highlighted="true"] {
    position: relative;
  }
  td[data-highlighted="true"]::after, th[data-highlighted="true"]::after {
    content: "★";
    position: absolute;
    top: 2px;
    right: 2px;
    font-size: 10px;
    color: #ff6b35;
    font-weight: bold;
    z-index: 1;
  }

  /* Formula suggestions styling */
  .formula-suggestions {
    font-family: Arial, sans-serif !important;
  }
  .formula-suggestions div:hover {
    background-color: #f0f0f0 !important;
  }

  /* Page-aware table styles */
  .page-container .dataTables_wrapper {
    max-width: 100%;
    overflow: hidden;
  }
  
  .main-content-area .dataTables_wrapper {
    width: 100% !important;
    box-sizing: border-box;
  }
  
  /* Enhanced print styles for tables in pages with cell highlighting preservation */
  @media print {
    .page-container table.dataTable {
      border-collapse: collapse !important;
      width: 100% !important;
      font-size: 10px !important;
      page-break-inside: avoid !important;
    }
    
    .page-container .dataTables_wrapper .dataTables_length,
    .page-container .dataTables_wrapper .dataTables_filter,
    .page-container .dataTables_wrapper .dataTables_info,
    .page-container .dataTables_wrapper .dataTables_paginate,
    .page-container .dataTables_wrapper .dt-buttons {
      display: none !important;
    }
    
    .page-container table.dataTable thead th,
    .page-container table.dataTable tbody td {
      border: 1px solid #000 !important;
      padding: 4px !important;
      text-align: left !important;
    }
    
    .page-container table.dataTable thead th {
      background-color: #f5f5f5 !important;
      font-weight: bold !important;
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Preserve cell highlighting in print - critical for PDF generation */
    td[data-highlighted="true"], th[data-highlighted="true"] {
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    /* Ensure background colors are preserved in print/PDF */
    * {
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    
    /* Hide the star indicator in print to avoid clutter */
    td[data-highlighted="true"]::after, th[data-highlighted="true"]::after {
      display: none !important;
    }
  }
`;
    head.appendChild(style);

    // Inject formula parser library into iframe
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/hot-formula-parser/dist/formula-parser.min.js";
    script.crossOrigin = "anonymous";

    script.onload = () => {
      // Wait a bit for the library to fully initialize
      setTimeout(() => {
        registerCustomFormulas();
      }, 300);
    };

    script.onerror = (error) => {
      console.error('Failed to load hot-formula-parser:', error);
    };

    // Append to iframe head instead of main document head
    iframe.contentDocument.head.appendChild(script);

    // Add the table condition manager command
    editor.Commands.add('open-table-condition-manager-local-table', {
      run() {
        const selected = editor.getSelected();
        if (!selected || selected.get('type') !== 'enhanced-table') return;

        const conditions = selected.getHighlightConditions();
        const highlightColor = selected.get('highlight-color') || '#ffff99';

        const modalContent = `
        <div class="table-condition-manager" style="padding: 0 20px 20px 30px; max-width: 700px;">
       
          <!-- NEW: Highlight Styles Section -->
          <div class="highlight-styles-section" style="padding: 10px 15px 15px 0;">
            <h4 style="margin-top: 0;">Highlight Styles</h4>
            
            <div style="display: flex; gap: 20px; flex-wrap: wrap; align-items: flex-end;">
              <div style="flex: 1; min-width: 150px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Background Color:</label>
                <input type="color" id="highlight-bg-color" value="#ffff99" 
                      style="width: 100%; height: 40px; border: 2px solid #ccc; border-radius: 4px; cursor: pointer;">
              </div>
              
              <div style="flex: 1; min-width: 150px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Text Color:</label>
                <input type="color" id="highlight-text-color" value="#000000" 
                      style="width: 100%; height: 40px; border: 2px solid #ccc; border-radius: 4px; cursor: pointer;">
              </div>
              
              <div style="flex: 1; min-width: 150px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Font Family:</label>
                <select id="highlight-font-family" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; height: 40px;">
                  <option value="">Default</option>
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
          
          <div class="add-condition-form" >
            <h4 style="margin-top: 10px;  margin-bottom: 20px;">Add New Condition</h4>
            
            <div style="display: flex; gap: 15px; margin-bottom: 15px;">
              <div style="flex: 2;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Condition Type:</label>
                <select id="table-condition-type" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                  <option value="">Select Condition Type</option>
                  <option value="contains">Text: Contains</option>
                  <option value="starts-with">Text: Starts With</option>
                  <option value="ends-with">Text: Ends With</option>
                  <option value=">">Number: > (Greater than)</option>
                  <option value=">=">Number: >= (Greater than or equal)</option>
                  <option value="<">Number: < (Less than)</option>
                  <option value="<=">Number: <= (Less than or equal)</option>
                  <option value="=">Number: = (Equal to)</option>
                  <option value="!=">Number: != (Not equal to)</option>
                  <option value="between">Number: Between (range)</option>
                  <option value="null">Null/Empty (No value)</option>
                </select>
              </div>
              
              <!-- NEW: Case Sensitive Checkbox -->
              <div style="flex: 1; display: flex; flex-direction: column; justify-content: flex-end;">
                <label style="display: flex; align-items: center; font-weight: bold; height: 36px;">
                  <input type="checkbox" id="case-sensitive" style="margin-right: 8px;">
                  Case Sensitive
                </label>
              </div>
            </div>
            
            <div id="table-condition-inputs">
              <div id="table-single-value-input" style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Value:</label>
                <input type="text" id="table-condition-value" style="width: 97%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" placeholder="Enter text or number">
              </div>
              
              <div id="table-range-inputs" style="display: none; margin-bottom: 15px;">
                <div style="display: flex; gap: 10px;">
                  <div style="flex: 1;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Min Value:</label>
                    <input type="number" id="table-min-value" style="width: 90%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                  </div>
                  <div style="flex: 1;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Max Value:</label>
                    <input type="number" id="table-max-value" style="width: 90%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                  </div>
                </div>
              </div>
            </div>
            
            <button id="table-add-condition-btn" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Add Condition</button>
          </div>
          
          <div class="existing-conditions" style=" padding: 20px 20px 20px 0; border-radius: 8px; margin-bottom: 3px;">
            <div style="margin-top: 5px; font-weight: bold">Existing Conditions</div>
            <div id="table-conditions-list" style="max-height: 300px; overflow-y: auto;">
              ${conditions.length === 0 ? '<p style="color: #666;">No conditions added yet.</p>' : ''}
            </div>
          </div>
          
          <div style="text-align: right;">
            <button id="table-close-manager-btn" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-right: 10px;">Close</button>
            <button id="table-apply-conditions-btn" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Apply Changes</button>
          </div>
        </div>
      `;

        editor.Modal.setTitle('Table Highlight Condition Manager');
        editor.Modal.setContent(modalContent);
        editor.Modal.open();

        setTimeout(() => {
          initializeTableConditionManager(selected, conditions);
        }, 100);
      }
    });
    // ✅ Custom formula registration
    function registerCustomFormulas() {
      try {
        const iframe = editor.getContainer().querySelector('iframe');
        if (!iframe || !iframe.contentWindow) {
          console.warn('Iframe not available for formula registration');
          setTimeout(registerCustomFormulas, 500);
          return;
        }

        const iframeWindow = iframe.contentWindow;

        // Wait for formulaParser to be available in iframe
        if (!iframeWindow.formulaParser || !iframeWindow.formulaParser.Parser) {
          console.warn('Formula parser not available in iframe, retrying...');
          setTimeout(registerCustomFormulas, 500);
          return;
        }

        // ✅ Store the parser constructor globally in iframe for enableFormulaEditing to use
        if (!iframeWindow.globalFormulaParser) {
          iframeWindow.globalFormulaParser = new iframeWindow.formulaParser.Parser();

          // ✅ Register custom formulas on the global parser instance
          const parser = iframeWindow.globalFormulaParser;

          // Register PERCENT formula: PERCENT(base, percent)
          parser.setFunction('PERCENT', function (params) {
            if (params.length !== 2) return '#N/A';
            const base = parseFloat(params[0]);
            const percent = parseFloat(params[1]);
            if (isNaN(base) || isNaN(percent)) return '#VALUE!';
            return base * (percent / 100);
          });

          // Register ABSOLUTE formula: ABSOLUTE(number)
          parser.setFunction('ABSOLUTE', function (params) {
            if (params.length !== 1) return '#N/A';
            const num = parseFloat(params[0]);
            if (isNaN(num)) return '#VALUE!';
            return Math.abs(num);
          });

          console.log('Custom formulas PERCENT and ABSOLUTE registered successfully');

          // ✅ Also register these formulas on the Parser constructor prototype
          // so new instances will have them
          if (iframeWindow.formulaParser.Parser.prototype.setFunction) {
            iframeWindow.formulaParser.Parser.prototype.customFormulas = {
              'PERCENT': function (params) {
                if (params.length !== 2) return '#N/A';
                const base = parseFloat(params[0]);
                const percent = parseFloat(params[1]);
                if (isNaN(base) || isNaN(percent)) return '#VALUE!';
                return base * (percent / 100);
              },
              'ABSOLUTE': function (params) {
                if (params.length !== 1) return '#N/A';
                const num = parseFloat(params[0]);
                if (isNaN(num)) return '#VALUE!';
                return Math.abs(num);
              }
            };
          }

          // Load number-to-words library
          loadNumberToWords(parser, iframeWindow);
        }

      } catch (error) {
        console.error('Error registering custom formulas:', error);
      }
    }

    function loadNumberToWords(parser, iframeWindow) {
      try {
        // Check if numberToWords is already available
        if (iframeWindow.numberToWords) {
          console.log("alrady available")
          registerNumToWords(parser, iframeWindow);
          return;
        }

        // Create script element in iframe document
        const script = iframeWindow.document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/number-to-words@1.2.4/numberToWords.min.js";
        script.crossOrigin = "anonymous";

        script.onload = function () {
          try {
            // Give it a moment for the library to initialize
            setTimeout(() => {
              console.log("number to word script is oading")
              registerNumToWords(parser, iframeWindow);
            }, 100);
          } catch (error) {
            console.error('Error after loading number-to-words:', error);
          }
        };

        script.onerror = function (error) {
          console.error('Failed to load number-to-words library:', error);

          // Fallback: register a simple NUMTOWORDS that converts basic numbers
          parser.setFunction('NUMTOWORDS', function (params) {
            if (params.length !== 1) return '#N/A';
            const num = parseInt(params[0]);
            if (isNaN(num)) return '#VALUE!';

            // Simple fallback for numbers 0-20
            const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
              'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];

            if (num >= 0 && num <= 20) {
              return words[num];
            } else if (num < 100) {
              const tens = Math.floor(num / 10);
              const ones = num % 10;
              const tensWords = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
              return ones === 0 ? tensWords[tens] : tensWords[tens] + '-' + words[ones];
            } else {
              return 'Number too large for fallback';
            }
          });

          console.log('NUMTOWORDS registered with fallback implementation');
        };

        // Append to iframe head
        iframeWindow.document.head.appendChild(script);

      } catch (error) {
        console.error('Error loading number-to-words library:', error);
      }
    }
    function registerNumToWords(parser, iframeWindow) {
      try {
        if (iframeWindow.numberToWords && iframeWindow.numberToWords.toWords) {
          parser.setFunction('NUMTOWORDS', function (params) {
            if (params.length !== 1) return '#N/A';
            const num = parseInt(params[0]);
            if (isNaN(num)) return '#VALUE!';

            try {
              return iframeWindow.numberToWords.toWords(num);
            } catch (error) {
              return '#ERROR';
            }
          });

          console.log('NUMTOWORDS formula registered successfully with number-to-words library');
        } else {
          console.warn('numberToWords library not properly loaded');
        }
      } catch (error) {
        console.error('Error registering NUMTOWORDS:', error);
      }
    }
  });


  editor.on("load", () => {
    const devicesPanel = editor.Panels.getPanel("devices-c");

    if (devicesPanel) {
      const buttons = devicesPanel.get("buttons");

      buttons.add([{
        id: "show-formulas",
        className: "fa fa-calculator",
        command: "show-all-formulas",
        attributes: {
          title: "Show All Formulas",
          "data-tooltip-pos": "bottom"
        }
      }]);
    }
  });


  editor.on('storage:store', function () {
    // Before storing, ensure running total data is preserved in components
    try {
      const canvasBody = editor.Canvas.getBody();
      const tables = canvasBody.querySelectorAll('table[id^="table"]');

      tables.forEach(table => {
        const tableId = table.id;
        const tableComponent = editor.getWrapper().find('table')[0];


        if (tableComponent) {
          // Find all running total cells and preserve their data
          const runningTotalCells = table.querySelectorAll('[data-running-total-cell], [data-running-total-header]');

          runningTotalCells.forEach(cell => {
            const tableComponent = editor.getWrapper().find('table')[0];

            if (cellComponent) {
              // Preserve running total attributes in the component
              const attributes = cellComponent.getAttributes();

              if (cell.hasAttribute('data-running-total-cell')) {
                attributes['data-running-total-cell'] = cell.getAttribute('data-running-total-cell');
              }
              if (cell.hasAttribute('data-running-total-for')) {
                attributes['data-running-total-for'] = cell.getAttribute('data-running-total-for');
              }
              if (cell.hasAttribute('data-running-total-value')) {
                attributes['data-running-total-value'] = cell.getAttribute('data-running-total-value');
              }
              if (cell.hasAttribute('data-running-total-header')) {
                attributes['data-running-total-header'] = cell.getAttribute('data-running-total-header');
              }

              cellComponent.setAttributes(attributes);

              // Also ensure the cell content is preserved
              const cellContent = cell.textContent || cell.innerHTML;
              if (cellContent) {
                cellComponent.set('content', cellContent);
              }
            }
          });
        }
      });
    } catch (error) {
      console.warn('Error preserving running totals during export:', error);
    }
  });

  function initializeTableConditionManager(tableComponent, conditions) {
    const conditionTypeSelect = document.getElementById('table-condition-type');
    const singleValueInput = document.getElementById('table-single-value-input');
    const rangeInputs = document.getElementById('table-range-inputs');
    const addBtn = document.getElementById('table-add-condition-btn');
    const closeBtn = document.getElementById('table-close-manager-btn');
    const applyBtn = document.getElementById('table-apply-conditions-btn');
    const conditionsList = document.getElementById('table-conditions-list');

    // NEW: Get styling elements
    const bgColorInput = document.getElementById('highlight-bg-color');
    const textColorInput = document.getElementById('highlight-text-color');
    const fontFamilySelect = document.getElementById('highlight-font-family');
    const caseSensitiveCheckbox = document.getElementById('case-sensitive');

    if (!conditionTypeSelect || !addBtn || !closeBtn || !applyBtn || !conditionsList ||
      !bgColorInput || !textColorInput || !fontFamilySelect || !caseSensitiveCheckbox) {
      console.warn('Table condition manager elements not found');
      return;
    }

    // Load existing styling settings from tableComponent if available
    const existingStyles = tableComponent.get('highlight-styles') || {};
    bgColorInput.value = existingStyles.backgroundColor || '#ffff99';
    textColorInput.value = existingStyles.textColor || '#000000';
    fontFamilySelect.value = existingStyles.fontFamily || '';

    // Handle condition type change
    conditionTypeSelect.addEventListener('change', (e) => {
      const selectedType = e.target.value;
      if (selectedType === 'between') {
        singleValueInput.style.display = 'none';
        rangeInputs.style.display = 'block';
        // Disable case sensitivity for numeric conditions
        caseSensitiveCheckbox.disabled = true;
        caseSensitiveCheckbox.checked = false;
      } else if (selectedType === 'null') {
        singleValueInput.style.display = 'none';
        rangeInputs.style.display = 'none';
        caseSensitiveCheckbox.disabled = true;
        caseSensitiveCheckbox.checked = false;
      } else if (['>', '>=', '<', '<=', '=', '!='].includes(selectedType)) {
        singleValueInput.style.display = 'block';
        rangeInputs.style.display = 'none';
        // Disable case sensitivity for numeric conditions
        caseSensitiveCheckbox.disabled = true;
        caseSensitiveCheckbox.checked = false;
      } else {
        singleValueInput.style.display = 'block';
        rangeInputs.style.display = 'none';
        // Enable case sensitivity for text conditions
        caseSensitiveCheckbox.disabled = false;
      }
    });

    // Render existing conditions
    function renderConditions() {
      if (conditions.length === 0) {
        conditionsList.innerHTML = '<p style="color: #666;">No conditions added yet.</p>';
        return;
      }

      conditionsList.innerHTML = conditions.map((condition, index) => {
        let conditionText = '';
        if (condition.type === 'between') {
          conditionText = `Between ${condition.minValue} and ${condition.maxValue}`;
        } else if (condition.type === 'null') {
          conditionText = 'Is null/empty';
        } else {
          const caseText = condition.caseSensitive ? ' (Case Sensitive)' : '';
          conditionText = `${condition.type} "${condition.value}"${caseText}`;
        }

        return `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 8px;">
            <span>${conditionText}</span>
            <button onclick="removeTableCondition(${index})" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-size: 12px;">Remove</button>
          </div>
        `;
      }).join('');
    }

    // Global function to remove condition
    window.removeTableCondition = function (index) {
      conditions.splice(index, 1);
      renderConditions();
    };

    // Add condition handler
    addBtn.addEventListener('click', () => {
      const type = conditionTypeSelect.value;
      if (!type) {
        showToast('Please select a condition type', 'warning');
        return;
      }

      let condition = { type };

      if (type === 'between') {
        const minValue = document.getElementById('table-min-value').value;
        const maxValue = document.getElementById('table-max-value').value;
        if (!minValue || !maxValue) {
          showToast('Please enter both min and max values', 'warning');
          return;
        }
        condition.minValue = parseFloat(minValue);
        condition.maxValue = parseFloat(maxValue);
        condition.value = `${minValue} < value < ${maxValue}`;
      } else if (type === 'null') {
        condition.value = '';
      } else {
        const value = document.getElementById('table-condition-value').value;
        if (!value) {
          showToast('Please enter a value', 'warning');
          return;
        }
        condition.value = value;

        // Add case sensitivity for text conditions
        if (['contains', 'starts-with', 'ends-with'].includes(type)) {
          condition.caseSensitive = caseSensitiveCheckbox.checked;
        }
      }

      conditions.push(condition);
      renderConditions();

      // Clear form
      conditionTypeSelect.value = '';
      document.getElementById('table-condition-value').value = '';
      document.getElementById('table-min-value').value = '';
      document.getElementById('table-max-value').value = '';
      caseSensitiveCheckbox.checked = false;
      caseSensitiveCheckbox.disabled = false;
      singleValueInput.style.display = 'block';
      rangeInputs.style.display = 'none';
    });

    // Apply conditions
    applyBtn.addEventListener('click', () => {
      // Save styling settings to tableComponent
      const highlightStyles = {
        backgroundColor: bgColorInput.value,
        textColor: textColorInput.value,
        fontFamily: fontFamilySelect.value
      };

      tableComponent.set('highlight-styles', highlightStyles);
      tableComponent.setHighlightConditions([...conditions]);

      // Apply highlighting with new styles
      const tableId = tableComponent.getId();
      applyMultipleHighlightingWithStyles(tableId, conditions, highlightStyles);

      showToast('Conditions and styles applied successfully!', 'success');
      editor.Modal.close();
    });

    // Close modal
    closeBtn.addEventListener('click', () => {
      editor.Modal.close();
    });

    renderConditions();
  }

  function getComponentFromDom(el) {
    if (!el) return null;

    // GrapesJS adds this automatically for every component element
    const cid = el.getAttribute('data-gjs-cid');
    if (!cid) return null;

    return editor.DomComponents.getById(cid);
  }

  // Global storage for selected cells
  window.crosstabSelectedCells = [];

  // Function to enable crosstab cell selection
  function enableCrosstabSelection(tableId, enabled) {
    try {
      const canvasBody = editor.Canvas.getBody();
      const table = canvasBody.querySelector(`#${tableId}`);
      if (!table) return;

      const allCells = table.querySelectorAll('td, th');
      const tableComponent = editor.getWrapper().find(`#${tableId}`)[0];

      if (enabled) {
        // Store original GrapesJS properties
        table._originalGjsProps = new Map();
        table._originalRowGjsProps = new Map();

        allCells.forEach(cell => {
          const comp = getComponentFromDom(cell);
          if (comp) {
            table._originalGjsProps.set(cell, {
              selectable: comp.get('selectable'),
              hoverable: comp.get('hoverable'),
              editable: comp.get('editable')
            });
            comp.set({ selectable: false, hoverable: false, editable: false });
          }

          cell.contentEditable = "false";
          cell.style.cursor = 'pointer';
          cell.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent row selection
            handleCrosstabCellClick(cell, tableId);
          });
        });

        // Disable row selection
        const allRows = table.querySelectorAll('tr');
        allRows.forEach(row => {
          const comp = getComponentFromDom(row);
          if (comp) {
            table._originalRowGjsProps.set(row, {
              selectable: comp.get('selectable'),
              hoverable: comp.get('hoverable')
            });
            comp.set({ selectable: false, hoverable: false });
          }
        });

        showToast('Crosstab mode enabled - Click cells to select for merging', 'success');
      } else {
        window.crosstabSelectedCells = [];

        allCells.forEach(cell => {
          cell.classList.remove('crosstab-selected');
          cell.style.outline = '';
          cell.contentEditable = "true";
          cell.style.cursor = 'text';
        });

        if (table._originalGjsProps) {
          allCells.forEach(cell => {
            const original = table._originalGjsProps.get(cell);
            const comp = getComponentFromDom(cell);
            if (comp && original) {
              comp.set({
                selectable: original.selectable,
                hoverable: original.hoverable,
                editable: original.editable
              });
            }
          });
          delete table._originalGjsProps;
        }

        if (table._originalRowGjsProps) {
          const allRows = table.querySelectorAll('tr');
          allRows.forEach(row => {
            const original = table._originalRowGjsProps.get(row);
            const comp = getComponentFromDom(row);
            if (comp && original) {
              comp.set({
                selectable: original.selectable,
                hoverable: original.hoverable
              });
            }
          });
          delete table._originalRowGjsProps;
        }

        allCells.forEach(cell => {
          const newCell = cell.cloneNode(true);
          cell.parentNode.replaceChild(newCell, cell);
        });

        if (tableComponent) {
          editor.trigger('component:update', tableComponent);

          setTimeout(() => {
            editor.trigger('component:deselected');
            editor.trigger('layer:refresh');
            enableFormulaEditing(tableId);
          }, 200);
        }

        showToast('Crosstab mode disabled - Normal cell editing restored', 'success');
      }
    } catch (error) {
      console.error('Error toggling crosstab mode:', error);
    }
  }

  // Handle cell click in crosstab mode
  // Helper: build a grid map of the table accounting for rowspan/colspan
  function buildTableGrid(table) {
    const grid = []; // grid[row][col] = cellElement
    const cellMap = new Map(); // cellElement -> {positions: [{r,c}], rowspan, colspan}

    const rows = Array.from(table.rows);
    for (let r = 0; r < rows.length; r++) {
      if (!grid[r]) grid[r] = [];
      const cells = Array.from(rows[r].cells);
      let c = 0;
      for (let ci = 0; ci < cells.length; ci++) {
        const cell = cells[ci];
        // find next free column index
        while (grid[r][c]) c++;

        const rowspan = parseInt(cell.getAttribute('rowspan') || '1', 10);
        const colspan = parseInt(cell.getAttribute('colspan') || '1', 10);
        const positions = [];

        for (let rr = 0; rr < rowspan; rr++) {
          for (let cc = 0; cc < colspan; cc++) {
            const rrIdx = r + rr;
            const ccIdx = c + cc;
            if (!grid[rrIdx]) grid[rrIdx] = [];
            grid[rrIdx][ccIdx] = cell;
            positions.push({ r: rrIdx, c: ccIdx });
          }
        }

        cellMap.set(cell, { positions, rowspan, colspan, firstRow: r, firstCol: c });
        c += colspan;
      }
    }

    return { grid, cellMap };
  }

  // Updated handleCrosstabCellClick to record grid coordinates (accounts for colspan/rowspan)
  function handleCrosstabCellClick(cell, tableId) {
    try {
      const canvasBody = editor.Canvas.getBody();
      const table = canvasBody.querySelector(`#${tableId}`);
      if (!table) return;


      // ✅ NEW: Check if cell is in thead or tbody
      const isHeaderCell = cell.closest('thead') !== null;
      const cellInfo = {
        element: cell,
        tableId,
        isHeader: isHeaderCell
      };

      // ✅ NEW: Check if mixing header and body cells
      if (window.crosstabSelectedCells.length > 0) {
        const firstCellIsHeader = window.crosstabSelectedCells[0].isHeader;
        if (firstCellIsHeader !== isHeaderCell) {
          showToast('Cannot merge header cells with body cells', 'warning');
          return;
        }
      }

      const { cellMap } = buildTableGrid(table);
      const mapEntry = cellMap.get(cell);
      if (!mapEntry) return;

      cellInfo.gridRow = mapEntry.firstRow;
      cellInfo.gridCol = mapEntry.firstCol;
      cellInfo.rowspan = mapEntry.rowspan;
      cellInfo.colspan = mapEntry.colspan;
      // Check if cell is already selected (compare element)
      const existingIndex = window.crosstabSelectedCells.findIndex(
        c => c.element === cell
      );

      if (existingIndex !== -1) {
        // Deselect
        window.crosstabSelectedCells.splice(existingIndex, 1);
        cell.classList.remove('crosstab-selected');
        cell.style.outline = '';
      } else {
        // Select
        window.crosstabSelectedCells.push(cellInfo);
        cell.classList.add('crosstab-selected');
        cell.style.outline = '2px solid #007bff';
      }

      console.log('Selected cells:', window.crosstabSelectedCells.length);
    } catch (err) {
      console.error('handleCrosstabCellClick error:', err);
    }
  }

  // Function to validate if selected cells are consecutive
  function validateConsecutiveCells(selectedCells) {
    if (!selectedCells || selectedCells.length < 2) return false;

    // Build set of occupied grid positions from selected cells
    let minRow = Infinity, maxRow = -Infinity, minCol = Infinity, maxCol = -Infinity;
    const occupied = new Set(); // "r:c"
    for (const s of selectedCells) {
      const r0 = s.gridRow;
      const c0 = s.gridCol;
      const rs = s.rowspan || 1;
      const cs = s.colspan || 1;

      minRow = Math.min(minRow, r0);
      minCol = Math.min(minCol, c0);
      maxRow = Math.max(maxRow, r0 + rs - 1);
      maxCol = Math.max(maxCol, c0 + cs - 1);

      for (let rr = r0; rr < r0 + rs; rr++) {
        for (let cc = c0; cc < c0 + cs; cc++) {
          occupied.add(`${rr}:${cc}`);
        }
      }
    }

    const expectedCellsCount = (maxRow - minRow + 1) * (maxCol - minCol + 1);

    // Ensure every position inside the bounding rectangle is occupied by the selection
    for (let rr = minRow; rr <= maxRow; rr++) {
      for (let cc = minCol; cc <= maxCol; cc++) {
        if (!occupied.has(`${rr}:${cc}`)) {
          return false; // hole found
        }
      }
    }

    // Passed: selection forms a filled rectangle
    return true;
  }

  // Add this helper function before mergeCrosstabCells
  function forceTableComponentRefresh(tableId) {
    try {
      const tableComponent = editor.getWrapper().find(`#${tableId}`)[0];
      if (!tableComponent) return;

      const canvasBody = editor.Canvas.getBody();
      const table = canvasBody.querySelector(`#${tableId}`);
      if (!table) return;

      // Get current HTML state
      const tableHTML = table.outerHTML;
      const parent = tableComponent.parent();
      const index = parent.components().indexOf(tableComponent);

      // Remove old component
      parent.components().remove(tableComponent);

      // Add back with fresh HTML
      const newComponent = parent.components().add(tableHTML, { at: index })[0];

      // Set type back to enhanced-table
      const newTable = newComponent.find('table')[0] || newComponent;
      if (newTable && newTable.get('tagName') === 'table') {
        newTable.set('type', 'enhanced-table');
      }

      // Force refresh
      editor.trigger('component:update', newTable);

      return newTable;
    } catch (error) {
      console.error('Error refreshing table component:', error);
    }
  }

  // Function to merge selected cells
  function mergeCrosstabCells() {
    try {
      if (!window.crosstabSelectedCells || window.crosstabSelectedCells.length < 2) {
        showToast('Select at least 2 cells to merge', 'warning');
        return;
      }

      const anyCell = window.crosstabSelectedCells[0].element;
      const table = anyCell.closest('table');
      const tableId = table.id;

      // Build grid considering existing rowspan/colspan
      const { grid, cellMap } = buildTableGrid(table);

      const selectedPhysicalCells = new Set(window.crosstabSelectedCells.map(s => s.element));

      const selectedPositions = new Set();
      selectedPhysicalCells.forEach(cell => {
        const meta = cellMap.get(cell);
        if (meta) {
          meta.positions.forEach(pos => {
            selectedPositions.add(`${pos.r},${pos.c}`);
          });
        }
      });

      if (selectedPositions.size < 2) {
        showToast('Select at least 2 cells to merge', 'warning');
        return;
      }

      // Determine bounding box
      let minRow = Infinity, maxRow = -Infinity;
      let minCol = Infinity, maxCol = -Infinity;
      selectedPositions.forEach(key => {
        const [r, c] = key.split(',').map(Number);
        minRow = Math.min(minRow, r);
        maxRow = Math.max(maxRow, r);
        minCol = Math.min(minCol, c);
        maxCol = Math.max(maxCol, c);
      });

      // Validate full contiguous rectangle
      const expectedSize = (maxRow - minRow + 1) * (maxCol - minCol + 1);
      if (selectedPositions.size !== expectedSize) {
        showToast('Selected cells must form a complete rectangle without gaps', 'warning');
        return;
      }

      // Find the physical top-left cell
      let topLeftCell = null;
      cellMap.forEach((meta, cell) => {
        if (meta.firstRow === minRow && meta.firstCol === minCol) {
          topLeftCell = cell;
        }
      });

      if (!topLeftCell) {
        showToast('Unable to find top-left cell', 'error');
        return;
      }

      // Calculate new spans
      const newRowspan = maxRow - minRow + 1;
      const newColspan = maxCol - minCol + 1;

      // Collect content from all selected cells
      let mergedContent = [];
      selectedPhysicalCells.forEach(cell => {
        const div = cell.querySelector('div');
        const content = div ? div.textContent : cell.textContent;
        const trimmed = content.trim();
        if (trimmed && trimmed !== 'Text' && !mergedContent.includes(trimmed)) {
          mergedContent.push(trimmed);
        }
      });

      const finalContent = mergedContent.length > 0 ? mergedContent.join(' ') : 'Text';

      // ✅ Get GrapesJS table component FIRST
      const tableComponent = editor.getWrapper().find(`#${tableId}`)[0];
      if (!tableComponent) {
        showToast('Table component not found', 'error');
        return;
      }

      // ✅ Find the top-left cell component in GrapesJS
      const topLeftComponent = getComponentFromDom(topLeftCell);

      if (topLeftComponent) {
        // ✅ Update attributes in GrapesJS component
        topLeftComponent.addAttributes({
          rowspan: newRowspan.toString(),
          colspan: newColspan.toString()
        });

        // ✅ Update content in GrapesJS component
        topLeftComponent.components(`<div>${finalContent}</div>`);

        // ✅ Collect cells to remove from GrapesJS
        const toRemoveComponents = [];
        cellMap.forEach((meta, cell) => {
          if (cell === topLeftCell) return;
          const overlaps = meta.positions.some(pos =>
            pos.r >= minRow && pos.r <= maxRow && pos.c >= minCol && pos.c <= maxCol
          );
          if (overlaps) {
            const cellComponent = getComponentFromDom(cell);
            if (cellComponent) {
              toRemoveComponents.push(cellComponent);
            }
          }
        });

        // ✅ Remove components from GrapesJS structure
        toRemoveComponents.forEach(comp => {
          const parent = comp.parent();
          if (parent) {
            parent.components().remove(comp);
          }
        });
      }

      // ✅ Update DOM (for immediate visual feedback)
      topLeftCell.rowSpan = newRowspan;
      topLeftCell.colSpan = newColspan;
      topLeftCell.innerHTML = `<div>${finalContent}</div>`;

      // Remove cells from DOM
      const toRemove = new Set();
      cellMap.forEach((meta, cell) => {
        if (cell === topLeftCell) return;
        const overlaps = meta.positions.some(pos =>
          pos.r >= minRow && pos.r <= maxRow && pos.c >= minCol && pos.c <= maxCol
        );
        if (overlaps) {
          toRemove.add(cell);
        }
      });

      toRemove.forEach(cell => {
        if (cell.parentNode) cell.parentNode.removeChild(cell);
      });

      // ✅ Clear selection state
      window.crosstabSelectedCells.forEach(s => {
        if (s.element && s.element.classList) {
          s.element.classList.remove('crosstab-selected');
          s.element.style.outline = '';
        }
      });
      window.crosstabSelectedCells = [];

      // ✅ Force GrapesJS to refresh
      editor.trigger('component:update', tableComponent);

      // ✅ Force layer manager refresh
      setTimeout(() => {
        editor.trigger('layer:refresh');

        // Update each row
        const allRows = tableComponent.find('tr');
        allRows.forEach(row => {
          editor.trigger('component:update', row);
        });

        editor.trigger('component:update', tableComponent);
      }, 100);

      // Update DataTable structure
      updateDataTableStructure(tableId);

      // Re-enable cell selection for all cells
      setTimeout(() => {
        const allCells = table.querySelectorAll('td, th');
        allCells.forEach(cell => {
          const comp = getComponentFromDom(cell);
          if (comp) {
            comp.set({
              selectable: true,
              hoverable: true,
              editable: true
            });
          }
        });

        // Ensure rows don't override cell selection
        const allRows = table.querySelectorAll('tr');
        allRows.forEach(row => {
          const comp = getComponentFromDom(row);
          if (comp) {
            comp.set({
              selectable: false,
              hoverable: false
            });
          }
        });
      }, 300);

      showToast('Cells merged successfully', 'success');
    } catch (error) {
      console.error('Error merging cells:', error);
      showToast('Error merging cells: ' + error.message, 'error');
    }
  }


  // Override the default HTML export to include running total data
  const originalGetHtml = editor.getHtml;
  editor.getHtml = function () {
    try {
      // Get the original HTML
      let html = originalGetHtml.call(this);

      // Process HTML to ensure running total cells are properly included
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;

      // Find all tables and restore running total data from the canvas
      const canvasBody = editor.Canvas.getBody();
      const exportTables = tempDiv.querySelectorAll('table[id^="table"]');

      exportTables.forEach(exportTable => {
        const tableId = exportTable.id;
        const canvasTable = canvasBody.querySelector(`#${tableId}`);

        if (canvasTable) {
          // Copy running total cells from canvas to export
          const canvasRunningCells = canvasTable.querySelectorAll('[data-running-total-cell], [data-running-total-header]');
          const exportRows = exportTable.querySelectorAll('tr');
          const canvasRows = canvasTable.querySelectorAll('tr');

          canvasRows.forEach((canvasRow, rowIndex) => {
            const exportRow = exportRows[rowIndex];
            if (exportRow && canvasRow) {
              const canvasCells = canvasRow.querySelectorAll('td, th');
              const exportCells = exportRow.querySelectorAll('td, th');

              canvasCells.forEach((canvasCell, cellIndex) => {
                const exportCell = exportCells[cellIndex];

                if (exportCell && canvasCell &&
                  (canvasCell.hasAttribute('data-running-total-cell') ||
                    canvasCell.hasAttribute('data-running-total-header'))) {

                  // Copy running total attributes
                  ['data-running-total-cell', 'data-running-total-for', 'data-running-total-value', 'data-running-total-header'].forEach(attr => {
                    if (canvasCell.hasAttribute(attr)) {
                      exportCell.setAttribute(attr, canvasCell.getAttribute(attr));
                    }
                  });

                  // Copy the content
                  const content = canvasCell.textContent || canvasCell.innerHTML;
                  if (content) {
                    exportCell.innerHTML = `<div>${content}</div>`;
                  }

                  // Copy any styling
                  if (canvasCell.style.cssText) {
                    exportCell.style.cssText = canvasCell.style.cssText;
                  }
                }
              });
            }
          });
        }
      });

      return tempDiv.innerHTML;

    } catch (error) {
      console.warn('Error in enhanced HTML export:', error);
      return originalGetHtml.call(this);
    }
  };
  // Add custom table component type with highlighting traits
  editor.DomComponents.addType('enhanced-table', {
    isComponent: el => el.tagName === 'TABLE' && el.id && el.id.startsWith('table'),
    model: {
      defaults: {
        tagName: 'table',
        selectable: true,
        hoverable: true,
        editable: true,
        droppable: false,
        draggable: true,
        removable: true,
        copyable: true,
        resizable: false,
        traits: [
          {
            type: 'button',
            name: 'table-settings-btn',
            label: 'Table Settings',
            text: 'Table Settings',
            full: true,
            command: 'open-custom-table-settings'
          },
          {
            type: 'button',
            name: 'manage-table-styles',
            label: 'Table Styles',
            text: 'Customize Table Styles',
            full: true,
            command: 'open-custom-table-style-manager'
          },
          {
            type: 'button',
            name: 'manage-highlight-conditions',
            label: 'Highlight',
            text: 'Highlight Conditions',
            full: true,
            command: 'open-table-condition-manager-local-table'
          },
          {
            type: 'checkbox',
            name: 'crosstab-mode',
            label: 'Stop (Enable Crosstab Mode)',
            changeProp: 1
          },
          {
            type: 'button',
            name: 'merge-cells',
            label: 'Merge Selected Cells',
            text: 'Merge',
            full: true,
            command: 'merge-table-cells'
          },
        ],
        'custom-name': 'Enhanced Table',
        'highlight-conditions': [],
        'highlight-color': '#ffff99',
        'highlight-styles': {},
        // Style properties
        'table-border-style': 'solid',
        'table-border-width': '1',
        'table-border-color': '#000000',
        'table-border-opacity': '100',
        'table-bg-color': '#ffffff',
        'table-text-color': '#000000',
        'table-font-family': 'Arial, sans-serif',
        'table-text-align': 'left',
        'table-vertical-align': 'middle',
        // Grouping & Summary properties
        'grouping-fields': [],
        'summary-fields': [],
        'sort-order': 'ascending',
        'top-n': 'none',
        'top-n-value': 10,
        'define-named-group': false,
        'named-groups': {},
        'summarize-group': false,
        'page-break': false,
        'merge-group-cells': false,
        'group-header-inplace': true,
        'hide-subtotal-single-row': false,
        'show-summary-only': false,
        'keep-group-hierarchy': false,
        'grand-total': true,
        'grand-total-label': 'Grand Total',
        'summary-label': 'Subtotal',
        // Running Total properties
        'running-totals': [],
        'selected-running-total-columns': [],
        // Base data storage
        'base-headers': null,
        'base-data': null,
      },

      init() {
        this.on('change:highlight-condition-type change:highlight-words change:highlight-color', this.handleHighlightChange);
        this.on('change:crosstab-mode', this.handleCrosstabModeChange);
        this.on('change:table-border-style change:table-border-width change:table-border-color change:table-border-opacity change:table-bg-color change:table-text-color change:table-font-family change:table-text-align change:table-vertical-align', this.applyTableStyles);

        // Grouping & Summary listeners
        this.on('change:grouping-fields change:summary-fields change:sort-order change:top-n change:summarize-group change:merge-group-cells change:show-summary-only change:grand-total', this.applyGroupingAndSummary);

        // Store base table data on initialization
        this.storeBaseTableData();
      },

      storeBaseTableData() {
        try {
          const tableId = this.getId();
          const canvasDoc = editor.Canvas.getDocument();
          const tableElement = canvasDoc.getElementById(tableId);
          if (!tableElement) return;

          const headers = {};
          const data = [];

          // Extract headers
          const headerRow = tableElement.querySelector('thead tr');
          if (headerRow) {
            const headerCells = headerRow.querySelectorAll('th');
            headerCells.forEach((th, index) => {
              const key = `col${index}`;
              const text = th.textContent.trim();
              headers[key] = text;
            });
          }

          // Extract data
          const bodyRows = tableElement.querySelectorAll('tbody tr');
          bodyRows.forEach(row => {
            const rowData = {};
            const cells = row.querySelectorAll('td');
            cells.forEach((td, index) => {
              const key = `col${index}`;
              rowData[key] = td.textContent.trim();
            });
            if (Object.keys(rowData).length > 0) {
              data.push(rowData);
            }
          });

          this.set('base-headers', headers, { silent: true });
          this.set('base-data', data, { silent: true });

        } catch (error) {
          console.warn('Error storing base table data:', error);
        }
      },

      getTableHeaders() {
        return this.get('base-headers') || {};
      },

      getTableData() {
        return this.get('base-data') || [];
      },

      applyGroupingAndSummary() {
        const groupingFields = this.get('grouping-fields') || [];
        const summarizeGroup = this.get('summarize-group') || false;
        const summaryFields = this.get('summary-fields') || [];
        const data = this.getTableData();
        const headers = this.getTableHeaders();

        console.log('🔧 applyGroupingAndSummary called:', {
          groupingFields: groupingFields.length,
          summarizeGroup,
          summaryFields: summaryFields.length,
          dataRows: data.length
        });

        if (groupingFields.length === 0) {
          console.log('✅ No grouping - restoring original data');
          this.rebuildTableHTML(headers, data);
          return;
        }

        if (summarizeGroup && summaryFields.length === 0) {
          showToast('Please add at least one summary field', 'warning');
          this.set('summarize-group', false);
          return;
        }

        const groupedData = this.groupData(data, groupingFields);
        this.rebuildTableHTML(headers, groupedData);
      },

      groupData(data, groupingFields) {
        if (!groupingFields || groupingFields.length === 0) return data;
        if (!Array.isArray(data) || data.length === 0) return data;

        const grouped = {};
        const sortOrder = this.get('sort-order') || 'ascending';
        const topN = this.get('top-n') || 'none';
        const topNValue = parseInt(this.get('top-n-value')) || 10;
        const summarizeGroup = this.get('summarize-group') || false;
        const showSummaryOnly = this.get('show-summary-only') || false;
        const mergeGroupCells = this.get('merge-group-cells') || false;
        const hideSubtotalSingleRow = this.get('hide-subtotal-single-row') || false;

        // Group data
        data.forEach(row => {
          if (!row || typeof row !== 'object') return;
          const groupKey = groupingFields.map(field => row[field.key] || '').join('|');
          if (!grouped[groupKey]) {
            grouped[groupKey] = {
              key: groupKey,
              values: groupingFields.map(field => row[field.key] || ''),
              rows: []
            };
          }
          grouped[groupKey].rows.push(row);
        });

        if (Object.keys(grouped).length === 0) return data;

        // Sort groups
        let sortedGroupKeys = Object.keys(grouped);
        if (sortOrder === 'ascending') {
          sortedGroupKeys.sort();
        } else if (sortOrder === 'descending') {
          sortedGroupKeys.sort().reverse();
        }

        // Apply Top N
        if (topN !== 'none' && topN !== 'sort-all' && topNValue > 0) {
          if (topN === 'top') {
            sortedGroupKeys = sortedGroupKeys.slice(0, topNValue);
          } else if (topN === 'bottom') {
            sortedGroupKeys = sortedGroupKeys.slice(-topNValue);
          }
        }

        const result = [];
        const selectedSummaryFields = this.get('summary-fields') || [];

        sortedGroupKeys.forEach((groupKey, groupIndex) => {
          const group = grouped[groupKey];

          if (showSummaryOnly) {
            if (summarizeGroup && selectedSummaryFields.length > 0) {
              const summaryRow = this.createSummaryRow(group.rows, groupKey);
              summaryRow._isSummary = true;
              summaryRow._groupIndex = groupIndex;
              result.push(summaryRow);
            }
          } else {
            group.rows.forEach((row, rowIdx) => {
              const newRow = { ...row };
              if (mergeGroupCells && rowIdx === 0) {
                newRow._groupStart = true;
                newRow._groupSize = group.rows.length;
                newRow._groupIndex = groupIndex;
                groupingFields.forEach(field => {
                  newRow[`_merge_${field.key}`] = true;
                });
              }
              result.push(newRow);
            });

            if (summarizeGroup && selectedSummaryFields.length > 0 &&
              !(hideSubtotalSingleRow && group.rows.length === 1)) {
              const summaryRow = this.createSummaryRow(group.rows, groupKey);
              summaryRow._isSummary = true;
              summaryRow._groupIndex = groupIndex;
              result.push(summaryRow);
            }
          }
        });

        // Add grand total
        if (this.get('grand-total')) {
          const grandTotalRow = this.createGrandTotalRow(result.filter(r => !r._isSummary && !r._isGrandTotal));
          grandTotalRow._isGrandTotal = true;
          result.push(grandTotalRow);
        }

        return result;
      },

      createSummaryRow(groupRows, groupKey) {
        const summaryFields = this.get('summary-fields') || [];
        const headers = this.getTableHeaders();
        const summaryLabel = this.get('summary-label') || 'Subtotal';

        const summaryRow = {};
        Object.keys(headers).forEach(key => {
          summaryRow[key] = '';
        });

        const firstKey = Object.keys(headers)[0];
        summaryRow[firstKey] = summaryLabel;

        if (summaryFields.length > 0) {
          summaryFields.forEach(field => {
            const values = groupRows.map(row => parseFloat(row[field.key]) || 0);

            switch (field.function) {
              case 'sum':
                summaryRow[field.key] = values.reduce((a, b) => a + b, 0).toFixed(2);
                break;
              case 'average':
                summaryRow[field.key] = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
                break;
              case 'count':
                summaryRow[field.key] = values.length;
                break;
              case 'min':
                summaryRow[field.key] = Math.min(...values).toFixed(2);
                break;
              case 'max':
                summaryRow[field.key] = Math.max(...values).toFixed(2);
                break;
            }
          });
        }

        return summaryRow;
      },

      createGrandTotalRow(data) {
        const summaryFields = this.get('summary-fields') || [];
        const headers = this.getTableHeaders();
        const grandTotalLabel = this.get('grand-total-label') || 'Grand Total';

        const grandTotalRow = {};
        Object.keys(headers).forEach(key => {
          grandTotalRow[key] = '';
        });

        const firstKey = Object.keys(headers)[0];
        grandTotalRow[firstKey] = grandTotalLabel;

        // Calculate for numeric columns
        const numericColumns = {};
        Object.keys(headers).forEach(key => {
          const isStrictlyNumeric = data.every(row => {
            let value = row[key];
            if (value === '' || value === null || value === undefined) return true;
            value = String(value).trim();
            if (/^\(.*\)$/.test(value)) value = '-' + value.slice(1, -1);
            value = value.replace(/[$£€₹,\s]/g, '');
            if (/^-?\d+(\.\d{3})*,\d+$/.test(value)) {
              value = value.replace(/\./g, '').replace(',', '.');
            }
            const numValue = Number(value);
            return typeof numValue === 'number' && !isNaN(numValue);
          });

          if (isStrictlyNumeric && data.some(row => row[key] !== '' && row[key] !== null && row[key] !== undefined)) {
            numericColumns[key] = true;
          }
        });

        Object.keys(numericColumns).forEach(key => {
          const values = data.map(row => {
            let value = row[key];
            if (value === '' || value === null || value === undefined) return 0;
            value = String(value).trim();
            if (/^\(.*\)$/.test(value)) value = '-' + value.slice(1, -1);
            value = value.replace(/[$£€₹,\s]/g, '');
            if (/^-?\d+(\.\d{3})*,\d+$/.test(value)) {
              value = value.replace(/\./g, '').replace(',', '.');
            }
            return parseFloat(value) || 0;
          });

          const summaryField = summaryFields.find(f => f.key === key);
          const func = summaryField ? summaryField.function : 'sum';

          switch (func) {
            case 'sum':
              grandTotalRow[key] = values.reduce((a, b) => a + b, 0).toFixed(2);
              break;
            case 'average':
              grandTotalRow[key] = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
              break;
            case 'count':
              grandTotalRow[key] = values.length;
              break;
            case 'min':
              grandTotalRow[key] = Math.min(...values).toFixed(2);
              break;
            case 'max':
              grandTotalRow[key] = Math.max(...values).toFixed(2);
              break;
          }
        });

        return grandTotalRow;
      },

      rebuildTableHTML(headers, data) {
        try {
          const tableId = this.getId();
          const canvasDoc = editor.Canvas.getDocument();
          const tableElement = canvasDoc.getElementById(tableId);
          if (!tableElement) return;

          const mergeGroupCells = this.get('merge-group-cells') || false;

          // Clear tbody
          let tbody = tableElement.querySelector('tbody');
          if (!tbody) {
            tbody = canvasDoc.createElement('tbody');
            tableElement.appendChild(tbody);
          }
          tbody.innerHTML = '';

          // Rebuild rows
          data.forEach((row, rowIndex) => {
            const isSummary = row._isSummary;
            const isGrandTotal = row._isGrandTotal;
            const isGroupStart = row._groupStart;
            const groupSize = row._groupSize || 1;

            const tr = canvasDoc.createElement('tr');

            if (isSummary) {
              tr.style.backgroundColor = '#f0f8ff';
              tr.style.fontWeight = 'bold';
            } else if (isGrandTotal) {
              tr.style.backgroundColor = '#e8f5e9';
              tr.style.fontWeight = 'bold';
            } else {
              tr.style.backgroundColor = rowIndex % 2 === 0 ? '#ffffff' : '#f8f9fa';
            }

            Object.keys(headers).forEach(key => {
              if (row[`_skip_${key}`]) return;

              const td = canvasDoc.createElement('td');
              td.innerHTML = `<div>${row[key] || ''}</div>`;
              td.style.padding = '8px';
              td.style.border = '1px solid #000';

              if (isGroupStart && row[`_merge_${key}`] && mergeGroupCells) {
                td.setAttribute('rowspan', groupSize.toString());
                for (let i = 1; i < groupSize; i++) {
                  if (data[rowIndex + i]) {
                    data[rowIndex + i][`_skip_${key}`] = true;
                  }
                }
              }

              tr.appendChild(td);
            });

            tbody.appendChild(tr);
          });

          // Update DataTable if exists
          updateDataTableStructure(tableId);

        } catch (error) {
          console.error('Error rebuilding table HTML:', error);
        }
      },

      applyTableStyles() {
        const tableId = this.getId();
        const canvasDoc = editor.Canvas.getDocument();
        const tableElement = canvasDoc.getElementById(tableId);
        if (!tableElement) return;

        const borderStyle = this.get('table-border-style') || 'solid';
        const borderWidth = this.get('table-border-width') || '1';
        const borderColor = this.get('table-border-color') || '#000000';
        const borderOpacity = this.get('table-border-opacity') || '100';
        const bgColor = this.get('table-bg-color') || '#ffffff';
        const textColor = this.get('table-text-color') || '#000000';
        const fontFamily = this.get('table-font-family') || 'Arial, sans-serif';
        const textAlign = this.get('table-text-align') || 'left';
        const verticalAlign = this.get('table-vertical-align') || 'middle';

        const opacity = parseInt(borderOpacity) / 100;
        const rgbBorder = hexToRgb(borderColor);
        const borderColorWithOpacity = `rgba(${rgbBorder.r}, ${rgbBorder.g}, ${rgbBorder.b}, ${opacity})`;

        const wrapper = editor.DomComponents.getWrapper();
        const tableComp = wrapper.find(`#${tableId}`)[0];

        if (tableComp) {
          tableComp.addStyle({
            'background-color': bgColor,
            'border-collapse': 'collapse',
          });

          const cells = tableComp.find('td, th');
          cells.forEach(cellComp => {
            const borderValue = borderStyle === 'none' ? 'none' : `${borderWidth}px ${borderStyle} ${borderColorWithOpacity}`;

            cellComp.addStyle({
              'border': borderValue,
              'color': textColor,
              'font-family': fontFamily,
              'background-color': bgColor,
              'padding': '8px',
              'vertical-align': verticalAlign,
              'text-align': textAlign,
            });

            const cellContent = cellComp.find('div')[0];
            if (cellContent) {
              cellContent.addStyle({
                'display': 'flex',
                'align-items': verticalAlign === 'top' ? 'flex-start' :
                  verticalAlign === 'bottom' ? 'flex-end' : 'center',
                'justify-content': textAlign === 'left' ? 'flex-start' :
                  textAlign === 'right' ? 'flex-end' : 'center',
                'min-height': '100%',
                'width': '100%',
                'box-sizing': 'border-box',
              });
            }
          });
        }

        this.set('table-styles-applied', {
          borderStyle, borderWidth, borderColor, borderOpacity,
          bgColor, textColor, fontFamily, textAlign, verticalAlign
        });
      },

      getHighlightConditions() {
        return this.get('highlight-conditions') || [];
      },

      setHighlightConditions(conditions) {
        this.set('highlight-conditions', conditions);
        this.handleHighlightChange();
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

      handleHighlightChange() {
        const tableId = this.getId();
        const conditions = this.getHighlightConditions();
        const styles = this.get('highlight-styles') || {
          backgroundColor: '#ffff99',
          textColor: '#000000',
          fontFamily: ''
        };

        applyMultipleHighlightingWithStyles(tableId, conditions, styles);
        editor.trigger('component:update', this);
      },

      handleCrosstabModeChange() {
        const tableId = this.getId();
        const enabled = this.get('crosstab-mode');
        enableCrosstabSelection(tableId, enabled);
      },
    }
  });


  // Add commands for highlighting
  editor.Commands.add('apply-table-highlighting', {
    run(editor) {
      const selected = editor.getSelected();
      if (selected && selected.get('tagName') === 'table') {
        const tableId = selected.getId();
        const conditionType = selected.get('highlight-condition-type');
        const conditionValue = selected.get('highlight-words');
        const color = selected.get('highlight-color');

        if (!conditionType) {
          showToast('Please select a highlight condition type first', 'warning');
          return;
        }

        if (conditionType !== 'null' && !conditionValue) {
          showToast('Please enter highlight words/conditions', 'warning');
          return;
        }

        applyHighlighting(tableId, conditionType, conditionValue, color);
        showToast('Cell highlighting applied successfully!', 'success');

        editor.trigger('component:update', selected);
      }
    }
  });

  editor.Commands.add('clear-table-highlighting', {
    run(editor) {
      const selected = editor.getSelected();
      if (selected && selected.get('tagName') === 'table') {
        const tableId = selected.getId();

        applyHighlighting(tableId, '', '', '');

        selected.set('highlight-condition-type', '');
        selected.set('highlight-words', '');
        selected.set('highlight-color', '');

        showToast('Highlighting cleared successfully!', 'success');

        editor.trigger('component:update', selected);
      }
    }
  });


  // Add command to show all formulas
  editor.Commands.add('show-all-formulas', {
    run(editor) {
      showAllFormulasModal();
    }
  });

  editor.Commands.add('merge-table-cells', {
    run(editor) {
      const selected = editor.getSelected();
      if (selected && selected.get('tagName') === 'table') {
        const crosstabMode = selected.get('crosstab-mode');

        if (!crosstabMode) {
          showToast('Please enable "Stop" mode first to merge cells', 'warning');
          return;
        }

        mergeCrosstabCells();
      }
    }
  });

  // ✅ Table Style Manager Command
  editor.Commands.add('open-custom-table-style-manager', {
    run(editor) {
      const selected = editor.getSelected();
      if (!selected || selected.get('tagName') !== 'table') return;

      const modalContent = `
      <div class="table-style-manager" style="padding: 20px; max-width: 600px;">
        
        <div class="style-section" style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
          <h4 style="margin-top: 0;">Border Settings</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">Border Style:</label>
              <select id="border-style" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                <option value="none">None</option>
                <option value="solid">Solid</option>
                <option value="double">Double</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
                <option value="groove">Groove</option>
                <option value="ridge">Ridge</option>
                <option value="inset">Inset</option>
                <option value="outset">Outset</option>
              </select>
            </div>
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">Border Width (px):</label>
              <input type="number" id="border-width" min="0" max="10" value="1" style="width: 94%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">Border Color:</label>
              <input type="color" id="border-color" value="#000000" style="width: 100%; height: 40px; border: none; border-radius: 4px;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">Border Opacity (%):</label>
              <input type="range" id="border-opacity" min="0" max="100" value="100" style="width: 100%;">
              <span id="opacity-value">100%</span>
            </div>
          </div>
        </div>

        <div class="style-section" style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
          <h4 style="margin-top: 0;">Colors & Font</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">Background Color:</label>
              <input type="color" id="bg-color" value="#ffffff" style="width: 100%; height: 40px; border: none; border-radius: 4px;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">Text Color:</label>
              <input type="color" id="text-color" value="#000000" style="width: 100%; height: 40px; border: none; border-radius: 4px;">
            </div>
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">Font Family:</label>
              <select id="font-family" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                <option value="Arial, sans-serif">Arial</option>
                <option value="Verdana, sans-serif">Verdana</option>
                <option value="'Times New Roman', serif">Times New Roman</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="'Courier New', monospace">Courier New</option>
                <option value="Tahoma, sans-serif">Tahoma</option>
                <option value="Helvetica, sans-serif">Helvetica</option>
              </select>
            </div>
          </div>
        </div>

        <div class="style-section" style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
          <h4 style="margin-top: 0;">Alignment</h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">Horizontal Align:</label>
              <select id="text-align" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div>
              <label style="display: block; margin-bottom: 5px; font-weight: bold;">Vertical Align:</label>
              <select id="vertical-align" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                <option value="top">Top</option>
                <option value="middle">Middle</option>
                <option value="bottom">Bottom</option>
              </select>
            </div>
          </div>
        </div>

        <div style="text-align: right;">
          <button id="reset-styles" style="background: #ffc107; color: #000; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-right: 10px;">Reset to Default</button>
          <button id="cancel-styles" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-right: 10px;">Cancel</button>
          <button id="apply-styles" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Apply Styles</button>
        </div>
      </div>
    `;

      editor.Modal.setTitle('Customize Table Styles');
      editor.Modal.setContent(modalContent);
      editor.Modal.open();

      setTimeout(() => {
        initializeCustomTableStyleManager(selected);
      }, 100);
    }
  });

  editor.Commands.add('open-custom-table-settings', {
    run(editor) {
      const selected = editor.getSelected();
      if (!selected || selected.get('tagName') !== 'table') return;

      const headers = selected.getTableHeaders();
      const availableFields = Object.entries(headers).map(([key, name]) => ({
        key, name
      }));

      const modalContent = `
<div class="table-settings-modal" style="width: 800px; max-height: 80vh; display: flex; flex-direction: column;">
    <!-- Navbar -->
    <div class="settings-navbar" style="display: flex; border-bottom: 2px solid #ddd; background: #f8f9fa; flex-shrink: 0;">
        <button class="nav-tab active" data-tab="settings" style="flex: 1; padding: 12px; border: none; cursor: pointer; font-weight: bold; border-bottom: 3px solid #007bff;">Settings</button>
        <button class="nav-tab" data-tab="grouping" style="flex: 1; padding: 12px; border: none; background: transparent; cursor: pointer;">Grouping & Summary</button>
        <button class="nav-tab" data-tab="running-total" style="flex: 1; padding: 12px; border: none; background: transparent; cursor: pointer;">Running Total</button>
        <button class="nav-tab" data-tab="options" style="flex: 1; padding: 12px; border: none; background: transparent; cursor: pointer;">Options</button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content" style="padding: 15px; flex: 1; overflow-y: auto; min-height: 0;">
        <!-- Settings Tab -->
        <div id="settings-tab" class="tab-pane active">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <fieldset style="border: 1px solid #ddd; padding: 15px; border-radius: 4px;">
                        <legend style="font-weight: bold; padding: 0 10px;">Row Operations</legend>
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Number of Rows:</label>
                            <input type="number" id="row-count" min="1" value="1" style="width: 95%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button id="add-rows" style="flex: 1; padding: 8px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Add Rows</button>
                            <button id="remove-rows" style="flex: 1; padding: 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Remove Rows</button>
                        </div>
                    </fieldset>

                    <fieldset style="border: 1px solid #ddd; padding: 15px; border-radius: 4px; margin-top: 15px;">
                        <legend style="font-weight: bold; padding: 0 10px;">Column Operations</legend>
                        <div style="margin-bottom: 15px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Number of Columns:</label>
                            <input type="number" id="column-count" min="1" value="1" style="width: 95%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <div style="display: flex; gap: 10px;">
                            <button id="add-columns" style="flex: 1; padding: 8px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">Add Columns</button>
                            <button id="remove-columns" style="flex: 1; padding: 8px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Remove Columns</button>
                        </div>
                    </fieldset>
                </div>
                
                <div>
                    <fieldset style="border: 1px solid #ddd; padding: 15px; border-radius: 4px;">
                        <legend style="font-weight: bold; padding: 0 10px;">Column Order</legend>
                        <div id="column-reorder-section">
                            <div id="column-list-inline" style="border: 1px solid #ddd; border-radius: 5px; max-height: 300px; overflow-y: auto;">
                                <!-- Will be populated -->
                            </div>
                            <div style="margin-top: 10px; display: flex; justify-content: space-between;">
                                <button id="reset-order" style="background: #ffc107; color: #000; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer;">
                                    Reset to Original
                                </button>
                            </div>
                        </div>
                    </fieldset>
                </div>
            </div>
        </div>

        <!-- Grouping & Summary Tab -->
        <div id="grouping-tab" class="tab-pane" style="display: none;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <h4 style="margin: 0;">Available Fields</h4>
                <div style="display: flex; gap: 5px;">
                  <button id="sort-asc" style="padding: 4px 8px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 3px; cursor: pointer; font-size: 11px;">↑ A-Z</button>
                  <button id="sort-desc" style="padding: 4px 8px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 3px; cursor: pointer; font-size: 11px;">↓ Z-A</button>
                </div>
              </div>
              <div id="available-fields" style="border: 1px solid #ddd; border-radius: 5px; max-height: 300px; overflow-y: auto;"></div>
            </div>

            <div>
              <h4 style="margin-bottom: 13.5px; margin-top: 0;">Selected Grouping Fields</h4>
              <div id="selected-fields" style="border: 1px solid #ddd; border-radius: 5px; min-height: 10px; max-height: 300px; overflow-y: auto;">
                <p style="color: #999; text-align: center;">No fields selected</p>
              </div>
            </div>
          </div>

          <!-- Summary Fields Section -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
              <div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                      <h4 style="margin: 0;">Available Fields for Summary</h4>
                      <div style="display: flex; gap: 5px;">
                          <button id="sort-summary-asc" style="padding: 4px 8px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 3px; cursor: pointer; font-size: 11px;">↑ A-Z</button>
                          <button id="sort-summary-desc" style="padding: 4px 8px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 3px; cursor: pointer; font-size: 11px;">↓ Z-A</button>
                      </div>
                  </div>
                  <div id="available-summary-fields" style="border: 1px solid #ddd; border-radius: 5px; max-height: 300px; overflow-y: auto;"></div>
              </div>

              <div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                      <h4 style="margin: 0;">Summary Configuration</h4>
                  </div>
                  
                  <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; border-radius: 5px; background: #f8f9fa;">
                      <label style="font-weight: bold; display: block; margin-bottom: 5px; font-size: 12px;">Function:</label>
                      <select id="summary-function" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 8px;">
                          <option value="sum">Sum</option>
                          <option value="average">Average</option>
                          <option value="count">Count</option>
                          <option value="min">Min</option>
                          <option value="max">Max</option>
                      </select>
                      <button id="add-summary-field" style="width: 100%; padding: 8px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
                          + Add Summary
                      </button>
                  </div>
                  
                  <div>
                      <label style="font-weight: bold; display: block; margin-bottom: 5px; font-size: 12px;">Active Summaries:</label>
                      <div id="selected-summary-fields" style="border: 1px solid #ddd; border-radius: 5px; min-height: 100px; max-height: 150px; overflow-y: auto; padding: 5px;">
                          <p style="color: #999; text-align: center; font-size: 12px; margin: 10px 0;">No summaries configured</p>
                      </div>
                  </div>
              </div>
          </div>

          <!-- Grouping Options Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            <fieldset style="border: 1px solid #ddd; padding: 15px; border-radius: 4px; margin: 0;">
              <legend style="font-weight: bold; padding: 0 10px;">Sort & Filter</legend>
              <div style="margin-bottom: 15px;">
                <label style="font-weight: bold; display: block; margin-bottom: 5px; font-size: 12px;">Sort Order:</label>
                <select id="sort-order" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                  <option value="ascending">Ascending</option>
                  <option value="descending">Descending</option>
                  <option value="original">Original Order</option>
                </select>
              </div>
              <div style="margin-bottom: 10px;">
                <label style="font-weight: bold; display: block; margin-bottom: 5px; font-size: 12px;">Top N:</label>
                <select id="top-n" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                  <option value="none">None</option>
                  <option value="top">Top N Groups</option>
                  <option value="bottom">Bottom N Groups</option>
                  <option value="sort-all">Sort All (No Limit)</option>
                </select>
              </div>
              <div>
                <label style="font-weight: bold; display: block; margin-bottom: 5px; font-size: 12px;">N Value:</label>
                <input type="number" id="top-n-value" value="10" min="1" style="width: calc(100% - 16px); padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
              </div>
            </fieldset>

            <fieldset style="border: 1px solid #ddd; padding: 15px; border-radius: 4px; margin: 0;">
              <legend style="font-weight: bold; padding: 0 10px;">Group Options</legend>
              <label style="display: flex; align-items: center; margin-bottom: 10px;">
                  <input type="checkbox" id="summarize-group" style="margin-right: 8px;">
                  <span style="font-weight: bold;">Summarize Group</span>
              </label>
              <label style="display: flex; align-items: center; margin-bottom: 10px;">
                  <input type="checkbox" id="page-break" style="margin-right: 8px;">
                  <span style="font-weight: bold;">Page Break After Group</span>
              </label>
              <label style="display: flex; align-items: center;">
                  <input type="checkbox" id="merge-group-cells" style="margin-right: 8px;">
                  <span style="font-weight: bold;">Merge Group Header Cells</span>
              </label>
            </fieldset>
          </div>
        </div>

        <!-- Running Total Tab -->
        <div id="running-total-tab" class="tab-pane" style="display: none;">
          <div style="text-align: center; padding: 40px; color: #666;">
            <p>Running Total functionality coming soon...</p>
            <p style="font-size: 12px;">This feature will allow you to add cumulative totals to numeric columns.</p>
          </div>
        </div>

        <!-- Options Tab -->
        <div id="options-tab" class="tab-pane" style="display: none;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div>
                    <fieldset style="border: 1px solid #ddd; padding: 15px; border-radius: 4px; margin-bottom: 15px;">
                        <legend style="font-weight: bold;">Display Options</legend>
                        <label style="display: flex; align-items: center; margin-bottom: 10px;">
                            <input type="checkbox" id="group-header-inplace" checked style="margin-right: 8px;">
                            <span>Group Header In-place</span>
                        </label>
                        <label style="display: flex; align-items: center; margin-bottom: 10px;">
                            <input type="checkbox" id="hide-subtotal-single-row" style="margin-right: 8px;">
                            <span>Hide Subtotal for Single Row</span>
                        </label>
                    </fieldset>
                </div>
                <div>
                    <fieldset style="border: 1px solid #ddd; padding: 15px; border-radius: 4px;">
                        <legend style="font-weight: bold;">Total Options</legend>
                        <label style="display: flex; align-items: center; margin-bottom: 10px;">
                            <input type="checkbox" id="grand-total" checked style="margin-right: 8px;">
                            <span>Show Grand Total</span>
                        </label>
                        <input type="text" id="grand-total-label" placeholder="Grand Total Label" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 10px;">
                        <input type="text" id="summary-label" placeholder="Summary Label" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </fieldset>
                </div>
            </div>

            <fieldset style="border: 1px solid #ddd; padding: 15px; border-radius: 4px; margin-top: 15px;">
                <legend style="font-weight: bold;">Grouping Type</legend>
                <label style="display: flex; align-items: center; margin-bottom: 10px;">
                    <input type="radio" name="grouping-type" value="normal" checked style="margin-right: 8px;">
                    <span>Show All Records</span>
                </label>
                <label style="display: flex; align-items: center;">
                    <input type="radio" name="grouping-type" value="summary" style="margin-right: 8px;">
                    <span>Show Summary Only</span>
                </label>
                <label style="display: flex; align-items: center; margin-top: 10px; margin-left: 25px;">
                    <input type="checkbox" id="keep-group-hierarchy" disabled style="margin-right: 8px;">
                    <span>Keep Group Hierarchy</span>
                </label>
            </fieldset>
        </div>
    </div>

    <!-- Footer Buttons -->
    <div style="border-top: 1px solid #ddd; padding: 15px; display: flex; justify-content: flex-end; gap: 10px; flex-shrink: 0;">
        <button id="cancel-settings" style="padding: 8px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
        <button id="apply-settings" style="padding: 8px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">OK</button>
    </div>
</div>
    `;

      editor.Modal.setTitle('Table Settings');
      editor.Modal.setContent(modalContent);
      editor.Modal.open();

      setTimeout(() => {
        // Populate available fields
        const availableFieldsDiv = document.getElementById('available-fields');
        let groupingHTML = availableFields.map(field => `
        <div class="field-item" data-key="${field.key}" style="padding: 8px; margin-bottom: 5px; border-bottom: 1px solid #eee; display: flex; align-items: center;">
            <input type="checkbox" class="field-checkbox" style="margin-right: 8px; width: 16px; height: 16px;" ${(selected.get('grouping-fields') || []).some(f => f.key === field.key) ? 'checked' : ''}>
            <span>${field.name}</span>
        </div>
      `).join('');

        if (!availableFields.length) {
          groupingHTML = '<p style="color: #999; text-align: center; font-size: 12px">No fields available</p>';
        }
        availableFieldsDiv.innerHTML = groupingHTML;

        // Populate available summary fields
        const availableSummaryFieldsDiv = document.getElementById('available-summary-fields');
        let summaryHTML = availableFields.map(field => `
        <div class="field-item" data-key="${field.key}" style="padding: 8px; margin-bottom: 5px; border-bottom: 1px solid #eee; display: flex; align-items: center;">
            <input type="checkbox" class="summary-checkbox" style="margin-right: 8px; width: 16px; height: 16px;" ${(selected.get('summary-fields') || []).some(f => f.key === field.key) ? 'checked' : ''}>
            <span>${field.name}</span>
        </div>
      `).join('');

        if (!availableFields.length) {
          summaryHTML = '<p style="color: #999; text-align: center; font-size:12px;">No fields available</p>';
        }
        availableSummaryFieldsDiv.innerHTML = summaryHTML;

        initializeCustomTableSettingsModal(selected, availableFields);
      }, 100);
    }
  });

  editor.DomComponents.addType('enhanced-table-cell', {
    isComponent: el => (el.tagName === 'TH') &&
      el.closest('table') &&
      el.closest('table').id &&
      el.closest('table').id.startsWith('table'),
    model: {
      defaults: {
        selectable: true,
        hoverable: true,
        editable: true,
        droppable: false,
        draggable: false,
        removable: false,
        copyable: false,
        resizable: false,
        traits: [
          {
            type: 'checkbox',
            name: 'running-total',
            label: 'Running Total',
            changeProp: 1,
          }
        ],
        'custom-name': 'Table Cell'
      },

      init() {
        this.on('change:running-total', this.handleRunningTotalChange);
      },

      handleRunningTotalChange() {
        const isEnabled = this.get('running-total');
        const cellElement = this.getEl();

        if (!cellElement) return;

        const table = cellElement.closest('table');
        if (!table) return;

        const tableId = table.id;

        if (isEnabled) {
          addRunningTotalColumn(tableId, cellElement);
        } else {
          removeRunningTotalColumn(tableId, cellElement);
        }
      }
    }
  });

  // Function to open table creation modal
  function addTable() {
    const targetContainer = getTargetContainer();

    if (!targetContainer) {
      showToast('No suitable container found for placing the table', 'error');
      return;
    }

    // Check if target is within a page system
    const isInPageSystem = targetContainer.closest('.page-container') ||
      targetContainer.find('.page-container').length > 0 ||
      targetContainer.getEl()?.closest('.page-container');

    let containerInfo = 'main canvas';
    if (isInPageSystem) {
      const pageContainer = targetContainer.closest('.page-container');
      if (pageContainer) {
        const pageIndex = pageContainer.getAttributes()['data-page-index'];
        // containerInfo = `Page ${parseInt(pageIndex) + 1}`;
      } else {
        containerInfo = 'page content area';
      }
    } else if (targetContainer.get('tagName')) {
      containerInfo = targetContainer.get('tagName') || 'selected container';
    }

    editor.Modal.setTitle('Create New Table');
    editor.Modal.setContent(`
  <div class="new-table-form">
    <div>
      <label>Header Rows</label>
      <input type="number" value="1" id="nHeaderRows" min="0">
    </div>
    <div>
      <label>Header Columns</label>
      <input type="number" value="0" id="nHeaderColumns" min="0">
    </div>
    <div>
      <label>Body Rows</label>
      <input type="number" value="4" id="nRows" min="1">
    </div>  
    <div>
      <label>Body Columns</label>
      <input type="number" value="3" id="nColumns" min="1">
    </div>  
    <div>
      <label>Scroll Columns length</label>
      <input type="number" value="5" id="nColumnsScroll" min="5">
    </div> 
    <div><label>Add File Download</label><input type="checkbox" id="tbl_file_download"></div>
    <div><label>Add Pagination</label><input type="checkbox" id="tbl_pagination"></div>
    <div><label>Add Search</label><input type="checkbox" id="tbl_Search"></div>
    <div><label>Add Footer</label><input type="checkbox" id="tbl_footer"></div>
    <div><label>Add Caption</label><input type="checkbox" id="tbl_caption"></div>
    <div><input id="table-button-create-new" type="button" value="Create Table"></div>
  </div>
`);
    editor.Modal.open();

    // Remove any existing event listeners and add a new one
    const createBtn = document.getElementById("table-button-create-new");
    createBtn.removeEventListener("click", () => createTable(targetContainer), true);
    createBtn.addEventListener("click", () => createTable(targetContainer), true);
  }

  function createTable(container) {
    let uniqueID = Math.floor(100 + Math.random() * 900);
    let tblFileDownload = document.getElementById("tbl_file_download").checked;
    let tblPagination = document.getElementById("tbl_pagination").checked;
    let tblSearch = document.getElementById("tbl_Search").checked;
    let tblFooter = document.getElementById("tbl_footer").checked;
    let tblCaption = document.getElementById("tbl_caption").checked;
    let downloadBtn = '[]';

    if (tblFileDownload) {
      downloadBtn = '["copy", "csv", "excel", "pdf", "print"]';
    }

    const headerRows = parseInt(document.getElementById('nHeaderRows').value) || 0;
    const headerCols = parseInt(document.getElementById('nHeaderColumns').value) || 0;
    const bodyCols = parseInt(document.getElementById('nColumns').value);
    const bodyRows = parseInt(document.getElementById('nRows').value);
    const totalCols = Math.max(headerCols + bodyCols, 1);
    const colsScroll = parseInt(document.getElementById('nColumnsScroll').value);

    const isInPageSystem = container.closest('.page-container') ||
      container.find('.page-container').length > 0 ||
      container.getEl()?.closest('.page-container');

    let tableWrapper = document.createElement('div');
    if (isInPageSystem) {
      tableWrapper.style.cssText = `
      padding: 10px 0px;
      position: relative;
      width: 100%;
      max-width: 100%;
      overflow: hidden;
      box-sizing: border-box;
    `;
    }
    tableWrapper.className = 'table-wrapper-' + uniqueID;

    let table = document.createElement('table');
    table.setAttribute('width', '100%');
    table.setAttribute('class', 'table table-striped table-bordered');
    table.setAttribute('id', 'table' + uniqueID);
    table.style.paddingBottom = '10px';
    table.style.display = 'inline';       // inline wrapper
table.style.position = 'absolute'; 

    if (tblCaption) {
      let caption = document.createElement('caption');
      caption.textContent = 'Caption Text';
      caption.style.captionSide = 'top';
      table.appendChild(caption);
    }

    // Build thead with header rows
    let thead = document.createElement('thead');
    for (let i = 0; i < headerRows; i++) {
      let tr = document.createElement('tr');
      for (let j = 0; j < totalCols; j++) {
        let th = document.createElement('th');
        th.innerHTML = `<div>Header</div>`;
        th.style.padding = '8px';
        th.style.border = '1px solid #000';
        th.style.backgroundColor = '#f5f5f5';
        th.style.fontWeight = 'bold';
        tr.appendChild(th);
      }
      thead.appendChild(tr);
    }
    if (headerRows > 0) table.appendChild(thead);

    // Build tbody
    let tbody = document.createElement('tbody');
    for (let i = 0; i < bodyRows; i++) {
      let tr = document.createElement('tr');

      // Header columns in body
      for (let j = 0; j < headerCols; j++) {
        let th = document.createElement('th');
        th.innerHTML = `<div>Header</div>`;
        th.style.padding = '8px';
        th.style.border = '1px solid #000';
        th.style.backgroundColor = '#f5f5f5';
        th.style.fontWeight = 'bold';
        tr.appendChild(th);
      }

      // Body columns
      for (let j = 0; j < bodyCols; j++) {
        let td = document.createElement('td');
        td.innerHTML = `<div>Text</div>`;
        td.style.padding = '8px';
        td.style.border = '1px solid #000';
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }

    if (tblFooter) {
      let tr = document.createElement('tr');
      for (let j = 0; j < totalCols; j++) {
        let th = document.createElement('th');
        th.style.fontWeight = '800';
        th.innerHTML = `<div>Text</div>`;
        th.style.padding = '8px';
        th.style.border = '1px solid #000';
        tr.appendChild(th);
      }
      tbody.appendChild(tr);
    }

    table.appendChild(tbody);

    // Append table to wrapper if in page system
    if (isInPageSystem) {
      tableWrapper.appendChild(table);
    }

    // ✅ FIXED DataTables script - inject enableFormulaEditing function into iframe
    let tableScript = `
  <script>
    (function() {
      window.enableFormulaEditing = function(tableId) {
        try {
          if (!window.formulaParser || !window.formulaParser.Parser) {
            console.warn('Formula parser not available');
            return;
          }
          
          let parser = window.globalFormulaParser;
          
          if (!parser) {
            parser = new window.formulaParser.Parser();
            window.globalFormulaParser = parser;
            
            // Register custom formulas
            parser.setFunction('PERCENT', function (params) {
              if (params.length !== 2) return '#N/A';
              const base = parseFloat(params[0]);
              const percent = parseFloat(params[1]);
              if (isNaN(base) || isNaN(percent)) return '#VALUE!';
              const result = base * (percent / 100);
              return Number.isInteger(result) ? result : parseFloat(result.toFixed(10));
            });

            if (window.numberToWords && window.numberToWords.toWords) {
              parser.setFunction('NUMTOWORDS', function (params) {
                if (params.length !== 1) return '#N/A';
                const num = parseFloat(params[0]);
                if (isNaN(num)) return '#VALUE!';
                
                try {
                  const integerPart = Math.floor(num);
                  const decimalPart = num - integerPart;
                  
                  if (decimalPart === 0) {
                    return window.numberToWords.toWords(integerPart);
                  } else {
                    const integerWords = window.numberToWords.toWords(integerPart);
                    const decimalString = decimalPart.toFixed(10).replace(/0+$/, '').substring(2);
                    return integerWords + ' point ' + decimalString.split('').map(d => window.numberToWords.toWords(parseInt(d))).join(' ');
                  }
                } catch (error) {
                  return '#ERROR';
                }
              });
            }
          }
            
            // Enhanced parser with range support
            parser.on('callCellValue', function (cellCoord, done) {
              let col = cellCoord.column.index;
              let row = cellCoord.row.index;
              let tableElem = document.getElementById(tableId);
              let cell = tableElem.rows[row]?.cells[col];
              if (cell) {
                let val = cell.getAttribute('data-formula') || cell.innerText;
                if (val.startsWith('=')) {
                  try {
                    let res = parser.parse(val.substring(1));
                    done(res.result);
                  } catch {
                    done('#ERROR');
                  }
                } else {
                  done(parseFloat(val) || val);
                }
              } else {
                done(null);
              }
            });

            // Enhanced parser for range support (A1:A5)
            parser.on('callRangeValue', function (startCellCoord, endCellCoord, done) {
              let tableElem = document.getElementById(tableId);
              let values = [];

              let startRow = Math.min(startCellCoord.row.index, endCellCoord.row.index);
              let endRow = Math.max(startCellCoord.row.index, endCellCoord.row.index);
              let startCol = Math.min(startCellCoord.column.index, endCellCoord.column.index);
              let endCol = Math.max(startCellCoord.column.index, endCellCoord.column.index);

              for (let row = startRow; row <= endRow; row++) {
                for (let col = startCol; col <= endCol; col++) {
                  let cell = tableElem.rows[row]?.cells[col];
                  if (cell) {
                    let val = cell.getAttribute('data-formula') || cell.innerText;
                    if (val.startsWith('=')) {
                      try {
                        let res = parser.parse(val.substring(1));
                        values.push(res.result);
                      } catch {
                        values.push(0);
                      }
                    } else {
                      values.push(parseFloat(val) || 0);
                    }
                  } else {
                    values.push(0);
                  }
                }
              }
              done(values);
            });
            
            // Attach cell listeners
            const tableElem = document.getElementById(tableId);
            if (!tableElem) return;

            tableElem.querySelectorAll('td, th').forEach(cell => {
              if (cell.hasAttribute('data-formula-enabled')) return;
              
              cell.contentEditable = "true";
              cell.setAttribute('data-formula-enabled', 'true');

              cell.addEventListener('focus', function() {
                let formula = this.getAttribute('data-formula');
                if (formula) this.innerText = formula;
              });

              cell.addEventListener('blur', function() {
                const cell = this;
                let val = cell.innerText.trim();

                if (val.startsWith('=')) {
                  cell.setAttribute('data-formula', val);
                  try {
                    const formulaContent = val.substring(1).trim();
                    if (!formulaContent) throw new Error('Empty formula');

                    const res = parser.parse(formulaContent);
                    if (res.error) throw new Error(res.error);

                    cell.innerText = (res.result !== undefined && res.result !== null) ? res.result : '#ERROR';
                    cell.classList.remove('formula-error');

                  } catch (error) {
                    console.warn('Formula parsing error:', error);
                    cell.innerText = '#ERROR';
                    cell.classList.add('formula-error');
                  }
                } else {
                  cell.removeAttribute('data-formula');
                  cell.innerText = val;
                  cell.classList.remove('formula-error');
                }
              });

              // Tab navigation
              cell.addEventListener('keydown', function(e) {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  const table = this.closest('table');
                  const allCells = Array.from(table.querySelectorAll('td, th'));
                  const currentIndex = allCells.indexOf(this);

                  let nextIndex;
                  if (e.shiftKey) {
                    nextIndex = currentIndex > 0 ? currentIndex - 1 : allCells.length - 1;
                  } else {
                    nextIndex = currentIndex < allCells.length - 1 ? currentIndex + 1 : 0;
                  }
                  allCells[nextIndex].focus();
                }
              });
            });
            
          } catch (error) {
            console.error('Error in enableFormulaEditing:', error);
          }
        };
        
        // Wait for jQuery and DataTables to be available
        function initTable() {
          if (typeof $ === 'undefined' || typeof $.fn.DataTable === 'undefined') {
            setTimeout(initTable, 100);
            return;
          }
          
          const tableElement = document.getElementById('table${uniqueID}');
          const isInPageSystem = tableElement && tableElement.closest('.page-container');
          
          // Configure DataTable options based on context
          const dtOptions = {
            dom: 'Bfrtip',
            paging: ${tblPagination},
            info: ${tblPagination},
            lengthChange: true,
            fixedHeader: ${!isInPageSystem},
            scrollX: ${colsScroll < totalCols},
            fixedColumns: ${colsScroll < totalCols},
            searching: ${tblSearch},
            buttons: ${downloadBtn},
            ordering: false,
            order: [], 
            drawCallback: function() {
              // ✅ Now enableFormulaEditing is available in iframe context
              setTimeout(() => enableFormulaEditing('table${uniqueID}'), 100);
              
              if (isInPageSystem) {
                const wrapper = this.closest('.dataTables_wrapper');
                if (wrapper) {
                  wrapper.style.maxWidth = '100%';
                  wrapper.style.overflow = 'hidden';
                }
              }
            },
            responsive: isInPageSystem ? {
              details: {
                display: $.fn.dataTable.Responsive.display.childRowImmediate,
                type: 'none',
                target: ''
              }
            } : false
          };
          
          $('#table${uniqueID}').DataTable(dtOptions);
        }
        
        initTable();
      })();
    </script>
  `;

    // Rest of the function remains the same...
    try {
      // Add the table to the selected container
      let tableComponent;
      if (isInPageSystem) {
        tableComponent = container.append(tableWrapper.outerHTML)[0];
      } else {
        tableComponent = container.append(`<div>${table.outerHTML}</div>${tableScript}`)[0];
      }

      // Set table wrapper properties for better integration
      if (tableComponent && isInPageSystem) {
        tableComponent.set({
          draggable: false,
          droppable: false,
          editable: false,
          selectable: false,
          removable: false,
          copyable: false,
          'custom-name': `Table Wrapper ${uniqueID}`,
          tagName: 'div'
        });
      }

      // Add the script component for page system
      if (isInPageSystem) {
        const scriptComponent = container.append(tableScript)[0];
      }

      // Add the actual table component with enhanced-table type for traits
      const actualTable = tableComponent.find('table')[0];
      if (actualTable) {
        actualTable.set({
          type: 'enhanced-table',
          'custom-name': `Enhanced Table ${uniqueID}`,
          tagName: 'table',
          selectable: true,
          hoverable: true,
          editable: true,
          removable: true,
          draggable: true,
          attributes: {
            id: `table${uniqueID}`,
            class: 'table table-striped table-bordered',
            width: '100%'
          }
        });
      }

      editor.Modal.close();

      // ✅ Enable formulas with delay to ensure custom formulas are registered
      setTimeout(() => {
        const iframe = editor.getContainer().querySelector('iframe');
        if (iframe && iframe.contentWindow && iframe.contentWindow.enableFormulaEditing) {
          iframe.contentWindow.enableFormulaEditing(`table${uniqueID}`);
        }
      }, 1000); // Increased delay to ensure custom formulas are registered

      let containerType = 'container';
      const pageContainer = container.closest('.page-container');
      if (pageContainer) {
        const pageIndex = pageContainer.getAttributes()['data-page-index'];
      } else if (container.getEl()?.classList.contains('main-content-area')) {
        containerType = 'content area';
      } else if (container.get('tagName')) {
        containerType = container.get('tagName');
      }

      showToast(`Enhanced table with highlighting created successfully in ${containerType}!`, 'success');

    } catch (error) {
      console.error('Error creating table:', error);
      showToast('Error creating table. Please try again.', 'error');
    }
  }

  function updateDataTableStructure(tableId) {
    try {
      const canvasDoc = editor.Canvas.getDocument();
      const win = canvasDoc.defaultView;

      if (win.$ && win.$.fn.DataTable) {
        const tableElement = canvasDoc.getElementById(tableId);
        if (tableElement && win.$.fn.DataTable.isDataTable(tableElement)) {
          // Just trigger a simple redraw without destroying
          const dt = win.$(tableElement).DataTable();
          dt.columns.adjust().draw(false); // false = no page reset
        }
      }
    } catch (error) {
      console.warn('Error updating DataTable structure:', error);
    }
  }

  function addRunningTotalColumn(tableId, sourceCell) {
    try {
      const canvasBody = editor.Canvas.getBody();
      const table = canvasBody.querySelector(`#${tableId}`);
      if (!table) {
        showToast('Table not found', 'error');
        return;
      }

      // Get the GrapesJS table component
      const tableComponent = editor.getWrapper().find('table')[0];

      if (!tableComponent) {
        showToast('Table component not found', 'error');
        return;
      }

      // Get column index of the source cell
      const sourceRow = sourceCell.parentNode;
      const sourceCellIndex = Array.from(sourceRow.children).indexOf(sourceCell);

      // Check if source cell is in header
      const isHeaderCell = sourceCell.tagName === 'TH' || sourceCell.closest('thead');
      if (!isHeaderCell) {
        showToast('Running total can only be applied to header cells', 'error');
        return;
      }

      // Check if running total column already exists
      const runningTotalColumnIndex = sourceCellIndex + 1;
      const headerRow = table.querySelector('thead tr');
      if (headerRow && headerRow.children[runningTotalColumnIndex] &&
        headerRow.children[runningTotalColumnIndex].getAttribute('data-running-total-for') === sourceCellIndex.toString()) {
        showToast('Running total column already exists for this column', 'warning');
        return;
      }

      // Validate that the source column contains numeric data
      const bodyRows = table.querySelectorAll('tbody tr');
      let hasValidNumericData = false;

      for (let row of bodyRows) {
        if (row.children[sourceCellIndex]) {
          const cell = row.children[sourceCellIndex];
          const cellValue = getCellValue(cell);
          const numericValue = parseFloat(cellValue);

          if (!isNaN(numericValue) && isFinite(numericValue)) {
            hasValidNumericData = true;
            break;
          }
        }
      }

      if (!hasValidNumericData) {
        showToast('Running total not possible: column contains non-numeric data', 'error');

        // Uncheck the trait
        const cellComponent = editor.DomComponents.getComponentFromElement(sourceCell);
        if (cellComponent) {
          cellComponent.set('running-total', false);
        }
        return;
      }

      // === ADD TO ACTUAL COMPONENT HTML STRUCTURE ===

      // 1. Add header cell to GrapesJS component structure - NO STYLING
      const theadComponent = tableComponent.find('thead')[0];
      if (theadComponent) {
        const headerRowComponent = theadComponent.find('tr')[0];
        if (headerRowComponent) {
          const headerCells = headerRowComponent.components();

          // Create new header cell component WITHOUT any styling
          const newHeaderCellComponent = headerRowComponent.append({
            tagName: 'th',
            content: '<div>Running Total</div>',
            attributes: {
              'data-running-total-for': sourceCellIndex.toString(),
              'data-running-total-header': 'true'
            }
            // REMOVED: style object - no automatic styling
          });

          // Move to correct position if needed
          if (runningTotalColumnIndex < headerCells.length) {
            const targetIndex = runningTotalColumnIndex;
            headerRowComponent.components().remove(newHeaderCellComponent[0]);
            headerRowComponent.components().add(newHeaderCellComponent[0], { at: targetIndex });
          }
        }
      }

      // 2. Add data cells to GrapesJS component structure - NO STYLING
      const tbodyComponent = tableComponent.find('tbody')[0];
      if (tbodyComponent) {
        const bodyRowComponents = tbodyComponent.find('tr');
        let runningSum = 0;

        bodyRowComponents.forEach((rowComponent, rowIndex) => {
          const row = bodyRows[rowIndex];
          if (row) {
            const sourceDataCell = row.children[sourceCellIndex];
            if (sourceDataCell) {
              const cellValue = getCellValue(sourceDataCell);
              const numericValue = parseFloat(cellValue);

              if (!isNaN(numericValue) && isFinite(numericValue)) {
                runningSum += numericValue;
              }

              // Create new data cell component WITHOUT any styling
              const newDataCellComponent = rowComponent.append({
                tagName: 'td',
                content: `<div>${runningSum.toFixed(2)}</div>`,
                attributes: {
                  'data-running-total-for': sourceCellIndex.toString(),
                  'data-running-total-value': runningSum.toString(),
                  'data-running-total-cell': 'true'
                }
                // REMOVED: style object - no automatic styling
              });

              // Move to correct position if needed
              const rowCells = rowComponent.components();
              if (runningTotalColumnIndex < rowCells.length - 1) {
                const targetIndex = runningTotalColumnIndex;
                rowComponent.components().remove(newDataCellComponent[0]);
                rowComponent.components().add(newDataCellComponent[0], { at: targetIndex });
              }
            }
          }
        });
      }

      // === ALSO UPDATE THE DOM FOR IMMEDIATE VISUAL FEEDBACK - NO STYLING ===

      // Add header cell for running total in DOM
      if (headerRow) {
        const existingRunningHeader = headerRow.querySelector(`[data-running-total-for="${sourceCellIndex}"]`);
        if (!existingRunningHeader) {
          const newHeaderCell = document.createElement('th');
          newHeaderCell.innerHTML = '<div>Running Total</div>';
          newHeaderCell.setAttribute('data-running-total-for', sourceCellIndex.toString());
          newHeaderCell.setAttribute('data-running-total-header', 'true');
          // REMOVED: style.cssText - no automatic styling

          // Insert after source column
          if (headerRow.children[runningTotalColumnIndex]) {
            headerRow.insertBefore(newHeaderCell, headerRow.children[runningTotalColumnIndex]);
          } else {
            headerRow.appendChild(newHeaderCell);
          }
        }
      }

      // Add running total cells to body rows in DOM - NO STYLING
      let runningSum = 0;
      bodyRows.forEach((row, rowIndex) => {
        const sourceDataCell = row.children[sourceCellIndex];
        if (sourceDataCell) {
          const cellValue = getCellValue(sourceDataCell);
          const numericValue = parseFloat(cellValue);

          if (!isNaN(numericValue) && isFinite(numericValue)) {
            runningSum += numericValue;
          }

          const existingRunningCell = row.querySelector(`[data-running-total-for="${sourceCellIndex}"]`);
          if (!existingRunningCell) {
            const newDataCell = document.createElement('td');
            newDataCell.innerHTML = `<div>${runningSum.toFixed(2)}</div>`;
            newDataCell.setAttribute('data-running-total-for', sourceCellIndex.toString());
            newDataCell.setAttribute('data-running-total-value', runningSum.toString());
            newDataCell.setAttribute('data-running-total-cell', 'true');
            // REMOVED: style.cssText - no automatic styling

            // Insert after source column
            if (row.children[runningTotalColumnIndex]) {
              row.insertBefore(newDataCell, row.children[runningTotalColumnIndex]);
            } else {
              row.appendChild(newDataCell);
            }
          }
        }
      });
      // Apply equal width to all columns
      const totalColumns = headerRow.children.length;
      const columnWidth = `${100 / totalColumns}%`;

      // Set width for all header cells
      Array.from(headerRow.children).forEach(th => {
        th.style.width = columnWidth;
      });

      // Set width for all data cells in body rows
      bodyRows.forEach(row => {
        Array.from(row.children).forEach(td => {
          td.style.width = columnWidth;
        });
      });

      // Ensure table layout is fixed
      // Update DataTable if it exists
      // Update DataTable without destroying it
      try {
        const canvasDoc = editor.Canvas.getDocument();
        const win = canvasDoc.defaultView;

        if (win.$ && win.$.fn.DataTable) {
          const tableElement = canvasDoc.getElementById(tableId);
          if (tableElement && win.$.fn.DataTable.isDataTable(tableElement)) {
            const dt = win.$(tableElement).DataTable();
            // Just adjust columns without redraw to preserve layout
            dt.columns.adjust();
          }
        }
      } catch (error) {
        console.warn('Error adjusting DataTable columns:', error);
      }

      // Force GrapesJS to recognize the changes
      editor.trigger('component:update', tableComponent);
      editor.trigger('change:canvasOffset');

      showToast('Running total column added successfully', 'success');

    } catch (error) {
      console.error('Error adding running total column:', error);
      showToast('Error adding running total column', 'error');
    }
  }


  function removeRunningTotalColumn(tableId, sourceCell) {
    try {
      const canvasBody = editor.Canvas.getBody();
      const table = canvasBody.querySelector(`#${tableId}`);
      if (!table) return;

      // Get the GrapesJS table component
      const tableComponent = editor.getWrapper().find('table')[0];
      if (!tableComponent) return;

      const sourceRow = sourceCell.parentNode;
      const sourceCellIndex = Array.from(sourceRow.children).indexOf(sourceCell);

      // === REMOVE FROM GRAPESJS COMPONENT STRUCTURE ===

      // Remove from header
      const theadComponent = tableComponent.find('thead')[0];
      if (theadComponent) {
        const headerRowComponent = theadComponent.find('tr')[0];
        if (headerRowComponent) {
          const headerCells = headerRowComponent.components().models;
          const runningTotalHeaderIndex = headerCells.findIndex(cell => {
            const attrs = cell.getAttributes();
            return attrs['data-running-total-for'] === sourceCellIndex.toString();
          });

          if (runningTotalHeaderIndex !== -1) {
            headerRowComponent.components().remove(headerCells[runningTotalHeaderIndex]);
          }
        }
      }

      // Remove from body rows
      const tbodyComponent = tableComponent.find('tbody')[0];
      if (tbodyComponent) {
        const bodyRowComponents = tbodyComponent.find('tr');

        bodyRowComponents.forEach(rowComponent => {
          const cells = rowComponent.components().models;
          const runningTotalCellIndex = cells.findIndex(cell => {
            const attrs = cell.getAttributes();
            return attrs['data-running-total-for'] === sourceCellIndex.toString();
          });

          if (runningTotalCellIndex !== -1) {
            rowComponent.components().remove(cells[runningTotalCellIndex]);
          }
        });
      }

      // === ALSO REMOVE FROM DOM ===

      // Remove running total columns from DOM
      const allRows = table.querySelectorAll('tr');
      allRows.forEach(row => {
        const runningTotalCells = row.querySelectorAll(`[data-running-total-for="${sourceCellIndex}"]`);
        runningTotalCells.forEach(cell => cell.remove());
      });
      // Apply equal width to all columns
      const totalColumns = headerRow.children.length;
      const columnWidth = `${100 / totalColumns}%`;

      // Set width for all header cells
      Array.from(headerRow.children).forEach(th => {
        th.style.width = columnWidth;
      });

      // Set width for all data cells in body rows
      bodyRows.forEach(row => {
        Array.from(row.children).forEach(td => {
          td.style.width = columnWidth;
        });
      });

      // Ensure table layout is fixed
      // Update DataTable if it exists
      // Update DataTable without destroying it
      try {
        const canvasDoc = editor.Canvas.getDocument();
        const win = canvasDoc.defaultView;

        if (win.$ && win.$.fn.DataTable) {
          const tableElement = canvasDoc.getElementById(tableId);
          if (tableElement && win.$.fn.DataTable.isDataTable(tableElement)) {
            const dt = win.$(tableElement).DataTable();
            dt.columns.adjust();
          }
        }
      } catch (error) {
        console.warn('Error adjusting DataTable columns:', error);
      }

      // Force GrapesJS to recognize the changes
      // Force GrapesJS to recognize the changes
      editor.trigger('component:update', tableComponent);
      editor.trigger('change:canvasOffset');

      showToast('Running total column removed', 'success');

    } catch (error) {
      console.error('Error removing running total column:', error);
      showToast('Error removing running total column', 'error');
    }
  }
  // Enhanced Formula editing handler with range support and suggestions
  function enableFormulaEditing(tableId) {
    const iframeDoc = editor.Canvas.getDocument();
    const iframeWindow = iframeDoc.defaultView;

    if (!iframeWindow.formulaParser || !iframeWindow.formulaParser.Parser) {
      console.warn('Formula parser not available');
      return;
    }

    // ✅ Use global parser if available, otherwise create new one
    let parser = iframeWindow.globalFormulaParser;

    if (!parser) {
      parser = new iframeWindow.formulaParser.Parser();
      iframeWindow.globalFormulaParser = parser;

      // ✅ Register custom formulas
      parser.setFunction('PERCENT', function (params) {
        if (params.length !== 2) return '#N/A';
        const base = parseFloat(params[0]);
        const percent = parseFloat(params[1]);
        if (isNaN(base) || isNaN(percent)) return '#VALUE!';
        const result = base * (percent / 100);
        // ✅ Maintain decimal precision
        return Number.isInteger(result) ? result : parseFloat(result.toFixed(10));
      });

      parser.setFunction('ABSOLUTE', function (params) {
        if (params.length !== 1) return '#N/A';
        const num = parseFloat(params[0]);
        if (isNaN(num)) return '#VALUE!';
        const result = Math.abs(num);
        // ✅ Maintain decimal precision
        return Number.isInteger(result) ? result : parseFloat(result.toFixed(10));
      });

      // ✅ Register NUMTOWORDS if available
      if (iframeWindow.numberToWords && iframeWindow.numberToWords.toWords) {
        parser.setFunction('NUMTOWORDS', function (params) {
          if (params.length !== 1) return '#N/A';
          const num = parseFloat(params[0]); // ✅ Changed from parseInt to parseFloat
          if (isNaN(num)) return '#VALUE!';

          try {
            // ✅ Handle decimal numbers - convert to integer for word conversion
            const integerPart = Math.floor(num);
            const decimalPart = num - integerPart;

            if (decimalPart === 0) {
              return iframeWindow.numberToWords.toWords(integerPart);
            } else {
              // For decimals, show integer part in words + decimal notation
              const integerWords = iframeWindow.numberToWords.toWords(integerPart);
              const decimalString = decimalPart.toFixed(10).replace(/0+$/, '').substring(2);
              return `${integerWords} point ${decimalString.split('').map(d => iframeWindow.numberToWords.toWords(parseInt(d))).join(' ')}`;
            }
          } catch (error) {
            return '#ERROR';
          }
        });
      }
    }

    // Enhanced parser with range support
    parser.on('callCellValue', function (cellCoord, done) {
      let col = cellCoord.column.index;
      let row = cellCoord.row.index;
      let tableElem = iframeDoc.getElementById(tableId);
      let cell = tableElem.rows[row]?.cells[col];
      if (cell) {
        let val = cell.getAttribute('data-formula') || cell.innerText;
        if (val.startsWith('=')) {
          try {
            let res = parser.parse(val.substring(1));
            done(res.result);
          } catch {
            done('#ERROR');
          }
        } else {
          const numVal = parseFloat(val);
          done(isNaN(numVal) ? val : numVal);
        }
      } else {
        done(null);
      }
    });

    parser.on('callRangeValue', function (startCellCoord, endCellCoord, done) {
      let tableElem = iframeDoc.getElementById(tableId);
      let values = [];

      let startRow = Math.min(startCellCoord.row.index, endCellCoord.row.index);
      let endRow = Math.max(startCellCoord.row.index, endCellCoord.row.index);
      let startCol = Math.min(startCellCoord.column.index, endCellCoord.column.index);
      let endCol = Math.max(startCellCoord.column.index, endCellCoord.column.index);

      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
          let cell = tableElem.rows[row]?.cells[col];
          if (cell) {
            let val = cell.getAttribute('data-formula') || cell.innerText;
            if (val.startsWith('=')) {
              try {
                let res = parser.parse(val.substring(1));
                values.push(res.result);
              } catch {
                values.push(0);
              }
            } else {
              values.push(parseFloat(val) || 0);
            }
          } else {
            values.push(0);
          }
        }
      }

      done(values);
    });

    // Attach cell listeners
    const tableElem = iframeDoc.getElementById(tableId);
    if (!tableElem) return;

    tableElem.querySelectorAll('td, th').forEach(cell => {
      if (cell.hasAttribute('data-formula-enabled')) return;

      cell.contentEditable = "true";
      cell.setAttribute('data-formula-enabled', 'true');

      cell.addEventListener('focus', function () {
        let formula = this.getAttribute('data-formula');
        if (formula) this.innerText = formula;
      });

      cell.addEventListener('blur', function () {
        const cell = this;
        let val = cell.innerText.trim();

        if (val.startsWith('=')) {
          cell.setAttribute('data-formula', val);
          try {
            const formulaContent = val.substring(1).trim();
            if (!formulaContent) throw new Error('Empty formula');

            const res = parser.parse(formulaContent);
            if (res.error) throw new Error(res.error);

            // ✅ Format result based on type
            let result = res.result;
            if (typeof result === 'number') {
              result = Number.isInteger(result) ? result : parseFloat(result.toFixed(10));
            }

            cell.innerText = (result !== undefined && result !== null) ? result : '#ERROR';
            cell.classList.remove('formula-error');

          } catch (error) {
            console.warn('Formula parsing error:', error);
            cell.innerText = '#ERROR';
            cell.classList.add('formula-error');
          }
        } else {
          cell.removeAttribute('data-formula');
          cell.innerText = val;
          cell.classList.remove('formula-error');
        }
      });

      cell.addEventListener('keydown', function (e) {
        if (e.key === 'Tab') {
          e.preventDefault();
          const table = this.closest('table');
          const allCells = Array.from(table.querySelectorAll('td, th'));
          const currentIndex = allCells.indexOf(this);

          let nextIndex;
          if (e.shiftKey) {
            nextIndex = currentIndex > 0 ? currentIndex - 1 : allCells.length - 1;
          } else {
            nextIndex = currentIndex < allCells.length - 1 ? currentIndex + 1 : 0;
          }
          allCells[nextIndex].focus();
        }
      });
    });
  }
  function initializeCustomTableStyleManager(component) {
    const borderStyle = document.getElementById('border-style');
    const borderWidth = document.getElementById('border-width');
    const borderColor = document.getElementById('border-color');
    const borderOpacity = document.getElementById('border-opacity');
    const bgColor = document.getElementById('bg-color');
    const textColor = document.getElementById('text-color');
    const fontFamily = document.getElementById('font-family');
    const textAlign = document.getElementById('text-align');
    const verticalAlign = document.getElementById('vertical-align');

    // Load current values
    if (borderStyle) borderStyle.value = component.get('table-border-style') || 'solid';
    if (borderWidth) borderWidth.value = component.get('table-border-width') || '1';
    if (borderColor) borderColor.value = component.get('table-border-color') || '#000000';
    if (borderOpacity) borderOpacity.value = component.get('table-border-opacity') || '100';
    if (bgColor) bgColor.value = component.get('table-bg-color') || '#ffffff';
    if (textColor) textColor.value = component.get('table-text-color') || '#000000';
    if (fontFamily) fontFamily.value = component.get('table-font-family') || 'Arial, sans-serif';
    if (textAlign) textAlign.value = component.get('table-text-align') || 'left';
    if (verticalAlign) verticalAlign.value = component.get('table-vertical-align') || 'middle';

    // Opacity slider
    const opacitySlider = document.getElementById('border-opacity');
    const opacityValue = document.getElementById('opacity-value');
    opacitySlider.addEventListener('input', function () {
      opacityValue.textContent = this.value + '%';
    });

    // Apply button
    document.getElementById('apply-styles').addEventListener('click', function () {
      component.set('table-border-style', borderStyle.value);
      component.set('table-border-width', borderWidth.value);
      component.set('table-border-color', borderColor.value);
      component.set('table-border-opacity', borderOpacity.value);
      component.set('table-bg-color', bgColor.value);
      component.set('table-text-color', textColor.value);
      component.set('table-font-family', fontFamily.value);
      component.set('table-text-align', textAlign.value);
      component.set('table-vertical-align', verticalAlign.value);

      component.applyTableStyles();
      editor.Modal.close();
      showToast('Table styles applied successfully!', 'success');
    });

    // Reset button
    document.getElementById('reset-styles').addEventListener('click', function () {
      borderStyle.value = 'solid';
      borderWidth.value = '1';
      borderColor.value = '#000000';
      borderOpacity.value = '100';
      bgColor.value = '#ffffff';
      textColor.value = '#000000';
      fontFamily.value = 'Arial, sans-serif';
      textAlign.value = 'left';
      verticalAlign.value = 'middle';
      opacityValue.textContent = '100%';
    });

    // Cancel button
    document.getElementById('cancel-styles').addEventListener('click', function () {
      editor.Modal.close();
    });
  }

  // Add hexToRgb helper if not already present
  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  function initializeCustomTableSettingsModal(component, availableFields) {
    let selectedGroupingFields = component.get('grouping-fields') || [];
    let selectedSummaryFields = component.get('summary-fields') || [];

    // Tab navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.nav-tab').forEach(t => {
          t.classList.remove('active');
          t.style.background = 'transparent';
          t.style.borderBottom = 'none';
          t.style.fontWeight = 'normal';
        });

        document.querySelectorAll('.tab-pane').forEach(p => {
          p.style.display = 'none';
        });

        this.classList.add('active');
        this.style.background = 'white';
        this.style.borderBottom = '3px solid #007bff';
        this.style.fontWeight = 'bold';

        const tabId = this.getAttribute('data-tab') + '-tab';
        const tabPane = document.getElementById(tabId);
        if (tabPane) {
          tabPane.style.display = 'block';
        }
      });
    });

    // Initialize column reorder
    initializeCustomTableColumnReorder(component);

    // Load saved options
    const sortOrder = document.getElementById('sort-order');
    const topN = document.getElementById('top-n');
    const topNValue = document.getElementById('top-n-value');
    const summarizeGroup = document.getElementById('summarize-group');
    const pageBreak = document.getElementById('page-break');
    const mergeGroupCells = document.getElementById('merge-group-cells');
    const groupHeaderInplace = document.getElementById('group-header-inplace');
    const hideSubtotalSingleRow = document.getElementById('hide-subtotal-single-row');
    const keepGroupHierarchy = document.getElementById('keep-group-hierarchy');
    const grandTotal = document.getElementById('grand-total');
    const grandTotalLabel = document.getElementById('grand-total-label');
    const summaryLabel = document.getElementById('summary-label');

    if (sortOrder) sortOrder.value = component.get('sort-order') || 'ascending';
    if (topN) topN.value = component.get('top-n') || 'none';
    if (topNValue) topNValue.value = component.get('top-n-value') || '10';
    if (summarizeGroup) summarizeGroup.checked = component.get('summarize-group') === true;
    if (pageBreak) pageBreak.checked = component.get('page-break') === true;
    if (mergeGroupCells) mergeGroupCells.checked = component.get('merge-group-cells') === true;
    if (groupHeaderInplace) groupHeaderInplace.checked = component.get('group-header-inplace') !== false;
    if (hideSubtotalSingleRow) hideSubtotalSingleRow.checked = component.get('hide-subtotal-single-row') === true;
    if (keepGroupHierarchy) keepGroupHierarchy.checked = component.get('keep-group-hierarchy') === true;
    if (grandTotal) grandTotal.checked = component.get('grand-total') !== false;
    if (grandTotalLabel) grandTotalLabel.value = component.get('grand-total-label') || '';
    if (summaryLabel) summaryLabel.value = component.get('summary-label') || '';

    // Load grouping type
    if (component.get('show-summary-only') === true) {
      const summaryRadio = document.querySelector('input[name="grouping-type"][value="summary"]');
      if (summaryRadio) {
        summaryRadio.checked = true;
        if (keepGroupHierarchy) keepGroupHierarchy.disabled = false;
      }
    }

    // Top N enable/disable
    document.getElementById('top-n').addEventListener('change', function () {
      const topNValue = document.getElementById('top-n-value');
      const isEnabled = this.value === 'top' || this.value === 'bottom';

      topNValue.disabled = !isEnabled;
      topNValue.style.background = isEnabled ? 'white' : '#f0f0f0';
      topNValue.style.cursor = isEnabled ? 'text' : 'not-allowed';
      topNValue.style.opacity = isEnabled ? '1' : '0.6';
    });

    // Trigger on load
    setTimeout(() => {
      const topNSelect = document.getElementById('top-n');
      const topNValue = document.getElementById('top-n-value');
      const currentValue = topNSelect.value;
      const isEnabled = currentValue === 'top' || currentValue === 'bottom';

      topNValue.disabled = !isEnabled;
      topNValue.style.background = isEnabled ? 'white' : '#f0f0f0';
      topNValue.style.cursor = isEnabled ? 'text' : 'not-allowed';
      topNValue.style.opacity = isEnabled ? '1' : '0.6';
    }, 100);

    // Grand Total checkbox
    document.getElementById('grand-total').addEventListener('change', function () {
      const grandTotalLabel = document.getElementById('grand-total-label');
      const isEnabled = this.checked;
      grandTotalLabel.disabled = !isEnabled;
      grandTotalLabel.style.background = isEnabled ? 'white' : '#f0f0f0';
    });

    // Grouping field selection
    document.querySelectorAll('#available-fields .field-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', function () {
        const fieldItem = this.closest('.field-item');
        const fieldKey = fieldItem.getAttribute('data-key');
        const fieldName = fieldItem.querySelector('span').textContent;

        if (this.checked) {
          selectedGroupingFields.push({ key: fieldKey, name: fieldName });
          updateSelectedFields();
        }
      });
    });

    function updateSelectedFields() {
      const selectedFieldsDiv = document.getElementById('selected-fields');
      if (!selectedFieldsDiv) return;

      if (selectedGroupingFields.length === 0) {
        selectedFieldsDiv.innerHTML = '<p style="color: #999; text-align: center; font-size: 12px;">No fields selected</p>';
      } else {
        selectedFieldsDiv.innerHTML = selectedGroupingFields
          .map((field, idx) => `
        <div class="field-item selected" data-key="${field.key}" data-index="${idx}" style="padding: 5px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
            <span>${field.name}</span>
            <button class="remove-grouping-field" style="background: #dc3545; color: white; padding: 2px 6px; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">×</button>
        </div>`).join('');

        selectedFieldsDiv.querySelectorAll('.remove-grouping-field').forEach(btn => {
          btn.addEventListener('click', function () {
            const idx = parseInt(this.closest('.field-item').getAttribute('data-index'));
            const fieldKey = selectedGroupingFields[idx].key;

            selectedGroupingFields.splice(idx, 1);
            updateSelectedFields();

            const availableCheckbox = document.querySelector(`#available-fields .field-item[data-key="${fieldKey}"] .field-checkbox`);
            if (availableCheckbox) availableCheckbox.checked = false;
          });
        });
      }
    }

    function updateSummaryFieldsList() {
      const selectedSummaryFieldsDiv = document.getElementById('selected-summary-fields');
      if (!selectedSummaryFieldsDiv) return;

      if (selectedSummaryFields.length === 0) {
        selectedSummaryFieldsDiv.innerHTML =
          '<p style="color: #999; text-align: center; font-size: 12px; margin: 10px 0;">No summaries configured</p>';
        return;
      }

      selectedSummaryFieldsDiv.innerHTML = selectedSummaryFields
        .map((field, idx) => `
      <div class="summary-field-item" data-index="${idx}" style="padding: 8px; margin-bottom: 5px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
          <div style="flex: 1;">
              <strong style="font-size: 13px;">${field.name}</strong>
              <div style="font-size: 11px; color: #666; margin-top: 2px;">Function: ${field.function}</div>
          </div>
          <button class="remove-summary-field" data-index="${idx}" style="background: #dc3545; color: white; padding: 4px 8px; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">×</button>
      </div>`).join('');

      selectedSummaryFieldsDiv.querySelectorAll('.remove-summary-field').forEach(btn => {
        btn.addEventListener('click', function () {
          const idx = parseInt(this.getAttribute('data-index'));
          selectedSummaryFields.splice(idx, 1);
          updateSummaryFieldsList();
        });
      });
    }

    // Summary field add button
    document.getElementById('add-summary-field').addEventListener('click', function () {
      const summaryCheckboxes = document.querySelectorAll('#available-summary-fields .summary-checkbox:checked');
      const summaryFunction = document.getElementById('summary-function').value;

      if (summaryCheckboxes.length === 0) {
        showToast('Please select at least one field for summary', 'warning');
        return;
      }

      let addedCount = 0;
      summaryCheckboxes.forEach(checkbox => {
        const fieldItem = checkbox.closest('.field-item');
        const fieldKey = fieldItem.getAttribute('data-key');
        const fieldName = fieldItem.querySelector('span').textContent;

        const exists = selectedSummaryFields.some(f => f.key === fieldKey && f.function === summaryFunction);
        if (!exists) {
          selectedSummaryFields.push({
            key: fieldKey,
            name: fieldName,
            function: summaryFunction
          });
          addedCount++;
        }

        checkbox.checked = false;
      });

      updateSummaryFieldsList();

      if (addedCount > 0) console.log(`Added ${addedCount} summary field(s)`);
    });

    // Sorting summary fields
    document.getElementById('sort-summary-asc').addEventListener('click', () => {
      const items = Array.from(document.querySelectorAll('#available-summary-fields .field-item'));
      items.sort((a, b) => a.textContent.localeCompare(b.textContent));
      const container = document.getElementById('available-summary-fields');
      container.innerHTML = '';
      items.forEach(item => container.appendChild(item));
    });

    document.getElementById('sort-summary-desc').addEventListener('click', () => {
      const items = Array.from(document.querySelectorAll('#available-summary-fields .field-item'));
      items.sort((a, b) => b.textContent.localeCompare(a.textContent));
      const container = document.getElementById('available-summary-fields');
      container.innerHTML = '';
      items.forEach(item => container.appendChild(item));
    });

    // Sorting grouping fields
    document.getElementById('sort-asc').addEventListener('click', () => {
      const items = Array.from(document.querySelectorAll('#available-fields .field-item'));
      items.sort((a, b) => a.textContent.localeCompare(b.textContent));
      const container = document.getElementById('available-fields');
      container.innerHTML = '';
      items.forEach(item => container.appendChild(item));
    });

    document.getElementById('sort-desc').addEventListener('click', () => {
      const items = Array.from(document.querySelectorAll('#available-fields .field-item'));
      items.sort((a, b) => b.textContent.localeCompare(a.textContent));
      const container = document.getElementById('available-fields');
      container.innerHTML = '';
      items.forEach(item => container.appendChild(item));
    });

    // Grouping type radio
    document.querySelectorAll('input[name="grouping-type"]').forEach(radio => {
      radio.addEventListener('change', function () {
        const keepHierarchy = document.getElementById('keep-group-hierarchy');
        const isSummaryOnly = this.value === 'summary';

        keepHierarchy.disabled = !isSummaryOnly;
        keepHierarchy.parentElement.querySelector('span').style.color =
          isSummaryOnly ? '#000' : '#999';

        if (!isSummaryOnly) keepHierarchy.checked = false;
      });
    });

    // ************************************************************
    // ✅ NEW FIX — Replace Row/Column Listeners by Cloning Buttons
    // ************************************************************
    const addRowsBtn = document.getElementById('add-rows');
    const removeRowsBtn = document.getElementById('remove-rows');
    const addColumnsBtn = document.getElementById('add-columns');
    const removeColumnsBtn = document.getElementById('remove-columns');

    // Clone buttons to remove previous listeners
    const newAddRowsBtn = addRowsBtn.cloneNode(true);
    const newRemoveRowsBtn = removeRowsBtn.cloneNode(true);
    const newAddColumnsBtn = addColumnsBtn.cloneNode(true);
    const newRemoveColumnsBtn = removeColumnsBtn.cloneNode(true);

    addRowsBtn.parentNode.replaceChild(newAddRowsBtn, addRowsBtn);
    removeRowsBtn.parentNode.replaceChild(newRemoveRowsBtn, removeRowsBtn);
    addColumnsBtn.parentNode.replaceChild(newAddColumnsBtn, addColumnsBtn);
    removeColumnsBtn.parentNode.replaceChild(newRemoveColumnsBtn, removeColumnsBtn);

    newAddRowsBtn.addEventListener('click', function () {
      const count = parseInt(document.getElementById('row-count').value) || 1;
      addTableRows(component, count);
      showToast(`Added ${count} row(s)`, 'success');
    });

    newRemoveRowsBtn.addEventListener('click', function () {
      const count = parseInt(document.getElementById('row-count').value) || 1;
      removeTableRows(component, count);
      showToast(`Removed ${count} row(s)`, 'success');
    });

    newAddColumnsBtn.addEventListener('click', function () {
      const count = parseInt(document.getElementById('column-count').value) || 1;
      addTableColumns(component, count);
      showToast(`Added ${count} column(s)`, 'success');
    });

    newRemoveColumnsBtn.addEventListener('click', function () {
      const count = parseInt(document.getElementById('column-count').value) || 1;
      removeTableColumns(component, count);
      showToast(`Removed ${count} column(s)`, 'success');
    });

    // Cancel button
    document.getElementById('cancel-settings').addEventListener('click', () => {
      editor.Modal.close();
    });

    // Apply button
    document.getElementById('apply-settings').addEventListener('click', () => {
      console.log('📝 Applying settings...');

      if (selectedGroupingFields.length === 0 && selectedSummaryFields.length > 0) {
        showToast('Please select at least one grouping field before adding summaries', 'warning');
        return;
      }

      const summarizeChecked = document.getElementById('summarize-group').checked;
      if (summarizeChecked && selectedSummaryFields.length === 0) {
        showToast('Please add at least one summary field when "Summarize Group" is enabled', 'warning');
        return;
      }

      // Save settings
      component.set('grouping-fields', selectedGroupingFields);
      component.set('summary-fields', selectedSummaryFields);
      component.set('sort-order', document.getElementById('sort-order').value);
      component.set('top-n', document.getElementById('top-n').value);
      component.set('top-n-value', parseInt(document.getElementById('top-n-value').value) || 10);
      component.set('merge-group-cells', document.getElementById('merge-group-cells').checked);
      component.set('summarize-group', document.getElementById('summarize-group').checked);
      component.set('hide-subtotal-single-row', document.getElementById('hide-subtotal-single-row').checked);
      component.set('page-break', document.getElementById('page-break').checked);

      const showSummaryOnly =
        document.querySelector('input[name="grouping-type"]:checked').value === 'summary';
      component.set('show-summary-only', showSummaryOnly);

      component.set('keep-group-hierarchy', document.getElementById('keep-group-hierarchy').checked);

      component.set('grand-total', document.getElementById('grand-total').checked);
      component.set('grand-total-label', document.getElementById('grand-total-label').value);
      component.set('summary-label', document.getElementById('summary-label').value);

      editor.Modal.close();

      setTimeout(() => {
        component.applyGroupingAndSummary();
        showToast('Settings applied successfully!', 'success');
      }, 100);
    });

    updateSelectedFields();
    updateSummaryFieldsList();
  }


  function initializeCustomTableColumnReorder(component) {
    const headers = component.getTableHeaders();
    const columnKeys = Object.keys(headers);

    const columnList = document.getElementById('column-list-inline');
    if (!columnList) {
      console.warn('Column list element not found');
      return;
    }

    if (columnKeys.length === 0) {
      columnList.innerHTML = '<p style="color: #999; text-align: center; padding: 10px;">No columns available</p>';
      return;
    }

    if (columnKeys.length <= 1) {
      columnList.innerHTML = '<p style="color: #999; text-align: center; padding: 10px;">Need at least 2 columns to reorder</p>';
      return;
    }

    columnList.innerHTML = columnKeys.map(key => `
    <div class="column-item-inline" data-key="${key}" draggable="true" style="
        margin: 2px; 
        padding: 12px 15px; 
        background: #f8f9fa;
        border: 1px solid #ddd;
        border-radius: 3px; 
        cursor: move; 
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: all 0.2s ease;
    ">
        <span style="font-weight: 500;">${headers[key]}</span>
        <span style="color: #666; font-size: 12px;">≡≡≡</span>
    </div>
  `).join('');

    let draggedElement = null;

    const columnItems = columnList.querySelectorAll('.column-item-inline');
    columnItems.forEach(item => {
      item.addEventListener('dragstart', function (e) {
        draggedElement = this;
        this.style.opacity = '0.5';
        e.dataTransfer.effectAllowed = 'move';
      });

      item.addEventListener('dragend', function () {
        this.style.opacity = '1';
        draggedElement = null;
        columnItems.forEach(item => item.style.borderTop = '');
      });

      item.addEventListener('dragover', function (e) {
        e.preventDefault();
        if (this !== draggedElement) {
          this.style.borderTop = '2px solid #007bff';
        }
      });

      item.addEventListener('dragleave', function () {
        this.style.borderTop = '';
      });

      item.addEventListener('drop', function (e) {
        e.preventDefault();
        this.style.borderTop = '';

        if (this !== draggedElement) {
          const allItems = Array.from(columnList.children);
          const draggedIndex = allItems.indexOf(draggedElement);
          const targetIndex = allItems.indexOf(this);

          if (draggedIndex < targetIndex) {
            this.parentNode.insertBefore(draggedElement, this.nextSibling);
          } else {
            this.parentNode.insertBefore(draggedElement, this);
          }

          applyCustomTableColumnReorder(component);
        }
      });
    });

    document.getElementById('reset-order').addEventListener('click', function () {
      component.storeBaseTableData();
      const headers = component.getTableHeaders();
      const data = component.getTableData();
      component.rebuildTableHTML(headers, data);
      initializeCustomTableColumnReorder(component);
      showToast('Column order reset to original', 'success');
    });
  }

  function applyCustomTableColumnReorder(component) {
    const columnList = document.getElementById('column-list-inline');
    const currentItems = columnList.querySelectorAll('.column-item-inline');
    const newOrder = Array.from(currentItems).map(item => item.getAttribute('data-key'));

    const headers = component.getTableHeaders();
    const data = component.getTableData();

    const reorderedHeaders = {};
    newOrder.forEach(key => {
      if (headers[key]) {
        reorderedHeaders[key] = headers[key];
      }
    });

    const reorderedData = data.map(row => {
      const newRow = {};
      newOrder.forEach(key => {
        if (row.hasOwnProperty(key)) {
          newRow[key] = row[key];
        }
      });
      return newRow;
    });

    component.set('base-headers', reorderedHeaders, { silent: true });
    component.set('base-data', reorderedData, { silent: true });
    component.rebuildTableHTML(reorderedHeaders, reorderedData);
  }

function addTableRows(component, count) {
  const tbody = component.find('tbody')[0];
  if (!tbody) return;

  const firstBodyRow = tbody.find('tr')[0];
  if (!firstBodyRow) return;

  const cellTypes = firstBodyRow.find('> [type="cell"]').map(cell => cell.get('tagName').toLowerCase());

  for (let i = 0; i < count; i++) {
    let newRowHtml = '<tr>';
    cellTypes.forEach(tag => {
      const content = tag === 'th' ? '<div>Header</div>' : '<div>Text</div>';
      newRowHtml += `<${tag}>${content}</${tag}>`;
    });
    newRowHtml += '</tr>';
    tbody.append(newRowHtml);
  }

  // Re-enable formula editing and store data
  setTimeout(() => {
    enableFormulaEditing(component.getId());
    component.storeBaseTableData();
  }, 100);
}

function addTableColumns(component, count) {
  const theadTr = component.find('thead > tr')[0];
  const tbody = component.find('tbody')[0];
  if (!tbody) return;

  const bodyRows = tbody.find('tr');

  // Add to header
  if (theadTr) {
    for (let i = 0; i < count; i++) {
      theadTr.append('<th><div>Header</div></th>');
    }
  }

  // Add to body rows (always td at end, regardless of row headers)
  bodyRows.forEach(row => {
    for (let i = 0; i < count; i++) {
      row.append('<td><div>Text</div></td>');
    }
  });

  // Re-enable formula editing and store data
  setTimeout(() => {
    enableFormulaEditing(component.getId());
    component.storeBaseTableData();
  }, 100);
}
function removeTableRows(component, count) {
  const tbody = component.find('tbody')[0];
  if (!tbody) return;

  const rows = tbody.find('tr');
  if (rows.length <= count) {
    showToast('Cannot remove all rows', 'warning');
    return;
  }

  for (let i = 0; i < count; i++) {
    const lastRow = rows[rows.length - 1 - i];
    if (lastRow) lastRow.remove();
  }

  component.storeBaseTableData();
}
function removeTableColumns(component, count) {
  const theadTr = component.find('thead > tr')[0];
  const tbody = component.find('tbody')[0];
  if (!tbody) return;

  const headerCells = theadTr ? theadTr.find('> [type="cell"]') : [];
  if (headerCells.length <= count) {
    showToast('Cannot remove all columns', 'warning');
    return;
  }

  // Remove from header
  for (let i = 0; i < count; i++) {
    const lastHeaderCell = headerCells[headerCells.length - 1 - i];
    if (lastHeaderCell) lastHeaderCell.remove();
  }

  // Remove from body
  const bodyRows = tbody.find('tr');
  bodyRows.forEach(row => {
    const cells = row.find('> [type="cell"]');
    for (let i = 0; i < count; i++) {
      const lastCell = cells[cells.length - 1 - i];
      if (lastCell) lastCell.remove();
    }
  });

  component.storeBaseTableData();
}

  function initializeCustomTableSettingsModal(component, availableFields) {
    let selectedGroupingFields = component.get('grouping-fields') || [];
    let selectedSummaryFields = component.get('summary-fields') || [];

    // Tab navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', function () {
        document.querySelectorAll('.nav-tab').forEach(t => {
          t.classList.remove('active');
          t.style.background = 'transparent';
          t.style.borderBottom = 'none';
          t.style.fontWeight = 'normal';
        });

        document.querySelectorAll('.tab-pane').forEach(p => {
          p.style.display = 'none';
        });

        this.classList.add('active');
        this.style.background = 'white';
        this.style.borderBottom = '3px solid #007bff';
        this.style.fontWeight = 'bold';

        const tabId = this.getAttribute('data-tab') + '-tab';
        const tabPane = document.getElementById(tabId);
        if (tabPane) {
          tabPane.style.display = 'block';
        }
      });
    });

    // Initialize column reorder
    initializeCustomTableColumnReorder(component);

    // Load saved options
    const sortOrder = document.getElementById('sort-order');
    const topN = document.getElementById('top-n');
    const topNValue = document.getElementById('top-n-value');
    const summarizeGroup = document.getElementById('summarize-group');
    const pageBreak = document.getElementById('page-break');
    const mergeGroupCells = document.getElementById('merge-group-cells');
    const groupHeaderInplace = document.getElementById('group-header-inplace');
    const hideSubtotalSingleRow = document.getElementById('hide-subtotal-single-row');
    const keepGroupHierarchy = document.getElementById('keep-group-hierarchy');
    const grandTotal = document.getElementById('grand-total');
    const grandTotalLabel = document.getElementById('grand-total-label');
    const summaryLabel = document.getElementById('summary-label');

    if (sortOrder) sortOrder.value = component.get('sort-order') || 'ascending';
    if (topN) topN.value = component.get('top-n') || 'none';
    if (topNValue) topNValue.value = component.get('top-n-value') || '10';
    if (summarizeGroup) summarizeGroup.checked = component.get('summarize-group') === true;
    if (pageBreak) pageBreak.checked = component.get('page-break') === true;
    if (mergeGroupCells) mergeGroupCells.checked = component.get('merge-group-cells') === true;
    if (groupHeaderInplace) groupHeaderInplace.checked = component.get('group-header-inplace') !== false;
    if (hideSubtotalSingleRow) hideSubtotalSingleRow.checked = component.get('hide-subtotal-single-row') === true;
    if (keepGroupHierarchy) keepGroupHierarchy.checked = component.get('keep-group-hierarchy') === true;
    if (grandTotal) grandTotal.checked = component.get('grand-total') !== false;
    if (grandTotalLabel) grandTotalLabel.value = component.get('grand-total-label') || '';
    if (summaryLabel) summaryLabel.value = component.get('summary-label') || '';

    // Load grouping type
    if (component.get('show-summary-only') === true) {
      const summaryRadio = document.querySelector('input[name="grouping-type"][value="summary"]');
      if (summaryRadio) {
        summaryRadio.checked = true;
        if (keepGroupHierarchy) keepGroupHierarchy.disabled = false;
      }
    }

    // Top N value enable/disable
    document.getElementById('top-n').addEventListener('change', function () {
      const topNValue = document.getElementById('top-n-value');
      const isEnabled = this.value === 'top' || this.value === 'bottom';

      topNValue.disabled = !isEnabled;
      topNValue.style.background = isEnabled ? 'white' : '#f0f0f0';
      topNValue.style.cursor = isEnabled ? 'text' : 'not-allowed';
      topNValue.style.opacity = isEnabled ? '1' : '0.6';
    });

    // Trigger on load
    setTimeout(() => {
      const topNSelect = document.getElementById('top-n');
      const topNValue = document.getElementById('top-n-value');
      const currentValue = topNSelect.value;
      const isEnabled = currentValue === 'top' || currentValue === 'bottom';

      topNValue.disabled = !isEnabled;
      topNValue.style.background = isEnabled ? 'white' : '#f0f0f0';
      topNValue.style.cursor = isEnabled ? 'text' : 'not-allowed';
      topNValue.style.opacity = isEnabled ? '1' : '0.6';
    }, 100);

    // Grand Total checkbox
    document.getElementById('grand-total').addEventListener('change', function () {
      const grandTotalLabel = document.getElementById('grand-total-label');
      const isEnabled = this.checked;
      grandTotalLabel.disabled = !isEnabled;
      grandTotalLabel.style.background = isEnabled ? 'white' : '#f0f0f0';
    });

    // Grouping field selection
    document.querySelectorAll('#available-fields .field-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', function () {
        const fieldItem = this.closest('.field-item');
        const fieldKey = fieldItem.getAttribute('data-key');
        const fieldName = fieldItem.querySelector('span').textContent;

        if (this.checked) {
          selectedGroupingFields.push({ key: fieldKey, name: fieldName });
          updateSelectedFields();
        }
      });
    });

    function updateSelectedFields() {
      const selectedFieldsDiv = document.getElementById('selected-fields');

      if (!selectedFieldsDiv) return;

      if (selectedGroupingFields.length === 0) {
        selectedFieldsDiv.innerHTML = '<p style="color: #999; text-align: center; font-size: 12px;">No fields selected</p>';
      } else {
        selectedFieldsDiv.innerHTML = selectedGroupingFields.map((field, idx) => `
        <div class="field-item selected" data-key="${field.key}" data-index="${idx}" style="padding: 5px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
            <span>${field.name}</span>
            <button class="remove-grouping-field" style="background: #dc3545; color: white; padding: 2px 6px; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">×</button>
        </div>
      `).join('');

        selectedFieldsDiv.querySelectorAll('.remove-grouping-field').forEach(btn => {
          btn.addEventListener('click', function () {
            const idx = parseInt(this.closest('.field-item').getAttribute('data-index'));
            const fieldKey = selectedGroupingFields[idx].key;
            selectedGroupingFields.splice(idx, 1);
            updateSelectedFields();

            const availableCheckbox = document.querySelector(`#available-fields .field-item[data-key="${fieldKey}"] .field-checkbox`);
            if (availableCheckbox) availableCheckbox.checked = false;
          });
        });
      }
    }

    function updateSummaryFieldsList() {
      const selectedSummaryFieldsDiv = document.getElementById('selected-summary-fields');

      if (!selectedSummaryFieldsDiv) return;

      if (selectedSummaryFields.length === 0) {
        selectedSummaryFieldsDiv.innerHTML = '<p style="color: #999; text-align: center; font-size: 12px; margin: 10px 0;">No summaries configured</p>';
        return;
      }

      selectedSummaryFieldsDiv.innerHTML = selectedSummaryFields.map((field, idx) => `
      <div class="summary-field-item" data-index="${idx}" style="padding: 8px; margin-bottom: 5px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
          <div style="flex: 1;">
              <strong style="font-size: 13px;">${field.name}</strong>
              <div style="font-size: 11px; color: #666; margin-top: 2px;">Function: ${field.function}</div>
          </div>
          <button class="remove-summary-field" data-index="${idx}" style="background: #dc3545; color: white; padding: 4px 8px; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">×</button>
      </div>
    `).join('');

      selectedSummaryFieldsDiv.querySelectorAll('.remove-summary-field').forEach(btn => {
        btn.addEventListener('click', function () {
          const idx = parseInt(this.getAttribute('data-index'));
          selectedSummaryFields.splice(idx, 1);
          updateSummaryFieldsList();
        });
      });
    }

    // Summary field add button
    document.getElementById('add-summary-field').addEventListener('click', function () {
      const summaryCheckboxes = document.querySelectorAll('#available-summary-fields .summary-checkbox:checked');
      const summaryFunction = document.getElementById('summary-function').value;

      if (summaryCheckboxes.length === 0) {
        showToast('Please select at least one field for summary', 'warning');
        return;
      }

      let addedCount = 0;
      summaryCheckboxes.forEach(checkbox => {
        const fieldItem = checkbox.closest('.field-item');
        const fieldKey = fieldItem.getAttribute('data-key');
        const fieldName = fieldItem.querySelector('span').textContent;

        const exists = selectedSummaryFields.some(f => f.key === fieldKey && f.function === summaryFunction);
        if (!exists) {
          selectedSummaryFields.push({
            key: fieldKey,
            name: fieldName,
            function: summaryFunction
          });
          addedCount++;
        }

        checkbox.checked = false;
      });

      updateSummaryFieldsList();

      if (addedCount > 0) {
        console.log(`Added ${addedCount} summary field(s)`);
      }
    });

    // Sort summary fields
    document.getElementById('sort-summary-asc').addEventListener('click', () => {
      const items = Array.from(document.querySelectorAll('#available-summary-fields .field-item'));
      items.sort((a, b) => a.textContent.localeCompare(b.textContent));
      const container = document.getElementById('available-summary-fields');
      container.innerHTML = '';
      items.forEach(item => container.appendChild(item));
    });

    document.getElementById('sort-summary-desc').addEventListener('click', () => {
      const items = Array.from(document.querySelectorAll('#available-summary-fields .field-item'));
      items.sort((a, b) => b.textContent.localeCompare(a.textContent));
      const container = document.getElementById('available-summary-fields');
      container.innerHTML = '';
      items.forEach(item => container.appendChild(item));
    });

    // Sort buttons for grouping fields
    document.getElementById('sort-asc').addEventListener('click', () => {
      const items = Array.from(document.querySelectorAll('#available-fields .field-item'));
      items.sort((a, b) => a.textContent.localeCompare(b.textContent));
      const container = document.getElementById('available-fields');
      container.innerHTML = '';
      items.forEach(item => container.appendChild(item));
    });

    document.getElementById('sort-desc').addEventListener('click', () => {
      const items = Array.from(document.querySelectorAll('#available-fields .field-item'));
      items.sort((a, b) => b.textContent.localeCompare(a.textContent));
      const container = document.getElementById('available-fields');
      container.innerHTML = '';
      items.forEach(item => container.appendChild(item));
    });

    // Grouping type radio buttons
    document.querySelectorAll('input[name="grouping-type"]').forEach(radio => {
      radio.addEventListener('change', function () {
        const keepHierarchy = document.getElementById('keep-group-hierarchy');
        const isSummaryOnly = this.value === 'summary';

        keepHierarchy.disabled = !isSummaryOnly;
        keepHierarchy.parentElement.querySelector('span').style.color = isSummaryOnly ? '#000' : '#999';

        if (!isSummaryOnly) {
          keepHierarchy.checked = false;
        }
      });
    });

    // Row/Column operations
    document.getElementById('add-rows').addEventListener('click', function () {
      const count = parseInt(document.getElementById('row-count').value) || 1;
      addTableRows(component, count);
      showToast(`Added ${count} row(s)`, 'success');
    });

    document.getElementById('remove-rows').addEventListener('click', function () {
      const count = parseInt(document.getElementById('row-count').value) || 1;
      removeTableRows(component, count);
      showToast(`Removed ${count} row(s)`, 'success');
    });

    document.getElementById('add-columns').addEventListener('click', function () {
      const count = parseInt(document.getElementById('column-count').value) || 1;
      addTableColumns(component, count);
      showToast(`Added ${count} column(s)`, 'success');
    });

    document.getElementById('remove-columns').addEventListener('click', function () {
      const count = parseInt(document.getElementById('column-count').value) || 1;
      removeTableColumns(component, count);
      showToast(`Removed ${count} column(s)`, 'success');
    });

    // Cancel button
    document.getElementById('cancel-settings').addEventListener('click', () => {
      editor.Modal.close();
    });

    // Apply button
    document.getElementById('apply-settings').addEventListener('click', () => {
      console.log('📝 Applying settings...');

      if (selectedGroupingFields.length === 0 && selectedSummaryFields.length > 0) {
        showToast('Please select at least one grouping field before adding summaries', 'warning');
        return;
      }

      const summarizeChecked = document.getElementById('summarize-group').checked;
      if (summarizeChecked && selectedSummaryFields.length === 0) {
        showToast('Please add at least one summary field when "Summarize Group" is enabled', 'warning');
        return;
      }

      // Save all settings
      component.set('grouping-fields', selectedGroupingFields);
      component.set('summary-fields', selectedSummaryFields);
      component.set('sort-order', document.getElementById('sort-order').value);
      component.set('top-n', document.getElementById('top-n').value);
      component.set('top-n-value', parseInt(document.getElementById('top-n-value').value) || 10);
      component.set('merge-group-cells', document.getElementById('merge-group-cells').checked);
      component.set('summarize-group', document.getElementById('summarize-group').checked);
      component.set('hide-subtotal-single-row', document.getElementById('hide-subtotal-single-row').checked);
      component.set('page-break', document.getElementById('page-break').checked);

      const showSummaryOnly = document.querySelector('input[name="grouping-type"]:checked').value === 'summary';
      component.set('show-summary-only', showSummaryOnly);
      component.set('keep-group-hierarchy', document.getElementById('keep-group-hierarchy').checked);

      component.set('grand-total', document.getElementById('grand-total').checked);
      component.set('grand-total-label', document.getElementById('grand-total-label').value);
      component.set('summary-label', document.getElementById('summary-label').value);

      editor.Modal.close();

      // Apply grouping
      setTimeout(() => {
        component.applyGroupingAndSummary();
        showToast('Settings applied successfully!', 'success');
      }, 100);
    });

    updateSelectedFields();
    updateSummaryFieldsList();
  }

  function initializeCustomTableColumnReorder(component) {
    const headers = component.getTableHeaders();
    const columnKeys = Object.keys(headers);

    if (columnKeys.length <= 1) {
      document.getElementById('column-list-inline').innerHTML = '<p style="color: #999; text-align: center; padding: 10px;">Need at least 2 columns to reorder</p>';
      return;
    }

    const columnList = document.getElementById('column-list-inline');
    columnList.innerHTML = columnKeys.map(key => `
    <div class="column-item-inline" data-key="${key}" draggable="true" style="
        margin: 2px; 
        padding: 12px 15px; 
        border-radius: 3px; 
        cursor: move; 
        display: flex;
        justify-content: space-between;
        align-items: center;
        transition: all 0.2s ease;
    ">
        <span style="font-weight: 500;">${headers[key]}</span>
        <span style="color: #666; font-size: 12px;">≡≡≡</span>
    </div>
  `).join('');

    let draggedElement = null;

    const columnItems = columnList.querySelectorAll('.column-item-inline');
    columnItems.forEach(item => {
      item.addEventListener('dragstart', function (e) {
        draggedElement = this;
        this.style.opacity = '0.5';
        e.dataTransfer.effectAllowed = 'move';
      });

      item.addEventListener('dragend', function () {
        this.style.opacity = '1';
        draggedElement = null;
        columnItems.forEach(item => item.style.borderTop = '');
      });

      item.addEventListener('dragover', function (e) {
        e.preventDefault();
        if (this !== draggedElement) {
          this.style.borderTop = '2px solid #007bff';
        }
      });

      item.addEventListener('dragleave', function () {
        this.style.borderTop = '';
      });

      item.addEventListener('drop', function (e) {
        e.preventDefault();
        this.style.borderTop = '';

        if (this !== draggedElement) {
          const allItems = Array.from(columnList.children);
          const draggedIndex = allItems.indexOf(draggedElement);
          const targetIndex = allItems.indexOf(this);

          if (draggedIndex < targetIndex) {
            this.parentNode.insertBefore(draggedElement, this.nextSibling);
          } else {
            this.parentNode.insertBefore(draggedElement, this);
          }

          applyCustomTableColumnReorder(component);
        }
      });
    });

    document.getElementById('reset-order').addEventListener('click', function () {
      component.storeBaseTableData();
      const headers = component.getTableHeaders();
      const data = component.getTableData();
      component.rebuildTableHTML(headers, data);
      initializeCustomTableColumnReorder(component);
      showToast('Column order reset to original', 'success');
    });
  }

  function applyCustomTableColumnReorder(component) {
    const columnList = document.getElementById('column-list-inline');
    const currentItems = columnList.querySelectorAll('.column-item-inline');
    const newOrder = Array.from(currentItems).map(item => item.getAttribute('data-key'));

    const headers = component.getTableHeaders();
    const data = component.getTableData();

    const reorderedHeaders = {};
    newOrder.forEach(key => {
      if (headers[key]) {
        reorderedHeaders[key] = headers[key];
      }
    });

    const reorderedData = data.map(row => {
      const newRow = {};
      newOrder.forEach(key => {
        if (row.hasOwnProperty(key)) {
          newRow[key] = row[key];
        }
      });
      return newRow;
    });

    component.set('base-headers', reorderedHeaders, { silent: true });
    component.set('base-data', reorderedData, { silent: true });
    component.rebuildTableHTML(reorderedHeaders, reorderedData);
  }

  function addTableRows(component, count) {
    const tableId = component.getId();
    const canvasDoc = editor.Canvas.getDocument();
    const tableElement = canvasDoc.getElementById(tableId);
    if (!tableElement) return;

    const tbody = tableElement.querySelector('tbody');
    const headers = component.getTableHeaders();
    const headerKeys = Object.keys(headers);

    for (let i = 0; i < count; i++) {
      const tr = canvasDoc.createElement('tr');
      headerKeys.forEach(key => {
        const td = canvasDoc.createElement('td');
        td.innerHTML = '<div>Text</div>';
        td.style.padding = '8px';
        td.style.border = '1px solid #000';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    }

    component.storeBaseTableData();
  }

  function removeTableRows(component, count) {
    const tableId = component.getId();
    const canvasDoc = editor.Canvas.getDocument();
    const tableElement = canvasDoc.getElementById(tableId);
    if (!tableElement) return;

    const tbody = tableElement.querySelector('tbody');
    const rows = tbody.querySelectorAll('tr');

    if (rows.length <= count) {
      showToast('Cannot remove all rows', 'warning');
      return;
    }

    for (let i = 0; i < count; i++) {
      if (rows[rows.length - 1 - i]) {
        rows[rows.length - 1 - i].remove();
      }
    }

    component.storeBaseTableData();
  }

  function addTableColumns(component, count) {
    const tableId = component.getId();
    const canvasDoc = editor.Canvas.getDocument();
    const tableElement = canvasDoc.getElementById(tableId);
    if (!tableElement) return;

    // Add to header
    const thead = tableElement.querySelector('thead tr');
    if (thead) {
      for (let i = 0; i < count; i++) {
        const th = canvasDoc.createElement('th');
        th.innerHTML = '<div>Text</div>';
        th.style.padding = '8px';
        th.style.border = '1px solid #000';
        thead.appendChild(th);
      }
    }

    // Add to body rows
    const tbody = tableElement.querySelector('tbody');
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
      for (let i = 0; i < count; i++) {
        const td = canvasDoc.createElement('td');
        td.innerHTML = '<div>Text</div>';
        td.style.padding = '8px';
        td.style.border = '1px solid #000';
        row.appendChild(td);
      }
    });

    component.storeBaseTableData();
  }

  function removeTableColumns(component, count) {
    const tableId = component.getId();
    const canvasDoc = editor.Canvas.getDocument();
    const tableElement = canvasDoc.getElementById(tableId);
    if (!tableElement) return;

    const thead = tableElement.querySelector('thead tr');
    const headerCells = thead.querySelectorAll('th');

    if (headerCells.length <= count) {
      showToast('Cannot remove all columns', 'warning');
      return;
    }

    // Remove from header
    for (let i = 0; i < count; i++) {
      if (headerCells[headerCells.length - 1 - i]) {
        headerCells[headerCells.length - 1 - i].remove();
      }
    }

    // Remove from body
    const tbody = tableElement.querySelector('tbody');
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      for (let i = 0; i < count; i++) {
        if (cells[cells.length - 1 - i]) {
          cells[cells.length - 1 - i].remove();
        }
      }
    });

    component.storeBaseTableData();
  }

  // Enhanced event listener for table selection to apply highlighting traits
  editor.on('component:selected', function (component) {
    if (component) {
      const element = component.getEl();
      const tagName = component.get('tagName');

      // Handle table selection
      if (tagName === 'table' && component.getId() && component.getId().startsWith('table')) {
        if (component.get('type') !== 'enhanced-table') {
          component.set('type', 'enhanced-table');
        }

        const condition = component.get('highlight-condition');
        const color = component.get('highlight-color');

        if (condition) {
          setTimeout(() => {
            applyHighlighting(component.getId(), condition, color);
          }, 100);
        }
      }

      // Handle table cell selection
      if ((tagName === 'td' || tagName === 'th') && element) {
        const table = element.closest('table');
        if (table && table.id && table.id.startsWith('table')) {
          // Set cell type to enhanced-table-cell
          if (component.get('type') !== 'enhanced-table-cell') {
            component.set('type', 'enhanced-table-cell');

            // Check if this cell already has a running total
            const cellIndex = Array.from(element.parentNode.children).indexOf(element);
            const runningTotalExists = table.querySelector(`[data-running-total-for="${cellIndex}"]`);

            if (runningTotalExists) {
              component.set('running-total', true);
            }
          }
        }
      }
    }
  });

  // Global function to update highlighting for external access
  window.updateTableHighlighting = function (tableId, conditionType, conditionValue, color) {
    applyHighlighting(tableId, conditionType, conditionValue, color);

    const canvasBody = editor.Canvas.getBody();
    const tableEl = canvasBody.querySelector(`#${tableId}`);
    if (tableEl) {
      const tableComponent = editor.DomComponents.getComponentFromElement(tableEl);
      if (tableComponent) {
        editor.trigger('component:update', tableComponent);
      }
    }
  };
  // Page system integration - ensure tables work properly when pages are created/modified
  editor.on('component:add component:update', function (component) {
    // Only process if this might be related to page structure changes
    if (component && (
      component.get('tagName') === 'div' ||
      component.getClasses().includes('page-container') ||
      component.getClasses().includes('main-content-area')
    )) {
      // Re-initialize any tables that might have been affected by page changes
      setTimeout(() => {
        try {
          const canvasBody = editor.Canvas.getBody();
          if (canvasBody && typeof canvasBody.querySelectorAll === 'function') {
            const tables = canvasBody.querySelectorAll('table[id^="table"]');
            tables.forEach(table => {
              const tableId = table.id;
              // Check if table needs re-initialization
              if (!window.pageTableInstances || !window.pageTableInstances[tableId]) {
                // Find and re-execute the table script
                const scriptId = tableId.replace('table', '');
                const scriptElement = canvasBody.querySelector(`.table-script-${scriptId}`);
                if (scriptElement && scriptElement.textContent) {
                  try {
                    eval(scriptElement.textContent);
                  } catch (error) {
                    console.warn('Error re-initializing table:', error);
                  }
                }
              }
            });
          }
        } catch (error) {
          console.warn('Error in page system table integration:', error);
        }
      }, 500);
    }
  });

  // Cleanup function for page system integration
  editor.on('component:remove', function (component) {
    // Clean up any DataTable instances when components are removed
    try {
      if (component && typeof component.getEl === 'function') {
        const element = component.getEl();
        if (element && typeof element.querySelectorAll === 'function') {
          const tables = element.querySelectorAll('table[id^="table"]');
          tables.forEach(table => {
            const tableId = table.id;
            if (window.pageTableInstances && window.pageTableInstances[tableId]) {
              try {
                window.pageTableInstances[tableId].destroy();
                delete window.pageTableInstances[tableId];
              } catch (error) {
                console.warn('Error destroying DataTable:', error);
              }
            }
          });
        }
      }
    } catch (error) {
      console.warn('Error in table cleanup:', error);
    }
  });

  // Enhanced print handling for page system
  if (typeof window !== 'undefined') {
    // Store original print function
    const originalPrint = window.print;

    window.print = function () {
      try {
        // Before printing, ensure all highlighted cells use GrapesJS background colors
        const tables = document.querySelectorAll('table[id^="table"]');
        tables.forEach(table => {
          try {
            // Ensure table attributes for print
            table.setAttribute("border", "1");
            table.style.borderCollapse = "collapse";
            table.style.width = "100%";
            table.style.fontFamily = "Arial, sans-serif";

            // Find highlighted cells and ensure background color is properly set
            const highlightedCells = table.querySelectorAll('td[data-highlighted="true"], th[data-highlighted="true"]');
            highlightedCells.forEach(cell => {
              // Get background color from GrapesJS component if available
              const cellComponent = editor.DomComponents.getComponentFromElement(cell);
              let bgColor = '#ffff99'; // default

              if (cellComponent) {
                const componentBgColor = cellComponent.getStyle()['background-color'];
                if (componentBgColor) {
                  bgColor = componentBgColor;
                }
              }

              // Apply inline styles for print compatibility
              cell.style.backgroundColor = bgColor;
              cell.style.webkitPrintColorAdjust = 'exact';
              cell.style.colorAdjust = 'exact';
              cell.style.printColorAdjust = 'exact';
            });

          } catch (error) {
            console.warn('Error preparing table for print:', error);
          }
        });

        // Call original print function
        originalPrint.call(this);

      } catch (error) {
        console.warn('Error in custom print function, using original:', error);
        originalPrint.call(this);
      }
    };
  }

  // Initialize page table instances storage
  if (typeof window !== 'undefined' && !window.pageTableInstances) {
    window.pageTableInstances = {};
  }

  // Custom command to add table to selected component
  editor.Commands.add('add-table-to-selected', {
    run(editor) {
      addTable();
    }
  });

  console.log('Enhanced Custom Table function initialized with formula suggestions, highlighting traits and page system integration');
}