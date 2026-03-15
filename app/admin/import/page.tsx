import { supabaseAdmin } from '@/lib/supabase'
import { ImportForm } from './import-form'

export default async function ImportPage() {
  const { data: scholarships = [] } = await supabaseAdmin
    .from('scholarships')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">신청서 가져오기</h1>
        <p className="text-sm text-gray-500 mt-1" style={{ wordBreak: 'keep-all' }}>
          기존 종이 신청서(PDF 또는 이미지)를 업로드하면 AI가 자동으로 내용을 인식하여 입력합니다.
        </p>
      </div>
      <ImportForm scholarships={scholarships ?? []} />
    </div>
  )
}
