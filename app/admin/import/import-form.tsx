'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface Scholarship {
  id: number
  name: string
}

interface ParsedData {
  student_name: string
  birth_date: string
  school: string
  school_level: string
  grade: string
  contact: string
  year: number
  semester: number
  scholarship_type: string
  reason: string
  recommender_name: string
  recommender_title: string
}

const SCHOOL_LEVELS = [
  { value: 'primary', label: '초등학교' },
  { value: 'middle', label: '중학교' },
  { value: 'high', label: '고등학교' },
  { value: 'university', label: '대학교/대학원' },
]

export function ImportForm({ scholarships }: { scholarships: Scholarship[] }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [parseError, setParseError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saved, setSaved] = useState(false)

  const [form, setForm] = useState<ParsedData & { scholarship_id: string; status: string; paid_amount: string }>({
    student_name: '',
    birth_date: '',
    school: '',
    school_level: 'university',
    grade: '1',
    contact: '',
    year: new Date().getFullYear(),
    semester: 1,
    scholarship_type: '',
    reason: '',
    recommender_name: '',
    recommender_title: '',
    scholarship_id: '',
    status: 'pending',
    paid_amount: '',
  })

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }))
  }

  const handleFile = useCallback((f: File) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowed.includes(f.type)) {
      setParseError('JPG, PNG, WebP, PDF 파일만 지원합니다.')
      return
    }
    setFile(f)
    setParseError('')
    setSaveError('')
    setSaved(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [handleFile])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  const parse = async () => {
    if (!file) return
    setParsing(true)
    setParseError('')

    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/admin/parse-application', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) {
        setParseError(json.error ?? '파싱 실패')
        return
      }
      const d: ParsedData = json.data

      // scholarship_type으로 scholarship_id 자동 매칭
      let matchedId = ''
      if (d.scholarship_type) {
        const match = scholarships.find(s => s.name.includes(d.scholarship_type) || d.scholarship_type.includes(s.name.replace(' 장학금', '')))
        if (match) matchedId = String(match.id)
      }

      setForm(prev => ({
        ...prev,
        student_name: d.student_name || prev.student_name,
        birth_date: d.birth_date || prev.birth_date,
        school: d.school || prev.school,
        school_level: d.school_level || prev.school_level,
        grade: d.grade || prev.grade,
        contact: d.contact || prev.contact,
        year: d.year || prev.year,
        semester: d.semester || prev.semester,
        reason: d.reason || prev.reason,
        recommender_name: d.recommender_name || prev.recommender_name,
        recommender_title: d.recommender_title || prev.recommender_title,
        scholarship_id: matchedId || prev.scholarship_id,
      }))
    } catch {
      setParseError('서버 오류가 발생했습니다.')
    } finally {
      setParsing(false)
    }
  }

  const save = async () => {
    if (!form.student_name || !form.scholarship_id) {
      setSaveError('이름과 장학 프로그램은 필수입니다.')
      return
    }
    setSaving(true)
    setSaveError('')

    try {
      const body: Record<string, unknown> = {
        student_name: form.student_name,
        birth_date: form.birth_date || '1900-01-01',
        school: form.school,
        school_level: form.school_level,
        grade: form.grade || '1',
        contact: form.contact,
        year: Number(form.year),
        semester: Number(form.semester),
        reason: form.reason,
        recommender_name: form.recommender_name || null,
        recommender_title: form.recommender_title || null,
        scholarship_id: Number(form.scholarship_id),
        status: form.status,
      }
      if (form.paid_amount) {
        body.paid_amount = parseInt(form.paid_amount.replace(/,/g, ''), 10)
        body.paid_at = new Date().toISOString()
        body.reviewed_by = 'admin'
        body.reviewed_at = new Date().toISOString()
      }

      const res = await fetch('/api/applications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setSaveError(json.error ?? '저장 실패')
        return
      }
      setSaved(true)
      // 폼 초기화
      setFile(null)
      setForm({
        student_name: '', birth_date: '', school: '', school_level: 'university',
        grade: '1', contact: '', year: new Date().getFullYear(), semester: 1,
        scholarship_type: '', reason: '', recommender_name: '', recommender_title: '',
        scholarship_id: '', status: 'pending', paid_amount: '',
      })
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch {
      setSaveError('서버 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 왼쪽: 파일 업로드 */}
      <div>
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-white hover:border-gray-400'
          }`}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.pdf"
            className="hidden"
            onChange={handleInputChange}
          />
          <div className="text-4xl mb-3">📄</div>
          <p className="font-medium text-gray-700" style={{ wordBreak: 'keep-all' }}>
            신청서 파일을 여기에 끌어다 놓거나 클릭하여 선택
          </p>
          <p className="text-sm text-gray-400 mt-1">JPG, PNG, WebP, PDF 지원</p>
        </div>

        {file && (
          <div className="mt-3 flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-3 border">
            <span className="text-sm text-gray-700 flex-1 truncate">{file.name}</span>
            <button
              onClick={parse}
              disabled={parsing}
              className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
            >
              {parsing ? 'AI 분석 중...' : 'AI 자동 인식'}
            </button>
            <button
              onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
              className="text-gray-400 hover:text-gray-600 text-lg leading-none"
            >
              ×
            </button>
          </div>
        )}

        {parseError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" style={{ wordBreak: 'keep-all' }}>
            {parseError}
          </div>
        )}

        {parsing && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700" style={{ wordBreak: 'keep-all' }}>
            <div className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
              </svg>
              Claude AI가 신청서를 분석하고 있습니다...
            </div>
          </div>
        )}

        {/* 안내 */}
        <div className="mt-4 p-4 bg-gray-50 rounded-xl border text-sm text-gray-600 space-y-1" style={{ wordBreak: 'keep-all' }}>
          <p className="font-medium text-gray-700">사용 방법</p>
          <ol className="list-decimal list-inside space-y-1 text-gray-500">
            <li>기존 종이 신청서를 스캔하거나 촬영한 파일을 업로드합니다.</li>
            <li>"AI 자동 인식" 버튼을 클릭합니다.</li>
            <li>오른쪽 양식에서 인식된 내용을 확인하고 수정합니다.</li>
            <li>"저장" 버튼을 클릭하여 신청서를 등록합니다.</li>
          </ol>
        </div>
      </div>

      {/* 오른쪽: 입력 양식 */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold text-gray-800">신청서 정보</h2>

        {saved && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            저장되었습니다. 신청 목록에서 확인하세요.
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">이름 *</label>
            <input
              type="text"
              value={form.student_name}
              onChange={set('student_name')}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="홍길동"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">생년월일</label>
            <input
              type="date"
              value={form.birth_date}
              onChange={set('birth_date')}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">학교</label>
            <input
              type="text"
              value={form.school}
              onChange={set('school')}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="○○대학교"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">학교 구분</label>
            <select
              value={form.school_level}
              onChange={set('school_level')}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SCHOOL_LEVELS.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">학년</label>
            <input
              type="text"
              value={form.grade}
              onChange={set('grade')}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="2"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">연락처</label>
            <input
              type="text"
              value={form.contact}
              onChange={set('contact')}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="010-0000-0000"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">연도</label>
            <input
              type="number"
              value={form.year}
              onChange={set('year')}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">학기</label>
            <select
              value={form.semester}
              onChange={set('semester')}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>1학기</option>
              <option value={2}>2학기</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">장학 프로그램 *</label>
          <select
            value={form.scholarship_id}
            onChange={set('scholarship_id')}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">선택하세요</option>
            {scholarships.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {form.scholarship_type && (
            <p className="text-xs text-gray-400 mt-0.5">신청서 인식값: {form.scholarship_type}</p>
          )}
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">신청 이유</label>
          <textarea
            value={form.reason}
            onChange={set('reason')}
            rows={4}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            style={{ wordBreak: 'keep-all' }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">추천인</label>
            <input
              type="text"
              value={form.recommender_name}
              onChange={set('recommender_name')}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">추천인 직책</label>
            <input
              type="text"
              value={form.recommender_title}
              onChange={set('recommender_title')}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t pt-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">상태</label>
            <select
              value={form.status}
              onChange={set('status')}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">검토 중</option>
              <option value="approved">승인</option>
              <option value="rejected">반려</option>
              <option value="paid">지급 완료</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">지급액 (원, 지급완료시)</label>
            <input
              type="text"
              value={form.paid_amount}
              onChange={set('paid_amount')}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="500000"
            />
          </div>
        </div>

        {saveError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700" style={{ wordBreak: 'keep-all' }}>
            {saveError}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
          <button
            onClick={() => router.push('/admin/applications')}
            className="px-4 py-2.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
          >
            신청 목록
          </button>
        </div>
      </div>
    </div>
  )
}
