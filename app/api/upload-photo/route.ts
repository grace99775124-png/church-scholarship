import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('photo') as File

  if (!file) return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: '파일 크기는 5MB 이하여야 합니다.' }, { status: 400 })
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ error: 'JPG, PNG, WebP만 지원합니다.' }, { status: 400 })

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await supabaseAdmin.storage
    .from('attachments')
    .upload(path, buffer, { contentType: file.type, upsert: false })

  if (error) return NextResponse.json({ error: `업로드 실패: ${error.message}` }, { status: 500 })

  const { data } = supabaseAdmin.storage.from('attachments').getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl })
}
