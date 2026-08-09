# Travel Planner (Jeju-first)

Vite + React + TypeScript 기반의 로컬 우선 멀티 여행 플래너입니다.

기존 제주 일정은 첫 번째 production trip으로 안전하게 마이그레이션됩니다.

## 로컬 실행

프론트엔드만:

```bash
npm install
npm run dev
```

실시간 이동 도우미(`/api/geocode`, `/api/route`)까지 로컬에서 테스트하려면 Vercel CLI로 실행하세요.

1. `.env.example`을 복사해 `.env.local` 생성
2. `KAKAO_REST_API_KEY`에 Kakao Developers REST API 키 입력
3. 실행:

```bash
npx vercel dev
```

## Storage keys

| Key | Purpose |
|-----|---------|
| `travel-planner-trips-v1` | **Active** TripCollection (`version: 1`) |
| `jeju-trip-itinerary-v1` | **Legacy backup** — copy-only migration source. Never deleted/overwritten after migration. |
| `jeju-trip-itinerary-v1-backup-202608` | One-time safety copy of the legacy blob |
| `jeju-trip-geocode-cache-v1` | Geocode cache (separate) |
| `jeju-trip-weather-cache-v1` | Weather cache (separate) |

After migration, edits save **only** to `travel-planner-trips-v1`.
The legacy key remains an immutable emergency backup of the pre-migration Jeju itinerary.

## Safety tests

```bash
npm run test:migration
```

## Vercel 환경 변수

Vercel → Project → Settings → Environment Variables 에 추가:

- Name: `KAKAO_REST_API_KEY`
- Value: Kakao Developers에서 발급한 REST API 키
- Environments: Production, Preview, Development

비밀 키에 `VITE_` 접두사를 붙이지 마세요. 클라이언트 번들에 노출됩니다.

배포 후 키 설정 여부만 확인하려면 (키 값은 노출되지 않음):

```text
GET /api/diag
→ { "ok": true, "kakaoConfigured": true|false, "nodeVersion": "..." }
```

## 빌드

```bash
npm run build
```
