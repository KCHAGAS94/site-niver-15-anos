"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Gift, Heart, ExternalLink, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Image from "next/image"

interface GiftItem {
  id: number
  name: string
  description: string
  price: number
  category: string
  image: string
}

const giftList: GiftItem[] = [
  {
    id: 1,
    name: "1 Dia no Quiosque",
    description: "Um dia relaxante no quiosque à beira-mar",
    price: 1.00,
    category: "Lazer",
    image: "/img/presente/1 dia no quiosque.jpg",
  },
  {
    id: 2,
    name: "3 Cotas para Hotel",
    description: "Contribua com a hospedagem da viagem",
    price: 1.00,
    category: "Hospedagem",
    image: "/img/presente/3 cotas para Hotel.jpg",
  },
  {
    id: 3,
    name: "4 Cotas Combustível",
    description: "Ajude com o combustível para o carro",
    price: 1.00,
    category: "Transporte",
    image: "/img/presente/4 cotas Combustível para o carro.jpg",
  },
  {
    id: 4,
    name: "4 Cotas Aluguel de Carro",
    description: "Contribua com o aluguel do carro",
    price: 1.00,
    category: "Transporte",
    image: "/img/presente/4 cotas para Aluguel de carro.jpg",
  },
  {
    id: 5,
    name: "Aulas de Surf",
    description: "Aulas para aprender a surfar",
    price: 1.00,
    category: "Esporte",
    image: "/img/presente/Aulas de surf.jpg",
  },
  {
    id: 6,
    name: "Café da Manhã",
    description: "Um delicioso café da manhã especial",
    price: 1.00,
    category: "Gastronomia",
    image: "/img/presente/Café da manhã.jpg",
  },
  {
    id: 7,
    name: "Câmera Fotográfica",
    description: "Para registrar todos os momentos",
    price: 1.00,
    category: "Fotografia",
    image: "/img/presente/Câmera fotográfica.jpg",
  },
  {
    id: 8,
    name: "Teatro Interativo",
    description: "Ingresso para experiência teatral única",
    price: 1.00,
    category: "Cultura",
    image: "/img/presente/Ingresso para o teatro interativo.jpg",
  },
  {
    id: 9,
    name: "Ingressos para Festa",
    description: "Ingressos para uma festa incrível",
    price: 1.00,
    category: "Lazer",
    image: "/img/presente/Ingressos para uma festa.jpg",
  },
  {
    id: 10,
    name: "Parque de Diversões",
    description: "Um dia cheio de diversão e aventura",
    price: 1.00,
    category: "Lazer",
    image: "/img/presente/Parque de diversões.jpg",
  },
  {
    id: 11,
    name: "Passeio de Lancha",
    description: "Aventura emocionante pelas águas",
    price: 1.00,
    category: "Passeio",
    image: "/img/presente/Passeio de lancha.jpg",
  },
  {
    id: 12,
    name: "Seguro de Viagem",
    description: "Proteção e tranquilidade na viagem",
    price: 1.00,
    category: "Segurança",
    image: "/img/presente/Seguro de viagem.jpg",
  },
  {
    id: 13,
    name: "Show ou Concerto",
    description: "Ingresso para show ao vivo",
    price: 1.00,
    category: "Cultura",
    image: "/img/presente/Show ou concerto ao vivo.jpg",
  },
  {
    id: 14,
    name: "Traslado para Hotel",
    description: "Transporte confortável até o hotel",
    price: 1.00,
    category: "Transporte",
    image: "/img/presente/Traslado para o hotel.jpg",
  },
  {
    id: 15,
    name: "Um Dia no Spa",
    description: "Relaxamento e cuidados pessoais",
    price: 1.00,
    category: "Bem-estar",
    image: "/img/presente/Um dia no spa.jpg",
  },
  {
    id: 16,
    name: "Vale-presente Restaurante",
    description: "Para uma refeição especial",
    price: 1.00,
    category: "Gastronomia",
    image: "/img/presente/Vale-presente para restaurante.jpg",
  },
  {
    id: 17,
    name: "Visita a um Museu",
    description: "Experiência cultural enriquecedora",
    price: 1.00,
    category: "Cultura",
    image: "/img/presente/Visita a um museu.jpg",
  },
  {
    id: 18,
    name: "Óculos de Sol",
    description: "Estilo e proteção para os olhos",
    price: 1.00,
    category: "Acessório",
    image: "/img/presente/Óculos de sol.jpg",
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

                {/* Gift Image */}
                <div className="mb-4 relative h-48 w-full overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
                  <Image
                    src={gift.image}
                    alt={gift.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-110"
                  />
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

      </div>

      {/* Fixed Bottom Summary - Always Visible */}
      <div 
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
          selectedGifts.length > 0 
            ? "translate-y-0 opacity-100" 
            : "translate-y-full opacity-0 pointer-events-none"
        )}
      >
        <div className="bg-gradient-to-t from-background via-background to-background/80 backdrop-blur-sm border-t border-border shadow-2xl">
          <div className="container mx-auto px-4 py-4">
            <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 flex-wrap sm:flex-nowrap">
              {/* Summary Info */}
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                  <Gift className="h-6 w-6 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">
                    {selectedGifts.length} presente{selectedGifts.length > 1 ? "s" : ""} selecionado{selectedGifts.length > 1 ? "s" : ""}
                  </p>
                  <p className="font-serif text-xl text-primary">
                    Total: {formatPrice(
                      selectedGifts.reduce((total, id) => {
                        const gift = giftList.find((g) => g.id === id)
                        return total + (gift?.price || 0)
                      }, 0)
                    )}
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <Button 
                size="lg"
                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg whitespace-nowrap" 
                onClick={() => {
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
                }}
              >
                <ExternalLink className="h-4 w-4" />
                Finalizar Presente
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
