'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Announcement {
  id?: number
  year: number
  semester: number
  deadline: string
  notes: string
  is_active: boolean
}

const CURRENT_YEAR = new Date().getFullYear()

const EMPTY: Omit<Announcement, 'id'> = {
  year: CURRENT_YEAR,
  semester: 1,
  deadline: '',
  notes: '',
  is_active: false,
}

export function AnnouncementEditor({ announcements }: { announcements: Announcement[] }) {
  const router = useRouter()
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [form, setForm] = useState<Omit<Announcement, 'id'>>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const openNew = () => {
    setEditing(null)
    setForm(EMPTY)
    setError('')
  }

  const openEdit = (a: Announcement) => {
    setEditing(a)
    setForm({ year: a.year, semester: a.semester, deadline: a.deadline, notes: a.notes, is_active: a.is_active })
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [key]: key === 'year' || key === 'semester' ? Number(e.target.value) : e.target.value }))

  const save = async () => {
    if (!form.deadline.trim()) { setError('신청 기간을 입력해 주세요.'); return }
    setSaving(true)
    setError('')

    try {
      const method = editing?.id ? 'PATCH' : 'POST'
      const body = editing?.id ? { id: editing.id, ...form } : form

      const res = await fetch('/api/admin/announcements', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? '저장 실패')
        return
      }

      setEditing(null)
      setForm(EMPTY)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  const activate = async (a: Announcement) => {
    await fetch('/api/admin/announcements', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: a.id, is_active: true }),
    })
    router.refresh()
  }

  const deactivate = async (a: Announcement) => {
    await fetch('/api/admin/announcements', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: a.id, is_active: false }),
    })
    router.refresh()
  }

  const inputClass = "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"

  return (
    <div className="space-y-6">
      {/* 편집 폼 */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold text-gray-900 mb-4">
          {editing ? `${editing.year}년 ${editing.semester}학기 공고문 수정` : '새 공고문 작성'}
        </h2>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">연도</label>
            <select value={form.year} onChange={set('year')} className={inputClass}>
              {Array.from({ length: 6 }, (_, i) => CURRENT_YEAR - 2 + i).map(y => (
                <option key={y} value={y}>{y}년</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">학기</label>
            <select value={form.semester} onChange={set('semester')} className={inputClass}>
              <option value={1}>1학기</option>
              <option value={2}>2학기</option>
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1">신청 기간 <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={form.deadline}
            onChange={set('deadline')}
            className={inputClass}
            placeholder="예: 2025년 2월 23일(일요일)까지"
          />
        </div>

        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1">추가 공지사항</label>
          <textarea
            value={form.notes}
            onChange={set('notes')}
            rows={4}
            className={inputClass}
            placeholder="특별 공지사항이 있으면 입력하세요. (없으면 비워두세요)"
            style={{ wordBreak: 'keep-all' }}
          />
        </div>

        <div className="flex items-center gap-3 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={e => setForm(prev => ({ ...prev, is_active: e.target.checked }))}
              className="accent-blue-600"
            />
            <span className="text-sm text-gray-700">홈페이지에 이 공고문 표시 (활성화)</span>
          </label>
        </div>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="px-5 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
          {editing && (
            <button
              onClick={() => { setEditing(null); setForm(EMPTY) }}
              className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200"
            >
              취소
            </button>
          )}
          {!editing && (
            <button
              onClick={openNew}
              className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200"
            >
              초기화
            </button>
          )}
        </div>
      </div>

      {/* 공고문 목록 */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-3 border-b bg-gray-50">
          <h2 className="font-medium text-gray-800">저장된 공고문</h2>
        </div>
        {announcements.length === 0 ? (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">저장된 공고문이 없습니다.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">학기</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">신청 기간</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">상태</th>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {announcements.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium whitespace-nowrap">
                    {a.year}년 {a.semester}학기
                  </td>
                  <td className="px-4 py-3 text-gray-600" style={{ wordBreak: 'keep-all' }}>
                    {a.deadline || '-'}
                  </td>
                  <td className="px-4 py-3">
                    {a.is_active ? (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        홈페이지 표시 중
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        비활성
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(a)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        수정
                      </button>
                      {!a.is_active ? (
                        <button
                          onClick={() => activate(a)}
                          className="text-xs text-green-600 hover:underline"
                        >
                          활성화
                        </button>
                      ) : (
                        <button
                          onClick={() => deactivate(a)}
                          className="text-xs text-gray-400 hover:underline"
                        >
                          비활성화
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
