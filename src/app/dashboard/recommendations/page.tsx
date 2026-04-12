'use client';

import React, { useState, useEffect } from 'react';
import styles from '@/components/dashboard/Dashboard.module.css';
import { Sparkles, Target, Inbox, AlertTriangle } from 'lucide-react';

interface BusinessType { key: string; label: string; description: string; examples: string; }
interface RecoRow {
  guName: string;
  dongName: string;
  mismatchScore: number;
  zoneType: string;
  aiInsight: string;
  avgIncome: number;
  totalResidentialPop: number;
  totalFloatingPop: number;
  opportunityLabel: string;
  totalStores: number;
  foodRevenuePerStore: number;
  coffeeRevenuePerStore: number;
  residentsPerStore: number;
  consumptionPerResident: number;
  predictionDirection?: string;
  predictionScore3m?: number;
  [key: string]: unknown;
}

function AiTooltip({ text }: { text: string }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!text) return null;
  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <div
        onClick={() => setOpen(!open)}
        style={{ fontSize: '0.75rem', color: 'var(--on-surface-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer', maxWidth: 200 }}
      >
        {text.slice(0, 60)}...
      </div>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 100, width: 320,
          padding: '14px 18px', background: 'white', borderRadius: 'var(--radius-lg)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)', fontSize: '0.8125rem', lineHeight: 1.7,
          color: 'var(--on-surface)', border: '1px solid var(--outline)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <span style={{ fontWeight: 700, fontSize: '0.75rem', color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
              <Sparkles size={12} style={{ marginRight: 4 }} /> AI 분석
            </span>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem', color: 'var(--on-surface-tertiary)', padding: 0 }}>×</button>
          </div>
          {text}
        </div>
      )}
    </div>
  );
}

function getColor(score: number): string {
  if (score >= 70) return '#2563eb';
  if (score >= 40) return '#16a34a';
  return '#dc2626';
}

function getLabel(score: number): string {
  if (score >= 70) return '기회';
  if (score >= 40) return '보통';
  return '과밀';
}

export default function RecommendationsPage() {
  const [bizTypes, setBizTypes] = useState<BusinessType[]>([]);
  const [selectedBiz, setSelectedBiz] = useState('all');
  const [recommendations, setRecommendations] = useState<RecoRow[]>([]);
  const [riskZones, setRiskZones] = useState<RecoRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = (type: string) => {
    setLoading(true);
    fetch(`/api/recommendations?type=${type}`)
      .then(res => res.json())
      .then(json => {
        setBizTypes(json.businessTypes || []);
        setRecommendations(json.recommendations || []);
        setRiskZones(json.riskZones || []);
      })
      .catch(err => console.error('Failed to fetch recommendations:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData('all'); }, []);

  const handleBizChange = (type: string) => {
    setSelectedBiz(type);
    fetchData(type);
  };

  const scoreFieldMap: Record<string, string> = {
    cafe: 'scoreCafe', restaurant: 'scoreFood', premium: 'scorePremium',
    daily: 'scoreDaily', medical: 'scoreMedical', fashion: 'scoreFashion',
    entertainment: 'scoreLeisure', realestate: 'mismatchScore', all: 'mismatchScore',
  };
  const scoreLabelMap: Record<string, string> = {
    cafe: '카페 점수', restaurant: '음식점 점수', premium: '프리미엄 점수',
    daily: '생활밀착 점수', medical: '의료 점수', fashion: '패션 점수',
    entertainment: '여가 점수', realestate: '종합 점수', all: '종합 점수',
  };
  const activeScoreField = scoreFieldMap[selectedBiz] || 'mismatchScore';
  const activeScoreLabel = scoreLabelMap[selectedBiz] || '종합 점수';

  const currentBiz = bizTypes.find(b => b.key === selectedBiz);
  const top = recommendations[0];

  if (loading && recommendations.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 16, color: 'var(--primary)' }}><Target size={36} /></div>
          <p style={{ color: 'var(--on-surface-secondary)' }}>추천 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 className={styles.pageTitle}>입지 추천</h1>
            <p className={styles.pageSubtitle}>업종 특성에 맞는 입지를 추천합니다.</p>
          </div>
          <div>
            <div className="label-md" style={{ color: 'var(--primary)', marginBottom: 8 }}>대상 업종</div>
            <select className={styles.filterSelect} value={selectedBiz} onChange={(e) => handleBizChange(e.target.value)} style={{ minWidth: 200 }}>
              {bizTypes.map(b => <option key={b.key} value={b.key}>{b.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {currentBiz && (
        <div style={{ padding: '16px 20px', background: 'var(--status-opportunity-bg)', borderRadius: 'var(--radius-lg)', marginBottom: 24, fontSize: '0.875rem', color: 'var(--primary)' }}>
          {currentBiz.description}
          {currentBiz.examples && <span style={{ color: 'var(--on-surface-secondary)', marginLeft: 8 }}>— {currentBiz.examples}</span>}
        </div>
      )}

      <div className={styles.recoLayout}>
        <div>
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <h3 className={styles.chartTitle}>상위 추천 지역</h3>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>지역</th>
                  <th>{activeScoreLabel}</th>
                  {selectedBiz !== 'all' && selectedBiz !== 'realestate' && <th>종합 점수</th>}
                  <th>분류</th>
                  <th>3개월 전망</th>
                  <th>거주인구</th>
                  <th>평균소득</th>
                  <th>AI 분석</th>
                </tr>
              </thead>
              <tbody>
                {recommendations.length === 0 ? (
                  <tr>
                    <td colSpan={selectedBiz !== 'all' && selectedBiz !== 'realestate' ? 7 : 6} style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--on-surface-tertiary)' }}>
                      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}><Inbox size={32} /></div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>해당 업종의 추천 지역이 없습니다</div>
                      <div style={{ fontSize: '0.8125rem' }}>조건에 맞는 지역이 없습니다. 다른 업종을 선택해 보세요.</div>
                    </td>
                  </tr>
                ) : recommendations.map((r, i) => {
                  const bizScore = (r as Record<string, unknown>)[activeScoreField] as number ?? r.mismatchScore;
                  return (
                    <tr key={i}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{r.guName} {r.dongName}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 60, height: 4, background: 'var(--surface-container-low)', borderRadius: 2 }}>
                            <div style={{ height: '100%', width: `${Math.min(100, bizScore)}%`, background: getColor(bizScore), borderRadius: 2 }} />
                          </div>
                          <span style={{ fontWeight: 700, color: getColor(bizScore) }}>{bizScore.toFixed(1)}</span>
                        </div>
                      </td>
                      {selectedBiz !== 'all' && selectedBiz !== 'realestate' && (
                        <td style={{ fontWeight: 600, color: getColor(r.mismatchScore), fontSize: '0.8125rem' }}>{r.mismatchScore.toFixed(1)}</td>
                      )}
                      <td>
                        <span style={{
                          display: 'inline-block', padding: '2px 10px', borderRadius: 'var(--radius-full)',
                          fontSize: '0.6875rem', fontWeight: 600,
                          color: getColor(bizScore),
                          background: `${getColor(bizScore)}18`,
                        }}>{getLabel(bizScore)}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: r.predictionDirection?.includes('기회') ? '#2563eb' : r.predictionDirection?.includes('과열') ? '#dc2626' : 'inherit' }}>
                          {r.predictionDirection}
                        </span>
                      </td>
                      <td>{r.totalResidentialPop?.toLocaleString()}</td>
                      <td>{r.avgIncome?.toLocaleString()}만</td>
                      <td style={{ maxWidth: 200 }}>
                        <AiTooltip text={r.aiInsight} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className={styles.recoRight}>
          {top && (
            <div className={styles.recoTopMatch}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className={styles.recoTopMatchBadge}>최적 매칭</div>
                <div>
                  <div className={styles.recoTopScore} style={{ color: getColor(top.mismatchScore) }}>{top.mismatchScore.toFixed(1)}</div>
                  <div className={styles.recoTopScoreLabel}>미스매치 점수</div>
                </div>
              </div>
              <div className={styles.recoTopName}>{top.guName} {top.dongName}</div>
              <div className={styles.recoTopSub}>
                <span style={{
                  display: 'inline-block', padding: '2px 10px', borderRadius: 'var(--radius-full)',
                  fontSize: '0.6875rem', fontWeight: 600,
                  color: getColor(top.mismatchScore),
                  background: `${getColor(top.mismatchScore)}18`,
                }}>{getLabel(top.mismatchScore)}</span>
              </div>
              <div className={styles.recoTopStats}>
                <div className={styles.recoTopStat}>
                  <span className={styles.recoTopStatLabel}>소득 수준</span>
                  <span className={styles.recoTopStatValue}>{top.avgIncome >= 50000 ? '매우 높음' : top.avgIncome >= 40000 ? '높음' : '보통'}</span>
                </div>
                <div className={styles.recoTopStat}>
                  <span className={styles.recoTopStatLabel}>유동인구</span>
                  <span className={styles.recoTopStatValue}>{top.totalFloatingPop?.toLocaleString()}</span>
                </div>
                <div className={styles.recoTopStat}>
                  <span className={styles.recoTopStatLabel}>거주인구</span>
                  <span className={styles.recoTopStatValue}>{top.totalResidentialPop?.toLocaleString()}</span>
                </div>
              </div>
              <div className={styles.recoAiInsight}>
                <div className={styles.recoAiInsightTitle}><Sparkles size={14} style={{ marginRight: 4 }} /> AI 인사이트</div>
                <p className={styles.recoAiInsightText}>&ldquo;{top.aiInsight}&rdquo;</p>
              </div>
            </div>
          )}

          {riskZones.length > 0 && (
            <div className={styles.alertCard}>
              <h3 className={styles.alertTitle} style={{ display: 'flex', alignItems: 'center' }}><AlertTriangle size={18} style={{ marginRight: 6, color: '#dc2626' }} /> 과밀 경고 지역</h3>
              {riskZones.slice(0, 3).map((s, i) => (
                <div key={i} className={styles.alertItem}>
                  <div className={styles.alertItemHeader}>
                    <div className={styles.alertItemName}>{s.guName} {s.dongName}</div>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 'var(--radius-full)',
                      fontSize: '0.5rem', fontWeight: 600, color: '#dc2626', background: '#dc262618',
                    }}>과밀</span>
                  </div>
                  <div className={styles.alertItemSub} style={{ color: '#dc2626', fontWeight: 600 }}>{s.mismatchScore.toFixed(1)}점</div>
                  <p className={styles.alertItemDesc} title={s.aiInsight} style={{ cursor: 'help' }}>{s.aiInsight?.slice(0, 80)}...</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
