/* ==========================================================================
   SDN-NDIS — Database Schema & Seed Data (Matching noted.txt 100%)
   Tables:
     1. USERS
     2. MUNICIPALITIES
     3. DISASTER_TYPES
     4. DISASTERS
     5. EVACUATION_CENTERS
     6. DISASTER_UPDATES
     7. ACCESS_LOGS
   ========================================================================== */

const STORAGE_KEY = 'SDN_NDIS_DATABASE_V1';
const SESSION_KEY = 'SDN_NDIS_CURRENT_USER_V1';
const GUEST_LOGGED_KEY = 'SDN_NDIS_GUEST_VISIT_LOGGED';

// Surigao del Norte 21 Municipality Coordinates (Fallback & Map Centering)
const MUNICIPALITY_COORDINATES = {
    'Surigao City': [9.78440000, 125.49500000],
    'Alegria': [9.46860000, 125.57690000],
    'Bacuag': [9.60830000, 125.63780000],
    'Burgos': [10.02110000, 126.07360000],
    'Claver': [9.57250000, 125.73310000],
    'Dapa': [9.75940000, 126.05310000],
    'Del Carmen': [9.86940000, 125.97080000],
    'General Luna': [9.78250000, 126.15580000],
    'Gigaquit': [9.59580000, 125.69750000],
    'Mainit': [9.53720000, 125.52310000],
    'Malimono': [9.61940000, 125.40280000],
    'Pilar': [9.86500000, 126.09890000],
    'Placer': [9.65420000, 125.60250000],
    'San Benito': [9.95750000, 126.00560000],
    'San Francisco (Anao-Aon)': [9.71360000, 125.43060000],
    'San Isidro': [9.93670000, 126.08580000],
    'Santa Monica (Sapao)': [10.01970000, 126.03810000],
    'Sison': [9.66170000, 125.52940000],
    'Socorro': [9.62140000, 125.96670000],
    'Tagana-an': [9.69720000, 125.58190000],
    'Tubod': [9.56670000, 125.56670000],
};

function getInitialSeedDatabase() {
    const now = '2026-11-04 09:00:00';

    return {
        // 1. USERS
        users: [
            {
                id: 1,
                full_name: 'Head Executive',
                email: 'head@gmail.com',
                password: 'password',
                full_address: 'Capitol Compound, Washington, Surigao City, Surigao del Norte',
                contact_number: '0917-100-2001',
                role: 'HEAD',
                is_protected: true,
                created_at: now,
                updated_at: now,
            },
            {
                id: 2,
                full_name: 'Rico Adolfo',
                email: 'ricoadolfo@gmail.com',
                password: 'password',
                full_address: 'Brgy. Taft, Surigao City, Surigao del Norte',
                contact_number: '0917-555-0192',
                role: 'HEAD',
                is_protected: true,
                created_at: now,
                updated_at: now,
            },
            {
                id: 3,
                full_name: 'PDRRMO Command Officer',
                email: 'pdrrmo@gmail.com',
                password: 'password',
                full_address: 'PDRRMO Operations Center, Surigao City, Surigao del Norte',
                contact_number: '0918-888-9111',
                role: 'PDRRMO',
                is_protected: false,
                created_at: now,
                updated_at: now,
            },
            {
                id: 4,
                full_name: 'Juan Dela Cruz (Citizen)',
                email: 'guest@gmail.com',
                password: 'password',
                full_address: 'Poblacion, Dapa, Siargao Island, Surigao del Norte',
                contact_number: '0999-321-4567',
                role: 'GUEST',
                is_protected: false,
                created_at: now,
                updated_at: now,
            },
        ],

        // 2. MUNICIPALITIES (21 LGUs in Surigao del Norte)
        municipalities: [
            { id: 1, municipality_name: 'Surigao City', created_at: now, updated_at: now },
            { id: 2, municipality_name: 'Alegria', created_at: now, updated_at: now },
            { id: 3, municipality_name: 'Bacuag', created_at: now, updated_at: now },
            { id: 4, municipality_name: 'Burgos', created_at: now, updated_at: now },
            { id: 5, municipality_name: 'Claver', created_at: now, updated_at: now },
            { id: 6, municipality_name: 'Dapa', created_at: now, updated_at: now },
            { id: 7, municipality_name: 'Del Carmen', created_at: now, updated_at: now },
            { id: 8, municipality_name: 'General Luna', created_at: now, updated_at: now },
            { id: 9, municipality_name: 'Gigaquit', created_at: now, updated_at: now },
            { id: 10, municipality_name: 'Mainit', created_at: now, updated_at: now },
            { id: 11, municipality_name: 'Malimono', created_at: now, updated_at: now },
            { id: 12, municipality_name: 'Pilar', created_at: now, updated_at: now },
            { id: 13, municipality_name: 'Placer', created_at: now, updated_at: now },
            { id: 14, municipality_name: 'San Benito', created_at: now, updated_at: now },
            { id: 15, municipality_name: 'San Francisco (Anao-Aon)', created_at: now, updated_at: now },
            { id: 16, municipality_name: 'San Isidro', created_at: now, updated_at: now },
            { id: 17, municipality_name: 'Santa Monica (Sapao)', created_at: now, updated_at: now },
            { id: 18, municipality_name: 'Sison', created_at: now, updated_at: now },
            { id: 19, municipality_name: 'Socorro', created_at: now, updated_at: now },
            { id: 20, municipality_name: 'Tagana-an', created_at: now, updated_at: now },
            { id: 21, municipality_name: 'Tubod', created_at: now, updated_at: now },
        ],

        // 3. DISASTER_TYPES
        disaster_types: [
            { id: 1, type_name: 'Typhoon', description: 'Tropical cyclone bringing strong winds, heavy rainfall, and storm surge.', created_at: now, updated_at: now },
            { id: 2, type_name: 'Flood', description: 'Overflow of water submerging low-lying barangays and river basins.', created_at: now, updated_at: now },
            { id: 3, type_name: 'Earthquake', description: 'Sudden ground shaking along the Philippine Trench or Surigao Fault.', created_at: now, updated_at: now },
            { id: 4, type_name: 'Landslide', description: 'Slope failure and debris flow in mountainous highways and barangays.', created_at: now, updated_at: now },
            { id: 5, type_name: 'Storm Surge', description: 'Abnormal coastal sea level rise during severe weather events.', created_at: now, updated_at: now },
            { id: 6, type_name: 'Tsunami Advisory', description: 'Seismic sea wave hazard affecting coastal municipalities.', created_at: now, updated_at: now },
        ],

        // 4. DISASTERS
        disasters: [
            {
                id: 1,
                municipality_id: 1,
                disaster_type_id: 1,
                created_by: 3,
                title: 'Tropical Cyclone Signal #3 Coastal Impact',
                description: 'Strong gale-force winds and heavy rainfall affecting coastal barangays of Surigao City. Pre-emptive evacuation underway.',
                latitude: 9.78920000,
                longitude: 125.49580000,
                occurred_at: '2026-11-03 14:30',
                severity: 'Critical',
                status: 'Active',
                created_at: now,
                updated_at: now,
            },
            {
                id: 2,
                municipality_id: 10,
                disaster_type_id: 2,
                created_by: 3,
                title: 'Lake Mainit Basin Flash Flooding',
                description: 'Rising water levels along Lake Mainit shoreline submerging agricultural roads and low-lying residential zones.',
                latitude: 9.53720000,
                longitude: 125.52310000,
                occurred_at: '2026-11-03 18:15',
                severity: 'High',
                status: 'Active',
                created_at: now,
                updated_at: now,
            },
            {
                id: 3,
                municipality_id: 8,
                disaster_type_id: 5,
                created_by: 3,
                title: 'General Luna Coastal Storm Surge Warning',
                description: '2.5-meter coastal wave surge along Cloud 9 and Poblacion boulevard. Fishermen advised against sea travel.',
                latitude: 9.78250000,
                longitude: 126.15580000,
                occurred_at: '2026-11-04 06:00',
                severity: 'High',
                status: 'Monitoring',
                created_at: now,
                updated_at: now,
            },
            {
                id: 4,
                municipality_id: 5,
                disaster_type_id: 4,
                created_by: 3,
                title: 'Claver National Highway Slope Landslide',
                description: 'Soil and rockslide along the national highway section following 24 hours of continuous downpour; clearing teams deployed.',
                latitude: 9.57250000,
                longitude: 125.73310000,
                occurred_at: '2026-11-02 21:40',
                severity: 'Moderate',
                status: 'Contained',
                created_at: now,
                updated_at: now,
            },
        ],

        // 5. EVACUATION_CENTERS
        evacuation_centers: [
            {
                id: 1,
                municipality_id: 1,
                created_by: 3,
                center_name: 'Surigao del Norte Provincial Gymnasium',
                address: 'Capitol Road, Brgy. Washington, Surigao City',
                image: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=800&q=80',
                latitude: 9.78560000,
                longitude: 125.49120000,
                capacity: 500,
                current_occupancy: 310,
                status: 'Open',
                created_at: now,
                updated_at: now,
            },
            {
                id: 2,
                municipality_id: 6,
                created_by: 3,
                center_name: 'Dapa Municipal Evacuation & Multi-Purpose Center',
                address: 'Brgy. Poblacion 12, Dapa, Siargao Island',
                image: 'https://images.unsplash.com/photo-1541888946425-d09bb18086f6?auto=format&fit=crop&w=800&q=80',
                latitude: 9.75940000,
                longitude: 126.05310000,
                capacity: 350,
                current_occupancy: 195,
                status: 'Open',
                created_at: now,
                updated_at: now,
            },
            {
                id: 3,
                municipality_id: 10,
                created_by: 3,
                center_name: 'Mainit Central Elementary School Evacuation Complex',
                address: 'National Road, Poblacion, Mainit, Surigao del Norte',
                image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=800&q=80',
                latitude: 9.53980000,
                longitude: 125.52450000,
                capacity: 250,
                current_occupancy: 250,
                status: 'Full',
                created_at: now,
                updated_at: now,
            },
            {
                id: 4,
                municipality_id: 5,
                created_by: 3,
                center_name: 'Claver Regional Emergency Shelter Facility',
                address: 'Brgy. Tayaga, Claver, Surigao del Norte',
                image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
                latitude: 9.57410000,
                longitude: 125.73150000,
                capacity: 400,
                current_occupancy: 120,
                status: 'Open',
                created_at: now,
                updated_at: now,
            },
        ],

        // 6. DISASTER_UPDATES
        disaster_updates: [
            {
                id: 1,
                disaster_id: 1,
                created_by: 3,
                message: 'PDRRMO Rescue Teams and Coast Guard Station Surigao have completed pre-emptive evacuation of 84 families in Brgy. Sabang and Lipata.',
                published_at: '2026-11-03 16:00',
                created_at: now,
                updated_at: now,
            },
            {
                id: 2,
                disaster_id: 2,
                created_by: 3,
                message: 'Relief packs, potable water, and medical teams dispatched to Mainit Central Evacuation Complex. Water level monitoring continues every 30 minutes.',
                published_at: '2026-11-03 19:45',
                created_at: now,
                updated_at: now,
            },
            {
                id: 3,
                disaster_id: 3,
                created_by: 3,
                message: 'All inter-island sea trips between Surigao City, Dapa, and Socorro remain suspended until sea conditions normalize.',
                published_at: '2026-11-04 07:30',
                created_at: now,
                updated_at: now,
            },
        ],

        // 7. ACCESS_LOGS
        access_logs: [
            {
                id: 1,
                user_id: null,
                event_type: 'GUEST_VISIT',
                ip_address: '127.0.0.1',
                accessed_at: '2026-11-04 08:15:10',
            },
            {
                id: 2,
                user_id: 3,
                event_type: 'LOGIN',
                ip_address: '192.168.1.104',
                accessed_at: '2026-11-04 08:20:45',
            },
            {
                id: 3,
                user_id: 1,
                event_type: 'LOGIN',
                ip_address: '192.168.1.101',
                accessed_at: '2026-11-04 08:42:12',
            },
        ],
    };
}

// Load or initialize database in localStorage
function loadDB() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            const seed = getInitialSeedDatabase();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
            return seed;
        }
        return JSON.parse(raw);
    } catch (e) {
        return getInitialSeedDatabase();
    }
}

function saveDB(db) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function resetDB() {
    const seed = getInitialSeedDatabase();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
}

function formatNow() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function resolveCoords(lat, lng, municipalityName) {
    const hasExact = lat !== null && lat !== '' && lng !== null && lng !== '' && !isNaN(Number(lat)) && !isNaN(Number(lng));
    if (hasExact) {
        return {
            latitude: Number(lat),
            longitude: Number(lng),
            has_exact_coordinates: true,
        };
    }
    const fallback = MUNICIPALITY_COORDINATES[municipalityName] || [9.7844, 125.4950];
    return {
        latitude: fallback[0],
        longitude: fallback[1],
        has_exact_coordinates: false,
    };
}

