import { NextResponse } from 'next/server'

const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN ?? process.env.MP_ACCESS_TOKEN ?? ''

export async function POST(req: Request) {
  if (!ACCESS_TOKEN) {
    return NextResponse.json({ error: 'MercadoPago access token not configured' }, { status: 500 })
  }

  try {
    const body = await req.json()
    const { bin, payment_method_id, amount, payment_type_id } = body

    if (!bin || !payment_method_id) {
      return NextResponse.json({ error: 'bin and payment_method_id are required' }, { status: 400 })
    }

    const headers = {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    }

    // 1) Try to fetch issuers
    const issuersUrl = `https://api.mercadopago.com/v1/payment_methods/card_issuers?payment_method_id=${encodeURIComponent(payment_method_id)}&bin=${encodeURIComponent(bin)}`
    const issuersResp = await fetch(issuersUrl, { headers })
    const issuersData = issuersResp.ok ? await issuersResp.json() : null

    // 2) Try to fetch installments (only if amount provided)
    let installmentsData = null
    if (amount) {
      const installmentsUrl = `https://api.mercadopago.com/v1/payment_methods/installments?amount=${encodeURIComponent(String(amount))}&bin=${encodeURIComponent(bin)}${payment_type_id ? `&payment_type_id=${encodeURIComponent(payment_type_id)}` : ''}`
      const instResp = await fetch(installmentsUrl, { headers })
      installmentsData = instResp.ok ? await instResp.json() : null
    }

    return NextResponse.json({ issuers: issuersData, installments: installmentsData })
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
