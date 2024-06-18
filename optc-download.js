const axios = require('axios')
const fs = require('fs')
const path = require('path')

const args = process.argv.slice(2)

if (args.length < 2) {
	console.error(
		'Usage: node optc-download.js <savePath> <lastNumber> [firstNumber]'
	)
	process.exit(1)
}

const savePath = args[0]
const lastNumber = parseInt(args[1], 10)
const firstNumber = args.length > 2 ? parseInt(args[2], 10) : 1

if (isNaN(lastNumber) || isNaN(firstNumber)) {
	console.error('Error: lastNumber and firstNumber must be valid numbers.')
	process.exit(1)
}

if (!fs.existsSync(savePath)) {
	fs.mkdirSync(savePath, { recursive: true })
	console.log(`Created directory: ${savePath}`)
}

;(async () => {
	for (let i = firstNumber; i <= lastNumber; i++) {
		const name = String(i).padStart(4, '0')
		const filePath = path.join(savePath, `${name}.png`)

		if (fs.existsSync(filePath)) {
			continue
		}

		const folder = name.charAt(0)
		const subFolder = `${name.charAt(1)}00`
		const url = `https://optc-db.github.io/api/images/full/transparent/${folder}/${subFolder}/${name}.png`

		try {
			const response = await axios.get(url, { responseType: 'stream' })
			const writer = fs.createWriteStream(filePath)

			response.data.pipe(writer)

			await new Promise((resolve, reject) => {
				writer.on('finish', resolve)
				writer.on('error', reject)
			})

			console.log(`Downloaded: ${filePath}`)
		} catch (error) {
			if (fs.existsSync(filePath)) {
				fs.unlinkSync(filePath)
			}
			console.log(`Failed to download: ${url}`)
		}
	}
})()
