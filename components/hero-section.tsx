"use client"

import { ChevronDown } from "lucide-react"

import { useContext } from "react"
import { ImageSequenceContext } from "./sequential-image-provider"

export function HeroSection() {
  const { heroLoaded } = useContext(ImageSequenceContext)

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background Image da aniversariante */}
      {/* Background Image da aniversariante */}
      <div className="absolute inset-0">
        <div
          className={`absolute inset-0 bg-cover bg-center bg-no-repeat transition-opacity duration-700 ${heroLoaded ? 'opacity-80' : 'opacity-0'}`}
          style={{ backgroundImage: "url('/img/vitoria/vitoria (8).jpeg')" }}
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex items-center gap-4">
          <span className="h-px w-16 bg-white/60 md:w-24" />
          <span className="text-sm font-light uppercase tracking-[0.3em] text-white/80">
            Celebração Especial
          </span>
          <span className="h-px w-16 bg-white/60 md:w-24" />
        </div>

        <h1 className="font-serif text-5xl text-white drop-shadow-lg md:text-7xl lg:text-8xl">
          Meus 15 Anos
        </h1>

        <div className="mt-6 flex items-center gap-3">
          <span className="h-px w-12 bg-accent md:w-20" />
          <span className="text-accent">✦</span>
          <span className="h-px w-12 bg-accent md:w-20" />
        </div>

        <h2 className="mt-6 font-serif text-4xl text-white drop-shadow-md md:text-6xl lg:text-7xl">
          Vitória
        </h2>

        <p className="mt-8 max-w-md text-sm font-light text-white/90 md:text-base">
          Venha celebrar essa data tão especial comigo!
        </p>

        {/* Scroll Indicator */}
        <a
          href="#sobre"
          className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce cursor-pointer"
        >
          <ChevronDown className="h-8 w-8 text-white/70 transition-colors hover:text-white" />
        </a>
      </div>

      {/* Decorative Elements */}
      <div className="pointer-events-none absolute left-4 top-1/4 opacity-20 md:left-12">
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none" className="text-accent">
          <circle cx="30" cy="30" r="29" stroke="currentColor" strokeWidth="2" />
          <circle cx="30" cy="30" r="20" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>
      <div className="pointer-events-none absolute right-4 top-1/3 opacity-20 md:right-12">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="text-accent">
          <path d="M20 0L23.5 16.5L40 20L23.5 23.5L20 40L16.5 23.5L0 20L16.5 16.5L20 0Z" fill="currentColor" />
        </svg>
      </div>
    </section>
  )
}
