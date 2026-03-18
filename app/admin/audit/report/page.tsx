'use client'

import { useState, useEffect } from 'react'

const LS_KEY = 'audit_report_page_v1'

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

const TOTAL = 21
type Status = 'none' | 'good' | 'bad' | 'na'
type Verdict = '' | '적정' | '조건부적정' | '부적정'

const inputStyle: React.CSSProperties = {
  width: '100%', border: '1px solid #e5e7eb', borderRadius: 7, padding: '9px 12px',
  fontSize: 13, fontFamily: 'inherit', color: '#111827', background: '#fff', boxSizing: 'border-box',
}
const textareaStyle: React.CSSProperties = {
  ...inputStyle, resize: 'vertical', minHeight: 75,
}

export default function AuditReportPage() {
  const [form, setForm] = useState({
    year: '', sem: '', date: '', auditor: '', from: '', to: '',
    barnabas: '', philip: '', deborah: '', daniel: '', joshua: '', special: '',
    total_cnt: '', total_amt: '', exec_rate: '',
    minor: '', major: '', critical: '',
    short: '', long: '',
    opinion: '', next: '',
  })
  const [open, setOpen] = useState({ s1: true, s2: false, s3: false, s4: false, s5: false, s6: false })
  const [cs, setCs] = useState<Record<number, Status>>({})
  const [memos, setMemos] = useState<Record<number, string>>({})
  const [verdict, setVerdict] = useState<Verdict>('')
  const [showModal, setShowModal] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  // ── 자동 불러오기 ──
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY)
      if (raw) {
        const d = JSON.parse(raw)
        if (d.form) setForm(d.form)
        if (d.cs) setCs(d.cs)
        if (d.memos) setMemos(d.memos)
        if (d.verdict) setVerdict(d.verdict)
      }
    } catch {}
  }, [])

  // ── 자동 저장 ──
  useEffect(() => {
    const id = setTimeout(() => {
      try {
        localStorage.setItem(LS_KEY, JSON.stringify({ form, cs, memos, verdict }))
        setSavedAt(new Date().toLocaleTimeString('ko-KR'))
      } catch {}
    }, 800)
    return () => clearTimeout(id)
  }, [form, cs, memos, verdict])

  const f = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value })),
  })

  function tog(key: keyof typeof open) {
    setOpen(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function setCheck(i: number, st: Status) {
    setCs(prev => ({ ...prev, [i]: prev[i] === st ? 'none' : st }))
  }

  // 진행률
  const filledKeys = ['year','sem','date','auditor','barnabas','total_cnt','total_amt','minor','major','opinion'] as const
  const filled = filledKeys.filter(k => form[k] !== '').length + (verdict ? 1 : 0)
  const progress = Math.round(filled / (filledKeys.length + 1) * 100)

  // 체크리스트 뱃지
  const done = Array.from({ length: TOTAL }, (_, i) => cs[i]).filter(v => v && v !== 'none').length
  const badCount = Array.from({ length: TOTAL }, (_, i) => cs[i]).filter(v => v === 'bad').length
  const clBg = done === TOTAL ? '#e8f8f0' : badCount > 0 ? '#fdecea' : done > 0 ? '#fef9e7' : '#f0f4f8'
  const clC = done === TOTAL ? '#1d6a4a' : badCount > 0 ? '#c0392b' : done > 0 ? '#935116' : '#555'

  function sectionBadge(keys: (keyof typeof form)[]) {
    const any = keys.some(k => form[k] !== '')
    return { text: any ? '입력됨' : '미입력', bg: any ? '#e8f8f0' : '#f0f4f8', color: any ? '#1d6a4a' : '#555' }
  }

  function buildHTML() {
    const good = Array.from({ length: TOTAL }, (_, i) => cs[i]).filter(v => v === 'good').length
    const bad  = Array.from({ length: TOTAL }, (_, i) => cs[i]).filter(v => v === 'bad').length
    const na   = Array.from({ length: TOTAL }, (_, i) => cs[i]).filter(v => v === 'na').length
    const total = good + bad + na
    const score = total > 0 ? Math.round((good + na) / total * 100) : 0
    const vc = verdict === '적정' ? '#27ae60' : verdict === '조건부적정' ? '#f39c12' : '#e74c3c'

    let clRows = ''
    let gi = 0
    SECTIONS.forEach(s => {
      clRows += `<tr><td colspan="4" style="background:#f0e8f8;color:#2c1654;font-weight:700;font-size:12px;padding:7px 10px">${s.icon} ${s.title}</td></tr>`
      s.items.forEach(q => {
        const st = cs[gi] || 'none'
        const stL = st === 'good' ? '양호' : st === 'bad' ? '미흡' : st === 'na' ? '해당없음' : '-'
        const stC = st === 'good' ? '#27ae60' : st === 'bad' ? '#e74c3c' : st === 'na' ? '#95a5a6' : '#888'
        const note = memos[gi] || ''
        clRows += `<tr><td style="text-align:center;font-size:11px;color:#888;white-space:nowrap">Q${gi+1}</td><td>${q}</td><td style="text-align:center;color:${stC};font-weight:600;white-space:nowrap">${stL}</td><td style="font-size:12px;color:#e74c3c">${note}</td></tr>`
        gi++
      })
    })

    const payRows = [['바나바','barnabas'],['빌립','philip'],['다비다/데보라','deborah'],['다니엘','daniel'],['여호수아','joshua'],['특별','special']]
      .map(([n, k]) => `<tr><td>${n}</td><td>${form[k as keyof typeof form] || '-'}</td></tr>`).join('')

    return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8">
<title>장학위원회 자체 감사 보고서 ${form.year} ${form.sem}</title>
<style>
body{font-family:'Apple SD Gothic Neo','Noto Sans KR',sans-serif;background:#f5f5f5;margin:0;padding:20px;}
.wrap{max-width:800px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,.08);}
.rh{background:linear-gradient(135deg,#2c1654,#6c3483);padding:30px 36px;color:white;}
.rh h1{font-size:22px;font-weight:700;margin-bottom:5px;}.rh p{font-size:13px;opacity:.8;}
.rb{padding:28px 36px;}.rs{margin-bottom:26px;}
.rs h2{font-size:15px;font-weight:700;color:#2c1654;border-bottom:2px solid #6c3483;padding-bottom:6px;margin-bottom:13px;}
table{width:100%;border-collapse:collapse;font-size:13px;}
th{background:#f0e8f8;color:#2c1654;padding:8px 11px;text-align:left;font-weight:600;border:.5px solid #ddd;}
td{padding:8px 11px;border:.5px solid #eee;vertical-align:top;}
tr:nth-child(even) td{background:#faf8fc;}
.sc-row{display:flex;gap:10px;margin-bottom:16px;}
.sc-item{flex:1;text-align:center;padding:12px 8px;border-radius:8px;}
.vd{text-align:center;padding:18px;background:#f9f0ff;border-radius:8px;border:1px solid #d7bde2;margin-bottom:16px;}
.sig{display:flex;gap:12px;margin-top:20px;}
.sig-box{flex:1;border:.5px solid #ddd;border-radius:6px;padding:10px;text-align:center;}
.sig-t{font-size:11px;color:#888;margin-bottom:22px;}
.sig-l{border-top:.5px solid #ccc;margin-top:6px;padding-top:5px;font-size:11px;color:#aaa;}
@media print{body{background:#fff;padding:0}.wrap{box-shadow:none;border-radius:0}}
</style></head><body><div class="wrap">
<div class="rh"><h1>🎓 장학위원회 자체 감사 보고서</h1>
<p>해운대순복음교회 | ${form.year}년 ${form.sem} | 감사일: ${form.date} | 담당자: ${form.auditor}</p></div>
<div class="rb">
<div class="rs"><h2>1. 감사 기본 정보</h2>
<table><tr><th style="width:30%">항목</th><th>내용</th></tr>
<tr><td>감사 대상 기간</td><td>${form.from} ~ ${form.to}</td></tr>
<tr><td>감사 실시일</td><td>${form.date}</td></tr>
<tr><td>감사 담당자</td><td>${form.auditor}</td></tr>
<tr><td>감사 연도/학기</td><td>${form.year}년 ${form.sem}</td></tr>
</table></div>
<div class="rs"><h2>2. 장학금 지급 현황</h2>
<table><tr><th>장학금 유형</th><th>지급 인원</th></tr>
${payRows}
<tr style="font-weight:600"><td>합계</td><td>${form.total_cnt||'-'}명 / ${form.total_amt||'-'}원</td></tr>
<tr><td>예산 집행률</td><td>${form.exec_rate||'-'}</td></tr>
</table></div>
<div class="rs"><h2>3. 감사 체크리스트 결과 (4개 영역 · 21개 항목)</h2>
<div class="sc-row">
<div class="sc-item" style="background:#e8f8f0"><div style="font-size:11px;color:#1d6a4a">양호</div><div style="font-size:26px;font-weight:700;color:#27ae60">${good}</div></div>
<div class="sc-item" style="background:#fdecea"><div style="font-size:11px;color:#c0392b">미흡</div><div style="font-size:26px;font-weight:700;color:#e74c3c">${bad}</div></div>
<div class="sc-item" style="background:#f0f4f8"><div style="font-size:11px;color:#555">해당없음</div><div style="font-size:26px;font-weight:700;color:#95a5a6">${na}</div></div>
<div class="sc-item" style="background:#f9f0ff"><div style="font-size:11px;color:#6c3483">적합도</div><div style="font-size:26px;font-weight:700;color:#6c3483">${score}점</div></div>
</div>
<table><tr><th style="width:40px;text-align:center">번호</th><th>점검 항목</th><th style="width:70px;text-align:center">결과</th><th style="width:130px">비고</th></tr>
${clRows}</table></div>
<div class="rs"><h2>4. 주요 지적사항</h2>
<table><tr><th style="width:25%">구분</th><th>내용</th></tr>
<tr><td>경미한 지적사항</td><td>${form.minor||'해당없음'}</td></tr>
<tr><td>중요 지적사항</td><td>${form.major||'해당없음'}</td></tr>
<tr><td>시정 필요사항</td><td>${form.critical||'해당없음'}</td></tr>
</table></div>
<div class="rs"><h2>5. 개선 권고사항</h2>
<table><tr><th style="width:30%">구분</th><th>내용</th></tr>
<tr><td>단기 개선사항</td><td>${form.short||'-'}</td></tr>
<tr><td>중장기 개선사항</td><td>${form.long||'-'}</td></tr>
</table></div>
<div class="rs"><h2>6. 종합 감사의견</h2>
<div class="vd"><div style="font-size:12px;color:#666;margin-bottom:5px">종합 판정</div>
<div style="font-size:26px;font-weight:700;color:${vc}">${verdict||'미입력'}</div></div>
<table><tr><th style="width:30%">구분</th><th>내용</th></tr>
<tr><td>종합 의견</td><td>${form.opinion||'-'}</td></tr>
<tr><td>차기 중점사항</td><td>${form.next||'-'}</td></tr>
</table></div>
<div class="sig">
${['담당자','재정부장','감사위원','감사위원장','담임목사'].map(t=>`<div class="sig-box"><div class="sig-t">${t}</div><div class="sig-l">(인)</div></div>`).join('')}
</div>
<p style="font-size:11px;color:#aaa;text-align:center;margin-top:18px">해운대순복음교회 장학위원회 · 생성일: ${new Date().toLocaleDateString('ko-KR')}</p>
</div></div></body></html>`
  }

  function download() {
    const blob = new Blob([buildHTML()], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `장학위원회_자체감사보고서_${form.year || '2025'}_${form.sem || '1학기'}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  function downloadPDF() {
    const win = window.open('', '_blank', 'width=860,height=1100')
    if (!win) { alert('팝업이 차단되어 있습니다. 팝업 허용 후 다시 시도해주세요.'); return }
    win.document.write(buildHTML())
    win.document.close()
    setTimeout(() => win.print(), 800)
  }

  // 아코디언 헤더
  function SectionHead({ id, icon, title, badge }: { id: keyof typeof open; icon: string; title: string; badge: { text: string; bg: string; color: string } }) {
    return (
      <div onClick={() => tog(id)} style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none', background: open[id] ? '#fafafa' : '#fff' }}>
        <span>{icon}</span>
        <span style={{ fontSize: 14, fontWeight: 500, color: '#111827', flex: 1 }}>{title}</span>
        <span style={{ fontSize: 11, borderRadius: 20, padding: '3px 10px', fontWeight: 500, background: badge.bg, color: badge.color }}>{badge.text}</span>
        <span style={{ fontSize: 12, color: '#9ca3af', transform: open[id] ? 'rotate(180deg)' : 'none', transition: 'transform .2s', display: 'inline-block' }}>▼</span>
      </div>
    )
  }

  const card = { background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', marginBottom: 14, overflow: 'hidden' as const }
  const body = { padding: '16px 18px', borderTop: '1px solid #e5e7eb' }
  const label = { fontSize: 11, fontWeight: 500, color: '#6b7280', marginBottom: 5, display: 'block' as const, letterSpacing: '.3px' }
  const row = { marginBottom: 14 }
  const twoCol = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }
  const threeCol = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', paddingBottom: 80 }}>
      {/* 헤더 */}
      <div style={{ background: 'linear-gradient(135deg,#2c1654,#6c3483)', borderRadius: 14, padding: '24px 28px', color: 'white', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>🎓 장학위원회 자체 감사 보고서</h1>
          {savedAt && <span style={{ fontSize: 11, opacity: 0.7 }}>💾 {savedAt} 저장됨</span>}
        </div>
        <p style={{ fontSize: 12, opacity: 0.75 }}>해운대순복음교회 · 감사 결과 입력 후 HTML 보고서로 출력하세요</p>
        <div style={{ background: 'rgba(255,255,255,.2)', borderRadius: 99, height: 5, marginTop: 12 }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'rgba(255,255,255,.7)', borderRadius: 99, transition: 'width .4s' }} />
        </div>
      </div>

      {/* 1. 기본정보 */}
      <div style={card}>
        <SectionHead id="s1" icon="📌" title="1. 감사 기본 정보" badge={sectionBadge(['year','sem','date','auditor'])} />
        {open.s1 && <div style={body}>
          <div style={twoCol}>
            <div style={row}><label style={label}>감사 연도</label><input style={inputStyle} placeholder="예) 2025" {...f('year')} /></div>
            <div style={row}><label style={label}>감사 학기</label>
              <select style={inputStyle} {...f('sem')}><option value="">선택</option><option>1학기</option><option>2학기</option><option>연간</option></select>
            </div>
          </div>
          <div style={twoCol}>
            <div style={row}><label style={label}>감사 실시일</label><input type="date" style={inputStyle} {...f('date')} /></div>
            <div style={row}><label style={label}>감사 담당자</label><input style={inputStyle} placeholder="성명" {...f('auditor')} /></div>
          </div>
          <div style={twoCol}>
            <div style={row}><label style={label}>감사 기간 (시작)</label><input type="date" style={inputStyle} {...f('from')} /></div>
            <div style={row}><label style={label}>감사 기간 (종료)</label><input type="date" style={inputStyle} {...f('to')} /></div>
          </div>
        </div>}
      </div>

      {/* 2. 지급현황 */}
      <div style={card}>
        <SectionHead id="s2" icon="💰" title="2. 장학금 지급 현황" badge={sectionBadge(['barnabas','total_cnt','total_amt'])} />
        {open.s2 && <div style={body}>
          <div style={threeCol}>
            <div style={row}><label style={label}>바나바</label><input style={inputStyle} placeholder="인원" {...f('barnabas')} /></div>
            <div style={row}><label style={label}>빌립</label><input style={inputStyle} placeholder="인원" {...f('philip')} /></div>
            <div style={row}><label style={label}>다비다/데보라</label><input style={inputStyle} placeholder="인원" {...f('deborah')} /></div>
          </div>
          <div style={threeCol}>
            <div style={row}><label style={label}>다니엘</label><input style={inputStyle} placeholder="인원" {...f('daniel')} /></div>
            <div style={row}><label style={label}>여호수아</label><input style={inputStyle} placeholder="인원" {...f('joshua')} /></div>
            <div style={row}><label style={label}>특별</label><input style={inputStyle} placeholder="인원" {...f('special')} /></div>
          </div>
          <div style={twoCol}>
            <div style={row}><label style={label}>총 지급 인원</label><input style={inputStyle} placeholder="명" {...f('total_cnt')} /></div>
            <div style={row}><label style={label}>총 지급 금액</label><input style={inputStyle} placeholder="원" {...f('total_amt')} /></div>
          </div>
          <div style={row}><label style={label}>예산 대비 집행률</label><input style={inputStyle} placeholder="예) 98.5%" {...f('exec_rate')} /></div>
        </div>}
      </div>

      {/* 3. 체크리스트 */}
      <div style={card}>
        <div onClick={() => tog('s3')} style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
          <span>✅</span>
          <span style={{ fontSize: 14, fontWeight: 500, color: '#111827', flex: 1 }}>3. 감사 체크리스트</span>
          <span style={{ fontSize: 11, borderRadius: 20, padding: '3px 10px', fontWeight: 500, background: clBg, color: clC }}>{done}/{TOTAL}</span>
          <span style={{ fontSize: 12, color: '#9ca3af', transform: open.s3 ? 'rotate(180deg)' : 'none', transition: 'transform .2s', display: 'inline-block' }}>▼</span>
        </div>
        {open.s3 && <div style={body}>
          {(() => {
            let idx = 0
            return SECTIONS.map(sec => (
              <div key={sec.id}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.5px', padding: '10px 0 4px', borderBottom: '1px solid #e5e7eb', marginBottom: 2, color: sec.color }}>
                  {sec.icon} {sec.title}
                </div>
                {sec.items.map(q => {
                  const i = idx++
                  const st = cs[i] || 'none'
                  return (
                    <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                      <div style={{ fontSize: 13, color: '#111827', lineHeight: 1.6, marginBottom: 8 }}>Q{i + 1}. {q}</div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {([['good','✅ 양호','#27ae60'],['bad','❌ 미흡','#e74c3c'],['na','➖ 해당없음','#95a5a6']] as const).map(([s, lbl, ac]) => (
                          <button key={s} onClick={() => setCheck(i, s)} style={{
                            padding: '6px 14px', borderRadius: 20, border: '1px solid #e5e7eb', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                            background: st === s ? ac : '#fff', color: st === s ? 'white' : '#6b7280', fontWeight: st === s ? 500 : 400,
                          }}>{lbl}</button>
                        ))}
                      </div>
                      {st === 'bad' && (
                        <input value={memos[i] || ''} onChange={e => setMemos(prev => ({ ...prev, [i]: e.target.value }))}
                          placeholder="미흡 사유 입력..."
                          style={{ width: '100%', border: '1px solid #f5a9a4', borderRadius: 5, padding: '6px 10px', fontSize: 12, fontFamily: 'inherit', background: '#fff8f7', marginTop: 6, boxSizing: 'border-box' }} />
                      )}
                    </div>
                  )
                })}
              </div>
            ))
          })()}
        </div>}
      </div>

      {/* 4. 지적사항 */}
      <div style={card}>
        <SectionHead id="s4" icon="⚠️" title="4. 주요 지적사항" badge={sectionBadge(['minor','major','critical'])} />
        {open.s4 && <div style={body}>
          <div style={row}><label style={label}>경미한 지적사항</label><textarea style={textareaStyle} placeholder="없으면 '해당없음'" {...f('minor')} /></div>
          <div style={row}><label style={label}>중요 지적사항</label><textarea style={textareaStyle} placeholder="없으면 '해당없음'" {...f('major')} /></div>
          <div style={row}><label style={label}>시정 필요사항</label><textarea style={textareaStyle} placeholder="없으면 '해당없음'" {...f('critical')} /></div>
        </div>}
      </div>

      {/* 5. 개선권고 */}
      <div style={card}>
        <SectionHead id="s5" icon="💡" title="5. 개선 권고사항" badge={sectionBadge(['short','long'])} />
        {open.s5 && <div style={body}>
          <div style={row}><label style={label}>단기 개선사항 (즉시~1개월)</label><textarea style={textareaStyle} placeholder="단기 개선사항을 입력하세요." {...f('short')} /></div>
          <div style={row}><label style={label}>중장기 개선사항 (3개월 이상)</label><textarea style={textareaStyle} placeholder="중장기 개선사항을 입력하세요." {...f('long')} /></div>
        </div>}
      </div>

      {/* 6. 종합의견 */}
      <div style={card}>
        <SectionHead id="s6" icon="📝" title="6. 종합 감사의견" badge={sectionBadge(['opinion'])} />
        {open.s6 && <div style={body}>
          <div style={row}>
            <label style={label}>종합 판정</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {([['적정','✅ 적정','sel-good','#27ae60'],['조건부적정','⚠️ 조건부 적정','sel-na','#95a5a6'],['부적정','❌ 부적정','sel-bad','#e74c3c']] as const).map(([v, lbl, , ac]) => (
                <button key={v} onClick={() => setVerdict(prev => prev === v ? '' : v)} style={{
                  padding: '6px 14px', borderRadius: 20, border: '1px solid #e5e7eb', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                  background: verdict === v ? ac : '#fff', color: verdict === v ? 'white' : '#6b7280', fontWeight: verdict === v ? 500 : 400,
                }}>{lbl}</button>
              ))}
            </div>
          </div>
          <div style={{ ...row, marginTop: 12 }}><label style={label}>종합 의견</label><textarea style={{ ...textareaStyle, minHeight: 90 }} placeholder="전반적인 감사 의견을 작성하세요." {...f('opinion')} /></div>
          <div style={row}><label style={label}>차기 감사 중점사항</label><textarea style={textareaStyle} placeholder="다음 감사에서 중점적으로 볼 사항을 기록하세요." {...f('next')} /></div>
        </div>}
      </div>

      {/* 하단 버튼 */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e5e7eb', padding: '12px 16px', display: 'flex', gap: 8, zIndex: 50 }}>
        <button onClick={() => setShowModal(true)} style={{ flex: 1, background: '#f9fafb', color: '#111827', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
          👁 미리보기
        </button>
        <button onClick={downloadPDF} style={{ flex: 1, background: 'linear-gradient(135deg,#1a5276,#2980b9)', color: 'white', border: 'none', borderRadius: 8, padding: 12, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
          🖨 PDF 인쇄
        </button>
        <button onClick={download} style={{ flex: 1, background: 'linear-gradient(135deg,#6c3483,#9b59b6)', color: 'white', border: 'none', borderRadius: 8, padding: 12, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
          ⬇ HTML 저장
        </button>
      </div>

      {/* 미리보기 모달 */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 100, overflowY: 'auto', padding: 16 }}>
          <div style={{ maxWidth: 720, margin: '0 auto', background: '#fff', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg,#2c1654,#6c3483)', padding: '16px 20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 500 }}>📋 감사 보고서 미리보기</span>
              <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,.2)', border: 'none', color: 'white', borderRadius: 6, padding: '4px 12px', cursor: 'pointer', fontFamily: 'inherit' }}>닫기</button>
            </div>
            <iframe
              srcDoc={buildHTML()}
              style={{ width: '100%', height: '70vh', border: 'none' }}
              title="보고서 미리보기"
            />
            <div style={{ padding: '14px 20px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 10 }}>
              <button onClick={download} style={{ flex: 1, background: 'linear-gradient(135deg,#6c3483,#9b59b6)', color: 'white', border: 'none', borderRadius: 8, padding: 12, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>⬇ HTML 저장</button>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, background: '#f9fafb', color: '#111827', border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
