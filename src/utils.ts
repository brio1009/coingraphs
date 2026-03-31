import type { Chart } from 'chart.js'

export interface XYData {
  x: number
  y: number
}

export namespace Utils {
  export const parseData = (arr: { date: string; value?: number }[]): XYData[] =>
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

  export const updateChartRange = (
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
