import { NextResponse } from 'next/server'
const mercadopago = require('mercadopago')

mercadopago.configure({ access_token: process.env.MP_ACCESS_TOKEN })

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { amount, payment_method, payer, token } = body

    if (!amount || !payment_method) {
      return NextResponse.json({ error: 'missing amount or payment_method' }, { status: 400 })
    }

    if (payment_method === 'pix') {
      const payment = await mercadopago.payment.create({
        transaction_amount: Number(amount),
        description: body.description || 'Pagamento',
        payment_method_id: 'pix',
        payer: {
          email: payer?.email || 'no-reply@example.com',
          first_name: payer?.first_name || payer?.name || ''
        }
      })

      return NextResponse.json(payment.response)
    }

    if (payment_method === 'card') {
      if (!token) {
        return NextResponse.json({ error: 'card token required' }, { status: 400 })
      }

      const payment = await mercadopago.payment.create({
        transaction_amount: Number(amount),
        token,
        description: body.description || 'Pagamento com cartão',
        installments: body.installments || 1,
        payment_method_id: body.payment_method_id || 'visa',
        payer: {
          email: payer?.email || 'no-reply@example.com',
          first_name: payer?.first_name || payer?.name || ''
        }
      })

      return NextResponse.json(payment.response)
    }

    return NextResponse.json({ error: 'unsupported payment_method' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || err }, { status: 500 })
  }
}
