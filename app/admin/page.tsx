import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'

const STATUS_LABELS: Record<string, string> = {
  pending: '검토 중',
  approved: '승인',
  rejected: '반려',
  paid: '지급 완료',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  paid: 'bg-blue-100 text-blue-800',
}

const LEVEL_LABELS: Record<string, string> = {
  primary: '초등',
  middle: '중학',
  high: '고등',
  university: '대학',
}

export default async function AdminDashboardPage() {
  const [{ data: all }, { data: scholarships }] = await Promise.all([
    supabaseAdmin.from('applications').select('*, scholarships(name)').order('created_at', { ascending: false }),
    supabaseAdmin.from('scholarships').select('id, name, amount, is_active').order('created_at'),
  ])

  const applications = all ?? []

  const stats = {
    total: applications.length,
    pending: applications.filter(a => a.status === 'pending').length,
    approved: applications.filter(a => a.status === 'approved').length,
    paid: applications.filter(a => a.status === 'paid').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
    totalPaid: applications
      .filter(a => a.status === 'paid' && a.paid_amount)
      .reduce((sum: number, a: any) => sum + (a.paid_amount ?? 0), 0),
  }

  const recent = applications.slice(0, 8)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <a
          href="/api/applications/export"
          className="flex items-center gap-1.5 bg-green-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          장학생 명단 다운로드 (CSV)
        </a>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: '전체 신청', value: stats.total, color: 'text-gray-900', bg: 'bg-white' },
          { label: '검토 중', value: stats.pending, color: 'text-yellow-700', bg: 'bg-yellow-50' },
          { label: '승인', value: stats.approved, color: 'text-green-700', bg: 'bg-green-50' },
          { label: '지급 완료', value: stats.paid, color: 'text-blue-700', bg: 'bg-blue-50' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl border p-5`}>
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">건</p>
          </div>
        ))}
      </div>

      {/* 지급 총액 */}
      {stats.totalPaid > 0 && (
        <div className="bg-blue-600 text-white rounded-xl p-5 mb-8">
          <p className="text-blue-200 text-sm mb-1">총 지급액</p>
          <p className="text-3xl font-bold">{stats.totalPaid.toLocaleString()}원</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 최근 신청 목록 */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">최근 신청</h2>
            <Link href="/admin/applications" className="text-xs text-blue-600 hover:underline">
              전체보기 →
            </Link>
          </div>
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">이름</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">장학금</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">학기</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500">상태</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recent.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400 text-sm">
                      신청 내역이 없습니다.
                    </td>
                  </tr>
                ) : (
                  recent.map((app: any) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-900">
                        <span className="whitespace-nowrap">{app.student_name}</span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs">
                        <span className="whitespace-nowrap">{app.scholarships?.name ?? '-'}</span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs whitespace-nowrap">
                        {app.year}년 {app.semester}학기
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[app.status] ?? 'bg-gray-100 text-gray-800'}`}>
                          {STATUS_LABELS[app.status] ?? app.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Link href={`/admin/applications/${app.id}`} className="text-xs text-blue-600 hover:underline whitespace-nowrap">
                          보기
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 장학 프로그램 현황 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">장학 프로그램</h2>
            <Link href="/admin/scholarships" className="text-xs text-blue-600 hover:underline">
              관리 →
            </Link>
          </div>
          <div className="bg-white rounded-xl border overflow-hidden">
            {(scholarships ?? []).length === 0 ? (
              <p className="px-4 py-8 text-center text-gray-400 text-sm">등록된 프로그램이 없습니다.</p>
            ) : (
              <div className="divide-y">
                {(scholarships ?? []).map((s: any) => (
                  <div key={s.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 whitespace-nowrap">{s.name}</p>
                      <p className="text-xs text-gray-400 whitespace-nowrap">{s.amount.toLocaleString()}원</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {s.is_active ? '활성' : '비활성'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 빠른 링크 */}
          <div className="mt-4 space-y-2">
            <Link
              href="/admin/applications?status=pending"
              className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 hover:bg-yellow-100 transition-colors"
            >
              <span className="text-sm font-medium text-yellow-800">검토 대기</span>
              <span className="text-lg font-bold text-yellow-800">{stats.pending}건</span>
            </Link>
            <Link
              href="/admin/applications?status=approved"
              className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3 hover:bg-green-100 transition-colors"
            >
              <span className="text-sm font-medium text-green-800">승인 완료</span>
              <span className="text-lg font-bold text-green-800">{stats.approved}건</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
