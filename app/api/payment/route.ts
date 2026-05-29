import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'

const mpConfig = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || '' })
const paymentClient = new Payment(mpConfig)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { amount, payment_method, payer, token } = body

    if (!amount || !payment_method) {
      return NextResponse.json({ error: 'missing amount or payment_method' }, { status: 400 })
    }

    if (payment_method === 'pix') {
      const payment = await paymentClient.create({
        body: {
          transaction_amount: Number(amount),
          description: body.description || 'Pagamento',
          payment_method_id: 'pix',
          payer: {
            email: payer?.email || 'no-reply@example.com',
            first_name: payer?.first_name || payer?.name || ''
          }
        }
      })

      return NextResponse.json(payment)
    }

    if (payment_method === 'card' || payment_method === 'debit' || payment_method === 'credit') {
      if (!token) {
        return NextResponse.json({ error: 'card token required' }, { status: 400 })
      }

      // for debit payments force 1 installment
      const installments = payment_method === 'debit' ? 1 : (body.installments || 1)

      const payment = await paymentClient.create({
        body: {
          transaction_amount: Number(amount),
          token,
          description: body.description || 'Pagamento com cartão',
          installments,
          // allow client to provide payment_method_id (card brand) if known
          payment_method_id: body.payment_method_id || body.card_brand || 'visa',
          payer: {
            email: payer?.email || 'no-reply@example.com',
            first_name: payer?.first_name || payer?.name || ''
          }
        }
      })

      return NextResponse.json(payment)
    }

    return NextResponse.json({ error: 'unsupported payment_method' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || err }, { status: 500 })
  }
}
