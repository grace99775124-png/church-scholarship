'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'

function SuccessContent() {
  const params = useSearchParams()
  const token = params.get('token')
  const recommendUrl = token ? `${typeof window !== 'undefined' ? window.location.origin : ''}/recommend/${token}` : null

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border shadow-sm p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">✅</div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">신청이 완료되었습니다</h1>
          <p className="text-sm text-gray-500" style={{ wordBreak: 'keep-all' }}>
            장학금 신청이 접수되었습니다. 검토 후 연락드리겠습니다.
          </p>
        </div>

        {token && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <p className="text-sm font-semibold text-blue-800 mb-2">📨 추천서 작성 안내</p>
            <p className="text-xs text-blue-700 mb-3" style={{ wordBreak: 'keep-all' }}>
              추천인(담임교사·담당교역자)에게 아래 링크를 전달해 주세요.
              추천인이 직접 온라인으로 추천서를 작성할 수 있습니다.
            </p>
            <div className="bg-white border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-900 break-all font-mono mb-2">
              {`${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/recommend/${token}`}
            </div>
            <button
              onClick={() => {
                const url = `${window.location.origin}/recommend/${token}`
                navigator.clipboard?.writeText(url)
                  .then(() => alert('링크가 복사되었습니다.'))
                  .catch(() => {})
              }}
              className="text-xs text-blue-600 hover:underline"
            >
              링크 복사하기
            </button>
          </div>
        )}

        <Link
          href="/"
          className="block text-center bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          처음으로 돌아가기
        </Link>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}
