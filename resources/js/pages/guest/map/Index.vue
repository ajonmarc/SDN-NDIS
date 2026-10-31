<script setup lang="ts">
import { Head } from '@inertiajs/vue3';
import {
    AlertTriangle,
    Building2,
    Compass,
    Info,
    MapPin,
    Megaphone,
    RotateCcw,
    Users,
    X,
} from '@lucide/vue';
import type { AcceptableValue } from 'reka-ui';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import Heading from '@/components/Heading.vue';
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

interface MunicipalityOption {
    id: number;
    municipality_name: string;
}

interface DisasterUpdateItem {
    id: number;
    message: string;
    published_at: string;
}

interface MapDisaster {
    id: number;
    title: string;
    description: string | null;
    municipality_id: number;
    municipality_name: string;
    disaster_type_name: string;
    latitude: number;
    longitude: number;
    occurred_at: string;
    severity: string;
    status: string;
    updates: DisasterUpdateItem[];
}

interface MapEvacuationCenter {
    id: number;
    center_name: string;
    address: string;
    municipality_id: number;
    municipality_name: string;
    image: string | null;
    latitude: number;
    longitude: number;
    capacity: number;
    current_occupancy: number;
    status: string;
}

type SelectedItem =
    | { kind: 'disaster'; data: MapDisaster }
    | { kind: 'center'; data: MapEvacuationCenter }
    | null;

const props = withDefaults(
    defineProps<{
        municipalities?: MunicipalityOption[];
        disasters?: MapDisaster[];
        evacuationCenters?: MapEvacuationCenter[];
        unmappedDisastersCount?: number;
        unmappedCentersCount?: number;
    }>(),
    {
        municipalities: () => [],
        disasters: () => [],
        evacuationCenters: () => [],
        unmappedDisastersCount: 0,
        unmappedCentersCount: 0,
    }
);

const mapContainer = ref<HTMLElement | null>(null);
const layerFilter = ref<'all' | 'disasters' | 'centers'>('all');
const selectedMunicipality = ref<string>('all');
const selectedItem = ref<SelectedItem>(null);
const mapReady = ref(false);

// Default Surigao del Norte center coordinates
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

const handleMunicipalityChange = (value: AcceptableValue) => {
    selectedMunicipality.value = value ? String(value) : 'all';
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

const occupancyPercentage = (center: MapEvacuationCenter) => {
    if (!center.capacity || center.capacity <= 0) {
        return 0;
    }
    return Math.min(
        Math.round((center.current_occupancy / center.capacity) * 100),
        100
    );
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

const createDisasterIcon = (disaster: MapDisaster) => {
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

const createCenterIcon = (center: MapEvacuationCenter) => {
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

    // Plot Disasters
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

    // Plot Evacuation Centers
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

const focusDisaster = (disaster: MapDisaster) => {
    selectedItem.value = { kind: 'disaster', data: disaster };
    if (mapInstance) {
        mapInstance.flyTo([disaster.latitude, disaster.longitude], 14, {
            duration: 0.8,
        });
        const marker = disasterMarkerMap.get(disaster.id);
        marker?.openPopup();
    }
};

const focusCenter = (center: MapEvacuationCenter) => {
    selectedItem.value = { kind: 'center', data: center };
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

defineOptions({
    layout: {
        breadcrumbs: [
            {
                href: '/guest/map',
                title: 'Disaster Map',
            },
        ],
    },
});
</script>

<template>
    <Head title="Disaster Map" />

    <div class="px-4 py-6 space-y-6">
        <!-- ==========================================================
             Header & Filter Controls
        =========================================================== -->
        <div class="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <Heading
                title="Disaster & Evacuation Map"
                description="Interactive GIS map of Surigao del Norte showing active disaster locations and evacuation center markers."
            />

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

        <!-- ==========================================================
             Map Legend Bar
        =========================================================== -->
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
                Click any marker on the map or item below to inspect full details and updates.
            </div>
        </div>

        <!-- ==========================================================
             Map Canvas + Selected Marker Details Panel
        =========================================================== -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <!-- Map Container -->
            <Card
                :class="[
                    'overflow-hidden p-0',
                    selectedItem ? 'lg:col-span-8' : 'lg:col-span-12',
                ]"
            >
                <div
                    ref="mapContainer"
                    class="z-10 h-[520px] w-full bg-muted"
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
                                    Published Updates ({{ selectedItem.data.updates.length }})
                                </h4>
                            </div>

                            <div
                                v-if="selectedItem.data.updates.length > 0"
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

        <!-- ==========================================================
             Quick Locator Directory (Disasters & Evacuation Centers)
        =========================================================== -->
        <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <!-- Plotted Disasters List -->
            <Card>
                <CardHeader class="pb-3">
                    <CardTitle class="flex items-center gap-2 text-base">
                        <AlertTriangle class="h-4 w-4 text-destructive" />
                        Mapped Disasters ({{ filteredDisasters.length }})
                    </CardTitle>
                    <CardDescription>
                        Click a disaster to center the map on its coordinates and inspect updates
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div
                        v-if="filteredDisasters.length > 0"
                        class="max-h-72 space-y-2.5 overflow-y-auto pr-1"
                    >
                        <div
                            v-for="disaster in filteredDisasters"
                            :key="disaster.id"
                            class="flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/60"
                            @click="focusDisaster(disaster)"
                        >
                            <div class="min-w-0">
                                <div class="flex items-center gap-2">
                                    <span class="truncate font-medium text-sm">
                                        {{ disaster.title }}
                                    </span>
                                </div>
                                <p class="text-xs text-muted-foreground">
                                    {{ disaster.disaster_type_name }} • {{ disaster.municipality_name }} • {{ disaster.occurred_at }}
                                </p>
                            </div>
                            <div class="flex shrink-0 items-center gap-1.5">
                                <Badge :variant="severityVariant(disaster.severity)">
                                    {{ disaster.severity }}
                                </Badge>
                                <Badge :variant="disasterStatusVariant(disaster.status)">
                                    {{ disaster.status }}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div
                        v-else
                        class="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-center"
                    >
                        <Info class="h-6 w-6 text-muted-foreground" />
                        <p class="text-sm font-medium">No mapped disasters found</p>
                        <p class="text-xs text-muted-foreground">
                            Disasters with latitude and longitude coordinates will appear on the map.
                        </p>
                    </div>
                </CardContent>
            </Card>

            <!-- Plotted Evacuation Centers List -->
            <Card>
                <CardHeader class="pb-3">
                    <CardTitle class="flex items-center gap-2 text-base">
                        <Building2 class="h-4 w-4 text-primary" />
                        Mapped Evacuation Centers ({{ filteredCenters.length }})
                    </CardTitle>
                    <CardDescription>
                        Click an evacuation center to locate it on the map and view shelter details
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div
                        v-if="filteredCenters.length > 0"
                        class="max-h-72 space-y-2.5 overflow-y-auto pr-1"
                    >
                        <div
                            v-for="center in filteredCenters"
                            :key="center.id"
                            class="flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/60"
                            @click="focusCenter(center)"
                        >
                            <div class="flex min-w-0 items-center gap-3">
                                <img
                                    v-if="center.image"
                                    :src="center.image"
                                    :alt="center.center_name"
                                    class="h-10 w-12 shrink-0 rounded border object-cover"
                                />
                                <div
                                    v-else
                                    class="flex h-10 w-12 shrink-0 items-center justify-center rounded border bg-muted text-muted-foreground"
                                >
                                    <Compass class="h-4 w-4" />
                                </div>
                                <div class="min-w-0">
                                    <p class="truncate text-sm font-medium">
                                        {{ center.center_name }}
                                    </p>
                                    <p class="truncate text-xs text-muted-foreground">
                                        {{ center.municipality_name }} • {{ center.current_occupancy }} / {{ center.capacity }} persons
                                    </p>
                                </div>
                            </div>
                            <Badge :variant="centerStatusVariant(center.status)" class="shrink-0">
                                {{ center.status }}
                            </Badge>
                        </div>
                    </div>

                    <div
                        v-else
                        class="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed py-8 text-center"
                    >
                        <Info class="h-6 w-6 text-muted-foreground" />
                        <p class="text-sm font-medium">No mapped evacuation centers found</p>
                        <p class="text-xs text-muted-foreground">
                            Evacuation centers with latitude and longitude coordinates will appear on the map.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
</template>
