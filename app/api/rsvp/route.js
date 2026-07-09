import { NextResponse } from 'next/server'
import { salvarConfirmacao, deletarConfirmacao } from '@/lib/rsvp-db'

export async function POST(request) {
  try {
    const data = await request.json()

    await salvarConfirmacao(data)

    return NextResponse.json({ success: true, message: 'Presença confirmada com sucesso!' })
  } catch (error) {
    console.error('Erro ao salvar os dados:', error)
    const message = error instanceof Error ? error.message : 'Erro interno ao salvar os dados.'

    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const data = await request.json()

    await salvarConfirmacao(data)

    return NextResponse.json({ success: true, message: 'Confirmação atualizada com sucesso!' })
  } catch (error) {
    console.error('Erro ao atualizar os dados:', error)
    const message = error instanceof Error ? error.message : 'Erro interno ao atualizar os dados.'

    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID não fornecido' }, { status: 400 })
    }

    await deletarConfirmacao(id)

    return NextResponse.json({ success: true, message: 'Confirmação deletada com sucesso!' })
  } catch (error) {
    console.error('Erro ao deletar os dados:', error)
    const message = error instanceof Error ? error.message : 'Erro interno ao deletar os dados.'

    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}