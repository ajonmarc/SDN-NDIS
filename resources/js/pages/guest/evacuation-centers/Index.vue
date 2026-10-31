<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import {
    Building2,
    Compass,
    Info,
    MapPin,
    RotateCcw,
    Search,
    Users,
} from '@lucide/vue';
import type { AcceptableValue } from 'reka-ui';
import { computed, ref } from 'vue';
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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

interface EvacuationCenterItem {
    id: number;
    center_name: string;
    address: string;
    municipality_id: number;
    municipality_name: string;
    image: string | null;
    latitude: string | number | null;
    longitude: string | number | null;
    capacity: number;
    current_occupancy: number;
    available_slots: number;
    status: string;
}

const props = withDefaults(
    defineProps<{
        municipalities?: MunicipalityOption[];
        evacuationCenters?: EvacuationCenterItem[];
    }>(),
    {
        municipalities: () => [],
        evacuationCenters: () => [],
    }
);

const searchQuery = ref('');
const selectedMunicipality = ref('all');
const selectedStatus = ref('all');
const viewingCenter = ref<EvacuationCenterItem | null>(null);

const statuses = ['Open', 'Full', 'Closed', 'Maintenance'];

const filteredCenters = computed(() => {
    const q = searchQuery.value.trim().toLowerCase();

    return props.evacuationCenters.filter((center) => {
        if (
            selectedMunicipality.value !== 'all' &&
            String(center.municipality_id) !== selectedMunicipality.value
        ) {
            return false;
        }

        if (
            selectedStatus.value !== 'all' &&
            center.status !== selectedStatus.value
        ) {
            return false;
        }

        if (!q) {
            return true;
        }

        return (
            center.center_name.toLowerCase().includes(q) ||
            center.address.toLowerCase().includes(q) ||
            center.municipality_name.toLowerCase().includes(q)
        );
    });
});

const resetFilters = () => {
    searchQuery.value = '';
    selectedMunicipality.value = 'all';
    selectedStatus.value = 'all';
};

const toFilterString = (val: AcceptableValue) => (val ? String(val) : 'all');

const statusVariant = (status: string) => {
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

const occupancyPercentage = (center: EvacuationCenterItem) => {
    if (!center.capacity || center.capacity <= 0) {
        return 0;
    }
    return Math.min(
        Math.round((center.current_occupancy / center.capacity) * 100),
        100
    );
};

defineOptions({
    layout: {
        breadcrumbs: [
            {
                href: '/guest/evacuation-centers',
                title: 'Evacuation Centers',
            },
        ],
    },
});
</script>

<template>
    <Head title="Evacuation Centers" />

    <div class="px-4 py-6 space-y-6">
        <!-- ==========================================================
             Header
        =========================================================== -->
        <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <Heading
                title="Evacuation Centers"
                description="Browse evacuation center locations, addresses, photos, capacity, current occupancy, and operational status"
            />

            <Button as-child variant="outline">
                <Link href="/guest/map">
                    <MapPin class="mr-2 h-4 w-4" />
                    View on Disaster Map
                </Link>
            </Button>
        </div>

        <!-- ==========================================================
             Search & Filter Bar
        =========================================================== -->
        <Card>
            <CardContent class="p-4">
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <!-- Search -->
                    <div class="relative lg:col-span-2">
                        <Search class="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            v-model="searchQuery"
                            placeholder="Search evacuation center name, address, or municipality..."
                            class="pl-9"
                        />
                    </div>

                    <!-- Municipality Filter -->
                    <Select
                        :model-value="selectedMunicipality"
                        @update:model-value="
                            (v) => (selectedMunicipality = toFilterString(v))
                        "
                    >
                        <SelectTrigger class="w-full">
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

                    <!-- Status Filter + Reset -->
                    <div class="flex items-center gap-2">
                        <Select
                            :model-value="selectedStatus"
                            @update:model-value="
                                (v) => (selectedStatus = toFilterString(v))
                            "
                        >
                            <SelectTrigger class="w-full">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem
                                    v-for="status in statuses"
                                    :key="status"
                                    :value="status"
                                >
                                    {{ status }}
                                </SelectItem>
                            </SelectContent>
                        </Select>

                        <Button
                            variant="ghost"
                            size="icon"
                            title="Reset filters"
                            @click="resetFilters"
                        >
                            <RotateCcw class="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>

        <!-- ==========================================================
             Evacuation Centers Grid
        =========================================================== -->
        <div
            v-if="filteredCenters.length > 0"
            class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
            <Card
                v-for="center in filteredCenters"
                :key="center.id"
                class="flex flex-col justify-between overflow-hidden transition-shadow hover:shadow-md"
            >
                <div>
                    <!-- Center Photo / Placeholder -->
                    <img
                        v-if="center.image"
                        :src="center.image"
                        :alt="center.center_name"
                        class="h-44 w-full border-b object-cover"
                    />
                    <div
                        v-else
                        class="flex h-44 w-full flex-col items-center justify-center gap-2 border-b bg-muted/50 text-muted-foreground"
                    >
                        <Building2 class="h-10 w-10 opacity-60" />
                        <span class="text-xs">No facility photo uploaded</span>
                    </div>

                    <CardHeader class="pb-3">
                        <div class="flex items-center justify-between gap-2">
                            <Badge variant="secondary">
                                {{ center.municipality_name }}
                            </Badge>
                            <Badge :variant="statusVariant(center.status)">
                                {{ center.status }}
                            </Badge>
                        </div>

                        <CardTitle class="mt-2 text-lg">
                            {{ center.center_name }}
                        </CardTitle>
                        <CardDescription class="flex items-start gap-1.5">
                            <MapPin class="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                            <span class="line-clamp-2">{{ center.address }}</span>
                        </CardDescription>
                    </CardHeader>

                    <CardContent class="space-y-3">
                        <!-- Occupancy Progress Box -->
                        <div class="rounded-lg border bg-muted/30 p-3 space-y-2">
                            <div class="flex items-center justify-between text-xs">
                                <span class="flex items-center gap-1.5 font-medium text-muted-foreground">
                                    <Users class="h-3.5 w-3.5 text-primary" />
                                    Occupancy
                                </span>
                                <span class="font-semibold text-foreground">
                                    {{ center.current_occupancy.toLocaleString() }} /
                                    {{ center.capacity.toLocaleString() }} persons
                                </span>
                            </div>

                            <div class="h-2 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    class="h-full bg-primary transition-all"
                                    :style="{ width: `${occupancyPercentage(center)}%` }"
                                />
                            </div>

                            <div class="flex items-center justify-between text-[11px] text-muted-foreground">
                                <span>{{ occupancyPercentage(center) }}% occupied</span>
                                <span>{{ center.available_slots.toLocaleString() }} slots available</span>
                            </div>
                        </div>
                    </CardContent>
                </div>

                <div class="px-6 pb-5 pt-2 flex justify-end">
                    <Button
                        variant="outline"
                        size="sm"
                        @click="viewingCenter = center"
                    >
                        <Building2 class="mr-1.5 h-3.5 w-3.5" />
                        View Center Details
                    </Button>
                </div>
            </Card>
        </div>

        <!-- Empty State -->
        <Card v-else>
            <CardContent class="py-12">
                <div class="flex flex-col items-center justify-center gap-3 text-center">
                    <Info class="h-8 w-8 text-muted-foreground" />
                    <div>
                        <p class="text-sm font-medium">No evacuation centers found</p>
                        <p class="text-xs text-muted-foreground">
                            Try adjusting your search or filter criteria.
                        </p>
                    </div>
                    <Button variant="outline" size="sm" @click="resetFilters">
                        Reset Filters
                    </Button>
                </div>
            </CardContent>
        </Card>

        <!-- ==========================================================
             Evacuation Center Detail Dialog
        =========================================================== -->
        <Dialog
            :open="!!viewingCenter"
            @update:open="
                (open) => {
                    if (!open) viewingCenter = null;
                }
            "
        >
            <DialogContent class="sm:max-w-xl max-h-[85vh] overflow-y-auto">
                <template v-if="viewingCenter">
                    <DialogHeader>
                        <div class="flex flex-wrap items-center gap-2 mb-2">
                            <Badge variant="secondary">
                                {{ viewingCenter.municipality_name }}
                            </Badge>
                            <Badge :variant="statusVariant(viewingCenter.status)">
                                {{ viewingCenter.status }}
                            </Badge>
                        </div>
                        <DialogTitle class="text-xl">
                            {{ viewingCenter.center_name }}
                        </DialogTitle>
                        <DialogDescription class="flex items-center gap-1.5">
                            <MapPin class="h-3.5 w-3.5 text-primary" />
                            <span>{{ viewingCenter.address }}</span>
                        </DialogDescription>
                    </DialogHeader>

                    <div class="space-y-4 py-2">
                        <img
                            v-if="viewingCenter.image"
                            :src="viewingCenter.image"
                            :alt="viewingCenter.center_name"
                            class="h-56 w-full rounded-lg border object-cover"
                        />

                        <div class="grid grid-cols-3 gap-3 rounded-lg border bg-muted/30 p-3.5 text-center">
                            <div>
                                <span class="text-xs text-muted-foreground">Capacity</span>
                                <p class="mt-0.5 text-lg font-bold">
                                    {{ viewingCenter.capacity.toLocaleString() }}
                                </p>
                            </div>
                            <div>
                                <span class="text-xs text-muted-foreground">Occupied</span>
                                <p class="mt-0.5 text-lg font-bold">
                                    {{ viewingCenter.current_occupancy.toLocaleString() }}
                                </p>
                            </div>
                            <div>
                                <span class="text-xs text-muted-foreground">Available</span>
                                <p class="mt-0.5 text-lg font-bold text-primary">
                                    {{ viewingCenter.available_slots.toLocaleString() }}
                                </p>
                            </div>
                        </div>

                        <Separator />

                        <div class="flex items-center justify-between text-xs text-muted-foreground">
                            <span class="flex items-center gap-1.5">
                                <Compass class="h-3.5 w-3.5" />
                                Coordinates:
                                <strong class="font-mono text-foreground">
                                    {{
                                        viewingCenter.latitude && viewingCenter.longitude
                                            ? `${viewingCenter.latitude}, ${viewingCenter.longitude}`
                                            : 'Municipality Default'
                                    }}
                                </strong>
                            </span>

                            <Button as-child variant="link" size="sm" class="h-auto p-0">
                                <Link href="/guest/map">Locate on Map</Link>
                            </Button>
                        </div>
                    </div>
                </template>
            </DialogContent>
        </Dialog>
    </div>
</template>
