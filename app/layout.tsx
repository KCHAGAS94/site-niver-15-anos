import type { Metadata } from 'next'
import { Poppins, Great_Vibes } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { SequentialImageProvider } from '@/components/sequential-image-provider'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
})

const greatVibes = Great_Vibes({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-great-vibes',
})

export const metadata: Metadata = {
  title: 'Meus 15 Anos | Vitória',
  description: 'Celebração dos 15 anos da Vitória - Um momento especial para marcar essa data inesquecível',
  generator: 'v0.app',
  icons: {
    icon: '/icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="bg-background">
      <body className={`${poppins.variable} ${greatVibes.variable} font-sans antialiased`}>
        <SequentialImageProvider>
          {children}
        </SequentialImageProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
