import fs from 'fs'
import path from 'path'
import ConfirmadosClient from '@/components/confirmados-client'

function readConfirmacoes() {
	const filePath = path.join(process.cwd(), 'app', 'api', 'rsvp', 'presencas.json')

	try {
		if (!fs.existsSync(filePath)) return []

		const fileData = fs.readFileSync(filePath, 'utf8')
		const parsed = JSON.parse(fileData || '[]')

		return Array.isArray(parsed) ? parsed : []
	} catch (error) {
		return []
	}
}

export default function ConfirmadosPage() {
	const confirmacoes = readConfirmacoes().reverse()

	return <ConfirmadosClient confirmacoes={confirmacoes} />
}