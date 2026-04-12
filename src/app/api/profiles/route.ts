import { NextResponse } from 'next/server';
import { query, isSnowflakeConfigured } from '@/lib/snowflake';

// POST: Save a profile
export async function POST(request: Request) {
  if (!isSnowflakeConfigured()) {
    // Store in-memory for demo (browser localStorage is handled client-side)
    return NextResponse.json({ success: true, _source: 'local' });
  }

  const body = await request.json();
  try {
    const currentUser = await query(`SELECT CURRENT_USER() AS U`);
    const username = (currentUser[0] as Record<string, string>).U;

    const scoreJson = body.scoreJson ? `'${String(body.scoreJson).replace(/'/g, "''")}'` : 'NULL';
    const aiText = body.aiText ? `'${String(body.aiText).replace(/'/g, "''")}'` : 'NULL';

    await query(`
      INSERT INTO URBAN_MISMATCH_AI.ANALYTICS.USER_ANALYSIS_PROFILES
      (USERNAME, USER_TYPE, REGION, BUSINESS_TYPE, PRODUCT_CATEGORY,
       AVG_UNIT_PRICE, MONTHLY_REVENUE, MONTHLY_RENT,
       EMPLOYEE_COUNT, OPERATING_HOURS, INITIAL_INVESTMENT,
       TARGET_MONTHLY_REVENUE, COMPETITOR_COUNT, ADDITIONAL_INFO,
       REPORT_SCORES, REPORT_AI_TEXT, TOTAL_SCORE)
      VALUES (
        '${username}', '${body.userType}', '${body.region}', '${body.businessType}',
        '${(body.product || '').replace(/'/g, "''")}',
        ${body.avgUnitPrice || 0}, ${body.monthlyRevenue || 0}, ${body.monthlyRent || 0},
        ${body.employeeCount || 'NULL'},
        ${body.operatingHours ? `'${body.operatingHours}'` : 'NULL'},
        ${body.initialInvestment || 'NULL'},
        ${body.targetRevenue || 'NULL'},
        ${body.competitorCount || 'NULL'},
        ${body.additionalInfo ? `'${body.additionalInfo.replace(/'/g, "''")}'` : 'NULL'},
        ${scoreJson}, ${aiText}, ${body.totalScore || 0}
      )
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API /profiles] Save error:', error);
    return NextResponse.json({ error: 'Failed to save', detail: String(error) }, { status: 500 });
  }
}

// GET: Fetch user's profiles
export async function GET() {
  if (!isSnowflakeConfigured()) {
    return NextResponse.json({ profiles: [] });
  }

  try {
    const currentUser = await query(`SELECT CURRENT_USER() AS U`);
    const username = (currentUser[0] as Record<string, string>).U;

    const profiles = await query(`
      SELECT PROFILE_ID, USER_TYPE, REGION, BUSINESS_TYPE,
        PRODUCT_CATEGORY, AVG_UNIT_PRICE, MONTHLY_REVENUE, MONTHLY_RENT,
        TOTAL_SCORE, CREATED_AT,
        CASE WHEN REPORT_AI_TEXT IS NOT NULL THEN 'O' ELSE 'X' END AS AI_REPORT,
        REPORT_SCORES, REPORT_AI_TEXT
      FROM URBAN_MISMATCH_AI.ANALYTICS.USER_ANALYSIS_PROFILES
      WHERE USERNAME = '${username}'
      ORDER BY CREATED_AT DESC
    `);

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error('[API /profiles] Fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch', detail: String(error) }, { status: 500 });
  }
}
