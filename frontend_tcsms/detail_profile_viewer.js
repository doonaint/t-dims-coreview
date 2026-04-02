(function (global) {
  const STYLE_ID = 'tcsms-detail-profile-style';

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .tcsms-profile-panel{width:100%;border-radius:12px;border:1px solid #233648;overflow:hidden;background:#0d161f;display:flex;flex-direction:column;min-height:220px;flex:1.1;}
      .tcsms-profile-head{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:1px solid #233648;}
      .tcsms-profile-title{display:flex;align-items:center;gap:8px;color:#fff;font-size:14px;font-weight:800;}
      .tcsms-profile-sub{color:#92adc9;font-size:10px;}
      .tcsms-profile-open{display:flex;align-items:center;gap:4px;font-size:10px;font-weight:700;padding:5px 10px;border:none;border-radius:8px;background:#233648;color:#fff;cursor:pointer;}
      .tcsms-profile-open:hover{filter:brightness(1.08);}
      .tcsms-profile-body{flex:1;min-height:180px;cursor:pointer;}
      .tcsms-profile-canvas{width:100%;height:100%;display:block;}
      .tcsms-profile-overlay{position:fixed;inset:0;z-index:3000;background:rgba(3,7,18,.97);display:none;align-items:center;justify-content:center;padding:0;}
      .tcsms-profile-overlay.is-open{display:flex!important;}
      .tcsms-profile-close{position:absolute;top:16px;right:16px;z-index:10;width:44px;height:44px;border:none;border-radius:999px;background:rgba(15,23,42,.88);color:#fff;font-size:22px;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.3);}
      .tcsms-profile-wrap{width:100%;height:100%;overflow:auto;display:flex;align-items:center;justify-content:center;padding:60px 24px 24px;}
      .tcsms-profile-full{width:100%;max-height:calc(100vh - 120px);display:block;border-radius:12px;}
      .tcsms-profile-caption{position:absolute;bottom:16px;left:50%;transform:translateX(-50%);color:#92adc9;font-size:12px;background:rgba(15,23,42,.7);padding:6px 16px;border-radius:20px;}
    `;
    document.head.appendChild(style);
  }

  function formatMeters(value) {
    const num = Number(value) || 0;
    return Math.round(num).toLocaleString();
  }

  function fitCanvas(canvas) {
    const width = canvas.clientWidth || 800;
    const height = canvas.clientHeight || 240;
    const dpr = global.devicePixelRatio || 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, width, height };
  }

  function drawTbmIcon(ctx, x, y, color) {
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = color;
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 1.2;

    ctx.beginPath();
    ctx.roundRect(-12, -7, 16, 14, 4);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(5, 0, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.beginPath();
    ctx.arc(5, 0, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.28)';
    ctx.fillRect(-16, -2.5, 5, 5);

    ctx.restore();
  }

  function createAnimatedSegments(baseSegments, now) {
    return baseSegments.map((segment, index) => {
      const total = Math.max(1, Number(segment.total) || 0);
      const baseExcavated = Math.max(0, Number(segment.excavated) || 0);
      const seed = (index + 1) * 0.91;
      const cycle = (Math.sin((now / 1700) + seed) + 1) / 2;
      const sway = (Math.sin((now / 6100) + (seed * 1.7)) + 1) / 2;
      const minRatio = Math.max(0.03, Math.min(0.78, (baseExcavated / total) * 0.45));
      const maxRatio = Math.max(minRatio + 0.08, Math.min(0.96, (baseExcavated / total) + 0.22 + (sway * 0.08)));
      const animatedRatio = minRatio + ((maxRatio - minRatio) * cycle);
      return {
        ...segment,
        displayExcavated: total * animatedRatio
      };
    });
  }

  async function fetchSections(projectKey) {
    if (!projectKey) return [];
    try {
      const response = await fetch(`/api/projects/${projectKey}/sections`);
      if (!response.ok) throw new Error('section fetch failed');
      const payload = await response.json();
      const sections = Array.isArray(payload && payload.sections) ? payload.sections : [];
      return sections.map((section) => ({
        label: section.sectionName || section.name,
        shaftName: section.shaftName || '',
        shaftDisplayName: section.shaftDisplayName || '',
        type: section.excavationMethod || '',
        total: Number(section.totalDistanceM) || 0,
        excavated: Number(section.currentExcavatedDistanceM) || 0
      }));
    } catch (error) {
      console.warn('detail profile section fetch failed', error);
      return [];
    }
  }

  function drawProfile(canvas, config) {
    if (!canvas) return;
    const { ctx, width, height } = fitCanvas(canvas);
    const segments = Array.isArray(config.segments) ? config.segments : [];
    const color = config.themeColor || '#3b82f6';
    const accentSoft = config.themeSoftColor || 'rgba(59,130,246,0.18)';

    ctx.clearRect(0, 0, width, height);

    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#132030');
    bg.addColorStop(1, '#0b1220');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const chartLeft = width * 0.07;
    const chartRight = width * 0.93;
    const chartTop = height * 0.18;
    const chartBottom = height * 0.85;
    const groundY = chartTop + (chartBottom - chartTop) * 0.22;
    const tunnelY = chartTop + (chartBottom - chartTop) * 0.70;

    ctx.strokeStyle = 'rgba(148,163,184,0.35)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i += 1) {
      const y = chartTop + ((chartBottom - chartTop) / 3) * i;
      ctx.beginPath();
      ctx.moveTo(chartLeft, y);
      ctx.lineTo(chartRight, y);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(chartLeft, groundY);
    ctx.lineTo(chartRight, groundY);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(chartLeft, tunnelY);
    ctx.lineTo(chartRight, tunnelY);
    ctx.stroke();

    const segmentWidth = (chartRight - chartLeft) / Math.max(segments.length, 1);
    const shaftXs = segments.map((segment, index) => {
      if (typeof segment.shaftPositionRatio === 'number') {
        return chartLeft + (chartRight - chartLeft) * Math.max(0, Math.min(1, segment.shaftPositionRatio));
      }
      return chartLeft + (segmentWidth * index) + Math.min(18, segmentWidth * 0.12);
    });

    shaftXs.forEach((x, index) => {
      ctx.strokeStyle = 'rgba(226,232,240,0.55)';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x, chartTop + 8);
      ctx.lineTo(x, tunnelY);
      ctx.stroke();

      ctx.fillStyle = 'rgba(226,232,240,0.95)';
      ctx.beginPath();
      ctx.arc(x, chartTop + 8, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '11px "Public Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(segments[index].shaftName || `#${index + 1}`, x, chartTop - 6);
    });

    segments.forEach((segment, index) => {
      const blockStartX = chartLeft + (segmentWidth * index);
      const blockEndX = blockStartX + segmentWidth;
      const startX = shaftXs[index];
      const endX = Math.max(startX + 20, blockEndX - Math.min(18, segmentWidth * 0.12));
      const total = Math.max(1, Number(segment.total) || 0);
      const excavated = Math.max(0, Number(segment.displayExcavated ?? segment.excavated) || 0);
      const pct = Math.max(0, Math.min(1, excavated / total));
      const progressX = startX + (endX - startX) * pct;

      ctx.fillStyle = accentSoft;
      ctx.fillRect(blockStartX, tunnelY - 16, blockEndX - blockStartX, 32);

      ctx.strokeStyle = color;
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(startX, tunnelY);
      ctx.lineTo(progressX, tunnelY);
      ctx.stroke();

      drawTbmIcon(ctx, progressX, tunnelY, color);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "Public Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(segment.label || `구간 ${index + 1}`, (blockStartX + blockEndX) / 2, chartBottom + 20);

      ctx.fillStyle = '#92adc9';
      ctx.font = '10px "Public Sans", sans-serif';
      ctx.fillText(`${formatMeters(excavated)}m / ${formatMeters(total)}m`, (blockStartX + blockEndX) / 2, chartBottom + 36);
      if (segment.type) {
        ctx.fillText(segment.type, (blockStartX + blockEndX) / 2, chartBottom + 50);
      }
      if (segment.shaftDisplayName) {
        ctx.fillText(segment.shaftDisplayName, (blockStartX + blockEndX) / 2, chartBottom + 64);
      }
    });
  }

  function buildPanel(config) {
    const wrapper = document.createElement('div');
    wrapper.className = 'tcsms-profile-panel';
    wrapper.innerHTML = `
      <div class="tcsms-profile-head">
        <div>
          <div class="tcsms-profile-title">
            <span class="material-symbols-outlined" style="font-size:18px;color:${config.themeColor || '#3b82f6'};">show_chart</span>
            <span>종단면도</span>
          </div>
          <div class="tcsms-profile-sub">${config.subtitle || 'Shield-TBM 종단면도'}</div>
        </div>
        <button type="button" class="tcsms-profile-open">
          <span class="material-symbols-outlined" style="font-size:16px;">zoom_in</span>
          확대
        </button>
      </div>
      <div class="tcsms-profile-body">
        <canvas class="tcsms-profile-canvas"></canvas>
      </div>
    `;
    return wrapper;
  }

  function buildOverlay(config) {
    const overlay = document.createElement('div');
    overlay.className = 'tcsms-profile-overlay';
    overlay.innerHTML = `
      <button type="button" class="tcsms-profile-close">×</button>
      <div class="tcsms-profile-wrap">
        <canvas class="tcsms-profile-full"></canvas>
      </div>
      <div class="tcsms-profile-caption">${config.caption || `${config.projectName || ''} 종단면도`}</div>
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  async function initProfileViewer(config) {
    ensureStyle();
    const host = document.getElementById(config.hostId);
    if (!host) return;

    const panel = buildPanel(config);
    const overlay = buildOverlay(config);
    host.appendChild(panel);

    if (config.projectKey) {
      const fetchedSections = await fetchSections(config.projectKey);
      if (fetchedSections.length) {
        config.segments = fetchedSections;
      }
    }

    const previewCanvas = panel.querySelector('.tcsms-profile-canvas');
    const fullCanvas = overlay.querySelector('.tcsms-profile-full');
    const openButton = panel.querySelector('.tcsms-profile-open');
    const closeButton = overlay.querySelector('.tcsms-profile-close');
    const body = panel.querySelector('.tcsms-profile-body');
    let animationFrameId = 0;

    function getRenderConfig() {
      const baseSegments = Array.isArray(config.segments) ? config.segments : [];
      if (config.demoMotion === false) {
        return config;
      }
      return {
        ...config,
        segments: createAnimatedSegments(baseSegments, Date.now())
      };
    }

    function renderAll() {
      const renderConfig = getRenderConfig();
      drawProfile(previewCanvas, renderConfig);
      drawProfile(fullCanvas, renderConfig);
    }

    function tick() {
      renderAll();
      animationFrameId = global.requestAnimationFrame(tick);
    }

    function openOverlay() {
      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      global.setTimeout(renderAll, 40);
    }

    function closeOverlay() {
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    openButton.addEventListener('click', openOverlay);
    body.addEventListener('click', openOverlay);
    closeButton.addEventListener('click', closeOverlay);
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) closeOverlay();
    });
    global.addEventListener('resize', renderAll);

    renderAll();
    if (config.demoMotion !== false) {
      animationFrameId = global.requestAnimationFrame(tick);
    }
  }

  global.TCSMSDetailProfileViewer = {
    initProfileViewer
  };
}(window));
