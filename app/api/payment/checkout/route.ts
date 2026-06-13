import { NextResponse } from 'next/server'

const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN ?? process.env.MP_ACCESS_TOKEN ?? ''

export async function POST(req: Request) {
  if (!ACCESS_TOKEN) {
    return NextResponse.json({ error: 'MercadoPago access token not configured (MERCADOPAGO_ACCESS_TOKEN)' }, { status: 500 })
  }

  try {
    const body = await req.json()
    const amount = Number(body?.amount)
    const title = body?.title ?? 'Compra'
    const quantity = Number(body?.quantity ?? 1)

    // Debug logging to help diagnose 'not_result_by_params' in production.
    // These logs are safe: they don't include the access token.
    console.log('[MP Checkout] incoming request', { amount, title, quantity })

    if (!amount || Number.isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: 'invalid amount' }, { status: 400 })
    }

    // origin dinâmico baseado na requisição (ex.: https://seu-dominio.com)
    const origin = new URL(req.url).origin

    const back_urls = body.back_urls ?? {
      success: `${origin}/checkout/success`,
      failure: `${origin}/checkout/failure`,
      pending: `${origin}/checkout/pending`
    }

    const payload = {
      items: [
        {
          title: String(title),
          quantity: Number(quantity),
          unit_price: Number(amount)
        }
      ],
      back_urls,
      auto_return: 'approved',
      payment_methods: {
        // exclui boletos (ticket) para focar em cartões
        excluded_payment_types: [{ id: 'ticket' }]
      }
    }

    const resp = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const data = await resp.json()

    // Log Mercado Pago response for debugging (will appear in PM2 logs).
    console.log('[MP Checkout] mercado pago response status', resp.status)
    console.log('[MP Checkout] mercado pago response body', JSON.stringify(data))

    if (!resp.ok) {
      return NextResponse.json({ error: data }, { status: resp.status })
    }

    return NextResponse.json({ init_point: data.init_point ?? null, sandbox_init_point: data.sandbox_init_point ?? null, preference_id: data.id ?? null })
  } catch (err: any) {
    console.error('[MP Checkout] unexpected error', err)
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
