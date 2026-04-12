'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './Landing.module.css';
import { Search } from 'lucide-react';

export default function HeroBanner() {
  const router = useRouter();
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = () => {
    router.push(`/dashboard/map-analysis${searchValue ? `?q=${encodeURIComponent(searchValue)}` : ''}`);
  };

  return (
    <section className={styles.hero}>
      {/* Background video — sized to content */}
      <div className={styles.heroVideo}>
        <video
          src="/main.mp4"
          autoPlay
          loop
          muted
          playsInline
          style={{ width: '100%', display: 'contain' }}
        />
      </div>

      {/* Overlay content */}
      <div className={styles.heroOverlay}>
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeIcon}>✦</span>
            데이터 기반의 비즈니스 파트너
          </div>

          <h1 className={styles.heroTitle}>
            <img src="/logo.png" alt="logo" height={80} />
            <br />
            7가지 데이터의 미스매치를 기반으로
            <br />
            시장의 블루오션을 찾다
          </h1>

          <p className={styles.heroSubtitle}>
            업종별 특성을 고려한 종합적인 데이터 분석을 바탕으로
            <br />
            최적의 비즈니스 입지를 조언합니다.
          </p>

          <div className={styles.heroSearch}>
            <Search className={styles.heroSearchIcon} size={24} strokeWidth={1.5} />
            <input
              type="text"
              placeholder="지역명을 입력하세요 (예: 서초구, 방배동...)"
              className={styles.heroSearchInput}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.8125rem' }} onClick={handleSearch}>
              지도 검색
            </button>
          </div>

          <div className={styles.heroCtas}>
            <a href="/dashboard" className="btn-primary">
              분석 시작하기
            </a>
            <a href="/dashboard/map-analysis" className="btn-secondary">
              지도 보기
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
