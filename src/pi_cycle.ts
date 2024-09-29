import Chart from 'chart.js/auto'
import annotationPlugin from 'chartjs-plugin-annotation'
import btc_historical from '../data/btc_prices_until_2023.json'
import btc_newest from '../data/btc_newest.json'
import colors from 'tailwindcss/colors'
import zoomPlugin from 'chartjs-plugin-zoom'

Chart.register(zoomPlugin)
Chart.register(annotationPlugin)
Chart.defaults.color = colors.slate[400]

export interface DateData {
  date: string
  value?: number
}
;(async () => {
  const chartElement = document.getElementById('pi_cycle')
  if (chartElement == null) {
    return
  }

  // TODO: Just sort the initial files correctly.
  btc_historical.reverse()
  btc_newest.reverse()
  const btc_data = [...btc_historical, ...btc_newest]

  const calculateMovingAverage = (
    data: DateData[],
    window: number,
    factor = 1,
  ): DateData[] => {
    // Clone the input dates but set the price to undefined.
    const out: DateData[] = Object.values(structuredClone(data)).map(
      (entry) => {
        return { date: entry.date, price: undefined }
      },
    )
    if (data.length < window || window <= 0) {
      return out
    }
    let sum = 0
    for (let i = 0; i < window; i++) {
      sum += data[i].value ?? 0
    }
    out[window - 1].value = (sum / window) * factor
    for (let i = window; i < data.length; i++) {
      sum += (data[i].value ?? 0) - (data[i - window].value ?? 0)
      out[i].value = (sum / window) * factor
    }
    return out
  }

  const dma350x2 = calculateMovingAverage(btc_data, 350, 2)
  const dma111 = calculateMovingAverage(btc_data, 111)
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

  new Chart(chartElement as HTMLCanvasElement, {
    type: 'line',
    data: {
      labels: btc_data.map((row) => row.date),
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
        zoom: {
          limits: {
            y1: { min: 'original', max: 'original', minRange: 4 },
          },
          zoom: {
            wheel: {
              enabled: false,
            },
            pinch: {
              enabled: false,
            },
            mode: 'xy',
          },
        },
      },
    },
  })
})()
