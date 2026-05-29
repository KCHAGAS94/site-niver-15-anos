import { Navigation } from "@/components/navigation"
import { HeroSection } from "@/components/hero-section"
import { AboutSection } from "@/components/about-section"
import { GallerySection } from "@/components/gallery-section"
import { GiftListSection } from "@/components/gift-list-section"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <main id="inicio" className="min-h-screen">
      <Navigation />
      <HeroSection />
      <AboutSection />
      <GallerySection />
      <GiftListSection />
      <Footer />
    </main>
  )
}
