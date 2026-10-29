<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
import {
    ArrowLeft,
    Building2,
    Globe,
    Megaphone,
    ShieldCheck,
} from '@lucide/vue';
import AppLogoIcon from '@/components/AppLogoIcon.vue';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { home } from '@/routes';

defineProps<{
    title?: string;
    description?: string;
}>();

const highlights = [
    {
        icon: Globe,
        title: 'GIS Disaster & Shelter Mapping',
        text: 'Pinpoint active incidents and evacuation centers across Surigao del Norte.',
    },
    {
        icon: Building2,
        title: 'Evacuation Capacity Tracking',
        text: 'Monitor live shelter occupancy, facility photos, and operational readiness.',
    },
    {
        icon: Megaphone,
        title: 'Verified PDRRMO Advisories',
        text: 'Timely official emergency bulletins and municipal situation updates.',
    },
];
</script>

<template>
    <div class="relative grid min-h-dvh grid-cols-1 bg-background lg:grid-cols-12">
        <!-- ==========================================================
             Left Brand & Command Showcase Panel (Desktop)
        =========================================================== -->
        <div
            class="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#021824] via-[#033956] to-[#00606f] p-10 text-white lg:col-span-6 lg:flex xl:col-span-7"
        >
            <div
                class="pointer-events-none absolute inset-0 opacity-15"
                style="background-image: radial-gradient(#38e0f5 1px, transparent 1px); background-size: 24px 24px;"
            />

            <!-- Top Brand Bar -->
            <div class="relative z-20 flex items-center justify-between">
                <Link :href="home()" class="flex items-center gap-3">
                    <AppLogoIcon class="size-12 rounded-full object-contain shadow-md" />
                    <div>
                        <span class="text-lg font-bold tracking-tight">
                            SDN-NDIS
                        </span>
                        <p class="text-xs text-cyan-200">
                            Province of Surigao del Norte
                        </p>
                    </div>
                </Link>

                <Badge class="border-white/20 bg-white/10 text-cyan-100">
                    PDRRMO Portal
                </Badge>
            </div>

            <!-- Center Showcase Copy -->
            <div class="relative z-20 my-auto max-w-xl space-y-8 py-12">
                <div class="space-y-4">
                    <h2 class="text-3xl font-extrabold tracking-tight xl:text-4xl leading-tight">
                        Surigao del Norte Natural Disaster
                        <span class="text-[#38e0f5]">Information System</span>
                    </h2>
                    <p class="text-sm text-slate-200 xl:text-base leading-relaxed">
                        Unified web-based disaster monitoring, evacuation center management, and public advisory platform for resilient communities.
                    </p>
                </div>

                <div class="space-y-4">
                    <div
                        v-for="item in highlights"
                        :key="item.title"
                        class="flex items-start gap-3.5 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xs"
                    >
                        <div class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#f37f20]/20 text-[#f37f20]">
                            <component :is="item.icon" class="h-5 w-5" />
                        </div>
                        <div>
                            <h3 class="text-sm font-semibold text-white">
                                {{ item.title }}
                            </h3>
                            <p class="mt-0.5 text-xs text-slate-300">
                                {{ item.text }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer Attribution -->
            <div class="relative z-20 flex items-center justify-between border-t border-white/15 pt-6 text-xs text-slate-300">
                <div class="flex items-center gap-2">
                    <ShieldCheck class="h-4 w-4 text-[#38e0f5]" />
                    <span>Provincial Disaster Risk Reduction &amp; Management Office</span>
                </div>
                <span>Surigao del Norte</span>
            </div>
        </div>

        <!-- ==========================================================
             Right Authentication Form Panel
        =========================================================== -->
        <div
            class="flex flex-col items-center justify-center px-4 py-10 sm:px-6 lg:col-span-6 lg:p-10 xl:col-span-5"
        >
            <div class="w-full max-w-md space-y-6">
                <!-- Back to Home link -->
                <div class="flex items-center justify-between">
                    <Link
                        :href="home()"
                        class="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft class="h-3.5 w-3.5" />
                        Back to Home
                    </Link>

                    <span class="text-xs text-muted-foreground lg:hidden">
                        SDN-NDIS Portal
                    </span>
                </div>

                <Card class="overflow-hidden border shadow-md">
                    <div class="h-1.5 w-full bg-gradient-to-r from-secondary via-primary to-[#f37f20]" />

                    <CardHeader class="space-y-3 pt-7 pb-4 text-center">
                        <Link :href="home()" class="mx-auto inline-flex">
                            <AppLogoIcon class="size-16 rounded-full object-contain shadow-xs" />
                        </Link>

                        <div v-if="title || description" class="space-y-1.5">
                            <CardTitle v-if="title" class="text-xl font-bold tracking-tight">
                                {{ title }}
                            </CardTitle>
                            <CardDescription v-if="description" class="text-sm">
                                {{ description }}
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent class="px-6 pb-8 pt-2 sm:px-8">
                        <slot />
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
</template>
