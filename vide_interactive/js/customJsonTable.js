function jsontablecustom(editor) {

    function enableFormulaEditing(tableId) {
        const iframeDoc = editor.Canvas.getDocument();
        const parser = new iframeDoc.defaultView.formulaParser.Parser();

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
                    done(parseFloat(val) || val);
                }
            } else {
                done(null);
            }
        });

        // Enhanced parser for range support (A1:A5)
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

        // Function to attach event listeners to cells
        function attachCellListeners() {
            const tableElem = iframeDoc.getElementById(tableId);
            if (!tableElem) return;

            tableElem.querySelectorAll('td, th').forEach(cell => {
                // Skip if already has listeners
                if (cell.hasAttribute('data-formula-enabled')) return;

                cell.contentEditable = "true";
                cell.setAttribute('data-formula-enabled', 'true');

                cell.addEventListener('focus', handleCellFocus);
                cell.addEventListener('blur', handleCellBlur);
                cell.addEventListener('input', handleCellInput);
                cell.addEventListener('keydown', handleCellKeydown);
            });
        }

        function handleCellFocus() {
            let formula = this.getAttribute('data-formula');
            if (formula) this.innerText = formula;
        }

        function handleCellInput(e) {
            const cell = this;
            const currentText = cell.innerText;
            // Show formula suggestions when typing after '='
        }

        function handleCellKeydown(e) {
            // Handle Tab key for navigation
            if (e.key === 'Tab') {
                e.preventDefault();
                const cell = this;
                const table = cell.closest('table');
                const allCells = Array.from(table.querySelectorAll('td, th'));
                const currentIndex = allCells.indexOf(cell);

                let nextIndex;
                if (e.shiftKey) {
                    nextIndex = currentIndex > 0 ? currentIndex - 1 : allCells.length - 1;
                } else {
                    nextIndex = currentIndex < allCells.length - 1 ? currentIndex + 1 : 0;
                }

                allCells[nextIndex].focus();
            }
        }

        function handleCellBlur() {
            const cell = this;
            let val = cell.innerText.trim();

            // Remove existing suggestions
            const iframeDoc = editor.Canvas.getDocument();
            iframeDoc.querySelectorAll('.formula-suggestions').forEach(s => s.remove());

            if (val.startsWith('=')) {
                cell.setAttribute('data-formula', val);
                try {
                    const formulaContent = val.substring(1).trim();
                    if (!formulaContent) throw new Error('Empty formula');

                    // Parse formula
                    const res = parser.parse(formulaContent);
                    if (res.error) throw new Error(res.error);

                    // Use string or number result
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

            updateComponentContent(cell.closest('table').id);
        }

        function updateComponentContent(tableId) {
            // We don't need to sync back to GrapesJS component for formula calculations
            return;
        }

        // Initial attachment of listeners
        attachCellListeners();

        // Re-attach listeners when component is updated/re-rendered
        editor.on('component:update', (component) => {
            if (component.getId() === tableId || component.find(`#${tableId}`).length > 0) {
                setTimeout(() => {
                    attachCellListeners();
                }, 100);
            }
        });
    }

    editor.on('load', () => {
        const iframe = editor.getContainer().querySelector('iframe');
        if (iframe && iframe.contentDocument) {
            const head = iframe.contentDocument.head;

            // Add DataTables CSS and JS
            const datatableCSS = document.createElement('link');
            datatableCSS.rel = 'stylesheet';
            datatableCSS.href = 'https://cdn.datatables.net/1.11.5/css/dataTables.bootstrap4.min.css';
            head.appendChild(datatableCSS);

            const buttonsCSS = document.createElement('link');
            buttonsCSS.rel = 'stylesheet';
            buttonsCSS.href = 'https://cdn.datatables.net/buttons/2.2.2/css/buttons.dataTables.min.css';
            head.appendChild(buttonsCSS);

            // Add formula parser script
            const formulaScript = document.createElement('script');
            formulaScript.src = "https://cdn.jsdelivr.net/npm/hot-formula-parser/dist/formula-parser.min.js";
            head.appendChild(formulaScript);

            formulaScript.onload = () => {
                try {
                    if (iframe.contentWindow.formulaParser && iframe.contentWindow.formulaParser.SUPPORTED_FORMULAS) {
                        window.formulaParser = iframe.contentWindow.formulaParser;
                        window.HotFormulaParser = new window.formulaParser.Parser();

                        // Register custom formulas if needed
                        registerCustomFormulas();
                    }
                } catch (error) {
                    console.warn('Could not access formula parser:', error);
                }
            };

            // Add jQuery and DataTables scripts if not already present
            const jqueryScript = document.createElement('script');
            jqueryScript.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
            head.appendChild(jqueryScript);

            jqueryScript.onload = () => {
                const datatableScript = document.createElement('script');
                datatableScript.src = 'https://cdn.datatables.net/1.11.5/js/jquery.dataTables.min.js';
                head.appendChild(datatableScript);

                const buttonsScript = document.createElement('script');
                buttonsScript.src = 'https://cdn.datatables.net/buttons/2.2.2/js/dataTables.buttons.min.js';
                head.appendChild(buttonsScript);

                const exportScripts = [
                    'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.1.3/jszip.min.js',
                    'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.53/pdfmake.min.js',
                    'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.53/vfs_fonts.js',
                    'https://cdn.datatables.net/buttons/2.2.2/js/buttons.html5.min.js',
                    'https://cdn.datatables.net/buttons/2.2.2/js/buttons.print.min.js'
                ];

                exportScripts.forEach(src => {
                    const script = document.createElement('script');
                    script.src = src;
                    head.appendChild(script);
                });
            };
        }
    });

    function loadNumberToWords() {
        const iframe = editor.getContainer().querySelector('iframe');
        if (!iframe || !iframe.contentWindow) {
            setTimeout(loadNumberToWords, 500);
            return;
        }

        const iframeWindow = iframe.contentWindow;

        // Check if already loaded
        if (iframeWindow.numberToWords) {
            registerNumToWords(iframeWindow);
            return;
        }

        // Create script element in iframe document
        const script = iframeWindow.document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/number-to-words@1.2.4/numberToWords.min.js";
        script.crossOrigin = "anonymous";

        script.onload = function () {
            setTimeout(() => {
                registerNumToWords(iframeWindow);
            }, 100);
        };

        script.onerror = function () {
            console.error('Failed to load number-to-words library');

            // Fallback implementation
            if (window.HotFormulaParser) {
                window.HotFormulaParser.setFunction('NUMTOWORDS', function (params) {
                    if (params.length !== 1) return '#N/A';
                    const num = parseInt(params[0]);
                    if (isNaN(num)) return '#VALUE!';

                    const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
                        'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];

                    if (num >= 0 && num <= 20) {
                        return words[num];
                    } else if (num < 100) {
                        const tens = Math.floor(num / 10);
                        const ones = num % 10;
                        const tensWords = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
                        return ones === 0 ? tensWords[tens] : tensWords[tens] + '-' + words[ones];
                    }
                    return 'Number too large';
                });
            }
        };

        iframeWindow.document.head.appendChild(script);
    }

    function loadNumberToWords() {
        const iframe = editor.getContainer().querySelector('iframe');
        if (!iframe || !iframe.contentWindow) {
            setTimeout(loadNumberToWords, 500);
            return;
        }

        const iframeWindow = iframe.contentWindow;

        // Check if already loaded
        if (iframeWindow.numberToWords) {
            registerNumToWords(iframeWindow);
            return;
        }

        // Create script element in iframe document
        const script = iframeWindow.document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/number-to-words@1.2.4/numberToWords.min.js";
        script.crossOrigin = "anonymous";

        script.onload = function () {
            setTimeout(() => {
                registerNumToWords(iframeWindow);
            }, 100);
        };

        script.onerror = function () {
            console.error('Failed to load number-to-words library');

            // Fallback implementation
            if (window.HotFormulaParser) {
                window.HotFormulaParser.setFunction('NUMTOWORDS', function (params) {
                    if (params.length !== 1) return '#N/A';
                    const num = parseInt(params[0]);
                    if (isNaN(num)) return '#VALUE!';

                    const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
                        'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];

                    if (num >= 0 && num <= 20) {
                        return words[num];
                    } else if (num < 100) {
                        const tens = Math.floor(num / 10);
                        const ones = num % 10;
                        const tensWords = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
                        return ones === 0 ? tensWords[tens] : tensWords[tens] + '-' + words[ones];
                    }
                    return 'Number too large';
                });
            }
        };

        iframeWindow.document.head.appendChild(script);
    }

    function registerNumToWords(iframeWindow) {
        if (iframeWindow.numberToWords && iframeWindow.numberToWords.toWords && window.HotFormulaParser) {
            window.HotFormulaParser.setFunction('NUMTOWORDS', function (params) {
                if (params.length !== 1) return '#N/A';
                const num = parseInt(params[0]);
                if (isNaN(num)) return '#VALUE!';

                try {
                    return iframeWindow.numberToWords.toWords(num);
                } catch (error) {
                    return '#ERROR';
                }
            });

            console.log('NUMTOWORDS formula registered successfully');
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
                        td.style.border = '1px solid #000';
                        if (textColor) td.style.color = textColor;
                        if (fontFamily) td.style.fontFamily = fontFamily;
                        td.setAttribute('data-highlighted', 'true');

                        const id = td.id;
                        if (id) {
                            const comp = wrapper.find(`#${id}`)[0];
                            if (comp) {
                                const styles = {
                                    'background-color': bgColor,
                                    'border': '1px solid #000',
                                    'box-sizing': 'border-box',
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
                        name: 'table-type',
                        label: 'Table Type',
                        options: [
                            { value: 'standard', name: 'Standard Table' },
                            { value: 'crosstab', name: 'Crosstab Table' }
                        ],
                        default: "standard",
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
                        label: 'Preview Column',
                        options: [{ value: "", name: "First enter JSON path" }],
                        changeProp: 1,
                        // Update this section
                        attributes: {
                            style: 'display: block;'  // Hidden by default
                        }
                    },
                    {
                        type: 'text',
                        name: 'filter-value',
                        label: 'Preview Value',
                        placeholder: 'Enter preview value',
                        changeProp: 1,
                        attributes: {
                            style: 'display: block;'  // Hidden by default
                        }
                    },
                    // {
                    //     type: 'checkbox',
                    //     name: 'show-row-totals',
                    //     label: 'Show Row Totals',
                    //     changeProp: 1
                    // },
                    // {
                    //     type: 'checkbox',
                    //     name: 'show-column-totals',
                    //     label: 'Show Column Totals',
                    //     changeProp: 1
                    // },
                    // {
                    //     type: 'checkbox',
                    //     name: 'show-grand-total',
                    //     label: 'Show Grand Total',
                    //     changeProp: 1
                    // },
                    // Add highlighting traits from custom table
                    {
                        type: 'button',
                        name: 'manage-highlight-conditions',
                        label: ' Highlight',
                        text: 'Highlight Conditions',
                        full: true,
                        command: 'open-table-condition-manager-json-table'
                    },
                    {
                        type: 'button',
                        name: 'reorder-columns-btn',
                        label: 'Columns',
                        text: 'Column Order',
                        full: true,
                        command: 'open-column-reorder-manager'
                    },
                    {
                        type: 'button',
                        name: 'manage-running-totals-btn',
                        label: 'Running Total',
                        text: 'Add Running Total',
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
            },

            init() {
                // Replace the existing onChange handlers with these optimized ones:

                this.on('change:json-file-index', () => {
                    this.set('json-path', '');
                    this.set('filter-column', '');
                    this.set('filter-value', '');
                    this.set('running-total-column', '');
                    this.set('enable-running-total', false);
                    this.set('custom-headers', null);
                    this.set('custom-data', null);
                    this.set('table-headers', null);
                    this.set('table-data', null);
                    this.set('show-placeholder', true);
                    this.updateTableHTML();

                    setTimeout(() => {
                        this.updateFilterColumnOptions();
                    }, 100);
                });

                this.on('change:json-path', () => {
                    const tableType = this.get('table-type') || 'standard';

                    // For crosstab, render immediately
                    if (tableType === 'crosstab') {
                        this.updateTableFromJson();
                        return;
                    }

                    // For standard table, clear filters and wait
                    this.updateTableFromJson();
                    this.set('filter-column', '');
                    this.set('filter-value', '');
                    this.set('running-total-column', '');
                    this.set('enable-running-total', false);
                    this.set('custom-headers', null);
                    this.set('custom-data', null);

                    setTimeout(() => {
                        const jsonPathTrait = this.getTrait('json-path');
                        if (jsonPathTrait) {
                            const currentPath = this.get('json-path');
                            jsonPathTrait.set('value', currentPath);
                            if (jsonPathTrait.view && jsonPathTrait.view.render) {
                                jsonPathTrait.view.render();
                            }
                        }
                    }, 100);
                });
                this.on('change:table-type', () => {
                    const tableType = this.get('table-type');

                    // Show/hide filter traits based on table type
                    setTimeout(() => {
                        const filterColumnTrait = this.getTrait('filter-column');
                        const filterValueTrait = this.getTrait('filter-value');

                        if (filterColumnTrait && filterColumnTrait.view) {
                            const display = tableType === 'crosstab' ? 'none' : 'block';
                            filterColumnTrait.view.el.style.display = display;
                        }
                        if (filterValueTrait && filterValueTrait.view) {
                            const display = tableType === 'crosstab' ? 'none' : 'block';
                            filterValueTrait.view.el.style.display = display;
                        }
                    }, 100);

                    // Clear filters when switching to crosstab
                    if (tableType === 'crosstab') {
                        this.set('filter-column', '');
                        this.set('filter-value', '');
                        this.set('custom-headers', null);
                        this.set('custom-data', null);
                    }

                    // Re-process the table if json-path exists
                    const jsonPath = this.get('json-path');
                    if (jsonPath) {
                        this.updateTableFromJson();
                    }
                });
                this.on('change:selected-running-total-columns', () => {
                    this.updateRunningTotals();
                });

                this.on('change:filter-column', () => {
                    const filterColumn = this.get('filter-column');
                    const filterValue = this.get('filter-value');

                    if (filterColumn === "none") {
                        this.loadFilteredData();
                        return;
                    }

                    if (filterColumn && filterValue && filterValue.trim() !== '') {
                        this.loadFilteredData();
                    } else if (!filterColumn) {
                        this.set('custom-headers', null);
                        this.set('custom-data', null);
                        this.set('show-placeholder', true);
                        this.updateTableHTML();
                    }
                });

                this.on('change:filter-value', () => {
                    const filterColumn = this.get('filter-column');
                    const filterValue = this.get('filter-value');

                    if (filterColumn === "none") {
                        return;
                    }

                    if (filterColumn && filterValue && filterValue.trim() !== '') {
                        this.loadFilteredData();
                    } else if (!filterValue || filterValue.trim() === '') {
                        this.set('custom-headers', null);
                        this.set('custom-data', null);
                        this.set('show-placeholder', true);
                        this.updateTableHTML();
                    }
                });

                this.on('change:table-type', () => {
                    const tableType = this.get('table-type');

                    // Clear filters when switching to crosstab
                    if (tableType === 'crosstab') {
                        this.set('filter-column', '');
                        this.set('filter-value', '');
                        this.set('custom-headers', null);
                        this.set('custom-data', null);
                    }

                    // Re-process the table if json-path exists
                    const jsonPath = this.get('json-path');
                    if (jsonPath) {
                        this.updateTableFromJson();
                    }
                });
                // REPLACE these lines that cause full table rebuilds:
                // OLD: this.on('change:name change:footer change:pagination change:page-length change:search change:caption change:caption-align', this.updateTableHTML);
                // NEW: Only update DataTable settings, not entire HTML
                this.on('change:name change:footer change:pagination change:page-length change:search change:caption change:caption-align', this.updateDataTableSettings);

                // Keep highlight changes separate
                this.on('change:highlight-conditions change:highlight-color', this.handleHighlightChange);

                this.set('show-placeholder', true);
                this.updateTableHTML();
            },
            updateDataTableSettings() {
                const tableId = this.cid ? `json-table-${this.cid}` : null;
                if (!tableId) return;

                const canvasDoc = editor.Canvas.getDocument();
                const tableElement = canvasDoc.getElementById(tableId);

                if (!tableElement) return;

                // Destroy and recreate DataTable with new settings
                if (canvasDoc.defaultView.$ && canvasDoc.defaultView.$.fn.DataTable.isDataTable(tableElement)) {
                    const dt = canvasDoc.defaultView.$(tableElement).DataTable();
                    dt.destroy();

                    // Reinitialize with new settings
                    setTimeout(() => {
                        this.initializeDataTable(tableId);
                    }, 100);
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

                if (filterValue === '=') {
                    // Load all data for this column
                    filteredData = [...originalData];
                } else {
                    // Filter data based on column and value (case-insensitive partial match)
                    filteredData = originalData.filter(row => {
                        const cellValue = String(row[filterColumn] || '').toLowerCase();
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

                this.updateTableHTML();

                console.log(`Loaded ${filteredData.length} rows based on filter: ${filterColumn} contains "${filterValue}"`);

                // Show message if no results
                if (filteredData.length === 0) {
                    alert('No data matches the filter criteria');
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
                // Show filter traits for standard tables
                setTimeout(() => {
                    const tableType = this.get('table-type') || 'standard';
                    if (tableType === 'standard') {
                        const filterColumnTrait = this.getTrait('filter-column');
                        const filterValueTrait = this.getTrait('filter-value');

                        if (filterColumnTrait && filterColumnTrait.view) {
                            filterColumnTrait.view.el.style.display = 'block';
                        }
                        if (filterValueTrait && filterValueTrait.view) {
                            filterValueTrait.view.el.style.display = 'block';
                        }
                    }
                }, 200);
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


            updateTableFromJson() {
                const jsonPath = this.get('json-path');
                const fileIndex = this.get('json-file-index') || '0';
                const tableType = this.get('table-type') || 'standard';

                if (!jsonPath) {
                    console.warn('No JSON path provided');
                    this.set('show-placeholder', true);
                    this.updateTableHTML();
                    return;
                }

                try {
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

                    // CROSSTAB MODE - Direct rendering
                    if (tableType === 'crosstab' && tableData.type === 'crosstab') {
                        const tableResult = this.buildCrosstabTable(tableData);
                        this.set('table-headers', tableResult.headers);
                        this.set('table-data', tableResult.data);
                        this.set('custom-headers', tableResult.headers);
                        this.set('custom-data', tableResult.data);
                        this.set('show-placeholder', false);
                        this.updateTableHTML();

                        console.log('Crosstab table rendered directly');
                        return;
                    }

                    // STANDARD MODE - Store headers, wait for filter
                    if (tableData && tableData.heading && tableData.data) {
                        this.set('table-headers', tableData.heading);
                        this.set('table-data', tableData.data);
                        this.set('custom-headers', null);
                        this.set('custom-data', null);
                        this.set('show-placeholder', true);
                        this.updateTableHTML();
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

            parseCrosstabData() {
                const jsonPath = this.get('json-path');
                const fileIndex = this.get('json-file-index') || '0';

                if (!jsonPath) return null;

                try {
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

                    if (!jsonDataN || !jsonDataN[subPath]) return null;

                    const crosstabData = typeof jsonDataN[subPath] === 'string'
                        ? eval(jsonDataN[subPath])
                        : jsonDataN[subPath];

                    if (crosstabData.type !== 'crosstab') return null;

                    return crosstabData;
                } catch (error) {
                    console.error('Error parsing crosstab data:', error);
                    return null;
                }
            },

            buildCrosstabTable(crosstabData) {
                const columnHeaders = crosstabData.columnHeaders || [];
                const rows = crosstabData.rows || [];
                const structure = crosstabData.structure || {};

                // Store crosstab structure for rendering
                this.set('crosstab-structure', {
                    columnHeaders,
                    rows,
                    structure
                });

                // Create flat headers for GrapesJS component structure
                const headers = {};
                const rowHeaderCount = structure.rowHeaderLevels || 1;

                // Add row header columns
                for (let i = 0; i < rowHeaderCount; i++) {
                    headers[`row_header_${i}`] = `Row Header ${i + 1}`;
                }

                // Count data columns from first row
                const dataColCount = rows.length > 0 && rows[0].cells ? rows[0].cells.length : 0;
                for (let i = 0; i < dataColCount; i++) {
                    headers[`data_col_${i}`] = `Column ${i + 1}`;
                }

                // Create flat data structure
                const tableData = rows.map((row, rowIdx) => {
                    const dataRow = {};

                    // Check if rowHeaders exists, handle both 'headers' and 'rowHeaders' property names
                    const rowHeadersData = row.rowHeaders || row.headers || [];

                    // Add row headers
                    rowHeadersData.forEach((header, idx) => {
                        if (!header.skip) {
                            dataRow[`row_header_${idx}`] = header.value || '';
                        }
                    });

                    // Add data cells - handle undefined cells array
                    const cellsData = row.cells || [];
                    cellsData.forEach((cell, idx) => {
                        dataRow[`data_col_${idx}`] = cell;
                    });

                    return dataRow;
                });

                return {
                    headers,
                    data: tableData
                };
            },

            addCrosstabTableWithMerges(tableComponent, tableId) {
                const crosstabStructure = this.get('crosstab-structure');
                if (!crosstabStructure) return;

                const { columnHeaders, rows, structure } = crosstabStructure;

                // Add column headers with merges
                const theadComponent = tableComponent.components().add({
                    type: 'default',
                    tagName: 'thead',
                    style: {
                        'background-color': '#f8f9fa',
                        'border': '1px solid #000'
                    }
                });

                // Render each level of column headers
                columnHeaders.forEach((headerRow, levelIdx) => {
                    const headerRowComponent = theadComponent.components().add({
                        type: 'default',
                        tagName: 'tr'
                    });

                    headerRow.forEach((header, colIdx) => {
                        if (header.skip) return; // Skip cells that are part of a merge

                        const attributes = {
                            id: `${tableId}-colheader-${levelIdx}-${colIdx}`
                        };

                        if (header.colspan && header.colspan > 1) {
                            attributes.colspan = header.colspan.toString();
                        }
                        if (header.rowspan && header.rowspan > 1) {
                            attributes.rowspan = header.rowspan.toString();
                        }

                        headerRowComponent.components().add({
                            type: 'json-table-cell',
                            tagName: 'th',
                            content: `<div>${header.value || ''}</div>`,
                            selectable: true,
                            attributes,
                            style: {
                                'padding': '8px',
                                'border': '1px solid #000',
                                'font-weight': 'bold',
                                'text-align': 'center'
                            }
                        });
                    });
                });

                // Add table body with merged row headers
                const tbodyComponent = tableComponent.components().add({
                    type: 'default',
                    tagName: 'tbody'
                });

                rows.forEach((row, rowIdx) => {
                    const rowComponent = tbodyComponent.components().add({
                        type: 'default',
                        tagName: 'tr',
                        style: {
                            'background-color': rowIdx % 2 === 0 ? '#ffffff' : '#f8f9fa'
                        }
                    });

                    // Add row headers with merges
                    // Add row headers with merges
                    const rowHeadersData = row.rowHeaders || row.headers || [];
                    rowHeadersData.forEach((header, headerIdx) => {
                        if (header.skipFirst) return; // Skip if this header cell is merged from previous row

                        const attributes = {
                            id: `${tableId}-rowheader-${rowIdx}-${headerIdx}`,
                            'data-row': rowIdx.toString(),
                            'data-column-key': `row_header_${headerIdx}`
                        };

                        if (header.rowspan && header.rowspan > 1) {
                            attributes.rowspan = header.rowspan.toString();
                        }

                        rowComponent.components().add({
                            type: 'json-table-cell',
                            tagName: 'th',
                            content: `<div>${header.value || ''}</div>`,
                            selectable: true,
                            attributes,
                            style: {
                                'padding': '8px',
                                'border': '1px solid #000',
                                'font-weight': 'bold',
                                'background-color': '#f8f9fa'
                            }
                        });
                    });

                    // Add data cells
                    row.cells.forEach((cellValue, cellIdx) => {
                        const cellId = `${tableId}-cell-${rowIdx}-${cellIdx}`;

                        rowComponent.components().add({
                            type: 'json-table-cell',
                            tagName: 'td',
                            content: `<div style="text-align: left;">${cellValue}</div>`,
                            selectable: true,
                            attributes: {
                                id: cellId,
                                'data-row': rowIdx.toString(),
                                'data-column-key': `data_col_${cellIdx}`
                            },
                            style: {
                                'padding': '8px',
                                'border': '1px solid #000'
                            }
                        });
                    });
                });
            },

            calculateColumnStructure(columnHeaders) {
                const leafColumns = [];

                function traverse(headers, path = []) {
                    if (headers.length === 0) {
                        leafColumns.push({ fullPath: [...path] });
                        return;
                    }

                    const [currentHeader, ...restHeaders] = headers;
                    const values = typeof currentHeader.values === 'object' && !Array.isArray(currentHeader.values)
                        ? (path.length > 0 ? currentHeader.values[path[path.length - 1]] || [] : Object.keys(currentHeader.values))
                        : currentHeader.values;

                    values.forEach(value => {
                        traverse(restHeaders, [...path, value]);
                    });
                }

                traverse(columnHeaders);
                return { leafColumns };
            },

            calculateRowStructure(rowHeaders, data) {
                const rows = [];

                function traverse(headers, path = [], dataNode = data) {
                    if (headers.length === 0) {
                        rows.push({ path: [...path] });
                        return;
                    }

                    const [currentHeader, ...restHeaders] = headers;
                    const values = typeof currentHeader.values === 'object' && !Array.isArray(currentHeader.values)
                        ? (path.length > 0 ? currentHeader.values[path[path.length - 1]] || [] : Object.keys(currentHeader.values))
                        : currentHeader.values;

                    values.forEach(value => {
                        const nextDataNode = dataNode && dataNode[value];
                        traverse(restHeaders, [...path, value], nextDataNode);
                    });
                }

                traverse(rowHeaders);
                return rows;
            },

            getCrosstabValue(data, rowPath, colPath) {
                let current = data;

                for (const key of rowPath) {
                    if (!current || !current[key]) return null;
                    current = current[key];
                }

                for (const key of colPath) {
                    if (!current || !current[key]) return null;
                    current = current[key];
                }

                return typeof current === 'number' ? current : null;
            },

            calculateRowTotal(data, rowPath, leafColumns) {
                let total = 0;
                leafColumns.forEach(col => {
                    const value = this.getCrosstabValue(data, rowPath, col.fullPath);
                    if (value !== null) total += value;
                });
                return total;
            },

            calculateColumnTotal(data, rowStructure, colPath) {
                let total = 0;
                rowStructure.forEach(rowDef => {
                    const value = this.getCrosstabValue(data, rowDef.path, colPath);
                    if (value !== null) total += value;
                });
                return total;
            },

            calculateGrandTotal(data, rowStructure, leafColumns) {
                let total = 0;
                rowStructure.forEach(rowDef => {
                    leafColumns.forEach(col => {
                        const value = this.getCrosstabValue(data, rowDef.path, col.fullPath);
                        if (value !== null) total += value;
                    });
                });
                return total;
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
                const selectedRunningTotalColumns = this.get('selected-running-total-columns') || [];

                if (updatedData[rowIndex]) {
                    // Update the data model
                    updatedData[rowIndex] = { ...updatedData[rowIndex], [columnKey]: newValue };

                    const cellId = `cell-${rowIndex}-${columnKey}`;
                    this.set('custom-data', updatedData);
                    this.set(`cell-content-${cellId}`, newValue);

                    // Update only the specific cell in the DOM
                    this.updateSingleCell(rowIndex, columnKey, newValue);

                    // Check if this column has a running total and recalculate only that
                    if (selectedRunningTotalColumns.includes(columnKey)) {
                        this.recalculateRunningTotalsForColumn(columnKey);
                    }
                }
            },

            updateSingleCell(rowIndex, columnKey, newValue) {
                const tableId = this.cid ? `json-table-${this.cid}` : null;
                if (!tableId) return;

                const canvasDoc = editor.Canvas.getDocument();
                const cellId = `${tableId}-cell-${rowIndex}-${columnKey}`;
                const cellElement = canvasDoc.getElementById(cellId);

                if (cellElement) {
                    const cellContent = cellElement.querySelector('div');
                    if (cellContent) {
                        cellContent.textContent = newValue;
                    }

                    // Update DataTable cell if it exists
                    if (canvasDoc.defaultView.$ && canvasDoc.defaultView.$.fn.DataTable.isDataTable(`#${tableId}`)) {
                        const dt = canvasDoc.defaultView.$(`#${tableId}`).DataTable();
                        const cell = dt.cell(cellElement);
                        if (cell) {
                            cell.data(newValue).draw(false); // false = don't redraw entire table
                        }
                    }
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

            updateHeaderData(columnKey, newValue) {
                const headers = this.get('custom-headers') || this.get('table-headers') || {};
                const updatedHeaders = { ...headers, [columnKey]: newValue };
                this.set('custom-headers', updatedHeaders);
                this.set(`header-content-${columnKey}`, newValue);

                // Update only the specific header in DOM
                this.updateSingleHeader(columnKey, newValue);

                // DO NOT call updateTableHTML() here
            },

            updateSingleHeader(columnKey, newValue) {
                const tableId = this.cid ? `json-table-${this.cid}` : null;
                if (!tableId) return;

                const canvasDoc = editor.Canvas.getDocument();
                const headerId = `${tableId}-header-${columnKey}`;
                const headerElement = canvasDoc.getElementById(headerId);

                if (headerElement) {
                    const headerContent = headerElement.querySelector('div');
                    if (headerContent) {
                        headerContent.textContent = newValue;
                    }
                }
            },

            addDataTableSortingFeatures(tableId) {
                const canvasDoc = editor.Canvas.getDocument();
                const tableElement = canvasDoc.getElementById(tableId);

                if (!tableElement || !canvasDoc.defaultView.$) return;

                // Add sort arrows to headers
                const headers = tableElement.querySelectorAll('thead th');
                headers.forEach((header, index) => {
                    if (!header.querySelector('.sort-arrow')) {
                        const sortArrow = canvasDoc.createElement('span');
                        sortArrow.className = 'sort-arrow';
                        sortArrow.innerHTML = ' ↕️';
                        sortArrow.style.cssText = `
                cursor: pointer;
                margin-left: 5px;
                user-select: none;
                float: right;
            `;

                        // Prevent header cell editing when clicking arrow
                        sortArrow.addEventListener('click', (e) => {
                            e.stopPropagation();
                            e.preventDefault();

                            const dt = canvasDoc.defaultView.$(tableElement).DataTable();
                            const currentOrder = dt.order();

                            // Toggle sort order: none -> asc -> desc -> none
                            let newOrder = [index, 'asc'];
                            if (currentOrder.length && currentOrder[0][0] === index) {
                                if (currentOrder[0][1] === 'asc') {
                                    newOrder = [index, 'desc'];
                                } else {
                                    // Clear sorting
                                    dt.order([]).draw();
                                    return;
                                }
                            }

                            dt.order(newOrder).draw();
                        });

                        header.appendChild(sortArrow);
                    }
                });
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
                    selectable: false,
                    classes: ['json-table-wrapper'],
                    style: {
                        'width': '99.5%',
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

                // Add the main table component - THIS IS KEY: it remains a GrapesJS component
                const tableComponent = wrapperComponent.components().add({
                    type: 'default',
                    tagName: 'table',
                    classes: ['json-data-table', 'table', 'table-striped', 'table-bordered'],
                    attributes: {
                        id: tableId,
                        width: '100%'
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

                // Check if this is a crosstab table
                const isCrosstab = this.get('crosstab-structure') !== undefined;

                if (isCrosstab) {
                    // Use special crosstab rendering with merges
                    this.addCrosstabTableWithMerges(tableComponent, tableId);
                } else {
                    // Standard table rendering
                    this.addTableHeader(tableComponent, headers, tableId);
                    this.addTableBody(tableComponent, headers, data, tableId);
                }

                // Add footer if enabled (for standard tables only)
                if (!isCrosstab && footer === 'yes') {
                    this.addTableFooter(tableComponent, headers);
                }

                // Add styles component
                this.addStylesComponent(wrapperComponent);

                // Add DataTables initialization script AFTER the GrapesJS components are created
                const datatableScript = this.createDataTableScript(tableId, pagination, pageLength, search, fileDownload, Object.keys(headers).length);
                wrapperComponent.components().add(datatableScript);

                // Apply highlighting and formulas after DOM is ready
                setTimeout(() => {
                    const conditions = this.getHighlightConditions();
                    const color = this.get('highlight-color');
                    if (conditions && conditions.length > 0) {
                        applyHighlighting(tableId, conditions, color);
                    }
                    // Enable formula editing on the GrapesJS components
                    this.enableFormulaEditingOnComponents(tableId);
                }, 500);
            },


            createDataTableScript(tableId, pagination, pageLength, search, fileDownload, colCount) {
                let downloadBtn = '[]';
                if (fileDownload) {
                    const downloadOptions = fileDownload.replace(/"/g, '').split(',').map(opt => opt.trim());
                    downloadBtn = '[' + downloadOptions.map(opt => {
                        if (opt === 'print') {
                            return `{
                    extend: 'print',
                    title: '${this.get('name') || 'Table'}',
                    customize: function(win) {
                        const table = $(win.document.body).find('table');
                        table.addClass('json-data-table');  // Ensure class is added for any matching styles
                        table.css({
                            'border-collapse': 'collapse',
                            'border': '2px solid #000',
                            'width': '100%'
                        });
                        table.find('th, td').css({
                            'border': '1px solid #000',
                            'padding': '8px',
                            'text-align': 'left'
                        });
                        table.find('th').css({
                            'background-color': '#f8f9fa',
                            'font-weight': 'bold'
                        });
                        table.find('td').css({
                            'background-color': '#fff'
                        });
                        // Hide any unnecessary elements in print
                        $(win.document.body).find('.dt-buttons, .dataTables_info').remove();
                    }
                }`;
                        } else {
                            return `{extend: '${opt}', title: '${this.get('name') || 'Table'}'}`;
                        }
                    }).join(',') + ']';
                }
                const scriptContent = `
(function() {
    function initTable() {
        if (typeof $ === 'undefined' || typeof $.fn.DataTable === 'undefined') {
            setTimeout(initTable, 100);
            return;
        }
        
        const tableElement = document.getElementById('${tableId}');
        if (!tableElement) {
            setTimeout(initTable, 100);
            return;
        }
        
        // Store formula data before DataTable initialization
        const formulaCells = tableElement.querySelectorAll('[data-formula]');
        const formulaData = Array.from(formulaCells).map(cell => ({
            cell: cell,
            formula: cell.getAttribute('data-formula'),
            calculatedValue: cell.getAttribute('data-calculated-value'),
            id: cell.id || cell.getAttribute('data-row') + '-' + cell.getAttribute('data-column-key')
        }));
        
        // Destroy existing DataTable if it exists
        if ($.fn.DataTable.isDataTable(tableElement)) {
            $(tableElement).DataTable().destroy();
        }
        
        const isInPageSystem = tableElement.closest('.page-container');
        
        const dtOptions = {
            dom: 'Bfrtip',
            paging: ${pagination === 'yes'},
            info: ${pagination === 'yes'},
            lengthChange: true,
            pageLength: ${pageLength},
            fixedHeader: false,
            scrollX: ${colCount > 5},
            fixedColumns: ${colCount > 5},
            searching: ${search === 'yes'},
            buttons: ${downloadBtn},
            ordering: false,
            order: [], 
            ],
            drawCallback: function() {
                // Restore formula data after DataTable draw
                setTimeout(() => {
                    formulaData.forEach(data => {
                        const cell = document.getElementById(data.id) ||
                                   tableElement.querySelector('[data-row="' + data.id.split('-')[0] + '"][data-column-key="' + data.id.split('-')[1] + '"]');
                        if (cell) {
                            if (data.formula) cell.setAttribute('data-formula', data.formula);
                            if (data.calculatedValue) {
                                cell.setAttribute('data-calculated-value', data.calculatedValue);
                                const cellContent = cell.querySelector('div');
                                if (cellContent) {
                                    cellContent.textContent = data.calculatedValue;
                                }
                            }
                        }
                    });
                    
                    // Trigger custom event to re-enable formulas
                    const event = new CustomEvent('datatableRedrawn', {
                        detail: { tableId: '${tableId}', formulaData: formulaData }
                    });
                    document.dispatchEvent(event);
                }, 100);
                
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
    }
    
    initTable();
})();
`;
                return {
                    type: 'default',
                    tagName: 'script',
                    content: scriptContent,
                    attributes: {
                        type: 'text/javascript'
                    }
                };
            },


            // 3. ADD this function to enable formulas on GrapesJS components:

            enableFormulaEditingOnComponents(tableId) {
                // Listen for DataTable redraws
                document.addEventListener('datatableRedrawn', (e) => {
                    if (e.detail.tableId === tableId) {
                        this.attachFormulaHandlersToComponents(tableId);
                        // Re-attach handlers after DataTable operations
                        setTimeout(() => {
                            this.reattachAllCellHandlers(tableId);
                        }, 150);
                    }
                });

                // Listen for DataTable initialization
                document.addEventListener('datatableInitialized', (e) => {
                    if (e.detail.tableId === tableId) {
                        setTimeout(() => {
                            this.reattachAllCellHandlers(tableId);
                        }, 300);
                    }
                });

                // Initial attachment
                this.attachFormulaHandlersToComponents(tableId);
            },

            // 4. ADD this function to attach formula handlers to GrapesJS components:

            attachFormulaHandlersToComponents(tableId) {
                const canvasDoc = editor.Canvas.getDocument();
                const canvasWindow = canvasDoc.defaultView;

                // ✅ Use or create global parser with custom formulas
                let parser = canvasWindow.globalFormulaParser;

                if (!parser && canvasWindow.formulaParser) {
                    parser = new canvasWindow.formulaParser.Parser();
                    canvasWindow.globalFormulaParser = parser;

                    // Register custom formulas
                    if (parser.setFunction) {
                        parser.setFunction('PERCENT', function (params) {
                            if (params.length !== 2) return '#N/A';
                            const base = parseFloat(params[0]);
                            const percent = parseFloat(params[1]);
                            if (isNaN(base) || isNaN(percent)) return '#VALUE!';
                            return base * (percent / 100);
                        });

                        parser.setFunction('ABSOLUTE', function (params) {
                            if (params.length !== 1) return '#N/A';
                            const num = parseFloat(params[0]);
                            if (isNaN(num)) return '#VALUE!';
                            return Math.abs(num);
                        });

                        if (canvasWindow.numberToWords && canvasWindow.numberToWords.toWords) {
                            parser.setFunction('NUMTOWORDS', function (params) {
                                if (params.length !== 1) return '#N/A';
                                const num = parseInt(params[0]);
                                if (isNaN(num)) return '#VALUE!';
                                try {
                                    return canvasWindow.numberToWords.toWords(num);
                                } catch (error) {
                                    return '#ERROR';
                                }
                            });
                        }
                    }
                }

                if (!parser) {
                    console.warn('Formula parser not available');
                    return;
                }

                // Set up parser callbacks
                parser.on('callCellValue', function (cellCoord, done) {
                    let col = cellCoord.column.index;
                    let row = cellCoord.row.index;
                    let tableElem = canvasDoc.getElementById(tableId);
                    let cell = tableElem?.rows[row]?.cells[col];
                    if (cell) {
                        // Check for calculated value first, then formula, then text
                        let val = cell.getAttribute('data-calculated-value') ||
                            cell.getAttribute('data-formula') ||
                            cell.innerText;
                        if (val.startsWith && val.startsWith('=')) {
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

                parser.on('callRangeValue', function (startCellCoord, endCellCoord, done) {
                    let tableElem = canvasDoc.getElementById(tableId);
                    let values = [];

                    let startRow = Math.min(startCellCoord.row.index, endCellCoord.row.index);
                    let endRow = Math.max(startCellCoord.row.index, endCellCoord.row.index);
                    let startCol = Math.min(startCellCoord.column.index, endCellCoord.column.index);
                    let endCol = Math.max(startCellCoord.column.index, endCellCoord.column.index);

                    for (let row = startRow; row <= endRow; row++) {
                        for (let col = startCol; col <= endCol; col++) {
                            let cell = tableElem?.rows[row]?.cells[col];
                            if (cell) {
                                let val = cell.getAttribute('data-calculated-value') ||
                                    cell.getAttribute('data-formula') ||
                                    cell.innerText;
                                if (val.startsWith && val.startsWith('=')) {
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

                // Find table cells in GrapesJS component tree and attach handlers
                const tableComponent = this.components().find(comp => {
                    return comp.find(`#${tableId}`).length > 0;
                });

                if (tableComponent) {
                    const actualTable = tableComponent.find('table')[0];
                    if (actualTable) {
                        // Find all cell components (td, th)
                        const cellComponents = actualTable.find('td, th');

                        cellComponents.forEach(cellComp => {
                            const cellEl = cellComp.getEl();
                            if (cellEl && !cellEl.hasAttribute('data-formula-enabled')) {
                                this.attachCellFormulaHandler(cellComp, cellEl, parser);
                            }
                        });
                    }
                }
            },


            // 5. ADD this function to attach formula handlers to individual cells:

            attachCellFormulaHandler(cellComponent, cellElement, parser) {
                // Skip if already has handlers
                if (cellElement.hasAttribute('data-formula-enabled')) {
                    return;
                }

                cellElement.setAttribute('data-formula-enabled', 'true');

                const cellContent = cellElement.querySelector('div') || (() => {
                    // If no div exists, create one and move content into it
                    const existingContent = cellElement.textContent;
                    cellElement.innerHTML = '';
                    const newDiv = document.createElement('div');
                    newDiv.className = 'cell-content';
                    newDiv.textContent = existingContent;
                    cellElement.appendChild(newDiv);
                    return newDiv;
                })();

                cellContent.contentEditable = 'true';

                const handleFocus = () => {
                    const formula = cellElement.getAttribute('data-formula');
                    if (formula) {
                        cellContent.textContent = formula;
                    }
                    cellContent.setAttribute('data-editing', 'true');
                    cellElement.classList.add('editing');
                };

                const handleBlur = () => {
                    cellContent.removeAttribute('data-editing');
                    cellElement.classList.remove('editing');

                    const val = cellContent.textContent.trim();
                    const rowIndex = cellElement.getAttribute('data-row');
                    const columnKey = cellElement.getAttribute('data-column-key');
                    const isHeader = cellElement.tagName === 'TH';

                    if (isHeader) {
                        cellElement.removeAttribute('data-formula');
                        cellElement.removeAttribute('data-calculated-value');
                        cellContent.textContent = val;
                        cellElement.classList.remove('formula-error');

                        if (columnKey) {
                            this.updateHeaderData(columnKey, val);
                        }
                    } else if (val.startsWith('=')) {
                        cellElement.setAttribute('data-formula', val);
                        try {
                            const formulaContent = val.substring(1).trim();
                            if (!formulaContent) throw new Error('Empty formula');

                            // ✅ Use the global parser with custom formulas instead of local parser
                            const canvasWindow = cellElement.ownerDocument.defaultView;
                            let formulaParser = canvasWindow.globalFormulaParser;

                            // If global parser doesn't exist, create it and register custom formulas
                            if (!formulaParser && canvasWindow.formulaParser) {
                                formulaParser = new canvasWindow.formulaParser.Parser();
                                canvasWindow.globalFormulaParser = formulaParser;

                                // Register custom formulas on this parser instance
                                if (formulaParser.setFunction) {
                                    // PERCENT
                                    formulaParser.setFunction('PERCENT', function (params) {
                                        if (params.length !== 2) return '#N/A';
                                        const base = parseFloat(params[0]);
                                        const percent = parseFloat(params[1]);
                                        if (isNaN(base) || isNaN(percent)) return '#VALUE!';
                                        return base * (percent / 100);
                                    });

                                    // ABSOLUTE
                                    formulaParser.setFunction('ABSOLUTE', function (params) {
                                        if (params.length !== 1) return '#N/A';
                                        const num = parseFloat(params[0]);
                                        if (isNaN(num)) return '#VALUE!';
                                        return Math.abs(num);
                                    });

                                    // NUMTOWORDS
                                    if (canvasWindow.numberToWords && canvasWindow.numberToWords.toWords) {
                                        formulaParser.setFunction('NUMTOWORDS', function (params) {
                                            if (params.length !== 1) return '#N/A';
                                            const num = parseInt(params[0]);
                                            if (isNaN(num)) return '#VALUE!';
                                            try {
                                                return canvasWindow.numberToWords.toWords(num);
                                            } catch (error) {
                                                return '#ERROR';
                                            }
                                        });
                                    }
                                }
                            }

                            if (!formulaParser) {
                                throw new Error('Formula parser not available');
                            }

                            const res = formulaParser.parse(formulaContent);
                            if (res.error) throw new Error(res.error);

                            const result = (res.result !== undefined && res.result !== null) ? res.result : '#ERROR';

                            cellContent.textContent = result;
                            cellElement.classList.remove('formula-error');
                            cellElement.setAttribute('data-calculated-value', result);

                            if (rowIndex !== null && columnKey) {
                                const data = this.get('custom-data') || this.get('table-data') || [];
                                const updatedData = [...data];
                                if (updatedData[parseInt(rowIndex)]) {
                                    updatedData[parseInt(rowIndex)] = {
                                        ...updatedData[parseInt(rowIndex)],
                                        [columnKey]: result
                                    };
                                    this.set('custom-data', updatedData, { silent: true });
                                }
                            }
                        } catch (error) {
                            console.warn('Formula parsing error:', error);
                            cellContent.textContent = '#ERROR';
                            cellElement.classList.add('formula-error');
                            cellElement.setAttribute('data-calculated-value', '#ERROR');
                        }
                    } else {
                        cellElement.removeAttribute('data-formula');
                        cellElement.removeAttribute('data-calculated-value');
                        cellContent.textContent = val;
                        cellElement.classList.remove('formula-error');

                        if (rowIndex !== null && columnKey) {
                            this.updateCellData(parseInt(rowIndex), columnKey, val);
                        }
                    }

                    setTimeout(() => {
                        if (!cellElement.querySelector('div')) {
                            const newDiv = document.createElement('div');
                            newDiv.textContent = cellContent.textContent || val;
                            newDiv.contentEditable = 'true';
                            newDiv.className = 'cell-content';
                            cellElement.innerHTML = '';
                            cellElement.appendChild(newDiv);
                        } else {
                            const existingDiv = cellElement.querySelector('div');
                            existingDiv.contentEditable = 'true';
                        }
                    }, 10);
                };

                // Rest of the function remains the same...
                const handleKeydown = (e) => {
                    if (e.key === 'Tab') {
                        e.preventDefault();
                        cellContent.blur();

                        const table = cellElement.closest('table');
                        const allCells = Array.from(table.querySelectorAll('td[data-formula-enabled], th[data-formula-enabled]'));
                        const currentIndex = allCells.indexOf(cellElement);

                        let nextIndex;
                        if (e.shiftKey) {
                            nextIndex = currentIndex > 0 ? currentIndex - 1 : allCells.length - 1;
                        } else {
                            nextIndex = currentIndex < allCells.length - 1 ? currentIndex + 1 : 0;
                        }

                        const nextCell = allCells[nextIndex];
                        const nextCellContent = nextCell.querySelector('div') || nextCell;
                        setTimeout(() => {
                            nextCellContent.contentEditable = 'true';
                            nextCellContent.focus();
                        }, 20);
                    } else if (e.key === 'Enter') {
                        e.preventDefault();
                        cellContent.blur();
                    }
                };

                cellContent.addEventListener('focus', handleFocus, { passive: false });
                cellContent.addEventListener('blur', handleBlur, { passive: false });
                cellContent.addEventListener('keydown', handleKeydown, { passive: false });

                cellElement._formulaHandlers = { handleFocus, handleBlur, handleKeydown };
                cellElement._cellContent = cellContent;
            },

            // Add this new method right after attachCellFormulaHandler:
            reattachAllCellHandlers(tableId) {
                const canvasDoc = editor.Canvas.getDocument();
                const parser = canvasDoc.defaultView.formulaParser ? new canvasDoc.defaultView.formulaParser.Parser() : null;

                if (!parser) return;

                // Set up parser callbacks again
                parser.on('callCellValue', function (cellCoord, done) {
                    let col = cellCoord.column.index;
                    let row = cellCoord.row.index;
                    let tableElem = canvasDoc.getElementById(tableId);
                    let cell = tableElem?.rows[row]?.cells[col];
                    if (cell) {
                        let val = cell.getAttribute('data-calculated-value') ||
                            cell.getAttribute('data-formula') ||
                            cell.innerText;
                        if (val.startsWith && val.startsWith('=')) {
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

                parser.on('callRangeValue', function (startCellCoord, endCellCoord, done) {
                    let tableElem = canvasDoc.getElementById(tableId);
                    let values = [];

                    let startRow = Math.min(startCellCoord.row.index, endCellCoord.row.index);
                    let endRow = Math.max(startCellCoord.row.index, endCellCoord.row.index);
                    let startCol = Math.min(startCellCoord.column.index, endCellCoord.column.index);
                    let endCol = Math.max(startCellCoord.column.index, endCellCoord.column.index);

                    for (let row = startRow; row <= endRow; row++) {
                        for (let col = startCol; col <= endCol; col++) {
                            let cell = tableElem?.rows[row]?.cells[col];
                            if (cell) {
                                let val = cell.getAttribute('data-calculated-value') ||
                                    cell.getAttribute('data-formula') ||
                                    cell.innerText;
                                if (val.startsWith && val.startsWith('=')) {
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

                // Re-enable all cells
                const tableElement = canvasDoc.getElementById(tableId);
                if (tableElement) {
                    const allCells = tableElement.querySelectorAll('td, th');
                    allCells.forEach(cell => {
                        if (!cell.hasAttribute('data-formula-enabled')) {
                            this.attachCellFormulaHandler(null, cell, parser);
                        } else {
                            // Re-ensure contentEditable for existing cells
                            const cellContent = cell.querySelector('div') || cell;
                            cellContent.contentEditable = 'true';
                        }
                    });
                }
            },


            addPlaceholderComponent() {
                const tableHeaders = this.get('table-headers');
                const filterColumn = this.get('filter-column');
                const filterValue = this.get('filter-value');
                const tableType = this.get('table-type') || 'standard';

                this.components().add({
                    type: 'default',
                    tagName: 'json-table',
                    selectable: false,
                    classes: ['json-table-placeholder'],
                    content: `
            <h3 style="margin: 0 0 10px 0; color: #495057;">JSON Table</h3>
        `,
                    style: {
                        'width': '100%',
                        'min-height': '70px',
                        'padding': '15px',
                        'display': 'flex',
                        'flex-direction': 'column',
                        'align-items': 'center',
                        'justify-content': 'center',
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
                        type: 'json-table-cell',
                        tagName: 'th',
                        contenteditable: true,
                        content: `<div>${storedHeader}</div>`,
                        selectable: true,
                        contentEditable: true,
                        classes: ['json-table-cell', 'cell-content', 'editable-header'],
                        attributes: {
                            id: headerId,
                            'data-column-key': key,
                            'data-gjs-hoverable': 'true',
                        },
                        style: {
                            'padding': '8px',
                            'width': 'auto',
                            'height': '100%',
                            'text-align': 'left',
                            'box-sizing': 'border-box',
                            'border': '1px solid #000000ff',
                            'font-weight': 'bold',
                            'position': 'relative'
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
                        const displayValue = row[key] || '';

                        const cellComponent = rowComponent.components().add({
                            type: 'json-table-cell',
                            tagName: 'td',
                            selectable: true,
                            contenteditable: true,
                            content: `<div style="text-align: left;">${displayValue}</div>`,
                            classes: ['json-table-cell', 'cell-content', 'editable-cell'],
                            attributes: {
                                id: cellId,
                                'data-row': rowIndex.toString(),
                                'data-column-key': key,
                                'data-gjs-hoverable': 'true'
                            },
                            style: {
                                'padding': '8px',
                                'border': '1px solid #000',
                                'position': 'relative',
                                'width': 'auto',
                                'height': '100%',
                                'box-sizing': 'border-box',
                                ...cellStyles
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
    overflow-x: visible;
    overflow-y: visible;
}

/* Only show scroll when actually needed */
.json-table-wrapper .dataTables_wrapper {
    overflow-x: auto;
    overflow-y: visible;
}

.json-data-table {
    width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
    border: 2px solid #000;
}


/* Formula editing styles */
.formula-error {
    background-color: #ffebee !important;
    color: #c62828 !important;
}
/* Apply editing styles to cell-content div */
.cell-content.editing {
    background-color: #e3f2fd !important;
    outline: 2px solid #007bff !important;
    min-height: inherit;
    overflow: hidden;
}

.cell-content[contenteditable="true"] {
    text-align: left !important;
}
td[data-highlighted="true"], th[data-highlighted="true"] {
    position: relative;
    box-sizing: border-box !important;
    border: 1px solid #000 !important;
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
                        contentEditable: true,
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
                            'width': 'auto',
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
                'click': 'handleOutsideClick',
            },

            handleCellClick(e) {
                console.log("singleclick started");
                e.preventDefault();
                e.stopPropagation();

                const cell = e.target.closest('td, th');
                if (!cell) return;

                // Remove selection from all cells
                const allCells = this.el.querySelectorAll('td, th');
                allCells.forEach(c => {
                    c.className = ""; // remove everything
                });

                // Apply ONLY these two classes
                cell.className = "i_designer_selected i_designer-selected";

                console.log("✅ final cell classes:", cell.className);
            },
            // Outside click = clear selection


            // Editing start
            startCellEditing(cell, cellContent) {
                console.log("editor cell editing stared")
                cell.classList.remove('i_designer_hovered');
                const isHeader = cellContent.classList.contains('editable-header');

                const currentValue = cellContent.textContent;
                const input = document.createElement('input');
                input.type = 'text';
                input.value = currentValue;
                input.className = isHeader ? 'header-input' : 'cell-input';

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
                const cellContent = cell.querySelector('.cell-content');
                console.log("cellllcontentttt", cellContent)
                const input = cell.querySelector('.cell-input, .header-input');
                if (!input || !cellContent) return;

                const rowIndex = cell.getAttribute('data-row');
                const columnKey = cell.getAttribute('data-column-key');
                const isHeader = cell.classList.contains('editable-header');
                const newValue = input.value;

                // Clean up editing
                cell.removeChild(input);

                // Update data
                if (isHeader) {
                    this.model.updateHeaderData(columnKey, newValue);
                    cellContent.innerHTML = newValue;
                } else {
                    console.log("stopcell editing, updatedata called")
                    this.model.updateCellData(parseInt(rowIndex), columnKey, newValue);
                }

                console.log("✅ Final classes for cell:", cell.className, "value:", newValue);
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
    
    <div id="column-list" style="border: 1px solid #ddd; border-radius: 5px; ">
        ${columnKeys.map((key, index) => `
            <div class="column-item" data-key="${key}" style="
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

.column-item.dragging {
    opacity: 0.5;
    transform: rotate(5deg);
}

</style>`;

            const modal = editor.Modal;
            modal.setTitle('Reorder Table Columns');
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
            modal.setTitle('Running Total');
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
                margin: 2px; 
                padding: 12px 15px; 
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


    //     // Add CSS for better styling
    //     const tableCSS = `
    // <style>

    // .json-data-table th,
    // .json-data-table td {
    //     border: 1px solid #000;
    //     padding: 8px;
    //     text-align: left;
    //     background-color: #fff;
    // }

    // .json-data-table th {
    //     background-color: #f8f9fa;
    //     font-weight: bold;
    // }


    //     </style>`;

    //     // Inject CSS
    //     if (!document.querySelector('#json-table-styles')) {
    //         const styleElement = document.createElement('style');
    //         styleElement.id = 'json-table-styles';
    //         styleElement.innerHTML = tableCSS;
    //         document.head.appendChild(styleElement);
    //     }


    //     editor.DomComponents.addType('json-table-cell', {
    //     isComponent: el => (el.tagName === 'TD' || el.tagName === 'TH') && 
    //                       el.closest('.json-data-table'),
    //     model: {
    //         defaults: {
    //             tagName: 'td',
    //             selectable: true,
    //             hoverable: true,
    //             editable: true,
    //             droppable: false,
    //             draggable: false,
    //             removable: false,
    //             copyable: false,
    //             resizable: false,
    //             'custom-name': 'Table Cell'
    //         },

    //     },

    //     view: {
    //         events: {
    //             'dblclick': 'startEditing'
    //         },

    //         startEditing(e) {
    //             e.stopPropagation();
    //             const cellEl = this.el;
    //             const cellContent = cellEl.querySelector('div') || cellEl;
    //             cellContent.focus();
    //         },

    //         onRender() {
    //             // Restore calculated value if it exists after render
    //             const cellEl = this.el;
    //             const calculatedValue = cellEl.getAttribute('data-calculated-value');
    //             const formula = cellEl.getAttribute('data-formula');

    //             if (calculatedValue && formula) {
    //                 setTimeout(() => {
    //                     const cellContent = cellEl.querySelector('div');
    //                     if (cellContent && cellContent.textContent !== calculatedValue) {
    //                         cellContent.textContent = calculatedValue;
    //                     }
    //                 }, 10);
    //             }
    //         }
    //     }
    // })
}