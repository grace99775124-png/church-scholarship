import { supabaseAdmin } from '@/lib/supabase'
import { SearchClient } from './search-client'

export default async function SearchPage() {
  const [{ data: scholarships }, { data: yearRows }] = await Promise.all([
    supabaseAdmin.from('scholarships').select('id, name').order('name'),
    supabaseAdmin.from('applications').select('year').order('year', { ascending: false }),
  ])

  const uniqueYears = [...new Set((yearRows ?? []).map((r: any) => r.year as number))]

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">장학금 수령 조회</h1>
        <p className="text-sm text-gray-500 mt-1">이름·장학 프로그램·연도·학기별로 수령 내역을 검색하고 PDF로 저장할 수 있습니다.</p>
      </div>
      <SearchClient scholarships={scholarships ?? []} years={uniqueYears} />
    </div>
  )
}
