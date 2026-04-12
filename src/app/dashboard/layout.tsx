'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import styles from '@/components/dashboard/Dashboard.module.css';

const headerLinks = [
  { href: '/', label: '홈' },
  { href: '/dashboard', label: '대시보드', exact: true },
  { href: '/dashboard/guide', label: '이용 가이드' },
];

import { LayoutDashboard, Map as MapIcon, BarChart3, TrendingUp, Crosshair, Sparkles, FolderOpen, Monitor } from 'lucide-react';

const sidebarItems = [
  { href: '/dashboard', icon: <LayoutDashboard size={18} />, label: '대시보드 홈' },
  { href: '/dashboard/map-analysis', icon: <MapIcon size={18} />, label: '지도 분석' },
  { href: '/dashboard/demand', icon: <BarChart3 size={18} />, label: '통신/렌탈 수요' },
  { href: '/dashboard/trends', icon: <TrendingUp size={18} />, label: '미스매치 추이' },
  { href: '/dashboard/recommendations', icon: <Crosshair size={18} />, label: '입지 추천' },
  { href: '/dashboard/ai-report', icon: <Sparkles size={18} />, label: 'AI 리포트' },
  { href: '/dashboard/history', icon: <FolderOpen size={18} />, label: '분석 내역' },
  { href: '/dashboard/monitoring', icon: <Monitor size={18} />, label: '모니터링' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className={styles.dashboardLayout}>
      {/* Navbar — logo left, 3 menus center, profile right */}
      <nav className={styles.navbar}>
        <Link href="/" className={styles.navLogo}>
          <Image src="/logo.png" alt="Find Blue" width={120} height={32} style={{ objectFit: 'contain' }} priority />
        </Link>
        <ul className={styles.navLinks}>
          {headerLinks.map((link) => {
            const isActive = link.href === '/'
              ? pathname === '/'
              : link.href === '/dashboard'
                ? pathname.startsWith('/dashboard') && !pathname.startsWith('/dashboard/guide')
                : pathname.startsWith(link.href);

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
        <div className={styles.navRight}>
          <div className={styles.navAvatar}>HK</div>
        </div>
      </nav>

      {/* Sidebar - Hide on guide page */}
      {!pathname.startsWith('/dashboard/guide') && (
        <aside className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <div className={styles.sidebarTitle}>대시보드</div>
          </div>
          <nav className={styles.sidebarNav}>
            {sidebarItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.sidebarItem} ${item.href === '/dashboard'
                  ? pathname === '/dashboard' ? styles.sidebarItemActive : ''
                  : pathname.startsWith(item.href) ? styles.sidebarItemActive : ''
                  }`}
              >
                <span className={styles.sidebarIcon}>{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
          <div className={styles.sidebarStatus}>
            <div className={styles.sidebarStatusLabel}>시스템 상태</div>
            <div className={styles.sidebarStatusText}>분석 커버리지: 75%</div>
            <div className={styles.sidebarStatusBar}>
              <div className={styles.sidebarStatusBarFill} />
            </div>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <main
        className={styles.mainContent}
        style={pathname.startsWith('/dashboard/guide') ? { marginLeft: 0 } : {}}
      >
        {children}
      </main>
    </div>
  );
}
