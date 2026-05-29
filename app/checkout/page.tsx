"use client"
import React, { useEffect, useState } from "react"

export default function CheckoutPage(): JSX.Element {
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
  const [loading, setLoading] = useState(false)

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
    }
  }, [])

  async function createPix() {
    setLoading(true)
    setMessage(null)
    setQr(null)
    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, payment_method: "pix", payer: { email, first_name: name }, description: "Presente" })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Erro ao criar PIX")
      const qrBase64 = data?.point_of_interaction?.transaction_data?.qr_code_base64
      const qrCode = data?.point_of_interaction?.transaction_data?.qr_code
      if (qrBase64) setQr(`data:image/png;base64,${qrBase64}`)
      else if (qrCode) setMessage(String(qrCode))
      else setMessage("PIX criado, verifique retorno do servidor.")
    } catch (err: any) {
      setMessage(err?.message ?? String(err))
    } finally {
      setLoading(false)
    }
  }

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
      if (!MercadoPago) throw new Error("SDK MercadoPago não carregado")
      // @ts-ignore
      const mp = new MercadoPago(publicKey)
      const cardData = { cardNumber: cardNumber.replace(/\s+/g, ""), expirationMonth: cardMonth, expirationYear: cardYear, securityCode: cardCvv, cardholderName: name }
      // @ts-ignore
      const tokenResp = await mp.card.createToken(cardData)
      const token = tokenResp?.id || tokenResp?.token || tokenResp?.card_token?.id
      if (!token) throw new Error("Falha ao tokenizar cartão")

      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, payment_method: "card", token, installments: method === "credit" ? installments : 1, payer: { email, first_name: name } })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Erro ao processar cartão")
      setMessage("Pagamento criado: " + (data.status || JSON.stringify(data)))
    } catch (err: any) {
      setMessage(err?.message ?? String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", padding: 36 }}>
      <div style={{ width: "100%", maxWidth: 820 }}>
        <h2 style={{ textAlign: "center", color: "var(--color-primary)", marginBottom: 18 }}>Finalizar Presente</h2>

        <div style={{ background: "var(--color-card)", padding: 24, borderRadius: 12, boxShadow: "0 6px 18px rgba(0,0,0,0.06)" }}>
          <form onSubmit={payCard}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--color-muted-foreground)" }}>Nome completo</label>
                <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle()} required />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, color: "var(--color-muted-foreground)" }}>Email</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle()} required />
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
                <button type="button" onClick={createPix} style={primaryButtonStyle()} disabled={loading}>Gerar QR Code</button>
                <button type="button" onClick={() => setMessage("Salvo (simulado)")} style={secondaryButtonStyle()}>Salvar e Continuar</button>
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
                    <button type="submit" disabled={loading} style={primaryButtonStyle()}>{loading ? "Processando..." : "Pagar"}</button>
                    <button type="button" onClick={() => { setCardNumber(""); setCardMonth(""); setCardYear(""); setCardCvv("") }} style={secondaryButtonStyle()}>Limpar</button>
                  </div>
                </div>
              </div>
            )}
          </form>

          {qr && (
            <div style={{ marginTop: 18, textAlign: "center" }}>
              <h3 style={{ color: "var(--color-primary)" }}>QR Code PIX</h3>
              <img src={qr} alt="PIX QR" style={{ maxWidth: 280, borderRadius: 8, border: "1px solid var(--color-border)" }} />
            </div>
          )}

          {message && <div style={{ marginTop: 12, color: "var(--color-foreground)" }}>{message}</div>}
        </div>
      </div>
    </div>
  )
}

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid var(--color-border)",
    background: "var(--color-input)"
  }
}

function primaryButtonStyle(): React.CSSProperties {
  return {
    background: "var(--color-primary)",
    color: "var(--color-primary-foreground)",
    border: "none",
    padding: "10px 18px",
    borderRadius: 8,
    cursor: "pointer"
  }
}

function secondaryButtonStyle(): React.CSSProperties {
  return {
    background: "transparent",
    color: "var(--color-foreground)",
    border: "1px solid var(--color-border)",
    padding: "10px 18px",
    borderRadius: 8,
    cursor: "pointer"
  }
}
