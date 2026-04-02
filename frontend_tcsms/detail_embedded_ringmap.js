(function (global) {
  const PROJECT_NAMES = {
    GY: '\uad50\uc0b0',
    HN: '\ud558\ub0a8',
    NH: '\ub0a8\ud55c\uac15',
    YP: '\uc591\ud3c9'
  };

  function postToFrame(frame, payload) {
    try {
      if (frame && frame.contentWindow) {
        frame.contentWindow.postMessage(payload, '*');
      }
    } catch (error) {
      console.warn('detail embedded ringmap postMessage failed', error);
    }
  }

  function setButtonState(btnActive, btnInactive) {
    if (btnActive) {
      btnActive.classList.add('bg-primary');
      btnActive.classList.remove('bg-border-dark');
    }
    if (btnInactive) {
      btnInactive.classList.remove('bg-primary');
      btnInactive.classList.add('bg-border-dark');
    }
  }

  function createOverlayButton(id, label) {
    const button = document.createElement('button');
    button.type = 'button';
    button.id = id;
    button.className = 'map-overlay-blur rounded-lg border border-border-dark px-3 py-2 text-xs font-bold text-white hover:bg-primary transition-colors';
    button.textContent = label;
    return button;
  }

  function createSectionChip(label, active) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'map-overlay-blur rounded-full border border-border-dark px-3 py-2 text-xs font-bold text-white transition-colors';
    button.textContent = label;
    if (active) {
      button.classList.add('bg-primary');
    }
    return button;
  }

  function initEmbeddedRingMap(config) {
    const container = document.getElementById(config.containerId);
    if (!container) return null;

    const projectName = PROJECT_NAMES[config.projectKey] || 'ALL';
    const btnSat = config.btnSatelliteId ? document.getElementById(config.btnSatelliteId) : null;
    const btnMap = config.btnMapId ? document.getElementById(config.btnMapId) : null;
    const zoomInButton = config.zoomInButtonId ? document.getElementById(config.zoomInButtonId) : null;
    const zoomOutButton = config.zoomOutButtonId ? document.getElementById(config.zoomOutButtonId) : null;

    if (zoomInButton) zoomInButton.style.display = 'none';
    if (zoomOutButton) zoomOutButton.style.display = 'none';

    if (global.getComputedStyle(container).position === 'static') {
      container.style.position = 'relative';
    }

    const frame = document.createElement('iframe');
    frame.id = `${config.containerId}Frame`;
    frame.src = new URL('./index_ringmap.html?embed=1&basemap=sat', global.location.href).toString();
    frame.title = '\ub9c1 \uc88c\ud45c \uc9c0\ub3c4';
    frame.style.width = '100%';
    frame.style.height = '100%';
    frame.style.border = '0';
    frame.style.background = '#0b1320';
    frame.style.display = 'block';

    const controls = document.createElement('div');
    controls.style.position = 'absolute';
    controls.style.top = '14px';
    controls.style.left = '14px';
    controls.style.zIndex = '10';
    controls.style.display = 'flex';
    controls.style.flexDirection = 'column';
    controls.style.gap = '8px';

    const primaryControls = document.createElement('div');
    primaryControls.style.display = 'flex';
    primaryControls.style.gap = '8px';

    const fitButton = createOverlayButton(`${config.containerId}FitBtn`, '\ud574\ub2f9 \uad6c\uac04 \ub9de\ucda4');
    const tourButton = createOverlayButton(`${config.containerId}TourBtn`, '\ud22c\uc5b4');
    primaryControls.appendChild(fitButton);
    primaryControls.appendChild(tourButton);

    const sectionControls = document.createElement('div');
    sectionControls.style.display = 'none';
    sectionControls.style.flexWrap = 'wrap';
    sectionControls.style.gap = '6px';

    controls.appendChild(primaryControls);
    controls.appendChild(sectionControls);

    container.replaceChildren(frame, controls);

    let currentBasemap = 'sat';
    let tourActive = false;
    let activeSection = '';
    let sectionItems = [];

    function focusProject() {
      postToFrame(frame, { type: 'tcsms-focus-project', value: projectName });
      postToFrame(frame, { type: 'tcsms-focus-section', projectName, value: activeSection });
    }

    function closeSidebar() {
      postToFrame(frame, { type: 'tcsms-sidebar', value: 'close' });
    }

    function syncFrame() {
      postToFrame(frame, {
        type: 'tcsms-load-all',
        projectName,
        sectionNumber: activeSection
      });
      postToFrame(frame, { type: 'tcsms-basemap', value: currentBasemap });
      postToFrame(frame, {
        type: 'tcsms-theme',
        value: document.documentElement.classList.contains('dark') ? 'dark' : 'light'
      });
      closeSidebar();
      global.setTimeout(focusProject, 120);
      global.setTimeout(closeSidebar, 220);
      global.setTimeout(focusProject, 420);
    }

    function renderSectionControls() {
      sectionControls.replaceChildren();
      if (!sectionItems.length) {
        sectionControls.style.display = 'none';
        return;
      }
      sectionControls.style.display = 'flex';
      sectionItems.forEach((section) => {
        const chip = createSectionChip(section.sectionNumber || section.sectionName, section.sectionNumber === activeSection);
        chip.addEventListener('click', () => {
          activeSection = section.sectionNumber || '';
          renderSectionControls();
          closeSidebar();
          focusProject();
        });
        sectionControls.appendChild(chip);
      });
    }

    async function loadSections() {
      try {
        const detailRingMap = global.TCSMSDetailRingMap;
        if (!detailRingMap || typeof detailRingMap.fetchProjectState !== 'function') return;
        const state = await detailRingMap.fetchProjectState(config.projectKey);
        sectionItems = Array.isArray(state && state.sections) ? state.sections.filter((section) => (section.rows && section.rows.length) || (section.shaftLocations && section.shaftLocations.length)) : [];
        if (!activeSection && sectionItems.length) {
          activeSection = sectionItems[0].sectionNumber || '';
        }
        renderSectionControls();
      } catch (error) {
        console.warn('detail embedded ringmap section load failed', error);
      }
    }

    function applyBasemap(which) {
      currentBasemap = which;
      if (which === 'sat') setButtonState(btnSat, btnMap);
      else setButtonState(btnMap, btnSat);
      postToFrame(frame, { type: 'tcsms-basemap', value: which });
    }

    if (btnSat) btnSat.addEventListener('click', () => applyBasemap('sat'));
    if (btnMap) btnMap.addEventListener('click', () => applyBasemap('map'));

    fitButton.addEventListener('click', () => {
      tourActive = false;
      tourButton.textContent = '\ud22c\uc5b4';
      tourButton.classList.remove('bg-primary');
      postToFrame(frame, { type: 'tcsms-tour-stop' });
      closeSidebar();
      focusProject();
    });

    tourButton.addEventListener('click', () => {
      tourActive = !tourActive;
      if (tourActive) {
        tourButton.textContent = '\uc815\uc9c0';
        tourButton.classList.add('bg-primary');
        closeSidebar();
        focusProject();
        global.setTimeout(() => postToFrame(frame, { type: 'tcsms-tour-start' }), 100);
      } else {
        tourButton.textContent = '\ud22c\uc5b4';
        tourButton.classList.remove('bg-primary');
        postToFrame(frame, { type: 'tcsms-tour-stop' });
        global.setTimeout(closeSidebar, 80);
        global.setTimeout(focusProject, 100);
      }
    });

    frame.addEventListener('load', () => {
      global.setTimeout(syncFrame, 350);
    });

    loadSections();
    applyBasemap('sat');
    return { frame, syncFrame };
  }

  global.TCSMSDetailEmbeddedRingMap = {
    initEmbeddedRingMap
  };
}(window));
