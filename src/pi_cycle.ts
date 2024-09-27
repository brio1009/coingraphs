import Chart from 'chart.js/auto'
import zoomPlugin from 'chartjs-plugin-zoom'
Chart.register(zoomPlugin)

import btc_data from '../data/btc_prices_until_2023.json'

export interface PriceData {
  date: string
  price?: number
}

;(async () => {
  const chartElement = document.getElementById('pi_cycle')
  if (chartElement == null) {
    return
  }

  btc_data.reverse() // Just sort the initial file correctly.

  const calculateMovingAverage = (
    data: PriceData[],
    window: number,
    factor = 1,
  ): PriceData[] => {
    // Clone the input dates but set the price to undefined.
    const out: PriceData[] = Object.values(structuredClone(data)).map(
      (entry) => {
        return { date: entry.date, price: undefined }
      },
    )
    if (data.length < window || window <= 0) {
      return out
    }
    let sum = 0
    for (let i = 0; i < window; i++) {
      sum += data[i].price ?? 0
    }
    out[window - 1].price = (sum / window) * factor
    for (let i = window; i < data.length; i++) {
      sum += (data[i].price ?? 0) - (data[i - window].price ?? 0)
      out[i].price = (sum / window) * factor
    }
    return out
  }

  const mva_350 = calculateMovingAverage(btc_data, 350, 2)
  const mva_111 = calculateMovingAverage(btc_data, 111)

  new Chart(chartElement as HTMLCanvasElement, {
    type: 'line',
    data: {
      labels: btc_data.map((row) => row.date),
      datasets: [
        {
          label: 'btc price',
          data: btc_data,
          borderWidth: 1,
        },
        {
          label: '350 mva x 2',
          data: mva_350,
        },
        {
          label: '111 mva',
          data: mva_111,
        },
      ],
    },
    options: {
      // Don't draw dots per data point.
      datasets: {
        line: {
          pointRadius: 0,
          borderWidth: 2,
        },
      },
      parsing: {
        xAxisKey: 'date',
        yAxisKey: 'price',
      },
      scales: {
        y: {
          type: 'logarithmic',
        },
      },
      plugins: {
        zoom: {
          zoom: {
            wheel: {
              enabled: true,
            },
            pinch: {
              enabled: true,
            },
            mode: 'xy',
          },
        },
      },
    },
  })
})()
