import { NextResponse } from 'next/server';
import { query, isSnowflakeConfigured } from '@/lib/snowflake';
import { transformKeys } from '@/lib/api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const region = searchParams.get('region');

  if (!isSnowflakeConfigured()) {
    return NextResponse.json({ liveData: null, history: [], trend: [] });
  }

  try {
    const currentUser = await query(`SELECT CURRENT_USER() AS U`);
    const username = (currentUser[0] as Record<string, string>).U;

    // Saved regions
    const savedRegions = await query(`
      SELECT DISTINCT REGION FROM URBAN_MISMATCH_AI.ANALYTICS.USER_ANALYSIS_PROFILES
      WHERE USERNAME = '${username}'
    `);

    let liveData = null;
    let history: unknown[] = [];
    let trend: unknown[] = [];

    if (region) {
      // Live region data
      const live = await query(`
        SELECT L.GU_NAME, L.DONG_NAME, ROUND(S.TRUE_MISMATCH_SCORE, 1) AS MISMATCH_SCORE,
          ROUND(S.SCORE_CAFE, 1) AS SCORE_CAFE,
          ROUND(S.SCORE_FOOD, 1) AS SCORE_FOOD,
          ROUND(S.SCORE_PREMIUM, 1) AS SCORE_PREMIUM,
          ROUND(S.SCORE_DAILY, 1) AS SCORE_DAILY,
          ROUND(S.SCORE_MEDICAL, 1) AS SCORE_MEDICAL,
          ROUND(S.SCORE_FASHION, 1) AS SCORE_FASHION,
          ROUND(S.SCORE_LEISURE, 1) AS SCORE_LEISURE,
          ROUND(S.SCORE_ACCOMMODATION, 1) AS SCORE_ACCOMMODATION,
          S.TRUE_OPPORTUNITY_LABEL AS ZONE_TYPE, ROUND(L.TOTAL_RESIDENTIAL_POP,0) AS TOTAL_RESIDENTIAL_POP,
          ROUND(L.TOTAL_FLOATING_POP,0) AS TOTAL_FLOATING_POP,
          ROUND(L.AVG_INCOME,0) AS AVG_INCOME,
          ROUND(L.CONSUMPTION_PER_RESIDENT,0) AS CONSUMPTION_PER_RESIDENT,
          L.TRANSPORT_GRADE, ROUND(L.AVG_APT_PRICE,0) AS AVG_APT_PRICE
        FROM URBAN_MISMATCH_AI.ANALYTICS.LATEST_MISMATCH_REPORT L
        LEFT JOIN URBAN_MISMATCH_AI.ANALYTICS.SUPPLY_DEMAND_MISMATCH S
          ON L.GU_NAME = S.GU_NAME AND L.DONG_NAME = S.DONG_NAME
        WHERE L.GU_NAME || ' ' || L.DONG_NAME = ?
      `, [region]);
      if (live.length > 0) liveData = transformKeys(live[0]);

      // User's history for this region
      history = await query(`
        SELECT CREATED_AT, MONTHLY_REVENUE, MONTHLY_RENT, AVG_UNIT_PRICE, TOTAL_SCORE, USER_TYPE
        FROM URBAN_MISMATCH_AI.ANALYTICS.USER_ANALYSIS_PROFILES
        WHERE USERNAME = '${username}' AND REGION = ?
        ORDER BY CREATED_AT ASC
      `, [region]);

      // Mismatch trend for this region
      const parts = region.split(' ');
      if (parts.length >= 2) {
        trend = await query(`
          SELECT STANDARD_YEAR_MONTH AS MONTH, 
          ROUND(
            CASE
              WHEN MISMATCH_SCORE < -2 THEN 90 + (ABS(MISMATCH_SCORE) - 2) * 5
              WHEN MISMATCH_SCORE < 0 THEN 50 + ABS(MISMATCH_SCORE) * 20
              WHEN MISMATCH_SCORE <= 1 THEN 50 - MISMATCH_SCORE * 15
              ELSE GREATEST(5, 35 - (MISMATCH_SCORE - 1) * 10)
            END
          , 0) AS SCORE
          FROM URBAN_MISMATCH_AI.ANALYTICS.MISMATCH_TREND
          WHERE GU_NAME = ? AND DONG_NAME = ?
          ORDER BY MONTH
        `, [parts[0], parts.slice(1).join(' ')]);
      }
    }

    return NextResponse.json({
      regions: (savedRegions as Record<string, string>[]).map(r => r.REGION),
      liveData,
      history: transformKeys(history),
      trend: transformKeys(trend),
    });
  } catch (error) {
    console.error('[API /monitoring] Error:', error);
    return NextResponse.json({ error: 'Failed', detail: String(error) }, { status: 500 });
  }
}
