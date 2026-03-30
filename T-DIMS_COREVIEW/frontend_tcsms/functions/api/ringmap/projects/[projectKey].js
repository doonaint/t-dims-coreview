import {
  badRequest,
  json,
  noContent,
  readRingmapState,
  validateProjectKey,
  writeRingmapState
} from '../../_utils.js';

export async function onRequestPatch(context) {
  const projectKey = String(context.params.projectKey || '');
  try {
    validateProjectKey(projectKey);
  } catch (error) {
    return badRequest(error.message, 404);
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return badRequest('Invalid JSON payload');
  }

  const state = await readRingmapState(context.env);
  const project = state[projectKey];
  if (!project) {
    return badRequest('Project state not found', 404);
  }

  project.completedRing = String(body?.completedRing || '');
  state[projectKey] = project;
  await writeRingmapState(context.env, state);
  return json({ ok: true, project });
}

export async function onRequestDelete(context) {
  const projectKey = String(context.params.projectKey || '');
  try {
    validateProjectKey(projectKey);
  } catch (error) {
    return badRequest(error.message, 404);
  }

  const state = await readRingmapState(context.env);
  const project = state[projectKey] || null;
  delete state[projectKey];
  await writeRingmapState(context.env, state);

  if (project?.savedFile && context.env.TCSMS_UPLOADS) {
    await context.env.TCSMS_UPLOADS.delete(project.savedFile);
  }

  return json({ ok: true });
}

export async function onRequestOptions() {
  return noContent();
}

