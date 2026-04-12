import streamlit as st
import pandas as pd
import json
import pydeck as pdk

st.set_page_config(page_title="Urban Mismatch Intelligence", layout="wide")
from snowflake.snowpark.context import get_active_session
session = get_active_session()

@st.cache_data(ttl=600)
def load_dong_list():
    return session.sql("""
        SELECT GU_NAME || ' ' || DONG_NAME AS LABEL, GU_NAME, DONG_NAME, DISTRICT_CODE
        FROM URBAN_MISMATCH_AI.ANALYTICS.LATEST_MISMATCH_REPORT ORDER BY MISMATCH_SCORE
    """).to_pandas()
    
st.markdown("""<style>
    .block-container {padding-top: 1rem; padding-bottom: 1rem;}
    [data-testid="stMetricValue"] {font-size: 1.3rem;}
    .stTabs [data-baseweb="tab-list"] {gap: 8px;}
    .stTabs [data-baseweb="tab"] {padding: 8px 16px; font-weight: 600;}
</style>""", unsafe_allow_html=True)

def safe_int(val):
    if pd.isna(val): return "N/A"
    return format(int(val), ",")

def safe_round(val, n=2):
    if pd.isna(val): return "N/A"
    return str(round(float(val), n))

def make_map(df, lat=37.505, lon=126.95, zoom=11.5, use_true_score=False):
    df = df.copy()
    df['name'] = df['GU_NAME'] + " " + df['DONG_NAME']

    if use_true_score and 'TRUE_MISMATCH_SCORE' in df.columns:
        df['score'] = df['TRUE_MISMATCH_SCORE'].round(1)
        df['zone'] = df['TRUE_OPPORTUNITY_LABEL']
        df['stores'] = df['TOTAL_STORES'].fillna(0).astype(int)
        def get_color(row):
            s = row['TRUE_MISMATCH_SCORE']
            if s >= 70: return [50, 100, 220, 190]
            elif s >= 40: return [100, 200, 100, 150]
            else: return [220, 50, 50, 170]
        df['color'] = df.apply(get_color, axis=1)
        tooltip = {"text": "{name}\n기회점수: {score}/100\n분류: {zone}\n총점포: {stores}개"}
        legend = (
            '<div style="display:flex;gap:16px;align-items:center;margin-top:4px;flex-wrap:wrap;">'
            '<span><span style="display:inline-block;width:14px;height:14px;background:#3264be;border-radius:2px;vertical-align:middle;margin-right:4px;"></span>높은 기회 (70+)</span>'
            '<span><span style="display:inline-block;width:14px;height:14px;background:#64c864;border-radius:2px;vertical-align:middle;margin-right:4px;"></span>보통 (40-70)</span>'
            '<span><span style="display:inline-block;width:14px;height:14px;background:#dc3232;border-radius:2px;vertical-align:middle;margin-right:4px;"></span>공급 과밀 (&lt;40)</span>'
            '</div>'
        )
    else:
        df['score'] = df['MISMATCH_SCORE'].round(2)
        df['zone'] = df['ZONE_TYPE']
        def get_color(row):
            s = row['MISMATCH_SCORE']
            if s > 1.5: return [220, 50, 50, 170]
            elif s > 0: return [255, 165, 0, 150]
            elif s > -0.5: return [100, 200, 100, 150]
            else: return [50, 100, 220, 190]
        df['color'] = df.apply(get_color, axis=1)
        tooltip = {"text": "{name}\n미스매치: {score}\n분류: {zone}"}
        legend = (
            '<div style="display:flex;gap:16px;align-items:center;margin-top:4px;flex-wrap:wrap;">'
            '<span><span style="display:inline-block;width:14px;height:14px;background:#dc3232;border-radius:2px;vertical-align:middle;margin-right:4px;"></span>상업 과밀 (&gt;1.5)</span>'
            '<span><span style="display:inline-block;width:14px;height:14px;background:#ffa500;border-radius:2px;vertical-align:middle;margin-right:4px;"></span>활발 (0~1.5)</span>'
            '<span><span style="display:inline-block;width:14px;height:14px;background:#64c864;border-radius:2px;vertical-align:middle;margin-right:4px;"></span>균형 (-0.5~0)</span>'
            '<span><span style="display:inline-block;width:14px;height:14px;background:#3264be;border-radius:2px;vertical-align:middle;margin-right:4px;"></span>기회 지역 (&lt;-0.5)</span>'
            '</div>'
        )

    if isinstance(df['DISTRICT_GEOM'].iloc[0], str):
        df['geometry'] = df['DISTRICT_GEOM'].apply(json.loads)
    else:
        df['geometry'] = df['DISTRICT_GEOM']

    geo_layer = pdk.Layer(
        "GeoJsonLayer", data=df, get_geometry="geometry",
        get_fill_color="color", get_line_color=[255, 255, 255, 50],
        get_line_width=1, pickable=True, auto_highlight=True
    )
    view = pdk.ViewState(latitude=lat, longitude=lon, zoom=zoom, pitch=0)
    st.pydeck_chart(pdk.Deck(layers=[geo_layer], initial_view_state=view, tooltip=tooltip, map_style="mapbox://styles/mapbox/light-v9"))
    st.markdown(legend, unsafe_allow_html=True)
    
# ─── 헬퍼 함수 (make_map 아래에 배치) ───

def calc_rent_ratio_score(monthly_revenue, monthly_rent):
    if not monthly_revenue or monthly_revenue == 0:
        return 0, "매출 정보 미입력", "임대료 비율을 산출할 수 없습니다."
    ratio = (monthly_rent / monthly_revenue) * 100
    if ratio <= 5:
        return 10, f"임대료 비율 {ratio:.1f}%", f"월매출 {monthly_revenue:,}원 대비 월세 {monthly_rent:,}원으로, 임대료 비율이 {ratio:.1f}%입니다. 일반적으로 외식업 기준 10% 이하가 우수한 수준이며, 현재 매우 안정적인 구조입니다. 이익 재투자 여력이 충분합니다."
    elif ratio <= 10:
        return 8, f"임대료 비율 {ratio:.1f}%", f"임대료 비율 {ratio:.1f}%는 업계 권장 범위(10% 이하) 내에 있습니다. 안정적인 비용 구조이나, 매출 하락 시 15%를 넘지 않도록 관리가 필요합니다."
    elif ratio <= 15:
        return 6, f"임대료 비율 {ratio:.1f}%", f"임대료 비율 {ratio:.1f}%는 보통 수준입니다. 매출이 현 수준을 유지해야 안정적이며, 10% 이하로 낮추기 위해 매출 {int(monthly_rent / 0.10):,}원 이상 달성이 권장됩니다."
    elif ratio <= 20:
        return 4, f"임대료 비율 {ratio:.1f}%", f"임대료 비율 {ratio:.1f}%는 경고 수준입니다. 인건비·재료비를 합산하면 손익분기 달성이 어려울 수 있습니다. 임대료 재협상 또는 매출 증대 전략이 시급합니다."
    else:
        return 2, f"임대료 비율 {ratio:.1f}%", f"임대료 비율 {ratio:.1f}%는 매우 위험한 수준입니다. 업계 평균(10-15%)을 크게 초과하며, 매출 대비 고정비 부담이 과중합니다. 임지 이전 또는 임대료 인하 협상을 강력히 권장합니다."

def calc_unit_price_score(avg_unit_price, business_type):
    if not avg_unit_price or avg_unit_price == 0:
        return 0, "객단가 미입력", "객단가 정보가 없어 평가할 수 없습니다."
    benchmarks = {"음식점": (10000, 25000), "카페": (5000, 12000), "소매업": (15000, 50000),
                  "서비스업": (20000, 80000), "미용/뷰티": (15000, 40000), "기타": (10000, 30000)}
    low, high = benchmarks.get(business_type, (10000, 30000))
    if low <= avg_unit_price <= high:
        return 8, f"객단가 {avg_unit_price:,}원 (적정)", f"객단가 {avg_unit_price:,}원은 {business_type} 업종 평균 범위({low:,}~{high:,}원) 내에 위치합니다. 가격 저항 없이 고객 확보가 가능한 구간이며, 세트 메뉴·업셀링으로 단가를 10-15% 높이는 전략을 병행하면 수익성이 개선됩니다."
    elif avg_unit_price < low:
        return 4, f"객단가 {avg_unit_price:,}원 (낮음)", f"객단가 {avg_unit_price:,}원은 업종 평균 하한({low:,}원)보다 낮습니다. 박리다매 전략이라면 일 {int(50000000 / avg_unit_price / 30)}건 이상의 객수 확보가 필요합니다. 프리미엄 메뉴 추가 또는 객단가 {low:,}원 수준으로의 점진적 인상을 검토하세요."
    else:
        return 6, f"객단가 {avg_unit_price:,}원 (높음)", f"객단가 {avg_unit_price:,}원은 업종 평균 상한({high:,}원)을 초과합니다. 프리미엄 포지셔닝이 가능하나, 해당 가격대를 수용하는 고객층이 충분한지 확인이 필요합니다. 지역 소득 수준과의 정합성이 중요합니다."

def calc_breakeven_score(monthly_revenue, monthly_rent):
    if not monthly_revenue or not monthly_rent or monthly_rent == 0:
        return 0, "데이터 부족", "손익분기 분석에 필요한 매출 또는 임대료 정보가 부족합니다."
    estimated_cost = monthly_rent * 3.2
    ratio = monthly_revenue / estimated_cost
    if ratio >= 1.5:
        return 7, f"매출/비용 {ratio:.1f}배", f"월매출({monthly_revenue:,}원)이 예상 총비용({estimated_cost:,.0f}원, 임대료×3.2 기준) 대비 {ratio:.1f}배로 손익분기를 크게 상회합니다. 월 예상 순이익은 약 {int(monthly_revenue - estimated_cost):,}원이며, 안정적인 사업 운영이 가능합니다."
    elif ratio >= 1.0:
        return 5, f"매출/비용 {ratio:.1f}배", f"매출이 예상 비용과 근접({ratio:.1f}배)하여 손익분기선에 있습니다. 매출 {int(estimated_cost * 1.3):,}원 이상 달성 시 안정권에 진입합니다. 비수기 대비 운전자금 2-3개월분 확보를 권장합니다."
    else:
        return 2, f"매출/비용 {ratio:.1f}배", f"월매출({monthly_revenue:,}원)이 예상 비용({estimated_cost:,.0f}원)에 미달하여 월 약 {int(estimated_cost - monthly_revenue):,}원 적자가 예상됩니다. 매출 증대 또는 비용 구조 개선이 시급하며, 6개월 이상 운전자금 확보가 필수입니다."

def get_grade(score, max_score):
    pct = (score / max_score) * 100 if max_score > 0 else 0
    if pct >= 90: return "A+"
    elif pct >= 80: return "A"
    elif pct >= 70: return "B+"
    elif pct >= 60: return "B"
    elif pct >= 50: return "C"
    elif pct >= 40: return "D"
    else: return "F"

def generate_scoring_report(user_type, region, business_type, product, avg_unit_price, monthly_revenue, monthly_rent, dong_data=None, employee_count=None, operating_hours=None, initial_investment=None, target_revenue=None, competitor_count=None):
    report = {"user_type": user_type, "region": region, "business_type": business_type,
              "product": product, "avg_unit_price": avg_unit_price or 0,
              "monthly_revenue": monthly_revenue or 0, "monthly_rent": monthly_rent or 0,
              "categories": [], "total_score": 0, "total_max": 100}

    has_dong = dong_data is not None and len(dong_data) > 0
    if has_dong:
        d = dong_data.iloc[0]
        res_pop = float(d.get('RES_POP', 0))
        float_pop = float(d.get('FLOAT_POP', 0))
        score_val = float(d.get('SCORE', 0))
        transport = str(d.get('TRANSPORT', ''))
        living = float(d.get('LIVING', 50))
        income = float(d.get('INCOME', 0))
        cpr = float(d.get('CPR', 0))
        stations = int(d.get('STATIONS', 0))
    else:
        res_pop, float_pop, score_val, living, income, cpr, stations = 0, 0, 0, 50, 0, 0, 0
        transport = ''

    # 1. 입지 분석 (25점)
    if has_dong:
        pop_score = min(10, max(2, int(res_pop / 800)))
        pop_summary = f"거주인구 {int(res_pop):,}명, 유동인구 {int(float_pop):,}명"
        pop_detail = f"{region}의 거주인구는 {int(res_pop):,}명, 유동인구는 {int(float_pop):,}명입니다. " + (f"유동인구가 거주인구의 {float_pop/res_pop:.1f}배로 외부 유입이 활발합니다. 점심·저녁 피크 타임 매출 극대화 전략이 유효합니다." if res_pop > 0 and float_pop/res_pop > 1.5 else f"거주인구 기반 상권으로 안정적인 단골 고객 확보가 가능합니다. 주 5일 이상 꾸준한 매출이 예상됩니다." if res_pop > 3000 else "인구 규모가 제한적이므로 특화된 콘셉트로 넓은 상권에서 고객을 유치하는 전략이 필요합니다.")
    else:
        pop_score, pop_summary, pop_detail = 5, "데이터 기반 추정", "지역 데이터 연동 시 정밀 분석이 가능합니다."

    transport_map = {"역세권": (8, "역세권"), "준역세권": (6, "준역세권"), "도보권": (4, "도보권")}
    t_score, t_label = transport_map.get(transport, (4, transport or "미확인"))
    t_detail = f"교통등급 '{t_label}', 인접 지하철역 {stations}개. " + ("대중교통 접근성이 우수하여 넓은 범위에서 고객 유입이 가능합니다. 퇴근 시간대 테이크아웃·배달 수요도 기대됩니다." if t_score >= 7 else "대중교통 접근성이 보통이므로 주차 편의성 확보 또는 배달 서비스 강화가 매출에 도움됩니다." if t_score >= 5 else "대중교통이 불편한 입지로, 차량 고객을 위한 주차 공간 확보가 필수적이며 배달 위주 전략 검토가 필요합니다.")

    parking_score = min(7, max(2, int(living / 14)))
    parking_detail = f"주거환경 점수 {living}점 기반 평가. " + ("주거 인프라가 잘 갖춰진 지역으로 주차장·도로 접근성이 양호합니다." if parking_score >= 5 else "주거 인프라 수준을 고려할 때 주차 편의성에 제약이 있을 수 있습니다. 인근 공영주차장 활용 안내가 필요합니다.")

    cat1_items = [
        {"name": "유동인구 밀도", "max": 10, "score": pop_score, "summary": pop_summary, "desc": pop_detail},
        {"name": "대중교통 접근성", "max": 8, "score": t_score, "summary": f"{t_label} (역 {stations}개)", "desc": t_detail},
        {"name": "주차 편의성", "max": 7, "score": parking_score, "summary": f"주거점수 {living}점", "desc": parking_detail}
    ]
    report["categories"].append({"name": "입지 분석", "max": 25, "score": sum(i["score"] for i in cat1_items), "items": cat1_items})

    # 2. 상권 경쟁력 (25점)
    if has_dong:
        if score_val < -0.5: comp_score, comp_label = 9, "경쟁 낮음 (기회 지역)"
        elif score_val < 0: comp_score, comp_label = 7, "경쟁 보통 (균형 지역)"
        elif score_val < 1: comp_score, comp_label = 5, "경쟁 있음 (활발 상권)"
        else: comp_score, comp_label = 3, "경쟁 과열 (상업 과밀)"
        comp_detail = f"미스매치 점수 {score_val}로 '{comp_label}' 판정. " + (f"동종 업종 밀집도가 낮아 선점 효과를 기대할 수 있습니다. 다만, 상권 자체가 미성숙할 수 있으므로 마케팅 투자가 초기에 필요합니다." if comp_score >= 7 else f"적정 수준의 경쟁이 존재하며, 차별화된 콘셉트와 서비스 품질로 경쟁 우위 확보가 가능합니다." if comp_score >= 5 else f"경쟁이 심한 상권입니다. 가격 경쟁보다는 명확한 차별화 포인트(특화 메뉴, 인테리어, 서비스)가 생존의 핵심입니다.")
        if competitor_count and competitor_count > 0:
            comp_detail += f" 사용자 입력 기준 인근 경쟁 매장 {competitor_count}개가 있으며, 이를 고려한 포지셔닝이 필요합니다."
    else:
        comp_score, comp_label = 5, "추정"
        comp_detail = "지역 데이터 연동 시 경쟁 강도를 정밀 평가합니다."

    growth_score = 6 if (not has_dong or score_val < 0.5) else 4
    growth_detail = f"{'소비 증가 추세가 감지되는 성장형 상권입니다. 신규 입주 증가와 함께 상권이 확대될 가능성이 있습니다.' if growth_score >= 6 else '상권이 성숙기에 접어들어 신규 성장보다는 기존 고객 유지가 중요한 시기입니다.'}"

    household_score = min(7, max(3, int(res_pop / 1200))) if has_dong else 4
    household_detail = f"배후 거주인구 {int(res_pop):,}명. " + (f"3천명 이상의 거주 인구가 안정적 기본 수요를 제공합니다. 생활밀착형 업종의 경우 충분한 고객 기반입니다." if res_pop >= 3000 else f"거주 인구가 제한적이므로 유동인구·직장인 고객까지 타겟을 확장해야 합니다." if has_dong else "지역 데이터 연동 시 정밀 분석이 가능합니다.")

    cat2_items = [
        {"name": "동종업종 경쟁강도", "max": 10, "score": comp_score, "summary": comp_label, "desc": comp_detail},
        {"name": "상권 성장률", "max": 8, "score": growth_score, "summary": "성장형" if growth_score >= 6 else "성숙형", "desc": growth_detail},
        {"name": "배후 세대수", "max": 7, "score": household_score, "summary": f"{int(res_pop):,}명" if has_dong else "미확인", "desc": household_detail}
    ]
    report["categories"].append({"name": "상권 경쟁력", "max": 25, "score": sum(i["score"] for i in cat2_items), "items": cat2_items})

    # 3. 수익성 분석 (25점)
    rent_score, rent_summary, rent_detail = calc_rent_ratio_score(monthly_revenue, monthly_rent)
    price_score, price_summary, price_detail = calc_unit_price_score(avg_unit_price, business_type)
    bep_score, bep_summary, bep_detail = calc_breakeven_score(monthly_revenue, monthly_rent)

    cat3_items = [
        {"name": "객단가 적정성", "max": 8, "score": price_score, "summary": price_summary, "desc": price_detail},
        {"name": "월매출 대비 임대료 비율", "max": 10, "score": rent_score, "summary": rent_summary, "desc": rent_detail},
        {"name": "손익분기 달성 가능성", "max": 7, "score": bep_score, "summary": bep_summary, "desc": bep_detail}
    ]
    report["categories"].append({"name": "수익성 분석", "max": 25, "score": sum(i["score"] for i in cat3_items), "items": cat3_items})

    # 4. 사업 안정성 (25점)
    trend_score = 6
    trend_detail = f"{business_type} 업종은 " + ("최근 건강·웰빙 트렌드와 맞물려 수요가 꾸준합니다." if business_type in ["카페", "음식점"] else "생활 필수 서비스로 경기 변동에 비교적 강한 편입니다." if business_type in ["미용/뷰티", "서비스업"] else "시장 트렌드를 지속적으로 모니터링하며 상품 구성을 조정해야 합니다.")

    if has_dong:
        if score_val > 1: closure_score = 4
        elif score_val > 0: closure_score = 6
        else: closure_score = 8
    else:
        closure_score = 5
    closure_detail = f"{'경쟁이 적은 기회 지역으로 폐업 리스크가 낮습니다. 3년 생존율이 평균 대비 높을 것으로 예상됩니다.' if closure_score >= 7 else '평균적인 경쟁 환경으로 업종 평균 수준의 생존율이 예상됩니다. 차별화 전략이 생존율을 크게 좌우합니다.' if closure_score >= 5 else '경쟁이 심한 지역으로 폐업 리스크가 상대적으로 높습니다. 충분한 운전자금 확보와 명확한 차별화가 필수입니다.'}"

    fixed_cost_score = 5 if (monthly_rent and monthly_revenue and monthly_rent < monthly_revenue * 0.15) else 3 if (monthly_rent and monthly_revenue) else 0
    fc_detail = f"월 고정비(임대료 {monthly_rent:,}원) 대비 " + (f"매출 규모가 안정적입니다. 인건비·재료비를 포함한 총 고정비가 매출의 60% 이내라면 건전한 수준입니다." if fixed_cost_score >= 5 else f"매출 대비 고정비 부담이 큽니다. 임대료 외 인건비({employee_count or '?'}명 기준)까지 고려하면 총 고정비 비율 관리가 핵심입니다.") if monthly_rent and monthly_revenue else "매출·임대료 정보 입력 시 상세 분석이 가능합니다."

    cat4_items = [
        {"name": "업종 트렌드 적합성", "max": 8, "score": trend_score, "summary": business_type, "desc": trend_detail},
        {"name": "폐업률 분석", "max": 10, "score": closure_score, "summary": f"{'낮음' if closure_score >= 7 else '보통' if closure_score >= 5 else '주의'}", "desc": closure_detail},
        {"name": "고정비 부담률", "max": 7, "score": fixed_cost_score, "summary": f"{'안정' if fixed_cost_score >= 5 else '부담' if fixed_cost_score > 0 else '미입력'}", "desc": fc_detail}
    ]
    report["categories"].append({"name": "사업 안정성", "max": 25, "score": sum(i["score"] for i in cat4_items), "items": cat4_items})

    report["total_score"] = sum(c["score"] for c in report["categories"])
    return report

def render_scoring_report(report):
    total = report["total_score"]
    grade = get_grade(total, 100)

    if report["user_type"] == "예비창업자":
        st.info("📋 예비창업자 분석 모드 - 창업 적합성 중심 평가")
    else:
        st.info("📋 현재 자영업자 분석 모드 - 운영 효율성 중심 평가")

    col1, col2, col3, col4 = st.columns(4)
    col1.metric("종합 점수", f"{total} / 100")
    col2.metric("종합 등급", grade)
    col3.metric("분석 지역", report["region"])
    col4.metric("업종", report["business_type"])

    for cat in report["categories"]:
        cat_grade = get_grade(cat["score"], cat["max"])
        st.subheader(f"{cat['name']} ({cat['score']}/{cat['max']}점 | {cat_grade})")
        for item in cat["items"]:
            item_grade = get_grade(item["score"], item["max"])
            ratio = item["score"] / item["max"] if item["max"] > 0 else 0
            icon = "🟢" if ratio >= 0.7 else "🟡" if ratio >= 0.5 else "🔴"
            with st.expander(f"{icon} {item['name']} — {item['score']}/{item['max']}점 ({item_grade}) | {item.get('summary', '')}"):
                st.write(item["desc"])
                st.progress(ratio)

    st.divider()
    if total >= 80:
        st.success(f"🎯 종합 평가: 매우 우수 ({grade}) — 사업 진행/유지에 긍정적입니다.")
    elif total >= 60:
        st.warning(f"🎯 종합 평가: 양호 ({grade}) — 일부 개선 사항을 보완하면 더 나은 결과를 기대할 수 있습니다.")
    else:
        st.error(f"🎯 종합 평가: 주의 필요 ({grade}) — 심층 분석 및 전략 수정을 권장합니다.")

def build_report_text(report, ai_text=""):
    from datetime import datetime
    lines = []
    lines.append("=" * 60)
    lines.append("       상권분석 AI 리포트")
    lines.append("=" * 60)
    lines.append(f"생성일: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    lines.append(f"사용자 유형: {report['user_type']}")
    lines.append(f"지역: {report['region']}  |  업종: {report['business_type']}  |  판매품목: {report['product']}")
    lines.append(f"객단가: {report['avg_unit_price']:,}원  |  월매출: {report['monthly_revenue']:,}원  |  월세: {report['monthly_rent']:,}원")
    lines.append("")
    total = report["total_score"]
    grade = get_grade(total, 100)
    lines.append(f"[종합 점수] {total} / 100점  ({grade})")
    lines.append("=" * 60)
    for cat in report["categories"]:
        cg = get_grade(cat["score"], cat["max"])
        lines.append(f"\n■ {cat['name']} — {cat['score']}/{cat['max']}점 ({cg})")
        lines.append("-" * 40)
        for item in cat["items"]:
            ig = get_grade(item["score"], item["max"])
            lines.append(f"  [{ig}] {item['name']}: {item['score']}/{item['max']}점")
            lines.append(f"       {item.get('summary', '')}")
            for desc_line in item["desc"].split(". "):
                if desc_line.strip():
                    lines.append(f"       - {desc_line.strip()}.")
    if ai_text:
        lines.append("\n" + "=" * 60)
        lines.append("       Cortex AI 전문가 분석")
        lines.append("=" * 60)
        lines.append(ai_text)
    lines.append("\n" + "=" * 60)
    lines.append("Urban Mismatch Intelligence | Snowflake Cortex AI 기반 분석")
    return "\n".join(lines)

def generate_pdf_bytes(report, ai_text=""):
    from fpdf import FPDF
    from io import BytesIO
    from datetime import datetime
    import os

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    font_dir = "/tmp/nanum_fonts_v5"
    os.makedirs(font_dir, exist_ok=True)
    font_path_regular = os.path.join(font_dir, "NanumGothic-Regular.ttf")

    if not os.path.exists(font_path_regular):
        from snowflake.snowpark.context import get_active_session
        s = get_active_session()
        rows = s.sql(
            "SELECT GET_PRESIGNED_URL(@URBAN_MISMATCH_AI.ANALYTICS.FONTS, 'Nanum_Gothic.zip', 60) AS URL"
        ).collect()
        url = rows[0]["URL"]
        import urllib.request
        zip_path = os.path.join(font_dir, "font.zip")
        urllib.request.urlretrieve(url, zip_path)
        import zipfile
        with zipfile.ZipFile(zip_path, 'r') as zf:
            zf.extractall(font_dir)

    font_path_regular = None
    font_path_bold = None
    for root, dirs, files in os.walk(font_dir):
        for f in files:
            if f.lower().endswith(".ttf"):
                fp = os.path.join(root, f)
                if "regular" in f.lower():
                    font_path_regular = fp
                elif "bold" in f.lower() and "extra" not in f.lower():
                    font_path_bold = fp
                elif not font_path_regular:
                    font_path_regular = fp

    if not font_path_regular:
        all_f = []
        for root, dirs, files in os.walk(font_dir):
            for f in files:
                all_f.append(f)
        raise Exception("폰트 없음: " + str(all_f))

    pdf.add_font("NG", "", font_path_regular, uni=True)
    pdf.add_font("NG", "B", font_path_bold or font_path_regular, uni=True)
    fn = "NG"

    pdf.set_font(fn, "B", 16)
    pdf.cell(0, 10, txt="상권분석 AI 리포트", ln=True, align="C")
    pdf.set_font(fn, "", 9)
    pdf.cell(0, 6, txt=datetime.now().strftime('%Y-%m-%d %H:%M'), ln=True, align="C")
    pdf.ln(3)

    pdf.set_font(fn, "", 10)
    pdf.cell(0, 6, txt="사용자: " + report.get('user_type','') + "  |  업종: " + report.get('business_type','') + "  |  품목: " + report.get('product',''), ln=True)
    parts = []
    if report.get('avg_unit_price', 0) > 0:
        parts.append("객단가: " + format(report['avg_unit_price'], ',') + "원")
    if report.get('monthly_revenue', 0) > 0:
        parts.append("월매출: " + format(report['monthly_revenue'], ',') + "원")
    if report.get('monthly_rent', 0) > 0:
        parts.append("월세: " + format(report['monthly_rent'], ',') + "원")
    if parts:
        pdf.cell(0, 6, txt="  |  ".join(parts), ln=True)
    pdf.cell(0, 6, txt="지역: " + report.get('region', ''), ln=True)
    pdf.ln(3)

    total = report.get("total_score", 0)
    grade = get_grade(total, 100)
    pdf.set_font(fn, "B", 13)
    pdf.cell(0, 9, txt="종합 점수: " + str(total) + " / 100점 (" + grade + ")", ln=True)
    pdf.ln(3)

    for cat in report.get("categories", []):
        cg = get_grade(cat["score"], cat["max"])
        pdf.set_font(fn, "B", 11)
        pdf.cell(0, 8, txt=cat['name'] + " - " + str(cat['score']) + "/" + str(cat['max']) + "점 (" + cg + ")", ln=True)

        for item in cat.get("items", []):
            ig = get_grade(item["score"], item["max"])
            ratio = item["score"] / item["max"] if item["max"] > 0 else 0
            marker = "[O]" if ratio >= 0.7 else "[=]" if ratio >= 0.5 else "[X]"

            pdf.set_font(fn, "B", 9)
            pdf.cell(0, 5, txt="  " + marker + " " + item['name'] + ": " + str(item['score']) + "/" + str(item['max']) + "점 (" + ig + ")", ln=True)

            pdf.set_font(fn, "", 8)
            desc = item.get("desc", "")
            if desc:
                pdf.multi_cell(0, 4, txt="    " + desc)
            pdf.ln(1)
        pdf.ln(2)

    if ai_text:
        pdf.add_page()
        pdf.set_font(fn, "B", 13)
        pdf.cell(0, 9, txt="Cortex AI 전문가 분석", ln=True)
        pdf.ln(2)
        pdf.set_font(fn, "", 9)
        for line in ai_text.split("\n"):
            line = line.strip()
            if not line:
                pdf.ln(2)
            elif line.startswith("## "):
                pdf.ln(2)
                pdf.set_font(fn, "B", 11)
                pdf.cell(0, 7, txt=line.replace("## ", ""), ln=True)
                pdf.set_font(fn, "", 9)
            elif line.startswith("### "):
                pdf.set_font(fn, "B", 10)
                pdf.cell(0, 6, txt=line.replace("### ", ""), ln=True)
                pdf.set_font(fn, "", 9)
            elif line.startswith("#"):
                pdf.set_font(fn, "B", 10)
                pdf.cell(0, 6, txt=line.lstrip("# "), ln=True)
                pdf.set_font(fn, "", 9)
            elif line.startswith("- ") or line.startswith("* "):
                pdf.multi_cell(0, 4, txt="  " + line)
            elif line.startswith("**") and line.endswith("**"):
                pdf.set_font(fn, "B", 9)
                pdf.multi_cell(0, 4, txt=line.replace("**", ""))
                pdf.set_font(fn, "", 9)
            else:
                pdf.multi_cell(0, 4, txt=line)

    pdf.ln(4)
    pdf.set_font(fn, "", 7)
    pdf.cell(0, 4, txt="Urban Mismatch Intelligence | Snowflake Cortex AI", ln=True, align="C")

    buf = BytesIO()
    pdf.output(buf)
    return buf.getvalue()
    
st.markdown("# Urban Mismatch Intelligence")
st.markdown("**소비 x 유동인구 x 소득 x 부동산 x 교통 x 이사수요** 6종 데이터를 결합한 상권-주거 미스매치 분석")
st.markdown("---")

tab1, tab2, tab3, tab4, tab5, tab6, tab7, tab8, tab9, tab10 = st.tabs([
    "Overview", "지역 분석", "트렌드", "업종별 추천", "이사/통신 수요",
    "AI 분석 리포트", "AI 챗봇", "이용 가이드", "내 분석 이력", "지역 현황 모니터링"
])

# ─── Tab 1: Overview ───
with tab1:
    summary = session.sql("""
        SELECT COUNT(*) AS T,
            SUM(CASE WHEN TRUE_OPPORTUNITY_LABEL='높은 기회' THEN 1 ELSE 0 END) AS O,
            SUM(CASE WHEN TRUE_OPPORTUNITY_LABEL='공급 과밀' THEN 1 ELSE 0 END) AS V,
            SUM(CASE WHEN TRUE_OPPORTUNITY_LABEL='보통' THEN 1 ELSE 0 END) AS B,
            ROUND(AVG(TOTAL_STORES),0) AS AVG_STORES,
            ROUND(AVG(TRUE_MISMATCH_SCORE),1) AS AVG_SCORE
        FROM URBAN_MISMATCH_AI.ANALYTICS.SUPPLY_DEMAND_MISMATCH
    """).to_pandas()
    c1,c2,c3,c4,c5,c6 = st.columns(6)
    c1.metric("분석 대상", str(summary['T'][0])+"개 동")
    c2.metric("높은 기회", str(summary['O'][0])+"개", help="소비 수요 대비 점포가 부족한 곳")
    c3.metric("공급 과밀", str(summary['V'][0])+"개", help="점포당 매출이 낮은 경쟁 과열 지역")
    c4.metric("보통", str(summary['B'][0])+"개")
    c5.metric("평균 점포수", str(int(summary['AVG_STORES'][0]))+"개")
    c6.metric("평균 기회점수", str(summary['AVG_SCORE'][0])+"점")

    st.markdown("---")
    dist_df = session.sql("""
        SELECT GU_NAME AS "구", DONG_NAME AS "동",
            ROUND(TRUE_MISMATCH_SCORE, 1) AS "기회점수", TRUE_OPPORTUNITY_LABEL AS "분류",
            ROUND(TOTAL_STORES, 0) AS "총점포수",
            ROUND(FOOD_STORES, 0) AS "음식점", ROUND(COFFEE_STORES, 0) AS "카페",
            ROUND(MEDICAL_STORES, 0) AS "의료", ROUND(RESIDENTS_PER_STORE, 1) AS "주민/점포",
            ROUND(CONSUMPTION_PER_RESIDENT, 0) AS "주민당소비",
            ROUND(AVG_INCOME, 0) AS "평균소득", TRANSPORT_GRADE AS "교통등급",
            AI_INSIGHT AS "AI분석"
        FROM URBAN_MISMATCH_AI.ANALYTICS.SUPPLY_DEMAND_MISMATCH ORDER BY TRUE_MISMATCH_SCORE DESC
    """).to_pandas()

    lc, rc = st.columns(2)
    with lc:
        st.markdown("#### 구별 평균 기회점수")
        chart_data = dist_df.groupby("구")["기회점수"].mean().reset_index()
        st.bar_chart(chart_data, x="구", y="기회점수")
    with rc:
        st.markdown("#### 구별 분류 분포")
        zone_counts = dist_df.groupby(["구", "분류"]).size().reset_index(name="동 수")
        st.dataframe(zone_counts, use_container_width=True)

    st.markdown("#### 전체 동 현황 (수요-공급 기반)")
    dist_df.index = pd.RangeIndex(1, len(dist_df) + 1)
    st.dataframe(dist_df, use_container_width=True, height=400)

    st.markdown("---")
    st.markdown("#### AI 예측: 3개월 후 미스매치 변화 전망")
    pred_df = session.sql("""
        SELECT GU_NAME AS "구", DONG_NAME AS "동",
            ROUND(MISMATCH_SCORE, 2) AS "현재점수",
            ROUND(PREDICTED_MISMATCH_3M, 2) AS "3개월후예측",
            DIRECTION AS "방향"
        FROM URBAN_MISMATCH_AI.ANALYTICS.MISMATCH_PREDICTIONS
        ORDER BY PREDICTED_MISMATCH_3M DESC
    """).to_pandas()
    pc1, pc2, pc3 = st.columns(3)
    pc1.metric("과열 심화 예측", str(len(pred_df[pred_df["방향"]=="상승(과열 심화)"])) + "개 동")
    pc2.metric("안정 유지", str(len(pred_df[pred_df["방향"]=="안정"])) + "개 동")
    pc3.metric("기회 증가 예측", str(len(pred_df[pred_df["방향"]=="하락(기회 증가)"])) + "개 동")
    pred_df.index = pd.RangeIndex(1, len(pred_df) + 1)
    st.dataframe(pred_df, use_container_width=True, height=300)


# ─── Tab 2: 지역 분석 ───
with tab2:
    st.markdown("### 서울 3개구 수요-공급 미스매치 지도")
    st.markdown("**파란색** = 수요 대비 공급 부족(기회), **빨간색** = 공급 과밀(경쟁 과열)")
    map_df = session.sql("""
        SELECT GU_NAME, DONG_NAME, ORIGINAL_MISMATCH AS MISMATCH_SCORE, ZONE_TYPE, AI_INSIGHT, DISTRICT_GEOM,
            TRUE_MISMATCH_SCORE, TRUE_OPPORTUNITY_LABEL, TOTAL_STORES,
            FOOD_STORES, COFFEE_STORES, MEDICAL_STORES,
            FOOD_REVENUE_PER_STORE, COFFEE_REVENUE_PER_STORE, RESIDENTS_PER_STORE
        FROM URBAN_MISMATCH_AI.ANALYTICS.SUPPLY_DEMAND_MISMATCH WHERE DISTRICT_GEOM IS NOT NULL
    """).to_pandas()
    make_map(map_df, use_true_score=True)

    st.markdown("---")
    st.markdown("### 핵심 인사이트")
    ic1, ic2, ic3 = st.columns(3)
    with ic1:
        st.markdown("**수요 vs 공급 (NEW)**")
        st.markdown("소비 금액은 높은데 점포 수가 적으면 **점포당 매출이 높아** 신규 진입 기회입니다. "
                     "반대로 점포는 많은데 소비가 적으면 경쟁 과열 상태입니다.")
    with ic2:
        st.markdown("**유동인구 vs 거주인구**")
        st.markdown("유동인구가 거주인구보다 훨씬 많으면 **출퇴근/관광 중심** 상권입니다. "
                     "이런 곳은 경기 변동에 민감하고, 주말 매출이 급감할 수 있습니다.")
    with ic3:
        st.markdown("**점포당 매출 비교**")
        st.markdown("같은 업종이라도 동별 점포당 매출 차이가 큽니다. "
                     "점포당 매출이 높은 동은 아직 수요를 채울 매장이 부족하다는 의미입니다.")

    st.markdown("---")
    st.markdown("### 구별 상세 분석")
    gu_choice = st.selectbox("구 선택", ["서초구", "영등포구", "중구"])
    gu_detail = session.sql(
        "SELECT s.GU_NAME AS \"구\", s.DONG_NAME AS \"동\", "
        "ROUND(s.TRUE_MISMATCH_SCORE, 1) AS \"종합\", "
        "ROUND(s.SCORE_CAFE, 1) AS \"카페\", "
        "ROUND(s.SCORE_FOOD, 1) AS \"음식점\", "
        "ROUND(s.SCORE_MEDICAL, 1) AS \"의료\", "
        "ROUND(s.SCORE_DAILY, 1) AS \"생활밀착\", "
        "ROUND(s.SCORE_PREMIUM, 1) AS \"프리미엄\", "
        "ROUND(s.SCORE_LEISURE, 1) AS \"여가\", "
        "s.TRUE_OPPORTUNITY_LABEL AS \"분류\", "
        "COALESCE(i.BEST_INDUSTRY_KR, '') AS \"AI 추천업종\", "
        "COALESCE(p.DIRECTION, '') AS \"3개월전망\", "
        "ROUND(s.TOTAL_STORES, 0) AS \"총점포\", "
        "ROUND(s.TOTAL_RESIDENTIAL_POP, 0) AS \"거주인구\", "
        "ROUND(s.AVG_INCOME, 0) AS \"평균소득\", "
        "s.TRANSPORT_GRADE AS \"교통등급\" "
        "FROM URBAN_MISMATCH_AI.ANALYTICS.SUPPLY_DEMAND_MISMATCH s "
        "LEFT JOIN URBAN_MISMATCH_AI.ANALYTICS.INDUSTRY_PREDICTIONS i "
        "  ON s.GU_NAME = i.GU_NAME AND s.DONG_NAME = i.DONG_NAME "
        "LEFT JOIN URBAN_MISMATCH_AI.ANALYTICS.MISMATCH_PREDICTIONS p "
        "  ON s.GU_NAME = p.GU_NAME AND s.DONG_NAME = p.DONG_NAME "
        "WHERE s.GU_NAME = '" + gu_choice + "' ORDER BY s.TRUE_MISMATCH_SCORE DESC"
    ).to_pandas()
    gu_detail.index = pd.RangeIndex(1, len(gu_detail) + 1)
    st.dataframe(gu_detail, use_container_width=True, height=350)


# ─── Tab 3: 트렌드 ───
with tab3:
    st.markdown("### 미스매치 점수 추이")
    st.markdown("점수 **하락** = 기회 증가, **상승** = 상업 과열 추세")
    dongs = session.sql("""
        SELECT DISTINCT GU_NAME || ' ' || DONG_NAME AS LABEL, DISTRICT_CODE
        FROM URBAN_MISMATCH_AI.ANALYTICS.MISMATCH_TREND ORDER BY LABEL
    """).to_pandas()
    selected = st.multiselect("동 선택", dongs["LABEL"].tolist(), default=dongs["LABEL"].tolist()[:3])
    if selected:
        codes = dongs[dongs["LABEL"].isin(selected)]["DISTRICT_CODE"].tolist()
        codes_str = ",".join(["'" + str(c) + "'" for c in codes])
        trend_df = session.sql(
            "SELECT GU_NAME || ' ' || DONG_NAME AS \"지역\", STANDARD_YEAR_MONTH AS \"월\", "
            "ROUND(MISMATCH_SCORE, 3) AS \"점수\" "
            "FROM URBAN_MISMATCH_AI.ANALYTICS.MISMATCH_TREND "
            "WHERE DISTRICT_CODE IN (" + codes_str + ") ORDER BY \"월\""
        ).to_pandas()
        st.line_chart(trend_df.pivot(index="월", columns="지역", values="점수"))

        st.markdown("---")
        st.markdown("### 소비 vs 유동인구")
        st.markdown("소비 증가 + 유동인구 감소 = **객단가 상승** 또는 **주민 소비 증가** 시그널")
        detail_df = session.sql(
            "SELECT STANDARD_YEAR_MONTH AS \"월\", "
            "ROUND(TOTAL_CONSUMPTION_AMT / 1000000, 1) AS \"소비_백만원\", "
            "ROUND(TOTAL_FLOATING_POP, 0) AS \"유동인구\" "
            "FROM URBAN_MISMATCH_AI.ANALYTICS.MISMATCH_TREND "
            "WHERE DISTRICT_CODE = '" + str(codes[0]) + "' ORDER BY \"월\""
        ).to_pandas()
        dc1, dc2 = st.columns(2)
        with dc1:
            st.caption(selected[0] + " - 소비 추이")
            st.area_chart(detail_df.set_index("월")["소비_백만원"])
        with dc2:
            st.caption(selected[0] + " - 유동인구 추이")
            st.area_chart(detail_df.set_index("월")["유동인구"])


# ─── Tab 4: 업종별 추천 ───
with tab4:
    st.markdown("### 업종별 맞춤 추천")
    st.markdown("업종 특성에 맞는 필터와 정렬이 자동 적용됩니다.")
    biz_type = st.selectbox("업종 선택", [
        "전체", "카페/커피숍", "음식점/식당", "프리미엄/고급 매장",
        "생활밀착형", "의료/건강", "패션/의류", "오락/여가", "부동산 투자"
    ])
    fm = {
        "전체": ("", "TRUE_MISMATCH_SCORE DESC"),
        "카페/커피숍": ("", "SCORE_CAFE DESC"),
        "음식점/식당": ("", "SCORE_FOOD DESC"),
        "프리미엄/고급 매장": ("", "SCORE_PREMIUM DESC"),
        "생활밀착형": ("", "SCORE_DAILY DESC"),
        "의료/건강": ("", "SCORE_MEDICAL DESC"),
        "패션/의류": ("", "SCORE_FASHION DESC"),
        "오락/여가": ("", "SCORE_LEISURE DESC"),
        "부동산 투자": ("AND AVG_APT_PRICE IS NOT NULL", "TRUE_MISMATCH_SCORE DESC"),
    }
    bd = {
        "전체": "미스매치 점수 낮은 순으로 모든 기회 지역을 보여줍니다.",
        "카페/커피숍": "**커피 소비 비중이 낮은** 주거 밀집 지역 우선 추천\n\n*예시: 스타벅스, 투썸, 메가커피, 개인 카페, 디저트 카페*",
        "음식점/식당": "**음식 소비 비중이 낮아** 외식 수요가 미충족된 곳\n\n*예시: 한식당, 분식, 중식, 일식, 배달전문점, 프랜차이즈*",
        "프리미엄/고급 매장": "**고소득 + 저소비** 지역. 구매력 있지만 매장 없는 곳\n\n*예시: 수입 브랜드, 고급 레스토랑, 와인바, 프리미엄 베이커리, 유기농 식품점*",
        "생활밀착형": "**거주인구 3천명+** 생활 편의시설 수요 높은 곳\n\n*예시: 편의점(CU/GS25), 세탁소, 미용실, 반찬가게, 문구점, 철물점*",
        "의료/건강": "**의료 소비 비중 낮은** 인프라 부족 지역\n\n*예시: 내과/치과/피부과, 약국, 헬스장, 필라테스, 요가, 한의원*",
        "패션/의류": "**의류 소비 적고 소득 높은** 패션 공백 지역\n\n*예시: SPA브랜드(자라/H&M), 편집샵, 스포츠의류, 아동복, 신발매장*",
        "오락/여가": "**여가 소비 적은** 수요 잠재 지역\n\n*예시: 노래방, 볼링장, PC방, 보드게임카페, 방탈출, 키즈카페, 스크린골프*",
        "부동산 투자": "**시세 저렴 + 기회점수 높은** 가치 상승 잠재 지역\n\n*예시: 소형 상가, 1층 점포, 오피스텔, 공유오피스*",
    }
    extra_filter, sort_col = fm[biz_type]
    st.info(bd[biz_type])

    reco_df = session.sql(
        "SELECT GU_NAME, DONG_NAME, TRUE_MISMATCH_SCORE AS MISMATCH_SCORE, "
        "TRUE_MISMATCH_SCORE, TRUE_OPPORTUNITY_LABEL, "
        "TRUE_OPPORTUNITY_LABEL AS ZONE_TYPE, "
        "SCORE_CAFE, SCORE_FOOD, SCORE_PREMIUM, SCORE_DAILY, "
        "SCORE_MEDICAL, SCORE_FASHION, SCORE_LEISURE, SCORE_ACCOMMODATION, "
        "COALESCE(AI_INSIGHT, '') AS AI_INSIGHT, DISTRICT_GEOM, "
        "COALESCE(ROUND(AVG_INCOME, 0), 0) AS AVG_INCOME, "
        "COALESCE(ROUND(TOTAL_RESIDENTIAL_POP, 0), 0) AS RES_POP, "
        "COALESCE(ROUND(TOTAL_FLOATING_POP, 0), 0) AS FLOAT_POP, "
        "COALESCE(ROUND(CONSUMPTION_PER_RESIDENT, 0), 0) AS CONS_PER_RES, "
        "COALESCE(ROUND(VISITOR_RESIDENT_RATIO, 2), 0) AS VISIT_RATIO, "
        "COALESCE(ROUND(AVG_APT_PRICE, 0), 0) AS APT_PRICE, "
        "COALESCE(TRANSPORT_GRADE, '') AS TRANSPORT_GRADE, "
        "COALESCE(NEARBY_STATION_CNT, 0) AS NEARBY_STATION_CNT, "
        "COALESCE(AVG_LIVING_SCORE, 0) AS AVG_LIVING_SCORE, "
        "TRUE_OPPORTUNITY_LABEL AS OPPORTUNITY_LABEL, "
        "COALESCE(TOTAL_STORES, 0) AS TOTAL_STORES, "
        "COALESCE(FOOD_STORES, 0) AS FOOD_STORES, "
        "COALESCE(COFFEE_STORES, 0) AS COFFEE_STORES, "
        "COALESCE(FOOD_REVENUE_PER_STORE, 0) AS FOOD_RPS, "
        "COALESCE(COFFEE_REVENUE_PER_STORE, 0) AS COFFEE_RPS, "
        "COALESCE(RESIDENTS_PER_STORE, 0) AS RESIDENTS_PER_STORE "
        "FROM URBAN_MISMATCH_AI.ANALYTICS.SUPPLY_DEMAND_MISMATCH "
        "WHERE 1=1 " + extra_filter + " ORDER BY " + sort_col + " LIMIT 10"
    ).to_pandas()

    if len(reco_df) > 0:
        st.markdown("#### 추천 지역 지도")
        make_map(reco_df, use_true_score=True)
        disp = reco_df[["GU_NAME","DONG_NAME","MISMATCH_SCORE","ZONE_TYPE","AVG_INCOME","RES_POP","FLOAT_POP","CONS_PER_RES","VISIT_RATIO","TRANSPORT_GRADE","NEARBY_STATION_CNT","AVG_LIVING_SCORE","APT_PRICE"]].copy()
        disp.columns = ["구","동","미스매치","분류","평균소득","거주인구","유동인구","주민당소비","방문자비율","교통등급","인접역수","주거점수","아파트시세"]
        disp.index = pd.RangeIndex(1, len(disp) + 1)
        st.dataframe(disp, use_container_width=True, height=300)

        st.markdown("#### 1위 추천 상세")
        top = reco_df.iloc[0]
        st.success(
            "**" + str(top['GU_NAME']) + " " + str(top['DONG_NAME']) + "** (점수: " + safe_round(top['MISMATCH_SCORE']) + ")\n\n"
            "| 지표 | 값 | 의미 |\n|---|---|---|\n"
            "| 거주인구 | " + safe_int(top['RES_POP']) + "명 | 잠재 고객 규모 |\n"
            "| 유동인구 | " + safe_int(top['FLOAT_POP']) + "명 | 외부 유입 |\n"
            "| 평균소득 | " + safe_int(top['AVG_INCOME']) + "만원 | 구매력 |\n"
            "| 주민당소비 | " + safe_int(top['CONS_PER_RES']) + "원 | 1인당 월소비 |\n"
            "| 교통등급 | " + str(top['TRANSPORT_GRADE']) + " | 인접역 " + str(top['NEARBY_STATION_CNT']) + "개 |\n"
            "| 주거점수 | " + safe_round(top['AVG_LIVING_SCORE'],1) + "점 | 리치고 AI 평가 |\n"
            "| 아파트시세 | " + safe_int(top['APT_PRICE']) + "만원 | 임대료 참고 |\n\n"
            "**AI 분석:** " + str(top['AI_INSIGHT'])
        )
        ml_pred = session.sql(
            "SELECT i.BEST_INDUSTRY_KR, i.SUITABILITY_LABEL, p.DIRECTION, "
            "ROUND(p.PREDICTED_MISMATCH_3M, 2) AS PRED_3M "
            "FROM URBAN_MISMATCH_AI.ANALYTICS.INDUSTRY_PREDICTIONS i "
            "LEFT JOIN URBAN_MISMATCH_AI.ANALYTICS.MISMATCH_PREDICTIONS p "
            "  ON i.GU_NAME = p.GU_NAME AND i.DONG_NAME = p.DONG_NAME "
            "WHERE i.GU_NAME = '" + str(top['GU_NAME']) + "' AND i.DONG_NAME = '" + str(top['DONG_NAME']) + "'"
        ).to_pandas()
        if len(ml_pred) > 0:
            mp = ml_pred.iloc[0]
            st.info(
                f"**AI 예측 결과** | "
                f"추천 업종: **{mp['BEST_INDUSTRY_KR']}** | "
                f"적합도: {mp['SUITABILITY_LABEL']} | "
                f"3개월 전망: {mp['DIRECTION']}"
            )
    else:
        st.warning("조건에 맞는 추천 지역이 없습니다.")

    st.markdown("---")
    st.markdown("### 리스크 지역 (상업 과밀)")
    st.markdown("경쟁이 심하고 임대료가 높아 **신규 진입 시 주의**가 필요한 곳입니다.")
    risk_df = session.sql("""
        SELECT GU_NAME, DONG_NAME, ORIGINAL_MISMATCH AS MISMATCH_SCORE, ZONE_TYPE, AI_INSIGHT, DISTRICT_GEOM,
            ROUND(VISITOR_RESIDENT_RATIO, 2) AS VISIT_RATIO, TRANSPORT_GRADE, TRUE_OPPORTUNITY_LABEL AS OPPORTUNITY_LABEL
        FROM URBAN_MISMATCH_AI.ANALYTICS.SUPPLY_DEMAND_MISMATCH
        WHERE ORIGINAL_MISMATCH > 1 ORDER BY ORIGINAL_MISMATCH DESC LIMIT 10
    """).to_pandas()
    if len(risk_df) > 0:
        make_map(risk_df)
        rd = risk_df[["GU_NAME","DONG_NAME","MISMATCH_SCORE","ZONE_TYPE","VISIT_RATIO","TRANSPORT_GRADE","AI_INSIGHT"]].copy()
        rd.columns = ["구","동","미스매치","분류","방문자비율","교통등급","AI분석"]
        rd.index = pd.RangeIndex(1, len(rd) + 1)
        st.dataframe(rd, use_container_width=True)

# ─── Tab 5: 이사/통신 수요 ───
with tab5:
    st.markdown("### 이사/통신 신규 설치 수요 (아정당 데이터)")
    st.markdown("인터넷 신규 설치 건수는 **실제 이사/입주**를 반영하는 선행 지표입니다. "
                "신규 설치가 많은 지역은 새로운 주민이 유입되고 있어 상권 수요가 증가합니다.")

    telecom_df = session.sql("""
        SELECT YEAR_MONTH AS "월", GU_NAME AS "구",
            TOTAL_CONTRACTS AS "총계약", TOTAL_OPENS AS "개통",
            BUNDLE_CONTRACTS AS "결합상품", STANDALONE_CONTRACTS AS "단독상품",
            ROUND(AVG_SALES, 0) AS "평균매출"
        FROM URBAN_MISMATCH_AI.ANALYTICS.TELECOM_DEMAND_BY_GU
        WHERE TOTAL_OPENS > 10
        ORDER BY "월" ASC, "구"
    """).to_pandas()

    import altair as alt

    st.markdown("#### 구별 월별 신규 계약 추이")
    if len(telecom_df) > 0:
        chart_df = telecom_df.copy()
        chart_df["월_label"] = chart_df["월"].astype(str).str[5:7].astype(int).astype(str) + "월"
        chart_df["연월"] = chart_df["월"].astype(str).str[:7]

        line = alt.Chart(chart_df).mark_line(point=alt.OverlayMarkDef(size=60)).encode(
            x=alt.X("연월:N", title="월", sort=None),
            y=alt.Y("총계약:Q", title="계약 건수"),
            color=alt.Color("구:N", title="구"),
            tooltip=[
                alt.Tooltip("구:N", title="구"),
                alt.Tooltip("월_label:N", title="월"),
                alt.Tooltip("총계약:Q", title="계약 건수", format=","),
                alt.Tooltip("개통:Q", title="개통 건수", format=","),
            ]
        ).properties(height=350)

        st.altair_chart(line, use_container_width=True)

    st.markdown("#### 최근월 결합 vs 단독 비율")
    st.markdown("결합상품(인터넷+TV+전화) 비율이 높으면 **가족 단위 입주**가 많다는 신호입니다.")
    telecom_latest = session.sql("""
        SELECT YEAR_MONTH AS "월", GU_NAME AS "구",
            TOTAL_CONTRACTS AS "총계약", TOTAL_OPENS AS "개통",
            BUNDLE_CONTRACTS AS "결합상품", STANDALONE_CONTRACTS AS "단독상품",
            ROUND(AVG_SALES, 0) AS "평균매출"
        FROM URBAN_MISMATCH_AI.ANALYTICS.TELECOM_DEMAND_BY_GU
        WHERE YEAR_MONTH = DATEADD('MONTH', -1, DATE_TRUNC('MONTH', CURRENT_DATE()))
        ORDER BY "구"
    """).to_pandas()
    if len(telecom_latest) > 0:
        telecom_latest["월"] = telecom_latest["월"].astype(str).str[5:7].astype(int).astype(str) + "월"
        telecom_latest.index = pd.RangeIndex(1, len(telecom_latest) + 1)
        st.dataframe(telecom_latest, use_container_width=True)

    st.markdown("---")
    st.markdown("### 렌탈 수요 트렌드")
    st.markdown("정수기/공기청정기 등 렌탈 계약은 **신규 입주 후 생활 정착** 시점을 보여줍니다.")
    rental_df = session.sql("""
        SELECT YEAR_MONTH AS "월", RENTAL_MAIN_CATEGORY AS "대분류",
            SUM(CONTRACT_COUNT) AS "계약수", SUM(OPEN_COUNT) AS "개통수",
            ROUND(AVG(AVG_NET_SALES), 0) AS "평균매출"
        FROM SOUTH_KOREA_TELECOM_SUBSCRIPTION_ANALYTICS__CONTRACTS_MARKETING_AND_CALL_CENTER_INSIGHTS_BY_REGION.TELECOM_INSIGHTS.V06_RENTAL_CATEGORY_TRENDS
        WHERE INSTALL_STATE = '서울' AND OPEN_COUNT > 0
        GROUP BY "월", RENTAL_MAIN_CATEGORY
        ORDER BY "월" DESC, "계약수" DESC
    """).to_pandas()

# ─── Tab 6: AI 분석 리포트 ───
with tab6:
    st.markdown("### AI 분석 리포트 (Cortex AI + 수치화 평가)")
    st.markdown("사용자 정보와 지역 데이터를 결합하여 **12개 항목 / 100점 만점** 세분화 평가와 **전문 컨설턴트 수준 AI 분석**을 생성합니다.")

    dong_list = session.sql("""
        SELECT GU_NAME || ' ' || DONG_NAME AS LABEL, GU_NAME, DONG_NAME, DISTRICT_CODE
        FROM URBAN_MISMATCH_AI.ANALYTICS.LATEST_MISMATCH_REPORT ORDER BY MISMATCH_SCORE
    """).to_pandas()

    with st.form("analysis_form"):
        st.markdown("#### 기본 정보")
        col_a, col_b = st.columns(2)
        with col_a:
            user_type = st.radio("사용자 유형", ["예비창업자", "현재 자영업자"], horizontal=True)
            selected_dong = st.selectbox("분석할 동", dong_list["LABEL"].tolist())
            business_type = st.selectbox("업종 (선택)", ["미선택", "음식점", "카페", "소매업", "서비스업", "미용/뷰티", "기타"])
            product = st.text_input("주요 판매 품목 (선택)")
        with col_b:
            avg_unit_price = st.number_input("객단가 (원, 0=미입력)", min_value=0, value=0, step=1000)
            monthly_revenue = st.number_input("월 매출 (원, 0=미입력)", min_value=0, value=0, step=100000)
            monthly_rent = st.number_input("월세 (원, 0=미입력)", min_value=0, value=0, step=100000)

        st.markdown("#### 추가 정보 (선택)")
        col_c, col_d = st.columns(2)
        with col_c:
            employee_count = st.number_input("직원 수 (본인 포함, 0=미입력)", min_value=0, value=0, step=1)
            operating_hours = st.text_input("영업시간 (예: 09:00-22:00)")
            initial_investment = st.number_input("초기 투자금 (원, 0=미입력)", min_value=0, value=0, step=1000000)
        with col_d:
            target_revenue = st.number_input("목표 월매출 (원, 0=미입력)", min_value=0, value=0, step=100000)
            competitor_count = st.number_input("인근 경쟁 매장 수 (0=미입력)", min_value=0, value=0, step=1)
        additional_info = st.text_area("기타 참고사항 (자유 입력)", placeholder="예: 배달 위주 운영 예정, 2층 매장, 프랜차이즈 고려 중, 공동 창업 등")

        col_btn1, col_btn2 = st.columns(2)
        with col_btn1:
            analyze_btn = st.form_submit_button("🔍 분석 시작", type="primary", use_container_width=True)
        with col_btn2:
            save_btn = st.form_submit_button("💾 프로필 저장", use_container_width=True)

    biz = business_type if business_type != "미선택" else "기타"

    if analyze_btn:
        dong_row = dong_list[dong_list["LABEL"] == selected_dong].iloc[0]
        dong_code = str(dong_row["DISTRICT_CODE"])

        dong_data = session.sql(
            "SELECT ROUND(TRUE_MISMATCH_SCORE,1) AS SCORE, TRUE_OPPORTUNITY_LABEL AS OPP_LABEL, ZONE_TYPE, "
            "COALESCE(ROUND(TOTAL_RESIDENTIAL_POP,0),0) AS RES_POP, "
            "COALESCE(ROUND(TOTAL_FLOATING_POP,0),0) AS FLOAT_POP, "
            "COALESCE(ROUND(TOTAL_WORKING_POP,0),0) AS WORK_POP, "
            "COALESCE(ROUND(TOTAL_VISITING_POP,0),0) AS VISIT_POP, "
            "COALESCE(ROUND(AVG_INCOME,0),0) AS INCOME, "
            "COALESCE(ROUND(AVG_APT_PRICE,0),0) AS APT_PRICE, "
            "COALESCE(ROUND(CONSUMPTION_PER_RESIDENT,0),0) AS CPR, "
            "COALESCE(ROUND(VISITOR_RESIDENT_RATIO,2),0) AS VRR, "
            "COALESCE(TRANSPORT_GRADE,'') AS TRANSPORT, "
            "COALESCE(NEARBY_STATION_CNT,0) AS STATIONS, "
            "COALESCE(ROUND(AVG_LIVING_SCORE,1),0) AS LIVING, "
            "COALESCE(ROUND(FB_CONSUMPTION_SHARE*100,1),0) AS FB_PCT, "
            "COALESCE(ROUND(COFFEE_SHARE*100,1),0) AS COFFEE_PCT, "
            "COALESCE(ROUND(MEDICAL_SHARE*100,1),0) AS MED_PCT, "
            "COALESCE(ROUND(ENTERTAINMENT_SHARE*100,1),0) AS ENT_PCT, "
            "COALESCE(FOOD_STORES,0) AS FOOD_STORES, "
            "COALESCE(COFFEE_STORES,0) AS COFFEE_STORES, "
            "COALESCE(MEDICAL_STORES,0) AS MEDICAL_STORES, "
            "COALESCE(CLOTHING_STORES,0) AS CLOTHING_STORES, "
            "COALESCE(ENTERTAINMENT_STORES,0) AS ENT_STORES, "
            "COALESCE(ACCOMMODATION_STORES,0) AS ACCOM_STORES, "
            "COALESCE(TOTAL_STORES,0) AS TOTAL_STORES, "
            "COALESCE(FOOD_REVENUE_PER_STORE,0) AS FOOD_RPS, "
            "COALESCE(COFFEE_REVENUE_PER_STORE,0) AS COFFEE_RPS, "
            "COALESCE(RESIDENTS_PER_STORE,0) AS RPS "
            "FROM URBAN_MISMATCH_AI.ANALYTICS.SUPPLY_DEMAND_MISMATCH "
            "WHERE DISTRICT_CODE = '" + dong_code + "'"
        ).to_pandas()

        report = generate_scoring_report(
            user_type, selected_dong, biz, product or "미입력",
            avg_unit_price, monthly_revenue, monthly_rent, dong_data,
            employee_count or None, operating_hours or None,
            initial_investment or None, target_revenue or None,
            competitor_count or None
        )

        st.markdown("---")
        st.markdown("## 📊 수치화 평가 리포트")
        render_scoring_report(report)

        st.markdown("---")
        st.markdown("## 🤖 Cortex AI 전문가 분석")
        with st.spinner("20년 경력 전문 컨설턴트 수준의 분석을 생성 중입니다... (약 10-20초)"):
            d = dong_data.iloc[0]
            user_info_block = f"사용자 유형: {user_type}\n업종: {biz}\n판매품목: {product or '미입력'}\n"
            if avg_unit_price > 0: user_info_block += f"객단가: {avg_unit_price:,}원\n"
            if monthly_revenue > 0: user_info_block += f"월매출: {monthly_revenue:,}원\n"
            if monthly_rent > 0: user_info_block += f"월세: {monthly_rent:,}원\n"
            if employee_count and employee_count > 0: user_info_block += f"직원수: {employee_count}명\n"
            if operating_hours: user_info_block += f"영업시간: {operating_hours}\n"
            if initial_investment and initial_investment > 0: user_info_block += f"초기투자금: {initial_investment:,}원\n"
            if target_revenue and target_revenue > 0: user_info_block += f"목표월매출: {target_revenue:,}원\n"
            if competitor_count and competitor_count > 0: user_info_block += f"인근경쟁매장: {competitor_count}개\n"
            if additional_info: user_info_block += f"추가정보: {additional_info}\n"

            prompt = (
                "당신은 20년 이상 경력의 서울시 상권 분석 및 창업 컨설팅 전문가입니다. "
                "아래 데이터를 종합하여 실제 컨설팅 보고서 수준의 상세한 분석 리포트를 한국어로 작성하세요. "
                "단순 나열이 아닌, 데이터 간의 인과관계를 분석하고 구체적인 수치를 근거로 제시하세요.\n\n"
                "=== 지역 데이터 ===\n"
                "지역: " + selected_dong + "\n"
                "미스매치 점수: " + str(d['SCORE']) + " (분류: " + str(d['ZONE_TYPE']) + ")\n"
                "거주인구: " + str(d['RES_POP']) + "명 | 유동인구: " + str(d['FLOAT_POP']) + "명\n"
                "직장인구: " + str(d['WORK_POP']) + "명 | 방문인구: " + str(d['VISIT_POP']) + "명\n"
                "평균소득: " + str(d['INCOME']) + "만원 | 주민당소비: " + str(d['CPR']) + "원\n"
                "방문자/거주자비율: " + str(d['VRR']) + "배\n"
                "아파트시세: " + str(d['APT_PRICE']) + "만원\n"
                "교통: " + str(d['TRANSPORT']) + " (인접역 " + str(d['STATIONS']) + "개)\n"
                "주거점수: " + str(d['LIVING']) + "점\n"
                "음식소비비중: " + str(d['FB_PCT']) + "% | 커피: " + str(d['COFFEE_PCT']) + "% | 의료: " + str(d['MED_PCT']) + "% | 오락: " + str(d['ENT_PCT']) + "%\n"
                "=== 공급(점포) 데이터 ===\n"
                "기회점수: " + str(d.get('SCORE', 'N/A')) + "/100 (" + str(d.get('OPP_LABEL', '')) + ")\n"
                "총점포수: " + str(int(d.get('TOTAL_STORES', 0))) + "개\n"
                "음식점: " + str(int(d.get('FOOD_STORES', 0))) + "개 (점포당매출 " + str(int(d.get('FOOD_RPS', 0))) + "원)\n"
                "카페: " + str(int(d.get('COFFEE_STORES', 0))) + "개 (점포당매출 " + str(int(d.get('COFFEE_RPS', 0))) + "원)\n"
                "의료: " + str(int(d.get('MEDICAL_STORES', 0))) + "개\n"
                "의류: " + str(int(d.get('CLOTHING_STORES', 0))) + "개\n"
                "엔터테인먼트: " + str(int(d.get('ENT_STORES', 0))) + "개\n"
                "숙박: " + str(int(d.get('ACCOM_STORES', 0))) + "개\n"
                "주민1명당점포비율: " + str(round(float(d.get('RPS', 0)), 1)) + "\n"
                "※ 점포당매출이 높으면 수요>공급(진입기회), 낮으면 공급과잉(회피)\n\n"
                "수치평가 종합점수: " + str(report['total_score']) + "/100\n\n"
                "=== 사용자 정보 ===\n" + user_info_block + "\n"
                "=== 보고서 형식 (반드시 이 구조를 따르세요) ===\n\n"
                "## 1. 지역 종합 진단\n"
                "이 지역의 상권 특성, 인구 구조, 소비 패턴을 데이터 근거와 함께 3-4문장으로 진단하세요.\n\n"
                "## 2. 핵심 기회 요인 (3개)\n"
                "각 기회마다 근거 데이터를 명시하고, 왜 기회인지 인과관계를 설명하세요.\n\n"
                "## 3. 리스크 요인 및 대응 전략 (2-3개)\n"
                "각 리스크에 대해 발생 가능성과 구체적인 대응 방안을 제시하세요.\n\n"
                "## 4. 수익성 시뮬레이션\n"
                + (f"입력된 객단가({avg_unit_price:,}원), 월매출({monthly_revenue:,}원), 월세({monthly_rent:,}원)를 기반으로 " if avg_unit_price > 0 and monthly_revenue > 0 else "이 지역의 업종 평균 데이터를 기반으로 ")
                + "예상 손익구조(매출-재료비-인건비-임대료-기타=순이익)를 산출하고, 손익분기점 달성 조건을 제시하세요.\n\n"
                "## 5. 향후 6개월-1년 전망\n"
                "이 지역의 상권 변화 방향을 예측하고, 시기별 전략을 제안하세요.\n\n"
                "## 6. 수익 개선 전략 TOP 5\n"
                "즉시 실행 가능한 구체적 전략 5가지를 우선순위와 예상 효과(매출 증가율 등)와 함께 제시하세요.\n\n"
                "## 7. 종합 투자 매력도\n"
                "5점 만점으로 평가하고, 최종 한줄 요약을 작성하세요."
            )

            result = session.sql(
                "SELECT SNOWFLAKE.CORTEX.COMPLETE('mistral-large2', '" + prompt.replace("'", "''") + "') AS REPORT"
            ).to_pandas()
            ai_text = result['REPORT'][0]
            st.markdown(ai_text)

        st.session_state["last_scoring_report"] = report
        st.session_state["last_ai_text"] = ai_text

        from datetime import datetime
        dl_col1, dl_col2 = st.columns(2)
        with dl_col1:
            try:
                pdf_bytes = generate_pdf_bytes(report, ai_text)
                st.download_button(
                    label="📥 PDF 리포트 다운로드",
                    data=pdf_bytes,
                    file_name=f"상권분석_{selected_dong.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.pdf",
                    mime="application/pdf",
                    key="rpt_pdf"
                )
            except Exception as e:
                st.warning(f"PDF 생성 실패: {e}")
        with dl_col2:
            report_full_text = build_report_text(report, ai_text)
            st.download_button(
                label="📥 TXT 리포트 다운로드",
                data=report_full_text.encode('utf-8'),
                file_name=f"상권분석_{selected_dong.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d')}.txt",
                mime="text/plain",
                key="rpt_txt"
            )

    if save_btn:
        try:
            current_user = session.sql("SELECT CURRENT_USER()").to_pandas().iloc[0][0]
            ai_text_to_save = st.session_state.get("last_ai_text", "")
            saved_report = st.session_state.get("last_scoring_report", None)
            score_json = ""
            total_s = 0
            if saved_report:
                import json as json_lib
                score_data = []
                for cat in saved_report["categories"]:
                    for item in cat["items"]:
                        score_data.append({"cat": cat["name"], "name": item["name"], "score": item["score"], "max": item["max"], "summary": item.get("summary", ""), "desc": item["desc"]})
                score_json = json_lib.dumps(score_data, ensure_ascii=False)
                total_s = saved_report["total_score"]

            session.sql(
                "INSERT INTO URBAN_MISMATCH_AI.ANALYTICS.USER_ANALYSIS_PROFILES "
                "(USERNAME, USER_TYPE, REGION, BUSINESS_TYPE, PRODUCT_CATEGORY, AVG_UNIT_PRICE, MONTHLY_REVENUE, MONTHLY_RENT, "
                "EMPLOYEE_COUNT, OPERATING_HOURS, INITIAL_INVESTMENT, TARGET_MONTHLY_REVENUE, COMPETITOR_COUNT, ADDITIONAL_INFO, "
                "REPORT_SCORES, REPORT_AI_TEXT, TOTAL_SCORE) "
                "VALUES ('" + str(current_user) + "', '" + user_type + "', '" + selected_dong + "', '"
                + biz + "', '" + (product or "").replace("'", "''") + "', "
                + str(avg_unit_price) + ", " + str(monthly_revenue) + ", " + str(monthly_rent) + ", "
                + str(employee_count or "NULL") + ", "
                + ("'" + (operating_hours or "").replace("'", "''") + "'" if operating_hours else "NULL") + ", "
                + str(initial_investment or "NULL") + ", "
                + str(target_revenue or "NULL") + ", "
                + str(competitor_count or "NULL") + ", "
                + ("'" + (additional_info or "").replace("'", "''") + "'" if additional_info else "NULL") + ", "
                + ("'" + score_json.replace("'", "''") + "'" if score_json else "NULL") + ", "
                + ("'" + ai_text_to_save.replace("'", "''") + "'" if ai_text_to_save else "NULL") + ", "
                + str(total_s) + ")"
            ).collect()
            st.success("✅ 프로필과 분석 결과가 저장되었습니다! '내 분석 이력' 탭에서 확인하세요.")
        except Exception as e:
            st.error("저장 실패: " + str(e))


# ─── Tab 7: AI 챗봇 ───
with tab7:
    st.markdown("### AI 상권 분석 챗봇")
    st.markdown("상권 데이터에 대해 자연어로 질문하세요. **Snowflake Cortex AI**가 데이터를 분석하여 답변합니다.")
    st.markdown("*예시: \"서초구에서 카페 창업하기 좋은 동은?\", \"소득이 가장 높은 지역은?\", \"역세권이면서 기회 지역인 곳은?\"*")

    if "chat_history" not in st.session_state:
        st.session_state.chat_history = []

    user_input = st.text_input("질문을 입력하세요", key="chat_input")

    if user_input:
        with st.spinner("분석 중..."):
            chat_prompt = (
                "당신은 서울시 상권-주거 미스매치 분석 전문가입니다. "
                "URBAN_MISMATCH_AI.ANALYTICS.LATEST_MISMATCH_REPORT 테이블에는 서울시 서초구, 영등포구, 중구의 118개 법정동 데이터가 있습니다. "
                "컬럼: GU_NAME(구), DONG_NAME(동), MISMATCH_SCORE(미스매치점수, 낮을수록 기회), ZONE_TYPE(기회 지역/균형 지역/상업 과밀), "
                "TOTAL_RESIDENTIAL_POP(거주인구), TOTAL_FLOATING_POP(유동인구), AVG_INCOME(평균소득), "
                "CONSUMPTION_PER_RESIDENT(주민당소비), AVG_APT_PRICE(아파트시세), TRANSPORT_GRADE(교통등급), "
                "NEARBY_STATION_CNT(인접역수), AVG_LIVING_SCORE(주거점수), "
                "COFFEE_SHARE(커피소비비중), FOOD_SHARE(음식소비비중), MEDICAL_SHARE(의료소비비중), AI_INSIGHT(AI분석).\n\n"
                "사용자 질문에 대해 SQL을 생성하고 실행한 결과를 바탕으로 친절하게 한국어로 답변하세요. "
                "SQL은 보여주지 말고 분석 결과만 자연스럽게 설명하세요.\n\n"
                "질문: " + user_input
            )

            try:
                sql_gen = session.sql(
                    "SELECT SNOWFLAKE.CORTEX.COMPLETE('mistral-large2', '" + chat_prompt.replace("'", "''") + "') AS ANSWER"
                ).to_pandas()
                answer = sql_gen['ANSWER'][0]
            except Exception as e:
                answer = "죄송합니다, 질문을 처리하는 중 오류가 발생했습니다: " + str(e)

            st.session_state.chat_history.append({"q": user_input, "a": answer})

    if st.session_state.chat_history:
        for i, chat in enumerate(reversed(st.session_state.chat_history)):
            st.markdown("**Q: " + chat["q"] + "**")
            st.markdown(chat["a"])
            if i < len(st.session_state.chat_history) - 1:
                st.markdown("---")
                
# ─── Tab 8: 이용 가이드 ───
with tab8:
    st.markdown("## 이용 가이드")
    st.markdown("**서울시 3개구(서초구, 영등포구, 중구)** 118개 법정동 대상, **7종 데이터 결합** 분석")

    st.markdown("---")
    st.markdown("### 미스매치 점수란?")
    st.markdown("**\"이 지역에서 이 업종으로 창업하면 기회가 있는가?\"**를 0~100점으로 수치화한 것입니다.\n\n"
        "7종 데이터를 **업종별 특성에 맞는 가중치**로 결합하여, 같은 지역이라도 업종에 따라 다른 점수가 나옵니다.\n\n"
        "| 점수 | 의미 | 색상 |\n|---|---|---|\n"
        "| **70+** | 높은 기회 - 수요 대비 공급 부족 | 파랑 |\n"
        "| **40~70** | 보통 - 균형 상태 | 초록 |\n"
        "| **40 미만** | 공급 과밀 - 경쟁 과열 | 빨강 |")

    st.markdown("---")
    st.markdown("### 점수 계산에 사용되는 7개 차원")
    st.markdown(
        "| 차원 | 데이터 출처 (제공자) | 측정 내용 |\n|---|---|---|\n"
        "| **점포당 매출** | 신한카드 소비 (SPH) ÷ 점포 수 (공공API) | 수요/공급 핵심 비율 |\n"
        "| **거주인구 밀도** | SKT 유동인구 (SPH) | 잠재 고객 규모 |\n"
        "| **소득/자산 수준** | KCB 소득·자산 (SPH) | 구매력·가격대 적합성 |\n"
        "| **교통 접근성** | 지하철역 수·승하차 인원 (Dataknows) | 외부 고객 유입 가능성 |\n"
        "| **가족 밀집도** | 아파트 세대수 (Dataknows) + 결합상품 비율 (AJD) | 가족 단위 수요 |\n"
        "| **주거 환경** | 아파트 시세·생활편의 점수 (Dataknows) | 임대료 수준·생활 인프라 |\n"
        "| **유동인구 비율** | 방문자/거주자 비율 (SPH) | 외부 유입 상권 특성 |")

    st.markdown("---")
    st.markdown("### 업종별 맞춤 가중치")
    st.markdown("각 업종의 특성에 따라 7개 차원의 가중치가 다르게 적용됩니다.\n\n"
        "| 차원 | 카페 | 음식점 | 프리미엄 | 생활밀착 | 의료 | 패션 | 여가 | 숙박 |\n"
        "|------|------|--------|---------|---------|------|------|------|------|\n"
        "| 점포당매출 | 25% | 25% | 20% | 15% | 25% | 20% | 25% | 25% |\n"
        "| 거주인구 | 15% | 20% | 10% | **30%** | 20% | 10% | **25%** | 5% |\n"
        "| 소득/자산 | 10% | 5% | **30%** | 5% | 10% | **25%** | 5% | 10% |\n"
        "| 교통접근성 | **20%** | 15% | 15% | 5% | 10% | **20%** | 10% | **20%** |\n"
        "| 가족밀집도 | 5% | 10% | 5% | **25%** | 15% | 5% | **20%** | 5% |\n"
        "| 주거환경 | 10% | 10% | 15% | 10% | 10% | 10% | 5% | 10% |\n"
        "| 유동인구 | 15% | 15% | 5% | 10% | 10% | 10% | 10% | **25%** |\n\n"
        "**읽는 법:** 카페는 교통접근성(20%)과 점포당매출(25%)이 핵심입니다. "
        "생활밀착형은 거주인구(30%)와 가족밀집도(25%)가 가장 중요합니다. "
        "프리미엄 매장은 소득/자산(30%)이 압도적으로 높습니다.")

    st.markdown("---")
    st.markdown("### 주요 지표 설명")
    st.markdown("| 지표 | 의미 | 활용 |\n|---|---|---|\n"
        "| 미스매치 점수 | 수요/공급 종합 미스매치 (0~100) | 높을수록 기회 |\n"
        "| 업종별 점수 | 업종 특성 반영 맞춤 점수 (0~100) | 업종별 추천 탭에서 활용 |\n"
        "| 점포당 매출 | 소비금액 ÷ 점포수 | 높으면 공급 부족 = 기회 |\n"
        "| 총 점포수 | 해당 동의 전체 매장 수 | 경쟁 강도 |\n"
        "| 거주인구 | 주민 수 (SKT) | 잠재 고객 규모 |\n"
        "| 유동인구 | 방문/통과 인구 (SKT) | 매장 노출도 |\n"
        "| 평균소득 | 연소득 (KCB) | 가격대 결정 |\n"
        "| 주민당 소비 | 1인 월 카드소비 (신한) | 소비력 |\n"
        "| 교통등급 | 지하철 접근성 (리치고) | 역세권/준역세권/도보권 |\n"
        "| 아파트 세대수 | 가족 밀집도 (리치고) | 가족 단위 수요 |\n"
        "| 결합상품 비율 | 인터넷+TV 결합 (아정당) | 가족 입주 지표 |\n"
        "| 아파트시세 | 매매 추정가 (리치고) | 임대료 수준 참고 |\n"
        "| 인터넷 신규설치 | 이사/입주 건수 (아정당) | 신규 유입 수요 |")

    st.markdown("---")
    st.markdown("### 데이터 출처 (7종)")
    st.markdown("| 데이터 | 제공자 | 유형 | 미스매치 점수 활용 |\n|---|---|---|---|\n"
        "| 신한카드 업종별 소비 | SPH | Marketplace | 점포당 매출 분자 (수요) |\n"
        "| SKT 유동인구/거주인구 | SPH | Marketplace | 거주인구 밀도, 유동인구 비율 |\n"
        "| KCB 소득/자산 | SPH | Marketplace | 소득/자산 수준 |\n"
        "| 아파트 시세/단지/생활점수 | Dataknows | Marketplace | 주거환경, 가족밀집도 |\n"
        "| 지하철 접근성/승하차 | Dataknows | Marketplace | 교통 접근성 |\n"
        "| 이사/렌탈/결합상품 | AJD | Marketplace | 가족밀집도, 인구유입 |\n"
        "| **업종별 점포 수** | **소상공인진흥공단** | **공공API** | **점포당 매출 분모 (공급)** |")
    st.markdown("---")
    st.caption("Urban Mismatch Intelligence | Snowflake Marketplace 6종 + 공공API 1종 · Snowflake Cortex AI 기반")

# ─── Tab 9: 내 분석 이력 ───
with tab9:
    st.markdown("### 📁 내 분석 이력")
    st.markdown("저장된 분석 결과를 조회하고, 이전 리포트를 다운로드할 수 있습니다.")
    try:
        current_user = session.sql("SELECT CURRENT_USER()").to_pandas().iloc[0][0]
        profiles = session.sql(
            "SELECT PROFILE_ID, USER_TYPE, REGION, BUSINESS_TYPE, "
            "PRODUCT_CATEGORY, AVG_UNIT_PRICE, MONTHLY_REVENUE, MONTHLY_RENT, "
            "TOTAL_SCORE, CREATED_AT, "
            "CASE WHEN REPORT_AI_TEXT IS NOT NULL THEN 'O' ELSE 'X' END AS AI_REPORT "
            "FROM URBAN_MISMATCH_AI.ANALYTICS.USER_ANALYSIS_PROFILES "
            "WHERE USERNAME = '" + str(current_user) + "' ORDER BY CREATED_AT DESC"
        ).to_pandas()

        if len(profiles) > 0:
            display_df = profiles[["PROFILE_ID", "REGION", "BUSINESS_TYPE", "TOTAL_SCORE", "AI_REPORT", "CREATED_AT"]].copy()
            display_df.columns = ["ID", "지역", "업종", "종합점수", "AI분석", "저장일시"]
            display_df.index = pd.RangeIndex(1, len(display_df) + 1)
            st.dataframe(display_df, use_container_width=True)

            selected_id = st.selectbox(
                "조회할 프로필 선택", profiles["PROFILE_ID"].tolist(),
                format_func=lambda x: (
                    str(profiles[profiles["PROFILE_ID"]==x]["REGION"].values[0]) + " - " +
                    str(profiles[profiles["PROFILE_ID"]==x]["BUSINESS_TYPE"].values[0]) + " (" +
                    str(profiles[profiles["PROFILE_ID"]==x]["CREATED_AT"].values[0])[:10] + ")"
                ),
                key="history_select"
            )

            col_h1, col_h2, col_h3 = st.columns(3)
            view_detail = col_h1.button("📄 상세 조회", key="history_view", use_container_width=True)
            reanalyze = col_h2.button("🔄 재분석 실행", key="history_reanalyze", use_container_width=True)
            download_hist = col_h3.button("📥 리포트 다운로드", key="history_download", use_container_width=True)

            if view_detail:
                detail = session.sql(
                    "SELECT * FROM URBAN_MISMATCH_AI.ANALYTICS.USER_ANALYSIS_PROFILES "
                    "WHERE PROFILE_ID = " + str(selected_id)
                ).to_pandas()
                if len(detail) > 0:
                    row = detail.iloc[0]
                    st.markdown("---")
                    st.markdown(f"#### {row['REGION']} — {row['BUSINESS_TYPE']} 분석 결과")
                    mc1, mc2, mc3, mc4 = st.columns(4)
                    mc1.metric("종합점수", f"{int(row['TOTAL_SCORE']) if pd.notna(row['TOTAL_SCORE']) else 'N/A'}/100")
                    mc2.metric("객단가", f"{int(row['AVG_UNIT_PRICE']):,}원" if row['AVG_UNIT_PRICE'] else "미입력")
                    mc3.metric("월매출", f"{int(row['MONTHLY_REVENUE']):,}원" if row['MONTHLY_REVENUE'] else "미입력")
                    mc4.metric("월세", f"{int(row['MONTHLY_RENT']):,}원" if row['MONTHLY_RENT'] else "미입력")

                    if pd.notna(row.get('REPORT_SCORES')) and row['REPORT_SCORES']:
                        st.markdown("##### 항목별 점수")
                        import json as json_lib
                        try:
                            scores = json_lib.loads(row['REPORT_SCORES'])
                            for s in scores:
                                ratio = s["score"] / s["max"] if s["max"] > 0 else 0
                                icon = "🟢" if ratio >= 0.7 else "🟡" if ratio >= 0.5 else "🔴"
                                with st.expander(f"{icon} [{s['cat']}] {s['name']} — {s['score']}/{s['max']}점 | {s.get('summary', '')}"):
                                    st.write(s["desc"])
                                    st.progress(ratio)
                        except Exception:
                            st.text(row['REPORT_SCORES'])

                    if pd.notna(row.get('REPORT_AI_TEXT')) and row['REPORT_AI_TEXT']:
                        st.markdown("##### Cortex AI 분석")
                        st.markdown(row['REPORT_AI_TEXT'])

            if reanalyze:
                row = profiles[profiles["PROFILE_ID"] == selected_id].iloc[0]
                region_label = str(row["REGION"])
                with st.spinner("재분석 중..."):
                    dong_data = session.sql(
                        "SELECT ROUND(TRUE_MISMATCH_SCORE,1) AS SCORE, "
                        "COALESCE(ROUND(TOTAL_RESIDENTIAL_POP,0),0) AS RES_POP, "
                        "COALESCE(ROUND(TOTAL_FLOATING_POP,0),0) AS FLOAT_POP, "
                        "COALESCE(TRANSPORT_GRADE,'') AS TRANSPORT, "
                        "COALESCE(NEARBY_STATION_CNT,0) AS STATIONS, "
                        "COALESCE(ROUND(AVG_LIVING_SCORE,1),0) AS LIVING, "
                        "COALESCE(ROUND(AVG_INCOME,0),0) AS INCOME, "
                        "COALESCE(ROUND(CONSUMPTION_PER_RESIDENT,0),0) AS CPR "
                        "FROM URBAN_MISMATCH_AI.ANALYTICS.SUPPLY_DEMAND_MISMATCH "
                        "WHERE GU_NAME || ' ' || DONG_NAME = '" + region_label + "'"
                    ).to_pandas()
                    report = generate_scoring_report(
                        str(row["USER_TYPE"]), region_label, str(row["BUSINESS_TYPE"]),
                        str(row["PRODUCT_CATEGORY"] or "미입력"),
                        int(row["AVG_UNIT_PRICE"] or 0), int(row["MONTHLY_REVENUE"] or 0), int(row["MONTHLY_RENT"] or 0),
                        dong_data if len(dong_data) > 0 else None
                    )
                    st.markdown("---")
                    render_scoring_report(report)

            if download_hist:
                detail = session.sql(
                    "SELECT * FROM URBAN_MISMATCH_AI.ANALYTICS.USER_ANALYSIS_PROFILES "
                    "WHERE PROFILE_ID = " + str(selected_id)
                ).to_pandas()
                if len(detail) > 0:
                    row = detail.iloc[0]
                    report_stub = {
                        "user_type": row["USER_TYPE"], "region": row["REGION"],
                        "business_type": row["BUSINESS_TYPE"], "product": row.get("PRODUCT_CATEGORY", "") or "",
                        "avg_unit_price": int(row["AVG_UNIT_PRICE"] or 0),
                        "monthly_revenue": int(row["MONTHLY_REVENUE"] or 0),
                        "monthly_rent": int(row["MONTHLY_RENT"] or 0),
                        "total_score": int(row["TOTAL_SCORE"] or 0),
                        "categories": []
                    }
                    if pd.notna(row.get("REPORT_SCORES")) and row["REPORT_SCORES"]:
                        import json as json_lib
                        try:
                            scores = json_lib.loads(row["REPORT_SCORES"])
                            cats = {}
                            for s in scores:
                                cn = s["cat"]
                                if cn not in cats:
                                    cats[cn] = {"name": cn, "max": 0, "score": 0, "items": []}
                                cats[cn]["items"].append(s)
                                cats[cn]["score"] += s["score"]
                                cats[cn]["max"] += s["max"]
                            report_stub["categories"] = list(cats.values())
                        except Exception:
                            pass

                    ai = str(row.get("REPORT_AI_TEXT", "") or "")

                    dl1, dl2 = st.columns(2)
                    with dl1:
                        try:
                            pdf_bytes = generate_pdf_bytes(report_stub, ai)
                            st.download_button(
                                label="📥 PDF 다운로드",
                                data=pdf_bytes,
                                file_name=f"상권분석_{row['REGION'].replace(' ', '_')}.pdf",
                                mime="application/pdf",
                                key="hist_pdf_" + str(selected_id)
                            )
                        except Exception:
                            st.warning("PDF 생성 실패 - TXT로 다운로드하세요")
                    with dl2:
                        text = build_report_text(report_stub, ai)
                        st.download_button(
                            label="📥 TXT 다운로드",
                            data=text.encode("utf-8"),
                            file_name=f"상권분석_{row['REGION'].replace(' ', '_')}.txt",
                            mime="text/plain",
                            key="hist_txt_" + str(selected_id)
                        )
        else:
            st.info("저장된 프로필이 없습니다. 'AI 분석 리포트' 탭에서 분석 후 프로필을 저장해주세요.")
    except Exception as e:
        st.warning("분석 이력을 불러오는 중 오류가 발생했습니다: " + str(e))

# ─── Tab 10: 지역 현황 모니터링 ───
with tab10:
    st.markdown("### 📍 지역 현황 모니터링")
    st.markdown("저장된 프로필의 지역 데이터를 조회하고 변동사항을 추적합니다.")
    try:
        current_user = session.sql("SELECT CURRENT_USER()").to_pandas().iloc[0][0]
        saved_regions = session.sql(
            "SELECT DISTINCT REGION FROM URBAN_MISMATCH_AI.ANALYTICS.USER_ANALYSIS_PROFILES "
            "WHERE USERNAME = '" + str(current_user) + "'"
        ).to_pandas()

        if len(saved_regions) > 0:
            selected_region = st.selectbox("모니터링 지역 선택", saved_regions["REGION"].tolist(), key="monitor_region")

            col_m1, col_m2 = st.columns(2)
            with col_m1:
                st.markdown("#### 현재 지역 데이터")
                region_live = session.sql(
                    "SELECT GU_NAME AS \"구\", DONG_NAME AS \"동\", "
                    "ROUND(TRUE_MISMATCH_SCORE,1) AS \"기회점수\", "
                    "TRUE_OPPORTUNITY_LABEL AS \"분류\", "
                    "ROUND(TOTAL_RESIDENTIAL_POP,0) AS \"거주인구\", "
                    "ROUND(TOTAL_FLOATING_POP,0) AS \"유동인구\", "
                    "ROUND(AVG_INCOME,0) AS \"평균소득\", "
                    "ROUND(CONSUMPTION_PER_RESIDENT,0) AS \"주민당소비\", "
                    "TRANSPORT_GRADE AS \"교통등급\", "
                    "ROUND(TOTAL_STORES,0) AS \"총점포수\", "
                    "ROUND(FOOD_STORES,0) AS \"음식점\", "
                    "ROUND(COFFEE_STORES,0) AS \"카페\" "
                    "FROM URBAN_MISMATCH_AI.ANALYTICS.SUPPLY_DEMAND_MISMATCH "
                    "WHERE GU_NAME || ' ' || DONG_NAME = '" + selected_region + "'"
                ).to_pandas()
                if len(region_live) > 0:
                    r = region_live.iloc[0]
                    st.metric("기회점수", str(r["기회점수"]) + "/100", help="높을수록 수요 대비 공급 부족")
                    st.metric("분류", str(r["분류"]))
                    st.metric("거주인구", safe_int(r["거주인구"]) + "명")
                    st.metric("유동인구", safe_int(r["유동인구"]) + "명")
                    st.metric("평균소득", safe_int(r["평균소득"]) + "만원")
                    st.metric("총점포수", safe_int(r["총점포수"]) + "개")
                    st.metric("음식점/카페", safe_int(r["음식점"]) + " / " + safe_int(r["카페"]) + "개")

            with col_m2:
                st.markdown("#### 내 저장 이력 변동")
                history = session.sql(
                    "SELECT CREATED_AT, MONTHLY_REVENUE, MONTHLY_RENT, AVG_UNIT_PRICE "
                    "FROM URBAN_MISMATCH_AI.ANALYTICS.USER_ANALYSIS_PROFILES "
                    "WHERE USERNAME = '" + str(current_user) + "' AND REGION = '" + selected_region + "' "
                    "ORDER BY CREATED_AT ASC"
                ).to_pandas()
                if len(history) >= 2:
                    latest = history.iloc[-1]
                    prev = history.iloc[-2]
                    rev_delta = int(latest["MONTHLY_REVENUE"]) - int(prev["MONTHLY_REVENUE"])
                    rent_delta = int(latest["MONTHLY_RENT"]) - int(prev["MONTHLY_RENT"])
                    st.metric("월매출", f"{int(latest['MONTHLY_REVENUE']):,}원", f"{rev_delta:+,}원")
                    st.metric("월세", f"{int(latest['MONTHLY_RENT']):,}원", f"{rent_delta:+,}원")
                    st.metric("객단가", f"{int(latest['AVG_UNIT_PRICE']):,}원",
                              f"{int(latest['AVG_UNIT_PRICE']) - int(prev['AVG_UNIT_PRICE']):+,}원")
                    st.markdown("#### 매출/임대료 추이")
                    chart_hist = history.copy()
                    chart_hist["CREATED_AT"] = chart_hist["CREATED_AT"].astype(str).str[:10]
                    st.line_chart(chart_hist.set_index("CREATED_AT")[["MONTHLY_REVENUE", "MONTHLY_RENT"]])
                elif len(history) == 1:
                    r = history.iloc[0]
                    st.metric("월매출", f"{int(r['MONTHLY_REVENUE']):,}원")
                    st.metric("월세", f"{int(r['MONTHLY_RENT']):,}원")
                    st.info("변동사항을 추적하려면 같은 지역으로 2회 이상 프로필을 저장해주세요.")
                else:
                    st.info("저장된 이력이 없습니다.")

            st.markdown("---")
            st.markdown("#### 미스매치 점수 추이 (이 지역)")
            gu_dong = selected_region.split(" ")
            if len(gu_dong) >= 2:
                trend_data = session.sql(
                    "SELECT STANDARD_YEAR_MONTH AS \"월\", ROUND(MISMATCH_SCORE, 3) AS \"점수\" "
                    "FROM URBAN_MISMATCH_AI.ANALYTICS.MISMATCH_TREND "
                    "WHERE GU_NAME = '" + gu_dong[0] + "' AND DONG_NAME = '" + gu_dong[1] + "' ORDER BY \"월\""
                ).to_pandas()
                if len(trend_data) > 0:
                    st.line_chart(trend_data.set_index("월"))
                else:
                    st.info("해당 지역의 추이 데이터가 없습니다.")
        else:
            st.info("저장된 프로필이 없습니다. 먼저 'AI 분석 리포트' 탭에서 분석 후 프로필을 저장해주세요.")
    except Exception as e:
        st.warning("모니터링 데이터를 불러오는 중 오류가 발생했습니다: " + str(e))