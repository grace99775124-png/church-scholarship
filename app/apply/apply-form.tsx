'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

interface Scholarship {
  id: number
  name: string
  description: string
  amount: number
  amount_k12: number
  amount_univ: number
  amount_grad: number
}

const SCHOOL_LEVELS = [
  { value: 'primary', label: '초등학교' },
  { value: 'middle', label: '중학교' },
  { value: 'high', label: '고등학교' },
  { value: 'university', label: '대학교' },
  { value: 'graduate', label: '대학원' },
]

// 학교 구분에 맞는 장학금액 반환
function getAmount(s: Scholarship, schoolLevel: string): number {
  if (schoolLevel === 'university') return s.amount_univ || s.amount || 0
  if (schoolLevel === 'graduate') return s.amount_grad || s.amount_univ || s.amount || 0
  // primary, middle, high
  return s.amount_k12 || s.amount || 0
}

const SCHOLARSHIP_DESC: Record<string, string> = {
  '여호수아 장학금': '대학 입학 대상자에게 지급합니다.',
  '바나바 장학금': '교회 봉사자 대상 · 초·중·고·대학·대학원생',
  '다비다 장학금': '생활 보조 대상 · 대학·대학원생만 해당',
  '다니엘 장학금': '학업 우수자 · 대학·대학원생만 해당',
  '빌립 장학금': '전도 활동 대상 · 초·중·고·대학·대학원생 · 다른 장학금과 중복 신청 가능',
  '특별 장학금': '위 항목에 해당하지 않는 특별한 지원 사유',
}

export function ApplyForm({ scholarships }: { scholarships: Scholarship[] }) {
  const router = useRouter()
  const currentYear = new Date().getFullYear()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const photoInputRef = useRef<HTMLInputElement>(null)

  const bilipScholarship = scholarships.find(s => s.name.includes('빌립'))

  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [includeBilip, setIncludeBilip] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [files, setFiles] = useState<File[]>([])

  // 증명사진 관련 상태
  const [photoFile, setPhotoFile] = useState<File | null>(null)           // 새로 선택한 사진 파일
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)    // 미리보기 (blob URL)
  const [existingPhotoUrl, setExistingPhotoUrl] = useState<string | null>(null) // DB에서 찾은 기존 사진
  const [useExistingPhoto, setUseExistingPhoto] = useState(true)           // 기존 사진 사용 여부
  const [photoLookupDone, setPhotoLookupDone] = useState(false)

  const [form, setForm] = useState({
    student_name: '',
    birth_date: '',
    school: '',
    school_level: 'primary',
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

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const selectedScholarship = scholarships.find(s => s.id === selectedId)
  const isSelectedBilip = selectedScholarship?.name.includes('빌립') ?? false
  const schoolLevel = form.school_level

  // 이름 + 생년월일 입력되면 기존 사진 자동 조회
  const lookupPhoto = useCallback(async (name: string, birthDate: string) => {
    if (!name.trim() || !birthDate) return
    try {
      const res = await fetch(`/api/student-photo?name=${encodeURIComponent(name.trim())}&birth_date=${encodeURIComponent(birthDate)}`)
      const json = await res.json()
      setPhotoLookupDone(true)
      if (json.photo_url) {
        setExistingPhotoUrl(json.photo_url)
        setUseExistingPhoto(true)
      } else {
        setExistingPhotoUrl(null)
        setUseExistingPhoto(false)
      }
    } catch {
      setPhotoLookupDone(true)
    }
  }, [])

  // 이름 또는 생년월일이 변경될 때 debounce 조회
  useEffect(() => {
    if (!form.student_name.trim() || !form.birth_date) {
      setPhotoLookupDone(false)
      setExistingPhotoUrl(null)
      return
    }
    const timer = setTimeout(() => {
      lookupPhoto(form.student_name, form.birth_date)
    }, 600)
    return () => clearTimeout(timer)
  }, [form.student_name, form.birth_date, lookupPhoto])

  // 사진 파일 선택
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setPhotoFile(f)
    setUseExistingPhoto(false)
    const url = URL.createObjectURL(f)
    setPhotoPreview(url)
  }

  // 증명사진 업로드 (새 파일인 경우에만)
  const uploadPhoto = async (): Promise<string | null> => {
    if (useExistingPhoto && existingPhotoUrl) return existingPhotoUrl
    if (!photoFile) return null
    const fd = new FormData()
    fd.append('photo', photoFile)
    const res = await fetch('/api/upload-photo', { method: 'POST', body: fd })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error ?? '사진 업로드 실패')
    return data.url as string
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(prev => [...prev, ...Array.from(e.target.files ?? [])])
  }

  const uploadFiles = async (): Promise<string[]> => {
    if (files.length === 0) return []
    setUploading(true)
    const fd = new FormData()
    for (const f of files) fd.append('files', f)
    const res = await fetch('/api/upload', { method: 'POST', body: fd })
    const data = await res.json()
    setUploading(false)
    if (!res.ok) throw new Error(data.error ?? '파일 업로드 실패')
    return data.urls as string[]
  }

  const submitApplication = async (scholarshipId: number, attachmentUrls: string[], photoUrl: string | null): Promise<string | null> => {
    const body: Record<string, unknown> = {
      ...form,
      scholarship_id: scholarshipId,
      semester: parseInt(form.semester),
      year: parseInt(form.year),
      attachments: JSON.stringify(attachmentUrls),
    }
    if (photoUrl) body.photo_url = photoUrl
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error ?? '신청 중 오류가 발생했습니다.')
    }
    const data = await res.json()
    return data.recommender_token ?? null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedId) { setError('장학금을 선택해 주세요.'); return }
    setError('')
    setLoading(true)

    try {
      const [attachmentUrls, photoUrl] = await Promise.all([uploadFiles(), uploadPhoto()])

      const token = await submitApplication(selectedId, attachmentUrls, photoUrl)

      if (includeBilip && bilipScholarship && !isSelectedBilip) {
        await submitApplication(bilipScholarship.id, attachmentUrls, photoUrl)
      }

      router.push(token ? `/apply/success?token=${token}` : '/apply/success')
    } catch (err: any) {
      setError(err.message ?? '서버 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 현재 표시할 사진 URL (미리보기 > 기존 사진)
  const displayPhoto = photoPreview ?? (useExistingPhoto ? existingPhotoUrl : null)

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* ① 장학금 선택 */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold text-gray-900 mb-1">장학금 선택 <span className="text-red-500">*</span></h2>
        <p className="text-xs text-gray-500 mb-4" style={{ wordBreak: 'keep-all' }}>
          원칙적으로 하나만 선택합니다. 빌립 장학금은 다른 장학금과 중복 신청할 수 있습니다.
        </p>

        {/* 학교 구분 미선택 시 안내 */}
        {!schoolLevel && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-3">
            학생 정보의 학교 구분을 먼저 선택하면 해당 금액이 표시됩니다.
          </p>
        )}

        <div className="space-y-2">
          {scholarships.map(s => {
            const checked = selectedId === s.id
            const amt = getAmount(s, schoolLevel)
            return (
              <label
                key={s.id}
                className={`flex items-start gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                  checked ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="scholarship"
                  value={s.id}
                  checked={checked}
                  onChange={() => { setSelectedId(s.id); setIncludeBilip(false) }}
                  className="mt-0.5 accent-blue-600"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm whitespace-nowrap">{s.name}</span>
                    {amt > 0 && (
                      <span className="text-xs text-blue-600 font-semibold whitespace-nowrap">{amt.toLocaleString()}원</span>
                    )}
                    {s.name.includes('빌립') && (
                      <span className="text-xs bg-orange-100 text-orange-700 rounded-full px-2 py-0.5 whitespace-nowrap">중복 가능</span>
                    )}
                  </div>
                  {checked && SCHOLARSHIP_DESC[s.name] && (
                    <p className="text-xs text-gray-500 mt-0.5" style={{ wordBreak: 'keep-all' }}>{SCHOLARSHIP_DESC[s.name]}</p>
                  )}
                </div>
              </label>
            )
          })}
        </div>

        {selectedId && !isSelectedBilip && bilipScholarship && (
          <label className={`mt-3 flex items-start gap-3 rounded-lg border-2 border-dashed px-4 py-3 cursor-pointer transition-colors ${
            includeBilip ? 'border-orange-400 bg-orange-50' : 'border-gray-300 hover:border-orange-300'
          }`}>
            <input
              type="checkbox"
              checked={includeBilip}
              onChange={e => setIncludeBilip(e.target.checked)}
              className="mt-0.5 accent-orange-500"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">빌립 장학금 중복 신청</span>
                {getAmount(bilipScholarship, schoolLevel) > 0 && (
                  <span className="text-xs text-orange-600 font-semibold whitespace-nowrap">+{getAmount(bilipScholarship, schoolLevel).toLocaleString()}원</span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5" style={{ wordBreak: 'keep-all' }}>
                전도 활동으로 빌립 장학금을 함께 신청합니다.
              </p>
            </div>
          </label>
        )}

        {selectedId && (
          <div className="mt-3 text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
            선택된 장학금: <strong>{selectedScholarship?.name}</strong>
            {selectedScholarship && getAmount(selectedScholarship, schoolLevel) > 0 && (
              <span className="ml-1 font-semibold">({getAmount(selectedScholarship, schoolLevel).toLocaleString()}원)</span>
            )}
            {includeBilip && !isSelectedBilip && bilipScholarship && (
              <> + <strong>{bilipScholarship.name}</strong>
                {getAmount(bilipScholarship, schoolLevel) > 0 && (
                  <span className="ml-1">({getAmount(bilipScholarship, schoolLevel).toLocaleString()}원)</span>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ② 학생 정보 + 증명사진 */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold text-gray-900 mb-4">학생 정보</h2>

        <div className="flex gap-5">
          {/* 좌: 입력 필드 */}
          <div className="flex-1 grid grid-cols-2 gap-4">
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

          {/* 우: 증명사진 */}
          <div className="flex-shrink-0 w-28">
            <p className="text-sm font-medium text-gray-700 mb-1">증명사진</p>
            <p className="text-xs text-gray-400 mb-2 leading-tight" style={{ wordBreak: 'keep-all' }}>
              3×4cm<br />JPG·PNG·WebP<br />5MB 이하
            </p>

            {/* 사진 미리보기 or 빈 박스 */}
            <div
              className="w-24 h-32 border-2 border-dashed border-gray-300 rounded overflow-hidden bg-gray-50 flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors mb-2 relative"
              onClick={() => photoInputRef.current?.click()}
            >
              {displayPhoto ? (
                <img
                  src={displayPhoto}
                  alt="증명사진"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center text-gray-300">
                  <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-xs mt-1 block">클릭</span>
                </div>
              )}
            </div>

            <input
              ref={photoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              className="hidden"
            />

            {/* 기존 사진 발견됨 */}
            {photoLookupDone && existingPhotoUrl && (
              <div className="mt-1 space-y-1">
                <p className="text-xs text-green-600 font-medium">이전 사진 발견됨</p>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useExistingPhoto && !photoPreview}
                    onChange={e => {
                      setUseExistingPhoto(e.target.checked)
                      if (e.target.checked) { setPhotoFile(null); setPhotoPreview(null) }
                    }}
                    className="accent-green-600"
                  />
                  <span className="text-xs text-gray-600">이전 사진 사용</span>
                </label>
                <button
                  type="button"
                  onClick={() => { setUseExistingPhoto(false); photoInputRef.current?.click() }}
                  className="text-xs text-blue-500 hover:underline block"
                >
                  새 사진으로 변경
                </button>
              </div>
            )}

            {/* 사진 없음 안내 */}
            {photoLookupDone && !existingPhotoUrl && !displayPhoto && (
              <p className="text-xs text-gray-400 mt-1" style={{ wordBreak: 'keep-all' }}>
                사진을 클릭하여 업로드
              </p>
            )}

            {/* 새 사진 선택됨 */}
            {photoPreview && (
              <button
                type="button"
                onClick={() => { setPhotoFile(null); setPhotoPreview(null); setUseExistingPhoto(!!existingPhotoUrl) }}
                className="text-xs text-red-400 hover:underline mt-1 block"
              >
                사진 제거
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ③ 신청 사유 */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold text-gray-900 mb-1">장학금 신청 사유 <span className="text-red-500">*</span></h2>
        <p className="text-xs text-gray-500 mb-3" style={{ wordBreak: 'keep-all' }}>
          해당 장학금에 적합한 내용을 구체적으로 작성해 주세요. (신청자 본인 작성)
        </p>
        <textarea
          value={form.reason}
          onChange={set('reason')}
          rows={5}
          className={inputClass}
          placeholder="장학금 신청 사유를 상세히 작성해 주세요."
          required
          style={{ wordBreak: 'keep-all' }}
        />
      </div>

      {/* ④ 증빙서류 */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold text-gray-900 mb-1">
          증빙서류 첨부 <span className="text-sm font-normal text-gray-400">(선택)</span>
        </h2>
        <p className="text-xs text-gray-500 mb-4" style={{ wordBreak: 'keep-all' }}>
          재학증명서, 성적증명서, 추천서 등 (PDF, JPG, PNG · 파일당 최대 10MB)
        </p>
        <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={handleFileChange} className="hidden" />
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
            {files.map((f, i) => (
              <li key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                <span className="truncate text-gray-700">{f.name}</span>
                <button type="button" onClick={() => setFiles(p => p.filter((_, j) => j !== i))} className="ml-2 text-gray-400 hover:text-red-500">✕</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ⑤ 추천인 */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold text-gray-900 mb-1">추천인 정보</h2>
        <p className="text-xs text-gray-500 mb-4" style={{ wordBreak: 'keep-all' }}>
          담임 선생님, 책임전도사, 담당 목사님이 작성해야 합니다. (선교회장·장로·집사 불인정)
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
            style={{ wordBreak: 'keep-all' }}
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3" style={{ wordBreak: 'keep-all' }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || uploading || !selectedId}
        className="w-full bg-blue-700 text-white py-3.5 rounded-xl font-semibold hover:bg-blue-800 disabled:opacity-50 transition-colors"
      >
        {uploading ? '파일 업로드 중...' : loading ? '제출 중...' : '장학금 신청하기'}
      </button>

      <p className="text-center text-xs text-gray-400 pb-4" style={{ wordBreak: 'keep-all' }}>
        온라인 신청은 접수 확인용입니다. 반드시 신청서 원본과 증빙서류를 사무실에 제출하세요.
      </p>
    </form>
  )
}
