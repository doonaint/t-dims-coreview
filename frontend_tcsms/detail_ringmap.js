(function (global) {
  const PROJECT_NAMES = {
    GY: '\uad50\uc0b0',
    HN: '\ud558\ub0a8',
    NH: '\ub0a8\ud55c\uac15',
    YP: '\uc591\ud3c9'
  };
  const DEFAULT_SECTION_KEY = '__all__';
  const DEFAULT_SECTION_LABEL = '\uc804\uccb4 \uad6c\uac04';
  const mapSelectionState = new WeakMap();

  function normalizeRow(row, index) {
    const ring = row && row.ring != null ? row.ring : index + 1;
    const chain = row && row.chainage != null ? row.chainage : (row && row.chain != null ? row.chain : '');
    const lat = Number(row && row.lat);
    const lng = Number(row && row.lng);
    const sortCandidate = row && row.sortOrder != null ? row.sortOrder : (row && row.sortRing != null ? row.sortRing : ring);
    const sortRing = Number.isFinite(Number(sortCandidate)) ? Number(sortCandidate) : index + 1;
    const sectionNumber = row && (row.sectionNumber || row.segmentNumber) ? String(row.sectionNumber || row.segmentNumber) : '';
    return {
      ring,
      chain,
      lat,
      lng,
      sortRing,
      sectionNumber
    };
  }

  function normalizeRows(rows) {
    return (Array.isArray(rows) ? rows : [])
      .map(normalizeRow)
      .filter((row) => Number.isFinite(row.lat) && Number.isFinite(row.lng))
      .sort((a, b) => a.sortRing - b.sortRing);
  }

  function normalizeShaftRow(row, index) {
    const lat = Number(row && row.latitude != null ? row.latitude : row && row.lat);
    const lng = Number(row && row.longitude != null ? row.longitude : row && row.lng);
    const sectionNumber = row && (row.sectionNumber || row.segmentNumber) ? String(row.sectionNumber || row.segmentNumber) : '';
    return {
      id: row && row.id != null ? row.id : index + 1,
      sectionNumber,
      segmentNumber: sectionNumber,
      shaftName: row && row.shaftName ? row.shaftName : '',
      shaftDisplayName: row && row.shaftDisplayName ? row.shaftDisplayName : '',
      note: row && row.note ? row.note : '',
      lat,
      lng,
      displayOrder: row && row.displayOrder != null ? Number(row.displayOrder) : index + 1
    };
  }

  function normalizeShaftRows(rows) {
    return (Array.isArray(rows) ? rows : [])
      .map(normalizeShaftRow)
      .filter((row) => Number.isFinite(row.lat) && Number.isFinite(row.lng))
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }

  function normalizeSection(section, index) {
    const sectionNumber = section && (section.sectionNumber || section.segmentNumber) ? String(section.sectionNumber || section.segmentNumber) : '';
    return {
      id: section && section.id != null ? section.id : index + 1,
      key: sectionNumber || `${DEFAULT_SECTION_KEY}-${index + 1}`,
      sectionNumber,
      sectionName: section && (section.sectionName || section.name) ? String(section.sectionName || section.name) : (sectionNumber || DEFAULT_SECTION_LABEL),
      sectionCode: section && (section.sectionCode || section.code) ? String(section.sectionCode || section.code) : '',
      displayOrder: section && section.displayOrder != null ? Number(section.displayOrder) : index + 1
    };
  }

  function buildEmptyState(projectName) {
    return (
      '<div style="' +
      'position:absolute;inset:16px auto auto 16px;z-index:500;' +
      'padding:10px 12px;border-radius:12px;' +
      'background:rgba(15,23,42,0.88);color:#e5eefb;' +
      'border:1px solid rgba(148,163,184,0.28);' +
      'font-size:12px;line-height:1.5;max-width:260px;' +
      'backdrop-filter:blur(8px);' +
      '">' +
      `<strong style="display:block;font-size:13px;margin-bottom:4px;">${projectName} \ub9c1\uc88c\ud45c \ub300\uae30 \uc911</strong>` +
      '\uba54\uc778 \ub9c1\ub9f5\uc5d0\uc11c \uc88c\ud45c\ub97c \uc5c5\ub85c\ub4dc\ud558\uba74 \uc774 \uc138\ubd80\ud398\uc774\uc9c0 \uc9c0\ub3c4\uc5d0\ub3c4 \ub3d9\uc77c\ud558\uac8c \ubc18\uc601\ub429\ub2c8\ub2e4.' +
      '</div>'
    );
  }

  function createSectionState(definition, rows, shaftRows, completedRing) {
    return {
      key: definition.key,
      id: definition.id,
      sectionNumber: definition.sectionNumber,
      sectionName: definition.sectionName,
      sectionCode: definition.sectionCode,
      displayOrder: definition.displayOrder,
      rows: normalizeRows(rows),
      shaftLocations: normalizeShaftRows(shaftRows),
      completedRing: completedRing || ''
    };
  }

  function groupRowsBySection(rows, shaftRows) {
    const rowGroups = new Map();
    const shaftGroups = new Map();
    const ensureGroup = (map, key) => {
      if (!map.has(key)) map.set(key, []);
      return map.get(key);
    };

    normalizeRows(rows).forEach((row) => {
      ensureGroup(rowGroups, row.sectionNumber || DEFAULT_SECTION_KEY).push(row);
    });
    normalizeShaftRows(shaftRows).forEach((row) => {
      ensureGroup(shaftGroups, row.sectionNumber || DEFAULT_SECTION_KEY).push(row);
    });

    const allKeys = Array.from(new Set([...rowGroups.keys(), ...shaftGroups.keys()]));
    if (!allKeys.length) return [];

    return allKeys.map((key, index) => createSectionState({
      id: index + 1,
      key,
      sectionNumber: key === DEFAULT_SECTION_KEY ? '' : key,
      sectionName: key === DEFAULT_SECTION_KEY ? DEFAULT_SECTION_LABEL : `${key} \uad6c\uac04`,
      sectionCode: '',
      displayOrder: index + 1
    }, rowGroups.get(key) || [], shaftGroups.get(key) || [], ''));
  }

  function buildProjectState(rows, shaftRows, sections, completedRing) {
    const normalizedRows = normalizeRows(rows);
    const normalizedShaftRows = normalizeShaftRows(shaftRows);
    const normalizedSections = (Array.isArray(sections) ? sections : [])
      .filter((section) => (section.rows && section.rows.length) || (section.shaftLocations && section.shaftLocations.length))
      .sort((a, b) => a.displayOrder - b.displayOrder);

    return {
      rows: normalizedRows,
      completedRing: completedRing || '',
      shaftLocations: normalizedShaftRows,
      sections: normalizedSections.length ? normalizedSections : groupRowsBySection(normalizedRows, normalizedShaftRows)
    };
  }

  async function fetchProjectState(projectKey) {
    try {
      const response = await fetch(`/api/projects/${projectKey}/sections`);
      if (!response.ok) throw new Error('section state fetch failed');
      const payload = await response.json();
      const sections = (Array.isArray(payload && payload.sections) ? payload.sections : [])
        .map(normalizeSection)
        .sort((a, b) => a.displayOrder - b.displayOrder);

      const shaftResponse = await fetch(`/api/projects/${projectKey}/shaft-locations`);
      let shaftRows = [];
      if (shaftResponse.ok) {
        const shaftPayload = await shaftResponse.json();
        shaftRows = normalizeShaftRows(shaftPayload && shaftPayload.items);
      }

      const sectionStates = await Promise.all(
        sections.map(async (section) => {
          const coordResponse = await fetch(`/api/sections/${section.id}/ring-coordinates`);
          if (!coordResponse.ok) {
            return createSectionState(section, [], shaftRows.filter((row) => row.sectionNumber === section.sectionNumber), '');
          }
          const coordPayload = await coordResponse.json();
          const rows = (Array.isArray(coordPayload && coordPayload.items) ? coordPayload.items : []).map((row, index) => ({
            ring: row.ring_no,
            chainage: row.chainage,
            lat: row.latitude,
            lng: row.longitude,
            sortOrder: row.sort_order != null ? row.sort_order : index + 1,
            sectionNumber: section.sectionNumber,
            segmentNumber: section.sectionNumber
          }));
          const completedRing = coordPayload && coordPayload.section ? coordPayload.section.completedRing : '';
          return createSectionState(section, rows, shaftRows.filter((row) => row.sectionNumber === section.sectionNumber), completedRing);
        })
      );

      const rows = sectionStates.flatMap((section) => section.rows);
      if (rows.length || shaftRows.length) {
        return buildProjectState(rows, shaftRows, sectionStates, '');
      }
    } catch (error) {
      console.warn('detail ring map section fetch failed', error);
    }

    try {
      const response = await fetch('/api/ringmap/projects');
      if (!response.ok) throw new Error('server state fetch failed');
      const payload = await response.json();
      const project = payload && payload.projects ? payload.projects[projectKey] : null;
      if (project) {
        return buildProjectState(project.rows, project.shaftLocations, null, project.completedRing || '');
      }
    } catch (error) {
      console.warn('detail ring map server fetch failed', error);
    }

    try {
      const fallback = JSON.parse(localStorage.getItem('ringMapProjectsStateV1') || '{}');
      const projectName = PROJECT_NAMES[projectKey];
      const project = fallback && fallback.projects ? fallback.projects[projectName] : null;
      if (project) {
        return buildProjectState(project.rows, project.shaftLocations, null, project.completedRing || '');
      }
    } catch (error) {
      console.warn('detail ring map local fallback failed', error);
    }

    return buildProjectState([], [], [], '');
  }

  function setBasemap(which, map, satelliteLayer, roadLayer, btnSat, btnMap) {
    if (which === 'sat') {
      if (!map.hasLayer(satelliteLayer)) map.addLayer(satelliteLayer);
      if (map.hasLayer(roadLayer)) map.removeLayer(roadLayer);
      if (btnSat) {
        btnSat.style.background = '#2563eb';
        btnSat.style.color = 'white';
      }
      if (btnMap) {
        btnMap.style.background = '#1f2937';
        btnMap.style.color = '#9ca3af';
      }
      return;
    }

    if (!map.hasLayer(roadLayer)) map.addLayer(roadLayer);
    if (map.hasLayer(satelliteLayer)) map.removeLayer(satelliteLayer);
    if (btnMap) {
      btnMap.style.background = '#2563eb';
      btnMap.style.color = 'white';
    }
    if (btnSat) {
      btnSat.style.background = '#1f2937';
      btnSat.style.color = '#9ca3af';
    }
  }

  function clearDataLayers(map, keepLayers) {
    map.eachLayer((layer) => {
      if (!keepLayers.includes(layer)) {
        map.removeLayer(layer);
      }
    });
  }

  function ensureEmptyOverlay(container, projectKey) {
    if (!container) return null;
    let overlay = container.querySelector('[data-ringmap-empty]');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.setAttribute('data-ringmap-empty', 'true');
      overlay.innerHTML = buildEmptyState(PROJECT_NAMES[projectKey] || projectKey);
      container.appendChild(overlay);
    }
    return overlay;
  }

  function toggleEmptyOverlay(container, projectKey, shouldShow) {
    const overlay = ensureEmptyOverlay(container, projectKey);
    if (overlay) {
      overlay.style.display = shouldShow ? 'block' : 'none';
    }
  }

  function ensureSectionSelector(container) {
    if (!container) return null;
    let selector = container.querySelector('[data-ringmap-section-selector]');
    if (!selector) {
      selector = document.createElement('div');
      selector.setAttribute('data-ringmap-section-selector', 'true');
      selector.style.position = 'absolute';
      selector.style.left = '16px';
      selector.style.top = '16px';
      selector.style.zIndex = '700';
      selector.style.display = 'flex';
      selector.style.flexDirection = 'column';
      selector.style.gap = '8px';
      selector.style.maxWidth = 'min(420px, calc(100% - 32px))';
      selector.style.padding = '10px';
      selector.style.borderRadius = '14px';
      selector.style.background = 'rgba(15,23,42,0.86)';
      selector.style.border = '1px solid rgba(148,163,184,0.24)';
      selector.style.backdropFilter = 'blur(10px)';
      selector.style.boxShadow = '0 14px 32px rgba(2,6,23,0.32)';
      container.appendChild(selector);
    }
    return selector;
  }

  function resolveSectionSelection(state, requestedKey) {
    const sections = Array.isArray(state && state.sections) ? state.sections : [];
    if (!sections.length) return null;
    if (requestedKey) {
      const matched = sections.find((section) => section.key === requestedKey || section.sectionNumber === requestedKey);
      if (matched) return matched;
    }
    return sections.find((section) => section.rows.length || section.shaftLocations.length) || sections[0];
  }

  function updateSectionSelector(config, state, selectedSection) {
    const container = config.container || config.map.getContainer();
    const selector = ensureSectionSelector(container);
    if (!selector) return;
    const sections = Array.isArray(state && state.sections) ? state.sections : [];

    if (sections.length <= 1) {
      selector.style.display = 'none';
      return;
    }

    selector.style.display = 'flex';
    selector.innerHTML = '';

    const title = document.createElement('div');
    title.style.display = 'flex';
    title.style.flexDirection = 'column';
    title.style.gap = '2px';
    title.innerHTML = `
      <strong style="font-size:13px;color:#f8fafc;">\uc138\ubd80 \uad6c\uac04 \uc9c0\ub3c4</strong>
      <span style="font-size:11px;color:#cbd5e1;">\uc120\ud0dd\ud55c \uad6c\uac04\uc758 \ub9c1\uc88c\ud45c\uc640 \uacf5\uc0ac \uc704\uce58\ub9cc \ud45c\uc2dc\ud569\ub2c8\ub2e4.</span>
    `;
    selector.appendChild(title);

    const chips = document.createElement('div');
    chips.style.display = 'flex';
    chips.style.flexWrap = 'wrap';
    chips.style.gap = '6px';

    sections.forEach((section) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = section.sectionNumber || section.sectionName || DEFAULT_SECTION_LABEL;
      button.style.height = '32px';
      button.style.padding = '0 12px';
      button.style.borderRadius = '999px';
      button.style.border = section.key === selectedSection.key ? '1px solid rgba(96,165,250,0.9)' : '1px solid rgba(148,163,184,0.28)';
      button.style.background = section.key === selectedSection.key ? 'rgba(37,99,235,0.92)' : 'rgba(30,41,59,0.72)';
      button.style.color = '#f8fafc';
      button.style.fontSize = '12px';
      button.style.fontWeight = section.key === selectedSection.key ? '800' : '700';
      button.style.cursor = 'pointer';
      button.style.boxShadow = section.key === selectedSection.key ? '0 0 0 1px rgba(147,197,253,0.25), 0 8px 18px rgba(37,99,235,0.28)' : 'none';
      button.addEventListener('click', () => {
        mapSelectionState.set(config.map, { state, selectedSectionKey: section.key });
        renderMapForSelection(config, state, section.key);
      });
      chips.appendChild(button);
    });

    selector.appendChild(chips);
  }

  function renderShaftLocations(map, shaftLocations, selectedSection) {
    shaftLocations.forEach((row) => {
      const isSelected = !selectedSection || !selectedSection.sectionNumber || row.sectionNumber === selectedSection.sectionNumber;
      const marker = L.circleMarker([row.lat, row.lng], {
        radius: isSelected ? 11 : 8,
        color: isSelected ? '#f97316' : '#fb923c',
        weight: isSelected ? 4 : 2,
        fillColor: isSelected ? '#fff7ed' : '#fed7aa',
        fillOpacity: isSelected ? 0.98 : 0.75
      }).addTo(map);
      marker.bindPopup(`<b>${row.shaftDisplayName || row.shaftName || row.segmentNumber || '\uc218\uc9c1\uad6c'}</b><br/>\uad6c\uac04: ${row.segmentNumber || '-'}${row.note ? `<br/>\ube44\uace0: ${row.note}` : ''}`);
      marker.bindTooltip(row.shaftName || row.segmentNumber || '\uc218\uc9c1\uad6c', {
        direction: 'top',
        offset: [0, -10],
        opacity: 0.95
      });
    });
  }

  function renderProjectRows(map, rows, completedRing, shaftLocations, options) {
    const renderer = L.canvas({ padding: 0.5 });
    const completedStyle = {
      color: '#ef4444',
      weight: 1,
      fillColor: '#ef4444',
      fillOpacity: 0.2,
      renderer
    };
    const inProgressStyle = {
      color: '#1d4ed8',
      weight: 1,
      fillColor: '#3b82f6',
      fillOpacity: 0.58,
      renderer
    };
    const targetRing = Number(completedRing);
    let completedDistanceM = 0;
    let targetRow = null;

    rows.forEach((row) => {
      const ringNo = Number(row.ring);
      const isCompleted = Number.isFinite(targetRing) && Number.isFinite(ringNo) && ringNo <= targetRing;
      const circle = L.circle([row.lat, row.lng], {
        ...(isCompleted ? completedStyle : inProgressStyle),
        radius: options.radius || 4
      }).addTo(map);
      circle.bindPopup(`<b>\ub9c1 ${row.ring}</b><br/>\uccb4\uc778\ub9ac\uc9c0: ${row.chain || '-'}`);
      if (Number.isFinite(targetRing) && ringNo === targetRing) {
        targetRow = row;
      }
    });

    const completedPts = rows
      .filter((row) => Number.isFinite(targetRing) && row.sortRing <= targetRing)
      .map((row) => [row.lat, row.lng]);

    if (completedPts.length > 1) {
      L.polyline(completedPts, {
        color: '#f59e0b',
        weight: 4,
        opacity: 0.9,
        lineJoin: 'round'
      }).addTo(map);

      for (let i = 1; i < completedPts.length; i += 1) {
        completedDistanceM += map.distance(
          L.latLng(completedPts[i - 1][0], completedPts[i - 1][1]),
          L.latLng(completedPts[i][0], completedPts[i][1])
        );
      }
    }

    if (!targetRow && rows.length) {
      targetRow = rows[rows.length - 1];
    }

    if (targetRow) {
      const marker = L.circleMarker([targetRow.lat, targetRow.lng], {
        radius: 8,
        color: '#f59e0b',
        weight: 4,
        fillColor: '#ffffff',
        fillOpacity: 0.96
      }).addTo(map);

      const km = completedDistanceM > 0 ? (completedDistanceM / 1000).toFixed(3) : '';
      const tooltipParts = [
        `<strong>\ud604\uc7ac \uacf5\uc0ac \uc704\uce58</strong>`,
        `\ub9c1: <b>${targetRow.ring}</b>`,
        `\uccb4\uc778\ub9ac\uc9c0: <b>${targetRow.chain || '-'}</b>`
      ];
      if (km) {
        tooltipParts.push(`\uc644\ub8cc\uac70\ub9ac(\ucd94\uc815): <b>${km} km</b>`);
      }
      marker.bindTooltip(tooltipParts.join('<br/>'), {
        permanent: true,
        direction: 'top',
        offset: [0, -8],
        opacity: 0.95,
        className: 'ring-tooltip'
      }).openTooltip();
    }

    renderShaftLocations(map, shaftLocations || [], options.selectedSection || null);

    const points = rows.map((row) => [row.lat, row.lng]).concat((shaftLocations || []).map((row) => [row.lat, row.lng]));
    if (points.length) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: options.fitPadding || [20, 20] });
    }
  }

  function bindZoomButtons(map, zoomInButton, zoomOutButton) {
    if (zoomInButton) zoomInButton.addEventListener('click', () => map.zoomIn());
    if (zoomOutButton) zoomOutButton.addEventListener('click', () => map.zoomOut());
  }

  function renderMapForSelection(config, state, requestedSectionKey) {
    const selectedSection = resolveSectionSelection(state, requestedSectionKey);
    const container = config.container || config.map.getContainer();
    const activeRows = selectedSection ? selectedSection.rows : state.rows;
    const activeShaftLocations = selectedSection ? selectedSection.shaftLocations : state.shaftLocations;
    const hasData = activeRows.length || activeShaftLocations.length;

    toggleEmptyOverlay(container, config.projectKey, !hasData);
    updateSectionSelector(config, state, selectedSection || { key: DEFAULT_SECTION_KEY });

    clearDataLayers(config.map, [config.satelliteLayer, config.mapLayer]);
    if (hasData) {
      renderProjectRows(config.map, activeRows, selectedSection ? selectedSection.completedRing : state.completedRing, activeShaftLocations, {
        ...config,
        selectedSection
      });
    }

    mapSelectionState.set(config.map, {
      state,
      selectedSectionKey: selectedSection ? selectedSection.key : null
    });

    return selectedSection;
  }

  async function syncExistingMap(config) {
    const state = await fetchProjectState(config.projectKey);
    const previous = mapSelectionState.get(config.map);
    const selectedSection = renderMapForSelection(config, state, config.sectionNumber || (previous && previous.selectedSectionKey));
    return { ...state, selectedSection };
  }

  async function initStandaloneMap(config) {
    const map = L.map(config.mapId, {
      preferCanvas: true,
      zoomControl: true
    }).setView(config.center || [37.53, 127.18], config.zoom || 15);

    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 20, attribution: 'Tiles Esri' }
    ).addTo(map);

    const mapLayer = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { maxZoom: 20, attribution: '&copy; OpenStreetMap contributors' }
    );

    const btnSat = config.btnSatelliteId ? document.getElementById(config.btnSatelliteId) : null;
    const btnMap = config.btnMapId ? document.getElementById(config.btnMapId) : null;
    const zoomInButton = config.zoomInButtonId ? document.getElementById(config.zoomInButtonId) : null;
    const zoomOutButton = config.zoomOutButtonId ? document.getElementById(config.zoomOutButtonId) : null;
    const container = document.getElementById(config.mapId);

    if (btnSat) btnSat.addEventListener('click', () => setBasemap('sat', map, satelliteLayer, mapLayer, btnSat, btnMap));
    if (btnMap) btnMap.addEventListener('click', () => setBasemap('map', map, satelliteLayer, mapLayer, btnSat, btnMap));
    bindZoomButtons(map, zoomInButton, zoomOutButton);
    setBasemap('sat', map, satelliteLayer, mapLayer, btnSat, btnMap);

    const state = await fetchProjectState(config.projectKey);
    const selectedSection = renderMapForSelection({
      ...config,
      map,
      satelliteLayer,
      mapLayer,
      container
    }, state, config.sectionNumber);

    return { map, satelliteLayer, mapLayer, state, selectedSection };
  }

  global.TCSMSDetailRingMap = {
    fetchProjectState,
    syncExistingMap,
    initStandaloneMap,
    setBasemap
  };
}(window));
