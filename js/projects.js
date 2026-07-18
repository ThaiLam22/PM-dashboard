// ── PROJECTS (tab Dự án) ──
function renderProjects() {
  const rows = allData.proj;
  if (!rows.length) {
    document.getElementById('projects-content').innerHTML =
      '<div style="padding:32px;text-align:center;color:var(--gray)">Chưa có dự án.</div>';
    return;
  }
  const tblHtml = rows.map(r => {
    const rag = (r.rag||'L').toString().toUpperCase().charAt(0);
    const ragLbl = rag==='H'?'HIGH':rag==='M'?'MEDIUM':'LOW';
    return `<tr>
      <td><strong>${r.name||'—'}</strong></td>
      <td>${r.location||'—'}</td>
      <td>${r.epc||'—'}</td>
      <td>${r.tvgs||'—'}</td>
      <td>${r.capacity||'—'}</td>
      <td>${r.startdate||'—'}</td>
      <td>${r.cod||'—'}</td>
      <td>${r.pm||'—'}</td>
      <td><span class="rag-pill rag-${rag}">${ragLbl}</span></td>
      <td>${r.phase||'—'}</td>
      <td style="font-size:11px;color:var(--accent)">${r.issue||'—'}</td>
      <td style="font-size:11px">${r.picdept||'—'}</td>
      <td>${r.target||'—'}</td>
    </tr>`;
  }).join('');

  document.getElementById('projects-content').innerHTML = `
    <div class="tbl-wrap">
      <table><thead><tr>
        <th>Tên dự án</th><th>Địa điểm</th><th>EPC</th><th>TVGS</th><th>kWp</th>
        <th>Khởi công</th><th>COD</th><th>PM</th><th>RAG</th><th>Giai đoạn</th><th>Vấn đề</th><th>PIC</th><th>Target</th>
      </tr></thead><tbody>${tblHtml}</tbody></table>
    </div>`;
}

async function addProject() {
  const name = document.getElementById('np-name').value.trim();
  if (!name) { toast('Nhập tên dự án', 'err'); return; }
  const startdate = document.getElementById('np-startdate').value.trim();
  const cod = document.getElementById('np-cod').value.trim();
  const dateRe = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
  if (startdate && !dateRe.test(startdate)) { toast('Ngày khởi công phải theo dạng dd/mm/yyyy', 'err'); return; }
  if (cod && !dateRe.test(cod)) { toast('COD phải theo dạng dd/mm/yyyy', 'err'); return; }
  const row = [
    name,
    document.getElementById('np-location').value.trim(),
    document.getElementById('np-epc').value.trim(),
    document.getElementById('np-tvgs').value.trim(),
    document.getElementById('np-capacity').value.trim(),
    startdate,
    cod,
    document.getElementById('np-pm').value.trim(),
    document.getElementById('np-rag').value,
    document.getElementById('np-issue').value.trim(),
    document.getElementById('np-phase').value,
    document.getElementById('np-target').value.trim(),
    document.getElementById('np-picdept').value.trim(),
  ];
  const btn = document.querySelector('#page-projects .btn-green');
  btn.disabled = true; btn.textContent = 'Đang lưu...';
  try {
    await apiPost({ sheet: 'projects', row });
    toast('✓ Đã thêm dự án ' + name);
    clearProjectForm();
    await loadAll();
  } catch(e) {
    toast('Lỗi lưu dữ liệu', 'err');
  }
  btn.disabled = false; btn.textContent = '+ Thêm dự án';
}

function clearProjectForm() {
  ['np-name','np-location','np-epc','np-tvgs','np-capacity','np-startdate','np-cod','np-pm','np-issue','np-target','np-picdept']
    .forEach(id => document.getElementById(id).value = '');
  document.getElementById('np-rag').value = 'L';
  document.getElementById('np-phase').value = 'Pre';
}

async function exportCloseout(event) {
  const project = document.getElementById('export-project').value;
  if (!project) { toast('Chọn dự án trước', 'err'); return; }

  const btn = event.target;
  btn.disabled = true; btn.textContent = 'Đang export...';

  try {
    // Fetch all sheets, filter by project
    const [proj, daily, progress, payments, documents, permits] = await Promise.all([
      apiGet('projects'),
      apiGet('daily'),
      apiGetProgress(project),
      apiGet('payments'),
      apiGet('documents'),
      apiGet('permits'),
    ]);

    const projectInfo = proj.find(p => p.name === project);
    if (!projectInfo) { toast('Không tìm thấy dự án', 'err'); return; }

    const closeoutData = {
      _meta: {
        exportedAt: new Date().toISOString(),
        source: 'CME Solar Project Control System',
        project: project,
        note: 'File này dùng để tạo Closeout Report. Upload vào Claude chat và yêu cầu tạo closeout.'
      },
      project: projectInfo,
      daily: daily.filter(r => r.project === project),
      progress: progress,
      payments: payments.filter(r => r.project === project),
      documents: documents.filter(r => r.project === project),
      permits: permits.filter(r => r.project === project),
    };

    // Download JSON
    const blob = new Blob([JSON.stringify(closeoutData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const today = new Date().toISOString().slice(0,10).replace(/-/g,'');
    a.href = url;
    a.download = `${today}_${project}_closeout_data.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast(`✓ Đã export ${project}`);
  } catch(e) {
    console.error(e);
    toast('Lỗi export', 'err');
  }
  btn.disabled = false; btn.textContent = '📥 Export JSON';
}
