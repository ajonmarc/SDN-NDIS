<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import {
    AlertTriangle,
    ArrowRight,
    Building2,
    Compass,
    Info,
    MapPin,
    Megaphone,
    Radio,
    RotateCcw,
    ShieldCheck,
    Users,
    X,
} from '@lucide/vue';
import type { AcceptableValue } from 'reka-ui';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import AppLogoIcon from '@/components/AppLogoIcon.vue';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useRole } from '@/composables/useRole';
import { login, register } from '@/routes';

interface WelcomeStats {
    total_disasters: number;
    active_disasters: number;
    total_centers: number;
    open_centers: number;
    total_occupancy: number;
    total_capacity: number;
    total_municipalities: number;
    total_updates: number;
}

interface MunicipalityOption {
    id: number;
    municipality_name: string;
}

interface DisasterUpdateItem {
    id: number;
    message: string;
    published_at: string;
}

interface DisasterItem {
    id: number;
    title: string;
    description: string | null;
    municipality_id: number;
    municipality_name: string;
    disaster_type_name: string;
    latitude: number;
    longitude: number;
    has_exact_coordinates?: boolean;
    severity: string;
    status: string;
    occurred_at: string;
    updates: DisasterUpdateItem[];
}

interface UpdateItem {
    id: number;
    disaster_title: string;
    municipality_name: string;
    message: string;
    published_at: string;
}

interface EvacuationCenterItem {
    id: number;
    center_name: string;
    address: string;
    municipality_id: number;
    municipality_name: string;
    image: string | null;
    latitude: number;
    longitude: number;
    has_exact_coordinates?: boolean;
    capacity: number;
    current_occupancy: number;
    status: string;
}

type SelectedItem =
    | { kind: 'disaster'; data: DisasterItem }
    | { kind: 'center'; data: EvacuationCenterItem }
    | null;

const props = withDefaults(
    defineProps<{
        stats?: WelcomeStats;
        municipalities?: MunicipalityOption[];
        disasters?: DisasterItem[];
        updates?: UpdateItem[];
        evacuationCenters?: EvacuationCenterItem[];
    }>(),
    {
        stats: () => ({
            total_disasters: 0,
            active_disasters: 0,
            total_centers: 0,
            open_centers: 0,
            total_occupancy: 0,
            total_capacity: 0,
            total_municipalities: 0,
            total_updates: 0,
        }),
        municipalities: () => [],
        disasters: () => [],
        updates: () => [],
        evacuationCenters: () => [],
    }
);

const { isHead, isPdrrmo, isGuest } = useRole();

const homeHref = computed(() => {
    if (isHead.value) return '/head/dashboard';
    if (isPdrrmo.value) return '/pdrrmo/dashboard';
    if (isGuest.value) return '/guest/dashboard';
    return '/';
});

// Map State & Refs
const mapContainer = ref<HTMLElement | null>(null);
const layerFilter = ref<'all' | 'disasters' | 'centers'>('all');
const selectedMunicipality = ref<string>('all');
const selectedItem = ref<SelectedItem>(null);
const mapReady = ref(false);

const DEFAULT_CENTER: [number, number] = [9.7844, 125.68];
const DEFAULT_ZOOM = 10;

let L: any = null;
let mapInstance: any = null;
let markersLayer: any = null;
const disasterMarkerMap = new Map<number, any>();
const centerMarkerMap = new Map<number, any>();

const filteredDisasters = computed(() => {
    if (layerFilter.value === 'centers') {
        return [];
    }
    if (selectedMunicipality.value === 'all') {
        return props.disasters;
    }
    return props.disasters.filter(
        (d) => String(d.municipality_id) === selectedMunicipality.value
    );
});

const filteredCenters = computed(() => {
    if (layerFilter.value === 'disasters') {
        return [];
    }
    if (selectedMunicipality.value === 'all') {
        return props.evacuationCenters;
    }
    return props.evacuationCenters.filter(
        (c) => String(c.municipality_id) === selectedMunicipality.value
    );
});

const featuredDisasters = computed(() => props.disasters.slice(0, 6));
const featuredCenters = computed(() => props.evacuationCenters.slice(0, 6));

const handleMunicipalityChange = (value: AcceptableValue) => {
    selectedMunicipality.value = value ? String(value) : 'all';
};

const occupancyPercentage = (center: EvacuationCenterItem) => {
    if (!center.capacity || center.capacity <= 0) {
        return 0;
    }
    return Math.min(
        Math.round((center.current_occupancy / center.capacity) * 100),
        100
    );
};

const severityVariant = (severity: string) => {
    switch (severity) {
        case 'Critical':
        case 'High':
            return 'destructive' as const;
        case 'Moderate':
            return 'default' as const;
        default:
            return 'secondary' as const;
    }
};

const disasterStatusVariant = (status: string) => {
    switch (status) {
        case 'Active':
            return 'destructive' as const;
        case 'Monitoring':
            return 'default' as const;
        case 'Contained':
            return 'secondary' as const;
        default:
            return 'outline' as const;
    }
};

const centerStatusVariant = (status: string) => {
    switch (status) {
        case 'Open':
            return 'default' as const;
        case 'Full':
            return 'destructive' as const;
        case 'Maintenance':
            return 'secondary' as const;
        default:
            return 'outline' as const;
    }
};

const loadLeafletAssets = (): Promise<any> => {
    return new Promise((resolve, reject) => {
        if ((window as any).L) {
            resolve((window as any).L);
            return;
        }

        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link');
            link.id = 'leaflet-css';
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }

        const existingScript = document.getElementById('leaflet-js') as HTMLScriptElement | null;
        if (existingScript) {
            existingScript.addEventListener('load', () => resolve((window as any).L));
            return;
        }

        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.onload = () => resolve((window as any).L);
        script.onerror = (err) => reject(err);
        document.head.appendChild(script);
    });
};

const createDisasterIcon = (disaster: DisasterItem) => {
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
};

const createCenterIcon = (center: EvacuationCenterItem) => {
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
};

const renderMarkers = () => {
    if (!L || !mapInstance || !markersLayer) {
        return;
    }

    markersLayer.clearLayers();
    disasterMarkerMap.clear();
    centerMarkerMap.clear();

    const boundsPoints: [number, number][] = [];

    for (const disaster of filteredDisasters.value) {
        const marker = L.marker([disaster.latitude, disaster.longitude], {
            icon: createDisasterIcon(disaster),
        });

        const popupHtml = `
            <div style="min-width:210px;font-family:inherit;">
                <div style="font-size:11px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:0.04em;">
                    Disaster • ${disaster.disaster_type_name}
                </div>
                <div style="font-size:14px;font-weight:700;margin-top:2px;color:#0f172a;">
                    ${disaster.title}
                </div>
                <div style="font-size:12px;color:#475569;margin-top:2px;">
                    ${disaster.municipality_name}
                </div>
                <div style="display:flex;gap:6px;margin-top:6px;font-size:11px;">
                    <span style="background:#fee2e2;color:#991b1b;padding:1px 6px;border-radius:4px;font-weight:600;">
                        Severity: ${disaster.severity}
                    </span>
                    <span style="background:#f1f5f9;color:#334155;padding:1px 6px;border-radius:4px;font-weight:600;">
                        ${disaster.status}
                    </span>
                </div>
                <div style="font-size:11px;color:#64748b;margin-top:6px;">
                    Occurred: ${disaster.occurred_at}
                </div>
            </div>
        `;

        marker.bindPopup(popupHtml);
        marker.on('click', () => {
            selectedItem.value = { kind: 'disaster', data: disaster };
        });

        markersLayer.addLayer(marker);
        disasterMarkerMap.set(disaster.id, marker);
        boundsPoints.push([disaster.latitude, disaster.longitude]);
    }

    for (const center of filteredCenters.value) {
        const marker = L.marker([center.latitude, center.longitude], {
            icon: createCenterIcon(center),
        });

        const imageHtml = center.image
            ? `<img src="${center.image}" alt="${center.center_name}" style="width:100%;height:90px;object-fit:cover;border-radius:6px;margin-bottom:6px;" />`
            : '';

        const popupHtml = `
            <div style="min-width:220px;font-family:inherit;">
                ${imageHtml}
                <div style="font-size:11px;font-weight:700;color:#007687;text-transform:uppercase;letter-spacing:0.04em;">
                    Evacuation Center • ${center.status}
                </div>
                <div style="font-size:14px;font-weight:700;margin-top:2px;color:#0f172a;">
                    ${center.center_name}
                </div>
                <div style="font-size:12px;color:#475569;margin-top:2px;">
                    ${center.municipality_name} — ${center.address}
                </div>
                <div style="font-size:12px;font-weight:600;color:#0f172a;margin-top:6px;">
                    Occupancy: ${center.current_occupancy.toLocaleString()} / ${center.capacity.toLocaleString()} persons
                </div>
            </div>
        `;

        marker.bindPopup(popupHtml);
        marker.on('click', () => {
            selectedItem.value = { kind: 'center', data: center };
        });

        markersLayer.addLayer(marker);
        centerMarkerMap.set(center.id, marker);
        boundsPoints.push([center.latitude, center.longitude]);
    }

    if (boundsPoints.length > 0) {
        const bounds = L.latLngBounds(boundsPoints);
        mapInstance.fitBounds(bounds, { padding: [45, 45], maxZoom: 13 });
    }
};

const scrollToMap = () => {
    const el = document.getElementById('live-gis-map');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const focusDisasterOnMap = (disaster: DisasterItem) => {
    layerFilter.value = 'all';
    selectedMunicipality.value = 'all';
    selectedItem.value = { kind: 'disaster', data: disaster };
    scrollToMap();
    if (mapInstance) {
        mapInstance.flyTo([disaster.latitude, disaster.longitude], 14, {
            duration: 0.8,
        });
        const marker = disasterMarkerMap.get(disaster.id);
        marker?.openPopup();
    }
};

const focusCenterOnMap = (center: EvacuationCenterItem) => {
    layerFilter.value = 'all';
    selectedMunicipality.value = 'all';
    selectedItem.value = { kind: 'center', data: center };
    scrollToMap();
    if (mapInstance) {
        mapInstance.flyTo([center.latitude, center.longitude], 14, {
            duration: 0.8,
        });
        const marker = centerMarkerMap.get(center.id);
        marker?.openPopup();
    }
};

const resetMapView = () => {
    selectedItem.value = null;
    layerFilter.value = 'all';
    selectedMunicipality.value = 'all';
    if (mapInstance) {
        mapInstance.closePopup();
        mapInstance.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, { duration: 0.8 });
    }
};

watch([layerFilter, selectedMunicipality], () => {
    renderMarkers();
});

onMounted(async () => {
    try {
        L = await loadLeafletAssets();
        if (!mapContainer.value) {
            return;
        }

        mapInstance = L.map(mapContainer.value, {
            center: DEFAULT_CENTER,
            zoom: DEFAULT_ZOOM,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors',
        }).addTo(mapInstance);

        markersLayer = L.layerGroup().addTo(mapInstance);
        mapReady.value = true;
        renderMarkers();
    } catch (error) {
        console.error('Failed to initialize Leaflet map:', error);
    }
});

onBeforeUnmount(() => {
    if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
    }
});
</script>

<template>
    <Head title="Surigao del Norte Disaster Information System" />

    <div class="min-h-screen bg-background text-foreground flex flex-col">
        <!-- ==========================================================
             Top Navigation Bar
        =========================================================== -->
        <header class="sticky top-0 z-40 border-b bg-card/85 backdrop-blur-md">
            <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
                <Link href="/" class="flex items-center gap-3">
                    <AppLogoIcon class="size-11 rounded-full object-contain shadow-xs" />
                    <div>
                        <div class="flex items-center gap-2">
                            <span class="text-base font-bold tracking-tight sm:text-lg">
                                SDN-NDIS
                            </span>
                            <Badge variant="secondary" class="hidden sm:inline-flex text-[10px]">
                                Official Portal
                            </Badge>
                        </div>
                        <p class="text-xs text-muted-foreground hidden sm:block">
                            Surigao del Norte Natural Disaster Information System
                        </p>
                    </div>
                </Link>

                <nav class="flex items-center gap-2.5 sm:gap-3">
                    <Button v-if="$page.props.auth.user" as-child>
                        <Link :href="homeHref">
                            Go to Dashboard
                            <ArrowRight class="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                    <template v-else>
                        <Button as-child variant="ghost">
                            <Link :href="login()">Log in</Link>
                        </Button>
                        <Button as-child>
                            <Link :href="register()">
                                Register Account
                            </Link>
                        </Button>
                    </template>
                </nav>
            </div>
        </header>

        <!-- ==========================================================
             Hero Section & Live Provincial Telemetry
        =========================================================== -->
        <section class="relative overflow-hidden border-b bg-gradient-to-b from-secondary/95 via-secondary to-[#021824] text-white">
            <div
                class="pointer-events-none absolute inset-0 opacity-15"
                style="background-image: radial-gradient(#00a8bf 1px, transparent 1px); background-size: 24px 24px;"
            />

            <div class="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-24 lg:px-8">
                <div class="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
                    <!-- Hero Copy -->
                    <div class="space-y-6 lg:col-span-7">
                        <div class="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-cyan-200 backdrop-blur-xs">
                            <Radio class="h-3.5 w-3.5 text-[#f37f20] animate-pulse" />
                            <span>Province of Surigao del Norte • PDRRMO Command Network</span>
                        </div>

                        <h1 class="text-3xl font-extrabold tracking-tight sm:text-5xl lg:leading-[1.15]">
                            Natural Disaster Web-Based
                            <span class="text-[#38e0f5]">Information &amp; Evacuation</span>
                            System
                        </h1>

                        <p class="max-w-2xl text-base text-slate-200 sm:text-lg leading-relaxed">
                            A centralized disaster preparedness, geo-mapping, and emergency response platform for citizens and disaster risk reduction officers across Surigao del Norte.
                        </p>

                        <div class="flex flex-wrap items-center gap-3 pt-2">
                            <Button
                                size="lg"
                                class="bg-[#38e0f5] text-slate-950 hover:bg-[#38e0f5]/90 font-semibold"
                                @click="scrollToMap"
                            >
                                <Compass class="mr-2 h-4 w-4" />
                                Explore Live Map
                            </Button>
                            <Button v-if="$page.props.auth.user" as-child size="lg" class="bg-[#f37f20] text-slate-950 hover:bg-[#f37f20]/90 font-semibold">
                                <Link :href="homeHref">
                                    Open Operations Dashboard
                                    <ArrowRight class="ml-2 h-4 w-4" />
                                </Link>
                            </Button>
                            <template v-else>
                                <Button as-child size="lg" class="bg-[#f37f20] text-slate-950 hover:bg-[#f37f20]/90 font-semibold">
                                    <Link :href="login()">
                                        Access Portal
                                        <ArrowRight class="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                                <Button as-child size="lg" variant="outline" class="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                                    <Link :href="register()">
                                        Create Citizen / Guest Account
                                    </Link>
                                </Button>
                            </template>
                        </div>
                    </div>

                    <!-- Live Telemetry Card Panel (100% Real Database Stats) -->
                    <div class="lg:col-span-5">
                        <div class="rounded-2xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-md">
                            <div class="mb-4 flex items-center justify-between border-b border-white/15 pb-4">
                                <div class="flex items-center gap-3">
                                    <AppLogoIcon class="size-12 rounded-full object-contain" />
                                    <div>
                                        <h2 class="text-base font-bold text-white">
                                            Live Provincial Telemetry
                                        </h2>
                                        <p class="text-xs text-cyan-200">
                                            Real-time SDN-NDIS database summary
                                        </p>
                                    </div>
                                </div>
                                <Badge class="bg-emerald-500/20 text-emerald-300 border-emerald-400/30">
                                    Live Data
                                </Badge>
                            </div>

                            <div class="grid grid-cols-2 gap-3.5">
                                <div class="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                                    <div class="flex items-center justify-between text-xs text-slate-300">
                                        <span>Recorded Disasters</span>
                                        <AlertTriangle class="h-4 w-4 text-[#f37f20]" />
                                    </div>
                                    <p class="mt-2 text-2xl font-bold text-white">
                                        {{ stats.total_disasters.toLocaleString() }}
                                    </p>
                                    <p class="mt-0.5 text-[11px] text-slate-300">
                                        {{ stats.active_disasters.toLocaleString() }} active / monitoring
                                    </p>
                                </div>

                                <div class="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                                    <div class="flex items-center justify-between text-xs text-slate-300">
                                        <span>Evacuation Centers</span>
                                        <Building2 class="h-4 w-4 text-[#38e0f5]" />
                                    </div>
                                    <p class="mt-2 text-2xl font-bold text-white">
                                        {{ stats.total_centers.toLocaleString() }}
                                    </p>
                                    <p class="mt-0.5 text-[11px] text-slate-300">
                                        {{ stats.open_centers.toLocaleString() }} open ({{ stats.total_occupancy.toLocaleString() }}/{{ stats.total_capacity.toLocaleString() }})
                                    </p>
                                </div>

                                <div class="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                                    <div class="flex items-center justify-between text-xs text-slate-300">
                                        <span>Municipalities</span>
                                        <MapPin class="h-4 w-4 text-emerald-400" />
                                    </div>
                                    <p class="mt-2 text-2xl font-bold text-white">
                                        {{ stats.total_municipalities.toLocaleString() }}
                                    </p>
                                    <p class="mt-0.5 text-[11px] text-slate-300">
                                        Surigao del Norte LGUs
                                    </p>
                                </div>

                                <div class="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                                    <div class="flex items-center justify-between text-xs text-slate-300">
                                        <span>Advisories</span>
                                        <Megaphone class="h-4 w-4 text-amber-300" />
                                    </div>
                                    <p class="mt-2 text-2xl font-bold text-white">
                                        {{ stats.total_updates.toLocaleString() }}
                                    </p>
                                    <p class="mt-0.5 text-[11px] text-slate-300">
                                        Published updates
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- ==========================================================
             Real Database Feeds: Interactive GIS Map, Disasters, Advisories & Evacuation Centers
        =========================================================== -->
        <div class="mx-auto w-full max-w-7xl flex-1 space-y-12 px-4 py-12 sm:px-6 lg:px-8">
            <!-- 0. Interactive GIS Disaster & Evacuation Map -->
            <section id="live-gis-map" class="scroll-mt-20 space-y-5">
                <div class="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                    <div>
                        <Badge variant="outline" class="mb-2 border-primary/40 text-primary">
                            Interactive GIS Map
                        </Badge>
                        <h2 class="text-2xl font-bold tracking-tight">
                            Surigao del Norte Disaster &amp; Evacuation Map
                        </h2>
                        <p class="text-sm text-muted-foreground">
                            Real-time geographic map of active disaster incidents and open evacuation shelters across the province
                        </p>
                    </div>

                    <div class="flex flex-wrap items-center gap-2.5">
                        <!-- Layer Toggle Buttons -->
                        <div class="inline-flex rounded-md border bg-card p-1">
                            <Button
                                size="sm"
                                :variant="layerFilter === 'all' ? 'default' : 'ghost'"
                                @click="layerFilter = 'all'"
                            >
                                All ({{ filteredDisasters.length + filteredCenters.length }})
                            </Button>
                            <Button
                                size="sm"
                                :variant="layerFilter === 'disasters' ? 'destructive' : 'ghost'"
                                @click="layerFilter = 'disasters'"
                            >
                                <AlertTriangle class="mr-1.5 h-3.5 w-3.5" />
                                Disasters ({{ filteredDisasters.length }})
                            </Button>
                            <Button
                                size="sm"
                                :variant="layerFilter === 'centers' ? 'default' : 'ghost'"
                                @click="layerFilter = 'centers'"
                            >
                                <Building2 class="mr-1.5 h-3.5 w-3.5" />
                                Evacuation Centers ({{ filteredCenters.length }})
                            </Button>
                        </div>

                        <!-- Municipality Filter -->
                        <div class="w-52">
                            <Select
                                :model-value="selectedMunicipality"
                                @update:model-value="handleMunicipalityChange"
                            >
                                <SelectTrigger class="w-full bg-card">
                                    <SelectValue placeholder="All Municipalities" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Municipalities</SelectItem>
                                    <SelectItem
                                        v-for="muni in municipalities"
                                        :key="muni.id"
                                        :value="muni.id.toString()"
                                    >
                                        {{ muni.municipality_name }}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <!-- Reset Map Button -->
                        <Button variant="outline" size="sm" @click="resetMapView">
                            <RotateCcw class="mr-1.5 h-3.5 w-3.5" />
                            Reset View
                        </Button>
                    </div>
                </div>

                <!-- Map Legend Bar -->
                <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card px-4 py-2.5 text-xs">
                    <div class="flex flex-wrap items-center gap-4">
                        <span class="font-semibold text-foreground">Map Legend:</span>
                        <span class="inline-flex items-center gap-1.5">
                            <span class="inline-block size-3 rounded-full bg-red-600 ring-2 ring-red-600/30" />
                            <span>Active / High-Severity Disaster</span>
                        </span>
                        <span class="inline-flex items-center gap-1.5">
                            <span class="inline-block size-3 rounded-full bg-[#f37f20]" />
                            <span>Monitored / Contained Disaster</span>
                        </span>
                        <span class="inline-flex items-center gap-1.5">
                            <span class="inline-block size-3 rounded-full bg-[#007687]" />
                            <span>Open Evacuation Center</span>
                        </span>
                        <span class="inline-flex items-center gap-1.5">
                            <span class="inline-block size-3 rounded-full bg-slate-600" />
                            <span>Full / Closed Center</span>
                        </span>
                    </div>

                    <div class="text-muted-foreground">
                        Click any marker on the map or card below to inspect full details and updates.
                    </div>
                </div>

                <!-- Map Canvas + Selected Marker Detail Panel -->
                <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
                    <Card
                        :class="[
                            'overflow-hidden p-0 shadow-sm',
                            selectedItem ? 'lg:col-span-8' : 'lg:col-span-12',
                        ]"
                    >
                        <div
                            ref="mapContainer"
                            class="z-10 h-[480px] w-full bg-muted sm:h-[540px]"
                        />
                    </Card>

                    <!-- Selected Marker Detail Panel -->
                    <Card v-if="selectedItem" class="lg:col-span-4 flex flex-col">
                        <!-- Disaster Detail Panel -->
                        <template v-if="selectedItem.kind === 'disaster'">
                            <CardHeader class="pb-3">
                                <div class="flex items-start justify-between gap-2">
                                    <div class="flex flex-wrap items-center gap-1.5">
                                        <Badge :variant="severityVariant(selectedItem.data.severity)">
                                            {{ selectedItem.data.severity }} Severity
                                        </Badge>
                                        <Badge :variant="disasterStatusVariant(selectedItem.data.status)">
                                            {{ selectedItem.data.status }}
                                        </Badge>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        class="h-7 w-7 shrink-0"
                                        @click="selectedItem = null"
                                    >
                                        <X class="h-4 w-4" />
                                    </Button>
                                </div>

                                <CardTitle class="mt-2 text-lg">
                                    {{ selectedItem.data.title }}
                                </CardTitle>
                                <CardDescription>
                                    {{ selectedItem.data.disaster_type_name }} • {{ selectedItem.data.municipality_name }}
                                </CardDescription>
                            </CardHeader>

                            <CardContent class="space-y-4 text-sm">
                                <div class="grid grid-cols-2 gap-2 rounded-lg bg-muted/60 p-3 text-xs">
                                    <div>
                                        <span class="text-muted-foreground">Occurred At</span>
                                        <p class="font-medium text-foreground">
                                            {{ selectedItem.data.occurred_at }}
                                        </p>
                                    </div>
                                    <div>
                                        <span class="text-muted-foreground">Coordinates</span>
                                        <p class="font-mono font-medium text-foreground">
                                            {{ selectedItem.data.latitude.toFixed(5) }}, {{ selectedItem.data.longitude.toFixed(5) }}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h4 class="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                        Situation Overview
                                    </h4>
                                    <p class="text-sm text-foreground leading-relaxed">
                                        {{ selectedItem.data.description || 'No additional description provided.' }}
                                    </p>
                                </div>

                                <Separator />

                                <!-- Disaster Updates inside Detail Panel -->
                                <div class="space-y-2.5">
                                    <div class="flex items-center justify-between">
                                        <h4 class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            <Megaphone class="h-3.5 w-3.5 text-primary" />
                                            Published Updates ({{ selectedItem.data.updates?.length ?? 0 }})
                                        </h4>
                                    </div>

                                    <div
                                        v-if="selectedItem.data.updates && selectedItem.data.updates.length > 0"
                                        class="max-h-56 space-y-2.5 overflow-y-auto pr-1"
                                    >
                                        <div
                                            v-for="update in selectedItem.data.updates"
                                            :key="update.id"
                                            class="rounded-lg border bg-muted/30 p-3 text-xs space-y-1"
                                        >
                                            <div class="font-medium text-muted-foreground">
                                                {{ update.published_at }}
                                            </div>
                                            <p class="text-foreground leading-relaxed">
                                                {{ update.message }}
                                            </p>
                                        </div>
                                    </div>
                                    <p v-else class="text-xs text-muted-foreground">
                                        No updates published for this disaster yet.
                                    </p>
                                </div>
                            </CardContent>
                        </template>

                        <!-- Evacuation Center Detail Panel -->
                        <template v-else-if="selectedItem.kind === 'center'">
                            <img
                                v-if="selectedItem.data.image"
                                :src="selectedItem.data.image"
                                :alt="selectedItem.data.center_name"
                                class="h-44 w-full border-b object-cover rounded-t-xl"
                            />
                            <CardHeader class="pb-3">
                                <div class="flex items-start justify-between gap-2">
                                    <div class="flex flex-wrap items-center gap-1.5">
                                        <Badge variant="secondary">
                                            {{ selectedItem.data.municipality_name }}
                                        </Badge>
                                        <Badge :variant="centerStatusVariant(selectedItem.data.status)">
                                            {{ selectedItem.data.status }}
                                        </Badge>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        class="h-7 w-7 shrink-0"
                                        @click="selectedItem = null"
                                    >
                                        <X class="h-4 w-4" />
                                    </Button>
                                </div>

                                <CardTitle class="mt-2 text-lg">
                                    {{ selectedItem.data.center_name }}
                                </CardTitle>
                                <CardDescription class="flex items-start gap-1.5">
                                    <MapPin class="mt-0.5 h-3.5 w-3.5 shrink-0" />
                                    <span>{{ selectedItem.data.address }}</span>
                                </CardDescription>
                            </CardHeader>

                            <CardContent class="space-y-4 text-sm">
                                <!-- Occupancy Progress -->
                                <div class="rounded-lg border bg-muted/40 p-3.5 space-y-2">
                                    <div class="flex items-center justify-between text-xs">
                                        <span class="flex items-center gap-1.5 font-medium text-muted-foreground">
                                            <Users class="h-3.5 w-3.5 text-primary" />
                                            Current Occupancy
                                        </span>
                                        <span class="font-bold text-foreground">
                                            {{ selectedItem.data.current_occupancy.toLocaleString() }} /
                                            {{ selectedItem.data.capacity.toLocaleString() }} persons
                                            ({{ occupancyPercentage(selectedItem.data) }}%)
                                        </span>
                                    </div>
                                    <div class="h-2 w-full overflow-hidden rounded-full bg-muted">
                                        <div
                                            class="h-full bg-primary transition-all"
                                            :style="{ width: `${occupancyPercentage(selectedItem.data)}%` }"
                                        />
                                    </div>
                                </div>

                                <div class="rounded-lg bg-muted/60 p-3 text-xs">
                                    <span class="text-muted-foreground">GPS Coordinates</span>
                                    <p class="mt-0.5 font-mono font-medium text-foreground">
                                        {{ selectedItem.data.latitude.toFixed(5) }}, {{ selectedItem.data.longitude.toFixed(5) }}
                                    </p>
                                </div>
                            </CardContent>
                        </template>
                    </Card>
                </div>
            </section>

            <!-- 1. Recorded Disasters from Database -->
            <section class="space-y-5">
                <div>
                    <Badge variant="outline" class="mb-2">Disaster Monitoring</Badge>
                    <h2 class="text-2xl font-bold tracking-tight">
                        Latest Recorded Disasters
                    </h2>
                    <p class="text-sm text-muted-foreground">
                        Active and recent disaster events recorded in Surigao del Norte (click any card to locate on the map)
                    </p>
                </div>

                <div
                    v-if="featuredDisasters.length > 0"
                    class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                >
                    <Card
                        v-for="disaster in featuredDisasters"
                        :key="disaster.id"
                        class="cursor-pointer transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
                        @click="focusDisasterOnMap(disaster)"
                    >
                        <CardHeader class="pb-2">
                            <div class="flex items-center justify-between gap-2">
                                <Badge :variant="severityVariant(disaster.severity)">
                                    {{ disaster.severity }}
                                </Badge>
                                <Badge :variant="disasterStatusVariant(disaster.status)">
                                    {{ disaster.status }}
                                </Badge>
                            </div>
                            <CardTitle class="mt-2 text-base">
                                {{ disaster.title }}
                            </CardTitle>
                            <CardDescription>
                                {{ disaster.disaster_type_name }} • {{ disaster.municipality_name }}
                            </CardDescription>
                        </CardHeader>
                        <CardContent class="space-y-2">
                            <p class="line-clamp-2 text-sm text-muted-foreground">
                                {{ disaster.description || 'No additional description provided.' }}
                            </p>
                            <div class="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                                <span>Occurred: {{ disaster.occurred_at }}</span>
                                <span class="inline-flex items-center gap-1 font-medium text-primary">
                                    <MapPin class="h-3 w-3" />
                                    Locate on Map
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div
                    v-else
                    class="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-card py-10 text-center"
                >
                    <Info class="h-7 w-7 text-muted-foreground" />
                    <p class="text-sm font-medium">No disasters recorded yet</p>
                    <p class="text-xs text-muted-foreground">
                        Recorded disaster incidents will automatically appear here.
                    </p>
                </div>
            </section>

            <!-- 2. Recent Disaster Updates & Advisories from Database -->
            <section class="space-y-5">
                <div>
                    <Badge variant="secondary" class="mb-2">Latest Bulletins</Badge>
                    <h2 class="text-2xl font-bold tracking-tight">
                        Recent Disaster Updates &amp; Advisories
                    </h2>
                    <p class="text-sm text-muted-foreground">
                        Official situation reports and emergency advisories published by PDRRMO
                    </p>
                </div>

                <div
                    v-if="updates.length > 0"
                    class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                >
                    <Card
                        v-for="update in updates"
                        :key="update.id"
                        class="transition-shadow hover:shadow-md"
                    >
                        <CardHeader class="pb-2">
                            <div class="flex items-center justify-between gap-2">
                                <Badge variant="outline">{{ update.municipality_name }}</Badge>
                                <span class="text-xs text-muted-foreground">
                                    {{ update.published_at }}
                                </span>
                            </div>
                            <CardTitle class="mt-2 text-base">
                                {{ update.disaster_title }}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p class="line-clamp-3 text-sm text-muted-foreground">
                                {{ update.message }}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div
                    v-else
                    class="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-card py-10 text-center"
                >
                    <Info class="h-7 w-7 text-muted-foreground" />
                    <p class="text-sm font-medium">No advisories published yet</p>
                    <p class="text-xs text-muted-foreground">
                        Official PDRRMO updates will be displayed here as soon as they are published.
                    </p>
                </div>
            </section>

            <!-- 3. Evacuation Centers from Database -->
            <section class="space-y-5">
                <div>
                    <Badge variant="outline" class="mb-2">Evacuation Shelters</Badge>
                    <h2 class="text-2xl font-bold tracking-tight">
                        Evacuation Centers
                    </h2>
                    <p class="text-sm text-muted-foreground">
                        Available evacuation centers, current occupancy, and shelter capacities (click any card to locate on the map)
                    </p>
                </div>

                <div
                    v-if="featuredCenters.length > 0"
                    class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                >
                    <Card
                        v-for="center in featuredCenters"
                        :key="center.id"
                        class="cursor-pointer overflow-hidden transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
                        @click="focusCenterOnMap(center)"
                    >
                        <img
                            v-if="center.image"
                            :src="center.image"
                            :alt="center.center_name"
                            class="h-40 w-full border-b object-cover"
                        />
                        <CardHeader class="pb-2">
                            <div class="flex items-center justify-between gap-2">
                                <Badge variant="secondary">
                                    {{ center.municipality_name }}
                                </Badge>
                                <Badge :variant="centerStatusVariant(center.status)">
                                    {{ center.status }}
                                </Badge>
                            </div>
                            <CardTitle class="mt-2 text-base">
                                {{ center.center_name }}
                            </CardTitle>
                            <CardDescription class="line-clamp-1">
                                {{ center.address }}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div class="flex items-center justify-between text-xs font-medium text-muted-foreground">
                                <span>
                                    Occupancy:
                                    <span class="text-foreground">
                                        {{ center.current_occupancy.toLocaleString() }} / {{ center.capacity.toLocaleString() }} persons
                                    </span>
                                </span>
                                <span class="inline-flex items-center gap-1 font-medium text-primary">
                                    <MapPin class="h-3 w-3" />
                                    Locate on Map
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div
                    v-else
                    class="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-card py-10 text-center"
                >
                    <Info class="h-7 w-7 text-muted-foreground" />
                    <p class="text-sm font-medium">No evacuation centers listed yet</p>
                    <p class="text-xs text-muted-foreground">
                        Designated evacuation shelters and their capacities will appear here once added.
                    </p>
                </div>
            </section>
        </div>

        <!-- ==========================================================
             Footer
        =========================================================== -->
        <footer class="mt-auto border-t bg-card py-8">
            <div class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:text-left sm:px-6 lg:px-8">
                <div class="flex items-center gap-3">
                    <AppLogoIcon class="size-8 rounded-full object-contain" />
                    <span class="text-sm font-medium">
                        Surigao del Norte Natural Disaster Web-Based Information System (SDN-NDIS)
                    </span>
                </div>
                <div class="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck class="h-4 w-4 text-primary" />
                    <span>Provincial Disaster Risk Reduction &amp; Management Office (PDRRMO)</span>
                </div>
            </div>
        </footer>
    </div>
</template>
