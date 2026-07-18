// ── DAILY ──
function renderDaily() {
  const p = allData.proj.find(r => r.name === currentProject);
  if (!p) return;

  const rag = (p.rag||'L').toString().toUpperCase().charAt(0);
  const ragLabel = rag==='H'?'HIGH':rag==='M'?'MEDIUM':'LOW';

  const reports = allData.daily.filter(r => r.project === currentProject)
    .sort((a, b) => parseDateDMY(b.date) - parseDateDMY(a.date));
  const today = reports[0];
  const totalWorkers = today ? (parseInt(today.bch)||0) + (parseInt(today.worker)||0) : 0;
  const weather = today ? (today.weather||'—') : '—';
  const we = /mưa/i.test(weather)?'🌧':/nắng/i.test(weather)?'☀️':'⛅';

  let codDays = '—';
  if (p.cod) {
    try {
      const codDate = new Date(p.cod);
      const diff = Math.ceil((codDate - new Date()) / 86400000);
      codDays = diff > 0 ? diff + ' ngày' : 'Trễ ' + Math.abs(diff) + 'd';
    } catch {}
  }

  document.getElementById('daily-title').textContent = 'Daily — ' + p.name;
  document.getElementById('daily-sub').textContent = `EPC: ${p.epc||'—'} · TVGS: ${p.tvgs||'—'} · PM: ${p.pm||'—'}`;

  const feedHtml = reports.length ? reports.slice(0,7).map(r => {
    const we2 = /mưa/i.test(r.weather||'')?'🌧':/nắng/i.test(r.weather||'')?'☀️':'⛅';
    const totalW = (parseInt(r.bch)||0) + (parseInt(r.worker)||0);
    const works = (r.works||'').split('|').filter(Boolean);
    const worksHtml = works.length
      ? `<ul class="work-list">${works.map(w => `<li>${w}</li>`).join('')}</ul>` : '';
    return `
      <div class="feed-item">
        <div class="feed-hdr">
          <span class="feed-title">${r.date} · Tuần ${r.week||'?'}</span>
          <span class="feed-meta">${we2} ${r.weather||'—'} · ${totalW} người (BCH ${r.bch||0} · CN ${r.worker||0})</span>
        </div>
        ${worksHtml}
        ${r.materials && r.materials!=='Không' ? `<div style="font-size:11px;margin-top:5px;color:var(--gray)">📦 Vật tư: ${r.materials}</div>` : ''}
        ${r.issues  && r.issues!=='Không'    ? `<div style="font-size:11px;margin-top:5px;color:var(--accent)">🚨 ${r.issues}</div>` : ''}
      </div>`;
  }).join('') : '<div style="padding:24px;text-align:center;color:var(--gray)">Chưa có báo cáo nào</div>';

  document.getElementById('daily-content').innerHTML = `
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px;align-items:center">
      <span class="rag-pill rag-${rag}">${ragLabel}</span>
      ${p.issue?`<span style="font-size:12px;color:var(--accent)">🚨 ${p.issue}</span>`:''}
      ${p.picdept?`<span style="font-size:10px;padding:2px 8px;background:var(--blue-bg);color:var(--blue);border-radius:3px">PIC: ${p.picdept}</span>`:''}
      ${p.target?`<span style="font-size:11px;color:var(--gray)">🎯 ${p.target}</span>`:''}
      <span style="margin-left:auto;font-size:11px;color:var(--gray)">COD: ${codDays}</span>
    </div>
    <div class="kpi-row">
      <div class="kpi b"><div class="kpi-val">${totalWorkers||'—'}</div><div class="kpi-lbl">Nhân lực hôm nay</div></div>
      <div class="kpi g"><div class="kpi-val">${we} ${weather}</div><div class="kpi-lbl">Thời tiết</div></div>
      <div class="kpi y"><div class="kpi-val">${reports.length}</div><div class="kpi-lbl">Báo cáo đã lưu</div></div>
      <div class="kpi r"><div class="kpi-val">${ragLabel}</div><div class="kpi-lbl">RAG Status</div></div>
    </div>
    <div class="sec"><div class="sec-hdr"><span class="sec-num">1</span>Nhật ký báo cáo</div>
      <div class="feed">${feedHtml}</div>
    </div>`;
}
