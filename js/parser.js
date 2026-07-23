// ─────────────────────────────────────────────────────
// PARSER TVGS (tab Nhập báo cáo)
// ─────────────────────────────────────────────────────
function extractDate(t) {
  // "ngày 12/05/2026" hoặc "12/05/2026"
  const m = t.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (m) {
    const y = m[3].length === 2 ? '20'+m[3] : m[3];
    return `${m[1].padStart(2,'0')}/${m[2].padStart(2,'0')}/${y}`;
  }
  const d = new Date();
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function extractWeather(t) {
  // Sáng + Chiều
  const sang  = t.match(/sáng[^\n]*?(không mưa|có mưa|mưa|nắng)/i);
  const chieu = t.match(/chiều[^\n]*?(không mưa|có mưa|mưa|nắng)/i);
  if (sang && chieu) return `Sáng ${sang[1]}, Chiều ${chieu[1]}`;
  if (sang) return `Sáng ${sang[1]}`;
  if (chieu) return `Chiều ${chieu[1]}`;
  if (/không mưa/i.test(t)) return 'Không mưa';
  if (/nắng/i.test(t)) return 'Nắng';
  if (/mưa/i.test(t)) return 'Có mưa';
  return '—';
}

function parseBCH(t) {
  // CHT, QC/QA, GSKT, GSAT, HSE, An toàn, Thủ kho, TVGS
  const roles = [
    {key:'CHT',     re:/\bCHT\b[:\s]+(\d+)/i},
    {key:'QC/QA',   re:/\b(?:QA\/QC|QC\/QA|QC|QA)\b[:\s]+(\d+)/i},
    {key:'GSKT',    re:/\bGSKT\b[:\s]+(\d+)/i},
    {key:'GSAT',    re:/\bGSAT\b[:\s]+(\d+)/i},
    {key:'HSE',     re:/\bHSE\b[:\s]+(\d+)/i},
    {key:'An toàn', re:/\ban\s*toàn\b[:\s]+(\d+)/i},
    {key:'Thủ kho', re:/thủ\s*kho[:\s]+(\d+)/i},
    {key:'TVGS',    re:/\bTVGS\b[:\s]+(\d+)/i},
  ];
  const detail = [];
  let totalBch = 0;
  let tvgsCount = 0;
  roles.forEach(r => {
    const m = t.match(r.re);
    if (m) {
      const n = +m[1];
      detail.push(`${r.key}:${n}`);
      if (r.key === 'TVGS') {
        tvgsCount = n;
      } else {
        totalBch += n;
      }
    }
  });
  return { bchTotal: totalBch, bchDetail: detail.join('|'), tvgsCount };
}

function extractWorkers(t) {
  const m = t.match(/công\s*nhân[:\s]+(\d+)/i);
  return m ? +m[1] : 0;
}

function extractMaterials(t) {
  // "Vật tư về công trường" → lấy nội dung sau đó đến section tiếp
  const m = t.match(/vật\s*tư[^\n]*\n+\s*[•\-\*]?\s*([^\n]+)/i);
  if (m) return m[1].trim();
  return '';
}

function extractIssues(t) {
  // "Những tồn tại" hoặc "Ý kiến TVGS" hoặc "Vấn đề"
  t = t.normalize('NFC');
  const m1 = t.match(/những\s*tồn\s*tại[^\n]*\n+\s*[•\-\*]?\s*([^\n]+)/i);
  const m2 = t.match(/ý\s*kiến\s*TVGS[^\n]*\n+\s*[•\-\*]?\s*([^\n]+)/i);
  const parts = [];
  if (m1 && !/^kh\S*ng/i.test(m1[1].trim())) parts.push('Tồn tại: ' + m1[1].trim());
  if (m2 && !/^kh\S*ng/i.test(m2[1].trim())) parts.push('TVGS: ' + m2[1].trim());
  return parts.join(' · ');
}

function extractWorks(t) {
  // Section "Công tác thi công trong ngày" / "Công việc trong ngày" → list items đến section tiếp
  const lines = t.split(/[\n\r]+/);
  const items = [];
  let inSection = false;
  for (const line of lines) {
    const l = line.trim();
    if (!l) continue;
    if (/công\s*(tác|việc)\s*(thi\s*công|trong\s*ngày)/i.test(l)) { inSection = true; continue; }
    if (inSection && /^\d+[:\.\)]\s*(công\s*tác|vật\s*tư|nghiệm\s*thu|tồn\s*tại|ý\s*kiến)/i.test(l)) { inSection = false; }
    if (!inSection) continue;
    // Loại bỏ bullet/numbering
    const clean = l.replace(/^[•\-\*\+]+\s*/, '').replace(/^\d+[:\.\)]\s*/, '').trim();
    if (clean.length < 3) continue;
    if (/^công\s*(tác|việc)/i.test(clean)) continue;
    items.push(clean);
  }
  return items;
}

function extractProgressTable(t) {
  const idx = t.search(/bảng\s*đánh\s*giá\s*tiến\s*độ/i);
  if (idx < 0) return [];

  const section = t.substring(idx);
  const tokens = section
    .split(/\t|\r?\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const dateRe = /\d{1,2}\/\d{1,2}\/\d{2,4}/;

  const items = [];
  let i = 0;

  // Bỏ qua header
  while (i < tokens.length && !/^\d+$/.test(tokens[i])) i++;

  while (i < tokens.length) {
    // Token 0: STT (số)
    if (!/^\d+$/.test(tokens[i])) { i++; continue; }

    const stt = tokens[i];
    let j = i + 1;

    // Token 1: item name (không phải số, không phải ngày)
    if (j >= tokens.length || dateRe.test(tokens[j]) || /^\d+$/.test(tokens[j])) { i++; continue; }
    const item = tokens[j]; j++;

    // Token 2: startPlan (ngày)
    if (j >= tokens.length || !dateRe.test(tokens[j])) { i++; continue; }
    const startPlan = normalizeDate(tokens[j]); j++;

    // Token 3: finishPlan (ngày)
    if (j >= tokens.length || !dateRe.test(tokens[j])) { i++; continue; }
    const finishPlan = normalizeDate(tokens[j]); j++;

    // Token 4: số ngày chậm (bỏ qua)
    if (j < tokens.length && /^\d+$/.test(tokens[j])) j++;

    // Token 5: note (có thể trống — nếu token tiếp là STT mới thì bỏ qua)
    let note = '';
    if (j < tokens.length && !/^\d+$/.test(tokens[j]) && !dateRe.test(tokens[j])) {
      note = tokens[j]; j++;
    }

    let pct = 0;
    const pctMatch = note.match(/(\d{1,3})\s*%/);
    if (pctMatch) pct = Math.min(100, parseInt(pctMatch[1]));
    else if (/hoàn\s*thành/i.test(note)) pct = 100;

    items.push({ item, startPlan, finishPlan, pct, note });
    i = j;
  }

  return items;
}

function normalizeDate(s) {
  const m = s.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!m) return s;
  const y = m[3].length === 2 ? '20'+m[3] : m[3];
  return `${m[1].padStart(2,'0')}/${m[2].padStart(2,'0')}/${y}`;
}

// ── SAMPLE ──
const SAMPLE = `Báo cáo khối lượng công việc nhà thầu thi công ngày 13/05/2026.
Thời gian làm việc.
Sáng 7h30 đến 11h30: Không mưa
Chiều 13h00 đến 17h00: Không mưa

TVGS: 03 người
1: Nhân lực nhà thầu.
CHT: 01 người
QC: 01 người
GSKT: 03 người
HSE: 02 người
Thủ kho: 01 người
Công nhân: 56 người

2: Vật tư về công trường.
Tấm PV: 10 pallet.

3: Công tác thi công trong ngày.
Lắp đặt cáp DC.
Bấm đầu MC4.
Lắp đặt và cân chỉnh tấm PV.
Lắp đặt tấm PV Mái 2: 10 pallet.

4: Công tác thí nghiệm.
Không.

5: Nghiệm thu trong ngày.
Không.

6: Những tồn tại cần ý kiến CĐT.
Không.

7: Ý kiến TVGS.
Không.

BẢNG ĐÁNH GIÁ TIẾN ĐỘ THỰC HIỆN CÔNG VIỆC
STT	Nội Dung Công Việc	Bắt đầu	Kết thúc	Số Ngày Chậm Trễ	Nhận Xét
1	Lắp đặt hệ thống lối đi	28/01/2026	13/02/2026	66	Đang thi công: 95%
2	Lắp đặt nhà trạm Inverter	30/01/2026	09/02/2026	70	Đang thi công: 95%
3	Lắp đặt Inverter	26/02/2026	03/03/2026	59	Đang thi công: 50%
4	Lắp đặt Máng cáp, dây cứu sinh	09/02/2026	07/03/2026	51	Đang thi công: 95%`;

function loadSample() { document.getElementById('raw-input').value = SAMPLE; }

// ── PARSE & PREVIEW ──
function parseReport() {
  const raw = document.getElementById('raw-input').value.trim();
  const project = document.getElementById('inp-project').value;
  const week = document.getElementById('inp-tuan').value;
  if (!raw)     { toast('Paste nội dung báo cáo trước', 'err'); return; }
  if (!project) { toast('Chọn dự án trước', 'err'); return; }
  if (!week)    { toast('Nhập tuần số trước', 'err'); return; }

  const date = extractDate(raw);
  const weather = extractWeather(raw);
    const { bchTotal, bchDetail, tvgsCount } = parseBCH(raw);
  const workers = extractWorkers(raw);
  const totalBch = bchTotal; // BCH = nhà thầu only, TVGS tách riêng
  const works = extractWorks(raw);
  const materials = extractMaterials(raw) || 'Không';
  const issues = extractIssues(raw) || '';

  const progressItems = extractProgressTable(raw);

  // Build rows
  const dailyRow = [
    date, project, week,
    totalBch, workers,
    works.join('|'),
    materials,
    weather,
    issues,
    raw
  ];

  const progressRows = progressItems.map(p => [
    project, date, week, p.item,
    p.startPlan, p.finishPlan,
    '', '', // startactual, finishactual — Apps Script tự tính khi đọc
    p.pct,
    '',     // status — Apps Script tự tính
    p.note
  ]);

  parsed = { dailyRow, progressRows, meta: { date, project, week, weather, totalBch, workers, works, materials, issues, bchDetail, progressItems } };

  // Render preview
  const we = /mưa/i.test(weather)?'🌧':/nắng/i.test(weather)?'☀️':'⛅';
  const worksHtml = works.length
    ? `<ul style="margin-left:18px;font-size:11px;line-height:1.6">${works.map(w => `<li>${esc(w)}</li>`).join('')}</ul>`
    : '<span style="color:var(--gray)">Không có</span>';

  const progressTblHtml = progressItems.length ? `
    <table class="preview-tbl">
      <thead><tr><th>Hạng mục</th><th>KH bắt đầu</th><th>KH kết thúc</th><th>%</th></tr></thead>
      <tbody>
        ${progressItems.map(p => `<tr>
          <td>${esc(p.item)}</td>
          <td style="font-family:monospace;font-size:10px">${esc(p.startPlan)}</td>
          <td style="font-family:monospace;font-size:10px">${esc(p.finishPlan)}</td>
          <td style="font-weight:700;color:${bColor(p.pct)}">${p.pct}%</td>
        </tr>`).join('')}
      </tbody>
    </table>` : '<div style="color:var(--gray);font-size:11px">Không tìm thấy bảng tiến độ</div>';

  document.getElementById('parse-preview').innerHTML = `
    <div style="font-weight:700;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid var(--border)">
      ${esc(project)} · Tuần ${esc(week)} · ${esc(date)}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
      <div><div style="font-size:9px;font-weight:700;color:var(--gray);margin-bottom:3px">THỜI TIẾT</div><span style="font-size:12px">${we} ${esc(weather)}</span></div>
      <div><div style="font-size:9px;font-weight:700;color:var(--gray);margin-bottom:3px">NHÂN LỰC</div><span style="font-size:12px"><strong>${totalBch + workers}</strong> (BCH ${totalBch} · CN ${workers})</span></div>
    </div>

    ${bchDetail ? `<div style="margin-bottom:10px"><div style="font-size:9px;font-weight:700;color:var(--gray);margin-bottom:5px">BCH CHI TIẾT</div>
      <div class="bch-row">${bchDetail.split('|').map(b => `<span class="bch-chip">${esc(b.replace(':',': '))}</span>`).join('')}</div>
    </div>` : ''}

    <div style="margin-bottom:10px"><div style="font-size:9px;font-weight:700;color:var(--gray);margin-bottom:5px">CÔNG VIỆC</div>${worksHtml}</div>

    ${materials && materials !== 'Không' ? `<div style="margin-bottom:6px;font-size:11px">📦 Vật tư: ${esc(materials)}</div>` : ''}
    ${issues ? `<div style="margin-bottom:10px;font-size:11px;color:var(--accent)">🚨 ${esc(issues)}</div>` : ''}

    <div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--border)">
      <div style="font-size:9px;font-weight:700;color:var(--gray);margin-bottom:5px">BẢNG TIẾN ĐỘ (sẽ lưu vào sheet progress)</div>
      ${progressTblHtml}
    </div>`;

  document.getElementById('progress-count').textContent = progressRows.length;
  document.getElementById('save-area').style.display = 'block';
}

function clearParse() {
  const raw = document.getElementById('raw-input').value.trim();
  if (raw && !confirm('Xoá nội dung báo cáo đã nhập?')) return;
  document.getElementById('raw-input').value = '';
  document.getElementById('parse-preview').innerHTML = 'Paste báo cáo và nhấn "Đọc báo cáo"';
  document.getElementById('save-area').style.display = 'none';
  parsed = null;
}

async function saveAll() {
  if (!parsed) return;
  const btn = document.querySelector('#save-area button');
  btn.textContent = 'Đang lưu...'; btn.disabled = true;
  try {
    // Lưu daily
    await apiPost({ sheet: 'daily', row: parsed.dailyRow });
    // Lưu progress (batch)
    if (parsed.progressRows.length) {
      await apiPost({ sheet: 'progress', rows: parsed.progressRows });
    }
    toast(`✓ Đã lưu daily + ${parsed.progressRows.length} dòng progress`);
    document.getElementById('raw-input').value = '';
    document.getElementById('parse-preview').innerHTML = 'Paste báo cáo và nhấn "Đọc báo cáo"';
    document.getElementById('save-area').style.display = 'none';
    parsed = null;
    btn.textContent = '💾 Lưu vào database'; btn.disabled = false;
    await loadAll();
  } catch(e) {
    console.error(e);
    toast('Lỗi lưu dữ liệu', 'err');
    btn.textContent = '💾 Lưu vào database'; btn.disabled = false;
  }
}
