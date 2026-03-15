'use client'

import { useState } from 'react'

interface Props {
  token: string
  initial: {
    recommender_name: string
    recommender_title: string
    recommender_comment: string
  }
}

export function RecommendForm({ token, initial }: Props) {
  const [form, setForm] = useState({
    recommender_name: initial.recommender_name,
    recommender_title: initial.recommender_title,
    recommender_phone: '',
    recommender_comment: initial.recommender_comment,
  })
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }))

  const inputClass = "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
  const labelClass = "block text-xs text-gray-500 mb-1"

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.recommender_name.trim() || !form.recommender_comment.trim()) {
      setError('추천인 이름과 추천 내용을 입력해 주세요.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/recommend/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setError(json.error ?? '저장 실패')
        return
      }
      setDone(true)
    } finally {
      setSaving(false)
    }
  }

  if (done) {
    return (
      <div className="text-center py-6">
        <div className="text-3xl mb-3">✅</div>
        <p className="font-semibold text-gray-900 mb-1">추천서가 제출되었습니다</p>
        <p className="text-sm text-gray-500" style={{ wordBreak: 'keep-all' }}>
          감사합니다. 추천 내용이 장학위원회에 전달되었습니다.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <h3 className="font-semibold text-gray-800">추천서 작성</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>추천인 이름 <span className="text-red-500">*</span></label>
          <input value={form.recommender_name} onChange={set('recommender_name')} className={inputClass} required />
        </div>
        <div>
          <label className={labelClass}>직책 <span className="text-red-500">*</span></label>
          <input value={form.recommender_title} onChange={set('recommender_title')} className={inputClass} placeholder="담임교사, 담당교역자 등" required />
        </div>
        <div className="col-span-2">
          <label className={labelClass}>연락처</label>
          <input value={form.recommender_phone} onChange={set('recommender_phone')} className={inputClass} placeholder="010-0000-0000" />
        </div>
      </div>
      <div>
        <label className={labelClass}>추천 내용 <span className="text-red-500">*</span></label>
        <textarea
          value={form.recommender_comment}
          onChange={set('recommender_comment')}
          rows={6}
          className={inputClass}
          placeholder="신청자의 신앙생활, 봉사활동, 학업 등을 구체적으로 작성해 주세요."
          required
          style={{ wordBreak: 'keep-all' }}
        />
      </div>
      <p className="text-xs text-gray-400" style={{ wordBreak: 'keep-all' }}>
        ※ 담임교사, 책임전도사, 담당 목사님만 추천이 가능합니다. (선교회장·장로·집사 불인정)
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="w-full py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? '제출 중...' : '추천서 제출'}
      </button>
    </form>
  )
}
