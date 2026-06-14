// Shared cloud-save client. PUTs the local save to the account API at
// <baseUrl>/api/save/<quest>/<profileId>; the server merges field-wise and
// returns the authoritative copy, which we persist locally. One round trip.
import { loadSave, persistSave } from './save.js';

export function buildSyncRequest({ baseUrl, quest, profileId, token, save }) {
  return {
    url: `${baseUrl}/api/save/${quest}/${encodeURIComponent(profileId)}`,
    options: {
      method: 'PUT',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(save),
    },
  };
}

export async function syncQuest({ quest, baseUrl, getToken, fetchImpl = fetch }) {
  const save = loadSave();
  const pid = save.profile?.id;
  if (!pid) return { ok: false, reason: 'no-profile' };
  let token;
  try { token = await getToken(); } catch { token = null; }
  if (!token) return { ok: false, reason: 'no-token' };
  try {
    const { url, options } = buildSyncRequest({ baseUrl, quest, profileId: pid, token, save });
    const res = await fetchImpl(url, options);
    if (!res.ok) return { ok: false, reason: `http-${res.status}` };
    const merged = await res.json();
    persistSave(merged);
    return { ok: true, merged };
  } catch {
    return { ok: false, reason: 'network' };
  }
}
