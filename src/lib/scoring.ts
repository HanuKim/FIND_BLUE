/**
 * Scoring Engine — 12-item / 100-point evaluation system
 * Ported from streamlit_app.py scoring functions
 */

export interface ScoringItem {
  name: string;
  max: number;
  score: number;
  summary: string;
  desc: string;
}

export interface ScoringCategory {
  name: string;
  max: number;
  score: number;
  items: ScoringItem[];
}

export interface ScoringReport {
  userType: string;
  region: string;
  businessType: string;
  product: string;
  avgUnitPrice: number;
  monthlyRevenue: number;
  monthlyRent: number;
  categories: ScoringCategory[];
  totalScore: number;
  totalMax: number;
}

export interface DongData {
  resPop: number;
  floatPop: number;
  score: number;
  transport: string;
  living: number;
  income: number;
  cpr: number;
  stations: number;
  predictionDirection?: string;
  bestIndustry?: string;
  suitability?: string;
}

export interface AnalysisFormData {
  userType: string;
  region: string;
  districtCode: string;
  businessType: string;
  product: string;
  avgUnitPrice: number;
  monthlyRevenue: number;
  monthlyRent: number;
  employeeCount?: number;
  operatingHours?: string;
  initialInvestment?: number;
  targetRevenue?: number;
  competitorCount?: number;
  additionalInfo?: string;
}

function getGrade(score: number, max: number): string {
  const pct = max > 0 ? (score / max) * 100 : 0;
  if (pct >= 90) return 'A+';
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B+';
  if (pct >= 60) return 'B';
  if (pct >= 50) return 'C';
  if (pct >= 40) return 'D';
  return 'F';
}

export { getGrade };

function calcRentRatioScore(monthlyRevenue: number, monthlyRent: number): [number, string, string] {
  if (!monthlyRevenue || monthlyRevenue === 0) {
    return [0, '매출 정보 미입력', '임대료 비율을 산출할 수 없습니다.'];
  }
  const ratio = (monthlyRent / monthlyRevenue) * 100;
  if (ratio <= 5)
    return [10, `임대료 비율 ${ratio.toFixed(1)}%`, `월매출 ${monthlyRevenue.toLocaleString()}원 대비 월세 ${monthlyRent.toLocaleString()}원으로, 임대료 비율이 ${ratio.toFixed(1)}%입니다. 일반적으로 외식업 기준 10% 이하가 우수한 수준이며, 현재 매우 안정적인 구조입니다.`];
  if (ratio <= 10)
    return [8, `임대료 비율 ${ratio.toFixed(1)}%`, `임대료 비율 ${ratio.toFixed(1)}%는 업계 권장 범위(10% 이하) 내에 있습니다. 안정적인 비용 구조이나, 매출 하락 시 15%를 넘지 않도록 관리가 필요합니다.`];
  if (ratio <= 15)
    return [6, `임대료 비율 ${ratio.toFixed(1)}%`, `임대료 비율 ${ratio.toFixed(1)}%는 보통 수준입니다. 매출이 현 수준을 유지해야 안정적이며, 10% 이하로 낮추기 위해 매출 ${Math.round(monthlyRent / 0.10).toLocaleString()}원 이상 달성이 권장됩니다.`];
  if (ratio <= 20)
    return [4, `임대료 비율 ${ratio.toFixed(1)}%`, `임대료 비율 ${ratio.toFixed(1)}%는 경고 수준입니다. 인건비·재료비를 합산하면 손익분기 달성이 어려울 수 있습니다. 임대료 재협상 또는 매출 증대 전략이 시급합니다.`];
  return [2, `임대료 비율 ${ratio.toFixed(1)}%`, `임대료 비율 ${ratio.toFixed(1)}%는 매우 위험한 수준입니다. 업계 평균(10-15%)을 크게 초과하며, 매출 대비 고정비 부담이 과중합니다.`];
}

function calcUnitPriceScore(avgUnitPrice: number, businessType: string): [number, string, string] {
  if (!avgUnitPrice || avgUnitPrice === 0)
    return [0, '객단가 미입력', '객단가 정보가 없어 평가할 수 없습니다.'];
  const benchmarks: Record<string, [number, number]> = {
    '음식점': [10000, 25000], '카페': [5000, 12000], '소매업': [15000, 50000],
    '서비스업': [20000, 80000], '미용/뷰티': [15000, 40000], '기타': [10000, 30000],
  };
  const [low, high] = benchmarks[businessType] || [10000, 30000];
  if (low <= avgUnitPrice && avgUnitPrice <= high)
    return [8, `객단가 ${avgUnitPrice.toLocaleString()}원 (적정)`, `객단가 ${avgUnitPrice.toLocaleString()}원은 ${businessType} 업종 평균 범위(${low.toLocaleString()}~${high.toLocaleString()}원) 내에 위치합니다. 가격 저항 없이 고객 확보가 가능한 구간입니다.`];
  if (avgUnitPrice < low)
    return [4, `객단가 ${avgUnitPrice.toLocaleString()}원 (낮음)`, `객단가 ${avgUnitPrice.toLocaleString()}원은 업종 평균 하한(${low.toLocaleString()}원)보다 낮습니다. 프리미엄 메뉴 추가 또는 점진적 인상을 검토하세요.`];
  return [6, `객단가 ${avgUnitPrice.toLocaleString()}원 (높음)`, `객단가 ${avgUnitPrice.toLocaleString()}원은 업종 평균 상한(${high.toLocaleString()}원)을 초과합니다. 프리미엄 포지셔닝이 가능하나, 수용 가능 고객층 확인이 필요합니다.`];
}

function calcBreakevenScore(monthlyRevenue: number, monthlyRent: number): [number, string, string] {
  if (!monthlyRevenue || !monthlyRent || monthlyRent === 0)
    return [0, '데이터 부족', '손익분기 분석에 필요한 매출 또는 임대료 정보가 부족합니다.'];
  const estimatedCost = monthlyRent * 3.2;
  const ratio = monthlyRevenue / estimatedCost;
  if (ratio >= 1.5)
    return [7, `매출/비용 ${ratio.toFixed(1)}배`, `월매출(${monthlyRevenue.toLocaleString()}원)이 예상 총비용(${Math.round(estimatedCost).toLocaleString()}원) 대비 ${ratio.toFixed(1)}배로 안정적입니다. 월 예상 순이익 약 ${(monthlyRevenue - estimatedCost).toLocaleString()}원.`];
  if (ratio >= 1.0)
    return [5, `매출/비용 ${ratio.toFixed(1)}배`, `매출이 예상 비용과 근접(${ratio.toFixed(1)}배)하여 손익분기선에 있습니다. 매출 ${Math.round(estimatedCost * 1.3).toLocaleString()}원 이상 시 안정권 진입.`];
  return [2, `매출/비용 ${ratio.toFixed(1)}배`, `월매출(${monthlyRevenue.toLocaleString()}원)이 예상 비용(${Math.round(estimatedCost).toLocaleString()}원)에 미달하여 월 약 ${Math.round(estimatedCost - monthlyRevenue).toLocaleString()}원 적자 예상. 매출 증대 또는 비용 구조 개선이 시급합니다.`];
}

export function generateScoringReport(
  form: AnalysisFormData,
  dongData?: DongData
): ScoringReport {
  const report: ScoringReport = {
    userType: form.userType,
    region: form.region,
    businessType: form.businessType,
    product: form.product,
    avgUnitPrice: form.avgUnitPrice || 0,
    monthlyRevenue: form.monthlyRevenue || 0,
    monthlyRent: form.monthlyRent || 0,
    categories: [],
    totalScore: 0,
    totalMax: 100,
  };

  const hasDong = !!dongData;
  const resPop = dongData?.resPop || 0;
  const floatPop = dongData?.floatPop || 0;
  const scoreVal = dongData?.score || 0;
  const transport = dongData?.transport || '';
  const living = dongData?.living || 50;
  const stations = dongData?.stations || 0;

  // ── 1. 입지 분석 (25점) ──
  let popScore: number, popSummary: string, popDetail: string;
  if (hasDong) {
    popScore = Math.min(10, Math.max(2, Math.floor(resPop / 800)));
    popSummary = `거주인구 ${resPop.toLocaleString()}명, 유동인구 ${floatPop.toLocaleString()}명`;
    popDetail = `${form.region}의 거주인구는 ${resPop.toLocaleString()}명, 유동인구는 ${floatPop.toLocaleString()}명입니다. ` +
      (resPop > 0 && floatPop / resPop > 1.5
        ? `유동인구가 거주인구의 ${(floatPop / resPop).toFixed(1)}배로 외부 유입이 활발합니다.`
        : resPop > 3000
          ? '거주인구 기반 상권으로 안정적인 단골 고객 확보가 가능합니다.'
          : '인구 규모가 제한적이므로 특화된 콘셉트로 고객을 유치하는 전략이 필요합니다.');
  } else {
    popScore = 5; popSummary = '데이터 기반 추정'; popDetail = '지역 데이터 연동 시 정밀 분석이 가능합니다.';
  }

  const transportMap: Record<string, [number, string]> = { '역세권': [8, '역세권'], '준역세권': [6, '준역세권'], '도보권': [4, '도보권'] };
  const matchedTransport = Object.entries(transportMap).find(([key]) => transport.includes(key));
  const [tScore, tLabel] = matchedTransport ? matchedTransport[1] : [4, transport || '미확인'];
  const tDetail = `교통등급 '${tLabel}', 인접역 ${stations}개. ` +
    (tScore >= 7 ? '대중교통 접근성이 우수하여 넓은 범위에서 고객 유입이 가능합니다.' :
      tScore >= 5 ? '대중교통 접근성이 보통이므로 주차 편의성 확보 또는 배달 서비스 강화가 도움됩니다.' :
        '대중교통이 불편한 입지로, 주차 공간 확보가 필수적입니다.');

  const parkingScore = Math.min(7, Math.max(2, Math.floor(living / 14)));
  const parkingDetail = `주거환경 점수 ${living}점 기반 평가. ` +
    (parkingScore >= 5 ? '주거 인프라가 잘 갖춰진 지역으로 주차장·도로 접근성이 양호합니다.' : '주거 인프라 수준을 고려할 때 주차 편의성에 제약이 있을 수 있습니다.');

  const cat1: ScoringCategory = {
    name: '입지 분석', max: 25,
    score: popScore + tScore + parkingScore,
    items: [
      { name: '유동인구 밀도', max: 10, score: popScore, summary: popSummary, desc: popDetail },
      { name: '대중교통 접근성', max: 8, score: tScore, summary: `${tLabel} (역 ${stations}개)`, desc: tDetail },
      { name: '주차 편의성', max: 7, score: parkingScore, summary: `주거점수 ${living}점`, desc: parkingDetail },
    ],
  };

  // ── 2. 상권 경쟁력 (25점) ──
  let compScore: number, compLabel: string, compDetail: string;
  if (hasDong) {
    if (scoreVal >= 75) { compScore = 10; compLabel = '매우 낮음 (블루오션)'; }
    else if (scoreVal >= 60) { compScore = 8; compLabel = '경쟁 낮음 (기회 지역)'; }
    else if (scoreVal >= 40) { compScore = 6; compLabel = '경쟁 보통 (균형 지역)'; }
    else if (scoreVal >= 20) { compScore = 4; compLabel = '경쟁 있음 (레드오션)'; }
    else { compScore = 2; compLabel = '경쟁 과열 (상업 과밀)'; }
    compDetail = `미스매치 점수 ${scoreVal}점으로 '${compLabel}' 판정. ` +
      (compScore >= 8 ? '동종 업종 밀집도가 매우 낮아 선점 효과와 시장 장악력이 높을 것으로 예상됩니다.' :
        compScore >= 6 ? '적정 수준의 경쟁이 존재하며, 차별화된 콘셉트와 서비스 품질로 경쟁 우위 확보가 가능합니다.' :
          '기존 점포들이 이미 상당수 진입한 레드오션입니다. 매우 강력한 경쟁 우위가 없는 한 진입에 주의가 필요합니다.');
    if (form.competitorCount && form.competitorCount > 0)
      compDetail += ` 사용자 입력 기준 인근 경쟁 매장 ${form.competitorCount}개.`;
  } else {
    compScore = 5; compLabel = '추정'; compDetail = '지역 데이터 연동 시 경쟁 강도를 정밀 평가합니다.';
  }

  const growthScore = (!hasDong || scoreVal < 0.5) ? 6 : 4;
  const growthDetail = growthScore >= 6
    ? '소비 증가 추세가 감지되는 성장형 상권입니다.'
    : '상권이 성숙기에 접어들어 기존 고객 유지가 중요한 시기입니다.';

  const householdScore = hasDong ? Math.min(7, Math.max(3, Math.floor(resPop / 1200))) : 4;
  const householdDetail = `배후 거주인구 ${resPop.toLocaleString()}명. ` +
    (resPop >= 3000 ? '3천명 이상의 거주 인구가 안정적 기본 수요를 제공합니다.' :
      hasDong ? '거주 인구가 제한적이므로 유동인구·직장인 고객까지 타겟을 확장해야 합니다.' : '지역 데이터 연동 시 정밀 분석이 가능합니다.');

  const cat2: ScoringCategory = {
    name: '상권 경쟁력', max: 25,
    score: compScore + growthScore + householdScore,
    items: [
      { name: '동종업종 경쟁강도', max: 10, score: compScore, summary: compLabel, desc: compDetail },
      { name: '상권 성장률', max: 8, score: growthScore, summary: growthScore >= 6 ? '성장형' : '성숙형', desc: growthDetail },
      { name: '배후 세대수', max: 7, score: householdScore, summary: hasDong ? `${resPop.toLocaleString()}명` : '미확인', desc: householdDetail },
    ],
  };

  // ── 3. 수익성 분석 (25점) ──
  const [priceScore, priceSummary, priceDetail] = calcUnitPriceScore(form.avgUnitPrice, form.businessType);
  const [rentScore, rentSummary, rentDetail] = calcRentRatioScore(form.monthlyRevenue, form.monthlyRent);
  const [bepScore, bepSummary, bepDetail] = calcBreakevenScore(form.monthlyRevenue, form.monthlyRent);

  const cat3: ScoringCategory = {
    name: '수익성 분석', max: 25,
    score: priceScore + rentScore + bepScore,
    items: [
      { name: '객단가 적정성', max: 8, score: priceScore, summary: priceSummary, desc: priceDetail },
      { name: '월매출 대비 임대료 비율', max: 10, score: rentScore, summary: rentSummary, desc: rentDetail },
      { name: '손익분기 달성 가능성', max: 7, score: bepScore, summary: bepSummary, desc: bepDetail },
    ],
  };

  // ── 4. 사업 안정성 (25점) ──
  const trendScore = 6;
  const trendDetail = `${form.businessType} 업종은 ` +
    (['카페', '음식점'].includes(form.businessType) ? '최근 건강·웰빙 트렌드와 맞물려 수요가 꾸준합니다.' :
      ['미용/뷰티', '서비스업'].includes(form.businessType) ? '생활 필수 서비스로 경기 변동에 비교적 강한 편입니다.' :
        '시장 트렌드를 지속적으로 모니터링하며 상품 구성을 조정해야 합니다.');

  let closureScore: number;
  if (hasDong) {
    closureScore = scoreVal >= 70 ? 10 : scoreVal >= 55 ? 8 : scoreVal >= 40 ? 6 : scoreVal >= 20 ? 4 : 2;
  } else { closureScore = 5; }
  const closureDetail = closureScore >= 8
    ? '주변 상권의 수요 대비 공급이 부족한 블루오션으로 점포당 매출이 높고 폐업 리스크가 매우 낮습니다.'
    : closureScore >= 6
      ? '안정적인 균형 상권으로 평균 수준의 생존율이 예상됩니다.'
      : '이미 공급이 과포화된 레드오션 상권으로 폐업 리스크가 높습니다. 신규 진입 시 치밀한 준비가 필요합니다.';

  const fixedCostScore = (form.monthlyRent && form.monthlyRevenue && form.monthlyRent < form.monthlyRevenue * 0.15) ? 5 :
    (form.monthlyRent && form.monthlyRevenue) ? 3 : 0;
  const fcDetail = (form.monthlyRent && form.monthlyRevenue)
    ? `월 고정비(임대료 ${form.monthlyRent.toLocaleString()}원) 대비 ` +
    (fixedCostScore >= 5 ? '매출 규모가 안정적입니다.' : '매출 대비 고정비 부담이 큽니다.')
    : '매출·임대료 정보 입력 시 상세 분석이 가능합니다.';

  const cat4: ScoringCategory = {
    name: '사업 안정성', max: 25,
    score: trendScore + closureScore + fixedCostScore,
    items: [
      { name: '업종 트렌드 적합성', max: 8, score: trendScore, summary: form.businessType, desc: trendDetail },
      { name: '폐업률 분석', max: 10, score: closureScore, summary: closureScore >= 7 ? '낮음' : closureScore >= 5 ? '보통' : '주의', desc: closureDetail },
      { name: '고정비 부담률', max: 7, score: fixedCostScore, summary: fixedCostScore >= 5 ? '안정' : fixedCostScore > 0 ? '부담' : '미입력', desc: fcDetail },
    ],
  };

  report.categories = [cat1, cat2, cat3, cat4];
  report.totalScore = report.categories.reduce((s, c) => s + c.score, 0);
  return report;
}
