function jsontablecustom(editor) {

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
                        const fontSize = conditions[0].fontSize || '';

                        td.style.backgroundColor = bgColor;
                        td.style.border = '1px solid #000';
                        if (textColor) td.style.color = textColor;
                        if (fontFamily) td.style.fontFamily = fontFamily;
                        if (fontSize) td.style.fontSize = fontSize + 'px';
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
                                if (fontSize) styles['font-size'] = fontSize + 'px';

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

    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
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
                    {
                        type: 'button',
                        name: 'table-settings-btn',
                        label: 'Table Settings',
                        text: 'Table Settings',
                        full: true,
                        command: 'open-table-settings-modal'
                    },
                    // Add highlighting traits from custom table
                    {
                        type: 'button',
                        name: 'manage-table-styles',
                        label: 'Table Styles',
                        text: 'Customize Table Styles',
                        full: true,
                        command: 'open-table-style-manager'
                    },
                    {
                        type: 'button',
                        name: 'manage-highlight-conditions',
                        label: ' Highlight',
                        text: 'Highlight Conditions',
                        full: true,
                        command: 'open-table-condition-manager-json-table'
                    },
                ],
                'json-path': '',
                'table-data': null,
                'table-headers': null,
                'custom-data': null,
                'custom-headers': null,
                'cell-styles': {},
                'selected-cell': null,
                'highlight-conditions': [],
                'highlight-condition-type': '',
                'highlight-words': '',
                'highlight-color': '#ffff99',
                'highlight-text-color': '',
                'highlight-font-family': '',
                'show-placeholder': true,
                'table-border-style': 'solid',
                'table-border-width': '1',
                'table-border-color': '#000000',
                'table-border-opacity': '100',
                'table-bg-color': '#ffffff',
                'table-text-color': '#000000',
                'table-font-family': 'Arial, sans-serif',
                'table-text-align': 'left',
                'table-vertical-align': 'middle',
                'grouping-fields': [],
                'summary-fields': [],
                'sort-order': 'ascending',
                'top-n': 'none',
                'define-named-group': false,
                'summarize-group': false,
                'page-break-after-group': false,
                'summary-percentage': 'none',
                'merge-group-cells': false,
                'group-header-inplace': true,
                'hide-subtotal-single-row': false,
                'show-summary-only': false,
                'keep-group-hierarchy': false,
                'running-totals': [],
                'grand-total': true,
                'grand-total-label': '',
                'summary-label': ''
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

                this.on('change:grouping-fields change:summary-fields change:sort-order change:top-n change:summarize-group change:merge-group-cells change:show-summary-only change:grand-total', () => {
                    this.applyGroupingAndSummary();
                });
                this.on('change:name change:footer change:pagination change:page-length change:search change:caption change:caption-align', this.updateDataTableSettings);

                // Keep highlight changes separate
                this.on('change:highlight-conditions change:highlight-color', this.handleHighlightChange);
                this.on('change:table-border-style change:table-border-width change:table-border-color change:table-border-opacity change:table-bg-color change:table-text-color change:table-font-family change:table-text-align change:table-vertical-align', this.applyTableStyles);

                this.set('show-placeholder', true);
                this.updateTableHTML();

                // Add this in the model's init() function
                editor.on('component:update', (component) => {
                    // Preserve json-table components when code is updated
                    if (component.get('type') === 'json-table') {
                        const jsonPath = component.get('json-path');
                        const customData = component.get('custom-data');
                        const customHeaders = component.get('custom-headers');

                        // Store critical data
                        if (jsonPath) {
                            component.set('_preserved_json_path', jsonPath);
                        }
                        if (customData) {
                            component.set('_preserved_custom_data', customData);
                        }
                        if (customHeaders) {
                            component.set('_preserved_custom_headers', customHeaders);
                        }
                    }
                });

                // Restore after code update
                editor.on('run:core:open-code:after', () => {
                    const wrapper = editor.DomComponents.getWrapper();
                    const jsonTables = wrapper.find('[data-gjs-type="json-table"]');

                    jsonTables.forEach(table => {
                        const preservedPath = table.get('_preserved_json_path');
                        const preservedData = table.get('_preserved_custom_data');
                        const preservedHeaders = table.get('_preserved_custom_headers');

                        if (preservedPath) {
                            table.set('json-path', preservedPath);
                        }
                        if (preservedData) {
                            table.set('custom-data', preservedData);
                        }
                        if (preservedHeaders) {
                            table.set('custom-headers', preservedHeaders);
                        }

                        // Force re-render
                        setTimeout(() => {
                            table.updateTableHTML();
                        }, 100);
                    });
                });
            },

            applyTableStyles() {
                const tableId = this.cid ? `json-table-${this.cid}` : null;
                if (!tableId) return;

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

                // Convert opacity to rgba
                const opacity = parseInt(borderOpacity) / 100;
                const rgbBorder = hexToRgb(borderColor);
                const borderColorWithOpacity = `rgba(${rgbBorder.r}, ${rgbBorder.g}, ${rgbBorder.b}, ${opacity})`;

                // Apply to table
                tableElement.style.backgroundColor = bgColor;
                tableElement.style.borderCollapse = 'collapse';

                // Apply to all cells in DOM
                const allCells = tableElement.querySelectorAll('td, th');
                allCells.forEach(cell => {
                    cell.style.border = `${borderWidth}px ${borderStyle} ${borderColorWithOpacity}`;
                    cell.style.color = textColor;
                    cell.style.fontFamily = fontFamily;
                    cell.style.backgroundColor = bgColor;

                    // Apply alignment to the div inside cell
                    const cellContent = cell.querySelector('div');
                    if (cellContent) {
                        cellContent.style.textAlign = textAlign;
                        cellContent.style.verticalAlign = verticalAlign;
                        cellContent.style.display = 'flex';
                        cellContent.style.alignItems = verticalAlign === 'top' ? 'flex-start' :
                            verticalAlign === 'bottom' ? 'flex-end' : 'center';
                        cellContent.style.justifyContent = textAlign === 'left' ? 'flex-start' :
                            textAlign === 'right' ? 'flex-end' : 'center';
                        cellContent.style.minHeight = '100%';
                    }
                });

                // Apply to GrapesJS components - this ensures styles persist
                const wrapper = editor.DomComponents.getWrapper();
                const tableComp = wrapper.find(`#${tableId}`)[0];
                if (tableComp) {
                    tableComp.addStyle({
                        'background-color': bgColor,
                        '-webkit-print-color-adjust': 'exact',
                        'print-color-adjust': 'exact'
                    });

                    const cells = tableComp.find('td, th');
                    cells.forEach(cellComp => {
                        const cellId = cellComp.getId();

                        // Apply styles to cell component
                        cellComp.addStyle({
                            'border': `${borderWidth}px ${borderStyle} ${borderColorWithOpacity}`,
                            'color': textColor,
                            'font-family': fontFamily,
                            'background-color': bgColor,
                            '-webkit-print-color-adjust': 'exact',
                            'print-color-adjust': 'exact'
                        });

                        // Apply alignment to the div inside
                        const divComp = cellComp.find('div')[0];
                        if (divComp) {
                            divComp.addStyle({
                                'text-align': textAlign,
                                'display': 'flex',
                                'align-items': verticalAlign === 'top' ? 'flex-start' :
                                    verticalAlign === 'bottom' ? 'flex-end' : 'center',
                                'justify-content': textAlign === 'left' ? 'flex-start' :
                                    textAlign === 'right' ? 'flex-end' : 'center',
                                'min-height': '100%',
                                'width': '100%'
                            });
                        }
                    });
                }

                // Store table styles for later reference
                this.set('table-styles-applied', {
                    borderStyle, borderWidth, borderColor, borderOpacity,
                    bgColor, textColor, fontFamily, textAlign, verticalAlign
                });
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

                        const tableStyles = this.get('table-styles-applied');
                        const cellStyles = tableStyles ? {
                            'border': `${tableStyles.borderWidth}px ${tableStyles.borderStyle} ${tableStyles.borderColor}`,
                            'color': tableStyles.textColor,
                            'font-family': tableStyles.fontFamily,
                            'background-color': tableStyles.bgColor
                        } : {
                            'border': '1px solid #000',
                            'font-weight': 'bold'
                        };

                        const alignStyles = tableStyles ? `display: flex; align-items: ${tableStyles.verticalAlign === 'top' ? 'flex-start' : tableStyles.verticalAlign === 'bottom' ? 'flex-end' : 'center'}; justify-content: ${tableStyles.textAlign === 'left' ? 'flex-start' : tableStyles.textAlign === 'right' ? 'flex-end' : 'center'}; min-height: 100%; width: 100%;` : '';

                        headerRowComponent.components().add({
                            type: 'json-table-cell',
                            tagName: 'th',
                            content: `<div style="${alignStyles}">${header.value || ''}</div>`,
                            selectable: true,
                            attributes,
                            style: {
                                ...cellStyles,
                                'padding': '8px',
                                'text-align': 'center',
                                '-webkit-print-color-adjust': 'exact',
                                'print-color-adjust': 'exact'
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
                        width: '100%',
                    },
                    style: {
                        'width': '100%',
                        'border-collapse': 'collapse',
                        'border': '1px solid #ddd',
                        'font-family': 'Arial, sans-serif',
                        'my-input-json': this.get('json-path') || ''
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

            applyGroupingAndSummary() {
                const groupingFields = this.get('grouping-fields') || [];
                const data = this.get('table-data') || [];

                if (groupingFields.length === 0) {
                    // No grouping, reset to original data
                    this.set('custom-data', null);
                    this.updateTableHTML();
                    return;
                }

                // Apply grouping logic
                const groupedData = this.groupData(data, groupingFields);

                // Update custom data with processed data
                this.set('custom-data', groupedData);
                this.updateTableHTML();
            },

            groupData(data, groupingFields) {
                if (!groupingFields || groupingFields.length === 0) return data;

                // SAFETY CHECK: Ensure data is valid
                if (!Array.isArray(data) || data.length === 0) {
                    console.warn('Invalid or empty data for grouping');
                    return data;
                }

                const grouped = {};
                const sortOrder = this.get('sort-order') || 'ascending';
                const topN = this.get('top-n') || 'none';
                const topNValue = parseInt(this.get('top-n-value')) || 10;
                const summarizeGroup = this.get('summarize-group') || false;
                const showSummaryOnly = this.get('show-summary-only') || false;
                const mergeGroupCells = this.get('merge-group-cells') || false;
                const hideSubtotalSingleRow = this.get('hide-subtotal-single-row') || false;
                const namedGroups = this.get('named-groups') || {};
                const defineNamedGroup = this.get('define-named-group') || false;

                // Apply Named Groups if enabled
                let processedData = data;
                if (defineNamedGroup && namedGroups[groupingFields[0].key]) {
                    processedData = this.applyNamedGroups(data, groupingFields[0].key, namedGroups[groupingFields[0].key]);
                }

                // Group data - ADD SAFETY CHECK
                processedData.forEach(row => {
                    if (!row || typeof row !== 'object') return; // Skip invalid rows

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

                // Check if any groups were created
                if (Object.keys(grouped).length === 0) {
                    console.warn('No groups created from data');
                    return data; // Return original data if grouping failed
                }

                // Sort groups
                let sortedGroupKeys = Object.keys(grouped);
                if (sortOrder === 'ascending') {
                    sortedGroupKeys.sort();
                } else if (sortOrder === 'descending') {
                    sortedGroupKeys.sort().reverse();
                }
                // For 'original' order, keep as is

                // Apply Top/N filtering - ONLY limit the number of groups shown
                if (topN !== 'none' && topN !== 'sort-all' && topNValue > 0) {
                    if (topN === 'top') {
                        sortedGroupKeys = sortedGroupKeys.slice(0, topNValue);
                    } else if (topN === 'bottom') {
                        sortedGroupKeys = sortedGroupKeys.slice(-topNValue);
                    }
                }

                // Flatten back to array with group markers
                const result = [];

                sortedGroupKeys.forEach((groupKey, groupIndex) => {
                    const group = grouped[groupKey];

                    if (showSummaryOnly) {
                        // Only add summary row
                        if (summarizeGroup) {
                            const summaryRow = this.createSummaryRow(group.rows, groupKey);
                            summaryRow._isSummary = true;
                            summaryRow._groupIndex = groupIndex;
                            result.push(summaryRow);
                        } else if (this.get('keep-group-hierarchy')) {
                            // Show just the first row as representative
                            const firstRow = { ...group.rows[0] };
                            firstRow._groupIndex = groupIndex;
                            result.push(firstRow);
                        }
                    } else {
                        // Add all rows in group
                        group.rows.forEach((row, rowIdx) => {
                            const newRow = { ...row };

                            // Mark first row of group for potential merging
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

                        // Add summary row if needed
                        if (summarizeGroup && !(hideSubtotalSingleRow && group.rows.length === 1)) {
                            const summaryRow = this.createSummaryRow(group.rows, groupKey);
                            summaryRow._isSummary = true;
                            summaryRow._groupIndex = groupIndex;
                            result.push(summaryRow);
                        }
                    }
                });

                // Add grand total if enabled
                if (this.get('grand-total')) {
                    const grandTotalRow = this.createGrandTotalRow(showSummaryOnly ? result.filter(r => !r._isSummary) : result.filter(r => !r._isSummary && !r._isGrandTotal));
                    grandTotalRow._isGrandTotal = true;
                    result.push(grandTotalRow);
                }

                return result;
            },

            applyNamedGroups(data, fieldKey, namedGroupsConfig) {
                return data.map(row => {
                    const currentValue = row[fieldKey];

                    // Find which named group this value belongs to
                    for (const group of namedGroupsConfig) {
                        if (group.values.includes(currentValue)) {
                            return {
                                ...row,
                                [fieldKey]: group.name // Replace with group name
                            };
                        }
                    }

                    // If no named group found, keep original value
                    return row;
                });
            },

            createSummaryRow(groupRows, groupKey) {
                const summaryFields = this.get('summary-fields') || [];
                const headers = this.get('custom-headers') || this.get('table-headers') || {};
                const summaryLabel = this.get('summary-label') || 'Subtotal';

                const summaryRow = {};

                // Initialize with first row values for non-summary fields
                Object.keys(headers).forEach(key => {
                    summaryRow[key] = '';
                });

                // Set label in first column
                const firstKey = Object.keys(headers)[0];
                summaryRow[firstKey] = summaryLabel;

                // Calculate summaries
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

                return summaryRow;
            },

            createGrandTotalRow(data) {
                const summaryFields = this.get('summary-fields') || [];
                const headers = this.get('custom-headers') || this.get('table-headers') || {};
                const grandTotalLabel = this.get('grand-total-label') || 'Grand Total';

                const grandTotalRow = {};

                Object.keys(headers).forEach(key => {
                    grandTotalRow[key] = '';
                });

                const firstKey = Object.keys(headers)[0];
                grandTotalRow[firstKey] = grandTotalLabel;

                summaryFields.forEach(field => {
                    const values = data.map(row => parseFloat(row[field.key]) || 0);

                    switch (field.function) {
                        case 'sum':
                            grandTotalRow[field.key] = values.reduce((a, b) => a + b, 0).toFixed(2);
                            break;
                        case 'average':
                            grandTotalRow[field.key] = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
                            break;
                        case 'count':
                            grandTotalRow[field.key] = values.length;
                            break;
                        case 'min':
                            grandTotalRow[field.key] = Math.min(...values).toFixed(2);
                            break;
                        case 'max':
                            grandTotalRow[field.key] = Math.max(...values).toFixed(2);
                            break;
                    }
                });

                return grandTotalRow;
            },

            processSummary(data, summaryFields) {
                // Additional processing if needed
                return data;
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
                const jsonPath = this.get('json-path') || '';
                Object.entries(headers).forEach(([key, header]) => {
                    const headerId = `${tableId}-header-${key}`;
                    const storedHeader = this.get(`header-content-${key}`) || header;

                    const tableStyles = this.get('table-styles-applied');
                    const cellStyles = tableStyles ? {
                        'border': `${tableStyles.borderWidth}px ${tableStyles.borderStyle} ${tableStyles.borderColor}`,
                        'color': tableStyles.textColor,
                        'font-family': tableStyles.fontFamily,
                        'background-color': tableStyles.bgColor,
                        '-webkit-print-color-adjust': 'exact',
                        'print-color-adjust': 'exact'
                    } : {
                        'padding': '8px',
                        'border': '1px solid #000000ff',
                        'font-weight': 'bold'
                    };

                    const headerCellComponent = headerRowComponent.components().add({
                        type: 'json-table-cell',
                        tagName: 'th',
                        contenteditable: true,
                        content: `<div style="display: flex; align-items: ${tableStyles ? (tableStyles.verticalAlign === 'top' ? 'flex-start' : tableStyles.verticalAlign === 'bottom' ? 'flex-end' : 'center') : 'center'}; justify-content: ${tableStyles ? (tableStyles.textAlign === 'left' ? 'flex-start' : tableStyles.textAlign === 'right' ? 'flex-end' : 'center') : 'flex-start'}; min-height: 100%; width: 100%;">${storedHeader}</div>`,
                        selectable: true,
                        contentEditable: true,
                        classes: ['json-table-cell', 'cell-content', 'editable-header'],
                        attributes: {
                            id: headerId,
                            'data-column-key': key,
                            'data-gjs-hoverable': 'true',
                        },
                        style: {
                            ...cellStyles,
                            'width': 'auto',
                            'height': '100%',
                            'text-align': 'left',
                            'box-sizing': 'border-box',
                            'position': 'relative',
                            'my-input-json': `${this.get('json-path')}.heading.${key}`,
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

                const jsonPath = this.get('json-path') || '';
                const runningTotals = this.get('running-totals') || [];

                data.forEach((row, rowIndex) => {
                    const isSummary = row._isSummary;
                    const isGrandTotal = row._isGrandTotal;
                    const isGroupStart = row._groupStart;
                    const groupSize = row._groupSize || 1;

                    const rowComponent = tbodyComponent.components().add({
                        type: 'default',
                        tagName: 'tr',
                        classes: [rowIndex % 2 === 0 ? 'even-row' : 'odd-row'],
                        style: {
                            'background-color': rowIndex % 2 === 0 ? '#ffffff' : '#f8f9fa'
                        }
                    });

                    Object.keys(headers).forEach(key => {
    // Check if this cell should be skipped due to rowspan
    if (row[`_skip_${key}`]) {
        return;
    }

    const cellId = `${tableId}-cell-${rowIndex}-${key}`;
    const displayValue = row[key] || '';

    // Check if this is a running total column
    const isRunningTotal = key.endsWith('_running_total');
    const rtConfig = isRunningTotal ? runningTotals.find(rt => `${rt.columnKey}_running_total` === key) : null;
    const tableStyles = this.get('table-styles-applied');
    
    // ✅ FIX: Use let instead of const
    let appliedCellStyles = tableStyles ? {
        'border': `${tableStyles.borderWidth}px ${tableStyles.borderStyle} ${tableStyles.borderColor}`,
        'color': tableStyles.textColor,
        'font-family': tableStyles.fontFamily,
        'background-color': tableStyles.bgColor,
        '-webkit-print-color-adjust': 'exact',
        'print-color-adjust': 'exact'
    } : {
        'padding': '8px',
        'border': '1px solid #000'
    };

    // Override with running total styles if applicable
    if (isRunningTotal && rtConfig) {
        appliedCellStyles = {
            ...appliedCellStyles,
            'background-color': rtConfig.bgColor,
            'color': rtConfig.textColor,
            'font-family': rtConfig.fontFamily || appliedCellStyles['font-family'],
            'font-size': rtConfig.fontSize ? `${rtConfig.fontSize}px` : appliedCellStyles['font-size'],
            'font-weight': 'bold',
            'border-left': '3px solid #007bff',
            '--rt-bg-color': rtConfig.bgColor,
            '--rt-text-color': rtConfig.textColor,
            '--rt-font-family': rtConfig.fontFamily || 'inherit',
            '--rt-font-size': rtConfig.fontSize ? `${rtConfig.fontSize}px` : 'inherit'
        };
    }
                        const alignStyles = tableStyles ? {
                            display: 'flex',
                            alignItems: tableStyles.verticalAlign === 'top' ? 'flex-start' :
                                tableStyles.verticalAlign === 'bottom' ? 'flex-end' : 'center',
                            justifyContent: tableStyles.textAlign === 'left' ? 'flex-start' :
                                tableStyles.textAlign === 'right' ? 'flex-end' : 'center',
                            minHeight: '100%',
                            width: '100%'
                        } : { textAlign: 'left' };

                        const attributes = {
                            id: cellId,
                            'data-row': rowIndex.toString(),
                            'data-column-key': key,
                            'data-gjs-hoverable': 'true',
                        };

                                    if (isRunningTotal) {
                attributes['data-running-total'] = 'true';
            }
                        // Add rowspan if this cell should be merged
                        if (isGroupStart && row[`_merge_${key}`]) {
                            attributes.rowspan = groupSize.toString();

                            // Mark following rows to skip this column
                            for (let i = 1; i < groupSize; i++) {
                                if (data[rowIndex + i]) {
                                    data[rowIndex + i][`_skip_${key}`] = true;
                                }
                            }
                        }

                        const cellComponent = rowComponent.components().add({
                            type: 'json-table-cell',
                            tagName: 'td',
                            selectable: true,
                            contenteditable: !(isSummary || isGrandTotal || isRunningTotal),
                            content: `<div style="display: ${alignStyles.display || 'block'}; align-items: ${alignStyles.alignItems || 'flex-start'}; justify-content: ${alignStyles.justifyContent || 'flex-start'}; min-height: 100%; width: 100%;">${displayValue}</div>`,
                            classes: ['json-table-cell', 'cell-content', (isSummary || isGrandTotal|| isRunningTotal) ? 'readonly-cell' : 'editable-cell'],
                            attributes,
                            style: {
                                ...appliedCellStyles,
                                'position': 'relative',
                                'width': 'auto',
                                'height': '100%',
                                'box-sizing': 'border-box',
                                'my-input-json': `${jsonPath}.data[${rowIndex}].${key}`,
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

.cell-content.editing {
    background-color: #e3f2fd !important;
    outline: 2px solid #007bff !important;
    min-height: inherit;
    overflow: hidden;
}

.cell-content[contenteditable="true"] {
    text-align: left !important;
}

/* Highlight styles - with higher specificity */
td[data-highlighted="true"], 
th[data-highlighted="true"] {
    position: relative;
    box-sizing: border-box !important;
    border: 1px solid #000 !important;
    -webkit-print-color-adjust: exact !important;
    color-adjust: exact !important;
    print-color-adjust: exact !important;
}

td[data-highlighted="true"]::after, 
th[data-highlighted="true"]::after {
    content: "★";
    position: absolute;
    top: 2px;
    right: 2px;
    font-size: 10px;
    color: #ff6b35;
    font-weight: bold;
    z-index: 1;
}

/* Running Total Column Styles - with !important to override table styles */
.running-total-column,
td[data-running-total="true"],
th[data-running-total="true"] {
    position: relative;
    box-sizing: border-box !important;
    -webkit-print-color-adjust: exact !important;
    color-adjust: exact !important;
    print-color-adjust: exact !important;
}

td[data-running-total="true"] .cell-content,
th[data-running-total="true"] .cell-content {
    font-weight: bold !important;
}

/* Ensure running total styles take precedence over table styles */
td[data-running-total="true"][style],
th[data-running-total="true"][style] {
    background-color: var(--rt-bg-color) !important;
    color: var(--rt-text-color) !important;
    font-family: var(--rt-font-family) !important;
    font-size: var(--rt-font-size) !important;
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
<div class="highlight-styles" style="padding: 10px 15px 15px 0; border-radius: 5px;">
    <h4 style="margin-top: 0;">Highlight Styles</h4>
    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 15px;">
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Background Color:</label>
            <input type="color" id="highlight-bg-color" value="#ffff99" style="width: 100%; height: 40px; border: none; border-radius: 4px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Text Color:</label>
            <input type="color" id="highlight-text-color" value="#000000" style="width: 100%; height: 40px; border: none; border-radius: 4px;">
        </div>
        <div >
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Font Size (px):</label>
            <input type="number" id="highlight-font-size" value="14" min="8" max="72" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        </div>
        <div>
            <label style="display: block; margin-bottom: 5px; font-weight: bold; margin-left: 10% ">Font Family:</label>
            <select id="highlight-font-family" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-left:10%;">
                <option value="">Default</option>
                <option value="Arial, sans-serif">Arial</option>
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
    editor.Commands.add('open-table-style-manager', {
        run(editor) {
            const selected = editor.getSelected();
            if (!selected || selected.get('type') !== 'json-table') return;

            const modalContent = `
<div class="table-style-manager" style="padding: 20px; max-width: 600px;">
    
    <div class="style-section" style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 5px;">
        <h4 style="margin-top: 0;">Border Settings</h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
                <label style="display: block; margin-bottom: 5px; font-weight: bold;">Border Style:</label>
                <select id="border-style" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
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
                <input type="number" id="border-width" min="0" max="10" value="1" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
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
</div>`;

            const modal = editor.Modal;
            modal.setTitle('Customize Table Styles');
            modal.setContent(modalContent);
            modal.open();

            setTimeout(() => {
                initializeTableStyleManager(selected);
            }, 100);
        }
    });
    editor.Commands.add('open-table-settings-modal', {
        run(editor) {
            const selected = editor.getSelected();
            if (!selected || selected.get('type') !== 'json-table') return;

            const headers = selected.get('custom-headers') || selected.get('table-headers') || {};
            const availableFields = Object.entries(headers).map(([key, name]) => ({
                key, name
            }));

const modalContent = `
<div class="table-settings-modal" style="width: 800px; max-height: 90vh; display: flex; flex-direction: column;">
    <!-- Navbar -->
    <div class="settings-navbar" style="display: flex; border-bottom: 2px solid #ddd; background: #f8f9fa; flex-shrink: 0;">
        <button class="nav-tab active" data-tab="settings" style="flex: 1; padding: 12px; border: none; background: white; cursor: pointer; font-weight: bold; border-bottom: 3px solid #007bff;">Settings</button>
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
                                <!-- Will be populated dynamically -->
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

        <!-- Grouping & Summary Tab (existing content) -->
        <div id="grouping-tab" class="tab-pane" style="display: none;">
            <!-- Keep existing grouping tab content -->
        </div>

        <!-- Running Total Tab (NEW) -->
        <div id="running-total-tab" class="tab-pane" style="display: none;">
            <div style="display: grid; grid-template-columns: 250px 1fr; gap: 20px;">
                <!-- Left: Column Selection -->
                <div>
                    <label style="font-weight: bold; display: block; margin-bottom: 10px;">Select Columns:</label>
                    <div id="rt-column-list" style="border: 1px solid #ddd; border-radius: 4px; padding: 10px; max-height: 400px; overflow-y: auto;">
                        <!-- Will be populated with numeric columns -->
                    </div>
                </div>

                <!-- Right: Configuration Panel -->
                <div>
                    <div id="rt-config-panel" style="border: 1px solid #ddd; border-radius: 4px; padding: 15px;">
                        <p style="color: #666; text-align: center;">Select a column to configure running total</p>
                    </div>

                    <!-- Running Total List -->
                    <div style="margin-top: 20px;">
                        <label style="font-weight: bold; display: block; margin-bottom: 10px;">Active Running Totals:</label>
                        <div id="rt-active-list" style="border: 1px solid #ddd; border-radius: 4px; padding: 10px; min-height: 100px; max-height: 200px; overflow-y: auto;">
                            <p style="color: #999; text-align: center;">No running totals configured</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Options Tab (existing content) -->
        <div id="options-tab" class="tab-pane" style="display: none;">
            <!-- Keep existing options tab content -->
        </div>
    </div>

    <!-- Footer Buttons -->
    <div style="border-top: 1px solid #ddd; padding: 15px; display: flex; justify-content: flex-end; gap: 10px; flex-shrink: 0;">
        <button id="cancel-settings" style="padding: 8px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
        <button id="apply-settings" style="padding: 8px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">OK</button>
    </div>
</div>
`;
            const modal = editor.Modal;
            modal.setTitle('Table Settings');
            modal.setContent(modalContent);
            modal.open();

            setTimeout(() => {
                initializeTableSettingsModal(selected, availableFields);
            }, 100);
        }
    });

    function initializeTableSettingsModal(component, availableFields) {
        // Tab switching
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.addEventListener('click', function () {
                document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-pane').forEach(p => p.style.display = 'none');

                this.classList.add('active');
                const tabId = this.getAttribute('data-tab') + '-tab';
                document.getElementById(tabId).style.display = 'block';

                            if (this.getAttribute('data-tab') === 'running-total') {
                initializeRunningTotalTab(component);
            }
            });
        });
   initializeInlineColumnReorder(component);
        // Populate Running Total columns - STRICT numeric check
        const headers = component.get('custom-headers') || component.get('table-headers') || {};
        const data = component.get('custom-data') || component.get('table-data') || [];
        const selectedColumns = component.get('selected-running-total-columns') || [];

        const runningTotalContainer = document.getElementById('running-total-columns');
        const numericHeaders = {};

        Object.entries(headers).forEach(([key, name]) => {
            const isStrictlyNumeric = data.every(row => {
                let value = row[key];
                if (value === '' || value === null || value === undefined) return true;

                // Convert to string and trim spaces
                value = String(value).trim();

                // Handle accounting-style negatives: (123.45) → -123.45
                if (/^\(.*\)$/.test(value)) {
                    value = '-' + value.slice(1, -1);
                }

                // Remove currency symbols and spaces
                value = value.replace(/[$£€₹,\s]/g, '');

                // Detect if it’s a European-style number (comma as decimal)
                // e.g., "1200,50" → "1200.50"
                if (/^-?\d+(\.\d{3})*,\d+$/.test(value)) {
                    value = value.replace(/\./g, '').replace(',', '.');
                }

                // Check if final cleaned string is a valid number
                const numValue = Number(value);
                return typeof numValue === 'number' && !isNaN(numValue);
            });

            if (
                isStrictlyNumeric &&
                data.some(row => row[key] !== '' && row[key] !== null && row[key] !== undefined)
            ) {
                numericHeaders[key] = name;
            }
        });


        if (Object.keys(numericHeaders).length === 0) {
            runningTotalContainer.innerHTML = '<p style="color: #999; text-align: center; padding: 10px;">No columns with purely numeric data available</p>';
        } else {
            runningTotalContainer.innerHTML = Object.entries(numericHeaders).map(([key, name]) => `
        <div style="margin-bottom: 8px;">
            <label style="display: flex; align-items: center; cursor: pointer;">
                <input type="checkbox" value="${key}" ${selectedColumns.includes(key) ? 'checked' : ''} 
                       class="running-total-checkbox" style="margin-right: 8px; width: 16px; height: 16px;">
                <span>${name}</span>
            </label>
        </div>
    `).join('');
        }

        // Running Total Apply
        document.getElementById('apply-running-total').addEventListener('click', function () {
            const checkboxes = document.querySelectorAll('.running-total-checkbox:checked');
            const selectedColumns = Array.from(checkboxes).map(cb => cb.value);
            component.set('selected-running-total-columns', selectedColumns);
            alert(`Running total applied to ${selectedColumns.length} column(s)`);
        });

        // Add Rows
        document.getElementById('add-rows').addEventListener('click', function () {
            const count = parseInt(document.getElementById('row-count').value) || 1;
            for (let i = 0; i < count; i++) {
                component.addRow();
            }
            alert(`Added ${count} row(s)`);
        });

        // Remove Rows
        document.getElementById('remove-rows').addEventListener('click', function () {
            const count = parseInt(document.getElementById('row-count').value) || 1;
            const currentData = component.get('custom-data') || component.get('table-data') || [];

            if (currentData.length <= count) {
                alert('Cannot remove all rows. At least one row must remain.');
                return;
            }

            for (let i = 0; i < count; i++) {
                component.removeRow();
            }
            alert(`Removed ${count} row(s)`);
        });

        // Add Columns
        document.getElementById('add-columns').addEventListener('click', function () {
            const count = parseInt(document.getElementById('column-count').value) || 1;
            for (let i = 0; i < count; i++) {
                component.addColumn();
            }
            alert(`Added ${count} column(s)`);
        });

        // Remove Columns
        document.getElementById('remove-columns').addEventListener('click', function () {
            const count = parseInt(document.getElementById('column-count').value) || 1;
            const currentHeaders = component.get('custom-headers') || component.get('table-headers') || {};

            if (Object.keys(currentHeaders).length <= count) {
                alert('Cannot remove all columns. At least one column must remain.');
                return;
            }

            for (let i = 0; i < count; i++) {
                component.removeColumn();
            }
            alert(`Removed ${count} column(s)`);
        });

        // === GROUPING & SUMMARY TAB HANDLERS ===

        const savedGroupingFields = component.get('grouping-fields') || [];
        const savedSummaryFields = component.get('summary-fields') || [];

        selectedGroupingFields = [...savedGroupingFields];
        selectedSummaryFields = [...savedSummaryFields]; // Add this
        updateSelectedFields();
        updateSummaryFieldsList(); // Add this function call

        // Load other saved options
        document.getElementById('sort-order').value = component.get('sort-order') || 'ascending';
        document.getElementById('top-n').value = component.get('top-n') || 'none';
        document.getElementById('top-n-value').value = component.get('top-n-value') || '10';
        document.getElementById('summarize-group').checked = component.get('summarize-group') || false;
        document.getElementById('page-break-after-group').checked = component.get('page-break-after-group') || false;
        document.getElementById('summary-percentage').value = component.get('summary-percentage') || 'none';
        document.getElementById('merge-group-cells').checked = component.get('merge-group-cells') || false;
        document.getElementById('group-header-inplace').checked = component.get('group-header-inplace') !== false;
        document.getElementById('hide-subtotal-single-row').checked = component.get('hide-subtotal-single-row') || false;
        document.getElementById('keep-group-hierarchy').checked = component.get('keep-group-hierarchy') || false;
        document.getElementById('grand-total').checked = component.get('grand-total') !== false;
        document.getElementById('grand-total-label').value = component.get('grand-total-label') || '';
        document.getElementById('summary-label').value = component.get('summary-label') || '';

        if (component.get('show-summary-only')) {
            document.querySelector('input[name="grouping-type"][value="summary"]').checked = true;
        }

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
            if (selectedGroupingFields.length === 0) {
                selectedFieldsDiv.innerHTML = '<p style="color: #999; padding: 10px; text-align: center; font-size: 12px;">No fields selected</p>';
            } else {
                selectedFieldsDiv.innerHTML = selectedGroupingFields.map((field, idx) => `
                <div class="field-item selected" data-key="${field.key}" data-index="${idx}" style="padding: 5px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                    <span>${field.name}</span>
                    <button class="remove-grouping-field" style="background: #dc3545; color: white; padding: 2px 6px; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">×</button>
                </div>
            `).join('');

                if (selectedGroupingFields.length > 0) {
                    document.getElementById('grouping-field-display').innerHTML =
                        `<span style="color: #000;">${selectedGroupingFields[0].name}</span>`;
                }

                // Add remove functionality
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

        // Add this new function for summary fields
        function updateSummaryFieldsList() {
            const queryFields = document.getElementById('query-fields');
            if (!queryFields) return;

            queryFields.innerHTML = selectedSummaryFields.map((field, idx) => `
            <div class="field-item" data-index="${idx}" style="padding: 5px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;">
                <span>${availableFields.find(f => f.key === field.key)?.name || field.key} (${field.function})</span>
                <button class="remove-summary-field" style="background: #dc3545; color: white; padding: 2px 6px; border: none; border-radius: 3px; cursor: pointer; font-size: 11px;">×</button>
            </div>
        `).join('');

            // Add remove functionality
            queryFields.querySelectorAll('.remove-summary-field').forEach(btn => {
                btn.addEventListener('click', function () {
                    const idx = parseInt(this.closest('.field-item').getAttribute('data-index'));
                    selectedSummaryFields.splice(idx, 1);
                    updateSummaryFieldsList();
                });
            });
        }

        // Summary field addition - Update this section
        const summaryAddBtn = document.createElement('button');
        summaryAddBtn.textContent = 'Add Summary';
        summaryAddBtn.style.cssText = 'margin-top: 10px; padding: 6px 12px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;';
        document.getElementById('summary-function').parentElement.parentElement.appendChild(summaryAddBtn);

        summaryAddBtn.addEventListener('click', function () {
            const summaryField = document.getElementById('summary-field').value;
            const summaryFunction = document.getElementById('summary-function').value;

            if (!summaryField) {
                alert('Please select a field');
                return;
            }

            if (selectedSummaryFields.find(f => f.key === summaryField)) {
                alert('This field is already added');
                return;
            }

            selectedSummaryFields.push({
                key: summaryField,
                function: summaryFunction
            });

            updateSummaryFieldsList();
            document.getElementById('summary-field').value = '';
        });

        // Sort buttons
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

        // Define Named Group checkbox
        document.getElementById('define-named-group').addEventListener('change', function () {
            const btn = document.getElementById('open-named-group');
            const list = document.getElementById('named-groups-list');
            btn.disabled = !this.checked;
            btn.style.cursor = this.checked ? 'pointer' : 'not-allowed';
            btn.style.background = this.checked ? 'white' : '#f0f0f0';
            list.style.display = this.checked ? 'block' : 'none';
        });

        document.getElementById('open-named-group').addEventListener('click', function () {
            if (this.disabled) return;

            if (selectedGroupingFields.length === 0) {
                alert('Please select a grouping field first');
                return;
            }

            const groupField = selectedGroupingFields[0];
            showNamedGroupModal(component, groupField);
        });

        // Predefined Named Group checkbox
        document.getElementById('predefined-named-group').addEventListener('change', function () {
            document.getElementById('predefined-group-select').disabled = !this.checked;
            document.getElementById('predefined-group-select').style.background = this.checked ? 'white' : '#f0f0f0';
        });

        // Show Summary Only radio
        document.querySelectorAll('input[name="grouping-type"]').forEach(radio => {
            radio.addEventListener('change', function () {
                const keepHierarchy = document.getElementById('keep-group-hierarchy');
                keepHierarchy.disabled = this.value !== 'summary';
            });
        });

        // Cancel button
        document.getElementById('cancel-settings').addEventListener('click', () => {
            editor.Modal.close();
        });

        // Apply button - FIX: Save selectedSummaryFields
        document.getElementById('apply-settings').addEventListener('click', () => {
            // Validate grouping before applying
            if (selectedGroupingFields.length === 0 && selectedSummaryFields.length > 0) {
                alert('Please select at least one grouping field before adding summaries');
                return;
            }
            // Options Tab - Make all checkboxes functional
            document.querySelectorAll('#options-tab input[type="checkbox"]').forEach(checkbox => {
                checkbox.addEventListener('change', function () {
                    const id = this.id;
                    const isChecked = this.checked;

                    // Handle each checkbox
                    switch (id) {
                        case 'merge-group-cells':
                            component.set('merge-group-cells', isChecked);
                            break;
                        case 'group-header-inplace':
                            component.set('group-header-inplace', isChecked);
                            break;
                        case 'hide-subtotal-single-row':
                            component.set('hide-subtotal-single-row', isChecked);
                            break;
                        case 'repeat-group-header':
                            component.set('repeat-group-header', isChecked);
                            break;
                        case 'show-group-column':
                            component.set('show-group-column', isChecked);
                            break;
                        case 'keep-group-hierarchy':
                            component.set('keep-group-hierarchy', isChecked);
                            break;
                        case 'grand-total':
                            const grandTotalLabel = document.getElementById('grand-total-label');
                            grandTotalLabel.disabled = !isChecked;
                            grandTotalLabel.style.background = isChecked ? 'white' : '#f0f0f0';
                            component.set('grand-total', isChecked);
                            break;
                    }
                });
            });

            // Grouping type radio buttons
            document.querySelectorAll('input[name="grouping-type"]').forEach(radio => {
                radio.addEventListener('change', function () {
                    const isSummaryOnly = this.value === 'summary';
                    document.getElementById('keep-group-hierarchy').disabled = !isSummaryOnly;
                    component.set('show-summary-only', isSummaryOnly);
                });
            });
            // Save all settings
            component.set('grouping-fields', selectedGroupingFields);
            component.set('summary-fields', selectedSummaryFields); // Use the tracked selectedSummaryFields
            component.set('sort-order', document.getElementById('sort-order').value);
            component.set('top-n', document.getElementById('top-n').value);
            component.set('top-n-value', document.getElementById('top-n-value').value);
            component.set('define-named-group', document.getElementById('define-named-group').checked);
            component.set('summarize-group', document.getElementById('summarize-group').checked);
            component.set('page-break-after-group', document.getElementById('page-break-after-group').checked);
            component.set('summary-percentage', document.getElementById('summary-percentage').value);
            component.set('merge-group-cells', document.getElementById('merge-group-cells').checked);
            component.set('group-header-inplace', document.getElementById('group-header-inplace').checked);
            component.set('hide-subtotal-single-row', document.getElementById('hide-subtotal-single-row').checked);
            component.set('show-summary-only', document.querySelector('input[name="grouping-type"]:checked').value === 'summary');
            component.set('keep-group-hierarchy', document.getElementById('keep-group-hierarchy').checked);
            component.set('grand-total', document.getElementById('grand-total').checked);
            component.set('grand-total-label', document.getElementById('grand-total-label').value);
            component.set('summary-label', document.getElementById('summary-label').value);

            editor.Modal.close();
        });
    }

    function initializeRunningTotalTab(component) {
    const headers = component.get('custom-headers') || component.get('table-headers') || {};
    const data = component.get('custom-data') || component.get('table-data') || [];
    const runningTotals = component.get('running-totals') || [];
    
    // Filter numeric columns
    const numericHeaders = {};
    Object.entries(headers).forEach(([key, name]) => {
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
            numericHeaders[key] = name;
        }
    });

    // Populate column list
    const columnList = document.getElementById('rt-column-list');
    if (Object.keys(numericHeaders).length === 0) {
        columnList.innerHTML = '<p style="color: #999; text-align: center; padding: 10px;">No numeric columns available</p>';
        return;
    }

    columnList.innerHTML = Object.entries(numericHeaders).map(([key, name]) => `
        <div class="rt-column-item" data-key="${key}" style="padding: 8px; margin-bottom: 5px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; transition: all 0.2s;">
            <span>${name}</span>
        </div>
    `).join('');

    // Add click handlers
// Add click handlers
document.querySelectorAll('.rt-column-item').forEach(item => {
    item.addEventListener('click', function() {
        // ✅ Highlight selected column
        document.querySelectorAll('.rt-column-item').forEach(i => {
            i.style.background = 'white';
            i.style.borderColor = '#ddd';
        });
        this.style.background = '#e3f2fd';
        this.style.borderColor = '#007bff';
        
        const columnKey = this.getAttribute('data-key');
        const columnName = numericHeaders[columnKey];
        showRunningTotalConfig(component, columnKey, columnName, runningTotals);
    });
});

    // Show active running totals
    updateActiveRunningTotalsList(component, numericHeaders);
}

function initializeInlineColumnReorder(component) {
    const headers = component.get('custom-headers') || component.get('table-headers') || {};
    const columnKeys = Object.keys(headers);
    
    if (columnKeys.length <= 1) {
        document.getElementById('column-list-inline').innerHTML = '<p style="color: #999; text-align: center; padding: 10px;">Need at least 2 columns to reorder</p>';
        return;
    }

    const originalOrder = [...columnKeys];
    
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
                
                // Auto-apply reorder
                applyColumnReorder(component);
            }
        });
    });

    // Reset button
    document.getElementById('reset-order').addEventListener('click', function () {
        component.reorderColumns(originalOrder);
        initializeInlineColumnReorder(component);
        alert('Column order reset to original');
    });
}

function applyColumnReorder(component) {
    const columnList = document.getElementById('column-list-inline');
    const currentItems = columnList.querySelectorAll('.column-item-inline');
    const newOrder = Array.from(currentItems).map(item => item.getAttribute('data-key'));
    component.reorderColumns(newOrder);
}

function showRunningTotalConfig(component, columnKey, columnName, runningTotals) {
    const existing = runningTotals.find(rt => rt.columnKey === columnKey);
    
    const configPanel = document.getElementById('rt-config-panel');
    configPanel.innerHTML = `
        <h4 style="margin-top: 0;">${columnName}</h4>
        
        <!-- Summary -->
        <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 4px; ">
            <label style="font-weight: bold; display: block; margin-bottom: 5px;">Summary Field:</label>
            <select id="rt-summary-field" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 10px;">
                <option value="sum" ${existing?.operation === 'sum' ? 'selected' : ''}>Sum</option>
                <option value="count" ${existing?.operation === 'count' ? 'selected' : ''}>Count</option>
                <option value="distinct-count" ${existing?.operation === 'distinct-count' ? 'selected' : ''}>Distinct Count</option>
                <option value="average" ${existing?.operation === 'average' ? 'selected' : ''}>Average</option>
                <option value="max" ${existing?.operation === 'max' ? 'selected' : ''}>Max</option>
                <option value="min" ${existing?.operation === 'min' ? 'selected' : ''}>Min</option>
                <option value="product" ${existing?.operation === 'product' ? 'selected' : ''}>Product</option>
                <option value="std-dev" ${existing?.operation === 'std-dev' ? 'selected' : ''}>Std Deviation (Population)</option>
                <option value="variance" ${existing?.operation === 'variance' ? 'selected' : ''}>Variance (Population)</option>
                <option value="weighted-avg" ${existing?.operation === 'weighted-avg' ? 'selected' : ''}>Weighted Average</option>
            </select>
        </div>

        <!-- Evaluate -->
        <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 4px;">
            <label style="font-weight: bold; display: block; margin-bottom: 10px;">Evaluate:</label>
            <label style="display: flex; align-items: center; margin-bottom: 8px;">
                <input type="radio" name="rt-evaluate" value="for-each-record" ${!existing || existing.evaluate === 'for-each-record' ? 'checked' : ''} style="margin-right: 8px;">
                <span>For each record</span>
            </label>
            <label style="display: flex; align-items: center;">
                <input type="radio" name="rt-evaluate" value="on-change-of" ${existing?.evaluate === 'on-change-of' ? 'checked' : ''} style="margin-right: 8px;">
                <span>On change of</span>
            </label>
            <select id="rt-evaluate-field" ${existing?.evaluate !== 'on-change-of' ? 'disabled' : ''} style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-top: 8px; background: ${existing?.evaluate !== 'on-change-of' ? '#f0f0f0' : 'white'};">
                ${getGroupingFieldsOptions(component, existing?.evaluateField)}
            </select>
        </div>

        <!-- Reset -->
        <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 4px;">
            <label style="font-weight: bold; display: block; margin-bottom: 10px;">Reset:</label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 8px;">
                <label style="display: flex; align-items: center;">
                    <input type="radio" name="rt-reset" value="never" ${!existing || existing.reset === 'never' ? 'checked' : ''} style="margin-right: 8px;">
                    <span>Never</span>
                </label>
                <label style="display: flex; align-items: center;">
                    <input type="radio" name="rt-reset" value="on-pagebreak" ${existing?.reset === 'on-pagebreak' ? 'checked' : ''} style="margin-right: 8px;">
                    <span>On Pagebreak</span>
                </label>
            </div>
            <label style="display: flex; align-items: center;">
                <input type="radio" name="rt-reset" value="on-change-of" ${existing?.reset === 'on-change-of' ? 'checked' : ''} style="margin-right: 8px;">
                <span>On change of</span>
            </label>
            <select id="rt-reset-field" ${existing?.reset !== 'on-change-of' ? 'disabled' : ''} style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-top: 8px; background: ${existing?.reset !== 'on-change-of' ? '#f0f0f0' : 'white'};">
                ${getGroupingFieldsOptions(component, existing?.resetField)}
            </select>
        </div>

        <!-- Styling 
        <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #ddd; border-radius: 4px;">
            <label style="font-weight: bold; display: block; margin-bottom: 10px;">Styling:</label>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div>
                    <label style="display: block; margin-bottom: 5px; font-size: 12px;">Background Color:</label>
                    <input type="color" id="rt-bg-color" value="${existing?.bgColor || '#f0f8ff'}" style="width: 100%; height: 35px;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-size: 12px;">Text Color:</label>
                    <input type="color" id="rt-text-color" value="${existing?.textColor || '#1976d2'}" style="width: 100%; height: 35px;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-size: 12px;">Font Family:</label>
                    <select id="rt-font-family" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="">Default</option>
                        <option value="Arial, sans-serif" ${existing?.fontFamily === 'Arial, sans-serif' ? 'selected' : ''}>Arial</option>
                        <option value="'Courier New', monospace" ${existing?.fontFamily === "'Courier New', monospace" ? 'selected' : ''}>Courier New</option>
                        <option value="Georgia, serif" ${existing?.fontFamily === 'Georgia, serif' ? 'selected' : ''}>Georgia</option>
                        <option value="Verdana, sans-serif" ${existing?.fontFamily === 'Verdana, sans-serif' ? 'selected' : ''}>Verdana</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-size: 12px;">Font Size (px):</label>
                    <input type="number" id="rt-font-size" value="${existing?.fontSize || 14}" min="8" max="72" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-size: 12px;">Horizontal Align:</label>
                    <select id="rt-h-align" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="left" ${existing?.hAlign === 'left' ? 'selected' : ''}>Left</option>
                        <option value="center" ${existing?.hAlign === 'center' ? 'selected' : ''}>Center</option>
                        <option value="right" ${existing?.hAlign === 'right' ? 'selected' : ''}>Right</option>
                    </select>
                </div>
                <div>
                    <label style="display: block; margin-bottom: 5px; font-size: 12px;">Vertical Align:</label>
                    <select id="rt-v-align" style="width: 100%; padding: 6px; border: 1px solid #ddd; border-radius: 4px;">
                        <option value="top" ${existing?.vAlign === 'top' ? 'selected' : ''}>Top</option>
                        <option value="middle" ${existing?.vAlign === 'middle' ? 'selected' : ''}>Middle</option>
                        <option value="bottom" ${existing?.vAlign === 'bottom' ? 'selected' : ''}>Bottom</option>
                    </select>
                </div>
            </div>
        </div>
        -->

        <!-- Action Buttons -->
        <div style="display: flex; gap: 10px;">
            ${existing ? `<button id="rt-remove-btn" style="flex: 1; padding: 10px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Remove Running Total</button>` : ''}
            <button id="rt-apply-btn" style="flex: 1; padding: 10px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">${existing ? 'Update' : 'Add'} Running Total</button>
        </div>
    `;

    // Add event listeners
    document.querySelectorAll('input[name="rt-evaluate"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const field = document.getElementById('rt-evaluate-field');
            field.disabled = this.value !== 'on-change-of';
            field.style.background = this.value !== 'on-change-of' ? '#f0f0f0' : 'white';
        });
    });

    document.querySelectorAll('input[name="rt-reset"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const field = document.getElementById('rt-reset-field');
            field.disabled = this.value !== 'on-change-of';
            field.style.background = this.value !== 'on-change-of' ? '#f0f0f0' : 'white';
        });
    });

    document.getElementById('rt-apply-btn').addEventListener('click', function() {
        const rtConfig = {
            columnKey,
            columnName,
            operation: document.getElementById('rt-summary-field').value,
            evaluate: document.querySelector('input[name="rt-evaluate"]:checked').value,
            evaluateField: document.getElementById('rt-evaluate-field').value,
            reset: document.querySelector('input[name="rt-reset"]:checked').value,
            resetField: document.getElementById('rt-reset-field').value,
            bgColor: document.getElementById('rt-bg-color').value,
            textColor: document.getElementById('rt-text-color').value,
            fontFamily: document.getElementById('rt-font-family').value,
            fontSize: document.getElementById('rt-font-size').value,
            hAlign: document.getElementById('rt-h-align').value,
            vAlign: document.getElementById('rt-v-align').value
        };

        addOrUpdateRunningTotal(component, rtConfig);
    });

    if (existing) {
        document.getElementById('rt-remove-btn').addEventListener('click', function() {
            removeRunningTotal(component, columnKey);
        });
    }
}

function getGroupingFieldsOptions(component, selectedField) {
    const headers = component.get('custom-headers') || component.get('table-headers') || {};
    return Object.entries(headers).map(([key, name]) => 
        `<option value="${key}" ${selectedField === key ? 'selected' : ''}>${name}</option>`
    ).join('');
}

function addOrUpdateRunningTotal(component, rtConfig) {
    let runningTotals = component.get('running-totals') || [];
    const existingIndex = runningTotals.findIndex(rt => rt.columnKey === rtConfig.columnKey);
    
    if (existingIndex >= 0) {
        runningTotals[existingIndex] = rtConfig;
    } else {
        runningTotals.push(rtConfig);
    }
    
    component.set('running-totals', runningTotals);
    
    const headers = component.get('custom-headers') || component.get('table-headers') || {};
    updateActiveRunningTotalsList(component, headers);
    applyRunningTotalsToTable(component);
    
    alert(`Running total ${existingIndex >= 0 ? 'updated' : 'added'} for ${rtConfig.columnName}`);
}

function removeRunningTotal(component, columnKey) {
    let runningTotals = component.get('running-totals') || [];
    runningTotals = runningTotals.filter(rt => rt.columnKey !== columnKey);
    component.set('running-totals', runningTotals);
    
    const headers = component.get('custom-headers') || component.get('table-headers') || {};
    updateActiveRunningTotalsList(component, headers);
    applyRunningTotalsToTable(component);
    
    document.getElementById('rt-config-panel').innerHTML = '<p style="color: #666; text-align: center;">Select a column to configure running total</p>';
    
    alert('Running total removed');
}

function updateActiveRunningTotalsList(component, numericHeaders) {
    const runningTotals = component.get('running-totals') || [];
    const activeList = document.getElementById('rt-active-list');
    
    if (runningTotals.length === 0) {
        activeList.innerHTML = '<p style="color: #999; text-align: center;">No running totals configured</p>';
        return;
    }
    
    activeList.innerHTML = runningTotals.map(rt => `
        <div style="padding: 8px; margin-bottom: 5px; border: 1px solid #ddd; border-radius: 4px;">
            <strong>${rt.columnName}</strong>
            <div style="font-size: 12px; color: #666; margin-top: 3px;">
                Operation: ${rt.operation} | Evaluate: ${rt.evaluate}
            </div>
        </div>
    `).join('');
}

function applyRunningTotalsToTable(component) {
    const runningTotals = component.get('running-totals') || [];
    const baseData = component.get('table-data') || [];  // ✅ Always use base data
    const baseHeaders = component.get('table-headers') || {};
    
    if (runningTotals.length === 0) {
        // No running totals - reset to base data
        component.set('custom-headers', null);
        component.set('custom-data', null);
        component.updateTableHTML();
        return;
    }
    
    if (baseData.length === 0) return;
    
    // Start fresh with base headers and data
    const updatedHeaders = { ...baseHeaders };
    
    // ✅ Create deep copy of base data
    let updatedData = baseData.map(row => ({ ...row }));
    
    // Apply each running total
// Apply each running total
runningTotals.forEach(rt => {
    const newColumnKey = `${rt.columnKey}_running_total`;
    updatedHeaders[newColumnKey] = `${baseHeaders[rt.columnKey]} (RT)`;  // ✅ Use baseHeaders
    
    // ✅ Initialize accumulators properly
    let accumulator = 0;
    let count = 0;
    let distinctValues = new Set();
    let values = [];
    let previousGroupValue = null;
    let sumForAverage = 0;
    
    // ✅ Special initialization for certain operations
    if (rt.operation === 'product') {
        accumulator = 1;
    } else if (rt.operation === 'min') {
        accumulator = Infinity;
    } else if (rt.operation === 'max') {
        accumulator = -Infinity;
    }
        
updatedData = updatedData.map((row, idx) => {
    // Check for reset conditions
    if (rt.reset === 'on-change-of' && rt.resetField && idx > 0) {
        if (row[rt.resetField] !== updatedData[idx - 1][rt.resetField]) {
            // ✅ Reset all accumulators
            accumulator = rt.operation === 'product' ? 1 : 
                         rt.operation === 'min' ? Infinity :
                         rt.operation === 'max' ? -Infinity : 0;
            count = 0;
            distinctValues = new Set();
            values = [];
            sumForAverage = 0;
        }
    }
    
    // Check evaluate conditions
    let shouldEvaluate = true;
    if (rt.evaluate === 'on-change-of' && rt.evaluateField) {
        shouldEvaluate = row[rt.evaluateField] !== previousGroupValue;
        previousGroupValue = row[rt.evaluateField];
    }
    
    if (shouldEvaluate) {
        const value = parseFloat(row[rt.columnKey]) || 0;
        count++;
        distinctValues.add(row[rt.columnKey]);
        values.push(value);
        sumForAverage += value;
        
        switch (rt.operation) {
            case 'sum':
                accumulator += value;
                break;
            case 'count':
                accumulator = count;
                break;
            case 'distinct-count':
                accumulator = distinctValues.size;
                break;
            case 'average':
                accumulator = sumForAverage / count;  // ✅ Use separate sum
                break;
            case 'max':
                accumulator = Math.max(accumulator, value);  // ✅ Cumulative max
                break;
            case 'min':
                accumulator = Math.min(accumulator, value);  // ✅ Cumulative min
                break;
            case 'product':
                accumulator *= value;
                break;
            case 'std-dev':
                const mean = sumForAverage / count;
                const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / count;
                accumulator = Math.sqrt(variance);
                break;
            case 'variance':
                const avg = sumForAverage / count;
                accumulator = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / count;
                break;
            case 'weighted-avg':
                // ✅ Implement if you have weight column logic
                accumulator = sumForAverage / count;  // Fallback to average
                break;
        }
    }
    
    // ✅ Format based on operation type
    let formattedValue;
    if (rt.operation === 'count' || rt.operation === 'distinct-count') {
        formattedValue = accumulator.toString();
    } else {
        formattedValue = accumulator.toFixed(2);
    }
    
    row[newColumnKey] = formattedValue;
    return row;
});
    });
    
    component.set('custom-headers', updatedHeaders);
    component.set('custom-data', updatedData);
    component.updateTableHTML();
}
    function initializeTableStyleManager(component) {
        // Load current values
        document.getElementById('border-style').value = component.get('table-border-style') || 'solid';
        document.getElementById('border-width').value = component.get('table-border-width') || '1';
        document.getElementById('border-color').value = component.get('table-border-color') || '#000000';
        document.getElementById('border-opacity').value = component.get('table-border-opacity') || '100';
        document.getElementById('bg-color').value = component.get('table-bg-color') || '#ffffff';
        document.getElementById('text-color').value = component.get('table-text-color') || '#000000';
        document.getElementById('font-family').value = component.get('table-font-family') || 'Arial, sans-serif';
        document.getElementById('text-align').value = component.get('table-text-align') || 'left';
        document.getElementById('vertical-align').value = component.get('table-vertical-align') || 'middle';
        document.getElementById('top-n-value').value = component.get('top-n-value') || '10';

        // Opacity slider
        const opacitySlider = document.getElementById('border-opacity');
        const opacityValue = document.getElementById('opacity-value');
        opacitySlider.addEventListener('input', function () {
            opacityValue.textContent = this.value + '%';
        });

        // Apply button
        document.getElementById('apply-styles').addEventListener('click', function () {
            component.set('table-border-style', document.getElementById('border-style').value);
            component.set('table-border-width', document.getElementById('border-width').value);
            component.set('table-border-color', document.getElementById('border-color').value);
            component.set('table-border-opacity', document.getElementById('border-opacity').value);
            component.set('table-bg-color', document.getElementById('bg-color').value);
            component.set('table-text-color', document.getElementById('text-color').value);
            component.set('table-font-family', document.getElementById('font-family').value);
            component.set('table-text-align', document.getElementById('text-align').value);
            component.set('table-vertical-align', document.getElementById('vertical-align').value);

            component.applyTableStyles();
            editor.Modal.close();
        });

        // Reset button
        document.getElementById('reset-styles').addEventListener('click', function () {
            document.getElementById('border-style').value = 'solid';
            document.getElementById('border-width').value = '1';
            document.getElementById('border-color').value = '#000000';
            document.getElementById('border-opacity').value = '100';
            document.getElementById('bg-color').value = '#ffffff';
            document.getElementById('text-color').value = '#000000';
            document.getElementById('font-family').value = 'Arial, sans-serif';
            document.getElementById('text-align').value = 'left';
            document.getElementById('vertical-align').value = 'middle';
            opacityValue.textContent = '100%';
        });

        // Cancel button
        document.getElementById('cancel-styles').addEventListener('click', function () {
            editor.Modal.close();
        });
    }
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
        const fontSizeInput = document.getElementById('highlight-font-size');
        fontSizeInput.value = component.get('highlight-font-size') || '14';


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
                fontFamily: fontFamilySelect.value,
                fontSize: fontSizeInput.value
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
            component.set('highlight-font-size', fontSizeInput.value);
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
}