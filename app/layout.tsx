import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '교회 장학금 신청',
  description: '교회 장학금 신청 시스템',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  )
}
