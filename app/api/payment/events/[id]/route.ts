import { NextResponse } from 'next/server'
import { excluirEventoPagamento } from '@/lib/payment-db'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function DELETE(_: Request, context: RouteContext) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
    }

    const removed = await excluirEventoPagamento(id)

    if (!removed) {
      return NextResponse.json({ error: 'registro não encontrado' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir evento de pagamento:', error)
    const message = error instanceof Error ? error.message : 'Erro interno ao excluir evento.'

    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
