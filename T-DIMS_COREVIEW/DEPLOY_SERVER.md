# 서버 배포 가이드

## 1. 서버 준비

- Ubuntu 22.04 LTS 또는 비슷한 Linux 서버 권장
- Docker, Docker Compose plugin 설치
- 방화벽에서 `80` 포트 오픈
- `5432` 포트는 외부 오픈하지 않는 것을 권장

## 2. 프로젝트 업로드

서버에서 프로젝트를 원하는 경로로 복사합니다.

```bash
git clone <your-repo-url>
cd T-DIMS_COREVIEW
```

또는 압축 파일로 올려도 됩니다.

## 3. 운영 환경 파일 준비

예시 파일을 복사해서 실제 값으로 바꿉니다.

```bash
cp .env.prod.example .env
```

최소한 아래 값은 변경하세요.

- `POSTGRES_PASSWORD`
- `APP_DOMAIN`

## 4. 컨테이너 실행

```bash
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

## 5. 상태 확인

```bash
docker compose -f docker-compose.prod.yml --env-file .env ps
```

```bash
docker compose -f docker-compose.prod.yml --env-file .env logs backend --tail=100
```

## 6. 접속 확인

- 화면: `http://서버IP`
- API: `http://서버IP/api/projects`

## 7. DB 확인

```bash
docker compose -f docker-compose.prod.yml --env-file .env exec postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c "\dt"
```

## 8. 백업 포인트

운영 백업 시 아래 둘 다 챙겨야 합니다.

- PostgreSQL 볼륨: `postgres_data`
- 업로드 파일: `backend/data/uploads`

## 9. 업데이트

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env up -d --build
```

## 10. HTTPS

현재 추가한 `deploy/nginx/prod.conf`는 HTTP 기준입니다.

실서비스에서는 아래 중 하나를 권장합니다.

- 호스트 nginx + certbot
- Caddy
- Cloudflare Tunnel / Proxy
- AWS ALB, NCP Load Balancer 같은 외부 TLS 종료
