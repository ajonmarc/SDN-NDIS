/* ==========================================================================
   SDN-NDIS — Frontend Application Controller
   Mirrors the Laravel + Inertia + Vue 3 Application Flow & UI
   ========================================================================== */

let db = loadDB();

let state = {
    view: 'welcome', // 'welcome' | 'login' | 'register' | 'portal'
    tab: 'dashboard',
    currentUser: null,
    mapLayerFilter: 'all', // 'all' | 'disasters' | 'centers'
    mapMunicipalityFilter: 'all',
    selectedMarker: null, // { kind: 'disaster' | 'center', id: number }
    modal: null, // { type: string, mode: 'create' | 'edit', recordId: number | null }
};

let mainMap = null;
let mainMarkersLayer = null;
let disasterMarkerMap = new Map();
let centerMarkerMap = new Map();
let pickerMap = null;
let pickerMarker = null;
let mapResizeObserver = null;

const DEFAULT_CENTER = [9.7844, 125.68];
const DEFAULT_ZOOM = 10;

// ==========================================================================
// Initialization & Access Logging
// ==========================================================================
function initApp() {
    try {
        const savedUser = sessionStorage.getItem(SESSION_KEY);
        if (savedUser) {
            const parsed = JSON.parse(savedUser);
            const fresh = db.users.find((u) => Number(u.id) === Number(parsed.id));
            if (fresh) {
                state.currentUser = fresh;
            }
        }
    } catch (e) {
        state.currentUser = null;
    }

    if (!sessionStorage.getItem(GUEST_LOGGED_KEY)) {
        logAccessEvent('GUEST_VISIT', state.currentUser ? state.currentUser.id : null);
        sessionStorage.setItem(GUEST_LOGGED_KEY, '1');
    }

    renderApp();
}

function logAccessEvent(eventType, userId = null) {
    const nextId = db.access_logs.length > 0 ? Math.max(...db.access_logs.map((l) => l.id)) + 1 : 1;
    db.access_logs.unshift({
        id: nextId,
        user_id: userId,
        event_type: eventType,
        ip_address: '127.0.0.1',
        accessed_at: formatNow(),
    });
    saveDB(db);
}

// ==========================================================================
// Helpers
// ==========================================================================
function getMunicipalityName(id) {
    const m = db.municipalities.find((x) => Number(x.id) === Number(id));
    return m ? m.municipality_name : 'Surigao City';
}

function getDisasterTypeName(id) {
    const t = db.disaster_types.find((x) => Number(x.id) === Number(id));
    return t ? t.type_name : 'N/A';
}

function getUserRecord(id) {
    if (!id) return null;
    return db.users.find((x) => Number(x.id) === Number(id)) || null;
}

function getDisasterUpdates(disasterId) {
    return db.disaster_updates.filter((u) => Number(u.disaster_id) === Number(disasterId));
}

function getInitials(name) {
    if (!name) return 'U';
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0].toUpperCase())
        .join('');
}

function severityBadgeClass(severity) {
    if (severity === 'Critical' || severity === 'High') return 'badge-destructive';
    if (severity === 'Moderate') return 'badge-default';
    return 'badge-secondary';
}

function disasterStatusBadgeClass(status) {
    if (status === 'Active') return 'badge-destructive';
    if (status === 'Monitoring') return 'badge-default';
    if (status === 'Contained') return 'badge-secondary';
    return 'badge-outline';
}

function centerStatusBadgeClass(status) {
    if (status === 'Open') return 'badge-default';
    if (status === 'Full') return 'badge-destructive';
    if (status === 'Maintenance') return 'badge-secondary';
    return 'badge-outline';
}

function occupancyPercent(center) {
    if (!center.capacity || center.capacity <= 0) return 0;
    return Math.min(100, Math.round((center.current_occupancy / center.capacity) * 100));
}

// ==========================================================================
// Navigation & Auth Actions
// ==========================================================================
function navigateTo(view, tab = null) {
    state.view = view;
    if (tab) {
        state.tab = tab;
    } else if (view === 'portal' && state.currentUser) {
        state.tab = state.currentUser.role === 'HEAD' ? 'head-dashboard' : state.currentUser.role === 'PDRRMO' ? 'pdrrmo-dashboard' : 'guest-dashboard';
    }
    state.selectedMarker = null;
    renderApp();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function switchTab(tab) {
    state.tab = tab;
    state.selectedMarker = null;
    renderApp();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function handleLoginSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;

    const user = db.users.find((u) => u.email.toLowerCase() === email && u.password === password);
    if (!user) {
        const errEl = document.getElementById('login-error');
        if (errEl) {
            errEl.style.display = 'block';
            errEl.textContent = 'These credentials do not match our records.';
        }
        return;
    }

    state.currentUser = user;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    logAccessEvent('LOGIN', user.id);
    navigateTo('portal');
}

function handleRegisterSubmit(e) {
    e.preventDefault();
    const fullName = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const contact = document.getElementById('reg-contact').value.trim();
    const address = document.getElementById('reg-address').value.trim();
    const password = document.getElementById('reg-password').value;
    const confirmPassword = document.getElementById('reg-password-confirm').value;

    const errEl = document.getElementById('reg-error');
    if (password !== confirmPassword) {
        if (errEl) {
            errEl.style.display = 'block';
            errEl.textContent = 'The password confirmation does not match.';
        }
        return;
    }

    if (db.users.some((u) => u.email.toLowerCase() === email)) {
        if (errEl) {
            errEl.style.display = 'block';
            errEl.textContent = 'The email has already been taken.';
        }
        return;
    }

    const nextId = db.users.length > 0 ? Math.max(...db.users.map((u) => u.id)) + 1 : 1;
    const now = formatNow();
    const newUser = {
        id: nextId,
        full_name: fullName,
        email,
        password,
        full_address: address || null,
        contact_number: contact || null,
        role: 'GUEST',
        is_protected: false,
        created_at: now,
        updated_at: now,
    };

    db.users.push(newUser);
    saveDB(db);

    state.currentUser = newUser;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
    logAccessEvent('LOGIN', newUser.id);
    navigateTo('portal');
}

function handleLogout() {
    if (state.currentUser) {
        logAccessEvent('LOGOUT', state.currentUser.id);
    }
    state.currentUser = null;
    sessionStorage.removeItem(SESSION_KEY);
    navigateTo('welcome');
}

// ==========================================================================
// Interactive Leaflet GIS Map (Esri Free Tile Provider — No API Key Required)
// ==========================================================================
function addBaseMapTileLayer(mapInstance, withLayerControl = false) {
    // 1. Esri World Street Map (Default — 100% free, no API key, works on file:// and http://)
    const esriStreet = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        {
            maxZoom: 19,
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS',
        }
    );

    // 2. Esri World Topographic Map (100% free, no API key)
    const esriTopo = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
        {
            maxZoom: 19,
            attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap',
        }
    );

    // 3. Esri World Imagery / Satellite (100% free, no API key)
    const esriSatellite = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
            maxZoom: 19,
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
        }
    );

    // Default to Esri World Street Map
    esriStreet.addTo(mapInstance);

    if (withLayerControl) {
        const baseMaps = {
            'Street Map (Esri Free)': esriStreet,
            'Topographic (Esri Free)': esriTopo,
            'Satellite (Esri Free)': esriSatellite,
        };
        L.control.layers(baseMaps, null, { position: 'topright' }).addTo(mapInstance);
    }
}

function getFilteredMapDisasters() {
    if (state.mapLayerFilter === 'centers') return [];
    if (state.mapMunicipalityFilter === 'all') return db.disasters;
    return db.disasters.filter((d) => String(d.municipality_id) === String(state.mapMunicipalityFilter));
}

function getFilteredMapCenters() {
    if (state.mapLayerFilter === 'disasters') return [];
    if (state.mapMunicipalityFilter === 'all') return db.evacuation_centers;
    return db.evacuation_centers.filter((c) => String(c.municipality_id) === String(state.mapMunicipalityFilter));
}

function createDisasterLeafletIcon(disaster) {
    const isUrgent =
        disaster.status === 'Active' ||
        disaster.severity === 'Critical' ||
        disaster.severity === 'High';
    const bgColor = isUrgent ? '#dc2626' : '#f37f20';

    return L.divIcon({
        className: 'custom-map-marker',
        html: `
            <div style="position:relative;display:flex;align-items:center;justify-content:center;width:36px;height:36px;">
                ${
                    isUrgent
                        ? `<span style="position:absolute;inset:0;border-radius:9999px;background:${bgColor};opacity:0.45;animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></span>`
                        : ''
                }
                <div style="position:relative;display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9999px;background:${bgColor};border:2.5px solid #ffffff;box-shadow:0 3px 8px rgba(0,0,0,0.35);color:#ffffff;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                </div>
            </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
    });
}

function createCenterLeafletIcon(center) {
    const bgColor =
        center.status === 'Open'
            ? '#007687'
            : center.status === 'Full'
              ? '#dc2626'
              : '#475569';

    return L.divIcon({
        className: 'custom-map-marker',
        html: `
            <div style="position:relative;display:flex;align-items:center;justify-content:center;width:36px;height:36px;">
                <div style="position:relative;display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9999px;background:${bgColor};border:2.5px solid #ffffff;box-shadow:0 3px 8px rgba(0,0,0,0.35);color:#ffffff;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>
                </div>
            </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18],
    });
}

function renderGISMapBlockHtml(isGuestMapPage = false) {
    return `
        <section id="live-gis-map" style="display:flex;flex-direction:column;gap:1.25rem;">
            <div style="display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:1rem;">
                <div>
                    ${
                        !isGuestMapPage
                            ? `<span class="badge badge-outline" style="margin-bottom:0.4rem;border-color:rgba(0,118,135,0.4);color:var(--primary);">Interactive GIS Map</span>`
                            : ''
                    }
                    <h2 style="font-size:1.5rem;font-weight:700;letter-spacing:-0.02em;">
                        ${isGuestMapPage ? 'Disaster &amp; Evacuation Map' : 'Surigao del Norte Disaster &amp; Evacuation Map'}
                    </h2>
                    <p style="font-size:0.875rem;color:var(--muted-foreground);">
                        Interactive GIS map of Surigao del Norte showing active disaster locations and evacuation center markers.
                    </p>
                </div>

                <div id="map-filter-controls" style="display:flex;flex-wrap:wrap;align-items:center;gap:0.6rem;">
                    ${renderMapFilterControlsInnerHtml()}
                </div>
            </div>

            <!-- Map Legend Bar -->
            <div class="card" style="padding:0.65rem 1rem;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:0.75rem;font-size:0.76rem;">
                <div style="display:flex;flex-wrap:wrap;align-items:center;gap:1rem;">
                    <span style="font-weight:600;">Map Legend:</span>
                    <span style="display:inline-flex;align-items:center;gap:0.35rem;">
                        <span style="width:11px;height:11px;border-radius:9999px;background:#dc2626;display:inline-block;box-shadow:0 0 0 3px rgba(220,38,38,0.25);"></span>
                        <span>Active / High-Severity Disaster</span>
                    </span>
                    <span style="display:inline-flex;align-items:center;gap:0.35rem;">
                        <span style="width:11px;height:11px;border-radius:9999px;background:#f37f20;display:inline-block;"></span>
                        <span>Monitored / Contained Disaster</span>
                    </span>
                    <span style="display:inline-flex;align-items:center;gap:0.35rem;">
                        <span style="width:11px;height:11px;border-radius:9999px;background:#007687;display:inline-block;"></span>
                        <span>Open Evacuation Center</span>
                    </span>
                    <span style="display:inline-flex;align-items:center;gap:0.35rem;">
                        <span style="width:11px;height:11px;border-radius:9999px;background:#475569;display:inline-block;"></span>
                        <span>Full / Closed Center</span>
                    </span>
                </div>
                <div style="color:var(--muted-foreground);">
                    Click any marker on the map or item below to inspect full details and updates.
                </div>
            </div>

            <!-- Map Canvas + Dynamic Detail Panel -->
            <div id="map-grid-wrapper" class="map-grid-wrapper ${state.selectedMarker ? 'with-panel' : ''}">
                <div class="card" style="overflow:hidden;padding:0;width:100%;">
                    <div id="gis-map-canvas" class="gis-map-box"></div>
                </div>
                <div id="map-detail-panel" style="${state.selectedMarker ? '' : 'display:none;'}">
                    ${renderSelectedMarkerCardHtml()}
                </div>
            </div>

            ${isGuestMapPage ? `<div id="map-directory-lists">${renderMapQuickDirectoryHtml()}</div>` : ''}
        </section>
    `;
}

function renderMapFilterControlsInnerHtml() {
    const filteredDisasters = getFilteredMapDisasters();
    const filteredCenters = getFilteredMapCenters();
    const total = filteredDisasters.length + filteredCenters.length;

    const muniOptions = db.municipalities
        .slice()
        .sort((a, b) => a.municipality_name.localeCompare(b.municipality_name))
        .map(
            (m) =>
                `<option value="${m.id}" ${
                    String(state.mapMunicipalityFilter) === String(m.id) ? 'selected' : ''
                }>${escapeHtml(m.municipality_name)}</option>`
        )
        .join('');

    return `
        <div style="display:inline-flex;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--card);padding:0.2rem;gap:0.2rem;">
            <button type="button" class="btn btn-sm ${state.mapLayerFilter === 'all' ? 'btn-default' : 'btn-ghost'}" onclick="updateMapLayerFilter('all')">
                All (${total})
            </button>
            <button type="button" class="btn btn-sm ${state.mapLayerFilter === 'disasters' ? 'btn-destructive' : 'btn-ghost'}" onclick="updateMapLayerFilter('disasters')">
                Disasters (${filteredDisasters.length})
            </button>
            <button type="button" class="btn btn-sm ${state.mapLayerFilter === 'centers' ? 'btn-default' : 'btn-ghost'}" onclick="updateMapLayerFilter('centers')">
                Evacuation Centers (${filteredCenters.length})
            </button>
        </div>

        <select class="select" style="width:195px;padding:0.38rem 0.65rem;font-size:0.8rem;" onchange="updateMapMunicipalityFilter(this.value)">
            <option value="all">All Municipalities</option>
            ${muniOptions}
        </select>

        <button type="button" class="btn btn-outline btn-sm" onclick="resetMapViewInPlace()">
            Reset View
        </button>
    `;
}

function renderSelectedMarkerCardHtml() {
    if (!state.selectedMarker) return '';

    if (state.selectedMarker.kind === 'disaster') {
        const d = db.disasters.find((x) => Number(x.id) === Number(state.selectedMarker.id));
        if (!d) return '';
        const muniName = getMunicipalityName(d.municipality_id);
        const typeName = getDisasterTypeName(d.disaster_type_id);
        const coords = resolveCoords(d.latitude, d.longitude, muniName);
        const updates = getDisasterUpdates(d.id);

        return `
            <div class="card card-p" style="display:flex;flex-direction:column;gap:1rem;">
                <div>
                    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:0.5rem;">
                        <div style="display:flex;flex-wrap:wrap;gap:0.35rem;">
                            <span class="badge ${severityBadgeClass(d.severity)}">${escapeHtml(d.severity)} Severity</span>
                            <span class="badge ${disasterStatusBadgeClass(d.status)}">${escapeHtml(d.status)}</span>
                        </div>
                        <button type="button" class="btn btn-ghost btn-icon" onclick="closeMarkerDetailPanel()">&#10005;</button>
                    </div>
                    <h3 style="font-size:1.125rem;font-weight:700;margin-top:0.5rem;">${escapeHtml(d.title)}</h3>
                    <p style="font-size:0.82rem;color:var(--muted-foreground);">
                        ${escapeHtml(typeName)} &bull; ${escapeHtml(muniName)}
                    </p>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;background:var(--muted);padding:0.75rem;border-radius:var(--radius-sm);font-size:0.75rem;">
                    <div>
                        <span style="color:var(--muted-foreground);">Occurred At</span>
                        <p style="font-weight:600;margin-top:0.1rem;">${escapeHtml(d.occurred_at)}</p>
                    </div>
                    <div>
                        <span style="color:var(--muted-foreground);">Coordinates</span>
                        <p style="font-family:monospace;font-weight:600;margin-top:0.1rem;">
                            ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}
                        </p>
                    </div>
                </div>

                <div>
                    <h4 style="font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted-foreground);margin-bottom:0.25rem;">
                        Situation Overview
                    </h4>
                    <p style="font-size:0.875rem;line-height:1.55;">
                        ${escapeHtml(d.description || 'No additional description provided.')}
                    </p>
                </div>

                <div style="border-top:1px solid var(--border);padding-top:0.85rem;">
                    <h4 style="font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted-foreground);margin-bottom:0.55rem;">
                        Published Updates (${updates.length})
                    </h4>
                    ${
                        updates.length > 0
                            ? `<div style="display:flex;flex-direction:column;gap:0.55rem;max-height:220px;overflow-y:auto;">
                                ${updates
                                    .map(
                                        (u) => `
                                    <div style="border:1px solid var(--border);background:rgba(241,245,249,0.5);border-radius:var(--radius-sm);padding:0.65rem;font-size:0.78rem;">
                                        <div style="color:var(--muted-foreground);font-weight:500;margin-bottom:0.2rem;">${escapeHtml(u.published_at || u.created_at)}</div>
                                        <p style="line-height:1.45;">${escapeHtml(u.message)}</p>
                                    </div>
                                `
                                    )
                                    .join('')}
                              </div>`
                            : `<p style="font-size:0.78rem;color:var(--muted-foreground);">No updates published for this disaster yet.</p>`
                    }
                </div>
            </div>
        `;
    }

    if (state.selectedMarker.kind === 'center') {
        const c = db.evacuation_centers.find((x) => Number(x.id) === Number(state.selectedMarker.id));
        if (!c) return '';
        const muniName = getMunicipalityName(c.municipality_id);
        const coords = resolveCoords(c.latitude, c.longitude, muniName);
        const pct = occupancyPercent(c);

        return `
            <div class="card" style="overflow:hidden;display:flex;flex-direction:column;">
                ${
                    c.image
                        ? `<img src="${escapeHtml(c.image)}" alt="${escapeHtml(c.center_name)}" style="height:175px;width:100%;object-fit:cover;border-bottom:1px solid var(--border);" onerror="this.style.display='none'" />`
                        : ''
                }
                <div class="card-p" style="display:flex;flex-direction:column;gap:1rem;">
                    <div>
                        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:0.5rem;">
                            <div style="display:flex;flex-wrap:wrap;gap:0.35rem;">
                                <span class="badge badge-secondary">${escapeHtml(muniName)}</span>
                                <span class="badge ${centerStatusBadgeClass(c.status)}">${escapeHtml(c.status)}</span>
                            </div>
                            <button type="button" class="btn btn-ghost btn-icon" onclick="closeMarkerDetailPanel()">&#10005;</button>
                        </div>
                        <h3 style="font-size:1.125rem;font-weight:700;margin-top:0.5rem;">${escapeHtml(c.center_name)}</h3>
                        <p style="font-size:0.82rem;color:var(--muted-foreground);margin-top:0.15rem;">
                            ${escapeHtml(c.address)}
                        </p>
                    </div>

                    <div style="border:1px solid var(--border);background:rgba(241,245,249,0.5);border-radius:var(--radius-sm);padding:0.85rem;">
                        <div style="display:flex;justify-content:space-between;font-size:0.78rem;margin-bottom:0.45rem;">
                            <span style="color:var(--muted-foreground);font-weight:500;">Current Occupancy</span>
                            <span style="font-weight:700;">
                                ${Number(c.current_occupancy).toLocaleString()} / ${Number(c.capacity).toLocaleString()} persons (${pct}%)
                            </span>
                        </div>
                        <div style="height:8px;width:100%;background:var(--muted);border-radius:9999px;overflow:hidden;">
                            <div style="height:100%;width:${pct}%;background:var(--primary);border-radius:9999px;"></div>
                        </div>
                    </div>

                    <div style="background:var(--muted);padding:0.75rem;border-radius:var(--radius-sm);font-size:0.75rem;">
                        <span style="color:var(--muted-foreground);">GPS Coordinates</span>
                        <p style="font-family:monospace;font-weight:600;margin-top:0.15rem;">
                            ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    return '';
}

function renderMapQuickDirectoryHtml() {
    const filteredDisasters = getFilteredMapDisasters();
    const filteredCenters = getFilteredMapCenters();

    return `
        <div class="grid-2-col" style="margin-top:0.5rem;">
            <div class="card card-p">
                <h3 style="font-size:1rem;font-weight:700;">Mapped Disasters (${filteredDisasters.length})</h3>
                <p style="font-size:0.8rem;color:var(--muted-foreground);margin-bottom:0.85rem;">
                    Click a disaster to center the map on its coordinates and inspect updates
                </p>
                <div style="display:flex;flex-direction:column;gap:0.55rem;max-height:290px;overflow-y:auto;">
                    ${
                        filteredDisasters.length > 0
                            ? filteredDisasters
                                  .map(
                                      (d) => `
                                <div class="card card-hover" style="padding:0.75rem;display:flex;align-items:center;justify-content:space-between;gap:0.75rem;" onclick="focusMarkerInPlace('disaster', ${d.id})">
                                    <div style="min-width:0;">
                                        <div style="font-weight:600;font-size:0.875rem;">${escapeHtml(d.title)}</div>
                                        <div style="font-size:0.75rem;color:var(--muted-foreground);">
                                            ${escapeHtml(getDisasterTypeName(d.disaster_type_id))} &bull; ${escapeHtml(getMunicipalityName(d.municipality_id))} &bull; ${escapeHtml(d.occurred_at)}
                                        </div>
                                    </div>
                                    <div style="display:flex;gap:0.3rem;flex-shrink:0;">
                                        <span class="badge ${severityBadgeClass(d.severity)}">${escapeHtml(d.severity)}</span>
                                        <span class="badge ${disasterStatusBadgeClass(d.status)}">${escapeHtml(d.status)}</span>
                                    </div>
                                </div>
                            `
                                  )
                                  .join('')
                            : `<p style="font-size:0.82rem;color:var(--muted-foreground);padding:1rem 0;">No mapped disasters found.</p>`
                    }
                </div>
            </div>

            <div class="card card-p">
                <h3 style="font-size:1rem;font-weight:700;">Mapped Evacuation Centers (${filteredCenters.length})</h3>
                <p style="font-size:0.8rem;color:var(--muted-foreground);margin-bottom:0.85rem;">
                    Click an evacuation center to locate it on the map and view shelter details
                </p>
                <div style="display:flex;flex-direction:column;gap:0.55rem;max-height:290px;overflow-y:auto;">
                    ${
                        filteredCenters.length > 0
                            ? filteredCenters
                                  .map(
                                      (c) => `
                                <div class="card card-hover" style="padding:0.75rem;display:flex;align-items:center;justify-content:space-between;gap:0.75rem;" onclick="focusMarkerInPlace('center', ${c.id})">
                                    <div style="min-width:0;">
                                        <div style="font-weight:600;font-size:0.875rem;">${escapeHtml(c.center_name)}</div>
                                        <div style="font-size:0.75rem;color:var(--muted-foreground);">
                                            ${escapeHtml(getMunicipalityName(c.municipality_id))} &bull; ${Number(c.current_occupancy).toLocaleString()}/${Number(c.capacity).toLocaleString()} persons
                                        </div>
                                    </div>
                                    <span class="badge ${centerStatusBadgeClass(c.status)}">${escapeHtml(c.status)}</span>
                                </div>
                            `
                                  )
                                  .join('')
                            : `<p style="font-size:0.82rem;color:var(--muted-foreground);padding:1rem 0;">No mapped evacuation centers found.</p>`
                    }
                </div>
            </div>
        </div>
    `;
}

function renderOfflineSvgGISMap(container) {
    const minLat = 9.40, maxLat = 10.10;
    const minLng = 125.35, maxLng = 126.22;
    const toX = (lng) => ((lng - minLng) / (maxLng - minLng)) * 900 + 50;
    const toY = (lat) => ((maxLat - lat) / (maxLat - minLat)) * 440 + 40;

    const muniLabels = Object.entries(MUNICIPALITY_COORDINATES)
        .map(([name, [lat, lng]]) => {
            const x = toX(lng).toFixed(1);
            const y = toY(lat).toFixed(1);
            return `
                <g transform="translate(${x}, ${y})">
                    <circle r="3" fill="#64748b" opacity="0.6" />
                    <text x="6" y="3" font-size="10" fill="#334155" font-weight="500">${escapeHtml(name)}</text>
                </g>
            `;
        })
        .join('');

    const disasterPins = getFilteredMapDisasters()
        .map((d) => {
            const muniName = getMunicipalityName(d.municipality_id);
            const coords = resolveCoords(d.latitude, d.longitude, muniName);
            const x = toX(coords.longitude).toFixed(1);
            const y = toY(coords.latitude).toFixed(1);
            const isUrgent = d.status === 'Active' || d.severity === 'Critical' || d.severity === 'High';
            const color = isUrgent ? '#dc2626' : '#f37f20';
            return `
                <g transform="translate(${x}, ${y})" style="cursor:pointer;" onclick="selectMarkerInPlace('disaster', ${d.id})">
                    <circle r="16" fill="${color}" opacity="0.25" />
                    <circle r="11" fill="${color}" stroke="#ffffff" stroke-width="2.5" />
                    <text text-anchor="middle" y="4" font-size="11" fill="#ffffff" font-weight="700">!</text>
                </g>
            `;
        })
        .join('');

    const centerPins = getFilteredMapCenters()
        .map((c) => {
            const muniName = getMunicipalityName(c.municipality_id);
            const coords = resolveCoords(c.latitude, c.longitude, muniName);
            const x = toX(coords.longitude).toFixed(1);
            const y = toY(coords.latitude).toFixed(1);
            const color = c.status === 'Open' ? '#007687' : c.status === 'Full' ? '#dc2626' : '#475569';
            return `
                <g transform="translate(${x}, ${y})" style="cursor:pointer;" onclick="selectMarkerInPlace('center', ${c.id})">
                    <circle r="11" fill="${color}" stroke="#ffffff" stroke-width="2.5" />
                    <text text-anchor="middle" y="4" font-size="10" fill="#ffffff" font-weight="700">H</text>
                </g>
            `;
        })
        .join('');

    container.innerHTML = `
        <svg viewBox="0 0 1000 520" style="width:100%;height:100%;background:linear-gradient(180deg,#dbeafe 0%,#bfdbfe 100%);display:block;">
            <defs>
                <pattern id="sdn-grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(3,57,86,0.08)" stroke-width="1" />
                </pattern>
            </defs>
            <rect width="1000" height="520" fill="url(#sdn-grid)" />
            <!-- Mainland Surigao del Norte Polygon -->
            <path d="M 105,305 L 175,180 L 235,195 L 330,260 L 490,365 L 440,465 L 250,475 L 140,395 Z" fill="#ecfdf5" stroke="#10b981" stroke-width="2" opacity="0.85" />
            <!-- Siargao Island Polygon -->
            <path d="M 655,260 L 725,105 L 820,125 L 895,255 L 790,340 L 680,315 Z" fill="#ecfdf5" stroke="#10b981" stroke-width="2" opacity="0.85" />
            <!-- Bucas Grande Island Polygon -->
            <path d="M 645,355 L 725,350 L 740,415 L 665,425 Z" fill="#ecfdf5" stroke="#10b981" stroke-width="2" opacity="0.85" />
            ${muniLabels}
            ${centerPins}
            ${disasterPins}
        </svg>
    `;
}

function mountLeafletGISMap() {
    const container = document.getElementById('gis-map-canvas');
    if (!container) return;

    if (typeof L === 'undefined') {
        renderOfflineSvgGISMap(container);
        return;
    }

    if (mapResizeObserver) {
        mapResizeObserver.disconnect();
        mapResizeObserver = null;
    }

    if (mainMap) {
        mainMap.remove();
        mainMap = null;
    }

    mainMap = L.map(container, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        scrollWheelZoom: true,
    });

    addBaseMapTileLayer(mainMap, true);

    mainMarkersLayer = L.layerGroup().addTo(mainMap);

    requestAnimationFrame(() => {
        if (!mainMap) return;
        mainMap.invalidateSize();
        plotMarkersOnActiveMap(true);
    });

    setTimeout(() => {
        if (!mainMap) return;
        mainMap.invalidateSize();
    }, 220);

    if (typeof ResizeObserver !== 'undefined') {
        mapResizeObserver = new ResizeObserver(() => {
            if (mainMap) {
                mainMap.invalidateSize();
            }
        });
        mapResizeObserver.observe(container);
    }
}

function plotMarkersOnActiveMap(shouldFitBounds = true) {
    if (!mainMap || !mainMarkersLayer || typeof L === 'undefined') return;

    mainMarkersLayer.clearLayers();
    disasterMarkerMap.clear();
    centerMarkerMap.clear();

    const boundsPoints = [];

    for (const d of getFilteredMapDisasters()) {
        const muniName = getMunicipalityName(d.municipality_id);
        const typeName = getDisasterTypeName(d.disaster_type_id);
        const coords = resolveCoords(d.latitude, d.longitude, muniName);

        const marker = L.marker([coords.latitude, coords.longitude], {
            icon: createDisasterLeafletIcon(d),
        });

        const popupHtml = `
            <div style="min-width:210px;font-family:inherit;">
                <div style="font-size:11px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:0.04em;">
                    Disaster &bull; ${escapeHtml(typeName)}
                </div>
                <div style="font-size:14px;font-weight:700;margin-top:2px;color:#0f172a;">
                    ${escapeHtml(d.title)}
                </div>
                <div style="font-size:12px;color:#475569;margin-top:2px;">
                    ${escapeHtml(muniName)}
                </div>
                <div style="display:flex;gap:6px;margin-top:6px;font-size:11px;">
                    <span style="background:#fee2e2;color:#991b1b;padding:1px 6px;border-radius:4px;font-weight:600;">
                        Severity: ${escapeHtml(d.severity)}
                    </span>
                    <span style="background:#f1f5f9;color:#334155;padding:1px 6px;border-radius:4px;font-weight:600;">
                        ${escapeHtml(d.status)}
                    </span>
                </div>
                <div style="font-size:11px;color:#64748b;margin-top:6px;">
                    Occurred: ${escapeHtml(d.occurred_at)}
                </div>
            </div>
        `;

        marker.bindPopup(popupHtml);
        marker.on('click', () => {
            selectMarkerInPlace('disaster', d.id);
        });

        mainMarkersLayer.addLayer(marker);
        disasterMarkerMap.set(Number(d.id), marker);
        boundsPoints.push([coords.latitude, coords.longitude]);
    }

    for (const c of getFilteredMapCenters()) {
        const muniName = getMunicipalityName(c.municipality_id);
        const coords = resolveCoords(c.latitude, c.longitude, muniName);

        const marker = L.marker([coords.latitude, coords.longitude], {
            icon: createCenterLeafletIcon(c),
        });

        const imageHtml = c.image
            ? `<img src="${escapeHtml(c.image)}" alt="${escapeHtml(c.center_name)}" style="width:100%;height:90px;object-fit:cover;border-radius:6px;margin-bottom:6px;" onerror="this.style.display='none'" />`
            : '';

        const popupHtml = `
            <div style="min-width:220px;font-family:inherit;">
                ${imageHtml}
                <div style="font-size:11px;font-weight:700;color:#007687;text-transform:uppercase;letter-spacing:0.04em;">
                    Evacuation Center &bull; ${escapeHtml(c.status)}
                </div>
                <div style="font-size:14px;font-weight:700;margin-top:2px;color:#0f172a;">
                    ${escapeHtml(c.center_name)}
                </div>
                <div style="font-size:12px;color:#475569;margin-top:2px;">
                    ${escapeHtml(muniName)} &mdash; ${escapeHtml(c.address)}
                </div>
                <div style="font-size:12px;font-weight:600;color:#0f172a;margin-top:6px;">
                    Occupancy: ${Number(c.current_occupancy).toLocaleString()} / ${Number(c.capacity).toLocaleString()} persons
                </div>
            </div>
        `;

        marker.bindPopup(popupHtml);
        marker.on('click', () => {
            selectMarkerInPlace('center', c.id);
        });

        mainMarkersLayer.addLayer(marker);
        centerMarkerMap.set(Number(c.id), marker);
        boundsPoints.push([coords.latitude, coords.longitude]);
    }

    if (shouldFitBounds && boundsPoints.length > 0) {
        const bounds = L.latLngBounds(boundsPoints);
        mainMap.fitBounds(bounds, { padding: [45, 45], maxZoom: 13 });
    }
}

function selectMarkerInPlace(kind, id) {
    state.selectedMarker = { kind, id: Number(id) };
    const wrapper = document.getElementById('map-grid-wrapper');
    const panel = document.getElementById('map-detail-panel');
    if (wrapper && panel) {
        wrapper.classList.add('with-panel');
        panel.style.display = 'block';
        panel.innerHTML = renderSelectedMarkerCardHtml();
        setTimeout(() => {
            if (mainMap) mainMap.invalidateSize();
        }, 60);
    }
}

function closeMarkerDetailPanel() {
    state.selectedMarker = null;
    const wrapper = document.getElementById('map-grid-wrapper');
    const panel = document.getElementById('map-detail-panel');
    if (wrapper && panel) {
        wrapper.classList.remove('with-panel');
        panel.style.display = 'none';
        panel.innerHTML = '';
        if (mainMap) {
            mainMap.closePopup();
            setTimeout(() => mainMap.invalidateSize(), 60);
        }
    }
}

function updateMapLayerFilter(layer) {
    state.mapLayerFilter = layer;
    refreshMapControlsAndMarkers();
}

function updateMapMunicipalityFilter(muniId) {
    state.mapMunicipalityFilter = muniId;
    refreshMapControlsAndMarkers();
}

function refreshMapControlsAndMarkers() {
    const controlsEl = document.getElementById('map-filter-controls');
    if (controlsEl) {
        controlsEl.innerHTML = renderMapFilterControlsInnerHtml();
    }
    const dirEl = document.getElementById('map-directory-lists');
    if (dirEl) {
        dirEl.innerHTML = renderMapQuickDirectoryHtml();
    }
    if (typeof L === 'undefined') {
        const container = document.getElementById('gis-map-canvas');
        if (container) renderOfflineSvgGISMap(container);
    } else {
        plotMarkersOnActiveMap(true);
    }
}

function resetMapViewInPlace() {
    state.mapLayerFilter = 'all';
    state.mapMunicipalityFilter = 'all';
    closeMarkerDetailPanel();
    refreshMapControlsAndMarkers();
    if (mainMap) {
        mainMap.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, { duration: 0.8 });
    }
}

function focusMarkerInPlace(kind, id) {
    if (state.mapLayerFilter !== 'all' || state.mapMunicipalityFilter !== 'all') {
        state.mapLayerFilter = 'all';
        state.mapMunicipalityFilter = 'all';
        refreshMapControlsAndMarkers();
    }

    selectMarkerInPlace(kind, id);

    const mapSection = document.getElementById('live-gis-map');
    if (mapSection) {
        mapSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    setTimeout(() => {
        if (!mainMap) return;
        mainMap.invalidateSize();
        if (kind === 'disaster') {
            const d = db.disasters.find((x) => Number(x.id) === Number(id));
            if (d) {
                const coords = resolveCoords(d.latitude, d.longitude, getMunicipalityName(d.municipality_id));
                mainMap.flyTo([coords.latitude, coords.longitude], 14, { duration: 0.8 });
                const marker = disasterMarkerMap.get(Number(id));
                if (marker) marker.openPopup();
            }
        } else {
            const c = db.evacuation_centers.find((x) => Number(x.id) === Number(id));
            if (c) {
                const coords = resolveCoords(c.latitude, c.longitude, getMunicipalityName(c.municipality_id));
                mainMap.flyTo([coords.latitude, coords.longitude], 14, { duration: 0.8 });
                const marker = centerMarkerMap.get(Number(id));
                if (marker) marker.openPopup();
            }
        }
    }, 100);
}

// ==========================================================================
// 1. Public Welcome Page (Matches Welcome.vue)
// ==========================================================================
function renderWelcomeView() {
    const activeDisastersCount = db.disasters.filter((d) => d.status === 'Active' || d.status === 'Monitoring').length;
    const openCentersCount = db.evacuation_centers.filter((c) => c.status === 'Open').length;
    const totalOccupancy = db.evacuation_centers.reduce((s, c) => s + Number(c.current_occupancy || 0), 0);
    const totalCapacity = db.evacuation_centers.reduce((s, c) => s + Number(c.capacity || 0), 0);

    return `
        <div style="min-height:100vh;display:flex;flex-direction:column;">
            <!-- Top Navigation Bar -->
            <header class="welcome-header">
                <div class="welcome-header-inner">
                    <div class="brand-row" onclick="navigateTo('welcome')">
                        <img src="assets/logo.png" alt="SDN-NDIS Logo" class="logo-circle" />
                        <div>
                            <div style="display:flex;align-items:center;gap:0.5rem;">
                                <span style="font-size:1.1rem;font-weight:700;letter-spacing:-0.02em;">SDN-NDIS</span>
                                <span class="badge badge-secondary" style="font-size:0.65rem;">Official Portal</span>
                            </div>
                            <p style="font-size:0.75rem;color:var(--muted-foreground);">
                                Surigao del Norte Natural Disaster Information System
                            </p>
                        </div>
                    </div>

                    <nav style="display:flex;align-items:center;gap:0.65rem;">
                        ${
                            state.currentUser
                                ? `<button class="btn btn-default" onclick="navigateTo('portal')">
                                    Go to Dashboard &rarr;
                                  </button>`
                                : `
                                  <button class="btn btn-ghost" onclick="navigateTo('login')">Log in</button>
                                  <button class="btn btn-default" onclick="navigateTo('register')">Register Account</button>
                                `
                        }
                    </nav>
                </div>
            </header>

            <!-- Hero Section & Live Provincial Telemetry -->
            <section class="hero-banner">
                <div class="hero-dots"></div>
                <div class="hero-container">
                    <div>
                        <div class="hero-pill">
                            <span style="width:8px;height:8px;border-radius:9999px;background:#f37f20;animation:pulse 1.5s infinite;"></span>
                            <span>Province of Surigao del Norte &bull; PDRRMO Command Network</span>
                        </div>

                        <h1 class="hero-heading">
                            Natural Disaster Web-Based
                            <span style="color:#38e0f5;">Information &amp; Evacuation</span>
                            System
                        </h1>

                        <p class="hero-subtext">
                            A centralized disaster preparedness, geo-mapping, and emergency response platform for citizens and disaster risk reduction officers across Surigao del Norte.
                        </p>

                        <div style="display:flex;flex-wrap:wrap;align-items:center;gap:0.75rem;">
                            <button class="btn btn-cyan btn-lg" onclick="document.getElementById('live-gis-map').scrollIntoView({behavior:'smooth'})">
                                Explore Live Map
                            </button>
                            ${
                                state.currentUser
                                    ? `<button class="btn btn-orange btn-lg" onclick="navigateTo('portal')">
                                        Open Operations Dashboard &rarr;
                                      </button>`
                                    : `
                                      <button class="btn btn-orange btn-lg" onclick="navigateTo('login')">
                                        Access Portal &rarr;
                                      </button>
                                      <button class="btn btn-hero-outline btn-lg" onclick="navigateTo('register')">
                                        Create Citizen / Guest Account
                                      </button>
                                    `
                            }
                        </div>
                    </div>

                    <!-- Live Provincial Telemetry -->
                    <div>
                        <div class="telemetry-card">
                            <div class="telemetry-top">
                                <div style="display:flex;align-items:center;gap:0.75rem;">
                                    <img src="assets/logo.png" alt="Logo" class="logo-circle" style="width:48px;height:48px;" />
                                    <div>
                                        <h2 style="font-size:1rem;font-weight:700;color:#fff;">Live Provincial Telemetry</h2>
                                        <p style="font-size:0.75rem;color:#a5f3fc;">Real-time SDN-NDIS database summary</p>
                                    </div>
                                </div>
                                <span class="badge badge-live">Live Data</span>
                            </div>

                            <div class="telemetry-grid">
                                <div class="telemetry-item">
                                    <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:#cbd5e1;">
                                        <span>Recorded Disasters</span>
                                        <span style="color:#f37f20;">&#9888;</span>
                                    </div>
                                    <p style="margin-top:0.45rem;font-size:1.55rem;font-weight:700;color:#fff;">
                                        ${db.disasters.length.toLocaleString()}
                                    </p>
                                    <p style="font-size:0.7rem;color:#cbd5e1;">
                                        ${activeDisastersCount.toLocaleString()} active / monitoring
                                    </p>
                                </div>

                                <div class="telemetry-item">
                                    <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:#cbd5e1;">
                                        <span>Evacuation Centers</span>
                                        <span style="color:#38e0f5;">&#127970;</span>
                                    </div>
                                    <p style="margin-top:0.45rem;font-size:1.55rem;font-weight:700;color:#fff;">
                                        ${db.evacuation_centers.length.toLocaleString()}
                                    </p>
                                    <p style="font-size:0.7rem;color:#cbd5e1;">
                                        ${openCentersCount} open (${totalOccupancy.toLocaleString()}/${totalCapacity.toLocaleString()})
                                    </p>
                                </div>

                                <div class="telemetry-item">
                                    <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:#cbd5e1;">
                                        <span>Municipalities</span>
                                        <span style="color:#34d399;">&#128205;</span>
                                    </div>
                                    <p style="margin-top:0.45rem;font-size:1.55rem;font-weight:700;color:#fff;">
                                        ${db.municipalities.length.toLocaleString()}
                                    </p>
                                    <p style="font-size:0.7rem;color:#cbd5e1;">Surigao del Norte LGUs</p>
                                </div>

                                <div class="telemetry-item">
                                    <div style="display:flex;justify-content:space-between;font-size:0.75rem;color:#cbd5e1;">
                                        <span>Advisories</span>
                                        <span style="color:#fcd34d;">&#128227;</span>
                                    </div>
                                    <p style="margin-top:0.45rem;font-size:1.55rem;font-weight:700;color:#fff;">
                                        ${db.disaster_updates.length.toLocaleString()}
                                    </p>
                                    <p style="font-size:0.7rem;color:#cbd5e1;">Published updates</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Main Content -->
            <div class="welcome-content">
                <!-- Interactive GIS Map -->
                ${renderGISMapBlockHtml(false)}

                <!-- 1. Recorded Disasters -->
                <section style="display:flex;flex-direction:column;gap:1.25rem;">
                    <div>
                        <span class="badge badge-outline" style="margin-bottom:0.4rem;">Disaster Monitoring</span>
                        <h2 style="font-size:1.5rem;font-weight:700;letter-spacing:-0.02em;">Latest Recorded Disasters</h2>
                        <p style="font-size:0.875rem;color:var(--muted-foreground);">
                            Active and recent disaster events recorded in Surigao del Norte (click any card to locate on the map)
                        </p>
                    </div>

                    <div class="grid-cards-3">
                        ${db.disasters
                            .slice(0, 6)
                            .map((d) => {
                                const muniName = getMunicipalityName(d.municipality_id);
                                const typeName = getDisasterTypeName(d.disaster_type_id);
                                return `
                                    <div class="card card-p card-hover" onclick="focusMarkerInPlace('disaster', ${d.id})">
                                        <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5rem;">
                                            <span class="badge ${severityBadgeClass(d.severity)}">${escapeHtml(d.severity)}</span>
                                            <span class="badge ${disasterStatusBadgeClass(d.status)}">${escapeHtml(d.status)}</span>
                                        </div>
                                        <h3 style="font-size:1rem;font-weight:700;margin-top:0.65rem;">${escapeHtml(d.title)}</h3>
                                        <p style="font-size:0.8rem;color:var(--muted-foreground);">
                                            ${escapeHtml(typeName)} &bull; ${escapeHtml(muniName)}
                                        </p>
                                        <p style="font-size:0.85rem;color:var(--muted-foreground);margin-top:0.6rem;">
                                            ${escapeHtml(d.description || 'No additional description provided.')}
                                        </p>
                                        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:0.85rem;padding-top:0.55rem;border-top:1px solid var(--border);font-size:0.75rem;color:var(--muted-foreground);">
                                            <span>Occurred: ${escapeHtml(d.occurred_at)}</span>
                                            <span style="color:var(--primary);font-weight:600;">Locate on Map</span>
                                        </div>
                                    </div>
                                `;
                            })
                            .join('')}
                    </div>
                </section>

                <!-- 2. Recent Disaster Updates & Advisories -->
                <section style="display:flex;flex-direction:column;gap:1.25rem;">
                    <div>
                        <span class="badge badge-secondary" style="margin-bottom:0.4rem;">Latest Bulletins</span>
                        <h2 style="font-size:1.5rem;font-weight:700;letter-spacing:-0.02em;">Recent Disaster Updates &amp; Advisories</h2>
                        <p style="font-size:0.875rem;color:var(--muted-foreground);">
                            Official situation reports and emergency advisories published by PDRRMO
                        </p>
                    </div>

                    <div class="grid-cards-3">
                        ${db.disaster_updates
                            .slice(0, 6)
                            .map((u) => {
                                const d = db.disasters.find((x) => Number(x.id) === Number(u.disaster_id));
                                const muniName = d ? getMunicipalityName(d.municipality_id) : 'Surigao del Norte';
                                return `
                                    <div class="card card-p">
                                        <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5rem;">
                                            <span class="badge badge-outline">${escapeHtml(muniName)}</span>
                                            <span style="font-size:0.75rem;color:var(--muted-foreground);">${escapeHtml(u.published_at || u.created_at)}</span>
                                        </div>
                                        <h3 style="font-size:1rem;font-weight:700;margin-top:0.65rem;">
                                            ${escapeHtml(d ? d.title : 'General Advisory')}
                                        </h3>
                                        <p style="font-size:0.85rem;color:var(--muted-foreground);margin-top:0.5rem;">
                                            ${escapeHtml(u.message)}
                                        </p>
                                    </div>
                                `;
                            })
                            .join('')}
                    </div>
                </section>

                <!-- 3. Evacuation Centers -->
                <section style="display:flex;flex-direction:column;gap:1.25rem;">
                    <div>
                        <span class="badge badge-outline" style="margin-bottom:0.4rem;">Evacuation Shelters</span>
                        <h2 style="font-size:1.5rem;font-weight:700;letter-spacing:-0.02em;">Evacuation Centers</h2>
                        <p style="font-size:0.875rem;color:var(--muted-foreground);">
                            Available evacuation centers, current occupancy, and shelter capacities (click any card to locate on the map)
                        </p>
                    </div>

                    <div class="grid-cards-3">
                        ${db.evacuation_centers
                            .slice(0, 6)
                            .map((c) => {
                                const muniName = getMunicipalityName(c.municipality_id);
                                return `
                                    <div class="card card-hover" style="overflow:hidden;" onclick="focusMarkerInPlace('center', ${c.id})">
                                        ${
                                            c.image
                                                ? `<img src="${escapeHtml(c.image)}" alt="${escapeHtml(c.center_name)}" style="height:160px;width:100%;object-fit:cover;border-bottom:1px solid var(--border);" onerror="this.style.display='none'" />`
                                                : ''
                                        }
                                        <div class="card-p">
                                            <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5rem;">
                                                <span class="badge badge-secondary">${escapeHtml(muniName)}</span>
                                                <span class="badge ${centerStatusBadgeClass(c.status)}">${escapeHtml(c.status)}</span>
                                            </div>
                                            <h3 style="font-size:1rem;font-weight:700;margin-top:0.65rem;">${escapeHtml(c.center_name)}</h3>
                                            <p style="font-size:0.8rem;color:var(--muted-foreground);margin-top:0.15rem;">
                                                ${escapeHtml(c.address)}
                                            </p>
                                            <div style="display:flex;align-items:center;justify-content:space-between;margin-top:0.85rem;font-size:0.76rem;color:var(--muted-foreground);">
                                                <span>
                                                    Occupancy:
                                                    <strong style="color:var(--foreground);">
                                                        ${Number(c.current_occupancy).toLocaleString()} / ${Number(c.capacity).toLocaleString()} persons
                                                    </strong>
                                                </span>
                                                <span style="color:var(--primary);font-weight:600;">Locate on Map</span>
                                            </div>
                                        </div>
                                    </div>
                                `;
                            })
                            .join('')}
                    </div>
                </section>
            </div>

            <!-- Footer -->
            <footer style="margin-top:auto;border-top:1px solid var(--border);background:var(--card);padding:2rem 1.5rem;">
                <div style="max-width:1280px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:1rem;">
                    <div style="display:flex;align-items:center;gap:0.75rem;">
                        <img src="assets/logo.png" alt="Logo" style="width:32px;height:32px;border-radius:9999px;object-fit:contain;" />
                        <span style="font-size:0.875rem;font-weight:500;">
                            Surigao del Norte Natural Disaster Web-Based Information System (SDN-NDIS)
                        </span>
                    </div>
                    <div style="font-size:0.75rem;color:var(--muted-foreground);">
                        Provincial Disaster Risk Reduction &amp; Management Office (PDRRMO)
                    </div>
                </div>
            </footer>
        </div>
    `;
}

// ==========================================================================
// 2. Split Auth Views (Matches AuthSplitLayout.vue + Login.vue + Register.vue)
// ==========================================================================
function renderAuthSplitWrapper(title, description, formHtml) {
    return `
        <div class="auth-split-grid">
            <!-- Left Brand & Command Showcase Panel -->
            <div class="auth-left-panel">
                <div class="hero-dots"></div>

                <div style="position:relative;z-index:20;display:flex;align-items:center;justify-content:space-between;">
                    <div class="brand-row" onclick="navigateTo('welcome')">
                        <img src="assets/logo.png" alt="SDN-NDIS" class="logo-circle" style="width:48px;height:48px;" />
                        <div>
                            <span style="font-size:1.125rem;font-weight:700;">SDN-NDIS</span>
                            <p style="font-size:0.75rem;color:#a5f3fc;">Province of Surigao del Norte</p>
                        </div>
                    </div>
                    <span class="badge" style="border-color:rgba(255,255,255,0.2);background:rgba(255,255,255,0.1);color:#cffafe;">
                        PDRRMO Portal
                    </span>
                </div>

                <div style="position:relative;z-index:20;max-width:540px;margin:auto 0;padding:2rem 0;display:flex;flex-direction:column;gap:2rem;">
                    <div>
                        <h2 style="font-size:2.15rem;font-weight:800;line-height:1.2;letter-spacing:-0.02em;">
                            Surigao del Norte Natural Disaster
                            <span style="color:#38e0f5;">Information System</span>
                        </h2>
                        <p style="margin-top:0.75rem;font-size:0.95rem;color:#e2e8f0;line-height:1.6;">
                            Unified web-based disaster monitoring, evacuation center management, and public advisory platform for resilient communities.
                        </p>
                    </div>

                    <div style="display:flex;flex-direction:column;gap:0.9rem;">
                        <div class="auth-highlight-box">
                            <div class="auth-highlight-icon">&#127760;</div>
                            <div>
                                <h3 style="font-size:0.875rem;font-weight:600;color:#fff;">GIS Disaster &amp; Shelter Mapping</h3>
                                <p style="font-size:0.76rem;color:#cbd5e1;margin-top:0.15rem;">
                                    Pinpoint active incidents and evacuation centers across Surigao del Norte.
                                </p>
                            </div>
                        </div>
                        <div class="auth-highlight-box">
                            <div class="auth-highlight-icon">&#127970;</div>
                            <div>
                                <h3 style="font-size:0.875rem;font-weight:600;color:#fff;">Evacuation Capacity Tracking</h3>
                                <p style="font-size:0.76rem;color:#cbd5e1;margin-top:0.15rem;">
                                    Monitor live shelter occupancy, facility photos, and operational readiness.
                                </p>
                            </div>
                        </div>
                        <div class="auth-highlight-box">
                            <div class="auth-highlight-icon">&#128227;</div>
                            <div>
                                <h3 style="font-size:0.875rem;font-weight:600;color:#fff;">Verified PDRRMO Advisories</h3>
                                <p style="font-size:0.76rem;color:#cbd5e1;margin-top:0.15rem;">
                                    Timely official emergency bulletins and municipal situation updates.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="position:relative;z-index:20;display:flex;align-items:center;justify-content:space-between;border-top:1px solid rgba(255,255,255,0.15);padding-top:1.25rem;font-size:0.75rem;color:#cbd5e1;">
                    <span>Provincial Disaster Risk Reduction &amp; Management Office</span>
                    <span>Surigao del Norte</span>
                </div>
            </div>

            <!-- Right Form Panel -->
            <div class="auth-right-panel">
                <div class="auth-form-container">
                    <div style="margin-bottom:1.25rem;">
                        <a href="javascript:void(0)" onclick="navigateTo('welcome')" style="font-size:0.78rem;font-weight:500;color:var(--muted-foreground);text-decoration:none;">
                            &larr; Back to Home
                        </a>
                    </div>

                    <div class="auth-card">
                        <div class="auth-card-stripe"></div>
                        <div style="padding:1.75rem 1.75rem 0.75rem;text-align:center;">
                            <img src="assets/logo.png" alt="Logo" class="logo-circle" style="width:60px;height:60px;margin:0 auto 0.75rem;cursor:pointer;" onclick="navigateTo('welcome')" />
                            <h1 style="font-size:1.25rem;font-weight:700;">${escapeHtml(title)}</h1>
                            <p style="font-size:0.85rem;color:var(--muted-foreground);margin-top:0.25rem;">${escapeHtml(description)}</p>
                        </div>
                        <div style="padding:1rem 1.75rem 2rem;">
                            ${formHtml}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderLoginView() {
    const formHtml = `
        <div id="login-error" style="display:none;background:var(--destructive-light);color:#991b1b;padding:0.6rem 0.75rem;border-radius:var(--radius-sm);font-size:0.8rem;margin-bottom:0.9rem;"></div>
        <form onsubmit="handleLoginSubmit(event)">
            <div class="field">
                <label class="label">Email address</label>
                <input id="login-email" type="email" class="input" placeholder="email@example.com" required autofocus />
            </div>
            <div class="field">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <label class="label">Password</label>
                </div>
                <input id="login-password" type="password" class="input" placeholder="Password" required />
            </div>
            <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:1.1rem;font-size:0.82rem;">
                <input type="checkbox" id="remember-me" />
                <label for="remember-me">Remember me</label>
            </div>
            <button type="submit" class="btn btn-default" style="width:100%;">Log in</button>
        </form>
        <div style="text-align:center;margin-top:1.15rem;font-size:0.82rem;color:var(--muted-foreground);">
            Don't have an account?
            <a href="javascript:void(0)" onclick="navigateTo('register')" style="color:var(--primary);font-weight:600;text-decoration:none;">Sign up</a>
        </div>
    `;

    return renderAuthSplitWrapper('Log in to your account', 'Enter your email and password below to log in', formHtml);
}

function renderRegisterView() {
    const formHtml = `
        <div id="reg-error" style="display:none;background:var(--destructive-light);color:#991b1b;padding:0.6rem 0.75rem;border-radius:var(--radius-sm);font-size:0.8rem;margin-bottom:0.9rem;"></div>
        <form onsubmit="handleRegisterSubmit(event)">
            <div class="field">
                <label class="label">Full Name</label>
                <input id="reg-name" type="text" class="input" placeholder="Full name" required />
            </div>
            <div class="field">
                <label class="label">Email address</label>
                <input id="reg-email" type="email" class="input" placeholder="email@example.com" required />
            </div>
            <div class="field">
                <label class="label">Contact Number</label>
                <input id="reg-contact" type="text" class="input" placeholder="09XX-XXX-XXXX" />
            </div>
            <div class="field">
                <label class="label">Full Address</label>
                <input id="reg-address" type="text" class="input" placeholder="Barangay, Municipality, Surigao del Norte" />
            </div>
            <div class="field-row">
                <div class="field">
                    <label class="label">Password</label>
                    <input id="reg-password" type="password" class="input" placeholder="Password" required />
                </div>
                <div class="field">
                    <label class="label">Confirm password</label>
                    <input id="reg-password-confirm" type="password" class="input" placeholder="Confirm password" required />
                </div>
            </div>
            <button type="submit" class="btn btn-default" style="width:100%;">Create account</button>
        </form>
        <div style="text-align:center;margin-top:1.15rem;font-size:0.82rem;color:var(--muted-foreground);">
            Already have an account?
            <a href="javascript:void(0)" onclick="navigateTo('login')" style="color:var(--primary);font-weight:600;text-decoration:none;">Log in</a>
        </div>
    `;

    return renderAuthSplitWrapper('Create an account', 'Enter your details below to create your account', formHtml);
}

// ==========================================================================
// 3. Authenticated Portal Layout (Matches AppSidebar.vue + AppSidebarHeader.vue)
// ==========================================================================
function renderPortalView() {
    if (!state.currentUser) {
        return renderLoginView();
    }

    const role = state.currentUser.role;

    const headMenuHtml = `
        <div class="sidebar-group-label">Head</div>
        <div class="sidebar-menu">
            <button class="sidebar-item ${state.tab === 'head-dashboard' ? 'active' : ''}" onclick="switchTab('head-dashboard')">
                <span>&#9638;</span>
                <span>Dashboard</span>
            </button>
            <button class="sidebar-item ${state.tab === 'head-users' ? 'active' : ''}" onclick="switchTab('head-users')">
                <span>&#128101;</span>
                <span>User Management</span>
            </button>
        </div>
    `;

    const pdrrmoMenuHtml = `
        <div class="sidebar-group-label">PDRRMO</div>
        <div class="sidebar-menu">
            <button class="sidebar-item ${state.tab === 'pdrrmo-dashboard' ? 'active' : ''}" onclick="switchTab('pdrrmo-dashboard')">
                <span>&#9638;</span>
                <span>Dashboard</span>
            </button>
            <div style="margin-top:0.15rem;">
                <div class="sidebar-item" style="color:#94a3b8;cursor:default;">
                    <span>&#9888;</span>
                    <span>Disaster Management</span>
                </div>
                <div class="sidebar-sub-menu">
                    <button class="sidebar-item ${state.tab === 'pdrrmo-disasters' ? 'active' : ''}" onclick="switchTab('pdrrmo-disasters')">
                        <span>Disasters</span>
                    </button>
                    <button class="sidebar-item ${state.tab === 'pdrrmo-updates' ? 'active' : ''}" onclick="switchTab('pdrrmo-updates')">
                        <span>Disaster Updates</span>
                    </button>
                    <button class="sidebar-item ${state.tab === 'pdrrmo-types' ? 'active' : ''}" onclick="switchTab('pdrrmo-types')">
                        <span>Disaster Types</span>
                    </button>
                </div>
            </div>
            <button class="sidebar-item ${state.tab === 'pdrrmo-centers' ? 'active' : ''}" onclick="switchTab('pdrrmo-centers')">
                <span>&#127970;</span>
                <span>Evacuation Centers</span>
            </button>
            <button class="sidebar-item ${state.tab === 'pdrrmo-municipalities' ? 'active' : ''}" onclick="switchTab('pdrrmo-municipalities')">
                <span>&#128205;</span>
                <span>Municipalities</span>
            </button>
            <button class="sidebar-item ${state.tab === 'pdrrmo-logs' ? 'active' : ''}" onclick="switchTab('pdrrmo-logs')">
                <span>&#128338;</span>
                <span>Access Logs</span>
            </button>
        </div>
    `;

    const guestMenuHtml = `
        <div class="sidebar-group-label">Guest</div>
        <div class="sidebar-menu">
            <button class="sidebar-item ${state.tab === 'guest-dashboard' ? 'active' : ''}" onclick="switchTab('guest-dashboard')">
                <span>&#9638;</span>
                <span>Dashboard</span>
            </button>
            <button class="sidebar-item ${state.tab === 'guest-map' ? 'active' : ''}" onclick="switchTab('guest-map')">
                <span>&#128506;</span>
                <span>Disaster Map</span>
            </button>
            <button class="sidebar-item ${state.tab === 'guest-disasters' ? 'active' : ''}" onclick="switchTab('guest-disasters')">
                <span>&#9888;</span>
                <span>Disasters &amp; Updates</span>
            </button>
            <button class="sidebar-item ${state.tab === 'guest-centers' ? 'active' : ''}" onclick="switchTab('guest-centers')">
                <span>&#127970;</span>
                <span>Evacuation Centers</span>
            </button>
        </div>
    `;

    return `
        <div class="portal-layout">
            <!-- AppSidebar.vue -->
            <aside class="app-sidebar">
                <div>
                    <div class="sidebar-brand" onclick="navigateTo('welcome')">
                        <img src="assets/logo.png" alt="Logo" style="width:34px;height:34px;border-radius:9999px;object-fit:contain;" />
                        <div>
                            <div style="font-size:0.92rem;font-weight:700;line-height:1.1;">SDN-NDIS</div>
                            <div style="font-size:0.68rem;color:#94a3b8;">Surigao del Norte</div>
                        </div>
                    </div>

                    ${role === 'HEAD' ? headMenuHtml + pdrrmoMenuHtml : ''}
                    ${role === 'PDRRMO' ? pdrrmoMenuHtml : ''}
                    ${role === 'GUEST' ? guestMenuHtml : ''}
                </div>

                <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:0.65rem;">
                    <button class="sidebar-item ${state.tab === 'profile' ? 'active' : ''}" onclick="switchTab('profile')">
                        <span>&#9881;</span>
                        <span>Profile Settings</span>
                    </button>
                    <button class="sidebar-item" onclick="handleLogout()">
                        <span>&rarr;</span>
                        <span>Log out</span>
                    </button>
                </div>
            </aside>

            <!-- Main Portal Workspace -->
            <div class="portal-main">
                <header class="portal-topbar">
                    <div class="breadcrumb-bar">
                        <span>SDN-NDIS</span>
                        <span>/</span>
                        <span class="breadcrumb-current">${escapeHtml(getActiveBreadcrumbTitle())}</span>
                    </div>

                    <div style="display:flex;align-items:center;gap:0.6rem;">
                        <button class="user-pill-btn" onclick="switchTab('profile')" title="Profile Settings">
                            <span class="avatar-circle">${escapeHtml(getInitials(state.currentUser.full_name))}</span>
                            <span>${escapeHtml(state.currentUser.full_name)}</span>
                        </button>
                    </div>
                </header>

                <main class="portal-page-body">
                    ${renderActivePortalTab()}
                </main>
            </div>
        </div>
        ${renderModalHtml()}
    `;
}

function getActiveBreadcrumbTitle() {
    const map = {
        'head-dashboard': 'Dashboard',
        'head-users': 'Users',
        'pdrrmo-dashboard': 'Dashboard',
        'pdrrmo-disasters': 'Disasters',
        'pdrrmo-updates': 'Disaster Updates',
        'pdrrmo-types': 'Disaster Types',
        'pdrrmo-centers': 'Evacuation Centers',
        'pdrrmo-municipalities': 'Municipalities',
        'pdrrmo-logs': 'Access Logs',
        'guest-dashboard': 'Dashboard',
        'guest-map': 'Disaster Map',
        'guest-disasters': 'Disasters & Updates',
        'guest-centers': 'Evacuation Centers',
        profile: 'Profile settings',
    };
    return map[state.tab] || 'Dashboard';
}

function renderActivePortalTab() {
    switch (state.tab) {
        case 'head-dashboard':
            return renderHeadDashboardPage();
        case 'head-users':
            return renderHeadUsersPage();
        case 'pdrrmo-dashboard':
            return renderPdrrmoDashboardPage();
        case 'pdrrmo-disasters':
            return renderPdrrmoDisastersPage();
        case 'pdrrmo-updates':
            return renderPdrrmoUpdatesPage();
        case 'pdrrmo-types':
            return renderPdrrmoTypesPage();
        case 'pdrrmo-centers':
            return renderPdrrmoCentersPage();
        case 'pdrrmo-municipalities':
            return renderPdrrmoMunicipalitiesPage();
        case 'pdrrmo-logs':
            return renderPdrrmoAccessLogsPage();
        case 'guest-dashboard':
            return renderGuestDashboardPage();
        case 'guest-map':
            return renderGISMapBlockHtml(true);
        case 'guest-disasters':
            return renderGuestDisastersPage();
        case 'guest-centers':
            return renderGuestCentersPage();
        case 'profile':
            return renderProfileSettingsPage();
        default:
            return renderPdrrmoDashboardPage();
    }
}

// ==========================================================================
// HEAD Pages (Dashboard.vue & users/Index.vue)
// ==========================================================================
function renderHeadDashboardPage() {
    const pdrrmoCount = db.users.filter((u) => u.role === 'PDRRMO').length;
    const guestCount = db.users.filter((u) => u.role === 'GUEST').length;
    const activeDisasters = db.disasters.filter((d) => d.status === 'Active' || d.status === 'Monitoring').length;
    const criticalDisasters = db.disasters.filter((d) => (d.status === 'Active' || d.status === 'Monitoring') && (d.severity === 'Critical' || d.severity === 'High')).length;
    const openCenters = db.evacuation_centers.filter((c) => c.status === 'Open').length;
    const totalOccupancy = db.evacuation_centers.reduce((s, c) => s + Number(c.current_occupancy || 0), 0);
    const totalCapacity = db.evacuation_centers.reduce((s, c) => s + Number(c.capacity || 0), 0);

    return `
        <div style="display:flex;flex-direction:column;gap:1.5rem;">
            <div>
                <h1 style="font-size:1.5rem;font-weight:700;letter-spacing:-0.02em;">Head Dashboard</h1>
                <p style="font-size:0.875rem;color:var(--muted-foreground);">
                    System-wide executive overview of users, disaster operations, evacuation centers, and audit logs
                </p>
            </div>

            <div class="grid-kpi-3">
                <div class="card card-p">
                    <div style="font-size:0.82rem;color:var(--muted-foreground);">Managed Users</div>
                    <div style="font-size:1.65rem;font-weight:700;margin:0.25rem 0;">${db.users.length.toLocaleString()}</div>
                    <div style="font-size:0.75rem;color:var(--muted-foreground);">${pdrrmoCount} PDRRMO staff &bull; ${guestCount} Guest accounts</div>
                </div>

                <div class="card card-p">
                    <div style="font-size:0.82rem;color:var(--muted-foreground);">Recorded Disasters</div>
                    <div style="font-size:1.65rem;font-weight:700;margin:0.25rem 0;">${db.disasters.length.toLocaleString()}</div>
                    ${
                        criticalDisasters > 0
                            ? `<span class="badge badge-destructive">${criticalDisasters} High / Critical active</span>`
                            : `<div style="font-size:0.75rem;color:var(--muted-foreground);">${activeDisasters} active across ${db.disaster_types.length} categories</div>`
                    }
                </div>

                <div class="card card-p">
                    <div style="font-size:0.82rem;color:var(--muted-foreground);">Evacuation Centers</div>
                    <div style="font-size:1.65rem;font-weight:700;margin:0.25rem 0;">${db.evacuation_centers.length.toLocaleString()}</div>
                    <div style="font-size:0.75rem;color:var(--muted-foreground);">${openCenters} open across ${db.municipalities.length} municipalities</div>
                </div>

                <div class="card card-p">
                    <div style="font-size:0.82rem;color:var(--muted-foreground);">Current Evacuee Occupancy</div>
                    <div style="font-size:1.65rem;font-weight:700;margin:0.25rem 0;">${totalOccupancy.toLocaleString()} / ${totalCapacity.toLocaleString()}</div>
                    <div style="font-size:0.75rem;color:var(--muted-foreground);">Combined evacuees vs. total shelter capacity</div>
                </div>

                <div class="card card-p">
                    <div style="font-size:0.82rem;color:var(--muted-foreground);">Published Disaster Updates</div>
                    <div style="font-size:1.65rem;font-weight:700;margin:0.25rem 0;">${db.disaster_updates.length.toLocaleString()}</div>
                    <div style="font-size:0.75rem;color:var(--muted-foreground);">Official situation reports &amp; advisories</div>
                </div>

                <div class="card card-p">
                    <div style="font-size:0.82rem;color:var(--muted-foreground);">System Access Logs</div>
                    <div style="font-size:1.65rem;font-weight:700;margin:0.25rem 0;">${db.access_logs.length.toLocaleString()}</div>
                    <span class="badge badge-secondary">Audit active</span>
                </div>
            </div>

            <div class="grid-2-col">
                <div class="card card-p">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">
                        <div>
                            <h3 style="font-size:1rem;font-weight:700;">Recent Users</h3>
                            <p style="font-size:0.8rem;color:var(--muted-foreground);">Latest registered PDRRMO and Guest accounts</p>
                        </div>
                        <button class="btn btn-outline btn-sm" onclick="switchTab('head-users')">Manage Users</button>
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Role</th>
                                    <th>Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${db.users
                                    .slice(0, 6)
                                    .map(
                                        (u) => `
                                    <tr>
                                        <td>
                                            <div style="font-weight:600;">${escapeHtml(u.full_name)}</div>
                                            <div style="font-size:0.75rem;color:var(--muted-foreground);">${escapeHtml(u.email)}</div>
                                        </td>
                                        <td><span class="badge ${u.role === 'PDRRMO' ? 'badge-default' : 'badge-secondary'}">${escapeHtml(u.role)}</span></td>
                                        <td style="font-size:0.8rem;color:var(--muted-foreground);">${escapeHtml((u.created_at || '').slice(0, 10))}</td>
                                    </tr>
                                `
                                    )
                                    .join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="card card-p">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">
                        <div>
                            <h3 style="font-size:1rem;font-weight:700;">Recent Access Logs</h3>
                            <p style="font-size:0.8rem;color:var(--muted-foreground);">Latest login, logout, and guest visit events</p>
                        </div>
                        <button class="btn btn-outline btn-sm" onclick="switchTab('pdrrmo-logs')">View All Logs</button>
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>User / Visitor</th>
                                    <th>Event</th>
                                    <th>IP Address</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${db.access_logs
                                    .slice(0, 6)
                                    .map((log) => {
                                        const u = getUserRecord(log.user_id);
                                        return `
                                            <tr>
                                                <td>
                                                    <div style="font-weight:600;">${escapeHtml(u ? u.full_name : 'Anonymous Guest')}</div>
                                                    ${u ? `<div style="font-size:0.72rem;color:var(--muted-foreground);">${escapeHtml(u.role)}</div>` : ''}
                                                </td>
                                                <td><span class="badge ${log.event_type === 'LOGIN' ? 'badge-default' : 'badge-secondary'}">${escapeHtml(log.event_type)}</span></td>
                                                <td><code style="background:var(--muted);padding:0.15rem 0.4rem;border-radius:4px;font-size:0.75rem;">${escapeHtml(log.ip_address)}</code></td>
                                                <td style="font-size:0.75rem;color:var(--muted-foreground);">${escapeHtml(log.accessed_at)}</td>
                                            </tr>
                                        `;
                                    })
                                    .join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderHeadUsersPage() {
    return `
        <div style="display:flex;flex-direction:column;gap:1.25rem;">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;">
                <div>
                    <h1 style="font-size:1.5rem;font-weight:700;letter-spacing:-0.02em;">Users</h1>
                    <p style="font-size:0.875rem;color:var(--muted-foreground);">Manage system accounts, contact information, and role assignments</p>
                </div>
                <button class="btn btn-default" onclick="openModal('user', 'create')">+ Add User</button>
            </div>

            <div class="card card-p">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Full Name</th>
                                <th>Email</th>
                                <th>Contact Number</th>
                                <th>Full Address</th>
                                <th>Role</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${db.users
                                .map(
                                    (u) => `
                                <tr>
                                    <td style="font-weight:600;">${escapeHtml(u.full_name)}</td>
                                    <td>${escapeHtml(u.email)}</td>
                                    <td>${escapeHtml(u.contact_number || '—')}</td>
                                    <td style="max-width:250px;font-size:0.8rem;color:var(--muted-foreground);">${escapeHtml(u.full_address || '—')}</td>
                                    <td><span class="badge ${u.role === 'HEAD' ? 'badge-default' : u.role === 'PDRRMO' ? 'badge-default' : 'badge-secondary'}">${escapeHtml(u.role)}</span></td>
                                    <td>
                                        <div style="display:flex;gap:0.4rem;">
                                            <button class="btn btn-outline btn-sm" onclick="openModal('user', 'edit', ${u.id})">Edit</button>
                                            ${
                                                u.is_protected
                                                    ? `<span class="badge badge-outline">Protected</span>`
                                                    : `<button class="btn btn-destructive btn-sm" onclick="deleteRecord('user', ${u.id})">Delete</button>`
                                            }
                                        </div>
                                    </td>
                                </tr>
                            `
                                )
                                .join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

// ==========================================================================
// PDRRMO Pages (Dashboard.vue & CRUD Tables)
// ==========================================================================
function renderPdrrmoDashboardPage() {
    const activeDisasters = db.disasters.filter((d) => d.status === 'Active' || d.status === 'Monitoring').length;
    const criticalDisasters = db.disasters.filter((d) => (d.status === 'Active' || d.status === 'Monitoring') && (d.severity === 'Critical' || d.severity === 'High')).length;
    const openCenters = db.evacuation_centers.filter((c) => c.status === 'Open').length;
    const totalOccupancy = db.evacuation_centers.reduce((s, c) => s + Number(c.current_occupancy || 0), 0);
    const totalCapacity = db.evacuation_centers.reduce((s, c) => s + Number(c.capacity || 0), 0);

    return `
        <div style="display:flex;flex-direction:column;gap:1.5rem;">
            <div>
                <h1 style="font-size:1.5rem;font-weight:700;letter-spacing:-0.02em;">PDRRMO Dashboard</h1>
                <p style="font-size:0.875rem;color:var(--muted-foreground);">
                    Overview of Surigao del Norte disaster monitoring, evacuation centers, and emergency updates
                </p>
            </div>

            <div class="grid-kpi-3">
                <div class="card card-p">
                    <div style="font-size:0.82rem;color:var(--muted-foreground);">Total Recorded Disasters</div>
                    <div style="font-size:1.65rem;font-weight:700;margin:0.25rem 0;">${db.disasters.length.toLocaleString()}</div>
                    <div style="font-size:0.75rem;color:var(--muted-foreground);">Across ${db.disaster_types.length} disaster categories</div>
                </div>

                <div class="card card-p">
                    <div style="font-size:0.82rem;color:var(--muted-foreground);">Active / Monitoring Disasters</div>
                    <div style="font-size:1.65rem;font-weight:700;margin:0.25rem 0;">${activeDisasters.toLocaleString()}</div>
                    ${
                        criticalDisasters > 0
                            ? `<span class="badge badge-destructive">${criticalDisasters} High / Critical severity</span>`
                            : `<span class="badge badge-secondary">All situations stable</span>`
                    }
                </div>

                <div class="card card-p">
                    <div style="font-size:0.82rem;color:var(--muted-foreground);">Evacuation Centers</div>
                    <div style="font-size:1.65rem;font-weight:700;margin:0.25rem 0;">${db.evacuation_centers.length.toLocaleString()}</div>
                    <div style="font-size:0.75rem;color:var(--muted-foreground);">${openCenters} open and ready for evacuees</div>
                </div>

                <div class="card card-p">
                    <div style="font-size:0.82rem;color:var(--muted-foreground);">Current Evacuee Occupancy</div>
                    <div style="font-size:1.65rem;font-weight:700;margin:0.25rem 0;">${totalOccupancy.toLocaleString()} / ${totalCapacity.toLocaleString()}</div>
                    <div style="font-size:0.75rem;color:var(--muted-foreground);">Total occupants vs. combined center capacity</div>
                </div>

                <div class="card card-p">
                    <div style="font-size:0.82rem;color:var(--muted-foreground);">Published Disaster Updates</div>
                    <div style="font-size:1.65rem;font-weight:700;margin:0.25rem 0;">${db.disaster_updates.length.toLocaleString()}</div>
                    <div style="font-size:0.75rem;color:var(--muted-foreground);">Official situation reports &amp; advisories</div>
                </div>

                <div class="card card-p">
                    <div style="font-size:0.82rem;color:var(--muted-foreground);">Municipalities Covered</div>
                    <div style="font-size:1.65rem;font-weight:700;margin:0.25rem 0;">${db.municipalities.length.toLocaleString()}</div>
                    <div style="font-size:0.75rem;color:var(--muted-foreground);">${db.access_logs.length.toLocaleString()} system access logs recorded</div>
                </div>
            </div>

            <div class="grid-2-col">
                <div class="card card-p">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">
                        <div>
                            <h3 style="font-size:1rem;font-weight:700;">Recent Disasters</h3>
                            <p style="font-size:0.8rem;color:var(--muted-foreground);">Latest recorded disaster events in Surigao del Norte</p>
                        </div>
                        <button class="btn btn-outline btn-sm" onclick="switchTab('pdrrmo-disasters')">View All</button>
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Disaster</th>
                                    <th>Municipality</th>
                                    <th>Severity</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${db.disasters
                                    .slice(0, 5)
                                    .map(
                                        (d) => `
                                    <tr>
                                        <td>
                                            <div style="font-weight:600;">${escapeHtml(d.title)}</div>
                                            <div style="font-size:0.75rem;color:var(--muted-foreground);">
                                                ${escapeHtml(getDisasterTypeName(d.disaster_type_id))} &bull; ${escapeHtml(d.occurred_at)}
                                            </div>
                                        </td>
                                        <td>${escapeHtml(getMunicipalityName(d.municipality_id))}</td>
                                        <td><span class="badge ${severityBadgeClass(d.severity)}">${escapeHtml(d.severity)}</span></td>
                                        <td><span class="badge ${disasterStatusBadgeClass(d.status)}">${escapeHtml(d.status)}</span></td>
                                    </tr>
                                `
                                    )
                                    .join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="card card-p">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">
                        <div>
                            <h3 style="font-size:1rem;font-weight:700;">Evacuation Centers</h3>
                            <p style="font-size:0.8rem;color:var(--muted-foreground);">Recent evacuation centers and occupancy status</p>
                        </div>
                        <button class="btn btn-outline btn-sm" onclick="switchTab('pdrrmo-centers')">Manage</button>
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Center Name</th>
                                    <th>Municipality</th>
                                    <th>Occupancy</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${db.evacuation_centers
                                    .slice(0, 5)
                                    .map(
                                        (c) => `
                                    <tr>
                                        <td style="font-weight:600;">${escapeHtml(c.center_name)}</td>
                                        <td>${escapeHtml(getMunicipalityName(c.municipality_id))}</td>
                                        <td>${Number(c.current_occupancy).toLocaleString()} / ${Number(c.capacity).toLocaleString()}</td>
                                        <td><span class="badge ${centerStatusBadgeClass(c.status)}">${escapeHtml(c.status)}</span></td>
                                    </tr>
                                `
                                    )
                                    .join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderPdrrmoDisastersPage() {
    return `
        <div style="display:flex;flex-direction:column;gap:1.25rem;">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;">
                <div>
                    <h1 style="font-size:1.5rem;font-weight:700;letter-spacing:-0.02em;">Disasters</h1>
                    <p style="font-size:0.875rem;color:var(--muted-foreground);">Manage disaster incidents, geographic coordinates, severity, and status</p>
                </div>
                <button class="btn btn-default" onclick="openModal('disaster', 'create')">+ Add Disaster</button>
            </div>

            <div class="card card-p">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Type</th>
                                <th>Municipality</th>
                                <th>Coordinates</th>
                                <th>Severity</th>
                                <th>Status</th>
                                <th>Occurred At</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${db.disasters
                                .map((d) => {
                                    const muniName = getMunicipalityName(d.municipality_id);
                                    const coords = resolveCoords(d.latitude, d.longitude, muniName);
                                    return `
                                        <tr>
                                            <td>
                                                <div style="font-weight:600;">${escapeHtml(d.title)}</div>
                                                <div style="font-size:0.75rem;color:var(--muted-foreground);max-width:260px;">${escapeHtml(d.description)}</div>
                                            </td>
                                            <td>${escapeHtml(getDisasterTypeName(d.disaster_type_id))}</td>
                                            <td>${escapeHtml(muniName)}</td>
                                            <td style="font-family:monospace;font-size:0.76rem;">
                                                ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}
                                            </td>
                                            <td><span class="badge ${severityBadgeClass(d.severity)}">${escapeHtml(d.severity)}</span></td>
                                            <td><span class="badge ${disasterStatusBadgeClass(d.status)}">${escapeHtml(d.status)}</span></td>
                                            <td style="font-size:0.8rem;">${escapeHtml(d.occurred_at)}</td>
                                            <td>
                                                <div style="display:flex;gap:0.35rem;">
                                                    <button class="btn btn-outline btn-sm" onclick="openModal('disaster', 'edit', ${d.id})">Edit</button>
                                                    <button class="btn btn-destructive btn-sm" onclick="deleteRecord('disaster', ${d.id})">Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                })
                                .join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function renderPdrrmoUpdatesPage() {
    return `
        <div style="display:flex;flex-direction:column;gap:1.25rem;">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;">
                <div>
                    <h1 style="font-size:1.5rem;font-weight:700;letter-spacing:-0.02em;">Disaster Updates</h1>
                    <p style="font-size:0.875rem;color:var(--muted-foreground);">Publish and manage official emergency advisories and situation reports</p>
                </div>
                <button class="btn btn-default" onclick="openModal('update', 'create')">+ Publish Update</button>
            </div>

            <div class="card card-p">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Disaster</th>
                                <th>Message</th>
                                <th>Published At</th>
                                <th>Author</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${db.disaster_updates
                                .map((u) => {
                                    const d = db.disasters.find((x) => Number(x.id) === Number(u.disaster_id));
                                    const author = getUserRecord(u.created_by);
                                    return `
                                        <tr>
                                            <td>
                                                <div style="font-weight:600;">${escapeHtml(d ? d.title : 'General Advisory')}</div>
                                                <div style="font-size:0.75rem;color:var(--muted-foreground);">
                                                    ${d ? escapeHtml(getMunicipalityName(d.municipality_id)) : 'Surigao del Norte'}
                                                </div>
                                            </td>
                                            <td style="max-width:400px;">${escapeHtml(u.message)}</td>
                                            <td style="font-size:0.8rem;">${escapeHtml(u.published_at || 'N/A')}</td>
                                            <td style="font-size:0.8rem;">${escapeHtml(author ? author.full_name : 'PDRRMO')}</td>
                                            <td>
                                                <div style="display:flex;gap:0.35rem;">
                                                    <button class="btn btn-outline btn-sm" onclick="openModal('update', 'edit', ${u.id})">Edit</button>
                                                    <button class="btn btn-destructive btn-sm" onclick="deleteRecord('update', ${u.id})">Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                })
                                .join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function renderPdrrmoCentersPage() {
    return `
        <div style="display:flex;flex-direction:column;gap:1.25rem;">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;">
                <div>
                    <h1 style="font-size:1.5rem;font-weight:700;letter-spacing:-0.02em;">Evacuation Centers</h1>
                    <p style="font-size:0.875rem;color:var(--muted-foreground);">Manage designated evacuation shelters, photos, capacities, and occupancy</p>
                </div>
                <button class="btn btn-default" onclick="openModal('center', 'create')">+ Add Evacuation Center</button>
            </div>

            <div class="card card-p">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Center</th>
                                <th>Municipality</th>
                                <th>Address</th>
                                <th>Coordinates</th>
                                <th>Occupancy / Capacity</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${db.evacuation_centers
                                .map((c) => {
                                    const muniName = getMunicipalityName(c.municipality_id);
                                    const coords = resolveCoords(c.latitude, c.longitude, muniName);
                                    return `
                                        <tr>
                                            <td>
                                                <div style="display:flex;align-items:center;gap:0.65rem;">
                                                    ${
                                                        c.image
                                                            ? `<img src="${escapeHtml(c.image)}" alt="" style="width:44px;height:34px;object-fit:cover;border-radius:4px;border:1px solid var(--border);" onerror="this.style.display='none'" />`
                                                            : ''
                                                    }
                                                    <span style="font-weight:600;">${escapeHtml(c.center_name)}</span>
                                                </div>
                                            </td>
                                            <td>${escapeHtml(muniName)}</td>
                                            <td style="font-size:0.8rem;color:var(--muted-foreground);">${escapeHtml(c.address)}</td>
                                            <td style="font-family:monospace;font-size:0.76rem;">
                                                ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}
                                            </td>
                                            <td style="font-weight:600;">
                                                ${Number(c.current_occupancy).toLocaleString()} / ${Number(c.capacity).toLocaleString()}
                                            </td>
                                            <td><span class="badge ${centerStatusBadgeClass(c.status)}">${escapeHtml(c.status)}</span></td>
                                            <td>
                                                <div style="display:flex;gap:0.35rem;">
                                                    <button class="btn btn-outline btn-sm" onclick="openModal('center', 'edit', ${c.id})">Edit</button>
                                                    <button class="btn btn-destructive btn-sm" onclick="deleteRecord('center', ${c.id})">Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                })
                                .join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function renderPdrrmoMunicipalitiesPage() {
    return `
        <div style="display:flex;flex-direction:column;gap:1.25rem;">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;">
                <div>
                    <h1 style="font-size:1.5rem;font-weight:700;letter-spacing:-0.02em;">Municipalities</h1>
                    <p style="font-size:0.875rem;color:var(--muted-foreground);">Manage Surigao del Norte municipalities and cities</p>
                </div>
                <button class="btn btn-default" onclick="openModal('municipality', 'create')">+ Add Municipality</button>
            </div>

            <div class="card card-p">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Municipality Name</th>
                                <th>Disasters Recorded</th>
                                <th>Evacuation Centers</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${db.municipalities
                                .map((m) => {
                                    const dCount = db.disasters.filter((d) => Number(d.municipality_id) === Number(m.id)).length;
                                    const cCount = db.evacuation_centers.filter((c) => Number(c.municipality_id) === Number(m.id)).length;
                                    return `
                                        <tr>
                                            <td style="font-weight:600;">${escapeHtml(m.municipality_name)}</td>
                                            <td>${dCount}</td>
                                            <td>${cCount}</td>
                                            <td>
                                                <div style="display:flex;gap:0.35rem;">
                                                    <button class="btn btn-outline btn-sm" onclick="openModal('municipality', 'edit', ${m.id})">Edit</button>
                                                    <button class="btn btn-destructive btn-sm" onclick="deleteRecord('municipality', ${m.id})">Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                })
                                .join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function renderPdrrmoTypesPage() {
    return `
        <div style="display:flex;flex-direction:column;gap:1.25rem;">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;">
                <div>
                    <h1 style="font-size:1.5rem;font-weight:700;letter-spacing:-0.02em;">Disaster Types</h1>
                    <p style="font-size:0.875rem;color:var(--muted-foreground);">Manage natural hazard classifications</p>
                </div>
                <button class="btn btn-default" onclick="openModal('type', 'create')">+ Add Disaster Type</button>
            </div>

            <div class="card card-p">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Type Name</th>
                                <th>Description</th>
                                <th>Linked Disasters</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${db.disaster_types
                                .map((t) => {
                                    const dCount = db.disasters.filter((d) => Number(d.disaster_type_id) === Number(t.id)).length;
                                    return `
                                        <tr>
                                            <td style="font-weight:600;">${escapeHtml(t.type_name)}</td>
                                            <td style="color:var(--muted-foreground);">${escapeHtml(t.description || '—')}</td>
                                            <td>${dCount}</td>
                                            <td>
                                                <div style="display:flex;gap:0.35rem;">
                                                    <button class="btn btn-outline btn-sm" onclick="openModal('type', 'edit', ${t.id})">Edit</button>
                                                    <button class="btn btn-destructive btn-sm" onclick="deleteRecord('type', ${t.id})">Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                })
                                .join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

function renderPdrrmoAccessLogsPage() {
    return `
        <div style="display:flex;flex-direction:column;gap:1.25rem;">
            <div>
                <h1 style="font-size:1.5rem;font-weight:700;letter-spacing:-0.02em;">Access Logs</h1>
                <p style="font-size:0.875rem;color:var(--muted-foreground);">Audit trail of user logins, logouts, and anonymous guest visits</p>
            </div>

            <div class="card card-p">
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>User / Visitor</th>
                                <th>Event Type</th>
                                <th>IP Address</th>
                                <th>Accessed At</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${db.access_logs
                                .map((log) => {
                                    const u = getUserRecord(log.user_id);
                                    return `
                                        <tr>
                                            <td>
                                                <div style="font-weight:600;">${escapeHtml(u ? u.full_name : 'Anonymous Guest')}</div>
                                                <div style="font-size:0.75rem;color:var(--muted-foreground);">
                                                    ${u ? escapeHtml(u.email) : 'Unauthenticated visitor'}
                                                </div>
                                            </td>
                                            <td><span class="badge ${log.event_type === 'LOGIN' ? 'badge-default' : 'badge-secondary'}">${escapeHtml(log.event_type)}</span></td>
                                            <td><code style="background:var(--muted);padding:0.15rem 0.45rem;border-radius:4px;font-size:0.76rem;">${escapeHtml(log.ip_address)}</code></td>
                                            <td style="font-size:0.82rem;color:var(--muted-foreground);">${escapeHtml(log.accessed_at)}</td>
                                        </tr>
                                    `;
                                })
                                .join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

// ==========================================================================
// GUEST Pages (Dashboard.vue, Disasters, Evacuation Centers)
// ==========================================================================
function renderGuestDashboardPage() {
    const activeDisasters = db.disasters.filter((d) => d.status === 'Active' || d.status === 'Monitoring').length;
    const criticalDisasters = db.disasters.filter((d) => (d.status === 'Active' || d.status === 'Monitoring') && (d.severity === 'Critical' || d.severity === 'High')).length;
    const openCenters = db.evacuation_centers.filter((c) => c.status === 'Open').length;
    const totalOccupancy = db.evacuation_centers.reduce((s, c) => s + Number(c.current_occupancy || 0), 0);
    const totalCapacity = db.evacuation_centers.reduce((s, c) => s + Number(c.capacity || 0), 0);
    const availableSlots = Math.max(0, totalCapacity - totalOccupancy);

    return `
        <div style="display:flex;flex-direction:column;gap:1.5rem;">
            <div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:1rem;">
                <div>
                    <h1 style="font-size:1.5rem;font-weight:700;letter-spacing:-0.02em;">Guest Dashboard</h1>
                    <p style="font-size:0.875rem;color:var(--muted-foreground);">
                        Public overview of Surigao del Norte natural disaster alerts and evacuation center availability
                    </p>
                </div>
                <button class="btn btn-default" onclick="switchTab('guest-map')">
                    &#128205; Open Disaster &amp; Evacuation Map
                </button>
            </div>

            <div class="grid-kpi-3">
                <div class="card card-p">
                    <div style="font-size:0.82rem;color:var(--muted-foreground);">Recorded Disasters</div>
                    <div style="font-size:1.65rem;font-weight:700;margin:0.25rem 0;">${db.disasters.length.toLocaleString()}</div>
                    ${
                        criticalDisasters > 0
                            ? `<span class="badge badge-destructive">${criticalDisasters} High / Critical active</span>`
                            : `<div style="font-size:0.75rem;color:var(--muted-foreground);">${activeDisasters} currently active or monitored</div>`
                    }
                </div>

                <div class="card card-p">
                    <div style="font-size:0.82rem;color:var(--muted-foreground);">Evacuation Centers</div>
                    <div style="font-size:1.65rem;font-weight:700;margin:0.25rem 0;">${db.evacuation_centers.length.toLocaleString()}</div>
                    <div style="font-size:0.75rem;color:var(--muted-foreground);">${openCenters} open shelters available</div>
                </div>

                <div class="card card-p">
                    <div style="font-size:0.82rem;color:var(--muted-foreground);">Available Shelter Slots</div>
                    <div style="font-size:1.65rem;font-weight:700;margin:0.25rem 0;">${availableSlots.toLocaleString()}</div>
                    <div style="font-size:0.75rem;color:var(--muted-foreground);">${totalOccupancy.toLocaleString()} occupied out of ${totalCapacity.toLocaleString()} capacity</div>
                </div>

                <div class="card card-p">
                    <div style="font-size:0.82rem;color:var(--muted-foreground);">Published Advisories</div>
                    <div style="font-size:1.65rem;font-weight:700;margin:0.25rem 0;">${db.disaster_updates.length.toLocaleString()}</div>
                    <div style="font-size:0.75rem;color:var(--muted-foreground);">Official PDRRMO situation updates</div>
                </div>

                <div class="card card-p">
                    <div style="font-size:0.82rem;color:var(--muted-foreground);">Active / Monitoring Alerts</div>
                    <div style="font-size:1.65rem;font-weight:700;margin:0.25rem 0;">${activeDisasters.toLocaleString()}</div>
                    <span class="badge badge-default">Stay alert &amp; follow advisories</span>
                </div>

                <div class="card card-p">
                    <div style="font-size:0.82rem;color:var(--muted-foreground);">Municipalities Covered</div>
                    <div style="font-size:1.65rem;font-weight:700;margin:0.25rem 0;">${db.municipalities.length.toLocaleString()}</div>
                    <div style="font-size:0.75rem;color:var(--muted-foreground);">Surigao del Norte cities &amp; municipalities</div>
                </div>
            </div>

            <div class="grid-2-col">
                <div class="card card-p">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">
                        <div>
                            <h3 style="font-size:1rem;font-weight:700;">Recent Disasters</h3>
                            <p style="font-size:0.8rem;color:var(--muted-foreground);">Latest reported disasters across Surigao del Norte</p>
                        </div>
                        <button class="btn btn-outline btn-sm" onclick="switchTab('guest-disasters')">View All</button>
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Disaster</th>
                                    <th>Municipality</th>
                                    <th>Severity</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${db.disasters
                                    .map(
                                        (d) => `
                                    <tr>
                                        <td>
                                            <div style="font-weight:600;">${escapeHtml(d.title)}</div>
                                            <div style="font-size:0.75rem;color:var(--muted-foreground);">
                                                ${escapeHtml(getDisasterTypeName(d.disaster_type_id))} &bull; ${escapeHtml(d.occurred_at)}
                                            </div>
                                        </td>
                                        <td>${escapeHtml(getMunicipalityName(d.municipality_id))}</td>
                                        <td><span class="badge ${severityBadgeClass(d.severity)}">${escapeHtml(d.severity)}</span></td>
                                        <td><span class="badge ${disasterStatusBadgeClass(d.status)}">${escapeHtml(d.status)}</span></td>
                                    </tr>
                                `
                                    )
                                    .join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="card card-p">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">
                        <div>
                            <h3 style="font-size:1rem;font-weight:700;">Evacuation Centers</h3>
                            <p style="font-size:0.8rem;color:var(--muted-foreground);">Shelter locations, occupancy, and available slots</p>
                        </div>
                        <button class="btn btn-outline btn-sm" onclick="switchTab('guest-centers')">Browse Centers</button>
                    </div>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Center Name</th>
                                    <th>Municipality</th>
                                    <th>Occupancy</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${db.evacuation_centers
                                    .map(
                                        (c) => `
                                    <tr>
                                        <td style="font-weight:600;">${escapeHtml(c.center_name)}</td>
                                        <td>${escapeHtml(getMunicipalityName(c.municipality_id))}</td>
                                        <td>${Number(c.current_occupancy).toLocaleString()} / ${Number(c.capacity).toLocaleString()}</td>
                                        <td><span class="badge ${centerStatusBadgeClass(c.status)}">${escapeHtml(c.status)}</span></td>
                                    </tr>
                                `
                                    )
                                    .join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div class="card card-p">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;">
                    <div>
                        <h3 style="font-size:1rem;font-weight:700;">Latest Disaster Updates &amp; Advisories</h3>
                        <p style="font-size:0.8rem;color:var(--muted-foreground);">Recent public bulletins and instructions from PDRRMO</p>
                    </div>
                    <button class="btn btn-outline btn-sm" onclick="switchTab('guest-disasters')">All Updates</button>
                </div>
                <div class="grid-cards-3">
                    ${db.disaster_updates
                        .map((u) => {
                            const d = db.disasters.find((x) => Number(x.id) === Number(u.disaster_id));
                            return `
                                <div style="border:1px solid var(--border);background:rgba(241,245,249,0.4);border-radius:var(--radius-sm);padding:1rem;">
                                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem;">
                                        <span class="badge badge-outline">${escapeHtml(d ? getMunicipalityName(d.municipality_id) : 'Surigao del Norte')}</span>
                                        <span style="font-size:0.75rem;color:var(--muted-foreground);">${escapeHtml(u.published_at || u.created_at)}</span>
                                    </div>
                                    <h4 style="font-size:0.9rem;font-weight:600;margin-bottom:0.35rem;">${escapeHtml(d ? d.title : 'General Advisory')}</h4>
                                    <p style="font-size:0.8rem;color:var(--muted-foreground);line-height:1.5;">${escapeHtml(u.message)}</p>
                                </div>
                            `;
                        })
                        .join('')}
                </div>
            </div>
        </div>
    `;
}

function renderGuestDisastersPage() {
    return `
        <div style="display:flex;flex-direction:column;gap:1.5rem;">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;">
                <div>
                    <h1 style="font-size:1.5rem;font-weight:700;letter-spacing:-0.02em;">Disasters &amp; Updates</h1>
                    <p style="font-size:0.875rem;color:var(--muted-foreground);">Active and historical disaster reports with official PDRRMO situation updates</p>
                </div>
                <button class="btn btn-default btn-sm" onclick="switchTab('guest-map')">View on Disaster Map</button>
            </div>

            <div class="grid-cards-3">
                ${db.disasters
                    .map((d) => {
                        const muniName = getMunicipalityName(d.municipality_id);
                        const typeName = getDisasterTypeName(d.disaster_type_id);
                        const updates = getDisasterUpdates(d.id);
                        return `
                            <div class="card card-p" style="display:flex;flex-direction:column;justify-content:space-between;gap:1rem;">
                                <div>
                                    <div style="display:flex;justify-content:space-between;gap:0.5rem;">
                                        <span class="badge ${severityBadgeClass(d.severity)}">${escapeHtml(d.severity)}</span>
                                        <span class="badge ${disasterStatusBadgeClass(d.status)}">${escapeHtml(d.status)}</span>
                                    </div>
                                    <h3 style="font-size:1.05rem;font-weight:700;margin-top:0.65rem;">${escapeHtml(d.title)}</h3>
                                    <p style="font-size:0.8rem;color:var(--muted-foreground);">
                                        ${escapeHtml(typeName)} &bull; ${escapeHtml(muniName)} &bull; ${escapeHtml(d.occurred_at)}
                                    </p>
                                    <p style="font-size:0.85rem;margin-top:0.65rem;line-height:1.5;">
                                        ${escapeHtml(d.description)}
                                    </p>
                                </div>

                                <div style="border-top:1px solid var(--border);padding-top:0.75rem;">
                                    <div style="font-size:0.74rem;font-weight:600;color:var(--muted-foreground);margin-bottom:0.45rem;">
                                        Published Advisories (${updates.length})
                                    </div>
                                    ${
                                        updates.length > 0
                                            ? updates
                                                  .map(
                                                      (u) => `
                                                <div style="background:var(--muted);padding:0.55rem;border-radius:6px;font-size:0.78rem;margin-bottom:0.35rem;">
                                                    <div style="font-size:0.7rem;color:var(--muted-foreground);">${escapeHtml(u.published_at)}</div>
                                                    <div>${escapeHtml(u.message)}</div>
                                                </div>
                                            `
                                                  )
                                                  .join('')
                                            : `<div style="font-size:0.76rem;color:var(--muted-foreground);">No updates published yet.</div>`
                                    }
                                </div>
                            </div>
                        `;
                    })
                    .join('')}
            </div>
        </div>
    `;
}

function renderGuestCentersPage() {
    return `
        <div style="display:flex;flex-direction:column;gap:1.5rem;">
            <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;">
                <div>
                    <h1 style="font-size:1.5rem;font-weight:700;letter-spacing:-0.02em;">Evacuation Centers</h1>
                    <p style="font-size:0.875rem;color:var(--muted-foreground);">Designated evacuation centers, facility images, capacities, and current occupancy</p>
                </div>
                <button class="btn btn-default btn-sm" onclick="switchTab('guest-map')">Locate Shelters on Map</button>
            </div>

            <div class="grid-cards-3">
                ${db.evacuation_centers
                    .map((c) => {
                        const muniName = getMunicipalityName(c.municipality_id);
                        const pct = occupancyPercent(c);
                        return `
                            <div class="card" style="overflow:hidden;">
                                ${
                                    c.image
                                        ? `<img src="${escapeHtml(c.image)}" alt="${escapeHtml(c.center_name)}" style="height:175px;width:100%;object-fit:cover;border-bottom:1px solid var(--border);" onerror="this.style.display='none'" />`
                                        : ''
                                }
                                <div class="card-p">
                                    <div style="display:flex;justify-content:space-between;gap:0.5rem;">
                                        <span class="badge badge-secondary">${escapeHtml(muniName)}</span>
                                        <span class="badge ${centerStatusBadgeClass(c.status)}">${escapeHtml(c.status)}</span>
                                    </div>
                                    <h3 style="font-size:1.05rem;font-weight:700;margin-top:0.65rem;">${escapeHtml(c.center_name)}</h3>
                                    <p style="font-size:0.82rem;color:var(--muted-foreground);margin-top:0.2rem;">
                                        ${escapeHtml(c.address)}
                                    </p>

                                    <div style="margin-top:0.9rem;background:var(--muted);padding:0.7rem;border-radius:var(--radius-sm);">
                                        <div style="display:flex;justify-content:space-between;font-size:0.78rem;margin-bottom:0.35rem;">
                                            <span>Occupancy</span>
                                            <strong>${Number(c.current_occupancy).toLocaleString()} / ${Number(c.capacity).toLocaleString()} persons (${pct}%)</strong>
                                        </div>
                                        <div style="height:7px;background:#cbd5e1;border-radius:9999px;overflow:hidden;">
                                            <div style="height:100%;width:${pct}%;background:var(--primary);"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `;
                    })
                    .join('')}
            </div>
        </div>
    `;
}

// ==========================================================================
// Profile Settings Page (Matches settings/Profile.vue)
// ==========================================================================
function renderProfileSettingsPage() {
    const u = state.currentUser;
    return `
        <div style="max-width:780px;display:flex;flex-direction:column;gap:1.5rem;">
            <div>
                <h1 style="font-size:1.5rem;font-weight:700;letter-spacing:-0.02em;">Profile settings</h1>
                <p style="font-size:0.875rem;color:var(--muted-foreground);">Manage your profile information, contact details, and address</p>
            </div>

            <div class="card card-p">
                <div style="display:flex;align-items:center;gap:1rem;padding-bottom:1rem;margin-bottom:1rem;border-bottom:1px solid var(--border);">
                    <div class="avatar-circle" style="width:52px;height:52px;font-size:1.1rem;background:var(--primary);color:#fff;">
                        ${escapeHtml(getInitials(u.full_name))}
                    </div>
                    <div>
                        <div style="display:flex;align-items:center;gap:0.5rem;">
                            <h3 style="font-size:1.1rem;font-weight:700;">${escapeHtml(u.full_name)}</h3>
                            <span class="badge badge-default">${escapeHtml(u.role)}</span>
                        </div>
                        <p style="font-size:0.82rem;color:var(--muted-foreground);">${escapeHtml(u.email)}</p>
                    </div>
                </div>

                <form onsubmit="handleProfileSave(event)">
                    <div class="field-row">
                        <div class="field">
                            <label class="label">Full Name</label>
                            <input id="prof-name" class="input" value="${escapeHtml(u.full_name)}" required />
                        </div>
                        <div class="field">
                            <label class="label">Email address</label>
                            <input id="prof-email" type="email" class="input" value="${escapeHtml(u.email)}" required />
                        </div>
                    </div>
                    <div class="field-row">
                        <div class="field">
                            <label class="label">Contact Number</label>
                            <input id="prof-contact" class="input" value="${escapeHtml(u.contact_number || '')}" placeholder="09XX-XXX-XXXX" />
                        </div>
                        <div class="field">
                            <label class="label">Full Address</label>
                            <input id="prof-address" class="input" value="${escapeHtml(u.full_address || '')}" placeholder="Barangay, Municipality, Surigao del Norte" />
                        </div>
                    </div>
                    <button type="submit" class="btn btn-default">Save</button>
                </form>
            </div>
        </div>
    `;
}

function handleProfileSave(e) {
    e.preventDefault();
    const u = db.users.find((x) => Number(x.id) === Number(state.currentUser.id));
    if (!u) return;

    u.full_name = document.getElementById('prof-name').value.trim();
    u.email = document.getElementById('prof-email').value.trim();
    u.contact_number = document.getElementById('prof-contact').value.trim() || null;
    u.full_address = document.getElementById('prof-address').value.trim() || null;
    u.updated_at = formatNow();

    saveDB(db);
    state.currentUser = u;
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(u));
    renderApp();
}

// ==========================================================================
// CRUD Modal Dialogs (With Interactive Leaflet Pin Picker)
// ==========================================================================
function openModal(type, mode, recordId = null) {
    state.modal = { type, mode, recordId };
    renderApp();
    setTimeout(() => {
        if (type === 'disaster' || type === 'center') {
            mountModalPickerMap();
        }
    }, 80);
}

function closeModal() {
    if (pickerMap) {
        pickerMap.remove();
        pickerMap = null;
    }
    state.modal = null;
    renderApp();
}

function renderModalHtml() {
    if (!state.modal) return '';
    const { type, mode, recordId } = state.modal;

    let title = '';
    let bodyHtml = '';

    if (type === 'disaster') {
        const rec = mode === 'edit' ? db.disasters.find((x) => Number(x.id) === Number(recordId)) : null;
        title = mode === 'edit' ? 'Edit Disaster' : 'Add Disaster';
        const muniOpts = db.municipalities
            .map((m) => `<option value="${m.id}" ${rec && Number(rec.municipality_id) === Number(m.id) ? 'selected' : ''}>${escapeHtml(m.municipality_name)}</option>`)
            .join('');
        const typeOpts = db.disaster_types
            .map((t) => `<option value="${t.id}" ${rec && Number(rec.disaster_type_id) === Number(t.id) ? 'selected' : ''}>${escapeHtml(t.type_name)}</option>`)
            .join('');

        bodyHtml = `
            <form onsubmit="saveModalForm(event)">
                <div class="field">
                    <label class="label">Title</label>
                    <input id="m-title" class="input" value="${escapeHtml(rec ? rec.title : '')}" required />
                </div>
                <div class="field-row">
                    <div class="field">
                        <label class="label">Municipality</label>
                        <select id="m-muni" class="select" onchange="centerPickerOnMunicipality(this.value)" required>${muniOpts}</select>
                    </div>
                    <div class="field">
                        <label class="label">Disaster Type</label>
                        <select id="m-type" class="select" required>${typeOpts}</select>
                    </div>
                </div>
                <div class="field-row">
                    <div class="field">
                        <label class="label">Severity</label>
                        <select id="m-severity" class="select">
                            ${['Low', 'Moderate', 'High', 'Critical']
                                .map((s) => `<option value="${s}" ${rec && rec.severity === s ? 'selected' : ''}>${s}</option>`)
                                .join('')}
                        </select>
                    </div>
                    <div class="field">
                        <label class="label">Status</label>
                        <select id="m-status" class="select">
                            ${['Active', 'Monitoring', 'Contained', 'Resolved']
                                .map((s) => `<option value="${s}" ${rec && rec.status === s ? 'selected' : ''}>${s}</option>`)
                                .join('')}
                        </select>
                    </div>
                </div>
                <div class="field">
                    <label class="label">Occurred At</label>
                    <input id="m-occurred" type="text" class="input" value="${escapeHtml(rec ? rec.occurred_at : formatNow().slice(0, 16))}" required />
                </div>
                <div class="field-row">
                    <div class="field">
                        <label class="label">Latitude</label>
                        <input id="m-lat" type="number" step="any" class="input" value="${rec && rec.latitude !== null ? rec.latitude : '9.7844'}" />
                    </div>
                    <div class="field">
                        <label class="label">Longitude</label>
                        <input id="m-lng" type="number" step="any" class="input" value="${rec && rec.longitude !== null ? rec.longitude : '125.4950'}" />
                    </div>
                </div>
                <div class="field">
                    <label class="label">Pin Location on Map (click to set coordinates)</label>
                    <div id="modal-picker-map" class="picker-map-box"></div>
                </div>
                <div class="field">
                    <label class="label">Description</label>
                    <textarea id="m-desc" rows="3" class="textarea" required>${escapeHtml(rec ? rec.description : '')}</textarea>
                </div>
                <div style="display:flex;justify-content:flex-end;gap:0.5rem;">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-default">Save</button>
                </div>
            </form>
        `;
    } else if (type === 'center') {
        const rec = mode === 'edit' ? db.evacuation_centers.find((x) => Number(x.id) === Number(recordId)) : null;
        title = mode === 'edit' ? 'Edit Evacuation Center' : 'Add Evacuation Center';
        const muniOpts = db.municipalities
            .map((m) => `<option value="${m.id}" ${rec && Number(rec.municipality_id) === Number(m.id) ? 'selected' : ''}>${escapeHtml(m.municipality_name)}</option>`)
            .join('');

        bodyHtml = `
            <form onsubmit="saveModalForm(event)">
                <div class="field">
                    <label class="label">Center Name</label>
                    <input id="m-name" class="input" value="${escapeHtml(rec ? rec.center_name : '')}" required />
                </div>
                <div class="field-row">
                    <div class="field">
                        <label class="label">Municipality</label>
                        <select id="m-muni" class="select" onchange="centerPickerOnMunicipality(this.value)" required>${muniOpts}</select>
                    </div>
                    <div class="field">
                        <label class="label">Status</label>
                        <select id="m-status" class="select">
                            ${['Open', 'Full', 'Closed', 'Maintenance']
                                .map((s) => `<option value="${s}" ${rec && rec.status === s ? 'selected' : ''}>${s}</option>`)
                                .join('')}
                        </select>
                    </div>
                </div>
                <div class="field">
                    <label class="label">Address</label>
                    <input id="m-address" class="input" value="${escapeHtml(rec ? rec.address : '')}" required />
                </div>
                <div class="field-row">
                    <div class="field">
                        <label class="label">Capacity</label>
                        <input id="m-cap" type="number" min="1" class="input" value="${rec ? rec.capacity : 300}" required />
                    </div>
                    <div class="field">
                        <label class="label">Current Occupancy</label>
                        <input id="m-occ" type="number" min="0" class="input" value="${rec ? rec.current_occupancy : 0}" required />
                    </div>
                </div>
                <div class="field">
                    <label class="label">Facility Image URL</label>
                    <input id="m-image" class="input" placeholder="https://..." value="${escapeHtml(rec && rec.image ? rec.image : '')}" />
                </div>
                <div class="field-row">
                    <div class="field">
                        <label class="label">Latitude</label>
                        <input id="m-lat" type="number" step="any" class="input" value="${rec && rec.latitude !== null ? rec.latitude : '9.7844'}" />
                    </div>
                    <div class="field">
                        <label class="label">Longitude</label>
                        <input id="m-lng" type="number" step="any" class="input" value="${rec && rec.longitude !== null ? rec.longitude : '125.4950'}" />
                    </div>
                </div>
                <div class="field">
                    <label class="label">Pin Location on Map (click to set coordinates)</label>
                    <div id="modal-picker-map" class="picker-map-box"></div>
                </div>
                <div style="display:flex;justify-content:flex-end;gap:0.5rem;">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-default">Save</button>
                </div>
            </form>
        `;
    } else if (type === 'update') {
        const rec = mode === 'edit' ? db.disaster_updates.find((x) => Number(x.id) === Number(recordId)) : null;
        title = mode === 'edit' ? 'Edit Disaster Update' : 'Publish Disaster Update';
        const disOpts = db.disasters
            .map((d) => `<option value="${d.id}" ${rec && Number(rec.disaster_id) === Number(d.id) ? 'selected' : ''}>${escapeHtml(d.title)}</option>`)
            .join('');

        bodyHtml = `
            <form onsubmit="saveModalForm(event)">
                <div class="field">
                    <label class="label">Disaster</label>
                    <select id="m-disaster" class="select" required>${disOpts}</select>
                </div>
                <div class="field">
                    <label class="label">Published At</label>
                    <input id="m-pub" class="input" value="${escapeHtml(rec ? rec.published_at : formatNow().slice(0, 16))}" />
                </div>
                <div class="field">
                    <label class="label">Message</label>
                    <textarea id="m-msg" rows="4" class="textarea" required>${escapeHtml(rec ? rec.message : '')}</textarea>
                </div>
                <div style="display:flex;justify-content:flex-end;gap:0.5rem;">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-default">Save</button>
                </div>
            </form>
        `;
    } else if (type === 'municipality') {
        const rec = mode === 'edit' ? db.municipalities.find((x) => Number(x.id) === Number(recordId)) : null;
        title = mode === 'edit' ? 'Edit Municipality' : 'Add Municipality';
        bodyHtml = `
            <form onsubmit="saveModalForm(event)">
                <div class="field">
                    <label class="label">Municipality Name</label>
                    <input id="m-muni-name" class="input" value="${escapeHtml(rec ? rec.municipality_name : '')}" required />
                </div>
                <div style="display:flex;justify-content:flex-end;gap:0.5rem;">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-default">Save</button>
                </div>
            </form>
        `;
    } else if (type === 'type') {
        const rec = mode === 'edit' ? db.disaster_types.find((x) => Number(x.id) === Number(recordId)) : null;
        title = mode === 'edit' ? 'Edit Disaster Type' : 'Add Disaster Type';
        bodyHtml = `
            <form onsubmit="saveModalForm(event)">
                <div class="field">
                    <label class="label">Type Name</label>
                    <input id="m-type-name" class="input" value="${escapeHtml(rec ? rec.type_name : '')}" required />
                </div>
                <div class="field">
                    <label class="label">Description</label>
                    <textarea id="m-type-desc" rows="3" class="textarea">${escapeHtml(rec && rec.description ? rec.description : '')}</textarea>
                </div>
                <div style="display:flex;justify-content:flex-end;gap:0.5rem;">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-default">Save</button>
                </div>
            </form>
        `;
    } else if (type === 'user') {
        const rec = mode === 'edit' ? db.users.find((x) => Number(x.id) === Number(recordId)) : null;
        title = mode === 'edit' ? 'Edit User' : 'Add User';
        bodyHtml = `
            <form onsubmit="saveModalForm(event)">
                <div class="field">
                    <label class="label">Full Name</label>
                    <input id="m-u-name" class="input" value="${escapeHtml(rec ? rec.full_name : '')}" required />
                </div>
                <div class="field-row">
                    <div class="field">
                        <label class="label">Email</label>
                        <input id="m-u-email" type="email" class="input" value="${escapeHtml(rec ? rec.email : '')}" required />
                    </div>
                    <div class="field">
                        <label class="label">Role</label>
                        <select id="m-u-role" class="select">
                            ${['HEAD', 'PDRRMO', 'GUEST']
                                .map((r) => `<option value="${r}" ${rec && rec.role === r ? 'selected' : ''}>${r}</option>`)
                                .join('')}
                        </select>
                    </div>
                </div>
                <div class="field-row">
                    <div class="field">
                        <label class="label">Contact Number</label>
                        <input id="m-u-contact" class="input" value="${escapeHtml(rec && rec.contact_number ? rec.contact_number : '')}" />
                    </div>
                    <div class="field">
                        <label class="label">Password</label>
                        <input id="m-u-pass" type="password" class="input" value="${escapeHtml(rec ? rec.password : 'password')}" required />
                    </div>
                </div>
                <div class="field">
                    <label class="label">Full Address</label>
                    <textarea id="m-u-addr" rows="2" class="textarea">${escapeHtml(rec && rec.full_address ? rec.full_address : '')}</textarea>
                </div>
                <div style="display:flex;justify-content:flex-end;gap:0.5rem;">
                    <button type="button" class="btn btn-outline" onclick="closeModal()">Cancel</button>
                    <button type="submit" class="btn btn-default">Save</button>
                </div>
            </form>
        `;
    }

    return `
        <div class="modal-overlay">
            <div class="modal-dialog">
                <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:0.75rem;margin-bottom:1rem;border-bottom:1px solid var(--border);">
                    <h3 style="font-size:1.1rem;font-weight:700;">${title}</h3>
                    <button type="button" class="btn btn-ghost btn-icon" onclick="closeModal()">&#10005;</button>
                </div>
                ${bodyHtml}
            </div>
        </div>
    `;
}

function mountModalPickerMap() {
    const el = document.getElementById('modal-picker-map');
    if (!el || typeof L === 'undefined') return;

    const latInput = document.getElementById('m-lat');
    const lngInput = document.getElementById('m-lng');
    const initLat = parseFloat(latInput.value) || 9.7844;
    const initLng = parseFloat(lngInput.value) || 125.4950;

    if (pickerMap) {
        pickerMap.remove();
        pickerMap = null;
    }

    pickerMap = L.map(el, { center: [initLat, initLng], zoom: 11 });
    addBaseMapTileLayer(pickerMap);

    pickerMarker = L.marker([initLat, initLng]).addTo(pickerMap);

    pickerMap.on('click', (e) => {
        const { lat, lng } = e.latlng;
        latInput.value = lat.toFixed(6);
        lngInput.value = lng.toFixed(6);
        pickerMarker.setLatLng([lat, lng]);
    });

    setTimeout(() => {
        if (pickerMap) pickerMap.invalidateSize();
    }, 100);
}

function centerPickerOnMunicipality(muniId) {
    const muniName = getMunicipalityName(muniId);
    const coords = MUNICIPALITY_COORDINATES[muniName];
    if (!coords) return;
    const latInput = document.getElementById('m-lat');
    const lngInput = document.getElementById('m-lng');
    if (latInput && lngInput) {
        latInput.value = coords[0].toFixed(6);
        lngInput.value = coords[1].toFixed(6);
    }
    if (pickerMap && pickerMarker) {
        pickerMap.flyTo(coords, 12, { duration: 0.6 });
        pickerMarker.setLatLng(coords);
    }
}

function saveModalForm(e) {
    e.preventDefault();
    if (!state.modal) return;
    const { type, mode, recordId } = state.modal;
    const now = formatNow();

    if (type === 'disaster') {
        const payload = {
            municipality_id: Number(document.getElementById('m-muni').value),
            disaster_type_id: Number(document.getElementById('m-type').value),
            created_by: state.currentUser ? state.currentUser.id : 3,
            title: document.getElementById('m-title').value.trim(),
            description: document.getElementById('m-desc').value.trim(),
            latitude: document.getElementById('m-lat').value !== '' ? parseFloat(document.getElementById('m-lat').value) : null,
            longitude: document.getElementById('m-lng').value !== '' ? parseFloat(document.getElementById('m-lng').value) : null,
            occurred_at: document.getElementById('m-occurred').value.trim(),
            severity: document.getElementById('m-severity').value,
            status: document.getElementById('m-status').value,
            updated_at: now,
        };

        if (mode === 'edit') {
            const idx = db.disasters.findIndex((x) => Number(x.id) === Number(recordId));
            if (idx !== -1) db.disasters[idx] = { ...db.disasters[idx], ...payload };
        } else {
            const nextId = db.disasters.length > 0 ? Math.max(...db.disasters.map((x) => x.id)) + 1 : 1;
            db.disasters.unshift({ id: nextId, ...payload, created_at: now });
        }
    } else if (type === 'center') {
        const payload = {
            municipality_id: Number(document.getElementById('m-muni').value),
            created_by: state.currentUser ? state.currentUser.id : 3,
            center_name: document.getElementById('m-name').value.trim(),
            address: document.getElementById('m-address').value.trim(),
            image: document.getElementById('m-image').value.trim() || null,
            latitude: document.getElementById('m-lat').value !== '' ? parseFloat(document.getElementById('m-lat').value) : null,
            longitude: document.getElementById('m-lng').value !== '' ? parseFloat(document.getElementById('m-lng').value) : null,
            capacity: Number(document.getElementById('m-cap').value),
            current_occupancy: Number(document.getElementById('m-occ').value),
            status: document.getElementById('m-status').value,
            updated_at: now,
        };

        if (mode === 'edit') {
            const idx = db.evacuation_centers.findIndex((x) => Number(x.id) === Number(recordId));
            if (idx !== -1) db.evacuation_centers[idx] = { ...db.evacuation_centers[idx], ...payload };
        } else {
            const nextId = db.evacuation_centers.length > 0 ? Math.max(...db.evacuation_centers.map((x) => x.id)) + 1 : 1;
            db.evacuation_centers.unshift({ id: nextId, ...payload, created_at: now });
        }
    } else if (type === 'update') {
        const payload = {
            disaster_id: Number(document.getElementById('m-disaster').value),
            created_by: state.currentUser ? state.currentUser.id : 3,
            message: document.getElementById('m-msg').value.trim(),
            published_at: document.getElementById('m-pub').value.trim() || now,
            updated_at: now,
        };

        if (mode === 'edit') {
            const idx = db.disaster_updates.findIndex((x) => Number(x.id) === Number(recordId));
            if (idx !== -1) db.disaster_updates[idx] = { ...db.disaster_updates[idx], ...payload };
        } else {
            const nextId = db.disaster_updates.length > 0 ? Math.max(...db.disaster_updates.map((x) => x.id)) + 1 : 1;
            db.disaster_updates.unshift({ id: nextId, ...payload, created_at: now });
        }
    } else if (type === 'municipality') {
        const name = document.getElementById('m-muni-name').value.trim();
        if (mode === 'edit') {
            const idx = db.municipalities.findIndex((x) => Number(x.id) === Number(recordId));
            if (idx !== -1) db.municipalities[idx].municipality_name = name;
        } else {
            const nextId = db.municipalities.length > 0 ? Math.max(...db.municipalities.map((x) => x.id)) + 1 : 1;
            db.municipalities.push({ id: nextId, municipality_name: name, created_at: now, updated_at: now });
        }
    } else if (type === 'type') {
        const name = document.getElementById('m-type-name').value.trim();
        const desc = document.getElementById('m-type-desc').value.trim() || null;
        if (mode === 'edit') {
            const idx = db.disaster_types.findIndex((x) => Number(x.id) === Number(recordId));
            if (idx !== -1) {
                db.disaster_types[idx].type_name = name;
                db.disaster_types[idx].description = desc;
            }
        } else {
            const nextId = db.disaster_types.length > 0 ? Math.max(...db.disaster_types.map((x) => x.id)) + 1 : 1;
            db.disaster_types.push({ id: nextId, type_name: name, description: desc, created_at: now, updated_at: now });
        }
    } else if (type === 'user') {
        const payload = {
            full_name: document.getElementById('m-u-name').value.trim(),
            email: document.getElementById('m-u-email').value.trim(),
            role: document.getElementById('m-u-role').value,
            contact_number: document.getElementById('m-u-contact').value.trim() || null,
            password: document.getElementById('m-u-pass').value,
            full_address: document.getElementById('m-u-addr').value.trim() || null,
            updated_at: now,
        };

        if (mode === 'edit') {
            const idx = db.users.findIndex((x) => Number(x.id) === Number(recordId));
            if (idx !== -1) db.users[idx] = { ...db.users[idx], ...payload };
        } else {
            const nextId = db.users.length > 0 ? Math.max(...db.users.map((x) => x.id)) + 1 : 1;
            db.users.push({ id: nextId, ...payload, is_protected: false, created_at: now });
        }
    }

    saveDB(db);
    closeModal();
}

function deleteRecord(type, id) {
    if (!confirm('Are you sure you want to delete this record?')) return;

    if (type === 'disaster') {
        db.disasters = db.disasters.filter((x) => Number(x.id) !== Number(id));
        db.disaster_updates = db.disaster_updates.filter((u) => Number(u.disaster_id) !== Number(id));
    } else if (type === 'center') {
        db.evacuation_centers = db.evacuation_centers.filter((x) => Number(x.id) !== Number(id));
    } else if (type === 'update') {
        db.disaster_updates = db.disaster_updates.filter((x) => Number(x.id) !== Number(id));
    } else if (type === 'municipality') {
        db.municipalities = db.municipalities.filter((x) => Number(x.id) !== Number(id));
    } else if (type === 'type') {
        db.disaster_types = db.disaster_types.filter((x) => Number(x.id) !== Number(id));
    } else if (type === 'user') {
        db.users = db.users.filter((x) => Number(x.id) !== Number(id));
    }

    saveDB(db);
    renderApp();
}

function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// ==========================================================================
// Main Render Function
// ==========================================================================
function renderApp() {
    const root = document.getElementById('app-root');
    if (!root) return;

    if (state.view === 'welcome') {
        root.innerHTML = renderWelcomeView();
    } else if (state.view === 'login') {
        root.innerHTML = renderLoginView();
    } else if (state.view === 'register') {
        root.innerHTML = renderRegisterView();
    } else if (state.view === 'portal') {
        root.innerHTML = renderPortalView();
    }

    if (document.getElementById('gis-map-canvas')) {
        mountLeafletGISMap();
    }
}

window.addEventListener('DOMContentLoaded', initApp);

