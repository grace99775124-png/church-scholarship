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

// 학기별 색상 팔레트 — year*2 + semester 순서로 순환
const SEMESTER_PALETTE = [
  { border: 'border-l-blue-500',   bg: 'bg-blue-50',   text: 'bg-blue-100 text-blue-800' },
  { border: 'border-l-emerald-500', bg: 'bg-emerald-50', text: 'bg-emerald-100 text-emerald-800' },
  { border: 'border-l-violet-500', bg: 'bg-violet-50', text: 'bg-violet-100 text-violet-800' },
  { border: 'border-l-orange-500', bg: 'bg-orange-50', text: 'bg-orange-100 text-orange-800' },
  { border: 'border-l-rose-500',   bg: 'bg-rose-50',   text: 'bg-rose-100 text-rose-800' },
  { border: 'border-l-teal-500',   bg: 'bg-teal-50',   text: 'bg-teal-100 text-teal-800' },
  { border: 'border-l-amber-500',  bg: 'bg-amber-50',  text: 'bg-amber-100 text-amber-800' },
  { border: 'border-l-indigo-500', bg: 'bg-indigo-50', text: 'bg-indigo-100 text-indigo-800' },
]

function semesterColor(year: number, semester: number) {
  const idx = ((year - 2020) * 2 + (semester - 1)) % SEMESTER_PALETTE.length
  return SEMESTER_PALETTE[Math.max(0, idx)]
}

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; year?: string; semester?: string }>
}) {
  const { status, year, semester } = await searchParams

  // Distinct years for filter
  const { data: yearRows } = await supabaseAdmin
    .from('applications')
    .select('year')
    .order('year', { ascending: false })
  const years = [...new Set((yearRows ?? []).map((r: any) => r.year as number))]

  let query = supabaseAdmin
    .from('applications')
    .select('*, scholarships(name)')
    .order('year', { ascending: false })
    .order('semester', { ascending: false })
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (year) query = query.eq('year', year)
  if (semester) query = query.eq('semester', semester)

  const { data: applications } = await query
  if (!applications) return <div className="text-gray-500">데이터를 불러올 수 없습니다.</div>

  // Build unique semester keys for legend
  const semesterKeys = [...new Set(applications.map((a: any) => `${a.year}-${a.semester}`))]
    .sort((a, b) => b.localeCompare(a))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">장학금 신청 목록</h1>
        <div className="flex items-center gap-3">
          <a href="/api/applications/export" className="text-xs text-gray-500 hover:text-gray-700 border rounded px-2 py-1">CSV 다운로드</a>
          <span className="text-sm text-gray-500">총 {applications.length}건</span>
        </div>
      </div>

      {/* 필터 */}
      <div className="flex flex-wrap gap-2 mb-3">
        {/* 상태 필터 */}
        {[
          { value: '', label: '전체' },
          { value: 'pending', label: '검토 중' },
          { value: 'approved', label: '승인' },
          { value: 'rejected', label: '반려' },
          { value: 'paid', label: '지급 완료' },
        ].map(({ value, label }) => {
          const params = new URLSearchParams()
          if (value) params.set('status', value)
          if (year) params.set('year', year)
          if (semester) params.set('semester', semester)
          return (
            <Link
              key={value}
              href={`/admin/applications${params.toString() ? '?' + params : ''}`}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                (status ?? '') === value
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
            >
              {label}
            </Link>
          )
        })}

        <span className="border-l mx-1" />

        {/* 연도 필터 */}
        {years.map(y => {
          const params = new URLSearchParams()
          if (status) params.set('status', status)
          if (String(y) !== year) params.set('year', String(y))
          if (semester) params.set('semester', semester)
          return (
            <Link
              key={y}
              href={`/admin/applications${params.toString() ? '?' + params : ''}`}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                year === String(y)
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
            >
              {y}년
            </Link>
          )
        })}

        {/* 학기 필터 */}
        {[{ value: '1', label: '1학기' }, { value: '2', label: '2학기' }].map(({ value, label }) => {
          const params = new URLSearchParams()
          if (status) params.set('status', status)
          if (year) params.set('year', year)
          if (value !== semester) params.set('semester', value)
          return (
            <Link
              key={value}
              href={`/admin/applications${params.toString() ? '?' + params : ''}`}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                semester === value
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              }`}
            >
              {label}
            </Link>
          )
        })}
      </div>

      {/* 학기 색상 범례 */}
      {semesterKeys.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {semesterKeys.map(key => {
            const [y, s] = key.split('-').map(Number)
            const c = semesterColor(y, s)
            return (
              <span key={key} className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${c.text}`}>
                <span className={`w-2 h-2 rounded-full inline-block ${c.border.replace('border-l-', 'bg-')}`} />
                {y}년 {s}학기
              </span>
            )
          })}
        </div>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="w-1"></th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">번호</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">사진</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">이름</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">학교/학년</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">장학 프로그램</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">학기</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">상태</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">신청일</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {applications.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-gray-500">
                  신청 내역이 없습니다.
                </td>
              </tr>
            ) : (
              applications.map((app: any) => {
                const c = semesterColor(app.year, app.semester)
                return (
                  <tr key={app.id} className={`hover:brightness-95 transition-all ${c.bg}`}>
                    <td className={`border-l-4 ${c.border}`}></td>
                    <td className="px-4 py-3 text-gray-500">{app.id}</td>
                    <td className="px-4 py-3">
                      {app.photo_url ? (
                        <img src={app.photo_url} alt="증명사진" className="w-8 h-11 object-cover rounded border border-gray-200" />
                      ) : (
                        <div className="w-8 h-11 rounded border border-dashed border-gray-200 bg-white/60 flex items-center justify-center">
                          <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      <span className="whitespace-nowrap">{app.student_name}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="whitespace-nowrap">{app.school} {LEVEL_LABELS[app.school_level] ?? app.school_level} {app.grade}학년</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      <span className="whitespace-nowrap">{app.scholarships?.name ?? '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${c.text}`}>
                        {app.year}년 {app.semester}학기
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${STATUS_COLORS[app.status] ?? 'bg-gray-100 text-gray-800'}`}>
                        {STATUS_LABELS[app.status] ?? app.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {new Date(app.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/applications/${app.id}`} className="text-blue-600 hover:text-blue-800 text-xs font-medium whitespace-nowrap">
                        상세보기
                      </Link>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
