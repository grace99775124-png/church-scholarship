import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

const LEVEL_LABELS: Record<string, string> = {
  primary: '초등',
  middle: '중학',
  high: '고등',
  university: '대학',
}

const STATUS_LABELS: Record<string, string> = {
  pending: '검토 중',
  approved: '승인',
  rejected: '반려',
  paid: '지급 완료',
}

export async function GET() {
  const session = await getSession()
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: applications } = await supabaseAdmin
    .from('applications')
    .select('*, scholarships(name, amount)')
    .order('created_at', { ascending: false })

  const rows = applications ?? []

  // BOM + CSV 헤더
  const headers = ['번호', '이름', '생년월일', '학교', '학교구분', '학년', '연도', '학기', '연락처', '장학금 종류', '신청 사유', '추천인', '추천인직책', '상태', '검토자', '지급액', '신청일']

  const csvLines = [
    '\uFEFF' + headers.join(','), // BOM for Excel Korean
    ...rows.map((a: any) => [
      a.id,
      `"${a.student_name}"`,
      `"${a.birth_date}"`,
      `"${a.school}"`,
      LEVEL_LABELS[a.school_level] ?? a.school_level,
      `${a.grade}학년`,
      `${a.year}년`,
      `${a.semester}학기`,
      `"${a.contact}"`,
      `"${a.scholarships?.name ?? ''}"`,
      `"${(a.reason ?? '').replace(/"/g, '""')}"`,
      `"${a.recommender_name ?? ''}"`,
      `"${a.recommender_title ?? ''}"`,
      STATUS_LABELS[a.status] ?? a.status,
      `"${a.reviewed_by ?? ''}"`,
      a.paid_amount ?? '',
      new Date(a.created_at).toLocaleDateString('ko-KR'),
    ].join(','))
  ]

  const csv = csvLines.join('\r\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename*=UTF-8''%EC%9E%A5%ED%95%99%EC%83%9D%EB%AA%85%EB%8B%A8.csv`,
    },
  })
}
