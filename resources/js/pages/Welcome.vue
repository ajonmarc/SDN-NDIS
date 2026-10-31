<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import {
    AlertTriangle,
    ArrowRight,
    Building2,
    Info,
    MapPin,
    Megaphone,
    Radio,
    ShieldCheck,
} from '@lucide/vue';
import { computed } from 'vue';
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

interface DisasterItem {
    id: number;
    title: string;
    description: string | null;
    municipality_name: string;
    disaster_type_name: string;
    severity: string;
    status: string;
    occurred_at: string;
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
    municipality_name: string;
    image: string | null;
    capacity: number;
    current_occupancy: number;
    status: string;
}

withDefaults(
    defineProps<{
        stats?: WelcomeStats;
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
             Real Database Feeds: Disasters, Advisories & Evacuation Centers
        =========================================================== -->
        <div class="mx-auto w-full max-w-7xl flex-1 space-y-12 px-4 py-12 sm:px-6 lg:px-8">
            <!-- 1. Recorded Disasters from Database -->
            <section class="space-y-5">
                <div>
                    <Badge variant="outline" class="mb-2">Disaster Monitoring</Badge>
                    <h2 class="text-2xl font-bold tracking-tight">
                        Latest Recorded Disasters
                    </h2>
                    <p class="text-sm text-muted-foreground">
                        Active and recent disaster events recorded in Surigao del Norte
                    </p>
                </div>

                <div
                    v-if="disasters.length > 0"
                    class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                >
                    <Card
                        v-for="disaster in disasters"
                        :key="disaster.id"
                        class="transition-shadow hover:shadow-md"
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
                            <p class="text-xs text-muted-foreground">
                                Occurred: {{ disaster.occurred_at }}
                            </p>
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
                        Available evacuation centers, current occupancy, and shelter capacities
                    </p>
                </div>

                <div
                    v-if="evacuationCenters.length > 0"
                    class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                >
                    <Card
                        v-for="center in evacuationCenters"
                        :key="center.id"
                        class="overflow-hidden transition-shadow hover:shadow-md"
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
                            <p class="text-xs font-medium text-muted-foreground">
                                Occupancy:
                                <span class="text-foreground">
                                    {{ center.current_occupancy.toLocaleString() }} / {{ center.capacity.toLocaleString() }} persons
                                </span>
                            </p>
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
