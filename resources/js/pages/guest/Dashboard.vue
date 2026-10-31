<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import { Info, MapPin, Megaphone } from '@lucide/vue';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface GuestDashboardStats {
    total_disasters: number;
    active_disasters: number;
    critical_disasters: number;
    total_centers: number;
    open_centers: number;
    total_occupancy: number;
    total_capacity: number;
    available_slots: number;
    total_updates: number;
    total_municipalities: number;
}

interface RecentDisaster {
    id: number;
    title: string;
    municipality_name: string;
    disaster_type_name: string;
    severity: string;
    status: string;
    occurred_at: string;
}

interface CenterSummary {
    id: number;
    center_name: string;
    municipality_name: string;
    capacity: number;
    current_occupancy: number;
    available_slots: number;
    status: string;
}

interface RecentUpdate {
    id: number;
    disaster_title: string;
    municipality_name: string;
    message: string;
    published_at: string;
}

withDefaults(
    defineProps<{
        stats?: GuestDashboardStats;
        recentDisasters?: RecentDisaster[];
        evacuationCenters?: CenterSummary[];
        recentUpdates?: RecentUpdate[];
    }>(),
    {
        stats: () => ({
            total_disasters: 0,
            active_disasters: 0,
            critical_disasters: 0,
            total_centers: 0,
            open_centers: 0,
            total_occupancy: 0,
            total_capacity: 0,
            available_slots: 0,
            total_updates: 0,
            total_municipalities: 0,
        }),
        recentDisasters: () => [],
        evacuationCenters: () => [],
        recentUpdates: () => [],
    }
);

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

defineOptions({
    layout: {
        breadcrumbs: [
            {
                href: '/guest/dashboard',
                title: 'Dashboard',
            },
        ],
    },
});
</script>

<template>
    <Head title="Guest Dashboard" />

    <div class="px-4 py-6">
        <!-- ==========================================================
             Header
        =========================================================== -->
        <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <Heading
                title="Guest Dashboard"
                description="Public overview of Surigao del Norte natural disaster alerts and evacuation center availability"
            />

            <Button as-child>
                <Link href="/guest/map">
                    <MapPin class="mr-2 h-4 w-4" />
                    Open Disaster &amp; Evacuation Map
                </Link>
            </Button>
        </div>

        <!-- ==========================================================
             Stat / KPI Cards (from Documentation Pattern)
        =========================================================== -->
        <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <!-- Recorded Disasters -->
            <Card>
                <CardHeader class="pb-2">
                    <CardDescription>Recorded Disasters</CardDescription>
                    <CardTitle class="text-2xl">
                        {{ stats.total_disasters.toLocaleString() }}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Badge
                        v-if="stats.critical_disasters > 0"
                        variant="destructive"
                    >
                        {{ stats.critical_disasters }} High / Critical active
                    </Badge>
                    <p v-else class="text-xs text-muted-foreground">
                        {{ stats.active_disasters }} currently active or monitored
                    </p>
                </CardContent>
            </Card>

            <!-- Evacuation Centers -->
            <Card>
                <CardHeader class="pb-2">
                    <CardDescription>Evacuation Centers</CardDescription>
                    <CardTitle class="text-2xl">
                        {{ stats.total_centers.toLocaleString() }}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p class="text-xs text-muted-foreground">
                        {{ stats.open_centers }} open shelters available
                    </p>
                </CardContent>
            </Card>

            <!-- Available Shelter Slots -->
            <Card>
                <CardHeader class="pb-2">
                    <CardDescription>Available Shelter Slots</CardDescription>
                    <CardTitle class="text-2xl">
                        {{ stats.available_slots.toLocaleString() }}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p class="text-xs text-muted-foreground">
                        {{ stats.total_occupancy.toLocaleString() }} occupied out of {{ stats.total_capacity.toLocaleString() }} capacity
                    </p>
                </CardContent>
            </Card>

            <!-- Published Disaster Updates -->
            <Card>
                <CardHeader class="pb-2">
                    <CardDescription>Published Advisories</CardDescription>
                    <CardTitle class="text-2xl">
                        {{ stats.total_updates.toLocaleString() }}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p class="text-xs text-muted-foreground">
                        Official PDRRMO situation updates
                    </p>
                </CardContent>
            </Card>

            <!-- Active Alerts Status -->
            <Card>
                <CardHeader class="pb-2">
                    <CardDescription>Active / Monitoring Alerts</CardDescription>
                    <CardTitle class="text-2xl">
                        {{ stats.active_disasters.toLocaleString() }}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Badge v-if="stats.active_disasters > 0" variant="default">
                        Stay alert &amp; follow advisories
                    </Badge>
                    <Badge v-else variant="secondary">
                        No active alerts
                    </Badge>
                </CardContent>
            </Card>

            <!-- Municipalities Covered -->
            <Card>
                <CardHeader class="pb-2">
                    <CardDescription>Municipalities Covered</CardDescription>
                    <CardTitle class="text-2xl">
                        {{ stats.total_municipalities.toLocaleString() }}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p class="text-xs text-muted-foreground">
                        Surigao del Norte cities &amp; municipalities
                    </p>
                </CardContent>
            </Card>
        </div>

        <!-- ==========================================================
             Recent Disasters & Evacuation Centers Tables
        =========================================================== -->
        <div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <!-- Recent Disasters -->
            <Card>
                <CardHeader class="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Recent Disasters</CardTitle>
                        <CardDescription>
                            Latest reported disasters across Surigao del Norte
                        </CardDescription>
                    </div>
                    <Button as-child variant="outline" size="sm">
                        <Link href="/guest/disasters">View All</Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table v-if="recentDisasters.length > 0">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Disaster</TableHead>
                                <TableHead>Municipality</TableHead>
                                <TableHead>Severity</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow
                                v-for="disaster in recentDisasters"
                                :key="disaster.id"
                            >
                                <TableCell>
                                    <div class="font-medium">{{ disaster.title }}</div>
                                    <div class="text-xs text-muted-foreground">
                                        {{ disaster.disaster_type_name }} • {{ disaster.occurred_at }}
                                    </div>
                                </TableCell>
                                <TableCell>{{ disaster.municipality_name }}</TableCell>
                                <TableCell>
                                    <Badge :variant="severityVariant(disaster.severity)">
                                        {{ disaster.severity }}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Badge :variant="disasterStatusVariant(disaster.status)">
                                        {{ disaster.status }}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>

                    <div
                        v-else
                        class="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed py-10 text-center"
                    >
                        <Info class="h-8 w-8 text-muted-foreground" />
                        <div>
                            <p class="text-sm font-medium">No disasters recorded yet</p>
                            <p class="text-xs text-muted-foreground">
                                Active and historical disaster reports will appear here.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <!-- Evacuation Centers -->
            <Card>
                <CardHeader class="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Evacuation Centers</CardTitle>
                        <CardDescription>
                            Shelter locations, occupancy, and available slots
                        </CardDescription>
                    </div>
                    <Button as-child variant="outline" size="sm">
                        <Link href="/guest/evacuation-centers">Browse Centers</Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table v-if="evacuationCenters.length > 0">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Center Name</TableHead>
                                <TableHead>Municipality</TableHead>
                                <TableHead>Occupancy</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow
                                v-for="center in evacuationCenters"
                                :key="center.id"
                            >
                                <TableCell class="font-medium">
                                    {{ center.center_name }}
                                </TableCell>
                                <TableCell>{{ center.municipality_name }}</TableCell>
                                <TableCell>
                                    {{ center.current_occupancy }} / {{ center.capacity }}
                                </TableCell>
                                <TableCell>
                                    <Badge :variant="centerStatusVariant(center.status)">
                                        {{ center.status }}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>

                    <div
                        v-else
                        class="flex flex-col items-center justify-center gap-3 rounded-md border border-dashed py-10 text-center"
                    >
                        <Info class="h-8 w-8 text-muted-foreground" />
                        <div>
                            <p class="text-sm font-medium">No evacuation centers listed</p>
                            <p class="text-xs text-muted-foreground">
                                Designated evacuation shelters will appear here once added.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        <!-- ==========================================================
             Latest Disaster Advisories Section
        =========================================================== -->
        <Card class="mt-6">
            <CardHeader class="flex flex-row items-center justify-between">
                <div>
                    <CardTitle class="flex items-center gap-2">
                        <Megaphone class="h-4 w-4 text-primary" />
                        Latest Disaster Updates &amp; Advisories
                    </CardTitle>
                    <CardDescription>
                        Recent public bulletins and instructions from PDRRMO
                    </CardDescription>
                </div>
                <Button as-child variant="outline" size="sm">
                    <Link href="/guest/disasters">All Updates</Link>
                </Button>
            </CardHeader>
            <CardContent>
                <div
                    v-if="recentUpdates.length > 0"
                    class="grid grid-cols-1 gap-4 md:grid-cols-3"
                >
                    <div
                        v-for="update in recentUpdates"
                        :key="update.id"
                        class="rounded-lg border bg-muted/30 p-4 space-y-2"
                    >
                        <div class="flex items-center justify-between gap-2">
                            <Badge variant="outline">
                                {{ update.municipality_name }}
                            </Badge>
                            <span class="text-xs text-muted-foreground">
                                {{ update.published_at }}
                            </span>
                        </div>
                        <h4 class="text-sm font-semibold">
                            {{ update.disaster_title }}
                        </h4>
                        <p class="line-clamp-3 text-xs text-muted-foreground leading-relaxed">
                            {{ update.message }}
                        </p>
                    </div>
                </div>

                <div
                    v-else
                    class="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed py-8 text-center"
                >
                    <Info class="h-7 w-7 text-muted-foreground" />
                    <p class="text-sm font-medium">No disaster updates published yet</p>
                    <p class="text-xs text-muted-foreground">
                        Official situation updates and advisories will appear here.
                    </p>
                </div>
            </CardContent>
        </Card>
    </div>
</template>
