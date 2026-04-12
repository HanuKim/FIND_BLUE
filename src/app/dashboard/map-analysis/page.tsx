'use client';

import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import styles from '@/components/dashboard/Dashboard.module.css';
import { Sparkles, Map, Lightbulb, Settings } from 'lucide-react';
import { businessTypes } from '@/lib/mock-data';

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
          position: 'absolute', top: '100%', right: 0, zIndex: 100, width: 320,
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

interface MismatchRow {
  guName: string;
  dongName: string;
  districtCode: string;
  mismatchScore: number;
  zoneType: string;
  totalResidentialPop: number;
  totalFloatingPop: number;
  avgIncome: number;
  transportGrade: string;
  avgLivingScore: number;
  aiInsight: string;
  opportunityLabel: string;
  predictionDirection?: string;
  predictionScore3m?: number;
  bestIndustry?: string;
  suitabilityLabel?: string;
  lat?: number;
  lng?: number;
  [key: string]: unknown;
}

/* ── Approximate coordinates for each 동 ── */
/* Coordinates are now dynamically fetched from Snowflake (LAT, LNG) */

const guOptions = ['전체', '서초구', '영등포구', '중구'];

const GU_CENTERS: Record<string, { center: [number, number]; zoom: number }> = {
  '서초구': { center: [127.02, 37.47], zoom: 13 },
  '영등포구': { center: [126.90, 37.52], zoom: 13 },
  '중구': { center: [126.99, 37.56], zoom: 14 },
  '전체': { center: [126.97, 37.51], zoom: 12 },
};

function getColor(score: number): string {
  if (score >= 70) return '#2563eb';     // blue — high opportunity
  if (score >= 40) return '#16a34a';     // green — balanced
  return '#dc2626';                      // red — oversupplied
}

export default function MapAnalysisPage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><div style={{ textAlign: 'center' }}><div style={{ marginBottom: 16, color: 'var(--primary)' }}><Map size={36} /></div><p style={{ color: 'var(--on-surface-secondary)' }}>로딩 중...</p></div></div>}>
      <MapAnalysisContent />
    </Suspense>
  );
}

function MapAnalysisContent() {
  const searchParams = useSearchParams();
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const [data, setData] = useState<MismatchRow[]>([]);
  const [selectedGu, setSelectedGu] = useState('전체');
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedDong, setSelectedDong] = useState<MismatchRow | null>(null);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      const found = guOptions.find(g => q.includes(g));
      if (found) setSelectedGu(found);
    }
  }, [searchParams]);

  useEffect(() => {
    fetch('/api/mismatch').then(r => r.json()).then(json => setData(json.data || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  const typeMap: Record<string, string> = {
    cafe: 'scoreCafe', restaurant: 'scoreFood', premium: 'scorePremium',
    daily: 'scoreDaily', medical: 'scoreMedical', fashion: 'scoreFashion',
    entertainment: 'scoreLeisure', accommodation: 'scoreAccommodation'
  };
  const currentScoreKey = typeMap[selectedType] || 'mismatchScore';

  const filtered = data
    .filter(d => selectedGu === '전체' || d.guName === selectedGu)
    .map(d => ({ ...d, mismatchScore: Number(d[currentScoreKey] || d.mismatchScore) }));

  const filteredRef = useRef(filtered);
  useEffect(() => {
    filteredRef.current = filtered;
  }, [filtered]);

  const blueZones = filtered.filter(d => d.mismatchScore >= 70).sort((a, b) => b.mismatchScore - a.mismatchScore);
  const redZones = filtered.filter(d => d.mismatchScore < 40).sort((a, b) => a.mismatchScore - b.mismatchScore);

  // Build GeoJSON
  const geojson = useCallback(() => {
    const features = filtered.map(d => {
      const lng = Number(d.lng);
      const lat = Number(d.lat);
      if (!lng || !lat) return null;
      return {
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [lng, lat] },
        properties: {
          guName: d.guName, dongName: d.dongName,
          mismatchScore: d.mismatchScore, zoneType: d.zoneType,
          pop: d.totalResidentialPop, floating: d.totalFloatingPop,
          income: d.avgIncome, transport: d.transportGrade,
          living: d.avgLivingScore, insight: d.aiInsight,
          color: getColor(d.mismatchScore),
          radius: Math.max(8, Math.min(20, Math.abs(d.mismatchScore) * 10 + 8)),
        },
      };
    }).filter(Boolean);
    return { type: 'FeatureCollection' as const, features };
  }, [filtered]);

  // Initialize map ONLY ONCE
  useEffect(() => {
    if (!mapContainer.current || loading || data.length === 0) return;
    if (mapRef.current) return;

    const guConf = GU_CENTERS['전체'];
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: guConf.center,
      zoom: guConf.zoom,
      attributionControl: false,
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('load', () => {
      map.addSource('points', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });

      map.addLayer({
        id: 'dong-circles', type: 'circle', source: 'points',
        paint: {
          'circle-radius': ['get', 'radius'],
          'circle-color': ['get', 'color'],
          'circle-opacity': 0.7,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      map.addLayer({
        id: 'dong-labels', type: 'symbol', source: 'points',
        layout: {
          'text-field': ['get', 'dongName'], 'text-size': 11, 'text-offset': [0, -2],
          'text-anchor': 'bottom', 'text-allow-overlap': false,
        },
        paint: {
          'text-color': '#1e293b', 'text-halo-color': '#ffffff', 'text-halo-width': 1.5,
        },
      });

      // Click handler
      map.on('click', 'dong-circles', (e) => {
        if (!e.features || e.features.length === 0) return;
        const p = e.features[0].properties;
        if (!p) return;
        const coords = (e.features[0].geometry as GeoJSON.Point).coordinates as [number, number];

        const found = filteredRef.current.find(d => d.dongName === p.dongName && d.guName === p.guName);
        if (found) setSelectedDong(found);

        if (popupRef.current) popupRef.current.remove();
        popupRef.current = new maplibregl.Popup({ offset: 15, maxWidth: '280px' })
          .setLngLat(coords)
          .setHTML(`
            <div style="font-family:system-ui;padding:4px;">
              <div style="font-weight:700;font-size:14px;margin-bottom:4px;">${p.guName} ${p.dongName}</div>
              <div style="font-size:12px;color:#64748b;margin-bottom:8px;">미스매치 점수: <b style="color:${getColor(p.mismatchScore as number)}">${Number(p.mismatchScore).toFixed(1)}</b> · ${p.zoneType}</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:11px;">
                <span>거주인구: <b>${Number(p.pop).toLocaleString()}</b></span>
                <span>유동인구: <b>${Number(p.floating).toLocaleString()}</b></span>
                <span>평균소득: <b>${Number(p.income).toLocaleString()}만</b></span>
                <span>교통: <b>${p.transport}</b></span>
              </div>
            </div>
          `)
          .addTo(map);
      });

      map.on('mouseenter', 'dong-circles', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'dong-circles', () => { map.getCanvas().style.cursor = ''; });
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, [loading, data]);

  // Update map data when geojson changes
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const updateData = () => {
      const source = map.getSource('points') as maplibregl.GeoJSONSource;
      if (source) source.setData(geojson() as GeoJSON.FeatureCollection);
    };
    if (map.isStyleLoaded()) updateData(); else map.once('load', updateData);
  }, [geojson]);

  // FlyTo strictly on Gu change
  useEffect(() => {
    if (!mapRef.current) return;
    const guConf = GU_CENTERS[selectedGu] || GU_CENTERS['전체'];
    mapRef.current.flyTo({ center: guConf.center, zoom: guConf.zoom, essential: true });
  }, [selectedGu]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 16, color: 'var(--primary)' }}><Map size={36} /></div>
          <p style={{ color: 'var(--on-surface-secondary)' }}>지도 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>서울 3개구 미스매치 지도</h1>
        <p className={styles.pageSubtitle}>파란색은 창업 추천 지역, 빨간색은 위험지역 입니다. 미스매치 점수가 높을 수록 유리합니다.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
        {/* Real Map */}
        <div className={styles.mapContainer} style={{ position: 'relative' }}>
          <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
          {/* Legend */}
          <div style={{ position: 'absolute', bottom: 16, left: 16, display: 'flex', gap: 16, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(8px)', borderRadius: 10, padding: '8px 16px', fontSize: '0.75rem', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#2563eb', display: 'inline-block' }} /> 높은 기회 (70+)</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#16a34a', display: 'inline-block' }} /> 보통 (40-70)</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} /> 공급 과밀 (&lt;40)</span>
          </div>
        </div>

        {/* Filter & Info Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className={styles.filterPanel}>
            <div className={styles.filterTitle} style={{ display: 'flex', alignItems: 'center' }}>지도 필터 <Settings size={14} style={{ marginLeft: 6 }} /></div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>구 선택</label>
              <select className={styles.filterSelect} value={selectedGu} onChange={(e) => { setSelectedGu(e.target.value); setSelectedDong(null); }}>
                {guOptions.map((g) => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>업종 선택</label>
              <select className={styles.filterSelect} value={selectedType} onChange={(e) => { setSelectedType(e.target.value); setSelectedDong(null); }}>
                {businessTypes.filter(b => b.key !== 'realestate').map(b => (
                  <option key={b.key} value={b.key}>{b.label}</option>
                ))}
              </select>
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>분석 결과</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: '0.8125rem', fontWeight: 600 }}>
                <span style={{ color: '#2563eb' }}>● 기회 {blueZones.length}개</span>
                <span style={{ color: '#16a34a' }}>● 보통 {filtered.filter(d => d.mismatchScore >= 40 && d.mismatchScore < 70).length}개</span>
                <span style={{ color: '#dc2626' }}>● 과밀 {redZones.length}개</span>
              </div>
            </div>
          </div>

          {/* Selected Dong Detail */}
          {selectedDong && (
            <div className={styles.chartCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.125rem' }}>{selectedDong.guName} {selectedDong.dongName}</div>
                  <span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 600, color: selectedDong.mismatchScore >= 70 ? '#2563eb' : selectedDong.mismatchScore >= 40 ? '#16a34a' : '#dc2626', background: `${selectedDong.mismatchScore >= 70 ? '#2563eb' : selectedDong.mismatchScore >= 40 ? '#16a34a' : '#dc2626'}18` }}>{selectedDong.mismatchScore >= 70 ? '기회' : selectedDong.mismatchScore >= 40 ? '보통' : '과밀'}</span>
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.5rem', color: getColor(selectedDong.mismatchScore) }}>{selectedDong.mismatchScore.toFixed(1)}점</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.8125rem' }}>
                <div><span style={{ color: 'var(--on-surface-tertiary)' }}>거주인구</span><br /><b>{selectedDong.totalResidentialPop?.toLocaleString()}</b></div>
                <div><span style={{ color: 'var(--on-surface-tertiary)' }}>유동인구</span><br /><b>{selectedDong.totalFloatingPop?.toLocaleString()}</b></div>
                <div><span style={{ color: 'var(--on-surface-tertiary)' }}>평균소득</span><br /><b>{selectedDong.avgIncome?.toLocaleString()}만</b></div>
                <div><span style={{ color: 'var(--on-surface-tertiary)' }}>교통등급</span><br /><b>{selectedDong.transportGrade}</b></div>
              </div>

              <div style={{ marginTop: 12, padding: '12px', background: 'linear-gradient(135deg, #eff6ff 0%, #f8faff 100%)', borderRadius: 'var(--radius-lg)', border: '1px solid #dbeafe' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#1e40af', marginBottom: 8, display: 'flex', alignItems: 'center' }}>
                  <Sparkles size={12} style={{ marginRight: 4 }} /> AI 예측 결과
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ color: '#64748b' }}>추천 업종</span>
                    <b style={{ color: 'var(--primary)' }}>{selectedDong.bestIndustry || '기타'}</b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ color: '#64748b' }}>3개월 전망</span>
                    <b style={{ color: selectedDong.predictionDirection?.includes('기회') ? '#2563eb' : selectedDong.predictionDirection?.includes('과열') ? '#dc2626' : '#64748b' }}>
                      {selectedDong.predictionDirection || '안정'}
                    </b>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                    <span style={{ color: '#64748b' }}>창업 적합도</span>
                    <b>{selectedDong.suitabilityLabel || '보통'}</b>
                  </div>
                </div>
              </div>

              {selectedDong.aiInsight && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--surface-container-low)', borderRadius: 'var(--radius-lg)', fontSize: '0.8125rem', color: 'var(--on-surface-secondary)', lineHeight: 1.6, display: 'flex', alignItems: 'flex-start' }}>
                  <Lightbulb size={14} style={{ marginRight: 6, flexShrink: 0, marginTop: 2, color: '#f59e0b' }} />
                  <span>{selectedDong.aiInsight.slice(0, 150)}...</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Insights */}
      <div style={{ marginTop: 48 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, marginBottom: 20 }}>핵심 인사이트</h2>
        <div className={styles.insightGrid}>
          <div className={styles.insightCard}>
            <h3 className={styles.insightTitle}>소비 vs 거주인구</h3>
            <p className={styles.insightDesc}>거주인구는 많은데 소비가 적은 지역은 새로운 매장이 필요한 곳입니다. 반대로 거주인구 대비 소비가 과도한 곳은 유동인구에 의존하는 상업지구입니다.</p>
          </div>
          <div className={styles.insightCard}>
            <h3 className={styles.insightTitle}>유동인구 vs 거주인구</h3>
            <p className={styles.insightDesc}>유동인구가 거주인구보다 훨씬 많으면 출퇴근/관광 중심 상권입니다. 이런 곳은 경기 변동에 민감하고, 주말 매출이 급감할 수 있습니다.</p>
          </div>
          <div className={styles.insightCard}>
            <h3 className={styles.insightTitle}>소득 vs 소비</h3>
            <p className={styles.insightDesc}>소득이 높은데 소비가 적으면 주민들이 다른 지역에서 소비하고 있다는 뜻입니다. 프리미엄 매장이나 맛집이 들어서면 지역 내 소비를 끌어올 수 있습니다.</p>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h3 className={styles.chartTitle}>구별 상세 분석</h3>
          <select className={styles.filterSelect} value={selectedGu} onChange={(e) => setSelectedGu(e.target.value)}>
            {guOptions.map(g => <option key={g}>{g}</option>)}
          </select>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>동</th><th>미스매치 점수</th><th>분류</th><th>거주인구</th><th>유동인구</th><th>평균소득</th><th>교통</th><th>주거점수</th><th>AI 분석</th></tr>
          </thead>
          <tbody>
            {filtered.sort((a, b) => b.mismatchScore - a.mismatchScore).map((r, i) => (
              <tr key={i} style={{ cursor: 'pointer' }} onClick={() => setSelectedDong(r)}>
                <td style={{ fontWeight: 600 }}>{r.guName} {r.dongName}</td>
                <td style={{ fontWeight: 700, color: getColor(r.mismatchScore) }}>{r.mismatchScore.toFixed(1)}</td>
                <td><span style={{ display: 'inline-block', padding: '2px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.6875rem', fontWeight: 600, color: r.mismatchScore >= 70 ? '#2563eb' : r.mismatchScore >= 40 ? '#16a34a' : '#dc2626', background: `${r.mismatchScore >= 70 ? '#2563eb' : r.mismatchScore >= 40 ? '#16a34a' : '#dc2626'}18` }}>{r.mismatchScore >= 70 ? '기회' : r.mismatchScore >= 40 ? '보통' : '과밀'}</span></td>
                <td>{r.totalResidentialPop?.toLocaleString()}</td>
                <td>{r.totalFloatingPop?.toLocaleString()}</td>
                <td>{r.avgIncome?.toLocaleString()}만</td>
                <td>{r.transportGrade}</td>
                <td>{r.avgLivingScore}</td>
                <td><AiTooltip text={r.aiInsight} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
