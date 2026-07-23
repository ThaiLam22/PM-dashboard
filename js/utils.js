// ── UTILS — dùng chung cho nhiều tab ──
// esc() = escape HTML — bắt buộc dùng cho MỌI text tự do lấy từ sheet trước khi chèn vào
// innerHTML (issue, target, note, description...), vì backend không còn token nên ai cũng
// ghi được vào sheet — không escape sẽ dính XSS (xem CLAUDE.md).
function esc(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
// Dùng riêng cho text chèn vào onclick="...('TEXT')" — TEXT nằm trong chuỗi JS (nháy đơn)
// lồng trong thuộc tính HTML (nháy kép). Thứ tự bắt buộc: thoát JS trước (\, '), rồi thoát
// HTML sau (&, ") — không dùng esc() ở đây vì esc() sẽ thoát dấu ' sai ngữ cảnh.
// Render nội dung Vấn đề đã gộp bullet — mỗi dòng có thể kết thúc bằng "(PIC: X)" (do backend
// gắn khi gộp), đổi thành 1 badge nhỏ màu xanh thay vì để ngoặc đơn thô cho gọn mắt.
function formatIssueHtml(text) {
  if (!text) return '';
  return esc(text).split('\n').map(line =>
    line.replace(/\(PIC: ([^)]+)\)\s*$/, '<span style="font-size:10px;padding:1px 6px;background:var(--blue-bg);color:var(--blue);border-radius:2px;margin-left:4px">PIC: $1</span>')
  ).join('<br>');
}
function escJsAttr(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;');
}
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
function isWeekLocked() {
  return new Date().getDay() === 0; // Chủ nhật (0) — khóa cả ngày, mở lại 00:00 Thứ 2
}
function parseDateDMY(value) {
  if (!value) return new Date(0);
  value = String(value);
  const m = value.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (m) {
    const y = m[3].length === 2 ? '20'+m[3] : m[3];
    return new Date(`${y}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`);
  }
  const d = new Date(value);
  return isNaN(d) ? new Date(0) : d;
}
