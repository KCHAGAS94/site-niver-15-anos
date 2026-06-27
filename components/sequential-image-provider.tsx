"use client"

import React, { createContext, useEffect, useState } from "react"

interface ImageSequenceContextValue {
  heroLoaded: boolean
  aboutLoaded: boolean
  galleryLoaded: boolean
  galleryLoadedCount: number
  giftLoadedCount: number
}

export const ImageSequenceContext = createContext<ImageSequenceContextValue>({
  heroLoaded: false,
  aboutLoaded: false,
  galleryLoaded: false,
  galleryLoadedCount: 0,
  giftLoadedCount: 0,
})

function loadImage(src: string) {
  return new Promise<void>((resolve) => {
    try {
      const img = new window.Image()
      img.src = src
      if (img.complete) return resolve()
      img.onload = () => resolve()
      img.onerror = () => resolve()
    } catch (e) {
      resolve()
    }
  })
}

// Keep these lists in the same order as the UI so we can preload sequentially
const HERO_SRC = "/img/vitoria/vitoria (8).jpeg"
const ABOUT_SRC = "/img/vitoria/vitoria (12).jpeg"

const GALLERY_IMAGES = [
  "/img/vitoria/vitoria (1).jpeg",
  "/img/vitoria/vitoria (2).jpeg",
  "/img/vitoria/vitoria (3).jpeg",
  "/img/vitoria/vitoria (4).jpeg",
  "/img/vitoria/vitoria (5).jpeg",
  "/img/vitoria/vitoria (6).jpeg",
  "/img/vitoria/vitoria (7).jpeg",
  "/img/vitoria/vitoria (8).jpeg",
  "/img/vitoria/vitoria (9).jpeg",
  "/img/vitoria/vitoria (10).jpeg",
  "/img/vitoria/vitoria (11).jpeg",
  "/img/vitoria/vitoria (12).jpeg",
]

const GIFTS = [
  "/img/presente/Noite de Stand-up Comedy.png",
  "/img/presente/Workshop de Automaquiagem.png",
  "/img/presente/Passeio no Shopping.png",
  "/img/presente/Oficina de Culinária.png",
  "/img/presente/Ensaio Fotográfico.png",
  "/img/presente/Aula de Dança.png",
  "/img/presente/Tarde de Cinema.png",
  "/img/presente/Dia de Salão.png",
  "/img/presente/Vale-presente Restaurante.jpg",
  "/img/presente/Workshop Design de Sobrancelhas.png",
  "/img/presente/1 Dia de Hotel.jpg",
  "/img/presente/camera-fotografica.jpg",
  "/img/presente/1 Dia de Sim dos Pais.png",
  "/img/presente/Dia de Spa.jpg",
  "/img/presente/Sessão de Manicure.png",
  "/img/presente/Rodízio de Japonês.png",
  "/img/presente/Passeio de Trilha.png",
  "/img/presente/Dia de Parque de Diversões.jpg",
  "/img/presente/Dia de Parque de Diversões.jpg",
]

export function SequentialImageProvider({ children }: { children: React.ReactNode }) {
  const [heroLoaded, setHeroLoaded] = useState(false)
  const [aboutLoaded, setAboutLoaded] = useState(false)
  const [galleryLoaded, setGalleryLoaded] = useState(false)
  const [galleryLoadedCount, setGalleryLoadedCount] = useState(0)
  const [giftLoadedCount, setGiftLoadedCount] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function runSequence() {
      // 1) Hero
      await loadImage(HERO_SRC)
      if (cancelled) return
      setHeroLoaded(true)

      // 2) About
      await loadImage(ABOUT_SRC)
      if (cancelled) return
      setAboutLoaded(true)

      // 3) Gallery (preload sequentially) and update count as they load
      for (const src of GALLERY_IMAGES) {
        await loadImage(src)
        if (cancelled) return
        setGalleryLoadedCount((prev) => prev + 1)
      }
      setGalleryLoaded(true)

      // 4) Gifts - preload one by one and expose count
      for (let i = 0; i < GIFTS.length; i++) {
        await loadImage(GIFTS[i])
        if (cancelled) return
        setGiftLoadedCount((prev) => prev + 1)
      }
    }

    runSequence()

    return () => {
      cancelled = true
    }
  }, [])

  // Prevent scrolling while the second section isn't yet ready to be revealed.
  useEffect(() => {
    if (!aboutLoaded) {
      // keep scroll locked until at least the About section is ready
      try {
        document.documentElement.style.overflow = "hidden"
        document.body.style.overflow = "hidden"
      } catch (e) {}
    } else {
      try {
        document.documentElement.style.overflow = ""
        document.body.style.overflow = ""
      } catch (e) {}
    }

    return () => {
      try {
        document.documentElement.style.overflow = ""
        document.body.style.overflow = ""
      } catch (e) {}
    }
  }, [aboutLoaded])

  return (
    <ImageSequenceContext.Provider value={{ heroLoaded, aboutLoaded, galleryLoaded, galleryLoadedCount, giftLoadedCount }}>
      {children}
    </ImageSequenceContext.Provider>
  )
}
