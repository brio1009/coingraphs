import fs from 'fs'
import ky from 'ky'

if (process.argv.length === 2) {
  console.error('Please provide a AlphaVantage API key.')
  process.exit(1)
}

// replace the "demo" apikey below with your own key from https://www.alphavantage.co/support/#api-key
const url = `https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_DAILY&symbol=BTC&market=USD&apikey=${process.argv[2]}`

const getProperty = (data, name) => {
  if (name in data) {
    return data[name]
  }
  throw new Error(`Property ${name} not found.`)
}
;(async () => {
  try {
    const data = await ky(url).json()
    const timeData = getProperty(data, 'Time Series (Digital Currency Daily)')
    // Iterate over the dates, just get the ones starting from 2025 and get the closing price.
    const out = []
    for (const [date, prices] of Object.entries(timeData)) {
      if (date.startsWith('2025')) {
        out.push({
          date: date,
          value: +getProperty(prices, '4. close'),
        })
      }
    }
    out.reverse() // Ensure newest is last.
    const json = JSON.stringify(out)
    fs.writeFile('data/btc_newest.json', json, 'utf8', () => {})
  } catch (error) {
    console.error(`Error while fetching data: ${error}`)
  }
})()
