import os
import urllib.request
import json

# 환경 변수에서 API 키를 로드합니다.
API_KEY = os.getenv("PUB_DATA_API_KEY")


tests = [
    ("adongCd", "1165010800", "행정동 10자리 (기존)"),
    ("adongCd", "11650108", "행정동 8자리"),
    ("adongCd", "1168010100", "법정동 10자리 (서초동)"),
    ("ctprvnCd", "11", "시도코드"),
    ("signguCd", "11650", "시군구 5자리"),
    ("signguCd", "11560", "시군구 5자리 영등포"),
    ("adongCd", "1165053000", "서초구 서초동 행정표준코드"),
]

for div_id, key, desc in tests:
    url = (
        f"https://apis.data.go.kr/B553077/api/open/sdsc2/storeListInDong"
        f"?serviceKey={API_KEY}"
        f"&divId={div_id}"
        f"&key={key}"
        f"&type=json"
        f"&numOfRows=2"
        f"&pageNo=1"
    )
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=10) as resp:
            raw = resp.read().decode("utf-8")
            data = json.loads(raw)
            code = data["header"]["resultCode"]
            msg = data["header"]["resultMsg"]
            cnt = data.get("body", {}).get("totalCount", "N/A")
            print(f"[{desc}] divId={div_id}, key={key} => code={code}, msg={msg}, total={cnt}")
    except Exception as e:
        print(f"[{desc}] ERROR: {e}")