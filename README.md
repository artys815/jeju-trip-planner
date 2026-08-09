# 제주 여행 일정 (Jeju Trip Planner)

Vite + React + TypeScript 기반의 모바일 친화 편집 가능 여행 일정 사이트입니다.

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

`vercel dev`가 Vite 앱과 `/api/*` 서버리스 함수를 함께 제공합니다.

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
