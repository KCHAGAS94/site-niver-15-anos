import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'

const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN ?? process.env.MP_ACCESS_TOKEN ?? ''
const mpConfig = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN })
const paymentClient = new Payment(mpConfig)

export async function POST(req: Request) {
  if (!ACCESS_TOKEN) {
    return NextResponse.json({ error: 'MercadoPago access token not configured' }, { status: 500 })
  }

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
      
      // Determine payment_method_id - try multiple sources, fallback to visa
      let paymentMethodId = body.payment_method_id || body.card_brand || 'visa'
      
      const createBody: any = {
        transaction_amount: Number(amount),
        token,
        description: body.description || 'Pagamento com cartão',
        installments,
        payment_method_id: paymentMethodId,
        payer: {
          email: payer?.email || 'no-reply@example.com',
          first_name: payer?.first_name || payer?.name || ''
        }
      }

      // if client explicitly chose debit mode, hint to MercadoPago
      if (body.card_mode === 'debit') createBody.payment_type_id = 'debit_card'

      const payment = await paymentClient.create({ body: createBody })

      // If payment is not immediately approved, poll for a short time to catch quick confirmations
      const status = payment?.status || payment?.body?.status || null
      if (status && (status === 'approved' || status === 'paid')) {
        return NextResponse.json(payment)
      }

      // Polling loop (up to ~10s total)
      const paymentId = payment?.id || payment?.body?.id || payment?.body?.payment?.id
      if (paymentId) {
        const maxAttempts = 5
        const delayMs = 2000
        for (let i = 0; i < maxAttempts; i++) {
          await new Promise((r) => setTimeout(r, delayMs))
          try {
            const check = await paymentClient.get({ id: paymentId })
            const checkStatus = check?.status || check?.body?.status || null
            if (checkStatus && (checkStatus === 'approved' || checkStatus === 'paid')) {
              return NextResponse.json(check)
            }
          } catch (e) {
            // ignore transient polling errors
          }
        }
      }

      // return initial payment object if still pending
      return NextResponse.json(payment)
    }

    return NextResponse.json({ error: 'unsupported payment_method' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || err }, { status: 500 })
  }
}
