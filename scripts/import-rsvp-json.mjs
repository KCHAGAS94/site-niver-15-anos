import { readFile } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { salvarConfirmacao } from '../lib/rsvp-db.js'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const legacyFilePath = path.join(currentDir, '..', 'app', 'api', 'rsvp', 'presencas.json')

async function main() {
	let fileContent = '[]'

	try {
		fileContent = await readFile(legacyFilePath, 'utf8')
	} catch (error) {
		console.log('Arquivo legado não encontrado. Nada para importar.')
		return
	}

	let entries = []

	try {
		const parsed = JSON.parse(fileContent || '[]')
		entries = Array.isArray(parsed) ? parsed : []
	} catch (error) {
		console.error('Não foi possível ler o JSON legado.')
		process.exitCode = 1
		return
	}

	if (entries.length === 0) {
		console.log('JSON legado vazio. Nada para importar.')
		return
	}

	for (const entry of entries) {
		await salvarConfirmacao(entry)
	}

	console.log(`Importados ${entries.length} registros para o PostgreSQL.`)
}

main().catch((error) => {
	console.error(error)
	process.exitCode = 1
})