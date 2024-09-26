import Chart from 'chart.js/auto'
import zoomPlugin from 'chartjs-plugin-zoom'
Chart.register(zoomPlugin)

import btc_data from '../data/btc_prices_until_2023.json'

export interface PriceData {
  date: string
  price?: number
}

(async function() {
  const chartElement = document.getElementById('pi_cycle')
  if (chartElement == null) {
    return
  }

  btc_data.reverse()

  const calculateMovingAverage = (data: PriceData[], window: number): PriceData[] => {
    // Clone the input dates but set the price to undefined.
    const out: PriceData[] = Object.values(data)
      .map(entry => { return { date: entry.date, price: undefined } });
    if (data.length < window || window <= 0) {
        return out;
    }
    let sum = 0;
    for (let i = 0; i < window; i++) {
        sum += data[i].price ?? 0;
    }
    out[window - 1].price = sum / window
    for (let i = window; i < data.length; i++) {
        sum += data[i].price ?? 0 - (data[i - window].price ?? 0);
        out[i].price = sum / window
    }
    return out;
  };

  const mva_350 = calculateMovingAverage(btc_data, 350)
  const mva_111 = calculateMovingAverage(btc_data, 111)
  console.log(mva_350)


  new Chart(chartElement as HTMLCanvasElement,
    {
      type: 'line',
      data: {
        labels: btc_data.map(row => row.date),
        datasets: [
          {
            label: 'btc price',
            data: btc_data
          },
          {
            label: '350 mva',
            data: mva_350
          },
          {
            label: '111 mva',
            data: mva_111
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
 