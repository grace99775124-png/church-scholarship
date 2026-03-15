import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const { data, error } = await supabaseAdmin
    .from('applications')
    .select('id, student_name, birth_date, school, school_level, grade, year, semester, reason, recommender_name, recommender_title, recommender_comment, scholarships(name)')
    .eq('recommender_token', token)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: '유효하지 않은 링크입니다.' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const body = await request.json()

  const { recommender_name, recommender_title, recommender_phone, recommender_comment } = body

  const { data, error } = await supabaseAdmin
    .from('applications')
    .update({ recommender_name, recommender_title, recommender_phone, recommender_comment })
    .eq('recommender_token', token)
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: '유효하지 않은 링크입니다.' }, { status: 404 })
  return NextResponse.json({ ok: true })
}
