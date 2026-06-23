import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { atualizarEventoPagamentoPorPaymentId } from '@/lib/payment-db'

const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN ?? process.env.MP_ACCESS_TOKEN ?? ''
const mpConfig = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN })
const paymentClient = new Payment(mpConfig)

function mapResultadoPorStatus(status: string | null) {
  const normalizedStatus = String(status || '').toLowerCase()

  if (normalizedStatus === 'approved' || normalizedStatus === 'paid') {
    return 'aprovado'
  }

  if (normalizedStatus === 'rejected' || normalizedStatus === 'cancelled' || normalizedStatus === 'failed') {
    return 'reprovado'
  }

  if (normalizedStatus === 'pending' || normalizedStatus === 'in_process' || normalizedStatus === 'in_mediation') {
    return 'aguardando_pagamento'
  }

  return 'processado'
}

export async function GET(req: Request) {
  if (!ACCESS_TOKEN) {
    return NextResponse.json({ error: 'MercadoPago access token not configured' }, { status: 500 })
  }

  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

    const payment = await paymentClient.get({ id })

    await atualizarEventoPagamentoPorPaymentId(id, {
      status: payment?.status || null,
      statusDetalhe: payment?.status_detail || null,
      resultado: mapResultadoPorStatus(payment?.status || null),
      erroMensagem: payment?.status === 'rejected' ? payment?.status_detail || 'Pagamento reprovado' : null,
    })

    return NextResponse.json(payment)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
