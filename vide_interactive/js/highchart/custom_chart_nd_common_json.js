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
          { value: 'drilldown_bar', label: 'Donut chart' },
          { value: 'drilldown_bar', label: 'Scatter chart' },
          { value: 'drilldown_bar', label: 'Area chart' },
          { value: 'drilldown_bar', label: 'Bubble chart' },
          { value: 'drilldown_bar', label: 'Spiderweb chart' },
          { value: 'drilldown_bar', label: 'CandleStick chart' },
          { value: 'drilldown_bar', label: 'OHLC chart' },
          { value: 'drilldown_bar', label: 'Dual axis line and column chart' },
          { value: 'drilldown_bar', label: '3D Donut chart' },
          { value: 'drilldown_bar', label: '3D pie chart' },
          { value: 'drilldown_bar', label: '3D Column chart' },
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
  let common_json = null;
  try {
    common_json = JSON.parse(localStorage.getItem("common_json") || 'null');
  } catch(e) {
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
          minHeight: "400px",
          width: "100%",
        },
        script: function () { 
          // Enhanced initialization for export compatibility
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

            // Fallback data handling for export scenarios
            let language = 'english';
            let project_type = 'developmentJsonType';
            let str = null;
            let seriesData = {};

            try {
              if (typeof localStorage !== 'undefined') {
                language = localStorage.getItem('language') || 'english';
                const common_json_data = JSON.parse(localStorage.getItem('common_json') || 'null');
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

            // Chart type configurations with fallback data
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
                        animation: false, // Disable animation for export
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
                            dataLabels: {
                                enabled: false
                            },
                            colors: null,
                            showInLegend: true,
                            animation: false // Disable animation for export
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
                        animation: false
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
                        }
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
                        animation: false
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
                        }
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
                        animation: false
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
                        }
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
                        animation: false
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
                        }
                    },
                    series: seriesData.series
                };
            }

            // Drilldown charts (simplified for export)
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
                            animation: false
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
                            colors: null,
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
                                    verticalAlign: "bottom"
                                }
                            }
                        }]
                    },
                    credits: { enabled: false },
                };
            }

            // Create chart with error handling
            try {
              if (window.Highcharts) {
                // Destroy existing chart if any
                const existingChart = window.Highcharts.charts.find(chart => 
                  chart && chart.container && chart.container.id === ctx
                );
                if (existingChart) {
                  existingChart.destroy();
                }
                
                // Create new chart
                const chart = window.Highcharts.chart(ctx, seriesData2);
                
                // Store chart reference for cleanup
                element.chartInstance = chart;
                
                // Ensure chart is rendered for export
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

          // Enhanced script loading with better export support
          const loadHighcharts = () => {
            return new Promise((resolve, reject) => {
              if (window.Highcharts) {
                resolve();
                return;
              }

              const script = document.createElement("script");
              script.src = "{[ custom_line_chartsrc ]}";
              script.onload = () => {
                // Load drilldown module if needed
                const drilldownScript = document.createElement("script");
                drilldownScript.src = "https://code.highcharts.com/11.4.8/modules/drilldown.js";
                drilldownScript.onload = resolve;
                drilldownScript.onerror = resolve; // Continue even if drilldown fails
                document.head.appendChild(drilldownScript);
              };
              script.onerror = reject;
              document.head.appendChild(script);
            });
          };

          // Initialize with proper timing
          const init = async () => {
            try {
              await loadHighcharts();
              // Wait for DOM to be ready
              if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', initializeChart);
              } else {
                // Add small delay for export scenarios
                setTimeout(initializeChart, 50);
              }
            } catch (error) {
              console.error('Failed to load Highcharts:', error);
            }
          };

          // Prevent multiple initializations
          if (!this.highchartsInitialized) {
            this.highchartsInitialized = true;
            init();
          }

          // Cleanup on removal
          this.on('removed', () => {
            const element = document.getElementById(this.id);
            if (element && element.chartInstance) {
              element.chartInstance.destroy();
              element.chartInstance = null;
            }
            this.highchartsInitialized = false;
          });

          // Re-initialize on print/export events
          if (typeof window !== 'undefined') {
            window.addEventListener('beforeprint', () => {
              setTimeout(initializeChart, 100);
            });
            
            window.addEventListener('afterprint', () => {
              setTimeout(initializeChart, 100);
            });
          }
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
      
      // Support both 'text' and 'formatted-rich-text' components
      if (componentType === 'text' || componentType === 'formatted-rich-text') {
        const content = selectedComponent?.get('content');
        if (content !== undefined) {
          try {
            const commonJson = JSON.parse(localStorage.getItem("common_json"));
            const jsonPath = `commonJson.${custom_language}.${event.value}`;
            const value = eval(jsonPath);
            if (value !== undefined && value !== null) {
              if (componentType === 'formatted-rich-text') {
                // For formatted-rich-text, update both raw-content and trigger update
                selectedComponent.set('raw-content', String(value), { silent: true });
                selectedComponent.set('my-input-json', event.value, { silent: true });
                selectedComponent.updateContent();
              } else {
                // For regular text components
                const componentView = selectedComponent.view;
                if (componentView) {
                  componentView.el.innerHTML = value;
                }
              }
              // Re-render traits to show updated values
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

    editor.getWrapper().find('[data-i_designer-type="custom_line_chart"]').forEach(chart => {
        chart.highchartsInitialized = false;
        chart.trigger('change:script');
    });

  } 
}