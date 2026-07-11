"use client"

import { MapPin, Navigation as NavigationIcon } from "lucide-react"

export function LocationSection() {
  return (
    <section id="local" className="relative py-20 md:py-32">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-accent/5" />
        <div className="absolute -right-20 bottom-10 h-48 w-48 rounded-full bg-primary/5" />
      </div>

      <div className="container relative mx-auto px-4">
        {/* Section Title */}
        <div className="mb-12 text-center">
          <span className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
            Onde Será
          </span>
          <h2 className="mt-4 font-serif text-4xl text-foreground md:text-5xl lg:text-6xl">
            Local da Celebração
          </h2>
          <div className="mx-auto mt-4 flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-primary md:w-20" />
            <MapPin className="h-5 w-5 text-primary" />
            <span className="h-px w-12 bg-primary md:w-20" />
          </div>
        </div>

        <p className="mx-auto mb-10 max-w-2xl text-center text-muted-foreground">
          Venha celebrar comigo o início de uma nova etapa, em um lugar especial
          preparado para esse momento tão importante da minha vida.
        </p>

        <div className="mx-auto max-w-xl rounded-2xl bg-card p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <MapPin className="h-7 w-7 text-primary" />
          </div>
          <h3 className="font-serif text-2xl text-card-foreground md:text-3xl">
            Sítio do Labruna
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">Portal da Serra</p>

          <a
            href="https://maps.app.goo.gl/kYJWcapGoeUhazj48"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-md transition-all hover:bg-primary/90 hover:shadow-lg"
          >
            <NavigationIcon className="h-4 w-4" />
            Clique para iniciar a rota
          </a>
        </div>
      </div>
    </section>
  )
}
