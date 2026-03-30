import json
import os
import shutil
import uuid
from contextlib import contextmanager
from datetime import date, datetime
from pathlib import Path

import psycopg
from psycopg.rows import dict_row
from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data"
DOC_DIR = DATA_DIR / "uploads" / "documents"
FOCUS_DIR = DATA_DIR / "uploads" / "focus_areas"
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://tcsms:tcsms@postgres:5432/tcsms")
PROJECT_KEYS = {"GY", "HN", "NH", "YP"}
DOC_TYPES = {"site_status_pdf", "equipment_spec_pdf"}

PROJECTS = [("GY", "\uad50\uc0b0", "EP2", 1), ("HN", "\ud558\ub0a8", "EP2", 2), ("NH", "\ub0a8\ud55c\uac15", "EP2", 3), ("YP", "\uc591\ud3c9", "EP2", 4)]
SEGMENTS = {
    "GY": [("GY-1-1", "\uad50\uc0b0 1-1\uad6c\uac04", "1-1", "#1", "\uad50\uc0b0 #1 \uc218\uc9c1\uad6c (1-1)", "EPB TYPE", 2509.0, 1), ("GY-1-2", "\uad50\uc0b0 1-2\uad6c\uac04", "1-2", "#3", "\uad50\uc0b0 #3 \uc218\uc9c1\uad6c (1-2)", "Slurry TYPE", 2413.0, 2)],
    "HN": [("HN-1-1", "\ud558\ub0a8 1-1\uad6c\uac04", "1-1", "#2", "\ud558\ub0a8 #2 \uc218\uc9c1\uad6c (1-1)", "CRCHI", 2060.68, 1), ("HN-1-2", "\ud558\ub0a8 1-2\uad6c\uac04", "1-2", "#3", "\ud558\ub0a8 #3 \uc218\uc9c1\uad6c (1-2)", "CRCHI", 2695.42, 2), ("HN-1-3", "\ud558\ub0a8 1-3\uad6c\uac04", "1-3", "#4", "\ud558\ub0a8 #4 \uc218\uc9c1\uad6c (1-3)", "CREG", 2541.96, 3), ("HN-1-4", "\ud558\ub0a8 1-4\uad6c\uac04", "1-4", "#5-1", "\ud558\ub0a8 #5-1 \uc218\uc9c1\uad6c (1-4)", "CREG", 1453.86, 4), ("HN-1-5", "\ud558\ub0a8 1-5\uad6c\uac04", "1-5", "#5", "\ud558\ub0a8 #5 \uc218\uc9c1\uad6c (1-5)", "CREG", 2516.59, 5)],
    "NH": [("NH-2-1", "\ub0a8\ud55c\uac15 2-1\uad6c\uac04", "2-1", None, "\ub0a8\ud55c\uac15 2-1\uad6c\uac04", "CRCHI", 0.0, 1), ("NH-2-2", "\ub0a8\ud55c\uac15 2-2\uad6c\uac04", "2-2", None, "\ub0a8\ud55c\uac15 2-2\uad6c\uac04", "CRCHI", 0.0, 2), ("NH-2-3", "\ub0a8\ud55c\uac15 2-3\uad6c\uac04", "2-3", None, "\ub0a8\ud55c\uac15 2-3\uad6c\uac04", "CRCHI", 0.0, 3), ("NH-2-4", "\ub0a8\ud55c\uac15 2-4\uad6c\uac04", "2-4", None, "\ub0a8\ud55c\uac15 2-4\uad6c\uac04", "CRCHI", 0.0, 4)],
    "YP": [("YP-3-1", "\uc591\ud3c9 3-1\uad6c\uac04", "3-1", "#11-1", "\uc591\ud3c9 #11-1 \uc218\uc9c1\uad6c (3-1)", "JIMT, TNM", 1854.0, 1), ("YP-3-2", "\uc591\ud3c9 3-2\uad6c\uac04", "3-2", "#11", "\uc591\ud3c9 #11 \uc218\uc9c1\uad6c (3-2)", "JIMT, TNM", 2345.0, 2), ("YP-3-3", "\uc591\ud3c9 3-3\uad6c\uac04", "3-3", "#12", "\uc591\ud3c9 #12 \uc218\uc9c1\uad6c (3-3)", "JIMT, TNM", 2343.0, 3), ("YP-3-4", "\uc591\ud3c9 3-4\uad6c\uac04", "3-4", "#13", "\uc591\ud3c9 #13 \uc218\uc9c1\uad6c (3-4)", "JIMT, TNM", 2467.0, 4)],
}

app = FastAPI(title="T-DIMS CoreView Backend")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class ProjectWeeklyProgressIn(BaseModel): weekStart: date; progressPercent: float = Field(ge=0, le=100); note: str = ""
class RingCoordinateIn(BaseModel): ringNo: str; chainage: str = ""; latitude: float; longitude: float; sortOrder: int | None = None
class ShaftWeeklyProgressIn(BaseModel): weekStart: date; progressDistanceM: float = Field(ge=0); cumulativeDistanceM: float | None = Field(default=None, ge=0); note: str = ""
class ExcavationDailyProgressIn(BaseModel): workDate: date; progressDistanceM: float = Field(ge=0); cumulativeDistanceM: float | None = Field(default=None, ge=0); note: str = ""
class FocusAreaUpdateIn(BaseModel): segmentId: int | None = None; startStation: str = ""; endStation: str = ""; lengthM: float | None = Field(default=None, ge=0); reason: str = ""; note: str = ""
class RingMapProjectStateIn(BaseModel): completedRing: str = ""

def ensure_storage(): DOC_DIR.mkdir(parents=True, exist_ok=True); FOCUS_DIR.mkdir(parents=True, exist_ok=True)
def now_iso(): return datetime.utcnow().replace(microsecond=0).isoformat() + "Z"
def as_date(v): return v.isoformat() if isinstance(v, date) else str(v)
def need(ok, detail, status=400): 
    if not ok: raise HTTPException(status_code=status, detail=detail)
def save_file(dir_path: Path, upload: UploadFile):
    suffix = Path(upload.filename or "").suffix.lower(); name = f"{uuid.uuid4().hex}{suffix}"; path = dir_path / name
    with path.open("wb") as f: shutil.copyfileobj(upload.file, f)
    return {"original": upload.filename or name, "stored": name, "path": str(path), "contentType": upload.content_type or "application/octet-stream"}
def remove_file(path_str): 
    if path_str and Path(path_str).exists(): Path(path_str).unlink()

@contextmanager
def db():
    ensure_storage()
    conn = psycopg.connect(DATABASE_URL, row_factory=dict_row)
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def one(conn, sql, params, detail):
    row = conn.execute(sql, params).fetchone()
    if row is None: raise HTTPException(status_code=404, detail=detail)
    return row

def project(conn, key):
    need(key in PROJECT_KEYS, "Unknown project key", 404)
    return one(conn, "SELECT * FROM projects WHERE code=%s", (key,), "Project not found")

def segment(conn, segment_id):
    return one(conn, "SELECT s.*, p.code AS project_code, p.name AS project_name, p.ep_phase FROM segments s JOIN projects p ON p.id=s.project_id WHERE s.id=%s", (segment_id,), "Segment not found")

def segment_summary(conn, row):
    latest = conn.execute("SELECT work_date, progress_distance_m, cumulative_distance_m, note FROM excavation_daily_progress WHERE segment_id=%s ORDER BY work_date DESC LIMIT 1", (row["id"],)).fetchone()
    total = latest["cumulative_distance_m"] if latest and latest["cumulative_distance_m"] is not None else conn.execute("SELECT COALESCE(SUM(progress_distance_m),0) AS total FROM excavation_daily_progress WHERE segment_id=%s", (row["id"],)).fetchone()["total"]
    return {"id": row["id"], "projectId": row["project_id"], "projectCode": row["project_code"], "projectName": row["project_name"], "epPhase": row["ep_phase"], "code": row["code"], "name": row["name"], "segmentNumber": row["segment_number"], "shaftName": row["shaft_name"], "shaftDisplayName": row["shaft_display_name"], "excavationMethod": row["excavation_method"], "totalDistanceM": row["total_distance_m"], "displayOrder": row["display_order"], "currentExcavatedDistanceM": total, "currentProgressPercent": round((total / row["total_distance_m"]) * 100, 2) if total is not None and row["total_distance_m"] else None}
def norm_segment(v): return "".join(ch for ch in str(v or "").strip().lower() if ch.isalnum())
def project_segments(conn, project_id): return conn.execute("SELECT * FROM segments WHERE project_id=%s ORDER BY display_order,id", (project_id,)).fetchall()
def project_ringmap_payload(conn, p):
    segs = project_segments(conn, p["id"]); ids = [s["id"] for s in segs]; rows = []
    if ids:
        sql = "SELECT rc.*, s.segment_number FROM ring_coordinates rc JOIN segments s ON s.id=rc.segment_id WHERE s.project_id=%s ORDER BY s.display_order, rc.sort_order, rc.id"
        rows = [{"ring": r["ring_no"], "chainage": r["chainage"], "lat": r["latitude"], "lng": r["longitude"], "sortRing": r["sort_order"], "segmentNumber": r["segment_number"]} for r in conn.execute(sql, (p["id"],)).fetchall()]
    meta = conn.execute("SELECT completed_ring,file_name FROM project_ringmap_state WHERE project_id=%s", (p["id"],)).fetchone()
    return {"rows": rows, "completedRing": meta["completed_ring"] if meta else "", "fileName": meta["file_name"] if meta else ""}
def resolve_segment_id(seg_map, row, fallback_id):
    for key in ("segmentNumber", "segment", "section", "sourceSheet"):
        value = row.get(key)
        if value is None: continue
        matched = seg_map.get(norm_segment(value))
        if matched: return matched
    return fallback_id

def init_db():
    with db() as conn:
        conn.execute("CREATE TABLE IF NOT EXISTS projects (id SERIAL PRIMARY KEY, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, ep_phase TEXT NOT NULL, display_order INTEGER NOT NULL)")
        conn.execute("CREATE TABLE IF NOT EXISTS segments (id SERIAL PRIMARY KEY, project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE, code TEXT UNIQUE NOT NULL, name TEXT NOT NULL, segment_number TEXT NOT NULL, shaft_name TEXT, shaft_display_name TEXT, excavation_method TEXT, total_distance_m DOUBLE PRECISION NOT NULL DEFAULT 0, display_order INTEGER NOT NULL DEFAULT 0)")
        conn.execute("CREATE TABLE IF NOT EXISTS ring_coordinates (id SERIAL PRIMARY KEY, segment_id INTEGER NOT NULL REFERENCES segments(id) ON DELETE CASCADE, ring_no TEXT NOT NULL, chainage TEXT NOT NULL DEFAULT '', latitude DOUBLE PRECISION NOT NULL, longitude DOUBLE PRECISION NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)")
        conn.execute("CREATE TABLE IF NOT EXISTS project_weekly_progress (id SERIAL PRIMARY KEY, project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE, week_start TEXT NOT NULL, progress_percent DOUBLE PRECISION NOT NULL, note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(project_id, week_start))")
        conn.execute("CREATE TABLE IF NOT EXISTS shaft_weekly_progress (id SERIAL PRIMARY KEY, segment_id INTEGER NOT NULL REFERENCES segments(id) ON DELETE CASCADE, week_start TEXT NOT NULL, progress_distance_m DOUBLE PRECISION NOT NULL, cumulative_distance_m DOUBLE PRECISION, note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(segment_id, week_start))")
        conn.execute("CREATE TABLE IF NOT EXISTS excavation_daily_progress (id SERIAL PRIMARY KEY, segment_id INTEGER NOT NULL REFERENCES segments(id) ON DELETE CASCADE, work_date TEXT NOT NULL, progress_distance_m DOUBLE PRECISION NOT NULL, cumulative_distance_m DOUBLE PRECISION, note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL, UNIQUE(segment_id, work_date))")
        conn.execute("CREATE TABLE IF NOT EXISTS project_ringmap_state (project_id INTEGER PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE, completed_ring TEXT NOT NULL DEFAULT '', file_name TEXT NOT NULL DEFAULT '', updated_at TEXT NOT NULL)")
        conn.execute("CREATE TABLE IF NOT EXISTS documents (id SERIAL PRIMARY KEY, project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE, segment_id INTEGER REFERENCES segments(id) ON DELETE CASCADE, doc_type TEXT NOT NULL, title TEXT NOT NULL, original_name TEXT NOT NULL, stored_name TEXT NOT NULL, content_type TEXT NOT NULL, stored_path TEXT NOT NULL, note TEXT NOT NULL DEFAULT '', uploaded_at TEXT NOT NULL)")
        conn.execute("CREATE TABLE IF NOT EXISTS focus_areas (id SERIAL PRIMARY KEY, segment_id INTEGER NOT NULL REFERENCES segments(id) ON DELETE CASCADE, start_station TEXT NOT NULL DEFAULT '', end_station TEXT NOT NULL DEFAULT '', length_m DOUBLE PRECISION, reason TEXT NOT NULL DEFAULT '', note TEXT NOT NULL DEFAULT '', image_original_name TEXT, image_stored_name TEXT, image_content_type TEXT, image_stored_path TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)")
        for row in PROJECTS:
            conn.execute("INSERT INTO projects (code,name,ep_phase,display_order) VALUES (%s,%s,%s,%s) ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, ep_phase=EXCLUDED.ep_phase, display_order=EXCLUDED.display_order", row)
        ids = {r["code"]: r["id"] for r in conn.execute("SELECT id, code FROM projects").fetchall()}
        rows = [(ids[key], *item) for key, items in SEGMENTS.items() for item in items]
        for row in rows:
            conn.execute("INSERT INTO segments (project_id,code,name,segment_number,shaft_name,shaft_display_name,excavation_method,total_distance_m,display_order) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, segment_number=EXCLUDED.segment_number, shaft_name=EXCLUDED.shaft_name, shaft_display_name=EXCLUDED.shaft_display_name, excavation_method=EXCLUDED.excavation_method, total_distance_m=EXCLUDED.total_distance_m, display_order=EXCLUDED.display_order", row)

@app.on_event("startup")
def startup(): init_db()

@app.get("/")
def root(): return {"status": "ok"}

@app.get("/api/projects")
def list_projects():
    with db() as conn:
        rows = conn.execute("SELECT * FROM projects ORDER BY display_order, code").fetchall()
        return {"projects": [{"id": p["id"], "code": p["code"], "name": p["name"], "epPhase": p["ep_phase"], "segmentCount": conn.execute("SELECT COUNT(*) AS c FROM segments WHERE project_id=%s", (p["id"],)).fetchone()["c"]} for p in rows]}

@app.get("/api/projects/{project_key}/segments")
def list_segments(project_key: str):
    with db() as conn:
        p = project(conn, project_key); rows = conn.execute("SELECT s.*, p.code AS project_code, p.name AS project_name, p.ep_phase FROM segments s JOIN projects p ON p.id=s.project_id WHERE s.project_id=%s ORDER BY s.display_order, s.id", (p["id"],)).fetchall()
        return {"project": {"id": p["id"], "code": p["code"], "name": p["name"], "epPhase": p["ep_phase"]}, "segments": [segment_summary(conn, r) for r in rows]}

@app.get("/api/ringmap/projects")
def get_ringmap_projects():
    with db() as conn:
        rows = conn.execute("SELECT * FROM projects ORDER BY display_order, code").fetchall()
        return {"projects": {p["code"]: project_ringmap_payload(conn, p) for p in rows}}

@app.post("/api/ringmap/projects/{project_key}/upload")
async def upload_ringmap_project(project_key: str, rows_json: str = Form(...), file_name: str = Form(default=""), completed_ring: str = Form(default="")):
    with db() as conn:
        p = project(conn, project_key); segs = project_segments(conn, p["id"]); need(bool(segs), "No segments configured for project", 400); fallback_id = segs[0]["id"]; seg_map = {norm_segment(s["segment_number"]): s["id"] for s in segs}; rows = json.loads(rows_json or "[]"); need(isinstance(rows, list), "rows_json must be a JSON array")
        conn.execute("DELETE FROM ring_coordinates WHERE segment_id IN (SELECT id FROM segments WHERE project_id=%s)", (p["id"],))
        seq = {s["id"]: 0 for s in segs}; t = now_iso(); inserted = 0
        for row in rows:
            if not isinstance(row, dict): continue
            lat = row.get("lat"); lng = row.get("lng")
            try: lat = float(lat); lng = float(lng)
            except (TypeError, ValueError): continue
            seg_id = resolve_segment_id(seg_map, row, fallback_id); seq[seg_id] = seq.get(seg_id, 0) + 1
            ring_no = str(row.get("ring", seq[seg_id]))
            chainage = str(row.get("chainage", row.get("chain", "")) or "")
            sort_order = int(row.get("sortRing", row.get("sortOrder", seq[seg_id])) or seq[seg_id])
            conn.execute("INSERT INTO ring_coordinates (segment_id,ring_no,chainage,latitude,longitude,sort_order,created_at,updated_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)", (seg_id, ring_no, chainage, lat, lng, sort_order, t, t)); inserted += 1
        conn.execute("INSERT INTO project_ringmap_state (project_id,completed_ring,file_name,updated_at) VALUES (%s,%s,%s,%s) ON CONFLICT (project_id) DO UPDATE SET completed_ring=EXCLUDED.completed_ring, file_name=EXCLUDED.file_name, updated_at=EXCLUDED.updated_at", (p["id"], completed_ring or "", file_name or "", t))
        return {"ok": True, "inserted": inserted, "project": project_ringmap_payload(conn, p)}

@app.patch("/api/ringmap/projects/{project_key}")
def update_ringmap_project(project_key: str, payload: RingMapProjectStateIn):
    with db() as conn:
        p = project(conn, project_key); current = conn.execute("SELECT file_name FROM project_ringmap_state WHERE project_id=%s", (p["id"],)).fetchone(); file_name = current["file_name"] if current else ""
        conn.execute("INSERT INTO project_ringmap_state (project_id,completed_ring,file_name,updated_at) VALUES (%s,%s,%s,%s) ON CONFLICT (project_id) DO UPDATE SET completed_ring=EXCLUDED.completed_ring, file_name=EXCLUDED.file_name, updated_at=EXCLUDED.updated_at", (p["id"], payload.completedRing or "", file_name, now_iso()))
        return {"ok": True, "project": project_ringmap_payload(conn, p)}

@app.delete("/api/ringmap/projects/{project_key}")
def delete_ringmap_project(project_key: str):
    with db() as conn:
        p = project(conn, project_key); conn.execute("DELETE FROM ring_coordinates WHERE segment_id IN (SELECT id FROM segments WHERE project_id=%s)", (p["id"],)); conn.execute("DELETE FROM project_ringmap_state WHERE project_id=%s", (p["id"],)); return {"ok": True}

@app.get("/api/segments/{segment_id}")
def get_segment(segment_id: int):
    with db() as conn: return {"segment": segment_summary(conn, segment(conn, segment_id))}

@app.put("/api/projects/{project_key}/weekly-progress/{week_start}")
def upsert_project_weekly_progress(project_key: str, week_start: str, payload: ProjectWeeklyProgressIn):
    need(as_date(payload.weekStart) == week_start, "Path week_start and payload.weekStart must match")
    with db() as conn:
        p = project(conn, project_key); t = now_iso()
        conn.execute("INSERT INTO project_weekly_progress (project_id,week_start,progress_percent,note,created_at,updated_at) VALUES (%s,%s,%s,%s,%s,%s) ON CONFLICT (project_id,week_start) DO UPDATE SET progress_percent=EXCLUDED.progress_percent, note=EXCLUDED.note, updated_at=EXCLUDED.updated_at", (p["id"], week_start, payload.progressPercent, payload.note, t, t))
        return {"ok": True}

@app.get("/api/projects/{project_key}/weekly-progress")
def list_project_weekly_progress(project_key: str):
    with db() as conn:
        p = project(conn, project_key)
        return {"items": conn.execute("SELECT id,week_start,progress_percent,note,created_at,updated_at FROM project_weekly_progress WHERE project_id=%s ORDER BY week_start DESC", (p["id"],)).fetchall()}

@app.delete("/api/projects/{project_key}/weekly-progress/{week_start}")
def delete_project_weekly_progress(project_key: str, week_start: str):
    with db() as conn:
        p = project(conn, project_key); conn.execute("DELETE FROM project_weekly_progress WHERE project_id=%s AND week_start=%s", (p["id"], week_start))
        return {"ok": True}

@app.post("/api/segments/{segment_id}/ring-coordinates")
def create_ring_coordinate(segment_id: int, payload: RingCoordinateIn):
    with db() as conn:
        segment(conn, segment_id); n = conn.execute("SELECT COALESCE(MAX(sort_order),0)+1 AS n FROM ring_coordinates WHERE segment_id=%s", (segment_id,)).fetchone()["n"]; t = now_iso()
        conn.execute("INSERT INTO ring_coordinates (segment_id,ring_no,chainage,latitude,longitude,sort_order,created_at,updated_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s)", (segment_id, payload.ringNo, payload.chainage, payload.latitude, payload.longitude, payload.sortOrder if payload.sortOrder is not None else n, t, t))
        return {"ok": True}

@app.get("/api/segments/{segment_id}/ring-coordinates")
def list_ring_coordinates(segment_id: int):
    with db() as conn:
        segment(conn, segment_id)
        return {"items": conn.execute("SELECT id,segment_id,ring_no,chainage,latitude,longitude,sort_order,created_at,updated_at FROM ring_coordinates WHERE segment_id=%s ORDER BY sort_order,id", (segment_id,)).fetchall()}

@app.put("/api/ring-coordinates/{ring_coordinate_id}")
def update_ring_coordinate(ring_coordinate_id: int, payload: RingCoordinateIn):
    with db() as conn:
        current = one(conn, "SELECT * FROM ring_coordinates WHERE id=%s", (ring_coordinate_id,), "Ring coordinate not found")
        conn.execute("UPDATE ring_coordinates SET ring_no=%s, chainage=%s, latitude=%s, longitude=%s, sort_order=%s, updated_at=%s WHERE id=%s", (payload.ringNo, payload.chainage, payload.latitude, payload.longitude, payload.sortOrder if payload.sortOrder is not None else current["sort_order"], now_iso(), ring_coordinate_id))
        return {"ok": True}

@app.delete("/api/ring-coordinates/{ring_coordinate_id}")
def delete_ring_coordinate(ring_coordinate_id: int):
    with db() as conn: conn.execute("DELETE FROM ring_coordinates WHERE id=%s", (ring_coordinate_id,)); return {"ok": True}

@app.put("/api/segments/{segment_id}/shaft-weekly-progress/{week_start}")
def upsert_shaft_weekly_progress(segment_id: int, week_start: str, payload: ShaftWeeklyProgressIn):
    need(as_date(payload.weekStart) == week_start, "Path week_start and payload.weekStart must match")
    with db() as conn:
        segment(conn, segment_id); t = now_iso()
        conn.execute("INSERT INTO shaft_weekly_progress (segment_id,week_start,progress_distance_m,cumulative_distance_m,note,created_at,updated_at) VALUES (%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (segment_id,week_start) DO UPDATE SET progress_distance_m=EXCLUDED.progress_distance_m, cumulative_distance_m=EXCLUDED.cumulative_distance_m, note=EXCLUDED.note, updated_at=EXCLUDED.updated_at", (segment_id, week_start, payload.progressDistanceM, payload.cumulativeDistanceM, payload.note, t, t))
        return {"ok": True}

@app.get("/api/segments/{segment_id}/shaft-weekly-progress")
def list_shaft_weekly_progress(segment_id: int):
    with db() as conn:
        segment(conn, segment_id)
        return {"items": conn.execute("SELECT id,segment_id,week_start,progress_distance_m,cumulative_distance_m,note,created_at,updated_at FROM shaft_weekly_progress WHERE segment_id=%s ORDER BY week_start DESC", (segment_id,)).fetchall()}

@app.delete("/api/segments/{segment_id}/shaft-weekly-progress/{week_start}")
def delete_shaft_weekly_progress(segment_id: int, week_start: str):
    with db() as conn: segment(conn, segment_id); conn.execute("DELETE FROM shaft_weekly_progress WHERE segment_id=%s AND week_start=%s", (segment_id, week_start)); return {"ok": True}

@app.put("/api/segments/{segment_id}/excavation-progress/daily/{work_date}")
def upsert_excavation_daily_progress(segment_id: int, work_date: str, payload: ExcavationDailyProgressIn):
    need(as_date(payload.workDate) == work_date, "Path work_date and payload.workDate must match")
    with db() as conn:
        segment(conn, segment_id); t = now_iso()
        conn.execute("INSERT INTO excavation_daily_progress (segment_id,work_date,progress_distance_m,cumulative_distance_m,note,created_at,updated_at) VALUES (%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (segment_id,work_date) DO UPDATE SET progress_distance_m=EXCLUDED.progress_distance_m, cumulative_distance_m=EXCLUDED.cumulative_distance_m, note=EXCLUDED.note, updated_at=EXCLUDED.updated_at", (segment_id, work_date, payload.progressDistanceM, payload.cumulativeDistanceM, payload.note, t, t))
        return {"ok": True}

@app.get("/api/segments/{segment_id}/excavation-progress/daily")
def list_excavation_daily_progress(segment_id: int):
    with db() as conn:
        segment(conn, segment_id)
        return {"items": conn.execute("SELECT id,segment_id,work_date,progress_distance_m,cumulative_distance_m,note,created_at,updated_at FROM excavation_daily_progress WHERE segment_id=%s ORDER BY work_date DESC", (segment_id,)).fetchall()}

@app.delete("/api/segments/{segment_id}/excavation-progress/daily/{work_date}")
def delete_excavation_daily_progress(segment_id: int, work_date: str):
    with db() as conn: segment(conn, segment_id); conn.execute("DELETE FROM excavation_daily_progress WHERE segment_id=%s AND work_date=%s", (segment_id, work_date)); return {"ok": True}

@app.get("/api/segments/{segment_id}/excavation-progress/realtime")
def get_excavation_realtime(segment_id: int):
    with db() as conn:
        row = segment(conn, segment_id); latest = conn.execute("SELECT work_date,progress_distance_m,cumulative_distance_m,note FROM excavation_daily_progress WHERE segment_id=%s ORDER BY work_date DESC LIMIT 1", (segment_id,)).fetchone(); total = conn.execute("SELECT COALESCE(SUM(progress_distance_m),0) AS total FROM excavation_daily_progress WHERE segment_id=%s", (segment_id,)).fetchone()["total"]; current = latest["cumulative_distance_m"] if latest and latest["cumulative_distance_m"] is not None else total
        return {"segment": segment_summary(conn, row), "realtime": {"latestWorkDate": latest["work_date"] if latest else None, "latestDailyDistanceM": latest["progress_distance_m"] if latest else 0, "currentDistanceM": current, "totalDistanceM": row["total_distance_m"], "progressPercent": round((current / row["total_distance_m"]) * 100, 2) if row["total_distance_m"] else None, "note": latest["note"] if latest else ""}}

@app.post("/api/projects/{project_key}/documents")
async def upload_project_document(project_key: str, doc_type: str = Form(..., alias="docType"), title: str = Form(""), note: str = Form(""), file: UploadFile = File(...)):
    need(doc_type in DOC_TYPES, "Unsupported document type")
    with db() as conn:
        p = project(conn, project_key); f = save_file(DOC_DIR, file); conn.execute("INSERT INTO documents (project_id,segment_id,doc_type,title,original_name,stored_name,content_type,stored_path,note,uploaded_at) VALUES (%s,NULL,%s,%s,%s,%s,%s,%s,%s,%s)", (p["id"], doc_type, title or f["original"], f["original"], f["stored"], f["contentType"], f["path"], note, now_iso())); return {"ok": True}

@app.post("/api/segments/{segment_id}/documents")
async def upload_segment_document(segment_id: int, doc_type: str = Form(..., alias="docType"), title: str = Form(""), note: str = Form(""), file: UploadFile = File(...)):
    need(doc_type in DOC_TYPES, "Unsupported document type")
    with db() as conn:
        s = segment(conn, segment_id); f = save_file(DOC_DIR, file); conn.execute("INSERT INTO documents (project_id,segment_id,doc_type,title,original_name,stored_name,content_type,stored_path,note,uploaded_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)", (s["project_id"], segment_id, doc_type, title or f["original"], f["original"], f["stored"], f["contentType"], f["path"], note, now_iso())); return {"ok": True}

@app.get("/api/projects/{project_key}/documents")
def list_project_documents(project_key: str, doc_type: str | None = Query(default=None, alias="docType")):
    need(doc_type is None or doc_type in DOC_TYPES, "Unsupported document type")
    with db() as conn:
        p = project(conn, project_key); sql = "SELECT id,project_id,segment_id,doc_type,title,original_name,stored_name,content_type,note,uploaded_at FROM documents WHERE project_id=%s AND segment_id IS NULL"; params = [p["id"]]
        if doc_type: sql += " AND doc_type=%s"; params.append(doc_type)
        sql += " ORDER BY uploaded_at DESC, id DESC"
        return {"items": conn.execute(sql, tuple(params)).fetchall()}

@app.get("/api/segments/{segment_id}/documents")
def list_segment_documents(segment_id: int, doc_type: str | None = Query(default=None, alias="docType")):
    need(doc_type is None or doc_type in DOC_TYPES, "Unsupported document type")
    with db() as conn:
        segment(conn, segment_id); sql = "SELECT id,project_id,segment_id,doc_type,title,original_name,stored_name,content_type,note,uploaded_at FROM documents WHERE segment_id=%s"; params = [segment_id]
        if doc_type: sql += " AND doc_type=%s"; params.append(doc_type)
        sql += " ORDER BY uploaded_at DESC, id DESC"
        return {"items": conn.execute(sql, tuple(params)).fetchall()}

@app.get("/api/documents/{document_id}/download")
def download_document(document_id: int):
    with db() as conn:
        row = one(conn, "SELECT * FROM documents WHERE id=%s", (document_id,), "Document not found"); path = Path(row["stored_path"]); need(path.exists(), "Stored file not found", 404); return FileResponse(path, media_type=row["content_type"], filename=row["original_name"])

@app.delete("/api/documents/{document_id}")
def delete_document(document_id: int):
    with db() as conn:
        row = one(conn, "SELECT * FROM documents WHERE id=%s", (document_id,), "Document not found"); remove_file(row["stored_path"]); conn.execute("DELETE FROM documents WHERE id=%s", (document_id,)); return {"ok": True}

@app.post("/api/segments/{segment_id}/focus-areas")
async def create_focus_area(segment_id: int, start_station: str = Form("", alias="startStation"), end_station: str = Form("", alias="endStation"), length_m: float | None = Form(default=None, alias="lengthM"), reason: str = Form(""), note: str = Form(""), image: UploadFile | None = File(default=None)):
    with db() as conn:
        segment(conn, segment_id); f = save_file(FOCUS_DIR, image) if image else None
        conn.execute("INSERT INTO focus_areas (segment_id,start_station,end_station,length_m,reason,note,image_original_name,image_stored_name,image_content_type,image_stored_path,created_at,updated_at) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)", (segment_id, start_station, end_station, length_m, reason, note, f['original'] if f else None, f['stored'] if f else None, f['contentType'] if f else None, f['path'] if f else None, now_iso(), now_iso())); return {"ok": True}

@app.put("/api/focus-areas/{focus_area_id}")
def update_focus_area(focus_area_id: int, payload: FocusAreaUpdateIn):
    with db() as conn:
        current = one(conn, "SELECT * FROM focus_areas WHERE id=%s", (focus_area_id,), "Focus area not found"); segment_id = payload.segmentId if payload.segmentId is not None else current["segment_id"]; segment(conn, segment_id)
        conn.execute("UPDATE focus_areas SET segment_id=%s,start_station=%s,end_station=%s,length_m=%s,reason=%s,note=%s,updated_at=%s WHERE id=%s", (segment_id, payload.startStation, payload.endStation, payload.lengthM, payload.reason, payload.note, now_iso(), focus_area_id)); return {"ok": True}

@app.post("/api/focus-areas/{focus_area_id}/image")
async def replace_focus_area_image(focus_area_id: int, image: UploadFile = File(...)):
    with db() as conn:
        current = one(conn, "SELECT * FROM focus_areas WHERE id=%s", (focus_area_id,), "Focus area not found"); f = save_file(FOCUS_DIR, image); remove_file(current["image_stored_path"])
        conn.execute("UPDATE focus_areas SET image_original_name=%s,image_stored_name=%s,image_content_type=%s,image_stored_path=%s,updated_at=%s WHERE id=%s", (f["original"], f["stored"], f["contentType"], f["path"], now_iso(), focus_area_id)); return {"ok": True}

@app.get("/api/segments/{segment_id}/focus-areas")
def list_focus_areas(segment_id: int):
    with db() as conn:
        segment(conn, segment_id)
        return {"items": conn.execute("SELECT id,segment_id,start_station,end_station,length_m,reason,note,image_original_name,image_stored_name,image_content_type,created_at,updated_at FROM focus_areas WHERE segment_id=%s ORDER BY id DESC", (segment_id,)).fetchall()}

@app.get("/api/focus-areas/{focus_area_id}/image")
def download_focus_area_image(focus_area_id: int):
    with db() as conn:
        row = one(conn, "SELECT * FROM focus_areas WHERE id=%s", (focus_area_id,), "Focus area not found"); need(bool(row["image_stored_path"]), "Focus area image not found", 404); path = Path(row["image_stored_path"]); need(path.exists(), "Stored image not found", 404); return FileResponse(path, media_type=row["image_content_type"] or "application/octet-stream", filename=row["image_original_name"] or path.name)

@app.delete("/api/focus-areas/{focus_area_id}")
def delete_focus_area(focus_area_id: int):
    with db() as conn:
        row = one(conn, "SELECT * FROM focus_areas WHERE id=%s", (focus_area_id,), "Focus area not found"); remove_file(row["image_stored_path"]); conn.execute("DELETE FROM focus_areas WHERE id=%s", (focus_area_id,)); return {"ok": True}
