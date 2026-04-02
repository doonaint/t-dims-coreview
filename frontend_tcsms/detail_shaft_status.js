(function (global) {
  const INFO_MODAL_ID = 'shaftInfoModal';
  const PROJECT_LABELS = {
    GY: '\uad50\uc0b0',
    HN: '\ud558\ub0a8',
    NH: '\ub0a8\ud55c\uac15',
    YP: '\uc591\ud3c9'
  };
  const PROJECT_INFO = {
    HN: {
      title: '\ud558\ub0a8 \uc218\uc9c1\uad6c \uc815\ubcf4',
      columns: ['\uad6c\uac04', '\ubc1c\uc9c4 \uc218\uc9c1\uad6c', '\uc2ec\ub3c4 H(m)', '\uc804\ubc29\ud130\ub110(m)', '\ud6c4\ubc29\ud130\ub110(m)', 'TBM \ud615\uc2dd', 'TBM \uc81c\uc870\uc0ac', '\ud130\ub110\uc5f0\uc7a5(m)', '\ube44\uace0'],
      rows: [
        { section: '1-1\uad6c\uac04', shaftNumber: '#2', depthMeters: 58.2, frontTunnelMeters: 12, rearTunnelMeters: 9, tbmType: '\uc774\uc218\uc2dd/\uc2e0\uad6c', tbmMaker: 'CRCHI', tunnelMeters: 2060.68, noteText: '26\ub144 10\uc6d4 \ubc1c\uc9c4 \uc608\uc815' },
        { section: '1-2\uad6c\uac04', shaftNumber: '#3', depthMeters: 78.7, frontTunnelMeters: 12, rearTunnelMeters: 9, tbmType: '\uc774\uc218\uc2dd/\uc2e0\uad6c', tbmMaker: 'CRCHI', tunnelMeters: 2695.42, noteText: '27\ub144 5\uc6d4 \ubc1c\uc9c4 \uc608\uc815' },
        { section: '1-3\uad6c\uac04', shaftNumber: '#4', depthMeters: 32.4, frontTunnelMeters: 12, rearTunnelMeters: 9, tbmType: '\uc774\uc218\uc2dd/\uc2e0\uad6c', tbmMaker: 'CREG', tunnelMeters: 2541.96, noteText: '27\ub144 4\uc6d4 \ubc1c\uc9c4 \uc608\uc815' },
        { section: '1-4\uad6c\uac04', shaftNumber: '#5-1', depthMeters: 40.1, frontTunnelMeters: 12, rearTunnelMeters: 9, tbmType: '\uc774\uc218\uc2dd/\uc2e0\uad6c', tbmMaker: 'CREG', tunnelMeters: 1453.86, noteText: '27\ub144 7\uc6d4 \ubc1c\uc9c4 \uc608\uc815' },
        { section: '1-5\uad6c\uac04', shaftNumber: '#5', depthMeters: 55.7, frontTunnelMeters: 12, rearTunnelMeters: 9, tbmType: '\uc774\uc218\uc2dd/\uc2e0\uad6c', tbmMaker: 'CREG', tunnelMeters: 2516.59, noteText: '27\ub144 3\uc6d4 \ubc1c\uc9c4 \uc608\uc815' }
      ]
    },
    NH: {
      title: '\ub0a8\ud55c\uac15 \uc218\uc9c1\uad6c \uc815\ubcf4',
      columns: ['\uad6c\uac04', '\ubc1c\uc9c4 \uc218\uc9c1\uad6c', '\uc2ec\ub3c4 H(m)', '\uc804\ubc29\ud130\ub110(m)', '\ud6c4\ubc29\ud130\ub110(m)', 'TBM \ud615\uc2dd', 'TBM \uc81c\uc870\uc0ac', '\ud130\ub110\uc5f0\uc7a5(m)'],
      rows: [
        { section: '3-1\uad6c\uac04', shaftNumber: '#7', depthMeters: 41.6, frontTunnelMeters: 12, rearTunnelMeters: 9, tbmType: '\uc774\uc218\uc2dd/\uc2e0\uad6c', tbmMaker: 'CRCHI', tunnelMeters: 1996 },
        { section: '3-2\uad6c\uac04', shaftNumber: '#8', depthMeters: 56.4, frontTunnelMeters: 12, rearTunnelMeters: 9, tbmType: '\uc774\uc218\uc2dd/\uc2e0\uad6c', tbmMaker: 'CRCHI', tunnelMeters: 2476 },
        { section: '3-3\uad6c\uac04', shaftNumber: '#8-1', depthMeters: 39.4, frontTunnelMeters: 12, rearTunnelMeters: 9, tbmType: '\uc774\uc218\uc2dd/\uc2e0\uad6c', tbmMaker: 'CRCHI', tunnelMeters: 2301 },
        { section: '3-4\uad6c\uac04', shaftNumber: '#9', depthMeters: 44.6, frontTunnelMeters: 12, rearTunnelMeters: 9, tbmType: '\uc774\uc218\uc2dd/\uc2e0\uad6c', tbmMaker: 'CRCHI', tunnelMeters: 2213 }
      ]
    },
    YP: {
      title: '\uc591\ud3c9 \uc218\uc9c1\uad6c \uc815\ubcf4',
      columns: ['\uad6c\uac04', '\ubc1c\uc9c4 \uc218\uc9c1\uad6c', '\uc2ec\ub3c4 H(m)', '\uc804\ubc29\ud130\ub110(m)', '\ud6c4\ubc29\ud130\ub110(m)', 'TBM \ud615\uc2dd', 'TBM \uc81c\uc870\uc0ac', '\ud130\ub110\uc5f0\uc7a5(m)', '\ube44\uace0'],
      rows: [
        { section: '4-1\uad6c\uac04', shaftNumber: '#11-1', depthMeters: 37.2, frontTunnelMeters: 12, rearTunnelMeters: 15, tbmType: '\ud1a0\uc555\uc2dd/\uc2e0\uad6c', tbmMaker: 'JIMT, TNM', tunnelMeters: 1854, noteText: '26\ub144 9\uc6d4 \ubc1c\uc9c4 \uc608\uc815' },
        { section: '4-2\uad6c\uac04', shaftNumber: '#11', depthMeters: 59.7, frontTunnelMeters: 12, rearTunnelMeters: 9, tbmType: '\uc774\uc218\uc2dd/\uc2e0\uad6c', tbmMaker: 'JIMT, TNM', tunnelMeters: 2345, noteText: '26\ub144 10\uc6d4 \ubc1c\uc9c4 \uc608\uc815' },
        { section: '4-3\uad6c\uac04', shaftNumber: '#12', depthMeters: 37.5, frontTunnelMeters: 12, rearTunnelMeters: 9, tbmType: '\uc774\uc218\uc2dd/\uc2e0\uad6c', tbmMaker: 'JIMT, TNM', tunnelMeters: 2343, noteText: '26\ub144 3\uc6d4 \ubc1c\uc9c4 \uc608\uc815' },
        { section: '4-4\uad6c\uac04', shaftNumber: '#13', depthMeters: 34.9, frontTunnelMeters: 12, rearTunnelMeters: 15, tbmType: '\ud1a0\uc555\uc2dd/\uc911\uace0', tbmMaker: 'JIMT, TNM', tunnelMeters: 2467, noteText: '26\ub144 4\uc6d4 \ubc1c\uc9c4 \uc608\uc815' }
      ]
    }
  };

  function mondayOf(input) {
    const source = input ? new Date(input) : new Date();
    const date = new Date(source.getFullYear(), source.getMonth(), source.getDate());
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    return date;
  }

  function toDateValue(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function weekLabel(weekStart) {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${weekStart} ~ ${toDateValue(end)}`;
  }

  function tone(percent) {
    if (percent >= 100) return 'emerald';
    if (percent >= 70) return 'sky';
    if (percent >= 30) return 'amber';
    return 'rose';
  }

  function statusMarkup(item) {
    const total = Number(item.totalMeters) || 0;
    const completed = Number(item.completedMeters) || 0;
    const percent = total > 0 ? Math.max(0, Math.min(100, Math.round((completed / total) * 100))) : 0;
    const currentTone = tone(percent);
    if (percent >= 100) {
      return '<span class="px-2 py-0.5 rounded text-[10px] font-bold border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">\uc644\ub8cc</span>';
    }
    return `
      <div class="flex items-center gap-2">
        <div class="w-12 h-1.5 bg-[#233648] rounded-full overflow-hidden">
          <div class="h-full ${currentTone === 'sky' ? 'bg-sky-400' : currentTone === 'amber' ? 'bg-amber-400' : 'bg-rose-400'}" style="width:${percent}%;"></div>
        </div>
        <span class="font-bold ${currentTone === 'sky' ? 'text-sky-400' : currentTone === 'amber' ? 'text-amber-400' : 'text-rose-400'}">${percent}%</span>
      </div>
    `;
  }

  async function fetchSections(projectKey) {
    const response = await fetch(`/api/projects/${projectKey}/sections`);
    if (!response.ok) throw new Error('section fetch failed');
    const payload = await response.json();
    return Array.isArray(payload && payload.sections) ? payload.sections : [];
  }

  async function fetchSectionWeek(sectionId) {
    const response = await fetch(`/api/sections/${sectionId}/shaft-weekly-progress`);
    if (!response.ok) throw new Error('section shaft progress fetch failed');
    const payload = await response.json();
    return Array.isArray(payload && payload.items) ? payload.items : [];
  }

  async function saveSectionWeek(sectionId, weekStart, item) {
    const response = await fetch(`/api/sections/${sectionId}/shaft-weekly-progress/${weekStart}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        weekStart,
        progressDistanceM: Number(item.weeklyMeters) || 0,
        cumulativeDistanceM: Number(item.completedMeters) || 0,
        note: item.note || ''
      })
    });
    if (!response.ok) throw new Error('section shaft progress save failed');
  }

  function buildToolbarMarkup(projectKey, weekStart) {
    return `
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div class="flex flex-col gap-1">
          <p class="text-white text-sm font-semibold">\uc218\uc9c1\uad6c\uc77c\uc9c0</p>
          <p class="text-[#92adc9] text-xs">\uc8fc\uac04 \uae30\uc900\uc73c\ub85c \uc138\ubd80\uad6c\uac04\ubcc4 \uc218\uc9c1\uad6c \uc9c4\ub3c4\ub97c \uad00\ub9ac\ud569\ub2c8\ub2e4.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <input id="shaftWeekInput" type="date" value="${weekStart}" class="rounded-lg border border-border-dark bg-[#0f172a] px-3 py-2 text-white text-xs focus:border-sky-400 focus:outline-none" />
          <button id="shaftWeekThisBtn" type="button" class="rounded-lg border border-border-dark bg-[#0f172a] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1f2937]">\uc774\ubc88 \uc8fc</button>
          ${PROJECT_INFO[projectKey] ? '<button id="shaftInfoOpenBtn" type="button" class="rounded-lg border border-border-dark bg-[#0f172a] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1f2937]">\uc218\uc9c1\uad6c \uc815\ubcf4</button>' : ''}
        </div>
      </div>
      <div id="shaftWeekLabel" class="mt-3 text-[11px] text-[#92adc9]"></div>
      <div id="shaftWeekMessage" class="mt-2 text-[11px] text-[#92adc9]"></div>
    `;
  }

  function renderDisplayTable(thead, tbody, items) {
    thead.innerHTML = `
      <tr>
        <th class="px-4 py-3 font-bold">\uc218\uc9c1\uad6c \uba85\uce6d</th>
        <th class="px-4 py-3 font-bold">\uc218\uc9c1\uad6c \uad74\uc9c4\ud604\ud669 (m)</th>
        <th class="px-4 py-3 font-bold">\uc9c4\ucc99\ub960</th>
      </tr>
    `;
    tbody.innerHTML = items.map((item) => `
      <tr class="hover:bg-[#233648]/50 transition-colors">
        <td class="px-4 py-4 font-semibold text-white">
          ${item.name}
          ${item.note ? `<div class="mt-1 text-[11px] text-[#92adc9]">${item.note}</div>` : ''}
        </td>
        <td class="px-4 py-4 text-[#92adc9]">
          <div>${Number(item.completedMeters || 0)}m / ${Number(item.totalMeters || 0)}m</div>
          <div class="mt-1 text-[11px] text-[#7f95ac]">\uae08\uc8fc \uc785\ub825: ${Number(item.weeklyMeters || 0)}m</div>
        </td>
        <td class="px-4 py-4">${statusMarkup(item)}</td>
      </tr>
    `).join('');
  }

  function buildModalTable(items) {
    return `
      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#1a2632;color:#92adc9;text-transform:uppercase;font-size:11px;">
            <th style="padding:12px 14px;text-align:left;">\uc218\uc9c1\uad6c</th>
            <th style="padding:12px 14px;text-align:left;">\uae08\uc8fc (m)</th>
            <th style="padding:12px 14px;text-align:left;">\ub204\uacc4 (m)</th>
            <th style="padding:12px 14px;text-align:left;">\uacc4\ud68d (m)</th>
            <th style="padding:12px 14px;text-align:left;">\ube44\uace0</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item) => `
            <tr style="border-top:1px solid #233648;">
              <td style="padding:14px;color:#fff;font-weight:700;">${item.name}</td>
              <td style="padding:14px;"><input data-field="weeklyMeters" data-section-id="${item.sectionId}" type="number" min="0" step="0.1" value="${Number(item.weeklyMeters || 0)}" style="width:100%;height:38px;border-radius:10px;border:1px solid #233648;background:#0f172a;color:#fff;padding:0 10px;" /></td>
              <td style="padding:14px;"><input data-field="completedMeters" data-section-id="${item.sectionId}" type="number" min="0" step="0.1" value="${Number(item.completedMeters || 0)}" style="width:100%;height:38px;border-radius:10px;border:1px solid #233648;background:#0f172a;color:#fff;padding:0 10px;" /></td>
              <td style="padding:14px;"><input data-field="totalMeters" data-section-id="${item.sectionId}" type="number" min="0" step="0.1" value="${Number(item.totalMeters || 0)}" style="width:100%;height:38px;border-radius:10px;border:1px solid #233648;background:#0f172a;color:#fff;padding:0 10px;" /></td>
              <td style="padding:14px;"><input data-field="note" data-section-id="${item.sectionId}" type="text" value="${String(item.note || '').replace(/"/g, '&quot;')}" style="width:100%;height:38px;border-radius:10px;border:1px solid #233648;background:#0f172a;color:#fff;padding:0 10px;" placeholder="\ube44\uace0 \uc785\ub825" /></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  function normalizeFieldValue(field, value) {
    if (field === 'note') return value;
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  }

  function buildInfoTable(projectKey) {
    const info = PROJECT_INFO[projectKey];
    if (!info) return '';
    return `
      <div style="border:1px solid #233648;border-radius:16px;overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;">
          <thead>
            <tr style="background:#1a2632;color:#d9e5f2;font-size:12px;">
              ${info.columns.map((label) => `<th style="padding:12px 10px;border-right:1px solid #233648;text-align:center;font-weight:800;">${label}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${info.rows.map((row) => `
              <tr style="border-top:1px solid #233648;background:#0f172a;color:#fff;font-size:13px;">
                <td style="padding:12px 10px;border-right:1px solid #233648;text-align:center;">${row.section}</td>
                <td style="padding:12px 10px;border-right:1px solid #233648;text-align:center;">${row.shaftNumber}</td>
                <td style="padding:12px 10px;border-right:1px solid #233648;text-align:center;">${row.depthMeters}</td>
                <td style="padding:12px 10px;border-right:1px solid #233648;text-align:center;">${row.frontTunnelMeters}</td>
                <td style="padding:12px 10px;border-right:1px solid #233648;text-align:center;">${row.rearTunnelMeters}</td>
                <td style="padding:12px 10px;border-right:1px solid #233648;text-align:center;">${row.tbmType}</td>
                <td style="padding:12px 10px;border-right:1px solid #233648;text-align:center;">${row.tbmMaker}</td>
                <td style="padding:12px 10px;border-right:1px solid #233648;text-align:center;">${row.tunnelMeters}</td>
                ${Object.prototype.hasOwnProperty.call(row, 'noteText') ? `<td style="padding:12px 10px;text-align:center;">${row.noteText || ''}</td>` : ''}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function ensureModal(id, html) {
    let modal = document.getElementById(id);
    if (modal) return modal;
    modal = document.createElement('div');
    modal.id = id;
    modal.style.display = 'none';
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.zIndex = id === INFO_MODAL_ID ? '2190' : '2200';
    modal.innerHTML = html;
    document.body.appendChild(modal);
    return modal;
  }

  function ensureEditModal() {
    return ensureModal('shaftStatusModal', `
      <div data-modal-backdrop="true" style="position:absolute;inset:0;background:rgba(3,7,18,0.82);display:flex;align-items:center;justify-content:center;padding:20px;">
        <div style="width:min(980px,96vw);max-height:92vh;overflow:auto;border-radius:22px;background:#111827;border:1px solid #233648;box-shadow:0 24px 60px rgba(0,0,0,.45);">
          <div style="position:sticky;top:0;z-index:1;display:flex;justify-content:space-between;align-items:center;padding:18px 20px;border-bottom:1px solid #233648;background:#111827;">
            <div>
              <div id="shaftModalTitle" style="color:#fff;font-size:18px;font-weight:800;"></div>
              <div id="shaftModalWeekLabel" style="margin-top:4px;color:#92adc9;font-size:12px;"></div>
            </div>
            <button id="shaftModalClose" type="button" style="width:40px;height:40px;border:none;border-radius:999px;background:rgba(31,41,55,.9);color:#fff;font-size:20px;cursor:pointer;">&times;</button>
          </div>
          <div style="padding:18px 20px 22px;">
            <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:space-between;margin-bottom:16px;">
              <div style="display:flex;flex-wrap:wrap;gap:10px;align-items:center;">
                <input id="shaftModalWeekInput" type="date" style="height:40px;border-radius:10px;border:1px solid #233648;background:#0f172a;color:#fff;padding:0 12px;" />
                <button id="shaftModalThisWeek" type="button" style="height:40px;border-radius:10px;border:1px solid #233648;background:#0f172a;color:#fff;padding:0 14px;font-weight:700;">\uc774\ubc88 \uc8fc</button>
              </div>
              <div id="shaftModalMessage" style="color:#92adc9;font-size:12px;"></div>
            </div>
            <div id="shaftModalBody"></div>
            <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:18px;">
              <button id="shaftModalCancel" type="button" style="height:42px;border-radius:10px;border:1px solid #233648;background:#0f172a;color:#fff;padding:0 16px;font-weight:700;">\ub2eb\uae30</button>
              <button id="shaftModalSave" type="button" style="height:42px;border:none;border-radius:10px;background:#2563eb;color:#fff;padding:0 16px;font-weight:800;">\uc77c\uc9c0 \uc800\uc7a5</button>
            </div>
          </div>
        </div>
      </div>
    `);
  }

  function ensureInfoModal() {
    return ensureModal(INFO_MODAL_ID, `
      <div data-info-backdrop="true" style="position:absolute;inset:0;background:rgba(3,7,18,0.82);display:flex;align-items:center;justify-content:center;padding:20px;">
        <div style="width:min(1120px,96vw);max-height:92vh;overflow:auto;border-radius:22px;background:#111827;border:1px solid #233648;box-shadow:0 24px 60px rgba(0,0,0,.45);">
          <div style="position:sticky;top:0;z-index:1;display:flex;justify-content:space-between;align-items:center;padding:18px 20px;border-bottom:1px solid #233648;background:#111827;">
            <div>
              <div id="shaftInfoModalTitle" style="color:#fff;font-size:18px;font-weight:800;"></div>
              <div id="shaftInfoModalLabel" style="margin-top:4px;color:#92adc9;font-size:12px;"></div>
            </div>
            <button id="shaftInfoModalClose" type="button" style="width:40px;height:40px;border:none;border-radius:999px;background:rgba(31,41,55,.9);color:#fff;font-size:20px;cursor:pointer;">&times;</button>
          </div>
          <div style="padding:18px 20px 22px;"><div id="shaftInfoModalBody"></div></div>
        </div>
      </div>
    `);
  }

  async function buildItems(projectKey, weekStart) {
    const sections = await fetchSections(projectKey);
    const items = await Promise.all(sections.map(async (section) => {
      const weeklyRows = await fetchSectionWeek(section.id);
      const weekRow = weeklyRows.find((row) => row.week_start === weekStart) || null;
      const latestRow = weeklyRows[0] || null;
      return {
        sectionId: section.sectionId || section.id,
        sectionCode: section.sectionCode || section.code,
        name: section.shaftDisplayName || section.sectionName || section.name,
        weeklyMeters: weekRow ? Number(weekRow.progress_distance_m || 0) : 0,
        completedMeters: weekRow && weekRow.cumulative_distance_m != null
          ? Number(weekRow.cumulative_distance_m)
          : latestRow && latestRow.cumulative_distance_m != null
            ? Number(latestRow.cumulative_distance_m)
            : 0,
        totalMeters: Number(section.totalDistanceM || 0),
        note: (weekRow && weekRow.note) || ''
      };
    }));
    return items.sort((a, b) => String(a.sectionCode).localeCompare(String(b.sectionCode), 'ko'));
  }

  async function initWeeklyShaftStatus(config) {
    const controls = document.getElementById(config.controlsId);
    const thead = document.getElementById(config.theadId);
    const tbody = document.getElementById(config.tbodyId);
    if (!controls || !thead || !tbody) return;

    let weekStart = toDateValue(mondayOf());
    let items = [];

    controls.innerHTML = buildToolbarMarkup(config.projectKey, weekStart);
    const weekInput = controls.querySelector('#shaftWeekInput');
    const weekThisBtn = controls.querySelector('#shaftWeekThisBtn');
    const openBtn = controls.querySelector('#shaftWeekOpenBtn');
    const infoBtn = controls.querySelector('#shaftInfoOpenBtn');
    const externalWeekBtn = config.externalWeekButtonId ? document.getElementById(config.externalWeekButtonId) : null;
    const externalInfoBtn = config.externalInfoButtonId ? document.getElementById(config.externalInfoButtonId) : null;
    const externalTotalBtn = config.externalTotalWeekButtonId ? document.getElementById(config.externalTotalWeekButtonId) : null;
    const weekLabelNode = controls.querySelector('#shaftWeekLabel');
    const messageNode = controls.querySelector('#shaftWeekMessage');

    const modal = ensureEditModal();
    const modalTitle = modal.querySelector('#shaftModalTitle');
    const modalWeekLabel = modal.querySelector('#shaftModalWeekLabel');
    const modalWeekInput = modal.querySelector('#shaftModalWeekInput');
    const modalThisWeek = modal.querySelector('#shaftModalThisWeek');
    const modalBody = modal.querySelector('#shaftModalBody');
    const modalSave = modal.querySelector('#shaftModalSave');
    const modalCancel = modal.querySelector('#shaftModalCancel');
    const modalClose = modal.querySelector('#shaftModalClose');
    const modalMessage = modal.querySelector('#shaftModalMessage');

    const infoModal = ensureInfoModal();
    const infoModalTitle = infoModal.querySelector('#shaftInfoModalTitle');
    const infoModalLabel = infoModal.querySelector('#shaftInfoModalLabel');
    const infoModalBody = infoModal.querySelector('#shaftInfoModalBody');
    const infoModalClose = infoModal.querySelector('#shaftInfoModalClose');

    function syncLabels() {
      weekLabelNode.textContent = `\uae30\uc900 \uc8fc\uac04: ${weekLabel(weekStart)}`;
      modalWeekLabel.textContent = `\ud604\uc7ac \uc785\ub825 \uc8fc\uac04: ${weekLabel(weekStart)}`;
      weekInput.value = weekStart;
      modalWeekInput.value = weekStart;
    }

    function render() {
      renderDisplayTable(thead, tbody, items);
      syncLabels();
    }

    function openModal() {
      modalTitle.textContent = `${PROJECT_LABELS[config.projectKey] || config.projectKey} \uc218\uc9c1\uad6c\uc77c\uc9c0`;
      modalBody.innerHTML = buildModalTable(items);
      modalMessage.textContent = '';
      syncLabels();
      modal.style.display = 'block';
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }

    function openInfoModal() {
      const info = PROJECT_INFO[config.projectKey];
      if (!info) return;
      infoModalTitle.textContent = info.title;
      infoModalLabel.textContent = '\uae30\uc900 \uc790\ub8cc\uc758 \uc218\uc9c1\uad6c \uc815\ubcf4\ub97c \ud45c \ud615\uc2dd\uc73c\ub85c \ud45c\uc2dc\ud569\ub2c8\ub2e4.';
      infoModalBody.innerHTML = buildInfoTable(config.projectKey);
      infoModal.style.display = 'block';
      document.body.style.overflow = 'hidden';
    }

    function closeInfoModal() {
      infoModal.style.display = 'none';
      document.body.style.overflow = '';
    }

    async function loadWeek(nextWeekStart) {
      weekStart = toDateValue(mondayOf(nextWeekStart));
      messageNode.textContent = '\ub370\uc774\ud130\ub97c \ubd88\ub7ec\uc624\ub294 \uc911\uc785\ub2c8\ub2e4.';
      items = await buildItems(config.projectKey, weekStart);
      messageNode.textContent = `${weekLabel(weekStart)} \ud604\ud669\uc744 \ud45c\uc2dc \uc911\uc785\ub2c8\ub2e4.`;
      render();
      if (modal.style.display === 'block') {
        openModal();
      }
    }

    function collectModalItems() {
      const nextItems = items.map((item) => ({ ...item }));
      modalBody.querySelectorAll('[data-field][data-section-id]').forEach((input) => {
        const sectionId = Number(input.getAttribute('data-section-id'));
        const field = input.getAttribute('data-field');
        const target = nextItems.find((item) => item.sectionId === sectionId);
        if (!target) return;
        target[field] = normalizeFieldValue(field, input.value);
      });
      return nextItems;
    }

    async function saveModal() {
      const nextItems = collectModalItems();
      modalMessage.textContent = '\uc800\uc7a5 \uc911\uc785\ub2c8\ub2e4.';
      await Promise.all(nextItems.map((item) => saveSectionWeek(item.sectionId, weekStart, item)));
      items = nextItems;
      modalMessage.textContent = '\uc800\uc7a5\ub418\uc5c8\uc2b5\ub2c8\ub2e4.';
      messageNode.textContent = `${weekLabel(weekStart)} \uae30\uc900 \uc785\ub825 \uacb0\uacfc\uac00 \ubc18\uc601\ub418\uc5c8\uc2b5\ub2c8\ub2e4.`;
      render();
      closeModal();
    }

    [openBtn, externalWeekBtn, externalTotalBtn].filter(Boolean).forEach((button) => {
      button.addEventListener('click', openModal);
    });
    [infoBtn, externalInfoBtn].filter(Boolean).forEach((button) => {
      button.addEventListener('click', openInfoModal);
    });
    weekThisBtn.addEventListener('click', () => loadWeek(toDateValue(mondayOf())));
    weekInput.addEventListener('change', () => loadWeek(weekInput.value));
    modalThisWeek.addEventListener('click', () => loadWeek(toDateValue(mondayOf())));
    modalWeekInput.addEventListener('change', () => loadWeek(modalWeekInput.value));
    modalSave.addEventListener('click', saveModal);
    modalCancel.addEventListener('click', closeModal);
    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', (event) => {
      if (event.target && event.target.getAttribute('data-modal-backdrop') === 'true') closeModal();
    });
    infoModalClose.addEventListener('click', closeInfoModal);
    infoModal.addEventListener('click', (event) => {
      if (event.target && event.target.getAttribute('data-info-backdrop') === 'true') closeInfoModal();
    });

    await loadWeek(weekStart);
  }

  global.TCSMSDetailShaftStatus = {
    initWeeklyShaftStatus
  };
}(window));
