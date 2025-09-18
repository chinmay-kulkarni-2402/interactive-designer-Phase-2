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
    function getJsonFileOptions() {
        const storedFileNames = localStorage.getItem('common_json_files');
        const options = [{ id: '0', name: 'Select File' }];

        if (storedFileNames) {
            const fileNames = storedFileNames.split(',').map(f => f.trim()).filter(f => f);
            fileNames.forEach((fileName, index) => {
                options.push({ id: (index + 1).toString(), name: fileName });
            });
        }
        return options;
    }

    editor.DomComponents.addType('json-table', {
        model: {
            defaults: {
                tagName: 'div',
                selectable: true,
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
                        placeholder: 'Enter Json Path',
                        changeProp: 1
                    },
                    {
                        type: 'select',
                        name: 'json-file-index',
                        label: 'JSON File',
                        options: getJsonFileOptions(),
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
                        name: 'reorder-columns-btn',
                        label: 'Reorder Columns',
                        text: 'Manage Column Order',
                        full: true,
                        command: 'open-column-reorder-manager'
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

                this.on('change:json-file-index', () => {
                    this.set('json-path', '');
                    this.set('filter-column', '');
                    this.set('filter-value', '');
                    this.set('running-total-column', '');
                    this.set('enable-running-total', false);
                    // Clear loaded data
                    this.set('custom-headers', null);
                    this.set('custom-data', null);
                    this.set('table-headers', null);
                    this.set('table-data', null);
                    this.set('show-placeholder', true);
                    this.updateTableHTML();

                    // Update trait options after file change
                    setTimeout(() => {
                        this.updateFilterColumnOptions();
                    }, 100);
                });

                this.on('change:json-path', () => {
                    this.updateTableFromJson();
                    this.set('filter-column', '');
                    this.set('filter-value', '');
                    this.set('running-total-column', '');
                    this.set('enable-running-total', false);
                    // Clear any existing loaded data
                    this.set('custom-headers', null);
                    this.set('custom-data', null);

                    // Update trait display after path change
                    setTimeout(() => {
                        const jsonPathTrait = this.getTrait('json-path');
                        if (jsonPathTrait) {
                            const currentPath = this.get('json-path');
                            jsonPathTrait.set('value', currentPath);
                            // Trigger view update
                            if (jsonPathTrait.view && jsonPathTrait.view.render) {
                                jsonPathTrait.view.render();
                            }
                        }
                    }, 100);
                });

                this.on('change:selected-running-total-columns', () => {
                    this.updateRunningTotals();
                });

                // MODIFIED: Only load data when both filter column and value are set
                this.on('change:filter-column', () => {
                    const filterColumn = this.get('filter-column');
                    const filterValue = this.get('filter-value');

                    // Handle "none" option - load all data immediately
                    if (filterColumn === "none") {
                        this.loadFilteredData();
                        return;
                    }

                    // For regular columns, check if both column and value are set
                    if (filterColumn && filterValue && filterValue.trim() !== '') {
                        this.loadFilteredData();
                    } else if (!filterColumn) {
                        // If filter column is cleared, show placeholder again
                        this.set('custom-headers', null);
                        this.set('custom-data', null);
                        this.set('show-placeholder', true);
                        this.updateTableHTML();
                    }
                });

                this.on('change:filter-value', () => {
                    const filterColumn = this.get('filter-column');
                    const filterValue = this.get('filter-value');

                    // Skip if "none" is selected (no filter value needed)
                    if (filterColumn === "none") {
                        return;
                    }

                    if (filterColumn && filterValue && filterValue.trim() !== '') {
                        this.loadFilteredData();
                    } else if (!filterValue || filterValue.trim() === '') {
                        // If filter value is cleared, show placeholder again
                        this.set('custom-headers', null);
                        this.set('custom-data', null);
                        this.set('show-placeholder', true);
                        this.updateTableHTML();
                    }
                });

                this.on('change:name change:footer change:pagination change:page-length change:search change:caption change:caption-align', this.updateTableHTML);
                this.on('change:highlight-conditions change:highlight-color', this.handleHighlightChange);

                this.set('show-placeholder', true);
                this.updateTableHTML();
            },

safeInitializeFormulaParser() {
    try {
        if (typeof loadFormulaParser === 'function') {
            this.initializeFormulaParser();
        }
    } catch (error) {
        console.warn('Could not initialize formula parser:', error);
    }
},
            loadFilteredData() {
                const filterColumn = this.get('filter-column');
                const filterValue = this.get('filter-value');
                const originalHeaders = this.get('table-headers');
                const originalData = this.get('table-data');

                if (!originalHeaders || !originalData) {
                    console.warn('Cannot load data: missing table data');
                    return;
                }

                // Handle "none" option - load all data without filtering
                if (filterColumn === "none") {
                    const allData = [...originalData];

                    this.set('custom-headers', { ...originalHeaders });
                    this.set('custom-data', allData);
                    this.set('show-placeholder', false);

                    // Clear filter value when none is selected
                    this.set('filter-value', '');
                    const filterValueTrait = this.getTrait('filter-value');
                    if (filterValueTrait) {
                        filterValueTrait.set('value', '');
                    }

                    // Initialize formula parser safely
                    this.safeInitializeFormulaParser();

                    this.updateTableHTML();
                    console.log(`Loaded all ${allData.length} rows without filtering`);
                    return;
                }

                // Regular filtering logic
                if (!filterColumn || !filterValue || filterColumn === '') {
                    console.warn('Cannot load data: missing filter criteria');
                    return;
                }

                let filteredData;

                // If filter value is "=", load complete data
                if (filterValue === "=") {
                    filteredData = [...originalData];
                } else {
                    // Apply filtering
                    filteredData = originalData.filter(row => {
                        const cellValue = String(row[filterColumn] || "").toLowerCase();
                        const searchValue = String(filterValue).toLowerCase();
                        return cellValue.includes(searchValue);
                    });
                }

                // Set the filtered data as custom data
                this.set('custom-headers', { ...originalHeaders });
                this.set('custom-data', filteredData);
                this.set('show-placeholder', false);

                // Preserve filter values in the traits
                const filterColumnTrait = this.getTrait('filter-column');
                const filterValueTrait = this.getTrait('filter-value');

                if (filterColumnTrait) {
                    filterColumnTrait.set('value', filterColumn);
                }
                if (filterValueTrait) {
                    filterValueTrait.set('value', filterValue);
                }

                // Initialize formula parser safely
                this.safeInitializeFormulaParser();

                this.updateTableHTML();

                console.log(`Loaded ${filteredData.length} rows based on filter: ${filterColumn} contains "${filterValue}"`);

                // Show success message
                if (filteredData.length === 0) {
                    alert('No data matches the filter criteria');
                } else {
                    console.log(`Successfully loaded ${filteredData.length} filtered rows`);
                }
            },
            reorderColumns(newColumnOrder) {
                const headers = this.get('custom-headers') || this.get('table-headers') || {};
                const data = this.get('custom-data') || this.get('table-data') || [];

                // Create new ordered headers
                const reorderedHeaders = {};
                newColumnOrder.forEach(columnKey => {
                    if (headers[columnKey]) {
                        reorderedHeaders[columnKey] = headers[columnKey];
                    }
                });

                // Create new ordered data
                const reorderedData = data.map(row => {
                    const newRow = {};
                    newColumnOrder.forEach(columnKey => {
                        if (row.hasOwnProperty(columnKey)) {
                            newRow[columnKey] = row[columnKey];
                        }
                    });
                    return newRow;
                });

                // Update the component
                this.set('custom-headers', reorderedHeaders);
                this.set('custom-data', reorderedData);
                this.updateTableHTML();
            },
            updateFilterColumnOptions() {
                try {
                    const jsonPath = this.get('json-path');
                    const fileIndex = this.get('json-file-index') || '0';
                    if (!jsonPath || jsonPath.trim() === "") {
                        // Reset filter options when no path
                        const filterTrait = this.getTrait('filter-column');
                        if (filterTrait) {
                            const options = [{ value: "", name: "First enter JSON path" }];
                            filterTrait.set('options', options);
                        }
                        return;
                    }

                    // Parse jsonPath to extract language and subpath
                    const pathParts = jsonPath.split('.');
                    let selectedLanguage = localStorage.getItem('language') || 'english';
                    let subPath = jsonPath;
                    if (pathParts.length > 1) {
                        selectedLanguage = pathParts[0];
                        subPath = pathParts.slice(1).join('.');
                    }

                    let jsonDataN;
                    if (fileIndex !== '0') {
                        const fileNames = (localStorage.getItem('common_json_files') || "").split(',').map(f => f.trim());
                        const selectedFile = fileNames[parseInt(fileIndex) - 1];
                        const jsonString = localStorage.getItem(`common_json_${selectedFile}`);
                        if (jsonString) {
                            const fileJson = JSON.parse(jsonString);
                            jsonDataN = fileJson[selectedLanguage];
                        }
                    } else {
                        const commonJson = JSON.parse(localStorage.getItem("common_json"));
                        jsonDataN = commonJson[selectedLanguage];
                    }

                    if (!jsonDataN || !jsonDataN[subPath]) {
                        const filterTrait = this.getTrait('filter-column');
                        if (filterTrait) {
                            const options = [{ value: "", name: "Invalid JSON path" }];
                            filterTrait.set('options', options);
                        }
                        return;
                    }

                    const str = jsonDataN[subPath];
                    let tableData;
                    if (typeof str === 'string') {
                        tableData = eval(str);
                    } else {
                        tableData = str;
                    }

                    if (!tableData || !tableData.heading) {
                        const filterTrait = this.getTrait('filter-column');
                        if (filterTrait) {
                            const options = [{ value: "", name: "Invalid table structure" }];
                            filterTrait.set('options', options);
                        }
                        return;
                    }

                    const objectKeys = Object.keys(tableData.heading);

                    // Update the filter column trait options with "none" option
                    const filterTrait = this.getTrait('filter-column');
                    if (filterTrait) {
                        const currentValue = this.get('filter-column'); // Preserve current selection
                        const options = [
                            { value: "", name: "Select Column to Filter & Load Data" },
                            { value: "none", name: "None (Load All Data)" },
                            ...objectKeys.map(key => ({
                                value: key,
                                name: tableData.heading[key]
                            }))
                        ];
                        filterTrait.set('options', options);

                        // Preserve the current selection if it exists
                        if (currentValue && currentValue !== '') {
                            filterTrait.set('value', currentValue);
                        }
                    }

                    console.log('Filter column options updated:', objectKeys.length, 'columns available');

                } catch (error) {
                    console.log('Error updating filter options:', error);
                    const filterTrait = this.getTrait('filter-column');
                    if (filterTrait) {
                        const options = [{ value: "", name: "Error loading columns" }];
                        filterTrait.set('options', options);
                    }
                }
            },
            updateRunningTotalColumnOptions() {
                try {
                    const jsonPath = this.get('json-path');
                    const fileIndex = this.get('json-file-index') || '0';
                    if (!jsonPath || jsonPath.trim() === "") {
                        return;
                    }

                    let jsonDataN;
                    let custom_language = localStorage.getItem('language') || 'english';

                    if (fileIndex !== '0') {
                        const fileNames = (localStorage.getItem('common_json_files') || "").split(',').map(f => f.trim());
                        const selectedFile = fileNames[parseInt(fileIndex) - 1];
                        const jsonString = localStorage.getItem(`common_json_${selectedFile}`);
                        if (jsonString) {
                            const fileJson = JSON.parse(jsonString);
                            jsonDataN = fileJson[custom_language];
                        }
                    } else {
                        const commonJson = JSON.parse(localStorage.getItem("common_json"));
                        jsonDataN = commonJson[custom_language];
                    }

                    if (!jsonDataN || !jsonDataN[jsonPath]) {
                        return;
                    }

                    const str = jsonDataN[jsonPath];
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

                // Check if formula parser is already loaded
                if (!window.HotFormulaParser) {
                    loadFormulaParser(function () {
                        if (window.HotFormulaParser) {
                            self.setupFormulaParser();
                        }
                    });
                } else {
                    this.setupFormulaParser();
                }
            },

            setupFormulaParser() {
                const cellMap = window.globalCellMap || {};

                // Only set up if HotFormulaParser exists
                if (window.HotFormulaParser) {
                    window.HotFormulaParser.on('callCellValue', function (cellCoord, done) {
                        const label = cellCoord.label;
                        done(cellMap[label] || 0);
                    });

                    console.log("cell map", cellMap);
                    console.log("hotformulaparcer", window.HotFormulaParser);

                    this.set('formula-parser', window.HotFormulaParser);
                    this.set('cell-map', cellMap);
                }
            },

            updateTableFromJson() {
                const jsonPath = this.get('json-path');
                const fileIndex = this.get('json-file-index') || '0';
                if (!jsonPath) {
                    console.warn('No JSON path provided');
                    this.set('show-placeholder', true);
                    this.updateTableHTML();
                    return;
                }

                try {
                    // Parse jsonPath to extract language and subpath
                    const pathParts = jsonPath.split('.');
                    let selectedLanguage = localStorage.getItem('language') || 'english';
                    let subPath = jsonPath;
                    if (pathParts.length > 1) {
                        selectedLanguage = pathParts[0];
                        subPath = pathParts.slice(1).join('.');
                    }

                    let jsonDataN;
                    if (fileIndex !== '0') {
                        const fileNames = (localStorage.getItem('common_json_files') || "").split(',').map(f => f.trim());
                        if (!fileNames.length || parseInt(fileIndex) > fileNames.length) {
                            console.error('Invalid file index or no files available:', fileIndex, fileNames);
                            this.set('show-placeholder', true);
                            this.updateTableHTML();
                            return;
                        }
                        const selectedFile = fileNames[parseInt(fileIndex) - 1];
                        const jsonString = localStorage.getItem(`common_json_${selectedFile}`);
                        if (!jsonString) {
                            console.error(`JSON file not found: common_json_${selectedFile}`);
                            this.set('show-placeholder', true);
                            this.updateTableHTML();
                            return;
                        }
                        const fileJson = JSON.parse(jsonString);
                        jsonDataN = fileJson[selectedLanguage];
                        if (!jsonDataN) {
                            console.error(`Language "${selectedLanguage}" not found in JSON file: ${selectedFile}`);
                            this.set('show-placeholder', true);
                            this.updateTableHTML();
                            return;
                        }
                    } else {
                        const commonJsonString = localStorage.getItem('common_json');
                        if (!commonJsonString) {
                            console.error('Common JSON not found in localStorage');
                            this.set('show-placeholder', true);
                            this.updateTableHTML();
                            return;
                        }
                        const commonJson = JSON.parse(commonJsonString);
                        jsonDataN = commonJson[selectedLanguage];
                        if (!jsonDataN) {
                            console.error(`Language "${selectedLanguage}" not found in common JSON`);
                            this.set('show-placeholder', true);
                            this.updateTableHTML();
                            return;
                        }
                    }

                    if (!jsonDataN[subPath]) {
                        console.error(`JSON subpath "${subPath}" not found under language "${selectedLanguage}"`);
                        this.set('show-placeholder', true);
                        this.updateTableHTML();
                        return;
                    }

                    const str = jsonDataN[subPath];
                    let tableData;
                    if (typeof str === 'string') {
                        tableData = eval(str);
                    } else {
                        tableData = str;
                    }

                    if (tableData && tableData.heading && tableData.data) {
                        // ONLY store headers and raw data, don't load into table yet
                        this.set('table-headers', tableData.heading);
                        this.set('table-data', tableData.data);

                        // Clear any existing custom data
                        this.set('custom-headers', null);
                        this.set('custom-data', null);

                        // Keep showing placeholder until filter is applied
                        this.set('show-placeholder', true);
                        this.updateTableHTML();

                        // Update filter dropdown with headers
                        this.updateFilterColumnOptions();
                        this.updateRunningTotalColumnOptions();

                        console.log('Headers loaded. Apply filter to load data.');
                    } else {
                        console.error('Invalid table data structure: missing heading or data');
                        this.set('show-placeholder', true);
                        this.updateTableHTML();
                    }
                } catch (error) {
                    console.error('Error parsing JSON path:', error);
                    this.set('show-placeholder', true);
                    this.updateTableHTML();
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
            showLoader() {
                if (!this.loaderElement) {
                    this.loaderElement = document.createElement('div');
                    this.loaderElement.className = 'json-table-loader';
                    this.loaderElement.innerHTML = `
            <div style="
                position: fixed; 
                top: 0; 
                left: 0; 
                width: 100%; 
                height: 100%; 
                background: rgba(0,0,0,0.5); 
                display: flex; 
                justify-content: center; 
                align-items: center; 
                z-index: 10000;
            ">
                <div style="
                    background: white; 
                    padding: 20px; 
                    border-radius: 8px; 
                    display: flex; 
                    align-items: center; 
                    gap: 10px;
                ">
                    <div style="
                        width: 20px; 
                        height: 20px; 
                        border: 2px solid #f3f3f3; 
                        border-top: 2px solid #007bff; 
                        border-radius: 50%; 
                        animation: spin 1s linear infinite;
                    "></div>
                    Loading table data...
                </div>
            </div>
            <style>
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            </style>
        `;
                }
                document.body.appendChild(this.loaderElement);
            },

            hideLoader() {
                if (this.loaderElement && this.loaderElement.parentNode) {
                    this.loaderElement.parentNode.removeChild(this.loaderElement);
                }
            },

            updateTableHTML() {
                const headers = this.get('custom-headers');
                const data = this.get('custom-data');
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

                // Clear existing components but preserve the main container
                const existingComponents = this.components();
                existingComponents.reset();

                // Handle placeholder state
                if (showPlaceholder || !headers || !data) {
                    this.addPlaceholderComponent();
                    return;
                }

                // Add main wrapper component
                const wrapperComponent = this.components().add({
                    type: 'default',
                    tagName: 'div',
                    classes: ['json-table-wrapper'],
                    style: {
                        'width': '100%',
                        'overflow-x': 'auto'
                    }
                });

                // Add title if present
                if (title) {
                    wrapperComponent.components().add({
                        type: 'text',
                        tagName: 'h3',
                        content: title,
                        style: {
                            'margin-bottom': '15px'
                        }
                    });
                }

                // Add controls (search & download)
                if (search === 'yes' || fileDownload) {
                    this.addControlsComponent(wrapperComponent, search, fileDownload);
                }

                // Add the main table component
                const tableComponent = wrapperComponent.components().add({
                    type: 'default',
                    tagName: 'table',
                    classes: ['json-data-table'],
                    attributes: {
                        id: tableId
                    },
                    style: {
                        'width': '100%',
                        'border-collapse': 'collapse',
                        'border': '1px solid #ddd',
                        'font-family': 'Arial, sans-serif'
                    }
                });

                // Add caption if enabled
                if (caption === 'yes' && name) {
                    tableComponent.components().add({
                        type: 'text',
                        tagName: 'caption',
                        content: name,
                        style: {
                            'text-align': captionAlign,
                            'padding': '10px',
                            'font-weight': 'bold',
                            'background-color': '#f8f9fa'
                        }
                    });
                }

                // Add table header
                this.addTableHeader(tableComponent, headers, tableId);

                // Add table body
                this.addTableBody(tableComponent, headers, data, tableId);

                // Add footer if enabled
                if (footer === 'yes') {
                    this.addTableFooter(tableComponent, headers);
                }

                // Add pagination if enabled
                if (pagination === 'yes') {
                    this.addPaginationComponent(wrapperComponent, pageLength);
                }

                // Add styles component
                this.addStylesComponent(wrapperComponent);

                // Apply highlighting after DOM is ready
                setTimeout(() => {
                    const conditions = this.getHighlightConditions();
                    const color = this.get('highlight-color');
                    if (conditions && conditions.length > 0) {
                        applyHighlighting(tableId, conditions, color);
                    }
                }, 100);
            },

            addPlaceholderComponent() {
                const tableHeaders = this.get('table-headers');
                const filterColumn = this.get('filter-column');
                const filterValue = this.get('filter-value');

                let placeholderMessage = 'Add JSON path from the properties panel to display table data';
                let placeholderIcon = '📊';

                if (tableHeaders && Object.keys(tableHeaders).length > 0) {
                    if (!filterColumn || filterColumn === '') {
                        placeholderMessage = 'Select a column from "Filter Column" dropdown or choose "None" to load all data<br><small style="color: #666;">Headers are loaded and ready for filtering</small>';
                        placeholderIcon = '🎯';
                    } else if (filterColumn !== 'none' && (!filterValue || filterValue === '')) {
                        placeholderMessage = 'Enter a filter value to load data<br><small style="color: #666;">Enter "=" to load all data for this column</small>';
                        placeholderIcon = '✏️';
                    }
                }

                this.components().add({
                    type: 'default',
                    tagName: 'json-table',
                    selectable: false,
                    classes: ['json-table-placeholder'],
                    content: `
            <div style="font-size: 48px; margin-bottom: 20px; color: #007bff;">${placeholderIcon}</div>
            <h3 style="margin: 0 0 10px 0; color: #495057;">JSON Table Data</h3>
            <p style="margin: 0; font-size: 14px;">${placeholderMessage}</p>
        `,
                    style: {
                        'width': '100%',
                        'min-height': '200px',
                        'border': '2px dashed #007bff',
                        'border-radius': '8px',
                        'display': 'flex',
                        'flex-direction': 'column',
                        'align-items': 'center',
                        'justify-content': 'center',
                        'background-color': '#f8f9fa',
                        'color': '#6c757d',
                        'text-align': 'center',
                        'font-family': 'Arial, sans-serif',
                        'cursor': 'pointer'
                    }
                });
            },

            addControlsComponent(parentComponent, search, fileDownload) {
                const controlsComponent = parentComponent.components().add({
                    type: 'default',
                    tagName: 'div',
                    classes: ['table-controls'],
                    style: {
                        'margin-bottom': '15px',
                        'display': 'flex',
                        'justify-content': 'space-between',
                        'align-items': 'center'
                    }
                });

                if (search === 'yes') {
                    controlsComponent.components().add({
                        type: 'input',
                        classes: ['table-search'],
                        attributes: {
                            type: 'text',
                            placeholder: 'Search...'
                        },
                        style: {
                            'padding': '8px',
                            'border': '1px solid #ddd',
                            'border-radius': '4px',
                            'width': '200px'
                        }
                    });
                }

                if (fileDownload) {
                    const downloadContainer = controlsComponent.components().add({
                        type: 'default',
                        tagName: 'div',
                        classes: ['download-buttons']
                    });

                    const downloadOptions = fileDownload.replace(/"/g, '').split(',').map(opt => opt.trim());
                    downloadOptions.forEach(option => {
                        downloadContainer.components().add({
                            type: 'button',
                            classes: ['download-btn'],
                            content: option.charAt(0).toUpperCase() + option.slice(1),
                            attributes: {
                                'data-type': option
                            },
                            style: {
                                'margin-left': '5px',
                                'padding': '6px 12px',
                                'background': '#007bff',
                                'color': 'white',
                                'border': 'none',
                                'border-radius': '4px',
                                'cursor': 'pointer'
                            }
                        });
                    });
                }
            },

            addTableHeader(tableComponent, headers, tableId) {
                const theadComponent = tableComponent.components().add({
                    type: 'default',
                    tagName: 'thead',
                    style: {
                        'background-color': '#f8f9fa',
                        'border': '1px solid #000'
                    }
                });

                const headerRowComponent = theadComponent.components().add({
                    type: 'default',
                    tagName: 'tr'
                });

                Object.entries(headers).forEach(([key, header]) => {
                    const headerId = `${tableId}-header-${key}`;
                    const storedHeader = this.get(`header-content-${key}`) || header;

                    const headerCellComponent = headerRowComponent.components().add({
                        type: 'json-table-cell', // Use your custom cell type
                        tagName: 'th',
                        classes: ['editable-header', 'json-table-cell'],
                        attributes: {
                            id: headerId,
                            'data-column-key': key,
                            'data-gjs-type': 'json-table-cell',
                            'data-gjs-selectable': 'true',
                            'data-gjs-hoverable': 'true'
                        },
                        style: {
                            'padding': '0',
                            'text-align': 'left',
                            'border': '1px solid #000000ff',
                            'font-weight': 'bold',
                            'cursor': 'pointer',
                            'position': 'relative'
                        }
                    });

                    // Add cell content div
                    headerCellComponent.components().add({
                        type: 'text',
                        tagName: 'div',
                        classes: ['cell-content'],
                        editable: true,
                        content: storedHeader,
                        style: {
                            'margin': '10px',
                            'width': '97%',
                            'height': '100%',
                            'box-sizing': 'border-box'
                        }
                    });
                });
            },

            addTableBody(tableComponent, headers, data, tableId) {
                const tbodyComponent = tableComponent.components().add({
                    type: 'default',
                    tagName: 'tbody'
                });

                if (data.length === 0) {
                    const emptyRowComponent = tbodyComponent.components().add({
                        type: 'default',
                        tagName: 'tr'
                    });

                    emptyRowComponent.components().add({
                        type: 'text',
                        tagName: 'td',
                        content: 'No data found',
                        attributes: {
                            colspan: Object.keys(headers).length.toString()
                        },
                        style: {
                            'text-align': 'center',
                            'padding': '20px',
                            'color': '#666'
                        }
                    });
                    return;
                }

                data.forEach((row, rowIndex) => {
                    const rowComponent = tbodyComponent.components().add({
                        type: 'default',
                        tagName: 'tr',
                        classes: [rowIndex % 2 === 0 ? 'even-row' : 'odd-row'],
                        style: {
                            'background-color': rowIndex % 2 === 0 ? '#ffffff' : '#f8f9fa'
                        }
                    });

                    Object.keys(headers).forEach(key => {
                        const cellId = `${tableId}-cell-${rowIndex}-${key}`;
                        const cellStyles = this.getCellStyle(rowIndex, key);
                        const formulaCellId = `cell-${rowIndex}-${key}`;
                        const cellFormulas = this.get('cell-formulas') || {};
                        const hasFormula = cellFormulas[formulaCellId];

                        const cellClasses = ['editable-cell', 'json-table-cell'];
                        if (hasFormula) cellClasses.push('formula-cell');

                        const cellComponent = rowComponent.components().add({
                            type: 'json-table-cell', // Use your custom cell type
                            tagName: 'td',
                            classes: cellClasses,
                            attributes: {
                                id: cellId,
                                'data-row': rowIndex.toString(),
                                'data-column-key': key,
                                'data-gjs-type': 'json-table-cell',
                                'data-gjs-selectable': 'true',
                                'data-gjs-hoverable': 'true',
                                title: hasFormula ? hasFormula : '',
                                'data-formula': hasFormula || ''
                            },
                            style: {
                                'padding': '0',
                                'border': '1px solid #000',
                                'cursor': 'pointer',
                                'position': 'relative',
                                ...cellStyles // Apply any custom cell styles
                            }
                        });

                        // Add cell content div
                        const displayValue = row[key] || '';
                        cellComponent.components().add({
                            type: 'text',
                            tagName: 'div',
                            classes: ['cell-content'],
                            content: displayValue,
                            style: {
                                'margin': '10px',
                                'width': '97%',
                                'height': '100%',
                                'box-sizing': 'border-content-box'
                            }
                        });
                    });
                });
            },

            addTableFooter(tableComponent, headers) {
                const tfootComponent = tableComponent.components().add({
                    type: 'default',
                    tagName: 'tfoot',
                    style: {
                        'background-color': '#e9ecef'
                    }
                });

                const footerRowComponent = tfootComponent.components().add({
                    type: 'default',
                    tagName: 'tr'
                });

                Object.values(headers).forEach(header => {
                    footerRowComponent.components().add({
                        type: 'text',
                        tagName: 'th',
                        content: header,
                        style: {
                            'padding': '12px',
                            'text-align': 'left',
                            'border-top': '2px solid #dee2e6',
                            'font-weight': 'bold'
                        }
                    });
                });
            },

            addPaginationComponent(parentComponent, pageLength) {
                const paginationComponent = parentComponent.components().add({
                    type: 'default',
                    tagName: 'div',
                    classes: ['table-pagination'],
                    style: {
                        'margin-top': '15px',
                        'display': 'flex',
                        'justify-content': 'space-between',
                        'align-items': 'center'
                    }
                });

                // Page length selector
                const pageLengthContainer = paginationComponent.components().add({
                    type: 'default',
                    tagName: 'div',
                    content: 'Show '
                });

                const selectComponent = pageLengthContainer.components().add({
                    type: 'select',
                    classes: ['page-length-select'],
                    style: {
                        'padding': '4px'
                    }
                });

                // Add options
                [10, 25, 50, 100].forEach(value => {
                    selectComponent.components().add({
                        type: 'option',
                        attributes: { value: value.toString() },
                        content: value.toString()
                    });
                });

                pageLengthContainer.components().add({
                    type: 'text',
                    content: ' entries'
                });

                // Pagination controls
                const controlsContainer = paginationComponent.components().add({
                    type: 'default',
                    tagName: 'div',
                    classes: ['pagination-controls']
                });

                // Previous button
                controlsContainer.components().add({
                    type: 'button',
                    classes: ['page-btn'],
                    content: 'Previous',
                    attributes: {
                        'data-page': 'prev'
                    },
                    style: {
                        'padding': '6px 12px',
                        'margin': '0 2px',
                        'background': '#007bff',
                        'color': 'white',
                        'border': 'none',
                        'border-radius': '4px',
                        'cursor': 'pointer'
                    }
                });

                // Page info
                controlsContainer.components().add({
                    type: 'text',
                    classes: ['page-info'],
                    content: 'Page 1 of 1',
                    style: {
                        'padding': '0 10px'
                    }
                });

                // Next button
                controlsContainer.components().add({
                    type: 'button',
                    classes: ['page-btn'],
                    content: 'Next',
                    attributes: {
                        'data-page': 'next'
                    },
                    style: {
                        'padding': '6px 12px',
                        'margin': '0 2px',
                        'background': '#007bff',
                        'color': 'white',
                        'border': 'none',
                        'border-radius': '4px',
                        'cursor': 'pointer'
                    }
                });
            },

            addStylesComponent(parentComponent) {
                parentComponent.components().add({
                    type: 'default',
                    tagName: 'style',
                    content: `
/* Table Styles */
.json-table-container {
    min-height: 100px;
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
    min-height: 40px;
    overflow: hidden;
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

        `
                });
            },

            // Method to update specific cells without rebuilding entire table
            updateSpecificCells(updates) {
                // updates = [{ rowIndex, columnKey, newValue }, ...]
                const tableId = this.cid ? `json-table-${this.cid}` : null;
                if (!tableId) return;

                updates.forEach(({ rowIndex, columnKey, newValue }) => {
                    const cellId = `${tableId}-cell-${rowIndex}-${columnKey}`;

                    // Find the component by traversing the component tree
                    const tableComponent = this.components().at(0); // Main wrapper
                    const tableElement = tableComponent.components().find(comp =>
                        comp.get('tagName') === 'table'
                    );

                    if (tableElement) {
                        const tbody = tableElement.components().find(comp =>
                            comp.get('tagName') === 'tbody'
                        );

                        if (tbody) {
                            const rows = tbody.components();
                            const targetRow = rows.at(rowIndex);

                            if (targetRow) {
                                const cells = targetRow.components();
                                const headerKeys = Object.keys(this.get('custom-headers') || this.get('table-headers') || {});
                                const columnIndex = headerKeys.indexOf(columnKey);

                                if (columnIndex >= 0) {
                                    const targetCell = cells.at(columnIndex);
                                    if (targetCell) {
                                        const cellContent = targetCell.components().at(0); // The div with cell-content class
                                        if (cellContent) {
                                            cellContent.set('content', newValue);
                                        }
                                    }
                                }
                            }
                        }
                    }
                });
            },

            // Method to add/remove rows dynamically
            addRowDynamic() {
                const headers = this.get('custom-headers') || this.get('table-headers');
                const data = this.get('custom-data') || this.get('table-data') || [];

                if (!headers) return;

                const newRow = {};
                Object.keys(headers).forEach(key => {
                    newRow[key] = 'New Data';
                });

                const updatedData = [...data, newRow];
                this.set('custom-data', updatedData);

                // Add the new row component instead of rebuilding entire table
                const tableComponent = this.components().at(0); // Main wrapper
                const tableElement = tableComponent.components().find(comp =>
                    comp.get('tagName') === 'table'
                );

                if (tableElement) {
                    const tbody = tableElement.components().find(comp =>
                        comp.get('tagName') === 'tbody'
                    );

                    if (tbody) {
                        const rowIndex = updatedData.length - 1;
                        const tableId = this.cid ? `json-table-${this.cid}` : `json-table-${Math.random().toString(36).substr(2, 9)}`;

                        this.addSingleRowComponent(tbody, newRow, rowIndex, headers, tableId);
                    }
                }
            },

            addSingleRowComponent(tbodyComponent, row, rowIndex, headers, tableId) {
                const rowComponent = tbodyComponent.components().add({
                    type: 'default',
                    tagName: 'tr',
                    classes: [rowIndex % 2 === 0 ? 'even-row' : 'odd-row'],
                    style: {
                        'background-color': rowIndex % 2 === 0 ? '#ffffff' : '#f8f9fa',
                    }
                });

                Object.keys(headers).forEach(key => {
                    const cellId = `${tableId}-cell-${rowIndex}-${key}`;
                    const cellStyles = this.getCellStyle(rowIndex, key);

                    const cellComponent = rowComponent.components().add({
                        type: 'json-table-cell',
                        tagName: 'td',
                        classes: ['editable-cell', 'json-table-cell'],
                        attributes: {
                            id: cellId,
                            'data-row': rowIndex.toString(),
                            'data-column-key': key,
                            'data-gjs-type': 'json-table-cell',
                            'data-gjs-selectable': 'true',
                            'data-gjs-hoverable': 'true'
                        },
                        style: {
                            'padding': '0',
                            'border': '1px solid #000',
                            'cursor': 'pointer',
                            'position': 'relative',
                            ...cellStyles
                        }
                    });

                    cellComponent.components().add({
                        type: 'text',
                        tagName: 'div',
                        classes: ['cell-content'],
                        content: row[key] || '',
                        style: {
                            'margin': '10px',
                            'width': '97%',
                            'height': '100%',
                            'box-sizing': 'border-content-box'
                        }
                    });
                });
            }


        },

        // Add these event handlers to the view's events object
        view: {
            events: {
                'input .table-search': 'handleSearch',
                'click .download-btn': 'handleDownload',
                'click .page-btn': 'handlePagination',
                'change .page-length-select': 'handlePageLengthChange',
                'click .json-table-cell, .json-table-cell *': 'handleCellClick',
                'blur .cell-input': 'handleCellEdit',
                'blur .header-input': 'handleHeaderEdit',
                'keydown .cell-input': 'handleCellKeydown',
                'keydown .header-input': 'handleHeaderKeydown',
                'dblclick .json-table-cell': 'handleCellDoubleClick',
                'click': 'handleOutsideClick',
                'mouseenter .json-table-cell': 'handleCellMouseEnter',
                'mouseleave .json-table-cell': 'handleCellMouseLeave'
            },

            // Hover highlight
            // ✅ Single click = select TD/TH
            handleCellClick(e) {
                e.preventDefault();
                e.stopPropagation();

                // Always climb up to the td/th
                const cell = e.target.closest('td, th');
                console.log("Cell click: raw target =", e.target, "resolved TD/TH =", cell);

                if (!cell || cell.classList.contains('editing')) {
                    console.log("❌ No valid TD/TH to select");
                    return;
                }

                // Remove old selection
                const allCells = this.el.querySelectorAll('td, th');
                allCells.forEach(c => c.classList.remove('i_designer_selected'));

                // ✅ Keep only our class (wipe others)
                cell.className = "i_designer_selected";
                console.log("✅ Added i_designer_selected to TD/TH:", cell);
            },

            // ✅ Hover highlight
            handleCellMouseEnter(e) {
                const cell = e.target.closest('td, th');
                console.log("Mouse enter:", e.target, "resolved TD/TH:", cell);
                if (cell && !cell.classList.contains('editing')) {
                    cell.classList.add('i_designer_hovered');
                }
            },

            handleCellMouseLeave(e) {
                const cell = e.target.closest('td, th');
                console.log("Mouse leave:", e.target, "resolved TD/TH:", cell);
                if (cell) {
                    cell.classList.remove('i_designer_hovered');
                }
            },


            // Double click = start editing
            handleCellDoubleClick(e) {
                e.preventDefault();
                e.stopPropagation();


            },

            // Outside click = clear selection
            handleOutsideClick(e) {
                if (!e.target.closest('.json-table-cell')) {
                    const allSelectedCells = document.querySelectorAll('.json-table-cell.i_designer_selected');
                    allSelectedCells.forEach(cell => {
                        cell.classList.remove('i_designer_selected');
                        console.log("Removed i_designer_selected from:", cell);
                    });
                }

                if (!e.target.classList.contains('cell-content') &&
                    !e.target.classList.contains('cell-input') &&
                    !e.target.classList.contains('header-input')) {

                    const currentlyEditing = this.el.querySelector('.json-table-cell.editing');
                    if (currentlyEditing) {
                        console.log("Stopping editing for:", currentlyEditing);
                        this.stopCellEditing(currentlyEditing);
                    }
                }
            },

            // Editing start
            startCellEditing(cell, cellContent) {
                console.log("Start editing cell:", cell);

                cell.classList.remove('i_designer_hovered');

                const rowIndex = cell.getAttribute('data-row');
                const columnKey = cell.getAttribute('data-column-key');
                const isHeader = cell.classList.contains('editable-header');

                const currentValue = cellContent.textContent;
                const input = document.createElement('input');
                input.type = 'text';
                input.value = currentValue;
                input.className = isHeader ? 'header-input' : 'cell-input';

                const computedStyle = window.getComputedStyle(cellContent);
                input.style.cssText = `
            width: 100%;
            height: 100%;
            border: 2px solid #007bff;
            padding: ${computedStyle.padding};
            box-sizing: border-box;
            background: white;
            font-family: ${computedStyle.fontFamily};
            font-size: ${computedStyle.fontSize};
            margin: 0;
            min-height: ${computedStyle.minHeight};
            max-height: ${computedStyle.height};
            resize: none;
            outline: none;
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
        `;

                if (isHeader) input.style.fontWeight = 'bold';

                cell.style.position = 'relative';
                cell.classList.add('editing');
                cellContent.style.opacity = '0';
                cell.appendChild(input);
                input.focus();
                input.select();
            },

            // Editing stop
            stopCellEditing(cell) {
                console.log("Stop editing cell:", cell);

                const cellContent = cell.querySelector('.cell-content');
                const input = cell.querySelector('.cell-input, .header-input');
                if (!input || !cellContent) return;

                const rowIndex = cell.getAttribute('data-row');
                const columnKey = cell.getAttribute('data-column-key');
                const isHeader = cell.classList.contains('editable-header');
                const newValue = input.value;

                // Clean up editing
                cell.removeChild(input);
                cell.classList.remove('editing');
                cell.style.position = '';
                cellContent.style.opacity = '';

                // Update data
                if (isHeader) {
                    this.model.updateHeaderData(columnKey, newValue);
                    cellContent.innerHTML = newValue;
                } else {
                    this.model.updateCellData(parseInt(rowIndex), columnKey, newValue);

                    if (newValue.startsWith('=')) {
                        const cellId = `cell-${rowIndex}-${columnKey}`;
                        const cellFormulas = this.model.get('cell-formulas') || {};
                        const evaluatedValue = cellFormulas[cellId]
                            ? this.model.get('custom-data')[rowIndex][columnKey]
                            : newValue;
                        cellContent.innerHTML = evaluatedValue;
                    } else {
                        cellContent.innerHTML = newValue;
                    }
                }

                console.log("✅ Final classes for cell:", cell.className, "value:", newValue);
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
    editor.Commands.add('open-column-reorder-manager', {
        run(editor) {
            const selected = editor.getSelected();
            if (!selected || selected.get('type') !== 'json-table') return;

            const headers = selected.get('custom-headers') || selected.get('table-headers') || {};
            const columnKeys = Object.keys(headers);

            if (columnKeys.length <= 1) {
                alert('Need at least 2 columns to reorder');
                return;
            }

            const modalContent = `
<div class="column-reorder-manager" style="padding: 20px; max-width: 500px;">
    <h3 style="margin-top: 0; margin-bottom: 20px;">Reorder Table Columns</h3>
    <p style="font-size: 14px; margin-bottom: 15px;">
        Drag and drop to reorder columns. The first column will appear leftmost in the table.
    </p>
    
    <div id="column-list" style="border: 1px solid #ddd; border-radius: 5px; ">
        ${columnKeys.map((key, index) => `
            <div class="column-item" data-key="${key}" style="
                background: white; 
                margin: 2px; 
                padding: 12px 15px; 
                border-radius: 3px; 
                cursor: move; 
                border-left: 4px solid #007bff;
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: all 0.2s ease;
            ">
                <span style="font-weight: 500;">${headers[key]}</span>
                <span style="color: #666; font-size: 12px;">≡≡≡</span>
            </div>
        `).join('')}
    </div>
    
    <div style="margin-top: 20px; display: flex; justify-content: space-between;">
        <div>
            <button id="reset-order" style="background: #ffc107; color: #000; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; margin-right: 10px;">
                Reset to Original
            </button>
        </div>
        <div>
            <button id="cancel-reorder" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin-right: 10px;">
                Cancel
            </button>
            <button id="apply-reorder" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
                Apply Order
            </button>
        </div>
    </div>
</div>

<style>
.column-item:hover {
    box-shadow: 0 2px 8px rgba(0,123,255,0.2);
    transform: translateY(-1px);
}

.column-item.dragging {
    opacity: 0.5;
    transform: rotate(5deg);
}

.column-item.drag-over {
    border-top: 3px solid #28a745;
}
</style>`;

            const modal = editor.Modal;
            modal.setTitle('Column Reorder Manager');
            modal.setContent(modalContent);
            modal.open();

            setTimeout(() => {
                initializeColumnReorderManager(selected, columnKeys, headers);
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

    function initializeColumnReorderManager(component, originalOrder, headers) {
        const columnList = document.getElementById('column-list');
        const cancelBtn = document.getElementById('cancel-reorder');
        const applyBtn = document.getElementById('apply-reorder');
        const resetBtn = document.getElementById('reset-order');

        let draggedElement = null;

        // Make columns draggable
        const columnItems = columnList.querySelectorAll('.column-item');
        columnItems.forEach(item => {
            item.draggable = true;

            item.addEventListener('dragstart', function (e) {
                draggedElement = this;
                this.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/html', this.outerHTML);
            });

            item.addEventListener('dragend', function (e) {
                this.classList.remove('dragging');
                draggedElement = null;

                // Remove drag-over class from all items
                columnItems.forEach(item => item.classList.remove('drag-over'));
            });

            item.addEventListener('dragover', function (e) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';

                if (this !== draggedElement) {
                    this.classList.add('drag-over');
                }
            });

            item.addEventListener('dragleave', function (e) {
                this.classList.remove('drag-over');
            });

            item.addEventListener('drop', function (e) {
                e.preventDefault();
                this.classList.remove('drag-over');

                if (this !== draggedElement) {
                    const allItems = Array.from(columnList.children);
                    const draggedIndex = allItems.indexOf(draggedElement);
                    const targetIndex = allItems.indexOf(this);

                    if (draggedIndex < targetIndex) {
                        this.parentNode.insertBefore(draggedElement, this.nextSibling);
                    } else {
                        this.parentNode.insertBefore(draggedElement, this);
                    }
                }
            });
        });

        // Reset to original order
        resetBtn.addEventListener('click', function () {
            const columnList = document.getElementById('column-list');
            columnList.innerHTML = originalOrder.map(key => `
            <div class="column-item" data-key="${key}" draggable="true" style="
                background: white; 
                margin: 2px; 
                padding: 12px 15px; 
                border-radius: 3px; 
                cursor: move; 
                border-left: 4px solid #007bff;
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: all 0.2s ease;
            ">
                <span style="font-weight: 500;">${headers[key]}</span>
                <span style="color: #666; font-size: 12px;">≡≡≡</span>
            </div>
        `).join('');

            // Re-initialize drag and drop for new elements
            initializeColumnReorderManager(component, originalOrder, headers);
        });

        // Cancel
        cancelBtn.addEventListener('click', function () {
            editor.Modal.close();
        });

        // Apply reorder
        applyBtn.addEventListener('click', function () {
            const currentItems = columnList.querySelectorAll('.column-item');
            const newOrder = Array.from(currentItems).map(item => item.getAttribute('data-key'));

            console.log('Reordering columns from:', originalOrder, 'to:', newOrder);

            component.reorderColumns(newOrder);
            editor.Modal.close();

            // Show success message
            setTimeout(() => {
                alert('Column order updated successfully!');
            }, 100);
        });
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
        run(editor, sender) {
            const selected = editor.getSelected();
            if (!selected || selected.get('type') !== 'json-table') return;

            // Get file index from trait
            let fileIndex = selected.get('json-file-index') || '0';
            if (fileIndex === '0') {
                alert('Please select a JSON file first');
                return;
            }

            // Get the selected file's JSON data
            const fileNames = (localStorage.getItem('common_json_files') || "").split(',').map(f => f.trim());
            const selectedFile = fileNames[parseInt(fileIndex) - 1];
            const jsonString = localStorage.getItem(`common_json_${selectedFile}`);

            if (!jsonString) {
                alert('Selected JSON file not found');
                return;
            }

            const commonJson = JSON.parse(jsonString);

            // Show top-level keys (language options) first
            const topLevelKeys = Object.keys(commonJson);

            let modalContent = `
        <div class="new-table-form">
        <div style="padding-bottom:10px">
            <input type="text" id="searchInput" placeholder="Search json">
        </div>
        <div class="suggestion-results" style="height: 200px; overflow: hidden; overflow-y: scroll;">
        `;

            topLevelKeys.forEach(key => {
                modalContent += `<div class="suggestion language-option" data-value="${key}" data-type="language">${key}</div>`;
            });

            modalContent += `
      </div>
    </div>
  `;

            editor.Modal.setTitle('Json Suggestion');
            editor.Modal.setContent(modalContent);
            editor.Modal.open();

            // Add event listener to search input
            document.getElementById("searchInput").addEventListener("input", function () {
                filterSuggestions(this.value);
            });

            const suggestionItems = document.querySelectorAll('.suggestion');
            suggestionItems.forEach(item => {
                item.addEventListener('click', function () {
                    const selectedValue = this.getAttribute('data-value');
                    const dataType = this.getAttribute('data-type');

                    if (dataType === 'language') {
                        // Show keys under selected language
                        showTableLanguageKeys(selectedValue, commonJson, selected);
                    }
                });
            });
        }
    });

    // Add helper functions for table suggestion (place at the end, after commands)
    function showTableLanguageKeys(language, commonJson, selectedComponent) {
        const metaDataKeys = extractMetaDataKeys(commonJson[language]);

        let modalContent = `
<div class="new-table-form">
  <div style="padding-bottom:10px">
    <button id="backBtn" style="margin-right: 10px;">← Back</button>
    <input type="text" id="searchInput" placeholder="Search json">
  </div>
  <div class="suggestion-results" style="height: 200px; overflow: hidden; overflow-y: scroll;">
`;

        metaDataKeys.forEach(key => {
            const fullPath = `${language}.${key}`;
            modalContent += `<div class="suggestion" data-value="${fullPath}" data-type="key">${key}</div>`;
        });

        modalContent += `
  </div>
</div>
`;

        editor.Modal.setContent(modalContent);

        // Back button functionality
        document.getElementById("backBtn").addEventListener("click", function () {
            editor.Commands.run('open-json-table-suggestion');
        });

        // Search functionality
        document.getElementById("searchInput").addEventListener("input", function () {
            filterSuggestions(this.value);
        });

        // Key selection (single for table)
        const suggestionItems = document.querySelectorAll('.suggestion');
        suggestionItems.forEach(item => {
            item.addEventListener('click', function () {
                const selectedValue = this.getAttribute('data-value');
                console.log('Setting JSON path to:', selectedValue);

                // Set the json-path value in the model
                selectedComponent.set('json-path', selectedValue);

                // Update the trait value and trigger re-render
                const jsonPathTrait = selectedComponent.getTrait('json-path');
                if (jsonPathTrait) {
                    jsonPathTrait.set('value', selectedValue);
                    // Force trait view update
                    setTimeout(() => {
                        if (jsonPathTrait.view && jsonPathTrait.view.render) {
                            jsonPathTrait.view.render();
                        }
                        // Also trigger the component's change event
                        selectedComponent.trigger('change:json-path');
                    }, 50);
                }

                editor.Modal.close();
            });
        });
    }
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
    function filterSuggestions(query) {
        const suggestionResults = document.querySelector('.suggestion-results');
        const metaDataKeys = Array.from(suggestionResults.children);
        metaDataKeys.forEach(key => {
            if (key.textContent.toLowerCase().includes(query.toLowerCase())) {
                key.style.display = "block";
            } else {
                key.style.display = "none";
            }
        });
    }

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