import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const session = await getSession()
  if (!session.isLoggedIn) return NextResponse.json({ error: '권한 없음' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const scholarshipId = searchParams.get('scholarship_id')
  const year = searchParams.get('year')
  const semester = searchParams.get('semester')

  let query = supabaseAdmin
    .from('applications')
    .select('*, scholarships(name)')
    .order('year', { ascending: false })
    .order('semester', { ascending: false })
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (scholarshipId) query = query.eq('scholarship_id', scholarshipId)
  if (year) query = query.eq('year', year)
  if (semester) query = query.eq('semester', semester)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()

  // Generate recommender token
  const recommender_token = crypto.randomUUID()

  const fullBody = { ...body, recommender_token }

  // Try insert with all fields
  let { data, error } = await supabaseAdmin
    .from('applications')
    .insert(fullBody)
    .select()
    .single()

  // If optional columns don't exist yet, fall back to core fields
  if (error) {
    const CORE = [
      'student_name', 'birth_date', 'school', 'school_level', 'grade',
      'contact', 'year', 'semester', 'reason', 'scholarship_id',
      'recommender_name', 'recommender_title', 'recommender_phone', 'recommender_comment',
      'status', 'paid_amount', 'paid_at', 'reviewed_by', 'reviewed_at', 'status_note',
    ]
    const filtered = Object.fromEntries(
      CORE.filter(k => k in body && body[k] !== undefined && body[k] !== null).map(k => [k, body[k]])
    )
    const result = await supabaseAdmin.from('applications').insert(filtered).select().single()
    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 })
    data = result.data
    error = null
  }

  return NextResponse.json(data, { status: 201 })
}
