import { supabase } from '@/lib/supabase'
import { ApplyForm } from './apply-form'
import Link from 'next/link'

export default async function ApplyPage() {
  const { data: scholarships = [] } = await supabase
    .from('scholarships')
    .select('*')
    .eq('is_active', true)
    .order('name')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← 공고문</Link>
          <span className="text-gray-300">|</span>
          <span className="text-sm font-semibold text-gray-900 whitespace-nowrap">장학금 온라인 신청</span>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <ApplyForm scholarships={scholarships ?? []} />
      </div>
    </div>
  )
}
