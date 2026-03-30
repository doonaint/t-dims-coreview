const PROJECT_KEYS = new Set(['GY', 'HN', 'NH', 'YP']);
const RINGMAP_STATE_KEY = 'ringmap_projects_state_v1';
const SHAFT_STATUS_STATE_KEY = 'shaft_weekly_status_v1';

export function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json; charset=utf-8');
  }
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function noContent(init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return new Response(null, { ...init, status: 204, headers });
}

export function validateProjectKey(projectKey) {
  if (!PROJECT_KEYS.has(projectKey)) {
    throw new Error(`Unknown project key: ${projectKey}`);
  }
  return projectKey;
}

export async function readJsonState(env, stateKey) {
  const raw = await env.TCSMS_STORAGE?.get(stateKey);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export async function writeJsonState(env, stateKey, payload) {
  if (!env.TCSMS_STORAGE) {
    throw new Error('Missing TCSMS_STORAGE KV binding');
  }
  await env.TCSMS_STORAGE.put(stateKey, JSON.stringify(payload));
}

export async function readRingmapState(env) {
  return readJsonState(env, RINGMAP_STATE_KEY);
}

export async function writeRingmapState(env, payload) {
  return writeJsonState(env, RINGMAP_STATE_KEY, payload);
}

export async function readShaftStatusState(env) {
  return readJsonState(env, SHAFT_STATUS_STATE_KEY);
}

export async function writeShaftStatusState(env, payload) {
  return writeJsonState(env, SHAFT_STATUS_STATE_KEY, payload);
}

export function badRequest(message, status = 400) {
  return json({ detail: message }, { status });
}

export function getUploadObjectKey(projectKey, originalName) {
  const dotIndex = originalName.lastIndexOf('.');
  const ext = dotIndex >= 0 ? originalName.slice(dotIndex).toLowerCase() : '.xlsx';
  return `ring_uploads/${projectKey}${ext}`;
}

export function normalizeShaftPayload(body) {
  return {
    weekStart: String(body?.weekStart || ''),
    items: Array.isArray(body?.items) ? body.items : []
  };
}

