"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "#inicio", label: "INÍCIO" },
  { href: "#sobre", label: "SOBRE" },
  { href: "#galeria", label: "GALERIA" },
  { href: "#presentes", label: "PRESENTES" },
]

export function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const isHomePage = pathname === "/"

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Se não estiver na home, sempre mostrar header com fundo
  const showSolidHeader = !isHomePage || isScrolled

  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-50 transition-all duration-300",
        showSolidHeader
          ? "bg-background/95 shadow-lg backdrop-blur-md"
          : "bg-transparent"
      )}
    >
      <nav className="container mx-auto flex items-center justify-between px-4 py-4">
        {/* Logo */}
        <a
          href={isHomePage ? "#inicio" : "/"}
          className={cn(
            "font-serif text-2xl transition-colors",
            showSolidHeader ? "text-primary" : "text-white"
          )}
        >
          Vitória
        </a>

        {/* Desktop Navigation */}
        <ul className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <li key={item.href}>
              <a
                href={isHomePage ? item.href : `/${item.href}`}
                className={cn(
                  "text-sm font-medium uppercase tracking-wider transition-colors hover:text-primary",
                  showSolidHeader ? "text-foreground" : "text-white"
                )}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className={cn(
            "md:hidden",
            showSolidHeader ? "text-foreground" : "text-white"
          )}
          aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      <div
        className={cn(
          "absolute left-0 right-0 top-full bg-background/95 shadow-lg backdrop-blur-md transition-all duration-300 md:hidden",
          isMobileMenuOpen
            ? "visible opacity-100"
            : "invisible opacity-0"
        )}
      >
        <ul className="container mx-auto flex flex-col px-4 py-4">
          {navItems.map((item) => (
            <li key={item.href}>
              <a
                href={isHomePage ? item.href : `/${item.href}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block py-3 text-center text-sm font-medium uppercase tracking-wider text-foreground transition-colors hover:text-primary"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </header>
  )
}
