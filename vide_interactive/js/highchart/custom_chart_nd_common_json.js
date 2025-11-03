function customChartCommonJson(editor) {
    function getJsonFileOptions() {
        const storedFileNames = localStorage.getItem('common_json_files');
        const options = [{ id: '0', name: 'Select File' }];

        if (storedFileNames) {
            const fileNames = storedFileNames.split(',').map(f => f.trim());
            fileNames.forEach((fileName, index) => {
                options.push({ id: (index + 1).toString(), name: fileName });
            });
        }
        return options;
    }
    const props_test_chart = (i) => i;
    const id_Trait = {
        name: "id",
        label: "Id",
    };

    const title_Trait = {
        name: "title",
        label: "Title",
    };

    const test_chart_Props = {
        name: "Chart",
        jsonpath: "",
    };

    const name_Trait = {
        changeProp: 1,
        type: "text",
        name: "name",
        label: "name",
        placeholder: "Chart Name",
    };

    const chartTitle_Trait = ["chartTitle"].map((name) => ({
        changeProp: 1,
        type: "text",
        label: "Chart Title",
        placeholder: "Enter Chart Title",
        name,
    }));

    const Select_title_Align_Trait = ["SelectTitleAlign"].map((name) => ({
        changeProp: 1,
        type: "select",
        label: "Select Title Align",
        options: [
            { value: 'left', label: 'Left' },
            { value: 'right', label: 'Right' },
            { value: 'center', label: 'Center' },
        ],
        default: 'left',
        name,
    }));

    const Select_chart_Trait = ["SelectChart"].map((name) => ({
        changeProp: 1,
        type: "select",
        label: "Select Chart",
        options: [
            { value: 'pie', label: 'Pie chart' },
            { value: 'line', label: 'Line chart' },
            { value: 'column', label: 'Column chart' },
            { value: 'bar', label: 'Bar chart' },
            { value: 'donut', label: 'Donut chart' },
            { value: 'scatter', label: 'Scatter chart' },
            { value: 'area', label: 'Area chart' },
            { value: 'bubble', label: 'Bubble chart' },
            { value: 'spiderweb', label: 'Spiderweb chart' },
            { value: 'candlestick', label: 'CandleStick chart' },
            { value: 'candlestick-live', label: 'Candlestick live chart' },
            { value: 'ohlc', label: 'OHLC chart' },
            { value: 'ohlc-live', label: 'OHLC live chart' },
            { value: 'line-column', label: 'Dual axis line and column chart' },
            { value: 'donut-3d', label: '3D Donut chart' },
            { value: 'pie-3d', label: '3D pie chart' },
            { value: 'column-3d', label: '3D Column chart' },
            { value: 'stacked-column', label: 'Stacked Column chart' },
            { value: 'stacked-bar', label: 'Stacked Bar chart' },
            { value: 'drilldown_pie', label: 'Drilldown Pie chart' },
            { value: 'drilldown_line', label: 'Drilldown Line chart' },
            { value: 'drilldown_bar', label: 'Drilldown Bar chart' },
        ],
        default: 'pie',
        name,
    }));
    const json_file_index_Trait = ["jsonFileIndex"].map((name) => ({
        changeProp: 1,
        type: "select",
        label: "Select JSON File",
        options: getJsonFileOptions(),
        default: '0',
        name,
    }));

    const json_path_Trait = ["jsonpath"].map((name) => ({
        changeProp: 1,
        type: "text",
        label: "Json Path",
        placeholder: "Enter Json Path",
        name,
    }));

    const chart_yAxis_Trait = ["ChartyAxis"].map((name) => ({
        changeProp: 1,
        type: "text",
        placeholder: "yAxis",
        label: "Chart yAxis",
        name,
    }));

    const Select_chart_layout_Trait = ["SelectChartLayout"].map((name) => ({
        changeProp: 1,
        type: "select",
        label: "Select Chart Layout",
        options: [
            { value: 'horizontal', label: 'Horizontal' },
            { value: 'vertical', label: 'Vertical' },
        ],
        default: 'horizontal',
        name,
    }));

    const json_button_sugesstionTrait = ["jsonButtonSugesstionTrait"].map((name) => ({
        changeProp: 1,
        type: "button",
        label: "Json Suggestion",
        placeholder: "Json Suggestion",
        name,
        text: "Suggestion",
        full: true,
    }));
    const swap_axis_Trait = ["swapAxis"].map((name) => ({
        changeProp: 1,
        type: "select",
        label: "Swap X/Y Axis",
        options: [
            { value: 'false', label: 'Normal' },
            { value: 'true', label: 'Inverted' },
        ],
        default: 'false',
        name,
    }));

    const legend_colors_Trait = ["legendColors"].map((name) => ({
        changeProp: 1,
        type: "text",
        label: "Legend Colors",
        placeholder: "e.g., #FF0000,#00FF00,#0000FF",
        name,
    }));

    const getTraitsForChartType = (chartType) => {
        const baseTraits = [
            name_Trait,
            ...chartTitle_Trait,
            ...Select_title_Align_Trait,
            ...Select_chart_Trait,
            ...json_file_index_Trait,
            ...json_path_Trait,
            ...json_button_sugesstionTrait,
            ...chart_yAxis_Trait,
            ...Select_chart_layout_Trait,
            ...legend_colors_Trait,
        ];


        const invertibleCharts = [
            'bar', 'column', 'line', 'area', 'scatter',
            'stacked-column', 'stacked-bar', 'line-column', 'bubble'
        ];

        if (invertibleCharts.includes(chartType)) {
            baseTraits.splice(-1, 0, ...swap_axis_Trait);
        }

        return baseTraits;
    };
    const all_Traits = getTraitsForChartType('pie');
    let jsonData = [];
    let common_json = null;
    try {
        common_json = JSON.parse(localStorage.getItem("common_json") || 'null');
    } catch (e) {
        common_json = null;
    }

    if (common_json !== null) {
        jsonData.length = 0;
        jsonData.push(common_json);
        jsonData = JSON.stringify(jsonData);
    }

    editor.Components.addType("custom_line_chart", {
        model: {
            defaults: props_test_chart({
                ...test_chart_Props,
                tagName: "figure",
                resizable: 1,
                custom_line_chartsrc: "https://code.highcharts.com/11.4.8/highcharts.js",
                droppable: 0,
                stylable: 1,
                attributes: { 'data-i_designer-type': 'custom_line_chart' },
                traits: [id_Trait, title_Trait, ...all_Traits],
                style: {
                    padding: "2px",
                    width: "100%",
                },
                script: function () {
                    const initializeChart = () => {
                        const ctx = this.id;
                        const element = document.getElementById(ctx);

                        if (!element) {
                            console.warn('Chart container not found:', ctx);
                            return;
                        }

                        let chart_Title = "{[ chartTitle ]}" || "Chart Title";
                        let chart_Title_align = "{[ SelectTitleAlign ]}" || "left";
                        let JsonPath1 = "{[ jsonpath ]}" || "";
                        let chartType = "{[ SelectChart ]}" || "pie";
                        let chart_yAxis = "{[ ChartyAxis ]}" || "Values";
                        let chart_layout = "{[ SelectChartLayout ]}" || "horizontal";
                        let swapAxis = "{[ swapAxis ]}" === "true" || false;
                        let legendColors = "{[ legendColors ]}" || "";
                        let customColors = null;
                        if (legendColors && legendColors.trim()) {
                            customColors = legendColors.split(',')
                                .map(color => color.trim())
                                .filter(color => color && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color));

                            if (customColors.length === 0) {
                                customColors = null;
                            }
                        }

                        let language = 'english';
                        let project_type = 'developmentJsonType';
                        let str = null;
                        let seriesData = {};

                        try {
                            if (typeof localStorage !== 'undefined') {
                                language = localStorage.getItem('language') || 'english';

                                // Get file index
                                let fileIndex = "{[ jsonFileIndex ]}" || '0';
                                let common_json_data = null;

                                if (fileIndex !== '0') {
                                    const fileNames = (localStorage.getItem('common_json_files') || "").split(',').map(f => f.trim());
                                    const selectedFile = fileNames[parseInt(fileIndex) - 1];
                                    const jsonString = localStorage.getItem(`common_json_${selectedFile}`);
                                    if (jsonString) {
                                        common_json_data = JSON.parse(jsonString);
                                    }
                                } else {
                                    common_json_data = JSON.parse(localStorage.getItem('common_json') || 'null');
                                }

                                if (common_json_data && JsonPath1) {
                                    str = common_json_data[language] && common_json_data[language][JsonPath1];
                                }
                            }

                            if (typeof project_type2 !== 'undefined' && project_type2 === 'downloadedJsonType') {
                                project_type = 'downloadedJsonType';
                                if (typeof jsonData1 !== 'undefined' && jsonData1[0] && JsonPath1) {
                                    str = jsonData1[0][language] && jsonData1[0][language][JsonPath1];
                                }
                            }

                            if (str) {
                                seriesData = eval(str);
                                if (!seriesData.series) {
                                    throw new Error("Series array not found");
                                }
                            }
                        } catch (e) {
                            console.warn("JSON path evaluation failed, using default data:", e.message);
                            seriesData = {};
                        }

                        let seriesData2 = {};
                        let chartAlign = chart_layout + 'Align';

                        if (chartType === 'pie') {
                            if (!seriesData.series) {
                                seriesData = {
                                    "series": [{
                                        data: [{
                                            name: "Chrome",
                                            y: 70.67
                                        }, {
                                            name: "Edge",
                                            y: 14.77
                                        }, {
                                            name: "Firefox",
                                            y: 4.86
                                        }]
                                    }]
                                };
                            }
                            seriesData2 = {
                                chart: {
                                    plotBackgroundColor: null,
                                    plotBorderWidth: null,
                                    plotShadow: false,
                                    type: chartType,
                                    animation: false,
                                },
                                title: {
                                    text: chart_Title,
                                    align: chart_Title_align
                                },
                                series: seriesData.series,
                                tooltip: {
                                    pointFormat: "{series.name}: <b>{point.percentage:.1f}%</b>"
                                },
                                accessibility: {
                                    point: {
                                        valueSuffix: "%"
                                    }
                                },
                                credits: {
                                    enabled: false
                                },
                                plotOptions: {
                                    pie: {
                                        allowPointSelect: true,
                                        cursor: "pointer",
                                        colors: customColors,
                                        dataLabels: {
                                            enabled: false
                                        },
                                        showInLegend: true,
                                        animation: false
                                    }
                                },
                            };
                        }

                        if (chartType === 'bar') {
                            if (!seriesData.series) {
                                seriesData = {
                                    "xAxis": {
                                        "categories": ["Africa", "America", "Asia", "Europe", "Oceania"]
                                    },
                                    "series": [{
                                        "name": "Year 1990",
                                        "data": [631, 727, 3202, 721, 26]
                                    }, {
                                        "name": "Year 2000",
                                        "data": [814, 841, 3714, 726, 31]
                                    }, {
                                        "name": "Year 2010",
                                        "data": [1044, 944, 4170, 735, 40]
                                    }, {
                                        "name": "Year 2018",
                                        "data": [1276, 1007, 4561, 746, 42]
                                    }]
                                };
                            }
                            seriesData2 = {
                                chart: {
                                    plotBackgroundColor: null,
                                    plotBorderWidth: null,
                                    plotShadow: false,
                                    type: "bar",
                                    animation: false,
                                    inverted: swapAxis
                                },
                                title: {
                                    text: chart_Title,
                                    align: chart_Title_align
                                },
                                xAxis: {
                                    categories: seriesData.xAxis.categories,
                                    title: {
                                        text: null
                                    }
                                },
                                yAxis: {
                                    title: {
                                        text: chart_yAxis
                                    }
                                },
                                tooltip: {
                                    valueSuffix: " millions"
                                },
                                plotOptions: {
                                    bar: {
                                        dataLabels: {
                                            enabled: true
                                        },
                                        animation: false
                                    },
                                    colors: customColors,
                                },
                                legend: {
                                    layout: chart_layout,
                                    align: "right",
                                    [chartAlign]: "top",
                                    x: -40,
                                    y: 80,
                                    floating: true,
                                    borderWidth: 1,
                                    backgroundColor: "#FFFFFF",
                                    shadow: true
                                },
                                credits: {
                                    enabled: false
                                },
                                series: seriesData.series,
                            };
                        }

                        if (chartType === 'line') {
                            if (!seriesData.series) {
                                seriesData = {
                                    "series": [{
                                        "name": "Installation & Developers",
                                        "data": [43934, 48656, 65165, 81827, 112143, 142383, 171533, 165174, 155157, 161454, 154610]
                                    }, {
                                        "name": "Manufacturing",
                                        "data": [24916, 37941, 29742, 29851, 32490, 30282, 38121, 36885, 33726, 34243, 31050]
                                    }]
                                };
                            }
                            seriesData2 = {
                                chart: {
                                    plotBackgroundColor: null,
                                    plotBorderWidth: null,
                                    plotShadow: false,
                                    type: "line",
                                    animation: false,
                                    inverted: swapAxis
                                },
                                title: {
                                    text: chart_Title,
                                    align: chart_Title_align
                                },
                                yAxis: {
                                    title: {
                                        text: chart_yAxis
                                    }
                                },
                                series: seriesData.series,
                                xAxis: {
                                    accessibility: {
                                        rangeDescription: ""
                                    }
                                },
                                legend: {
                                    layout: chart_layout,
                                    align: "right",
                                    [chartAlign]: "middle"
                                },
                                plotOptions: {
                                    series: {
                                        label: {
                                            connectorAllowed: false
                                        },
                                        pointStart: 2010,
                                        colors: customColors,
                                        animation: false
                                    }
                                },
                                responsive: {
                                    rules: [{
                                        condition: {
                                            maxWidth: 500
                                        },
                                        chartOptions: {
                                            legend: {
                                                layout: chart_layout,
                                                align: "center",
                                                [chartAlign]: "bottom"
                                            }
                                        }
                                    }]
                                },
                                colors: null,
                                credits: { enabled: false }
                            };
                        }

                        if (chartType === 'column') {
                            if (!seriesData.series) {
                                seriesData = {
                                    "xAxis": {
                                        "categories": ["Africa", "America", "Asia"],
                                    },
                                    "series": [{
                                        "name": "Year 1990",
                                        "data": [631, 727, 3202]
                                    }, {
                                        "name": "Year 2000",
                                        "data": [814, 841, 3714]
                                    }, {
                                        "name": "Year 2010",
                                        "data": [1044, 944, 4170]
                                    }]
                                };
                            }
                            seriesData2 = {
                                chart: {
                                    plotBackgroundColor: null,
                                    plotBorderWidth: null,
                                    plotShadow: false,
                                    type: "column",
                                    animation: false,
                                    inverted: swapAxis
                                },
                                title: {
                                    text: chart_Title,
                                    align: chart_Title_align
                                },
                                xAxis: {
                                    categories: seriesData.xAxis.categories,
                                    title: {
                                        text: null
                                    }
                                },
                                yAxis: {
                                    min: 0,
                                    title: {
                                        text: chart_yAxis
                                    },
                                    labels: {
                                        overflow: "justify"
                                    }
                                },
                                tooltip: {
                                    valueSuffix: " millions"
                                },
                                plotOptions: {
                                    column: {
                                        dataLabels: {
                                            enabled: true
                                        },
                                        animation: false
                                    },
                                    colors: customColors,
                                },
                                legend: {
                                    layout: chart_layout,
                                    align: "right",
                                    [chartAlign]: "top",
                                    x: -40,
                                    y: 80,
                                    floating: true,
                                    borderWidth: 1,
                                    backgroundColor: "#FFFFFF",
                                    shadow: true
                                },
                                credits: {
                                    enabled: false
                                },

                                series: seriesData.series
                            };
                        }

                        if (chartType === 'stacked-column') {
                            if (!seriesData.series) {
                                seriesData = {
                                    "xAxis": {
                                        categories: ['Arsenal', 'Chelsea'],
                                    },
                                    "series": [{
                                        name: 'BPL',
                                        data: [3, 55]
                                    }, {
                                        name: 'FA Cup',
                                        data: [14, 8]
                                    }, {
                                        name: 'CL',
                                        data: [0, 2]
                                    }]
                                };
                            }
                            seriesData2 = {
                                chart: {
                                    type: 'column',
                                    animation: false,
                                    inverted: swapAxis
                                },
                                title: {
                                    text: chart_Title,
                                    align: chart_Title_align
                                },
                                xAxis: {
                                    categories: seriesData.xAxis.categories,
                                },
                                yAxis: {
                                    min: 0,
                                    title: {
                                        text: chart_yAxis
                                    },
                                    stackLabels: {
                                        enabled: true,
                                        style: {
                                            fontWeight: 'bold',
                                            color: 'gray',
                                            textOutline: 'none'
                                        }
                                    }
                                },
                                legend: {
                                    layout: chart_layout,
                                    align: 'left',
                                    x: 70,
                                    verticalAlign: 'top',
                                    y: 70,
                                    floating: true,
                                    backgroundColor: 'white',
                                    borderColor: '#CCC',
                                    borderWidth: 1,
                                    shadow: false
                                },
                                tooltip: {
                                    headerFormat: '<b>{point.x}</b><br/>',
                                    pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}'
                                },
                                plotOptions: {
                                    column: {
                                        stacking: 'normal',
                                        dataLabels: {
                                            enabled: true
                                        },
                                        animation: false
                                    },
                                    colors: customColors,
                                },

                                series: seriesData.series
                            };
                        }

                        if (chartType === 'stacked-bar') {
                            if (!seriesData.series) {
                                seriesData = {
                                    "xAxis": {
                                        categories: ['2020/21', '2019/20', '2018/19'],
                                    },
                                    "series": [{
                                        name: 'Cristiano Ronaldo',
                                        data: [4, 4, 6]
                                    }, {
                                        name: 'Lionel Messi',
                                        data: [5, 3, 12]
                                    }, {
                                        name: 'Robert Lewandowski',
                                        data: [5, 15, 8]
                                    }]
                                };
                            }
                            seriesData2 = {
                                chart: {
                                    type: 'bar',
                                    animation: false,
                                    inverted: swapAxis
                                },
                                title: {
                                    text: chart_Title,
                                    align: chart_Title_align
                                },
                                xAxis: {
                                    categories: seriesData.xAxis.categories,
                                },
                                yAxis: {
                                    min: 0,
                                    title: {
                                        text: chart_yAxis
                                    }
                                },
                                legend: {
                                    reversed: true
                                },
                                plotOptions: {
                                    series: {
                                        stacking: 'normal',
                                        dataLabels: {
                                            enabled: true
                                        },
                                        animation: false
                                    },
                                    colors: customColors,
                                },

                                series: seriesData.series
                            };
                        }

                        if (chartType === 'drilldown_bar') {
                            if (!seriesData.series) {
                                seriesData = {
                                    "series": [{
                                        "name": "Browsers",
                                        "colorByPoint": true,
                                        "data": [{
                                            "name": "Chrome",
                                            "y": 61.04,
                                            "drilldown": "Chrome"
                                        }, {
                                            "name": "Safari",
                                            "y": 9.47,
                                            "drilldown": "Safari"
                                        }, {
                                            "name": "Other",
                                            "y": 11.02,
                                            "drilldown": null
                                        }]
                                    }],
                                    "drilldown": {
                                        "series": [{
                                            "name": "Chrome",
                                            "id": "Chrome",
                                            "data": [["v97.0", 36.89], ["v96.0", 18.16], ["v95.0", 0.54]]
                                        }, {
                                            "name": "Safari",
                                            "id": "Safari",
                                            "data": [["v15.3", 0.1], ["v15.2", 2.01], ["v15.1", 2.29]]
                                        }]
                                    }
                                };
                            }
                            seriesData2 = {
                                chart: {
                                    type: "bar",
                                    animation: false
                                },
                                title: {
                                    text: chart_Title,
                                    align: chart_Title_align
                                },

                                xAxis: {
                                    type: "category"
                                },
                                yAxis: {
                                    title: {
                                        text: chart_yAxis
                                    }
                                },
                                tooltip: {
                                    valueSuffix: ""
                                },
                                plotOptions: {
                                    series: {
                                        borderWidth: 0,
                                        dataLabels: {
                                            enabled: true,
                                            format: "{point.y:.1f}%"
                                        },
                                        animation: false,
                                        colors: customColors,
                                    }
                                },
                                legend: {
                                    enabled: false
                                },
                                credits: {
                                    enabled: false
                                },
                                series: seriesData.series,
                                drilldown: seriesData.drilldown
                            };
                        }

                        if (chartType === 'drilldown_pie') {
                            if (!seriesData.series) {
                                seriesData = {
                                    "series": [{
                                        "name": "Browsers",
                                        "colorByPoint": true,
                                        "data": [{
                                            "name": "Chrome",
                                            "y": 61.04,
                                            "drilldown": "Chrome"
                                        }, {
                                            "name": "Safari",
                                            "y": 9.47,
                                            "drilldown": "Safari"
                                        }]
                                    }],
                                    "drilldown": {
                                        "series": [{
                                            "name": "Chrome",
                                            "id": "Chrome",
                                            "data": [["v97.0", 36.89], ["v96.0", 18.16], ["v95.0", 0.54]]
                                        }, {
                                            "name": "Safari",
                                            "id": "Safari",
                                            "data": [["v15.3", 0.1], ["v15.2", 2.01]]
                                        }]
                                    }
                                };
                            }
                            seriesData2 = {
                                chart: {
                                    type: "pie",
                                    animation: false
                                },
                                title: {
                                    text: chart_Title,
                                    align: chart_Title_align
                                },

                                tooltip: {
                                    pointFormat: "{series.name}: <b>{point.percentage:.1f}%</b>"
                                },
                                accessibility: {
                                    point: {
                                        valueSuffix: "%"
                                    }
                                },
                                credits: {
                                    enabled: false
                                },
                                plotOptions: {
                                    pie: {
                                        allowPointSelect: true,
                                        cursor: "pointer",
                                        dataLabels: {
                                            enabled: false
                                        },
                                        colors: customColors,
                                        showInLegend: true,
                                        animation: false
                                    }
                                },
                                series: seriesData.series,
                                drilldown: seriesData.drilldown
                            };
                        }

                        if (chartType === 'drilldown_line') {
                            if (!seriesData.series) {
                                seriesData = {
                                    "series": [{
                                        "name": "Things",
                                        "colorByPoint": true,
                                        "data": [{
                                            "name": "Animals",
                                            "y": 5,
                                            "drilldown": "animals"
                                        }, {
                                            "name": "Fruits",
                                            "y": 2,
                                            "drilldown": "fruits"
                                        }]
                                    }],
                                    "drilldown": {
                                        "series": [{
                                            "id": "animals",
                                            "data": [["Cats", 4], ["Dogs", 2], ["Cows", 1]]
                                        }, {
                                            "id": "fruits",
                                            "data": [["Apples", 4], ["Oranges", 2]]
                                        }]
                                    }
                                };
                            }
                            seriesData2 = {
                                chart: {
                                    type: "line",
                                    animation: false
                                },
                                title: {
                                    text: chart_Title,
                                    align: chart_Title_align
                                },

                                yAxis: {
                                    title: {
                                        text: chart_yAxis
                                    }
                                },
                                series: seriesData.series,
                                drilldown: seriesData.drilldown,
                                xAxis: {
                                    accessibility: {
                                        rangeDescription: ""
                                    }
                                },
                                legend: {
                                    layout: chart_layout,
                                    align: "right",
                                    [chartAlign]: "middle"
                                },
                                plotOptions: {
                                    series: {
                                        label: {
                                            connectorAllowed: false
                                        },
                                        pointStart: 2010,
                                        animation: false,
                                        colors: customColors,
                                    }
                                },
                                responsive: {
                                    rules: [{
                                        condition: {
                                            maxWidth: 500
                                        },
                                        chartOptions: {
                                            legend: {
                                                layout: chart_layout,
                                                align: "center",
                                                verticalAlign: "bottom"
                                            }
                                        }
                                    }]
                                },
                                credits: { enabled: false },
                            };
                        }

                        if (chartType === 'donut') {
                            if (!seriesData.series) {
                                seriesData = {
                                    series: [{
                                        name: 'Registrations',
                                        colorByPoint: true,
                                        innerSize: '75%',
                                        data: [
                                            { name: 'EV', y: 23.9 },
                                            { name: 'Hybrids', y: 12.6 },
                                            { name: 'Diesel', y: 37.0 },
                                            { name: 'Petrol', y: 26.4 }
                                        ]
                                    }]
                                };
                            }

                            seriesData2 = {
                                chart: {
                                    type: 'pie',
                                    animation: false,
                                    custom: {},
                                    events: {
                                        render() {
                                            const chart = this,
                                                series = chart.series[0];
                                            let customLabel = chart.options.chart.custom.label;

                                            if (!customLabel) {
                                                customLabel = chart.options.chart.custom.label = chart.renderer.label(
                                                    'Total<br/><strong>2 877 820</strong>'
                                                )
                                                    .css({
                                                        color: 'var(--highcharts-neutral-color-100, #000)',
                                                        textAnchor: 'middle'
                                                    })
                                                    .add();
                                            }

                                            const x = series.center[0] + chart.plotLeft;
                                            const y = series.center[1] + chart.plotTop - (customLabel.attr('height') / 2);

                                            customLabel.attr({ x, y });

                                            customLabel.css({
                                                fontSize: `${series.center[2] / 12}px`
                                            });
                                        }
                                    }
                                },
                                title: {
                                    text: chart_Title,
                                    align: chart_Title_align
                                },

                                accessibility: {
                                    point: {
                                        valueSuffix: '%'
                                    }
                                },
                                tooltip: {
                                    pointFormat: '{series.name}: <b>{point.percentage:.0f}%</b>'
                                },
                                legend: {
                                    enabled: false
                                },
                                plotOptions: {
                                    series: {
                                        allowPointSelect: true,
                                        cursor: 'pointer',
                                        borderRadius: 8,
                                        colors: customColors,
                                        dataLabels: [
                                            {
                                                enabled: true,
                                                distance: 20,
                                                format: '{point.name}'
                                            },
                                            {
                                                enabled: true,
                                                distance: -15,
                                                format: '{point.percentage:.0f}%',
                                                style: {
                                                    fontSize: '0.9em'
                                                }
                                            }
                                        ],
                                        showInLegend: true
                                    }
                                },
                                series: seriesData.series,
                                credits: { enabled: false }
                            };
                        }

                        if (chartType === 'scatter') {
                            if (!seriesData.series) {
                                seriesData = {
                                    series: [
                                        {
                                            name: 'Basketball',
                                            marker: { symbol: 'circle' },
                                            data: [
                                                [2.01, 98], [2.05, 104], [2.00, 95], [2.10, 110], [2.02, 102]
                                            ]
                                        },
                                        {
                                            name: 'Triathlon',
                                            marker: { symbol: 'triangle' },
                                            data: [
                                                [1.75, 65], [1.80, 70], [1.78, 68], [1.82, 72], [1.76, 67]
                                            ]
                                        },
                                        {
                                            name: 'Volleyball',
                                            marker: { symbol: 'square' },
                                            data: [
                                                [1.90, 85], [1.88, 82], [1.95, 90], [1.92, 88], [1.87, 84]
                                            ]
                                        }
                                    ]
                                };
                            }

                            seriesData2 = {
                                chart: {
                                    type: 'scatter',
                                    animation: false,
                                    zooming: {
                                        type: 'xy'
                                    },
                                    inverted: swapAxis
                                },
                                title: {
                                    text: chart_Title || 'Olympics athletes by height and weight',
                                    align: chart_Title_align || 'center'
                                },
                                xAxis: {
                                    title: { text: 'Height' },
                                    labels: { format: '{value} m' },
                                    startOnTick: true,
                                    endOnTick: true,
                                    showLastLabel: true
                                },
                                yAxis: {
                                    title: { text: 'Weight' },
                                    labels: { format: '{value} kg' }
                                },
                                legend: {
                                    enabled: true,
                                    layout: chart_layout || 'vertical',
                                    align: 'right',
                                    [chartAlign || 'verticalAlign']: 'middle'
                                },
                                tooltip: {
                                    pointFormat: 'Height: {point.x} m <br/> Weight: {point.y} kg'
                                },
                                plotOptions: {
                                    scatter: {
                                        marker: {
                                            radius: 2.5,
                                            symbol: 'circle',
                                            states: {
                                                hover: {
                                                    enabled: true,
                                                    lineColor: 'rgb(100,100,100)'
                                                }
                                            }
                                        },
                                        states: {
                                            hover: {
                                                marker: {
                                                    enabled: false
                                                }
                                            }
                                        },
                                        jitter: { x: 0.005 }
                                    },
                                    colors: customColors,
                                },

                                series: seriesData.series,
                                credits: { enabled: false }
                            };
                        }

                        if (chartType === 'area') {
                            if (!seriesData.series) {
                                seriesData = {
                                    series: [{
                                        name: 'Asia',
                                        data: [502, 635, 809, 947, 1402, 3634, 5268]
                                    }, {
                                        name: 'Africa',
                                        data: [106, 107, 111, 133, 221, 767, 1766]
                                    }, {
                                        name: 'Europe',
                                        data: [163, 203, 276, 408, 547, 729, 628]
                                    }, {
                                        name: 'America',
                                        data: [18, 31, 54, 156, 339, 818, 1201]
                                    }, {
                                        name: 'Oceania',
                                        data: [2, 2, 2, 6, 13, 30, 46]
                                    }]
                                };
                            }

                            seriesData2 = {
                                chart: {
                                    type: 'area',
                                    animation: false,
                                    inverted: swapAxis
                                },
                                title: {
                                    text: chart_Title || 'Historic and Estimated Population Growth by Region',
                                    align: chart_Title_align || 'center'
                                },
                                xAxis: {
                                    allowDecimals: false,
                                    labels: {
                                        formatter: function () {
                                            return this.value;
                                        }
                                    },
                                    accessibility: {
                                        rangeDescription: 'Range: 1750 to 2050'
                                    },
                                    categories: ['1750', '1800', '1850', '1900', '1950', '2000', '2050']
                                },
                                yAxis: {
                                    title: {
                                        text: 'Population (millions)'
                                    },
                                    labels: {
                                        formatter: function () {
                                            return this.value / 1000 + 'B';
                                        }
                                    }
                                },
                                tooltip: {
                                    pointFormat: '{series.name} had <b>{point.y:,.0f}</b><br/> people in {point.category}'
                                },
                                plotOptions: {
                                    area: {
                                        stacking: 'normal',
                                        lineColor: '#666666',
                                        lineWidth: 1,
                                        marker: {
                                            lineWidth: 1,
                                            lineColor: '#666666'
                                        }
                                    },
                                    colors: customColors,
                                },
                                legend: {
                                    layout: chart_layout || 'vertical',
                                    align: 'right',
                                    [chartAlign || 'verticalAlign']: 'middle'
                                },

                                series: seriesData.series,
                                credits: { enabled: false }
                            };
                        }

                        if (chartType === 'bubble') {
                            if (!seriesData.series) {
                                seriesData = {
                                    series: [{
                                        colorByPoint: true,
                                        data: [
                                            { x: 95, y: 95, z: 13.8, name: 'BE', country: 'Belgium' },
                                            { x: 86.5, y: 102.9, z: 14.7, name: 'DE', country: 'Germany' },
                                            { x: 80.8, y: 91.5, z: 15.8, name: 'FI', country: 'Finland' },
                                            { x: 80.4, y: 102.5, z: 12, name: 'NL', country: 'Netherlands' },
                                            { x: 80.3, y: 86.1, z: 11.8, name: 'SE', country: 'Sweden' },
                                            { x: 78.4, y: 70.1, z: 16.6, name: 'ES', country: 'Spain' },
                                            { x: 74.2, y: 68.5, z: 14.5, name: 'FR', country: 'France' },
                                            { x: 73.5, y: 83.1, z: 10, name: 'NO', country: 'Norway' },
                                            { x: 71, y: 93.2, z: 24.7, name: 'UK', country: 'United Kingdom' },
                                            { x: 69.2, y: 57.6, z: 10.4, name: 'IT', country: 'Italy' },
                                            { x: 68.6, y: 20, z: 16, name: 'RU', country: 'Russia' },
                                            { x: 65.5, y: 126.4, z: 35.3, name: 'US', country: 'United States' },
                                            { x: 65.4, y: 50.8, z: 28.5, name: 'HU', country: 'Hungary' },
                                            { x: 63.4, y: 51.8, z: 15.4, name: 'PT', country: 'Portugal' },
                                            { x: 64, y: 82.9, z: 31.3, name: 'NZ', country: 'New Zealand' }
                                        ]
                                    }]
                                };
                            }

                            seriesData2 = {
                                chart: {
                                    type: 'bubble',
                                    animation: false,
                                    plotBorderWidth: 1,
                                    zooming: {
                                        type: 'xy'
                                    },
                                    inverted: swapAxis
                                },
                                title: {
                                    text: chart_Title || 'Sugar and fat intake per country',
                                    align: chart_Title_align || 'center'
                                },

                                accessibility: {
                                    point: {
                                        valueDescriptionFormat:
                                            '{index}. {point.name}, fat: {point.x}g, sugar: {point.y}g, obesity: {point.z}%.'
                                    }
                                },
                                xAxis: {
                                    gridLineWidth: 1,
                                    title: { text: 'Daily fat intake' },
                                    labels: { format: '{value} gr' },
                                    plotLines: [{
                                        dashStyle: 'dot',
                                        width: 2,
                                        value: 65,
                                        label: {
                                            rotation: 0,
                                            y: 15,
                                            style: { fontStyle: 'italic' },
                                            text: 'Safe fat intake 65g/day'
                                        },
                                        zIndex: 3
                                    }],
                                    accessibility: {
                                        rangeDescription: 'Range: 60 to 100 grams.'
                                    }
                                },
                                yAxis: {
                                    startOnTick: false,
                                    endOnTick: false,
                                    title: { text: 'Daily sugar intake' },
                                    labels: { format: '{value} gr' },
                                    maxPadding: 0.2,
                                    plotLines: [{
                                        dashStyle: 'dot',
                                        width: 2,
                                        value: 50,
                                        label: {
                                            align: 'right',
                                            style: { fontStyle: 'italic' },
                                            text: 'Safe sugar intake 50g/day',
                                            x: -10
                                        },
                                        zIndex: 3
                                    }],
                                    accessibility: {
                                        rangeDescription: 'Range: 0 to 160 grams.'
                                    }
                                },
                                legend: {
                                    enabled: false
                                },
                                tooltip: {
                                    useHTML: true,
                                    headerFormat: '<table>',
                                    pointFormat:
                                        '<tr><th colspan="2"><h3>{point.country}</h3></th></tr>' +
                                        '<tr><th>Fat intake:</th><td>{point.x}g</td></tr>' +
                                        '<tr><th>Sugar intake:</th><td>{point.y}g</td></tr>' +
                                        '<tr><th>Obesity (adults):</th><td>{point.z}%</td></tr>',
                                    footerFormat: '</table>',
                                    followPointer: true
                                },
                                plotOptions: {
                                    series: {
                                        dataLabels: {
                                            enabled: true,
                                            format: '{point.name}'
                                        }
                                    },
                                    colors: customColors,
                                },
                                series: seriesData.series,
                                credits: { enabled: false }
                            };
                        }

                        if (chartType === 'spiderweb') {
                            if (!seriesData.series) {
                                seriesData = {
                                    series: [
                                        {
                                            name: 'Allocated Budget',
                                            data: [43000, 19000, 60000, 35000, 17000, 10000],
                                            pointPlacement: 'on'
                                        },
                                        {
                                            name: 'Actual Spending',
                                            data: [50000, 39000, 42000, 31000, 26000, 14000],
                                            pointPlacement: 'on'
                                        }
                                    ]
                                };
                            }

                            seriesData2 = {
                                chart: {
                                    polar: true,
                                    type: 'line',
                                    animation: false
                                },
                                title: {
                                    text: chart_Title || 'Budget vs spending',
                                    x: -80,
                                    align: chart_Title_align || 'center'
                                },

                                accessibility: {
                                    description:
                                        'A spiderweb chart compares the allocated budget against actual spending. Each spoke represents a department. The chart shows departments like Marketing and IT overspending the most.'
                                },
                                pane: {
                                    size: '80%'
                                },
                                xAxis: {
                                    categories: [
                                        'Sales',
                                        'Marketing',
                                        'Development',
                                        'Customer Support',
                                        'Information Technology',
                                        'Administration'
                                    ],
                                    tickmarkPlacement: 'on',
                                    lineWidth: 0
                                },
                                yAxis: {
                                    gridLineInterpolation: 'polygon',
                                    lineWidth: 0,
                                    min: 0
                                },
                                tooltip: {
                                    shared: true,
                                    pointFormat:
                                        '<span style="color:{series.color}">{series.name}: <b>${point.y:,.0f}</b><br/>'
                                },
                                legend: {
                                    layout: chart_layout || 'vertical',
                                    align: 'right',
                                    [chartAlign || 'verticalAlign']: 'middle'
                                },
                                responsive: {
                                    rules: [{
                                        condition: {
                                            maxWidth: 500
                                        },
                                        chartOptions: {
                                            title: {
                                                x: 0
                                            },
                                            legend: {
                                                align: 'center',
                                                verticalAlign: 'bottom',
                                                layout: 'horizontal'
                                            },
                                            pane: {
                                                size: '70%'
                                            }
                                        }
                                    }]
                                },
                                series: seriesData.series,
                                credits: { enabled: false }
                            };
                        }

                        if (chartType === 'candlestick') {
                            if (!seriesData.series) {
                                seriesData = {
                                    series: [{
                                        type: 'candlestick',
                                        name: 'AAPL',
                                        data: [
                                            [Date.UTC(2024, 4, 1), 140.0, 145.0, 138.0, 143.0],
                                            [Date.UTC(2024, 4, 2), 143.0, 147.0, 141.0, 146.5],
                                            [Date.UTC(2024, 4, 3), 146.5, 150.0, 145.0, 148.0],
                                            [Date.UTC(2024, 4, 4), 148.0, 149.0, 144.0, 145.0],
                                            [Date.UTC(2024, 4, 5), 145.0, 146.0, 140.0, 142.0]
                                        ]
                                    }]
                                };
                            }

                            seriesData2 = {
                                chart: {
                                    type: 'candlestick',
                                    animation: false
                                },
                                title: {
                                    text: chart_Title || 'AAPL Stock Price (Demo)',
                                    align: chart_Title_align || 'center'
                                },
                                xAxis: {
                                    type: 'datetime'
                                },
                                yAxis: {
                                    title: {
                                        text: 'Stock Price'
                                    }
                                },
                                tooltip: {
                                    split: true,
                                    valueDecimals: 2
                                },
                                plotOptions: {
                                    series: {
                                        color: customColors ? customColors[0] : '#d32f2f',
                                        upColor: customColors ? customColors[1] : '#388e3c'
                                    }
                                },
                                series: seriesData.series,
                                responsive: {
                                    rules: [{
                                        condition: {
                                            maxWidth: 500
                                        },
                                        chartOptions: {
                                            xAxis: {
                                                labels: {
                                                    rotation: -45
                                                }
                                            }
                                        }
                                    }]
                                },
                                credits: {
                                    enabled: false
                                }
                            };
                        }

                        if (chartType === 'candlestick-live') {
                            const symbol = 'btcusdt';
                            const interval = '1m';

                            seriesData = {
                                series: [{
                                    type: 'candlestick',
                                    name: 'BTC/USDT',
                                    id: 'live-series',
                                    data: []
                                }]
                            };

                            seriesData2 = {
                                chart: {
                                    type: 'candlestick',
                                    events: {
                                        load: function () {
                                            const chart = this;
                                            const series = chart.get('live-series');

                                            fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=100`)
                                                .then(res => res.json())
                                                .then(data => {
                                                    const ohlc = data.map(d => [
                                                        d[0],
                                                        parseFloat(d[1]),
                                                        parseFloat(d[2]),
                                                        parseFloat(d[3]),
                                                        parseFloat(d[4]),
                                                    ]);
                                                    series.setData(ohlc, true, false, false);
                                                });


                                            const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@kline_${interval}`);

                                            ws.onmessage = function (event) {
                                                const msg = JSON.parse(event.data);
                                                const k = msg.k;

                                                const point = [
                                                    k.t,
                                                    parseFloat(k.o),
                                                    parseFloat(k.h),
                                                    parseFloat(k.l),
                                                    parseFloat(k.c)
                                                ];

                                                const last = series.data[series.data.length - 1];
                                                if (last && last.x === point[0]) {

                                                    last.update({
                                                        open: point[1],
                                                        high: point[2],
                                                        low: point[3],
                                                        close: point[4]
                                                    }, true, false);
                                                } else {

                                                    series.addPoint(point, true, series.data.length > 100);
                                                }
                                            };
                                        }
                                    }
                                },
                                title: {
                                    text: chart_Title || 'Live BTC/USDT Candlestick Chart',
                                    align: chart_Title_align || 'center'
                                },

                                xAxis: {
                                    type: 'datetime'
                                },
                                yAxis: {
                                    title: {
                                        text: 'Price'
                                    }
                                },
                                tooltip: {
                                    split: true,
                                    valueDecimals: 2
                                },
                                plotOptions: {
                                    candlestick: {
                                        color: customColors ? customColors[0] : '#d32f2f',
                                        upColor: customColors ? customColors[1] : '#388e3c'
                                    }
                                },
                                series: seriesData.series,
                                credits: {
                                    enabled: false
                                }
                            };
                        }

                        if (chartType === 'ohlc') {
                            seriesData = {
                                series: [{
                                    type: 'ohlc',
                                    name: 'Demo OHLC',
                                    id: 'ohlc-static-series',
                                    data: [
                                        [Date.UTC(2023, 7, 1), 100, 110, 90, 105],
                                        [Date.UTC(2023, 7, 2), 105, 115, 95, 100],
                                        [Date.UTC(2023, 7, 3), 100, 108, 97, 107],
                                        [Date.UTC(2023, 7, 4), 107, 112, 102, 104],
                                        [Date.UTC(2023, 7, 5), 104, 118, 100, 117]
                                    ]
                                }]
                            };

                            seriesData2 = {
                                chart: {
                                    type: 'ohlc'
                                },
                                title: {
                                    text: chart_Title || 'Static OHLC Chart',
                                    align: chart_Title_align || 'center'
                                },

                                xAxis: {
                                    type: 'datetime'
                                },
                                yAxis: {
                                    title: {
                                        text: 'Price'
                                    }
                                },
                                tooltip: {
                                    split: true,
                                    valueDecimals: 2
                                },
                                plotOptions: {
                                    ohlc: {
                                        color: customColors ? customColors[0] : '#d32f2f',
                                        upColor: customColors ? customColors[1] : '#388e3c'
                                    }
                                },
                                series: seriesData.series,
                                credits: {
                                    enabled: false
                                }
                            };
                        }


                        if (chartType === 'ohlc-live') {
                            const symbol = 'btcusdt';
                            const interval = '1m';

                            seriesData = {
                                series: [{
                                    type: 'ohlc',
                                    name: 'BTC/USDT',
                                    id: 'live-ohlc-series',
                                    data: []
                                }]
                            };

                            seriesData2 = {
                                chart: {
                                    type: 'ohlc',
                                    events: {
                                        load: function () {
                                            const chart = this;
                                            const series = chart.get('live-ohlc-series');

                                            fetch(`https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=100`)
                                                .then(res => res.json())
                                                .then(data => {
                                                    const ohlc = data.map(d => [
                                                        d[0],
                                                        parseFloat(d[1]),
                                                        parseFloat(d[2]),
                                                        parseFloat(d[3]),
                                                        parseFloat(d[4])
                                                    ]);
                                                    series.setData(ohlc, true, false, false);
                                                });

                                            const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@kline_${interval}`);

                                            ws.onmessage = function (event) {
                                                const msg = JSON.parse(event.data);
                                                const k = msg.k;

                                                const point = [
                                                    k.t,
                                                    parseFloat(k.o),
                                                    parseFloat(k.h),
                                                    parseFloat(k.l),
                                                    parseFloat(k.c)
                                                ];

                                                const last = series.data[series.data.length - 1];
                                                if (last && last.x === point[0]) {
                                                    last.update({
                                                        open: point[1],
                                                        high: point[2],
                                                        low: point[3],
                                                        close: point[4]
                                                    }, true, false);
                                                } else {
                                                    series.addPoint(point, true, series.data.length > 100);
                                                }
                                            };
                                        }
                                    }
                                },
                                title: {
                                    text: chart_Title || 'Live BTC/USDT OHLC Chart',
                                    align: chart_Title_align || 'center'
                                },

                                xAxis: {
                                    type: 'datetime'
                                },
                                yAxis: {
                                    title: {
                                        text: 'Price'
                                    }
                                },
                                tooltip: {
                                    split: true,
                                    valueDecimals: 2
                                },
                                plotOptions: {
                                    ohlc: {
                                        color: customColors ? customColors[0] : '#d32f2f',
                                        upColor: customColors ? customColors[1] : '#388e3c'
                                    }
                                },
                                series: seriesData.series,
                                credits: {
                                    enabled: false
                                }
                            };
                        }


                        if (chartType === 'line-column') {
                            if (!seriesData.series) {
                                seriesData = {
                                    series: [{
                                        name: 'Precipitation',
                                        type: 'column',
                                        yAxis: 1,
                                        data: [45.7, 37.0, 28.9, 17.1, 39.2, 18.9, 90.2, 78.5, 74.6, 18.7, 17.1, 16.0],
                                        tooltip: {
                                            valueSuffix: ' mm'
                                        }
                                    }, {
                                        name: 'Temperature',
                                        type: 'spline',
                                        data: [-11.4, -9.5, -14.2, 0.2, 7.0, 12.1, 13.5, 13.6, 8.2, -2.8, -12.0, -15.5],
                                        tooltip: {
                                            valueSuffix: '°C'
                                        }
                                    }]
                                };
                            }

                            seriesData2 = {
                                chart: {
                                    zooming: { type: 'xy' },
                                    animation: false,
                                    inverted: swapAxis
                                },
                                title: {
                                    text: chart_Title || 'Karasjok weather, 2023',
                                    align: chart_Title_align || 'left'
                                },

                                xAxis: [{
                                    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                                    crosshair: true
                                }],
                                yAxis: [{
                                    labels: {
                                        format: '{value}°C'
                                    },
                                    title: {
                                        text: 'Temperature'
                                    },
                                    lineColor: Highcharts.getOptions().colors[1],
                                    lineWidth: 2
                                }, {
                                    title: {
                                        text: 'Precipitation'
                                    },
                                    labels: {
                                        format: '{value} mm'
                                    },
                                    lineColor: Highcharts.getOptions().colors[0],
                                    lineWidth: 2,
                                    opposite: true
                                }],
                                tooltip: {
                                    shared: true
                                },
                                legend: {
                                    align: chart_layout || 'left',
                                    [chartAlign || 'verticalAlign']: 'top'
                                },
                                series: seriesData.series,
                                responsive: {
                                    rules: [{
                                        condition: {
                                            maxWidth: 500
                                        },
                                        chartOptions: {
                                            legend: {
                                                layout: chart_layout || 'horizontal',
                                                align: 'center',
                                                verticalAlign: 'bottom'
                                            }
                                        }
                                    }]
                                },
                                credits: {
                                    enabled: false
                                }
                            };
                        }

                        if (chartType === 'donut-3d') {
                            if (!seriesData.series) {
                                seriesData = {
                                    series: [{
                                        name: 'Medals',
                                        data: [
                                            ['Norway', 16],
                                            ['Germany', 12],
                                            ['USA', 8],
                                            ['Sweden', 8],
                                            ['Netherlands', 8],
                                            ['ROC', 6],
                                            ['Austria', 7],
                                            ['Canada', 4],
                                            ['Japan', 3]
                                        ]
                                    }]
                                };
                            }

                            seriesData2 = {
                                chart: {
                                    type: 'pie',
                                    options3d: {
                                        enabled: true,
                                        alpha: 45
                                    },
                                    animation: false
                                },
                                title: {
                                    text: chart_Title || 'Beijing 2022 gold medals by country',
                                    align: chart_Title_align || 'center'
                                },

                                subtitle: {
                                    text: '3D donut in Highcharts'
                                },
                                plotOptions: {
                                    pie: {
                                        innerSize: 100,
                                        depth: 45,
                                        colors: customColors
                                    }
                                },
                                series: seriesData.series,
                                responsive: {
                                    rules: [{
                                        condition: {
                                            maxWidth: 500
                                        },
                                        chartOptions: {
                                            legend: {
                                                enabled: false
                                            }
                                        }
                                    }]
                                },
                                credits: {
                                    enabled: false
                                }
                            };
                        }

                        if (chartType === 'pie-3d') {
                            if (!seriesData.series) {
                                seriesData = {
                                    series: [{
                                        type: 'pie',
                                        name: 'Share',
                                        data: [
                                            ['Samsung', 23],
                                            ['Apple', 18],
                                            {
                                                name: 'Xiaomi',
                                                y: 12,
                                                sliced: true,
                                                selected: true
                                            },
                                            ['Oppo*', 9],
                                            ['Vivo', 8],
                                            ['Others', 30]
                                        ]
                                    }]
                                };
                            }

                            seriesData2 = {
                                chart: {
                                    type: 'pie',
                                    options3d: {
                                        enabled: true,
                                        alpha: 45,
                                        beta: 0
                                    },
                                    animation: false
                                },
                                title: {
                                    text: chart_Title || 'Global smartphone shipments market share, Q1 2022',
                                    align: chart_Title_align || 'center'
                                },

                                accessibility: {
                                    point: {
                                        valueSuffix: '%'
                                    }
                                },
                                tooltip: {
                                    pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
                                },
                                plotOptions: {
                                    pie: {
                                        allowPointSelect: true,
                                        cursor: 'pointer',
                                        depth: 35,
                                        colors: customColors,
                                        dataLabels: {
                                            enabled: true,
                                            format: '{point.name}'
                                        }
                                    }
                                },
                                series: seriesData.series,
                                responsive: {
                                    rules: [{
                                        condition: {
                                            maxWidth: 500
                                        },
                                        chartOptions: {
                                            legend: {
                                                enabled: false
                                            }
                                        }
                                    }]
                                },
                                credits: {
                                    enabled: false
                                }
                            };
                        }

                        if (chartType === 'column-3d') {
                            if (!seriesData.series) {
                                seriesData = {
                                    series: [{
                                        type: 'column',
                                        data: [
                                            ['Toyota', 1795],
                                            ['Volkswagen', 1242],
                                            ['Volvo', 1074],
                                            ['Tesla', 832],
                                            ['Hyundai', 593],
                                            ['MG', 509],
                                            ['Skoda', 471],
                                            ['BMW', 442],
                                            ['Ford', 385],
                                            ['Nissan', 371]
                                        ],
                                        colorByPoint: true
                                    }]
                                };
                            }

                            seriesData2 = {
                                chart: {
                                    type: 'column',
                                    options3d: {
                                        enabled: true,
                                        alpha: 15,
                                        beta: 15,
                                        depth: 50,
                                        viewDistance: 25
                                    },
                                    animation: false
                                },
                                title: {
                                    text: chart_Title || 'Sold passenger cars in Norway by brand, May 2024',
                                    align: chart_Title_align || 'center'
                                },

                                xAxis: {
                                    type: 'category'
                                },
                                yAxis: {
                                    title: {
                                        enabled: false
                                    }
                                },
                                tooltip: {
                                    headerFormat: '<b>{point.key}</b><br>',
                                    pointFormat: 'Cars sold: {point.y}'
                                },
                                legend: {
                                    enabled: false
                                },
                                plotOptions: {
                                    column: {
                                        depth: 25,
                                        colorByPoint: !customColors
                                    },
                                    colors: customColors,
                                },
                                series: seriesData.series,
                                responsive: {
                                    rules: [{
                                        condition: {
                                            maxWidth: 500
                                        },
                                        chartOptions: {
                                            xAxis: {
                                                labels: {
                                                    rotation: -45
                                                }
                                            }
                                        }
                                    }]
                                },
                                credits: {
                                    enabled: false
                                }
                            };
                        }

                        try {
                            if (window.Highcharts) {
                                const existingChart = window.Highcharts.charts.find(chart =>
                                    chart && chart.container && chart.container.id === ctx
                                );
                                if (existingChart) {
                                    existingChart.destroy();
                                }

                                const chart = window.Highcharts.chart(ctx, seriesData2);

                                element.chartInstance = chart;

                                setTimeout(() => {
                                    if (chart && chart.reflow) {
                                        chart.reflow();
                                    }
                                }, 100);
                            }
                        } catch (error) {
                            console.error('Error creating Highcharts chart:', error);
                            element.innerHTML = '<div style="padding: 20px; text-align: center; color: #666;">Chart could not be rendered</div>';
                        }
                    };

                    const loadHighcharts = () => {
                        return new Promise((resolve, reject) => {
                            if (window.Highcharts) {
                                resolve();
                                return;
                            }

                            const script = document.createElement("script");
                            script.src = "{[ custom_line_chartsrc ]}";
                            script.onload = () => {
                                const drilldownScript = document.createElement("script");
                                drilldownScript.src = "https://code.highcharts.com/11.4.8/modules/drilldown.js";
                                drilldownScript.onload = resolve;
                                drilldownScript.onerror = resolve;
                                document.head.appendChild(drilldownScript);
                            };
                            script.onerror = reject;
                            document.head.appendChild(script);
                        });
                    };

                    const init = async () => {
                        try {
                            await loadHighcharts();
                            if (document.readyState === 'loading') {
                                document.addEventListener('DOMContentLoaded', initializeChart);
                            } else {
                                setTimeout(initializeChart, 50);
                            }
                        } catch (error) {
                            console.error('Failed to load Highcharts:', error);
                        }
                    };

                    if (!this.highchartsInitialized) {
                        this.highchartsInitialized = true;
                        init();
                    }

                    this.on('removed', () => {
                        const element = document.getElementById(this.id);
                        if (element && element.chartInstance) {
                            element.chartInstance.destroy();
                            element.chartInstance = null;
                        }
                        this.highchartsInitialized = false;
                    });

                    if (typeof window !== 'undefined') {
                        window.addEventListener('beforeprint', () => {
                            setTimeout(initializeChart, 3000);
                        });

                        window.addEventListener('afterprint', () => {
                            setTimeout(initializeChart, 3000);
                        });
                    }
                },
            }),
            init() {
                this.on('change:SelectChart', () => {
                    const chartType = this.get('SelectChart');
                    const newTraits = getTraitsForChartType(chartType);
                    this.set('traits', [id_Trait, title_Trait, ...newTraits]);
                });

                const allPossibleTraits = [
                    name_Trait,
                    ...chartTitle_Trait,
                    ...Select_title_Align_Trait,
                    ...Select_chart_Trait,
                    ...json_file_index_Trait,
                    ...json_path_Trait,
                    ...json_button_sugesstionTrait,
                    ...chart_yAxis_Trait,
                    ...Select_chart_layout_Trait,
                    ...swap_axis_Trait,
                    ...legend_colors_Trait,
                ];

                const events = allPossibleTraits
                    .filter(i => ["strings"].indexOf(i.name) < 0)
                    .map(i => `change:${i.name}`)
                    .join(" ");

                this.on(events, () => {
                    this.highchartsInitialized = false;
                    this.trigger("change:script");
                });
            },
        },
    });



    function addCustomLineChartType(editor) {
        editor.Blocks.add("custom_line_chart", {
            label: "Chart",
            category: "Charts",
            attributes: { class: "fa fa-bar-chart" },
            content: { type: "custom_line_chart" },
        });
    }
    // Add event listener for the suggestion button after editor loads
    editor.on('component:selected', (component) => {
        if (component.get('type') === 'custom_line_chart') {
            setTimeout(() => {
                const suggestionBtn = document.querySelector('[data-trait-name="jsonButtonSugesstionTrait"] button');
                if (suggestionBtn) {
                    suggestionBtn.onclick = function (e) {
                        e.preventDefault();
                        e.stopPropagation();
                        openChartJsonSuggestionModal(component);
                    };
                }
            }, 100);
        }
    });

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

    function openChartJsonSuggestionModal(component) {
        // Get file index from component
        let fileIndex = component.get('jsonFileIndex') || '0';

        if (fileIndex === '0') {
            alert('Please select a JSON file first');
            return;
        }

        // Get the selected file's JSON data
        const fileNames = (localStorage.getItem('common_json_files') || "")
            .split(',').map(f => f.trim());
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
            filterChartSuggestions(this.value);
        });

        const suggestionItems = document.querySelectorAll('.suggestion');
        suggestionItems.forEach(item => {
            item.addEventListener('click', function () {
                const selectedValue = this.getAttribute('data-value');
                const dataType = this.getAttribute('data-type');

                if (dataType === 'language') {
                    // Show keys under selected language
                    showChartLanguageKeys(selectedValue, commonJson, component);
                }
            });
        });
    }

    function showChartLanguageKeys(language, commonJson, component) {
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
            openChartJsonSuggestionModal(component);
        });

        // Search functionality
        document.getElementById("searchInput").addEventListener("input", function () {
            filterChartSuggestions(this.value);
        });

        // Key selection
        const suggestionItems = document.querySelectorAll('.suggestion');
        suggestionItems.forEach(item => {
            item.addEventListener('click', function () {
                const selectedValue = this.getAttribute('data-value');

                // Set the json path in component
                component.set('jsonpath', selectedValue);

                // Trigger change to update chart
                component.set('jsonpath', selectedValue);
                component.trigger('change:jsonpath');

                editor.Modal.close();
            });
        });
    }

    function filterChartSuggestions(query) {
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

    addCustomLineChartType(editor);

    const styleManager = editor.StyleManager;
    let common_json_file_name_value = localStorage.getItem('common_json_file_name');
    let common_json_file_name_text = '';
    if (common_json_file_name_value !== null && typeof jsonData !== 'undefined' && jsonData.length !== 0) {
        common_json_file_name_text = 'Already Added File : ' + common_json_file_name_value;
    }

    editor.on('load', (block) => {
        var jsonF = document.getElementById("jsonFileUpload");
        jsonF.addEventListener("click", jsonFileUploads, true);
    })

    function jsonFileUploads() {
        let existingFileNames = localStorage.getItem('common_json_files');
        let displayFileNames = '';

        if (existingFileNames) {
            const namesArray = existingFileNames.split(',').map(n => n.trim());
            displayFileNames = 'Already Added File(s): <br><ul style="margin:5px 0; padding-left:18px;">';
            namesArray.forEach(name => {
                displayFileNames += `
                <li style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px;">
                    <span>${name}</span>
                    <button onclick="deleteJsonFile('${name}')" style="background: #ff4444; color: white; border: none; padding: 2px 6px; border-radius: 3px; cursor: pointer; font-size: 12px;">✕</button>
                </li>
            `;
            });
            displayFileNames += '</ul>';
        }

        editor.Modal.setTitle('Import Json File');
        editor.Modal.setContent(`
        <div class="new-table-form">
            <div style="padding-bottom:10px">${displayFileNames}</div>
            <div> 
                <input type="file" class="form-control popupinput2" 
                       accept="application/json,.xml,.json" multiple
                       style="width:95%"  
                       name="importJsonInputFile" id="importJsonInputFile">
            </div>  
            <input id="import-input-json-file" class="popupaddbtn" type="button" value="Add" data-component-id="c1006">
        </div>
    `);
        editor.Modal.open();
        document.getElementById("import-input-json-file").addEventListener("click", importInputJsonFile, true);
    }

    function importInputJsonFile() {
        const input = document.getElementById('importJsonInputFile');
        const files = input.files;

        if (files.length > 0) {
            let processedCount = 0;
            let newFileNames = [];

            // Load existing file list
            let existingFileNames = localStorage.getItem('common_json_files');
            let allFileNames = existingFileNames ? existingFileNames.split(',').map(f => f.trim()) : [];

            // Load xml2js library dynamically if not already loaded
            if (typeof window.X2JS === 'undefined') {
                const script = document.createElement('script');
                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/x2js/1.2.0/xml2json.min.js';
                script.onload = function () {
                    processFiles();
                };
                document.head.appendChild(script);
            } else {
                processFiles();
            }

            function normalizeXMLtoJSON(obj, parentKey = '') {
                // Handle null or undefined
                if (obj === null || obj === undefined) {
                    return obj;
                }

                // Handle arrays
                if (Array.isArray(obj)) {
                    return obj.map(item => normalizeXMLtoJSON(item, parentKey));
                }

                // Handle non-object types
                if (typeof obj !== 'object') {
                    return obj;
                }

                // Handle objects
                const normalized = {};

                for (let key in obj) {
                    if (!obj.hasOwnProperty(key)) continue;

                    const value = obj[key];

                    // Special case: if the object only has 'item' key, unwrap it
                    if (key === 'item' && Object.keys(obj).length === 1) {
                        return normalizeXMLtoJSON(value, key);
                    }

                    // Handle different value types
                    if (value && typeof value === 'object') {
                        // Check if this object wraps an array with 'item' property
                        if (value.item !== undefined) {
                            // Unwrap the item
                            if (Array.isArray(value.item)) {
                                normalized[key] = value.item.map(item => normalizeXMLtoJSON(item, key));
                            } else {
                                // Single item, make it an array
                                normalized[key] = [normalizeXMLtoJSON(value.item, key)];
                            }
                        }
                        // Check for special wrappers like 'level', 'row', 'header', 'cell'
                        else if (value.level !== undefined) {
                            if (Array.isArray(value.level)) {
                                normalized[key] = value.level.map(level => normalizeXMLtoJSON(level, 'level'));
                            } else {
                                normalized[key] = [normalizeXMLtoJSON(value.level, 'level')];
                            }
                        }
                        else if (value.row !== undefined) {
                            if (Array.isArray(value.row)) {
                                normalized[key] = value.row.map(row => normalizeXMLtoJSON(row, 'row'));
                            } else {
                                normalized[key] = [normalizeXMLtoJSON(value.row, 'row')];
                            }
                        }
                        else if (value.header !== undefined) {
                            if (Array.isArray(value.header)) {
                                normalized[key] = value.header.map(header => normalizeXMLtoJSON(header, 'header'));
                            } else {
                                normalized[key] = [normalizeXMLtoJSON(value.header, 'header')];
                            }
                        }
                        else if (value.cell !== undefined) {
                            if (Array.isArray(value.cell)) {
                                normalized[key] = value.cell.map(cell => normalizeXMLtoJSON(cell, 'cell'));
                            } else {
                                normalized[key] = [normalizeXMLtoJSON(value.cell, 'cell')];
                            }
                        }
                        // Recursively process nested objects
                        else if (Array.isArray(value)) {
                            normalized[key] = value.map(item => normalizeXMLtoJSON(item, key));
                        }
                        else {
                            normalized[key] = normalizeXMLtoJSON(value, key);
                        }
                    } else {
                        // Primitive value
                        normalized[key] = value;
                    }
                }

                return normalized;
            }

            function processFiles() {
                Array.from(files).forEach((file) => {
                    const reader = new FileReader();
                    const fileExtension = file.name.split('.').pop().toLowerCase();

                    reader.onload = function (e) {
                        try {
                            let code;

                            if (fileExtension === 'xml') {
                                // Convert XML to JSON
                                const x2js = new X2JS();
                                const xmlDoc = new DOMParser().parseFromString(e.target.result, 'text/xml');
                                const xmlJson = x2js.xml2json(xmlDoc);

                                // Log for debugging
                                console.log('Original XML to JSON:', JSON.stringify(xmlJson).substring(0, 500));

                                // Normalize the structure to match JSON format
                                code = normalizeXMLtoJSON(xmlJson);

                                // Log normalized result
                                console.log('Normalized JSON:', JSON.stringify(code).substring(0, 500));
                            } else {
                                // Parse JSON directly
                                code = JSON.parse(e.target.result);
                            }

                            // Save this file's JSON separately
                            localStorage.setItem(`common_json_${file.name}`, JSON.stringify(code));

                            // Track file name
                            if (!allFileNames.includes(file.name)) {
                                allFileNames.push(file.name);
                            }
                            newFileNames.push(file.name);
                        } catch (err) {
                            console.error('Error processing file:', file.name, err);
                            alert('Invalid file format in: ' + file.name);
                        }

                        processedCount++;
                        if (processedCount === files.length) {
                            // Save updated file list
                            localStorage.setItem('common_json_files', allFileNames.join(', '));

                            common_json_file_name_text = 'Already Added File(s): ' + allFileNames.join(', ');

                            // Update dropdown BEFORE closing modal
                            updateFileIndexOptionsImmediate();

                            // Close modal after a short delay to ensure DOM updates
                            setTimeout(() => {
                                alert('File(s) Imported');
                                editor.Modal.close();

                                if (typeof updateComponentsWithNewJson === 'function') {
                                    updateComponentsWithNewJson(editor);
                                }
                            }, 150);
                        }
                    };

                    reader.readAsText(file);
                });
            }
        } else {
            alert('No file selected');
        }
    }

    function updateFileIndexOptionsImmediate() {
        const newOptions = getJsonFileOptions();
        const jsonSector = styleManager.getSector('JSON');

        if (jsonSector) {
            const fileIndexProperty = jsonSector.getProperty('json-file-index');
            if (fileIndexProperty) {
                // Update the property options
                fileIndexProperty.set('options', newOptions);

                // Force immediate update of the select element in DOM
                const selectElement = document.querySelector('.i_designer-sm-property__json-file-index select');
                if (selectElement) {
                    // Store current selected value
                    const currentValue = selectElement.value;

                    // Clear existing options
                    selectElement.innerHTML = '';

                    // Add new options directly to DOM
                    newOptions.forEach(option => {
                        const optionElement = document.createElement('option');
                        optionElement.value = option.id;
                        optionElement.textContent = option.name;
                        selectElement.appendChild(optionElement);
                    });

                    // Restore selection if still valid
                    if (Array.from(selectElement.options).some(opt => opt.value === currentValue)) {
                        selectElement.value = currentValue;
                    }
                }
            }
        }
    }

    function getJsonFileOptions() {
        const storedFileNames = localStorage.getItem('common_json_files');
        const options = [{ id: '0', name: 'Select File' }];

        if (storedFileNames) {
            const fileNames = storedFileNames.split(',').map(f => f.trim());
            fileNames.forEach((fileName, index) => {
                options.push({ id: (index + 1).toString(), name: fileName });
            });
        }
        return options;
    }

    function updateFileIndexOptions() {
        const newOptions = getJsonFileOptions();
        const jsonSector = styleManager.getSector('JSON');

        if (jsonSector) {
            const fileIndexProperty = jsonSector.getProperty('json-file-index');
            if (fileIndexProperty) {
                // Update options
                fileIndexProperty.set('options', newOptions);

                // Force immediate update of the select element in DOM
                const selectElement = document.querySelector('.i_designer-sm-property__json-file-index select');
                if (selectElement) {
                    // Clear existing options
                    selectElement.innerHTML = '';

                    // Add new options directly to DOM
                    newOptions.forEach(option => {
                        const optionElement = document.createElement('option');
                        optionElement.value = option.id;
                        optionElement.textContent = option.name;
                        selectElement.appendChild(optionElement);
                    });
                }

                // Also trigger StyleManager re-render
                setTimeout(() => {
                    editor.StyleManager.render();
                    ensureJsonSuggestionButton();
                }, 100);
            }
        }
    }

    function ensureJsonSuggestionButton() {
        setTimeout(() => {
            const jsonSector = document.querySelector('.i_designer-sm-sector__JSON');
            if (jsonSector) {
                // Check if button already exists
                const existingButton = document.getElementById('json-suggestion-btn');
                if (!existingButton) {
                    const jsonPathInput = jsonSector.querySelector('.i_designer-fields');
                    if (jsonPathInput) {
                        const button = document.createElement('button');
                        button.innerHTML = 'Json Suggestion';
                        button.id = 'json-suggestion-btn';
                        button.style.marginLeft = '0px';
                        jsonPathInput.parentNode.appendChild(button);
                        button.addEventListener('click', function () {
                            openSuggestionJsonModal();
                        });
                    }
                }
            }
        }, 200);
    }

    function deleteJsonFile(fileName) {
        if (confirm(`Are you sure you want to delete "${fileName}"?`)) {
            // Remove the specific JSON file from localStorage
            localStorage.removeItem(`common_json_${fileName}`);

            // Update the file list
            let existingFileNames = localStorage.getItem('common_json_files');
            if (existingFileNames) {
                let fileArray = existingFileNames.split(',').map(f => f.trim());
                fileArray = fileArray.filter(name => name !== fileName);

                if (fileArray.length > 0) {
                    localStorage.setItem('common_json_files', fileArray.join(', '));
                    common_json_file_name_text = 'Already Added File(s): ' + fileArray.join(', ');
                } else {
                    localStorage.removeItem('common_json_files');
                    common_json_file_name_text = '';
                }
            }

            // Update StyleManager options
            updateFileIndexOptions();

            // Close and reopen modal to show updated list
            editor.Modal.close();
            setTimeout(() => {
                jsonFileUploads();
            }, 100);

            alert(`"${fileName}" has been deleted successfully!`);
        }
    }

    // Make deleteJsonFile globally accessible
    window.deleteJsonFile = deleteJsonFile;

    styleManager.addSector('JSON', {
        name: 'JSON',
        open: false,
        properties: [
            {
                name: 'File Index',
                property: 'json-file-index',
                type: 'select',
                options: getJsonFileOptions(),
                onChange: handleFileIndexChange,
            },
            {
                name: 'Json Path',
                property: 'my-input-json',
                type: 'text',
                onChange: handleJsonPathChange,
            },
        ]
    });

    function handleFileIndexChange(event) {
        // Clear the JSON path when file changes
        const selectedComponent = editor.getSelected();
        if (selectedComponent) {
            selectedComponent.set('my-input-json', '', { silent: true });
            // Force re-render of traits to show cleared path
            setTimeout(() => {
                editor.TraitManager.render();
            }, 50);
        }
    }

    function handleJsonPathChange(event) {
        if (event.value) {
            const selectedComponent = editor.getSelected();
            const componentType = selectedComponent?.get('type');

            if (componentType === 'text' || componentType === 'formatted-rich-text' || componentType === 'custom-heading') {
                const content = selectedComponent?.get('content');
                if (content !== undefined) {
                    try {
                        // Get file index from dropdown
                        let fileIndex = '0';
                        const fileIndexSelect = document.querySelector('.i_designer-sm-property__json-file-index select');
                        if (fileIndexSelect) {
                            fileIndex = fileIndexSelect.value || '0';
                        }

                        let commonJson;

                        if (fileIndex !== '0') {
                            const fileNames = (localStorage.getItem('common_json_files') || "").split(',').map(f => f.trim());
                            const selectedFile = fileNames[parseInt(fileIndex) - 1];
                            const jsonString = localStorage.getItem(`common_json_${selectedFile}`);
                            if (jsonString) {
                                commonJson = JSON.parse(jsonString);
                            }
                        } else {
                            commonJson = JSON.parse(localStorage.getItem("common_json"));
                        }

                        if (commonJson) {
                            const jsonPaths = event.value.split(',').map(path => path.trim());

                            // Check if content has curly braces for selective replacement
                            if (content.includes('{') && content.includes('}')) {
                                // Selective replacement mode
                                let updatedContent = content;

                                jsonPaths.forEach(jsonPath => {
                                    const pathParts = jsonPath.split('.');
                                    const selectedLanguage = pathParts[0];
                                    const remainingPath = pathParts.slice(1).join('.');

                                    try {
                                        const fullJsonPath = `commonJson.${selectedLanguage}.${remainingPath}`;
                                        const value = eval(fullJsonPath);

                                        if (value !== undefined && value !== null) {
                                            // Replace {remainingPath} with the actual value
                                            const placeholder = `{${remainingPath}}`;
                                            updatedContent = updatedContent.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
                                        }
                                    } catch (e) {
                                        console.warn(`Error evaluating path ${jsonPath}:`, e);
                                    }
                                });

                                if (componentType === 'formatted-rich-text') {
                                    selectedComponent.set('raw-content', updatedContent, { silent: true });
                                    selectedComponent.set('my-input-json', event.value, { silent: true });
                                    selectedComponent.updateContent();
                                } else {
                                    const componentView = selectedComponent.view;
                                    if (componentView) {
                                        componentView.el.innerHTML = updatedContent;
                                    }
                                }
                            } else {
                                // Complete replacement mode (existing behavior)
                                const jsonPath = jsonPaths[0]; // Use first path for complete replacement
                                const pathParts = jsonPath.split('.');
                                const selectedLanguage = pathParts[0];
                                const remainingPath = pathParts.slice(1).join('.');

                                const fullJsonPath = `commonJson.${selectedLanguage}.${remainingPath}`;
                                const value = eval(fullJsonPath);

                                if (value !== undefined && value !== null) {
                                    if (componentType === 'formatted-rich-text') {
                                        selectedComponent.set('raw-content', String(value), { silent: true });
                                        selectedComponent.set('my-input-json', event.value, { silent: true });
                                        selectedComponent.updateContent();
                                    } else {
                                        const componentView = selectedComponent.view;
                                        if (componentView) {
                                            componentView.el.innerHTML = value;
                                        }
                                    }
                                }
                            }

                            setTimeout(() => {
                                editor.TraitManager.render();
                            }, 100);
                        }
                    } catch (e) {
                        console.error("Error evaluating JSON path:", e);
                    }
                }
            }
        }
    }

    editor.on('load', function () {
        const jsonSector = document.querySelector('.i_designer-sm-sector__JSON');
        if (jsonSector) {
            const jsonPathInput = jsonSector.querySelector('.i_designer-fields');
            if (jsonPathInput) {
                const button = document.createElement('button');
                button.innerHTML = 'Json Suggestion';
                button.id = 'json-suggestion-btn';
                button.style.marginLeft = '0px';
                jsonPathInput.parentNode.appendChild(button);
                button.addEventListener('click', function () {
                    openSuggestionJsonModal();
                });
            }
        }
    });

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

    function openSuggestionJsonModal() {
        const selectedComponent = editor.getSelected();

        // Get file index from the StyleManager dropdown value directly
        let fileIndex = '0';
        const fileIndexSelect = document.querySelector('.i_designer-sm-property__json-file-index select');
        if (fileIndexSelect) {
            fileIndex = fileIndexSelect.value || '0';
        }

        // Also try to get from component attribute as fallback
        if (fileIndex === '0' && selectedComponent) {
            fileIndex = selectedComponent.get('json-file-index') || '0';
        }

        if (fileIndex === '0') {
            alert('Please select a JSON file first');
            return;
        }

        // Get the selected file's JSON data
        const fileNames = (localStorage.getItem('common_json_files') || "")
            .split(',').map(f => f.trim());
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
                    showLanguageKeys(selectedValue, commonJson);
                } else {
                    // Final selection - set the value
                    const inputField = document.querySelector('.i_designer-sm-property__my-input-json input');
                    if (inputField) {
                        inputField.value = selectedValue;
                        var event = new Event('change', {
                            bubbles: true,
                            cancelable: true
                        });
                        inputField.dispatchEvent(event);
                    }
                    editor.Modal.close();
                }
            });
        });
    }

    function showLanguageKeys(language, commonJson) {
        const metaDataKeys = extractMetaDataKeys(commonJson[language]);

        let modalContent = `
    <div class="new-table-form">
      <div style="padding-bottom:10px">
        <button id="backBtn" style="margin-right: 10px;">← Back</button>
        <input type="text" id="searchInput" placeholder="Search json">
      </div>
      <div style="padding-bottom:10px">
        <label>
          <input type="checkbox" id="multipleKeysCheckbox" style="margin-right: 5px;">
          Select multiple keys
        </label>
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
            openSuggestionJsonModal();
        });

        // Search functionality
        document.getElementById("searchInput").addEventListener("input", function () {
            filterSuggestions(this.value);
        });

        // Key selection with multiple selection support
        const suggestionItems = document.querySelectorAll('.suggestion');
        let selectedKeys = new Set();

        suggestionItems.forEach(item => {
            item.addEventListener('click', function () {
                const selectedValue = this.getAttribute('data-value');
                const multipleMode = document.getElementById('multipleKeysCheckbox').checked;

                if (multipleMode) {
                    // Toggle selection
                    if (selectedKeys.has(selectedValue)) {
                        selectedKeys.delete(selectedValue);
                        this.style.backgroundColor = '';
                        this.style.color = '';
                    } else {
                        selectedKeys.add(selectedValue);
                        this.style.backgroundColor = '#007bff';
                        this.style.color = 'white';
                    }
                } else {
                    // Single selection (original behavior)
                    const inputField = document.querySelector('.i_designer-sm-property__my-input-json input');
                    if (inputField) {
                        inputField.value = selectedValue;
                        var event = new Event('change', {
                            bubbles: true,
                            cancelable: true
                        });
                        inputField.dispatchEvent(event);
                    }
                    editor.Modal.close();
                }
            });
        });

        // Handle multiple selection checkbox
        document.getElementById('multipleKeysCheckbox').addEventListener('change', function () {
            const applyBtn = document.getElementById('applyMultipleKeys');
            if (this.checked && !applyBtn) {
                const btnContainer = document.createElement('div');
                btnContainer.style.paddingTop = '10px';
                btnContainer.innerHTML = '<button id="applyMultipleKeys" style="background: #007bff; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">Apply Selected Keys</button>';
                document.querySelector('.new-table-form').appendChild(btnContainer);

                document.getElementById('applyMultipleKeys').addEventListener('click', function () {
                    const inputField = document.querySelector('.i_designer-sm-property__my-input-json input');
                    if (inputField && selectedKeys.size > 0) {
                        inputField.value = Array.from(selectedKeys).join(', ');
                        var event = new Event('change', {
                            bubbles: true,
                            cancelable: true
                        });
                        inputField.dispatchEvent(event);
                    }
                    editor.Modal.close();
                });
            } else if (!this.checked && applyBtn) {
                applyBtn.parentElement.remove();
                selectedKeys.clear();
                // Reset all selections visually
                suggestionItems.forEach(item => {
                    item.style.backgroundColor = '';
                    item.style.color = '';
                });
            }
        });
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
    // Add event listener for component selection 
    editor.on('component:selected', (component) => {
        if (component.attributes.type === 'custom_line_chart') {
            setTimeout(() => {
                const jsonBtnWrapper = document.querySelector('.i_designer-trt-trait__wrp-json-suggestion-btn');
                if (jsonBtnWrapper) {
                    const jsonBtn = jsonBtnWrapper.querySelector('.i_designer-btn-prim');
                    if (jsonBtn) {
                        jsonBtn.id = 'json-suggestion-btn-custom-line-chart';
                        jsonBtn.addEventListener('click', function () {
                            openSuggestionJsonModalChartTable('chart');
                        });
                    } else {
                        console.error('Json Suggestion button not found within the wrapper element');
                    }
                } else {
                    console.error('Json Suggestion button wrapper not found within the selected component');
                }
            }, 1000);
        }
    });

    // open chart and table json popup model
    function openSuggestionJsonModalChartTable(type) {
        // Extract metadata keys from common_json
        const commonJson = JSON.parse(localStorage.getItem('common_json'));
        const customLanguage = custom_language;
        const metaDataKeys = extractMetaDataKeys(commonJson[customLanguage]);
        // Create the modal content with search functionality
        let modalContent = `
      <div class="new-table-form">
        <div style="padding-bottom:10px">
          <input type="text" id="searchInput" placeholder="Search json">
        </div>
        <div class="suggestion-results" style="height: 200px; overflow: hidden; overflow-y: scroll;">
    `;

        // Display all metadata keys initially
        metaDataKeys.forEach(key => {
            modalContent += `<div class="suggestion" data-value="${key}">${key}</div>`;
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
                if (type === 'chart') {
                    const inputField = document.querySelector('.i_designer-trt-trait__wrp-jsonpath input');
                    inputField.value = selectedValue;
                    // Create a new 'change' event
                    var event = new Event('change', {
                        bubbles: true, // Ensure the event bubbles up
                        cancelable: true // Ensure the event can be canceled
                    });
                    // Dispatch the 'change' event on the input field
                    inputField.dispatchEvent(event);
                }

                editor.Modal.close();
            });
        });
    }


    // function customTable2(editor) {
    //     const props_test_table = (i) => i;
    //     const id_Trait = {
    //         name: "id",
    //         label: "Id",
    //     };

    //     const title_Trait = {
    //         name: "title",
    //         label: "Title",
    //     };

    //     const test_chart_Props = {
    //         name: "Table",
    //         jsonpath: "",
    //         pageLength: 5,
    //         FileDownload: `["copy", "csv", "excel", "pdf", "print","msword"]`,
    //         filterColumn: "",
    //         filterValue: "",
    //     };

    //     const name_Trait = {
    //         changeProp: 1,
    //         type: "text",
    //         name: "name",
    //         label: "name",
    //         placeholder: "Chart Name",
    //     };

    //     const Footer_Trait = ["Footer"].map((name) => ({
    //         changeProp: 1,
    //         type: "select",
    //         options: [
    //             { value: true, label: 'Yes' },
    //             { value: false, label: 'No' },
    //         ],
    //         name,
    //     }));

    //     const File_Download_Trait = ["FileDownload"].map((name) => ({
    //         changeProp: 1,
    //         type: "text",
    //         label: "File Download",
    //         default: `["copy", "csv", "excel", "pdf", "print"]`,
    //         name,
    //     }));

    //     const Pagination_Trait = ["Pagination"].map((name) => ({
    //         changeProp: 1,
    //         type: "select",
    //         label: "Pagination",
    //         options: [
    //             { value: true, label: 'Yes' },
    //             { value: false, label: 'No' },
    //         ],
    //         name,
    //     }));

    //     const PageLength_Trait = ["pageLength"].map((name) => ({
    //         changeProp: 1,
    //         type: "number",
    //         label: "Page Length",
    //         name,
    //         default: 5,
    //         placeholder: "Enter page length"
    //     }));

    //     const Search_Trait = ["Search"].map((name) => ({
    //         changeProp: 1,
    //         type: "select",
    //         options: [
    //             { value: true, label: 'Yes' },
    //             { value: false, label: 'No' },
    //         ],
    //         name,
    //     }));

    //     const Caption_Trait = ["Caption"].map((name) => ({
    //         changeProp: 1,
    //         type: "select",
    //         options: [
    //             { value: true, label: 'Yes' },
    //             { value: false, label: 'No' },
    //         ],
    //         name,
    //     }));


    //     const CaptionAlign_Trait = ["CaptionAlign"].map((name) => ({
    //         changeProp: 1,
    //         type: "select",
    //         label: "Caption Align",
    //         options: [
    //             { value: 'left', label: 'Left' },
    //             { value: 'right', label: 'Right' },
    //             { value: 'center', label: 'Center' },
    //         ],
    //         name,
    //     }));

    //     const json_path_Trait = ["jsonpath"].map((name) => ({
    //         changeProp: 1,
    //         type: "text",
    //         label: "Json Path",
    //         placeholder: "Enter Json Path",
    //         name,
    //     }));

    //     const json_button_sugesstionTrait = ["jsonButtonSugesstionTrait"].map((name) => ({
    //         changeProp: 1,
    //         type: "button",
    //         label: "Json Suggestion",
    //         placeholder: "Json Suggestion",
    //         name,
    //         id: "json-suggestion-btn",
    //         text: "Suggestion",
    //         class: "json-suggestion-btn",
    //     }));

    //     const filter_column_trait = {
    //         changeProp: 1,
    //         type: "select",
    //         name: "filterColumn",
    //         label: "Filter Column",
    //         options: [{ value: "", label: "First enter JSON path" }],
    //     };

    //     const filter_value_trait = {
    //         changeProp: 1,
    //         type: "text",
    //         name: "filterValue",
    //         label: "Filter Value",
    //         placeholder: "Enter filter value or '=' for all data",
    //     };

    //     const all_Traits = [
    //         name_Trait,
    //         ...Footer_Trait,
    //         ...File_Download_Trait,
    //         ...Pagination_Trait,
    //         ...PageLength_Trait,
    //         ...Search_Trait,
    //         ...Caption_Trait,
    //         ...CaptionAlign_Trait,
    //         ...json_path_Trait,
    //         ...json_button_sugesstionTrait,
    //         filter_column_trait,
    //         filter_value_trait
    //     ];

    //     let jsonData = [];
    //     let common_json = JSON.parse(localStorage.getItem("common_json"));
    //     if (common_json !== null) {
    //         jsonData.length = 0;
    //         jsonData.push(common_json);
    //         jsonData = JSON.stringify(jsonData);
    //     }

    //     editor.Components.addType("custom_table", {
    //         model: {
    //             defaults: props_test_table({
    //                 ...test_chart_Props,
    //                 tagName: "div",
    //                 resizable: 1,
    //                 droppable: 0,
    //                 attributes: { 'data-i_designer-type': 'custom_table' },
    //                 custom_line_chartsrc: "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js",
    //                 stylable: 1,
    //                 traits: [id_Trait, title_Trait, ...all_Traits],
    //                 style: {
    //                     padding: "10px 0px",
    //                     minHeight: "50px",
    //                 },
    //                 script: function () {
    //                     if (this.tableInitialized) return;
    //                     this.tableInitialized = true;

    //                     const init1 = () => {
    //                         const ctx = this.id;
    //                         let uniqueID = Math.floor(100 + Math.random() * 900);
    //                         const divElement = document.getElementById(ctx);
    //                         let JsonPath1 = "{[ jsonpath ]}";
    //                         let filterColumn = "{[ filterColumn ]}";
    //                         let filterValue = "{[ filterValue ]}";

    //                         divElement.innerHTML = "";

    //                         if (!JsonPath1 || JsonPath1.trim() === "") {
    //                             return;
    //                         }

    //                         if (!filterValue || filterValue.trim() === "") {
    //                             return;
    //                         }

    //                         let custom_language = localStorage.getItem('language') || 'english';
    //                         const jsonDataN = JSON.parse(localStorage.getItem("common_json"));

    //                         if (!jsonDataN || !jsonDataN[custom_language] || !jsonDataN[custom_language][JsonPath1]) {
    //                             divElement.innerHTML = `<div style="padding: 20px; text-align: center; color: #721c24;">Error: Invalid JSON path or data not found</div>`;
    //                             return;
    //                         }

    //                         const str = jsonDataN[custom_language][JsonPath1];
    //                         const tableData = eval(str);

    //                         if (!tableData || !tableData.heading || !tableData.data) {
    //                             divElement.innerHTML = `<div style="padding: 20px; text-align: center; color: #721c24;">Error: Invalid table data structure</div>`;
    //                             return;
    //                         }

    //                         const objectKeys = Object.keys(tableData.heading);

    //                         let filteredData = tableData.data;
    //                         if (filterColumn && filterColumn !== "" && filterValue && filterValue !== "") {
    //                             if (filterValue === "=") {
    //                                 filteredData = tableData.data;
    //                             } else {
    //                                 filteredData = tableData.data.filter(row => {
    //                                     const cellValue = String(row[filterColumn] || "").toLowerCase();
    //                                     const searchValue = String(filterValue).toLowerCase();
    //                                     return cellValue.includes(searchValue);
    //                                 });
    //                             }
    //                         }

    //                         const table = document.createElement('table');
    //                         table.setAttribute('width', '100%');
    //                         table.style.borderCollapse = "collapse";
    //                         table.style.border = "1px solid #000";
    //                         table.setAttribute('id', 'table' + ctx);

    //                         const thead = document.createElement('thead');
    //                         const headerRow = document.createElement('tr');

    //                         objectKeys.forEach((key, i) => {
    //                             const th = document.createElement('th');
    //                             th.setAttribute("class", "col" + ctx + i);
    //                             th.style.padding = "8px";
    //                             th.style.textAlign = "left";
    //                             th.style.border = "1px solid #000";
    //                             th.style.fontWeight = "bold";

    //                             const labelDiv = document.createElement('div');
    //                             labelDiv.textContent = tableData.heading[key];

    //                             th.appendChild(labelDiv);
    //                             headerRow.appendChild(th);
    //                         });

    //                         thead.appendChild(headerRow);
    //                         table.appendChild(thead);

    //                         const tbody = document.createElement('tbody');
    //                         tbody.setAttribute("id", "tbody" + ctx);

    //                         if (filteredData.length === 0) {
    //                             const noDataRow = document.createElement('tr');
    //                             const noDataCell = document.createElement('td');
    //                             noDataCell.setAttribute('colspan', objectKeys.length);
    //                             noDataCell.textContent = 'No data found';
    //                             noDataCell.style.textAlign = 'center';
    //                             noDataCell.style.padding = '20px';
    //                             noDataCell.style.border = "1px solid #000";
    //                             noDataRow.appendChild(noDataCell);
    //                             tbody.appendChild(noDataRow);
    //                         } else {
    //                             filteredData.forEach((row, rowIndex) => {
    //                                 const tr = document.createElement('tr');

    //                                 objectKeys.forEach((key, j) => {
    //                                     const td = document.createElement('td');
    //                                     td.className = `col${uniqueID}`;
    //                                     td.setAttribute("class", "col" + ctx + j);
    //                                     td.style.padding = "8px";
    //                                     td.style.textAlign = "left";
    //                                     td.style.border = "1px solid #000";

    //                                     const rawVal = row[key];
    //                                     let displayVal = rawVal;

    //                                     const colLetter = String.fromCharCode(65 + j);
    //                                     const cellRef = colLetter + (rowIndex + 1);

    //                                     if (!window.globalFormulaParser) {
    //                                         window.globalFormulaParser = new formulaParser.Parser();
    //                                     }
    //                                     const parser = window.globalFormulaParser;

    //                                     if (!window.globalCellMap) {
    //                                         window.globalCellMap = {};
    //                                     }
    //                                     const cellMap = window.globalCellMap;

    //                                     parser.on('callCellValue', function (cellCoord, done) {
    //                                         const label = cellCoord.label;
    //                                         done(cellMap[label] || 0);
    //                                     });

    //                                     if (typeof rawVal === 'string' && rawVal.trim().startsWith('=')) {
    //                                         const res = parser.parse(rawVal.trim().substring(1));
    //                                         displayVal = res.error ? '#ERR' : res.result;
    //                                     }
    //                                     cellMap[cellRef] = isNaN(displayVal) ? 0 : displayVal;

    //                                     const displaySpan = document.createElement('span');
    //                                     displaySpan.className = 'cell-display';
    //                                     displaySpan.textContent = displayVal || '';
    //                                     displaySpan.style.display = 'block';

    //                                     const editInput = document.createElement('input');
    //                                     editInput.type = 'text';
    //                                     editInput.className = 'cell-input';
    //                                     editInput.value = rawVal || '';
    //                                     editInput.style.display = 'none';
    //                                     editInput.style.width = '100%';
    //                                     editInput.style.border = 'none';
    //                                     editInput.style.outline = 'none';
    //                                     editInput.style.background = 'transparent';
    //                                     editInput.style.font = 'inherit';

    //                                     td.appendChild(displaySpan);
    //                                     td.appendChild(editInput);

    //                                     td.setAttribute("data-formula", rawVal);
    //                                     td.setAttribute("data-cell-ref", cellRef);
    //                                     td.setAttribute("data-display-value", displayVal || '');

    //                                     td.addEventListener("click", function () {
    //                                         if (td.isEditing) return;

    //                                         td.isEditing = true;
    //                                         displaySpan.style.display = 'none';
    //                                         editInput.style.display = 'block';
    //                                         editInput.focus();
    //                                         editInput.select();

    //                                         const finishEdit = () => {
    //                                             const userInput = editInput.value.trim();
    //                                             let newVal = userInput;

    //                                             if (userInput.startsWith('=')) {
    //                                                 const result = parser.parse(userInput.substring(1));
    //                                                 newVal = result.error ? "#ERR" : result.result;
    //                                             }

    //                                             cellMap[cellRef] = isNaN(newVal) ? 0 : newVal;
    //                                             td.setAttribute("data-formula", userInput);
    //                                             td.setAttribute("data-display-value", newVal || '');
    //                                             displaySpan.textContent = newVal || '';

    //                                             editInput.style.display = 'none';
    //                                             displaySpan.style.display = 'block';
    //                                             td.isEditing = false;
    //                                         };

    //                                         editInput.addEventListener("blur", finishEdit);
    //                                         editInput.addEventListener("keypress", function (e) {
    //                                             if (e.key === 'Enter') {
    //                                                 finishEdit();
    //                                             }
    //                                         });
    //                                     });
    //                                     tr.appendChild(td);
    //                                 });
    //                                 tbody.appendChild(tr);
    //                             });
    //                         }

    //                         table.appendChild(tbody);
    //                         divElement.appendChild(table);

    //                         const printStyles = document.createElement('style');
    //                         printStyles.textContent = `
    //   @media print {
    //     #${ctx} table {
    //       width: 100% !important;
    //       border-collapse: collapse !important;
    //       page-break-inside: auto !important;
    //       font-size: 11px !important;
    //       margin: 0 !important;
    //     }

    //     #${ctx} table th,
    //     #${ctx} table td {
    //       padding: 6px 8px !important;
    //       border: 1px solid #000 !important;
    //       word-wrap: break-word !important;
    //       page-break-inside: avoid !important;
    //       vertical-align: top !important;
    //       position: relative !important;
    //     }

    //     #${ctx} table th {
    //       font-weight: bold !important;
    //       background-color: #e0e0e0 !important;
    //       -webkit-print-color-adjust: exact !important;
    //       print-color-adjust: exact !important;
    //     }

    //     #${ctx} table td {
    //       background-color: #fff !important;
    //       -webkit-print-color-adjust: exact !important;
    //       print-color-adjust: exact !important;
    //     }

    //     /* Hide input elements completely in print */
    //     #${ctx} .cell-input {
    //       display: none !important;
    //       visibility: hidden !important;
    //     }

    //     /* Ensure display spans are visible and contain the actual data */
    //     #${ctx} .cell-display {
    //       display: block !important;
    //       visibility: visible !important;
    //       width: 100% !important;
    //       color: #000 !important;
    //     }

    //     /* Fallback: Use data attributes if spans fail */
    //     #${ctx} td::after {
    //       content: attr(data-display-value) !important;
    //       display: block !important;
    //       position: absolute !important;
    //       top: 6px !important;
    //       left: 8px !important;
    //       right: 8px !important;
    //       bottom: 6px !important;
    //       background: white !important;
    //       color: #000 !important;
    //       z-index: 1000 !important;
    //     }

    //     /* Override the pseudo-element if display span exists and has content */
    //     #${ctx} td:has(.cell-display:not(:empty))::after {
    //       display: none !important;
    //     }

    //     @page {
    //       margin: 0.5in;
    //       size: landscape;
    //     }

    //     /* Ensure no other styles interfere */
    //     #${ctx} * {
    //       -webkit-print-color-adjust: exact !important;
    //       print-color-adjust: exact !important;
    //     }
    //   }
    // `;

    //                         if (!document.getElementById('table-print-styles-' + ctx)) {
    //                             printStyles.id = 'table-print-styles-' + ctx;
    //                             document.head.appendChild(printStyles);
    //                         }

    //                         const beforePrintHandler = () => {
    //                             const cells = divElement.querySelectorAll('td[data-display-value]');
    //                             cells.forEach(cell => {
    //                                 const displaySpan = cell.querySelector('.cell-display');
    //                                 const displayValue = cell.getAttribute('data-display-value');
    //                                 if (displaySpan && displayValue !== null) {
    //                                     displaySpan.textContent = displayValue;
    //                                     displaySpan.style.display = 'block';
    //                                 }
    //                                 const input = cell.querySelector('.cell-input');
    //                                 if (input) {
    //                                     input.style.display = 'none';
    //                                 }
    //                             });
    //                         };

    //                         window.addEventListener('beforeprint', beforePrintHandler);

    //                         divElement._printHandler = beforePrintHandler;
    //                     };

    //                     const loadScriptsAndInit = () => {
    //                         if (!window.jQuery) {
    //                             const jqueryScript = document.createElement("script");
    //                             jqueryScript.src = "{[ custom_line_chartsrc ]}";
    //                             jqueryScript.onload = () => loadFormulaParser();
    //                             document.head.appendChild(jqueryScript);
    //                         } else {
    //                             loadFormulaParser();
    //                         }
    //                     };

    //                     const loadFormulaParser = () => {
    //                         if (!window.formulaParserLoaded) {
    //                             const fScript = document.createElement("script");
    //                             fScript.src = "https://cdn.jsdelivr.net/npm/hot-formula-parser@3.0.0/dist/formula-parser.min.js";
    //                             fScript.onload = () => {
    //                                 window.formulaParserLoaded = true;
    //                                 init1();
    //                             };
    //                             document.head.appendChild(fScript);
    //                         } else {
    //                             init1();
    //                         }
    //                     };

    //                     loadScriptsAndInit();

    //                     this.on('removed', function () {
    //                         this.tableInitialized = false;
    //                         const printStyleEl = document.getElementById('table-print-styles-' + this.id);
    //                         if (printStyleEl) {
    //                             printStyleEl.remove();
    //                         }
    //                         const divElement = document.getElementById(this.id);
    //                         if (divElement && divElement._printHandler) {
    //                             window.removeEventListener('beforeprint', divElement._printHandler);
    //                         }
    //                     });
    //                 },
    //             }),
    //             init() {
    //                 this.on('change:jsonpath', () => {
    //                     this.updateFilterColumnOptions();
    //                     this.set('filterColumn', '');
    //                     this.set('filterValue', '');
    //                 });

    //                 this.on('change:filterValue', () => {
    //                     this.tableInitialized = false;
    //                     this.trigger("change:script");
    //                 });

    //                 this.on('change:filterColumn', () => {
    //                     if (this.get('filterValue') && this.get('filterValue').trim() !== '') {
    //                         this.tableInitialized = false;
    //                         this.trigger("change:script");
    //                     }
    //                 });

    //                 const otherTraits = all_Traits
    //                     .filter((i) => !["jsonpath", "filterColumn", "filterValue"].includes(i.name))
    //                     .map((i) => `change:${i.name}`)
    //                     .join(" ");

    //                 if (otherTraits) {
    //                     this.on(otherTraits, () => {
    //                         if (this.get('filterValue') && this.get('filterValue').trim() !== '') {
    //                             this.tableInitialized = false;
    //                             this.trigger("change:script");
    //                         }
    //                     });
    //                 }
    //             },

    //             updateFilterColumnOptions() {
    //                 try {
    //                     const jsonPath = this.get('jsonpath');
    //                     if (!jsonPath || jsonPath.trim() === "") {
    //                         const filterColumnTrait = this.getTrait('filterColumn');
    //                         if (filterColumnTrait) {
    //                             filterColumnTrait.set('options', [{ value: "", label: "First enter JSON path" }]);
    //                         }
    //                         return;
    //                     }

    //                     let custom_language = localStorage.getItem('language') || 'english';
    //                     const jsonDataN = JSON.parse(localStorage.getItem("common_json"));

    //                     if (!jsonDataN || !jsonDataN[custom_language] || !jsonDataN[custom_language][jsonPath]) {
    //                         const filterColumnTrait = this.getTrait('filterColumn');
    //                         if (filterColumnTrait) {
    //                             filterColumnTrait.set('options', [{ value: "", label: "Invalid JSON path" }]);
    //                         }
    //                         return;
    //                     }

    //                     const str = jsonDataN[custom_language][jsonPath];
    //                     const tableData = eval(str);

    //                     if (!tableData || !tableData.heading) {
    //                         const filterColumnTrait = this.getTrait('filterColumn');
    //                         if (filterColumnTrait) {
    //                             filterColumnTrait.set('options', [{ value: "", label: "Invalid data structure" }]);
    //                         }
    //                         return;
    //                     }

    //                     const objectKeys = Object.keys(tableData.heading);
    //                     const filterColumnTrait = this.getTrait('filterColumn');

    //                     if (filterColumnTrait) {
    //                         const options = [
    //                             { value: "", label: "Select Column to Filter" },
    //                             ...objectKeys.map(key => ({
    //                                 value: key,
    //                                 label: tableData.heading[key]
    //                             }))
    //                         ];

    //                         filterColumnTrait.set('options', options);
    //                     }
    //                 } catch (error) {
    //                     console.log('Error updating filter options:', error);
    //                     const filterColumnTrait = this.getTrait('filterColumn');
    //                     if (filterColumnTrait) {
    //                         filterColumnTrait.set('options', [{ value: "", label: "Error loading headers" }]);
    //                     }
    //                 }
    //             }
    //         },
    //     });

    //     editor.Blocks.add("custom_table", {
    //         label: "JSON Table",
    //         category: "Extra",
    //         attributes: {
    //             class: "fa fa-table",
    //         },
    //         content: {
    //             type: "custom_table",
    //         },
    //     });
    // }

    // customTable2(editor);
    // =================================
    setTimeout(() => {
        var language = document.getElementById("multiLanguage");
        language.addEventListener("click", languageChange, true);
    }, 2000);
    let custom_language = localStorage.getItem('language');
    if (custom_language === null) {
        custom_language = 'english';
    }
    let language_value = localStorage.getItem('language');
    let language_text = '';
    if (language_value !== null && language_value !== undefined) {
        language_text = 'Already Added Language: ' + language_value;
    }

    function languageChange() {
        editor.Modal.setTitle('Language');
        editor.Modal.setContent(`<div class="new-table-form">
    <div style="padding-bottom:10px">
    ${language_text}
    </div>
    <div> 
    <select class="form-control class="popupaddbtn"" style="width:95%"  name="singleLanguageName" id="singleLanguageName">
    <option value="english">English</option>
    <option value="hindi">Hindi</option>
    <option value="tamil">Tamil</option>
    </select> 
    </div>  
    <input id="saveLanguageChange" type="button" value="Add" class="popupaddbtn" data-component-id="c1006">
    </div>
    </div>
    `);
        editor.Modal.open();
        var el = document.getElementById("saveLanguageChange");
        el.addEventListener("click", ChangeLanguage, true);
    }

    function ChangeLanguage() {
        languageNames = document.getElementById('singleLanguageName').value;
        if (languageNames === null || languageNames === undefined || languageNames === '') {
            alert('Language required');
            return false;
        }
        localStorage.setItem('language', languageNames);
        custom_language = languageNames;
        var css = editor.getCss();
        var regex = /#(\w+)\s*{[^}]*my-input-json:(.*?);[^}]*}/g;
        var pairs = [];
        var match;
        while ((match = regex.exec(css)) !== null) {
            var id = match[1];
            var value = match[2];
            pairs.push({ id: id, value: value });
        }
        setTimeout(function () {
            var html = editor.getHtml();
            var parser = new DOMParser();
            var doc = parser.parseFromString(html, 'text/html');
            for (var i = 0; i < pairs.length; i++) {
                let str = 'jsonData[0].' + custom_language + '.' + pairs[i].value;
                value = eval(str);
                var ccid = pairs[i].id;
                var myDiv = doc.getElementById(ccid);
                myDiv.textContent = value;
            }
            var updatedHtml = doc.documentElement.outerHTML;
            var styleEl = doc.createElement('style');
            styleEl.innerHTML = css;
            doc.head.appendChild(styleEl);
            editor.setComponents(updatedHtml);
            editor.setStyle(css);
        }, 500);
        editor.Modal.close();
    }

    function updateComponentsWithNewJson(editor) {
        var jsonData2 = JSON.parse(jsonData);
        var styleTags2 = editor.getCss();
        var jsonDataNew = {};
        var styleContent = styleTags2;
        var regex = /#(\w+)\s*{\s*[^{}]*my-input-json:\s*([^;]+)\s*;[^{}]*}/g;
        var matches;
        while ((matches = regex.exec(styleContent)) !== null) {
            var divId = matches[1];
            var jsonKey = matches[2];
            var lang = jsonKey;
            jsonDataNew[divId] = lang;
        }
        let updateDivContenthtml = editor.getHtml();
        if (custom_language === null) {
            custom_language = 'english';
        }
        for (var divId in jsonDataNew) {
            var jsonKey2 = jsonDataNew[divId];
            const str = 'jsonData2[0].' + custom_language + '.' + jsonKey2;
            var value = eval(str);
            if (divId && value) {
                var parser = new DOMParser();
                var doc = parser.parseFromString(updateDivContenthtml, 'text/html');
                var myDiv = doc.getElementById(divId);
                if (myDiv) {
                    myDiv.textContent = value;
                    var component = editor.getWrapper().find(`#${divId}`)[0];
                    if (component) {
                        component.components(value);
                    }
                }
            }
        }

        const jsonData1 = JSON.parse(localStorage.getItem("common_json"));
        if (jsonData1 !== null) {
            jsonData.length = 0;
            jsonData = [];
            jsonData.push(jsonData1);
        }

        editor.getWrapper().find('[data-i_designer-type="custom_line_chart"]').forEach(chart => {
            chart.highchartsInitialized = false;
            chart.trigger('change:script');
        });

    }
}