"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Gift, Heart, ExternalLink, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface GiftItem {
  id: number
  name: string
  description: string
  price: number
  category: string
}

const giftList: GiftItem[] = [
  {
    id: 1,
    name: "Fone de Ouvido Bluetooth",
    description: "Fone sem fio com cancelamento de ruído",
    price: 299.90,
    category: "Tecnologia",
  },
  {
    id: 2,
    name: "Kit de Maquiagem",
    description: "Paleta completa de sombras e batons",
    price: 189.90,
    category: "Beleza",
  },
  {
    id: 3,
    name: "Câmera Instax",
    description: "Câmera instantânea para fotos divertidas",
    price: 449.90,
    category: "Fotografia",
  },
  {
    id: 4,
    name: "Caixa de Som Portátil",
    description: "Som potente e portátil para festas",
    price: 349.90,
    category: "Tecnologia",
  },
  {
    id: 5,
    name: "Kit Skincare",
    description: "Produtos para cuidados com a pele",
    price: 159.90,
    category: "Beleza",
  },
  {
    id: 6,
    name: "Relógio Smartwatch",
    description: "Relógio inteligente com várias funções",
    price: 599.90,
    category: "Tecnologia",
  },
]

export function GiftListSection() {
  const [selectedGifts, setSelectedGifts] = useState<number[]>([])
  const router = useRouter()

  const toggleGift = (id: number) => {
    setSelectedGifts((prev) => {
      const next = prev.includes(id) ? prev.filter((giftId) => giftId !== id) : [...prev, id]
      try { console.debug('[GiftList] toggleGift', { id, before: prev, after: next }) } catch (e) {}
      return next
    })
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price)
  }

  return (
    <section id="presentes" className="relative py-20 md:py-32">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="container relative mx-auto px-4">
        {/* Section Title */}
        <div className="mb-6 text-center">
          <span className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
            Lista de Presentes
          </span>
          <h2 className="mt-4 font-serif text-4xl text-foreground md:text-5xl lg:text-6xl">
            Escolha um Presente
          </h2>
          <div className="mx-auto mt-4 flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-primary md:w-20" />
            <Gift className="h-5 w-5 text-primary" />
            <span className="h-px w-12 bg-primary md:w-20" />
          </div>
        </div>

        <p className="mx-auto mb-12 max-w-2xl text-center text-muted-foreground">
          Se você deseja me presentear neste dia tão especial, aqui estão algumas sugestões. 
          Sua presença já é o maior presente, mas se quiser contribuir, ficarei muito feliz!
        </p>

        {/* Gift Grid */}
        <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {giftList.map((gift) => {
            const isSelected = selectedGifts.includes(gift.id)
            return (
              <div
                key={gift.id}
                className={cn(
                  "group relative overflow-hidden rounded-2xl bg-card p-6 shadow-lg transition-all duration-300 hover:shadow-xl",
                  isSelected && "ring-2 ring-primary"
                )}
              >
                {/* Category Badge */}
                <span className="absolute right-4 top-4 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                  {gift.category}
                </span>

                {/* Gift Icon Placeholder */}
                <div className="mb-4 flex h-32 w-full items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
                  <Gift className="h-12 w-12 text-primary/40 transition-transform group-hover:scale-110" />
                </div>

                {/* Gift Info */}
                <h3 className="text-lg font-semibold text-card-foreground">
                  {gift.name}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {gift.description}
                </p>

                {/* Price */}
                <p className="mt-4 font-serif text-2xl text-primary">
                  {formatPrice(gift.price)}
                </p>

                {/* Action Button */}
                <Button
                  onClick={() => toggleGift(gift.id)}
                  className={cn(
                    "mt-4 w-full gap-2 transition-all",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground"
                  )}
                >
                  {isSelected ? (
                    <>
                      <Check className="h-4 w-4" />
                      Selecionado
                    </>
                  ) : (
                    <>
                      <Heart className="h-4 w-4" />
                      Presentear
                    </>
                  )}
                </Button>
              </div>
            )
          })}
        </div>

        {/* Selected Gifts Summary */}
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', right: 0, top: -40, color: 'var(--color-muted-foreground)', fontSize: 13 }}>
            {/* debug visible counter */}
            Selecionados: {selectedGifts.length}
          </div>
        </div>

        {selectedGifts.length > 0 && (
          <div className="mx-auto mt-12 max-w-lg rounded-2xl bg-primary/10 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Você selecionou {selectedGifts.length} presente{selectedGifts.length > 1 ? "s" : ""}
            </p>
            <p className="mt-2 font-serif text-2xl text-primary">
              Total:{" "}
              {formatPrice(
                selectedGifts.reduce((total, id) => {
                  const gift = giftList.find((g) => g.id === id)
                  return total + (gift?.price || 0)
                }, 0)
              )}
            </p>
            <Button className="mt-4 gap-2 bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => {
              const total = selectedGifts.reduce((total, id) => {
                const gift = giftList.find((g) => g.id === id)
                return total + (gift?.price || 0)
              }, 0)
              try {
                sessionStorage.setItem('checkoutSelection', JSON.stringify({ items: selectedGifts, total }))
              } catch (e) {
                // ignore
              }
              router.push('/checkout')
            }}>
              <ExternalLink className="h-4 w-4" />
              Finalizar Presente
            </Button>
          </div>
        )}
      </div>
    </section>
  )
}
