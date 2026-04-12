import { NextResponse } from 'next/server';
import { query, isSnowflakeConfigured } from '@/lib/snowflake';
import { transformKeys } from '@/lib/api';
import { mockMismatchData, mockSummary, mockGuAverages, mockZoneDistribution } from '@/lib/mock-data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const gu = searchParams.get('gu');

  if (isSnowflakeConfigured()) {
    try {
      const summaryRows = await query(`
        SELECT COUNT(*) AS T,
          SUM(CASE WHEN TRUE_OPPORTUNITY_LABEL='높은 기회' THEN 1 ELSE 0 END) AS O,
          SUM(CASE WHEN TRUE_OPPORTUNITY_LABEL='공급 과밀' THEN 1 ELSE 0 END) AS V,
          SUM(CASE WHEN TRUE_OPPORTUNITY_LABEL='보통' THEN 1 ELSE 0 END) AS B,
          ROUND(AVG(TOTAL_STORES),0) AS AVG_STORES,
          ROUND(AVG(TRUE_MISMATCH_SCORE),1) AS AVG_SCORE
        FROM URBAN_MISMATCH_AI.ANALYTICS.SUPPLY_DEMAND_MISMATCH
      `);

      const forecastRows = await query(`
        SELECT 
          SUM(CASE WHEN DIRECTION = '하락(기회 증가)' THEN 1 ELSE 0 END) AS INC,
          SUM(CASE WHEN DIRECTION = '상승(과열 심화)' THEN 1 ELSE 0 END) AS DEC,
          SUM(CASE WHEN DIRECTION = '안정' THEN 1 ELSE 0 END) AS STB
        FROM URBAN_MISMATCH_AI.ANALYTICS.MISMATCH_PREDICTIONS
      `);

      let dataSql = `
        SELECT s.GU_NAME, s.DONG_NAME, s.DISTRICT_CODE,
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
          COALESCE(ROUND(s.TOTAL_STORES, 0), 0) AS TOTAL_STORES,
          COALESCE(ROUND(s.FOOD_STORES, 0), 0) AS FOOD_STORES,
          COALESCE(ROUND(s.COFFEE_STORES, 0), 0) AS COFFEE_STORES,
          COALESCE(ROUND(s.MEDICAL_STORES, 0), 0) AS MEDICAL_STORES,
          COALESCE(ROUND(s.FOOD_REVENUE_PER_STORE, 0), 0) AS FOOD_REVENUE_PER_STORE,
          COALESCE(ROUND(s.COFFEE_REVENUE_PER_STORE, 0), 0) AS COFFEE_REVENUE_PER_STORE,
          COALESCE(ROUND(s.RESIDENTS_PER_STORE, 1), 0) AS RESIDENTS_PER_STORE,
          ROUND(s.TOTAL_CONSUMPTION_AMT, 0) AS TOTAL_CONSUMPTION_AMT,
          ROUND(s.TOTAL_RESIDENTIAL_POP, 0) AS TOTAL_RESIDENTIAL_POP,
          ROUND(s.TOTAL_FLOATING_POP, 0) AS TOTAL_FLOATING_POP,
          ROUND(s.CONSUMPTION_PER_RESIDENT, 0) AS CONSUMPTION_PER_RESIDENT,
          ROUND(s.AVG_INCOME, 0) AS AVG_INCOME,
          s.TRANSPORT_GRADE,
          COALESCE(s.AVG_LIVING_SCORE, 0) AS AVG_LIVING_SCORE,
          s.TRUE_OPPORTUNITY_LABEL AS OPPORTUNITY_LABEL,
          s.AI_INSIGHT,
          ST_X(ST_CENTROID(s.DISTRICT_GEOM)) AS LNG,
          ST_Y(ST_CENTROID(s.DISTRICT_GEOM)) AS LAT,
          COALESCE(p.DIRECTION, '미출판') AS PREDICTION_DIRECTION,
          COALESCE(p.PREDICTED_MISMATCH_3M, s.TRUE_MISMATCH_SCORE) AS PREDICTION_SCORE_3M,
          COALESCE(i.BEST_INDUSTRY_KR, '추천없음') AS BEST_INDUSTRY,
          COALESCE(i.SUITABILITY_LABEL, '미분류') AS SUITABILITY_LABEL
        FROM URBAN_MISMATCH_AI.ANALYTICS.SUPPLY_DEMAND_MISMATCH s
        LEFT JOIN URBAN_MISMATCH_AI.ANALYTICS.MISMATCH_PREDICTIONS p ON s.DISTRICT_CODE = p.DISTRICT_CODE
        LEFT JOIN URBAN_MISMATCH_AI.ANALYTICS.INDUSTRY_PREDICTIONS i ON s.DISTRICT_CODE = i.DISTRICT_CODE
      `;
      if (gu) dataSql += ` WHERE s.GU_NAME = ? `;
      dataSql += ` ORDER BY s.TRUE_MISMATCH_SCORE DESC`;

      const rawData = gu ? await query(dataSql, [gu]) : await query(dataSql);

      const raw = summaryRows[0] as Record<string, unknown>;
      const fcast = forecastRows[0] as Record<string, unknown>;
      const summary = {
        totalDongs: raw.T,
        opportunityZones: raw.O,
        saturatedZones: raw.V,
        balancedZones: raw.B,
        avgStores: raw.AVG_STORES,
        avgScore: raw.AVG_SCORE,
        forecast: {
          increasingOpportunity: fcast.INC || 0,
          increasingSaturation: fcast.DEC || 0,
          stable: fcast.STB || 0
        }
      };

      const data = transformKeys(rawData);

      const guMap = new Map<string, { total: number; count: number }>();
      for (const r of rawData as Record<string, unknown>[]) {
        const g = r.GU_NAME as string;
        const s = r.MISMATCH_SCORE as number;
        const entry = guMap.get(g) || { total: 0, count: 0 };
        entry.total += s;
        entry.count += 1;
        guMap.set(g, entry);
      }
      const guAverages = Array.from(guMap.entries()).map(([gu, v]) => ({
        gu,
        avgScore: Math.round((v.total / v.count) * 10) / 10,
      }));

      const zoneMap = new Map<string, Map<string, number>>();
      for (const r of rawData as Record<string, unknown>[]) {
        const g = r.GU_NAME as string;
        const z = r.ZONE_TYPE as string;
        if (!zoneMap.has(g)) zoneMap.set(g, new Map());
        const inner = zoneMap.get(g)!;
        inner.set(z, (inner.get(z) || 0) + 1);
      }
      const zoneDistribution: { gu: string; zone: string; count: number }[] = [];
      zoneMap.forEach((zones, gu) => {
        zones.forEach((count, zone) => {
          zoneDistribution.push({ gu, zone, count });
        });
      });

      return NextResponse.json({ summary, data, guAverages, zoneDistribution });
    } catch (error) {
      console.error('[API /mismatch] Snowflake error:', error);
      return NextResponse.json({ error: 'Failed to fetch', detail: String(error) }, { status: 500 });
    }
  }

  return NextResponse.json({
    summary: mockSummary,
    data: mockMismatchData,
    guAverages: mockGuAverages,
    zoneDistribution: mockZoneDistribution,
  });
}
