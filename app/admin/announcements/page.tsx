import { supabaseAdmin } from '@/lib/supabase'
import { AnnouncementEditor } from './announcement-editor'

const CREATE_SQL = `CREATE TABLE IF NOT EXISTS scholarship_announcements (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  semester INTEGER NOT NULL,
  deadline TEXT NOT NULL DEFAULT '',
  notes TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(year, semester)
);`

export default async function AnnouncementsPage() {
  const { data, error } = await supabaseAdmin
    .from('scholarship_announcements')
    .select('*')
    .order('year', { ascending: false })
    .order('semester', { ascending: false })

  const tableNotFound = error?.message?.includes('schema cache') || error?.message?.includes('does not exist') || error?.code === '42P01'

  if (tableNotFound) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">공고문 관리</h1>
        </div>
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-6">
          <p className="font-semibold text-yellow-800 mb-2">⚠️ 테이블 생성이 필요합니다</p>
          <p className="text-sm text-yellow-700 mb-4" style={{ wordBreak: 'keep-all' }}>
            Supabase SQL Editor에서 아래 SQL을 실행한 후 페이지를 새로고침하세요.
          </p>
          <pre className="bg-white border border-yellow-200 rounded-lg p-4 text-xs text-gray-800 overflow-auto whitespace-pre-wrap">
            {CREATE_SQL}
          </pre>
          <p className="text-xs text-yellow-600 mt-3">
            Supabase 대시보드 → SQL Editor → New query → 위 내용 붙여넣기 → Run
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">공고문 관리</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          오류: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">공고문 관리</h1>
        <p className="text-sm text-gray-500 mt-1">학기별 장학생 선발 공고문을 작성하고 관리합니다.</p>
      </div>
      <AnnouncementEditor announcements={data ?? []} />
    </div>
  )
}
