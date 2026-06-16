import { NextResponse } from 'next/server'
import { salvarConfirmacao } from '@/lib/rsvp-db'

export async function POST(request) {
  try {
    const data = await request.json()

    await salvarConfirmacao(data)

    return NextResponse.json({ success: true, message: 'Presença confirmada com sucesso!' })
  } catch (error) {
    console.error('Erro ao salvar os dados:', error)
    return NextResponse.json({ success: false, error: 'Erro interno ao salvar os dados.' }, { status: 500 })
  }
}