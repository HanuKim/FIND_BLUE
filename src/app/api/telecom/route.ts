import { NextResponse } from 'next/server';
import { query, isSnowflakeConfigured } from '@/lib/snowflake';
import { transformKeys } from '@/lib/api';
import { mockTelecomData } from '@/lib/mock-data';

export async function GET() {
  if (isSnowflakeConfigured()) {
    try {
      const rawTelecom = await query(`
        SELECT YEAR_MONTH AS MONTH, GU_NAME,
          TOTAL_CONTRACTS, TOTAL_OPENS,
          BUNDLE_CONTRACTS, STANDALONE_CONTRACTS,
          ROUND(AVG_SALES, 0) AS AVG_SALES
        FROM URBAN_MISMATCH_AI.ANALYTICS.TELECOM_DEMAND_BY_GU
        WHERE TOTAL_OPENS > 10
        ORDER BY YEAR_MONTH ASC, GU_NAME
      `);

      const rawLatest = await query(`
        SELECT YEAR_MONTH AS MONTH, GU_NAME,
          TOTAL_CONTRACTS, TOTAL_OPENS,
          BUNDLE_CONTRACTS, STANDALONE_CONTRACTS,
          ROUND(AVG_SALES, 0) AS AVG_SALES
        FROM URBAN_MISMATCH_AI.ANALYTICS.TELECOM_DEMAND_BY_GU
        WHERE YEAR_MONTH = DATEADD('MONTH', -1, DATE_TRUNC('MONTH', CURRENT_DATE()))
        ORDER BY GU_NAME
      `);

      let rawRental: unknown[] = [];
      try {
        rawRental = await query(`
          SELECT YEAR_MONTH AS MONTH, RENTAL_MAIN_CATEGORY AS CATEGORY,
            SUM(CONTRACT_COUNT) AS CONTRACT_COUNT,
            SUM(OPEN_COUNT) AS OPEN_COUNT,
            ROUND(AVG(AVG_NET_SALES), 0) AS AVG_SALES
          FROM SOUTH_KOREA_TELECOM_SUBSCRIPTION_ANALYTICS__CONTRACTS_MARKETING_AND_CALL_CENTER_INSIGHTS_BY_REGION.TELECOM_INSIGHTS.V06_RENTAL_CATEGORY_TRENDS
          WHERE INSTALL_STATE = '서울' AND OPEN_COUNT > 0
          GROUP BY MONTH, CATEGORY
          ORDER BY MONTH DESC, CONTRACT_COUNT DESC
        `);
      } catch {
        // Rental table might not be accessible; skip gracefully
      }

      return NextResponse.json({
        data: transformKeys(rawTelecom),
        latest: transformKeys(rawLatest),
        rental: transformKeys(rawRental),
      });
    } catch (error) {
      console.error('[API /telecom] Snowflake error:', error);
      return NextResponse.json({ error: 'Failed', detail: String(error) }, { status: 500 });
    }
  }

  return NextResponse.json({ data: mockTelecomData });
}
