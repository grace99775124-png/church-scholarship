'use client'

import { useState, useEffect, useCallback } from 'react'

interface Scholarship { id: number; name: string }

interface AppRecord {
  id: number
  student_name: string
  birth_date: string
  school: string
  school_level: string
  grade: string
  year: number
  semester: number
  status: string
  paid_amount: number | null
  scholarships: { name: string } | null
}

interface GroupedPerson {
  name: string
  school: string
  count: number
  totalAmount: number
  records: AppRecord[]
}

const STATUS_LABELS: Record<string, string> = {
  pending: '검토 중', approved: '승인', rejected: '반려', paid: '지급 완료',
}
const LEVEL_LABELS: Record<string, string> = {
  primary: '초등', middle: '중학', high: '고등', university: '대학',
}

function groupByPerson(records: AppRecord[]): GroupedPerson[] {
  const map = new Map<string, GroupedPerson>()
  for (const r of records) {
    const key = r.student_name
    if (!map.has(key)) {
      map.set(key, { name: r.student_name, school: r.school, count: 0, totalAmount: 0, records: [] })
    }
    const g = map.get(key)!
    g.count++
    g.totalAmount += r.paid_amount ?? 0
    g.records.push(r)
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

function openPdfWindow(records: AppRecord[], filters: { name: string; scholarshipName: string; year: string; semester: string }, tab: 'person' | 'list') {
  const grouped = groupByPerson(records)

  const filterDesc = [
    filters.name && `이름: ${filters.name}`,
    filters.scholarshipName && `장학금: ${filters.scholarshipName}`,
    filters.year && `${filters.year}년`,
    filters.semester && `${filters.semester}학기`,
  ].filter(Boolean).join(' / ') || '전체'

  const totalAmount = records.reduce((s, r) => s + (r.paid_amount ?? 0), 0)

  const personRows = grouped.map(g => `
    <tr>
      <td>${g.name}</td>
      <td>${g.school}</td>
      <td style="text-align:center;font-weight:bold">${g.count}회</td>
      <td style="text-align:right">${g.totalAmount > 0 ? g.totalAmount.toLocaleString() + '원' : '-'}</td>
      <td>${g.records.map(r => `${r.year}년 ${r.semester}학기 ${r.scholarships?.name ?? ''}`).join('<br>')}</td>
    </tr>`).join('')

  const listRows = records.map(r => `
    <tr>
      <td class="nowrap">${r.student_name}</td>
      <td class="nowrap">${r.school} ${LEVEL_LABELS[r.school_level] ?? ''} ${r.grade}학년</td>
      <td class="nowrap">${r.scholarships?.name ?? '-'}</td>
      <td style="text-align:center" class="nowrap">${r.year}년 ${r.semester}학기</td>
      <td style="text-align:center" class="nowrap">${STATUS_LABELS[r.status] ?? r.status}</td>
      <td style="text-align:right" class="nowrap">${r.paid_amount ? r.paid_amount.toLocaleString() + '원' : '-'}</td>
    </tr>`).join('')

  const html = `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<title>장학금 수령 조회</title>
<style>
  body { font-family: 'Malgun Gothic', sans-serif; font-size: 11pt; color: #111; margin: 20mm 15mm; }
  h2 { font-size: 16pt; margin-bottom: 4px; }
  .meta { font-size: 9pt; color: #555; margin-bottom: 16px; }
  .summary { display: flex; gap: 24px; background: #f5f7fa; border-radius: 6px; padding: 10px 16px; margin-bottom: 16px; font-size: 10pt; }
  .summary span { font-weight: bold; color: #1a56db; }
  table { width: 100%; border-collapse: collapse; font-size: 10pt; }
  th { background: #1a56db; color: white; padding: 6px 8px; text-align: left; }
  td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
  tr:nth-child(even) td { background: #f9fafb; }
  .nowrap { white-space: nowrap; }
  @media print { body { margin: 10mm; } }
</style></head><body>
<h2>해운대순복음교회 장학금 수령 조회</h2>
<div class="meta">조회 조건: ${filterDesc} &nbsp;|&nbsp; 출력일: ${new Date().toLocaleDateString('ko-KR')}</div>
<div class="summary">
  <div>검색 건수 <span>${records.length}건</span></div>
  <div>수령 인원 <span>${grouped.length}명</span></div>
  ${totalAmount > 0 ? `<div>총 지급액 <span>${totalAmount.toLocaleString()}원</span></div>` : ''}
</div>

${tab === 'person' ? `
<table>
  <thead><tr><th>이름</th><th>학교</th><th>수령 횟수</th><th>총 수령액</th><th>수령 내역</th></tr></thead>
  <tbody>${personRows}</tbody>
</table>` : `
<table>
  <thead><tr><th>이름</th><th>학교/학년</th><th>장학 프로그램</th><th>학기</th><th>상태</th><th>지급액</th></tr></thead>
  <tbody>${listRows}</tbody>
</table>`}

<script>window.onload = () => { window.print() }</script>
</body></html>`

  const w = window.open('', '_blank', 'width=900,height=700')
  if (w) { w.document.write(html); w.document.close() }
}

export function SearchClient({ scholarships, years }: { scholarships: Scholarship[]; years: number[] }) {
  const [name, setName] = useState('')
  const [scholarshipId, setScholarshipId] = useState('')
  const [year, setYear] = useState('')
  const [semester, setSemester] = useState('')
  const [tab, setTab] = useState<'person' | 'list'>('person')
  const [records, setRecords] = useState<AppRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [expandedNames, setExpandedNames] = useState<Set<string>>(new Set())

  const search = useCallback(async () => {
    setLoading(true)
    setSearched(true)
    const params = new URLSearchParams()
    if (name.trim()) params.set('name', name.trim())
    if (scholarshipId) params.set('scholarship_id', scholarshipId)
    if (year) params.set('year', year)
    if (semester) params.set('semester', semester)
    try {
      const res = await fetch(`/api/admin/search?${params}`)
      const data = await res.json()
      setRecords(Array.isArray(data) ? data : [])
    } finally {
      setLoading(false)
    }
  }, [name, scholarshipId, year, semester])

  // 초기 전체 로드
  useEffect(() => { search() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') search() }

  const toggleExpand = (n: string) => {
    setExpandedNames(prev => {
      const next = new Set(prev)
      next.has(n) ? next.delete(n) : next.add(n)
      return next
    })
  }

  const grouped = groupByPerson(records)
  const totalAmount = records.reduce((s, r) => s + (r.paid_amount ?? 0), 0)
  const scholarshipName = scholarships.find(s => String(s.id) === scholarshipId)?.name ?? ''

  return (
    <div className="space-y-4">
      {/* 필터 */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">이름</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="이름 검색"
              className="border rounded-lg px-3 py-2 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">장학 프로그램</label>
            <select
              value={scholarshipId}
              onChange={e => setScholarshipId(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm w-44 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체</option>
              {scholarships.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">연도</label>
            <select
              value={year}
              onChange={e => setYear(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm w-28 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체</option>
              {years.map(y => <option key={y} value={y}>{y}년</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">학기</label>
            <select
              value={semester}
              onChange={e => setSemester(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">전체</option>
              <option value="1">1학기</option>
              <option value="2">2학기</option>
            </select>
          </div>
          <button
            onClick={search}
            disabled={loading}
            className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? '검색 중...' : '검색'}
          </button>
          <button
            onClick={() => { setName(''); setScholarshipId(''); setYear(''); setSemester('') }}
            className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 whitespace-nowrap"
          >
            초기화
          </button>
        </div>
      </div>

      {/* 요약 + 탭 + PDF */}
      {searched && !loading && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: '검색 건수', value: `${records.length}건` },
              { label: '수령 인원', value: `${grouped.length}명` },
              { label: '최다 수령', value: grouped[0] ? `${grouped[0].name} (${grouped[0].count}회)` : '-' },
              { label: '총 지급액', value: totalAmount > 0 ? `${totalAmount.toLocaleString()}원` : '-' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white rounded-xl border p-4">
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5 whitespace-nowrap">{value}</p>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {(['person', 'list'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-1.5 text-sm rounded-lg border transition-colors ${
                    tab === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {t === 'person' ? '이름별 통계' : '전체 목록'}
                </button>
              ))}
            </div>
            <button
              onClick={() => openPdfWindow(records, { name, scholarshipName, year, semester }, tab)}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PDF 저장
            </button>
          </div>

          {/* 이름별 통계 탭 */}
          {tab === 'person' && (
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">이름</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">학교</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">수령 횟수</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">총 수령액</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">내역</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {grouped.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">검색 결과가 없습니다.</td></tr>
                  ) : grouped.map(g => (
                    <>
                      <tr key={g.name} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          <span className="whitespace-nowrap">{g.name}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          <span className="whitespace-nowrap">{g.school}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                            g.count >= 5 ? 'bg-red-100 text-red-700' :
                            g.count >= 3 ? 'bg-orange-100 text-orange-700' :
                            g.count >= 2 ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>{g.count}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700 whitespace-nowrap">
                          {g.totalAmount > 0 ? `${g.totalAmount.toLocaleString()}원` : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                            {(expandedNames.has(g.name) ? g.records : g.records.slice(0, 3)).map(r => (
                              <span key={r.id} className="whitespace-nowrap text-xs text-gray-500">
                                {r.year}년 {r.semester}학기 {r.scholarships?.name ?? ''}
                              </span>
                            ))}
                            {g.records.length > 3 && (
                              <button
                                onClick={() => toggleExpand(g.name)}
                                className="text-xs text-blue-500 hover:underline whitespace-nowrap"
                              >
                                {expandedNames.has(g.name) ? '접기' : `+${g.records.length - 3}건 더보기`}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 전체 목록 탭 */}
          {tab === 'list' && (
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">이름</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">학교/학년</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">장학 프로그램</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">학기</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-600">상태</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">지급액</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {records.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">검색 결과가 없습니다.</td></tr>
                  ) : records.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        <span className="whitespace-nowrap">{r.student_name}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <span className="whitespace-nowrap">{r.school} {LEVEL_LABELS[r.school_level] ?? ''} {r.grade}학년</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <span className="whitespace-nowrap">{r.scholarships?.name ?? '-'}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600 whitespace-nowrap">{r.year}년 {r.semester}학기</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                          r.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                          r.status === 'approved' ? 'bg-green-100 text-green-800' :
                          r.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {STATUS_LABELS[r.status] ?? r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700 whitespace-nowrap">
                        {r.paid_amount ? `${r.paid_amount.toLocaleString()}원` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {loading && (
        <div className="bg-white rounded-xl border p-12 text-center text-gray-400">검색 중...</div>
      )}
    </div>
  )
}
