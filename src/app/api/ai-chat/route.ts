import { NextResponse } from 'next/server';
import { query, isSnowflakeConfigured } from '@/lib/snowflake';

export async function POST(request: Request) {
  const body = await request.json();
  const { message } = body;

  if (!message) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  if (!isSnowflakeConfigured()) {
    return NextResponse.json({
      answer: '⚠️ Snowflake 연결이 설정되지 않았습니다. .env.local에 자격 증명을 등록하세요.',
      _source: 'mock',
    });
  }

  try {
    const prompt = `당신은 서울시 상권-주거 미스매치 분석 전문가입니다. ` +
      `URBAN_MISMATCH_AI.ANALYTICS.LATEST_MISMATCH_REPORT 테이블에는 서울시 서초구, 영등포구, 중구의 118개 법정동 데이터가 있습니다. ` +
      `컬럼: GU_NAME(구), DONG_NAME(동), MISMATCH_SCORE(미스매치점수, 낮을수록 기회), ZONE_TYPE(기회 지역/균형 지역/상업 과밀), ` +
      `TOTAL_RESIDENTIAL_POP(거주인구), TOTAL_FLOATING_POP(유동인구), AVG_INCOME(평균소득), ` +
      `CONSUMPTION_PER_RESIDENT(주민당소비), AVG_APT_PRICE(아파트시세), TRANSPORT_GRADE(교통등급), ` +
      `NEARBY_STATION_CNT(인접역수), AVG_LIVING_SCORE(주거점수), ` +
      `COFFEE_SHARE(커피소비비중), FOOD_SHARE(음식소비비중), MEDICAL_SHARE(의료소비비중), AI_INSIGHT(AI분석).\n\n` +
      `사용자 질문에 대해 SQL을 생성하고 실행한 결과를 바탕으로 친절하게 한국어로 답변하세요. ` +
      `SQL은 보여주지 말고 분석 결과만 자연스럽게 설명하세요.\n\n` +
      `질문: ${message}`;

    const escapedPrompt = prompt.replace(/'/g, "''");
    const result = await query(
      `SELECT SNOWFLAKE.CORTEX.COMPLETE('mistral-large2', '${escapedPrompt}') AS ANSWER`
    );

    return NextResponse.json({
      answer: (result[0] as Record<string, unknown>).ANSWER,
    });
  } catch (error) {
    console.error('[API /ai-chat] Snowflake error:', error);
    return NextResponse.json(
      { error: 'Chat failed', detail: String(error) },
      { status: 500 }
    );
  }
}
