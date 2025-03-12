import 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm'

import Chart from 'chart.js/auto'
import annotationPlugin from 'chartjs-plugin-annotation'
import btc_newest from '../data/btc_newest.json'
import btc_historical from '../data/btc_prices_until_2024.json'
import { Utils } from './utils'

Chart.register(annotationPlugin)

const styles = getComputedStyle(document.documentElement)
Chart.defaults.color = styles.getPropertyValue('--color-slate-400')
;(async () => {
  const chartElement = document.getElementById('pi_cycle')
  if (chartElement == null) {
    return
  }
  const btc_data = [...btc_historical, ...btc_newest]

  const dma350x2 = Utils.calculateMovingAverage(btc_data, 350, 2)
  const dma111 = Utils.calculateMovingAverage(btc_data, 111)
  const indicator = dma350x2.map((mva_350, index) => {
    if (dma111[index].value === undefined || mva_350.value === undefined) {
      return {
        date: mva_350.date,
        value: undefined,
      }
    }
    return {
      date: mva_350.date,
      value: dma111[index].value / mva_350.value,
    }
  })

  Utils.setElementText('pi-cycle-info', () => {
    const val = indicator[indicator.length - 1].value
    if (val === undefined) {
      return 'unknown'
    }
    return `Indicator: ${Utils.toTwoDecimals(val)}`
  })

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
          label: '350DMAx2',
          data: dma350x2,
        },
        {
          label: '111DMA',
          data: dma111,
        },
        {
          label: 'Indicator',
          data: indicator,
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
        x: {
          type: 'time',
          time: {
            parser: 'YYYY-MM-DD',
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
          max: 4,
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
        annotation: {
          annotations: {
            lowerBox: {
              drawTime: 'beforeDatasetsDraw',
              type: 'box',
              xMin: btc_data[0].date,
              xMax: btc_data[btc_data.length - 1].date,
              yMin: 0,
              yMax: 0.35,
              yScaleID: 'y1',
              backgroundColor: 'rgba(255, 0, 0, 0.15)',
              borderWidth: 0,
            },
            upperBox: {
              drawTime: 'beforeDatasetsDraw',
              type: 'box',
              xMin: btc_data[0].date,
              xMax: btc_data[btc_data.length - 1].date,
              yMin: 0.95,
              yMax: 1.5,
              yScaleID: 'y1',
              backgroundColor: 'rgba(0, 255, 0, 0.15)',
              borderWidth: 0,
            },
          },
        },
      },
    },
  }) as unknown as Chart

  // React to button clicks.
  document
    ?.getElementById('pi-cycle-90d')
    ?.addEventListener('click', () =>
      Utils.updateChartRange(chart, btc_data, '90d'),
    )
  document
    ?.getElementById('pi-cycle-1y')
    ?.addEventListener('click', () =>
      Utils.updateChartRange(chart, btc_data, '1y'),
    )
  document
    ?.getElementById('pi-cycle-5y')
    ?.addEventListener('click', () =>
      Utils.updateChartRange(chart, btc_data, '5y'),
    )
  document
    ?.getElementById('pi-cycle-all')
    ?.addEventListener('click', () =>
      Utils.updateChartRange(chart, btc_data, 'all'),
    )
})()
