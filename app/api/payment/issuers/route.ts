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
    const issuersText = await issuersResp.text()
    let issuersJson = null
    try { issuersJson = JSON.parse(issuersText) } catch (e) { /* not json */ }
    const issuersResult = { ok: issuersResp.ok, status: issuersResp.status, body: issuersJson ?? issuersText }

    // 2) Try to fetch installments (only if amount provided)
    let installmentsResult = null
    if (amount) {
      const installmentsUrl = `https://api.mercadopago.com/v1/payment_methods/installments?amount=${encodeURIComponent(String(amount))}&bin=${encodeURIComponent(bin)}${payment_type_id ? `&payment_type_id=${encodeURIComponent(payment_type_id)}` : ''}`
      const instResp = await fetch(installmentsUrl, { headers })
      const instText = await instResp.text()
      let instJson = null
      try { instJson = JSON.parse(instText) } catch (e) { /* not json */ }
      installmentsResult = { ok: instResp.ok, status: instResp.status, body: instJson ?? instText }
    }

    console.log('Issuer detection results:', { issuersResult, installmentsResult })

    return NextResponse.json({ issuers: issuersResult, installments: installmentsResult })
  } catch (err: any) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
