'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

const SCHOOL_LEVELS = [
  { value: 'primary', label: '초등학교' },
  { value: 'middle', label: '중학교' },
  { value: 'high', label: '고등학교' },
  { value: 'university', label: '대학교' },
]

interface UploadedFile {
  name: string
  url: string
}

export function ApplicationForm({ scholarshipId }: { scholarshipId: number }) {
  const router = useRouter()
  const currentYear = new Date().getFullYear()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    student_name: '',
    birth_date: '',
    school: '',
    school_level: 'middle',
    grade: '',
    semester: '1',
    year: String(currentYear),
    contact: '',
    reason: '',
    recommender_name: '',
    recommender_title: '',
    recommender_phone: '',
    recommender_comment: '',
  })

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? [])
    setFiles(prev => [...prev, ...selected])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
    // 이미 업로드된 파일도 제거
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async (): Promise<string[]> => {
    if (files.length === 0) return []

    // 이미 업로드된 파일은 제외
    const alreadyUploadedCount = uploadedFiles.length
    const newFiles = files.slice(alreadyUploadedCount)
    if (newFiles.length === 0) return uploadedFiles.map(f => f.url)

    setUploading(true)
    const formData = new FormData()
    for (const file of newFiles) {
      formData.append('files', file)
    }

    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json()
    setUploading(false)

    if (!res.ok) throw new Error(data.error ?? '파일 업로드 실패')

    const newUploaded: UploadedFile[] = newFiles.map((f, i) => ({ name: f.name, url: data.urls[i] }))
    const all = [...uploadedFiles, ...newUploaded]
    setUploadedFiles(all)
    return all.map(f => f.url)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let attachmentUrls: string[] = []
      if (files.length > 0) {
        attachmentUrls = await uploadFiles()
      }

      const body = {
        ...form,
        scholarship_id: scholarshipId,
        semester: parseInt(form.semester),
        year: parseInt(form.year),
        attachments: JSON.stringify(attachmentUrls),
      }

      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        router.push('/apply/success')
      } else {
        const data = await res.json()
        setError(data.error || '신청 중 오류가 발생했습니다.')
      }
    } catch (err: any) {
      setError(err.message ?? '서버 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 학생 정보 */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold text-gray-900 mb-4">학생 정보</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>이름 <span className="text-red-500">*</span></label>
            <input value={form.student_name} onChange={set('student_name')} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>생년월일 <span className="text-red-500">*</span></label>
            <input type="date" value={form.birth_date} onChange={set('birth_date')} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>학교 이름 <span className="text-red-500">*</span></label>
            <input value={form.school} onChange={set('school')} className={inputClass} placeholder="예: 해운대초등학교" required />
          </div>
          <div>
            <label className={labelClass}>학교 구분 <span className="text-red-500">*</span></label>
            <select value={form.school_level} onChange={set('school_level')} className={inputClass}>
              {SCHOOL_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>학년 <span className="text-red-500">*</span></label>
            <input value={form.grade} onChange={set('grade')} className={inputClass} placeholder="예: 3" required />
          </div>
          <div>
            <label className={labelClass}>연락처 <span className="text-red-500">*</span></label>
            <input value={form.contact} onChange={set('contact')} className={inputClass} placeholder="010-0000-0000" required />
          </div>
          <div>
            <label className={labelClass}>신청 연도 <span className="text-red-500">*</span></label>
            <input type="number" value={form.year} onChange={set('year')} className={inputClass} required />
          </div>
          <div>
            <label className={labelClass}>학기 <span className="text-red-500">*</span></label>
            <select value={form.semester} onChange={set('semester')} className={inputClass}>
              <option value="1">1학기</option>
              <option value="2">2학기</option>
            </select>
          </div>
        </div>
      </div>

      {/* 신청 이유 */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold text-gray-900 mb-4">장학금 신청 사유</h2>
        <p className="text-xs text-gray-500 mb-2" style={{ wordBreak: 'keep-all' }}>
          해당 장학금에 적합한 내용을 구체적으로 작성해 주세요. (신청자 본인이 직접 작성)
        </p>
        <textarea
          value={form.reason}
          onChange={set('reason')}
          rows={5}
          className={inputClass}
          placeholder="장학금 신청 사유를 상세히 작성해 주세요."
          required
        />
      </div>

      {/* 증빙서류 첨부 */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold text-gray-900 mb-1">
          증빙서류 첨부 <span className="text-sm font-normal text-gray-400">(선택)</span>
        </h2>
        <p className="text-xs text-gray-500 mb-4" style={{ wordBreak: 'keep-all' }}>
          대학입학증명서, 재학증명서, 성적증명서, 추천서 등 해당 서류를 첨부해 주세요. (PDF, JPG, PNG · 파일당 최대 10MB)
        </p>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.webp"
          onChange={handleFileChange}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 border border-dashed border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors w-full justify-center"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          파일 선택
        </button>

        {files.length > 0 && (
          <ul className="mt-3 space-y-2">
            {files.map((file, i) => (
              <li key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="truncate text-gray-700">{file.name}</span>
                  <span className="text-gray-400 flex-shrink-0">({(file.size / 1024).toFixed(0)}KB)</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="text-gray-400 hover:text-red-500 flex-shrink-0 ml-2"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 추천인 정보 */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold text-gray-900 mb-1">
          추천인 정보 <span className="text-sm font-normal text-gray-400">(필수 — 담당교사 또는 교역자)</span>
        </h2>
        <p className="text-xs text-gray-500 mb-4" style={{ wordBreak: 'keep-all' }}>
          추천서는 담임 선생님, 책임전도사, 담당 목사님이 작성해야 합니다. (선교회장·장로·집사 불인정)
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>추천인 이름</label>
            <input value={form.recommender_name} onChange={set('recommender_name')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>직책</label>
            <input value={form.recommender_title} onChange={set('recommender_title')} className={inputClass} placeholder="예: 담임교사" />
          </div>
          <div>
            <label className={labelClass}>연락처</label>
            <input value={form.recommender_phone} onChange={set('recommender_phone')} className={inputClass} />
          </div>
        </div>
        <div className="mt-4">
          <label className={labelClass}>추천 내용</label>
          <textarea
            value={form.recommender_comment}
            onChange={set('recommender_comment')}
            rows={4}
            className={inputClass}
            placeholder="추천 내용을 구체적이고 설득력 있게 작성해 주세요."
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || uploading}
        className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {uploading ? '파일 업로드 중...' : loading ? '제출 중...' : '장학금 신청하기'}
      </button>
    </form>
  )
}
