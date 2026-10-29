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
import { dashboard } from '@/routes/head';

interface HeadDashboardStats {
    total_users: number;
    pdrrmo_count: number;
    guest_count: number;
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

interface RecentUser {
    id: number;
    name: string;
    email: string;
    role_name: string;
    created_at: string;
}

interface RecentAccessLog {
    id: number;
    user_id: number | null;
    user_name: string;
    user_role: string | null;
    event_type: string;
    ip_address: string;
    accessed_at: string;
}

defineProps<{
    stats: HeadDashboardStats;
    recentUsers: RecentUser[];
    recentAccessLogs: RecentAccessLog[];
}>();

const roleVariant = (role: string) => {
    switch (role) {
        case 'PDRRMO':
            return 'default' as const;
        case 'GUEST':
            return 'secondary' as const;
        default:
            return 'outline' as const;
    }
};

const eventVariant = (eventType: string) => {
    switch (eventType) {
        case 'LOGIN':
            return 'default' as const;
        case 'LOGOUT':
            return 'secondary' as const;
        default:
            return 'outline' as const;
    }
};

defineOptions({
    layout: {
        breadcrumbs: [
            {
                href: dashboard(),
                title: 'Dashboard',
            },
        ],
    },
});
</script>

<template>
    <Head title="Head Dashboard" />

    <div class="px-4 py-6">
        <Heading
            title="Head Dashboard"
            description="System-wide executive overview of users, disaster operations, evacuation centers, and audit logs"
        />

        <!-- ==========================================================
             Stat / KPI Cards (from Documentation Pattern)
        =========================================================== -->
        <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <!-- Managed Users -->
            <Card>
                <CardHeader class="pb-2">
                    <CardDescription>Managed Users</CardDescription>
                    <CardTitle class="text-2xl">
                        {{ stats.total_users.toLocaleString() }}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p class="text-xs text-muted-foreground">
                        {{ stats.pdrrmo_count }} PDRRMO staff • {{ stats.guest_count }} Guest accounts
                    </p>
                </CardContent>
            </Card>

            <!-- Active & Recorded Disasters -->
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
                        {{ stats.active_disasters }} active across {{ stats.total_disaster_types }} categories
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
                        {{ stats.open_centers }} open across {{ stats.total_municipalities }} municipalities
                    </p>
                </CardContent>
            </Card>

            <!-- Current Evacuee Occupancy -->
            <Card>
                <CardHeader class="pb-2">
                    <CardDescription>Current Evacuee Occupancy</CardDescription>
                    <CardTitle class="text-2xl">
                        {{ stats.total_occupancy.toLocaleString() }} / {{ stats.total_capacity.toLocaleString() }}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p class="text-xs text-muted-foreground">
                        Combined evacuees vs. total shelter capacity
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

            <!-- System Access Logs -->
            <Card>
                <CardHeader class="pb-2">
                    <CardDescription>System Access Logs</CardDescription>
                    <CardTitle class="text-2xl">
                        {{ stats.total_access_logs.toLocaleString() }}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Badge variant="secondary">Audit active</Badge>
                </CardContent>
            </Card>
        </div>

        <!-- ==========================================================
             Recent System Activity Tables
        =========================================================== -->
        <div class="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <!-- Recent Users -->
            <Card>
                <CardHeader class="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Recent Users</CardTitle>
                        <CardDescription>
                            Latest registered PDRRMO and Guest accounts
                        </CardDescription>
                    </div>
                    <Button as-child variant="outline" size="sm">
                        <Link href="/head/users">Manage Users</Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table v-if="recentUsers.length > 0">
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Joined</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow
                                v-for="user in recentUsers"
                                :key="user.id"
                            >
                                <TableCell>
                                    <div class="font-medium">{{ user.name }}</div>
                                    <div class="text-xs text-muted-foreground">
                                        {{ user.email }}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge :variant="roleVariant(user.role_name)">
                                        {{ user.role_name }}
                                    </Badge>
                                </TableCell>
                                <TableCell class="text-sm text-muted-foreground">
                                    {{ user.created_at }}
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
                            <p class="text-sm font-medium">No users found</p>
                            <p class="text-xs text-muted-foreground">
                                Add PDRRMO or Guest users from User Management.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <!-- Recent Access Logs -->
            <Card>
                <CardHeader class="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Recent Access Logs</CardTitle>
                        <CardDescription>
                            Latest login, logout, and guest visit events
                        </CardDescription>
                    </div>
                    <Button as-child variant="outline" size="sm">
                        <Link href="/pdrrmo/access-logs">View All Logs</Link>
                    </Button>
                </CardHeader>
                <CardContent>
                    <Table v-if="recentAccessLogs.length > 0">
                        <TableHeader>
                            <TableRow>
                                <TableHead>User / Visitor</TableHead>
                                <TableHead>Event</TableHead>
                                <TableHead>IP Address</TableHead>
                                <TableHead>Time</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow
                                v-for="log in recentAccessLogs"
                                :key="log.id"
                            >
                                <TableCell>
                                    <div class="font-medium">{{ log.user_name }}</div>
                                    <div
                                        v-if="log.user_role"
                                        class="text-xs text-muted-foreground"
                                    >
                                        {{ log.user_role }}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge :variant="eventVariant(log.event_type)">
                                        {{ log.event_type }}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <code class="rounded bg-muted px-1.5 py-0.5 text-xs">
                                        {{ log.ip_address }}
                                    </code>
                                </TableCell>
                                <TableCell class="text-xs text-muted-foreground">
                                    {{ log.accessed_at }}
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
                            <p class="text-sm font-medium">No access logs recorded yet</p>
                            <p class="text-xs text-muted-foreground">
                                User logins, logouts, and guest visits will appear here.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
</template>
