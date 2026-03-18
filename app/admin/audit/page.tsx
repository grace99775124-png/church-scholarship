'use client'

import { useState, useRef, useEffect } from 'react'

declare global { interface Window { pdfjsLib: any } }

const SECTIONS = [
  { id: 'qualify', icon: '📋', title: '신청 자격 심사', color: '#6c3483', items: [
    '장학금 신청자가 학적 요건(재학 증명)을 충족하였는가?',
    '신앙 요건(세례, 출석, 봉사 등)을 충족하였는가?',
    '추천서(담임목사 또는 지도교사)가 필수 첨부되어 있는가?',
    '신청서 및 제출 서류가 기한 내에 접수되었는가?',
    '신청 자격 미달 건에 대한 반려 처리가 적절히 이루어졌는가?',
  ]},
  { id: 'review', icon: '⚖️', title: '심사 절차', color: '#1a5276', items: [
    '심사위원회가 규정된 인원으로 구성되어 심사를 진행하였는가?',
    '심사 기준(점수표, 평가항목)이 사전에 마련되어 있었는가?',
    '심사 결과(선발 명단, 점수, 의견)가 문서화되어 보관되고 있는가?',
    '심사위원 간 이해충돌(친인척 등) 여부를 사전에 확인하였는가?',
    '심사 회의록이 작성·서명되어 보관되고 있는가?',
  ]},
  { id: 'payment', icon: '💰', title: '지급 관리', color: '#1d6a4a', items: [
    '동일 학기 내 동일인에게 중복 지급된 사례가 없는가?',
    '지급 금액이 예산 범위 내에서 집행되었는가?',
    '지급 방법(계좌이체 또는 현금)과 수령 확인이 기록되어 있는가?',
    '학기 단위 관리가 시스템(DB)에 정확히 반영되어 있는가?',
    '6개 장학금 유형(바나바·빌립·다비다·다니엘·여호수아·특별)별로 구분 관리되고 있는가?',
    '지급 내역이 재정 장부와 일치하는가?',
  ]},
  { id: 'followup', icon: '📊', title: '사후 관리', color: '#935116', items: [
    '지급 후 학업 지속 여부(성적증명서 등) 사후 관리가 이루어지고 있는가?',
    '수혜자 명단 및 이력이 누락 없이 보관되고 있는가?',
    '특별장학금 지급 시 별도 결의(당회 또는 위원회)를 거쳤는가?',
    '장학금 예산 집행률이 연말 결산에 반영되었는가?',
    '다음 학기 장학금 계획 수립 시 이번 감사 결과가 반영될 예정인가?',
  ]},
]

type Status = 'none' | 'good' | 'bad' | 'na'
type CheckItem = { status: Status; memo: string }
type Checks = Record<string, Record<number, CheckItem>>

function initChecks(): Checks {
  const c: Checks = {}
  SECTIONS.forEach(s => {
    c[s.id] = {}
    s.items.forEach((_, i) => { c[s.id][i] = { status: 'none', memo: '' } })
  })
  return c
}

const LS_CHECKS = 'audit_checks_v1'
const LS_RPT = 'audit_report_info_v1'
const LS_AI = 'audit_ai_result_v1'

export default function AuditPage() {
  const [checks, setChecks] = useState<Checks>(initChecks)
  const [activeSection, setActiveSection] = useState('qualify')
  const [activeTab, setActiveTab] = useState<'checklist' | 'ai' | 'report' | 'rpt'>('checklist')
  const [fileContent, setFileContent] = useState('')
  const [fileName, setFileName] = useState('')
  const [memoInput, setMemoInput] = useState('')
  const [aiResult, setAiResult] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [fileLoading, setFileLoading] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  // 감사보고서 탭 상태
  const [rptInfo, setRptInfo] = useState({ year: '', sem: '', date: '', auditor: '' })
  const [rptOpinion, setRptOpinion] = useState('')
  const [rptLoading, setRptLoading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── 자동 불러오기 ──
  useEffect(() => {
    try {
      const c = localStorage.getItem(LS_CHECKS)
      if (c) setChecks(JSON.parse(c))
      const r = localStorage.getItem(LS_RPT)
      if (r) {
        const parsed = JSON.parse(r)
        setRptInfo(parsed.info || {})
        setRptOpinion(parsed.opinion || '')
      }
      const a = localStorage.getItem(LS_AI)
      if (a) setAiResult(a)
    } catch {}
  }, [])

  // ── 자동 저장 ──
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        localStorage.setItem(LS_CHECKS, JSON.stringify(checks))
        localStorage.setItem(LS_AI, aiResult)
        localStorage.setItem(LS_RPT, JSON.stringify({ info: rptInfo, opinion: rptOpinion }))
        setSavedAt(new Date().toLocaleTimeString('ko-KR'))
      } catch {}
    }, 800)
    return () => clearTimeout(id)
  }, [checks, aiResult, rptInfo, rptOpinion])

  function getStats(sid: string) {
    const vals = Object.values(checks[sid])
    return {
      total: vals.length,
      good: vals.filter(v => v.status === 'good').length,
      bad: vals.filter(v => v.status === 'bad').length,
      na: vals.filter(v => v.status === 'na').length,
      done: vals.filter(v => v.status !== 'none').length,
    }
  }

  function getTotals() {
    return SECTIONS.reduce((acc, s) => {
      const st = getStats(s.id)
      return { total: acc.total + st.total, good: acc.good + st.good, bad: acc.bad + st.bad, na: acc.na + st.na, done: acc.done + st.done }
    }, { total: 0, good: 0, bad: 0, na: 0, done: 0 })
  }

  function setStatus(sid: string, idx: number, st: Status) {
    setChecks(prev => ({
      ...prev,
      [sid]: { ...prev[sid], [idx]: { ...prev[sid][idx], status: prev[sid][idx].status === st ? 'none' : st } },
    }))
  }

  function setMemo(sid: string, idx: number, val: string) {
    setChecks(prev => ({
      ...prev,
      [sid]: { ...prev[sid], [idx]: { ...prev[sid][idx], memo: val } },
    }))
  }

  async function handleFile(file: File) {
    setFileName(file.name)
    setFileLoading(true)
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'pdf') {
      if (!window.pdfjsLib) {
        await new Promise<void>(resolve => {
          const sc = document.createElement('script')
          sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'
          sc.onload = () => resolve()
          document.head.appendChild(sc)
        })
      }
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
      const ab = await file.arrayBuffer()
      const pdf = await window.pdfjsLib.getDocument({ data: ab }).promise
      let txt = ''
      for (let i = 1; i <= pdf.numPages; i++) {
        const pg = await pdf.getPage(i)
        const ct = await pg.getTextContent()
        txt += `[${i}페이지]\n` + ct.items.map((x: any) => x.str).join(' ') + '\n\n'
      }
      setFileContent(txt)
    } else {
      setFileContent(await file.text())
    }
    setFileLoading(false)
  }

  async function runAi() {
    const prompt = fileContent
      ? `다음은 교회 장학금 관련 문서입니다. 장학금 감사 관점에서 이상 항목, 절차 미준수, 개선 권고사항을 한국어로 상세히 분석해주세요.\n\n파일명: ${fileName}\n\n내용:\n${fileContent.slice(0, 8000)}`
      : `다음은 장학금 감사 관련 메모입니다. 문제점과 개선 권고사항을 한국어로 분석해주세요.\n\n${memoInput}`
    setAiLoading(true)
    try {
      const res = await fetch('/api/audit/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) })
      const data = await res.json()
      setAiResult(data.text || data.error || '결과를 가져오지 못했습니다.')
    } catch (e: any) {
      setAiResult('오류: ' + e.message)
    }
    setAiLoading(false)
  }

  // ── 감사보고서 자동 작성 (AI) ──
  function buildChecklistSummary() {
    const totals = getTotals()
    const score = totals.done > 0 ? Math.round((totals.good + totals.na) / totals.done * 100) : 0
    let text = `[감사 개요]\n감사 연도/학기: ${rptInfo.year || '미입력'}년 ${rptInfo.sem || ''}\n감사일: ${rptInfo.date || '미입력'}\n담당자: ${rptInfo.auditor || '미입력'}\n\n`
    text += `[전체 결과] 점검 ${totals.done}/${totals.total}개 · 적합도 ${score}점 · 양호 ${totals.good} · 미흡 ${totals.bad} · 해당없음 ${totals.na}\n\n`
    SECTIONS.forEach(s => {
      const st = getStats(s.id)
      text += `[${s.title}] 양호 ${st.good} / 미흡 ${st.bad} / 해당없음 ${st.na}\n`
      s.items.forEach((q, i) => {
        if (checks[s.id][i]?.status === 'bad') {
          text += `  ✗ ${q}${checks[s.id][i]?.memo ? ' → ' + checks[s.id][i].memo : ''}\n`
        }
      })
    })
    if (aiResult) text += `\n[AI 분석 요약]\n${aiResult.slice(0, 800)}`
    return text
  }

  async function generateAiReport() {
    setRptLoading(true)
    const summary = buildChecklistSummary()
    const prompt = `다음은 해운대순복음교회 장학위원회 자체 감사 결과입니다.\n\n${summary}\n\n위 결과를 바탕으로 공식 자체감사 보고서의 '종합 감사의견'을 400자 내외로 작성해주세요. 주요 미흡사항, 개선 권고, 전반적 평가를 포함하고 격식 있는 문어체로 작성해 주세요.`
    try {
      const res = await fetch('/api/audit/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) })
      const data = await res.json()
      setRptOpinion(data.text || '')
    } catch (e: any) {
      setRptOpinion('오류: ' + e.message)
    }
    setRptLoading(false)
  }

  // ── PDF 다운로드 ──
  function buildReportHTML() {
    const totals = getTotals()
    const score = totals.done > 0 ? Math.round((totals.good + totals.na) / totals.done * 100) : 0
    const level = score >= 90 ? '우수' : score >= 80 ? '양호' : score >= 60 ? '보통' : '개선 필요'
    const lc = score >= 80 ? '#27ae60' : score >= 60 ? '#f39c12' : '#e74c3c'

    let secRows = ''
    SECTIONS.forEach(s => {
      const st = getStats(s.id)
      const ss = st.done > 0 ? Math.round((st.good + st.na) / st.done * 100) : 0
      secRows += `<tr><td>${s.icon} ${s.title}</td><td style="text-align:center">${st.done}/${st.total}</td><td style="text-align:center;color:#27ae60;font-weight:600">${st.good}</td><td style="text-align:center;color:#e74c3c;font-weight:600">${st.bad}</td><td style="text-align:center;color:#95a5a6">${st.na}</td><td style="text-align:center;font-weight:700;color:${ss>=80?'#27ae60':ss>=60?'#f39c12':'#e74c3c'}">${ss}점</td></tr>`
    })

    let badRows = ''
    let gi = 0
    let hasBad = false
    SECTIONS.forEach(s => {
      s.items.forEach((q, i) => {
        if (checks[s.id][i]?.status === 'bad') {
          hasBad = true
          badRows += `<tr><td style="color:#6c3483;white-space:nowrap">${s.icon} ${s.title}</td><td>Q${gi + 1}. ${q}</td><td style="color:#e74c3c">${checks[s.id][i]?.memo || '-'}</td></tr>`
        }
        gi++
      })
    })

    const opinion = rptOpinion || aiResult

    return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<title>장학위원회 자체 감사 보고서</title>
<style>
body{font-family:'Apple SD Gothic Neo','Noto Sans KR',sans-serif;background:#f5f5f5;margin:0;padding:20px;}
.wrap{max-width:800px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,.1);}
.rh{background:linear-gradient(135deg,#2c1654,#6c3483);padding:30px 36px;color:white;}
.rh h1{font-size:22px;font-weight:700;margin-bottom:5px;}.rh p{font-size:13px;opacity:.8;}
.rb{padding:28px 36px;}.rs{margin-bottom:24px;}
.rs h2{font-size:14px;font-weight:700;color:#2c1654;border-bottom:2px solid #6c3483;padding-bottom:6px;margin-bottom:12px;}
table{width:100%;border-collapse:collapse;font-size:13px;}
th{background:#f0e8f8;color:#2c1654;padding:8px 11px;text-align:left;font-weight:600;border:.5px solid #ddd;}
td{padding:8px 11px;border:.5px solid #eee;vertical-align:top;}
tr:nth-child(even) td{background:#faf8fc;}
.score-big{text-align:center;padding:20px;background:#f9f0ff;border-radius:10px;margin-bottom:20px;border:1px solid #d7bde2;}
.sig{display:flex;gap:12px;margin-top:24px;}
.sig-box{flex:1;border:1px solid #ddd;border-radius:6px;padding:10px;text-align:center;}
.sig-t{font-size:11px;color:#888;margin-bottom:22px;}
.sig-l{border-top:1px solid #ccc;margin-top:6px;padding-top:5px;font-size:11px;color:#aaa;}
@media print{body{background:#fff;padding:0;}.wrap{box-shadow:none;border-radius:0;}@page{margin:1.5cm;}}
</style></head><body><div class="wrap">
<div class="rh"><h1>🎓 장학위원회 자체 감사 보고서</h1>
<p>해운대순복음교회 | ${rptInfo.year ? rptInfo.year + '년 ' : ''}${rptInfo.sem || ''} | 감사일: ${rptInfo.date || '미입력'} | 담당자: ${rptInfo.auditor || '미입력'}</p></div>
<div class="rb">
<div class="score-big">
  <div style="font-size:12px;color:#6c3483;margin-bottom:5px">종합 감사 적합도</div>
  <div style="font-size:48px;font-weight:700;color:${lc}">${totals.done > 0 ? score : '-'}점</div>
  <div style="font-size:14px;color:${lc};margin-top:4px;font-weight:500">${totals.done > 0 ? level : '미점검'}</div>
  <div style="font-size:12px;color:#888;margin-top:8px">점검 완료 ${totals.done}/${totals.total}개 항목 · 양호 ${totals.good} · 미흡 ${totals.bad} · 해당없음 ${totals.na}</div>
</div>
<div class="rs"><h2>1. 영역별 감사 결과</h2>
<table><tr><th>영역</th><th style="text-align:center;width:55px">점검</th><th style="text-align:center;width:45px">양호</th><th style="text-align:center;width:45px">미흡</th><th style="text-align:center;width:60px">해당없음</th><th style="text-align:center;width:60px">적합도</th></tr>
${secRows}</table></div>
${hasBad ? `<div class="rs"><h2>2. 미흡 항목 상세</h2>
<table><tr><th style="width:120px">영역</th><th>점검 항목</th><th style="width:150px">미흡 사유</th></tr>
${badRows}</table></div>` : ''}
${opinion ? `<div class="rs"><h2>${hasBad ? 3 : 2}. 종합 감사의견</h2>
<div style="font-size:13px;line-height:2;color:#333;padding:14px;background:#f9f9f9;border-radius:6px;border-left:3px solid #6c3483;">${opinion.replace(/\n/g, '<br>')}</div>
</div>` : ''}
<div class="sig">
${['담당자','재정부장','감사위원','감사위원장','담임목사'].map(t => `<div class="sig-box"><div class="sig-t">${t}</div><div class="sig-l">(인)</div></div>`).join('')}
</div>
<p style="font-size:11px;color:#aaa;text-align:center;margin-top:16px">해운대순복음교회 장학위원회 · 생성일: ${new Date().toLocaleDateString('ko-KR')}</p>
</div></div></body></html>`
  }

  function downloadPDF() {
    const html = buildReportHTML()
    const win = window.open('', '_blank', 'width=860,height=1100')
    if (!win) { alert('팝업이 차단되어 있습니다. 팝업을 허용해 주세요.'); return }
    win.document.write(html)
    win.document.close()
    setTimeout(() => win.print(), 800)
  }

  const totals = getTotals()
  const pct = totals.total > 0 ? Math.round(totals.done / totals.total * 100) : 0
  const score = totals.done > 0 ? Math.round((totals.good + totals.na) / totals.done * 100) : 0
  const scoreColor = score >= 80 ? '#a569bd' : score >= 60 ? '#f39c12' : '#e74c3c'
  const activeS = SECTIONS.find(s => s.id === activeSection)!

  const inp: React.CSSProperties = { border: '1px solid #e5e7eb', borderRadius: 6, padding: '7px 10px', fontSize: 13, fontFamily: 'inherit', background: '#fff', color: '#111827' }

  return (
    <div style={{ margin: '-32px -16px 0', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 57px)' }}>
      {/* 헤더 */}
      <div style={{ background: 'linear-gradient(135deg,#2c1654,#6c3483)', padding: '14px 20px', color: 'white', flexShrink: 0 }}>
        <div style={{ fontSize: 10, opacity: 0.7, letterSpacing: 2, marginBottom: 3 }}>해운대순복음교회</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 16, fontWeight: 500 }}>🎓 장학위원회 자체 감사시스템</div>
          {savedAt && <div style={{ fontSize: 10, opacity: 0.65 }}>💾 {savedAt} 자동저장</div>}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          {[
            { label: '진행률', val: `${pct}%`, sub: `${totals.done}/${totals.total}` },
            { label: '양호', val: String(totals.good), color: '#a569bd' },
            { label: '미흡', val: String(totals.bad), color: '#e74c3c' },
            { label: '해당없음', val: String(totals.na), color: '#95a5a6' },
            ...(totals.done > 0 ? [{ label: '적합도', val: `${score}점`, color: scoreColor }] : []),
          ].map(s => (
            <div key={s.label} style={{ background: 'rgba(255,255,255,.13)', borderRadius: 8, padding: '5px 12px' }}>
              <div style={{ fontSize: 9, opacity: 0.75 }}>{s.label}</div>
              <div style={{ fontSize: 18, fontWeight: 500, color: s.color }}>{s.val}</div>
              {s.sub && <div style={{ fontSize: 9, opacity: 0.7 }}>{s.sub}</div>}
            </div>
          ))}
        </div>
        <div style={{ background: 'rgba(255,255,255,.2)', borderRadius: 99, height: 4 }}>
          <div style={{ width: `${pct}%`, height: '100%', background: '#a569bd', borderRadius: 99, transition: 'width .4s' }} />
        </div>
      </div>

      {/* 탭 */}
      <div style={{ borderBottom: '1px solid #e5e7eb', display: 'flex', background: '#fff', flexShrink: 0 }}>
        {(['checklist', 'ai', 'report', 'rpt'] as const).map((tab, i) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            border: 'none', background: 'none', padding: '11px 16px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit',
            color: activeTab === tab ? '#6c3483' : '#6b7280',
            borderBottom: `3px solid ${activeTab === tab ? '#6c3483' : 'transparent'}`,
            fontWeight: activeTab === tab ? 600 : 400,
          }}>
            {['✅ 체크리스트', '🤖 AI 분석', '📋 감사 보고', '📄 감사보고서'][i]}
          </button>
        ))}
      </div>

      {/* 콘텐츠 */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>

        {/* 체크리스트 탭 */}
        <div style={{ display: activeTab === 'checklist' ? 'flex' : 'none', height: '100%' }}>
          <div style={{ width: 165, borderRight: '1px solid #e5e7eb', overflowY: 'auto', background: '#fff', flexShrink: 0 }}>
            {SECTIONS.map(sec => {
              const st = getStats(sec.id)
              const active = activeSection === sec.id
              return (
                <div key={sec.id} onClick={() => setActiveSection(sec.id)} style={{
                  padding: '12px 12px', cursor: 'pointer',
                  borderLeft: `4px solid ${active ? sec.color : 'transparent'}`,
                  background: active ? sec.color + '18' : 'transparent',
                }}>
                  <div style={{ fontSize: 15 }}>{sec.icon}</div>
                  <div style={{ fontSize: 11, lineHeight: 1.3, marginTop: 2, color: active ? sec.color : '#111827', fontWeight: active ? 600 : 400 }}>{sec.title}</div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 9, borderRadius: 3, padding: '1px 4px', background: '#e8f8f0', color: '#1d6a4a' }}>✓{st.good}</span>
                    {st.bad > 0 && <span style={{ fontSize: 9, borderRadius: 3, padding: '1px 4px', background: '#fdecea', color: '#c0392b' }}>✗{st.bad}</span>}
                    <span style={{ fontSize: 9, color: '#9ca3af' }}>{st.done}/{st.total}</span>
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 14, background: '#f9fafb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 20 }}>{activeS.icon}</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: activeS.color }}>{activeS.title}</div>
                <div style={{ fontSize: 10, color: '#9ca3af' }}>총 {activeS.items.length}개 항목</div>
              </div>
            </div>
            {activeS.items.map((item, idx) => {
              const ch = checks[activeS.id][idx]
              return (
                <div key={idx} style={{
                  background: '#fff', borderRadius: 8, padding: 12, marginBottom: 8,
                  border: `1px solid ${ch.status === 'good' ? '#c8f0d8' : ch.status === 'bad' ? '#fcd0cc' : '#e5e7eb'}`,
                }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <span style={{ fontSize: 10, color: '#9ca3af', minWidth: 22, paddingTop: 2 }}>Q{idx + 1}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: '#111827', lineHeight: 1.6, marginBottom: 7 }}>{item}</div>
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {([['good', '✅ 양호', '#e8f8f0', '#27ae60'], ['bad', '❌ 미흡', '#fdecea', '#e74c3c'], ['na', '➖ 해당없음', '#f0f4f8', '#95a5a6']] as const).map(([st, lbl, bg, ac]) => (
                          <button key={st} onClick={() => setStatus(activeS.id, idx, st)} style={{
                            border: 'none', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
                            background: ch.status === st ? ac : bg, color: ch.status === st ? 'white' : '#555', fontWeight: ch.status === st ? 600 : 400,
                          }}>{lbl}</button>
                        ))}
                      </div>
                      {ch.status === 'bad' && (
                        <input value={ch.memo} onChange={e => setMemo(activeS.id, idx, e.target.value)}
                          placeholder="미흡 사유 입력..."
                          style={{ marginTop: 6, width: '100%', border: '1px solid #f5a9a4', borderRadius: 5, padding: '6px 9px', fontSize: 12, fontFamily: 'inherit', background: '#fff8f7', boxSizing: 'border-box' }} />
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* AI 분석 탭 */}
        <div style={{ display: activeTab === 'ai' ? 'block' : 'none', height: '100%', overflowY: 'auto', padding: 14 }}>
          <div style={{ maxWidth: 680 }}>
            <div style={{ background: '#fff', borderRadius: 10, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>📂 파일 업로드</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[['PDF','#fdecea','#c0392b'],['CSV','#e8f8f0','#1d6a4a'],['TXT','#f0f4f8','#555']].map(([t,bg,c]) => (
                    <span key={t} style={{ fontSize: 10, borderRadius: 3, padding: '2px 6px', fontWeight: 500, background: bg, color: c }}>{t}</span>
                  ))}
                </div>
              </div>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDrop={e => { e.preventDefault(); e.dataTransfer.files[0] && handleFile(e.dataTransfer.files[0]) }}
                onDragOver={e => e.preventDefault()}
                style={{ border: '1.5px dashed #d7bde2', borderRadius: 7, padding: '24px 16px', textAlign: 'center', cursor: 'pointer', background: '#f9f0ff' }}>
                {fileLoading ? (
                  <><div style={{ fontSize: 26, marginBottom: 5 }}>⏳</div><div style={{ fontSize: 13, color: '#6c3483', fontWeight: 500 }}>처리 중...</div></>
                ) : fileName ? (
                  <><div style={{ fontSize: 26, marginBottom: 5 }}>📄</div><div style={{ fontSize: 13, color: '#6c3483', fontWeight: 500 }}>{fileName}</div><div style={{ fontSize: 11, color: '#27ae60', marginTop: 3 }}>✅ 로드 완료 · 클릭해서 교체</div></>
                ) : (
                  <><div style={{ fontSize: 26, marginBottom: 5 }}>📂</div><div style={{ fontSize: 13, color: '#6c3483', fontWeight: 500 }}>클릭 또는 드래그&드롭으로 파일 업로드</div><div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>PDF · CSV · TXT</div></>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept=".pdf,.csv,.txt,.tsv" style={{ display: 'none' }}
                onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              {fileContent && (
                <div style={{ marginTop: 10, padding: '8px 10px', background: '#f9fafb', borderRadius: 5, fontSize: 11, color: '#6b7280', maxHeight: 70, overflow: 'auto', border: '1px solid #e5e7eb' }}>
                  <div style={{ fontWeight: 500, marginBottom: 2 }}>미리보기 ({fileContent.length.toLocaleString()}자)</div>
                  {fileContent.slice(0, 350)}...
                </div>
              )}
            </div>
            <div style={{ background: '#fff', borderRadius: 10, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>✏️ 내용 직접 입력</div>
              <textarea value={memoInput} onChange={e => setMemoInput(e.target.value)}
                placeholder="장학금 지급 내역, 심사 결과, 감사 중 발견한 내용 등을 직접 입력하세요..."
                style={{ width: '100%', height: 110, border: '1px solid #e5e7eb', borderRadius: 7, padding: 9, fontSize: 13, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <button onClick={runAi} disabled={aiLoading || (!fileContent && !memoInput)} style={{
              background: (aiLoading || (!fileContent && !memoInput)) ? '#bbb' : 'linear-gradient(135deg,#6c3483,#9b59b6)',
              color: 'white', border: 'none', borderRadius: 7, padding: '10px 22px', fontSize: 14, fontWeight: 500,
              cursor: (aiLoading || (!fileContent && !memoInput)) ? 'not-allowed' : 'pointer', marginBottom: 14, fontFamily: 'inherit',
            }}>{aiLoading ? '⏳ AI 분석 중...' : '🔍 AI 장학금 감사 분석 시작'}</button>
            {aiResult && (
              <div style={{ background: '#fff', borderRadius: 10, padding: 16, border: '1px solid #d7bde2' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: '#6c3483', marginBottom: 8 }}>🤖 AI 분석 결과</div>
                <div style={{ fontSize: 13, lineHeight: 1.9, whiteSpace: 'pre-wrap' }}>{aiResult}</div>
              </div>
            )}
          </div>
        </div>

        {/* 감사 보고 탭 (적합도 요약) */}
        <div style={{ display: activeTab === 'report' ? 'block' : 'none', height: '100%', overflowY: 'auto', padding: 14 }}>
          <div style={{ maxWidth: 680 }}>
            <div style={{ background: 'linear-gradient(135deg,#2c1654,#6c3483)', borderRadius: 12, padding: 18, color: 'white', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>해운대순복음교회 장학위원회</div>
                <div style={{ fontSize: 18, fontWeight: 500, marginTop: 3 }}>자체 감사 종합 적합도</div>
                <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>체크 완료 {totals.done}/{totals.total} 항목</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 46, fontWeight: 600, color: scoreColor }}>{totals.done > 0 ? score : '-'}</div>
                <div style={{ fontSize: 12, opacity: 0.8 }}>{totals.done > 0 ? '점' : '체크 후 확인'}</div>
              </div>
            </div>
            {SECTIONS.map(sec => {
              const st = getStats(sec.id)
              const secPct = st.done > 0 ? Math.round((st.good + st.na) / st.done * 100) : 0
              const badItems = sec.items.filter((_, i) => checks[sec.id][i].status === 'bad')
              return (
                <div key={sec.id} style={{ background: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: 15 }}>{sec.icon}</span>
                      <span style={{ fontWeight: 500, color: sec.color, fontSize: 13 }}>{sec.title}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[['#e8f8f0','#1d6a4a',`양호 ${st.good}`],['#fdecea','#c0392b',`미흡 ${st.bad}`],['#f0f4f8','#555',`해당없음 ${st.na}`]].map(([bg,c,txt]) => (
                        <span key={txt} style={{ fontSize: 10, borderRadius: 3, padding: '1px 5px', background: bg, color: c }}>{txt}</span>
                      ))}
                    </div>
                  </div>
                  <div style={{ background: '#f9fafb', borderRadius: 99, height: 4, margin: '6px 0' }}>
                    <div style={{ width: `${secPct}%`, height: '100%', background: sec.color, borderRadius: 99 }} />
                  </div>
                  {badItems.length > 0 && (
                    <div style={{ marginTop: 7 }}>
                      <div style={{ fontSize: 10, color: '#e74c3c', fontWeight: 600, marginBottom: 3 }}>⚠️ 미흡 항목</div>
                      {badItems.map((item, i) => {
                        const ri = sec.items.indexOf(item)
                        const memo = checks[sec.id][ri]?.memo
                        return (
                          <div key={i} style={{ fontSize: 11, color: '#6b7280', padding: '2px 0 2px 8px', borderLeft: '2px solid #e74c3c', marginBottom: 2 }}>
                            {item}{memo && <span style={{ color: '#e74c3c' }}> → {memo}</span>}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
            {aiResult && (
              <div style={{ background: '#f9fafb', borderRadius: 10, padding: 14, border: '1px solid #d7bde2' }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#6c3483', marginBottom: 6 }}>🤖 AI 분석 의견</div>
                <div style={{ fontSize: 11, whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{aiResult.slice(0, 600)}{aiResult.length > 600 ? '...' : ''}</div>
              </div>
            )}
          </div>
        </div>

        {/* 📄 감사보고서 탭 */}
        <div style={{ display: activeTab === 'rpt' ? 'block' : 'none', height: '100%', overflowY: 'auto', padding: 14 }}>
          <div style={{ maxWidth: 680 }}>
            {/* 기본정보 입력 */}
            <div style={{ background: '#fff', borderRadius: 10, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>📌 감사 기본 정보</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: '감사 연도', key: 'year', placeholder: '예) 2025', type: 'text' },
                  { label: '감사 학기', key: 'sem', placeholder: '예) 1학기', type: 'text' },
                  { label: '감사 실시일', key: 'date', placeholder: '', type: 'date' },
                  { label: '감사 담당자', key: 'auditor', placeholder: '성명', type: 'text' },
                ].map(({ label, key, placeholder, type }) => (
                  <div key={key}>
                    <div style={{ fontSize: 10, color: '#6b7280', marginBottom: 4, fontWeight: 500 }}>{label}</div>
                    <input type={type} value={rptInfo[key as keyof typeof rptInfo]} placeholder={placeholder}
                      onChange={e => setRptInfo(prev => ({ ...prev, [key]: e.target.value }))}
                      style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>
            </div>

            {/* 자동 생성 보고서 미리보기 */}
            <div style={{ background: '#fff', borderRadius: 10, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>📊 영역별 결과 (자동 생성)</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>체크리스트 탭 입력 시 자동 반영</div>
              </div>
              {SECTIONS.map(sec => {
                const st = getStats(sec.id)
                const ss = st.done > 0 ? Math.round((st.good + st.na) / st.done * 100) : 0
                return (
                  <div key={sec.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{ fontSize: 14 }}>{sec.icon}</span>
                    <span style={{ fontSize: 12, color: sec.color, fontWeight: 500, flex: 1 }}>{sec.title}</span>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                      <span style={{ fontSize: 10, background: '#e8f8f0', color: '#1d6a4a', borderRadius: 3, padding: '1px 5px' }}>양호 {st.good}</span>
                      {st.bad > 0 && <span style={{ fontSize: 10, background: '#fdecea', color: '#c0392b', borderRadius: 3, padding: '1px 5px' }}>미흡 {st.bad}</span>}
                      <span style={{ fontSize: 12, fontWeight: 700, color: ss >= 80 ? '#27ae60' : ss >= 60 ? '#f39c12' : '#e74c3c', minWidth: 40, textAlign: 'right' }}>{st.done > 0 ? ss + '점' : '-'}</span>
                    </div>
                  </div>
                )
              })}
              <div style={{ marginTop: 10, padding: '10px 12px', background: '#f9f0ff', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 12, color: '#6c3483' }}>종합 적합도</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: scoreColor }}>{totals.done > 0 ? score + '점' : '-'}</div>
              </div>
            </div>

            {/* 종합 감사의견 */}
            <div style={{ background: '#fff', borderRadius: 10, padding: 16, marginBottom: 12, border: '1px solid #e5e7eb' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>📝 종합 감사의견</div>
                <button onClick={generateAiReport} disabled={rptLoading} style={{
                  background: rptLoading ? '#bbb' : 'linear-gradient(135deg,#6c3483,#9b59b6)',
                  color: 'white', border: 'none', borderRadius: 6, padding: '6px 14px', fontSize: 12, fontWeight: 500,
                  cursor: rptLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                }}>{rptLoading ? '⏳ 작성 중...' : '🤖 AI로 자동 작성'}</button>
              </div>
              <textarea value={rptOpinion} onChange={e => setRptOpinion(e.target.value)}
                placeholder="종합 감사의견을 직접 입력하거나 위의 'AI로 자동 작성' 버튼을 눌러주세요."
                style={{ width: '100%', minHeight: 140, border: '1px solid #e5e7eb', borderRadius: 7, padding: 10, fontSize: 13, fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.8 }} />
            </div>

            {/* 다운로드 버튼 */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={downloadPDF} style={{
                flex: 1, background: 'linear-gradient(135deg,#2c1654,#6c3483)', color: 'white', border: 'none',
                borderRadius: 8, padding: 12, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}>📥 PDF 다운로드 (인쇄)</button>
            </div>
            <div style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 8 }}>
              새 창에서 열린 후 인쇄 → PDF로 저장 선택
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
