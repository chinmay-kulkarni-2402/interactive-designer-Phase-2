function jsontablecustom(editor) {
    // Add highlighting evaluation function from custom table
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
                    const cellText = cellValue.toString().toLowerCase();
                    const conditionText = condition.toLowerCase();
                    
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

    // Add highlighting function from custom table
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

    editor.DomComponents.addType('json-table', {
        model: {
            defaults: {
                tagName: 'div',
                attributes: { class: 'json-table-container' },
                traits: [
                    {
                        type: 'text',
                        name: 'id',
                        label: 'Id'
                    },
                    {
                        type: 'text',
                        name: 'title',
                        label: 'Title'
                    },
                    {
                        type: 'text',
                        name: 'name',
                        label: 'Name',
                        changeProp: 1
                    },
                    {
                        type: 'select',
                        name: 'footer',
                        label: 'Footer',
                        options: [
                            { value: 'yes', name: 'Yes' },
                            { value: 'no', name: 'No' }
                        ],
                        changeProp: 1
                    },
                    {
                        type: 'text',
                        name: 'file-download',
                        label: 'File Download',
                        placeholder: '"copy", "csv", "excel", "pdf", "print"'
                    },
                    {
                        type: 'select',
                        name: 'pagination',
                        label: 'Pagination',
                        options: [
                            { value: 'yes', name: 'Yes' },
                            { value: 'no', name: 'No' }
                        ],
                        changeProp: 1
                    },
                    {
                        type: 'number',
                        name: 'page-length',
                        label: 'Page Length',
                        min: 1,
                        changeProp: 1
                    },
                    {
                        type: 'select',
                        name: 'search',
                        label: 'Search',
                        options: [
                            { value: 'yes', name: 'Yes' },
                            { value: 'no', name: 'No' }
                        ],
                        changeProp: 1
                    },
                    {
                        type: 'select',
                        name: 'caption',
                        label: 'Caption',
                        options: [
                            { value: 'yes', name: 'Yes' },
                            { value: 'no', name: 'No' }
                        ],
                        changeProp: 1
                    },
                    {
                        type: 'select',
                        name: 'caption-align',
                        label: 'Caption Align',
                        options: [
                            { value: 'left', name: 'Left' },
                            { value: 'center', name: 'Center' },
                            { value: 'right', name: 'Right' }
                        ],
                        changeProp: 1
                    },
                    {
                        type: 'text',
                        name: 'json-path',
                        label: 'Json Path',
                        placeholder: 'Enter Json Path'
                    },
                    // Add highlighting traits from custom table
                    {
                        type: 'select',
                        name: 'highlight-condition-type',
                        label: 'Highlight Condition',
                        options: [
                            { value: '', name: 'Select Condition Type' },
                            { value: 'contains', name: 'Text: Contains' },
                            { value: 'starts-with', name: 'Text: Starts With' },
                            { value: 'ends-with', name: 'Text: Ends With' },
                            { value: '>', name: 'Number: > (Greater than)' },
                            { value: '>=', name: 'Number: >= (Greater than or equal)' },
                            { value: '<', name: 'Number: < (Less than)' },
                            { value: '<=', name: 'Number: <= (Less than or equal)' },
                            { value: '=', name: 'Number: = (Equal to)' },
                            { value: '!=', name: 'Number: != (Not equal to)' },
                            { value: 'between', name: 'Number: Between (range)' },
                            { value: 'null', name: 'Null/Empty (No value)' }
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
                        placeholder: '#ffff99',
                        changeProp: 1
                    },
                    {
                        type: 'button',
                        name: 'json-suggestion-btn',
                        label: 'Json Suggestion',
                        text: 'Suggestion',
                        full: true,
                        command: 'open-json-table-suggestion'
                    },
                    {
                        type: 'button',
                        name: 'add-row-btn',
                        label: 'Add Row',
                        text: 'Add Row',
                        full: true,
                        command: 'add-table-row'
                    },
                    {
                        type: 'button',
                        name: 'add-column-btn',
                        label: 'Add Column',
                        text: 'Add Column',
                        full: true,
                        command: 'add-table-column'
                    },
                    {
                        type: 'button',
                        name: 'remove-row-btn',
                        label: 'Remove Row',
                        text: 'Remove Last Row',
                        full: true,
                        command: 'remove-table-row'
                    },
                    {
                        type: 'button',
                        name: 'remove-column-btn',
                        label: 'Remove Column',
                        text: 'Remove Last Column',
                        full: true,
                        command: 'remove-table-column'
                    }
                ],
                'json-path': '',
                'table-data': null,
                'table-headers': null,
                'custom-data': null,
                'custom-headers': null,
                'cell-styles': {},
                'selected-cell': null,
                // Add highlighting properties
                'highlight-condition-type': '',
                'highlight-words': '',
                'highlight-color': '#ffff99'
            },

            init() {
                this.on('change:json-path', this.updateTableFromJson);
                this.on('change:name change:footer change:pagination change:page-length change:search change:caption change:caption-align', this.updateTableHTML);
                // Add highlighting change handlers
                this.on('change:highlight-condition-type change:highlight-words change:highlight-color', this.handleHighlightChange);

                // Initialize custom data if not present
                if (!this.get('custom-data') && !this.get('custom-headers')) {
                    this.initializeDefaultTable();
                }

                // Initial render
                this.updateTableHTML();
            },

            // Add highlighting change handler
            handleHighlightChange() {
                const tableElement = this.view.el.querySelector('.json-data-table');
                if (!tableElement || !tableElement.id) return;

                const tableId = tableElement.id;
                const conditionType = this.get('highlight-condition-type');
                const words = this.get('highlight-words');
                const color = this.get('highlight-color');
                
                if (conditionType) {
                    applyHighlighting(tableId, conditionType, words, color);
                    editor.trigger('component:update', this);
                }
            },

            initializeDefaultTable() {
                const defaultHeaders = {
                    'col1': 'Sample Header 1',
                    'col2': 'Sample Header 2',
                    'col3': 'Sample Header 3'
                };

                const defaultData = [
                    { 'col1': 'Sample Data 1', 'col2': 'Sample Data 2', 'col3': 'Sample Data 3' },
                    { 'col1': 'Sample Data 4', 'col2': 'Sample Data 5', 'col3': 'Sample Data 6' }
                ];

                this.set('custom-headers', defaultHeaders);
                this.set('custom-data', defaultData);
            },

            updateTableFromJson() {
                const jsonPath = this.get('json-path');
                if (!jsonPath) return;

                try {
                    let custom_language = localStorage.getItem('language');
                    if (custom_language === null) {
                        custom_language = 'english';
                    }
                    const commonJson = JSON.parse(localStorage.getItem('common_json'));
                    if (!commonJson || !commonJson[custom_language]) {
                        console.error('Common JSON or language data not found');
                        return;
                    }

                    const fullPath = `commonJson.${custom_language}.${jsonPath}`;
                    const tableData = eval(fullPath);

                    if (tableData && tableData.heading && tableData.data) {
                        this.set('table-headers', tableData.heading);
                        this.set('table-data', tableData.data);
                        // Also set as custom data for editing
                        this.set('custom-headers', tableData.heading);
                        this.set('custom-data', [...tableData.data]); // Create copy
                        this.updateTableHTML();
                    } else {
                        console.error('Invalid table data structure');
                    }
                } catch (error) {
                    console.error('Error parsing JSON path:', error);
                }
            },

            addRow() {
                const headers = this.get('custom-headers') || this.get('table-headers');
                const data = this.get('custom-data') || this.get('table-data') || [];

                if (!headers) return;

                const newRow = {};
                Object.keys(headers).forEach(key => {
                    newRow[key] = 'New Data';
                });

                const updatedData = [...data, newRow];
                this.set('custom-data', updatedData);
                this.updateTableHTML();
            },

            addColumn() {
                const headers = this.get('custom-headers') || this.get('table-headers') || {};
                const data = this.get('custom-data') || this.get('table-data') || [];

                const columnCount = Object.keys(headers).length;
                const newColumnKey = `col${columnCount + 1}`;
                const newColumnName = `New Column ${columnCount + 1}`;

                // Add new header
                const updatedHeaders = { ...headers, [newColumnKey]: newColumnName };

                // Add new column to all rows
                const updatedData = data.map(row => ({
                    ...row,
                    [newColumnKey]: 'New Data'
                }));

                this.set('custom-headers', updatedHeaders);
                this.set('custom-data', updatedData);
                this.updateTableHTML();
            },

            removeRow() {
                const data = this.get('custom-data') || this.get('table-data') || [];

                if (data.length <= 1) return; // Don't remove if only one row

                const updatedData = data.slice(0, -1);
                this.set('custom-data', updatedData);
                this.updateTableHTML();
            },

            removeColumn() {
                const headers = this.get('custom-headers') || this.get('table-headers') || {};
                const data = this.get('custom-data') || this.get('table-data') || [];

                const headerKeys = Object.keys(headers);
                if (headerKeys.length <= 1) return; // Don't remove if only one column

                const lastKey = headerKeys[headerKeys.length - 1];

                // Remove from headers
                const updatedHeaders = { ...headers };
                delete updatedHeaders[lastKey];

                // Remove from data
                const updatedData = data.map(row => {
                    const newRow = { ...row };
                    delete newRow[lastKey];
                    return newRow;
                });

                this.set('custom-headers', updatedHeaders);
                this.set('custom-data', updatedData);
                this.updateTableHTML();
            },

            updateCellData(rowIndex, columnKey, newValue) {
                const data = this.get('custom-data') || this.get('table-data') || [];
                const updatedData = [...data];

                if (updatedData[rowIndex]) {
                    updatedData[rowIndex] = { ...updatedData[rowIndex], [columnKey]: newValue };
                    this.set('custom-data', updatedData);
                    
                    // Store the change in the component for export
                    const cellId = `cell-${rowIndex}-${columnKey}`;
                    this.set(`cell-content-${cellId}`, newValue);
                    
                    this.updateTableHTML();
                }
            },

            updateHeaderData(columnKey, newValue) {
                const headers = this.get('custom-headers') || this.get('table-headers') || {};
                const updatedHeaders = { ...headers, [columnKey]: newValue };
                this.set('custom-headers', updatedHeaders);
                
                // Store the change in the component for export
                this.set(`header-content-${columnKey}`, newValue);
                
                this.updateTableHTML();
            },

            setCellStyle(rowIndex, columnKey, styles) {
                const cellStyles = this.get('cell-styles') || {};
                const cellKey = `${rowIndex}-${columnKey}`;

                cellStyles[cellKey] = { ...cellStyles[cellKey], ...styles };
                this.set('cell-styles', cellStyles);
                this.updateTableHTML();
            },

            getCellStyle(rowIndex, columnKey) {
                const cellStyles = this.get('cell-styles') || {};
                const cellKey = `${rowIndex}-${columnKey}`;
                return cellStyles[cellKey] || {};
            },

            updateTableHTML() {
                const headers = this.get('custom-headers') || this.get('table-headers');
                const data = this.get('custom-data') || this.get('table-data');
                const name = this.get('name') || 'Table';
                const title = this.get('title') || '';
                const footer = this.get('footer') || 'no';
                const pagination = this.get('pagination') || 'no';
                const pageLength = this.get('page-length') || 10;
                const search = this.get('search') || 'no';
                const caption = this.get('caption') || 'no';
                const captionAlign = this.get('caption-align') || 'left';
                const fileDownload = this.get('file-download') || '';
                
                // Generate unique table ID
                const tableId = this.cid ? `json-table-${this.cid}` : `json-table-${Math.random().toString(36).substr(2, 9)}`;

                let tableHTML = `<div class="json-table-wrapper" style="width: 100%; overflow-x: auto;">`;

                if (title) {
                    tableHTML += `<h3 style="margin-bottom: 15px;">${title}</h3>`;
                }

                // Table controls
                if (search === 'yes' || fileDownload) {
                    tableHTML += `<div class="table-controls" style="margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">`;

                    if (search === 'yes') {
                        tableHTML += `<input type="text" placeholder="Search..." class="table-search" style="padding: 8px; border: 1px solid #ddd; border-radius: 4px; width: 200px;">`;
                    }

                    if (fileDownload) {
                        const downloadOptions = fileDownload.replace(/"/g, '').split(',').map(opt => opt.trim());
                        tableHTML += `<div class="download-buttons">`;
                        downloadOptions.forEach(option => {
                            tableHTML += `<button class="download-btn" data-type="${option}" style="margin-left: 5px; padding: 6px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">${option.charAt(0).toUpperCase() + option.slice(1)}</button>`;
                        });
                        tableHTML += `</div>`;
                    }

                    tableHTML += `</div>`;
                }

                tableHTML += `<table class="json-data-table" id="${tableId}" style="width: 100%; border-collapse: collapse; border: 1px solid #ddd; font-family: Arial, sans-serif;">`;

                // Caption
                if (caption === 'yes' && name) {
                    tableHTML += `<caption style="text-align: ${captionAlign}; padding: 10px; font-weight: bold; background-color: #f8f9fa;">${name}</caption>`;
                }

                if (headers && data) {
                    // Table header
                    tableHTML += `<thead style="background-color: #f8f9fa;"><tr>`;
                    Object.entries(headers).forEach(([key, header]) => {
                        const headerId = `${tableId}-header-${key}`;
                        // Check for stored header content
                        const storedHeader = this.get(`header-content-${key}`) || header;
                        tableHTML += `<th id="${headerId}" class="editable-header json-table-cell" data-column-key="${key}" style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: bold; cursor: pointer; position: relative;">${storedHeader}</th>`;
                    });
                    tableHTML += `</tr></thead>`;

                    // Table body
                    tableHTML += `<tbody>`;
                    data.forEach((row, rowIndex) => {
                        const rowClass = rowIndex % 2 === 0 ? 'even-row' : 'odd-row';
                        tableHTML += `<tr class="${rowClass}" style="background-color: ${rowIndex % 2 === 0 ? '#ffffff' : '#f8f9fa'};">`;
                        Object.keys(headers).forEach(key => {
                            const cellId = `${tableId}-cell-${rowIndex}-${key}`;
                            const cellStyles = this.getCellStyle(rowIndex, key);
                            const cellStyleString = Object.entries(cellStyles).map(([prop, value]) => `${prop}: ${value}`).join('; ');
                            const combinedStyle = `padding: 12px; border-bottom: 1px solid #dee2e6; cursor: pointer; position: relative; ${cellStyleString}`;
                            
                            // Check for stored cell content
                            const storedContent = this.get(`cell-content-cell-${rowIndex}-${key}`) || row[key] || '';

                            tableHTML += `<td id="${cellId}" class="editable-cell json-table-cell" data-row="${rowIndex}" data-column-key="${key}" style="${combinedStyle}">${storedContent}</td>`;
                        });
                        tableHTML += `</tr>`;
                    });
                    tableHTML += `</tbody>`;

                    // Footer
                    if (footer === 'yes') {
                        tableHTML += `<tfoot style="background-color: #e9ecef;"><tr>`;
                        Object.values(headers).forEach(header => {
                            tableHTML += `<th style="padding: 12px; text-align: left; border-top: 2px solid #dee2e6; font-weight: bold;">${header}</th>`;
                        });
                        tableHTML += `</tr></tfoot>`;
                    }
                } else {
                    // Placeholder when no data
                    tableHTML += `<thead style="background-color: #f8f9fa;"><tr>`;
                    tableHTML += `<th class="json-table-cell" style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: bold;">Sample Header 1</th>`;
                    tableHTML += `<th class="json-table-cell" style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: bold;">Sample Header 2</th>`;
                    tableHTML += `<th class="json-table-cell" style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: bold;">Sample Header 3</th>`;
                    tableHTML += `</tr></thead>`;

                    tableHTML += `<tbody>`;
                    tableHTML += `<tr style="background-color: #ffffff;"><td class="json-table-cell" style="padding: 12px; border-bottom: 1px solid #dee2e6;">Sample Data 1</td><td class="json-table-cell" style="padding: 12px; border-bottom: 1px solid #dee2e6;">Sample Data 2</td><td class="json-table-cell" style="padding: 12px; border-bottom: 1px solid #dee2e6;">Sample Data 3</td></tr>`;
                    tableHTML += `<tr style="background-color: #f8f9fa;"><td class="json-table-cell" style="padding: 12px; border-bottom: 1px solid #dee2e6;">Sample Data 4</td><td class="json-table-cell" style="padding: 12px; border-bottom: 1px solid #dee2e6;">Sample Data 5</td><td class="json-table-cell" style="padding: 12px; border-bottom: 1px solid #dee2e6;">Sample Data 6</td></tr>`;
                    tableHTML += `</tbody>`;
                }

                tableHTML += `</table>`;

                // Pagination
                if (pagination === 'yes') {
                    tableHTML += `<div class="table-pagination" style="margin-top: 15px; display: flex; justify-content: space-between; align-items: center;">`;
                    tableHTML += `<div>Show <select class="page-length-select" style="padding: 4px;"><option value="10">10</option><option value="25">25</option><option value="50">50</option><option value="100">100</option></select> entries</div>`;
                    tableHTML += `<div class="pagination-controls">`;
                    tableHTML += `<button class="page-btn" data-page="prev" style="padding: 6px 12px; margin: 0 2px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Previous</button>`;
                    tableHTML += `<span class="page-info" style="padding: 0 10px;">Page 1 of 1</span>`;
                    tableHTML += `<button class="page-btn" data-page="next" style="padding: 6px 12px; margin: 0 2px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Next</button>`;
                    tableHTML += `</div></div>`;
                }

                tableHTML += `</div>`;

                // Add print-specific styles with highlighting preservation
                tableHTML += `<style>
                @media print {
                    /* Preserve highlighting in print */
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
                }
                
                .json-data-table tr:hover {
                    background-color: #f5f5f5 !important;
                }
                
                .download-btn:hover,
                .page-btn:hover {
                    background: #0056b3 !important;
                }

                /* Enhanced highlighted cell styles */
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

                /* Cell editing styles */
                .json-table-cell.editing {
                    background-color: #e3f2fd !important;
                    outline: 2px solid #007bff !important;
                }

                .json-table-cell:hover {
                    background-color: #f0f8ff !important;
                }
            </style>`;

                this.set('content', tableHTML);
                
                // Apply highlighting after HTML is updated
                setTimeout(() => {
                    const conditionType = this.get('highlight-condition-type');
                    const words = this.get('highlight-words');
                    const color = this.get('highlight-color');
                    
                    if (conditionType) {
                        applyHighlighting(tableId, conditionType, words, color);
                    }
                }, 100);
            }
        },

        view: {
            events: {
                'input .table-search': 'handleSearch',
                'click .download-btn': 'handleDownload',
                'click .page-btn': 'handlePagination',
                'change .page-length-select': 'handlePageLengthChange',
                'click .json-table-cell': 'handleCellClick',
                'blur .cell-input': 'handleCellEdit',
                'blur .header-input': 'handleHeaderEdit',
                'keydown .cell-input': 'handleCellKeydown',
                'keydown .header-input': 'handleHeaderKeydown',
            },

            handleSearch(e) {
                const searchTerm = e.target.value.toLowerCase();
                const table = this.el.querySelector('.json-data-table tbody');
                const rows = table.querySelectorAll('tr');

                rows.forEach(row => {
                    const text = row.textContent.toLowerCase();
                    row.style.display = text.includes(searchTerm) ? '' : 'none';
                });
            },

            handleDownload(e) {
                const type = e.target.getAttribute('data-type');
                const table = this.el.querySelector('.json-data-table');

                switch (type) {
                    case 'copy':
                        this.copyTableToClipboard(table);
                        break;
                    case 'csv':
                        this.downloadTableAsCSV(table);
                        break;
                    case 'excel':
                        this.downloadTableAsExcel(table);
                        break;
                    case 'pdf':
                        this.downloadTableAsPDF(table);
                        break;
                    case 'print':
                        window.print();
                        break;
                }
            },

            copyTableToClipboard(table) {
                const range = document.createRange();
                range.selectNode(table);
                window.getSelection().removeAllRanges();
                window.getSelection().addRange(range);
                document.execCommand('copy');
                window.getSelection().removeAllRanges();
                alert('Table copied to clipboard!');
            },

            downloadTableAsCSV(table) {
                let csv = [];
                const rows = table.querySelectorAll('tr');

                for (let i = 0; i < rows.length; i++) {
                    const row = [];
                    const cols = rows[i].querySelectorAll('td, th');

                    for (let j = 0; j < cols.length; j++) {
                        row.push(cols[j].innerText);
                    }
                    csv.push(row.join(','));
                }

                const csvFile = new Blob([csv.join('\n')], { type: 'text/csv' });
                const downloadLink = document.createElement('a');
                downloadLink.download = 'table-data.csv';
                downloadLink.href = window.URL.createObjectURL(csvFile);
                downloadLink.style.display = 'none';
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            },

            downloadTableAsExcel(table) {
                // Basic Excel export (would need a library like SheetJS for full Excel support)
                this.downloadTableAsCSV(table); // Fallback to CSV
            },

            downloadTableAsPDF(table) {
                // Basic PDF export using print functionality
                const printWindow = window.open('', '', 'height=600,width=800');
                printWindow.document.write('<html><head><title>Table Data</title>');
                printWindow.document.write('<style>table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ddd;padding:8px;text-align:left;}th{background-color:#f2f2f2;}</style>');
                printWindow.document.write('</head><body>');
                printWindow.document.write(table.outerHTML);
                printWindow.document.write('</body></html>');
                printWindow.document.close();
                printWindow.print();
            },

            handlePagination(e) {
                // Basic pagination logic (would need more sophisticated implementation)
                const pageType = e.target.getAttribute('data-page');
                console.log('Pagination:', pageType);
            },

            handlePageLengthChange(e) {
                const pageLength = e.target.value;
                console.log('Page length changed to:', pageLength);
            },

            // Modified cell click handler for Style Manager integration
            handleCellClick(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const cell = e.target;
                
                // Stop editing mode for any currently editing cell
                const currentlyEditing = this.el.querySelector('.json-table-cell.editing');
                if (currentlyEditing && currentlyEditing !== cell) {
                    this.stopCellEditing(currentlyEditing);
                }

                // If this cell is already in editing mode, stop editing and select it
                if (cell.classList.contains('editing')) {
                    this.stopCellEditing(cell);
                    
                    // Create a GrapesJS component for this cell to make it selectable
                    const cellComponent = this.createCellComponent(cell);
                    if (cellComponent) {
                        editor.select(cellComponent);
                    }
                    return;
                }

                // Check if cell is already being edited with input
                if (cell.querySelector('.cell-input, .header-input')) return;

                // Start editing mode
                this.startCellEditing(cell);
            },

            startCellEditing(cell) {
                const rowIndex = cell.getAttribute('data-row');
                const columnKey = cell.getAttribute('data-column-key');
                const isHeader = cell.classList.contains('editable-header');

                const currentValue = cell.textContent;
                const input = document.createElement('input');
                input.type = 'text';
                input.value = currentValue;
                input.className = isHeader ? 'header-input' : 'cell-input';
                input.style.cssText = 'width: 100%; border: 2px solid #007bff; padding: 8px; box-sizing: border-box; background: white; font-family: inherit; font-size: inherit;';

                if (isHeader) {
                    input.style.fontWeight = 'bold';
                }

                cell.classList.add('editing');
                cell.innerHTML = '';
                cell.appendChild(input);
                input.focus();
                input.select();
            },

            stopCellEditing(cell) {
                const input = cell.querySelector('.cell-input, .header-input');
                if (!input) return;

                const rowIndex = cell.getAttribute('data-row');
                const columnKey = cell.getAttribute('data-column-key');
                const isHeader = cell.classList.contains('editable-header');
                const newValue = input.value;

                cell.classList.remove('editing');

                // Update model
                if (isHeader) {
                    this.model.updateHeaderData(columnKey, newValue);
                } else {
                    this.model.updateCellData(parseInt(rowIndex), columnKey, newValue);
                }

                // Update cell display
                cell.innerHTML = newValue;
            },

            createCellComponent(cell) {
                try {
                    const rowIndex = cell.getAttribute('data-row');
                    const columnKey = cell.getAttribute('data-column-key');
                    const isHeader = cell.classList.contains('editable-header');
                    const cellId = cell.id;

                    // Create a temporary component for style editing
                    const cellComponent = editor.DomComponents.addComponent({
                        tagName: isHeader ? 'th' : 'td',
                        content: cell.innerHTML,
                        attributes: {
                            id: cellId,
                            'data-row': rowIndex,
                            'data-column-key': columnKey,
                            class: cell.className
                        },
                        style: {
                            padding: '12px',
                            border: '1px solid #dee2e6',
                            'text-align': 'left'
                        },
                        traits: [
                            {
                                type: 'color',
                                name: 'background-color',
                                label: 'Background Color'
                            },
                            {
                                type: 'color',
                                name: 'color',
                                label: 'Text Color'
                            },
                            {
                                type: 'select',
                                name: 'font-weight',
                                label: 'Font Weight',
                                options: [
                                    { value: 'normal', name: 'Normal' },
                                    { value: 'bold', name: 'Bold' }
                                ]
                            },
                            {
                                type: 'select',
                                name: 'text-align',
                                label: 'Text Align',
                                options: [
                                    { value: 'left', name: 'Left' },
                                    { value: 'center', name: 'Center' },
                                    { value: 'right', name: 'Right' }
                                ]
                            }
                        ]
                    });

                    // Listen for style changes and apply them to the actual cell
                    cellComponent.on('change:style', () => {
                        const styles = cellComponent.getStyle();
                        Object.keys(styles).forEach(prop => {
                            cell.style[prop] = styles[prop];
                        });

                        // Store styles in the model
                        if (!isHeader && rowIndex !== null && columnKey) {
                            this.model.setCellStyle(parseInt(rowIndex), columnKey, styles);
                        }
                    });

                    return cellComponent;
                    
                } catch (error) {
                    console.warn('Error creating cell component:', error);
                    return null;
                }
            },

            handleCellEdit(e) {
                const input = e.target;
                const cell = input.parentElement;
                this.stopCellEditing(cell);
            },

            handleHeaderEdit(e) {
                const input = e.target;
                const header = input.parentElement;
                this.stopCellEditing(header);
            },

            handleCellKeydown(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur();
                }
                if (e.key === 'Escape') {
                    const cell = e.target.parentElement;
                    const rowIndex = parseInt(cell.getAttribute('data-row'));
                    const columnKey = cell.getAttribute('data-column-key');
                    const data = this.model.get('custom-data') || this.model.get('table-data') || [];
                    const originalValue = data[rowIndex] ? data[rowIndex][columnKey] || '' : '';

                    cell.classList.remove('editing');
                    cell.innerHTML = originalValue;
                }
            },

            handleHeaderKeydown(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.target.blur();
                }
                if (e.key === 'Escape') {
                    const header = e.target.parentElement;
                    const columnKey = header.getAttribute('data-column-key');
                    const headers = this.model.get('custom-headers') || this.model.get('table-headers') || {};
                    const originalValue = headers[columnKey] || '';

                    header.classList.remove('editing');
                    header.innerHTML = originalValue;
                }
            }
        }
    });

    // Add enhanced table cell component type for style manager integration
    editor.DomComponents.addType('json-table-cell', {
        isComponent: el => el.classList && el.classList.contains('json-table-cell'),
        model: {
            defaults: {
                selectable: true,
                hoverable: true,
                editable: false,
                droppable: false,
                draggable: false,
                removable: false,
                copyable: false,
                resizable: false,
                traits: [
                    {
                        type: 'color',
                        name: 'background-color',
                        label: 'Background Color'
                    },
                    {
                        type: 'color',
                        name: 'color',
                        label: 'Text Color'
                    },
                    {
                        type: 'select',
                        name: 'font-weight',
                        label: 'Font Weight',
                        options: [
                            { value: 'normal', name: 'Normal' },
                            { value: 'bold', name: 'Bold' }
                        ]
                    },
                    {
                        type: 'select',
                        name: 'text-align',
                        label: 'Text Align',
                        options: [
                            { value: 'left', name: 'Left' },
                            { value: 'center', name: 'Center' },
                            { value: 'right', name: 'Right' }
                        ]
                    }
                ],
                'custom-name': 'Table Cell'
            },
            
            init() {
                this.on('change:style', this.handleStyleChange);
            },

            handleStyleChange() {
                const element = this.getEl();
                if (element) {
                    const styles = this.getStyle();
                    Object.keys(styles).forEach(prop => {
                        element.style[prop] = styles[prop];
                    });

                    // Store styles for export
                    const rowIndex = element.getAttribute('data-row');
                    const columnKey = element.getAttribute('data-column-key');
                    const tableContainer = element.closest('.json-table-container');
                    
                    if (tableContainer && rowIndex !== null && columnKey) {
                        const tableComponent = editor.DomComponents.getComponentFromElement(tableContainer);
                        if (tableComponent) {
                            tableComponent.setCellStyle(parseInt(rowIndex), columnKey, styles);
                        }
                    }
                }
            }
        }
    });

    // Enhanced component selection handler
    editor.on('component:selected', function(component) {
        if (component && component.getEl()) {
            const element = component.getEl();
            
            // Handle JSON table cell selection
            if (element.classList.contains('json-table-cell')) {
                if (component.get('type') !== 'json-table-cell') {
                    component.set('type', 'json-table-cell');
                }
            }
        }
    });

    // Add the component to blocks panel
    editor.BlockManager.add('json-table', {
        label: 'JSON Table',
        category: 'Extra',
        content: {
            type: 'json-table'
        },
        media: `<svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 3h18v2H3V3zm0 4h18v2H3V7zm0 4h18v2H3v-2zm0 4h18v2H3v-2zm0 4h18v2H3v-2z"/>
    </svg>`
    });

    // Enhanced export handling for proper content preservation
    editor.on('storage:store', function() {
        try {
            const canvasBody = editor.Canvas.getBody();
            const jsonTables = canvasBody.querySelectorAll('.json-table-container');
            
            jsonTables.forEach(tableContainer => {
                const tableComponent = editor.DomComponents.getComponentFromElement(tableContainer);
                if (tableComponent) {
                    const table = tableContainer.querySelector('.json-data-table');
                    if (table) {
                        // Store current cell contents
                        const cells = table.querySelectorAll('.json-table-cell');
                        cells.forEach(cell => {
                            const rowIndex = cell.getAttribute('data-row');
                            const columnKey = cell.getAttribute('data-column-key');
                            const isHeader = cell.tagName === 'TH';
                            const content = cell.textContent || cell.innerHTML;
                            
                            if (isHeader && columnKey) {
                                tableComponent.set(`header-content-${columnKey}`, content);
                            } else if (rowIndex !== null && columnKey) {
                                tableComponent.set(`cell-content-cell-${rowIndex}-${columnKey}`, content);
                            }
                            
                            // Store cell styles
                            if (cell.style.cssText) {
                                const styleObj = {};
                                const styles = cell.style.cssText.split(';');
                                styles.forEach(style => {
                                    const [prop, value] = style.split(':');
                                    if (prop && value) {
                                        styleObj[prop.trim()] = value.trim();
                                    }
                                });
                                
                                if (rowIndex !== null && columnKey && !isHeader) {
                                    tableComponent.setCellStyle(parseInt(rowIndex), columnKey, styleObj);
                                }
                            }
                        });
                    }
                }
            });
        } catch (error) {
            console.warn('Error storing JSON table data:', error);
        }
    });

    // Override HTML export for proper content preservation
    const originalGetHtml = editor.getHtml;
    editor.getHtml = function() {
        try {
            // Ensure all cell data is stored before export
            const canvasBody = editor.Canvas.getBody();
            const jsonTables = canvasBody.querySelectorAll('.json-table-container');
            
            jsonTables.forEach(tableContainer => {
                const tableComponent = editor.DomComponents.getComponentFromElement(tableContainer);
                if (tableComponent) {
                    const table = tableContainer.querySelector('.json-data-table');
                    if (table) {
                        // Update the component's HTML with current cell contents
                        const cells = table.querySelectorAll('.json-table-cell');
                        cells.forEach(cell => {
                            const rowIndex = cell.getAttribute('data-row');
                            const columnKey = cell.getAttribute('data-column-key');
                            const isHeader = cell.tagName === 'TH';
                            const content = cell.textContent;
                            
                            if (isHeader && columnKey) {
                                tableComponent.updateHeaderData(columnKey, content);
                            } else if (rowIndex !== null && columnKey) {
                                tableComponent.updateCellData(parseInt(rowIndex), columnKey, content);
                            }
                        });
                        
                        // Force table re-render to capture changes
                        tableComponent.updateTableHTML();
                    }
                }
            });

            return originalGetHtml.call(this);
            
        } catch (error) {
            console.warn('Error in JSON table HTML export:', error);
            return originalGetHtml.call(this);
        }
    };

    // Add remaining commands and functions from original code
    editor.Commands.add('open-json-table-suggestion', {
        run: function (editor, sender) {
            openJsonTableSuggestionModal();
        }
    });

    editor.Commands.add('add-table-row', {
        run: function (editor, sender) {
            const selected = editor.getSelected();
            if (selected && selected.get('type') === 'json-table') {
                selected.addRow();
            }
        }
    });

    editor.Commands.add('add-table-column', {
        run: function (editor, sender) {
            const selected = editor.getSelected();
            if (selected && selected.get('type') === 'json-table') {
                selected.addColumn();
            }
        }
    });

    editor.Commands.add('remove-table-row', {
        run: function (editor, sender) {
            const selected = editor.getSelected();
            if (selected && selected.get('type') === 'json-table') {
                selected.removeRow();
            }
        }
    });

    editor.Commands.add('remove-table-column', {
        run: function (editor, sender) {
            const selected = editor.getSelected();
            if (selected && selected.get('type') === 'json-table') {
                selected.removeColumn();
            }
        }
    });

    // Keep remaining helper functions from original code
    function extractMetaDataKeys(obj, prefix = '') {
        let keys = [];
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                let newKey;
                if (Array.isArray(obj)) {
                    newKey = `${prefix}[${key}]`;
                } else {
                    newKey = prefix ? `${prefix}.${key}` : key;
                }
                keys.push(newKey);
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    keys = keys.concat(extractMetaDataKeys(obj[key], newKey));
                }
            }
        }
        return keys;
    }

    function openJsonTableSuggestionModal() {
        try {
            let custom_language = localStorage.getItem('language');
            if (custom_language === null) {
                custom_language = 'english';
            }
            const commonJson = JSON.parse(localStorage.getItem('common_json'));
            if (!commonJson || !commonJson[custom_language]) {
                alert('No JSON data found. Please import a JSON file first.');
                return;
            }

            const metaDataKeys = extractMetaDataKeys(commonJson[custom_language]);

            let modalContent = `
        <div class="new-table-form">
            <div style="padding-bottom:10px">
                <input type="text" id="searchInput" placeholder="Search json paths...">
            </div>
            <div class="suggestion-results" style="height: 300px; overflow: hidden; overflow-y: scroll; border: 1px solid #ddd; border-radius: 4px;">
        `;

            metaDataKeys.forEach(key => {
                modalContent += `<div class="suggestion" data-value="${key}" style="padding: 10px; cursor: pointer; border-bottom: 1px solid #eee; ">${key}</div>`;
            });

            modalContent += `
            </div>
            <div style="margin-top: 15px; padding: 10px; border-radius: 4px;">
                <strong>Note:</strong> Select a JSON path that contains table data with 'heading' and 'data' properties.
            </div>
        </div>`;

            editor.Modal.setTitle('Select JSON Table Data');
            editor.Modal.setContent(modalContent);
            editor.Modal.open();

            document.getElementById("searchInput").addEventListener("input", function () {
                filterTableSuggestions(this.value);
            });

            const suggestionItems = document.querySelectorAll('.suggestion');
            suggestionItems.forEach(item => {
                item.addEventListener('mouseover', function () {
                    this.style.backgroundColor = '#f5f5f5';
                });

                item.addEventListener('mouseout', function () {
                    this.style.backgroundColor = '';
                });

                item.addEventListener('click', function () {
                    const selectedValue = this.getAttribute('data-value');
                    const selectedComponent = editor.getSelected();

                    if (selectedComponent && selectedComponent.get('type') === 'json-table') {
                        selectedComponent.set('json-path', selectedValue);

                        setTimeout(() => {
                            const inputField = document.querySelector('.gjs-trt-trait__wrp-json-path input');
                            if (inputField) {
                                inputField.value = selectedValue;
                            }
                            editor.TraitManager.render();
                        }, 100);
                    }

                    editor.Modal.close();
                });
            });

        } catch (error) {
            console.error('Error opening JSON suggestion modal:', error);
            alert('Error loading JSON data. Please check your JSON file.');
        }
    }

    function filterTableSuggestions(query) {
        const suggestionResults = document.querySelector('.suggestion-results');
        if (!suggestionResults) return;

        const suggestions = suggestionResults.querySelectorAll('.suggestion');
        suggestions.forEach(suggestion => {
            if (suggestion.textContent.toLowerCase().includes(query.toLowerCase())) {
                suggestion.style.display = "block";
            } else {
                suggestion.style.display = "none";
            }
        });
    }

    // Add CSS for better styling
    const tableCSS = `
<style>
.json-table-container {
    min-height: 200px;
    width: 100%;
    margin: 10px 0;
}

.json-table-wrapper {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}

.json-data-table {
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.json-table-cell.editing {
    background-color: #e3f2fd !important;
    outline: 2px solid #007bff !important;
}

.json-table-cell:hover {
    background-color: #f0f8ff !important;
    cursor: pointer;
}

/* Enhanced highlighted cell styles */
td[data-highlighted="true"], th[data-highlighted="true"] {
    position: relative;
    -webkit-print-color-adjust: exact !important;
    color-adjust: exact !important;
    print-color-adjust: exact !important;
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

/style>`;

    // Inject CSS
    if (!document.querySelector('#json-table-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'json-table-styles';
        styleElement.innerHTML = tableCSS;
        document.head.appendChild(styleElement);
    }
}