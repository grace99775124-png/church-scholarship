import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { getSession } from '@/lib/auth'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const PARSE_PROMPT = `이 이미지(또는 PDF)는 해운대순복음교회 장학금 신청서입니다.
신청서에서 다음 정보를 추출하여 JSON으로 반환해주세요.

반드시 아래 JSON 형식으로만 응답하세요 (마크다운 없이 순수 JSON):
{
  "student_name": "성명",
  "birth_date": "생년월일 (YYYY-MM-DD 형식, 없으면 빈 문자열)",
  "school": "학교명",
  "school_level": "초등학교=primary, 중학교=middle, 고등학교=high, 대학교/대학원=university",
  "grade": "학년 (숫자만, 예: 3)",
  "contact": "연락처 (없으면 빈 문자열)",
  "year": "신청 연도 (숫자, 예: 2025)",
  "semester": "학기 (1 또는 2)",
  "scholarship_type": "체크된 장학금 종류 (바나바/여호수아/다비다/다니엘/빌립/특별 중 하나)",
  "reason": "장학금 신청 사유 (전체 내용)",
  "recommender_name": "추천인 성명 (없으면 빈 문자열)",
  "recommender_title": "추천인 직책 (없으면 빈 문자열)"
}

추출할 수 없는 필드는 빈 문자열로 두세요. 장학금 종류는 체크박스(□에 체크된 것)를 확인하세요.`

export async function POST(request: NextRequest) {
  const session = await getSession()
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.includes('여기에')) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY가 설정되지 않았습니다.' }, { status: 500 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) {
    return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'JPG, PNG, WebP, PDF 파일만 지원합니다.' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const base64 = buffer.toString('base64')

  try {
    let content: Anthropic.MessageParam['content']

    if (file.type === 'application/pdf') {
      // PDF: document 타입 (beta)
      content = [
        {
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: base64,
          },
        } as any,
        { type: 'text', text: PARSE_PROMPT },
      ]
    } else {
      // 이미지
      content = [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
            data: base64,
          },
        },
        { type: 'text', text: PARSE_PROMPT },
      ]
    }

    const response = await client.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content }],
      ...(file.type === 'application/pdf' ? { betas: ['pdfs-2024-09-25'] } as any : {}),
    })

    const text = response.content.find(b => b.type === 'text')?.text ?? ''

    // JSON 파싱
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: '파싱 결과를 읽을 수 없습니다.', raw: text }, { status: 422 })
    }

    const parsed = JSON.parse(jsonMatch[0])

    // 기본값 처리
    const result = {
      student_name: parsed.student_name ?? '',
      birth_date: parsed.birth_date ?? '',
      school: parsed.school ?? '',
      school_level: parsed.school_level ?? 'university',
      grade: String(parsed.grade ?? '1'),
      contact: parsed.contact ?? '',
      year: parseInt(parsed.year) || new Date().getFullYear(),
      semester: parseInt(parsed.semester) || 1,
      scholarship_type: parsed.scholarship_type ?? '',
      reason: parsed.reason ?? '',
      recommender_name: parsed.recommender_name ?? '',
      recommender_title: parsed.recommender_title ?? '',
    }

    return NextResponse.json({ data: result })
  } catch (err: any) {
    console.error('Claude API 오류:', err)
    return NextResponse.json({ error: err.message ?? 'AI 파싱 오류' }, { status: 500 })
  }
}
