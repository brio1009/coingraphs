import Chart from 'chart.js/auto'
import zoomPlugin from 'chartjs-plugin-zoom'
Chart.register(zoomPlugin)

import btc_data from '../data/btc_prices_until_2023.json'


(async function() {
  btc_data.reverse()
  new Chart(
    document.getElementById('pi_cycle'),
    {
      type: 'line',
      data: {
        labels: btc_data.map(row => row.date),
        datasets: [
          {
            label: 'btc price',
            data: btc_data,
            pointRadius: 0
          }
        ]
      },
      options: {
        // Don't draw dots per data point.
        datasets: {
            line: {
                pointRadius: 0
            }
        },
        parsing: {
          xAxisKey: 'date',
          yAxisKey: 'price'
        },
        scales: {
          y: {
            type: 'logarithmic',
          }
        },
        plugins: {
          zoom: {
            zoom: {
            wheel: {
              enabled: true,
            },
            pinch: {
              enabled: true
            },
            mode: 'xy',
          }
        }
      }
    }}
  );
})();
 