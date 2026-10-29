<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import { Info } from '@lucide/vue';
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

interface DashboardStats {
    total_disasters: number;
    active_disasters: number;
    critical_disasters: number;
    total_centers: number;
    open_centers: number;
    total_occupancy: number;
    total_capacity: number;
    total_updates: number;
    total_municipalities: number;
    total_disaster_types: number;
    total_access_logs: number;
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
    status: string;
}

defineProps<{
    stats: DashboardStats;
    recentDisasters: RecentDisaster[];
    evacuationCenters: CenterSummary[];
}>();

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
                href: '/pdrrmo/dashboard',
                title: 'Dashboard',
            },
        ],
    },
});
</script>

<template>
    <Head title="PDRRMO Dashboard" />

    <div class="px-4 py-6">
        <Heading
            title="PDRRMO Dashboard"
            description="Overview of Surigao del Norte disaster monitoring, evacuation centers, and emergency updates"
        />

        <!-- ==========================================================
             Stat / KPI Cards (from Documentation Pattern)
        =========================================================== -->
        <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <!-- Total Disasters -->
            <Card>
                <CardHeader class="pb-2">
                    <CardDescription>Total Recorded Disasters</CardDescription>
                    <CardTitle class="text-2xl">
                        {{ stats.total_disasters.toLocaleString() }}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p class="text-xs text-muted-foreground">
                        Across {{ stats.total_disaster_types }} disaster categories
                    </p>
                </CardContent>
            </Card>

            <!-- Active Disasters -->
            <Card>
                <CardHeader class="pb-2">
                    <CardDescription>Active / Monitoring Disasters</CardDescription>
                    <CardTitle class="text-2xl">
                        {{ stats.active_disasters.toLocaleString() }}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Badge
                        v-if="stats.critical_disasters > 0"
                        variant="destructive"
                    >
                        {{ stats.critical_disasters }} High / Critical severity
                    </Badge>
                    <Badge v-else variant="secondary">
                        All situations stable
                    </Badge>
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
                        {{ stats.open_centers }} open and ready for evacuees
                    </p>
                </CardContent>
            </Card>

            <!-- Current Evacuees / Capacity -->
            <Card>
                <CardHeader class="pb-2">
                    <CardDescription>Current Evacuee Occupancy</CardDescription>
                    <CardTitle class="text-2xl">
                        {{ stats.total_occupancy.toLocaleString() }} / {{ stats.total_capacity.toLocaleString() }}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p class="text-xs text-muted-foreground">
                        Total occupants vs. combined center capacity
                    </p>
                </CardContent>
            </Card>

            <!-- Published Disaster Updates -->
            <Card>
                <CardHeader class="pb-2">
                    <CardDescription>Published Disaster Updates</CardDescription>
                    <CardTitle class="text-2xl">
                        {{ stats.total_updates.toLocaleString() }}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p class="text-xs text-muted-foreground">
                        Official situation reports & advisories
                    </p>
                </CardContent>
            </Card>

            <!-- Municipalities & Access Logs -->
            <Card>
                <CardHeader class="pb-2">
                    <CardDescription>Municipalities Covered</CardDescription>
                    <CardTitle class="text-2xl">
                        {{ stats.total_municipalities.toLocaleString() }}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p class="text-xs text-muted-foreground">
                        {{ stats.total_access_logs.toLocaleString() }} system access logs recorded
                    </p>
                </CardContent>
            </Card>
        </div>

        <!-- ==========================================================
             Recent Activity Tables
        =========================================================== -->
        <div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <!-- Recent Disasters -->
            <Card>
                <CardHeader class="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Recent Disasters</CardTitle>
                        <CardDescription>
                            Latest recorded disaster events in Surigao del Norte
                        </CardDescription>
                    </div>
                    <Button as-child variant="outline" size="sm">
                        <Link href="/pdrrmo/disasters">View All</Link>
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
                                Record a disaster event to monitor it here.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <!-- Evacuation Centers Summary -->
            <Card>
                <CardHeader class="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Evacuation Centers</CardTitle>
                        <CardDescription>
                            Recent evacuation centers and occupancy status
                        </CardDescription>
                    </div>
                    <Button as-child variant="outline" size="sm">
                        <Link href="/pdrrmo/evacuation-centers">Manage</Link>
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
                            <p class="text-sm font-medium">No evacuation centers found</p>
                            <p class="text-xs text-muted-foreground">
                                Add evacuation centers to track capacity and occupancy.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
</template>
