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
    name: "Noite de Stand-up Comedy",
    description: "Uma noite leve e divertida para dar boas risadas",
    price: 99.9,
    category: "Lazer",
    image: "/img/presente/Noite de Stand-up Comedy.png",
  },
  {
    id: 2,
    name: "Workshop de Automaquiagem",
    description: "Experiência de beleza e técnicas de automaquiagem",
    price: 69.9,
    category: "Beleza",
    image: "/img/presente/Workshop de Automaquiagem.png",
  },
  {
    id: 3,
    name: "Passeio no Shopping (Crédito/Experiência)",
    description: "Um passeio com crédito para aproveitar como quiser",
    price: 139.9,
    category: "Experiência",
    image: "/img/presente/Passeio no Shopping.png",
  },
  {
    id: 4,
    name: "Oficina de Culinária",
    description: "Uma oficina para aprender e se divertir na cozinha",
    price: 84.9,
    category: "Gastronomia",
    image: "/img/presente/Oficina de Culinária.png",
  },
  {
    id: 5,
    name: "Ensaio Fotográfico",
    description: "Uma experiência para registrar momentos especiais",
    price: 179.9,
    category: "Fotografia",
    image: "/img/presente/Ensaio Fotográfico.png",
  },
  {
    id: 6,
    name: "Aula de Dança",
    description: "Uma experiência animada para se movimentar e aprender",
    price: 109.9,
    category: "Lazer",
    image: "/img/presente/Aula de Dança.png",
  },
  {
    id: 7,
    name: "Tarde de Cinema",
    description: "Uma tarde especial para aproveitar um bom filme",
    price: 74.9,
    category: "Lazer",
    image: "/img/presente/Tarde de Cinema.png",
  },
  {
    id: 8,
    name: "Dia de Salão",
    description: "Um dia completo de cuidados e beleza",
    price: 159.9,
    category: "Beleza",
    image: "/img/presente/Dia de Salão.png",
  },
  {
    id: 9,
    name: "Vale-presente Restaurante",
    description: "Um vale para uma refeição especial",
    price: 124.9,
    category: "Gastronomia",
    image: "/img/presente/Vale-presente Restaurante.jpg",
  },
  {
    id: 10,
    name: "Workshop Design de Sobrancelhas",
    description: "Experiência de design de sobrancelhas com estilo",
    price: 94.9,
    category: "Beleza",
    image: "/img/presente/Workshop Design de Sobrancelhas.png",
  },
  {
    id: 11,
    name: "1 Dia de Hotel (Day Use)",
    description: "Um dia especial de descanso e conforto",
    price: 189.9,
    category: "Hospedagem",
    image: "/img/presente/1 Dia de Hotel.jpg",
  },
  {
    id: 12,
    name: "Câmera Fotográfica (Locação/Experiência)",
    description: "Uma experiência especial para registrar momentos",
    price: 79.9,
    category: "Fotografia",
    image: "/img/presente/camera-fotografica.jpg",
  },
  {
    id: 13,
    name: "1 Dia de \"Sim\" dos Pais",
    description: "Um dia para realizar desejos e viver experiências especiais",
    price: 129.9,
    category: "Experiência",
    image: "/img/presente/1 Dia de Sim dos Pais.png",
  },
  {
    id: 14,
    name: "Dia de Spa",
    description: "Relaxamento e cuidados pessoais",
    price: 174.9,
    category: "Bem-estar",
    image: "/img/presente/Dia de Spa.jpg",
  },
  {
    id: 15,
    name: "Sessão de Manicure",
    description: "Um momento de autocuidado e beleza",
    price: 89.9,
    category: "Beleza",
    image: "/img/presente/Sessão de Manicure.png",
  },
  {
    id: 16,
    name: "Rodízio de Japonês",
    description: "Uma experiência gastronômica especial",
    price: 149.9,
    category: "Gastronomia",
    image: "/img/presente/Rodízio de Japonês.png",
  },
  {
    id: 17,
    name: "Passeio de Trilha",
    description: "Um passeio ao ar livre para curtir a natureza",
    price: 119.9,
    category: "Passeio",
    image: "/img/presente/Passeio de Trilha.png",
  },
  {
    id: 18,
    name: "Dia de Parque de Diversões",
    description: "Um dia cheio de diversão e aventura",
    price: 169.9,
    category: "Lazer",
    image: "/img/presente/Dia de Parque de Diversões.jpg",
  },
  {
    id: 19,
    name: "Teste de Pagamento",
    description: "Item para validação de chave de pagamento",
    price: 1.0,
    category: "Teste",
    image: "/img/presente/Dia de Parque de Diversões.jpg",
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
                  "group relative flex h-full flex-col overflow-hidden rounded-2xl bg-card p-6 shadow-lg transition-all duration-300 hover:shadow-xl",
                  isSelected && "ring-2 ring-primary"
                )}
              >
                {/* Category Badge */}
                <span className="absolute right-4 top-4 z-10 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground shadow-md">
                  {gift.category}
                </span>

                {/* Gift Image */}
                <div className="relative mb-4 h-48 w-full overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 to-accent/10">
                  <Image
                    src={gift.image}
                    alt={gift.name}
                    fill
                    unoptimized={gift.name === "Câmera Fotográfica (Locação/Experiência)"}
                    className="object-cover transition-transform group-hover:scale-110"
                  />
                </div>

                <div className="flex flex-1 flex-col">
                  {/* Gift Info */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-card-foreground">
                      {gift.name}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {gift.description}
                    </p>
                  </div>

                  {/* Price */}
                  <p className="mt-6 font-serif text-2xl text-primary">
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
