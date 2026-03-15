import { supabaseAdmin } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import { RecommendForm } from './recommend-form'

const LEVEL_LABELS: Record<string, string> = {
  primary: '초등학교', middle: '중학교', high: '고등학교', university: '대학교/대학원',
}

export default async function RecommendPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = await params

  const { data: app } = await supabaseAdmin
    .from('applications')
    .select('id, student_name, birth_date, school, school_level, grade, year, semester, reason, recommender_name, recommender_title, recommender_comment, scholarships(name)')
    .eq('recommender_token', token)
    .maybeSingle()

  if (!app) notFound()

  const alreadyWritten = !!app.recommender_comment

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden mb-5">
          <div className="bg-blue-700 px-6 py-4">
            <p className="text-blue-100 text-xs mb-0.5">해운대순복음교회 장학위원회</p>
            <h1 className="text-white text-lg font-bold">장학금 추천서 작성</h1>
          </div>

          <div className="px-6 py-5">
            <p className="text-sm text-gray-600 mb-4" style={{ wordBreak: 'keep-all' }}>
              아래 신청자의 장학금 신청서를 확인하고 추천 내용을 작성해 주세요.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-5 space-y-2 text-sm">
              <h2 className="font-semibold text-gray-800 mb-2">신청자 정보</h2>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                <div>
                  <span className="text-gray-500">이름</span>
                  <span className="ml-2 font-medium">{app.student_name}</span>
                </div>
                <div>
                  <span className="text-gray-500">학교</span>
                  <span className="ml-2">{app.school} {LEVEL_LABELS[app.school_level] ?? ''}</span>
                </div>
                <div>
                  <span className="text-gray-500">학년</span>
                  <span className="ml-2">{app.grade}학년</span>
                </div>
                <div>
                  <span className="text-gray-500">신청 학기</span>
                  <span className="ml-2">{app.year}년 {app.semester}학기</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500">장학 프로그램</span>
                  <span className="ml-2 font-medium text-blue-700">{(app.scholarships as any)?.name ?? '-'}</span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t">
                <p className="text-gray-500 text-xs mb-1">신청 사유</p>
                <p className="text-sm text-gray-700" style={{ wordBreak: 'keep-all' }}>{app.reason}</p>
              </div>
            </div>

            {alreadyWritten && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700" style={{ wordBreak: 'keep-all' }}>
                이미 추천서가 작성되었습니다. 내용을 수정하려면 아래에서 다시 작성하세요.
              </div>
            )}

            <RecommendForm
              token={token}
              initial={{
                recommender_name: app.recommender_name ?? '',
                recommender_title: app.recommender_title ?? '',
                recommender_comment: app.recommender_comment ?? '',
              }}
            />
          </div>
        </div>

        <p className="text-center text-xs text-gray-400" style={{ wordBreak: 'keep-all' }}>
          해운대순복음교회 장학위원회 | 이 링크는 추천서 작성 전용입니다.
        </p>
      </div>
    </div>
  )
}
