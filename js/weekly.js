// ── WEEKLY (tab Overall — 8 sub-tab) ──
function populateWeekFilter() {
  const weeks = [...new Set(
    (allData.progress || [])
      .filter(r => r.project === currentProject)
      .map(r => r.week)
      .filter(Boolean)
  )].sort((a, b) => +a - +b);

  const sel = document.getElementById('week-filter');
  const current = sel.value;
  sel.innerHTML = '<option value="">Tất cả tuần</option>' +
    weeks.map(w => `<option value="${esc(w)}" ${w == current ? 'selected' : ''}>Tuần ${esc(w)}</option>`).join('');
}

function renderWeekly() {
  if (!currentProject) return;
  populateWeekFilter();
  const weekFilter = document.getElementById('week-filter')?.value || '';
  renderProgress(weekFilter);
  renderPermits();
  renderPayments();
  renderDocs();
  renderHse();
  renderMaterials();
  renderAcceptance();
  renderIssues();
  document.getElementById('weekly-title').textContent = 'Overall — ' + currentProject;
}

function renderProgress(weekFilter) {
  let items = allData.progress || [];
  if (weekFilter) items = items.filter(r => String(r.week) === String(weekFilter));
  if (!items.length) {
    document.getElementById('wtab-progress').innerHTML =
      '<div style="padding:32px;text-align:center;color:var(--gray)">Chưa có dữ liệu tiến độ. Nhập báo cáo TVGS ở tab "Nhập báo cáo".</div>';
    return;
  }

  const avgActual = items.reduce((s,i) => s + (i.pct||0), 0) / items.length;
  const avgPlan   = items.reduce((s,i) => s + (i.pctPlan||0), 0) / items.length;
  const avgDelta     = Math.round((avgActual - avgPlan) * 10) / 10;
  const avgDeltaCls  = avgDelta > 0 ? 'g' : avgDelta < 0 ? 'r' : '';
  const avgDeltaSign = avgDelta > 0 ? '+' : '';
  const overdue   = items.filter(i => i.status === 'overdue').length;
  const atRisk    = items.filter(i => i.status === 'at_risk').length;
  const done      = items.filter(i => i.status === 'done_early' || i.status === 'done_late').length;

  // COD của dự án đang chọn — HĐ ưu tiên cod_contract, fallback cod; Actual từ cod_actual
  const proj   = allData.proj.find(r => r.name === currentProject) || {};
  const codHD  = proj.cod_contract || proj.cod || '—';
  const codAct = proj.cod_actual || '—';

  const progHtml = items.map(i => {
    const clr = bColor(i.pct);
    const planMark = Math.min(100, i.pctPlan);
    const stagCls = statusToCls(i.status);
    const delta = Math.round(((i.pct||0) - (i.pctPlan||0)) * 10) / 10;
    const dCls  = delta > 0 ? 'pos' : delta < 0 ? 'neg' : 'zero';
    const dSign = delta > 0 ? '+' : '';
    return `
      <div class="prog-row">
        <span class="prog-name" title="${esc(i.item)}">${esc(i.item)}</span>
        <div class="bar-track">
          <div class="bar-fill" style="width:${Math.min(100,i.pct)}%;background:${clr}"></div>
          <div class="bar-plan-mark" style="left:${planMark}%" title="KH: ${i.pctPlan}%"></div>
        </div>
        <span class="prog-pct" style="color:${clr}">${i.pct}%</span>
        <span class="prog-plan">/ ${i.pctPlan}%</span>
        <span class="prog-delta ${dCls}" title="Δ = TT − KH">${dSign}${delta}%</span>
        <span class="stag ${stagCls}">${esc(i.statusLabel)}</span>
      </div>`;
  }).join('');

  document.getElementById('wtab-progress').innerHTML = `
    <div class="cod-bar">
      <span>📅 <strong>COD Hợp đồng:</strong> ${esc(codHD)}</span>
      <span class="sep">|</span>
      <span>🏁 <strong>COD Actual:</strong> ${esc(codAct)}</span>
    </div>
    <div class="kpi-row" style="grid-template-columns:repeat(5,1fr);margin-bottom:16px">
      <div class="kpi b">
        <div class="kpi-val">${Math.round(avgActual)}%</div>
        <div class="kpi-lbl">TT · KH ${Math.round(avgPlan)}%</div>
      </div>
      <div class="kpi ${avgDeltaCls}"><div class="kpi-val">${avgDeltaSign}${avgDelta}%</div><div class="kpi-lbl">Δ tổng (TT − KH)</div></div>
      <div class="kpi r"><div class="kpi-val">${overdue}</div><div class="kpi-lbl">Đã trễ</div></div>
      <div class="kpi y"><div class="kpi-val">${atRisk}</div><div class="kpi-lbl">Nguy cơ trễ</div></div>
      <div class="kpi g"><div class="kpi-val">${done}/${items.length}</div><div class="kpi-lbl">Hoàn thành</div></div>
    </div>
    <div class="card">
      <div class="card-lbl">Tiến độ từng hạng mục</div>
      <div style="display:flex;gap:16px;margin-bottom:12px;font-size:11px;color:var(--gray);flex-wrap:wrap">
        <span>📊 Thanh màu = % thực tế</span>
        <span>▎Vạch đen = % kế hoạch hôm nay</span>
        <span style="color:var(--green)">■ Xanh ≥ 90%</span>
        <span style="color:var(--yellow)">■ Vàng 70–89%</span>
        <span style="color:var(--accent)">■ Đỏ &lt; 70%</span>
      </div>
      ${progHtml}
    </div>`;

}

function renderPermits() {
  const rows = allData.permits.filter(r => r.project === currentProject);
  if (!rows.length) {
    document.getElementById('wtab-permits').innerHTML =
      '<div style="padding:32px;text-align:center;color:var(--gray)">Chưa có data pháp lý.</div>';
    return;
  }
  const done = rows.filter(r => badgeClass(r.status) === 'b-done').length;
  const miss = rows.filter(r => /thiếu|chưa/i.test(r.status||'')).length;

  const tblHtml = rows.map(r => `
    <tr>
      <td>${esc(r.organization||'—')}</td>
      <td>${esc(r.docname||'—')}</td>
      <td><span class="badge ${badgeClass(r.status)}">${esc(r.status||'—')}</span></td>
      <td>${esc(r.date||'—')}</td>
      <td style="color:var(--gray)">${esc(r.note||'—')}</td>
    </tr>`).join('');

  document.getElementById('wtab-permits').innerHTML = `
    <div class="kpi-row" style="margin-bottom:16px">
      <div class="kpi g"><div class="kpi-val">${done}</div><div class="kpi-lbl">Hoàn thành</div></div>
      <div class="kpi r"><div class="kpi-val">${miss}</div><div class="kpi-lbl">Còn thiếu</div></div>
      <div class="kpi b"><div class="kpi-val">${rows.length}</div><div class="kpi-lbl">Tổng hồ sơ</div></div>
      <div class="kpi y"><div class="kpi-val">${rows.length-done-miss}</div><div class="kpi-lbl">Đang chờ</div></div>
    </div>
    <div class="tbl-wrap">
      <table><thead><tr><th>Cơ quan</th><th>Hồ sơ</th><th>Trạng thái</th><th>Ngày</th><th>Ghi chú</th></tr></thead>
      <tbody>${tblHtml}</tbody></table>
    </div>`;
}

function renderPayments() {
  const rows = allData.payments.filter(r => r.project === currentProject);
  if (!rows.length) {
    document.getElementById('wtab-payments').innerHTML =
      '<div style="padding:32px;text-align:center;color:var(--gray)">Chưa có data thanh toán.</div>';
    return;
  }
  const duyet = rows.filter(r => /approved|paid|đã duyệt/i.test(r.approvalstatus||'')).length;

  const tblHtml = rows.map(r => `
    <tr>
      <td>${esc(r.paymentround||'—')}</td>
      <td style="font-size:11px;color:var(--gray)">${esc(r.condition||'—')}</td>
      <td>${esc(r.actualamount||'—')}</td>
      <td><span class="badge ${badgeClass(r.approvalstatus)}">${esc(r.approvalstatus||'—')}</span></td>
      <td style="font-size:11px;color:var(--gray)">${esc(r.note||'—')}</td>
    </tr>`).join('');

  document.getElementById('wtab-payments').innerHTML = `
    <div class="kpi-row" style="margin-bottom:16px">
      <div class="kpi g"><div class="kpi-val">${duyet}</div><div class="kpi-lbl">Đã duyệt</div></div>
      <div class="kpi r"><div class="kpi-val">${rows.length-duyet}</div><div class="kpi-lbl">Chưa duyệt</div></div>
      <div class="kpi b"><div class="kpi-val">${rows.length}</div><div class="kpi-lbl">Tổng đợt</div></div>
      <div class="kpi y"><div class="kpi-val">${rows.filter(r=>/chờ/i.test(r.approvalstatus||'')).length}</div><div class="kpi-lbl">Đang chờ</div></div>
    </div>
    <div class="tbl-wrap">
      <table><thead><tr><th>Đợt</th><th>Điều kiện</th><th>Thực tế</th><th>Quyết định</th><th>Ghi chú</th></tr></thead>
      <tbody>${tblHtml}</tbody></table>
    </div>`;
}

function renderDocs() {
  const rows = allData.documents.filter(r => r.project === currentProject);
  if (!rows.length) {
    document.getElementById('wtab-docs').innerHTML =
      '<div style="padding:32px;text-align:center;color:var(--gray)">Chưa có data hồ sơ.</div>';
    return;
  }
  const done = rows.filter(r => badgeClass(r.status) === 'b-done').length;

  const tblHtml = rows.map(r => `
    <tr>
      <td>${esc(r.docname||'—')}</td>
      <td><span class="badge ${badgeClass(r.status)}">${esc(r.status||'—')}</span></td>
      <td>${esc(r.updateddate||'—')}</td>
      <td style="font-size:11px;color:var(--gray)">${esc(r.note||'—')}</td>
    </tr>`).join('');

  document.getElementById('wtab-docs').innerHTML = `
    <div class="kpi-row" style="margin-bottom:16px">
      <div class="kpi g"><div class="kpi-val">${done}/${rows.length}</div><div class="kpi-lbl">Hoàn thành</div></div>
      <div class="kpi r"><div class="kpi-val">${rows.length-done}</div><div class="kpi-lbl">Còn lại</div></div>
      <div class="kpi b"><div class="kpi-val">${rows.length?Math.round(done/rows.length*100):0}%</div><div class="kpi-lbl">Tỷ lệ</div></div>
      <div class="kpi y"><div class="kpi-val">${rows.length-done}</div><div class="kpi-lbl">Đang chờ</div></div>
    </div>
    <div class="tbl-wrap">
      <table><thead><tr><th>Hồ sơ</th><th>Trạng thái</th><th>Cập nhật</th><th>Ghi chú</th></tr></thead>
      <tbody>${tblHtml}</tbody></table>
    </div>`;
}

function renderHse() {
  const weekFilter = document.getElementById('week-filter')?.value || '';
  const rows = (allData.hse || []).filter(r => r.project === currentProject && (!weekFilter || r.week === weekFilter));
  if (!rows.length) {
    document.getElementById('wtab-hse').innerHTML =
      '<div style="padding:32px;text-align:center;color:var(--gray)">Chưa có data HSE.</div>';
    return;
  }
  const latest = rows[rows.length - 1];
  const tblHtml = rows.map(r => `
    <tr>
      <td>Tuần ${esc(r.week||'—')}</td>
      <td>${esc(r.date||'—')}</td>
      <td>${esc(r.manpower||'—')}</td>
      <td>${esc(r.manhours||'—')}</td>
      <td><span class="badge ${+r.lti>0?'b-miss':'b-done'}">${esc(r.lti||0)}</span></td>
      <td><span class="badge ${+r.accidents>0?'b-wait':'b-done'}">${esc(r.accidents||0)}</span></td>
      <td style="font-size:11px;color:var(--gray)">${esc(r.note||'—')}</td>
    </tr>`).join('');

  document.getElementById('wtab-hse').innerHTML = `
    <div class="kpi-row" style="margin-bottom:16px">
      <div class="kpi b"><div class="kpi-val">${esc(latest.manpower||0)}</div><div class="kpi-lbl">Nhân lực tuần mới nhất</div></div>
      <div class="kpi g"><div class="kpi-val">${esc(latest.manhours||0)}</div><div class="kpi-lbl">Giờ công</div></div>
      <div class="kpi r"><div class="kpi-val">${rows.reduce((s,r)=>s+(+r.lti||0),0)}</div><div class="kpi-lbl">LTI lũy kế</div></div>
      <div class="kpi y"><div class="kpi-val">${rows.reduce((s,r)=>s+(+r.accidents||0),0)}</div><div class="kpi-lbl">Tai nạn lũy kế</div></div>
    </div>
    <div class="tbl-wrap">
      <table><thead><tr><th>Tuần</th><th>Ngày</th><th>Nhân lực</th><th>Giờ công</th><th>LTI</th><th>Tai nạn</th><th>Ghi chú</th></tr></thead>
      <tbody>${tblHtml}</tbody></table>
    </div>`;
}

function renderMaterials() {
  const weekFilter = document.getElementById('week-filter')?.value || '';
  const rows = (allData.materials || []).filter(r => r.project === currentProject && (!weekFilter || r.week === weekFilter));
  if (!rows.length) {
    document.getElementById('wtab-materials').innerHTML =
      '<div style="padding:32px;text-align:center;color:var(--gray)">Chưa có data vật tư.</div>';
    return;
  }
  const tblHtml = rows.map(r => `
    <tr>
      <td>${esc(r.date||'—')}</td>
      <td>Tuần ${esc(r.week||'—')}</td>
      <td><strong>${esc(r.item||'—')}</strong></td>
      <td>${esc(r.quantity||'—')} ${esc(r.unit||'')}</td>
      <td>${esc(r.brand||'—')}</td>
      <td>${esc(r.supplier||'—')}</td>
      <td><span class="badge ${badgeClass(r.quality_check)}">${esc(r.quality_check||'—')}</span></td>
      <td style="font-size:11px;color:var(--gray)">${esc(r.note||'—')}</td>
    </tr>`).join('');

  document.getElementById('wtab-materials').innerHTML = `
    <div class="kpi-row" style="margin-bottom:16px">
      <div class="kpi b"><div class="kpi-val">${rows.length}</div><div class="kpi-lbl">Tổng mục vật tư</div></div>
      <div class="kpi g"><div class="kpi-val">${rows.filter(r=>/pass|ok|đạt/i.test(r.quality_check||'')).length}</div><div class="kpi-lbl">Đạt QC</div></div>
      <div class="kpi r"><div class="kpi-val">${rows.filter(r=>/fail|không đạt/i.test(r.quality_check||'')).length}</div><div class="kpi-lbl">Không đạt</div></div>
      <div class="kpi y"><div class="kpi-val">${rows.filter(r=>/pending/i.test(r.quality_check||'')).length}</div><div class="kpi-lbl">Chờ kiểm tra</div></div>
    </div>
    <div class="tbl-wrap">
      <table><thead><tr><th>Ngày</th><th>Tuần</th><th>Vật tư</th><th>Số lượng</th><th>Hãng</th><th>NCC</th><th>QC</th><th>Ghi chú</th></tr></thead>
      <tbody>${tblHtml}</tbody></table>
    </div>`;
}

function renderAcceptance() {
  const rows = (allData.acceptance || []).filter(r => r.project === currentProject);
  if (!rows.length) {
    document.getElementById('wtab-acceptance').innerHTML =
      '<div style="padding:32px;text-align:center;color:var(--gray)">Chưa có data nghiệm thu.</div>';
    return;
  }
  const pass = rows.filter(r => /pass/i.test(r.result||'')).length;
  const fail = rows.filter(r => /fail/i.test(r.result||'')).length;
  const tblHtml = rows.map(r => `
    <tr>
      <td>${esc(r.date||'—')}</td>
      <td>${esc(r.item||'—')}</td>
      <td><span class="badge ${/pass/i.test(r.result||'')?'b-done':/fixed/i.test(r.result||'')?'b-wait':'b-miss'}">${esc(r.result||'—')}</span></td>
      <td style="font-size:11px;color:var(--accent)">${esc(r.issue||'—')}</td>
      <td style="font-size:11px;color:var(--gray)">${esc(r.resolution||'—')}</td>
      <td style="font-size:11px;color:var(--gray)">${esc(r.note||'—')}</td>
    </tr>`).join('');
  document.getElementById('wtab-acceptance').innerHTML = `
    <div class="kpi-row" style="margin-bottom:16px">
      <div class="kpi g"><div class="kpi-val">${pass}</div><div class="kpi-lbl">Đạt</div></div>
      <div class="kpi r"><div class="kpi-val">${fail}</div><div class="kpi-lbl">Không đạt</div></div>
      <div class="kpi y"><div class="kpi-val">${rows.length-pass-fail}</div><div class="kpi-lbl">Đã khắc phục</div></div>
      <div class="kpi b"><div class="kpi-val">${rows.length}</div><div class="kpi-lbl">Tổng</div></div>
    </div>
    <div class="tbl-wrap">
      <table><thead><tr><th>Ngày</th><th>Hạng mục</th><th>Kết quả</th><th>Vấn đề</th><th>Xử lý</th><th>Ghi chú</th></tr></thead>
      <tbody>${tblHtml}</tbody></table>
    </div>`;
}

function renderIssues() {
  const rows = (allData.issues || []).filter(r => r.project === currentProject);
  if (!rows.length) {
    document.getElementById('wtab-issues').innerHTML =
      '<div style="padding:32px;text-align:center;color:var(--gray)">Chưa có data vấn đề.</div>';
    return;
  }
  const high = rows.filter(r => r.severity === 'high').length;
  const open = rows.filter(r => !r.resolution).length;
  const tblHtml = rows.map(r => {
    const sevCls = r.severity==='high'?'b-miss':r.severity==='medium'?'b-wait':'b-na';
    return `
    <tr>
      <td>${esc(r.date||'—')}</td>
      <td><span class="badge b-na">${esc(r.type||'—')}</span></td>
      <td style="font-size:11px">${esc(r.description||'—')}</td>
      <td style="font-size:11px;color:var(--green)">${esc(r.resolution||'—')}</td>
      <td style="font-size:11px;color:var(--gray)">${esc(r.lesson||'—')}</td>
      <td><span class="badge ${sevCls}">${esc(r.severity||'—')}</span></td>
    </tr>`}).join('');
  document.getElementById('wtab-issues').innerHTML = `
    <div class="kpi-row" style="margin-bottom:16px">
      <div class="kpi r"><div class="kpi-val">${high}</div><div class="kpi-lbl">Nghiêm trọng</div></div>
      <div class="kpi y"><div class="kpi-val">${open}</div><div class="kpi-lbl">Chưa xử lý</div></div>
      <div class="kpi g"><div class="kpi-val">${rows.length-open}</div><div class="kpi-lbl">Đã xử lý</div></div>
      <div class="kpi b"><div class="kpi-val">${rows.length}</div><div class="kpi-lbl">Tổng</div></div>
    </div>
    <div class="tbl-wrap">
      <table><thead><tr><th>Ngày</th><th>Loại</th><th>Mô tả</th><th>Xử lý</th><th>Bài học</th><th>Mức độ</th></tr></thead>
      <tbody>${tblHtml}</tbody></table>
    </div>`;
}
