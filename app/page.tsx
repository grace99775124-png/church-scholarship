import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'

export const revalidate = 0

export default async function HomePage() {
  // 활성화된 공고문 조회
  const { data: announcement } = await supabaseAdmin
    .from('scholarship_announcements')
    .select('*')
    .eq('is_active', true)
    .single()

  // 활성화된 장학금 규정 조회
  const { data: currentRule } = await supabaseAdmin
    .from('scholarship_rules')
    .select('file_url')
    .eq('is_current', true)
    .single()

  const rulesUrl = currentRule?.file_url || '/scholarship-rules.pdf'

  const year = announcement?.year ?? new Date().getFullYear()
  const semester = announcement?.semester ?? 1
  const deadline = announcement?.deadline ?? ''
  const notes = announcement?.notes ?? ''

  const docNo = `장학 - ${year} - 00${semester}`
  const semesterLabel = `${year}년도 제 ${semester} 학기`
  const dateLabel = `${year}년 ${semester === 1 ? '1' : '7'}월`

  return (
    <div className="min-h-screen bg-stone-100 py-8 px-4">
      {/* 관리자 링크 */}
      <div className="max-w-2xl mx-auto flex justify-end mb-3">
        <Link href="/admin" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
          관리자
        </Link>
      </div>

      {/* 공고문 카드 */}
      <div className="max-w-2xl mx-auto bg-white shadow-lg border border-gray-300" style={{ fontFamily: "'Malgun Gothic', '맑은 고딕', sans-serif" }}>

        {/* 상단 교회 헤더 */}
        <div className="border-b-2 border-gray-800 px-10 pt-8 pb-4 text-center">
          <p className="text-xs tracking-widest text-gray-500 mb-1">해운대순복음교회</p>
          <p className="text-sm font-bold tracking-widest text-gray-800">장 학 위 원 회</p>
        </div>

        {/* 공고 제목 */}
        <div className="px-10 pt-8 pb-6 text-center border-b border-gray-200">
          <p className="text-xs text-gray-500 tracking-widest mb-2">{docNo} 호</p>
          <h1 className="text-2xl font-bold text-gray-900 leading-snug" style={{ letterSpacing: '0.05em' }}>
            {semesterLabel}<br />장 학 생 선 발 공 고
          </h1>
          <p className="mt-4 text-sm text-gray-600 leading-relaxed" style={{ wordBreak: 'keep-all' }}>
            해운대순복음교회 장학위원회는 학생의 학비 부담을 경감하고<br />
            학업을 장려하며 교회봉사자를 격려하기 위하여<br />
            다음과 같이 장학생을 선발하고자 합니다.
          </p>
        </div>

        {/* 본문 */}
        <div className="px-10 py-8 space-y-7 text-sm text-gray-800">

          {/* 1. 지원 대상 */}
          <div className="flex gap-4">
            <span className="font-bold whitespace-nowrap text-gray-900 w-28 shrink-0">1. 지원 대상</span>
            <p style={{ wordBreak: 'keep-all' }}>
              본 교회에 출석 중인 초등학생·중학생·고등학생·대학생·대학원생
            </p>
          </div>

          {/* 2. 지원 분야 */}
          <div>
            <div className="flex gap-4 mb-2">
              <span className="font-bold whitespace-nowrap text-gray-900 w-28 shrink-0">2. 지원 분야</span>
              <span className="text-gray-600">아래 장학 종류 중 해당하는 항목으로 신청</span>
            </div>
            <table className="w-full border-collapse text-sm ml-0" style={{ borderTop: '2px solid #374151' }}>
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left font-semibold w-28">장학금 종류</th>
                  <th className="border border-gray-300 px-3 py-2 text-left font-semibold">지급 대상 및 기준</th>
                  <th className="border border-gray-300 px-3 py-2 text-center font-semibold w-20">중복 가능</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: '여호수아 장학금', desc: '대학교·대학원 입학 대상자', dup: false },
                  { name: '바나바 장학금', desc: '교회 봉사자 · 초·중·고·대학·대학원생', dup: false },
                  { name: '다비다 장학금', desc: '생활 보조 대상 · 대학·대학원생', dup: false },
                  { name: '다니엘 장학금', desc: '학업 우수자 · 대학·대학원생', dup: false },
                  { name: '빌립 장학금', desc: '전도 활동 · 초·중·고·대학·대학원생', dup: true },
                  { name: '특별 장학금', desc: '위에 해당하지 않는 특별 지원 사유', dup: false },
                ].map((s, i) => (
                  <tr key={s.name} className={i % 2 === 1 ? 'bg-gray-50' : ''}>
                    <td className="border border-gray-300 px-3 py-2 font-medium whitespace-nowrap">{s.name}</td>
                    <td className="border border-gray-300 px-3 py-2" style={{ wordBreak: 'keep-all' }}>{s.desc}</td>
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      {s.dup ? <span className="text-blue-700 font-semibold">○</span> : <span className="text-gray-300">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-1.5 text-xs text-gray-500 ml-0" style={{ wordBreak: 'keep-all' }}>
              ※ 빌립 장학금은 다른 장학금과 중복하여 신청할 수 있습니다.
            </p>
          </div>

          {/* 3. 신청 기간 */}
          <div className="flex gap-4">
            <span className="font-bold whitespace-nowrap text-gray-900 w-28 shrink-0">3. 신청 기간</span>
            <p style={{ wordBreak: 'keep-all' }}>
              {deadline || '추후 공고 예정'}
            </p>
          </div>

          {/* 4. 신청 방법 */}
          <div className="flex gap-4">
            <span className="font-bold whitespace-nowrap text-gray-900 w-28 shrink-0">4. 신청 방법</span>
            <div style={{ wordBreak: 'keep-all' }}>
              <p>장학금 신청서 및 지원 분야에 따른 증빙서류 제출</p>
              <p className="text-gray-500 text-xs mt-0.5">※ 추천서 필수 · 추천인: 담당교사 또는 담당교역자</p>
            </div>
          </div>

          {/* 5. 제출처 */}
          <div className="flex gap-4">
            <span className="font-bold whitespace-nowrap text-gray-900 w-28 shrink-0">5. 제출처</span>
            <p>교회사무실, 온라인신청</p>
          </div>

          {/* 6. 선발 절차 */}
          <div className="flex gap-4">
            <span className="font-bold whitespace-nowrap text-gray-900 w-28 shrink-0">6. 선발 절차</span>
            <p style={{ wordBreak: 'keep-all' }}>
              장학금 규정에 따라 장학위원회에서 심사 후 목회협의회를 거쳐 담임목사님께 추천·확정
            </p>
          </div>

          {/* 7. 지급 방법 */}
          <div className="flex gap-4">
            <span className="font-bold whitespace-nowrap text-gray-900 w-28 shrink-0">7. 지급 방법</span>
            <p style={{ wordBreak: 'keep-all' }}>장학위원회 결정 후 개별 통지</p>
          </div>

          {/* 추가 공지사항 */}
          {notes && (
            <div className="border-l-4 border-blue-400 bg-blue-50 px-4 py-3 text-sm text-gray-700" style={{ wordBreak: 'keep-all' }}>
              <p className="font-semibold text-blue-800 mb-1 text-xs">【 추가 공지사항 】</p>
              <p className="whitespace-pre-wrap">{notes}</p>
            </div>
          )}
        </div>

        {/* 하단 날짜 / 기관명 */}
        <div className="border-t-2 border-gray-800 px-10 py-6 text-center">
          <p className="text-sm text-gray-700 mb-1">{dateLabel}</p>
          <p className="text-base font-bold tracking-widest text-gray-900">
            해 운 대 순 복 음 교 회 장 학 위 원 회
          </p>
          <p className="text-xs text-gray-500 mt-1">(직인 생략)</p>
        </div>

        {/* 버튼 영역 */}
        <div className="border-t border-gray-200 bg-gray-50 px-10 py-6 space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <a
              href="/scholarship-form.pdf"
              download="장학금신청서.pdf"
              className="flex-1 flex items-center justify-center gap-2 border-2 border-gray-700 text-gray-700 rounded px-5 py-3 font-semibold text-sm hover:bg-gray-700 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="whitespace-nowrap">신청서 양식 다운로드 (PDF)</span>
            </a>
            <Link
              href="/apply"
              className="flex-1 flex items-center justify-center gap-2 bg-blue-700 text-white rounded px-5 py-3 font-semibold text-sm hover:bg-blue-800 transition-colors"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="whitespace-nowrap">온라인 신청하기</span>
            </Link>
          </div>
        </div>
      </div>

      <p className="max-w-2xl mx-auto text-center text-xs text-gray-400 mt-3" style={{ wordBreak: 'keep-all' }}>
        처음 온라인 접수하시는 분은 증명사진을 업로드 해주시기 바랍니다.
      </p>
    </div>
  )
}
