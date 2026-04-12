'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import HeroBanner from '@/components/landing/HeroBanner';
import styles from '@/components/landing/Landing.module.css';
import { Map, Sparkles, BarChart2, TrendingUp, TrendingDown, Zap, CreditCard, Users, Wallet, Home as HomeIcon, Train, Truck, MapPin, GlassesIcon, LucideGlassWater, SearchCheck, BadgeX, Phone } from 'lucide-react';

export default function Home() {
  return (
    <div className="landing-scroll">
      {/* ── Navigation — 좌측 로고, 중앙 3메뉴, 우측 프로필 ── */}
      <nav className={styles.landingNav}>
        <Link href="/" className={styles.navLogo}>
          <Image src="/logo.png" alt="Find Blue" width={120} height={32} style={{ objectFit: 'contain' }} priority />
        </Link>
        <ul className={styles.navLinks}>
          <li><Link href="/" className={styles.navLinkActive}>홈</Link></li>
          <li><Link href="/dashboard">대시보드</Link></li>
          <li><Link href="/dashboard/guide">이용 가이드</Link></li>
        </ul>
        <div className={styles.navRight}>
          <div className={styles.navAvatar}>HK</div>
        </div>
      </nav>

      {/* ── Hero Banner ── */}
      <HeroBanner />

      {/* ── Feature Cards ── */}
      <section className={styles.features}>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><SearchCheck size={24} strokeWidth={1.5} /></div>
            <div className={styles.featureTitle}>미스매치 분석</div>
            <div className={styles.featureDesc}>
              데이터들을 정밀하게 매핑하여 데이터 간의 미스매치를 발견하고, 블루오션을 찾아냅니다.
            </div>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><Sparkles size={24} strokeWidth={1.5} /></div>
            <div className={styles.featureTitle}>AI 인사이트</div>
            <div className={styles.featureDesc}>
              7종의 데이터(소비, 유동인구, 소득, 부동산, 교통, 이사, 경쟁업체)를 분석하고 AI 기반 리포트를 생성합니다.
            </div>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}><BarChart2 size={24} strokeWidth={1.5} /></div>
            <div className={styles.featureTitle}>업종별 추천</div>
            <div className={styles.featureDesc}>
              업종 특성에 맞춤화된 창업 추천과 투자 가치 분석 리포트를 제공합니다.
            </div>
          </div>
        </div>
      </section>

      {/* ── 블루오션 시각화 ── */}
      <section className={styles.visualize}>
        <div className={styles.visualizeInner}>
          <div>
            <div className={styles.visualizeLabel}>시각화된 데이터</div>
            <h2 className={styles.visualizeTitle}>블루오션을 발견하세요</h2>
            <p className={styles.visualizeDesc}>
              업종, 상권, 인구통계, 유동인구, 경쟁 밀도를 정밀하게 매핑하여 <br></br>
              시각화된 데이터를 제공합니다.
            </p>
            <div className={styles.visualizeChecks}>
              <div className={styles.visualizeCheck}>
                <span>◆</span> 인구 특성, 소비, 유동인구, 교통 입지 등 7가지 데이터 기반 스마트한 분석
              </div>
              <div className={styles.visualizeCheck}>
                <span>◆</span> 업종별 맞춤화된 창업 추천과 AI 기반 심층 분석 리포트 제공
              </div>
              <div className={styles.visualizeCheck}>
                <span>◆</span> 정적인 데이터를 넘어, 동적인 변화와 추이를 제공
              </div>
            </div>
          </div>
          <div className={styles.visualizeImage}>
            <div className={styles.mapPreview}><img src="/info.png" alt="Map" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
          </div>
        </div>
      </section>

      {/* ── AI 분석 리포트 ── */}
      <section className={styles.aiReport}>
        <div className={styles.aiReportInner}>
          <div className={styles.aiReportCard}>
            <div className={styles.aiReportCardHeader}>
              <div>
                <div className={styles.aiReportLabel}>AI 상권 리포트 · 서초구</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                  서초구 서초동 · 미스매치 리포트
                </div>
              </div>
              <div className={styles.aiReportBadge}>97% 적합</div>
            </div>
            <div className={styles.aiReportStats}>
              <div className={styles.aiStatItem}>
                <span className={styles.aiStatLabel}>점수</span>
                <span className={styles.aiStatValue} style={{ color: '#4ade80' }}>95</span>
                <span className={styles.aiStatSub}>기회 지역</span>
              </div>
              <div className={styles.aiStatItem}>
                <span className={styles.aiStatLabel}>위험도</span>
                <span className={styles.aiStatValue}>낮음</span>
                <span className={styles.aiStatSub}>안정적 투자</span>
              </div>
              <div className={styles.aiStatItem}>
                <span className={styles.aiStatLabel}>거주인구</span>
                <span className={styles.aiStatValue}>18,500</span>
              </div>
              <div className={styles.aiStatItem}>
                <span className={styles.aiStatLabel}>주민당소비</span>
                <span className={styles.aiStatValue}>154K</span>
              </div>
            </div>
          </div>
          <div className={styles.aiReportRight}>
            <div className={styles.aiReportRightLabel}>심층 분석</div>
            <h2 className={styles.visualizeTitle}>AI 기반 분석 리포트</h2>
            <p className={styles.visualizeDesc}>
              심층적인 데이터 분석을 바탕으로 Snowflake Cortex AI가 <br></br>종합적인 분석 보고서를 생성합니다.
              <br></br>리스크 평가, 업종 추천, 경쟁 분석까지 하나의 리포트로 확인하세요.
            </p>
          </div>
        </div>
      </section>

      {/* ── 폐업 원인 ── */}
      <section className={styles.whyFail}>
        <div>
          <h2 className={styles.whyFailTitle}>자영업, 왜 실패할까요?</h2>
          <p className={styles.whyFailSubtitle}>
            자영업자의 1년 이내 폐업률은 22%에 달합니다. <br></br>
            이는 대부분의 창업자가 레드오션인 상권에 진입하거나 직감에 의존하기 때문입니다.
          </p>
          <div className={styles.whyFailGrid}>
            <div className={styles.whyFailCard}>
              <div className={styles.whyFailIcon}><MapPin size={30} strokeWidth={1.5} /></div>
              <div className={styles.whyFailCardTitle}>직감에 의한 입지 선정</div>
              <p className={styles.whyFailCardDesc}>
                &ldquo;느낌이 좋은&rdquo; 곳에 오픈하지만, 실제로 수요가 있거나 <br></br>경쟁이 적은 곳인지 확인하지 못합니다.
              </p>
            </div>
            <div className={styles.whyFailCard}>
              <div className={styles.whyFailIcon}><BadgeX size={30} strokeWidth={1.5} /></div>
              <div className={styles.whyFailCardTitle}>실질 데이터의 부재</div>
              <p className={styles.whyFailCardDesc}>
                다양한 도시 데이터가 존재하지만 실시간으로 통합해 <br></br>실질적인 인사이트로 바꿔주는 서비스가 없었습니다.
              </p>
            </div>
            <div className={styles.whyFailCard}>
              <div className={styles.whyFailIcon}><TrendingUp size={30} strokeWidth={1.5} /></div>
              <div className={styles.whyFailCardTitle}>상권의 변동 파악 불가</div>
              <p className={styles.whyFailCardDesc}>
                인구 변동, 소비 트렌드, 경쟁 환경 등 상권의 변화를 <br></br>
                실시간으로 파악하지 못하여 변화에 대비하지 못합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 데이터 기반 의사결정 ── */}
      <section className={styles.dataDriven}>
        <div className={styles.dataDrivenInner}>
          <h2 className={styles.dataDrivenTitle}>데이터 기반 의사결정</h2>
          <p className={styles.dataDrivenDesc}>
            객관적인 데이터와 사용자의 여건 등을 바탕으로 최적의 의사결정을 지원합니다.
          </p>
          <div className={styles.dataDrivenIcons}>
            {[
              { icon: <CreditCard size={28} strokeWidth={1.5} color='#007ddcff' />, label: '소비' },
              { icon: <Users size={28} strokeWidth={1.5} color='orange' />, label: '유동인구' },
              { icon: <Wallet size={28} strokeWidth={1.5} color='green' />, label: '소득' },
              { icon: <HomeIcon size={28} strokeWidth={1.5} color='purple' />, label: '부동산' },
              { icon: <Train size={28} strokeWidth={1.5} color='#0053dc' />, label: '교통' },
              { icon: <Phone size={28} strokeWidth={1.5} color='#dc00d1ff' />, label: '통신/렌탈' },
            ].map((item) => (
              <div key={item.label} className={styles.dataIcon}>
                <div className={styles.dataIconCircle}>{item.icon}</div>
                <span className={styles.dataIconLabel}>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 핵심 기능 ── */}
      <section className={styles.toolkit}>
        <div className={styles.toolkitInner}>
          <div className={styles.toolkitLabel}>핵심 기능</div>
          <h2 className={styles.toolkitTitle}>성공적인 창업을 위한 모든 것</h2>
          <div className={styles.toolkitGrid}>
            {[
              {
                icon: <Map size={24} strokeWidth={2} />,
                title: '지도에서 블루오션 찾기',
                desc: '7가지 데이터를 기반으로 지역별 수요, 유동인구, 경쟁 밀도를 지도 위에서 확인합니다.',
              },
              {
                icon: <Sparkles size={24} strokeWidth={2} />,
                title: 'AI 분석 리포트',
                desc: 'Cortex AI가 실시간으로 사용자의 입력 정보와 데이터를 기반으로 심층 분석 보고서를 생성합니다.',
              },
              {
                icon: <BarChart2 size={24} strokeWidth={2} />,
                title: '업종별 추천',
                desc: '다양한 업종 카테고리를 기반으로 데이터 기반 추천을 제공합니다.',
              },
              {
                icon: <TrendingUp size={24} strokeWidth={2} />,
                title: '현황 분석',
                desc: '사용자가 분석했던 지역의 미스매치 점수 추이를 추적하여 시장 변동을 선제적으로 파악합니다.',
              },
            ].map((item) => (
              <div key={item.title} className={styles.toolkitCard}>
                <div className={styles.toolkitCardIcon}>{item.icon}</div>
                <div className={styles.toolkitCardTitle}>{item.title}</div>
                <p className={styles.toolkitCardDesc}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.cta}>
        <h2 className={styles.ctaTitle}>
          나만의 <span style={{ color: '#1c72cdff', fontWeight: '900' }}>블루오션</span>을
          <br />
          찾아보세요
        </h2>
        <p className={styles.ctaSubtitle}>
          희망 업종, 예산, 상권의 특성을 입력하고 <br></br>
          데이터 기반의 최적의 입지를 찾아보세요.
        </p>
        <a href="/dashboard/ai-report" className="btn-primary" style={{ padding: '14px 36px', fontSize: '1rem' }}>
          지금 시작하기
        </a>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div>
            <div className={styles.footerBrand}><img src="/logo.png" alt="logo" height={30} /></div>
            <p className={styles.footerBrandDesc}>
              데이터 기반의 스마트한 창업 파트너
            </p>
          </div>
          <div>
            <div className={styles.footerColTitle}>서비스</div>
            <ul className={styles.footerLinks}>
              <li><a href="/dashboard/map-analysis">지도 분석</a></li>
              <li><a href="/dashboard/ai-report">AI 리포트</a></li>
              <li><a href="/dashboard/trends">미스매치 추이</a></li>
              <li><a href="/dashboard/recommendations">업종별 추천</a></li>
            </ul>
          </div>
          <div>
            <div className={styles.footerColTitle}>회사 소개</div>
            <ul className={styles.footerLinks}>
              <li><a href="#">소개</a></li>
              <li><a href="#">채용</a></li>
              <li><a href="#">뉴스룸</a></li>
            </ul>
          </div>
          <div>
            <div className={styles.footerColTitle}>뉴스레터</div>
            <p className={styles.footerBrandDesc} style={{ marginBottom: 16 }}>
              정기적인 데이터 인사이트를 받아보세요.
            </p>
            <div className={styles.footerNewsletter}>
              <input
                type="email"
                placeholder="이메일 주소"
                className={styles.footerNewsletterInput}
              />
              <button className={styles.footerNewsletterBtn}>→</button>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <span className={styles.footerCopy}>© 2025 Find Blue. All rights reserved.</span>
          <div className={styles.footerLegal}>
            <a href="#">개인정보 처리방침</a>
            <a href="#">이용약관</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
