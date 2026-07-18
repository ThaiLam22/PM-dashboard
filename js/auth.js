// ── AUTH / SESSION ──
function loadSession() {
  try {
    const raw = localStorage.getItem('cme_session');
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s.token || !s.expiresAt || new Date(s.expiresAt) < new Date()) { localStorage.removeItem('cme_session'); return null; }
    return s;
  } catch (e) { return null; }
}
function saveSession(s) { localStorage.setItem('cme_session', JSON.stringify(s)); }
function clearSession() { localStorage.removeItem('cme_session'); currentUser = null; }

async function doLogin() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  errEl.style.display = 'none';
  if (!username || !password) { errEl.textContent = 'Nhập đủ tài khoản và mật khẩu'; errEl.style.display = 'block'; return; }
  try {
    const res = await fetch(API, { method: 'POST', body: JSON.stringify({ action: 'login', username, password }) });
    const d = await res.json();
    if (d.status !== 'ok') { errEl.textContent = d.message || 'Đăng nhập thất bại'; errEl.style.display = 'block'; return; }
    saveSession({ token: d.token, role: d.role, fullname: d.fullname, expiresAt: d.expiresAt });
    startApp();
  } catch (e) {
    errEl.textContent = 'Không kết nối được server'; errEl.style.display = 'block';
  }
}

function doLogout() {
  clearSession();
  location.reload();
}

function applyRolePermissions() {
  if (!currentUser) return;
  if (currentUser.role !== 'pm') {
    ['tab-daily','tab-weekly','tab-input','tab-projects'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    const sel = document.getElementById('proj-select');
    if (sel) sel.style.display = 'none';
    goPage('meeting', document.getElementById('tab-meeting'));
  }
}

function startApp() {
  const session = loadSession();
  if (!session) return;
  currentUser = session;
  document.getElementById('login-gate').style.display = 'none';
  document.getElementById('current-user-label').textContent = `${currentUser.fullname} (${DEPT_LABEL[currentUser.role] || currentUser.role})`;
  applyRolePermissions();
  loadAll();
}
