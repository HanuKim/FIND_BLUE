import { NextResponse } from 'next/server';
import { query, isSnowflakeConfigured } from '@/lib/snowflake';
import { generateScoringReport, type AnalysisFormData, type DongData } from '@/lib/scoring';

export async function POST(request: Request) {
  const form: AnalysisFormData = await request.json();

  if (!form.region) {
    return NextResponse.json({ error: 'region is required' }, { status: 400 });
  }

  let dongData: DongData | undefined;

  // Fetch dong data from Snowflake if available
  if (isSnowflakeConfigured() && form.districtCode) {
    try {
      const rows = await query(`
        SELECT 
          ROUND(S.TRUE_MISMATCH_SCORE, 1) AS MISMATCH_SCORE,
          ROUND(S.SCORE_CAFE, 1) AS SCORE_CAFE,
          ROUND(S.SCORE_FOOD, 1) AS SCORE_FOOD,
          ROUND(S.SCORE_PREMIUM, 1) AS SCORE_PREMIUM,
          ROUND(S.SCORE_DAILY, 1) AS SCORE_DAILY,
          ROUND(S.SCORE_MEDICAL, 1) AS SCORE_MEDICAL,
          ROUND(S.SCORE_FASHION, 1) AS SCORE_FASHION,
          ROUND(S.SCORE_LEISURE, 1) AS SCORE_LEISURE,
          ROUND(S.SCORE_ACCOMMODATION, 1) AS SCORE_ACCOMMODATION,
          COALESCE(ROUND(L.TOTAL_RESIDENTIAL_POP,0),0) AS RES_POP,
          COALESCE(ROUND(L.TOTAL_FLOATING_POP,0),0) AS FLOAT_POP,
          COALESCE(ROUND(L.AVG_INCOME,0),0) AS INCOME,
          COALESCE(ROUND(L.CONSUMPTION_PER_RESIDENT,0),0) AS CPR,
          COALESCE(L.TRANSPORT_GRADE,'') AS TRANSPORT,
          COALESCE(L.NEARBY_STATION_CNT,0) AS STATIONS,
          COALESCE(ROUND(L.AVG_LIVING_SCORE,1),0) AS LIVING,
          L.ZONE_TYPE,
          COALESCE(p.DIRECTION, '안정') AS PREDICTION_DIRECTION,
          COALESCE(i.BEST_INDUSTRY_KR, '카페') AS BEST_INDUSTRY,
          COALESCE(i.SUITABILITY_LABEL, '보통') AS SUITABILITY_LABEL
        FROM URBAN_MISMATCH_AI.ANALYTICS.LATEST_MISMATCH_REPORT L
        LEFT JOIN URBAN_MISMATCH_AI.ANALYTICS.SUPPLY_DEMAND_MISMATCH S
          ON L.GU_NAME = S.GU_NAME AND L.DONG_NAME = S.DONG_NAME
        LEFT JOIN URBAN_MISMATCH_AI.ANALYTICS.MISMATCH_PREDICTIONS p ON L.DISTRICT_CODE = p.DISTRICT_CODE
        LEFT JOIN URBAN_MISMATCH_AI.ANALYTICS.INDUSTRY_PREDICTIONS i ON L.DISTRICT_CODE = i.DISTRICT_CODE
        WHERE L.DISTRICT_CODE = ?
      `, [form.districtCode]);

      if (rows.length > 0) {
        const d = rows[0] as Record<string, number | string>;

        let activeScore = Number(d.MISMATCH_SCORE);
        const biz = form.businessType;
        if (biz.includes('카페')) activeScore = Number(d.SCORE_CAFE);
        else if (biz.includes('음식')) activeScore = Number(d.SCORE_FOOD);
        else if (biz.includes('프리미엄')) activeScore = Number(d.SCORE_PREMIUM);
        else if (biz.includes('생활')) activeScore = Number(d.SCORE_DAILY);
        else if (biz.includes('의료')) activeScore = Number(d.SCORE_MEDICAL);
        else if (biz.includes('패션')) activeScore = Number(d.SCORE_FASHION);
        else if (biz.includes('여가') || biz.includes('오락')) activeScore = Number(d.SCORE_LEISURE);
        else if (biz.includes('숙박')) activeScore = Number(d.SCORE_ACCOMMODATION);

        dongData = {
          resPop: Number(d.RES_POP),
          floatPop: Number(d.FLOAT_POP),
          score: activeScore,
          transport: String(d.TRANSPORT),
          living: Number(d.LIVING),
          income: Number(d.INCOME),
          cpr: Number(d.CPR),
          stations: Number(d.STATIONS),
          predictionDirection: String(d.PREDICTION_DIRECTION),
          bestIndustry: String(d.BEST_INDUSTRY),
          suitability: String(d.SUITABILITY_LABEL),
        };
      }
    } catch (err) {
      console.error('[API /ai-report] Dong data fetch error:', err);
    }
  }

  // Generate scoring report
  const scoringReport = generateScoringReport(form, dongData);

  // Generate Cortex AI analysis if Snowflake configured
  let aiText: string | null = null;
  if (isSnowflakeConfigured() && dongData) {
    try {
      const userInfoLines: string[] = [`사용자 유형: ${form.userType}`, `업종: ${form.businessType}`, `판매품목: ${form.product || '미입력'}`];
      if (form.avgUnitPrice > 0) userInfoLines.push(`객단가: ${form.avgUnitPrice.toLocaleString()}원`);
      if (form.monthlyRevenue > 0) userInfoLines.push(`월매출: ${form.monthlyRevenue.toLocaleString()}원`);
      if (form.monthlyRent > 0) userInfoLines.push(`월세: ${form.monthlyRent.toLocaleString()}원`);
      if (form.employeeCount) userInfoLines.push(`직원수: ${form.employeeCount}명`);
      if (form.operatingHours) userInfoLines.push(`영업시간: ${form.operatingHours}`);
      if (form.additionalInfo) userInfoLines.push(`추가정보: ${form.additionalInfo}`);

      const prompt = `당신은 20년 이상 경력의 서울시 상권 분석 및 창업 컨설팅 전문가입니다. 아래 데이터와 ML 모델의 예측 결과를 종합하여 실제 컨설팅 보고서 수준의 상세한 분석 리포트를 한국어로 작성하세요.

=== 지역 데이터 (Marketplace 7종) ===
지역: ${form.region}
미스매치 점수: ${dongData.score} (${dongData.score >= 70 ? '기회/블루오션' : dongData.score >= 40 ? '균형' : '과밀/레드오션'})
거주인구: ${dongData.resPop.toLocaleString()}명 | 유동인구: ${dongData.floatPop.toLocaleString()}명
평균소득: ${dongData.income.toLocaleString()}만원 | 주민당소비: ${dongData.cpr.toLocaleString()}원
교통: ${dongData.transport} (인접역 ${dongData.stations}개)
주거점수: ${dongData.living}점

=== AI 예측 결과 ===
3개월 후 전망: ${dongData.predictionDirection || '안정'}
AI 추천 업종: ${dongData.bestIndustry || '검토 중'}
창업 적합도: ${dongData.suitability || '보통'}
※ 점포당매출이 높으면 수요 > 공급으로 진입 기회가 큽니다.

=== 사용자 정보 ===
${userInfoLines.join('\n')}

=== 보고서 형식 ===
## 1. 지역 종합 진단 (데이터 근거 제시)
## 2. 핵심 기회 요인 (ML 예측 포함 3개)
## 3. 리스크 요인 및 대응 전략 (2-3개)
## 4. 수익성 시뮬레이션 (매출-비용-순이익)
## 5. 향후 6개월-1년 전망 (ML 추세 반영)
## 6. 수익 개선 전략 TOP 5
## 7. 종합 투자 매력도 (5점 만점)`;

      const escapedPrompt = prompt.replace(/'/g, "''");
      const result = await query(
        `SELECT SNOWFLAKE.CORTEX.COMPLETE('mistral-large2', '${escapedPrompt}') AS REPORT`
      );
      aiText = (result[0] as Record<string, unknown>).REPORT as string;
    } catch (err) {
      console.error('[API /ai-report] Cortex AI error:', err);
    }
  }

  return NextResponse.json({ scoringReport, aiText, dongData });
}
