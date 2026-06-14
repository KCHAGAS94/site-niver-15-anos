"use client"
import { useEffect, useState, useRef } from "react"
import { Navigation } from "@/components/navigation"
import type { CSSProperties } from "react"

export default function CheckoutPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [amount, setAmount] = useState("0.00")
  const [method, setMethod] = useState<"pix" | "debit" | "credit">("pix")

  // Card fields
  const [cardNumber, setCardNumber] = useState("")
  const [cardMonth, setCardMonth] = useState("")
  const [cardYear, setCardYear] = useState("")
  const [cardCvv, setCardCvv] = useState("")
  const [installments, setInstallments] = useState<number>(1)

  const [qr, setQr] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [paymentId, setPaymentId] = useState<string | number | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [validationErrors, setValidationErrors] = useState<{ name?: string; email?: string }>({})
  const nameRef = useRef<HTMLInputElement | null>(null)
  const emailRef = useRef<HTMLInputElement | null>(null)
  const [loading, setLoading] = useState(false)
  const [mpLoaded, setMpLoaded] = useState(false)
  const messageRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("checkoutSelection")
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.total) setAmount(String(Number(parsed.total).toFixed(2)))
      }
    } catch (e) {
      // ignore
    }
  }, [])

  useEffect(() => {
    // load Mercado Pago SDK script (optional)
    const id = "mp-sdk"
    if (!document.getElementById(id)) {
      const s = document.createElement("script")
      s.id = id
      s.src = "https://sdk.mercadopago.com/js/v2"
      s.async = true
      document.body.appendChild(s)
      // poll until SDK is available
      const check = setInterval(() => {
        // @ts-ignore
        if ((window as any).MercadoPago) {
          setMpLoaded(true)
          clearInterval(check)
        }
      }, 200)
    }
  }, [])

  async function createPix() {
    setLoading(true)
    setMessage(null)
    setQr(null)
    try {
      // reset validation
      setValidationErrors({})
      // validate required fields
      const errors: { name?: string; email?: string } = {}
      if (!name || !name.trim()) errors.name = 'Pendente'
      if (!email || !email.trim()) errors.email = 'Pendente'
      const emailRegex = /\S+@\S+\.\S+/
      if (email && !emailRegex.test(email)) errors.email = 'Email inválido'
      if (Object.keys(errors).length) {
        setValidationErrors(errors)
        // focus first invalid
        if (errors.name) nameRef.current?.focus()
        else if (errors.email) emailRef.current?.focus()
        setMessage('Preencha os campos obrigatórios antes de gerar o pagamento.')
        setLoading(false)
        return
      }
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, payment_method: "pix", payer: { email, first_name: name }, description: "Presente" })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Erro ao criar PIX")
      // store payment id and status to poll
      if (data?.id) {
        setPaymentId(data.id)
        setPaymentStatus(data.status || null)
        setMessage("Aguardando pagamento — você pode fechar a janela quando quiser. Assim que o pagamento for confirmado, a compra será aprovada aqui.")
      }
      const qrBase64 = data?.point_of_interaction?.transaction_data?.qr_code_base64
      const qrCode = data?.point_of_interaction?.transaction_data?.qr_code
      if (qrBase64) setQr(`data:image/png;base64,${qrBase64}`)
      else if (qrCode) setMessage(String(qrCode))
      else setMessage((prev) => prev ?? "PIX criado, verifique retorno do servidor.")
    } catch (err: any) {
      setMessage(err?.message ?? String(err))
    } finally {
      setLoading(false)
    }
  }

  // poll payment status when we have a payment id
  useEffect(() => {
    if (!paymentId) return
    let stopped = false
    const check = async () => {
      try {
        const res = await fetch(`/api/payment/status?id=${paymentId}`)
        const data = await res.json()
        if (res.ok) {
          const status = data?.status || data?.payment_status || null
          setPaymentStatus(status)
          if (status === 'approved' || status === 'paid') {
            setMessage('Compra aprovada — obrigado!')
            setQr(null)
            setProgress(100)
            stopped = true
          }
        }
      } catch (e) {
        // ignore transient errors
      }
    }

    // progress updater while waiting
    setProgress(0)
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(90, Math.round((p + Math.random() * 10) * 10) / 10))
    }, 1000)

    // initial check + polling
    check()
    const id = setInterval(() => {
      if (stopped) return
      check()
    }, 5000)

    return () => { clearInterval(id); clearInterval(progressInterval) }
  }, [paymentId])

  useEffect(() => {
    if (message && messageRef.current) {
      // scroll message into view and briefly highlight
      messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [message])

  async function payCard(e?: React.FormEvent) {
    if (e) e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      // try to tokenise with Mercado Pago SDK
      // @ts-ignore
      const MercadoPago = (window as any).MercadoPago
      const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
      // simple validation
      if (!cardNumber || !cardMonth || !cardYear || !cardCvv) throw new Error("Preencha os dados do cartão")
      if (!MercadoPago || !mpLoaded) throw new Error("SDK MercadoPago não carregado — aguarde alguns segundos e tente novamente")
      // @ts-ignore
      const mp = new MercadoPago(publicKey)
      const cardData = { cardNumber: cardNumber.replace(/\s+/g, ""), expirationMonth: cardMonth, expirationYear: cardYear, securityCode: cardCvv, cardholderName: name }

      // try multiple tokenization entry points depending on SDK version
      let tokenResp: any = null
      if (mp.card && typeof mp.card.createToken === 'function') {
        // common pattern
        tokenResp = await mp.card.createToken(cardData)
      } else if (typeof mp.createCardToken === 'function') {
        tokenResp = await mp.createCardToken(cardData)
      } else if (typeof mp.createToken === 'function') {
        tokenResp = await mp.createToken(cardData)
      } else {
        throw new Error("SDK MercadoPago carregado, mas método de tokenização não encontrado. Verifique versão do SDK.")
      }

      const token = tokenResp?.id || tokenResp?.token || tokenResp?.card_token?.id
      if (!token) throw new Error("Falha ao tokenizar cartão")

      // try to infer card brand from token response when available
      let cardBrand = tokenResp?.payment_method_id || tokenResp?.card?.brand || tokenResp?.card?.network || tokenResp?.cardholder?.brand || null
      let issuerId = tokenResp?.issuer_id || null
      
      // If still no brand, try to identify from card number BIN using SDK
      if (!cardBrand || !issuerId) {
        try {
          const bin = cardNumber.replace(/\s+/g, "").substring(0, 6)
          const pmResp = await mp.getPaymentMethods({ bin })
          if (pmResp?.results?.[0]) {
            cardBrand = cardBrand || pmResp.results[0].id
            
            // For debit cards, try to get issuer from the BIN query
            if (!issuerId && method === 'debit') {
              try {
                const installmentsResp = await mp.getInstallments({
                  amount: amount,
                  bin: bin,
                  paymentTypeId: 'debit_card'
                })
                if (installmentsResp?.[0]?.issuer?.id) {
                  issuerId = installmentsResp[0].issuer.id
                }
              } catch (e) {
                console.warn("Failed to get issuer:", e)
              }
            }
          }
        } catch (e) {
          console.warn("Failed to detect payment method from BIN:", e)
        }
      }
      
      // Fallback: identify by first digits
      if (!cardBrand) {
        const firstDigit = cardNumber.replace(/\s+/g, "")[0]
        const binPrefix = cardNumber.replace(/\s+/g, "").substring(0, 2)
        if (firstDigit === '4') cardBrand = 'visa'
        else if (firstDigit === '5' || (binPrefix >= '51' && binPrefix <= '55')) cardBrand = 'master'
        else if (firstDigit === '3') cardBrand = 'amex'
        else if (firstDigit === '6') cardBrand = 'elo'
        else cardBrand = 'visa' // default fallback
      }

      console.log('Payment details:', { cardBrand, issuerId, method, installments })

      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          payment_method: "card",
          token,
          installments: method === "credit" ? installments : 1,
          payer: { email, first_name: name },
          // communicate to server whether user chose debit or credit
          card_mode: method,
          // provide detected brand and issuer
          payment_method_id: cardBrand,
          issuer_id: issuerId,
          description: 'Presente'
        })
      })
      const data = await res.json()
      if (!res.ok) {
        const errorMsg = data?.error || "Erro ao processar cartão"
        console.error('Payment error:', data)
        throw new Error(errorMsg)
      }
      setMessage("Pagamento criado: " + (data.status || JSON.stringify(data)))
    } catch (err: any) {
      setMessage(err?.message ?? String(err))
    } finally {
      setLoading(false)
    }
  }

  async function startCheckoutPro() {
    setLoading(true)
    setMessage(null)
    try {
      // simple validation
      if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) throw new Error('Valor inválido')

      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, title: 'Presente', quantity: 1 })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Erro ao criar preferência')

      const initPoint = data.init_point || data.sandbox_init_point
      if (!initPoint) throw new Error('init_point não retornado pelo servidor')

      // redireciona para o Checkout Pro do Mercado Pago
      window.location.href = initPoint
    } catch (err: any) {
      setMessage(err?.message ?? String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navigation />
      <div style={{ display: "flex", justifyContent: "center", padding: 36, paddingTop: 120 }}>
        <div style={{ width: "100%", maxWidth: 820 }}>
          <h2 style={{ textAlign: "center", color: "var(--color-primary)", marginBottom: 18 }}>Finalizar Presente</h2>

        <div style={{ background: "var(--color-card)", padding: 24, borderRadius: 12, boxShadow: "0 6px 18px rgba(0,0,0,0.06)" }}>
          <form onSubmit={payCard}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--color-muted-foreground)" }}>
                  Nome completo * {validationErrors.name && <span style={{ color: '#e11d48', fontWeight: 600, marginLeft: 8 }}>{validationErrors.name}</span>}
                </label>
                <input ref={nameRef} value={name} onChange={(e) => { setName(e.target.value); if (validationErrors.name) setValidationErrors((s) => ({ ...s, name: undefined })) }} style={inputStyle(!!validationErrors.name)} required />
                {validationErrors.name && <div style={{ color: '#e11d48', fontSize: 12, marginTop: 6 }}>{validationErrors.name}</div>}
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--color-muted-foreground)" }}>
                  Email * {validationErrors.email && <span style={{ color: '#e11d48', fontWeight: 600, marginLeft: 8 }}>{validationErrors.email}</span>}
                </label>
                <input ref={emailRef} value={email} onChange={(e) => { setEmail(e.target.value); if (validationErrors.email) setValidationErrors((s) => ({ ...s, email: undefined })) }} style={inputStyle(!!validationErrors.email)} required />
                {validationErrors.email && <div style={{ color: '#e11d48', fontSize: 12, marginTop: 6 }}>{validationErrors.email}</div>}
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--color-muted-foreground)" }}>Valor (BRL)</label>
                <input value={amount} onChange={(e) => setAmount(e.target.value)} style={inputStyle()} required />
              </div>

              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <label style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>Método de pagamento</label>
                <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                  <label style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="radio" checked={method === "pix"} onChange={() => setMethod("pix")} /> Pix</label>
                  <label style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="radio" checked={method === "debit"} onChange={() => setMethod("debit")} /> Débito</label>
                  <label style={{ display: "flex", gap: 6, alignItems: "center" }}><input type="radio" checked={method === "credit"} onChange={() => setMethod("credit")} /> Crédito</label>
                </div>
              </div>
            </div>

            {method === "pix" && (
              <div style={{ marginTop: 16, display: "flex", gap: 12, justifyContent: "center" }}>
                {name.trim() && email.trim() ? (
                  <button
                    type="button"
                    onClick={createPix}
                    style={primaryButtonStyle()}
                    aria-disabled={loading}
                  >
                    Gerar QR Code
                  </button>
                ) : (
                  <div style={{ color: 'var(--color-muted-foreground)', padding: '10px 14px', borderRadius: 8 }}>
                    Preencha nome e email para gerar o QR Code
                  </div>
                )}
              </div>
            )}

            {(method === "debit" || method === "credit") && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "grid", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>Número do cartão</label>
                    <input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="4111 1111 1111 1111" style={inputStyle()} />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input value={cardMonth} onChange={(e) => setCardMonth(e.target.value)} placeholder="MM" style={inputStyle()} />
                    <input value={cardYear} onChange={(e) => setCardYear(e.target.value)} placeholder="YYYY" style={inputStyle()} />
                    <input value={cardCvv} onChange={(e) => setCardCvv(e.target.value)} placeholder="CVV" style={inputStyle()} />
                  </div>

                  {method === "credit" && (
                    <div>
                      <label style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>Parcelas</label>
                      <select value={installments} onChange={(e) => setInstallments(Number(e.target.value))} style={inputStyle()}>
                        {Array.from({ length: 12 }).map((_, i) => (
                          <option key={i} value={i + 1}>{i + 1}x</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
                    <button type="submit" disabled={loading || ((method === 'debit' || method === 'credit') && !mpLoaded)} style={primaryButtonStyle()}>{loading ? "Processando..." : "Pagar"}</button>
                    <button type="button" onClick={() => { setCardNumber(""); setCardMonth(""); setCardYear(""); setCardCvv("") }} style={secondaryButtonStyle()}>Limpar</button>
                    {(method === 'credit' || method === 'debit') && (
                      <button type="button" onClick={startCheckoutPro} disabled={loading} style={{ ...primaryButtonStyle(), background: '#0ea5a4' }}>Checkout Pro</button>
                    )}
                  </div>
                </div>
              </div>
            )}
            { (method === 'debit' || method === 'credit') && !mpLoaded && (
              <div style={{ marginTop: 8, fontSize: 13, color: 'var(--color-muted-foreground)' }}>
                Aguardando carregamento do SDK do Mercado Pago. Aguarde alguns segundos e tente novamente.
              </div>
            )}
          </form>

          {qr && (
            <div style={{ marginTop: 18, textAlign: "center" }}>
              <h3 style={{ color: "var(--color-primary)" }}>QR Code PIX</h3>
              <img src={qr} alt="PIX QR" style={{ maxWidth: 280, borderRadius: 8, border: "1px solid var(--color-border)" }} />
            </div>
          )}

          {/* Status area */}
          {paymentId && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, color: paymentStatus && (paymentStatus === 'approved' || paymentStatus === 'paid') ? 'var(--color-success)' : 'var(--color-primary)' }}>
                    {paymentStatus && (paymentStatus === 'approved' || paymentStatus === 'paid') ? 'Compra aprovada' : 'Aguardando pagamento'}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--color-muted-foreground)', marginTop: 6, maxWidth: 560 }}>
                    {paymentStatus && (paymentStatus === 'approved' || paymentStatus === 'paid')
                      ? 'O pagamento foi confirmado com sucesso.'
                      : 'Aguardando pagamento — você pode fechar a janela quando quiser. Assim que o pagamento for confirmado, a compra será aprovada aqui.'}
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 120 }}>
                  <div style={{ fontSize: 12, color: 'var(--color-muted-foreground)' }}>Status</div>
                  <div style={{ fontWeight: 700, color: paymentStatus && (paymentStatus === 'approved' || paymentStatus === 'paid') ? 'var(--color-success)' : 'var(--color-primary)' }}>
                    {paymentStatus || 'pending'}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 10 }}>
                <div style={statusTrackStyle()}>
                  <div style={statusFillStyle(progress, paymentStatus)} />
                </div>
              </div>
            </div>
          )}

          {message && (
            <div ref={messageRef} style={getMessageStyle(message, !!Object.keys(validationErrors).length)}>
              {message}
            </div>
          )}
        </div>
        </div>
      </div>
    </>
  )
}

// Helper style functions
function inputStyle(hasError = false): CSSProperties {
  return {
    padding: "10px 14px",
    borderRadius: 8,
    border: hasError ? "2px solid #e11d48" : "1px solid var(--color-border)",
    background: "var(--color-background)",
    color: "var(--color-foreground)",
    width: "100%",
    fontSize: 14
  }
}

function primaryButtonStyle(): CSSProperties {
  return {
    padding: "12px 24px",
    borderRadius: 8,
    border: "none",
    background: "var(--color-primary)",
    color: "white",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14
  }
}

function secondaryButtonStyle(): CSSProperties {
  return {
    padding: "12px 24px",
    borderRadius: 8,
    border: "1px solid var(--color-border)",
    background: "var(--color-card)",
    color: "var(--color-foreground)",
    fontWeight: 600,
    cursor: "pointer",
    fontSize: 14
  }
}

function statusTrackStyle(): CSSProperties {
  return {
    width: '100%',
    height: 8,
    background: 'var(--color-muted)',
    borderRadius: 4,
    overflow: 'hidden'
  }
}

function statusFillStyle(progress: number, status: string | null): CSSProperties {
  return {
    height: '100%',
    width: `${progress}%`,
    background: status && (status === 'approved' || status === 'paid') ? 'var(--color-success)' : 'var(--color-primary)',
    transition: 'width 0.5s ease'
  }
}

function getMessageStyle(message: string, hasValidationErrors: boolean): CSSProperties {
  const isSuccess = message.includes('aprovada') || message.includes('confirmado')
  return {
    marginTop: 18,
    padding: 14,
    borderRadius: 8,
    background: hasValidationErrors ? '#fee2e2' : isSuccess ? '#d1fae5' : '#fef3c7',
    color: hasValidationErrors ? '#991b1b' : isSuccess ? '#065f46' : '#78350f',
    fontSize: 14,
    border: hasValidationErrors ? '1px solid #fca5a5' : isSuccess ? '1px solid #6ee7b7' : '1px solid #fcd34d'
  }
}
