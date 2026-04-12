/* ── Types for Find Blue data models ── */

export interface MismatchReport {
  guName: string;
  dongName: string;
  districtCode: string;
  mismatchScore: number;
  zoneType: '기회 지역' | '균형 지역' | '상업 과밀' | '활발 상권';
  totalConsumptionAmt: number;
  totalResidentialPop: number;
  totalFloatingPop: number;
  totalWorkingPop: number;
  totalVisitingPop: number;
  consumptionPerResident: number;
  visitorResidentRatio: number;
  avgIncome: number;
  avgAptPrice: number;
  transportGrade: string;
  nearbyStationCnt: number;
  avgLivingScore: number;
  aptComplexCnt: number;
  opportunityLabel: string;
  aiInsight: string;
  coffeeShare: number;
  foodShare: number;
  medicalShare: number;
  clothingShare: number;
  entertainmentShare: number;
  districtGeom?: object;
}

export interface SummaryMetrics {
  totalDongs: number;
  opportunityZones: number;
  saturatedZones: number;
  balancedZones: number;
  avgStations: number;
  avgLivingScore: number;
}

export interface TrendData {
  region: string;
  month: string;
  score: number;
}

export interface ConsumptionTrend {
  month: string;
  consumption: number;
  floatingPop: number;
}

export interface TelecomDemand {
  month: string;
  guName: string;
  totalContracts: number;
  totalOpens: number;
  bundleContracts: number;
  standaloneContracts: number;
  avgSales: number;
}

export interface RentalTrend {
  month: string;
  mainCategory: string;
  contractCount: number;
  openCount: number;
  avgSales: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface AIReportData {
  dongLabel: string;
  guName: string;
  dongName: string;
  districtCode: string;
  score: number;
  zoneType: string;
  consumption: number;
  resPop: number;
  floatPop: number;
  workPop: number;
  visitPop: number;
  income: number;
  aptPrice: number;
  cpr: number;
  vrr: number;
  transport: string;
  stations: number;
  living: number;
  fbPct: number;
  coffeePct: number;
  medPct: number;
  entPct: number;
}

export interface BusinessType {
  key: string;
  label: string;
  description: string;
  examples: string;
  filter: string;
  sort: string;
}
