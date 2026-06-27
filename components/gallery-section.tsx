"use client"


import { useRef, useContext } from "react"
import { ImageSequenceContext } from "./sequential-image-provider"
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation, Pagination, Autoplay } from "swiper/modules"
import "swiper/css"
import "swiper/css/navigation"
import "swiper/css/pagination"
import { ChevronLeft, ChevronRight, Camera } from "lucide-react"

const galleryImages = [
  { src: "/img/vitoria/vitoria (1).jpeg", alt: "Momento especial 1" },
  { src: "/img/vitoria/vitoria (2).jpeg", alt: "Momento especial 2" },
  { src: "/img/vitoria/vitoria (3).jpeg", alt: "Momento especial 3" },
  { src: "/img/vitoria/vitoria (4).jpeg", alt: "Momento especial 4" },
  { src: "/img/vitoria/vitoria (5).jpeg", alt: "Momento especial 5" },
  { src: "/img/vitoria/vitoria (6).jpeg", alt: "Momento especial 6" },
  { src: "/img/vitoria/vitoria (7).jpeg", alt: "Momento especial 7" },
  { src: "/img/vitoria/vitoria (8).jpeg", alt: "Momento especial 8" },
  { src: "/img/vitoria/vitoria (9).jpeg", alt: "Momento especial 9" },
  { src: "/img/vitoria/vitoria (10).jpeg", alt: "Momento especial 10" },
  { src: "/img/vitoria/vitoria (11).jpeg", alt: "Momento especial 11" },
  { src: "/img/vitoria/vitoria (12).jpeg", alt: "Momento especial 12" },
]

export function GallerySection() {
  const swiperRef = useRef(null)
  const { galleryLoaded, galleryLoadedCount } = useContext(ImageSequenceContext)
  const visibleImages = galleryLoadedCount > 0 ? galleryImages.slice(0, galleryLoadedCount) : []
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

        {/* Carousel Swiper */}
        <div className={`transition-opacity duration-700 ${galleryLoaded ? 'opacity-100' : galleryLoadedCount > 0 ? 'opacity-100' : 'opacity-0'}`}>
        {visibleImages.length === 0 ? (
          <div className="w-full max-w-[400px] mx-auto aspect-[3/4] rounded-2xl bg-card flex items-center justify-center">
            <Camera className="h-10 w-10 text-primary/60" />
          </div>
        ) : (
          <Swiper
          ref={swiperRef}
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={24}
          slidesPerView={1}
          loop={true}
          centeredSlides={true}
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          navigation={{
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
          }}
          pagination={{ clickable: true, el: '.swiper-pagination' }}
          className="w-full max-w-[400px] mx-auto"
        >
          {visibleImages.map((image, idx) => (
            <SwiperSlide key={image.src + '-' + idx}>
              <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-card shadow-lg">
                <img
                  src={image.src}
                  alt={image.alt}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            </SwiperSlide>
          ))}
          {/* Navigation Arrows */}
          <div className="mb-6 flex items-center justify-center gap-4 mt-6">
            <button
              className="swiper-button-prev flex h-10 w-10 items-center justify-center rounded-full bg-transparent text-primary transition-all hover:bg-primary hover:text-primary-foreground border-0 shadow-none"
              aria-label="Imagem anterior"
            >
              <ChevronLeft className="h-5 w-5 text-white" />
            </button>
            <button
              className="swiper-button-next flex h-10 w-10 items-center justify-center rounded-full bg-transparent text-primary transition-all hover:bg-primary hover:text-primary-foreground border-0 shadow-none"
              aria-label="Próxima imagem"
            >
              <ChevronRight className="h-5 w-5 text-white" />
            </button>
          </div>
          {/* Dots Indicator */}
          <div className="swiper-pagination mt-8 flex items-center justify-center gap-2" />
        </Swiper>
        )}
        </div>
      </div>
    </section>
  )
}
