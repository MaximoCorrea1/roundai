import type { Metadata } from 'next'
import { Bricolage_Grotesque, Hanken_Grotesk, Spline_Sans_Mono } from 'next/font/google'
import './globals.css'

// Display — characterful, the roundai personality. Variable font: NO `weight` key
// (passing weights to a variable-only Google font throws at build time).
const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

// Body — refined, non-generic humanist sans (NOT Inter/Roboto/system). Has its
// own tabular figures, but money amounts use the mono below for guaranteed alignment.
const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

// Money — monospaced so every ARS column locks to the same advance width.
const splineMono = Spline_Sans_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'roundai — el copiloto financiero embebido en tu billetera',
  description:
    'roundai es la capa de inversión con IA que las billeteras enchufan: redondeo automático + un coach que te conoce.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="es"
      className={`${bricolage.variable} ${hanken.variable} ${splineMono.variable}`}
    >
      <body>{children}</body>
    </html>
  )
}
