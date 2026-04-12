'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import styles from '@/components/dashboard/Dashboard.module.css';
import { Hourglass, Building2, Gem, Scale, AlertTriangle, Store, BarChart2 } from 'lucide-react';

interface Summary {
  totalDongs: number;
  opportunityZones: number;
  saturatedZones: number;
  balancedZones: number;
  avgStores: number;
  avgScore: number;
  forecast: {
    increasingOpportunity: number;
    increasingSaturation: number;
    stable: number;
  };
}

interface MismatchRow {
  guName: string;
  dongName: string;
  mismatchScore: number;
  zoneType: string;
  totalResidentialPop: number;
  totalFloatingPop: number;
  avgIncome: number;
  transportGrade: string;
  totalStores: number;
  predictionDirection: string;
  predictionScore3m: number;
  bestIndustry: string;
  suitabilityLabel: string;
  [key: string]: unknown;
}

interface GuAvg { gu: string; avgScore: number; }
interface ZoneDist { gu: string; zone: string; count: number; }

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

function ZoneChip({ score }: { score: number }) {
  const label = getLabel(score);
  const color = getColor(score);
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 'var(--radius-full)',
      fontSize: '0.6875rem', fontWeight: 600, color,
      background: `${color}18`,
    }}>{label}</span>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [data, setData] = useState<MismatchRow[]>([]);
  const [guAverages, setGuAverages] = useState<GuAvg[]>([]);
  const [zoneDistribution, setZoneDistribution] = useState<ZoneDist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/mismatch')
      .then(res => res.json())
      .then(json => {
        setSummary(json.summary);
        setData(json.data);
        setGuAverages(json.guAverages || []);
        setZoneDistribution(json.zoneDistribution || []);
      })
      .catch(err => console.error('Failed to fetch mismatch data:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 16, color: 'var(--primary)' }}><Hourglass size={36} /></div>
          <p style={{ color: 'var(--on-surface-secondary)' }}>Snowflake AI 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  const metrics = summary ? [
    { icon: <Building2 size={24} />, value: summary.totalDongs, label: '분석 대상', unit: '개 동', color: '#0053dc' },
    { icon: <Gem size={24} />, value: summary.opportunityZones, label: '기회 지역', unit: '개', color: '#2563eb' },
    { icon: <Scale size={24} />, value: summary.balancedZones, label: '보통 지역', unit: '개', color: '#16a34a' },
    { icon: <AlertTriangle size={24} />, value: summary.saturatedZones, label: '과밀 지역', unit: '개', color: '#dc2626' },
    { icon: <Store size={24} />, value: summary.avgStores, label: '평균 점포수', unit: '개', color: '#7c3aed' },
    { icon: <BarChart2 size={24} />, value: summary.avgScore, label: '평균 미스매치', unit: '점', color: '#0891b2' },
  ] : [];

  const uniqueGus = Array.from(new Set(zoneDistribution.map(d => d.gu)));

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>AI 상권 분석 대시보드</h1>
        <p className={styles.pageSubtitle}>
          Snowflake Marketplace 7종 데이터와 XGBoost 예측 모델 기반의 수요-공급 미스매치 현황입니다.
        </p>
      </div>

      <div className={styles.metricsGrid}>
        {metrics.map((m) => (
          <div key={m.label} className="metric-card">
            <div className="metric-icon" style={{ background: `${m.color}15`, color: m.color }}>{m.icon}</div>
            <div className="metric-value">{m.value}</div>
            <div className="metric-label">{m.label}</div>
          </div>
        ))}
      </div>

      {summary?.forecast && (
        <div className={styles.chartCard} style={{ margin: '24px 0', border: '1px solid #e2e8f0', background: 'linear-gradient(135deg, #fff 0%, #f8faff 100%)' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ width: 8, height: 24, background: 'var(--primary)', borderRadius: 4, marginRight: 12 }} />
            <h3 className={styles.chartTitle} style={{ margin: 0 }}>ML 예측: 3개월 후 미스매치 변화 전망 (XGBoost)</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
            <div style={{ padding: 20, background: '#eff6ff', borderRadius: 16, border: '1px solid #dbeafe' }}>
              <div style={{ fontSize: '0.875rem', color: '#1e40af', marginBottom: 8, fontWeight: 600 }}>기회 증가 예측 (전망 밝음)</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#2563eb' }}>{summary.forecast.increasingOpportunity}</div>
                <div style={{ fontSize: '1rem', color: '#3b82f6', fontWeight: 600 }}>개 동</div>
              </div>
            </div>
            <div style={{ padding: 20, background: '#f8fafc', borderRadius: 16, border: '1px solid #f1f5f9' }}>
              <div style={{ fontSize: '0.875rem', color: '#475569', marginBottom: 8, fontWeight: 600 }}>안정 유지 예측</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#64748b' }}>{summary.forecast.stable}</div>
                <div style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 600 }}>개 동</div>
              </div>
            </div>
            <div style={{ padding: 20, background: '#fef2f2', borderRadius: 16, border: '1px solid #fee2e2' }}>
              <div style={{ fontSize: '0.875rem', color: '#991b1b', marginBottom: 8, fontWeight: 600 }}>과열 심화 예측 (주의 필요)</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: '#dc2626' }}>{summary.forecast.increasingSaturation}</div>
                <div style={{ fontSize: '1rem', color: '#ef4444', fontWeight: 600 }}>개 동</div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>구별 평균 미스매치 점수</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={guAverages}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="gu" tick={{ fontSize: 12, fontFamily: 'Space Grotesk' }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }} />
              <Bar dataKey="avgScore" fill="#0053dc" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>구별 분류 분포</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '8px 0' }}>
            {uniqueGus.map((gu) => {
              const zones = zoneDistribution.filter(d => d.gu === gu);
              const total = zones.reduce((s, z) => s + z.count, 0);
              return (
                <div key={gu} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: 200 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}><Building2 size={16} /></div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{gu}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-tertiary)' }}>{total}개 동</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {zones.map((z) => {
                      const color = z.zone.includes('기회') ? '#2563eb' : z.zone.includes('과밀') ? '#dc2626' : '#16a34a';
                      const label = z.zone.includes('기회') ? '기회' : z.zone.includes('과밀') ? '과밀' : '보통';
                      return (
                        <span key={z.zone} style={{
                          display: 'inline-block', padding: '2px 10px', borderRadius: 'var(--radius-full)',
                          fontSize: '0.6875rem', fontWeight: 600, color, background: `${color}18`, marginRight: 2,
                        }}>
                          {label} ({z.count})
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h3 className={styles.chartTitle}>주요 동 현황</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>동</th><th>구</th><th>미스매치 점수</th><th>분류</th><th>AI 추천업종</th><th>3개월 전망</th><th>거주인구</th><th>유동인구</th></tr>
          </thead>
          <tbody>
            {data.slice(0, 15).map((r, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{r.dongName}</td>
                <td>{r.guName}</td>
                <td style={{ fontWeight: 700, color: getColor(r.mismatchScore) }}>{r.mismatchScore.toFixed(1)}</td>
                <td><ZoneChip score={r.mismatchScore} /></td>
                <td style={{ fontWeight: 600, color: 'var(--primary)' }}>{r.bestIndustry}</td>
                <td style={{ fontSize: '0.75rem', fontWeight: 600, color: r.predictionDirection?.includes('기회') ? '#2563eb' : r.predictionDirection?.includes('과열') ? '#dc2626' : 'inherit' }}>{r.predictionDirection}</td>
                <td>{r.totalResidentialPop?.toLocaleString()}</td>
                <td>{r.totalFloatingPop?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
