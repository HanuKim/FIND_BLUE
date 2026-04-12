'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/components/dashboard/Dashboard.module.css';
import { getGrade } from '@/lib/scoring';
import { FolderOpen, RefreshCw, Bot, CheckCircle2, SquareX } from 'lucide-react';

interface Profile {
  PROFILE_ID: number;
  USER_TYPE: string;
  REGION: string;
  BUSINESS_TYPE: string;
  PRODUCT_CATEGORY: string;
  AVG_UNIT_PRICE: number;
  MONTHLY_REVENUE: number;
  MONTHLY_RENT: number;
  TOTAL_SCORE: number;
  CREATED_AT: string;
  AI_REPORT: string;
  REPORT_SCORES: string | null;
  REPORT_AI_TEXT: string | null;
}

interface ScoreItem { cat: string; name: string; score: number; max: number; summary: string; desc: string; }

export default function HistoryPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [expandedDetail, setExpandedDetail] = useState(false);

  const reAnalyze = (p: Profile) => {
    const params = new URLSearchParams();
    params.set('userType', p.USER_TYPE || '예비창업자');
    params.set('region', p.REGION || '');
    params.set('businessType', p.BUSINESS_TYPE || '기타');
    params.set('product', p.PRODUCT_CATEGORY || '');
    if (p.AVG_UNIT_PRICE) params.set('avgUnitPrice', String(p.AVG_UNIT_PRICE));
    if (p.MONTHLY_REVENUE) params.set('monthlyRevenue', String(p.MONTHLY_REVENUE));
    if (p.MONTHLY_RENT) params.set('monthlyRent', String(p.MONTHLY_RENT));
    router.push(`/dashboard/ai-report?${params.toString()}`);
  };

  useEffect(() => {
    fetch('/api/profiles')
      .then(res => res.json())
      .then(json => {
        setProfiles(json.profiles || []);
        if (json.profiles?.length > 0) setSelectedId(json.profiles[0].PROFILE_ID);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const selected = profiles.find(p => p.PROFILE_ID === selectedId);
  let scoreItems: ScoreItem[] = [];
  if (selected?.REPORT_SCORES) {
    try { scoreItems = JSON.parse(selected.REPORT_SCORES); } catch { /* ignore */ }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: 16, color: 'var(--primary)' }}><FolderOpen size={36} /></div>
        <p style={{ color: 'var(--on-surface-secondary)' }}>이력 로딩 중...</p>
      </div>
    </div>
  );

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>내 분석 이력</h1>
        <p className={styles.pageSubtitle}>저장된 분석 결과를 조회하고 이전 리포트를 확인합니다.</p>
      </div>

      {profiles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--on-surface-tertiary)' }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center', color: 'var(--primary)' }}><SquareX size={48} /></div>
          <p>저장된 분석 이력이 없습니다.</p>
          <p style={{ fontSize: '0.8125rem', marginTop: 8 }}>AI 분석 리포트 탭에서 분석 후 분석 이력을 저장해주세요.</p>
        </div>
      ) : (
        <>
          {/* Profile List */}
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <h3 className={styles.chartTitle}>저장된 분석 ({profiles.length}건)</h3>
            </div>
            <table className="data-table">
              <thead>
                <tr><th>지역</th><th>업종</th><th>종합점수</th><th>AI분석</th><th>저장일시</th><th></th><th></th></tr>
              </thead>
              <tbody>
                {profiles.map(p => (
                  <tr key={p.PROFILE_ID} style={{ background: p.PROFILE_ID === selectedId ? 'var(--status-opportunity-bg)' : undefined, cursor: 'pointer' }}
                    onClick={() => { setSelectedId(p.PROFILE_ID); setExpandedDetail(true); }}>
                    <td style={{ fontWeight: 600 }}>{p.REGION}</td>
                    <td>{p.BUSINESS_TYPE}</td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: (p.TOTAL_SCORE || 0) >= 80 ? '#16a34a' : (p.TOTAL_SCORE || 0) >= 60 ? '#f59e0b' : '#dc2626' }}>
                        {p.TOTAL_SCORE || 0}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-tertiary)' }}> /100 ({getGrade(p.TOTAL_SCORE || 0, 100)})</span>
                    </td>
                    <td>{p.AI_REPORT === 'O' ? <CheckCircle2 size={16} color="#16a34a" /> : '—'}</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--on-surface-secondary)' }}>{String(p.CREATED_AT).slice(0, 16)}</td>
                    <td><button onClick={(e) => { e.stopPropagation(); reAnalyze(p); }} style={{ border: '1px solid var(--primary)', background: 'transparent', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 4 }}><RefreshCw size={12} /> 재분석</button></td>
                    <td><button style={{ border: 'none', background: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.8125rem' }}>상세 →</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detail View */}
          {selected && expandedDetail && (
            <div className={styles.chartCard} style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.125rem' }}>
                    {selected.REGION} — {selected.BUSINESS_TYPE}
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--on-surface-secondary)' }}>{selected.USER_TYPE} · {String(selected.CREATED_AT).slice(0, 10)}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={() => reAnalyze(selected)} style={{
                    padding: '8px 20px', borderRadius: 'var(--radius-xl)',
                    border: '1.5px solid var(--primary)', background: 'transparent',
                    color: 'var(--primary)', fontWeight: 700, fontSize: '0.8125rem',
                    cursor: 'pointer', fontFamily: 'var(--font-body)',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}><RefreshCw size={14} /> 이 정보로 재분석</button>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '2rem', color: (selected.TOTAL_SCORE || 0) >= 80 ? '#16a34a' : (selected.TOTAL_SCORE || 0) >= 60 ? '#f59e0b' : '#dc2626' }}>
                      {selected.TOTAL_SCORE || 0}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-secondary)' }}>/ 100 ({getGrade(selected.TOTAL_SCORE || 0, 100)})</div>
                  </div>
                </div>
              </div>

              {/* Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
                {[
                  { label: '객단가', value: selected.AVG_UNIT_PRICE ? `${Number(selected.AVG_UNIT_PRICE).toLocaleString()}원` : '미입력' },
                  { label: '월매출', value: selected.MONTHLY_REVENUE ? `${Number(selected.MONTHLY_REVENUE).toLocaleString()}원` : '미입력' },
                  { label: '월세', value: selected.MONTHLY_RENT ? `${Number(selected.MONTHLY_RENT).toLocaleString()}원` : '미입력' },
                ].map(m => (
                  <div key={m.label} style={{ padding: '14px 16px', background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-lg)' }}>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--on-surface-tertiary)', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' as const }}>{m.label}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginTop: 4 }}>{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Score Items */}
              {scoreItems.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <h4 style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 12 }}>항목별 점수</h4>
                  {scoreItems.map((s, i) => {
                    const ratio = s.max > 0 ? s.score / s.max : 0;
                    return (
                      <details key={i} style={{ borderBottom: '1px solid var(--outline)', padding: '8px 0' }}>
                        <summary style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem' }}>
                          <span style={{ width: 10, height: 10, borderRadius: '50%', background: ratio >= 0.7 ? '#16a34a' : ratio >= 0.5 ? '#f59e0b' : '#dc2626' }} />
                          <span style={{ flex: 1, color: 'var(--on-surface-secondary)' }}>[{s.cat}] {s.name}</span>
                          <span style={{ fontWeight: 700 }}>{s.score}/{s.max} ({getGrade(s.score, s.max)})</span>
                        </summary>
                        <div style={{ padding: '8px 24px', fontSize: '0.8125rem', color: 'var(--on-surface-secondary)', lineHeight: 1.6 }}>
                          {s.desc}
                          <div style={{ marginTop: 6, height: 3, background: 'var(--surface-container-low)', borderRadius: 2 }}>
                            <div style={{ height: '100%', width: `${ratio * 100}%`, background: ratio >= 0.7 ? '#16a34a' : ratio >= 0.5 ? '#f59e0b' : '#dc2626', borderRadius: 2 }} />
                          </div>
                        </div>
                      </details>
                    );
                  })}
                </div>
              )}

              {/* AI Text */}
              {selected.REPORT_AI_TEXT && (
                <div style={{ marginTop: 24 }}>
                  <h4 style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Bot size={16} /> Cortex AI 분석</h4>
                  <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--on-surface-secondary)', padding: '16px', background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-lg)' }}
                    dangerouslySetInnerHTML={{ __html: selected.REPORT_AI_TEXT.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/## (.*?)\n/g, '<h4 style="font-weight:700;margin:16px 0 6px;font-size:0.9375rem;">$1</h4>\n') }}
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
