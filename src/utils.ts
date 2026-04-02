import 'chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm'

import type { ChartDataset } from 'chart.js'
import Chart from 'chart.js/auto'
import type { AnnotationPluginOptions } from 'chartjs-plugin-annotation'
import annotationPlugin from 'chartjs-plugin-annotation'

Chart.register(annotationPlugin)

const styles = getComputedStyle(document.documentElement)
Chart.defaults.color = styles.getPropertyValue('--color-slate-400')

export interface XYData {
  x: number
  y: number
}

export interface ChartConfig {
  elementId: string
  buttonPrefix: string
  btcData: XYData[]
  datasets: ChartDataset<'line', XYData[]>[]
  y1: { max: number; title: string }
  annotations?: AnnotationPluginOptions['annotations']
}

export namespace Utils {
  export const parseData = (
    arr: { date: string; value?: number }[],
  ): XYData[] =>
    arr.map((d) => ({ x: new Date(d.date).getTime(), y: d.value ?? 0 }))

  export const calculateMovingAverage = (
    data: XYData[],
    window: number,
    factor = 1,
  ): XYData[] => {
    if (data.length < window || window <= 0) {
      return []
    }
    let sum = 0
    for (let i = 0; i < window; i++) {
      sum += data[i].y
    }
    const length = data.length - window + 1
    const out = new Array<XYData>(length)
    out[0] = { x: data[window - 1].x, y: (sum / window) * factor }
    for (let i = 1; i < length; i++) {
      sum += data[i + window - 1].y - data[i - 1].y
      out[i] = { x: data[i + window - 1].x, y: (sum / window) * factor }
    }
    return out
  }

  export type stringFunction = () => string
  export const setElementText = (
    className: string,
    text: string | stringFunction,
  ): void => {
    for (const infoBox of document.getElementsByClassName(className)) {
      const container = infoBox as HTMLElement
      if (container != null) {
        container.innerText = typeof text === 'string' ? text : text()
      }
    }
  }

  export const toTwoDecimals = (val: number): string => {
    return (Math.round(val * 100) / 100).toFixed(2)
  }

  export const createChart = (config: ChartConfig): Chart | undefined => {
    const chartElement = document.getElementById(config.elementId)
    if (chartElement == null) {
      return undefined
    }

    const chart = new Chart(chartElement as HTMLCanvasElement, {
      type: 'line',
      data: {
        datasets: config.datasets,
      },
      options: {
        normalized: true,
        animation: false,
        datasets: {
          line: {
            pointRadius: 0,
            borderWidth: 2,
          },
        },
        hover: {
          mode: 'x',
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
            title: {
              display: true,
              text: 'USD/BTC',
            },
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            min: 0,
            max: config.y1.max,
            title: {
              display: true,
              text: config.y1.title,
            },
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
          tooltip: {
            mode: 'x',
            intersect: false,
            // Deduplicate: decimation can cause multiple points per dataset at nearby x values.
            filter: (item, _index, items) =>
              items.findIndex((i) => i.datasetIndex === item.datasetIndex) ===
              _index,
          },
          ...(config.annotations && {
            annotation: { annotations: config.annotations },
          }),
        },
      },
    })

    const { buttonPrefix, btcData } = config
    for (const range of ['90d', '1y', '5y', 'all'] as const) {
      document
        ?.getElementById(`${buttonPrefix}-${range}`)
        ?.addEventListener('click', () =>
          updateChartRange(chart, btcData, range),
        )
    }

    return chart
  }

  const updateChartRange = (
    chart: Chart,
    data: XYData[],
    range: '90d' | '1y' | '5y' | 'all',
  ) => {
    if (range === 'all') {
      chart.options.scales.x.min = undefined
      chart.options.scales.x.max = undefined
      chart.update()
      return
    }

    const endDate = new Date(data[data.length - 1].x)
    let startDate = new Date(data[0].x)
    if (range === '90d') {
      startDate = new Date(endDate)
      startDate.setDate(endDate.getDate() - 90)
    } else if (range === '1y') {
      startDate = new Date(endDate)
      startDate.setFullYear(endDate.getFullYear() - 1)
    } else if (range === '5y') {
      startDate = new Date(endDate)
      startDate.setFullYear(endDate.getFullYear() - 5)
    }
    chart.options.scales.x.min = startDate
    chart.options.scales.x.max = endDate
    chart.update()
  }
}
