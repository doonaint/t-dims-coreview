import {
  badRequest,
  json,
  noContent,
  readRingmapState,
  validateProjectKey,
  writeRingmapState
} from '../../../_utils.js';

function decodeRingmapRows(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  if (Array.isArray(payload.rows)) {
    return payload.rows;
  }
  if (!Array.isArray(payload.segments) || !Array.isArray(payload.compactRows)) {
    return null;
  }
  return payload.compactRows
    .filter((item) => Array.isArray(item) && item.length >= 6)
    .map(([segmentIndex, ring, chainage, lat, lng, sortRing]) => ({
      segmentNumber: Number.isInteger(segmentIndex) && segmentIndex >= 0 && segmentIndex < payload.segments.length
        ? String(payload.segments[segmentIndex] || '')
        : '',
      ring,
      chainage,
      lat,
      lng,
      sortRing
    }));
}

export async function onRequestPost(context) {
  const projectKey = String(context.params.projectKey || '');
  try {
    validateProjectKey(projectKey);
  } catch (error) {
    return badRequest(error.message, 404);
  }

  const contentType = context.request.headers.get('content-type') || '';
  let rows = null;
  let fileName = `${projectKey}.xlsx`;
  let completedRing = '';
  if (contentType.includes('application/json')) {
    let payload;
    try {
      payload = await context.request.json();
    } catch {
      return badRequest('Invalid JSON payload');
    }
    rows = decodeRingmapRows(payload);
    fileName = String(payload?.fileName || `${projectKey}.xlsx`);
    completedRing = String(payload?.completedRing || '');
  } else {
    const formData = await context.request.formData();
    const rowsJson = String(formData.get('rows_json') || '[]');
    fileName = String(formData.get('file_name') || `${projectKey}.xlsx`);
    completedRing = String(formData.get('completed_ring') || '');
    let payload;
    try {
      payload = JSON.parse(rowsJson);
    } catch {
      return badRequest('Invalid rows_json payload');
    }
    rows = decodeRingmapRows(payload);
  }

  if (!Array.isArray(rows)) {
    return badRequest('Upload payload must contain a row list');
  }

  const state = await readRingmapState(context.env);

  state[projectKey] = {
    rows,
    completedRing,
    fileName
  };
  await writeRingmapState(context.env, state);

  return json({ ok: true, project: state[projectKey] });
}

export async function onRequestOptions() {
  return noContent();
}

