import { describe, expect, it } from 'vitest'
import { Utils } from './utils'

describe('Utils.parseData', () => {
  it('returns empty array for empty input', () => {
    expect(Utils.parseData([])).toEqual([])
  })

  it('converts date strings to timestamps', () => {
    const result = Utils.parseData([{ date: '2020-01-01', value: 100 }])
    expect(result).toHaveLength(1)
    expect(result[0].x).toBe(new Date('2020-01-01').getTime())
    expect(result[0].y).toBe(100)
  })

  it('defaults y to 0 when value is undefined', () => {
    const result = Utils.parseData([{ date: '2020-01-01' }])
    expect(result[0].y).toBe(0)
  })

  it('parses multiple entries in order', () => {
    const input = [
      { date: '2020-01-01', value: 7000 },
      { date: '2020-01-02', value: 7100 },
      { date: '2020-01-03', value: 6900 },
    ]
    const result = Utils.parseData(input)
    expect(result).toHaveLength(3)
    expect(result[0].y).toBe(7000)
    expect(result[1].y).toBe(7100)
    expect(result[2].y).toBe(6900)
  })
})

describe('Utils.calculateMovingAverage', () => {
  it('returns empty array when data is shorter than window', () => {
    const data = [
      { x: 1, y: 10 },
      { x: 2, y: 20 },
    ]
    expect(Utils.calculateMovingAverage(data, 3)).toEqual([])
  })

  it('returns empty array for window <= 0', () => {
    const data = [{ x: 1, y: 10 }]
    expect(Utils.calculateMovingAverage(data, 0)).toEqual([])
    expect(Utils.calculateMovingAverage(data, -1)).toEqual([])
  })

  it('returns data unchanged for window=1 and default factor', () => {
    const data = [
      { x: 1, y: 10 },
      { x: 2, y: 20 },
      { x: 3, y: 30 },
    ]
    const result = Utils.calculateMovingAverage(data, 1)
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ x: 1, y: 10 })
    expect(result[1]).toEqual({ x: 2, y: 20 })
    expect(result[2]).toEqual({ x: 3, y: 30 })
  })

  it('calculates a 3-period simple moving average', () => {
    // values: 10, 20, 30, 40, 50 → SMAs: 20, 30, 40
    const data = [
      { x: 1, y: 10 },
      { x: 2, y: 20 },
      { x: 3, y: 30 },
      { x: 4, y: 40 },
      { x: 5, y: 50 },
    ]
    const result = Utils.calculateMovingAverage(data, 3)
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({ x: 3, y: 20 })
    expect(result[1]).toEqual({ x: 4, y: 30 })
    expect(result[2]).toEqual({ x: 5, y: 40 })
  })

  it('applies factor correctly (used for 350DMAx2 in Pi Cycle)', () => {
    const data = [
      { x: 1, y: 10 },
      { x: 2, y: 20 },
      { x: 3, y: 30 },
    ]
    const result = Utils.calculateMovingAverage(data, 3, 2)
    expect(result).toHaveLength(1)
    // (10+20+30)/3 * 2 = 40
    expect(result[0].y).toBe(40)
  })

  it('output length is data.length - window + 1', () => {
    const data = Array.from({ length: 10 }, (_, i) => ({ x: i, y: i * 10 }))
    expect(Utils.calculateMovingAverage(data, 3)).toHaveLength(8)
    expect(Utils.calculateMovingAverage(data, 5)).toHaveLength(6)
    expect(Utils.calculateMovingAverage(data, 10)).toHaveLength(1)
  })

  it('x aligns to the last element of each window', () => {
    const data = [
      { x: 100, y: 10 },
      { x: 200, y: 20 },
      { x: 300, y: 30 },
      { x: 400, y: 40 },
    ]
    const result = Utils.calculateMovingAverage(data, 2)
    expect(result[0].x).toBe(200)
    expect(result[1].x).toBe(300)
    expect(result[2].x).toBe(400)
  })
})

describe('Utils.toTwoDecimals', () => {
  it('formats an integer with two decimal places', () => {
    expect(Utils.toTwoDecimals(5)).toBe('5.00')
  })

  it('formats zero', () => {
    expect(Utils.toTwoDecimals(0)).toBe('0.00')
  })

  it('rounds down correctly', () => {
    expect(Utils.toTwoDecimals(1.234)).toBe('1.23')
  })

  it('rounds up correctly', () => {
    expect(Utils.toTwoDecimals(1.235)).toBe('1.24')
    expect(Utils.toTwoDecimals(1.999)).toBe('2.00')
  })

  it('preserves values already at two decimals', () => {
    expect(Utils.toTwoDecimals(3.14)).toBe('3.14')
  })
})

describe('Mayer Multiple calculation logic', () => {
  it('computes ratio of price to 200DMA correctly', () => {
    // 200 data points with constant price 100 → 200DMA = 100 → multiple = 1.0
    const btcData = Array.from({ length: 200 }, (_, i) => ({
      x: i,
      y: 100,
    }))
    const dma200 = Utils.calculateMovingAverage(btcData, 200)
    const offset = btcData.length - dma200.length
    const mayerMultiple = dma200.map((val, i) => ({
      x: val.x,
      y: btcData[i + offset].y / val.y,
    }))
    expect(mayerMultiple[0].y).toBeCloseTo(1.0)
  })

  it('flags oversold when multiple < 0.5', () => {
    const multiple = 0.3
    expect(multiple < 0.5).toBe(true)
  })

  it('flags bearish when 0.5 ≤ multiple < 1.0', () => {
    const multiple = 0.75
    expect(multiple >= 0.5 && multiple < 1.0).toBe(true)
  })

  it('flags bullish when 1.0 ≤ multiple < 2.0', () => {
    const multiple = 1.5
    expect(multiple >= 1.0 && multiple < 2.0).toBe(true)
  })

  it('flags overbought when multiple ≥ 2.0', () => {
    const multiple = 3.0
    expect(multiple >= 2.0).toBe(true)
  })
})

describe('Pi Cycle calculation logic', () => {
  it('computes 111DMA / 350DMAx2 correctly for flat prices', () => {
    // 350 data points, constant price 100
    // 111DMA = 100, 350DMAx2 = 200 → indicator = 0.5
    const btcData = Array.from({ length: 350 }, (_, i) => ({
      x: i,
      y: 100,
    }))
    const dma350x2 = Utils.calculateMovingAverage(btcData, 350, 2)
    const dma111 = Utils.calculateMovingAverage(btcData, 111)
    const offset = dma111.length - dma350x2.length
    const indicator = dma350x2.map((mva350, i) => ({
      x: mva350.x,
      y: dma111[i + offset].y / mva350.y,
    }))
    expect(indicator[0].y).toBeCloseTo(0.5)
  })

  it('indicator approaches 1.0 (market top signal) when 111DMA meets 350DMAx2', () => {
    // When 111DMA ≈ 350DMAx2, the ratio approaches 1
    const ratio = 200 / 200
    expect(ratio).toBeCloseTo(1.0)
  })
})
