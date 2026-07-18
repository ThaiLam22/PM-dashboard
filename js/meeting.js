// ── MEETING (Họp tuần) — nhóm theo từng dự án ──
function isOverdue(item) {
  if (!item.deadline || item.status === 'done') return false;
  const d = parseDateDMY(item.deadline);
  return d && d.getTime() > 0 && d < new Date();
}

function groupActionItemsByProject() {
  const map = {};
  actionItems.forEach(item => {
    if (!map[item.project]) map[item.project] = [];
    map[item.project].push(item);
  });
  return map;
}

const STATUS_LABEL = { open:'Chưa xử lý', in_progress:'Đang xử lý', done:'Đã xong' };

function meetingItemRowHtml(r) {
  const overdue = isOverdue(r);
  const editable = currentUser.role === 'pm' || r.department === currentUser.role;
  const statusOptions = ['open','in_progress','done'].map(s => `<option value="${s}" ${r.status===s?'selected':''}>${STATUS_LABEL[s]}</option>`).join('');
  return `
    <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--s2);flex-wrap:wrap;${overdue?'background:var(--red-bg)':''}">
      <span style="flex:1;min-width:140px;font-size:12.5px">${r.description||'—'}${overdue?' <span class="warning-chip">Quá hạn</span>':''}</span>
      <span class="badge b-na">${DEPT_LABEL[r.department]||r.department||'—'}</span>
      <span style="font-size:11px;color:var(--gray);min-width:60px">${r.deadline||'—'}</span>
      ${editable
        ? `<select onchange="updateMeetingItemStatus('${r.id}', this.value)" style="font-size:11px;padding:3px 6px">${statusOptions}</select>`
        : `<span class="badge ${r.status==='done'?'b-done':r.status==='in_progress'?'b-wait':'b-na'}">${STATUS_LABEL[r.status]||r.status||'—'}</span>`}
      ${editable ? `<input type="text" value="${r.note||''}" placeholder="Ghi chú" onchange="updateMeetingItemNote('${r.id}', this.value)" style="width:120px;font-size:11px;padding:3px 6px;border:1px solid var(--border);border-radius:4px">` : (r.note?`<span style="font-size:11px;color:var(--gray)">${r.note}</span>`:'')}
    </div>`;
}

function meetingBlockId(name) {
  return 'mi-hist-' + name.replace(/[^a-zA-Z0-9]/g, '');
}

function toggleMeetingHistory(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function renderMeetingBlocks() {
  const grouped = groupActionItemsByProject();
  const isPm = currentUser.role === 'pm';
  const projects = allData.proj || [];

  const blocksHtml = projects.map(p => {
    // Mọi vai trò đều thấy hết dự án (để sửa được rag/issue/picdept/target bất kỳ lúc nào),
    // nhưng action-item vẫn chỉ lọc đúng phòng ban của họ (trừ PM thấy hết).
    const items = (grouped[p.name] || []).filter(i => isPm || i.department === currentUser.role);
    const active = items.filter(i => i.status !== 'done');
    const done = items.filter(i => i.status === 'done');
    const rag = (p.rag||'L').toString().toUpperCase().charAt(0);
    const ragLbl = rag==='H'?'HIGH':rag==='M'?'MEDIUM':'LOW';
    const histId = meetingBlockId(p.name);

    const rowsHtml = active.length ? active.map(meetingItemRowHtml).join('')
      : '<div style="padding:10px 0;color:var(--gray);font-size:12px">Không có việc tồn đọng</div>';

    const editId = meetingBlockId(p.name) + '-edit';
    const editFormHtml = `
      <div id="${editId}" style="display:none;margin:8px 0;padding:12px;background:var(--s2);border-radius:6px">
        <div class="form-grid">
          <div class="fg"><label>RAG</label>
            <select class="pe-rag">
              <option value="L" ${rag==='L'?'selected':''}>L — Low</option>
              <option value="M" ${rag==='M'?'selected':''}>M — Medium</option>
              <option value="H" ${rag==='H'?'selected':''}>H — High</option>
            </select>
          </div>
          <div class="fg"><label>Giai đoạn</label>
            <select class="pe-phase">
              ${['Pre','CON','O&M','EPC'].map(ph => `<option value="${ph}" ${p.phase===ph?'selected':''}>${ph}</option>`).join('')}
            </select>
          </div>
          <div class="fg span2"><label>Vấn đề</label><input type="text" class="pe-issue" value="${String(p.issue||'').replace(/"/g,'&quot;')}"></div>
          <div class="fg"><label>PIC Dept</label><input type="text" class="pe-picdept" value="${String(p.picdept||'').replace(/"/g,'&quot;')}"></div>
          <div class="fg"><label>Mục tiêu</label><input type="text" class="pe-target" value="${String(p.target||'').replace(/"/g,'&quot;')}"></div>
        </div>
        <div class="btn-row">
          <button class="btn btn-green" onclick="saveProjectEdit('${p.name.replace(/'/g,"\\'")}', '${editId}', this)">Lưu</button>
          <button class="btn btn-ghost" onclick="toggleProjectEdit('${editId}')">Huỷ</button>
        </div>
      </div>`;

    const quickAddHtml = isPm ? `
      <div class="mi-quickadd" style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;align-items:center">
        <input type="text" placeholder="Việc mới cho ${p.name}..." class="mi-qa-desc" style="flex:1;min-width:160px;padding:6px 10px;border:1px solid var(--border);border-radius:5px;font-family:inherit;font-size:12px">
        <select class="mi-qa-dept" style="padding:6px 8px;border:1px solid var(--border);border-radius:5px;font-family:inherit;font-size:12px">
          <option value="phaply">Pháp lý</option><option value="vattu">Vật tư</option><option value="hse">HSE</option>
          <option value="kythuat">Kỹ thuật</option><option value="taichinh">Tài chính</option><option value="epc">EPC</option>
          <option value="nhamay">Nhà máy</option><option value="pm">PM</option>
        </select>
        <input type="text" placeholder="dd/mm/yyyy" class="mi-qa-deadline" style="width:90px;padding:6px 8px;border:1px solid var(--border);border-radius:5px;font-family:inherit;font-size:12px">
        <button class="btn btn-green" style="padding:6px 12px;font-size:11px" onclick="quickAddMeetingItem('${p.name.replace(/'/g,"\\'")}', this)">+ Thêm</button>
      </div>` : '';

    return `
      <div class="card" style="margin-bottom:14px">
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:4px">
          <span class="rag-pill rag-${rag}">${ragLbl}</span>
          <strong style="font-size:13px">${p.name}</strong>
          <span class="badge b-na">${p.phase||'—'}</span>
          ${p.issue?`<span style="font-size:12px;color:var(--accent)">🚨 ${p.issue}</span>`:''}
          ${p.picdept?`<span style="font-size:10px;padding:2px 8px;background:var(--blue-bg);color:var(--blue);border-radius:3px">${p.picdept}</span>`:''}
          <span style="margin-left:auto;font-size:11px;color:var(--gray);cursor:pointer;text-decoration:underline" onclick="toggleProjectHistory('${p.name.replace(/'/g,"\\'")}', '${editId}-hist')">📜 Lịch sử dự án</span>
          <span style="font-size:11px;color:var(--gray);cursor:pointer;text-decoration:underline" onclick="toggleProjectEdit('${editId}')">✏️ Edit</span>
        </div>
        ${editFormHtml}
        <div id="${editId}-hist" style="display:none;margin:8px 0;padding:10px 12px;background:var(--s2);border-radius:6px;font-size:12px"></div>
        <div class="mi-rows">${rowsHtml}</div>
        ${quickAddHtml}
        ${done.length ? `
          <div style="margin-top:8px">
            <span style="font-size:11px;color:var(--gray);cursor:pointer;text-decoration:underline" onclick="toggleMeetingHistory('${histId}')">📜 Xem lịch sử (${done.length} việc đã xong)</span>
            <div id="${histId}" style="display:none;margin-top:6px">${done.map(meetingItemRowHtml).join('')}</div>
          </div>` : ''}
      </div>`;
  }).join('');

  document.getElementById('meeting-project-blocks').innerHTML = blocksHtml || '<div style="padding:24px;text-align:center;color:var(--gray)">Chưa có dự án hoặc action-item nào phù hợp</div>';
}

async function loadMeeting() {
  actionItems = await apiGetActionItems();
  renderMeetingBlocks();
}

function toggleProjectEdit(editId) {
  const el = document.getElementById(editId);
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

async function toggleProjectHistory(project, histId) {
  const el = document.getElementById(histId);
  if (!el) return;
  const show = el.style.display === 'none';
  el.style.display = show ? 'block' : 'none';
  if (show && !el.dataset.loaded) {
    el.textContent = 'Đang tải...';
    const history = await apiGetProjectHistory(project);
    el.dataset.loaded = '1';
    el.innerHTML = history.length ? history.map(h => `
      <div style="padding:6px 0;border-bottom:1px solid var(--border)">
        <div style="font-family:'JetBrains Mono',monospace;font-size:10px;color:var(--gray)">${h.date ? new Date(h.date).toLocaleString('vi-VN') : '—'} · ${h.changed_by || '—'}</div>
        <div style="margin-top:2px">RAG: <b>${h.rag||'—'}</b> · Giai đoạn: <b>${h.phase||'—'}</b>${h.picdept?` · PIC: <b>${h.picdept}</b>`:''}</div>
        ${h.issue ? `<div>Vấn đề: ${h.issue}</div>` : ''}
        ${h.target ? `<div>Mục tiêu: ${h.target}</div>` : ''}
      </div>`).join('') : '<div style="color:var(--gray)">Chưa có lịch sử thay đổi nào</div>';
  }
}

async function saveProjectEdit(project, editId, btn) {
  const wrap = document.getElementById(editId);
  const rag = wrap.querySelector('.pe-rag').value;
  const phase = wrap.querySelector('.pe-phase').value;
  const issue = wrap.querySelector('.pe-issue').value.trim();
  const picdept = wrap.querySelector('.pe-picdept').value.trim();
  const target = wrap.querySelector('.pe-target').value.trim();
  btn.disabled = true; btn.textContent = 'Đang lưu...';
  try {
    const res = await apiPost({ action: 'updateProject', project, rag, phase, issue, picdept, target });
    if (res.status !== 'ok') { toast(res.message || 'Lỗi lưu dự án', 'err'); btn.disabled = false; btn.textContent = 'Lưu'; return; }
    toast('✓ Đã cập nhật ' + project);
    const proj = allData.proj.find(p => p.name === project);
    if (proj) { proj.rag = rag; proj.phase = phase; proj.issue = issue; proj.picdept = picdept; proj.target = target; }
    renderMeetingBlocks();
  } catch (e) {
    toast('Lỗi lưu dự án', 'err');
    btn.disabled = false; btn.textContent = 'Lưu';
  }
}

async function quickAddMeetingItem(project, btn) {
  const wrap = btn.closest('.mi-quickadd');
  const description = wrap.querySelector('.mi-qa-desc').value.trim();
  const department = wrap.querySelector('.mi-qa-dept').value;
  const deadline = wrap.querySelector('.mi-qa-deadline').value.trim();
  if (!description) { toast('Nhập nội dung việc', 'err'); return; }
  btn.disabled = true;
  try {
    const res = await apiPost({ action: 'createActionItem', project, department, deadline, description, week: '' });
    if (res.status !== 'ok') { toast(res.message || 'Lỗi tạo action-item', 'err'); btn.disabled = false; return; }
    toast('✓ Đã thêm việc mới cho ' + project);
    await loadMeeting();
  } catch (e) { toast('Lỗi tạo action-item', 'err'); btn.disabled = false; }
}

async function updateMeetingItemStatus(id, status) {
  try {
    const res = await apiPost({ action: 'updateActionItemStatus', id, status });
    if (res.status !== 'ok') { toast(res.message || 'Lỗi cập nhật', 'err'); await loadMeeting(); return; }
    const item = actionItems.find(r => r.id === id);
    if (item) item.status = status;
    renderMeetingBlocks();
  } catch (e) { toast('Lỗi cập nhật trạng thái', 'err'); }
}

async function updateMeetingItemNote(id, note) {
  try {
    const res = await apiPost({ action: 'updateActionItemStatus', id, note });
    if (res.status !== 'ok') toast(res.message || 'Lỗi cập nhật', 'err');
    const item = actionItems.find(r => r.id === id);
    if (item) item.note = note;
  } catch (e) { toast('Lỗi cập nhật ghi chú', 'err'); }
}
