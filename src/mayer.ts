import btc_newest from '../data/btc_newest.json'
import btc_historical from '../data/btc_prices_to_2025.json'
import { Utils } from './utils'

;(async () => {
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

  Utils.createChart({
    elementId: 'mayer',
    buttonPrefix: 'mayer',
    btcData: btc_data,
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
    y1: { max: 15, title: 'Mayer Multiple' },
  })

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
