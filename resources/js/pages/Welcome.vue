<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import {
    AlertTriangle,
    ArrowRight,
    Building2,
    Globe,
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
    active_disasters: number;
    open_centers: number;
    total_municipalities: number;
    total_updates: number;
}

interface RecentUpdateItem {
    id: number;
    disaster_title: string;
    municipality_name: string;
    message: string;
    published_at: string;
}

withDefaults(
    defineProps<{
        stats?: WelcomeStats;
        recentUpdates?: RecentUpdateItem[];
    }>(),
    {
        stats: () => ({
            active_disasters: 0,
            open_centers: 0,
            total_municipalities: 21,
            total_updates: 0,
        }),
        recentUpdates: () => [],
    }
);

const { isHead, isPdrrmo, isGuest } = useRole();

const homeHref = computed(() => {
    if (isHead.value) return '/head/dashboard';
    if (isPdrrmo.value) return '/pdrrmo/dashboard';
    if (isGuest.value) return '/guest/dashboard';
    return '/';
});

const features = [
    {
        title: 'Interactive GIS Disaster Map',
        description:
            'Visualize active disaster coordinates and evacuation center markers across Mainland Surigao del Norte and Siargao & Bucas Grande Islands.',
        icon: Globe,
    },
    {
        title: 'Evacuation Center Monitoring',
        description:
            'Check real-time shelter capacities, current occupancy counts, facility photos, and operational statuses before evacuating.',
        icon: Building2,
    },
    {
        title: 'Official PDRRMO Advisories',
        description:
            'Receive verified situation updates, severity alerts, and emergency instructions directly from provincial disaster authorities.',
        icon: Megaphone,
    },
    {
        title: 'Province-Wide LGU Coverage',
        description:
            'Unified tracking across Surigao City and all 20 municipalities of Surigao del Norte for rapid disaster response coordination.',
        icon: MapPin,
    },
];
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
             Hero Section
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

                    <!-- Live Telemetry Card Panel -->
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
                                            Real-time SDN-NDIS operational snapshot
                                        </p>
                                    </div>
                                </div>
                                <Badge class="bg-emerald-500/20 text-emerald-300 border-emerald-400/30">
                                    Online
                                </Badge>
                            </div>

                            <div class="grid grid-cols-2 gap-3.5">
                                <div class="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                                    <div class="flex items-center justify-between text-xs text-slate-300">
                                        <span>Active Disasters</span>
                                        <AlertTriangle class="h-4 w-4 text-[#f37f20]" />
                                    </div>
                                    <p class="mt-2 text-2xl font-bold text-white">
                                        {{ stats.active_disasters }}
                                    </p>
                                    <p class="mt-0.5 text-[11px] text-slate-300">
                                        Monitored incidents
                                    </p>
                                </div>

                                <div class="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                                    <div class="flex items-center justify-between text-xs text-slate-300">
                                        <span>Open Shelters</span>
                                        <Building2 class="h-4 w-4 text-[#38e0f5]" />
                                    </div>
                                    <p class="mt-2 text-2xl font-bold text-white">
                                        {{ stats.open_centers }}
                                    </p>
                                    <p class="mt-0.5 text-[11px] text-slate-300">
                                        Ready evacuation centers
                                    </p>
                                </div>

                                <div class="rounded-xl border border-white/10 bg-slate-950/40 p-4">
                                    <div class="flex items-center justify-between text-xs text-slate-300">
                                        <span>Municipalities</span>
                                        <MapPin class="h-4 w-4 text-emerald-400" />
                                    </div>
                                    <p class="mt-2 text-2xl font-bold text-white">
                                        {{ stats.total_municipalities }}
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
                                        {{ stats.total_updates }}
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
             Core Capabilities Section
        =========================================================== -->
        <section class="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div class="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
                <div>
                    <Badge variant="outline" class="mb-2">System Capabilities</Badge>
                    <h2 class="text-2xl font-bold tracking-tight sm:text-3xl">
                        Built for Rapid Disaster Preparedness &amp; Response
                    </h2>
                </div>
                <p class="max-w-xl text-sm text-muted-foreground">
                    Connecting PDRRMO personnel and citizens with accurate geographic data, shelter availability, and verified emergency advisories.
                </p>
            </div>

            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <Card
                    v-for="feature in features"
                    :key="feature.title"
                    class="transition-shadow hover:shadow-md"
                >
                    <CardHeader class="pb-3">
                        <div class="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <component :is="feature.icon" class="h-5 w-5" />
                        </div>
                        <CardTitle class="text-base">{{ feature.title }}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CardDescription class="text-sm leading-relaxed">
                            {{ feature.description }}
                        </CardDescription>
                    </CardContent>
                </Card>
            </div>
        </section>

        <!-- ==========================================================
             Latest Public Advisories Section
        =========================================================== -->
        <section v-if="recentUpdates.length > 0" class="border-t bg-muted/40 py-14">
            <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div class="mb-8 flex items-center justify-between">
                    <div>
                        <Badge variant="secondary" class="mb-2">Latest Bulletins</Badge>
                        <h2 class="text-2xl font-bold tracking-tight">
                            Recent Disaster Updates &amp; Advisories
                        </h2>
                    </div>
                </div>

                <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <Card v-for="update in recentUpdates" :key="update.id">
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
            </div>
        </section>

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
