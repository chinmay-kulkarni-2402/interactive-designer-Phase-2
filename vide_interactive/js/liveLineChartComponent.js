function addLiveLineChartComponent(editor) {
  const domc = editor.DomComponents;
  const blockManager = editor.BlockManager;

  blockManager.add('live-areaspline-chart', {
    label: '📊 Live AreaSpline',
    category: 'Charts',
    attributes: { class: 'fa fa-area-chart' },
    content: { type: 'live-areaspline-chart' }
  });

  domc.addType('live-areaspline-chart', {
    model: {
      defaults: {
        tagName: 'div',
        draggable: true,
        droppable: false,
        traits: [
          {
            type: 'text',
            name: 'csvURL',
            label: 'CSV URL',
            default: 'https://demo-live-data.highcharts.com/time-data.csv'
          },
          {
            type: 'checkbox',
            name: 'enablePolling',
            label: 'Enable Polling',
            valueTrue: 'true',
            valueFalse: 'false',
            default: 'true'
          },
          {
            type: 'number',
            name: 'pollingInterval',
            label: 'Polling Interval (s)',
            default: 1,
            min: 1
          }
        ],
        style: {
          width: '100%',
          height: '400px',
          border: '1px solid #ccc',
          padding: '5px',
          position: 'relative'
        },
        components: `<div class="highchart-live-areaspline" style="width:100%;height:100%;"></div>`,
        script: function () {
          const container = this.querySelector('.highchart-live-areaspline');

          if (!window.Highcharts) {
            container.innerHTML = '<div style="color:red;">Highcharts not loaded.</div>';
            return;
          }

          const pollingEnabled = this.getAttribute('enablepolling') === 'true';
          let pollingInterval = parseInt(this.getAttribute('pollinginterval'), 10);
          if (isNaN(pollingInterval) || pollingInterval < 1) pollingInterval = 1;

          Highcharts.chart(container, {
            chart: {
              type: 'areaspline',
              animation: Highcharts.svg,
              marginRight: 10,
              events: {
                load: function () {
                  const series = this.series[0];
                  if (pollingEnabled) {
                    setInterval(function () {
                      const x = (new Date()).getTime(); 
                      const y = Math.random(); 
                      series.addPoint([x, y], true, true);
                    }, pollingInterval * 1000);
                  }
                }
              }
            },
            title: { text: 'Live Random Data' },
            xAxis: { type: 'datetime' },
            yAxis: {
              title: { text: 'Value' },
              plotLines: [{ value: 0, width: 1, color: '#808080' }]
            },
            tooltip: {
              formatter: function () {
                return '<b>' + this.series.name + '</b><br/>' +
                  Highcharts.dateFormat('%Y-%m-%d %H:%M:%S', this.x) + '<br/>' +
                  Highcharts.numberFormat(this.y, 2);
              }
            },
            legend: { enabled: false },
            exporting: { enabled: false },
            series: [{
              name: 'Random data',
              data: (function () {
                const data = [];
                const time = (new Date()).getTime();
                for (let i = -9; i <= 0; i++) {
                  data.push({ x: time + i * 1000, y: Math.random() });
                }
                return data;
              })()
            }]
          });
        }
      },

      init() {
        this.on('change:attributes', () => {
          const view = this.view;
          if (view && typeof view.render === 'function') view.render();
        });
      }
    },

    view: {
      onRender() {
        const script = this.model.get('script');
        if (script && typeof script === 'function') {
          const el = this.el;
          setTimeout(() => {
            script.bind(el).call();
          }, 100);
        }
      }
    }
  });
}
