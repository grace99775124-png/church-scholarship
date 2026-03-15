import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getSession } from '@/lib/auth'

async function checkAuth() {
  const session = await getSession()
  return session.isLoggedIn
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from('scholarship_announcements')
    .select('*')
    .order('year', { ascending: false })
    .order('semester', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: '권한 없음' }, { status: 401 })

  const body = await request.json()

  // Deactivate all first if setting active
  if (body.is_active) {
    await supabaseAdmin.from('scholarship_announcements').update({ is_active: false }).neq('id', 0)
  }

  const { data, error } = await supabaseAdmin
    .from('scholarship_announcements')
    .upsert({ ...body }, { onConflict: 'year,semester' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: NextRequest) {
  if (!(await checkAuth())) return NextResponse.json({ error: '권한 없음' }, { status: 401 })

  const body = await request.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: 'id 필요' }, { status: 400 })

  // If activating, deactivate others first
  if (updates.is_active) {
    await supabaseAdmin.from('scholarship_announcements').update({ is_active: false }).neq('id', id)
  }

  const { data, error } = await supabaseAdmin
    .from('scholarship_announcements')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
