const fs = require('fs')
const path = require('path')
const axios = require('axios')
require('dotenv').config()
const db = require('./models')

async function downloadImage(url, output, fileName) {
	const outputPath = path.resolve(__dirname, output)
	if (!fs.existsSync(outputPath)) {
		fs.mkdirSync(outputPath)
	}

	const filePath = path.resolve(__dirname, `${output}/${fileName}`)
	if (fs.existsSync(filePath)) {
		return
	}

	const writer = fs.createWriteStream(filePath)

	const response = await axios({
		url,
		method: 'GET',
		responseType: 'stream',
	})

	response.data.pipe(writer)

	return new Promise((resolve, reject) => {
		writer.on('finish', resolve)
		writer.on('error', reject)
	})
}

const main = async () => {
	const itemList = await db.Item.findAll({
		where: {
			isDownloaded: false,
		},
	})
	for (const item of itemList) {
		await downloadImage(
			item.source,
			process.env.OUTPUT,
			item.source.split('/').pop()
		)
		await item.update({ isDownloaded: true })
	}
}

main()
