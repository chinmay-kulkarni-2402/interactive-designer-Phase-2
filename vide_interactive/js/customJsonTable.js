function jsontablecustom(editor) {
    let HotFormulaParser = null;
function loadFormulaParser(callback) {
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/npm/hot-formula-parser/dist/formula-parser.min.js";
    script.onload = function () {
        console.log('HotFormulaParser loaded successfully');
        HotFormulaParser = new formulaParser.Parser();

        // ✅ Attach cell reference handler once
        HotFormulaParser.on('callCellValue', function (cellCoord, done) {
            let cellValue = window.globalCellMap[cellCoord.label];

            if (cellValue === null || cellValue === undefined || cellValue === '') {
                done(0); // treat empty cells as 0 for numeric functions
                return;
            }

            if (typeof cellValue === 'number') {
                done(cellValue); // already numeric
            } else if (!isNaN(cellValue)) {
                done(parseFloat(cellValue)); // numeric string → number
            } else {
                done(String(cellValue)); // keep as text
            }
        });

        // ✅ Add custom formulas
        registerCustomFormulas();

        console.log("parser", HotFormulaParser);
        if (callback) callback();
    };
    script.onerror = function () {
        console.warn('Failed to load HotFormulaParser');
        if (callback) callback();
    };
    document.head.appendChild(script);
}

// ✅ Custom formulas
function registerCustomFormulas() {
    // --- PERCENT(base, percent) ---
    HotFormulaParser.setFunction('PERCENT', function (params) {
        if (params.length !== 2) return '#N/A';
        const base = parseFloat(params[0]);
        const percent = parseFloat(params[1]);
        if (isNaN(base) || isNaN(percent)) return '#VALUE!';
        return base * (percent / 100);
    });

    // --- NUMTOWORDS ---
    const numScript = document.createElement('script');
    numScript.src = "https://cdn.jsdelivr.net/npm/number-to-words/numberToWords.min.js";
    numScript.onload = function () {
        HotFormulaParser.setFunction('NUMTOWORDS', function (params) {
            if (params.length < 1) return '#N/A';

            const raw = params[0];
            const num = parseFloat(raw);
            if (isNaN(num)) return '#VALUE!';

            const mode = (params[1] || "").toString().toLowerCase();
            let words = "";

            if (Number.isInteger(num)) {
                words = numberToWords.toWords(num);
            } else {
                const [intPart, decPart] = raw.toString().split(".");
                const intWords = numberToWords.toWords(parseInt(intPart));
                if (mode === "currency") {
                    const paise = parseInt(decPart.substring(0, 2).padEnd(2, "0"));
                    const paiseWords = paise > 0 ? numberToWords.toWords(paise) + " paise" : "";
                    words = intWords + " rupees" + (paiseWords ? " and " + paiseWords : "");
                } else {
                    const decWords = decPart.split("").map(d => numberToWords.toWords(parseInt(d))).join(" ");
                    words = intWords + " point " + decWords;
                }
            }

            return words;
        });

        console.log("NUMTOWORDS formula registered");
    };
    document.head.appendChild(numScript);
}

// ✅ Formula evaluation
function evaluateFormula(formula, tableData, currentRow, currentCol) {
    try {
        if (!HotFormulaParser) {
            return '#ERROR: Parser not loaded';
        }

        // Build cell map
        window.globalCellMap = {};
        const headers = Object.keys(tableData[0] || {});

        tableData.forEach((row, rowIdx) => {
            headers.forEach((columnKey, colIdx) => {
                const colLetter = indexToColumnLetter(colIdx);
                const cellLabel = colLetter + (rowIdx + 1);
                let value = row[columnKey];
                if (value === null || value === undefined) value = '';
                window.globalCellMap[cellLabel] = value;
            });
        });

        // Evaluate
        const { result, error } = HotFormulaParser.parse(formula);
        if (error) return `#ERROR: ${error}`;
        return result;

    } catch (error) {
        console.error('Formula evaluation error:', error);
        return `#ERROR: ${error.message}`;
    }
}



    // Add highlighting function from custom table
    function applyHighlighting(tableId, conditions, highlightColor) {
        try {
            const canvasBody = editor.Canvas.getBody();
            const table = canvasBody.querySelector(`#${tableId}`);
            if (!table) return;

            const wrapper = editor.DomComponents.getWrapper();

            // Always clear previous highlights
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
                    }
                }
            });

            // Only apply new highlights if conditions exist
            if (conditions && conditions.length > 0) {
                const bodyCells = table.querySelectorAll('tbody td');
                bodyCells.forEach(td => {
                    const div = td.querySelector('div');
                    const val = div ? div.textContent.trim() : td.textContent.trim();

                    // Check if any condition matches
                    const shouldHighlight = conditions.some(condition =>
                        evaluateCondition(val, condition)
                    );

                    if (shouldHighlight) {
                        // Apply all highlight styles
                        const bgColor = highlightColor || '#ffff99';
                        const textColor = conditions[0].textColor || '';
                        const fontFamily = conditions[0].fontFamily || '';

                        td.style.backgroundColor = bgColor;
                        if (textColor) td.style.color = textColor;
                        if (fontFamily) td.style.fontFamily = fontFamily;
                        td.setAttribute('data-highlighted', 'true');

                        const id = td.id;
                        if (id) {
                            const comp = wrapper.find(`#${id}`)[0];
                            if (comp) {
                                const styles = {
                                    'background-color': bgColor,
                                    '-webkit-print-color-adjust': 'exact',
                                    'color-adjust': 'exact',
                                    'print-color-adjust': 'exact'
                                };
                                if (textColor) styles.color = textColor;
                                if (fontFamily) styles['font-family'] = fontFamily;

                                comp.addStyle(styles);
                            }
                        }
                    }
                });
            }

        } catch (err) {
            console.warn('Error applying highlighting:', err);
        }
    }
    function evaluateCondition(cellValue, condition) {
        const value = String(cellValue || '').trim();

        switch (condition.type) {
            case 'contains':
                return condition.caseSensitive ?
                    value.includes(condition.value) :
                    value.toLowerCase().includes(condition.value.toLowerCase());

            case 'starts-with':
                return condition.caseSensitive ?
                    value.startsWith(condition.value) :
                    value.toLowerCase().startsWith(condition.value.toLowerCase());

            case 'ends-with':
                return condition.caseSensitive ?
                    value.endsWith(condition.value) :
                    value.toLowerCase().endsWith(condition.value.toLowerCase());

            case 'exact':
                return condition.caseSensitive ?
                    value === condition.value :
                    value.toLowerCase() === condition.value.toLowerCase();

            case 'once-if':
                const chars = condition.value.split('');
                return chars.some(char => condition.caseSensitive ?
                    value.includes(char) :
                    value.toLowerCase().includes(char.toLowerCase()));

            case '>':
                return parseFloat(value) > parseFloat(condition.value);
            case '>=':
                return parseFloat(value) >= parseFloat(condition.value);
            case '<':
                return parseFloat(value) < parseFloat(condition.value);
            case '<=':
                return parseFloat(value) <= parseFloat(condition.value);
            case '=':
                return parseFloat(value) === parseFloat(condition.value);
            case '!=':
                return parseFloat(value) !== parseFloat(condition.value);
            case 'between':
                const numValue = parseFloat(value);
                return numValue >= parseFloat(condition.minValue) && numValue <= parseFloat(condition.maxValue);
            case 'null':
                return !value || value === '';

            default:
                return false;
        }
    }
    // Helper function to convert column letters to index (A=0, B=1, etc.)
    function columnLetterToIndex(letters) {
        let result = 0;
        for (let i = 0; i < letters.length; i++) {
            result = result * 26 + (letters.charCodeAt(i) - 65 + 1);
        }
        return result - 1;
    }

    // Helper function to convert index to column letters
    function indexToColumnLetter(index) {
        let result = '';
        while (index >= 0) {
            result = String.fromCharCode(65 + (index % 26)) + result;
            index = Math.floor(index / 26) - 1;
        }
        return result;
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
                    {
                        type: 'button',
                        name: 'json-suggestion-btn',
                        label: 'Json Suggestion',
                        text: 'Suggestion',
                        full: true,
                        command: 'open-json-table-suggestion'
                    },
                    {
                        type: 'select',
                        name: 'filter-column',
                        label: 'Filter Column',
                        options: [{ value: "", name: "First enter JSON path" }],
                        changeProp: 1
                    },
                    {
                        type: 'text',
                        name: 'filter-value',
                        label: 'Filter Value',
                        placeholder: 'Enter filter value or "=" for all data',
                        changeProp: 1
                    },
                    // Add highlighting traits from custom table
                    {
                        type: 'button',
                        name: 'manage-highlight-conditions',
                        label: 'Manage Highlight Conditions',
                        text: 'Add/Edit Conditions',
                        full: true,
                        command: 'open-table-condition-manager-json-table'
                    },
                    {
                        type: 'button',
                        name: 'manage-running-totals-btn',
                        label: 'Manage Running Totals',
                        text: 'Configure Running Totals',
                        full: true,
                        command: 'open-running-total-manager'
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
                'highlight-conditions': [],
                'highlight-condition-type': '',
                'highlight-words': '',
                'highlight-color': '#ffff99',
                'highlight-text-color': '',
                'highlight-font-family': '',
                'show-placeholder': true,
                'cell-formulas': {},
                'cell-map': {},
                'formula-parser': null
            },

            init() {
                // Clear any existing formula data to prevent cross-table contamination
                window.globalCellMap = {};
                if (window.globalFormulaParser) {
                    window.globalFormulaParser = null;
                }

                this.on('change:json-path', () => {
                    this.updateTableFromJson();
                    this.updateFilterColumnOptions();
                    this.updateRunningTotalColumnOptions();
                    this.set('filter-column', '');
                    this.set('filter-value', '');
                    this.set('running-total-column', '');
                    this.set('enable-running-total', false);
                });
                this.on('change:selected-running-total-columns', () => {
                    this.updateRunningTotals();
                });

                this.on('change:filter-column change:filter-value', () => {
                    if (this.get('filter-value') && this.get('filter-value').trim() !== '') {
                        this.updateTableHTML();
                    }
                });

                this.on('change:name change:footer change:pagination change:page-length change:search change:caption change:caption-align', this.updateTableHTML);
                this.on('change:highlight-conditions change:highlight-color', this.handleHighlightChange);

                this.set('show-placeholder', true);
                this.updateTableHTML();

            },
            updateFilterColumnOptions() {
                try {
                    const jsonPath = this.get('json-path');
                    if (!jsonPath || jsonPath.trim() === "") {
                        return;
                    }

                    let custom_language = localStorage.getItem('language') || 'english';
                    const jsonDataN = JSON.parse(localStorage.getItem("common_json"));

                    if (!jsonDataN || !jsonDataN[custom_language] || !jsonDataN[custom_language][jsonPath]) {
                        return;
                    }

                    const str = jsonDataN[custom_language][jsonPath];
                    const tableData = eval(str);

                    if (!tableData || !tableData.heading) {
                        return;
                    }

                    const objectKeys = Object.keys(tableData.heading);

                    // Update the filter column trait options
                    const filterTrait = this.getTrait('filter-column');
                    if (filterTrait) {
                        const options = [
                            { value: "", name: "Select Column to Filter" },
                            ...objectKeys.map(key => ({
                                value: key,
                                name: tableData.heading[key]
                            }))
                        ];
                        filterTrait.set('options', options);
                    }
                } catch (error) {
                    console.log('Error updating filter options:', error);
                }
            },
            updateRunningTotalColumnOptions() {
                try {
                    const jsonPath = this.get('json-path');
                    if (!jsonPath || jsonPath.trim() === "") {
                        return;
                    }

                    let custom_language = localStorage.getItem('language') || 'english';
                    const jsonDataN = JSON.parse(localStorage.getItem("common_json"));

                    if (!jsonDataN || !jsonDataN[custom_language] || !jsonDataN[custom_language][jsonPath]) {
                        return;
                    }

                    const str = jsonDataN[custom_language][jsonPath];
                    const tableData = eval(str);

                    if (!tableData || !tableData.heading) {
                        return;
                    }

                    const objectKeys = Object.keys(tableData.heading);

                    // Update the running total column trait options
                    const runningTotalTrait = this.getTrait('running-total-column');
                    if (runningTotalTrait) {
                        const options = [
                            { value: "", name: "Select Column for Running Total" },
                            ...objectKeys.map(key => ({
                                value: key,
                                name: tableData.heading[key]
                            }))
                        ];
                        runningTotalTrait.set('options', options);
                    }
                } catch (error) {
                    console.log('Error updating running total options:', error);
                }
            },
            updateRunningTotals() {
                const selectedColumns = this.get('selected-running-total-columns') || [];

                // Remove all existing running total columns
                this.removeAllRunningTotalColumns();

                // Add running totals for selected columns
                selectedColumns.forEach(column => {
                    this.addSingleRunningTotalColumn(column);
                });

                this.updateTableHTML();
            },

            removeAllRunningTotalColumns() {
                const data = this.get('custom-data') || this.get('table-data') || [];
                const headers = this.get('custom-headers') || this.get('table-headers') || {};

                // Remove running total columns from headers
                const updatedHeaders = {};
                Object.keys(headers).forEach(key => {
                    if (!key.endsWith('_running_total')) {
                        updatedHeaders[key] = headers[key];
                    }
                });

                // Remove running total columns from data
                const updatedData = data.map(row => {
                    const newRow = {};
                    Object.keys(row).forEach(key => {
                        if (!key.endsWith('_running_total')) {
                            newRow[key] = row[key];
                        }
                    });
                    return newRow;
                });

                this.set('custom-headers', updatedHeaders);
                this.set('custom-data', updatedData);
            },

            addSingleRunningTotalColumn(selectedColumn) {
                const data = this.get('custom-data') || this.get('table-data') || [];
                const headers = this.get('custom-headers') || this.get('table-headers') || {};

                // Check if the selected column contains numeric data
                const isNumericColumn = data.every(row => {
                    const value = row[selectedColumn];
                    return value === '' || value === null || value === undefined || !isNaN(parseFloat(value));
                });

                if (!isNumericColumn) {
                    console.warn(`Cannot create running total for column "${headers[selectedColumn]}". Column contains non-numeric data.`);
                    return;
                }

                // Add running total column to headers
                const newColumnKey = `${selectedColumn}_running_total`;
                const newColumnName = `${headers[selectedColumn]} (Running Total)`;

                // Insert running total column right after the original column
                const headerKeys = Object.keys(headers);
                const originalIndex = headerKeys.indexOf(selectedColumn);
                const newHeaders = {};

                headerKeys.forEach((key, index) => {
                    newHeaders[key] = headers[key];
                    if (index === originalIndex) {
                        newHeaders[newColumnKey] = newColumnName;
                    }
                });

                // Calculate running totals and add to data
                let runningTotal = 0;
                const updatedData = data.map(row => {
                    const value = parseFloat(row[selectedColumn]) || 0;
                    runningTotal += value;

                    const newRow = {};
                    Object.keys(newHeaders).forEach(key => {
                        if (key === newColumnKey) {
                            newRow[key] = runningTotal.toFixed(2);
                        } else {
                            newRow[key] = row[key];
                        }
                    });

                    return newRow;
                });

                this.set('custom-headers', newHeaders);
                this.set('custom-data', updatedData);
            },
            addRunningTotalColumn() {
                const selectedColumn = this.get('running-total-column');
                const enableRunningTotal = this.get('enable-running-total');

                if (!selectedColumn || !enableRunningTotal) return;

                const data = this.get('custom-data') || this.get('table-data') || [];
                const headers = this.get('custom-headers') || this.get('table-headers') || {};

                // Check if the selected column contains numeric data
                const isNumericColumn = data.every(row => {
                    const value = row[selectedColumn];
                    return value === '' || value === null || value === undefined || !isNaN(parseFloat(value));
                });

                if (!isNumericColumn) {
                    alert(`Cannot create running total for column "${headers[selectedColumn]}". Column contains non-numeric data.`);
                    this.set('enable-running-total', false);
                    return;
                }

                const runningTotalColumns = this.get('running-total-columns') || [];

                // Check if running total already exists for this column
                if (runningTotalColumns.includes(selectedColumn)) {
                    return; // Already exists
                }

                // Add to running total columns list
                runningTotalColumns.push(selectedColumn);
                this.set('running-total-columns', runningTotalColumns);

                // Add running total column to headers
                const newColumnKey = `${selectedColumn}_running_total`;
                const newColumnName = `${headers[selectedColumn]} (Running Total)`;
                const updatedHeaders = { ...headers };

                // Insert running total column right after the original column
                const headerKeys = Object.keys(headers);
                const originalIndex = headerKeys.indexOf(selectedColumn);
                const newHeaders = {};

                headerKeys.forEach((key, index) => {
                    newHeaders[key] = headers[key];
                    if (index === originalIndex) {
                        newHeaders[newColumnKey] = newColumnName;
                    }
                });

                // Calculate running totals and add to data
                let runningTotal = 0;
                const updatedData = data.map(row => {
                    const value = parseFloat(row[selectedColumn]) || 0;
                    runningTotal += value;

                    const newRow = { ...row };
                    // Insert running total column in the correct position
                    const newRowOrdered = {};
                    Object.keys(newHeaders).forEach(key => {
                        if (key === newColumnKey) {
                            newRowOrdered[key] = runningTotal.toFixed(2);
                        } else {
                            newRowOrdered[key] = newRow[key];
                        }
                    });

                    return newRowOrdered;
                });

                this.set('custom-headers', newHeaders);
                this.set('custom-data', updatedData);
                this.updateTableHTML();
            },
            removeRunningTotalColumns() {
                const runningTotalColumns = this.get('running-total-columns') || [];
                if (runningTotalColumns.length === 0) return;

                const headers = this.get('custom-headers') || this.get('table-headers') || {};
                const data = this.get('custom-data') || this.get('table-data') || [];

                // Remove running total columns from headers
                const updatedHeaders = { ...headers };
                runningTotalColumns.forEach(originalColumn => {
                    const runningTotalKey = `${originalColumn}_running_total`;
                    delete updatedHeaders[runningTotalKey];
                });

                // Remove running total columns from data
                const updatedData = data.map(row => {
                    const newRow = { ...row };
                    runningTotalColumns.forEach(originalColumn => {
                        const runningTotalKey = `${originalColumn}_running_total`;
                        delete newRow[runningTotalKey];
                    });
                    return newRow;
                });

                this.set('custom-headers', updatedHeaders);
                this.set('custom-data', updatedData);
                this.set('running-total-columns', []);
                this.updateTableHTML();
            },

            getHighlightConditions() {
                return this.get('highlight-conditions') || [];
            },

            setHighlightConditions(conditions) {
                this.set('highlight-conditions', conditions);
                this.updateTableHTML();
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

            // Add highlighting change handler
            handleHighlightChange() {
                const tableElement = this.view.el.querySelector('.json-data-table');
                if (!tableElement || !tableElement.id) return;

                const tableId = tableElement.id;
                const conditions = this.getHighlightConditions();
                const color = this.get('highlight-color');

                applyHighlighting(tableId, conditions, color);
                editor.trigger('component:update', this);
            },

            initializeDefaultTable() {
                // Don't set default data, just show placeholder
                this.set('custom-headers', null);
                this.set('custom-data', null);
                this.set('show-placeholder', true);
            },
            initializeFormulaParser() {
                const self = this;
                loadFormulaParser(function () { });

                const cellMap = window.globalCellMap;
                HotFormulaParser.on('callCellValue', function (cellCoord, done) {
                    const label = cellCoord.label;
                    done(cellMap[label] || 0);
                });
                console.log("cell map", cellMap);
                console.log("hotformulaparcer", HotFormulaParser)
                self.set('formula-parser', HotFormulaParser);
                self.set('cell-map', cellMap);

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
                        this.set('custom-headers', tableData.heading);
                        this.set('custom-data', [...tableData.data]);
                        this.set('show-placeholder', false);

                        // Initialize formula parser
                        this.initializeFormulaParser();

                        this.updateTableHTML();
                        this.updateRunningTotalColumnOptions();
                        setTimeout(() => {
                            this.trigger('change:content');
                            this.view.render();
                            this.registerTableCellComponents();
                        }, 50);
                    } else {
                        console.error('Invalid table data structure');
                    }
                } catch (error) {
                    console.error('Error parsing JSON path:', error);
                }
            },

            registerTableCellComponents() {
                const tableElement = this.view.el.querySelector('.json-data-table');
                if (!tableElement) return;

                setTimeout(() => {
                    const wrapper = editor.DomComponents.getWrapper();

                    // Register both th and td elements
                    const allCells = tableElement.querySelectorAll('th, td');
                    allCells.forEach((cell) => {
                        // Ensure proper component attributes
                        cell.setAttribute('data-gjs-type', 'json-table-cell');
                        cell.setAttribute('data-gjs-selectable', 'true');
                        cell.setAttribute('data-gjs-hoverable', 'true');
                        cell.setAttribute('data-gjs-editable', 'false');

                        // Add a unique ID if missing
                        if (!cell.id) {
                            cell.id = `cell-${Math.random().toString(36).substr(2, 9)}`;
                        }

                        // Force component recognition
                        const existingComp = wrapper.find(`#${cell.id}`)[0];
                        // if (!existingComp) {
                        //     // Just register the existing DOM element without adding new component
                        //     const existingComp = wrapper.find(`#${cell.id}`)[0];
                        //     if (!existingComp) {
                        //         // Force component recognition for existing DOM element
                        //         editor.getModelForEl(cell);
                        //     }
                        // }
                    });

                    // Refresh component recognition
                    editor.trigger('component:update');
                }, 200);
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
                const cellFormulas = this.get('cell-formulas') || {};
                const selectedRunningTotalColumns = this.get('selected-running-total-columns') || [];

                if (updatedData[rowIndex]) {
                    const cellId = `cell-${rowIndex}-${columnKey}`;

                    if (typeof newValue === 'string' && newValue.trim().startsWith('=')) {
                        // Store formula
                        const formula = newValue.trim();
                        cellFormulas[cellId] = formula;

                        // Evaluate formula
                        try {
                            const formulaExpression = formula.substring(1); // Remove '='
                            const evaluatedValue = evaluateFormula(formulaExpression, updatedData, rowIndex, columnKey);
                            updatedData[rowIndex][columnKey] = evaluatedValue;
                        } catch (error) {
                            updatedData[rowIndex][columnKey] = '#ERROR';
                        }
                    } else {
                        // Regular value
                        updatedData[rowIndex][columnKey] = newValue;
                        delete cellFormulas[cellId];
                    }

                    this.set('custom-data', updatedData);
                    this.set('cell-formulas', cellFormulas);
                    this.set(`cell-content-${cellId}`, newValue);

                    // Check if this column has a running total and recalculate
                    if (selectedRunningTotalColumns.includes(columnKey)) {
                        this.recalculateRunningTotalsForColumn(columnKey);
                    }

                    this.updateTableHTML();
                }
            },

            recalculateRunningTotalsForColumn(columnKey) {
                const data = this.get('custom-data') || [];
                const runningTotalKey = `${columnKey}_running_total`;

                // Recalculate running total for this column
                let runningTotal = 0;
                const updatedData = data.map(row => {
                    const value = parseFloat(row[columnKey]) || 0;
                    runningTotal += value;

                    return {
                        ...row,
                        [runningTotalKey]: runningTotal.toFixed(2)
                    };
                });

                this.set('custom-data', updatedData);
            },


            recalculateFormulas() {
                const data = this.get('custom-data') || this.get('table-data') || [];
                let hasFormulas = false;

                // Check if any cells have formulas and re-evaluate them
                const updatedData = data.map((row, rowIndex) => {
                    const updatedRow = { ...row };
                    Object.keys(row).forEach(columnKey => {
                        const cellId = `cell-${rowIndex}-${columnKey}`;
                        const formula = this.get(`cell-formula-${cellId}`);

                        if (formula && formula.startsWith('=')) {
                            hasFormulas = true;
                            const evaluatedValue = evaluateFormula(formula.substring(1), data, rowIndex, columnKey);
                            updatedRow[columnKey] = evaluatedValue;
                        }
                    });
                    return updatedRow;
                });

                if (hasFormulas) {
                    this.set('custom-data', updatedData);
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
                const showPlaceholder = this.get('show-placeholder');

                // Generate unique table ID
                const tableId = this.cid ? `json-table-${this.cid}` : `json-table-${Math.random().toString(36).substr(2, 9)}`;

                // --- PLACEHOLDER HANDLING ---
                if ((!headers || !data) && showPlaceholder) {
                    const placeholderHTML = `
        <div class="json-table-placeholder" style="
            width: 100%; 
            min-height: 200px; 
            border: 2px dashed #007bff; 
            border-radius: 8px; 
            display: flex; 
            flex-direction: column; 
            align-items: center; 
            justify-content: center; 
            background-color: #f8f9fa;
            color: #6c757d;
            text-align: center;
            padding: 40px 20px;
            font-family: Arial, sans-serif;
        ">
            <div style="font-size: 48px; margin-bottom: 20px; color: #007bff;">📊</div>
            <h3 style="margin: 0 0 10px 0; color: #495057;">JSON Table Data</h3>
            <p style="margin: 0; font-size: 14px;">Add JSON path from the properties panel to display table data</p>
        </div>`;

                    this.set('content', placeholderHTML);
                    return;
                }

                // Clear placeholder flag when data is available
                if (headers && data) {
                    this.set('show-placeholder', false);
                }

                // --- START TABLE GENERATION ---
                let tableHTML = `<div class="json-table-wrapper" style="width: 100%; overflow-x: auto;">`;

                if (title) {
                    tableHTML += `<h3 style="margin-bottom: 15px;">${title}</h3>`;
                }

                // Controls (Search & File Download)
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
                    // Table Header with div wrappers
                    tableHTML += `<thead style="background-color: #f8f9fa; border: 1px solid #000;"><tr>`;
                    Object.entries(headers).forEach(([key, header]) => {
                        const headerId = `${tableId}-header-${key}`;
                        const storedHeader = this.get(`header-content-${key}`) || header;
                        tableHTML += `<th id="${headerId}" class="editable-header json-table-cell" data-column-key="${key}" data-gjs-type="json-table-cell" data-gjs-selectable="true" data-gjs-hoverable="true" style="padding: 0; text-align: left; border: 1px solid #000000ff; font-weight: bold; cursor: pointer; position: relative;">
                <div class="cell-content" style="padding: 12px; width: 100%; height: 100%; box-sizing: border-box;">${storedHeader}</div>
            </th>`;
                    });
                    tableHTML += `</tr></thead>`;

                    // Table Body with div wrappers and filtering
                    tableHTML += `<tbody>`;
                    if (headers && data) {
                        const filterColumn = this.get('filter-column');
                        const filterValue = this.get('filter-value');

                        let filteredData = data;
                        if (filterColumn && filterColumn !== "" && filterValue && filterValue !== "") {
                            if (filterValue === "=") {
                                filteredData = data;
                            } else {
                                filteredData = data.filter(row => {
                                    const cellValue = String(row[filterColumn] || "").toLowerCase();
                                    const searchValue = String(filterValue).toLowerCase();
                                    return cellValue.includes(searchValue);
                                });
                            }
                        }

                        if (filteredData.length === 0) {
                            const columnCount = Object.keys(headers).length;
                            tableHTML += `<tr><td colspan="${columnCount}" style="text-align: center; padding: 20px; color: #666;">No data found</td></tr>`;
                        } else {
                            filteredData.forEach((row, rowIndex) => {
                                const actualRowIndex = data.indexOf(row); // Get original row index
                                const rowClass = actualRowIndex % 2 === 0 ? 'even-row' : 'odd-row';
                                tableHTML += `<tr class="${rowClass}" style="background-color: ${actualRowIndex % 2 === 0 ? '#ffffff' : '#f8f9fa'};">`;
                                Object.keys(headers).forEach(key => {
                                    const cellId = `${tableId}-cell-${actualRowIndex}-${key}`;
                                    const cellStyles = this.getCellStyle(actualRowIndex, key);
                                    const formulaCellId = `cell-${actualRowIndex}-${key}`;
                                    const cellFormulas = this.get('cell-formulas') || {};
                                    const hasFormula = cellFormulas[formulaCellId];
                                    const cellStyleString = Object.entries(cellStyles).map(([prop, value]) => `${prop}: ${value}`).join('; ');
                                    const formulaClass = hasFormula ? ' formula-cell' : '';

                                    // Use clean border styling with no padding on td, padding on div
                                    const combinedStyle = `padding: 0; border: 1px solid #000; cursor: pointer; position: relative; ${cellStyleString}`;
                                    const storedContent = this.get(`cell-content-${formulaCellId}`) || row[key] || '';
                                    const displayValue = row[key] || ''; // Always show the evaluated value

                                    tableHTML += `<td id="${cellId}" class="editable-cell json-table-cell${formulaClass}" data-row="${actualRowIndex}" data-column-key="${key}" data-gjs-type="json-table-cell" data-gjs-selectable="true" data-gjs-hoverable="true" style="${combinedStyle}" title="${hasFormula ? hasFormula : ''}" data-formula="${hasFormula || ''}">
                            <div class="cell-content" style="padding: 8px; width: 100%; height: 100%; box-sizing: border-box;">${displayValue}</div>
                        </td>`;
                                });
                                tableHTML += `</tr>`;
                            });
                        }
                    }
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
                    // Fallback sample data if no headers/data and placeholder is off
                    tableHTML += `<thead style="background-color: #f8f9fa;"><tr>
            <th style="padding: 0; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: bold;">
                <div class="cell-content" style="padding: 12px;">Sample Header 1</div>
            </th>
            <th style="padding: 0; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: bold;">
                <div class="cell-content" style="padding: 12px;">Sample Header 2</div>
            </th>
            <th style="padding: 0; text-align: left; border-bottom: 2px solid #dee2e6; font-weight: bold;">
                <div class="cell-content" style="padding: 12px;">Sample Header 3</div>
            </th>
        </tr></thead>
        <tbody>
            <tr style="background-color: #ffffff;">
                <td style="padding: 0; border-bottom: 1px solid #dee2e6;">
                    <div class="cell-content" style="padding: 12px;">Sample Data 1</div>
                </td>
                <td style="padding: 0; border-bottom: 1px solid #dee2e6;">
                    <div class="cell-content" style="padding: 12px;">Sample Data 2</div>
                </td>
                <td style="padding: 0; border-bottom: 1px solid #dee2e6;">
                    <div class="cell-content" style="padding: 12px;">Sample Data 3</div>
                </td>
            </tr>
            <tr style="background-color: #f8f9fa;">
                <td style="padding: 0; border-bottom: 1px solid #dee2e6;">
                    <div class="cell-content" style="padding: 12px;">Sample Data 4</div>
                </td>
                <td style="padding: 0; border-bottom: 1px solid #dee2e6;">
                    <div class="cell-content" style="padding: 12px;">Sample Data 5</div>
                </td>
                <td style="padding: 0; border-bottom: 1px solid #dee2e6;">
                    <div class="cell-content" style="padding: 12px;">Sample Data 6</div>
                </td>
            </tr>
        </tbody>`;
                }

                tableHTML += `</table>`;

                // Pagination
                if (pagination === 'yes') {
                    tableHTML += `<div class="table-pagination" style="margin-top: 15px; display: flex; justify-content: space-between; align-items: center;">
            <div>Show <select class="page-length-select" style="padding: 4px;">
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="100">100</option>
            </select> entries</div>
            <div class="pagination-controls">
                <button class="page-btn" data-page="prev" style="padding: 6px 12px; margin: 0 2px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Previous</button>
                <span class="page-info" style="padding: 0 10px;">Page 1 of 1</span>
                <button class="page-btn" data-page="next" style="padding: 6px 12px; margin: 0 2px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Next</button>
            </div>
        </div>`;
                }

                tableHTML += `</div>`;

                // Updated styles with proper print handling

                tableHTML += `<style>
/* Regular styles */
.json-table-container {
    min-height: 200px;
    padding: 10px 0 10px 0;
    width: 100%;
    margin: 10px 0;
}

.json-table-wrapper {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    width: 100%;
    overflow-x: auto;
}

.json-data-table {
    width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
    border: 2px solid #000;
}

.json-data-table th,
.json-data-table td {
    border: 1px solid #000;
    padding: 3px;
    text-align: left;
    background-color: #fff;
    word-wrap: break-word;
    overflow: hidden;
    position: relative;
}

.json-data-table th {
    background-color: #f8f9fa;
    font-weight: bold;
}

.json-table-cell {
    position: relative;
    min-height: 40px; /* Ensure minimum height */
    overflow: hidden;
}

.cell-content {
    width: 100%;
    height: 100%;
    min-height: inherit;
    display: block;
    word-wrap: break-word;
}

.json-table-cell.editing .cell-content {
    background-color: #e3f2fd !important;
    outline: 2px solid #007bff !important;
    min-height: inherit;
    overflow: hidden;
}


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

.running-total-column {
    background-color: #f0f8ff !important;
    font-weight: bold;
    border-left: 3px solid #007bff !important;
}

.running-total-column .cell-content {
    color: #1976d2 !important;
    font-family: 'Courier New', monospace !important;
}
   @media print {
  .json-data-table {
    border: 1px solid #000 !important;
    border-collapse: separate !important;   
    border-spacing: 0 !important;          
    width: 100% !important;
  }

  .json-data-table th,
  .json-data-table td {
    border: 1px solid #000 !important;
    background: #fff !important;
    padding: 4px !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  .json-data-table th,
  .json-data-table td {
    position: relative;
  }

  .json-data-table th::after,
  .json-data-table td::after {
    content: "";
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    border: 1px solid #000 !important;
    pointer-events: none;
  }
    .cell-content{
    padding: 2px !important}
    .running-total-column {
        background-color: #f0f8ff !important;
        border-left: 2px solid #000 !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
    }
}
</style>`;

                this.set('content', tableHTML);

                // Apply highlighting
                setTimeout(() => {
                    const conditions = this.getHighlightConditions();
                    const color = this.get('highlight-color');
                    if (conditions && conditions.length > 0) {
                        applyHighlighting(tableId, conditions, color);
                    }

                    // Register components after table is rendered
                    this.registerTableCellComponents();
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
                'dblclick .json-table-cell': 'preventDoubleClick',
            },
            preventDoubleClick(e) {
                e.preventDefault();
                e.stopPropagation();
                // Just trigger single click behavior instead
                this.handleCellClick(e);
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

                const clickedElement = e.target;
                let cell, cellContent;

                // Determine if we clicked on cell or div content
                if (clickedElement.classList.contains('cell-content')) {
                    cellContent = clickedElement;
                    cell = clickedElement.parentElement;
                } else if (clickedElement.classList.contains('json-table-cell')) {
                    cell = clickedElement;
                    cellContent = cell.querySelector('.cell-content');
                } else {
                    return;
                }

                // If clicked on div content, start editing
                if (clickedElement.classList.contains('cell-content')) {
                    // Stop editing mode for any currently editing cell
                    const currentlyEditing = this.el.querySelector('.json-table-cell.editing');
                    if (currentlyEditing && currentlyEditing !== cell) {
                        this.stopCellEditing(currentlyEditing);
                    }

                    // If this cell is already in editing mode, stop editing
                    if (cell.classList.contains('editing')) {
                        this.stopCellEditing(cell);
                        return;
                    }

                    // Check if cell is already being edited with input
                    if (cell.querySelector('.cell-input, .header-input')) return;

                    // For formula cells, show the original formula for editing
                    const rowIndex = cell.getAttribute('data-row');
                    const columnKey = cell.getAttribute('data-column-key');
                    const isHeader = cell.classList.contains('editable-header');

                    if (!isHeader && rowIndex !== null && columnKey) {
                        const cellId = `cell-${rowIndex}-${columnKey}`;
                        const cellFormulas = this.model.get('cell-formulas') || {};
                        const storedFormula = cellFormulas[cellId];

                        if (storedFormula) {
                            // Start editing with the original formula
                            this.startCellEditingWithValue(cell, cellContent, storedFormula);
                            return;
                        }
                    }

                    // Start normal editing mode
                    this.startCellEditing(cell, cellContent);
                } else if (clickedElement.classList.contains('json-table-cell')) {
                    // If clicked on cell area but not div content, select the cell component
                    const cellComponent = editor.DomComponents.getComponentFromElement(cell);
                    if (cellComponent) {
                        editor.select(cellComponent);
                    }
                }
            },

            // Add this new method
            startCellEditingWithValue(cell, cellContent, value) {
                const rowIndex = cell.getAttribute('data-row');
                const columnKey = cell.getAttribute('data-column-key');
                const isHeader = cell.classList.contains('editable-header');

                const input = document.createElement('input');
                input.type = 'text';
                input.value = value; // Use the provided value (like formula)
                input.className = isHeader ? 'header-input' : 'cell-input';
                input.style.cssText = 'width: 100%; height: 100%; border: 2px solid #007bff; padding: 8px; box-sizing: border-box; background: white; font-family: inherit; font-size: inherit; margin: 0; min-height: inherit; resize: none;';

                if (isHeader) {
                    input.style.fontWeight = 'bold';
                }

                cell.classList.add('editing');
                cellContent.innerHTML = '';
                cellContent.appendChild(input);
                input.focus();
                input.select();
            },

            startCellEditing(cell, cellContent) {
                const rowIndex = cell.getAttribute('data-row');
                const columnKey = cell.getAttribute('data-column-key');
                const isHeader = cell.classList.contains('editable-header');

                const currentValue = cellContent.textContent;
                const input = document.createElement('input');
                input.type = 'text';
                input.value = currentValue;
                input.className = isHeader ? 'header-input' : 'cell-input';
                input.style.cssText = 'width: 100%; height: 100%; border: 2px solid #007bff; padding: 8px; box-sizing: border-box; background: white; font-family: inherit; font-size: inherit; margin: 0; min-height: inherit; resize: none;';

                if (isHeader) {
                    input.style.fontWeight = 'bold';
                }

                cell.classList.add('editing');
                cellContent.innerHTML = '';
                cellContent.appendChild(input);
                input.focus();
                input.select();
            },

            stopCellEditing(cell) {
                const cellContent = cell.querySelector('.cell-content');
                const input = cellContent?.querySelector('.cell-input, .header-input');
                if (!input || !cellContent) return;

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

                    // Handle formula display logic
                    if (newValue.startsWith('=')) {
                        const cellId = `cell-${rowIndex}-${columnKey}`;
                        const cellFormulas = this.model.get('cell-formulas') || {};
                        const evaluatedValue = cellFormulas[cellId] ? this.model.get('custom-data')[rowIndex][columnKey] : newValue;
                        cellContent.innerHTML = evaluatedValue;
                    } else {
                        cellContent.innerHTML = newValue;
                    }
                    return;
                }

                // Update cell display for non-formula cells
                cellContent.innerHTML = newValue;
            },

            // createCellComponent(cell) {
            //     try {
            //         const rowIndex = cell.getAttribute('data-row');
            //         const columnKey = cell.getAttribute('data-column-key');
            //         const isHeader = cell.classList.contains('editable-header');
            //         const cellId = cell.id;

            //         // Create a temporary component for style editing
            //         const cellComponent = editor.DomComponents.addComponent({
            //             tagName: isHeader ? 'th' : 'td',
            //             content: cell.innerHTML,
            //             attributes: {
            //                 id: cellId,
            //                 'data-row': rowIndex,
            //                 'data-column-key': columnKey,
            //                 class: cell.className
            //             },
            //             style: {
            //                 padding: '12px',
            //                 border: '1px solid #dee2e6',
            //                 'text-align': 'left'
            //             },
            //             traits: [
            //                 {
            //                     type: 'color',
            //                     name: 'background-color',
            //                     label: 'Background Color'
            //                 },
            //                 {
            //                     type: 'color',
            //                     name: 'color',
            //                     label: 'Text Color'
            //                 },
            //                 {
            //                     type: 'select',
            //                     name: 'font-weight',
            //                     label: 'Font Weight',
            //                     options: [
            //                         { value: 'normal', name: 'Normal' },
            //                         { value: 'bold', name: 'Bold' }
            //                     ]
            //                 },
            //                 {
            //                     type: 'select',
            //                     name: 'text-align',
            //                     label: 'Text Align',
            //                     options: [
            //                         { value: 'left', name: 'Left' },
            //                         { value: 'center', name: 'Center' },
            //                         { value: 'right', name: 'Right' }
            //                     ]
            //                 }
            //             ]
            //         });

            //         // Listen for style changes and apply them to the actual cell
            //         cellComponent.on('change:style', () => {
            //             const styles = cellComponent.getStyle();
            //             Object.keys(styles).forEach(prop => {
            //                 cell.style[prop] = styles[prop];
            //             });

            //             // Store styles in the model
            //             if (!isHeader && rowIndex !== null && columnKey) {
            //                 this.model.setCellStyle(parseInt(rowIndex), columnKey, styles);
            //             }
            //         });

            //         return cellComponent;

            //     } catch (error) {
            //         console.warn('Error creating cell component:', error);
            //         return null;
            //     }
            // },

            handleCellEdit(e) {
                const input = e.target;
                const cell = input.parentElement;
                const rowIndex = parseInt(cell.getAttribute('data-row'));
                const columnKey = cell.getAttribute('data-column-key');
                const newValue = input.value;

                // Handle formula input
                if (newValue.startsWith('=')) {
                    cell.classList.add('formula-cell');
                    cell.title = newValue; // Show formula in tooltip
                } else {
                    cell.classList.remove('formula-cell', 'formula-error');
                    cell.title = '';
                }

                this.stopCellEditing(cell);

                // Update the model with the new value
                if (rowIndex !== null && columnKey) {
                    this.model.updateCellData(rowIndex, columnKey, newValue);
                }
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
            },
            onRender() {
                // Register components immediately after render
                setTimeout(() => {
                    this.model.registerTableCellComponents();

                    // Force component scanner to run
                    const canvasBody = editor.Canvas.getBody();
                    const cells = this.el.querySelectorAll('.json-table-cell');

                    cells.forEach(cell => {
                        // Try to get the existing component model from the DOM element
                        let comp = editor.getModelForEl(cell);

                        // If it doesn't exist, create a new component
                        if (!comp) {
                            comp = editor.DomComponents.addComponent({
                                type: 'json-table-cell',
                                selectable: true,
                                hoverable: true,
                                // You can pass attributes/content if needed
                            }, { at: undefined, avoidUpdateStyle: true, el: cell });
                        }
                    });


                    // Refresh the canvas
                    editor.refresh();
                }, 100);
            }
        }
    });

    // Add enhanced table cell component type for style manager integration
    // editor.DomComponents.addType('json-table-cell', {
    //     isComponent: el => el.classList && el.classList.contains('json-table-cell'),
    //     model: {
    //         defaults: {
    //             selectable: true,
    //             hoverable: true,
    //             editable: false,
    //             droppable: false,
    //             draggable: false,
    //             removable: false,
    //             copyable: false,
    //             resizable: false,
    //             propagate: [],
    //             void: true,
    //             traits: [
    //                 {
    //                     type: 'color',
    //                     name: 'background-color',
    //                     label: 'Background Color'
    //                 },
    //                 {
    //                     type: 'color',
    //                     name: 'color',
    //                     label: 'Text Color'
    //                 },
    //                 {
    //                     type: 'select',
    //                     name: 'font-weight',
    //                     label: 'Font Weight',
    //                     options: [
    //                         { value: 'normal', name: 'Normal' },
    //                         { value: 'bold', name: 'Bold' }
    //                     ]
    //                 },
    //                 {
    //                     type: 'select',
    //                     name: 'text-align',
    //                     label: 'Text Align',
    //                     options: [
    //                         { value: 'left', name: 'Left' },
    //                         { value: 'center', name: 'Center' },
    //                         { value: 'right', name: 'Right' }
    //                     ]
    //                 }
    //             ],
    //             'custom-name': 'Table Cell'
    //         },

    //         init() {
    //             this.on('change:style', this.handleStyleChange);
    //         },

    //         handleStyleChange() {
    //             const element = this.getEl();
    //             if (element) {
    //                 const styles = this.getStyle();
    //                 Object.keys(styles).forEach(prop => {
    //                     element.style[prop] = styles[prop];
    //                 });

    //                 // Store styles for export
    //                 const rowIndex = element.getAttribute('data-row');
    //                 const columnKey = element.getAttribute('data-column-key');
    //                 const tableContainer = element.closest('.json-table-container');

    //                 if (tableContainer && rowIndex !== null && columnKey) {
    //                     const tableComponent = editor.DomComponents.getComponentFromElement(tableContainer);
    //                     if (tableComponent) {
    //                         tableComponent.setCellStyle(parseInt(rowIndex), columnKey, styles);
    //                     }
    //                 }
    //             }
    //         }
    //     }
    // });

    // Enhanced component selection handler
    // editor.on('component:selected', function (component) {
    //     if (component && component.getEl()) {
    //         const element = component.getEl();

    //         // Handle JSON table cell selection
    //         if (element.classList.contains('json-table-cell')) {
    //             if (component.get('type') !== 'json-table-cell') {
    //                 component.set('type', 'json-table-cell');
    //             }
    //         }
    //     }
    // });

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
    editor.Commands.add('open-table-condition-manager-json-table', {
        run(editor) {
            const selected = editor.getSelected();
            if (!selected || selected.get('type') !== 'json-table') return;

            const conditions = selected.getHighlightConditions();

            const modalContent = `
<div class="condition-manager" style="padding: 0 20px 20px 30px; max-width: 700px;">

    <!-- Highlight Style Settings -->
    <div class="highlight-styles" style=" padding: 10px 15px 15px 0; border-radius: 5px;">
        <h4 style="margin-top: 0;">Highlight Styles</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
            <div>
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Background Color:</label>
                <input type="color" id="highlight-bg-color" value="#ffff99" style="width: 100%; height: 40px; border: none; border-radius: 4px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Text Color:</label>
                <input type="color" id="highlight-text-color" value="#000000" style="width: 100%; height: 40px; border: none; border-radius: 4px;">
            </div>
            <div>
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Font Family:</label>
            <select id="highlight-font-family" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                <option value="">Default</option>
                <option value="Verdana, sans-serif">Verdana</option>
                <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                <option value="'Times New Roman', serif">Times New Roman</option>
                <option value="Tahoma, sans-serif">Tahoma</option>
                <option value="'Lucida Sans Unicode', sans-serif">Lucida Sans Unicode</option>
                <option value="Impact, sans-serif">Impact</option>
                <option value="Helvetica, sans-serif">Helvetica</option>
                <option value="Georgia, serif">Georgia</option>
                <option value="'Courier New', monospace">Courier New</option>
                <option value="'Comic Sans MS', cursive">Comic Sans MS</option>
                <option value="'Brush Script MT', cursive">Brush Script MT</option>
                <option value="'Arial Black', sans-serif">Arial Black</option>
                <option value="Arial, sans-serif">Arial</option>
            </select>
            </div>
        </div>
    </div>
    
    <div class="add-condition-form">
        <h4 style="margin-top: 10px;  margin-bottom: 20px;">Add New Condition</h4>
        
        <div style="display: grid; grid-template-columns: 1fr auto; gap: 15px; margin-bottom: 15px;">
            <div>
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Condition Type:</label>
                <select id="condition-type" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="">Select Condition Type</option>
                    <option value="contains">Text: Contains</option>
                    <option value="starts-with">Text: Starts With</option>
                    <option value="ends-with">Text: Ends With</option>
                    <option value="exact">Text: Exact Match</option>
                    <option value="once-if">Once If: Highlight individual letters/numbers</option>
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
      <div style="display: flex; align-items: center; margin-top:27px;">
        <label style="display: flex; align-items: center; color: #f8f9fa; cursor: pointer;">
          <input type="checkbox" id="case-sensitive" style="margin-right: 8px; transform: scale(1.2);">
          <span style="font-weight: bold;">Case Sensitive</span>
        </label>
      </div>
        </div>
        
        <div id="condition-inputs">
            <div id="single-value-input" style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Value:</label>
                <input type="text" id="condition-value" style="width: 97%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;" placeholder="Enter text or number">
            </div>
            
            <div id="range-inputs" style="display: none; margin-bottom: 15px;">
                <div style="display: flex; gap: 10px;">
                    <div style="flex: 1;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Min Value:</label>
                        <input type="number" id="min-value" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                    <div style="flex: 1;">
                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">Max Value:</label>
                        <input type="number" id="max-value" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>
                </div>
            </div>
        </div>
        
        <button id="add-condition-btn" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-bottom: 3px">Add Condition</button>
    </div>
    
    <div class="existing-conditions" style=" padding: 20px 20px 20px 0; border-radius: 8px; margin-bottom: 3px;">
        <div style="margin-top: 5px; font-weight: bold">Existing Conditions</div>
        <div id="conditions-list" style="max-height: 300px; overflow-y: auto;">
            ${conditions.length === 0 ? '<p style="color: #666;">No conditions added yet.</p>' : ''}
        </div>
    </div>
    
    <div style="text-align: right;">
        <button id="close-manager-btn" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-right: 10px;">Close</button>
        <button id="apply-conditions-btn" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Apply Changes</button>
    </div>
</div>`;

            const modal = editor.Modal;
            modal.setTitle('Table Highlight Condition Manager');
            modal.setContent(modalContent);
            modal.open();

            setTimeout(() => {
                initializeTableConditionManager(selected, conditions);
            }, 100);
        }
    });
    editor.Commands.add('open-running-total-manager', {
        run(editor) {
            const selected = editor.getSelected();
            if (!selected || selected.get('type') !== 'json-table') return;

            const headers = selected.get('custom-headers') || selected.get('table-headers') || {};
            const data = selected.get('custom-data') || selected.get('table-data') || [];
            const selectedColumns = selected.get('selected-running-total-columns') || [];

            // Filter headers to only show columns that have at least some numeric data
            const numericHeaders = {};
            Object.entries(headers).forEach(([key, name]) => {
                // Check if column has at least some numeric values (not all empty/null/text)
                const hasNumericData = data.some(row => {
                    const value = row[key];
                    return value !== '' && value !== null && value !== undefined && !isNaN(parseFloat(value));
                });

                if (hasNumericData) {
                    numericHeaders[key] = name;
                }
            });

            // Check if there are any columns with numeric data
            if (Object.keys(numericHeaders).length === 0) {
                alert('No columns with numeric data available for running totals.');
                return;
            }

            const modalContent = `
<div class="running-total-manager" style="padding: 20px; max-width: 500px;">
    <h3 style="margin-top: 0; margin-bottom: 20px;">Configure Running Total Columns</h3>
    <p style="color: #666; font-size: 14px; margin-bottom: 15px;">Only columns containing numeric data are shown below:</p>
    
    <div class="column-checkboxes" style="max-height: 300px; overflow-y: auto; border: 1px solid #ddd; padding: 15px; border-radius: 5px;">
        ${Object.entries(numericHeaders).map(([key, name]) => `
            <div style="margin-bottom: 10px;">
                <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="checkbox" value="${key}" ${selectedColumns.includes(key) ? 'checked' : ''} 
                           style="margin-right: 10px; width: 16px; height: 16px;">
                    <span>${name}</span>
                </label>
            </div>
        `).join('')}
    </div>
    
    <div style="text-align: right; margin-top: 20px;">
        <button id="cancel-running-totals" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-right: 10px;">Cancel</button>
        <button id="apply-running-totals" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">Apply</button>
    </div>
</div>`;

            const modal = editor.Modal;
            modal.setTitle('Running Total Configuration');
            modal.setContent(modalContent);
            modal.open();

            setTimeout(() => {
                document.getElementById('cancel-running-totals').addEventListener('click', () => {
                    editor.Modal.close();
                });

                document.getElementById('apply-running-totals').addEventListener('click', () => {
                    const checkboxes = document.querySelectorAll('.column-checkboxes input[type="checkbox"]:checked');
                    const selectedColumns = Array.from(checkboxes).map(cb => cb.value);

                    selected.set('selected-running-total-columns', selectedColumns);
                    editor.Modal.close();
                });
            }, 100);
        }
    });
    function initializeTableConditionManager(component, conditions) {
        const conditionTypeSelect = document.getElementById('condition-type');
        const conditionValueInput = document.getElementById('condition-value');
        const caseSensitiveCheckbox = document.getElementById('case-sensitive');
        const singleValueInput = document.getElementById('single-value-input');
        const rangeInputs = document.getElementById('range-inputs');
        const minValueInput = document.getElementById('min-value');
        const maxValueInput = document.getElementById('max-value');
        const addConditionBtn = document.getElementById('add-condition-btn');
        const conditionsList = document.getElementById('conditions-list');
        const closeBtn = document.getElementById('close-manager-btn');
        const applyBtn = document.getElementById('apply-conditions-btn');

        // Style controls
        const bgColorInput = document.getElementById('highlight-bg-color');
        const textColorInput = document.getElementById('highlight-text-color');
        const fontFamilySelect = document.getElementById('highlight-font-family');

        // Load current values
        bgColorInput.value = component.get('highlight-color') || '#ffff99';
        textColorInput.value = component.get('highlight-text-color') || '#000000';
        fontFamilySelect.value = component.get('highlight-font-family') || '';

        // Handle condition type change
        conditionTypeSelect.addEventListener('change', function () {
            const selectedType = this.value;
            const isTextCondition = ['contains', 'starts-with', 'ends-with', 'exact', 'once-if'].includes(selectedType);

            caseSensitiveCheckbox.style.display = isTextCondition ? 'block' : 'none';
            caseSensitiveCheckbox.parentElement.style.display = isTextCondition ? 'block' : 'none';

            if (selectedType === 'between') {
                singleValueInput.style.display = 'none';
                rangeInputs.style.display = 'block';
            } else if (selectedType === 'null') {
                singleValueInput.style.display = 'none';
                rangeInputs.style.display = 'none';
            } else {
                singleValueInput.style.display = 'block';
                rangeInputs.style.display = 'none';
            }
        });

        // Add condition
        addConditionBtn.addEventListener('click', function () {
            const type = conditionTypeSelect.value;
            if (!type) {
                alert('Please select a condition type');
                return;
            }

            let condition = {
                type,
                caseSensitive: caseSensitiveCheckbox.checked,
                textColor: textColorInput.value,
                fontFamily: fontFamilySelect.value
            };

            if (type === 'between') {
                const minVal = minValueInput.value;
                const maxVal = maxValueInput.value;
                if (!minVal || !maxVal) {
                    alert('Please enter both min and max values');
                    return;
                }
                condition.minValue = minVal;
                condition.maxValue = maxVal;
            } else if (type !== 'null') {
                const value = conditionValueInput.value;
                if (!value) {
                    alert('Please enter a value');
                    return;
                }
                condition.value = value;
            }

            component.addHighlightCondition(condition);
            component.set('highlight-color', bgColorInput.value);
            component.set('highlight-text-color', textColorInput.value);
            component.set('highlight-font-family', fontFamilySelect.value);
            refreshConditionsList(component);

            // Reset form
            conditionTypeSelect.value = '';
            conditionValueInput.value = '';
            minValueInput.value = '';
            maxValueInput.value = '';
            caseSensitiveCheckbox.checked = false;
            singleValueInput.style.display = 'block';
            rangeInputs.style.display = 'none';
            caseSensitiveCheckbox.parentElement.style.display = 'none';
        });

        // Close modal
        closeBtn.addEventListener('click', function () {
            editor.Modal.close();
        });

        // Apply changes and close
        applyBtn.addEventListener('click', function () {
            component.set('highlight-color', bgColorInput.value);
            component.set('highlight-text-color', textColorInput.value);
            component.set('highlight-font-family', fontFamilySelect.value);
            component.handleHighlightChange();
            editor.Modal.close();
        });

        // Refresh conditions list
        function refreshConditionsList(component) {
            const conditions = component.getHighlightConditions();

            if (conditions.length === 0) {
                conditionsList.innerHTML = '<p style="color: #666;">No conditions added yet.</p>';
                return;
            }

            let html = '';
            conditions.forEach((condition, index) => {
                let conditionText = '';
                const caseSensitive = condition.caseSensitive ? ' (Case Sensitive)' : '';

                if (condition.type === 'between') {
                    conditionText = `Between ${condition.minValue} and ${condition.maxValue}`;
                } else if (condition.type === 'null') {
                    conditionText = 'Null/Empty cells';
                } else {
                    conditionText = `${condition.type}: ${condition.value}${caseSensitive}`;
                }

                html += `
        <div style="border: 1px solid #ddd; border-radius: 4px; padding: 10px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
            <span>${conditionText}</span>
            <button onclick="removeCondition(${index})" style="background: #dc3545; color: white; border: none; padding: 4px 8px; border-radius: 3px; cursor: pointer; font-size: 12px;">Remove</button>
        </div>`;
            });

            conditionsList.innerHTML = html;
        }

        // Global function for removing conditions
        window.removeCondition = function (index) {
            component.removeHighlightCondition(index);
            refreshConditionsList(component);
        };

        // Initial load
        refreshConditionsList(component);
    }
    // Override HTML export for proper content preservation
    // const originalGetHtml = editor.getHtml;
    // editor.getHtml = function () {
    //     try {
    //         // Ensure all cell data is stored before export
    //         const canvasBody = editor.Canvas.getBody();
    //         const jsonTables = canvasBody.querySelectorAll('.json-table-container');

    //         jsonTables.forEach(tableContainer => {
    //             const tableComponent =editor.getModelByEl(tableContainer);

    //             if (tableComponent) {
    //                 const table = tableContainer.querySelector('.json-data-table');
    //                 if (table) {
    //                     // Update the component's HTML with current cell contents
    //                     const cells = table.querySelectorAll('.json-table-cell');
    //                     cells.forEach(cell => {
    //                         const rowIndex = cell.getAttribute('data-row');
    //                         const columnKey = cell.getAttribute('data-column-key');
    //                         const isHeader = cell.tagName === 'TH';
    //                         const content = cell.textContent;

    //                         if (isHeader && columnKey) {
    //                             tableComponent.updateHeaderData(columnKey, content);
    //                         } else if (rowIndex !== null && columnKey) {
    //                             tableComponent.updateCellData(parseInt(rowIndex), columnKey, content);
    //                         }
    //                     });

    //                     // Force table re-render to capture changes
    //                     tableComponent.updateTableHTML();
    //                 }
    //             }
    //         });

    //         return originalGetHtml.call(this);

    //     } catch (error) {
    //         console.warn('Error in JSON table HTML export:', error);
    //         return originalGetHtml.call(this);
    //     }
    // };

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


    // Add CSS for better styling
    const tableCSS = `
<style>
.json-table-container {
    min-height: 200px;
    padding: 10px;
    width: 100%;
    margin: 10px 0;
}

.json-table-wrapper {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    width: 100%;
    overflow-x: auto;
}

.json-data-table {
    width: 100%;
    table-layout: auto;
    border-collapse: collapse;
    border: 2px solid #000;
}

.json-data-table th,
.json-data-table td {
    border: 1px solid #000;
    padding: 8px;
    text-align: left;
    background-color: #fff;
}

.json-data-table th {
    background-color: #f8f9fa;
    font-weight: bold;
}

.json-table-cell.editing {
    background-color: #e3f2fd !important;
    outline: 2px solid #007bff !important;
}

/* Formula cell styles */
.formula-cell {
    font-family: 'Courier New', monospace !important;
    font-weight: bold;
    background-color: #f0f8ff !important;
}

.formula-cell::before {
    content: "f(x)";
    position: absolute;
    top: 1px;
    left: 2px;
    font-size: 8px;
    color: #1976d2;
    font-weight: bold;
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

/* Print-specific styles */

    </style>`;

    // Inject CSS
    if (!document.querySelector('#json-table-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'json-table-styles';
        styleElement.innerHTML = tableCSS;
        document.head.appendChild(styleElement);
    }

}