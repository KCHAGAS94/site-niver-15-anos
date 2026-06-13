import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'

const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN ?? process.env.MP_ACCESS_TOKEN ?? ''
const mpConfig = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN })
const paymentClient = new Payment(mpConfig)

export async function GET(req: Request) {
  if (!ACCESS_TOKEN) {
    return NextResponse.json({ error: 'MercadoPago access token not configured' }, { status: 500 })
  }

  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'missing id' }, { status: 400 })

    const payment = await paymentClient.get({ id })
    return NextResponse.json(payment)
  } catch (err: any) {
    return NextResponse.json({ error: err.message || String(err) }, { status: 500 })
  }
}
