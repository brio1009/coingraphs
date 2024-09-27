const request = require('request')
const fs = require('fs')

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

request.get(
  {
    url: url,
    json: true,
    headers: { 'User-Agent': 'request' },
  },
  (err, res, data) => {
    if (err) {
      console.error('Error:', err)
    } else if (res.statusCode !== 200) {
      console.error('Status:', res.statusCode)
    } else {
      const timeData = getProperty(data, 'Time Series (Digital Currency Daily)')
      // Iterate over the dates, just get the ones starting from 2024 and get the closing price.
      const out = []
      for (date in timeData) {
        if (date.startsWith('2024')) {
          out.push({
            date: date,
            price: +getProperty(timeData[date], '4. close'),
          })
        }
      }
      const json = JSON.stringify(out)
      fs.writeFile('data/btc_newest.json', json, 'utf8', () => {})
    }
  },
)
