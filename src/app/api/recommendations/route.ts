import { NextResponse } from 'next/server';
import { query, isSnowflakeConfigured } from '@/lib/snowflake';
import { transformKeys } from '@/lib/api';
import { mockMismatchData, businessTypes } from '@/lib/mock-data';

const filterMap: Record<string, { filter: string; sort: string }> = {
  all:            { filter: '',                                              sort: 'TRUE_MISMATCH_SCORE DESC' },
  cafe:           { filter: '',                                              sort: 'SCORE_CAFE DESC' },
  restaurant:     { filter: '',                                              sort: 'SCORE_FOOD DESC' },
  premium:        { filter: '',                                              sort: 'SCORE_PREMIUM DESC' },
  daily:          { filter: '',                                              sort: 'SCORE_DAILY DESC' },
  medical:        { filter: '',                                              sort: 'SCORE_MEDICAL DESC' },
  fashion:        { filter: '',                                              sort: 'SCORE_FASHION DESC' },
  entertainment:  { filter: '',                                              sort: 'SCORE_LEISURE DESC' },
  realestate:     { filter: 'AND AVG_APT_PRICE IS NOT NULL',                 sort: 'TRUE_MISMATCH_SCORE DESC' },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bizType = searchParams.get('type') || 'all';

  if (isSnowflakeConfigured()) {
    try {
      const { filter, sort } = filterMap[bizType] || filterMap.all;

      const rawRecommendations = await query(`
        SELECT s.GU_NAME, s.DONG_NAME,
          ROUND(s.TRUE_MISMATCH_SCORE, 1) AS MISMATCH_SCORE,
          s.TRUE_OPPORTUNITY_LABEL AS ZONE_TYPE,
          COALESCE(ROUND(s.SCORE_CAFE, 1), 0) AS SCORE_CAFE,
          COALESCE(ROUND(s.SCORE_FOOD, 1), 0) AS SCORE_FOOD,
          COALESCE(ROUND(s.SCORE_PREMIUM, 1), 0) AS SCORE_PREMIUM,
          COALESCE(ROUND(s.SCORE_DAILY, 1), 0) AS SCORE_DAILY,
          COALESCE(ROUND(s.SCORE_MEDICAL, 1), 0) AS SCORE_MEDICAL,
          COALESCE(ROUND(s.SCORE_FASHION, 1), 0) AS SCORE_FASHION,
          COALESCE(ROUND(s.SCORE_LEISURE, 1), 0) AS SCORE_LEISURE,
          COALESCE(ROUND(s.SCORE_ACCOMMODATION, 1), 0) AS SCORE_ACCOMMODATION,
          COALESCE(s.AI_INSIGHT, '') AS AI_INSIGHT,
          COALESCE(ROUND(s.AVG_INCOME, 0), 0) AS AVG_INCOME,
          COALESCE(ROUND(s.TOTAL_RESIDENTIAL_POP, 0), 0) AS TOTAL_RESIDENTIAL_POP,
          COALESCE(ROUND(s.TOTAL_FLOATING_POP, 0), 0) AS TOTAL_FLOATING_POP,
          COALESCE(ROUND(s.CONSUMPTION_PER_RESIDENT, 0), 0) AS CONSUMPTION_PER_RESIDENT,
          COALESCE(ROUND(s.AVG_APT_PRICE, 0), 0) AS AVG_APT_PRICE,
          COALESCE(s.TRANSPORT_GRADE, '') AS TRANSPORT_GRADE,
          COALESCE(s.AVG_LIVING_SCORE, 0) AS AVG_LIVING_SCORE,
          s.TRUE_OPPORTUNITY_LABEL AS OPPORTUNITY_LABEL,
          COALESCE(ROUND(s.TOTAL_STORES, 0), 0) AS TOTAL_STORES,
          COALESCE(ROUND(s.FOOD_STORES, 0), 0) AS FOOD_STORES,
          COALESCE(ROUND(s.COFFEE_STORES, 0), 0) AS COFFEE_STORES,
          COALESCE(ROUND(s.FOOD_REVENUE_PER_STORE, 0), 0) AS FOOD_REVENUE_PER_STORE,
          COALESCE(ROUND(s.COFFEE_REVENUE_PER_STORE, 0), 0) AS COFFEE_REVENUE_PER_STORE,
          COALESCE(ROUND(s.RESIDENTS_PER_STORE, 1), 0) AS RESIDENTS_PER_STORE,
          COALESCE(p.DIRECTION, '안정') AS PREDICTION_DIRECTION,
          COALESCE(p.PREDICTED_MISMATCH_3M, s.TRUE_MISMATCH_SCORE) AS PREDICTION_SCORE_3M
        FROM URBAN_MISMATCH_AI.ANALYTICS.SUPPLY_DEMAND_MISMATCH s
        LEFT JOIN URBAN_MISMATCH_AI.ANALYTICS.MISMATCH_PREDICTIONS p ON s.DISTRICT_CODE = p.DISTRICT_CODE
        WHERE 1=1 ${filter}
        ORDER BY s.${sort}
        LIMIT 10
      `);

      const rawRisk = await query(`
        SELECT s.GU_NAME, s.DONG_NAME,
          ROUND(s.TRUE_MISMATCH_SCORE, 1) AS MISMATCH_SCORE,
          s.TRUE_OPPORTUNITY_LABEL AS ZONE_TYPE,
          s.AI_INSIGHT, s.TRANSPORT_GRADE, s.TRUE_OPPORTUNITY_LABEL AS OPPORTUNITY_LABEL,
          COALESCE(ROUND(s.TOTAL_STORES, 0), 0) AS TOTAL_STORES,
          COALESCE(p.DIRECTION, '안정') AS PREDICTION_DIRECTION
        FROM URBAN_MISMATCH_AI.ANALYTICS.SUPPLY_DEMAND_MISMATCH s
        LEFT JOIN URBAN_MISMATCH_AI.ANALYTICS.MISMATCH_PREDICTIONS p ON s.DISTRICT_CODE = p.DISTRICT_CODE
        WHERE s.TRUE_MISMATCH_SCORE < 40
        ORDER BY s.TRUE_MISMATCH_SCORE ASC
        LIMIT 10
      `);

      return NextResponse.json({
        businessTypes,
        selected: bizType,
        recommendations: transformKeys(rawRecommendations),
        riskZones: transformKeys(rawRisk),
      });
    } catch (error) {
      console.error('[API /recommendations] Snowflake error:', error);
      return NextResponse.json({ error: 'Failed', detail: String(error) }, { status: 500 });
    }
  }

  const filtered = mockMismatchData.filter(d => d.mismatchScore < 0).sort((a, b) => a.mismatchScore - b.mismatchScore).slice(0, 10);
  return NextResponse.json({
    businessTypes,
    selected: bizType,
    recommendations: filtered,
    riskZones: mockMismatchData.filter(d => d.mismatchScore > 1),
  });
}
