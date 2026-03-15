import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')?.trim()
  const birth_date = searchParams.get('birth_date')?.trim()

  if (!name || !birth_date) return NextResponse.json({ photo_url: null })

  const { data } = await supabaseAdmin
    .from('applications')
    .select('photo_url')
    .eq('student_name', name)
    .eq('birth_date', birth_date)
    .not('photo_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({ photo_url: data?.photo_url ?? null })
}
