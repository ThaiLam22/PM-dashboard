// ── API — mọi lời gọi tới Apps Script đi qua đây ──
function tokenParam() {
  return currentUser ? `&token=${encodeURIComponent(currentUser.token)}` : '';
}
async function apiGet(sheet) {
  const r = await fetch(`${API}?sheet=${encodeURIComponent(sheet)}${tokenParam()}`);
  const d = await r.json();
  return Array.isArray(d) ? d : [];
}
async function apiGetProgress(project) {
  const url = project
    ? `${API}?action=progress&project=${encodeURIComponent(project)}${tokenParam()}`
    : `${API}?action=progress${tokenParam()}`;
  const r = await fetch(url);
  const d = await r.json();
  return Array.isArray(d) ? d : [];
}
async function apiGetActionItems() {
  const r = await fetch(`${API}?action=actionitems${tokenParam()}`);
  const d = await r.json();
  return Array.isArray(d) ? d : [];
}
async function apiGetProjectHistory(project) {
  const r = await fetch(`${API}?action=project_history&project=${encodeURIComponent(project)}${tokenParam()}`);
  const d = await r.json();
  return Array.isArray(d) ? d : [];
}
async function apiPost(payload) {
  if (currentUser) payload.token = currentUser.token;
  const r = await fetch(API, { method: 'POST', body: JSON.stringify(payload) });
  return await r.json();
}
