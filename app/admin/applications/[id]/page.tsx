import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'
import { StatusUpdateForm } from './status-update-form'

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

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data: app, error } = await supabaseAdmin
    .from('applications')
    .select('*, scholarships(name, amount)')
    .eq('id', id)
    .single()

  if (error || !app) notFound()

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/applications" className="text-sm text-gray-500 hover:text-gray-700">
          ← 목록으로
        </Link>
      </div>

      <div className="bg-white rounded-xl border p-6 mb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">신청서 #{app.id}</h1>
            <span className={`inline-flex mt-1 px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${STATUS_COLORS[app.status] ?? 'bg-gray-100 text-gray-800'}`}>
              {STATUS_LABELS[app.status] ?? app.status}
            </span>
          </div>
          {/* 증명사진 */}
          {app.photo_url ? (
            <a href={app.photo_url} target="_blank" rel="noopener noreferrer" title="원본 사진 보기">
              <img
                src={app.photo_url}
                alt="증명사진"
                className="w-20 h-28 object-cover rounded border border-gray-200 shadow-sm hover:opacity-90 transition-opacity flex-shrink-0"
              />
            </a>
          ) : (
            <div className="w-20 h-28 rounded border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center flex-shrink-0">
              <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="text-xs text-gray-300 mt-1">사진 없음</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500 mb-0.5">신청자</p>
            <p className="font-medium">{app.student_name}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-0.5">생년월일</p>
            <p>{app.birth_date}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-0.5">학교</p>
            <p>{app.school} ({LEVEL_LABELS[app.school_level] ?? app.school_level} {app.grade}학년)</p>
          </div>
          <div>
            <p className="text-gray-500 mb-0.5">연락처</p>
            <p>{app.contact}</p>
          </div>
          <div>
            <p className="text-gray-500 mb-0.5">신청 학기</p>
            <p>{app.year}년 {app.semester}학기</p>
          </div>
          <div>
            <p className="text-gray-500 mb-0.5">장학 프로그램</p>
            <p>{app.scholarships?.name ?? '-'} ({app.scholarships?.amount?.toLocaleString()}원)</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-gray-500 text-sm mb-0.5">신청 이유</p>
          <p className="text-sm bg-gray-50 rounded-lg p-3" style={{ wordBreak: 'keep-all' }}>{app.reason}</p>
        </div>

        {app.recommender_name && (
          <div className="mt-4 border-t pt-4">
            <p className="text-gray-500 text-sm mb-2">추천인 정보</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500 mb-0.5">추천인</p>
                <p>{app.recommender_name} ({app.recommender_title})</p>
              </div>
              <div>
                <p className="text-gray-500 mb-0.5">연락처</p>
                <p>{app.recommender_phone}</p>
              </div>
              {app.recommender_comment && (
                <div className="col-span-2">
                  <p className="text-gray-500 mb-0.5">추천 내용</p>
                  <p className="bg-gray-50 rounded-lg p-3" style={{ wordBreak: 'keep-all' }}>{app.recommender_comment}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 첨부서류 */}
        {(() => {
          let attachments: string[] = []
          try { attachments = JSON.parse(app.attachments ?? '[]') } catch {}
          return attachments.length > 0 ? (
            <div className="mt-4 border-t pt-4">
              <p className="text-gray-500 text-sm mb-2">첨부서류 ({attachments.length}개)</p>
              <div className="space-y-1.5">
                {attachments.map((url: string, i: number) => {
                  const filename = decodeURIComponent(url.split('/').pop() ?? `파일 ${i + 1}`)
                  return (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                    >
                      <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      {filename}
                    </a>
                  )
                })}
              </div>
            </div>
          ) : null
        })()}

        {app.reviewed_at && (
          <div className="mt-4 border-t pt-4 text-sm text-gray-500">
            <p>검토: {app.reviewed_by} · {new Date(app.reviewed_at).toLocaleDateString('ko-KR')}</p>
            {app.status_note && <p className="mt-1">{app.status_note}</p>}
            {app.paid_amount && <p className="mt-1">지급액: {app.paid_amount.toLocaleString()}원</p>}
          </div>
        )}
      </div>

      <StatusUpdateForm applicationId={app.id} currentStatus={app.status} />
    </div>
  )
}
