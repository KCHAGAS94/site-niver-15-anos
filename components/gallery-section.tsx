"use client"

import { useState, useCallback, useEffect } from "react"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { ChevronLeft, ChevronRight, Camera } from "lucide-react"
import { cn } from "@/lib/utils"

const placeholderImages = [
  { id: 1, alt: "Momento especial 1" },
  { id: 2, alt: "Momento especial 2" },
  { id: 3, alt: "Momento especial 3" },
  { id: 4, alt: "Momento especial 4" },
  { id: 5, alt: "Momento especial 5" },
  { id: 6, alt: "Momento especial 6" },
]

export function GallerySection() {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { 
      loop: true, 
      align: "center",
      slidesToScroll: 1,
    },
    [Autoplay({ delay: 4000, stopOnInteraction: false })]
  )
  
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi])
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
    setCanScrollPrev(emblaApi.canScrollPrev())
    setCanScrollNext(emblaApi.canScrollNext())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on("select", onSelect)
    emblaApi.on("reInit", onSelect)
  }, [emblaApi, onSelect])

  return (
    <section id="galeria" className="relative bg-muted/50 py-20 md:py-32">
      <div className="container mx-auto px-4">
        {/* Section Title */}
        <div className="mb-12 text-center">
          <span className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
            Galeria
          </span>
          <h2 className="mt-4 font-serif text-4xl text-foreground md:text-5xl lg:text-6xl">
            Momentos Especiais
          </h2>
          <div className="mx-auto mt-4 flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-primary md:w-20" />
            <Camera className="h-5 w-5 text-primary" />
            <span className="h-px w-12 bg-primary md:w-20" />
          </div>
        </div>

        {/* Navigation Arrows */}
        <div className="mb-6 flex items-center justify-center gap-4">
          <button
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary text-primary transition-all hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
            aria-label="Imagem anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={scrollNext}
            disabled={!canScrollNext}
            className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary text-primary transition-all hover:bg-primary hover:text-primary-foreground disabled:opacity-50"
            aria-label="Próxima imagem"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Carousel */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4">
            {placeholderImages.map((image, index) => (
              <div
                key={image.id}
                className={cn(
                  "relative min-w-0 flex-[0_0_80%] md:flex-[0_0_45%] lg:flex-[0_0_30%] transition-all duration-300",
                  selectedIndex === index ? "scale-100 opacity-100" : "scale-95 opacity-70"
                )}
              >
                <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-card shadow-lg">
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
                    <div className="text-center">
                      <Camera className="mx-auto h-8 w-8 text-primary/40" />
                      <p className="mt-2 text-xs text-muted-foreground">{image.alt}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots Indicator */}
        <div className="mt-8 flex items-center justify-center gap-2">
          {placeholderImages.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={cn(
                "h-2 w-2 rounded-full transition-all",
                selectedIndex === index
                  ? "w-6 bg-primary"
                  : "bg-primary/30 hover:bg-primary/50"
              )}
              aria-label={`Ir para imagem ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
