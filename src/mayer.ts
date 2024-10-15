import Chart from 'chart.js/auto'
import { Utils } from './utils'
import annotationPlugin from 'chartjs-plugin-annotation'
import btc_historical from '../data/btc_prices_until_2023.json'
import btc_newest from '../data/btc_newest.json'
import colors from 'tailwindcss/colors'

Chart.register(annotationPlugin)
Chart.defaults.color = colors.slate[400]
;(async () => {
  const chartElement = document.getElementById('mayer')
  if (chartElement == null) {
    return
  }
  const btc_data = [...btc_historical, ...btc_newest]

  // Set date.
  Utils.setElementText('date', btc_data[btc_data.length - 1].date ?? 'unknown')

  const dma200 = Utils.calculateMovingAverage(btc_data, 200)
  const mayer_multiple = dma200.map((val, index) => {
    if (btc_data[index].value === undefined || val.value === undefined) {
      return {
        date: val.date,
        value: undefined,
      }
    }
    return {
      date: val.date,
      value: btc_data[index].value / val.value,
    }
  })
  const mayer_band_1 = dma200.map((val) => {
    return {
      date: val.date,
      value: val.value === undefined ? undefined : 0.5 * val.value,
    }
  })
  const mayer_band_2 = dma200
  const mayer_band_3 = dma200.map((val) => {
    return {
      date: val.date,
      value: val.value === undefined ? undefined : 2.0 * val.value,
    }
  })
  const mayer_band_4 = dma200.map((val) => {
    return {
      date: val.date,
      value: val.value === undefined ? undefined : 4.0 * val.value,
    }
  })

  new Chart(chartElement as HTMLCanvasElement, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'USD/BTC',
          data: btc_data,
          borderWidth: 1,
        },
        {
          label: 'Oversold',
          data: mayer_band_1,
          fill: 'origin',
        },
        {
          label: 'Bearish',
          data: mayer_band_2,
          fill: '-1',
        },
        {
          label: 'Bullish',
          data: mayer_band_3,
          fill: '-1',
        },
        {
          label: 'Overbought',
          data: mayer_band_4,
          fill: '-1',
        },
        {
          label: 'Mayer Multiple',
          data: mayer_multiple,
          yAxisID: 'y1',
        },
      ],
    },
    options: {
      normalized: true,
      animation: false,
      // Don't draw dots per data point.
      datasets: {
        line: {
          pointRadius: 0,
          borderWidth: 2,
        },
      },
      // Hovering anywhere should hover the nearest x-value independent of y-value.
      hover: {
        mode: 'index',
        intersect: false,
      },
      parsing: {
        xAxisKey: 'date',
        yAxisKey: 'value',
      },
      scales: {
        y: {
          type: 'logarithmic',
          display: true,
          position: 'left',
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          min: 0,
          max: 15,
          grid: {
            drawOnChartArea: false,
          },
        },
      },
      plugins: {
        // Show tooltip for nearest x-value for all grpahs independent of y-value of mouse.
        tooltip: {
          mode: 'index',
          intersect: false,
        },
      },
    },
  })

  // Set current info.
  Utils.setElementText('mayer-multiple-info', () => {
    const lastEntry = mayer_multiple[mayer_multiple.length - 1]
    if (lastEntry.value !== undefined) {
      let text = `Mayer Multiple ${Utils.toTwoDecimals(lastEntry.value)} (`
      if (lastEntry.value < 0.5) {
        text += 'Oversold'
      } else if (lastEntry.value < 1.0) {
        text += 'Bearish'
      } else if (lastEntry.value < 2.0) {
        text += 'Bullish'
      } else {
        text += 'Overbought'
      }
      return `${text})`
    }
    return ''
  })
})()
