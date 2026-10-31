<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import {
    AlertTriangle,
    Calendar,
    Info,
    MapPin,
    Megaphone,
    RotateCcw,
    Search,
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

interface DisasterTypeOption {
    id: number;
    type_name: string;
}

interface DisasterUpdateItem {
    id: number;
    message: string;
    published_at: string;
    author: string;
}

interface DisasterItem {
    id: number;
    title: string;
    description: string | null;
    municipality_id: number;
    municipality_name: string;
    disaster_type_id: number;
    disaster_type_name: string;
    latitude: string | number | null;
    longitude: string | number | null;
    occurred_at: string;
    severity: string;
    status: string;
    updates: DisasterUpdateItem[];
}

const props = withDefaults(
    defineProps<{
        municipalities?: MunicipalityOption[];
        disasterTypes?: DisasterTypeOption[];
        disasters?: DisasterItem[];
    }>(),
    {
        municipalities: () => [],
        disasterTypes: () => [],
        disasters: () => [],
    }
);

const searchQuery = ref('');
const selectedMunicipality = ref('all');
const selectedType = ref('all');
const selectedStatus = ref('all');
const viewingDisaster = ref<DisasterItem | null>(null);

const statuses = ['Active', 'Monitoring', 'Contained', 'Resolved'];

const filteredDisasters = computed(() => {
    const q = searchQuery.value.trim().toLowerCase();

    return props.disasters.filter((disaster) => {
        if (
            selectedMunicipality.value !== 'all' &&
            String(disaster.municipality_id) !== selectedMunicipality.value
        ) {
            return false;
        }

        if (
            selectedType.value !== 'all' &&
            String(disaster.disaster_type_id) !== selectedType.value
        ) {
            return false;
        }

        if (
            selectedStatus.value !== 'all' &&
            disaster.status !== selectedStatus.value
        ) {
            return false;
        }

        if (!q) {
            return true;
        }

        const matchesMain =
            disaster.title.toLowerCase().includes(q) ||
            (disaster.description?.toLowerCase().includes(q) ?? false) ||
            disaster.municipality_name.toLowerCase().includes(q) ||
            disaster.disaster_type_name.toLowerCase().includes(q);

        const matchesUpdates = disaster.updates.some((u) =>
            u.message.toLowerCase().includes(q)
        );

        return matchesMain || matchesUpdates;
    });
});

const resetFilters = () => {
    searchQuery.value = '';
    selectedMunicipality.value = 'all';
    selectedType.value = 'all';
    selectedStatus.value = 'all';
};

const toFilterString = (val: AcceptableValue) => (val ? String(val) : 'all');

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

const statusVariant = (status: string) => {
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

defineOptions({
    layout: {
        breadcrumbs: [
            {
                href: '/guest/disasters',
                title: 'Disasters & Updates',
            },
        ],
    },
});
</script>

<template>
    <Head title="Disasters & Updates" />

    <div class="px-4 py-6 space-y-6">
        <!-- ==========================================================
             Header
        =========================================================== -->
        <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <Heading
                title="Disasters & Updates"
                description="View reported natural disasters, severity details, and published advisories across Surigao del Norte"
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
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    <!-- Search -->
                    <div class="relative lg:col-span-2">
                        <Search class="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            v-model="searchQuery"
                            placeholder="Search disaster title, municipality, or advisory..."
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

                    <!-- Disaster Type Filter -->
                    <Select
                        :model-value="selectedType"
                        @update:model-value="
                            (v) => (selectedType = toFilterString(v))
                        "
                    >
                        <SelectTrigger class="w-full">
                            <SelectValue placeholder="All Disaster Types" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Disaster Types</SelectItem>
                            <SelectItem
                                v-for="type in disasterTypes"
                                :key="type.id"
                                :value="type.id.toString()"
                            >
                                {{ type.type_name }}
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
             Disasters & Advisories Grid
        =========================================================== -->
        <div
            v-if="filteredDisasters.length > 0"
            class="grid grid-cols-1 gap-6 lg:grid-cols-2"
        >
            <Card
                v-for="disaster in filteredDisasters"
                :key="disaster.id"
                class="flex flex-col justify-between transition-shadow hover:shadow-md"
            >
                <div>
                    <CardHeader class="pb-3">
                        <div class="flex flex-wrap items-center justify-between gap-2">
                            <div class="flex flex-wrap items-center gap-1.5">
                                <Badge :variant="severityVariant(disaster.severity)">
                                    {{ disaster.severity }} Severity
                                </Badge>
                                <Badge :variant="statusVariant(disaster.status)">
                                    {{ disaster.status }}
                                </Badge>
                                <Badge variant="outline">
                                    {{ disaster.disaster_type_name }}
                                </Badge>
                            </div>
                            <span class="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar class="h-3.5 w-3.5" />
                                {{ disaster.occurred_at }}
                            </span>
                        </div>

                        <CardTitle class="mt-2 text-lg">
                            {{ disaster.title }}
                        </CardTitle>
                        <CardDescription class="flex items-center gap-1.5">
                            <MapPin class="h-3.5 w-3.5 text-primary" />
                            <span>{{ disaster.municipality_name }}, Surigao del Norte</span>
                        </CardDescription>
                    </CardHeader>

                    <CardContent class="space-y-4">
                        <p class="text-sm text-foreground leading-relaxed">
                            {{ disaster.description || 'No additional description provided.' }}
                        </p>

                        <Separator />

                        <!-- Latest Updates Preview -->
                        <div class="space-y-2.5">
                            <div class="flex items-center justify-between">
                                <span class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    <Megaphone class="h-3.5 w-3.5 text-primary" />
                                    Official Updates ({{ disaster.updates.length }})
                                </span>
                                <Button
                                    v-if="disaster.updates.length > 0"
                                    variant="link"
                                    size="sm"
                                    class="h-auto p-0 text-xs"
                                    @click="viewingDisaster = disaster"
                                >
                                    View all updates
                                </Button>
                            </div>

                            <div
                                v-if="disaster.updates.length > 0"
                                class="space-y-2"
                            >
                                <div
                                    v-for="update in disaster.updates.slice(0, 2)"
                                    :key="update.id"
                                    class="rounded-lg border bg-muted/30 p-3 text-xs space-y-1"
                                >
                                    <div class="flex items-center justify-between text-muted-foreground">
                                        <span class="font-medium">{{ update.author }}</span>
                                        <span>{{ update.published_at }}</span>
                                    </div>
                                    <p class="text-sm text-foreground leading-relaxed">
                                        {{ update.message }}
                                    </p>
                                </div>
                            </div>
                            <p v-else class="text-xs text-muted-foreground">
                                No advisories published for this disaster yet.
                            </p>
                        </div>
                    </CardContent>
                </div>

                <div class="px-6 pb-5 pt-2 flex justify-end">
                    <Button
                        variant="outline"
                        size="sm"
                        @click="viewingDisaster = disaster"
                    >
                        <AlertTriangle class="mr-1.5 h-3.5 w-3.5" />
                        Inspect Full Details &amp; Updates
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
                        <p class="text-sm font-medium">No disaster records found</p>
                        <p class="text-xs text-muted-foreground">
                            Try adjusting your search or filter criteria, or check back later for new reports.
                        </p>
                    </div>
                    <Button variant="outline" size="sm" @click="resetFilters">
                        Reset Filters
                    </Button>
                </div>
            </CardContent>
        </Card>

        <!-- ==========================================================
             Full Disaster & Updates Modal Dialog
        =========================================================== -->
        <Dialog
            :open="!!viewingDisaster"
            @update:open="
                (open) => {
                    if (!open) viewingDisaster = null;
                }
            "
        >
            <DialogContent class="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
                <template v-if="viewingDisaster">
                    <DialogHeader>
                        <div class="flex flex-wrap items-center gap-2 mb-2">
                            <Badge :variant="severityVariant(viewingDisaster.severity)">
                                {{ viewingDisaster.severity }} Severity
                            </Badge>
                            <Badge :variant="statusVariant(viewingDisaster.status)">
                                {{ viewingDisaster.status }}
                            </Badge>
                            <Badge variant="outline">
                                {{ viewingDisaster.disaster_type_name }}
                            </Badge>
                        </div>
                        <DialogTitle class="text-xl">
                            {{ viewingDisaster.title }}
                        </DialogTitle>
                        <DialogDescription>
                            {{ viewingDisaster.municipality_name }} • Occurred {{ viewingDisaster.occurred_at }}
                        </DialogDescription>
                    </DialogHeader>

                    <div class="space-y-4 py-2">
                        <div>
                            <h4 class="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Situation Overview
                            </h4>
                            <p class="text-sm leading-relaxed">
                                {{ viewingDisaster.description || 'No additional description provided.' }}
                            </p>
                        </div>

                        <Separator />

                        <div class="space-y-3">
                            <h4 class="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                <Megaphone class="h-3.5 w-3.5 text-primary" />
                                Published Advisories &amp; Timeline ({{ viewingDisaster.updates.length }})
                            </h4>

                            <div
                                v-if="viewingDisaster.updates.length > 0"
                                class="space-y-3"
                            >
                                <div
                                    v-for="update in viewingDisaster.updates"
                                    :key="update.id"
                                    class="rounded-lg border bg-muted/30 p-3.5 space-y-1.5"
                                >
                                    <div class="flex items-center justify-between text-xs text-muted-foreground">
                                        <span class="font-semibold text-foreground">
                                            {{ update.author }}
                                        </span>
                                        <span>{{ update.published_at }}</span>
                                    </div>
                                    <p class="text-sm leading-relaxed">
                                        {{ update.message }}
                                    </p>
                                </div>
                            </div>
                            <p v-else class="text-xs text-muted-foreground">
                                No updates have been published for this disaster yet.
                            </p>
                        </div>
                    </div>
                </template>
            </DialogContent>
        </Dialog>
    </div>
</template>
