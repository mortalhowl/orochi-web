import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider" // Import provider

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Orochi Web",
  description: "Trang web chính thức của Orochi",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Thêm suppressHydrationWarning để tránh lỗi khi next-themes
    // thay đổi class trên <html>
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class" // Thuộc tính để thêm class (<html>)
          defaultTheme="system" // Theme mặc định (theo hệ thống)
          enableSystem // Cho phép dùng theme hệ thống
          disableTransitionOnChange // Tắt transition khi đổi theme
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}