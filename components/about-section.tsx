"use client"

import { Heart, Star, Sparkles } from "lucide-react"

export function AboutSection() {
  return (
    <section id="sobre" className="relative py-20 md:py-32">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-20 top-20 h-64 w-64 rounded-full bg-primary/5" />
        <div className="absolute -left-20 bottom-20 h-48 w-48 rounded-full bg-accent/5" />
      </div>

      <div className="container relative mx-auto px-4">
        {/* Section Title */}
        <div className="mb-16 text-center">
          <span className="text-sm font-medium uppercase tracking-[0.2em] text-primary">
            Conheça
          </span>
          <h2 className="mt-4 font-serif text-4xl text-foreground md:text-5xl lg:text-6xl">
            Sobre a Vitória
          </h2>
          <div className="mx-auto mt-4 flex items-center justify-center gap-3">
            <span className="h-px w-12 bg-primary md:w-20" />
            <Heart className="h-5 w-5 fill-primary text-primary" />
            <span className="h-px w-12 bg-primary md:w-20" />
          </div>
        </div>

        {/* Content Grid */}
        <div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-2 md:items-center">
          {/* Foto da Vitória */}
          <div className="relative mx-auto w-full max-w-sm">
            <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 shadow-2xl">
              <img 
                src="/img/foto1.png"
                alt="Foto da Vitória"
                className="h-full w-full object-cover object-top"
                loading="lazy"
              />
            </div>
            {/* Decorative frame */}
            <div className="absolute -bottom-4 -right-4 -z-10 h-full w-full rounded-2xl border-2 border-accent/30" />
          </div>

          {/* Text Content */}
          <div className="text-center md:text-left">
            <h3 className="font-serif text-3xl text-primary md:text-4xl">
              Vitória
            </h3>
            <div className="mt-2 flex items-center justify-center gap-2 text-accent md:justify-start">
              <Star className="h-4 w-4 fill-accent" />
              <span className="text-sm font-medium">15 Anos</span>
              <Star className="h-4 w-4 fill-accent" />
            </div>
            
            <p className="mt-6 leading-relaxed text-muted-foreground">
              Chegou o momento mais esperado! Depois de 15 anos de muitas conquistas, 
              aprendizados e momentos inesquecíveis, é hora de celebrar essa nova fase da vida.
            </p>
            
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Uma menina cheia de sonhos, alegria e determinação, que está pronta para 
              abraçar o mundo com todo o seu brilho e encanto.
            </p>

            <p className="mt-4 leading-relaxed text-muted-foreground">
              Esta festa marca o início de uma nova etapa, repleta de esperanças e 
              possibilidades.
            </p>

            {/* Stats */}
            <div className="mt-8 flex justify-center gap-8 md:justify-start">
              <div className="text-center">
                <span className="font-serif text-3xl text-primary">15</span>
                <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">Anos</p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="text-center">
                <span className="font-serif text-3xl text-primary">∞</span>
                <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">Sonhos</p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div className="text-center">
                <span className="font-serif text-3xl text-primary">1</span>
                <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">Capítulo</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
