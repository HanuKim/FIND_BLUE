import os
import urllib.request
import json
import csv
import time

# 환경 변수에서 API 키를 로드합니다. (.env.local 파일에 설정 필요)
API_KEY = os.getenv("PUB_DATA_API_KEY")

if not API_KEY:
    # streamlit 환경이나 로컬 테스트 시 API 키를 가져오지 못할 경우를 대비해 예외 처리
    print("Warning: PUB_DATA_API_KEY가 설정되지 않았습니다.")

BASE_URL = "https://apis.data.go.kr/B553077/api/open/sdsc2/storeListInDong"

GU_CODES = [
    ("11650", "서초구"),
    ("11560", "영등포구"),
    ("11140", "중구"),
]

all_stores = []

for gu_code, gu_name in GU_CODES:
    page = 1
    total_fetched = 0
    total_count = None
    while True:
        url = (
            f"{BASE_URL}"
            f"?serviceKey={API_KEY}"
            f"&divId=signguCd"
            f"&key={gu_code}"
            f"&type=json"
            f"&numOfRows=1000"
            f"&pageNo={page}"
        )
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=30) as resp:
                raw = resp.read().decode("utf-8")
                data = json.loads(raw)
            if data["header"]["resultCode"] != "00":
                print(f"  {gu_name} page {page}: {data['header']['resultMsg']}")
                break
            if total_count is None:
                total_count = data["body"]["totalCount"]
                print(f"{gu_name}({gu_code}): total {total_count} stores")
            items = data["body"]["items"]
            for item in items:
                all_stores.append({
                    "gu_name": gu_name,
                    "dong_name": item.get("adongNm", ""),
                    "dong_code": item.get("adongCd", ""),
                    "biz_name": item.get("bizesNm", ""),
                    "lcls_cd": item.get("indsLclsCd", ""),
                    "lcls_nm": item.get("indsLclsNm", ""),
                    "mcls_cd": item.get("indsMclsCd", ""),
                    "mcls_nm": item.get("indsMclsNm", ""),
                    "scls_cd": item.get("indsSclsCd", ""),
                    "scls_nm": item.get("indsSclsNm", ""),
                    "lon": item.get("lon", ""),
                    "lat": item.get("lat", ""),
                })
            total_fetched += len(items)
            print(f"  page {page}: +{len(items)} (total {total_fetched}/{total_count})")
            if total_fetched >= total_count:
                break
            page += 1
            time.sleep(0.1)
        except Exception as e:
            print(f"  ERROR page {page}: {e}")
            time.sleep(1)
            continue

print(f"\nTotal stores collected: {len(all_stores)}")

dong_upjong_count = {}
for s in all_stores:
    key = (s["gu_name"], s["dong_name"], s["dong_code"], s["mcls_cd"], s["mcls_nm"])
    dong_upjong_count[key] = dong_upjong_count.get(key, 0) + 1

with open("store_counts_v3.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerow(["GU_NAME","DONG_NAME","DONG_CODE","MCLS_CODE","MCLS_NAME","STORE_COUNT"])
    for (gu, dong, code, mcls_cd, mcls_nm), cnt in sorted(dong_upjong_count.items()):
        writer.writerow([gu, dong, code, mcls_cd, mcls_nm, cnt])

print(f"Aggregated: {len(dong_upjong_count)} rows saved to store_counts_v3.csv")