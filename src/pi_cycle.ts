import btc_newest from '../data/btc_newest.json'
import btc_historical from '../data/btc_prices_to_2025.json'
import { Utils } from './utils'

;(async () => {
  const btc_data = Utils.parseData([...btc_historical, ...btc_newest])

  const dma350x2 = Utils.calculateMovingAverage(btc_data, 350, 2)
  const dma111 = Utils.calculateMovingAverage(btc_data, 111)
  const offset = dma111.length - dma350x2.length
  const indicator = dma350x2.map((mva_350, i) => ({
    x: mva_350.x,
    y: dma111[i + offset].y / mva_350.y,
  }))

  Utils.setElementText('pi-cycle-info', () => {
    const val = indicator[indicator.length - 1].y
    return `Indicator: ${Utils.toTwoDecimals(val)}`
  })

  Utils.createChart({
    elementId: 'pi_cycle',
    buttonPrefix: 'pi-cycle',
    btcData: btc_data,
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
    y1: { max: 4, title: 'Pi Cycle Indicator' },
    annotations: {
      lowerBox: {
        drawTime: 'beforeDatasetsDraw',
        type: 'box',
        xMin: btc_data[0].x,
        xMax: btc_data[btc_data.length - 1].x,
        yMin: 0,
        yMax: 0.35,
        yScaleID: 'y1',
        backgroundColor: 'rgba(255, 0, 0, 0.15)',
        borderWidth: 0,
      },
      upperBox: {
        drawTime: 'beforeDatasetsDraw',
        type: 'box',
        xMin: btc_data[0].x,
        xMax: btc_data[btc_data.length - 1].x,
        yMin: 0.95,
        yMax: 1.5,
        yScaleID: 'y1',
        backgroundColor: 'rgba(0, 255, 0, 0.15)',
        borderWidth: 0,
      },
    },
  })
})()
