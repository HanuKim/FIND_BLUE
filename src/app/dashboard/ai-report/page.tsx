'use client';

import React, { useState, useEffect, useRef } from 'react';
import styles from '@/components/dashboard/Dashboard.module.css';
import { getGrade, type ScoringReport, type ScoringCategory, type ScoringItem } from '@/lib/scoring';
import { Sparkles, ClipboardList, Rocket, Store, Plus, Search, Hourglass, CheckCircle2, Save, Target, Bot, MessageSquare, Lightbulb, Send } from 'lucide-react';

import { businessTypes } from '@/lib/mock-data';

interface MismatchRow { guName: string; dongName: string; districtCode: string;[key: string]: unknown; }
interface ChatMsg { role: 'user' | 'assistant'; content: string; }

const bizOptions = businessTypes.filter(b => b.key !== 'all').map(b => b.label);

function ScoreGauge({ score, max, label }: { score: number; max: number; label: string }) {
  const pct = max > 0 ? (score / max) * 100 : 0;
  const grade = getGrade(score, max);
  const color = pct >= 70 ? '#16a34a' : pct >= 50 ? '#f59e0b' : '#dc2626';
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto' }}>
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="34" fill="none" stroke="var(--surface-container-low)" strokeWidth="6" />
          <circle cx="40" cy="40" r="34" fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={`${pct * 2.136} 999`} strokeLinecap="round"
            transform="rotate(-90 40 40)" style={{ transition: 'stroke-dasharray 0.6s ease' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.25rem' }}>{grade}</span>
        </div>
      </div>
      <div style={{ marginTop: 6, fontSize: '0.6875rem', color: 'var(--on-surface-secondary)', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>{score}/{max}</div>
    </div>
  );
}

function ScoreItemRow({ item }: { item: ScoringItem }) {
  const ratio = item.max > 0 ? item.score / item.max : 0;
  const grade = getGrade(item.score, item.max);
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--outline)', padding: '12px 0' }}>
      <div onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: ratio >= 0.7 ? '#16a34a' : ratio >= 0.5 ? '#f59e0b' : '#dc2626' }} />
        <span style={{ flex: 1, fontWeight: 600, fontSize: '0.875rem' }}>{item.name}</span>
        <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-secondary)' }}>{item.summary}</span>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.875rem', minWidth: 60, textAlign: 'right' }}>{item.score}/{item.max} ({grade})</span>
        <span style={{ fontSize: '0.75rem', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
      </div>
      {open && (
        <div style={{ marginTop: 10, padding: '12px 16px', background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-lg)', fontSize: '0.8125rem', lineHeight: 1.7, color: 'var(--on-surface-secondary)' }}>
          {item.desc}
          <div style={{ marginTop: 8, height: 4, background: 'var(--surface-container-low)', borderRadius: 2 }}>
            <div style={{ height: '100%', width: `${ratio * 100}%`, background: ratio >= 0.7 ? '#16a34a' : ratio >= 0.5 ? '#f59e0b' : '#dc2626', borderRadius: 2, transition: 'width 0.6s ease' }} />
          </div>
        </div>
      )}
    </div>
  );
}

function CategorySection({ cat }: { cat: ScoringCategory }) {
  const grade = getGrade(cat.score, cat.max);
  return (
    <div className={styles.chartCard} style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem' }}>{cat.name}</h3>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--primary)' }}>{cat.score}/{cat.max}점 ({grade})</span>
      </div>
      {cat.items.map((item, i) => <ScoreItemRow key={i} item={item} />)}
    </div>
  );
}

export default function AIReportPage() {
  const [dongList, setDongList] = useState<MismatchRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [genStatus, setGenStatus] = useState('');
  const [report, setReport] = useState<ScoringReport | null>(null);
  const [aiText, setAiText] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [userType, setUserType] = useState('예비창업자');
  const [selectedDong, setSelectedDong] = useState('');
  const [businessType, setBusinessType] = useState('기타');
  const [product, setProduct] = useState('');
  const [avgUnitPrice, setAvgUnitPrice] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [monthlyRent, setMonthlyRent] = useState(0);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [operatingHours, setOperatingHours] = useState('');
  const [initialInvestment, setInitialInvestment] = useState(0);
  const [targetRevenue, setTargetRevenue] = useState(0);
  const [competitorCount, setCompetitorCount] = useState(0);
  const [additionalInfo, setAdditionalInfo] = useState('');

  // Follow-up chat
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/mismatch').then(r => r.json()).then(json => {
      const list = (json.data || []).sort((a: MismatchRow, b: MismatchRow) => (a.mismatchScore as number) - (b.mismatchScore as number));
      setDongList(list);
      const searchRegion = new URLSearchParams(window.location.search).get('region');
      if (searchRegion && list.some((d: MismatchRow) => `${d.guName} ${d.dongName}` === searchRegion)) {
        setSelectedDong(searchRegion);
      } else if (list.length > 0) {
        setSelectedDong(`${list[0].guName} ${list[0].dongName}`);
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('userType')) setUserType(params.get('userType') as string);
    if (params.get('businessType')) setBusinessType(params.get('businessType') as string);
    if (params.get('product')) setProduct(params.get('product') as string);
    if (params.get('avgUnitPrice')) setAvgUnitPrice(Number(params.get('avgUnitPrice')));
    if (params.get('monthlyRevenue')) setMonthlyRevenue(Number(params.get('monthlyRevenue')));
    if (params.get('monthlyRent')) setMonthlyRent(Number(params.get('monthlyRent')));
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages]);

  const currentData = dongList.find(d => `${d.guName} ${d.dongName}` === selectedDong);

  const runAnalysis = async () => {
    if (!currentData) return;
    setGenerating(true); setReport(null); setAiText(null); setSaveSuccess(false); setChatMessages([]);
    setGenProgress(0); setGenStatus('데이터 수집 중...');
    const progressTimer = setInterval(() => {
      setGenProgress(prev => {
        if (prev >= 90) { clearInterval(progressTimer); return 90; }
        const step = prev < 30 ? 8 : prev < 60 ? 4 : 2;
        return Math.min(prev + step, 90);
      });
    }, 600);
    const statusSteps = [
      { at: 1200, text: '지역 데이터 분석 중...' },
      { at: 3000, text: '업종 적합성 평가 중...' },
      { at: 5000, text: '12개 항목 세분화 평가 중...' },
      { at: 8000, text: 'Cortex AI 전문가 분석 생성 중...' },
    ];
    const statusTimers = statusSteps.map(s => setTimeout(() => setGenStatus(s.text), s.at));
    try {
      const res = await fetch('/api/ai-report', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userType, region: selectedDong, districtCode: currentData.districtCode, businessType, product, avgUnitPrice, monthlyRevenue, monthlyRent, employeeCount: employeeCount || undefined, operatingHours: operatingHours || undefined, initialInvestment: initialInvestment || undefined, targetRevenue: targetRevenue || undefined, competitorCount: competitorCount || undefined, additionalInfo: additionalInfo || undefined }),
      });
      const json = await res.json();
      setGenProgress(100); setGenStatus('완료!');
      if (json.scoringReport) setReport(json.scoringReport);
      if (json.aiText) setAiText(json.aiText);
    } catch (err) { console.error('Analysis error:', err); }
    finally { clearInterval(progressTimer); statusTimers.forEach(t => clearTimeout(t)); setTimeout(() => setGenerating(false), 400); }
  };

  const saveProfile = async () => {
    if (!report) return; setSaving(true);
    try {
      const scoreData = report.categories.flatMap(c => c.items.map(item => ({ cat: c.name, name: item.name, score: item.score, max: item.max, summary: item.summary, desc: item.desc })));
      await fetch('/api/profiles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userType, region: selectedDong, businessType, product, avgUnitPrice, monthlyRevenue, monthlyRent, employeeCount: employeeCount || null, operatingHours: operatingHours || null, initialInvestment: initialInvestment || null, targetRevenue: targetRevenue || null, competitorCount: competitorCount || null, additionalInfo: additionalInfo || null, scoreJson: JSON.stringify(scoreData), aiText: aiText || '', totalScore: report.totalScore }) });
      setSaveSuccess(true);
    } catch (err) { console.error('Save error:', err); }
    finally { setSaving(false); }
  };

  const sendChat = async () => {
    if (!chatInput.trim() || chatSending || !report) return;
    const q = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: q }]);
    setChatInput(''); setChatSending(true);
    try {
      const ctx = `이전 분석 결과:\n지역: ${selectedDong}\n업종: ${businessType}\n종합점수: ${report.totalScore}/100\n${aiText ? `\nAI 분석 요약:\n${aiText.slice(0, 1500)}` : ''}`;
      const res = await fetch('/api/ai-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: `[분석 컨텍스트]\n${ctx}\n\n[사용자 질문]\n${q}` }) });
      const json = await res.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: json.answer || json.error || '응답을 처리하지 못했습니다.' }]);
    } catch { setChatMessages(prev => [...prev, { role: 'assistant', content: '⚠️ AI 서버와 연결할 수 없습니다.' }]); }
    finally { setChatSending(false); }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: 16, color: 'var(--primary)' }}><Sparkles size={36} /></div>
        <p style={{ color: 'var(--on-surface-secondary)' }}>데이터 로딩 중...</p>
      </div>
    </div>
  );

  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', border: '1.5px solid var(--outline)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-body)', fontSize: '0.875rem', background: 'var(--surface-container-lowest)', outline: 'none' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--on-surface-secondary)', marginBottom: 6, letterSpacing: '0.04em' };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>AI 분석 리포트</h1>
        <p className={styles.pageSubtitle}>다양한 항목을 고려하여 Cortex AI가 정밀 분석 리포트를 생성합니다.</p>
      </div>

      {/* ── Form ── */}
      <div className={styles.chartCard} style={{ marginBottom: 32, position: 'relative' }}>
        {generating && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 10,
            background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(2px)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20,
          }}>
            <style>{`@keyframes fbPulse{0%,80%,100%{transform:scale(0);opacity:.4}40%{transform:scale(1);opacity:1}} @keyframes fbBar{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
            <div style={{ display: 'flex', gap: 8 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 12, height: 12, borderRadius: '50%',
                  background: 'var(--primary)',
                  animation: `fbPulse 1.4s ease-in-out ${i * 0.16}s infinite`,
                }} />
              ))}
            </div>
            <div style={{ width: 240 }}>
              <div style={{
                height: 6, borderRadius: 3, background: 'var(--surface-container-low)', overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%', borderRadius: 3,
                  width: `${genProgress}%`,
                  background: 'linear-gradient(90deg, var(--primary), #60a5fa, var(--primary))',
                  backgroundSize: '200% 100%',
                  animation: 'fbBar 2s linear infinite',
                  transition: 'width 0.4s ease',
                }} />
              </div>
              <div style={{ textAlign: 'center', marginTop: 8, fontSize: '0.8125rem', fontWeight: 600, color: 'var(--primary)' }}>
                {genStatus}
              </div>
              <div style={{ textAlign: 'center', marginTop: 4, fontSize: '0.6875rem', color: 'var(--on-surface-tertiary)' }}>
                {genProgress}%
              </div>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <ClipboardList size={28} style={{ color: 'var(--primary)' }} />
          <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>분석 정보 입력</h3>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {['예비창업자', '현재 자영업자'].map(t => (
            <button key={t} onClick={() => setUserType(t)} disabled={generating} style={{ flex: 1, padding: '12px 0', borderRadius: 'var(--radius-lg)', border: userType === t ? '2px solid var(--primary)' : '1.5px solid var(--outline)', background: userType === t ? 'var(--status-opportunity-bg)' : 'transparent', color: userType === t ? 'var(--primary)' : 'var(--on-surface-secondary)', fontWeight: 700, fontSize: '0.875rem', cursor: generating ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-body)', opacity: generating ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>{t === '예비창업자' ? <Rocket size={16} /> : <Store size={16} />}{t}</button>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div><label style={lbl}>분석할 동</label><select value={selectedDong} onChange={e => { setSelectedDong(e.target.value); setReport(null); setAiText(null); }} style={inp}>{dongList.map(d => { const l = `${d.guName} ${d.dongName}`; return <option key={d.districtCode as string} value={l}>{l}</option>; })}</select></div>
          <div><label style={lbl}>업종</label><select value={businessType} onChange={e => setBusinessType(e.target.value)} style={inp}>{bizOptions.map(b => <option key={b}>{b}</option>)}</select></div>
          <div><label style={lbl}>주요 판매 품목</label><input value={product} onChange={e => setProduct(e.target.value)} placeholder="예: 아메리카노, 삼겹살" style={inp} /></div>
          <div><label style={lbl}>객단가 (원)</label><input type="number" value={avgUnitPrice || ''} onChange={e => setAvgUnitPrice(Number(e.target.value))} placeholder="0 = 미입력" style={inp} /></div>
          <div><label style={lbl}>월 매출 (원)</label><input type="number" value={monthlyRevenue || ''} onChange={e => setMonthlyRevenue(Number(e.target.value))} placeholder="0 = 미입력" style={inp} /></div>
          <div><label style={lbl}>월세 (원)</label><input type="number" value={monthlyRent || ''} onChange={e => setMonthlyRent(Number(e.target.value))} placeholder="0 = 미입력" style={inp} /></div>
        </div>
        <details style={{ marginTop: 20 }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.8125rem', color: 'var(--primary)', display: 'flex', alignItems: 'center' }}><Plus size={14} style={{ marginRight: 4 }} /> 추가 정보 (선택)</summary>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
            <div><label style={lbl}>직원 수</label><input type="number" value={employeeCount || ''} onChange={e => setEmployeeCount(Number(e.target.value))} style={inp} /></div>
            <div><label style={lbl}>영업시간</label><input value={operatingHours} onChange={e => setOperatingHours(e.target.value)} placeholder="09:00-22:00" style={inp} /></div>
            <div><label style={lbl}>초기 투자금 (원)</label><input type="number" value={initialInvestment || ''} onChange={e => setInitialInvestment(Number(e.target.value))} style={inp} /></div>
            <div><label style={lbl}>목표 월매출 (원)</label><input type="number" value={targetRevenue || ''} onChange={e => setTargetRevenue(Number(e.target.value))} style={inp} /></div>
            <div><label style={lbl}>인근 경쟁 매장 수</label><input type="number" value={competitorCount || ''} onChange={e => setCompetitorCount(Number(e.target.value))} style={inp} /></div>
            <div style={{ gridColumn: '1 / -1' }}><label style={lbl}>기타 참고사항</label><textarea value={additionalInfo} onChange={e => setAdditionalInfo(e.target.value)} placeholder="배달 위주 운영, 프랜차이즈 고려 중 등" style={{ ...inp, minHeight: 60, resize: 'vertical' }} /></div>
          </div>
        </details>
        <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
          <button className="btn-primary" onClick={runAnalysis} disabled={generating} style={{ flex: 1, padding: '14px 0', fontSize: '0.9375rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>{generating ? <><Hourglass size={18} /> 분석 중...</> : <><Search size={18} /> 분석 시작</>}</button>
          {report && (<button onClick={saveProfile} disabled={saving} style={{ flex: 1, padding: '14px 0', fontSize: '0.9375rem', borderRadius: 'var(--radius-xl)', border: '1.5px solid var(--primary)', background: saveSuccess ? 'var(--status-opportunity-bg)' : 'transparent', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>{saving ? <><Hourglass size={18} /> 저장 중...</> : saveSuccess ? <><CheckCircle2 size={18} /> 저장 완료</> : <><Save size={18} /> 분석 내역 저장</>}</button>)}
        </div>
      </div>

      {/* ── Scoring Report ── */}
      {report && (
        <>
          <div style={{ padding: '16px 20px', background: userType === '예비창업자' ? 'var(--status-opportunity-bg)' : '#fef3c7', borderRadius: 'var(--radius-lg)', marginBottom: 24, fontSize: '0.875rem', fontWeight: 600 }}>
            {userType === '예비창업자' ? '📋 예비창업자 분석 모드 — 창업 적합성 중심 평가' : '📋 현재 자영업자 분석 모드 — 운영 효율성 중심 평가'}
          </div>
          <div className={styles.chartCard} style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '16px 0', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '3rem', color: report.totalScore >= 80 ? '#16a34a' : report.totalScore >= 60 ? '#f59e0b' : '#dc2626' }}>{report.totalScore}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-secondary)', fontWeight: 600 }}>/ 100 점 ({getGrade(report.totalScore, 100)})</div>
              </div>
              {report.categories.map((cat, i) => <ScoreGauge key={i} score={cat.score} max={cat.max} label={cat.name} />)}
            </div>
            <div style={{ marginTop: 16, padding: '14px 20px', borderRadius: 'var(--radius-lg)', fontWeight: 600, fontSize: '0.9375rem', textAlign: 'center', background: report.totalScore >= 80 ? '#dcfce7' : report.totalScore >= 60 ? '#fef9c3' : '#fee2e2', color: report.totalScore >= 80 ? '#166534' : report.totalScore >= 60 ? '#854d0e' : '#991b1b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Target size={18} /> 종합 평가: {report.totalScore >= 80 ? '매우 우수' : report.totalScore >= 60 ? '양호' : '주의 필요'} ({getGrade(report.totalScore, 100)})
              {report.totalScore >= 80 ? ' — 사업 진행/유지에 긍정적입니다.' : report.totalScore >= 60 ? ' — 일부 개선 사항을 보완하면 더 나은 결과를 기대할 수 있습니다.' : ' — 심층 분석 및 전략 수정을 권장합니다.'}
            </div>
          </div>
          {report.categories.map((cat, i) => <CategorySection key={i} cat={cat} />)}
        </>
      )}

      {/* ── Cortex AI Analysis ── */}
      {aiText && (
        <div className={styles.chartCard} style={{ marginTop: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Bot size={28} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Cortex AI 전문가 분석</h3>
          </div>
          <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.9375rem', lineHeight: 1.8 }}
            dangerouslySetInnerHTML={{ __html: aiText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/## (.*?)\n/g, '<h3 style="font-family:var(--font-display);font-weight:700;margin:24px 0 8px;font-size:1.0625rem;color:var(--primary);">$1</h3>\n') }} />
        </div>
      )}

      {/* ── Follow-up Chat ── */}
      {report && (
        <div className={styles.chartCard} style={{ marginTop: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <MessageSquare size={28} style={{ color: 'var(--primary)' }} />
            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>분석 결과에 대해 더 궁금한 점을 물어보세요</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--on-surface-tertiary)', marginTop: 2 }}>위 분석 리포트를 바탕으로 AI가 추가 답변을 제공합니다</p>
            </div>
          </div>

          {/* Messages */}
          <div style={{ maxHeight: 400, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
            {chatMessages.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--on-surface-tertiary)', fontSize: '0.875rem' }}>
                <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Lightbulb size={16} style={{ marginRight: 6, color: '#f59e0b' }} /> 예시 질문:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 12 }}>
                  {['이 지역에서 카페를 열면 예상 매출은?', '경쟁 매장 대비 차별화 전략은?', '인근 대체 지역을 추천해줘', '초기 투자금 회수 기간은?'].map(q => (
                    <button key={q} onClick={() => setChatInput(q)} style={{ padding: '8px 14px', borderRadius: 'var(--radius-full)', border: '1px solid var(--outline)', background: 'transparent', fontSize: '0.8125rem', cursor: 'pointer', fontFamily: 'var(--font-body)', color: 'var(--on-surface-secondary)' }}>{q}</button>
                  ))}
                </div>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 4 }}>
                <div style={{ fontSize: '0.6875rem', color: 'var(--on-surface-tertiary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {msg.role === 'assistant' && <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--gradient-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.5rem' }}>AI</span>}
                  {msg.role === 'user' ? 'You' : 'Find Blue AI'}
                </div>
                <div style={{ maxWidth: '85%', padding: '14px 18px', borderRadius: 16, background: msg.role === 'user' ? 'var(--gradient-primary)' : 'var(--surface-container-lowest)', color: msg.role === 'user' ? 'white' : 'var(--on-surface)', fontSize: '0.9375rem', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{msg.content}</div>
              </div>
            ))}
            {chatSending && <div style={{ fontSize: '0.875rem', color: 'var(--on-surface-tertiary)', display: 'flex', alignItems: 'center' }}><Hourglass size={14} style={{ marginRight: 6 }} /> 답변 생성 중...</div>}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-xl)', padding: '4px 8px 4px 16px', border: '1px solid var(--outline)' }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendChat()} placeholder="분석 결과에 대해 궁금한 점을 입력하세요..." disabled={chatSending} style={{ flex: 1, border: 'none', background: 'transparent', fontFamily: 'var(--font-body)', fontSize: '0.9375rem', padding: '12px 0', outline: 'none', color: 'var(--on-surface)' }} />
            </div>
            <button onClick={sendChat} disabled={chatSending || !chatInput.trim()} style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--gradient-primary)', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: chatSending || !chatInput.trim() ? 0.5 : 1 }}><Send size={20} /></button>
          </div>
        </div>
      )}

      {!report && !generating && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--on-surface-tertiary)' }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center', color: 'var(--primary)' }}><Sparkles size={36} /></div>
          <p>정보를 입력하고 분석 시작을 클릭하세요</p>
        </div>
      )}
    </div>
  );
}
