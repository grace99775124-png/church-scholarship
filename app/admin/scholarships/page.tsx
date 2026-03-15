import { supabaseAdmin } from '@/lib/supabase'
import { ScholarshipManager } from './scholarship-manager'

export default async function ScholarshipsPage() {
  const { data: scholarships = [] } = await supabaseAdmin
    .from('scholarships')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">장학 프로그램 관리</h1>
      <ScholarshipManager scholarships={scholarships ?? []} />
    </div>
  )
}
