import { Heart, Instagram, Mail } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-primary py-12 text-primary-foreground">
      <div className="container mx-auto px-4 text-center">
        {/* Logo */}
        <h2 className="font-serif text-4xl">Vitória</h2>
        <p className="mt-2 text-sm opacity-80">Meus 15 Anos</p>

        {/* Decorative Line */}
        <div className="mx-auto my-6 flex items-center justify-center gap-3">
          <span className="h-px w-16 bg-primary-foreground/30" />
          <Heart className="h-4 w-4 fill-current" />
          <span className="h-px w-16 bg-primary-foreground/30" />
        </div>

        {/* Social Links */}
        <div className="flex items-center justify-center gap-4">
          <a
            href="#"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-primary-foreground/30 transition-all hover:bg-primary-foreground hover:text-primary"
            aria-label="Instagram"
          >
            <Instagram className="h-5 w-5" />
          </a>
          <a
            href="#"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-primary-foreground/30 transition-all hover:bg-primary-foreground hover:text-primary"
            aria-label="Email"
          >
            <Mail className="h-5 w-5" />
          </a>
        </div>

        {/* Copyright */}
        <p className="mt-8 text-xs opacity-60">
          © 2024 Todos os direitos reservados
        </p>
        <p className="mt-1 text-xs opacity-60">
          Feito com <Heart className="inline-block h-3 w-3 fill-current" /> para a Vitória
        </p>
      </div>
    </footer>
  )
}
