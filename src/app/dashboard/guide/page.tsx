'use client';

import React from 'react';
import styles from '@/components/dashboard/Dashboard.module.css';
import { Info, BarChart2, ChevronUp, Target, Radio, Blend } from 'lucide-react';
import { businessTypes } from '@/lib/mock-data';

export default function GuidePage() {
  return (
    <div>
      <div className={styles.pageHeader}>

        <h1 className={styles.pageTitle} style={{ fontSize: '2.5rem' }}>
          이용 가이드
        </h1>
        <p className={styles.pageSubtitle}>
          미스매치 점수 산출 방식과 주요 지표를 확인하세요.
        </p>
      </div>

      {/* 미스매치 점수란? */}
      <div className={styles.guideGrid}>
        <div className={styles.guideCard}>
          <div style={{ marginBottom: 12, display: 'inline-flex', padding: 8, background: 'var(--surface-container-low)', borderRadius: '12px', color: 'var(--primary)' }}>
            <BarChart2 size={24} />
          </div>
          <div className="label-md" style={{ color: 'var(--on-surface-tertiary)', marginBottom: 8 }}>핵심 개념</div>
          <h2 className={styles.guideCardTitle}>미스매치 점수란?</h2>
          <p className={styles.guideCardDesc}>
            <b>&ldquo;이 지역에 수요 대비 공급이 충분한가?&rdquo;</b>를 수치화한 것입니다.
            소비 금액(수요)을 실제 점포 수(공급)로 나눈 <b>점포당 매출</b>을 기반으로 산출합니다.<br />

            점포당 매출이 높다 = 수요는 있는데 매장이 부족하다 = <b>창업 기회!</b><br />
            이외에 업종별 특성을 고려하여 7가지 지표를 종합적으로 판단합니다.
          </p>
          <div className={styles.guideScoreRanges}>
            <div className={styles.guideScoreRange}>
              <div className={styles.guideScoreValue} style={{ color: '#2563eb' }}>높은 기회 (70+)</div>
              <div className={styles.guideScoreLabel}>수요 대비 공급 부족. 신규 진입 기회.</div>
            </div>
            <div className={styles.guideScoreRange}>
              <div className={styles.guideScoreValue} style={{ color: '#16a34a' }}>보통 (40~70)</div>
              <div className={styles.guideScoreLabel}>균형 상태. 안정적 시장.</div>
            </div>
            <div className={styles.guideScoreRange}>
              <div className={styles.guideScoreValue} style={{ color: '#dc2626' }}>공급 과밀 (&lt;40)</div>
              <div className={styles.guideScoreLabel}>점포당 매출 낮음. 경쟁 과열.</div>
            </div>
          </div>
        </div>

        <div className={styles.guideCard}>
          <div style={{ marginBottom: 12, display: 'inline-flex', padding: 8, background: 'var(--surface-container-low)', borderRadius: '12px', color: 'var(--primary)' }}>
            <Blend size={24} />
          </div>
          <h3 className={styles.guideCardTitle}>점수 산출 방식</h3>
          <p className={styles.guideCardDesc} style={{ marginBottom: 16 }}>
            단순히 유동인구만 보지 않고 <b>7가지 핵심 차원</b>의 데이터를 결합하여 0~100점 척도로 산출합니다.
          </p>
          <div style={{ fontSize: '0.8125rem', color: 'var(--on-surface-secondary)', lineHeight: 1.8 }}>
            <p style={{ marginBottom: 8 }}><b>1. 7종 데이터 수집 (수요+공급 측정):</b> 신한카드 소비, SKT 유동인구, KCB 소득, 소상공인 점포수 등 실물 경제 지표를 아우릅니다.</p>
            <p style={{ marginBottom: 8 }}><b>2. 지역 지표 스케일링:</b> 각 차원별 데이터를 정규화하여 지역 간 상대비교가 가능한 점수 체계로 환산합니다.</p>
            <p style={{ marginBottom: 8 }}><b>3. 업종별 맞춤 가중치 적용:</b> 카페는 대중교통(20%)과 점포당매출(25%)을, 프리미엄 매장은 소득규모(30%)를, 생활밀착형은 거주인구(30%)를 중시하는 등 <b>업종 특성에 따라 차별화된 가중치를 곱하여 합산</b>합니다.</p>
            <p>이를 통해 동일한 지역에 대해서도 창업하려는 분야에 따라 완전히 <b>맞춤화된 성공 가능성 점수</b>가 제공됩니다.</p>
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 16, flexWrap: 'wrap' }}>
            <span className="badge badge-opportunity">● 7종 데이터 융합</span>
            <span className="badge badge-balanced">● 맞춤형 0~100점 척도</span>
          </div>
        </div>
      </div>

      {/* 3 column cards */}
      <div className={styles.guideThreeCol}>
        <div className={styles.guideCard}>
          <h3 className={styles.guideCardTitle}>업종별 맞춤 가중치</h3>
          <p className={styles.guideCardDesc}>
            같은 지역이라도 업종에 따라 <b>다른 점수</b>가 나옵니다.
            7개 차원의 가중치가 업종 특성에 맞게 조정됩니다.
          </p>
          <div style={{ marginTop: 16, fontSize: '0.8125rem', color: 'var(--on-surface-secondary)', lineHeight: 1.8 }}>
            <div>• 카페: 교통접근성(20%) + 점포당매출(25%)</div>
            <div>• 생활밀착: 거주인구(30%) + 가족밀집도(25%)</div>
            <div>• 프리미엄: 소득/자산(30%)</div>
            <div>• 숙박: 유동인구(25%) + 교통(20%)</div>
          </div>
        </div>
        <div className={styles.guideCard}>
          <div style={{ marginBottom: 12, display: 'inline-flex', padding: 8, background: 'var(--surface-container-low)', borderRadius: '12px', color: 'var(--primary)' }}>
            <Target size={20} />
          </div>
          <h3 className={styles.guideCardTitle}>추천 로직</h3>
          <p className={styles.guideCardDesc}>
            업종별 <b>맞춤 미스매치 점수</b>가 높은 순으로 추천합니다.
            카페를 선택하면 카페 점수 기준, 음식점을 선택하면 음식점 점수 기준으로 정렬됩니다.
          </p>
          <div style={{ marginTop: 16, fontSize: '0.8125rem', color: 'var(--on-surface-secondary)', lineHeight: 1.8 }}>
            <div>• 전체: 종합 미스매치 점수 기준</div>
            <div>• 각 업종: 해당 업종 가중치 적용 점수 기준</div>
            <div>• 부동산: 종합 점수 + 시세 데이터 필터</div>
          </div>
        </div>
        <div className={styles.guideCard} style={{ background: 'var(--gradient-primary)', color: 'white' }}>
          <div style={{ marginBottom: 12, display: 'inline-flex', padding: 8, background: 'rgba(255,255,255,0.2)', borderRadius: '12px' }}>
            <Radio size={20} />
          </div>
          <h3 className={styles.guideCardTitle}>데이터 출처 (7종)</h3>
          <p style={{ fontSize: '0.8125rem', lineHeight: 1.7, opacity: 0.9 }}>
            Snowflake Marketplace 6종 + 소상공인진흥공단 공공API 1종을 결합하여
            수요와 공급 양면을 동시에 분석합니다.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            {['SPH', 'Dataknows', 'AJD', '공공API'].map(src => (
              <span key={src} style={{
                padding: '4px 10px', background: 'rgba(255,255,255,0.2)',
                borderRadius: 'var(--radius-full)', fontSize: '0.625rem', fontWeight: 600,
              }}>{src}</span>
            ))}
          </div>
        </div>
      </div>

      {/* 데이터 출처 테이블 */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h3 className={styles.chartTitle}>데이터 출처 상세</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>데이터</th>
              <th>제공자</th>
              <th>유형</th>
              <th>미스매치 점수 활용</th>
            </tr>
          </thead>
          <tbody>
            {[
              { data: '신한카드 업종별 소비', provider: 'SPH', type: 'Marketplace', use: '점포당 매출 분자 (수요)' },
              { data: 'SKT 유동인구/거주인구', provider: 'SPH', type: 'Marketplace', use: '거주인구 밀도, 유동인구 비율' },
              { data: 'KCB 소득/자산', provider: 'SPH', type: 'Marketplace', use: '소득/자산 수준' },
              { data: '아파트 시세/단지/생활점수', provider: 'Dataknows', type: 'Marketplace', use: '주거환경, 가족밀집도' },
              { data: '지하철 접근성/승하차', provider: 'Dataknows', type: 'Marketplace', use: '교통 접근성' },
              { data: '이사/렌탈/결합상품', provider: 'AJD', type: 'Marketplace', use: '가족밀집도, 인구유입' },
              { data: '업종별 점포 수', provider: '소상공인진흥공단', type: '공공API', use: '점포당 매출 분모 (공급)' },
            ].map(row => (
              <tr key={row.data}>
                <td style={{ fontWeight: 600 }}>{row.data}</td>
                <td>{row.provider}</td>
                <td><span className="badge badge-balanced">{row.type}</span></td>
                <td style={{ fontSize: '0.8125rem', color: 'var(--on-surface-secondary)' }}>{row.use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 점수 계산 7개 차원 */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h3 className={styles.chartTitle}>점수 계산에 사용되는 7개 차원</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>차원</th><th>데이터 출처</th><th>측정 내용</th></tr>
          </thead>
          <tbody>
            {[
              { dim: '점포당 매출', src: '신한카드 소비 (SPH) ÷ 점포 수 (공공API)', measure: '수요/공급 핵심 비율' },
              { dim: '거주인구 밀도', src: 'SKT 유동인구 (SPH)', measure: '잠재 고객 규모' },
              { dim: '소득/자산 수준', src: 'KCB 소득·자산 (SPH)', measure: '구매력·가격대 적합성' },
              { dim: '교통 접근성', src: '지하철역 수·승하차 인원 (Dataknows)', measure: '외부 고객 유입 가능성' },
              { dim: '가족 밀집도', src: '아파트 세대수 (Dataknows) + 결합상품 비율 (AJD)', measure: '가족 단위 수요' },
              { dim: '주거 환경', src: '아파트 시세·생활편의 점수 (Dataknows)', measure: '임대료 수준·생활 인프라' },
              { dim: '유동인구 비율', src: '방문자/거주자 비율 (SPH)', measure: '외부 유입 상권 특성' },
            ].map(row => (
              <tr key={row.dim}>
                <td style={{ fontWeight: 600 }}>{row.dim}</td>
                <td style={{ fontSize: '0.8125rem' }}>{row.src}</td>
                <td><span className="badge badge-balanced">{row.measure}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 업종별 맞춤 가중치 */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h3 className={styles.chartTitle}>업종별 맞춤 가중치</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ fontSize: '0.75rem' }}>
            <thead>
              <tr><th>차원</th><th>카페</th><th>음식점</th><th>프리미엄</th><th>생활밀착</th><th>의료</th><th>패션</th><th>여가</th><th>숙박</th></tr>
            </thead>
            <tbody>
              <tr><td style={{ fontWeight: 600 }}>점포당매출</td><td>25%</td><td>25%</td><td>20%</td><td>15%</td><td>25%</td><td>20%</td><td>25%</td><td>25%</td></tr>
              <tr><td style={{ fontWeight: 600 }}>거주인구</td><td>15%</td><td>20%</td><td>10%</td><td style={{ fontWeight: 700, color: '#2563eb' }}>30%</td><td>20%</td><td>10%</td><td style={{ fontWeight: 700, color: '#2563eb' }}>25%</td><td>5%</td></tr>
              <tr><td style={{ fontWeight: 600 }}>소득/자산</td><td>10%</td><td>5%</td><td style={{ fontWeight: 700, color: '#2563eb' }}>30%</td><td>5%</td><td>10%</td><td style={{ fontWeight: 700, color: '#2563eb' }}>25%</td><td>5%</td><td>10%</td></tr>
              <tr><td style={{ fontWeight: 600 }}>교통접근성</td><td style={{ fontWeight: 700, color: '#2563eb' }}>20%</td><td>15%</td><td>15%</td><td>5%</td><td>10%</td><td style={{ fontWeight: 700, color: '#2563eb' }}>20%</td><td>10%</td><td style={{ fontWeight: 700, color: '#2563eb' }}>20%</td></tr>
              <tr><td style={{ fontWeight: 600 }}>가족밀집도</td><td>5%</td><td>10%</td><td>5%</td><td style={{ fontWeight: 700, color: '#2563eb' }}>25%</td><td>15%</td><td>5%</td><td style={{ fontWeight: 700, color: '#2563eb' }}>20%</td><td>5%</td></tr>
              <tr><td style={{ fontWeight: 600 }}>주거환경</td><td>10%</td><td>10%</td><td>15%</td><td>10%</td><td>10%</td><td>10%</td><td>5%</td><td>10%</td></tr>
              <tr><td style={{ fontWeight: 600 }}>유동인구</td><td>15%</td><td>15%</td><td>5%</td><td>10%</td><td>10%</td><td>10%</td><td>10%</td><td style={{ fontWeight: 700, color: '#2563eb' }}>25%</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 업종별 설명 및 판단 기준표 */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h3 className={styles.chartTitle}>업종별 판단 기준 및 예시</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '15%' }}>업종구분</th>
              <th style={{ width: '50%' }}>판단 기준</th>
              <th style={{ width: '35%' }}>업종 예시</th>
            </tr>
          </thead>
          <tbody>
            {businessTypes.filter(b => b.key !== 'all').map(b => (
              <tr key={b.key}>
                <td style={{ fontWeight: 600 }}>{b.label}</td>
                <td style={{ fontSize: '0.8125rem', color: 'var(--on-surface-secondary)', lineHeight: 1.5 }}>{b.description}</td>
                <td style={{ fontSize: '0.75rem' }}>{b.examples}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>


      {/* Real-Time Synthesis */}
      <div style={{
        padding: 40, borderRadius: 'var(--radius-2xl)',
        background: 'linear-gradient(135deg, #1a2744, #0f1923)',
        color: 'white', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `linear-gradient(rgba(37,99,235,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(37,99,235,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, marginBottom: 16 }}>
            미스매치 분석
          </h3>
          <p style={{ maxWidth: 500, fontSize: '0.9375rem', lineHeight: 1.7, opacity: 0.8, marginBottom: 24 }}>
            소비 데이터(수요)와 실제 점포 수(공급)를 결합하여 블루오션을 찾습니다. <br />
            점포당 매출이 높은 지역은 아직 수요를 채울 매장이 부족한 블루오션입니다.
          </p>
          <a href="/dashboard/map-analysis" className="btn-outline" style={{ borderColor: 'white', color: 'white' }}>
            지도에서 확인하기
          </a>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 48, padding: '20px 0', borderTop: '1px solid rgba(0,0,0,0.05)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontSize: '0.75rem', color: 'var(--on-surface-tertiary)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            padding: '2px 8px', background: 'var(--status-opportunity-bg)',
            borderRadius: 'var(--radius-full)', fontWeight: 600, color: 'var(--primary)', fontSize: '0.625rem',
          }}>FB</span>
          <span className="label-sm">Find Blue v1.0</span>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          <a href="#">개인정보 처리방침</a>
          <a href="#">이용약관</a>
        </div>
        <span>© 2025 Find Blue. 데이터 기반 비즈니스 파트너.</span>
      </div>
    </div>
  );
}
