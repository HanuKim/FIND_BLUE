'use client';

import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import styles from '@/components/dashboard/Dashboard.module.css';
import { BarChart3 } from 'lucide-react';

interface TelecomRow {
  month: string;
  guName: string;
  totalContracts: number;
  totalOpens: number;
  bundleContracts: number;
  standaloneContracts: number;
  avgSales: number;
}

const colorMap: Record<string, string> = { '서초구': '#2563eb', '영등포구': '#7c3aed', '중구': '#f59e0b' };

export default function DemandPage() {
  const [data, setData] = useState<TelecomRow[]>([]);
  const [latest, setLatest] = useState<TelecomRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/telecom')
      .then(res => res.json())
      .then(json => {
        setData(json.data || []);
        setLatest(json.latest || []);
      })
      .catch(err => console.error('Failed to fetch telecom:', err))
      .finally(() => setLoading(false));
  }, []);

  const gus = Array.from(new Set(data.map(d => d.guName)));
  const months = Array.from(new Set(data.map(d => d.month))).sort();

  const lineData = months.map(m => {
    const point: Record<string, unknown> = { month: String(m).slice(0, 7) };
    gus.forEach(g => {
      const entry = data.find(d => d.month === m && d.guName === g);
      point[g] = entry?.totalContracts;
    });
    return point;
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 16, color: 'var(--primary)' }}><BarChart3 size={36} /></div>
          <p style={{ color: 'var(--on-surface-secondary)' }}>통신/이사 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>통신/렌탈 수요</h1>
        <p className={styles.pageSubtitle}>인터넷 신규 설치 및 렌탈 건수는 실제 이사/입주를 반영하는 선행 지표입니다.</p>
      </div>

      <div className={styles.chartCard} style={{ marginBottom: 32 }}>
        <h3 className={styles.chartTitle}>구별 월별 신규 계약 추이</h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: 'Space Grotesk' }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }} />
            <Legend />
            {gus.map(g => (
              <Line key={g} type="monotone" dataKey={g} stroke={colorMap[g] || '#666'} strokeWidth={2.5} dot={{ r: 4, fill: colorMap[g] || '#666' }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h3 className={styles.chartTitle}>{latest.length > 0 ? '최신 월별 현황' : '전체 데이터'}</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>구</th><th>총계약</th><th>개통</th><th>결합상품</th><th>단독상품</th><th>평균매출</th><th>상태</th></tr>
          </thead>
          <tbody>
            {(latest.length > 0 ? latest : data.slice(-6)).map((r, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{r.guName}</td>
                <td>{r.totalContracts?.toLocaleString()}</td>
                <td>{r.totalOpens?.toLocaleString()}</td>
                <td>{r.bundleContracts?.toLocaleString()}</td>
                <td>{r.standaloneContracts?.toLocaleString()}</td>
                <td>{r.avgSales?.toLocaleString()}원</td>
                <td><span className="badge badge-active">활성</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>계약 추이 요약</h3>
          <p className="body-sm" style={{ color: 'var(--on-surface-secondary)', marginBottom: 20 }}>
            결합상품(인터넷+TV+전화) 비율이 높으면 가족 단위 입주가 많다는 신호입니다.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '20px 0' }}>
            {gus.map(g => {
              const guData = data.filter(d => d.guName === g);
              const totalC = guData.reduce((s, d) => s + d.totalContracts, 0);
              const totalB = guData.reduce((s, d) => s + d.bundleContracts, 0);
              const pct = totalC > 0 ? Math.round((totalB / totalC) * 100) : 0;
              return (
                <div key={g}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.875rem', fontWeight: 600 }}>
                    <span>{g}</span>
                    <span>결합 {pct}%</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--surface-container-low)', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: colorMap[g] || '#2563eb', borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>구별 렌탈 이용률</h3>
          <p className="body-sm" style={{ color: 'var(--on-surface-secondary)', marginBottom: 20 }}>
            렌탈 이용은 생활 정착 비율을 판단하는 지표로 이용할 수 있습니다.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '20px 0' }}>
            {gus.map(g => {
              const guData = data.filter(d => d.guName === g);
              const totalC = guData.reduce((s, d) => s + d.totalContracts, 0);
              const totalO = guData.reduce((s, d) => s + d.totalOpens, 0);
              const pct = totalC > 0 ? Math.round((totalO / totalC) * 100) : 0;
              return (
                <div key={g}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.875rem', fontWeight: 600 }}>
                    <span>{g}</span>
                    <span>{pct}% 이용</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--surface-container-low)', borderRadius: 3 }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: colorMap[g] || '#2563eb', borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
