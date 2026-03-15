import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session.isLoggedIn) return NextResponse.json({ error: '권한 없음' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')
  const scholarshipId = searchParams.get('scholarship_id')
  const year = searchParams.get('year')
  const semester = searchParams.get('semester')

  let query = supabaseAdmin
    .from('applications')
    .select('id, student_name, birth_date, school, school_level, grade, year, semester, status, paid_amount, paid_at, scholarship_id, scholarships(name)')
    .order('year', { ascending: false })
    .order('semester', { ascending: false })
    .order('student_name')

  if (name) query = query.ilike('student_name', `%${name}%`)
  if (scholarshipId) query = query.eq('scholarship_id', scholarshipId)
  if (year) query = query.eq('year', year)
  if (semester) query = query.eq('semester', semester)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
