import ConfirmadosClient from '@/components/confirmados-client'
import { listarConfirmacoes } from '@/lib/rsvp-db'

export const dynamic = 'force-dynamic'

export default async function ConfirmadosPage() {
	const confirmacoes = await listarConfirmacoes()

	return <ConfirmadosClient confirmacoes={confirmacoes} />
}