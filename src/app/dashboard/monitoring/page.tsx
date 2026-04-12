'use client';

import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import styles from '@/components/dashboard/Dashboard.module.css';
import { BarChart2, TrendingUp, Monitor, SquareX } from 'lucide-react';

interface MonitoringData {
  regions: string[];
  liveData: Record<string, unknown> | null;
  history: Record<string, unknown>[];
  trend: { month: string; score: number }[];
}

export default function MonitoringPage() {
  const [data, setData] = useState<MonitoringData>({ regions: [], liveData: null, history: [], trend: [] });
  const [selectedRegion, setSelectedRegion] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch regions on mount
  useEffect(() => {
    fetch('/api/monitoring')
      .then(res => res.json())
      .then(json => {
        setData(json);
        if (json.regions?.length > 0) setSelectedRegion(json.regions[0]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Fetch region data when selected
  useEffect(() => {
    if (!selectedRegion) return;
    fetch(`/api/monitoring?region=${encodeURIComponent(selectedRegion)}`)
      .then(res => res.json())
      .then(json => setData(prev => ({ ...prev, liveData: json.liveData, history: json.history || [], trend: json.trend || [] })))
      .catch(console.error);
  }, [selectedRegion]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: 16, color: 'var(--primary)' }}><Monitor size={36} /></div>
        <p style={{ color: 'var(--on-surface-secondary)' }}>모니터링 데이터 로딩 중...</p>
      </div>
    </div>
  );

  const live = data.liveData as Record<string, unknown> | null;
  const hist = data.history || [];
  const trend = data.trend || [];
  const regions = data.regions || [];

  // Compute deltas if 2+ history entries
  const latestHist = hist.length > 0 ? hist[hist.length - 1] as Record<string, unknown> : null;
  const prevHist = hist.length > 1 ? hist[hist.length - 2] : null;
  const userType = latestHist?.userType as string || '';

  let displayScore = live?.mismatchScore as number;
  let displayLabel = '미스매치 점수';

  if (live && userType) {
    displayLabel = `미스매치 점수 (${userType})`;
    if (userType.includes('카페') || userType.includes('커피')) displayScore = live.scoreCafe as number;
    else if (userType.includes('음식') || userType.includes('식당')) displayScore = live.scoreFood as number;
    else if (userType.includes('프리미엄') || userType.includes('고급')) displayScore = live.scorePremium as number;
    else if (userType.includes('의료') || userType.includes('병원') || userType.includes('건강')) displayScore = live.scoreMedical as number;
    else if (userType.includes('생활') || userType.includes('마트') || userType.includes('편의')) displayScore = live.scoreDaily as number;
    else if (userType.includes('패션') || userType.includes('의류')) displayScore = live.scoreFashion as number;
    else if (userType.includes('여가') || userType.includes('오락')) displayScore = live.scoreLeisure as number;
    else if (userType.includes('숙박') || userType.includes('호텔')) displayScore = live.scoreAccommodation as number;
  }

  const fullOffset = (typeof displayScore === 'number' && trend.length > 0) 
    ? (Number(displayScore) - Number(trend[trend.length - 1].score)) : 0;

  const derivedTrend = trend.map((t: any) => ({
    ...t,
    score: Math.min(100, Math.max(0, Number(t.score) + fullOffset))
  }));
  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>지역 현황 모니터링</h1>
        <p className={styles.pageSubtitle}>저장 프로필의 지역 데이터를 조회하고 변동사항을 추적합니다.</p>
      </div>

      {regions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--on-surface-tertiary)' }}>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center', color: 'var(--primary)' }}><SquareX size={48} /></div>
          <p>저장된 분석 이력이 없습니다.</p>
          <p style={{ fontSize: '0.8125rem', marginTop: 8 }}>AI 분석 리포트 탭에서 분석 후 분석 이력을 저장해주세요.</p>
        </div>
      ) : (
        <>
          {/* Region Selector */}
          <div style={{ marginBottom: 24 }}>
            <select value={selectedRegion} onChange={e => setSelectedRegion(e.target.value)}
              style={{ padding: '10px 16px', border: '1.5px solid var(--outline)', borderRadius: 'var(--radius-lg)', fontFamily: 'var(--font-body)', fontSize: '0.9375rem', fontWeight: 600, background: 'var(--surface-container-lowest)', outline: 'none', cursor: 'pointer' }}>
              {(regions || []).map(r => <option key={r}>{r}</option>)}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Live Data */}
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle} style={{ marginBottom: 20, display: 'flex', alignItems: 'center' }}><BarChart2 size={18} style={{ marginRight: 6, color: 'var(--primary)' }} /> 현재 지역 데이터</h3>
              {live ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {[
                    { label: displayLabel, value: displayScore, color: Number(displayScore) >= 80 ? '#16a34a' : Number(displayScore) >= 60 ? '#f59e0b' : '#dc2626' },
                    { label: '분류', value: live.zoneType },
                    { label: '거주인구', value: `${Number(live.totalResidentialPop || 0).toLocaleString()}명` },
                    { label: '유동인구', value: `${Number(live.totalFloatingPop || 0).toLocaleString()}명` },
                    { label: '평균소득', value: `${Number(live.avgIncome || 0).toLocaleString()}만원` },
                    { label: '주민당소비', value: `${Number(live.consumptionPerResident || 0).toLocaleString()}원` },
                    { label: '교통등급', value: live.transportGrade },
                    { label: '아파트시세', value: `${Number(live.avgAptPrice || 0).toLocaleString()}만` },
                  ].map(m => (
                    <div key={m.label} style={{ padding: '12px 14px', background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--on-surface-tertiary)', fontWeight: 600, letterSpacing: '0.04em' }}>{m.label}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginTop: 4, color: m.color || 'inherit' }}>{String(m.value)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--on-surface-tertiary)', fontSize: '0.875rem' }}>데이터를 불러오는 중...</p>
              )}
            </div>

            {/* History Delta */}
            <div className={styles.chartCard}>
              <h3 className={styles.chartTitle} style={{ marginBottom: 20, display: 'flex', alignItems: 'center' }}><TrendingUp size={18} style={{ marginRight: 6, color: 'var(--primary)' }} /> 내 저장 이력 변동</h3>
              {latestHist ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { label: '월매출', key: 'monthlyRevenue', suffix: '원' },
                    { label: '월세', key: 'monthlyRent', suffix: '원' },
                    { label: '객단가', key: 'avgUnitPrice', suffix: '원' },
                    { label: '종합점수', key: 'totalScore', suffix: '' },
                  ].map(m => {
                    const current = Number((latestHist as Record<string, unknown>)[m.key] || 0);
                    const prev = prevHist ? Number((prevHist as Record<string, unknown>)[m.key] || 0) : null;
                    const delta = prev !== null ? current - prev : null;
                    return (
                      <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', background: 'var(--surface-container-lowest)', borderRadius: 'var(--radius-md)' }}>
                        <div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--on-surface-tertiary)', fontWeight: 600 }}>{m.label}</div>
                          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', marginTop: 2 }}>{current.toLocaleString()}{m.suffix}</div>
                        </div>
                        {delta !== null && (
                          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: delta > 0 ? '#16a34a' : delta < 0 ? '#dc2626' : 'var(--on-surface-tertiary)' }}>
                            {delta > 0 ? '+' : ''}{delta.toLocaleString()}{m.suffix}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {!prevHist && (
                    <p style={{ fontSize: '0.8125rem', color: 'var(--on-surface-tertiary)', textAlign: 'center', padding: '8px 0' }}>
                      변동사항 추적은 같은 지역으로 2회 이상 저장 시 활성화됩니다.
                    </p>
                  )}
                </div>
              ) : (
                <p style={{ color: 'var(--on-surface-tertiary)', fontSize: '0.875rem' }}>저장된 이력이 없습니다.</p>
              )}
            </div>
          </div>

          {/* Mismatch Trend */}
          {derivedTrend.length > 0 && (
            <div className={styles.chartCard} style={{ marginTop: 24 }}>
              <h3 className={styles.chartTitle} style={{ marginBottom: 16 }}>{displayLabel} 추이</h3>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={derivedTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={(v) => String(v).slice(0, 7)} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }} />
                  <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3, fill: '#2563eb' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}
