import { NextResponse } from 'next/server'
const { MercadoPagoConfig, Payment } = require('mercadopago')

const mpConfig = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN })
const paymentClient = new Payment(mpConfig)

export async function GET(req: Request) {
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
