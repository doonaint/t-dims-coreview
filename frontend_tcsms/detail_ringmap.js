(function (global) {
  const PROJECT_NAMES = {
    GY: '\uad50\uc0b0',
    HN: '\ud558\ub0a8',
    NH: '\ub0a8\ud55c\uac15',
    YP: '\uc591\ud3c9'
  };

  function normalizeRow(row, index) {
    const ring = row && row.ring != null ? row.ring : index + 1;
    const chain = row && row.chainage != null ? row.chainage : (row && row.chain != null ? row.chain : '');
    const lat = Number(row && row.lat);
    const lng = Number(row && row.lng);
    const sortCandidate = row && row.sortOrder != null ? row.sortOrder : (row && row.sortRing != null ? row.sortRing : ring);
    const sortRing = Number.isFinite(Number(sortCandidate)) ? Number(sortCandidate) : index + 1;
    return { ring, chain, lat, lng, sortRing };
  }

  function normalizeRows(rows) {
    return (Array.isArray(rows) ? rows : [])
      .map(normalizeRow)
      .filter((row) => Number.isFinite(row.lat) && Number.isFinite(row.lng))
      .sort((a, b) => a.sortRing - b.sortRing);
  }

  function normalizeShaftRow(row, index) {
    const lat = Number(row && row.latitude);
    const lng = Number(row && row.longitude);
    return {
      id: row && row.id != null ? row.id : index + 1,
      segmentNumber: row && row.segmentNumber ? row.segmentNumber : '',
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

  async function fetchProjectState(projectKey) {
    try {
      const response = await fetch(`/api/projects/${projectKey}/segments`);
      if (!response.ok) throw new Error('segment state fetch failed');
      const payload = await response.json();
      const segments = Array.isArray(payload && payload.segments) ? payload.segments : [];
      const shaftResponse = await fetch(`/api/projects/${projectKey}/shaft-locations`);
      let shaftRows = [];
      if (shaftResponse.ok) {
        const shaftPayload = await shaftResponse.json();
        shaftRows = normalizeShaftRows(shaftPayload && shaftPayload.items);
      }
      const coordinatePayloads = await Promise.all(
        segments.map(async (segment) => {
          const coordResponse = await fetch(`/api/segments/${segment.id}/ring-coordinates`);
          if (!coordResponse.ok) return [];
          const coordPayload = await coordResponse.json();
          return Array.isArray(coordPayload && coordPayload.items) ? coordPayload.items : [];
        })
      );
      const rows = coordinatePayloads
        .flat()
        .map((row, index) => ({
          ring: row.ring_no,
          chainage: row.chainage,
          lat: row.latitude,
          lng: row.longitude,
          sortOrder: row.sort_order != null ? row.sort_order : index + 1
        }));
      if (rows.length) {
        return {
          rows: normalizeRows(rows),
          completedRing: '',
          shaftLocations: shaftRows
        };
      }
      if (shaftRows.length) {
        return {
          rows: [],
          completedRing: '',
          shaftLocations: shaftRows
        };
      }
    } catch (error) {
      console.warn('detail ring map segment fetch failed', error);
    }

    try {
      const response = await fetch('/api/ringmap/projects');
      if (!response.ok) throw new Error('server state fetch failed');
      const payload = await response.json();
      const project = payload && payload.projects ? payload.projects[projectKey] : null;
      if (project) {
        return {
          rows: normalizeRows(project.rows),
          completedRing: project.completedRing || '',
          shaftLocations: normalizeShaftRows(project.shaftLocations)
        };
      }
    } catch (error) {
      console.warn('detail ring map server fetch failed', error);
    }

    try {
      const fallback = JSON.parse(localStorage.getItem('ringMapProjectsStateV1') || '{}');
      const projectName = PROJECT_NAMES[projectKey];
      const project = fallback && fallback.projects ? fallback.projects[projectName] : null;
      if (project) {
        return {
          rows: normalizeRows(project.rows),
          completedRing: project.completedRing || '',
          shaftLocations: normalizeShaftRows(project.shaftLocations)
        };
      }
    } catch (error) {
      console.warn('detail ring map local fallback failed', error);
    }

    return { rows: [], completedRing: '', shaftLocations: [] };
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

  function renderShaftLocations(map, shaftLocations) {
    shaftLocations.forEach((row) => {
      const marker = L.circleMarker([row.lat, row.lng], {
        radius: 9,
        color: '#f97316',
        weight: 3,
        fillColor: '#fff7ed',
        fillOpacity: 0.95
      }).addTo(map);
      marker.bindPopup(`<b>${row.shaftDisplayName || row.shaftName || row.segmentNumber || '수직구'}</b><br/>구간: ${row.segmentNumber || '-'}${row.note ? `<br/>비고: ${row.note}` : ''}`);
      marker.bindTooltip(row.shaftName || row.segmentNumber || '수직구', {
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
      fillOpacity: 0.5,
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

    if (targetRow) {
      const marker = L.circleMarker([targetRow.lat, targetRow.lng], {
        radius: 7,
        color: '#f59e0b',
        weight: 3,
        fillColor: '#ffffff',
        fillOpacity: 0.9
      }).addTo(map);

      const km = (completedDistanceM / 1000).toFixed(3);
      marker.bindTooltip(
        `\uc644\ub8cc \ub9c1 <b>${targetRow.ring}</b><br/>\uccb4\uc778\ub9ac\uc9c0: <b>${targetRow.chain || '-'}</b><br/>\uc644\ub8cc\uac70\ub9ac(\ucd94\uc815): <b>${km} km</b>`,
        {
          permanent: true,
          direction: 'top',
          offset: [0, -8],
          opacity: 0.95,
          className: 'ring-tooltip'
        }
      ).openTooltip();
    }

    renderShaftLocations(map, shaftLocations || []);

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

  async function syncExistingMap(config) {
    const state = await fetchProjectState(config.projectKey);
    toggleEmptyOverlay(config.container || config.map.getContainer(), config.projectKey, !(state.rows.length || state.shaftLocations.length));
    if (!state.rows.length && !state.shaftLocations.length) return state;
    clearDataLayers(config.map, [config.satelliteLayer, config.mapLayer]);
    renderProjectRows(config.map, state.rows, state.completedRing, state.shaftLocations, config);
    return state;
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
    toggleEmptyOverlay(container, config.projectKey, !(state.rows.length || state.shaftLocations.length));
    if (state.rows.length || state.shaftLocations.length) {
      renderProjectRows(map, state.rows, state.completedRing, state.shaftLocations, config);
    }

    return { map, satelliteLayer, mapLayer, state };
  }

  global.TCSMSDetailRingMap = {
    fetchProjectState,
    syncExistingMap,
    initStandaloneMap,
    setBasemap
  };
}(window));
