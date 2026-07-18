// ── UTILS — dùng chung cho nhiều tab ──
function toast(msg, type='ok') {
  const t = document.getElementById('toast');
  t.textContent = msg; t.className = 'toast ' + type;
  t.style.display = 'block';
  setTimeout(() => t.style.display = 'none', 3000);
}
function goPage(id, el) {
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('page-' + id).classList.add('active');
}
function goWtab(id, el) {
  document.querySelectorAll('.wtab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('[id^="wtab-"]').forEach(p => p.style.display = 'none');
  el.classList.add('active');
  document.getElementById('wtab-' + id).style.display = 'block';
}
function setSyncStatus(ok) {
  document.getElementById('sync-dot').className = 'sync-dot ' + (ok ? 'ok' : 'err');
  document.getElementById('sync-text').textContent = ok ? new Date().toLocaleTimeString('vi') : 'Lỗi kết nối';
}
function bColor(v){return v>=90?'var(--green)':v>=70?'var(--yellow)':'var(--accent)';}
function badgeClass(s) {
  const sl = (s||'').toLowerCase();
  if (/done|xong|hoàn thành|đủ|duyệt|cấp/i.test(sl)) return 'b-done';
  if (/chờ|đang|trình|loading/i.test(sl))            return 'b-wait';
  if (/thiếu|chưa|không|miss/i.test(sl))             return 'b-miss';
  return 'b-na';
}
function statusToCls(status) {
  return {
    'on_track':      'stag-on',
    'behind':        'stag-behind',
    'at_risk':       'stag-risk',
    'overdue':       'stag-late',
    'done_early':    'stag-done',
    'done_late':     'stag-done',
    'started_early': 'stag-early',
  }[status] || 'stag-risk';
}
function parseDateDMY(value) {
  if (!value) return new Date(0);
  const m = value.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (m) {
    const y = m[3].length === 2 ? '20'+m[3] : m[3];
    return new Date(`${y}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`);
  }
  const d = new Date(value);
  return isNaN(d) ? new Date(0) : d;
}
