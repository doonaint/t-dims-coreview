# PostgreSQL 운영 메모

## 구성

- DB 엔진: PostgreSQL 16
- DB 서비스: `docker-compose.yml`의 `postgres`
- 기본 접속 정보:
  - DB: `tcsms`
  - USER: `tcsms`
  - PASSWORD: `tcsms`
  - URL: `postgresql://tcsms:tcsms@postgres:5432/tcsms`

## 실행

루트에서 아래 명령으로 전체 서비스가 올라갑니다.

```powershell
docker compose up -d --build
```

또는 `START_TCSMS.bat`를 실행해도 됩니다.

## DB 초기화

백엔드가 시작되면 `backend/app/main.py`의 startup 훅에서 아래 작업을 수행합니다.

- 테이블 생성
- EP2 프로젝트 시드 생성
- 세부구간 시드 생성

생성 대상 테이블:

- `projects`
- `segments`
- `ring_coordinates`
- `project_weekly_progress`
- `shaft_weekly_progress`
- `excavation_daily_progress`
- `documents`
- `focus_areas`

## 데이터 범위

- 프로젝트 단위:
  - 굴진진도율 주간 입력(%)
- 세부구간 단위:
  - 링좌표 CRUD
  - 수직구 주간 진도거리
  - 굴진 일별 진도거리
  - 굴진 실시간 집계
  - 현장현황판 PDF
  - 장비사양 PDF
  - 중점관리 구간 및 이미지

## 주의

- 현재 로컬 셸에 Python 실행 환경이 없어 백엔드 런타임 검증은 별도로 하지 못했습니다.
- 실제 DB 생성은 백엔드 컨테이너가 한 번 기동된 뒤 확인할 수 있습니다.
