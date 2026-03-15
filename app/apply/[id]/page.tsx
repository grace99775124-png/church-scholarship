import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ApplicationForm } from './application-form'

export default async function ApplyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { data: scholarship, error } = await supabase
    .from('scholarships')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (error || !scholarship) notFound()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <a href="/apply" className="text-sm text-gray-500 hover:text-gray-700">
            ← 목록으로
          </a>
          <h1 className="text-2xl font-bold text-gray-900 mt-3 mb-1">
            <span className="whitespace-nowrap">{scholarship.name}</span> 신청
          </h1>
          {scholarship.description && (
            <p className="text-sm text-gray-500" style={{ wordBreak: 'keep-all' }}>
              {scholarship.description}
            </p>
          )}
          <p className="text-blue-600 font-semibold mt-1 whitespace-nowrap">
            장학금액: {scholarship.amount.toLocaleString()}원
          </p>
        </div>

        <ApplicationForm scholarshipId={scholarship.id} />
      </div>
    </div>
  )
}
