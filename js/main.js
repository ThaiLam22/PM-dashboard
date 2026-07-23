// ── GLOBAL STATE ──
const API = 'https://script.google.com/macros/s/AKfycbxOqrw7USflAwjS0k8mdQATs1PAtiLF1oX7c_IN12JrvRx0AUqmANl1LqVWuil_XNXS/exec';
let allData = {};
let currentProject = '';
let parsed = null; // { dailyRow, progressRows, meta }
let currentUser = { role: 'pm', fullname: '', token: '' }; // không còn đăng nhập — ai vào cũng full quyền như PM
let actionItems = [];
const DEPT_LABEL = { pm:'PM', phaply:'Pháp lý', vattu:'Vật tư', hse:'HSE', kythuat:'Kỹ thuật', taichinh:'Tài chính', epc:'EPC', nhamay:'Nhà máy' };

// ── LOAD ALL ──
async function loadAll() {
  try {
    const [proj, daily, payments, documents, permits, hse, materials, acceptance, issues] = await Promise.all([
      apiGet('projects'), apiGet('daily'),
      apiGet('payments'), apiGet('documents'), apiGet('permits'),
      apiGet('hse'), apiGet('materials'),
      apiGet('acceptance'), apiGet('issues')
    ]);
    allData = { proj, daily, payments, documents, permits, hse, materials, acceptance, issues };

    const seen = new Set();
    const dupNames = [];
    const uniqueProj = proj.filter(p => {
      if (!p.name) return false;
      if (seen.has(p.name)) { dupNames.push(p.name); return false; }
      seen.add(p.name);
      return true;
    });
    const dupWarn = document.getElementById('dup-warning');
    if (dupNames.length) {
      dupWarn.textContent = `⚠️ Phát hiện ${dupNames.length} dự án trùng tên trong sheet: ${[...new Set(dupNames)].join(', ')} — vào Google Sheet kiểm tra lại. Bảng dưới đây vẫn hiện đủ để anh đối chiếu.`;
      dupWarn.style.display = 'block';
    } else {
      dupWarn.style.display = 'none';
    }

    const opts = uniqueProj.map(p => `<option value="${p.name}">${p.name}${p.location ? ' (' + p.location + ')' : ''}</option>`).join('');
    document.getElementById('proj-select').innerHTML = '<option value="">-- Chọn dự án --</option>' + opts;
    document.getElementById('inp-project').innerHTML = '<option value="">-- Chọn --</option>' + opts;
    document.getElementById('export-project').innerHTML = '<option value="">-- Chọn --</option>' + opts;

    setSyncStatus(true);
    renderProjects();
    await loadMeeting();

    const params = new URLSearchParams(window.location.search);
    const projectParam = params.get('project') || '';
    if (projectParam) {
      document.getElementById('proj-select').value = projectParam;
    } else if (proj.length) {
      document.getElementById('proj-select').value = proj[0].name;
    }
    onProjectChange();
  } catch(e) {
    console.error(e);
    setSyncStatus(false);
    toast('Không kết nối được database', 'err');
  }
}

async function onProjectChange() {
  currentProject = document.getElementById('proj-select').value;
  if (!currentProject) return;
  // Re-fetch progress với status mới cho project hiện tại
  const progressItems = await apiGetProgress(currentProject);
  allData.progress = progressItems;
  populateWeekFilter();
  renderDaily();
  renderWeekly();
  renderMeetingBlocks();
}

function onWeekFilterChange() {
  renderWeekly();
}

// ── KHỞI ĐỘNG APP — phải load sau cùng, sau khi mọi file .js khác đã có mặt ──
loadAll();
