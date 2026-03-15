"""
이전 장학생 명단 CSV → Supabase applications 테이블 삽입 스크립트
"""
import csv, json, requests, sys

SUPABASE_URL = "https://fxcadqnwoctqhricavey.supabase.co"
SERVICE_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4Y2FkcW53b2N0cWhyaWNhdmV5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzQ1Mzk0NywiZXhwIjoyMDg5MDI5OTQ3fQ.WFsgn0CdMTu_L3zk3ccDjDWgqTBznwFa-CnOrvNbGN8"

HEADERS = {
    "apikey": SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

# ── 학교구분 → school_level 매핑 ────────────────────────────────────
LEVEL_MAP = {
    "대학원": "university",
    "대학교": "university",
    "고등학교": "high",
    "중학교": "middle",
    "초등학교": "primary",
}

# ── 장학금 종류 → scholarships 테이블 name 매핑 ──────────────────────
SCH_MAP = {
    "다니엘": "다니엘 장학금",
    "다비다": "다비다 장학금",
    "바나바": "바나바 장학금",
    "빌립": "빌립 장학금",
    "여호수아": "여호수아 장학금",
    "특별": "특별 장학금",
    "특별장학금": "특별 장학금",
}


def api(method, path, extra_headers=None, **kwargs):
    url = f"{SUPABASE_URL}/rest/v1/{path}"
    h = {**HEADERS, **(extra_headers or {})}
    r = getattr(requests, method)(url, headers=h, **kwargs)
    return r


def get_or_create_scholarships():
    """scholarships 테이블에서 이름→ID 맵 반환. 없으면 생성."""
    r = api("get", "scholarships", params={"select": "id,name"})
    existing = {s["name"]: s["id"] for s in r.json()}

    needed = list(SCH_MAP.values())
    # 중복 제거
    needed = list(dict.fromkeys(needed))

    for name in needed:
        if name not in existing:
            create_r = api("post", "scholarships",
                           extra_headers={"Prefer": "return=representation"},
                           json={"name": name, "description": "", "amount": 0, "is_active": True})
            if create_r.status_code in (200, 201):
                new_id = create_r.json()[0]["id"]
                existing[name] = new_id
                print(f"  [생성] {name} → id={new_id}")
            else:
                print(f"  [오류] {name} 생성 실패: {create_r.text}")
    return existing


def parse_scholarship_type(raw: str) -> str:
    """'다니엘/빌립' 같은 복합 입력에서 첫 번째 장학금 종류 추출"""
    raw = raw.strip()
    for key in SCH_MAP:
        if key in raw:
            return SCH_MAP[key]
    return "특별 장학금"


def parse_birth_date(raw: str) -> str:
    raw = raw.strip()
    # 잘못된 날짜 (예: 2009-99-99) 보정
    if not raw or len(raw) < 8:
        return ""
    parts = raw.split("-")
    if len(parts) == 3:
        y, m, d = parts
        m = m.zfill(2)
        d = d.zfill(2)
        # 월/일 범위 보정
        if int(m) > 12: m = "01"
        if int(d) > 31: d = "01"
        return f"{y}-{m}-{d}"
    return raw


FILES = [
    ("C:/Users/penie/Desktop/장학금/장학생명단2023-2.csv", 2023, 2),
    ("C:/Users/penie/Desktop/장학금/장학생명단2024-1.csv", 2024, 1),
    ("C:/Users/penie/Desktop/장학금/장학생명단2024-2.csv", 2024, 2),
    ("C:/Users/penie/Desktop/장학금/장학생명단2025-1.csv", 2025, 1),
    ("C:/Users/penie/Desktop/장학금/장학생명단2025-2.csv", 2025, 2),
]


def main():
    print("=== 장학금 종류 ID 조회/생성 ===")
    sch_map = get_or_create_scholarships()
    print(f"  장학금 종류: {list(sch_map.keys())}\n")

    total_ok = 0
    total_skip = 0

    for fpath, year, semester in FILES:
        print(f"=== {year}년 {semester}학기 ({fpath.split('/')[-1]}) ===")

        with open(fpath, encoding="cp949") as fp:
            rows = list(csv.reader(fp))

        # 헤더 2행 스킵, 빈 행 및 집계 행 스킵
        data_rows = []
        for r in rows[2:]:
            # 번호가 숫자인 행만 처리
            if len(r) < 9:
                continue
            num_str = r[1].strip()
            if not num_str.isdigit():
                continue
            data_rows.append(r)

        ok_count = 0
        for r in data_rows:
            school_level_raw = r[0].strip()
            name             = r[2].strip()
            birth_date       = parse_birth_date(r[3])
            school           = r[4].strip()
            grade            = r[6].strip()
            sch_type_raw     = r[8].strip()
            amount_raw       = r[9].strip()
            applied_date     = r[10].strip() if len(r) > 10 else ""
            recommender      = r[12].strip() if len(r) > 12 else ""

            if not name:
                total_skip += 1
                continue

            school_level = LEVEL_MAP.get(school_level_raw, "university")
            sch_name = parse_scholarship_type(sch_type_raw)
            sch_id = sch_map.get(sch_name)
            if not sch_id:
                print(f"  [경고] 장학금 ID 없음: {sch_name}")
                total_skip += 1
                continue

            try:
                paid_amount = int(float(amount_raw)) * 10000
            except:
                paid_amount = 0

            record = {
                "student_name":       name,
                "birth_date":         birth_date if birth_date else "1900-01-01",
                "school":             school,
                "school_level":       school_level,
                "grade":              grade if grade else "1",
                "semester":           semester,
                "year":               year,
                "contact":            "",
                "scholarship_id":     sch_id,
                "reason":             f"[이전 명단 이관] {sch_type_raw}",
                "recommender_name":   recommender or None,
                "status":             "paid",
                "paid_amount":        paid_amount,
                "paid_at":            f"{year}-{'03' if semester == 1 else '09'}-01T00:00:00",
            }

            res = api("post", "applications", json=record)
            if res.status_code in (200, 201):
                ok_count += 1
                total_ok += 1
                print(f"  OK {name} ({school_level_raw}, {sch_type_raw}, {amount_raw}만원)")
            else:
                total_skip += 1
                print(f"  NG {name} 실패: {res.text[:120]}")

        print(f"  → {ok_count}/{len(data_rows)}건 삽입\n")

    print(f"=== 완료: 총 {total_ok}건 삽입, {total_skip}건 스킵 ===")


if __name__ == "__main__":
    main()
