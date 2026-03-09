import type { Metadata, Viewport } from "next"
import { Plus_Jakarta_Sans, Geist } from "next/font/google"
import "./globals.css"
import { TRPCProvider } from "@/lib/trpc/provider"
import { cn } from "@/lib/utils"
import { ServiceWorkerRegister } from "@/components/shared/ServiceWorkerRegister"

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["300", "400", "500", "600", "700", "800"],
})

export const metadata: Metadata = {
  title: "Concretiza",
  description: "Gestão de obras e diário de obra para construtoras",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Concretiza" },
  icons: {
    icon: [
      { url: "/icons/icon-192", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-192.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/icons/icon-192", sizes: "192x192", type: "image/png" },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: "#f97316",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className={`${jakarta.variable} font-sans antialiased`}>
        <TRPCProvider>{children}</TRPCProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
