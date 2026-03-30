import {
  badRequest,
  getUploadObjectKey,
  json,
  noContent,
  readRingmapState,
  validateProjectKey,
  writeRingmapState
} from '../../../_utils.js';

export async function onRequestPost(context) {
  const projectKey = String(context.params.projectKey || '');
  try {
    validateProjectKey(projectKey);
  } catch (error) {
    return badRequest(error.message, 404);
  }

  const formData = await context.request.formData();
  const file = formData.get('file');
  const rowsJson = String(formData.get('rows_json') || '[]');
  const fileName = String(formData.get('file_name') || (file && file.name) || `${projectKey}.xlsx`);
  const completedRing = String(formData.get('completed_ring') || '');

  let rows;
  try {
    rows = JSON.parse(rowsJson);
  } catch {
    return badRequest('Invalid rows_json payload');
  }

  if (!Array.isArray(rows)) {
    return badRequest('rows_json must be a list');
  }

  const state = await readRingmapState(context.env);
  const savedFile = getUploadObjectKey(projectKey, fileName);

  if (file instanceof File && context.env.TCSMS_UPLOADS) {
    await context.env.TCSMS_UPLOADS.put(savedFile, await file.arrayBuffer(), {
      httpMetadata: {
        contentType: file.type || 'application/octet-stream'
      }
    });
  }

  state[projectKey] = {
    rows,
    completedRing,
    fileName,
    savedFile
  };
  await writeRingmapState(context.env, state);

  return json({ ok: true, project: state[projectKey] });
}

export async function onRequestOptions() {
  return noContent();
}

