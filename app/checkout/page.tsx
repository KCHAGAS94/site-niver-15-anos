"use client"
import { useEffect, useState, useRef } from "react"
import { Navigation } from "@/components/navigation"
import { CardPayment, initMercadoPago } from "@mercadopago/sdk-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import type { CSSProperties } from "react"

export default function CheckoutPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [amount, setAmount] = useState("1.00")
  const [method, setMethod] = useState<"pix" | "credit">("pix")
  const [selectedCount, setSelectedCount] = useState(0)

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
  const [pixCode, setPixCode] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [paymentId, setPaymentId] = useState<string | number | null>(null)
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null)
  const [approvalModalOpen, setApprovalModalOpen] = useState(false)
  const [creditDialogState, setCreditDialogState] = useState<'closed' | 'processing' | 'approved' | 'error'>('closed')
  const [creditDialogMessage, setCreditDialogMessage] = useState<string | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [validationErrors, setValidationErrors] = useState<{ name?: string; email?: string }>({})
  const nameRef = useRef<HTMLInputElement | null>(null)
  const emailRef = useRef<HTMLInputElement | null>(null)
  const [loading, setLoading] = useState(false)
  const [mpLoaded, setMpLoaded] = useState(false)
  const messageRef = useRef<HTMLDivElement | null>(null)

  const closeApprovalModal = () => {
    setApprovalModalOpen(false)
    router.push("/#inicio")
  }

  const closeCreditDialog = () => {
    const wasApproved = creditDialogState === 'approved'
    setCreditDialogState('closed')
    if (wasApproved) {
      router.push("/#inicio")
    }
  }

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("checkoutSelection")
      if (!raw) {
        setAmount("1.00")
        setSelectedCount(0)
        return
      }

      const parsed = JSON.parse(raw)
      const total = Number(parsed?.total)
      const items = Array.isArray(parsed?.items) ? parsed.items.length : 0

      setAmount(Number.isFinite(total) && total > 0 ? total.toFixed(2) : "1.00")
      setSelectedCount(items)
    } catch (e) {
      setAmount("1.00")
      setSelectedCount(0)
    }
  }, [])

  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
    if (publicKey) {
      initMercadoPago(publicKey)
      setMpLoaded(true)
    }
  }, [])

  useEffect(() => {
    setQr(null)
    setPixCode(null)
    setPaymentId(null)
    setPaymentStatus(null)
    setApprovalModalOpen(false)
    setCreditDialogState('closed')
    setCreditDialogMessage(null)
    setProgress(0)
    setMessage(null)
  }, [method])

  async function createPix() {
    setLoading(true)
    setMessage(null)
    setQr(null)
    setPixCode(null)
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
      if (qrCode) {
        const code = String(qrCode)
        setPixCode(code)
        if (!qrBase64) setMessage(code)
      }
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
            if (creditDialogState !== 'approved') {
              setCreditDialogState('approved')
              setCreditDialogMessage('Pagamento aprovado com sucesso!')
            }
            setMessage('Compra aprovada — obrigado!')
            setQr(null)
            setProgress(100)
            stopped = true
          } else if (status === 'pending' || status === 'in_process') {
            setCreditDialogState('processing')
            setCreditDialogMessage('Pagamento em processamento. Aguarde a confirmação do banco.')
          } else if (status === 'rejected' || status === 'cancelled' || status === 'failed') {
            setCreditDialogState('error')
            setCreditDialogMessage('Pagamento reprovado. Verifique os dados do cartão e tente novamente.')
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
      
      throw new Error("O formulário de cartão agora usa o Brick automático do Mercado Pago. Use o bloco abaixo para pagar.")

      const paymentStatus = null
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
          <form onSubmit={(e) => e.preventDefault()}>
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
                <label style={{ display: "block", fontSize: 12, color: "var(--color-muted-foreground)" }}>
                  Valor total a pagar {selectedCount > 0 && <span style={{ marginLeft: 6 }}>({selectedCount} presente{selectedCount > 1 ? "s" : ""})</span>}
                </label>
                <input value={formatBRL(amount)} disabled readOnly style={inputStyle()} required title="Valor fixo" />
              </div>

              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <label style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>Método de pagamento</label>
                <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                  <label style={{ ...paymentMethodOptionStyle(method === "pix"), flex: 1 }}>
                    <input
                      type="radio"
                      name="payment-method"
                      checked={method === "pix"}
                      onChange={() => setMethod("pix")}
                      style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{ fontSize: 20, lineHeight: 1 }}>◈</span>
                    <span>Pix</span>
                  </label>
                  <label style={{ ...paymentMethodOptionStyle(method === "credit"), flex: 1 }}>
                    <input
                      type="radio"
                      name="payment-method"
                      checked={method === "credit"}
                      onChange={() => setMethod("credit")}
                      style={{ position: "absolute", opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{ fontSize: 20, lineHeight: 1 }}>▣</span>
                    <span>Crédito</span>
                  </label>
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

            {method === "credit" && (
              <div style={{ marginTop: 16 }}>

                <CardPayment
                  key={method}
                  id="cardPaymentBrick_container"
                  locale="pt-BR"
                  initialization={{
                    amount: Number(amount),
                    payer: {
                      email,
                      identification: cardholderDocument
                        ? {
                            type: 'CPF',
                            number: cardholderDocument.replace(/\D/g, '')
                          }
                        : undefined
                    }
                  }}
                  customization={{
                    paymentMethods: {
                      minInstallments: 1,
                      maxInstallments: 3,
                      types: {
                        included: ['credit_card']
                      }
                    },
                    visual: {
                      hideFormTitle: true
                    }
                  }}
                  onReady={() => setMpLoaded(true)}
                  onError={(error) => {
                    console.error('CardPayment Brick error:', error)
                    setMessage('Não foi possível carregar o formulário de cartão. Tente recarregar a página.')
                  }}
                  onSubmit={async (data) => {
                    setLoading(true)
                    setMessage(null)
                    setCreditDialogState('processing')
                    setCreditDialogMessage('Processando pagamento com cartão. Este modal ficará aberto até que o pagamento seja aprovado.')
                    try {
                      const paymentBody = {
                        amount,
                        payment_method: 'card',
                        token: data.token,
                        installments: data.installments,
                        payer: {
                          email,
                          first_name: name,
                          identification: cardholderDocument
                            ? {
                                type: 'CPF',
                                number: cardholderDocument.replace(/\D/g, '')
                              }
                            : undefined
                        },
                        card_mode: 'credit',
                        payment_method_id: data.payment_method_id,
                        issuer_id: data.issuer_id,
                        description: 'Presente'
                      }

                      console.log('==== SENDING TO API ====')
                      console.log(JSON.stringify(paymentBody, null, 2))
                      console.log('========================')

                      const res = await fetch('/api/payment', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(paymentBody)
                      })

                      const result = await res.json()
                      if (!res.ok) {
                        throw new Error(result?.error || 'Erro ao processar cartão')
                      }

                      const paymentStatusResult = result?.status || result?.body?.status
                      const statusMessage = paymentStatusResult === 'approved' ? 'Pagamento aprovado com sucesso!' :
                        paymentStatusResult === 'pending' ? 'Pagamento pendente de confirmação' :
                        paymentStatusResult === 'in_process' ? 'Pagamento em processamento' :
                        'Pagamento criado: ' + paymentStatusResult

                      setMessage(statusMessage)
                      setPaymentStatus(paymentStatusResult)
                      setPaymentId(result?.id || null)

                      if (paymentStatusResult === 'approved') {
                        setCreditDialogState('approved')
                        setCreditDialogMessage('Pagamento aprovado com sucesso!')
                        setCardholderDocument("")
                      } else if (paymentStatusResult === 'pending' || paymentStatusResult === 'in_process') {
                        setCreditDialogState('processing')
                        setCreditDialogMessage('Pagamento em processamento. Aguarde a confirmação do banco.')
                      } else {
                        setCreditDialogState('processing')
                        setCreditDialogMessage('Pagamento criado. Aguardando confirmação do banco.')
                      }
                    } catch (error: any) {
                      const userMessage = error?.message ?? String(error)
                      setMessage(userMessage)
                      setCreditDialogState('error')
                      setCreditDialogMessage(userMessage)
                    } finally {
                      setLoading(false)
                    }
                  }}
                />

            
              </div>
            )}
            {method === 'credit' && !mpLoaded && (
              <div style={{ marginTop: 8, fontSize: 13, color: 'var(--color-muted-foreground)' }}>
                Aguardando carregamento do SDK do Mercado Pago. Aguarde alguns segundos e tente novamente.
              </div>
            )}
          </form>

          {method === 'pix' && qr && (
            <div style={{ marginTop: 18, display: 'grid', justifyItems: 'center', textAlign: "center" }}>
              <h3 style={{ color: "var(--color-primary)" }}>QR Code PIX</h3>
              <img src={qr} alt="PIX QR" style={{ maxWidth: 280, borderRadius: 8, border: "1px solid var(--color-border)", display: 'block', margin: '0 auto' }} />
              {pixCode && (
                <div style={{ marginTop: 12, display: 'grid', gap: 10, justifyItems: 'center' }}>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(pixCode)
                        setMessage('Código PIX copiado para a área de transferência.')
                      } catch (error: any) {
                        setMessage(error?.message ?? 'Não foi possível copiar o código PIX.')
                      }
                    }}
                    style={primaryButtonStyle()}
                  >
                    Copiar código PIX
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Status area */}
          {method === 'pix' && paymentId && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, color: paymentStatus && (paymentStatus === 'approved' || paymentStatus === 'paid') ? 'var(--color-success)' : 'var(--color-primary)' }}>
                    {paymentStatus && (paymentStatus === 'approved' || paymentStatus === 'paid') ? 'Compra aprovada' : 'Aguardando pagamento'}
                  </div>
                  {paymentStatus && (paymentStatus === 'approved' || paymentStatus === 'paid') && (
                    <div style={{ fontSize: 13, color: 'var(--color-muted-foreground)', marginTop: 6, maxWidth: 560 }}>
                      O pagamento foi confirmado com sucesso.
                    </div>
                  )}
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

          <Dialog open={approvalModalOpen} onOpenChange={setApprovalModalOpen}>
            <DialogContent
              showCloseButton={false}
              style={{
                position: 'fixed',
                inset: 0,
                width: '100vw',
                height: '100vh',
                margin: 0,
                padding: 0,
                display: 'grid',
                placeItems: 'center',
                boxSizing: 'border-box',
                overflow: 'auto',
                background: 'rgba(0,0,0,0.45)'
              }}
            >
              <div style={{ width: '100%', maxWidth: 560, margin: 0 }}>
                <DialogHeader>
                  <DialogTitle>Pagamento aprovado</DialogTitle>
                  <DialogDescription>
                    A compra foi confirmada com sucesso. Você pode fechar esta janela e continuar navegando.
                  </DialogDescription>
                </DialogHeader>

              <div style={{ display: 'grid', gap: 10, fontSize: 14, color: 'var(--color-foreground)' }}>
                <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(34, 197, 94, 0.10)', border: '1px solid rgba(34, 197, 94, 0.25)' }}>
                  Obrigado! O pagamento foi aprovado com sucesso.
                </div>
                <div style={{ lineHeight: 1.5, color: 'var(--color-muted-foreground)' }}>
                  Se quiser, você pode voltar para o início e conferir o restante do presente.
                </div>
              </div>

              <DialogFooter>
                <button
                  type="button"
                  onClick={closeApprovalModal}
                  style={primaryButtonStyle()}
                >
                  Fechar
                </button>
              </DialogFooter>
            </div>
          </DialogContent>
          </Dialog>

          <Dialog
            open={creditDialogState !== 'closed'}
            onOpenChange={(open) => {
              if (!open && creditDialogState === 'processing') return
              if (!open) setCreditDialogState('closed')
            }}
          >
            <DialogContent
              showCloseButton={creditDialogState !== 'processing'}
              style={{
                position: 'fixed',
                inset: 0,
                width: '100vw',
                height: '100vh',
                margin: 0,
                padding: 0,
                display: 'grid',
                placeItems: 'center',
                boxSizing: 'border-box',
                overflow: 'auto',
                background: 'rgba(0,0,0,0.45)'
              }}
            >
              <div style={{
                width: '100%',
                maxWidth: 560,
                minHeight: 'auto',
                borderRadius: 24,
                padding: 24,
                background: 'white',
                boxShadow: '0 32px 80px rgba(0,0,0,0.12)',
                display: 'grid',
                gap: 24,
                textAlign: 'center',
                margin: 0
              }}>
                  <DialogHeader>
                    <DialogTitle>
                      {creditDialogState === 'approved' ? 'Pagamento aprovado' : creditDialogState === 'processing' ? 'Processando pagamento' : 'Erro no pagamento'}
                    </DialogTitle>
                    <DialogDescription>
                      {creditDialogState === 'approved'
                        ? 'O pagamento foi aprovado com sucesso.'
                        : creditDialogState === 'processing'
                        ? 'Aguarde enquanto confirmamos o pagamento com o banco. Este modal permanecerá aberto até que a transação seja processada.'
                        : 'Ocorreu um problema ao processar o pagamento. Verifique os dados do cartão e tente novamente.'}
                    </DialogDescription>
                  </DialogHeader>

                  <div style={{ display: 'grid', gap: 18, textAlign: 'center', alignItems: 'center' }}>
                    <div style={{ display: 'grid', placeItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 92,
                        height: 92,
                        borderRadius: '50%',
                        display: 'grid',
                        placeItems: 'center',
                        background: creditDialogState === 'approved' ? '#dcfce7' : creditDialogState === 'processing' ? '#eff6ff' : '#fee2e2',
                        border: creditDialogState === 'approved' ? '2px solid #22c55e' : creditDialogState === 'processing' ? '2px solid #3b82f6' : '2px solid #ef4444',
                        margin: '0 auto'
                      }}>
                        <span style={{ fontSize: 42, color: creditDialogState === 'approved' ? '#16a34a' : creditDialogState === 'processing' ? '#1d4ed8' : '#b91c1c' }}>
                          {creditDialogState === 'approved' ? '✓' : creditDialogState === 'processing' ? '⏳' : '✕'}
                        </span>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: creditDialogState === 'approved' ? '#166534' : creditDialogState === 'processing' ? '#1d4ed8' : '#991b1b' }}>
                        {creditDialogState === 'approved' ? 'Aprovado' : creditDialogState === 'processing' ? 'Em processamento' : 'Pagamento não aprovado'}
                      </div>
                    </div>

                    {creditDialogMessage && (
                      <div style={{ fontSize: 14, color: 'var(--color-foreground)', lineHeight: 1.6 }}>
                        {creditDialogMessage}
                      </div>
                    )}
                  </div>

                  <DialogFooter>
                    {(creditDialogState === 'approved' || creditDialogState === 'error') && (
                      <button
                        type="button"
                        onClick={closeCreditDialog}
                        style={primaryButtonStyle()}
                      >
                        Fechar
                      </button>
                    )}
                  </DialogFooter>
                </div>
            </DialogContent>
          </Dialog>
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

function paymentMethodOptionStyle(selected: boolean): CSSProperties {
  return {
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    minHeight: 44,
    padding: "10px 14px",
    borderRadius: 8,
    border: selected ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
    background: "var(--color-card)",
    color: selected ? "var(--color-primary)" : "var(--color-foreground)",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: selected ? "0 0 0 3px color-mix(in srgb, var(--color-primary) 18%, transparent)" : "0 4px 12px rgba(0,0,0,0.05)",
    transition: "all 0.2s ease"
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

function formatBRL(value: string): string {
  const numericValue = Number(value)
  if (Number.isNaN(numericValue)) return "R$ 0,00"

  return numericValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  })
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
