import { MismatchReport, SummaryMetrics, TrendData, ConsumptionTrend, TelecomDemand, ChatMessage } from './types';

/* ── Summary Metrics ── */
export const mockSummary: SummaryMetrics = {
  totalDongs: 118,
  opportunityZones: 32,
  saturatedZones: 18,
  balancedZones: 68,
  avgStations: 3.2,
  avgLivingScore: 7.4,
};

/* ── Mismatch Report (sample 20 entries) ── */
export const mockMismatchData: MismatchReport[] = [
  { guName: '서초구', dongName: '반포동', districtCode: '11650101', mismatchScore: -1.82, zoneType: '기회 지역', totalConsumptionAmt: 2850000000, totalResidentialPop: 18500, totalFloatingPop: 6200, totalWorkingPop: 3100, totalVisitingPop: 2800, consumptionPerResident: 154054, visitorResidentRatio: 0.34, avgIncome: 62000, avgAptPrice: 285000, transportGrade: '역세권', nearbyStationCnt: 4, avgLivingScore: 8.9, aptComplexCnt: 35, opportunityLabel: '소비 부족형', aiInsight: '고소득 주거 밀집 지역이지만 카페·음식점 소비는 인근 강남역 상권으로 유출. 프리미엄 F&B, 디저트 카페 등 지역 밀착형 매장 진입 유리.', coffeeShare: 0.08, foodShare: 0.18, medicalShare: 0.07, clothingShare: 0.04, entertainmentShare: 0.02, },
  { guName: '서초구', dongName: '잠원동', districtCode: '11650102', mismatchScore: -1.55, zoneType: '기회 지역', totalConsumptionAmt: 1920000000, totalResidentialPop: 14200, totalFloatingPop: 4800, totalWorkingPop: 2200, totalVisitingPop: 1900, consumptionPerResident: 135211, visitorResidentRatio: 0.34, avgIncome: 58000, avgAptPrice: 260000, transportGrade: '역세권', nearbyStationCnt: 3, avgLivingScore: 8.5, aptComplexCnt: 28, opportunityLabel: '소비 부족형', aiInsight: '한강 인접 고급 주거지. 주말 브런치, 베이커리 등 라이프스타일 매장 수요 높음.', coffeeShare: 0.09, foodShare: 0.19, medicalShare: 0.06, clothingShare: 0.05, entertainmentShare: 0.03, },
  { guName: '서초구', dongName: '서초동', districtCode: '11650103', mismatchScore: -1.12, zoneType: '기회 지역', totalConsumptionAmt: 3450000000, totalResidentialPop: 22800, totalFloatingPop: 8900, totalWorkingPop: 5600, totalVisitingPop: 4200, consumptionPerResident: 151316, visitorResidentRatio: 0.39, avgIncome: 55000, avgAptPrice: 220000, transportGrade: '역세권', nearbyStationCnt: 5, avgLivingScore: 8.1, aptComplexCnt: 42, opportunityLabel: '균형 접근형', aiInsight: '법원, 검찰청 인접 법조 타운. 점심 수요 높지만 저녁·주말 매출 기회 존재.', coffeeShare: 0.11, foodShare: 0.22, medicalShare: 0.08, clothingShare: 0.06, entertainmentShare: 0.03, },
  { guName: '영등포구', dongName: '문래동', districtCode: '11560201', mismatchScore: -1.45, zoneType: '기회 지역', totalConsumptionAmt: 1580000000, totalResidentialPop: 12000, totalFloatingPop: 9200, totalWorkingPop: 6800, totalVisitingPop: 4500, consumptionPerResident: 131667, visitorResidentRatio: 0.77, avgIncome: 38000, avgAptPrice: 89000, transportGrade: '역세권', nearbyStationCnt: 2, avgLivingScore: 6.8, aptComplexCnt: 15, opportunityLabel: '유입 대비 소비 부족', aiInsight: '문래 창작촌 효과로 유동인구 증가 추세. 독립 카페, 갤러리카페, 수제맥주집 등 문화 소비 매장 적합.', coffeeShare: 0.07, foodShare: 0.16, medicalShare: 0.05, clothingShare: 0.03, entertainmentShare: 0.04, },
  { guName: '영등포구', dongName: '당산동', districtCode: '11560202', mismatchScore: -0.98, zoneType: '기회 지역', totalConsumptionAmt: 2100000000, totalResidentialPop: 16500, totalFloatingPop: 11200, totalWorkingPop: 7800, totalVisitingPop: 5100, consumptionPerResident: 127273, visitorResidentRatio: 0.68, avgIncome: 41000, avgAptPrice: 105000, transportGrade: '역세권', nearbyStationCnt: 3, avgLivingScore: 7.2, aptComplexCnt: 22, opportunityLabel: '소비 부족형', aiInsight: '2호선·9호선 더블역세권. 직장인 수요 높지만 프랜차이즈 위주로 독립 매장 진입 여지.', coffeeShare: 0.12, foodShare: 0.21, medicalShare: 0.07, clothingShare: 0.05, entertainmentShare: 0.03, },
  { guName: '영등포구', dongName: '양평동', districtCode: '11560203', mismatchScore: -1.68, zoneType: '기회 지역', totalConsumptionAmt: 890000000, totalResidentialPop: 8900, totalFloatingPop: 3200, totalWorkingPop: 4100, totalVisitingPop: 1800, consumptionPerResident: 100000, visitorResidentRatio: 0.36, avgIncome: 35000, avgAptPrice: 72000, transportGrade: '준역세권', nearbyStationCnt: 1, avgLivingScore: 6.2, aptComplexCnt: 12, opportunityLabel: '소비 사각지대', aiInsight: '재개발 기대 지역. 현재 상권 공동화 상태이나 향후 가치 상승 잠재력 높음.', coffeeShare: 0.06, foodShare: 0.14, medicalShare: 0.04, clothingShare: 0.02, entertainmentShare: 0.02, },
  { guName: '중구', dongName: '을지로동', districtCode: '11140301', mismatchScore: 2.85, zoneType: '상업 과밀', totalConsumptionAmt: 18500000000, totalResidentialPop: 3200, totalFloatingPop: 85000, totalWorkingPop: 42000, totalVisitingPop: 38000, consumptionPerResident: 5781250, visitorResidentRatio: 26.56, avgIncome: 45000, avgAptPrice: 150000, transportGrade: '역세권', nearbyStationCnt: 8, avgLivingScore: 5.5, aptComplexCnt: 3, opportunityLabel: '상업 과밀', aiInsight: '을지로 힙 상권 과열. 임대료 급등 중이며 폐업률도 높아 신규 진입 시 주의 필요.', coffeeShare: 0.18, foodShare: 0.35, medicalShare: 0.03, clothingShare: 0.08, entertainmentShare: 0.12, },
  { guName: '중구', dongName: '명동', districtCode: '11140302', mismatchScore: 3.42, zoneType: '상업 과밀', totalConsumptionAmt: 42000000000, totalResidentialPop: 1800, totalFloatingPop: 120000, totalWorkingPop: 15000, totalVisitingPop: 95000, consumptionPerResident: 23333333, visitorResidentRatio: 66.67, avgIncome: 48000, avgAptPrice: 180000, transportGrade: '역세권', nearbyStationCnt: 6, avgLivingScore: 4.2, aptComplexCnt: 1, opportunityLabel: '관광 상업지', aiInsight: '관광객 의존도 극히 높음. 경기·환율 민감. K-뷰티 편집샵 외 차별화 어려움.', coffeeShare: 0.15, foodShare: 0.28, medicalShare: 0.02, clothingShare: 0.18, entertainmentShare: 0.08, },
  { guName: '중구', dongName: '필동', districtCode: '11140303', mismatchScore: -0.72, zoneType: '기회 지역', totalConsumptionAmt: 1200000000, totalResidentialPop: 6800, totalFloatingPop: 4500, totalWorkingPop: 2900, totalVisitingPop: 2100, consumptionPerResident: 176471, visitorResidentRatio: 0.66, avgIncome: 42000, avgAptPrice: 135000, transportGrade: '준역세권', nearbyStationCnt: 2, avgLivingScore: 6.5, aptComplexCnt: 8, opportunityLabel: '소비 부족형', aiInsight: '남산 인접 주거지. 관광 동선에서 벗어나 있어 로컬 맛집, 생활 편의 매장 수요 존재.', coffeeShare: 0.09, foodShare: 0.20, medicalShare: 0.06, clothingShare: 0.04, entertainmentShare: 0.03, },
  { guName: '서초구', dongName: '양재동', districtCode: '11650104', mismatchScore: -0.45, zoneType: '균형 지역', totalConsumptionAmt: 4200000000, totalResidentialPop: 19200, totalFloatingPop: 15800, totalWorkingPop: 11200, totalVisitingPop: 8500, consumptionPerResident: 218750, visitorResidentRatio: 0.82, avgIncome: 52000, avgAptPrice: 195000, transportGrade: '역세권', nearbyStationCnt: 4, avgLivingScore: 7.8, aptComplexCnt: 30, opportunityLabel: '균형', aiInsight: 'IT 기업 밀집 + 주거 균형. 점심 매출 안정적이나 저녁 소비 확대 여지 있음.', coffeeShare: 0.13, foodShare: 0.24, medicalShare: 0.08, clothingShare: 0.06, entertainmentShare: 0.04, },
  { guName: '영등포구', dongName: '여의도동', districtCode: '11560204', mismatchScore: 1.85, zoneType: '상업 과밀', totalConsumptionAmt: 15200000000, totalResidentialPop: 28000, totalFloatingPop: 95000, totalWorkingPop: 72000, totalVisitingPop: 18000, consumptionPerResident: 542857, visitorResidentRatio: 3.39, avgIncome: 65000, avgAptPrice: 310000, transportGrade: '역세권', nearbyStationCnt: 5, avgLivingScore: 8.2, aptComplexCnt: 18, opportunityLabel: '상업 과밀', aiInsight: '금융 중심지. 점심 시간 과밀이나 주말·저녁 매출은 급감. 주중 전용 테이크아웃 컨셉 유리.', coffeeShare: 0.16, foodShare: 0.30, medicalShare: 0.05, clothingShare: 0.07, entertainmentShare: 0.06, },
  { guName: '서초구', dongName: '내곡동', districtCode: '11650105', mismatchScore: -1.95, zoneType: '기회 지역', totalConsumptionAmt: 620000000, totalResidentialPop: 9500, totalFloatingPop: 2100, totalWorkingPop: 1500, totalVisitingPop: 800, consumptionPerResident: 65263, visitorResidentRatio: 0.22, avgIncome: 48000, avgAptPrice: 165000, transportGrade: '도보권', nearbyStationCnt: 0, avgLivingScore: 7.1, aptComplexCnt: 20, opportunityLabel: '상권 공동화', aiInsight: '신규 아파트 입주 활발하나 상가 인프라 극히 부족. 편의점, 세탁소, 미용실 등 생활밀착형 매장 기회.', coffeeShare: 0.04, foodShare: 0.10, medicalShare: 0.03, clothingShare: 0.02, entertainmentShare: 0.01, },
  { guName: '중구', dongName: '신당동', districtCode: '11140304', mismatchScore: -0.35, zoneType: '균형 지역', totalConsumptionAmt: 2800000000, totalResidentialPop: 15600, totalFloatingPop: 12800, totalWorkingPop: 5400, totalVisitingPop: 6200, consumptionPerResident: 179487, visitorResidentRatio: 0.82, avgIncome: 37000, avgAptPrice: 78000, transportGrade: '역세권', nearbyStationCnt: 3, avgLivingScore: 6.4, aptComplexCnt: 18, opportunityLabel: '균형', aiInsight: '떡볶이 타운 특수 상권. 관광+로컬 복합 수요. 디저트·음료 매장 병행 시 시너지.', coffeeShare: 0.10, foodShare: 0.28, medicalShare: 0.06, clothingShare: 0.04, entertainmentShare: 0.05, },
  { guName: '영등포구', dongName: '신길동', districtCode: '11560205', mismatchScore: -1.22, zoneType: '기회 지역', totalConsumptionAmt: 1650000000, totalResidentialPop: 21500, totalFloatingPop: 5800, totalWorkingPop: 3200, totalVisitingPop: 2400, consumptionPerResident: 76744, visitorResidentRatio: 0.27, avgIncome: 33000, avgAptPrice: 62000, transportGrade: '역세권', nearbyStationCnt: 2, avgLivingScore: 6.0, aptComplexCnt: 25, opportunityLabel: '소비 부족형', aiInsight: '대규모 주거단지 대비 상가 부족. 배달전문점, 반찬가게, 생활 편의 매장 수요 높음.', coffeeShare: 0.07, foodShare: 0.17, medicalShare: 0.05, clothingShare: 0.03, entertainmentShare: 0.03, },
  { guName: '서초구', dongName: '방배동', districtCode: '11650106', mismatchScore: -0.88, zoneType: '기회 지역', totalConsumptionAmt: 2100000000, totalResidentialPop: 24500, totalFloatingPop: 7200, totalWorkingPop: 3800, totalVisitingPop: 3100, consumptionPerResident: 85714, visitorResidentRatio: 0.29, avgIncome: 49000, avgAptPrice: 175000, transportGrade: '역세권', nearbyStationCnt: 3, avgLivingScore: 7.6, aptComplexCnt: 32, opportunityLabel: '소비 부족형', aiInsight: '카페골목 형성 시작. 아직 상권 초기 단계로 독립 카페, 베이커리 진입 적기.', coffeeShare: 0.10, foodShare: 0.20, medicalShare: 0.07, clothingShare: 0.05, entertainmentShare: 0.03, },
  { guName: '중구', dongName: '충무로동', districtCode: '11140305', mismatchScore: 1.25, zoneType: '상업 과밀', totalConsumptionAmt: 8500000000, totalResidentialPop: 4200, totalFloatingPop: 35000, totalWorkingPop: 12000, totalVisitingPop: 22000, consumptionPerResident: 2023810, visitorResidentRatio: 8.33, avgIncome: 40000, avgAptPrice: 125000, transportGrade: '역세권', nearbyStationCnt: 4, avgLivingScore: 5.8, aptComplexCnt: 5, opportunityLabel: '관광 과밀', aiInsight: '인쇄소 골목 + 관광 상권 혼재. 임대료 대비 매출 효율 확인 필수.', coffeeShare: 0.14, foodShare: 0.32, medicalShare: 0.04, clothingShare: 0.07, entertainmentShare: 0.06, },
  { guName: '영등포구', dongName: '대림동', districtCode: '11560206', mismatchScore: 0.15, zoneType: '균형 지역', totalConsumptionAmt: 3500000000, totalResidentialPop: 32000, totalFloatingPop: 28000, totalWorkingPop: 8500, totalVisitingPop: 18000, consumptionPerResident: 109375, visitorResidentRatio: 0.88, avgIncome: 29000, avgAptPrice: 52000, transportGrade: '역세권', nearbyStationCnt: 2, avgLivingScore: 5.5, aptComplexCnt: 14, opportunityLabel: '균형', aiInsight: '다문화 특수 상권. 중국 음식·식료품점 밀집. 차별화된 코워킹, 교육 매장 여지.', coffeeShare: 0.08, foodShare: 0.32, medicalShare: 0.06, clothingShare: 0.09, entertainmentShare: 0.07, },
  { guName: '서초구', dongName: '우면동', districtCode: '11650107', mismatchScore: -2.15, zoneType: '기회 지역', totalConsumptionAmt: 420000000, totalResidentialPop: 6200, totalFloatingPop: 1800, totalWorkingPop: 8500, totalVisitingPop: 600, consumptionPerResident: 67742, visitorResidentRatio: 0.29, avgIncome: 55000, avgAptPrice: 195000, transportGrade: '도보권', nearbyStationCnt: 0, avgLivingScore: 7.0, aptComplexCnt: 10, opportunityLabel: '상권 공동화', aiInsight: 'R&D 센터 밀집. 직장인 점심 수요 높지만 매장 매우 부족. 도시락·테이크아웃 강력 추천.', coffeeShare: 0.03, foodShare: 0.08, medicalShare: 0.02, clothingShare: 0.01, entertainmentShare: 0.01, },
  { guName: '중구', dongName: '장충동', districtCode: '11140306', mismatchScore: -0.58, zoneType: '기회 지역', totalConsumptionAmt: 1850000000, totalResidentialPop: 8900, totalFloatingPop: 6500, totalWorkingPop: 3200, totalVisitingPop: 4800, consumptionPerResident: 207865, visitorResidentRatio: 0.73, avgIncome: 44000, avgAptPrice: 142000, transportGrade: '준역세권', nearbyStationCnt: 2, avgLivingScore: 6.9, aptComplexCnt: 12, opportunityLabel: '소비 부족형', aiInsight: '족발골목 특화 + 호텔 관광 수요. 주거지 확대 시 생활 편의 매장 수요 증가 전망.', coffeeShare: 0.08, foodShare: 0.25, medicalShare: 0.05, clothingShare: 0.04, entertainmentShare: 0.04, },
  { guName: '영등포구', dongName: '도림동', districtCode: '11560207', mismatchScore: -0.92, zoneType: '기회 지역', totalConsumptionAmt: 980000000, totalResidentialPop: 11200, totalFloatingPop: 3800, totalWorkingPop: 2100, totalVisitingPop: 1500, consumptionPerResident: 87500, visitorResidentRatio: 0.34, avgIncome: 31000, avgAptPrice: 55000, transportGrade: '준역세권', nearbyStationCnt: 1, avgLivingScore: 5.8, aptComplexCnt: 16, opportunityLabel: '소비 부족형', aiInsight: '소규모 주거 밀집 지역. 편의점, 분식집 등 가성비 매장 수요. 저렴한 임대료 장점.', coffeeShare: 0.06, foodShare: 0.15, medicalShare: 0.04, clothingShare: 0.03, entertainmentShare: 0.02, },
];

/* ── Trend Data ── */
export const mockTrendData: TrendData[] = [
  { region: '서초구 반포동', month: '2024-07', score: -1.45 },
  { region: '서초구 반포동', month: '2024-08', score: -1.52 },
  { region: '서초구 반포동', month: '2024-09', score: -1.61 },
  { region: '서초구 반포동', month: '2024-10', score: -1.72 },
  { region: '서초구 반포동', month: '2024-11', score: -1.78 },
  { region: '서초구 반포동', month: '2024-12', score: -1.82 },
  { region: '영등포구 문래동', month: '2024-07', score: -0.95 },
  { region: '영등포구 문래동', month: '2024-08', score: -1.05 },
  { region: '영등포구 문래동', month: '2024-09', score: -1.15 },
  { region: '영등포구 문래동', month: '2024-10', score: -1.28 },
  { region: '영등포구 문래동', month: '2024-11', score: -1.35 },
  { region: '영등포구 문래동', month: '2024-12', score: -1.45 },
  { region: '중구 을지로동', month: '2024-07', score: 2.12 },
  { region: '중구 을지로동', month: '2024-08', score: 2.35 },
  { region: '중구 을지로동', month: '2024-09', score: 2.48 },
  { region: '중구 을지로동', month: '2024-10', score: 2.62 },
  { region: '중구 을지로동', month: '2024-11', score: 2.75 },
  { region: '중구 을지로동', month: '2024-12', score: 2.85 },
];

/* ── Consumption Trend ── */
export const mockConsumptionTrend: ConsumptionTrend[] = [
  { month: '2024-07', consumption: 265, floatingPop: 6800 },
  { month: '2024-08', consumption: 278, floatingPop: 6500 },
  { month: '2024-09', consumption: 285, floatingPop: 6350 },
  { month: '2024-10', consumption: 272, floatingPop: 6200 },
  { month: '2024-11', consumption: 290, floatingPop: 6100 },
  { month: '2024-12', consumption: 285, floatingPop: 6200 },
];

/* ── Telecom Demand ── */
export const mockTelecomData: TelecomDemand[] = [
  { month: '2024-07', guName: '서초구', totalContracts: 1250, totalOpens: 890, bundleContracts: 780, standaloneContracts: 470, avgSales: 45000 },
  { month: '2024-08', guName: '서초구', totalContracts: 1180, totalOpens: 850, bundleContracts: 740, standaloneContracts: 440, avgSales: 44000 },
  { month: '2024-09', guName: '서초구', totalContracts: 1320, totalOpens: 920, bundleContracts: 820, standaloneContracts: 500, avgSales: 46000 },
  { month: '2024-10', guName: '서초구', totalContracts: 1280, totalOpens: 900, bundleContracts: 800, standaloneContracts: 480, avgSales: 45500 },
  { month: '2024-11', guName: '서초구', totalContracts: 1350, totalOpens: 950, bundleContracts: 850, standaloneContracts: 500, avgSales: 47000 },
  { month: '2024-12', guName: '서초구', totalContracts: 1400, totalOpens: 980, bundleContracts: 880, standaloneContracts: 520, avgSales: 48000 },
  { month: '2024-07', guName: '영등포구', totalContracts: 1580, totalOpens: 1120, bundleContracts: 920, standaloneContracts: 660, avgSales: 42000 },
  { month: '2024-08', guName: '영등포구', totalContracts: 1520, totalOpens: 1080, bundleContracts: 890, standaloneContracts: 630, avgSales: 41500 },
  { month: '2024-09', guName: '영등포구', totalContracts: 1650, totalOpens: 1180, bundleContracts: 960, standaloneContracts: 690, avgSales: 43000 },
  { month: '2024-10', guName: '영등포구', totalContracts: 1620, totalOpens: 1150, bundleContracts: 940, standaloneContracts: 680, avgSales: 42500 },
  { month: '2024-11', guName: '영등포구', totalContracts: 1700, totalOpens: 1200, bundleContracts: 990, standaloneContracts: 710, avgSales: 44000 },
  { month: '2024-12', guName: '영등포구', totalContracts: 1750, totalOpens: 1250, bundleContracts: 1020, standaloneContracts: 730, avgSales: 45000 },
  { month: '2024-07', guName: '중구', totalContracts: 890, totalOpens: 620, bundleContracts: 480, standaloneContracts: 410, avgSales: 38000 },
  { month: '2024-08', guName: '중구', totalContracts: 850, totalOpens: 590, bundleContracts: 460, standaloneContracts: 390, avgSales: 37500 },
  { month: '2024-09', guName: '중구', totalContracts: 920, totalOpens: 650, bundleContracts: 500, standaloneContracts: 420, avgSales: 39000 },
  { month: '2024-10', guName: '중구', totalContracts: 900, totalOpens: 630, bundleContracts: 490, standaloneContracts: 410, avgSales: 38500 },
  { month: '2024-11', guName: '중구', totalContracts: 950, totalOpens: 670, bundleContracts: 520, standaloneContracts: 430, avgSales: 40000 },
  { month: '2024-12', guName: '중구', totalContracts: 980, totalOpens: 700, bundleContracts: 540, standaloneContracts: 440, avgSales: 41000 },
];

/* ── Business Types ── */
export const businessTypes = [
  { key: 'all', label: '전체', description: '미스매치 점수 높은 순으로 모든 기회 지역을 보여줍니다.', examples: '' },
  { key: 'cafe', label: '카페/커피숍', description: '교통접근성(20%)과 유동인구(15%)가 높고 카페 점포당 매출이 우수한 상권', examples: '스타벅스, 투썸, 메가커피, 개인 카페, 디저트 카페' },
  { key: 'restaurant', label: '음식점/식당', description: '거주인구(20%)가 풍부하고 식당 점포당 매출(25%)이 높은 외식 수요 집중 지역', examples: '한식당, 분식, 중식, 일식, 배달전문점' },
  { key: 'premium', label: '프리미엄/고급 매장', description: '소득 및 자산(30%) 수준이 압도적으로 높은 고구매력 잠재 상권', examples: '수입 브랜드, 고급 레스토랑, 와인바, 프리미엄 베이커리' },
  { key: 'daily', label: '생활밀착형', description: '거주인구(30%)와 가족 밀집도(25%)가 매우 높아 생활 편의 수요가 풍부한 곳', examples: '편의점, 세탁소, 미용실, 반찬가게, 문구점' },
  { key: 'medical', label: '의료/건강', description: '거주인구(20%)와 가족 밀집도(15%)가 높아 병의원 등 의료 점포당 매출이 높은 지역', examples: '내과/치과/피부과, 약국, 헬스장, 필라테스' },
  { key: 'fashion', label: '패션/의류', description: '소득 수준(25%)과 교통 접근성(20%)이 우수하여 패션 매장 수요가 높은 지역', examples: 'SPA브랜드, 편집샵, 스포츠의류, 아동복' },
  { key: 'entertainment', label: '오락/여가', description: '거주인구(25%) 및 가족 단위 수요(20%) 중심의 여가 상권', examples: '노래방, 볼링장, PC방, 보드게임카페, 키즈카페' },
  { key: 'accommodation', label: '숙박', description: '유동인구(25%) 비율과 교통 접근성(20%)이 뛰어나 숙박 수요가 집중되는 곳', examples: '호텔, 모텔, 게스트하우스, 레지던스' },
  { key: 'realestate', label: '부동산 투자', description: '시세 저렴 + 미스매치 점수 높은 가치 상승 잠재 지역', examples: '소형 상가, 1층 점포, 오피스텔, 공유오피스' },
];

/* ── Mock Chat Messages ── */
export const mockChatMessages: ChatMessage[] = [
  {
    role: 'assistant',
    content: '안녕하세요! Find Blue AI 상권 분석 챗봇입니다. 서울시 서초구, 영등포구, 중구의 상권 데이터에 대해 자유롭게 질문하세요.',
    timestamp: '10:42 AM',
  },
];

/* ── District GU averages for overview chart ── */
export const mockGuAverages = [
  { gu: '서초구', avgScore: -1.12 },
  { gu: '영등포구', avgScore: -0.68 },
  { gu: '중구', avgScore: 0.85 },
];

/* ── Zone distribution ── */
export const mockZoneDistribution = [
  { gu: '서초구', zone: '기회 지역', count: 15 },
  { gu: '서초구', zone: '균형 지역', count: 8 },
  { gu: '서초구', zone: '상업 과밀', count: 2 },
  { gu: '영등포구', zone: '기회 지역', count: 12 },
  { gu: '영등포구', zone: '균형 지역', count: 10 },
  { gu: '영등포구', zone: '상업 과밀', count: 5 },
  { gu: '중구', zone: '기회 지역', count: 5 },
  { gu: '중구', zone: '균형 지역', count: 50 },
  { gu: '중구', zone: '상업 과밀', count: 11 },
];
