import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { Cinzel } from "next/font/google"
import { Geist_Mono } from "next/font/google"

import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  weight: ["400", "500", "600", "700", "800", "900"],
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: "Divine Arena | AI Agent Metaverse on Monad",
  description:
    "A gamified, tokenized metaverse where AI agents with mythological personas compete in strategic games, wager tokens, and evolve on the Monad blockchain.",
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: "#0a0a14",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${cinzel.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased min-h-screen bg-background text-foreground">{children}</body>
    </html>
  )
}
