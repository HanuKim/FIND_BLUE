import { NextResponse } from 'next/server';
import { query, isSnowflakeConfigured } from '@/lib/snowflake';
import { transformKeys } from '@/lib/api';
import { mockTrendData, mockConsumptionTrend } from '@/lib/mock-data';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const codes = searchParams.get('codes');
  const type = searchParams.get('type') || 'all';

  const typeMap: Record<string, string> = {
    cafe: 'SCORE_CAFE', restaurant: 'SCORE_FOOD', premium: 'SCORE_PREMIUM',
    daily: 'SCORE_DAILY', medical: 'SCORE_MEDICAL', fashion: 'SCORE_FASHION',
    entertainment: 'SCORE_LEISURE', accommodation: 'SCORE_ACCOMMODATION'
  };
  const targetCol = typeMap[type];

  if (isSnowflakeConfigured()) {
    try {
      const districts = await query(`
        SELECT DISTINCT GU_NAME || ' ' || DONG_NAME AS LABEL, DISTRICT_CODE
        FROM URBAN_MISMATCH_AI.ANALYTICS.MISMATCH_TREND ORDER BY LABEL
      `);

      let trendSql = `
        SELECT T.GU_NAME || ' ' || T.DONG_NAME AS REGION,
          T.STANDARD_YEAR_MONTH AS MONTH,
          ROUND(
            (CASE
              WHEN T.MISMATCH_SCORE < -2 THEN 90 + (ABS(T.MISMATCH_SCORE) - 2) * 5
              WHEN T.MISMATCH_SCORE < 0 THEN 50 + ABS(T.MISMATCH_SCORE) * 20
              WHEN T.MISMATCH_SCORE <= 1 THEN 50 - T.MISMATCH_SCORE * 15
              ELSE GREATEST(5, 35 - (T.MISMATCH_SCORE - 1) * 10)
            END)
          , 1) AS BASE_SCORE,
          ROUND(COALESCE(S.${targetCol || 'TRUE_MISMATCH_SCORE'}, S.TRUE_MISMATCH_SCORE), 1) AS END_SCORE
        FROM URBAN_MISMATCH_AI.ANALYTICS.MISMATCH_TREND T
        LEFT JOIN URBAN_MISMATCH_AI.ANALYTICS.SUPPLY_DEMAND_MISMATCH S 
          ON T.GU_NAME = S.GU_NAME AND T.DONG_NAME = S.DONG_NAME
      `;
      if (codes) {
        const codeList = codes.split(',').map(c => `'${c.trim()}'`).join(',');
        trendSql += ` WHERE T.DISTRICT_CODE IN (${codeList})`;
      }
      trendSql += ` ORDER BY MONTH`;

      const rawTrends = await query(trendSql);

      let consumption: unknown[] = [];
      if (codes) {
        const firstCode = codes.split(',')[0].trim();
        consumption = await query(`
          SELECT STANDARD_YEAR_MONTH AS MONTH,
            ROUND(TOTAL_CONSUMPTION_AMT / 1000000, 1) AS CONSUMPTION,
            ROUND(TOTAL_FLOATING_POP, 0) AS FLOATING_POP
          FROM URBAN_MISMATCH_AI.ANALYTICS.MISMATCH_TREND
          WHERE DISTRICT_CODE = ?
          ORDER BY MONTH
        `, [firstCode]);
      }

      const rt = rawTrends as Record<string, unknown>[];
      
      // Find the last month's BASE_SCORE to compute offset for each REGION
      const regionOffsets = new Map<string, number>();
      const latestMonths = new Map<string, string>();
      for (const r of rt) {
        const region = String(r.REGION);
        const month = String(r.MONTH);
        if (!latestMonths.has(region) || month > latestMonths.get(region)!) {
          latestMonths.set(region, month);
          const endScore = Number(r.END_SCORE || 0);
          const baseScore = Number(r.BASE_SCORE || 0);
          regionOffsets.set(region, endScore - baseScore);
        }
      }

      const trends = rt.map(r => {
        const region = String(r.REGION);
        const baseScore = Number(r.BASE_SCORE || 0);
        const offset = regionOffsets.get(region) || 0;
        return {
          region,
          month: String(r.MONTH),
          score: Math.min(100, Math.max(0, baseScore + offset)),
        };
      });

      const consumptionData = (consumption as Record<string, unknown>[]).map(r => ({
        month: r.MONTH,
        consumption: r.CONSUMPTION,
        floatingPop: r.FLOATING_POP,
      }));

      return NextResponse.json({
        districts: transformKeys(districts),
        trends,
        consumption: consumptionData,
      });
    } catch (error) {
      console.error('[API /trends] Snowflake error:', error);
      return NextResponse.json({ error: 'Failed to fetch trends', detail: String(error) }, { status: 500 });
    }
  }

  // Mock: convert old scores to 0-100
  const normalizedTrends = mockTrendData.map(d => ({
    ...d,
    score: Math.round(
      d.score < -2 ? 90 + (Math.abs(d.score) - 2) * 5
      : d.score < 0 ? 50 + Math.abs(d.score) * 20
      : d.score <= 1 ? 50 - d.score * 15
      : Math.max(5, 35 - (d.score - 1) * 10)
    ),
  }));

  return NextResponse.json({
    trends: normalizedTrends,
    consumption: mockConsumptionTrend,
  });
}
