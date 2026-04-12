'use client';

import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area,
} from 'recharts';
import styles from '@/components/dashboard/Dashboard.module.css';
import { TrendingUp, Settings } from 'lucide-react';
import { businessTypes } from '@/lib/mock-data';

interface TrendPoint { region: string; month: string; score: number; }
interface ConsumptionPoint { month: string; consumption: number; floatingPop: number; }

const colorPalette = ['#6e91dcff', '#bd9ef2ff', '#efd859ff', '#4cd57eff', '#d99520ff', '#57ceecff', '#d16a6aff', '#c28eaeff'];

export default function TrendsPage() {
  const [allTrends, setAllTrends] = useState<TrendPoint[]>([]);
  const [consumption, setConsumption] = useState<ConsumptionPoint[]>([]);
  const [allRegions, setAllRegions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedType, setSelectedType] = useState('all');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/trends?type=${selectedType}`)
      .then(res => res.json())
      .then(json => {
        const trends: TrendPoint[] = json.trends || [];
        const regions = Array.from(new Set(trends.map((d: TrendPoint) => d.region)));
        setAllTrends(trends);
        setAllRegions(prev => {
          if (prev.length === 0) setSelected(regions.slice(0, 3));
          return regions;
        });
        setConsumption(json.consumption || []);
      })
      .catch(err => console.error('Failed to fetch trends:', err))
      .finally(() => setLoading(false));
  }, [selectedType]);

  const colorMap: Record<string, string> = {};
  allRegions.forEach((r, i) => { colorMap[r] = colorPalette[i % colorPalette.length]; });

  const months = Array.from(new Set(allTrends.map(d => d.month))).sort();
  const lineData = months.map(m => {
    const point: Record<string, unknown> = { month: String(m).slice(0, 7) };
    selected.forEach(r => {
      const entry = allTrends.find(d => d.month === m && d.region === r);
      point[r] = entry?.score;
    });
    return point;
  });

  const toggle = (region: string) => {
    setSelected(prev => prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 16, color: 'var(--primary)' }}><TrendingUp size={36} /></div>
          <p style={{ color: 'var(--on-surface-secondary)' }}>미스매치 추이 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>미스매치 추이</h1>
        <p className={styles.pageSubtitle}>동별 미스매치 점수 변화를 추적합니다. 점수가 높을수록 수요 대비 공급 부족(기회), 낮을수록 공급 과밀(경쟁 과열) 지역입니다.</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', fontWeight: 600, color: 'var(--on-surface-secondary)' }}>
          <Settings size={16} /> 업종 필터
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--outline)', outline: 'none', background: 'var(--surface-container-lowest)', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
        >
          {businessTypes.filter(b => b.key !== 'realestate').map(b => (
            <option key={b.key} value={b.key}>{b.label}</option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {allRegions.map(r => (
          <button key={r} onClick={() => toggle(r)} style={{
            padding: '6px 16px', borderRadius: 'var(--radius-full)',
            border: `1.5px solid ${selected.includes(r) ? colorMap[r] : 'var(--outline)'}`,
            background: selected.includes(r) ? `${colorMap[r]}10` : 'transparent',
            color: selected.includes(r) ? colorMap[r] : 'var(--on-surface-secondary)',
            fontFamily: 'var(--font-body)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
          }}>{r}</button>
        ))}
      </div>

      <div className={styles.chartCard} style={{ marginBottom: 32 }}>
        <h3 className={styles.chartTitle}>미스매치 점수 추이 변화</h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: 'Space Grotesk' }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }} />
            <Legend />
            {selected.map(r => (
              <Line key={r} type="monotone" dataKey={r} stroke={colorMap[r]} strokeWidth={2.5} dot={{ r: 4, fill: colorMap[r] }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {consumption.length > 0 && (
        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>소비 추이 (백만원)</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={consumption}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={(v) => String(v).slice(5, 7) + '월'} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="consumption" stroke="#2563eb" fill="rgba(37,99,235,0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>유동인구 추이</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={consumption}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={(v) => String(v).slice(5, 7) + '월'} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="floatingPop" stroke="#7c3aed" fill="rgba(124,58,237,0.1)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
