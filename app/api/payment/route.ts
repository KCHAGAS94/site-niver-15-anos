import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { registrarEventoPagamento } from '@/lib/payment-db'

const ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN ?? process.env.MP_ACCESS_TOKEN ?? ''
const mpConfig = new MercadoPagoConfig({ accessToken: ACCESS_TOKEN })
const paymentClient = new Payment(mpConfig)

async function trackPaymentEvent(evento: Record<string, unknown>) {
  try {
    await registrarEventoPagamento(evento)
  } catch (trackingError) {
    console.error('Erro ao registrar evento de pagamento:', trackingError)
  }
}

export async function POST(req: Request) {
  let body: any = null

  if (!ACCESS_TOKEN) {
    await trackPaymentEvent({
      fonte: 'api/payment',
      resultado: 'erro',
      status: 'server_error',
      erroMensagem: 'MercadoPago access token not configured',
    })
    return NextResponse.json({ error: 'MercadoPago access token not configured' }, { status: 500 })
  }

  try {
    body = await req.json()
    const { amount, payment_method, payer, token } = body
    const amountNumber = Number(amount)

    const baseEvent = {
      fonte: 'api/payment',
      metodo: payment_method || null,
      valor: Number.isFinite(amountNumber) ? amountNumber : null,
      nome: payer?.first_name || payer?.name || null,
      email: payer?.email || null,
    }

    if (!amount || !payment_method) {
      await trackPaymentEvent({
        ...baseEvent,
        resultado: 'erro',
        status: 'invalid_request',
        erroMensagem: 'missing amount or payment_method',
      })
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

      await trackPaymentEvent({
        ...baseEvent,
        resultado: 'pix_gerado',
        status: payment?.status || 'pending',
        statusDetalhe: payment?.status_detail || null,
        paymentId: payment?.id ? String(payment.id) : null,
      })

      return NextResponse.json(payment)
    }

    if (payment_method === 'card' || payment_method === 'credit') {
      if (!token) {
        await trackPaymentEvent({
          ...baseEvent,
          resultado: 'erro',
          status: 'invalid_request',
          erroMensagem: 'card token required',
        })
        return NextResponse.json({ error: 'card token required' }, { status: 400 })
      }

      // credit payments are limited to 3 installments
      const requestedInstallments = Number(body.installments || 1)
      const installments = Math.min(Math.max(requestedInstallments, 1), 3)
      
      // Determine payment_method_id
      let paymentMethodId = body.payment_method_id || body.card_brand
      
      if (!paymentMethodId) {
        await trackPaymentEvent({
          ...baseEvent,
          resultado: 'erro',
          status: 'invalid_request',
          erroMensagem: 'payment_method_id é obrigatório',
        })
        return NextResponse.json({ 
          error: 'payment_method_id é obrigatório' 
        }, { status: 400 })
      }
      
      const createBody: any = {
        transaction_amount: Number(amount),
        token,
        description: body.description || 'Pagamento com cartão',
        installments,
        payment_method_id: paymentMethodId,
        payer: {
          email: payer?.email || 'no-reply@example.com',
          first_name: payer?.first_name || payer?.name || '',
          ...(body.payer?.identification && {
            identification: {
              type: body.payer.identification.type || 'CPF',
              number: body.payer.identification.number
            }
          })
        }
      }

      // Add issuer_id if provided
      if (body.issuer_id) {
        createBody.issuer_id = Number(body.issuer_id)
        console.log('Using issuer_id:', createBody.issuer_id)
      } else {
        console.log('No issuer_id provided')
      }

      console.log('Creating payment with body:', JSON.stringify(createBody, null, 2))

      try {
        const payment = await paymentClient.create({ body: createBody })

        console.log('Payment created successfully:', {
          id: payment?.id,
          status: payment?.status,
          status_detail: payment?.status_detail
        })

        await trackPaymentEvent({
          ...baseEvent,
          metodo: 'credit',
          bandeira: paymentMethodId,
          parcelas: installments,
          resultado: payment?.status === 'approved' ? 'aprovado' : 'processado',
          status: payment?.status || 'unknown',
          statusDetalhe: payment?.status_detail || null,
          paymentId: payment?.id ? String(payment.id) : null,
        })

        // Return payment immediately - client will handle polling if needed
        return NextResponse.json(payment)
      } catch (paymentError: any) {
        // Extract detailed error message from MercadoPago response
        console.error('MercadoPago error:', JSON.stringify(paymentError, null, 2))
        
        const errorCode = paymentError?.cause?.[0]?.code
        const errorDescription = paymentError?.cause?.[0]?.description
        
        let userMessage = errorDescription || paymentError?.message || 'Erro ao processar pagamento'
        
        // Translate common error codes to Portuguese
        if (errorCode === '316' || errorDescription?.includes('not_result_by_params') || errorDescription?.includes('No result found')) {
          userMessage = 'Erro ao processar pagamento. Verifique se o número do cartão e dados estão corretos.'
        } else if (errorCode === '205') {
          userMessage = 'Número do cartão inválido. Verifique se digitou corretamente.'
        } else if (errorCode === '208' || errorCode === 'E301') {
          userMessage = 'Mês de expiração inválido. Use formato MM (01-12).'
        } else if (errorCode === '209' || errorCode === 'E302') {
          userMessage = 'Ano de expiração inválido. Use formato AAAA.'
        } else if (errorCode === '212' || errorCode === '213' || errorCode === '214') {
          userMessage = 'CPF inválido. Verifique o número digitado.'
        } else if (errorCode === '221' || errorCode === 'E203') {
          userMessage = 'Nome do titular inválido'
        } else if (errorCode === '224' || errorCode === 'E302') {
          userMessage = 'Código de segurança (CVV) inválido'
        } else if (errorCode === 'cc_rejected_bad_filled_card_number') {
          userMessage = 'Número do cartão preenchido incorretamente'
        } else if (errorCode === 'cc_rejected_bad_filled_date') {
          userMessage = 'Data de validade incorreta'
        } else if (errorCode === 'cc_rejected_bad_filled_security_code') {
          userMessage = 'CVV incorreto'
        } else if (errorCode === 'cc_rejected_call_for_authorize') {
          userMessage = 'Você deve autorizar o pagamento com o banco emissor'
        } else if (errorCode === 'cc_rejected_insufficient_amount') {
          userMessage = 'Saldo insuficiente no cartão'
        }

        await trackPaymentEvent({
          ...baseEvent,
          metodo: 'credit',
          bandeira: paymentMethodId,
          parcelas: installments,
          resultado: 'erro',
          status: 'rejected',
          erroCodigo: errorCode || null,
          erroMensagem: userMessage,
          erroTecnico: errorDescription || paymentError?.message || null,
        })
        
        return NextResponse.json({ 
          error: userMessage, 
          code: errorCode,
          technical_details: errorDescription
        }, { status: 400 })
      }
    }

    await trackPaymentEvent({
      ...baseEvent,
      resultado: 'erro',
      status: 'unsupported_method',
      erroMensagem: 'unsupported payment_method',
    })

    return NextResponse.json({ error: 'unsupported payment_method' }, { status: 400 })
  } catch (err: any) {
    await trackPaymentEvent({
      fonte: 'api/payment',
      metodo: body?.payment_method || null,
      valor: Number.isFinite(Number(body?.amount)) ? Number(body?.amount) : null,
      nome: body?.payer?.first_name || body?.payer?.name || null,
      email: body?.payer?.email || null,
      resultado: 'erro',
      status: 'server_error',
      erroMensagem: err?.message || String(err),
    })

    return NextResponse.json({ error: err.message || err }, { status: 500 })
  }
}
