import Link from 'next/link'
import { getSession } from '@/lib/auth'
import { LogoutButton } from './logout-button'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // middleware.ts에서 인증 처리, 여기서는 세션 데이터만 읽음
  const session = await getSession()

  // 로그인 페이지는 별도 렌더링 (네비게이션 없음)
  if (!session.isLoggedIn) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-bold text-gray-900 hover:text-blue-700 transition-colors whitespace-nowrap">
              장학금 관리시스템
            </Link>
            <Link href="/admin/applications" className="text-sm text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap">
              신청 목록
            </Link>
            <Link href="/admin/scholarships" className="text-sm text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap">
              장학 프로그램
            </Link>
            <Link href="/admin/import" className="text-sm text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap">
              신청서 가져오기
            </Link>
            <Link href="/admin/announcements" className="text-sm text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap">
              공고문 관리
            </Link>
            <Link href="/admin/search" className="text-sm text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap">
              수령 조회
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{session.name} 님</span>
            <LogoutButton />
          </div>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
