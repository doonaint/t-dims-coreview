# Cloudflare Pages/Workers 배포 가이드

이 프로젝트는 프론트 정적 파일을 `frontend_tcsms`에서 서비스하고, `/api/*` 요청은 Cloudflare Pages Functions가 처리하도록 구성했습니다.

## 추가된 구조

- `functions/api/ringmap/...`
- `functions/api/shaft-status/...`
- `wrangler.toml`

프론트 코드는 기존처럼 같은 경로를 사용합니다.

- `GET /api/ringmap/projects`
- `POST /api/ringmap/projects/:projectKey/upload`
- `PATCH /api/ringmap/projects/:projectKey`
- `DELETE /api/ringmap/projects/:projectKey`
- `GET /api/shaft-status/:projectKey`
- `PUT /api/shaft-status/:projectKey`

## Cloudflare에서 필요한 바인딩

1. KV Namespace 생성
   `TCSMS_STORAGE`

2. R2 Bucket 생성
   `TCSMS_UPLOADS`

`wrangler.toml`의 placeholder 값은 실제 값으로 교체해야 합니다.

## 저장 방식

- 링맵/수직구 상태 JSON: `KV`
- 업로드된 원본 파일: `R2`

R2 바인딩이 없어도 상태 저장은 동작하지만, 업로드 파일 원본 보관은 하지 않습니다.

## 배포 포인트

- Cloudflare Pages 프로젝트의 build output directory는 `frontend_tcsms`
- Functions directory는 저장소의 `functions`
- `_headers` 파일은 현재 iframe 허용 정책을 포함합니다

## 참고

기존 FastAPI 백엔드는 로컬/docker 환경에서는 계속 사용할 수 있습니다.  
클라우드페어 배포에서는 Pages Functions가 `/api/*`를 대신 처리합니다.
