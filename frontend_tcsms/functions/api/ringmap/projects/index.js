import { json, noContent, readRingmapState } from '../../_utils.js';

export async function onRequestGet(context) {
  const projects = await readRingmapState(context.env);
  return json({ projects });
}

export async function onRequestOptions() {
  return noContent();
}

