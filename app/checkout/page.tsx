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
  const [cardholderDocument, setCardholderDocument] = useState("")
  const [installments, setInstallments] = useState<number>(1)
  const [detectedCardBrand, setDetectedCardBrand] = useState<string | null>(null)

  // Detectar bandeira do cartão enquanto usuário digita
  useEffect(() => {
    const cleanNumber = cardNumber.replace(/\s+/g, "")
    if (cleanNumber.length < 1) {
      setDetectedCardBrand(null)
      return
    }
    
    const firstDigit = cleanNumber[0]
    const binPrefix = cleanNumber.substring(0, 2)
    
    if (firstDigit === '4') {
      setDetectedCardBrand('Visa')
    } else if (firstDigit === '5' && (binPrefix >= '51' && binPrefix <= '55')) {
      setDetectedCardBrand('Mastercard')
    } else if (binPrefix === '34' || binPrefix === '37') {
      setDetectedCardBrand('American Express')
    } else if (firstDigit === '6') {
      setDetectedCardBrand('Elo')
    } else if (binPrefix >= '36' && binPrefix <= '39') {
      setDetectedCardBrand('Diners')
    } else {
      setDetectedCardBrand('Detectando...')
    }
  }, [cardNumber])

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
      // Validação de campos obrigatórios
      if (!name || !name.trim()) throw new Error("Nome é obrigatório")
      if (!email || !email.trim()) throw new Error("Email é obrigatório")
      if (!cardNumber || !cardMonth || !cardYear || !cardCvv) throw new Error("Preencha todos os dados do cartão")
      
      // @ts-ignore
      const MercadoPago = (window as any).MercadoPago
      const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
      
      if (!MercadoPago || !mpLoaded) throw new Error("SDK MercadoPago não carregado — aguarde alguns segundos e tente novamente")
      
      // @ts-ignore
      const mp = new MercadoPago(publicKey)
      const bin = cardNumber.replace(/\s+/g, "").substring(0, 6)
      
      // Passo 1: Tentar identificar a bandeira do cartão por padrões conhecidos primeiro
      let paymentMethodId = null
      const firstDigit = cardNumber.replace(/\s+/g, "")[0]
      const binPrefix = cardNumber.replace(/\s+/g, "").substring(0, 2)
      
      // Detecção por padrão de número (fallback inicial)
      if (firstDigit === '4') {
        paymentMethodId = 'visa'
      } else if (firstDigit === '5' && (binPrefix >= '51' && binPrefix <= '55')) {
        paymentMethodId = 'master'
      } else if (binPrefix === '34' || binPrefix === '37') {
        paymentMethodId = 'amex'
      } else if (firstDigit === '6') {
        paymentMethodId = 'elo'
      } else if (binPrefix >= '36' && binPrefix <= '39') {
        paymentMethodId = 'diners'
      } else if (binPrefix >= '60' && binPrefix <= '65') {
        paymentMethodId = 'cabal'
      }
      
      // Passo 2: Tentar detectar via API do MercadoPago (mais preciso)
      try {
        const pmResp = await mp.getPaymentMethods({ bin })
        console.log('Payment Methods Response:', pmResp)
        
        if (pmResp?.results?.[0]) {
          paymentMethodId = pmResp.results[0].id // Sobrescreve o fallback se conseguir detectar
          console.log('Detected payment_method_id from API:', paymentMethodId)
        }
      } catch (e) {
        console.warn("Failed to detect payment method from API, using fallback:", e)
      }
      
      if (!paymentMethodId) {
        throw new Error("Não foi possível identificar a bandeira do cartão. Verifique se o número está correto.")
      }
      
      console.log('Using payment_method_id:', paymentMethodId)
      console.log('Using payment_method_id:', paymentMethodId)
      
      // Passo 3: Obter lista de issuers (bancos emissores) para este método de pagamento
      let issuersList = []
      
      console.log('🔍 Step 3: Getting issuers for', paymentMethodId, 'with BIN', bin)
      try {
        const issuersResp = await mp.getIssuers({ paymentMethodId, bin })
        console.log('✅ Issuers Response:', issuersResp)
        issuersList = issuersResp || []
      } catch (e) {
        console.error("❌ Failed to get issuers:", e)
      }
      
      // Passo 4: Obter o issuer_id correto usando getInstallments
      let issuerId = null
      
      console.log('🔍 Step 4: Getting installments with amount:', amount, 'bin:', bin, 'paymentTypeId:', method === 'debit' ? 'debit_card' : 'credit_card')
      try {
        const installmentsResp = await mp.getInstallments({
          amount: String(amount),
          bin: bin,
          paymentTypeId: method === 'debit' ? 'debit_card' : 'credit_card'
        })
        console.log('✅ Installments Response:', installmentsResp)
        
        if (installmentsResp?.[0]?.issuer?.id) {
          issuerId = installmentsResp[0].issuer.id
          console.log('✅ Detected issuer_id from installments:', issuerId)
        } else {
          console.warn('⚠️ No issuer found in installments response')
        }
      } catch (e) {
        console.error("❌ Failed to get installments:", e)
      }
      
      // Fallback: usar o primeiro issuer da lista se não conseguiu detectar
      if (!issuerId && issuersList.length > 0) {
        issuerId = issuersList[0].id
        console.log('✅ Using first issuer from list:', issuerId)
      }
      
      console.log('🎯 Final issuer_id:', issuerId, 'for payment method:', paymentMethodId, 'type:', method)
      
      // Validação: débito REQUER issuer_id
      if (method === 'debit' && !issuerId) {
        throw new Error('Não foi possível detectar o banco emissor do cartão. Cartões de débito requerem esta informação. Verifique o número do cartão ou tente com um cartão de crédito.')
      }
      
      // Passo 5: Tokenizar o cartão
      const cardData = {
        cardNumber: cardNumber.replace(/\s+/g, ""),
        expirationMonth: cardMonth,
        expirationYear: cardYear,
        securityCode: cardCvv,
        cardholderName: name
      }
      
      let tokenResp: any = null
      if (mp.card && typeof mp.card.createToken === 'function') {
        tokenResp = await mp.card.createToken(cardData)
      } else if (typeof mp.createCardToken === 'function') {
        tokenResp = await mp.createCardToken(cardData)
      } else if (typeof mp.createToken === 'function') {
        tokenResp = await mp.createToken(cardData)
      } else {
        throw new Error("SDK MercadoPago carregado, mas método de tokenização não encontrado")
      }
      
      const token = tokenResp?.id || tokenResp?.token || tokenResp?.card_token?.id
      if (!token) throw new Error("Falha ao tokenizar cartão")
      
      console.log('Token Response:', tokenResp)
      console.log('Payment details to send:', { paymentMethodId, issuerId, method, installments: method === "credit" ? installments : 1 })
      
      // Passo 5: Criar o pagamento
      const paymentBody: any = {
        amount,
        payment_method: "card",
        token,
        installments: method === "credit" ? installments : 1,
        payer: {
          email,
          first_name: name
        },
        card_mode: method,
        payment_method_id: paymentMethodId,
        description: 'Presente'
      }
      
      // Adicionar issuer_id se disponível
      if (issuerId) {
        paymentBody.issuer_id = issuerId
      }
      
      // Adicionar documento se fornecido
      if (cardholderDocument) {
        paymentBody.payer.identification = {
          type: 'CPF',
          number: cardholderDocument.replace(/\D/g, '')
        }
      }
      
      console.log('==== SENDING TO API ====')
      console.log(JSON.stringify(paymentBody, null, 2))
      console.log('========================')
      
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentBody)
      })
      
      const data = await res.json()
      if (!res.ok) {
        const errorMsg = data?.error || "Erro ao processar cartão"
        console.error('Payment error:', data)
        
        // Se for erro de parâmetros com débito, sugerir crédito
        if ((data?.code === '316' || errorMsg.includes('Parâmetros incorretos') || errorMsg.includes('No result found')) && method === 'debit') {
          throw new Error('Não foi possível processar como débito. Tente: 1) Usar o modo CRÉDITO (funciona melhor), ou 2) Verificar se o número do cartão está correto e tentar novamente.')
        }
        
        throw new Error(errorMsg)
      }
      
      const paymentStatus = data?.status || data?.body?.status
      const statusMessage = paymentStatus === 'approved' ? 'Pagamento aprovado com sucesso!' : 
                           paymentStatus === 'pending' ? 'Pagamento pendente de confirmação' :
                           paymentStatus === 'in_process' ? 'Pagamento em processamento' :
                           'Pagamento criado: ' + paymentStatus
      
      setMessage(statusMessage)
      
      // Se aprovado, limpar formulário
      if (paymentStatus === 'approved') {
        setCardNumber("")
        setCardMonth("")
        setCardYear("")
        setCardCvv("")
        setCardholderDocument("")
      }
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
                    <label style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>
                      Número do cartão
                      {detectedCardBrand && (
                        <span style={{ marginLeft: 8, fontWeight: 600, color: 'var(--color-primary)' }}>
                          • {detectedCardBrand}
                        </span>
                      )}
                    </label>
                    <input 
                      value={cardNumber} 
                      onChange={(e) => setCardNumber(e.target.value)} 
                      placeholder="4111 1111 1111 1111" 
                      style={inputStyle()} 
                      maxLength={19}
                    />
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input 
                      value={cardMonth} 
                      onChange={(e) => setCardMonth(e.target.value)} 
                      placeholder="MM" 
                      style={inputStyle()} 
                      maxLength={2}
                    />
                    <input 
                      value={cardYear} 
                      onChange={(e) => setCardYear(e.target.value)} 
                      placeholder="AAAA" 
                      style={inputStyle()} 
                      maxLength={4}
                    />
                    <input 
                      value={cardCvv} 
                      onChange={(e) => setCardCvv(e.target.value)} 
                      placeholder="CVV" 
                      style={inputStyle()} 
                      maxLength={4}
                    />
                  </div>
                  
                  <div>
                    <label style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>CPF do titular (opcional, mas recomendado)</label>
                    <input 
                      value={cardholderDocument} 
                      onChange={(e) => setCardholderDocument(e.target.value)} 
                      placeholder="000.000.000-00" 
                      style={inputStyle()} 
                      maxLength={14}
                    />
                  </div>

                  {method === "credit" && (
                    <div>
                      <label style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>Parcelas</label>
                      <select value={installments} onChange={(e) => setInstallments(Number(e.target.value))} style={inputStyle()}>
                        {Array.from({ length: 12 }).map((_, i) => (
                          <option key={i} value={i + 1}>{i + 1}x de R$ {(Number(amount) / (i + 1)).toFixed(2)}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
                    <button 
                      type="submit" 
                      disabled={loading || !mpLoaded} 
                      style={primaryButtonStyle()}
                    >
                      {loading ? "Processando..." : "Pagar com Cartão"}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => { 
                        setCardNumber("")
                        setCardMonth("")
                        setCardYear("")
                        setCardCvv("")
                        setCardholderDocument("")
                      }} 
                      style={secondaryButtonStyle()}
                    >
                      Limpar
                    </button>
                  </div>
                  
                  <div style={{ marginTop: 8, padding: '12px 16px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: 8, border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                    <p style={{ fontSize: 12, color: 'var(--color-foreground)', margin: 0, lineHeight: 1.5 }}>
                      🔒 <strong>Pagamento 100% seguro</strong> - Os dados do seu cartão são processados diretamente pelo Mercado Pago, sem passar pelos nossos servidores.
                    </p>
                  </div>
                  
                  {process.env.NODE_ENV === 'development' && (
                    <div style={{ marginTop: 8, padding: '10px 14px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: 8, border: '1px solid rgba(251, 191, 36, 0.3)', fontSize: 11 }}>
                      <strong>💳 Cartões de teste:</strong><br/>
                      • Visa: 4509 9535 6623 3704<br/>
                      • Master: 5031 4332 1540 6351<br/>
                      • Use qualquer CVV (ex: 123) e data futura
                    </div>
                  )}
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
