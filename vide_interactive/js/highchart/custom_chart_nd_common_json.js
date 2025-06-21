function customChartCommonJson(editor) {
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
          { value: 'stacked-column', label: 'Stacked Column chart' },
          { value: 'stacked-bar', label: 'Stacked Bar chart' },
          { value: 'drilldown_pie', label: 'Drilldown Pie chart' },
          { value: 'drilldown_line', label: 'Drilldown Line chart' },
          { value: 'drilldown_bar', label: 'Drilldown Bar chart' },
      ],
      default: 'pie',
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
      id: "json-suggestion-btn",
      text: "Suggestion",
      class: "json-suggestion-btn",
  }));

  const all_Traits = [
      name_Trait,
      ...chartTitle_Trait,
      ...Select_title_Align_Trait,
      ...Select_chart_Trait,
      ...json_path_Trait,
      ...json_button_sugesstionTrait,
      ...chart_yAxis_Trait,
      ...Select_chart_layout_Trait,
  ];

  let jsonData = [];
  let common_json = JSON.parse(localStorage.getItem("common_json")); 
  if (common_json !== null) {
      jsonData.length = 0;
      jsonData.push(common_json);
      jsonData = JSON.stringify(jsonData);
  }

//   editor.Components.addType("custom_line_chart", {
//     model: {
//       defaults: props_test_chart({
//         ...test_chart_Props,
//         tagName: "figure",
//         resizable: 1,
//         custom_line_chartsrc: "https://code.highcharts.com/highcharts.js",
//         droppable: 0,
//         stylable: 1,
//         attributes: { 'data-i_designer-type': 'custom_line_chart' },
//         traits: [id_Trait, title_Trait, ...all_Traits],
//         style: {
//           padding: "2px",
//         },
//         script: function () { 
//           if (this.highchartsInitialized) return;
//           this.highchartsInitialized = true; 
//           const init1 = () => {
//             const ctx = this.id; 
//             let chart_Title = "{[ chartTitle ]}";
//             let chart_Title_align = "{[ SelectTitleAlign ]}";
//             let JsonPath1 = "{[ jsonpath ]}"; 
//             let chartType = "{[ SelectChart ]}";
//             var language = localStorage.getItem('language');
//             if (language === undefined || language === null || language === '') {
//                 language = 'english';
//             } 
//             let project_type = 'developmentJsonType';
//             let str = JSON.parse(localStorage.getItem('common_json'))[language][JsonPath1];
//             if (typeof project_type2 !== 'undefined' && project_type2 === 'downloadedJsonType') {
//                 project_type = 'downloadedJsonType';
//             }
//             if (project_type === 'downloadedJsonType') {
//                 str = jsonData1[0][language][JsonPath1];
//             }
//             let chart_yAxis = "{[ ChartyAxis ]}";
//             let chart_layout = "{[ SelectChartLayout ]}";
//             let seriesData = [];
//             let seriesData2 = [];
//             let chartAlign = '';
//             try {
//                 seriesData = eval(str);
//                 if (seriesData.series === undefined) {
//                     alert("Series array not found");
//                     return false;
//                 }
//             } catch (e) {
//                 seriesData = [];
//                 if (JsonPath1 !== '' && JsonPath1 !== null && JsonPath1 !== undefined && JsonPath1 !== ' ') {
//                     alert("JSON path not found");
//                 }
//             }
//             if (chartType == '') {
//                 chartType = 'pie';
//             };
//             if (chart_layout == '') {
//                 chart_layout = 'horizontal';
//             }
//             chartAlign = chart_layout + 'Align';
//             if (chartType == 'pie') {
//                 if (JsonPath1 === '') {
//                     seriesData = {
//                         "series": [{
//                             data: [{
//                                 name: "Chrome",
//                                 y: 70.67
//                             },
//                             {
//                                 name: "Edge",
//                                 y: 14.77
//                             },
//                             {
//                                 name: "Firefox",
//                                 y: 4.86
//                             }]
//                         }]
//                     }
//                 }
//                 seriesData2 = {
//                     chart: {
//                         plotBackgroundColor: null,
//                         plotBorderWidth: null,
//                         plotShadow: false,
//                         type: chartType,
//                     },
//                     title: {
//                         text: chart_Title,
//                         align: chart_Title_align
//                     },
//                     series: seriesData.series,
//                     "tooltip": {
//                         pointFormat: "{series.name}: <b>{point.percentage:.1f}%</b>"
//                     },
//                     accessibility: {
//                         point: {
//                             "valueSuffix": "%"
//                         }
//                     },
//                     credits: {
//                         enabled: false
//                     },
//                     plotOptions: {
//                         pie: {
//                             "allowPointSelect": true,
//                             "cursor": "pointer",
//                             "dataLabels": {
//                                 "enabled": false
//                             },
//                             "colors": null,
//                             "showInLegend": true
//                         }
//                     },
//                 }
//             }
//             if (chartType == 'bar') {
//                 if (JsonPath1 === '') {
//                     seriesData = {
//                         "xAxis": {
//                             "categories": ["Africa", "America", "Asia", "Europe", "Oceania"]
//                         },
//                         "series": [{
//                             "name": "Year 1990",
//                             "data": [631, 727, 3202, 721, 26]
//                         }, {
//                             "name": "Year 2000",
//                             "data": [814, 841, 3714, 726, 31]
//                         }, {
//                             "name": "Year 2010",
//                             "data": [1044, 944, 4170, 735, 40]
//                         }, {
//                             "name": "Year 2018",
//                             "data": [1276, 1007, 4561, 746, 42]
//                         }]
//                     }
//                 }
//                 seriesData2 = {
//                     chart: {
//                         "plotBackgroundColor": null,
//                         "plotBorderWidth": null,
//                         "plotShadow": false,
//                         "type": "bar"
//                     },
//                     "title": {
//                         text: chart_Title,
//                         align: chart_Title_align
//                     },

//                     "xAxis": {
//                         "categories": seriesData.xAxis.categories,
//                         "title": {
//                             "text": null
//                         }
//                     },
//                     "tooltip": {
//                         "valueSuffix": "millions"
//                     },
//                     "plotOptions": {
//                         "bar": {
//                             "dataLabels": {
//                                 "enabled": true
//                             }
//                         }
//                     },
//                     "legend": {
//                         "layout": chart_layout,
//                         "align": "right",
//                         chartAlign: "top",
//                         "x": -40,
//                         "y": 80,
//                         "floating": true,
//                         "borderWidth": 1,
//                         "backgroundColor": "#FFFFFF",
//                         "shadow": true
//                     },
//                     "credits": {
//                         "enabled": false
//                     },
//                     series: seriesData.series,
//                 }
//             }
//             if (chartType == 'line') {
//                 if (JsonPath1 === '') {
//                     seriesData = {
//                         "series": [
//                             {
//                                 "name": "Installation & Developers",
//                                 "data": [43934, 48656, 65165, 81827, 112143, 142383,
//                                     171533, 165174, 155157, 161454, 154610]
//                             }, {
//                                 "name": "Manufacturing",
//                                 "data": [24916, 37941, 29742, 29851, 32490, 30282,
//                                     38121, 36885, 33726, 34243, 31050]
//                             }]
//                     }
//                 }
//                 seriesData2 = {
//                     "chart": {
//                         "plotBackgroundColor": null,
//                         "plotBorderWidth": null,
//                         "plotShadow": false,
//                         "type": "line"
//                     },
//                     "title": {
//                         text: chart_Title,
//                         align: chart_Title_align
//                     },
//                     "yAxis": {
//                         "title": {
//                             "text": chart_yAxis
//                         }
//                     },

//                     "series": seriesData.series,

//                     "xAxis": {
//                         "accessibility": {
//                             "rangeDescription": ""
//                         }
//                     },

//                     "legend": {
//                         "layout": chart_layout,
//                         "align": "right",
//                         chartAlign: "middle"
//                     },

//                     "plotOptions": {
//                         "series": {
//                             "label": {
//                                 "connectorAllowed": false
//                             },
//                             "pointStart": 2010
//                         }
//                     },

//                     "responsive": {
//                         "rules": [{
//                             "condition": {
//                                 "maxWidth": 500
//                             },
//                             "chartOptions": {
//                                 "legend": {
//                                     "layout": chart_layout,
//                                     "align": "center",
//                                     chartAlign: "bottom"
//                                 }
//                             }
//                         }]
//                     },
//                     "colors": null,
//                     "credits": { "enabled": false }
//                 }
//             }
//             if (chartType == 'column') {
//                 if (JsonPath1 === '') {
//                     seriesData = {
//                         "xAxis": {
//                             "categories": ["Africa", "America", "Asia"],
//                         },
//                         "series": [{
//                             "name": "Year 1990",
//                             "data": [631, 727, 3202]
//                         }, {
//                             "name": "Year 2000",
//                             "data": [814, 841, 3714]
//                         }, {
//                             "name": "Year 2010",
//                             "data": [1044, 944, 4170]
//                         }]
//                     }
//                 }
//                 seriesData2 = {
//                     "chart": {
//                         "plotBackgroundColor": null,
//                         "plotBorderWidth": null,
//                         "plotShadow": false,
//                         "type": "column"
//                     },
//                     "title": {
//                         text: chart_Title,
//                         align: chart_Title_align
//                     },

//                     "xAxis": {
//                         "categories": seriesData.xAxis.categories,
//                         "title": {
//                             "text": null
//                         }
//                     },
//                     "yAxis": {
//                         "min": 0,
//                         "title": {
//                             "text": chart_yAxis
//                         },
//                         "labels": {
//                             "overflow": "justify"
//                         }
//                     },
//                     "tooltip": {
//                         "valueSuffix": "millions"
//                     },
//                     "plotOptions": {
//                         "bar": {
//                             "dataLabels": {
//                                 "enabled": true
//                             }
//                         }
//                     },
//                     "legend": {
//                         "layout": chart_layout,
//                         "align": "right",
//                         chartAlign: "top",
//                         "x": -40,
//                         "y": 80,
//                         "floating": true,
//                         "borderWidth": 1,
//                         "backgroundColor": "#FFFFFF",
//                         "shadow": true
//                     },
//                     "credits": {
//                         "enabled": false
//                     },
//                     "series": seriesData.series
//                 }
//             }
//             if (chartType == 'stacked-column') {
//                 if (JsonPath1 === '') {
//                     seriesData = {
//                         "xAxis": {
//                             categories: ['Arsenal', 'Chelsea'],
//                         },
//                         "series": [{
//                             name: 'BPL',
//                             data: [3, 55]
//                         }, {
//                             name: 'FA Cup',
//                             data: [14, 8]
//                         }, {
//                             name: 'CL',
//                             data: [0, 2]
//                         }]
//                     }
//                 }
//                 seriesData2 = {
//                     chart: {
//                         type: 'column'
//                     },
//                     title: {
//                         text: chart_Title,
//                         align: chart_Title_align
//                     },
//                     xAxis: {
//                         categories: seriesData.xAxis.categories,
//                     },
//                     yAxis: {
//                         min: 0,
//                         title: {
//                             text: chart_yAxis
//                         },
//                         stackLabels: {
//                             enabled: true,
//                             style: {
//                                 fontWeight: 'bold',
//                                 color: (
//                                     Highcharts.defaultOptions.title.style &&
//                                     Highcharts.defaultOptions.title.style.color
//                                 ) || 'gray',
//                                 textOutline: 'none'
//                             }
//                         }
//                     },
//                     legend: {
//                         "layout": chart_layout,
//                         align: 'left',
//                         x: 70,
//                         verticalAlign: 'top',
//                         y: 70,
//                         floating: true,
//                         backgroundColor:
//                             Highcharts.defaultOptions.legend.backgroundColor || 'white',
//                         borderColor: '#CCC',
//                         borderWidth: 1,
//                         shadow: false
//                     },
//                     tooltip: {
//                         headerFormat: '<b>{point.x}</b><br/>',
//                         pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}'
//                     },
//                     plotOptions: {
//                         column: {
//                             stacking: 'normal',
//                             dataLabels: {
//                                 enabled: true
//                             }
//                         }
//                     },
//                     "series": seriesData.series
//                 }
//             }
//             if (chartType == 'stacked-bar') {
//                 if (JsonPath1 === '') {
//                     seriesData = {
//                         "xAxis": {
//                             categories: ['2020/21', '2019/20', '2018/19'],
//                         },
//                         "series": [{
//                             name: 'Cristiano Ronaldo',
//                             data: [4, 4, 6]
//                         }, {
//                             name: 'Lionel Messi',
//                             data: [5, 3, 12]
//                         }, {
//                             name: 'Robert Lewandowski',
//                             data: [5, 15, 8]
//                         }]
//                     }
//                 }
//                 seriesData2 = {
//                     chart: {
//                         type: 'bar'
//                     },
//                     title: {
//                         text: chart_Title,
//                         align: chart_Title_align
//                     },
//                     xAxis: {
//                         categories: seriesData.xAxis.categories,
//                     },
//                     yAxis: {
//                         min: 0,
//                         title: {
//                             text: 'Goals'
//                         }
//                     },
//                     legend: {
//                         reversed: true
//                     },
//                     plotOptions: {
//                         series: {
//                             stacking: 'normal',
//                             dataLabels: {
//                                 enabled: true
//                             }
//                         }
//                     },
//                     "series": seriesData.series
//                 }
//             }
//             if (chartType == 'drilldown_bar') {
//                 if (JsonPath1 == '') {
//                     seriesData = {
//                         "series": [
//                             {
//                                 "name": "Browsers",
//                                 "colorByPoint": true,
//                                 "data": [
//                                     {
//                                         "name": "Chrome",
//                                         "y": 61.04,
//                                         "drilldown": "Chrome"
//                                     },
//                                     {
//                                         "name": "Safari",
//                                         "y": 9.47,
//                                         "drilldown": "Safari"
//                                     },
//                                     {
//                                         "name": "Other",
//                                         "y": 11.02,
//                                         "drilldown": null
//                                     }
//                                 ]
//                             }
//                         ],
//                         "drilldown": {
//                             "series": [
//                                 {
//                                     "name": "Chrome",
//                                     "id": "Chrome",
//                                     "data": [
//                                         [
//                                             "v97.0",
//                                             36.89
//                                         ],
//                                         [
//                                             "v96.0",
//                                             18.16
//                                         ],
//                                         [
//                                             "v95.0",
//                                             0.54
//                                         ]
//                                     ]
//                                 },
//                                 {
//                                     "name": "Safari",
//                                     "id": "Safari",
//                                     "data": [
//                                         [
//                                             "v15.3",
//                                             0.1
//                                         ],
//                                         [
//                                             "v15.2",
//                                             2.01
//                                         ],
//                                         [
//                                             "v15.1",
//                                             2.29
//                                         ]
//                                     ]
//                                 }
//                             ]
//                         }
//                     }
//                 }
//                 seriesData2 = {
//                     "chart": {
//                         "plotBackgroundColor": null,
//                         "plotBorderWidth": null,
//                         "plotShadow": false,
//                         "type": "bar"
//                     },
//                     "title": {
//                         text: chart_Title,
//                         align: chart_Title_align
//                     },
//                     "xAxis": {
//                         "type": "category"
//                     },
//                     "yAxis": {
//                         "title": {
//                             "text": chart_yAxis
//                         }
//                     },
//                     "tooltip": {
//                         "valueSuffix": ""
//                     },
//                     "plotOptions": {
//                         "series": {
//                             "borderWidth": 0,
//                             "dataLabels": {
//                                 "enabled": true,
//                                 "format": "{point.y:.1f}%"
//                             }
//                         }
//                     },
//                     "legend": {
//                         "enabled": false
//                     },
//                     "credits": {
//                         "enabled": false
//                     },
//                     "series": seriesData.series,
//                     "drilldown": seriesData.drilldown
//                 }
//             }
//             if (chartType == 'drilldown_pie') {
//                 if (JsonPath1 == '') {
//                     seriesData = {
//                         "series": [
//                             {
//                                 "name": "Browsers",
//                                 "colorByPoint": true,
//                                 "data": [
//                                     {
//                                         "name": "Chrome",
//                                         "y": 61.04,
//                                         "drilldown": "Chrome"
//                                     },
//                                     {
//                                         "name": "Safari",
//                                         "y": 9.47,
//                                         "drilldown": "Safari"
//                                     }
//                                 ]
//                             }
//                         ],
//                         "drilldown": {
//                             "series": [
//                                 {
//                                     "name": "Chrome",
//                                     "id": "Chrome",
//                                     "data": [
//                                         [
//                                             "v97.0",
//                                             36.89
//                                         ],
//                                         [
//                                             "v96.0",
//                                             18.16
//                                         ],
//                                         [
//                                             "v95.0",
//                                             0.54
//                                         ],
//                                         [
//                                             "v49.0",
//                                             0.17
//                                         ]
//                                     ]
//                                 },
//                                 {
//                                     "name": "Safari",
//                                     "id": "Safari",
//                                     "data": [
//                                         [
//                                             "v15.3",
//                                             0.1
//                                         ],
//                                         [
//                                             "v15.2",
//                                             2.01
//                                         ]
//                                     ]
//                                 },
//                             ]
//                         }
//                     }
//                 }
//                 seriesData2 = {
//                     "chart": {
//                         "plotBackgroundColor": null,
//                         "plotBorderWidth": null,
//                         "plotShadow": false,
//                         "type": "pie"
//                     },
//                     "title": {
//                         text: chart_Title,
//                         align: chart_Title_align
//                     },

//                     "tooltip": {
//                         "pointFormat": "{series.name}: <b>{point.percentage:.1f}%</b>"
//                     },
//                     "accessibility": {
//                         "point": {
//                             "valueSuffix": "%"
//                         }
//                     },
//                     "credits": {
//                         "enabled": false
//                     },
//                     "plotOptions": {
//                         "pie": {
//                             "allowPointSelect": true,
//                             "cursor": "pointer",
//                             "dataLabels": {
//                                 "enabled": false
//                             },
//                             "colors": null,
//                             "showInLegend": true
//                         }
//                     },
//                     "series": seriesData.series,
//                     "drilldown": seriesData.drilldown
//                 }
//             }
//             if (chartType == 'drilldown_line') {
//                 if (JsonPath1 == '') {
//                     seriesData = {
//                         "series": [
//                             {
//                                 "name": "Things",
//                                 "colorByPoint": true,
//                                 "data": [{
//                                     "name": "Animals",
//                                     "y": 5,
//                                     "drilldown": "animals"
//                                 }, {
//                                     "name": "Fruits",
//                                     "y": 2,
//                                     "drilldown": "fruits"
//                                 }, {
//                                     "name": "Cars",
//                                     "y": 4,
//                                     "drilldown": "cars"
//                                 }]
//                             },
//                             {
//                                 "name": "vehicles",
//                                 "colorByPoint": true,
//                                 "data": [{
//                                     "name": "Vehicle 1",
//                                     "y": 25,
//                                     "drilldown": "vehicle1"
//                                 }, {
//                                     "name": "Vehicle 2",
//                                     "y": 25,
//                                     "drilldown": "vehicle2"
//                                 }, {
//                                     "name": "Vehicle 3",
//                                     "y": 45,
//                                     "drilldown": "vehicle3"
//                                 }]
//                             }
//                         ],
//                         "drilldown": {
//                             "series": [
//                                 {
//                                     "id": "animals",
//                                     "data": [
//                                         ["Cats", 4],
//                                         ["Dogs", 2],
//                                         ["Cows", 1],
//                                         ["Sheep", 2],
//                                         ["Pigs", 1]
//                                     ]
//                                 }, {
//                                     "id": "fruits",
//                                     "data": [
//                                         ["Apples", 4],
//                                         ["Oranges", 2]
//                                     ]
//                                 }, {
//                                     "id": "cars",
//                                     "data": [
//                                         ["Toyota", 4],
//                                         ["Opel", 2],
//                                         ["Volkswagen", 2]
//                                     ]
//                                 }, {
//                                     "id": "vehicle1",
//                                     "data": [
//                                         ["Toyota", 4],
//                                         ["Opel", 2],
//                                         ["Volkswagen", 2]
//                                     ]
//                                 }, {
//                                     "id": "vehicle2",
//                                     "data": [
//                                         ["Toyota", 12],
//                                         ["Opel", 12],
//                                         ["Volkswagen", 2]
//                                     ]
//                                 }, {
//                                     "id": "vehicle3",
//                                     "data": [
//                                         ["Toyota", 5],
//                                         ["Opel", 4],
//                                         ["Volkswagen", 1]
//                                     ]
//                                 }
//                             ]
//                         }
//                     }
//                 }
//                 seriesData2 = {
//                     "chart": {
//                         "plotBackgroundColor": null,
//                         "plotBorderWidth": null,
//                         "plotShadow": false,
//                         "type": "line"
//                     },
//                     "title": {
//                         text: chart_Title,
//                         align: chart_Title_align
//                     },
//                     "yAxis": {
//                         "title": {
//                             "text": chart_yAxis
//                         }
//                     },
//                     "series": seriesData.series,
//                     "drilldown": seriesData.drilldown,

//                     "xAxis": {
//                         "accessibility": {
//                             "rangeDescription": ""
//                         }
//                     },
//                     "legend": {
//                         "layout": chart_layout,
//                         "align": "right",
//                         chartAlign: "middle"
//                     },

//                     "plotOptions": {
//                         "series": {
//                             "label": {
//                                 "connectorAllowed": false
//                             },
//                             "pointStart": 2010
//                         }
//                     },
//                     "responsive": {
//                         "rules": [{
//                             "condition": {
//                                 "maxWidth": 500
//                             },
//                             "chartOptions": {
//                                 "legend": {
//                                     "layout": chart_layout,
//                                     "align": "center",
//                                     "verticalAlign": "bottom"
//                                 }
//                             }
//                         }]
//                     },
//                     "credits": { "enabled": false },
//                 }
//             }
//             Highcharts.chart(ctx, seriesData2);
//           }; 
  
//           if (!window.Highcharts) {
//             const scr = document.createElement("script");
//             scr.src = "{[ custom_line_chartsrc ]}";
//             scr.onload = init1;
//             document.head.appendChild(scr);
//           } else {
//             init1();
//           }
//           this.on('removed', function() {
//             console.log('Remove call hua');
//             this.highchartsInitialized = false; 
//           });
//         },
//       }),
//       init() {
//         const events = all_Traits
//           .filter((i) => ["strings"].indexOf(i.name) < 0)
//           .map((i) => `change:${i.name}`)
//           .join(" ");
//         this.on(events, () => {
//           this.highchartsInitialized = false;  
//           this.trigger("change:script");
//         });
//       },
//     },
//   });

   

//   editor.Components.addType("custom_line_chart", {
//     model: {
//       defaults: props_test_chart({
//         ...test_chart_Props,
//         tagName: "figure",
//         resizable: 1,
//         custom_line_chartsrc: "https://code.highcharts.com/highcharts.js",
//         droppable: 0,
//         stylable: 1,
//         attributes: { 'data-i_designer-type': 'custom_line_chart' },
//         traits: [id_Trait, title_Trait, ...all_Traits],
//         style: {
//           padding: "2px",
//         },
//         script: function () { 
//             if (this.highchartsInitialized) return;
//             this.highchartsInitialized = true; 
//           const init1 = () => {
//             const ctx = this.id; 
//             let chart_Title = "{[ chartTitle ]}";
//             let chart_Title_align = "{[ SelectTitleAlign ]}";
//             let JsonPath1 = "{[ jsonpath ]}"; 
//             let chartType = "{[ SelectChart ]}";
//             var language = localStorage.getItem('language');
//             if (language === undefined || language === null || language === '') {
//                 language = 'english';
//             } 
//             let project_type = 'developmentJsonType';
//             let str = JSON.parse(localStorage.getItem('common_json'))[language][JsonPath1];
//             if (typeof project_type2 !== 'undefined' && project_type2 === 'downloadedJsonType') {
//                 project_type = 'downloadedJsonType';
//             }
//             if (project_type === 'downloadedJsonType') {
//                 str = jsonData1[0][language][JsonPath1];
//             }
//             let chart_yAxis = "{[ ChartyAxis ]}";
//             let chart_layout = "{[ SelectChartLayout ]}";
//             let seriesData = [];
//             let seriesData2 = [];
//             let chartAlign = '';
//             try {
//                 seriesData = eval(str);
//                 if (seriesData.series === undefined) {
//                     alert("Series array not found");
//                     return false;
//                 }
//             } catch (e) {
//                 seriesData = [];
//                 if (JsonPath1 !== '' && JsonPath1 !== null && JsonPath1 !== undefined && JsonPath1 !== ' ') {
//                     alert("JSON path not found");
//                 }
//             }
//             if (chartType == '') {
//                 chartType = 'pie';
//             };
//             if (chart_layout == '') {
//                 chart_layout = 'horizontal';
//             }
//             chartAlign = chart_layout + 'Align';
//             if (chartType == 'pie') {
//                 if (JsonPath1 === '') {
//                     seriesData = {
//                         "series": [{
//                             data: [{
//                                 name: "Chrome",
//                                 y: 70.67
//                             },
//                             {
//                                 name: "Edge",
//                                 y: 14.77
//                             },
//                             {
//                                 name: "Firefox",
//                                 y: 4.86
//                             }]
//                         }]
//                     }
//                 }
//                 seriesData2 = {
//                     chart: {
//                         plotBackgroundColor: null,
//                         plotBorderWidth: null,
//                         plotShadow: false,
//                         type: chartType,
//                     },
//                     title: {
//                         text: chart_Title,
//                         align: chart_Title_align
//                     },
//                     series: seriesData.series,
//                     "tooltip": {
//                         pointFormat: "{series.name}: <b>{point.percentage:.1f}%</b>"
//                     },
//                     accessibility: {
//                         point: {
//                             "valueSuffix": "%"
//                         }
//                     },
//                     credits: {
//                         enabled: false
//                     },
//                     plotOptions: {
//                         pie: {
//                             "allowPointSelect": true,
//                             "cursor": "pointer",
//                             "dataLabels": {
//                                 "enabled": false
//                             },
//                             "colors": null,
//                             "showInLegend": true
//                         }
//                     },
//                 }
//             }
//             if (chartType == 'bar') {
//                 if (JsonPath1 === '') {
//                     seriesData = {
//                         "xAxis": {
//                             "categories": ["Africa", "America", "Asia", "Europe", "Oceania"]
//                         },
//                         "series": [{
//                             "name": "Year 1990",
//                             "data": [631, 727, 3202, 721, 26]
//                         }, {
//                             "name": "Year 2000",
//                             "data": [814, 841, 3714, 726, 31]
//                         }, {
//                             "name": "Year 2010",
//                             "data": [1044, 944, 4170, 735, 40]
//                         }, {
//                             "name": "Year 2018",
//                             "data": [1276, 1007, 4561, 746, 42]
//                         }]
//                     }
//                 }
//                 seriesData2 = {
//                     chart: {
//                         "plotBackgroundColor": null,
//                         "plotBorderWidth": null,
//                         "plotShadow": false,
//                         "type": "bar"
//                     },
//                     "title": {
//                         text: chart_Title,
//                         align: chart_Title_align
//                     },

//                     "xAxis": {
//                         "categories": seriesData.xAxis.categories,
//                         "title": {
//                             "text": null
//                         }
//                     },
//                     "tooltip": {
//                         "valueSuffix": "millions"
//                     },
//                     "plotOptions": {
//                         "bar": {
//                             "dataLabels": {
//                                 "enabled": true
//                             }
//                         }
//                     },
//                     "legend": {
//                         "layout": chart_layout,
//                         "align": "right",
//                         chartAlign: "top",
//                         "x": -40,
//                         "y": 80,
//                         "floating": true,
//                         "borderWidth": 1,
//                         "backgroundColor": "#FFFFFF",
//                         "shadow": true
//                     },
//                     "credits": {
//                         "enabled": false
//                     },
//                     series: seriesData.series,
//                 }
//             }
//             if (chartType == 'line') {
//                 if (JsonPath1 === '') {
//                     seriesData = {
//                         "series": [
//                             {
//                                 "name": "Installation & Developers",
//                                 "data": [43934, 48656, 65165, 81827, 112143, 142383,
//                                     171533, 165174, 155157, 161454, 154610]
//                             }, {
//                                 "name": "Manufacturing",
//                                 "data": [24916, 37941, 29742, 29851, 32490, 30282,
//                                     38121, 36885, 33726, 34243, 31050]
//                             }]
//                     }
//                 }
//                 seriesData2 = {
//                     "chart": {
//                         "plotBackgroundColor": null,
//                         "plotBorderWidth": null,
//                         "plotShadow": false,
//                         "type": "line"
//                     },
//                     "title": {
//                         text: chart_Title,
//                         align: chart_Title_align
//                     },
//                     "yAxis": {
//                         "title": {
//                             "text": chart_yAxis
//                         }
//                     },

//                     "series": seriesData.series,

//                     "xAxis": {
//                         "accessibility": {
//                             "rangeDescription": ""
//                         }
//                     },

//                     "legend": {
//                         "layout": chart_layout,
//                         "align": "right",
//                         chartAlign: "middle"
//                     },

//                     "plotOptions": {
//                         "series": {
//                             "label": {
//                                 "connectorAllowed": false
//                             },
//                             "pointStart": 2010
//                         }
//                     },

//                     "responsive": {
//                         "rules": [{
//                             "condition": {
//                                 "maxWidth": 500
//                             },
//                             "chartOptions": {
//                                 "legend": {
//                                     "layout": chart_layout,
//                                     "align": "center",
//                                     chartAlign: "bottom"
//                                 }
//                             }
//                         }]
//                     },
//                     "colors": null,
//                     "credits": { "enabled": false }
//                 }
//             }
//             if (chartType == 'column') {
//                 if (JsonPath1 === '') {
//                     seriesData = {
//                         "xAxis": {
//                             "categories": ["Africa", "America", "Asia"],
//                         },
//                         "series": [{
//                             "name": "Year 1990",
//                             "data": [631, 727, 3202]
//                         }, {
//                             "name": "Year 2000",
//                             "data": [814, 841, 3714]
//                         }, {
//                             "name": "Year 2010",
//                             "data": [1044, 944, 4170]
//                         }]
//                     }
//                 }
//                 seriesData2 = {
//                     "chart": {
//                         "plotBackgroundColor": null,
//                         "plotBorderWidth": null,
//                         "plotShadow": false,
//                         "type": "column"
//                     },
//                     "title": {
//                         text: chart_Title,
//                         align: chart_Title_align
//                     },

//                     "xAxis": {
//                         "categories": seriesData.xAxis.categories,
//                         "title": {
//                             "text": null
//                         }
//                     },
//                     "yAxis": {
//                         "min": 0,
//                         "title": {
//                             "text": chart_yAxis
//                         },
//                         "labels": {
//                             "overflow": "justify"
//                         }
//                     },
//                     "tooltip": {
//                         "valueSuffix": "millions"
//                     },
//                     "plotOptions": {
//                         "bar": {
//                             "dataLabels": {
//                                 "enabled": true
//                             }
//                         }
//                     },
//                     "legend": {
//                         "layout": chart_layout,
//                         "align": "right",
//                         chartAlign: "top",
//                         "x": -40,
//                         "y": 80,
//                         "floating": true,
//                         "borderWidth": 1,
//                         "backgroundColor": "#FFFFFF",
//                         "shadow": true
//                     },
//                     "credits": {
//                         "enabled": false
//                     },
//                     "series": seriesData.series
//                 }
//             }
//             if (chartType == 'stacked-column') {
//                 if (JsonPath1 === '') {
//                     seriesData = {
//                         "xAxis": {
//                             categories: ['Arsenal', 'Chelsea'],
//                         },
//                         "series": [{
//                             name: 'BPL',
//                             data: [3, 55]
//                         }, {
//                             name: 'FA Cup',
//                             data: [14, 8]
//                         }, {
//                             name: 'CL',
//                             data: [0, 2]
//                         }]
//                     }
//                 }
//                 seriesData2 = {
//                     chart: {
//                         type: 'column'
//                     },
//                     title: {
//                         text: chart_Title,
//                         align: chart_Title_align
//                     },
//                     xAxis: {
//                         categories: seriesData.xAxis.categories,
//                     },
//                     yAxis: {
//                         min: 0,
//                         title: {
//                             text: chart_yAxis
//                         },
//                         stackLabels: {
//                             enabled: true,
//                             style: {
//                                 fontWeight: 'bold',
//                                 color: (
//                                     Highcharts.defaultOptions.title.style &&
//                                     Highcharts.defaultOptions.title.style.color
//                                 ) || 'gray',
//                                 textOutline: 'none'
//                             }
//                         }
//                     },
//                     legend: {
//                         "layout": chart_layout,
//                         align: 'left',
//                         x: 70,
//                         verticalAlign: 'top',
//                         y: 70,
//                         floating: true,
//                         backgroundColor:
//                             Highcharts.defaultOptions.legend.backgroundColor || 'white',
//                         borderColor: '#CCC',
//                         borderWidth: 1,
//                         shadow: false
//                     },
//                     tooltip: {
//                         headerFormat: '<b>{point.x}</b><br/>',
//                         pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}'
//                     },
//                     plotOptions: {
//                         column: {
//                             stacking: 'normal',
//                             dataLabels: {
//                                 enabled: true
//                             }
//                         }
//                     },
//                     "series": seriesData.series
//                 }
//             }
//             if (chartType == 'stacked-bar') {
//                 if (JsonPath1 === '') {
//                     seriesData = {
//                         "xAxis": {
//                             categories: ['2020/21', '2019/20', '2018/19'],
//                         },
//                         "series": [{
//                             name: 'Cristiano Ronaldo',
//                             data: [4, 4, 6]
//                         }, {
//                             name: 'Lionel Messi',
//                             data: [5, 3, 12]
//                         }, {
//                             name: 'Robert Lewandowski',
//                             data: [5, 15, 8]
//                         }]
//                     }
//                 }
//                 seriesData2 = {
//                     chart: {
//                         type: 'bar'
//                     },
//                     title: {
//                         text: chart_Title,
//                         align: chart_Title_align
//                     },
//                     xAxis: {
//                         categories: seriesData.xAxis.categories,
//                     },
//                     yAxis: {
//                         min: 0,
//                         title: {
//                             text: 'Goals'
//                         }
//                     },
//                     legend: {
//                         reversed: true
//                     },
//                     plotOptions: {
//                         series: {
//                             stacking: 'normal',
//                             dataLabels: {
//                                 enabled: true
//                             }
//                         }
//                     },
//                     "series": seriesData.series
//                 }
//             }
//             if (chartType == 'drilldown_bar') {
//                 if (JsonPath1 == '') {
//                     seriesData = {
//                         "series": [
//                             {
//                                 "name": "Browsers",
//                                 "colorByPoint": true,
//                                 "data": [
//                                     {
//                                         "name": "Chrome",
//                                         "y": 61.04,
//                                         "drilldown": "Chrome"
//                                     },
//                                     {
//                                         "name": "Safari",
//                                         "y": 9.47,
//                                         "drilldown": "Safari"
//                                     },
//                                     {
//                                         "name": "Other",
//                                         "y": 11.02,
//                                         "drilldown": null
//                                     }
//                                 ]
//                             }
//                         ],
//                         "drilldown": {
//                             "series": [
//                                 {
//                                     "name": "Chrome",
//                                     "id": "Chrome",
//                                     "data": [
//                                         [
//                                             "v97.0",
//                                             36.89
//                                         ],
//                                         [
//                                             "v96.0",
//                                             18.16
//                                         ],
//                                         [
//                                             "v95.0",
//                                             0.54
//                                         ]
//                                     ]
//                                 },
//                                 {
//                                     "name": "Safari",
//                                     "id": "Safari",
//                                     "data": [
//                                         [
//                                             "v15.3",
//                                             0.1
//                                         ],
//                                         [
//                                             "v15.2",
//                                             2.01
//                                         ],
//                                         [
//                                             "v15.1",
//                                             2.29
//                                         ]
//                                     ]
//                                 }
//                             ]
//                         }
//                     }
//                 }
//                 seriesData2 = {
//                     "chart": {
//                         "plotBackgroundColor": null,
//                         "plotBorderWidth": null,
//                         "plotShadow": false,
//                         "type": "bar"
//                     },
//                     "title": {
//                         text: chart_Title,
//                         align: chart_Title_align
//                     },
//                     "xAxis": {
//                         "type": "category"
//                     },
//                     "yAxis": {
//                         "title": {
//                             "text": chart_yAxis
//                         }
//                     },
//                     "tooltip": {
//                         "valueSuffix": ""
//                     },
//                     "plotOptions": {
//                         "series": {
//                             "borderWidth": 0,
//                             "dataLabels": {
//                                 "enabled": true,
//                                 "format": "{point.y:.1f}%"
//                             }
//                         }
//                     },
//                     "legend": {
//                         "enabled": false
//                     },
//                     "credits": {
//                         "enabled": false
//                     },
//                     "series": seriesData.series,
//                     "drilldown": seriesData.drilldown
//                 }
//             }
//             if (chartType == 'drilldown_pie') {
//                 if (JsonPath1 == '') {
//                     seriesData = {
//                         "series": [
//                             {
//                                 "name": "Browsers",
//                                 "colorByPoint": true,
//                                 "data": [
//                                     {
//                                         "name": "Chrome",
//                                         "y": 61.04,
//                                         "drilldown": "Chrome"
//                                     },
//                                     {
//                                         "name": "Safari",
//                                         "y": 9.47,
//                                         "drilldown": "Safari"
//                                     }
//                                 ]
//                             }
//                         ],
//                         "drilldown": {
//                             "series": [
//                                 {
//                                     "name": "Chrome",
//                                     "id": "Chrome",
//                                     "data": [
//                                         [
//                                             "v97.0",
//                                             36.89
//                                         ],
//                                         [
//                                             "v96.0",
//                                             18.16
//                                         ],
//                                         [
//                                             "v95.0",
//                                             0.54
//                                         ],
//                                         [
//                                             "v49.0",
//                                             0.17
//                                         ]
//                                     ]
//                                 },
//                                 {
//                                     "name": "Safari",
//                                     "id": "Safari",
//                                     "data": [
//                                         [
//                                             "v15.3",
//                                             0.1
//                                         ],
//                                         [
//                                             "v15.2",
//                                             2.01
//                                         ]
//                                     ]
//                                 },
//                             ]
//                         }
//                     }
//                 }
//                 seriesData2 = {
//                     "chart": {
//                         "plotBackgroundColor": null,
//                         "plotBorderWidth": null,
//                         "plotShadow": false,
//                         "type": "pie"
//                     },
//                     "title": {
//                         text: chart_Title,
//                         align: chart_Title_align
//                     },

//                     "tooltip": {
//                         "pointFormat": "{series.name}: <b>{point.percentage:.1f}%</b>"
//                     },
//                     "accessibility": {
//                         "point": {
//                             "valueSuffix": "%"
//                         }
//                     },
//                     "credits": {
//                         "enabled": false
//                     },
//                     "plotOptions": {
//                         "pie": {
//                             "allowPointSelect": true,
//                             "cursor": "pointer",
//                             "dataLabels": {
//                                 "enabled": false
//                             },
//                             "colors": null,
//                             "showInLegend": true
//                         }
//                     },
//                     "series": seriesData.series,
//                     "drilldown": seriesData.drilldown
//                 }
//             }
//             if (chartType == 'drilldown_line') {
//                 if (JsonPath1 == '') {
//                     seriesData = {
//                         "series": [
//                             {
//                                 "name": "Things",
//                                 "colorByPoint": true,
//                                 "data": [{
//                                     "name": "Animals",
//                                     "y": 5,
//                                     "drilldown": "animals"
//                                 }, {
//                                     "name": "Fruits",
//                                     "y": 2,
//                                     "drilldown": "fruits"
//                                 }, {
//                                     "name": "Cars",
//                                     "y": 4,
//                                     "drilldown": "cars"
//                                 }]
//                             },
//                             {
//                                 "name": "vehicles",
//                                 "colorByPoint": true,
//                                 "data": [{
//                                     "name": "Vehicle 1",
//                                     "y": 25,
//                                     "drilldown": "vehicle1"
//                                 }, {
//                                     "name": "Vehicle 2",
//                                     "y": 25,
//                                     "drilldown": "vehicle2"
//                                 }, {
//                                     "name": "Vehicle 3",
//                                     "y": 45,
//                                     "drilldown": "vehicle3"
//                                 }]
//                             }
//                         ],
//                         "drilldown": {
//                             "series": [
//                                 {
//                                     "id": "animals",
//                                     "data": [
//                                         ["Cats", 4],
//                                         ["Dogs", 2],
//                                         ["Cows", 1],
//                                         ["Sheep", 2],
//                                         ["Pigs", 1]
//                                     ]
//                                 }, {
//                                     "id": "fruits",
//                                     "data": [
//                                         ["Apples", 4],
//                                         ["Oranges", 2]
//                                     ]
//                                 }, {
//                                     "id": "cars",
//                                     "data": [
//                                         ["Toyota", 4],
//                                         ["Opel", 2],
//                                         ["Volkswagen", 2]
//                                     ]
//                                 }, {
//                                     "id": "vehicle1",
//                                     "data": [
//                                         ["Toyota", 4],
//                                         ["Opel", 2],
//                                         ["Volkswagen", 2]
//                                     ]
//                                 }, {
//                                     "id": "vehicle2",
//                                     "data": [
//                                         ["Toyota", 12],
//                                         ["Opel", 12],
//                                         ["Volkswagen", 2]
//                                     ]
//                                 }, {
//                                     "id": "vehicle3",
//                                     "data": [
//                                         ["Toyota", 5],
//                                         ["Opel", 4],
//                                         ["Volkswagen", 1]
//                                     ]
//                                 }
//                             ]
//                         }
//                     }
//                 }
//                 seriesData2 = {
//                     "chart": {
//                         "plotBackgroundColor": null,
//                         "plotBorderWidth": null,
//                         "plotShadow": false,
//                         "type": "line"
//                     },
//                     "title": {
//                         text: chart_Title,
//                         align: chart_Title_align
//                     },
//                     "yAxis": {
//                         "title": {
//                             "text": chart_yAxis
//                         }
//                     },
//                     "series": seriesData.series,
//                     "drilldown": seriesData.drilldown,

//                     "xAxis": {
//                         "accessibility": {
//                             "rangeDescription": ""
//                         }
//                     },
//                     "legend": {
//                         "layout": chart_layout,
//                         "align": "right",
//                         chartAlign: "middle"
//                     },

//                     "plotOptions": {
//                         "series": {
//                             "label": {
//                                 "connectorAllowed": false
//                             },
//                             "pointStart": 2010
//                         }
//                     },
//                     "responsive": {
//                         "rules": [{
//                             "condition": {
//                                 "maxWidth": 500
//                             },
//                             "chartOptions": {
//                                 "legend": {
//                                     "layout": chart_layout,
//                                     "align": "center",
//                                     "verticalAlign": "bottom"
//                                 }
//                             }
//                         }]
//                     },
//                     "credits": { "enabled": false },
//                 }
//             }
//             Highcharts.chart(ctx, seriesData2);
//           };    
//           if (!window.Highcharts) {
//             const scr = document.createElement("script");
//             scr.src = "{[ custom_line_chartsrc ]}";
//             scr.onload = init1;
//             document.head.appendChild(scr);
//           } else {
//             init1();
//           }
//           this.on('removed', function() {
//             this.highchartsInitialized = false;
//         });

//         },
//       }),
//       init() {
//         const events = all_Traits
//           .filter(i => ["strings"].indexOf(i.name) < 0)
//           .map(i => `change:${i.name}`)
//           .join(" ");
//         this.on(events, () => {
//           this.highchartsInitialized = false;
//           this.trigger("change:script");
//         });
//       },
//     },
//   }); 



  editor.Components.addType("custom_line_chart", {
    model: {
      defaults: props_test_chart({
        ...test_chart_Props,
        tagName: "figure",
        resizable: 1,
        custom_line_chartsrc: "https://code.highcharts.com/highcharts.js",
        droppable: 0,
        stylable: 1,
        attributes: { 'data-i_designer-type': 'custom_line_chart' },
        traits: [id_Trait, title_Trait, ...all_Traits],
        style: {
          padding: "2px",
        },
        script: function () { 
          if (this.highchartsInitialized) return;
          this.highchartsInitialized = true; 
          const init1 = () => {
            const ctx = this.id; 
            let chart_Title = "{[ chartTitle ]}";
            let chart_Title_align = "{[ SelectTitleAlign ]}";
            let JsonPath1 = "{[ jsonpath ]}"; 
            let chartType = "{[ SelectChart ]}";
            var language = localStorage.getItem('language');
            if (language === undefined || language === null || language === '') {
                language = 'english';
            } 
            let project_type = 'developmentJsonType';
            let str = JSON.parse(localStorage.getItem('common_json'))[language][JsonPath1];
            if (typeof project_type2 !== 'undefined' && project_type2 === 'downloadedJsonType') {
                project_type = 'downloadedJsonType';
            }
            if (project_type === 'downloadedJsonType') {
                str = jsonData1[0][language][JsonPath1];
            }
            let chart_yAxis = "{[ ChartyAxis ]}";
            let chart_layout = "{[ SelectChartLayout ]}";
            let seriesData = [];
            let seriesData2 = [];
            let chartAlign = '';
            try {
                seriesData = eval(str);
                if (seriesData.series === undefined) {
                    alert("Series array not found");
                    return false;
                }
            } catch (e) {
                seriesData = [];
                if (JsonPath1 !== '' && JsonPath1 !== null && JsonPath1 !== undefined && JsonPath1 !== ' ') {
                    alert("JSON path not found");
                }
            }
            if (chartType == '') {
                chartType = 'pie';
            };
            if (chart_layout == '') {
                chart_layout = 'horizontal';
            }
            chartAlign = chart_layout + 'Align';
            if (chartType == 'pie') {
                if (JsonPath1 === '') {
                    seriesData = {
                        "series": [{
                            data: [{
                                name: "Chrome",
                                y: 70.67
                            },
                            {
                                name: "Edge",
                                y: 14.77
                            },
                            {
                                name: "Firefox",
                                y: 4.86
                            }]
                        }]
                    }
                }
                seriesData2 = {
                    chart: {
                        plotBackgroundColor: null,
                        plotBorderWidth: null,
                        plotShadow: false,
                        type: chartType,
                    },
                    title: {
                        text: chart_Title,
                        align: chart_Title_align
                    },
                    series: seriesData.series,
                    "tooltip": {
                        pointFormat: "{series.name}: <b>{point.percentage:.1f}%</b>"
                    },
                    accessibility: {
                        point: {
                            "valueSuffix": "%"
                        }
                    },
                    credits: {
                        enabled: false
                    },
                    plotOptions: {
                        pie: {
                            "allowPointSelect": true,
                            "cursor": "pointer",
                            "dataLabels": {
                                "enabled": false
                            },
                            "colors": null,
                            "showInLegend": true
                        }
                    },
                }
            }
            if (chartType == 'bar') {
                if (JsonPath1 === '') {
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
                    }
                }
                seriesData2 = {
                    chart: {
                        "plotBackgroundColor": null,
                        "plotBorderWidth": null,
                        "plotShadow": false,
                        "type": "bar"
                    },
                    "title": {
                        text: chart_Title,
                        align: chart_Title_align
                    },

                    "xAxis": {
                        "categories": seriesData.xAxis.categories,
                        "title": {
                            "text": null
                        }
                    },
                    "tooltip": {
                        "valueSuffix": "millions"
                    },
                    "plotOptions": {
                        "bar": {
                            "dataLabels": {
                                "enabled": true
                            }
                        }
                    },
                    "legend": {
                        "layout": chart_layout,
                        "align": "right",
                        chartAlign: "top",
                        "x": -40,
                        "y": 80,
                        "floating": true,
                        "borderWidth": 1,
                        "backgroundColor": "#FFFFFF",
                        "shadow": true
                    },
                    "credits": {
                        "enabled": false
                    },
                    series: seriesData.series,
                }
            }
            if (chartType == 'line') {
                if (JsonPath1 === '') {
                    seriesData = {
                        "series": [
                            {
                                "name": "Installation & Developers",
                                "data": [43934, 48656, 65165, 81827, 112143, 142383,
                                    171533, 165174, 155157, 161454, 154610]
                            }, {
                                "name": "Manufacturing",
                                "data": [24916, 37941, 29742, 29851, 32490, 30282,
                                    38121, 36885, 33726, 34243, 31050]
                            }]
                    }
                }
                seriesData2 = {
                    "chart": {
                        "plotBackgroundColor": null,
                        "plotBorderWidth": null,
                        "plotShadow": false,
                        "type": "line"
                    },
                    "title": {
                        text: chart_Title,
                        align: chart_Title_align
                    },
                    "yAxis": {
                        "title": {
                            "text": chart_yAxis
                        }
                    },

                    "series": seriesData.series,

                    "xAxis": {
                        "accessibility": {
                            "rangeDescription": ""
                        }
                    },

                    "legend": {
                        "layout": chart_layout,
                        "align": "right",
                        chartAlign: "middle"
                    },

                    "plotOptions": {
                        "series": {
                            "label": {
                                "connectorAllowed": false
                            },
                            "pointStart": 2010
                        }
                    },

                    "responsive": {
                        "rules": [{
                            "condition": {
                                "maxWidth": 500
                            },
                            "chartOptions": {
                                "legend": {
                                    "layout": chart_layout,
                                    "align": "center",
                                    chartAlign: "bottom"
                                }
                            }
                        }]
                    },
                    "colors": null,
                    "credits": { "enabled": false }
                }
            }
            if (chartType == 'column') {
                if (JsonPath1 === '') {
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
                    }
                }
                seriesData2 = {
                    "chart": {
                        "plotBackgroundColor": null,
                        "plotBorderWidth": null,
                        "plotShadow": false,
                        "type": "column"
                    },
                    "title": {
                        text: chart_Title,
                        align: chart_Title_align
                    },

                    "xAxis": {
                        "categories": seriesData.xAxis.categories,
                        "title": {
                            "text": null
                        }
                    },
                    "yAxis": {
                        "min": 0,
                        "title": {
                            "text": chart_yAxis
                        },
                        "labels": {
                            "overflow": "justify"
                        }
                    },
                    "tooltip": {
                        "valueSuffix": "millions"
                    },
                    "plotOptions": {
                        "bar": {
                            "dataLabels": {
                                "enabled": true
                            }
                        }
                    },
                    "legend": {
                        "layout": chart_layout,
                        "align": "right",
                        chartAlign: "top",
                        "x": -40,
                        "y": 80,
                        "floating": true,
                        "borderWidth": 1,
                        "backgroundColor": "#FFFFFF",
                        "shadow": true
                    },
                    "credits": {
                        "enabled": false
                    },
                    "series": seriesData.series
                }
            }
            if (chartType == 'stacked-column') {
                if (JsonPath1 === '') {
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
                    }
                }
                seriesData2 = {
                    chart: {
                        type: 'column'
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
                                color: (
                                    Highcharts.defaultOptions.title.style &&
                                    Highcharts.defaultOptions.title.style.color
                                ) || 'gray',
                                textOutline: 'none'
                            }
                        }
                    },
                    legend: {
                        "layout": chart_layout,
                        align: 'left',
                        x: 70,
                        verticalAlign: 'top',
                        y: 70,
                        floating: true,
                        backgroundColor:
                            Highcharts.defaultOptions.legend.backgroundColor || 'white',
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
                            }
                        }
                    },
                    "series": seriesData.series
                }
            }
            if (chartType == 'stacked-bar') {
                if (JsonPath1 === '') {
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
                    }
                }
                seriesData2 = {
                    chart: {
                        type: 'bar'
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
                            text: 'Goals'
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
                            }
                        }
                    },
                    "series": seriesData.series
                }
            }
            if (chartType == 'drilldown_bar') {
                if (JsonPath1 == '') {
                    seriesData = {
                        "series": [
                            {
                                "name": "Browsers",
                                "colorByPoint": true,
                                "data": [
                                    {
                                        "name": "Chrome",
                                        "y": 61.04,
                                        "drilldown": "Chrome"
                                    },
                                    {
                                        "name": "Safari",
                                        "y": 9.47,
                                        "drilldown": "Safari"
                                    },
                                    {
                                        "name": "Other",
                                        "y": 11.02,
                                        "drilldown": null
                                    }
                                ]
                            }
                        ],
                        "drilldown": {
                            "series": [
                                {
                                    "name": "Chrome",
                                    "id": "Chrome",
                                    "data": [
                                        [
                                            "v97.0",
                                            36.89
                                        ],
                                        [
                                            "v96.0",
                                            18.16
                                        ],
                                        [
                                            "v95.0",
                                            0.54
                                        ]
                                    ]
                                },
                                {
                                    "name": "Safari",
                                    "id": "Safari",
                                    "data": [
                                        [
                                            "v15.3",
                                            0.1
                                        ],
                                        [
                                            "v15.2",
                                            2.01
                                        ],
                                        [
                                            "v15.1",
                                            2.29
                                        ]
                                    ]
                                }
                            ]
                        }
                    }
                }
                seriesData2 = {
                    "chart": {
                        "plotBackgroundColor": null,
                        "plotBorderWidth": null,
                        "plotShadow": false,
                        "type": "bar"
                    },
                    "title": {
                        text: chart_Title,
                        align: chart_Title_align
                    },
                    "xAxis": {
                        "type": "category"
                    },
                    "yAxis": {
                        "title": {
                            "text": chart_yAxis
                        }
                    },
                    "tooltip": {
                        "valueSuffix": ""
                    },
                    "plotOptions": {
                        "series": {
                            "borderWidth": 0,
                            "dataLabels": {
                                "enabled": true,
                                "format": "{point.y:.1f}%"
                            }
                        }
                    },
                    "legend": {
                        "enabled": false
                    },
                    "credits": {
                        "enabled": false
                    },
                    "series": seriesData.series,
                    "drilldown": seriesData.drilldown
                }
            }
            if (chartType == 'drilldown_pie') {
                if (JsonPath1 == '') {
                    seriesData = {
                        "series": [
                            {
                                "name": "Browsers",
                                "colorByPoint": true,
                                "data": [
                                    {
                                        "name": "Chrome",
                                        "y": 61.04,
                                        "drilldown": "Chrome"
                                    },
                                    {
                                        "name": "Safari",
                                        "y": 9.47,
                                        "drilldown": "Safari"
                                    }
                                ]
                            }
                        ],
                        "drilldown": {
                            "series": [
                                {
                                    "name": "Chrome",
                                    "id": "Chrome",
                                    "data": [
                                        [
                                            "v97.0",
                                            36.89
                                        ],
                                        [
                                            "v96.0",
                                            18.16
                                        ],
                                        [
                                            "v95.0",
                                            0.54
                                        ],
                                        [
                                            "v49.0",
                                            0.17
                                        ]
                                    ]
                                },
                                {
                                    "name": "Safari",
                                    "id": "Safari",
                                    "data": [
                                        [
                                            "v15.3",
                                            0.1
                                        ],
                                        [
                                            "v15.2",
                                            2.01
                                        ]
                                    ]
                                },
                            ]
                        }
                    }
                }
                seriesData2 = {
                    "chart": {
                        "plotBackgroundColor": null,
                        "plotBorderWidth": null,
                        "plotShadow": false,
                        "type": "pie"
                    },
                    "title": {
                        text: chart_Title,
                        align: chart_Title_align
                    },

                    "tooltip": {
                        "pointFormat": "{series.name}: <b>{point.percentage:.1f}%</b>"
                    },
                    "accessibility": {
                        "point": {
                            "valueSuffix": "%"
                        }
                    },
                    "credits": {
                        "enabled": false
                    },
                    "plotOptions": {
                        "pie": {
                            "allowPointSelect": true,
                            "cursor": "pointer",
                            "dataLabels": {
                                "enabled": false
                            },
                            "colors": null,
                            "showInLegend": true
                        }
                    },
                    "series": seriesData.series,
                    "drilldown": seriesData.drilldown
                }
            }
            if (chartType == 'drilldown_line') {
                if (JsonPath1 == '') {
                    seriesData = {
                        "series": [
                            {
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
                                }, {
                                    "name": "Cars",
                                    "y": 4,
                                    "drilldown": "cars"
                                }]
                            },
                            {
                                "name": "vehicles",
                                "colorByPoint": true,
                                "data": [{
                                    "name": "Vehicle 1",
                                    "y": 25,
                                    "drilldown": "vehicle1"
                                }, {
                                    "name": "Vehicle 2",
                                    "y": 25,
                                    "drilldown": "vehicle2"
                                }, {
                                    "name": "Vehicle 3",
                                    "y": 45,
                                    "drilldown": "vehicle3"
                                }]
                            }
                        ],
                        "drilldown": {
                            "series": [
                                {
                                    "id": "animals",
                                    "data": [
                                        ["Cats", 4],
                                        ["Dogs", 2],
                                        ["Cows", 1],
                                        ["Sheep", 2],
                                        ["Pigs", 1]
                                    ]
                                }, {
                                    "id": "fruits",
                                    "data": [
                                        ["Apples", 4],
                                        ["Oranges", 2]
                                    ]
                                }, {
                                    "id": "cars",
                                    "data": [
                                        ["Toyota", 4],
                                        ["Opel", 2],
                                        ["Volkswagen", 2]
                                    ]
                                }, {
                                    "id": "vehicle1",
                                    "data": [
                                        ["Toyota", 4],
                                        ["Opel", 2],
                                        ["Volkswagen", 2]
                                    ]
                                }, {
                                    "id": "vehicle2",
                                    "data": [
                                        ["Toyota", 12],
                                        ["Opel", 12],
                                        ["Volkswagen", 2]
                                    ]
                                }, {
                                    "id": "vehicle3",
                                    "data": [
                                        ["Toyota", 5],
                                        ["Opel", 4],
                                        ["Volkswagen", 1]
                                    ]
                                }
                            ]
                        }
                    }
                }
                seriesData2 = {
                    "chart": {
                        "plotBackgroundColor": null,
                        "plotBorderWidth": null,
                        "plotShadow": false,
                        "type": "line"
                    },
                    "title": {
                        text: chart_Title,
                        align: chart_Title_align
                    },
                    "yAxis": {
                        "title": {
                            "text": chart_yAxis
                        }
                    },
                    "series": seriesData.series,
                    "drilldown": seriesData.drilldown,

                    "xAxis": {
                        "accessibility": {
                            "rangeDescription": ""
                        }
                    },
                    "legend": {
                        "layout": chart_layout,
                        "align": "right",
                        chartAlign: "middle"
                    },

                    "plotOptions": {
                        "series": {
                            "label": {
                                "connectorAllowed": false
                            },
                            "pointStart": 2010
                        }
                    },
                    "responsive": {
                        "rules": [{
                            "condition": {
                                "maxWidth": 500
                            },
                            "chartOptions": {
                                "legend": {
                                    "layout": chart_layout,
                                    "align": "center",
                                    "verticalAlign": "bottom"
                                }
                            }
                        }]
                    },
                    "credits": { "enabled": false },
                }
            }
            Highcharts.chart(ctx, seriesData2);
          };   
          if (!window.Highcharts) {
            const scr = document.createElement("script");
            scr.src = "{[ custom_line_chartsrc ]}";
            scr.onload = init1;
            document.head.appendChild(scr);
          } else {
            init1();
          }
          this.on('removed', function() {
            this.highchartsInitialized = false;
          });
        },
      }),
      init() {
        const events = all_Traits
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
  
  addCustomLineChartType(editor);
  

  //  Common Json Code Started
  const styleManager = editor.StyleManager;
  let common_json_file_name_value = localStorage.getItem('common_json_file_name');
  let common_json_file_name_text = '';
  if (common_json_file_name_value !== null && jsonData.length !== 0) {
      common_json_file_name_text = 'Already Added File : ' + common_json_file_name_value;
  }
  editor.on('load', (block) => {
      var jsonF = document.getElementById("jsonFileUpload");
      jsonF.addEventListener("click", jsonFileUploads, true);
  })

  function jsonFileUploads() {
      editor.Modal.setTitle('Import Json File');
      editor.Modal.setContent(`<div class="new-table-form">
    <div style="padding-bottom:10px">
    ${common_json_file_name_text}
    </div>
    <div> 
        <input type="file" class="form-control popupinput2" value="" accept="application/json" placeholder="" style="width:95%"  name="importJsonInputFile" id="importJsonInputFile">
    </div>  
    <input id="import-input-json-file" class="popupaddbtn" type="button" value="Add" data-component-id="c1006">
    </div>
    </div>
    `);
      editor.Modal.open();
      var el = document.getElementById("import-input-json-file");
      el.addEventListener("click", importInputJsonFile, true);
  }

  function importInputJsonFile() {
      const input = document.getElementById('importJsonInputFile');
      const file = input.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = function (e) {
              let code = e.target.result;
              code = JSON.parse(code);
              jsonData.length = 0;
              localStorage.setItem('common_json', JSON.stringify(code));
              jsonData = [];
              jsonData.push(code);
              jsonData = JSON.stringify(jsonData);
              alert('File Imported');
              localStorage.setItem('common_json_file_name', file.name);
              common_json_file_name_text = 'Already Added File : ' + file.name;
              editor.Modal.close(); 
              console.log('aaaaaaaaa');
              updateComponentsWithNewJson(editor);

          }
          reader.readAsText(file);
      } else {
          alert('No file selected');
      }
  }

  styleManager.addSector('JSON', {
      name: 'JSON',
      open: false,
      properties: [
          {
              name: 'Json Path',
              property: 'my-input-json',
              type: 'text',
              onChange: handleJsonPathChange,
          },
      ]
  });

  function handleJsonPathChange(event) {
      if (event.value) {
          const selectedComponent = editor.getSelected();
          const componentType = selectedComponent?.get('type');
          if (componentType === 'text') {
              const content = selectedComponent?.get('content');
              if (content !== undefined) {
                  try {
                      const commonJson = JSON.parse(localStorage.getItem("common_json"));
                      const jsonPath = `commonJson.${custom_language}.${event.value}`;
                      const value = eval(jsonPath);
                      if (value) {
                          const componentView = selectedComponent.view;
                          if (componentView) {
                              componentView.el.innerHTML = value;
                              editor.TraitManager.render();
                          }
                      }
                  } catch (e) {
                      console.error("Error evaluating JSON path:", e);
                  }
              }
          }
      }
  }

  // Start suggestion module   
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

  // Recursive function to extract all metadata keys including nested keys with proper array indexing
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

  // open basic json popup model
  function openSuggestionJsonModal() {
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
              // You can use the selectedValue as needed, such as adding it to an input field or performing other actions
              const inputField = document.querySelector('.i_designer-sm-property__my-input-json input');
              // Set the value of the input field to the selectedValue
              inputField.value = selectedValue;
              var event = new Event('change', {
                  bubbles: true, // Ensure the event bubbles up
                  cancelable: true // Ensure the event can be canceled
              });
              // Dispatch the 'change' event on the input field
              inputField.dispatchEvent(event);
              editor.Modal.close();

              editor.Modal.close();
          });
      });
  }

  // filter json data
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
      if (component.attributes.type === 'custom_line_chart' || component.attributes.type === 'custom_table') {
          setTimeout(() => {
              const jsonBtnWrapper = document.querySelector('.i_designer-trt-trait__wrp-json-suggestion-btn');
              if (jsonBtnWrapper) {
                  const jsonBtn = jsonBtnWrapper.querySelector('.i_designer-btn-prim');
                  if (jsonBtn) {
                      jsonBtn.id = 'json-suggestion-btn-custom-line-chart'; 
                      jsonBtn.addEventListener('click', function () {
                          if (component.attributes.type === 'custom_line_chart') {
                              openSuggestionJsonModalChartTable('chart');
                          }
                          if (component.attributes.type === 'custom_table') {
                              openSuggestionJsonModalChartTable('table');
                          }
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

              if (type === 'table') {
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

  function customTable2(editor){
    const props_test_table = (i) => i;  
    const id_Trait = {
      name: "id",
      label: "Id",
    };
  
    const title_Trait = {
      name: "title",
      label: "Title",
    }; 
   
    const test_chart_Props = {
      name: "Table",   
      jsonpath:"",  
      pageLength: 5, 
      FileDownload:`["copy", "csv", "excel", "pdf", "print","msword"]`,
    };
  
    const name_Trait = {
      changeProp: 1,
      type: "text",
      name: "name",
      label: "name",
      placeholder: "Chart Name",
    };  
  
    const Footer_Trait = ["Footer"].map((name) => ({
      changeProp: 1,
      type: "select", 
        options: [
            {value: true, label: 'Yes'},
            {value: false, label: 'No'}, 
          ],
      name,
    }));
      
    const File_Download_Trait = ["FileDownload"].map((name) => ({
        changeProp: 1,
        type: "text", 
        label:"File Download",
        default:`["copy", "csv", "excel", "pdf", "print"]`,
        name,
    }));
  
    const Pagination_Trait = ["Pagination"].map((name) => ({
        changeProp: 1,
        type: "select", 
        label:"Pagination",
        options: [
            {value: true, label: 'Yes'},
            {value: false, label: 'No'}, 
          ],
        name,
    }));
  
    const PageLength_Trait = ["pageLength"].map((name) => ({
      changeProp: 1,
      type: "number",  
      label:"Page Length",
      name,
      default:5,
      placeholder:"Enter page length"
    })); 
  
    const Search_Trait = ["Search"].map((name) => ({
        changeProp: 1,
        type: "select", 
        options: [
            {value: true, label: 'Yes'},
            {value: false, label: 'No'}, 
          ],
        name,
    }));
    
    const Caption_Trait = ["Caption"].map((name) => ({
      changeProp: 1,
      type: "select", 
      options: [
          {value: true, label: 'Yes'},
          {value: false, label: 'No'}, 
        ],
      name,
  }));
  
    
  const CaptionAlign_Trait = ["CaptionAlign"].map((name) => ({
    changeProp: 1,
    type: "select", 
    label:"Caption Align",
    options: [
        {value: 'left', label: 'Left'},
        {value: 'right', label: 'Right'}, 
        {value: 'center', label: 'Center'}, 
      ],
    name,
  }));
  
    const json_path_Trait = ["jsonpath"].map((name) => ({
        changeProp: 1,
        type: "text",
        label:"Json Path",
        placeholder: "Enter Json Path",
        name, 
      }));

    const json_button_sugesstionTrait = ["jsonButtonSugesstionTrait"].map((name) => ({
      changeProp: 1,
      type: "button",
      label:"Json Suggestion",
      placeholder: "Json Suggestion", 
      name,
      id: "json-suggestion-btn",  
      text: "Suggestion", 
      class:"json-suggestion-btn",  
    }));
    
    const all_Traits = [
      name_Trait, 
      ...Footer_Trait,
      ...File_Download_Trait,
      ...Pagination_Trait,
      ...PageLength_Trait,
      ...Search_Trait,
      ...Caption_Trait,
      ...CaptionAlign_Trait,
      ...json_path_Trait, 
      ...json_button_sugesstionTrait
    ];
     
    let jsonData = [];  
    let common_json = JSON.parse(localStorage.getItem("common_json"));  
    if(common_json !==null){
      jsonData.length= 0;  
      jsonData.push(common_json); 
      jsonData = JSON.stringify(jsonData); 
    }


  
    // editor.Components.addType("custom_table", {
    //   model: {
    //     defaults: props_test_table({
    //       ...test_chart_Props, 
    //       tagName: "div",  
    //       resizable: 1, 
    //       droppable: 0,
    //       attributes: { 'data-i_designer-type': 'custom_table' },
    //       custom_line_chartsrc: "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js",
    //       stylable: 1,
    //       traits: [id_Trait, title_Trait, ...all_Traits],
    //       style: {
    //         padding: "10px 0px", 
    //       },  
    //       script: ` 

    //       const init = () => { 
    //       const ctx = this.id;      
    //       let footer = "{[ Footer ]}"; 
    //       let downloadFile =  {[ FileDownload ]} ;   
    //       let pagination = "{[ Pagination ]}";  
    //       let pagelengthF = "{[ pageLength ]}";    
    //       let search = "{[ Search ]}";        
    //       let caption = "{[ Caption ]}";    
    //       let captionAlign = "{[ CaptionAlign ]}";
    //       let JsonPath1 = "{[ jsonpath ]}";   
    //       console.log(JsonPath1,'JsonPath1=========');
    //       let custom_language =  localStorage.getItem('language');   
    //       if(custom_language==null){
    //         custom_language = 'english';
    //       }      
    //       let project_type = 'developmentJsonType';  
    //       const jsonDataN = JSON.parse(localStorage.getItem("common_json"));
    //       const jsonDataa = [];
    //       jsonDataa.push(jsonDataN); 
    //       let str = jsonDataa[0][custom_language][JsonPath1];  
    //       if(typeof project_type2 !== 'undefined' &&  project_type2 === 'downloadedJsonType'){
    //         project_type = 'downloadedJsonType'; 
    //       }
    //       if(project_type === 'downloadedJsonType'){ 
    //         str = jsonData1[0][custom_language][JsonPath1];
    //       } 
    //       let tableData = []; 
    //       if(str !== undefined){  
    //           tableData = eval(str);    
    //         setTimeout(() => { 
    //           const length = Object.keys(tableData.heading).length; 
    //             if(length === 0){
    //               alert("Table json formate not proper");
    //               return false; 
    //             } else{   
    //             let uniqueID  =  ctx;     
    //             const divElement = document.getElementById(ctx); 
    //             let downloadBtn = downloadFile;   
    //             for (var i = 0; i < downloadBtn.length; i++) {
    //               if (downloadBtn[i] === "msword") { 
    //                 downloadBtn.splice(i, 1);
    //                 downloadBtn.push({
    //                   text: 'MS Word',
    //                   action: function () { 
    //                     const table = document.getElementById('table'+uniqueID);  
    //                     table.setAttribute('border', '1');  
    //                     table.style.borderCollapse = 'collapse';
    //                     table.style.width = '100%';
    //                     table.style.fontFamily = 'Arial, sans-serif';
    //                     const html = table.outerHTML; 
    //                     const url = 'data:application/msword,' + encodeURIComponent(html);  
    //                     const downloadLink = document.createElement("a");  
    //                     downloadLink.href = url;
    //                     downloadLink.download = 'data.doc';
    //                     downloadLink.style.display = 'none';
    //                     document.body.appendChild(downloadLink); 
    //                     window.location.href = downloadLink.href; 
    //                     document.body.removeChild(downloadLink);   
    //                   }
    //                 });
    //                 break;
    //               }
    //             }  
    //             const rows = Object.keys(tableData.heading).length;  
    //             let table = document.createElement('table');    
    //             table.setAttribute('width','100%'); 
    //             table.setAttribute('class','table table-bordered'); 
    //             table.setAttribute('id','table'+uniqueID);  
    //             if(caption==="true"){ 
    //               if(tableData.caption === undefined || tableData.caption === null){
    //                 alert("Caption data not found in json file");
    //                 return false;
    //               } 
    //               if(captionAlign === null || captionAlign === undefined || captionAlign ===''){
    //                 captionAlign = 'left';
    //               }
    //               let caption1a = document.createElement('caption'); 
    //               caption1a.textContent =  tableData.caption;  
    //               caption1a.style.captionSide = 'top';   
    //               caption1a.style.textAlign = captionAlign;  
    //               table.appendChild(caption1a);   
    //             } 
    //             let thead = document.createElement('thead');  
    //             let thtr = document.createElement('tr'); 
    //             const objectName = Object.keys(tableData.heading);   
    //               for (let j = 0; j < rows; j++) {
    //                 let th = document.createElement('th'); 
    //                 th.setAttribute("class",  "col"+uniqueID+j);
    //                 let div1 = document.createElement('div'); 
    //                 div1.textContent = eval('tableData.heading.'+objectName[j]);
    //                 th.appendChild(div1);
    //                 thtr.appendChild(th);
    //             } 
    //             thead.appendChild(thtr);  
    //             table.appendChild(thead);
    //             let tbody = document.createElement('tbody');
    //               for (let i = 0; i < tableData.data.length ; i++) {
    //               let tr = document.createElement('tr');
    //               for (let j = 0; j < rows; j++) {
    //                   let td = document.createElement('td');
    //                   td.setAttribute("class",  "col"+uniqueID+j);
    //                   let div = document.createElement('div');
    //                   const textValue =  eval('tableData.data['+i+'].'+objectName[j]); 
    //                   div.textContent = textValue;
    //                   td.appendChild(div);
    //                   tr.appendChild(td);
    //               } 
    //               tbody.appendChild(tr);  
    //               }   
        
    //               table.appendChild(tbody);  
    //               let tfoot = document.createElement('tfoot');  
    //               let tfoottr = document.createElement('tr');  
    //               if(footer==='true'){ 
    //               if(tableData.footer === undefined || tableData.footer === null){
    //                 alert("Footer data not found in json file");
    //                 return false;
    //               }
    //               const objectName2 = Object.keys(tableData.footer); 
    //                 for (let k = 0; k < rows; k++) {
    //                   let th = document.createElement('th'); 
    //                   th.setAttribute("class", "col"+uniqueID+k);
    //                   let div1 = document.createElement('div');
    //                   div1.textContent = eval('tableData.footer.'+objectName2[k]);
    //                   th.appendChild(div1);
    //                   tfoottr.appendChild(th);
    //               } 
    //               tfoot.appendChild(tfoottr);
    //                 table.appendChild(tfoot);
    //               }    
    //               divElement.appendChild(table);  
    //               if(search==='' || search===undefined || search === null ){
    //                 search = false;
    //               } 
    //               if(pagination==='' || pagination === undefined || pagination === null ){
    //                 pagination = false;
    //               }     
    //               var scrollXValue = false;  
    //               const newValue = window.innerWidth <= 768;
    //               if (newValue) {
    //                 scrollXValue = true; 
    //               } else {
    //                 scrollXValue = false; 
    //               } 
    //               pagelengthF = pagelengthF*1;  
    //               $(document).ready(function() {
    //                 $('#table'+uniqueID).DataTable({
    //                   dom: 'Bfrtip',   
    //                   paging : pagination,
    //                   "pageLength": pagelengthF,
    //                   "info": pagination,
    //                   "lengthChange": true,
    //                   "scrollX": scrollXValue,  
    //                   searching: search,  
    //                   buttons: downloadBtn,  
    //                 });
    //               }); 
    //         }  
    //         }, 1000);  
    //       }
    //       if(str === undefined){ 
    //         tableData = []; 
    //         if(JsonPath1 !=='' && JsonPath1 !==null && JsonPath1 !==undefined && JsonPath1 !==' ' ){
    //           alert("JSON path not found");
    //           return false;
    //         }  
    //         const divElement = document.getElementById(ctx);
    //         const pElement = document.createElement('p');
    //         pElement.textContent =  'Table';
    //         divElement.appendChild(pElement);
    //       }   
    //     };  
    //     if (!window.Highcharts) {  
    //       const scr = document.createElement("script");
    //       scr.src = "{[ custom_line_chartsrc ]}";
    //       scr.onload = init;
    //       document.head.appendChild(scr);
    //     } else {
    //       init(); 
    //     }`,
    //     }),
  
    //     init() {     
    //       const events = all_Traits
    //       .filter((i) => ["strings"].indexOf(i.name) < 0)
    //       .map((i) => `change:${i.name}`)
    //       .join(" ");
    //         this.on(events, () => {
    //         const common_json2 = JSON.parse(localStorage.getItem("common_json"));  
    //             if(common_json2 !==null){
    //               jsonData.length= 0;  
    //               jsonData = [];
    //               jsonData.push(common_json2);  
    //             } 
    //           this.trigger("change:script")
    //         });
    //     }, 
    //   },
    // }); 



    editor.Components.addType("custom_table", {
        model: {
          defaults: props_test_table({
            ...test_chart_Props,
            tagName: "div",
            resizable: 1,
            droppable: 0,
            attributes: { 'data-i_designer-type': 'custom_table' },
            custom_line_chartsrc: "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.5.1/jquery.min.js",
            stylable: 1,
            traits: [id_Trait, title_Trait, ...all_Traits],
            style: {
              padding: "10px 0px",
            },
            script: function () {  
  if (this.tableInitialized) return;
  this.tableInitialized = true;
  
  // Store active filters for this table instance
  const activeFilters = {};
  
  const init1 = () => {
    const ctx = this.id;
    const divElement = document.getElementById(ctx);
    let JsonPath1 = "{[ jsonpath ]}";
    let custom_language = localStorage.getItem('language') || 'english';
    const jsonDataN = JSON.parse(localStorage.getItem("common_json"));
    const str = jsonDataN[custom_language][JsonPath1];
    const tableData = eval(str);
    const objectKeys = Object.keys(tableData.heading);
    const table = document.createElement('table');
    table.setAttribute('width', '100%');
    table.setAttribute('class', 'table table-bordered');
    table.setAttribute('id', 'table' + ctx);

    // Clear previous content
    divElement.innerHTML = "";

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    objectKeys.forEach((key, i) => {
        const th = document.createElement('th');
        th.setAttribute("class", "col" + ctx + i);

        const labelDiv = document.createElement('div');
        labelDiv.textContent = tableData.heading[key];
        labelDiv.style.display = "inline-block";
        labelDiv.style.marginRight = "78%";

        const searchIcon = document.createElement('span');
        searchIcon.innerHTML = "🔍";
        searchIcon.style.cursor = "pointer";
        searchIcon.addEventListener("click", () => openSearchModal(key, tableData.heading[key]));

        th.appendChild(labelDiv);
        th.appendChild(searchIcon);
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Body (initially hidden)
    const tbody = document.createElement('tbody');
    tbody.style.display = "none";
    tbody.setAttribute("id", "tbody" + ctx);
    tableData.data.forEach((row, rowIndex) => {
        const tr = document.createElement('tr');
        objectKeys.forEach((key, j) => {
        const td = document.createElement('td');
        td.setAttribute("class", "col" + ctx + j);
        td.innerText = row[key];
        tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    divElement.appendChild(table);

    // Add popup modal
    const modal = document.createElement('div');
    modal.setAttribute("id", "modal" + ctx);
    modal.style.display = "none";
    modal.style.position = "fixed";
    modal.style.top = "50%";
    modal.style.left = "50%";
    modal.style.transform = "translate(-50%, -50%)";
    modal.style.background = "#fff";
    modal.style.padding = "20px 30px";
    modal.style.border = "1px solid #ccc";
    modal.style.borderRadius = "10px";
    modal.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
    modal.style.zIndex = "9999";
    modal.style.minWidth = "300px";
    modal.style.fontFamily = "Arial, sans-serif";
    modal.style.position = "fixed";

    modal.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
        <h4 style="margin: 0;">Report Parameter</h4>
        <span id="closeModalBtn" style="cursor: pointer; font-size: 18px; font-weight: bold;">&times;</span>
    </div>
    <div id="activeFiltersContainer" style="margin-bottom: 15px;"></div>
    <label id="modalColLabel" style="font-weight: bold;"></label><br/>
    <input type="text" id="modalInput" style="margin-top: 10px; width: 100%; padding: 6px; border-radius: 5px; border: 1px solid #ccc;"/><br/><br/>
    <div style="text-align: right;">
        <button id="applyBtn" style="padding: 6px 12px; margin-right: 28%; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Preview</button>
        <button id="resetBtn" style="padding: 6px 12px; background-color: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Show All</button>
    </div>
    `;

    document.body.appendChild(modal);

    function updateActiveFiltersDisplay() {
        const container = document.getElementById("activeFiltersContainer");
        container.innerHTML = "";
        
        if (Object.keys(activeFilters).length > 0) {
            const filtersDiv = document.createElement('div');
            filtersDiv.style.border = "1px solid #ddd";
            filtersDiv.style.borderRadius = "5px";
            filtersDiv.style.padding = "10px";
            filtersDiv.style.backgroundColor = "#f8f9fa";
            filtersDiv.style.marginBottom = "10px";
            
            const title = document.createElement('div');
            title.textContent = "Active Filters:";
            title.style.fontWeight = "bold";
            title.style.marginBottom = "8px";
            filtersDiv.appendChild(title);
            
            Object.keys(activeFilters).forEach(colKey => {
                const filterDiv = document.createElement('div');
                filterDiv.style.display = "flex";
                filterDiv.style.justifyContent = "space-between";
                filterDiv.style.alignItems = "center";
                filterDiv.style.marginBottom = "5px";
                filterDiv.style.padding = "3px 8px";
                filterDiv.style.backgroundColor = "#e9ecef";
                filterDiv.style.borderRadius = "3px";
                
                const filterText = document.createElement('span');
                filterText.textContent = `${tableData.heading[colKey]}: ${activeFilters[colKey]}`;
                filterText.style.fontSize = "12px";
                
                const deleteBtn = document.createElement('span');
                deleteBtn.innerHTML = "×";
                deleteBtn.style.cursor = "pointer";
                deleteBtn.style.color = "#dc3545";
                deleteBtn.style.fontWeight = "bold";
                deleteBtn.style.marginLeft = "10px";
                deleteBtn.addEventListener("click", () => {
                    delete activeFilters[colKey];
                    applyAllFilters();
                    updateActiveFiltersDisplay();
                });
                
                filterDiv.appendChild(filterText);
                filterDiv.appendChild(deleteBtn);
                filtersDiv.appendChild(filterDiv);
            });
            
            container.appendChild(filtersDiv);
        }
    }

    function applyAllFilters() {
        const tbody = document.getElementById("tbody" + ctx);
        tbody.style.display = "";
        
        Array.from(tbody.rows).forEach(row => {
            let shouldShow = true;
            
            // Check all active filters
            Object.keys(activeFilters).forEach(colKey => {
                const colIndex = objectKeys.indexOf(colKey);
                const cellVal = row.cells[colIndex].textContent.toLowerCase();
                const filterVal = activeFilters[colKey].toLowerCase();
                
                if (!cellVal.includes(filterVal)) {
                    shouldShow = false;
                }
            });
            
            row.style.display = shouldShow ? "" : "none";
        });
    }

    function openSearchModal(colKey, colLabel) {
        modal.style.display = "block";
        modal.setAttribute("data-colkey", colKey);
        document.getElementById("modalColLabel").textContent = colLabel;
        
        // Pre-fill with existing filter value if any
        const existingFilter = activeFilters[colKey] || "";
        document.getElementById("modalInput").value = existingFilter;
        
        updateActiveFiltersDisplay();
    }
    
    document.getElementById("closeModalBtn").onclick = () => {
        modal.style.display = "none";
    };

    document.getElementById("applyBtn").onclick = () => {
        const colKey = modal.getAttribute("data-colkey");
        const filterVal = document.getElementById("modalInput").value.trim();
        
        if (filterVal) {
            activeFilters[colKey] = filterVal;
        } else {
            delete activeFilters[colKey];
        }
        
        applyAllFilters();
        modal.style.display = "none";
    };

    document.getElementById("resetBtn").onclick = () => {
        // Clear all filters
        Object.keys(activeFilters).forEach(key => delete activeFilters[key]);
        
        const tbody = document.getElementById("tbody" + ctx);
        tbody.style.display = "";
        Array.from(tbody.rows).forEach(row => row.style.display = "");
        modal.style.display = "none";
    };
  };

  if (!window.Highcharts) {
    const scr = document.createElement("script");
    scr.src = "{[ custom_line_chartsrc ]}";
    scr.onload = init1;
    document.head.appendChild(scr);
  } else {
    init1();
  }
  
  this.on('removed', function () {
    this.tableInitialized = false;
  });
},
          }),
          init() {
            const events = all_Traits
              .filter((i) => ["strings"].indexOf(i.name) < 0)
              .map((i) => `change:${i.name}`)
              .join(" ");
                this.on(events, () => {
                this.tableInitialized = false;  
                this.trigger("change:script");
                });
          },
        },
    });  


    
  
    editor.Blocks.add("custom_table", {
      label: "JSON Table",
      category: "Extra",
      attributes: {
        class: "fa fa-table",
      },
      content: {
        type: "custom_table",
      },
    });  
  } 
  
   customTable2(editor); 

  // =============================
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



//   var el = document.getElementById("import-single-file");
//   el.addEventListener("click", importFile, true);  
//   console.log(el,'=======');

 
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
      if(custom_language === null){
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
      if(jsonData1 !==null){
        jsonData.length= 0;  
        jsonData = [];
        jsonData.push(jsonData1);  
      }   
      // Update custom_line_chart components 
    //   editor.getWrapper().find('[data-i_designer-type="custom_line_chart"]').forEach(chart => { 
    //     console.log('custom_line_chart');
    //    chart.trigger('change:script'); 
    //   });   
    // editor.getWrapper().find('[data-i_designer-type="custom_table"]').forEach(table => { 
    //     console.log('custom_table');
    //   table.trigger('change:script');
    // });
    editor.getWrapper().find('[data-i_designer-type="custom_line_chart"]').forEach(chart => {
        chart.highchartsInitialized = false;
        chart.trigger('change:script');
    });

    editor.getWrapper().find('[data-i_designer-type="custom_table"]').forEach(table => {
        table.tableInitialized = false;
        table.trigger('change:script');
    });
  } 


}