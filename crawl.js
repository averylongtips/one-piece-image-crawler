const puppeteer = require('puppeteer')
const pino = require('pino')
const db = require('./models')

const logger = pino(pino.destination(`./logs/${new Date().toISOString().slice(0, 10)}.log`))
const baseUrl = 'https://xn--gck3an4dt260bnjua.gamematome.jp'
const starList = [8, 5, 4, 3, 2, 1]

const main = async () => {
  const itemList = await db.Item.findAll()

  const browser = await puppeteer.launch({
    args: ['--start-maximized'],
    defaultViewport: null,
    headless: true
  })
  const page = await browser.newPage()
  for (star of starList) {
    console.log(`Star: ${star}`)
    await page.goto(`${baseUrl}/game/968/wiki/%e3%82%b7%e3%83%bc%e3%83%b3%e3%82%ab%e3%83%bc%e3%83%89_%e3%83%ac%e3%82%a2%e5%ba%a6%ef%bc%88%e2%98%85${star}%ef%bc%89`, { timeout: 0 })

    await page.waitForSelector('#content_block_2 tr td:first-child a:first-child')
    const links = await page.evaluate(() => {
      const elements = [...document.querySelectorAll('#content_block_2 tr td:first-child a:first-child')]
      return elements.map(e => {
        return e.getAttribute('href')
      })
    })

    for (const link of links) {
      const url = `${baseUrl}${link}`
      const oldItem = itemList.find(entry => entry.url = url)
      if (oldItem) {
        console.log(`Skip: ${url}`)
        continue
      }

      try {
        await page.goto(url)
        await page.waitForSelector('article .user-area > div > img')
        const source = await page.evaluate(() => {
          const element = document.querySelector('article .user-area > div > img')
          return element.getAttribute('src')
        })

        console.log(`Success: ${url}`)
        await db.Item.create({
          source,
          star,
          url,
          isDownloaded: false
        })
      } catch (e) {
        console.log(`Error ${url}: ${e.message}`)
        logger.info(`Error ${url}: ${e.message}`)
      }
    }
  }
  await browser.close()
}

main()