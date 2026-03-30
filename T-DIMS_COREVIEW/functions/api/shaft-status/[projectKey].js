import {
  badRequest,
  json,
  noContent,
  normalizeShaftPayload,
  readShaftStatusState,
  validateProjectKey,
  writeShaftStatusState
} from '../_utils.js';

export async function onRequestGet(context) {
  const projectKey = String(context.params.projectKey || '');
  try {
    validateProjectKey(projectKey);
  } catch (error) {
    return badRequest(error.message, 404);
  }

  const state = await readShaftStatusState(context.env);
  return json({ project: state[projectKey] || { weeks: {} } });
}

export async function onRequestPut(context) {
  const projectKey = String(context.params.projectKey || '');
  try {
    validateProjectKey(projectKey);
  } catch (error) {
    return badRequest(error.message, 404);
  }

  let body;
  try {
    body = normalizeShaftPayload(await context.request.json());
  } catch {
    return badRequest('Invalid JSON payload');
  }

  if (!body.weekStart) {
    return badRequest('weekStart is required');
  }

  const state = await readShaftStatusState(context.env);
  const project = state[projectKey] || { weeks: {} };
  project.weeks = project.weeks || {};
  project.weeks[body.weekStart] = { items: body.items };
  state[projectKey] = project;
  await writeShaftStatusState(context.env, state);
  return json({ ok: true, project });
}

export async function onRequestOptions() {
  return noContent();
}

