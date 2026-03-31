import 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm'

import Chart from 'chart.js/auto'
import annotationPlugin from 'chartjs-plugin-annotation'
import btc_newest from '../data/btc_newest.json'
import btc_historical from '../data/btc_prices_to_2025.json'
import { Utils } from './utils'

Chart.register(annotationPlugin)

const styles = getComputedStyle(document.documentElement)
Chart.defaults.color = styles.getPropertyValue('--color-slate-400')
;(async () => {
  const chartElement = document.getElementById('mayer')
  if (chartElement == null) {
    return
  }
  const btc_data = Utils.parseData([...btc_historical, ...btc_newest])

  // Set date.
  Utils.setElementText(
    'date',
    new Date(btc_data[btc_data.length - 1].x).toISOString().slice(0, 10),
  )

  const dma200 = Utils.calculateMovingAverage(btc_data, 200)
  const offset = btc_data.length - dma200.length
  const mayer_multiple = dma200.map((val, i) => ({
    x: val.x,
    y: btc_data[i + offset].y / val.y,
  }))
  const mayer_band_1 = dma200.map((val) => ({ x: val.x, y: 0.5 * val.y }))
  const mayer_band_2 = dma200
  const mayer_band_3 = dma200.map((val) => ({ x: val.x, y: 2.0 * val.y }))
  const mayer_band_4 = dma200.map((val) => ({ x: val.x, y: 4.0 * val.y }))

  const chart = new Chart(chartElement as HTMLCanvasElement, {
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
      parsing: false,
      scales: {
        x: {
          type: 'time',
          time: {
            tooltipFormat: 'YYYY-MM-DD',
          },
        },
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
        decimation: {
          enabled: true,
          algorithm: 'lttb',
        },
        // Show tooltip for nearest x-value for all graphs independent of y-value of mouse.
        tooltip: {
          mode: 'index',
          intersect: false,
        },
      },
    },
  }) as unknown as Chart

  // React to button clicks.
  document
    ?.getElementById('mayer-90d')
    ?.addEventListener('click', () =>
      Utils.updateChartRange(chart, btc_data, '90d'),
    )
  document
    ?.getElementById('mayer-1y')
    ?.addEventListener('click', () =>
      Utils.updateChartRange(chart, btc_data, '1y'),
    )
  document
    ?.getElementById('mayer-5y')
    ?.addEventListener('click', () =>
      Utils.updateChartRange(chart, btc_data, '5y'),
    )
  document
    ?.getElementById('mayer-all')
    ?.addEventListener('click', () =>
      Utils.updateChartRange(chart, btc_data, 'all'),
    )

  // Set current info.
  Utils.setElementText('mayer-multiple-info', () => {
    const lastEntry = mayer_multiple[mayer_multiple.length - 1]
    let text = `Mayer Multiple ${Utils.toTwoDecimals(lastEntry.y)} (`
    if (lastEntry.y < 0.5) {
      text += 'Oversold'
    } else if (lastEntry.y < 1.0) {
      text += 'Bearish'
    } else if (lastEntry.y < 2.0) {
      text += 'Bullish'
    } else {
      text += 'Overbought'
    }
    return `${text})`
  })
})()
